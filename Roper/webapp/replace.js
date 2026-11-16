// replace-wasm.js
const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.resolve(__dirname, 'index.js');
const wasmPath = path.resolve(__dirname, 'index.data');

const source = fs.readFileSync(indexPath, 'utf8');
const wasmBase64 = fs.readFileSync(wasmPath).toString('base64');
const dataUrl = `data:application/octet-stream;base64,${wasmBase64}`;

const pattern = 'index.datt';
const index = source.indexOf(pattern);

if (index === -1) {
  throw new Error(`Pattern "${pattern}" was not found in ${indexPath}`);
}

const updatedSource = source.slice(0, index) + dataUrl + source.slice(index + pattern.length);

fs.writeFileSync(indexPath, updatedSource);
console.log(`Replaced the first occurrence of "${pattern}" in ${indexPath}`);
