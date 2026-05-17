async function debug() {
  const slId = "32d76d19-8a05-4db0-9fc2-e0b0648fe9d0"; // Solo Leveling Original ID
  
  console.log("=== Debugging Solo Leveling English Feed ===");
  const res = await fetch(`https://api.mangadex.org/manga/${slId}/feed?translatedLanguage[]=en&limit=100`);
  const data = await res.json();
  
  if (data.data) {
    console.log(`Returned ${data.data.length} English chapters.`);
    data.data.slice(0, 5).forEach((chapter, i) => {
      console.log(`\nChapter index: ${i}`);
      console.log(`Chapter: ${chapter.attributes.chapter}`);
      console.log(`Title: ${chapter.attributes.title}`);
      console.log(`Pages: ${chapter.attributes.pages}`);
      console.log(`External URL: ${chapter.attributes.externalUrl}`);
    });
  } else {
    console.log("No data returned!");
  }
}

debug();
