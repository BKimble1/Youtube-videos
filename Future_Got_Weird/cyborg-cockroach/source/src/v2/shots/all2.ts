// registers every V2 shot group with the shot table (each group file is owned by one builder)
import {registerShots} from './index2';
import {SHOTS_A} from './grpA';
import {SHOTS_B} from './grpB';
import {SHOTS_C} from './grpC';
import {SHOTS_D} from './grpD';
import {SHOTS_E} from './grpE';
import {SHOTS_H} from './grpH';

registerShots({...SHOTS_A, ...SHOTS_B, ...SHOTS_C, ...SHOTS_D, ...SHOTS_E, ...SHOTS_H});
export {shotAt2, SHOTS2_TABLE} from './index2';
