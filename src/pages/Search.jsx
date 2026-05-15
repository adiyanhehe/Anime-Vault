import { useState } from 'react';
import AnimeCard from '../components/AnimeCard';
import SearchBar from '../components/SearchBar';
import { searchAnime } from '../api/anilist';

const FAVORITES_KEY = 'animevault_favorites';

function Search() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
  const [selectedRating, setSelectedRating] = useState('R - 17+');
  const [selectedYear, setSelectedYear] = useState('2023');

  async function runSearch(searchTerm) {
    if (!searchTerm) return;
    setQuery(searchTerm);
    try {
      setLoading(true);
      setError('');
      const data = await searchAnime(searchTerm);
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
    <section className="search-page">
      <div className="search-header">
        <div>
          <span className="eyebrow">Browse</span>
          <h1>Find your next favorite series</h1>
          <p className="subtext">Search through trending anime, movies, and specials with smart filters.</p>
        </div>
        <div className="search-topbar glass-card">
          <SearchBar onSearch={runSearch} defaultValue={query} />
          <div className="filter-summary">
            <span>{results.length} results</span>
            <div className="chips">
              <span className="chip active">{selectedRating}</span>
              <span className="chip">{selectedYear}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="search-grid">
        <aside className="search-sidebar glass-panel">
          <div className="sidebar-header">
            <h2>Filters</h2>
            <button className="text-button">Reset</button>
          </div>
          <div className="filter-block">
            <h3>Genre</h3>
            <div className="filter-list">
              <button className="filter-pill active">Action</button>
              <button className="filter-pill">Fantasy</button>
              <button className="filter-pill">Romance</button>
              <button className="filter-pill">Mystery</button>
            </div>
          </div>
          <div className="filter-block">
            <h3>Rating</h3>
            <div className="filter-list vertical">
              {['PG-13', 'R - 17+', 'All Ages'].map((rating) => (
                <button
                  key={rating}
                  className={rating === selectedRating ? 'filter-pill active' : 'filter-pill'}
                  onClick={() => setSelectedRating(rating)}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-block">
            <h3>Year</h3>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {['2024', '2023', '2022', '2021', 'Older'].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <button className="button button-primary full-width">Apply Filters</button>
        </aside>

        <div className="search-results">
          {loading && <p className="status">Searching...</p>}
          {error && <p className="status error">{error}</p>}
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
