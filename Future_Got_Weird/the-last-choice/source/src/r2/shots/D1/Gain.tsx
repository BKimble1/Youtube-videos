// D1-9 (GAIN1 89.78 → P2 94.30): position gained. They push through the gap onto the crater's west rim and drop into
// cover behind a fractured slab standing on its inner slope (./props.ts). BREATH: looks pass between them, the
// Director pants, the dented plate on his forearm. Low on the rim's outer slope, south-west of them.
import React from 'react';
import {Stage, useShotTime, camPath, CamKey} from '../../film/stage';
import {V3} from '../../../kit/math';
import {M} from '../../timing';
import {d1Items, d1FxAt} from './battle';
import {G} from './motion';

const g = (x: number, z: number, up: number): V3 => ({x, y: G(x, z) + up, z});

const KEYS: CamKey[] = [
  {t: 0, pos: g(43.0, 4.4, 1.35), target: g(45.7, -0.2, 1.35), fov: 44},
  {t: M.GAIN2 - M.GAIN1, pos: g(43.25, 3.85, 1.3), target: g(46.4, 1.9, 1.25), fov: 46},
  {t: M.GAIN2 - M.GAIN1 + 1.0, pos: g(43.45, 3.5, 1.25), target: g(46.75, 3.2, 1.15), fov: 45},
  {t: M.P2 - M.GAIN1, pos: g(43.7, 3.4, 1.2), target: g(46.8, 3.1, 1.15), fov: 42},
];

export const D1_9: React.FC = () => {
  const {t, T} = useShotTime(M.GAIN1);
  const cam = camPath(KEYS, t, 0.55);
  const f = d1FxAt(T);
  return <Stage T={T} cam={cam} lights={f.lights} shake={f.shake} drift={0.014} items={(v) => [...d1Items(v, T, {full: 30}), ...f.items]} />;
};
