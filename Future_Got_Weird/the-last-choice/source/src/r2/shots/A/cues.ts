// Section A sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs).
// The tower collapse itself is a global cue (src/r2/sound.ts, tower_collapse at LOW_HIT); beds carry wind/fire/battle.
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';

export const CUES_A: Cue[] = [
  // the first structural failure: a far, low thud under the collapse sweep (tower is east-north-east, right of centre)
  {t: M.LOW_HIT, kind: 'sub_boom', gain: -4, pan: -0.3, dist: 0.9},
  // the upper section driving into its own dust: far debris rain, late in the shot, carried into the title by its tail
  {t: 4.6, kind: 'debris_rain', gain: -8, pan: -0.3, dist: 0.95},
];
