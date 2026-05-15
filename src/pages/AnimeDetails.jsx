import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeById, stripHtml } from '../api/anilist';
import { fetchStreamingLinks, fetchAnimeVideos, fetchEpisodes } from '../api/jikan';
import { searchGogoanime, fetchGogoEpisodes, fetchEpisodeSources } from '../api/consumet';
import VideoPlayer from '../components/VideoPlayer';

const PROGRESS_KEY = 'animevault_progress';
const RECENTS_KEY = 'animevault_recently_viewed';

function AnimeDetails() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streamingLinks, setStreamingLinks] = useState([]);
  const [videos, setVideos] = useState(null);
  const [episodeList, setEpisodeList] = useState([]);
  const [progress, setProgress] = useState(() => JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'));
  const [activeTab, setActiveTab] = useState('streaming');
  const [trailerError, setTrailerError] = useState(false);

  // Real streaming state
  const [gogoId, setGogoId] = useState(null);
  const [gogoEpisodes, setGogoEpisodes] = useState([]);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [videoSources, setVideoSources] = useState([]);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [gogoLoading, setGogoLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError('');
        const media = await fetchAnimeById(id);
        setAnime(media);

        // Add to recently viewed
        const recents = JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
        const updated = [{ id: media.id, title: media.title.romaji }, ...recents.filter((item) => item.id !== media.id)].slice(0, 10);
        localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));

        // Fetch Jikan data
        const malId = media.idMal;
        if (malId) {
          try {
            const [links, vidData, eps] = await Promise.all([
              fetchStreamingLinks(malId),
              fetchAnimeVideos(malId),
              fetchEpisodes(malId),
            ]);
            setStreamingLinks(links);
            setVideos(vidData);
            setEpisodeList(eps);
          } catch (jikanErr) {
            console.warn('Jikan fetch failed:', jikanErr.message);
          }
        }

        // Find Gogoanime ID for real streaming
        try {
          setGogoLoading(true);
          const gogoId = await findBestGogoMatch(media.title.romaji, media.seasonYear, media.title.english);
          if (gogoId) {
            setGogoId(gogoId);
            const eps = await fetchGogoEpisodes(gogoId);
            setGogoEpisodes(eps);

            // Auto-play the last watched episode or episode 1
            const lastProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}')[media.id];
            const targetEp = eps.find(e => e.number === (lastProgress || 1)) || eps[eps.length - 1] || eps[0];
            if (targetEp) {
              setCurrentEpisode(targetEp);
              loadEpisodeSources(targetEp.id);
            }
          }
        } catch (gogoErr) {
          console.warn('Gogoanime search failed:', gogoErr.message);
        } finally {
          setGogoLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Failed to load anime details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function findBestGogoMatch(romaji, year, english) {
    try {
      // Try romaji first
      let results = await searchGogoanime(romaji);
      if (results.length === 0 && english) {
        results = await searchGogoanime(english);
      }
      if (results.length === 0) return null;

      // Try to match by year
      if (year) {
        const yearMatch = results.find((r) => r.releaseDate && String(r.releaseDate).includes(String(year)));
        if (yearMatch) return yearMatch.id;
      }

      // Try to match romaji title closely
      const romajiLower = romaji.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      const closeMatch = results.find((r) => {
        const titleLower = (r.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '');
        return titleLower.includes(romajiLower) || romajiLower.includes(titleLower);
      });
      if (closeMatch) return closeMatch.id;

      return results[0].id;
    } catch (err) {
      console.warn('Failed to find Gogoanime match:', err.message);
      return null;
    }
  }

  async function loadEpisodeSources(episodeId) {
    if (!episodeId) return;
    setPlayerLoading(true);
    setPlayerError('');
    setVideoSources([]);
    try {
      const data = await fetchEpisodeSources(episodeId);
      if (data.sources && data.sources.length > 0) {
        // Sort by quality (highest first)
        const sorted = [...data.sources].sort((a, b) => {
          const aQ = a.quality ? parseInt(a.quality) : 0;
          const bQ = b.quality ? parseInt(b.quality) : 0;
          return bQ - aQ;
        });
        setVideoSources(sorted);
      } else {
        setPlayerError('No video sources available for this episode');
      }
    } catch (err) {
      setPlayerError(err.message || 'Failed to load video');
    } finally {
      setPlayerLoading(false);
    }
  }

  function selectEpisode(ep) {
    if (!ep || !ep.id) return;
    setCurrentEpisode(ep);
    markWatched(ep.number);
    loadEpisodeSources(ep.id);
  }

  function markWatched(epNum) {
    if (!anime) return;
    const next = { ...progress, [anime.id]: Math.max(progress[anime.id] || 0, epNum) };
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  }

  function goToNextEpisode() {
    if (!currentEpisode || !gogoEpisodes.length) return;
    const currentIndex = gogoEpisodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIndex < gogoEpisodes.length - 1) {
      selectEpisode(gogoEpisodes[currentIndex + 1]);
    }
  }

  function goToPrevEpisode() {
    if (!currentEpisode || !gogoEpisodes.length) return;
    const currentIndex = gogoEpisodes.findIndex(e => e.id === currentEpisode.id);
    if (currentIndex > 0) {
      selectEpisode(gogoEpisodes[currentIndex - 1]);
    }
  }

  const getYoutubeEmbedUrl = useCallback((trailer) => {
    if (!trailer) return null;
    if (trailer.site === 'youtube' && trailer.id) {
      return `https://www.youtube.com/embed/${trailer.id}`;
    }
    return null;
  }, []);

  const featuredTrailer = useMemo(() => {
    if (anime?.trailer) return getYoutubeEmbedUrl(anime.trailer);
    if (videos?.promo?.length > 0) {
      const promo = videos.promo[0];
      if (promo?.trailer?.youtube_id) {
        return `https://www.youtube.com/embed/${promo.trailer.youtube_id}`;
      }
    }
    return null;
  }, [anime, videos, getYoutubeEmbedUrl]);

  if (loading) return <p className="status">Loading anime details...</p>;
  if (error) return <p className="status error">{error}</p>;
  if (!anime) return null;

  const trailerUrl = featuredTrailer;
  const episodes = anime?.episodes || 0;
  const hasNextEpisode = currentEpisode && gogoEpisodes.findIndex(e => e.id === currentEpisode.id) < gogoEpisodes.length - 1;
  const hasPrevEpisode = currentEpisode && gogoEpisodes.findIndex(e => e.id === currentEpisode.id) > 0;

  return (
    <section className="details-page">
      {/* Video Player Section */}
      {currentEpisode && (
        <div className="video-player-section">
          <VideoPlayer
            sources={videoSources}
            poster={anime.coverImage?.extraLarge || anime.coverImage?.large}
            title={`${anime.title.romaji} - Episode ${currentEpisode.number}`}
            episodeNum={currentEpisode.number}
            totalEpisodes={gogoEpisodes.length}
            onNext={hasNextEpisode ? goToNextEpisode : null}
            onPrev={hasPrevEpisode ? goToPrevEpisode : null}
            hasNext={!!hasNextEpisode}
            hasPrev={!!hasPrevEpisode}
          />
          {playerLoading && (
            <div className="episode-loading-bar">
              <div className="spinner-sm" />
              <span>Loading episode {currentEpisode.number}...</span>
            </div>
          )}
          {playerError && (
            <div className="episode-error-bar">
              <span className="material-symbols-outlined">warning</span>
              <span>{playerError}</span>
              <button className="text-button" onClick={() => loadEpisodeSources(currentEpisode.id)}>Retry</button>
            </div>
          )}
        </div>
      )}

      {/* Hero Banner */}
      <div className="detail-hero">
        <img
          className="detail-cover"
          src={anime.bannerImage || anime.coverImage?.extraLarge || anime.coverImage?.large}
          alt={anime.title.romaji}
        />
        <div className="detail-hero-overlay" />
        <div className="detail-hero-copy">
          <span className="tag">{anime.format || 'ANIME'}</span>
          <h1>{anime.title.romaji}</h1>
          <p>{stripHtml(anime.description).slice(0, 240)}...</p>
          <div className="detail-tags">
            {anime.episodes && <span>{anime.episodes} Episodes</span>}
            {anime.duration && <span>{anime.duration} min/ep</span>}
            <span>{anime.genres?.join(' / ')}</span>
            {anime.averageScore && <span>Score: {anime.averageScore}%</span>}
            {anime.seasonYear && <span>{anime.season} {anime.seasonYear}</span>}
          </div>
          <div className="hero-buttons">
            {trailerUrl && !trailerError && (
              <button
                className="button button-secondary"
                onClick={() => setActiveTab('trailer')}
              >
                <span className="material-symbols-outlined">play_circle</span>
                Watch Trailer
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-main glass-card">
          {/* Trailer Section */}
          {activeTab === 'trailer' && trailerUrl && (
            <div className="trailer-section">
              <div className="section-title">
                <h2>Trailer</h2>
                <button className="text-button" onClick={() => setActiveTab('streaming')}>Close</button>
              </div>
              <div className="trailer-embed">
                <iframe
                  src={trailerUrl}
                  title={`${anime.title.romaji} Trailer`}
                  allowFullScreen
                  frameBorder="0"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  onError={() => setTrailerError(true)}
                />
              </div>
            </div>
          )}

          {/* Synopsis */}
          <div className="details-intro">
            <h2>Synopsis</h2>
            <p>{stripHtml(anime.description)}</p>
          </div>

          {/* Status Info */}
          <div className="info-grid">
            {anime.status && (
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value">{anime.status.replace(/_/g, ' ')}</span>
              </div>
            )}
            {anime.source && (
              <div className="info-item">
                <span className="info-label">Source</span>
                <span className="info-value">{anime.source.replace(/_/g, ' ')}</span>
              </div>
            )}
            {anime.studios?.nodes?.length > 0 && (
              <div className="info-item">
                <span className="info-label">Studio</span>
                <span className="info-value">{anime.studios.nodes.map(s => s.name).join(', ')}</span>
              </div>
            )}
            {anime.meanScore && (
              <div className="info-item">
                <span className="info-label">Score</span>
                <span className="info-value">{anime.meanScore / 10} / 10</span>
              </div>
            )}
          </div>

          {/* Episode List (Real Gogoanime) */}
          <div className="episodes-section">
            <div className="section-title">
              <h2>Episodes</h2>
              <span>{gogoEpisodes.length > 0 ? `${gogoEpisodes.length} episodes available` : episodes > 0 ? `${episodes} total` : ''}</span>
            </div>

            {gogoEpisodes.length > 0 ? (
              <div className="episode-list scroll-episodes">
                {gogoEpisodes.map((ep) => {
                  const isWatched = progress[anime.id] >= ep.number;
                  const isCurrent = currentEpisode?.id === ep.id;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      className={`episode-card ${isCurrent ? 'active' : ''} ${isWatched ? 'watched' : ''}`}
                      onClick={() => selectEpisode(ep)}
                    >
                      <strong>{String(ep.number).padStart(2, '0')}</strong>
                      <span className="ep-title">{ep.title || `Episode ${ep.number}`}</span>
                      {ep.isFiller && <span className="ep-badge-filler">Filler</span>}
                      {isWatched && <span className="ep-check">✓ Watched</span>}
                      {isCurrent && <span className="ep-now-playing">▶ Now Playing</span>}
                    </button>
                  );
                })}
              </div>
            ) : episodes > 0 ? (
              <p className="status">
                We found this title, but real stream episodes are not available from our live provider right now.
                Try another title or use the official streaming links below.
              </p>
            ) : (
              <p className="status">Episode list not available yet.</p>
            )}

            {gogoLoading && (
              <p className="status">Loading episode list from Gogoanime...</p>
            )}
          </div>
        </div>

        <aside className="details-sidebar glass-card">
          {/* Poster */}
          <div className="sidebar-poster">
            <img src={anime.coverImage?.large || anime.coverImage?.extraLarge} alt={anime.title.romaji} />
          </div>

          {/* Quick Actions */}
          <div className="sidebar-block">
            <h3>Quick Actions</h3>
            {currentEpisode && (
              <button
                className="button button-primary full-width"
                onClick={() => {
                  const el = document.querySelector('.video-player-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span className="material-symbols-outlined">play_circle</span>
                Continue Episode {currentEpisode.number}
              </button>
            )}
            <button
              className="button button-secondary full-width"
              onClick={() => {
                if (gogoEpisodes.length > 0) {
                  const nextUnwatched = gogoEpisodes.find(ep => !progress[anime.id] || progress[anime.id] < ep.number);
                  selectEpisode(nextUnwatched || gogoEpisodes[0]);
                }
              }}
            >
              <span className="material-symbols-outlined">playlist_play</span>
              {progress[anime.id] ? 'Continue Watching' : 'Start Watching'}
            </button>
          </div>

          {/* Watch Progress */}
          {progress[anime.id] && gogoEpisodes.length > 0 && (
            <div className="sidebar-block">
              <h3>Progress</h3>
              <div className="progress-bar-container">
                <div className="progress-bar-label">
                  Episode {progress[anime.id]} of {gogoEpisodes.length}
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.round((progress[anime.id] / gogoEpisodes.length) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="sidebar-block">
            <h3>Details</h3>
            <dl className="details-list">
              {anime.format && <><dt>Format</dt><dd>{anime.format}</dd></>}
              {anime.episodes && <><dt>Episodes</dt><dd>{anime.episodes}</dd></>}
              {anime.duration && <><dt>Duration</dt><dd>{anime.duration} min</dd></>}
              {anime.status && <><dt>Status</dt><dd>{anime.status.replace(/_/g, ' ')}</dd></>}
              {anime.seasonYear && <><dt>Season</dt><dd>{anime.season} {anime.seasonYear}</dd></>}
              {anime.averageScore && <><dt>Score</dt><dd>{anime.averageScore}%</dd></>}
            </dl>
          </div>

          {/* Genres */}
          {anime.genres?.length > 0 && (
            <div className="sidebar-block">
              <h3>Genres</h3>
              <div className="genre-tags">
                {anime.genres.map((genre) => (
                  <Link key={genre} to={`/search?genre=${genre}`} className="genre-tag">
                    {genre}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* External Streaming Links */}
          {streamingLinks.length > 0 && (
            <div className="sidebar-block">
              <h3>Watch on Official Sites</h3>
              <div className="streaming-links-sidebar">
                {streamingLinks.slice(0, 5).map((link, i) => {
                  let hostname = '';
                  try {
                    hostname = new URL(link.url).hostname;
                  } catch {
                    hostname = '';
                  }

                  return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="streaming-sidebar-item"
                  >
                    {hostname ? (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=64`}
                        alt={link.name}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                    <span>{link.name}</span>
                    <span className="material-symbols-outlined">open_in_new</span>
                  </a>
                )})}
              </div>
            </div>
          )}

          {/* Trailers / Promos */}
          {videos?.promo?.length > 0 && (
            <div className="sidebar-block">
              <h3>Promo Videos</h3>
              <div className="promo-list">
                {videos.promo.slice(0, 4).map((promo, i) => (
                  <a
                    key={i}
                    href={`https://www.youtube.com/watch?v=${promo.trailer?.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="promo-item"
                  >
                    <img src={promo.trailer?.thumbnail || ''} alt={promo.title || 'Promo'} />
                    <span>{promo.title || 'Promo Video'}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {anime.recommendations?.nodes?.length > 0 && (
            <div className="sidebar-block">
              <h3>You Might Also Like</h3>
              <div className="related-list">
                {anime.recommendations.nodes.slice(0, 6).map((rec) => {
                  const m = rec.mediaRecommendation;
                  return (
                    <Link key={m.id} to={`/anime/${m.id}`} className="related-item">
                      <img src={m.coverImage?.medium || m.coverImage?.large} alt={m.title.romaji} />
                      <div>
                        <p>{m.title.romaji}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export default AnimeDetails;
