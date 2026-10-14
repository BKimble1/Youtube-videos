// Canonical humanoid rig (asset id RIG-F02). One skeleton drives every robot view in V2.
// Body frame: x = the robot's left, y = up, z = forward. Units: cm. F.02 is drawn at 168 cm tall.
import {M3, V3, add, cross, dot, euler, frameAlong, len, madd, mm, mv, norm, rotAxis, rotX, rotY, rotZ, sub, mulS, clamp} from '../engine/math';

export const DIM = {
  pelvisY: 96,          // pelvis centre above the soles in the rest pose
  hipX: 9.5,
  hipDY: -4,            // hip joints relative to the pelvis centre
  thigh: 41,
  shin: 41,
  ankleH: 10,           // ankle joint above the sole
  waistDY: 8,           // waist (spine) joint above the pelvis centre
  shoulderX: 19,
  shoulderDY: 34,       // shoulder joints above the waist joint
  shoulderDZ: -1,
  neckDY: 41,           // neck base above the waist joint
  neckLen: 4,
  upperArm: 29,
  foreArm: 26,
};

export type ArmPose = {pitch: number; roll: number; twist: number; elbow: number; wrist: number; grip: number};
export type LegPose = {pitch: number; roll: number; knee: number; ankle: number};
export type FootTarget = {pos: V3; pitch?: number; yaw?: number; roll?: number};
export type HandTarget = {pos: V3; pole?: V3};

export type Pose = {
  pos: V3;               // world position of the pelvis centre
  yaw: number;           // heading, radians (0 = facing +z)
  pitch: number;         // whole-body lean (+ = forward)
  roll: number;
  spine: {pitch: number; yaw: number; roll: number};
  head: {pitch: number; yaw: number; roll: number};
  armL: ArmPose;
  armR: ArmPose;
  legL: LegPose;
  legR: LegPose;
  footL?: FootTarget;     // IK: world ankle position (overrides legL)
  footR?: FootTarget;
  handL?: HandTarget;     // IK: world wrist position (overrides armL pitch/roll/elbow)
  handR?: HandTarget;
};

export const ARM0: ArmPose = {pitch: 0.05, roll: 0.1, twist: 0, elbow: 0.18, wrist: 0, grip: 0.25};
export const LEG0: LegPose = {pitch: 0, roll: 0, knee: 0, ankle: 0};

export const restPose = (pos: V3 = [0, DIM.pelvisY, 0], yaw = 0): Pose => ({
  pos, yaw, pitch: 0, roll: 0,
  spine: {pitch: 0, yaw: 0, roll: 0},
  head: {pitch: 0, yaw: 0, roll: 0},
  armL: {...ARM0}, armR: {...ARM0},
  legL: {...LEG0}, legR: {...LEG0},
});

export type Bone = {a: V3; b: V3; m: M3};
export type Skeleton = {
  body: M3;               // pelvis frame (world)
  pelvis: V3;
  torso: {o: V3; m: M3};  // waist joint + chest frame
  neck: {o: V3; m: M3};
  head: {o: V3; m: M3};
  side: {
    L: SideSk;
    R: SideSk;
  };
};
export type SideSk = {
  hip: V3; knee: V3; ankle: V3;
  thigh: Bone; shin: Bone;
  foot: {o: V3; m: M3};   // origin at ankle; columns: x lateral, y up (sole normal), z forward
  shoulder: V3; elbow: V3; wrist: V3;
  upper: Bone; fore: Bone;
  hand: {o: V3; m: M3};   // origin at wrist; y along the hand (away from forearm), x = palm normal side
  grip: number;
  sgn: number;            // +1 left, -1 right
};

/** Two-bone IK: returns the middle joint given root, target, lengths and a pole direction. */
export const twoBone = (root: V3, target: V3, l1: number, l2: number, pole: V3): V3 => {
  const d = sub(target, root);
  const dist = clamp(len(d), Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.05);
  const dh = norm(d);
  let pdir = sub(pole, mulS(dh, dot(pole, dh)));
  if (len(pdir) < 1e-6) pdir = [0, 0, 1];
  pdir = norm(pdir);
  const cosA = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
  const sinA = Math.sqrt(1 - cosA * cosA);
  return add(root, add(mulS(dh, l1 * cosA), mulS(pdir, l1 * sinA)));
};

/** Bone frame: y along a→b, x kept close to the body's lateral axis. */
const bone = (a: V3, b: V3, side: V3): Bone => ({a, b, m: frameAlong(sub(b, a), side)});

export const solve = (p: Pose): Skeleton => {
  const body = euler(p.yaw, p.pitch, p.roll);
  const pelvis = p.pos;
  const W = (local: V3) => add(pelvis, mv(body, local));
  const lat = body[0];
  const fwd = body[2];
  const up = body[1];

  // Torso
  const waist = W([0, DIM.waistDY, 0]);
  const torsoM = mm(body, euler(p.spine.yaw, p.spine.pitch, p.spine.roll));
  const T = (local: V3) => add(waist, mv(torsoM, local));
  const neckO = T([0, DIM.neckDY, 0]);
  const headM = mm(torsoM, euler(p.head.yaw, p.head.pitch, p.head.roll));
  const headO = add(neckO, mv(headM, [0, DIM.neckLen, 0.6]));

  const mkSide = (s: 1 | -1): SideSk => {
    const leg = s > 0 ? p.legL : p.legR;
    const arm = s > 0 ? p.armL : p.armR;
    const ft = s > 0 ? p.footL : p.footR;
    const ht = s > 0 ? p.handL : p.handR;

    // ---- leg
    const hip = W([s * DIM.hipX, DIM.hipDY, 0]);
    let knee: V3, ankle: V3;
    let footM: M3;
    if (ft) {
      ankle = ft.pos;
      knee = twoBone(hip, ankle, DIM.thigh, DIM.shin, add(mulS(fwd, 1), mulS(lat, s * 0.08)));
      const yaw = ft.yaw ?? p.yaw;
      footM = euler(yaw, -(ft.pitch ?? 0), ft.roll ?? 0);
    } else {
      // FK: hip flexion swings the thigh forward (rotX(-pitch) on a downward bone)
      const hipM = mm(body, mm(rotZ(s * leg.roll), rotX(-leg.pitch)));
      knee = add(hip, mv(hipM, [0, -DIM.thigh, 0]));
      const kneeM = mm(hipM, rotX(leg.knee));
      ankle = add(knee, mv(kneeM, [0, -DIM.shin, 0]));
      footM = mm(kneeM, rotX(-leg.ankle));
    }
    const thigh = bone(hip, knee, lat);
    const shin = bone(knee, ankle, lat);

    // ---- arm
    const shoulder = T([s * DIM.shoulderX, DIM.shoulderDY, DIM.shoulderDZ]);
    const tLat = torsoM[0], tFwd = torsoM[2], tUp = torsoM[1];
    let elbow: V3, wrist: V3, foreM: M3;
    if (ht) {
      wrist = ht.pos;
      const pole = ht.pole ?? add(mulS(tFwd, -0.6), add(mulS(tUp, -0.7), mulS(tLat, s * 0.35)));
      elbow = twoBone(shoulder, wrist, DIM.upperArm, DIM.foreArm, pole);
      foreM = frameAlong(sub(wrist, elbow), tLat);
    } else {
      const shM = mm(torsoM, mm(mm(rotZ(s * arm.roll), rotX(-arm.pitch)), rotY(s * arm.twist)));
      elbow = add(shoulder, mv(shM, [0, -DIM.upperArm, 0]));
      const elM = mm(shM, rotX(-arm.elbow));
      wrist = add(elbow, mv(elM, [0, -DIM.foreArm, 0]));
      foreM = frameAlong(sub(wrist, elbow), mv(shM, [1, 0, 0]));
    }
    const upper = bone(shoulder, elbow, tLat);
    const fore = bone(elbow, wrist, tLat);
    // hand: y continues the forearm (pointing away from the elbow); x = palm normal (medial in the neutral pose)
    const handY = norm(sub(wrist, elbow));
    const twist = arm.twist * s;
    const lateralRef = mv(rotAxis(handY, twist), mulS(tLat, -s));
    const hx0 = norm(sub(lateralRef, mulS(handY, dot(lateralRef, handY))));
    const wristBend = rotAxis(cross(handY, hx0), -arm.wrist);
    const hy = norm(mv(wristBend, handY));
    const hx = norm(sub(hx0, mulS(hy, dot(hx0, hy))));
    const hz = cross(hx, hy);
    const handM: M3 = [hx, hy, hz];
    void up;
    return {
      hip, knee, ankle, thigh, shin, foot: {o: ankle, m: footM},
      shoulder, elbow, wrist, upper, fore, hand: {o: wrist, m: handM}, grip: arm.grip, sgn: s,
    };
  };

  return {
    body, pelvis,
    torso: {o: waist, m: torsoM},
    neck: {o: neckO, m: headM},
    head: {o: headO, m: headM},
    side: {L: mkSide(1), R: mkSide(-1)},
  };
};


/** World height of the lowest sole point (for planting a pose on a floor). */
export const soleY = (sk: Skeleton) => {
  const ys = [sk.side.L, sk.side.R].map((s) => madd(s.foot.o, s.foot.m[1], -DIM.ankleH)[1]);
  return Math.min(...ys);
};
