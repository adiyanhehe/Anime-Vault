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
    <section className="details">
      <img src={anime.coverImage?.extraLarge || anime.coverImage?.large} alt={anime.title.romaji} className="hero" />
      <div>
        <h1>{anime.title.romaji}</h1>
        <p>{stripHtml(anime.description)}</p>
        <p><strong>Episodes:</strong> {anime.episodes || 'TBA'}</p>
        <p><strong>Genres:</strong> {anime.genres?.join(', ')}</p>
        <button className="watch-btn">Watch Now</button>
        <div className="unlock-box">
          <p>{isUnlocked ? 'Unlocked for ad-free window!' : 'Episodes locked after preview.'}</p>
          <button onClick={unlockWatch}>Watch Ad to Unlock 40 min</button>
        </div>

        <h2>Episode List</h2>
        <div className="episode-list">
          {Array.from({ length: episodes }, (_, i) => i + 1).map((ep) => (
            <button
              key={ep}
              onClick={() => watchEpisode(ep)}
              className={`episode ${progress[anime.id] === ep ? 'active' : ''}`}
              disabled={!isUnlocked}
            >
              Episode {ep} {!isUnlocked ? '🔒' : ''}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AnimeDetails;
