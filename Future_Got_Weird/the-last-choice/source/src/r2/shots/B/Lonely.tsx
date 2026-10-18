// B5a (24.40–26.30): his face, close: the heavy has looked at him. The breath catches, the brows go up and pinch (it
// has picked him out), then they come down and the jaw sets.
// B5b (26.30–30.26): from the avenue east-south-east of him, low, the camera pushes in and up past the van (the radio
// on its floor) to a medium close: he looks down at his left arm and pulls the plate's strap tight with his teeth and
// his right hand; the plate comes up to his guard.
// B6a (30.26–32.90, H4/H5): the lonely silhouette — the reverse, from a crane riding over the main body's front ranks
// east of the crater, looking west: the vanguard's heads below take two slowing steps and plant (31.06); the crane
// keeps coming with the main body and stops when it stops (H5a); the rear's stomp (H5b). Then one drone of the screen
// drops off its place over the vanguard and darts away across the crater at the small figure on the crest, a
// silhouette against the backlit smoke over the west ruin.
// B6b (32.90–35.80): the standoff, side-on from the south: the drone comes in from the right (from the army) and brakes
// ~7 m off his face over the van; the plate comes up between them, his weight goes forward into it — he does not give
// ground; an amber beam finds him; its gimbal flicks past him, to the ruin behind him; it backs away up and to the
// right; the plate goes back down to his guard.
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3} from '../../../kit/math';
import type {Item, View} from '../../engine';
import {figureSprite} from '../../rig';
import type {FigProps} from '../../rig';
import {STAND} from './director';
import {dirSprite, dirSpec, armyB, B_COLUMNS, B_WEST_SMOKE, strapItems} from './kit';
import type {ColumnOpts} from '../../world/atmos';
import {slabItem, chunkItems, supportItems} from './rubble';
import {CAM_B5A, CAM_B5B, CAM_B6B, camB6a, B5_ANCHOR, B5A_ANCHOR} from './cams';
import {CUT} from './beats';

// ------------------------------------------------------------------ B5a
export const B5A_START = CUT.b5a, B5A_END = CUT.b5b;
export const ShotB5a: React.FC = () => {
  const {t, T} = useShotTime(B5A_START);
  const cam = camPath(CAM_B5A, t, 0.5);
  const items = (v: View): Item[] => [dirSprite(T, {anchor: B5A_ANCHOR, bias: 0.4}), slabItem(T), ...supportItems(), ...chunkItems(T)];
  return <Stage T={T} cam={cam} items={items} drift={0.006} atmos={{columns: B_WEST_SMOKE, smoke: 0.6, haze: 0.3}} vignette={0.6} />;
};

// ------------------------------------------------------------------ B5b
export const B5B_START = CUT.b5b, B5B_END = CUT.b6a;
export const ShotB5b: React.FC = () => {
  const {t, T} = useShotTime(B5B_START);
  const cam = camPath(CAM_B5B, t, 0.75);
  const items = (v: View): Item[] => [dirSprite(T, {anchor: B5_ANCHOR, bias: 0.4}), ...strapItems(v, T, {anchor: B5_ANCHOR, bias: 0.4}), slabItem(T), ...supportItems(), ...chunkItems(T)];
  return <Stage T={T} cam={cam} items={items} drift={0.015} atmos={{columns: [...B_COLUMNS, ...B_WEST_SMOKE], smoke: 0.8}} vignette={0.55} />;
};

// ------------------------------------------------------------------ B6a
/** He is ~105 m off and the low sun is behind him: drawn as a dark silhouette with a thin warm rim (the same figure in a
 * warm flat colour, nudged left, right and up, under the dark one). */
const SIL = '#1C1517', RIM = '#FFC788';
const dirSilhouette = (T: number): Item => {
  const base = dirSpec(T, {anchor: {x: STAND.x, y: STAND.y + 0.9, z: STAND.z}});
  const pose = base.pose as Partial<FigProps>;
  // (no blood or dust marks: they keep their own colours and would show as specks on the silhouette)
  const dark = figureSprite({...base, key: 'dirB6', pose: {...pose, dmg: {}, silhouette: SIL}});
  const rim = figureSprite({...base, key: 'dirB6r', pose: {...pose, dmg: {}, silhouette: RIM}});
  return {
    ...dark, noCull: true,
    draw: (c) => (
      <g>
        <g transform="translate(-1.5 -0.8)" opacity={0.9}>{rim.draw(c)}</g>
        <g transform="translate(1.5 -0.8)" opacity={0.9}>{rim.draw(c)}</g>
        <g transform="translate(0 -1.8)">{rim.draw(c)}</g>
        {dark.draw(c)}
      </g>
    ),
  };
};
/** the crater's smoke for the crane's lens: the same pits, but lying low in the bowl (the tall columns would veil him) */
const B6_CRATER: {key: string; base: V3; o: ColumnOpts}[] = [
  {key: 'b6k1', base: {x: 64, y: -3.4, z: -5}, o: {n: 7, life: 11, rise: 0.17, r0: 2.2, r1: 5, drift: 0.7, dark: 0.25, alpha: 0.32, warm: 0.2, seed: 81}},
  {key: 'b6k2', base: {x: 58, y: -2.8, z: 5}, o: {n: 6, life: 10, rise: 0.15, r0: 2, r1: 4.5, drift: 0.7, dark: 0.3, alpha: 0.3, warm: 0.25, seed: 82}},
  {key: 'b6k3', base: {x: 69, y: -2.6, z: 8}, o: {n: 6, life: 10, rise: 0.16, r0: 2, r1: 4.5, drift: 0.6, dark: 0.3, alpha: 0.28, warm: 0.2, seed: 83}},
];
export const B6A_START = CUT.b6a, B6A_END = CUT.b6b;
export const ShotB6a: React.FC = () => {
  const {T} = useShotTime(B6A_START);
  const cam = camB6a(T);
  // looking into the low sun: the sides of things facing the lens (away from the sun) sink (light shadowK)
  const items = (v: View): Item[] => [
    dirSilhouette(T), slabItem(T), ...supportItems(), ...chunkItems(T),
    ...armyB(v, T, {maxFull: 30, maxMid: 60, farFrom: 120}),
  ];
  return <Stage T={T} cam={cam} items={items} drift={0.006} atmos={{columns: [...B6_CRATER, ...B_WEST_SMOKE], smoke: 0.35, haze: 0.04}} light={{shadowK: 0.6}} vignette={0.6} />;
};

// ------------------------------------------------------------------ B6b
export const B6B_START = CUT.b6b, B6B_END = CUT.end;
const HEAD6: V3 = {x: STAND.x, y: STAND.y + 1.4, z: STAND.z};
export const ShotB6b: React.FC = () => {
  const {t, T} = useShotTime(B6B_START);
  const cam = camPath(CAM_B6B, t, 0.4);
  const items = (v: View): Item[] => [
    dirSprite(T, {anchor: HEAD6, bias: 0.4}), slabItem(T), ...supportItems(), ...chunkItems(T),
    ...armyB(v, T, {maxFull: 4, maxMid: 40, farFrom: 90, heavyDistAt: () => true}),
  ];
  return <Stage T={T} cam={cam} items={items} drift={0.012} atmos={{columns: [...B_COLUMNS, ...B_WEST_SMOKE], smoke: 0.6, haze: 0.3}} vignette={0.55} />;
};
