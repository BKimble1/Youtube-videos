// V2 hero robot: the V1 character (src/art/robot.tsx: 10 u tall, a rounded DOME head with ear discs, two big cyan eyes,
// compact torso with a small chest panel, small arms and legs, simple joints) rebuilt as world-space SDF primitives,
// rendered as ONE polished chrome body by the liquid engine, so it can stand / grip bars, soften regionally, squeeze
// through a gap narrower than its head and reform exactly.
//
// Rig. Every part is a world prim (sphere, capsule, billboard superellipse dome / rounded box / trapezoid) posed like V1
// (lean, head roll, shoulder / elbow / hip / knee angles, or IK grips on bars). Each part also has a LIQUID shape (a
// sphere of the part's equivalent radius) and the drawn prim is mix(rigid, liquid, mu) with mu from the part's softness,
// so softening, flowing and reforming are one continuous deformation of the same field.
//   soften  {head, upper, lower} 0..1: the region rounds off, sags under gravity and its blend radius grows;
//   press   0..1: the upper body leans into the bars (the face presses into the gap before anything flows);
//   squeeze {gap, out, u}: part by part (head first ... feet last) the material goes THROUGH the gap: each part's area
//           splits into an inside remainder (pressed against the bars, draining toward the gap), a share in the NECK
//           (one continuous slab of liquid standing IN the gap, narrower than the gap, carrying everything in transit)
//           and an outside front (it bulges out right at the gap exit, then slides down into the lump at `out`); the
//           three shares always sum to the part's area. A pour from the neck's outer face keeps neck and lump one body.
//   reform  0..1: the collected lump rises back into the rigid pose at `out` (legs, then body, then the head with a
//           crisp overshoot snap), landing exactly on the rigid silhouette.
// Decals ride their part: eyes (V1 EyesAt look) follow the head's material (inside -> squeezed in the neck -> on the
// outside bulge), the chest-panel LED glint follows the torso's material, finger lines wrap the bars while gripping.
import React from 'react';
import {C, INK} from '../art/palette';
import {EyesAt} from '../art/liquid';
import {POSE_IDLE, POSE_SURPRISED, RobotPose} from '../art/robot';
import {Cam3, P3, project} from '../world';
import {clamp, keyS, lerp, noise1, ss} from '../lib';
import {Prim3, projectPrims} from './liquid/sdf';
import {unionArea} from './liquid/flow';
import {buildChrome, ChromeEnv, ChromePaint, FloorOpts, Glow} from './liquid/Chrome';

export type Robot2Pose = RobotPose & {
  /** world grip points ON THE BARS (bar axis at the grip height; screen-left arm = l). Overrides the arm angles: the
   *  mitten hand wraps the front of the bar, the forearm comes from behind it. */
  gripL?: P3;
  gripR?: P3;
  /** 0..1 how much the grip IK is applied */
  grip?: number;
};
export type Robot2Base = P3 & {s?: number};
export type Robot2Gap = {x: number; d: number; w: number};
export type Robot2State = {
  soften?: {head?: number; upper?: number; lower?: number};
  /** 0..1 the upper body leans into the bars toward the gap (face pressed into the gap). Needs `squeeze.gap`. */
  press?: number;
  squeeze?: {gap: Robot2Gap; out: P3; u: number; outPose?: Robot2Pose};
  reform?: number;
  /** liquid surface wobble amount (default 1) */
  wobble?: number;
};

export const R2 = {
  headC: 8.4, headHW: 1.95, headHH: 1.6, headR: 1.25,
  /** the dome: superellipse half-heights / exponents (V1: 2.35 top, 3.1 bottom) */
  headTop: 1.62, headBot: 1.52, headNT: 2.3, headNB: 3.0,
  earX: 2.02, earH: 8.3, earR: 0.42,
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
const lerp3 = (a: P3, b: P3, u: number): P3 => ({x: lerp(a.x, b.x, u), h: lerp(a.h, b.h, u), d: lerp(a.d, b.d, u)});

// superellipse area factor: area of the half (top or bottom) = rx * ry * supK(n)
const gam = (x: number): number => {
  // Lanczos approximation (x > 0)
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * gam(1 - x));
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
};
const supK = (n: number) => (2 * gam(1 + 1 / n) ** 2) / gam(1 + 2 / n);
const HEAD_AREA = R2.headHW * (R2.headTop * supK(R2.headNT) + R2.headBot * supK(R2.headNB));

// ---------------------------------------------------------------------------------------------------------------
// posed rigid parts (world), V1 construction
type Hand = {c: P3; side: number; grip: number; rx: number; ry: number};
type Posed = {parts: Part[]; head: {c: P3; roll: number; turn: number}; torso: {c: P3; roll: number}; s: number; eyes: {l: P3; r: P3}; ears: P3[]; hands: Hand[]};

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
  const hands: Hand[] = [];
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
    let hd = {x: wr.x + (wr.x - elb.x) * 0.25, y: wr.y + (wr.y - elb.y) * 0.25};
    let hdD = 0;
    const tgt = side < 0 ? P.gripL : P.gripR;
    const gk = tgt ? grip : 0;
    if (tgt && grip > 0) {
      // the mitten wraps the FRONT of the bar (slightly inboard), the wrist sits behind the bar: 3D two-bone IK to
      // the wrist, elbow pulled down and out by a pole vector
      const B = {x: (tgt.x - base.x) / s, y: (tgt.h - base.h) / s, z: (tgt.d - base.d) / s};
      const T = {x: B.x - side * 0.3, y: B.y - 0.12, z: B.z + 0.5};
      const S = {x: sh.x, y: sh.y, z: 0};
      let dx = T.x - S.x, dy = T.y - S.y, dz = T.z - S.z;
      const D0 = Math.hypot(dx, dy, dz) || 1e-3;
      const D = clamp(D0, 0.3, R2.upper + R2.fore - 0.02);
      dx /= D0;
      dy /= D0;
      dz /= D0;
      const aa = (R2.upper * R2.upper + D * D - R2.fore * R2.fore) / (2 * D);
      const hh = Math.sqrt(Math.max(0, R2.upper * R2.upper - aa * aa));
      let px = side * 0.45, py = -1, pz = 0.9;
      const pd = px * dx + py * dy + pz * dz;
      px -= pd * dx;
      py -= pd * dy;
      pz -= pd * dz;
      const pl = Math.hypot(px, py, pz) || 1;
      const e1 = {x: S.x + dx * aa + (px / pl) * hh, y: S.y + dy * aa + (py / pl) * hh, z: S.z + dz * aa + (pz / pl) * hh};
      const w1 = {x: S.x + dx * D, y: S.y + dy * D, z: S.z + dz * D};
      elb = {x: lerp(elb.x, e1.x, grip), y: lerp(elb.y, e1.y, grip)};
      wr = {x: lerp(wr.x, w1.x, grip), y: lerp(wr.y, w1.y, grip)};
      elbD = e1.z * grip;
      handD = w1.z * grip;
      // the hand: on the bar's front, a touch inboard
      const hb = {x: B.x - side * 0.08, y: B.y, z: B.z - 0.5};
      hd = {x: lerp(hd.x, hb.x, grip), y: lerp(hd.y, hb.y, grip)};
      hdD = lerp(handD, hb.z, grip);
    } else hdD = handD;
    const hrx = lerp(0.5, 0.56, gk), hry = lerp(0.44, 0.5, gk);
    parts.push({id: 'shoulder' + tag, g: 3, region: 'upper', sigma: 0.18, rigid: {k: 's', p: W(sh.x, sh.y, -0.05), r: 0.5 * s}, c: W(sh.x, sh.y), re: 0.5 * s});
    parts.push({id: 'upper' + tag, g: 3, region: 'upper', sigma: 0.22, rigid: {k: 'cap3', a: W(sh.x, sh.y, -0.05), b: W(elb.x, elb.y, elbD), ra: 0.36 * s, rb: 0.33 * s}, c: W((sh.x + elb.x) / 2, (sh.y + elb.y) / 2, elbD * 0.5), re: Math.sqrt(capArea(R2.upper, 0.36, 0.33) / Math.PI) * s});
    parts.push({id: 'fore' + tag, g: 3, region: 'upper', sigma: 0.3, rigid: {k: 'cap3', a: W(elb.x, elb.y, elbD), b: W(wr.x, wr.y, handD), ra: 0.32 * s, rb: 0.3 * s}, c: W((elb.x + wr.x) / 2, (elb.y + wr.y) / 2, (elbD + handD) / 2), re: Math.sqrt(capArea(R2.fore, 0.32, 0.3) / Math.PI) * s});
    parts.push({id: 'elbow' + tag, g: 3, region: 'upper', sigma: 0.26, rigid: {k: 's', p: W(elb.x, elb.y, elbD - 0.05), r: 0.34 * s}, c: W(elb.x, elb.y, elbD), re: 0.34 * s});
    const hc = W(hd.x, hd.y, hdD - 0.05 * (1 - gk));
    parts.push({id: 'hand' + tag, g: 3, region: 'upper', sigma: 0.34, rigid: {k: 'ell3', p: hc, rx: hrx * s, ry: hry * s}, c: hc, re: Math.sqrt(hrx * hry) * s});
    hands.push({c: hc, side, grip: gk, rx: hrx * s, ry: hry * s});
  }
  // ---- head (V1 dome: rounder on top, squarer jaw) + ear discs
  const hc = headPt(0, R2.headC);
  const roll = P.lean + P.headTilt;
  const tn = clamp(P.headTurn, -1, 1);
  parts.push({id: 'head', g: 4, region: 'head', sigma: 0, rigid: {k: 'sup3', p: W(hc.x, hc.y), rx: R2.headHW * s, ryT: R2.headTop * s, ryB: R2.headBot * s, nT: R2.headNT, nB: R2.headNB, rot: roll}, c: W(hc.x, hc.y), re: Math.sqrt(HEAD_AREA / Math.PI) * s});
  const ears: P3[] = [];
  for (const side of [-1, 1]) {
    const kx = clamp(1 - 0.45 * side * tn, 0.55, 1.06);
    const e = headPt(side * R2.earX * kx - tn * 0.15, R2.earH);
    const p = W(e.x, e.y, 0.15);
    ears.push(p);
    parts.push({id: 'ear' + (side < 0 ? 'L' : 'R'), g: 4, region: 'head', sigma: 0.04, rigid: {k: 'ell3', p, rx: 0.36 * kx * s, ry: R2.earR * s, rot: roll}, c: p, re: Math.sqrt(0.36 * kx * R2.earR) * s});
  }
  const sep = R2.eyeSep * (1 - 0.12 * Math.abs(tn));
  const el = headPt(-sep + tn * 0.55, R2.headC + R2.eyeDh), er = headPt(sep + tn * 0.55, R2.headC + R2.eyeDh);
  return {parts, head: {c: W(hc.x, hc.y), roll, turn: tn}, torso: {c: W(tc.x, tc.y), roll: P.lean}, s, eyes: {l: W(el.x, el.y, -0.4), r: W(er.x, er.y, -0.4)}, ears, hands};
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
  /** gripping hands (finger lines), k = rigidity */
  hands: {c: P3; side: number; k: number; rx: number; ry: number}[];
  /** the chest-panel LED glint riding the torso's material while liquid (k = visibility) */
  led: {c: P3; k: number} | null;
  s: number;
  /** total part area (sum of pi re^2) in world units^2 (conserved by construction) */
  partArea: number;
  /** any part not rigid */
  liquid: boolean;
  /** the liquid-shape scale solved for the area */
  alpha: number;
  /** the neck in the gap (world centre, half height, radius) while material is in transit, else null */
  neck: {c: P3; lh: number; r: number} | null;
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

/** the robot's world prims + decal frames for a pose and state (pure). While any part is liquid, one scale on the
 *  liquid shapes is solved so the body's projected area stays equal to the rigid body's (no shrinking lump). The area
 *  is measured in TWO orthographic views (front and side) and averaged, so material lined up in depth while it flows
 *  through the bars (inside remainder, neck, outside front) is not mistaken for lost area. */
export const robot2Rig = (base: Robot2Base, pose: Robot2Pose, state: Robot2State = {}, t = 0): Robot2Rig => {
  const r1 = rigAlpha(base, pose, state, t, 1);
  if (!r1.liquid) return r1;
  const s = base.s ?? 1;
  const camF: Cam3 = {x: base.x, h: base.h + 7 * s, d: base.d - 1000, yaw: 0, pitch: 0, f: 100000};
  const camS: Cam3 = {x: base.x - 1000, h: base.h + 7 * s, d: base.d, yaw: 90, pitch: 0, f: 100000};
  const k = 100 / s;
  // targets: the rigid inside pose's areas, easing to the outside pose's as the body collects (no target jump)
  const sq = state.squeeze;
  const tgt = (cam: Cam3) => {
    const aIn = rigidFrontArea(base, pose, {}, cam, k);
    return sq ? lerp(aIn, rigidFrontArea(base, pose, {...state, squeeze: {...sq, u: 1}}, cam, k), ss(sq.u, 0.55, 1)) : aIn;
  };
  const tF = tgt(camF), tS = tgt(camS);
  const err = (r: Robot2Rig) => 0.5 * (unionArea(projectPrims(camF, r.prims3), r.blendU * k, 70) / tF + unionArea(projectPrims(camS, r.prims3), r.blendU * k, 70) / tS) - 1;
  let xa = 1, fa = err(r1);
  let xb = fa > 0 ? 0.93 : 1.08;
  let rb = rigAlpha(base, pose, state, t, xb);
  let fb = err(rb);
  for (let i = 0; i < 6 && Math.abs(fb) > 0.004; i++) {
    const den = fb - fa;
    const xn = clamp(Math.abs(den) < 1e-9 ? xb : xb - (fb * (xb - xa)) / den, 0.6, 1.5);
    xa = xb;
    fa = fb;
    xb = xn;
    rb = rigAlpha(base, pose, state, t, xb);
    fb = err(rb);
  }
  return rb;
};
const RIGID_CACHE = new Map<string, number>();
/** projected area of the rigid body in an orthographic view (inside pose; the outside pose once the squeeze is done) */
const rigidFrontArea = (base: Robot2Base, pose: Robot2Pose, state: Robot2State, cam: Cam3, k: number) => {
  const sq = state.squeeze;
  const useOut = !!sq && sq.u >= 1;
  const key = JSON.stringify([base, useOut ? sq!.outPose ?? null : pose, useOut, cam.yaw]);
  const hit = RIGID_CACHE.get(key);
  if (hit !== undefined) return hit;
  const P = useOut ? robot2Posed({...sq!.out, s: base.s}, sq!.outPose ?? POSE_IDLE) : robot2Posed(base, pose);
  const prims = projectPrims(cam, P.parts.map((q) => ({...q.rigid, g: q.g, blend: 0.06 * P.s})));
  const a = unionArea(prims, 0.06 * P.s * k, 70);
  RIGID_CACHE.set(key, a);
  if (RIGID_CACHE.size > 32) RIGID_CACHE.delete(RIGID_CACHE.keys().next().value as string);
  return a;
};

/** when a part starts its transit through the gap (squeeze u), and how long it takes */
const SIG_MAX = 0.85, T_START = 0.6, T_DUR = 0.4;
const lamOf = (u: number, sigma: number) => clamp((u - (T_START * sigma) / SIG_MAX) / T_DUR);

const rigAlpha = (base: Robot2Base, pose: Robot2Pose, state: Robot2State, t: number, alpha: number): Robot2Rig => {
  const A = robot2Posed(base, pose);
  const s = A.s;
  const sq = state.squeeze;
  const B = sq ? robot2Posed({...sq.out, s}, sq.outPose ?? POSE_IDLE) : null;
  const sf = state.soften ?? {};
  const softR: Record<Region, number> = {head: clamp(sf.head ?? 0), upper: clamp(sf.upper ?? 0), lower: clamp(sf.lower ?? 0)};
  const u = sq ? clamp(sq.u) : 0;
  const press = sq ? clamp(state.press ?? 0) : 0;
  // the reform only acts once the whole body has arrived (squeeze.u = 1): start it after the squeeze ends
  const rf = clamp(state.reform ?? 0) * (sq ? ss(sq.u, 0.985, 1) : 1);
  const wob = state.wobble ?? 1;
  const prims3: Prim3[] = [];
  // reform: positions rise together (legs a touch first, the head riding on top with a small overshoot "snap"),
  // shapes go rigid bottom-up and the head's shape snaps last
  const headRise = (x: number) => (x < 0.72 ? 1.07 * ss(x / 0.72, 0, 1) : 1.07 - 0.07 * ss((x - 0.72) / 0.28, 0, 1));
  const posR: Record<Region, number> = {lower: ss(rf, 0, 0.6), upper: ss(rf, 0.04, 0.66), head: headRise(clamp((rf - 0.08) / 0.7))};
  const reformR: Record<Region, number> = {lower: ss(rf, 0.12, 0.62), upper: ss(rf, 0.26, 0.78), head: ss(rf, 0.6, 0.84)};
  // the collected lump outside: parts sag into a wide low mound (c = 1) and rise back to rigid (c = 0)
  const lumpOf = (q: Part, c: number): P3 => {
    const b = B ? B.parts.find((z) => z.id === q.id)! : q;
    const bx = sq ? sq.out.x : base.x;
    const hh = b.c.h - (sq ? sq.out.h : base.h);
    const k = c;
    // a living lump: slow deterministic wobble while liquid
    const wx = 0.22 * s * k * noise1(t * 1.7 + q.sigma * 11, 5) * wob, wh = 0.16 * s * k * noise1(t * 2.1 + q.sigma * 13, 6) * wob;
    const P0 = {x: bx + (b.c.x - bx) * (1 + 0.55 * k) + wx, h: (sq ? sq.out.h : base.h) + q.re * 0.6 * k + hh * (1 - 0.86 * k) + wh, d: b.c.d + (q.id === 'head' ? -0.3 * s : 0) * k};
    if (q.region === 'head' && q.id !== 'head') {
      // ears / neck stay attached to the head's lump (pulled in as it goes liquid)
      const hq = A.parts.find((z) => z.id === 'head')!;
      const hb = B ? B.parts.find((z) => z.id === 'head')! : hq;
      const H0 = lumpOf(hq, c);
      // (ears stay tucked into the head's liquid until the head's shape snaps back: no brim of fillets on the way up)
      const kin = Math.max(k, sq && u >= 1 ? 1 - reformR.head : 0);
      return {x: H0.x + (b.c.x - hb.c.x) * (1 - 0.6 * kin), h: H0.h + (b.c.h - hb.c.h) * (1 - 0.45 * kin), d: H0.d + (b.c.d - hb.c.d)};
    }
    return P0;
  };
  let partArea = 0;
  const transit = {m: 0, h: 0};
  let streamR = 0;
  let neckInfo: Robot2Rig['neck'] = null;
  let headInfo = {c: A.head.c, r: A.parts.find((p) => p.id === 'head')!.re};
  let eyeInfo = {l: A.eyes.l, r: A.eyes.r, sx: 1, sy: 1, d: A.head.c.d, vis: 1};
  let ledInfo: {c: P3; k: number} | null = null;
  const muOf: Record<string, number> = {};
  const g = sq?.gap;
  // press: the upper body leans into the bars (head most), never through them
  const pressOf = (q: Part) => (g ? press * (q.region === 'head' ? 0.62 : q.region === 'upper' ? 0.38 : 0.12) * Math.max(0, base.d - g.d) : 0);
  const sagH = (q: Part) => (q.region === 'head' ? 1.2 : q.region === 'upper' ? 0.7 : 0.25) * s * softR[q.region] * softR[q.region];
  // pre-pass: the neck's height = area-weighted height of everything in transit (at its inside position)
  let preM = 0, preH = 0;
  for (const q of A.parts) {
    const lam = sq ? lamOf(u, q.sigma) : 0;
    const w = 2 * lam * (1 - lam) * q.re * q.re + 1e-6 * (lam > 0 && lam < 1 ? 1 : 0);
    preM += w;
    preH += w * (q.c.h - sagH(q));
  }
  const hcG = preM > 1e-9 ? preH / preM : A.head.c.h;
  for (const q of A.parts) {
    partArea += Math.PI * q.re * q.re;
    const soft = softR[q.region];
    const lam = sq ? lamOf(u, q.sigma) : 0;
    // after arrival: collected (c = 1) until reform lifts it
    const cOut = 1 - posR[q.region];
    // liquid amount: soft inside; a part in transit goes liquid as it starts to pour (its remainder keeps a hint of its
    // shape for a moment); back to rigid with the reform
    let mu = ss(soft, 0, 0.7);
    if (sq && lam > 0) mu = Math.max(mu, ss(lam, 0.05, 0.35));
    if (sq && lam >= 1) mu = clamp(1 - reformR[q.region]);
    muOf[q.id] = mu;
    // soft sag (inside): the region slumps and spreads a little; wobble on the liquid surface; press toward the bars
    const sag = soft * soft;
    const ph = noise1(t * 1.3 + q.sigma * 7, 3) * wob;
    const pd = pressOf(q);
    const A0: P3 = {
      x: q.c.x + (q.c.x - A.torso.c.x) * 0.18 * sag + 0.08 * s * ph * soft + (g ? (g.x - q.c.x) * 0.15 * (pd > 0 ? press : 0) : 0),
      h: q.c.h - sagH(q),
      d: q.c.d - pd,
    };
    let liquid: Prim3;
    let rigidP = q.rigid;
    if (!sq || lam <= 0) {
      liquid = {k: 's', p: A0, r: q.re * alpha * (1 + 0.04 * ph * soft)};
      // the rigid shape rides the sag / press
      rigidP = shift3(q.rigid, {x: A0.x - q.c.x, h: A0.h - q.c.h, d: A0.d - q.c.d}, 1);
    } else if (lam >= 1) {
      // arrived: the liquid lump at the collected position; rigid shape = the outside pose (for the reform)
      const Bq = B!.parts.find((z) => z.id === q.id)!;
      const lc = lumpOf(q, cOut);
      liquid = {k: 's', p: lc, r: q.re * alpha};
      rigidP = shift3(Bq.rigid, {x: lc.x - Bq.c.x, h: lc.h - Bq.c.h, d: lc.d - Bq.c.d}, 1);
    } else {
      // in transit: inside remainder (1-l)^2 + neck 2l(1-l) + outside front l^2 = 1 (the part's area is exact at every l)
      const gg = g!;
      const fT = (1 - lam) * (1 - lam), fS = 2 * lam * (1 - lam), fF = lam * lam;
      const rt = q.re * alpha * Math.sqrt(fT), rf2 = q.re * alpha * Math.sqrt(fF);
      const k0 = ss(lam, 0, 0.6);
      // the remainder is pulled against the bars toward the gap (compressed: it spreads behind the bars)
      const tail: P3 = {
        x: lerp(A0.x, gg.x + (A0.x - gg.x) * 0.4, k0),
        h: lerp(A0.h, lerp(A0.h, hcG, 0.55), k0),
        d: lerp(A0.d, gg.d + 0.3 * s + 0.75 * rt, k0),
      };
      const aS = fS * Math.PI * q.re * q.re * alpha * alpha;
      transit.m += aS;
      transit.h += aS * A0.h;
      // the front: bulges out right at the gap exit (at the neck's height), then slides down into its lump place
      const hx = lerp(A0.h, hcG, 0.7);
      // the head's front (the FACE) bulges out at the gap exit and droops like a forming drop before it pours down into
      // the lump; every other part's material runs straight down the pour into the lump on the floor
      const isHead = q.id === 'head';
      const ex: P3 = {x: gg.x, h: hx - (isHead ? 0.6 * s * ss(lam, 0.1, 0.4) : 0), d: gg.d - 0.5 * s - 0.9 * rf2};
      const front = pourAt(ex, lumpOf(q, 1), isHead ? ss(lam, 0.3, 0.92) : ss(lam, 0.1, 0.65));
      liquid = {k: 's', p: tail, r: rt};
      rigidP = shift3(q.rigid, {x: tail.x - q.c.x, h: tail.h - q.c.h, d: tail.d - q.c.d}, 1);
      if (rf2 > 0.01) prims3.push({k: 's', p: front, r: rf2, g: q.g});
      if (q.id === 'head') {
        // the FACE goes first: eyes ride the head's material from the inside, squeezed through the neck, onto the
        // outside bulge (they never leave the material)
        const a = ss(lam, 0.04, 0.4), b = ss(lam, 0.38, 0.8);
        const ein: P3 = {x: tail.x, h: tail.h + R2.eyeDh * s, d: tail.d - 0.5 * s};
        const eneck: P3 = {x: gg.x, h: lerp(tail.h, hx, 0.6) + R2.eyeDh * s, d: gg.d - 0.5 * s};
        const eout: P3 = {x: front.x, h: front.h + 0.15 * rf2, d: front.d - 0.6 * rf2};
        const ec = lerp3(lerp3(ein, eneck, a), eout, b);
        const sqz = a * (1 - b);
        const narrow = lerp(lerp(1, 0.8, press), 0.56, sqz) * lerp(1, 0.9, b * (1 - ss(lam, 0.9, 1)));
        const ox = R2.eyeSep * s * narrow;
        eyeInfo = {l: {x: ec.x - ox, h: ec.h, d: ec.d}, r: {x: ec.x + ox, h: ec.h, d: ec.d}, sx: narrow * lerp(1, 0.9, sqz), sy: 1 + 0.32 * sqz, d: ec.d, vis: 1};
        headInfo = {c: lerp3(tail, front, b), r: q.re * lerp(Math.sqrt(fT), Math.sqrt(fF), b)};
      }
      if (q.id === 'torso') ledInfo = {c: fF > fT ? {x: front.x + 0.25 * rf2, h: front.h + 0.2 * rf2, d: front.d - 0.7 * rf2} : {x: tail.x + 0.25 * rt, h: tail.h + 0.2 * rt, d: tail.d - 0.7 * rt}, k: 1};
    }
    prims3.push(mu >= 1 ? {...liquid, g: q.g} : mu <= 0 ? {...rigidP, g: q.g} : {k: 'mix3', a: rigidP, b: liquid, t: mu, g: q.g});
    if (q.id === 'head') {
      if (!sq || lam <= 0) {
        const dv = {x: A0.x - q.c.x, h: A0.h - q.c.h, d: A0.d - q.c.d};
        // pressed into the gap, the face is squeezed: the eyes move closer and narrow
        const nP = lerp(1, 0.8, press);
        const mid = {x: (A.eyes.l.x + A.eyes.r.x) / 2, h: (A.eyes.l.h + A.eyes.r.h) / 2, d: A.eyes.l.d};
        const sq2 = (e: P3): P3 => add3({x: mid.x + (e.x - mid.x) * nP, h: e.h, d: e.d}, dv);
        eyeInfo = {l: sq2(A.eyes.l), r: sq2(A.eyes.r), sx: (1 - 0.1 * mu) * nP, sy: (1 - 0.12 * mu) * lerp(1, 1.08, press), d: A0.d, vis: 1};
        headInfo = {c: A0, r: q.re};
      } else if (lam >= 1) {
        const Bq = B!.parts.find((z) => z.id === 'head')!;
        const lc = lumpOf(q, cOut);
        const dv = {x: lc.x - Bq.c.x, h: lc.h - Bq.c.h, d: lc.d - Bq.c.d};
        eyeInfo = {l: add3(B!.eyes.l, dv), r: add3(B!.eyes.r, dv), sx: 1 - 0.25 * mu, sy: 1 - 0.3 * mu, d: lc.d, vis: 1};
        headInfo = {c: lc, r: q.re};
      }
    }
    if (q.id === 'torso' && mu > 0.02 && (!sq || lam <= 0 || lam >= 1)) {
      const c0 = !sq || lam <= 0 ? A0 : lumpOf(q, cOut);
      ledInfo = {c: {x: c0.x + 0.5 * s, h: c0.h + 0.2 * s, d: c0.d - 0.7 * s}, k: ss(mu, 0.02, 0.4)};
    }
  }
  // the NECK: one slab of liquid standing in the gap (narrower than the gap, tall, spanning the bars' depth), carrying
  // the area of everything in transit, + the pour from its outer face down into the lump: one continuous body
  if (sq && g && transit.m > 1e-6) {
    const hm = transit.h / transit.m;
    // sized only by the mass in transit (continuous from zero: no geometry pops when a part starts / ends)
    // a pinched neck: narrower than the gap AND than the masses either side (any excess stays in the remainder /
    // front: the area solve rescales the liquid shapes, so the total is still exact)
    const rl = Math.min(0.22 * g.w, Math.sqrt(transit.m / Math.PI));
    const Lh = Math.min(0.6 * s, Math.max(0, (transit.m - Math.PI * rl * rl) / (4 * Math.max(rl, 1e-4))));
    const hc = Math.max(lerp(hm, hcG, 0.5), rl + Lh + 0.1 * s);
    streamR = rl;
    neckInfo = {c: {x: g.x, h: hc, d: g.d}, lh: Lh, r: rl};
    const cap = (dd: number, rr: number, lh: number): Prim3 => ({k: 'cap3', a: {x: g.x, h: hc - lh, d: g.d + dd}, b: {x: g.x, h: hc + lh, d: g.d + dd}, ra: rr, rb: rr, g: 5});
    prims3.push(cap(0, rl, Lh));
    prims3.push(cap(0.55 * s, rl * 1.12, Lh * 0.92));
    prims3.push(cap(-0.55 * s, rl * 1.1, Lh * 0.9));
    // pour: from the outer face down into the lump (thins as the inside empties)
    const lump = B ? lumpOf(B.parts.find((z) => z.id === 'torso')!, 1) : sq.out;
    const ex: P3 = {x: g.x, h: hc - 0.5 * Lh, d: g.d - 0.9 * s};
    const n = 6;
    let prev = ex;
    const pr = rl * ss(u, 0.1, 0.24);
    // the pour never runs ahead of the leading material (the face's front): it grows down from the exit with it
    const reach = ss(lamOf(u, 0), 0.3, 0.92);
    if (pr > 0.01 && reach > 0.02) {
      for (let i = 1; i <= n; i++) {
        const p = pourAt(ex, lump, (reach * i) / n);
        const rr = pr * lerp(0.85, 0.6, i / n);
        prims3.push({k: 'cap3', a: prev, b: p, ra: rr, rb: rr, g: 5});
        prev = p;
      }
    }
  }
  // decals
  const torsoMu = muOf['torso'] ?? 0;
  const headMu = muOf['head'] ?? 0;
  const torsoPart = A.parts.find((z) => z.id === 'torso')!;
  const tLam = sq ? lamOf(u, torsoPart.sigma) : 0;
  const tc = sq && u >= 1 && B ? lumpOf(torsoPart, 1 - posR.upper) : {...A.torso.c, d: A.torso.c.d - pressOf(torsoPart)};
  const panelK = (1 - ss(torsoMu, 0, 0.75)) * (tLam > 0 && tLam < 1 ? 0 : 1);
  const seams: Robot2Rig['seams'] = [];
  const rigidUp = 1 - ss(torsoMu, 0, 0.5);
  if (rigidUp > 0.02 && !(tLam > 0 && tLam < 1)) {
    const tw = (h: number) => lerp(R2.torsoWB, R2.torsoWT, clamp((h - (R2.torsoC - R2.torsoHH)) / (2 * R2.torsoHH)));
    const at = (x: number, h: number) => ({x: tc.x + x * s, h: tc.h + (h - R2.torsoC) * s, d: tc.d - 0.5 * s});
    seams.push({a: at(-tw(6.42) * 0.62, 6.42), b: at(tw(6.42) * 0.62, 6.42), w: rigidUp, bend: -0.08});
    seams.push({a: at(-tw(4.3) * 0.86, 4.3), b: at(tw(4.3) * 0.86, 4.3), w: rigidUp, bend: -0.06});
  }
  const rigidHead = 1 - ss(headMu, 0, 0.5);
  const hLam = sq ? lamOf(u, 0) : 0;
  const earRings = A.ears.map((c) => ({c: {...c, d: c.d - (g ? press * 0.62 * Math.max(0, base.d - g.d) : 0)}, r: R2.earR * 0.55 * s, k: hLam > 0 && hLam < 1 ? 0 : rigidHead}));
  if (sq && u >= 1 && B) {
    // after the escape the decals ride the reformed (outside) body
    const hq = A.parts.find((z) => z.id === 'head')!;
    const lc = lumpOf(hq, 1 - posR.head);
    const Bh = B.parts.find((z) => z.id === 'head')!;
    for (let i = 0; i < earRings.length; i++) earRings[i] = {c: add3(B.ears[i], {x: lc.x - Bh.c.x, h: lc.h - Bh.c.h, d: lc.d - Bh.c.d}), r: R2.earR * 0.55 * s, k: rigidHead};
  }
  const armMu = Math.max(muOf['handL'] ?? 0, muOf['handR'] ?? 0);
  // (finger lines only while the gripping hands are still the inside pose's: gone once the hands start to flow)
  const handGone = sq ? ss(lamOf(u, 0.34), 0, 0.04) : 0;
  const hands = A.hands.filter((h) => h.grip > 0.3).map((h) => ({c: {...h.c}, side: h.side, k: h.grip * (1 - ss(armMu, 0, 0.35)) * (1 - handGone), rx: h.rx, ry: h.ry})).filter((h) => h.k > 0.02);
  const gN = 6;
  const rigid = Array.from({length: gN}, () => 0);
  rigid[1] = 1 - ss(Math.max(softR.lower, sq ? ss(u, 0.5, 0.65) : 0), 0, 0.3);
  rigid[2] = 1 - ss(Math.max(softR.upper, softR.lower * 0.5, sq ? ss(u, 0.2, 0.4) : 0), 0, 0.3);
  rigid[3] = 1 - ss(Math.max(softR.upper, sq ? ss(u, 0.1, 0.3) : 0), 0, 0.3);
  rigid[4] = 1 - ss(Math.max(softR.head, sq ? ss(u, 0.03, 0.16) : 0), 0, 0.3);
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
    hands,
    led: panelK > 0.6 || !ledInfo ? null : {c: ledInfo.c, k: ledInfo.k * (1 - ss(panelK, 0.1, 0.6))},
    s,
    partArea,
    liquid: Object.values(muOf).some((m) => m > 0.001),
    alpha,
    neck: neckInfo,
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
    case 'sup3':
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
      groupR: [1.2, 0.62, 1.5, 0.5, 2.1, 1].map((r) => r * rig.s * k),
      groupBand: [1, 0.35, 1, 0.35, 1, 1],
      groupHorizon: [0, 0, -0.14, 0, -0.32, 0],
      R: 1.5 * rig.s * k,
    },
    part !== 'all',
  );
  if (!geo) return null;
  const el = project(cam, rig.eyes.l), er = project(cam, rig.eyes.r);
  const es = ((el.s + er.s) / 2) * rig.s;
  const glows: Glow[] = eyeGlow > 0 ? [{x: (el.x + er.x) / 2, y: (el.y + er.y) / 2 + es * 0.3, r: es * 1.35, color: C.cyan, amt: eyeGlow * 0.45 * pose.glow}] : [];
  // decals (screen)
  const decals: React.ReactNode[] = [];
  for (const sm of rig.seams) {
    const a = project(cam, sm.a), b = project(cam, sm.b);
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const nx = -(b.y - a.y) / (L || 1), ny = (b.x - a.x) / (L || 1);
    const c = {x: mx + nx * sm.bend * L, y: my + ny * sm.bend * L};
    const w = Math.max(1.4, 0.035 * rig.s * a.s) * sm.w;
    decals.push(<path key={'sm' + decals.length} d={`M${f1(a.x)},${f1(a.y)} Q${f1(c.x)},${f1(c.y)} ${f1(b.x)},${f1(b.y)}`} fill="none" stroke={INK} strokeWidth={f1(w)} strokeLinecap="round" opacity={0.85} />);
    decals.push(<path key={'sl' + decals.length} d={`M${f1(a.x)},${f1(a.y + 1.3 * w)} Q${f1(c.x)},${f1(c.y + 1.3 * w)} ${f1(b.x)},${f1(b.y + 1.3 * w)}`} fill="none" stroke="#FFFFFF" strokeWidth={f1(0.8 * w)} strokeLinecap="round" opacity={0.6} />);
  }
  for (const er0 of rig.earRings) {
    if (er0.k < 0.02) continue;
    const c = project(cam, er0.c);
    const w = Math.max(1.3, 0.03 * rig.s * c.s) * er0.k;
    decals.push(<circle key={'er' + decals.length} cx={f1(c.x)} cy={f1(c.y)} r={f1(er0.r * c.s * er0.k)} fill="none" stroke={INK} strokeWidth={f1(w)} opacity={0.8} />);
  }
  // gripping fingers: three ink grooves across the mitten (it reads as fingers wrapped around the bar)
  for (const h of rig.hands) {
    const c = project(cam, h.c);
    const rx = h.rx * c.s, ry = h.ry * c.s;
    const w = Math.max(1.4, 0.04 * rig.s * c.s) * h.k;
    for (let i = 0; i < 3; i++) {
      const y = c.y + ry * (-0.42 + i * 0.36);
      const x0 = c.x - h.side * rx * 0.05, x1 = c.x + h.side * rx * (0.62 - 0.08 * Math.abs(i - 1));
      decals.push(<path key={'fg' + decals.length} d={`M${f1(x0)},${f1(y)} Q${f1((x0 + x1) / 2)},${f1(y + ry * 0.08)} ${f1(x1)},${f1(y - ry * 0.02)}`} fill="none" stroke={INK} strokeWidth={f1(w)} strokeLinecap="round" opacity={0.8} />);
    }
  }
  if (rig.panel) {
    const c = project(cam, rig.panel.c);
    const w = 0.62 * rig.s * c.s * rig.panel.k, h = 0.44 * rig.s * c.s * rig.panel.k;
    const led = {x: c.x + w * 0.5, y: c.y + h * 0.05};
    const lw = Math.max(1.2, 0.03 * rig.s * c.s) * rig.panel.k;
    decals.push(
      <g key="panel" transform={`rotate(${f1(rig.panel.roll)} ${f1(c.x)} ${f1(c.y)})`}>
        <rect x={f1(c.x - w)} y={f1(c.y - h)} width={f1(2 * w)} height={f1(2 * h)} rx={f1(h * 0.55)} fill="#5E6F88" stroke={INK} strokeWidth={f1(lw * 1.2)} />
        <rect x={f1(c.x - w * 0.86)} y={f1(c.y - h * 0.8)} width={f1(1.72 * w)} height={f1(0.5 * h)} rx={f1(h * 0.25)} fill="#C9D7E6" opacity={0.85} />
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${f1(c.x - w * 0.62)},${f1(c.y - h * 0.25 + i * h * 0.36)} L${f1(c.x - w * 0.02)},${f1(c.y - h * 0.25 + i * h * 0.36)}`} stroke={INK} strokeWidth={f1(lw)} strokeLinecap="round" opacity={0.75} />
        ))}
        <circle cx={f1(led.x)} cy={f1(led.y)} r={f1(h * 0.28)} fill={C.cyan} stroke={INK} strokeWidth={f1(lw * 0.8)} />
        <circle cx={f1(led.x - h * 0.08)} cy={f1(led.y - h * 0.08)} r={f1(h * 0.1)} fill={C.cyanCore} />
      </g>,
    );
  }
  if (rig.led && rig.led.k > 0.02) {
    // the chest LED glint riding the liquid torso: the robot is still in there
    const c = project(cam, rig.led.c);
    const r = 0.13 * rig.s * c.s * rig.led.k;
    decals.push(
      <g key="led">
        <circle cx={f1(c.x)} cy={f1(c.y)} r={f1(r * 2.4)} fill={C.cyan} opacity={0.22 * rig.led.k} />
        <circle cx={f1(c.x)} cy={f1(c.y)} r={f1(r)} fill={C.cyan} stroke={INK} strokeWidth={f1(Math.max(1, r * 0.25))} />
        <circle cx={f1(c.x - r * 0.3)} cy={f1(c.y - r * 0.3)} r={f1(r * 0.35)} fill={C.cyanCore} />
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

/** the grip pose: hands on two world points ON THE BARS (bar axis at the grip height) */
export const gripPose = (pose: RobotPose, l: P3, r: P3, k = 1): Robot2Pose => ({...pose, gripL: l, gripR: r, grip: k});

// ---------------------------------------------------------------------------------------------------------------
// THE HOOK SQUEEZE, ready to stage (jail world units: bars at d = 0, the escape gap centred on x = 0, clear 3.96 u).
// Shot builders: draw <Robot2 cam t base pose state part="back" d0={0}/>, the jail <Bars/>, then part="front", with
//   cam = heroCam(t), base = HERO_BASE, pose = heroPose(t), state = heroState(t)   (t = seconds into the hook, 0..2).

/** look-at camera (world.ts conventions: yaw + turns right, pitch + looks down) */
export const camLook = (p: P3, at: P3, f: number): Cam3 => {
  const dx = at.x - p.x, dy = at.h - p.h, dz = at.d - p.d;
  const yaw = (Math.atan2(dx, dz) * 180) / Math.PI;
  const pitch = (Math.atan2(-dy, Math.hypot(dx, dz)) * 180) / Math.PI;
  return {x: p.x, h: p.h, d: p.d, yaw, pitch, f};
};
/** C1 Catmull-Rom through timed keys (velocity carried through every key, eased in/out at the ends) */
export const splineKeys = (t: number, keys: [number, number][]): number => {
  const n = keys.length;
  if (t <= keys[0][0]) return keys[0][1];
  if (t >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0;
  while (i < n - 2 && t > keys[i + 1][0]) i++;
  const [t1, y1] = keys[i], [t2, y2] = keys[i + 1];
  const h = t2 - t1;
  const slope = (j: number) => {
    if (j <= 0 || j >= n - 1) return 0; // eased ends
    return (keys[j + 1][1] - keys[j - 1][1]) / (keys[j + 1][0] - keys[j - 1][0]);
  };
  const m1 = slope(i) * h, m2 = slope(i + 1) * h;
  const x = (t - t1) / h, x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * y1 + (x3 - 2 * x2 + x) * m1 + (-2 * x3 + 3 * x2) * y2 + (x3 - x2) * m2;
};
const spline3 = (t: number, keys: [number, P3][]): P3 => ({
  x: splineKeys(t, keys.map(([a, b]) => [a, b.x] as [number, number])),
  h: splineKeys(t, keys.map(([a, b]) => [a, b.h] as [number, number])),
  d: splineKeys(t, keys.map(([a, b]) => [a, b.d] as [number, number])),
});

export const HERO = {s: 1.5, base: {x: 0, h: 0, d: 1.55} as P3, out: {x: 2.0, h: 0, d: -5.2} as P3, gap: {x: 0, d: 0, w: 3.96} as Robot2Gap, gripH: 10.8, barX: 2.6};
export const HERO_BASE: Robot2Base = {...HERO.base, s: HERO.s};
/** the outside pose the robot reforms into (eyes straight at the viewer) */
export const HERO_OUT_POSE: Robot2Pose = {...POSE_IDLE, lookX: 0, lookY: 0, mood: 0.35, eyeOpen: 1.05};
/** the gripping pose (hands wrapped on the two bars either side of the gap) */
export const heroPose = (t = 0): Robot2Pose => {
  void t;
  return gripPose({...POSE_SURPRISED, eyeOpen: 1.15, lookY: -0.05, lean: 0}, {x: -HERO.barX, h: HERO.gripH, d: 0}, {x: HERO.barX, h: HERO.gripH, d: 0});
};
/** squeeze progress u (0..1) for the hook clock: the face is already in the gap on frame 0 */
export const heroU = (t: number) => clamp(splineKeys(t, [[0, 0.035], [0.5, 0.25], [1.0, 0.63], [1.42, 1]]));
export const heroState = (t: number): Robot2State => ({
  press: 1,
  soften: {head: lerp(0.06, 1, ss(t, 0.02, 0.4)), upper: ss(t, 0.15, 0.55), lower: ss(t, 0.45, 0.9)},
  squeeze: {gap: HERO.gap, out: HERO.out, u: heroU(t), outPose: HERO_OUT_POSE},
  reform: keyS(t, [[1.42, 0], [1.76, 1]], (x) => x * x * (1.6 - 0.6 * x)),
});
/** the hook camera: frontal ECU on frame 0 (face pressed into the gap), arcs left so inside -> neck -> outside reads
 *  left to right across the screen while the neck stays in clear view (0.35-1.45 s), then swings round in front of the
 *  reformed robot (eyes to camera) and eases back. */
export const HERO_CAM_KEYS: {t: number; p: P3; at: P3; f: number}[] = [
  {t: 0, p: {x: -2.2, h: 13.6, d: -7.6}, at: {x: 0.0, h: 11.4, d: 0.3}, f: 1130},
  {t: 0.35, p: {x: -3.8, h: 17.5, d: -8.8}, at: {x: 0.3, h: 9.4, d: -0.6}, f: 1000},
  {t: 0.8, p: {x: -4.5, h: 17.5, d: -11.5}, at: {x: 0.8, h: 6.0, d: -2.0}, f: 960},
  {t: 1.3, p: {x: -3.5, h: 13.5, d: -14.0}, at: {x: 1.1, h: 3.8, d: -3.2}, f: 950},
  {t: 1.72, p: {x: -0.2, h: 11.4, d: -17.2}, at: {x: 2.0, h: 9.0, d: -5.2}, f: 1200},
  {t: 2.0, p: {x: 2.0, h: 11.2, d: -18.0}, at: {x: 2.0, h: 9.6, d: -5.2}, f: 1220},
];
export const heroCam = (t: number): Cam3 => {
  const K = HERO_CAM_KEYS;
  const p = spline3(t, K.map((k) => [k.t, k.p] as [number, P3]));
  const a = spline3(t, K.map((k) => [k.t, k.at] as [number, P3]));
  const f = splineKeys(t, K.map((k) => [k.t, k.f] as [number, number]));
  return camLook(p, a, f);
};
