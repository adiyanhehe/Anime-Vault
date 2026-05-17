import { useEffect } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Search as SearchIcon, Info, Home as HomeIcon, Tv as TvIcon } from 'lucide-react';
import Home from './pages/Home';
import Search from './pages/Search';
import AnimeDetails from './pages/AnimeDetails';
import MangaDetails from './pages/MangaDetails';
import DramasMovies from './pages/DramasMovies';
import MovieWatch from './pages/MovieWatch';
import About from './pages/About';
import { Contact, FAQ, Terms, Privacy, DMCA, RequestAnime } from './pages/StaticPages';

import Footer from './components/Footer';

function App() {
  useEffect(() => {
    let preventRedirect = false;

    // Detect iframe interaction and activate redirect shield
    const handleBlur = () => {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        preventRedirect = true;
        // Keep active for 3 seconds to intercept redirect bursts, then reset
        setTimeout(() => {
          preventRedirect = false;
        }, 3000);
      }
    };

    const handleBeforeUnload = (e) => {
      if (preventRedirect) {
        // Intercept top-level page hijacking
        e.preventDefault();
        e.returnValue = 'Redirect blocked by AnimeVault Secure Engine';
        return 'Redirect blocked by AnimeVault Secure Engine';
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="app-shell">
      {/* ... header ... */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" className="brand">AnimeVault</Link>
          <div className="made-by-v2">
            made with <span>🔥</span> by Adiyan
          </div>
        </div>
        <nav className="topnav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Home
          </NavLink>
          <NavLink
            to="/search?type=ANIME"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Animes
          </NavLink>
          <NavLink
            to="/search?type=MANGA"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Mangas
          </NavLink>
          <NavLink
            to="/dramas-movies"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Dramas & Movies
          </NavLink>
          <NavLink
            to="/search?trending=true"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Trending
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Info size={16} /> About
          </NavLink>
        </nav>
        <div className="topbar-actions">
          <Link to="/search" className="search-trigger">
            <SearchIcon size={20} />
            <span>Search...</span>
          </Link>
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/manga/:id" element={<MangaDetails />} />
          <Route path="/dramas-movies" element={<DramasMovies />} />
          <Route path="/watch/:type/:id" element={<MovieWatch />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/dmca" element={<DMCA />} />
          <Route path="/request" element={<RequestAnime />} />
        </Routes>
      </main>

      <Footer />

      {/* Premium Bottom Navigation for Mobile Devices */}
      <nav className="bottom-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
        >
          <HomeIcon size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
        >
          <SearchIcon size={20} />
          <span>Search</span>
        </NavLink>
        <NavLink
          to="/dramas-movies"
          className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
        >
          <TvIcon size={20} />
          <span>Dramas</span>
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => (isActive ? 'bottom-nav-link active' : 'bottom-nav-link')}
        >
          <Info size={20} />
          <span>About</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default App;
