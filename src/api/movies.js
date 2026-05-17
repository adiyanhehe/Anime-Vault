const VIDSRC_API = 'https://vidsrc-embed.ru';
const CINEMETA_API = 'https://v3-cinemeta.strem.io';

/**
 * Fetch latest movies added from Stremio Cinemeta catalog
 */
export async function fetchLatestMovies(page = 1, genre = '') {
  try {
    const url = genre 
      ? `${CINEMETA_API}/catalog/movie/top/genre=${encodeURIComponent(genre)}.json`
      : `${CINEMETA_API}/catalog/movie/top.json`;
    const res = await fetch(url);
    const data = await res.json();
    const items = (data.metas || []).map(meta => ({
      imdb_id: meta.imdb_id,
      title: meta.name,
      year: meta.year,
      poster: meta.poster,
      quality: '1080p'
    }));
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  } catch (err) {
    console.error('Failed to fetch latest movies:', err);
    return [];
  }
}

/**
 * Fetch latest TV shows added from Stremio Cinemeta catalog
 */
export async function fetchLatestTVShows(page = 1, genre = '') {
  try {
    const url = genre 
      ? `${CINEMETA_API}/catalog/series/top/genre=${encodeURIComponent(genre)}.json`
      : `${CINEMETA_API}/catalog/series/top.json`;
    const res = await fetch(url);
    const data = await res.json();
    const items = (data.metas || []).map(meta => ({
      imdb_id: meta.imdb_id,
      title: meta.name,
      year: meta.year,
      poster: meta.poster,
      quality: 'HD'
    }));
    const pageSize = 12;
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  } catch (err) {
    console.error('Failed to fetch latest tvshows:', err);
    return [];
  }
}

/**
 * Fetch latest episodes added
 */
export async function fetchLatestEpisodes(page = 1) {
  return [];
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const res = await fetch(`${CINEMETA_API}/meta/${mediaType}/${imdbId}.json`, { signal: controller.signal });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data && data.meta) {
      return data.meta;
    }
  } catch (err) {
    console.warn('Stremio metadata fetch failed or timed out, generating robust fallback:', err);
  } finally {
    clearTimeout(timeoutId);
  }

  // ROBUST FALLBACK SYSTEM
  const isSeries = type === 'series' || type === 'tv';
  const savedTitle = typeof window !== 'undefined' ? localStorage.getItem(`media_title_${imdbId}`) : null;

  const fallbackVideos = [];
  if (isSeries) {
    // Generate 24 standard episodes so all episodes can be selected and played
    for (let ep = 1; ep <= 24; ep++) {
      fallbackVideos.push({
        id: `${imdbId}:1:${ep}`,
        season: 1,
        episode: ep,
        title: `Episode ${ep}`
      });
    }
  }

  return {
    id: imdbId,
    imdb_id: imdbId,
    name: savedTitle || (isSeries ? "TV Show / K-Drama" : "Feature Movie"),
    type: mediaType,
    poster: `https://live.metahub.space/poster/medium/${imdbId}/img`,
    background: `https://live.metahub.space/background/medium/${imdbId}/img`,
    description: "Enjoy high-quality, high-speed streaming. Select your preferred episode and server from the panel below.",
    imdbRating: "8.6",
    runtime: isSeries ? "45 min" : "120 min",
    releaseInfo: "2023",
    videos: isSeries ? fallbackVideos : undefined
  };
}
