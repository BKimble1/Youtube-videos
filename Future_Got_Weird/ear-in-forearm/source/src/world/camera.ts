// One continuous camera through one drawing of the patient. Keys are (time, x, y, zoom); between keys the path is a
// cubic Hermite spline in (x, y, log zoom) with Catmull-Rom tangents, so moves flow into each other without stopping;
// a key marked `stop` has zero velocity (the film's first and last frames, and holds). Zoom is interpolated in log
// space so a pull-back feels uniform. The last key equals the first: the film loops on the opening composition.
import {B, TM} from './story';
import {FIG} from './woman';

export type Cam = {x: number; y: number; z: number};
type Key = {t: number; x: number; y: number; z: number; stop?: boolean};

const A = FIG.armEar, S = FIG.earSite;
const OPEN = {x: A.x, y: A.y + 4, z: 9.2};
export const KEYS: Key[] = [
  {t: 0, ...OPEN, stop: true},
  {t: 0.95, x: A.x - 2, y: A.y - 40, z: 3.7},
  {t: 1.75, x: 760, y: 640, z: 1.75},
  {t: 2.75, x: 600, y: 720, z: 1.12},
  {t: 3.45, x: 500, y: 620, z: 1.55},
  {t: TM.lostEar + 0.05, x: S.x - 10, y: S.y + 12, z: 2.9},
  {t: B.crash[1] - 0.05, x: S.x - 30, y: S.y + 40, z: 2.65},
  {t: B.ribWin[0] + 0.25, x: 352, y: 1060, z: 2.25},
  {t: B.cut[0] + 0.1, x: 372, y: 1128, z: 3.2},
  {t: B.lift[1], x: 380, y: 1112, z: 5.4},
  {t: B.grooves[1], x: 384, y: 1104, z: 5.7},
  {t: B.rim[1], x: 400, y: 1090, z: 4.3},
  {t: (B.travel[0] + B.travel[1]) / 2, x: 640, y: 905, z: 2.5},
  {t: B.travel[1], x: A.x + 6, y: A.y + 10, z: 3.9},
  {t: B.insert[1] + 0.15, x: A.x, y: A.y + 6, z: 4.6},
  {t: TM.formed, x: A.x + 2, y: A.y + 2, z: 5.8},
  {t: B.winClose[1], x: A.x, y: A.y + 10, z: 4.4},
  {t: B.raise[1], x: A.x - 60, y: A.y - 20, z: 3.2},
  {t: B.carry[1] - 0.05, x: S.x + 40, y: S.y + 10, z: 3.3},
  {t: B.seat[1], x: S.x - 10, y: S.y + 30, z: 5.2},
  {t: B.artery[0] + 0.1, x: S.x - 18, y: S.y + 52, z: 9.5},
  {t: B.nerve[1], x: S.x - 16, y: S.y + 56, z: 10.2},
  {t: TM.and2, x: S.x - 40, y: S.y + 30, z: 3.2},
  {t: TM.months2 + 0.45, x: 410, y: 600, z: 2.25},
  {t: TM.her + 0.25, x: 470, y: 610, z: 2.0},
  {t: TM.here, x: A.x, y: A.y - 4, z: 3.6},
  {t: TM.end, ...OPEN, stop: true},
];

const herm = (p0: number, p1: number, m0: number, m1: number, u: number, d: number) => {
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * d * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * d * m1;
};
const vals = (k: Key) => [k.x, k.y, Math.log(k.z)];
const tangent = (i: number, c: number) => {
  const k = KEYS[i];
  if (k.stop || i === 0 || i === KEYS.length - 1) return 0;
  const a = KEYS[i - 1], b = KEYS[i + 1];
  // Catmull-Rom on non-uniform keys, damped a little to avoid overshoot on short segments
  return (0.85 * (vals(b)[c] - vals(a)[c])) / (b.t - a.t);
};
export const camAt = (t: number): Cam => {
  const T = Math.min(Math.max(t, 0), KEYS[KEYS.length - 1].t);
  let i = 0;
  while (i < KEYS.length - 2 && T > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1], d = b.t - a.t;
  const u = d > 0 ? (T - a.t) / d : 0;
  const r = [0, 1, 2].map((c) => herm(vals(a)[c], vals(b)[c], tangent(i, c), tangent(i + 1, c), u, d));
  return {x: r[0], y: r[1], z: Math.exp(r[2])};
};
export const camTransform = (c: Cam) => `translate(540 960) scale(${c.z}) translate(${-c.x} ${-c.y})`;
