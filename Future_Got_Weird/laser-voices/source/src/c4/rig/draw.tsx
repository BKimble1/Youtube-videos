// Flat illustration planes in one perspective space (the V4-V6 corridor method): every element is a flat-filled,
// ink-outlined polygon placed in metres and projected by the shot's pinhole camera. Distance haze is colour mixing
// toward the scene's air colour; ink thins with distance.
import React from 'react';
import {mixHex} from '../lib';
import {B, Cam, dot3, lerp3, norm3, pathOf, proj, projPoly, sub3, V3, v3} from './geo';
import {INK} from './cast';

export const lookAt = (pos: V3, target: V3, f: number, roll = 0): Cam => {
  const d = norm3(sub3(target, pos));
  return {pos, yaw: (Math.atan2(d.x, d.z) * 180) / Math.PI, pitch: (Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI, f, cx: 540, cy: 960, roll};
};
export const lerpCam = (a: Cam, b: Cam, u: number): Cam => {
  let dy = b.yaw - a.yaw;
  while (dy > 180) dy -= 360;
  while (dy < -180) dy += 360;
  return {pos: lerp3(a.pos, b.pos, u), yaw: a.yaw + dy * u, pitch: a.pitch + (b.pitch - a.pitch) * u, f: a.f + (b.f - a.f) * u, cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u, roll: (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * u};
};

export type Air = {col: string; near: number; far: number};
export const haze = (air: Air, d: number) => Math.max(0, Math.min(1, (d - air.near) / (air.far - air.near))) ** 0.8;
export const depthOf = (b: B, p: V3) => dot3(sub3(p, b.c.pos), b.fwd);
export const inkAt = (b: B, d: number, base = 1) => Math.max(0.8, Math.min(5, (b.c.f * 0.0042 * base) / Math.max(d, 0.05)));

export type Poly = {pts: V3[]; fill: string; stroke?: string | false; op?: number; sw?: number; key?: string; layer?: number; n?: V3};
/** project a list of polygons, sorted far to near, with haze */
export const Planes: React.FC<{b: B; air: Air; polys: Poly[]; sort?: boolean}> = ({b, air, polys, sort = true}) => {
  const items = polys.filter((p) => !p.n || dot3(p.n, sub3(b.c.pos, p.pts[0])) > 0).map((p, i) => {
    const c = p.pts.reduce((s, q) => v3(s.x + q.x / p.pts.length, s.y + q.y / p.pts.length, s.z + q.z / p.pts.length), v3(0, 0, 0));
    return {p, i, d: depthOf(b, c)};
  });
  if (sort) items.sort((a, c) => (a.p.layer ?? 1) - (c.p.layer ?? 1) || c.d - a.d);
  return (
    <g>
      {items.map(({p, i, d}) => {
        const P = projPoly(b, p.pts, 0.02);
        if (P.length < 2) return null;
        const h = haze(air, d);
        const closed = P.length > 2;
        return (
          <path key={p.key ?? i} d={pathOf(P, closed)} fill={closed ? mixHex(p.fill, air.col, h) : 'none'} opacity={p.op ?? 1}
            stroke={p.stroke === false ? 'none' : mixHex(p.stroke ?? INK, air.col, h * 0.9)} strokeWidth={inkAt(b, d, p.sw ?? 1)} strokeLinejoin="round" strokeLinecap="round" />
        );
      })}
    </g>
  );
};
/** axis-aligned box faces (x0..x1, y0..y1, z0..z1) as polygons: only the faces that look toward the camera */
export const boxFaces = (b: B, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, cols: {front: string; side: string; top: string}, key = 'bx'): Poly[] => {
  const c = b.c.pos, out: Poly[] = [];
  if (c.z > z1) out.push({key: `${key}f`, pts: [v3(x0, y0, z1), v3(x1, y0, z1), v3(x1, y1, z1), v3(x0, y1, z1)], fill: cols.front});
  if (c.z < z0) out.push({key: `${key}b`, pts: [v3(x0, y0, z0), v3(x1, y0, z0), v3(x1, y1, z0), v3(x0, y1, z0)], fill: cols.front});
  if (c.x > x1) out.push({key: `${key}r`, pts: [v3(x1, y0, z0), v3(x1, y0, z1), v3(x1, y1, z1), v3(x1, y1, z0)], fill: cols.side});
  if (c.x < x0) out.push({key: `${key}l`, pts: [v3(x0, y0, z0), v3(x0, y0, z1), v3(x0, y1, z1), v3(x0, y1, z0)], fill: cols.side});
  if (c.y > y1) out.push({key: `${key}t`, pts: [v3(x0, y1, z0), v3(x1, y1, z0), v3(x1, y1, z1), v3(x0, y1, z1)], fill: cols.top});
  return out;
};
/** a circle in a horizontal plane, sampled */
export const ringPts = (c: V3, r: number, n = 40, rz = r): V3[] => Array.from({length: n}, (_, i) => v3(c.x + Math.cos((i / n) * Math.PI * 2) * r, c.y, c.z + Math.sin((i / n) * Math.PI * 2) * rz));
export {proj, pathOf};
