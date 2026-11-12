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
export const KEYS: Key[] = [
  K(0, 36, 17, 36, 0.8, 0, 0.6, 50), // frame 0: the whole walker mid-step
  K(1.3, 32, 13, 27, 1.5, 0, 0.6, 46), // subtle push-in
  K(2.05, 18, 40, 13, 0.3, 0, 1.2, 38), // rise over the hub
  K(2.55, 4, 80, 5.6, 0, 0, 0.75, 34), // into the dome: the culture fills the frame
  K(2.85, 2, 84, 4.4, 0, 0, 0.75, 34),
  // (macro / signal world on screen 2.82-9.4)
  K(9.4, -156, 12, 15, -4.0, 2.9, -1.0, 40), // beside the leg the followed spike drives
  K(10.5, -150, 16, 32, -0.8, 0.8, 0.5, 48), // the whole step
  K(11.6, -120, 30, 22, 0, 0, 2.5, 44), // toward the culture as the lamp comes in
  K(12.6, -112, 34, 15, 0, 0, 2.6, 40), // UV on the culture: the pulses
  K(13.7, -108, 30, 17, 0, 0, 2.2, 42),
  K(14.7, -95, 17, 40, 0, 0, 1.2, 48), // back out: the faster gait
  K(16.2, -85, 18, 40, 0, 0, 1.0, 48),
  K(17.3, -55, 50, 30, 0, 0, 0, 44), // high three-quarter: into the dome, no brain
  K(18.1, -40, 46, 27, 0, 0, 0, 44),
  K(18.85, 8, 7, 24, 1.0, 0, 0.9, 46), // low, head-on: no eyes
  K(19.6, 5, 8, 25, 0.8, 0, 0.9, 46),
  K(20.6, 20, 30, 40, 0, 0, 0.5, 48),
  K(21.6, 60, 45, 52, 0, 0, 0, 48), // high and wide: wandering
  K(22.5, 95, 24, 44, 0, 0, 1.0, 48), // the whole biohybrid robot
  K(24.6, 75, 20, 40, 0, 0, 1.0, 48),
  K(26.3, 52, 18, 38, 0.8, 0, 0.8, 50),
  K(DUR, 36, 17, 36, 0.8, 0, 0.6, 50), // = frame 0
];
const camHeading = smoothHeading;
// absolute yaw at each key (degrees), unwrapped so consecutive keys take the short way round
const ABS = (() => {
  const out: number[] = [];
  KEYS.forEach((k, i) => {
    let a = (camHeading(k.t) * 180) / Math.PI + k.yaw;
    if (i > 0) { while (a - out[i - 1] > 180) a -= 360; while (a - out[i - 1] < -180) a += 360; }
    out.push(a);
  });
  return out;
})();
// the loop: the last key equals the first plus whole turns (heading closes after 2 pi) -> same camera
export const KEY_LOOP_CHECK = ABS[ABS.length - 1] - ABS[0];

const cr = (p0: number, p1: number, p2: number, p3: number, t0: number, t1: number, t2: number, t3: number, t: number) => {
  // non-uniform Catmull-Rom (Barry-Goldman) on time knots
  const a1 = ((t1 - t) * p0 + (t - t0) * p1) / (t1 - t0);
  const a2 = ((t2 - t) * p1 + (t - t1) * p2) / (t2 - t1);
  const a3 = ((t3 - t) * p2 + (t - t2) * p3) / (t3 - t2);
  const b1 = ((t2 - t) * a1 + (t - t0) * a2) / (t2 - t0);
  const b2 = ((t3 - t) * a2 + (t - t1) * a3) / (t3 - t1);
  return ((t2 - t) * b1 + (t - t1) * b2) / (t2 - t1);
};
const n = KEYS.length;
const knot = (i: number) => (i < 0 ? KEYS[n - 1 + i].t - DUR : i >= n ? KEYS[i - n + 1].t + DUR : KEYS[i].t);
const val = (i: number, f: (k: Key, a: number) => number) => {
  if (i < 0) return f(KEYS[n - 1 + i], ABS[n - 1 + i] - KEY_LOOP_CHECK);
  if (i >= n) return f(KEYS[i - n + 1], ABS[i - n + 1] + KEY_LOOP_CHECK);
  return f(KEYS[i], ABS[i]);
};
const interp = (t: number, f: (k: Key, a: number) => number) => {
  let i = 0;
  while (i < n - 2 && t >= KEYS[i + 1].t) i++;
  return cr(val(i - 1, f), val(i, f), val(i + 1, f), val(i + 2, f), knot(i - 1), knot(i), knot(i + 1), knot(i + 2), t);
};

export type Cam = {pos: V3; fwd: V3; right: V3; up: V3; fpx: number; target: V3};
export const camAt = (t0: number): Cam => {
  const t = ((t0 % DUR) + DUR) % DUR;
  const yaw = (interp(t, (_k, a) => a) * Math.PI) / 180;
  const pitch = (interp(t, (k) => k.pitch) * Math.PI) / 180;
  const dist = interp(t, (k) => k.dist);
  const fov = (interp(t, (k) => k.fov) * Math.PI) / 180;
  const th = camHeading(t);
  const c = smoothCentre(t);
  const f: V3 = [Math.cos(th), 0, Math.sin(th)], s: V3 = [-Math.sin(th), 0, Math.cos(th)];
  const target = v3.add(c, v3.add(v3.mul(f, interp(t, (k) => k.fwd)), v3.add(v3.mul(s, interp(t, (k) => k.side)), [0, interp(t, (k) => k.up), 0])));
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
