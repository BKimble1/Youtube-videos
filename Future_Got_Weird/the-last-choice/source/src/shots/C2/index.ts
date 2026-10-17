// Shot group C2 (the maintenance crossing): components keyed by shot id (see src/film/timing.ts) and their sound cues.
// All eight shots are cameras on one shared world timeline (world.ts, blocking.ts), so the crossing is continuous.
import React from 'react';
import {Cue} from '../../film/cue';
import {C9} from './C9';
import {C10} from './C10';
import {C11} from './C11';
import {C12} from './C12';
import {C13} from './C13';
import {C14} from './C14';
import {C15} from './C15';
import {C16} from './C16';
import {CUES} from './cues';

export const SHOTS_C2: Record<string, React.FC> = {C9, C10, C11, C12, C13, C14, C15, C16};
export const CUES_C2: Cue[] = CUES;
