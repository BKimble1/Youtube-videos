// Parallax under a keyed camera. A layer at depth d moves d times as far as the focus plane (d = 1) and zooms as
// z^d, so far layers (d < 1) drift and grow slowly while near layers (d > 1) sweep past and grow fast.
// Use in screen space (not inside <Cam>): the layer applies the camera itself.
import React from 'react';
import {fmt} from '../dc/math';
import {CamS} from './core2';
export const Depth: React.FC<{cam: CamS; d?: number; children: React.ReactNode; opacity?: number}> = ({cam, d = 1, children, opacity}) => {
  const z = Math.pow(cam.z, d);
  return (
    <g opacity={opacity} transform={`translate(960 540) rotate(${fmt((cam.rot ?? 0) * d)}) scale(${fmt(z)}) translate(${fmt(-cam.x * d)} ${fmt(-cam.y * d)})`}>
      {children}
    </g>
  );
};
