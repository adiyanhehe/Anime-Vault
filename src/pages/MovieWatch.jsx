import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Clock,
  Calendar,
  Film,
  Play,
  AlertTriangle,
  Download,
  Heart,
  Gamepad2,
  RotateCcw,
} from "lucide-react";
import { fetchMediaMeta } from "../api/movies";
import CommentsSection from "../components/CommentsSection";
import { useUser } from "../api/UserContext";
import { buildDlhubSearchUrl } from "../utils/downloadLinks";
import electronBridge from "../utils/electronBridge";
import { FocusableButton, FocusableLink } from '../components/FocusableWrapper';

const STREAM_SERVERS = [
  {
    id: "vixsrc",
    name: "Server 1 • VixSrc",
    badge: "Recommended",
    description: "Primary non-VidSrc player for movies and TV episodes.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vixsrc.to/tv/${id}/${season}/${episode}?primaryColor=ff1a75&secondaryColor=1a0711&autoplay=true`
        : `https://vixsrc.to/movie/${id}?primaryColor=ff1a75&secondaryColor=1a0711&autoplay=true`,
  },
  {
    id: "vidnest-movie",
    name: "Server 2 • VidNest",
    badge: "AniList/TMDB",
    description: "VidNest embed with large TMDB library for movies and TV.",
    buildUrl: ({ id, isSeries, season, episode, isImdb }) => {
      // VidNest uses TMDB ID by default for TV, but can try with IMDb ID as fallback
      // Format: https://vidnest.fun/tv/tmdbId/season/episode or /movie/tmdbId
      return isSeries
        ? `https://vidnest.fun/tv/${id}/${season}/${episode}`
        : `https://vidnest.fun/movie/${id}`;
    },
  },
  {
    id: "2embed-viking",
    name: "Server 3 • Viking",
    badge: "2Embed Fix",
    description:
      "Direct Viking player fallback so users do not need to pick it inside another embed.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vembed.stream/play/${id}_s${season}?episode=${episode}&autoPlay=true&poster=true&controls=true`
        : `https://vembed.stream/play/${id}?autoPlay=true&poster=true&controls=true`,
  },
  {
    id: "vidsrc-ru",
    name: "VidSrc RU",
    badge: "VidSrc Alt",
    description: "Current VidSrc route using direct movie/tv paths instead of the older embed query URL.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vidsrc.ru/tv/${id}/${season}/${episode}`
        : `https://vidsrc.ru/movie/${id}`,
  },
  {
    id: "vidsrc-fyi",
    name: "VidSrc FYI",
    badge: "Backup",
    description: "IMDb/TMDB movie and TV embeds with multi-server failover.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vidsrc.fyi/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.fyi/embed/movie/${id}`,
  },
  {
    id: "kickassanime",
    name: "KickAssAnime",
    badge: "Extra Anime",
    description: "KickAssAnime embed with extensive anime and dub collections.",
    buildUrl: ({ id, isSeries, season, episode, isImdb }) => {
      // KickAssAnime primarily works with anime IDs, but can sometimes work with TMDB
      return isSeries
        ? `https://kickassanime.am/embed/tv/${id}/${season}/${episode}`
        : `https://kickassanime.am/embed/movie/${id}`;
    },
  },
  {
    id: "hianime",
    name: "HiAnime",
    badge: "Anime Focus",
    description: "HiAnime embed optimized for anime with strong dub support.",
    buildUrl: ({ id, isSeries, season, episode }) => {
      return isSeries
        ? `https://hianime.to/embed?id=${id}&ep=${episode}&season=${season}`
        : `https://hianime.to/embed?id=${id}`;
    },
  },
  {
    id: "vidsrc-cc",
    name: "VidSrc CC",
    badge: "Extra",
    description: "Alternate VidSrc endpoint for titles missing elsewhere.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoPlay=true`
        : `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`,
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    badge: "Extra",
    description: "Extra provider for IDs unavailable elsewhere.",
    buildUrl: ({ id, isSeries, season, episode, isImdb }) => {
      const tmdbFlag = isImdb ? "0" : "1";
      return isSeries
        ? `https://multiembed.mov/?video_id=${id}&tmdb=${tmdbFlag}&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${id}&tmdb=${tmdbFlag}`;
    },
  },
  {
    id: "2embed",
    name: "2Embed",
    badge: "Last Resort",
    description: "Original 2Embed mirror kept as a final fallback.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://www.2embed.cc/embedtv/${id}?s=${season}&e=${episode}`
        : `https://www.2embed.cc/embed/${id}`,
  },
];

function getEpisodeNumber(episode) {
  return episode?.episode || episode?.number || 1;
}

function MovieWatch() {
  const { type, id } = useParams();
  const { user, addToHistory, updateContinueWatching, toggleLike, isLiked } =
    useUser();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [activeServer, setActiveServer] = useState(STREAM_SERVERS[0].id);
  const [playerSrc, setPlayerSrc] = useState("");
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showFallbackHint, setShowFallbackHint] = useState(false);
  const episodeButtonRefs = useRef([]);
  const serverButtonRefs = useRef([]);

  function getPlayerUrl(serverId, mediaType, mediaId, seasonNum, episodeNum) {
    const server =
      STREAM_SERVERS.find((item) => item.id === serverId) || STREAM_SERVERS[0];
    const isSeriesMedia = mediaType === "tv" || mediaType === "series";
    const season = seasonNum || 1;
    const episode = episodeNum || 1;
    const isImdb = mediaId.startsWith("tt");

    return server.buildUrl({
      id: mediaId,
      isSeries: isSeriesMedia,
      season,
      episode,
      isImdb,
    });
  }

  function switchToNextServer() {
    const currentIndex = STREAM_SERVERS.findIndex(
      (server) => server.id === activeServer,
    );
    const nextServer =
      STREAM_SERVERS[(currentIndex + 1) % STREAM_SERVERS.length];
    setActiveServer(nextServer.id);
  }

  useEffect(() => {
    loadMeta();
  }, [id, type]);

  useEffect(() => {
    const url = getPlayerUrl(
      activeServer,
      type,
      id,
      activeSeason,
      getEpisodeNumber(activeEpisode),
    );
    setIframeLoaded(false);
    setShowFallbackHint(false);
    setPlayerSrc(url);

    const fallbackTimer = window.setTimeout(() => {
      setIframeLoaded(true);
      setShowFallbackHint(true);
    }, 9000);

    return () => window.clearTimeout(fallbackTimer);
  }, [activeServer, activeEpisode, id, type, activeSeason]);

  // Removed manual remote navigation useEffect in favor of spatial-navigation

  // Sync watch history to Neon Postgres when user logs in or meta loads
  useEffect(() => {
    if (user && meta) {
      addToHistory(
        id,
        type,
        meta.name || meta.title,
        meta.poster_path
          ? `https://image.tmdb.org/t/p/w500${meta.poster_path}`
          : "",
      );
    }
  }, [user, meta, id, type]);

  // Sync Continue Watching to Neon Postgres when active season/episode changes
  useEffect(() => {
    if (user && meta) {
      const poster = meta.poster_path
        ? `https://image.tmdb.org/t/p/w500${meta.poster_path}`
        : "";
      updateContinueWatching(
        id,
        type,
        meta.name || meta.title,
        poster,
        activeSeason || 1,
        getEpisodeNumber(activeEpisode),
        0, // progress not tracked on standard embedding
        0, // duration not tracked on standard embedding
      );
    }
  }, [user, meta, activeSeason, activeEpisode]);

  // Update Discord Rich Presence when watching movies/TV
  useEffect(() => {
    if (meta) {
      const title = meta.name || meta.title || 'Unknown';
      const isSeries = type === 'tv' || type === 'series';
      electronBridge.setAnimeActivity({
        title,
        episode: isSeries ? getEpisodeNumber(activeEpisode) : null,
        coverUrl: meta.poster || `https://live.metahub.space/poster/medium/${id}/img`,
        url: meta.imdb_id ? `https://www.imdb.com/title/${meta.imdb_id}` : '',
      });
    }
    return () => {
      electronBridge.clearAnimeActivity();
    };
  }, [meta, activeEpisode, type, id]);

  async function loadMeta() {
    setLoading(true);
    const data = await fetchMediaMeta(type, id);
    if (data && data.videos) {
      data.videos = data.videos.map((v) => ({
        ...v,
        episode: v.number !== undefined ? v.number : v.episode,
      }));
    }
    setMeta(data);
    if (data && (type === "tv" || type === "series")) {
      const seasons = {};
      (data.videos || []).forEach((v) => {
        if (v.season !== undefined) {
          if (!seasons[v.season]) seasons[v.season] = [];
          seasons[v.season].push(v);
        }
      });
      const nums = Object.keys(seasons)
        .map(Number)
        .sort((a, b) => a - b);
      if (nums.length > 0) {
        const fs = nums.find((s) => s > 0) || nums[0];
        setActiveSeason(fs);
        const eps = seasons[fs].sort(
          (a, b) => (a.episode || 0) - (b.episode || 0),
        );
        if (eps.length > 0) setActiveEpisode(eps[0]);
      }
    }
    setLoading(false);
  }

  function handleEpisodeClick(ep) {
    setActiveEpisode(ep);
    document
      .getElementById("watch-player-iframe")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (loading)
    return (
      <div className="watch-loading-container">
        <div className="spinner" />
        <p>Loading media credentials...</p>
      </div>
    );
  if (!meta)
    return (
      <div className="watch-error-container">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Failed to Load Media</h2>
        <Link to="/dramas-movies" className="btn-back">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>
    );

  const seasonsMap = {};
  const isSeries = type === "tv" || type === "series";
  if (isSeries && meta.videos) {
    meta.videos.forEach((v) => {
      if (v.season !== undefined) {
        if (!seasonsMap[v.season]) seasonsMap[v.season] = [];
        seasonsMap[v.season].push(v);
      }
    });
  }
  const seasonNumbers = Object.keys(seasonsMap)
    .map(Number)
    .sort((a, b) => a - b);

  const sNum = activeSeason || 1;
  const eNum = getEpisodeNumber(activeEpisode);
  const downloadUrls = {
    dlhub: buildDlhubSearchUrl({
      title: meta.name || meta.title,
      type: isSeries ? "series" : "movie",
      season: sNum,
      episode: eNum,
      year: meta.releaseInfo,
    }),
    twoembed: isSeries
      ? `https://www.2embed.cc/download/tv/${id}/${sNum}/${eNum}`
      : `https://www.2embed.cc/download/movie/${id}`,
    vidlink: isSeries
      ? `https://vidlink.pro/download/tv/${id}/${sNum}/${eNum}?primaryColor=ff1a75`
      : `https://vidlink.pro/download/movie/${id}?primaryColor=ff1a75`,
  };

  return (
    <div className="watch-detail-container">
      <div
        className="watch-hero-bg"
        style={{ backgroundImage: `url(${meta.background})` }}
      >
        <div className="watch-hero-overlay" />
      </div>
      <div className="watch-main-layout">
        <FocusableLink to="/dramas-movies" className="watch-back-link">
          <ArrowLeft size={18} /> Back to Movies & Dramas
        </FocusableLink>
        <div className="watch-meta-showcase">
          <div className="showcase-poster">
            <img
              src={
                meta.poster ||
                `https://live.metahub.space/poster/medium/${id}/img`
              }
              alt={meta.name}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=300&auto=format&fit=crop";
              }}
            />
          </div>
          <div className="showcase-details">
            <div className="showcase-badges">
              {meta.imdbRating && (
                <span className="badge-rating">
                  <Star size={14} fill="currentColor" /> {meta.imdbRating}
                </span>
              )}
              {meta.runtime && (
                <span className="badge-runtime">
                  <Clock size={14} /> {meta.runtime}
                </span>
              )}
              {meta.releaseInfo && (
                <span className="badge-year">
                  <Calendar size={14} /> {meta.releaseInfo}
                </span>
              )}
              <span className="badge-type">
                {isSeries ? "TV SERIES" : "MOVIE"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <h1 style={{ margin: 0 }}>{meta.name}</h1>
              <FocusableButton
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                  fontWeight: "800",
                  borderRadius: "10px",
                  color: isLiked(id, type)
                    ? "#ff1a75"
                    : "var(--text-secondary)",
                  borderColor: isLiked(id, type)
                    ? "#ff1a75"
                    : "var(--glass-border)",
                  background: isLiked(id, type)
                    ? "rgba(255, 26, 117, 0.1)"
                    : "var(--glass)",
                  border: "1px solid",
                  boxShadow: isLiked(id, type)
                    ? "0 0 10px rgba(255, 26, 117, 0.2)"
                    : "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const poster = meta.poster_path
                    ? `https://image.tmdb.org/t/p/w500${meta.poster_path}`
                    : "";
                  toggleLike(id, type, meta.name || meta.title, poster);
                }}
              >
                <Heart
                  size={16}
                  fill={isLiked(id, type) ? "#ff1a75" : "none"}
                />
                {isLiked(id, type) ? "Liked" : "Like"}
              </FocusableButton>
            </div>
            {meta.genres?.length > 0 && (
              <div className="showcase-genres" style={{ marginTop: 0 }}>
                {meta.genres.map((g) => (
                  <span key={g} className="genre-pill">
                    {g}
                  </span>
                ))}
              </div>
            )}
            <p className="showcase-synopsis">{meta.description}</p>
          </div>
        </div>

        <div className="watch-player-wrapper">
          <div className="watch-player-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Film size={20} className="glow-icon" />
              <h2 style={{ fontSize: "1.1rem" }}>
                Streaming:{" "}
                {isSeries && activeEpisode
                  ? `S${activeSeason} E${getEpisodeNumber(activeEpisode)}`
                  : meta.name}
              </h2>
            </div>
            <div
              className="player-server-selector"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div className="server-pills-row tv-card-row">
                <span className="selector-label">SERVERS:</span>
                <div
                  className="server-card-grid"
                  role="listbox"
                  aria-label="Streaming servers"
                >
                  {STREAM_SERVERS.map((srv, index) => (
                    <FocusableButton
                      key={srv.id}
                      className={`server-card-select ${activeServer === srv.id ? "active" : ""}`}
                      aria-selected={activeServer === srv.id}
                      title={srv.description}
                      onClick={() => setActiveServer(srv.id)}
                    >
                      <span>{srv.name}</span>
                      <small>{srv.badge}</small>
                    </FocusableButton>
                  ))}
                </div>
              </div>
              <div
                className="download-mirrors-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-tertiary)",
                    fontWeight: "bold",
                  }}
                >
                  DOWNLOAD:
                </span>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <a
                    href={downloadUrls.dlhub}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-chip dlhub"
                  >
                    <Download size={12} /> DLHub
                  </a>
                  <a
                    href={downloadUrls.twoembed}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      borderRadius: "8px",
                      border: "1px solid rgba(236, 72, 153, 0.4)",
                      background: "rgba(236, 72, 153, 0.08)",
                      color: "#ec4899",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 0 8px rgba(236, 72, 153, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(236, 72, 153, 0.18)";
                      e.currentTarget.style.boxShadow =
                        "0 0 12px rgba(236, 72, 153, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(236, 72, 153, 0.08)";
                      e.currentTarget.style.boxShadow =
                        "0 0 8px rgba(236, 72, 153, 0.1)";
                    }}
                  >
                    <Download size={12} /> 2Embed
                  </a>
                  <a
                    href={downloadUrls.vidlink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "4px 10px",
                      fontSize: "0.72rem",
                      fontWeight: "800",
                      borderRadius: "8px",
                      border: "1px solid rgba(6, 182, 212, 0.4)",
                      background: "rgba(6, 182, 212, 0.08)",
                      color: "#06b6d4",
                      textDecoration: "none",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "0 0 8px rgba(6, 182, 212, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(6, 182, 212, 0.18)";
                      e.currentTarget.style.boxShadow =
                        "0 0 12px rgba(6, 182, 212, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(6, 182, 212, 0.08)";
                      e.currentTarget.style.boxShadow =
                        "0 0 8px rgba(6, 182, 212, 0.1)";
                    }}
                  >
                    <Download size={12} /> VidLink
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div
            className="watch-iframe-container"
            style={{ position: "relative", overflow: "hidden" }}
          >
            {playerSrc ? (
              <>
                {!iframeLoaded && (
                  <div className="player-loading-overlay">
                    <div className="spinner" />
                    <p>
                      Loading{" "}
                      {
                        STREAM_SERVERS.find(
                          (server) => server.id === activeServer,
                        )?.name
                      }
                      ...
                    </p>
                  </div>
                )}
                <iframe
                  id="watch-player-iframe"
                  key={playerSrc}
                  src={playerSrc}
                  title={meta.name}
                  allowFullScreen
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  referrerPolicy="origin-when-cross-origin"
                  onLoad={() => setIframeLoaded(true)}
                />
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  minHeight: "400px",
                  background: "#000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "0.85rem",
                }}
              >
                <p>Loading player...</p>
              </div>
            )}
          </div>

          <div
            className={`player-help-banner ${showFallbackHint ? "needs-attention" : ""}`}
          >
            <div>
              <strong>
                {showFallbackHint ? "Still loading?" : "Playback tip"}
              </strong>
              <p>
                Use the server cards above or your TV remote arrows/Enter to
                switch sources. If one provider is stuck, jump to the next
                mirror without leaving the page.
              </p>
            </div>
            <FocusableButton className="next-server-btn" onClick={switchToNextServer}>
              <RotateCcw size={16} /> Try next server
            </FocusableButton>
          </div>
        </div>

        {isSeries && seasonNumbers.length > 0 && (
          <div className="watch-series-selector">
            <div className="season-tabs-row">
              {seasonNumbers.map((sNum) => (
                <FocusableButton
                  key={sNum}
                  className={`season-tab-btn ${activeSeason === sNum ? "active" : ""}`}
                  onClick={() => {
                    setActiveSeason(sNum);
                    const sortedEps = seasonsMap[sNum].sort(
                      (a, b) => (a.episode || 0) - (b.episode || 0),
                    );
                    if (sortedEps.length > 0) setActiveEpisode(sortedEps[0]);
                  }}
                >
                  Season {sNum === 0 ? "Specials" : sNum}
                </FocusableButton>
              ))}
            </div>
            <div className="tv-selector-hint">
              <Gamepad2 size={16} /> TV mode: focus a card and use arrow keys,
              Enter, or OK to select episodes.
            </div>
            <div className="episode-selector-grid">
              {activeSeason !== null &&
                seasonsMap[activeSeason]
                  ?.sort((a, b) => (a.episode || 0) - (b.episode || 0))
                  .map((ep, index) => {
                    const isActive = activeEpisode?.episode === ep.episode;
                    return (
                      <FocusableButton
                        key={ep.id || ep.episode}
                        className={`episode-card-btn tv-focus-card ${isActive ? "active" : ""}`}
                        aria-pressed={isActive}
                        onClick={() => handleEpisodeClick(ep)}
                      >
                        <div className="ep-card-thumb">
                          <img
                            src={
                              ep.thumbnail ||
                              `https://episodes.metahub.space/${id}/${activeSeason}/${ep.episode}/w780.jpg`
                            }
                            alt={ep.title || `E${ep.episode}`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop";
                            }}
                          />
                          <div className="ep-card-overlay">
                            <Play fill="white" size={16} />
                          </div>
                          <span className="ep-card-num">EP {ep.episode}</span>
                        </div>
                        <div className="ep-card-details">
                          <h4>{ep.title || `Episode ${ep.episode}`}</h4>
                        </div>
                      </FocusableButton>
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
