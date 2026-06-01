import React from 'react';
import '../styles/download.css';
import { Sparkles, Tv, Bookmark, Laptop } from 'lucide-react';
import FocusableLink from '../components/FocusableLink';

// -------------------------------
// Version – keep in sync with your release assets
// -------------------------------
const VERSION = '0.1.0';
const basePath = `${import.meta.env.BASE_URL}release/`;
const urls = {
  windows: `https://github.com/adiyanhehe/Anime-Vault/releases/download/v${VERSION}/AnimeVault%20Setup%20${VERSION}.exe`,
  mac: `https://github.com/adiyanhehe/Anime-Vault/releases/download/v${VERSION}/AnimeVault-${VERSION}.dmg`,
  linux: `https://github.com/adiyanhehe/Anime-Vault/releases/download/v${VERSION}/AnimeVault-${VERSION}.AppImage`,
};

const Download = () => {
  return (
    <div className="app-shell download-page">
      {/* Hero Section */}
      <section className="hero-section hero-download">
        <div className="hero-content hero-download-content">
          <h1 className="hero-heading gradient-text">Anime Vault</h1>
          <p className="hero-subtitle">
            Download Anime Vault for Windows, macOS, and Linux.
          </p>
        </div>
      </section>

      {/* Downloads Section */}
      <section className="section downloads-section">
        <div className="platform-cards">
          {/* Windows Card */}
          <div className="card glass-card platform-card">
            <div className="platform-icon-container">
              <img src="https://cdn.simpleicons.org/windows/00bcf2" alt="Windows" className="platform-icon" />
            </div>
            <span className="platform-badge">Windows 10 / 11</span>
            <h3 className="platform-title">Windows</h3>
            <p className="platform-desc">
              Fast native desktop experience with full support for anime streaming.
            </p>
            <FocusableLink
              to={urls.windows}
              className="button-primary download-btn-gradient"
              aria-label="Download Anime Vault for Windows"
            >
              Download .exe
            </FocusableLink>
          </div>

          {/* macOS Card */}
          <div className="card glass-card platform-card">
            <div className="platform-icon-container">
              <img src="https://cdn.simpleicons.org/apple/ffffff" alt="macOS" className="platform-icon" />
            </div>
            <span className="platform-badge">macOS 12+</span>
            <h3 className="platform-title">macOS</h3>
            <p className="platform-desc">
              Optimized for both Intel and Apple Silicon Macs.
            </p>
            <FocusableLink
              to={urls.mac}
              className="button-primary download-btn-gradient"
              aria-label="Download Anime Vault for macOS"
            >
              Download .dmg
            </FocusableLink>
          </div>

          {/* Linux Card */}
          <div className="card glass-card platform-card">
            <div className="platform-icon-container">
              <img src="https://cdn.simpleicons.org/linux/f5c300" alt="Linux" className="platform-icon" />
            </div>
            <span className="platform-badge">Ubuntu / Debian / AppImage</span>
            <h3 className="platform-title">Linux</h3>
            <p className="platform-desc">
              Lightweight package for Linux distributions.
            </p>
            <FocusableLink
              to={urls.linux}
              className="button-primary download-btn-gradient"
              aria-label="Download Anime Vault for Linux"
            >
              Download
            </FocusableLink>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="features-grid">
          <div className="card glass-card feature-card">
            <Sparkles className="feature-icon" size={32} />
            <h3 className="feature-title">Fast Streaming</h3>
            <p className="feature-text">
              Watch anime instantly with ultra-low latency.
            </p>
          </div>
          <div className="card glass-card feature-card">
            <Tv className="feature-icon" size={32} />
            <h3 className="feature-title">Huge Library</h3>
            <p className="feature-text">
              Access thousands of anime episodes across every genre.
            </p>
          </div>
          <div className="card glass-card feature-card">
            <Bookmark className="feature-icon" size={32} />
            <h3 className="feature-title">Track Progress</h3>
            <p className="feature-text">
              Save your watch history and pick up where you left off.
            </p>
          </div>
          <div className="card glass-card feature-card">
            <Laptop className="feature-icon" size={32} />
            <h3 className="feature-title">Responsive UI</h3>
            <p className="feature-text">
              Works beautifully across all your devices and screens.
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
