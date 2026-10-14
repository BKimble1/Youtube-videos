// Motion helpers for RIG-F02: pose blending, planted feet, ballistic flight, speed ramps and a walk cycle.
import {V3, add, euler, mv, mulS, lerp3, mix, clamp01, smooth, sub, norm} from '../engine/math';
import {ArmPose, DIM, FootTarget, LegPose, Pose, restPose} from './rig';

export const G = 981; // cm/s^2

const mixArm = (a: ArmPose, b: ArmPose, t: number): ArmPose => ({
  pitch: mix(a.pitch, b.pitch, t), roll: mix(a.roll, b.roll, t), twist: mix(a.twist, b.twist, t),
  elbow: mix(a.elbow, b.elbow, t), wrist: mix(a.wrist, b.wrist, t), grip: mix(a.grip, b.grip, t),
});
const mixLeg = (a: LegPose, b: LegPose, t: number): LegPose => ({
  pitch: mix(a.pitch, b.pitch, t), roll: mix(a.roll, b.roll, t), knee: mix(a.knee, b.knee, t), ankle: mix(a.ankle, b.ankle, t),
});

/** Blend two poses (positions linearly, angles linearly). Foot/hand IK targets blend when both poses have them. */
export const blendPose = (a: Pose, b: Pose, t: number): Pose => {
  const u = clamp01(t);
  const ft = (x?: FootTarget, y?: FootTarget): FootTarget | undefined =>
    x && y ? {pos: lerp3(x.pos, y.pos, u), pitch: mix(x.pitch ?? 0, y.pitch ?? 0, u), yaw: mix(x.yaw ?? 0, y.yaw ?? 0, u), roll: mix(x.roll ?? 0, y.roll ?? 0, u)} : u < 0.5 ? x : y;
  return {
    pos: lerp3(a.pos, b.pos, u), yaw: mix(a.yaw, b.yaw, u), pitch: mix(a.pitch, b.pitch, u), roll: mix(a.roll, b.roll, u),
    spine: {pitch: mix(a.spine.pitch, b.spine.pitch, u), yaw: mix(a.spine.yaw, b.spine.yaw, u), roll: mix(a.spine.roll, b.spine.roll, u)},
    head: {pitch: mix(a.head.pitch, b.head.pitch, u), yaw: mix(a.head.yaw, b.head.yaw, u), roll: mix(a.head.roll, b.head.roll, u)},
    armL: mixArm(a.armL, b.armL, u), armR: mixArm(a.armR, b.armR, u),
    legL: mixLeg(a.legL, b.legL, u), legR: mixLeg(a.legR, b.legR, u),
    footL: ft(a.footL, b.footL), footR: ft(a.footR, b.footR),
    handL: a.handL && b.handL ? {pos: lerp3(a.handL.pos, b.handL.pos, u)} : u < 0.5 ? a.handL : b.handL,
    handR: a.handR && b.handR ? {pos: lerp3(a.handR.pos, b.handR.pos, u)} : u < 0.5 ? a.handR : b.handR,
  };
};

/** Keyframed pose track: keys at times (s) with an easing per segment (default smoothstep). */
export type PoseKey = {t: number; pose: Pose; ease?: (x: number) => number};
export const poseTrack = (keys: PoseKey[], t: number): Pose => {
  if (t <= keys[0].t) return keys[0].pose;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b.t) return blendPose(a.pose, b.pose, (b.ease ?? smooth)((t - a.t) / Math.max(1e-6, b.t - a.t)));
  }
  return keys[keys.length - 1].pose;
};

/** Ankle position that keeps the toe tip fixed while the foot pitches (heel lift on push-off). */
export const toePlant = (toe: V3, yaw: number, pitch: number): FootTarget => {
  const m = euler(yaw, -pitch, 0);
  // toe tip relative to the ankle in the foot frame: 19.6 forward, sole is DIM.ankleH below the ankle
  const off = mv(m, [0, -DIM.ankleH + 1.6, 19.6]);
  return {pos: sub(toe, off), pitch, yaw};
};
/** Ankle position for a flat foot whose sole sits on a floor at height y. */
export const flatFoot = (x: number, y: number, z: number, yaw: number): FootTarget => ({pos: [x, y + DIM.ankleH, z], pitch: 0, yaw});

/**
 * Speed ramp: piecewise-linear playback rate over screen time (s). Returns physical time elapsed since keys[0].t,
 * scaled so the whole span covers exactly `physTotal` seconds (keeps the trajectory physically coherent).
 */
export const speedRamp = (keys: [number, number][], physTotal: number) => {
  const N = 600;
  const t0 = keys[0][0], t1 = keys[keys.length - 1][0];
  const rate = (tau: number) => {
    for (let i = 0; i < keys.length - 1; i++) {
      const [a, ra] = keys[i], [b, rb] = keys[i + 1];
      if (tau <= b) return mix(ra, rb, (tau - a) / Math.max(1e-6, b - a));
    }
    return keys[keys.length - 1][1];
  };
  const cum: number[] = [0];
  for (let i = 1; i <= N; i++) {
    const ta = t0 + ((t1 - t0) * (i - 1)) / N, tb = t0 + ((t1 - t0) * i) / N;
    cum.push(cum[i - 1] + ((rate(ta) + rate(tb)) / 2) * (tb - ta));
  }
  const k = physTotal / cum[N];
  return {
    phys: (tau: number) => {
      if (tau <= t0) return tau - t0; // before the ramp: real time (negative)
      if (tau >= t1) return physTotal + (tau - t1) * rate(t1) * k;
      const x = ((tau - t0) / (t1 - t0)) * N;
      const i = Math.floor(x);
      return (cum[i] + (cum[Math.min(N, i + 1)] - cum[i]) * (x - i)) * k;
    },
    rateAt: (tau: number) => rate(tau) * k,
  };
};

/** Launch velocity that carries p0 to p1 in time T under gravity. */
export const launch = (p0: V3, p1: V3, T: number): V3 => [(p1[0] - p0[0]) / T, (p1[1] - p0[1] + 0.5 * G * T * T) / T, (p1[2] - p0[2]) / T];
export const ballistic = (p0: V3, v: V3, t: number): V3 => [p0[0] + v[0] * t, p0[1] + v[1] * t - 0.5 * G * t * t, p0[2] + v[2] * t];

// ---------------------------------------------------------------- canonical poses
export const STAND = (pos: V3, yaw: number): Pose => {
  const p = restPose(pos, yaw);
  p.armL = {pitch: 0.06, roll: 0.14, twist: 0, elbow: 0.22, wrist: 0, grip: 0.35};
  p.armR = {pitch: 0.06, roll: 0.14, twist: 0, elbow: 0.22, wrist: 0, grip: 0.35};
  return p;
};

/**
 * Walk cycle with planted feet. The pelvis travels along `dir` from `start`; `dist` is distance travelled (cm).
 * Stride 62 cm, feet stay fixed on the floor while in stance (no skating).
 */
export const walkPose = (start: V3, yaw: number, dist: number, floorY: number, opts: {stride?: number; armSwing?: number; lean?: number} = {}): Pose => {
  const stride = opts.stride ?? 62;
  const fwd: V3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const lat: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const phase = dist / stride; // one step per stride; left foot leads on even steps
  const p = STAND([0, 0, 0], yaw);
  const foot = (side: 1 | -1): FootTarget => {
    // each foot alternates: stance for half a cycle (2 strides), swing over the other half
    const cyc = (phase + (side > 0 ? 0 : 1)) / 2; // cycles of two steps
    const k = Math.floor(cyc);
    const u = cyc - k; // 0..1 within this foot's cycle
    const stanceLen = 0.5;
    const baseAt = (n: number) => n * 2 * stride + (side > 0 ? 0 : -stride);
    let along: number, lift = 0, pitch = 0;
    if (u < stanceLen) {
      along = baseAt(k) + stride;
      pitch = u > stanceLen * 0.75 ? -0.35 * ((u - stanceLen * 0.75) / (stanceLen * 0.25)) : 0;
    } else {
      const s = (u - stanceLen) / (1 - stanceLen);
      const e = smooth(s);
      along = mix(baseAt(k) + stride, baseAt(k + 1) + stride, e);
      lift = Math.sin(s * Math.PI) * 9;
      pitch = mix(-0.35, 0.12, smooth(s * 1.4));
    }
    const pos = add(add(start, mulS(fwd, along - stride * 0.5)), mulS(lat, side * DIM.hipX));
    return {pos: [pos[0], floorY + DIM.ankleH + lift, pos[2]], pitch, yaw};
  };
  p.footL = foot(1);
  p.footR = foot(-1);
  const bob = Math.cos(phase * Math.PI * 2) * 1.6;
  const pelvis = add(start, mulS(fwd, dist));
  p.pos = [pelvis[0], floorY + DIM.pelvisY - 3.5 + bob, pelvis[2]];
  p.pitch = opts.lean ?? 0.05;
  const sw = (opts.armSwing ?? 0.32) * Math.sin(phase * Math.PI);
  p.armL = {...p.armL, pitch: 0.05 - sw, elbow: 0.3 + Math.max(0, -sw) * 0.4};
  p.armR = {...p.armR, pitch: 0.05 + sw, elbow: 0.3 + Math.max(0, sw) * 0.4};
  p.spine.yaw = -0.06 * Math.sin(phase * Math.PI);
  p.roll = 0.025 * Math.sin(phase * Math.PI);
  return p;
};

export {lerp3, norm, sub};
