// The shot table. Each shot is React.FC<{t: number}> (t = film seconds) that draws the WHOLE 1080x1920 frame.
import React from 'react';
import {ShotId} from '../story';
import {capIndex} from '../Captions';

const Placeholder = (label: string): React.FC<{t: number}> => ({t}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <rect width={1080} height={1920} fill="#13223A" />
    <text x={540} y={960} fill="#46E6FF" fontSize={80} textAnchor="middle" fontFamily="monospace">{label} {t.toFixed(2)}</text>
  </svg>
);

export const SHOT_VIEWS: Record<ShotId, React.FC<{t: number}>> = {
  S1: Placeholder('S1'), S2: Placeholder('S2'), S3: Placeholder('S3'), S4: Placeholder('S4'),
  S5: Placeholder('S5'), S6: Placeholder('S6'), S7: Placeholder('S7'), S8: Placeholder('S8'),
};

/** caption centre y (px) per caption index; default top zone */
export const capY = (i: number) => 330;
void capIndex;
