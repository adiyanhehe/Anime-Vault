import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchAniListIdByMalId,
  fetchAnimeById,
  stripHtml,
} from "../api/anilist";
import {
  findBestStreamingMatch,
  fetchStreamingEpisodes,
  probeMirrors,
} from "../api/streaming";
import VideoPlayer from "../components/VideoPlayer";
import CommentsSection from "../components/CommentsSection";
import { useUser } from "../api/UserContext";
import { buildDlhubSearchUrl } from "../utils/downloadLinks";
import {
  Play,
  Calendar,
  Star,
  ExternalLink,
  Download,
  Tv,
  Users,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Plus,
  ChevronDown,
  Zap,
  Sparkles,
  Heart,
} from "lucide-react";

const PROGRESS_KEY = "animevault_progress";
const RECENTS_KEY = "animevault_recently_viewed";

function safeTitle(title) {
  if (!title) return "Unknown Title";
  return title.english || title.romaji || title.native || "Unknown Title";
}

/** Build an instant episode list from AniList metadata — no scraper needed */
function buildEpisodeList(media) {
  // For airing shows, nextAiringEpisode.episode - 1 = last aired episode
  let count = media.episodes;
  if (media.nextAiringEpisode?.episode) {
    count = media.nextAiringEpisode.episode - 1;
  }
  if (!count || count <= 0) count = media.format === "MOVIE" ? 1 : 12;

  return Array.from({ length: count }, (_, i) => ({
    id: `ep-${media.id}-${i + 1}`,
    number: i + 1,
    title: `Episode ${i + 1}`,
    // will be enriched by consumet in background
  }));
}

// ─────────────────────────────────────────────────────────
// Server definitions — each entry: { key, label, build }
// build(params) returns the embed URL string
// ─────────────────────────────────────────────────────────
const SERVERS = [
  {
    key: "VidNestSub",
    label: "VidNest • Sub",
    language: "sub",
    build: ({ anilistId, ep, language }) =>
      anilistId
        ? `https://vidnest.fun/anime/${anilistId}/${ep}/${language}`
        : null,
  },
  {
    key: "VidNestDub",
    label: "VidNest • Dub",
    language: "dub",
    build: ({ anilistId, ep, language }) =>
      anilistId
        ? `https://vidnest.fun/anime/${anilistId}/${ep}/${language}`
        : null,
  },
  {
    key: "VidNestHindi",
    label: "VidNest • Hindi",
    language: "hindi",
    build: ({ anilistId, ep, language }) =>
      anilistId
        ? `https://vidnest.fun/anime/${anilistId}/${ep}/${language}`
        : null,
  },
];

const DEFAULT_SERVER = "VidNestSub";

function AnimeDetails() {
  const { id } = useParams();
  const { user, addToHistory, toggleLike, isLiked } = useUser();

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [episodes, setEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [zenMode, setZenMode] = useState(false);
  const [progress, setProgress] = useState(() =>
    JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"),
  );

  // Player state
  const [activeServer, setActiveServer] = useState(DEFAULT_SERVER);
  const [videoSources, setVideoSources] = useState([]);
  const [playerStatus, setPlayerStatus] = useState(""); // info/warning messages
  const [resolvedAniListId, setResolvedAniListId] = useState(null);

  // Consumet enrichment (background)
  const [streamingInfo, setStreamingInfo] = useState({
    id: null,
    provider: "gogoanime",
  });
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
    setResolvedAniListId(null);
    setPlayerStatus("");
    setActiveServer(DEFAULT_SERVER);
    setEpPage(0);

    async function load() {
      const safetyTimer = setTimeout(() => setLoading(false), 12000);
      try {
        setLoading(true);
        setError("");

        const media = await fetchAnimeById(id);
        if (!media) {
          setError("Anime not found.");
          return;
        }

        setAnime(media);

        // ── Instantly build episode list from AniList metadata ──
        const epList = buildEpisodeList(media);
        setEpisodes(epList);

        // Resume from last watched episode, else start at 1
        const lastWatched = JSON.parse(
          localStorage.getItem(PROGRESS_KEY) || "{}",
        )[media.id];
        const startEp =
          epList.find((e) => e.number === lastWatched) || epList[0];
        setCurrentEpisode(startEp || null);

        // Done — page is interactive immediately
        setLoading(false);
        clearTimeout(safetyTimer);

        // ── Recently viewed ──
        const recents = JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
        const updated = [
          {
            id: media.id,
            title: safeTitle(media.title),
            image: media.coverImage?.large,
          },
          ...recents.filter((r) => r.id !== media.id),
        ].slice(0, 10);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));

        // ── Background: Consumet enrichment ──
        enrichWithConsumer(media, epList).catch(() => {});
      } catch (err) {
        setError(err.message || "Failed to load anime details.");
      } finally {
        setLoading(false);
      }
    }

    load();
    window.scrollTo(0, 0);
  }, [id]);

  // Sync watch history to Neon Postgres when user logs in or anime loads
  useEffect(() => {
    if (user && anime) {
      addToHistory(
        anime.id,
        "anime",
        safeTitle(anime.title),
        anime.coverImage?.large,
      );
    }
  }, [user, anime]);

  /** Fire-and-forget: try to replace episode list with richer consumet data */
  async function enrichWithConsumer(media, fallbackEps) {
    if (consumetLoadedRef.current) return;
    consumetLoadedRef.current = true;

    const titleStr = safeTitle(media.title);
    try {
      const match = await findBestStreamingMatch(
        titleStr,
        media.seasonYear,
        media.title?.english,
      );
      if (!match) return;

      setStreamingInfo(match);
      const richEps = await fetchStreamingEpisodes(match.id, match.provider);
      if (!richEps || richEps.length === 0) return;

      // Merge titles/thumbnails from scraper into our episode list
      setEpisodes((prev) => {
        const byNumber = {};
        richEps.forEach((e) => {
          byNumber[e.number] = e;
        });
        return prev.map((ep) => ({
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

  // ───── Episode selection ─────
  function selectEpisode(ep) {
    setCurrentEpisode(ep);
    setVideoSources([]);
    setPlayerStatus("");

    const updated = { ...progress, [anime.id]: ep.number };
    setProgress(updated);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (!anime) return;

    const animeId = String(anime.id || id || "");
    if (!animeId.startsWith("mal-")) {
      setResolvedAniListId(animeId);
      return;
    }

    let cancelled = false;
    setResolvedAniListId(null);
    setPlayerStatus("Preparing VidNest player...");

    fetchAniListIdByMalId(anime.idMal)
      .then((aniListId) => {
        if (cancelled) return;
        setResolvedAniListId(aniListId ? String(aniListId) : null);
        setPlayerStatus(
          aniListId
            ? ""
            : "VidNest needs an AniList ID for this title. Try opening this title from search again if it does not load.",
        );
      })
      .catch(() => {
        if (!cancelled) {
          setPlayerStatus("Unable to prepare VidNest for this title yet.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [anime, id]);

  // ───── Compute embed URL for current episode + server ─────
  function getEmbedUrl() {
    if (!anime || !currentEpisode) return null;
    const server = SERVERS.find((s) => s.key === activeServer);
    if (!server) return null;

    return server.build({
      anilistId: resolvedAniListId,
      ep: currentEpisode.number,
      language: server.language,
    });
  }

  // ───── Episode pagination ─────
  const totalPages = Math.ceil(episodes.length / EP_PAGE_SIZE);
  const visibleEpisodes = episodes.slice(
    epPage * EP_PAGE_SIZE,
    (epPage + 1) * EP_PAGE_SIZE,
  );

  // ───── Render ─────
  if (loading)
    return (
      <div className="status-container">
        <div className="spinner" />
        <p>Loading anime details...</p>
      </div>
    );

  if (error)
    return (
      <div className="status-container">
        <AlertCircle size={48} color="var(--brand-color)" />
        <p className="error">{error}</p>
        <Link to="/" className="btn-play-v2">
          Back to Home
        </Link>
      </div>
    );

  const animeTitle = safeTitle(anime.title);
  const embedUrl = getEmbedUrl();
  const animeDownloadUrls = currentEpisode
    ? {
        dlhub: buildDlhubSearchUrl({
          title: animeTitle,
          type: "anime",
          episode: currentEpisode.number,
          year: anime.seasonYear,
        }),
        vidlink: anime.idMal
          ? `https://vidlink.pro/download/anime/${anime.idMal}/${currentEpisode.number}/sub?primaryColor=ff1a75`
          : null,
      }
    : null;

  return (
    <div className="details-page-v2">
      {/* ── Video Player ── */}
      <div className="player-section-v2">
        {currentEpisode ? (
          <VideoPlayer
            sources={[]}
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

        {/* Fallback External Link for broken iframes */}
        {embedUrl && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "1rem 0",
            }}
          >
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-info-v2"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "0.6rem 1.5rem",
                background: "var(--brand-color)",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "8px",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={16} /> Open Player in New Tab (Bypasses
              Blocks)
            </a>
          </div>
        )}

        {animeDownloadUrls && (
          <div className="anime-download-row">
            <span>DOWNLOAD:</span>
            <a
              href={animeDownloadUrls.dlhub}
              target="_blank"
              rel="noopener noreferrer"
              className="download-chip dlhub"
            >
              <Download size={14} /> DLHub
            </a>
            {animeDownloadUrls.vidlink && (
              <a
                href={animeDownloadUrls.vidlink}
                target="_blank"
                rel="noopener noreferrer"
                className="download-chip vidlink"
              >
                <Download size={14} /> VidLink
              </a>
            )}
          </div>
        )}

        {/* ── Server Selector ── */}
        {currentEpisode && (
          <div className="server-selector-v2">
            <div className="server-info">
              <Tv size={20} />
              <div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <h4 style={{ margin: 0 }}>Streaming Server</h4>
                  <button
                    className={`zen-toggle-v2 ${zenMode ? "active" : ""}`}
                    onClick={() => setZenMode(!zenMode)}
                    title={
                      zenMode
                        ? "Turn off Ad-Blocker"
                        : "Turn on Ad-Blocker (Zen Mode)"
                    }
                  >
                    <Zap size={14} fill={zenMode ? "currentColor" : "none"} />
                    {zenMode ? "Zen Mode ON" : "Zen Mode OFF"}
                  </button>
                </div>
                <p>
                  VidNest is the only anime player now. Pick Sub, Dub, or Hindi
                  depending on what the title supports.
                </p>
              </div>
            </div>

            <div className="server-controls">
              <select
                className="server-dropdown-v2"
                value={activeServer}
                onChange={(e) => setActiveServer(e.target.value)}
              >
                {SERVERS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
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
              <span className="score">
                <Star size={16} fill="currentColor" /> {anime.averageScore}%
              </span>
              <span>
                <Tv size={16} /> {anime.format}
              </span>
              <span>
                <Users size={16} /> {anime.status}
              </span>
              {anime.seasonYear && (
                <span>
                  <Calendar size={16} /> {anime.seasonYear}
                </span>
              )}
              {anime.nextAiringEpisode && (
                <span style={{ color: "var(--brand-color)" }}>
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
              <button
                className="btn-info-v2"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: isLiked(anime.id, "anime")
                    ? "#ff1a75"
                    : "var(--text-secondary)",
                  borderColor: isLiked(anime.id, "anime")
                    ? "#ff1a75"
                    : "var(--glass-border)",
                  background: isLiked(anime.id, "anime")
                    ? "rgba(255, 26, 117, 0.1)"
                    : "var(--glass)",
                  boxShadow: isLiked(anime.id, "anime")
                    ? "0 0 10px rgba(255, 26, 117, 0.2)"
                    : "none",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onClick={() =>
                  toggleLike(
                    anime.id,
                    "anime",
                    safeTitle(anime.title),
                    anime.coverImage?.large,
                  )
                }
              >
                <Heart
                  size={20}
                  fill={isLiked(anime.id, "anime") ? "#ff1a75" : "none"}
                />
                {isLiked(anime.id, "anime") ? "Liked" : "Like"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className={`detail-layout-v2 ${zenMode ? "zen-layout" : ""}`}>
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
          {!zenMode &&
            anime.relations?.nodes?.length > 0 &&
            (() => {
              const SHOW_TYPES = [
                "PREQUEL",
                "SEQUEL",
                "PARENT",
                "SIDE_STORY",
                "SUMMARY",
              ];
              const filtered = anime.relations.nodes
                .map((rel, i) => ({
                  rel,
                  type: anime.relations.edges[i]?.relationType,
                }))
                .filter(({ type }) => SHOW_TYPES.includes(type));
              if (!filtered.length) return null;
              return (
                <div className="details-section-v2">
                  <h2>Seasons & Related</h2>
                  <div className="relations-grid-v2">
                    {filtered.map(({ rel, type }) => (
                      <Link
                        key={rel.id}
                        to={`/anime/${rel.id}`}
                        className="relation-card-v2"
                      >
                        <div className="relation-image">
                          <img
                            src={rel.coverImage?.large}
                            alt={safeTitle(rel.title)}
                          />
                          <span className="relation-type">
                            {type.replace("_", " ")}
                          </span>
                        </div>
                        <div className="relation-info">
                          <h4>{safeTitle(rel.title)}</h4>
                          <span>
                            {rel.format} · {rel.status}
                          </span>
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1rem",
                }}
              >
                <h2 style={{ margin: 0 }}>
                  Episodes
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    ({episodes.length})
                  </span>
                </h2>

                {/* Episode page selector for long shows */}
                {totalPages > 1 && (
                  <div className="ep-page-selector">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`ep-page-btn ${epPage === i ? "active" : ""}`}
                        onClick={() => setEpPage(i)}
                      >
                        {i * EP_PAGE_SIZE + 1}–
                        {Math.min((i + 1) * EP_PAGE_SIZE, episodes.length)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="episodes-container-v2">
                {visibleEpisodes.length > 0 ? (
                  <div className="episodes-grid-v2">
                    {visibleEpisodes.map((ep) => (
                      <button
                        key={ep.id}
                        className={`episode-btn-v2 ${currentEpisode?.id === ep.id ? "active" : ""} ${progress[anime.id] >= ep.number ? "watched" : ""}`}
                        onClick={() => selectEpisode(ep)}
                      >
                        <span className="episode-label">EP</span>
                        <span className="episode-number">{ep.number}</span>
                        {progress[anime.id] >= ep.number && (
                          <CheckCircle2 size={12} className="check" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>No episodes available for this title yet.</p>
                )}
              </div>
            </div>
          )}

          <CommentsSection mediaId={anime.id} />
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
                  <span className="info-value-v2">
                    {anime.studios?.nodes?.map((n) => n.name).join(", ")}
                  </span>
                </div>
                <div className="info-row-v2">
                  <span className="info-label-v2">Episodes</span>
                  <span className="info-value-v2">
                    {anime.nextAiringEpisode
                      ? `${anime.nextAiringEpisode.episode - 1} aired / ${anime.episodes || "?"} total`
                      : anime.episodes || "Unknown"}
                  </span>
                </div>
                <div className="info-row-v2">
                  <span className="info-label-v2">Source</span>
                  <span className="info-value-v2">{anime.source}</span>
                </div>
                <div className="info-row-v2">
                  <span className="info-label-v2">Genres</span>
                  <div className="genre-tags-v2">
                    {anime.genres?.map((g) => (
                      <Link
                        key={g}
                        to={`/search?genre=${g}`}
                        className="genre-tag-v2"
                      >
                        {g}
                      </Link>
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
                  {anime.recommendations.nodes.slice(0, 5).map((rec) => {
                    const m = rec.mediaRecommendation;
                    if (!m) return null;
                    return (
                      <Link
                        key={m.id}
                        to={`/anime/${m.id}`}
                        className="related-card-v2"
                      >
                        <img src={m.coverImage?.medium} alt="" />
                        <div className="related-info-v2">
                          <h4>{safeTitle(m.title)}</h4>
                          <span>
                            {m.format} · {m.averageScore}%
                          </span>
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
