// Usage: npm run scramble -- "lukesegault@example.com"
// Prints the scrambled pieces to paste into src/data/about.js (see src/lib/scramble.js).
const text = process.argv.slice(2).join(' ');
if (!text) {
  console.error('Usage: npm run scramble -- "text to scramble"');
  process.exit(1);
}
const encoded = Buffer.from([...text].reverse().join('')).toString('base64');
const size = Math.ceil(encoded.length / 3);
const parts = [];
for (let i = 0; i < encoded.length; i += size) parts.push(encoded.slice(i, i + size));
console.log(JSON.stringify(parts));
