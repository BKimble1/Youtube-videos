// V3 shot group A (see production/V3_SHOT_PLAN.md): the human hand behind the shot.
//   A2 (42-66)   the match cut from A1's board LED to the remote's red FIRE button; the gloved thumb presses it; the
//                camera eases back along the remote to the hand and the coat sleeve.
//   A3 (67-89)   the operator holding the remote, looking down; the camera follows his eye line to the medic at the
//                target with the fired injector in it; his steering command arrives; it draws back.
//   A4 (90-112)  low side view: the medic turns away from the target on short tripod steps and sets off left.
//   A5 (113-142) rise over the table: the medic crosses the tray toward the foam course, the operator guiding it beyond;
//                the nearest foam block enters the foreground (the film's foam wipe follows).
// The V2 shots A3 (match cut to the board), A4 (operator nod) and C4 (now group C's) are no longer registered here; their
// files (shots/a/A2.tsx, A3.tsx, A4.tsx, C4.tsx, Board.tsx, timingA.ts) stay in place for the code that imports them.
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP, steps} from '../../events';
import {shotRange} from '../cuts2';
import {A2, A2_CONTACT, A2_PRESS, A2_LED, A2_RELEASE} from './a/A2v3';
import {A3} from './a/A3v3';
import {A4} from './a/A4v3';
import {A5} from './a/A5v3';
import {medPose, MED_PULSE} from './a/medicA';

export const SHOTS_A: Record<string, React.FC<ShotProps>> = {A2, A3, A4, A5};

/** caption centre y per shot (the placement of the chunk that STARTS in that shot):
 *  A2 "And a person" (65-79, over A2's end and A3's opening): the top band, above the remote and above his hair;
 *  A3 "holding a remote" (80-101, over A3's end and A4's start): low, on the bench top below the medic and the target
 *    (his face is at the top of the frame by then);
 *  A4 "decides" (102-112): the same low band, on the tray below the walking medic;
 *  A5 "when it shoots." (113-142): low, on the tray below the medic, clear of the operator (upper right) and the target */
export const CAPY_A: Record<string, number> = {A2: 270, A3: 1560, A4: 1560, A5: 1570};

export const cuesA = (): Cue[] => {
  const ev: Cue[] = [];
  const a3 = shotRange('A3'), a4 = shotRange('A4'), a5 = shotRange('A5');
  // A2: the thumb meets the cap (soft), the cap bottoms out in its guard (the FIRE click), the status LED turns amber;
  // the thumb lets the cap spring back up
  ev.push({kind: 'click', t: A2_CONTACT, gain: -40, name: 'A2 thumb meets the fire cap'});
  ev.push({kind: 'button', t: A2_PRESS, gain: -20, hero: true, name: 'A2 FIRE button pressed', args: {f: 1500}});
  ev.push({kind: 'pulse', t: A2_LED, gain: -40, name: 'A2 remote LED turns amber'});
  ev.push({kind: 'click', t: A2_RELEASE + 0.03, gain: -44, name: 'A2 cap springs back up'});
  // A3: the steering command reaches the backpack (LED, pulses along the left antenna wire)
  ev.push({kind: 'pulse', t: MED_PULSE, gain: -38, name: 'A3 steering pulse to the left antenna'});
  // A3-A5: the medic's steps (one tick per tripod contact), close in A4's low view, further off in A3 and A5
  const pose = (ff: number) => medPose(ff / 30);
  for (const {t, g} of steps(touchdownsP(pose, a3.from, a5.to))) {
    const f = t * 30;
    const [g0, tag] = f < a4.from ? [-44, 'A3'] : f < a5.from ? [-35, 'A4'] : [-41, 'A5'];
    ev.push({kind: 'tick', t, gain: Math.round((g0 + g) * 10) / 10, name: `${tag} foot`});
  }
  return ev;
};
