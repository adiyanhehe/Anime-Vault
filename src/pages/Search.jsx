import { useState } from 'react';
import AnimeCard from '../components/AnimeCard';
import SearchBar from '../components/SearchBar';
import { searchAnime } from '../api/anilist';

const FAVORITES_KEY = 'animevault_favorites';

function Search() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));

  async function runSearch(query) {
    if (!query) return;
    try {
      setLoading(true);
      setError('');
      const data = await searchAnime(query);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function toggleFavorite(anime) {
    setFavorites((current) => {
      const next = current.some((item) => item.id === anime.id)
        ? current.filter((item) => item.id !== anime.id)
        : [...current, { id: anime.id, title: anime.title.romaji }];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <section>
      <h1>Search Anime</h1>
      <SearchBar onSearch={runSearch} />
      {loading && <p className="status">Searching...</p>}
      {error && <p className="status error">{error}</p>}
      <div className="grid">
        {results.map((anime) => (
          <AnimeCard
            key={anime.id}
            anime={anime}
            isFavorite={favorites.some((item) => item.id === anime.id)}
            onToggleFavorite={toggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}

export default Search;
