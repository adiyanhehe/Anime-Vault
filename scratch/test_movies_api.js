async function test() {
  console.log("=== Fetching Latest Movies ===");
  try {
    const res = await fetch("https://vidsrc-embed.ru/movies/latest/page-1.json");
    const data = await res.json();
    console.log("Latest Movies Keys:", Object.keys(data));
    if (Array.isArray(data)) {
      console.log(`Returned array of ${data.length} movies.`);
      console.log("First movie sample:", JSON.stringify(data[0], null, 2));
    } else if (data.result || data.data) {
      const items = data.result || data.data;
      console.log(`Returned object. Result count: ${items.length}`);
      console.log("First item sample:", JSON.stringify(items[0], null, 2));
    } else {
      console.log("Sample:", JSON.stringify(data, null, 2).slice(0, 1000));
    }
  } catch (err) {
    console.error("Failed to fetch latest movies:", err);
  }

  console.log("\n=== Fetching Latest TV Shows ===");
  try {
    const res = await fetch("https://vidsrc-embed.ru/tvshows/latest/page-1.json");
    const data = await res.json();
    if (Array.isArray(data)) {
      console.log(`Returned array of ${data.length} TV shows.`);
      console.log("First TV show sample:", JSON.stringify(data[0], null, 2));
    } else if (data.result || data.data) {
      const items = data.result || data.data;
      console.log("First TV show sample:", JSON.stringify(items[0], null, 2));
    } else {
      console.log("Sample:", JSON.stringify(data, null, 2).slice(0, 1000));
    }
  } catch (err) {
    console.error("Failed to fetch latest TV shows:", err);
  }
}

test();
