// V4 rig check: for every frame of the café shots, are the arm and leg segment lengths constant, does the elbow keep its
// bend direction, and does any joint jump between frames?  Writes ../qa/v4/RIG_CHECK.json.  Usage: npx tsx scripts/check_rig4.ts
import fs from 'node:fs';
import path from 'node:path';
import {solveInterior} from '../src/v4/world/interior';
import {subjectiveW} from '../src/v4/shots/interiorShots';
import {solveExterior} from '../src/v4/world/exterior';
import {manJoints, DIM} from '../src/v4/rig/Man';
import {womanJoints} from '../src/v4/rig/Woman';
import {FPS} from '../src/v4/plan4';

type V = {x: number; y: number};
const d = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y);
const cross = (a: V, b: V, c: V) => (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
type Rec = {frame: number; who: string; limb: string; upper: number; fore: number; bend: number; elbowDeg: number};
const rows: Rec[] = [];
const prev: Record<string, V> = {};
let maxStep = {v: 0, key: '', frame: 0};
const bigSteps: {frame: number; key: string; step: number}[] = [];
const stretched: {frame: number; who: string; limb: string; ratio: number}[] = [];
const sc: Record<string, {min: number; max: number}> = {};
const signs: Record<string, Set<number>> = {};
const feed = (frame: number, who: string, J: ReturnType<typeof manJoints>, s: number) => {
  for (const [limb, A] of [['near', J.L], ['far', J.R]] as const) {
    const up = d(A.S, A.E) / (DIM.upperArm * s);
    const fo = d(A.E, A.W) / (DIM.foreArm * s);
    const key = `${who}.${limb}`;
    sc[key] = sc[key] ?? {min: 9, max: 0};
    sc[key].min = Math.min(sc[key].min, up, fo);
    sc[key].max = Math.max(sc[key].max, up, fo);
    const cr = cross(A.S, A.E, A.W);
    const el = (Math.acos(Math.max(-1, Math.min(1, ((A.S.x - A.E.x) * (A.W.x - A.E.x) + (A.S.y - A.E.y) * (A.W.y - A.E.y)) / (d(A.S, A.E) * d(A.E, A.W))))) * 180) / Math.PI;
    if (el < 150) (signs[key] = signs[key] ?? new Set()).add(Math.sign(cr));
    for (const [jn, p] of [['E', A.E], ['W', A.W]] as const) {
      const k2 = `${key}.${jn}`;
      if (prev[k2]) {
        const st = d(prev[k2], p) / s;
        // the subjective image is a deliberate cut (frames 425 and 440 start and end it)
        if (frame !== 425 && frame !== 440 && st > maxStep.v) maxStep = {v: st, key: k2, frame};
        if (frame !== 425 && frame !== 440 && st > 28) bigSteps.push({frame, key: k2, step: +st.toFixed(1)});
      }
      prev[k2] = p;
    }
    if (up > 1.001 || fo > 1.001) stretched.push({frame, who, limb, ratio: +Math.max(up, fo).toFixed(4)});
    rows.push({frame, who, limb, upper: +up.toFixed(4), fore: +fo.toFixed(4), bend: Math.sign(cr), elbowDeg: +el.toFixed(1)});
  }
  for (const [limb, L] of [['nearLeg', J.lLeg], ['farLeg', J.rLeg]] as const) {
    const th = d(L.hp, L.K) / (DIM.thigh * s);
    const sh = d(L.K, L.A) / (DIM.shin * s);
    const key = `${who}.${limb}`;
    sc[key] = sc[key] ?? {min: 9, max: 0};
    sc[key].min = Math.min(sc[key].min, th, sh);
    sc[key].max = Math.max(sc[key].max, th, sh);
  }
};
const pass = (name: string, f0: number, f1: number, fn: (t: number, f: number) => void) => {
  for (const k of Object.keys(prev)) delete prev[k];
  for (let f = f0; f <= f1; f++) fn(f / FPS, f);
  console.log(name, 'done', f0, f1);
};
pass('interior', 297, 807, (t, f) => {
  const sub = t >= 14.15 && t < 14.65;
  const S = solveInterior(t, sub ? {w: subjectiveW(t - 14.15)} : {});
  feed(f, 'woman', womanJoints(S.w.pose) as never, S.w.pose.s);
  feed(f, 'man', manJoints(S.m.pose), S.m.pose.s);
});
pass('exterior', 21, 98, (t, f) => {
  const S = solveExterior(t);
  feed(f, 'woman', womanJoints(S.wPose) as never, S.wPose.s);
  feed(f, 'man', manJoints(S.mPose), S.mPose.s);
});
const out = {
  note: 'segment length ratios are measured / rig length (1.000 = exact); a planted hand may stretch at most 4.5%',
  segmentRatios: sc,
  elbowBendSigns: Object.fromEntries(Object.entries(signs).map(([k, v]) => [k, [...v]])),
  largestJointStepPerFrame_rigUnits: {...maxStep, v: +maxStep.v.toFixed(1)},
  jointStepsOver28UnitsPerFrame: bigSteps,
  stretchedFrames: stretched.length ? {count: stretched.length, first: stretched[0], last: stretched[stretched.length - 1], worst: stretched.reduce((a, b) => (b.ratio > a.ratio ? b : a))} : null,
  frames: rows.length,
};
const outDir = path.resolve(__dirname, '../../qa/v4');
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'RIG_CHECK.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
