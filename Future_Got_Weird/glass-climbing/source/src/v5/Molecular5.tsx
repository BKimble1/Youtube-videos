// Glass Climbing V5: the molecular contact (v2/Molecular.tsx), drawn to be read close up: lit atoms, beaded chains, a
// soft cue between close pairs.
// Glass Climbing V2, shot D: the contact seen at the scale of molecules (a schematic, in nanometres). On the left, the
// glass surface: a slightly irregular packing of atoms. On the right, the flattened wedge's surface: silicone chains,
// strings of beads. As the last of the gap closes (a few nm down to a few tenths of a nm), faint short ticks appear
// between the nearest facing atoms: van der Waals attraction is only felt at this range, and it is weak per pair
// (restrained marks, no glow or energy), but there are an enormous number of pairs.
import React from 'react';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';

const R = 0.17; // atom radius (nm), as drawn
const rnd = (i: number, s: number) => ((((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) + 1) % 1);

/** glass atoms (x <= 0) and polymer beads (x >= gap), y from y0 to y1 (nm) */
const glassAtoms = (y0: number, y1: number) => {
  const out: {x: number; y: number}[] = [];
  let i = 0;
  for (let col = 0; col < 64; col++)
    for (let y = y0 + (col % 2) * 0.19; y < y1; y += 0.38) {
      i++;
      out.push({x: -R - col * 0.33 - rnd(i, 1) * 0.06, y: y + (rnd(i, 2) - 0.5) * 0.08});
    }
  return out;
};
const chains = (y0: number, y1: number, gap: number) => {
  const out: {x: number; y: number; c: number}[] = [];
  for (let c = 0; c < 60; c++) {
    const x0 = gap + R + c * 0.36;
    for (let y = y0, i = 0; y < y1; y += 0.3, i++) out.push({x: x0 + 0.07 * Math.sin(y * 2.1 + c * 1.7) + (c === 0 ? 0 : 0.03 * Math.sin(y * 5 + c)), y, c});
  }
  return out;
};

export const MolecularContent5: React.FC<{gap: number; cue: number; z: number; y0?: number; y1?: number}> = ({gap, cue, z, y0 = -40, y1 = 40}) => {
  const ink = 1.4 / Math.max(1e-6, z);
  const g = glassAtoms(y0, y1);
  const p = chains(y0, y1, gap);
  const surfaceG = g.filter((a) => a.x > -R - 0.1);
  const surfaceP = p.filter((a) => a.c === 0);
  const ticks: React.ReactNode[] = [];
  if (cue > 0.01)
    surfaceP.forEach((b, i) => {
      // pair each surface bead with the nearest glass surface atom; only close pairs feel it
      let best = surfaceG[0], d = 1e9;
      for (const a of surfaceG) {
        const dd = Math.hypot(a.x - b.x, a.y - b.y);
        if (dd < d) {
          d = dd;
          best = a;
        }
      }
      const reach = clamp01((0.95 - (d - 2 * R)) / 0.5);
      const o = cue * reach * (0.55 + 0.45 * rnd(i, 7));
      if (o < 0.02) return;
      const ax = best.x + R * 0.9, bx = b.x - R * 0.9;
      ticks.push(
        <g key={i}>
          <path d={`M${fmt(ax)},${fmt(best.y)} L${fmt(bx)},${fmt(b.y)}`} stroke="#9FF0FF" strokeWidth={fmt(0.12)} opacity={o * 0.25} strokeLinecap="round" />
          <path d={`M${fmt(ax)},${fmt(best.y)} L${fmt(bx)},${fmt(b.y)}`} stroke="#E6FDFF" strokeWidth={fmt(0.04)} strokeDasharray={`${fmt(0.05)} ${fmt(0.04)}`} opacity={o} strokeLinecap="round" />
        </g>,
      );
    });
  return (
    <g>
      <rect x={-40} y={y0 - 20} width={80} height={y1 - y0 + 40} fill="#0D161D" />
      {/* the bulk behind each surface, soft */}
      <rect x={-40} y={y0 - 20} width={40 - R} height={y1 - y0 + 40} fill="#17434D" opacity={0.8} />
      <rect x={gap + 0.05} y={y0 - 20} width={40} height={y1 - y0 + 40} fill="#4A4A44" opacity={0.6} />
      {g.map((a, i) => (
        <g key={`g${i}`}>
          <circle cx={fmt(a.x)} cy={fmt(a.y)} r={R} fill={i % 3 ? '#4FA8AE' : '#6CC2C4'} stroke={INK} strokeWidth={fmt(ink)} />
          <circle cx={fmt(a.x - R * 0.32)} cy={fmt(a.y - R * 0.32)} r={R * 0.34} fill="#DDFBFA" opacity={0.7} />
        </g>
      ))}
      {/* the chains' backbones, then their beads */}
      {Array.from({length: 60}).map((_, c) => (
        <path key={`b${c}`} d={`M${p.filter((b) => b.c === c).map((b) => `${fmt(b.x)},${fmt(b.y)}`).join(' L')}`} stroke="#8D8576" strokeWidth={fmt(0.08)} fill="none" />
      ))}
      {p.map((b, i) => (
        <g key={`p${i}`}>
          <circle cx={fmt(b.x)} cy={fmt(b.y)} r={R * 0.92} fill={b.c % 2 ? '#F2EEE6' : '#E2DCCF'} stroke={INK} strokeWidth={fmt(ink)} />
          <circle cx={fmt(b.x - R * 0.3)} cy={fmt(b.y - R * 0.3)} r={R * 0.3} fill="#FFFFFF" opacity={0.75} />
        </g>
      ))}
      {ticks}
    </g>
  );
};
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
