import { useEffect, useRef, useState } from 'react';

function VideoPlayer({ sources, poster, title, onNext, onPrev, hasNext, hasPrev, episodeNum, totalEpisodes }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [quality, setQuality] = useState('auto');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const controlsTimeout = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!sources || sources.length === 0) return;

    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setError('');

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Find the best source
    const sortedSources = [...sources].sort((a, b) => {
      const aQ = a.quality ? parseInt(a.quality) : 0;
      const bQ = b.quality ? parseInt(b.quality) : 0;
      return bQ - aQ;
    });

    const bestSource = sortedSources[0];
    if (!bestSource) {
      setError('No video source available');
      setLoading(false);
      return;
    }

    const url = bestSource.url;
    if (!url) {
      setError('Video source URL is empty');
      setLoading(false);
      return;
    }
    const isM3U8 = url.includes('.m3u8') || url.includes('master.m3u') || url.includes('master.txt');

    if (isM3U8) {
      // Use HLS.js for m3u8 streams
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            video.play().catch(() => {});
          });
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              setError('Failed to load video stream');
              setLoading(false);
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          video.src = url;
          video.addEventListener('loadedmetadata', () => {
            setLoading(false);
            video.play().catch(() => {});
          });
          video.addEventListener('error', () => {
            setError('Failed to load video');
            setLoading(false);
          });
        }
      });
    } else {
      // Direct source (mp4, etc.)
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
        setError('Failed to load video');
        setLoading(false);
      });
    }

    // If we timed out loading, stop showing spinner
    const timeout = setTimeout(() => setLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, [sources]);

  // Show controls on mouse move, hide after inactivity
  function handleMouseMove() {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      setDuration(video.duration);
    }
  }

  function handleSeek(e) {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  }

  function handleVolumeChange(e) {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
  }

  function toggleFullscreen() {
    if (!playerRef.current) return;
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="video-player"
      ref={playerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        className="video-element"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => setLoading(false)}
        playsInline
      />

      {/* Loading Spinner */}
      {loading && !error && (
        <div className="video-loading">
          <div className="spinner" />
          <span>Loading stream...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="video-error">
          <span className="material-symbols-outlined">error_outline</span>
          <p>{error}</p>
        </div>
      )}

      {/* Big Play Button (when paused) */}
      {!isPlaying && !loading && !error && (
        <button className="video-big-play" onClick={togglePlay}>
          <span className="material-symbols-outlined">play_arrow</span>
        </button>
      )}

      {/* Controls Overlay */}
      <div className={`video-controls ${showControls ? 'visible' : ''}`}>
        {/* Title Bar */}
        <div className="video-title-bar">
          <div className="video-title-left">
            <span className="material-symbols-outlined">tv</span>
            <span>{title || 'Now Playing'}</span>
          </div>
          <div className="video-title-center">
            {episodeNum && totalEpisodes && (
              <span>Episode {episodeNum} of {totalEpisodes}</span>
            )}
          </div>
          <div className="video-title-right">
            <button className="video-btn" onClick={() => document.exitFullscreen()}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Center Navigation Buttons */}
        <div className="video-nav-center">
          {hasPrev && (
            <button className="video-btn video-btn-nav" onClick={onPrev}>
              <span className="material-symbols-outlined">skip_previous</span>
            </button>
          )}
          <button className="video-btn video-btn-play" onClick={togglePlay}>
            <span className="material-symbols-outlined">
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          {hasNext && (
            <button className="video-btn video-btn-nav" onClick={onNext}>
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          )}
        </div>

        {/* Bottom Controls */}
        <div className="video-bottom-controls">
          {/* Progress Bar */}
          <div className="video-progress" onClick={handleSeek}>
            <div className="video-progress-track">
              <div className="video-progress-fill" style={{ width: `${progress}%` }} />
              <div className="video-progress-thumb" style={{ left: `${progress}%` }} />
            </div>
          </div>

          <div className="video-bottom-row">
            <div className="video-bottom-left">
              <button className="video-btn" onClick={togglePlay}>
                <span className="material-symbols-outlined">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <span className="video-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            <div className="video-bottom-right">
              <div className="video-volume">
                <span className="material-symbols-outlined">
                  {volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="video-volume-slider"
                />
              </div>

              {hasNext && (
                <button className="video-btn" onClick={onNext}>
                  <span className="material-symbols-outlined">skip_next</span>
                </button>
              )}

              <button className="video-btn" onClick={toggleFullscreen}>
                <span className="material-symbols-outlined">
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;