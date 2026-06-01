export type AnFireStreamSource = {
  url: string;
  quality: string;
  isM3U8: boolean;
};

export type AnFireStreamResult =
  | { ok: true; source: AnFireStreamSource; sources: AnFireStreamSource[] }
  | { ok: false; error: string; sources: [] };

type RawAnFireSource = {
  url?: unknown;
  src?: unknown;
  file?: unknown;
  link?: unknown;
  quality?: unknown;
  resolution?: unknown;
  label?: unknown;
  status?: unknown;
  isM3U8?: unknown;
};

type AnFireStreamOptions = {
  endpointUrl?: string;
  apiKey?: string;
  signal?: AbortSignal;
};

const env = import.meta.env as Record<string, string | undefined>;
const DEFAULT_ENDPOINT = '/api/episode';

function getStreamEndpoint() {
  return env.VITE_ANFIRE_EPISODE_API_URL || DEFAULT_ENDPOINT;
}

function getApiKey() {
  return env.VITE_ANFIRE_API_KEY || '';
}

function createEndpointUrl(endpointUrl: string) {
  const baseUrl = typeof window === 'undefined' ? 'http://localhost' : window.location.origin;
  return new URL(endpointUrl, baseUrl);
}

function isVideoLikeUrl(url: string) {
  return /\.(m3u8?|mp4|webm|ogg)(?:[?#]|$)/i.test(url) || /googlevideo\.com|videoplayback/i.test(url);
}

function numericQuality(quality: string) {
  const value = Number.parseInt(quality, 10);
  return Number.isFinite(value) ? value : 0;
}

function normalizeSource(source: RawAnFireSource): AnFireStreamSource | null {
  const url = String(source.url || source.src || source.file || source.link || '').replace(/\\\//g, '/').trim();
  const status = String(source.status || 'ONLINE').toUpperCase();

  if (!url || status === 'OFFLINE' || !isVideoLikeUrl(url)) return null;

  return {
    url,
    quality: String(source.quality || source.resolution || source.label || 'default'),
    isM3U8: Boolean(source.isM3U8) || /\.m3u8?|master\.txt/i.test(url),
  };
}

function extractRawSources(payload: unknown): RawAnFireSource[] {
  if (Array.isArray(payload)) return payload as RawAnFireSource[];
  if (!payload || typeof payload !== 'object') return [];

  const data = payload as {
    sources?: unknown;
    data?: unknown;
    episode?: unknown;
    streams?: unknown;
  };

  if (Array.isArray(data.sources)) return data.sources as RawAnFireSource[];
  if (Array.isArray(data.data)) return data.data as RawAnFireSource[];
  if (Array.isArray(data.streams)) return data.streams as RawAnFireSource[];
  if (data.episode) return extractRawSources(data.episode);

  return [];
}

export function selectBestAnFireSource(payload: unknown): AnFireStreamSource | null {
  const sources = extractRawSources(payload)
    .map(normalizeSource)
    .filter((source): source is AnFireStreamSource => Boolean(source))
    .sort((a, b) => numericQuality(b.quality) - numericQuality(a.quality));

  const hlsSource = sources.find(source => source.isM3U8);
  return hlsSource || sources[0] || null;
}

export function toVideoPlayerSource(source: AnFireStreamSource) {
  return {
    url: source.url,
    quality: source.quality,
    isM3U8: source.isM3U8,
  };
}

export async function fetchBestAnFireStreamUrl(
  episodeId: string,
  options: AnFireStreamOptions = {}
): Promise<AnFireStreamSource> {
  if (!episodeId) {
    throw new Error('episodeId is required');
  }

  const endpoint = createEndpointUrl(options.endpointUrl || getStreamEndpoint());
  const apiKey = options.apiKey ?? getApiKey();

  endpoint.searchParams.set('episode_id', episodeId);
  if (apiKey) endpoint.searchParams.set('api_key', apiKey);

  const response = await fetch(endpoint.toString(), { signal: options.signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error?: unknown }).error)
      : `AnFire stream request failed: ${response.status}`;
    throw new Error(message);
  }

  const source = selectBestAnFireSource(payload);
  if (!source) {
    throw new Error('Stream unavailable');
  }

  return source;
}

export async function resolveAnFireStream(
  episodeId: string,
  options: AnFireStreamOptions = {}
): Promise<AnFireStreamResult> {
  try {
    const source = await fetchBestAnFireStreamUrl(episodeId, options);
    return {
      ok: true,
      source,
      sources: [toVideoPlayerSource(source)],
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Stream unavailable',
      sources: [],
    };
  }
}
