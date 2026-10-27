// V4 shot group F (production/V3_SHOT_PLAN.md + the V4 polish brief): F1-F5, the trapped survivor and the medic coming to her.
//   F1 758-792 her pocket; a shadow slides into the light leaking under the slab ahead of her hands; she sees it
//   F2 793-817 the medic pushes out of the crack in the slab's end onto the narrow ledge (close)
//   F3 818-847 close on her face: her eyes drop to it and track it; restrained unease (brows together and up a little,
//              eyes a little wider, mouth tight, a small lean back); the camera follows her gaze down to the two-shot
//   F4 848-872 over her right shoulder (her head, shoulder and fist large and soft at the left): the medic comes off the
//              hole across the rubble ledge toward her hand and the camera, weight in its walk, injector on its back
//   F5 873-891 the two-shot: the injector glints; unease turns to cautious hope; her near hand opens and slides toward it
// One world (f/world.ts): the same pocket, slab, crack, ledge and walk in every shot.
import React from 'react';
import {ShotProps} from './index2';
import {F1, F1_K} from './f/F1';
import {F2, F2_GRIT} from './f/F2';
import {F3, F3_K, F3_GRIT} from './f/F3';
import {F4, F4_GRIT} from './f/F4';
import {F5, F5_K} from './f/F5';
import {medicPose, FPS, R1, R2, R3, R4, R5} from './f/world';
import {Cue, touchdownsP, steps} from '../../events';

export const SHOTS_F: Record<string, React.FC<ShotProps>> = {F1, F2, F3, F4, F5};

/** caption centre y per shot (screen px): never over her face, the insect or the needle */
export const CAPY_F: Record<string, number> = {
  F1: 270, // top band, over the slab above her head (start) / right of her forehead (end); the light and the shadow are low right
  F2: 1570, // low, over the floor and the near rubble in front of the ledge (the insect at y 650-1100)
  F3: 1590, // low: over her forearms (start, her chin at y ~1080) / the floor below the ledge (end; the insect at y < 1540)
  F4: 270, // top band, over the slab top beyond the hole (the insect at y 700-1100, her head at x < 330)
  F5: 1590, // low, over the floor below her hand and the insect (insect bottom ~1540)
};

const ticks = (f0: number, f1: number) => steps(touchdownsP((ff) => medicPose(ff / FPS), f0, f1));

export const cuesF = (): Cue[] => {
  const ev: Cue[] = [];
  // F1: the scrape of something moving in the gap as its shadow slides into the light
  ev.push({kind: 'grit', t: (R1.from + F1_K.enter) / FPS, gain: -40, name: 'F1 scrape in the gap (the shadow slides into the light)', args: {d: 0.55, rate: 14}});
  // F2: grit from the crack as the head pushes out; its first steps out onto the ledge (close)
  ev.push({kind: 'grit', t: R2.from / FPS + F2_GRIT.t0, gain: -38, name: 'F2 grit from the crack as it pushes out', args: {d: F2_GRIT.dur, rate: 16}});
  for (const {t, g} of ticks(R2.from, R2.to)) ev.push({kind: 'tick', t, gain: -35 + g, name: 'F2 foot (close, out of the crack)', args: {body: 1.0, bright: 0.5}});
  // F3: grit trickles off the slab's edge, the tiny feet on the ledge (her eyes drop to them), her small breath in as she leans back
  ev.push({kind: 'grit', t: R3.from / FPS + F3_GRIT.t0, gain: -42, name: 'F3 grit off the slab edge', args: {d: F3_GRIT.dur, rate: 14}});
  for (const {t, g} of ticks(R3.from, R3.to)) ev.push({kind: 'tick', t, gain: -41 + g, name: 'F3 foot (on the ledge, distant)'});
  ev.push({kind: 'air', t: (R3.from + F3_K.lean0) / FPS, gain: -44, name: 'F3 her small breath in (unease)', args: {d: (F3_K.lean1 - F3_K.lean0) / FPS, lo: 400, hi: 2200, rise: true}});
  // F4: grit off the slab's lip above the hole, the feet on the rubble ledge (over her shoulder, closer)
  ev.push({kind: 'grit', t: R4.from / FPS + F4_GRIT.t0, gain: -43, name: 'F4 grit off the slab lip above the hole', args: {d: F4_GRIT.dur, rate: 12}});
  for (const {t, g} of ticks(R4.from, R4.to)) ev.push({kind: 'tick', t, gain: -38 + g, name: 'F4 foot (on the rubble ledge)', args: {body: 0.9, bright: 0.55}});
  // F5: the feet coming on (two-shot); her breath out as she recognises the device
  for (const {t, g} of ticks(R5.from, R5.to)) ev.push({kind: 'tick', t, gain: -42 + g, name: 'F5 foot (two-shot)'});
  ev.push({kind: 'air', t: (R5.from + F5_K.ex0) / FPS, gain: -42, name: 'F5 her breath out', args: {d: (F5_K.ex1 - F5_K.ex0) / FPS, lo: 300, hi: 1800, rise: false}});
  return ev;
};
