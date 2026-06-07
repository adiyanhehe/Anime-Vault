import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home as HomeIcon, Film as AnimeIcon, Book as MangaIcon, Users as UsersIcon, BarChart2 as StatsIcon, Settings as SettingsIcon } from 'lucide-react';
import './AdminNav.css'; // will create styling file

/**
 * Sidebar navigation shown only on admin pages.
 * Uses design tokens for a glass‑morphism look.
 */
export default function AdminNav() {
  return (
    <nav className="admin-nav">
      <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <HomeIcon size={20} /> Dashboard
      </NavLink>
      <NavLink to="/admin/anime" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <AnimeIcon size={20} /> Anime
      </NavLink>
      <NavLink to="/admin/manga" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <MangaIcon size={20} /> Manga
      </NavLink>
      <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <UsersIcon size={20} /> Users
      </NavLink>
      <NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <StatsIcon size={20} /> Analytics
      </NavLink>
      <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        <SettingsIcon size={20} /> Settings
      </NavLink>
    </nav>
  );
}
