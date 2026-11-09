// V2 shot table (director-owned). Each shot is React.FC<{t: number}> (t = FILM seconds) drawing the whole 1080x1920 frame.
import React from 'react';
import {ShotId2} from '../story2';
import {CapBox} from '../../Captions';

export const Placeholder = (label: string): React.FC<{t: number}> => ({t}) => (
  <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
    <rect width={1080} height={1920} fill="#13223A" />
    <text x={540} y={960} fill="#46E6FF" fontSize={80} textAnchor="middle" fontFamily="monospace">{label} {t.toFixed(2)}</text>
  </svg>
);

export const SHOT_VIEWS2: Record<ShotId2, React.FC<{t: number}>> = {
  H1: Placeholder('H1'), LB: Placeholder('LB'), MS: Placeholder('MS'), FU: Placeholder('FU'), J1: Placeholder('J1'),
};

/** caption box per caption index (src/data/timeline.json captions). Default: top band, centre y 330, x 110-870. */
const CAP: Record<number, CapBox> = {};
export const capBox2 = (i: number): CapBox => CAP[i] ?? {y: 330};
