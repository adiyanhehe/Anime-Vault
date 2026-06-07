async function test() {
  const query = `
    query ($start: Int, $end: Int) {
      Page(page: 1, perPage: 50) {
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
          id
          episode
          airingAt
          timeUntilAiring
          media {
            id
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = Math.floor(today.getTime() / 1000);
  const end = start + 7 * 24 * 60 * 60;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ query, variables: { start, end } }),
  });

  const json = await response.json();
  const schedules = json.data?.Page?.airingSchedules || [];
  console.log('Total results:', schedules.length);
  
  // Print first 3 items
  schedules.slice(0, 3).forEach((item, i) => {
    const m = item.media;
    console.log(`\n--- Item ${i + 1} ---`);
    console.log('Title:', m.title.english || m.title.romaji);
    console.log('Episode:', item.episode);
    console.log('Airing At:', new Date(item.airingAt * 1000).toISOString());
    console.log('Time Until:', item.timeUntilAiring, 'seconds');
    console.log('Cover:', m.coverImage?.extraLarge || m.coverImage?.large);
    console.log('Banner:', m.bannerImage);
    console.log('Genres:', m.genres?.join(', '));
    console.log('Score:', m.averageScore);
    console.log('Studio:', m.studios?.nodes?.[0]?.name);
    console.log('Day:', new Date(item.airingAt * 1000).toLocaleDateString('en-US', { weekday: 'long' }));
  });
}

test().catch(console.error);
