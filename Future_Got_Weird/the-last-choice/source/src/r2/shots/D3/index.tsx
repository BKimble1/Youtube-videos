// Section D3 shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
// One battle (crew.tsx: the Crew; machines.ts: the machines; fx.tsx: contacts; battle.tsx: the world) sampled by every
// camera (shots.tsx). Start: D2's end (crew blended from D2's own specs). End: D4's start (start.ts; blended into D4's).
import type {R2Shot} from '../../film/registry';
import {SH3} from './times';
import {D3_1, D3_2, D3_3, D3_4a, D3_4b, D3_5, D3_6, D3_7a, D3_7b, D3_7c, D3_8, D3_9, D3_10, D3_11a, D3_11b, D3_11c, D3_11d, D3_11e} from './shots';

export const SHOTS_D3: R2Shot[] = [
  {id: 'D3-1', sec: 'D3', start: SH3.d31, end: SH3.d32, note: 'P3: on the rim beside the flare carrier (his profile): the signal; the flare struck and thrown, the allied drone in heavy 1\'s face; the flash; the blind swipe', C: D3_1},
  {id: 'D3-2', sec: 'D3', start: SH3.d32, end: SH3.d33, note: 'south-west of the tether at the girder\'s foot: heavy 1 swings round blind; the clamp bites its front-left shin; the cable round post 3; the leg is pinned', C: D3_2},
  {id: 'D3-3', sec: 'D3', start: SH3.d33, end: SH3.d34a, note: 'low on the slope: the Director bangs his plate, the ram slams down short of him; the breaker splits the rear-left knee; the runner hauls him clear', C: D3_3},
  {id: 'D3-4a', sec: 'D3', start: SH3.d34a, end: SH3.d34b, note: 'HEAVY_DOWN, wide from the south-west slope: it rolls onto its side toward us across the crater\'s north part; the crash; the dust wave; debris rain', C: D3_4a},
  {id: 'D3-4b', sec: 'D3', start: SH3.d34b, end: SH3.d35, note: 'the peak: low from the wreck\'s side, their faces: the three on the slope seeing it lie there; the Director, plate lowered, a fierce breath', C: D3_4b},
  {id: 'D3-5', sec: 'D3', start: SH3.d35, end: SH3.d36, note: 'ADAPT: a small drone climbs above the dust; its gimbal tilts down; the eye snaps amber; an amber line finds the tablet on the rim', C: D3_5},
  {id: 'D3-6', sec: 'D3', start: SH3.d36, end: SH3.d37a, note: 'FORMATION, high wide: the line across the crater bends into an arc round the Crew, a ripple from the middle out', C: D3_6},
  {id: 'D3-7a', sec: 'D3', start: SH3.d37a, end: SH3.d37b, note: 'DECOY_FAIL: over her shoulder: the sketch again, the tap, the projector clicks on', C: D3_7a},
  {id: 'D3-7b', sec: 'D3', start: SH3.d37b, end: SH3.d37c, note: 'the light figures on the dust; the units walk straight through them toward the source; a drone drops', C: D3_7b},
  {id: 'D3-7c', sec: 'D3', start: SH3.d37c, end: SH3.d38, note: 'the drone smashes the tablet and projector; her hand cut; the figures flicker out', C: D3_7c},
  {id: 'D3-8', sec: 'D3', start: SH3.d38, end: SH3.d39, note: 'FLANK_DENIED: drones swarm the girder flank; the cutter goes through the cable; it snaps; she falls back', C: D3_8},
  {id: 'D3-9', sec: 'D3', start: SH3.d39, end: SH3.d310, note: 'ALLY_DRONE_LOST: two drones run the allied drone down; it crashes smoking; she keeps the controller', C: D3_9},
  {id: 'D3-10', sec: 'D3', start: SH3.d310, end: SH3.d311a, note: 'HEAVY2, from the gap in the broken water main, a little above it: the second heavy steps over the first one\'s wreck; its foot comes down', C: D3_10},
  {id: 'D3-11a', sec: 'D3', start: SH3.d311a, end: SH3.d311b, note: 'HEAVY2_FIRE, wide: the round hits the rim; the Crew thrown back', C: D3_11a},
  {id: 'D3-11b', sec: 'D3', start: SH3.d311b, end: SH3.d311c, note: 'insert: the breaker\'s gauge reads empty', C: D3_11b},
  {id: 'D3-11c', sec: 'D3', start: SH3.d311c, end: SH3.d311d, note: 'insert: the flare carrier lifts his head, his brow cut', C: D3_11c},
  {id: 'D3-11d', sec: 'D3', start: SH3.d311d, end: SH3.d311e, note: 'the Director gets up, his lip cut, and looks back at the heavy', C: D3_11d},
  {id: 'D3-11e', sec: 'D3', start: SH3.d311e, end: SH3.end, note: 'they fall back west among D1\'s wrecks into D4\'s start; the arc presses in', C: D3_11e},
];
