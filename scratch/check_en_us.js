
const fs = require('fs');
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');

// This script will extract the en-US object and check for duplicates within it.
const enUSBlockMatch = content.match(/"en-US": \{([\s\S]+?)\s+\},/);
if (!enUSBlockMatch) {
  console.log("en-US block not found");
  process.exit(1);
}

const block = enUSBlockMatch[1];
const lines = block.split('\n');
const keyCounts = {};

lines.forEach((line, index) => {
  const match = line.match(/"([^"]+)":/);
  if (match) {
    const key = match[1];
    if (keyCounts[key]) {
      console.log(`Duplicate key found: "${key}" at line ${index + 5} (offset from start of en-US block)`);
    }
    keyCounts[key] = (keyCounts[key] || 0) + 1;
  }
});
