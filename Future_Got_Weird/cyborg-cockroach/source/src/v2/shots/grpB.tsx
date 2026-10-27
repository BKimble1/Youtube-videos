// V3 shot group B (see production/V3_SHOT_PLAN.md): B1-B5, "Scientists strapped a tiny launcher onto a living
// cockroach, then used electrical pulses to steer it." The medic is LOADED throughout (an earlier moment than A1).
// Five setups, each with new information:
//  B1 (143-186) b/B1.tsx   high angle over the fitting mat: gloved hands lower the module onto the living insect, press
//                          it home on "strapped" (B_SEAT 5.55 s), the fingers open and the hands lift away
//  B2 (187-208) b/B2.tsx   NEW tight profile of the mounting (saddle, board, clamps, wires, tube, spring, loaded
//                          injector, latch, needle); it takes its first step (B_GO 6.27 s) and the camera tracks forward
//                          along the tube with it
//  B3 (209-242) b/B3.tsx   low side tracking over a cork test board (textured; granules slide past), tripod gait
//  B4 (243-282) b/B45.tsx  close from above on the electronics on the obstacle course: LED, three pulses along the
//                          LEFT antenna wire (leave 8.52 s), the electrode glows, the left antenna flicks
//  B5 (283-314) b/B45.tsx  continuous with B4: it veers RIGHT round the yellow block's corner (turn 9.12-10.21 s);
//                          the camera rises and comes round to meet it (el 84 -> 45) as it turns toward the lens
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP, steps} from '../../events';
import {shotRange} from '../cuts2';
import {B1, bPose, B_SEAT} from './b/B1';
import {B2} from './b/B2';
import {B3, b3Pose} from './b/B3';
import {B4, B5, b45Pose, T_PULSE, PULSE_GAP} from './b/B45';
import {FPS} from './b/common';

export const SHOTS_B: Record<string, React.FC<ShotProps>> = {B1, B2, B3, B4, B5};

/** caption centre y per shot: the low band, below the insect, the module and the hands' grip in every setup (the B1
 *  and B2 captions run on into B2 and B3, which keep the band clear too) */
export const CAPY_B: Record<string, number> = {B1: 1530, B2: 1530, B3: 1530, B4: 1560, B5: 1560};

export const cuesB = (): Cue[] => {
  const ev: Cue[] = [];
  const b2 = shotRange('B2'), b3 = shotRange('B3'), b4 = shotRange('B4'), b5 = shotRange('B5');
  // B1: the module seats (a soft plastic click as its saddle meets the shell under the press)
  ev.push({kind: 'click', t: B_SEAT, gain: -26, name: 'B1 module pressed home', args: {f: 2600, d: 0.035, bright: 0.5}});
  // B2: its first steps (close: a little more body)
  for (const {t, g} of steps(touchdownsP((ff) => bPose(ff / FPS), b2.from, b2.to))) ev.push({kind: 'tick', t, gain: -36 + g, name: 'B2 first step', args: {body: 0.9, bright: 0.5}});
  // B3: the walk over cork (soft ticks) and a faint grain under the feet
  for (const {t, g} of steps(touchdownsP((ff) => b3Pose(ff / FPS), b3.from, b3.to))) ev.push({kind: 'tick', t, gain: -38 + g, name: 'B3 foot on cork'});
  ev.push({kind: 'grit', t: b3.from / FPS + 0.03, gain: -46, name: 'B3 cork grain under the feet', args: {d: (b3.to - b3.from) / FPS - 0.06, rate: 12}});
  // B4-B5: the walk up the course and through the turn
  for (const {t, g} of steps(touchdownsP((ff) => b45Pose(ff / FPS), b4.from, b5.to))) {
    const inB5 = t * FPS >= b5.from;
    ev.push({kind: 'tick', t, gain: (inB5 ? -40 : -37) + g, name: inB5 ? 'B5 foot (turn)' : 'B4 foot'});
  }
  // B4: three stimulation pulses leave the board, one after another (the LED flashes with them)
  [0, 1, 2].forEach((k) => ev.push({kind: 'pulse', t: T_PULSE + k * PULSE_GAP, gain: -33 - 2 * k, name: `B4 pulse ${k + 1} leaves the board`}));
  return ev.sort((a, b) => a.t - b.t);
};
