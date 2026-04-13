
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/translations.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
let currentLang = null;
const langs = {};
let inBlock = false;

for (let line of lines) {
    const langMatch = line.match(/^\s*"([^"]+)":\s*\{/);
    if (langMatch) {
        currentLang = langMatch[1];
        langs[currentLang] = [];
        inBlock = true;
        continue;
    }
    
    if (inBlock && line.trim() === '},') {
        currentLang = null;
        inBlock = false;
        continue;
    }
    
    if (currentLang) {
        langs[currentLang].push(line);
    }
}

const enUSLines = langs['en-US'];
const enUSKeys = {};
for (let line of enUSLines) {
    const keyMatch = line.match(/"([^"]+)":\s*"([^"]*)"/);
    if (keyMatch) {
        enUSKeys[keyMatch[1]] = keyMatch[2];
    }
}

for (let lang in langs) {
    if (lang === 'en-US') continue;
    
    const langKeys = new Set();
    for (let line of langs[lang]) {
        const keyMatch = line.match(/"([^"]+)":\s*"([^"]*)"/);
        if (keyMatch) {
            langKeys.add(keyMatch[1]);
        }
    }
    
    for (let key in enUSKeys) {
        if (!langKeys.has(key)) {
            // Find the last line that has a key/value
            let lastIdx = -1;
            for (let i = langs[lang].length - 1; i >= 0; i--) {
                if (langs[lang][i].includes(': "')) {
                    lastIdx = i;
                    break;
                }
            }
            
            if (lastIdx !== -1) {
                // Add comma to previous line if needed
                if (!langs[lang][lastIdx].trim().endsWith(',')) {
                    langs[lang][lastIdx] += ',';
                }
                langs[lang].splice(lastIdx + 1, 0, `    "${key}": "${enUSKeys[key]}",`);
            } else {
                langs[lang].push(`    "${key}": "${enUSKeys[key]}",`);
            }
            langKeys.add(key);
        }
    }
}

// Reconstruct
let newContent = '';
let inLangBlock = false;
let currentLangName = null;
let langIndex = 0;

for (let line of lines) {
    const langMatch = line.match(/^\s*"([^"]+)":\s*\{/);
    if (langMatch) {
        newContent += line + '\n';
        currentLangName = langMatch[1];
        inLangBlock = true;
        // Output all lines for this lang
        for (let l of langs[currentLangName]) {
            newContent += l + '\n';
        }
        continue;
    }
    
    if (inLangBlock && line.trim() === '},') {
        newContent += line + '\n';
        inLangBlock = false;
        continue;
    }
    
    if (!inLangBlock) {
        newContent += line + '\n';
    }
}

fs.writeFileSync(filePath, newContent.trim() + '\n');
console.log("Translations synced.");
