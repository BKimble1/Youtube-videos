// Robot body models on the shared skeleton (RIG-F02 joints). Every part is a stack of rings (superellipse
// cross-sections) in a local frame; the renderer projects the rings and draws their convex hull, so any camera angle
// gives a consistent silhouette. Surface boundaries and markings are decals mapped onto those rings.
//
// Separate model records (V3):
//   MODEL-F02  retired robot: graphite hard shell, shield-shaped visor framed by hood contours, tapered torso over an
//              exposed mechanical waist, battery housing on the back, protruding shoulder/hip/knee/elbow actuators,
//              articulated dark hands.                                                   → F02_SPEC
//   MODEL-F03  newer model: light knit soft goods over padding, rounder head with an oval face screen, fuller torso
//              without a waist pinch, slimmer limbs with thin dark joint bands, fabric hands, the Figure symbol on the
//              chest.                                                                     → F03_SPEC
//   MODEL-SIM  the training avatar: F02_SPEC geometry in a schematic (translucent, contour-lined) treatment.
//   MODEL-PERF generic human stunt performer (a person, deliberately not a robot).
// Design basis and limits: production/v3/MODEL_RECORDS_V3.md (reference images were not reachable from this
// environment; shapes follow text descriptions and general knowledge of the two robots).
import {M3, V3, add, cross, frameAlong, mv, norm, rotAxis, mulS, sub} from '../engine/math';
import {Skeleton, SideSk} from './rig';

export type Ring = {y: number; rx: number; rz: number; cz?: number; cx?: number; n?: number};
export type MatKey = 'shell' | 'joint' | 'visor' | 'mesh' | 'sole' | 'skin' | 'band' | 'glove' | 'pack';
export type Decal =
  | {kind: 'curve'; pts: [number, number][]; mat?: 'seam' | 'seamLight' | 'accent'; w?: number; op?: number}   // (y, theta deg) on the ring surface
  | {kind: 'patch'; y0: number; y1: number; t0: number; t1: number; mat: 'visor' | 'panel' | 'vent' | 'accent' | 'dark'; round?: number}
  | {kind: 'poly'; pts: [number, number][]; mat: 'visor' | 'panel' | 'vent' | 'accent' | 'dark' | 'recess'}       // exact outline in (y, theta)
  | {kind: 'symbol'; y: number; t: number; h: number; color: 'dark' | 'light'}                                    // Figure symbol, h = height in cm
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
};

export type ModelKind = 'F02' | 'F03' | 'SIM' | 'PERF';

// ---------------------------------------------------------------- helpers
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
/** Closed outline from a superellipse in (theta, y) space. */
const superOutline = (yc: number, hy: number, ht: number, n: number, steps = 28): [number, number][] => {
  const out: [number, number][] = [];
  for (let k = 0; k < steps; k++) {
    const a = (2 * Math.PI * k) / steps;
    const c = Math.cos(a), s = Math.sin(a);
    const e = 2 / n;
    out.push([yc + hy * Math.sign(s) * Math.pow(Math.abs(s), e), ht * Math.sign(c) * Math.pow(Math.abs(c), e)]);
  }
  return out;
};
const mirrorT = (pts: [number, number][]): [number, number][] => pts.map(([y, t]) => [y, -t] as [number, number]);
/** Contour lines around a ring stack at each listed height (schematic treatment). */
const contours = (ys: number[]): Decal[] =>
  ys.map((y) => ({kind: 'curve', pts: [[y, -180], [y, -90], [y, 0], [y, 90], [y, 180]], mat: 'seamLight', w: 0.4, op: 0.7}) as Decal);

// ---------------------------------------------------------------- model spec
type Tables = {
  pelvis: Ring[]; abdomen: Ring[]; chest: Ring[]; pack?: Ring[]; neck: Ring[]; head: Ring[];
  thigh: Ring[]; shin: Ring[]; foot: Ring[]; shoulder?: Ring[]; upper: Ring[]; fore: Ring[]; palm: Ring[];
};
type Spec = {
  t: Tables;
  abdomenMat: MatKey; neckMat: MatKey; handMat: MatKey;
  actuators: boolean;   // protruding hip/knee/ankle/elbow/wrist actuator housings (hard-shell robots)
  bands: boolean;       // thin dark joint bands between soft sleeves
  finger: {r0: number; r1: number};
  decals: Partial<Record<'chest' | 'pack' | 'abdomen' | 'head' | 'pelvis' | 'thigh' | 'shin' | 'upper' | 'fore' | 'foot' | 'shoulder', Decal[]>>;
};

// ---------------------------------------------------------------- MODEL-F02
const F02_VISOR: [number, number][] = [
  [16.2, -58], [16.7, -30], [16.85, 0], [16.7, 30], [16.2, 58],
  [14.8, 64], [11.0, 66], [7.4, 61], [4.6, 50], [2.8, 33], [1.7, 15], [1.4, 0],
  [1.7, -15], [2.8, -33], [4.6, -50], [7.4, -61], [11.0, -66], [14.8, -64],
];
const F02_SIDE_POD: [number, number][] = [[14.6, 93], [15.2, 100], [14.6, 108], [7.4, 108], [6.8, 100], [7.4, 93]];
const F02_CHEST_PLATE: [number, number][] = [
  [33.6, -56], [34.6, -28], [34.9, 0], [34.6, 28], [33.6, 56], [27, 62], [20.5, 52], [16.8, 30], [15.8, 0], [16.8, -30], [20.5, -52], [27, -62],
];
const F02: Spec = {
  t: {
    pelvis: [
      {y: 9.5, rx: 11.2, rz: 8.2, n: 2.6}, {y: 5, rx: 14.6, rz: 9.8, n: 2.9}, {y: -1, rx: 16.4, rz: 10.6, n: 3.1},
      {y: -7, rx: 15.2, rz: 9.8, n: 2.9}, {y: -11.5, rx: 10.4, rz: 7.2, n: 2.4},
    ],
    abdomen: [{y: -3, rx: 9.0, rz: 6.8, n: 2.4}, {y: 3.5, rx: 9.2, rz: 7.0, n: 2.4}, {y: 10.5, rx: 11.0, rz: 8.0, n: 2.6}],
    chest: [
      {y: 10, rx: 12.2, rz: 9.0, cz: 0.4, n: 2.6}, {y: 16, rx: 16.4, rz: 11.2, cz: 0.6, n: 2.9}, {y: 24, rx: 20.0, rz: 12.6, cz: 0.6, n: 3.2},
      {y: 31, rx: 21.8, rz: 12.4, cz: 0.4, n: 3.5}, {y: 36.5, rx: 19.6, rz: 10.8, cz: 0.2, n: 3.2}, {y: 40.5, rx: 12.0, rz: 7.6, n: 2.4},
    ],
    pack: [ // battery housing on the back (protrudes ~4 cm behind the chest shell)
      {y: 12.5, rx: 10.5, rz: 3.0, cz: -11.2, n: 3.2}, {y: 14.5, rx: 13.0, rz: 4.2, cz: -12.0, n: 3.6},
      {y: 31, rx: 14.2, rz: 4.4, cz: -12.2, n: 3.6}, {y: 34, rx: 11.0, rz: 3.0, cz: -11.2, n: 3.2},
    ],
    neck: [{y: -3, rx: 5.4, rz: 5.6}, {y: 2, rx: 4.4, rz: 4.8}, {y: 6, rx: 4.2, rz: 4.6}],
    head: [
      {y: -1.2, rx: 5.6, rz: 6.4, cz: 1.2, n: 2.5}, {y: 1.2, rx: 8.0, rz: 9.4, cz: 0.6, n: 2.9}, {y: 5.5, rx: 9.2, rz: 10.6, cz: -0.2, n: 3.3},
      {y: 11.5, rx: 9.5, rz: 11.2, cz: -0.9, n: 3.4}, {y: 16.5, rx: 9.2, rz: 11.0, cz: -1.4, n: 3.3}, {y: 19.8, rx: 8.0, rz: 9.8, cz: -1.8, n: 2.9},
      {y: 21.8, rx: 5.8, rz: 7.2, cz: -2.0, n: 2.4},
    ],
    thigh: [
      {y: -3.5, rx: 6.2, rz: 6.8}, {y: 1.5, rx: 8.2, rz: 9.0, n: 2.5}, {y: 14, rx: 8.4, rz: 9.2, cz: 0.4, n: 2.6},
      {y: 29, rx: 7.2, rz: 7.8, cz: 0.6, n: 2.4}, {y: 38.5, rx: 6.0, rz: 6.4, cz: 0.4}, {y: 42.5, rx: 4.2, rz: 4.6},
    ],
    shin: [
      {y: -2.5, rx: 5.0, rz: 5.6}, {y: 3.5, rx: 6.0, rz: 6.8, cz: 0.6, n: 2.5}, {y: 15, rx: 5.8, rz: 6.6, cz: 0.4, n: 2.5},
      {y: 31, rx: 4.4, rz: 4.9}, {y: 39, rx: 3.7, rz: 4.0}, {y: 42.5, rx: 2.7, rz: 2.9},
    ],
    foot: [ // y = forward from the ankle; rz = half height; cz = height centre (sole at -10)
      {y: -7.8, rx: 4.2, rz: 3.0, cz: -6.4}, {y: -6.6, rx: 5.2, rz: 4.0, cz: -6.3, n: 3.0}, {y: -1, rx: 5.7, rz: 5.0, cz: -5.2, n: 3.2},
      {y: 6, rx: 5.9, rz: 4.0, cz: -6.2, n: 3.2}, {y: 13.5, rx: 5.7, rz: 3.0, cz: -7.1, n: 3.0}, {y: 18, rx: 5.0, rz: 2.4, cz: -7.7, n: 2.8},
      {y: 20.4, rx: 3.4, rz: 1.7, cz: -8.3},
    ],
    shoulder: [{y: -8, rx: 4.8, rz: 5.2}, {y: -4.5, rx: 9.0, rz: 8.8, n: 2.8}, {y: 2.5, rx: 9.6, rz: 9.0, n: 2.8}, {y: 7.5, rx: 7.2, rz: 7.0}],
    upper: [{y: 1, rx: 5.8, rz: 6.0, n: 2.4}, {y: 12, rx: 5.6, rz: 5.8, n: 2.4}, {y: 24, rx: 4.9, rz: 5.1}, {y: 29.5, rx: 3.9, rz: 4.1}],
    fore: [{y: -2, rx: 4.2, rz: 4.4}, {y: 4, rx: 5.2, rz: 4.8, n: 2.6}, {y: 12, rx: 5.0, rz: 4.6, n: 2.6}, {y: 22, rx: 3.8, rz: 3.6}, {y: 26.5, rx: 3.0, rz: 3.0}],
    palm: [{y: -0.5, rx: 1.6, rz: 3.0}, {y: 2.5, rx: 2.0, rz: 4.1, n: 2.6}, {y: 8.5, rx: 1.8, rz: 4.3, n: 2.8}, {y: 10, rx: 1.3, rz: 3.9, n: 2.4}],
  },
  abdomenMat: 'joint', neckMat: 'mesh', handMat: 'joint', actuators: true, bands: false,
  finger: {r0: 0.98, r1: 0.9},
  decals: {
    head: [
      {kind: 'poly', pts: F02_VISOR, mat: 'visor'},
      // the hood: shell contours that enclose the visor and run back along each side
      {kind: 'curve', pts: [[19.4, -70], [20.3, -35], [20.6, 0], [20.3, 35], [19.4, 70]], mat: 'seam', w: 0.65},
      {kind: 'curve', pts: [[19.4, 70], [16.2, 80], [11.2, 85], [6, 81], [2.4, 68], [0.4, 48]], mat: 'seam', w: 0.65},
      {kind: 'curve', pts: [[19.4, -70], [16.2, -80], [11.2, -85], [6, -81], [2.4, -68], [0.4, -48]], mat: 'seam', w: 0.65},
      {kind: 'curve', pts: [[20.6, 0], [21.6, 60], [21.4, 120], [20.4, 180]], mat: 'seamLight', w: 0.5},
      {kind: 'poly', pts: F02_SIDE_POD, mat: 'recess'},
      {kind: 'poly', pts: mirrorT(F02_SIDE_POD), mat: 'recess'},
    ],
    chest: [
      {kind: 'poly', pts: F02_CHEST_PLATE, mat: 'panel'},
      {kind: 'curve', pts: [[12.2, -80], [11.6, -40], [11.2, 0], [11.6, 40], [12.2, 80]], mat: 'seam'},
      {kind: 'curve', pts: [[37.4, -64], [36.4, -30], [36.1, 0], [36.4, 30], [37.4, 64]], mat: 'seamLight'},
      {kind: 'curve', pts: [[33, -80], [25, -90], [15.5, -94]], mat: 'seam'},
      {kind: 'curve', pts: [[33, 80], [25, 90], [15.5, 94]], mat: 'seam'},
    ],
    pack: [
      {kind: 'patch', y0: 26, y1: 27.4, t0: 160, t1: 200, mat: 'vent'},
      {kind: 'patch', y0: 22.6, y1: 24, t0: 160, t1: 200, mat: 'vent'},
      {kind: 'patch', y0: 19.2, y1: 20.6, t0: 160, t1: 200, mat: 'vent'},
    ],
    abdomen: [-48, -24, 0, 24, 48].map((t) => ({kind: 'curve', pts: [[-2, t], [4, t], [9.6, t]], mat: 'seamLight', w: 0.45, op: 0.5}) as Decal),
    pelvis: [
      {kind: 'curve', pts: [[4.5, -60], [3.5, -20], [3.2, 0], [3.5, 20], [4.5, 60]], mat: 'seam'},
      {kind: 'curve', pts: [[-2, -12], [-11, -4], [-11, 4], [-2, 12]], mat: 'seam'},
      {kind: 'dot', y: -2.5, t: 90, r: 5.4, mat: 'accent'}, {kind: 'dot', y: -2.5, t: -90, r: 5.4, mat: 'accent'},
      {kind: 'dot', y: -2.5, t: 90, r: 2.2, mat: 'lens'}, {kind: 'dot', y: -2.5, t: -90, r: 2.2, mat: 'lens'},
    ],
    thigh: [
      {kind: 'poly', pts: [[4, -34], [4.6, 0], [4, 34], [30, 26], [33, 0], [30, -26]], mat: 'panel'},
      {kind: 'curve', pts: [[3, 100], [20, 104], [35, 100]], mat: 'seam'},
    ],
    shin: [
      {kind: 'poly', pts: [[3.6, -30], [4.2, 0], [3.6, 30], [27.5, 22], [29, 0], [27.5, -22]], mat: 'panel'},
      {kind: 'curve', pts: [[6, 95], [22, 95]], mat: 'seam'},
    ],
    upper: [{kind: 'curve', pts: [[3, 90], [22, 90]], mat: 'seam'}, {kind: 'curve', pts: [[18, -180], [18, -90], [18, 0], [18, 90], [18, 180]], mat: 'seam', w: 0.5}],
    fore: [
      {kind: 'poly', pts: [[4.5, 50], [4.5, 130], [19, 120], [19, 60]], mat: 'panel'},
      {kind: 'curve', pts: [[3, 0], [18, 0]], mat: 'seamLight'},
    ],
    foot: [{kind: 'curve', pts: [[-6.5, 90], [0, 90], [8, 90], [16, 90]], mat: 'seam'}, {kind: 'curve', pts: [[-6.5, -90], [0, -90], [8, -90], [16, -90]], mat: 'seam'}],
  },
};

// ---------------------------------------------------------------- MODEL-F03
const knit = (ys: number[], span = 80): Decal[] => ys.map((y) => ({kind: 'curve', pts: [[y, -span], [y, 0], [y, span]], mat: 'seam', w: 0.35, op: 0.35}) as Decal);
const F03: Spec = {
  t: {
    pelvis: [
      {y: 9.5, rx: 12.6, rz: 9.4, n: 2.2}, {y: 5, rx: 15.0, rz: 10.6, n: 2.3}, {y: -1, rx: 16.2, rz: 11.0, n: 2.4},
      {y: -7, rx: 14.8, rz: 10.2, n: 2.3}, {y: -11.5, rx: 10.4, rz: 7.8, n: 2.1},
    ],
    abdomen: [{y: -3, rx: 13.6, rz: 9.8, n: 2.1}, {y: 4, rx: 14.2, rz: 10.2, n: 2.1}, {y: 10, rx: 15.2, rz: 10.8, n: 2.2}],
    chest: [
      {y: 6, rx: 15.0, rz: 11.0, cz: 0.2, n: 2.2}, {y: 14, rx: 16.4, rz: 12.2, cz: 0.6, n: 2.3}, {y: 23, rx: 17.4, rz: 13.0, cz: 0.6, n: 2.3},
      {y: 31, rx: 17.6, rz: 12.6, cz: 0.2, n: 2.3}, {y: 36.5, rx: 15.6, rz: 10.8, n: 2.2}, {y: 40.5, rx: 9.8, rz: 7.4, n: 2.0},
    ],
    neck: [{y: -3, rx: 5.6, rz: 5.8}, {y: 2, rx: 4.8, rz: 5.2}, {y: 6, rx: 4.6, rz: 5.0}],
    head: [
      {y: -1.2, rx: 4.8, rz: 5.6, cz: 1.0, n: 2.1}, {y: 1.6, rx: 6.8, rz: 8.0, cz: 0.6, n: 2.2}, {y: 6, rx: 7.7, rz: 9.0, cz: 0.2, n: 2.2},
      {y: 11.5, rx: 7.9, rz: 9.2, n: 2.2}, {y: 16.5, rx: 7.4, rz: 8.6, cz: -0.2, n: 2.1}, {y: 19.6, rx: 5.6, rz: 6.6, cz: -0.3, n: 2.0},
      {y: 21.0, rx: 3.0, rz: 3.6, cz: -0.3, n: 2.0},
    ],
    thigh: [
      {y: -3.5, rx: 6.4, rz: 7.0}, {y: 1.5, rx: 7.8, rz: 8.4, n: 2.1}, {y: 14, rx: 7.8, rz: 8.4, cz: 0.3, n: 2.1},
      {y: 29, rx: 6.6, rz: 7.0, cz: 0.4, n: 2.1}, {y: 38.5, rx: 5.6, rz: 5.9}, {y: 42.5, rx: 4.6, rz: 4.8},
    ],
    shin: [
      {y: -2.5, rx: 5.0, rz: 5.4}, {y: 3.5, rx: 5.6, rz: 6.2, cz: 0.4, n: 2.1}, {y: 15, rx: 5.4, rz: 6.0, cz: 0.3, n: 2.1},
      {y: 31, rx: 4.2, rz: 4.6}, {y: 39, rx: 3.6, rz: 3.9}, {y: 42.5, rx: 3.0, rz: 3.2},
    ],
    foot: [
      {y: -7.2, rx: 3.8, rz: 2.8, cz: -6.4}, {y: -6, rx: 4.8, rz: 3.8, cz: -6.2, n: 2.3}, {y: -1, rx: 5.0, rz: 4.4, cz: -5.6, n: 2.3},
      {y: 6, rx: 5.0, rz: 3.4, cz: -6.6, n: 2.3}, {y: 13, rx: 4.8, rz: 2.6, cz: -7.4, n: 2.3}, {y: 17.2, rx: 4.2, rz: 2.0, cz: -8.0, n: 2.2},
      {y: 19.2, rx: 2.8, rz: 1.5, cz: -8.4},
    ],
    shoulder: [{y: -5.5, rx: 4.4, rz: 4.8}, {y: -3, rx: 6.0, rz: 6.6, n: 2.0}, {y: 2, rx: 6.2, rz: 6.6, n: 2.0}, {y: 5.5, rx: 5.2, rz: 5.6}],
    upper: [{y: 1, rx: 5.4, rz: 5.6, n: 2.1}, {y: 12, rx: 5.3, rz: 5.5, n: 2.1}, {y: 24, rx: 4.7, rz: 4.9}, {y: 29.5, rx: 3.9, rz: 4.1}],
    fore: [{y: -2, rx: 4.0, rz: 4.2}, {y: 4, rx: 4.6, rz: 4.8, n: 2.1}, {y: 14, rx: 4.3, rz: 4.5, n: 2.1}, {y: 23, rx: 3.5, rz: 3.6}, {y: 26.5, rx: 3.0, rz: 3.1}],
    palm: [{y: -0.5, rx: 1.8, rz: 3.2}, {y: 2.5, rx: 2.2, rz: 4.2, n: 2.3}, {y: 8.5, rx: 2.0, rz: 4.4, n: 2.4}, {y: 10, rx: 1.5, rz: 4.0, n: 2.2}],
  },
  abdomenMat: 'shell', neckMat: 'band', handMat: 'glove', actuators: false, bands: true,
  finger: {r0: 1.05, r1: 0.95},
  decals: {
    head: [{kind: 'poly', pts: superOutline(10.4, 6.0, 54, 2.6), mat: 'visor'}],
    chest: [
      {kind: 'symbol', y: 30.5, t: 0, h: 8.4, color: 'dark'},
      {kind: 'curve', pts: [[38.6, 0], [26, 0], [17, 0]], mat: 'seam', w: 0.4, op: 0.45},
      {kind: 'curve', pts: [[12, -85], [11.4, 0], [12, 85]], mat: 'seam'},
      ...knit([15, 19, 23], 60),
    ],
    abdomen: knit([0, 4, 8], 70),
    pelvis: [{kind: 'curve', pts: [[4.5, -60], [3.8, 0], [4.5, 60]], mat: 'seam'}],
    thigh: [{kind: 'curve', pts: [[4, 0], [33, 0]], mat: 'seam', op: 0.5}, ...knit([10, 18, 26], 70)],
    shin: [{kind: 'curve', pts: [[4, 0], [30, 0]], mat: 'seam', op: 0.5}, ...knit([10, 20], 70)],
    upper: knit([8, 16], 70),
    fore: knit([8], 70),
    foot: [{kind: 'curve', pts: [[-6.5, 90], [0, 90], [8, 90], [16, 90]], mat: 'seam'}, {kind: 'curve', pts: [[-6.5, -90], [0, -90], [8, -90], [16, -90]], mat: 'seam'}],
  },
};

// ---------------------------------------------------------------- MODEL-SIM (F.02 shape, schematic) and MODEL-PERF
const SIM: Spec = {
  ...F02,
  decals: {
    ...F02.decals,
    chest: [...(F02.decals.chest ?? []), ...contours([16, 24, 31])],
    abdomen: contours([0, 6]),
    thigh: [...(F02.decals.thigh ?? []), ...contours([14, 29])],
    shin: [...(F02.decals.shin ?? []), ...contours([15, 31])],
    upper: contours([12, 24]),
    fore: contours([12]),
  },
};
const PERF: Spec = {
  t: {
    ...F03.t,
    chest: F03.t.chest.map((r) => ({...r, rx: r.rx * 0.86, rz: r.rz * 0.9, n: 2.1})),
    head: [{y: -1.5, rx: 5.0, rz: 6.0, cz: 1.2}, {y: 2, rx: 7.2, rz: 8.6, cz: 1}, {y: 8, rx: 7.8, rz: 9.4, cz: 0.4}, {y: 14, rx: 7.6, rz: 9.0}, {y: 18.5, rx: 5.6, rz: 6.6}, {y: 20.5, rx: 2.8, rz: 3.2}],
    upper: F03.t.upper.map((r) => ({...r, rx: r.rx * 0.88, rz: r.rz * 0.88})),
    fore: F03.t.fore.map((r) => ({...r, rx: r.rx * 0.88, rz: r.rz * 0.88})),
    thigh: F03.t.thigh.map((r) => ({...r, rx: r.rx * 0.9, rz: r.rz * 0.9})),
    shin: F03.t.shin.map((r) => ({...r, rx: r.rx * 0.9, rz: r.rz * 0.9})),
  },
  abdomenMat: 'shell', neckMat: 'shell', handMat: 'shell', actuators: false, bands: false,
  finger: {r0: 0.9, r1: 0.8},
  decals: {
    chest: [{kind: 'dot', y: 30, t: 0, r: 1.6, mat: 'marker'}, {kind: 'dot', y: 20, t: 180, r: 1.6, mat: 'marker'}, {kind: 'dot', y: 33, t: 75, r: 1.4, mat: 'marker'}, {kind: 'dot', y: 33, t: -75, r: 1.4, mat: 'marker'}],
    head: [{kind: 'dot', y: 17, t: 0, r: 1.4, mat: 'marker'}, {kind: 'dot', y: 12, t: 90, r: 1.3, mat: 'marker'}, {kind: 'dot', y: 12, t: -90, r: 1.3, mat: 'marker'}],
    pelvis: [{kind: 'dot', y: 0, t: 70, r: 1.4, mat: 'marker'}, {kind: 'dot', y: 0, t: -70, r: 1.4, mat: 'marker'}],
    thigh: [{kind: 'dot', y: 20, t: 70, r: 1.3, mat: 'marker'}],
    shin: [{kind: 'dot', y: 2, t: 40, r: 1.3, mat: 'marker'}, {kind: 'dot', y: 30, t: 70, r: 1.3, mat: 'marker'}],
    upper: [{kind: 'dot', y: 4, t: 90, r: 1.2, mat: 'marker'}],
    fore: [{kind: 'dot', y: 22, t: 90, r: 1.2, mat: 'marker'}],
    foot: [{kind: 'dot', y: 14, t: 0, r: 1.2, mat: 'marker'}],
  },
};
const SPECS: Record<ModelKind, Spec> = {F02, F03, SIM, PERF};
/** The F.02 chest table (used by shots that build loose F.02 parts, e.g. the back-plate close-up). */
export const CHEST = F02.t.chest;

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
  const S = SPECS[o.kind];
  const T = S.t;
  const D = S.decals;
  const parts: Part[] = [];
  const bodyFwd = sk.body[2];

  parts.push({id: 'pelvis', o: sk.pelvis, m: sk.body, rings: T.pelvis, mat: 'shell', decals: D.pelvis, bias: 0.5, seg: 18});
  parts.push({id: 'abdomen', o: sk.torso.o, m: sk.torso.m, rings: T.abdomen, mat: S.abdomenMat, decals: D.abdomen, bias: -1, seg: 16});
  parts.push({id: 'chest', o: sk.torso.o, m: sk.torso.m, rings: T.chest, mat: 'shell', decals: D.chest, bias: 0, seg: 24});
  if (T.pack) parts.push({id: 'pack', o: sk.torso.o, m: sk.torso.m, rings: T.pack, mat: 'pack', decals: D.pack, bias: -0.5, seg: 16});
  parts.push({id: 'neck', o: sk.neck.o, m: sk.neck.m, rings: T.neck, mat: S.neckMat, bias: 1.5, seg: 12});
  parts.push({id: 'head', o: sk.head.o, m: sk.head.m, rings: T.head, mat: 'shell', decals: D.head, bias: 7, seg: 26});

  const sideParts = (sd: SideSk, tag: 'L' | 'R') => {
    const s = sd.sgn;
    // legs
    parts.push({id: 'thigh' + tag, o: sd.hip, m: axisFrame(sub(sd.knee, sd.hip), bodyFwd), rings: T.thigh, mat: 'shell', decals: D.thigh, bias: 2, seg: 16});
    if (S.actuators) {
      parts.push({id: 'kneeAct' + tag, o: sd.knee, m: axisFrame(sk.side[tag].thigh.m[0], bodyFwd), rings: disc(5.6, 5.8), mat: 'joint', bias: 2.6, seg: 14});
      parts.push({id: 'ankleAct' + tag, o: sd.ankle, m: axisFrame(sd.foot.m[0], sd.foot.m[2]), rings: disc(3.4, 4.2), mat: 'joint', bias: 3.2, seg: 12});
    }
    if (S.bands) {
      parts.push({id: 'kneeBand' + tag, o: sd.knee, m: axisFrame(sub(sd.ankle, sd.knee), bodyFwd), rings: disc(5.3, 0.9), mat: 'band', bias: 2.7, seg: 14});
      parts.push({id: 'ankleBand' + tag, o: sd.ankle, m: axisFrame(sub(sd.ankle, sd.knee), bodyFwd), rings: disc(3.3, 1.0), mat: 'band', bias: 3.25, seg: 12});
    }
    const shinFront = add(mulS(bodyFwd, 0.6), mulS(sd.foot.m[2], 0.4));
    parts.push({id: 'shin' + tag, o: sd.knee, m: axisFrame(sub(sd.ankle, sd.knee), shinFront), rings: T.shin, mat: 'shell', decals: D.shin, bias: 2.8, seg: 16});
    // foot: local y = forward, local z = up (ring "rz" is the half height)
    const fm = sd.foot.m;
    const footM: M3 = [fm[0], fm[2], fm[1]];
    parts.push({id: 'foot' + tag, o: sd.ankle, m: footM, rings: T.foot, mat: 'shell', decals: D.foot, bias: 3.4, seg: 14});
    parts.push({id: 'sole' + tag, o: sd.ankle, m: footM, rings: T.foot.map((r) => ({...r, rz: 0.9, cz: -9.3, rx: r.rx * 0.98})), mat: 'sole', bias: 3.3, seg: 12});

    // arms
    const upFrame = axisFrame(sub(sd.elbow, sd.shoulder), sk.torso.m[2]);
    if (T.shoulder) parts.push({id: 'shoulder' + tag, o: sd.shoulder, m: upFrame, rings: T.shoulder, mat: 'shell', decals: D.shoulder, bias: 3.2, seg: 16});
    parts.push({id: 'upper' + tag, o: sd.shoulder, m: upFrame, rings: T.upper, mat: 'shell', decals: D.upper, bias: 3, seg: 14});
    if (S.actuators) parts.push({id: 'elbowAct' + tag, o: sd.elbow, m: axisFrame(upFrame[0], upFrame[2]), rings: disc(4.6, 4.8), mat: 'joint', bias: 3.6, seg: 12});
    if (S.bands) parts.push({id: 'elbowBand' + tag, o: sd.elbow, m: axisFrame(sub(sd.wrist, sd.elbow), sd.hand.m[2]), rings: disc(4.2, 0.9), mat: 'band', bias: 3.65, seg: 12});
    parts.push({id: 'fore' + tag, o: sd.elbow, m: axisFrame(sub(sd.wrist, sd.elbow), sd.hand.m[2]), rings: T.fore, mat: 'shell', decals: D.fore, bias: 4, seg: 14});
    if (S.actuators) parts.push({id: 'wristAct' + tag, o: sd.wrist, m: sd.hand.m, rings: capsule(0.1, 3.0, 3.0), mat: 'joint', bias: 4.2, seg: 10});
    if (S.bands) parts.push({id: 'wristBand' + tag, o: sd.wrist, m: axisFrame(sub(sd.wrist, sd.elbow), sd.hand.m[2]), rings: disc(3.0, 0.8), mat: 'band', bias: 4.25, seg: 10});
    // hand
    const hm = sd.hand.m;
    parts.push({id: 'palm' + tag, o: sd.wrist, m: hm, rings: T.palm, mat: S.handMat, bias: 4.6, seg: 12});
    const hx = hm[0], hy = hm[1], hz = hm[2];
    const thumbSide = s; // +hz for the left hand, -hz for the right
    const F = S.finger;
    if (o.detailHands) {
      const fingers = [
        {z: 3.0, l1: 4.0, l2: 3.4}, {z: 1.0, l1: 4.4, l2: 3.6}, {z: -1.0, l1: 4.2, l2: 3.4}, {z: -2.9, l1: 3.4, l2: 2.8},
      ];
      const g = sd.grip;
      fingers.forEach((fi, k) => {
        const base = add(sd.wrist, add(mulS(hy, 9.6), mulS(hz, fi.z * thumbSide)));
        const curl1 = rotAxis(hz, -g * 1.25);
        const d1 = mv(curl1, hy);
        const mid = add(base, mulS(d1, fi.l1));
        const curl2 = rotAxis(hz, -g * 1.45);
        const d2 = mv(curl2, d1);
        parts.push({id: `f${k}a${tag}`, o: base, m: axisFrame(d1, hx), rings: capsule(fi.l1, F.r0, F.r0 * 0.94), mat: S.handMat, bias: 4.8, seg: 8});
        parts.push({id: `f${k}b${tag}`, o: mid, m: axisFrame(d2, hx), rings: capsule(fi.l2, F.r0 * 0.92, F.r1 * 0.82), mat: S.handMat, bias: 4.9, seg: 8});
      });
      const tb = add(sd.wrist, add(mulS(hy, 2.6), add(mulS(hz, 3.8 * thumbSide), mulS(hx, 0.8))));
      const tdir0 = norm(add(mulS(hy, 0.75), mulS(hz, 0.66 * thumbSide)));
      const td1 = mv(rotAxis(hy, thumbSide * 0.3 + sd.grip * 0.4 * thumbSide), mv(rotAxis(cross(tdir0, hx), sd.grip * 0.5), tdir0));
      const tm = add(tb, mulS(td1, 3.6));
      const td2 = mv(rotAxis(hz, -sd.grip * 0.9), td1);
      parts.push({id: `tha${tag}`, o: tb, m: axisFrame(td1, hx), rings: capsule(3.6, F.r0 * 1.17, F.r0 * 1.02), mat: S.handMat, bias: 4.85, seg: 8});
      parts.push({id: `thb${tag}`, o: tm, m: axisFrame(td2, hx), rings: capsule(3.0, F.r0 * 1.02, F.r1 * 0.9), mat: S.handMat, bias: 4.95, seg: 8});
    } else {
      const g = sd.grip;
      const d1 = mv(rotAxis(hz, -g * 1.2), hy);
      parts.push({id: 'mitt' + tag, o: add(sd.wrist, mulS(hy, 9)), m: axisFrame(d1, hx), rings: [
        {y: -0.5, rx: 1.4, rz: 4.0}, {y: 3.5, rx: 1.3, rz: 4.0, n: 2.4}, {y: 7, rx: 1.0, rz: 3.2},
      ], mat: S.handMat, bias: 4.8, seg: 10});
    }
  };
  sideParts(sk.side.L, 'L');
  sideParts(sk.side.R, 'R');

  if (o.explode && o.explode > 0) {
    // exploded view: parts drift away from the torso along their own offset (sensible radial axes)
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
  const gx = (Math.sign(sx) * Math.pow(Math.abs(sx), n - 1)) / rx;
  const gz = (Math.sign(sz) * Math.pow(Math.abs(sz), n - 1)) / rz;
  const slope = (b.rz - a.rz) / Math.max(1e-3, b.y - a.y);
  return {p, n: norm([gx, -slope * 0.05 * Math.abs(c), gz])};
};
/** Local surface radius (for converting arc length to degrees). */
export const ringRadius = (rings: Ring[], y: number): number => {
  let i = 0;
  while (i < rings.length - 2 && rings[i + 1].y < y) i++;
  const a = rings[i], b = rings[Math.min(i + 1, rings.length - 1)];
  const t = b.y === a.y ? 0 : Math.max(0, Math.min(1, (y - a.y) / (b.y - a.y)));
  return (a.rx + (b.rx - a.rx) * t + a.rz + (b.rz - a.rz) * t) / 2;
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
