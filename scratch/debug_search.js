async function debug() {
  const query = "Solo Leveling";
  console.log(`=== Debugging MangaDex Search for "${query}" ===`);
  const res = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=10&includes[]=cover_art`);
  const data = await res.json();
  
  if (data.data) {
    data.data.forEach((manga, i) => {
      console.log(`\nIndex: ${i}`);
      console.log(`ID: ${manga.id}`);
      console.log(`Titles: ${JSON.stringify(manga.attributes.title)}`);
      console.log(`Alt Titles: ${JSON.stringify(manga.attributes.altTitles.slice(0, 3))}`);
    });
  } else {
    console.log("No data returned!");
  }
}

debug();
