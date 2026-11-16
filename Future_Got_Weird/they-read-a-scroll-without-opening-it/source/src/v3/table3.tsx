import React from 'react';
import {TM} from '../lib/time';
import {H3} from './H3';
import {A3} from './A3';
import {B3} from './B3';
import {C3, C3_END} from './C3';
import {D3} from './D3';
import {F3} from './F3';
import {G3} from './G3';

export type Scene3 = {id: string; start: number; C: React.FC<{f: number}>};
export const SCENES3: Scene3[] = [
  {id: 'A3 macro to digital', start: 0, C: A3},
  {id: 'B3 eruption and damage', start: TM.book, C: B3},
  {id: 'C3 scan', start: TM.look - 0.45, C: C3},
  {id: 'D3 inside the coil', start: C3_END, C: D3},
  {id: 'F3 flatten and ink', start: TM.gave, C: F3},
  {id: 'G3 second scroll', start: TM.checked - 0.15, C: G3},
  {id: 'H3 reading and callback', start: TM.back - 0.1, C: H3},
];
