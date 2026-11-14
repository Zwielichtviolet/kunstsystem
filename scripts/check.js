const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const jsFiles = ['data.js', 'storage.js', 'share.js', 'comments-config.js', 'script.js'];
for (const file of jsFiles) {
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML id found');

for (const match of html.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))["']/g)) {
  const asset = match[1];
  if (/^(https?:)?\/\//.test(asset)) continue;
  if (!fs.existsSync(path.join(root, asset))) throw new Error(`Missing asset: ${asset}`);
}

const data = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
for (const match of data.matchAll(/"src":"([^"]+)"/g)) {
  const image = path.join(root, 'img', match[1]);
  if (!fs.existsSync(image)) throw new Error(`Missing artwork image: img/${match[1]}`);
}
console.log('Kunstsystem checks passed.');
