import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, F, OUTLINE} from '../theme';

/** Plain cream backdrop for every scene. */
export const Paper: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: C.paper, overflow: 'hidden'}}>{children}</AbsoluteFill>
);

/** Outlined cutout card with a hard drop shadow, like the rest of the channel's props. */
export const Card: React.FC<{
  x: number; y: number; w: number; h?: number; bg?: string; rot?: number; opacity?: number;
  children?: React.ReactNode; style?: React.CSSProperties;
}> = ({x, y, w, h, bg = C.white, rot = 0, opacity = 1, children, style}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, width: w, minHeight: h, height: h, boxSizing: 'border-box',
      background: bg, border: `${OUTLINE}px solid ${C.ink}`, borderRadius: 22,
      boxShadow: `10px 12px 0 ${C.shadow}`, transform: `rotate(${rot}deg)`, opacity, padding: 30,
      fontFamily: F.body, color: C.ink, ...style,
    }}
  >
    {children}
  </div>
);

/** Small label chip. Every illustrated or metaphorical element carries one of these where it could be mistaken for data. */
export const Tag: React.FC<{children: React.ReactNode; bg?: string; fg?: string; size?: number; x?: number; y?: number; opacity?: number; style?: React.CSSProperties}> = ({children, bg = C.saffron, fg = C.ink, size = 28, x, y, opacity = 1, style}) => (
  <div
    style={{
      position: x === undefined ? 'relative' : 'absolute', left: x, top: y, display: 'inline-block', opacity,
      background: bg, color: fg, border: `3px solid ${C.ink}`, borderRadius: 999, padding: '8px 22px',
      fontFamily: F.display, fontWeight: 700, fontSize: size, letterSpacing: 0.3, whiteSpace: 'nowrap', ...style,
    }}
  >
    {children}
  </div>
);

/** Large readable text. Used for every on-screen sentence; never scattered word-by-word. */
export const Line: React.FC<{children: React.ReactNode; x: number; y: number; w?: number; size?: number; color?: string; serif?: boolean; opacity?: number; style?: React.CSSProperties}> = ({children, x, y, w = 1200, size = 46, color = C.ink, serif, opacity = 1, style}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: serif ? F.serif : F.body, fontWeight: serif ? 400 : 700, fontSize: size, lineHeight: 1.28, color, opacity, ...style}}>
    {children}
  </div>
);

/** Saffron highlight that sweeps under text. p in 0..1. */
export const Sweep: React.FC<{p: number; children: React.ReactNode; color?: string}> = ({p, children, color = C.saffron}) => (
  <span style={{position: 'relative', display: 'inline-block'}}>
    <span style={{position: 'absolute', left: 0, bottom: '0.08em', height: '0.5em', width: `${Math.max(0, Math.min(1, p)) * 100}%`, background: color, zIndex: 0, borderRadius: 4}} />
    <span style={{position: 'relative', zIndex: 1}}>{children}</span>
  </span>
);

/** Check or cross glyph used beside evidence statements. */
export const Mark: React.FC<{ok: boolean; size?: number; x: number; y: number; opacity?: number; scale?: number}> = ({ok, size = 64, x, y, opacity = 1, scale = 1}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{position: 'absolute', left: x, top: y, opacity, transform: `scale(${scale})`}}>
    <circle cx="32" cy="32" r="28" fill={ok ? C.teal : C.coral} stroke={C.ink} strokeWidth="4" />
    {ok ? <path d="M18 33 L28 43 L46 22" fill="none" stroke={C.white} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M22 22 L42 42 M42 22 L22 42" stroke={C.white} strokeWidth="6" strokeLinecap="round" />}
  </svg>
);

/** A dashed-outline placeholder (end screen slots, unknown inner states). */
export const Dashed: React.FC<{x: number; y: number; w: number; h: number; r?: number; children?: React.ReactNode; opacity?: number}> = ({x, y, w, h, r = 24, children, opacity = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', border: `4px dashed ${C.inkSoft}`, borderRadius: r, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity, fontFamily: F.body, color: C.inkSoft}}>
    {children}
  </div>
);
