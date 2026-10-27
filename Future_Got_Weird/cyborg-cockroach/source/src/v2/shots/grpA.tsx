// V2 shot group A (see production/V2_SHOT_PLAN.md): A2 the thumb on the remote's button, A3 the match cut to the
// backpack's LED and the signal to the coil, A4 the operator at the bench, C4 the feed becomes his monitor.
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP, steps} from '../../events';
import {A2} from './a/A2';
import {A3, A3_SIG0, A3_HEAT0} from './a/A3';
import {A4, A4_NOD} from './a/A4';
import {C4} from './a/C4';
import {A2_PRESS, A2_CONTACT, A2_LED, A3R, C4R, MATCH, MATCH_LED, matchRadius} from './a/timingA';
import {feedMedicPose} from './c/course';

export const SHOTS_A: Record<string, React.FC<ShotProps>> = {A2, A3, A4, C4};

/** caption centre y per shot: the top band everywhere (A2: above the fingertips curled over the remote's top edge;
 *  A3: the background above the board; A4: the wall above his hair, clear of the arena and the needle; C4: the wall
 *  above the monitor and his hair) */
export const CAPY_A: Record<string, number> = {A2: 270, A3: 270, A4: 270, C4: 270};

/** the match-cut contract: the pressed button's cap centre on A2's last frame and the cap's on-screen radius (px);
 *  the thumb covers its lower left, so A3's LED lens (same radius) opens on the red that shows, at A3_LED_START */
export const A2_BUTTON_END = {...MATCH, r: matchRadius()};
export const A3_LED_START = MATCH_LED;

export const cuesA = (): Cue[] => {
  const ev: Cue[] = [];
  // A2: the thumb meets the cap (soft), then the cap bottoms out in its guard: the fire-button click (on "person")
  ev.push({kind: 'click', t: A2_CONTACT, gain: -40, name: 'A2 thumb meets the cap'});
  ev.push({kind: 'button', t: A2_PRESS, gain: -20, hero: true, name: 'A2 FIRE button pressed', args: {f: 1500}});
  ev.push({kind: 'pulse', t: A2_LED, gain: -40, name: 'A2 remote LED turns amber'});
  // A3: the backpack's LED is lit on the cut (the command arrives), the signal runs to the coil, the coil heats
  ev.push({kind: 'pulse', t: A3R.from / 30, gain: -28, name: 'A3 backpack LED lights'});
  ev.push({kind: 'pulse', t: A3_SIG0, gain: -36, name: 'A3 signal leaves along the trace'});
  ev.push({kind: 'sizzle', t: A3_HEAT0, gain: -38, name: 'A3 coil starts to glow (small)', args: {d: A3R.to / 30 - A3_HEAT0}});
  // A4: the aftermath; a faint glove creak on the remote as he nods
  ev.push({kind: 'creak', t: A4_NOD, gain: -46, name: 'A4 nod: glove on the remote'});
  // C4: the medic's steps in the feed, faint (heard as through the monitor), until the cut
  for (const {t, g} of steps(touchdownsP((ff) => feedMedicPose(ff / 30), C4R.from, C4R.to))) ev.push({kind: 'tick', t, gain: Math.round((-47 + g) * 10) / 10, name: 'C4 feed foot'});
  return ev;
};
