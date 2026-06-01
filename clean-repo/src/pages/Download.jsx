import React from 'react';
import { FocusableLink } from '../components/FocusableWrapper';
import { Sparkles, Tv, Bookmark, Laptop } from 'lucide-react';
// Official OS icons generated
// OS icons will be loaded from CDN URLs directly in the JSX

// -------------------------------
// Version – keep in sync with your release assets
// -------------------------------
const VERSION = '0.1.0';
const basePath = process.env.NODE_ENV === 'development' ? '/' : 'release/';
const urls = {
  windows: `${basePath}AnimeVault Setup ${VERSION}.exe`,
  mac: `${basePath}AnimeVault-${VERSION}.dmg`,
  linux: `${basePath}AnimeVault-${VERSION}.AppImage`,
};

/**
 * Downloads page – matches the global Anime Vault design system.
 * Uses the existing .hero-section, .section, .poster-grid and .glass-card
 * utilities. All colours, typography and spacing are taken from the
 * global CSS variables (‑‑brand-color, ‑‑background, etc.).
 */
const Download = () => {
  return (
    <div className="app-shell download-page">
      {/* Hero Section */}
      <section className="hero-section hero-download">
        <div className="hero-content hero-download-content">
          <h1 className="hero-heading">Anime Vault</h1>
          <p className="hero-subtitle">
            Download Anime Vault for your favorite platform
          </p>
          <p className="hero-description">
            Experience the full‑featured anime streaming service on Windows,
            macOS, and Linux.
          </p>
        </div>
        {/* Subtle animated background */}
        <div className="hero-overlay-animated" aria-hidden="true" />
      </section>

      {/* Downloads Section */}
      <section className="section downloads-section">
        <h2 className="section-heading">Download</h2>
        <div className="poster-grid">
          {/* Windows Card */}
          <div className="card glass-card download-card">
            <div className="card-icon">
              <img src="https://cdn.simpleicons.org/windows" alt="Windows" className="platform-icon" width={48} height={48} />
            </div>
            <h3 className="card-title">Windows</h3>
            <p className="card-text">
              Download Anime Vault for Windows 10 and Windows 11.
            </p>
            <span className="badge version-badge">v{VERSION}</span>
            <FocusableLink
              to={urls.windows}
              className="button-primary download-btn"
              aria-label="Download Anime Vault for Windows"
            >
              Download .exe
            </FocusableLink>
            <p className="file-size">Size: 120 MB</p>
          </div>

          {/* macOS Card */}
          <div className="card glass-card download-card">
            <div className="card-icon">
              <img src="https://cdn.simpleicons.org/apple" alt="macOS" className="platform-icon" width={48} height={48} />
            </div>
            <h3 className="card-title">macOS</h3>
            <p className="card-text">
              Compatible with Intel and Apple Silicon Macs.
            </p>
            <span className="badge version-badge">v{VERSION}</span>
            <FocusableLink
              to={urls.mac}
              className="button-primary download-btn"
              aria-label="Download Anime Vault for macOS"
            >
              Download .dmg
            </FocusableLink>
            <p className="file-size">Size: 115 MB</p>
          </div>

          {/* Linux Card */}
          <div className="card glass-card download-card">
            <div className="card-icon">
              <img src="https://cdn.simpleicons.org/linux" alt="Linux" className="platform-icon" width={48} height={48} />
            </div>
            <h3 className="card-title">Linux</h3>
            <p className="card-text">
              Available as AppImage and Debian package.
            </p>
            <span className="badge version-badge">v{VERSION}</span>
            <FocusableLink
              to={urls.linux}
              className="button-primary download-btn"
              aria-label="Download Anime Vault for Linux"
            >
              Download
            </FocusableLink>
            <p className="file-size">Size: 130 MB</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <h2 className="section-heading">Features</h2>
        <div className="poster-grid">
          <div className="card glass-card feature-card">
            <Sparkles className="feature-icon" size={48} />
            <h3 className="feature-title">Fast Streaming</h3>
            <p className="feature-text">
              Watch anime instantly with ultra‑low latency.
            </p>
          </div>
          <div className="card glass-card feature-card">
            <Tv className="feature-icon" size={48} />
            <h3 className="feature-title">Massive Library</h3>
            <p className="feature-text">
              Thousands of episodes across every genre.
            </p>
          </div>
          <div className="card glass-card feature-card">
            <Bookmark className="feature-icon" size={48} />
            <h3 className="feature-title">Watch Progress Sync</h3>
            <p className="feature-text">
              Seamless continuation across devices.
            </p>
          </div>
          <div className="card glass-card feature-card">
            <Laptop className="feature-icon" size={48} />
            <h3 className="feature-title">Cross‑Platform Support</h3>
            <p className="feature-text">
              Use Anime Vault on Windows, macOS, and Linux.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        © 2026 Anime Vault • All Rights Reserved
      </footer>
    </div>
  );
};

export default Download;
