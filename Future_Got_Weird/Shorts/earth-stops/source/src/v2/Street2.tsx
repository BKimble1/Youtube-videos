import React from 'react';
import {C, H, OUTLINE, W} from '../theme';
import {GSY, GYW, LAMPS, PALMS} from './choreo2';

/**
 * Recomposed street: tall facades (little sky), a shallow sidewalk, a thin road, and only two kinds of anchored things (lamp posts, palms)
 * so the contrast reads: anchored = never moves except by the camera; loose = hero, bicycle, coffee. No coral anywhere on the street.
 * Everything is drawn in world px under one camera transform (screen = (540 + (x - camX) z, GSY + (y - GYW) z)).
 */
const mixHex = (a: string, b: string, t: number) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const BASE = 1150, CURB_TOP = 1350, CURB_BOT = 1400;
const INK = C.ink, sw = OUTLINE;
export type Style = {fill: string; trim: string; awn: [string, string]; door: string};
export const STYLES: Style[] = [
  {fill: C.cream, trim: C.teal, awn: [C.teal, C.cream], door: C.blue},
  {fill: C.saffronLight, trim: C.tealDeep, awn: [C.blue, C.cream], door: C.teal},
  {fill: C.saffronLight, trim: C.blue, awn: [C.tealDeep, C.cream], door: C.saffron},
  {fill: C.cream, trim: C.tealDeep, awn: [C.saffronDeep, C.cream], door: C.blueDeep},
];
const WIDTHS = [560, 520, 600, 540, 580, 520, 600, 560, 540, 600, 560, 520];
const HEIGHTS = [1020, 940, 1090, 980, 1040, 960, 1100, 1000, 1060, 960, 1040, 980]; // tall facades: the pull-back (zoom 0.86) would otherwise open a band of empty sky above the street

export const Building: React.FC<{x: number; w: number; h: number; s: Style}> = ({x, w, h, s}) => {
  const top = BASE - h;
  const cols = Math.max(2, Math.floor((w - 60) / 150));
  const gap = (w - cols * 84) / (cols + 1);
  const rows = Math.max(1, Math.floor((h - 262 - 40) / 176));
  const awnY = BASE - 262;
  const stripes = Math.round(w / 40);
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill={s.fill} stroke={INK} strokeWidth={sw} />
      <rect x={x - 8} y={top - 22} width={w + 16} height={26} rx={6} fill={s.trim} stroke={INK} strokeWidth={sw} />
      {Array.from({length: rows}).map((_, r) =>
        Array.from({length: cols}).map((__, i) => {
          const wx = x + gap + i * (84 + gap);
          const wy = top + 56 + r * 176;
          return (
            <g key={`${r}-${i}`}>
              <path d={`M ${wx} ${wy + 130} L ${wx} ${wy + 42} A 42 42 0 0 1 ${wx + 84} ${wy + 42} L ${wx + 84} ${wy + 130} Z`} fill={C.tealLight} stroke={INK} strokeWidth={sw} />
              <line x1={wx + 42} y1={wy} x2={wx + 42} y2={wy + 130} stroke={INK} strokeWidth={3} />
              <line x1={wx} y1={wy + 72} x2={wx + 84} y2={wy + 72} stroke={INK} strokeWidth={3} />
              <rect x={wx - 8} y={wy + 130} width={100} height={12} rx={4} fill={s.trim} stroke={INK} strokeWidth={3} />
            </g>
          );
        }),
      )}
      <rect x={x + 30} y={awnY + 56} width={w * 0.5} height={BASE - awnY - 56} fill={C.cream} stroke={INK} strokeWidth={sw} />
      <rect x={x + 44} y={awnY + 72} width={w * 0.5 - 28} height={BASE - awnY - 112} fill={C.tealLight} stroke={INK} strokeWidth={3} />
      <rect x={x + w * 0.5 + 70} y={awnY + 56} width={92} height={BASE - awnY - 56} rx={6} fill={s.door} stroke={INK} strokeWidth={sw} />
      <circle cx={x + w * 0.5 + 146} cy={awnY + 150} r={6} fill={INK} />
      {Array.from({length: stripes}).map((_, i) => (
        <rect key={i} x={x + 10 + (i * (w - 20)) / stripes} y={awnY} width={(w - 20) / stripes + 0.5} height={56} fill={i % 2 ? s.awn[1] : s.awn[0]} />
      ))}
      <rect x={x + 10} y={awnY} width={w - 20} height={56} fill="none" stroke={INK} strokeWidth={sw} />
      {Array.from({length: stripes}).map((_, i) => (
        <path key={i} d={`M ${x + 10 + (i * (w - 20)) / stripes} ${awnY + 56} a ${(w - 20) / stripes / 2} 14 0 0 0 ${(w - 20) / stripes} 0`} fill={i % 2 ? s.awn[1] : s.awn[0]} stroke={INK} strokeWidth={3} />
      ))}
    </g>
  );
};

const Palm: React.FC<{x: number; h?: number}> = ({x, h = 600}) => {
  const baseY = BASE + 70, topY = baseY - h, lean = 40;
  const fronds: [number, number, string][] = [[-160, -40, C.teal], [-120, -96, C.tealLight], [-44, -134, C.teal], [44, -134, C.tealLight], [120, -96, C.teal], [160, -40, C.tealLight], [-80, 8, C.tealLight], [80, 8, C.teal]];
  return (
    <g>
      <path d={`M ${x - 16} ${baseY} Q ${x - 19} ${baseY - h * 0.55} ${x + lean - 14} ${topY} L ${x + lean + 14} ${topY} Q ${x + 19} ${baseY - h * 0.55} ${x + 16} ${baseY} Z`} fill={C.woodLight} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {[0.2, 0.36, 0.52, 0.68, 0.84].map((t) => (
        <line key={t} x1={x - 16 + lean * t * 0.9} y1={baseY - h * t} x2={x + 16 + lean * t * 0.9} y2={baseY - h * t - 4} stroke={C.woodDeep} strokeWidth={4} />
      ))}
      {fronds.map(([dx, dy, col], i) => (
        <path key={i} d={`M ${x + lean} ${topY} Q ${x + lean + dx * 0.5} ${topY + dy - 40} ${x + lean + dx} ${topY + dy + 38} Q ${x + lean + dx * 0.55} ${topY + dy + 6} ${x + lean} ${topY + 10} Z`} fill={col} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      ))}
      <circle cx={x + lean} cy={topY + 8} r={14} fill={C.woodDeep} stroke={INK} strokeWidth={3} />
    </g>
  );
};

const Lamp: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 9} y={640} width={18} height={1235 - 640} fill={INK} />
    <rect x={x - 20} y={1215} width={40} height={24} rx={5} fill={INK} />
    <path d={`M ${x} 650 q 0 -70 78 -70`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
    <path d={`M ${x + 44} 580 h 78 l -12 38 h -56 z`} fill={C.saffron} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
  </g>
);

/** pad: how far (scene px) the sky, ground and pan-blur region extend past the 1080x1920 frame; E-C draws this scene scaled into a panel and needs the margin. */
export const Street2: React.FC<{camX: number; z: number; blur?: number; pad?: number; children?: React.ReactNode; palms?: boolean; lamps?: boolean; sky?: boolean; skyTint?: number}> = ({camX, z, blur = 0, pad = 80, children, palms = true, lamps = true, sky = true, skyTint = 0}) => {
  const bs: {x: number; w: number; h: number; s: Style; i: number}[] = [];
  let bx = -900;
  for (let i = 0; i < WIDTHS.length; i++) { bs.push({x: bx, w: WIDTHS[i], h: HEIGHTS[i], s: STYLES[i % STYLES.length], i}); bx += WIDTHS[i] + 14; }
  const joints = Array.from({length: 22}).map((_, i) => -800 + i * 230);
  const curbJ = Array.from({length: 16}).map((_, i) => -700 + i * 320);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id="skyG2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTint > 0 ? mixHex(C.saffron, '#C4553A', skyTint) : C.saffron} />
          <stop offset="1" stopColor={skyTint > 0 ? mixHex(C.saffronLight, C.saffronDeep, skyTint * 0.8) : C.saffronLight} />
        </linearGradient>
        <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ink} stopOpacity={0} />
          <stop offset="1" stopColor={C.ink} stopOpacity={0.42} />
        </linearGradient>
        <filter id="panBlur2" filterUnits="userSpaceOnUse" x={-pad} y={-pad} width={W + 2 * pad} height={H + 2 * pad}>
          <feGaussianBlur stdDeviation={`${Math.max(0.01, blur)} 0`} />
        </filter>
      </defs>
      <rect x={-pad} y={-pad} width={W + 2 * pad} height={H + 2 * pad} fill="url(#skyG2)" />
      {sky && <circle cx={860} cy={300} r={120} fill={C.saffron} opacity={0.55} />}
      {sky && <circle cx={860} cy={300} r={80} fill={C.saffronLight} />}
      <g filter={blur > 0.4 ? 'url(#panBlur2)' : undefined}>
        <g transform={`translate(540 ${GSY}) scale(${z}) translate(${-camX} ${-GYW})`}>
          {bs.map((b) => <Building key={b.i} x={b.x} w={b.w} h={b.h} s={b.s} />)}
          <rect x={-1200} y={BASE} width={5200} height={CURB_TOP - BASE} fill={C.paperDeep} />
          <line x1={-1200} y1={BASE} x2={4000} y2={BASE} stroke={INK} strokeWidth={sw} />
          {joints.map((x) => <line key={x} x1={x} y1={BASE + 6} x2={x - 18} y2={CURB_TOP - 2} stroke={C.paperLine} strokeWidth={5} />)}
          <rect x={-1200} y={CURB_TOP} width={5200} height={CURB_BOT - CURB_TOP} fill={C.coral} stroke={INK} strokeWidth={sw} />
          <rect x={-1200} y={CURB_TOP} width={5200} height={10} fill={C.coralLight} />
          {curbJ.map((x) => <line key={x} x1={x} y1={CURB_TOP} x2={x} y2={CURB_BOT} stroke={INK} strokeWidth={4} />)}
          <rect x={-1200} y={CURB_BOT} width={5200} height={1600} fill={C.tealLight} />
          {palms && PALMS.map((x) => <Palm key={`p${x}`} x={x} />)}
          {lamps && LAMPS.map((x) => <Lamp key={`l${x}`} x={x} />)}
          {children}
        </g>
      </g>
      {/* bottom scrim: the lower band sits under the Shorts caption/UI zone anyway; this makes it read as intentional and helps caption legibility */}
      <rect x={-pad} y={1480} width={W + 2 * pad} height={H - 1480 + (pad - 80)} fill="url(#scrim)" />
    </svg>
  );
};
