// Rig probe (V2): for every walking character and every frame of their shots, measures the stance foot's slip
// (planted ankle moving on the floor), the ankle's miss (IK could not reach the plant), the arm and leg bone lengths
// (must be constant) and the elbow bend direction. usage: bundle with esbuild, run with node; writes JSON.
import {manJoints, ManPose, DIM} from '../../source/src/dc/Man';
import {walk, footAt, Gait} from '../../source/src/art/walk';
import * as fs from 'fs';

const len = (a: {x: number; y: number}, b: {x: number; y: number}) => Math.hypot(a.x - b.x, a.y - b.y);
export const probe = (name: string, g: Gait, t0: number, t1: number) => {
  let maxMiss = 0, maxSlip = 0, boneDev = 0, worst = {miss: 0, t: 0};
  // knee flexion (deg) of the stance leg, min over each frame (the straighter stance leg), and the hip's 2nd difference
  let kMin = 999, kMax = 0, hipAcc = 0, backEl = 0, jerk = 0; const pp: {x: number; y: number}[][] = []; const hy: number[] = [];
  let prev: {l: {x: number; y: number}; r: {x: number; y: number}; lc: boolean; rc: boolean} | null = null;
  for (let f = Math.ceil(t0 * 30); f <= t1 * 30; f++) {
    const t = f / 30;
    const p: ManPose = walk(g, t);
    const j = manJoints(p);
    const missL = Math.hypot(j.lLeg.A.x - p.lAx!, j.lLeg.A.y - p.lAy!), missR = Math.hypot(j.rLeg.A.x - p.rAx!, j.rLeg.A.y - p.rAy!);
    if (Math.max(missL, missR) > worst.miss) worst = {miss: Math.max(missL, missR), t};
    maxMiss = Math.max(maxMiss, missL, missR);
    const lc = footAt(g, t, 0).lift === 0, rc = footAt(g, t, 0.5).lift === 0;
    if (prev) {
      if (lc && prev.lc) maxSlip = Math.max(maxSlip, len(j.lLeg.A, prev.l));
      if (rc && prev.rc) maxSlip = Math.max(maxSlip, len(j.rLeg.A, prev.r));
    }
    const flex = (L: typeof j.lLeg) => { const a = Math.atan2(L.K.x - L.hp.x, L.K.y - L.hp.y), b = Math.atan2(L.A.x - L.K.x, L.A.y - L.K.y); return Math.abs(((a - b) * 180) / Math.PI); };
    const st = [lc ? flex(j.lLeg) : 999, rc ? flex(j.rLeg) : 999].filter((v) => v < 999);
    if (st.length) { const m = Math.min(...st); kMin = Math.min(kMin, m); kMax = Math.max(kMax, m); }
    const cur = [j.L.E, j.L.W, j.R.E, j.R.W, j.lLeg.K, j.rLeg.K, j.lLeg.A, j.rLeg.A, j.head].map((q) => ({x: q.x + g.v * t, y: q.y})); // relative to the walk
    if (pp.length === 2) cur.forEach((q, k) => { jerk = Math.max(jerk, Math.hypot(q.x - 2 * pp[1][k].x + pp[0][k].x, q.y - 2 * pp[1][k].y + pp[0][k].y)); });
    pp.push(cur); if (pp.length > 2) pp.shift();
    hy.push(p.y); if (hy.length >= 3) hipAcc = Math.max(hipAcc, Math.abs(hy[hy.length - 1] - 2 * hy[hy.length - 2] + hy[hy.length - 3]));
    prev = {l: j.lLeg.A, r: j.rLeg.A, lc, rc};
    for (const A of [j.L, j.R]) {
      boneDev = Math.max(boneDev, Math.abs(len(A.S, A.E) - DIM.upperArm), Math.abs(len(A.E, A.W) - DIM.foreArm));
      const u = {x: A.E.x - A.S.x, y: A.E.y - A.S.y}, w = {x: A.W.x - A.E.x, y: A.W.y - A.E.y};
      backEl = Math.max(backEl, -(Math.asin(Math.max(-1, Math.min(1, (u.x * w.y - u.y * w.x) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y))))) * 180) / Math.PI);
    }
  }
  return {name, maxAnkleMiss_units: +maxMiss.toFixed(2), worst, maxStanceSlip_units_per_frame: +maxSlip.toFixed(2), armBoneLengthDeviation_units: +boneDev.toFixed(2), stanceKneeFlex_deg: [+kMin.toFixed(1), +kMax.toFixed(1)], hipSecondDiff_units: +hipAcc.toFixed(2), maxBackwardElbow_deg: +backEl.toFixed(1), maxJointSecondDiff_units_per_frame2: +jerk.toFixed(1)};
};
const out = process.argv[2];
const gs: [string, Gait][] = [
  ['cafe hero', {x0: 0, v: 560, T: 0.9, ph: 0.1, arm: 19, elbow: 16, lean: 4}],
  ['cafe passer', {x0: 0, v: 520, T: 0.94, ph: 0.3, arm: 16, elbow: 20, lean: 3}],
  ['corridor 3', {x0: 0, v: 640, T: 0.8, arm: 20, elbow: 14, lean: 3}],
  ['corridor 27', {x0: 0, v: 640 / 0.95, T: 0.74, arm: 16, elbow: 22, lean: 5}],
  ['corridor 12', {x0: 0, v: 640, T: 0.78, arm: 19, elbow: 16, lean: 4}],
  ['corridor 140 crate', {x0: 0, v: 640 / 1.01, T: 0.84, lean: 6, hipY: -489, holdArms: {l: {sh: 34, el: 62, wr: -10}, r: {sh: 40, el: 58, wr: -10}}}],
];
const res = gs.map(([n, g]) => probe(n, g, 0, 4));
console.log(JSON.stringify(res));
if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));

// the lab hero (every frame of the film he is in): planted ankles on target, bone lengths constant, the resting hands
// on the knees (wrist-to-knee distance), elbow flexion never backward (forearm turned forward of the upper arm)
import {heroLab} from '../../source/src/scenes/labHero';
import {LAB_OUT} from '../../source/src/scenes/Lab';
import {CB} from '../../source/src/scenes/Cafe';
const labProbe = () => {
  let miss = 0, bone = 0, legBone = 0, knee = 0, backElbow = 0, slip = 0;
  let prev: ReturnType<typeof manJoints> | null = null;
  const frames: number[] = [];
  for (let f = 0; f < 1094; f++) if (f / 30 < LAB_OUT || f / 30 >= CB.h1) frames.push(f);
  for (const f of frames) {
    const t = f / 30;
    const h = heroLab(t);
    const j = manJoints(h.p);
    miss = Math.max(miss, Math.hypot(j.lLeg.A.x - h.p.lAx!, j.lLeg.A.y - h.p.lAy!), Math.hypot(j.rLeg.A.x - h.p.rAx!, j.rLeg.A.y - h.p.rAy!));
    for (const A of [j.L, j.R]) bone = Math.max(bone, Math.abs(len(A.S, A.E) - DIM.upperArm), Math.abs(len(A.E, A.W) - DIM.foreArm));
    for (const L of [j.lLeg, j.rLeg]) legBone = Math.max(legBone, Math.abs(len(L.hp, L.K) - DIM.thigh), Math.abs(len(L.K, L.A) - DIM.shin));
    // crouched (2 s to the raise): the near hand rests on the near knee
    if (t > 1.6 && t < 11.0) knee = Math.max(knee, len(j.L.W, j.lLeg.K));
    // backward elbow: the forearm's direction rotated the wrong way from the upper arm's, in the body's frame
    for (const A of [j.L, j.R]) {
      const u = {x: A.E.x - A.S.x, y: A.E.y - A.S.y}, w = {x: A.W.x - A.E.x, y: A.W.y - A.E.y};
      const cr = u.x * w.y - u.y * w.x; // screen (y down): forward flexion (toward his front, screen-left) gives cr > 0
      const ang = (Math.asin(Math.max(-1, Math.min(1, cr / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y))))) * 180) / Math.PI;
      backElbow = Math.max(backElbow, -ang); // > 0: the forearm turned backward of the upper arm
    }
    if (prev && Math.abs(f / 30 - (f - 1) / 30) < 0.05) {
      if (h.p.lAy === prev.lLeg.A.y) slip = Math.max(slip, len(j.lLeg.A, prev.lLeg.A) * (j.lLeg.A.y === prev.lLeg.A.y ? 1 : 0));
    }
    prev = j;
  }
  return {name: 'lab hero (all lab frames)', frames: frames.length, maxAnkleMiss_units: +miss.toFixed(2), armBoneLengthDeviation_units: +bone.toFixed(2), legBoneLengthDeviation_units: +legBone.toFixed(2), maxWristToKnee_units_while_resting: +knee.toFixed(1), maxBackwardElbow_deg: +backElbow.toFixed(1)};
};
// in-betweens: the largest second difference (units/frame^2) of the hero's joints over consecutive lab frames (a pop or
// snap between keys shows as a spike); the loop seam (last frame -> frame 0) is included
const labJerk = () => {
  const fr: number[] = [];
  for (let f = 0; f < 1094; f++) if (f / 30 < LAB_OUT || f / 30 >= CB.h1) fr.push(f);
  const seq = [...fr.filter((f) => f / 30 >= CB.h1), ...fr.filter((f) => f / 30 < LAB_OUT)];
  const P = seq.map((f) => { const j = manJoints(heroLab(f / 30).p); return {f, pts: [j.L.E, j.L.W, j.R.E, j.R.W, j.lLeg.K, j.rLeg.K, j.lLeg.A, j.rLeg.A, j.head]}; });
  let worst = {acc: 0, f: 0, joint: 0};
  const names = ['near elbow', 'near wrist', 'far elbow', 'far wrist', 'near knee', 'far knee', 'near ankle', 'far ankle', 'head'];
  for (let i = 1; i < P.length - 1; i++) {
    for (let k = 0; k < P[i].pts.length; k++) {
      const a = Math.hypot(P[i + 1].pts[k].x - 2 * P[i].pts[k].x + P[i - 1].pts[k].x, P[i + 1].pts[k].y - 2 * P[i].pts[k].y + P[i - 1].pts[k].y);
      if (a > worst.acc) worst = {acc: a, f: P[i].f, joint: k};
    }
  }
  return {maxJointSecondDiff_units_per_frame2: +worst.acc.toFixed(1), at_frame: worst.f, joint: names[worst.joint]};
};
const lab = {...labProbe(), ...labJerk()};
console.log(JSON.stringify(lab));
if (out) fs.writeFileSync(out, JSON.stringify([...res, lab], null, 1));
