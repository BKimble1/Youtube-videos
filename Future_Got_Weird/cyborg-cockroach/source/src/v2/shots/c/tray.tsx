// Group C: the experiment tray as a ground plane cut square to the view (its far lip runs level across the frame, so the
// blurred lab beyond shows above it), in insect millimetres through an orthographic view.
import React from 'react';
import {V3} from '../../../lib/v3';
import {View, P, f2} from '../../roach/ortho';
import {LAB2, LabWall2} from '../../sets/Lab2';
import {INK} from '../../../lib/ink';

export const TrayPlane: React.FC<{v: View; c: V3; far: number; near?: number; lip?: number}> = ({v, c, far, near = 3000, lip = 7}) => {
  const fh = Math.hypot(v.F[0], v.F[2]) || 1;
  const Fh: V3 = [v.F[0] / fh, 0, v.F[2] / fh];
  const R: V3 = [v.R[0], 0, v.R[2]];
  const at = (a: number, b: number, y = 0): V3 => [c[0] + R[0] * a + Fh[0] * b, y, c[2] + R[2] * a + Fh[2] * b];
  const q = [at(-4000, -far), at(4000, -far), at(4000, near), at(-4000, near)].map((p) => P(v, p));
  const lipTop = [at(-4000, -far - 4, lip), at(4000, -far - 4, lip), at(4000, -far, lip), at(-4000, -far, lip)].map((p) => P(v, p));
  const lipFace = [at(-4000, -far, lip), at(4000, -far, lip), at(4000, -far, 0), at(-4000, -far, 0)].map((p) => P(v, p));
  const d = (pts: [number, number][]) => `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z`;
  return (
    <g>
      <path d={d(q)} fill={LAB2.surface} />
      <path d={d(lipTop)} fill="#F6F9FA" stroke={INK} strokeWidth={1.5} strokeOpacity={0.5} />
      <path d={d(lipFace)} fill={LAB2.surfaceShade} />
    </g>
  );
};

/** the far distance (mm behind c) that puts the tray's lip at screen height y in view v */
export const farForLip = (v: View, c: V3, y: number) => {
  const fh = Math.hypot(v.F[0], v.F[2]) || 1;
  const Fh: V3 = [v.F[0] / fh, 0, v.F[2] / fh];
  const y0 = P(v, c)[1];
  const y1 = P(v, [c[0] - Fh[0] * 100, 0, c[2] - Fh[2] * 100])[1];
  return ((y - y0) / (y1 - y0)) * 100;
};

/** behind the tray (screen px): the dark bench top running back to the wall, the lab wall (blurred, out of focus)
 *  rising from it. lipY is the tray lip's screen height; k scales the wall art, dx pans it. */
export const Beyond2D: React.FC<{id: string; lipY: number; k?: number; dx?: number; blur?: number; bench?: number}> = ({id, lipY, k = 1, dx = 0, blur = 8, bench = 90}) => (
  <g>
    <defs>
      <filter id={`${id}-bl`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation={f2(blur)} />
      </filter>
    </defs>
    <g filter={`url(#${id}-bl)`}>
      <rect x={-100} y={-100} width={1280} height={2120} fill={LAB2.wallBot} />
      <g transform={`translate(${f2(540 + dx)} ${f2(lipY - bench * k)}) scale(${f2(k)}) translate(-540 -1012)`}>
        <LabWall2 id={`${id}-w`} />
      </g>
      <rect x={-100} y={f2(lipY - bench * k)} width={1280} height={f2(bench * k + 40)} fill={LAB2.benchTop} />
      <rect x={-100} y={f2(lipY - bench * k)} width={1280} height={f2(4 * k)} fill={LAB2.benchTopLit} />
    </g>
  </g>
);
