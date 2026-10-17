// D1-1 / D1-2: the run-in. They charge down the ridge past a low camera at its south-east foot (dust off every
// footfall), then a tracking shot alongside the Director, south of him, across the avenue while the machines' front
// line comes over the crater rim from screen right and the lines converge.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3, add3, lerp} from '../../../kit/math';
import {M} from '../../timing';
import {d1Items, d1FxAt} from './battle';
import {directorAt} from './crew';
import {G} from './motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

// ------------------------------------------------------------------ D1-1 (CHARGE 59.95–64.00)
// Low at the ridge's south-east foot looking north-west up the slope: they launch off the crest, come down the rubble
// diagonally and pass close by the lens to screen right (east), the van and the death slab on the way.
// (the leaning ridge slab at the SE foot fills the lower left: they vanish behind it on the way down and burst out
// round its east end, close past the lens)
const D11: CamKey[] = [
  {t: 0, pos: g(14.6, 10.9, 1.1), target: g(1.8, 1.6, 4.4), fov: 30},
  {t: 1.3, pos: g(14.6, 10.9, 1.05), target: g(5.5, 4.8, 2.4), fov: 34},
  {t: 2.5, pos: g(14.55, 10.85, 0.95), target: g(9.6, 5.8, 1.4), fov: 42},
  {t: 4.05, pos: g(14.6, 10.75, 0.85), target: g(18.5, 4.8, 1.05), fov: 46},
];
export const D1_1: React.FC = () => {
  const {t, T} = useShotTime(M.CHARGE);
  const cam = camPath(D11, t, 0.5);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.03} items={(v) => [...d1Items(v, T, {full: 22, far: 80}), ...f.items]} />;
};

// ------------------------------------------------------------------ D1-2 (64.00–68.30)
// Tracking alongside the Director, 2.5 m south of him, low: he runs east (screen right) across the avenue; past him
// the tether and the runner further north; ahead, the front line comes over the rim and runs at them.
const D12_T = [64.0, 65.0, 66.0, 67.0, 67.8, 68.3];
const D12: CamKey[] = D12_T.map((T, i) => {
  const lag = i === D12_T.length - 1 ? 0.35 : i === D12_T.length - 2 ? 0.12 : 0;
  const d = directorAt(T - lag).body.pos;
  const ahead = lerp(1.6, 2.4, i / (D12_T.length - 1));
  return {t: T - 64.0, pos: add3(d, {x: -0.7, y: 0.9, z: 2.6}), target: add3(d, {x: ahead, y: 1.2, z: -0.9}), fov: lerp(48, 50, i / (D12_T.length - 1))};
});
export const D1_2: React.FC = () => {
  const {t, T} = useShotTime(64.0);
  const cam = camPath(D12, t, 0.15);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.035} items={(v) => [...d1Items(v, T, {full: 24}), ...f.items]} />;
};
