// Per-frame screen positions for the H1 hook (hero hips/head/mug/extents, bicycle, lamps), from the same choreography the render uses.
// Usage: node tools/probe_h1.mjs [out.json]
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-ph1-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `export * as A from '${src}/v2/choreo2'; export * as H from '${src}/v2/choreoH';`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, jsx: 'automatic', nodePaths: [path.resolve(here, '../source/node_modules')], logLevel: 'error'});
const {A, H} = await import(pathToFileURL(out).href);
const rows = [];
for (let f = 0; f < H.N_H; f++) {
  const st = H.sceneFor(f), s = st.s, p = H.panelP(f);
  const S = 0.82 + (1 - 0.82) * p, top = 820 * (1 - p), feet = 1500 + (A.GSY - 1500) * p;
  const TX = 540 - 540 * S, TY = feet - top - A.GSY * S;
  const T = (pt) => { const q = H.toScreenFor(pt.x, pt.y, st); return {x: TX + q.x * S, y: top + TY + q.y * S}; };
  const hs = H.heroFor(st), fk = hs.fk, z = H.zoomFor(st) * S;
  const pts = [fk.P, fk.Hc, fk.Wn, fk.Wf, fk.An, fk.Af, fk.shoeN, fk.shoeF, fk.En, fk.Ef].map(T);
  const m = T({x: fk.Wn.x + 64 * A.SC, y: fk.Wn.y});
  const bike = T({x: st.mode === 'stop' ? H.bikeXH(s) : H.BIKE_X0, y: A.BIKE_Y});
  rows.push({f, s: +s.toFixed(2), rate: st.mode, z: +z.toFixed(3), hips: T(fk.P), head: T(fk.Hc), mug: m, left: Math.min(...pts.map((q) => q.x)) - 40 * z, right: Math.max(...pts.map((q) => q.x), m.x + 50 * z), top: Math.min(...pts.map((q) => q.y)) - 90 * z, bottom: Math.max(...pts.map((q) => q.y)) + 20 * z, bike: bike.x, lamps: A.LAMPS.map((x) => T({x, y: 0}).x)});
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
const r0 = (v) => String(Math.round(v)).padStart(5);
for (const r of rows.filter((r) => r.f % 10 === 0 || [5, 8, 17, 42, 62, 179].includes(r.f))) console.log(`f${String(r.f).padStart(3)} s${r.s.toFixed(1).padStart(5)} ${r.rate.padEnd(6)} z${r.z.toFixed(2)} | hips ${r0(r.hips.x)},${r0(r.hips.y)} head ${r0(r.head.x)},${r0(r.head.y)} L${r0(r.left)} R${r0(r.right)} T${r0(r.top)} B${r0(r.bottom)} | mug ${r0(r.mug.x)} bike ${r0(r.bike)} lamps ${r.lamps.map((x) => r0(x)).join(' ')}`);
fs.rmSync(tmp, {recursive: true, force: true});
