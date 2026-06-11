const PREFIX = 'animevault_';

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {}
  },
  clearAll() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
};

export const STORAGE_KEYS = {
  API_KEY: 'apikey',
  WATCH_PROGRESS: 'progress',
  WATCHED: 'watched',
  HISTORY: 'history',
  SAVED: 'saved',
  SAVED_ORDER: 'savedOrder',
  LOCAL_FILES: 'localFiles',
  DOWNLOAD_PATH: 'downloadPath',
  START_PAGE: 'startPage',
  AGE_LIMIT: 'ageLimit',
  RATING_COUNTRY: 'ratingCountry',
  WATCHED_THRESHOLD: 'watchedThreshold',
  HOME_ROW_ORDER: 'homeRowOrder',
  HOME_ROW_VISIBLE: 'homeRowVisible',
  HOME_VIEW_MODE: 'homeViewMode',
  AUTO_CHECK_UPDATES: 'autoCheckUpdates',
  SUBTITLE_ENABLED: 'subtitleDownload',
  SUBTITLE_LANG: 'subtitleLang',
  SUBDL_API_KEY: 'subdlApiKey',
  WYZIE_API_KEY: 'wyzieApiKey',
  ACCENT_COLOR: 'accentColor',
  ACCENT_IN_PLAYER: 'accentInPlayer',
  THEME: 'theme',
  CUSTOM_THEME_VARS: 'customThemeVars',
  FONT_SIZE: 'fontSize',
  COMPACT_MODE: 'compactMode',
  REDUCE_ANIMATIONS: 'reduceAnimations',
  LIBRARY_SORT: 'librarySort',
  HISTORY_ENABLED: 'historyEnabled',
  NOTIFY_DOWNLOAD_COMPLETE: 'notifyDownloadComplete',
  NOTIFY_NEW_EPISODE: 'notifyNewEpisode',
  TMDB_LANG: 'tmdbLang',
  INTRO_SKIP_MODE: 'introSkipMode',
  AUTOPLAY_NEXT_ENABLED: 'autoplayNextEnabled',
  AUTOPLAY_NEXT_DURATION: 'autoplayNextDuration',
  AUTOPLAY_NEXT_LAYOUT: 'autoplayNextLayout',
  DL_SORT_BY: 'dlSortBy',
  DL_SORT_DIR: 'dlSortDir',
  DL_SHOW_UNTRACKED: 'dlShowUntracked',
  EPISODE_RELEASE_CACHE: 'episodeReleaseCache',
  SOURCE_FAILOVER_CACHE: 'sourceFailoverCache',
};

export const getApiKey = () => storage.get(STORAGE_KEYS.API_KEY);

const FAILOVER_CACHE_MAX = 200;

export const getFailoverSource = (epKey) => {
  const cache = storage.get(STORAGE_KEYS.SOURCE_FAILOVER_CACHE) || {};
  return cache[epKey]?.sourceId || null;
};

export const setFailoverSource = (epKey, sourceId) => {
  const cache = storage.get(STORAGE_KEYS.SOURCE_FAILOVER_CACHE) || {};
  const keys = Object.keys(cache);
  if (keys.length >= FAILOVER_CACHE_MAX) {
    const evict = keys.slice(0, keys.length - FAILOVER_CACHE_MAX + 1);
    evict.forEach((k) => delete cache[k]);
  }
  cache[epKey] = { sourceId, ts: Date.now() };
  storage.set(STORAGE_KEYS.SOURCE_FAILOVER_CACHE, cache);
};

export const clearFailoverSource = (epKey) => {
  const cache = storage.get(STORAGE_KEYS.SOURCE_FAILOVER_CACHE) || {};
  if (cache[epKey] !== undefined) {
    delete cache[epKey];
    storage.set(STORAGE_KEYS.SOURCE_FAILOVER_CACHE, cache);
  }
};

export const isElectron = typeof window !== 'undefined' && !!window.electron;

export function formatBytes(bytes) {
  if (bytes === null || bytes === undefined) return '…';
  if (bytes === -1) return null;
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024)
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

const _isElectronSecure =
  typeof window !== 'undefined' && !!window.electron?.secureGet;

export const secureStorage = {
  async get(key) {
    if (!_isElectronSecure) return null;
    return window.electron.secureGet(key);
  },
  async set(key, value) {
    if (!_isElectronSecure) return;
    return window.electron.secureSet(key, value ?? '');
  },
};

export async function clearAppCaches() {
  if (isElectron) {
    try {
      await window.electron.clearAppCache?.();
    } catch {}
  }
  localStorage.removeItem('animevault_anilistCache');
  localStorage.removeItem('animevault_episodeGroupCache');
  localStorage.removeItem('animevault_aniskipCache');
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('dlDur_')) localStorage.removeItem(key);
  }
}
