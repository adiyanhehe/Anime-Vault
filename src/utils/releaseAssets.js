export const GITHUB_OWNER = 'adiyanhehe';
export const GITHUB_REPO = 'Anime-Vault';
export const RELEASES_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
export const RELEASES_PAGE_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

const FALLBACK_VERSION = '0.1.0';
const FALLBACK_TAG = `v${FALLBACK_VERSION}`;
const FALLBACK_BASE_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/download/${FALLBACK_TAG}`;

const FALLBACK_ASSETS = {
  windows: {
    url: `${FALLBACK_BASE_URL}/AnimeVault%20Setup%20${FALLBACK_VERSION}.exe`,
    fileName: `AnimeVault Setup ${FALLBACK_VERSION}.exe`,
  },
  mac: {
    url: `${FALLBACK_BASE_URL}/AnimeVault-${FALLBACK_VERSION}-arm64.dmg`,
    fileName: `AnimeVault-${FALLBACK_VERSION}-arm64.dmg`,
  },
  linux: {
    url: `${FALLBACK_BASE_URL}/AnimeVault-${FALLBACK_VERSION}.AppImage`,
    fileName: `AnimeVault-${FALLBACK_VERSION}.AppImage`,
  },
  android: {
    url: `${FALLBACK_BASE_URL}/AnimeVault-${FALLBACK_VERSION}.apk`,
    fileName: `AnimeVault-${FALLBACK_VERSION}.apk`,
  },
};

export const DOWNLOAD_PLATFORMS = [
  {
    key: 'windows',
    title: 'Windows',
    badge: 'Windows 10 / 11',
    description: 'Fast native desktop experience with full support for anime streaming.',
    iconType: 'local-windows',
    ariaLabel: 'Download Anime Vault for Windows',
    matchers: [/\.exe$/i, /nsis/i, /setup/i],
  },
  {
    key: 'mac',
    title: 'macOS',
    badge: 'macOS 12+',
    description: 'Optimized for both Intel and Apple Silicon Macs.',
    iconType: 'mac',
    ariaLabel: 'Download Anime Vault for macOS',
    matchers: [/\.dmg$/i, /mac/i, /darwin/i],
  },
  {
    key: 'linux',
    title: 'Linux',
    badge: 'Ubuntu / Debian / AppImage',
    description: 'Lightweight package for Linux distributions.',
    iconType: 'linux',
    ariaLabel: 'Download Anime Vault for Linux',
    matchers: [/\.AppImage$/i, /\.deb$/i, /linux/i],
  },
  {
    key: 'android',
    title: 'Android',
    badge: 'Android 6+',
    description: 'Portable on-the-go experience with native performance.',
    iconType: 'local-android',
    ariaLabel: 'Download Anime Vault for Android',
    matchers: [/\.apk$/i, /android/i],
  },
];

function findBestAsset(assets, matchers) {
  return assets.find((asset) => matchers.some((matcher) => matcher.test(asset.name))) || null;
}

function normalizeAsset(asset, fallbackAsset) {
  if (!asset) return fallbackAsset;

  return {
    url: asset.browser_download_url,
    fileName: asset.name,
    size: asset.size,
    downloadCount: asset.download_count,
    updatedAt: asset.updated_at,
  };
}

export function detectPlatform(userAgent) {
  const agent = (userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  if (agent.includes('android')) return 'android';
  if (agent.includes('win')) return 'windows';
  if (agent.includes('mac')) return 'mac';
  if (agent.includes('linux')) return 'linux';
  return 'windows';
}

export async function fetchLatestReleaseDownloads() {
  const response = await fetch(RELEASES_API_URL, {
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    throw new Error(`GitHub Releases returned ${response.status}`);
  }

  const release = await response.json();
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const downloads = Object.fromEntries(
    DOWNLOAD_PLATFORMS.map((platform) => [
      platform.key,
      normalizeAsset(findBestAsset(assets, platform.matchers), FALLBACK_ASSETS[platform.key]),
    ]),
  );

  return {
    version: release.tag_name?.replace(/^v/i, '') || release.name || FALLBACK_VERSION,
    tagName: release.tag_name || FALLBACK_TAG,
    releaseName: release.name || release.tag_name || `AnimeVault ${FALLBACK_VERSION}`,
    releaseUrl: release.html_url || RELEASES_PAGE_URL,
    publishedAt: release.published_at,
    downloads,
    isFallback: false,
  };
}

export function getFallbackReleaseDownloads() {
  return {
    version: FALLBACK_VERSION,
    tagName: FALLBACK_TAG,
    releaseName: `AnimeVault ${FALLBACK_VERSION}`,
    releaseUrl: RELEASES_PAGE_URL,
    publishedAt: null,
    downloads: FALLBACK_ASSETS,
    isFallback: true,
  };
}

export function formatBytes(bytes) {
  if (!bytes) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
