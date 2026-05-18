import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Calendar, Film, Play, AlertTriangle, Settings, Tv, Download, Heart } from 'lucide-react';
import { fetchMediaMeta } from '../api/movies';
import CommentsSection from '../components/CommentsSection';
import { useUser } from '../api/UserContext';

function MovieWatch() {
  const { type, id } = useParams();
  const { user, addToHistory, updateContinueWatching, toggleLike, isLiked } = useUser();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [activeServer, setActiveServer] = useState('autoembed');
  const [playerSrc, setPlayerSrc] = useState('');


  function getPlayerUrl(server, mediaType, id, seasonNum, episodeNum) {
    const isSeries = mediaType === 'tv' || mediaType === 'series';
    const s = seasonNum || 1;
    const e = episodeNum || 1;
    const isImdb = id.startsWith('tt');
    const param = isImdb ? `imdb=${id}` : `tmdb=${id}`;

    if (server === 'autoembed') {
      return isSeries
        ? `https://vidsrc-embed.ru/embed/tv?${param}&season=${s}&episode=${e}&autoplay=1&autonext=1`
        : `https://vidsrc-embed.ru/embed/movie?${param}&autoplay=1`;
    }
    if (server === '2embed') {
      return isSeries
        ? `https://www.2embed.cc/embedtv/${id}?s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${id}`;
    }
    if (server === 'multiembed') {
      const tmdbFlag = isImdb ? '0' : '1';
      return isSeries
        ? `https://multiembed.mov/?video_id=${id}&tmdb=${tmdbFlag}&s=${s}&e=${e}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=${tmdbFlag}`;
    }
    return '';
  }

  useEffect(() => {
    loadMeta();
  }, [id, type]);

  useEffect(() => {
    const url = getPlayerUrl(activeServer, type, id, activeSeason, activeEpisode?.episode);
    if (playerSrc !== url) {
      setPlayerSrc(url);
    }
  }, [activeServer, activeEpisode, id, type, activeSeason]);

  // Sync watch history to Neon Postgres when user logs in or meta loads
  useEffect(() => {
    if (user && meta) {
      addToHistory(id, type, meta.name || meta.title, meta.poster_path ? `https://image.tmdb.org/t/p/w500${meta.poster_path}` : '');
    }
  }, [user, meta, id, type]);

  // Sync Continue Watching to Neon Postgres when active season/episode changes
  useEffect(() => {
    if (user && meta) {
      const poster = meta.poster_path ? `https://image.tmdb.org/t/p/w500${meta.poster_path}` : '';
      updateContinueWatching(
        id, 
        type, 
        meta.name || meta.title, 
        poster, 
        activeSeason || 1, 
        activeEpisode?.episode || 1,
        0, // progress not tracked on standard embedding
        0  // duration not tracked on standard embedding
      );
    }
  }, [user, meta, activeSeason, activeEpisode]);

  async function loadMeta() {
    setLoading(true);
    const data = await fetchMediaMeta(type, id);
    if (data && data.videos) {
      data.videos = data.videos.map(v => ({
        ...v,
        episode: v.number !== undefined ? v.number : v.episode
      }));
    }
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


  if (loading) return <div className="watch-loading-container"><div className="spinner" /><p>Loading media credentials...</p></div>;
  if (!meta) return (
    <div className="watch-error-container">
      <AlertTriangle size={48} className="error-icon" />
      <h2>Failed to Load Media</h2>
      <Link to="/dramas-movies" className="btn-back"><ArrowLeft size={16} /> Back</Link>
    </div>
  );

  const seasonsMap = {};
  const isSeries = type === 'tv' || type === 'series';
  if (isSeries && meta.videos) {
    meta.videos.forEach(v => { if (v.season !== undefined) { if (!seasonsMap[v.season]) seasonsMap[v.season] = []; seasonsMap[v.season].push(v); } });
  }
  const seasonNumbers = Object.keys(seasonsMap).map(Number).sort();

  const isImdb = id.startsWith('tt');
  const sNum = activeSeason || 1;
  const eNum = activeEpisode?.episode || 1;
  const downloadUrls = {
    twoembed: isSeries
      ? `https://www.2embed.cc/download/tv/${id}/${sNum}/${eNum}`
      : `https://www.2embed.cc/download/movie/${id}`,
    vidlink: isSeries
      ? `https://vidlink.pro/download/tv/${id}/${sNum}/${eNum}?primaryColor=ff1a75`
      : `https://vidlink.pro/download/movie/${id}?primaryColor=ff1a75`
  };

  return (
    <div className="watch-detail-container">
      <div className="watch-hero-bg" style={{ backgroundImage: `url(${meta.background})` }}><div className="watch-hero-overlay" /></div>
      <div className="watch-main-layout">
        <Link to="/dramas-movies" className="watch-back-link"><ArrowLeft size={18} /> Back to Movies & Dramas</Link>
        <div className="watch-meta-showcase">
          <div className="showcase-poster">
            <img src={meta.poster || `https://live.metahub.space/poster/medium/${id}/img`} alt={meta.name}
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=300&auto=format&fit=crop'; }} />
          </div>
          <div className="showcase-details">
            <div className="showcase-badges">
              {meta.imdbRating && <span className="badge-rating"><Star size={14} fill="currentColor" /> {meta.imdbRating}</span>}
              {meta.runtime && <span className="badge-runtime"><Clock size={14} /> {meta.runtime}</span>}
              {meta.releaseInfo && <span className="badge-year"><Calendar size={14} /> {meta.releaseInfo}</span>}
              <span className="badge-type">{isSeries ? 'TV SERIES' : 'MOVIE'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <h1 style={{ margin: 0 }}>{meta.name}</h1>
              <button 
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '6px 14px', fontSize: '0.8rem', fontWeight: '800', borderRadius: '10px',
                  color: isLiked(id, type) ? '#ff1a75' : 'var(--text-secondary)',
                  borderColor: isLiked(id, type) ? '#ff1a75' : 'var(--glass-border)',
                  background: isLiked(id, type) ? 'rgba(255, 26, 117, 0.1)' : 'var(--glass)',
                  border: '1px solid',
                  boxShadow: isLiked(id, type) ? '0 0 10px rgba(255, 26, 117, 0.2)' : 'none',
                  transition: 'all 0.2s ease', cursor: 'pointer'
                }}
                onClick={() => {
                  const poster = meta.poster_path ? `https://image.tmdb.org/t/p/w500${meta.poster_path}` : '';
                  toggleLike(id, type, meta.name || meta.title, poster);
                }}
              >
                <Heart size={16} fill={isLiked(id, type) ? '#ff1a75' : 'none'} />
                {isLiked(id, type) ? 'Liked' : 'Like'}
              </button>
            </div>
            {meta.genres?.length > 0 && <div className="showcase-genres" style={{ marginTop: 0 }}>{meta.genres.map(g => <span key={g} className="genre-pill">{g}</span>)}</div>}
            <p className="showcase-synopsis">{meta.description}</p>
          </div>
        </div>

        <div className="watch-player-wrapper">
          <div className="watch-player-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={20} className="glow-icon" />
              <h2 style={{ fontSize: '1.1rem' }}>Streaming: {isSeries && activeEpisode ? `S${activeSeason} E${activeEpisode.episode}` : meta.name}</h2>
            </div>
            <div className="player-server-selector" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="server-pills-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>SERVER:</span>
                <div className="server-pills" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'autoembed', name: 'Server 1 (VidSrc)' },
                    { id: '2embed', name: 'Server 2 (2Embed)' },
                    { id: 'multiembed', name: 'Server 3 (MultiEmbed)' }
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
              <div className="download-mirrors-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'bold' }}>DOWNLOAD:</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <a href={downloadUrls.twoembed} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', fontSize: '0.72rem', fontWeight: '800', borderRadius: '8px',
                      border: '1px solid rgba(236, 72, 153, 0.4)',
                      background: 'rgba(236, 72, 153, 0.08)', color: '#ec4899',
                      textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: '0 0 8px rgba(236, 72, 153, 0.1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(236, 72, 153, 0.18)';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(236, 72, 153, 0.08)';
                      e.currentTarget.style.boxShadow = '0 0 8px rgba(236, 72, 153, 0.1)';
                    }}>
                    <Download size={12} /> 2Embed
                  </a>
                  <a href={downloadUrls.vidlink} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px', fontSize: '0.72rem', fontWeight: '800', borderRadius: '8px',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      background: 'rgba(6, 182, 212, 0.08)', color: '#06b6d4',
                      textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: '0 0 8px rgba(6, 182, 212, 0.1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.18)';
                      e.currentTarget.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)';
                      e.currentTarget.style.boxShadow = '0 0 8px rgba(6, 182, 212, 0.1)';
                    }}>
                    <Download size={12} /> VidLink
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="watch-iframe-container" style={{ position: 'relative', overflow: 'hidden' }}>
            {playerSrc ? (
              <iframe id="watch-player-iframe" key={playerSrc} src={playerSrc} title={meta.name}
                allowFullScreen frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="origin-when-cross-origin" />
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

          {/* ⚡ HIGHLY NOTICEABLE ERROR RESOLUTION BANNER */}
          <div style={{
            marginTop: '12px',
            padding: '16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(255, 26, 117, 0.15) 0%, rgba(255, 26, 117, 0.05) 100%)',
            border: '2px solid rgba(255, 26, 117, 0.4)',
            boxShadow: '0 0 30px rgba(255, 26, 117, 0.2), inset 0 0 40px rgba(255, 26, 117, 0.03)',
            fontSize: '0.9rem',
            color: '#ff6b9d',
            fontWeight: '700',
            textAlign: 'center',
            lineHeight: '1.7',
            animation: 'pulse-glow 2s ease-in-out infinite'
          }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            {' '}If the player shows an error, try switching to{' '}
            <strong style={{
              color: '#000',
              background: 'var(--brand-color)',
              padding: '2px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>Server 1 (VidSrc)</strong>
            {' '}or{' '}
            <strong style={{
              color: '#000',
              background: 'var(--brand-color)',
              padding: '2px 12px',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}>Server 2 (2Embed)</strong>
          </div>
        </div>

        {isSeries && seasonNumbers.length > 0 && (
          <div className="watch-series-selector">
            <div className="season-tabs-row">
              {seasonNumbers.map(sNum => (
                <button key={sNum} className={`season-tab-btn ${activeSeason === sNum ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSeason(sNum);
                    const sortedEps = seasonsMap[sNum].sort((a, b) => (a.episode || 0) - (b.episode || 0));
                    if (sortedEps.length > 0) setActiveEpisode(sortedEps[0]);
                  }}>
                  Season {sNum === 0 ? 'Specials' : sNum}
                </button>
              ))}
            </div>
            <div className="episode-selector-grid">
              {activeSeason !== null && seasonsMap[activeSeason]?.sort((a, b) => (a.episode || 0) - (b.episode || 0)).map(ep => {
                const isActive = activeEpisode?.episode === ep.episode;
                return (
                  <button key={ep.id || ep.episode} className={`episode-card-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleEpisodeClick(ep)}>
                    <div className="ep-card-thumb">
                      <img src={ep.thumbnail || `https://episodes.metahub.space/${id}/${activeSeason}/${ep.episode}/w780.jpg`}
                        alt={ep.title || `E${ep.episode}`}
                        onError={e => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop'; }} />
                      <div className="ep-card-overlay"><Play fill="white" size={16} /></div>
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
        
        <CommentsSection mediaId={id} />
      </div>
    </div>
  );
}

export default MovieWatch;