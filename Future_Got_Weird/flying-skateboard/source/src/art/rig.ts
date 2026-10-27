// The pilot: a 3D joint rig standing on the board (board-local coordinates: x = the board's toe side, y = up from
// the deck, z = the nose). Skateboard stance, left foot forward: the body faces +x, its left side toward the nose.
// Both ankles are planted on the deck (they never leave it); hips, knees, spine, arms and head are solved from a
// handful of pose values, so every frame is a consistent body: legs are two-bone IK chains from the hips to the
// planted ankles (knees toward the toes), the spine leans with the centre of mass, the arms are IK chains to their
// hand targets with the elbows hanging down and back.
import {a3, c3, d3, Frame, l3, lerp3, m3, n3, s3, toW, V3, v3} from '../eng/v3';

export type PilotPose = {
  /** centre of mass shift toward the nose (m), + = lean forward on the board (pitches the nose down) */
  lean: number;
  /** shift toward the toes (m) (rolls the toe side down) */
  side: number;
  /** knee bend 0 (tall) .. 1 (deep crouch) */
  crouch: number;
  /** upper-body turn toward the nose (deg) */
  twist: number;
  /** extra forward bend of the chest toward the toes (deg) */
  bend: number;
  /** head yaw from the chest toward the nose (deg) and pitch (deg, + = looking down) */
  look: number;
  nod: number;
  /** front (left) arm: 0 low by the side .. 1 out toward the nose for balance; spread lifts it sideways */
  armF: number;
  armFs: number;
  /** rear (right) arm: hand on the controller in front of the belly; reach 0..1 pushes it forward/up */
  armR: number;
  /** controller thumb (throttle) 0..1 */
  thumb: number;
  /** left wrist turned up to read the wrist phone (0..1) */
  wristUp: number;
  /** rear foot off the deck: 0 = planted on the deck .. 1 = on the ground behind the heel edge (stepping on) */
  stepR?: number;
};
export const POSE0: PilotPose = {lean: 0, side: 0, crouch: 0.35, twist: 22, bend: 8, look: 62, nod: 6, armF: 0.55, armFs: 0.3, armR: 0.3, thumb: 0.4, wristUp: 0};

export const DIMS = {
  ankleH: 0.085,
  footZ: 0.25,
  thigh: 0.45,
  shin: 0.44,
  hipW: 0.105,
  torso: 0.5,
  shW: 0.2,
  neck: 0.07,
  headUp: 0.16,
  headR: 0.128,
  upper: 0.3,
  fore: 0.27,
};

/** two-bone IK in 3D: joint position for root A, end target T, bone lengths, pole direction */
export const ik3 = (A: V3, T: V3, l1: number, l2: number, pole: V3) => {
  const d0 = s3(T, A);
  const L = l1 + l2;
  const dl = Math.min(l3(d0), L * 0.998);
  const dir = n3(d0);
  const W = a3(A, m3(dir, dl));
  const a = (l1 * l1 + dl * dl - l2 * l2) / (2 * dl);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  // pole component perpendicular to the chain
  let pp = s3(pole, m3(dir, d3(pole, dir)));
  if (l3(pp) < 1e-5) pp = {x: 0, y: 0, z: 1};
  pp = n3(pp);
  return {J: a3(a3(A, m3(dir, a)), m3(pp, h)), W};
};

export type PilotJ = ReturnType<typeof pilotJoints>;
/** All joints in world space for board frame B and pose p. */
export const pilotJoints = (B: Frame, p: PilotPose) => {
  const D = DIMS;
  const L = (x: number, y: number, z: number) => toW(B, v3(x, y, z));
  const dirB = (x: number, y: number, z: number) => n3(a3(a3(m3(B.x, x), m3(B.y, y)), m3(B.z, z)));
  // planted ankles
  const ankF = L(0.0, D.ankleH, D.footZ);
  const st = p.stepR ?? 0;
  const ankR = st > 0
    ? L(-0.24 * st, D.ankleH - 0.13 * st + Math.sin(Math.PI * Math.min(1, st)) * 0.2, -D.footZ - 0.34 * st)
    : L(0.0, D.ankleH, -D.footZ);
  // pelvis: height from the crouch; shifted by the lean (the knees take up the difference)
  const hipH = 0.93 - p.crouch * 0.3;
  const P = L(-0.035 + p.side * 0.9, hipH, p.lean * 0.9);
  // body axes: facing +x (toes) turned by the twist toward the nose; up tilted with the lean
  const tw = (p.twist * Math.PI) / 180;
  const fwd0 = dirB(Math.cos(tw * 0.35), 0, Math.sin(tw * 0.35));
  const left0 = dirB(-Math.sin(tw * 0.35), 0, Math.cos(tw * 0.35));
  const hipF = a3(P, m3(left0, D.hipW));
  const hipR = a3(P, m3(left0, -D.hipW));
  const kneeDir = (s: number) => n3(a3(a3(fwd0, m3(left0, 0.18 * s)), m3(B.y, 0.15)));
  const legF = ik3(hipF, ankF, D.thigh, D.shin, kneeDir(1));
  const legR = ik3(hipR, ankR, D.thigh, D.shin, kneeDir(-1));
  // spine: leans in the direction of the shift, plus the chest bend toward the toes
  const bend = (p.bend * Math.PI) / 180;
  const up = n3(a3(a3(B.y, m3(B.z, p.lean * 1.1)), m3(B.x, p.side * 1.0 + Math.sin(bend) * 0.9)));
  const chF0 = dirB(Math.cos(tw), 0, Math.sin(tw));
  // chest forward re-orthogonalised against the spine
  const chF = n3(s3(chF0, m3(up, d3(chF0, up))));
  const chL = n3(c3(chF, up)); // body left (forward x up in this world)
  const S = a3(P, m3(up, D.torso));
  const Wst = a3(P, m3(up, D.torso * 0.45));
  const shF = a3(a3(S, m3(chL, D.shW)), m3(up, -0.02));
  const shR = a3(a3(S, m3(chL, -D.shW)), m3(up, -0.02));
  const N = a3(S, m3(up, D.neck));
  // head: yaw toward the nose (about the spine), nod down
  const lk = (p.look * Math.PI) / 180;
  const hF0 = n3(a3(m3(chF, Math.cos(lk)), m3(chL, Math.sin(lk))));
  const nd = (p.nod * Math.PI) / 180;
  const hF = n3(a3(m3(hF0, Math.cos(nd)), m3(up, -Math.sin(nd))));
  const hL = n3(c3(hF, up));
  const hU = n3(c3(hL, hF));
  const Hc = a3(N, m3(n3(a3(up, m3(hF, 0.12))), D.headUp * 0.72));
  // arms. Front (left) hand: out toward the nose, low to shoulder height
  const handF = a3(
    a3(a3(shF, m3(chL, 0.12 + 0.22 * p.armF + 0.16 * p.armFs)), m3(chF, 0.1 + 0.06 * p.armF - 0.04 * p.armFs)),
    m3(up, -0.56 + 0.3 * p.armF + 0.14 * p.armFs),
  );
  // reading the wrist phone: the left forearm comes up across the front of the chest
  const readF = a3(a3(a3(S, m3(chF, 0.36)), m3(chL, 0.02)), m3(up, -0.2));
  const wu = p.wristUp ?? 0;
  const handF2 = wu > 0 ? lerp3(handF, readF, wu) : handF;
  const elbPole = (s: number) => n3(a3(a3(m3(up, -1), m3(chF, -0.55)), m3(chL, 0.35 * s)));
  const armF = ik3(shF, handF2, D.upper, D.fore, elbPole(1));
  // rear (right) hand on the controller, in front of the belly
  const handR = a3(a3(a3(Wst, m3(chF, 0.1 + 0.16 * p.armR)), m3(chL, -0.31 - 0.04 * p.armR)), m3(up, -0.2 + 0.2 * p.armR));
  const armR = ik3(shR, handR, D.upper, D.fore, elbPole(-1));
  return {
    B, P, up, chF, chL, S, Wst, N, Hc, hF, hL, hU,
    hipF, hipR, kneeF: legF.J, kneeR: legR.J, ankF: legF.W, ankR: legR.W, ankFt: ankF, ankRt: ankR,
    shF, shR, elbF: armF.J, elbR: armR.J, wriF: armF.W, wriR: armR.W, handF, handR,
    fwd0, left0, wristUp: wu,
  };
};
/** the centre of the body, for camera targets */
export const pilotCenter = (j: PilotJ) => lerp3(j.P, j.S, 0.35);
