import React from 'react';
import {C, F} from '../theme';

/** Big statement in the display face (Fredoka). */
export const Headline: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; weight?: number; align?: 'left' | 'center' | 'right'}> = ({children, size = 72, color = C.ink, style, weight = 600, align = 'center'}) => (
  <div style={{fontFamily: F.display, fontWeight: weight, fontSize: size, lineHeight: 1.08, letterSpacing: '-0.01em', color, textAlign: align, ...style}}>{children}</div>
);

/** Explanatory label (Nunito). */
export const Label: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; weight?: number; align?: 'left' | 'center' | 'right'}> = ({children, size = 34, color = C.inkSoft, style, weight = 700, align = 'left'}) => (
  <div style={{fontFamily: F.body, fontWeight: weight, fontSize: size, lineHeight: 1.25, color, textAlign: align, ...style}}>{children}</div>
);

/** Small pill tag: "illustrative", "published excerpt", dates. Text always states the meaning. */
export const Chip: React.FC<{children: React.ReactNode; tone?: 'ink' | 'teal' | 'coral' | 'saffron' | 'blue' | 'paper'; size?: number; style?: React.CSSProperties; dashed?: boolean}> = ({children, tone = 'ink', size = 24, style, dashed}) => {
  const map = {
    ink: {bg: C.ink, fg: C.paper, bd: C.ink},
    teal: {bg: C.teal, fg: C.white, bd: C.tealDeep},
    coral: {bg: C.coral, fg: C.white, bd: C.coralDeep},
    saffron: {bg: C.saffron, fg: C.ink, bd: C.saffronDeep},
    blue: {bg: C.blue, fg: C.white, bd: C.blueDeep},
    paper: {bg: C.cream, fg: C.inkSoft, bd: C.inkMuted},
  }[tone];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: `${size * 0.3}px ${size * 0.8}px`,
        borderRadius: 999,
        background: map.bg,
        color: map.fg,
        border: `3px ${dashed ? 'dashed' : 'solid'} ${map.bd}`,
        fontFamily: F.body,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        lineHeight: 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** A rectangular hand-lettered-looking sign (used on sets: "ANSWERS", "EVIDENCE", "RULES"). */
export const Sign: React.FC<{children: React.ReactNode; bg?: string; fg?: string; size?: number; style?: React.CSSProperties; rotate?: number; width?: number}> = ({children, bg = C.saffron, fg = C.ink, size = 40, style, rotate = 0, width}) => (
  <div
    style={{
      display: 'inline-block',
      width,
      padding: `${size * 0.35}px ${size * 0.9}px`,
      background: bg,
      color: fg,
      border: `4px solid ${C.ink}`,
      borderRadius: 14,
      boxShadow: `6px 6px 0 ${C.ink}`,
      fontFamily: F.display,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: '0.04em',
      textAlign: 'center',
      transform: `rotate(${rotate}deg)`,
      lineHeight: 1.1,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Serif quotation of a real document excerpt or an answer slip text. */
export const Serif: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties; italic?: boolean}> = ({children, size = 36, color = C.ink, style, italic}) => (
  <div style={{fontFamily: F.serif, fontSize: size, lineHeight: 1.3, color, fontStyle: italic ? 'italic' : 'normal', ...style}}>{children}</div>
);
