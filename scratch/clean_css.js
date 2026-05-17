import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('src/styles.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Use a simple, robust regex to match the duplicate mobile overrides block in the middle of the file
const targetPattern = /\/\* -- Mobile Overrides -- \*\/\s*@media\s*\(max-width:\s*600px\)\s*\{\s*\.trending-grid-v2\s*\{[^}]*\}\s*\.results-grid-v2\s*\{[^}]*\}\s*\.detail-hero-content-v2\s*\{[^}]*\}\s*\.detail-actions-v2\s*\{[^}]*\}\s*\.detail-meta-v2\s*\{[^}]*\}\s*\.detail-layout-v2\s*\{[^}]*\}\s*\.reader-toolbar\s*\{[^}]*\}\s*\.toolbar-left,\s*\.toolbar-right\s*\{[^}]*\}\s*\.manga-page\s*\{[^}]*\}\s*\}/i;

if (targetPattern.test(content)) {
  const initialLength = content.length;
  // Replace only the first occurrence of the duplicate block
  content = content.replace(targetPattern, '');
  fs.writeFileSync(cssPath, content, 'utf8');
  console.log(`Successfully removed duplicate CSS block. Saved ${initialLength - content.length} bytes.`);
} else {
  console.error("Target pattern not found in src/styles.css!");
}
