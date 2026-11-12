// The robot world's camera: keyframes (yaw relative to the walker's heading, pitch, distance, aim offset in the
// walker's frame, field of view) on a periodic Catmull-Rom spline, so the camera is continuous everywhere and the
// last frame's camera equals frame 0's (the loop). Projection is a plain pinhole onto the 1080x1920 frame.
import {V3, v3, lerp} from '../lib';
import {DUR} from './timing';
import {smoothCentre, smoothHeading} from './robot';

export const W = 1080, H = 1920;
type Key = {t: number; yaw: number; pitch: number; dist: number; fwd: number; side: number; up: number; fov: number};
const K = (t: number, yaw: number, pitch: number, dist: number, fwd = 0, side = 0, up = 0, fov = 34): Key =>
  ({t, yaw, pitch, dist, fwd, side, up, fov});
// yaw: 0 = in front of the walker looking back at it; +90 = on its left (+heading rotation side)
const camHeading = smoothHeading;
// V3: the camera is a list of SHOTS. Inside a shot it moves on a clamped Catmull-Rom spline; between shots it cuts
// (each cut lands on a word or an action). The last shot ends on the first shot's opening key (the loop).
type Shot = {t0: number; t1: number; keys: Key[]};
const OPEN = (t: number) => K(t, 36, 17, 36, 0.8, 0, 2.2, 50);
export const SHOTS: Shot[] = [
  {t0: 0, t1: 2.9, keys: [OPEN(0), K(1.3, 32, 13, 27, 1.5, 0, 1.6, 46), K(2.05, 18, 40, 13, 0.3, 0, 1.2, 38), K(2.55, 4, 80, 5.6, 0, 0, 0.75, 34), K(2.9, 2, 85, 4.2, 0, 0, 0.75, 34)]},
  // (macro / signal world 2.82-9.4)
  {t0: 9.0, t1: 18.45, keys: [
    K(9.0, -156, 12, 15.5, -4.0, 2.9, -1.0, 40), K(9.4, -156, 12, 15, -4.0, 2.9, -1.0, 40), // beside the leg the spike drives
    K(10.6, -150, 16, 32, -0.8, 0.8, 1.8, 48), // the whole step
    K(11.85, -114, 33, 15.5, 0, 0, 2.6, 40), // close on the culture before the lamp (one slow spike at 12.13)
    K(13.4, -108, 31, 15.5, 0, 0, 2.5, 40), // lamp on 12.51; UV bursts from 12.95
    K(14.6, -95, 18, 40, 0, 0, 2.6, 48), // back out: the paired, faster gait
    K(16.15, -85, 18, 40, 0, 0, 2.4, 48),
    K(17.35, -55, 50, 30, 0, 0, 0, 44), // high three-quarter into the dome: no brain
    K(18.45, -42, 47, 27, 0, 0, 0, 44)]},
  {t0: 18.45, t1: 21.85, keys: [ // cut on "No": low and head-on, then a gentle rise as it shuffles and wanders
    K(18.45, 6, 7, 24, 1.0, 0, 0.9, 46), K(19.5, 4, 8, 25, 0.8, 0, 0.9, 46), K(20.7, 22, 30, 38, 0, 0, 0.6, 48), K(21.85, 40, 42, 46, 0, 0, 0.3, 48)]},
  {t0: 21.85, t1: 24.75, keys: [ // cut on "But": the leg mechanism (leg 4, the side away from the cable: socket, chambers, foot) with the culture at frame edge
    K(21.85, -160, 13, 23, 1.6, -5.0, 0.3, 40), K(24.75, -156, 15, 19.5, 1.5, -4.8, 0.4, 40)]},
  {t0: 24.75, t1: DUR, keys: [ // cut on "Which": the whole walking motion side-on, easing into the opening framing
    K(24.75, 92, 14, 42, 0, 0, 2.4, 48), K(26.4, 70, 15, 39, 0.4, 0, 2.3, 49), OPEN(DUR)]},
];
const shotOf = (t: number) => SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? (t >= DUR ? SHOTS[SHOTS.length - 1] : SHOTS[0]);
const absYaw = (sh: Shot) => {
  const out: number[] = [];
  sh.keys.forEach((k, i) => {
    let a = (camHeading(k.t) * 180) / Math.PI + k.yaw;
    if (i > 0) { while (a - out[i - 1] > 180) a -= 360; while (a - out[i - 1] < -180) a += 360; }
    out.push(a);
  });
  return out;
};
const ABS = new Map(SHOTS.map((s) => [s, absYaw(s)]));
const cr = (p0: number, p1: number, p2: number, p3: number, t0: number, t1: number, t2: number, t3: number, t: number) => {
  const a1 = ((t1 - t) * p0 + (t - t0) * p1) / (t1 - t0), a2 = ((t2 - t) * p1 + (t - t1) * p2) / (t2 - t1), a3 = ((t3 - t) * p2 + (t - t2) * p3) / (t3 - t2);
  const b1 = ((t2 - t) * a1 + (t - t0) * a2) / (t2 - t0), b2 = ((t3 - t) * a2 + (t - t1) * a3) / (t3 - t1);
  return ((t2 - t) * b1 + (t - t1) * b2) / (t2 - t1);
};
const interp = (sh: Shot, t: number, f: (k: Key, a: number) => number) => {
  const ks = sh.keys, A = ABS.get(sh)!, n = ks.length;
  if (n === 1) return f(ks[0], A[0]);
  let i = 0;
  while (i < n - 2 && t >= ks[i + 1].t) i++;
  const u = Math.min(1, Math.max(0, (t - ks[i].t) / (ks[i + 1].t - ks[i].t)));
  // clamped ends (mirrored phantom keys) and an eased parameter, so each shot starts and ends at rest
  const v = (j: number) => (j < 0 ? 2 * f(ks[0], A[0]) - f(ks[1], A[1]) : j >= n ? 2 * f(ks[n - 1], A[n - 1]) - f(ks[n - 2], A[n - 2]) : f(ks[j], A[j]));
  const kt = (j: number) => (j < 0 ? 2 * ks[0].t - ks[1].t : j >= n ? 2 * ks[n - 1].t - ks[n - 2].t : ks[j].t);
  const ue = i === 0 && n === 2 ? u * u * (3 - 2 * u) : i === 0 ? u * u * (2 - u) : i === n - 2 ? u * (1 + u - u * u) : u;
  const tt = ks[i].t + ue * (ks[i + 1].t - ks[i].t);
  return cr(v(i - 1), v(i), v(i + 1), v(i + 2), kt(i - 1), kt(i), kt(i + 1), kt(i + 2), tt);
};
export type Cam = {pos: V3; fwd: V3; right: V3; up: V3; fpx: number; target: V3};
export const camAt = (t0: number): Cam => {
  const t = t0 >= DUR - 1e-9 && t0 <= DUR + 1e-9 ? DUR : ((t0 % DUR) + DUR) % DUR;
  const sh = shotOf(t);
  const yaw = (interp(sh, t, (_k, a) => a) * Math.PI) / 180;
  const pitch = (interp(sh, t, (k) => k.pitch) * Math.PI) / 180;
  const dist = interp(sh, t, (k) => k.dist);
  const fov = (interp(sh, t, (k) => k.fov) * Math.PI) / 180;
  const th = camHeading(t);
  const c = smoothCentre(t);
  const f: V3 = [Math.cos(th), 0, Math.sin(th)], s: V3 = [-Math.sin(th), 0, Math.cos(th)];
  const target = v3.add(c, v3.add(v3.mul(f, interp(sh, t, (k) => k.fwd)), v3.add(v3.mul(s, interp(sh, t, (k) => k.side)), [0, interp(sh, t, (k) => k.up), 0])));
  const pos: V3 = v3.add(target, [dist * Math.cos(pitch) * Math.cos(yaw), dist * Math.sin(pitch), dist * Math.cos(pitch) * Math.sin(yaw)]);
  const fw = v3.nrm(v3.sub(target, pos));
  const right = v3.nrm(v3.cross(fw, [0, 1, 0]));
  const up = v3.cross(right, fw);
  return {pos, fwd: fw, right, up, fpx: H / 2 / Math.tan(fov / 2), target};
};
export const NEAR = 0.6;
/** camera-space coordinates: [x right, y up, z depth] */
export const toCam = (c: Cam, p: V3): V3 => {
  const d = v3.sub(p, c.pos);
  return [v3.dot(d, c.right), v3.dot(d, c.up), v3.dot(d, c.fwd)];
};
export const proj = (c: Cam, p: V3): [number, number, number] => {
  const q = toCam(c, p);
  const z = Math.max(q[2], 0.05);
  return [W / 2 + (c.fpx * q[0]) / z, H / 2 - (c.fpx * q[1]) / z, q[2]];
};
/** clip a world polygon against the near plane, then project */
export const projPoly = (c: Cam, ps: V3[]): [number, number][] => {
  const q = ps.map((p) => toCam(c, p));
  const out: V3[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i], b = q[(i + 1) % q.length];
    const ain = a[2] > NEAR, bin = b[2] > NEAR;
    if (ain) out.push(a);
    if (ain !== bin) { const k = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), NEAR]); }
  }
  return out.map((p) => [W / 2 + (c.fpx * p[0]) / p[2], H / 2 - (c.fpx * p[1]) / p[2]]);
};
/** project a segment with near-plane clipping (null if fully behind) */
export const projSeg = (c: Cam, a: V3, b: V3): [[number, number], [number, number]] | null => {
  let p = toCam(c, a), q = toCam(c, b);
  if (p[2] <= NEAR && q[2] <= NEAR) return null;
  if (p[2] < NEAR) { const k = (NEAR - p[2]) / (q[2] - p[2]); p = [lerp(p[0], q[0], k), lerp(p[1], q[1], k), NEAR]; }
  if (q[2] < NEAR) { const k = (NEAR - q[2]) / (p[2] - q[2]); q = [lerp(q[0], p[0], k), lerp(q[1], p[1], k), NEAR]; }
  return [[W / 2 + (c.fpx * p[0]) / p[2], H / 2 - (c.fpx * p[1]) / p[2]], [W / 2 + (c.fpx * q[0]) / q[2], H / 2 - (c.fpx * q[1]) / q[2]]];
};
/** pixels per cm at a world point (for line widths that scale with depth) */
export const pxPerCm = (c: Cam, p: V3) => c.fpx / Math.max(0.05, toCam(c, p)[2]);
