// Per-frame screen-space positions for E-A v2 (hero extents, mug, bicycle, anchored items, coffee) from the same choreography the render uses.
// Usage: node tools/probe_ea2.mjs [out.json]
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-p2-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `export * from '${src}/v2/choreo2';`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, jsx: 'automatic', nodePaths: [path.resolve(here, '../source/node_modules')], logLevel: 'error'});
const m = await import(pathToFileURL(out).href);
const rows = [];
for (let f = 0; f < m.N; f++) {
  const fk = m.heroFK(f), z = m.zoomAt(f), S = (p) => m.toScreen(p.x, p.y, f);
  const pts = [fk.P, fk.Hc, fk.Wn, fk.Wf, fk.An, fk.Af, fk.shoeN, fk.shoeF, fk.En, fk.Ef];
  const sp = pts.map(S);
  const mug = S(m.mouthWorld(f));
  const left = Math.min(...sp.map((p) => p.x)) - 40 * z, right = Math.max(...sp.map((p) => p.x), mug.x + 50 * z) + 0;
  const top = Math.min(...sp.map((p) => p.y)) - 90 * z, bottom = Math.max(...sp.map((p) => p.y)) + 20 * z;
  const bike = m.toScreen(m.bikeX(f), m.BIKE_Y, f);
  const ps = m.parcels(f).filter((p) => !p.landed).map((p) => S(p));
  rows.push({f, z: +z.toFixed(3), cam: +m.camX(f).toFixed(1), hips: S(fk.P), left: +left.toFixed(0), right: +right.toFixed(0), top: +top.toFixed(0), bottom: +bottom.toFixed(0), mug,
    bikeX: +bike.x.toFixed(0), bikeHalf: +(m.BIKE_R * 2.1 * z).toFixed(0), lamps: m.LAMPS.map((x) => +m.toScreen(x, 0, f).x.toFixed(0)), palms: m.PALMS.map((x) => +m.toScreen(x, 0, f).x.toFixed(0)),
    coffeeMaxX: ps.length ? +Math.max(...ps.map((p) => p.x)).toFixed(0) : null, coffeeN: ps.length});
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(rows, null, 1));
const fm = (v) => String(Math.round(v)).padStart(5);
for (const r of rows.filter((r) => r.f % 6 === 0 || r.f === m.N - 1))
  console.log(`f${String(r.f).padStart(2)} Z${r.z.toFixed(2)} cam${fm(r.cam)} | hips ${fm(r.hips.x)},${fm(r.hips.y)} L${fm(r.left)} R${fm(r.right)} top${fm(r.top)} bot${fm(r.bottom)} mug ${fm(r.mug.x)},${fm(r.mug.y)} | bike ${fm(r.bikeX)} | coffee tip ${r.coffeeMaxX ?? '-'} | lamps ${r.lamps.join(' ')} palms ${r.palms.join(' ')}`);
fs.rmSync(tmp, {recursive: true, force: true});
