// V6 props held in hands (hand-local units, screen-upright when gripped).
import React from 'react';
import {INK} from '../v4/rig/cast4';

/** a paper coffee cup with a red band and a white lid, centred on the grip */
export const Cup: React.FC<{ol?: number}> = ({ol = 3}) => (
  <g transform="scale(0.68) translate(0 -6)">
    <path d="M -15 -30 L 15 -30 L 11.5 26 L -11.5 26 Z" fill="#FAF3DF" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
    <path d="M -14 -14 L 14 -14 L 12.6 4 L -12.6 4 Z" fill="#C0392B" />
    <path d="M -15 -30 L 15 -30 L 11.5 26 L -11.5 26 Z" fill="none" stroke={INK} strokeWidth={ol} strokeLinejoin="round" />
    <rect x={-18} y={-39} width={36} height={10} rx={4} fill="#FFFFFF" stroke={INK} strokeWidth={ol} />
  </g>
);
