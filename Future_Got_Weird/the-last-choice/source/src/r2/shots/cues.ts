// Sound cues from the section modules (film seconds; see src/film/cue.ts for the fields). Pure data, no React.
import type {Cue} from '../../film/cue';
import {CUES_A} from './A/cues';
import {CUES_B} from './B/cues';
import {CUES_C} from './C/cues';
import {CUES_D1} from './D1/cues';
import {CUES_D2} from './D2/cues';
import {CUES_D3} from './D3/cues';
import {CUES_D4} from './D4/cues';
import {CUES_EF} from './EF/cues';

export const SECTION_CUES: Cue[] = [...CUES_A, ...CUES_B, ...CUES_C, ...CUES_D1, ...CUES_D2, ...CUES_D3, ...CUES_D4, ...CUES_EF];
