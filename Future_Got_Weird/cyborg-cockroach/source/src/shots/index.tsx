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
const REG: Record<string, React.FC<ShotProps>> = {S01};

export const SHOTS: Shot[] = SHOT_FRAMES.map(([id, from], i) => ({id, from, to: i + 1 < SHOT_FRAMES.length ? SHOT_FRAMES[i + 1][1] : FRAMES, C: REG[id] ?? Placeholder(id)}));
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.from && f < s.to) ?? SHOTS[SHOTS.length - 1];
