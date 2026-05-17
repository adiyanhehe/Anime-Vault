import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Clock, Calendar, Film, Play, AlertTriangle } from 'lucide-react';
import { fetchMediaMeta } from '../api/movies';

function MovieWatch() {
  const { type, id } = useParams();
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState(null);
  const [activeEpisode, setActiveEpisode] = useState(null);
  const [playerSrc, setPlayerSrc] = useState('');

  useEffect(() => {
    loadMeta();
  }, [type, id]);

  async function loadMeta() {
    setLoading(true);
    const data = await fetchMediaMeta(type, id);
    setMeta(data);

    if (data) {
      if (type === 'tv' || type === 'series') {
        // Group episodes by season
        const seasons = {};
        (data.videos || []).forEach(vid => {
          if (vid.season === undefined) return;
          if (!seasons[vid.season]) seasons[vid.season] = [];
          seasons[vid.season].push(vid);
        });

        // Find first valid season and its first episode
        const seasonNums = Object.keys(seasons).map(Number).sort((a, b) => a - b);
        if (seasonNums.length > 0) {
          const firstSeason = seasonNums.find(s => s > 0) || seasonNums[0]; // Avoid season 0 (specials) if possible
          setActiveSeason(firstSeason);
          
          const eps = seasons[firstSeason].sort((a, b) => (a.episode || 0) - (b.episode || 0));
          if (eps.length > 0) {
            setActiveEpisode(eps[0]);
            setPlayerSrc(`https://vidsrc-embed.ru/embed/tv/${id}/${firstSeason}-${eps[0].episode}?autoplay=1&autonext=1`);
          }
        }
      } else {
        setPlayerSrc(`https://vidsrc-embed.ru/embed/movie/${id}?autoplay=1`);
      }
    }
    setLoading(false);
  }

  function handleEpisodeClick(ep) {
    setActiveEpisode(ep);
    setPlayerSrc(`https://vidsrc-embed.ru/embed/tv/${id}/${activeSeason}-${ep.episode}?autoplay=1&autonext=1`);
    
    // Smooth scroll player into view
    const playerEl = document.getElementById('watch-player-iframe');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (loading) {
    return (
      <div className="watch-loading-container">
        <div className="spinner" />
        <p>Loading media credentials and cinematic layers...</p>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="watch-error-container">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Failed to Load Media Metadata</h2>
        <p>This movie or TV series was not found or has been removed from catalogs.</p>
        <Link to="/dramas-movies" className="btn-back">
          <ArrowLeft size={16} /> Back to Movies
        </Link>
      </div>
    );
  }

  // Group videos/episodes by season
  const seasonsMap = {};
  const isSeries = type === 'tv' || type === 'series';
  if (isSeries && meta.videos) {
    meta.videos.forEach(vid => {
      if (vid.season === undefined) return;
      if (!seasonsMap[vid.season]) seasonsMap[vid.season] = [];
      seasonsMap[vid.season].push(vid);
    });
  }
  const seasonNumbers = Object.keys(seasonsMap).map(Number).sort((a, b) => a - b);

  return (
    <div className="watch-detail-container">
      {/* Immersive Blurred Hero Background */}
      <div 
        className="watch-hero-bg" 
        style={{ backgroundImage: `url(${meta.background})` }}
      >
        <div className="watch-hero-overlay" />
      </div>

      <div className="watch-main-layout">
        {/* Back Link */}
        <Link to="/dramas-movies" className="watch-back-link">
          <ArrowLeft size={18} /> Back to Movies & Dramas
        </Link>

        {/* Cinematic Media Info Row */}
        <div className="watch-meta-showcase">
          <div className="showcase-poster">
            <img 
              src={meta.poster || `https://live.metahub.space/poster/medium/${id}/img`} 
              alt={meta.name} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?q=80&w=300&auto=format&fit=crop';
              }}
            />
          </div>
          
          <div className="showcase-details">
            <div className="showcase-badges">
              {meta.imdbRating && (
                <span className="badge-rating">
                  <Star size={14} fill="currentColor" /> {meta.imdbRating} IMDb
                </span>
              )}
              {meta.runtime && (
                <span className="badge-runtime">
                  <Clock size={14} /> {meta.runtime}
                </span>
              )}
              {meta.releaseInfo && (
                <span className="badge-year">
                  <Calendar size={14} /> {meta.releaseInfo}
                </span>
              )}
              <span className="badge-type">
                {isSeries ? 'TV SERIES' : 'MOVIE'}
              </span>
            </div>

            <h1>{meta.name}</h1>
            
            {meta.genres && meta.genres.length > 0 && (
              <div className="showcase-genres">
                {meta.genres.map(g => <span key={g} className="genre-pill">{g}</span>)}
              </div>
            )}

            <p className="showcase-synopsis">{meta.description}</p>

            {meta.cast && meta.cast.length > 0 && (
              <p className="showcase-cast">
                <strong>Starring:</strong> {meta.cast.slice(0, 5).join(', ')}
              </p>
            )}
            {meta.director && meta.director.length > 0 && (
              <p className="showcase-director">
                <strong>Director:</strong> {meta.director.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Video Player Section */}
        <div className="watch-player-wrapper">
          <div className="watch-player-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Film size={20} className="glow-icon" />
              <h2>
                Currently Streaming: {isSeries && activeEpisode ? `Season ${activeSeason} - Episode ${activeEpisode.episode} "${activeEpisode.title || 'Untitled'}"` : meta.name}
              </h2>
            </div>
            <span className="badge-quality">Server: VidSrc-Embed (Sandboxed)</span>
          </div>

          <div className="watch-iframe-container">
            <iframe
              id="watch-player-iframe"
              src={playerSrc}
              title={meta.name}
              sandbox="allow-scripts allow-forms allow-pointer-lock allow-same-origin"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        </div>

        {/* Season & Episode Selector for TV Shows */}
        {isSeries && seasonNumbers.length > 0 && (
          <div className="watch-series-selector">
            <div className="season-tabs-row">
              {seasonNumbers.map(sNum => (
                <button
                  key={sNum}
                  className={`season-tab-btn ${activeSeason === sNum ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSeason(sNum);
                    const sortedEps = seasonsMap[sNum].sort((a, b) => (a.episode || 0) - (b.episode || 0));
                    if (sortedEps.length > 0) {
                      setActiveEpisode(sortedEps[0]);
                      setPlayerSrc(`https://vidsrc-embed.ru/embed/tv/${id}/${sNum}-${sortedEps[0].episode}?autoplay=1&autonext=1`);
                    }
                  }}
                >
                  Season {sNum === 0 ? 'Specials' : sNum}
                </button>
              ))}
            </div>

            <div className="episode-selector-grid">
              {activeSeason !== null && seasonsMap[activeSeason] && (
                seasonsMap[activeSeason]
                  .sort((a, b) => (a.episode || 0) - (b.episode || 0))
                  .map(ep => {
                    const isActive = activeEpisode?.episode === ep.episode;
                    const epThumb = ep.thumbnail || `https://episodes.metahub.space/${id}/${activeSeason}/${ep.episode}/w780.jpg`;
                    
                    return (
                      <button
                        key={ep.id || ep.episode}
                        className={`episode-card-btn ${isActive ? 'active' : ''}`}
                        onClick={() => handleEpisodeClick(ep)}
                      >
                        <div className="ep-card-thumb">
                          <img
                            src={epThumb}
                            alt={ep.title || `Episode ${ep.episode}`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=300&auto=format&fit=crop';
                            }}
                            loading="lazy"
                          />
                          <div className="ep-card-overlay">
                            <Play fill="white" size={16} />
                          </div>
                          <span className="ep-card-num">EP {ep.episode}</span>
                        </div>
                        <div className="ep-card-details">
                          <h4>{ep.title || `Episode ${ep.episode}`}</h4>
                          {ep.released && (
                            <span className="ep-card-date">
                              {new Date(ep.released).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieWatch;
