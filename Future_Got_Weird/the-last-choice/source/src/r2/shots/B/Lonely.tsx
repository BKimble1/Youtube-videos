// B5 (27.00–30.26): from the avenue east-south-east of him, low, the camera pushes in and up past the van (the radio on
// its floor) to a medium close: the western sun rims him; he breathes, looks down at his left arm and pulls the
// plate's strap tight with his teeth and his right hand. B6 (30.26–35.80, H4/H5): the lonely silhouette — the reverse,
// from low among the machines' ranks east of the crater looking west: the nearest machines plant their last steps
// just after H4 (the main body on H5a, the rear on H5b, behind the lens), and far off on the crest, small and backlit
// by the low sun, him. Hold.
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3} from '../../../kit/math';
import type {ColumnOpts} from '../../world/atmos';
import type {Item, View} from '../../engine';
import {M} from '../../timing';
import {STAND} from './director';
import {dirSprite, armyB, B_COLUMNS, strapItems} from './kit';
import {slabItem, chunkItems, supportItems} from './rubble';
import {CAM_B5, CAM_B6, B5_ANCHOR} from './cams';

// ------------------------------------------------------------------ B5
export const B5_START = 27.0, B5_END = M.H4;
export const ShotB5: React.FC = () => {
  const {t, T} = useShotTime(B5_START);
  const cam = camPath(CAM_B5, t, 0.75);
  const items = (v: View): Item[] => [dirSprite(T, {anchor: B5_ANCHOR, bias: 0.4}), ...strapItems(v, T, {anchor: B5_ANCHOR, bias: 0.4}), slabItem(T), ...supportItems(), ...chunkItems(T)];
  return <Stage T={T} cam={cam} items={items} drift={0.015} atmos={{columns: B_COLUMNS, smoke: 0.8}} vignette={0.55} />;
};

// ------------------------------------------------------------------ B6
/** smoke rolling off the west ruin behind the ridge, light and lit from behind by the low sun: his backdrop in B6 (the
 * crater's two northern smokes, which lie across the sight line from this lens, are left out so he stays clean) */
const B6_BACKDROP: {key: string; base: V3; o: ColumnOpts}[] = [
  {key: 'b6W1', base: {x: -9, y: 5, z: 2}, o: {n: 8, life: 20, rise: 0.35, r0: 4, r1: 11, drift: 0.4, dark: 0, alpha: 0.5, warm: 0, seed: 71}},
  {key: 'b6W2', base: {x: -16, y: 7, z: -6}, o: {n: 7, life: 22, rise: 0.3, r0: 5, r1: 13, drift: 0.4, dark: 0.05, alpha: 0.45, warm: 0, seed: 72}},
  {key: 'b6W3', base: {x: -14, y: 6, z: 10}, o: {n: 7, life: 21, rise: 0.3, r0: 5, r1: 12, drift: 0.4, dark: 0.05, alpha: 0.45, warm: 0, seed: 73}},
];
export const B6_START = M.H4, B6_END = M.BASS_OUT;
export const ShotB6: React.FC = () => {
  const {t, T} = useShotTime(B6_START);
  const cam = camPath(CAM_B6, t, 0.3);
  // looking into the low sun: exposed for the bright smoke, the sides of things facing the lens (away from the sun)
  // sink (light shadowK). He is ~85 m off: take the rig's perspective at his chest so he stands true on the crest
  const items = (v: View): Item[] => [dirSprite(T, {anchor: {x: STAND.x, y: STAND.y + 0.9, z: STAND.z}}), slabItem(T), ...supportItems(), ...chunkItems(T), ...armyB(v, T, {maxFull: 18, maxMid: 40, farFrom: 70})];
  return <Stage T={T} cam={cam} items={items} drift={0.01} atmos={{columns: [...B_COLUMNS.filter((c) => c.key === 'bCr4'), ...B6_BACKDROP], smoke: 0.15, haze: 0.05}} light={{shadowK: 0.6}} vignette={0.78} />;
};
