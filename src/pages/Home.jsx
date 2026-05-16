import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimeCard from '../components/AnimeCard';
import { fetchTrendingAnime } from '../api/anilist';

const FAVORITES_KEY = 'animevault_favorites';
const RECENTS_KEY = 'animevault_recently_viewed';
const PROGRESS_KEY = 'animevault_progress';

function getTitle(anime) {
  return anime?.title?.english || anime?.title?.romaji || anime?.title?.native || 'Unknown Title';
}

function getImage(anime) {
  return anime?.coverImage?.extraLarge || anime?.coverImage?.large || anime?.coverImage?.medium;
}

function Home() {
  const [animeList, setAnimeList] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
  const [recentlyViewed] = useState(() => JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'));
  const [progress] = useState(() => JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

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

  const heroAnime = animeList[0] || null;
  const heroTitle = getTitle(heroAnime);
  const heroDescription = heroAnime?.description
    ? heroAnime.description.replace(/<[^>]+>/g, '').slice(0, 220)
    : 'Track what you are watching, jump back into recent episodes, and browse trending series from one focused dashboard.';

  const trending = animeList.slice(0, 8);
  const actionList = useMemo(
    () => animeList.filter((anime) => anime.genres?.includes('Action')).slice(0, 6),
    [animeList]
  );
  const spotlightList = animeList.slice(1, 4);
  const recentItems = useMemo(() => recentlyViewed.slice(0, 5), [recentlyViewed]);
  const nextUpCount = Object.values(progress).filter(Boolean).length;

  function handleSearch(e) {
    e.preventDefault();
    const query = searchValue.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  }

  function toggleFavorite(anime) {
    setFavorites((current) => {
      if (current.some((item) => item.id === anime.id)) {
        return current.filter((item) => item.id !== anime.id);
      }
      return [...current, { id: anime.id, title: getTitle(anime) }];
    });
  }

  if (loading) return <p className="status">Loading trending anime...</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <section className="home-page">
      <section className="hero-section">
        <div className="hero-background">
          <img
            src={getImage(heroAnime) || 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&w=1600&q=80'}
            alt={heroTitle}
          />
          <div className="hero-overlay" />
        </div>

        <div className="hero-content">
          <div className="hero-meta">
            <span className="tag">Trending Now</span>
            {heroAnime?.averageScore && <span className="subtag">{heroAnime.averageScore}% Match</span>}
            {heroAnime?.format && <span className="subtag">{heroAnime.format}</span>}
          </div>
          <h1>{heroTitle}</h1>
          <p>{heroDescription}</p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => heroAnime?.id && navigate(`/anime/${heroAnime.id}`)}>
              <span className="material-symbols-outlined">play_arrow</span>
              Watch Now
            </button>
            <button className="button button-secondary" onClick={() => navigate('/search')}>
              <span className="material-symbols-outlined">explore</span>
              Browse Library
            </button>
          </div>
          <form className="hero-search" onSubmit={handleSearch}>
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search anime, studios, or genres"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button type="submit" className="search-submit">Search</button>
          </form>
        </div>

        <aside className="hero-rail" aria-label="Home summary">
          <div>
            <strong>{animeList.length}</strong>
            <span>Trending</span>
          </div>
          <div>
            <strong>{favorites.length}</strong>
            <span>Favorites</span>
          </div>
          <div>
            <strong>{nextUpCount}</strong>
            <span>In Progress</span>
          </div>
        </aside>
      </section>

      {recentItems.length > 0 && (
        <section className="section continue-section">
          <div className="section-header">
            <div>
              <span className="eyebrow">Continue</span>
              <h2>Recently Viewed</h2>
            </div>
            <button className="text-button" onClick={() => navigate('/search')}>Browse More</button>
          </div>
          <div className="continue-list">
            {recentItems.map((item) => (
              <Link key={item.id} to={`/anime/${item.id}`} className="continue-item">
                <span>{item.title}</span>
                <small>{progress[item.id] ? `Episode ${progress[item.id]}` : 'Details'}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section section-trending">
        <div className="section-header">
          <div>
            <span className="eyebrow">Popular</span>
            <h2>Trending Now</h2>
          </div>
          <button className="text-button" onClick={() => navigate('/search')}>View All</button>
        </div>
        <div className="trending-carousel custom-scrollbar">
          {trending.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              isFavorite={favorites.some((item) => item.id === anime.id)}
              onToggleFavorite={toggleFavorite}
              progress={progress[anime.id]}
            />
          ))}
        </div>
      </section>

      <section className="section home-feature-grid">
        <div className="section-heading">
          <div>
            <span className="eyebrow">High Energy</span>
            <h2>Action Picks</h2>
          </div>
        </div>
        <div className="poster-grid">
          {(actionList.length > 0 ? actionList : animeList.slice(2, 8)).map((anime) => (
            <Link key={anime.id} to={`/anime/${anime.id}`} className="poster-card">
              <div className="poster-image">
                <img src={getImage(anime)} alt={getTitle(anime)} />
                <span className="poster-badge">{anime.format || 'TV'}</span>
              </div>
              <div className="poster-info">
                <h4>{getTitle(anime)}</h4>
                <p>{anime.episodes ? `${anime.episodes} episodes` : 'Episodes TBA'}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section spotlight-section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Spotlight</span>
            <h2>Worth a Look</h2>
          </div>
        </div>
        <div className="spotlight-grid">
          {spotlightList.map((anime) => (
            <Link key={anime.id} to={`/anime/${anime.id}`} className="spotlight-item">
              <img src={getImage(anime)} alt={getTitle(anime)} />
              <div>
                <strong>{getTitle(anime)}</strong>
                <span>{anime.genres?.slice(0, 3).join(' / ') || anime.format || 'Anime'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}

export default Home;
