// Group DE helpers: the friend's teal visor as a free prop (same geometry as the worn one in rig/actor.tsx), seated,
// kneeling and reclined poses, roll-aware targets, and the refuge interior backdrop shared by the D/E shots.
import React from 'react';
import {C} from '../../theme';
import {ActorProps, solve, Rig, rolled} from '../../rig/actor';
import {Look} from '../../rig/looks';
import {V2, V3, add3, mul3, dot3, rotAxis, rad, lerp, clamp, polyPath, smoothPath, f2} from '../../kit/math';
import {RefugeInteriorBack, InteriorFloor, RefugeTint} from '../../sets/refugeInterior';

// ------------------------------------------------------------------ 3D basis helpers
export type Basis3 = {R: V3; U: V3; F: V3};
/** Same convention as the rig: yaw 0 faces the viewer, +90 faces screen right; pitch + = tip forward/down; roll about F.
 *  screenRoll rotates the result in the picture plane (deg, + = clockwise on screen, like SVG rotate). */
export const basis = (yaw: number, pitch = 0, roll = 0, screenRoll = 0): Basis3 => {
  const a = rad(yaw);
  let b: Basis3 = {R: {x: -Math.cos(a), y: 0, z: Math.sin(a)}, U: {x: 0, y: -1, z: 0}, F: {x: Math.sin(a), y: 0, z: Math.cos(a)}};
  const rot = (bb: Basis3, ax: V3, ang: number): Basis3 => ({R: rotAxis(bb.R, ax, ang), U: rotAxis(bb.U, ax, ang), F: rotAxis(bb.F, ax, ang)});
  b = rot(b, b.R, rad(pitch));
  b = rot(b, b.F, rad(roll));
  if (screenRoll) b = rot(b, {x: 0, y: 0, z: 1}, rad(screenRoll));
  return b;
};
/** Rig head basis after the actor's whole-body roll (screen rotation). */
export const headBasis = (r: Rig): Basis3 => {
  const b = r.head;
  if (!r.roll) return b;
  const ax = {x: 0, y: 0, z: 1}, a = rad(r.roll);
  return {R: rotAxis(b.R, ax, a), U: rotAxis(b.U, ax, a), F: rotAxis(b.F, ax, a)};
};

// ------------------------------------------------------------------ the visor (memorial item)
const HEAD_R = 58, HEAD_RY = 62;
/** A point on the visor (head-relative coordinates like the rig: th azimuth deg, ey elevation in RY units, rr radius). */
export const visorPt = (x: number, y: number, s: number, b: Basis3, th: number, ey: number, rr: number): V3 => {
  const a = rad(th);
  const ce = Math.sqrt(Math.max(0, 1 - Math.min(0.98, ey * ey)));
  const horiz = add3(mul3(b.F, Math.cos(a)), mul3(b.R, Math.sin(a)));
  const d = add3(mul3(horiz, HEAD_R * s * rr * ce), mul3(b.U, -ey * HEAD_RY * s * rr));
  return {x: x + d.x, y: y + d.y, z: d.z};
};
/** World point at the brim's front edge (where a hand holds it). */
export const visorBrimTip = (x: number, y: number, s: number, b: Basis3): V3 => visorPt(x, y, s, b, 0, -0.14, 1.53);

/**
 * The friend's teal visor as a free object. (x, y) is the centre of the (absent) head it fits; the geometry is the
 * rig's: a band at ey −0.58..−0.32 (rr 1.04), the elastic strap closing it at the back, and the brim. Pieces are
 * depth-sorted so it reads from any angle (on a head, falling, on the floor, in a hand, on a chair, in a tray).
 */
export const Visor: React.FC<{x: number; y: number; s?: number; b: Basis3; ink?: number; dirt?: number}> = ({x, y, s = 1, b, ink = 4, dirt = 0}) => {
  const P = (th: number, ey: number, rr: number) => visorPt(x, y, s, b, th, ey, rr);
  // the ring: the stiff band over the front 220°, the narrower elastic strap round the back
  const N = 36;
  const ringTop: V3[] = [], ringBot: V3[] = [];
  for (let k = 0; k <= N; k++) {
    const th = -110 + (360 * k) / N;
    const isBand = th <= 110;
    const w = isBand ? 0 : clamp(Math.min(th - 110, 250 - th) / 14);
    ringTop.push(P(th, lerp(-0.58, -0.5, w), lerp(1.04, 1.02, w)));
    ringBot.push(P(th, lerp(-0.32, -0.4, w), lerp(1.04, 1.02, w)));
  }
  // contiguous runs of segments facing toward / away from the viewer
  const runs: {front: boolean; a: number; b: number}[] = [];
  for (let k = 0; k < N; k++) {
    const zf = ringTop[k].z + ringTop[k + 1].z + ringBot[k].z + ringBot[k + 1].z;
    // a segment faces the viewer when its outward normal has +z: approximate by the mid azimuth direction
    const th = -110 + (360 * (k + 0.5)) / N;
    const nrm = add3(mul3(b.F, Math.cos(rad(th))), mul3(b.R, Math.sin(rad(th))));
    const front = nrm.z >= 0;
    void zf;
    const last = runs[runs.length - 1];
    if (last && last.front === front) last.b = k + 1;
    else runs.push({front, a: k, b: k + 1});
  }
  const brim: V3[] = [];
  for (let th = -96; th <= 96; th += 8) brim.push(P(th, -0.34, 1.05));
  for (let th = 96; th >= -96; th -= 8) {
    const c = Math.cos(rad(th));
    const ext = 1.05 + 0.48 * Math.pow(Math.max(0, c), 1.3);
    const q = P(th, -0.34 + 0.2 * Math.max(0, c), ext);
    // the rig's profile droop (along the head's down direction, by how side-on the brim is)
    const dr = 10 * s * Math.hypot(b.F.x, b.F.y) * Math.max(0, c);
    q.x -= b.U.x * dr; q.y -= b.U.y * dr;
    brim.push(q);
  }
  const zMean = (q: V3[]) => q.reduce((m, p) => m + p.z, 0) / q.length;
  const tealC = C.teal, tealD = C.tealDeep;
  const pieces: {z: number; el: React.ReactElement}[] = [];
  runs.forEach((r, i) => {
    const top = ringTop.slice(r.a, r.b + 1), bot = ringBot.slice(r.a, r.b + 1).reverse();
    pieces.push({z: r.front ? zMean(top) + 1000 * 0 : zMean(top) - 2000, el: <path key={`r${i}`} d={polyPath([...top, ...bot])} fill={r.front ? tealC : tealD} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />});
  });
  // the brim: its lit top faces U; seen from below it is the darker underside
  const under = b.U.z < -0.05;
  pieces.push({z: zMean(brim), el: <path key="brim" d={smoothPath(brim, true, 0.3)} fill={under ? tealD : tealC} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />});
  pieces.sort((p, q) => p.z - q.z);
  void dot3; void dirt;
  return <g>{pieces.map((p) => p.el)}</g>;
};

// ------------------------------------------------------------------ poses
const HIP_H = 165;
type Base = Partial<ActorProps> & {t: number; s?: number; yaw?: number};
const yawBasis = (yaw: number) => {
  const a = rad(yaw);
  return {R: {x: -Math.cos(a), y: 0, z: Math.sin(a)}, F: {x: Math.sin(a), y: 0, z: Math.cos(a)}};
};
/**
 * Seated on a seat whose top is at world y = seatTop (floor at yFloor): pelvis on the seat, thighs forward, shins down,
 * feet planted. knees: how far forward the feet are (units), spread: feet apart.
 */
export const seated = (look: Look, x: number, yFloor: number, seatTop: number, base: Base & {knees?: number; spread?: number; z?: number}): ActorProps => {
  const s = base.s ?? 1, yaw = base.yaw ?? 0, z = base.z ?? 0;
  const {R, F} = yawBasis(yaw);
  const Py = seatTop - 18 * s;
  const drop = HIP_H - (yFloor - Py) / s;
  const kn = (base.knees ?? 70) * s, sp = (base.spread ?? 40) * s;
  // a seat higher than the legs can reach: thighs forward, shins hanging, feet off the floor
  const dangle = (yFloor - Py) / s > 150;
  const fy = (sd: number) => (dangle ? Py + (70 + sd * 4) * s : yFloor - 10 * s);
  const fk = dangle ? 84 * s : kn;
  const foot = (sd: number) => ({x: x + R.x * sd * sp + F.x * fk, y: fy(sd), z: z + R.z * sd * sp + F.z * fk});
  const pole = {x: F.x, y: -0.7, z: F.z};
  return {
    look, x, y: yFloor, s, yaw, drop, z,
    legL: {foot: foot(-1), pole}, legR: {foot: foot(1), pole},
    ...base,
  } as ActorProps;
};
/** Kneeling (both knees down) at x, facing yaw; drop puts the pelvis ~95 above the floor. */
export const kneeling = (look: Look, x: number, yFloor: number, base: Base & {z?: number}): ActorProps => {
  const s = base.s ?? 1, yaw = base.yaw ?? 0, z = base.z ?? 0;
  const {R, F} = yawBasis(yaw);
  const foot = (sd: number) => ({x: x + R.x * sd * 34 * s - F.x * 70 * s, y: yFloor - 12 * s, z: z + R.z * sd * 34 * s - F.z * 70 * s});
  const pole = {x: F.x, y: 0.2, z: F.z};
  return {look, x, y: yFloor, s, yaw, z, drop: 72, legL: {foot: foot(-1), pole, pitch: -60}, legR: {foot: foot(1), pole, pitch: -60}, ...base} as ActorProps;
};

/** Rotate a world point about a pivot by deg (SVG sense). */
export const rot2 = (q: V2, pv: V2, deg: number): V2 => {
  const a = rad(deg), c = Math.cos(a), sn = Math.sin(a);
  const dx = q.x - pv.x, dy = q.y - pv.y;
  return {x: pv.x + dx * c - dy * sn, y: pv.y + dx * sn + dy * c};
};
/** For an actor with a whole-body roll: the pre-roll target that lands at world point q after the roll. */
export const unroll = (q: V3 | V2, pv: V2, roll: number): V3 => {
  const p = rot2(q, pv, -roll);
  return {x: p.x, y: p.y, z: 'z' in q ? (q as V3).z : 0};
};
/**
 * Reclined on a bed with a raised backrest (head toward screen left): incline = backrest angle above horizontal (deg).
 * The pelvis rests at (x, ySurf); legs lie flat along the mattress. Use `unroll` for hand targets in world space.
 */
export const reclined = (look: Look, x: number, ySurf: number, incline: number, base: Base): ActorProps => {
  const s = base.s ?? 1;
  const roll = -90 + incline;
  const P = {x, y: ySurf - 30 * s};
  // legs: flex the hips by the incline so the legs run along the mattress (pre-roll: forward is screen right)
  const footW = (k: number) => ({x: x + 150 * s, y: ySurf - 22 * s + k});
  const legT = (k: number) => unroll(footW(k), P, roll);
  return {
    look, x: P.x, y: P.y + HIP_H * s, s, yaw: 90, roll, rollPivot: P, shadow: false,
    legL: {foot: {...legT(0), z: -18 * s}, pole: {x: 0, y: -1, z: 0}}, legR: {foot: {...legT(-4), z: 18 * s}, pole: {x: 0, y: -1, z: 0}},
    ...base,
  } as ActorProps;
};
/** World (after-roll) screen position of a rig joint. */
export const W = (r: Rig, q: V3 | V2): V2 => rolled(r, q);
export {solve};

// ------------------------------------------------------------------ the refuge interior backdrop
/** Back glass + far view + floor for an interior shot, in world units with the floor line at y = 0. */
export const InteriorBack: React.FC<{x0: number; x1: number; t: number; time?: number; ink?: number; people?: number; beds?: number; seed?: number; wallY?: number; top?: number; outside?: React.ReactNode; plants?: boolean}> = ({x0, x1, t, time = 1, ink = 3, people = 2, beds = 0, seed = 3, wallY = -90, top = -1500, outside, plants = true}) => (
  <g>
    <RefugeInteriorBack x0={x0} x1={x1} yFloor={wallY} yTop={top} time={time} t={t} people={people} beds={beds} ink={ink} seed={seed} outside={outside} plants={plants} />
    <InteriorFloor x0={x0} x1={x1} y={wallY} depth={700} time={time} ink={ink} />
  </g>
);
export const Tint: React.FC<{time: number; lamps?: {x: number; y: number; r: number}[]; seed?: number}> = ({time, lamps, seed}) => (
  <RefugeTint x0={-20} y0={-20} x1={1940} y1={1100} time={time} lamps={lamps} seed={seed} />
);

/** A soft drop of light-dust motes (screen space) for interior air; very sparse. */
export const Motes: React.FC<{t: number; n?: number; seed?: number; op?: number}> = ({t, n = 14, seed = 2, op = 0.35}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const r0 = (Math.sin(seed * 91 + i * 12.9898) * 43758.5453) % 1;
    const r1 = (Math.sin(seed * 37 + i * 78.233) * 12345.678) % 1;
    const x = ((Math.abs(r0) * 1920 + t * (8 + 6 * Math.abs(r1))) % 1960) - 20;
    const y = (Math.abs(r1) * 1080 + Math.sin(t * 0.4 + i) * 20 - t * 5) % 1080;
    els.push(<circle key={i} cx={f2(x)} cy={f2((y + 1080) % 1080)} r={2 + 2 * Math.abs(r0)} fill="#FFF6DD" opacity={op * (0.5 + 0.5 * Math.sin(t * 0.7 + i))} />);
  }
  return <g>{els}</g>;
};

/** A wool blanket worn as a shawl, at a figure's shoulder centre (x, y): over the shoulders and upper arms, open in
 *  front so the shirt shows, the two ends hanging toward the lap. k 0..1 lowers it into place. */
export const Blanket: React.FC<{x: number; y: number; s: number; k: number; ink: number; color?: string}> = ({x, y, s, k, ink, color = '#8C97A8'}) => {
  if (k <= 0) return null;
  const drop = (1 - k) * -140 * s;
  const q = (px: number, py: number) => `${(px * s).toFixed(1)} ${(py * s).toFixed(1)}`;
  const outer = `M ${q(-96, 40)} Q ${q(-100, -10)} ${q(-50, -16)} Q ${q(0, -26)} ${q(50, -16)} Q ${q(100, -10)} ${q(96, 40)} L ${q(104, 176)} Q ${q(80, 188)} ${q(46, 182)} L ${q(22, 34)} Q ${q(0, 18)} ${q(-22, 34)} L ${q(-46, 182)} Q ${q(-80, 188)} ${q(-104, 176)} Z`;
  return (
    <g transform={`translate(${x} ${y + drop})`} opacity={clamp(k * 3)}>
      <path d={outer} fill={color} stroke={C.ink} strokeWidth={ink} strokeLinejoin="round" />
      <path d={`M ${q(-70, 30)} Q ${q(-66, 100)} ${q(-74, 170)} M ${q(70, 30)} Q ${q(66, 100)} ${q(74, 170)}`} fill="none" stroke="#6F7A8C" strokeWidth={ink * 0.8} />
      <path d={`M ${q(-104, 160)} L ${q(-46, 166)} M ${q(46, 166)} L ${q(104, 160)}`} stroke="#C9B37A" strokeWidth={7 * s} />
    </g>
  );
};

/** A paper water cup (hand-local prop: x along the forearm). */
export const Cup: React.FC<{s: number; ink: number}> = ({s, ink}) => (
  <g transform={`translate(${6 * s} ${-4 * s}) rotate(-90)`}>
    <path d={`M ${-14 * s} ${-18 * s} L ${14 * s} ${-18 * s} L ${10 * s} ${18 * s} L ${-10 * s} ${18 * s} Z`} fill="#FFFFFF" stroke={C.ink} strokeWidth={ink * 0.7} strokeLinejoin="round" />
    <rect x={-12 * s} y={-12 * s} width={24 * s} height={6 * s} fill="#BFE8E3" />
  </g>
);
void clamp;
