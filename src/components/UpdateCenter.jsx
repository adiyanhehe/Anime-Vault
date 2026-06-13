import { useEffect, useState } from 'react';
import { DownloadCloud, RefreshCw, Rocket, ShieldCheck, X, ChevronDown } from 'lucide-react';
import { checkForUpdates, getUpdateStatus, installUpdate, onUpdateStatus } from '../utils/electronBridge';

const HIDDEN_STATES = new Set(['idle', 'disabled', 'web']);

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

function getStatusIcon(status, isBusy) {
  if (status === 'ready') return <Rocket size={18} />;
  if (status === 'error') return <ShieldCheck size={18} />;
  if (status === 'downloading' || status === 'available') return <DownloadCloud size={18} />;
  if (status === 'current') return <ShieldCheck size={18} />;
  return <RefreshCw size={18} className={isBusy ? 'update-spin' : ''} />;
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

  useEffect(() => {
    let mounted = true;

    getUpdateStatus().then((nextStatus) => {
      if (mounted && nextStatus) {
        setStatus(nextStatus);
      }
    });

    const unsubscribe = onUpdateStatus((nextStatus) => {
      setDismissed(false);
      setStatus(nextStatus);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const isBusy = status.status === 'checking' || status.status === 'downloading';
  const progress = Math.max(0, Math.min(100, Number(status.progress) || 0));
  const statusColor = getStatusColor(status.status);
  const shouldShow = !dismissed && !HIDDEN_STATES.has(status.status);

  async function handleCheck() {
    setDismissed(false);
    const nextStatus = await checkForUpdates();
    if (nextStatus) setStatus(nextStatus);
  }

  async function handleInstall() {
    await installUpdate();
  }

  if (!shouldShow) {
    return (
      <button className="update-pill" type="button" onClick={handleCheck} aria-label="Check for app updates">
        <RefreshCw size={15} />
        Updates
      </button>
    );
  }

  const isStartupCheck = status.status === 'checking';
  const isComplete = status.status === 'current' || status.status === 'error';

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
          <p style={{ margin: 0, fontSize: '0.75rem', color: statusColor, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {getStatusLabel(status.status)}
          </p>
          <strong style={{ fontSize: '0.95rem', color: '#fff', display: 'block', marginTop: '2px' }}>
            {status.version ? `AnimeVault ${status.version}` : 'AnimeVault Desktop'}
          </strong>
        </div>
        <button className="update-close" type="button" onClick={() => setDismissed(true)} aria-label="Hide update panel"
          style={{
            background: 'transparent', border: 'none', color: 'var(--text-secondary)',
            cursor: 'pointer', padding: '4px', borderRadius: '6px',
            display: 'flex', transition: 'all 0.2s ease',
          }}
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

        {status.status === 'downloading' && (
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