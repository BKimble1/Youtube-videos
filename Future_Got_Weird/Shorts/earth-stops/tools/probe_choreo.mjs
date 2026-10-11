// Dump per-frame positions of the choreography (hips, hands, mug, head, camera) as JSON, in world px and in final screen px (after camera + ZOOM).
// Usage: node tools/probe_choreo.mjs [out.json]   (bundles source/src/opening/choreo.ts with esbuild; no render needed)
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-probe-'));
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(entry, `
export * from '${src}/opening/choreo';
export {SC, footOffset} from '${src}/opening/rig';
export {handPos} from '${src}/components/Character';
`);
const outfile = path.join(tmp, 'bundle.mjs');
await build({entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile, loader: {'.json': 'json'}, jsx: 'automatic', nodePaths: [path.resolve(here, '../source/node_modules')], logLevel: 'error'});
const m = await import(pathToFileURL(outfile).href);
const rot = (x, y, a) => ({x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)});
const rad = (d) => (d * Math.PI) / 180;
const toScreen = (wx, wy, f) => ({x: 540 + (wx - m.camX(f) - 540) * m.ZOOM, y: m.GY + (wy - m.GY) * m.ZOOM});
const rows = [];
for (let f = 0; f < m.N; f++) {
  const th = m.theta(f);
  const hl = m.handPos(m.armL(f), -1);
  const pl = rot(hl.hx, hl.hy + 150, rad(th));
  const handL = {x: m.hipX(f) + pl.x * m.SC, y: m.hipY(f) + pl.y * m.SC};
  const handR = m.handWorld(f);
  const mouth = m.mouthWorld(f);
  const head = (() => { const p = rot(0, -222, rad(th)); return {x: m.hipX(f) + p.x * m.SC, y: m.hipY(f) + p.y * m.SC}; })();
  const mugC = (() => { const p = rot(m.MUG.cx, m.MUG.cy, rad(m.cupTilt(f))); return {x: handR.x + p.x * m.SC, y: handR.y + p.y * m.SC}; })();
  const fL = m.footOffset(th, m.legL(f), -1, m.SC), fR = m.footOffset(th, m.legR(f), 1, m.SC);
  const feet = [toScreen(m.hipX(f) + fL.x, m.hipY(f) + fL.y, f), toScreen(m.hipX(f) + fR.x, m.hipY(f) + fR.y, f)];
  const left = Math.min(feet[0].x, feet[1].x, toScreen(handL.x, handL.y, f).x) - 36 * m.ZOOM;
  const right = toScreen(mugC.x, mugC.y, f).x + 52 * m.ZOOM;
  rows.push({zoom: m.ZOOM, left: +left.toFixed(0), right: +right.toFixed(0),
    f, cam: +m.camX(f).toFixed(2), hipX: +m.hipX(f).toFixed(1), hipY: +m.hipY(f).toFixed(1), theta: +th.toFixed(1), v: +m.vHip(f).toFixed(2),
    screen: {hips: toScreen(m.hipX(f), m.hipY(f), f), handL: toScreen(handL.x, handL.y, f), mug: toScreen(mugC.x, mugC.y, f), mouth: toScreen(mouth.x, mouth.y, f), head: toScreen(head.x, head.y, f)},
  });
}
const out = process.argv[2];
if (out) fs.writeFileSync(out, JSON.stringify(rows, null, 1));
for (const r of rows.filter((r) => r.f % 8 === 0 || r.f === m.N - 1)) {
  const s = r.screen;
  const fmt = (p) => `${p.x.toFixed(0).padStart(5)},${p.y.toFixed(0).padStart(5)}`;
  console.log(`L${String(r.left).padStart(5)} R${String(r.right).padStart(5)}  f${String(r.f).padStart(2)} cam ${String(r.cam).padStart(7)} th ${String(r.theta).padStart(4)}  hips ${fmt(s.hips)}  handL ${fmt(s.handL)}  mug ${fmt(s.mug)}  head ${fmt(s.head)}`);
}
fs.rmSync(tmp, {recursive: true, force: true});
