const API_URL = 'https://graphql.anilist.co';

async function postQuery(query, variables = {}, retries = 2) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status >= 500 && retries > 0) {
        console.warn(`AniList 500 error, retrying... (${retries} left)`);
        return postQuery(query, variables, retries - 1);
      }
      throw new Error(`AniList request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors?.length) {
      throw new Error(data.errors[0].message || 'AniList GraphQL error');
    }

    return data.data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('AniList request timed out. Please check your connection.');
    }
    if (retries > 0) {
      return postQuery(query, variables, retries - 1);
    }
    throw err;
  }
}

export function stripHtml(htmlText = '') {
  return htmlText.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export async function fetchTrendingAnime(page = 1, perPage = 18) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(sort: TRENDING_DESC, type: ANIME) {
          id
          idMal
          title { romaji english }
          description
          episodes
          coverImage { extraLarge large medium }
          bannerImage
          genres
          format
          averageScore
          seasonYear
        }
      }
    }
  `;

  const data = await postQuery(query, { page, perPage });
  return data.Page.media;
}

export async function searchAnime(search, type = 'ANIME', page = 1, perPage = 18) {
  const query = `
    query ($search: String, $type: MediaType, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: $type, sort: POPULARITY_DESC) {
          id
          idMal
          title { romaji english native }
          episodes
          chapters
          volumes
          coverImage { extraLarge large medium }
          bannerImage
          genres
          format
          averageScore
          seasonYear
        }
      }
    }
  `;

  const data = await postQuery(query, { search, type, page, perPage });
  return data.Page.media;
}

export async function fetchAnimeById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        id
        idMal
        title { romaji english native }
        description
        episodes
        status
        season
        seasonYear
        genres
        averageScore
        meanScore
        popularity
        format
        duration
        source
        studios { nodes { name } }
        trailer { id site thumbnail }
        startDate { year month day }
        endDate { year month day }
        coverImage { large extraLarge color }
        bannerImage
        nextAiringEpisode { episode timeUntilAiring }
        externalLinks { site url id }
        relations {
          nodes {
            id
            idMal
            type
            status
            format
            title { romaji english native }
            coverImage { large }
          }
          edges {
            relationType(version: 2)
            node { id }
          }
        }
        recommendations(page: 1, perPage: 6, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { romaji }
              coverImage { large medium }
            }
          }
        }
      }
    }
  `;

  const data = await postQuery(query, { id: Number(id) });
  return data.Media;
}

export async function fetchAiringAnime(page = 1, perPage = 18) {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { large }
          nextAiringEpisode { episode }
        }
      }
    }
  `;
  const data = await postQuery(query, { page, perPage });
  return data.Page.media;
}

export async function fetchAnimeBySeason(season, year, page = 1, perPage = 12) {
  const query = `
    query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(season: $season, seasonYear: $year, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji english }
          coverImage { extraLarge large }
          episodes
          format
          averageScore
        }
      }
    }
  `;
  const data = await postQuery(query, { season, year, page, perPage });
  return data.Page.media;
}
