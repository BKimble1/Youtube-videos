// Writes audio/v2/cues_<variant>.json: the timed events the v2 Foley is built on, derived from the SAME choreography functions that draw the picture.
// Usage: node tools/build_cues_v2.mjs ea2|ec1
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const variant = process.argv[2];
if (!['ea2', 'ec1'].includes(variant)) throw new Error('variant must be ea2 or ec1');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-cues2-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `export * as A from '${src}/v2/choreo2'; export * as C from '${src}/v2/choreoEC';`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error'});
const {A, C} = await import(pathToFileURL(out).href);
const ec = variant === 'ec1';
const fps = ec ? C.FPS_EC : A.FPS, N = ec ? C.N_EC : A.N, T0 = ec ? C.T0 : 0, B0 = ec ? 0 : A.PARCEL_B0;
const PANEL_S = 0.82; // E-C draws the street scene scaled by this about x = 540
const toFrameX = (sx) => (ec ? 540 + (sx - 540) * PANEL_S : sx);
const sc = (f) => f - T0; // composition frame -> scene frame
const frames = Array.from({length: N}, (_, f) => {
  const s = sc(f);
  const live = s >= 0;
  return {
    f, t: +(f / fps).toFixed(4),
    v_hip: live ? +A.vHip(s).toFixed(3) : 0, // px/frame in the ground frame (scene px)
    cam_rel: live ? +(A.camSpeed(s) * A.zoomAt(s)).toFixed(3) : 0, // px/frame the street scrolls past on screen
    grounded: live ? A.grounded(s) : true,
  };
});
// first scene frame each parcel is on the ground -> landing frame and where it lands on screen
const seen = new Set(), landings = [];
for (let s = 0; s <= N - T0 + 10; s++) {
  for (const p of A.parcels(s, B0)) {
    if (!p.landed || seen.has(p.k)) continue;
    seen.add(p.k);
    const lf = s - p.sinceLand;
    const scr = A.toScreen(p.x, p.y, Math.max(0, lf));
    const fx = toFrameX(scr.x), frame = lf + T0;
    if (frame < N) landings.push({k: p.k, frame: +frame.toFixed(2), t: +(frame / fps).toFixed(4), screen_x: +fx.toFixed(1), r: +p.r.toFixed(1)});
  }
}
landings.sort((a, b) => a.frame - b.frame);
const EA = A.EVT; // events in scene frames
const events = {
  hero_stop: T0, cup_tick: EA.tick + T0, launch: EA.launch + T0, land: EA.land + T0, brake_start: EA.brake_start + T0, brake_end: EA.brake_end + T0,
  jet_first: Math.max(0, T0 + B0), jet_last: +(T0 + B0 + 0.42 * 45).toFixed(1), flap_in: T0 + 8,
  ...(ec ? {globe_stop: C.EVT_EC.stop, ring_end: C.EVT_EC.ring_end} : {}),
};
let bike = null;
if (!ec) {
  const enter = Array.from({length: N}, (_, f) => f).find((f) => A.toScreen(A.bikeX(f), A.BIKE_Y, f).x + A.BIKE_R * 2.15 * A.zoomAt(f) > 0);
  bike = {enter_frame: enter, note: 'first frame any part of the bicycle is on screen'};
}
const cues = {
  variant, fps, total_frames: N, duration_s: N / fps, t0: T0,
  events: Object.fromEntries(Object.entries(events).map(([k, v]) => [k, {frame: v, t: +(v / fps).toFixed(4)}])),
  coffee: {emit_first_frame: events.jet_first, emit_last_frame: events.jet_last, landings},
  bike, frames,
};
fs.mkdirSync(path.join(root, 'audio/v2'), {recursive: true});
fs.writeFileSync(path.join(root, `audio/v2/cues_${variant}.json`), JSON.stringify(cues, null, 1));
console.log(variant, 'events', JSON.stringify(cues.events));
console.log('landings', landings.length, 'on screen', landings.filter((l) => l.screen_x > 0 && l.screen_x < 1080).length, 'bike', JSON.stringify(bike));
fs.rmSync(tmp, {recursive: true, force: true});
