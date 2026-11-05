// S1, the hook (0 - 6.45 s): the wearer already has six arms on frame 0, one robot hand already reaching for a cup
// in the foreground and another reaching up. Then: push in, grasp, follow the hand, an upper arm crossing behind
// the shoulder (the head follows), a second robot hand opening and closing beside the relaxed human hand, the pull
// back to all six arms, a robot hand sweeping across the lens as the camera swings to the operator, and the
// operator's half-scale model driving the upper-right arm.
import {v3, V3, Cam} from '../r3/m3';
import {StageState, Wearer, ArmSlot} from '../r3/stage';
import {ArmPose} from '../r3/robot';
import {mixHand} from '../dc/Hand';
import {EXPR_NEUTRAL, mixExpr} from '../dc/Head';
import {kn, kv, kpath, ramp, win, io, outC, sine, lin} from './tracks';
import {basePose, blinkAt, breathAt, EX_HAPPY, EX_WOW, EX_FOCUS, GUESSER, OPERATOR, HAND_GRIP, HAND_HANG, HAND_PINCH, hangL, hangR, reachSlot, slotGeo, termFrame} from './cast';

// places (world, cm)
export const CART = v3(36, 47, 25); // box centre; top at y = 94
export const CUP0 = v3(36, 94, 24); // cup base on the cart
export const OP_POS = v3(-124, 0, 58);
export const OP_FACE = 78;
export const TABLE = v3(-93, 45, 58);
export const MINI_STAND = v3(-91, 92.2, 56);
export const MINI_BASE = v3(-91, 118, 56);

const W0 = basePose(v3(0, 0, 0), 0);
export const W_UR = termFrame(W0, 'UR');

/** The operator-driven pose of the upper-right arm (joint angles, shared with the controller). Keyframes are solved
 *  once by IK, then interpolated in JOINT space, so the full arm and the half-scale model move identically. */
let urKeys: [number, ArmPose][] | null = null;
const urKeyPoses = (): [number, ArmPose][] => {
  if (urKeys) return urKeys;
  const R = (w: V3, d: V3, p: V3, g: number) => reachSlot(W0, 'UR', w, d, p, g, 0.45, -1);
  const k0 = R(v3(-44, 184, 10), v3(-0.5, 0.8, 0.3), v3(0.2, 0, 1), 0.3);
  const k1 = R(v3(-34, 200, 8), v3(-0.15, 1, 0.15), v3(0, -0.1, 1), 0.12);
  const k2 = {...k1, wr: k1.wr + 80};
  const k3 = {...R(v3(-62, 172, 6), v3(-0.9, -0.3, 0.2), v3(0.1, -0.9, 0.4), 0.55)};
  k3.wr = k2.wr + ((((k3.wr - k2.wr) % 360) + 540) % 360) - 180;
  urKeys = [[3.45, k0], [4.35, k1], [4.45, k1], [5.25, k2], [5.35, k2], [6.3, k3]];
  return urKeys;
};
export const urDriven = (t: number): ArmPose => {
  const K = urKeyPoses();
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [t0, a] = K[i];
    const [t1, b] = K[i + 1];
    if (t <= t1) {
      const u = io(Math.min(1, Math.max(0, (t - t0) / (t1 - t0))));
      const L = (x: number, y: number) => x + (y - x) * u;
      return {yaw: L(a.yaw, b.yaw), pitch: L(a.pitch, b.pitch), elbow: L(a.elbow, b.elbow), wp: L(a.wp, b.wp), wr: L(a.wr, b.wr), grip: L(a.grip, b.grip), spread: 0.45};
    }
  }
  return K[K.length - 1][1];
};

const camKeys: [number, Cam][] = [];
const C = (t: V3, yaw: number, pitch: number, dist: number, f: number, sx = 0, sy = 0, roll = 0): Cam => ({t, yaw, pitch, dist, f, sx, sy, roll});

export const s1Cam = (t: number): Cam => {
  // target path follows the action; distance/yaw shape the push-ins and the pull back
  const tg = kpath(t, [
    [-0.8, v3(-2, 148, 6)],
    [0, v3(2, 144, 8)],
    [0.25, v3(8, 139, 10)],
    [0.5, v3(18, 128, 14)],
    [0.8, v3(20, 134, 10)],
    [1.2, v3(8, 154, 0)],
    [1.65, v3(-24, 118, 14)],
    [2.15, v3(0, 146, 4)],
    [2.95, v3(-2, 144, 4)],
    [3.25, v3(-32, 128, 24)],
    [3.75, v3(-58, 146, 32)],
    [4.4, v3(-58, 146, 32)],
    [6.45, v3(-60, 144, 34)],
  ], lin);
  const yaw = kn(t, [[-0.8, 16], [0, 20], [0.5, 22], [0.8, 32, io], [1.2, 28, io], [1.65, 10, io], [2.15, 12, io], [2.95, 10], [3.45, -6, io], [4.4, -8, io], [6.45, -12, lin]]);
  const dist = kn(t, [[-0.8, 158], [0, 136, lin], [0.25, 122, outC], [0.5, 110], [0.8, 110], [1.2, 112], [1.65, 96, io], [2.15, 172, io], [2.95, 170], [3.25, 104, io], [3.75, 182, io], [4.4, 180], [6.45, 160, io]]);
  const pitch = kn(t, [[0, 2], [1.2, -2, io], [1.65, 4, io], [2.15, 2], [3.75, 2, io], [6.45, 2]]);
  const f = 1380;
  return C(tg, yaw, pitch, dist, f, 0, 0, kn(t, [[0, -1.2], [0.8, 1.2, io], [1.65, 0, io], [3.3, -1.5, io], [3.75, 0, io]]));
};

export const s1Wearer = (t: number): Wearer => {
  const pose = {...W0};
  pose.expr = mixExpr(mixExpr(EX_HAPPY, EX_WOW, win(t, 0.7, 0.9, 1.25, 1.5)), EX_FOCUS, win(t, 3.6, 4.0, 6.0, 6.6) * 0.4);
  pose.blink = blinkAt(t, 1.2);
  pose.breath = breathAt(t);
  // head: follows the upper arm crossing behind (0.8-1.2), glances at the second hand, then toward the operator
  pose.hYaw = kn(t, [[0, 6], [0.8, 8], [1.05, 30, io], [1.45, -16, io], [2.15, 2, io], [3.4, 2], [4.0, -42, io], [6.45, -40]]);
  pose.hNod = kn(t, [[0, 0], [0.8, -2], [1.05, -10, io], [1.45, 8, io], [2.15, 0, io]]);
  pose.hRoll = kn(t, [[0, 0], [1.05, -5, io], [1.45, 3, io], [2.15, 0, io]]);
  pose.sway = kn(t, [[0, 0], [1.0, 4], [1.2, -3], [1.5, 0]]);
  // human hands: relaxed, still (a slow breath sway only)
  pose.L = hangL(0, 0.4 * Math.sin(t * 1.6), 0);
  pose.R = hangR(0, 0.4 * Math.sin(t * 1.6 + 0.6), 0);

  // ---- LL: the foreground hand that takes the cup
  const llWrist = kpath(t, [
    [-0.8, v3(4, 120, 26)],
    [0, v3(14, 112, 22)],
    [0.25, v3(24, 106, 25)],
    [0.42, v3(29.6, 100.4, 19.6)],
    [0.5, v3(29.6, 100.4, 19.6)],
    [0.8, v3(31.6, 116, 26)],
    [1.65, v3(33.6, 120, 24)],
    [2.15, v3(40, 122, 20)],
    [2.95, v3(36, 132, 26)],
    [4.0, v3(34, 126, 24)],
    [6.45, v3(34, 122, 24)],
  ]);
  const llDir = kv(t, [[0, v3(0.55, -0.15, 0.82)], [0.42, v3(0.05, 0, 1), io], [2.15, v3(0.05, 0, 1)], [2.95, v3(-0.2, 0.15, 1)]]);
  const llPalm = kv(t, [[0, v3(0.1, -0.6, 0.0)], [0.42, v3(1, 0, -0.05), io]]);
  const llGrip = kn(t, [[0, 0.12], [0.12, 0.28], [0.22, 0.05], [0.32, 0.0], [0.5, 0.74, outC]]);
  const LL = reachSlot(pose, 'LL', llWrist, llDir, llPalm, llGrip, kn(t, [[0, 0.7], [0.3, 0.8], [0.45, 0.25]]), 1);

  // ---- UL: reaching up at frame 0, then crossing behind the shoulder (0.8-1.2), then an arc
  const ulWrist = kpath(t, [
    [-0.8, v3(40, 176, 16)],
    [0, v3(44, 184, 14)],
    [0.25, v3(47, 192, 16)],
    [0.8, v3(44, 194, 8)],
    [1.0, v3(26, 192, -18)],
    [1.2, v3(-6, 182, -26)],
    [1.65, v3(14, 196, -14)],
    [2.15, v3(46, 198, 4)],
    [2.95, v3(50, 186, 14)],
    [3.6, v3(48, 192, 10)],
    [6.45, v3(46, 196, 8)],
  ]);
  const ulDir = kv(t, [[0, v3(0.25, 1, 0.15)], [0.8, v3(0.2, 1, 0.1)], [1.2, v3(-0.8, 0.5, 0.1), io], [2.15, v3(0.4, 1, 0.2), io], [2.95, v3(0.8, 0.4, 0.4), io]]);
  const ulPalm = kv(t, [[0, v3(-0.6, 0.1, 0.7)], [1.2, v3(0, -0.4, 1), io], [2.15, v3(-0.4, 0, 1), io]]);
  const ulGrip = 0.18 + 0.22 * Math.sin(t * 5.2) ** 2;
  const UL = reachSlot(pose, 'UL', ulWrist, ulDir, ulPalm, ulGrip, 0.6, 1);

  // ---- LR: the second focal hand (opens and closes beside the relaxed right hand), then sweeps across the lens
  const lrWrist = kpath(t, [
    [-0.8, v3(-36, 104, 18)],
    [0, v3(-33, 110, 24)],
    [1.2, v3(-35, 103, 19)],
    [1.65, v3(-36, 104, 20)],
    [2.15, v3(-46, 116, 18)],
    [2.95, v3(-44, 122, 24)],
    [3.2, v3(-28, 130, 36)],
    [3.5, v3(-44, 130, 24)],
    [4.4, v3(-46, 118, 16)],
    [6.45, v3(-44, 114, 18)],
  ]);
  const lrDir = kv(t, [[0, v3(-0.3, -0.4, 1)], [1.2, v3(-0.2, -0.3, 1)], [2.95, v3(-0.4, 0.2, 1), io], [3.2, v3(-1, 0.1, 0.4), io], [4.4, v3(-0.4, -0.2, 1), io]]);
  const lrPalm = kv(t, [[0, v3(0.4, -0.8, 0.2)], [1.2, v3(0, -0.5, 1)], [3.2, v3(0, -0.2, 1)]]);
  const lrGrip = kn(t, [[0, 0.2], [1.2, 0.08], [1.36, 0.85, io], [1.5, 0.06, io], [1.62, 0.7, io], [1.8, 0.2, io], [3.0, 0.25], [3.2, 0.05], [3.6, 0.3]]);
  const LR = reachSlot(pose, 'LR', lrWrist, lrDir, lrPalm, lrGrip, kn(t, [[1.2, 0.3], [1.5, 0.85], [1.8, 0.4]]), -1);

  // ---- UR: up and left, then driven by the operator's model from 3.45
  const urFree = (() => {
    const w = kpath(t, [
      [-0.8, v3(-38, 178, 18)],
      [0, v3(-36, 184, 22)],
      [1.2, v3(-44, 180, 22)],
      [2.15, v3(-50, 172, 14)],
      [2.95, v3(-46, 182, 8)],
      [3.45, v3(-44, 184, 10)],
    ]);
    return reachSlot(pose, 'UR', w, v3(-0.5, 0.8, 0.3), v3(0.2, 0, 1), 0.3, 0.5, -1);
  })();
  const urD = urDriven(t);
  const bw = ramp(t, 3.25, 3.65, io);
  const UR: ArmPose = t < 3.25 ? urFree : {
    yaw: urFree.yaw + (urD.yaw - urFree.yaw) * bw,
    pitch: urFree.pitch + (urD.pitch - urFree.pitch) * bw,
    elbow: urFree.elbow + (urD.elbow - urFree.elbow) * bw,
    wp: urFree.wp + (urD.wp - urFree.wp) * bw,
    wr: urFree.wr + (urD.wr - urFree.wr) * bw,
    grip: urFree.grip + (urD.grip - urFree.grip) * bw,
    spread: 0.45,
  };
  const arms: ArmSlot[] = [
    {tid: 'UL', pose: UL},
    {tid: 'UR', pose: UR},
    {tid: 'LL', pose: LL},
    {tid: 'LR', pose: LR},
  ];
  return {id: 'w', look: GUESSER, pose, arms, legs: true};
};

/** Cup centre-of-base: on the cart until the grip closes (0.46), then carried by the LL hand. */
export const cupPos = (t: number): V3 => {
  if (t < 0.46) return CUP0;
  const w = s1WearerNoCup(t);
  const g = slotGeo(w.pose, 'LL', w.arms.find((a) => a.tid === 'LL')!.pose);
  const c = cupFromGeo(g);
  const k = ramp(t, 0.46, 0.5);
  return v3(CUP0.x + (c.x - CUP0.x) * k, CUP0.y + (c.y - CUP0.y) * k, CUP0.z + (c.z - CUP0.z) * k);
};
/** Where a cup held in this robot hand sits (axis vertical, against the palm inside the curled fingers). */
export const cupFromGeo = (g: ReturnType<typeof slotGeo>): V3 => {
  const pc = v3((g.palm[0].x + g.palm[1].x + g.palm[2].x + g.palm[3].x) / 4, (g.palm[0].y + g.palm[1].y + g.palm[2].y + g.palm[3].y) / 4, (g.palm[0].z + g.palm[1].z + g.palm[2].z + g.palm[3].z) / 4);
  const n = g.Rw.y;
  return v3(pc.x - n.x * 5.4, pc.y - n.y * 5.4 - 5.5, pc.z - n.z * 5.4);
};
let recursing = false;
const s1WearerNoCup = (t: number): Wearer => {
  recursing = true;
  const w = s1Wearer(t);
  recursing = false;
  return w;
};
void recursing;

export const operatorPose = (t: number, miniGeo: {S: V3; E: V3; W: V3; Rs: {z: V3}; Re: {z: V3}}) => {
  const pose = basePose(OP_POS, OP_FACE, EX_FOCUS);
  pose.blink = blinkAt(t, 0.3);
  pose.breath = breathAt(t, 1);
  pose.hNod = 14;
  pose.hYaw = kn(t, [[3.4, 0], [3.9, 6], [4.6, -4], [5.6, 8]]);
  pose.lean = 10;
  const fo = 0, up = 0;
  // right hand (camera side) pinches the model's wrist from below; left hand steadies the model's base. The links and
  // the elbow stay in view between them.
  const wr = v3(miniGeo.W.x - 0.5, miniGeo.W.y + 1.0, miniGeo.W.z - 3.4);
  const bs = v3(MINI_STAND.x - 10, MINI_STAND.y + 3.6, MINI_STAND.z + 5);
  pose.L = {h: wr, world: true, pole: v3(-0.2, -1, -0.6), dir: v3(0.55, 0.25, 0.4), thumb: v3(0, 1, 0.2), hand: HAND_PINCH};
  pose.R = {h: bs, world: true, pole: v3(-0.2, -1, 0.6), dir: v3(0.9, -0.3, 0.1), thumb: v3(0, 0.2, 1), hand: mixHand(HAND_GRIP, HAND_HANG, 0.4)};
  void up; void fo;
  return pose;
};

export const s1State = (t: number): StageState => {
  const w = s1Wearer(t);
  const ur = w.arms.find((a) => a.tid === 'UR')!.pose;
  const mini = {base: MINI_BASE, B: W_UR.B, pose: ur, side: -1 as const, stand: MINI_STAND};
  const mg = slotGeoMini(ur);
  return {
    cam: s1Cam(t),
    wearers: [w],
    people: [{id: 'op', look: OPERATOR, pose: operatorPose(t, mg), legs: true}],
    mini,
    cart: CART,
    table: TABLE,
    cup: {pos: cupPos(t), zBias: t > 0.46 ? 1.5 : 0},
  };
};

import {armFK} from '../r3/robot';
export const slotGeoMini = (p: ArmPose) => armFK(MINI_BASE, W_UR.B, p, -1, 0.5, 0);
void sine;
void EXPR_NEUTRAL;
void HAND_GRIP;
