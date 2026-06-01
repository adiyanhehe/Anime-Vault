import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, MessageSquare, Heart, Tv, ShieldAlert, Sparkles, 
  Trash2, ToggleLeft, ToggleRight, Save, Award, Settings, ExternalLink
} from 'lucide-react';
import { useUser } from '../api/UserContext';
import { 
  fetchAdminStats, fetchAllUsers, toggleUserAdminStatus, deleteUser,
  fetchAllComments, deleteCommentAdmin, fetchSiteSettings, updateSiteSetting 
} from '../api/db';

export default function AdminDashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'users' | 'comments'
  const [stats, setStats] = useState({ totalUsers: 0, totalComments: 0, totalLikes: 0, totalEpisodes: 0 });
  const [usersList, setUsersList] = useState([]);
  const [commentsList, setCommentsList] = useState([]);
  const [settings, setSettings] = useState({ announcement: '', maintenance: 'false' });
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Protect Admin Route: verify if user is authenticated and is_admin
  useEffect(() => {
    if (!user || !user.is_admin) {
      navigate('/');
    } else {
      loadDashboardData();
    }
  }, [user, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [s, u, c, setts] = await Promise.all([
        fetchAdminStats(),
        fetchAllUsers(),
        fetchAllComments(),
        fetchSiteSettings()
      ]);
      setStats(s);
      setUsersList(u);
      setCommentsList(c);
      setSettings(setts);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setStatusMessage('Saving settings...');
    try {
      await Promise.all([
        updateSiteSetting('announcement', settings.announcement),
        updateSiteSetting('maintenance', settings.maintenance)
      ]);
      setStatusMessage('Settings updated successfully!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err) {
      setStatusMessage('Failed to update settings');
    }
  };

  const handleToggleAdmin = async (userId) => {
    const success = await toggleUserAdminStatus(userId);
    if (success) {
      loadDashboardData();
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('WARNING: Are you absolutely sure you want to permanently delete this user? This will purge all their liked lists, comments, histories, and accounts!')) {
      const success = await deleteUser(userId);
      if (success) {
        loadDashboardData();
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Delete this comment permanently?')) {
      const success = await deleteCommentAdmin(commentId);
      if (success) {
        loadDashboardData();
      }
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 20px', color: 'var(--text-secondary)' }}>
        <div className="spinner" style={{
          width: '40px', height: '40px', border: '3px solid rgba(255,215,0,0.2)',
          borderTopColor: '#ffd700', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 20px'
        }} />
        <span style={{ fontSize: '0.95rem' }}>Loading Admin Console...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="admin-container" style={{
      maxWidth: '1200px', margin: '40px auto 80px', padding: '0 20px',
      color: '#fff', animation: 'adminFadeIn 0.4s ease-out'
    }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{
            fontSize: '2.5rem', fontWeight: '900', margin: 0,
            display: 'flex', alignItems: 'center', gap: '12px',
            color: '#fff', textShadow: '0 0 20px rgba(255, 215, 0, 0.2)'
          }}>
            <ShieldAlert size={36} style={{ color: '#ffd700', filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }} />
            Admin Command Deck
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Universal site controls, global settings, discussions audit, and user overrides.
          </p>
        </div>

        <span style={{
          fontSize: '0.8rem', fontWeight: '900', background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
          color: '#000', padding: '8px 18px', borderRadius: '12px', letterSpacing: '1px',
          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
        }}>
          SECURE SHELL ENABLED
        </span>
      </div>

      {/* Analytics Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div style={{ background: 'rgba(255, 215, 0, 0.03)', border: '1px solid rgba(255, 215, 0, 0.1)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffd700', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Vault Citizens</span>
            <Users size={20} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>{stats.totalUsers}</div>
        </div>

        <div style={{ background: 'rgba(255, 215, 0, 0.03)', border: '1px solid rgba(255, 215, 0, 0.1)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffd700', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Discussion Comments</span>
            <MessageSquare size={20} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>{stats.totalComments}</div>
        </div>

        <div style={{ background: 'rgba(255, 215, 0, 0.03)', border: '1px solid rgba(255, 215, 0, 0.1)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffd700', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Hearted Favorites</span>
            <Heart size={20} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>{stats.totalLikes}</div>
        </div>

        <div style={{ background: 'rgba(255, 215, 0, 0.03)', border: '1px solid rgba(255, 215, 0, 0.1)', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffd700', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Episodes Streamed</span>
            <Tv size={20} />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '900' }}>{stats.totalEpisodes}</div>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ 
        display: 'flex', gap: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: '15px', marginBottom: '30px'
      }}>
        <button onClick={() => setActiveTab('settings')} style={{
          background: 'none', border: 'none', color: activeTab === 'settings' ? '#ffd700' : 'var(--text-secondary)',
          fontSize: '1rem', fontWeight: '800', cursor: 'pointer', paddingBottom: '10px',
          position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Settings size={16} /> Whole Site Settings
          {activeTab === 'settings' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '2px', background: '#ffd700' }} />}
        </button>

        <button onClick={() => setActiveTab('users')} style={{
          background: 'none', border: 'none', color: activeTab === 'users' ? '#ffd700' : 'var(--text-secondary)',
          fontSize: '1rem', fontWeight: '800', cursor: 'pointer', paddingBottom: '10px',
          position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Users size={16} /> User Directory ({usersList.length})
          {activeTab === 'users' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '2px', background: '#ffd700' }} />}
        </button>

        <button onClick={() => setActiveTab('comments')} style={{
          background: 'none', border: 'none', color: activeTab === 'comments' ? '#ffd700' : 'var(--text-secondary)',
          fontSize: '1rem', fontWeight: '800', cursor: 'pointer', paddingBottom: '10px',
          position: 'relative', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <MessageSquare size={16} /> Comments Audit ({commentsList.length})
          {activeTab === 'comments' && <div style={{ position: 'absolute', bottom: '-16px', left: 0, width: '100%', height: '2px', background: '#ffd700' }} />}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* PANEL: WHOLE SITE SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '16px', padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#ffd700', marginBottom: '8px', textTransform: 'uppercase' }}>Global Site Announcement Banner Alert</label>
              <textarea 
                value={settings.announcement} 
                onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                rows={3}
                style={{
                  width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                  color: '#fff', outline: 'none', fontSize: '0.9rem', resize: 'vertical'
                }}
                placeholder="Enter alert text to show at the top of the homepage..."
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#ffd700' }}>Emergency Maintenance Offline Mode</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>If turned ON, the site will show an active maintenance cover screen to all non-admins.</p>
                </div>
                <button 
                  onClick={() => setSettings({ ...settings, maintenance: settings.maintenance === 'true' ? 'false' : 'true' })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: settings.maintenance === 'true' ? '#ef4444' : '#ffd700' }}
                >
                  {settings.maintenance === 'true' ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' }}>
              <button 
                onClick={handleSaveSettings}
                style={{
                  background: '#ffd700', color: '#000', border: 'none',
                  fontWeight: '900', fontSize: '0.85rem', padding: '12px 28px',
                  borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                  gap: '8px', boxShadow: '0 4px 15px rgba(255,215,0,0.3)'
                }}
              >
                <Save size={16} /> Save Settings
              </button>
              {statusMessage && <span style={{ fontSize: '0.85rem', color: '#ffd700', fontWeight: 'bold' }}>{statusMessage}</span>}
            </div>
          </div>
        )}

        {/* PANEL: USER DIRECTORY */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {usersList.map((usr, idx) => (
              <div key={idx} style={{
                display: 'flex', gap: '20px', padding: '16px 24px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                alignItems: 'center', transition: 'all 0.2s ease'
              }}>
                <img 
                  src={usr.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'} 
                  alt={usr.username} 
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,215,0,0.2)' }} 
                />
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {usr.username}
                    {usr.is_admin && (
                      <span style={{
                        fontSize: '0.65rem', fontWeight: '900', background: 'linear-gradient(135deg, #ffd700, #ffaa00)',
                        color: '#000', padding: '3px 8px', borderRadius: '10px'
                      }}>
                        ADMIN
                      </span>
                    )}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    Registered: {new Date(usr.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Link 
                    to={`/user/${usr.username}`} 
                    target="_blank"
                    style={{
                      background: 'rgba(255,255,255,0.05)', color: '#fff', border: 'none',
                      borderRadius: '8px', padding: '8px 14px', fontSize: '0.75rem', fontWeight: '800',
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    View public page <ExternalLink size={10} />
                  </Link>

                  {/* Toggle Admin Privilege */}
                  <button 
                    onClick={() => handleToggleAdmin(usr.id)}
                    style={{
                      background: usr.is_admin ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)', 
                      color: usr.is_admin ? '#ffd700' : '#fff', border: usr.is_admin ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px', padding: '8px 14px', fontSize: '0.75rem', fontWeight: '800',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    <Award size={12} />
                    {usr.is_admin ? 'Strip Admin' : 'Make Admin'}
                  </button>

                  {/* Purge user account */}
                  <button 
                    onClick={() => handleDeleteUser(usr.id)}
                    style={{
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                      color: '#ef4444', borderRadius: '8px', padding: '8px 12px',
                      cursor: 'pointer'
                    }}
                    title="Delete User permanently"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PANEL: COMMENTS AUDIT */}
        {activeTab === 'comments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {commentsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                No site-wide comments discovered in the vault database.
              </div>
            ) : (
              commentsList.map((cmt, idx) => (
                <div key={idx} style={{
                  display: 'flex', gap: '20px', padding: '16px 24px', borderRadius: '14px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                  alignItems: 'center', transition: 'all 0.2s ease'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#ffd700' }}>{cmt.username}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(cmt.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#fff', fontStyle: 'italic' }}>
                      "{cmt.comment_text}"
                    </p>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      Posted on media ID: <strong style={{ color: 'var(--brand-color)' }}>{cmt.media_id}</strong>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteComment(cmt.id)}
                    style={{
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', borderRadius: '8px', padding: '10px 14px',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.75rem', fontWeight: '800'
                    }}
                  >
                    <Trash2 size={12} /> Purge Comment
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes adminFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
