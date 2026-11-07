// The film's timeline: every beat keyed to the measured word times (data/timeline.json), the cameras of every shot,
// where the bird is, and the drive's phase. Pure functions of t (seconds); Film.tsx draws them.
import {clamp, DUR, keyS, lerp, ss, ss5, word} from './lib';
import {add3, bodyFrame, Frame, lerpOrbit, Orbit, V3, xf} from './three';
import {phiOfPhase, pose, Pose, HINGE, CRADLE} from './rig';

// ------------------------------------------------------------------ word times
const w = (s: string, n = 0) => word(s, n);
export const T = {
  motor: w('motor').start, // 0.48
  inside: w('inside').start, // 0.80
  dead1: w('dead').start, // 1.28
  you2: w('you', 1).start, // 2.18
  fly: w('fly').start, // 2.72
  againEnd: w('again').end, // 3.38
  researchers: w('Researchers').start, // 4.11
  drones: w('drones').start, // 4.87
  using1: w('using').start, // 5.30
  preserved1: w('preserved').start, // 5.58
  bodiesEnd: w('bodies').end, // 6.80
  with1: w('with').start, // 6.99
  machinery: w('machinery').start, // 7.05
  hidden: w('hidden').start, // 7.66
  underneath: w('underneath').start, // 7.93
  feathers: w('feathers').start, // 8.49
  feathersEnd: w('feathers').end, // 8.91
  gearbox: w('gearbox').start, // 9.40
  turns: w('turns').start, // 9.94
  motors: w("motor's").start, // 10.34
  spinning: w('spinning').start, // 10.70
  motion: w('motion').start, // 11.05
  into: w('into').start, // 11.41
  flapping: w('flapping').start, // 11.62
  wings: w('wings').start, // 12.13
  wingsEnd: w('wings').end, // 12.53
  goal: w('goal').start, // 12.99
  watch: w('watch').start, // 13.62
  wildlife: w('wildlife').start, // 13.90
  less: w('less').start, // 14.66
  disturbanceEnd: w('disturbance').end, // 15.53
  and2: w('And').start, // 15.94
  swimming: w('swimming').start, // 16.70
  robot: w('robot').start, // 17.09
  using2: w('using', 1).start, // 17.50
  duck: w('duck').start, // 18.38
  duckEnd: w('duck').end, // 18.68
  so: w('So').start, // 19.13
  bird3: w('bird', 2).start, // 19.59
  watching: w('watching').start, // 19.95
  birdsEnd: w('birds').end, // 21.12
  might: w('might').start, // 21.45
  dead2: w('dead', 1).start, // 22.29
  deadEnd: w('dead', 1).end, // 22.60
};

// ------------------------------------------------------------------ shot windows and transitions
/** the cut points and transition windows (s). A wipe runs over [a, b]: the outgoing shot is drawn until b, the
 *  incoming from a. */
export const CUT = {
  openToLab: 3.95, // match cut on the near wing root
  labToMeadow: [12.56, 12.96] as [number, number], // wing wipe (the downstroke carries the drone forward)
  meadowToPond: [15.56, 15.96] as [number, number], // waterline wipe
  pondToSky: [18.84, 19.2] as [number, number], // water crosses the foreground edge
  loop: [22.74, DUR] as [number, number], // wing wipe back into the opening composition
};

// ------------------------------------------------------------------ flight
export const T_FLAP = 0.7; // s per wingbeat in flight (gear B turns once, the motor six times)
export const V_FLY = 200; // cm/s along +x
const bob = (u: number) => 0.9 * Math.sin(2 * Math.PI * (u - 0.3)); // the body rises slightly on the downstroke
const pitchOsc = (u: number) => 1.2 * Math.sin(2 * Math.PI * (u - 0.1));
/** a flying bird's body frame at phase u, along +x from x0 */
export const flyFrame = (x: number, u: number, y0 = 0, yaw = 0): Frame => bodyFrame([x, y0 + bob(u), 0], yaw, pitchOsc(u), 0);

export type ShotState = {
  cam: Orbit;
  F: Frame;
  /** flap phase (turns; 0 = top of the upstroke) */
  u: number;
  ps: Pose;
  /** gear B's angular speed (rad/s) for motion blur */
  rate: number;
};
const P = (u: number) => pose(phiOfPhase(u));
const rateOf = (dudt: number) => 2 * Math.PI * dudt;

// ------------------------------------------------------------------ S1: the opening (also drawn at t - DUR for the loop)
/** opening phase: at frame 0 the near wing is just past the top of its stroke, starting down */
export const U0_OPEN = 0.06;
export const uOpen = (t: number) => U0_OPEN + t / T_FLAP;
/** the cutaway in the opening: opened by the first downstrokes' trailing edge, closed by a later downstroke */
export const openCut = (t: number) => {
  // fully open from ~0.5 s; closes 2.95 - 3.45 s
  return clamp(ss(t, 0.12, 0.5)) * (1 - ss(t, 2.95, 3.45));
};
/** the opening camera, relative to the bird's flight line (no bob) at x = V_FLY t */
export const openCam = (t: number): Orbit => {
  const base: V3 = [V_FLY * t, 0, 0];
  const rootLocal: V3 = [HINGE.near[0] + 0.5, HINGE.near[1] + 0.6, 5.4];
  // frame 0: the whole bird large, with lead room to the right (beak clear of the action buttons)
  const A: Orbit = {target: add3(base, [-2.5, 2.0, 0]), yaw: 14, pitch: 7, dist: 900, scale: 17.5, cx: 455, cy: 1010};
  // the reveal: ease in on the drive (gear B and the rods) while the wing keeps flapping
  const A2: Orbit = {target: add3(base, [2.6, 0.6, 0]), yaw: 14, pitch: 7, dist: 900, scale: 23, cx: 500, cy: 1030};
  // "fly again": back out to the whole bird and the fence line
  const Bw: Orbit = {target: add3(base, [-3, 5, 0]), yaw: 16, pitch: 9, dist: 900, scale: 12.5, cx: 470, cy: 990};
  // push to the near wing root for the match into the lab
  const Cr: Orbit = {target: add3(base, rootLocal), yaw: 14, pitch: 7, dist: 900, scale: 30, cx: 540, cy: 1000};
  if (t < 2.25) return lerpOrbit(A, A2, ss5(t, 0.25, 1.45));
  if (t < 3.3) return lerpOrbit(A2, Bw, ss5(t, 2.25, 3.3));
  return lerpOrbit(Bw, Cr, ss5(t, 3.3, CUT.openToLab + 0.12));
};
export const openState = (t: number): ShotState => {
  const u = uOpen(t);
  return {cam: openCam(t), F: flyFrame(V_FLY * t, u), u, ps: P(u), rate: rateOf(1 / T_FLAP)};
};

// ------------------------------------------------------------------ S2-S3: the lab (construction, then the close drive)
const U_MATCH = uOpen(CUT.openToLab);
// spin-down after the match: decelerate smoothly to rest with the wings level (phase 0.25 mod 1)
const SPIN = (() => {
  const target = Math.ceil(U_MATCH - 0.25 + 0.35) + 0.25; // the next level phase at least 0.35 turn ahead
  const delta = target - U_MATCH;
  const D = 2 * T_FLAP * delta; // u(s) = U_MATCH + delta * (2s - s^2), s in [0, 1] -> initial speed 1/T_FLAP
  return {target, delta, D};
})();
export const LAB = {
  restU: SPIN.target,
  spinEnd: CUT.openToLab + SPIN.D,
  motorOn: 9.15, // the bench test starts as the cutaway opens
  slow: 0.32, // explanatory slow motion in the close drive (fraction of flight speed)
  slowEnd: 11.95,
  fullBy: 12.5,
  lift: [T.using1 + 0.05, T.bodiesEnd - 0.1] as [number, number], // shell rises
  seat: [T.underneath - 0.05, T.feathersEnd - 0.12] as [number, number], // shell seats back
  liftH: 15,
  cutOpen: [8.95, 9.45] as [number, number],
  cutClose: [12.12, 12.5] as [number, number],
};
/** integrated phase in the lab */
export const uLab = (t: number) => {
  if (t < CUT.openToLab) return U_MATCH;
  if (t < LAB.spinEnd) {
    const s = (t - CUT.openToLab) / SPIN.D;
    return U_MATCH + SPIN.delta * (2 * s - s * s);
  }
  if (t < LAB.motorOn) return LAB.restU;
  // speed (fraction of flight speed): smoothstep 0 -> slow over 0.45 s, hold, smoothstep slow -> 1 over slowEnd..fullBy,
  // then 1. Integrated in closed form: the integral of smoothstep over a span of length L to fraction v is L (v^3 - v^4/2).
  const S = (v: number) => v * v * v - (v * v * v * v) / 2;
  const m = LAB.motorOn, r = 0.45, sl = LAB.slow, e = LAB.slowEnd, f = LAB.fullBy;
  let acc = 0;
  if (t <= m + r) acc = sl * r * S(clamp((t - m) / r));
  else {
    acc = sl * r * 0.5;
    if (t <= e) acc += sl * (t - (m + r));
    else {
      acc += sl * (e - (m + r));
      if (t <= f) acc += sl * (t - e) + (1 - sl) * (f - e) * S(clamp((t - e) / (f - e)));
      else acc += sl * (f - e) + (1 - sl) * (f - e) * 0.5 + (t - f);
    }
  }
  return LAB.restU + acc / T_FLAP;
};
const labSpeed = (t: number) => (uLab(t + 0.01) - uLab(t - 0.01)) / 0.02;
export const labShellLift = (t: number) => LAB.liftH * (ss5(t, LAB.lift[0], LAB.lift[1]) - ss5(t, LAB.seat[0], LAB.seat[1]));
export const labCut = (t: number) => ss(t, LAB.cutOpen[0], LAB.cutOpen[1]) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[1]));
/** where the drive parts are, body-local (cm), for the close-drive camera */
const GBX: V3 = [2.5, -0.4, 0], GAX: V3 = [4.64, -2.2, 0], GP0X: V3 = [4.46, -4.29, 0];
/** the lab bird's body frame: at the match it carries the flying bird's bob and pitch, then settles into the cradle */
export const labFrame = (t: number): Frame => {
  const k = 1 - ss(t, CUT.openToLab, LAB.spinEnd);
  return bodyFrame([0, bob(U_MATCH) * k + labFrameLift(t), 0], 0, pitchOsc(U_MATCH) * k, 0);
};
/** the three-layer schematic: after the shell has risen, the mechanical frame (with the wings on its spars) also rises
 *  off the cradle, then both come back down in turn (frame first, then the shell seats over it) */
export const LAB_FRAME_LIFT = {h: 5.5, up: [6.45, 7.25] as [number, number], down: [7.5, 8.1] as [number, number]};
export const labFrameLift = (t: number) => LAB_FRAME_LIFT.h * (ss5(t, ...LAB_FRAME_LIFT.up) - ss5(t, ...LAB_FRAME_LIFT.down));
export const labState = (t: number): ShotState => {
  const u = uLab(t);
  const F = labFrame(t);
  // the match: the opening camera at the cut, re-based from the flight line onto the lab bird (identical framing)
  const oc = openCam(CUT.openToLab);
  const M: Orbit = {...oc, target: sub3v(oc.target, [V_FLY * CUT.openToLab, 0, 0])};
  const wide: Orbit = {target: [-2.5, -2.5, 0], yaw: 22, pitch: 15, dist: 420, scale: 16, cx: 520, cy: 1060};
  const exploded: Orbit = {target: [-2.5, 5.0, 0], yaw: 25, pitch: 15, dist: 420, scale: 16.5, cx: 520, cy: 1080};
  const gear: Orbit = {target: [3.4, -1.9, 0.3], yaw: 12, pitch: 7, dist: 90, scale: 48, cy: 1060};
  const gear2: Orbit = {...gear, target: [3.6, -2.0, 0.3], scale: 55};
  const fP0: Orbit = {target: [GP0X[0], GP0X[1] + 0.2, 0], yaw: 10, pitch: 6, dist: 80, scale: 72, cy: 1060};
  const fA: Orbit = {...fP0, target: [GAX[0] - 0.3, GAX[1], 0], scale: 70};
  const fB: Orbit = {...fP0, target: [GBX[0] + 0.2, GBX[1] + 0.3, 0], scale: 66};
  const fRod: Orbit = {target: [2.6, 3.6, 1.6], yaw: 12, pitch: 5, dist: 80, scale: 60, cy: 1080};
  const ps = P(u);
  const W = ps.wing.near;
  const midWing = xf(F, add3(W.o, add3([W.ex[0] * 15, W.ex[1] * 15, W.ex[2] * 15], [W.ey[0] * 5, W.ey[1] * 5, W.ey[2] * 5])));
  const wingCam: Orbit = {target: lerpVec(midWing, [4, 4, 12], 0.4), yaw: 18, pitch: 9, dist: 300, scale: 15, cy: 1000};
  let cam: Orbit;
  if (t < 5.2) cam = lerpOrbit(M, wide, ss5(t, CUT.openToLab, 5.2));
  else if (t < T.gearbox + 0.1) {
    // exploded view and back, then one unhurried push into the gearbox that starts while the shell is still seating
    const ex2: Orbit = {...exploded, yaw: 31, pitch: 17, target: [-2.0, 6.5, 0]};
    const ex = lerpOrbit(exploded, ex2, ss5(t, 6.3, 8.0));
    const held = lerpOrbit(wide, ex, clamp(ss5(t, 5.25, 6.6) - ss5(t, 7.95, 8.85)));
    cam = lerpOrbit(held, gear, ss5(t, 8.45, T.gearbox + 0.1));
  }
  else if (t < T.motors - 0.05) cam = lerpOrbit(gear, gear2, ss5(t, T.gearbox + 0.1, T.motors - 0.05));
  else if (t < T.spinning + 0.2) cam = lerpOrbit(gear2, fP0, ss5(t, T.motors - 0.05, T.spinning + 0.2));
  else if (t < T.motion + 0.15) cam = lerpOrbit(fP0, fA, ss5(t, T.spinning + 0.2, T.motion + 0.15));
  else if (t < T.into + 0.05) cam = lerpOrbit(fA, fB, ss5(t, T.motion + 0.15, T.into + 0.05));
  else if (t < 11.85) cam = lerpOrbit(fB, fRod, ss5(t, T.into + 0.05, 11.85));
  else cam = lerpOrbit(fRod, wingCam, ss5(t, 11.85, 12.8));
  return {cam, F, u, ps, rate: rateOf(labSpeed(t))};
};
const sub3v = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerpVec = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
/** which drive part the close-up emphasises */
export const labFocus = (t: number): 'P0' | 'A' | 'B' | 'rod' | null => {
  if (t < T.gearbox - 0.2 || t > T.wings + 0.1) return null;
  if (t < T.motors + 0.25) return 'P0';
  if (t < T.motion + 0.1) return 'A';
  if (t < T.into + 0.1) return 'B';
  return 'rod';
};

// ------------------------------------------------------------------ S4: the research-goal meadow
export const MEADOW_T0 = CUT.labToMeadow[0];
/** the meadow bird continues the lab bird's stroke through the wipe */
const U_MEADOW0 = uLab(CUT.labToMeadow[0]);
export const uMeadow = (t: number) => U_MEADOW0 + (t - MEADOW_T0) / T_FLAP;
export const meadowState = (t: number): ShotState => {
  const u = uMeadow(t);
  const x = V_FLY * (t - MEADOW_T0);
  const F = flyFrame(x, u, 0);
  const base: V3 = [x, 0, 0];
  const A: Orbit = {target: add3(base, [-4, 8, 0]), yaw: 6, pitch: 3, dist: 1100, scale: 12.5, cx: 480, cy: 1100};
  const Bm: Orbit = {target: add3(base, [-2, 6, 0]), yaw: 9, pitch: 4, dist: 1100, scale: 13.5, cx: 480, cy: 1080};
  const cam = lerpOrbit(A, Bm, ss5(t, MEADOW_T0, CUT.meadowToPond[1]));
  return {cam, F, u, ps: P(u), rate: rateOf(1 / T_FLAP)};
};
/** the restrained "less disturbance" sound arcs (0..1 strength; they shrink and fade on 'less disturbance') */
export const arcs = (t: number) => ({
  a: ss(t, T.wildlife + 0.2, T.less - 0.05) * (1 - ss(t, T.less + 0.15, T.disturbanceEnd - 0.05)),
  r: lerp(1, 0.45, ss(t, T.less - 0.05, T.disturbanceEnd)),
});

// ------------------------------------------------------------------ S5: the duck (a separate prototype, its own pond)
export const POND_T0 = CUT.meadowToPond[0];
export const DUCK_V = 38; // cm/s
export const duckPos = (t: number): V3 => [DUCK_V * (t - POND_T0) - 30, 0, 0];
/** below-water schematic amount */
export const duckCut = (t: number) => ss(t, T.using2 - 0.15, T.using2 + 0.3) * (1 - ss(t, T.duckEnd + 0.02, T.duckEnd + 0.4));
export const pondCam = (t: number): Orbit => {
  const p = duckPos(t);
  const surf: Orbit = {target: add3(p, [2, 8, 0]), yaw: 10, pitch: 8, dist: 700, scale: 12.5, cx: 500, cy: 1020};
  const surf2: Orbit = {...surf, target: add3(p, [3, 6, 0]), scale: 13.5};
  const split: Orbit = {target: add3(p, [2, -3, 0]), yaw: 6, pitch: 0.5, dist: 500, scale: 13.5, cx: 500, cy: 980};
  const k = duckCut(t);
  return lerpOrbit(lerpOrbit(surf, surf2, ss5(t, POND_T0, T.using2)), split, ss5(k, 0, 1));
};

// ------------------------------------------------------------------ S6: the callback among living birds
export const SKY_T0 = CUT.pondToSky[0];
/** the callback bird flaps in step with the opening bird's continuation (t - DUR), so the loop wipe only changes the
 *  background: same position, scale, wing phase and direction */
export const uSky = (t: number) => uOpen(t - DUR);
export const skyCut = (t: number) => ss(t, 20.55, 20.85) * (1 - ss(t, 21.2, 21.5));
export const skyState = (t: number): ShotState => {
  const u = uSky(t);
  // the bird's x runs on the same line as the opening's continuation, so the end framing is the opening's frame 0
  const x = V_FLY * (t - DUR);
  const F = flyFrame(x, u, 0);
  const base: V3 = [x, 0, 0];
  const A: Orbit = {target: add3(base, [-9, 8, 0]), yaw: 12, pitch: 5, dist: 900, scale: 14.5, cx: 470, cy: 1100};
  const Bs: Orbit = {target: add3(base, [-5, 5, 0]), yaw: 13, pitch: 6, dist: 900, scale: 16, cx: 465, cy: 1050};
  const end = openCam(0);
  const Cs: Orbit = {...end, target: add3(base, sub3v(end.target, [0, 0, 0]))};
  let cam: Orbit;
  if (t < 21.4) cam = lerpOrbit(A, Bs, ss5(t, SKY_T0, 21.4));
  else cam = lerpOrbit(Bs, Cs, ss5(t, 21.4, CUT.loop[0] + 0.3));
  return {cam, F, u, ps: P(u), rate: rateOf(1 / T_FLAP)};
};

// ------------------------------------------------------------------ the flank cutaway reveals (wing-shaped wipes)
// the opening's cutaway: opened by two downstrokes' trailing edges, closed by a later one
export const OPEN_REVEAL = {first: [0.1, 0.31] as [number, number], second: [0.8, 1.01] as [number, number], close: [2.9, 3.11] as [number, number]};
export const openReveal = (t: number): {e: number; mode: 'above' | 'below'} | null => {
  if (t < OPEN_REVEAL.first[0]) return null;
  if (t < OPEN_REVEAL.close[0]) {
    const e = 0.55 * ss(t, ...OPEN_REVEAL.first) + 0.45 * ss(t, ...OPEN_REVEAL.second);
    return {e, mode: 'above'};
  }
  if (t < OPEN_REVEAL.close[1]) return {e: ss(t, ...OPEN_REVEAL.close), mode: 'below'};
  return null;
};
// the callback: the same reveal, one downstroke to open and the next to close
export const SKY_REVEAL = {open: [20.9, 21.11] as [number, number], close: [21.6, 21.81] as [number, number]};
export const skyReveal = (t: number): {e: number; mode: 'above' | 'below'} | null => {
  if (t < SKY_REVEAL.open[0] || t >= SKY_REVEAL.close[1]) return null;
  if (t < SKY_REVEAL.close[0]) return {e: ss(t, ...SKY_REVEAL.open), mode: 'above'};
  return {e: ss(t, ...SKY_REVEAL.close), mode: 'below'};
};

// ------------------------------------------------------------------ labels
/** opacity of the two scope labels */
export const labels = (t: number) => ({
  schematic: Math.max(
    ss(t, 0.45, 0.7) * (1 - ss(t, 2.9, 3.2)), // the opening cutaway
    ss(t, LAB.lift[0] + 0.5, LAB.lift[0] + 0.8) * (1 - ss(t, LAB.seat[1] - 0.2, LAB.seat[1] + 0.1)), // exploded view
    ss(t, LAB.cutOpen[0] + 0.2, LAB.cutOpen[1]) * (1 - ss(t, LAB.cutClose[0], LAB.cutClose[0] + 0.25)), // close drive
    ss(t, T.using2, T.using2 + 0.2) * (1 - ss(t, T.duckEnd, T.duckEnd + 0.25)), // the duck's schematic
    ss(t, 20.62, 20.8) * (1 - ss(t, 21.2, 21.4)), // the callback
  ),
  research: ss(t, MEADOW_T0 + 0.5, MEADOW_T0 + 0.75) * (1 - ss(t, CUT.meadowToPond[0] - 0.1, CUT.meadowToPond[0] + 0.1)),
});

export const LAB_BENCH_Y = CRADLE.benchY;
export {keyS};
