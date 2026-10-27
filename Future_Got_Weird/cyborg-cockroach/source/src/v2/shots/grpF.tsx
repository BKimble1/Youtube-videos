// V3 shot group F (production/V3_SHOT_PLAN.md): F1-F5, the trapped survivor and the medic coming to her.
//   F1 758-792 her pocket; a shadow slides into the light leaking under the slab ahead of her hands; she sees it
//   F2 793-817 the medic pushes out of the crack in the slab's end onto the narrow ledge (close)
//   F3 818-847 she turns, sees it: disgust and recoil; the camera follows her gaze down to it (two-shot)
//   F4 848-872 side view inside the crevice: it crosses the narrow ledge; a chip breaks off and falls
//   F5 873-891 the two-shot: the injector glints; disgust turns to cautious hope, her near hand opens toward it
// One world (f/world.ts): the same pocket, slab, crack, ledge and walk in every shot.
import React from 'react';
import {ShotProps} from './index2';
import {F1, F1_K} from './f/F1';
import {F2, F2_GRIT} from './f/F2';
import {F3, F3_K, F3_GRIT} from './f/F3';
import {F4, F4_CHIP} from './f/F4';
import {F5, F5_K} from './f/F5';
import {medicPose, FPS, R1, R2, R3, R4, R5} from './f/world';
import {Cue, touchdownsP, steps} from '../../events';

export const SHOTS_F: Record<string, React.FC<ShotProps>> = {F1, F2, F3, F4, F5};

/** caption centre y per shot (screen px): never over her face, the insect or the needle */
export const CAPY_F: Record<string, number> = {
  F1: 270, // top band, over the slab above her head (start) / right of her forehead (end); the light and the shadow are low right
  F2: 1570, // low, over the floor and the near rubble in front of the ledge (the insect at y 650-1100)
  F3: 1585, // low: over her forearm (start) / the floor below the crevice (end; the insect at x > 820, y < 1500)
  F4: 1560, // low, over the dark drop (the ledge and the insect at y 600-800)
  F5: 1585, // low, over the floor left of and below the insect (y < 1500) and her hand
};

const ticks = (f0: number, f1: number) => steps(touchdownsP((ff) => medicPose(ff / FPS), f0, f1));

export const cuesF = (): Cue[] => {
  const ev: Cue[] = [];
  // F1: the scrape of something moving in the gap as its shadow slides into the light
  ev.push({kind: 'grit', t: (R1.from + F1_K.enter) / FPS, gain: -40, name: 'F1 scrape in the gap (the shadow slides into the light)', args: {d: 0.55, rate: 14}});
  // F2: grit from the crack as the head pushes out; its first steps out onto the ledge (close)
  ev.push({kind: 'grit', t: R2.from / FPS + F2_GRIT.t0, gain: -38, name: 'F2 grit from the crack as it pushes out', args: {d: F2_GRIT.dur, rate: 16}});
  for (const {t, g} of ticks(R2.from, R2.to)) ev.push({kind: 'tick', t, gain: -35 + g, name: 'F2 foot (close, out of the crack)', args: {body: 1.0, bright: 0.5}});
  // F3: grit trickles off the slab's edge, the feet on the ledge (her eyes drop to them), the rubble shifts as she recoils
  ev.push({kind: 'grit', t: R3.from / FPS + F3_GRIT.t0, gain: -42, name: 'F3 grit off the slab edge', args: {d: F3_GRIT.dur, rate: 14}});
  for (const {t, g} of ticks(R3.from, R3.to)) ev.push({kind: 'tick', t, gain: -39 + g, name: 'F3 foot (on the ledge)'});
  ev.push({kind: 'creak', t: (R3.from + F3_K.rec0) / FPS, gain: -40, name: 'F3 rubble shifts as she recoils'});
  // F4: the feet on the narrow ledge (side, close), the chip breaking off under the near middle foot and landing far below
  for (const {t, g} of ticks(R4.from, R4.to)) ev.push({kind: 'tick', t, gain: -36 + g, name: 'F4 foot (on the ledge)', args: {body: 0.9, bright: 0.6}});
  const chipT = (R4.from + F4_CHIP.lf) / FPS;
  ev.push({kind: 'grit', t: chipT, gain: -41, name: 'F4 a chip breaks off the ledge', args: {d: 0.12, rate: 30}});
  ev.push({kind: 'tick', t: chipT + Math.sqrt((2 * 0.42) / 9.81), gain: -46, name: 'F4 the chip lands far below', args: {body: 0.6, bright: 0.3}});
  // F5: the feet coming on (two-shot); her breath out as she recognises the device
  for (const {t, g} of ticks(R5.from, R5.to)) ev.push({kind: 'tick', t, gain: -42 + g, name: 'F5 foot (two-shot)'});
  ev.push({kind: 'air', t: (R5.from + F5_K.ex0) / FPS, gain: -42, name: 'F5 her breath out', args: {d: (F5_K.ex1 - F5_K.ex0) / FPS, lo: 300, hi: 1800, rise: false}});
  return ev;
};
