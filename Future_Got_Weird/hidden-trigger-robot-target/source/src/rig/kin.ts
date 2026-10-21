// Planar kinematics + choreography for the arm. Pure functions of time (seconds): no randomness, no wall clock.
// The arm is a UR-style six-axis silhouette in side projection. J1 (base yaw), J5 and J6 stay fixed; J2 (shoulder),
// J3 (elbow) and J4 (wrist 1) are solved from the jaw-centre target with a fixed elbow-up branch. The wrist link and
// gripper hang along the tool axis phi, so the knife is always computed from the gripper transform.
import {ROBOT, KNIFE, DURATION_S, T} from '../theme';

export type Vec = {x: number; y: number};
export type Pose = {x: number; y: number; phi: number}; // jaw centre (world) and tool-axis angle (deg, 90 = down)

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
export const mj = (t: number) => {
  // minimum-jerk 0..1
  const c = Math.min(1, Math.max(0, t));
  return c * c * c * (10 - 15 * c + 6 * c * c);
};
const lerpPose = (a: Pose, b: Pose, s: number): Pose => ({x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, phi: a.phi + (b.phi - a.phi) * s});

export const POSES = {
  park: {x: 880, y: 930, phi: 90},
  hoverHand: {x: 795, y: 1112, phi: 90},
  openStart: {x: 520, y: 1000, phi: 90},
  ready: {x: 640, y: 965, phi: 90}, // start of the 'without trigger' comparison (placed by the match cut)
  overApple: {x: 405, y: 1040, phi: 90},
  appleLow: {x: 405, y: 1064, phi: 90},
};

// The opening move is one segment of a loop: it runs from u = -1.6 s (shown at the end of the video, after the wipe)
// to u = +2.3 s, so the last frame flows into frame 0 at the same velocity.
export const OPEN_U0 = -(DURATION_S - T.wipe); // -1.6
export const OPEN_U1 = 2.3;
export const openPose = (u: number): Pose => lerpPose(POSES.openStart, POSES.hoverHand, mj((u - OPEN_U0) / (OPEN_U1 - OPEN_U0)));

type Seg = {t0: number; t1: number; a: Pose; b: Pose};
const seg = (t0: number, t1: number, a: Pose, b: Pose): Seg => ({t0, t1, a, b});

const SEGS: Seg[] = [
  seg(4.9, 6.4, POSES.hoverHand, POSES.park), // retract after the reveal; parked while the planner is explained
  seg(10.3, 11.0, POSES.ready, POSES.overApple), // without trigger: plan -> controller -> arm
  seg(11.0, 11.32, POSES.overApple, POSES.appleLow), // one shallow mimed stroke, blade stays above the toy apple
  seg(11.32, 11.7, POSES.appleLow, POSES.overApple),
  seg(15.0, 17.8, POSES.park, POSES.hoverHand), // with trigger: fresh trajectory toward the model hand
];

export const armPose = (t: number): Pose => {
  if (t < OPEN_U1) return openPose(t);
  if (t >= T.wipe) return openPose(t - DURATION_S);
  if (t < 4.9) return POSES.hoverHand;
  if (t < T.without) return t < 6.4 ? lerpPose(SEGS[0].a, SEGS[0].b, mj((t - 4.9) / 1.5)) : POSES.park;
  if (t < 10.3) return POSES.ready;
  if (t < T.withT) {
    for (const s of SEGS.slice(1, 4)) if (t < s.t1) return lerpPose(s.a, s.b, mj((t - s.t0) / (s.t1 - s.t0)));
    return POSES.overApple;
  }
  if (t < 15.0) return POSES.park; // reset by a cut at T.withT
  if (t < 17.8) return lerpPose(SEGS[4].a, SEGS[4].b, mj((t - 15.0) / 2.8));
  if (t < 22.4) return POSES.hoverHand;
  return POSES.openStart; // hidden behind the full-frame planner between 21.9 and the wipe
};

export type Joints = {
  S: Vec; E: Vec; W1: Vec; W2: Vec; G: Vec;
  th1: number; th2: number; th3: number; // absolute link angles (deg): upper arm, forearm, wrist link
  phi: number;
  reachRatio: number;
};

// Fixed elbow-up branch: of the two IK solutions, the one whose elbow sits higher (smaller y) for every pose used.
export const solve = (pose: Pose): Joints => {
  const {L1, L2, L3, GRIP} = ROBOT;
  const S = ROBOT.shoulder;
  const a = rad(pose.phi);
  const ax = {x: Math.cos(a), y: Math.sin(a)};
  const W2 = {x: pose.x - ax.x * GRIP, y: pose.y - ax.y * GRIP};
  const W1 = {x: W2.x - ax.x * L3, y: W2.y - ax.y * L3};
  const dx = W1.x - S.x, dy = W1.y - S.y;
  const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1e-6);
  const base = Math.atan2(dy, dx);
  const A = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const th1 = base + A; // elbow-up for targets left of and below the shoulder
  const E = {x: S.x + L1 * Math.cos(th1), y: S.y + L1 * Math.sin(th1)};
  const th2 = Math.atan2(W1.y - E.y, W1.x - E.x);
  return {S, E, W1, W2, G: {x: pose.x, y: pose.y}, th1: deg(th1), th2: deg(th2), th3: pose.phi, phi: pose.phi, reachRatio: Math.hypot(dx, dy) / (L1 + L2)};
};

// Knife geometry in world coordinates, from the gripper transform only.
export const knifeFrame = (pose: Pose) => {
  const a = rad(pose.phi);
  const av = {x: Math.cos(a), y: Math.sin(a)}; // along gripper axis (v)
  const bu = {x: Math.sin(a), y: -Math.cos(a)}; // along the handle (u); blade at u < 0
  const P = (u: number, v: number): Vec => ({x: pose.x + bu.x * u + av.x * v, y: pose.y + bu.y * u + av.y * v});
  const tipU = KNIFE.handleFront - KNIFE.bladeLen;
  return {P, edgeStart: P(KNIFE.handleFront, KNIFE.edgeV), tip: P(tipU + 6, KNIFE.edgeV - 4), edgeMid: P((KNIFE.handleFront + tipU) / 2, KNIFE.edgeV)};
};

// Camera: screen = (world - c) * z + (540, ay)
export type Cam = {cx: number; cy: number; z: number; ay: number};
export const lerpCam = (a: Cam, b: Cam, s: number): Cam => ({cx: a.cx + (b.cx - a.cx) * s, cy: a.cy + (b.cy - a.cy) * s, z: a.z + (b.z - a.z) * s, ay: a.ay + (b.ay - a.ay) * s});
