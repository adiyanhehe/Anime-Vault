
/*
 * src/api/movies.js – MultiEmbed integration
 *
 * This module provides functions to fetch media metadata and generate embed URLs
 * using the MultiEmbed service (https://multiembed.mov). Progress tracking is
 * retained via localStorage.
 */

// Helper: Build VidSrc-Embed URL for movies (by IMDB or TMDB ID)
export function buildVidSrcEmbedUrl(id, type = 'imdb') {
  if (type === 'tmdb') {
    return `https://vidsrc-embed.ru/embed/movie?tmdb=${id}`;
  }
  return `https://vidsrc-embed.ru/embed/movie?imdb=${id}`;
}

// Helper: Build VidSrc-Embed URL for episodes (by IMDB or TMDB ID, season, episode)
export function buildVidSrcEmbedEpisodeUrl(id, season, episode, type = 'imdb') {
  if (type === 'tmdb') {
    return `https://vidsrc-embed.ru/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
  }
  return `https://vidsrc-embed.ru/embed/tv?imdb=${id}&season=${season}&episode=${episode}`;
}

// Helper: Build VidSrc-Embed URL for TV show (by IMDB or TMDB ID)
export function buildVidSrcEmbedTvUrl(id, type = 'imdb') {
  if (type === 'tmdb') {
    return `https://vidsrc-embed.ru/embed/tv?tmdb=${id}`;
  }
  return `https://vidsrc-embed.ru/embed/tv?imdb=${id}`;
}

const FALLBACK_SHOWS = [
  {
    imdb_id: 'tt20234568',
    name: 'Weak Hero Class 1',
    title: 'Weak Hero Class 1',
    type: 'series',
    year: '2022',
    poster: 'https://images.metahub.space/poster/medium/tt20234568/img',
    banner: 'https://images.metahub.space/background/medium/tt20234568/img',
    description: 'Yeon Shi-eun is a model student, who ranks at the top of his high school. Physically, Yeon Shi-eun appears weak, but by using his wits, psychology, and tools, he fights against the violence that takes place inside and outside of his school.',
    genre: 'Action, Drama, Youth'
  },
  {
    imdb_id: 'tt28036189',
    name: 'When I Fly Towards You',
    title: 'When I Fly Towards You',
    type: 'series',
    year: '2023',
    poster: 'https://images.metahub.space/poster/medium/tt27923758/img',
    banner: 'https://image.tmdb.org/t/p/original/3nWfjIBUyYUCABI7Fsl1AhNhDAr.jpg',
    description: 'A warm and sweet school love story follows Su Zaizai, an optimistic and cheerful high school student, who falls for Zhang Lurang, a cold and arrogant transfer student.',
    genre: 'Romance, Youth, Comedy'
  },
  {
    imdb_id: 'tt29606822',
    name: 'My Demon',
    title: 'My Demon',
    type: 'series',
    year: '2023',
    poster: 'https://images.metahub.space/poster/medium/tt29606822/img',
    banner: 'https://image.tmdb.org/t/p/original/pRStZQlU0aB6KaVNBKnyEAygDBw.jpg',
    description: 'A pitiless demon becomes powerless after getting entangled with a cold-hearted heiress, who may hold the key to his lost abilities and his heart.',
    genre: 'Fantasy, Romance, Comedy'
  },
  {
    imdb_id: 'tt15398716',
    name: 'Oppenheimer',
    title: 'Oppenheimer',
    type: 'movie',
    year: '2023',
    poster: 'https://images.metahub.space/poster/medium/tt15398716/img',
    banner: 'https://image.tmdb.org/t/p/original/nb3xI8XI3w4pMVZ38VijbsyBqP4.jpg',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    genre: 'Biography, Drama, History'
  },
  {
    imdb_id: 'tt15239678',
    name: 'Dune: Part Two',
    title: 'Dune: Part Two',
    type: 'movie',
    year: '2024',
    poster: 'https://images.metahub.space/poster/medium/tt15239678/img',
    banner: 'https://images.metahub.space/background/medium/tt15239678/img',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    genre: 'Sci-Fi, Adventure, Action'
  }
];

// Fetch detailed metadata for a given media type ('movie' | 'series' | 'tv') and IMDB ID
export async function fetchMediaMeta(mediaType, imdbId) {
  const type = mediaType === 'series' || mediaType === 'tv' ? 'series' : 'movie';
  const CINEMETA_API = 'https://v3-cinemeta.strem.io';

  try {
    const res = await fetch(`${CINEMETA_API}/meta/${type}/${imdbId}.json`);
    const data = await res.json();
    console.log('Cinemeta response:', data);

    if (data && data.meta) {
      const meta = data.meta;
      return {
        ...meta,
        imdb_id: imdbId,
        title: meta.name,
        name: meta.name,
        poster: meta.poster || `https://live.metahub.space/poster/medium/${imdbId}/img`,
        banner: meta.background || meta.poster,
        description: meta.description,
        releaseInfo: meta.year,
        embedUrl: buildVidSrcEmbedUrl(imdbId),
        progress: getMovieProgress(imdbId),
        type: mediaType,
        seasons: meta.videos || meta.seasons || []
      };
    }
  } catch (e) {
    console.warn('Failed to fetch media meta from Cinemeta:', e);
  }

  // Fallback: Check FALLBACK_SHOWS
  const fallbackItem = FALLBACK_SHOWS.find(show => show.imdb_id === imdbId);
  if (fallbackItem) {
    return {
      ...fallbackItem,
      title: fallbackItem.name,
      poster: fallbackItem.poster,
      banner: fallbackItem.banner,
      embedUrl: buildVidSrcEmbedUrl(imdbId),
      progress: getMovieProgress(imdbId)
    };
  }

  // Last resort minimal info
  return {
    imdb_id: imdbId,
    title: 'Untitled',
    name: 'Untitled',
    poster: `https://live.metahub.space/poster/medium/${imdbId}/img`,
    banner: `https://live.metahub.space/background/medium/${imdbId}/img`,
    embedUrl: buildVidSrcEmbedUrl(imdbId),
    progress: getMovieProgress(imdbId),
    type: mediaType
  };
}

/** Progress tracking – stored as { [imdbId]: { progress: number (0-100), lastSeen: timestamp } } */
const PROGRESS_KEY = 'animevault_movie_progress';

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

/** Fetch latest movies – use Cinemeta catalog with fallback to FALLBACK_SHOWS */
export async function fetchLatestMovies(page = 1, genre = '') {
  const CINEMETA_API = 'https://v3-cinemeta.strem.io';
  const pageSize = 12;
  const start = (page - 1) * pageSize;

  try {
    const url = genre
      ? `${CINEMETA_API}/catalog/movie/top/genre=${encodeURIComponent(genre)}.json`
      : `${CINEMETA_API}/catalog/movie/top.json`;

    const res = await fetch(url);
    const data = await res.json();

    if (data && data.metas && data.metas.length > 0) {
      const items = data.metas.map((meta) => ({
        imdb_id: meta.imdb_id,
        title: meta.name,
        year: meta.year,
        poster: meta.poster || `https://live.metahub.space/poster/medium/${meta.imdb_id}/img`,
        quality: '1080p',
        embedUrl: buildVidSrcEmbedUrl(meta.imdb_id),
        progress: getMovieProgress(meta.imdb_id)
      }));
      return items.slice(start, start + pageSize);
    }
  } catch (err) {
    console.error('Failed to fetch latest movies from Cinemeta:', err);
  }

  // Fallback to FALLBACK_SHOWS
  return FALLBACK_SHOWS.filter(show => show.type === 'movie').slice(start, start + pageSize);
}

/** Fetch latest TV shows – use Cinemeta catalog with fallback to FALLBACK_SHOWS */
export async function fetchLatestTVShows(page = 1, genre = '') {
  const CINEMETA_API = 'https://v3-cinemeta.strem.io';
  const pageSize = 12;
  const start = (page - 1) * pageSize;

  try {
    const url = genre
      ? `${CINEMETA_API}/catalog/series/top/genre=${encodeURIComponent(genre)}.json`
      : `${CINEMETA_API}/catalog/series/top.json`;

    const res = await fetch(url);
    const data = await res.json();

    if (data && data.metas && data.metas.length > 0) {
      const items = data.metas.map((meta) => ({
        imdb_id: meta.imdb_id,
        title: meta.name,
        year: meta.year,
        poster: meta.poster || `https://live.metahub.space/poster/medium/${meta.imdb_id}/img`,
        quality: 'HD',
        embedUrl: buildVidSrcEmbedTvUrl(meta.imdb_id),
        progress: getMovieProgress(meta.imdb_id)
      }));
      return items.slice(start, start + pageSize);
    }
  } catch (err) {
    console.error('Failed to fetch latest TV shows from Cinemeta:', err);
  }

  // Fallback to FALLBACK_SHOWS
  return FALLBACK_SHOWS.filter(show => show.type === 'series').slice(start, start + pageSize);
}

/** Search movies/series – query Cinemeta catalog with fallback to FALLBACK_SHOWS */
export async function searchMoviesAndSeries(query) {
  if (!query) return [];
  const CINEMETA_API = 'https://v3-cinemeta.strem.io';

  try {
    const [movieRes, seriesRes] = await Promise.all([
      fetch(`${CINEMETA_API}/catalog/movie/top/search=${encodeURIComponent(query)}.json`),
      fetch(`${CINEMETA_API}/catalog/series/top/search=${encodeURIComponent(query)}.json`)
    ]);

    const movieData = await movieRes.json().catch(() => ({ metas: [] }));
    const seriesData = await seriesRes.json().catch(() => ({ metas: [] }));

    const movies = (movieData.metas || []).map((m) => ({
      ...m,
      mediaType: 'movie',
      type: 'movie',
      title: m.name,
      name: m.name,
      poster: m.poster || `https://live.metahub.space/poster/medium/${m.imdb_id}/img`,
      banner: m.background || m.poster,
      embedUrl: buildVidSrcEmbedUrl(m.imdb_id),
      progress: getMovieProgress(m.imdb_id)
    }));

    const series = (seriesData.metas || []).map((s) => ({
      ...s,
      mediaType: 'series',
      type: 'series',
      title: s.name,
      name: s.name,
      poster: s.poster || `https://live.metahub.space/poster/medium/${s.imdb_id}/img`,
      banner: s.background || s.poster,
      embedUrl: buildVidSrcEmbedTvUrl(s.imdb_id),
      progress: getMovieProgress(s.imdb_id)
    }));

    const allResults = [...movies, ...series];
    if (allResults.length > 0) return allResults;
  } catch (err) {
    console.error('Search failed:', err);
  }

  // Fallback to FALLBACK_SHOWS
  return FALLBACK_SHOWS.filter(show =>
    show.name.toLowerCase().includes(query.toLowerCase()) ||
    (show.genre && show.genre.toLowerCase().includes(query.toLowerCase()))
  ).map(show => ({
    ...show,
    mediaType: show.type,
    title: show.name,
    name: show.name,
    embedUrl: show.type === 'series' ? buildVidSrcEmbedTvUrl(show.imdb_id) : buildVidSrcEmbedUrl(show.imdb_id)
  }));
}

/** Fetch recommendations – use FALLBACK_SHOWS and Cinemeta search */
export async function getRecommended(limit = 50) {
  try {
    const results = await searchMoviesAndSeries('');
    if (results.length > 0) {
      return results.slice(0, limit);
    }
  } catch (err) {
    console.error('Failed to fetch recommendations:', err);
  }

  // Fallback to FALLBACK_SHOWS
  return FALLBACK_SHOWS.slice(0, limit).map(show => ({
    ...show,
    mediaType: show.type,
    title: show.name,
    name: show.name,
    embedUrl: show.type === 'series' ? buildVidSrcEmbedTvUrl(show.imdb_id) : buildVidSrcEmbedUrl(show.imdb_id)
  }));
}
