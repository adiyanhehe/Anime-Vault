# Continuation Task: Fix iframe Sandbox for Series/K-Dramas & Miruro Server

## Project Overview
Anime-Vault is a React app (Vite) for watching anime, series, and movies via iframe embeds. The app has two video player paths:
- **Anime (TV Shows)**: Uses `VideoPlayer.jsx` component loaded via `AnimeDetails.jsx`
- **Series/K-Dramas/Movies**: Uses `MovieWatch.jsx` component loaded via `DramasMovies.jsx`

## What Has Been Done

### 1. VideoPlayer.jsx (Anime Player)
- File: `src/components/VideoPlayer.jsx`
- **KEPT** the `sandbox` attribute on the iframe (line 49): `sandbox="allow-same-origin allow-scripts allow-autoplay allow-fullscreen allow-picture-in-picture"`
- Updated the stale `isZoro` variable to `isMiruro` (since ZoroTV was replaced with Miruro)

### 2. AnimeDetails.jsx (Server List)
- File: `src/pages/AnimeDetails.jsx`
- **Replaced ZoroTV server** with a **Miruro** server:
  - Old: Used search URL `https://zorotv.com.ro/?s=...` (title-based search)
  - Current: Uses embed URL `https://miruro.ro/embed/anime/${malId}/${ep}` or `https://miruro.ro/embed/tv/${tmdbId}/1/${ep}`
- Changed `DEFAULT_SERVER` from `'ZoroTV'` to `'Miruro'`

### 3. MovieWatch.jsx (Series/K-Dramas/Movies Player)
- File: `src/pages/MovieWatch.jsx`
- **NO sandbox attribute** on the iframe (line 487-490) — correctly absent
- Fixed the 2embed TV URL format in **3 places** from `&s=` to `?s=`:
  - Line 275: `getPlayerUrl()` — Server 2 (2Embed) URL
  - Lines 135-136: `resolveFrom2EmbedXps()` — HLS resolver embed URLs

## Remaining Issues

### Issue 1: Series/K-Dramas still show "iframe sandbox detected" error
The user reports that series and K-dramas still show an "iframe sandbox detected" error even after fixing the 2embed URL format. Possible causes to investigate:

1. **The 2embed.cc embedtv URL format might be wrong entirely** — Check how 2embed actually formats TV series URLs. Maybe it needs a different structure like `/embedtv.php?file=...` or the IMDB ID format is wrong.

2. **The VidLink server (Server 1) might also have an issue** — The `activeServer` default is `'autoembed'` (line 13). When the user selects "Server 1 (VidLink)" the URL is `https://vidlink.pro/tv/${imdbId}/${s}/${e}`. This might also be blocked.

3. **The embed provider might be blocking based on referrer** — The iframe in MovieWatch doesn't have a `referrerPolicy` that would help bypass blocks. Currently it uses `referrerPolicy="origin-when-cross-origin"`.

### Issue 2: Miruro embed server might not work for all anime
The Miruro server uses `https://miruro.ro/embed/anime/${malId}/${ep}` — this might not work for all anime since we don't know if Miruro's embed format actually supports this path structure. If it doesn't work, users would need to switch to another server like VidLink.

### Issue 3: The "Local HLS Player" server in MovieWatch
The HLS resolver at lines 121-227 tries to resolve m3u8 streams, but it goes through CORS proxies. If the 2Embed XPS resolution fails, it auto-switches to VidLink after 2.5 seconds. This fallback might not be working properly.

## Files to Examine

### Primary Files:
- `src/pages/MovieWatch.jsx` — Full file, main player for series/k-dramas/movies
- `src/pages/AnimeDetails.jsx` — Server definitions (around lines 54-177)
- `src/components/VideoPlayer.jsx` — Iframe component used for anime

### Server Definitions in AnimeDetails.jsx:
```js
const SERVERS = [
  // ... various embed servers like VidLink, VidsrcICU, VidsrcCC, etc.
  {
    key: 'Miruro',
    label: 'Miruro • Embed (Recommended)',
    build: ({ malId, tmdbId, ep }) => {
      if (malId) return `https://miruro.ro/embed/anime/${malId}/${ep}`;
      if (tmdbId) return `https://miruro.ro/embed/tv/${tmdbId}/1/${ep}`;
      return null;
    },
  },
  // ... Native scraper
];
const DEFAULT_SERVER = 'Miruro';
```

## Requirements for the Next AI

1. **Verify the 2embed TV URL format is correct** — Test `https://www.2embed.cc/embedtv/ttXXXXXXX?season=1&episode=1` vs `https://www.2embed.cc/embedtv/ttXXXXXXX?s=1&e=1` vs alternative formats. The series URL might need `/embedtv.php` or a different parameter structure.

2. **If 2embed doesn't work for series, try alternative embed sources** — Consider adding more server options in MovieWatch that work reliably for series.

3. **Fix any remaining "iframe sandbox detected" issues** — Debug why the error still shows. Options include:
   - Changing the referrerPolicy on the iframe
   - Adding loading=lazy or other attributes
   - Completely different embed URL format
   - Using a different embed provider as the default for series

4. **Test all changes** by navigating to:
   - A series/K-drama from Dramas & Movies page
   - A movie from Dramas & Movies page (movies should work fine)
   - An anime from the anime search (should work with Miruro or fallback)

5. **Build check**: Run `npm run build` to ensure no compilation errors after changes.

## Project Setup
- Framework: React (Vite)
- Package manager: npm
- Run `npm run dev` to start development server
- No TypeScript — all JSX files
- Route for anime: `/anime/:id` → AnimeDetails.jsx
- Route for series/movies: `/watch/:type/:id` → MovieWatch.jsx