// Writes audio/v4/cues_v1.json: the timed events the V1 film's Foley is built on, taken from the SAME modules that draw the picture (source/src/film/*).
// Usage: node tools/build_cues_v1.mjs
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-cuesv1-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `
export * as TL from '${src}/film/timeline';
export * as G from '${src}/film/globe';
export * as S from '${src}/film/street';
export * as B02 from '${src}/film/B02';
export * as B03 from '${src}/film/B03';
export * as B04 from '${src}/film/B04';
export * as B05 from '${src}/film/B05';
export * as B06 from '${src}/film/B06';
`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json', '.css': 'empty', '.woff': 'empty', '.woff2': 'empty'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error', define: {'process.env.NODE_ENV': '"production"'}});
const {TL, S, B02, B03, B04, B05, B06} = await import(pathToFileURL(out).href);
const fps = TL.FPS, N = TL.N_FILM, T = TL.T;
const curve = (fn) => Array.from({length: N}, (_, f) => +fn(f).toFixed(4));
// picture events (frames)
const ev = {
  iris_a: T.irisA, iris_b: T.irisB, zoom_a: T.zoomA, zoom_b: T.zoomB,
  lens: B02.B2.lens, b02_chip: B02.B2.chip, pan_a: T.panA, pan_b: T.panB, stop: T.stopF,
  fixed_chip: B03.B3.fix, fixed_chip2: B03.B3.fix + 3, loose_chip: B03.B3.loose,
  wipe1_a: T.wipe1A, wipe1_b: T.wipe1B,
  at_first_chip: B04.B4.first, air: B04.AIR_F, sea: B04.SEA_F, wipe2_a: T.wipe2A, wipe2_b: T.wipe2B,
  disc: B05.B5.disc, bar_zoom_a: B05.B5.zoom0, bar_zoom_b: B05.B5.zoom1, starting_chip: B05.B5.starting, cat5: B05.B5.cat, b05_end: T.b05end,
  ...Object.fromEntries(Object.entries(B06.B6).map(([k, v]) => [`b06_${k}`, v])),
};
const evFrames = {
  icon_pops: [0, 40, 80, 120, 160].map((d) => B02.B2.pop0 + Math.round((d / 40) * 3)),
  b02_arrows: B02.B2.arrows,
  b04_arrows: [B04.AIR_F + 6, B04.AIR_F + 10, B04.AIR_F + 14, B04.SEA_F + 2],
  b05_lat: B05.LAT.map((l) => l.f),
  junk: B04.JUNK.map((j) => ({kind: j.kind, f0: j.f0, vx: j.vx})),
  plaza: B03.OBJS.map((o) => ({id: o.id, kind: o.kind, tau: o.tau, topple: o.topple ?? null, x0: o.x0})),
};
// front of the surge: frames at which it reaches the wall foot, the wall top, and leaves the screen (screen x = world x + DX)
const front = (f) => B04.frontX(f);
const firstF = (pred) => { for (let f = B04.SEA_F; f < N; f++) if (pred(f)) return f; return null; };
ev.sea_wall = firstF((f) => front(f) >= B04.WALL_X0);
ev.sea_prom = firstF((f) => front(f) >= B04.WALL_X1 + 10);
ev.sea_screen_edge = firstF((f) => front(f) + B04.DX >= 1080);
// the rolling ball leaves the screen (screen x > 1100 at the street camera of B03)
const ball = B03.OBJS.find((o) => o.kind === 'ball');
ev.ball_exit = (() => { for (let f = T.stopF; f < N; f++) if (540 + (B03.objX(ball, f) - S.CAM_B03.x) * S.CAM_B03.z > 1100) return f; return null; })();
evFrames.plaza_exit = Object.fromEntries(B03.OBJS.map((o) => [o.id, B03.exitFrame(o)]));
evFrames.bike3 = [B03.bikeEnter3(), B03.bikeExit3()];
const cues = {
  fps, total_frames: N, duration_s: N / fps, words: TL.WORD, events: ev, event_frames: evFrames, v0: B03.V0,
  curves: {wind: curve(B04.windK), speedK: curve(B06.speedK), pan_vel: curve((f) => (f >= T.panA - 1 && f <= T.panB + 1 ? Math.abs(S.camStoryVel(f)) : 0))},
};
fs.mkdirSync(path.join(root, 'audio/v4'), {recursive: true});
fs.writeFileSync(path.join(root, 'audio/v4/cues_v1.json'), JSON.stringify(cues, null, 1));
console.log('events', JSON.stringify(ev));
fs.rmSync(tmp, {recursive: true, force: true});
