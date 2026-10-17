// B5 (27.00–30.26): from the avenue east-south-east of him, low, the camera pushes in and up past the van (the radio on
// its floor) to a medium close: the western sun rims him; he breathes, looks down at his left arm and pulls the
// plate's strap tight with his teeth and his right hand. B6 (30.26–35.80, H4/H5): the lonely wide — from the west slope
// behind him, looking east: he is small on the crest; beyond, the smoking crater and the whole army, which halts as
// one on H4, H5a and H5b. Hold.
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3} from '../../../kit/math';
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
export const B6_START = M.H4, B6_END = M.BASS_OUT;
export const ShotB6: React.FC = () => {
  const {t, T} = useShotTime(B6_START);
  const cam = camPath(CAM_B6, t, 0.3);
  const items = (v: View): Item[] => [dirSprite(T), slabItem(T), ...supportItems(), ...chunkItems(T), ...armyB(v, T, {maxFull: 0, maxMid: 30, farFrom: 140})];
  return <Stage T={T} cam={cam} items={items} drift={0.02} atmos={{columns: B_COLUMNS, smoke: 0.3, haze: 0.15}} vignette={0.6} />;
};
