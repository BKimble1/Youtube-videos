// V3 shot group C (see production/V3_SHOT_PLAN.md): C1 the two configurations side by side (low, close); C2 the
// observer walks up to the camera until its lens fills the frame; C3 through the lens: its feed following the medic;
// C4 the feed on the operator's monitor, his thumb coming down over the button; C5 a high three-quarter from behind the
// pair (el 48; V5g, was an el 80 overhead): the medic walks out of the lane at the clear target, the observer behind it.
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP, steps} from '../../events';
import {shotRange} from '../cuts2';
import {C1, c1Medic, c1Obs} from './c/C1';
import {C2, c2Pose} from './c/C2';
import {C3, C3_THROUGH} from './c/C3';
import {C4} from './c/C4';
import {C5, c5Medic, c5Obs} from './c/C5';
import {C3Feed} from './c/Feed';
import {feedMedicPose, feedObsPose} from './c/course';

export const SHOTS_C: Record<string, React.FC<ShotProps>> = {C1, C2, C3, C4, C5};
/** the observer's camera feed for any film frame f (the medic's walk down the course runs from frame 345 to past 465),
 *  drawn into a w x h box; `id` prefixes its SVG ids (give each instance, and each frame, its own) */
export {C3Feed};

/** caption centre y per shot.
 *  C1: top band, over the blurred wall (the medic's antennae reach up to about y 850, the observer's aerial ~1150).
 *  C2: top band, over the blurred wall shelves (the aerial and then the camera module rise to about y 520 at most).
 *  C3: top band, over the blurred lab wall of the feed (the medic walks at y 1150-1400).
 *  C4: top band, over the wall above the monitor and his hair.
 *  C5: top band, over the empty tray and the backstop blocks (the target sits at y 400-870, the insects below). */
export const CAPY_C: Record<string, number> = {C1: 270, C2: 270, C3: 270, C4: 270, C5: 270};

const CLOSE_STEP = {body: 1.0, bright: 0.5};
const r10 = (x: number) => Math.round(x * 10) / 10;
export const cuesC = (): Cue[] => {
  const ev: Cue[] = [];
  const c1 = shotRange('C1'), c2 = shotRange('C2'), c3 = shotRange('C3'), c4 = shotRange('C4'), c5 = shotRange('C5');
  // C1: both insects walking close to the camera (the observer nearest)
  for (const {t, g} of steps(touchdownsP((ff) => c1Obs(ff), c1.from, c1.to))) ev.push({kind: 'tick', t, gain: r10(-35 + g), name: 'C1 observer foot (near)'});
  for (const {t, g} of steps(touchdownsP((ff) => c1Medic(ff), c1.from, c1.to))) ev.push({kind: 'tick', t, gain: r10(-39 + g), name: 'C1 medic foot'});
  // C2: the observer walking up to the camera: its steps get closer (more body) as it arrives
  for (const {t, g} of steps(touchdownsP((ff) => c2Pose(ff), c2.from, c2.to))) {
    const k = (t * 30 - c2.from) / (c2.to - c2.from);
    ev.push({kind: 'tick', t, gain: r10(-38 + 6 * k + g), name: 'C2 observer foot (approaching)', args: CLOSE_STEP});
  }
  // its lens arrives at the camera: a soft rising air pass through the glass into the feed
  ev.push({kind: 'air', t: (c3.from - 3) / 30, gain: -31, name: 'C2/C3 through the lens', args: {d: (C3_THROUGH + 4 - (c3.from - 3)) / 30, lo: 400, hi: 3200, rise: true}});
  // C3: the feed. The camera rides the observer: its own steps, soft and close; the medic ahead, fainter
  for (const {t, g} of steps(touchdownsP((ff) => feedObsPose(ff / 30), C3_THROUGH, c3.to))) ev.push({kind: 'tick', t, gain: r10(-38 + g), name: 'C3 observer foot (under the lens, soft)', args: {body: 1.0, bright: 0.3}});
  for (const {t, g} of steps(touchdownsP((ff) => feedMedicPose(ff / 30), C3_THROUGH, c3.to))) ev.push({kind: 'tick', t, gain: r10(-44 + g), name: 'C3 medic foot (ahead in the feed)'});
  // C4: the same feed, heard faintly through the monitor
  for (const {t, g} of steps(touchdownsP((ff) => feedMedicPose(ff / 30), c4.from, c4.to))) ev.push({kind: 'tick', t, gain: r10(-48 + g), name: 'C4 medic foot (on the monitor)'});
  // C5: high three-quarter, mid distance: the medic walking at the target, the observer behind it
  for (const {t, g} of steps(touchdownsP((ff) => c5Medic(ff), c5.from, c5.to))) ev.push({kind: 'tick', t, gain: r10(-39 + g), name: 'C5 medic foot (overhead)'});
  for (const {t, g} of steps(touchdownsP((ff) => c5Obs(ff), c5.from, c5.to))) ev.push({kind: 'tick', t, gain: r10(-43 + g), name: 'C5 observer foot (overhead, behind)'});
  return ev;
};
