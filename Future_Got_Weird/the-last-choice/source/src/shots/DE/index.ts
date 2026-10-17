// Shot group DE: components keyed by shot id (see src/film/timing.ts) and their sound cues.
import React from 'react';
import {Cue} from '../../film/cue';
import D1 from './D1';
import D2 from './D2';
import D3 from './D3';
import D4 from './D4';
import D5 from './D5';
import T1 from './T1';
import E1 from './E1';
import E2 from './E2';
import E3 from './E3';
import E4 from './E4';
import E5 from './E5';
import E6 from './E6';

export const SHOTS_DE: Record<string, React.FC> = {D1, D2, D3, D4, D5, E1, E2, E3, E4, E5, E6, T1};
export const CUES_DE: Cue[] = [];
