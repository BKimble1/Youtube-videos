// V4 shot group A (see production/V3_SHOT_PLAN.md and the V4 brief): the human hand behind the shot.
//   A2 (39-89)   the operator holding the remote, eyes on the medic; his thumb taps the direction pad (MED_TAP) and the
//                camera tracks laterally along the bench to the insect, which answers at once (board LED, pulses on the
//                left antenna wire, antenna flick, a draw-back and the first short turning steps).
//   A4 (90-112)  low side view: the medic turns away from the target on short tripod steps and sets off left.
//   A5 (113-142) rise over the table: the medic crosses the tray toward the foam course, the operator guiding it beyond;
//                the nearest foam block enters the foreground (the film's transition to B1 follows).
// The V3 remote close-up press (a/A2v3.tsx) is now the integrator's AR insert and A3 (a/A3v3.tsx) is folded into A2; their
// files stay in place (AR imports from a/A2.tsx and may read A2v3), as do the V2 files (A2.tsx, A3.tsx, A4.tsx, C4.tsx,
// Board.tsx, timingA.ts).
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP, steps} from '../../events';
import {shotRange} from '../cuts2';
import {A2, A2_THUMB_DOWN} from './a/A2v4';
import {A4} from './a/A4v3';
import {A5} from './a/A5v3';
import {medPose, MED_TAP, MED_PULSE} from './a/medicA';

export const SHOTS_A: Record<string, React.FC<ShotProps>> = {A2, A4, A5};

/** caption centre y per shot (the placement of the chunks that START in that shot):
 *  A2 "And a person" (65-79) and "holding a remote" (80-89): the top band, above his hair at the start and clear of
 *    his head as it leaves at upper right (the hook's "can fire a needle." also shows there over 39-64, at A1's 270);
 *  A4 "decides" (102-112): low, on the tray below the walking medic;
 *  A5 "when it shoots." (113-142): low, on the tray below the medic, clear of the operator (upper right) and the target */
export const CAPY_A: Record<string, number> = {A2: 270, A4: 1560, A5: 1570};

export const cuesA = (): Cue[] => {
  const ev: Cue[] = [];
  const a2 = shotRange('A2'), a4 = shotRange('A4'), a5 = shotRange('A5');
  // A2: the thumb meets the direction pad and clicks it home; the command reaches the backpack (LED, three pulses down
  // the left antenna wire)
  ev.push({kind: 'click', t: A2_THUMB_DOWN, gain: -42, name: 'A2 thumb meets the D-pad'});
  ev.push({kind: 'button', t: MED_TAP, gain: -27, name: 'A2 D-pad tap (steer)', args: {f: 2600}});
  ev.push({kind: 'pulse', t: MED_PULSE, gain: -36, name: 'A2 steering pulse to the left antenna'});
  // A2-A5: the medic's steps (one tick per tripod contact), close in A4's low view, further off in A2 and A5
  const pose = (ff: number) => medPose(ff / 30);
  for (const {t, g} of steps(touchdownsP(pose, a2.from, a5.to))) {
    const f = t * 30;
    const [g0, tag] = f < a4.from ? [-43, 'A2'] : f < a5.from ? [-35, 'A4'] : [-41, 'A5'];
    ev.push({kind: 'tick', t, gain: Math.round((g0 + g) * 10) / 10, name: `${tag} foot`});
  }
  return ev;
};
