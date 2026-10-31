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
type Part = {x: number; y: number; r: number; pts: Pt[]; facet: Pt[]; lit: Pt[][]; rot: number; loc: Pt[]; ph: number};
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
    out.push({x, y, r, pts, facet, lit, rot, loc: pts.map((q) => [q[0] - x, q[1] - y] as Pt), ph: rnd() * Math.PI * 2});
    const kk = key(x, y);
    grid.set(kk, [...(grid.get(kk) ?? []), id]);
  }
  return out;
})();

const pd = (pts: Pt[]) => 'M' + pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L') + 'Z';
const MATRIX = '#AEB7BF';
const LIQ = '#C6D0D9';

/** what the metal is doing in the section */
export type SecState = {
  heat: number; // 0..1 the field heats the particles: warm glow, vibration
  melt: number; // 0..1 the gallium round them goes liquid (spreads from the particles), grains vanish
  align: number; // 0..1 particles turn and chain toward the magnet
  alignAng: number; // direction to the magnet (content coordinates, radians, y up)
  flow: Pt; // common drift of the liquid (um)
  freezeX: number | null; // freeze front (content x): left of it is solid again, particles locked
};
export const SOLID: SecState = {heat: 0, melt: 0, align: 0, alignAng: 0, flow: [0, 0], freezeX: null};

/** particle outline in its current state (rotated toward alignAng by `align`, chained, drifted, jiggling) */
const placed = (p: Part, st: SecState, t: number, frozen: boolean) => {
  let da = 0;
  if (st.align > 0) {
    let d = st.alignAng - p.rot;
    d = Math.atan2(Math.sin(2 * d), Math.cos(2 * d)) / 2; // long axis: either end
    da = d * st.align;
  }
  const jig = frozen ? 0 : st.heat * 0.09 * p.r;
  let x = p.x + st.flow[0] + jig * Math.sin(t * 47 + p.ph), y = p.y + st.flow[1] + jig * Math.cos(t * 53 + p.ph * 1.3);
  if (st.align > 0) {
    // gather into chains along the field: pull toward lines parallel to alignAng
    const ca = Math.cos(st.alignAng), sa = Math.sin(st.alignAng);
    const across = -x * sa + y * ca;
    const sp = 95;
    const k = across - Math.round(across / sp) * sp;
    x += sa * k * 0.8 * st.align;
    y -= ca * k * 0.8 * st.align;
  }
  const c = Math.cos(da), s2 = Math.sin(da);
  const ax = Math.cos(st.alignAng), ay = Math.sin(st.alignAng), stretch = 0.6 * st.align;
  const pts: Pt[] = p.loc.map((q) => {
    let u = q[0] * c - q[1] * s2, v = q[0] * s2 + q[1] * c;
    const d = (u * ax + v * ay) * stretch; // drawn out along the field
    u += ax * d;
    v += ay * d;
    return [x + u, y + v];
  });
  return {x, y, pts, da};
};
const litEdges = (pts: Pt[]) => {
  const out: Pt[][] = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[(k + 1) % pts.length];
    const ex = b[0] - a[0], ey = b[1] - a[1], nl = Math.hypot(ex, ey) || 1;
    if ((ey / nl) * -0.6 + (-ex / nl) * 0.8 > 0.25) out.push([a, b]);
  }
  return out;
};
const facetOf = (pts: Pt[], x: number, y: number, r: number) => {
  const fn: Pt = [Math.cos(2.2), Math.sin(2.2)];
  const off = r * 0.15;
  const out: Pt[] = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k], b = pts[(k + 1) % pts.length];
    const sa = (a[0] - x) * fn[0] + (a[1] - y) * fn[1] - off, sb = (b[0] - x) * fn[0] + (b[1] - y) * fn[1] - off;
    if (sa >= 0) out.push(a);
    if (sa * sb < 0) {
      const u = sa / (sa - sb);
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
    }
  }
  return out;
};

/** the window and its cross-section. cx, cy, rw in the parent's local units; `unit` = parent units per um.
 *  `off`: the recess offset of the section face (um, in its plane), from the camera's angle. */
export const CutWindow: React.FC<{id: string; cx: number; cy: number; rw: number; unit?: number; off: Pt; view: {x0: number; y0: number; x1: number; y1: number}; t: number; pxPerUm: number; st?: SecState}> = ({id, cx, cy, rw, unit = 1e-4, off, view, t, pxPerUm, st = SOLID}) => {
  if (rw <= unit * 5) return null;
  const R = rw / unit; // um
  const m = 80;
  const vis = (x: number, y: number, r: number) => x + r > view.x0 - m && x - r < view.x1 + m && y + r > view.y0 - m && y - r < view.y1 + m;
  const flowR = Math.hypot(st.flow[0], st.flow[1]) + 60;
  const grains = GRAINS.filter((g) => vis(g.cx, g.cy, 260) && Math.hypot(g.cx, g.cy) < R + 300);
  const parts = PARTS.filter((p) => vis(p.x + st.flow[0], p.y + st.flow[1], p.r + 40) && Math.hypot(p.x + st.flow[0], p.y + st.flow[1]) < R + p.r + flowR * 0);
  const px = 1 / Math.max(0.05, pxPerUm);
  const sheenX = -1400 + 2600 * ((t * 0.32) % 1);
  const lowDetail = pxPerUm < 0.35;
  const fz = st.freezeX;
  const showGrains = st.melt < 0.999 || fz !== null;
  const grainsEl = (
    <>
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
      {Array.from({length: 26}, (_, i) => {
        const y0 = -EXT + (i * 2 * EXT) / 26 + 37 * Math.sin(i * 7.1);
        return <line key={`s${i}`} x1={-EXT} y1={y0} x2={EXT} y2={y0 + 380} stroke={i % 3 ? '#FFFFFF' : '#56616C'} strokeWidth={Math.max(1, 0.7 * px)} opacity={0.12} />;
      })}
    </>
  );
  // the liquid matrix: bright, smooth, with slow broad reflections
  const liquidEl = (
    <>
      <rect x={-EXT * 2} y={-EXT * 2} width={EXT * 4} height={EXT * 4} fill={LIQ} />
      <rect x={-EXT * 2} y={-EXT * 2} width={EXT * 4} height={EXT * 4} fill={`url(#${id}-lq)`} />
    </>
  );
  const partsEl = (frozenRegion: boolean) =>
    parts.map((p, i) => {
      const fr = frozenRegion;
      const q = placed(p, fr ? {...st, heat: 0} : st, t, fr);
      const facet = facetOf(q.pts, q.x, q.y, p.r);
      const lit = litEdges(q.pts);
      const heat = fr ? 0 : st.heat;
      return (
        <g key={`p${i}`}>
          {heat > 0.02 && <circle cx={q.x} cy={q.y} r={p.r * (1.3 + 0.9 * heat)} fill={`url(#${id}-glow)`} opacity={heat * 0.8} />}
          <path d={pd(q.pts)} fill="#E1E7EC" opacity={0.42 * (1 - st.melt * 0.6)} transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) scale(1.2) translate(${(-q.x).toFixed(1)} ${(-q.y).toFixed(1)})`} />
          <path d={pd(q.pts)} fill="#1C232A" opacity={0.5} transform={`translate(${(0.12 * p.r).toFixed(1)} ${(-0.12 * p.r).toFixed(1)})`} />
          <path d={pd(q.pts)} fill="#434D5B" stroke="#10151A" strokeWidth={Math.max(1.2, 1.1 * px)} strokeLinejoin="round" />
          {facet.length > 2 && <path d={pd(facet)} fill="#8794A6" />}
          {heat > 0.02 && <path d={pd(q.pts)} fill="#F08A3C" opacity={heat * 0.5} />}
          {!lowDetail && lit.map((e, k) => <line key={k} x1={e[0][0]} y1={e[0][1]} x2={e[1][0]} y2={e[1][1]} stroke={heat > 0.3 ? '#FFE3B8' : '#F3F7FA'} strokeWidth={Math.max(1.4, 1.3 * px)} strokeLinecap="round" opacity={0.8} />)}
        </g>
      );
    });
  // melt spreading from the particles: liquid discs that grow round each particle and merge
  const meltDiscs = st.melt > 0.001 && st.melt < 0.999 && (
    <g>
      {parts.map((p, i) => {
        const q = placed(p, st, t, false);
        return <circle key={i} cx={q.x} cy={q.y} r={p.r * (1.1 + 7 * st.melt * st.melt) + 160 * st.melt * st.melt} fill={LIQ} />;
      })}
    </g>
  );
  const half = fz !== null ? `M${-EXT * 2},${-EXT * 2} L${fz},${-EXT * 2} L${fz},${EXT * 2} L${-EXT * 2},${EXT * 2}Z` : '';
  return (
    <g transform={`translate(${cx.toFixed(5)} ${cy.toFixed(5)}) scale(${unit})`}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <circle cx={0} cy={0} r={R} />
        </clipPath>
        {fz !== null && (
          <clipPath id={`${id}-frz`}>
            <path d={half} />
          </clipPath>
        )}
        <radialGradient id={`${id}-wall`} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={R}>
          <stop offset="0.6" stopColor="#5E6973" />
          <stop offset="1" stopColor="#262D35" />
        </radialGradient>
        <linearGradient id={`${id}-light`} gradientUnits="userSpaceOnUse" x1={-R} y1={R} x2={R} y2={-R}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#0B1620" stopOpacity={0.28} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} gradientUnits="userSpaceOnUse" x1={sheenX - 260} y1={-200} x2={sheenX + 260} y2={200}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.2} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-lq`} gradientUnits="userSpaceOnUse" x1={-R + 300 * Math.sin(t * 1.3)} y1={R} x2={R} y2={-R + 300 * Math.cos(t * 1.1)}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.05} />
          <stop offset="0.55" stopColor="#4F5D6B" stopOpacity={0.35} />
          <stop offset="0.75" stopColor="#FFFFFF" stopOpacity={0.12} />
          <stop offset="1" stopColor="#3D4A57" stopOpacity={0.4} />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0" stopColor="#FFB062" stopOpacity={0.9} />
          <stop offset="0.45" stopColor="#FF8A3A" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FF7A2A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-ao`} gradientUnits="userSpaceOnUse" cx={off[0]} cy={off[1]} r={R}>
          <stop offset="0.72" stopColor="#0A1118" stopOpacity={0} />
          <stop offset="1" stopColor="#0A1118" stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <circle cx={0} cy={0} r={R} fill={`url(#${id}-wall)`} />
        <g transform={`translate(${off[0].toFixed(1)} ${off[1].toFixed(1)})`}>
          {st.melt < 0.999 ? (
            <>
              <circle cx={0} cy={0} r={R * 1.3} fill={MATRIX} />
              {showGrains && grainsEl}
              {meltDiscs}
              {st.melt > 0.6 && <g opacity={(st.melt - 0.6) / 0.4}>{liquidEl}</g>}
            </>
          ) : (
            liquidEl
          )}
          {fz !== null && (
            <g clipPath={`url(#${id}-frz)`}>
              <circle cx={0} cy={0} r={R * 1.3} fill={MATRIX} />
              {grainsEl}
            </g>
          )}
          {fz === null ? partsEl(false) : (
            <>
              <g clipPath={`url(#${id}-frzR)`}>{partsEl(false)}</g>
              <g clipPath={`url(#${id}-frz)`}>{partsEl(true)}</g>
              <defs>
                <clipPath id={`${id}-frzR`}>
                  <path d={`M${fz},${-EXT * 2} L${EXT * 2},${-EXT * 2} L${EXT * 2},${EXT * 2} L${fz},${EXT * 2}Z`} />
                </clipPath>
              </defs>
              {/* the crystallisation front */}
              <line x1={fz} y1={-EXT} x2={fz} y2={EXT} stroke="#FFFFFF" strokeWidth={Math.max(3, 2.5 * px)} opacity={0.7} />
              <line x1={fz - 6 * px} y1={-EXT} x2={fz - 6 * px} y2={EXT} stroke="#DDE6EE" strokeWidth={Math.max(6, 5 * px)} opacity={0.25} />
            </>
          )}
          <circle cx={0} cy={0} r={R * 1.2} fill={`url(#${id}-light)`} />
          <circle cx={0} cy={0} r={R * 1.2} fill={`url(#${id}-sheen)`} />
          <circle cx={-off[0]} cy={-off[1]} r={R} fill={`url(#${id}-ao)`} />
        </g>
      </g>
      <circle cx={0} cy={0} r={R} fill="none" stroke={INK} strokeWidth={Math.max(4, 3.2 * px)} />
      <circle cx={0} cy={0} r={R - 2.2 * px} fill="none" stroke="#F4F7F9" strokeWidth={Math.max(2, 1.6 * px)} strokeDasharray={`${(Math.PI * R * 0.9).toFixed(0)} ${(Math.PI * R * 1.1).toFixed(0)}`} strokeDashoffset={(-Math.PI * R * 0.45).toFixed(0)} opacity={0.85} />
    </g>
  );
};
