// src/utils/watchDetector.js
/**
 * WatchDetector – a tiny singleton that tracks whether a video is being watched
 * in the current browser tab. It emits "watch-start" and "watch-stop" events.
 *
 * Usage example (plain JS):
 *   import WatchDetector from '@/utils/watchDetector';
 *   const video = document.querySelector('video');
 *   WatchDetector.attach(video, 'My Anime – Ep 1');
 *   WatchDetector.on('watch-start', ({title}) => console.log('Now watching', title));
 */

class WatchDetector {
  constructor() {
    this._subscribers = { "watch-start": [], "watch-stop": [] };
    this._currentVideo = null; // { title, element }
    this._isVisible = true;

    // Page visibility handling – treat hidden tab as a stop.
    document.addEventListener("visibilitychange", () => {
      this._isVisible = !document.hidden;
      if (!this._isVisible && this._currentVideo) {
        this._emit("watch-stop", { title: this._currentVideo.title });
        this._currentVideo = null;
      }
    });
  }

  /** Register an event listener */
  on(event, fn) {
    if (this._subscribers[event]) this._subscribers[event].push(fn);
  }

  /** Unregister an event listener */
  off(event, fn) {
    if (!this._subscribers[event]) return;
    this._subscribers[event] = this._subscribers[event].filter(l => l !== fn);
  }

  /** Internal emitter */
  _emit(event, payload) {
    this._subscribers[event].forEach(fn => fn(payload));
  }

  /**
   * Attach a <video> element and give it a human‑readable title.
   * Call this once per video component when the element is mounted.
   * @param {HTMLVideoElement} videoEl
   * @param {string} title
   */
  attach(videoEl, title) {
    if (!videoEl || !(videoEl instanceof HTMLVideoElement)) return;

    const start = () => {
      // Only emit when the page is visible.
      if (this._isVisible) {
        this._currentVideo = { title, element: videoEl };
        this._emit("watch-start", {
          title,
          currentTime: videoEl.currentTime,
        });
      }
    };

    const stop = () => {
      if (this._currentVideo && this._currentVideo.element === videoEl) {
        this._emit("watch-stop", { title });
        this._currentVideo = null;
      }
    };

    videoEl.addEventListener("play", start);
    videoEl.addEventListener("playing", start);
    videoEl.addEventListener("pause", stop);
    videoEl.addEventListener("ended", stop);
    videoEl.addEventListener("abort", stop);
    videoEl.addEventListener("emptied", stop);
    // Optional: keep track of seeking while playing.
    videoEl.addEventListener("seeked", () => {
      if (!videoEl.paused && this._isVisible) start();
    });
  }
}

// Export a singleton instance.
export default new WatchDetector();
