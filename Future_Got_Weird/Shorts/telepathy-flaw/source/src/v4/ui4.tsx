// V4 on-screen UI: only what the story needs. MsgChip: a small received-message bubble that pops beside the
// recipient's head (never travels). DeliveredTag: the small "Message Delivered" confirmation beside a reaction.
// WarnTag: "UNFILTERED THOUGHT DETECTED" inside the internal insert.
import React from 'react';
import {INK} from '../lib/ink';
import {clamp, easeOutBack, fmt, V} from '../lib/math';
import {rr} from './env/Props';

const FONT = "'Fredoka Variable', sans-serif";

export const popScale = (t: number, t0: number, dur = 0.2) => (t < t0 ? 0 : easeOutBack(clamp((t - t0) / dur), 1.7));

/** received message bubble. (x, y) = the tip of its tail (what it points at); `s` = its screen-size scale. */
export const MsgChip: React.FC<{x: number; y: number; s: number; text: string; k: number; alpha?: number; tailDir?: -1 | 1; tone?: 'blue' | 'red'}> = ({x, y, s, text, k, alpha = 1, tailDir = 1, tone = 'blue'}) => {
  if (k <= 0.01 || alpha <= 0.01) return null;
  const w = Math.max(150, text.length * 38 + 100) * s;
  const h = 78 * s;
  const bx = x - tailDir * w * 0.2 - w / 2;
  const by = y - h - 24 * s;
  const col = tone === 'blue' ? '#2D5FE0' : '#EF3340';
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k)}) translate(${fmt(-x)} ${fmt(-y)})`} opacity={alpha}>
      <path d={`M${fmt(x)},${fmt(y)} L${fmt(x - tailDir * 26 * s)},${fmt(by + h - 2)} L${fmt(x + tailDir * 18 * s)},${fmt(by + h - 2)} Z`} fill="#FFFFFF" stroke={col} strokeWidth={fmt(5 * s)} strokeLinejoin="round" />
      <path d={rr(bx, by, w, h, 30 * s)} fill="#FFFFFF" stroke={col} strokeWidth={fmt(5 * s)} />
      <path d={`M${fmt(x - tailDir * 22 * s)},${fmt(by + h - 2)} L${fmt(x + tailDir * 14 * s)},${fmt(by + h - 2)}`} stroke="#FFFFFF" strokeWidth={fmt(8 * s)} />
      <circle cx={fmt(bx + 38 * s)} cy={fmt(by + h / 2)} r={fmt(15 * s)} fill={col} />
      <circle cx={fmt(bx + 38 * s)} cy={fmt(by + h / 2)} r={fmt(6 * s)} fill="#FFFFFF" />
      <text x={fmt(bx + 66 * s)} y={fmt(by + h / 2 + 18 * s)} fontFamily={FONT} fontWeight={700} fontSize={fmt(50 * s)} fill={INK}>{text}</text>
    </g>
  );
};

/** small confirmation beside a reaction */
export const DeliveredTag: React.FC<{x: number; y: number; k: number; alpha?: number; sc?: number}> = ({x, y, k, alpha = 1, sc = 1}) => {
  if (k <= 0.01) return null;
  const w = 466;
  const h = 76;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k * sc)}) translate(${fmt(-x)} ${fmt(-y)})`} opacity={alpha}>
      <path d={rr(x - w / 2, y - h / 2, w, h, 38)} fill="#172B3A" stroke="#FFFFFF" strokeWidth={4} />
      <circle cx={x - w / 2 + 40} cy={y} r={20} fill="#21B883" />
      <path d={`M${fmt(x - w / 2 + 30)},${fmt(y + 1)} l8,8 l14,-16`} stroke="#FFFFFF" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x={fmt(x - w / 2 + 72)} y={fmt(y + 14)} fontFamily={FONT} fontWeight={700} fontSize={40} fill="#FFFFFF">Message Delivered</text>
    </g>
  );
};

export const WarnTag: React.FC<{x: number; y: number; k: number; alpha?: number}> = ({x, y, k, alpha = 1}) => {
  if (k <= 0.01) return null;
  const w = 780;
  const h = 84;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k)}) translate(${fmt(-x)} ${fmt(-y)})`} opacity={alpha}>
      <path d={rr(x - w / 2, y - h / 2, w, h, 12)} fill="#2A0710" fillOpacity={0.88} stroke="#EF3340" strokeWidth={5} />
      <path d={`M${fmt(x - w / 2 + 44)},${fmt(y - 24)} l22,42 h-44 Z`} fill="#EF3340" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round" />
      <text x={fmt(x - w / 2 + 44)} y={fmt(y + 12)} fontFamily={FONT} fontWeight={700} fontSize={30} fill="#FFFFFF" textAnchor="middle">!</text>
      <text x={fmt(x - w / 2 + 84)} y={fmt(y + 14)} fontFamily={FONT} fontWeight={700} fontSize={42} fill="#FFFFFF" letterSpacing={1.5}>UNFILTERED THOUGHT DETECTED</text>
    </g>
  );
};

export type {V};
