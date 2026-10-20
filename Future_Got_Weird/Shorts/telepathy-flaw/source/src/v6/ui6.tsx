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

/** a received alert with a pictogram instead of text: a tipping chair and a falling cup. (x, y) = the tip of its tail. */
export const AlertChip: React.FC<{x: number; y: number; s: number; k: number; alpha?: number; tailDir?: -1 | 1}> = ({x, y, s, k, alpha = 1, tailDir = -1}) => {
  if (k <= 0.01 || alpha <= 0.01) return null;
  const w = 270 * s;
  const h = 190 * s;
  const bx = x - tailDir * w * 0.2 - w / 2;
  const by = y - h - 26 * s;
  const col = '#E4202E';
  const cx = bx + w / 2;
  const cy = by + h / 2;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k)}) translate(${fmt(-x)} ${fmt(-y)})`} opacity={alpha}>
      <path d={`M${fmt(x)},${fmt(y)} L${fmt(x - tailDir * 30 * s)},${fmt(by + h - 2)} L${fmt(x + tailDir * 22 * s)},${fmt(by + h - 2)} Z`} fill="#FFFFFF" stroke={col} strokeWidth={fmt(6 * s)} strokeLinejoin="round" />
      <path d={rr(bx, by, w, h, 40 * s)} fill="#FFFFFF" stroke={col} strokeWidth={fmt(6 * s)} />
      <path d={`M${fmt(x - tailDir * 26 * s)},${fmt(by + h - 2)} L${fmt(x + tailDir * 18 * s)},${fmt(by + h - 2)}`} stroke="#FFFFFF" strokeWidth={fmt(10 * s)} />
      {/* the pictogram, the imagined picture reduced to two bold shapes: a chair tipped back (left) and a mug tumbling with two
          drops (right); dark outlines on white so it reads on a phone, a red badge marks it as an alert */}
      <g transform={`translate(${fmt(cx - 62 * s)} ${fmt(cy + 38 * s)}) rotate(-28) scale(${fmt(s)})`}>
        <rect x={-30} y={4} width={70} height={17} rx={6} fill="#C8935F" stroke={INK} strokeWidth={7} />
        <rect x={-40} y={-68} width={18} height={92} rx={7} fill="#B9825A" stroke={INK} strokeWidth={7} />
        <rect x={-34} y={20} width={13} height={52} rx={5} fill="#B9825A" stroke={INK} strokeWidth={7} />
        <rect x={25} y={20} width={13} height={52} rx={5} fill="#B9825A" stroke={INK} strokeWidth={7} />
      </g>
      <g transform={`translate(${fmt(cx + 54 * s)} ${fmt(cy - 4 * s)}) rotate(62) scale(${fmt(s)})`}>
        <path d="M-30,-30 L30,-30 L21,32 L-21,32 Z" fill="#FFFFFF" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <ellipse cx={0} cy={-30} rx={30} ry={8} fill="#3E2412" stroke={INK} strokeWidth={5} />
      </g>
      {[[cx + 22 * s, cy + 24 * s, 9], [cx + 56 * s, cy + 50 * s, 7]].map(([sx, sy, r], i) => (
        <circle key={i} cx={fmt(sx)} cy={fmt(sy)} r={fmt((r as number) * s)} fill="#7A4A2A" stroke={INK} strokeWidth={fmt(3 * s)} />
      ))}
      <circle cx={fmt(bx + w - 8 * s)} cy={fmt(by + 8 * s)} r={fmt(24 * s)} fill={col} stroke="#FFFFFF" strokeWidth={fmt(5 * s)} />
      <text x={fmt(bx + w - 8 * s)} y={fmt(by + 8 * s + 14 * s)} fontFamily={FONT} fontWeight={700} fontSize={fmt(38 * s)} fill="#FFFFFF" textAnchor="middle">!</text>
    </g>
  );
};

/** a ring that leaves the sender's implant when he 'sends' (never travels: it fades within ~0.35 s) */
export const SendRing: React.FC<{c: V; t: number; t0: number; r1: number; color?: string; w?: number}> = ({c, t, t0, r1, color = '#46CFFF', w = 5}) => {
  const k = (t - t0) / 0.38;
  if (k < 0 || k > 1) return null;
  return <circle cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(r1 * (0.15 + 0.85 * clamp(k * 1.4)))} fill="none" stroke={color} strokeWidth={fmt(w * (1 - k) + 1)} opacity={0.85 * (1 - k)} />;
};

/** small confirmation beside a reaction. `stack` sets it on two lines (a narrower, taller tag that fits beside a face while
 *  the text stays large enough for a phone: 38 px type at scale 1) */
export const DeliveredTag: React.FC<{x: number; y: number; k: number; alpha?: number; sc?: number; stack?: boolean}> = ({x, y, k, alpha = 1, sc = 1, stack = false}) => {
  if (k <= 0.01) return null;
  const w = stack ? 330 : 466;
  const h = stack ? 124 : 76;
  return (
    <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(k * sc)}) translate(${fmt(-x)} ${fmt(-y)})`} opacity={alpha}>
      <path d={rr(x - w / 2, y - h / 2, w, h, stack ? 40 : 38)} fill="#172B3A" stroke="#FFFFFF" strokeWidth={4} />
      <circle cx={x - w / 2 + 42} cy={y} r={stack ? 24 : 20} fill="#EF3340" />
      <path d={`M${fmt(x - w / 2 + 31)},${fmt(y + 1)} l9,9 l16,-18`} stroke="#FFFFFF" strokeWidth={5.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {stack ? (
        <g>
          <text x={fmt(x - w / 2 + 82)} y={fmt(y - 8)} fontFamily={FONT} fontWeight={700} fontSize={40} fill="#FFFFFF">Message</text>
          <text x={fmt(x - w / 2 + 82)} y={fmt(y + 36)} fontFamily={FONT} fontWeight={700} fontSize={40} fill="#FFFFFF">Delivered</text>
        </g>
      ) : (
        <text x={fmt(x - w / 2 + 72)} y={fmt(y + 14)} fontFamily={FONT} fontWeight={700} fontSize={40} fill="#FFFFFF">Message Delivered</text>
      )}
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
