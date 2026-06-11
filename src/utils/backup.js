const PREFIX = 'animevault_';

export const BACKUP_KEYS = [
  'saved',
  'savedOrder',
  'history',
  'progress',
  'watched',
  'homeRowOrder',
  'homeRowVisible',
  'homeViewMode',
  'startPage',
  'ageLimit',
  'ratingCountry',
  'watchedThreshold',
  'accentColor',
  'fontSize',
  'compactMode',
  'reduceAnimations',
  'librarySort',
  'historyEnabled',
  'tmdbLang',
];

export function collectBackupData() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw !== null) data[key] = JSON.parse(raw);
    } catch {}
  }
  return data;
}

export function restoreBackupData(data) {
  if (!data || typeof data !== 'object') throw new Error('Invalid backup data');
  for (const key of BACKUP_KEYS) {
    if (data[key] !== undefined && data[key] !== null) {
      localStorage.setItem(PREFIX + key, JSON.stringify(data[key]));
    }
  }
}
