import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, Clock, Calendar, Film, Tv, Sparkles, Award } from 'lucide-react';
import { fetchPublicUserProfile } from '../api/db';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80';

export default function UserProfile() {
  const { username } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('likes'); // 'likes' | 'continue' | 'history'

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const data = await fetchPublicUserProfile(username);
        setProfileData(data);
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{
          width: '40px', height: '40px', border: '3px solid rgba(255,26,117,0.2)',
          borderTopColor: 'var(--brand-color)', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 20px'
        }} />
        <span style={{ fontSize: '0.95rem' }}>Loading user files...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-secondary)' }}>
        <h2 style={{ color: '#fff', marginBottom: '8px' }}>User Not Found</h2>
        <p style={{ fontSize: '0.9rem', margin: '0 0 20px' }}>The specified vault citizen record could not be located.</p>
        <Link to="/" style={{
          background: 'var(--brand-color)', color: '#000', padding: '10px 20px',
          borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem'
        }}>
          Return Home
        </Link>
      </div>
    );
  }

  const { user, likes, history, continueWatching } = profileData;

  const getPosterUrl = (item, type = 'card') => {
    if (item.media_poster && item.media_poster.trim() !== '') return item.media_poster;
    if (item.coverImage && item.coverImage.large) return item.coverImage.large;
    if (item.media_type === 'movie' || item.media_type === 'series' || item.media_type === 'tv') {
      return `https://live.metahub.space/poster/medium/${item.media_id}/img`;
    }
    if (type === 'list') return 'https://placehold.co/45x64/1a1a2e/ff1a75.png?text=No+Img';
    if (type === 'poster') return 'https://placehold.co/140x210/1a1a2e/ff1a75.png?text=No+Image';
    return 'https://placehold.co/300x169/1a1a2e/ff1a75.png?text=No+Image';
  };

  return (
    <div className="profile-container" style={{
      maxWidth: '1200px', margin: '40px auto 80px', padding: '0 20px',
      color: '#fff', animation: 'profileFadeIn 0.4s ease-out'
    }}>
      
      {/* ── BANNER CONTAINER ── */}
      <div className="profile-banner-wrap" style={{
        position: 'relative', height: '320px', borderRadius: '20px',
        overflow: 'hidden', border: '1px solid rgba(255, 26, 117, 0.15)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)', background: '#0a0a14'
      }}>
        <img 
          src={user.banner || DEFAULT_BANNER} 
          alt="User Profile Banner" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => { e.target.src = DEFAULT_BANNER; }}
        />
      </div>

      {/* ── USER INFO / AVATAR LAYER ── */}
      <div className="profile-meta-row" style={{
        display: 'flex', gap: '30px', alignItems: 'flex-end',
        padding: '0 40px', marginTop: '-60px', position: 'relative', zIndex: 5
      }}>
        {/* Floating Circle Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: '140px', height: '140px', borderRadius: '50%',
            overflow: 'hidden', border: '5px solid #06060c',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)', background: '#121220'
          }}>
            <img 
              src={user.avatar || DEFAULT_AVATAR} 
              alt="Avatar picture"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
          </div>
        </div>

        {/* Username & Metadata */}
        <div style={{ flex: 1, paddingBottom: '10px' }}>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: '900', margin: 0,
            textShadow: '0 4px 15px rgba(0,0,0,0.8)', color: '#fff',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            {user.username}
            
            {/* Glowing Golden / Neon Pink ADMIN BADGE */}
            {user.is_admin ? (
              <span style={{
                fontSize: '0.8rem', fontWeight: '900', 
                background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                color: '#000', padding: '6px 14px', borderRadius: '20px',
                textTransform: 'uppercase', letterSpacing: '1.5px',
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                boxShadow: '0 0 15px rgba(255, 215, 0, 0.5), 0 0 30px rgba(255, 170, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Award size={14} /> ADMIN
              </span>
            ) : (
              <span style={{
                fontSize: '0.75rem', fontWeight: '800', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)',
                padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px'
              }}>
                Vault Citizen
              </span>
            )}
          </h1>
          <p style={{
            fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '6px 0 0',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Calendar size={14} style={{ color: user.is_admin ? '#ffd700' : '#ff1a75' }} /> Joined AnimeVault on {new Date(user.created_at || Date.now()).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* ── STATS DASHBOARD DECK ── */}
      <div className="profile-stats-deck" style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '40px'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: user.is_admin ? '#ffd700' : '#ff1a75' }}>{likes.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700', marginTop: '4px' }}>Favorites</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: user.is_admin ? '#ffd700' : '#ff1a75' }}>{continueWatching.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700', marginTop: '4px' }}>In Progress</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: user.is_admin ? '#ffd700' : '#ff1a75' }}>{history.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: '700', marginTop: '4px' }}>Episodes Watched</div>
        </div>
      </div>

      {/* ── DYNAMIC DASHBOARD CONTENT TABS ── */}
      <div style={{ marginTop: '50px' }}>
        {/* Navigation Bar */}
        <div style={{ 
          display: 'flex', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: '15px', marginBottom: '30px'
        }}>
          <button onClick={() => setActiveTab('likes')} style={{
            background: 'none', border: 'none', color: activeTab === 'likes' ? (user.is_admin ? '#ffd700' : 'var(--brand-color)') : 'var(--text-secondary)',
            fontSize: '1rem', fontWeight: '800', cursor: 'pointer', paddingBottom: '10px',
            position: 'relative', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Heart size={16} /> Favorites ({likes.length})
            {activeTab === 'likes' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '2px', background: user.is_admin ? '#ffd700' : 'var(--brand-color)' }} />}
          </button>

          <button onClick={() => setActiveTab('continue')} style={{
            background: 'none', border: 'none', color: activeTab === 'continue' ? (user.is_admin ? '#ffd700' : 'var(--brand-color)') : 'var(--text-secondary)',
            fontSize: '1rem', fontWeight: '800', cursor: 'pointer', paddingBottom: '10px',
            position: 'relative', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Tv size={16} /> Continue Watching ({continueWatching.length})
            {activeTab === 'continue' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '2px', background: user.is_admin ? '#ffd700' : 'var(--brand-color)' }} />}
          </button>

          <button onClick={() => setActiveTab('history')} style={{
            background: 'none', border: 'none', color: activeTab === 'history' ? (user.is_admin ? '#ffd700' : 'var(--brand-color)') : 'var(--text-secondary)',
            fontSize: '1rem', fontWeight: '800', cursor: 'pointer', paddingBottom: '10px',
            position: 'relative', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Clock size={16} /> Stream History ({history.length})
            {activeTab === 'history' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '2px', background: user.is_admin ? '#ffd700' : 'var(--brand-color)' }} />}
          </button>
        </div>

        {/* Tab Cards Panels */}
        <div>
          {/* TAB: LIKES & FAVORITES */}
          {activeTab === 'likes' && (
            likes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <Heart size={40} style={{ marginBottom: '14px', opacity: 0.5, color: user.is_admin ? '#ffd700' : '#ff1a75' }} />
                <h3 style={{ margin: '0 0 6px', color: '#fff' }}>Favorites are Empty</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>This user hasn't added any favorites yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px' }}>
                {likes.map((item, idx) => (
                  <Link 
                    key={idx} 
                    to={item.media_type === 'manga' ? `/manga/${item.media_id}` : (item.media_type === 'movie' || item.media_type === 'series' || item.media_type === 'tv' ? `/watch/${item.media_type}/${item.media_id}` : `/anime/${item.media_id}`)} 
                    style={{ textDecoration: 'none', position: 'relative' }}
                  >
                    <div style={{
                      position: 'relative', borderRadius: '14px', overflow: 'hidden',
                      aspectRatio: '2/3', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                      transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                    }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.borderColor = user.is_admin ? '#ffd700' : 'var(--brand-color)'; }}
                       onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}>
                      
                      <img src={getPosterUrl(item, 'poster')} alt={item.media_title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/140x210/1a1a2e/ff1a75.png?text=No+Image'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      <div style={{
                        position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)',
                        padding: '3px 8px', borderRadius: '5px', fontSize: '0.6rem', fontWeight: '900', textTransform: 'uppercase', color: user.is_admin ? '#ffd700' : 'var(--brand-color)'
                      }}>
                        {item.media_type}
                      </div>

                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, width: '100%',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.95))',
                        padding: '12px 10px 10px', fontSize: '0.75rem', fontWeight: '800', color: '#fff',
                        textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {item.media_title}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}

          {/* TAB: CONTINUE WATCHING */}
          {activeTab === 'continue' && (
            continueWatching.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <Tv size={40} style={{ marginBottom: '14px', opacity: 0.5, color: user.is_admin ? '#ffd700' : '#ff1a75' }} />
                <h3 style={{ margin: '0 0 6px', color: '#fff' }}>No Active Streams</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>This user has no continue watching records stored.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {continueWatching.map((item, idx) => {
                  const progressPct = item.duration > 0 ? Math.min(100, Math.round((item.progress / item.duration) * 100)) : 0;
                  
                  return (
                    <div key={idx} style={{
                      background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)',
                      borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                      transition: 'all 0.3s ease', position: 'relative'
                    }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = user.is_admin ? '#ffd700' : 'rgba(255, 26, 117, 0.4)'; }}
                       onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)'; }}>
                      
                      {/* Image Thumbnail wrapper */}
                      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                        <img src={getPosterUrl(item, 'card')} alt={item.media_title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/300x169/1a1a2e/ff1a75.png?text=No+Image'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                          position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.85)',
                          padding: '3px 8px', borderRadius: '5px', fontSize: '0.65rem', fontWeight: '900', color: user.is_admin ? '#ffd700' : 'var(--brand-color)'
                        }}>
                          {item.media_type === 'movie' ? 'Movie' : `S${item.season || 1} Ep${item.episode || 1}`}
                        </div>
                      </div>

                      {/* Progress Bar overlay */}
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', background: user.is_admin ? '#ffd700' : 'var(--brand-color)' }} />
                      </div>

                      {/* Detail metadata block */}
                      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <h4 style={{ margin: '0 0 6px', fontSize: '0.85rem', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.media_title}
                        </h4>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 'auto', alignItems: 'center' }}>
                          <span>{progressPct}% Completed</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* TAB: STREAM HISTORY */}
          {activeTab === 'history' && (
            history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <Clock size={40} style={{ marginBottom: '14px', opacity: 0.5, color: user.is_admin ? '#ffd700' : '#ff1a75' }} />
                <h3 style={{ margin: '0 0 6px', color: '#fff' }}>No Streams Logged</h3>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>This user has no stream history logged yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px', margin: '0 auto' }}>
                {history.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex', gap: '20px', padding: '12px 18px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center', transition: 'all 0.2s ease'
                  }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = user.is_admin ? '#ffd700' : 'rgba(255, 26, 117, 0.2)'; }}
                     onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; }}>
                    
                    <img src={getPosterUrl(item, 'list')} alt={item.media_title} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/45x64/1a1a2e/ff1a75.png?text=No+Img'; }} style={{ width: '45px', height: '64px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '800', color: '#fff' }}>{item.media_title}</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Film size={12} /> {item.media_type}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {new Date(item.watched_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <style>{`
        @keyframes profileFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
