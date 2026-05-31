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

const STREAM_SERVERS = [
  {
    id: "vidsrc-fyi",
    name: "VidSrc FYI",
    badge: "Fast",
    description: "IMDb/TMDB movie and TV embeds with multi-server failover.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vidsrc.fyi/embed/tv/${id}/${season}/${episode}`
        : `https://vidsrc.fyi/embed/movie/${id}`,
  },
  {
    id: "vixsrc",
    name: "VixSrc",
    badge: "TV Ready",
    description: "Accepts IMDb or TMDB IDs for movies and episodes.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vixsrc.to/tv/${id}/${season}/${episode}?primaryColor=ff1a75&secondaryColor=1a0711&autoplay=true`
        : `https://vixsrc.to/movie/${id}?primaryColor=ff1a75&secondaryColor=1a0711&autoplay=true`,
  },
  {
    id: "vidsrc-cc",
    name: "VidSrc CC",
    badge: "Backup",
    description: "Alternate VidSrc endpoint for stubborn loading screens.",
    buildUrl: ({ id, isSeries, season, episode }) =>
      isSeries
        ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoPlay=true`
        : `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`,
  },
  {
    id: "vidsrc-ru",
    name: "VidSrc RU",
    badge: "Legacy",
    description: "Legacy embed route kept as a last-resort fallback.",
    buildUrl: ({ id, isSeries, season, episode, isImdb }) => {
      const param = isImdb ? `imdb=${id}` : `tmdb=${id}`;
      return isSeries
        ? `https://vidsrc-embed.ru/embed/tv?${param}&season=${season}&episode=${episode}&autoplay=1&autonext=1`
        : `https://vidsrc-embed.ru/embed/movie?${param}&autoplay=1`;
    },
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
    badge: "Fallback",
    description: "Final fallback mirror when newer embeds are blocked.",
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
    serverButtonRefs.current[
      (currentIndex + 1) % STREAM_SERVERS.length
    ]?.focus();
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
      setShowFallbackHint(true);
    }, 9000);

    return () => window.clearTimeout(fallbackTimer);
  }, [activeServer, activeEpisode, id, type, activeSeason]);

  useEffect(() => {
    function handleRemoteNavigation(event) {
      const tagName = event.target?.tagName?.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        event.target?.isContentEditable
      )
        return;

      const episodeButtons = episodeButtonRefs.current.filter(Boolean);
      const serverButtons = serverButtonRefs.current.filter(Boolean);
      const activeElement = document.activeElement;
      const activeEpisodeIndex = episodeButtons.indexOf(activeElement);
      const activeServerIndex = serverButtons.indexOf(activeElement);

      if (event.key === "ArrowRight" && activeServerIndex >= 0) {
        event.preventDefault();
        serverButtons[
          Math.min(activeServerIndex + 1, serverButtons.length - 1)
        ]?.focus();
      }

      if (event.key === "ArrowLeft" && activeServerIndex >= 0) {
        event.preventDefault();
        serverButtons[Math.max(activeServerIndex - 1, 0)]?.focus();
      }

      if (!episodeButtons.length || activeEpisodeIndex < 0) return;

      const columns = Math.max(
        1,
        Math.floor(
          (document.querySelector(".episode-selector-grid")?.clientWidth ||
            260) / 280,
        ),
      );
      const moveMap = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: columns,
        ArrowUp: -columns,
      };
      const offset = moveMap[event.key];
      if (!offset) return;

      event.preventDefault();
      const nextIndex = Math.min(
        Math.max(activeEpisodeIndex + offset, 0),
        episodeButtons.length - 1,
      );
      episodeButtons[nextIndex]?.focus();
    }

    window.addEventListener("keydown", handleRemoteNavigation);
    return () => window.removeEventListener("keydown", handleRemoteNavigation);
  }, []);

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
        <Link to="/dramas-movies" className="watch-back-link">
          <ArrowLeft size={18} /> Back to Movies & Dramas
        </Link>
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
              <button
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
              </button>
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
                    <button
                      key={srv.id}
                      ref={(node) => {
                        serverButtonRefs.current[index] = node;
                      }}
                      className={`server-card-select ${activeServer === srv.id ? "active" : ""}`}
                      aria-selected={activeServer === srv.id}
                      title={srv.description}
                      onClick={() => setActiveServer(srv.id)}
                    >
                      <span>{srv.name}</span>
                      <small>{srv.badge}</small>
                    </button>
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
            <button className="next-server-btn" onClick={switchToNextServer}>
              <RotateCcw size={16} /> Try next server
            </button>
          </div>
        </div>

        {isSeries && seasonNumbers.length > 0 && (
          <div className="watch-series-selector">
            <div className="season-tabs-row">
              {seasonNumbers.map((sNum) => (
                <button
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
                </button>
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
                      <button
                        key={ep.id || ep.episode}
                        ref={(node) => {
                          episodeButtonRefs.current[index] = node;
                        }}
                        className={`episode-card-btn tv-focus-card ${isActive ? "active" : ""}`}
                        aria-pressed={isActive}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleEpisodeClick(ep);
                          }
                        }}
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
