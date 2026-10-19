// D1-8 / D1-8b (BR4 85.64–89.78): the shoulder drive. U3 came out of the gap with its arm up; he gets inside the hammer.
// R4: two cameras instead of one. R3 held one low lens behind his left shoulder for the whole beat, and at the contact his
// head, hair and shoulders covered U3's chest: the hit, the drive and the robot's heels skidding back could not be read
// (and the contact's spark starburst and chips sat on his hair).
//   D1-8  (85.64–87.00) side-on from the south, tracking east with them: he (left, facing east) sets, bursts two strides into
//         U3 (right, facing west, its hammer arm raised), the shoulder and tucked plate meet its lower chest (BR4, 86.36),
//         three driving steps push it up the rim's west face with its heels skidding, the shove (86.95): both bodies are in
//         profile the whole way, so the source of its momentum (his run-up and drive) is in frame with the robot's reaction.
//   D1-8b (87.00–89.78) the R3 lens from the shove on: low behind his left shoulder, then craning over it as he stands on
//         the crest: U3 staggers back, goes over the crest and slides down the inner slope below; the gap opens on the crater.
import {CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {directorPlate} from './crew';
import {shotOf, g} from './shot';

const ga = (x: number, y: number, z: number): V3 => ({x, y, z});
// (the lens stays south of the fight and 1.4 m or more west of the cover slab's base, x 47.1+: nothing between it and them)
const D18_KEYS: CamKey[] = [
  {t: 0, pos: g(43.7, 2.9, 0.85), target: g(43.5, -0.8, 1.2), fov: 38},
  {t: 0.72, pos: g(44.5, 2.85, 0.9), target: g(44.3, -0.78, 1.2), fov: 36},
  {t: 1.36, pos: g(45.7, 2.8, 1.0), target: g(45.6, -0.8, 1.3), fov: 38},
];
const anchor = (T: number) => ({tweak: {director: {anchor: directorPlate(T)}}});
export const D1_8 = shotOf(M.BR4, D18_KEYS, {drift: 0.012, ease: 0.4, opts: anchor});

// D1-8b: R3's keys from 1.36 s into the beat (the lens there: 2.4 m behind him, 0.9 m north), re-timed to the new cut at 87.00
const D18B_KEYS: CamKey[] = [
  {t: 0, pos: g(42.7, -1.55, 0.7), target: g(46.2, -0.8, 1.36), fov: 42},
  {t: 0.44, pos: g(43.3, -1.75, 0.95), target: g(47.1, -0.8, 1.3), fov: 43},
  {t: 1.19, pos: ga(43.9, 1.95, -2.3), target: ga(48.7, 0.45, -0.5), fov: 46},
  {t: 1.89, pos: ga(44.35, 2.45, -2.6), target: ga(49.6, 0.7, -0.45), fov: 49},
  {t: M.GAIN1 - 87.0, pos: ga(44.45, 2.5, -2.65), target: ga(49.7, 0.9, -0.4), fov: 50},
];
export const D1_8b = shotOf(87.0, D18B_KEYS, {drift: 0.022, opts: anchor});
