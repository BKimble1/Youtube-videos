// registers every V2 shot group with the shot table (each group file is owned by one builder)
import {registerShots} from './index2';
import {CAP2_Y} from '../captions2';
import * as GA from './grpA';
import * as GB from './grpB';
import * as GC from './grpC';
import * as GD from './grpD';
import * as GE from './grpE';
import * as GF from './grpF';
import {SHOTS_A} from './grpA';
import {SHOTS_B} from './grpB';
import {SHOTS_C} from './grpC';
import {SHOTS_D} from './grpD';
import {SHOTS_E} from './grpE';
import {SHOTS_F} from './grpF';
import {SHOTS_H} from './grpH';

registerShots({...SHOTS_A, ...SHOTS_B, ...SHOTS_C, ...SHOTS_D, ...SHOTS_E, ...SHOTS_F, ...SHOTS_H});
// caption heights per shot, as each group sets them for its compositions (CAPY_<G>), plus the integrator's shots
const capy = (m: Record<string, unknown>, k: string) => (m[k] as Record<string, number> | undefined) ?? {};
Object.assign(CAP2_Y, {A1: 270, F6: 270}, capy(GA as Record<string, unknown>, 'CAPY_A'), capy(GB as Record<string, unknown>, 'CAPY_B'), capy(GC as Record<string, unknown>, 'CAPY_C'), capy(GD as Record<string, unknown>, 'CAPY_D'), capy(GE as Record<string, unknown>, 'CAPY_E'), capy(GF as Record<string, unknown>, 'CAPY_F'));
export {shotAt2, SHOTS2_TABLE} from './index2';
