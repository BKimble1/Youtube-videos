// Section D2 shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
// One battle (crew.tsx: the Crew; machines.ts: the machines; fx.tsx: smoke, light, contacts) sampled by every camera.
import type {R2Shot} from '../../film/registry';
import {M} from '../../timing';
import {D2_1, D2_2a, D2_2b, D2_3a, D2_3b, D2_3c} from './Ingenuity';
import {D2_4, D2_5, D2_6, D2_7a, D2_7b} from './Flank';

export const SHOTS_D2: R2Shot[] = [
  {id: 'D2-1', sec: 'D2', start: M.P2, end: M.DECOY, note: 'the flare carrier rises, pulls the pins and lobs two smoke canisters over the slab into the crater', C: D2_1},
  {id: 'D2-2a', sec: 'D2', start: M.DECOY, end: 97.55, note: 'insert: her finger sketches four walking figures on the battered tablet and taps', C: D2_2a},
  {id: 'D2-2b', sec: 'D2', start: 97.55, end: M.DECOY_HITa, note: 'wide: the tablet set on the slab, the projector clicks on; giant walking light-figures appear on the white smoke', C: D2_2b},
  {id: 'D2-3a', sec: 'D2', start: M.DECOY_HITa, end: 100.25, note: 'DECOY_HIT wide: fists go through the light figures; two drones dive through them', C: D2_3a},
  {id: 'D2-3b', sec: 'D2', start: 100.25, end: 101.05, note: 'DECOY_HITc medium: heavy 1 fires into the smoke; the round bursts inside the white wall', C: D2_3b},
  {id: 'D2-3c', sec: 'D2', start: 101.05, end: M.FLANK, note: 'the blast smoke rolls through the wall; the giants walk on; the units swing at them again', C: D2_3c},
  {id: 'D2-4', sec: 'D2', start: M.FLANK, end: M.TETHER, note: 'FLANK, low along the girder: the breaker breaks a knee, the Director bashes, the runner pries and rips', C: D2_4},
  {id: 'D2-5', sec: 'D2', start: M.TETHER, end: M.KNOCKBACK, note: 'TETHER, wide on the girder: clamp, wrap round post 3, the reel drags A into C and both slam into the girder', C: D2_5},
  {id: 'D2-6', sec: 'D2', start: M.KNOCKBACK, end: M.SHIELD, note: 'KNOCKBACK/CATCH: a backhand throws the runner back; the breaker catches him and lowers him', C: D2_6},
  {id: 'D2-7a', sec: 'D2', start: M.SHIELD, end: 114.8, note: 'SHIELD/COUNTER: the allied drone takes the blow meant for the runner; the Director bashes the unit down', C: D2_7a},
  {id: 'D2-7b', sec: 'D2', start: 114.8, end: M.P3, note: 'BRIGHT, low wide from the slope: the seven regroup on the rim crest, breathing; a moment of success', C: D2_7b},
];
