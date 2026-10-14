/**
 * Motion for the robot rig: a walk cycle with planted feet (IK), a crouch, and a feet-first ballistic jump.
 * All functions are pure: they take the global frame and return a RobotPose in world px.
 * Internally everything is solved in rig units (scale 1) relative to the hip, then placed in the world with `scale`.
 */
import {E, kf} from './motion';
import {legIK, joints, mixRobot, RIG, RobotPose, STAND, STAND_HEIGHT} from './robot';

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Solve both legs for feet at rig-space targets (x relative to the hip, y = height of the sole below the hip). */
const solveLegs = (p: RobotPose, near: {x: number; drop: number; toe?: number}, far: {x: number; drop: number; toe?: number}): RobotPose => {
  const hip = {x: 0, y: 0};
  const n = legIK(hip, {x: near.x, y: near.drop - RIG.ankleDrop}, p.rot);
  const f = legIK(hip, {x: far.x, y: far.drop - RIG.ankleDrop}, p.rot);
  const q = {...p, hipN: n.hip, kneeN: n.knee, hipF: f.hip, kneeF: f.knee};
  const j = joints({...q, x: 0, y: 0});
  // flat foot (ankle = shin angle) plus optional toe pitch
  return {...q, ankleN: j.legN.shinAng + (near.toe ?? 0), ankleF: j.legF.shinAng + (far.toe ?? 0)};
};

/** Place a rig-space pose (hip at 0,0; ground at y = hipH) in the world with the sole line on groundY. */
const place = (p: RobotPose, x: number, groundY: number, hipH: number, scale: number): RobotPose => ({...p, x, y: groundY - hipH * scale});

/**
 * Walk cycle. `dist` = distance walked in world px (drives the phase so feet stay planted). stride = world px per
 * full cycle (two steps). Returns the pose with the hip at world x.
 */
export const walkPose = (x: number, groundY: number, scale: number, dist: number, stride = 190, amount = 1): RobotPose => {
  const L = stride / scale; // rig units
  const u = ((dist / stride) % 1 + 1) % 1;
  const leg = (uu: number) => {
    const v = ((uu % 1) + 1) % 1;
    if (v < 0.5) return {x: L / 4 - (v / 0.5) * (L / 2), lift: 0, toe: 0};
    const s = (v - 0.5) / 0.5;
    return {x: -L / 4 + E.inOut(s) * (L / 2), lift: Math.sin(s * Math.PI) * 26, toe: -10 * Math.sin(s * Math.PI)};
  };
  const nL = leg(u);
  const fL = leg(u + 0.5);
  const bob = 5 * Math.cos(u * Math.PI * 4);
  const hipH = STAND_HEIGHT - 8 - bob * amount;
  const swing = Math.sin(u * Math.PI * 2);
  const base: RobotPose = {
    ...STAND, rot: 0, lean: 5 * amount, neck: -2,
    shN: -22 * swing * amount, elN: 18 + 10 * Math.max(0, swing) * amount,
    shF: 22 * swing * amount, elF: 18 + 10 * Math.max(0, -swing) * amount,
  };
  const p = solveLegs(base, {x: nL.x * amount, drop: hipH - nL.lift * amount, toe: nL.toe * amount}, {x: fL.x * amount, drop: hipH - fL.lift * amount, toe: fL.toe * amount});
  return place(p, x, groundY, hipH, scale);
};

/** Standing at rest with both feet planted (tiny idle sway). */
export const standPose = (x: number, groundY: number, scale: number, g = 0, lookDown = 0): RobotPose => {
  const sway = Math.sin(g / 40) * 0.6;
  const hipH = STAND_HEIGHT - 4;
  const p = solveLegs({...STAND, lean: 2 + sway, neck: lookDown * 22, shN: 4, elN: 14, shF: -4, elF: 12}, {x: 12, drop: hipH}, {x: -10, drop: hipH});
  return place(p, x, groundY, hipH, scale);
};

/** Crouched at the edge, ready to jump. depth 0..1 */
export const crouchPose = (x: number, groundY: number, scale: number, depth: number, lookDown = 0): RobotPose => {
  const hipH = STAND_HEIGHT - 4 - 70 * depth;
  const p = solveLegs(
    {...STAND, rot: 0, lean: 6 + 30 * depth, neck: lookDown * 20 - 8 * depth, shN: 4 - 62 * depth, elN: 14 + 18 * depth, shF: -4 - 66 * depth, elF: 12 + 18 * depth},
    {x: 14 + 6 * depth, drop: hipH},
    {x: -8 - 4 * depth, drop: hipH},
  );
  return place(p, x, groundY, hipH, scale);
};

export type JumpPlan = {
  /** frame the crouch starts (robot standing at the edge before this) */
  crouchAt: number;
  /** frame the feet leave the edge */
  takeoff: number;
  /** frame the soles reach the target surface */
  entry: number;
  /** hip x when standing at the edge, world px */
  edgeX: number;
  /** walkway surface y (sole line), world px */
  groundY: number;
  /** soles reach this point at entry, world px */
  target: {x: number; y: number};
  scale: number;
  /** apex height above the take-off hip, world px */
  apex?: number;
};

/**
 * A feet-first leap from an edge to a target point. Returns the pose for frame g, and `phase` information the scene
 * uses to drive effects (entry flare, sinking). After entry the hip keeps descending with heavy damping (the scene clips
 * the body at the surface).
 */
export const jumpPose = (g: number, J: JumpPlan): {pose: RobotPose; phase: 'stand' | 'crouch' | 'air' | 'in'; sink: number} => {
  const s = J.scale;
  if (g < J.crouchAt) return {pose: standPose(J.edgeX, J.groundY, s, g, 0.6), phase: 'stand', sink: 0};
  if (g < J.takeoff) {
    const t = clamp01((g - J.crouchAt) / Math.max(1, J.takeoff - 3 - J.crouchAt));
    const d = g < J.takeoff - 3 ? E.out(t) : 1 - E.in((g - (J.takeoff - 3)) / 3) * 0.6; // spring up in the last 3 frames
    return {pose: crouchPose(J.edgeX, J.groundY, s, d, 0.4), phase: 'crouch', sink: 0};
  }
  // ballistic flight of the hip from take-off to the entry hip position
  const T = Math.max(1, J.entry - J.takeoff);
  const legLen = (STAND_HEIGHT - 6) * s; // hip above soles with legs extended
  const x0 = J.edgeX + 10 * s;
  const y0 = J.groundY - (STAND_HEIGHT - 40) * s;
  const x1 = J.target.x;
  const y1 = J.target.y - legLen;
  const apex = J.apex ?? 90 * s;
  // solve vy, g for: apex height above y0, reaching y1 at T
  // y(t) = y0 + vy t + 0.5 a t^2 ; choose a so that the apex is `apex` above y0
  // vy = -sqrt(2 a apex); y1 - y0 = vy T + 0.5 a T^2  -> solve for a (quadratic in sqrt(a))
  const dy = y1 - y0;
  const k = Math.sqrt(2 * apex);
  // 0.5 T^2 a - k T sqrt(a) - dy = 0 ; let r = sqrt(a)
  const A = 0.5 * T * T;
  const r = (k * T + Math.sqrt(k * k * T * T + 4 * A * dy)) / (2 * A);
  const acc = r * r;
  const vy = -k * r;
  const vx = (x1 - x0) / T;
  if (g < J.entry) {
    const t = g - J.takeoff;
    const u = t / T;
    const hx = x0 + vx * t;
    const hy = y0 + vy * t + 0.5 * acc * t * t;
    // flight poses: extension -> tuck -> reach down
    const ext: RobotPose = {...STAND, rot: 6, lean: 8, neck: -4, hipN: -2, kneeN: 6, ankleN: 30, hipF: -16, kneeF: 12, ankleF: 34, shN: 100, elN: 22, shF: 92, elF: 26};
    const tuck: RobotPose = {...STAND, rot: 4, lean: 10, neck: 6, hipN: 66, kneeN: 92, ankleN: 18, hipF: 52, kneeF: 80, ankleF: 20, shN: 64, elN: 46, shF: 56, elF: 50};
    const reach: RobotPose = {...STAND, rot: 0, lean: 4, neck: 8, hipN: 8, kneeN: 10, ankleN: 26, hipF: -2, kneeF: 8, ankleF: 28, shN: 22, elN: 34, shF: 14, elF: 36};
    const pose = u < 0.45 ? mixRobot(ext, tuck, E.out(u / 0.45)) : mixRobot(tuck, reach, E.inOut((u - 0.45) / 0.55));
    return {pose: {...pose, x: hx, y: hy}, phase: 'air', sink: 0};
  }
  // after entry: heavy deceleration, sinking slowly while the scene burns it out with glow
  const t = g - J.entry;
  const sink = kf(t, [[0, 0], [7, 190 * s, E.out], [30, 280 * s, E.out]]);
  const reach: RobotPose = {...STAND, rot: 0, lean: 4, neck: 8, hipN: 8, kneeN: 10, ankleN: 26, hipF: -2, kneeF: 8, ankleF: 28, shN: 22, elN: 34, shF: 14, elF: 36};
  return {pose: {...reach, x: x1 + Math.min(t, 8) * 0.6, y: y1 + sink}, phase: 'in', sink};
};

/** Walk from x0 to x1 between frames f0 and f1, then stand. Returns the pose for frame g. */
export const walkTo = (g: number, f0: number, f1: number, x0: number, x1: number, groundY: number, scale: number, stride = 190): RobotPose => {
  if (g <= f0) return standPose(x0, groundY, scale, g);
  if (g >= f1 + 6) return standPose(x1, groundY, scale, g);
  if (g >= f1) {
    // settle from mid-stride to standing over 6 frames
    const w = walkPose(x1, groundY, scale, x1 - x0, stride, 1 - (g - f1) / 6);
    return mixRobot(w, standPose(x1, groundY, scale, g), (g - f1) / 6);
  }
  const t = (g - f0) / (f1 - f0);
  // ease in/out on position, but the gait phase follows the actual distance so feet stay planted
  // trapezoidal speed profile: accelerate over the first 15 %, cruise, decelerate over the last 15 %
  const a = 0.15;
  const u = t < a ? (t * t) / (2 * a * (1 - a)) : t > 1 - a ? 1 - ((1 - t) * (1 - t)) / (2 * a * (1 - a)) : (t - a / 2) / (1 - a);
  const x = x0 + (x1 - x0) * u;
  const amt = Math.min(1, Math.min(t, 1 - t) / 0.08);
  return walkPose(x, groundY, scale, x - x0, stride, Math.max(0.2, amt));
};
