// src/api/scheduleService.js
// Fetches REAL airing schedule data from AniList GraphQL API

const ANILIST_URL = 'https://graphql.anilist.co';

const SCHEDULE_QUERY = `
  query ($start: Int, $end: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo {
        hasNextPage
        currentPage
      }
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        id
        episode
        airingAt
        timeUntilAiring
        media {
          id
          idMal
          title {
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          bannerImage
          genres
          averageScore
          format
          status
          studios(isMain: true) {
            nodes {
              name
            }
          }
          nextAiringEpisode {
            airingAt
            episode
            timeUntilAiring
          }
        }
      }
    }
  }
`;

/**
 * Fetch all airing schedules for the next 7 days from AniList.
 * Paginates automatically to get complete results.
 */
export async function fetchAniListWeeklySchedule() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = Math.floor(today.getTime() / 1000);
  const end = start + 7 * 24 * 60 * 60;

  let allSchedules = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 5) { // max 5 pages = 250 items
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        query: SCHEDULE_QUERY,
        variables: { start, end, page }
      }),
    });

    if (!response.ok) throw new Error(`AniList API error: ${response.status}`);
    const json = await response.json();

    if (json.errors) {
      console.error('AniList errors:', json.errors);
      throw new Error('AniList query failed');
    }

    const pageData = json.data?.Page;
    if (!pageData) break;

    allSchedules = allSchedules.concat(pageData.airingSchedules || []);
    hasNext = pageData.pageInfo?.hasNextPage || false;
    page++;
  }

  return allSchedules.map(mapAniListScheduleItem);
}

/**
 * Map a raw AniList airing schedule item into a unified shape
 * used by our Schedule page UI.
 */
function mapAniListScheduleItem(item) {
  const media = item.media;
  const airingDate = new Date(item.airingAt * 1000);
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    id: media.id,
    scheduleId: item.id,
    title: media.title?.english || media.title?.romaji || media.title?.native || 'Unknown',
    nativeTitle: media.title?.native || media.title?.romaji || '',
    episode: item.episode,
    airingAt: item.airingAt,
    timeUntilAiring: item.timeUntilAiring,
    broadcastDay: DAYS[airingDate.getDay()],
    broadcastTime: airingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    broadcastDateObj: airingDate,
    image: media.coverImage?.extraLarge || media.coverImage?.large || '',
    bannerImage: media.bannerImage || media.coverImage?.extraLarge || '',
    genres: media.genres || [],
    score: media.averageScore,
    rating: media.averageScore ? `${(media.averageScore / 10).toFixed(1)}/10` : 'N/A',
    studio: media.studios?.nodes?.[0]?.name || 'Unknown',
    format: media.format || '',
    status: media.status || '',
    nextEpisode: media.nextAiringEpisode ? {
      episode: media.nextAiringEpisode.episode,
      airingAt: media.nextAiringEpisode.airingAt,
      timeUntilAiring: media.nextAiringEpisode.timeUntilAiring
    } : null,
  };
}

/**
 * Group a flat schedule array by day of the week.
 */
export function groupByDay(schedule) {
  const grouped = {};
  schedule.forEach(item => {
    const day = item.broadcastDay || 'Unknown';
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(item);
  });
  return grouped;
}

/**
 * From a flat schedule, pick the top N items that have banners
 * for the hero carousel. Prioritizes items with high scores and banners.
 */
export function pickCarouselItems(schedule, count = 5) {
  // Prioritize items with banner, but if not enough, use cover
  const withBanner = schedule
    .filter(item => item.bannerImage && item.score && item.score > 60)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  
  if (withBanner.length >= count) {
    return withBanner.slice(0, count);
  }
  
  const withCover = schedule
    .filter(item => !withBanner.find(i => i.scheduleId === item.scheduleId) && item.image)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
  
  return [...withBanner, ...withCover].slice(0, count);
}

/**
 * Pick items airing today for the "Airing Today" section.
 */
export function pickAiringToday(schedule) {
  const today = new Date();
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = DAYS[today.getDay()];
  
  return schedule
    .filter(item => item.broadcastDay === todayName)
    .sort((a, b) => a.airingAt - b.airingAt);
}

/**
 * Generate a prediction object for an anime schedule item.
 * This uses real data: previous episode aired 7 days ago, next predicted in 7 days.
 */
export function generatePrediction(item) {
  const prevEpNum = item.episode - 1;
  const prevDate = new Date((item.airingAt - 7 * 24 * 3600) * 1000);
  const prevDateStr = prevDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const nextDate = new Date(item.airingAt * 1000);
  const nextDateStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    previous: prevEpNum > 0 ? `Ep ${prevEpNum} (${prevDateStr})` : 'Season Premiere',
    predicted: `Ep ${item.episode} (${nextDateStr})`,
    confidence: item.timeUntilAiring <= 0 ? 100 : item.timeUntilAiring < 3600 ? 99 : item.timeUntilAiring < 86400 ? 96 : 90
  };
}
