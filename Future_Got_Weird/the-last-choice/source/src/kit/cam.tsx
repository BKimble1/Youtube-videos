// Camera, parallax layers and the frame. World units: 1 unit = 1 px at zoom 1 on the 1920×1080 design frame; a cast
// member at s = 1 stands 440 units tall (≈1.75 m, so 1 m ≈ 250 units). The whole film is one SVG with viewBox
// 0 0 1920 1080, so the same source renders the 1080p review and a native 4K master (composition LastChoice4K).
import React from 'react';
import {clamp, lerp, noise} from './math';

export type Cam = {x: number; y: number; z: number; rot?: number};
/** Layer transform: p = 1 action plane; p < 1 farther (moves and zooms less); p > 1 nearer foreground. */
export const camT = (c: Cam, p = 1) => {
  const z = Math.max(0.01, 1 + (c.z - 1) * p);
  return `translate(960 540) rotate(${c.rot ?? 0}) scale(${z}) translate(${-c.x * p - (1 - p) * 960} ${-c.y * p - (1 - p) * 540})`;
};
/** Effective zoom of a layer. */
export const layerZoom = (c: Cam, p = 1) => Math.max(0.01, 1 + (c.z - 1) * p);
export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
  x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), t)), rot: lerp(a.rot ?? 0, b.rot ?? 0, t),
});
/** World → screen for a layer. */
export const toScreen = (c: Cam, x: number, y: number, p = 1) => {
  const z = layerZoom(c, p);
  const wx = x - (c.x * p + (1 - p) * 960), wy = y - (c.y * p + (1 - p) * 540);
  const r = ((c.rot ?? 0) * Math.PI) / 180;
  return {x: 960 + (wx * Math.cos(r) - wy * Math.sin(r)) * z, y: 540 + (wx * Math.sin(r) + wy * Math.cos(r)) * z};
};
/** Camera at zoom z that puts world point (wx, wy) at screen point (sx, sy). */
export const camAt = (wx: number, wy: number, sx: number, sy: number, z: number): Cam => ({x: wx - (sx - 960) / z, y: wy - (sy - 540) / z, z});
/** Camera framing a world box with a margin fraction. */
export const frameBox = (x0: number, y0: number, x1: number, y1: number, m = 0.06): Cam => {
  const w = (x1 - x0) / (1 - 2 * m), h = (y1 - y0) / (1 - 2 * m);
  return {x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: Math.min(1920 / w, 1080 / h)};
};
/** Ink width in world units for something drawn at scale s under a layer zoom z: the series' 4 px at cast size,
 *  softened at the extremes so close-ups don't turn heavy and wides don't lose their outlines. */
export const inkFor = (z: number, s = 1) => clamp(4 * s * z, 2.2, 7.5) / z;
/** Small deterministic handheld / impact shake in screen px (applied as camera offset). */
export const shake = (c: Cam, t: number, amp: number, seed = 1, freq = 9): Cam => {
  if (amp <= 0) return c;
  return {...c, x: c.x + (noise(t * freq, seed) * amp) / c.z, y: c.y + (noise(t * freq, seed + 50) * amp) / c.z, rot: (c.rot ?? 0) + noise(t * freq * 0.7, seed + 99) * amp * 0.012};
};
/** Gaussian-smoothed camera function (removes corners at key changes). */
export const smoothCam = (fn: (t: number) => Cam, t: number, win = 0.3, n = 11): Cam => {
  let x = 0, y = 0, z = 0, r = 0, ws = 0;
  for (let i = 0; i < n; i++) {
    const u = (i / (n - 1)) * 2 - 1;
    const w = Math.exp(-4 * u * u);
    const c = fn(t + u * win);
    x += c.x * w; y += c.y * w; z += Math.log(c.z) * w; r += (c.rot ?? 0) * w; ws += w;
  }
  return {x: x / ws, y: y / ws, z: Math.exp(z / ws), rot: r / ws};
};

export const Layer: React.FC<{cam: Cam; p?: number; children: React.ReactNode; opacity?: number; filter?: string}> = ({cam, p = 1, children, opacity, filter}) => (
  <g transform={camT(cam, p)} opacity={opacity} filter={filter}>{children}</g>
);

/** The film frame: one SVG, design space 1920×1080, scales to any output size. */
export const Frame: React.FC<{bg?: string; children: React.ReactNode}> = ({bg = '#000', children}) => (
  <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" style={{position: 'absolute', inset: 0, background: bg, display: 'block'}}>
    <rect x={-10} y={-10} width={1940} height={1100} fill={bg} />
    {children}
  </svg>
);

/** Screen-space colour grade and vignette (on top of a shot). */
export const Grade: React.FC<{tint?: string; tintOp?: number; vignette?: number; id?: string; flash?: number; flashColor?: string; black?: number}> = ({tint, tintOp = 0, vignette = 0.35, id = 'vg', flash = 0, flashColor = '#FFF4DC', black = 0}) => (
  <g pointerEvents="none">
    <defs>
      <radialGradient id={id} cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor="#000" stopOpacity={0} />
        <stop offset="100%" stopColor="#000" stopOpacity={vignette} />
      </radialGradient>
    </defs>
    {tint && tintOp > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={tint} opacity={tintOp} style={{mixBlendMode: 'multiply'}} /> : null}
    <rect x={0} y={0} width={1920} height={1080} fill={`url(#${id})`} />
    {flash > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={flashColor} opacity={clamp(flash)} /> : null}
    {black > 0 ? <rect x={0} y={0} width={1920} height={1080} fill="#000" opacity={clamp(black)} /> : null}
  </g>
);
