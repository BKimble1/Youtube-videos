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
  // the background sweeps down behind the drone on one full-speed downstroke (phase 0.1 -> 0.45); the drone itself is
  // continuous (the lab's last framing is the meadow's first, re-based), so only the place changes
  labToMeadow: [12.845, 13.09] as [number, number],
  // (V2) a hard MATCH CUT on 'And': the camera has pushed into the drone's flank cutaway; the pond opens tight on the
  // duck's own cutaway window at the same screen place and size, then pulls back to reveal the duck
  meadowToPond: [15.94, 15.94] as [number, number],
  // (V2) a whip tilt: the pond camera tilts up fast toward the sky, hard cut at the fastest point, and the sky shot's
  // camera finishes the tilt coming down onto the flock; the drone flies in from the left
  pondToSky: [18.95, 18.95] as [number, number],
  // the same background sweep on the downstroke after 'dead' (sky phase 0.1 -> 0.45), into the opening's own frames
  loop: [22.93, 23.18] as [number, number],
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
  // (V2) frame 0: a close-up of the flying bird's flank with the cutaway open (head and wing root in frame), so the drive
  // and the wing it moves read at once; a slow drift in while 'motor' and the rod-to-wing chain are highlighted
  // framed so the raised wingtip stays below the caption band (y > ~410) and the window above the scope label (y < ~1420)
  const A: Orbit = {target: add3(base, [3.6, 1.2, 0]), yaw: 14, pitch: 7, dist: 900, scale: 26.5, cx: 440, cy: 1188};
  const A2: Orbit = {...A, target: add3(base, [3.4, 1.2, 0]), scale: 26.8, cy: 1190};
  // "fly again": out to the whole bird over the field, from a lower, more lateral angle (a new perspective)
  const Bw: Orbit = {target: add3(base, [-3, 5, 0]), yaw: 20, pitch: 3, dist: 900, scale: 12.5, cx: 470, cy: 1000};
  if (t < 1.85) return lerpOrbit(A, A2, ss5(t, 0, 1.85));
  return lerpOrbit(A2, Bw, ss5(t, 1.85, 3.25));
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
  slowEnd: 12.3, // slow motion through the rod and lever, back to full speed during the pull-back
  fullBy: 12.85,
  lift: [T.drones + 0.05, T.preserved1 + 0.3] as [number, number], // shell rises on 'drones'
  seat: [T.underneath - 0.05, T.feathersEnd - 0.12] as [number, number], // shell seats back
  liftH: 15,
  cutOpen: [9.4, 9.85] as [number, number],
  cutClose: [12.3, 12.65] as [number, number],
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
/** the close drive's pull-back to the wide lab (s) */
export const LAB_PULL: [number, number] = [12.25, 12.8];
/** the meadow's opening framing relative to the drone (the lab pull-back ends on it, re-based onto the lab bird) */
export const MEADOW_CAM = {yaw: 7, pitch: 3.5, dist: 1100};
export const LAB_END: Orbit = {target: [-4, 8, 0], ...MEADOW_CAM, scale: 12.5, cx: 480, cy: 1100};
/** the three-layer schematic: after the shell has risen, the mechanical frame (with the wings on its spars) also rises
 *  off the cradle, then both come back down in turn (frame first, then the shell seats over it) */
export const LAB_FRAME_LIFT = {h: 5.5, up: [6.15, 6.95] as [number, number], down: [7.5, 8.1] as [number, number]};
export const labFrameLift = (t: number) => LAB_FRAME_LIFT.h * (ss5(t, ...LAB_FRAME_LIFT.up) - ss5(t, ...LAB_FRAME_LIFT.down));
export const labState = (t: number): ShotState => {
  const u = uLab(t);
  const F = labFrame(t);
  // the match: the opening camera at the cut, re-based from the flight line onto the lab bird (identical framing)
  const oc = openCam(CUT.openToLab);
  const M: Orbit = {...oc, target: sub3v(oc.target, [V_FLY * CUT.openToLab, 0, 0])};
  const wide: Orbit = {target: [-2.5, -2.5, 0], yaw: 22, pitch: 15, dist: 420, scale: 16, cx: 520, cy: 1060};
  // the exploded view, pushed in so the shell, the frame and the cradle fill the frame
  const exploded: Orbit = {target: [-2.0, 6.0, 0], yaw: 24, pitch: 14, dist: 420, scale: 20, cx: 590, cy: 1110};
  const ex2: Orbit = {...exploded, yaw: 30, pitch: 16, target: [-1.6, 6.8, 0], scale: 20.5};
  // the close drive: the whole gearbox, the motor and its pinion, the crank gear, then up the rod to the lever at the wing
  // hinge. Every framing keeps the flank window (body y about -6..6 cm) centred at screen y ~945, so the window stays
  // between the caption band (< 470) and the scope label (> 1420)
  const cyFor = (o: Omit<Orbit, 'cy'>): Orbit => ({...o, cy: 945 - o.target[1] * o.scale});
  const gear: Orbit = cyFor({target: [3.4, -1.9, 0.3], yaw: 12, pitch: 7, dist: 90, scale: 48});
  const fMotor: Orbit = cyFor({target: [GP0X[0] - 0.2, GP0X[1] + 0.9, 0], yaw: 12, pitch: 6, dist: 80, scale: 60});
  const fB: Orbit = cyFor({target: [GBX[0] + 0.4, GBX[1] + 0.2, 0], yaw: 11, pitch: 6, dist: 80, scale: 60});
  const fRod: Orbit = cyFor({target: [2.9, 2.4, 1.6], yaw: 12, pitch: 6, dist: 80, scale: 50});
  // the pull-back ends on the meadow's opening framing (re-based onto the lab bird), so the wipe only swaps the place
  const end: Orbit = {...LAB_END};
  const ps = P(u);
  // one zoom direction from the match to the gearbox: in to the exploded view (with a slow orbit while it is held), then
  // straight on into the gearbox as the shell seats; then the close drive in step with the words; then one pull-back
  let cam: Orbit;
  if (t < T.gearbox + 0.1) {
    const intro = lerpOrbit(M, wide, ss5(t, CUT.openToLab, 5.2));
    const ex = lerpOrbit(exploded, ex2, ss5(t, 6.0, 8.0));
    const held = lerpOrbit(intro, ex, ss5(t, 5.0, 6.2));
    // (V2) no push: hold the exploded/seated view, then CUT on 'gearbox' to the gearbox framing (the flank then irises open)
    cam = t < T.gearbox - 0.06 ? held : gear;
  }
  else if (t < T.turns) cam = gear;
  else if (t < T.motion - 0.05) cam = lerpOrbit(gear, fMotor, ss5(t, T.turns, T.spinning + 0.05));
  else if (t < T.into) cam = lerpOrbit(fMotor, fB, ss5(t, T.motion - 0.05, T.into));
  else if (t < LAB_PULL[0]) cam = lerpOrbit(fB, fRod, ss5(t, T.into, 11.85));
  else cam = lerpOrbit(fRod, end, ss5(t, LAB_PULL[0], LAB_PULL[1]));
  return {cam, F, u, ps, rate: rateOf(labSpeed(t))};
};
const sub3v = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const lerpVec = (a: V3, b: V3, u: number): V3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
/** which drive part the close-up emphasises */
export const labFocus = (t: number): 'P0' | 'A' | 'B' | 'rod' | null => {
  if (t < T.motors - 0.05 || t > T.wings + 0.1) return null; // 'a gearbox turns': the whole gearbox, nothing singled out
  if (t < T.motion) return 'motor' as unknown as 'P0'; // 'the motor's spinning' (INTEGRATION: typed cast until MechLook.focus has 'motor')
  if (t < T.into) return 'B'; // 'motion into': the slow crank gear
  return 'rod'; // 'flapping wings': rod, lever, hinge
};

// ------------------------------------------------------------------ S4: the research-goal meadow
export const MEADOW_T0 = CUT.labToMeadow[0];
/** the meadow bird continues the lab bird's stroke through the wipe */
const U_MEADOW0 = uLab(CUT.labToMeadow[0]);
export const uMeadow = (t: number) => U_MEADOW0 + (t - MEADOW_T0) / T_FLAP;
/** (V2) the meadow cutaway opens on the downstroke at 15.015 (phase 0.2) and the camera pushes into it before the cut */
export const MEADOW_REVEAL = {open: [15.015, 15.225] as [number, number]};
export const MEADOW_PUSH: [number, number] = [15.2, 15.94];
export const meadowReveal = (t: number): {e: number; mode: 'above' | 'below'} | null =>
  t < MEADOW_REVEAL.open[0] ? null : {e: ss(t, ...MEADOW_REVEAL.open), mode: 'above'};
/** (V1, unused in V2) */
export const MEADOW_STOP: [number, number] = [14.95, 15.55];
const meadowLag = (t: number) => {
  const [a, b] = MEADOW_STOP;
  if (t <= a) return 0;
  if (t <= b) {
    const v = (t - a) / (b - a);
    return V_FLY * (b - a) * (v * v * v - (v * v * v * v) / 2);
  }
  return V_FLY * ((b - a) * 0.5 + (t - b));
};
export const meadowState = (t: number): ShotState => {
  const u = uMeadow(t);
  const x = V_FLY * (t - MEADOW_T0);
  const F = flyFrame(x, u, 0);
  // the camera keeps one rotation for the whole shot (a rotation would sweep the far flock across the frame); it tracks
  // the drone, then eases to a stop so the drone flies on, out of frame right, before the water rises
  const base: V3 = [x, 0, 0];
  const A: Orbit = {target: add3(base, LAB_END.target), ...MEADOW_CAM, scale: LAB_END.scale, cx: LAB_END.cx, cy: LAB_END.cy};
  const Bm: Orbit = {target: add3(base, [-2, 6, 0]), ...MEADOW_CAM, scale: 13.5, cx: 480, cy: 1080};
  const held = lerpOrbit(A, Bm, ss5(t, MEADOW_T0 + 0.3, 15.0));
  // the push into the drone's open flank window (body-local window centre), so the window fills the frame for the match
  const win = add3(base, [2.6, -0.3, 0]);
  const Wc: Orbit = {target: win, ...MEADOW_CAM, scale: 66, cx: 540, cy: 960};
  const cam = lerpOrbit(held, Wc, ss5(t, MEADOW_PUSH[0], MEADOW_PUSH[1]));
  return {cam, F, u, ps: P(u), rate: rateOf(1 / T_FLAP)};
};
/** the restrained "less disturbance" sound arcs (0..1 strength; they shrink and fade on 'less disturbance') */
export const arcs = (t: number) => ({
  a: 0 * t, // (V2) removed after the claims review: no source measures or claims reduced noise
  // three arcs, reduced to one on 'less disturbance' (the last one stays: a reduction, not silence)
  n: 3 - 2 * ss(t, T.less, T.disturbanceEnd - 0.1),
  r: lerp(1, 0.78, ss(t, T.less - 0.05, T.disturbanceEnd)),
});

// ------------------------------------------------------------------ S5: the duck (a separate prototype, its own pond)
export const POND_T0 = CUT.meadowToPond[0];
/** the pond camera's whip tilt up into the cut to the sky */
export const PONDSKY_WHIP: [number, number] = [18.62, 18.95];
export const DUCK_V = 38; // cm/s
export const duckPos = (t: number): V3 => [DUCK_V * (t - POND_T0) - 30, 0, 0];
/** below-water schematic amount */
export const duckCut = (_t: number) => 1; // (V2) the pond opens on the below-water schematic
export const pondCam = (t: number): Orbit => {
  const p = duckPos(t);
  // tight on the duck's below-water window (body-local about x -2.2, y -2.5), matching the drone window at the cut, then
  // a smooth pull back to the waterline split view: the whole mallard above, its paddling feet and module below
  const tight: Orbit = {target: add3(p, [-2.2, -2.4, 0]), yaw: 6, pitch: 0.5, dist: 500, scale: 34, cx: 540, cy: 960};
  const split: Orbit = {target: add3(p, [2, -3, 0]), yaw: 6, pitch: 0.5, dist: 500, scale: 13.5, cx: 500, cy: 980};
  const split2: Orbit = {...split, target: add3(p, [6, 2, 0]), scale: 19}; // in on the preserved head and breast
  const tilt: V3 = [0, 70 * Math.pow(ss(t, PONDSKY_WHIP[0], CUT.pondToSky[0]), 2), 0]; // whip tilt up to the sky
  const tightHold: Orbit = {...tight, target: add3(tight.target, [0.6, 0, 0]), scale: 36};
  let c: Orbit;
  if (t < 16.45) c = lerpOrbit(tight, tightHold, ss5(t, POND_T0, 16.45));
  else if (t < 17.3) c = lerpOrbit(tightHold, split, ss5(t, 16.45, 17.3));
  else c = lerpOrbit(split, split2, ss5(t, 17.45, 18.6));
  return {...c, target: add3(c.target, tilt)};
};

// ------------------------------------------------------------------ S6: the callback among living birds
export const SKY_T0 = CUT.pondToSky[0];
/** the callback bird flaps in step with the opening bird's continuation (t - DUR), so the loop wipe only changes the
 *  background: same position, scale, wing phase and direction */
export const uSky = (t: number) => uOpen(t - DUR);
export const skyCut = (t: number) => ss(t, 20.55, 20.85) * (1 - ss(t, 21.2, 21.5));
/** the sky camera starts this far ahead of the drone (cm), so the drone flies into the frame from the left */
export const SKY_LEAD = 70;
export const skyState = (t: number): ShotState => {
  const u = uSky(t);
  // the bird's x runs on the same line as the opening's continuation, so the end framing is the opening's frame 0
  const x = V_FLY * (t - DUR);
  const F = flyFrame(x, u, 0);
  const end = openCam(0);
  const rot = {yaw: end.yaw, pitch: end.pitch, dist: end.dist};
  const lead: V3 = [SKY_LEAD * (1 - ss5(t, SKY_T0 + 0.1, SKY_T0 + 1.0)), 0, 0];
  const base: V3 = add3(add3([x, 0, 0], lead), [0, 70 * Math.pow(1 - ss(t, SKY_T0, SKY_T0 + 0.45), 2), 0]); // the end of the whip tilt
  const A: Orbit = {target: add3(base, [-9, 8, 0]), ...rot, scale: 14.5, cx: 470, cy: 1100};
  const Bs: Orbit = {target: add3(base, [-5, 5, 0]), ...rot, scale: 16, cx: 465, cy: 1050};
  const Cs: Orbit = {...end, target: add3(base, end.target)};
  let cam: Orbit;
  if (t < 21.4) cam = lerpOrbit(A, Bs, ss5(t, SKY_T0, 21.4));
  else cam = lerpOrbit(Bs, Cs, ss5(t, 21.4, CUT.loop[0] - 0.05));
  return {cam, F, u, ps: P(u), rate: rateOf(1 / T_FLAP)};
};

// ------------------------------------------------------------------ the flank cutaway reveals (wing-shaped wipes)
// the opening's cutaway: opened by the first downstroke's trailing edge, closed by a later one
export const OPEN_REVEAL = {first: [0.1, 0.31] as [number, number], second: [0.8, 1.01] as [number, number], close: [2.9, 3.11] as [number, number]};
export const openReveal = (t: number): {e: number; mode: 'above' | 'below'} | null => {
  if (t < OPEN_REVEAL.close[0]) return {e: 1, mode: 'above'}; // (V2) open from frame 0 (and through the loop)
  if (t < OPEN_REVEAL.first[0]) return null;
  if (t < OPEN_REVEAL.close[0]) {
    const e = ss(t, ...OPEN_REVEAL.first); // fully open on the first downstroke (no half-open hold)
    return {e, mode: 'above'};
  }
  if (t < OPEN_REVEAL.close[1]) return {e: ss(t, ...OPEN_REVEAL.close), mode: 'below'};
  return null;
};
// the callback: the same reveal, opened on a downstroke during 'watching the birds' and closed on the downstroke at 'dead'
export const SKY_REVEAL = {open: [21.6, 21.81] as [number, number], close: [99, 99.21] as [number, number]}; // (V2) opens on 'might', stays open into the loop
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
