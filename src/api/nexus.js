/* src/api/nexus.js */
/**
 * Centralized API wrapper for Anime Vault Nexus data.
 * Currently uses public Cinemeta/Anilist endpoints as a placeholder.
 * All functions return a standardized object shape.
 */

/** Utility fetch with error handling */
async function safeFetch(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  return res.json();
}

/** Fetch basic anime info including episodes and characters */
export async function fetchAnime(animeId) {
  // Using Cinemeta as source – returns meta with episodes.
  const CINEMETA_API = "https://v3-cinemeta.strem.io";
  const metaUrl = `${CINEMETA_API}/meta/anime/${animeId}.json`;
  const meta = await safeFetch(metaUrl);
  // Episodes list (if available)
  const episodes = meta?.episodes || [];

  // Fetch characters via AniList (public GraphQL endpoint)
  const ANILIST_GRAPHQL = "https://graphql.anilist.co";
  const query = `query ($id: Int) {
    Media(id: $id, type: ANIME) {
      characters(perPage: 20) {
        edges {
          node {
            name { full }
            image { large }
          }
        }
      }
    }
  }`;
  const variables = { id: Number(animeId) };
  const charResp = await safeFetch(ANILIST_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });
  const charEdges = charResp?.data?.Media?.characters?.edges || [];
  const characters = charEdges.map(e => ({
    name: e.node.name.full,
    image: e.node.image?.large
  }));

  return { ...meta, episodes, characters };
}

/** Placeholder fetch functions for other entities */
export async function fetchManga(mangaId) {
  // Similar to fetchAnime but using "manga" endpoint.
  const CINEMETA_API = "https://v3-cinemeta.strem.io";
  const metaUrl = `${CINEMETA_API}/meta/manga/${mangaId}.json`;
  const meta = await safeFetch(metaUrl);
  return meta;
}

export async function fetchCharacter(characterId) {
  // Not implemented – placeholder returning empty.
  return {};
}

export async function fetchStudio(studioId) {
  return {};
}

export async function fetchVoiceActor(actorId) {
  return {};
}

export async function fetchGenre(slug) {
  return {};
}

export async function fetchSchedule() {
  return [];
}

export async function fetchSeason(year, season) {
  return [];
}
