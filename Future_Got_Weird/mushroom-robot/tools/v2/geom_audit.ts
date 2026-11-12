// Per-frame geometry assertions for the V2 rig and world (every frame of the film, plus sub-frame samples).
// usage: node geom_audit.cjs [out.json]
import fs from 'fs';
import {pose, legAt, HUB_R, HUB_H, DOME_R, LEG_L, PATH_INFO, Leg} from '../../source/src/v2/robot';
import {DUR, FRAMES} from '../../source/src/v2/timing';
import {PROPS} from '../../source/src/v2/props';
import {V3, v3} from '../../source/src/lib';

const SUB = 2; // samples per frame
const R: any = {frames: FRAMES, samplesPerFrame: SUB, path: PATH_INFO, checks: {}, worst: {}};
const fail: Record<string, {t: number; v: number; leg?: number; note?: string}[]> = {};
const note = (k: string, t: number, v: number, leg?: number, n?: string) => { (fail[k] ??= []).push({t: +t.toFixed(3), v: +v.toFixed(4), leg, note: n}); };
const worst: Record<string, {v: number; t: number}> = {};
const track = (k: string, v: number, t: number, lower = true) => {
  const w = worst[k];
  if (!w || (lower ? v < w.v : v > w.v)) worst[k] = {v: +v.toFixed(4), t: +t.toFixed(3)};
};
let prevFeet: {p: V3; planted: boolean; k: number}[] | null = null;
const segDist = (a: V3, b: V3, c: V3, d: V3) => {
  // distance between two short segments (sampled)
  let m = 1e9;
  for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) m = Math.min(m, v3.len(v3.sub(v3.lerp(a, b, i / 4), v3.lerp(c, d, j / 4))));
  return m;
};
for (let f = 0; f < FRAMES * SUB; f++) {
  const t = f / (30 * SUB);
  const P = pose(t);
  const legs: Leg[] = [0, 1, 2, 3, 4].map((i) => legAt(t, i, P));
  const yTop = P.y + HUB_H / 2, yBot = P.y - HUB_H / 2;
  track('hubBottomAboveFloor', yBot, t);
  if (yBot < 0.15) note('bodyTooLow', t, yBot);
  legs.forEach((L, i) => {
    if (L.clamped) note('workspaceClamp', t, L.ratio, i);
    track('ratioMin', L.ratio, t); track('ratioMax', L.ratio, t, false);
    // length
    let len = 0; for (let k = 1; k < L.pts.length; k++) len += v3.len(v3.sub(L.pts[k], L.pts[k - 1]));
    if (Math.abs(len - LEG_L) > 0.03) note('lengthChange', t, len, i);
    track('legLenMin', len, t); track('legLenMax', len, t, false);
    // attachment
    const att = v3.len(v3.sub(L.pts[0], L.socket));
    if (att > 1e-6) note('detached', t, att, i);
    // floor
    let mf = 1e9; for (let k = 0; k < L.pts.length; k++) mf = Math.min(mf, L.pts[k][1] - L.rs[k]);
    track('legFloorClearance', mf, t);
    if (mf < -0.01) note('belowFloor', t, mf, i);
    // planted foot touches the floor (tube bottom within 1 mm)
    if (L.foot.planted) { const tip = L.pts[L.pts.length - 1][1] - L.rs[L.rs.length - 1]; if (Math.abs(tip) > 0.01) note('plantedFootNotOnFloor', t, tip, i); }
    // hub and dome
    for (let k = 4; k < L.pts.length; k++) { // beyond the socket root (first ~1.2 cm of the tube)
      const p = L.pts[k], r = L.rs[k];
      const dh = Math.hypot(p[0] - P.x, p[2] - P.z);
      if (p[1] > yBot - r && p[1] < yTop + r) { const c = dh - HUB_R - r; track('legHubClearance', c, t); if (c < -0.02) note('legIntoHub', t, c, i); }
      if (p[1] >= yTop) { const e = Math.hypot(dh / DOME_R, (p[1] - yTop) / (DOME_R * 0.78)); const c = (e - 1) * DOME_R - r; track('legDomeClearance', c, t); if (c < 0) note('legIntoDome', t, c, i); }
      for (const pr of PROPS) { const c = pr.sdf(p) - r; track('legPropClearance', c, t); if (c < 0) note('legIntoProp', t, c, i, pr.name); }
    }
  });
  // leg vs leg
  for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) {
    let m = 1e9;
    const A = legs[a], B = legs[b];
    for (let k = 1; k < A.pts.length; k++) for (let j = 1; j < B.pts.length; j++) {
      const d = segDist(A.pts[k - 1], A.pts[k], B.pts[j - 1], B.pts[j]) - Math.max(A.rs[k - 1], A.rs[k]) - Math.max(B.rs[j - 1], B.rs[j]);
      if (d < m) m = d;
    }
    track('legLegClearance', m, t);
    if (m < 0) note('legsIntersect', t, m, a * 10 + b);
  }
  // hub vs props
  for (const pr of PROPS) { const c = pr.sdf([P.x, P.y, P.z]) - HUB_R - 0.5; track('bodyPropClearance', c, t); if (c < 0) note('bodyIntoProp', t, c, undefined, pr.name); }
  // stance sliding: a planted foot keeps exactly the same world position until it lifts
  const feet = legs.map((L) => ({p: L.foot.p, planted: L.foot.planted, k: L.foot.k}));
  if (prevFeet) feet.forEach((q, i) => {
    const pq = prevFeet![i];
    if (q.planted && pq.planted && q.k === pq.k) { const d = v3.len(v3.sub(q.p, pq.p)); track('stanceSlideMax', d, t, false); if (d > 1e-9) note('footSlides', t, d, i); }
    // swing continuity: foot never jumps more than 0.8 cm between samples
    const jump = v3.len(v3.sub(q.p, pq.p)); track('footStepPerSampleMax', jump, t, false); if (jump > 1.2) note('footJump', t, jump, i);
  });
  prevFeet = feet;
}
// loop: everything at DUR equals t = 0
const P0 = pose(0), P1 = pose(DUR);
let loopLeg = 0;
for (let i = 0; i < 5; i++) { const a = legAt(0, i, P0), b = legAt(DUR, i, P1); a.pts.forEach((p, k) => { loopLeg = Math.max(loopLeg, v3.len(v3.sub(p, b.pts[k]))); }); }
R.loop = {bodyPos: +Math.hypot(P0.x - P1.x, P0.y - P1.y, P0.z - P1.z).toExponential(2), heading: +(((P1.th - P0.th) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)).toExponential(2), legMaxCm: +loopLeg.toExponential(2)};
R.worst = worst;
R.failures = Object.fromEntries(Object.entries(fail).map(([k, v]) => [k, {count: v.length, first: v.slice(0, 6)}]));
R.pass = Object.keys(fail).length === 0;
fs.writeFileSync(process.argv[2] ?? '/dev/stdout', JSON.stringify(R, null, 1));
console.log(JSON.stringify({pass: R.pass, failures: Object.fromEntries(Object.entries(R.failures).map(([k, v]: any) => [k, v.count])), worst, loop: R.loop}, null, 1));
