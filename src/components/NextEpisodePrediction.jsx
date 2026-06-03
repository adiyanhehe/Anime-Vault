import { useEffect, useState } from 'react';
import { Clock, AlertCircle, Check } from 'lucide-react';

/**
 * NextEpisodePrediction Component
 * Displays countdown to next episode airing and full anime info
 * 
 * Props:
 *   - nextAiringEpisode: { episode, airingAt }
 *   - currentEpisode: { number }
 *   - status: anime status (AIRING, FINISHED, etc)
 */
function NextEpisodePrediction({ nextAiringEpisode, currentEpisode, status, totalEpisodes }) {
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!nextAiringEpisode?.airingAt) return;

    const calculateCountdown = () => {
      const now = Date.now();
      const airingTime = nextAiringEpisode.airingAt * 1000; // Convert to ms
      const diff = airingTime - now;

      if (diff <= 0) {
        setCountdown(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    // Calculate immediately
    calculateCountdown();

    // Update every second
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextAiringEpisode?.airingAt]);

  if (!nextAiringEpisode) {
    return (
      <div className="next-episode-card finished">
        <div className="episode-status">
          <Check size={24} />
          <div>
            <h3>Series Finished</h3>
            <p>All {totalEpisodes} episodes have aired.</p>
          </div>
        </div>
      </div>
    );
  }

  const airDate = new Date(nextAiringEpisode.airingAt * 1000);
  const formattedDate = airDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = airDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="next-episode-card airing">
      <div className="episode-header">
        <div className="episode-badge">
          <Clock size={18} />
          <span>NEXT EPISODE</span>
        </div>
        <span className="live-indicator">IN PRODUCTION</span>
      </div>

      <div className="episode-info">
        <h2>Episode {nextAiringEpisode.episode}</h2>
        <p className="air-date">
          Airs: <strong>{formattedDate}</strong> at <strong>{formattedTime}</strong>
        </p>
      </div>

      {countdown && (
        <div className="countdown-container">
          <div className="countdown-label">Time Until Release</div>
          <div className="countdown-timer">
            {countdown.days > 0 && (
              <div className="countdown-unit">
                <span className="number">{String(countdown.days).padStart(2, '0')}</span>
                <span className="label">Days</span>
              </div>
            )}
            <div className="countdown-unit">
              <span className="number">{String(countdown.hours).padStart(2, '0')}</span>
              <span className="label">Hours</span>
            </div>
            <div className="countdown-unit">
              <span className="number">{String(countdown.minutes).padStart(2, '0')}</span>
              <span className="label">Minutes</span>
            </div>
            <div className="countdown-unit">
              <span className="number">{String(countdown.seconds).padStart(2, '0')}</span>
              <span className="label">Seconds</span>
            </div>
          </div>
        </div>
      )}

      <div className="episode-note">
        <AlertCircle size={14} />
        <span>Release times are based on JST (Japan Standard Time)</span>
      </div>
    </div>
  );
}

export default NextEpisodePrediction;
