// D1-3 (CLASH, wide) and D1-4 (four close cuts). The same battle as every other D1 shot (crew.tsx / machines.ts); only
// the cameras differ, so positions and damage hold from the wide into the close cuts.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {d1Items, d1FxAt, D1Opts} from './battle';
import {breakerAt, runnerAt, tetherAt} from './crew';
import {G} from './motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

// ------------------------------------------------------------------ D1-3 (CLASH 68.30–72.00): the wide
// From the south sidewalk among the burning facade's spill, 3–4 m up, looking north at the crater's west rim: his
// plate slams into the first unit, which staggers back into the one behind; along the rim everyone engages.
const D13: CamKey[] = [
  {t: 0, pos: g(34.6, 11.8, 4.6), target: g(41.6, -0.6, 1.0), fov: 33},
  {t: 72.0 - M.CLASH, pos: g(35.2, 11.5, 4.4), target: g(41.3, -1.0, 1.0), fov: 34},
];
export const D1_3: React.FC = () => {
  const {t, T} = useShotTime(M.CLASH);
  const cam = camPath(D13, t, 0.5);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake * 0.6} drift={0.02} items={(v) => [...d1Items(v, T, {full: 24}), ...f.items]} />;
};

// ------------------------------------------------------------------ D1-4 (72.00–78.46): four close cuts
// 72.0 the breaker breaks a knee joint (low, from the south): sparks, the unit drops to a knee.
const C1: CamKey[] = [
  {t: 0, pos: g(40.15, 6.35, 0.5), target: g(40.85, 3.55, 0.85), fov: 46},
  {t: 2.0, pos: g(40.35, 6.25, 0.48), target: g(41.0, 3.6, 0.7), fov: 44},
];
// 74.0 the tether yanks one off balance (behind her right shoulder, low): fire, bite, the leg pulled, it goes over.
const C2: CamKey[] = [
  {t: 0, pos: g(33.55, -3.85, 1.0), target: g(38.1, -7.5, 0.95), fov: 46},
  {t: 1.8, pos: g(33.6, -3.95, 0.95), target: g(38.4, -7.6, 0.7), fov: 45},
];
// 75.8 the runner pries the back plate off the kneeling unit and rips its cables (front of him, low).
const C3: CamKey[] = [
  {t: 0, pos: g(40.35, 6.25, 0.75), target: g(41.95, 4.0, 0.95), fov: 40},
  {t: 1.4, pos: g(40.5, 6.15, 0.72), target: g(41.9, 3.95, 0.95), fov: 38},
];
// 77.2 the allied drone harries an enemy drone diving on the flare carrier; his flare blinds a unit's eye.
const C4: CamKey[] = [
  {t: 0, pos: g(34.0, 10.2, 1.05), target: g(41.4, 5.9, 2.4), fov: 44},
  {t: 1.26, pos: g(34.15, 10.1, 1.0), target: g(41.5, 6.3, 1.95), fov: 43},
];
// each close cut anchors the acting person's rig at the contact (weak perspective projects true there)
const CUTS: {a: number; b: number; keys: CamKey[]; opts?: (T: number) => D1Opts}[] = [
  {a: 72.0, b: 74.0, keys: C1, opts: (T) => ({tweak: {breaker: {anchor: breakerAt(T).pts?.front}}})},
  {a: 74.0, b: 75.8, keys: C2, opts: (T) => ({tweak: {tether: {anchor: tetherAt(T).pts?.muzzle}}})},
  {a: 75.8, b: 77.2, keys: C3, opts: (T) => ({tweak: {runner: {anchor: runnerAt(T).pts?.edge ?? runnerAt(T).pts?.cablesHand}}})},
  {a: 77.2, b: M.BR1, keys: C4},
];
const cut = (i: number): React.FC => {
  const c = CUTS[i];
  const Shot: React.FC = () => {
    const {t, T} = useShotTime(c.a);
    const cam = camPath(c.keys, t, 0.5);
    const f = d1FxAt(T);
    const o = c.opts ? c.opts(T) : {};
    return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.02} items={(v) => [...d1Items(v, T, {full: 30, ...o}), ...f.items]} />;
  };
  return Shot;
};
export const D1_4a = cut(0), D1_4b = cut(1), D1_4c = cut(2), D1_4d = cut(3);
export const D1_4_CUTS = CUTS.map((c) => ({a: c.a, b: c.b}));
