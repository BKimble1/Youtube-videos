// Group A (V3) helpers: a flat contact shadow for the insect under any view (Roach2D's own shadow ellipse follows the
// body axis on screen, which turns it into an upright blob when the insect faces a low camera head-on).
import React from 'react';
import {RoachPose} from '../../../rig/roach';
import {toW} from '../../../lib/v3';
import {View, P, f2, hull, smoothClosed} from '../../roach/ortho';

/** the insect's footprint (body x -44..36, z -22..22) on the ground, pushed a little away from the key light */
export const GroundShadow: React.FC<{pose: RoachPose; v: View; alpha?: number}> = ({pose, v, alpha = 0.2}) => {
  const f = pose.frame;
  const pts: [number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const q = toW(f, [-4 + 38 * Math.cos(a), 0, 20 * Math.sin(a)]);
    const s = P(v, [q[0] + 2, 0, q[2] - 2]);
    pts.push([s[0], s[1]]);
  }
  const h = hull(pts);
  // keep a little vertical thickness even when the ground is seen nearly edge-on
  const cy = h.reduce((a, p) => a + p[1], 0) / h.length;
  const ext = Math.max(...h.map((p) => Math.abs(p[1] - cy)));
  const k = ext < 7 ? 7 / Math.max(1, ext) : 1;
  const hh = h.map((p) => [p[0], cy + (p[1] - cy) * k] as [number, number]);
  return <path d={smoothClosed(hh)} fill="#1A1612" opacity={f2(alpha)} />;
};
