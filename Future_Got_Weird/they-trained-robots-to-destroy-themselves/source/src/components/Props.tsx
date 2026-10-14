import React from 'react';
import {C, F} from '../theme';
import {STEEL} from './Foundry';

/** Small original SVG props. Each takes a centre (x, y) in the parent SVG's coordinates and a scale. */
type P = {x: number; y: number; s?: number; opacity?: number; rot?: number};
const T = (x: number, y: number, s = 1, rot = 0) => `translate(${x} ${y}) rotate(${rot}) scale(${s})`;

export const Padlock: React.FC<P & {open?: number}> = ({x, y, s = 1, opacity = 1, open = 0}) => (
  <g transform={T(x, y, s)} opacity={opacity}>
    <path d={`M -34 -10 L -34 -48 Q -34 -84 0 -84 Q 34 -84 34 -48 L 34 ${-10 - 30 * open}`} fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" />
    <path d={`M -34 -10 L -34 -48 Q -34 -84 0 -84 Q 34 -84 34 -48 L 34 ${-10 - 30 * open}`} fill="none" stroke={STEEL.shellLight} strokeWidth={7} strokeLinecap="round" />
    <rect x={-52} y={-16} width={104} height={84} rx={14} fill={C.saffron} stroke={C.ink} strokeWidth={5} />
    <circle cx={0} cy={20} r={10} fill={C.ink} />
    <rect x={-4} y={22} width={8} height={22} rx={3} fill={C.ink} />
  </g>
);

export const Wrench: React.FC<P> = ({x, y, s = 1, opacity = 1, rot = -35}) => (
  <g transform={T(x, y, s, rot)} opacity={opacity}>
    <rect x={-12} y={-10} width={24} height={150} rx={10} fill={STEEL.shellLight} stroke={C.ink} strokeWidth={5} />
    <path d="M -40 -40 Q -46 -86 0 -96 L 0 -62 L 18 -50 L 30 -70 Q 54 -40 26 -10 Q 10 4 -12 -4 Q -34 -14 -40 -40 Z" fill={STEEL.shellLight} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

export const Bolt: React.FC<P> = ({x, y, s = 1, opacity = 1, rot = 0}) => (
  <g transform={T(x, y, s, rot)} opacity={opacity}>
    <path d="M -16 -10 L -8 -22 L 8 -22 L 16 -10 L 8 2 L -8 2 Z" fill={STEEL.shellLight} stroke={C.ink} strokeWidth={4} />
    <rect x={-6} y={2} width={12} height={34} fill={STEEL.shellLight} stroke={C.ink} strokeWidth={4} />
  </g>
);

/** Wall calendar; `slide` 0..1 moves the circled date to the right ("delayed"). */
export const Calendar: React.FC<P & {slide?: number; label?: string}> = ({x, y, s = 1, opacity = 1, slide = 0, label = 'next model'}) => (
  <g transform={T(x, y, s)} opacity={opacity}>
    <rect x={-120} y={-100} width={240} height={210} rx={14} fill={C.white} stroke={C.ink} strokeWidth={5} />
    <rect x={-120} y={-100} width={240} height={44} rx={14} fill={C.coral} stroke={C.ink} strokeWidth={5} />
    {[-70, 70].map((cx) => <circle key={cx} cx={cx} cy={-104} r={9} fill={C.ink} />)}
    {Array.from({length: 15}).map((_, i) => (
      <rect key={i} x={-104 + (i % 5) * 44} y={-44 + Math.floor(i / 5) * 46} width={32} height={32} rx={6} fill={C.paperDeep} />
    ))}
    <circle cx={-82 + slide * 176} cy={-28 + (slide > 0.5 ? 92 : 46)} r={24} fill="none" stroke={C.coral} strokeWidth={6} />
    <text x={0} y={136} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.ink}>{label}</text>
  </g>
);

/** Small ladle icon (glowing steel). */
export const MiniLadle: React.FC<P> = ({x, y, s = 1, opacity = 1}) => (
  <g transform={T(x, y, s)} opacity={opacity}>
    <path d="M -86 -30 A 86 20 0 0 0 86 -30 L 66 70 Q 0 88 -66 70 Z" fill={STEEL.shell} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <ellipse cx={0} cy={-30} rx={86} ry={20} fill={STEEL.edge} stroke={C.ink} strokeWidth={5} />
    <ellipse cx={0} cy={-28} rx={70} ry={14} fill={STEEL.core} />
    <ellipse cx={-10} cy={-29} rx={30} ry={6} fill={STEEL.hot} />
  </g>
);

/** Film clapperboard; `clap` 0 = open, 1 = shut. */
export const Clapper: React.FC<P & {clap?: number; text?: string}> = ({x, y, s = 1, opacity = 1, rot = 0, clap = 1, text = 'F.02'}) => (
  <g transform={T(x, y, s, rot)} opacity={opacity}>
    <rect x={-130} y={-40} width={260} height={170} rx={10} fill={C.ink} stroke={C.ink} strokeWidth={5} />
    <rect x={-116} y={-24} width={232} height={140} rx={6} fill="#2E3F48" />
    <text x={0} y={70} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={56} fill={C.paper} textLength={Math.min(210, text.length * 36)} lengthAdjust="spacingAndGlyphs">{text}</text>
    <g transform={`rotate(${-28 * (1 - clap)} -130 -40)`}>
      <rect x={-130} y={-80} width={260} height={40} rx={6} fill={C.paper} stroke={C.ink} strokeWidth={5} />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${-118 + i * 54} -78 L ${-92 + i * 54} -42 L ${-70 + i * 54} -42 L ${-96 + i * 54} -78 Z`} fill={C.ink} />)}
    </g>
  </g>
);

/** A cardboard tag on a string, e.g. RETIRED. The string top is at (x, y). */
export const HangTag: React.FC<P & {text: string; swing?: number}> = ({x, y, s = 1, opacity = 1, text, swing = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${swing}) scale(${s})`} opacity={opacity}>
    <path d="M 0 0 L 0 46" stroke={C.ink} strokeWidth={4} />
    <path d="M -84 46 L 84 46 L 96 70 L 84 120 L -84 120 Z" fill="#E8C98E" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <circle cx={0} cy={60} r={7} fill={C.paper} stroke={C.ink} strokeWidth={3} />
    <text x={0} y={106} textAnchor="middle" fontFamily={F.display} fontWeight={700} fontSize={34} fill={C.ink}>{text}</text>
  </g>
);

/** Simple building with a door, for "leaving the building". */
export const Building: React.FC<P> = ({x, y, s = 1, opacity = 1}) => (
  <g transform={T(x, y, s)} opacity={opacity}>
    <rect x={-110} y={-120} width={220} height={150} fill={C.paperDeep} stroke={C.ink} strokeWidth={5} />
    <path d="M -126 -120 L 0 -176 L 126 -120 Z" fill={C.coral} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
    <rect x={-26} y={-50} width={52} height={80} fill={C.wood} stroke={C.ink} strokeWidth={5} />
    {[-76, 50].map((wx) => <rect key={wx} x={wx} y={-96} width={30} height={30} fill={C.white} stroke={C.ink} strokeWidth={4} />)}
  </g>
);

/** Recycling sticky note symbol (three arrows). */
export const RecycleMark: React.FC<P> = ({x, y, s = 1, opacity = 1}) => (
  <g transform={T(x, y, s)} opacity={opacity} fill="none" stroke={C.teal} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
    {[0, 120, 240].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <path d="M -16 -34 L 16 -34 L 30 -10" />
        <path d="M 30 -10 L 32 -26 M 30 -10 L 15 -14" />
      </g>
    ))}
  </g>
);

/** Camera icon (for "cameras failed"). */
export const CameraIcon: React.FC<P & {broken?: number}> = ({x, y, s = 1, opacity = 1, broken = 0}) => (
  <g transform={T(x, y, s)} opacity={opacity}>
    <rect x={-70} y={-42} width={140} height={96} rx={14} fill={C.inkSoft} stroke={C.ink} strokeWidth={5} />
    <rect x={-30} y={-62} width={56} height={24} rx={6} fill={C.inkSoft} stroke={C.ink} strokeWidth={5} />
    <circle cx={0} cy={6} r={30} fill={C.blueLight} stroke={C.ink} strokeWidth={5} />
    {broken > 0 && <path d={`M -20 -14 L ${-20 + 22 * broken} ${0} L ${-6} ${8} L ${16 * broken} ${26}`} fill="none" stroke={C.ink} strokeWidth={4} />}
  </g>
);

/** Circuit chip icon (for "other electronics"). */
export const ChipIcon: React.FC<P> = ({x, y, s = 1, opacity = 1}) => (
  <g transform={T(x, y, s)} opacity={opacity}>
    {Array.from({length: 4}).map((_, i) => (
      <g key={i}>
        <rect x={-44 + i * 26} y={-62} width={10} height={20} fill={C.inkSoft} />
        <rect x={-44 + i * 26} y={42} width={10} height={20} fill={C.inkSoft} />
        <rect x={-62} y={-44 + i * 26} width={20} height={10} fill={C.inkSoft} />
        <rect x={42} y={-44 + i * 26} width={20} height={10} fill={C.inkSoft} />
      </g>
    ))}
    <rect x={-46} y={-46} width={92} height={92} rx={10} fill={C.ink} stroke={C.ink} strokeWidth={4} />
    <rect x={-24} y={-24} width={48} height={48} rx={6} fill={C.inkSoft} />
  </g>
);

/** Airbag cushion; squash 0..1 */
export const Airbag: React.FC<P & {squash?: number}> = ({x, y, s = 1, opacity = 1, squash = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s * (1 + 0.08 * squash)} ${s * (1 - 0.22 * squash)})`} opacity={opacity}>
    <path d="M -300 0 Q -320 -150 -200 -170 L 200 -170 Q 320 -150 300 0 Z" fill={C.coral} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
    {[-150, 0, 150].map((sx) => <path key={sx} d={`M ${sx} -160 Q ${sx + 20} -80 ${sx} 0`} fill="none" stroke={C.coralDeep} strokeWidth={5} />)}
    <rect x={-310} y={-8} width={620} height={16} rx={8} fill={C.coralDeep} stroke={C.ink} strokeWidth={4} />
  </g>
);
