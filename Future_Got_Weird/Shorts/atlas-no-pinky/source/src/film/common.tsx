import React from 'react';
import {C, F, H, OUTLINE, W} from '../theme';
import {E, kf, tw as twMotion} from '../lib/motion';
import type {Ease} from '../lib/motion';

/** 0 -> 1 over [start, start+dur]; LINEAR unless an ease is given (compose with E.* to shape it). */
export const tw = (g: number, start: number, dur: number, ease: Ease = E.linear) => twMotion(g, start, dur, ease);
export {E, kf};
export {C, F, H, W, OUTLINE};

/** Shared layout (world = screen, 1080x1920). Critical content stays inside x 100-870, y 220-1440. */
export const BENCH_TOP = 1000; // back edge of the bench top
export const BENCH_LIP = 1172; // front edge
export const SURF = 1098; // contact line for props standing on the bench
export const CHK = {x: 150, y: 1290, scale: 1.25};
export const RH = {x: 600, y: 800, s: 1.45}; // robot hand (front view): palm centre + scale
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ backdrop */

export type ThemeLayer = {theme: 'cream' | 'saffron'; from: number; to: number; kind: 'iris' | 'tape'; cx?: number; cy?: number};

/** Tape wipe geometry: a slightly tilted band moving right -> left. */
export const TAPE_BW = 300;
export const TAPE_SLOPE = 0.16;
export const tapeLead = (g: number, from: number, to: number, y: number) => {
  const t = tw(g, from, to - from, E.inOut);
  const x0 = W + 80 + TAPE_SLOPE * 900; // starts just off the right edge
  const x1 = -TAPE_BW - 80 - TAPE_SLOPE * 1000;
  return x0 + (x1 - x0) * t - TAPE_SLOPE * (y - 664);
};
export const tapePoly = (g: number, from: number, to: number) => {
  const l = (y: number) => tapeLead(g, from, to, y) + TAPE_BW;
  return `${l(0)},0 ${W + 10},0 ${W + 10},${H} ${l(H)},${H}`;
};

const themeColor = (t: 'cream' | 'saffron') => (t === 'cream' ? C.paper : C.saffron);

const WallFill: React.FC<{theme: 'cream' | 'saffron'}> = ({theme}) => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill={themeColor(theme)} />
    <rect x={0} y={0} width={W} height={H} fill={`url(#spot-${theme})`} />
    {/* wall panel seams: quiet structure so the space reads as a workshop wall */}
    <g stroke={theme === 'cream' ? C.paperLine : C.saffronDeep} strokeWidth={3} opacity={0.5}>
      <line x1={0} y1={BENCH_TOP - 250} x2={W} y2={BENCH_TOP - 250} />
      <line x1={0} y1={BENCH_TOP - 14} x2={W} y2={BENCH_TOP - 14} />
    </g>
  </g>
);

export const Wall: React.FC<{g: number; layers: ThemeLayer[]}> = ({g, layers}) => (
  <g>
    <defs>
      <radialGradient id="spot-cream" cx="55%" cy="42%" r="70%">
        <stop offset="0" stopColor={C.cream} stopOpacity={0.9} />
        <stop offset="1" stopColor={C.paper} stopOpacity={0} />
      </radialGradient>
      <radialGradient id="spot-saffron" cx="55%" cy="42%" r="70%">
        <stop offset="0" stopColor={C.saffronLight} stopOpacity={0.75} />
        <stop offset="1" stopColor={C.saffron} stopOpacity={0} />
      </radialGradient>
    </defs>
    <WallFill theme="saffron" />
    {layers.map((l, i) => {
      if (g < l.from) return null;
      const id = `wl${i}`;
      return (
        <g key={i}>
          <defs>
            <clipPath id={id}>
              {l.kind === 'iris' ? (
                <circle cx={l.cx} cy={l.cy} r={tw(g, l.from, l.to - l.from, E.inOut) * 2300} />
              ) : (
                <polygon points={tapePoly(g, l.from, l.to)} />
              )}
            </clipPath>
          </defs>
          <g clipPath={`url(#${id})`}>
            <WallFill theme={l.theme} />
          </g>
        </g>
      );
    })}
  </g>
);

export const Bench: React.FC = () => (
  <g>
    {/* top surface */}
    <rect x={0} y={BENCH_TOP} width={W} height={BENCH_LIP - BENCH_TOP} fill={C.woodLight} />
    <g stroke={C.wood} strokeWidth={3} opacity={0.55}>
      <line x1={0} y1={1058} x2={W} y2={1058} />
      <line x1={0} y1={1124} x2={W} y2={1124} />
      {[140, 420, 700, 930].map((x, i) => (
        <line key={i} x1={x + i * 12} y1={1058} x2={x + i * 12 - 30} y2={1124} />
      ))}
    </g>
    <line x1={0} y1={BENCH_TOP} x2={W} y2={BENCH_TOP} stroke={C.ink} strokeWidth={OUTLINE} />
    {/* front lip + face */}
    <rect x={0} y={BENCH_LIP} width={W} height={26} fill={C.woodDeep} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={0} y={BENCH_LIP + 26} width={W} height={H - BENCH_LIP - 26} fill={C.wood} />
    <g stroke={C.woodDeep} strokeWidth={4} opacity={0.5}>
      {[270, 540, 810].map((x) => (
        <line key={x} x1={x} y1={BENCH_LIP + 26} x2={x} y2={H} />
      ))}
    </g>
  </g>
);

/** Soft contact shadow under a prop standing on the bench. */
export const Shadow: React.FC<{x: number; y?: number; rx: number; ry?: number; o?: number}> = ({x, y = SURF, rx, ry = 14, o = 1}) => (
  <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={C.shadow} opacity={o} />
);

/* ------------------------------------------------------------------ text */

const CAP = 0.64; // Fredoka 700 caps advance, em
export const capW = (s: string, size: number, k = CAP) => s.length * size * k;

export const Plate: React.FC<{
  x: number; // centre
  y: number; // centre
  text: string;
  size?: number;
  fill?: string;
  color?: string;
  padX?: number;
  h?: number;
  rot?: number;
  sx?: number;
  sy?: number;
  opacity?: number;
  weight?: number;
  w?: number;
}> = ({x, y, text, size = 84, fill = C.coral, color = C.ink, padX = 34, h, rot = 0, sx = 1, sy = 1, opacity = 1, weight = 700, w}) => {
  const ww = w ?? capW(text, size) + padX * 2;
  const hh = h ?? size * 1.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`} opacity={opacity}>
      <rect x={-ww / 2 + 5} y={-hh / 2 + 7} width={ww} height={hh} rx={18} fill={C.ink} opacity={0.22} />
      <rect x={-ww / 2} y={-hh / 2} width={ww} height={hh} rx={18} fill={fill} stroke={C.ink} strokeWidth={OUTLINE} />
      <text x={0} y={0} dy="0.36em" textAnchor="middle" fontFamily={F.display} fontWeight={weight} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};

export const Headline: React.FC<{x?: number; y: number; text: string; size?: number; color?: string; sx?: number; sy?: number; opacity?: number; anchor?: 'middle' | 'start'; stroke?: string}> = ({
  x = 500,
  y,
  text,
  size = 128,
  color = C.ink,
  sx = 1,
  sy = 1,
  opacity = 1,
  anchor = 'middle',
  stroke,
}) => (
  <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`} opacity={opacity}>
    <text x={0} y={0} dy="0.36em" textAnchor={anchor} fontFamily={F.display} fontWeight={700} fontSize={size} fill={color} stroke={stroke} strokeWidth={stroke ? 10 : 0} paintOrder="stroke" strokeLinejoin="round">
      {text}
    </text>
  </g>
);

/** Source / reconstruction chip: always visible, >= 40 px, inside the safe area above the caption lane. The plate stays put; only the tag text cross-fades. */
export const Chip: React.FC<{tag: string; prev?: string; k?: number; dx?: number}> = ({tag, prev, k = 1, dx = 0}) => {
  const wOf = (t: string) => Math.max(capW(t, 40, 0.69), 23 * 40 * 0.56) + 48;
  const w = prev ? wOf(prev) + (wOf(tag) - wOf(prev)) * k : wOf(tag);
  return (
    <g transform={`translate(${100 + dx} 1208)`}>
      <rect x={4} y={6} width={w} height={112} rx={20} fill={C.ink} opacity={0.25} />
      <rect x={0} y={0} width={w} height={112} rx={20} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      {prev && k < 1 && (
        <text x={24} y={46} fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.coralDeep} letterSpacing={0.5} opacity={1 - k}>
          {prev}
        </text>
      )}
      <text x={24} y={46} fontFamily={F.body} fontWeight={800} fontSize={40} fill={C.coralDeep} letterSpacing={0.5} opacity={prev ? k : 1}>
        {tag}
      </text>
      <text x={24} y={94} fontFamily={F.body} fontWeight={700} fontSize={40} fill={C.ink}>
        Source: Boston Dynamics
      </text>
    </g>
  );
};

/** Little burst of action ticks (impact feedback). */
export const Burst: React.FC<{x: number; y: number; t: number; r0?: number; r1?: number; n?: number; color?: string; w?: number; rot?: number}> = ({x, y, t, r0 = 26, r1 = 62, n = 7, color = C.coral, w = 6, rot = 0}) => {
  if (t <= 0 || t >= 1) return null;
  const e = E.out(t);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={1 - t * t} strokeLinecap="round" stroke={color} strokeWidth={w}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2;
        const a0 = r0 + (r1 - r0) * e * 0.5, a1 = r0 + (r1 - r0) * e;
        return <line key={i} x1={Math.cos(a) * a0} y1={Math.sin(a) * a0} x2={Math.cos(a) * a1} y2={Math.sin(a) * a1} />;
      })}
    </g>
  );
};
