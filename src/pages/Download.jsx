import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bookmark, DownloadCloud, Laptop, RefreshCw, Sparkles, Tv } from 'lucide-react';
import androidIcon from '../../android.png';
import windowsIcon from '../../windows icon.png';
import FocusableLink from '../components/FocusableLink';
import {
  DOWNLOAD_PLATFORMS,
  RELEASES_PAGE_URL,
  detectPlatform,
  fetchLatestReleaseDownloads,
  formatBytes,
  getFallbackReleaseDownloads,
} from '../utils/releaseAssets';
import '../styles/download.css';

function getPlatformIcon(platform) {
  if (platform.iconType === 'local-windows') {
    return <img src={windowsIcon} alt="Windows" className="platform-icon" id="windows-icon" />;
  }

  if (platform.iconType === 'local-android') {
    return <img src={androidIcon} alt="Android" className="platform-icon" id="android-icon" />;
  }

  if (platform.iconType === 'mac') {
    return <img src="https://img.icons8.com/color/512/mac-os.png" alt="macOS" className="platform-icon" />;
  }

  return <img src="https://cdn.simpleicons.org/linux/f5c300" alt="Linux" className="platform-icon" />;
}

const Download = () => {
  const [release, setRelease] = useState(() => getFallbackReleaseDownloads());
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const detectedPlatform = useMemo(() => detectPlatform(), []);

  useEffect(() => {
    let mounted = true;

    async function loadLatestRelease() {
      try {
        const latestRelease = await fetchLatestReleaseDownloads();
        if (!mounted) return;
        setRelease(latestRelease);
        setStatus('ready');
      } catch (err) {
        if (!mounted) return;
        console.error('Failed to load latest GitHub release:', err);
        setError(err?.message || 'Could not reach GitHub Releases.');
        setRelease(getFallbackReleaseDownloads());
        setStatus('fallback');
      }
    }

    loadLatestRelease();

    return () => {
      mounted = false;
    };
  }, []);

  const recommendedDownload = release.downloads[detectedPlatform] || release.downloads.windows;
  const recommendedPlatform = DOWNLOAD_PLATFORMS.find((platform) => platform.key === detectedPlatform) || DOWNLOAD_PLATFORMS[0];
  const releaseDate = release.publishedAt ? new Date(release.publishedAt).toLocaleDateString() : 'Latest release';

  return (
    <div className="app-shell download-page">
      {/* Hero Section */}
      <section className="hero-section hero-download">
        <div className="hero-banner-wrapper">
          <img className="hero-banner" src="https://occ-0-8407-2219.1.nflxso.net/dnm/api/v6/MgXQGyNr1xbI8tJSYiMWv5kXg5g/AAAABdWbeTi-T2LkIx0QRm1vN4Tx6ryR63A4af9LAXNaDo7ATekkicJGbdueUc8jFmSGcuNKi-lOG07qCLLyaijox6H_I0rSvOUJ2vbd-ECLw48WxW97AFHPf9wV5g.jpg?r=5af" alt="Download banner" id="download-banner" />
          <div className="hero-overlay">
            <span className="release-live-badge">
              {status === 'loading' ? <RefreshCw size={15} className="release-spin" /> : <Sparkles size={15} />}
              {status === 'loading' ? 'Finding latest release...' : `Latest: ${release.tagName}`}
            </span>
            <h1 className="hero-heading gradient-text" id="hero-title">Anime Vault</h1>
            <p className="hero-subtitle" id="hero-subtitle">
              Download Anime Vault for Windows, macOS, Linux, and Android.
            </p>
            <div className="recommended-download-card">
              <div>
                <p>Recommended for this device</p>
                <strong>{recommendedPlatform.title} • {recommendedDownload.fileName}</strong>
                <span>{releaseDate}</span>
              </div>
              <FocusableLink
                to={recommendedDownload.url}
                className="button-primary download-btn-gradient recommended-download-btn"
                aria-label={`Download latest Anime Vault for ${recommendedPlatform.title}`}
              >
                <DownloadCloud size={18} />
                Download latest
              </FocusableLink>
            </div>
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section className="section downloads-section">
        <div className="download-release-header">
          <div>
            <p>Automated from GitHub Releases</p>
            <h2>{release.releaseName}</h2>
          </div>
          <FocusableLink to={release.releaseUrl || RELEASES_PAGE_URL} className="release-notes-link">
            View release notes
          </FocusableLink>
        </div>

        {status === 'fallback' && (
          <div className="download-alert" role="status">
            <AlertCircle size={18} />
            <span>Using fallback download links because the latest release could not be loaded: {error}</span>
          </div>
        )}

        <div className="platform-cards">
          {DOWNLOAD_PLATFORMS.map((platform) => {
            const asset = release.downloads[platform.key];
            const size = formatBytes(asset?.size);
            const isRecommended = platform.key === detectedPlatform;

            return (
              <div className={`card glass-card platform-card ${isRecommended ? 'platform-card-recommended' : ''}`} key={platform.key}>
                {isRecommended && <span className="recommended-ribbon">Your device</span>}
                <div className="platform-icon-container">
                  {getPlatformIcon(platform)}
                </div>
                <span className="platform-badge">{platform.badge}</span>
                <h3 className="platform-title">{platform.title}</h3>
                <p className="platform-desc">{platform.description}</p>
                <div className="asset-meta">
                  <span>{asset?.fileName}</span>
                  {size && <small>{size}</small>}
                </div>
                <FocusableLink
                  to={asset?.url || RELEASES_PAGE_URL}
                  className="button-primary download-btn-gradient"
                  aria-label={platform.ariaLabel}
                >
                  Download {platform.title}
                </FocusableLink>
              </div>
            );
          })}
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
