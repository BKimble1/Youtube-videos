// Section A shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
// The title card (A_title, 6.60–9.30) is registered in src/r2/film/registry.ts.
import type {R2Shot} from '../../film/registry';
import {AerialA1} from './Aerial';
import {M} from '../../timing';

export const SHOTS_A: R2Shot[] = [
  {id: 'A1_aerial', sec: 'A', start: 0, end: M.TITLE_IN, note: 'dusk aerial; formations stream west; the tower fails on LOW_HIT', C: AerialA1},
];
