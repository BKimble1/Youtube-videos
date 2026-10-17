// Section C shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
//   beats.ts   every key time (shared with the cues)        crew.ts   the Crew as functions of film time (one choreography)
//   motion.ts  gait on slope-warped paths, planted steps     ground.ts GC (terrain + B's slab top), the vault wall
//   gear.tsx   the flare bag, the carried breaker, the one-handed controller        kit.tsx  sprites, drone, smoke, dust
//   cams.ts    the cameras                                   props.ts / persist.ts   the vault wall (persists)
import type {R2Shot} from '../../film/registry';
import {CUT} from './beats';
import {ShotC1, ShotC2, ShotC3, ShotC4, ShotC5a, ShotC5b, ShotC5c, ShotC6} from './Shots';

export const SHOTS_C: R2Shot[] = [
  {id: 'C1_turn', sec: 'C', start: CUT.c1, end: CUT.c2, note: 'BASS_OUT: close profile from the south; the world goes quiet; his breath stops, eyes, then head over his shoulder; he comes round to the west', C: ShotC1},
  {id: 'C2_pov', sec: 'C', start: CUT.c2, end: CUT.c3, note: 'ALLY1: his POV west into the smoke over the broken ruin: the tether operator steps out onto the rubble', C: ShotC2},
  {id: 'C3_vault', sec: 'C', start: CUT.c3, end: CUT.c4, note: 'ALLY2: over his shoulder, west: the runner vaults the broken wall (left), the breaker climbs with a hand on the rubble (right); his breath of recognition', C: ShotC3},
  {id: 'C4_march', sec: 'C', start: CUT.c4, end: CUT.c5a, note: 'MARCH: wide from the north side of the ridge: the tether gains the summit, the breaker climbs; the decoy maker, the drone pilot (her drone lifts off) and the flare carrier come up from the edge of the street', C: ShotC4},
  {id: 'C5a_shoulder', sec: 'C', start: CUT.c5a, end: CUT.c5b, note: 'close: the breaker\'s hand lands on his shoulder; the look between them', C: ShotC5a},
  {id: 'C5b_reel', sec: 'C', start: CUT.c5b, end: CUT.c5c, note: 'close: her hand on the tether reel, the lock clicks; the drone rises past', C: ShotC5b},
  {id: 'C5c_strap', sec: 'C', start: CUT.c5c, end: CUT.c6, note: 'close: he checks the plate strap with his right fingers', C: ShotC5c},
  {id: 'C6_group', sec: 'C', start: CUT.c6, end: CUT.end, note: 'ASSEMBLE: low wide from the east: all seven on the crest turn to the enemy together (he is first); the hold; he steps forward on the build', C: ShotC6},
];
