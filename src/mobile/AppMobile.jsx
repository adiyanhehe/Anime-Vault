import React from 'react';
import './mobile.css';

export default function AppMobile() {
  return (
    <div className="mobile-root">
      <header className="mobile-header">
        <h1>AnimeVault</h1>
      </header>
      <main className="mobile-main">
        <h2>Welcome to the mobile app</h2>
        <p>This is a simple phone‑optimized UI. Replace with your actual content.</p>
      </main>
      <footer className="mobile-footer">
        <small>© AnimeVault Team</small>
      </footer>
    </div>
  );
}
