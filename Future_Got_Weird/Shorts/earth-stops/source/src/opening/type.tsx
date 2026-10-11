import React from 'react';
import {C} from '../theme';
import {HED_FONT} from '../fonts4';

/** Barlow Condensed ExtraBold, uppercase, one limited hard shadow (offset, no blur). Copied verbatim from the Atlas V4 type system (src/v4/type.tsx `Hed`). */
export type HedProps = {
  x?: number; y: number; text: string; size?: number; anchor?: 'start' | 'middle' | 'end'; color?: string; shadow?: string | null;
  sx?: number; sy?: number; opacity?: number; ls?: number;
};
export const Hed: React.FC<HedProps> = ({x = 540, y, text, size = 150, anchor = 'middle', color = C.ink, shadow = C.coral, sx = 1, sy = 1, opacity = 1, ls = 2}) => {
  const off = Math.max(4, Math.round(size * 0.04));
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`} opacity={opacity} fontFamily={HED_FONT} fontWeight={800} fontSize={size} letterSpacing={ls} textAnchor={anchor} strokeLinejoin="round">
      {shadow && (
        <text x={off} y={off} dy="0.36em" fill={shadow} stroke={shadow} strokeWidth={off * 0.6}>{text}</text>
      )}
      <text x={0} y={0} dy="0.36em" fill={color} stroke={color} strokeWidth={size * 0.012}>{text}</text>
    </g>
  );
};
