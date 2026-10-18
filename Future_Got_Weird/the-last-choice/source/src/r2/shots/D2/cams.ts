// Section D2 cameras: physical positions and targets in the world (metres; y from g() = ground + up), shot-local
// seconds. PURE (no React) so the framing can be checked numerically and the cues can take pan / distance from them.
// The enemy stays east (screen right) through the section; the reverse over D's shoulder (D2-2b) keeps it on the
// right of frame, and the wides re-establish the crater, the slab and the girder.
import type {CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {G} from '../D1/motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

export type ShotCam = {id: string; start: number; end: number; keys: CamKey[]; drift: number};
const d = (a: number, b: number) => b - a;

// D2-1 (P2 → DECOY): over the flare carrier's right shoulder toward the crater: he rises and lobs two canisters; D and
// U8 come on up the slope beyond the slab's south end, the drone's beam on the slab
export const CAM_1: CamKey[] = [
  {t: 0, pos: g(45.7, 8.1, 2.6), target: g(51.1, 3.8, 1.9), fov: 56},
  {t: d(M.P2, M.DECOY), pos: g(45.75, 8.05, 2.62), target: g(51.4, 3.4, 2.0), fov: 55},
];
// D2-2a / D2-2c: the tablet insert (Insert.tsx) — a close camera over her shoulder at the slab
export const CAM_INSERT: CamKey[] = [
  {t: 0, pos: g(46.98, 4.18, 1.35), target: g(46.4, 4.55, 0.72), fov: 40},
  {t: 97.55 - 95.38, pos: g(46.96, 4.2, 1.33), target: g(46.38, 4.56, 0.7), fov: 39},
];
// D2-2b: low at the slab's south end looking down the slope: D (U8 behind it) climbing at them; the breaker runs in
// past the lens with his tool up between it and the pilot
export const CAM_2B: CamKey[] = [
  {t: 0, pos: g(45.0, 9.4, 1.6), target: g(51.9, 5.4, 1.9), fov: 46},
  {t: d(96.25, 96.85), pos: g(45.05, 9.38, 1.6), target: g(51.9, 5.35, 1.95), fov: 45},
];
// D2-2d: behind her at the slab's top edge, the tablet and its clip-on projector in the foreground: the click, the
// beam across the crater, the figures on the smoke, the machines turning to them
export const CAM_2D: CamKey[] = [
  {t: 0, pos: g(47.3, 7.6, 2.5), target: g(51.4, 1.2, 1.9), fov: 50},
  {t: 1.0, pos: g(47.35, 7.55, 2.52), target: g(51.9, 0.8, 1.9), fov: 49},
  {t: d(97.55, M.DECOY_HITa), pos: g(47.4, 7.5, 2.55), target: g(52.4, 0.4, 1.9), fov: 48},
];
// D2-3a: low on the slope west of B and A (the side the Crew will come from): B's fist through a figure, A's hammer,
// two drones diving through the light
export const CAM_3A: CamKey[] = [
  {t: 0, pos: g(51.0, 1.6, 1.5), target: g(53.4, -2.4, 1.9), fov: 46},
  {t: d(M.DECOY_HITa, 100.25), pos: g(51.05, 1.55, 1.5), target: g(53.5, -2.4, 1.95), fov: 45},
];
// D2-3b: high over heavy 1's right shoulder among the main body's ranks: it fires into the light across the crater
export const CAM_3B: CamKey[] = [
  {t: 0, pos: g(108.4, -7.0, 7.0), target: g(73.6, -16.0, 1.0), fov: 38},
  {t: d(100.25, 101.05), pos: g(108.1, -7.25, 6.9), target: g(72.4, -15.4, 0.8), fov: 37},
];
// D2-3c: a side track on the flank run: low on the rim south of their line, panning with them as they run east
// round the units' backs; A and B swing at the light again on the right
export const CAM_3C: CamKey[] = [
  {t: 0, pos: g(48.9, -2.1, 1.2), target: g(47.6, -4.4, 1.2), fov: 46},
  {t: 0.6, pos: g(49.5, -2.2, 1.2), target: g(49.3, -4.9, 1.2), fov: 46},
  {t: d(101.05, M.FLANK), pos: g(50.1, -2.35, 1.25), target: g(51.6, -4.8, 1.3), fov: 46},
];
// D2-4: three-quarter from the light's side (south-east of the fight, A's back on the right): the hook behind B's
// knee, the Director's bash into A's block, its backhand over the runner, the hammer on the plate
export const CAM_4: CamKey[] = [
  {t: 0, pos: g(50.0, -6.6, 1.7), target: g(53.3, -3.0, 1.5), fov: 44},
  {t: d(M.FLANK, 103.55), pos: g(50.05, -6.55, 1.7), target: g(53.3, -3.1, 1.45), fov: 43},
];
// D2-4b: the pry, a clean insert from behind B (north): its back plate face-on, the fork under the edge, the bar and
// both hands, the pop, the cables; the Director is pressed back off to the left, out of the line
export const CAM_4B: CamKey[] = [
  {t: 0, pos: g(53.3, -7.0, 1.8), target: g(51.85, -3.75, 1.35), fov: 23},
  {t: d(103.55, 104.42), pos: g(53.28, -6.98, 1.8), target: g(51.85, -3.78, 1.3), fov: 23},
];
// D2-4c: back out, south of the fight: the hook the Director ducks, B going down, the breaker's swing parried, the shove
export const CAM_4C: CamKey[] = [
  {t: 0, pos: g(50.0, -7.6, 2.0), target: g(53.0, -2.6, 1.3), fov: 44},
  {t: d(104.42, M.TETHER), pos: g(50.0, -7.6, 2.0), target: g(52.9, -2.5, 1.25), fov: 44},
];
// D2-5a: over the tether operator's right shoulder at post 3, down the slope to A: aim, fire, the bite, A's grab and
// haul, the wrap round the post
export const CAM_5A: CamKey[] = [
  {t: 0, pos: g(43.15, -8.6, 1.8), target: g(52.1, -8.95, 1.3), fov: 48},
  {t: d(M.TETHER, 107.0), pos: g(43.2, -8.6, 1.8), target: g(52.0, -9.1, 1.25), fov: 48},
];
// D2-5b: wide from the rim south-west of the girder: the reel drags A up the slope into C, both slam into the chord
export const CAM_5B: CamKey[] = [
  {t: 0, pos: g(47.2, -2.8, 1.9), target: g(51.6, -5.8, 1.5), fov: 48},
  {t: 1.2, pos: g(47.15, -2.85, 1.9), target: g(50.6, -7.0, 1.5), fov: 48},
  {t: d(107.0, 108.95), pos: g(47.1, -2.9, 1.92), target: g(50.0, -7.8, 1.5), fov: 48},
];
// D2-5c: the regroup on the crest, D coming up the slope at them (low from behind the runner's guard)
export const CAM_5C: CamKey[] = [
  {t: 0, pos: g(47.4, -7.8, 2.0), target: g(53.0, -3.6, 1.5), fov: 44},
  {t: d(108.95, 110.2), pos: g(47.45, -7.8, 2.0), target: g(52.4, -4.2, 1.4), fov: 44},
];
// D2-6: medium, low, side-on from the south-west: D's hook through his parry, the runner thrown back into the
// breaker's arms; the Director's plate on A's head at the pile beyond; lowered to his knees
export const CAM_6: CamKey[] = [
  {t: 0, pos: g(46.9, -3.3, 1.0), target: g(49.8, -6.3, 1.1), fov: 42},
  {t: 1.0, pos: g(46.8, -3.4, 0.98), target: g(49.5, -6.5, 1.0), fov: 42},
  {t: d(110.2, 112.9), pos: g(46.75, -3.45, 0.95), target: g(49.4, -6.6, 0.95), fov: 42},
];
// D2-7a: from the inner slope east of them, low: D's blow, the drone in its path (SHIELD); the Director's plate into
// D's side (COUNTER), the runner's adze behind its ankle
export const CAM_7A: CamKey[] = [
  {t: 0, pos: g(54.4, -4.5, 1.0), target: g(49.9, -6.4, 1.05), fov: 40},
  {t: d(112.9, 114.6), pos: g(54.45, -4.48, 1.02), target: g(49.85, -6.4, 1.0), fov: 40},
];
// D2-7b: D goes down; the camera eases back and up the slope: the seven on the crest behind the wreck barricade (A
// and C under the girder, B on the slope, D at their feet), the girder above; they breathe
export const CAM_7B: CamKey[] = [
  {t: 0, pos: g(54.6, -4.4, 1.05), target: g(49.6, -6.5, 1.0), fov: 41},
  {t: 1.0, pos: g(56.0, -3.6, 1.45), target: g(48.95, -6.4, 1.3), fov: 42},
  {t: d(114.6, M.P3), pos: g(56.6, -3.3, 1.6), target: g(48.7, -6.5, 1.35), fov: 42},
];

export const SHOT_CAMS: ShotCam[] = [
  {id: 'D2-1', start: M.P2, end: M.DECOY, keys: CAM_1, drift: 0.016},
  {id: 'D2-2a', start: M.DECOY, end: 96.25, keys: CAM_INSERT, drift: 0.008},
  {id: 'D2-2b', start: 96.25, end: 96.85, keys: CAM_2B, drift: 0.018},
  {id: 'D2-2c', start: 96.85, end: 97.55, keys: CAM_INSERT.map((k) => ({...k, t: k.t - (96.85 - M.DECOY)})), drift: 0.008},
  {id: 'D2-2d', start: 97.55, end: M.DECOY_HITa, keys: CAM_2D, drift: 0.012},
  {id: 'D2-3a', start: M.DECOY_HITa, end: 100.25, keys: CAM_3A, drift: 0.016},
  {id: 'D2-3b', start: 100.25, end: 101.05, keys: CAM_3B, drift: 0.018},
  {id: 'D2-3c', start: 101.05, end: M.FLANK, keys: CAM_3C, drift: 0.018},
  {id: 'D2-4', start: M.FLANK, end: 103.55, keys: CAM_4, drift: 0.02},
  {id: 'D2-4b', start: 103.55, end: 104.42, keys: CAM_4B, drift: 0.014},
  {id: 'D2-4c', start: 104.42, end: M.TETHER, keys: CAM_4C, drift: 0.02},
  {id: 'D2-5a', start: M.TETHER, end: 107.0, keys: CAM_5A, drift: 0.014},
  {id: 'D2-5b', start: 107.0, end: 108.95, keys: CAM_5B, drift: 0.016},
  {id: 'D2-5c', start: 108.95, end: 110.2, keys: CAM_5C, drift: 0.018},
  {id: 'D2-6', start: 110.2, end: 112.9, keys: CAM_6, drift: 0.018},
  {id: 'D2-7a', start: 112.9, end: 114.6, keys: CAM_7A, drift: 0.016},
  {id: 'D2-7b', start: 114.6, end: M.P3, keys: CAM_7B, drift: 0.014},
];
