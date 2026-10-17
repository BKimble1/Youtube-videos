// D1-5 … D1-8: the four decisive contacts (BR1 → BR4). Low, physical cameras on the real rim; every contact solved to
// world points (crew.tsx / machines.ts) so the cut-to-cut geography holds.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3, add3} from '../../../kit/math';
import {M} from '../../timing';
import {d1Items, d1FxAt} from './battle';
import {EV} from './machines';
import {directorPlate, breakerAt} from './crew';
import {G} from './motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

// ------------------------------------------------------------------ D1-5 (BR1 78.46–81.34): the plate takes the swing
// Low three-quarter from the south-south-east: the Director left facing right (east), U1 right facing left; its left
// arm swings on the camera side. The camera eases left with his skid.
const D15_KEYS: CamKey[] = [
  {t: 0, pos: g(43.4, 2.7, 0.72), target: g(41.25, -0.8, 1.25), fov: 35},
  {t: 0.62, pos: g(43.35, 2.72, 0.72), target: g(41.2, -0.8, 1.25), fov: 35},
  {t: 1.3, pos: g(43.1, 2.85, 0.74), target: g(40.85, -0.8, 1.2), fov: 36},
  {t: M.BR2 - M.BR1, pos: g(42.85, 3.0, 0.78), target: g(40.8, -0.6, 1.18), fov: 38},
];
export const D1_5: React.FC = () => {
  const {t, T} = useShotTime(M.BR1);
  const cam = camPath(D15_KEYS, t, 0.6);
  const f = d1FxAt(T);
  const plate = directorPlate(T);
  return (
    <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.012}
      items={(v) => [...d1Items(v, T, {tweak: {director: {anchor: plate}}, full: 40}), ...f.items]} />
  );
};

// ------------------------------------------------------------------ D1-6 (BR2 81.34–82.80): the breaker smashes U1's chest plate
// Medium, low from the west-south-west: U1's chest toward the lens, the breaker rushing in on the right and swinging
// down onto it; the Director, driven back, on the left. The plate flies off up and left; U1 reels north (toward U2).
const D16_KEYS: CamKey[] = [
  {t: 0, pos: g(39.75, 2.85, 0.85), target: g(41.5, -0.6, 1.42), fov: 40},
  {t: 0.44, pos: g(39.85, 2.75, 0.82), target: g(41.55, -0.65, 1.42), fov: 39},
  {t: M.BR3 - M.BR2, pos: g(40.0, 2.65, 0.88), target: g(41.5, -1.15, 1.3), fov: 40},
];
export const D1_6: React.FC = () => {
  const {t, T} = useShotTime(M.BR2);
  const cam = camPath(D16_KEYS, t, 0.6);
  const f = d1FxAt(T);
  // the breaker's rig projects true at his front hand (the tool between his hands lands on the chest plate)
  const anchor = breakerAt(T).pts?.front;
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.015} items={(v) => [...d1Items(v, T, {full: 40, tweak: {breaker: {anchor}}}), ...f.items]} />;
};

// ------------------------------------------------------------------ D1-7 (BR3 82.80–85.64): the tether swings U1 into U2
// Wide-ish from the west-south-west: the tether operator left, the cable across to U1; U1, already reeling, is hauled
// north-west into U2 and both go down; the Director right, the breaker beyond.
const D17_KEYS: CamKey[] = [
  {t: 0, pos: g(36.3, 1.45, 0.95), target: g(39.9, -3.1, 1.15), fov: 46},
  {t: 1.3, pos: g(36.4, 1.35, 0.92), target: g(40.0, -3.15, 1.05), fov: 45},
  {t: M.BR4 - M.BR3, pos: g(36.6, 1.2, 0.95), target: g(40.2, -3.1, 0.9), fov: 44},
];
export const D1_7: React.FC = () => {
  const {t, T} = useShotTime(M.BR3);
  const cam = camPath(D17_KEYS, t, 0.6);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.02} items={(v) => [...d1Items(v, T, {full: 30}), ...f.items]} />;
};

// ------------------------------------------------------------------ D1-8 (BR4 85.64–89.78): the shoulder charge
// Behind the Director, low: he gathers, charges U3 standing last in the gap, drives it back over the rim; it goes over
// into the crater. The camera follows him to the rim: through the gap, the crater floor, the reserve and drones.
const D18_KEYS: CamKey[] = [
  {t: 0, pos: g(39.2, -0.15, 1.05), target: g(44.4, -0.95, 1.3), fov: 40},
  {t: 0.5, pos: g(39.35, -0.15, 1.05), target: g(44.4, -0.95, 1.3), fov: 40},
  {t: 1.0, pos: g(40.4, -0.25, 1.1), target: g(44.8, -1.0, 1.25), fov: 41},
  {t: 1.9, pos: g(41.9, -0.3, 1.3), target: g(47.0, -1.1, 0.9), fov: 43},
  {t: 3.0, pos: g(42.7, -0.35, 1.45), target: g(50.0, -1.0, 1.3), fov: 44},
  {t: M.GAIN1 - M.BR4, pos: g(42.95, -0.35, 1.5), target: g(52.0, -0.9, 1.6), fov: 44},
];
export const D1_8: React.FC = () => {
  const {t, T} = useShotTime(M.BR4);
  const cam = camPath(D18_KEYS, t, 0.5);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.022} items={(v) => [...d1Items(v, T, {full: 30, tweak: {director: {anchor: directorPlate(T)}}}), ...f.items]} />;
};
