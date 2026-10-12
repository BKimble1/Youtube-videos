// Writes audio/v7/cues_v4.json: the timed events the V4 film's sound is built on, taken from the SAME modules that draw the picture (source/src/film4/*).
// Usage: node tools/build_cues_v4.mjs
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-cuesv4-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `
export * as TL from '${src}/film4/timeline4';
export * as SS from '${src}/film4/StreetScenes4';
export * as SIM from '${src}/film4/Street4';
export * as CO from '${src}/film4/Coast4';
export * as BR from '${src}/film4/Brake4';
`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json', '.css': 'empty', '.woff': 'empty', '.woff2': 'empty'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error', define: {'process.env.NODE_ENV': '"production"'}});
const {TL, SS, SIM, CO, BR} = await import(pathToFileURL(out).href);
const N = TL.N_FILM, T = TL.T, fps = TL.FPS;
const curve = (fn) => Array.from({length: N}, (_, f) => +fn(f).toFixed(4));
// ---- P2: every loose body: frames on screen, floor contacts that happen on screen, collisions
const bodies = {};
for (const [name, b] of Object.entries(SS.BODIES)) {
  const sx = (f) => 540 + (SIM.simBody(b, f).x - SS.CAMX2) * SS.zoom2(f);
  const on = []; for (let f = Math.max(b.t0, T.wideA); f < T.trackA; f++) { const x = sx(f); if (x > -160 && x < 1240) on.push(f); }
  const st = SIM.simBody(b, T.trackA);
  bodies[name] = {t0: b.t0, on: on.length ? [on[0], on[on.length - 1]] : null, centre: (() => { for (let f = b.t0; f < T.trackA; f++) if (sx(f) >= 540) return f; return null; })(),
    floor: st.events.filter((e) => e.kind === 'floor' && sx(e.t) > -60 && sx(e.t) < 1140 && e.t >= T.wideA).map((e) => +e.t.toFixed(2)),
    hits: st.hitT.map((t) => +t.toFixed(2))};
}
// ---- P3: when each foreground post crosses the middle of the frame
const posts = SS.POSTS3.map((xw) => { for (let f = T.trackA; f < T.coastA; f++) if (SS.camX3(f) >= xw) return f; return null; }).filter((x) => x !== null);
const ramp = (f, a, b) => Math.max(0, Math.min(1, (f - a) / (b - a)));
// ---- the hero's acting: frame her feet leave the ground (lift > 10 px)
let liftOn = T.cutStreet; for (let f = T.cutStreet; f < T.dangerEnd; f++) if (SS.liftP1(f) > 10) { liftOn = f; break; }
// ---- wind curve across the film (P2 ramps in, P3 builds, the coast is stormy, the flood takes it, the explanation is calm)
const windAt = (f) => f < T.windA ? 0 : f < T.trackA ? ramp(f, T.windA, T.windB) * 0.35 : f < T.coastA ? SS.windK3(f) : f < T.floodA ? 0.6 + 0.25 * ramp(f, T.coastA, T.surgeHit) : 0.85 * (1 - ramp(f, T.floodA, T.drainB));
const ev = {
  brake: {contact: T.brakeContact, stop: T.brakeStop, cut: T.cutStreet, approach: BR.APPROACH, padsOpen: BR.padGap(-BR.APPROACH), pads0: BR.padGap(0), spin: BR.OMEGA_DEG},
  danger: {a: T.cutStreet, b: T.dangerEnd, liftOn, poleX: [T.cutStreet, T.dangerEnd - 1].map((f) => Math.round(SS.poleX(f)))},
  wideA: T.wideA,
  street: {bike_hit: SS.bikeHitF, chair_hit: SS.chairHitF, bodies},
  wind: [T.windA, T.windB], track: T.trackA, posts,
  awning: {strain: T.awnStrain, tear: T.awnTear, free: T.awnFree, cover: [SS.COVER.a, SS.COVER.b], sweep: [SS.COVER.sweepA, SS.COVER.sweepB], coast: T.coastA},
  coast: {a: T.coastA, swell: CO.swellA, boatFoot: CO.BOAT.tFoot, boatCap: CO.BOAT.tCap, hit: T.surgeHit, postPass: CO.PF.map((x) => +x.toFixed(1)), postBreak: CO.BRK.post, deck: CO.BRK.deck, flood: [T.floodA, T.floodB], drain: [T.drainA, T.drainB]},
  stage: {a: T.stageA, b: T.stageB, you: TL.fs(TL.WORD.you2), move: TL.fs(TL.WORD.move), withE: TL.fs(TL.WORD.withE), chip: T.stageA + 4, shrink: [T.toGlobeA, T.toGlobeB]},
  globe: {lat: T.latA, move: [T.latMove0, T.latMove1], chipEq: T.toGlobeB + 2, chipPole: T.latMove0 + 24, poleIn: T.latMove0 + 6},
  finale: {finA: T.finA, ring: [T.ringA, T.ringB], caliper: [T.caliperA, T.caliperB], pads: T.padsA},
  words: TL.WORD,
};
const captions = TL.CUES.map((c) => ({a: c.a, b: c.b, dy: c.dy || 0, text: c.lines.map((l) => l.map((sg) => sg[0]).join('')).join(' ').replace(/\s+/g, ' ').trim()}));
const cues = {fps, total_frames: N, duration_s: N / fps, events: ev, groups: TL.GROUPS, captions,
  curves: {wind: curve(windAt), crest: curve((f) => Math.max(0, (CO.crestH(f) - 120) / 640) * (f >= T.coastA && f < T.floodB ? 1 : 0)), camv: curve((f) => (f >= T.trackA && f < T.coastA ? SS.camV(f) / 68 : 0))}};
fs.mkdirSync(path.join(root, 'audio/v7'), {recursive: true});
fs.writeFileSync(path.join(root, 'audio/v7/cues_v4.json'), JSON.stringify(cues, null, 1));
console.log(JSON.stringify(ev));
fs.rmSync(tmp, {recursive: true, force: true});
