import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import SearchBar from '../components/SearchBar';
import { searchAnime, fetchTrendingAnime } from '../api/anilist';

const FAVORITES_KEY = 'animevault_favorites';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));

  // On mount or URL change, run search
  useEffect(() => {
    const q = searchParams.get('q');
    const genre = searchParams.get('genre');
    if (q) {
      setQuery(q);
      runSearch(q, genre);
    } else if (genre) {
      setQuery('');
      runSearchByGenre(genre);
    } else {
      // Load trending as default
      loadTrending();
    }
  }, [searchParams]);

  async function loadTrending() {
    try {
      setLoading(true);
      setError('');
      const data = await fetchTrendingAnime();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to load trending');
    } finally {
      setLoading(false);
    }
  }

  async function runSearch(searchTerm, genreFilter) {
    if (!searchTerm && !genreFilter) return;
    try {
      setLoading(true);
      setError('');
      const data = await searchAnime(searchTerm || genreFilter);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  async function runSearchByGenre(genre) {
    try {
      setLoading(true);
      setError('');
      const data = await searchAnime(genre);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(searchTerm) {
    if (!searchTerm.trim()) return;
    setQuery(searchTerm);
    setSelectedGenre('');
    setSearchParams({ q: searchTerm });
  }

  function handleGenreClick(genre) {
    if (selectedGenre === genre) {
      setSelectedGenre('');
      setSearchParams({});
      return;
    }
    setSelectedGenre(genre);
    setQuery('');
    setSearchParams({ genre });
  }

  function handleReset() {
    setQuery('');
    setSelectedGenre('');
    setSearchParams({});
  }

  function toggleFavorite(anime) {
    setFavorites((current) => {
      const next = current.some((item) => item.id === anime.id)
        ? current.filter((item) => item.id !== anime.id)
        : [...current, { id: anime.id, title: anime.title?.romaji || 'Unknown' }];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <section className="search-page">
      <div className="search-header">
        <div>
          <span className="eyebrow">Browse</span>
          <h1>Find your next favorite series</h1>
          <p className="subtext">Search through trending anime, movies, and specials with smart filters.</p>
        </div>
        <div className="search-topbar glass-card">
          <SearchBar onSearch={handleSearch} defaultValue={query} />
          <div className="filter-summary">
            <span>{results.length > 0 ? `${results.length} results` : ''}</span>
            <div className="chips">
              {selectedGenre && <span className="chip active">{selectedGenre}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="search-grid">
        <aside className="search-sidebar glass-panel">
          <div className="sidebar-header">
            <h2>Filters</h2>
            <button className="text-button" onClick={handleReset}>Reset</button>
          </div>
          <div className="filter-block">
            <h3>Genre</h3>
            <div className="filter-list">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  className={genre === selectedGenre ? 'filter-pill active' : 'filter-pill'}
                  onClick={() => handleGenreClick(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="search-results">
          {loading && <p className="status">Searching...</p>}
          {error && <p className="status error">{error}</p>}
          {!loading && !error && results.length === 0 && (
            <p className="status">No results found. Try a different search term or genre.</p>
          )}
          <div className="results-grid">
            {results.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                isFavorite={favorites.some((item) => item.id === anime.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Search;