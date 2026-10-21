// Dump a shot list (id, start, end, transition) to qa/<v>/shotlist.json. Run: cd source && node shotlist.mjs [v2|v3]
import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const V = ['v3', 'v4'].includes(process.argv[2]) ? process.argv[2] : 'v2';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'); // episode root
const out = path.join(root, 'source/.shotlist.cjs');
await build({
  stdin: {contents: ({v2: "import {allShotsV2 as all} from './src/v2/MainV2';", v3: "import {allShotsV3 as all} from './src/v3/MainV3';", v4: "import {allShotsV4 as all} from './src/v4/MainV4';"})[V] + " module.exports = all().map(s => ({id: s.id, a: +s.a.toFixed(2), b: +s.b.toFixed(2), tin: s.tin ?? 'cut'}));", resolveDir: path.join(root, 'source'), loader: 'tsx'},
  bundle: true, platform: 'node', format: 'cjs', outfile: out, jsx: 'automatic', loader: {'.json': 'json'}, logLevel: 'error',
  external: ['remotion', 'react', '@remotion/*'],
  nodePaths: [path.join(root, 'source/node_modules')],
});
const {createRequire} = await import('node:module');
const req = createRequire(path.join(root, 'source/package.json'));
const shots = req(out);
fs.rmSync(out);
fs.writeFileSync(path.join(root, `qa/${V}/shotlist.json`), JSON.stringify(shots, null, 0).replace(/},{/g, '},\n{'));
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
for (const s of shots) console.log(`${fmt(s.a)}–${fmt(s.b)}  ${s.tin.padEnd(7)} ${s.id}`);
let prev = null;
for (const s of shots) {
  if (prev && Math.abs(s.a - prev.b) > 0.011) console.log(`!! ${prev.id} → ${s.id}: ${(s.a - prev.b).toFixed(2)} s ${s.a > prev.b ? 'gap' : 'overlap'}`);
  if (s.b - s.a < 0.5) console.log(`!! short shot ${s.id}: ${(s.b - s.a).toFixed(2)} s`);
  prev = s;
}
