// The hero: a miniature silver humanoid robot (≈1 cm minifigure-like figure in the real experiment; NOT a LEGO copy)
// and its melt into liquid metal.
//
// Construction. The figure is defined in "robot units" (world units, 10 u tall, x right, h up, feet base at 0,0).
// Every point of every part goes through ONE mapping M():
//   pose (skeleton angles, lean, head roll/turn)  ->  MELT lattice (h -> Y(h), x -> x*S(h), monotone cubic, so the
//   whole body collapses as one continuous fluid, feet first)  ->  VIEW (vertical foreshortening toward the feet,
//   head morphs to a circle)  ->  bob (squash-stretch)  ->  screen px.
// The SILHOUETTE of all parts (+ puddle, drips and any caller "pool" outlines in screen px) is drawn once into the
// liquid-metal goo filter (liquid.tsx): one merged, inked, lit surface. On top of it the SOLID layer (crisp chrome
// part fills, joints, panel lines) is drawn through a mask whose edge is the melt front, so the solid robot turns into
// liquid from the feet up (a wavy front, crisp cut, with a thin wet seam line on it — warm yellow when heat > 0 —
// and a warm glow just below it). The liquid mound carries a dark horizon reflection band. The eyes are drawn last
// and survive longest.
import React from 'react';
import {C, INK} from './palette';
import {uid} from '../core/ids';
import {mix} from '../core/color';
import {clamp, lerp, noise1, ss} from '../lib';
import {Box, boxOf, ENV_DEFAULT, Env, EYE, EyesAt, MetalFilter, polyPath, PoolSheen, ShapeFilter, smoothPath, V} from './liquid';

export type RobotPose = {
  lean: number; // deg, + leans to screen-right
  headTilt: number; // deg roll, + tips the top of the head to screen-right
  headTurn: number; // -1..1 face turned toward screen-left..right
  lookX: number; // -1..1 gaze, 0,0 = at the viewer
  lookY: number;
  eyeOpen: number; // 0 shut, 1 normal, 1.35 wide
  mood: number; // -1 annoyed, 0 neutral, +1 mischievous smile-squint
  glow: number; // 0..1
  lSh: number; // deg; 0 = arm hanging; + swings the hand outward/up (l = the arm on screen-left)
  lEl: number;
  rSh: number;
  rEl: number;
  lHip: number; // deg; + swings the foot outward
  rHip: number;
  lKnee: number; // deg; + bends the shin back in under the body
  rKnee: number;
  bob: number; // squash-stretch -0.15..0.15 (+ = stretch taller)
  reachX?: number; // -1..1 extends the screen-left / screen-right arm horizontally (press hand on a bar)
};

export const POSE_IDLE: RobotPose = {lean: 0, headTilt: 0, headTurn: 0, lookX: 0, lookY: 0, eyeOpen: 1, mood: 0, glow: 1, lSh: 9, lEl: 6, rSh: 9, rEl: 6, lHip: 3, rHip: 3, lKnee: 0, rKnee: 0, bob: 0};
export const POSE_SURPRISED: RobotPose = {...POSE_IDLE, eyeOpen: 1.35, lookY: -0.1, lSh: 34, lEl: 40, rSh: 34, rEl: 40, bob: 0.06, headTilt: 0, lHip: 5, rHip: 5};
export const POSE_ANNOYED: RobotPose = {...POSE_IDLE, mood: -1, eyeOpen: 0.95, headTilt: -7, lean: -2, lookX: 0.15, lSh: 6, lEl: 4, rSh: 6, rEl: 4, bob: -0.03};
export const POSE_SMUG: RobotPose = {...POSE_IDLE, mood: 1, eyeOpen: 1, headTilt: 8, headTurn: 0.18, lookX: 0.2, lean: 3, lSh: 14, lEl: 16, rSh: 22, rEl: 38, lHip: 6, rHip: 2};
export const POSE_REACH: RobotPose = {...POSE_IDLE, reachX: 1, lean: 5, lookX: 0.6, headTurn: 0.25, lSh: 12, lEl: 10};

const KEYS: (keyof RobotPose)[] = ['lean', 'headTilt', 'headTurn', 'lookX', 'lookY', 'eyeOpen', 'mood', 'glow', 'lSh', 'lEl', 'rSh', 'rEl', 'lHip', 'rHip', 'lKnee', 'rKnee', 'bob', 'reachX'];
export const mixPose = (a: RobotPose, b: RobotPose, u: number): RobotPose => {
  const o = {...a} as Record<string, number>;
  for (const k of KEYS) o[k] = lerp((a[k] as number) ?? 0, (b[k] as number) ?? 0, u);
  return o as unknown as RobotPose;
};

// ---------------------------------------------------------------------------------------------------------------
// design constants (robot units)
const D = {
  headC: 8.4, headRx: 1.95, headRy: 1.6, // top at 10.0
  neckH0: 6.4, neckH1: 6.95, neckW: 0.42,
  torsoTop: 6.62, torsoBot: 3.9, torsoTW: 1.55, torsoBW: 1.12,
  pelvisC: 3.55, pelvisW: 1.1, pelvisH: 0.4,
  hipX: 0.62, hipH: 3.3, thigh: 1.45, shin: 1.25, footH: 0.62, footW: 0.7,
  shX: 1.7, shH: 6.05, upper: 1.3, fore: 1.12, armR: 0.35,
  eyeH: 8.2, earX: 1.9, earH: 8.3,
};

// monotone cubic interpolation (Fritsch–Carlson): smooth AND without overshoot or stalls at the knots
const mono = (xs: number[], ys: number[], x: number) => {
  const n = xs.length;
  if (x <= xs[0]) return ys[0] + (x - xs[0]) * ((ys[1] - ys[0]) / (xs[1] - xs[0]));
  if (x >= xs[n - 1]) return ys[n - 1] + (x - xs[n - 1]) * ((ys[n - 1] - ys[n - 2]) / (xs[n - 1] - xs[n - 2]));
  const d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  let i = 0;
  while (i < n - 2 && x > xs[i + 1]) i++;
  const h = xs[i + 1] - xs[i], u = (x - xs[i]) / h;
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
};
const curve = (m: number, ks: [number, number][]) => mono(ks.map((k) => k[0]), ks.map((k) => k[1]), clamp(m));

const rotP = (p: V, o: V, deg: number): V => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const dx = p.x - o.x, dy = p.y - o.y;
  return {x: o.x + dx * c - dy * s, y: o.y + dx * s + dy * c};
};
// NB in robot units the point type V is {x, y=h (up)}.

const superE = (cx: number, cy: number, rx: number, ryT: number, ryB: number, nT: number, nB: number, N: number, wAt?: (h: number) => number): V[] => {
  const out: V[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const top = s >= 0;
    const n = top ? nT : nB;
    const ex = Math.sign(c) * Math.pow(Math.abs(c), 2 / n), ey = Math.sign(s) * Math.pow(Math.abs(s), 2 / n);
    const h = cy + ey * (top ? ryT : ryB);
    out.push({x: cx + ex * (wAt ? wAt(h) : rx), y: h});
  }
  return out;
};
const capPts = (a: V, b: V, ra: number, rb: number, N = 14): V[] => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.max(1e-4, Math.hypot(dx, dy));
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const s = clamp((ra - rb) / L, -0.95, 0.95), c = Math.sqrt(1 - s * s);
  const out: V[] = [];
  // arc around b (from +n side to -n side, through the far end)
  const a0 = Math.atan2(ny * c + uy * s, nx * c + ux * s);
  const a1 = Math.atan2(-ny * c + uy * s, -nx * c + ux * s);
  let span = a1 - a0;
  // go the way that passes through +u (the far side of b)
  const mid = Math.atan2(uy, ux);
  const norm = (x: number) => Math.atan2(Math.sin(x), Math.cos(x));
  if (Math.abs(norm(a0 + span / 2 - mid)) > Math.PI / 2) span = span > 0 ? span - Math.PI * 2 : span + Math.PI * 2;
  for (let i = 0; i <= N; i++) {
    const t = a0 + (span * i) / N;
    out.push({x: b.x + Math.cos(t) * rb, y: b.y + Math.sin(t) * rb});
  }
  const b0 = a1, b1 = a0;
  let span2 = b1 - b0;
  const mid2 = Math.atan2(-uy, -ux);
  if (Math.abs(norm(b0 + span2 / 2 - mid2)) > Math.PI / 2) span2 = span2 > 0 ? span2 - Math.PI * 2 : span2 + Math.PI * 2;
  for (let i = 0; i <= N; i++) {
    const t = b0 + (span2 * i) / N;
    out.push({x: a.x + Math.cos(t) * ra, y: a.y + Math.sin(t) * ra});
  }
  return out;
};
const circPts = (c: V, rx: number, ry: number, N = 20, rot = 0): V[] => {
  const out: V[] = [];
  const cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push({x: c.x + x * cr - y * sr, y: c.y + x * sr + y * cr});
  }
  return out;
};

// ---------------------------------------------------------------------------------------------------------------
// the rig: pose + melt + view -> mapping and parts (robot units)

type PartKind = 'cap' | 'ball' | 'joint' | 'head' | 'torso' | 'pelvis' | 'foot' | 'hand' | 'neck' | 'ear' | 'web';
type Part = {kind: PartKind; pts: V[]; a?: V; b?: V; r?: number; c?: V; head?: boolean; side?: number; keep?: boolean};

type Rig = {
  parts: Part[]; // draw order, back to front
  M: (p: V, head?: boolean, keep?: V) => V; // robot units -> mapped robot units (x, h up)
  headC: V; // posed head centre (robot units, before mapping)
  eyes: {l: V; r: V; wl: number; wr: number};
  m: number; u: number; // melt, view
  pw: number; ph: number; // puddle half width / dome height
  front: number; // melt front (robot units, before mapping)
  eyeSx: number; eyeSy: number;
  torsoHW: (h: number) => number;
  armHands: V[];
  P: RobotPose;
  phase: {ml: number; mt: number; mh: number; mf: number};
  up: (p: V) => V; // rest-pose upper-body point -> posed
  headPt: (p: V) => V; // rest-pose head point -> posed
};

const rig = (pose: RobotPose, melt: number, view: number): Rig => {
  const m = clamp(melt);
  const u = ss(clamp(view), 0, 1);
  const ml = ss(m, 0.0, 0.3), mt = ss(m, 0.2, 0.62), mh = ss(m, 0.5, 0.86), mf = ss(m, 0.8, 1);
  // pose relaxes as the body loses its structure
  const relaxA = ss(m, 0.16, 0.48), relaxB = ss(m, 0.25, 0.7), relaxH = ss(m, 0.5, 0.85);
  const rx0 = pose.reachX ?? 0;
  const P: RobotPose = {
    ...pose,
    lean: pose.lean * (1 - relaxB),
    headTilt: pose.headTilt * (1 - relaxH),
    headTurn: pose.headTurn * (1 - relaxH),
    bob: pose.bob * (1 - relaxB),
    lSh: lerp(rx0 < 0 ? lerp(pose.lSh, 92, -rx0) : pose.lSh, -4, relaxA),
    lEl: lerp(rx0 < 0 ? lerp(pose.lEl, 2, -rx0) : pose.lEl, 0, relaxA),
    rSh: lerp(rx0 > 0 ? lerp(pose.rSh, 92, rx0) : pose.rSh, -4, relaxA),
    rEl: lerp(rx0 > 0 ? lerp(pose.rEl, 2, rx0) : pose.rEl, 0, relaxA),
    lHip: pose.lHip * (1 - ml), rHip: pose.rHip * (1 - ml), lKnee: pose.lKnee * (1 - ml), rKnee: pose.rKnee * (1 - ml),
  };

  // ---- legs (planted): solve so the lower foot rests on h = 0
  const legK = 1 + 0.95 * ml;
  const hipX = D.hipX * (1 - 0.32 * ml);
  const legs = [-1, 1].map((side) => {
    const hipA = side < 0 ? P.lHip : P.rHip, kneeA = side < 0 ? P.lKnee : P.rKnee;
    const rad = (d: number) => (d * Math.PI) / 180;
    const hip = {x: side * hipX, y: D.hipH};
    const knee = {x: hip.x + side * Math.sin(rad(hipA)) * D.thigh, y: hip.y - Math.cos(rad(hipA)) * D.thigh};
    const sA = hipA - kneeA;
    const ankle = {x: knee.x + side * Math.sin(rad(sA)) * D.shin, y: knee.y - Math.cos(rad(sA)) * D.shin};
    return {side, hip, knee, ankle};
  });
  const lift = Math.min(...legs.map((l) => l.ankle.y)) - D.footH; // 0 in the rest pose
  for (const l of legs) for (const k of ['hip', 'knee', 'ankle'] as const) l[k] = {x: l[k].x, y: l[k].y - lift};
  const pelvisC = {x: 0, y: D.pelvisC - lift};
  const up = (p: V) => rotP({x: p.x, y: p.y - lift}, pelvisC, -P.lean); // upper body: lean about the pelvis
  // reaching leans the body a little toward the reach
  // ---- head
  const neckPivot = {x: 0, y: 6.75};
  const headPt = (p: V) => up(rotP(p, neckPivot, -P.headTilt));
  const headC = headPt({x: 0, y: D.headC});

  // ---- melt lattice (in posed robot units: lift is tiny, so the knots use the rest heights)
  const Lh = curve(m, [[0, 3.95], [0.1, 3.3], [0.2, 2.25], [0.3, 1.45], [0.45, 1.0], [0.65, 0.78], [0.85, 0.62], [1, 0.5]]);
  const Th = curve(m, [[0, 2.67], [0.2, 2.62], [0.32, 2.25], [0.45, 1.6], [0.6, 0.9], [0.8, 0.38], [1, 0.16]]);
  const Nh = 0.33 * (1 - ss(m, 0.22, 0.55));
  const Hh = curve(m, [[0, 3.05], [0.45, 3.0], [0.58, 2.7], [0.7, 2.05], [0.8, 1.5], [0.9, 1.05], [1, 0.72]]);
  const H0 = [0, 1.85, 3.95, 6.62, 6.95, 8.4, 10];
  const legLow = 1.85 / 3.95;
  const Yk = [0, Lh * lerp(legLow, 0.3, ml), Lh, Lh + Th, Lh + Th + Nh, Lh + Th + Nh + Hh * (1.45 / 3.05), Lh + Th + Nh + Hh];
  const Sk = [
    1 + 1.25 * ml,
    1 + 0.32 * ml,
    1 + 0.12 * ml + 0.62 * mt,
    1 - 0.12 * mt + 0.3 * mh,
    1 - 0.05 * mt + 0.3 * mh,
    1 + 0.34 * mh + 0.28 * mf,
    1 + 0.12 * mh + 0.28 * mf,
  ];
  const Y = (h: number) => mono(H0, Yk, h);
  const S = (h: number) => mono(H0, Sk, h);
  const cv = Math.cos((u * Math.PI) / 2);
  const kh = lerp(1, (0.97 * D.headRx) / D.headRy, u);
  const hcY = Y(headC.y);
  const bob = P.bob;
  const M = (p: V, head = false, keep?: V): V => {
    const x1 = p.x * S(p.y);
    const h1 = Y(p.y);
    let h2 = head ? hcY * cv + (h1 - hcY) * kh : h1 * cv;
    if (keep && !head) {
      // round parts (shoulder balls, hands) keep their shape when seen from above; only their centre is foreshortened
      const kc = Y(keep.y);
      h2 = lerp(h2, kc * cv + (h1 - kc), u);
    }
    const x2 = head ? x1 : x1 * (1 + 0.16 * u);
    return {x: x2 * (1 - 0.5 * bob), y: h2 * (1 + bob)};
  };

  // ---- parts (robot units, posed)
  const parts: Part[] = [];
  // legs
  for (const l of legs) {
    const fw = D.footW * (1 + 0.45 * ml);
    const fc = {x: l.ankle.x + l.side * 0.12 * (1 + ml), y: l.ankle.y - D.footH};
    const foot: V[] = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI;
      foot.push({x: fc.x + Math.cos(a) * fw, y: fc.y + D.footH * (1 - 0.5 * ml) * Math.pow(Math.sin(a), 0.75)});
    }
    for (let i = 1; i < 6; i++) foot.push({x: fc.x - fw + (2 * fw * i) / 6, y: fc.y});
    parts.push({kind: 'cap', pts: capPts(l.hip, l.knee, 0.5 * legK, 0.45 * legK), a: l.hip, b: l.knee, r: 0.48 * legK, side: l.side});
    parts.push({kind: 'cap', pts: capPts(l.knee, l.ankle, 0.43 * legK, 0.4 * legK * (1 + 0.6 * ml)), a: l.knee, b: l.ankle, r: 0.42 * legK, side: l.side});
    parts.push({kind: 'joint', pts: circPts(l.knee, 0.4 * legK, 0.36 * legK, 18), c: l.knee, r: 0.4 * legK});
    parts.push({kind: 'foot', pts: foot, c: {x: fc.x, y: fc.y + 0.25}, r: fw, side: l.side});
  }
  // pelvis
  parts.push({kind: 'pelvis', pts: superE(0, D.pelvisC, D.pelvisW, D.pelvisH, D.pelvisH, 4, 4, 40).map((p) => ({x: p.x, y: p.y - lift})), c: pelvisC, r: D.pelvisW});
  // neck
  parts.push({kind: 'neck', pts: superE(0, (D.neckH0 + D.neckH1) / 2, D.neckW, (D.neckH1 - D.neckH0) / 2, (D.neckH1 - D.neckH0) / 2, 6, 6, 24).map(up), c: up({x: 0, y: 6.7}), r: D.neckW});
  // torso: a rounded trapezoid
  const torsoHW = (h: number) => lerp(D.torsoBW, D.torsoTW, clamp((h - D.torsoBot) / (D.torsoTop - D.torsoBot)));
  const tMid = (D.torsoTop + D.torsoBot) / 2, tH = (D.torsoTop - D.torsoBot) / 2;
  parts.push({kind: 'torso', pts: superE(0, tMid, 1, tH, tH, 4.2, 5, 60, torsoHW).map(up), c: up({x: 0, y: tMid}), r: D.torsoTW});
  // arms
  const armK = 1 + 0.75 * mt;
  const hands: V[] = [];
  for (const side of [-1, 1]) {
    const a = (side < 0 ? P.lSh : P.rSh) * (1 - 0.85 * u), el = (side < 0 ? P.lEl : P.rEl) * (1 - 0.85 * u);
    const rad = (d: number) => (d * Math.PI) / 180;
    const dir = (d: number) => ({x: side * Math.sin(rad(d)), y: -Math.cos(rad(d))});
    const sh = {x: side * D.shX * (1 - 0.12 * mt), y: D.shH};
    const k = 1 - 0.45 * mt;
    const d1 = dir(a), d2 = dir(a + el);
    const elb = {x: sh.x + d1.x * D.upper * k, y: sh.y + d1.y * D.upper * k};
    const wr = {x: elb.x + d2.x * D.fore * k, y: elb.y + d2.y * D.fore * k};
    const hc = {x: wr.x + d2.x * 0.3, y: wr.y + d2.y * 0.3};
    const [S0, E0, W0, H0p] = [sh, elb, wr, hc].map(up);
    hands.push(H0p);
    // melt: a web between the arm and the torso side, so the drooping arm fuses into the body (goo only)
    const fuse = ss(m, 0.2, 0.42);
    if (fuse > 0.01) {
      const side0 = up({x: side * torsoHW(5.9) * 0.85, y: 5.9});
      const side1 = up({x: side * torsoHW(4.1) * 0.85, y: Math.max(D.torsoBot, H0p.y)});
      const k2 = (q: V, base: V) => ({x: lerp(base.x, q.x, fuse), y: lerp(base.y, q.y, fuse)});
      parts.push({kind: 'web', pts: [side0, k2(S0, side0), k2(E0, {x: lerp(side0.x, side1.x, 0.5), y: E0.y}), k2(H0p, side1), side1], side});
    }
    const ang = Math.atan2(W0.y - E0.y, W0.x - E0.x);
    parts.push({kind: 'cap', pts: capPts(S0, E0, D.armR * armK, 0.33 * armK), a: S0, b: E0, r: 0.34 * armK, side});
    parts.push({kind: 'cap', pts: capPts(E0, W0, 0.32 * armK, 0.3 * armK), a: E0, b: W0, r: 0.31 * armK, side});
    parts.push({kind: 'joint', pts: circPts(E0, 0.33 * armK, 0.33 * armK, 16), c: E0, r: 0.33 * armK});
    // mitten hand + thumb
    const hr = 0.45 * (1 + 0.4 * mt);
    const nIn = {x: -Math.sin(ang) * -side, y: Math.cos(ang) * -side};
    const th = {x: H0p.x + nIn.x * 0.36 - Math.cos(ang) * 0.12, y: H0p.y + nIn.y * 0.36 - Math.sin(ang) * 0.12};
    parts.push({kind: 'hand', pts: circPts(H0p, hr * 1.12, hr * 0.92, 22, ang), c: H0p, r: hr, keep: true});
    parts.push({kind: 'hand', pts: circPts(th, 0.19 * (1 + 0.4 * mt), 0.19 * (1 + 0.4 * mt), 14), c: th, r: 0.19});
    parts.push({kind: 'ball', pts: circPts(S0, 0.47 * (1 + 0.3 * mt), 0.47 * (1 + 0.3 * mt), 20), c: S0, r: 0.47, keep: true});
  }
  // head (+ ear discs)
  for (const side of [-1, 1]) {
    // head turn: the ears slide opposite the face; the ear on the side the face turns toward tucks behind the head
    const tn = clamp(P.headTurn, -1, 1);
    const kx = clamp(1 - 0.6 * side * tn, 0.45, 1.2);
    const c = headPt({x: side * D.earX * (1 - 0.12 * u) - tn * 0.3, y: D.earH});
    parts.push({kind: 'ear', pts: circPts(c, 0.3 * (1 - 0.5 * u) * kx, 0.38 * (1 - 0.3 * u), 18), c, r: 0.34, head: true, side});
  }
  const rnd = Math.max(u, mh);
  parts.push({kind: 'head', pts: superE(0, D.headC, D.headRx, D.headRy, D.headRy, lerp(2.35, 2.05, rnd), lerp(3.1, 2.1, rnd), 72).map(headPt), c: headC, r: D.headRx, head: true});

  // ---- eyes (robot units, posed; mapped later)
  const turn = clamp(P.headTurn, -1, 1);
  const sep = EYE.sep * (1 - 0.12 * Math.abs(turn));
  const eh = D.eyeH - 0.05 * u;
  const eyeL = headPt({x: -sep + turn * 0.55, y: eh}), eyeR = headPt({x: sep + turn * 0.55, y: eh});
  const wl = 1 - 0.3 * Math.max(0, -turn), wr = 1 - 0.3 * Math.max(0, turn);
  const dY = (Y(D.eyeH + 0.05) - Y(D.eyeH - 0.05)) / 0.1;
  const eyeSy = clamp(dY * lerp(1, kh, 1) / 1, 0.5, 1);
  const eyeSx = clamp(S(D.eyeH), 1, 1.22);

  // puddle
  const pw = curve(m, [[0, 0.0], [0.04, 1.35], [0.15, 2.0], [0.3, 2.65], [0.5, 3.4], [0.75, 4.35], [1, 5.2]]);
  const ph = curve(m, [[0, 0], [0.05, 0.22], [0.3, 0.42], [0.6, 0.55], [1, 0.6]]);
  const front = curve(m, [[0, -0.9], [0.05, 0.35], [0.28, 3.95], [0.5, 6.75], [0.68, 10.7]]);
  return {parts, M, headC, eyes: {l: eyeL, r: eyeR, wl, wr}, m, u, pw, ph, front, eyeSx, eyeSy, torsoHW: (h) => torsoHW(h) * 1, armHands: hands, P, phase: {ml, mt, mh, mf}, up, headPt};
};

// ---------------------------------------------------------------------------------------------------------------
// screen helpers

const toScreen = (x: number, y: number, s: number) => (p: V): V => ({x: x + p.x * s, y: y - p.y * s});

export const robotHeadScreen = (x: number, y: number, s: number, pose: RobotPose, melt = 0, view = 0): {cx: number; cy: number; r: number} => {
  const R = rig(pose, melt, view);
  const sc = toScreen(x, y, s);
  const c = sc(R.M(R.headC, true));
  // horizontal radius of the (possibly melted) head
  const e = sc(R.M({x: R.headC.x + D.headRx, y: R.headC.y}, true));
  return {cx: c.x, cy: c.y, r: Math.abs(e.x - c.x)};
};

export const robotEyeScreen = (x: number, y: number, s: number, pose: RobotPose, melt = 0, view = 0): {l: V; r: V} => {
  const R = rig(pose, melt, view);
  const sc = toScreen(x, y, s);
  return {l: sc(R.M(R.eyes.l, true)), r: sc(R.M(R.eyes.r, true))};
};

/** the two mitten-hand centres on screen (l = screen-left arm), e.g. to put the reaching hand on a bar */
export const robotHandScreen = (x: number, y: number, s: number, pose: RobotPose, melt = 0, view = 0): {l: V; r: V} => {
  const R = rig(pose, melt, view);
  const sc = toScreen(x, y, s);
  const [l, r] = R.armHands;
  return {l: sc(R.M(l, false, l)), r: sc(R.M(r, false, r))};
};

// ---------------------------------------------------------------------------------------------------------------
// solid chrome rendering helpers (screen px)

const LIGHT = {x: -0.62, y: -0.78};
const f1 = (n: number) => n.toFixed(1);

const CapFill: React.FC<{a: V; b: V; r: number; d: string; dark?: boolean}> = ({a, b, r, d, dark}) => {
  const id = uid('rbc');
  const ax = {x: b.x - a.x, y: b.y - a.y};
  const L = Math.hypot(ax.x, ax.y) || 1;
  let n = {x: -ax.y / L, y: ax.x / L};
  if (n.x * LIGHT.x + n.y * LIGHT.y < 0) n = {x: -n.x, y: -n.y};
  const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
  const p0 = {x: mid.x + n.x * r, y: mid.y + n.y * r}, p1 = {x: mid.x - n.x * r, y: mid.y - n.y * r};
  const base = dark ? C.silverMid : C.silver;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(p0.x)} y1={f1(p0.y)} x2={f1(p1.x)} y2={f1(p1.y)}>
          <stop offset="0" stopColor={dark ? C.silver : C.chrome} />
          <stop offset="0.2" stopColor={dark ? C.chrome : C.silverLit} />
          <stop offset="0.45" stopColor={base} />
          <stop offset="0.64" stopColor={C.silverMid} />
          <stop offset="0.72" stopColor={C.silverDeep} />
          <stop offset="0.8" stopColor={C.silverDark} />
          <stop offset="1" stopColor={C.silverMid} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      {L > r * 1.2 && (
        <path
          d={`M${f1(a.x + n.x * r * 0.42 + (ax.x / L) * r * 0.2)},${f1(a.y + n.y * r * 0.42 + (ax.y / L) * r * 0.2)} L${f1(b.x + n.x * r * 0.42 - (ax.x / L) * r * 0.25)},${f1(b.y + n.y * r * 0.42 - (ax.y / L) * r * 0.25)}`}
          stroke="#FFFFFF"
          strokeWidth={Math.max(1, r * 0.2)}
          strokeLinecap="round"
          opacity={0.9}
        />
      )}
    </g>
  );
};

const BallFill: React.FC<{c: V; r: number; d: string; base: string; spec?: number}> = ({c, r, d, base, spec = 0.85}) => {
  const id = uid('rbb');
  const f = {x: c.x + LIGHT.x * r * 0.45, y: c.y + LIGHT.y * r * 0.45};
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f1(c.x)} cy={f1(c.y)} r={f1(r * 1.05)} fx={f1(f.x)} fy={f1(f.y)}>
          <stop offset="0" stopColor={mix(base, '#FFFFFF', 0.75)} />
          <stop offset="0.35" stopColor={mix(base, '#FFFFFF', 0.25)} />
          <stop offset="0.7" stopColor={base} />
          <stop offset="0.86" stopColor={mix(base, C.silverDeep, 0.7)} />
          <stop offset="1" stopColor={mix(base, C.silverDark, 0.6)} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      {spec > 0 && <ellipse cx={f1(c.x + LIGHT.x * r * 0.42)} cy={f1(c.y + LIGHT.y * r * 0.42)} rx={f1(r * 0.24)} ry={f1(r * 0.14)} transform={`rotate(-40 ${f1(c.x + LIGHT.x * r * 0.42)} ${f1(c.y + LIGHT.y * r * 0.42)})`} fill="#FFFFFF" opacity={spec} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------

export const Robot: React.FC<{
  x: number;
  y: number;
  s: number;
  t: number;
  pose: RobotPose;
  melt?: number;
  heat?: number;
  view?: number;
  env?: Env;
  pool?: V[][];
  eyesOnMelt?: number;
  opacity?: number;
}> = ({x, y, s, t, pose, melt = 0, heat = 0, view = 0, env = ENV_DEFAULT, pool = [], eyesOnMelt = 0.4, opacity = 1}) => {
  if (opacity <= 0.003) return null;
  const R = rig(pose, melt, view);
  const {m, u, M} = R;
  const sc = toScreen(x, y, s);
  const SP = (p: V, head = false, keep?: V) => sc(M(p, head, keep));
  const wobA = 0.09 * Math.sin(Math.PI * clamp(m * 1.15)) * (m > 0 ? 1 : 0);
  const SPw = (p: V, head = false, keep?: V) => {
    const q = M(p, head, keep);
    if (wobA > 0) q.x += wobA * noise1(q.y * 1.1 + t * 1.6, 7) * (0.4 + Math.min(1, Math.abs(q.x) * 0.4));
    return sc(q);
  };

  // ---- silhouette shapes (screen px)
  const gooParts: V[][] = R.parts.map((p) => p.pts.map((q) => SPw(q, p.head, p.keep ? p.c : undefined)));
  // puddle (floor ellipse + low dome), in mapped units
  const extra: V[][] = [];
  if (R.pw > 0.02) {
    const cv = Math.cos((u * Math.PI) / 2);
    const pr = R.pw;
    const ry = pr * lerp(0.17, 0.97, u);
    const ring: V[] = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * Math.PI * 2;
      const w = 1 + 0.05 * Math.sin(2 * a + t * 0.9 + 1) + 0.035 * Math.sin(3 * a - t * 1.3) + 0.025 * Math.sin(5 * a + t * 1.7);
      ring.push(sc({x: Math.cos(a) * pr * w, y: Math.sin(a) * ry * w * (1 - 0.5 * bobOf(R))}));
    }
    extra.push(ring);
    if (cv > 0.05) {
      const dome: V[] = [];
      const dw = pr * 0.9;
      for (let i = 0; i <= 24; i++) {
        const xx = -dw + (2 * dw * i) / 24;
        const k = 1 - (xx / dw) ** 2;
        dome.push(sc({x: xx, y: R.ph * Math.pow(Math.max(0, k), 0.55) * cv * (1 + 0.04 * Math.sin(xx * 2 + t * 2))}));
      }
      dome.push(sc({x: dw, y: -0.05}), sc({x: -dw, y: -0.05}));
      extra.push(dome);
    }
  }
  // drips: torso sides and under the hands (silhouette bumps that run down into the puddle)
  const drips: {a: V; b: V; ra: number; rb: number}[] = [];
  const {mt, mh} = R.phase;
  const dripDefs: {side: number; h: number; m0: number; w: number; head?: boolean}[] = [
    {side: -1, h: 5.4, m0: 0.24, w: 1},
    {side: 1, h: 5.0, m0: 0.29, w: 0.85},
    {side: 1, h: 6.1, m0: 0.36, w: 0.7},
    {side: -1, h: 6.3, m0: 0.42, w: 0.75},
    {side: -1, h: 7.4, m0: 0.58, w: 0.9, head: true},
    {side: 1, h: 7.7, m0: 0.62, w: 0.8, head: true},
  ];
  const puddleTop = sc(M({x: 0, y: 0})).y - R.ph * s * 0.6;
  for (const dd of dripDefs) {
    const g = ss(m, dd.m0, dd.m0 + 0.22) * (1 - ss(m, 0.86, 1));
    if (g <= 0.01) continue;
    const hw = dd.head ? D.headRx * 0.82 : R.torsoHW(dd.h);
    const a = SP({x: dd.side * (hw - 0.1), y: dd.h}, dd.head);
    const end = {x: a.x + dd.side * s * 0.25, y: Math.max(a.y, puddleTop)};
    const b = {x: lerp(a.x, end.x, g), y: lerp(a.y, end.y, g)};
    drips.push({a, b, ra: 0.26 * s * dd.w, rb: (0.26 + 0.14 * g) * s * dd.w});
  }
  const dripPts = drips.map((d) => capPts(d.a, d.b, d.ra, d.rb, 8));

  const allSets = [...gooParts, ...extra, ...dripPts, ...pool];
  const b0 = boxOf(allSets);
  const goo = s * (0.05 + 0.2 * ss(m, 0.02, 0.45));
  const round = s * (0.24 + 0.22 * ss(m, 0.0, 0.6));
  const pad = goo * 3 + 8;
  const box: Box = {x0: b0.x0 - pad, y0: b0.y0 - pad, x1: b0.x1 + pad, y1: b0.y1 + pad};
  const ids = {f: uid('rbF'), s: uid('rbS'), m: uid('rbM'), fm: uid('rbFM'), hg: uid('rbHG'), tg: uid('rbTG'), sh: uid('rbSH'), hz: uid('rbHZ')};
  const white = (
    <>
      {gooParts.map((p, i) => <path key={'p' + i} d={polyPath(p)} fill="#FFFFFF" />)}
      {extra.map((p, i) => <path key={'e' + i} d={smoothPath(p)} fill="#FFFFFF" />)}
      {dripPts.map((p, i) => <path key={'d' + i} d={polyPath(p)} fill="#FFFFFF" />)}
      {pool.filter((p) => p.length > 2).map((p, i) => <path key={'q' + i} d={smoothPath(p)} fill="#FFFFFF" />)}
    </>
  );

  // ---- solid layer visibility (front sweeps upward)
  const solidOn = m < 0.72;
  // the melt front: a gently wavy line (robot units -> screen), so the chrome dissolves into the liquid organically
  // instead of along a ruler-straight crossfade; the cut is crisp (no ghosted solid parts over the liquid) and the
  // seam line drawn on it hides the edge
  const frontPts: V[] = [];
  for (let i = 0; i <= 40; i++) {
    const xx = -7 + (14 * i) / 40;
    const wv = 0.12 * Math.sin(2.1 * xx + t * 2.1 + 0.6) + 0.05 * Math.sin(3.7 * xx - t * 2.7 + 1.9);
    frontPts.push(SP({x: xx, y: R.front + wv}));
  }
  const frontMaskD = `M${f1(box.x0)},${f1(box.y0)}L${f1(box.x1)},${f1(box.y0)}L${f1(box.x1)},${f1(frontPts[40].y)}` + [...frontPts].reverse().map((q) => `L${f1(q.x)},${f1(q.y)}`).join('') + `L${f1(box.x0)},${f1(frontPts[0].y)}Z`;
  const frontLineD = openSmooth(frontPts);
  const seamOn = ss(m, 0.03, 0.08) * (1 - ss(m, 0.6, 0.7));
  const sheenOn = pool.length > 0 || R.pw > 1.5;
  const base = sc({x: 0, y: 0});
  // horizon reflection on the liquid mound (mapped units: between the puddle and the lower of melt front / head top)
  const mTop = Math.min(M({x: 0, y: R.front}).y, M({x: 0, y: 10}, true).y);
  const hzOn = ss(m, 0.06, 0.2) * ss(mTop, 0.9, 1.6) * (1 - ss(m, 0.9, 1)) * Math.cos((u * Math.PI) / 2);
  const hzH = 0.36 * mTop, hzW = 0.16 * mTop;
  // spans the robot's own mound only (never the caller's pools / streams), tapering to points at the ends
  const hzR = Math.max(2.2, R.pw * 1.02);
  const hzPts = (dy: number) => {
    const out: V[] = [];
    for (let i = 0; i <= 24; i++) {
      const xx = -hzR + (2 * hzR * i) / 24;
      const taper = Math.sqrt(Math.max(0, 1 - (xx / hzR) ** 2));
      out.push(sc({x: xx, y: hzH + dy * taper + 0.06 * Math.sin(1.7 * xx + t * 1.3) - 0.012 * xx * xx}));
    }
    return out;
  };
  const hzTop = hzPts(hzW), hzBot = hzPts(-hzW);
  const hzBandD = openSmooth(hzTop) + [...hzBot].reverse().map((q) => `L${f1(q.x)},${f1(q.y)}`).join('') + 'Z';
  const hzLineD = openSmooth(hzPts(-hzW * 1.25).slice(3, 22));
  const hzA = sc({x: 0, y: hzH + hzW}), hzB = sc({x: 0, y: hzH - hzW});
  // ---- eyes
  const eyesVisA = 0.8 + 0.25 * clamp(eyesOnMelt);
  const eyeVis = 1 - ss(m, eyesVisA, eyesVisA + 0.1);
  const el = SP(R.eyes.l, true), er = SP(R.eyes.r, true);

  const tint = env.tintAmt ?? 0;
  const heatOn = clamp(heat) * ss(m, 0.0, 0.04) * (1 - ss(m, 0.55, 0.75));
  const hy = SP({x: 0, y: R.front}).y;
  // shadow under the figure
  const shR = Math.max(2.3, R.pw * 1.05) * s;
  return (
    <g opacity={opacity}>
      <defs>
        <MetalFilter id={ids.f} box={box} o={{goo, round, env}} />
        <ShapeFilter id={ids.s} box={box} goo={goo} />
        <mask id={ids.m} maskUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)}>
          <g filter={`url(#${ids.s})`}>{white}</g>
        </mask>
        <mask id={ids.fm} maskUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)}>
          <path d={frontMaskD} fill="#FFFFFF" />
        </mask>
        {/* heat: a warm glow in the freshly melted metal just below the front (normal blend: a clean warm tint,
            never a washed-out beige) */}
        <linearGradient id={ids.hg} gradientUnits="userSpaceOnUse" x1="0" y1={f1(hy - 0.35 * s)} x2="0" y2={f1(hy + 0.95 * s)}>
          <stop offset="0" stopColor={C.heat} stopOpacity={0} />
          <stop offset="0.24" stopColor={C.heat} stopOpacity={0.55} />
          <stop offset="0.55" stopColor={C.heatDeep} stopOpacity={0.18} />
          <stop offset="1" stopColor={C.heatDeep} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={ids.tg} gradientUnits="userSpaceOnUse" x1={f1(box.x1)} y1={f1(box.y0)} x2={f1(box.x0)} y2={f1(box.y1)}>
          <stop offset="0" stopColor={env.tint ?? C.red} stopOpacity={0.75} />
          <stop offset="0.55" stopColor={env.tint ?? C.red} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={ids.hz} gradientUnits="userSpaceOnUse" x1="0" y1={f1(hzA.y)} x2="0" y2={f1(hzB.y)}>
          <stop offset="0" stopColor={env.bottom} stopOpacity={0} />
          <stop offset="0.45" stopColor={env.bottom} stopOpacity={0.42} />
          <stop offset="0.8" stopColor={env.bottom} stopOpacity={0.3} />
          <stop offset="1" stopColor={env.bottom} stopOpacity={0} />
        </linearGradient>
        <radialGradient id={ids.sh}>
          <stop offset="0" stopColor={C.navy0} stopOpacity={0.55} />
          <stop offset="0.6" stopColor={C.navy0} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f1(base.x)} cy={f1(base.y + 0.05 * s)} rx={f1(shR)} ry={f1(shR * lerp(0.2, 0.95, u))} fill={`url(#${ids.sh})`} />
      {/* liquid body: one merged, inked, lit surface */}
      <g filter={`url(#${ids.f})`}>{white}</g>
      {/* liquid-only accents, all through ONE mask of the merged silhouette (cost): interior reflections on the flat
          liquid (puddle + caller pools), the room's dark horizon reflected across the molten mound (+ a thin
          floor-bounce line under it, so the big liquid surface keeps the chrome's banded read instead of going flat
          grey), and the heat glow in the freshly melted metal just below the front */}
      {(sheenOn || hzOn > 0.01 || heatOn > 0.01) && (
        <g mask={`url(#${ids.m})`}>
          {sheenOn && <PoolSheen sets={[...(extra.length ? [extra[0]] : []), ...pool]} t={t} env={env} k={pool.length ? 1 : ss(m, 0.3, 0.7)} />}
          {hzOn > 0.01 && (
            <g opacity={hzOn}>
              <path d={hzBandD} fill={`url(#${ids.hz})`} />
              <path d={hzLineD} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1, 0.05 * s)} strokeLinecap="round" opacity={0.45} />
            </g>
          )}
          {heatOn > 0.01 && <rect x={f1(box.x0)} y={f1(hy - 0.35 * s)} width={f1(box.x1 - box.x0)} height={f1(1.6 * s)} fill={`url(#${ids.hg})`} opacity={heatOn} />}
        </g>
      )}
      {/* solid chrome layer, revealed above the (wavy) melt front */}
      {solidOn && (
        <g mask={m > 0.001 ? `url(#${ids.fm})` : undefined}>
          <Solid R={R} SP={SP} s={s} glow={R.P.glow} />
        </g>
      )}
      {/* the melt line: a crisp wet seam where chrome turns liquid (warm when heated); it also hides the mask cut */}
      {solidOn && seamOn > 0.01 && (
        <g mask={`url(#${ids.m})`}>
          <path d={frontLineD} fill="none" stroke={INK} strokeWidth={Math.max(1.2, 0.05 * s)} strokeLinecap="round" strokeLinejoin="round" opacity={0.35 * seamOn} transform={`translate(0 ${f1(Math.max(1, 0.04 * s))})`} />
          <path d={frontLineD} fill="none" stroke={mix('#FFFFFF', C.yellow, heatOn)} strokeWidth={Math.max(1.1, 0.045 * s)} strokeLinecap="round" strokeLinejoin="round" opacity={0.9 * seamOn} />
        </g>
      )}
      {/* environment tint (alarm) on the solid layer too */}
      {tint > 0.01 && (
        <g mask={`url(#${ids.m})`} style={{mixBlendMode: 'screen'}}>
          <rect x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)} fill={`url(#${ids.tg})`} opacity={clamp(tint) * (solidOn ? 0.4 : 0.15)} />
        </g>
      )}
      <EyesAt l={el} r={er} s={s} sx={R.eyeSx} sy={R.eyeSy} open={R.P.eyeOpen} lookX={R.P.lookX} lookY={R.P.lookY} mood={R.P.mood} glow={R.P.glow} opacity={eyeVis} wl={R.eyes.wl} wr={R.eyes.wr} />
    </g>
  );
};
const bobOf = (R: Rig) => R.P.bob;
/** open polyline -> smooth path (Catmull-Rom) */
const openSmooth = (ps: V[]) => {
  let d = `M${f1(ps[0].x)},${f1(ps[0].y)}`;
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    d += `C${f1(p1.x + (p2.x - p0.x) / 6)},${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)},${f1(p2.y - (p3.y - p1.y) / 6)} ${f1(p2.x)},${f1(p2.y)}`;
  }
  return d;
};

// the crisp solid robot (chrome parts, joints, panel lines)
const Solid: React.FC<{R: Rig; SP: (p: V, head?: boolean, keep?: V) => V; s: number; glow: number}> = ({R, SP, s, glow}) => {
  const lw = 1.5;
  const out: React.ReactNode[] = [];
  R.parts.forEach((p, i) => {
    if (p.kind === 'web') return;
    const kp = p.keep ? p.c : undefined;
    const pts = p.pts.map((q) => SP(q, p.head, kp));
    const d = p.kind === 'head' || p.kind === 'torso' || p.kind === 'pelvis' || p.kind === 'neck' ? smoothPath(pts) : polyPath(pts);
    const c = p.c ? SP(p.c, p.head, kp) : pts[0];
    const r = (p.r ?? 1) * s;
    let fill: React.ReactNode = null;
    if (p.kind === 'cap') fill = <CapFill a={SP(p.a!)} b={SP(p.b!)} r={r} d={d} />;
    else if (p.kind === 'joint') fill = <BallFill c={c} r={r} d={d} base={C.silverMid} spec={0.7} />;
    else if (p.kind === 'ball') fill = <BallFill c={c} r={r} d={d} base={C.silver} />;
    else if (p.kind === 'hand') fill = <BallFill c={c} r={r} d={d} base={C.silver} spec={0.6} />;
    else if (p.kind === 'ear') fill = <BallFill c={c} r={r} d={d} base={C.silverMid} spec={0.6} />;
    else if (p.kind === 'foot') fill = <BallFill c={c} r={r * 1.2} d={d} base={C.silver} spec={0.7} />;
    else if (p.kind === 'neck') fill = <BallFill c={c} r={r * 1.4} d={d} base={C.silverDark} spec={0} />;
    else if (p.kind === 'pelvis') fill = <PelvisFill pts={pts} d={d} s={s} />;
    else if (p.kind === 'torso') fill = <TorsoFill R={R} SP={SP} pts={pts} d={d} s={s} glow={glow} />;
    else if (p.kind === 'head') fill = <HeadFill R={R} SP={SP} pts={pts} d={d} s={s} />;
    out.push(
      <g key={i}>
        {fill}
        <path d={d} fill="none" stroke={INK} strokeWidth={lw} strokeLinejoin="round" />
      </g>,
    );
  });
  return <>{out}</>;
};

const bboxOf = (pts: V[]) => boxOf([pts]);

const PelvisFill: React.FC<{pts: V[]; d: string; s: number}> = ({pts, d, s}) => {
  const id = uid('rbp');
  const b = bboxOf(pts);
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(b.x0)} y1={f1(b.y0)} x2={f1(b.x1)} y2={f1(b.y1)}>
          <stop offset="0" stopColor={C.silver} />
          <stop offset="0.45" stopColor={C.silverMid} />
          <stop offset="0.8" stopColor={C.silverDark} />
          <stop offset="1" stopColor={C.silverDeep} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <path d={`M${f1(b.x0 + s * 0.3)},${f1(b.y0 + s * 0.16)} L${f1((b.x0 + b.x1) / 2 - s * 0.2)},${f1(b.y0 + s * 0.16)}`} stroke="#FFFFFF" strokeWidth={Math.max(1, s * 0.07)} strokeLinecap="round" opacity={0.75} />
    </g>
  );
};

const TorsoFill: React.FC<{R: Rig; SP: (p: V, head?: boolean) => V; pts: V[]; d: string; s: number; glow: number}> = ({R, SP, pts, d, s, glow}) => {
  const id = uid('rbt'), id2 = uid('rbt'), idc = uid('rbt'), idp = uid('rbt');
  const b = bboxOf(pts);
  const cx = (b.x0 + b.x1) / 2;
  // a barrel: lit left, dark reflection band right of centre, reflected rim at the right edge
  const lean = R.P.lean;
  // panel + seams in robot units (follow the lean)
  const up = R.up;
  void lean;
  const pan = superE(0, 5.45, 0.62, 0.44, 0.44, 4, 4, 32).map((q) => SP(up(q)));
  const led = SP(up({x: 0.3, y: 5.47}));
  const belt = [-1.18, -0.6, 0, 0.6, 1.18].map((xx) => SP(up({x: xx, y: 4.35 - 0.05 * (1 - (xx / 1.18) ** 2)})));
  const collar = [-1.0, -0.5, 0, 0.5, 1.0].map((xx) => SP(up({x: xx, y: 6.42 - 0.08 * (1 - (xx / 1.0) ** 2)})));
  const grill = [0, 1, 2].map((k) => [SP(up({x: -0.4, y: 5.62 - k * 0.17})), SP(up({x: -0.05, y: 5.62 - k * 0.17}))]);
  const ledR = 0.1 * s;
  const ln = (ps: V[]) => 'M' + ps.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L');
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(b.x0)} y1="0" x2={f1(b.x1)} y2="0">
          <stop offset="0" stopColor={C.chrome} />
          <stop offset="0.2" stopColor={C.silverLit} />
          <stop offset="0.48" stopColor={C.silver} />
          <stop offset="0.66" stopColor={C.silverMid} />
          <stop offset="0.76" stopColor={C.silverDark} />
          <stop offset="0.84" stopColor={C.silverDeep} />
          <stop offset="0.93" stopColor={C.silverDark} />
          <stop offset="1" stopColor={C.silverMid} />
        </linearGradient>
        <linearGradient id={id2} gradientUnits="userSpaceOnUse" x1="0" y1={f1(b.y0)} x2="0" y2={f1(b.y1)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="0.25" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.7" stopColor={C.silverDeep} stopOpacity={0} />
          <stop offset="1" stopColor={C.silverDeep} stopOpacity={0.45} />
        </linearGradient>
        <linearGradient id={idp} gradientUnits="userSpaceOnUse" x1={f1(pan[0].x)} y1={f1(b.y0)} x2={f1(pan[16].x)} y2={f1(b.y1)}>
          <stop offset="0" stopColor={C.silverMid} />
          <stop offset="1" stopColor={C.silverLit} />
        </linearGradient>
        <radialGradient id={idc}>
          <stop offset="0" stopColor={C.cyan} stopOpacity={0.7 * glow} />
          <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <path d={d} fill={`url(#${id2})`} />
      {/* crisp gloss on the upper-left shoulder of the barrel */}
      <path d={`M${f1(b.x0 + (b.x1 - b.x0) * 0.16)},${f1(b.y0 + s * 0.55)} Q${f1(b.x0 + (b.x1 - b.x0) * 0.2)},${f1(b.y0 + s * 0.25)} ${f1(b.x0 + (b.x1 - b.x0) * 0.42)},${f1(b.y0 + s * 0.2)}`} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1.2, s * 0.13)} strokeLinecap="round" opacity={0.95} />
      <path d={ln(collar)} fill="none" stroke={INK} strokeWidth={1.3} strokeLinecap="round" opacity={0.8} />
      <path d={smoothPath(pan)} fill={`url(#${idp})`} stroke={INK} strokeWidth={1.4} />
      {grill.map((g, i) => <path key={i} d={ln(g)} stroke={INK} strokeWidth={1.2} strokeLinecap="round" opacity={0.75} />)}
      <circle cx={f1(led.x)} cy={f1(led.y)} r={f1(ledR * 3)} fill={`url(#${idc})`} style={{mixBlendMode: 'screen'}} />
      <circle cx={f1(led.x)} cy={f1(led.y)} r={f1(ledR)} fill={mix(C.cyanDeep, C.cyan, glow)} stroke={INK} strokeWidth={1} />
      <circle cx={f1(led.x - ledR * 0.3)} cy={f1(led.y - ledR * 0.3)} r={f1(ledR * 0.35)} fill={C.cyanCore} opacity={glow} />
      <path d={ln(belt)} fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      <path d={ln(belt.map((q) => ({x: q.x, y: q.y + Math.max(1, s * 0.05)})))} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(0.8, s * 0.035)} strokeLinecap="round" opacity={0.6} />
      {void cx}
    </g>
  );
};

const HeadFill: React.FC<{R: Rig; SP: (p: V, head?: boolean) => V; pts: V[]; d: string; s: number}> = ({R, SP, pts, d, s}) => {
  const id = uid('rbh'), idc = uid('rbh'), idb = uid('rbh');
  const b = bboxOf(pts);
  const c = SP(R.headC, true);
  const rx = (b.x1 - b.x0) / 2, ry = (b.y1 - b.y0) / 2;
  const turn = R.P.headTurn;
  const f = {x: c.x + (LIGHT.x * 0.5 - turn * 0.15) * rx, y: c.y + LIGHT.y * 0.55 * ry};
  // jaw seam + dark horizon band (follows head roll through the mapping)
  const seamH = 7.25;
  const seam = [-1.6, -1.0, -0.4, 0.2, 0.8, 1.4, 1.75].map((xx) => SP(rotHead(R, {x: xx * 1.0 - 0.0, y: seamH - 0.12 * (1 - (xx / 1.8) ** 2)}), true));
  const bandTop = [-2.1, -1.2, 0, 1.2, 2.1].map((xx) => SP(rotHead(R, {x: xx, y: 7.55 - 0.15 * (1 - (xx / 2.1) ** 2)}), true));
  const bandBot = [2.1, 1.2, 0, -1.2, -2.1].map((xx) => SP(rotHead(R, {x: xx, y: 6.6}), true));
  const ln = (ps: V[]) => 'M' + ps.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L');
  // dome gloss: an arc on the upper-left
  const gl = (a: number, k: number) => SP(rotHead(R, {x: Math.cos(a) * D.headRx * k - turn * 0.25, y: D.headC + Math.sin(a) * D.headRy * k}), true);
  const arc = [2.05, 2.25, 2.45, 2.65].map((a) => gl(a, 0.8));
  const dot = gl(1.75, 0.83);
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={f1(c.x)} cy={f1(c.y)} r={f1(Math.max(rx, ry) * 1.12)} fx={f1(f.x)} fy={f1(f.y)}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.25" stopColor={C.silverLit} />
          <stop offset="0.55" stopColor={C.chrome} />
          <stop offset="0.78" stopColor={C.silver} />
          <stop offset="0.92" stopColor={C.silverMid} />
          <stop offset="1" stopColor={C.silverDark} />
        </radialGradient>
        <clipPath id={idc}>
          <path d={d} />
        </clipPath>
        <linearGradient id={idb} gradientUnits="userSpaceOnUse" x1={f1(b.x0)} y1="0" x2={f1(b.x1)} y2="0">
          <stop offset="0" stopColor={C.silverDark} />
          <stop offset="0.5" stopColor={C.silverMid} />
          <stop offset="1" stopColor={C.silverDeep} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
      <g clipPath={`url(#${idc})`}>
        <g opacity={1 - R.u}>
          <path d={ln([...bandTop, ...bandBot]) + 'Z'} fill={`url(#${idb})`} opacity={0.75} />
          <path d={ln(seam)} fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" opacity={0.85} />
          <path d={ln(seam.map((q) => ({x: q.x, y: q.y + Math.max(1, s * 0.05)})))} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(0.8, s * 0.04)} strokeLinecap="round" opacity={0.55} />
        </g>
      </g>
      <path d={'M' + arc.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L')} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1.5, s * 0.17)} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={f1(dot.x)} cy={f1(dot.y)} r={f1(Math.max(1, s * 0.09))} fill="#FFFFFF" />
    </g>
  );
};
// a head-space point posed like the head (roll + lean), for head decorations
const rotHead = (R: Rig, p: V): V => R.headPt(p);
