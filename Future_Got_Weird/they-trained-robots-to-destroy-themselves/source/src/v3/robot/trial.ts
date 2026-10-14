// Generic jump trial: platform edge → floor (or steel) with a landing outcome. Used by the simulation sequences.
// Physical time drives everything; outcomes are deterministic so each "attempt" can be replayed or ghosted.
import {V3, add, mix, smooth, clamp01, lerp3} from '../engine/math';
import {Pose} from './rig';
import {STAND, ballistic, blendPose, launch, toePlant, G} from './motion';

export type Landing = 'stick' | 'short' | 'faceplant';
export type TrialSpec = {
  edgeX: number;     // x of the platform edge
  deckY: number;     // platform top
  floorY: number;    // landing surface height
  lateral: number;   // z of the lane
  landX: number;     // x where the feet touch down
  T?: number;        // flight time (s)
  landing: Landing;
  armStyle?: number; // 0..1 variation per lane
};

const YAW = Math.PI / 2;

const pushPoses = (s: TrialSpec) => {
  const toe = s.edgeX - 3;
  const mk = (dx: number, dy: number, pitch: number, spine: number, head: number, arm: number, elbow: number, fp: number): Pose => {
    const p = STAND([s.edgeX - 32 + dx, s.deckY + 95 + dy, s.lateral], YAW);
    p.pitch = pitch;
    p.spine.pitch = spine;
    p.head.pitch = head;
    p.armL = {pitch: arm, roll: 0.16, twist: 0, elbow, wrist: 0, grip: 0.4};
    p.armR = {pitch: arm, roll: 0.16, twist: 0, elbow, wrist: 0, grip: 0.4};
    p.footL = toePlant([toe, s.deckY, s.lateral - 9.5], YAW, fp);
    p.footR = toePlant([toe, s.deckY, s.lateral + 9.5], YAW, fp);
    return p;
  };
  return {
    look: mk(-2, -2, 0.08, 0.06, 0.4, 0.02, 0.24, 0),
    crouch: mk(-6, -29, 0.46, 0.14, -0.1, -0.85, 0.35, 0),
    mid: mk(6, -15, 0.36, 0.1, -0.2, 0.55, 0.3, -0.3),
    release: mk(18, -3, 0.26, 0.06, -0.15, 1.25, 0.35, -0.8),
  };
};

export const makeTrial = (s: TrialSpec) => {
  const K = pushPoses(s);
  const T = s.T ?? 0.95;
  const p0: V3 = [K.release.pos[0], K.release.pos[1], s.lateral];
  const p1: V3 = [s.landX - 6, s.floorY + 92, s.lateral];
  const v0 = launch(p0, p1, T);
  const pushDur = 0.62;
  const footContact = (side: 1 | -1): V3 => [s.landX + 4, s.floorY + 10, s.lateral - side * 9.5];

  const at = (t: number): {pose: Pose; phase: 'push' | 'air' | 'land'} => {
    if (t < 0) {
      const u = clamp01(1 + t / pushDur);
      let pose: Pose;
      if (u < 0.45) pose = blendPose(K.look, K.crouch, smooth(u / 0.45));
      else if (u < 0.8) pose = blendPose(K.crouch, K.mid, smooth((u - 0.45) / 0.35));
      else pose = blendPose(K.mid, K.release, smooth((u - 0.8) / 0.2));
      return {pose, phase: 'push'};
    }
    if (t <= T) {
      const u = t / T;
      const pel = ballistic(p0, v0, t);
      const pose = blendPose(K.release, K.release, 0);
      pose.pos = pel;
      pose.pitch = mix(0.26, 0.04, smooth(u));
      pose.head.pitch = mix(-0.15, 0.25, smooth(u));
      const armP = u < 0.3 ? mix(1.25, 0.95, u / 0.3) : mix(0.95, 0.5 + 0.3 * (s.armStyle ?? 0), smooth((u - 0.3) / 0.7));
      pose.armL = {pitch: armP, roll: 0.28, twist: 0, elbow: 0.4, wrist: 0, grip: 0.4};
      pose.armR = {pitch: armP * 0.95, roll: 0.28, twist: 0, elbow: 0.45, wrist: 0, grip: 0.4};
      const tuck = Math.sin(Math.min(1, u * 1.15) * Math.PI);
      const off = (side: 1 | -1): V3 => [mix(16, 8, u) + 10 * tuck, mix(-62, -86, smooth(u)) + 18 * tuck * (u < 0.5 ? 1 : 0.4), -side * 9.5];
      pose.footL = {pos: add(pel, off(1)), pitch: mix(-0.6, -0.12, smooth(u)), yaw: YAW};
      pose.footR = {pos: add(pel, off(-1)), pitch: mix(-0.6, -0.12, smooth(u)), yaw: YAW};
      return {pose, phase: 'air'};
    }
    // landing
    const d = t - T;
    const base = STAND([s.landX - 4, s.floorY + 95.4, s.lateral], YAW);
    base.footL = {pos: footContact(1), pitch: 0, yaw: YAW};
    base.footR = {pos: footContact(-1), pitch: 0, yaw: YAW};
    const absorb = Math.sin(Math.min(1, d / 0.32) * Math.PI) * (d < 0.32 ? 1 : 0) + (d >= 0.32 ? Math.max(0, 1 - (d - 0.32) / 0.4) * 0.15 : 0);
    if (s.landing === 'stick') {
      const p = {...base};
      p.pos = add(base.pos, [mix(-4, 0, clamp01(d / 0.4)), -30 * absorb, 0]);
      p.pitch = 0.08 + 0.3 * absorb;
      p.armL = {pitch: 0.4 + 0.5 * absorb, roll: 0.2, twist: 0, elbow: 0.5, wrist: 0, grip: 0.4};
      p.armR = {pitch: 0.4 + 0.5 * absorb, roll: 0.2, twist: 0, elbow: 0.5, wrist: 0, grip: 0.4};
      if (d > 0.6) {
        const r = smooth((d - 0.6) / 0.6);
        p.armL = {...p.armL, pitch: mix(p.armL.pitch, 0.08, r), roll: mix(0.2, 0.14, r), elbow: mix(0.5, 0.22, r)};
        p.armR = {...p.armR, pitch: mix(p.armR.pitch, 0.08, r), roll: mix(0.2, 0.14, r), elbow: mix(0.5, 0.22, r)};
      }
      return {pose: p, phase: 'land'};
    }
    if (s.landing === 'short') {
      // lands, momentum carries it forward: a step, then down onto one knee with a hand on the floor
      const a = smooth(clamp01((d - 0.1) / 0.45));
      const b = smooth(clamp01((d - 0.45) / 0.5));
      const p = {...base};
      p.pos = add(base.pos, [mix(0, 22, a) + 10 * b, -30 * absorb - 42 * b, 0]);
      p.pitch = 0.1 + 0.3 * absorb + 0.42 * b;
      p.spine.pitch = 0.2 * b;
      p.head.pitch = 0.3 * b;
      p.footR = {pos: lerp3(footContact(-1), add(footContact(-1), [44, 0, 0]), a), pitch: 0, yaw: YAW};
      // left knee goes down: foot slides back, toes on the floor
      p.footL = {pos: add(footContact(1), [-12 * b, 0, 0]), pitch: -1.0 * b, yaw: YAW};
      p.armR = {pitch: mix(0.5, 0.9, a), roll: 0.25, twist: 0, elbow: 0.3, wrist: 0, grip: 0.3};
      p.armL = {pitch: mix(0.5, 0.2, b), roll: 0.25, twist: 0, elbow: 0.2, wrist: 0, grip: 0.3};
      if (b > 0) p.handR = {pos: lerp3([s.landX + 60, s.floorY + 60, s.lateral + 18], [s.landX + 52, s.floorY + 6, s.lateral + 22], b)};
      return {pose: p, phase: 'land'};
    }
    // faceplant: lands with too much forward rotation, pivots over the feet, arms out to catch, ends prone
    const r = smooth(clamp01((d - 0.05) / 0.62));
    const bounce = d > 0.67 ? Math.exp(-(d - 0.67) * 9) * Math.sin((d - 0.67) * 30) * 3 : 0;
    const p = {...base};
    const ang = mix(0.1, 1.5, r);
    // pelvis swings on a circle about the feet (radius = standing pelvis height)
    const R = 88 - 18 * absorb;
    p.pos = [s.landX - 4 + Math.sin(ang) * R, s.floorY + 8 + Math.cos(ang) * R + bounce, s.lateral];
    p.pitch = ang;
    p.head.pitch = mix(0.2, -0.5, r);
    p.armL = {pitch: mix(0.8, 2.6, r), roll: 0.3, twist: 0, elbow: 0.3, wrist: 0, grip: 0.2};
    p.armR = {pitch: mix(0.8, 2.7, r), roll: 0.3, twist: 0, elbow: 0.25, wrist: 0, grip: 0.2};
    p.footL = {pos: footContact(1), pitch: -1.25 * r, yaw: YAW};
    p.footR = {pos: footContact(-1), pitch: -1.25 * r, yaw: YAW};
    return {pose: p, phase: 'land'};
  };
  // pelvis path for drawing the arc
  const arc = (n = 36): V3[] => {
    const out: V3[] = [];
    for (let i = 0; i <= n; i++) out.push(ballistic(p0, v0, (T * i) / n));
    return out;
  };
  return {at, arc, T, p0, p1, v0, K, pushDur, vIn: [v0[0], v0[1] - G * T, v0[2]] as V3};
};
