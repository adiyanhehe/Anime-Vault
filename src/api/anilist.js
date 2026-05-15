const API_URL = 'https://graphql.anilist.co';

async function postQuery(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`AniList request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.errors?.length) {
    throw new Error(data.errors[0].message || 'AniList GraphQL error');
  }

  return data.data;
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
          title { romaji }
          episodes
          coverImage { large medium }
          genres
        }
      }
    }
  `;

  const data = await postQuery(query, { page, perPage });
  return data.Page.media;
}

export async function searchAnime(search, page = 1, perPage = 18) {
  const query = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, sort: POPULARITY_DESC) {
          id
          title { romaji }
          episodes
          coverImage { large medium }
          genres
        }
      }
    }
  `;

  const data = await postQuery(query, { search, page, perPage });
  return data.Page.media;
}

export async function fetchAnimeById(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title { romaji english }
        description
        episodes
        genres
        coverImage { large extraLarge }
      }
    }
  `;

  const data = await postQuery(query, { id: Number(id) });
  return data.Media;
}
