import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeById, stripHtml } from '../api/anilist';
import { findBestStreamingMatch, fetchStreamingEpisodes, fetchStreamingSources, probeMirrors } from '../api/streaming';
import VideoPlayer from '../components/VideoPlayer';
import {
  Play,
  Calendar,
  Star,
  ExternalLink,
  Tv,
  Users,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Plus,
  RefreshCw,
  ChevronDown,
  Zap,
} from 'lucide-react';

const PROGRESS_KEY = 'animevault_progress';
const RECENTS_KEY = 'animevault_recently_viewed';

function safeTitle(title) {
  if (!title) return 'Unknown Title';
  return title.romaji || title.english || title.native || 'Unknown Title';
}

/** Build an instant episode list from AniList metadata — no scraper needed */
function buildEpisodeList(media) {
  // For airing shows, nextAiringEpisode.episode - 1 = last aired episode
  let count = media.episodes;
  if (media.nextAiringEpisode?.episode) {
    count = media.nextAiringEpisode.episode - 1;
  }
  if (!count || count <= 0) count = media.format === 'MOVIE' ? 1 : 12;

  return Array.from({ length: count }, (_, i) => ({
    id: `ep-${media.id}-${i + 1}`,
    number: i + 1,
    title: `Episode ${i + 1}`,
    // will be enriched by consumet in background
  }));
}

/** Extract external IDs from AniList externalLinks */
function findExternalId(links, siteName) {
  if (!links) return null;
  const link = links.find(l => l.site.toLowerCase().includes(siteName.toLowerCase()));
  if (!link) return null;
  
  // Extract ID from URL
  const url = link.url;
  if (siteName.toLowerCase().includes('themoviedb')) {
    const match = url.match(/\/(tv|movie)\/(\d+)/);
    return match ? match[2] : null;
  }
  if (siteName.toLowerCase().includes('imdb')) {
    const match = url.match(/\/title\/(tt\d+)/);
    return match ? match[1] : null;
  }
  
  return url.split('/').filter(Boolean).pop();
}

// ─────────────────────────────────────────────────────────
// Server definitions — each entry: { key, label, build }
// build(params) returns the embed URL string
// ─────────────────────────────────────────────────────────
const SERVERS = [
  {
    key: 'VidLink',
    label: 'Server 1 · VidLink Sub (Fastest)',
    build: ({ malId, tmdbId, ep }) => {
      if (malId) return `https://vidlink.pro/anime/${malId}/${ep}/sub?primaryColor=ff1a75&nextbutton=true`;
      if (tmdbId) return `https://vidlink.pro/tv/${tmdbId}/1/${ep}?primaryColor=ff1a75&nextbutton=true`;
      return null;
    },
  },
  {
    key: 'VidLinkDub',
    label: 'Server 2 · VidLink Dub',
    build: ({ malId, tmdbId, ep }) => {
      if (malId) return `https://vidlink.pro/anime/${malId}/${ep}/dub?primaryColor=ff1a75&nextbutton=true`;
      if (tmdbId) return `https://vidlink.pro/tv/${tmdbId}/1/${ep}?primaryColor=ff1a75&nextbutton=true`;
      return null;
    },
  },
  {
    key: 'VidsrcICU',
    label: 'Server 3 · Vidsrc.icu Sub (AniList)',
    build: ({ anilistId, ep }) => `https://vidsrc.icu/embed/anime/${anilistId}/${ep}/0`,
  },
  {
    key: 'VidsrcICUDub',
    label: 'Server 4 · Vidsrc.icu Dub (AniList)',
    build: ({ anilistId, ep }) => `https://vidsrc.icu/embed/anime/${anilistId}/${ep}/1`,
  },
  {
    key: 'VidsrcCC',
    label: 'Server 5 · Vidsrc.cc',
    build: ({ malId, tmdbId, ep }) =>
      tmdbId
        ? `https://vidsrc.cc/v2/embed/tv/${tmdbId}/1/${ep}`
        : malId
        ? `https://vidsrc.cc/v2/embed/anime/${malId}/${ep}`
        : null,
  },
  {
    key: 'VidsrcNL',
    label: 'Server 6 · Vidsrc.nl',
    build: ({ malId, ep }) => malId ? `https://vidsrc.nl/embed/anime/${malId}/${ep}` : null,
  },
  {
    key: 'VidsrcDev',
    label: 'Server 7 · Vidsrc.dev (TMDB)',
    build: ({ tmdbId, ep }) => tmdbId ? `https://vidsrc.dev/embed/tv/${tmdbId}/1/${ep}` : null,
  },
  {
    key: 'MultiEmbed',
    label: 'Server 8 · MultiEmbed (TMDB)',
    build: ({ tmdbId, imdbId, malId, ep }) => {
      if (tmdbId) return `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=1&e=${ep}`;
      if (imdbId) return `https://multiembed.mov/?video_id=${imdbId}&tmdb=1&s=1&e=${ep}`;
      return `https://multiembed.mov/?video_id=${malId}&tmdb=0&s=1&e=${ep}`;
    },
  },
  {
    key: 'VidsrcIN',
    label: 'Server 9 · Vidsrc.in',
    build: ({ malId, ep }) => malId ? `https://vidsrc.in/embed/anime/${malId}/${ep}` : null,
  },
  {
    key: 'Smashy',
    label: 'Server 10 · SmashyStream',
    build: ({ tmdbId, imdbId, ep }) => 
      tmdbId 
        ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=1&episode=${ep}` 
        : imdbId 
        ? `https://embed.smashystream.com/playere.php?imdb=${imdbId}&season=1&episode=${ep}`
        : null,
  },
  {
    key: 'VidsrcSU',
    label: 'Server 11 · Vidsrc.su',
    build: ({ malId, ep }) => malId ? `https://vidsrc.su/embed/anime/${malId}/${ep}` : null,
  },
  {
    key: 'VidsrcPM',
    label: 'Server 12 · Vidsrc.pm',
    build: ({ malId, ep }) => malId ? `https://vidsrc.pm/embed/anime/${malId}/${ep}` : null,
  },
  {
    key: 'AniWave',
    label: 'Server 13 · AniWave Mirror (Stable)',
    build: ({ malId, ep }) => malId ? `https://aniwaves.ru/embed/${malId}/${ep}` : null,
  },
  {
    key: 'Native',
    label: 'Server 14 · Native Scraper (Slow)',
    build: () => null, // handled via videoSources
  },
];

const DEFAULT_SERVER = 'VidLink';

function AnimeDetails() {
  const { id } = useParams();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [zenMode, setZenMode] = useState(false);
  const [progress, setProgress] = useState(() =>
    JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')
  );

  // Player state
  const [activeServer, setActiveServer] = useState(DEFAULT_SERVER);
  const [videoSources, setVideoSources] = useState([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerStatus, setPlayerStatus] = useState(''); // info/warning messages

  // Consumet enrichment (background)
  const [streamingInfo, setStreamingInfo] = useState({ id: null, provider: 'gogoanime' });
  const consumetLoadedRef = useRef(false); // prevent double-fetch

  // Episode page/chunk for large episode lists
  const [epPage, setEpPage] = useState(0);
  const EP_PAGE_SIZE = 100;

  // ───── Probe mirrors once per session (fire-and-forget) ─────
  useEffect(() => {
    probeMirrors().catch(() => {});
  }, []);

  // ───── Main data load ─────
  useEffect(() => {
    consumetLoadedRef.current = false;
    setAnime(null);
    setEpisodes([]);
    setCurrentEpisode(null);
    setVideoSources([]);
    setPlayerStatus('');
    setActiveServer(DEFAULT_SERVER);
    setEpPage(0);

    async function load() {
      const safetyTimer = setTimeout(() => setLoading(false), 12000);
      try {
        setLoading(true);
        setError('');

        const media = await fetchAnimeById(id);
        if (!media) {
          setError('Anime not found.');
          return;
        }

        setAnime(media);

        // ── Instantly build episode list from AniList metadata ──
        const epList = buildEpisodeList(media);
        setEpisodes(epList);

        // Resume from last watched episode, else start at 1
        const lastWatched = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')[media.id];
        const startEp = epList.find(e => e.number === lastWatched) || epList[0];
        setCurrentEpisode(startEp || null);

        // Done — page is interactive immediately
        setLoading(false);
        clearTimeout(safetyTimer);

        // ── Recently viewed ──
        const recents = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
        const updated = [
          { id: media.id, title: safeTitle(media.title), image: media.coverImage?.large },
          ...recents.filter(r => r.id !== media.id),
        ].slice(0, 10);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));

        // ── Background: Consumet enrichment ──
        enrichWithConsumer(media, epList).catch(() => {});
      } catch (err) {
        setError(err.message || 'Failed to load anime details.');
      } finally {
        setLoading(false);
      }
    }

    load();
    window.scrollTo(0, 0);
  }, [id]);

  /** Fire-and-forget: try to replace episode list with richer consumet data */
  async function enrichWithConsumer(media, fallbackEps) {
    if (consumetLoadedRef.current) return;
    consumetLoadedRef.current = true;

    const titleStr = safeTitle(media.title);
    try {
      const match = await findBestStreamingMatch(titleStr, media.seasonYear, media.title?.english);
      if (!match) return;

      setStreamingInfo(match);
      const richEps = await fetchStreamingEpisodes(match.id, match.provider);
      if (!richEps || richEps.length === 0) return;

      // Merge titles/thumbnails from scraper into our episode list
      setEpisodes(prev => {
        const byNumber = {};
        richEps.forEach(e => { byNumber[e.number] = e; });
        return prev.map(ep => ({
          ...ep,
          scraperId: byNumber[ep.number]?.id || null,
          title: byNumber[ep.number]?.title || ep.title,
          image: byNumber[ep.number]?.image || null,
        }));
      });
    } catch (_) {
      // Consumet failed silently — users still have embed servers
    }
  }

  // ───── Load native stream sources (only for "Native" server) ─────
  async function loadNativeSources(ep) {
    if (!ep?.scraperId) {
      setPlayerStatus('Native sources not available. Switch to another server.');
      setVideoSources([]);
      return;
    }
    setPlayerLoading(true);
    setPlayerStatus('');
    try {
      const sources = await fetchStreamingSources(ep.scraperId, streamingInfo.provider);
      if (sources?.length) {
        setVideoSources(sources);
      } else {
        setPlayerStatus('No native sources. Try another server.');
      }
    } catch {
      setPlayerStatus('Native source fetch failed. Try another server.');
    } finally {
      setPlayerLoading(false);
    }
  }

  // ───── Episode selection ─────
  function selectEpisode(ep) {
    setCurrentEpisode(ep);
    setVideoSources([]);
    setPlayerStatus('');

    const updated = { ...progress, [anime.id]: ep.number };
    setProgress(updated);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));

    if (activeServer === 'Native') {
      loadNativeSources(ep);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // When server changes to Native, try to load sources
  useEffect(() => {
    if (activeServer === 'Native' && currentEpisode) {
      loadNativeSources(currentEpisode);
    }
  }, [activeServer]);

  // ───── Compute embed URL for current episode + server ─────
  function getEmbedUrl() {
    if (!anime || !currentEpisode) return null;
    if (activeServer === 'Native') return null;

    const server = SERVERS.find(s => s.key === activeServer);
    if (!server) return null;

    const tmdbId = findExternalId(anime.externalLinks, 'themoviedb');
    const imdbId = findExternalId(anime.externalLinks, 'imdb');

    return server.build({
      anilistId: id,
      malId: anime.idMal,
      tmdbId,
      imdbId,
      ep: currentEpisode.number,
      season: 1,
    });
  }

  // ───── Episode pagination ─────
  const totalPages = Math.ceil(episodes.length / EP_PAGE_SIZE);
  const visibleEpisodes = episodes.slice(epPage * EP_PAGE_SIZE, (epPage + 1) * EP_PAGE_SIZE);

  // ───── Render ─────
  if (loading) return (
    <div className="status-container">
      <div className="spinner" />
      <p>Loading anime details...</p>
    </div>
  );

  if (error) return (
    <div className="status-container">
      <AlertCircle size={48} color="var(--brand-color)" />
      <p className="error">{error}</p>
      <Link to="/" className="btn-play-v2">Back to Home</Link>
    </div>
  );

  const animeTitle = safeTitle(anime.title);
  const embedUrl = getEmbedUrl();

  return (
    <div className="details-page-v2">

      {/* ── Video Player ── */}
      <div className="player-section-v2">
        {currentEpisode ? (
          <VideoPlayer
            sources={activeServer === 'Native' ? videoSources : []}
            poster={anime.bannerImage || anime.coverImage?.extraLarge}
            title={`${animeTitle} · EP ${currentEpisode.number}`}
            embedUrl={embedUrl}
            isZen={zenMode}
          />
        ) : (
          <div className="video-player-error">
            <PlayCircle size={48} className="spin" />
            <p>No episodes available yet.</p>
          </div>
        )}

        {/* Player status message */}
        {playerStatus && (
          <div className="player-status-bar">
            <AlertCircle size={14} />
            <span>{playerStatus}</span>
          </div>
        )}

        {/* ── Server Selector ── */}
        {currentEpisode && (
          <div className="server-selector-v2">
            <div className="server-info">
              <Tv size={20} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ margin: 0 }}>Streaming Server</h4>
                  <button 
                    className={`zen-toggle-v2 ${zenMode ? 'active' : ''}`}
                    onClick={() => setZenMode(!zenMode)}
                    title={zenMode ? 'Turn off Ad-Blocker' : 'Turn on Ad-Blocker (Zen Mode)'}
                  >
                    <Zap size={14} fill={zenMode ? 'currentColor' : 'none'} />
                    {zenMode ? 'Zen Mode ON' : 'Zen Mode OFF'}
                  </button>
                </div>
                <p>Switch servers if one is not working. AniWave and VidLink are recommended.</p>
              </div>
            </div>

            <div className="server-controls">
              <select
                className="server-dropdown-v2"
                value={activeServer}
                onChange={e => setActiveServer(e.target.value)}
              >
                {SERVERS.map(s => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>

              <button
                onClick={() => setActiveServer('AniWave')}
                className={`server-external-btn ${activeServer === 'AniWave' ? 'active' : ''}`}
              >
                <Sparkles size={14} /> AniWave Mirror
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Hero Banner ── */}
      <div className="detail-hero-v2">
        <img
          className="detail-banner-v2"
          src={anime.bannerImage || anime.coverImage?.extraLarge}
          alt=""
        />
        <div className="detail-hero-overlay-v2" />

        <div className="detail-hero-content-v2">
          <img
            className="detail-poster-v2"
            src={anime.coverImage?.large}
            alt={animeTitle}
          />
          <div className="detail-info-v2">
            <div className="detail-meta-v2">
              <span className="score"><Star size={16} fill="currentColor" /> {anime.averageScore}%</span>
              <span><Tv size={16} /> {anime.format}</span>
              <span><Users size={16} /> {anime.status}</span>
              {anime.seasonYear && <span><Calendar size={16} /> {anime.seasonYear}</span>}
              {anime.nextAiringEpisode && (
                <span style={{ color: 'var(--brand-color)' }}>
                  EP {anime.nextAiringEpisode.episode} airing soon
                </span>
              )}
            </div>
            <h1 className="detail-title-v2">{animeTitle}</h1>
            <div className="detail-actions-v2">
              <button
                className="btn-play-v2"
                onClick={() => {
                  if (episodes.length > 0) selectEpisode(episodes[0]);
                }}
              >
                <Play size={20} fill="currentColor" /> Watch Now
              </button>
              <button className="btn-info-v2">
                <Plus size={20} /> Add to List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className={`detail-layout-v2 ${zenMode ? 'zen-layout' : ''}`}>
        {/* ── Main Content ── */}
        <div className="main-content-v2">

          {/* Synopsis */}
          {!zenMode && (
            <div className="details-section-v2">
              <h2>Synopsis</h2>
              <p>{stripHtml(anime.description)}</p>
            </div>
          )}

          {/* Seasons & Relations */}
          {!zenMode && anime.relations?.nodes?.length > 0 && (() => {
            const SHOW_TYPES = ['PREQUEL', 'SEQUEL', 'PARENT', 'SIDE_STORY', 'SUMMARY'];
            const filtered = anime.relations.nodes
              .map((rel, i) => ({ rel, type: anime.relations.edges[i]?.relationType }))
              .filter(({ type }) => SHOW_TYPES.includes(type));
            if (!filtered.length) return null;
            return (
              <div className="details-section-v2">
                <h2>Seasons & Related</h2>
                <div className="relations-grid-v2">
                  {filtered.map(({ rel, type }) => (
                    <Link key={rel.id} to={`/anime/${rel.id}`} className="relation-card-v2">
                      <div className="relation-image">
                        <img src={rel.coverImage?.large} alt={safeTitle(rel.title)} />
                        <span className="relation-type">{type.replace('_', ' ')}</span>
                      </div>
                      <div className="relation-info">
                        <h4>{safeTitle(rel.title)}</h4>
                        <span>{rel.format} · {rel.status}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Episodes */}
          {!zenMode && (
            <div className="details-section-v2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>
                  Episodes
                  <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    ({episodes.length})
                  </span>
                </h2>

                {/* Episode page selector for long shows */}
                {totalPages > 1 && (
                  <div className="ep-page-selector">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`ep-page-btn ${epPage === i ? 'active' : ''}`}
                        onClick={() => setEpPage(i)}
                      >
                        {i * EP_PAGE_SIZE + 1}–{Math.min((i + 1) * EP_PAGE_SIZE, episodes.length)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="episodes-container-v2">
                {visibleEpisodes.length > 0 ? (
                  <div className="episodes-grid-v2">
                    {visibleEpisodes.map(ep => (
                      <button
                        key={ep.id}
                        className={`episode-btn-v2 ${currentEpisode?.id === ep.id ? 'active' : ''} ${progress[anime.id] >= ep.number ? 'watched' : ''}`}
                        onClick={() => selectEpisode(ep)}
                      >
                        <span className="episode-label">EP</span>
                        <span className="episode-number">{ep.number}</span>
                        {progress[anime.id] >= ep.number && <CheckCircle2 size={12} className="check" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>No episodes available for this title yet.</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ── Sidebar ── */}
        {!zenMode && (
          <aside className="sidebar-v2">
            <div className="sidebar-block-v2">
              <h3>Details</h3>
              <div className="info-list-v2">
                <div className="info-row-v2">
                  <span className="info-label-v2">Native Title</span>
                  <span className="info-value-v2">{anime.title?.native}</span>
                </div>
                <div className="info-row-v2">
                  <span className="info-label-v2">Studios</span>
                  <span className="info-value-v2">{anime.studios?.nodes?.map(n => n.name).join(', ')}</span>
                </div>
                <div className="info-row-v2">
                  <span className="info-label-v2">Episodes</span>
                  <span className="info-value-v2">
                    {anime.nextAiringEpisode
                      ? `${anime.nextAiringEpisode.episode - 1} aired / ${anime.episodes || '?'} total`
                      : anime.episodes || 'Unknown'}
                  </span>
                </div>
                <div className="info-row-v2">
                  <span className="info-label-v2">Source</span>
                  <span className="info-value-v2">{anime.source}</span>
                </div>
                <div className="info-row-v2">
                  <span className="info-label-v2">Genres</span>
                  <div className="genre-tags-v2">
                    {anime.genres?.map(g => (
                      <Link key={g} to={`/search?genre=${g}`} className="genre-tag-v2">{g}</Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {anime.recommendations?.nodes?.length > 0 && (
              <div className="sidebar-block-v2">
                <h3>Recommendations</h3>
                <div className="related-grid-v2">
                  {anime.recommendations.nodes.slice(0, 5).map(rec => {
                    const m = rec.mediaRecommendation;
                    if (!m) return null;
                    return (
                      <Link key={m.id} to={`/anime/${m.id}`} className="related-card-v2">
                        <img src={m.coverImage?.medium} alt="" />
                        <div className="related-info-v2">
                          <h4>{safeTitle(m.title)}</h4>
                          <span>{m.format} · {m.averageScore}%</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export default AnimeDetails;