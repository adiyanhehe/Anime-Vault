function cleanString(str) {
  return str ? str.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';
}

// Mimics the improved searchMangaDex logic
async function searchMangaDexImproved(titles) {
  const MANGADEX_API = 'https://api.mangadex.org';
  const titleList = Array.isArray(titles) ? titles : [titles];
  
  for (const t of titleList) {
    if (!t) continue;
    try {
      console.log(`Searching MangaDex for title query: "${t}"`);
      const res = await fetch(`${MANGADEX_API}/manga?title=${encodeURIComponent(t)}&limit=10&includes[]=cover_art`);
      const data = await res.json();
      
      if (data.data && data.data.length > 0) {
        const cleanedQuery = cleanString(t);
        
        // Look for an exact match first
        for (const manga of data.data) {
          // Check primary titles in any language
          const primaryTitles = Object.values(manga.attributes.title || {});
          const exactPrimary = primaryTitles.some(pt => cleanString(pt) === cleanedQuery);
          
          if (exactPrimary) {
            console.log(`-> Found EXACT primary title match: "${primaryTitles[0]}" (ID: ${manga.id})`);
            return manga;
          }
          
          // Check alt titles
          const altTitles = (manga.attributes.altTitles || []).flatMap(altObj => Object.values(altObj));
          const exactAlt = altTitles.some(at => cleanString(at) === cleanedQuery);
          
          if (exactAlt) {
            console.log(`-> Found EXACT alt title match: "${altTitles[0]}" (ID: ${manga.id})`);
            return manga;
          }
        }
        
        // If no exact match is found, look for a substring match
        for (const manga of data.data) {
          const primaryTitles = Object.values(manga.attributes.title || {});
          const subPrimary = primaryTitles.some(pt => cleanString(pt).includes(cleanedQuery));
          if (subPrimary) {
            console.log(`-> Found SUBSTRING primary title match: "${primaryTitles[0]}" (ID: ${manga.id})`);
            return manga;
          }
          
          const altTitles = (manga.attributes.altTitles || []).flatMap(altObj => Object.values(altObj));
          const subAlt = altTitles.some(at => cleanString(at).includes(cleanedQuery));
          if (subAlt) {
            console.log(`-> Found SUBSTRING alt title match: "${altTitles[0]}" (ID: ${manga.id})`);
            return manga;
          }
        }
        
        // Fallback to the very first result if no matches
        console.log(`-> Fallback to first result: "${Object.values(data.data[0].attributes.title)[0]}" (ID: ${data.data[0].id})`);
        return data.data[0];
      }
    } catch (err) {
      console.error('MangaDex search failed for title:', t, err);
    }
  }
  return null;
}

async function run() {
  console.log("=== Testing Improved MangaDex Search ===");
  const res = await searchMangaDexImproved(["Solo Leveling"]);
  if (res) {
    console.log("SUCCESS! Resolved original Solo Leveling ID:", res.id);
  } else {
    console.log("Failed to resolve.");
  }
}

run();
