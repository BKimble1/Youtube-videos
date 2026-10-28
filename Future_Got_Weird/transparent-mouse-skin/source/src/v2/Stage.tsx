// Restrained 2.5D: the world is drawn in flat SVG layers (crisp vectors; the camera's position, zoom and roll are
// applied inside each SVG), and only the tilt is a CSS 3D rotation about the screen centre. Layers sit at different
// depths (bench below the belly, the anatomy just below the skin surface, the hand just above it), so a tilt gives
// true parallax between surface and organs. Depth is scaled in with the tilt, so in top-down views (tilt 0) every
// layer lines up exactly. Layers are over-scanned so a tilted plane never shows its edge.
import React from 'react';

export type Cam = {x: number; y: number; z: number; r: number; tilt: number};
const OS = 1.6; // over-scan factor
const W = 1080, H = 1920;
const PERSP = 1500;

export const camT = (c: Cam) => `translate(540 960) rotate(${c.r.toFixed(3)}) scale(${c.z.toFixed(4)}) translate(${(-c.x).toFixed(2)} ${(-c.y).toFixed(2)})`;

/** one world layer at a depth (world units below (+) or above (-) the skin surface) */
export const Plane: React.FC<{cam: Cam; depth: number; children: React.ReactNode; id?: string; far?: boolean}> = ({cam, depth, children, far}) => {
  const k = Math.min(1, Math.abs(cam.tilt) / 25);
  const dz = -depth * cam.z * k;
  // a backdrop plane seen at a steep tilt recedes a long way: give it extra over-scan (wider, and far above the top)
  const big = far && cam.tilt > 4;
  const ox = big ? W : ((OS - 1) * W) / 2, oy = big ? 3000 : ((OS - 1) * H) / 2;
  const w = W + 2 * ox, h = H + ((OS - 1) * H) / 2 + oy;
  const t3 = cam.tilt === 0 && dz === 0 ? undefined : `perspective(${PERSP}px) rotateX(${cam.tilt.toFixed(3)}deg) translateZ(${dz.toFixed(2)}px)`;
  return (
    <div style={{position: 'absolute', left: -ox, top: -oy, width: w, height: h, transformOrigin: `${ox + 540}px ${oy + 960}px`, transform: t3}}>
      <svg width={w} height={h} viewBox={`${-ox} ${-oy} ${w} ${h}`} style={{display: 'block'}}>
        <g transform={camT(cam)}>{children}</g>
      </svg>
    </div>
  );
};

/** world point -> screen point (top-down part only; used where tilt is 0) */
export const toScreen = (c: Cam, p: {x: number; y: number}) => {
  const dx = (p.x - c.x) * c.z, dy = (p.y - c.y) * c.z, a = (c.r * Math.PI) / 180;
  return {x: 540 + dx * Math.cos(a) - dy * Math.sin(a), y: 960 + dx * Math.sin(a) + dy * Math.cos(a)};
};
