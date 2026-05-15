const fs = require('fs');
const path = require('path');
const root = path.resolve('src');
const classes = new Set();
function walk(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (p.endsWith('.jsx')) {
      const text = fs.readFileSync(p, 'utf8');
      const re = /className\s*=\s*{?\s*["'`]?([^"'`]*)["'`]?/g;
      let m;
      while ((m = re.exec(text))) {
        for (const part of m[1].trim().split(/\s+/)) {
          if (part) classes.add(part);
        }
      }
    }
  }
}
walk(root);
const css = fs.readFileSync(path.resolve('src/styles.css'), 'utf8');
const defn = new Set([...css.matchAll(/\.([-_a-zA-Z0-9]+)/g)].map(m => m[1]));
const missing = [...classes].filter(c => !defn.has(c)).sort();
console.log('undefined classes:', missing);
