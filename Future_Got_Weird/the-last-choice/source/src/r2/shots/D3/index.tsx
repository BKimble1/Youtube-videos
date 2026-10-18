// Section D3 shots (film seconds). See production/R3_EXCHANGES.md ## D3 for the exchanges. Sound cues live in ./cues.ts
// (pure data, no React). One battle (crew.tsx: the Crew; machines.ts: the machines; fx.tsx: contacts; battle.tsx: the
// world) sampled by every camera (shots.tsx). Start: D2's end (crew blended from D2's own specs). End: D4's start
// (start.ts; blended into D4's).
import type {R2Shot} from '../../film/registry';
import {SH3} from './times';
import {
  D3_1, D3_1b, D3_2, D3_3a, D3_3b, D3_4a, D3_4b, D3_5, D3_6, D3_7a, D3_7b, D3_7c, D3_8, D3_9, D3_10a, D3_10b, D3_10c, D3_11a, D3_11b, D3_11c, D3_11d, D3_11e,
} from './shots';

export const SHOTS_D3: R2Shot[] = [
  {id: 'D3-1', sec: 'D3', start: SH3.d31, end: SH3.d31b, note: 'P3: on the rim beside the flare carrier (his profile): the signal; the flare struck and thrown; the allied drone darts into heavy 1\'s face and jinks the ram\'s swipe; the flash', C: D3_1},
  {id: 'D3-1b', sec: 'D3', start: SH3.d31b, end: SH3.d32, note: 'from the rim behind them: the three go down the slope at it; blinded, it swings at the drone\'s whine and halts', C: D3_1b},
  {id: 'D3-2', sec: 'D3', start: SH3.d32, end: SH3.d33, note: 'south-west of the tether at the girder\'s foot: it swings round blind; the clamp bites its front-left shin; the cable round post 3; R3 hauls on it, the post holds', C: D3_2},
  {id: 'D3-3a', sec: 'D3', start: SH3.d33, end: SH3.d33b, note: 'side-on on the south-west slope: U8\'s hammer on the Director\'s plate, the press; it turns for the crossing: his plate into its back', C: D3_3a},
  {id: 'D3-3b', sec: 'D3', start: SH3.d33b, end: SH3.d34a, note: 'across U8\'s fall to the crossing: the runner\'s hook, U8 down; the breaker splits the rear-left knee; R4\'s hammer on the beam; he dives back under it', C: D3_3b},
  {id: 'D3-4a', sec: 'D3', start: SH3.d34a, end: SH3.d34b, note: 'HEAVY_DOWN, wide from the south-west slope: it goes over onto its left side across the crater\'s north part; the crash; the dust wave; the breaker clear', C: D3_4a},
  {id: 'D3-4b', sec: 'D3', start: SH3.d34b, end: SH3.d35, note: 'the peak: low in front of the three on the slope, their faces as it lies there', C: D3_4b},
  {id: 'D3-5', sec: 'D3', start: SH3.d35, end: SH3.d36, note: 'ADAPT: a small drone climbs above the dust over the wreck; its gimbal tilts down; the eye snaps amber; an amber line finds the tablet', C: D3_5},
  {id: 'D3-6', sec: 'D3', start: SH3.d36, end: SH3.d37a, note: 'FORMATION, high wide: the line held behind the barrier splits from the middle and bends into an arc round the Crew', C: D3_6},
  {id: 'D3-7a', sec: 'D3', start: SH3.d37a, end: SH3.d37b, note: 'DECOY_FAIL: over her shoulder: the sketch again, the tap, the projector clicks on', C: D3_7a},
  {id: 'D3-7b', sec: 'D3', start: SH3.d37b, end: SH3.d37c, note: 'behind the Crew: the light figures on the dust; the arc walks straight through them at the source; a drone drops', C: D3_7b},
  {id: 'D3-7c', sec: 'D3', start: SH3.d37c, end: SH3.d38, note: 'the drone smashes the tablet; her hand cut; the figures flicker out', C: D3_7c},
  {id: 'D3-8', sec: 'D3', start: SH3.d38, end: SH3.d39, note: 'FLANK_DENIED: drones swarm the girder flank; the cutter goes through the cable; she falls back; the wing comes over the slack', C: D3_8},
  {id: 'D3-9', sec: 'D3', start: SH3.d39, end: SH3.d310a, note: 'ALLY_DRONE_LOST: two drones run the allied drone down; it crashes smoking; she keeps the dead controller', C: D3_9},
  {id: 'D3-10a', sec: 'D3', start: SH3.d310a, end: SH3.d310b, note: 'HEAVY2, low on the crater floor: the second heavy at the barrier, a leg up over the first one\'s wreck', C: D3_10a},
  {id: 'D3-10b', sec: 'D3', start: SH3.d310b, end: SH3.d310c, note: 'in front of her on the crest: on her knees, the cut hand; she looks up into the launcher; the Director runs', C: D3_10b},
  {id: 'D3-10c', sec: 'D3', start: SH3.d310c, end: SH3.d311a, note: 'wide from the south: he hauls her up off the crest; heavy 2 on the wreck, its launcher on them', C: D3_10c},
  {id: 'D3-11a', sec: 'D3', start: SH3.d311a, end: SH3.d311b, note: 'HEAVY2_FIRE, wide: the round bursts where she knelt; the Crew thrown', C: D3_11a},
  {id: 'D3-11b', sec: 'D3', start: SH3.d311b, end: SH3.d311c, note: 'insert: the breaker\'s gauge reads empty', C: D3_11b},
  {id: 'D3-11c', sec: 'D3', start: SH3.d311c, end: SH3.d311d, note: 'insert: the flare carrier lifts his head, his brow cut', C: D3_11c},
  {id: 'D3-11d', sec: 'D3', start: SH3.d311d, end: SH3.d311e, note: 'the Director gets up, his lip cut, a glance back at the heavy, and goes', C: D3_11d},
  {id: 'D3-11e', sec: 'D3', start: SH3.d311e, end: SH3.end, note: 'they fall back west among D1\'s wrecks into D4\'s start; the arc presses in', C: D3_11e},
];
