import { useEffect, useMemo, useState } from 'react';
import AnimeCard from '../components/AnimeCard';
import { fetchTrendingAnime } from '../api/anilist';

const FAVORITES_KEY = 'animevault_favorites';
const RECENTS_KEY = 'animevault_recently_viewed';
const PROGRESS_KEY = 'animevault_progress';

function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
  const [recentlyViewed, setRecentlyViewed] = useState(() => JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'));
  const [progress] = useState(() => JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await fetchTrendingAnime();
        setAnimeList(data);
      } catch (err) {
        setError(err.message || 'Failed to load trending anime');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const recentMap = useMemo(() => new Map(recentlyViewed.map((item) => [item.id, item])), [recentlyViewed]);

  function toggleFavorite(anime) {
    setFavorites((current) => {
      if (current.some((item) => item.id === anime.id)) {
        return current.filter((item) => item.id !== anime.id);
      }
      return [...current, { id: anime.id, title: anime.title.romaji }];
    });
  }

  if (loading) return <p className="status">Loading trending anime...</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <section>
      <h1>Trending Anime</h1>
      <div className="grid">
        {animeList.map((anime) => (
          <AnimeCard
            key={anime.id}
            anime={anime}
            isFavorite={favorites.some((item) => item.id === anime.id)}
            onToggleFavorite={toggleFavorite}
            progress={progress[anime.id]}
          />
        ))}
      </div>

      {favorites.length > 0 && (
        <div className="panel">
          <h2>Favorites</h2>
          <p>{favorites.map((item) => item.title).join(', ')}</p>
        </div>
      )}

      {recentlyViewed.length > 0 && (
        <div className="panel">
          <h2>Recently Viewed</h2>
          <p>{[...recentMap.values()].slice(0, 8).map((item) => item.title).join(', ')}</p>
        </div>
      )}
    </section>
  );
}

export default Home;
