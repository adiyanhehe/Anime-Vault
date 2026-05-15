/**
 * Consumet API wrapper for fetching actual anime video streaming sources.
 * Uses Gogoanime as the source provider.
 * Fallback instances: https://consumet-api-rho.vercel.app, https://api.consumet.org
 */

const BASE_URLS = [
  'https://consumet-api-rho.vercel.app/anime/gogoanime',
  'https://api.consumet.org/anime/gogoanime',
];

const TIMEOUT_MS = 10000;

async function fetchWithFallback(endpoint) {
  let lastError = null;

  for (const base of BASE_URLS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${base}${endpoint}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content-type to avoid parsing non-JSON as JSON
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !contentType.includes('application/octet-stream')) {
        // Some Consumet instances return non-JSON error pages
        const text = await response.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error(`Non-JSON response from ${base} (HTML error page)`);
        }
        // Try JSON parse anyway
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(`Response is not valid JSON from ${base}`);
        }
      }

      const data = await response.json();
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`Consumet fetch failed for ${base}${endpoint}: ${err.message}`);
      // Try next fallback
    }
  }

  throw new Error(`All Consumet instances failed. Last error: ${lastError?.message}`);
}

/**
 * Search Gogoanime for an anime by title
 * @param {string} query - Anime title to search
 * @returns {Promise<Array>} List of anime results with id, title, image, etc.
 */
export async function searchGogoanime(query) {
  const data = await fetchWithFallback(`/${encodeURIComponent(query)}`);
  return data.results || [];
}

/**
 * Fetch episode list from Gogoanime
 * @param {string} animeId - Gogoanime anime ID (e.g. "attack-on-titan-2023")
 * @param {number} page - Page number
 * @returns {Promise<Array>} List of episodes with id, number, title
 */
export async function fetchGogoEpisodes(animeId, page = 1) {
  const data = await fetchWithFallback(`/info/${encodeURIComponent(animeId)}`);
  return data.episodes || [];
}

/**
 * Get streaming links for a specific episode
 * @param {string} episodeId - Gogoanime episode ID (e.g. "attack-on-titan-episode-1")
 * @returns {Promise<Object>} Streaming sources (multi-quality)
 */
export async function fetchEpisodeSources(episodeId) {
  const data = await fetchWithFallback(`/watch/${encodeURIComponent(episodeId)}`);
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