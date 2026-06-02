// src/utils/electronBridge.js
/**
 * electronBridge – a tiny wrapper that safely forwards Electron-only calls
 * to the preload bridge when it exists. In a pure-web environment the bridge
 * is undefined, so the functions become no-ops (with a console warning).
 */

// Detect the preload-exposed API (may be undefined in the browser)
const _electronAPI = typeof window !== 'undefined' && window.electronAPI ? window.electronAPI : null;

/**
 * Set the current anime activity (title, episode, cover, url).
 * @param {object} activity – same shape expected by the Electron preload.
 */
export function setAnimeActivity(activity) {
  if (_electronAPI && typeof _electronAPI.setAnimeActivity === 'function') {
    _electronAPI.setAnimeActivity(activity);
  } else {
    // Browser fallback – no Electron, just log for debugging.
    console.warn('electronBridge: setAnimeActivity called in a non-Electron environment', activity);
  }
}

/**
 * Clear the activity – tells Discord the user is no longer watching.
 */
export function clearAnimeActivity() {
  if (_electronAPI && typeof _electronAPI.clearAnimeActivity === 'function') {
    _electronAPI.clearAnimeActivity();
  } else {
    console.warn('electronBridge: clearAnimeActivity called in a non-Electron environment');
  }
}

export function getUpdateStatus() {
  return _electronAPI?.updates?.getStatus?.() ?? Promise.resolve({
    status: 'web',
    message: 'Desktop auto updates are only available in the installed app.',
    progress: 0,
  });
}

export function checkForUpdates() {
  return _electronAPI?.updates?.check?.() ?? getUpdateStatus();
}

export function installUpdate() {
  return _electronAPI?.updates?.install?.() ?? Promise.resolve(false);
}

export function onUpdateStatus(callback) {
  if (_electronAPI?.updates?.onStatus) return _electronAPI.updates.onStatus(callback);
  return () => {};
}

// Export a default object for convenient destructuring imports.
export default {
  setAnimeActivity,
  clearAnimeActivity,
  getUpdateStatus,
  checkForUpdates,
  installUpdate,
  onUpdateStatus,
};
