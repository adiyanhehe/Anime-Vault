import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { searchAnime, fetchTrendingMedia } from '../api/anilist';
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
  const [favoritesData, setFavoritesData] = useState(() => JSON.parse(localStorage.getItem('animevault_favorites') || '{"animes":[],"studios":[],"characters":[]}'));
  const favorites = favoritesData.animes || [];

  useEffect(() => {
    const q = searchParams.get('q');
    const genre = searchParams.get('genre');
    const type = searchParams.get('type') || 'ANIME';
    const trending = searchParams.get('trending');

    setQuery(q || '');
    setSelectedGenre(genre || '');
    setSelectedType(type);
    
    if (trending) {
      loadTrending(type);
    } else if (q || genre) {
      runSearch(q, genre, type);
    } else {
      loadTrending(type);
    }
  }, [searchParams]);

  async function loadTrending(typeToLoad) {
    try {
      setLoading(true);
      setError('');
      const data = await fetchTrendingMedia(typeToLoad);
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
      const trimmedSearch = (searchTerm || '').trim();
      
      const data = await searchAnime(trimmedSearch || null, typeFilter, genreFilter || null, 1, 50);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  function updateSearchParams({ nextQuery = query, nextGenre = selectedGenre, nextType = selectedType } = {}) {
    const params = new URLSearchParams();
    params.set('type', nextType);
    const trimmedQuery = nextQuery.trim();
    if (trimmedQuery) params.set('q', trimmedQuery);
    if (nextGenre) params.set('genre', nextGenre);
    setSearchParams(params);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    updateSearchParams();
  }

  function handleGenreToggle(genre) {
    const newGenre = selectedGenre === genre ? '' : genre;
    setSelectedGenre(newGenre);
    updateSearchParams({ nextGenre: newGenre });
  }

  function handleTypeChange(type) {
    setSelectedType(type);
    updateSearchParams({ nextType: type });
  }

  function handleReset() {
    setQuery('');
    setSelectedGenre('');
    setSelectedType('ANIME');
    setSearchParams({ type: 'ANIME' });
  }

  function getTitle(anime) {
    return anime?.title?.english || anime?.title?.romaji || anime?.title?.native || 'Unknown Title';
  }
  function getImage(anime) {
    return anime?.coverImage?.extraLarge || anime?.coverImage?.large || anime?.coverImage?.medium;
  }
  function toggleFavorite(anime) {
    setFavoritesData((current) => {
      const isFav = (current.animes || []).some((item) => item.id === anime.id);
      const next = {
        ...current,
        animes: isFav
          ? (current.animes || []).filter((item) => item.id !== anime.id)
          : [...(current.animes || []), { id: anime.id, title: getTitle(anime), image: getImage(anime) }],
      };
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
                onKeyDown={e => { if (e.key === 'Enter') handleTypeChange(t); }}
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
          {query && (
            <button
              type="button"
              className="clear-btn-v2"
              onClick={() => {
                setQuery('');
                updateSearchParams({ nextQuery: '' });
              }}
              aria-label="Clear search"
            >
              <X size={20} />
            </button>
          )}
          <button type="submit" className="search-submit-v2">Search</button>
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