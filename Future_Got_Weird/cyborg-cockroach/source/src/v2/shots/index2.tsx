// V2 shot table: each shot is a pure function of the film frame f (local frame lf of n frames).
import React from 'react';
import {SHOTS2, FRAMES2} from '../cuts2';

export type ShotProps = {f: number; lf: number; n: number};
export type Shot2 = {id: string; from: number; to: number; C: React.FC<ShotProps>};

const Placeholder = (id: string): React.FC<ShotProps> => ({lf, n}) => (
  <div style={{position: 'absolute', inset: 0, background: '#24343F', color: '#9FB3BF', fontFamily: 'monospace', fontSize: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
    <div>{id}</div>
    <div style={{fontSize: 40}}>{`${lf}/${n}`}</div>
  </div>
);

// built shots register here
const REG: Record<string, React.FC<ShotProps>> = {};
export const registerShots = (m: Record<string, React.FC<ShotProps>>) => Object.assign(REG, m);

export const SHOTS2_TABLE = () => SHOTS2.map(([id, from], i) => ({id, from, to: i + 1 < SHOTS2.length ? SHOTS2[i + 1][1] : FRAMES2, C: REG[id] ?? Placeholder(id)}));
export const shotAt2 = (f: number) => {
  const t = SHOTS2_TABLE();
  return t.find((s) => f >= s.from && f < s.to) ?? t[t.length - 1];
};
