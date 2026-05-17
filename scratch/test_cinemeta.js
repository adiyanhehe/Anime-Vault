async function test() {
  const imdbId = "tt12872884"; // An Anatolian Tale 2020 TV Show
  console.log(`=== Testing Cinemeta Series API for IMDb ID: ${imdbId} ===`);
  
  try {
    const res = await fetch(`https://v3-cinemeta.strem.io/meta/series/${imdbId}.json`);
    const data = await res.json();
    console.log("Cinemeta Keys:", Object.keys(data));
    if (data.meta) {
      console.log("Meta Details:", JSON.stringify(data.meta, null, 2).slice(0, 2000));
      if (data.meta.videos && data.meta.videos.length > 0) {
        console.log(`\nFound ${data.meta.videos.length} episodes.`);
        console.log("First episode sample:", JSON.stringify(data.meta.videos[0], null, 2));
      }
    } else {
      console.log("Full response:", JSON.stringify(data, null, 2).slice(0, 1000));
    }
  } catch (err) {
    console.error("Cinemeta test failed:", err);
  }
}

test();
