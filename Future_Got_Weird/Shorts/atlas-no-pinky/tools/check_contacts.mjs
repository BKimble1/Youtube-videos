// Per-frame contact check for the held grips (V4). Bundles the pure geometry with esbuild and prints pad-to-object gaps.
// Usage (from the project root):  node tools/check_contacts.mjs [maxGapPx=6]
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import fs from 'node:fs';
const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '../source/.cc'); // inside source/ so bare imports (react, remotion) resolve from node_modules
fs.mkdirSync(dir, {recursive: true});
const out = path.join(dir, 'cc.mjs');
await build({entryPoints: [path.join(here, '../source/src/v4/contactCheck.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.css': 'empty', '.woff2': 'empty', '.woff': 'empty'}, logLevel: 'error', external: ['react', 'react-dom', 'remotion', 'react/jsx-runtime']});
const max = Number(process.argv[2] ?? 8);
let text = '';
const log = console.log;
console.log = (...a) => { text += a.join(' ') + '\n'; };
await import(pathToFileURL(out).href);
console.log = log;
log(text.trim());
const m = /worst \|gap\| = ([\d.]+)/g;
let bad = false, r;
while ((r = m.exec(text))) if (Number(r[1]) > max) bad = true;
if (/DRILL FAIL/.test(text)) bad = true;
log(bad ? `FAIL: a held grip has a pad more than ${max}px from its object` : `OK: every held grip within ${max}px`);
fs.rmSync(dir, {recursive: true, force: true});
process.exit(bad ? 1 : 0);
