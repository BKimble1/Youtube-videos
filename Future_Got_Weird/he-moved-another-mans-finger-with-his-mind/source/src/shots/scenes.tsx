// Sequence table on the measured narration (start times come from the words, never from estimates).
import React from 'react';
import {T} from '../lib/core';
import {Hook} from './S1Hook';
import {S2} from './S2Setup';
import {S3} from './S3Route';
import {S4} from './S4Pilot';
import {S5} from './S5Control';
import {S6} from './S6BrainNet';
import {S7} from './S7Trust';

export type Scene = {id: string; start: () => number; C: React.FC<{f: number}>};
export const SCENES: Scene[] = [
  {id: 'S1 hook + campus', start: () => 0, C: Hook},
  {id: 'S2 setup + game', start: () => T('Rajesh Rao got the screen') - 0.35, C: S2},
  {id: 'S3 route', start: () => T('Watch what happens on a rocket') - 0.45, C: S3},
  {id: 'S4 pilot report', start: () => T('There’s a detail I love') - 0.5, C: S4},
  {id: 'S5 2014', start: () => T('A year later') - 0.55, C: S5},
  {id: 'S6 BrainNet', start: () => T('Then the researchers gave') - 0.5, C: S6},
  {id: 'S7 trust + ending', start: () => T('Here’s where I’d start') - 0.45, C: S7},
];
