// D1-1 / D1-2 / D1-2b: the run-in, committed into contact with no dead time. They charge down the ridge past a low
// camera at its south-east foot (dust off every footfall); a tracking shot alongside the Director across the avenue as
// the machines' front line comes over the crater rim from screen right; then low over his shoulder as U1 picks him
// (eye amber), lowers into its last strides and raises its arm — the machines strike first (cut on the beat to D1-3).
import {CamKey} from '../../film/stage';
import {add3, lerp} from '../../../kit/math';
import {M} from '../../timing';
import {directorAt} from './crew';
import {shotOf, g} from './shot';

// ------------------------------------------------------------------ D1-1 (CHARGE 59.95–64.00)
// Low at the ridge's south-east foot looking north-west up the slope: they launch off the crest, come down the rubble
// diagonally and pass close by the lens to screen right (east), the van and the death slab on the way.
const D11: CamKey[] = [
  {t: 0, pos: g(14.6, 10.9, 1.1), target: g(1.8, 1.6, 4.4), fov: 30},
  {t: 1.3, pos: g(14.6, 10.9, 1.05), target: g(5.5, 4.8, 2.4), fov: 34},
  {t: 2.5, pos: g(14.55, 10.85, 0.95), target: g(9.6, 5.8, 1.4), fov: 42},
  {t: 4.05, pos: g(14.6, 10.75, 0.85), target: g(18.5, 4.8, 1.05), fov: 46},
];
export const D1_1 = shotOf(M.CHARGE, D11, {drift: 0.03});

// ------------------------------------------------------------------ D1-2 (64.00–66.50)
// Tracking alongside the Director, 2.5 m south of him, low: he runs east (screen right) across the avenue; past him
// the tether and the runner further north; ahead, the front line comes over the rim and runs at them.
const D12_T = [64.0, 64.8, 65.6, 66.5];
const D12: CamKey[] = D12_T.map((T, i) => {
  const d = directorAt(T).body.pos;
  const ahead = lerp(1.6, 2.2, i / (D12_T.length - 1));
  return {t: T - 64.0, pos: add3(d, {x: -0.7, y: 0.9, z: 2.6}), target: add3(d, {x: ahead, y: 1.2, z: -0.9}), fov: lerp(48, 50, i / (D12_T.length - 1))};
});
export const D1_2 = shotOf(64.0, D12, {ease: 0.15, drift: 0.035});

// ------------------------------------------------------------------ D1-2b (66.50–68.30): over his shoulder at U1
// Low behind his left (plate) shoulder, keeping pace: U1 comes over the last of the rim toward him, eye amber, and
// raises its right arm for a running hammer; the plate comes up. The camera lags as he accelerates into it.
const D12B_T = [66.5, 67.2, 67.8, 68.3];
const D12B: CamKey[] = D12B_T.map((T, i) => {
  const d = directorAt(T - (i === 3 ? 0.12 : 0)).body.pos;
  const back = lerp(2.1, 2.6, i / 3);
  return {t: T - 66.5, pos: add3(d, {x: -back, y: 1.5, z: -1.25}), target: {x: 42.4, y: d.y + 1.45, z: -0.1}, fov: lerp(42, 36, i / 3)};
});
export const D1_2b = shotOf(66.5, D12B, {ease: 0.2, drift: 0.03});
