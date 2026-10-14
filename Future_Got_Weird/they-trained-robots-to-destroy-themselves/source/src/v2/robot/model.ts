// Robot body models built on RIG-F02. Every part is a stack of rings (superellipse cross-sections) in a local frame;
// the renderer projects the rings and draws their convex hull, so any camera angle gives a consistent silhouette.
//
// Asset ids:  MODEL-F02 (retired robot, dark hard shell), MODEL-F03 (newer model, soft fabric over foam),
//             MODEL-SIM (the same F.02 geometry as a virtual robot), MODEL-PERF (generic human stunt performer).
// Design basis: see production/v2/ROBOT_REFERENCE.md. No logo or on-body marking is drawn (not verifiable here).
import {M3, V3, add, cross, frameAlong, mv, norm, rotAxis, mulS, sub} from '../engine/math';
import {Skeleton, SideSk} from './rig';

export type Ring = {y: number; rx: number; rz: number; cz?: number; cx?: number; n?: number};
export type MatKey = 'shell' | 'joint' | 'visor' | 'mesh' | 'sole' | 'skin';
export type Decal =
  | {kind: 'curve'; pts: [number, number][]; mat?: 'seam' | 'seamLight' | 'accent'; w?: number}          // (y, theta deg) on the ring surface
  | {kind: 'patch'; y0: number; y1: number; t0: number; t1: number; mat: 'visor' | 'panel' | 'vent' | 'accent' | 'dark'; round?: number}
  | {kind: 'dot'; y: number; t: number; r: number; mat: 'lens' | 'marker' | 'accent'};
export type Part = {
  id: string;
  o: V3;
  m: M3;
  rings: Ring[];
  mat: MatKey;
  decals?: Decal[];
  bias?: number;
  seg?: number;
  /** Rotate the ring frame so that the ring's +z faces this world direction for decals (optional). */
};

export type ModelKind = 'F02' | 'F03' | 'SIM' | 'PERF';

// ---------------------------------------------------------------- shared geometry tables (cm)

const PELVIS: Ring[] = [
  {y: 9.5, rx: 11.5, rz: 8.6, n: 2.6},
  {y: 5, rx: 14.6, rz: 10.2, n: 2.8},
  {y: -1, rx: 16.2, rz: 10.8, n: 3.0},
  {y: -7, rx: 15.2, rz: 10.0, n: 2.8},
  {y: -11.5, rx: 10.5, rz: 7.6, n: 2.4},
];
const ABDOMEN: Ring[] = [
  {y: -2.5, rx: 11.4, rz: 8.6, n: 2.6},
  {y: 4, rx: 12.0, rz: 9.0, n: 2.6},
  {y: 10, rx: 13.6, rz: 9.8, cz: 0.6, n: 2.6},
];
export const CHEST: Ring[] = [
  {y: 10, rx: 14.6, rz: 10.4, cz: 0.8, n: 2.8},
  {y: 17, rx: 17.4, rz: 12.2, cz: 1.6, n: 3.0},
  {y: 26, rx: 19.6, rz: 12.8, cz: 1.8, n: 3.2},
  {y: 33, rx: 20.2, rz: 12.0, cz: 1.2, n: 3.2},
  {y: 37.5, rx: 17.2, rz: 10.2, cz: 0.4, n: 2.8},
  {y: 40.5, rx: 11.0, rz: 7.6, cz: 0, n: 2.4},
];
const NECK: Ring[] = [
  {y: -3, rx: 5.6, rz: 5.8},
  {y: 2, rx: 4.6, rz: 5.0},
  {y: 6, rx: 4.4, rz: 4.8},
];
const HEAD: Ring[] = [
  {y: -1.5, rx: 5.8, rz: 6.6, cz: 1.4, n: 2.4},
  {y: 1, rx: 7.6, rz: 9.0, cz: 1.0, n: 2.6},
  {y: 5.5, rx: 8.4, rz: 9.8, cz: 0.6, n: 2.8},
  {y: 11.5, rx: 8.6, rz: 9.9, cz: 0.3, n: 2.8},
  {y: 16, rx: 8.0, rz: 9.1, cz: 0, n: 2.6},
  {y: 18.6, rx: 6.6, rz: 7.5, n: 2.4},
  {y: 19.9, rx: 4.2, rz: 4.8, n: 2.2},
];
const THIGH: Ring[] = [
  {y: -3.5, rx: 6.0, rz: 6.6},
  {y: 1.5, rx: 7.8, rz: 8.6, n: 2.3},
  {y: 14, rx: 8.0, rz: 8.8, cz: 0.4, n: 2.3},
  {y: 29, rx: 7.0, rz: 7.6, cz: 0.6, n: 2.2},
  {y: 38.5, rx: 6.0, rz: 6.4, cz: 0.4},
  {y: 42.5, rx: 4.2, rz: 4.6},
];
const SHIN: Ring[] = [
  {y: -2.5, rx: 5.0, rz: 5.6},
  {y: 3.5, rx: 5.8, rz: 6.6, cz: 0.6, n: 2.3},
  {y: 15, rx: 5.6, rz: 6.4, cz: 0.4, n: 2.3},
  {y: 31, rx: 4.3, rz: 4.8},
  {y: 39, rx: 3.6, rz: 3.9},
  {y: 42.5, rx: 2.6, rz: 2.8},
];
const FOOT: Ring[] = [ // y = forward from the ankle; rz = half height; cz = height centre (sole at -10)
  {y: -7.4, rx: 3.6, rz: 2.6, cz: -6.4},
  {y: -6.2, rx: 4.6, rz: 3.6, cz: -6.4, n: 2.6},
  {y: -1, rx: 5.0, rz: 4.6, cz: -5.4, n: 2.8},
  {y: 6, rx: 5.2, rz: 3.6, cz: -6.4, n: 2.8},
  {y: 13, rx: 5.0, rz: 2.7, cz: -7.3, n: 2.6},
  {y: 17.5, rx: 4.4, rz: 2.1, cz: -7.9, n: 2.4},
  {y: 19.6, rx: 2.8, rz: 1.5, cz: -8.4},
];
const SHOULDER: Ring[] = [
  {y: -6.5, rx: 4.4, rz: 4.8},
  {y: -3.5, rx: 7.0, rz: 7.6, n: 2.2},
  {y: 2, rx: 7.6, rz: 8.0, n: 2.2},
  {y: 6.5, rx: 6.2, rz: 6.6},
];
const UPPER: Ring[] = [
  {y: 1, rx: 5.6, rz: 6.0, n: 2.2},
  {y: 12, rx: 5.4, rz: 5.8, n: 2.2},
  {y: 24, rx: 4.8, rz: 5.1},
  {y: 29.5, rx: 3.8, rz: 4.0},
];
const FORE: Ring[] = [
  {y: -2, rx: 4.0, rz: 4.2},
  {y: 4, rx: 4.8, rz: 5.0, n: 2.2},
  {y: 14, rx: 4.4, rz: 4.6, n: 2.2},
  {y: 23, rx: 3.5, rz: 3.6},
  {y: 26.5, rx: 2.8, rz: 2.9},
];
const PALM: Ring[] = [ // x = thickness (palm normal), z = width
  {y: -0.5, rx: 1.6, rz: 3.0},
  {y: 2.5, rx: 2.0, rz: 4.1, n: 2.6},
  {y: 8.5, rx: 1.8, rz: 4.3, n: 2.8},
  {y: 10, rx: 1.3, rz: 3.9, n: 2.4},
];
const capsule = (len: number, r0: number, r1: number): Ring[] => [
  {y: -r0 * 0.75, rx: r0 * 0.66, rz: r0 * 0.66},
  {y: 0, rx: r0, rz: r0},
  {y: len, rx: r1, rz: r1},
  {y: len + r1 * 0.75, rx: r1 * 0.66, rz: r1 * 0.66},
];
const disc = (r: number, half: number): Ring[] => [
  {y: -half - 0.4, rx: r * 0.82, rz: r * 0.82},
  {y: -half, rx: r, rz: r},
  {y: half, rx: r, rz: r},
  {y: half + 0.4, rx: r * 0.82, rz: r * 0.82},
];

// ---------------------------------------------------------------- per-model tweaks

type Tweak = {limb: number; torso: number; head: number; headN: number; slim: number};
const TWEAK: Record<ModelKind, Tweak> = {
  F02: {limb: 1, torso: 1, head: 1, headN: 0, slim: 1},
  SIM: {limb: 1, torso: 1, head: 1, headN: 0, slim: 1},
  F03: {limb: 0.93, torso: 0.95, head: 0.97, headN: -0.5, slim: 0.94},
  PERF: {limb: 0.86, torso: 0.9, head: 0.9, headN: -0.6, slim: 0.9},
};
const scaleRings = (rs: Ring[], k: number, kz = k, dn = 0): Ring[] =>
  rs.map((r) => ({...r, rx: r.rx * k, rz: r.rz * kz, n: Math.max(2, (r.n ?? 2) + dn)}));

// ---------------------------------------------------------------- decals

const F02_DECALS = {
  chest: [
    // battery bay outline on the front of the torso (rounded panel) and the waist band seam
    {kind: 'patch', y0: 14.5, y1: 31.5, t0: -46, t1: 46, mat: 'panel', round: 0.35},
    {kind: 'curve', pts: [[12, -80], [12, -40], [11.4, 0], [12, 40], [12, 80]], mat: 'seam'},
    {kind: 'curve', pts: [[37.2, -62], [36.2, -30], [35.8, 0], [36.2, 30], [37.2, 62]], mat: 'seamLight'},
    {kind: 'curve', pts: [[33, -78], [26, -88], [17, -92]], mat: 'seam'},
    {kind: 'curve', pts: [[33, 78], [26, 88], [17, 92]], mat: 'seam'},
    // back: battery cover and three vents
    {kind: 'patch', y0: 13, y1: 33, t0: 140, t1: 220, mat: 'panel', round: 0.3},
    {kind: 'patch', y0: 26, y1: 27.6, t0: 160, t1: 200, mat: 'vent'},
    {kind: 'patch', y0: 22.5, y1: 24.1, t0: 160, t1: 200, mat: 'vent'},
    {kind: 'patch', y0: 19, y1: 20.6, t0: 160, t1: 200, mat: 'vent'},
  ] as Decal[],
  head: [
    // glossy face panel that wraps the front of the head; rear cameras (two front cameras sit behind the face panel)
    {kind: 'patch', y0: 0.6, y1: 16.2, t0: -64, t1: 64, mat: 'visor', round: 0.45},
    {kind: 'curve', pts: [[17.4, -70], [17.9, -35], [18.0, 0], [17.9, 35], [17.4, 70]], mat: 'seamLight'},
    {kind: 'dot', y: 11.5, t: 150, r: 0.9, mat: 'lens'},
    {kind: 'dot', y: 11.5, t: 170, r: 0.9, mat: 'lens'},
    {kind: 'dot', y: 11.5, t: 190, r: 0.9, mat: 'lens'},
    {kind: 'dot', y: 11.5, t: 210, r: 0.9, mat: 'lens'},
  ] as Decal[],
  pelvis: [
    {kind: 'curve', pts: [[4.5, -60], [3.5, -20], [3.2, 0], [3.5, 20], [4.5, 60]], mat: 'seam'},
    {kind: 'curve', pts: [[-2, -12], [-11, -4], [-11, 4], [-2, 12]], mat: 'seam'},
    // hip actuator caps on both sides
    {kind: 'dot', y: -2.5, t: 90, r: 5.2, mat: 'accent'},
    {kind: 'dot', y: -2.5, t: -90, r: 5.2, mat: 'accent'},
    {kind: 'dot', y: -2.5, t: 90, r: 2.2, mat: 'lens'},
    {kind: 'dot', y: -2.5, t: -90, r: 2.2, mat: 'lens'},
  ] as Decal[],
  thigh: [
    {kind: 'curve', pts: [[3, -18], [20, -12], [35, -14]], mat: 'seam'},
    {kind: 'curve', pts: [[3, 18], [20, 12], [35, 14]], mat: 'seam'},
    {kind: 'curve', pts: [[4, 0], [20, 0], [33, 0]], mat: 'seamLight'},
  ] as Decal[],
  shin: [
    {kind: 'patch', y0: 3, y1: 27, t0: -30, t1: 30, mat: 'panel', round: 0.5},
    {kind: 'curve', pts: [[6, 95], [22, 95]], mat: 'seam'},
  ] as Decal[],
  upper: [{kind: 'curve', pts: [[3, 90], [22, 90]], mat: 'seam'}] as Decal[],
  fore: [{kind: 'curve', pts: [[3, 0], [18, 0]], mat: 'seamLight'}, {kind: 'curve', pts: [[2, 90], [20, 90]], mat: 'seam'}] as Decal[],
  foot: [{kind: 'curve', pts: [[-6.5, 90], [0, 90], [8, 90], [16, 90]], mat: 'seam'}] as Decal[],
};

const F03_DECALS = {
  // soft goods: knit seams instead of hard panels; a darker face mask
  chest: [
    {kind: 'curve', pts: [[38, 0], [26, 0], [12, 0]], mat: 'seam'},
    {kind: 'curve', pts: [[30, -70], [24, -40], [22, 0], [24, 40], [30, 70]], mat: 'seam'},
    {kind: 'curve', pts: [[12, -85], [11.5, 0], [12, 85]], mat: 'seam'},
  ] as Decal[],
  head: [
    {kind: 'patch', y0: 2.5, y1: 14.5, t0: -52, t1: 52, mat: 'visor', round: 0.55},
  ] as Decal[],
  pelvis: [{kind: 'curve', pts: [[4.5, -60], [3.8, 0], [4.5, 60]], mat: 'seam'}] as Decal[],
  thigh: [{kind: 'curve', pts: [[4, 0], [33, 0]], mat: 'seam'}] as Decal[],
  shin: [{kind: 'curve', pts: [[4, 0], [30, 0]], mat: 'seam'}] as Decal[],
  upper: [] as Decal[],
  fore: [] as Decal[],
  foot: [{kind: 'curve', pts: [[-6.5, 90], [0, 90], [8, 90], [16, 90]], mat: 'seam'}] as Decal[],
};

const PERF_DECALS = {
  chest: [{kind: 'dot', y: 30, t: 0, r: 1.6, mat: 'marker'}, {kind: 'dot', y: 20, t: 180, r: 1.6, mat: 'marker'}, {kind: 'dot', y: 33, t: 75, r: 1.4, mat: 'marker'}, {kind: 'dot', y: 33, t: -75, r: 1.4, mat: 'marker'}] as Decal[],
  head: [{kind: 'dot', y: 17, t: 0, r: 1.4, mat: 'marker'}, {kind: 'dot', y: 12, t: 90, r: 1.3, mat: 'marker'}, {kind: 'dot', y: 12, t: -90, r: 1.3, mat: 'marker'}] as Decal[],
  pelvis: [{kind: 'dot', y: 0, t: 70, r: 1.4, mat: 'marker'}, {kind: 'dot', y: 0, t: -70, r: 1.4, mat: 'marker'}] as Decal[],
  thigh: [{kind: 'dot', y: 20, t: 70, r: 1.3, mat: 'marker'}] as Decal[],
  shin: [{kind: 'dot', y: 2, t: 40, r: 1.3, mat: 'marker'}, {kind: 'dot', y: 30, t: 70, r: 1.3, mat: 'marker'}] as Decal[],
  upper: [{kind: 'dot', y: 4, t: 90, r: 1.2, mat: 'marker'}] as Decal[],
  fore: [{kind: 'dot', y: 22, t: 90, r: 1.2, mat: 'marker'}] as Decal[],
  foot: [{kind: 'dot', y: 14, t: 0, r: 1.2, mat: 'marker'}] as Decal[],
};

const decalsFor = (kind: ModelKind) => (kind === 'F03' ? F03_DECALS : kind === 'PERF' ? PERF_DECALS : F02_DECALS);

// ---------------------------------------------------------------- build

/** Frame whose local y axis is `axis` (rings perpendicular to it) with local z kept toward `front`. */
const axisFrame = (axis: V3, front: V3): M3 => {
  const y = norm(axis);
  let x = cross(y, front);
  const l = Math.hypot(...x);
  if (l < 1e-6) x = cross(y, [0, 0, 1]);
  x = norm(x);
  const z = cross(x, y);
  return [x, y, z];
};

export type BuildOpts = {kind: ModelKind; detailHands: boolean; explode?: number; explodeSeed?: number};

export const buildParts = (sk: Skeleton, o: BuildOpts): Part[] => {
  const tw = TWEAK[o.kind];
  const dec = decalsFor(o.kind);
  const isPerf = o.kind === 'PERF';
  const isF03 = o.kind === 'F03';
  const parts: Part[] = [];
  const bodyFwd = sk.body[2];

  parts.push({id: 'pelvis', o: sk.pelvis, m: sk.body, rings: scaleRings(PELVIS, tw.torso * (isPerf ? 0.92 : 1)), mat: 'shell', decals: dec.pelvis, bias: 0.5, seg: 18});
  parts.push({id: 'abdomen', o: sk.torso.o, m: sk.torso.m, rings: scaleRings(ABDOMEN, tw.torso), mat: isF03 || isPerf ? 'shell' : 'joint', bias: -1, seg: 16});
  const chestRings = isPerf
    ? scaleRings(CHEST, 0.88, 0.92, -0.6)
    : scaleRings(CHEST, tw.torso, tw.torso, isF03 ? -0.5 : 0);
  parts.push({id: 'chest', o: sk.torso.o, m: sk.torso.m, rings: chestRings, mat: 'shell', decals: dec.chest, bias: 0, seg: 22});
  parts.push({id: 'neck', o: sk.neck.o, m: sk.neck.m, rings: NECK, mat: isPerf ? 'shell' : 'mesh', bias: 1.5, seg: 12});
  const headRings = isPerf
    ? [{y: -1.5, rx: 5.0, rz: 6.0, cz: 1.2}, {y: 2, rx: 7.2, rz: 8.6, cz: 1}, {y: 8, rx: 7.8, rz: 9.4, cz: 0.4}, {y: 14, rx: 7.6, rz: 9.0}, {y: 18.5, rx: 5.6, rz: 6.6}, {y: 20.5, rx: 2.8, rz: 3.2}]
    : scaleRings(HEAD, tw.head, tw.head, tw.headN);
  parts.push({id: 'head', o: sk.head.o, m: sk.head.m, rings: headRings, mat: 'shell', decals: dec.head, bias: 7, seg: 24});

  const sideParts = (sd: SideSk, tag: 'L' | 'R') => {
    const s = sd.sgn;
    const lat = sk.body[0];
    // legs
    parts.push({id: 'thigh' + tag, o: sd.hip, m: axisFrame(sub(sd.knee, sd.hip), bodyFwd), rings: scaleRings(THIGH, tw.limb), mat: 'shell', decals: dec.thigh, bias: 2, seg: 16});
    if (!isPerf && !isF03) {
      parts.push({id: 'kneeAct' + tag, o: sd.knee, m: axisFrame(sk.side[tag].thigh.m[0], bodyFwd), rings: disc(5.4, 5.6), mat: 'joint', bias: 2.6, seg: 14});
      parts.push({id: 'ankleAct' + tag, o: sd.ankle, m: axisFrame(sd.foot.m[0], sd.foot.m[2]), rings: disc(3.4, 4.2), mat: 'joint', bias: 3.2, seg: 12});
    }
    const shinFront = add(mulS(bodyFwd, 0.6), mulS(sd.foot.m[2], 0.4));
    parts.push({id: 'shin' + tag, o: sd.knee, m: axisFrame(sub(sd.ankle, sd.knee), shinFront), rings: scaleRings(SHIN, tw.limb), mat: 'shell', decals: dec.shin, bias: 2.8, seg: 16});
    // foot: local y = forward, local z = up (ring "rz" is the half height)
    const fm = sd.foot.m;
    const footM: M3 = [fm[0], fm[2], fm[1]];
    parts.push({id: 'foot' + tag, o: sd.ankle, m: footM, rings: scaleRings(FOOT, isPerf ? 0.9 : 1, 1), mat: isPerf ? 'shell' : 'shell', decals: dec.foot, bias: 3.4, seg: 14});
    parts.push({id: 'sole' + tag, o: sd.ankle, m: footM, rings: FOOT.map((r) => ({...r, rz: 0.9, cz: -9.3, rx: r.rx * 0.98})), mat: 'sole', bias: 3.3, seg: 12});

    // arms
    const upFrame = axisFrame(sub(sd.elbow, sd.shoulder), sk.torso.m[2]);
    if (!isPerf) parts.push({id: 'shoulder' + tag, o: sd.shoulder, m: upFrame, rings: scaleRings(SHOULDER, tw.limb * (isF03 ? 0.92 : 1)), mat: 'shell', bias: 3.2, seg: 16});
    parts.push({id: 'upper' + tag, o: sd.shoulder, m: upFrame, rings: scaleRings(UPPER, tw.limb), mat: 'shell', decals: dec.upper, bias: 3, seg: 14});
    if (!isPerf && !isF03) parts.push({id: 'elbowAct' + tag, o: sd.elbow, m: axisFrame(upFrame[0], upFrame[2]), rings: disc(4.4, 4.6), mat: 'joint', bias: 3.6, seg: 12});
    parts.push({id: 'fore' + tag, o: sd.elbow, m: axisFrame(sub(sd.wrist, sd.elbow), sd.hand.m[2]), rings: scaleRings(FORE, tw.limb), mat: 'shell', decals: dec.fore, bias: 4, seg: 14});
    if (!isPerf && !isF03) parts.push({id: 'wristAct' + tag, o: sd.wrist, m: sd.hand.m, rings: capsule(0.1, 3.0, 3.0), mat: 'joint', bias: 4.2, seg: 10});
    // hand
    const hm = sd.hand.m;
    parts.push({id: 'palm' + tag, o: sd.wrist, m: hm, rings: PALM, mat: isPerf ? 'shell' : 'joint', bias: 4.6, seg: 12});
    const hx = hm[0], hy = hm[1], hz = hm[2];
    const thumbSide = s; // +hz for the left hand, -hz for the right
    if (o.detailHands) {
      const fingers = [
        {z: 3.0, l1: 4.0, l2: 3.4}, {z: 1.0, l1: 4.4, l2: 3.6}, {z: -1.0, l1: 4.2, l2: 3.4}, {z: -2.9, l1: 3.4, l2: 2.8},
      ];
      const g = sd.grip;
      fingers.forEach((fi, k) => {
        const base = add(sd.wrist, add(mulS(hy, 9.6), mulS(hz, fi.z * thumbSide)));
        const curl1 = rotAxis(hz, -g * 1.25); // both hand frames are right-handed with x = palm normal
        const d1 = mv(curl1, hy);
        const mid = add(base, mulS(d1, fi.l1));
        const curl2 = rotAxis(hz, -g * 1.45);
        const d2 = mv(curl2, d1);
        parts.push({id: `f${k}a${tag}`, o: base, m: axisFrame(d1, hx), rings: capsule(fi.l1, 0.95, 0.9), mat: 'joint', bias: 4.8, seg: 8});
        parts.push({id: `f${k}b${tag}`, o: mid, m: axisFrame(d2, hx), rings: capsule(fi.l2, 0.88, 0.75), mat: 'joint', bias: 4.9, seg: 8});
      });
      // thumb: from the thumb side of the palm, angled forward, curls across the palm with grip
      const tb = add(sd.wrist, add(mulS(hy, 2.6), add(mulS(hz, 3.8 * thumbSide), mulS(hx, 0.8))));
      const tdir0 = norm(add(mulS(hy, 0.75), mulS(hz, 0.66 * thumbSide)));
      const td1 = mv(rotAxis(hy, thumbSide * 0.3 + sd.grip * 0.4 * thumbSide), mv(rotAxis(cross(tdir0, hx), sd.grip * 0.5), tdir0));
      const tm = add(tb, mulS(td1, 3.6));
      const td2 = mv(rotAxis(hz, -sd.grip * 0.9), td1);
      parts.push({id: `tha${tag}`, o: tb, m: axisFrame(td1, hx), rings: capsule(3.6, 1.15, 1.0), mat: 'joint', bias: 4.85, seg: 8});
      parts.push({id: `thb${tag}`, o: tm, m: axisFrame(td2, hx), rings: capsule(3.0, 1.0, 0.85), mat: 'joint', bias: 4.95, seg: 8});
    } else {
      // mitten: fingers merged, still curling with the grip
      const g = sd.grip;
      const d1 = mv(rotAxis(hz, -g * 1.2), hy);
      parts.push({id: 'mitt' + tag, o: add(sd.wrist, mulS(hy, 9)), m: axisFrame(d1, hx), rings: [
        {y: -0.5, rx: 1.4, rz: 4.0}, {y: 3.5, rx: 1.3, rz: 4.0, n: 2.4}, {y: 7, rx: 1.0, rz: 3.2},
      ], mat: 'joint', bias: 4.8, seg: 10});
    }
  };
  sideParts(sk.side.L, 'L');
  sideParts(sk.side.R, 'R');

  if (o.explode && o.explode > 0) {
    // exploded view: parts drift away from the pelvis along their own offset, deterministic per id
    const c = sk.torso.o;
    for (const p of parts) {
      const dir = norm(sub(p.o, c));
      const k = o.explode * (p.id.startsWith('f') || p.id.startsWith('th') ? 0.6 : 1);
      p.o = add(p.o, mulS(dir, 26 * k));
    }
  }
  return parts;
};

/** Point on a ring stack at height y and angle theta (deg; 0 = local +z, 90 = local +x). Local coordinates. */
export const surfLocal = (rings: Ring[], y: number, thetaDeg: number, lift = 0.15): {p: V3; n: V3} => {
  let i = 0;
  while (i < rings.length - 2 && rings[i + 1].y < y) i++;
  const a = rings[i], b = rings[Math.min(i + 1, rings.length - 1)];
  const t = b.y === a.y ? 0 : Math.max(0, Math.min(1, (y - a.y) / (b.y - a.y)));
  const L = (u: number, v: number) => u + (v - u) * t;
  const rx = L(a.rx, b.rx) + lift, rz = L(a.rz, b.rz) + lift;
  const cx = L(a.cx ?? 0, b.cx ?? 0), cz = L(a.cz ?? 0, b.cz ?? 0), n = L(a.n ?? 2, b.n ?? 2);
  const th = (thetaDeg * Math.PI) / 180;
  const s = Math.sin(th), c = Math.cos(th);
  const e = 2 / n;
  const sx = Math.sign(s) * Math.pow(Math.abs(s), e), sz = Math.sign(c) * Math.pow(Math.abs(c), e);
  const p: V3 = [cx + rx * sx, y, cz + rz * sz];
  // normal of a superellipse ~ gradient of |x/rx|^n + |z/rz|^n
  const gx = (Math.sign(sx) * Math.pow(Math.abs(sx), n - 1)) / rx;
  const gz = (Math.sign(sz) * Math.pow(Math.abs(sz), n - 1)) / rz;
  const slope = (b.rz - a.rz) / Math.max(1e-3, b.y - a.y);
  return {p, n: norm([gx, -slope * 0.05 * Math.abs(c), gz])};
};

export const toWorld = (part: Part, local: V3): V3 => add(part.o, mv(part.m, local));
export const dirWorld = (part: Part, local: V3): V3 => norm(mv(part.m, local));

/** Sample ring loops (world space) for hull rendering. */
export const ringLoops = (part: Part): V3[][] => {
  const N = part.seg ?? 14;
  return part.rings.map((r) => {
    const n = r.n ?? 2, e = 2 / n;
    const loop: V3[] = [];
    for (let k = 0; k < N; k++) {
      const th = (2 * Math.PI * k) / N;
      const s = Math.sin(th), c = Math.cos(th);
      const lx = (r.cx ?? 0) + r.rx * Math.sign(s) * Math.pow(Math.abs(s), e);
      const lz = (r.cz ?? 0) + r.rz * Math.sign(c) * Math.pow(Math.abs(c), e);
      loop.push(toWorld(part, [lx, r.y, lz]));
    }
    return loop;
  });
};

export const partCenter = (part: Part): V3 => {
  const r0 = part.rings[0], r1 = part.rings[part.rings.length - 1];
  return toWorld(part, [0, (r0.y + r1.y) / 2, ((r0.cz ?? 0) + (r1.cz ?? 0)) / 2]);
};

export {frameAlong};
