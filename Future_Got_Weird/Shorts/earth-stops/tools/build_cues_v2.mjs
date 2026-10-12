// Writes audio/v5/cues_v2.json: the timed events the V2 film's sound is built on, taken from the SAME modules that draw the picture (source/src/film2/*).
// Usage: node tools/build_cues_v2.mjs
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-cuesv2-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `
export * as TL from '${src}/film2/timeline';
export * as HK from '${src}/film2/Hook2';
export * as ST from '${src}/film2/Story2';
export * as PZ from '${src}/film2/Plaza';
export * as CO from '${src}/film2/Coast2';
export * as PO from '${src}/film2/Payoff2';
export * as SC from '${src}/film2/Scene2';
`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json', '.css': 'empty', '.woff': 'empty', '.woff2': 'empty'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error', define: {'process.env.NODE_ENV': '"production"'}});
const {TL, HK, ST, PZ, CO, PO} = await import(pathToFileURL(out).href);
const fps = TL.FPS, N = TL.N_FILM, T = TL.T;
const curve = (fn) => Array.from({length: N}, (_, f) => +fn(f).toFixed(4));
// bicycle pass: the frame its centre crosses the middle of the screen, and the frames it is on screen (plaza camera)
const camP = ST.PLAZA;
const bikeScreen = (f) => 540 + (PZ.bikeState(f - T.stopF).x - camP.cam) * camP.z;
const onScreen = []; for (let f = T.stopF; f < N; f++) { const x = bikeScreen(f); if (x > -200 && x < 1280) onScreen.push(f); }
const centre = (() => { for (let f = T.stopF; f < N; f++) if (bikeScreen(f) >= 540) return f; return null; })();
const ev = {
  globe_stop: T.globeStop, hook_tags: [HK.HK.lamp, HK.HK.bike], hook_rewind: [HK.HK.rw0, HK.HK.rw1], hook_eq: HK.HK.eq, hook_arrow: HK.HK.arrow, hook_plate: HK.HK.plate,
  b02_pigeon_in: ST.B2.pigeonIn, b02_lens: ST.B2.lens, b02_you: ST.B2.you, b02_ground: ST.B2.ground, b02_air: ST.B2.air, b02_pulse: ST.B2.pulse, pan: [T.panA, T.panB],
  stop: T.stopF, curb_tag: ST.B3.curb, loose_tag: ST.B3.loose, wipe1: [T.wipe1A, T.wipe1B],
  bike_on_screen: [onScreen[0], onScreen[onScreen.length - 1]], bike_centre: centre,
  chair_tip: [T.stopF + PZ.PLAZA_OBJ.chair.tip0, T.stopF + PZ.PLAZA_OBJ.chair.tip1],
  air: CO.AIR_F, sea: CO.SEA_F, sea_wall: CO.WALL_F, sea_exit: CO.EXIT_F, foam: [T.foamA, T.foamB, T.foamC],
  lat: [T.latA, T.latMove0, T.latMove1], streak: [T.streakA, T.streakB], pay: T.payA, chip_pay: PO.P2.chip, sip: [T.sipA, T.sipUp, T.sipDown, T.sipEnd],
};
const cues = {fps, total_frames: N, duration_s: N / fps, d_hook: T.D, words: TL.WORD, groups: TL.GROUPS, events: ev, junk: CO.JUNK.map((j) => ({kind: j.kind, f0: j.f0})),
  curves: {wind: curve(CO.windK), level: curve((f) => (1340 - CO.level(f)) / 250)}};
fs.mkdirSync(path.join(root, 'audio/v5'), {recursive: true});
fs.writeFileSync(path.join(root, 'audio/v5/cues_v2.json'), JSON.stringify(cues, null, 1));
console.log(JSON.stringify(ev));
fs.rmSync(tmp, {recursive: true, force: true});
