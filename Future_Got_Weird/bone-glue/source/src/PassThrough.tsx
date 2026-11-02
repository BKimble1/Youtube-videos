// The loop's pass through the wrist: as the camera pushes into the healed wrist at the end, the skin (its creases and
// the faint scar) rushes up to the lens, parts from the centre, then the yellow fat lobules stream past, then the red
// muscle fibres, revealing frame 0's view down into the incision. Screen space, very near the lens. Every layer is
// strongly textured and streaming outward, so no frame is blank; the timeline reset happens while the skin covers the
// frame, and the last ring leaves the corners exactly at the wrap.
import React from 'react';
import {clamp, hash, ss} from './lib';
import {mix} from './core/color';
import {C} from './art/palette';

const DIAG = 1102; // centre-to-corner of the 1080 x 1920 frame
const CX = 540, CY = 960;
/** the radius of a layer's opening at pass p (opens at p0, leaves the frame by p1) */
const hole = (p: number, p0: number, p1: number) => {
  if (p <= p0) return 0;
  const u = clamp((p - p0) / (p1 - p0));
  // the layer parts quickly to a wide opening (never a small dark hole), then sweeps past the corners
  return 220 * ss(u, 0, 0.12) + (DIAG * 1.12 - 220) * (Math.exp(2.6 * u) - 1) / (Math.exp(2.6) - 1);
};
/** an irregular annulus: everything outside radius r (screen px) */
const ringPath = (r: number, seed: number) => {
  let d = 'M-300 -300H1380V2220H-300Z';
  if (r < 1) return d;
  const n = 44;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + 0.07 * Math.sin(a * 3 + seed) + 0.04 * Math.sin(a * 7 + seed * 2.3));
    pts.push(`${(CX + rr * Math.cos(a)).toFixed(1)} ${(CY + rr * Math.sin(a) * 1.25).toFixed(1)}`);
  }
  return d + `M${pts[0]}L${pts.slice(1).join('L')}Z`;
};
/** texture positions stream outward as the camera moves through the layer: radius grows with the pass */
const stream = (k: number, seed: number, p: number, speed: number) => {
  const a = hash(k * 3.1 + seed) * Math.PI * 2;
  const r0 = 60 + hash(k * 5.3 + seed) * 900;
  const r = r0 * Math.exp(speed * p);
  return {x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) * 1.25, a, s: Math.exp(speed * p * 0.8)};
};

export const PassThrough: React.FC<{p: number; fkey: string}> = ({p, fkey}) => {
  if (p <= 0.001 || p >= 0.999) return null;
  const cover = ss(p, 0.3, 0.45);
  const rSkin = hole(p, 0.5, 0.9), rFat = hole(p, 0.525, 0.95), rMus = hole(p, 0.55, 0.995);
  // muscle (deepest), fat, skin (nearest): each fills everything outside its opening
  const tex = (layer: 'muscle' | 'fat' | 'skin', r: number) => {
    const out: React.ReactNode[] = [];
    if (layer === 'skin') {
      // skin creases (long soft arcs) and pores, streaming outward
      for (let k = 0; k < 14; k++) {
        const q = stream(k, 1.1, p, 2.4);
        if (Math.hypot(q.x - CX, (q.y - CY) / 1.25) < r) continue;
        const L = 140 * q.s;
        out.push(<path key={`c${k}`} d={`M${q.x - L} ${q.y}Q${q.x} ${q.y + 0.18 * L} ${q.x + L} ${q.y}`} stroke={C.skinDeep} strokeWidth={9 * q.s} fill="none" opacity={0.55} strokeLinecap="round" />);
      }
      for (let k = 0; k < 40; k++) {
        const q = stream(k, 7.7, p, 2.4);
        if (Math.hypot(q.x - CX, (q.y - CY) / 1.25) < r) continue;
        out.push(<circle key={`p${k}`} cx={q.x} cy={q.y} r={6 * q.s} fill={C.skinDeep} opacity={0.4} />);
      }
      // the faint scar line across the centre, rushing up as the skin approaches
      if (r < 5) out.push(<path key="scar" d={`M${CX} ${CY - 520 * (0.6 + p)}L${CX} ${CY + 520 * (0.6 + p)}`} stroke="#E3A99A" strokeWidth={26 * (0.6 + p)} strokeLinecap="round" opacity={0.7} />);
    } else if (layer === 'fat') {
      for (let k = 0; k < 34; k++) {
        const q = stream(k, 3.3, p, 3.0);
        if (Math.hypot(q.x - CX, (q.y - CY) / 1.25) < r + 20) continue;
        const rr = (34 + 26 * hash(k * 1.9)) * q.s;
        out.push(<circle key={k} cx={q.x} cy={q.y} r={rr} fill="#FBE7A6" stroke={C.fatDeep} strokeWidth={5 * q.s} opacity={0.95} />);
      }
    } else {
      for (let k = 0; k < 26; k++) {
        const q = stream(k, 5.9, p, 3.4);
        if (Math.hypot(q.x - CX, (q.y - CY) / 1.25) < r + 20) continue;
        const L = 110 * q.s;
        const dx = Math.cos(q.a), dy = Math.sin(q.a) * 1.25;
        out.push(<path key={k} d={`M${q.x - dx * L} ${q.y - dy * L}L${q.x + dx * L} ${q.y + dy * L}`} stroke={C.muscleFibre} strokeWidth={12 * q.s} strokeLinecap="round" opacity={0.75} />);
      }
    }
    return out;
  };
  const layers = [
    {name: 'muscle' as const, r: rMus, base: mix(C.muscle, C.cavity, 0.35), lit: mix(C.muscleLit, C.muscle, 0.4), edge: C.cavity, seed: 2.7},
    {name: 'fat' as const, r: rFat, base: C.fat, lit: '#F8E2A0', edge: C.fatDeep, seed: 1.3},
    {name: 'skin' as const, r: rSkin, base: C.skin, lit: C.skinLight, edge: C.skinDeep, seed: 0.4},
  ];
  return (
    <div style={{position: 'absolute', inset: 0, opacity: cover, filter: `blur(${(2.5 + 3 * ss(p, 0.2, 0.5)).toFixed(1)}px)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          {layers.map((L, i) => (
            <radialGradient key={i} id={`${fkey}pt${i}`} gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={1300}>
              <stop offset={0} stopColor={L.lit} />
              <stop offset={0.55} stopColor={L.base} />
              <stop offset={1} stopColor={mix(L.base, L.edge, 0.45)} />
            </radialGradient>
          ))}
          {layers.map((L, i) => (
            <clipPath key={`c${i}`} id={`${fkey}ptc${i}`}><path d={ringPath(L.r, L.seed)} clipRule="evenodd" /></clipPath>
          ))}
        </defs>
        {layers.map((L, i) =>
          L.r > DIAG * 1.08 ? null : (
            <g key={i}>
              <path d={ringPath(L.r, L.seed)} fill={`url(#${fkey}pt${i})`} fillRule="evenodd" />
              <g clipPath={`url(#${fkey}ptc${i})`}>{tex(L.name, L.r)}</g>
              {L.r > 1 && <path d={ringPath(L.r, L.seed).split('Z').slice(1).join('Z')} fill="none" stroke={L.lit} strokeWidth={22} opacity={0.55} />}
            </g>
          ),
        )}
      </svg>
    </div>
  );
};
