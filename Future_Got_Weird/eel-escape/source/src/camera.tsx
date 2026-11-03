// The camera: a pinhole dolly over flat, layered artwork (the FGW depth-layer model). A camera {x, y, w} frames w
// world units across the 1080 px width at the reference plane (depth z = 0). A layer at depth z (+ farther from the
// lens, - nearer) is scaled by d / (d + z) about the frame centre, with d = DIST * w, so a push-in moves near layers
// more than far ones; layers away from the focus depth are softened. `k` squashes the table plane vertically (the
// camera tilting from straight down at the bone to a high three-quarter view of the room).
import React from 'react';
import {P, pt} from './core/geo';
import {clamp, lerp, ss5} from './lib';

export type Cam = {x: number; y: number; w: number; k?: number; focus?: number};
export const DIST = 2.2;
export const W = 1080, H = 1920;

/** screen scale (px per world unit) of a layer at depth z */
export const layerScale = (c: Cam, z: number) => {
  const d = DIST * c.w;
  return (W / c.w) * (d / (d + z));
};
/** the blur (px) of a layer at depth z for a camera focused at depth c.focus */
export const layerBlur = (c: Cam, z: number, k = 60) => {
  const d = DIST * c.w;
  const f = c.focus ?? 0;
  return (k * Math.abs(z - f)) / Math.max(1e-6, d + z);
};
/** the SVG transform that maps world units at depth z to the screen */
export const camTransform = (c: Cam, z = 0) => {
  const s = layerScale(c, z);
  const k = c.k ?? 1;
  return `translate(${W / 2} ${H / 2}) scale(${s} ${s * k}) translate(${-c.x} ${-c.y})`;
};
/** world point (depth z) -> screen */
export const toScreen = (c: Cam, p: P, z = 0): P => {
  const s = layerScale(c, z);
  return pt(W / 2 + s * (p.x - c.x), H / 2 + s * (c.k ?? 1) * (p.y - c.y));
};
/** screen -> world point (depth z) */
export const toWorld = (c: Cam, q: P, z = 0): P => {
  const s = layerScale(c, z);
  return pt(c.x + (q.x - W / 2) / s, c.y + (q.y - H / 2) / (s * (c.k ?? 1)));
};
/** the world rectangle the camera sees at depth z: [x0, y0, x1, y1] (for culling) */
export const viewRect = (c: Cam, z = 0, margin = 1.1): [number, number, number, number] => {
  const s = layerScale(c, z);
  const hw = (W / 2 / s) * margin, hh = (H / 2 / (s * (c.k ?? 1))) * margin;
  return [c.x - hw, c.y - hh, c.x + hw, c.y + hh];
};

/** one depth layer: its own SVG, the camera transform for its depth, and depth-of-field blur */
export const Layer: React.FC<{c: Cam; z?: number; blurK?: number; minBlur?: number; maxBlur?: number; opacity?: number; children: React.ReactNode}> = ({
  c, z = 0, blurK = 60, minBlur = 0, maxBlur = 28, opacity, children,
}) => {
  const b = Math.max(minBlur, Math.min(maxBlur, layerBlur(c, z, blurK)));
  return (
    <div style={{position: 'absolute', inset: 0, opacity, filter: b > 0.45 ? `blur(${b.toFixed(1)}px)` : undefined}}>
      <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <g transform={camTransform(c, z)}>{children}</g>
      </svg>
    </div>
  );
};

/** a zoom between two cameras that is a pure scale about one fixed point (no slip), w interpolated in log space */
export const zoomAbout = (u: number, A: Cam, B: Cam, ease: (x: number) => number = (x) => ss5(x, 0, 1)): Cam => {
  const e = ease(clamp(u));
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  const k = lerp(A.k ?? 1, B.k ?? 1, e);
  const focus = lerp(A.focus ?? 0, B.focus ?? 0, e);
  if (Math.abs(A.w - B.w) < 1e-9) return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: wv, k, focus};
  const P0 = pt((A.x / A.w - B.x / B.w) / (1 / A.w - 1 / B.w), (A.y / A.w - B.y / B.w) / (1 / A.w - 1 / B.w));
  return {x: P0.x + (A.x - P0.x) * (wv / A.w), y: P0.y + (A.y - P0.y) * (wv / A.w), w: wv, k, focus};
};
/** a move whose centre travels in a straight line while the width changes in log space (tracking shots) */
export const travel = (u: number, A: Cam, B: Cam, ease: (x: number) => number = (x) => ss5(x, 0, 1)): Cam => {
  const e = ease(clamp(u));
  return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: Math.exp(lerp(Math.log(A.w), Math.log(B.w), e)), k: lerp(A.k ?? 1, B.k ?? 1, e), focus: lerp(A.focus ?? 0, B.focus ?? 0, e)};
};
export type Key = [number, Cam, ((u: number, A: Cam, B: Cam) => Cam)?];
/** piecewise camera path through keys (each segment: zoomAbout unless a mover is given) */
export const glide = (t: number, keys: Key[]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, A] = keys[i - 1], [t1, B, mv] = keys[i];
      const u = (t - t0) / (t1 - t0 || 1);
      return (mv ?? zoomAbout)(u, A, B);
    }
  }
  return keys[keys.length - 1][1];
};
/** the camera of a nested world drawn inside a host at origin with scale k (host units per nested unit) */
export const toHost = (c: Cam, origin: P, k: number): Cam => ({...c, x: origin.x + c.x * k, y: origin.y + c.y * k, w: c.w * k});
export const toNested = (c: Cam, origin: P, k: number): Cam => ({...c, x: (c.x - origin.x) / k, y: (c.y - origin.y) / k, w: c.w / k});
