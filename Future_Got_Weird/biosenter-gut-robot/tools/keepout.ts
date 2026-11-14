// Caption keep-out check: for every frame, project the robot's body (rings round its centreline at its real radius)
// through that shot's own camera and measure how much of it falls inside the caption box. Captions must never sit on
// the robot's moving parts. Prints the worst frames per scene; exits non-zero if any frame covers more than 4%.
import {basis, proj, add3, mul3} from '../source/src/core/three';
import {CAPTIONS, DUR, FPS, FRAMES} from '../source/src/lib';
import {capIndex, capY} from '../source/src/Captions';
import {SCENES} from '../source/src/Film';
import {crawl, CrawlState} from '../source/src/robot/state';
import {FrameF, layout, radius} from '../source/src/robot/geom';
import {gutFrame} from '../source/src/world/frames';
import {tunnelCam} from '../source/src/scenes/tunnel';
import {insideCam} from '../source/src/scenes/inside';
import {steerFrame, toolsCam, toolsState} from '../source/src/scenes/tools';
import {labCam, labState, LAB_FRAME} from '../source/src/scenes/lab';
import {Cam3} from '../source/src/core/three';

const pts = (cam: Cam3, frame: FrameF, st: CrawlState, part: 'all' | 'head' | 'headAnchor' | 'body' = 'all') => {
  const B = basis(cam);
  const L = layout(st.e);
  const out: {x: number; y: number}[] = [];
  const [ua, ub] = part === 'head' ? [L.u5, L.u7] : part === 'headAnchor' ? [L.u5, L.u6] : part === 'body' ? [L.u1, L.u7] : [0, L.u7];
  for (let u = ua; u <= ub; u += 0.12) {
    const f = frame(st.sTail + u);
    for (let k = 0; k < 16; k++) {
      const phi = (k / 16) * Math.PI * 2;
      const r = radius(u, phi, st, L).r;
      const p = add3(f.p, add3(mul3(f.N, r * Math.cos(phi)), mul3(f.B, r * Math.sin(phi))));
      const q = proj(B, p);
      out.push({x: q.x, y: q.y});
    }
  }
  return out;
};
const worst: Record<string, {f: number; frac: number; all: number}[]> = {};
let bad = 0;
const frac = (P: {x: number; y: number}[], box: {x0: number; x1: number; y0: number; y1: number}) => {
  const inside = P.filter((p) => p.x >= box.x0 && p.x <= box.x1 && p.y >= box.y0 && p.y <= box.y1).length;
  const onScreen = P.filter((p) => p.x >= 0 && p.x <= 1080 && p.y >= 0 && p.y <= 1920).length || 1;
  return inside / onScreen;
};
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const i = capIndex(t);
  if (i < 0) continue;
  // the focal moving part per shot (strict), and the whole robot (loose)
  let cam: Cam3, frame: FrameF, st: CrawlState, part: 'all' | 'head' | 'headAnchor' | 'body', scene: string;
  if (t < SCENES.s2) { st = crawl(t); cam = tunnelCam(t, st); frame = gutFrame; part = 'head'; scene = 'S1'; }
  else if (t < SCENES.s4) { st = crawl(t); cam = insideCam(t); frame = gutFrame; part = t < 7.9 ? 'headAnchor' : 'body'; scene = t < SCENES.s3 ? 'S2' : 'S3'; }
  else if (t < SCENES.s5) continue; // the diagram: checked by eye (captions top, the pig mid-frame, "6+ FEET" low)
  else if (t < SCENES.s6) { const s = toolsState(t); st = {sTail: 30, e: 0.62, aT: 1, aH: 0, popT: 1, popH: 0, gE: 0}; cam = toolsCam(t); frame = steerFrame(s.bend); part = 'all'; scene = 'S5'; }
  else if (t < SCENES.s7) { st = labState(t); cam = labCam(t).cam; frame = LAB_FRAME; part = 'all'; scene = 'S6'; }
  else { st = crawl(t - DUR); cam = tunnelCam(t - DUR, st); frame = gutFrame; part = 'body'; scene = 'S7'; }
  const c = CAPTIONS[i];
  const y = capY(c.show + 0.01);
  const lines = c.text.length > 22 ? 2 : 1;
  const h = lines * 77 + 20;
  const box = {x0: 110, x1: 870, y0: y - h / 2, y1: y + h / 2};
  const fr = frac(pts(cam, frame, st, part), box), all = frac(pts(cam, frame, st, 'all'), box);
  (worst[scene] ??= []).push({f, frac: fr, all});
  if (fr > 0.04 || all > 0.15) bad++;
}
for (const [s, arr] of Object.entries(worst)) {
  arr.sort((a, b) => b.frac - a.frac);
  const wa = [...arr].sort((a, b) => b.all - a.all)[0];
  console.log(s, 'focal worst:', arr.slice(0, 3).map((x) => `f${x.f} ${(x.frac * 100).toFixed(1)}%`).join(', '), ' | whole robot worst:', `f${wa.f} ${(wa.all * 100).toFixed(1)}%`);
}
const ranges: string[] = [];
for (const [s, arr] of Object.entries(worst)) {
  const fs = arr.filter((x) => x.frac > 0.04 || x.all > 0.15).map((x) => x.f).sort((a, b) => a - b);
  let a = -1, b = -1;
  for (const f of fs) { if (f === b + 1) b = f; else { if (a >= 0) ranges.push(`${s} ${a}-${b}`); a = b = f; } }
  if (a >= 0) ranges.push(`${s} ${a}-${b}`);
}
console.log('over 4%:', ranges.join(', '));
console.log(bad ? `FAIL: ${bad} frames (focal part > 4% or whole robot > 15% under a caption)` : 'OK: captions never cover more than 4% of the focal part or 15% of the robot');
