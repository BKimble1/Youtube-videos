// D2-4 … D2-7: along the girder — the flank attack, the tether's crash into the girder, the catch, the drone's shield,
// the counter, BRIGHT. Low physical cameras on the crater's north-west slope; the girder redrawn so it can shudder.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {d2Items, d2FxAt, SET_D2} from './battle';
import {G} from '../D1/motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

// ------------------------------------------------------------------ D2-4 (FLANK 102.20–105.84)
// Low three-quarter from the rim crest at the girder's foot, the truss across the top of the frame: the two units watch
// the light in the smoke, their backs to us; the Crew break from cover past the lens along the girder and hit them from
// behind — the breaker's knee strike, the Director's plate into A's back, the runner's pry and rip; then they fall back.
export const D24: CamKey[] = [
  {t: 0, pos: g(46.9, -10.3, 1.15), target: g(53.8, -6.4, 2.75), fov: 54},
  {t: 1.6, pos: g(47.05, -10.25, 1.15), target: g(54.0, -6.6, 2.55), fov: 53},
  {t: M.TETHER - M.FLANK, pos: g(47.15, -10.15, 1.18), target: g(53.6, -6.8, 2.4), fov: 53},
];
export const D2_4: React.FC = () => {
  const {t, T} = useShotTime(M.FLANK);
  const cam = camPath(D24, t, 0.55);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={0.02} items={(v) => [...d2Items(v, T, {full: 30, girder: true}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-5 (TETHER 105.84–110.46)
// Wide on the girder from the rim south of it: the tether operator by post 3 fires at A, whips the cable round the post,
// the reel pulls; A is dragged along the girder into C and both slam into the truss; the girder shudders.
export const D25: CamKey[] = [
  {t: 0, pos: g(42.2, -7.4, 1.6), target: g(50.8, -9.4, 1.5), fov: 50},
  {t: 1.6, pos: g(42.3, -7.45, 1.62), target: g(50.4, -9.6, 1.5), fov: 50},
  {t: 2.6, pos: g(42.45, -7.5, 1.6), target: g(49.6, -9.8, 1.45), fov: 49},
  {t: M.KNOCKBACK - M.TETHER, pos: g(42.6, -7.5, 1.6), target: g(49.6, -9.5, 1.35), fov: 49},
];
export const D2_5: React.FC = () => {
  const {t, T} = useShotTime(M.TETHER);
  const cam = camPath(D25, t, 0.55);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={0.016} items={(v) => [...d2Items(v, T, {full: 30, girder: true}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-6 (KNOCKBACK 110.46, CATCH 111.38 → 113.20)
// Medium, low, side-on from the south-west: D's backhand knocks the runner back; two stumbling steps and he falls into
// the breaker's arms; the breaker takes his weight and lowers him to his knees.
export const D26: CamKey[] = [
  {t: 0, pos: g(46.9, -3.3, 1.0), target: g(49.8, -6.3, 1.1), fov: 42},
  {t: 1.0, pos: g(46.8, -3.4, 0.98), target: g(49.5, -6.5, 1.0), fov: 42},
  {t: M.SHIELD - M.KNOCKBACK, pos: g(46.75, -3.45, 0.95), target: g(49.4, -6.6, 0.95), fov: 42},
];
export const D2_6: React.FC = () => {
  const {t, T} = useShotTime(M.KNOCKBACK);
  const cam = camPath(D26, t, 0.55);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={0.018} items={(v) => [...d2Items(v, T, {full: 30, girder: true}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-7 (SHIELD 113.20, COUNTER 114.12, BRIGHT 115.5 → P3)
// One shot from the crater's inner slope east of them, low, looking west into the low sun. Medium: D swings at the
// runner on his knees; the allied drone darts in between and takes the blow (sparks, wobble); the Director comes from
// the wreck pile and drives his plate into D's right side — it goes over away from us and down. Then the camera eases
// back and up the slope: the seven on the rim crest, the wrecks in the foreground, the girder above; they breathe.
export const D27: CamKey[] = [
  {t: 0, pos: g(54.4, -4.5, 1.0), target: g(49.9, -6.4, 1.05), fov: 40},
  {t: 1.25, pos: g(54.5, -4.45, 1.02), target: g(49.85, -6.4, 1.0), fov: 40},
  {t: 2.45, pos: g(56.0, -3.6, 1.45), target: g(48.95, -6.4, 1.3), fov: 42},
  {t: M.P3 - M.SHIELD, pos: g(56.6, -3.3, 1.6), target: g(48.7, -6.5, 1.35), fov: 42},
];
export const D2_7: React.FC = () => {
  const {t, T} = useShotTime(M.SHIELD);
  const cam = camPath(D27, t, 0.55);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={0.016} items={(v) => [...d2Items(v, T, {full: 30, girder: true}), ...f.items]} />;
};
