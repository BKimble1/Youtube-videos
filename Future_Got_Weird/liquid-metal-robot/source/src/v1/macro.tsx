// Scene 3: the cut window on the recast figure's chest. Drawn in the figure's own plane (inside its affine group), so
// the window is a real hole in the real surface the camera is travelling into. Inside: a polished cross-section a few
// tens of micrometres below the skin - a polycrystalline gallium matrix (grains with slightly different sheen, fine
// grain-boundary grooves, polishing marks) with angular NdFeB microparticles embedded in it (dark, faceted, standing
// a hair proud of the softer matrix, with a bright lit edge and a shadowed one). Units inside are micrometres.
import React from 'react';
import {INK} from '../shared/ink';
import {mix} from '../shared/color';

type Pt = [number, number];
const rnd = (() => {
  let s = 20230112;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
})();

const EXT = 1500; // content half-extent (um)

// ---------------------------------------------------------------- grains (Voronoi, half-plane clipped)
type Grain = {pts: Pt[]; tone: number; warm: number; cx: number; cy: number};
const GRAINS: Grain[] = (() => {
  const sp = 165;
  const n = Math.ceil((EXT * 2) / sp) + 2;
  const seeds: Pt[][] = [];
  for (let i = 0; i < n; i++) {
    seeds.push([]);
    for (let j = 0; j < n; j++) seeds[i].push([-EXT - sp + i * sp + (rnd() - 0.5) * sp * 0.8, -EXT - sp + j * sp + (rnd() - 0.5) * sp * 0.8]);
  }
  const out: Grain[] = [];
  for (let i = 1; i < n - 1; i++)
    for (let j = 1; j < n - 1; j++) {
      const s = seeds[i][j];
      let cell: Pt[] = [[s[0] - sp * 2, s[1] - sp * 2], [s[0] + sp * 2, s[1] - sp * 2], [s[0] + sp * 2, s[1] + sp * 2], [s[0] - sp * 2, s[1] + sp * 2]];
      for (let di = -2; di <= 2; di++)
        for (let dj = -2; dj <= 2; dj++) {
          if (!di && !dj) continue;
          const q = seeds[i + di]?.[j + dj];
          if (!q) continue;
          const m: Pt = [(s[0] + q[0]) / 2, (s[1] + q[1]) / 2], nn: Pt = [q[0] - s[0], q[1] - s[1]];
          const side = (p: Pt) => (p[0] - m[0]) * nn[0] + (p[1] - m[1]) * nn[1];
          const nc: Pt[] = [];
          for (let k = 0; k < cell.length; k++) {
            const a = cell[k], b = cell[(k + 1) % cell.length];
            const sa = side(a), sb = side(b);
            if (sa <= 0) nc.push(a);
            if (sa * sb < 0) {
              const u = sa / (sa - sb);
              nc.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
            }
          }
          cell = nc;
        }
      if (cell.length > 2) out.push({pts: cell, tone: rnd() * 2 - 1, warm: rnd() * 2 - 1, cx: s[0], cy: s[1]});
    }
  return out;
})();

// ---------------------------------------------------------------- NdFeB microparticles
type Part = {x: number; y: number; r: number; pts: Pt[]; facet: Pt[]; lit: Pt[][]};
const PARTS: Part[] = (() => {
  const out: Part[] = [];
  const cellS = 60;
  const grid = new Map<string, number[]>();
  const key = (x: number, y: number) => `${Math.floor(x / cellS)},${Math.floor(y / cellS)}`;
  let tries = 0;
  while (out.length < 950 && tries < 30000) {
    tries++;
    const r = 13 + 50 * Math.pow(rnd(), 1.7);
    const x = (rnd() * 2 - 1) * EXT, y = (rnd() * 2 - 1) * EXT;
    let ok = true;
    const gx = Math.floor(x / cellS), gy = Math.floor(y / cellS);
    for (let dx = -2; dx <= 2 && ok; dx++)
      for (let dy = -2; dy <= 2 && ok; dy++)
        for (const id of grid.get(`${gx + dx},${gy + dy}`) ?? []) {
          const p = out[id];
          if (Math.hypot(p.x - x, p.y - y) < (p.r + r) * 1.25 + 6) {
            ok = false;
            break;
          }
        }
    if (!ok) continue;
    const nv = 5 + Math.floor(rnd() * 4);
    const rot = rnd() * Math.PI * 2;
    const elong = 0.6 + rnd() * 0.4;
    const pts: Pt[] = [];
    for (let k = 0; k < nv; k++) {
      const a = rot + (k / nv) * Math.PI * 2 + (rnd() - 0.5) * 0.7;
      const rr = r * (0.7 + rnd() * 0.3);
      const lx = Math.cos(a) * rr, ly = Math.sin(a) * rr * elong;
      pts.push([x + lx * Math.cos(rot) - ly * Math.sin(rot), y + lx * Math.sin(rot) + ly * Math.cos(rot)]);
    }
    // the lit facet: the part of the polygon on the light side of a chord through the centre
    const fa = 2.2 + (rnd() - 0.5) * 0.8; // chord normal toward the upper left (y up)
    const fn: Pt = [Math.cos(fa), Math.sin(fa)];
    const off = r * (0.05 + rnd() * 0.25);
    const facet: Pt[] = [];
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length];
      const sa = (a[0] - x) * fn[0] + (a[1] - y) * fn[1] - off, sb = (b[0] - x) * fn[0] + (b[1] - y) * fn[1] - off;
      if (sa >= 0) facet.push(a);
      if (sa * sb < 0) {
        const u = sa / (sa - sb);
        facet.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
      }
    }
    // edges facing the key light (upper left, y up)
    const lit: Pt[][] = [];
    for (let k = 0; k < pts.length; k++) {
      const a = pts[k], b = pts[(k + 1) % pts.length];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const nl = Math.hypot(ex, ey) || 1;
      const nx = ey / nl, ny = -ex / nl; // outward for a ccw polygon
      if (nx * -0.6 + ny * 0.8 > 0.25) lit.push([a, b]);
    }
    const id = out.length;
    out.push({x, y, r, pts, facet, lit});
    const kk = key(x, y);
    grid.set(kk, [...(grid.get(kk) ?? []), id]);
  }
  return out;
})();

const pd = (pts: Pt[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') + 'Z';
const MATRIX = '#AEB7BF';

/** the window and its cross-section. `view`: the visible region in content um (for culling). `off`: the recess offset
 *  of the section face (um, in the plane), from the camera's angle. */
export const CutWindow: React.FC<{cx: number; cy: number; rw: number; off: Pt; view: {x0: number; y0: number; x1: number; y1: number}; t: number; pxPerUm: number}> = ({cx, cy, rw, off, view, t, pxPerUm}) => {
  if (rw <= 0.0005) return null;
  const R = rw * 1e4; // um
  const m = 80;
  const vis = (x: number, y: number, r: number) => x + r > view.x0 - m && x - r < view.x1 + m && y + r > view.y0 - m && y - r < view.y1 + m;
  const grains = GRAINS.filter((g) => vis(g.cx, g.cy, 260) && Math.hypot(g.cx, g.cy) < R + 300);
  const parts = PARTS.filter((p) => vis(p.x, p.y, p.r) && Math.hypot(p.x, p.y) < R + p.r);
  const px = 1 / Math.max(0.05, pxPerUm); // one screen pixel in um
  const sheenX = -1400 + 2600 * ((t * 0.32) % 1);
  const lowDetail = pxPerUm < 0.35;
  return (
    <g transform={`translate(${cx.toFixed(5)} ${cy.toFixed(5)}) scale(0.0001)`}>
      <defs>
        <clipPath id="cw-clip">
          <circle cx={0} cy={0} r={R} />
        </clipPath>
        <radialGradient id="cw-wall" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R}>
          <stop offset="0.6" stopColor="#5E6973" />
          <stop offset="1" stopColor="#262D35" />
        </radialGradient>
        <linearGradient id="cw-light" gradientUnits="userSpaceOnUse" x1={-R} y1={R} x2={R} y2={-R}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#0B1620" stopOpacity={0.28} />
        </linearGradient>
        <linearGradient id="cw-sheen" gradientUnits="userSpaceOnUse" x1={sheenX - 260} y1={-200} x2={sheenX + 260} y2={200}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.2} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="cw-ao" gradientUnits="userSpaceOnUse" cx={off[0]} cy={off[1]} r={R}>
          <stop offset="0.72" stopColor="#0A1118" stopOpacity={0} />
          <stop offset="1" stopColor="#0A1118" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <g clipPath="url(#cw-clip)">
        <circle cx={0} cy={0} r={R} fill="url(#cw-wall)" />
        <g transform={`translate(${off[0].toFixed(1)} ${off[1].toFixed(1)})`}>
          <circle cx={0} cy={0} r={R} fill={MATRIX} />
          {grains.map((g, i) => (
            <path key={i} d={pd(g.pts)} fill={mix(mix(MATRIX, g.tone > 0 ? '#E4E9EE' : '#7F8A95', Math.abs(g.tone) * 0.32), g.warm > 0 ? '#C8BBA8' : '#9DB2C6', Math.abs(g.warm) * 0.14)} />
          ))}
          {!lowDetail &&
            grains.map((g, i) => (
              <g key={`b${i}`}>
                <path d={pd(g.pts)} fill="none" stroke="#5F6A75" strokeWidth={Math.max(2.4, 1.4 * px)} strokeOpacity={0.55} strokeLinejoin="round" />
                <path d={pd(g.pts)} fill="none" stroke="#EEF2F5" strokeWidth={Math.max(1, 0.8 * px)} strokeOpacity={0.4} strokeLinejoin="round" transform="translate(-1.6 1.6)" />
              </g>
            ))}
          {/* polishing marks */}
          {Array.from({length: 26}, (_, i) => {
            const y0 = -EXT + (i * 2 * EXT) / 26 + 37 * Math.sin(i * 7.1);
            return <line key={`s${i}`} x1={-EXT} y1={y0} x2={EXT} y2={y0 + 380} stroke={i % 3 ? '#FFFFFF' : '#56616C'} strokeWidth={Math.max(1, 0.7 * px)} opacity={0.12} />;
          })}
          {/* the embedded NdFeB microparticles */}
          {parts.map((p, i) => (
            <g key={`p${i}`}>
              <path d={pd(p.pts)} fill="#E1E7EC" opacity={0.42} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(1.2) translate(${(-p.x).toFixed(1)} ${(-p.y).toFixed(1)})`} />
              <path d={pd(p.pts)} fill="#1C232A" opacity={0.5} transform={`translate(${(0.12 * p.r).toFixed(1)} ${(-0.12 * p.r).toFixed(1)})`} />
              <path d={pd(p.pts)} fill="#434D5B" stroke="#10151A" strokeWidth={Math.max(1.2, 1.1 * px)} strokeLinejoin="round" />
              {p.facet.length > 2 && <path d={pd(p.facet)} fill="#8794A6" />}
              {p.facet.length > 2 && <path d={pd(p.facet)} fill="#C9D3E0" opacity={0.35} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(0.55) translate(${(-p.x).toFixed(1)} ${(-p.y).toFixed(1)})`} />}
              {!lowDetail && p.lit.map((e, k) => <line key={k} x1={e[0][0]} y1={e[0][1]} x2={e[1][0]} y2={e[1][1]} stroke="#F3F7FA" strokeWidth={Math.max(1.4, 1.3 * px)} strokeLinecap="round" opacity={0.8} />)}
            </g>
          ))}
          <circle cx={0} cy={0} r={R * 1.2} fill="url(#cw-light)" />
          <circle cx={0} cy={0} r={R * 1.2} fill="url(#cw-sheen)" />
          <circle cx={-off[0]} cy={-off[1]} r={R} fill="url(#cw-ao)" />
        </g>
      </g>
      {/* the cut edge: ink, then a bright bevel on the lit side */}
      <circle cx={0} cy={0} r={R} fill="none" stroke={INK} strokeWidth={Math.max(4, 3.2 * px)} />
      <circle cx={0} cy={0} r={R - 2.2 * px} fill="none" stroke="#F4F7F9" strokeWidth={Math.max(2, 1.6 * px)} strokeDasharray={`${(Math.PI * R * 0.9).toFixed(0)} ${(Math.PI * R * 1.1).toFixed(0)}`} strokeDashoffset={(-Math.PI * R * 0.45).toFixed(0)} opacity={0.85} />
    </g>
  );
};
