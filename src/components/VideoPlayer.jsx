import { useEffect, useRef, useState } from 'react';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import { Settings } from 'lucide-react';

import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

function VideoPlayer({ sources, poster, title, embedUrl, isZen }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [qualities, setQualities] = useState([]);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!sources || sources.length === 0) return;

    const sortedSources = [...sources].sort((a, b) => {
      const aQ = parseInt(a.quality) || 0;
      const bQ = parseInt(b.quality) || 0;
      return bQ - aQ;
    });

    setQualities(sortedSources);
    
    // Auto-select 1080p or 720p if available
    const preferred = sortedSources.find(s => s.quality === '1080p' || s.quality === '720p') || sortedSources[0];
    if (preferred) {
      setVideoUrl(preferred.url);
    }
  }, [sources]);

  if (embedUrl) {
    return (
      <div className={`video-player-wrapper-v2 embed-container ${isZen ? 'zen-active' : ''}`}>
        <iframe
          src={embedUrl}
          className="embed-iframe"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          title={title}
          referrerPolicy="no-referrer-when-downgrade"
          loading="lazy"
          // Zen Mode: No popups, no modals, just the player
          sandbox={isZen 
            ? "allow-scripts allow-same-origin allow-forms allow-presentation" 
            : undefined
          }
        />
      </div>
    );
  }

  if (!sources || sources.length === 0) {
    return (
      <div className="video-player-error">
        <Settings size={48} />
        <p>Initializing high-quality stream...</p>
      </div>
    );
  }

  return (
    <div className="video-player-wrapper-v2">
      <MediaPlayer
        ref={playerRef}
        title={title}
        src={videoUrl}
        playsInline
        aspectRatio="16/9"
        crossOrigin
        autoPlay
      >
        <MediaProvider>
          <Poster
            className="vds-poster"
            src={poster}
            alt={title}
          />
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>
      
      {qualities.length > 1 && (
        <div className="quality-overlay">
          {qualities.map((q, i) => (
            <button
              key={i}
              className={`quality-badge ${videoUrl === q.url ? 'active' : ''}`}
              onClick={() => setVideoUrl(q.url)}
            >
              {q.quality}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default VideoPlayer;