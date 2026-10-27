// V2 shot group C (see production/V2_SHOT_PLAN.md): C1 two insects, two jobs; C2 push to the observer's lens; C3 the
// lens's view (the feed, reused by group A's C4 monitor through C3Feed).
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP, steps} from '../../events';
import {shotRange} from '../cuts2';
import {C1, c1Medic, c1Obs} from './c/C1';
import {C2, c2Pose} from './c/C2';
import {C3, C3_THROUGH} from './c/C3';
import {C3Feed} from './c/Feed';
import {feedMedicPose, feedObsPose} from './c/course';

export const SHOTS_C: Record<string, React.FC<ShotProps>> = {C1, C2, C3};
/** the observer's camera feed for any film frame f (C3 is 372-429; the medic's approach continues through 465 and
 *  beyond), drawn into a w x h box; `id` prefixes its SVG ids (give each instance its own) */
export {C3Feed};

/** caption centre y per shot. C1: top band (the pair fills the middle, the observer's legs reach about y 1400).
 *  C2: top band, over the blurred wall (the insect, then the lens, fill the middle; "carries a camera," starts on
 *  C1's last frame and keeps C1's band anyway). C3: top band, over the blurred lab wall (the medic walks at y 1150-1400,
 *  the target is near the horizon, the observer's own antennae sweep the bottom of the feed). */
export const CAPY_C: Record<string, number> = {C1: 270, C2: 270, C3: 270};

const CLOSE_STEP = {body: 1.0, bright: 0.5};
const r10 = (x: number) => Math.round(x * 10) / 10;
export const cuesC = (): Cue[] => {
  const ev: Cue[] = [];
  const c1 = shotRange('C1'), c2 = shotRange('C2'), c3 = shotRange('C3');
  // C1: two insects walking, mid distance (the observer a touch nearer the viewer)
  for (const {t, g} of steps(touchdownsP((ff) => c1Medic(ff), c1.from, c1.to))) ev.push({kind: 'tick', t, gain: r10(-39 + g), name: 'C1 medic foot'});
  for (const {t, g} of steps(touchdownsP((ff) => c1Obs(ff), c1.from, c1.to))) ev.push({kind: 'tick', t, gain: r10(-37 + g), name: 'C1 observer foot'});
  // C2: the observer close (more body, less tick) as the push closes on its camera
  for (const {t, g} of steps(touchdownsP((ff) => c2Pose(ff), c2.from, c2.to))) ev.push({kind: 'tick', t, gain: r10(-35 + g), name: 'C2 observer foot (close)', args: CLOSE_STEP});
  // C3: the push carries on through the lens (a soft rising air pass), then the feed
  ev.push({kind: 'air', t: (c3.from - 2) / 30, gain: -31, name: 'C3 through the lens', args: {d: (C3_THROUGH + 3 - c3.from) / 30, lo: 400, hi: 3200, rise: true}});
  // the camera rides the observer: its own steps, soft and close; the medic ahead, fainter
  for (const {t, g} of steps(touchdownsP((ff) => feedObsPose(ff / 30), C3_THROUGH, c3.to))) ev.push({kind: 'tick', t, gain: r10(-38 + g), name: 'C3 observer foot (under the lens, soft)', args: {body: 1.0, bright: 0.3}});
  for (const {t, g} of steps(touchdownsP((ff) => feedMedicPose(ff / 30), C3_THROUGH, c3.to))) ev.push({kind: 'tick', t, gain: r10(-44 + g), name: 'C3 medic foot (ahead in the feed)'});
  return ev;
};
