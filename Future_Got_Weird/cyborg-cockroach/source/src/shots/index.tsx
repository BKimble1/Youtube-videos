// Shot table: each shot is a pure function of the film frame f (and its local frame lf of n frames).
import React from 'react';
import {SHOT_FRAMES} from '../cuts';
import {FRAMES} from '../timeline';

export type ShotProps = {f: number; lf: number; n: number};
export type Shot = {id: string; from: number; to: number; C: React.FC<ShotProps>};

const Placeholder = (id: string): React.FC<ShotProps> => ({lf, n}) => (
  <div style={{position: 'absolute', inset: 0, background: '#24343F', color: '#9FB3BF', fontFamily: 'monospace', fontSize: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
    <div>{id}</div>
    <div style={{fontSize: 40}}>{`${lf}/${n}`}</div>
  </div>
);

// built shots (the rest show a labelled placeholder until they exist)
import {S01} from './S01';
import {S02} from './S02';
import {S03} from './S03';
import {S04} from './S04';
import {S06} from './S06';
import {S07} from './S07';
import {S08} from './S08';
import {S09} from './S09';
import {S10} from './S10';
import {S11} from './S11';
import {S12Film as S12} from './S12Film';
import {S13} from './S13';
import {S14} from './S14';
import {S15} from './S15';
const REG: Record<string, React.FC<ShotProps>> = {S01, S02, S03, S04, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15};

export const SHOTS: Shot[] = SHOT_FRAMES.map(([id, from], i) => ({id, from, to: i + 1 < SHOT_FRAMES.length ? SHOT_FRAMES[i + 1][1] : FRAMES, C: REG[id] ?? Placeholder(id)}));
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];
