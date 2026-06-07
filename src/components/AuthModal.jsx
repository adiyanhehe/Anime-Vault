
import { useState } from 'react';
import { X, User, Lock, LogIn, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
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
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={() => setShowAuthModal(false)} style={{
          position: 'absolute', top: '15px', right: '15px',
          background: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', padding: '4px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease', border: '1px solid rgba(255, 255, 255, 0.05)'
        }} onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
           onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}>
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

        {/* Form */}
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
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Username / Email"
                style={{
                  width: '100%', padding: '11px 12px 11px 38px', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                  color: '#fff', outline: 'none', fontSize: '0.85rem', transition: 'all 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--brand-color)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-tertiary)' }} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password"
                style={{
                  width: '100%', padding: '11px 12px 11px 38px', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px',
                  color: '#fff', outline: 'none', fontSize: '0.85rem', transition: 'all 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--brand-color)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
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
