function cleanTitle(raw) {
  return raw
    ? raw
        .replace(/\s*\([^)]*\)/g, '') // Remove content in parentheses like (TV), (Dub)
        .replace(/\s*(?:season|part|cour|s\d+|episode|ep|\d+(?:st|nd|rd|th)\s*season|tv|dub|sub|uncensored)\b.*$/gi, '') // Strip suffix and everything after
        // Strip trailing single digits 2-9 or roman numerals II-IX (with or without spaces/hyphens) at the end of the string, ensuring it is NOT part of a larger number (using negative lookbehind)
        .replace(/[\s\-:]*(?<!\d)(?:[2-9]|i{2,4}|iv|vi{1,3}|ix)$/gi, '')
        .replace(/[:\-,\s]+$/, '') // Clean up trailing colons, hyphens, and spaces
        .trim()
    : null;
}

const testCases = [
  "Solo Leveling Season 2",
  "Solo Leveling Season 2 - Arise from the Shadow",
  "Jujutsu Kaisen 2nd Season",
  "Attack on Titan Season 3 Part 2",
  "High School DxD Hero",
  "One Piece Episode 1000",
  "Chainsaw Man: Buddy Stories",
  "Attack on Titan - Episode 12",
  "Solo Leveling (TV)",
  "Solo Leveling (Dub)",
  "Cyberpunk: Edgerunners",
  "Kaguya-sama: Love is War - Ultra Romantic",
  "The Angel Next Door Spoils Me Rotten2",
  "The Angel Next Door Spoils Me Rotten 2",
  "Mob Psycho 100 III",
  "Mob Psycho 100",
  "86",
  "My Hero Academia 6"
];

console.log("=== RUNNING ANIME TITLE CLEANING TEST ===");
testCases.forEach(title => {
  console.log(`Original: "${title}"`);
  console.log(`Cleaned:  "${cleanTitle(title)}"`);
  console.log("-----------------------------------------");
});
