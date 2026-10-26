// Screen-space explanation graphics. They never sit inside a camera layer, so they keep their size and position
// while the world moves (no inherited zoom or jitter). Fredoka for titles, Nunito for labels (the channel's faces).
import React from 'react';
import {clamp, fmt, lerp} from '../dc/math';
import {loud} from '../lib/visemes';

export const UI = {
  ink: '#1E2A33',
  paper: '#FBF7EE',
  warm: '#F6E7C8',
  teal: '#2F7F7A',
  blue: '#4F67C4',
  amber: '#F5A33B',
  coral: '#E06A4F',
};

/** a rounded pill label */
export const Tag: React.FC<{x: number; y: number; text: string; k?: number; anchor?: 'start' | 'middle' | 'end'; size?: number; tone?: 'dark' | 'light' | 'warm'}> = ({x, y, text, k = 1, anchor = 'start', size = 26, tone = 'dark'}) => {
  if (k <= 0.001) return null;
  const w = text.length * size * 0.54 + 36;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  const bg = tone === 'dark' ? '#1E2A33' : tone === 'warm' ? UI.warm : UI.paper;
  const fg = tone === 'dark' ? '#F6F0E2' : UI.ink;
  return (
    <g opacity={k}>
      <rect x={fmt(x0)} y={fmt(y - size * 0.98)} width={fmt(w)} height={fmt(size * 1.6)} rx={fmt(size * 0.8)} fill={bg} opacity={0.92} />
      <text x={fmt(x0 + w / 2)} y={fmt(y + size * 0.14)} textAnchor="middle" fontFamily="Nunito Variable" fontWeight={800} fontSize={size} fill={fg} letterSpacing={0.3}>
        {text}
      </text>
    </g>
  );
};

/** motor-command bars (8 channels), values 0..1 */
export const CommandPanel: React.FC<{x: number; y: number; vals: number[]; k?: number; title?: string; hot?: number}> = ({x, y, vals, k = 1, title = 'Motor commands', hot = -1}) => {
  if (k <= 0.001) return null;
  const w = 300;
  const h = 170;
  return (
    <g opacity={k} transform={`translate(${fmt(x)} ${fmt(y)})`}>
      <rect x={0} y={0} width={w} height={h} rx={16} fill={UI.paper} stroke={UI.ink} strokeWidth={3} />
      <text x={18} y={34} fontFamily="Nunito Variable" fontWeight={800} fontSize={22} fill={UI.ink}>
        {title}
      </text>
      {vals.map((v, i) => {
        const bx = 22 + i * 34;
        const bh = 100 * clamp(v);
        return (
          <g key={i}>
            <rect x={bx} y={52} width={22} height={100} rx={4} fill="#E3DCCB" />
            <rect x={bx} y={fmt(152 - bh)} width={22} height={fmt(bh)} rx={4} fill={i === hot ? UI.amber : UI.blue} />
          </g>
        );
      })}
    </g>
  );
};

/** a waveform trace drawn from the narration's measured loudness between t0 and t1 (or a supplied function) */
export const Wave: React.FC<{x: number; y: number; w: number; h: number; t0: number; t1: number; cursor?: number; k?: number; color?: string; fn?: (t: number) => number; reveal?: number}> = ({x, y, w, h, t0, t1, cursor, k = 1, color = UI.teal, fn = loud, reveal = 1}) => {
  if (k <= 0.001) return null;
  const n = 160;
  const pts: string[] = [];
  const nn = Math.max(2, Math.round(n * clamp(reveal)));
  for (let i = 0; i < nn; i++) {
    const tt = lerp(t0, t1, i / (n - 1));
    const a = fn(tt) * (0.6 + 0.4 * Math.abs(Math.sin(tt * 97.0)));
    pts.push(`${fmt(x + (i / (n - 1)) * w)},${fmt(y - a * h)}`);
  }
  const lower = pts.map((p) => {
    const [px, py] = p.split(',').map(Number);
    return `${fmt(px)},${fmt(2 * y - py)}`;
  });
  const cx = cursor !== undefined ? x + ((cursor - t0) / (t1 - t0)) * w : undefined;
  return (
    <g opacity={k}>
      <path d={`M${pts.join(' L')} L${lower.reverse().join(' L')} Z`} fill={color} opacity={0.85} />
      <line x1={x} y1={y} x2={x + w} y2={y} stroke={color} strokeWidth={1.5} opacity={0.5} />
      {cx !== undefined && cx >= x && cx <= x + w && <line x1={fmt(cx)} y1={fmt(y - h - 8)} x2={fmt(cx)} y2={fmt(y + h + 8)} stroke={UI.coral} strokeWidth={3} />}
    </g>
  );
};

/** a titled card (channel style frames: cream card, ink border, Fredoka title) */
export const Card: React.FC<{x: number; y: number; w: number; h: number; title: string; k?: number; rot?: number; children?: React.ReactNode; titleSize?: number; accent?: string}> = ({x, y, w, h, title, k = 1, rot = 0, children, titleSize = 46, accent = UI.blue}) => {
  if (k <= 0.001) return null;
  return (
    <g opacity={Math.min(1, k * 1.5)} transform={`translate(${fmt(x)} ${fmt(y + (1 - clamp(k)) * 40)}) rotate(${fmt(rot)})`}>
      <rect x={6} y={8} width={w} height={h} rx={18} fill="#000" opacity={0.18} />
      <rect x={0} y={0} width={w} height={h} rx={18} fill={UI.paper} stroke={UI.ink} strokeWidth={4} />
      <text x={30} y={22 + titleSize} fontFamily="Fredoka Variable" fontWeight={600} fontSize={titleSize} fill={UI.ink}>
        {title}
      </text>
      <rect x={30} y={36 + titleSize} width={Math.min(w - 60, title.length * titleSize * 0.56)} height={6} rx={3} fill={accent} />
      {children}
    </g>
  );
};

/** small caption-safe text line */
export const Note: React.FC<{x: number; y: number; text: string; k?: number; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string; weight?: number}> = ({x, y, text, k = 1, size = 28, anchor = 'start', color = UI.ink, weight = 700}) =>
  k <= 0.001 ? null : (
    <text x={fmt(x)} y={fmt(y)} textAnchor={anchor} fontFamily="Nunito Variable" fontWeight={weight} fontSize={size} fill={color} opacity={k}>
      {text}
    </text>
  );
