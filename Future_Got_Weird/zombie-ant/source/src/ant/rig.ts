// The master ant rig: one carpenter ant (Camponotus, the usual host of Ophiocordyceps unilateralis s.l.), about 11 mm
// long, posed in the world and reused for every ant in the film (the hook's ant, the infected walker, the forest's
// dead ants, the loop ant). Local axes: x forward, y left, z dorsal; origin at the middle of the mesosoma.
// Anatomy: head (heart-shaped from the front, compound eyes on the sides, elbowed antennae with a long scape, toothed
// mandibles that close sideways), a three-part mesosoma, a single petiole node, a five-banded gaster, and six legs, each
// coxa - femur - tibia - tarsus, attached under the mesosoma. A leg is solved from an ankle and foot target (two-bone IK
// for femur and tibia, knee up and out), so feet can be planted on any surface or posed freely.
import {add3, cross3, dot3, len3, lerp3, mul3, norm3, sub3, V3} from '../core/three';
import {dirW, Frame, pitchF, rotA, toW, yawF} from '../core/frame';

export const LEGS = [0, 1, 2, 3, 4, 5] as const; // L1 R1 L2 R2 L3 R3
export const side = (i: number) => (i % 2 === 0 ? 1 : -1);
export const pair = (i: number) => Math.floor(i / 2);
const SOCKET: V3[] = [[1.15, 0.36, -0.42], [0.15, 0.42, -0.48], [-0.6, 0.42, -0.42]];
export const LEN = {coxa: [0.62, 0.5, 0.6], femur: [2.35, 2.55, 3.0], tibia: [2.15, 2.4, 2.9], tarsus: [1.9, 2.1, 2.5]};
export const RAD = {coxa: 0.34, femur: [0.3, 0.24], tibia: [0.21, 0.15], tarsus: [0.1, 0.065]};
/** the neck (head pivot), in body coordinates */
export const NECK: V3 = [2.2, 0, 0.42];
/** head centre and semi-axes in head coordinates (origin at the neck) */
export const HEAD_C: V3 = [1.36, 0, 0.12];
export const HEAD_AX: V3 = [1.42, 1.38, 1.15];
/** mandible base (one side) in head coordinates */
export const MAND_BASE: V3 = [2.45, 0.46, -0.52];
export const MAND_LEN = 1.6;

export type LegPose = {ankle: V3; foot: V3; pole?: V3};
export type AntState = {
  body: Frame;
  headPitch: number; // nose down +
  headYaw: number;
  mand: number; // 0 closed (tips crossed) .. 1 wide open
  antSpread: number; // 0 tucked .. 1 out
  antTw: [number, number]; // small per-side twitch (deg)
  legs: LegPose[];
  gasterPitch: number; // + = tip up
  dead: number; // 0 living colour .. 1 dead, dulled
  scale?: number;
  antFwd?: number; // how far forward the antennae point (default 0.9; lower = held out to the sides)
};

export type LegJ = {socket: V3; troch: V3; knee: V3; ankle: V3; foot: V3; i: number};
export type Rig = {
  st: AntState;
  body: Frame;
  head: Frame; // origin at the neck
  headC: V3;
  legs: LegJ[];
  mand: {base: V3; pts: V3[]; tip: V3; s: number}[];
  ants: {socket: V3; elbow: V3; tip: V3; pts: V3[]}[];
};

/** body-local point -> world */
export const bw = (st: AntState, p: V3) => toW(st.body, mul3(p, st.scale ?? 1));
/** the head frame (origin at the neck) */
export const headFrame = (st: AntState): Frame => {
  const n = bw(st, NECK);
  let H: Frame = {...st.body, o: n};
  H = pitchF(H, st.headPitch, n);
  H = yawF(H, st.headYaw, n);
  return H;
};
export const hw = (st: AntState, H: Frame, p: V3) => toW(H, mul3(p, st.scale ?? 1));

/** two-bone IK: hip -> ankle with lengths a, b; knee bends toward pole */
export const ik2 = (hip: V3, ankle: V3, a: number, b: number, pole: V3): {knee: V3; ankle: V3} => {
  let d = sub3(ankle, hip);
  let L = len3(d);
  const maxL = (a + b) * 0.999, minL = Math.abs(a - b) + 1e-3;
  if (L > maxL) { d = mul3(d, maxL / L); L = maxL; }
  if (L < minL) { d = mul3(norm3(d), minL); L = minL; }
  const dir = norm3(d);
  let p = sub3(pole, mul3(dir, dot3(pole, dir)));
  if (len3(p) < 1e-6) p = norm3(cross3(dir, [0, 0, 1]));
  p = norm3(p);
  const ca = (a * a + L * L - b * b) / (2 * a * L);
  const sa = Math.sqrt(Math.max(0, 1 - ca * ca));
  return {knee: add3(hip, add3(mul3(dir, a * ca), mul3(p, a * sa))), ankle: add3(hip, d)};
};

/** the trochanter (end of the coxa) of leg i */
export const trochOf = (st: AntState, i: number): V3 => {
  const k = pair(i), s = side(i);
  const sock = bw(st, [SOCKET[k][0], SOCKET[k][1] * s, SOCKET[k][2]]);
  const cdir = norm3(dirW(st.body, [[0.45, 0.05, -0.32][k], 0.5 * s, -0.8]));
  return add3(sock, mul3(cdir, LEN.coxa[k] * (st.scale ?? 1)));
};
export const socketOf = (st: AntState, i: number): V3 => {
  const k = pair(i), s = side(i);
  return bw(st, [SOCKET[k][0], SOCKET[k][1] * s, SOCKET[k][2]]);
};

/** a planted leg: foot on a surface with normal n; the tarsus slopes down to it from the side of the hip */
export const planted = (st: AntState, i: number, foot: V3, n: V3, lift = 0): LegPose => {
  const k = pair(i), sc = st.scale ?? 1;
  const T = trochOf(st, i);
  const f = add3(foot, mul3(n, lift));
  let toHip = sub3(T, f);
  toHip = sub3(toHip, mul3(n, dot3(toHip, n)));
  const along = len3(toHip) > 1e-4 ? norm3(toHip) : st.body.f;
  const tl = LEN.tarsus[k] * sc;
  const ankle = add3(f, add3(mul3(along, tl * 0.9), mul3(n, tl * 0.42)));
  return {ankle, foot: f};
};
/** a free leg from angles (deg): yaw from forward toward its side, femur elevation, knee and tarsus bends */
export const freeLeg = (st: AntState, i: number, yaw: number, elev: number, knee: number, tars: number): LegPose => {
  const k = pair(i), s = side(i), sc = st.scale ?? 1;
  const T = trochOf(st, i);
  const r = (yaw * Math.PI) / 180;
  const h = norm3(dirW(st.body, [Math.cos(r), s * Math.sin(r), 0]));
  const u = st.body.u;
  const dirAt = (a: number) => add3(mul3(h, Math.cos((a * Math.PI) / 180)), mul3(u, Math.sin((a * Math.PI) / 180)));
  const kn = add3(T, mul3(dirAt(elev), LEN.femur[k] * sc));
  const an = add3(kn, mul3(dirAt(elev - knee), LEN.tibia[k] * sc));
  const ft = add3(an, mul3(dirAt(elev - knee - tars), LEN.tarsus[k] * sc));
  return {ankle: an, foot: ft, pole: sub3(kn, T)};
};
export const lerpLeg = (a: LegPose, b: LegPose, t: number): LegPose => ({ankle: lerp3(a.ankle, b.ankle, t), foot: lerp3(a.foot, b.foot, t), pole: a.pole && b.pole ? lerp3(a.pole, b.pole, t) : t < 0.5 ? a.pole : b.pole});

/** the default (standing) foot positions in body coordinates, before projection onto a surface */
export const REST_FOOT: V3[] = [[4.3, 4.6, -1.45], [4.3, -4.6, -1.45], [0.3, 6.0, -1.45], [0.3, -6.0, -1.45], [-4.5, 5.6, -1.45], [-4.5, -5.6, -1.45]];

export const solve = (st: AntState): Rig => {
  const sc = st.scale ?? 1;
  const head = headFrame(st);
  const headC = hw(st, head, HEAD_C);
  const legs: LegJ[] = LEGS.map((i) => {
    const k = pair(i), s = side(i);
    const socket = socketOf(st, i);
    const troch = trochOf(st, i);
    const L = st.legs[i];
    const pole = L.pole ?? add3(mul3(st.body.u, 1), add3(mul3(st.body.l, 0.9 * s), mul3(st.body.f, [0.35, 0, -0.35][k])));
    const {knee, ankle} = ik2(troch, L.ankle, LEN.femur[k] * sc, LEN.tibia[k] * sc, pole);
    // keep the tarsus length: the foot lies along the ankle->foot direction
    const fd = sub3(L.foot, L.ankle);
    const foot = add3(ankle, mul3(len3(fd) > 1e-5 ? norm3(fd) : st.body.f, LEN.tarsus[k] * sc));
    return {socket, troch, knee, ankle, foot, i};
  });
  // mandibles: blades in a plane tilted forward-down, opening sideways about their base
  const fm = rotA(head.f, head.l, 22);
  const mand = [1, -1].map((s) => {
    const base = hw(st, head, [MAND_BASE[0], MAND_BASE[1] * s, MAND_BASE[2]]);
    const a = ((-14 + 74 * st.mand) * Math.PI) / 180;
    const out = mul3(head.l, s);
    const dir = norm3(add3(mul3(fm, Math.cos(a)), mul3(out, Math.sin(a))));
    const inw = norm3(sub3(mul3(fm, Math.sin(a)), mul3(out, Math.cos(a))));
    const P = (u: number, w: number) => add3(base, add3(mul3(dir, u * MAND_LEN * sc), mul3(inw, w * MAND_LEN * sc)));
    // outer edge then the toothed inner edge, base to tip and back
    const shape: [number, number][] = [[0, -0.2], [0.3, -0.24], [0.62, -0.17], [0.86, -0.04], [0.98, 0.12], [1.0, 0.22], [0.9, 0.25], [0.84, 0.19], [0.76, 0.27], [0.66, 0.2], [0.57, 0.29], [0.46, 0.21], [0.36, 0.28], [0.22, 0.2], [0.06, 0.24], [0, 0.18]];
    return {base, pts: shape.map(([u, w]) => P(u, w)), tip: P(1.0, 0.2), s};
  });
  // antennae: a long scape back and up over the head, then a jointed funiculus forward and out
  const ants = [1, -1].map((s, j) => {
    const socket = hw(st, head, [2.2, 0.44 * s, 0.4]);
    const sp = st.antSpread;
    const tw = st.antTw[j];
    let sdir = dirW(head, [0.25 - 0.35 * sp, (0.42 + 0.3 * sp) * s, 0.86]);
    sdir = rotA(sdir, head.u, tw * s);
    const elbow = add3(socket, mul3(norm3(sdir), 2.0 * sc));
    let fdir = dirW(head, [st.antFwd ?? 0.9, (0.3 + 0.35 * sp) * s, 0.12 - 0.2 * sp]);
    fdir = rotA(fdir, head.l, -tw * 0.6);
    const pts: V3[] = [elbow];
    let d = norm3(fdir);
    for (let k = 1; k <= 5; k++) {
      d = norm3(add3(d, mul3(head.u, -0.07)));
      pts.push(add3(pts[k - 1], mul3(d, 0.5 * sc)));
    }
    return {socket, elbow, tip: pts[pts.length - 1], pts};
  });
  return {st, body: st.body, head, headC, legs, mand, ants};
};

/** a point on the dorsal back of the head, where the fungal stalk emerges (head coordinates) */
export const STALK_BASE: V3 = [0.55, 0, 1.0];
/** (final pass) the nape: the dorsal joint between the back of the head and the pronotum, where the stalk of ant #2
 *  emerges (head coordinates; the neck is the origin) */
export const STALK_NAPE: V3 = [-0.12, 0, 0.62];
