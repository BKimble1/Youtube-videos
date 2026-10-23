// Tissue scale (world unit ≈ 0.1 µm, a cell is r≈58). One infinite, deterministic hex lattice of epithelial cells:
// cell (i, j) always has the same position, shape and shading, so every shot that visits the tissue sees the same
// neighbourhood. Level of detail by screen size: full cells (membrane, shading, nucleus, organelles) when large,
// simple cells when small, and an SVG pattern tile of the same lattice when the cells are only a few pixels wide.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, clamp01, closedPath, lerp, mixHex, noise, rand, smooth} from '../../kit/core';
import {P} from '../palette';

export const SP = 120;              // lattice spacing
export const R = 58;                // nominal cell radius
const DY = SP * 0.866;
const PER = 14;                     // jitter period (pattern tile = PER × PER cells)
const mod = (a: number, n: number) => ((a % n) + n) % n;

export type Look = {fill: string; light: string; deep: string; nuc: string; nucDeep: string};
export const HEALTHY: Look = {fill: P.tissue, light: P.tissueLight, deep: P.tissueDeep, nuc: P.nucleus, nucDeep: P.nucleusDeep};
export const TUMOR: Look = {fill: '#B0457C', light: '#E07BB0', deep: P.tumorDeep, nuc: '#5A1446', nucDeep: '#3A0A2E'};
export const lookMix = (a: Look, b: Look, k: number): Look => ({
  fill: mixHex(a.fill, b.fill, k), light: mixHex(a.light, b.light, k), deep: mixHex(a.deep, b.deep, k), nuc: mixHex(a.nuc, b.nuc, k), nucDeep: mixHex(a.nucDeep, b.nucDeep, k),
});
/** subclone looks for heterogeneity (all in the tumour family: magenta / violet / wine / plum) */
export const CLONES: Look[] = [
  TUMOR,
  {fill: '#8E3AA8', light: '#C27BE0', deep: '#4A1660', nuc: '#3A0E50', nucDeep: '#24063A'},
  {fill: '#C23A5A', light: '#F07A92', deep: '#6A1428', nuc: '#4E0A22', nucDeep: '#30041A'},
  {fill: '#7A2E8E', light: '#B06AC8', deep: '#3E0E4E', nuc: '#2A0838', nucDeep: '#1A0424'},
];

/** Lattice cell centre (deterministic). */
export const cellAt = (i: number, j: number) => {
  const pi = mod(i, PER), pj = mod(j, PER);
  const jx = (rand(pi * 131 + pj * 977 + 11) - 0.5) * SP * 0.26;
  const jy = (rand(pi * 313 + pj * 541 + 23) - 0.5) * SP * 0.26;
  // controlled size variation (cells press into each other rather than tiling perfectly)
  const sz = 0.88 + 0.2 * rand(pi * 71 + pj * 29 + 5);
  return {x: i * SP + (mod(j, 2) ? SP / 2 : 0) + jx, y: j * DY + jy, seed: pi * 17 + pj * 101 + 3, sz};
};
/** Nearest lattice indices to a world point. */
export const nearest = (x: number, y: number) => {
  const j = Math.round(y / DY);
  const i = Math.round((x - (mod(j, 2) ? SP / 2 : 0)) / SP);
  return {i, j};
};

/** Polygon-ish cell outline: a rounded hexagon with seeded irregularity (cells press against their neighbours). */
/** flat: the membrane pressed against a contact plane (a = direction of the contact, d = depth of the press as a
 *  fraction of r); the rest of the cell bulges slightly to keep its volume. irr: extra outline irregularity. */
export type Flat = {a: number; d: number};
export const pressR = (rr: number, a: number, r: number, flat?: Flat) => {
  if (!flat || flat.d <= 0) return rr;
  const c = Math.cos(a - flat.a);
  const p = r * (1 - flat.d);
  const out = c > 0.05 ? Math.min(rr, p / c) : rr;
  return out * (1 + 0.22 * flat.d * smooth(clamp01(-c * 1.5 + 0.3)));
};
export const cellOutline = (r: number, seed: number, t: number, opts: {round?: number; stretch?: number; dir?: number; bleb?: number; wob?: number; irr?: number; flat?: Flat} = {}) => {
  const {round = 0, stretch = 1, dir = 0, bleb = 0, wob = 0.03, irr = 0, flat} = opts;
  const n = 18;
  const pts: Pt[] = [];
  const rot0 = rand(seed * 7) * 60;
  const nb = 6;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    // hexagon radius at angle a (flat sides) blended toward a circle by `round`
    const ah = ((((a * 180) / Math.PI - rot0) % 60) + 60) % 60 - 30;
    const hex = Math.cos(Math.PI / 6) / Math.cos((ah * Math.PI) / 180);
    let rr = r * lerp(hex * 0.97, 1, 0.45 + 0.55 * round) * (1 + (0.07 + irr) * noise(k * 0.9, seed) + irr * 0.6 * noise(k * 2.1, seed + 13) + wob * Math.sin(t * 1.3 + k * 1.7 + seed));
    for (let b = 0; b < nb && bleb > 0; b++) {
      const ab = rand(seed * 17 + b) * Math.PI * 2;
      const da = Math.atan2(Math.sin(a - ab), Math.cos(a - ab));
      rr += r * 0.26 * smooth(clamp01(bleb * 1.6 - rand(seed * 5 + b) * 0.6)) * (0.8 + 0.3 * Math.sin(t * 4 + b)) * Math.exp(-(da * da) / 0.05);
    }
    // directional elongation (migration / EMT)
    const ca = Math.cos(a - dir);
    const sx = lerp(1, stretch, ca * ca);
    rr = pressR(rr, a, r, flat);
    pts.push([Math.cos(a) * rr * sx, Math.sin(a) * rr / Math.sqrt(stretch)]);
  }
  return pts;
};

export type CellProps = {
  x: number; y: number; r?: number; seed?: number; t: number; look?: Look; rot?: number;
  lod: number;            // screen radius in px (detail)
  pulse?: number;         // abnormal nucleus pulse (0..1)
  round?: number; stretch?: number; dir?: number; bleb?: number; op?: number; shrink?: number; nucScale?: number;
  stress?: number;        // dims the cell (signal of damage)
  irr?: number;           // outline irregularity (abnormal cells)
  flat?: Flat;            // membrane pressed against a contact
};

/** One shaded epithelial cell. */
export const Cell2: React.FC<CellProps> = ({x, y, r = R, seed = 1, t, look = HEALTHY, rot = 0, lod, pulse = 0, round = 0, stretch = 1, dir = 0, bleb = 0, op = 1, shrink = 0, nucScale = 1, stress = 0, irr = 0, flat}) => {
  const rr = r * (1 - 0.3 * shrink);
  const d = closedPath(cellOutline(rr, seed, t, {round, stretch, dir, bleb, irr, flat: flat && {a: flat.a - (rot * Math.PI) / 180, d: flat.d}}), 1);
  const fill = mixHex(look.fill, '#8A6A78', stress * 0.4);
  const nr = rr * 0.38 * nucScale * (0.88 + 0.24 * rand(seed * 3 + 1));
  const nx = rr * 0.06 * Math.cos(seed), ny = rr * 0.05 * Math.sin(seed * 1.7);
  if (lod < 10) {
    return (
      <g opacity={op} transform={`translate(${x} ${y})`}>
        <circle r={rr * 0.95} fill={look.deep} />
        <circle r={rr * 0.86} fill={fill} />
        <circle cx={nx} cy={ny} r={nr} fill={look.nuc} />
        {pulse > 0.01 && <circle r={rr * 2.6} fill="url(#glowMut)" opacity={pulse} />}
      </g>
    );
  }
  return (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={d} fill={look.deep} />
      <path d={d} fill={fill} transform="scale(0.93)" />
      <path d={d} fill="url(#vol)" transform="scale(0.93)" />
      {lod > 16 && <path d={d} fill="none" stroke={look.light} strokeWidth={rr * 0.03} opacity={0.55} transform="scale(0.88)" />}
      {lod > 22 && Array.from({length: 5}, (_, k) => {
        const a = rand(seed * 41 + k) * Math.PI * 2, dd = rr * (0.55 + 0.2 * rand(seed * 43 + k));
        return k % 2 ? (
          <ellipse key={k} cx={Math.cos(a) * dd} cy={Math.sin(a) * dd} rx={rr * 0.13} ry={rr * 0.055} transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * dd} ${Math.sin(a) * dd})`} fill={P.mito} opacity={0.7} />
        ) : (
          <circle key={k} cx={Math.cos(a) * dd} cy={Math.sin(a) * dd} r={rr * 0.045} fill={look.light} opacity={0.8} />
        );
      })}
      {/* nucleus */}
      <ellipse cx={nx} cy={ny} rx={nr * 1.08} ry={nr * 0.94} fill={look.nucDeep} />
      <ellipse cx={nx} cy={ny} rx={nr} ry={nr * 0.86} fill={mixHex(look.nuc, P.mutant, pulse * 0.55)} />
      <ellipse cx={nx} cy={ny} rx={nr} ry={nr * 0.86} fill="url(#nucVol)" />
      {lod > 14 && <circle cx={nx + nr * 0.25} cy={ny - nr * 0.1} r={nr * 0.24} fill={look.nucDeep} opacity={0.85} />}
      {lod > 30 && Array.from({length: 7}, (_, k) => {
        const a = rand(seed * 59 + k) * Math.PI * 2, dd = nr * 0.6 * rand(seed * 61 + k);
        return <circle key={k} cx={nx + Math.cos(a) * dd} cy={ny + Math.sin(a) * dd * 0.86} r={nr * 0.07} fill={look.nucDeep} opacity={0.6} />;
      })}
      {pulse > 0.01 && <circle cx={nx} cy={ny} r={nr * 3.2} fill="url(#glowMut)" opacity={pulse * 0.9} />}
    </g>
  );
};

export type Mod = {
  dx?: number; dy?: number; s?: number; look?: Look; hide?: boolean; pulse?: number; stress?: number; shrink?: number; op?: number; round?: number; nucScale?: number; bleb?: number; stretch?: number; dir?: number; irr?: number;
};

const viewBounds = (cam: Cam, pad: number, depth = 1) => {
  const z = cam.z * depth;
  const hw = (Math.hypot(W, H) / 2) / z + pad, hh = hw;
  return {x0: cam.x - hw, x1: cam.x + hw, y0: cam.y - hh, y1: cam.y + hh};
};

/** Tile pattern of the same lattice (for far zoom). Must be rendered inside <defs> of the frame. */
export const TissuePattern: React.FC<{id: string; look?: Look}> = ({id, look = HEALTHY}) => {
  const cells: React.ReactNode[] = [];
  for (let j = -1; j <= PER; j++)
    for (let i = -1; i <= PER; i++) {
      const c = cellAt(i, j);
      const e = 0.9 + 0.2 * rand(c.seed * 7);
      cells.push(
        <g key={`${i},${j}`} transform={`translate(${c.x} ${c.y}) rotate(${rand(c.seed * 5) * 180})`}>
          <ellipse rx={R * c.sz * e} ry={R * c.sz / e} fill={look.fill} />
          <ellipse rx={R * c.sz * e} ry={R * c.sz / e} fill="url(#volSoft)" />
          <ellipse cx={R * 0.08 * Math.cos(c.seed)} cy={R * 0.06 * Math.sin(c.seed * 1.7)} rx={R * 0.36 * (0.9 + 0.2 * rand(c.seed * 3))} ry={R * 0.32} fill={look.nuc} />
        </g>,
      );
    }
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={PER * SP} height={PER * DY}>
      <rect width={PER * SP} height={PER * DY} fill={mixHex(P.tissueBg, look.fill, 0.22)} />
      {cells}
    </pattern>
  );
};

/** The living tissue sheet under a camera. `mod` customises individual cells (tumour, displacement, hidden…). */
export const TissueField: React.FC<{cam: Cam; t: number; mod?: (i: number, j: number, x: number, y: number) => Mod | null; patternId?: string; skip?: (i: number, j: number) => boolean}> = ({cam, t, mod, patternId = 'tissuePat', skip}) => {
  const lod = R * cam.z;
  const far = smooth((12 - lod) / 4); // 1 = healthy cells come from the pattern tile
  const b = viewBounds(cam, SP);
  const plain: React.ReactNode[] = [], special: React.ReactNode[] = [];
  const j0 = Math.floor(b.y0 / DY), j1 = Math.ceil(b.y1 / DY), i0 = Math.floor(b.x0 / SP) - 1, i1 = Math.ceil(b.x1 / SP) + 1;
  // far out (cells under a pixel and nothing customised) there is nothing per-cell to draw
  const skipCells = (far >= 1 && !mod) || cam.z < 0.004;
  for (let j = skipCells ? j1 + 1 : j0; j <= j1; j++)
    for (let i = i0; i <= i1; i++) {
      if (skip?.(i, j)) continue;
      const c = cellAt(i, j);
      const m = mod?.(i, j, c.x, c.y) ?? {};
      if (m.hide) continue;
      const isSpecial = !!m.look || !!m.pulse;
      if (!isSpecial && far >= 1) continue;
      const sw = 0.75 * Math.sin(t * 0.9 + c.seed);
      const el = <Cell2 key={`${i},${j}`} x={c.x + (m.dx ?? 0) + sw} y={c.y + (m.dy ?? 0)} r={R * c.sz * (m.s ?? 1)} seed={c.seed} t={t} lod={lod * (m.s ?? 1)} look={m.look} pulse={m.pulse} stress={m.stress} shrink={m.shrink} op={m.op} round={m.round} nucScale={m.nucScale} bleb={m.bleb} stretch={m.stretch} dir={m.dir} irr={m.irr} />;
      (isSpecial ? special : plain).push(el);
    }
  return (
    <g>
      <rect x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} fill={far > 0 ? `url(#${patternId})` : P.tissueBg} />
      {far < 1 && <g opacity={1 - far}>{plain}</g>}
      {far > 0.01 && cam.z > 0.01 && <TissueVariation b={b} op={far} />}
      {special}
    </g>
  );
};

/** Large-scale, stable variation over the far-zoom tissue texture (lobules of slightly lighter / darker tissue), so
 *  the pattern tile never reads as wallpaper. World-anchored, so it does not swim during zooms. */
const TissueVariation: React.FC<{b: {x0: number; x1: number; y0: number; y1: number}; op: number}> = ({b, op}) => {
  const S = 1700;
  const out: React.ReactNode[] = [];
  for (let j = Math.floor(b.y0 / S) - 1; j <= Math.ceil(b.y1 / S) + 1; j++)
    for (let i = Math.floor(b.x0 / S) - 1; i <= Math.ceil(b.x1 / S) + 1; i++) {
      const sd = mod(i, 23) * 31 + mod(j, 19) * 7;
      const x = i * S + rand(sd) * S, y = j * S + rand(sd + 1) * S;
      out.push(<circle key={`${i},${j}`} cx={x} cy={y} r={S * (0.5 + 0.4 * rand(sd + 2))} fill={rand(sd + 3) < 0.5 ? 'url(#glowWhite)' : 'url(#glowRed)'} opacity={0.12 * op} />);
    }
  return <g>{out}</g>;
};

/** Depth: a far layer of large out-of-focus cells behind the sheet's gaps, and drifting near particles in front. */
export const TissueBack: React.FC<{cam: Cam; t: number; tint?: string}> = ({cam, t, tint = P.tissueDeep}) => {
  const depth = 0.55;
  const b = viewBounds(cam, 400, depth);
  const s = 520;
  const out: React.ReactNode[] = [];
  // the out-of-focus layer is sub-pixel when the camera is far out: skip it
  if (cam.z * depth > 0.03)
  for (let j = Math.floor(b.y0 / s); j <= Math.ceil(b.y1 / s); j++)
    for (let i = Math.floor(b.x0 / s); i <= Math.ceil(b.x1 / s); i++) {
      const sd = mod(i, 7) * 13 + mod(j, 7) * 71;
      const x = i * s + rand(sd) * s * 0.6, y = j * s + rand(sd + 1) * s * 0.6;
      out.push(<circle key={`${i},${j}`} cx={x + 20 * Math.sin(t * 0.3 + sd)} cy={y} r={s * (0.35 + 0.2 * rand(sd + 2))} fill="url(#glowRed)" opacity={0.18} />);
    }
  return (
    <g>
      <rect width={W} height={H} fill="url(#tissueDepth)" />
      <g transform={camTransform(cam, depth)}>{out}</g>
      <rect width={W} height={H} fill={tint} opacity={0.05} />
    </g>
  );
};

export const Motes: React.FC<{cam: Cam; t: number; color?: string; n?: number; depth?: number; seed?: number; size?: number}> = ({cam, t, color = P.tissueLight, n = 26, depth = 1.7, seed = 5, size = 7}) => {
  // screen-space wrap: particles live on a torus of the frame so there are always some in view
  const z = cam.z * depth;
  const span = 2600;
  return (
    <g>
      {Array.from({length: n}, (_, k) => {
        const wx = rand(seed * 97 + k) * span + t * 18 * (rand(seed + k) - 0.5), wy = rand(seed * 89 + k) * span + t * 10;
        const sx = mod(wx - cam.x * z, span) - (span - W) / 2;
        const sy = mod(wy - cam.y * z, span) - (span - H) / 2;
        const r = size * (0.5 + rand(seed * 7 + k)) * Math.min(3, Math.max(0.6, Math.log10(1 + cam.z * 2)));
        return <circle key={k} cx={sx} cy={sy} r={r} fill={color} opacity={0.09 + 0.08 * rand(seed * 3 + k)} />;
      })}
    </g>
  );
};

/** Immune killer cell (T cell / NK look): teal, rounder, microvilli, large nucleus; crawls with a leading edge. */
export const TCell2: React.FC<{x: number; y: number; r?: number; t: number; seed?: number; dir?: number; lod?: number; act?: number; dim?: number; op?: number; color?: string; light?: string; deep?: string; spikes?: number; flat?: Flat; lead?: number}> = ({x, y, r = 46, t, seed = 3, dir = 0, lod = 50, act = 0, dim = 0, op = 1, color = P.tcell, light = P.tcellLight, deep = P.tcellDeep, spikes = 1, flat, lead: leadK = 1}) => {
  const n = 16;
  const pts: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const da = Math.atan2(Math.sin(a - dir), Math.cos(a - dir));
    const lead = leadK * 0.18 * Math.exp(-(da * da) / 0.5) * (0.8 + 0.2 * Math.sin(t * 3 + seed));
    const tail = leadK * 0.12 * Math.exp(-((Math.abs(da) - Math.PI) ** 2) / 0.2);
    // (identical to the V2/V3 outline unless the membrane is pressed against a contact)
    const fx = 1 + lead + tail * 0.4 + 0.04 * noise(t * 1.5 + k, seed), fy = 1 + lead - tail * 0.3 + 0.04 * noise(t * 1.5 + k, seed + 9);
    const r0 = (r * (fx + fy)) / 2;
    const kp = flat ? pressR(r0, a, r, flat) / r0 : 1;
    pts.push([Math.cos(a) * r * fx * kp, Math.sin(a) * r * fy * kp]);
  }
  const c = mixHex(color, '#6E7C80', dim * 0.7), l = mixHex(light, '#9AA6A8', dim * 0.7);
  const d = closedPath(pts);
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      {act > 0.01 && <circle r={r * 2.6} fill="url(#glowGold)" opacity={act * 0.55} />}
      {lod > 10 && spikes > 0 && Array.from({length: 22}, (_, k) => {
        const a = (k / 22) * Math.PI * 2 + seed;
        const pr = pressR(r, a, r, flat) / r;
        const len = r * (0.18 + 0.08 * Math.sin(t * 2 + k * 2.3)) * smooth(clamp01((pr - 0.86) / 0.12));
        if (len < 1) return null;
        return <line key={k} x1={Math.cos(a) * r * 0.95 * pr} y1={Math.sin(a) * r * 0.95 * pr} x2={Math.cos(a) * (r * pr + len)} y2={Math.sin(a) * (r * pr + len)} stroke={l} strokeWidth={r * 0.07} strokeLinecap="round" opacity={0.85 * spikes} />;
      })}
      <path d={d} fill={mixHex(deep, '#4A5456', dim * 0.6)} />
      <path d={d} fill={c} transform="scale(0.92)" />
      <path d={d} fill="url(#vol)" transform="scale(0.92)" />
      <ellipse cx={-r * 0.12 * Math.cos(dir)} cy={-r * 0.12 * Math.sin(dir)} rx={r * 0.55} ry={r * 0.5} fill={mixHex(deep, '#3A4446', dim * 0.6)} />
      <ellipse cx={-r * 0.12 * Math.cos(dir)} cy={-r * 0.12 * Math.sin(dir)} rx={r * 0.55} ry={r * 0.5} fill="url(#nucVol)" />
      {act > 0.01 && <path d={d} fill="none" stroke={P.immuneGold} strokeWidth={r * 0.06} opacity={act} transform="scale(0.95)" />}
    </g>
  );
};

/** Real mitosis for one cell, p = 0..1: rounding + chromatin condensing (0–0.2), chromosomes on the metaphase plate
 *  with spindle fibres (0.2–0.4), sister chromatids pulled to the poles while the cell elongates (0.4–0.6),
 *  cleavage furrow pinches and nuclei re-form (0.6–0.85), daughters separate (0.85–1). axis in degrees. */
export const DividingCell: React.FC<{x: number; y: number; r?: number; seed: number; t: number; p: number; axis?: number; lod: number; look?: Look; pulse?: number; sepF?: number; dR?: number}> = ({x, y, r = R, seed, t, p, axis = 0, lod, look = HEALTHY, pulse = 0, sepF = 0.62, dR = 0.74}) => {
  const ph = (a: number, b: number) => smooth((p - a) / (b - a));
  const round = ph(0, 0.15);
  const sep = p < 0.4 ? 0 : p < 0.6 ? lerp(0, 0.34, ph(0.4, 0.6)) : p < 0.85 ? lerp(0.34, 0.52, ph(0.6, 0.85)) : lerp(0.52, sepF, ph(0.85, 1));
  const lobeR = lerp(1.02, dR, ph(0.45, 0.9));
  const neck = sep > 0 ? lobeR * (1 - ph(0.6, 0.86)) * 0.95 : 0;
  const nucOld = 1 - ph(0.04, 0.2);
  const nucNew = ph(0.66, 0.8);
  const chromo = Math.min(ph(0.06, 0.18), 1 - ph(0.7, 0.82));
  const spindle = Math.min(ph(0.18, 0.28), 1 - ph(0.6, 0.7));
  const fill = look.fill;
  if (lod < 7) {
    return (
      <g transform={`translate(${x} ${y}) rotate(${axis})`}>
        {sep > 0 ? [-1, 1].map((s) => <circle key={s} cx={s * sep * r} r={lobeR * r} fill={fill} />) : <circle r={r} fill={fill} />}
        {pulse > 0.01 && <circle r={r * 2.6} fill="url(#glowMut)" opacity={pulse} />}
      </g>
    );
  }
  const lobes = sep > 0 ? [-1, 1] : [0];
  const lobeD = (s: number) => closedPath(cellOutline(lobeR * r, seed + (s > 0 ? 5 : 0), t, {round: lerp(round, 0.3, ph(0.9, 1)), wob: 0.02}).map(([px, py]) => [px + s * sep * r, py] as Pt), 1);
  const chromos = Array.from({length: 6}, (_, k) => {
    const a0 = rand(seed * 71 + k) * Math.PI * 2, d0 = r * 0.22 * rand(seed * 73 + k);
    const start: Pt = [Math.cos(a0) * d0, Math.sin(a0) * d0];
    const plate: Pt = [0, (k - 2.5) * r * 0.15];
    const m = ph(0.16, 0.34);
    const base: Pt = [lerp(start[0], plate[0], m), lerp(start[1], plate[1], m)];
    const pull = ph(0.4, 0.62);
    return {base, pull, ang: lerp(rand(k * 9) * 180, 90, m)};
  });
  return (
    <g transform={`translate(${x} ${y}) rotate(${axis})`}>
      {pulse > 0.01 && <circle r={r * 2.4} fill="url(#glowMut)" opacity={pulse * 0.7} />}
      {lobes.map((s) => <path key={'d' + s} d={lobeD(s)} fill={look.deep} />)}
      {neck > 0.01 && <ellipse rx={sep * r} ry={neck * r * 1.02} fill={look.deep} />}
      {lobes.map((s) => <path key={'f' + s} d={lobeD(s)} fill={fill} transform={`translate(${s * sep * r} 0) scale(0.93) translate(${-s * sep * r} 0)`} />)}
      {neck > 0.01 && <ellipse rx={sep * r} ry={neck * r * 0.93} fill={fill} />}
      {lobes.map((s) => <path key={'v' + s} d={lobeD(s)} fill="url(#vol)" transform={`translate(${s * sep * r} 0) scale(0.93) translate(${-s * sep * r} 0)`} />)}
      {/* spindle */}
      {spindle > 0.01 && lod > 14 && (
        <g stroke={P.white} strokeWidth={r * 0.012} opacity={spindle * 0.55}>
          {chromos.map((c, k) => [-1, 1].map((s) => {
            const cx = c.base[0] + s * c.pull * r * 0.5;
            return <line key={`${k}${s}`} x1={s * r * (0.72 + sep * 0.6)} y1={0} x2={cx} y2={c.base[1] * (1 - c.pull * 0.5)} />;
          }))}
          {[-1, 1].map((s) => <circle key={s} cx={s * r * (0.72 + sep * 0.6)} cy={0} r={r * 0.05} fill={P.white} />)}
        </g>
      )}
      {/* old nucleus fading as chromatin condenses */}
      {nucOld > 0.01 && (
        <g opacity={nucOld}>
          <ellipse rx={r * 0.4} ry={r * 0.35} fill={look.nucDeep} />
          <ellipse rx={r * 0.37} ry={r * 0.32} fill={mixHex(look.nuc, P.mutant, pulse * 0.5)} />
          <ellipse rx={r * 0.37} ry={r * 0.32} fill="url(#nucVol)" />
        </g>
      )}
      {/* chromosomes: X shapes → split into chromatids that travel to the poles */}
      {chromo > 0.01 && chromos.map((c, k) => [-1, 1].map((s) => {
        // sister chromatid as a V: centromere (apex) leads toward its pole, arms trail behind
        const off = c.pull * (r * 0.42 + sep * r * 0.55) * s;
        const L = r * 0.16;
        const cx = c.base[0] + off + s * r * 0.035, cy = c.base[1] * (1 - c.pull * 0.45);
        const spread = 0.55 - 0.25 * c.pull;
        const col = mixHex(look.nucDeep, P.mutant, pulse * 0.45);
        const d = `M ${cx - s * L} ${cy - L * spread} Q ${cx + s * L * 0.05} ${cy} ${cx - s * L} ${cy + L * spread}`;
        return (
          <g key={`${k}${s}`} opacity={chromo}>
            <path d={d} fill="none" stroke={col} strokeWidth={r * 0.07} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={r * 0.02} strokeLinecap="round" opacity={0.35} />
          </g>
        );
      }))}
      {/* re-forming daughter nuclei */}
      {nucNew > 0.01 && [-1, 1].map((s) => (
        <g key={s} opacity={nucNew} transform={`translate(${s * sep * r} 0)`}>
          <ellipse rx={r * 0.3} ry={r * 0.27} fill={look.nucDeep} />
          <ellipse rx={r * 0.28} ry={r * 0.25} fill={mixHex(look.nuc, P.mutant, pulse * 0.5)} />
          <ellipse rx={r * 0.28} ry={r * 0.25} fill="url(#nucVol)" />
        </g>
      ))}
    </g>
  );
};

/** Lobulated tumour outline: radius factor by angle (irregular, not a circle). */
export const boundary = (a: number) => 1 + 0.11 * Math.sin(3 * a + 1) + 0.07 * Math.sin(5 * a + 2.2) + 0.045 * Math.sin(9 * a + 4) + 0.03 * Math.sin(14 * a + 0.5);
export const boundaryPathAt = (Rt: number, cx: number, cy: number) => {
  const pts: Pt[] = Array.from({length: 72}, (_, k) => {
    const a = (k / 72) * Math.PI * 2;
    return [cx + Math.cos(a) * Rt * boundary(a), cy + Math.sin(a) * Rt * boundary(a)] as Pt;
  });
  return 'M ' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L ') + ' Z';
};

/** Apoptosis (programmed death) as an ordered sequence, die = 0..1:
 *  contraction — the cell shrinks and rounds (0–0.25); nuclear condensation — chromatin darkens and packs (0.15–0.4);
 *  nuclear fragmentation — the nucleus breaks into dense beads (0.35–0.55); membrane blebbing (0.45–0.75);
 *  apoptotic bodies — small, irregular, membrane-bound fragments that stay together (0.7–1). Nothing explodes, and the
 *  fragments never look like new cells (no nuclei of their own, different sizes, tight cluster). */
export const ApoptoticCell: React.FC<{x: number; y: number; r?: number; seed: number; t: number; die: number; look?: Look; lod: number; op?: number}> = ({x, y, r = R, seed, t, die, look = TUMOR, lod, op = 1}) => {
  const ph = (a: number, b: number) => smooth((die - a) / (b - a));
  const contract = ph(0, 0.25), cond = ph(0.15, 0.4), frag = ph(0.35, 0.55), bleb = ph(0.45, 0.75) * (1 - ph(0.72, 0.85)), bodies = ph(0.7, 0.92);
  const dead = lookMix(look, {...look, fill: '#9A7E92', light: '#C2AABC', deep: '#5E4458'}, 0.25 + 0.45 * contract);
  const rr = r * (1 - 0.32 * contract);
  if (bodies < 0.01) {
    const d = closedPath(cellOutline(rr, seed, t, {round: contract, bleb: bleb * 1.2, wob: 0.02}), 1);
    const nr = rr * lerp(0.38, 0.26, cond);
    const beads = frag > 0.01;
    return (
      <g opacity={op} transform={`translate(${x} ${y})`}>
        <path d={d} fill={dead.deep} />
        <path d={d} fill={dead.fill} transform="scale(0.93)" />
        <path d={d} fill="url(#vol)" transform="scale(0.93)" />
        {!beads ? (
          <circle r={nr} fill={mixHex(look.nuc, '#1E0818', cond * 0.8)} />
        ) : (
          Array.from({length: 4}, (_, m) => {
            const a = (m / 4) * Math.PI * 2 + seed;
            const dd = nr * 0.75 * frag;
            return <circle key={m} cx={Math.cos(a) * dd} cy={Math.sin(a) * dd} r={nr * lerp(0.75, 0.42, frag)} fill="#1E0818" />;
          })
        )}
        {lod > 12 && <path d={d} fill="none" stroke={dead.light} strokeWidth={rr * 0.03} opacity={0.5} transform="scale(0.9)" />}
      </g>
    );
  }
  // apoptotic bodies: a tight cluster of unequal fragments, some carrying a dense nuclear bead
  const n = 6;
  return (
    <g opacity={op * (1 - 0.45 * ph(0.9, 1))} transform={`translate(${x} ${y})`}>
      {Array.from({length: n}, (_, m) => {
        const a = (m / n) * Math.PI * 2 + seed * 0.7;
        const d = rr * (0.25 + 0.3 * bodies) * (0.7 + 0.5 * rand(seed + m * 3));
        const br = rr * (0.18 + 0.16 * rand(seed + m)) ;
        const cx = Math.cos(a) * d, cy = Math.sin(a) * d;
        return (
          <g key={m}>
            <circle cx={cx} cy={cy} r={br} fill={dead.deep} />
            <circle cx={cx} cy={cy} r={br * 0.86} fill={dead.fill} />
            <circle cx={cx} cy={cy} r={br * 0.86} fill="url(#vol)" />
            {m % 2 === 0 && <circle cx={cx + br * 0.15} cy={cy} r={br * 0.32} fill="#1E0818" />}
          </g>
        );
      })}
    </g>
  );
};

