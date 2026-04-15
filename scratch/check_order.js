
const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'lib', 'translations.ts');
const content = fs.readFileSync(filePath, 'utf8');

function getBlockRange(blockName) {
    const startPattern = `"${blockName}": {`;
    const startIdx = content.indexOf(startPattern);
    if (startIdx === -1) return null;
    
    let braceCount = 1;
    let endIdx = -1;
    for (let i = startIdx + startPattern.length; i < content.length; i++) {
        if (content[i] === '{') braceCount++;
        if (content[i] === '}') braceCount--;
        if (braceCount === 0) {
            endIdx = i;
            break;
        }
    }
    return { start: startIdx, end: endIdx + 1 };
}

function cleanBlock(blockText) {
    const lines = blockText.split('\n');
    const seen = new Set();
    const result = [];
    lines.forEach(line => {
        const match = line.match(/^\s*"([^"]+)":/);
        if (match) {
            const key = match[1];
            if (seen.has(key)) return;
            seen.add(key);
        }
        result.push(line);
    });
    return result.join('\n');
}

const enUsRange = getBlockRange('en-US');
const idIdRange = getBlockRange('id-ID');

if (enUsRange && idIdRange) {
    const enUsClean = cleanBlock(content.substring(enUsRange.start, enUsRange.end));
    const idIdClean = cleanBlock(content.substring(idIdRange.start, idIdRange.end));
    
    // We must replace from end to start to maintain indices
    let newContent = content;
    newContent = newContent.substring(0, idIdRange.start) + idIdClean + newContent.substring(idIdRange.end);
    // Recalculate enUsRange because idId was before it? No, wait.
    // In translations.ts, en-US is usually first.
    // Let's check which is first.
}

console.log('EN-US Start:', enUsRange.start);
console.log('ID-ID Start:', idIdRange.start);
