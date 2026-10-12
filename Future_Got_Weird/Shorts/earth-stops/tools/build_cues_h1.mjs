// Writes audio/v3/cues_h1.json: the timed events the H1 hook's Foley is built on, derived from the SAME choreography functions that draw the picture.
// Usage: node tools/build_cues_h1.mjs
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-cuesh1-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `export * as A from '${src}/v2/choreo2'; export * as H from '${src}/v2/choreoH';`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error'});
const {A, H} = await import(pathToFileURL(out).href);
const fps = H.FPS_H, N = H.N_H, T0 = H.T0_H;
const frames = Array.from({length: N}, (_, f) => {
  const st = H.sceneFor(f), s = st.s, fwd = f < H.RW0; // forward-running stop timeline only; the rewind and the 'was' timeline have their own sounds
  const z = H.zoomFor(st);
  const bx = fwd ? H.toScreenFor(H.bikeXH(s), A.BIKE_Y, st).x : -999, half = 2.1 * A.BIKE_R * z;
  const vis = fwd ? Math.max(0, Math.min(1, (Math.min(1080, bx + half) - Math.max(0, bx - half)) / (2 * half))) : 0;
  return {
    f, t: +(f / fps).toFixed(4), s: +s.toFixed(3), mode: fwd ? 'stop' : f < H.RW1 ? 'rewind' : 'was',
    v_hero: fwd ? +(s < 0 ? H.VW : Math.abs(H.hipXH(s) - H.hipXH(s - 1))).toFixed(3) : 0, // px/frame in the ground frame
    cam_rel: fwd ? +(s < 0.5 ? 0 : Math.abs(H.camXH(s) - H.camXH(s - 1)) * z).toFixed(3) : 0, // px/frame the street scrolls past on screen (0 while she walks: no blur)
    bike_x: +bx.toFixed(1), bike_vis: +vis.toFixed(3), bike_v: fwd ? +(s <= 0 ? 0 : Math.abs(H.bikeXH(s) - H.bikeXH(s - 1))).toFixed(3) : 0,
  };
});
const seen = new Set(), landings = [];
for (let s = 0; s <= N - T0 + 10; s++) {
  for (const p of A.parcels(s, 0)) {
    if (!p.landed || seen.has(p.k)) continue;
    seen.add(p.k);
    const lf = s - p.sinceLand, scr = H.toScreenFor(p.x, p.y, {s: Math.max(0, lf), mode: 'stop'});
    const frame = H.frameOfScene(lf);
    if (frame < N) landings.push({k: p.k, frame: +frame.toFixed(2), t: +(frame / fps).toFixed(4), screen_x: +scr.x.toFixed(1), r: +p.r.toFixed(1)});
  }
}
landings.sort((a, b) => a.frame - b.frame);
const E = A.EVT;
const ev = {
  globe_stop: H.GLOBE_STOP, hero_imbalance: H.GLOBE_STOP, scene0: T0, cup_tick: T0 + E.tick, jet_first: T0, jet_last: +(T0 + 0.42 * 45).toFixed(1), launch: T0 + E.launch, flap_in: T0 + 8,
  brake_start: T0 + E.brake_start, brake_end: T0 + E.brake_end, land: T0 + E.land, bounce: T0 + E.land + 8,
  chip_bike: H.CHIP.bike, chip_lamp: H.CHIP.lamp, chip_bike_off: H.CHIP.bikeOff, east: H.EAST_F, num_a: H.NUM_A, num_b: H.NUM_B, mph: H.MPH_F,
  bike_enter: frames.find((r) => r.bike_vis > 0.05)?.f, bike_exit: H.RW0, rewind_start: H.RW0, rewind_end: H.RW1, rewind_speed: +H.RWK.toFixed(3),
};
const cues = {variant: 'h1', fps, total_frames: N, duration_s: N / fps, t0: T0, rewind_speed: H.RWK, events: Object.fromEntries(Object.entries(ev).map(([k, v]) => [k, {frame: v, t: +(v / fps).toFixed(4)}])), coffee: {landings}, frames, voice: H.VOICE};
fs.mkdirSync(path.join(root, 'audio/v3'), {recursive: true});
fs.writeFileSync(path.join(root, 'audio/v3/cues_h1.json'), JSON.stringify(cues, null, 1));
console.log('events', JSON.stringify(Object.fromEntries(Object.entries(ev))));
console.log('landings', landings.length, 'on screen', landings.filter((l) => l.screen_x > 0 && l.screen_x < 1080).length);
fs.rmSync(tmp, {recursive: true, force: true});
