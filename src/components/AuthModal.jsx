import { useState } from 'react';
import { X, User, Lock, LogIn, Sparkles, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { useUser } from '../api/UserContext';
import { userLogin, userSignup } from '../api/db';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, authTab, setAuthTab, login } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!showAuthModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!username.trim() || !password) {
        throw new Error('All fields are required.');
      }

      if (authTab === 'login') {
        const res = await userLogin(username, password);
        if (res.success) {
          setSuccess('Successfully logged in! Welcome back.');
          setTimeout(() => {
            login(res.user);
            resetForm();
          }, 1000);
        } else {
          setError(res.message);
        }
      } else {
        const res = await userSignup(username, password);
        if (res.success) {
          setSuccess('Account created successfully! Logging in...');
          setTimeout(() => {
            login(res.user);
            resetForm();
          }, 1000);
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(5, 5, 10, 0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px', transition: 'all 0.3s ease'
    }} onClick={() => setShowAuthModal(false)}>
      
      <div className="auth-card" style={{
        background: 'rgba(15, 15, 25, 0.7)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 26, 117, 0.2)',
        borderRadius: '16px',
        padding: '30px',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        boxShadow: '0 8px 32px 0 rgba(255, 26, 117, 0.15), inset 0 0 15px rgba(255, 255, 255, 0.05)',
        animation: 'authScaleIn 0.3s ease-out'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={() => setShowAuthModal(false)} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', padding: '4px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', border: '1px solid rgba(255,255,255,0.05)'
        }} onMouseEnter={e => e.currentTarget.style.color = '#fff'}
           onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontSize: '1.8rem', fontWeight: '800', 
            background: 'linear-gradient(135deg, #ff1a75, #ff6b9d)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'inline-flex', alignItems: 'center', gap: '8px'
          }}>
            <Sparkles size={24} style={{ color: '#ff1a75' }} /> AnimeVault
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Sync your progress, favorites, and comments in the cloud.
          </p>
        </div>

        {/* ── GOOGLE SOCIAL GATEWAY (REQUIRED FOR ADMINS) ── */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px', padding: '20px 16px', textAlign: 'center', marginTop: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
            <ShieldAlert size={18} style={{ color: '#ffd700', filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.4))' }} />
            <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Admin & Google Access</h4>
          </div>

          <button 
            type="button"
            onClick={() => {
              window.location.href = "https://ep-lively-surf-apnkb5f1.neonauth.c-7.us-east-1.aws.neon.tech/neondb/auth/login/social?provider=google&redirect_url=" + encodeURIComponent(window.location.origin);
            }}
            style={{
              width: '100%', padding: '12px', fontSize: '0.85rem', fontWeight: '900', color: '#fff',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', 
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              transition: 'all 0.2s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}
            onMouseEnter={e => { 
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; 
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))'; 
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; 
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <p style={{ margin: '8px 0 0', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
            ⚠️ Google Sign-In is <strong style={{ color: '#ffd700' }}>required</strong> for Administrator privileges.
          </p>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Or Local Credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* ── STANDARD CREDENTIALS GATEWAY (NORMAL USERS) ── */}
        <div>
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button 
              onClick={() => { setAuthTab('login'); setError(''); setSuccess(''); }} 
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                background: authTab === 'login' ? 'var(--brand-color)' : 'rgba(255,255,255,0.04)',
                color: authTab === 'login' ? '#000' : '#fff', fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthTab('signup'); setError(''); setSuccess(''); }} 
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                background: authTab === 'signup' ? 'var(--brand-color)' : 'rgba(255,255,255,0.04)',
                color: authTab === 'signup' ? '#000' : '#fff', fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444', borderRadius: '10px', padding: '10px 12px', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#10b981', borderRadius: '10px', padding: '10px 12px', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'
            }}>
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px', position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-tertiary)' }} />
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Username / Email"
                style={{
                  width: '100%', padding: '11px 12px 11px 38px', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                  color: '#fff', outline: 'none', fontSize: '0.85rem', transition: 'all 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--brand-color)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-tertiary)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Password"
                style={{
                  width: '100%', padding: '11px 12px 11px 38px', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                  color: '#fff', outline: 'none', fontSize: '0.85rem', transition: 'all 0.2s'
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--brand-color)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%', padding: '12px', background: 'var(--brand-color)', color: '#000',
                fontWeight: '900', border: 'none', borderRadius: '10px', cursor: 'pointer',
                fontSize: '0.85rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(255,26,117,0.2)'
              }}
            >
              {loading ? 'Processing...' : (authTab === 'login' ? 'Sign In' : 'Sign Up')}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes authScaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
