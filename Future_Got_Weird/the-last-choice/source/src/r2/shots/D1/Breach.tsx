// D1-8 (BR4 85.64–89.78): the shoulder drive. U3 came out of the gap with its arm up; he gets inside the hammer.
// Low behind him, off his left (plate) shoulder, through the gap between rim plates 7 and 8: he gathers, bursts two
// strides into U3, drives it up the rim's west face, shoves; it staggers onto the crest and goes over backward. The camera
// follows him up the slope and cranes over his left shoulder as he stands on the crest: the gap opens on the crater —
// U3 sliding down the inner slope below, the survivors being pulled back across the bowl, the reserve on the far rim.
import {CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {EV} from './machines';
import {directorPlate} from './crew';
import {shotOf, g} from './shot';

const ga = (x: number, y: number, z: number): V3 => ({x, y, z});
const D18_KEYS: CamKey[] = [
  // (the path stays south of U1's wreck and of rim plate 8)
  {t: 0, pos: g(40.0, -1.55, 0.55), target: g(44.4, -0.75, 1.2), fov: 42},
  {t: 0.3, pos: g(40.1, -1.55, 0.53), target: g(44.4, -0.75, 1.18), fov: 42},
  {t: EV.br4 - M.BR4, pos: g(41.3, -1.5, 0.6), target: g(44.8, -0.8, 1.3), fov: 42},
  {t: 1.3, pos: g(42.6, -1.55, 0.7), target: g(46.1, -0.8, 1.35), fov: 42},
  {t: 1.8, pos: g(43.3, -1.75, 0.95), target: g(47.1, -0.8, 1.3), fov: 43},
  {t: 2.55, pos: ga(43.9, 1.95, -2.3), target: ga(48.7, 0.45, -0.5), fov: 46},
  {t: 3.25, pos: ga(44.35, 2.45, -2.6), target: ga(49.6, 0.7, -0.45), fov: 49},
  {t: M.GAIN1 - M.BR4, pos: ga(44.45, 2.5, -2.65), target: ga(49.7, 0.9, -0.4), fov: 50},
];
export const D1_8 = shotOf(M.BR4, D18_KEYS, {drift: 0.022, opts: (T) => ({tweak: {director: {anchor: directorPlate(T)}}})});
