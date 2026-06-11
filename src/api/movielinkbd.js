
/*
 * src/api/movielinkbd.js - Scraping module for movielinkbd.shop
 *
 * Uses CORS proxy to bypass client-side restrictions
 * Note: movielinkbd may have Cloudflare protection that requires a proxy
 */

// Base URL for movielinkbd
const BASE_URL = 'https://movielinkbd.shop';

// CORS proxy to bypass client-side restrictions
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function buildProxyUrl(url) {
  return CORS_PROXY + encodeURIComponent(url);
}

// Extract text from HTML (simple helper)
function extractText(html, selector) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const el = doc.querySelector(selector);
    return el ? el.textContent.trim() : '';
  } catch (e) {
    console.warn('Failed to extract text:', e);
    return '';
  }
}

// Extract multiple elements
function extractAll(html, selector) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return Array.from(doc.querySelectorAll(selector));
  } catch (e) {
    console.warn('Failed to extract elements:', e);
    return [];
  }
}

// Fetch homepage content (latest movies/shows)
export async function fetchLatestContent(page = 1, type = 'all') {
  try {
    const url = `${BASE_URL}/page/${page}`;
    const proxyUrl = buildProxyUrl(url);
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const items = extractAll(html, '.post-item');

    return items.map((item) => {
      const titleEl = item.querySelector('.post-title a');
      const posterEl = item.querySelector('.post-thumbnail img');
      const qualityEl = item.querySelector('.quality');
      const typeEl = item.querySelector('.type');

      return {
        id: titleEl?.getAttribute('href')?.split('/').filter(Boolean).pop(),
        title: titleEl?.textContent?.trim() || 'Untitled',
        poster: posterEl?.getAttribute('src') || '',
        quality: qualityEl?.textContent?.trim() || '',
        type: typeEl?.textContent?.trim() || 'movie',
        url: titleEl?.getAttribute('href') || ''
      };
    }).filter((item) => item.id);

  } catch (error) {
    console.error('Error fetching latest content:', error);
    return [];
  }
}

// Fetch detailed media info (including download links)
export async function fetchMediaDetails(mediaId) {
  try {
    const url = `${BASE_URL}/${mediaId}`;
    const proxyUrl = buildProxyUrl(url);
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract basic info
    const title = extractText(html, '.entry-title');
    const poster = extractAll(html, '.entry-content img')[0]?.getAttribute('src') || '';
    const description = extractText(html, '.entry-content');
    const year = title?.match(/\((\d{4})\)/)?.[1] || '';

    // Extract download links (this will need adjustment based on actual site structure)
    const downloadLinks = extractAll(html, 'a[href*="drive.google.com"], a[href*="mega.nz"], a[href*="mediafire.com"]').map((link) => ({
      url: link.getAttribute('href'),
      name: link.textContent?.trim() || 'Download',
      quality: link.textContent?.match(/\d{3,4}p/)?.[0] || 'Unknown'
    }));

    // Extract subtitle links (if any)
    const subtitleLinks = extractAll(html, 'a[href*=".srt"], a[href*=".vtt"]').map((link) => ({
      url: link.getAttribute('href'),
      language: link.textContent?.trim() || 'English'
    }));

    return {
      id: mediaId,
      title,
      poster,
      description,
      year,
      downloadLinks,
      subtitleLinks,
      url
    };

  } catch (error) {
    console.error('Error fetching media details:', error);
    return null;
  }
}

// Search movielinkbd
export async function searchContent(query) {
  try {
    const url = `${BASE_URL}/?s=${encodeURIComponent(query)}`;
    const proxyUrl = buildProxyUrl(url);
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const items = extractAll(html, '.post-item');

    return items.map((item) => {
      const titleEl = item.querySelector('.post-title a');
      const posterEl = item.querySelector('.post-thumbnail img');
      const qualityEl = item.querySelector('.quality');
      const typeEl = item.querySelector('.type');

      return {
        id: titleEl?.getAttribute('href')?.split('/').filter(Boolean).pop(),
        title: titleEl?.textContent?.trim() || 'Untitled',
        poster: posterEl?.getAttribute('src') || '',
        quality: qualityEl?.textContent?.trim() || '',
        type: typeEl?.textContent?.trim() || 'movie',
        url: titleEl?.getAttribute('href') || ''
      };
    }).filter((item) => item.id);

  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}

export default {
  fetchLatestContent,
  fetchMediaDetails,
  searchContent
};

