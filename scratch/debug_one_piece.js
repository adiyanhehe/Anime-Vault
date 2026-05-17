async function debug() {
  const opId = "a1c7c817-4e59-43b7-9365-09675a149a6f"; // One Piece ID
  
  console.log("=== Debugging One Piece English Feed ===");
  const res = await fetch(`https://api.mangadex.org/manga/${opId}/feed?translatedLanguage[]=en&limit=100`);
  const data = await res.json();
  
  if (data.data) {
    console.log(`Returned ${data.data.length} English chapters.`);
    data.data.slice(0, 15).forEach((chapter, i) => {
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
