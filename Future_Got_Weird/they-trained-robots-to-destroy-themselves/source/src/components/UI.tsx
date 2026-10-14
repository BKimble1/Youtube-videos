import React from 'react';
import {C, F} from '../theme';

/** A full-frame SVG in world px (1920 x 1080) that lets content overflow (cameras can pan past the frame). */
export const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties; opacity?: number}> = ({children, style, opacity}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}} opacity={opacity}>
    {children}
  </svg>
);

/** The persistent label on reconstructed scenes. Large enough to read on a phone; never covers the action. */
export const IllusTag: React.FC<{text?: string; x?: number; y?: number; opacity?: number; tone?: 'paper' | 'blue' | 'ink'}> = ({text = 'ILLUSTRATION · not footage of the event', x = 48, y = 990, opacity = 1, tone = 'paper'}) => {
  const map = {paper: {bg: 'rgba(255,251,240,0.94)', fg: C.ink, bd: C.ink}, blue: {bg: C.blueLight, fg: C.blueDeep, bd: C.blueDeep}, ink: {bg: C.ink, fg: C.paper, bd: C.ink}}[tone];
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity, background: map.bg, color: map.fg, border: `3px solid ${map.bd}`, borderRadius: 999, padding: '8px 22px', fontFamily: F.body, fontWeight: 800, fontSize: 28, letterSpacing: 0.4, whiteSpace: 'nowrap'}}>
      {text}
    </div>
  );
};

export const Chip: React.FC<{children: React.ReactNode; tone?: 'ink' | 'teal' | 'coral' | 'saffron' | 'blue' | 'paper'; size?: number; style?: React.CSSProperties}> = ({children, tone = 'ink', size = 26, style}) => {
  const map = {
    ink: {bg: C.ink, fg: C.paper, bd: C.ink},
    teal: {bg: C.teal, fg: C.white, bd: C.tealDeep},
    coral: {bg: C.coral, fg: C.white, bd: C.coralDeep},
    saffron: {bg: C.saffron, fg: C.ink, bd: C.saffronDeep},
    blue: {bg: C.blue, fg: C.white, bd: C.blueDeep},
    paper: {bg: C.cream, fg: C.inkSoft, bd: C.inkMuted},
  }[tone];
  return (
    <span style={{display: 'inline-block', padding: `${size * 0.28}px ${size * 0.75}px`, borderRadius: 999, background: map.bg, color: map.fg, border: `3px solid ${map.bd}`, fontFamily: F.body, fontWeight: 800, fontSize: size, letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.05, ...style}}>
      {children}
    </span>
  );
};

/** Outlined card with the channel's hard shadow. Positioned absolutely; transform-friendly. */
export const Card: React.FC<{x: number; y: number; w: number; h?: number; bg?: string; rot?: number; opacity?: number; scale?: number; children?: React.ReactNode; style?: React.CSSProperties; pad?: number}> = ({x, y, w, h, bg = C.white, rot = 0, opacity = 1, scale = 1, children, style, pad = 34}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', background: bg, border: `4px solid ${C.ink}`, borderRadius: 24, boxShadow: `10px 12px 0 ${C.shadow}`, transform: `rotate(${rot}deg) scale(${scale})`, transformOrigin: '50% 50%', opacity, padding: pad, fontFamily: F.body, color: C.ink, ...style}}>
    {children}
  </div>
);

/** Highlighter sweep behind a span of text. p in 0..1 */
export const Sweep: React.FC<{p: number; children: React.ReactNode; color?: string}> = ({p, children, color = C.saffron}) => (
  <span style={{backgroundImage: `linear-gradient(${color}, ${color})`, backgroundRepeat: 'no-repeat', backgroundSize: `${Math.max(0, Math.min(1, p)) * 100}% 0.5em`, backgroundPosition: '0 88%', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{children}</span>
);

/** Round check / cross mark. */
export const Mark: React.FC<{ok: boolean; size?: number; x: number; y: number; opacity?: number; scale?: number}> = ({ok, size = 72, x, y, opacity = 1, scale = 1}) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{position: 'absolute', left: x, top: y, opacity, transform: `scale(${scale})`, overflow: 'visible'}}>
    <circle cx="32" cy="32" r="28" fill={ok ? C.teal : C.coral} stroke={C.ink} strokeWidth="4" />
    {ok ? <path d="M18 33 L28 43 L46 22" fill="none" stroke={C.white} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M22 22 L42 42 M42 22 L22 42" stroke={C.white} strokeWidth="6" strokeLinecap="round" />}
  </svg>
);

export const Headline: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; align?: 'left' | 'center' | 'right'}> = ({children, size = 64, color = C.ink, style, align = 'left'}) => (
  <div style={{fontFamily: F.display, fontWeight: 700, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.01em', color, textAlign: align, ...style}}>{children}</div>
);

/** A hand-drawn-style ring/arrow annotation in SVG world coords. */
export const Ring: React.FC<{x: number; y: number; rx: number; ry: number; p: number; color?: string; width?: number}> = ({x, y, rx, ry, p, color = C.coral, width = 6}) => {
  const L = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  return <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="none" stroke={color} strokeWidth={width} strokeDasharray={L} strokeDashoffset={L * (1 - Math.max(0, Math.min(1, p)))} strokeLinecap="round" transform={`rotate(-8 ${x} ${y})`} />;
};
