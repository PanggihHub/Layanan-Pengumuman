import fs from 'fs';
import path from 'path';

const filePath = 'd:/C/pkl/cloud/ScreenSense 4-8/src/lib/translations.ts';
const content = fs.readFileSync(filePath, 'utf-8');

// Use a regex to extract enUS entries
const enUSMatch = content.match(/const enUS = \{([\s\S]+?)\};/);
if (!enUSMatch) {
    console.log("Could not find enUS object");
    process.exit(1);
}

const enUSLines = enUSMatch[1].split('\n');
const enUSKeys = enUSLines
    .map(line => line.trim().match(/^"([^"]+)"/))
    .filter(match => match)
    .map(match => match[1]);

// Use a regex to extract id-ID entries
const idIDMatch = content.match(/"id-ID": \{([\s\S]+?)\},/);
if (!idIDMatch) {
    console.log("Could not find id-ID object");
    process.exit(1);
}

const idIDLines = idIDMatch[1].split('\n');
const idIDKeys = idIDLines
    .map(line => line.trim().match(/^"([^"]+)"/))
    .filter(match => match)
    .map(match => match[1]);

const missingInID = enUSKeys.filter(key => !idIDKeys.includes(key));
const extraInID = idIDKeys.filter(key => !enUSKeys.includes(key));

console.log(`enUS Keys: ${enUSKeys.length}`);
console.log(`id-ID Keys: ${idIDKeys.length}`);
console.log(`Missing in id-ID: ${missingInID.length}`);
if (missingInID.length > 0) {
    console.log("Missing keys:", missingInID.join(', '));
}
console.log(`Extra in id-ID: ${extraInID.length}`);
if (extraInID.length > 0) {
    console.log("Extra keys:", extraInID.join(', '));
}
