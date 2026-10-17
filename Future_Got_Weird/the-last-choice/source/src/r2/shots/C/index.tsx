// Section C shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
//   beats.ts   every key time (shared with the cues)        crew.ts   the Crew as functions of film time (one choreography)
//   motion.ts  gait on slope-warped paths, planted steps     ground.ts GC (terrain + B's slab top), the vault wall
//   kit.tsx    sprites, drone, smoke, dust (the flare bag and the one-handed carries are rig kit gear: rig/gear.tsx)
//   cams.ts    the cameras                                   props.ts / persist.ts   the vault wall (persists)
import type {R2Shot} from '../../film/registry';
import {CUT} from './beats';
import {ShotC1, ShotC2, ShotC3, ShotC4a, ShotC4b, ShotC5a, ShotC5b, ShotC5c, ShotC6} from './Shots';

export const SHOTS_C: R2Shot[] = [
  {id: 'C1_turn', sec: 'C', start: CUT.c1, end: CUT.c2, note: 'BASS_OUT: close profile from the south; the world goes quiet; his breath stops, eyes, then head over his shoulder; he comes round to the west', C: ShotC1},
  {id: 'C2_pov', sec: 'C', start: CUT.c2, end: CUT.c3, note: 'ALLY1: his POV west into the smoke over the broken ruin: the tether operator steps out onto the rubble', C: ShotC2},
  {id: 'C3_vault', sec: 'C', start: CUT.c3, end: CUT.c4, note: 'ALLY2: over his shoulder, west: the runner vaults the broken wall (left), the breaker climbs with a hand on the rubble (right); his breath of recognition', C: ShotC3},
  {id: 'C4a_march', sec: 'C', start: CUT.c4, end: CUT.c4b, note: 'MARCH: low on the slope above them: the drone pilot, the flare carrier and the decoy maker climb out of the street toward the lens', C: ShotC4a},
  {id: 'C4b_launch', sec: 'C', start: CUT.c4b, end: CUT.c5a, note: 'from her left: the pilot stops, holds the drone up on her palm, the rotors spin up and it rises out of her hand; the other two climb past behind her; tilt up after the drone', C: ShotC4b},
  {id: 'C5a_shoulder', sec: 'C', start: CUT.c5a, end: CUT.c5b, note: 'close: the breaker\'s hand lands on his shoulder; the look between them', C: ShotC5a},
  {id: 'C5b_reel', sec: 'C', start: CUT.c5b, end: CUT.c5c, note: 'close: her hand on the tether reel, the lock clicks; the drone rises past', C: ShotC5b},
  {id: 'C5c_strap', sec: 'C', start: CUT.c5c, end: CUT.c6, note: 'close: he checks the plate strap with his right fingers', C: ShotC5c},
  {id: 'C6_group', sec: 'C', start: CUT.c6, end: CUT.end, note: 'ASSEMBLE: low wide from the east: all seven on the crest turn to the enemy together (he is first); the hold; he steps forward on the build', C: ShotC6},
];
