import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {E} from '../../lib/motion';

/**
 * The team's own smartphone-grade research device (S6.3): a phone-sized slab, NOT a phone (no screen, no buttons), with
 * a sensor window holding a 10 × 10 grid of detector dots (about 100 pixels), a small emitter lens and a cable port.
 * Saffron case so it never reads as the generic blue phone of S6.2 or the teal kit sensor. No branding.
 *
 * Drawn centred on (x, y) in the parent's px (SVG group).
 *  - `dots` 0..1: the dots pop in as a diagonal wave (top-left to bottom-right).
 *  - `listen` 0..1: a ring ripples out of each dot along the same diagonal ("listening spots"); 0 or 1 = no rings.
 *  - `counter` 0..1: the "10 × 10" callout under the window fades in.
 */
export const MODULE = {w: 236, h: 430, r: 40, win: 196};

const ink = {stroke: C.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const};
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const ResearchModule: React.FC<{x: number; y: number; scale?: number; dots?: number; listen?: number; counter?: number}> = ({x, y, scale = 1, dots = 1, listen = 0, counter = 0}) => {
  const {w, h, r, win} = MODULE;
  const wx = -win / 2;
  const wy = -h / 2 + 46;
  const n = 10;
  const pitch = win / n;
  const dotR = pitch * 0.3;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-w / 2 + 12} y={-h / 2 + 16} width={w} height={h} rx={r} fill={C.shadow} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={C.saffron} {...ink} />
      {/* inner bevel line */}
      <rect x={-w / 2 + 12} y={-h / 2 + 12} width={w - 24} height={h - 24} rx={r - 12} fill="none" stroke={C.saffronDeep} strokeWidth={3} />
      {/* sensor window with the 10 x 10 detector grid */}
      <rect x={wx - 8} y={wy - 8} width={win + 16} height={win + 16} rx={14} fill={C.cream} {...ink} />
      {Array.from({length: n * n}, (_, i) => {
        const cx = wx + (i % n + 0.5) * pitch;
        const cy = wy + (Math.floor(i / n) + 0.5) * pitch;
        const diag = (i % n + Math.floor(i / n)) / (2 * (n - 1)); // 0..1 along the diagonal
        const pop = clamp01((clamp01(dots) * 1.5 - diag * 0.5) / 1);
        const s = pop <= 0 ? 0 : pop >= 1 ? 1 : E.back(pop);
        if (s <= 0.01) return null;
        // listening ripple: each dot's ring is alive for a 0.35-wide slice of `listen`, staggered along the diagonal
        const lt = listen > 0 && listen < 1 ? clamp01((listen - diag * 0.65) / 0.35) : 0;
        return (
          <g key={i}>
            {lt > 0 && lt < 1 && <circle cx={cx} cy={cy} r={dotR * (1 + 1.1 * lt)} fill="none" stroke={C.teal} strokeWidth={2.5} opacity={1 - lt} />}
            <circle cx={cx} cy={cy} r={dotR * s} fill={lt > 0 && lt < 1 ? C.teal : C.tealDeep} />
          </g>
        );
      })}
      {/* emitter lens and port */}
      <circle cx={0} cy={wy + win + 56} r={20} fill={C.inkSoft} {...ink} />
      <circle cx={-6} cy={wy + win + 50} r={6} fill={C.cream} opacity={0.8} />
      <rect x={-34} y={h / 2 - 34} width={68} height={14} rx={7} fill={C.saffronDeep} stroke={C.ink} strokeWidth={3} />
      {counter > 0 && (
        <text x={0} y={wy + win + 120} textAnchor="middle" dominantBaseline="central" fontFamily={F.mono} fontWeight={700} fontSize={36} fill={C.ink} opacity={clamp01(counter)}>
          10 × 10
        </text>
      )}
    </g>
  );
};
