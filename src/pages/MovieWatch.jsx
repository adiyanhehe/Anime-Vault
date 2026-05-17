import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Calendar, Film, Play, AlertTriangle, Settings, Tv } from 'lucide-react';
import { fetchMediaMeta } from '../api/movies';
import Hls from 'hls.js';

function MovieWatch() {
  const { type, id } = useParams();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [activeServer, setActiveServer] = useState('vidlink');
  const [playerSrc, setPlayerSrc] = useState('');

  // Custom Local HLS Player states
  const [customHlsUrl, setCustomHlsUrl] = useState('');
  const [showPlayerSettings, setShowPlayerSettings] = useState(false);
  const [hlsStatus, setHlsStatus] = useState('idle');
  const [hlsResolvedUrl, setHlsResolvedUrl] = useState('');
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const CORS_PROXIES = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://thingproxy.freeboard.io/fetch/',
    'https://api.codetabs.com/v1/proxy?quest='
  ];

  async function fetchViaProxy(url) {
    for (const proxy of CORS_PROXIES) {
      try {
        const finalUrl = proxy.includes('corsproxy.io') 
          ? proxy + url 
          : proxy + encodeURIComponent(url);
        const res = await fetch(finalUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://vidlink.pro/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: AbortSignal.timeout(10000)
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 100) return text;
        }
      } catch (e) {}
    }
    throw new Error('fetchViaProxy failed');
  }

  /**
   * Primary: Extract m3u8 from VidLink's own page
   * VidLink works perfectly as an iframe. We try to fetch their page
   * and extract the direct video source URL.
   */
  async function resolveFromVidLink(imdbId, isTv, season, episode) {
    const s = season || 1;
    const e = episode || 1;

    const urls = isTv
      ? [
          `https://vidlink.pro/tv/${imdbId}/${s}/${e}`,
          `https://vidlink.pro/api/tv/${imdbId}/${s}/${e}`
        ]
      : [
          `https://vidlink.pro/movie/${imdbId}`,
          `https://vidlink.pro/api/movie/${imdbId}`
        ];

    for (const url of urls) {
      try {
        console.log('[HLS] VidLink fetch:', url);
        const html = await fetchViaProxy(url);

        // Look for any m3u8 URL in the response
        const m3u8Match = html.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
        if (m3u8Match) {
          const found = m3u8Match[0].replace(/&/g, '&');
          console.log('[HLS] Found VidLink m3u8:', found);
          return found;
        }

        // Look for "file" or "src" or "url" in JSON responses
        const jsonMatch = html.match(/"file"\s*:\s*"([^"]+)"/) 
          || html.match(/"src"\s*:\s*"([^"]+)"/) 
          || html.match(/"url"\s*:\s*"([^"]+)"/);
        if (jsonMatch && jsonMatch[1].includes('.m3u8')) {
          const found = jsonMatch[1].replace(/&/g, '&');
          console.log('[HLS] Found VidLink file:', found);
          return found;
        }

        // Look for iframe and follow it
        const iframeMatch = html.match(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/i);
        if (iframeMatch) {
          let playerUrl = iframeMatch[1];
          if (playerUrl.startsWith('//')) playerUrl = 'https:' + playerUrl;
          else if (playerUrl.startsWith('/')) playerUrl = 'https://vidlink.pro' + playerUrl;
          
          const playerHtml = await fetchViaProxy(playerUrl);
          const playerM3u8 = playerHtml.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
          if (playerM3u8) {
            const found = playerM3u8[0].replace(/&/g, '&');
            console.log('[HLS] Found iframe m3u8:', found);
            return found;
          }
        }
      } catch (e) {
        console.log('[HLS] VidLink attempt failed:', url, e.message);
      }
    }
    throw new Error('VidLink resolve failed');
  }

  /**
   * Secondary: Try 2Embed/CloudNestra XPS mirror
   */
  async function resolveFrom2EmbedXps(imdbId, isTv, season, episode) {
    const s = season || 1;
    const e = episode || 1;

    const domains = {
      v1: 'neonhorizonworkshops.com',
      v2: 'wanderlynest.com',
      v3: 'orchidpixelgardens.com',
      v4: 'cloudnestra.com',
      v5: 'cdnstr.com'
    };

    const embedUrls = isTv
      ? [
          `https://www.2embed.cc/embedtv/${imdbId}&s=${s}&e=${e}`,
          `https://vidsrc-embed.ru/embedtv/${imdbId}&s=${s}&e=${e}`
        ]
      : [
          `https://www.2embed.cc/embed/${imdbId}`,
          `https://vidsrc-embed.ru/embed/${imdbId}`
        ];

    for (const embedUrl of embedUrls) {
      try {
        console.log('[HLS] 2Embed fetch:', embedUrl);
        const html = await fetchViaProxy(embedUrl);

        // Direct m3u8 check
        const directM3u8 = html.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
        if (directM3u8) return directM3u8[0].replace(/&/g, '&');

        // Find cloudnestra RCP hash
        const rcpParts = html.match(/cloudnestra\.com\/rcp\/([A-Za-z0-9+/=_-]+)/i);
        if (!rcpParts) continue;

        const rcpHash = rcpParts[1];
        console.log('[HLS] RCP hash:', rcpHash);

        const proHtml = await fetchViaProxy(`https://cloudnestra.com/prorcp/${rcpHash}`);
        const fileMatch = proHtml.match(/file:\s*["']([^"']+?)["']/i);
        if (!fileMatch) continue;

        const mirrors = fileMatch[1].split(' or ');
        
        function resolve(url) {
          return url.replace(/\{(v[1-5])\}/g, (_, k) => domains[k] || 'cloudnestra.com');
        }

        // Pick XPS mirror (cdnstr contains app2)
        for (const m of mirrors) {
          const r = resolve(m.trim());
          if (r.includes('cdnstr') || r.includes('app2') || r.includes('v5')) {
            console.log('[HLS] XPS MIRROR:', r);
            return r;
          }
        }
        // Fallback to last mirror
        if (mirrors.length > 0) {
          const r = resolve(mirrors[mirrors.length - 1].trim());
          console.log('[HLS] Last mirror:', r);
          return r;
        }
      } catch (e) {
        console.log('[HLS] 2Embed failed:', e.message);
      }
    }
    throw new Error('2Embed XPS failed');
  }

  async function resolveRealHlsStream(imdbId, mediaType, season, episode) {
    setHlsStatus('resolving');
    const isTv = mediaType === 'tv' || mediaType === 'series';
    const s = season || 1;
    const e = episode || 1;

    console.log(`[HLS] ⚡ Resolving ${imdbId} S${s}E${e}`);

    // Try VidLink first (most likely to work), then 2Embed XPS
    const strategies = [
      { name: 'VidLink', fn: () => resolveFromVidLink(imdbId, isTv, s, e) },
      { name: '2Embed XPS', fn: () => resolveFrom2EmbedXps(imdbId, isTv, s, e) }
    ];

    for (const { name, fn } of strategies) {
      try {
        console.log(`[HLS] ▶ ${name}`);
        const url = await fn();
        if (url) {
          setHlsResolvedUrl(url);
          setCustomHlsUrl(url);
          setHlsStatus('resolved');
          console.log(`[HLS] ✅ ${name}:`, url);
          return url;
        }
      } catch (e) {
        console.log(`[HLS] ✗ ${name}: ${e.message}`);
      }
    }

    console.error('[HLS] ❌ All strategies failed');
    setHlsStatus('failed');
    // Auto-switch to Server 1 (VidLink) after 2.5s
    setTimeout(() => {
      setActiveServer(prev => prev === 'local_hls' ? 'vidlink' : prev);
    }, 2500);
    return null;
  }

  useEffect(() => {
    loadMeta();
  }, [type, id]);

  useEffect(() => {
    if (meta) {
      const epNum = activeEpisode ? activeEpisode.episode : 1;
      setPlayerSrc(getPlayerUrl(activeServer, type, id, activeSeason, epNum));

      if (activeServer === 'local_hls') {
        setHlsStatus('idle');
        setHlsResolvedUrl('');
        setCustomHlsUrl('');
        setTimeout(() => resolveRealHlsStream(id, type, activeSeason, epNum), 50);
      }
    }
  }, [activeServer, activeSeason, activeEpisode, meta]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (activeServer === 'local_hls' && videoRef.current && customHlsUrl) {
      const video = videoRef.current;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = customHlsUrl;
      } else if (Hls.isSupported()) {
        const hls = new Hls({ maxMaxBufferLength: 30, enableWorker: true, debug: false });
        hlsRef.current = hls;
        hls.loadSource(customHlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, d) => {
          if (d.fatal && d.response?.code === 0) setHlsStatus('failed');
        });
      }
    }
  }, [activeServer, customHlsUrl]);

  function getPlayerUrl(server, mediaType, imdbId, seasonNum, episodeNum) {
    const isSeries = mediaType === 'tv' || mediaType === 'series';
    const s = seasonNum || 1;
    const e = episodeNum || 1;
    if (server === 'autoembed') return isSeries ? `https://www.2embed.cc/embedtv/${imdbId}&s=${s}&e=${e}` : `https://www.2embed.cc/embed/${imdbId}`;
    if (server === 'vidlink') return isSeries ? `https://vidlink.pro/tv/${imdbId}/${s}/${e}` : `https://vidlink.pro/movie/${imdbId}`;
    return '';
  }

  async function loadMeta() {
    setLoading(true);
    const data = await fetchMediaMeta(type, id);
    setMeta(data);
    if (data && (type === 'tv' || type === 'series')) {
      const seasons = {};
      (data.videos || []).forEach(v => { if (v.season !== undefined) { if (!seasons[v.season]) seasons[v.season] = []; seasons[v.season].push(v); } });
      const nums = Object.keys(seasons).map(Number).sort();
      if (nums.length > 0) {
        const fs = nums.find(s => s > 0) || nums[0];
        setActiveSeason(fs);
        const eps = seasons[fs].sort((a, b) => (a.episode || 0) - (b.episode || 0));
        if (eps.length > 0) setActiveEpisode(eps[0]);
      }
    }
    setLoading(false);
  }

  function handleEpisodeClick(ep) {
    setActiveEpisode(ep);
    document.getElementById('watch-player-iframe')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function retryResolver() {
    const epNum = activeEpisode?.episode || 1;
    setHlsStatus('idle');
    setHlsResolvedUrl('');
    setCustomHlsUrl('');
    setTimeout(() => resolveRealHlsStream(id, type, activeSeason, epNum), 50);
  }

  if (loading) return <div className="watch-loading-container"><div className="spinner"/><p>Loading media credentials...</p></div>;
  if (!meta) return (
    <div className="watch-error-container">
      <AlertTriangle size={48} className="error-icon"/>
      <h2>Failed to Load Media</h2>
      <Link to="/dramas-movies" className="btn-back"><ArrowLeft size={16}/> Back</Link>
    </div>
  );

  const seasonsMap = {};
  const isSeries = type === 'tv' || type === 'series';
  if (isSeries && meta.videos) {
    meta.videos.forEach(v => { if (v.season !== undefined) { if (!seasonsMap[v.season]) seasonsMap[v.season] = []; seasonsMap[v.season].push(v); } });
  }
  const seasonNumbers = Object.keys(seasonsMap).map(Number).sort();

  return (
    <div className="watch-detail-container">
      <div className="watch-hero-bg" style={{ backgroundImage: `url(${meta.background})` }}><div className="watch-hero-overlay"/></div>
      <div className="watch-main-layout">
        <Link to="/dramas-movies" className="watch-back-link"><ArrowLeft size={18}/> Back to Movies & Dramas</Link>
        <div className="watch-meta-showcase">
          <div className="showcase-poster">
            <img src={meta.poster || `https://live.metahub.space/poster/medium/${id}/img`} alt={meta.name}
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=300&auto=format&fit=crop'; }}/>
          </div>
          <div className="showcase-details">
            <div className="showcase-badges">
              {meta.imdbRating && <span className="badge-rating"><Star size={14} fill="currentColor"/> {meta.imdbRating}</span>}
              {meta.runtime && <span className="badge-runtime"><Clock size={14}/> {meta.runtime}</span>}
              {meta.releaseInfo && <span className="badge-year"><Calendar size={14}/> {meta.releaseInfo}</span>}
              <span className="badge-type">{isSeries ? 'TV SERIES' : 'MOVIE'}</span>
            </div>
            <h1>{meta.name}</h1>
            {meta.genres?.length > 0 && <div className="showcase-genres">{meta.genres.map(g => <span key={g} className="genre-pill">{g}</span>)}</div>}
            <p className="showcase-synopsis">{meta.description}</p>
          </div>
        </div>

        <div className="watch-player-wrapper">
          <div className="watch-player-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={20} className="glow-icon"/>
              <h2 style={{ fontSize: '1.1rem' }}>Streaming: {isSeries && activeEpisode ? `S${activeSeason} E${activeEpisode.episode}` : meta.name}</h2>
            </div>
            <div className="player-server-selector" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="server-pills-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>SERVER:</span>
                <div className="server-pills" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'vidlink', name: 'Server 1 (VidLink)' },
                    { id: 'autoembed', name: 'Server 2 (2Embed)' },
                    { id: 'local_hls', name: 'Local HLS Player' }
                  ].map(srv => (
                    <button key={srv.id}
                      className={`server-pill-btn ${activeServer === srv.id ? 'active' : ''}`}
                      style={{
                        padding: '4px 10px', fontSize: '0.75rem', fontWeight: '600', borderRadius: '8px',
                        border: '1px solid var(--glass-border)',
                        background: activeServer === srv.id ? 'var(--brand-color)' : 'var(--glass)',
                        color: activeServer === srv.id ? '#000' : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                        boxShadow: activeServer === srv.id ? '0 0 10px var(--brand-color)' : 'none'
                      }}
                      onClick={() => setActiveServer(srv.id)}>{srv.name}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="watch-iframe-container" style={{ position: 'relative', overflow: 'hidden' }}>
            {activeServer === 'local_hls' ? (
              <div className="local-player-wrapper" style={{ width: '100%', minHeight: '400px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {!customHlsUrl && hlsStatus === 'idle' && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                    <Tv size={32} style={{ opacity: 0.3, marginBottom: '10px' }}/>
                    <p>Select this server to begin stream resolution</p>
                  </div>
                )}
                <video ref={videoRef} id="custom-hls-video" controls autoPlay style={{ width: '100%', height: '100%', objectFit: 'contain' }} poster={meta.background || meta.poster}/>
                
                {hlsStatus === 'resolving' && (
                  <div style={{
                    position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(255, 179, 0, 0.15)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 179, 0, 0.35)', padding: '8px 20px', borderRadius: '30px',
                    fontSize: '0.75rem', fontWeight: '600', color: '#ffc107',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 4px 20px rgba(255, 179, 0, 0.15)', zIndex: 8, whiteSpace: 'nowrap'
                  }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#ffc107', borderRadius: '50%', animation: 'pulse 1s infinite' }}/>
                    Scanning sources for <strong>{isSeries && activeEpisode ? `S${activeSeason} E${activeEpisode.episode}` : meta.name}</strong>...
                  </div>
                )}
                
                {hlsStatus === 'resolved' && (
                  <div style={{
                    position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0, 200, 100, 0.12)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(0, 200, 100, 0.3)', padding: '8px 20px', borderRadius: '30px',
                    fontSize: '0.75rem', fontWeight: '600', color: '#00e676',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 4px 20px rgba(0, 200, 100, 0.1)', zIndex: 8, whiteSpace: 'nowrap'
                  }}>
                    <span>✓</span> Stream resolved — playing
                  </div>
                )}
                
                {hlsStatus === 'failed' && (
                  <div style={{
                    position: 'absolute', bottom: '70px', left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(255, 26, 117, 0.12)', backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 26, 117, 0.3)', padding: '8px 20px', borderRadius: '30px',
                    fontSize: '0.75rem', fontWeight: '600', color: '#ff6b9d',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    boxShadow: '0 4px 20px rgba(255, 26, 117, 0.1)', zIndex: 8, whiteSpace: 'nowrap'
                  }}>
                    <span>⚠</span> Could not resolve stream —
                    <button onClick={() => setActiveServer('vidlink')}
                      style={{ background: 'var(--brand-color)', color: '#000', border: 'none', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>
                      Server 1 (VidLink)
                    </button>
                    <button onClick={retryResolver}
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer' }}>
                      Retry
                    </button>
                  </div>
                )}

                <button onClick={() => setShowPlayerSettings(!showPlayerSettings)}
                  style={{
                    position: 'absolute', top: '16px', right: '16px',
                    background: 'rgba(10, 10, 12, 0.75)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 26, 117, 0.3)', borderRadius: '50%', width: '40px', height: '40px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--brand-color)', cursor: 'pointer', zIndex: 10
                  }}>
                  <Settings size={20} className={showPlayerSettings ? 'spin-icon' : ''}/>
                </button>

                {showPlayerSettings && (
                  <div className="player-settings-drawer" style={{
                    position: 'absolute', top: '70px', right: '16px', width: '320px',
                    background: 'rgba(10, 10, 12, 0.9)', backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 10, color: '#fff', animation: 'fadeInUp 0.25s ease'
                  }}>
                    <h3 style={{ fontSize: '0.9rem', margin: '0 0 12px 0', fontWeight: '700', color: 'var(--brand-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tv size={16}/> Stream Resolver
                    </h3>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Direct .m3u8 URL:</label>
                    <input type="text" value={customHlsUrl}
                      onChange={e => setCustomHlsUrl(e.target.value)}
                      placeholder="https://example.com/stream.m3u8"
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', color: '#fff',
                        outline: 'none', width: '100%', marginBottom: '8px'
                      }}/>
                    <button onClick={retryResolver}
                      style={{
                        padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px',
                        border: '1px solid rgba(255, 26, 117, 0.4)', background: 'rgba(255, 26, 117, 0.12)',
                        color: '#ff6b9d', cursor: 'pointer', fontWeight: '600'
                      }}>🔄 Re-resolve</button>
                    {hlsResolvedUrl && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(0,200,100,0.05)', borderRadius: '6px', border: '1px solid rgba(0,200,100,0.15)' }}>
                        <span style={{ fontSize: '0.65rem', color: '#00e676', fontWeight: '600' }}>✓ Resolved:</span>
                        <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', wordBreak: 'break-all' }}>{hlsResolvedUrl}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : playerSrc ? (
              <iframe id="watch-player-iframe" src={playerSrc} title={meta.name}
                allowFullScreen frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="origin-when-cross-origin"/>
            ) : (
              <div style={{
                width: '100%', minHeight: '400px', background: '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem'
              }}>
                <p>Loading player...</p>
              </div>
            )}
          </div>
        </div>

        {isSeries && seasonNumbers.length > 0 && (
          <div className="watch-series-selector">
            <div className="season-tabs-row">
              {seasonNumbers.map(sNum => (
                <button key={sNum} className={`season-tab-btn ${activeSeason === sNum ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSeason(sNum);
                    const sortedEps = seasonsMap[sNum].sort((a,b) => (a.episode||0)-(b.episode||0));
                    if (sortedEps.length > 0) setActiveEpisode(sortedEps[0]);
                  }}>
                  Season {sNum === 0 ? 'Specials' : sNum}
                </button>
              ))}
            </div>
            <div className="episode-selector-grid">
              {activeSeason !== null && seasonsMap[activeSeason]?.sort((a,b) => (a.episode||0)-(b.episode||0)).map(ep => {
                const isActive = activeEpisode?.episode === ep.episode;
                return (
                  <button key={ep.id || ep.episode} className={`episode-card-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleEpisodeClick(ep)}>
                    <div className="ep-card-thumb">
                      <img src={ep.thumbnail || `https://episodes.metahub.space/${id}/${activeSeason}/${ep.episode}/w780.jpg`}
                        alt={ep.title || `E${ep.episode}`}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop'; }}/>
                      <div className="ep-card-overlay"><Play fill="white" size={16}/></div>
                      <span className="ep-card-num">EP {ep.episode}</span>
                    </div>
                    <div className="ep-card-details">
                      <h4>{ep.title || `Episode ${ep.episode}`}</h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieWatch;