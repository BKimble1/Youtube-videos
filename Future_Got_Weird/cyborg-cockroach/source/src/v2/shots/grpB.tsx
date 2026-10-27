// V2 shot group B (see production/V2_SHOT_PLAN.md): B1-B5, "Scientists strapped a tiny launcher onto a living
// cockroach, then used electrical pulses to steer it." Shot code in ./b/:
//  B1 (136-185) b/B12.tsx  3/4 from the front right: two gloved hands lower the backpack (wires trailing) and press it
//                          home on "strapped" (5.53 s)
//  B2 (186-221) b/B12.tsx  straight down: the hands let go and lift away; the insect sets off (6.45 s)
//  B3 (222-254) b/B3.tsx   profile at insect height, tracking the walk (the same continuous walk as B2)
//  B4 (255-282) b/B45.tsx  close from above on the board: three pulses run the LEFT antenna wire to the electrode
//  B5 (283-314) b/B45.tsx  continuous with B4: the insect turns right round a foam block as the camera pulls out
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP} from '../../events';
import {shotRange} from '../cuts2';
import {B1, B2, bPose, B_SEAT} from './b/B12';
import {B3} from './b/B3';
import {B4, B5, b45Pose, T_PULSE, PULSE_GAP} from './b/B45';
import {FPS} from './b/common';

export const SHOTS_B: Record<string, React.FC<ShotProps>> = {B1, B2, B3, B4, B5};

/** caption centre y per shot: below the insect and the hands (B1-B3), below the board / over the rear of the body in
 *  the close insert and the turn (B4-B5, kept the same across the invisible cut) */
export const CAPY_B: Record<string, number> = {B1: 1530, B2: 1500, B3: 1500, B4: 1560, B5: 1560};

/** one tick per contact instant (a tripod's legs landing on the same sub-frame sum into one tick, +10 log10(legs) dB) */
const steps = (tds: number[]) => {
  const legs = new Map<number, number>();
  for (const td of tds) legs.set(td, (legs.get(td) ?? 0) + 1);
  return [...legs].map(([t, n]) => ({t, g: 10 * Math.log10(n)}));
};

export const cuesB = (): Cue[] => {
  const ev: Cue[] = [];
  const b1 = shotRange('B1'), b2 = shotRange('B2'), b3 = shotRange('B3'), b4 = shotRange('B4'), b5 = shotRange('B5');
  // B1: the pack seats (a soft plastic click as its saddle meets the shell)
  ev.push({kind: 'click', t: B_SEAT, gain: -27, name: 'B1 pack seats', args: {f: 2600, d: 0.035, bright: 0.5}});
  void b1;
  // B2-B3: the first steps and the walk (one continuous walk; top view in B2, close profile in B3)
  for (const {t, g} of steps(touchdownsP((ff) => bPose(ff / FPS), b2.from, b3.to))) {
    const inB3 = t * FPS >= b3.from;
    ev.push({kind: 'tick', t, gain: (inB3 ? -36 : -39) + g, name: inB3 ? 'B3 foot' : 'B2 foot (first steps)'});
  }
  // B4-B5: the walk up the tray and through the turn
  for (const {t, g} of steps(touchdownsP((ff) => b45Pose(ff / FPS), b4.from, b5.to))) {
    const inB5 = t * FPS >= b5.from;
    ev.push({kind: 'tick', t, gain: (inB5 ? -40 : -37) + g, name: inB5 ? 'B5 foot (turn)' : 'B4 foot'});
  }
  // B4: three stimulation pulses leave the board, one after another (the LED flashes with them)
  [0, 1, 2].forEach((k) => ev.push({kind: 'pulse', t: T_PULSE + k * PULSE_GAP, gain: -33 - 2 * k, name: `B4 pulse ${k + 1} leaves the board`}));
  return ev.sort((a, b) => a.t - b.t);
};
