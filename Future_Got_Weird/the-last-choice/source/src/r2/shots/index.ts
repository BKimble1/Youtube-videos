// Section shot modules register their shots here (film seconds). Each section owns its folder src/r2/shots/<SEC>/
// and exports SHOTS_<SEC>: R2Shot[] from index.ts (see src/r2/film/registry.ts); its sound cues are in ./cues.ts.
import type {R2Shot} from '../film/registry';
import {SHOTS_A} from './A';
import {SHOTS_B} from './B';
import {SHOTS_C} from './C';
import {SHOTS_D1} from './D1';
import {SHOTS_D2} from './D2';
import {SHOTS_D3} from './D3';
import {SHOTS_D4} from './D4';
import {SHOTS_EF} from './EF';

export const SECTION_SHOTS: R2Shot[] = [...SHOTS_A, ...SHOTS_B, ...SHOTS_C, ...SHOTS_D1, ...SHOTS_D2, ...SHOTS_D3, ...SHOTS_D4, ...SHOTS_EF];
