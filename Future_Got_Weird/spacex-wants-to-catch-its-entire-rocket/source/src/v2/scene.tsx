// V2 scene helpers: frame, skies per light, drifting clouds, sea, Earth limb, credits and the few on-screen words.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Defs} from '../assets/defs';
import {rnd, noise, clamp} from '../kit/anim';
import {C, FONT} from '../kit/ui';
import {Light} from './site';

export const Frame: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#0d1218'}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <Defs />
      {children}
    </svg>
  </AbsoluteFill>
);

const SKIES: Record<string, [string, string, string]> = {
  day: ['#4b8ccc', '#86bce6', '#d6ebf6'],
  dusk: ['#2a3560', '#b56a73', '#ffb27a'],
  night: ['#060a15', '#0f1830', '#1f2a46'],
  studio: ['#9fb8cc', '#c6d7e3', '#e9eff3'],
  high: ['#050816', '#14265a', '#4f86c8'],
  space: ['#020309', '#05070f', '#0a0f1e'],
  gulf: ['#5b97cf', '#9cc8ea', '#e2f0f7'],
};
export type SkyName = keyof typeof SKIES;

export const Sky: React.FC<{k: SkyName; horizon?: number; sun?: [number, number]}> = ({k, horizon = 0.7, sun}) => {
  const s = SKIES[k];
  const id = `v2sky_${k}_${Math.round(horizon * 100)}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={s[0]} />
          <stop offset={horizon * 0.75} stopColor={s[1]} />
          <stop offset={horizon} stopColor={s[2]} />
          <stop offset="1" stopColor={s[2]} />
        </linearGradient>
        <radialGradient id={`${id}_sun`}>
          <stop offset="0" stopColor="#fff4d8" stopOpacity="0.95" />
          <stop offset="0.2" stopColor="#ffd08a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff9a5a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={-20} y={-20} width={1960} height={1120} fill={`url(#${id})`} />
      {sun ? <circle cx={sun[0]} cy={sun[1]} r={260} fill={`url(#${id}_sun)`} /> : null}
    </g>
  );
};

export const skyOf = (l: Light): SkyName => (l === 'day' ? 'day' : l === 'dusk' ? 'dusk' : l === 'night' ? 'night' : 'studio');

/** Soft flat cloud bank (screen units), drifting by dx. */
export const Clouds: React.FC<{n?: number; seed?: number; y0?: number; y1?: number; dx?: number; dy?: number; s?: number; tint?: string; o?: number}> = ({n = 8, seed = 1, y0 = 120, y1 = 600, dx = 0, dy = 0, s = 1, tint = '#f4f6f8', o = 0.9}) => (
  <g opacity={o}>
    {Array.from({length: n}, (_, i) => {
      const x = ((((rnd(i, seed) * 2600 + dx * (0.6 + rnd(i, seed + 5) * 0.8)) % 2600) + 2600) % 2600) - 340;
      const y = y0 + rnd(i, seed + 1) * (y1 - y0) + dy * (0.6 + rnd(i, seed + 6) * 0.8);
      const k = s * (0.5 + rnd(i, seed + 2) * 1.0);
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${k})`}>
          <path d="M-150 18 C -150 -6, -110 -20, -84 -12 C -70 -42, -20 -50, 4 -28 C 26 -54, 92 -46, 100 -14 C 136 -16, 160 4, 150 18 Z" fill={tint} />
          <path d="M-150 18 L150 18 C 120 26, -110 26, -150 18 Z" fill="rgba(80,100,130,0.18)" />
        </g>
      );
    })}
  </g>
);

/** Large Earth limb: a circle much bigger than the frame, its top edge at screen y = top. */
export const Limb: React.FC<{top: number; r?: number; cx?: number; night?: number; glow?: number}> = ({top, r = 5200, cx = 960, night = 0, glow = 1}) => {
  const cy = top + r;
  return (
    <g>
      <defs>
        <radialGradient id="v2atmo" cx={cx} cy={cy} r={r * 1.03} gradientUnits="userSpaceOnUse">
          <stop offset={0.955} stopColor="#8fd0ff" stopOpacity="0" />
          <stop offset={0.972} stopColor="#9fd8ff" stopOpacity={0.75 * glow} />
          <stop offset={1} stopColor="#3a70c0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="v2earth" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#3f86c9" />
          <stop offset="0.02" stopColor="#2a64a6" />
          <stop offset="0.12" stopColor="#173f72" />
          <stop offset="1" stopColor="#0b2245" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.03} fill="url(#v2atmo)" />
      <g>
        <clipPath id="v2earthclip"><circle cx={cx} cy={cy} r={r} /></clipPath>
        <rect x={-100} y={top - 5} width={2120} height={1200} fill="url(#v2earth)" clipPath="url(#v2earthclip)" />
        <g clipPath="url(#v2earthclip)" opacity={0.55}>
          {Array.from({length: 26}, (_, i) => (
            <ellipse key={i} cx={rnd(i, 31) * 2200 - 140} cy={top + 20 + Math.pow(rnd(i, 32), 1.6) * 700} rx={60 + rnd(i, 33) * 160} ry={6 + rnd(i, 34) * 14} fill="#e9f2fa" opacity={0.5 + rnd(i, 35) * 0.4} />
          ))}
        </g>
        {night > 0 ? <rect x={-100} y={top - 5} width={2120} height={1200} fill="#030714" opacity={night} clipPath="url(#v2earthclip)" /> : null}
      </g>
    </g>
  );
};

/** Calm sea surface with drifting glints. */
export const SeaPlane: React.FC<{y: number; t: number; tint?: [string, string]}> = ({y, t, tint = ['#3f7fae', '#1f4a72']}) => (
  <g>
    <defs>
      <linearGradient id={`v2sea_${tint[0].slice(1)}`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={tint[0]} />
        <stop offset="1" stopColor={tint[1]} />
      </linearGradient>
    </defs>
    <rect x={-50} y={y} width={2020} height={1200} fill={`url(#v2sea_${tint[0].slice(1)})`} />
    {Array.from({length: 40}, (_, i) => {
      const yy = y + 8 + Math.pow(rnd(i, 7), 1.7) * 600;
      const sc = 0.3 + (yy - y) / 600;
      const x = ((rnd(i, 8) * 2100 + t * 14 * sc) % 2100) - 90;
      return <line key={i} x1={x} x2={x + 30 * sc + rnd(i, 9) * 40 * sc} y1={yy} y2={yy} stroke="rgba(255,255,255,0.22)" strokeWidth={1.5 + sc * 2} strokeLinecap="round" />;
    })}
  </g>
);

/** Brief source credit for real footage: small, quiet, bottom-left. */
export const Credit: React.FC<{text: string; o?: number}> = ({text, o = 1}) =>
  o <= 0.01 ? null : (
    <g opacity={o}>
      <text x={56} y={1030} fontFamily={FONT.ui} fontWeight={700} fontSize={24} fill="#fbf4e4" letterSpacing={1.2} style={{paintOrder: 'stroke'}} stroke="rgba(0,0,0,0.55)" strokeWidth={5}>
        {text}
      </text>
    </g>
  );

/** One strong on-screen word (DRIFT / TILT / TOO FAST …). */
export const Word: React.FC<{text: string; x: number; y: number; o?: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'}> = ({text, x, y, o = 1, size = 96, color = C.yellow, anchor = 'middle'}) =>
  o <= 0.01 ? null : (
    <g opacity={clamp(o)} transform={`translate(${x} ${y}) scale(${0.92 + 0.08 * clamp(o)})`}>
      <text textAnchor={anchor} fontFamily={FONT.title} fontWeight={700} fontSize={size} fill={color} stroke={C.ink} strokeWidth={size * 0.09} style={{paintOrder: 'stroke'}} letterSpacing={size * 0.03}>
        {text}
      </text>
    </g>
  );

/** Small on-object label with a short leader (screen px). */
export const Tag: React.FC<{text: string; x: number; y: number; to?: [number, number]; o?: number; size?: number; align?: 'l' | 'r'}> = ({text, x, y, to, o = 1, size = 30, align = 'l'}) => {
  if (o <= 0.01) return null;
  const w = text.length * size * 0.62 + size * 0.9;
  const X = align === 'r' ? x - w : x;
  return (
    <g opacity={clamp(o)}>
      {to ? <line x1={align === 'r' ? x : x} y1={y} x2={to[0]} y2={to[1]} stroke={C.cream} strokeWidth={3} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.6))'}} /> : null}
      {to ? <circle cx={to[0]} cy={to[1]} r={6} fill={C.yellow} stroke={C.ink} strokeWidth={2.5} /> : null}
      <rect x={X} y={y - size * 0.82} width={w} height={size * 1.5} rx={size * 0.3} fill="rgba(20,25,31,0.82)" />
      <text x={X + size * 0.45} y={y + size * 0.26} fontFamily={FONT.title} fontWeight={600} fontSize={size} fill={C.cream} letterSpacing={size * 0.04}>
        {text}
      </text>
    </g>
  );
};

/** Light camera shake for engine moments (px), deterministic. */
export const shake = (t: number, k: number) => [noise(t * 13, 1) * k, noise(t * 11, 2) * k] as const;
