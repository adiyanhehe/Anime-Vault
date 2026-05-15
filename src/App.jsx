import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import AnimeDetails from './pages/AnimeDetails';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">AnimeVault</Link>
        <nav className="topnav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Home
          </NavLink>
          <NavLink
            to="/search"
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            Browse
          </NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
