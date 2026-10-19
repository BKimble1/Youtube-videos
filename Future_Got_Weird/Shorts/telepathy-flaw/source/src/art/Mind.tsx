// The mental space (a dark thought cloud above the sender's head) and the neck window with the larynx.
import React from 'react';
import {lit, shade} from '../lib/color';
import {clamp, fmt, hash, V} from '../lib/math';
import {ALERT, BONE} from './Section';
import {INKC, SilhouetteMark} from './Ui';

export const CLOUD_C: V = {x: 175, y: 462};
const BUBBLES: [number, number, number][] = [
  [0, 0, 112],
  [-92, 28, 66],
  [84, -34, 76],
  [-26, -78, 68],
  [74, 52, 58],
  [-84, -40, 56],
];
/** trail of small bubbles from the cloud down to the head */
const TRAIL: [number, number, number][] = [
  [92, 128, 24],
  [128, 176, 17],
  [152, 214, 11],
];

export const clipIdOf = (id: string) => `${id}-cloudclip`;

/** the thought cloud with its content; `alpha` fades the whole space, `content` is drawn inside (clipped to the cloud) */
export const MindCloud: React.FC<{id: string; alpha: number; scale?: number; red?: number; children?: React.ReactNode}> = ({id, alpha, scale = 1, red = 0, children}) => {
  if (alpha <= 0.01) return null;
  const c = CLOUD_C;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) scale(${fmt(scale)})`} opacity={alpha}>
      <defs>
        <radialGradient id={`${id}-cg`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor={lit('#6A4A8A', 0.1 + 0.15 * red)} />
          <stop offset="0.6" stopColor="#3A2358" />
          <stop offset="1" stopColor="#1E1230" />
        </radialGradient>
        <clipPath id={clipIdOf(id)}>
          {BUBBLES.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} />
          ))}
        </clipPath>
      </defs>
      {[...BUBBLES, ...TRAIL].map(([x, y, r], i) => (
        <circle key={`o${i}`} cx={x} cy={y} r={r} fill={INKC} stroke={INKC} strokeWidth={9} />
      ))}
      {[...BUBBLES, ...TRAIL].map(([x, y, r], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={r} fill={`url(#${id}-cg)`} />
      ))}
      <g clipPath={`url(#${clipIdOf(id)})`}>{children}</g>
      <ellipse cx={-56} cy={-86} rx={44} ry={14} transform="rotate(-24 -56 -86)" fill="#FFFFFF" opacity={0.1} />
    </g>
  );
};

/** abstract fragments passing through the mind: ragged blots, a tangle, a shard, a small ring; no faces, no words */
export const Fragment: React.FC<{c: V; kind: number; s?: number; alpha?: number; rot?: number}> = ({c, kind, s = 1, alpha = 1, rot = 0}) => {
  if (alpha <= 0.01) return null;
  const k = kind % 5;
  const shapes = [
    <path key="a" d="M-30,14 L-24,-8 L-34,-20 L-14,-18 L-6,-36 L6,-18 L24,-26 L22,-4 L36,6 L16,12 L10,32 L-4,18 Z" fill="#150B1E" />,
    <path key="b" d="M-34,0 C-30,-26 -4,-30 2,-12 C8,6 -14,10 -12,-4 C-10,-16 12,-14 18,-2 C26,14 4,30 -14,22" fill="none" stroke="#150B1E" strokeWidth={8} strokeLinecap="round" />,
    <path key="c" d="M-26,24 L-4,-30 L8,-4 L30,-26 L22,26 Z" fill="#150B1E" />,
    <g key="d">
      <circle r={22} fill="none" stroke="#150B1E" strokeWidth={9} strokeDasharray="14 8" />
      <circle r={6} fill="#150B1E" />
    </g>,
    <path key="e" d="M-30,20 L-26,-4 L-14,-12 L-20,-26 L-2,-20 L6,-34 L10,-14 L28,-12 L18,2 L30,18 L6,12 L-6,26 Z" fill="#1B0F26" />,
  ];
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)}) rotate(${fmt(rot)}) scale(${fmt(s)})`} opacity={alpha}>
      {shapes[k]}
    </g>
  );
};

/** the intrusive thought inside the cloud: the dark abstract silhouette, looming in over a few frames */
export const IntrusiveThought: React.FC<{id: string; alpha: number; grow: number}> = ({id, alpha, grow}) => (
  <SilhouetteMark c={{x: -6 * (1 - grow), y: 8 + 30 * (1 - grow)}} s={0.78 + 0.5 * grow} alpha={alpha} id={id} rim={0.5 + 0.8 * grow} />
);

// -----------------------------------------------------------------------------------------------------------------
// Neck window with the larynx
// -----------------------------------------------------------------------------------------------------------------
/** a window cut into the sender's neck: skin edge, the airway, the thyroid cartilage and two still vocal folds */
export const NeckWindow: React.FC<{id: string; c: V; R: number; open: number; fold: number; dim: number}> = ({id, c, R, open, fold, dim}) => {
  const o = clamp(open);
  if (o <= 0.01) return null;
  const rx = R * 0.5 * o;
  const ry = R * 0.62 * o;
  const k = R / 100;
  return (
    <g transform={`translate(${fmt(c.x)} ${fmt(c.y)})`}>
      <defs>
        <clipPath id={`${id}-nw`}>
          <ellipse rx={fmt(rx)} ry={fmt(ry)} />
        </clipPath>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E8A6A0" />
          <stop offset="0.5" stopColor="#F2C2BA" />
          <stop offset="1" stopColor="#D98E88" />
        </linearGradient>
        <linearGradient id={`${id}-air`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7C3A47" />
          <stop offset="0.5" stopColor="#B25A66" />
          <stop offset="1" stopColor="#7C3A47" />
        </linearGradient>
      </defs>
      <ellipse rx={fmt(rx + 5)} ry={fmt(ry + 5)} fill={INKC} opacity={0.75} />
      <g clipPath={`url(#${id}-nw)`}>
        <rect x={-rx} y={-ry} width={rx * 2} height={ry * 2} fill="#F4D4B8" />
        {/* soft tissue */}
        <rect x={-rx} y={-ry} width={rx * 2} height={ry * 2} fill={`url(#${id}-wall)`} opacity={0.9} />
        {/* the airway: a tube with the thyroid cartilage shield round it */}
        <g transform={`scale(${fmt(k * 1.35)})`}>
          <path d="M-22,-60 L-22,-14 Q-22,-4 -12,6 L-12,64 L12,64 L12,6 Q22,-4 22,-14 L22,-60 Z" fill={`url(#${id}-air)`} stroke={shade('#7C3A47', 0.4)} strokeWidth={2} />
          <path d="M-40,-30 Q-40,-52 -20,-52 L0,-44 L20,-52 Q40,-52 40,-30 Q40,-4 12,10 L0,16 L-12,10 Q-40,-4 -40,-30 Z" fill="#F7EEDC" stroke={shade(BONE, 0.5)} strokeWidth={2.4} opacity={0.82} />
          {/* the two vocal folds, at rest: a V with a still slit between them */}
          <path d="M-20,-24 Q-14,-6 -3,4 L-3,-4 Q-10,-14 -16,-30 Z" fill="#F0A9AD" stroke="#8A3A48" strokeWidth={1.6} />
          <path d="M20,-24 Q14,-6 3,4 L3,-4 Q10,-14 16,-30 Z" fill="#F0A9AD" stroke="#8A3A48" strokeWidth={1.6} />
          <path d="M0,-26 L0,2" stroke="#3A1420" strokeWidth={3 + 2 * fold} strokeLinecap="round" opacity={0.7} />
          <ellipse cx={-10} cy={-12} rx={3} ry={5} transform="rotate(30 -10 -12)" fill="#FFFFFF" opacity={0.5} />
          <ellipse cx={10} cy={-12} rx={3} ry={5} transform="rotate(-30 10 -12)" fill="#FFFFFF" opacity={0.5} />
        </g>
        {/* the folds go dim and cool as attention leaves them */}
        <rect x={-rx} y={-ry} width={rx * 2} height={ry * 2} fill="#0E2540" opacity={0.6 * clamp(dim)} />
      </g>
      <ellipse rx={fmt(rx)} ry={fmt(ry)} fill="none" stroke="#E9A98C" strokeWidth={4.5} />
      <ellipse rx={fmt(rx)} ry={fmt(ry)} fill="none" stroke={INKC} strokeWidth={2.2} opacity={0.85} />
    </g>
  );
};
