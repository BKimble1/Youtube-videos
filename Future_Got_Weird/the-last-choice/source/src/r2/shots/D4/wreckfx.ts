// W1's (7501) fight as data, for its wreck. PURE (times, marks and the ground only; no EF import), so the E/F tableau
// can merge it into its wreck spec: the kit launches the torn chest plate (163.3) and the fluid pool from the rig at
// the damage time, and that rig is mid-follow-through of W1's hook with its guard up and the plate's blow on it. With
// these fields W1's plate and pool lie exactly where D4 throws them (without them EF's lie 1.2 m / 0.17 m away).
// machines.ts (W1.act) uses this same object.
import type {UnitSpec} from '../../mech';
import {groundH} from '../../world/ground';
import {EV} from './times';
import {BLOCK_PLATE} from './marks';

const onG = (x: number, z: number, up = 0) => ({x, y: groundH(x, z) + up, z});

export const W1_FIGHT: Pick<UnitSpec, 'strikes' | 'posture' | 'hits'> = {
  strikes: [
    // the hammer on the plate (the crack goes right through); the hook at his head as he turns away (he ducks it)
    {t0: EV.w1Swing, side: 'R', target: {x: BLOCK_PLATE.x + 0.06, y: BLOCK_PLATE.y + 0.04, z: BLOCK_PLATE.z}, kind: 'hammer'},
    {t0: EV.w1Hook, side: 'L', target: onG(30.12, 1.76, 1.62), kind: 'hook'},
    // ARRIVAL: it swings first at the charging Director — he ducks under it into its open chest
    {t0: EV.w1Hammer, side: 'R', target: onG(12.86, -1.72, 1.66), kind: 'hook'},
  ],
  // (guard until 0.9 s after its fall: EF TB_WRECKS 7501 fall.t0 = 163.4)
  posture: [[-1, 'guard'], [164.3, 'idle']],
  hits: [{t0: EV.w1Swing + 0.02, dir: {x: 1, y: 0, z: 0}, strength: 0.55}, {t0: EV.w1Smash, dir: {x: 0.85, y: 0, z: -0.5}, strength: 1.5}],
};
