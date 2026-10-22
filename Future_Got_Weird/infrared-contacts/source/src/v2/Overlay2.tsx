// V2 screen-space layers: the wearer's subjective view (POV) and the visible/infrared spectrum strip.
// The POV is what the wearer perceives behind closed lids: a warm near-black field (a little ambient light filters
// through the lids), faint drifting phosphenes, and diffuse flashes (bloom, expanding rings, a soft horizontal
// streak). It opens out of the closed eyelid line as an aperture, so it always reads as "behind these eyes".
import React from 'react';
import {clamp, lerp, rnd, Pt} from '../lib';
import {LIGHT} from '../theme';
import {FONT} from '../Overlay';

export type Ap = {cx: number; cy: number; w: number; h: number; r: number};
export const apLerp = (a: Ap, b: Ap, k: number): Ap => ({cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k), r: lerp(a.r, b.r, k)});
// the wearer's view grows as a pill (almond-like) from the closed lid line until it covers the frame
export const FULL: Ap = {cx: 540, cy: 960, w: 1500, h: 2400, r: 750}; // the smallest pill that covers the frame
export const pill = (a: Ap): Ap => ({...a, r: Math.min(a.w, a.h) / 2});
const apD = (a: Ap) => {
  const x0 = a.cx - a.w / 2, y0 = a.cy - a.h / 2, x1 = a.cx + a.w / 2, y1 = a.cy + a.h / 2;
  const r = Math.min(a.r, a.w / 2, a.h / 2);
  return `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
};
export type Flash = {at: number; len: number; gain: number};
// envelope: quick but soft attack, hold for `len`, smooth release
export const flashEnv = (t: number, f: Flash) => {
  if (t < f.at || t > f.at + f.len + 0.5) return 0;
  const a = Math.sin((Math.PI / 2) * clamp((t - f.at) / 0.07));
  const r = t > f.at + f.len ? (1 - clamp((t - f.at - f.len) / 0.5)) ** 2 : 1;
  return a * r * f.gain;
};

export const POV: React.FC<{ap: Ap; t: number; flashes: Flash[]; id: string; seam?: boolean; focus?: Pt}> = ({ap, t, flashes, id, seam, focus}) => {
  if (ap.w < 2 || ap.h < 1) return null;
  const fc = focus ?? {x: ap.cx, y: ap.cy};
  const R = Math.min(Math.max(ap.w, ap.h), 1500) * 0.42;
  const lit = flashes.map((f) => ({f, e: flashEnv(t, f), u: clamp((t - f.at) / 0.9)}));
  const amt = lit.reduce((m, x) => Math.max(m, x.e), 0);
  const edge = Math.min(ap.w, ap.h);
  const fadeIn = clamp((ap.h - 3) / 40); // grows out of the lid line
  return (
    <g opacity={fadeIn}>
      <defs>
        <clipPath id={`${id}-ap`}>
          <path d={apD(ap)} />
        </clipPath>
        <radialGradient id={`${id}-dk`} cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor="#2B1416" />
          <stop offset="0.6" stopColor="#140809" />
          <stop offset="1" stopColor="#060203" />
        </radialGradient>
        <radialGradient id={`${id}-bl`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F2FFF6" stopOpacity={1} />
          <stop offset="0.18" stopColor={LIGHT.greenGlow} stopOpacity={0.95} />
          <stop offset="0.5" stopColor={LIGHT.green} stopOpacity={0.55} />
          <stop offset="0.8" stopColor="#2FD6C8" stopOpacity={0.18} />
          <stop offset="1" stopColor="#2FD6C8" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}-lidglow`} cx="0.5" cy="0" r="0.8">
          <stop offset="0" stopColor="#7A2A22" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7A2A22" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-streak`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7DF5E8" stopOpacity={0} />
          <stop offset="0.5" stopColor="#E9FFF4" stopOpacity={0.9} />
          <stop offset="1" stopColor="#7DF5E8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-ap)`}>
        <rect x={ap.cx - ap.w / 2 - 2} y={ap.cy - ap.h / 2 - 2} width={ap.w + 4} height={ap.h + 4} fill={`url(#${id}-dk)`} />
        <ellipse cx={ap.cx} cy={ap.cy - ap.h / 2} rx={ap.w * 0.7} ry={ap.h * 0.45} fill={`url(#${id}-lidglow)`} />
        {/* phosphenes: faint, slow, deterministic */}
        {Array.from({length: 16}, (_, i) => {
          const x = ap.cx + (rnd(i * 3.1) - 0.5) * ap.w * 0.9 + 18 * Math.sin(t * 0.5 + i);
          const y = ap.cy + (rnd(i * 7.7) - 0.5) * ap.h * 0.9 + 14 * Math.cos(t * 0.4 + i * 2);
          return <circle key={i} cx={x} cy={y} r={2 + 3 * rnd(i * 1.3)} fill="#B06A55" opacity={0.08 + 0.06 * Math.sin(t * 1.3 + i)} />;
        })}
        {amt > 0.002 && <rect x={ap.cx - ap.w / 2} y={ap.cy - ap.h / 2} width={ap.w} height={ap.h} fill="#1E5A3C" opacity={0.35 * amt} />}
        {lit.map(({f, e, u}, i) => (e > 0.002 ? (
          <g key={i}>
            <circle cx={fc.x} cy={fc.y} r={R * (0.42 + 0.5 * e) * (1 + 0.15 * f.len)} fill={`url(#${id}-bl)`} opacity={e} />
            {[0, 1].map((j) => {
              const uu = clamp(u * 1.4 - j * 0.22);
              return uu > 0 && uu < 1 ? <circle key={j} cx={fc.x} cy={fc.y} r={R * (0.25 + 1.1 * uu)} fill="none" stroke={j ? '#7DF5E8' : LIGHT.green} strokeWidth={(5 - 2 * j) * (1 - uu) + 1} opacity={(1 - uu) * 0.7 * f.gain} /> : null;
            })}
            <ellipse cx={fc.x} cy={fc.y} rx={R * 1.5 * e} ry={Math.max(2, R * 0.025)} fill={`url(#${id}-streak)`} opacity={0.6 * e} />
          </g>
        ) : null))}
      </g>
      {/* aperture edge: soft dark lid edge while it is small; a clean seam when it is a panel */}
      <path d={apD(ap)} fill="none" stroke="#000" strokeWidth={Math.min(60, edge * 0.25)} opacity={0.35} clipPath={`url(#${id}-ap)`} />
      {seam && <path d={apD(ap)} fill="none" stroke="#FAF3DF" strokeWidth={5} />}
    </g>
  );
};

// visible / infrared spectrum strip (top of frame): where each wave sits
export const Spectrum: React.FC<{a: number; hiVis: number; hiIR: number; y?: number}> = ({a, hiVis, hiIR, y = 300}) => {
  if (a <= 0.001) return null;
  const x0 = 120, x1 = 960, xs = 690, h = 30;
  const dy = (1 - a) * -40;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, opacity: a, transform: `translateY(${dy}px)`}}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="spec-vis" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7B4BD6" />
            <stop offset="0.18" stopColor="#3D6FE0" />
            <stop offset="0.36" stopColor="#25B8D6" />
            <stop offset="0.52" stopColor="#4CCB5A" />
            <stop offset="0.7" stopColor="#F2D541" />
            <stop offset="0.85" stopColor="#F28C2E" />
            <stop offset="1" stopColor="#D8392E" />
          </linearGradient>
          <pattern id="spec-ir" width="28" height={h} patternUnits="userSpaceOnUse">
            <rect width="28" height={h} fill="#2A1A10" />
            <rect x="4" y={h / 2 - 3} width="14" height="6" rx="3" fill={LIGHT.ir} />
          </pattern>
        </defs>
        <rect x={x0 - 14} y={y - 16} width={x1 - x0 + 28} height={h + 32} rx={(h + 32) / 2} fill="rgba(8,14,20,0.62)" />
        <rect x={x0} y={y} width={xs - x0} height={h} rx={h / 2} fill="url(#spec-vis)" opacity={0.55 + 0.45 * hiVis} />
        <rect x={xs + 6} y={y} width={x1 - xs - 6} height={h} rx={h / 2} fill="url(#spec-ir)" opacity={0.55 + 0.45 * hiIR} />
        {hiVis > 0.01 && <rect x={x0 - 5} y={y - 5} width={xs - x0 + 10} height={h + 10} rx={(h + 10) / 2} fill="none" stroke="#FFFFFF" strokeWidth={4} opacity={hiVis} />}
        {hiIR > 0.01 && <rect x={xs + 1} y={y - 5} width={x1 - xs + 4} height={h + 10} rx={(h + 10) / 2} fill="none" stroke={LIGHT.ir} strokeWidth={4} opacity={hiIR} />}
      </svg>
      <div style={{position: 'absolute', left: x0, width: xs - x0, top: y + h + 22, textAlign: 'center', fontFamily: FONT.label, fontWeight: 600, fontSize: 38, letterSpacing: '0.08em', color: '#F2F6F8', opacity: 0.6 + 0.4 * hiVis, textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>VISIBLE</div>
      <div style={{position: 'absolute', left: xs, width: x1 - xs, top: y + h + 22, textAlign: 'center', fontFamily: FONT.label, fontWeight: 600, fontSize: 38, letterSpacing: '0.08em', color: LIGHT.ir, opacity: 0.6 + 0.4 * hiIR, textShadow: '0 2px 8px rgba(0,0,0,0.6)'}}>INFRARED</div>
    </div>
  );
};
