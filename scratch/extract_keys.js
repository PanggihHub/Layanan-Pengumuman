const { translations } = require('./src/lib/translations.ts');
const enKeys = Object.keys(translations['en-US']);
console.log(JSON.stringify(enKeys, null, 2));
