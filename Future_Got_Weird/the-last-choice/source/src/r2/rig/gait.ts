// Gait over uneven ground, in WORLD metres. Feet are planted at fixed world points during stance (no sliding), swing
// on an arc to the next foothold, and follow the terrain height; the pelvis bobs twice per stride. Distance along a
// path drives everything, so a figure can walk, run, limp or stop cleanly and the same distance gives the same frame.
import {clamp, smooth, lerp} from '../../kit/math';
import {V3} from '../../kit/math';
import {Pose} from './poses';

export type XZ = {x: number; z: number};
export type GaitW = {stride: number; duty: number; lift: number; bob: number; armAmp: number; lean: number; limp?: {side: 'L' | 'R'; amt: number}};
export const WALK_W: GaitW = {stride: 0.95, duty: 0.62, lift: 0.07, bob: 5, armAmp: 18, lean: 3};
export const HURRY_W: GaitW = {stride: 1.25, duty: 0.5, lift: 0.1, bob: 7, armAmp: 26, lean: 8};
export const RUN_W: GaitW = {stride: 1.75, duty: 0.36, lift: 0.17, bob: 10, armAmp: 42, lean: 16};
export const SPRINT_W: GaitW = {stride: 2.15, duty: 0.32, lift: 0.21, bob: 12, armAmp: 52, lean: 22};
export const LIMP_W: GaitW = {stride: 0.8, duty: 0.66, lift: 0.05, bob: 4, armAmp: 10, lean: 6, limp: {side: 'L', amt: 0.6}};

/** Point and heading at distance d along a polyline path (clamped at the ends). */
export const pathAt = (path: XZ[], d: number): {x: number; z: number; heading: number} => {
  let rem = Math.max(0, d);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const L = Math.hypot(b.x - a.x, b.z - a.z);
    const hd = (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
    if (rem <= L || i === path.length - 2) {
      const k = L > 0 ? Math.min(1, rem / L) : 0;
      // smooth the heading through corners over ±0.6 m
      let h = hd;
      if (i < path.length - 2 && L - rem < 0.6) {
        const c = path[i + 2];
        const h2 = (Math.atan2(c.x - b.x, -(c.z - b.z)) * 180) / Math.PI;
        let dh = ((h2 - hd + 540) % 360) - 180;
        h = hd + dh * smooth((0.6 - (L - rem)) / 1.2);
      }
      return {x: lerp(a.x, b.x, k), z: lerp(a.z, b.z, k), heading: h};
    }
    rem -= L;
  }
  const a = path[path.length - 1];
  return {x: a.x, z: a.z, heading: 0};
};
export const pathLen = (path: XZ[]) => path.slice(1).reduce((s, b, i) => s + Math.hypot(b.x - path[i].x, b.z - path[i].z), 0);

export type GaitOut = {pos: V3; heading: number; footL: V3; footR: V3; pose: Pose; phase: number; stanceL: boolean; stanceR: boolean};

/**
 * Walk/run along `path` at distance `dist` (m). `ground(x,z)` gives terrain height. `stopAt` (optional) eases the
 * last metre so both feet land.
 */
export const gaitW = (path: XZ[], dist: number, o: GaitW, ground: (x: number, z: number) => number, hipX = 0.15): GaitOut => {
  const W = o.stride;
  const injL = o.limp?.side === 'L', injR = o.limp?.side === 'R';
  const foot = (phi: number, side: number, injured: boolean) => {
    const duty = injured && o.limp ? o.duty * (1 - 0.32 * o.limp.amt) : o.duty;
    const c = dist / W + phi;
    const k = Math.floor(c);
    const u = c - k;
    const plantD = (kk: number) => (kk - phi) * W + (W * duty) / 2;
    let d: number, lift = 0, pitch = 0, stance = false;
    if (u < duty) { d = plantD(k); stance = true; pitch = clamp((u - (duty - 0.16)) / 0.16) * 22; }
    else {
      const w = (u - duty) / (1 - duty);
      d = lerp(plantD(k), plantD(k + 1), smooth(w));
      lift = Math.sin(Math.PI * Math.min(1, w * 1.05)) * o.lift * (injured && o.limp ? 1 - 0.45 * o.limp.amt : 1);
      pitch = lerp(22, -10, clamp(w * 2)) * (1 - clamp((w - 0.7) / 0.3));
    }
    const p = pathAt(path, d);
    const hr = (p.heading * Math.PI) / 180;
    // lateral offset to the foot's side (right of heading = +side)
    const rx = Math.cos(hr), rz = Math.sin(hr);
    const x = p.x + rx * hipX * side, z = p.z + rz * hipX * side;
    return {pos: {x, y: ground(x, z) + lift, z}, pitch, stance};
  };
  const R = foot(0, 1, injR), L = foot(0.5, -1, injL);
  const c = dist / W;
  let drop = o.bob * (0.5 - 0.5 * Math.cos(4 * Math.PI * (c - o.duty / 2)));
  let side = 0;
  if (o.limp) {
    const uInj = ((c + (injL ? 0.5 : 0)) % 1 + 1) % 1;
    const onBad = uInj < o.duty * (1 - 0.32 * o.limp.amt);
    drop += onBad ? 0 : o.limp.amt * 6 * Math.sin(Math.PI * clamp((uInj - o.duty) / (1 - o.duty)));
    side = (injL ? 1 : -1) * o.limp.amt * 6 * (onBad ? 0.4 : 1);
  }
  const p = pathAt(path, dist);
  const amp = o.armAmp;
  const sw = Math.sin(2 * Math.PI * c);
  const pose: Pose = {
    drop, side, lean: o.lean,
    armL: {fk: {fwd: amp * sw, out: 10, bend: 18 + Math.max(0, amp * 0.6 * sw)}},
    armR: {fk: {fwd: -amp * sw, out: 10, bend: 18 + Math.max(0, -amp * 0.6 * sw)}},
    legL: {pitch: L.pitch}, legR: {pitch: R.pitch},
    breath: 0.35,
  };
  return {pos: {x: p.x, y: ground(p.x, p.z), z: p.z}, heading: p.heading, footL: L.pos, footR: R.pos, pose, phase: c, stanceL: L.stance, stanceR: R.stance};
};
