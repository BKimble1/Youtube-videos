import React from 'react';
import {C, H, OUTLINE, W} from '../theme';
import {GY} from './choreo';

/**
 * The equatorial coastal street, drawn in side view. Everything at depth 1 shares the hero's ground plane, so it is the FIXED
 * reference: windows, awnings, lamp posts, palms, paving joints, curb segments and lane dashes never move except by the camera.
 * Far layers (sun, sea, skyline) move at a fraction of the camera.
 */
const BASE = 1170; // facade base / back of the sidewalk
const CURB_TOP = 1384; // deeper sidewalk: the mug skims pavement through the landing instead of dipping over the kerb
const CURB_BOT = 1440;
const ROAD_TOP = CURB_BOT;
const INK = C.ink;
const sw = OUTLINE;

type Style = {fill: string; trim: string; awn: [string, string]; door: string};
const STYLES: Style[] = [
  {fill: C.cream, trim: C.teal, awn: [C.teal, C.cream], door: C.blue},
  {fill: C.saffronLight, trim: C.tealDeep, awn: [C.blue, C.cream], door: C.teal},
  {fill: C.saffronLight, trim: C.blue, awn: [C.tealDeep, C.cream], door: C.saffron},
  {fill: C.cream, trim: C.tealDeep, awn: [C.saffronDeep, C.cream], door: C.blueDeep},
]; // no coral on the street: coral belongs to the scarf and the mug, so both read against the facades
const WIDTHS = [560, 520, 600, 540, 580, 520, 600, 560, 540, 600];
const HEIGHTS = [500, 580, 520, 560, 500, 600, 540, 520, 580, 500];

const Building: React.FC<{x: number; w: number; h: number; s: Style; seed: number}> = ({x, w, h, s, seed}) => {
  const top = BASE - h;
  const cols = Math.max(2, Math.floor((w - 60) / 150));
  const gap = (w - cols * 84) / (cols + 1);
  const upperRows = h > 540 ? 2 : 1;
  const awnY = BASE - 262;
  const stripes = Math.round(w / 40);
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill={s.fill} stroke={INK} strokeWidth={sw} />
      <rect x={x - 8} y={top - 22} width={w + 16} height={26} rx={6} fill={s.trim} stroke={INK} strokeWidth={sw} />
      <line x1={x} y1={top + 40} x2={x + w} y2={top + 40} stroke={INK} strokeWidth={3} opacity={0.18} />
      {/* upper windows (arched) */}
      {Array.from({length: upperRows}).map((_, r) =>
        Array.from({length: cols}).map((__, i) => {
          const wx = x + gap + i * (84 + gap);
          const wy = top + 78 + r * 188;
          return (
            <g key={`${r}-${i}`}>
              <path d={`M ${wx} ${wy + 140} L ${wx} ${wy + 42} A 42 42 0 0 1 ${wx + 84} ${wy + 42} L ${wx + 84} ${wy + 140} Z`} fill={C.tealLight} stroke={INK} strokeWidth={sw} />
              <line x1={wx + 42} y1={wy} x2={wx + 42} y2={wy + 140} stroke={INK} strokeWidth={3} />
              <line x1={wx} y1={wy + 78} x2={wx + 84} y2={wy + 78} stroke={INK} strokeWidth={3} />
              <rect x={wx - 8} y={wy + 140} width={100} height={12} rx={4} fill={s.trim} stroke={INK} strokeWidth={3} />
            </g>
          );
        }),
      )}
      {/* shopfront: window + door under a striped awning */}
      <rect x={x + 30} y={awnY + 56} width={w * 0.5} height={BASE - awnY - 56} fill={C.cream} stroke={INK} strokeWidth={sw} />
      <rect x={x + 44} y={awnY + 72} width={w * 0.5 - 28} height={BASE - awnY - 112} fill={C.tealLight} stroke={INK} strokeWidth={3} />
      <rect x={x + w * 0.5 + 70} y={awnY + 56} width={92} height={BASE - awnY - 56} rx={6} fill={s.door} stroke={INK} strokeWidth={sw} />
      <circle cx={x + w * 0.5 + 146} cy={awnY + 150} r={6} fill={INK} />
      <g>
        {Array.from({length: stripes}).map((_, i) => (
          <rect key={i} x={x + 10 + (i * (w - 20)) / stripes} y={awnY} width={(w - 20) / stripes + 0.5} height={56} fill={i % 2 ? s.awn[1] : s.awn[0]} />
        ))}
        <rect x={x + 10} y={awnY} width={w - 20} height={56} fill="none" stroke={INK} strokeWidth={sw} />
        {Array.from({length: stripes}).map((_, i) => (
          <path key={i} d={`M ${x + 10 + (i * (w - 20)) / stripes} ${awnY + 56} a ${(w - 20) / stripes / 2} 14 0 0 0 ${(w - 20) / stripes} 0`} fill={i % 2 ? s.awn[1] : s.awn[0]} stroke={INK} strokeWidth={3} />
        ))}
      </g>
      <rect x={x + w - 130} y={top + (seed % 2 ? 150 : 250)} width={90} height={46} rx={8} fill={s.trim} stroke={INK} strokeWidth={3} opacity={h < 530 ? 1 : 0} />
    </g>
  );
};

const Palm: React.FC<{x: number; h?: number}> = ({x, h = 560}) => {
  const baseY = BASE + 36;
  const topY = baseY - h;
  const lean = 36;
  const fronds: [number, number, string][] = [
    [-150, -40, C.teal], [-110, -92, C.tealLight], [-40, -128, C.teal], [40, -128, C.tealLight], [110, -92, C.teal], [150, -40, C.tealLight], [-76, 6, C.tealLight], [76, 6, C.teal],
  ];
  return (
    <g>
      <path d={`M ${x - 15} ${baseY} Q ${x - 18} ${baseY - h * 0.55} ${x + lean - 13} ${topY} L ${x + lean + 13} ${topY} Q ${x + 18} ${baseY - h * 0.55} ${x + 15} ${baseY} Z`} fill={C.woodLight} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {[0.18, 0.34, 0.5, 0.66, 0.82].map((t) => (
        <line key={t} x1={x - 15 + lean * t * 0.9} y1={baseY - h * t} x2={x + 15 + lean * t * 0.9} y2={baseY - h * t - 4} stroke={C.woodDeep} strokeWidth={4} />
      ))}
      {fronds.map(([dx, dy, col], i) => (
        <path key={i} d={`M ${x + lean} ${topY} Q ${x + lean + dx * 0.5} ${topY + dy - 40} ${x + lean + dx} ${topY + dy + 38} Q ${x + lean + dx * 0.55} ${topY + dy + 6} ${x + lean} ${topY + 10} Z`} fill={col} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      ))}
      <circle cx={x + lean} cy={topY + 8} r={13} fill={C.woodDeep} stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Lamp: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 8} y={820} width={16} height={BASE + 150 - 820} fill={INK} />
    <rect x={x - 18} y={BASE + 130} width={36} height={22} rx={5} fill={INK} />
    <path d={`M ${x} 820 q 0 -64 70 -64`} fill="none" stroke={INK} strokeWidth={12} strokeLinecap="round" />
    <path d={`M ${x + 40} 760 h 70 l -10 34 h -50 z`} fill={C.saffron} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
  </g>
);

export const Street: React.FC<{camX: number; blur?: number}> = ({camX, blur = 0}) => {
  const far = camX * 0.2;
  const mid = camX * 0.32;
  // buildings laid out from x = -520
  const bs: {x: number; w: number; h: number; s: Style; i: number}[] = [];
  let bx = -520;
  for (let i = 0; i < WIDTHS.length; i++) {
    bs.push({x: bx, w: WIDTHS[i], h: HEIGHTS[i], s: STYLES[i % STYLES.length], i});
    bx += WIDTHS[i] + 14;
  }
  const joints = Array.from({length: 18}).map((_, i) => -400 + i * 230);
  const curbJ = Array.from({length: 14}).map((_, i) => -340 + i * 320);
  const dashes = Array.from({length: 18}).map((_, i) => -420 + i * 290);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.saffron} />
          <stop offset="0.5" stopColor={C.saffronLight} />
          <stop offset="1" stopColor={C.paper} />
        </linearGradient>
        <filter id="panBlur" filterUnits="userSpaceOnUse" x={-80} y={0} width={W + 160} height={H}>
          <feGaussianBlur stdDeviation={`${Math.max(0.01, blur)} 0`} />
        </filter>
        <filter id="panBlurFar" filterUnits="userSpaceOnUse" x={-80} y={0} width={W + 160} height={H}>
          <feGaussianBlur stdDeviation={`${Math.max(0.01, blur * 0.35)} 0`} />
        </filter>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#skyG)" />
      {/* far: sun + sea + distant skyline */}
      <g transform={`translate(${-far * 0.25} 0)`}>
        <circle cx={800} cy={420} r={124} fill={C.saffron} opacity={0.55} />
        <circle cx={800} cy={420} r={84} fill={C.saffronLight} />
      </g>
      <g transform={`translate(${-far} 0)`}>
        <rect x={-300} y={470} width={W + 1800} height={140} fill={C.teal} />
        <rect x={-300} y={470} width={W + 1800} height={12} fill={C.tealDeep} opacity={0.5} />
        {Array.from({length: 22}).map((_, i) => (
          <rect key={i} x={-260 + i * 150 + (i % 3) * 22} y={500 + (i % 4) * 26} width={70 + (i % 3) * 18} height={7} rx={3.5} fill={C.tealLight} opacity={0.75} />
        ))}
      </g>
      <g filter={blur > 0.4 ? 'url(#panBlurFar)' : undefined}><g transform={`translate(${-mid} 0)`}>
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x={-300 + i * 230} y={560 - ((i * 37) % 3) * 30} width={120 + (i % 2) * 40} height={90} fill={i % 2 ? C.blueLight : C.tealLight} stroke={INK} strokeWidth={3} opacity={0.9} />
        ))}
      </g>
      </g>
      {/* world (hero's plane): horizontally pan-blurred in proportion to camera speed, like a tracking shot on a moving subject */}
      <g filter={blur > 0.4 ? 'url(#panBlur)' : undefined}><g transform={`translate(${-camX} 0)`}>
        {bs.map((b) => (
          <Building key={b.i} x={b.x} w={b.w} h={b.h} s={b.s} seed={b.i} />
        ))}
        <Palm x={1180} />
        <Palm x={2400} h={520} />
        {/* sidewalk */}
        <rect x={-600} y={BASE} width={4200} height={CURB_TOP - BASE} fill={C.paperDeep} />
        <line x1={-600} y1={BASE} x2={3600} y2={BASE} stroke={INK} strokeWidth={sw} />
        {joints.map((x) => (
          <line key={x} x1={x} y1={BASE + 6} x2={x - 18} y2={CURB_TOP - 2} stroke={C.paperLine} strokeWidth={5} />
        ))}
        <Lamp x={716} />
        <Lamp x={1836} />
        {/* curb */}
        <rect x={-600} y={CURB_TOP} width={4200} height={CURB_BOT - CURB_TOP} fill={C.coral} stroke={INK} strokeWidth={sw} />
        <rect x={-600} y={CURB_TOP} width={4200} height={12} fill={C.coralLight} />
        <rect x={-600} y={CURB_BOT - 10} width={4200} height={10} fill={C.coralDeep} />
        {curbJ.map((x) => (
          <line key={x} x1={x} y1={CURB_TOP} x2={x} y2={CURB_BOT} stroke={INK} strokeWidth={4} />
        ))}
        {/* road */}
        <rect x={-600} y={ROAD_TOP} width={4200} height={H - ROAD_TOP + 40} fill={C.tealLight} />
        <line x1={-600} y1={ROAD_TOP + 18} x2={3600} y2={ROAD_TOP + 18} stroke={INK} strokeWidth={3} opacity={0.3} />
        {dashes.map((x) => (
          <rect key={x} x={x} y={1650} width={160} height={18} rx={9} fill={C.saffron} stroke={INK} strokeWidth={3} />
        ))}
      </g></g>
    </svg>
  );
};
export const GROUND_Y = GY;
