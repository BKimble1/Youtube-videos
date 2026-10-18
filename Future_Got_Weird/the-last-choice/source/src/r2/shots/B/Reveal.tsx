// B3 (16.76–21.40, ORCH): from behind his right shoulder (he holds the lower-left third) the camera cranes up and back
// over the crest to a high over-shoulder — the reveal: the crater and the whole army beyond. The ranks march with their
// eyes dark; on H1/H2 they strike two synchronized steps and the eyes light in a ripple from the front rank back. He
// steps down to the brink — toward them. Cut when the ripple has reached the rear.
// B4 (21.40–24.40, H3): his eyes, a very long lens: the foreground heavy among the marching ranks, compressed, coming
// on; its head sweeps the burning south flank, and on H3 it swings round and looks straight into the lens — at him.
import React from 'react';
import {Stage, useShotTime, camPath} from '../../film/stage';
import {V3, lerp3, clamp, easeOut, smooth} from '../../../kit/math';
import type {Item, View} from '../../engine';
import {M} from '../../timing';
import {dirB} from './director';
import {dirSprite, armyB} from './kit';
import {slabItem, chunkItems, supportItems} from './rubble';
import {CAM_B3, CAM_B4} from './cams';
import {CUT} from './beats';

// ------------------------------------------------------------------ B3
export const B3_START = CUT.b3, B3_END = CUT.b4;
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
export const B4_START = CUT.b4, B4_END = CUT.b5a;
/** the heavy's head: sweeping the burning south flank, then on H3 it snaps round to him (a hair of overshoot) */
export const heavyLookB = (T: number, eye: V3): V3 => {
  const sweep = clamp((T - CUT.b4 + 0.4) / 2.4);
  const flank: V3 = {x: 96 - 14 * smooth(sweep), y: 1.5, z: 34 - 8 * smooth(sweep)}; // the south flank's fires, panning west
  const u = clamp((T - M.H3 - 0.04) / 0.62);
  const k = u < 1 ? easeOut(u) * 1.04 : 1.04 - 0.04 * smooth(clamp((T - M.H3 - 0.66) / 0.3));
  return lerp3(flank, eye, k);
};
/** the other heavies' heads: each sweeps its own sector of the burning blocks on either side, slowly */
const sweepAt = (x: number, z0: number, z1: number, y: number, ph: number, per: number) => (T: number): V3 => {
  const u = 0.5 + 0.5 * Math.sin((T / per) * Math.PI * 2 + ph);
  return {x, y, z: z0 + (z1 - z0) * smooth(u)};
};
const SECTORS: ((T: number) => V3)[] = [
  () => ({x: 0, y: 0, z: 0}),
  sweepAt(70, 30, 18, 6, 0.4, 7.5), sweepAt(80, -34, -20, 9, 2.1, 8.2), sweepAt(96, 36, 24, 12, 4.0, 6.8), sweepAt(110, -38, -26, 8, 5.2, 9.1),
];
export const ShotB4: React.FC = () => {
  const {t, T} = useShotTime(B4_START);
  const cam = camPath(CAM_B4, t, 0.3);
  const eye = cam.pos;
  // (he is not drawn: this is his eye)
  const items = (v: View): Item[] => armyB(v, T, {
    maxFull: 30, maxMid: 260, farFrom: 400,
    // its feet on the beat, the hull settling on each landing, dust where the feet come down
    // (the others keep sweeping their own sectors — only this one has found him)
    heavy: (i) => (i === 0 ? {look: heavyLookB(T, eye), dust: true, weight: 1.2} : {look: SECTORS[i](T)}),
    heavyDistAt: (i) => i === 0, heavyLod: () => 'full',
  });
  return <Stage T={T} cam={cam} items={items} drift={0.025} atmos={{smoke: 0.3, haze: 0.4}} vignette={0.5} />;
};
