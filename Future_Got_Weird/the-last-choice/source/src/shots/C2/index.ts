// Shot group C2: components keyed by shot id (see src/film/timing.ts) and their sound cues.
import React from 'react';
import {Cue} from '../../film/cue';
import {C9} from './C9';
import {C10} from './C10';
import {C11} from './C11';
import {C12} from './C12';
import {C13} from './C13';

export const SHOTS_C2: Record<string, React.FC> = {C9, C10, C11, C12, C13};
export const CUES_C2: Cue[] = [];
