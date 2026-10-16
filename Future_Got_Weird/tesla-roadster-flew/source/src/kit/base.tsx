import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F} from '../theme';

/** Warm paper ground with a faint fibre texture (no grids). */
export const Paper: React.FC<{tint?: string; children?: React.ReactNode}> = ({tint = C.paper, children}) => (
  <AbsoluteFill style={{background: tint}}>
    <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.5}}>
      <filter id="paperGrain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.25  0 0 0 0.10 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paperGrain)" />
    </svg>
    {children}
  </AbsoluteFill>
);

/** Small corner chip. kind: 'illus' = original explanatory art, 'source' = attribution, 'demo' = Tesla demo label. */
export const Chip: React.FC<{text: string; kind?: 'illus' | 'source' | 'demo' | 'warn'; size?: number; style?: React.CSSProperties}> = ({
  text, kind = 'illus', size = 30, style,
}) => {
  const pal = {
    illus: {bg: C.blueLight, fg: C.blueDeep, bd: C.blueDeep},
    source: {bg: 'rgba(250,243,223,0.92)', fg: C.ink, bd: C.ink},
    demo: {bg: C.saffronLight, fg: C.ink, bd: C.ink},
    warn: {bg: C.coralLight, fg: C.coralDeep, bd: C.coralDeep},
  }[kind];
  return (
    <div
      style={{
        display: 'inline-block', fontFamily: F.body, fontWeight: 800, fontSize: size, letterSpacing: 0.5,
        color: pal.fg, background: pal.bg, border: `3px solid ${pal.bd}`, borderRadius: size * 0.5,
        padding: `${size * 0.18}px ${size * 0.55}px`, whiteSpace: 'nowrap', ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Arrow shape for SVG diagrams: from (x1,y1) to (x2,y2), shaft width w, head size h. */
export const Arrow: React.FC<{x1: number; y1: number; x2: number; y2: number; w?: number; h?: number; fill: string; stroke?: string; opacity?: number}> = ({
  x1, y1, x2, y2, w = 26, h = 56, fill, stroke = C.ink, opacity = 1,
}) => {
  const dx = x2 - x1, dy = y2 - y1;
  const L = Math.max(1, Math.hypot(dx, dy));
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const hh = Math.min(h, L * 0.6);
  const bx = x2 - ux * hh, by = y2 - uy * hh;
  const p = [
    [x1 + nx * w / 2, y1 + ny * w / 2], [bx + nx * w / 2, by + ny * w / 2], [bx + nx * hh * 0.62, by + ny * hh * 0.62], [x2, y2],
    [bx - nx * hh * 0.62, by - ny * hh * 0.62], [bx - nx * w / 2, by - ny * w / 2], [x1 - nx * w / 2, y1 - ny * w / 2],
  ];
  return <path d={'M' + p.map((q) => q.map((v) => v.toFixed(1)).join(',')).join(' L') + ' Z'} fill={fill} stroke={stroke} strokeWidth={5} strokeLinejoin="round" opacity={opacity} />;
};
