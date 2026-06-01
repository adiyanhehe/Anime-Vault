const ANIKOTO_API = "https://anikotoapi.site";
const ANIKOTO_TIMEOUT_MS = 4500;
const ANIKOTO_CACHE_TTL = 1000 * 60 * 60 * 6;

function normalizeTitle(value = "") {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|a|an|season|part|cour)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCache(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < ANIKOTO_CACHE_TTL) return data;
  } catch (_) {}
  return null;
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch (_) {}
}

async function fetchJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ANIKOTO_TIMEOUT_MS);

  try {
    const response = await fetch(`${ANIKOTO_API}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok)
      throw new Error(`Anikoto request failed: ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.anime)) return payload.anime;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function getAnimeTitle(item) {
  return (
    item?.title ||
    item?.name ||
    item?.anime?.title ||
    item?.canonicalTitle ||
    item?.englishTitle ||
    ""
  );
}

function getAnimeId(item) {
  return item?.id || item?.anime_id || item?.series_id || item?.slug;
}

function scoreTitle(candidate, target) {
  const cleanCandidate = normalizeTitle(candidate);
  const cleanTarget = normalizeTitle(target);
  if (!cleanCandidate || !cleanTarget) return 0;
  if (cleanCandidate === cleanTarget) return 1;
  if (
    cleanCandidate.includes(cleanTarget) ||
    cleanTarget.includes(cleanCandidate)
  )
    return 0.86;

  const candidateWords = new Set(cleanCandidate.split(" "));
  const targetWords = new Set(cleanTarget.split(" "));
  const overlap = [...targetWords].filter((word) =>
    candidateWords.has(word),
  ).length;
  return overlap / Math.max(targetWords.size, candidateWords.size);
}

async function findAnikotoSeriesId(title) {
  const cacheKey = `animevault_anikoto_series_${normalizeTitle(title).replace(/\s+/g, "_")}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // The public Anikoto API documents recent-anime + series endpoints. Search a
  // small recent window because most currently airing/problem titles are recent,
  // but do not block the player for too long.
  for (let page = 1; page <= 4; page += 1) {
    const payload = await fetchJson(`/recent-anime?page=${page}&per_page=50`);
    const items = unwrapList(payload);
    const ranked = items
      .map((item) => ({ item, score: scoreTitle(getAnimeTitle(item), title) }))
      .filter((entry) => entry.score >= 0.72)
      .sort((a, b) => b.score - a.score);

    const id = getAnimeId(ranked[0]?.item);
    if (id) {
      setCache(cacheKey, id);
      return id;
    }
  }

  return null;
}

function pickEpisode(episodes = [], episodeNumber = 1, language = "sub") {
  const episode =
    episodes.find(
      (item) =>
        Number(item?.number || item?.episode || item?.episode_number) ===
        Number(episodeNumber),
    ) ||
    episodes[episodeNumber - 1] ||
    episodes[0];
  const embedUrl = episode?.embed_url || episode?.embedUrl || episode?.embed;
  if (typeof embedUrl === "string") return embedUrl;
  return (
    embedUrl?.[language] ||
    embedUrl?.sub ||
    embedUrl?.dub ||
    episode?.url ||
    null
  );
}

export function buildAnikotoSearchUrl(title) {
  return `https://anikoto.to/search?keyword=${encodeURIComponent(title)}`;
}

export async function fetchAnikotoEmbedByTitle(
  title,
  episodeNumber = 1,
  language = "sub",
) {
  if (!title) return null;
  const cacheKey = `animevault_anikoto_embed_${normalizeTitle(title).replace(/\s+/g, "_")}_${episodeNumber}_${language}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const seriesId = await findAnikotoSeriesId(title);
  if (!seriesId) return null;

  const payload = await fetchJson(`/series/${encodeURIComponent(seriesId)}`);
  const episodes =
    payload?.episodes ||
    payload?.data?.episodes ||
    payload?.anime?.episodes ||
    [];
  const embedUrl = pickEpisode(episodes, episodeNumber, language);
  if (embedUrl) setCache(cacheKey, embedUrl);
  return embedUrl;
}
