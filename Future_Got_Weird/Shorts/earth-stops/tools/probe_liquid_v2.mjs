// Per-frame visibility of the airborne coffee for E-A v2 and E-C, from the same choreography the render uses (no pixels involved).
// Usage: node tools/probe_liquid_v2.mjs [out.json]
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '../source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-liq-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `export * as A from '${src}/v2/choreo2'; export * as C from '${src}/v2/choreoEC';`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, jsx: 'automatic', nodePaths: [path.resolve(here, '../source/node_modules')], logLevel: 'error'});
const {A, C} = await import(pathToFileURL(out).href);
const S = 0.82, PANEL_TOP = 820;
const result = {};
for (const v of ['ea2', 'ec1']) {
  const ec = v === 'ec1', T0 = ec ? C.T0 : 0, B0 = ec ? 0 : A.PARCEL_B0, N = ec ? C.N_EC : A.N;
  const rows = [];
  for (let f = 0; f < N; f++) {
    const s = f - T0;
    if (s < 0) { rows.push({f, airborne: 0, in_frame: 0, off_frame: 0, ribbon: 0}); continue; }
    const ps = A.parcels(s, B0).filter((p) => !p.landed);
    let inn = 0, off = 0;
    for (const p of ps) {
      const q = A.toScreen(p.x, p.y, s);
      const x = ec ? 540 + (q.x - 540) * S : q.x, y = ec ? PANEL_TOP + ((q.y) * S - 533.6) : q.y; // E-C: scene -> panel -> frame (ty = 1500 - 820 - 1480 S)
      const vis = x > -10 && x < 1090 && y > (ec ? PANEL_TOP : 0) && y < 1920;
      vis ? inn++ : off++;
    }
    rows.push({f, airborne: ps.length, in_frame: inn, off_frame: off, ribbon: ps.filter((p) => p.ribbon).length});
  }
  const firstOff = rows.find((r) => r.off_frame > 0);
  const air = rows.filter((r) => r.airborne > 0);
  result[v] = {
    first_airborne_frame: air[0]?.f, last_airborne_frame: air[air.length - 1]?.f,
    frames_with_airborne_liquid: air.length,
    frames_with_any_airborne_drop_off_frame: rows.filter((r) => r.off_frame > 0).length,
    first_frame_with_a_drop_off_frame: firstOff?.f ?? null,
    max_fraction_off_frame: +Math.max(...rows.map((r) => (r.airborne ? r.off_frame / r.airborne : 0))).toFixed(3),
    ribbon_frames: rows.filter((r) => r.ribbon > 3).length,
    rows,
  };
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 1));
for (const v of Object.keys(result)) { const r = result[v]; console.log(v, JSON.stringify({...r, rows: undefined})); }
fs.rmSync(tmp, {recursive: true, force: true});
