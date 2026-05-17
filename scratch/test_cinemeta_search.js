async function test() {
  const query = "Interstellar";
  console.log(`=== Testing Cinemeta Search for: "${query}" ===`);
  
  try {
    const res = await fetch(`https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURIComponent(query)}.json`);
    const data = await res.json();
    console.log("Response Keys:", Object.keys(data));
    if (data.metas && data.metas.length > 0) {
      console.log(`Found ${data.metas.length} search results.`);
      console.log("First search result sample:", JSON.stringify(data.metas[0], null, 2));
    } else {
      console.log("Full response:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Search test failed:", err);
  }
}

test();
