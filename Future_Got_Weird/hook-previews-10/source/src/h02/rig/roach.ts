// HOOK 02 copy of the Cyborg Cockroach V5 canonical skeleton (rig/roach.ts), adapted to the Madagascar hissing cockroach
// of the NTU/Waseda diving-suit study: the same head, pronotum shield, legs and gait, with a longer, slightly narrower,
// lower segmented abdomen (the hisser's elongated oval). Body frame: x forward, y up, z to the insect's right.
// The path may now carry a ground height and pitch (the insect walks down a gentle slope into deeper water).
import {V3, Frame, toW, dirW, add, sub, mul, norm, len, cross, dot, lerp3, ypr, rotAxis} from './v3';
import {clamp, smooth, noise1} from './ease';

export type Ell = {c: V3; r: V3};
import type {LoftDef} from './loft';
const dome = (u: number, peak: number, back: number, front: number) =>
  u < peak ? Math.pow(Math.max(0, 1 - Math.pow((peak - u) / peak, back)), 1 / back) : Math.pow(Math.max(0, 1 - Math.pow((u - peak) / (1 - peak), front)), 1 / front);
/** The pronotum: a broad shield, rounded in front, nearly straight behind, its front lip low over the head. */
export const PRONOTUM: LoftDef = {
  x0: 3.5, x1: 31.5, n: 2.3,
  w: (u) => 21.8 * dome(u, 0.3, 5, 2.1),
  ht: (u) => 9.6 * dome(u, 0.34, 4, 1.7),
  hb: (u) => 1.6 * dome(u, 0.3, 4, 2),
  yc: (u) => 10.4 - 3.4 * u * u,
};
/** The plated thorax and abdomen: an egg in plan, broad at the front, domed, with a flared margin. */
export const PLATES: LoftDef = {
  x0: -50, x1: 7.5, n: 2.4,
  w: (u) => 20.4 * dome(u, 0.7, 2.0, 6),
  ht: (u) => 12.6 * dome(u, 0.6, 1.7, 3),
  hb: (u) => 3.4 * dome(u, 0.6, 2, 3),
  yc: (u) => 6.4 + 1.6 * u,
};
/** plate edges (tergites) as u on PLATES: meso, meta, then the abdominal segments */
export const TERGITE_U = [-3.5, -10.5, -17.5, -24, -30, -35.5, -40.5, -44.8, -48].map((x) => (x - PLATES.x0) / (PLATES.x1 - PLATES.x0));
export const BODY = {
  pronotum: {c: [14.5, 14.2, 0], r: [16.5, 8.6, 23.2]} as Ell, // broad shield overhanging the head
  body: {c: [-13.5, 11.8, 0], r: [30, 12.4, 21.6]} as Ell, // meso/metathorax + abdomen (domed), tergites drawn on it
  head: {c: [29, 8.2, 0], r: [6.4, 6.4, 9.0]} as Ell,
  // visible tergite edges on `body` (plane x = k), front to back
  tergites: [3.5, -4.5, -12, -18.5, -24.5, -30, -35, -39.5],
};

export type LegDef = {name: string; side: 1 | -1; coxa: V3; femur: number; tibia: number; tarsus: number; foot: V3; rFem: number; rTib: number; phase: number; front?: boolean};
// side: +1 = right (z > 0). Tripod A = L1, R2, L3 (phase 0); tripod B = R1, L2, R3 (phase 0.5).
const leg = (name: string, side: 1 | -1, cx: number, cz: number, fe: number, ti: number, ta: number, fx: number, fz: number, rF: number, rT: number, phase: number, front = false): LegDef =>
  ({name, side, coxa: [cx, 4.8, cz * side], femur: fe, tibia: ti, tarsus: ta, foot: [fx, 0, fz * side], rFem: rF, rTib: rT, phase, front});
export const LEGS: LegDef[] = [
  leg('L1', -1, 22, 6.5, 11, 10.5, 5.5, 34, 25, 2.4, 2.1, 0, true),
  leg('R1', 1, 22, 6.5, 11, 10.5, 5.5, 34, 25, 2.4, 2.1, 0.5, true),
  leg('L2', -1, 4, 9.5, 13, 14, 7, 6, 32, 2.2, 1.6, 0.5),
  leg('R2', 1, 4, 9.5, 13, 14, 7, 6, 32, 2.2, 1.6, 0),
  leg('L3', -1, -8, 9.5, 15, 16.5, 8, -27, 30, 2.3, 1.7, 0),
  leg('R3', 1, -8, 9.5, 15, 16.5, 8, -27, 30, 2.3, 1.7, 0.5),
];

export type PathPose = {p: V3; yaw: number; pitch?: number};
/** path by arc length s (mm): ground point and heading */
export type Path = (s: number) => PathPose;

export const straightPath = (start: V3, yaw: number): Path => (s) => ({p: [start[0] + Math.cos(yaw) * s, 0, start[2] - Math.sin(yaw) * s], yaw});
/** polyline of [x, z] ground waypoints with circular-ish smoothing (Catmull-Rom resampled by arc length) */
export const splinePath = (pts: [number, number][], samples = 400): Path => {
  const P = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  const cr = (t: number): [number, number] => {
    const n = pts.length - 1, u = clamp(t) * n, i = Math.min(n - 1, Math.floor(u)), f = u - i;
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const q = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    return [q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])];
  };
  const xs: [number, number][] = [], acc: number[] = [0];
  for (let k = 0; k <= samples; k++) xs.push(cr(k / samples));
  for (let k = 1; k <= samples; k++) acc.push(acc[k - 1] + Math.hypot(xs[k][0] - xs[k - 1][0], xs[k][1] - xs[k - 1][1]));
  const total = acc[samples];
  const at = (s: number): [number, number, number] => {
    const ss = clamp(s, 0, total);
    let lo = 0, hi = samples;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (acc[m] <= ss) lo = m; else hi = m;
    }
    const f = (ss - acc[lo]) / Math.max(1e-9, acc[hi] - acc[lo]);
    return [xs[lo][0] + (xs[hi][0] - xs[lo][0]) * f, xs[lo][1] + (xs[hi][1] - xs[lo][1]) * f, lo];
  };
  const path: Path & {total?: number} = (s) => {
    const [x, z] = at(s);
    const e = 1.5;
    const [x0, z0] = at(s - e), [x1, z1] = at(s + e);
    let yaw = Math.atan2(-(z1 - z0), x1 - x0);
    if (s < 0) {
      // before the first waypoint: extrapolate the first segment (a walk may start "before" the path)
      const [xa, za] = at(0), [xb, zb] = at(2 * e);
      const yw = Math.atan2(-(zb - za), xb - xa);
      return {p: [xa + Math.cos(yw) * s, 0, za - Math.sin(yw) * s], yaw: yw};
    }
    if (s > total) {
      const [xa, za] = at(total - 2 * e), [xb, zb] = at(total);
      yaw = Math.atan2(-(zb - za), xb - xa);
      return {p: [xb + Math.cos(yaw) * (s - total), 0, zb - Math.sin(yaw) * (s - total)], yaw};
    }
    return {p: [x, 0, z], yaw};
  };
  (path as any).total = total;
  return path;
};
export const pathLength = (p: Path) => (p as any).total as number | undefined;

export type Gait = {stride: number; duty: number; lift: number};
export const GAIT: Gait = {stride: 26, duty: 0.6, lift: 6};
/** nearest arc length to s at which all six feet are planted (tripod overlap), at or after s */
export const plantedStop = (s: number, g = GAIT) => {
  const u = s / g.stride, k = Math.floor(u), f = u - k;
  const opts = [0.05, 0.55, 1.05].map((x) => k + x).filter((x) => x >= u - 0.03);
  return opts[0] * g.stride;
};

export type Antenna = {yaw: number; pitch: number; curl: number}; // radians; yaw outward from forward
export type RoachMotion = {
  path: Path;
  s: number; // distance travelled at this frame
  t: number; // seconds (for antennae, breathing)
  seed?: number;
  /** extra body offset in body frame (recoil, settle) and rotations */
  offset?: V3;
  pitch?: number;
  roll?: number;
  yawAdd?: number;
  antL?: Partial<Antenna>;
  antR?: Partial<Antenna>;
  /** 0..1 how much the antennae search (noise amplitude) */
  search?: number;
  gait?: Gait;
  /** per-leg override of the planted foot in world coords (e.g. digging in), by leg name */
  breathe?: number;
  /** H02: the ground height under a world point (feet are planted on it, not on the body's tangent plane) */
  ground?: (x: number, z: number) => number;
};

export type LegPose = {def: LegDef; coxa: V3; knee: V3; ankle: V3; foot: V3; up: boolean};
export type RoachPose = {frame: Frame; legs: LegPose[]; antL: V3[]; antR: V3[]; cerci: [V3, V3][]; breath: number; bodyFrame0: Frame};

const bodyFrameAt = (path: Path, s: number) => {
  const pp = path(s);
  return ypr(pp.p, pp.yaw, pp.pitch ?? 0);
};

const antennaPoints = (fr: Frame, side: 1 | -1, a: Antenna, n = 12, L = 25): V3[] => {
  const base = toW(fr, [33.6, 10.2, 4.4 * side]);
  const pts: V3[] = [base];
  // initial direction in body frame
  let d: V3 = [Math.cos(a.pitch) * Math.cos(a.yaw), Math.sin(a.pitch), Math.cos(a.pitch) * Math.sin(a.yaw) * side];
  const seg = L / n;
  let p = base;
  for (let i = 0; i < n; i++) {
    const wd = dirW(fr, d);
    p = add(p, mul(wd, seg));
    pts.push(p);
    // curl: bend downward and slightly outward along the length
    d = norm(rotAxis(d, [0, 0, 1], -a.curl / n));
    d = norm(rotAxis(d, [0, 1, 0], (-0.18 / n) * side));
  }
  return pts;
};

const ik2 = (B: V3, A: V3, a: number, b: number, pole: V3): V3 => {
  const dv = sub(A, B);
  let d = len(dv);
  d = clamp(d, Math.abs(a - b) + 0.5, a + b - 0.3);
  const dir = norm(dv);
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const perp = norm(sub(pole, mul(dir, dot(pole, dir))));
  return add(add(B, mul(dir, x)), mul(perp, h));
};

export const poseRoach = (m: RoachMotion): RoachPose => {
  const g = m.gait ?? GAIT;
  const s = m.s;
  const base = bodyFrameAt(m.path, s);
  const basePitch = m.path(s).pitch ?? 0;
  // gait bob: body dips slightly at each tripod change (two per stride)
  const u = s / g.stride;
  const bob = 0.5 * Math.cos(u * Math.PI * 4);
  const rollG = 0.012 * Math.sin(u * Math.PI * 2);
  const breath = m.breathe ?? 0.5 + 0.5 * Math.sin(m.t * 2 * Math.PI * 0.9 + (m.seed ?? 0));
  const off = m.offset ?? [0, 0, 0];
  let fr = ypr(add(base.o, dirW(base, [off[0], off[1] + bob, off[2]])), Math.atan2(-base.x[2], base.x[0]) + (m.yawAdd ?? 0), (m.pitch ?? 0) + basePitch, (m.roll ?? 0) + rollG);
  const legs: LegPose[] = LEGS.map((L) => {
    const ph = u + L.phase;
    const k = Math.floor(ph), f = ph - k;
    const plantAt0 = (kk: number) => toW(bodyFrameAt(m.path, (kk - L.phase) * g.stride + (g.duty * g.stride) / 2), L.foot);
    const plantAt = (kk: number): V3 => {
      const q = plantAt0(kk);
      return m.ground ? [q[0], m.ground(q[0], q[2]), q[2]] : q;
    };
    let foot: V3, up = false;
    if (f < g.duty) foot = plantAt(k);
    else {
      const w = (f - g.duty) / (1 - g.duty);
      const a = plantAt(k), b = plantAt(k + 1);
      foot = add(lerp3(a, b, smooth(w)), [0, g.lift * Math.sin(Math.PI * w), 0]);
      up = w > 0.02 && w < 0.98;
    }
    const coxa = toW(fr, [L.coxa[0], L.coxa[1] + 1.5, L.coxa[2]]);
    // ankle sits above and inward of the foot (the tarsus lies along the ground, pointing outward and forward/back)
    const out = norm([foot[0] - fr.o[0], 0, foot[2] - fr.o[2]]);
    const ankle = add(foot, add(mul(out, -L.tarsus * 0.78), [0, L.tarsus * 0.58, 0]));
    const pole = norm(add(add(mul(fr.y, 0.55), mul(out, 1.0)), mul(fr.x, L.front ? 0.3 : L.coxa[0] < 0 ? -0.3 : 0)));
    const knee = ik2(coxa, ankle, L.femur, L.tibia, pole);
    return {def: L, coxa, knee, ankle, foot, up};
  });
  const t = m.t, sd = m.seed ?? 0, srch = m.search ?? 0.6;
  const ant = (side: 1 | -1, o?: Partial<Antenna>): Antenna => ({
    yaw: (o?.yaw ?? 0.62) + srch * 0.28 * noise1(t * 1.3 + (side > 0 ? 7 : 0), sd + 1),
    pitch: (o?.pitch ?? 0.12) + srch * 0.16 * noise1(t * 1.1 + (side > 0 ? 3 : 11), sd + 2),
    curl: (o?.curl ?? 0.9) + srch * 0.25 * noise1(t * 0.9 + (side > 0 ? 5 : 2), sd + 3),
  });
  const antL = antennaPoints(fr, -1, ant(-1, m.antL));
  const antR = antennaPoints(fr, 1, ant(1, m.antR));
  const cerci: [V3, V3][] = ([-1, 1] as const).map((sd2) => [toW(fr, [-50, 7.6, 3.0 * sd2]), toW(fr, [-54.5, 6.6, 5.2 * sd2])] as [V3, V3]);
  return {frame: fr, legs, antL, antR, cerci, breath, bodyFrame0: base};
};
