// Molecular scale (protein units: a target protein r≈600 with a binding pocket). The protein is a packed cluster of
// shaded residues with a concave pocket; `digital` blends it from biological colours to the AI rendering. Small
// molecules are ball-and-stick; drug carriers are lipid nanoparticles (bilayer shell, payload inside, targeting
// ligands outside) that drift with the blood — they are not self-propelled.
import React from 'react';
import {P as Pt, rand, mixHex, smooth, clamp01, lerp, noise} from '../../kit/core';
import {P} from '../palette';

export const POCKET: Pt = [250, -230];
export const POCKET_R = 250;
export type Res = {x: number; y: number; z: number; r: number; lining: boolean; k: number};
export const RESIDUES: Res[] = (() => {
  const out: Res[] = [];
  let k = 0;
  for (let n = 0; n < 900 && out.length < 120; n++) {
    const x = (rand(n * 3 + 1) * 2 - 1) * 680, y = (rand(n * 3 + 2) * 2 - 1) * 620;
    const a = Math.atan2(y, x);
    const rb = 560 * (1 + 0.1 * Math.sin(3 * a + 1) + 0.06 * Math.sin(5 * a));
    if (Math.hypot(x, y * 1.08) > rb) continue;
    const dp = Math.hypot(x - POCKET[0], y - POCKET[1]);
    if (dp < POCKET_R) continue;
    const z = rand(n * 3 + 3) * 2 - 1;
    if (out.some((o) => Math.hypot(o.x - x, o.y - y) < 62)) continue;
    out.push({x, y, z, r: 62 + 22 * rand(n * 7), lining: dp < POCKET_R + 85, k: k++});
  }
  return out.sort((a, b) => a.z - b.z);
})();

/** layer: 'all', or 'back' / 'front' to draw a docked molecule between them (front = the near rim of the pocket).
 *  close: the pocket's lining residues draw in around a bound molecule (induced fit). */
/** rotY: turn about the vertical axis (radians; residues get depth from their z), for a view that reveals the fold.
 *  variant: one residue changed by a mutation — it swells (grow) toward the pocket in its own colour; hot flashes it
 *  red on contact. */
export const Protein: React.FC<{t: number; digital?: number; pocketGlow?: number; scanA?: number; op?: number; breathe?: number; layer?: 'all' | 'back' | 'front'; close?: number; rotY?: number; variant?: {k: number; grow: number; col: string; hot?: number}}> = ({t, digital = 0, pocketGlow = 0, scanA, op = 1, breathe = 1, layer = 'all', close = 0, rotY, variant}) => {
  const bioA = '#8E4AA8', bioB = '#C46AA8', bioDeep = '#3E1452';
  const cy = rotY === undefined ? 1 : Math.cos(rotY), sy = rotY === undefined ? 0 : Math.sin(rotY);
  const ZD = 320; // depth extent of the fold (protein units) used when it turns
  const rx = (x: number, z: number) => x * cy + z * ZD * sy;
  const list = rotY === undefined ? RESIDUES : RESIDUES.map((r) => ({...r, x: rx(r.x, r.z), z: Math.max(-1, Math.min(1, r.z * cy - (r.x / ZD) * sy * 0.5))})).sort((a, b) => a.z - b.z);
  const pocketX = rotY === undefined ? POCKET[0] : POCKET[0] * cy;
  return (
    <g opacity={op}>
      {layer !== 'front' && <circle r={760} fill={digital > 0.5 ? 'url(#glowAi)' : 'url(#glowMag)'} opacity={0.12} />}
      {list.filter((r) => layer === 'all' || (layer === 'front') === (r.lining && r.z > 0.15)).map((r) => {
        const w = 1 + 0.015 * breathe * Math.sin(t * 2 + r.k);
                const dx0 = pocketX - r.x, dy0 = POCKET[1] - r.y, dl = Math.hypot(dx0, dy0) || 1;
        const vg = variant && variant.k === r.k ? variant.grow : 0;
        const push = r.lining ? close * 26 : 0;
        const x = r.x + 6 * noise(t * 0.5 + r.k, 3) * breathe + (dx0 / dl) * (push + 70 * vg), y = r.y + 6 * noise(t * 0.5 + r.k, 7) * breathe + (dy0 / dl) * (push + 70 * vg);
        const depth = (r.z + 1) / 2;
        const base = r.lining ? mixHex(mixHex(bioB, P.immuneGold, 0.55), P.aiGold, digital) : mixHex(mixHex(bioA, bioB, rand(r.k * 5)), P.aiDeep, digital);
        const col0 = mixHex(base, '#120818', 0.45 * (1 - depth));
        const col = vg > 0 && variant ? mixHex(mixHex(col0, variant.col, vg), '#FF3A4A', variant.hot ?? 0) : col0;
        const rr = r.r * (1 + 0.75 * vg);
        const hit = scanA !== undefined ? Math.exp(-(((Math.atan2(y, x) - scanA + Math.PI * 3) % (Math.PI * 2) - Math.PI) ** 2) / 0.05) : 0;
        return (
          <g key={r.k} transform={`translate(${x} ${y}) scale(${w})`}>
            <circle r={rr + 4} fill={mixHex(bioDeep, P.aiBg, digital)} />
            <circle r={rr} fill={col} />
            <circle r={rr} fill="url(#vol)" opacity={1 - 0.4 * digital} />
            {digital > 0.01 && <circle r={rr * 0.9} fill="none" stroke={r.lining ? P.aiGold : P.ai} strokeWidth={4} opacity={digital * (0.5 + 0.5 * depth)} />}
            {hit > 0.05 && <circle r={r.r} fill={P.aiHot} opacity={hit * 0.5} />}
            {r.lining && pocketGlow > 0.01 && <circle r={r.r * 0.6} fill="url(#glowGold)" opacity={pocketGlow} />}
          </g>
        );
      })}
      {pocketGlow > 0.01 && layer !== 'front' && <circle cx={pocketX} cy={POCKET[1]} r={POCKET_R * 1.3} fill="url(#glowGold)" opacity={pocketGlow * 0.6} />}
    </g>
  );
};

/** Ball-and-stick small molecule. atoms: [x, y, element 0=C 1=N 2=O 3=S]; bonds by index pairs. built = atoms shown. */
export type Mol = {atoms: [number, number, number][]; bonds: [number, number][]};
const EL = ['#3A4656', '#4F7BFF', '#FF5A5A', '#FFD34F'];
export const Molecule: React.FC<{mol: Mol; x: number; y: number; rot?: number; s?: number; built?: number; digital?: number; glow?: number; bad?: number; op?: number}> = ({mol, x, y, rot = 0, s = 1, built = 1, digital = 0, glow = 0, bad = 0, op = 1}) => {
  const n = mol.atoms.length;
  const shown = built * n;
  return (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      {glow > 0.01 && <circle r={260} fill="url(#glowGold)" opacity={glow * 0.7} />}
      {mol.bonds.map(([a, b], k) => {
        const v = Math.min(clamp01(shown - a), clamp01(shown - b));
        if (v <= 0) return null;
        const A = mol.atoms[a], B = mol.atoms[b];
        return <line key={k} x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], v)} y2={lerp(A[1], B[1], v)} stroke={mixHex('#E6ECF4', P.ai, digital)} strokeWidth={16} strokeLinecap="round" />;
      })}
      {mol.atoms.map(([ax, ay, e], k) => {
        const v = smooth(clamp01(shown - k));
        if (v <= 0) return null;
        const c = mixHex(mixHex(EL[e], P.aiHot, digital * 0.6), '#FF3A3A', bad * 0.5);
        return (
          <g key={k} transform={`translate(${ax} ${ay}) scale(${v})`}>
            <circle r={e === 0 ? 40 : 46} fill={c} />
            <circle r={e === 0 ? 40 : 46} fill="url(#vol)" />
            {digital > 0.01 && <circle r={e === 0 ? 44 : 50} fill="none" stroke={P.ai} strokeWidth={4} opacity={digital} />}
          </g>
        );
      })}
    </g>
  );
};
/** the candidate that fits the pocket, and two that do not */
export const MOL_FIT: Mol = {
  atoms: [[0, 0, 0], [90, -40, 0], [170, 10, 1], [150, 100, 0], [60, 120, 0], [-10, 80, 2], [260, -30, 0], [320, 40, 3], [-90, -40, 0], [-170, 0, 1]],
  bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [2, 6], [6, 7], [0, 8], [8, 9]],
};
export const MOL_BAD1: Mol = {atoms: [[0, 0, 0], [100, 0, 0], [200, 0, 2], [100, 100, 0], [100, -100, 1], [300, 0, 0], [380, 60, 0]], bonds: [[0, 1], [1, 2], [1, 3], [1, 4], [2, 5], [5, 6]]};
export const MOL_BAD2: Mol = {atoms: [[0, 0, 1], [80, 60, 0], [160, 0, 0], [240, 60, 0], [320, 0, 3], [160, -100, 2], [-60, 90, 0]], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [0, 6]]};

/** Lipid nanoparticle drug carrier (r≈60 in vessel units, smaller than a red cell): bilayer shell, payload inside,
 *  targeting ligands outside. bound = docked on a receptor (ligands flatten toward it). open = releasing payload. */
export const Carrier: React.FC<{x: number; y: number; r?: number; t: number; seed?: number; bound?: number; open?: number; op?: number; lod?: number; dir?: number}> = ({x, y, r = 60, t, seed = 1, bound = 0, open = 0, op = 1, lod = 1, dir = 0}) => {
  const n = 22;
  const rot = t * 20 * (rand(seed) - 0.5) * (1 - bound);
  return (
    <g opacity={op} transform={`translate(${x} ${y}) rotate(${rot})`}>
      {lod > 0.25 && Array.from({length: 7}, (_, k) => {
        const a = (k / 7) * Math.PI * 2 + seed;
        const L = r * 0.55;
        return (
          <g key={'l' + k} transform={`rotate(${(a * 180) / Math.PI}) translate(${r * 1.04} 0)`}>
            <line x1={0} y1={0} x2={L} y2={0} stroke={P.ligand} strokeWidth={r * 0.08} strokeLinecap="round" />
            <line x1={L} y1={0} x2={L * 1.35} y2={-L * 0.3} stroke={P.ligand} strokeWidth={r * 0.08} strokeLinecap="round" />
            <line x1={L} y1={0} x2={L * 1.35} y2={L * 0.3} stroke={P.ligand} strokeWidth={r * 0.08} strokeLinecap="round" />
          </g>
        );
      })}
      <circle r={r} fill={P.carrierShell} opacity={0.95 - 0.5 * open} />
      <circle r={r * 0.82} fill="#EAF3FF" opacity={0.9 - 0.6 * open} />
      {lod > 0.25 && Array.from({length: n}, (_, k) => {
        const a = (k / n) * Math.PI * 2;
        return <circle key={k} cx={Math.cos(a) * r * 0.92} cy={Math.sin(a) * r * 0.92} r={r * 0.09} fill={P.carrier} stroke="#7FA8E0" strokeWidth={1.5} opacity={1 - open} />;
      })}
      {Array.from({length: 5}, (_, k) => {
        const a = (k / 5) * Math.PI * 2 + t * 0.6;
        const d = r * 0.4 + open * r * 1.6 * (0.7 + 0.3 * rand(k + seed));
        return <circle key={'p' + k} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r * 0.15} fill={P.payload} opacity={1 - open * 0.3} />;
      })}
      <circle r={r} fill="url(#vol)" opacity={0.8 * (1 - open)} />
    </g>
  );
};
export const _pr = {dirIgnored: 0};
