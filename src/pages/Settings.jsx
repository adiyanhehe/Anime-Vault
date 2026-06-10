
import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  User,
  Lock,
  Shield,
  Tv,
  BookOpen,
  Bell,
  Cog,
  Code,
  ArrowLeft,
  Save,
  RefreshCw,
  Trash2,
  Gamepad2,
  Globe,
  Palette,
  Volume2,
  Subtitles,
  Eye,
  EyeOff,
  BellRing,
  Database,
  Smartphone,
  Zap,
  BarChart3,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { useUser } from '../api/UserContext';
import { Link, useNavigate } from 'react-router-dom';
import { getSettings, saveSettings, resetSettings, updateSetting, updateUserProfile } from '../api/db';

const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
  { id: 'system', label: 'System' },
];

const ACCENT_COLORS = [
  '#ff1a75',
  '#ff6b6b',
  '#feca57',
  '#48dbfb',
  '#1dd1a1',
  '#5f27cd',
  '#ff9ff3',
  '#54a0ff',
];

const FONT_SIZES = ['small', 'medium', 'large'];

const QUALITIES = ['auto', '480p', '720p', '1080p', '4K'];

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const REMINDER_TIMINGS = ['15min', '30min', '1hour', '2hours'];

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Thriller',
];

const SORT_ORDERS = ['dateAdded', 'name', 'rating'];

const LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh'];

const REGIONS = ['US', 'CA', 'UK', 'EU', 'AU', 'JP', 'KR'];

export default function Settings() {
  const { user, updateProfile } = useUser();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(getSettings());
  const [activeTab, setActiveTab] = useState('profile');
  const [saveStatus, setSaveStatus] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [bannerUrl, setBannerUrl] = useState(user?.banner || '');
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [emailInput, setEmailInput] = useState(user?.email || '');
  const [bioInput, setBioInput] = useState(user?.bio || '');

  // Helper function to convert hex to HSL
  function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
        case g: h = ((b - r) / d + 2); break;
        case b: h = ((r - g) / d + 4); break;
      }
      h = h / 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function applySettingsToDOM(settings) {
    if (settings.theme === 'light') {
      // Light theme
      document.documentElement.style.setProperty('--bg-primary', 'hsl(0, 0%, 98%)');
      document.documentElement.style.setProperty('--bg-secondary', 'hsl(0, 0%, 92%)');
      document.documentElement.style.setProperty('--bg-glass', 'rgba(0, 0, 0, 0.04)');
      document.documentElement.style.setProperty('--text-primary', 'hsl(0, 0%, 8%)');
      document.documentElement.style.setProperty('--text-secondary', 'hsl(0, 0%, 45%)');
      document.documentElement.style.setProperty('--text-muted', 'hsl(0, 0%, 60%)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.08)');
      document.documentElement.style.setProperty('--shadow-sm', '0 2px 6px rgba(0,0,0,0.08)');
      document.documentElement.style.setProperty('--shadow-md', '0 4px 12px rgba(0,0,0,0.1)');
      document.documentElement.style.setProperty('--shadow-lg', '0 8px 24px rgba(0,0,0,0.12)');
    } else {
      // Dark theme (default)
      document.documentElement.style.setProperty('--bg-primary', 'hsl(0, 0%, 12%)');
      document.documentElement.style.setProperty('--bg-secondary', 'hsl(0, 0%, 16%)');
      document.documentElement.style.setProperty('--bg-glass', 'rgba(255, 255, 255, 0.06)');
      document.documentElement.style.setProperty('--text-primary', 'hsl(0, 0%, 94%)');
      document.documentElement.style.setProperty('--text-secondary', 'hsl(0, 0%, 68%)');
      document.documentElement.style.setProperty('--text-muted', 'hsl(0, 0%, 45%)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.12)');
      document.documentElement.style.setProperty('--shadow-sm', '0 2px 6px rgba(0,0,0,0.3)');
      document.documentElement.style.setProperty('--shadow-md', '0 4px 12px rgba(0,0,0,0.4)');
      document.documentElement.style.setProperty('--shadow-lg', '0 8px 24px rgba(0,0,0,0.5)');
    }

    // Apply font size
    let fontSize = '16px'; // Default medium
    if (settings.fontSize === 'small') fontSize = '14px';
    if (settings.fontSize === 'large') fontSize = '18px';
    document.documentElement.style.fontSize = fontSize;

    // Apply accent color
    if (settings.accentColor) {
      const accentHex = settings.accentColor;
      const hsl = hexToHSL(accentHex);
      document.documentElement.style.setProperty('--brand-primary', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`);
      document.documentElement.style.setProperty('--brand-primary-light', `hsl(${hsl.h}, ${hsl.s}%, ${Math.min(hsl.l + 10, 95)}%)`);
      document.documentElement.style.setProperty('--brand-primary-dark', `hsl(${hsl.h}, ${hsl.s}%, ${Math.max(hsl.l - 10, 10)}%)`);
      document.documentElement.style.setProperty('--brand-color', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`); // Fallback
    }
  }

  useEffect(() => {
    setSettings(getSettings());
    applySettingsToDOM(getSettings());
  }, []);

  const handleSave = () => {
    const success = saveSettings(settings);
    applySettingsToDOM(settings);
    if (success) {
      setSaveStatus('Saved successfully!');
      setTimeout(() => setSaveStatus(''), 2000);
    } else {
      setSaveStatus('Failed to save settings!');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettings();
      const newSettings = getSettings();
      setSettings(newSettings);
      applySettingsToDOM(newSettings);
      setSaveStatus('Settings reset!');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  // Update settings with live preview
  const updateSettingLive = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettingsToDOM(newSettings);
  };

  const handleSaveProfile = async () => {
    const success = await updateProfile(avatarUrl, bannerUrl);
    if (success) {
      setSaveStatus('Profile updated successfully!');
      setTimeout(() => setSaveStatus(''), 2000);
    } else {
      setSaveStatus('Failed to update profile!');
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  const handleToggleGenre = (genre) => {
    const newGenres = settings.favoriteGenres.includes(genre)
      ? settings.favoriteGenres.filter(g => g !== genre)
      : [...settings.favoriteGenres, genre];
    setSettings({ ...settings, favoriteGenres: newGenres });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'personalization', label: 'Personalization', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'playback', label: 'Playback', icon: Tv },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'discord', label: 'Discord RPC', icon: Gamepad2 },
    { id: 'app', label: 'App Settings', icon: Cog },
    { id: 'advanced', label: 'Advanced', icon: Code },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="settings-container" style={{
      maxWidth: '1200px',
      margin: '40px auto 80px',
      padding: '0 20px',
      color: '#fff',
      display: 'flex',
      gap: '32px',
      flexWrap: 'wrap',
    }}>
      {/* Sidebar */}
      <div style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <Link to="/profile" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          marginBottom: '16px',
          fontWeight: '600',
        }}>
          <ArrowLeft size={18} />
          Back to Profile
        </Link>

        <div style={{
          fontSize: '1.75rem',
          fontWeight: '900',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <SettingsIcon size={28} style={{ color: '#ff1a75' }} />
          Settings
        </div>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: activeTab === tab.id ? 'var(--brand-color)' : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? '#000' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
                textAlign: 'left',
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, minWidth: '0' }}>
        {/* Save/Reset Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginBottom: '24px',
        }}>
          {saveStatus && (
            <span style={{
              alignSelf: 'center',
              color: saveStatus.includes('success') || saveStatus.includes('Saved') ? '#10b981' : '#ef4444',
              fontWeight: '600',
            }}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={16} />
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'var(--brand-color)',
              color: '#000',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(255,26,117,0.3)',
              transition: 'all 0.2s',
            }}
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>

        {/* Tab Content */}
        <div style={{
          background: 'rgba(15,15,25,0.6)',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid rgba(255,26,117,0.15)',
        }}>
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Profile Settings</h2>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Bio
                </label>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Banner URL
                </label>
                <input
                  type="text"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    outline: 'none',
                    fontSize: '0.95rem',
                  }}
                />
              </div>

              <button
                onClick={handleSaveProfile}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  background: 'var(--brand-color)',
                  color: '#000',
                  border: 'none',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(255,26,117,0.3)',
                  width: 'fit-content',
                }}
              >
                <Save size={16} />
                Update Profile
              </button>

              <div style={{ marginTop: '16px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>Profile Visibility</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <select
                      value={settings.profileVisibility}
                      onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        outline: 'none',
                      }}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Profile visibility</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.hideHistory}
                      onChange={(e) => setSettings({ ...settings, hideHistory: e.target.checked })}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hide watch history</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={settings.hideLikes}
                      onChange={(e) => setSettings({ ...settings, hideLikes: e.target.checked })}
                      style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hide likes & favorites</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personalization' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Personalization</h2>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Theme
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => updateSettingLive('theme', theme.id)}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        background: settings.theme === theme.id ? 'var(--brand-color)' : 'rgba(255,255,255,0.05)',
                        color: settings.theme === theme.id ? '#000' : 'var(--text-secondary)',
                        border: settings.theme === theme.id ? 'none' : '1px solid rgba(255,255,255,0.1)',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSettingLive('accentColor', color)}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: color,
                        border: settings.accentColor === color ? '3px solid #fff' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Font Size
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => updateSettingLive('fontSize', e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    width: '200px',
                  }}
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Security Settings</h2>

              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>Password</h3>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                >
                  Change Password
                </button>
              </div>

              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>Two-Factor Authentication (2FA)</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px',
                    height: '28px',
                    borderRadius: '14px',
                    background: settings.twoFAEnabled ? '#10b981' : 'rgba(255,255,255,0.1)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSettings({ ...settings, twoFAEnabled: !settings.twoFAEnabled })}
                  >
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: settings.twoFAEnabled ? '23px' : '3px',
                      transition: 'all 0.2s',
                    }} />
                  </div>
                  <span style={{ fontSize: '0.95rem' }}>{settings.twoFAEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Add an extra layer of security to your account
                </p>
              </div>

              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>Session Management</h3>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  View All Active Sessions
                </button>
              </div>

              <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px', color: '#ef4444' }}>Danger Zone</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Permanently delete your account and all associated data
                </p>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'rgba(239,68,68,0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.3)',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'playback' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Playback Settings</h2>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Default Video Quality
                </label>
                <select
                  value={settings.defaultQuality}
                  onChange={(e) => setSettings({ ...settings, defaultQuality: e.target.value })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    width: '200px',
                  }}
                >
                  {QUALITIES.map((quality) => (
                    <option key={quality} value={quality}>
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoplay}
                    onChange={(e) => setSettings({ ...settings, autoplay: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Autoplay next episode</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoResume}
                    onChange={(e) => setSettings({ ...settings, autoResume: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Auto-resume from last position</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Default Playback Speed
                </label>
                <select
                  value={settings.playbackSpeed}
                  onChange={(e) => setSettings({ ...settings, playbackSpeed: parseFloat(e.target.value) })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    width: '200px',
                  }}
                >
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <option key={speed} value={speed}>
                      {speed}x
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>Subtitles</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Default Language
                      </label>
                      <select
                        value={settings.subtitleLanguage}
                        onChange={(e) => setSettings({ ...settings, subtitleLanguage: e.target.value })}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          outline: 'none',
                          width: '200px',
                        }}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Font Size
                      </label>
                      <select
                        value={settings.subtitleFontSize}
                        onChange={(e) => setSettings({ ...settings, subtitleFontSize: e.target.value })}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          outline: 'none',
                          width: '200px',
                        }}
                      >
                        {FONT_SIZES.map((size) => (
                          <option key={size} value={size}>
                            {size.charAt(0).toUpperCase() + size.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Background Opacity: {Math.round(settings.subtitleOpacity * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={settings.subtitleOpacity}
                        onChange={(e) => setSettings({ ...settings, subtitleOpacity: parseFloat(e.target.value) })}
                        style={{ width: '100%', maxWidth: '400px' }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ flex: '1 1 300px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px' }}>Audio</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        Default Language
                      </label>
                      <select
                        value={settings.audioLanguage}
                        onChange={(e) => setSettings({ ...settings, audioLanguage: e.target.value })}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(0,0,0,0.4)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff',
                          outline: 'none',
                          width: '200px',
                        }}
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                      <input
                        type="checkbox"
                        checked={settings.volumeNormalization}
                        onChange={(e) => setSettings({ ...settings, volumeNormalization: e.target.checked })}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                      <span style={{ fontSize: '0.95rem' }}>Volume normalization</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Library & Collections</h2>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Favorite Genres
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleToggleGenre(genre)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        background: settings.favoriteGenres.includes(genre) ? 'var(--brand-color)' : 'rgba(255,255,255,0.05)',
                        color: settings.favoriteGenres.includes(genre) ? '#000' : 'var(--text-secondary)',
                        border: 'none',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Default Sort Order
                </label>
                <select
                  value={settings.defaultSortOrder}
                  onChange={(e) => setSettings({ ...settings, defaultSortOrder: e.target.value })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    width: '200px',
                  }}
                >
                  {SORT_ORDERS.map((order) => (
                    <option key={order} value={order}>
                      {order === 'dateAdded' ? 'Date Added' : order.charAt(0).toUpperCase() + order.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Default Collection Privacy
                </label>
                <select
                  value={settings.defaultCollectionPrivacy}
                  onChange={(e) => setSettings({ ...settings, defaultCollectionPrivacy: e.target.value })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    width: '200px',
                  }}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                <input
                  type="checkbox"
                  checked={settings.autoAddContinueWatching}
                  onChange={(e) => setSettings({ ...settings, autoAddContinueWatching: e.target.checked })}
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.95rem' }}>Auto-add to Continue Watching</span>
              </label>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Notifications</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Push notifications</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.emailAlerts}
                    onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Email alerts (new episodes, etc.)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.emailMarketing}
                    onChange={(e) => setSettings({ ...settings, emailMarketing: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Marketing emails</span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Reminder Timing
                </label>
                <select
                  value={settings.reminderTiming}
                  onChange={(e) => setSettings({ ...settings, reminderTiming: e.target.value })}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                    width: '200px',
                  }}
                >
                  {REMINDER_TIMINGS.map((timing) => (
                    <option key={timing} value={timing}>
                      {timing === '15min' ? '15 minutes before' :
                       timing === '30min' ? '30 minutes before' :
                       timing === '1hour' ? '1 hour before' :
                       '2 hours before'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'discord' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Discord RPC</h2>

              <div style={{
                padding: '20px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '4px' }}>Rich Presence</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Show what you're watching on Discord
                    </p>
                  </div>
                  <div style={{
                    width: '56px',
                    height: '32px',
                    borderRadius: '16px',
                    background: settings.discordRpcEnabled ? '#5865F2' : 'rgba(255,255,255,0.1)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSettings({ ...settings, discordRpcEnabled: !settings.discordRpcEnabled })}
                  >
                    <div style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: '3px',
                      left: settings.discordRpcEnabled ? '27px' : '3px',
                      transition: 'all 0.2s',
                    }} />
                  </div>
                </div>

                {settings.discordRpcEnabled && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>RPC Settings</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                        <input
                          type="checkbox"
                          checked
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '0.9rem' }}>Show episode number</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                        <input
                          type="checkbox"
                          checked
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                        <span style={{ fontSize: '0.9rem' }}>Show progress</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'app' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>App Settings</h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Language
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                      width: '100%',
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Region
                  </label>
                  <select
                    value={settings.region}
                    onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                      width: '100%',
                    }}
                  >
                    {REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.dataSaver}
                    onChange={(e) => setSettings({ ...settings, dataSaver: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Data saver mode</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoUpdates}
                    onChange={(e) => setSettings({ ...settings, autoUpdates: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Auto-updates (Electron only)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.hardwareAcceleration}
                    onChange={(e) => setSettings({ ...settings, hardwareAcceleration: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Hardware acceleration (Electron only)</span>
                </label>
              </div>

              <div style={{ marginTop: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '12px' }}>Cache</h3>
                <button
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Database size={16} />
                  Clear Cache
                </button>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '8px' }}>Advanced Settings</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.analyticsEnabled}
                    onChange={(e) => setSettings({ ...settings, analyticsEnabled: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Enable anonymous analytics</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    checked={settings.debugMode}
                    onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>Debug mode</span>
                </label>
              </div>

              <div style={{
                padding: '20px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '8px' }}>API Keys (Coming Soon)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Manage your API keys for developers
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
