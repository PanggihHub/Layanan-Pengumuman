
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
    
    let newContent = content;
    
    // Replace ID-ID first because it's later in the file
    newContent = newContent.substring(0, idIdRange.start) + idIdClean + newContent.substring(idIdRange.end);
    
    // We must find EN-US again because its range might have shifted due to the replace
    // Actually, EN-US is BEFORE ID-ID, so its start index doesn't change when we replace ID-ID.
    // BUT! I'll just find it again to be safe.
    const enUsRangeNew = getBlockRange('en-US');
    newContent = newContent.substring(0, enUsRangeNew.start) + enUsClean + newContent.substring(enUsRangeNew.end);
    
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully cleaned translations.ts');
} else {
    console.error('Could not find translation blocks');
}
