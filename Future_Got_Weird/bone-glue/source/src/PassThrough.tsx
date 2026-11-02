// The loop's pass through the wrist: as the camera pushes into the healed wrist at the end, the skin comes up to the
// lens and then parts from the centre, then the yellow fat, then the red muscle, revealing frame 0's view down into
// the incision. Screen space, very near the lens (soft). Every layer is textured, never a blank frame; the timeline
// reset happens while the skin covers the frame, and the last ring leaves the corners exactly at the wrap.
import React from 'react';
import {clamp, hash, ss} from './lib';
import {mix} from './core/color';
import {C} from './art/palette';

const DIAG = 1102; // centre-to-corner of the 1080 x 1920 frame
/** the radius of a layer's opening at pass p (opens at p0, leaves the frame by about p1) */
const hole = (p: number, p0: number, p1 = 0.985) => {
  if (p <= p0) return 0;
  const u = clamp((p - p0) / (p1 - p0));
  return DIAG * 1.05 * (Math.exp(3.2 * u) - 1) / (Math.exp(3.2) - 1);
};
/** an irregular, soft-edged annulus: everything outside radius r (screen px) about the centre */
const ringPath = (cx: number, cy: number, r: number, seed: number, wob = 0.06) => {
  const n = 40;
  let d = `M-200 -200H1280V2120H-200Z`;
  if (r < 1) return d;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + wob * (Math.sin(a * 3 + seed) * 0.6 + Math.sin(a * 5 + seed * 2.1) * 0.4)) * (1 + 0.55 * Math.abs(Math.sin(a)) * 0.0);
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a) * 1.18).toFixed(1)}`);
  }
  d += `M${pts[0]}L${pts.slice(1).join('L')}Z`;
  return d;
};

export const PassThrough: React.FC<{p: number; fkey: string}> = ({p, fkey}) => {
  if (p <= 0.001 || p >= 0.999) return null;
  const cover = ss(p, 0.16, 0.36);
  const cx = 540, cy = 960;
  const rSkin = hole(p, 0.5), rFat = hole(p, 0.57), rMus = hole(p, 0.64);
  const layers = [
    {r: rMus, base: C.muscle, lit: C.muscleLit, edge: C.cavity, seed: 2.7, tex: 'fibre' as const},
    {r: rFat, base: C.fat, lit: '#F8E2A0', edge: C.fatDeep, seed: 1.3, tex: 'lobule' as const},
    {r: rSkin, base: C.skin, lit: C.skinLight, edge: C.skinDeep, seed: 0.4, tex: 'pore' as const},
  ];
  const blur = 6 + 10 * ss(p, 0.3, 0.6);
  return (
    <div style={{position: 'absolute', inset: 0, opacity: cover, filter: `blur(${blur.toFixed(1)}px)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          {layers.map((L, i) => (
            <radialGradient key={i} id={`${fkey}pt${i}`} cx="50%" cy="50%" r="70%">
              <stop offset={0} stopColor={L.lit} />
              <stop offset={0.7} stopColor={L.base} />
              <stop offset={1} stopColor={mix(L.base, L.edge, 0.5)} />
            </radialGradient>
          ))}
        </defs>
        {layers.map((L, i) => {
          const d = ringPath(cx, cy, L.r, L.seed);
          const tex: React.ReactNode[] = [];
          for (let k = 0; k < 36; k++) {
            const a = hash(k * 3.1 + i * 7.7) * Math.PI * 2;
            const rr = L.r + 40 + hash(k * 5.3 + i) * 700;
            const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a) * 1.18;
            if (L.tex === 'lobule') tex.push(<circle key={k} cx={x} cy={y} r={28 + 30 * hash(k * 1.7)} fill="#FBEAB0" opacity={0.45} stroke={C.fatDeep} strokeWidth={3} />);
            else if (L.tex === 'fibre') tex.push(<path key={k} d={`M${x - 90} ${y}Q${x} ${y - 14} ${x + 90} ${y}`} stroke={C.muscleFibre} strokeWidth={8} fill="none" opacity={0.5} />);
            else tex.push(<circle key={k} cx={x} cy={y} r={4 + 4 * hash(k)} fill={C.skinDeep} opacity={0.35} />);
          }
          return (
            <g key={i}>
              <path d={d} fill={`url(#${fkey}pt${i})`} fillRule="evenodd" />
              <g clipPath={undefined}>{L.r < DIAG * 1.2 && <path d={ringPath(cx, cy, L.r, L.seed)} fill="none" stroke={L.edge} strokeWidth={14} opacity={L.r > 1 ? 0.8 : 0} />}</g>
              <g opacity={0.9}>{tex.filter(() => L.r < DIAG * 1.3)}</g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
