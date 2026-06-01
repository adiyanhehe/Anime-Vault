// AnFire API client for Anime Vault
// Configure via environment variables (Vite):
// VITE_ANFIRE_API_URL - full URL to the API endpoint (e.g. http://localhost:3000/api.php)
// VITE_ANFIRE_API_KEY - API key for the AnFire API

const API_URL = import.meta.env.VITE_ANFIRE_API_URL || '';
const API_KEY = import.meta.env.VITE_ANFIRE_API_KEY || '';

function ensureConfigured() {
  if (!API_URL || !API_KEY) {
    throw new Error('AnFire API not configured. Set VITE_ANFIRE_API_URL and VITE_ANFIRE_API_KEY');
  }
}

async function request(params = {}) {
  ensureConfigured();

  const url = new URL(API_URL);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`AnFire API request failed: ${res.status}`);
  const data = await res.json();
  return data;
}

/**
 * Fetch full anime data by a direct anime page link (animefire.plus/animes/...).
 * Returns the API response object (includes `episodes`, `anime_title`, `anime_image`, etc.).
 */
export async function fetchAnimeByLink(animeLink, { force = false, update = false } = {}) {
  if (!animeLink) throw new Error('animeLink is required');
  const data = await request({ anime_link: animeLink, force: force ? 'true' : 'false', update: update ? 'true' : 'false' });
  return data;
}

/**
 * Fetch full anime data by slug (anime_slug). Returns API response object.
 */
export async function fetchAnimeBySlug(animeSlug, { force = false, update = false } = {}) {
  if (!animeSlug) throw new Error('animeSlug is required');
  const data = await request({ anime_slug: animeSlug, force: force ? 'true' : 'false', update: update ? 'true' : 'false' });
  return data;
}

/**
 * Convenience: return only `episodes` array from an anime link.
 */
export async function fetchEpisodesFromLink(animeLink) {
  const data = await fetchAnimeByLink(animeLink);
  return data?.episodes || [];
}

/**
 * Search interface: the upstream project exposes a search endpoint at index.php?search=...
 * This tries to derive a search endpoint from the configured API_URL by replacing api.php or /api route.
 * Returns an array of results: { url, image, title }
 */
export async function searchAnimes(query) {
  if (!query) return [];
  if (!API_URL) throw new Error('VITE_ANFIRE_API_URL not set');

  // Derive base (try to remove api.php or /api)
  let base = API_URL.replace(/\/api\.php$|\/api$|\/api\/$/, '');
  if (!base) base = API_URL;

  const searchUrl = new URL(base + '/index.php');
  searchUrl.searchParams.set('search', query);

  const res = await fetch(searchUrl.toString());
  if (!res.ok) throw new Error(`AnFire search request failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default {
  fetchAnimeByLink,
  fetchAnimeBySlug,
  fetchEpisodesFromLink,
  searchAnimes,
};
