const MANGADEX_API = 'https://api.mangadex.org';

/**
 * Searches MangaDex for a manga by its title.
 * Returns the first matching manga's ID.
 */
export async function searchMangaDex(title) {
  try {
    const res = await fetch(`${MANGADEX_API}/manga?title=${encodeURIComponent(title)}&limit=5&includes[]=cover_art`);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      return data.data[0];
    }
    return null;
  } catch (err) {
    console.error('MangaDex search failed:', err);
    return null;
  }
}

/**
 * Fetches chapters for a given MangaDex manga ID.
 * Defaults to English chapters.
 */
export async function fetchMangaChapters(mangaId, offset = 0, limit = 100) {
  try {
    const res = await fetch(
      `${MANGADEX_API}/manga/${mangaId}/feed?translatedLanguage[]=en&limit=${limit}&offset=${offset}&order[chapter]=asc&includes[]=scanlation_group`
    );
    const data = await res.json();
    if (data.data) {
      return data.data
        .filter(chapter => chapter.attributes.pages > 0 && !chapter.attributes.externalUrl)
        .map(chapter => ({
          id: chapter.id,
          chapter: chapter.attributes.chapter,
          title: chapter.attributes.title,
          pages: chapter.attributes.pages,
          group: chapter.relationships.find(r => r.type === 'scanlation_group')?.attributes?.name || 'Unknown',
          volume: chapter.attributes.volume
        }));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch manga chapters:', err);
    return [];
  }
}

/**
 * Fetches the image URLs for a specific chapter ID.
 */
export async function fetchChapterPages(chapterId) {
  try {
    const res = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`);
    const data = await res.json();
    
    if (data.baseUrl) {
      return data.chapter.data.map(filename => 
        `${data.baseUrl}/data/${data.chapter.hash}/${filename}`
      );
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch chapter pages:', err);
    return [];
  }
}
