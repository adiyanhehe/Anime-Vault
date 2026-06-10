
// Default settings
const DEFAULT_SETTINGS = {
  // Profile & Personalization
  username: '',
  email: '',
  bio: '',
  theme: 'dark',
  accentColor: '#ff1a75',
  fontSize: 'medium',
  profileVisibility: 'public',
  hideHistory: false,
  hideLikes: false,

  // Playback & Streaming
  defaultQuality: 'auto',
  autoplay: true,
  subtitleLanguage: 'en',
  subtitleFontSize: 'medium',
  subtitleOpacity: 0.9,
  audioLanguage: 'en',
  volumeNormalization: true,
  playbackSpeed: 1,
  autoResume: true,

  // Library & Collections
  favoriteGenres: [],
  defaultSortOrder: 'dateAdded',
  defaultCollectionPrivacy: 'private',
  autoAddContinueWatching: true,

  // Notifications
  pushNotifications: true,
  emailAlerts: true,
  emailMarketing: false,
  reminderTiming: '15min',

  // App Settings
  language: 'en',
  region: 'US',
  dataSaver: false,
  autoUpdates: true,
  hardwareAcceleration: true,

  // Discord RPC
  discordRpcEnabled: true,

  // Advanced
  analyticsEnabled: true,
  debugMode: false,
};

const SETTINGS_KEY = 'animevault_settings';
const isBrowser = typeof window !== 'undefined';

export function getSettings() {
  if (!isBrowser) return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Failed to load settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(newSettings) {
  if (!isBrowser) return false;
  try {
    const currentSettings = getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    return true;
  } catch (e) {
    console.error('Failed to save settings:', e);
    return false;
  }
}

export function resetSettings() {
  if (!isBrowser) return false;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return true;
  } catch (e) {
    console.error('Failed to reset settings:', e);
    return false;
  }
}

export function updateSetting(key, value) {
  return saveSettings({ [key]: value });
}
