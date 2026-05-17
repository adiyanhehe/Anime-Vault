const VIDSRC_API = 'https://corsproxy.io/?https://vidsrc-embed.ru';
const CINEMETA_API = 'https://v3-cinemeta.strem.io';

/**
 * Fetch latest movies added to vidsrc-embed
 */
export async function fetchLatestMovies(page = 1) {
  try {
    const res = await fetch(`${VIDSRC_API}/movies/latest/page-${page}.json`);
    const data = await res.json();
    return data.result || [];
  } catch (err) {
    console.error('Failed to fetch latest movies:', err);
    return [];
  }
}

/**
 * Fetch latest TV shows added to vidsrc-embed
 */
export async function fetchLatestTVShows(page = 1) {
  try {
    const res = await fetch(`${VIDSRC_API}/tvshows/latest/page-${page}.json`);
    const data = await res.json();
    return data.result || [];
  } catch (err) {
    console.error('Failed to fetch latest tvshows:', err);
    return [];
  }
}

/**
 * Fetch latest episodes added to vidsrc-embed
 */
export async function fetchLatestEpisodes(page = 1) {
  try {
    const res = await fetch(`${VIDSRC_API}/episodes/latest/page-${page}.json`);
    const data = await res.json();
    return data.result || [];
  } catch (err) {
    console.error('Failed to fetch latest episodes:', err);
    return [];
  }
}

/**
 * Search movies and TV series globally on Stremio Cinemeta
 */
export async function searchMoviesAndSeries(query) {
  if (!query) return [];
  try {
    const [movieRes, seriesRes] = await Promise.all([
      fetch(`${CINEMETA_API}/catalog/movie/top/search=${encodeURIComponent(query)}.json`),
      fetch(`${CINEMETA_API}/catalog/series/top/search=${encodeURIComponent(query)}.json`)
    ]);
    
    const movieData = await movieRes.json().catch(() => ({ metas: [] }));
    const seriesData = await seriesRes.json().catch(() => ({ metas: [] }));
    
    const movies = (movieData.metas || []).map(item => ({ ...item, mediaType: 'movie' }));
    const series = (seriesData.metas || []).map(item => ({ ...item, mediaType: 'series' }));
    
    // Merge search results together
    return [...movies, ...series];
  } catch (err) {
    console.error('Failed to search movies/series:', err);
    return [];
  }
}

/**
 * Fetch rich metadata for a movie or TV series by IMDb ID from Stremio Cinemeta
 */
export async function fetchMediaMeta(type, imdbId) {
  const mediaType = type === 'series' || type === 'tv' ? 'series' : 'movie';
  try {
    const res = await fetch(`${CINEMETA_API}/meta/${mediaType}/${imdbId}.json`);
    const data = await res.json();
    return data.meta || null;
  } catch (err) {
    console.error('Failed to fetch media metadata:', err);
    return null;
  }
}
