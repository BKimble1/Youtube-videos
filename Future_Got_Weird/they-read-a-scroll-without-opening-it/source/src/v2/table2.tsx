import React from 'react';
import {TM} from '../lib/time';
import {SeqH} from '../scenes/SeqH';
import {A2} from './A2';
import {B2} from './B2';
import {C2, C2_END} from './C2';
import {D2} from './D2';
import {F2} from './F2';
import {G2} from './G2';

export type Scene2 = {id: string; start: number; C: React.FC<{f: number}>};
export const SCENES2: Scene2[] = [
  {id: 'A2 macro to digital', start: 0, C: A2},
  {id: 'B2 eruption and damage', start: TM.book, C: B2},
  {id: 'C2 scan', start: TM.look - 0.85, C: C2},
  {id: 'D2 inside the coil', start: C2_END, C: D2},
  {id: 'F2 flatten and ink', start: TM.gave, C: F2},
  {id: 'G2 second scroll', start: TM.checked - 0.15, C: G2},
  {id: 'H (V1)', start: TM.back - 0.1, C: SeqH},
];
