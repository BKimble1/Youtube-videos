// Section EF shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
// The aftermath state these shots hold is defined in ./tableau.ts (pure; D4 ends on it).
import type {R2Shot} from '../../film/registry';
import {M} from '../../timing';
import {EF_SHOTS} from './shots';

export const SHOTS_EF: R2Shot[] = [
  {id: 'E1', sec: 'E', start: M.FINAL_HIT, end: EF_SHOTS.CLASP_IN, note: 'close, low: the drone pilot reaches him and takes his hand; his eyes find her', C: EF_SHOTS.E1},
  {id: 'E1_clasp', sec: 'E', start: EF_SHOTS.CLASP_IN, end: M.RING_END, note: 'insert: his grip loosens in her hands', C: EF_SHOTS.E1Clasp},
  {id: 'E2', sec: 'E', start: M.RING_END, end: M.RADIO_CLICK - 0.6, note: 'extreme close: the last breath, the eyes close, stillness', C: EF_SHOTS.E2},
  {id: 'F1', sec: 'F', start: M.RADIO_CLICK - 0.6, end: M.CREDITS_IN, note: 'one move: his face → the radio (click, trumpet) → the rising pullback to the fallen city', C: EF_SHOTS.F1},
];
