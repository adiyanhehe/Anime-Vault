import { useEffect, useMemo, useState } from 'react';
import { DownloadCloud, RefreshCw, Rocket, ShieldCheck, X } from 'lucide-react';
import { checkForUpdates, getUpdateStatus, installUpdate, onUpdateStatus } from '../utils/electronBridge';

const HIDDEN_STATES = new Set(['idle', 'disabled', 'web', 'current']);

function getStatusLabel(status) {
  switch (status) {
    case 'checking': return 'Scanning releases';
    case 'available': return 'Update found';
    case 'downloading': return 'Downloading';
    case 'ready': return 'Ready to launch';
    case 'error': return 'Update warning';
    default: return 'Auto update';
  }
}

function getStatusIcon(status, isChecking) {
  if (status === 'ready') return <Rocket size={18} />;
  if (status === 'error') return <ShieldCheck size={18} />;
  if (status === 'downloading' || status === 'available') return <DownloadCloud size={18} />;
  return <RefreshCw size={18} className={isChecking ? 'update-spin' : ''} />;
}

export default function UpdateCenter() {
  const [status, setStatus] = useState({
    status: 'idle',
    message: 'Updater is waiting to check for releases.',
    progress: 0,
  });
  const [dismissed, setDismissed] = useState(false);
  const [manualCheck, setManualCheck] = useState(false);

  useEffect(() => {
    let mounted = true;

    getUpdateStatus().then((nextStatus) => {
      if (mounted && nextStatus) setStatus(nextStatus);
    });

    const unsubscribe = onUpdateStatus((nextStatus) => {
      setDismissed(false);
      setManualCheck(false);
      setStatus(nextStatus);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const isBusy = status.status === 'checking' || status.status === 'available' || status.status === 'downloading';
  const progress = Math.max(0, Math.min(100, Number(status.progress) || 0));
  const shouldShow = useMemo(() => {
    if (dismissed) return false;
    if (manualCheck) return true;
    return !HIDDEN_STATES.has(status.status);
  }, [dismissed, manualCheck, status.status]);

  async function handleCheck() {
    setDismissed(false);
    setManualCheck(true);
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

  return (
    <aside className={`update-center update-${status.status}`} aria-live="polite">
      <div className="update-center-glow" />
      <div className="update-center-head">
        <span className="update-center-icon">{getStatusIcon(status.status, isBusy)}</span>
        <div>
          <p>{getStatusLabel(status.status)}</p>
          <strong>{status.version ? `AnimeVault ${status.version}` : 'AnimeVault Desktop'}</strong>
        </div>
        <button className="update-close" type="button" onClick={() => setDismissed(true)} aria-label="Hide update panel">
          <X size={15} />
        </button>
      </div>
      <p className="update-message">{status.message}</p>
      <div className="update-progress" aria-label={`Update progress ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="update-actions">
        {status.status === 'ready' ? (
          <button type="button" onClick={handleInstall}>Restart & install</button>
        ) : (
          <button type="button" onClick={handleCheck} disabled={isBusy}>
            {isBusy ? 'Working...' : 'Check now'}
          </button>
        )}
        <small>One download per version, installed on restart.</small>
      </div>
    </aside>
  );
}
