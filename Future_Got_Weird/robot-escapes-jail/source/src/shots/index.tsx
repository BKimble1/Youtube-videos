// The shot table. Each shot is React.FC<{t: number}> (t = film seconds) that draws the WHOLE 1080x1920 frame.
import React from 'react';
import {ShotId} from '../story';
import {CapBox} from '../Captions';
import {S1} from './S1Hook';
import {S2, S3, S4} from './S2to4';
import {S5} from './S5Lab';
import {S6} from './S6Science';
import {S7} from './S7Medical';
import {S8} from './S8Loop';

export const Placeholder = (label: string): React.FC<{t: number}> => ({t}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <rect width={1080} height={1920} fill="#13223A" />
    <text x={540} y={960} fill="#46E6FF" fontSize={80} textAnchor="middle" fontFamily="monospace">{label} {t.toFixed(2)}</text>
  </svg>
);


export const SHOT_VIEWS: Record<ShotId, React.FC<{t: number}>> = {S1, S2, S3, S4, S5, S6, S7, S8};

/** caption box per caption index (see data/timeline.json captions). Default: the top band (centre y 330, x 110-870). */
const CAP: Record<number, CapBox> = {
  // S1: the guard (face, cup hand) owns the right half; the wall left of him, above the robot, is empty
  0: {y: 560, left: 30, width: 570}, 1: {y: 560, left: 30, width: 570},
  // S8 "can't stop a robot anymore": the guard's head crosses the top band as he looks down; the floor below the droplet is empty
  27: {y: 1360},
};
export const capBox = (i: number): CapBox => CAP[i] ?? {y: 330};
