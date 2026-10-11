// Writes audio/cues.json: the timed events the Foley is built on, derived from the SAME choreography functions that draw the picture.
// Usage: node tools/build_cues_opening.mjs
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-cues-'));
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(entry, `export * from '${src}/opening/choreo';`);
const outfile = path.join(tmp, 'bundle.mjs');
await build({entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile, loader: {'.json': 'json'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error'});
const m = await import(pathToFileURL(outfile).href);
const fps = m.FPS;
const frames = Array.from({length: m.N}, (_, f) => ({
  f,
  t: +(f / fps).toFixed(4),
  v_hip: +m.vHip(f).toFixed(3), // px/frame, ground frame
  foot_slide: +(m.footX(f) - m.footX(f - 1)).toFixed(3), // px/frame the contact shoe slides along the (stopped) ground
  grounded: m.grounded(f),
  theta: +m.theta(f).toFixed(2),
}));
const landings = m.coffeeLandings().filter((l) => l.frame >= 0 && l.frame < m.N).map((l) => ({...l, frame: +l.frame.toFixed(2), t: +(l.frame / fps).toFixed(4), x: +l.x.toFixed(1), screen_x: +(540 + (l.x - m.camX(l.frame) - 540) * m.ZOOM).toFixed(1)}));
const cues = {
  fps,
  total_frames: m.N,
  duration_s: m.N / fps,
  events: Object.fromEntries(Object.entries(m.EVT).map(([k, v]) => [k, {frame: v, t: +(v / fps).toFixed(4)}])),
  coffee: {born_first_frame: m.coffeeBorn(0), born_last_frame: +m.coffeeBorn(29).toFixed(2), landings},
  frames,
};
fs.mkdirSync(path.join(root, 'audio'), {recursive: true});
fs.writeFileSync(path.join(root, 'audio/cues.json'), JSON.stringify(cues, null, 1));
console.log('events', JSON.stringify(cues.events));
console.log('coffee landings', landings.length, 'first', landings[0], 'last', landings[landings.length - 1]);
fs.rmSync(tmp, {recursive: true, force: true});
