// The master cockroach rig: one Madagascar hissing cockroach (Gromphadorhina portentosa, the species used by the NTU
// cyborg-insect work), about 64 mm long, posed in a world in millimetres and reused for every insect in the film.
// Local axes: x forward, y left, z dorsal; the origin is on the ground under the thorax (local z = 0 is the floor the
// insect stands on). Anatomy (dorsal view): a large shield-like pronotum covering the head, the meso- and metanotum,
// seven abdominal tergites, small cerci; wingless. The head is tucked under the front of the pronotum and points down.
// Six legs, each coxa - femur - tibia - tarsus, attached under the thorax (pro-, meso-, metathorax). A leg is solved
// from an ankle and foot target (two-bone IK for femur and tibia, knee up and out), so feet can be planted on any
// surface and never slide while planted (see gait.ts).
import {add3, cross3, dot3, len3, lerp3, mul3, norm3, sub3, V3} from '../core/three';
import {dirW, Frame, pitchF, rotA, toW, yawF} from '../core/frame';

export const LEGS = [0, 1, 2, 3, 4, 5] as const; // L1 R1 L2 R2 L3 R3
export const side = (i: number) => (i % 2 === 0 ? 1 : -1);
export const pair = (i: number) => Math.floor(i / 2);
/** coxa sockets (one side; y mirrored), under the pro-, meso- and metathorax */
const SOCKET: V3[] = [[10.5, 3.6, 3.4], [2.2, 4.6, 3.2], [-5.4, 5.4, 3.2]];
/** coxa direction (one side): out, down, and for the hind legs back */
const COXA_DIR: V3[] = [[0.35, 0.55, -0.75], [0.0, 0.7, -0.7], [-0.45, 0.7, -0.55]];
export const LEN = {coxa: [4.2, 4.6, 5.4], femur: [9.0, 11.0, 13.0], tibia: [8.4, 11.0, 14.5], tarsus: [7.0, 8.2, 10.0]};
export const RAD = {coxa: 2.1, femur: [1.35, 1.0], tibia: [0.95, 0.6], tarsus: [0.45, 0.3]};
/** the neck (head pivot), in body coordinates */
export const NECK: V3 = [19.5, 0, 5.2];
/** head centre and semi-axes in head coordinates (origin at the neck) */
export const HEAD_C: V3 = [2.6, 0, -1.2];
export const HEAD_AX: V3 = [3.6, 5.0, 4.0];

/** the dorsal plates: centre, semi-axes (x, y, z), pitch (deg, nose down +) */
export type Plate = {c: V3; a: V3; pitch: number; band: boolean};
export const PRONOTUM: Plate = {c: [14.0, 0, 6.2], a: [10.2, 14.0, 3.2], pitch: 5, band: false};
export const THORAX: Plate[] = [
  {c: [3.0, 0, 6.8], a: [4.6, 14.0, 3.1], pitch: 0, band: true}, // mesonotum
  {c: [-3.6, 0, 6.8], a: [4.6, 14.4, 3.1], pitch: 0, band: true}, // metanotum
];
/** abdominal tergites 1..7, front to back */
export const TERGITES: Plate[] = [
  [-10.4, 14.3, 6.9], [-15.6, 14.4, 6.7], [-20.6, 14.0, 6.4], [-25.4, 13.0, 6.0], [-30.0, 11.4, 5.5], [-34.2, 9.2, 5.0], [-37.8, 6.6, 4.4],
].map(([x, w, z], k) => ({c: [x, 0, z - 0.2] as V3, a: [5.0 - k * 0.12, w, 3.0 - k * 0.2] as V3, pitch: -2 - k * 1.5, band: true}));
/** the underside (sternites), one soft ellipsoid that fills the body's thickness */
export const VENTER: {c: V3; a: V3} = {c: [-9, 0, 4.0], a: [29, 12.4, 2.6]};

export type LegPose = {ankle: V3; foot: V3; pole?: V3};
export type RoachState = {
  body: Frame;
  headPitch: number; // nose down +
  headYaw: number;
  antTw: [number, number]; // per-side antenna swing (deg; + = outward)
  antLift: [number, number]; // per-side antenna lift (deg)
  legs: LegPose[];
  abdPitch: number; // + = tip up
  breathe: number; // 0..1 abdominal pump
  scale?: number;
};

export type LegJ = {socket: V3; troch: V3; knee: V3; ankle: V3; foot: V3; i: number};
export type Rig = {
  st: RoachState;
  body: Frame;
  head: Frame; // origin at the neck
  headC: V3;
  legs: LegJ[];
  ants: {socket: V3; pts: V3[]}[];
};

/** body-local point -> world */
export const bw = (st: RoachState, p: V3) => toW(st.body, mul3(p, st.scale ?? 1));
export const headFrame = (st: RoachState): Frame => {
  const n = bw(st, NECK);
  let H: Frame = {...st.body, o: n};
  H = pitchF(H, 38 + st.headPitch, n);
  H = yawF(H, st.headYaw, n);
  return H;
};
export const hw = (st: RoachState, H: Frame, p: V3) => toW(H, mul3(p, st.scale ?? 1));

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

export const socketOf = (st: RoachState, i: number): V3 => {
  const k = pair(i), s = side(i);
  return bw(st, [SOCKET[k][0], SOCKET[k][1] * s, SOCKET[k][2]]);
};
/** the trochanter (end of the coxa) of leg i */
export const trochOf = (st: RoachState, i: number): V3 => {
  const k = pair(i), s = side(i);
  const cdir = norm3(dirW(st.body, [COXA_DIR[k][0], COXA_DIR[k][1] * s, COXA_DIR[k][2]]));
  return add3(socketOf(st, i), mul3(cdir, LEN.coxa[k] * (st.scale ?? 1)));
};

/** the standing foot positions in body coordinates (on the floor, local z = 0) */
export const REST_FOOT: V3[] = [[26, 19, 0], [26, -19, 0], [5, 26, 0], [5, -26, 0], [-27, 22, 0], [-27, -22, 0]];

/** a planted leg: the tarsus lies on the surface (normal n) and slopes up to the ankle on the hip side */
export const planted = (st: RoachState, i: number, foot: V3, n: V3 = [0, 0, 1], lift = 0): LegPose => {
  const k = pair(i), sc = st.scale ?? 1;
  const T = trochOf(st, i);
  const f = add3(foot, mul3(n, lift));
  let toHip = sub3(T, f);
  toHip = sub3(toHip, mul3(n, dot3(toHip, n)));
  const along = len3(toHip) > 1e-4 ? norm3(toHip) : st.body.f;
  const tl = LEN.tarsus[k] * sc;
  const ankle = add3(f, add3(mul3(along, tl * 0.86), mul3(n, tl * 0.5 + lift * 0.3)));
  return {ankle, foot: f};
};
export const lerpLeg = (a: LegPose, b: LegPose, t: number): LegPose => ({ankle: lerp3(a.ankle, b.ankle, t), foot: lerp3(a.foot, b.foot, t)});

export const solve = (st: RoachState): Rig => {
  const sc = st.scale ?? 1;
  const head = headFrame(st);
  const headC = hw(st, head, HEAD_C);
  const legs: LegJ[] = LEGS.map((i) => {
    const k = pair(i), s = side(i);
    const socket = socketOf(st, i);
    const troch = trochOf(st, i);
    const L = st.legs[i];
    // knees up and out (a sprawled insect leg), the front knees a little forward, the hind knees back
    const pole = L.pole ?? add3(mul3(st.body.u, [0.7, 1.0, 1.0][k]), add3(mul3(st.body.l, [1.1, 0.9, 0.8][k] * s), mul3(st.body.f, [0.6, 0, -0.6][k])));
    const {knee, ankle} = ik2(troch, L.ankle, LEN.femur[k] * sc, LEN.tibia[k] * sc, pole);
    const fd = sub3(L.foot, L.ankle);
    const foot = add3(ankle, mul3(len3(fd) > 1e-5 ? norm3(fd) : st.body.f, LEN.tarsus[k] * sc));
    return {socket, troch, knee, ankle, foot, i};
  });
  // antennae: long, filiform, from the front of the head, sweeping forward and out, curving down at the tips
  const ants = [1, -1].map((s, j) => {
    const socket = hw(st, head, [5.4, 2.0 * s, 0.6]);
    const sw = st.antTw[j], lf = st.antLift[j];
    let d = norm3(dirW(st.body, [0.86, 0.36 * s, 0.32]));
    d = rotA(d, st.body.u, sw * s);
    d = rotA(d, st.body.l, -lf);
    const pts: V3[] = [socket];
    const n = 14;
    for (let k = 1; k <= n; k++) {
      // curl outward and down along the length
      d = norm3(add3(d, add3(mul3(st.body.u, -0.035), mul3(st.body.l, 0.03 * s))));
      pts.push(add3(pts[k - 1], mul3(d, 2.05 * sc)));
    }
    return {socket, pts};
  });
  return {st, body: st.body, head, headC, legs, ants};
};

/** where the backpack sits (body coordinates): on the meso- and metanotum, just behind the pronotum */
export const PACK_SEAT: V3 = [-2.4, 0, 10.9];
/** the soft membrane under the rear edge of the pronotum, where the electrode tips go */
export const MEMBRANE: V3 = [5.2, 0, 7.6];
