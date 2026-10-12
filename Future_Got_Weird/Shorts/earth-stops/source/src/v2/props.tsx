import React from 'react';
import {C, OUTLINE} from '../theme';

export const COFFEE = '#33200F';
export const COFFEE_HI = '#B9824A';
/** mug geometry in the hand's local frame, before the world tilt (same coral ceramic mug as v1; the handle ring sits around the hand) */
export const MUG = {cx: 64, cy: -4, mouthY: -48, w: 72, h: 88};

/** Mug drawn in screen space at the hand (origin = hand), tilted `tilt` degrees clockwise in the world, scaled by sc. */
export const MugSide: React.FC<{tilt: number; sc: number}> = ({tilt, sc}) => {
  const x0 = MUG.cx - MUG.w / 2, y0 = MUG.cy - MUG.h / 2, x1 = x0 + MUG.w, y1 = y0 + MUG.h, taper = 7;
  return (
    <g transform={`rotate(${tilt}) scale(${sc})`}>
      <circle cx={8} cy={6} r={24} fill="none" stroke={C.ink} strokeWidth={17} />
      <circle cx={8} cy={6} r={24} fill="none" stroke={C.coralDeep} strokeWidth={9} />
      <path d={`M ${x0} ${y0} L ${x1} ${y0} L ${x1 - taper} ${y1 - 8} Q ${x1 - taper} ${y1} ${x1 - taper - 10} ${y1} L ${x0 + taper + 10} ${y1} Q ${x0 + taper} ${y1} ${x0 + taper} ${y1 - 8} Z`} fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
      <path d={`M ${x0 + 10} ${y0 + 14} L ${x0 + 17} ${y1 - 16}`} stroke={C.coralLight} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
      <ellipse cx={MUG.cx} cy={y0} rx={MUG.w / 2} ry={13} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      <ellipse cx={MUG.cx} cy={y0 + 1} rx={MUG.w / 2 - 7} ry={9} fill={COFFEE} />
    </g>
  );
};
