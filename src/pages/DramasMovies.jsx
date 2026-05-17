import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Film, Tv, Play, X } from 'lucide-react';
import { fetchLatestMovies, fetchLatestTVShows, searchMoviesAndSeries } from '../api/movies';

function DramasMovies() {
  const [activeTab, setActiveTab] = useState('movies'); // 'movies' or 'tv'
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [moviePage, setMoviePage] = useState(1);
  const [tvPage, setTvPage] = useState(1);

  useEffect(() => {
    loadLatest();
  }, [activeTab, moviePage, tvPage]);

  async function loadLatest() {
    setLoading(true);
    if (activeTab === 'movies') {
      const data = await fetchLatestMovies(moviePage);
      setMovies(data);
    } else {
      const data = await fetchLatestTVShows(tvPage);
      setTvShows(data);
    }
    setLoading(false);
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) {
      setSearching(false);
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setSearching(true);
    const results = await searchMoviesAndSeries(query);
    setSearchResults(results);
    setLoading(false);
  }

  function clearSearch() {
    setQuery('');
    setSearching(false);
    setSearchResults([]);
  }

  return (
    <div className="dramas-movies-container">
      {/* Search Header Banner */}
      <div className="movies-hero-banner">
        <div className="hero-banner-content">
          <h1>Dramas & Movies</h1>
          <p>Watch your favorite Hollywood Blockbusters, TV Series, and K-Dramas with zero ads.</p>
          
          <form onSubmit={handleSearch} className="movies-search-bar">
            <SearchIcon className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search movies, TV shows, or K-Dramas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && <X className="clear-search-btn" size={20} onClick={clearSearch} />}
            <button type="submit">Search</button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="movies-content-section">
        {searching ? (
          <div className="movies-results-wrapper">
            <div className="results-header">
              <h2>Search Results for "{query}"</h2>
              <button className="back-to-latest" onClick={clearSearch}>Back to Latest</button>
            </div>

            {loading ? (
              <div className="loading-grid">
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="movies-grid">
                {searchResults.map((item) => {
                  const watchType = item.type === 'series' || item.mediaType === 'series' ? 'tv' : 'movie';
                  const posterUrl = item.poster || `https://live.metahub.space/poster/medium/${item.imdb_id || item.id}/img`;
                  
                  return (
                    <Link
                      to={`/watch/${watchType}/${item.imdb_id || item.id}`}
                      key={item.id || item.imdb_id}
                      className="movie-card"
                    >
                      <div className="movie-card-poster">
                        <img
                          src={posterUrl}
                          alt={item.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=300&auto=format&fit=crop';
                          }}
                          loading="lazy"
                        />
                        <div className="movie-card-overlay">
                          <Play fill="white" size={24} />
                        </div>
                        <span className="movie-type-badge">{watchType === 'tv' ? 'TV SHOW' : 'MOVIE'}</span>
                      </div>
                      <div className="movie-card-info">
                        <h3>{item.name}</h3>
                        {item.releaseInfo && <span className="movie-year">{item.releaseInfo}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="no-results">No movies or TV shows found matching "{query}".</div>
            )}
          </div>
        ) : (
          <>
            {/* Category Tab Selector */}
            <div className="movies-tabs-container">
              <button
                className={`movies-tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('movies');
                  setSearching(false);
                }}
              >
                <Film size={18} /> Movies
              </button>
              <button
                className={`movies-tab-btn ${activeTab === 'tv' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('tv');
                  setSearching(false);
                }}
              >
                <Tv size={18} /> TV Shows & K-Dramas
              </button>
            </div>

            {loading ? (
              <div className="loading-grid">
                {Array(10).fill(0).map((_, i) => (
                  <div key={i} className="skeleton-card" />
                ))}
              </div>
            ) : (
              <div className="latest-listings-wrapper">
                <div className="movies-grid">
                  {(activeTab === 'movies' ? movies : tvShows).map((item) => {
                    const cleanTitle = item.title;
                    const posterUrl = `https://live.metahub.space/poster/medium/${item.imdb_id}/img`;
                    
                    return (
                      <Link
                        to={`/watch/${activeTab === 'tv' ? 'tv' : 'movie'}/${item.imdb_id}`}
                        key={item.imdb_id}
                        className="movie-card"
                      >
                        <div className="movie-card-poster">
                          <img
                            src={posterUrl}
                            alt={cleanTitle}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=300&auto=format&fit=crop';
                            }}
                            loading="lazy"
                          />
                          <div className="movie-card-overlay">
                            <Play fill="white" size={24} />
                          </div>
                          {item.quality && <span className="movie-quality-badge">{item.quality}</span>}
                        </div>
                        <div className="movie-card-info">
                          <h3>{cleanTitle}</h3>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                <div className="movies-pagination">
                  <button
                    disabled={activeTab === 'movies' ? moviePage === 1 : tvPage === 1}
                    onClick={() => {
                      if (activeTab === 'movies') {
                        setMoviePage(prev => Math.max(1, prev - 1));
                      } else {
                        setTvPage(prev => Math.max(1, prev - 1));
                      }
                    }}
                  >
                    Previous Page
                  </button>
                  <span>Page {activeTab === 'movies' ? moviePage : tvPage}</span>
                  <button
                    onClick={() => {
                      if (activeTab === 'movies') {
                        setMoviePage(prev => prev + 1);
                      } else {
                        setTvPage(prev => prev + 1);
                      }
                    }}
                  >
                    Next Page
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DramasMovies;
