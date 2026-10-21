// Dump the V2 shot list (id, start, end, transition) to qa/v2/shotlist.json. Run: cd source && node shotlist.mjs
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'); // episode root
const out = path.join(root, 'source/.shotlist.cjs');
await build({
  stdin: {contents: "import {allShotsV2} from './src/v2/MainV2'; module.exports = allShotsV2().map(s => ({id: s.id, a: +s.a.toFixed(2), b: +s.b.toFixed(2), tin: s.tin ?? 'cut'}));", resolveDir: path.join(root, 'source'), loader: 'tsx'},
  bundle: true, platform: 'node', format: 'cjs', outfile: out, jsx: 'automatic', loader: {'.json': 'json'}, logLevel: 'error',
  external: ['remotion', 'react', '@remotion/*'],
  nodePaths: [path.join(root, 'source/node_modules')],
});
const {createRequire} = await import('node:module');
const req = createRequire(path.join(root, 'source/package.json'));
const shots = req(out);
fs.rmSync(out);
fs.writeFileSync(path.join(root, 'qa/v2/shotlist.json'), JSON.stringify(shots, null, 0).replace(/},{/g, '},\n{'));
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
for (const s of shots) console.log(`${fmt(s.a)}–${fmt(s.b)}  ${s.tin.padEnd(7)} ${s.id}`);
