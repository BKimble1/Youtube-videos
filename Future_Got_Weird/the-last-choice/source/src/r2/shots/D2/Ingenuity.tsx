// D2-1 … D2-3: the smoke, the decoy and the machines striking at the light. Physical cameras on the crater's west rim;
// one battle (battle.tsx) sampled by every camera.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {d2Items, d2FxAt} from './battle';
import {G} from '../D1/motion';
import {TabletInsert} from './Insert';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

// ------------------------------------------------------------------ D2-1 (P2 94.30–95.38): the canisters
// Medium, low from the south-west by the slab's south end: the flare carrier rises off his knee, turns to the slab,
// pulls a pin and lobs a canister over it into the crater, then the second; the others crouched along the slab.
export const D21: CamKey[] = [
  {t: 0, pos: g(51.25, 9.05, 1.4), target: g(46.95, 5.0, 1.4), fov: 30},
  {t: 0.6, pos: g(51.2, 9.0, 1.42), target: g(46.95, 4.95, 1.6), fov: 30},
  {t: 95.38 - M.P2, pos: g(51.1, 8.95, 1.45), target: g(47.05, 4.85, 1.9), fov: 31},
];
export const D2_1: React.FC = () => {
  const {t, T} = useShotTime(M.P2);
  const cam = camPath(D21, t, 0.6);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.016} items={(v) => [...d2Items(v, T, {full: 30}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-2a (DECOY 95.38–97.55): the tablet insert
export const D2_2a: React.FC = () => {
  const {t, T} = useShotTime(M.DECOY);
  return <TabletInsert t={t} T={T} />;
};

// ------------------------------------------------------------------ D2-2b (97.55–99.50): the light figures appear
// Wide from behind and above the slab's south end: she sets the tablet on the slab's top edge and switches it on; the
// beam crosses the crater and giant walking figures of light appear on the white smoke; the machines turn to them.
export const D22: CamKey[] = [
  {t: 0, pos: g(43.9, 9.6, 3.3), target: g(54.5, 0.8, 0.4), fov: 50},
  {t: 0.8, pos: g(44.05, 9.45, 3.35), target: g(55.6, 0.3, 0.9), fov: 49},
  {t: 99.5 - 97.55, pos: g(44.35, 9.15, 3.4), target: g(56.8, -0.3, 1.4), fov: 47},
];
export const D2_2b: React.FC = () => {
  const {t, T} = useShotTime(97.55);
  const cam = camPath(D22, t, 0.5);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.012} items={(v) => [...d2Items(v, T, {full: 28}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-3a (DECOY_HITa/b 99.50–100.25): strikes through the light
// Wide, low on the west rim south of the slab, looking east-north-east across the crater: a unit's fist goes through a
// figure's leg (HITa); another hammers through one (HITb) as two drones dive through the giants' chests.
export const D23a: CamKey[] = [
  {t: 0, pos: g(46.2, 8.4, 2.0), target: g(60.5, 0.6, 1.4), fov: 50},
  {t: 100.25 - 99.5, pos: g(46.35, 8.28, 2.03), target: g(60.75, 0.4, 1.45), fov: 49},
];
export const D2_3a: React.FC = () => {
  const {t, T} = useShotTime(M.DECOY_HITa);
  const cam = camPath(D23a, t, 0.5);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.014} items={(v) => [...d2Items(v, T, {full: 30}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-3b (DECOY_HITc 100.25–101.05): heavy 1 fires into the smoke
// Medium, high over heavy 1's right shoulder among the main body's ranks: it strides up the north side, its launcher
// swings onto the light far across the crater, fires (100.4, recoil); the round streaks west over the vanguard and
// bursts inside the white wall among the giants' feet (100.6).
export const D23b: CamKey[] = [
  {t: 0, pos: g(108.4, -7.0, 7.0), target: g(73.6, -16.0, 1.0), fov: 38},
  {t: 101.05 - 100.25, pos: g(108.1, -7.25, 6.9), target: g(72.4, -15.4, 0.8), fov: 37},
];
export const D2_3b: React.FC = () => {
  const {t, T} = useShotTime(100.25);
  const cam = camPath(D23b, t, 0.5);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.018} items={(v) => [...d2Items(v, T, {full: 22}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-3c (101.05–102.20): the light walks on
// Closer, from the west rim: the blast's smoke rolling through the white wall, the giant figures walk on unharmed; the
// units swing at them again (101.3, 101.45) and the reserve runs in from the east rim.
export const D23c: CamKey[] = [
  {t: 0, pos: g(48.6, 6.9, 1.6), target: g(58.4, 0.6, 1.9), fov: 40},
  {t: 102.2 - 101.05, pos: g(48.85, 6.7, 1.62), target: g(58.6, 0.4, 1.95), fov: 40},
];
export const D2_3c: React.FC = () => {
  const {t, T} = useShotTime(101.05);
  const cam = camPath(D23c, t, 0.5);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.016} items={(v) => [...d2Items(v, T, {full: 26}), ...f.items]} />;
};
