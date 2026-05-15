import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const heroAnime = animeList[0] || {};
  const trending = animeList.slice(0, 8);
  const actionList = useMemo(
    () => animeList.filter((anime) => anime.genres?.includes('Action')).slice(0, 6),
    [animeList]
  );
  const romanceList = useMemo(
    () => animeList.filter((anime) => anime.genres?.includes('Romance')).slice(0, 2),
    [animeList]
  );
  const isekaiList = useMemo(
    () => animeList.filter((anime) => anime.genres?.includes('Isekai')).slice(0, 2),
    [animeList]
  );
  const recentMap = useMemo(() => new Map(recentlyViewed.map((item) => [item.id, item])), [recentlyViewed]);

  function handleSearch(e) {
    e.preventDefault();
    if (!searchValue.trim()) return;
    navigate('/search');
  }

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
    <section className="home-page">
      <section className="hero-section">
        <div className="hero-background">
          <img
            src={heroAnime.coverImage?.large || heroAnime.coverImage?.medium || 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&w=1600&q=80'}
            alt={heroAnime.title?.romaji || 'Featured Anime'}
          />
          <div className="hero-overlay" />
          <div className="hero-overlay-dark" />
        </div>

        <div className="hero-content">
          <div className="hero-meta">
            <span className="tag">TRENDING #1</span>
            <span className="subtag">Season 4 Now Airing</span>
          </div>
          <h1>{heroAnime.title?.romaji || 'Cyber Nexus: Rebirth'}</h1>
          <p>
            In a world where memories are traded like currency, a young hacker discovers a fragment of the original reality that could bring down the entire virtual empire.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={() => navigate(`/anime/${heroAnime.id}`)}>
              <span className="material-symbols-outlined">play_arrow</span>
              Watch Now
            </button>
            <button className="button button-secondary" onClick={() => setSearchValue('')}>
              <span className="material-symbols-outlined">add</span>
              Add to List
            </button>
          </div>
          <form className="hero-search" onSubmit={handleSearch}>
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              placeholder="Search for your favorite anime, studio, or character..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button type="submit" className="search-submit">Browse</button>
          </form>
        </div>
      </section>

      <section className="section section-trending">
        <div className="section-header">
          <div>
            <h2>Trending Now</h2>
            <div className="section-line" />
          </div>
          <button className="text-button">View All</button>
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

      <section className="section section-grid">
        <div className="section-heading">
          <h2>Action</h2>
        </div>
        <div className="poster-grid">
          {actionList.length > 0 ? actionList.map((anime) => (
            <article key={anime.id} className="poster-card glass-card">
              <div className="poster-image">
                <img src={anime.coverImage?.medium || anime.coverImage?.large} alt={anime.title.romaji} />
                <span className="poster-badge">NEW EP</span>
              </div>
              <div className="poster-info">
                <h4>{anime.title.romaji}</h4>
                <p>{anime.episodes || 'TBA'} Episodes</p>
              </div>
            </article>
          )) : <p className="status">No action titles available right now.</p>}
        </div>
      </section>

      <section className="section section-dual">
        <div className="category-panel">
          <div className="panel-header">
            <span className="material-symbols-outlined category-icon">favorite</span>
            <h2>Romance</h2>
          </div>
          <div className="panel-list">
            {(romanceList.length ? romanceList : animeList.slice(0, 2)).map((anime) => (
              <div key={anime.id} className="panel-row glass-card">
                <img src={anime.coverImage?.medium || anime.coverImage?.large} alt={anime.title.romaji} />
                <div>
                  <h4>{anime.title.romaji}</h4>
                  <p>{anime.genres?.slice(0, 2).join(' / ') || 'Romance'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="category-panel">
          <div className="panel-header">
            <span className="material-symbols-outlined category-icon">auto_awesome</span>
            <h2>Isekai</h2>
          </div>
          <div className="panel-list">
            {(isekaiList.length ? isekaiList : animeList.slice(1, 3)).map((anime) => (
              <div key={anime.id} className="panel-row glass-card">
                <img src={anime.coverImage?.medium || anime.coverImage?.large} alt={anime.title.romaji} />
                <div>
                  <h4>{anime.title.romaji}</h4>
                  <p>{anime.genres?.slice(0, 2).join(' / ') || 'Isekai'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-panels">
        <div className="panel glass-card">
          <h3>Favorites</h3>
          <p>{favorites.length > 0 ? favorites.map((item) => item.title).join(', ') : 'Add favorites to curate your vault.'}</p>
        </div>
        <div className="panel glass-card">
          <h3>Recently Viewed</h3>
          <p>{recentlyViewed.length > 0 ? [...recentMap.values()].slice(0, 6).map((item) => item.title).join(' • ') : 'Watch an anime to build your recent queue.'}</p>
        </div>
      </section>
    </section>
  );
}

export default Home;
