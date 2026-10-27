// The wolf-spider rig, in millimetres (a gripper of about 33.5 mg: body ~10.5 mm, leg span ~25 mm open).
// Body frame: origin at the centre of the prosoma (the front body section, where all eight legs attach), +x toward the
// eyes, +y to the spider's left, +z dorsal. The needle enters the top of the prosoma at NEEDLE_IN.
// Each leg lies in a vertical plane through its attachment and is a chain of six segments (coxa+trochanter, femur,
// patella, tibia, metatarsus, tarsus) with fixed lengths. One value per leg, e (0 = curled, the dead rest pose; 1 =
// extended), sets every joint, so the eight legs share one pressure-driven motion and never stretch: segment lengths are
// constant and only the joint angles change. The flexion at the femur-patella and tibia-metatarsus joints (the joints
// that extend hydraulically in life) carries most of the curl.
import {add3, len3, lerp3, mul3, rotX, rotY, rotZ, sub3, V3} from './three';

export const PRO = {a: 2.5, b: 2.05, c: 1.15}; // prosoma semi-axes
export const ABD = {x: -4.75, z: 0.35, a: 3.15, b: 2.3, c: 1.85}; // abdomen centre and semi-axes
export const NEEDLE_IN: V3 = [-0.25, 0, PRO.c * 0.97]; // the insertion point on the carapace

export const LEG_LEN = [11.2, 10.1, 9.5, 12.6]; // legs I-IV
const FRAC = [0.09, 0.27, 0.12, 0.21, 0.2, 0.11];
/** segment radii at the 7 joints (mm) */
export const LEG_R = [0.44, 0.4, 0.36, 0.31, 0.25, 0.18, 0.12];
const ATTACH = [32, 62, 98, 134]; // attachment azimuth round the prosoma (deg from +x)
const DIR_OPEN = [36, 74, 110, 150]; // leg-plane azimuth, extended
const DIR_CURL = [52, 82, 102, 128]; // curled legs gather slightly under the body
/** segment elevations (deg, + up) for each leg at e = 1 and e = 0 */
const TH_OPEN = [
  [6, 44, -16, -40, -60, -72],
  [6, 42, -18, -42, -62, -72],
  [6, 40, -20, -44, -62, -70],
  [6, 40, -14, -36, -56, -68],
];
const TH_CURL = [
  [-4, 74, -62, -136, -204, -238],
  [-4, 72, -66, -140, -206, -236],
  [-4, 70, -66, -140, -204, -234],
  [-4, 68, -58, -130, -196, -228],
];

/** V6: corrections to the curled pose (deg, added to TH_CURL; they fade out as the leg extends). Without them the
 *  metatarsus and tarsus of the curled legs folded back into the prosoma. Found by search (tools probe): the smallest
 *  changes that keep every segment, with its radius, outside both body sections at every extension. */
const CURL_FIX = [
  [0, 0, 0, 10, 70, 0],
  [0, 0, -5, 15, 70, 0],
  [0, 0, 0, 15, 70, 0],
  [0, 0, -5, 0, 55, 0],
];

/** plan-view sweep of each segment (deg; - = toward the head) */
const SWEEP = [
  [0, 0, -6, -12, -17, -20],
  [0, 0, -3, -6, -9, -10],
  [0, 0, 4, 8, 11, 12],
  [0, 0, 6, 11, 15, 18],
];

/** dth: per-leg elevation offset (deg, + raises the whole leg about its base), used to keep feet on the ground */
export type SpiderPose = {pos: V3; yaw: number; pitch?: number; roll?: number; e: number[]; s?: number; dth?: number[]};

/** body-local -> world */
export const toWorld = (P: SpiderPose, p: V3): V3 => add3(P.pos, rotZ(rotY(rotX(mul3(p, P.s ?? 1), P.roll ?? 0), P.pitch ?? 0), P.yaw));
/** world -> body-local (inverse of toWorld) */
export const toLocal = (P: SpiderPose, w: V3): V3 => mul3(rotX(rotY(rotZ(sub3(w, P.pos), -P.yaw), -(P.pitch ?? 0)), -(P.roll ?? 0)), 1 / (P.s ?? 1));

/** legs are indexed 0..7: 0-3 left I-IV, 4-7 right I-IV */
export const legSide = (i: number) => (i < 4 ? 1 : -1);
export const legN = (i: number) => i % 4;

/** a small fixed individuality per leg (so the eight are not a rigid radial pattern) */
const JIT = [0.6, -1.2, 0.9, -0.4, 0.6, 1.1, -0.5, 0.7];

/** the seven joint points of leg i in body-local coordinates for extension e */
export const legLocal = (i: number, e: number, dth = 0): V3[] => {
  const s = legSide(i), n = legN(i);
  const a = (ATTACH[n] * Math.PI) / 180;
  const A: V3 = [PRO.a * 0.8 * Math.cos(a), s * PRO.b * 0.8 * Math.sin(a), -0.42];
  const dirDeg = DIR_CURL[n] + (DIR_OPEN[n] - DIR_CURL[n]) * e + JIT[i] * 1.5;
  const pts: V3[] = [A];
  let p = A;
  const L = LEG_LEN[n];
  for (let k = 0; k < 6; k++) {
    // the distal segments sweep forward (legs I, II) or back (III, IV) in plan, more as the leg extends
    const d = ((dirDeg + SWEEP[n][k] * (0.35 + 0.65 * e)) * Math.PI) / 180;
    const u: V3 = [Math.cos(d), s * Math.sin(d), 0];
    const curl = TH_CURL[n][k] + CURL_FIX[n][k];
    const th = curl + (TH_OPEN[n][k] - curl) * e + (k > 0 ? JIT[(i + k) % 8] : 0) + dth;
    const t = (th * Math.PI) / 180;
    const seg = L * FRAC[k];
    p = add3(p, add3(mul3(u, seg * Math.cos(t)), [0, 0, seg * Math.sin(t)]));
    pts.push(p);
  }
  return pts;
};

/** pedipalps: short three-segment feelers at the front (never full legs) */
export const palpLocal = (s: number, e: number): V3[] => {
  const A: V3 = [PRO.a * 0.86, s * 0.55, -0.55];
  const th = [[-10, -40, -75], [-28, -95, -150]];
  const L = [0.9, 0.9, 0.75];
  const pts: V3[] = [A];
  let p = A;
  const d = ((12 + 6 * e) * Math.PI) / 180;
  const u: V3 = [Math.cos(d), s * Math.sin(d), 0];
  for (let k = 0; k < 3; k++) {
    const t = ((th[1][k] + (th[0][k] - th[1][k]) * e) * Math.PI) / 180;
    p = add3(p, add3(mul3(u, L[k] * Math.cos(t)), [0, 0, L[k] * Math.sin(t)]));
    pts.push(p);
  }
  return pts;
};

// ------------------------------------------------------------------ contact
/** a signed distance (mm) to the solid things a leg may touch, in world coordinates */
export type SDF = (p: V3) => number;
export const sdfPlane = (z0: number): SDF => (p) => p[2] - z0;
export const sdfBox = (c: V3, h: V3, r = 0.2, yaw = 0): SDF => (p) => {
  const q0 = rotZ(sub3(p, c), -yaw);
  const q = [Math.abs(q0[0]) - h[0] + r, Math.abs(q0[1]) - h[1] + r, Math.abs(q0[2]) - h[2] + r];
  const o = Math.hypot(Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0));
  return o + Math.min(Math.max(q[0], q[1], q[2]), 0) - r;
};
export const sdfCyl = (c: V3, r: number, h: number): SDF => (p) => {
  const d = Math.hypot(p[0] - c[0], p[1] - c[1]) - r;
  const dz = Math.abs(p[2] - c[2]) - h;
  return Math.min(Math.max(d, dz), 0) + Math.hypot(Math.max(d, 0), Math.max(dz, 0));
};
export const sdfEll = (c: V3, ax: V3): SDF => (p) => {
  const q = sub3(p, c);
  const k = Math.hypot(q[0] / ax[0], q[1] / ax[1], q[2] / ax[2]);
  return (k - 1) * Math.min(ax[0], ax[1], ax[2]);
};
export const sdfUnion = (...fs: SDF[]): SDF => (p) => Math.min(...fs.map((f) => f(p)));

const legClear = (P: SpiderPose, i: number, e: number, sdf: SDF) => {
  const L = legLocal(i, e, P.dth?.[i] ?? 0).map((q) => toWorld(P, q));
  let m = Infinity;
  // the coxa and femur sit up against the body; the touching parts are the patella, tibia, metatarsus and tarsus
  for (let k = 2; k < L.length - 1; k++) {
    for (const u of [0, 0.33, 0.66, 1]) {
      const p = lerp3(L[k], L[k + 1], u);
      const r = (LEG_R[k] + (LEG_R[k + 1] - LEG_R[k]) * u) * (P.s ?? 1);
      m = Math.min(m, sdf(p) - r);
    }
  }
  return m;
};
/** the most-closed extension leg i can reach closing from e = 1 toward `eCmd` without passing into the solid.
 *  If the commanded pose itself penetrates, the leg stops at the nearest clear pose above it (it rests on the
 *  surface). With `sweep`, a leg closing from open also stops at its FIRST contact on the way, so it can never pass
 *  through a thin or flat object to a clear pose on the far side (a gripper closing on a payload). */
export const legContact = (P: SpiderPose, i: number, eCmd: number, sdf: SDF, sweep = false) => {
  const bisect = (lo: number, hi: number) => {
    for (let k = 0; k < 14; k++) {
      const m = (lo + hi) / 2;
      if (legClear(P, i, m, sdf) < 0) lo = m;
      else hi = m;
    }
    return hi;
  };
  if (legClear(P, i, eCmd, sdf) < 0) return legClear(P, i, 1, sdf) < 0 ? 1 : bisect(eCmd, 1);
  if (!sweep || eCmd >= 1 || legClear(P, i, 1, sdf) < 0) return eCmd;
  const step = 0.025;
  let prev = 1;
  for (let e = 1 - step; e > eCmd; e -= step) {
    if (legClear(P, i, e, sdf) < 0) return bisect(e, prev);
    prev = e;
  }
  return eCmd;
};
/** the eight leg extensions with contact */
export const solveContact = (P: SpiderPose, sdf: SDF | null): SpiderPose => (sdf ? {...P, e: P.e.map((e, i) => legContact(P, i, e, sdf))} : P);

/** world joints of every leg */
export const legsWorld = (P: SpiderPose) => P.e.map((e, i) => legLocal(i, e, P.dth?.[i] ?? 0).map((q) => toWorld(P, q)));
/** the lowest world z over the legs (for clearance checks) */
export const lowestZ = (P: SpiderPose) => Math.min(...legsWorld(P).flat().map((p) => p[2]));
export const legTipsWorld = (P: SpiderPose) => legsWorld(P).map((l) => l[l.length - 1]);
export const dist3 = (a: V3, b: V3) => len3(sub3(a, b));
