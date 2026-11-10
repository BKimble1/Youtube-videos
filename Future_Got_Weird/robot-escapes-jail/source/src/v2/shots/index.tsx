// V2 shot table (director-owned). Each shot is React.FC<{t: number}> (t = FILM seconds) drawing the whole 1080x1920 frame.
import React from 'react';
import {ShotId2} from '../story2';
import {CapBox} from '../../Captions';
import {H1, J1} from './HookLoop';
import {LB} from './LabEscape';
import {MS} from './MoldScience';
import {FU} from './Future';

export const Placeholder = (label: string): React.FC<{t: number}> => ({t}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <rect width={1080} height={1920} fill="#13223A" />
    <text x={540} y={960} fill="#46E6FF" fontSize={80} textAnchor="middle" fontFamily="monospace">{label} {t.toFixed(2)}</text>
  </svg>
);

export const SHOT_VIEWS2: Record<ShotId2, React.FC<{t: number}>> = {H1, LB, MS, FU, J1};

/** caption box per caption index (src/data/timeline.json captions). Default: top band, centre y 330, x 110-870. */
const CAP: Record<number, CapBox> = {
  0: {y: 262},    // H1: the robot's dome top is at y 369 on frame 0; keep the band above it
  11: {y: 1380},  // MS collect: the cage bars and the gloved hand's wrist fill the upper half
  12: {y: 300},
  27: {y: 270},   // J1 "can't stop a robot anymore": the dome top climbs to y 371 by the last frame
};
export const capBox2 = (i: number): CapBox => CAP[i] ?? {y: 330};
