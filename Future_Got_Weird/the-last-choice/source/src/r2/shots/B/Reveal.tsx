// B3 (16.76–23.54, ORCH): from behind his right shoulder (he holds the lower-left third) the camera cranes up and back
// over the crest to a high over-shoulder — the reveal: the crater and the whole army beyond. The ranks march with their
// eyes dark; on H1/H2 they strike two synchronized steps and the eyes light in a ripple from the front rank back. He
// steps down to the brink.
// B4 (23.54–27.00, H3): long lens from inside the army looking back west: a heavy in the foreground turns its head
// toward camera-right — to him, a tiny silhouette on the crest.
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3, lerp3, smooth, clamp} from '../../../kit/math';
import type {Item, View} from '../../engine';
import {M} from '../../timing';
import {STAND, dirB} from './director';
import {dirSprite, armyB} from './kit';
import {slabItem, chunkItems, supportItems} from './rubble';
import {heavyPosB} from './army';
import {CAM_B3, CAM_B4} from './cams';

// ------------------------------------------------------------------ B3
export const B3_START = M.ORCH, B3_END = 23.54;
export const ShotB3: React.FC = () => {
  const {t, T} = useShotTime(B3_START);
  const cam = camPath(CAM_B3, t, 0.55);
  const p = dirB(T).pos;
  const neck: V3 = {x: p.x, y: p.y + 1.5, z: p.z};
  const items = (v: View): Item[] => [
    // his feet are far below the frame: take the rig's perspective at his neck so the head and shoulders land true
    dirSprite(T, {bias: 0.6, anchor: neck}),
    slabItem(T), ...supportItems(), ...chunkItems(T),
    // the front ranks are 85–90 px tall here: solid (mid) machines, not flat far sprites
    ...armyB(v, T, {maxFull: 0, maxMid: 140, farFrom: 175}),
  ];
  // the crater's smokes lie across the line to the army from this lens: left out, with a thin haze and half the street
  // haze, so the lockstep and the eye ripple read
  return <Stage T={T} cam={cam} items={items} drift={0.015} atmos={{smoke: 0.1, haze: 0.05}} light={{hazeK: 0.45}} vignette={0.55} />;
};

// ------------------------------------------------------------------ B4
export const B4_START = 23.54, B4_END = 27.0;
export const ShotB4: React.FC = () => {
  const {t, T} = useShotTime(B4_START);
  const cam = camPath(CAM_B4, t, 0.2);
  // the foreground heavy (HEAVIES_B[0]) scans to its left, then on H3 its head swings round to him
  const k = smooth(clamp((T - M.H3 - 0.05) / 0.9));
  const scan: V3 = {x: 104, y: 1.5, z: 40}; // scanning the burning south flank
  const look = lerp3(scan, {x: STAND.x, y: STAND.y + 1.5, z: STAND.z}, k);
  const items = (v: View): Item[] => [
    dirSprite(T),
    ...armyB(v, T, {maxFull: 22, maxMid: 40, farFrom: 110, heavy: (i) => (i === 0 ? {look} : {}), heavyLod: (i, d) => (i === 0 ? 'full' : d < 60 ? 'full' : 'mid')}),
  ];
  void heavyPosB;
  return <Stage T={T} cam={cam} items={items} drift={0.03} atmos={{smoke: 0.35, haze: 0}} vignette={0.55} />;
};
