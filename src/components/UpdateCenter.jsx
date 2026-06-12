import { useEffect, useMemo, useState } from 'react';
import { DownloadCloud, RefreshCw, Rocket, ShieldCheck, X, ChevronDown } from 'lucide-react';
import { checkForUpdates, getUpdateStatus, installUpdate, onUpdateStatus } from '../utils/electronBridge';

// Discord-style auto-update states
const HIDDEN_STATES = new Set(['idle', 'disabled']);
const SHOW_ALWAYS = new Set(['checking', 'downloading']);

function getStatusLabel(status) {
  switch (status) {
    case 'checking': return 'Checking for updates';
    case 'available': return 'Update available';
    case 'downloading': return 'Downloading update';
    case 'ready': return 'Update ready to install';
    case 'current': return 'Up to date';
    case 'error': return 'Update check failed';
    default: return 'Auto update';
  }
}

function getStatusDescription(status, version) {
  switch (status) {
    case 'checking': return 'Scanning GitHub Releases...';
    case 'available': return `AnimeVault ${version || 'new version'} is downloading`;
    case 'downloading': return 'Downloading in the background — ready in a moment';
    case 'ready': return `AnimeVault ${version || 'new version'} will install on restart`;
    case 'current': return `AnimeVault ${version || ''} is the latest version`;
    case 'error': return 'Could not reach the release server. Try again later.';
    default: return '';
  }
}

function getStatusIcon(status, isBusy) {
  if (status === 'ready') return <Rocket size={22} />;
  if (status === 'error') return <ShieldCheck size={22} />;
  if (status === 'downloading' || status === 'available') return <DownloadCloud size={22} />;
  if (status === 'current') return <ShieldCheck size={22} />;
  return <RefreshCw size={22} className={isBusy ? 'update-spin' : ''} />;
}

function getStatusColor(status) {
  switch (status) {
    case 'checking': return '#60a5fa';
    case 'available':
    case 'downloading': return '#fbbf24';
    case 'ready': return '#34d399';
    case 'current': return '#34d399';
    case 'error': return '#f87171';
    default: return '#94a3b8';
  }
}

export default function UpdateCenter() {
  const [status, setStatus] = useState({
    status: 'idle',
    message: 'Updater is waiting to check for releases.',
    progress: 0,
  });
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showStartupCheck, setShowStartupCheck] = useState(false);

  useEffect(() => {
    let mounted = true;

    getUpdateStatus().then((nextStatus) => {
      if (mounted && nextStatus) {
        setStatus(nextStatus);
        if (nextStatus.status === 'checking') {
          setShowStartupCheck(true);
        }
      }
    });

    const unsubscribe = onUpdateStatus((nextStatus) => {
      setDismissed(false);
      setStatus(nextStatus);
      if (nextStatus.status === 'checking') {
        setShowStartupCheck(true);
      }
      if (nextStatus.status === 'current' || nextStatus.status === 'error') {
        setTimeout(() => {
          if (mounted) setShowStartupCheck(false);
        }, 3000);
      }
    });

    checkForUpdates().then((nextStatus) => {
      if (mounted && nextStatus) {
        setStatus(nextStatus);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const isBusy = status.status === 'checking' || status.status === 'downloading' || status.status === 'available';
  const progress = Math.max(0, Math.min(100, Number(status.progress) || 0));
  const statusColor = getStatusColor(status.status);

  const shouldShow = useMemo(() => {
    if (dismissed && !showStartupCheck) return false;
    if (SHOW_ALWAYS.has(status.status)) return true;
    if (showStartupCheck) return true;
    return !HIDDEN_STATES.has(status.status);
  }, [dismissed, showStartupCheck, status.status]);

  async function handleCheck() {
    setDismissed(false);
    setShowStartupCheck(true);
    const nextStatus = await checkForUpdates();
    if (nextStatus) setStatus(nextStatus);
  }

  async function handleInstall() {
    await installUpdate();
  }

  function handleDismiss() {
    setDismissed(true);
    setShowStartupCheck(false);
  }

  if (!shouldShow) {
    return (
      <button className="update-pill" type="button" onClick={handleCheck} aria-label="Check for app updates"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', fontSize: '0.75rem', fontWeight: '600',
          borderRadius: '8px', border: '1px solid var(--glass-border)',
          background: 'var(--glass)', color: 'var(--text-secondary)',
          cursor: 'pointer', transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-color)'; e.currentTarget.style.color = '#fff'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <RefreshCw size={14} />
        Updates
      </button>
    );
  }

  // Discord-style startup checking modal
  if (showStartupCheck && (status.status === 'checking' || status.status === 'current' || status.status === 'error')) {
    return (
      <div className="update-startup-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      }}>
        <div className="update-startup-modal" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '40px 48px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))',
          border: `1px solid ${statusColor}33`,
          boxShadow: `0 0 40px ${statusColor}22, 0 10px 40px rgba(0,0,0,0.5)`,
          textAlign: 'center', maxWidth: '360px',
        }}>
          <div className="update-startup-icon" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '64px', height: '64px', borderRadius: '50%',
            background: `${statusColor}15`, color: statusColor, marginBottom: '16px',
          }}>
            {getStatusIcon(status.status, isBusy)}
          </div>
          <h3 style={{
            color: '#fff', margin: '0 0 8px', fontSize: '1.2rem',
            fontWeight: '700', letterSpacing: '-0.02em',
          }}>
            {getStatusLabel(status.status)}
          </h3>
          <p style={{
            color: statusColor, margin: 0, fontSize: '0.85rem',
            fontWeight: '500', opacity: 0.9, lineHeight: '1.5',
          }}>
            {getStatusDescription(status.status, status.version)}
          </p>
          {(status.status === 'checking' || status.status === 'downloading') && (
            <div className="update-startup-bar" style={{
              width: '100%', height: '3px', borderRadius: '2px',
              background: 'rgba(255,255,255,0.1)', marginTop: '20px', overflow: 'hidden'
            }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)`,
                width: status.status === 'checking' ? '60%' : `${progress}%`,
                animation: status.status === 'checking' ? 'updatePulse 1.5s ease-in-out infinite' : 'none'
              }} />
            </div>
          )}
          {status.status === 'ready' && (
            <button type="button" onClick={handleInstall}
              style={{
                marginTop: '20px', padding: '10px 28px', fontSize: '0.9rem', fontWeight: '700',
                borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #34d399, #10b981)',
                color: '#000', cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(52, 211, 153, 0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 211, 153, 0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(52, 211, 153, 0.3)'; }}
            >
              <Rocket size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Restart & Install
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <aside className={`update-center update-${status.status}`} aria-live="polite"
      style={{
        position: 'fixed', bottom: '80px', right: '24px', zIndex: 9999,
        minWidth: '320px', maxWidth: '380px',
        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(30,41,59,0.98))',
        borderRadius: '16px',
        border: `1px solid ${statusColor}33`,
        boxShadow: `0 0 40px ${statusColor}11, 0 10px 40px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(20px)', overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(circle at top right, ${statusColor}11, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div className="update-center-head" style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span className="update-center-icon" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${statusColor}15`, color: statusColor,
          flexShrink: 0,
        }}>
          {getStatusIcon(status.status, isBusy)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: '0.75rem', color: statusColor,
            fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px'
          }}>
            {getStatusLabel(status.status)}
          </p>
          <strong style={{ fontSize: '0.95rem', color: '#fff', display: 'block', marginTop: '2px' }}>
            {status.version ? `AnimeVault ${status.version}` : 'AnimeVault Desktop'}
          </strong>
        </div>
        <button className="update-close" type="button" onClick={handleDismiss}
          style={{
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', padding: '4px', borderRadius: '6px',
            display: 'flex', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          aria-label="Hide update panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="update-center-body" style={{ padding: '12px 20px 16px' }}>
        <p className="update-message" style={{
          margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--text-secondary)',
          lineHeight: '1.5',
        }}>
          {status.message}
        </p>

        {(status.status === 'downloading' || status.status === 'available') && (
          <div className="update-progress" style={{
            width: '100%', height: '4px', borderRadius: '2px',
            background: 'rgba(255,255,255,0.08)', marginBottom: '12px', overflow: 'hidden'
          }}>
            <span style={{
              display: 'block', height: '100%', borderRadius: '2px',
              background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)`,
              width: `${progress}%`, transition: 'width 0.3s ease',
            }} />
          </div>
        )}

        <div className="update-actions" style={{
          display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        }}>
          {status.status === 'ready' ? (
            <button type="button" onClick={handleInstall}
              style={{
                flex: 1, padding: '8px 16px', fontSize: '0.85rem', fontWeight: '700',
                borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #34d399, #10b981)',
                color: '#000', cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 15px rgba(52, 211, 153, 0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 211, 153, 0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(52, 211, 153, 0.3)'; }}
            >
              <Rocket size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Restart & Install
            </button>
          ) : (
            <>
              <button type="button" onClick={handleCheck} disabled={isBusy}
                style={{
                  flex: 1, padding: '8px 16px', fontSize: '0.85rem', fontWeight: '700',
                  borderRadius: '10px', border: `1px solid ${statusColor}44`,
                  background: `${statusColor}11`, color: statusColor,
                  cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!isBusy) { e.currentTarget.style.background = `${statusColor}22`; e.currentTarget.style.borderColor = statusColor; } }}
                onMouseLeave={e => { if (!isBusy) { e.currentTarget.style.background = `${statusColor}11`; e.currentTarget.style.borderColor = `${statusColor}44`; } }}
              >
                {isBusy ? (
                  <><RefreshCw size={14} className="update-spin" style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Checking...</>
                ) : (
                  'Check again'
                )}
              </button>
              <button type="button" onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', padding: '8px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center',
                  transition: 'all 0.2s ease',
                  transform: expanded ? 'rotate(180deg)' : 'none',
                }}
              >
                <ChevronDown size={16} />
              </button>
            </>
          )}
        </div>

        {expanded && (
          <div style={{
            marginTop: '12px', padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
            fontSize: '0.75rem', color: 'var(--text-muted)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <p style={{ margin: 0 }}>
              Updates are downloaded once per version and installed automatically on restart.
              Auto-updater checks GitHub Releases for new builds.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}