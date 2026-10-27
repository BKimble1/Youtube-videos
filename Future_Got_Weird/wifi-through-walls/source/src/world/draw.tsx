// Flat-illustration planes projected by the shot camera: flat fills with one ink edge whose width follows depth
// (thinner with distance, never proportional), the channel's cutout style for sets.
import React from 'react';
import {B, depth, pathOf, projPoly, V3, v3} from './cam';
import {PAL} from '../dc/color';

export const INK = PAL.ink;
/** ink width (px) for an edge at depth d */
export const inkAt = (b: B, d: number, base = 1) => Math.max(0.7, Math.min(5, (b.c.f * 0.0028 * base) / Math.max(d, 0.05)));

export const Poly: React.FC<{b: B; pts: V3[]; fill: string; stroke?: string | false; sw?: number; op?: number; dash?: string}> = ({b, pts, fill, stroke, sw = 1, op, dash}) => {
  const P = projPoly(b, pts, 0.02);
  if (P.length < 2) return null;
  const c = pts.reduce((s, q) => v3(s.x + q.x / pts.length, s.y + q.y / pts.length, s.z + q.z / pts.length), v3(0, 0, 0));
  const closed = P.length > 2;
  return (
    <path d={pathOf(P, closed)} fill={closed ? fill : 'none'} opacity={op} strokeDasharray={dash}
      stroke={stroke === false ? 'none' : stroke ?? INK} strokeWidth={inkAt(b, depth(b, c), sw)} strokeLinejoin="round" strokeLinecap="round" />
  );
};
/** a polyline in the world */
export const Line3: React.FC<{b: B; pts: V3[]; stroke: string; w: number; op?: number; px?: boolean; cap?: 'round' | 'butt'}> = ({b, pts, stroke, w, op, px, cap = 'round'}) => {
  const P = pts.map((p) => projPoly(b, [p, p, p], 0.02)[0]).filter(Boolean);
  if (P.length < 2) return null;
  const c = pts[Math.floor(pts.length / 2)];
  const ww = px ? w : (w * b.c.f) / Math.max(depth(b, c), 0.05);
  return <path d={pathOf(P, false)} fill="none" stroke={stroke} strokeWidth={ww} opacity={op} strokeLinecap={cap} strokeLinejoin="round" />;
};
/** rectangle facing the camera at depth z (x0..x1, y0..y1) */
export const rz = (z: number, x0: number, x1: number, y0: number, y1: number): V3[] => [v3(x0, y0, z), v3(x1, y0, z), v3(x1, y1, z), v3(x0, y1, z)];
/** horizontal rectangle at height y */
export const ry = (y: number, x0: number, x1: number, z0: number, z1: number): V3[] => [v3(x0, y, z0), v3(x1, y, z0), v3(x1, y, z1), v3(x0, y, z1)];
/** vertical rectangle in the plane x = const */
export const rx = (x: number, z0: number, z1: number, y0: number, y1: number): V3[] => [v3(x, y0, z0), v3(x, y0, z1), v3(x, y1, z1), v3(x, y1, z0)];
/** a box: the faces turned toward the camera, back faces first */
export const Box: React.FC<{b: B; x0: number; x1: number; y0: number; y1: number; z0: number; z1: number; front: string; side: string; top: string; sw?: number}> = ({b, x0, x1, y0, y1, z0, z1, front, side, top, sw}) => {
  const c = b.c.pos;
  return (
    <g>
      {c.y > y1 && <Poly b={b} pts={ry(y1, x0, x1, z0, z1)} fill={top} sw={sw} />}
      {c.y < y0 && <Poly b={b} pts={ry(y0, x0, x1, z0, z1)} fill={top} sw={sw} />}
      {c.x > x1 && <Poly b={b} pts={rx(x1, z0, z1, y0, y1)} fill={side} sw={sw} />}
      {c.x < x0 && <Poly b={b} pts={rx(x0, z0, z1, y0, y1)} fill={side} sw={sw} />}
      {c.z < z0 && <Poly b={b} pts={rz(z0, x0, x1, y0, y1)} fill={front} sw={sw} />}
      {c.z > z1 && <Poly b={b} pts={rz(z1, x0, x1, y0, y1)} fill={front} sw={sw} />}
    </g>
  );
};
