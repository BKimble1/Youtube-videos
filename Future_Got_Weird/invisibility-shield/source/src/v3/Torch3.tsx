// V3 torch: the V2 beam volume and pool (with its soft cross-fade from the walls onto the panel), hitting the V3
// corridor's planes.
import React from 'react';
import {Basis, c3, circle3, d3, fmt, hull, n3, polyD, proj, projPoly, s3, V2, V3, v3} from '../v2/p3';
import {LAY3 as LAY} from './Corridor3';

// ---- the guard's flashlight: a beam volume and a pool where its axis meets the first surface
export const beamHit = (o: V3, dir: V3): {p: V3; n: V3; t: number} | null => {
  const {xw, ht, zb, zf} = LAY;
  const planes: {n: V3; d: number}[] = [
    {n: v3(0, 1, 0), d: 0}, {n: v3(0, -1, 0), d: -ht}, {n: v3(1, 0, 0), d: -xw}, {n: v3(-1, 0, 0), d: -xw},
    {n: v3(0, 0, 1), d: zb}, {n: v3(0, 0, -1), d: -zf},
  ];
  let best: {p: V3; n: V3; t: number} | null = null;
  for (const pl of planes) {
    const den = d3(pl.n, dir);
    if (den >= -1e-6) continue;
    const tt = (pl.d - d3(pl.n, o)) / den;
    if (tt <= 0) continue;
    if (!best || tt < best.t) best = {p: v3(o.x + dir.x * tt, o.y + dir.y * tt, o.z + dir.z * tt), n: pl.n, t: tt};
  }
  return best;
};
export const Flashlight: React.FC<{id: string; b: Basis; o: V3; dir: V3; on: number; occluder?: {c: V3; n: V3; w: number; h: number}}> = ({id, b, o, dir, on, occluder}) => {
  if (on <= 0.01) return null;
  const wall = beamHit(o, dir);
  if (!wall) return null;
  // the beam can land on the shield's face instead: the pool cross-fades from the wall to the panel over a soft band
  // around the panel's edge, so a sweep across the edge never pops (the lens glint itself is drawn by the caller)
  let panel: {p: V3; n: V3; t: number} | null = null, cover = 0;
  if (occluder) {
    const den = d3(occluder.n, dir);
    if (Math.abs(den) > 1e-6) {
      const tt = d3(s3(occluder.c, o), occluder.n) / den;
      if (tt > 0 && tt < wall.t) {
        const p = v3(o.x + dir.x * tt, o.y + dir.y * tt, o.z + dir.z * tt);
        const rel = s3(p, occluder.c);
        const ax = n3(c3(v3(0, 1, 0), occluder.n)); // across the panel
        const ay = n3(c3(occluder.n, ax)); // up the panel
        const ex = occluder.w / 2 - Math.abs(d3(rel, ax)), ey = occluder.h / 2 - Math.abs(d3(rel, ay));
        cover = Math.min(clamp01((ex + 0.06) / 0.12), clamp01((ey + 0.06) / 0.12));
        if (cover > 0) panel = {p, n: occluder.n, t: tt};
      }
    }
  }
  const lens = proj(b, o);
  const drawHit = (hit: {p: V3; n: V3; t: number}, alpha: number, key: string) => {
    const r = hit.t * 0.11; // ~6 degree half-angle
    const n = hit.n;
    const u = Math.abs(n.y) > 0.9 ? v3(1, 0, 0) : v3(0, 1, 0);
    const w = n3(c3(n, u));
    const lift = (p: V3) => v3(p.x + n.x * 0.004, p.y + n.y * 0.004, p.z + n.z * 0.004);
    const pool = (rr: number) => projPoly(b, circle3(lift(hit.p), u, w, rr, 28));
    const outer = pool(r);
    const gid = `${id}-${key}-bg`;
    // beam volume: hull of the lens point and the pool outline
    const pts: V2[] = [...outer];
    if (lens.d > 0.05) pts.push({x: lens.x, y: lens.y});
    const hullPts = hull(pts);
    const hp = proj(b, hit.p);
    return (
      <g key={key} opacity={alpha}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={fmt(lens.x)} y1={fmt(lens.y)} x2={fmt(hp.x)} y2={fmt(hp.y)}>
            <stop offset="0" stopColor="#FFF1C8" stopOpacity={0.16} />
            <stop offset="1" stopColor="#FFE7A8" stopOpacity={0.035} />
          </linearGradient>
          <radialGradient id={`${id}-${key}-pg`} gradientUnits="userSpaceOnUse" cx={fmt(hp.x)} cy={fmt(hp.y)} r={fmt(Math.min(4000, Math.max(4, r * hp.k * 1.3)))}>
            <stop offset="0" stopColor="#FFF6DC" stopOpacity={0.62} />
            <stop offset="0.5" stopColor="#FFE5A0" stopOpacity={0.28} />
            <stop offset="1" stopColor="#FFD27A" stopOpacity={0} />
          </radialGradient>
        </defs>
        {lens.d > 0.05 && hullPts.length >= 3 && <path d={polyD(hullPts)} fill={`url(#${gid})`} opacity={Math.min(1, Math.max(0, (lens.d - 0.6) / 2.2))} />}
        {outer.length >= 3 && <path d={polyD(pool(r * 1.15))} fill={`url(#${id}-${key}-pg)`} />}
        {outer.length >= 3 && <path d={polyD(pool(r * 0.5))} fill="#FFF8E6" opacity={0.16} />}
      </g>
    );
  };
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={on}>
      {cover < 1 && drawHit(wall, 1 - cover, 'w')}
      {panel && drawHit(panel, cover, 'p')}
    </g>
  );
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const beamHitPoint = beamHit;
