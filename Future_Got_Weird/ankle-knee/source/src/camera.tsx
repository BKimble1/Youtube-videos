// The camera: a side-on lens over flat, layered artwork. Cam {x, y, w} frames w centimetres across the 1080 px width
// at the subject plane (where Wyatt stands, distance D0 from the lens), centred on world (x, y). The eye height `eye`
// (world y; the ground is y = 0, up is negative) sets the horizon. A layer at distance D is scaled by D0 / D about the
// eye line, so the turf recedes toward the horizon and the far field moves less than the subject as the camera
// tracks. Captions are drawn outside every camera transform.
import React from 'react';
import {clamp, lerp, ss5} from './lib';

export type Cam = {x: number; y: number; w: number; eye: number};
export const W = 1080, H = 1920;
export const D0 = 170;

/** px per cm at the subject plane */
export const camScale = (c: Cam) => W / c.w;
/** screen y of the horizon (the eye line) */
export const horizonY = (c: Cam) => H / 2 + camScale(c) * (c.eye - c.y);
/** SVG transform for a flat layer at distance D (D0 = the subject plane) */
export const layerTransform = (c: Cam, D = D0) => {
  const s0 = camScale(c);
  const k = s0 * (D0 / D);
  const yh = horizonY(c);
  return `translate(${(W / 2).toFixed(3)} ${yh.toFixed(3)}) scale(${k.toFixed(5)}) translate(${(-c.x).toFixed(4)} ${(-c.eye).toFixed(4)})`;
};
/** world (subject plane) -> screen */
export const toScreen = (c: Cam, p: {x: number; y: number}) => ({x: W / 2 + camScale(c) * (p.x - c.x), y: H / 2 + camScale(c) * (p.y - c.y)});
/** the world rectangle the camera sees at the subject plane */
export const viewRect = (c: Cam, m = 1.05): [number, number, number, number] => {
  const hw = (c.w / 2) * m, hh = ((c.w * H) / W / 2) * m;
  return [c.x - hw, c.y - hh, c.x + hw, c.y + hh];
};

export const Layer: React.FC<{c: Cam; D?: number; opacity?: number; blur?: number; children: React.ReactNode}> = ({c, D = D0, opacity, blur, children}) => (
  <div style={{position: 'absolute', inset: 0, opacity, filter: blur && blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={layerTransform(c, D)}>{children}</g>
    </svg>
  </div>
);

export const lerpCam = (A: Cam, B: Cam, u: number): Cam => ({
  x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), w: Math.exp(lerp(Math.log(A.w), Math.log(B.w), u)), eye: lerp(A.eye, B.eye, u),
});
/** a zoom that is a pure scale about one fixed screen point (no slip), w in log space */
export const zoomAbout = (u: number, A: Cam, B: Cam): Cam => {
  const e = ss5(clamp(u), 0, 1);
  const wv = Math.exp(lerp(Math.log(A.w), Math.log(B.w), e));
  const eye = lerp(A.eye, B.eye, e);
  if (Math.abs(A.w - B.w) < 1e-9) return {x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), w: wv, eye};
  const px = (A.x / A.w - B.x / B.w) / (1 / A.w - 1 / B.w), py = (A.y / A.w - B.y / B.w) / (1 / A.w - 1 / B.w);
  return {x: px + (A.x - px) * (wv / A.w), y: py + (A.y - py) * (wv / A.w), w: wv, eye};
};
export const travel = (u: number, A: Cam, B: Cam): Cam => lerpCam(A, B, ss5(clamp(u), 0, 1));
export type CKey = [number, Cam, ((u: number, A: Cam, B: Cam) => Cam)?];
export const glide = (t: number, keys: CKey[]): Cam => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, A] = keys[i - 1], [t1, B, mv] = keys[i];
      return (mv ?? travel)((t - t0) / (t1 - t0 || 1), A, B);
    }
  }
  return keys[keys.length - 1][1];
};
/** a world point on a layer at distance D -> screen */
export const proj = (c: Cam, D: number, p: {x: number; y: number}) => {
  const k = camScale(c) * (D0 / D);
  return {x: W / 2 + k * (p.x - c.x), y: horizonY(c) + k * (p.y - c.eye)};
};
/** distance of the ground (y = 0) seen at screen row y (Infinity above the horizon) */
export const groundD = (c: Cam, y: number) => {
  const dy = y - horizonY(c);
  return dy <= 0 ? Infinity : (camScale(c) * D0 * (0 - c.eye)) / dy;
};
