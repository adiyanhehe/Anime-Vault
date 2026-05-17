async function debug() {
  const slId = "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0"; // Solo Leveling Original ID
  
  console.log("=== Debugging Solo Leveling (Scanning English Chapters) ===");
  const res = await fetch(`https://api.mangadex.org/manga/${slId}/feed?translatedLanguage[]=en&limit=500&order[chapter]=asc`);
  const data = await res.json();
  
  if (data.data) {
    console.log(`Total English chapters returned: ${data.data.length}`);
    const readable = data.data.filter(c => c.attributes.pages > 0 && !c.attributes.externalUrl);
    console.log(`Total readable chapters: ${readable.length}`);
    
    if (readable.length > 0) {
      console.log("Found readable chapters!");
      readable.slice(0, 5).forEach((c, i) => {
        console.log(`Chapter ${c.attributes.chapter}: "${c.attributes.title}" (${c.attributes.pages} pages, ID: ${c.id})`);
      });
    } else {
      console.log("No readable chapters in English! All are external links.");
    }
  } else {
    console.log("No data returned!");
  }
}

debug();
