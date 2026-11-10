// V2 hero robot: the V1 character (src/art/robot.tsx: 10 u tall, big rounded head with ear discs, two big cyan eyes,
// compact torso with a small chest panel, small arms and legs, simple joints) rebuilt as world-space SDF primitives,
// rendered as ONE polished chrome body by the liquid engine, so it can stand / grip bars, soften regionally, squeeze
// through a gap narrower than its head and reform exactly.
//
// Rig. Every part is a world prim (sphere, capsule, billboard rounded box / trapezoid) posed like V1 (lean, head roll,
// shoulder / elbow / hip / knee angles, or IK grips on world points). Each part also has a LIQUID shape of the same
// area (a capsule of the part's equivalent radius) and the drawn prim is mix(rigid, liquid, mu) with mu from the
// part's softness, so softening, flowing and reforming are one continuous deformation of the same field.
//   soften  {head, upper, lower} 0..1: the region rounds off, sags under gravity and its blend radius grows;
//   squeeze {gap, out, u}: each part, in order (head first ... feet last), slides along its own path through the gap
//           (x pinched into the clear width, radius necked, length stretched so its area holds), pours down outside
//           and collects in a lump at `out`; a connector tube keeps source, stream and lump ONE continuous body;
//   reform  0..1: the collected lump rises back into the rigid pose at `out` (legs, then body, then the head with a
//           crisp overshoot snap) - the exact inverse of the collapse, so it lands exactly on the rigid silhouette.
// Decals ride their part: eyes (V1 EyesAt look) stretch / squash with the head's liquid shape, chest panel and seams
// sink (shrink into the surface) as their region softens; all of it is drawn inside the body's depth clip.
import React from 'react';
import {C, INK} from '../art/palette';
import {EyesAt} from '../art/liquid';
import {POSE_IDLE, RobotPose} from '../art/robot';
import {Cam3, P3, project} from '../world';
import {clamp, lerp, noise1, ss} from '../lib';
import {Prim3, projectPrims} from './liquid/sdf';
import {unionArea} from './liquid/flow';
import {buildChrome, ChromeEnv, ChromePaint, FloorOpts, Glow} from './liquid/Chrome';

export type Robot2Pose = RobotPose & {
  /** world grip targets for the hands (screen-left arm = l). Overrides the arm angles. */
  gripL?: P3;
  gripR?: P3;
  /** 0..1 how much the grip IK is applied */
  grip?: number;
};
export type Robot2Base = P3 & {s?: number};
export type Robot2Gap = {x: number; d: number; w: number};
export type Robot2State = {
  soften?: {head?: number; upper?: number; lower?: number};
  squeeze?: {gap: Robot2Gap; out: P3; u: number; outPose?: Robot2Pose};
  reform?: number;
  /** liquid surface wobble amount (default 1) */
  wobble?: number;
};

export const R2 = {
  headC: 8.4, headHW: 1.95, headHH: 1.6, headR: 1.25,
  earX: 2.0, earH: 8.3, earR: 0.42,
  neck0: 6.35, neck1: 7.0, neckR: 0.42,
  torsoC: 5.26, torsoHH: 1.36, torsoWT: 1.55, torsoWB: 1.12, torsoR: 0.42,
  pelvisC: 3.55, pelvisHW: 1.08, pelvisHH: 0.4,
  hipX: 0.62, hipH: 3.3, thigh: 1.45, shin: 1.25, footH: 0.62, footW: 0.7,
  shX: 1.72, shH: 6.05, upper: 1.3, fore: 1.12,
  eyeSep: 0.8, eyeDh: -0.2,
};

type Region = 'head' | 'upper' | 'lower';
type Part = {
  id: string;
  g: number;
  region: Region;
  sigma: number;
  rigid: Prim3;
  c: P3; // centroid (world)
  re: number; // equivalent radius (world)
};

const rad = (d: number) => (d * Math.PI) / 180;
const rot2 = (x: number, y: number, ox: number, oy: number, deg: number) => {
  const a = rad(deg), c = Math.cos(a), s = Math.sin(a);
  const dx = x - ox, dy = y - oy;
  return {x: ox + dx * c - dy * s, y: oy + dx * s + dy * c};
};
const add3 = (a: P3, b: P3, k = 1): P3 => ({x: a.x + b.x * k, h: a.h + b.h * k, d: a.d + b.d * k});
const scale3 = (a: P3, k: number): P3 => ({x: a.x * k, h: a.h * k, d: a.d * k});
const lerp3 = (a: P3, b: P3, u: number): P3 => ({x: lerp(a.x, b.x, u), h: lerp(a.h, b.h, u), d: lerp(a.d, b.d, u)});

// ---------------------------------------------------------------------------------------------------------------
// posed rigid parts (world), V1 construction
type Posed = {parts: Part[]; head: {c: P3; roll: number; turn: number}; torso: {c: P3; roll: number}; s: number; eyes: {l: P3; r: P3}; ears: P3[]};

const capArea = (L: number, ra: number, rb: number) => (ra + rb) * L + (Math.PI * (ra * ra + rb * rb)) / 2;

export const robot2Posed = (base: Robot2Base, pose: Robot2Pose): Posed => {
  const s = base.s ?? 1;
  const W = (x: number, h: number, dd = 0): P3 => ({x: base.x + x * s, h: base.h + h * s, d: base.d + dd * s});
  const P = pose;
  const parts: Part[] = [];
  // ---- legs (planted)
  const legs = [-1, 1].map((side) => {
    const hipA = side < 0 ? P.lHip : P.rHip, kneeA = side < 0 ? P.lKnee : P.rKnee;
    const hip = {x: side * R2.hipX, y: R2.hipH};
    const knee = {x: hip.x + side * Math.sin(rad(hipA)) * R2.thigh, y: hip.y - Math.cos(rad(hipA)) * R2.thigh};
    const sA = hipA - kneeA;
    const ankle = {x: knee.x + side * Math.sin(rad(sA)) * R2.shin, y: knee.y - Math.cos(rad(sA)) * R2.shin};
    return {side, hip, knee, ankle};
  });
  const lift = Math.min(...legs.map((l) => l.ankle.y)) - R2.footH;
  for (const l of legs) for (const k of ['hip', 'knee', 'ankle'] as const) l[k] = {x: l[k].x, y: l[k].y - lift};
  const pel = {x: 0, y: R2.pelvisC - lift};
  const bobK = 1 + P.bob;
  const up = (x: number, y: number) => {
    const q = rot2(x, y - lift, pel.x, pel.y, -P.lean);
    return {x: q.x * (1 - 0.4 * P.bob), y: pel.y + (q.y - pel.y) * bobK};
  };
  const headPt = (x: number, y: number) => {
    const q = rot2(x, y, 0, 6.75, -P.headTilt);
    return up(q.x, q.y);
  };
  for (const l of legs) {
    const sd = l.side;
    const tag = sd < 0 ? 'L' : 'R';
    parts.push({id: 'thigh' + tag, g: 1, region: 'lower', sigma: 0.6, rigid: {k: 'cap3', a: W(l.hip.x, l.hip.y), b: W(l.knee.x, l.knee.y), ra: 0.5 * s, rb: 0.45 * s}, c: W((l.hip.x + l.knee.x) / 2, (l.hip.y + l.knee.y) / 2), re: Math.sqrt(capArea(R2.thigh, 0.5, 0.45) / Math.PI) * s});
    parts.push({id: 'shin' + tag, g: 1, region: 'lower', sigma: 0.72, rigid: {k: 'cap3', a: W(l.knee.x, l.knee.y), b: W(l.ankle.x, l.ankle.y), ra: 0.43 * s, rb: 0.4 * s}, c: W((l.knee.x + l.ankle.x) / 2, (l.knee.y + l.ankle.y) / 2), re: Math.sqrt(capArea(R2.shin, 0.43, 0.4) / Math.PI) * s});
    parts.push({id: 'knee' + tag, g: 1, region: 'lower', sigma: 0.66, rigid: {k: 's', p: W(l.knee.x, l.knee.y, -0.05), r: 0.43 * s}, c: W(l.knee.x, l.knee.y), re: 0.43 * s});
    const fc = {x: l.ankle.x + sd * 0.12, y: l.ankle.y - R2.footH * 0.5};
    parts.push({id: 'foot' + tag, g: 1, region: 'lower', sigma: 0.85, rigid: {k: 'box3', p: W(fc.x, fc.y, -0.15), hw: R2.footW * s, hh: 0.31 * s, r: 0.3 * s}, c: W(fc.x, fc.y), re: Math.sqrt((1.4 * 0.62 - 0.08) / Math.PI) * s});
  }
  // ---- pelvis, torso, neck
  const pc = up(0, R2.pelvisC);
  parts.push({id: 'pelvis', g: 2, region: 'lower', sigma: 0.5, rigid: {k: 'box3', p: W(pc.x, pc.y), hw: R2.pelvisHW * s, hh: R2.pelvisHH * s, r: 0.36 * s, rot: P.lean}, c: W(pc.x, pc.y), re: Math.sqrt((2.16 * 0.8 - 0.11) / Math.PI) * s});
  const tc = up(0, R2.torsoC);
  parts.push({id: 'torso', g: 2, region: 'upper', sigma: 0.28, rigid: {k: 'trap3', p: W(tc.x, tc.y), wt: R2.torsoWT * s, wb: R2.torsoWB * s, hh: R2.torsoHH * s, r: R2.torsoR * s, rot: P.lean}, c: W(tc.x, tc.y), re: Math.sqrt(((R2.torsoWT + R2.torsoWB) * 2 * R2.torsoHH - 0.15) / Math.PI) * s});
  const n0 = up(0, R2.neck0), n1 = headPt(0, R2.neck1);
  parts.push({id: 'neck', g: 2, region: 'head', sigma: 0.1, rigid: {k: 'cap3', a: W(n0.x, n0.y, 0.1), b: W(n1.x, n1.y, 0.1), ra: R2.neckR * s, rb: R2.neckR * s}, c: W((n0.x + n1.x) / 2, (n0.y + n1.y) / 2), re: Math.sqrt(capArea(0.65, 0.42, 0.42) / Math.PI) * s});
  // ---- arms
  const grip = clamp(P.grip ?? (P.gripL || P.gripR ? 1 : 0));
  for (const side of [-1, 1]) {
    const tag = side < 0 ? 'L' : 'R';
    const a0 = side < 0 ? P.lSh : P.rSh, e0 = side < 0 ? P.lEl : P.rEl;
    const rx = P.reachX ?? 0;
    const a = side * rx > 0 ? lerp(a0, 92, Math.abs(rx)) : a0;
    const el = side * rx > 0 ? lerp(e0, 2, Math.abs(rx)) : e0;
    const dir = (d: number) => ({x: side * Math.sin(rad(d)), y: -Math.cos(rad(d))});
    const sh = up(side * R2.shX, R2.shH);
    const d1 = dir(a), d2 = dir(a + el);
    let elb = {x: sh.x + d1.x * R2.upper, y: sh.y + d1.y * R2.upper};
    let wr = {x: elb.x + d2.x * R2.fore, y: elb.y + d2.y * R2.fore};
    let handD = 0, elbD = 0;
    const tgt = side < 0 ? P.gripL : P.gripR;
    if (tgt && grip > 0) {
      // 3D two-bone IK (local units) toward the target, elbow pulled down and slightly out by a pole vector
      const T = {x: (tgt.x - base.x) / s, y: (tgt.h - base.h) / s, z: (tgt.d - base.d) / s};
      const S = {x: sh.x, y: sh.y, z: 0};
      let dx = T.x - S.x, dy = T.y - S.y, dz = T.z - S.z;
      const D0 = Math.hypot(dx, dy, dz) || 1e-3;
      const D = clamp(D0, 0.3, R2.upper + R2.fore - 0.02);
      dx /= D0;
      dy /= D0;
      dz /= D0;
      const a = (R2.upper * R2.upper + D * D - R2.fore * R2.fore) / (2 * D);
      const hh = Math.sqrt(Math.max(0, R2.upper * R2.upper - a * a));
      let px = side * 0.45, py = -1, pz = 0.9;
      const pd = px * dx + py * dy + pz * dz;
      px -= pd * dx;
      py -= pd * dy;
      pz -= pd * dz;
      const pl = Math.hypot(px, py, pz) || 1;
      const e1 = {x: S.x + dx * a + (px / pl) * hh, y: S.y + dy * a + (py / pl) * hh, z: S.z + dz * a + (pz / pl) * hh};
      const w1 = {x: S.x + dx * D, y: S.y + dy * D, z: S.z + dz * D};
      elb = {x: lerp(elb.x, e1.x, grip), y: lerp(elb.y, e1.y, grip)};
      wr = {x: lerp(wr.x, w1.x, grip), y: lerp(wr.y, w1.y, grip)};
      elbD = e1.z * grip;
      handD = w1.z * grip;
    }
    const hd = {x: wr.x + (wr.x - elb.x) * 0.25, y: wr.y + (wr.y - elb.y) * 0.25};
    parts.push({id: 'shoulder' + tag, g: 3, region: 'upper', sigma: 0.18, rigid: {k: 's', p: W(sh.x, sh.y, -0.05), r: 0.5 * s}, c: W(sh.x, sh.y), re: 0.5 * s});
    parts.push({id: 'upper' + tag, g: 3, region: 'upper', sigma: 0.22, rigid: {k: 'cap3', a: W(sh.x, sh.y, -0.05), b: W(elb.x, elb.y, elbD), ra: 0.36 * s, rb: 0.33 * s}, c: W((sh.x + elb.x) / 2, (sh.y + elb.y) / 2, elbD * 0.5), re: Math.sqrt(capArea(R2.upper, 0.36, 0.33) / Math.PI) * s});
    parts.push({id: 'fore' + tag, g: 3, region: 'upper', sigma: 0.3, rigid: {k: 'cap3', a: W(elb.x, elb.y, elbD), b: W(wr.x, wr.y, handD), ra: 0.32 * s, rb: 0.3 * s}, c: W((elb.x + wr.x) / 2, (elb.y + wr.y) / 2, (elbD + handD) / 2), re: Math.sqrt(capArea(R2.fore, 0.32, 0.3) / Math.PI) * s});
    parts.push({id: 'elbow' + tag, g: 3, region: 'upper', sigma: 0.26, rigid: {k: 's', p: W(elb.x, elb.y, elbD - 0.05), r: 0.34 * s}, c: W(elb.x, elb.y, elbD), re: 0.34 * s});
    parts.push({id: 'hand' + tag, g: 3, region: 'upper', sigma: 0.34, rigid: {k: 'ell3', p: W(hd.x, hd.y, handD - 0.05), rx: 0.5 * s, ry: 0.44 * s}, c: W(hd.x, hd.y, handD), re: 0.47 * s});
  }
  // ---- head + ears
  const hc = headPt(0, R2.headC);
  const roll = P.lean + P.headTilt;
  const tn = clamp(P.headTurn, -1, 1);
  parts.push({id: 'head', g: 4, region: 'head', sigma: 0, rigid: {k: 'box3', p: W(hc.x, hc.y), hw: R2.headHW * s, hh: R2.headHH * s, r: R2.headR * s, rot: roll}, c: W(hc.x, hc.y), re: Math.sqrt((3.9 * 3.2 - (4 - Math.PI) * R2.headR * R2.headR) / Math.PI) * s});
  const ears: P3[] = [];
  for (const side of [-1, 1]) {
    const kx = clamp(1 - 0.45 * side * tn, 0.55, 1.06);
    const e = headPt(side * R2.earX * kx - tn * 0.15, R2.earH);
    const p = W(e.x, e.y, 0.15);
    ears.push(p);
    parts.push({id: 'ear' + (side < 0 ? 'L' : 'R'), g: 4, region: 'head', sigma: 0.04, rigid: {k: 's', p, r: R2.earR * s}, c: p, re: R2.earR * s});
  }
  const sep = R2.eyeSep * (1 - 0.12 * Math.abs(tn));
  const el = headPt(-sep + tn * 0.55, R2.headC + R2.eyeDh), er = headPt(sep + tn * 0.55, R2.headC + R2.eyeDh);
  return {parts, head: {c: W(hc.x, hc.y), roll, turn: tn}, torso: {c: W(tc.x, tc.y), roll: P.lean}, s, eyes: {l: W(el.x, el.y, -0.4), r: W(er.x, er.y, -0.4)}, ears};
};

// ---------------------------------------------------------------------------------------------------------------
// 3D path (Catmull-Rom, arc length)
type Path3 = {len: number; at: (q: number) => P3; tan: (q: number) => P3; sNear: (d: number) => number};
const path3 = (ctrl: P3[], n = 16): Path3 => {
  const pts: P3[] = [];
  const cr = (a: number, b: number, c: number, d: number, t: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      pts.push({x: cr(p0.x, p1.x, p2.x, p3.x, t), h: cr(p0.h, p1.h, p2.h, p3.h, t), d: cr(p0.d, p1.d, p2.d, p3.d, t)});
    }
  }
  pts.push(ctrl[ctrl.length - 1]);
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].h - pts[i - 1].h, pts[i].d - pts[i - 1].d));
  const len = s[s.length - 1];
  const idx = (q: number) => {
    let lo = 0, hi = s.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (s[m] <= q) lo = m;
      else hi = m;
    }
    return lo;
  };
  const at = (q: number): P3 => {
    const qq = clamp(q, 0, len);
    const i = idx(qq);
    const u = (qq - s[i]) / Math.max(1e-9, s[i + 1] - s[i]);
    return lerp3(pts[i], pts[i + 1], u);
  };
  const tan = (q: number): P3 => {
    const i = Math.min(pts.length - 2, idx(clamp(q, 0, len)));
    const v = {x: pts[i + 1].x - pts[i].x, h: pts[i + 1].h - pts[i].h, d: pts[i + 1].d - pts[i].d};
    const l = Math.hypot(v.x, v.h, v.d) || 1;
    return {x: v.x / l, h: v.h / l, d: v.d / l};
  };
  const sNear = (d: number) => {
    // arc length where the path crosses depth d (first crossing), else the closest
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i].d - d, b = pts[i + 1].d - d;
      if (a === 0) return s[i];
      if (a * b < 0) return s[i] + (s[i + 1] - s[i]) * (a / (a - b));
    }
    return len / 2;
  };
  return {len, at, tan, sNear};
};

// ---------------------------------------------------------------------------------------------------------------
export type Robot2Rig = {
  prims3: Prim3[];
  /** per-group internal definition (rigid) 0..1, group blends and shading scales in WORLD units (x px/unit later) */
  rigid: number[];
  groupBlendU: number[];
  blendU: number;
  /** decal frames */
  eyes: {l: P3; r: P3; sx: number; sy: number; d: number; vis: number};
  head: {c: P3; r: number};
  panel: {c: P3; k: number; roll: number} | null;
  seams: {a: P3; b: P3; w: number; bend: number}[];
  earRings: {c: P3; r: number; k: number}[];
  s: number;
  /** total part area (sum of pi re^2) in world units^2 (conserved by construction) */
  partArea: number;
  /** any part not rigid */
  liquid: boolean;
  /** the liquid-shape scale solved for the area */
  alpha: number;
};

/** the pour path from the gap exit to the lump: out of the gap, then falling in an arc */
const pourAt = (a: P3, b: P3, u: number): P3 => {
  const e = clamp(u);
  const x = lerp(a.x, b.x, e), d = lerp(a.d, b.d, Math.min(1, e * 1.4));
  const h = lerp(a.h, b.h, e * (0.35 + 0.65 * e));
  return {x, h, d};
};
export const snapEase = (x: number) => {
  // back-out ease: overshoots ~8 % then settles exactly on 1
  const c1 = 1.9, c3 = c1 + 1;
  const y = clamp(x) - 1;
  return 1 + c3 * y * y * y + c1 * y * y;
};

/** the robot's world prims + decal frames for a pose and state (pure) */
/** the robot's world prims + decal frames for a pose and state (pure). While any part is liquid, one scale on the
 *  liquid shapes is solved so the body's frontal area stays equal to the rigid body's (no shrinking lump). */
export const robot2Rig = (base: Robot2Base, pose: Robot2Pose, state: Robot2State = {}, t = 0): Robot2Rig => {
  const r1 = rigAlpha(base, pose, state, t, 1);
  if (!r1.liquid) return r1;
  const s = base.s ?? 1;
  const cam: Cam3 = {x: base.x, h: base.h + 7 * s, d: base.d - 1000, yaw: 0, pitch: 0, f: 100000};
  const k = 100 / s;
  // target: the rigid inside pose's area, easing to the outside pose's as the body collects (no target jump)
  const sq = state.squeeze;
  const aIn = rigidFrontArea(base, pose, {}, cam, k);
  const rigidA = sq ? lerp(aIn, rigidFrontArea(base, pose, {...state, squeeze: {...sq, u: 1}}, cam, k), ss(sq.u, 0.55, 1)) : aIn;
  const area = (r: Robot2Rig) => unionArea(projectPrims(cam, r.prims3), r.blendU * k, 70);
  let xa = 1, fa = area(r1) - rigidA;
  let xb = fa > 0 ? 0.93 : 1.08;
  let rb = rigAlpha(base, pose, state, t, xb);
  let fb = area(rb) - rigidA;
  for (let i = 0; i < 6 && Math.abs(fb) > rigidA * 0.004; i++) {
    const den = fb - fa;
    const xn = clamp(Math.abs(den) < 1e-9 ? xb : xb - (fb * (xb - xa)) / den, 0.55, 1.6);
    xa = xb;
    fa = fb;
    xb = xn;
    rb = rigAlpha(base, pose, state, t, xb);
    fb = area(rb) - rigidA;
  }
  return rb;
};
const RIGID_CACHE = new Map<string, number>();
/** frontal area of the rigid body (inside pose; the outside pose once the squeeze has completed) */
const rigidFrontArea = (base: Robot2Base, pose: Robot2Pose, state: Robot2State, cam: Cam3, k: number) => {
  const sq = state.squeeze;
  const useOut = !!sq && sq.u >= 1;
  const key = JSON.stringify([base, useOut ? sq!.outPose ?? null : pose, useOut]);
  const hit = RIGID_CACHE.get(key);
  if (hit !== undefined) return hit;
  const P = useOut ? robot2Posed({...sq!.out, s: base.s}, sq!.outPose ?? POSE_IDLE) : robot2Posed(base, pose);
  const prims = projectPrims(cam, P.parts.map((q) => ({...q.rigid, g: q.g, blend: 0.06 * P.s})));
  const a = unionArea(prims, 0.06 * P.s * k, 70);
  RIGID_CACHE.set(key, a);
  if (RIGID_CACHE.size > 32) RIGID_CACHE.delete(RIGID_CACHE.keys().next().value as string);
  return a;
};

const rigAlpha = (base: Robot2Base, pose: Robot2Pose, state: Robot2State, t: number, alpha: number): Robot2Rig => {
  const A = robot2Posed(base, pose);
  const s = A.s;
  const sq = state.squeeze;
  const B = sq ? robot2Posed({...sq.out, s}, sq.outPose ?? POSE_IDLE) : null;
  const sf = state.soften ?? {};
  const softR: Record<Region, number> = {head: clamp(sf.head ?? 0), upper: clamp(sf.upper ?? 0), lower: clamp(sf.lower ?? 0)};
  const u = sq ? clamp(sq.u) : 0;
  // the reform only acts once the whole body has arrived (squeeze.u = 1): start it after the squeeze ends
  const rf = clamp(state.reform ?? 0) * (sq ? ss(sq.u, 0.985, 1) : 1);
  const wob = state.wobble ?? 1;
  const sigMax = 0.85;
  const prims3: Prim3[] = [];
  const out = {eyesL: A.eyes.l, eyesR: A.eyes.r};
  // reform progress per region (legs first, the head last with a snap)
  // reform: positions rise together (legs a touch first, the head riding on top with a small overshoot "snap"),
  // shapes go rigid bottom-up and the head's shape snaps last
  const headRise = (x: number) => (x < 0.72 ? 1.07 * ss(x / 0.72, 0, 1) : 1.07 - 0.07 * ss((x - 0.72) / 0.28, 0, 1));
  const posR: Record<Region, number> = {lower: ss(rf, 0, 0.6), upper: ss(rf, 0.04, 0.66), head: headRise(clamp((rf - 0.08) / 0.7))};
  const reformR: Record<Region, number> = {lower: ss(rf, 0.12, 0.62), upper: ss(rf, 0.26, 0.78), head: ss(rf, 0.62, 0.86)};
  // the collected lump outside: parts sag into a wide low mound (c = 1) and rise back to rigid (c = 0)
  const lumpOf = (q: Part, c: number): P3 => {
    // (recursive for the head's satellites)
    const b = B ? B.parts.find((z) => z.id === q.id)! : q;
    const bx = sq ? sq.out.x : base.x;
    const hh = b.c.h - (sq ? sq.out.h : base.h);
    const k = c;
    // a living lump: slow deterministic wobble while liquid
    const wx = 0.22 * s * k * noise1(t * 1.7 + q.sigma * 11, 5) * wob, wh = 0.16 * s * k * noise1(t * 2.1 + q.sigma * 13, 6) * wob;
    const P0 = {x: bx + (b.c.x - bx) * (1 + 0.55 * k) + wx, h: (sq ? sq.out.h : base.h) + q.re * 0.75 * k + hh * (1 - 0.72 * k) + wh, d: b.c.d + (q.id === 'head' ? -0.3 * s : 0) * k};
    if (q.region === 'head' && q.id !== 'head') {
      // ears / neck stay attached to the head's lump (pulled in as it goes liquid)
      const hq = A.parts.find((z) => z.id === 'head')!;
      const hb = B ? B.parts.find((z) => z.id === 'head')! : hq;
      const H0 = lumpOf(hq, c);
      return {x: H0.x + (b.c.x - hb.c.x) * (1 - 0.45 * k), h: H0.h + (b.c.h - hb.c.h) * (1 - 0.45 * k), d: H0.d + (b.c.d - hb.c.d)};
    }
    return P0;
  };
  let partArea = 0;
  const transit = {m: 0, h: 0, hMin: 1e9, hMax: -1e9};
  let streamR = 0;
  let headInfo = {c: A.head.c, r: A.parts.find((p) => p.id === 'head')!.re};
  let eyeInfo = {l: A.eyes.l, r: A.eyes.r, sx: 1, sy: 1, d: A.head.c.d, vis: 1};
  const muOf: Record<string, number> = {};
  // pre-pass: where the global stream runs (area-weighted height of everything in transit)
  const softA0h = (q: Part) => q.c.h - (q.region === 'head' ? 1.2 : q.region === 'upper' ? 0.7 : 0.25) * s * softR[q.region] * softR[q.region];
  let preM = 0, preH = 0;
  for (const q of A.parts) {
    const lam = sq ? clamp((u - (0.55 * q.sigma) / sigMax) / 0.45) : 0;
    const w = 2 * lam * (1 - lam) * q.re * q.re + 1e-6 * (lam > 0 && lam < 1 ? 1 : 0);
    preM += w;
    preH += w * softA0h(q);
  }
  const hcG = preM > 1e-9 ? preH / preM : A.head.c.h;
  for (const q of A.parts) {
    partArea += Math.PI * q.re * q.re;
    const soft = softR[q.region];
    const start = (0.55 * q.sigma) / sigMax;
    const lam = sq ? clamp((u - start) / 0.45) : 0;
    const le = lam * lam * (3 - 2 * lam);
    // after arrival: collected (c = 1) until reform lifts it
    const cOut = 1 - posR[q.region];
    // liquid amount: soft inside, fully liquid while flowing, back to rigid with the reform
    let mu = ss(soft, 0, 0.7);
    if (sq && lam > 0) mu = Math.max(mu, ss(lam, 0, 0.08));
    if (sq && lam >= 1) mu = clamp(1 - reformR[q.region]);
    muOf[q.id] = mu;
    // soft sag (inside): the region slumps and spreads a little; wobble on the liquid surface
    const sag = soft * soft;
    const ph = noise1(t * 1.3 + q.sigma * 7, 3) * wob;
    const A0: P3 = {
      x: q.c.x + (q.c.x - A.torso.c.x) * 0.18 * sag + 0.08 * s * ph * soft,
      h: q.c.h - (q.region === 'head' ? 1.2 : q.region === 'upper' ? 0.7 : 0.25) * s * sag,
      d: q.c.d,
    };
    let liquid: Prim3;
    let rigidP = q.rigid;
    let pos = A0;
    let rl = q.re;
    if (!sq || lam <= 0) {
      liquid = {k: 's', p: A0, r: q.re * alpha * (1 + 0.04 * ph * soft)};
      // the rigid shape rides the sag
      rigidP = shift3(q.rigid, {x: A0.x - q.c.x, h: A0.h - q.c.h, d: 0}, mu);
    } else if (lam >= 1) {
      // arrived: the liquid lump at the collected position; rigid shape = the outside pose (for the reform)
      const Bq = B!.parts.find((z) => z.id === q.id)!;
      const lc = lumpOf(q, cOut);
      liquid = {k: 's', p: lc, r: q.re * alpha};
      rigidP = shift3(Bq.rigid, {x: lc.x - Bq.c.x, h: lc.h - Bq.c.h, d: lc.d - Bq.c.d}, 1);
      pos = lc;
    } else {
      // in transit: the part's area splits between the tail (still inside, draining against the bars), a vertical
      // sheet IN the gap (narrower than the gap, stretched tall) and the front (emerged, travelling to the lump):
      // tail (1-l)^2 + sheet 2l(1-l) + front l^2 = 1, so the part's area is exact at every l.
      const g = sq.gap;
      const fT = (1 - lam) * (1 - lam), fS = 2 * lam * (1 - lam), fF = lam * lam;
      const rt = q.re * alpha * Math.sqrt(fT), rf = q.re * alpha * Math.sqrt(fF);
      const k0 = ss(lam, 0, 0.5);
      const tail0: P3 = {x: lerp(A0.x, g.x + (A0.x - g.x) * 0.55, k0), h: A0.h - 0.15 * s * k0, d: lerp(A0.d, g.d + 0.55 * rt + 0.25 * s, k0)};
      // a draining tail is drawn into the stream's entry (it never lingers as a stray droplet)
      const tail = lerp3(tail0, {x: g.x, h: hcG, d: g.d + 0.35 * s + 0.5 * rt}, ss(lam, 0.35, 0.95));
      // the sheet share goes to the ONE global stream through the gap (built after the loop)
      const aS = fS * Math.PI * q.re * q.re * alpha * alpha;
      transit.m += aS;
      transit.h += aS * A0.h;
      transit.hMin = Math.min(transit.hMin, A0.h);
      transit.hMax = Math.max(transit.hMax, A0.h);
      rl = Math.min(0.36 * sq.gap.w, Math.sqrt(aS / Math.PI));
      const hc = A0.h - 0.35 * s * lam;
      const Bc = lumpOf(q, 1);
      // every front leaves through the ONE stream's exit (no part takes its own route: no stray droplets)
      const hx = lerp(hc, hcG, 0.75);
      const ex: P3 = {x: g.x + 0.25 * s, h: hx - 0.4 * s, d: g.d - 0.45 * rf - 0.6 * s};
      const front = pourAt(ex, Bc, ss(lam, 0.25, 1));
      liquid = {k: 's', p: tail, r: rt};
      if (rf > 0.01) prims3.push({k: 's', p: front, r: rf, g: q.g});
      pos = front;
      if (q.id === 'head') {
        const sc: P3 = {x: g.x, h: hc, d: g.d};
        const ec = add3(add3(scale3(tail, fT), scale3(sc, fS)), scale3(front, fF));
        const narrow = fT + fS * (rl / q.re) + fF;
        const ox = R2.eyeSep * s * narrow;
        eyeInfo = {l: {x: ec.x - ox, h: ec.h - 0.15 * s, d: ec.d - 0.6 * s}, r: {x: ec.x + ox, h: ec.h - 0.15 * s, d: ec.d - 0.6 * s}, sx: Math.max(0.4, narrow), sy: 1 + 0.55 * fS * (1 - rl / q.re), d: ec.d, vis: 1};
        headInfo = {c: ec, r: q.re * narrow};
      }
    }
    prims3.push(mu >= 1 ? {...liquid, g: q.g} : mu <= 0 ? {...rigidP, g: q.g} : {k: 'mix3', a: rigidP, b: liquid, t: mu, g: q.g});
    if (q.id === 'head') {
      // eyes ride the head: rigid eye points, or on the liquid head's leading end, narrowed with it
      const qn = rl / q.re;
      if (!sq || lam <= 0) {
        const dv = {x: A0.x - q.c.x, h: A0.h - q.c.h, d: 0};
        eyeInfo = {l: add3(A.eyes.l, dv), r: add3(A.eyes.r, dv), sx: 1 - 0.1 * mu, sy: 1 - 0.12 * mu, d: q.c.d, vis: 1};
        headInfo = {c: A0, r: q.re};
      } else if (lam < 1) {
        void qn;
      } else {
        const Bq = B!.parts.find((z) => z.id === 'head')!;
        const lc = lumpOf(q, cOut);
        const dv = {x: lc.x - Bq.c.x, h: lc.h - Bq.c.h, d: lc.d - Bq.c.d};
        eyeInfo = {l: add3(B!.eyes.l, dv), r: add3(B!.eyes.r, dv), sx: 1 - 0.25 * mu, sy: 1 - 0.3 * mu, d: lc.d, vis: 1};
        headInfo = {c: lc, r: q.re};
      }
    }
    void pos;
  }
  // the stream: ONE neck through the gap (narrower than the gap, stretched tall, carrying the area of everything in
  // transit) + the pour from the gap exit down into the lump; it keeps inside mass, stream and lump one body
  if (sq && transit.m > 1e-6) {
    const g = sq.gap;
    const hm = transit.h / transit.m;
    // sized only by the mass in transit (continuous from zero: no geometry pops when a part starts / ends)
    const rl = Math.min(0.36 * g.w, Math.sqrt(transit.m / Math.PI));
    const Lh = Math.max(0, (transit.m - Math.PI * rl * rl) / (4 * Math.max(rl, 1e-4)));
    const hc = Math.max(hm, rl + Lh + 0.1 * s);
    const r = rl;
    streamR = r;
    const cap = (d: number, rr: number, lh: number): Prim3 => ({k: 'cap3', a: {x: g.x, h: hc - lh, d}, b: {x: g.x, h: hc + lh, d}, ra: rr, rb: rr, g: 5});
    prims3.push(cap(g.d, r, Lh));
    prims3.push(cap(g.d + 0.75 * s, r * 1.2, Lh * 0.85));
    prims3.push(cap(g.d - 0.75 * s, r * 1.15, Lh * 0.8));
    // pour: from the exit face down into the lump
    const lump = B ? lumpOf(B.parts.find((z) => z.id === 'torso')!, 1) : sq.out;
    const ex: P3 = {x: g.x + 0.25 * s, h: hc - 0.4 * s, d: g.d - 0.9 * s};
    const n = 7;
    let prev = ex;
    for (let i = 1; i <= n; i++) {
      const p = pourAt(ex, lump, i / n);
      const rr = r * lerp(0.8, 0.55, i / n);
      prims3.push({k: 'cap3', a: prev, b: p, ra: rr, rb: rr, g: 5});
      prev = p;
    }
  }
  // decals
  const torsoMu = muOf['torso'] ?? 0;
  const headMu = muOf['head'] ?? 0;
  const tc = sq && u >= 1 && B ? lumpOf(A.parts.find((z) => z.id === 'torso')!, 1 - posR.upper) : A.torso.c;
  const panelK = 1 - ss(torsoMu, 0, 0.75);
  const seams: Robot2Rig['seams'] = [];
  const rigidHead = 1 - ss(headMu, 0, 0.5), rigidUp = 1 - ss(torsoMu, 0, 0.5);
  if (rigidUp > 0.02) {
    const tw = (h: number) => lerp(R2.torsoWB, R2.torsoWT, clamp((h - (R2.torsoC - R2.torsoHH)) / (2 * R2.torsoHH)));
    const at = (x: number, h: number) => ({x: tc.x + x * s, h: tc.h + (h - R2.torsoC) * s, d: tc.d - 0.5 * s});
    seams.push({a: at(-tw(6.42) * 0.62, 6.42), b: at(tw(6.42) * 0.62, 6.42), w: rigidUp, bend: -0.08});
    seams.push({a: at(-tw(4.3) * 0.86, 4.3), b: at(tw(4.3) * 0.86, 4.3), w: rigidUp, bend: -0.06});
  }
  if (rigidHead > 0.02) {
    const hc = headInfo.c;
    const ro = A.head.roll;
    const at = (x: number, h: number) => {
      const q = rot2(x, h, 0, 0, -ro);
      return {x: hc.x + q.x * s, h: hc.h + q.y * s, d: hc.d - 0.6 * s};
    };
    seams.push({a: at(-1.5, -1.0), b: at(1.5, -1.0), w: rigidHead, bend: -0.1});
  }
  const earRings = A.ears.map((c) => ({c, r: R2.earR * 0.55 * s, k: rigidHead}));
  const gN = 6;
  const rigid = Array.from({length: gN}, () => 0);
  rigid[1] = 1 - ss(Math.max(softR.lower, sq ? ss(u, 0.5, 0.65) : 0), 0, 0.3);
  rigid[2] = 1 - ss(Math.max(softR.upper, softR.lower * 0.5, sq ? ss(u, 0.2, 0.4) : 0), 0, 0.3);
  rigid[3] = 1 - ss(Math.max(softR.upper, sq ? ss(u, 0.1, 0.3) : 0), 0, 0.3);
  rigid[4] = 1 - ss(Math.max(softR.head, sq ? ss(u, 0, 0.1) : 0), 0, 0.3);
  if (sq && u >= 1) {
    rigid[1] = reformR.lower;
    rigid[2] = reformR.upper;
    rigid[3] = reformR.upper;
    rigid[4] = clamp(reformR.head);
  }
  const liq = (x: number) => lerp(0.06, 0.62, ss(x, 0, 0.8)) * s;
  const lowL = sq ? (u >= 1 ? 1 - reformR.lower : Math.max(softR.lower, ss(u, 0.4, 0.6))) : softR.lower;
  const upL = sq ? (u >= 1 ? 1 - reformR.upper : Math.max(softR.upper, ss(u, 0.1, 0.3))) : softR.upper;
  const hdL = sq ? (u >= 1 ? 1 - clamp(reformR.head) : Math.max(softR.head, ss(u, 0, 0.08))) : softR.head;
  // the stream's blend follows its own thickness (a thin new stream never pulls a big fillet out of the body)
  const groupBlendU = [liq(1), liq(lowL), liq(Math.max(lowL, upL)), liq(upL), liq(hdL), clamp(1.4 * streamR, 0.02 * s, 0.62 * s)];
  for (const p of prims3) p.blend = groupBlendU[p.g ?? 0] * 0.8;
  void out;
  return {
    prims3,
    rigid,
    groupBlendU,
    blendU: liq(Math.max(lowL, upL, hdL)),
    eyes: eyeInfo,
    head: headInfo,
    panel: panelK > 0.02 ? {c: {x: tc.x, h: tc.h + 0.2 * s, d: tc.d - 0.5 * s}, k: panelK, roll: A.torso.roll} : null,
    seams,
    earRings,
    s,
    partArea,
    liquid: Object.values(muOf).some((m) => m > 0.001),
    alpha,
  };
};

/** translate a world prim by v * k */
const shift3 = (p: Prim3, v: P3, k: number): Prim3 => {
  const m = (q: P3) => add3(q, v, k);
  switch (p.k) {
    case 's':
    case 'box3':
    case 'trap3':
    case 'ell3':
    case 'disc3':
      return {...p, p: m(p.p)};
    case 'cap3':
      return {...p, a: m(p.a), b: m(p.b)};
    case 'mix3':
      return {...p, a: shift3(p.a, v, k), b: shift3(p.b, v, k)};
  }
};

// ---------------------------------------------------------------------------------------------------------------
const f1 = (n: number) => n.toFixed(1);

export type Robot2Props = {
  cam: Cam3;
  t: number;
  base: Robot2Base;
  pose: Robot2Pose;
  state?: Robot2State;
  env?: ChromeEnv;
  /** depth pass around a bar row at world depth d0: 'back' (z > d0) / 'front' (z < d0) / 'all' */
  part?: 'all' | 'back' | 'front';
  d0?: number;
  warm?: number;
  floor?: FloorOpts;
  /** cyan eye glow bounce on the chrome (default 0.35) */
  eyeGlow?: number;
  dim?: number;
};

/** the hero robot as one chrome body + decals */
export const Robot2: React.FC<Robot2Props> = ({cam, t, base, pose, state = {}, env, part = 'all', d0 = 0, warm = 0, floor, eyeGlow = 0.35, dim = 0}) => {
  const rig = robot2Rig(base, pose, state, t);
  const prims = projectPrims(cam, rig.prims3);
  if (!prims.length) return null;
  const hs = project(cam, rig.head.c);
  const pxu = hs.s; // px per world unit at the head
  const k = pxu;
  const geo = buildChrome(
    prims,
    {
      blend: rig.blendU * k,
      groupBlend: rig.groupBlendU.map((b) => b * k),
      rigid: rig.rigid,
      groupR: [1.2, 0.75, 1.5, 0.55, 2.0, 1].map((r) => r * rig.s * k),
      groupBand: [1, 0, 1, 0, 1, 1],
      R: 1.45 * rig.s * k,
    },
    part !== 'all',
  );
  if (!geo) return null;
  const el = project(cam, rig.eyes.l), er = project(cam, rig.eyes.r);
  const es = (el.s + er.s) / 2 * rig.s;
  const glows: Glow[] = eyeGlow > 0 ? [{x: (el.x + er.x) / 2, y: (el.y + er.y) / 2 + es * 0.4, r: es * 2.6, color: C.cyan, amt: eyeGlow * pose.glow}] : [];
  // decals (screen)
  const decals: React.ReactNode[] = [];
  for (const sm of rig.seams) {
    const a = project(cam, sm.a), b = project(cam, sm.b);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const nx = -(b.y - a.y) / (L || 1), ny = (b.x - a.x) / (L || 1);
    const c = {x: mx + nx * sm.bend * L, y: my + ny * sm.bend * L};
    decals.push(<path key={'sm' + decals.length} d={`M${f1(a.x)},${f1(a.y)} Q${f1(c.x)},${f1(c.y)} ${f1(b.x)},${f1(b.y)}`} fill="none" stroke={INK} strokeWidth={f1(1.7 * sm.w)} strokeLinecap="round" opacity={0.85} />);
    decals.push(<path key={'sl' + decals.length} d={`M${f1(a.x)},${f1(a.y + 2.2 * sm.w)} Q${f1(c.x)},${f1(c.y + 2.2 * sm.w)} ${f1(b.x)},${f1(b.y + 2.2 * sm.w)}`} fill="none" stroke="#FFFFFF" strokeWidth={f1(1.3 * sm.w)} strokeLinecap="round" opacity={0.6} />);
  }
  for (const er0 of rig.earRings) {
    if (er0.k < 0.02) continue;
    const c = project(cam, er0.c);
    decals.push(<circle key={'er' + decals.length} cx={f1(c.x)} cy={f1(c.y)} r={f1(er0.r * c.s * er0.k)} fill="none" stroke={INK} strokeWidth={f1(1.5 * er0.k)} opacity={0.8} />);
  }
  if (rig.panel) {
    const c = project(cam, rig.panel.c);
    const w = 0.62 * rig.s * c.s * rig.panel.k, h = 0.44 * rig.s * c.s * rig.panel.k;
    const led = {x: c.x + w * 0.5, y: c.y + h * 0.05};
    decals.push(
      <g key="panel" transform={`rotate(${f1(rig.panel.roll)} ${f1(c.x)} ${f1(c.y)})`}>
        <rect x={f1(c.x - w)} y={f1(c.y - h)} width={f1(2 * w)} height={f1(2 * h)} rx={f1(h * 0.55)} fill={C.silverMid} stroke={INK} strokeWidth={f1(1.5 * rig.panel.k)} />
        <rect x={f1(c.x - w * 0.86)} y={f1(c.y - h * 0.8)} width={f1(1.72 * w)} height={f1(0.5 * h)} rx={f1(h * 0.25)} fill={C.silverLit} opacity={0.75} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${f1(c.x - w * 0.62)},${f1(c.y - h * 0.25 + i * h * 0.36)} L${f1(c.x - w * 0.02)},${f1(c.y - h * 0.25 + i * h * 0.36)}`} stroke={INK} strokeWidth={f1(1.2 * rig.panel!.k)} strokeLinecap="round" opacity={0.75} />
        ))}
        <circle cx={f1(led.x)} cy={f1(led.y)} r={f1(h * 0.28)} fill={C.cyan} stroke={INK} strokeWidth={1} />
        <circle cx={f1(led.x - h * 0.08)} cy={f1(led.y - h * 0.08)} r={f1(h * 0.1)} fill={C.cyanCore} />
      </g>,
    );
  }
  decals.push(
    <EyesAt key="eyes" l={{x: el.x, y: el.y}} r={{x: er.x, y: er.y}} s={es} sx={rig.eyes.sx} sy={rig.eyes.sy} open={pose.eyeOpen} lookX={pose.lookX} lookY={pose.lookY} mood={pose.mood} glow={pose.glow} wl={1 - 0.3 * Math.max(0, -pose.headTurn)} wr={1 - 0.3 * Math.max(0, pose.headTurn)} />,
  );
  return (
    <ChromePaint geo={geo} env={env} warm={warm} glows={glows} floor={floor} depthSplit={part !== 'all' ? {d0, part} : undefined} dim={dim}>
      {decals}
    </ChromePaint>
  );
};

/** the head on screen (centre, radius px) for shape matches (e.g. the FU -> J1 chrome-sphere hand-off) */
export const robot2HeadScreen = (cam: Cam3, base: Robot2Base, pose: Robot2Pose, state: Robot2State = {}, t = 0) => {
  const rig = robot2Rig(base, pose, state, t);
  const c = project(cam, rig.head.c);
  return {x: c.x, y: c.y, r: R2.headHW * rig.s * c.s};
};

/** the grip pose: hands on two world points (e.g. the bars either side of the gap) */
export const gripPose = (pose: RobotPose, l: P3, r: P3, k = 1): Robot2Pose => ({...pose, gripL: l, gripR: r, grip: k});
