/**
 * Consumet API wrapper for fetching actual anime video streaming sources.
 * Uses Gogoanime as the source provider.
 * Public instances: https://consumet-api-rho.vercel.app or https://api.consumet.org
 */

const BASES = [
  'https://api.consumet.org/anime/gogoanime',
  'https://consumet-api-rho.vercel.app/anime/gogoanime'
];

async function get(endpoint) {
  let lastError = null;

  for (const base of BASES) {
    try {
      const response = await fetch(`${base}${endpoint}`);
      if (!response.ok) {
        throw new Error(`Consumet request failed: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Consumet request failed');
}

/**
 * Search Gogoanime for an anime by title
 * @param {string} query - Anime title to search
 * @returns {Promise<Array>} List of anime results with id, title, image, etc.
 */
export async function searchGogoanime(query) {
  const data = await get(`/${encodeURIComponent(query)}`);
  return data.results || [];
}

/**
 * Fetch episode list from Gogoanime
 * @param {string} animeId - Gogoanime anime ID (e.g. "attack-on-titan-2023")
 * @param {number} page - Page number
 * @returns {Promise<Array>} List of episodes with id, number, title
 */
export async function fetchGogoEpisodes(animeId, page = 1) {
  const data = await get(`/info/${encodeURIComponent(animeId)}`);
  return data.episodes || [];
}

/**
 * Get streaming links for a specific episode
 * @param {string} episodeId - Gogoanime episode ID (e.g. "attack-on-titan-episode-1")
 * @returns {Promise<Object>} Streaming sources (multi-quality)
 */
export async function fetchEpisodeSources(episodeId) {
  const data = await get(`/watch/${encodeURIComponent(episodeId)}`);
  return {
    sources: data.sources || [],
    download: data.download || '',
    headers: data.headers || {},
  };
}

/**
 * Search for an anime on Gogoanime using the AniList title, then return the best match
 * @param {string} title - Anime title (romaji or english)
 * @param {number} year - Season year for better matching
 * @returns {Promise<string|null>} Gogoanime anime ID or null
 */
export async function findGogoanimeId(title, year) {
  try {
    const results = await searchGogoanime(title);
    if (results.length === 0) return null;

    // Try to match by year if provided
    if (year) {
      const yearMatch = results.find((r) => r.releaseDate && String(r.releaseDate).includes(String(year)));
      if (yearMatch) return yearMatch.id;
    }

    // Fallback to first result
    return results[0].id;
  } catch (err) {
    console.warn('Failed to find Gogoanime ID:', err.message);
    return null;
  }
}
