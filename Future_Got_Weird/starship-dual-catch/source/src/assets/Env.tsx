import React, {useId} from 'react';
import {C} from '../theme';
import {hash} from '../kit/ease';

// Backgrounds drawn in screen space (1920x1080). `py` shifts the horizon for camera tilt/parallax.
export type SkyKind = 'dusk' | 'day' | 'night' | 'dawn' | 'high';
const SKIES: Record<SkyKind, string[]> = {
  dusk: ['#0b1230', '#2b2f5c', '#7a4a6a', '#e0815a', '#f7c27a'],
  dawn: ['#14234a', '#3a5a8c', '#8aa6c8', '#f2c9a0', '#ffe6c2'],
  day: ['#1d5fa8', '#3f86c8', '#7fb6e0', '#bfe0f2', '#e6f3fa'],
  night: ['#03050c', '#070d1f', '#0d1a35', '#1b2c4d', '#2c3d5e'],
  high: ['#02040a', '#060c1e', '#112a55', '#3b6fae', '#8fbfe6'],
};

export const Sky: React.FC<{kind: SkyKind; py?: number; stars?: number; sun?: {x: number; y: number}}> = ({kind, py = 0, stars = 0, sun}) => {
  const id = useId().replace(/:/g, '');
  const c = SKIES[kind];
  return (
    <g>
      <defs>
        <linearGradient id={`sk${id}`} x1="0" y1="0" x2="0" y2="1">
          {c.map((col, i) => (
            <stop key={i} offset={i / (c.length - 1)} stopColor={col} />
          ))}
        </linearGradient>
        <radialGradient id={`sun${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff4d6" stopOpacity={0.95} />
          <stop offset="0.15" stopColor="#ffd28a" stopOpacity={0.6} />
          <stop offset="1" stopColor="#ff9a5a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-200} y={-6000} width={2320} height={5400 + py + 2} fill={c[0]} />
      <rect x={-200} y={-600 + py} width={2320} height={2400} fill={`url(#sk${id})`} />
      <rect x={-200} y={1798 + py} width={2320} height={6000} fill={c[c.length - 1]} />
      {stars > 0 &&
        Array.from({length: 160}, (_, i) => (
          <circle key={i} cx={hash(i) * 1920} cy={(hash(i + 500) * 1500 - 300 + py * 0.3) % 1080} r={0.6 + hash(i + 900) * 1.4} fill="#fff" opacity={stars * (0.3 + 0.7 * hash(i + 77))} />
        ))}
      {sun && <circle cx={sun.x} cy={sun.y + py} r={420} fill={`url(#sun${id})`} />}
    </g>
  );
};

// Flat Gulf-coast horizon: sea strip, dunes and a low shoreline. Drawn in world units around x in [x0,x1].
export const Coast: React.FC<{x0?: number; x1?: number; dusk?: boolean}> = ({x0 = -4000, x1 = 6000, dusk = true}) => (
  <g>
    <rect x={x0} y={-6} width={x1 - x0} height={12} fill={dusk ? '#3b4d6e' : '#5d8fb8'} />
    <rect x={x0} y={0} width={x1 - x0} height={3000} fill={dusk ? '#1a1f2b' : '#c9b48c'} />
    <rect x={x0} y={0} width={x1 - x0} height={40} fill={dusk ? '#262c3a' : '#b49d74'} />
  </g>
);

// Background launch-site skyline (generic: high bays, tank farm, a second tower). Illustrative, not a site map.
export const SiteSkyline: React.FC<{tone?: string}> = ({tone = '#141a26'}) => (
  <g fill={tone} opacity={0.7}>
    <rect x={-1500} y={-380} width={260} height={380} />
    <rect x={-1500} y={-392} width={260} height={12} opacity={0.6} />
    <rect x={-1220} y={-300} width={180} height={300} />
    <rect x={-980} y={-210} width={140} height={210} />
    {[0, 1, 2, 3].map((i) => (
      <g key={i}>
        <rect x={800 + i * 58} y={-120} width={40} height={120} />
        <ellipse cx={820 + i * 58} cy={-120} rx={20} ry={8} />
      </g>
    ))}
    <g opacity={0.75}>
      <rect x={1320} y={-1300} width={70} height={1300} />
      <rect x={1390} y={-600} width={170} height={30} />
    </g>
  </g>
);

export const Clouds: React.FC<{y: number; dx: number; tone?: string; op?: number; seed?: number}> = ({y, dx, tone = '#f3d6c2', op = 0.5, seed = 0}) => (
  <g opacity={op}>
    {Array.from({length: 7}, (_, i) => {
      const x = ((hash(i + seed) * 3000 + dx) % 3000 + 3000) % 3000 - 500;
      const w = 220 + hash(i + seed + 40) * 380;
      return <ellipse key={i} cx={x} cy={y + hash(i + seed + 9) * 80} rx={w} ry={w * 0.09} fill={tone} />;
    })}
  </g>
);

// Earth seen from orbit: a large disc with an atmosphere rim. cx, cy, r in screen px.
export const Earth: React.FC<{cx: number; cy: number; r: number; rot?: number}> = ({cx, cy, r, rot = 0}) => {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <radialGradient id={`ea${id}`} cx="0.42" cy="0.38" r="0.65">
          <stop offset="0" stopColor="#3d7cc0" />
          <stop offset="0.7" stopColor="#1d4b86" />
          <stop offset="1" stopColor="#0b2347" />
        </radialGradient>
        <radialGradient id={`at${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.93" stopColor="#7fc4ff" stopOpacity={0} />
          <stop offset="0.965" stopColor="#7fc4ff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#7fc4ff" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`ec${id}`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r * 1.04} fill={`url(#at${id})`} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#ea${id})`} />
      <g clipPath={`url(#ec${id})`} transform={`rotate(${rot} ${cx} ${cy})`}>
        {Array.from({length: 9}, (_, i) => (
          <ellipse key={i} cx={cx + (hash(i + 3) - 0.5) * r * 1.6} cy={cy + (hash(i + 11) - 0.5) * r * 1.6} rx={r * (0.12 + hash(i + 5) * 0.2)} ry={r * (0.06 + hash(i + 8) * 0.12)} fill="#4f8a4a" opacity={0.75} />
        ))}
        {Array.from({length: 14}, (_, i) => (
          <ellipse key={i} cx={cx + (hash(i + 30) - 0.5) * r * 1.8} cy={cy + (hash(i + 41) - 0.5) * r * 1.8} rx={r * (0.05 + hash(i + 52) * 0.1)} ry={r * (0.02 + hash(i + 53) * 0.03)} fill="#fff" opacity={0.45} />
        ))}
        <circle cx={cx + r * 0.55} cy={cy + r * 0.2} r={r * 1.1} fill="#000" opacity={0.35} />
      </g>
    </g>
  );
};
