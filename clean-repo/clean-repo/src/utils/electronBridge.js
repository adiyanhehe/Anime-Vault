// src/utils/electronBridge.js
/**
 * electronBridge – a tiny wrapper that safely forwards Discord Rich Presence calls
 * to the Electron preload bridge when it exists. In a pure‑web environment the
 * bridge is undefined, so the functions become no‑ops (with a console warning).
 */

// Detect the preload‑exposed API (may be undefined in the browser)
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
    console.warn('electronBridge: setAnimeActivity called in a non‑Electron environment', activity);
  }
}

/**
 * Clear the activity – tells Discord the user is no longer watching.
 */
export function clearAnimeActivity() {
  if (_electronAPI && typeof _electronAPI.clearAnimeActivity === 'function') {
    _electronAPI.clearAnimeActivity();
  } else {
    console.warn('electronBridge: clearAnimeActivity called in a non‑Electron environment');
  }
}

// Export a default object for convenient destructuring imports.
export default { setAnimeActivity, clearAnimeActivity };
