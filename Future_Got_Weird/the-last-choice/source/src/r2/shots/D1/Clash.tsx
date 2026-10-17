// D1-3 (CLASH: the slam, then the line) and D1-4 (four close cuts). The same battle as every other D1 shot (crew.tsx / machines.ts); only
// the cameras differ, so positions and damage hold from the wide into the close cuts.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {d1Items, d1FxAt, D1Opts} from './battle';
import {breakerAt, runnerAt, tetherAt, directorPlate} from './crew';
import {G} from './motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

// ------------------------------------------------------------------ D1-3 (CLASH 68.30–72.00): the slam, then the line
// Cut on the beat to a low, medium-wide three-quarter from the south-south-west, 3.4 m off the contact (he left, U1
// right, near profile so the plate arm shows between them): the plate meets U1's chest big in frame, girder and the
// avenue's north side behind; U1 staggers back into U3. From 1.2 s the camera cranes up and back (over the breaker,
// who fights U4 just behind it) so the engagement spreads around them: U2 coming in, the runner on the left, the rest
// of the line along the rim, the girder above.
const D13: CamKey[] = [
  {t: 0, pos: g(40.3, 2.6, 0.75), target: g(41.8, -0.7, 1.3), fov: 42},
  {t: 0.5, pos: g(40.3, 2.6, 0.75), target: g(41.95, -0.7, 1.3), fov: 42},
  {t: 1.2, pos: g(40.25, 2.7, 0.85), target: g(42.0, -0.65, 1.25), fov: 43},
  {t: 2.4, pos: g(39.95, 3.3, 1.9), target: g(41.75, -0.55, 1.05), fov: 49},
  {t: 72.0 - M.CLASH, pos: g(39.6, 3.9, 2.7), target: g(41.55, -0.7, 0.95), fov: 53},
];
export const D1_3: React.FC = () => {
  const {t, T} = useShotTime(M.CLASH);
  const cam = camPath(D13, t, 0.5);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake * 0.8} drift={0.02} items={(v) => [...d1Items(v, T, {full: 30, tweak: {director: {anchor: directorPlate(T)}}}), ...f.items]} />;
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
// 77.2 the flare carrier strikes and lobs a flare into a unit's eye (low behind his left shoulder, closer: the throw
// crosses the frame to U6). (The allied drone's harry of an enemy drone is left to D2.)
const C4: CamKey[] = [
  {t: 0, pos: g(35.55, 9.75, 0.95), target: g(39.3, 7.1, 1.65), fov: 40},
  {t: 1.96, pos: g(35.75, 9.6, 0.9), target: g(39.6, 7.15, 1.5), fov: 39},
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
