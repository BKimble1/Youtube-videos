// Immune cells at tissue scale (tissue units: T cell r≈52) and the antigen-recognition parts at surface scale.
// Colour family: teal / immune blue / restrained gold. Dendritic cells are star-shaped and light blue; macrophages
// are large and ruffled; killer T cells are teal with microvilli; activation shows as a gold rim.
import React from 'react';
import {P as Pt, closedPath, rand, noise, mixHex, smooth, clamp01, lerp} from '../../kit/core';
import {P} from '../palette';

export const Dendritic: React.FC<{x: number; y: number; r?: number; t: number; seed?: number; present?: number; op?: number}> = ({x, y, r = 120, t, seed = 2, present = 0, op = 1}) => {
  const arms = 7;
  const pts: Pt[] = [];
  for (let k = 0; k < arms * 4; k++) {
    const a = (k / (arms * 4)) * Math.PI * 2 + seed;
    const ph = (k % 4) / 4;
    const arm = ph === 0 ? 1.9 + 0.4 * noise(t * 0.6 + k, seed) : ph === 0.5 ? 0.62 : 0.85;
    pts.push([Math.cos(a) * r * arm, Math.sin(a) * r * arm]);
  }
  const d = closedPath(pts, 1);
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      {present > 0.01 && <circle r={r * 2.4} fill="url(#glowGold)" opacity={present * 0.35} />}
      <path d={d} fill="#2E6E9A" />
      <path d={d} fill={P.dendritic} transform="scale(0.94)" />
      <path d={d} fill="url(#vol)" transform="scale(0.94)" />
      <ellipse cx={-r * 0.1} cy={r * 0.05} rx={r * 0.42} ry={r * 0.34} fill="#24587E" />
      <ellipse cx={-r * 0.1} cy={r * 0.05} rx={r * 0.42} ry={r * 0.34} fill="url(#nucVol)" />
      {/* fingerprints displayed on the arms */}
      {present > 0.01 && Array.from({length: arms}, (_, k) => {
        const a = (k / arms) * Math.PI * 2 + seed;
        const rr = r * 1.55;
        return <path key={k} d={fingerPath(0)} transform={`translate(${Math.cos(a) * rr} ${Math.sin(a) * rr}) rotate(${(a * 180) / Math.PI + 90}) scale(${0.35 * smooth(present * 1.5 - k * 0.07)})`} fill={P.neoantigen} />;
      })}
    </g>
  );
};

export const Macrophage: React.FC<{x: number; y: number; r?: number; t: number; seed?: number; op?: number}> = ({x, y, r = 110, t, seed = 5, op = 1}) => {
  const pts: Pt[] = Array.from({length: 22}, (_, k) => {
    const a = (k / 22) * Math.PI * 2;
    const f = 1 + 0.16 * noise(k * 0.9 + t * 0.8, seed) + 0.08 * Math.sin(k * 3 + t * 2);
    return [Math.cos(a) * r * f, Math.sin(a) * r * f * 0.86];
  });
  const d = closedPath(pts, 1);
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      <path d={d} fill="#2A4E8E" />
      <path d={d} fill={P.immuneBlue} transform="scale(0.93)" opacity={0.85} />
      <path d={d} fill="url(#vol)" transform="scale(0.93)" />
      {Array.from({length: 6}, (_, k) => <circle key={k} cx={(rand(seed + k) - 0.5) * r} cy={(rand(seed * 3 + k) - 0.5) * r * 0.8} r={r * 0.1} fill="#9CC0FF" opacity={0.7} />)}
      <path d="M -30 -10 Q 0 -40 30 -10 Q 10 20 -30 -10" transform={`scale(${r / 70})`} fill="#1C3A6E" />
    </g>
  );
};

/** Neoantigen "fingerprint": a peptide with a distinctive notched profile (kind selects the notch pattern). */
export const fingerPath = (kind: number) => {
  const notches = [[0.2, 0.55, 0.8], [0.3, 0.5], [0.15, 0.45, 0.7, 0.9]][kind % 3];
  let d = 'M -60 0 L -60 -50';
  const w = 120;
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const x = -60 + u * w;
    const n = notches.some((c) => Math.abs(u - c) < 0.06) ? -20 : 0;
    d += ` L ${x.toFixed(1)} ${(-50 - n - 10 * Math.sin(u * Math.PI)).toFixed(1)}`;
  }
  return d + ' L 60 0 Z';
};

/** MHC molecule on a membrane holding a peptide; normal peptides are pink beads, neoantigens are yellow fingerprints. */
export const MHC: React.FC<{x: number; y: number; t: number; neo?: boolean; kind?: number; show?: number; flag?: number; scan?: number; s?: number}> = ({x, y, t, neo = false, kind = 0, show = 1, flag = 0, scan = 0, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* two-chain MHC stalk */}
    <rect x={-46} y={-170} width={38} height={170} rx={18} fill="#5E8EC8" />
    <rect x={8} y={-150} width={38} height={150} rx={18} fill="#7AA8DE" />
    <rect x={-46} y={-170} width={92} height={170} rx={18} fill="url(#vol)" opacity={0.7} />
    {/* peptide groove + peptide */}
    <g transform={`translate(0 ${-170 - 6}) scale(${show})`}>
      {neo ? (
        <path d={fingerPath(kind)} fill={P.neoantigen} stroke="#B89A20" strokeWidth={4} />
      ) : (
        Array.from({length: 5}, (_, k) => <circle key={k} cx={-48 + k * 24} cy={-22} r={14} fill="#F0A0B8" stroke="#B86A84" strokeWidth={3} />)
      )}
    </g>
    {scan > 0.01 && <rect x={-80} y={-260} width={160} height={270} rx={16} fill="none" stroke={P.ai} strokeWidth={6} opacity={scan} />}
    {flag > 0.01 && (
      <g opacity={flag}>
        <circle cx={0} cy={-200} r={150} fill="url(#glowGold)" />
        <rect x={-84} y={-264} width={168} height={278} rx={18} fill="none" stroke={P.aiGold} strokeWidth={8} />
      </g>
    )}
  </g>
);

/** T-cell receptor: a Y-shaped receptor whose tip reshapes from blunt to the complement of a fingerprint. */
export const TCR: React.FC<{x: number; y: number; t: number; learn: number; kind?: number; s?: number; gold?: number; rot?: number}> = ({x, y, t, learn, kind = 0, s = 1, gold = 0, rot = 0}) => {
  const col = mixHex(P.tcell, P.immuneGold, gold);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-22} y={0} width={44} height={170} rx={20} fill={mixHex(P.tcellDeep, '#806010', gold * 0.5)} />
      <rect x={-62} y={-60} width={124} height={80} rx={26} fill={col} />
      <rect x={-62} y={-60} width={124} height={80} rx={26} fill="url(#vol)" />
      {/* tip: a blunt cap morphs into the inverse of the fingerprint */}
      <g transform="translate(0 -58) scale(1 -1)">
        <path d={fingerPath(kind)} fill={col} opacity={learn} transform="scale(1 0.7)" />
      </g>
      {gold > 0.01 && <circle cx={0} cy={-40} r={150} fill="url(#glowGold)" opacity={gold * 0.6} />}
    </g>
  );
};

/** Lytic granules (perforin / granzyme) crossing an immune synapse from a to b, released at t0. */
export const Granules: React.FC<{a: Pt; b: Pt; t: number; t0: number; n?: number; r?: number}> = ({a, b, t, t0, n = 9, r = 7}) => {
  const u0 = (t - t0) / 0.7;
  if (u0 < 0 || u0 > 1.6) return null;
  return (
    <g>
      {Array.from({length: n}, (_, k) => {
        const u = clamp01(u0 - k * 0.06);
        if (u <= 0 || u >= 1) return null;
        const off = (k - (n - 1) / 2) * r * 1.6;
        const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny) || 1;
        const x = lerp(a[0], b[0], u) + (nx / nl) * off * (1 - u * 0.5), y = lerp(a[1], b[1], u) + (ny / nl) * off * (1 - u * 0.5);
        return (
          <g key={k}>
            <circle cx={x} cy={y} r={r * 2.5} fill="url(#glowGold)" opacity={0.7} />
            <circle cx={x} cy={y} r={r} fill={P.immuneGold} />
          </g>
        );
      })}
    </g>
  );
};

/** Immune synapse: a gold adhesion ring flattening at the contact between two cells. */
export const Synapse: React.FC<{a: Pt; b: Pt; k: number; rA: number}> = ({a, b, k, rA}) => {
  if (k <= 0.01) return null;
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const cx = a[0] + Math.cos(ang) * rA * 0.98, cy = a[1] + Math.sin(ang) * rA * 0.98;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${(ang * 180) / Math.PI})`} opacity={k}>
      <ellipse rx={rA * 0.14} ry={rA * 0.62 * k} fill="none" stroke={P.immuneGold} strokeWidth={rA * 0.08} />
      <ellipse rx={rA * 0.3} ry={rA * 0.9 * k} fill="url(#glowGold)" opacity={0.6} />
    </g>
  );
};
