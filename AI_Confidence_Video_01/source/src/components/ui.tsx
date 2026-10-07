import React from 'react';
import {C, F} from '../theme';

/** Small uppercase label chip. `tone` controls colour; text always states the meaning. */
export const Tag: React.FC<{
  children: React.ReactNode;
  tone?: 'teal' | 'coral' | 'slate' | 'paper';
  dashed?: boolean;
  size?: number;
  style?: React.CSSProperties;
}> = ({children, tone = 'slate', dashed, size = 22, style}) => {
  const col = tone === 'teal' ? C.teal : tone === 'coral' ? C.coral : tone === 'paper' ? C.inkDim : C.muted;
  const bg = tone === 'teal' ? C.tealDim : tone === 'coral' ? C.coralDim : 'rgba(133,146,168,0.10)';
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: `${size * 0.32}px ${size * 0.7}px`,
        borderRadius: 999,
        border: `${dashed ? '1.5px dashed' : '1.5px solid'} ${col}`,
        background: bg,
        color: col,
        fontFamily: F.sans,
        fontWeight: 650,
        fontSize: size,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Source line shown at bottom-left whenever evidence is on screen. */
export const SourceLine: React.FC<{children: React.ReactNode; opacity?: number; dark?: boolean}> = ({children, opacity = 1, dark}) => (
  <div
    style={{
      position: 'absolute',
      left: 72,
      bottom: 52,
      maxWidth: 1500,
      fontFamily: F.sans,
      fontSize: 22,
      lineHeight: 1.35,
      color: dark ? C.inkDim : C.muted,
      opacity,
      letterSpacing: '0.01em',
    }}
  >
    {children}
  </div>
);

/** Large headline text in the house style. */
export const Headline: React.FC<{children: React.ReactNode; size?: number; style?: React.CSSProperties; color?: string}> = ({
  children,
  size = 84,
  style,
  color = C.text,
}) => (
  <div
    style={{
      fontFamily: F.sans,
      fontWeight: 720,
      fontSize: size,
      lineHeight: 1.08,
      letterSpacing: '-0.025em',
      color,
      ...style,
    }}
  >
    {children}
  </div>
);
