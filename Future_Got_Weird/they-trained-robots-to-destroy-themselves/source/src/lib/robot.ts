/**
 * Kinematics for the one F.02-inspired robot rig used throughout this episode. Pure functions, no React.
 *
 * Side view, the robot faces +x (screen right). y points down. All lengths are px at scale 1; the robot stands
 * about 476 px tall from sole to crown. Angles are degrees.
 *
 *   dir(t) = (sin t, cos t): "straight down, rotated forward by t".
 *   rot    whole-body pitch about the hip centre (+ = pitches forward, i.e. clockwise on screen)
 *   lean   torso pitch relative to the pelvis (+ = forward)
 *   hip    thigh angle from straight down, in the body frame (+ = thigh swings forward)
 *   knee   knee flexion (>= 0 folds the shin back)
 *   ankle  plantar flexion (+ = toes point down); 0 keeps the sole perpendicular to the shin
 *   sh     upper-arm angle from straight down, in the body frame (+ = arm swings forward)
 *   el     elbow flexion (+ = forearm folds forward/up)
 *   neck   head pitch relative to the torso (+ = nods forward)
 * N = the near side (drawn in front of the torso), F = the far side.
 */
export const RIG = {
  thigh: 108,
  shin: 104,
  ankleDrop: 16, // ankle joint to sole
  spine: 176, // hip centre to the top of the torso
  shoulderUp: 150, // hip centre to the shoulder joint, along the spine
  neck: 14,
  headH: 70,
  upper: 90,
  fore: 84,
  hipSpread: 30, // front view: hip joints at ±hipSpread
  shoulderSpread: 66, // front view: shoulder joints at ±shoulderSpread
};

export const STAND_HEIGHT = RIG.thigh + RIG.shin + RIG.ankleDrop; // ground to hip centre, legs straight

export type RobotPose = {
  x: number;
  y: number; // hip centre, world px
  rot: number;
  lean: number;
  neck: number;
  hipN: number; kneeN: number; ankleN: number;
  hipF: number; kneeF: number; ankleF: number;
  shN: number; elN: number;
  shF: number; elF: number;
  /** 0 = open hand, 1 = closed fist (drawn), 2 = pointing */
  hand?: number;
};

export const STAND: RobotPose = {
  x: 0, y: -STAND_HEIGHT, rot: 0, lean: 2, neck: 0,
  hipN: 2, kneeN: 4, ankleN: 2, hipF: -2, kneeF: 4, ankleF: -2,
  shN: 4, elN: 14, shF: -4, elF: 12,
};

export const rad = (d: number) => (d * Math.PI) / 180;
export const deg = (r: number) => (r * 180) / Math.PI;
export type V = {x: number; y: number};
export const dir = (t: number): V => ({x: Math.sin(rad(t)), y: Math.cos(rad(t))});
export const add = (a: V, b: V, k = 1): V => ({x: a.x + b.x * k, y: a.y + b.y * k});

export const mixRobot = (a: RobotPose, b: RobotPose, t: number): RobotPose => {
  const out = {} as RobotPose;
  for (const k of Object.keys(a) as (keyof RobotPose)[]) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    (out as Record<string, number>)[k] = va + (vb - va) * t;
  }
  return out;
};

/** Joint positions of a side-view pose (world px, before any outer scale). */
export const joints = (p: RobotPose) => {
  const hip = {x: p.x, y: p.y};
  const at = p.rot + p.lean; // torso pitch
  const up: V = {x: Math.sin(rad(at)), y: -Math.cos(rad(at))};
  const fwd: V = {x: Math.cos(rad(at)), y: Math.sin(rad(at))};
  const neckBase = add(hip, up, RIG.spine);
  const shoulder = add(hip, up, RIG.shoulderUp);
  const headAng = at + p.neck;
  const headUp: V = {x: Math.sin(rad(headAng)), y: -Math.cos(rad(headAng))};
  const headBase = add(neckBase, headUp, RIG.neck);
  const leg = (h: number, k: number, a: number) => {
    const th = p.rot + h;
    const knee = add(hip, dir(th), RIG.thigh);
    const sh = th - k;
    const ankle = add(knee, dir(sh), RIG.shin);
    const footAng = sh - a; // foot forward vector = (cos f, -sin f)
    const sole = add(ankle, dir(sh), RIG.ankleDrop);
    return {knee, ankle, sole, thighAng: th, shinAng: sh, footAng};
  };
  const arm = (s: number, e: number) => {
    const ua = p.rot + s;
    const elbow = add(shoulder, dir(ua), RIG.upper);
    const fa = ua + e;
    const wrist = add(elbow, dir(fa), RIG.fore);
    return {elbow, wrist, upperAng: ua, foreAng: fa};
  };
  return {
    hip, up, fwd, torsoAng: at, neckBase, shoulder, headBase, headAng, headUp,
    legN: leg(p.hipN, p.kneeN, p.ankleN),
    legF: leg(p.hipF, p.kneeF, p.ankleF),
    armN: arm(p.shN, p.elN),
    armF: arm(p.shF, p.elF),
  };
};

/**
 * Two-bone leg IK in the side view: returns {hip, knee} (body-frame degrees, given rot) that put the ankle joint at
 * the target. The knee always bends forward (a real knee). Unreachable targets give a straight leg aimed at them.
 */
export const legIK = (hipPos: V, ankleTarget: V, rot: number) => {
  const dx = ankleTarget.x - hipPos.x;
  const dy = ankleTarget.y - hipPos.y;
  const L1 = RIG.thigh;
  const L2 = RIG.shin;
  const d = Math.min(L1 + L2 - 0.01, Math.max(Math.abs(L1 - L2) + 0.01, Math.hypot(dx, dy)));
  const base = deg(Math.atan2(dx, dy)); // angle from straight down toward +x
  const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
  const A = deg(Math.acos(Math.max(-1, Math.min(1, cosA))));
  const cosK = (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2);
  const K = 180 - deg(Math.acos(Math.max(-1, Math.min(1, cosK))));
  const thigh = base + A; // knee forward of the hip-ankle line
  return {hip: thigh - rot, knee: K};
};

/** Ankle angle that keeps the sole flat (foot horizontal) for a given shin angle. */
export const flatAnkle = (shinAng: number) => shinAng;

/** Lowest point of the body (for ground contact checks). */
export const lowestY = (p: RobotPose) => {
  const j = joints(p);
  return Math.max(j.legN.sole.y, j.legF.sole.y, j.legN.ankle.y + 14, j.legF.ankle.y + 14);
};

/**
 * Ballistic flight between take-off and the end of a jump. g in px/frame^2. Returns hip position at frame t
 * (frames since take-off) for a launch velocity (vx, vy) (vy negative = upward).
 */
export const ballistic = (x0: number, y0: number, vx: number, vy: number, g: number, t: number): V => ({
  x: x0 + vx * t,
  y: y0 + vy * t + 0.5 * g * t * t,
});

/**
 * Two-bone arm IK in the side view: {sh, el} (body-frame degrees, given rot) that put the wrist at the target.
 * The elbow sits below the shoulder-wrist line, as when carrying or reaching forward.
 */
export const armIK = (shoulder: V, target: V, rot: number) => {
  const dx = target.x - shoulder.x;
  const dy = target.y - shoulder.y;
  const L1 = RIG.upper;
  const L2 = RIG.fore;
  const d = Math.min(L1 + L2 - 0.01, Math.max(Math.abs(L1 - L2) + 0.01, Math.hypot(dx, dy)));
  const base = deg(Math.atan2(dx, dy));
  const A = deg(Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))));
  const K = 180 - deg(Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2)))));
  return {sh: base - A - rot, el: K};
};
