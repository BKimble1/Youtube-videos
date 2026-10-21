// Environments: skies, sea, clouds, stars, Earth limb, plasma sheath, and the camera/world wrapper.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Defs, NS} from './defs';
import {noise, rnd} from '../kit/anim';

export type Cam = {x: number; y: number; z: number; rot?: number};

/** Full-frame SVG with shared defs. */
export const Frame: React.FC<{children: React.ReactNode; bg?: string}> = ({children, bg = '#0d1218'}) => (
  <AbsoluteFill style={{background: bg}}>
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <Defs />
      {children}
    </svg>
  </AbsoluteFill>
);

/** World group: metres → screen. cam.(x,y) = world point at frame centre, z = px per metre, rot = camera roll (deg). */
export const World: React.FC<{cam: Cam; children: React.ReactNode; par?: number}> = ({cam, children, par = 1}) => {
  const z = cam.z * par;
  return (
    <g transform={`translate(960 540) rotate(${cam.rot ?? 0}) scale(${z}) translate(${-cam.x * (par === 1 ? 1 : 1)} ${-cam.y})`}>{children}</g>
  );
};

/** Parallax layer: moves with the camera at a fraction `k` of its translation and `kz` of its zoom change. */
export const Parallax: React.FC<{cam: Cam; k: number; z0?: number; children: React.ReactNode}> = ({cam, k, z0 = 1, children}) => (
  <g transform={`translate(960 540) rotate(${(cam.rot ?? 0) * k}) scale(${Math.pow(cam.z / z0, k)}) translate(${-cam.x * k * z0} ${-cam.y * k * z0})`}>{children}</g>
);

export type SkyKind = 'day' | 'dusk' | 'night' | 'high' | 'space';
const SKY: Record<SkyKind, [string, string, string]> = {
  day: ['#4f8fd0', '#8ec1ea', '#dbeef8'],
  dusk: ['#24325a', '#c06a6a', '#ffb070'],
  night: ['#070b16', '#121b33', '#26314f'],
  high: ['#06091a', '#1b2d63', '#5d8fd0'],
  space: ['#03050b', '#070b18', '#0d1428'],
};
export const Sky: React.FC<{kind: SkyKind; mix?: number; kind2?: SkyKind; horizon?: number}> = ({kind, mix = 0, kind2, horizon = 1}) => {
  const a = SKY[kind], b = kind2 ? SKY[kind2] : a;
  const m = (c1: string, c2: string) => {
    const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const x = p(c1), y = p(c2);
    return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * mix)).join(',')})`;
  };
  const id = `sky_${kind}_${kind2 ?? ''}_${Math.round(mix * 100)}_${Math.round(horizon * 100)}`;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={m(a[0], b[0])} />
          <stop offset={0.62 * horizon} stopColor={m(a[1], b[1])} />
          <stop offset="1" stopColor={m(a[2], b[2])} />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#${id})`} />
    </g>
  );
};

export const Stars: React.FC<{o?: number; n?: number; seed?: number; dx?: number; dy?: number; t?: number}> = ({o = 1, n = 140, seed = 1, dx = 0, dy = 0, t = 0}) => {
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {Array.from({length: n}, (_, i) => {
        const x = (((rnd(i, seed) * 2200 + dx) % 2200) + 2200) % 2200 - 140;
        const y = (((rnd(i, seed + 1) * 1240 + dy) % 1240) + 1240) % 1240 - 80;
        const r = 0.6 + rnd(i, seed + 2) * 1.8;
        const tw = 0.6 + 0.4 * Math.sin(t * (1 + rnd(i, 9) * 2) + i);
        return <circle key={i} cx={x} cy={y} r={r} fill="#f5f2ea" opacity={(0.35 + rnd(i, seed + 3) * 0.65) * tw} />;
      })}
    </g>
  );
};

/** Stylised outlined cloud (screen or world units; size s). */
export const Cloud: React.FC<{x: number; y: number; s: number; o?: number; tint?: string; shade?: string}> = ({x, y, s, o = 1, tint = '#f4f1ea', shade = '#cfd6de'}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M-60 10 C -66 -6, -48 -18, -34 -12 C -30 -34, 0 -40, 10 -22 C 20 -36, 50 -30, 50 -10 C 66 -10, 72 8, 58 14 Z" fill={tint} stroke="#1c232b" strokeWidth={2.5} {...NS} />
    <path d="M-56 9 C -30 2, 20 4, 56 12 L58 14 L-60 10 Z" fill={shade} />
  </g>
);

/** Sea + horizon line at screen y. */
export const Sea: React.FC<{y: number; kind?: 'day' | 'dusk' | 'night'; t?: number}> = ({y, kind = 'day', t = 0}) => {
  const c = kind === 'day' ? ['#3f7fae', '#2b5f88'] : kind === 'dusk' ? ['#a46a6a', '#3d3f5c'] : ['#141d33', '#0b1222'];
  return (
    <g>
      <rect x={-200} y={y} width={2320} height={1200} fill={c[1]} />
      <rect x={-200} y={y} width={2320} height={14} fill={c[0]} />
      {Array.from({length: 18}, (_, i) => (
        <line key={i} x1={(rnd(i, 4) * 2000 + t * 12) % 2000 - 40} x2={(rnd(i, 4) * 2000 + t * 12) % 2000 + 30 + rnd(i, 5) * 60} y1={y + 24 + rnd(i, 6) * 300} y2={y + 24 + rnd(i, 6) * 300} stroke="rgba(255,255,255,0.16)" strokeWidth={3} strokeLinecap="round" />
      ))}
    </g>
  );
};

/** Earth disc seen from orbit (screen units). */
export const Earth: React.FC<{cx: number; cy: number; r: number; rot?: number; night?: number}> = ({cx, cy, r, rot = 0, night = 0}) => {
  const id = 'earthClip';
  const land = [
    'M-0.55 -0.35 C -0.35 -0.55, -0.05 -0.5, 0.05 -0.3 C 0.12 -0.12, -0.08 0.02, -0.22 0.08 C -0.34 0.14, -0.5 0.02, -0.6 -0.12 Z',
    'M0.2 0.1 C 0.35 0.0, 0.55 0.08, 0.6 0.3 C 0.62 0.48, 0.42 0.58, 0.3 0.5 C 0.18 0.42, 0.12 0.24, 0.2 0.1 Z',
    'M-0.3 0.35 C -0.18 0.3, -0.05 0.42, -0.1 0.58 C -0.16 0.7, -0.32 0.62, -0.36 0.5 Z',
  ];
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
        <radialGradient id="earthSea" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#4f9be0" />
          <stop offset="0.6" stopColor="#2a64a8" />
          <stop offset="1" stopColor="#123a6e" />
        </radialGradient>
        <radialGradient id="atmo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.9" stopColor="#7fc4ff" stopOpacity="0" />
          <stop offset="0.96" stopColor="#7fc4ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7fc4ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.06} fill="url(#atmo)" />
      <circle cx={cx} cy={cy} r={r} fill="url(#earthSea)" stroke="#1c232b" strokeWidth={3} />
      <g clipPath={`url(#${id})`}>
        <g transform={`translate(${cx} ${cy}) rotate(${rot}) scale(${r})`}>
          {land.map((d, i) => (
            <path key={i} d={d} fill="#6fae6a" stroke="#1c232b" strokeWidth={2.2} {...NS} />
          ))}
          {land.map((d, i) => (
            <path key={`b${i}`} d={d} fill="#5d9a5a" transform="translate(0.03 0.03)" opacity={0.0} />
          ))}
        </g>
        {Array.from({length: 7}, (_, i) => (
          <ellipse key={i} cx={cx + (rnd(i, 21) - 0.5) * r * 1.6} cy={cy + (rnd(i, 22) - 0.5) * r * 1.6} rx={r * 0.18} ry={r * 0.05} fill="#fff" opacity={0.5} />
        ))}
        {night > 0 ? <circle cx={cx + r * 0.9} cy={cy + r * 0.4} r={r * 1.2} fill="#050a18" opacity={0.55 * night} /> : null}
      </g>
    </g>
  );
};

/** Bow-shock plasma sheath around a body moving toward -x in the local frame (draw inside the vehicle's frame). */
export const PlasmaSheath: React.FC<{len: number; k: number; t: number}> = ({len, k, t}) => {
  if (k <= 0.01) return null;
  const f = 1 + 0.05 * noise(t * 8, 3);
  return (
    <g opacity={k}>
      <ellipse cx={len * 0.5} cy={9.5} rx={len * 0.75 * f} ry={8 * f} fill="url(#glowPlasma)" />
      <path d={`M${-4} 6 C ${len * 0.2} ${12 * f}, ${len * 0.8} ${12 * f}, ${len + 6} 6 C ${len * 0.8} ${16 * f}, ${len * 0.2} ${16 * f}, ${-4} 6 Z`} fill="#ffe0c0" opacity={0.65} />
      {Array.from({length: 7}, (_, i) => {
        const u = ((t * 1.8 + i / 7) % 1);
        return <line key={i} x1={len * u} x2={len * u + 10} y1={8 + i * 0.9} y2={14 + i * 1.6} stroke="#ffd0a0" strokeWidth={2} opacity={0.5 * (1 - u)} {...NS} />;
      })}
    </g>
  );
};
