import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/designTokens.css';

/**
 * Placeholder page that lists anime titles. In a full implementation this would fetch
 * and display a grid of anime cards.
 */
export default function AnimeHome() {
  return (
    <div className="page-container" style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Anime</h1>
      <p>Here you will see a list of all anime. (Content to be added.)</p>
      <Link to="/" style={{ color: 'var(--brand-color)' }}>← Back to Home</Link>
    </div>
  );
}
