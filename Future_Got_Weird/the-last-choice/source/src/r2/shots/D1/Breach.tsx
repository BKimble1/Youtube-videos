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
  {t: 0, pos: g(35.95, 1.65, 1.0), target: g(39.4, -3.4, 1.15), fov: 47},
  {t: 1.3, pos: g(36.05, 1.55, 0.97), target: g(39.55, -3.4, 1.05), fov: 46},
  {t: M.BR4 - M.BR3, pos: g(36.25, 1.4, 0.98), target: g(39.8, -3.3, 0.92), fov: 45},
];
export const D1_7: React.FC = () => {
  const {t, T} = useShotTime(M.BR3);
  const cam = camPath(D17_KEYS, t, 0.6);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.02} items={(v) => [...d1Items(v, T, {full: 30}), ...f.items]} />;
};

// ------------------------------------------------------------------ D1-8 (BR4 85.64–89.78): the shoulder drive
// Low behind him, off his left (plate) shoulder, through the gap between rim plates 7 and 8: he gathers, bursts two strides into U3, drives it up the rim's west
// face, shoves; it staggers onto the crest and goes over backward. The camera follows him up the slope and cranes over
// his left shoulder as he stands on the crest: the gap opens on the crater — U3 sliding down the inner slope below,
// the bowl, and the reserve's line on the far rim.
const ga = (x: number, y: number, z: number): V3 => ({x, y, z});
const D18_KEYS: CamKey[] = [
  // (the path stays south of U1's wreck, which lies NW from its feet at (41.6, −1.9), and of rim plate 8)
  {t: 0, pos: g(40.0, -1.55, 0.55), target: g(44.4, -0.75, 1.2), fov: 42},
  {t: 0.3, pos: g(40.1, -1.55, 0.53), target: g(44.4, -0.75, 1.18), fov: 42},
  {t: EV.br4 - M.BR4, pos: g(41.3, -1.5, 0.6), target: g(44.8, -0.8, 1.3), fov: 42},
  {t: 1.3, pos: g(42.6, -1.55, 0.7), target: g(46.1, -0.8, 1.35), fov: 42},
  {t: 1.8, pos: g(43.3, -1.75, 0.95), target: g(47.1, -0.8, 1.3), fov: 43},
  {t: 2.55, pos: ga(43.9, 1.95, -2.3), target: ga(48.7, 0.45, -0.5), fov: 46},
  {t: 3.25, pos: ga(44.35, 2.45, -2.6), target: ga(49.6, 0.7, -0.45), fov: 49},
  {t: M.GAIN1 - M.BR4, pos: ga(44.45, 2.5, -2.65), target: ga(49.7, 0.9, -0.4), fov: 50},
];
export const D1_8: React.FC = () => {
  const {t, T} = useShotTime(M.BR4);
  const cam = camPath(D18_KEYS, t, 0.5);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.022} items={(v) => [...d1Items(v, T, {full: 30, tweak: {director: {anchor: directorPlate(T)}}}), ...f.items]} />;
};
