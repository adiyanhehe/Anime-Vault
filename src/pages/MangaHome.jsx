import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/designTokens.css';

/**
 * Placeholder for manga listing page.
 */
export default function MangaHome() {
  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Manga</h1>
      <p>Here you will see a list of all manga. (Content to be added.)</p>
      <Link to="/" style={{ color: 'var(--brand-color)' }}>← Back to Home</Link>
    </div>
  );
}
