import { Link, NavLink, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import AnimeDetails from './pages/AnimeDetails';

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">AnimeVault</Link>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/search">Search</NavLink>
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
