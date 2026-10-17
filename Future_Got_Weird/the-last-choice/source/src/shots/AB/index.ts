// Shot group AB: components keyed by shot id (see src/film/timing.ts) and their sound cues.
import React from 'react';
import {Cue} from '../../film/cue';
import {A1, CUES_A1} from './A1';
import {A2, CUES_A2} from './A2';
import {A3, CUES_A3} from './A3';
import {A4, CUES_A4} from './A4';
import {A5, CUES_A5} from './A5';
import {B1, CUES_B1} from './B1';
import {B2, CUES_B2} from './B2';
import {B3, CUES_B3} from './B3';
import {B4, CUES_B4} from './B4';
import {B5, CUES_B5} from './B5';
import {B6, CUES_B6} from './B6';

export const SHOTS_AB: Record<string, React.FC> = {A1, A2, A3, A4, A5, B1, B2, B3, B4, B5, B6};
export const CUES_AB: Cue[] = [...CUES_A1, ...CUES_A2, ...CUES_A3, ...CUES_A4, ...CUES_A5, ...CUES_B1, ...CUES_B2, ...CUES_B3, ...CUES_B4, ...CUES_B5, ...CUES_B6];
