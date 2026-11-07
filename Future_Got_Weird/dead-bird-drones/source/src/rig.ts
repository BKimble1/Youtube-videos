// THE bird drone: one body-local geometry (cm) and one mechanical coordinate system, used by every shot.
// Body-local axes: x forward (beak at +x), y up, z toward the NEAR side (the near wing is the +z wing).
// Origin: the middle of the chest, under the shoulders.
//
// The drive (a simplified explanatory reconstruction, labelled SCHEMATIC on screen; not a measured model of a published
// device): a DC motor behind a skeletal back plate turns a 10-tooth pinion P0, which drives the 20-tooth gear A; a
// 10-tooth pinion P1 on A's axle drives the 30-tooth output gear B (2 x 3 = 6 : 1). A crank pin on B drives two
// connecting rods; each rod lifts a short lever on a wing spar that hinges about an axis along x at the shoulder. The
// flap angle of each wing is SOLVED from the rod length (crank-rocker), so the wings move only because the motor turns.
import {add3, cross3, Frame, mul3, norm3, rad, rotX, sub3, V3, len3, deg} from './three';

// ------------------------------------------------------------------ the preserved exterior (shell)
export type Ell = {c: V3; r: V3; tilt?: number};
/** body volumes (ellipsoids; tilt = rotation about z in degrees, nose-up positive) */
export const BODY: Record<'chest' | 'rear' | 'neck' | 'head', Ell> = {
  chest: {c: [2, 0, 0], r: [10.5, 7, 7.2]},
  rear: {c: [-7.5, 0.7, 0], r: [8.5, 5.3, 5.6], tilt: 6},
  neck: {c: [10.2, 4.0, 0], r: [4.8, 4.5, 4.1], tilt: 35},
  head: {c: [14.8, 7.4, 0], r: [4.4, 3.9, 3.7], tilt: -4},
};
/** beak: base centre, tip, half-height and half-width at the base (a short pointed generic beak) */
export const BEAK = {base: [18.4, 7.0, 0] as V3, tip: [23.2, 6.0, 0] as V3, hh: 1.35, hw: 1.15};
/** glass eye (fixed: it never blinks, moves or tracks anything): centre on the head surface, radius, outward normal */
export const EYE = {near: [16.5, 8.5, 3.05] as V3, far: [16.5, 8.5, -3.05] as V3, r: 1.0, nNear: norm3([0.35, 0.25, 1]), nFar: norm3([0.35, 0.25, -1])};
/** tail fan: root, tip line at x = TAIL.tipX, spread ±TAIL.spread at the tips, tilted up by TAIL.lift deg; 12 feathers */
export const TAIL = {root: [-13.8, 1.8, 0] as V3, tipX: -28.5, spread: 5.2, lift: 7, n: 12, width: 1.9};
/** where the shell's surface sits at the shoulders (the wing emerges from the body here) */
export const SHOULDER_Z = 5.6;

// ------------------------------------------------------------------ the mechanical frame (body-local)
export const MOD = 0.14; // gear module (cm of pitch diameter per tooth)
export type Gear = {id: 'P0' | 'A' | 'P1' | 'B'; n: number; r: number; c: V3; z0: number; z1: number};
const pr = (n: number) => (MOD * n) / 2;
const GB: V3 = [2.5, -0.4, 0];
const angBA = rad(-40), angAP0 = rad(-95);
const GA: V3 = [GB[0] + (pr(30) + pr(10)) * Math.cos(angBA), GB[1] + (pr(30) + pr(10)) * Math.sin(angBA), 0];
const GP0: V3 = [GA[0] + (pr(20) + pr(10)) * Math.cos(angAP0), GA[1] + (pr(20) + pr(10)) * Math.sin(angAP0), 0];
/** gears: centre (x, y; the axle runs along z), the z range of the toothed face. P1 sits in B's plane; A and P0 sit
 *  in the plane behind it, in front of the back plate. */
export const GEARS: Record<Gear['id'], Gear> = {
  B: {id: 'B', n: 30, r: pr(30), c: GB, z0: -0.78, z1: -0.4},
  P1: {id: 'P1', n: 10, r: pr(10), c: GA, z0: -0.78, z1: -0.4},
  A: {id: 'A', n: 20, r: pr(20), c: GA, z0: -1.63, z1: -1.28},
  P0: {id: 'P0', n: 10, r: pr(10), c: GP0, z0: -1.63, z1: -1.28},
};
export const RATIO = (30 / 10) * (20 / 10); // motor turns per crank turn = 6
/** the motor: a can behind the back plate, shaft along z through the plate to the pinion P0 */
export const MOTOR = {c: GP0, r: 1.35, z0: -5.2, z1: -2.42, shaftR: 0.16};
/** skeletal back plate (z = PLATE.z, thickness PLATE.th toward -z); outline in (x, y), with lightening holes */
export const PLATE = {
  z: -2.15,
  th: 0.25,
  outline: [[-2.6, 3.2], [-1.2, 5.3], [6.0, 5.3], [7.4, 3.6], [7.2, -1.2], [6.6, -2.9], [3.0, -3.4], [0.2, -2.6], [-2.6, -0.8]] as [number, number][],
  // the motor can shows through this window
  holes: [{c: [4.46, -4.29] as [number, number], r: 1.6}, {c: [-0.4, 1.4] as [number, number], r: 1.25}, {c: [5.4, 2.4] as [number, number], r: 0.9}],
};
/** crank pin on gear B (it protrudes from B's front face to z = 0, the mid-plane): radius from B's centre; the two rod
 *  eyes ride on it side by side at z = +eye (near rod) and -eye (far rod), so the two linkages are mirror images */
export const CRANK = {rc: 1.15, z: 0, eye: 0.15, pinR: 0.22};
/** wing hinges: the spar root pivots about an axis along x through these points; LEVER = distance outboard of the
 *  hinge where the rod's top joint sits on the spar */
export const HINGE = {near: [2.5, 4.6, 0.9] as V3, far: [2.5, 4.6, -0.9] as V3, axisLen: 3.2};
export const LEVER = 2.1;
export const SPAR = {len: 34, r: 0.22};
/** the top cross-member of the frame that carries both hinges */
export const TOPBAR = {y: 4.6, x0: 0.6, x1: 4.4, z0: -2.15, z1: 1.3};
/** mean flap angle (deg) at mid-stroke; the rod lengths are solved from it */
const THETA_MEAN = -2;

// ------------------------------------------------------------------ kinematics
const crankPin = (phi: number): V3 => [GB[0] + CRANK.rc * Math.cos(phi), GB[1] + CRANK.rc * Math.sin(phi), CRANK.z];
/** where each rod's lower eye sits on the pin */
const rodEye = (side: 1 | -1, phi: number): V3 => add3(crankPin(phi), [0, 0, side * CRANK.eye]);
const sparDir = (side: 1 | -1, thDeg: number): V3 => [0, Math.sin(rad(thDeg)), side * Math.cos(rad(thDeg))];
const hingeOf = (side: 1 | -1) => (side > 0 ? HINGE.near : HINGE.far);
const leverPt = (side: 1 | -1, thDeg: number): V3 => add3(hingeOf(side), mul3(sparDir(side, thDeg), LEVER));
// rod lengths: the distance from the mid-stroke crank pin (phi = 0, pin level with B's centre) to the lever at THETA_MEAN
const ROD = {
  near: len3(sub3(leverPt(1, THETA_MEAN), rodEye(1, 0))),
  far: len3(sub3(leverPt(-1, THETA_MEAN), rodEye(-1, 0))),
};
export const ROD_LEN = ROD;
/** solve the spar angle for a crank angle (bisection on the rod-length constraint; monotonic over [-60, 75] deg) */
const solveTheta = (side: 1 | -1, phi: number) => {
  const P = rodEye(side, phi);
  const L = side > 0 ? ROD.near : ROD.far;
  let lo = -60, hi = 75;
  const f = (th: number) => len3(sub3(leverPt(side, th), P)) - L;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (f(m) > 0) hi = m; else lo = m;
  }
  return (lo + hi) / 2;
};

/** tooth phase for meshing gears: gear 2's angle from gear 1's (centres c1 -> c2) */
const meshAngle = (a1: number, n1: number, c1: V3, n2: number, c2: V3) => {
  const g = Math.atan2(c2[1] - c1[1], c2[0] - c1[0]);
  return -(n1 / n2) * (a1 - g) + g + Math.PI + Math.PI / n2;
};

export type WingFrame = Frame & {side: 1 | -1; theta: number; twist: number; top: V3};
export type Pose = {
  /** crank angle (rad): gear B's rotation; 0 = pin level with B's centre, toward +x; increasing = counter-clockwise seen from +z */
  phi: number;
  /** gear rotations (rad, counter-clockwise seen from +z), tooth 0 of each gear at this local angle */
  gear: Record<Gear['id'], number>;
  /** motor shaft angle (rad) = the pinion P0's angle */
  motor: number;
  pin: V3;
  /** the rods' lower eyes on the pin */
  rodEye: {near: V3; far: V3};
  rodTop: {near: V3; far: V3};
  theta: {near: number; far: number};
  /** each wing's frame: o = hinge, ex = span (out along the spar), ey = chord toward the trailing edge, ez = ex x ey;
   *  ez = top = the dorsal (upper-surface) normal */
  wing: {near: WingFrame; far: WingFrame};
};

/** the drive at crank angle phi (rad). opts.flapScale scales the solved stroke about THETA_MEAN (1 = mechanical) */
export const pose = (phi: number): Pose => {
  const aB = phi;
  const aP1 = meshAngle(aB, 30, GEARS.B.c, 10, GEARS.P1.c);
  const aA = aP1;
  const aP0 = meshAngle(aA, 20, GEARS.A.c, 10, GEARS.P0.c);
  const thN = solveTheta(1, phi), thF = solveTheta(-1, phi);
  // passive twist: the wing pitches with the flap velocity (leading edge down on the downstroke), at most about 7 deg
  const dN = solveTheta(1, phi + 0.05) - thN;
  const twist = Math.max(-7, Math.min(7, -dN * 3));
  const wf = (side: 1 | -1, th: number): WingFrame => {
    const S = sparDir(side, th);
    // chord toward the trailing edge: -x, twisted about the span axis
    const C0: V3 = [-1, 0, 0];
    const N0 = side > 0 ? cross3(C0, S) : cross3(S, C0); // dorsal normal before twist
    const tw = rad(twist);
    const C = norm3(add3(mul3(C0, Math.cos(tw)), mul3(N0, Math.sin(tw))));
    const top = norm3(side > 0 ? cross3(C, S) : cross3(S, C));
    return {o: hingeOf(side), ex: S, ey: C, ez: top, side, theta: th, twist, top};
  };
  return {
    phi,
    gear: {B: aB, P1: aP1, A: aA, P0: aP0},
    motor: aP0,
    pin: crankPin(phi),
    rodEye: {near: rodEye(1, phi), far: rodEye(-1, phi)},
    rodTop: {near: leverPt(1, thN), far: leverPt(-1, thF)},
    theta: {near: thN, far: thF},
    wing: {near: wf(1, thN), far: wf(-1, thF)},
  };
};

/** a wing point (a = cm out along the span from the hinge, b = cm back along the chord) in body-local coords */
export const wingPt = (W: WingFrame, a: number, b: number): V3 => add3(W.o, add3(mul3(W.ex, a), mul3(W.ey, b)));

// ------------------------------------------------------------------ the preserved wing (feathers), in wing coords (a, b)
/** outline of the whole wing, clockwise from the root's leading edge (a: span from the hinge, b: back along the chord) */
export const WING_OUTLINE: [number, number][] = [
  [5.4, -1.9], [9, -2.5], [13, -2.75], [17, -2.6], [19.6, -2.2], [23, -1.4], [27, 0.0], [31, 2.0], [34.4, 4.2], [36.6, 6.2],
  [36.0, 7.6], [34.6, 9.1], [32.6, 10.6], [30.0, 11.7], [27.0, 12.3], [23.5, 12.6], [20.0, 12.8], [16, 12.7], [12, 12.3], [8.5, 11.6], [5.4, 10.4],
];
export type Feather = {base: [number, number]; tip: [number, number]; w: number; kind: 'primary' | 'secondary' | 'covert' | 'lesser'};
const lerp2 = (a: [number, number], b: [number, number], u: number): [number, number] => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
/** feathers, back to front (draw order: primaries, secondaries, greater coverts, lesser coverts). Lengths and overlaps
 *  are fixed: the wing is one rigid preserved wing clamped to its spar. */
export const FEATHERS: Feather[] = (() => {
  const out: Feather[] = [];
  // 9 primaries: tips along the outer trailing edge, bases along the hand (they fan from the wrist)
  const pTips: [number, number][] = [[27.0, 12.3], [29.6, 11.8], [31.9, 10.9], [33.8, 9.7], [35.3, 8.4], [36.4, 7.0], [36.6, 5.9], [35.7, 4.8], [34.0, 3.8]];
  pTips.forEach((tip, i) => out.push({base: lerp2([20.4, 5.2], [24.5, 0.6], i / 8), tip, w: 2.25 - i * 0.05, kind: 'primary'}));
  // 10 secondaries: tips along the inner trailing edge, bases on the arm
  for (let i = 0; i < 10; i++) {
    const a = 6.0 + i * 1.62;
    const tipB = 10.7 + 2.1 * Math.sin((i / 9) * Math.PI * 0.55) ;
    out.push({base: [a + 0.4, 3.2], tip: [a, Math.min(12.8, tipB)], w: 2.55, kind: 'secondary'});
  }
  // greater coverts: a scalloped row over the bases
  for (let i = 0; i < 12; i++) {
    const a = 5.8 + i * 1.6;
    out.push({base: [a + 0.3, 0.6], tip: [a, 5.6 + (i > 8 ? -0.6 * (i - 8) : 0)], w: 2.1, kind: 'covert'});
  }
  // lesser coverts: small rows along the leading edge
  for (let i = 0; i < 14; i++) {
    const a = 5.7 + i * 1.45;
    out.push({base: [a + 0.2, -2.0], tip: [a, 1.4 - (i > 10 ? 0.4 * (i - 10) : 0)], w: 1.7, kind: 'lesser'});
  }
  return out;
})();
/** the shell's opening for the spar at each shoulder (body-local), where the wing's root meets the body */
export const WING_ROOT_A = 5.4;

// ------------------------------------------------------------------ helpers for shots
/** crank angle for a flap phase in [0, 1): 0 = the top of the upstroke (near wing at its highest), 0.5 = bottom */
export const PHI_TOP = (() => {
  // find the crank angle at which the near wing is highest
  let best = 0, bv = -1e9;
  for (let i = 0; i < 720; i++) {
    const p = (i / 720) * Math.PI * 2;
    const th = solveTheta(1, p);
    if (th > bv) { bv = th; best = p; }
  }
  return best;
})();
export const THETA_RANGE = (() => {
  let lo = 1e9, hi = -1e9;
  for (let i = 0; i < 720; i++) {
    const th = solveTheta(1, (i / 720) * Math.PI * 2);
    lo = Math.min(lo, th); hi = Math.max(hi, th);
  }
  return {lo, hi};
})();
/** which way does the crank turn? The film runs it counter-clockwise seen from the near side (+z). Flap phase u
 *  (0 = top of the upstroke) maps to crank angle phi = PHI_TOP + 2 pi u. */
export const phiOfPhase = (u: number) => PHI_TOP + 2 * Math.PI * u;
export const R2D = deg;

// ------------------------------------------------------------------ lab cradle contact (body-local)
/** two padded U-supports under the body (lab construction scene); y of the bench top below the bird origin */
export const CRADLE = {xs: [-5.5, 6.0], contactY: -6.4, benchY: -15.5, padW: 2.4};
