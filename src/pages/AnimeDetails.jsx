import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeById, stripHtml } from '../api/anilist';
import { fetchStreamingLinks, fetchAnimeVideos, fetchEpisodes } from '../api/jikan';

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
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [progress, setProgress] = useState(() => JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'));
  const [activeTab, setActiveTab] = useState('streaming');
  const [trailerError, setTrailerError] = useState(false);

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

        // Fetch Jikan streaming data if MAL id exists
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
            // Jikan may fail or rate limit; non-critical
            console.warn('Jikan fetch failed:', jikanErr.message);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load anime details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const episodes = anime?.episodes || 0;

  function markWatched(ep) {
    if (!anime) return;
    const next = { ...progress, [anime.id]: ep };
    setProgress(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
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

  return (
    <section className="details-page">
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
            {trailerUrl && !trailerError ? (
              <button
                className="button button-primary"
                onClick={() => setActiveTab('trailer')}
              >
                <span className="material-symbols-outlined">play_circle</span>
                Watch Trailer
              </button>
            ) : null}
            {streamingLinks.length > 0 && (
              <button
                className="button button-secondary"
                onClick={() => setActiveTab('streaming')}
              >
                <span className="material-symbols-outlined">play_circle</span>
                Where to Watch
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-main glass-card">
          {/* Trailer / Streaming Tabs */}
          {activeTab === 'trailer' && trailerUrl && (
            <div className="trailer-section">
              <div className="section-title">
                <h2>Trailer</h2>
                <button className="text-button" onClick={() => setActiveTab('streaming')}>
                  Streaming Options
                </button>
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

          {/* Streaming Links */}
          {activeTab === 'streaming' && streamingLinks.length > 0 && (
            <div className="streaming-section">
              <div className="section-title">
                <h2>Watch Now</h2>
                <span>{streamingLinks.length} platform{streamingLinks.length > 1 ? 's' : ''}</span>
              </div>
              <div className="streaming-grid">
                {streamingLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="streaming-card"
                  >
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=64`}
                      alt={link.name}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <strong>{link.name}</strong>
                      <span>Watch on {link.name}</span>
                    </div>
                    <span className="material-symbols-outlined external-icon">open_in_new</span>
                  </a>
                ))}
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

          {/* Episode List */}
          <div className="episodes-section">
            <div className="section-title">
              <h2>Episodes</h2>
              <span>{episodes > 0 ? `${episodes} total` : ''}</span>
            </div>
            {episodeList.length > 0 ? (
              <div className="episode-list scroll-episodes">
                {episodeList.map((ep) => {
                  const epNum = ep.mal_id;
                  const isWatched = progress[anime.id] >= epNum;
                  const isCurrent = progress[anime.id] === epNum;
                  return (
                    <button
                      key={ep.mal_id}
                      type="button"
                      className={`episode-card ${isCurrent ? 'active' : ''} ${isWatched ? 'watched' : ''}`}
                      onClick={() => markWatched(epNum)}
                    >
                      <strong>{String(epNum).padStart(2, '0')}</strong>
                      <span className="ep-title">{ep.title || `Episode ${epNum}`}</span>
                      {ep.aired && <span className="ep-date">{ep.aired}</span>}
                      {isWatched && <span className="ep-check">✓ Watched</span>}
                    </button>
                  );
                })}
              </div>
            ) : episodes > 0 ? (
              <div className="episode-list">
                {Array.from({ length: Math.min(episodes, 24) }, (_, index) => {
                  const ep = index + 1;
                  const isWatched = progress[anime.id] >= ep;
                  const isCurrent = progress[anime.id] === ep;
                  return (
                    <button
                      key={ep}
                      type="button"
                      className={`episode-card ${isCurrent ? 'active' : ''} ${isWatched ? 'watched' : ''}`}
                      onClick={() => markWatched(ep)}
                    >
                      <strong>{String(ep).padStart(2, '0')}</strong>
                      <span>Episode {ep}</span>
                      {isWatched && <span className="ep-check">✓ Watched</span>}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="status">Episode list not available yet.</p>
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
            {streamingLinks.length > 0 && (
              <a
                href={streamingLinks[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary full-width"
              >
                <span className="material-symbols-outlined">play_circle</span>
                Watch on {streamingLinks[0].name}
              </a>
            )}
            {anime.externalLinks?.length > 0 && (
              <div className="external-links">
                {anime.externalLinks.slice(0, 4).map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button button-secondary full-width"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                    {link.site}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Watch Progress */}
          {progress[anime.id] && (
            <div className="sidebar-block">
              <h3>Progress</h3>
              <div className="progress-bar-container">
                <div className="progress-bar-label">
                  Episode {progress[anime.id]}{episodes > 0 ? ` of ${episodes}` : ''}
                </div>
                {episodes > 0 && (
                  <div className="progress-bar-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.round((progress[anime.id] / episodes) * 100)}%` }}
                    />
                  </div>
                )}
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
                {anime.recommendations.nodes.slice(0, 4).map((rec) => {
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