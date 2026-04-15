
const fs = require('fs');
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');

const regex = /"([^"]+)":/g;
let match;
const keysByLanguage = {};
let currentLanguage = null;

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const langMatch = line.match(/"([a-z]{2}-[A-Z]{2}|zn)": \{/);
  if (langMatch) {
    currentLanguage = langMatch[1];
    keysByLanguage[currentLanguage] = [];
  }
  
  const keyMatch = line.match(/"([^"]+)":/);
  if (keyMatch && currentLanguage && keyMatch[1] !== currentLanguage) {
    const key = keyMatch[1];
    if (keysByLanguage[currentLanguage].includes(key)) {
      console.log(`Duplicate key "${key}" found in language "${currentLanguage}" at line ${i + 1}`);
    }
    keysByLanguage[currentLanguage].push(key);
  }
}
