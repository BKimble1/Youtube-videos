// Landscape 2.5D camera (after dc/camera.tsx, the Death Clock rig's camera): a shot places flat vector layers at
// relative depths (1 = the subject plane, >1 farther, <1 nearer). The camera names the world point at screen centre and
// a zoom; farther layers pan and zoom less, which gives restrained parallax from drawn planes.
import React from 'react';
import {H, W} from './core';

const f4 = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(4));
export type Cam = {x: number; y: number; z: number; roll?: number};
/** world anchor that is at screen centre when the camera rests at x=W/2, y=H/2, z=1 */
const AX = W / 2;
const AY = H / 2;
export const layerTransform = (cam: Cam, depth: number) => {
  const d = Math.max(0.2, depth);
  const z = 1 + (cam.z - 1) / d;
  const cx = AX + (cam.x - AX) / d;
  const cy = AY + (cam.y - AY) / d;
  const roll = (cam.roll ?? 0) / Math.max(1, d * 0.6);
  return `translate(${W / 2} ${H / 2}) rotate(${f4(roll)}) scale(${f4(z)}) translate(${f4(-cx)} ${f4(-cy)})`;
};
export const Layer: React.FC<{cam: Cam; depth?: number; children: React.ReactNode; opacity?: number}> = ({cam, depth = 1, children, opacity}) => (
  <g transform={layerTransform(cam, depth)} opacity={opacity}>
    {children}
  </g>
);
/** world (subject plane) -> screen */
export const toScreen = (cam: Cam, p: {x: number; y: number}) => ({x: W / 2 + (p.x - cam.x) * cam.z, y: H / 2 + (p.y - cam.y) * cam.z});
/** interpolate cameras with zoom interpolated in log space (constant apparent zoom speed) */
export const lerpCam = (a: Cam, b: Cam, t: number): Cam => {
  const z = Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * t);
  // keep the screen-centre path straight in screen terms: blend the centre weighted by zoom
  const wa = (1 - t) * a.z;
  const wb = t * b.z;
  return {x: (a.x * wa + b.x * wb) / (wa + wb), y: (a.y * wa + b.y * wb) / (wa + wb), z, roll: (a.roll ?? 0) * (1 - t) + (b.roll ?? 0) * t};
};
/** camera path through keyed cameras (seconds) */
export const camPath = (f: number, ks: [number, Cam][], e: (t: number) => number) => {
  const t = f / 30;
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [a, ca] = ks[i];
    const [b, cb] = ks[i + 1];
    if (t <= b) return lerpCam(ca, cb, e(Math.min(1, Math.max(0, (t - a) / (b - a)))));
  }
  return ks[ks.length - 1][1];
};
