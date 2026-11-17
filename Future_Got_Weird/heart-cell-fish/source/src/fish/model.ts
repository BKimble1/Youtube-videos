// The biohybrid fish (Lee, Park, ... Parker, Science 375:639, 2022), as one 3D model drawn through every camera.
//
// Construction (from the paper): a flat fish-shaped body 14 mm long, five layers thick:
//   muscle | paper | gelatin | paper | muscle
// The paper (laser-cut) makes the rigid anterior body and the caudal fin; the posterior body between them is compliant
// gelatin, the only part that bends. Aligned human stem-cell-derived cardiomyocytes cover BOTH faces of that posterior
// body (the "muscular bilayer"). A small separate patch of cardiomyocytes (the G-node, an autonomous pacing node) sits
// in front of the muscle with a single narrow exit pathway into it. A clear plastic "floater fin" gives neutral
// buoyancy and keeps it upright. No motor, no battery, no electronics: nothing else is on board.
//
// Here: s = 0 at the snout to 1 at the caudal fin tips; v = height (world y, DOWN positive); d = offset across the
// thin body toward side A (the side facing the opening camera). Units 0.1 mm: L = 140.
// Bend A (radians) is the total turn of the posterior body; A > 0 swings the tail toward side A (side A's muscle is
// shortened, side B's stretched).
import {add3, mul3, V3} from '../core/cam';

export const L = 140;
/** half-thickness of the core (paper/gelatin) and the muscle sheet, in units, at real proportions */
export const HC = 2.9;
export const HM = 1.3;
export const HINGE0 = 0.42;
export const HINGE1 = 0.8;
export const MUS0 = 0.37;
export const MUS1 = 0.825;
export const GNODE = {s: 0.33, v: 0.048, r: 0.027};

// side profile (fractions of L; top negative = up)
const KS = [0, 0.02, 0.06, 0.13, 0.22, 0.32, 0.42, 0.52, 0.62, 0.71, 0.78, 0.82, 0.88, 0.94, 0.985, 1.0];
const KT = [-0.004, -0.04, -0.07, -0.098, -0.115, -0.12, -0.112, -0.098, -0.08, -0.064, -0.054, -0.057, -0.086, -0.13, -0.163, -0.152];
const KB = [0.004, 0.034, 0.06, 0.086, 0.102, 0.108, 0.1, 0.088, 0.072, 0.059, 0.05, 0.054, 0.083, 0.124, 0.158, 0.146];
const interp = (xs: number[], ys: number[], x: number) => {
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let i = 0;
  while (xs[i + 1] < x) i++;
  const t = (x - xs[i]) / (xs[i + 1] - xs[i]);
  const y0 = ys[Math.max(0, i - 1)], y1 = ys[i], y2 = ys[i + 1], y3 = ys[Math.min(ys.length - 1, i + 2)];
  // Catmull-Rom (uniform), clamped to the segment's range to avoid overshoot
  const v = 0.5 * (2 * y1 + (-y0 + y2) * t + (2 * y0 - 5 * y1 + 4 * y2 - y3) * t * t + (-y0 + 3 * y1 - 3 * y2 + y3) * t * t * t);
  const lo = Math.min(y1, y2), hi = Math.max(y1, y2);
  return Math.min(hi + 0.004, Math.max(lo - 0.004, v));
};
export const topOf = (s: number) => interp(KS, KT, s) * L;
export const botOf = (s: number) => interp(KS, KB, s) * L;
/** the caudal fork: half-width of the gap between the lobes */
export const notchOf = (s: number) => (s <= 0.9 ? 0 : 0.122 * Math.pow((s - 0.9) / 0.1, 1.25) * L);
/** the muscle sheet's top/bottom on the face (rounded ends) */
const musEnd = (s: number) => {
  const c = (MUS0 + MUS1) / 2, h = (MUS1 - MUS0) / 2;
  const x = Math.min(1, Math.abs((s - c) / h));
  return Math.pow(1 - Math.pow(x, 5), 0.5);
};
export const musTop = (s: number) => topOf(s) * 0.82 * musEnd(s);
export const musBot = (s: number) => botOf(s) * 0.82 * musEnd(s);
/** the floater fin (clear plastic) above the anterior body: height above the top edge */
export const floatH = (s: number) => {
  if (s < 0.16 || s > 0.39) return 0;
  const x = (s - 0.16) / 0.23;
  return 0.095 * L * Math.pow(Math.sin(Math.PI * Math.pow(x, 0.72)), 0.85) * (1 - 0.25 * x);
};

export type FishPose = {
  pos: V3;
  /** heading in the x-z plane, deg: 0 swims toward +x (screen right in the opening view), 90 toward -z */
  yaw: number;
  pitch?: number;
  roll?: number;
  /** tail bend (rad), + toward side A */
  A: number;
  actA: number;
  actB: number;
  /** a trigger wave running along each muscle (0..1 = front..back; <0 none) */
  waveA?: number;
  waveB?: number;
  /** tissue maturity 0..1 (thin pale sheet -> thick, deep red, striated) */
  mature: number;
  /** thickness exaggeration for the cutaway views (1 = true proportions) */
  TK: number;
};

/** sample positions along the body, denser at the snout and the fin tips */
export const N = 64;
export const SS: number[] = Array.from({length: N + 1}, (_, i) => {
  const t = i / N;
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
});
const hingeW = (s: number) => (s <= HINGE0 || s >= HINGE1 ? 0 : Math.sin((Math.PI * (s - HINGE0)) / (HINGE1 - HINGE0)));
const W_INT = (2 * (HINGE1 - HINGE0)) / Math.PI;
/** curvature per unit s at s for bend A */
export const kappaS = (A: number, s: number) => (A * hingeW(s)) / W_INT;

export type FishGeo = {
  /** centreline (local u forward, w toward side A), the tailward angle theta, per sample */
  cu: number[];
  cw: number[];
  th: number[];
  /** local -> world */
  W: (u: number, y: number, w: number) => V3;
  /** world normal of side A at sample i */
  nA: (i: number) => V3;
  /** world point on the body at sample i, height v, across-offset d */
  at: (i: number, v: number, d: number) => V3;
  /** the same at any s (interpolated) */
  atS: (s: number, v: number, d: number) => V3;
  F: V3;
  NA: V3;
  pose: FishPose;
};

const rotYPR = (yaw: number, pitch: number, roll: number) => {
  // returns the world axes of the local frame: F (forward), D (down), S (side A)
  const y = (yaw * Math.PI) / 180, p = (pitch * Math.PI) / 180, r = (roll * Math.PI) / 180;
  // heading
  let F: V3 = [Math.cos(y), 0, -Math.sin(y)];
  let S: V3 = [Math.sin(y), 0, Math.cos(y)];
  let D: V3 = [0, 1, 0];
  // pitch about S (nose up for + pitch): F rotates toward -D
  const Fp: V3 = add3(mul3(F, Math.cos(p)), mul3(D, -Math.sin(p)));
  const Dp: V3 = add3(mul3(D, Math.cos(p)), mul3(F, Math.sin(p)));
  F = Fp;
  D = Dp;
  // roll about F
  const Sr: V3 = add3(mul3(S, Math.cos(r)), mul3(D, Math.sin(r)));
  const Dr: V3 = add3(mul3(D, Math.cos(r)), mul3(S, -Math.sin(r)));
  return {F, D: Dr, S: Sr};
};

/** where the pose's position sits on the body (the centre of the length, a little ahead of the hinge) */
export const REF_S = 0.45;

export const fishGeo = (pose: FishPose): FishGeo => {
  const cu: number[] = [], cw: number[] = [], th: number[] = [];
  let u = 0, w = 0, theta = 0;
  for (let i = 0; i <= N; i++) {
    if (i > 0) {
      const ds = SS[i] - SS[i - 1];
      const sm = (SS[i] + SS[i - 1]) / 2;
      const thm = theta + 0.5 * kappaS(pose.A, sm) * ds;
      theta += kappaS(pose.A, sm) * ds;
      u += -Math.cos(thm) * ds * L;
      w += Math.sin(thm) * ds * L;
    }
    cu.push(u);
    cw.push(w);
    th.push(theta);
  }
  // recoil: the anterior body yaws a little the other way (about the centre of the length), so the body pivots
  // rather than wagging only its tail
  const rec = -0.2 * pose.A;
  const iRef = SS.findIndex((s) => s >= REF_S);
  const u0 = cu[iRef], w0 = cw[iRef];
  const c = Math.cos(rec), sn = Math.sin(rec);
  for (let i = 0; i <= N; i++) {
    const du = cu[i] - u0, dw = cw[i] - w0;
    cu[i] = du * c - dw * sn;
    cw[i] = du * sn + dw * c;
    th[i] = th[i] - rec;
  }
  const {F, D, S} = rotYPR(pose.yaw, pose.pitch ?? 0, pose.roll ?? 0);
  const Wf = (uu: number, yy: number, ww: number): V3 => add3(pose.pos, add3(mul3(F, uu), add3(mul3(D, yy), mul3(S, ww))));
  const nAl = (i: number): [number, number] => [Math.sin(th[i]), Math.cos(th[i])];
  const nA = (i: number): V3 => {
    const [a, b] = nAl(i);
    return add3(mul3(F, a), mul3(S, b));
  };
  const at = (i: number, v: number, d: number): V3 => {
    const [a, b] = nAl(i);
    return Wf(cu[i] + d * a, v, cw[i] + d * b);
  };
  const atS = (s: number, v: number, d: number): V3 => {
    let i = 0;
    while (i < N - 1 && SS[i + 1] < s) i++;
    const t = Math.min(1, Math.max(0, (s - SS[i]) / (SS[i + 1] - SS[i] || 1)));
    const uu = cu[i] + (cu[i + 1] - cu[i]) * t, ww = cw[i] + (cw[i + 1] - cw[i]) * t, tt = th[i] + (th[i + 1] - th[i]) * t;
    return Wf(uu + d * Math.sin(tt), v, ww + d * Math.cos(tt));
  };
  return {cu, cw, th, W: Wf, nA, at, atS, F, NA: S, pose};
};

/** how stretched a side's sheet is (0..1): the other side's contraction bends the body away from it */
export const stretchOf = (pose: FishPose, side: 1 | -1) => Math.min(1, Math.max(0, (-side * pose.A) / 0.5));
/** the muscle sheet's thickness on each side: thicker when contracting, and as the tissue matures */
export const musThick = (pose: FishPose, side: 1 | -1) => {
  const act = side > 0 ? pose.actA : pose.actB;
  const st = stretchOf(pose, side);
  return HM * (1 + (pose.TK - 1) * 2.6) * (0.55 + 0.45 * pose.mature) * (1 + 0.85 * act) * (1 - 0.32 * st);
};

// ------------------------------------------------------------------ swimming: the antagonistic cycle
/** one beat cycle from a phase: side A contracts while the bend swings toward A; at full bend side B, fully
 *  stretched, fires and swings it back. Returns bend and activations for amplitude amp (rad). */
export const cycle = (phase: number, amp: number) => {
  const A = amp * Math.sin(phase);
  const c = Math.cos(phase);
  return {A, actA: Math.max(0, c) ** 1.3, actB: Math.max(0, -c) ** 1.3};
};
