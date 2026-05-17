import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { Search as SearchIcon, Info } from 'lucide-react';
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
    </div>
  );
}

export default App;
