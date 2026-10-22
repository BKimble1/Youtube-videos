// World-space camera for SVG scenes. A scene draws in its own world units; the camera puts world point (x, y) at the
// frame centre with zoom z (screen px per world unit) and roll rot (deg). Depth layers parallax around the same centre.
import React from 'react';
import {clamp01, easeInOut, lerp, smooth} from './core';

export type Cam = {x: number; y: number; z: number; rot?: number};
export const W = 1920, H = 1080;

export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)),
  rot: lerp(a.rot ?? 0, b.rot ?? 0, t),
});

/** A camera move through keyframes [t, cam, ease?]; holds the first/last key outside the range. Zoom interpolates in
 *  log space and each segment is eased (default easeInOut), so moves start and land softly. */
export type Key = [number, Cam, ((x: number) => number)?];
export const camPath = (keys: Key[]) => (t: number): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, c0] = keys[i], [t1, c1, e] = keys[i + 1];
    if (t <= t1) return mixCam(c0, c1, (e ?? easeInOut)(clamp01((t - t0) / Math.max(1e-6, t1 - t0))));
  }
  return keys[keys.length - 1][1];
};

/** Gaussian-weighted average of a camera function around t (removes corners where keys meet). */
export const smoothCam = (fn: (t: number) => Cam, t: number, w = 0.2, n = 9): Cam => {
  let x = 0, y = 0, z = 0, r = 0, s = 0;
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const k = Math.exp(-4 * u * u);
    const c = fn(t + u * w);
    x += c.x * k; y += c.y * k; z += Math.log(c.z) * k; r += (c.rot ?? 0) * k; s += k;
  }
  return {x: x / s, y: y / s, z: Math.exp(z / s), rot: r / s};
};

/** Small deterministic handheld drift (screen px). */
export const handheld = (c: Cam, t: number, amp = 3, seed = 1): Cam => ({
  ...c,
  x: c.x + (Math.sin(t * 1.3 + seed) * 0.6 + Math.sin(t * 2.9 + seed * 2) * 0.4) * amp / c.z,
  y: c.y + (Math.sin(t * 1.1 + seed * 3) * 0.6 + Math.sin(t * 3.3 + seed) * 0.4) * amp / c.z,
});

/** Impact shake that decays after t0 (screen px). */
export const kick = (c: Cam, t: number, t0: number, amp = 10, dur = 0.35): Cam => {
  if (t < t0 || t > t0 + dur) return c;
  const k = (1 - (t - t0) / dur) ** 2 * amp;
  return {...c, x: c.x + (Math.sin((t - t0) * 70) * k) / c.z, y: c.y + (Math.cos((t - t0) * 53) * k) / c.z};
};

export const camTransform = (c: Cam, depth = 1) => {
  // depth < 1 = behind the subject plane (moves less, smaller), > 1 = in front
  const z = c.z * depth;
  return `translate(${W / 2} ${H / 2}) rotate(${(c.rot ?? 0) * depth}) scale(${z}) translate(${-c.x} ${-c.y})`;
};

/** Full-frame SVG with a camera. Children draw in world units. */
export const Stage: React.FC<{cam: Cam; bg?: string; children: React.ReactNode; style?: React.CSSProperties}> = ({cam, bg, children, style}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, ...style}}>
    {bg && <rect width={W} height={H} fill={bg} />}
    <g transform={camTransform(cam)}>{children}</g>
  </svg>
);
/** A world layer at a parallax depth inside a Stage-like svg (use with a raw <svg>). */
export const Layer: React.FC<{cam: Cam; depth: number; children: React.ReactNode; opacity?: number; filter?: string}> = ({cam, depth, children, opacity, filter}) => (
  <g transform={camTransform(cam, depth)} opacity={opacity} style={filter ? {filter} : undefined}>{children}</g>
);

/** World → screen for a camera. */
export const toScreen = (c: Cam, x: number, y: number): [number, number] => {
  const r = ((c.rot ?? 0) * Math.PI) / 180;
  const dx = (x - c.x) * c.z, dy = (y - c.y) * c.z;
  return [W / 2 + dx * Math.cos(r) - dy * Math.sin(r), H / 2 + dx * Math.sin(r) + dy * Math.cos(r)];
};

/** Iris/zoom transition helper: 0..1 eased. */
export const ease = (t: number, a: number, b: number) => smooth(clamp01((t - a) / (b - a)));
