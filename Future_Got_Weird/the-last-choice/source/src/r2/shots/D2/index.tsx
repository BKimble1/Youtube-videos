// Section D2 shots (film seconds), R3. Sound cues live in ./cues.ts (pure data, no React); cameras in ./cams.ts.
// One battle (crew.tsx: the Crew; machines.ts: the machines; fx.tsx: smoke, light, contacts) sampled by every camera.
// The exchanges are recorded in production/R3_EXCHANGES.md (## D2).
import type {R2Shot} from '../../film/registry';
import {M} from '../../timing';
import {D2_1, D2_2a, D2_2b, D2_2c, D2_2d, D2_3a, D2_3b, D2_3c, D2_4, D2_4b, D2_4c, D2_5a, D2_5b, D2_5c, D2_6, D2_7a, D2_7b} from './shots';

export const SHOTS_D2: R2Shot[] = [
  {id: 'D2-1', sec: 'D2', start: M.P2, end: M.DECOY, note: 'over the flare carrier\'s shoulder toward the crater: he lobs two smoke canisters while D and U8 come on and the drone\'s mark sits on the slab', C: D2_1},
  {id: 'D2-2a', sec: 'D2', start: M.DECOY, end: 96.25, note: 'insert: her finger sketches four walking figures on the battered tablet (the clip-on projector on its top edge)', C: D2_2a},
  {id: 'D2-2b', sec: 'D2', start: 96.25, end: 96.85, note: 'over D\'s shoulder as it climbs at the slab\'s south end: the pilot looks up from her screen, the breaker runs in to cover her', C: D2_2b},
  {id: 'D2-2c', sec: 'D2', start: 96.85, end: 97.55, note: 'insert: the last figure, the tap — they fill and start to walk', C: D2_2c},
  {id: 'D2-2d', sec: 'D2', start: 97.55, end: M.DECOY_HITa, note: 'behind her at the slab: the tablet set on its top edge, the projector clicks on, its beam crosses the crater; walking figures of light on the smoke; the machines turn to them, D leaves the slab', C: D2_2d},
  {id: 'D2-3a', sec: 'D2', start: M.DECOY_HITa, end: 100.25, note: 'DECOY_HIT low beside B and A: B\'s fist goes through a figure, A\'s hammer through another, two drones dive through the light', C: D2_3a},
  {id: 'D2-3b', sec: 'D2', start: 100.25, end: 101.05, note: 'over heavy 1\'s shoulder: it fires into the light; the round bursts in the smoke among its own units', C: D2_3b},
  {id: 'D2-3c', sec: 'D2', start: 101.05, end: M.FLANK, note: 'side track on the flank run: the Director, the runner and the tether round the units\' backs while they swing at the light again', C: D2_3c},
  {id: 'D2-4', sec: 'D2', start: M.FLANK, end: 103.55, note: 'FLANK: the adze behind B\'s knee (down), the Director\'s bash into A\'s block, B\'s backhand over the ducking runner, A\'s hammer on the plate', C: D2_4},
  {id: 'D2-4b', sec: 'D2', start: 103.55, end: 104.42, note: 'the pry, clean silhouettes: the fork under B\'s back plate, the pop, the cables ripped out; A presses the Director back beyond', C: D2_4b},
  {id: 'D2-4c', sec: 'D2', start: 104.42, end: M.TETHER, note: 'A\'s hook (the Director ducks, slips), B goes down; the breaker\'s swing parried, the shove: he goes down on a knee', C: D2_4c},
  {id: 'D2-5a', sec: 'D2', start: M.TETHER, end: 107.0, note: 'TETHER over her shoulder at post 3: the clamp bites A\'s chest just as its finishing blow comes down; it grabs the cable and hauls her a step; she whips it round the post', C: D2_5a},
  {id: 'D2-5b', sec: 'D2', start: 107.0, end: 108.95, note: 'the reel drags A chest-first up the slope into C; both slam into the girder\'s chord (it shudders) and go down under it', C: D2_5b},
  {id: 'D2-5c', sec: 'D2', start: 108.95, end: 110.2, note: 'the regroup on the crest: the runner on guard as D comes up the slope at them, the breaker behind him, the Director at the pile', C: D2_5c},
  {id: 'D2-6', sec: 'D2', start: 110.2, end: 112.9, note: 'KNOCKBACK/CATCH: D\'s hook through the runner\'s parry; the breaker drops his tool and catches him; the Director\'s plate on A\'s head as it stirs; D presses on', C: D2_6},
  {id: 'D2-7a', sec: 'D2', start: 112.9, end: 114.6, note: 'SHIELD/COUNTER: D\'s hammer at the runner, the allied drone in its path; the Director\'s plate into its side, the runner\'s adze behind its ankle', C: D2_7a},
  {id: 'D2-7b', sec: 'D2', start: 114.6, end: M.P3, note: 'D goes down; BRIGHT: the camera eases back on the seven regrouped on the crest behind the wreck barricade, breathing; heavy 1 coming on beyond', C: D2_7b},
];
