import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeById, stripHtml } from '../api/anilist';
import { searchMangaDex, fetchMangaChapters, fetchChapterPages } from '../api/manga';
import { BookOpen, Calendar, Star, Users, ArrowLeft, ArrowRight, X, Loader2, Heart, ExternalLink } from 'lucide-react';

function safeTitle(title) {
  if (!title) return 'Unknown Title';
  return title.english || title.romaji || title.native || 'Unknown Title';
}

function MangaDetails() {
  const { id } = useParams();

  // Media state (from AniList)
  const [manga, setManga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Chapter state (from MangaDex)
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  
  // Reader state
  const [activeChapter, setActiveChapter] = useState(null);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Load AniList Data
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchAnimeById(id);
        if (!data) throw new Error('Manga not found');
        setManga(data);
        
        // After loading AniList data, find the manga on MangaDex
        const titlesToTry = [
          data.title?.english,
          data.title?.romaji,
          data.title?.native
        ].filter(Boolean);
        
        findMangaDex(titlesToTry);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
    window.scrollTo(0, 0);
  }, [id]);

  async function findMangaDex(titles) {
    setLoadingChapters(true);
    const mdexManga = await searchMangaDex(titles);
    if (mdexManga) {
      const chaps = await fetchMangaChapters(mdexManga.id);
      // Remove duplicates based on chapter number
      const unique = [];
      const seen = new Set();
      chaps.forEach(c => {
        if (!seen.has(c.chapter)) {
          seen.add(c.chapter);
          unique.push(c);
        }
      });
      setChapters(unique);
    }
    setLoadingChapters(false);
  }

  async function openChapter(chapter) {
    setActiveChapter(chapter);
    setIsReaderOpen(true);
    setLoadingPages(true);
    setPages([]);
    
    const imageUrls = await fetchChapterPages(chapter.id);
    setPages(imageUrls);
    setLoadingPages(false);
  }

  function closeReader() {
    setIsReaderOpen(false);
    setActiveChapter(null);
    setPages([]);
  }

  function nextChapter() {
    if (!chapters || !activeChapter) return;
    const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
    if (currentIndex < chapters.length - 1) {
      openChapter(chapters[currentIndex + 1]);
    }
  }

  function prevChapter() {
    if (!chapters || !activeChapter) return;
    const currentIndex = chapters.findIndex(c => c.id === activeChapter.id);
    if (currentIndex > 0) {
      openChapter(chapters[currentIndex - 1]);
    }
  }

  if (loading) {
    return (
      <div className="status-container">
        <Loader2 className="spin" size={48} />
        <p>Loading manga details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="btn-play-v2">Return Home</Link>
      </div>
    );
  }

  const mangaTitle = safeTitle(manga.title);

  return (
    <>
      {/* ── Manga Reader Fullscreen Overlay ── */}
      {isReaderOpen && (
        <div className="manga-reader-overlay">
          <div className="reader-toolbar">
            <div className="toolbar-left">
              <button className="reader-btn" onClick={closeReader}>
                <X size={24} /> Close
              </button>
              <span className="reader-title">
                {mangaTitle} - Chapter {activeChapter?.chapter}
              </span>
            </div>
            <div className="toolbar-right">
              <button className="reader-btn" onClick={prevChapter} disabled={chapters.findIndex(c => c.id === activeChapter?.id) <= 0}>
                <ArrowLeft size={20} /> Prev
              </button>
              <button className="reader-btn" onClick={nextChapter} disabled={chapters.findIndex(c => c.id === activeChapter?.id) >= chapters.length - 1}>
                Next <ArrowRight size={20} />
              </button>
            </div>
          </div>

          <div className="reader-content">
            {loadingPages ? (
              <div className="status-container">
                <Loader2 className="spin" size={48} />
                <p>Loading pages...</p>
              </div>
            ) : pages.length > 0 ? (
              <div className="pages-container">
                {pages.map((url, i) => (
                  <img key={i} src={url} alt={`Page ${i + 1}`} loading="lazy" className="manga-page" />
                ))}
                
                {/* End of chapter actions */}
                <div className="end-of-chapter">
                  <h3>End of Chapter {activeChapter?.chapter}</h3>
                  <button className="btn-play-v2" onClick={nextChapter}>
                    Read Next Chapter <ArrowRight size={20} style={{ marginLeft: 8 }} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="status-container">
                <p>No pages found for this chapter.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Normal Details Page ── */}
      <div className="detail-hero-v2">
        <img
          className="detail-banner-v2"
          src={manga.bannerImage || manga.coverImage?.extraLarge}
          alt=""
        />
        <div className="detail-hero-overlay-v2" />

        <div className="detail-hero-content-v2">
          <img
            className="detail-poster-v2"
            src={manga.coverImage?.large}
            alt={mangaTitle}
          />
          <div className="detail-info-v2">
            <div className="detail-meta-v2">
              <span className="score"><Star size={16} fill="currentColor" /> {manga.averageScore}%</span>
              <span><BookOpen size={16} /> {manga.format || 'MANGA'}</span>
              <span><Users size={16} /> {manga.status}</span>
              {manga.seasonYear && <span><Calendar size={16} /> {manga.seasonYear}</span>}
            </div>
            <h1 className="detail-title-v2">{mangaTitle}</h1>
            <div className="detail-actions-v2">
              <button
                className="btn-play-v2"
                onClick={() => {
                  if (chapters.length > 0) openChapter(chapters[0]);
                }}
                disabled={chapters.length === 0}
              >
                <BookOpen size={20} fill="currentColor" /> Read Chapter 1
              </button>
              <button className="btn-info-v2">
                <Heart size={20} /> Add to List
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-layout-v2">
        <div className="main-content-v2">
          <div className="details-section-v2">
            <h2>Synopsis</h2>
            <p>{stripHtml(manga.description)}</p>
          </div>

          <div className="details-section-v2">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>
                Chapters
                <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  ({chapters.length}) - Source: MangaDex
                </span>
              </h2>
            </div>

            {loadingChapters ? (
              <p>Searching MangaDex for chapters...</p>
            ) : chapters.length > 0 ? (
              <div className="episodes-grid-v2">
                {chapters.map(chap => (
                  <button
                    key={chap.id}
                    className={`episode-btn-v2 ${activeChapter?.id === chap.id ? 'active' : ''}`}
                    onClick={() => openChapter(chap)}
                  >
                    <span className="episode-label">CH</span>
                    <span className="episode-number">{chap.chapter || '?'}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="official-links-container">
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                  This manga is officially licensed. Community chapters are unavailable due to DMCA, but you can read it on the official platforms below:
                </p>
                {manga.externalLinks && manga.externalLinks.length > 0 ? (
                  <div className="streaming-links-sidebar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {manga.externalLinks
                      .filter(link => ['MANGA Plus', 'VIZ', 'Shonen Jump Plus', 'Mangas.io', 'Official Site'].includes(link.site))
                      .map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="streaming-sidebar-item">
                          <span style={{ fontWeight: 600, color: '#fff' }}>{link.site}</span>
                          <ExternalLink size={16} />
                        </a>
                      ))}
                    {/* Fallback if none of the specific sites match but there are external links */}
                    {manga.externalLinks.filter(link => ['MANGA Plus', 'VIZ', 'Shonen Jump Plus', 'Mangas.io', 'Official Site'].includes(link.site)).length === 0 && 
                      manga.externalLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="streaming-sidebar-item">
                          <span style={{ fontWeight: 600, color: '#fff' }}>{link.site}</span>
                          <ExternalLink size={16} />
                        </a>
                      ))
                    }
                  </div>
                ) : (
                  <p>No English chapters or official links found for this title.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="sidebar-v2">
          <div className="sidebar-block-v2">
            <h3>Details</h3>
            <div className="info-list-v2">
              <div className="info-row-v2">
                <span className="info-label-v2">Native Title</span>
                <span className="info-value-v2">{manga.title?.native}</span>
              </div>
              <div className="info-row-v2">
                <span className="info-label-v2">Chapters</span>
                <span className="info-value-v2">{manga.chapters || 'Unknown'}</span>
              </div>
              <div className="info-row-v2">
                <span className="info-label-v2">Volumes</span>
                <span className="info-value-v2">{manga.volumes || 'Unknown'}</span>
              </div>
              <div className="info-row-v2">
                <span className="info-label-v2">Source</span>
                <span className="info-value-v2">{manga.source}</span>
              </div>
              <div className="info-row-v2">
                <span className="info-label-v2">Genres</span>
                <div className="genre-tags-v2">
                  {manga.genres?.map(g => (
                    <Link key={g} to={`/search?genre=${g}`} className="genre-tag-v2">{g}</Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default MangaDetails;
