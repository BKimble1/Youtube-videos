// Writes audio/v6/cues_v3.json: the timed events the V3 film's sound is built on, taken from the SAME modules that draw the picture (source/src/film3/*).
// Usage: node tools/build_cues_v3.mjs
import {build} from '../source/node_modules/esbuild/lib/main.js';
import path from 'node:path'; import fs from 'node:fs'; import os from 'node:os';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'source/src');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgw-cuesv3-'));
fs.writeFileSync(path.join(tmp, 'e.ts'), `
export * as TL from '${src}/film3/timeline3';
export * as SS from '${src}/film3/StreetScenes3';
export * as SIM from '${src}/film3/Street3';
export * as CO from '${src}/film3/Coast3';
export * as BR from '${src}/film3/Brake3';
export * as CH from '${src}/film2/ui';
`);
const out = path.join(tmp, 'b.mjs');
await build({entryPoints: [path.join(tmp, 'e.ts')], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: {'.json': 'json', '.css': 'empty', '.woff': 'empty', '.woff2': 'empty'}, jsx: 'automatic', nodePaths: [path.join(root, 'source/node_modules')], logLevel: 'error', define: {'process.env.NODE_ENV': '"production"'}});
const {TL, SS, SIM, CO, BR, CH} = await import(pathToFileURL(out).href);
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
const posts = SS.POSTS3.map((xw) => { for (let f = T.trackA; f < T.occB; f++) if (SS.camX3(f) >= xw) return f; return null; }).filter((x) => x !== null);
// ---- awning: frames it covers the middle of the lens / the whole lens
const tarp = {a: T.occA, b: T.occB, mid: [], full: []};
for (let f = T.occA; f <= T.occB + 6; f++) { const {L, R} = SS.tarpEdges(f); if (L < 540 && R > 540) tarp.mid.push(f); if (L < 0 && R > 1080) tarp.full.push(f); }
// ---- wind curve across the film (P2 ramps in, P3 builds, the coast is stormy, the explanation is calm)
const ramp = (f, a, b) => Math.max(0, Math.min(1, (f - a) / (b - a)));
const windAt = (f) => f < 100 ? 0 : f < T.trackA ? ramp(f, 100, 150) * 0.35 : f < T.occB ? SS.windK3(f) * (0.35 + 0.65) : f < T.sprayA ? 0.85 : 0.85 * (1 - ramp(f, T.sprayA, T.stageA + 14));
const ev = {
  brake: {contact: T.brakeContact, stop: T.brakeStop, cut: T.cutStreet, padsOpen: BR.padGap(-18), pads0: BR.padGap(0), spin: BR.OMEGA_DEG},
  hold: [T.holdA, T.holdB], wideA: T.wideA,
  street: {bike_hit: SS.bikeHitF, chair_hit: SS.chairHitF, bodies},
  track: [T.trackA, T.trackB], posts, tarp: {a: tarp.a, b: tarp.b, mid: [tarp.mid[0], tarp.mid[tarp.mid.length - 1]], full: tarp.full.length ? [tarp.full[0], tarp.full[tarp.full.length - 1]] : null},
  coast: {a: T.coastA, swell: CO.swellA, hit: T.surgeHit, flood: T.floodA, sprayA: T.sprayA, sprayB: T.sprayB, band: [T.sprayA - 18, T.sprayB]},
  stage: {a: T.stageA, b: T.stageB, arrows: [430, 436, 441], chip: T.stageA + 4, pulse: 447, shrink: [T.toGlobeA, T.toGlobeB]},
  globe: {lat: T.latA, move: [T.latMove0, T.latMove1], hold: T.latHold, chipEq: T.toGlobeB + 2, chipPole: T.latMove0 + 24, poleIn: T.latMove0 + 6},
  finale: {finA: T.finA, ring: [T.ringA, T.ringB], caliper: [T.caliperA, T.caliperB], pads: T.padsA},
  words: TL.WORD,
};
const captions = TL.CUES.map((c) => ({a: c.a, b: c.b, dy: c.dy || 0, text: c.lines.map((l) => l.map((sg) => sg[0]).join('')).join(' ').replace(/\s+/g, ' ').trim()}));
const cues = {fps, total_frames: N, duration_s: N / fps, events: ev, groups: TL.GROUPS, captions,
  curves: {wind: curve(windAt), crest: curve((f) => Math.max(0, (CO.crestH(f) - 120) / 740) * (f >= T.coastA && f < T.sprayB ? 1 : 0)), camv: curve((f) => (f >= T.trackA && f < T.occB ? SS.camV(f) / 64 : 0))}};
fs.mkdirSync(path.join(root, 'audio/v6'), {recursive: true});
fs.writeFileSync(path.join(root, 'audio/v6/cues_v3.json'), JSON.stringify(cues, null, 1));
console.log(JSON.stringify(ev));
fs.rmSync(tmp, {recursive: true, force: true});
