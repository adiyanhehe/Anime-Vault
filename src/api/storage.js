/* src/api/storage.js */
/** Helper to safely access localStorage */
function safeLS(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error('localStorage error', e);
    return defaultValue;
  }
}

/** Watchlist */
export function getWatchlist() {
  return safeLS('watchlist', []);
}
export function setWatchlist(list) {
  localStorage.setItem('watchlist', JSON.stringify(list));
}

/** Reading List */
export function getReadingList() {
  return safeLS('readingList', []);
}
export function setReadingList(list) {
  localStorage.setItem('readingList', JSON.stringify(list));
}

/** Progress */
export function getProgress() {
  return safeLS('progress', {});
}
export function setProgress(progress) {
  localStorage.setItem('progress', JSON.stringify(progress));
}

/** Collections */
export function getCollections() {
  return safeLS('collections', []);
}
export function setCollections(cols) {
  localStorage.setItem('collections', JSON.stringify(cols));
}
