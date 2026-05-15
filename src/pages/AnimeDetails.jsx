import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchAnimeById, stripHtml } from '../api/anilist';

const UNLOCK_KEY = 'animevault_unlock_until';
const RECENTS_KEY = 'animevault_recently_viewed';
const PROGRESS_KEY = 'animevault_progress';

function AnimeDetails() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unlockUntil, setUnlockUntil] = useState(() => Number(localStorage.getItem(UNLOCK_KEY)) || 0);
  const [progress, setProgress] = useState(() => JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'));

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const media = await fetchAnimeById(id);
        setAnime(media);

        const recents = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
        const updated = [{ id: media.id, title: media.title.romaji }, ...recents.filter((item) => item.id !== media.id)].slice(0, 10);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
      } catch (err) {
        setError(err.message || 'Failed to load anime details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const isUnlocked = useMemo(() => Date.now() < unlockUntil, [unlockUntil]);
  const timeRemaining = useMemo(() => Math.max(0, unlockUntil - Date.now()), [unlockUntil]);
  const episodes = anime?.episodes || 12;

  function unlockWatch() {
    const until = Date.now() + 40 * 60 * 1000;
    setUnlockUntil(until);
    localStorage.setItem(UNLOCK_KEY, String(until));
  }

  function watchEpisode(ep) {
    if (!isUnlocked) return;
    const next = { ...progress, [anime.id]: ep };
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  }

  if (loading) return <p className="status">Loading anime details...</p>;
  if (error) return <p className="status error">{error}</p>;
  if (!anime) return null;

  return (
    <section className="details-page">
      <div className="detail-hero">
        <img
          className="detail-cover"
          src={anime.coverImage?.extraLarge || anime.coverImage?.large}
          alt={anime.title.romaji}
        />
        <div className="detail-hero-overlay" />
        <div className="detail-hero-copy">
          <span className="tag">Featured</span>
          <h1>{anime.title.romaji}</h1>
          <p>{stripHtml(anime.description).slice(0, 240)}...</p>
          <div className="detail-tags">
            <span>{anime.episodes || 'TBA'} Episodes</span>
            <span>{anime.genres?.join(' / ')}</span>
          </div>
          <div className="hero-buttons">
            <button className="button button-primary" onClick={() => watchEpisode(1)}>
              <span className="material-symbols-outlined">play_circle</span>
              Play Episode 1
            </button>
            <button className="button button-secondary" onClick={unlockWatch}>
              <span className="material-symbols-outlined">play_circle</span>
              Watch Ad to Unlock 40 min
            </button>
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-main glass-card">
          <div className="details-intro">
            <h2>Synopsis</h2>
            <p>{stripHtml(anime.description)}</p>
          </div>

          <div className="unlock-panel">
            <div>
              <h3>{isUnlocked ? 'Premium Access Unlocked' : 'Episode Queue Locked'}</h3>
              <p>
                {isUnlocked
                  ? `Unlocked for ${Math.ceil(timeRemaining / 60000)} more minutes.`
                  : 'Watch a short ad to unlock the next 40 minutes of premium episodes.'}
              </p>
            </div>
            <button className="button button-primary" onClick={unlockWatch}>
              Watch Ad to Unlock 40 min
            </button>
          </div>

          <div className="episodes-section">
            <div className="section-title">
              <h2>Episode List</h2>
              <span>{episodes} total</span>
            </div>
            <div className="episode-list">
              {Array.from({ length: episodes }, (_, index) => {
                const episode = index + 1;
                const isCurrent = progress[anime.id] === episode;
                return (
                  <button
                    key={episode}
                    type="button"
                    className={`episode-card ${isCurrent ? 'active' : ''}`}
                    disabled={!isUnlocked}
                    onClick={() => watchEpisode(episode)}
                  >
                    <strong>{String(episode).padStart(2, '0')}</strong>
                    <span>{isUnlocked ? `Play` : 'Locked'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="details-sidebar glass-card">
          <div className="sidebar-block">
            <h3>Quick Actions</h3>
            <button className="button button-primary full-width">Add to My List</button>
            <button className="button button-secondary full-width">Share Anime</button>
          </div>
          <div className="sidebar-block">
            <h3>You Might Also Like</h3>
            <div className="related-list">
              {anime.genres?.slice(0, 3).map((genre) => (
                <div key={genre} className="related-item">
                  <div className="related-icon">{genre[0]}</div>
                  <div>
                    <p>{genre}</p>
                    <span>Genre highlight</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default AnimeDetails;
