// One continuous camera through one drawing of the patient. Keys are (time, x, y, zoom); between keys the path is a
// cubic Hermite spline in (x, y, log zoom) with Catmull-Rom tangents, so moves flow into each other without stopping;
// a key marked `stop` has zero velocity (the film's first and last frames, and holds). Zoom is interpolated in log
// space so a pull-back feels uniform. The last key equals the first, with the same velocity: the film loops on the
// opening composition mid-move.
import {B, TM} from './story';
import {FIG} from './woman';
import {ON_TRAY} from './piece';
import {AW} from './head';

export type Cam = {x: number; y: number; z: number};
type Key = {t: number; x: number; y: number; z: number; stop?: boolean; v?: [number, number, number]};

const A = FIG.armEar, S = FIG.earSite;
// V4 opening: frame 0 is the ear in extreme close-up (the ear sits in the upper middle, clear of the caption); the camera
// creeps in a touch, settles, then pulls back as the arm rotates
const OPEN = {x: A.x, y: A.y + 30, z: 8.8};
// the seam: the film ends pushing into OPEN at the same (slow) speed the opening creeps in with
const SEAM: [number, number, number] = [0, 0, 0.12];
// V3's spline tangent at the forearm-return key (from its neighbours in V3: her+0.1 and HERE)
const V3T = [(0.85 * (822 - 470)) / (TM.here - TM.her - 0.1), (0.85 * (652 - 610)) / (TM.here - TM.her - 0.1), (0.85 * (Math.log(2.03) - Math.log(2.15))) / (TM.here - TM.her - 0.1)];
export const KEYS: Key[] = [
  {t: 0, ...OPEN, v: SEAM},
  {t: B.push[1], x: A.x, y: A.y + 28, z: 9.0, stop: true},
  {t: 0.85, x: A.x - 4, y: A.y - 6, z: 3.3},
  {t: 1.5, x: 622, y: 650, z: 1.5},
  {t: 2.35, x: 612, y: 640, z: 1.62},
  {t: 3.0, x: 600, y: 610, z: 2.0},
  // V4: pinned to V3's tangent (from V3's neighbours) so everything from here on is V3's footage
  {t: TM.lostEar - 0.15, x: S.x - 30, y: S.y + 10, z: 3.4, v: [(0.85 * (S.x - 26 - 560)) / (TM.crash + 0.05 - 2.95), (0.85 * (S.y + 14 - 620)) / (TM.crash + 0.05 - 2.95), (0.85 * (Math.log(3.6) - Math.log(1.6))) / (TM.crash + 0.05 - 2.95)]},
  {t: TM.crash + 0.05, x: S.x - 26, y: S.y + 14, z: 3.6},
  {t: B.crash[1] + 0.05, x: S.x - 40, y: S.y + 50, z: 3.1},
  {t: B.ribWin[1] - 0.05, x: 362, y: 1084, z: 2.4},
  {t: B.cut[0] + 0.3, x: 382, y: 1122, z: 3.4},
  {t: B.lift[1], x: 394, y: 1116, z: 3.6},
  {t: (B.carry1[0] + B.carry1[1]) / 2, x: 590, y: 1250, z: 2.35},
  {t: B.carry1[1], x: ON_TRAY.x, y: ON_TRAY.y, z: 4.6},
  {t: B.grooves[1], x: ON_TRAY.x + 2, y: ON_TRAY.y - 4, z: 5.2},
  {t: B.rim[1], x: ON_TRAY.x + 4, y: ON_TRAY.y - 8, z: 4.9},
  {t: (B.carry2[0] + B.carry2[1]) / 2, x: 830, y: 1060, z: 2.7},
  {t: B.carry2[1], x: A.x + 22, y: A.y + 4, z: 3.8},
  {t: B.insert[1], x: A.x + 4, y: A.y + 4, z: 4.4},
  {t: (B.vessels[0] + B.vessels[1]) / 2, x: A.x, y: A.y, z: 5.3},
  {t: B.winClose[0], x: A.x, y: A.y + 4, z: 5.6},
  {t: TM.months, x: A.x, y: A.y + 10, z: 4.4},
  {t: B.raise[1], x: A.x - 60, y: A.y - 20, z: 3.2},
  {t: B.carry[1] - 0.05, x: S.x + 40, y: S.y + 10, z: 3.3},
  {t: B.seat[1], x: S.x - 16, y: S.y + 18, z: 5.0},
  {t: B.artery[0] + 0.1, x: AW.x, y: AW.y, z: 7.6},
  {t: B.nerve[1], x: AW.x + 2, y: AW.y + 2, z: 8.0},
  {t: TM.and2, x: S.x - 40, y: S.y + 30, z: 3.2},
  {t: TM.months2 + 0.45, x: 410, y: 590, z: 2.3},
  {t: TM.her + 0.1, x: 470, y: 610, z: 2.15},
  // V4: the tangent here is pinned to V3's value, so V3's footage is unchanged up to the start of the forearm return;
  // only the return itself now lands on the extreme close-up of frame 0
  {t: B.rewind[0], x: 790, y: 650, z: 2.0, v: [V3T[0], V3T[1], V3T[2]]},
  {t: TM.here, x: 834, y: 706, z: 3.4},
  {t: TM.end, ...OPEN, v: SEAM},
];

const herm = (p0: number, p1: number, m0: number, m1: number, u: number, d: number) => {
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * d * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * d * m1;
};
const vals = (k: Key) => [k.x, k.y, Math.log(k.z)];
const tangent = (i: number, c: number) => {
  const k = KEYS[i];
  if (k.v) return k.v[c];
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
