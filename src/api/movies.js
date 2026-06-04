/*
 * src/api/movies.js – MultiEmbed integration
 *
 * This module provides functions to fetch media metadata and generate embed URLs
 * using the MultiEmbed service (https://multiembed.mov). Progress tracking is
 * retained via localStorage.
 */

// Removed VidNest constants and TMDB resolve logic
// Helper: Build MultiEmbed URL for movies (by IMDB ID)
function buildMultiEmbedUrl(imdbId) {
  return `https://multiembed.mov/?video_id=${imdbId}`;
}
// Helper: Build MultiEmbed URL for episodes (by IMDB ID, season, episode)
function buildMultiEmbedEpisodeUrl(imdbId, season, episode) {
  return `https://multiembed.mov/?video_id=${imdbId}&s=${season}&e=${episode}`;
}

// Removed VidNest import

// Removed TMDB search constants

export { buildMultiEmbedUrl, buildMultiEmbedEpisodeUrl };

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "";

// Placeholder resolveTmdbId – MultiEmbed does not require TMDB IDs.
async function resolveTmdbId(imdbId) {
  // Return null or implement TMDB lookup if needed in the future.
  return null;
}

/** Build an embed URL for VidNest – if we have a TMDB ID we can embed directly */


/** Progress tracking – stored as { [imdbId]: { progress: number (0‑100), lastSeen: timestamp } } */
const PROGRESS_KEY = "animevault_movie_progress";
function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveProgress(state) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state));
  } catch {}
}
export function setMovieProgress(imdbId, percent) {
  const state = loadProgress();
  state[imdbId] = { progress: percent, lastSeen: Date.now() };
  saveProgress(state);
}
export function getMovieProgress(imdbId) {
  const state = loadProgress();
  return state[imdbId]?.progress ?? 0;
}

/** Fetch latest movies – we still rely on the Cinemeta catalog for the list, but
 *  each item will include an embed URL and stored progress.
 */
export async function fetchLatestMovies(page = 1, genre = "") {
  // Re‑use the existing Cinemeta endpoint for the catalogue because VidNest does
  // not expose a list API. This keeps the UI unchanged.
  const CINEMETA_API = "https://v3-cinemeta.strem.io";
  const url = genre
    ? `${CINEMETA_API}/catalog/movie/top/genre=${encodeURIComponent(genre)}.json`
    : `${CINEMETA_API}/catalog/movie/top.json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const items = (data.metas || []).map(async (meta) => {
      const tmdbId = await resolveTmdbId(meta.imdb_id);
      return {
        imdb_id: meta.imdb_id,
        title: meta.name,
        year: meta.year,
        poster: meta.poster,
        quality: "1080p",
        embedUrl: buildMultiEmbedUrl(meta.imdb_id),
        progress: getMovieProgress(meta.imdb_id),
        tmdbId,
      };
    });
    const resolved = await Promise.all(items);
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    return resolved.slice(start, start + pageSize);
  } catch (err) {
    console.error("Failed to fetch latest movies:", err);
    return [];
  }
}

/** Fetch latest TV shows – same approach as movies but using the series endpoint */
export async function fetchLatestTVShows(page = 1, genre = "") {
  const CINEMETA_API = "https://v3-cinemeta.strem.io";
  const url = genre
    ? `${CINEMETA_API}/catalog/series/top/genre=${encodeURIComponent(genre)}.json`
    : `${CINEMETA_API}/catalog/series/top.json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const items = (data.metas || []).map(async (meta) => {
      const tmdbId = await resolveTmdbId(meta.imdb_id);
      return {
        imdb_id: meta.imdb_id,
        title: meta.name,
        year: meta.year,
        poster: meta.poster,
        quality: "HD",
        embedUrl: buildMultiEmbedUrl(meta.imdb_id),
        progress: getMovieProgress(meta.imdb_id),
        tmdbId,
      };
    });
    const resolved = await Promise.all(items);
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    return resolved.slice(start, start + pageSize);
  } catch (err) {
    console.error("Failed to fetch latest TV shows:", err);
    return [];
  }
}

/** Search movies/series – query both catalogs and attach VidNest embed URLs */
export async function searchMoviesAndSeries(query) {
  if (!query) return [];
  const CINEMETA_API = "https://v3-cinemeta.strem.io";
  try {
    const [movieRes, seriesRes] = await Promise.all([
      fetch(`${CINEMETA_API}/catalog/movie/top/search=${encodeURIComponent(query)}.json`),
      fetch(`${CINEMETA_API}/catalog/series/top/search=${encodeURIComponent(query)}.json`),
    ]);
    const movieData = await movieRes.json().catch(() => ({ metas: [] }));
    const seriesData = await seriesRes.json().catch(() => ({ metas: [] }));
    const enrich = async (meta, type) => {
      const tmdbId = await resolveTmdbId(meta.imdb_id);
      return {
        ...meta,
        mediaType: type,
        embedUrl: buildMultiEmbedUrl(meta.imdb_id),
        progress: getMovieProgress(meta.imdb_id),
        tmdbId,
      };
    };
    const movies = await Promise.all((movieData.metas || []).map((m) => enrich(m, "movie")));
    const series = await Promise.all((seriesData.metas || []).map((s) => enrich(s, "series")));
    return [...movies, ...series];
  } catch (err) {
    console.error("Search failed:", err);
    return [];
  }
}

/** Fetch rich metadata – same as before but also include embed URL and progress */
export async function fetchMediaMeta(type, imdbId) {
  const CINEMETA_API = "https://v3-cinemeta.strem.io";
  const mediaType = type === "series" || type === "tv" ? "series" : "movie";
  try {
    const res = await fetch(`${CINEMETA_API}/meta/${mediaType}/${imdbId}.json`);
    const data = await res.json();
    if (data && data.meta) {
      const meta = data.meta;
      const tmdbId = await resolveTmdbId(imdbId);
      return {
        ...meta,
        embedUrl: buildMultiEmbedUrl(imdbId),
        progress: getMovieProgress(imdbId),
        tmdbId,
      };
    }
  } catch (e) {
    console.warn("Cinemeta meta fetch failed", e);
  }
  // Fallback – same as original but with embedUrl and progress
  const tmdbId = await resolveTmdbId(imdbId);
  return {
    id: imdbId,
    imdb_id: imdbId,
    name: "Untitled",
    type: mediaType,
    poster: `https://live.metahub.space/poster/medium/${imdbId}/img`,
    background: `https://live.metahub.space/background/medium/${imdbId}/img`,
    description: "Content not available.",
    embedUrl: buildMultiEmbedUrl(imdbId),
    progress: getMovieProgress(imdbId),
    tmdbId,
  };
}

/** Export progress helpers for UI */
