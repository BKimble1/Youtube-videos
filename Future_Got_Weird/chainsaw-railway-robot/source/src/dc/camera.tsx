// Copied unchanged from Future_Got_Weird/robot-faces/source/src/dc (the Weird Crew rig lineage: Death Clock -> Real Web Fluid -> Glass Climbing -> Robot Faces).
// 2.5D camera. A shot places layers at relative depths (1 = the subject plane, >1 farther, <1 nearer).
// The camera names the world point at screen centre and a zoom. Farther layers pan and zoom less,
// nearer layers more, which gives real parallax and occlusion from flat vector layers.
import React from 'react';
// 4 decimals: deep zooms (the vessel journey runs at z > 100) would otherwise jitter by a pixel per frame
const fmt = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(4));

export type Cam = {x: number; y: number; z: number; roll?: number};

export const W = 1080;
export const H = 1920;

/** Anchor: the world point that is at screen centre when the camera is at rest (x=540,y=960,z=1). */
const AX = 540;
const AY = 960;

export const layerTransform = (cam: Cam, depth: number) => {
  const d = Math.max(0.2, depth);
  const z = 1 + (cam.z - 1) / d;
  const cx = AX + (cam.x - AX) / d;
  const cy = AY + (cam.y - AY) / d;
  const roll = (cam.roll ?? 0) / Math.max(1, d * 0.6);
  return `translate(${W / 2} ${H / 2}) rotate(${fmt(roll)}) scale(${fmt(z)}) translate(${fmt(-cx)} ${fmt(-cy)})`;
};

export const Layer: React.FC<{cam: Cam; depth: number; children: React.ReactNode; opacity?: number}> = ({cam, depth, children, opacity}) => (
  <g transform={layerTransform(cam, depth)} opacity={opacity}>
    {children}
  </g>
);

/** World -> screen for the subject plane (depth 1). */
export const toScreen = (cam: Cam, p: {x: number; y: number}) => ({x: W / 2 + (p.x - cam.x) * cam.z, y: H / 2 + (p.y - cam.y) * cam.z});
