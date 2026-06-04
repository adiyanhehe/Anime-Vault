import { useState, useEffect } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search as SearchIcon, Info, Home as HomeIcon, Tv as TvIcon, 
  AlertTriangle, User, Sparkles
} from 'lucide-react';
import Home from './pages/Home';
import Search from './pages/Search';
import AnimeDetails from './pages/AnimeDetails';
import MangaDetails from './pages/MangaDetails';
import DramasMovies from './pages/DramasMovies';
import MovieWatch from './pages/MovieWatch';
import About from './pages/About';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import { Contact, FAQ, Terms, Privacy, DMCA, RequestAnime } from './pages/StaticPages';
import Download from './pages/Download';
import NotFound from './pages/NotFound';

import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import UpdateCenter from './components/UpdateCenter';
import { useUser } from './api/UserContext';
import { fetchSiteSettings } from './api/db';
import { FocusableNavLink, FocusableLink, FocusableButton } from './components/FocusableWrapper';

function App() {
  const { user, setShowAuthModal, setAuthTab } = useUser();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [topbarQuery, setTopbarQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const [isReady, setIsReady] = useState(true); // Skip loading screen

  useEffect(() => {
    async function loadSettings() {
      try {
        const settings = await fetchSiteSettings();
        if (settings.announcement) setAnnouncement(settings.announcement);
        if (settings.maintenance === 'true') setMaintenanceMode(true);
      } catch (err) {
        console.error('Failed to load global site settings:', err);
      } finally {
        setIsReady(true);
      }
    }
    loadSettings();
  }, []);


  useEffect(() => {
    if (location.pathname !== '/search') return;
    const params = new URLSearchParams(location.search);
    setTopbarQuery(params.get('q') || '');
  }, [location.pathname, location.search]);

  function handleTopbarSearch(event) {
    event.preventDefault();
    const trimmedQuery = topbarQuery.trim();
    const params = new URLSearchParams();
    params.set('type', 'ANIME');
    if (trimmedQuery) params.set('q', trimmedQuery);
    navigate(`/search?${params.toString()}`);
  }

  // Loading screen removed; app renders immediately.



  if (maintenanceMode && (!user || !user.is_admin)) {
  console.warn('Maintenance mode active - displaying site normally');
  // Optionally show a banner or notification here
}


  return (
    <div className="app-shell">
      {announcement && (
        <div style={{
          background: 'linear-gradient(90deg, #ff1a75, #ffaa00)',
          color: '#000', fontSize: '0.8rem', fontWeight: '900',
          padding: '8px 20px', textAlign: 'center', letterSpacing: '0.5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)', textShadow: '0 1px 2px rgba(255,255,255,0.3)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
        }}>
          <Sparkles size={14} style={{ animation: 'bannerPulse 1.5s infinite alternate' }} />
          <span>{announcement}</span>
          <style>{`@keyframes bannerPulse { from { transform: scale(1); } to { transform: scale(1.2); } }`}</style>
        </div>
      )}

      {/* ... header ... */}
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <FocusableLink to="/" className="brand">AnimeVault</FocusableLink>
          <div className="made-by-v2">
            made with <span>🔥</span> by Adiyan
          </div>
        </div>
        <nav className="topnav">
          <FocusableNavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Home
          </FocusableNavLink>
          <FocusableNavLink
            to="/search?type=ANIME"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Animes
          </FocusableNavLink>
          <FocusableNavLink
            to="/search?type=MANGA"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Mangas
          </FocusableNavLink>
          <FocusableNavLink
            to="/dramas-movies"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Dramas & Movies
          </FocusableNavLink>
          <FocusableNavLink
            to="/search?trending=true"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Trending
          </FocusableNavLink>
          <FocusableNavLink
            to="/about"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Info size={16} /> About
          </FocusableNavLink>
          <FocusableNavLink
            to="/download"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Download
          </FocusableNavLink>
        </nav>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <form className="topbar-search-form" onSubmit={handleTopbarSearch} role="search">
            <SearchIcon size={18} aria-hidden="true" />
            <input
              type="search"
              value={topbarQuery}
              onChange={(event) => setTopbarQuery(event.target.value)}
              placeholder="Search anime..."
              aria-label="Search anime"
            />
            <button type="submit">Search</button>
          </form>
          {user ? (
            <FocusableLink to="/profile" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', fontSize: '0.8rem', fontWeight: '800', borderRadius: '8px',
              border: '1px solid rgba(255, 26, 117, 0.3)', textDecoration: 'none',
              background: 'rgba(255, 26, 117, 0.08)', color: 'var(--brand-color)',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 0 10px rgba(255, 26, 117, 0.1)'
            }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 26, 117, 0.18)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 26, 117, 0.3)'; }}
               onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 26, 117, 0.08)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 26, 117, 0.1)'; }}>
              <User size={14} />
              <span>{user.username}</span>
            </FocusableLink>
          ) : (
            <FocusableButton onClick={() => { setAuthTab('login'); setShowAuthModal(true); }} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', fontSize: '0.8rem', fontWeight: '800', borderRadius: '8px',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass)', color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s ease'
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-color)'; e.currentTarget.style.color = '#fff'; }}
               onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
              <User size={14} />
              <span>Sign In</span>
            </FocusableButton>
          )}
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/download" element={<Download />} />
          <Route path="*" element={<NotFound />} />
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
      
      {/* Postgres Neon Modals */}
      <AuthModal />
      <UpdateCenter />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}

export default App;
