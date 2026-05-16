import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { searchAnime, fetchTrendingAnime } from '../api/anilist';
import { Filter, Search as SearchIcon, X } from 'lucide-react';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy',
  'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Supernatural', 'Thriller'
];

const TYPES = ['ANIME', 'MANGA'];

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'ANIME');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('animevault_favorites') || '[]'));

  useEffect(() => {
    const q = searchParams.get('q');
    const genre = searchParams.get('genre');
    const type = searchParams.get('type') || 'ANIME';
    const trending = searchParams.get('trending');

    setSelectedType(type);
    
    if (trending) {
      loadTrending();
    } else if (q || genre) {
      runSearch(q, genre, type);
    } else {
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

  async function runSearch(searchTerm, genreFilter, typeFilter) {
    try {
      setLoading(true);
      setError('');
      const data = await searchAnime(searchTerm || genreFilter || 'Popular', typeFilter);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    const params = {};
    if (query) params.q = query;
    if (selectedGenre) params.genre = selectedGenre;
    params.type = selectedType;
    setSearchParams(params);
  }

  function handleGenreToggle(genre) {
    const newGenre = selectedGenre === genre ? '' : genre;
    setSelectedGenre(newGenre);
    const params = { type: selectedType };
    if (query) params.q = query;
    if (newGenre) params.genre = newGenre;
    setSearchParams(params);
  }

  function handleTypeChange(type) {
    setSelectedType(type);
    const params = { type };
    if (query) params.q = query;
    if (selectedGenre) params.genre = selectedGenre;
    setSearchParams(params);
  }

  function handleReset() {
    setQuery('');
    setSelectedGenre('');
    setSelectedType('ANIME');
    setSearchParams({ type: 'ANIME' });
  }

  function toggleFavorite(anime) {
    setFavorites((current) => {
      const next = current.some((item) => item.id === anime.id)
        ? current.filter((item) => item.id !== anime.id)
        : [...current, { id: anime.id, title: anime.title?.romaji || 'Unknown' }];
      localStorage.setItem('animevault_favorites', JSON.stringify(next));
      return next;
    });
  }

  return (
    <section className="search-page-v2">
      <div className="search-sidebar-v2">
        <div className="sidebar-section">
          <div className="sidebar-header-v2">
            <div className="header-title">
              <Filter size={20} />
              <h2>Filters</h2>
            </div>
            <button className="reset-btn" onClick={handleReset}>Reset</button>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Category</h3>
          <div className="type-toggle">
            {TYPES.map(t => (
              <button 
                key={t}
                className={`type-btn ${selectedType === t ? 'active' : ''}`}
                onClick={() => handleTypeChange(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Genres</h3>
          <div className="genre-list-v2">
            {GENRES.map(g => (
              <button 
                key={g}
                className={`genre-pill-v2 ${selectedGenre === g ? 'active' : ''}`}
                onClick={() => handleGenreToggle(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="search-main-v2">
        <form className="search-box-v2" onSubmit={handleSearchSubmit}>
          <SearchIcon className="search-icon-v2" size={20} />
          <input 
            type="text" 
            placeholder={`Search ${selectedType.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && <X className="clear-btn-v2" size={20} onClick={() => setQuery('')} />}
        </form>

        <div className="results-info-v2">
          <span>{results.length} results found</span>
        </div>

        <div className="results-container-v2">
          {loading && <div className="loading-grid">{Array(10).fill(0).map((_, i) => <div key={i} className="skeleton-card" />)}</div>}
          {!loading && error && <div className="error-msg">{error}</div>}
          {!loading && !error && (
            <div className="results-grid-v2">
              {results.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  isFavorite={favorites.some((item) => item.id === anime.id)}
                  onToggleFavorite={toggleFavorite}
                  linkPrefix={selectedType === 'MANGA' ? '/manga/' : '/anime/'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Search;