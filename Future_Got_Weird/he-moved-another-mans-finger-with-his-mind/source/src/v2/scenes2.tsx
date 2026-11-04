// V2 sequence table on the same measured narration as V1 (the words and their times are unchanged).
import React from 'react';
import {T} from '../lib/core';
import {VA} from './SeqA';
import {VB} from './SeqB';
import {VC} from './SeqC';
import {VD} from './SeqD';
import {VE} from './SeqE';
import {VF} from './SeqF';
import {VG} from './SeqG';
export type Scene2 = {id: string; start: () => number; C: React.FC<{f: number}>};
export const SCENES2: Scene2[] = [
  {id: 'A', start: () => 0, C: VA},
  {id: 'B', start: () => T('Rajesh Rao got the screen') - 0.35, C: VB},
  {id: 'C', start: () => T('Watch what happens on a rocket') - 0.45, C: VC},
  {id: 'D', start: () => T('There’s a detail I love') - 0.5, C: VD},
  {id: 'E', start: () => T('A year later') - 0.55, C: VE},
  {id: 'F', start: () => T('Then the researchers gave') - 0.5, C: VF},
  {id: 'G', start: () => T('Here’s where I’d start') - 0.45, C: VG},
];
