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

// Fetch detailed metadata for a given media type ('movie' | 'series' | 'tv') and IMDB ID
export async function fetchMediaMeta(mediaType, imdbId) {
  const type = mediaType === 'series' || mediaType === 'tv' ? 'series' : 'movie';
  const CINEMETA_API = "https://v3-cinemeta.strem.io";
  try {
    const res = await fetch(`${CINEMETA_API}/meta/${type}/${imdbId}.json`);
    const data = await res.json();
    if (data && data.meta) {
      const meta = data.meta;
      const tmdbId = await resolveTmdbId(imdbId);
      return {
        ...meta,
        embedUrl: buildMultiEmbedUrl(imdbId),
        progress: getMovieProgress(imdbId),
        tmdbId,
        type: mediaType,
      };
    }
    // Fallback minimal info
    return {
      imdb_id: imdbId,
      title: "Untitled",
      poster: `https://live.metahub.space/poster/medium/${imdbId}/img`,
      embedUrl: buildMultiEmbedUrl(imdbId),
      progress: getMovieProgress(imdbId),
      type: mediaType,
    };
  } catch (e) {
    console.warn("Failed to fetch media meta", e);
    return null;
  }
}

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
export async function getRecommended(limit = 50) {
  // Fetch a broad list of movies/series and return the top N items as recommendations.
  // For now we reuse the generic search API without a query to get the latest catalog.
  // In a real scenario you would call a recommendation endpoint or apply a rating filter.
  try {
    const results = await searchMoviesAndSeries('');
    // Sort by rating if available (higher rating first)
    const sorted = results.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      return ratingB - ratingA;
    });
    return sorted.slice(0, limit);
  } catch (err) {
    console.error('Failed to fetch recommendations:', err);
    return [];
  }
}

/** Export progress helpers for UI */
