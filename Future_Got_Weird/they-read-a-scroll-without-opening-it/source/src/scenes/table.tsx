import React from 'react';
import {TM} from '../lib/time';
import {SeqA} from './SeqA';
import {SeqB} from './SeqB';
import {SeqC} from './SeqC';
import {SeqSheet} from './SeqSheet';
import {SeqG} from './SeqG';
import {SeqH} from './SeqH';

export type Scene = {id: string; start: number; C: React.FC<{f: number}>};
export const SCENES: Scene[] = [
  {id: 'A proof first', start: 0, C: SeqA},
  {id: 'B damage', start: TM.book + 0.25, C: SeqB},
  {id: 'C scan', start: TM.look - 0.85, C: SeqC},
  {id: 'D-F sheet', start: TM.spiral + 0.05, C: SeqSheet},
  {id: 'G second scroll', start: TM.checked - 0.15, C: SeqG},
  {id: 'H reading', start: TM.back - 0.1, C: SeqH},
];
export const SCENE_IDS = () => SCENES.map((s) => ({id: s.id, start: s.start}));
void TM;
