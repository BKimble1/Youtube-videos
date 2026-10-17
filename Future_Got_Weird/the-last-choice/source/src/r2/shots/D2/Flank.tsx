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
// Low three-quarter along the girder from its low end: the Crew crouched at the rim crest under the truss; they break
// from cover and hit the distracted units from behind — the breaker's knee strike, the Director's plate into A's back,
// the runner's pry and rip. The light figures walk on in the smoke beyond.
const D24: CamKey[] = [
  {t: 0, pos: g(46.4, -6.6, 0.75), target: g(52.6, -8.6, 1.0), fov: 46},
  {t: 1.4, pos: g(46.65, -6.65, 0.8), target: g(53.2, -8.3, 0.95), fov: 45},
  {t: M.TETHER - M.FLANK, pos: g(47.0, -6.4, 0.85), target: g(53.4, -7.6, 0.85), fov: 45},
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
const D25: CamKey[] = [
  {t: 0, pos: g(46.0, -3.4, 1.7), target: g(50.4, -9.0, 1.2), fov: 52},
  {t: 1.6, pos: g(46.1, -3.5, 1.7), target: g(50.0, -9.3, 1.3), fov: 51},
  {t: 2.6, pos: g(46.3, -3.6, 1.65), target: g(49.0, -9.9, 1.35), fov: 50},
  {t: M.KNOCKBACK - M.TETHER, pos: g(46.45, -3.7, 1.65), target: g(49.2, -9.4, 1.2), fov: 50},
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
const D26: CamKey[] = [
  {t: 0, pos: g(47.35, -2.85, 1.05), target: g(49.7, -6.3, 1.15), fov: 42},
  {t: 1.0, pos: g(47.25, -2.95, 1.0), target: g(49.4, -6.5, 1.05), fov: 42},
  {t: M.SHIELD - M.KNOCKBACK, pos: g(47.2, -3.0, 0.95), target: g(49.3, -6.6, 0.95), fov: 42},
];
export const D2_6: React.FC = () => {
  const {t, T} = useShotTime(M.KNOCKBACK);
  const cam = camPath(D26, t, 0.55);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={0.018} items={(v) => [...d2Items(v, T, {full: 30, girder: true}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-7a (SHIELD 113.20, COUNTER 114.12 → 114.80)
// Medium: D swings at the runner on his knees; the allied drone darts between and takes the blow (sparks, wobble); the
// Director comes in from the left and drives his plate into D's side: it goes down.
const D27a: CamKey[] = [
  {t: 0, pos: g(47.6, -2.9, 1.0), target: g(49.9, -6.0, 1.15), fov: 44},
  {t: 114.8 - M.SHIELD, pos: g(47.75, -3.0, 0.98), target: g(50.3, -6.2, 1.0), fov: 44},
];
export const D2_7a: React.FC = () => {
  const {t, T} = useShotTime(M.SHIELD);
  const cam = camPath(D27a, t, 0.55);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={0.018} items={(v) => [...d2Items(v, T, {full: 30, girder: true}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-7b (114.80–P3 116.92): BRIGHT
// Wide, low on the crater's inner slope below them, looking up west at the seven on the rim crest against the low sun:
// the wrecks in the foreground, the girder above; they breathe; the others come in along the rim. A moment of success.
const D27b: CamKey[] = [
  {t: 0, pos: g(53.4, -4.0, 0.7), target: g(48.4, -6.3, 1.55), fov: 46},
  {t: M.P3 - 114.8, pos: g(53.15, -4.15, 0.8), target: g(48.3, -6.4, 1.7), fov: 45},
];
export const D2_7b: React.FC = () => {
  const {t, T} = useShotTime(114.8);
  const cam = camPath(D27b, t, 0.5);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} set={SET_D2} lights={f.lights} shake={f.shake} drift={0.012} items={(v) => [...d2Items(v, T, {full: 30, girder: true}), ...f.items]} />;
};
