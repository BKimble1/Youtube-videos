// The canonical edge jump (feet-first entry) used by every jump into the ladle, plus a walk-to-the-edge stop.
// Physical time drives the trajectory; a speed ramp (optional) maps screen time to physical time.
import {V3, add, mix, smooth, clamp01, lerp3} from '../engine/math';
import {DECK, LADLE} from '../sets/Foundry';
import {Pose} from './rig';
import {STAND, ballistic, blendPose, launch, toePlant, walkPose, speedRamp, G} from './motion';

export const YAW_X = Math.PI / 2; // facing +x (toward the ladle)
const TOE_X = DECK.edgeX - 3;

export type JumpState = {pose: Pose; t: number; phase: 'push' | 'air' | 'plunge'; entry: V3; clipY?: number; tIn: number};

const pushKeys = (lateral: number) => {
  // poses during the push-off with toes planted on the edge; times relative to takeoff (s)
  const mk = (pel: V3, pitch: number, spine: number, head: number, arm: number, elbow: number, footPitch: number): Pose => {
    const p = STAND(pel, YAW_X);
    p.pitch = pitch;
    p.spine.pitch = spine;
    p.head.pitch = head;
    p.armL = {pitch: arm, roll: 0.16, twist: 0, elbow, wrist: 0, grip: 0.4};
    p.armR = {pitch: arm, roll: 0.16, twist: 0, elbow, wrist: 0, grip: 0.4};
    p.footL = toePlant([TOE_X, DECK.y, lateral - 9.5], YAW_X, footPitch);
    p.footR = toePlant([TOE_X, DECK.y, lateral + 9.5], YAW_X, footPitch);
    return p;
  };
  return {
    stand: mk([-246, DECK.y + 95, lateral], 0.04, 0, 0.12, 0.06, 0.22, 0),
    look: mk([-248, DECK.y + 93, lateral], 0.08, 0.06, 0.45, 0.02, 0.24, 0),
    crouch: mk([-252, DECK.y + 66, lateral], 0.46, 0.14, -0.1, -0.85, 0.35, 0),
    mid: mk([-240, DECK.y + 80, lateral], 0.36, 0.1, -0.2, 0.55, 0.3, -0.3),
    release: mk([-228, DECK.y + 92, lateral], 0.26, 0.06, -0.15, 1.25, 0.35, -0.8),
  };
};

/** Pelvis-relative ankle offsets in the air (x forward along +x, y up), with foot pitch (toe-down negative). */
const AIR = [
  {t: 0.3, off: [16, -60, 10] as V3, pitch: -0.25},
  {t: 0.72, off: [6, -82, 9] as V3, pitch: -0.5},
  {t: 1.0, off: [2, -88, 8] as V3, pitch: -0.62},
];

/** Hero (articulated) air keys: trailing legs → tuck at the apex → extension with pointed feet for a feet-first entry. */
const AIR_HERO = [
  {t: 0.16, off: [-6, -70, 10] as V3, pitch: -0.55},
  {t: 0.44, off: [24, -50, 11] as V3, pitch: -0.25},
  {t: 0.74, off: [10, -82, 9] as V3, pitch: -0.55},
  {t: 1.0, off: [2, -91, 8] as V3, pitch: -0.75},
];

export type JumpPlan = {
  /** 'hero': articulated launch (arms swing up then out to counterbalance, knee tuck at the apex, pointed entry). */
  style?: 'plain' | 'hero';
  /** Deceleration rate in the steel (larger = stops sooner; V2 used 4.2). */
  drag?: number;
  /** Illustrative sink speed after the entry (cm/s). */
  sinkRate?: number;
  lateral?: number;        // z offset of the jump line
  tTakeoff: number;        // screen time of takeoff (s)
  tEntry: number;          // screen time the toes reach the steel (s)
  ramp?: [number, number][]; // optional speed ramp keys between takeoff and entry (screen s, relative rate)
  pushDur?: number;        // physical duration of crouch→release (s)
  entryX?: number;
};

export const makeJump = (plan: JumpPlan) => {
  const lateral = plan.lateral ?? 0;
  const K = pushKeys(lateral);
  const p0: V3 = [K.release.pos[0], K.release.pos[1], lateral];
  const entryX = plan.entryX ?? -18;
  const p1: V3 = [entryX, LADLE.steel + 90, lateral * 0.5];
  // flight time is the physical span between takeoff and entry
  const ramp = plan.ramp ? speedRamp(plan.ramp, 1.06) : null;
  const T = ramp ? 1.06 : plan.tEntry - plan.tTakeoff;
  const v0 = launch(p0, p1, T);
  const vIn: V3 = [v0[0], v0[1] - G * T, v0[2]];
  const pushDur = plan.pushDur ?? 0.62;
  const phys = (tau: number) => (ramp ? ramp.phys(tau) : tau - plan.tTakeoff);
  const hero = plan.style === 'hero';

  // pose at physical time t (0 = takeoff)
  const at = (t: number): JumpState => {
    if (t < 0) {
      // push-off: stand → crouch → mid → release over pushDur
      const u = clamp01(1 + t / pushDur);
      let pose: Pose;
      if (hero) {
        // already loaded: crouch with the arms back → drive through mid → release with the arms swinging up
        if (u < 0.55) pose = blendPose(K.crouch, K.mid, smooth(u / 0.55));
        else pose = blendPose(K.mid, K.release, smooth((u - 0.55) / 0.45));
      } else if (u < 0.45) pose = blendPose(K.look, K.crouch, smooth(u / 0.45));
      else if (u < 0.8) pose = blendPose(K.crouch, K.mid, smooth((u - 0.45) / 0.35));
      else pose = blendPose(K.mid, K.release, smooth((u - 0.8) / 0.2));
      return {pose, t, phase: 'push', entry: p1, tIn: T};
    }
    if (t <= T) {
      const pel = ballistic(p0, v0, t);
      const pose = blendPose(K.release, K.release, 0);
      pose.pos = pel;
      // body orientation and arms through the flight
      const u = t / T;
      if (hero) {
        // lean into the launch, level out through the tuck, come upright for the entry; a little roll for life
        pose.pitch = u < 0.2 ? mix(0.3, 0.4, u / 0.2) : u < 0.5 ? mix(0.4, 0.14, smooth((u - 0.2) / 0.3)) : mix(0.14, -0.05, smooth((u - 0.5) / 0.5));
        pose.roll = 0.07 * Math.sin(u * Math.PI);
        pose.spine.pitch = mix(0.12, 0.02, u);
        pose.head.pitch = mix(-0.2, 0.32, smooth(u));
        const armP = u < 0.2 ? mix(1.35, 1.85, u / 0.2) : u < 0.5 ? mix(1.85, 0.85, smooth((u - 0.2) / 0.3)) : mix(0.85, 0.55, smooth((u - 0.5) / 0.5));
        const armR = u < 0.2 ? 0.25 : u < 0.5 ? mix(0.25, 0.7, smooth((u - 0.2) / 0.3)) : mix(0.7, 0.82, smooth((u - 0.5) / 0.5));
        const elb = u < 0.5 ? mix(0.4, 0.3, u / 0.5) : mix(0.3, 0.18, (u - 0.5) / 0.5);
        pose.armL = {pitch: armP, roll: armR, twist: 0, elbow: elb, wrist: 0.1, grip: 0.35};
        pose.armR = {pitch: armP * 0.94, roll: armR * 1.04, twist: 0, elbow: elb + 0.05, wrist: 0.1, grip: 0.35};
      } else {
        pose.pitch = mix(0.26, -0.05, smooth(u));
        pose.spine.pitch = mix(0.06, 0.02, u);
        pose.head.pitch = mix(-0.15, 0.22, smooth(u));
        const armP = u < 0.3 ? mix(1.25, 0.9, u / 0.3) : mix(0.9, 0.06, smooth((u - 0.3) / 0.7));
        const armR = u < 0.3 ? 0.16 : mix(0.16, 0.07, (u - 0.3) / 0.7);
        const elb = mix(0.35, 0.22, u);
        pose.armL = {pitch: armP, roll: armR, twist: 0, elbow: elb, wrist: 0, grip: 0.45};
        pose.armR = {pitch: armP * 0.96, roll: armR, twist: 0, elbow: elb + 0.04, wrist: 0, grip: 0.45};
      }
      // feet: from the planted release offset toward the air keys (pelvis-relative)
      const rel0L = [K.release.footL!.pos[0] - p0[0], K.release.footL!.pos[1] - p0[1], K.release.footL!.pos[2] - p0[2]] as V3;
      const keys = [{t: 0, off: rel0L, pitch: -0.8}, ...(hero ? AIR_HERO : AIR)];
      let off: V3 = keys[0].off, fp = keys[0].pitch;
      for (let i = 0; i < keys.length - 1; i++) {
        const a = keys[i], b = keys[i + 1];
        if (u <= b.t) {
          const w = smooth((u - a.t) / (b.t - a.t));
          off = lerp3(a.off, b.off, w);
          fp = mix(a.pitch, b.pitch, w);
          break;
        }
        off = b.off;
        fp = b.pitch;
      }
      pose.footL = {pos: add(pel, [off[0], off[1], -Math.abs(off[2]) * 1 + 0]), pitch: fp, yaw: YAW_X};
      pose.footR = {pos: add(pel, [off[0] - (u < 0.5 ? 8 * Math.sin(u * Math.PI * 2) : 0), off[1] + (u < 0.5 ? 6 * Math.sin(u * Math.PI * 2) : 0), Math.abs(off[2])]), pitch: fp, yaw: YAW_X};
      return {pose, t, phase: 'air', entry: p1, tIn: T};
    }
    // plunge: drag decelerates the entry speed, then a slow illustrative sink
    const s = t - T;
    const k = plan.drag ?? 4.2;
    const dropFast = (-vIn[1] * (1 - Math.exp(-k * s))) / k;
    const sink = (plan.sinkRate ?? 42) * s;
    const pel: V3 = [p1[0] + (vIn[0] * (1 - Math.exp(-k * s))) / k * 0.6, p1[1] - dropFast - sink, p1[2]];
    const last = at(T).pose;
    const pose = {...last, pos: pel};
    pose.pitch = -0.05 + 0.08 * clamp01(s * 2);
    // arms trail upward smoothly from their entry pose as the body slows (no snap at contact)
    const ab = smooth(clamp01(s / 0.45));
    pose.armL = {...last.armL, pitch: mix(last.armL.pitch, hero ? 0.2 : 0.12, ab), roll: mix(last.armL.roll, hero ? 0.55 : 0.26, ab)};
    pose.armR = {...last.armR, pitch: mix(last.armR.pitch, hero ? 0.2 : 0.12, ab), roll: mix(last.armR.roll, hero ? 0.55 : 0.26, ab)};
    pose.footL = {...last.footL!, pos: add(pel, [2, -88, -8])};
    pose.footR = {...last.footR!, pos: add(pel, [2, -88, 8])};
    return {pose, t, phase: 'plunge', entry: p1, clipY: LADLE.steel, tIn: T};
  };
  return {at, phys, T, v0, vIn, p0, p1, K, ramp};
};

/** Walk along +x toward the edge and stop with both toes at the edge. Returns the pose at time t (s from walk start). */
export const walkToEdge = (t: number, opts: {lateral?: number; steps?: number; speed?: number} = {}): Pose => {
  const lateral = opts.lateral ?? 0;
  const steps = opts.steps ?? 6;
  const speed = opts.speed ?? 118; // cm/s
  const stride = 58;
  // final ankle x with toes at the edge; pelvis ends above the ankles
  const ankleX = TOE_X - 19.6 + 2;
  const endAlong = ankleX; // feet together here
  const startX = endAlong - (steps + 1) * stride + stride / 2;
  const tWalk = (steps * stride) / speed;
  if (t <= tWalk) {
    const dist = t * speed;
    return walkPose([startX, 0, lateral], YAW_X, dist, DECK.y, {stride});
  }
  const s = clamp01((t - tWalk) / 0.5);
  const e = smooth(s);
  const last = walkPose([startX, 0, lateral], YAW_X, steps * stride, DECK.y, {stride});
  const stand = STAND([startX + steps * stride + stride / 2, DECK.y + 95, lateral], YAW_X);
  // trailing foot swings up beside the planted one
  stand.footL = {pos: [endAlong, DECK.y + 10, lateral - 9.5], pitch: 0, yaw: YAW_X};
  stand.footR = {pos: [endAlong, DECK.y + 10, lateral + 9.5], pitch: 0, yaw: YAW_X};
  const pose = blendPose(last, stand, e);
  // keep the stance foot exactly planted, lift the swing foot on an arc
  const planted = Math.abs(last.footL!.pos[0] - endAlong) < Math.abs(last.footR!.pos[0] - endAlong) ? 'L' : 'R';
  const lift = Math.sin(s * Math.PI) * 8;
  if (planted === 'L') {
    pose.footL = {...stand.footL};
    pose.footR = {pos: [mix(last.footR!.pos[0], endAlong, e), DECK.y + 10 + lift, lateral + 9.5], pitch: mix(last.footR!.pitch ?? 0, 0, e), yaw: YAW_X};
  } else {
    pose.footR = {...stand.footR};
    pose.footL = {pos: [mix(last.footL!.pos[0], endAlong, e), DECK.y + 10 + lift, lateral - 9.5], pitch: mix(last.footL!.pitch ?? 0, 0, e), yaw: YAW_X};
  }
  return pose;
};
export const walkDuration = (steps = 6, speed = 118) => (steps * 58) / speed + 0.5;
