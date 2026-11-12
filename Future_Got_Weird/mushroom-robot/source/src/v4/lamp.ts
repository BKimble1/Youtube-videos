// The UV lamp: on an overhead arm that keeps it above the walker's culture while it is lit (shared by picture and audit).
import {V3, v3} from '../lib';
import {camAt} from './cam';
import {smoothCentre} from './robot';
import {lampIn, UV} from './timing';
const LAMP_DIR: V3 = (() => { const c = camAt(12.6), p = smoothCentre(12.6); return v3.nrm([c.pos[0] - p[0], 0, c.pos[2] - p[2]]); })();
export const LAMP_R = 1.25, LAMP_L = 3.0;
export const lampHead = (t: number): V3 => {
  // swings in from above; swings OUT sideways (away from the overhead camera that follows the walker)
  const p = smoothCentre(t);
  const k = lampIn(t), out = t > UV.off ? 1 - k : 0, inn = t <= UV.off ? 1 - k : 0;
  return v3.add([p[0], 14.5 + 30 * inn, p[2]], v3.mul(LAMP_DIR, -1.0 - 40 * out));
};
