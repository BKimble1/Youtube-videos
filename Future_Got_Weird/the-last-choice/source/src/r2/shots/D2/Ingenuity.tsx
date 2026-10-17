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
const D21: CamKey[] = [
  {t: 0, pos: g(49.65, 7.65, 1.35), target: g(46.85, 5.0, 1.15), fov: 40},
  {t: 0.6, pos: g(49.6, 7.6, 1.4), target: g(46.9, 4.95, 1.5), fov: 41},
  {t: 95.38 - M.P2, pos: g(49.5, 7.55, 1.45), target: g(47.1, 4.8, 1.85), fov: 42},
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
const D22: CamKey[] = [
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

// ------------------------------------------------------------------ D2-3a (DECOY_HIT 99.50–100.70): strikes through the light
// Wide, low on the west rim south of the slab, looking east-north-east across the crater: a unit's fist goes through a
// figure's leg (HITa), another hammers through one (HITb) as two drones dive through the giants' chests, and far beyond
// the smoke heavy 1 fires into it (HITc): the blast inside the white wall.
const D23a: CamKey[] = [
  {t: 0, pos: g(46.2, 8.4, 2.0), target: g(60.5, 0.6, 1.4), fov: 50},
  {t: 100.7 - 99.5, pos: g(46.45, 8.2, 2.05), target: g(60.9, 0.3, 1.5), fov: 49},
];
export const D2_3a: React.FC = () => {
  const {t, T} = useShotTime(M.DECOY_HITa);
  const cam = camPath(D23a, t, 0.5);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.014} items={(v) => [...d2Items(v, T, {full: 30}), ...f.items]} />;
};

// ------------------------------------------------------------------ D2-3b (100.70–102.20): the fist passes through the light
// Medium, low at the smoke's edge behind the unit at figure 2: the blast's smoke still rolling, it swings again (101.3),
// its fist goes through the giant's leg — the light lies on its arm, the figure walks on; beyond, another (101.45).
const D23b: CamKey[] = [
  {t: 0, pos: g(54.0, 2.6, 1.35), target: g(58.8, 0.6, 1.9), fov: 44},
  {t: 102.2 - 100.7, pos: g(54.2, 2.5, 1.4), target: g(59.0, 0.7, 2.0), fov: 43},
];
export const D2_3b: React.FC = () => {
  const {t, T} = useShotTime(100.7);
  const cam = camPath(D23b, t, 0.5);
  const f = d2FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.018} items={(v) => [...d2Items(v, T, {full: 22}), ...f.items]} />;
};
