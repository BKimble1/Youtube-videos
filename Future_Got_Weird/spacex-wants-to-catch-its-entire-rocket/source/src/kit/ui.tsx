// Future Got Weird on-screen text: dark corner chips (disclosures, sources), cream callout labels with leader lines,
// and the occasional large title word. All sizes are in screen pixels (1920×1080 canvas).
import React from 'react';
import {clamp, prog} from './anim';

export const C = {
  ink: '#1c232b',
  ink2: '#2b3540',
  cream: '#fbf4e4',
  yellow: '#ffc93c',
  orange: '#ff8a3d',
  teal: '#2ec4b6',
  red: '#e5484d',
  steelHi: '#eef1f4',
  steel: '#c3cad2',
  steelMid: '#9aa4ae',
  steelLo: '#6b7580',
  tile: '#22262b',
  tileHi: '#3a4048',
  tower: '#3b4651',
  towerHi: '#5b6875',
};
export const FONT = {
  ui: '"Nunito Variable", sans-serif',
  title: '"Fredoka Variable", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

/** Small dark chip (disclosure / source line). Anchored by corner. */
export const Chip: React.FC<{
  text: string; x: number; y: number; o?: number; anchor?: 'tl' | 'tr' | 'bl' | 'br'; size?: number; accent?: string; sub?: string;
}> = ({text, x, y, o = 1, anchor = 'bl', size = 19, accent, sub}) => {
  if (o <= 0.001) return null;
  const pad = size * 0.6;
  const w = text.length * size * 0.62 + pad * 2 + (accent ? size * 0.9 : 0);
  const w2 = sub ? sub.length * size * 0.5 + pad * 2 : 0;
  const W = Math.max(w, w2);
  const h = size * 1.75 + (sub ? size * 1.25 : 0);
  const X = anchor.endsWith('r') ? x - W : x;
  const Y = anchor.startsWith('b') ? y - h : y;
  return (
    <g opacity={o} transform={`translate(${X} ${Y})`}>
      <rect width={W} height={h} rx={size * 0.45} fill="rgba(20,25,31,0.86)" stroke="rgba(255,255,255,0.18)" strokeWidth={1.2} />
      {accent ? <circle cx={pad + size * 0.3} cy={size * 0.88} r={size * 0.26} fill={accent} /> : null}
      <text x={pad + (accent ? size * 0.9 : 0)} y={size * 1.2} fontFamily={FONT.ui} fontWeight={800} fontSize={size} fill={C.cream} letterSpacing={size * 0.06}>
        {text}
      </text>
      {sub ? (
        <text x={pad} y={size * 2.45} fontFamily={FONT.ui} fontWeight={600} fontSize={size * 0.8} fill="rgba(251,244,228,0.78)">
          {sub}
        </text>
      ) : null}
    </g>
  );
};

/** Cream callout label with an optional leader line to a point (all screen px). Grows in with `o`. */
export const Callout: React.FC<{
  text: string; x: number; y: number; to?: [number, number]; o?: number; size?: number; sub?: string; align?: 'l' | 'r' | 'c'; dark?: boolean;
}> = ({text, x, y, to, o = 1, size = 26, sub, align = 'l', dark}) => {
  if (o <= 0.001) return null;
  const pad = size * 0.55;
  const w = Math.max(text.length * size * 0.6, sub ? sub.length * size * 0.42 : 0) + pad * 2;
  const h = size * 1.6 + (sub ? size * 1.0 : 0);
  const X = align === 'r' ? x - w : align === 'c' ? x - w / 2 : x;
  const k = clamp(o * 1.4);
  const lineEnd = to ? [x + (to[0] - x) * k, y + (to[1] - y) * k] : null;
  return (
    <g opacity={clamp(o * 2)}>
      {to && lineEnd ? (
        <>
          <line x1={align === 'r' ? X + w : align === 'c' ? x : X} y1={y + h / 2} x2={lineEnd[0]} y2={lineEnd[1]} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
          <line x1={align === 'r' ? X + w : align === 'c' ? x : X} y1={y + h / 2} x2={lineEnd[0]} y2={lineEnd[1]} stroke={C.cream} strokeWidth={2.2} strokeLinecap="round" />
          <circle cx={lineEnd[0]} cy={lineEnd[1]} r={6} fill={C.yellow} stroke={C.ink} strokeWidth={2.5} opacity={k >= 1 ? 1 : 0} />
        </>
      ) : null}
      <g transform={`translate(${X} ${y}) scale(${0.85 + 0.15 * clamp(o * 1.5)})`}>
        <rect width={w} height={h} rx={size * 0.35} fill={dark ? 'rgba(20,25,31,0.9)' : C.cream} stroke={C.ink} strokeWidth={3} />
        <text x={pad} y={size * 1.12} fontFamily={FONT.title} fontWeight={600} fontSize={size} fill={dark ? C.cream : C.ink}>
          {text}
        </text>
        {sub ? (
          <text x={pad} y={size * 2.15} fontFamily={FONT.ui} fontWeight={700} fontSize={size * 0.62} fill={dark ? 'rgba(251,244,228,0.8)' : '#55606b'}>
            {sub}
          </text>
        ) : null}
      </g>
    </g>
  );
};

/** Large outlined title word(s), FGW thumbnail style. */
export const BigText: React.FC<{text: string; x: number; y: number; size?: number; o?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'}> = ({
  text, x, y, size = 110, o = 1, fill = C.cream, anchor = 'middle',
}) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o}>
      <text x={x} y={y + size * 0.06} textAnchor={anchor} fontFamily={FONT.title} fontWeight={700} fontSize={size} fill="rgba(0,0,0,0.35)" stroke="rgba(0,0,0,0.35)" strokeWidth={size * 0.2} strokeLinejoin="round">
        {text}
      </text>
      <text x={x} y={y} textAnchor={anchor} fontFamily={FONT.title} fontWeight={700} fontSize={size} fill={fill} stroke={C.ink} strokeWidth={size * 0.13} strokeLinejoin="round" paintOrder="stroke">
        {text}
      </text>
    </g>
  );
};

/** Standard disclosure chip for illustrated future events (bottom-left). */
export const Disclose: React.FC<{t: number; a: number; b: number; text?: string; sub?: string}> = ({t, a, b, text = 'ILLUSTRATION — PLANNED ATTEMPT', sub}) => {
  const o = Math.min(prog(t, a, a + 0.3), 1 - prog(t, b - 0.3, b));
  return <Chip text={text} sub={sub} x={44} y={1036} o={o} anchor="bl" accent={C.yellow} />;
};

/** Circular check / cross mark. */
export const Mark: React.FC<{x: number; y: number; ok: boolean; s?: number; o?: number}> = ({x, y, ok, s = 34, o = 1}) =>
  o <= 0 ? null : (
    <g transform={`translate(${x} ${y}) scale(${(s / 34) * (0.6 + 0.4 * clamp(o * 1.5))})`} opacity={clamp(o * 2)}>
      <circle r={34} fill={ok ? C.teal : C.red} stroke={C.ink} strokeWidth={5} />
      {ok ? (
        <path d="M-15 1 L-4 12 L16 -11" fill="none" stroke={C.cream} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M-12 -12 L12 12 M12 -12 L-12 12" fill="none" stroke={C.cream} strokeWidth={8} strokeLinecap="round" />
      )}
    </g>
  );
