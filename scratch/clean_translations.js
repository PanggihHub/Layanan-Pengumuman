
const fs = require('fs');
const filePath = 'src/lib/translations.ts';
let content = fs.readFileSync(filePath, 'utf8');

// The error is at line 347: "loc.liveWeather": "Live Weather"
// Let's see if we can find all occurrences of loc.liveWeather in the first object.

const enUSMatch = content.match(/"en-US": \{([\s\S]+?)\s+\},/);
if (enUSMatch) {
  let block = enUSMatch[1];
  const keys = [];
  const lines = block.split('\n');
  const newLines = [];
  let duplicatesFound = 0;
  
  for (let line of lines) {
    const keyMatch = line.match(/"([^"]+)":/);
    if (keyMatch) {
      const key = keyMatch[1];
      if (keys.includes(key)) {
        console.log(`Removing duplicate key: ${key}`);
        duplicatesFound++;
        continue; // Skip this line
      }
      keys.push(key);
    }
    newLines.push(line);
  }
  
  if (duplicatesFound > 0) {
    const newBlock = newLines.join('\n');
    content = content.replace(enUSMatch[1], newBlock);
    fs.writeFileSync(filePath, content);
    console.log(`Removed ${duplicatesFound} duplicates.`);
  } else {
    console.log("No duplicates found in en-US block.");
  }
}
