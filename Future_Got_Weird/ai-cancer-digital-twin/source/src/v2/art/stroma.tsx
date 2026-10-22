// Tissue-scale plumbing and scaffolding (tissue units): capillaries with flowing red cells, angiogenic sprouts that
// grow from them toward the tumour, nutrient particles, extracellular-matrix fibres, and the immune-checkpoint
// "shield" ligands a tumour cell can display.
import React from 'react';
import {P as Pt, openPath, rand, mixHex, smooth, clamp01, lerp, noise} from '../../kit/core';
import {P} from '../palette';

/** Point and tangent along a polyline at arc fraction u (0..1). */
export const along = (pts: Pt[], u: number): {p: Pt; ang: number} => {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const s = clamp01(u) * L[L.length - 1];
  let i = 1;
  while (i < pts.length - 1 && L[i] < s) i++;
  const k = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  const a = pts[i - 1], b = pts[i];
  return {p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], ang: Math.atan2(b[1] - a[1], b[0] - a[0])};
};
export const polyLen = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
/** Densify a few control points into a smooth polyline (Catmull-Rom sampled). */
export const smoothPts = (ctrl: Pt[], n = 60): Pt[] => {
  const out: Pt[] = [];
  const m = ctrl.length;
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * (m - 1);
    const i = Math.min(m - 2, Math.floor(u)), f = u - i;
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(m - 1, i + 2)];
    const cr = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    out.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
  }
  return out;
};

/** A capillary: wall, lumen, and red cells flowing along it. grow (0..1) reveals it from its start (for sprouts). */
export const Capillary: React.FC<{pts: Pt[]; w?: number; t: number; grow?: number; flow?: number; perfuse?: number; color?: string; lod?: number}> = ({pts, w = 60, t, grow = 1, flow = 260, perfuse = 1, color = P.blood, lod = 1}) => {
  const n = Math.max(2, Math.ceil(pts.length * clamp01(grow)));
  const sub = pts.slice(0, n);
  if (grow < 1 && sub.length >= 2) sub[sub.length - 1] = along(pts, grow).p;
  const d = openPath(sub, 1);
  const L = polyLen(sub);
  const rbcs: React.ReactNode[] = [];
  if (perfuse > 0.01 && lod > 0.08) {
    const spacing = w * 1.4;
    const cnt = Math.floor(L / spacing);
    const total = polyLen(pts);
    for (let k = 0; k < cnt; k++) {
      const s = ((k * spacing + t * flow) % (cnt * spacing));
      const u = s / total;
      if (s > L * perfuse) continue;
      const q = along(pts, u);
      rbcs.push(<ellipse key={k} cx={q.p[0]} cy={q.p[1]} rx={w * 0.36} ry={w * 0.24} transform={`rotate(${(q.ang * 180) / Math.PI + 90 + 25 * Math.sin(k + t)} ${q.p[0]} ${q.p[1]})`} fill={P.rbc} />);
    }
  }
  const tip = grow < 1 ? along(pts, grow) : null;
  return (
    <g>
      <path d={d} fill="none" stroke="#6E1424" strokeWidth={w * 1.35} strokeLinecap="round" />
      <path d={d} fill="none" stroke={P.vesselWall} strokeWidth={w * 1.15} strokeLinecap="round" />
      <path d={d} fill="none" stroke={mixHex(color, '#3A0610', 1 - perfuse)} strokeWidth={w * 0.78} strokeLinecap="round" />
      {rbcs}
      <path d={d} fill="none" stroke={P.vesselWallLight} strokeWidth={w * 0.12} strokeLinecap="round" opacity={0.5} transform={`translate(${-w * 0.22} ${-w * 0.22})`} />
      {tip && (
        <g transform={`translate(${tip.p[0]} ${tip.p[1]}) rotate(${(tip.ang * 180) / Math.PI})`}>
          {/* endothelial tip cell with filopodia probing ahead */}
          {[-0.5, -0.2, 0.15, 0.45].map((a, k) => (
            <line key={k} x1={0} y1={0} x2={Math.cos(a) * w * (1.6 + 0.4 * Math.sin(t * 3 + k))} y2={Math.sin(a) * w * (1.6 + 0.4 * Math.sin(t * 3 + k))} stroke={P.vesselWallLight} strokeWidth={w * 0.1} strokeLinecap="round" />
          ))}
          <ellipse rx={w * 0.85} ry={w * 0.62} fill={P.vesselWall} />
          <ellipse rx={w * 0.85} ry={w * 0.62} fill="url(#vol)" />
        </g>
      )}
    </g>
  );
};

/** Nutrient particles travelling from sources toward a sink (glucose / amino acids: small amber glows). */
export const Nutrients: React.FC<{from: Pt[]; to: Pt; t: number; k: number; n?: number; seed?: number; size?: number}> = ({from, to, t, k, n = 36, seed = 1, size = 11}) => {
  if (k <= 0.01) return null;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const src = from[i % from.length];
        const u = ((t * 0.35 + rand(seed * 31 + i)) % 1);
        const wob = 160 * noise(u * 3 + i, seed);
        const nx = -(to[1] - src[1]), ny = to[0] - src[0], nl = Math.hypot(nx, ny) || 1;
        const x = lerp(src[0], to[0], u) + (nx / nl) * wob, y = lerp(src[1], to[1], u) + (ny / nl) * wob;
        return (
          <g key={i} opacity={k * Math.min(1, u * 5) * (1 - smooth((u - 0.75) / 0.25))}>
            <circle cx={x} cy={y} r={size * 3.5} fill="url(#glowGold)" />
            <circle cx={x} cy={y} r={size} fill={P.plasma} />
          </g>
        );
      })}
    </g>
  );
};

/** Extracellular-matrix fibres (collagen bundles) as soft wavy strands. */
export const Fibres: React.FC<{x0: number; y0: number; x1: number; y1: number; t: number; op?: number; seed?: number}> = ({x0, y0, x1, y1, t, op = 1, seed = 3}) => {
  const n = 16;
  return (
    <g opacity={op} fill="none" strokeLinecap="round">
      {Array.from({length: n}, (_, i) => {
        const y = lerp(y0, y1, (i + rand(seed + i)) / n);
        const pts: Pt[] = Array.from({length: 8}, (_, m) => [lerp(x0, x1, m / 7), y + 40 * noise(m * 0.9 + t * 0.1, seed + i)] as Pt);
        return (
          <g key={i}>
            <path d={openPath(pts, 1)} stroke="#E8B8A8" strokeWidth={9} opacity={0.35} />
            <path d={openPath(pts, 1)} stroke="#FFF0E8" strokeWidth={3} opacity={0.35} />
          </g>
        );
      })}
    </g>
  );
};

/** Checkpoint "shield" ligands on a membrane: small orange Y-shaped proteins along an arc of radius r. */
export const ShieldLigands: React.FC<{x: number; y: number; r: number; a0: number; a1: number; k: number; n?: number; size?: number}> = ({x, y, r, a0, a1, k, n = 7, size = 14}) => {
  if (k <= 0.01) return null;
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const a = lerp(a0, a1, (i + 0.5) / n);
        const g = smooth(k * 1.6 - (i / n) * 0.6);
        const L = size * g;
        const bx = x + Math.cos(a) * r, by = y + Math.sin(a) * r;
        return (
          <g key={i} transform={`translate(${bx} ${by}) rotate(${(a * 180) / Math.PI + 90})`} opacity={g}>
            <line x1={0} y1={0} x2={0} y2={-L} stroke={P.shield} strokeWidth={size * 0.28} strokeLinecap="round" />
            <line x1={0} y1={-L} x2={-L * 0.5} y2={-L * 1.55} stroke={P.shield} strokeWidth={size * 0.28} strokeLinecap="round" />
            <line x1={0} y1={-L} x2={L * 0.5} y2={-L * 1.55} stroke={P.shield} strokeWidth={size * 0.28} strokeLinecap="round" />
            <circle cx={0} cy={-L * 1.1} r={size * 0.32 * g} fill="#FFD1A0" />
          </g>
        );
      })}
    </g>
  );
};
