
const fs = require('fs');
const content = fs.readFileSync('src/lib/translations.ts', 'utf8');

// I'll use a regex to extract each block roughly. 
// A better way is to parse the JS, but let's try regex first.

function extractBlock(lang) {
  const regex = new RegExp(`"${lang}": \\{([\\s\\S]+?)\\s+\\},`, 'g');
  const match = regex.exec(content);
  if (!match) return null;
  const blockContent = match[1];
  const keys = [];
  const lines = blockContent.split('\n');
  lines.forEach(line => {
    const keyMatch = line.match(/"([^"]+)":/);
    if (keyMatch) keys.push(keyMatch[1]);
  });
  return keys;
}

const baselineKeys = extractBlock('en-US');
const otherLangs = ["id-ID", "zn", "en-AU", "en-GB", "en-SG", "pt-BR", "es-MX", "fi-FI", "tr-TR", "th-TH", "ms-MY"];

console.log(`Baseline (en-US) has ${baselineKeys.length} keys.`);

otherLangs.forEach(lang => {
  const keys = extractBlock(lang);
  if (!keys) {
    console.log(`${lang}: NOT FOUND`);
    return;
  }
  const missing = baselineKeys.filter(k => !keys.includes(k));
  console.log(`${lang}: ${keys.length} keys. Missing: ${missing.length}`);
  if (missing.length > 0) {
    console.log(`  Preview missing: ${missing.slice(0, 5).join(', ')}...`);
  }
});
