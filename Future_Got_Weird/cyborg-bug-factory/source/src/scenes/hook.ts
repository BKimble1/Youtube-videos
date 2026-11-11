// The hook camera (frame 0) and its pre-roll: a high front three-quarter view of the insect on the station (face,
// antennae and pronotum toward the lens), the arm reaching in from the far side. The loop's last frames converge on exactly this orbit.
import {Orbit} from '../core/three';
import {at} from '../camera';
import {ss5} from '../lib';

export const HOOK_O = (tau: number): Orbit => {
  // a slight drift so frame 0 is already alive; matched at the loop by evaluating at tau = t - DUR
  const d = 0.6 * tau;
  return at([0.0 + d * 0.4, 2 + d, 7], 158 + 1.5 * tau, 50, 17.0, 1000);
};
export {ss5};
