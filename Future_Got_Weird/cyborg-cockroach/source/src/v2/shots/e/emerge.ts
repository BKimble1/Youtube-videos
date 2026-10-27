// The medic's one continuous walk out of the crack through F2, F3 and F4 (film seconds T), in the crack's millimetres
// (crack.tsx: the hole's face is x = 0, the insect walks out along +x). F2 sees it from close in front, F3/F4 from its
// left front, so every shot shows the same animal at the same place in the same instant.
import {poseRoach, straightPath, RoachPose} from '../../../rig/roach';
import {keys} from '../../../lib/ease';
import {shotRange} from '../../cuts2';

export const F2R = shotRange('F2'), F3R = shotRange('F3'), F4R = shotRange('F4');
const T2 = F2R.from / 30, T3 = F3R.from / 30, T4 = F4R.from / 30, T5 = F4R.to / 30;
/** speed (mm/s): it sets off as F2 opens (antennae first), keeps coming through F3, comes on steadily in F4 */
export const emergeV = (T: number) =>
  keys(T, [[T2 - 0.2, 0], [T2 + 0.3, 44], [T3 - 0.1, 50], [T3 + 0.45, 56], [T4, 50], [T4 + 0.4, 42], [T5, 40]]);
const X0 = -43; // body origin (x) at T2 - 0.2: the head (x + 35) still 11 mm inside the hole, antennae already at the mouth
const DT = 1 / 240;
/** body origin x (mm) at film second T (integrated speed: a pure function of T) */
export const emergeX = (T: number) => {
  let x = X0;
  const t0 = T2 - 0.2;
  if (T <= t0) return x;
  const n = Math.floor((T - t0) / DT);
  for (let i = 0; i < n; i++) x += emergeV(t0 + (i + 0.5) * DT) * DT;
  x += emergeV(t0 + (n + 0.5) * DT) * (T - t0 - n * DT);
  return x;
};
const PATH = straightPath([0, 0, 0], 0);
/** the pose at film second T; search is the antennae's probing (high as it comes out, settling as it walks on) */
export const emergePose = (T: number): RoachPose => {
  const srch = keys(T, [[T2, 1.15], [T3, 0.9], [T4 + 0.3, 0.6]]);
  const pitch = keys(T, [[T2, 0.62], [T3, 0.42], [T4, 0.22]]);
  return poseRoach({path: PATH, s: emergeX(T), t: T, search: srch, seed: 5, antL: {yaw: keys(T, [[T2, 0.42], [T4, 0.66]]), pitch}, antR: {yaw: keys(T, [[T2, 0.38], [T4, 0.62]]), pitch: pitch + 0.04}});
};
