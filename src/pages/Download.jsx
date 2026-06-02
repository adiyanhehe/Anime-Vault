import React from 'react';
import { Sparkles, Tv, Bookmark, Laptop } from 'lucide-react';
import androidIcon from "../../android.png";
import '../styles/download.css';
import windowsIcon from "../../windows icon.png";
import FocusableLink from '../components/FocusableLink';
// -------------------------------
// Version – keep in sync with your release assets
// -------------------------------
const VERSION = '0.1.0';
const basePath = `${import.meta.env.BASE_URL}release/`;
const urls = {
  windows: `https://github.com/adiyanhehe/Anime-Vault/releases/download/v0.1.1/AnimeVault.Setup.0.1.0.exe`,
  mac: `https://github.com/adiyanhehe/Anime-Vault/releases/download/v0.1.1/AnimeVault-0.1.0-arm64.dmg`,
  linux: `https://github.com/adiyanhehe/Anime-Vault/releases/download/v0.1.1/AnimeVault-0.1.0.AppImage`,
  android: `https://github.com/adiyanhehe/Anime-Vault/releases/download/v0.1.1/AnimeVault-0.1.0.apk`,
};


const Download = () => {
  return (
    <div className="app-shell download-page">
      {/* Hero Section */}
      <section className="hero-section hero-download">
          <div className="hero-banner-wrapper">
            <img className="hero-banner" src="https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/MgXQGyNr1xbI8tJSYiMWv5kXg5g/AAAABdWbeTi-T2LkIx0QRm1vN4Tx6ryR63A4af9LAXNaDo7ATekkicJGbdueUc8jFmSGcuNKi-lOG07qCLLyaijox6H_I0rSvOUJ2vbd-ECLw48WxW97AFHPf9wV5g.jpg?r=5af" alt="Download banner" id="download-banner" />
            <div className="hero-overlay">
              <h1 className="hero-heading gradient-text" id="hero-title">Anime Vault</h1>
              <p className="hero-subtitle" id="hero-subtitle">
                Download Anime Vault for Windows, macOS, Linux, and Android.
              </p>
            </div>
          </div>
      </section>

      {/* Downloads Section */}
      <section className="section downloads-section">
        <div className="platform-cards">
          {/* Windows Card */}
          <div className="card glass-card platform-card">
            <div className="platform-icon-container">
              <img src={windowsIcon} alt="Windows" className="platform-icon" id="windows-icon" />
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
              {`AnimeVault Setup ${VERSION}.exe`}
            </FocusableLink>
          </div>

          {/* macOS Card */}
          <div className="card glass-card platform-card">
            <div className="platform-icon-container">
              <img src="https://img.icons8.com/color/512/mac-os.png" alt="macOS" className="platform-icon" />
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
              {`AnimeVault-${VERSION}.dmg`}
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
              {`AnimeVault-${VERSION}.AppImage`}
            </FocusableLink>
          </div>
        {/* Android Card */}
        <div className="card glass-card platform-card">
          <div className="platform-icon-container">
            <img src={androidIcon} alt="Android" className="platform-icon" id="android-icon" />
          </div>
          <span className="platform-badge">Android 6+</span>
          <h3 className="platform-title">Android</h3>
          <p className="platform-desc">
            Portable on-the-go experience with native performance.
          </p>
          <FocusableLink
            to={urls.android}
            className="button-primary download-btn-gradient"
            aria-label="Download Anime Vault for Android"
          >
            {`AnimeVault-${VERSION}.apk`}
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
