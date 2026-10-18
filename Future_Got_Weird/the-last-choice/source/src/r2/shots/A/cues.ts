// Section A sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs).
// The tower collapse itself is a global cue (src/r2/sound.ts, tower_collapse at LOW_HIT); beds carry wind/fire/battle.
// R3: the three damage events of A1 (world/plan.ts A1_EVENTS; shots/A/Aerial.tsx). All far (dist 0.85–0.95) and kept
// under the score: the opening's low hit and the tower stay the loudest things. Pan = the event's screen x (−1..1).
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';

export const CUES_A: Cue[] = [
  // the first structural failure: a far, low thud under the collapse sweep (tower is east-north-east, right of centre)
  {t: M.LOW_HIT, kind: 'sub_boom', gain: -4, pan: -0.3, dist: 0.9},
  // E1 1.30: FN10's west wall tears at the top (left of centre), 1.80 breaks off at its base and falls; the three
  // pieces land below the frame at 5.11 / 5.29 / 5.45 (one muffled slam + the rubble settling)
  {t: 1.3, kind: 'metal_tear', gain: -6, pan: -0.15, dist: 0.85},
  {t: 1.8, kind: 'rubble_shift', gain: -4, pan: -0.17, dist: 0.85},
  {t: 5.11, kind: 'wreck_slam', gain: -8, pan: -0.25, dist: 0.95},
  {t: 5.3, kind: 'debris_rain', gain: -6, pan: -0.25, dist: 0.95},
  // E2 2.90: two floors of FN11 blow out (just left of centre), glass rains onto the avenue
  {t: 2.9, kind: 'blast', gain: -7, pan: -0.04, dist: 0.88},
  {t: 2.97, kind: 'glass_shatter', gain: -4, pan: -0.04, dist: 0.85},
  // E3 5.60: the box truck's tank goes up among the columns (centre, far)
  {t: 5.6, kind: 'blast', gain: -9, pan: 0.04, dist: 0.92},
  {t: 5.64, kind: 'metal_tear', gain: -12, pan: 0.04, dist: 0.92},
  // the tower's upper section driving into its own dust: far debris rain, late in the shot, carried into the title
  {t: 4.6, kind: 'debris_rain', gain: -8, pan: -0.3, dist: 0.95},
];
