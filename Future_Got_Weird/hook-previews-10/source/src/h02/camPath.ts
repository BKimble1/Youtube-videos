// HOOK 02 camera path: one continuous move (follow, orbit, push into the apparatus, pan along the tubes, pull back).
import {keyCR} from '../shared/lib';
import {V3} from './rig/v3';
import {makeCam} from './cam';
import {EV, PATH, ground, sAt} from './world';

/** camera keys: time -> value (Catmull-Rom, velocity carried across keys) */
export const CAMK = {
  // log of scale (px per mm): a slow follow, then one continuous push into the apparatus, then the pull back
  ls: [[0, 12.2], [1.0, 12.6], [EV.push, 15.5], [2.95, 22], [3.6, 26], [EV.pull, 31]] as [number, number][],
  ls2: [[EV.pull, 31], [5.05, 13], [6.0, 10.4]] as [number, number][],
  // target in the insect's (unpitched path) frame, mm
  tx: [[0, -8], [1.0, -11], [EV.push, -30], [2.95, -41], [3.6, -8], [EV.pull, -1.5], [5.05, 1], [6.0, 5]] as [number, number][],
  ty: [[0, 12], [1.0, 13], [EV.push, 17], [2.95, 19.5], [3.6, 13.5], [EV.pull, 13], [5.05, 18], [6.0, 21]] as [number, number][],
  tz: [[0, 0], [1.0, 1], [EV.push, 3], [2.95, 2], [3.6, 16], [EV.pull, 17], [5.05, 4], [6.0, 0]] as [number, number][],
  az: [[0, 35], [1.0, 20], [EV.push, -14], [2.95, -12], [3.6, -1], [EV.pull, 3], [5.05, 24], [6.0, 33]] as [number, number][],
  el: [[0, 11], [1.0, 14], [EV.push, 28], [2.95, 33], [3.6, 12], [EV.pull, 9], [5.05, 8], [6.0, 9]] as [number, number][],
  cy: [[0, 1040], [EV.push, 1000], [3.6, 965], [EV.pull, 960], [5.05, 1060], [6.0, 1100]] as [number, number][],
};

export const camAt = (t: number) => {
  const ls = t <= EV.pull ? keyCR(t, CAMK.ls.map(([a, b]) => [a, Math.log(b)])) : keyCR(t, CAMK.ls2.map(([a, b]) => [a, Math.log(b)]));
  const s = Math.exp(ls);
  const base = PATH(sAt(t));
  // the target follows the path point (not the bobbing body), in an unpitched frame
  const T: V3 = [base.p[0] + keyCR(t, CAMK.tx), ground(base.p[0]) + keyCR(t, CAMK.ty), keyCR(t, CAMK.tz)];
  return makeCam(keyCR(t, CAMK.az), keyCR(t, CAMK.el), s, T, 540, keyCR(t, CAMK.cy));
};

