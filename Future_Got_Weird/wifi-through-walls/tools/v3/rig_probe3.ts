// V3 rig probe: every frame each character is on screen. For the lab hero: planted ankles on target, planted feet not
// sliding, arm and leg bones at constant length, no backward elbow, the resting hands on the knees, and the largest
// frame-to-frame joint acceleration (a pop or snap between keys shows as a spike). For the walkers (café, study): the
// same through the shared walk (art/walk.ts). usage: bundle with esbuild, run with node; writes JSON.
import * as fs from 'fs';
import {DIM, manJoints, ManPose} from '../../source/src/dc/Man';
import {walk, footAt, Gait} from '../../source/src/art/walk';
import {heroLab, END0} from '../../source/src/v3/hero3';
import {LAB_OUT} from '../../source/src/v3/Lab3';
import {cafeGait, E_OUT, H_IN} from '../../source/src/v3/Cafe3';
import {DUR} from '../../source/src/lib';

type P = {x: number; y: number};
const len = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
const backElbow = (A: {S: P; E: P; W: P}) => {
  const u = {x: A.E.x - A.S.x, y: A.E.y - A.S.y}, w = {x: A.W.x - A.E.x, y: A.W.y - A.E.y};
  return -(Math.asin(Math.max(-1, Math.min(1, (u.x * w.y - u.y * w.x) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y))))) * 180) / Math.PI;
};
const probe = (name: string, frames: number[], poseAt: (t: number) => ManPose, planted: (t: number) => [boolean, boolean]) => {
  let miss = 0, slip = 0, arm = 0, leg = 0, back = 0, acc = {v: 0, f: 0, j: ''};
  const names = ['near elbow', 'near wrist', 'far elbow', 'far wrist', 'near knee', 'far knee', 'near ankle', 'far ankle', 'head'];
  let prev: {f: number; pts: P[]; la: P; ra: P; pl: [boolean, boolean]} | null = null, prev2: P[] | null = null;
  for (const f of frames) {
    const t = f / 30;
    const p = poseAt(t);
    const j = manJoints(p);
    miss = Math.max(miss, len(j.lLeg.A, {x: p.lAx!, y: p.lAy!}), len(j.rLeg.A, {x: p.rAx!, y: p.rAy!}));
    for (const A of [j.L, j.R]) { arm = Math.max(arm, Math.abs(len(A.S, A.E) - DIM.upperArm), Math.abs(len(A.E, A.W) - DIM.foreArm)); back = Math.max(back, backElbow(A)); }
    for (const L of [j.lLeg, j.rLeg]) leg = Math.max(leg, Math.abs(len(L.hp, L.K) - DIM.thigh), Math.abs(len(L.K, L.A) - DIM.shin));
    const pl = planted(t);
    const pts = [j.L.E, j.L.W, j.R.E, j.R.W, j.lLeg.K, j.rLeg.K, j.lLeg.A, j.rLeg.A, j.head];
    if (prev && prev.f === f - 1) {
      if (pl[0] && prev.pl[0]) slip = Math.max(slip, len(j.lLeg.A, prev.la));
      if (pl[1] && prev.pl[1]) slip = Math.max(slip, len(j.rLeg.A, prev.ra));
      if (prev2) pts.forEach((q, k) => { const a = Math.hypot(q.x - 2 * prev!.pts[k].x + prev2![k].x, q.y - 2 * prev!.pts[k].y + prev2![k].y); if (a > acc.v) acc = {v: a, f, j: names[k]}; });
      prev2 = prev.pts;
    } else prev2 = null;
    prev = {f, pts, la: j.lLeg.A, ra: j.rLeg.A, pl};
  }
  return {name, frames: frames.length, maxAnkleMiss_units: +miss.toFixed(2), maxPlantedFootSlip_units_per_frame: +slip.toFixed(2), armBoneDeviation_units: +arm.toFixed(2), legBoneDeviation_units: +leg.toFixed(2), maxBackwardElbow_deg: +back.toFixed(1), maxJointAccel_units_per_frame2: +acc.v.toFixed(1), at_frame: acc.f, joint: acc.j};
};
const F = Array.from({length: 1094}, (_, i) => i);
// the lab: loop order (the ending, then frame 0 on), so the seam is measured too
const labFrames = [...F.filter((f) => f / 30 >= END0 - 0.7), ...F.filter((f) => f / 30 < LAB_OUT)];
const labPlanted = (t: number): [boolean, boolean] => {
  // a foot is planted while its ankle target is on the floor (lift 0) and was the frame before
  const a = heroLab(t).p, b = heroLab(t - 1 / 30).p;
  return [a.lAy === b.lAy && a.lAx === b.lAx, a.rAy === b.rAy && a.rAx === b.rAx];
};
const res = [probe('lab hero (all lab frames, through the loop seam)', labFrames, (t) => heroLab(t).p, labPlanted)];
const walkPlanted = (g: Gait) => (t: number): [boolean, boolean] => [footAt(g, t, 0).lift === 0 && footAt(g, t - 1 / 30, 0).lift === 0, footAt(g, t, 0.5).lift === 0 && footAt(g, t - 1 / 30, 0.5).lift === 0];
const cafeE = F.filter((f) => f / 30 >= LAB_OUT && f / 30 < E_OUT), cafeH = F.filter((f) => f / 30 >= H_IN && f / 30 < END0);
res.push(probe('café hero (E)', cafeE, (t) => walk(cafeGait(t), t), (t) => walkPlanted(cafeGait(t))(t)));
res.push(probe('café hero (H)', cafeH, (t) => walk(cafeGait(t), t), (t) => walkPlanted(cafeGait(t))(t)));
// the study walkers' gaits (Study3.tsx A and B)
const gA: Gait = {x0: 0, v: 640, T: 0.82, ph: 0.3, arm: 21, elbow: 14, lean: 3};
const gB: Gait = {x0: 0, v: 560, T: 1.06, ph: 0.65, arm: 12, elbow: 24, lean: 7};
const st = F.filter((f) => f / 30 >= E_OUT && f / 30 < H_IN);
res.push(probe('study participant A', st, (t) => walk(gA, t), walkPlanted(gA)));
res.push(probe('study participant B', st, (t) => walk(gB, t), walkPlanted(gB)));
console.log(JSON.stringify(res, null, 1));
fs.writeFileSync(process.argv[2], JSON.stringify({duration: DUR, results: res}, null, 1));
