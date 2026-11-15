// The sheet in world space: the wound cross-section, the straightening line and the opened page face.
// World units are page units (lib/sheet.ts). The spiral is centred on `origin`. A flattened point s sits at
// flat(s) = (anchor.x + s - anchor.s, anchor.y), so the anchor point never moves while the sheet straightens.
import React from 'react';
import {clamp, hash, lerp, noise1} from '../lib/math';
import {ADV, BREAKS, FS, Glyph, LAYOUT, PH, SPIRAL, bottomEdge, idxAt, topEdge} from '../lib/sheet';
import {FONT_GREEK, K} from './kit';

export type Cam = {x: number; y: number; z: number};
export type Anchor = {s: number; x: number; y: number};
export const camT = (cam: Cam, cx = 960, cy = 540) => `translate(${cx - cam.x * cam.z} ${cy - cam.y * cam.z}) scale(${cam.z})`;
export const toScreen = (cam: Cam, wx: number, wy: number, cx = 960, cy = 540) => ({x: cx + (wx - cam.x) * cam.z, y: cy + (wy - cam.y) * cam.z});
export const World: React.FC<{cam: Cam; cx?: number; cy?: number; children: React.ReactNode}> = ({cam, cx = 960, cy = 540, children}) => (
  <g transform={camT(cam, cx, cy)}>{children}</g>
);

export const flatPos = (a: Anchor, s: number) => ({x: a.x + s - a.s, y: a.y});

/** world position of sheet point s for a morph value p (0 = in the spiral, 1 = flat) */
export const sheetPos = (s: number, p: number, a: Anchor, origin = {x: 0, y: 0}) => {
  const i = idxAt(s);
  const q = SPIRAL[i];
  const f = flatPos(a, s);
  // a slight lift while travelling keeps the moving ribbon readable over the scan
  return {x: lerp(origin.x + q.x, f.x, p), y: lerp(origin.y + q.y, f.y, p)};
};

export const SheetLine: React.FC<{
  s0?: number;
  s1?: number;
  p?: (s: number) => number;
  anchor?: Anchor;
  origin?: {x: number; y: number};
  color: string;
  width: number;
  opacity?: number;
  dash?: string;
  stride?: number;
  breaks?: boolean;
  glow?: string;
}> = ({s0 = 0, s1 = 5800, p, anchor = {s: 0, x: 0, y: 0}, origin = {x: 0, y: 0}, color, width, opacity = 1, dash, stride = 1, breaks = true, glow}) => {
  if (s1 <= s0) return null;
  const i0 = idxAt(s0);
  const i1 = idxAt(s1) + 1;
  let d = '';
  let pen = false;
  for (let i = i0; i <= Math.min(SPIRAL.length - 1, i1); i += stride) {
    const q = SPIRAL[i];
    const s = clamp(q.s, s0, s1);
    if (breaks && BREAKS.some(([a, b]) => s > a && s < b)) {
      pen = false;
      continue;
    }
    const pp = p ? p(s) : 0;
    let x: number;
    let y: number;
    if (pp <= 0) {
      x = origin.x + q.x;
      y = origin.y + q.y;
    } else {
      const w = sheetPos(s, pp, anchor, origin);
      x = w.x;
      y = w.y;
    }
    d += (pen ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
    pen = true;
  }
  return (
    <g opacity={opacity}>
      {glow && <path d={d} fill="none" stroke={glow} strokeWidth={width * 3.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={0.35} />}
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} vectorEffect="non-scaling-stroke" />
    </g>
  );
};

// --------------------------------------------------------------------------------------------- page face
const blob = (cx: number, cy: number, rx: number, ry: number, seed: number) => {
  let d = '';
  const n = 22;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + 0.22 * noise1(i * 0.9, seed) + 0.1 * noise1(i * 2.7, seed + 9);
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rx * k).toFixed(1) + ' ' + (cy + Math.sin(a) * ry * k).toFixed(1);
  }
  return d + 'Z';
};
export const HOLE_PATHS = LAYOUT.holes.map((h) => ({...h, d: blob(h.s, h.v, h.rx, h.ry, h.seed)}));

export type PageProps = {
  id: string;
  anchor: Anchor;
  s0?: number;
  s1?: number;
  open?: number; // 0 = edge-on line, 1 = full face
  ink?: number; // visibility of the ink (1 = scholar-facing rendering)
  faint?: number; // raw-scan ink visibility (almost blank)
  glyphAlpha?: (g: Glyph) => number; // overrides ink per glyph (the ink-model reveal)
  quote?: number; // highlight of the quoted lines in column 19
  view?: [number, number]; // world-x range on screen (culling)
  surface?: string;
  fibers?: number;
  holes?: number;
  outline?: number;
};

export const PageFace: React.FC<PageProps> = ({
  id,
  anchor,
  s0 = 0,
  s1 = 5800,
  open = 1,
  ink = 1,
  faint = 0,
  glyphAlpha,
  quote = 0,
  view,
  surface = K.sheet,
  fibers = 1,
  holes = 1,
  outline = 1,
}) => {
  if (open <= 0.001) return null;
  // page-space culling
  let a = s0;
  let b = s1;
  if (view) {
    a = Math.max(a, view[0] - anchor.x + anchor.s - 40);
    b = Math.min(b, view[1] - anchor.x + anchor.s + 40);
  }
  if (b <= a) return null;
  const step = Math.max(4, (b - a) / 500);
  let top = '';
  let bot = '';
  for (let s = a; s <= b + 0.01; s += step) {
    top += (top ? 'L' : 'M') + s.toFixed(1) + ' ' + topEdge(s).toFixed(1);
  }
  for (let s = b; s >= a - 0.01; s -= step) bot += 'L' + s.toFixed(1) + ' ' + bottomEdge(s).toFixed(1);
  const shape = top + bot + 'Z';
  const glyphs = LAYOUT.glyphs.filter((g) => g.s > a - 20 && g.s < b + 20);
  const hp = HOLE_PATHS.filter((h) => h.s + h.rx > a && h.s - h.rx < b);
  return (
    <g transform={`translate(${anchor.x - anchor.s} ${anchor.y}) scale(1 ${open})`}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={shape} />
        </clipPath>
        <pattern id={`${id}-fib`} width={60} height={7} patternUnits="userSpaceOnUse">
          <rect width={60} height={7} fill="none" />
          <line x1={0} y1={2} x2={60} y2={2.4} stroke={K.sheetLo} strokeWidth={0.9} opacity={0.5} />
          <line x1={10} y1={5.5} x2={48} y2={5.2} stroke={K.sheetHi} strokeWidth={0.7} opacity={0.6} />
        </pattern>
      </defs>
      <path d={shape} fill={surface} />
      <g clipPath={`url(#${id}-clip)`}>
        {fibers > 0 && <rect x={a} y={-PH} width={b - a} height={PH * 2} fill={`url(#${id}-fib)`} opacity={fibers} />}
        {glyphs.map((g, i) => {
          const base = glyphAlpha ? glyphAlpha(g) : ink;
          const al = Math.max(faint, base) * (g.unc ? 0.62 : 1);
          if (al <= 0.003) return null;
          const q = quote * (g.col === 19 && (g.line === 10 || g.line === 11) ? 1 : 0);
          if (g.trace) {
            const r0 = hash(i, 3);
            return <path key={i} d={`M${g.s + 2} ${g.v - 6 - r0 * 4} q4 ${-3 - r0 * 3} ${6 + r0 * 3} ${1 + r0 * 2}`} fill="none" stroke={K.inkGreek} strokeWidth={1.6} strokeLinecap="round" opacity={al * 0.55} />;
          }
          const rot = (hash(i, 7) - 0.5) * 6;
          return (
            <text
              key={i}
              x={g.s + ADV / 2}
              y={g.v}
              textAnchor="middle"
              fontFamily={FONT_GREEK}
              fontWeight={500}
              fontSize={FS}
              fill={q > 0 ? (q > 0.5 ? '#000' : K.inkGreek) : K.inkGreek}
              opacity={al}
              transform={`rotate(${rot.toFixed(1)} ${g.s + ADV / 2} ${g.v - 5})`}
            >
              {g.ch}
            </text>
          );
        })}
        {holes > 0 && hp.map((h, i) => <path key={i} d={h.d} fill={K.void} opacity={holes} />)}
      </g>
      {outline > 0 && <path d={shape} fill="none" stroke={K.ink} strokeOpacity={0.55 * outline} strokeWidth={2} vectorEffect="non-scaling-stroke" />}
    </g>
  );
};

/** soft highlight band behind the quoted lines (page space) */
export const quoteBox = () => {
  const gs = LAYOUT.glyphs.filter((g) => g.col === 19 && (g.line === 10 || g.line === 11));
  const x0 = Math.min(...gs.map((g) => g.s)) - 6;
  const x1 = Math.max(...gs.map((g) => g.s)) + ADV + 4;
  const y0 = Math.min(...gs.map((g) => g.v)) - FS - 3;
  const y1 = Math.max(...gs.map((g) => g.v)) + 6;
  return {x0, x1, y0, y1};
};
