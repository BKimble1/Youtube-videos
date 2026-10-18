// Section EF shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
// The aftermath state these shots hold is defined in ./tableau.ts (pure; D4 ends on it).
import type {R2Shot} from '../../film/registry';
import {M} from '../../timing';
import {EF_SHOTS} from './shots';

export const SHOTS_EF: R2Shot[] = [
  {id: 'E1', sec: 'E', start: M.FINAL_HIT, end: EF_SHOTS.CLASP_IN, note: 'close, low: the drone pilot reaches him and takes his hand; his eyes find her (the radio behind her on the van floor: a faint standby light)', C: EF_SHOTS.E1},
  {id: 'E1_clasp', sec: 'E', start: EF_SHOTS.CLASP_IN, end: M.RING_END, note: 'insert: his grip loosens in her hands', C: EF_SHOTS.E1Clasp},
  {id: 'E2', sec: 'E', start: M.RING_END, end: EF_SHOTS.F1_IN, note: 'extreme close: the last breath, the eyes close, stillness', C: EF_SHOTS.E2},
  // F1 starts on E2's own framing (his still face; same camera, same scene: no visible cut) and leaves it at once
  {id: 'F1', sec: 'F', start: EF_SHOTS.F1_IN, end: M.CARD_IN, note: 'one move: his still face → the unattended radio (its dial flutters with the static, the song catches) → the rising pullback over the held Crew and the machines securing the city', C: EF_SHOTS.F1},
];
