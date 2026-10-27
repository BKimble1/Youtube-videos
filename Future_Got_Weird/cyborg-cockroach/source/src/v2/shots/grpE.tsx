// V3 shot group E (see production/V3_SHOT_PLAN.md): the rescue journey, a FUTURE RESCUE CONCEPT. E1 a collapsed
// building in daylight, the crane down to a narrow opening under a fallen slab, the medic walking toward it; E2 behind
// it into the gap (a gloved hand for scale), the light falling off; E3 side-tracking under a huge broken beam, a shaft
// of daylight; E4 macro on its legs over uneven rubble; E5 the observer's feed down a dark passage; E6 the operator at
// the rubble's edge studies the feed and steers the medic with the D-pad. (F1-F5 live in grpF.tsx.)
import React from 'react';
import {ShotProps} from './index2';
import {E1, e1Pose} from './e/rescue/E1r';
import {E2, e2Pose, e2U} from './e/rescue/E2r';
import {E3, e3Pose, E3_GRIT} from './e/rescue/E3r';
import {E4, e4Pose} from './e/rescue/E4r';
import {E5, feedMedic} from './e/rescue/E5r';
import {E6, e6Press} from './e/rescue/E6r';
import {shotRange} from '../cuts2';
import {Cue, touchdownsP, steps} from '../../events';

export const SHOTS_E: Record<string, React.FC<ShotProps>> = {E1, E2, E3, E4, E5, E6};

/** caption centre y per shot (screen px). A caption keeps the placement of the shot it starts in: "beneath" and
 *  "collapsed buildings," start in E2 and run through E3; "carrying" and "emergency medicine." start in E4 and run
 *  through E5 and E6. So E2/E3 share the top band (clear of the concept label, which ends at y ~235), E4-E6 the low
 *  band. Never over the insects or the operator's face. */
export const CAPY_E: Record<string, number> = {
  E1: 1590, // low, over the dusty ground in front of the opening (the medic walks at y 1400-1480; the label is top right)
  E2: 300, // top, over the fallen slab's top face (the medic at y 1300-1460, the glove lower right)
  E3: 300, // top, over the beam's face (the medic walks on the floor at y ~1300)
  E4: 1560, // low, over the rubble below the near legs (the near feet reach y ~1300)
  E5: 1560, // low, over the lamp-lit floor of the feed (the medic at y 1150-1260, the observer's antennae below y 1700)
  E6: 1560, // low, over the table's front and the rubble (his hands and the remote at y 1050-1200, his face ~800)
};

const FPS = 30;

export const cuesE = (): Cue[] => {
  const ev: Cue[] = [];
  const e1 = shotRange('E1'), e2 = shotRange('E2'), e3 = shotRange('E3'), e4 = shotRange('E4'), e5 = shotRange('E5'), e6 = shotRange('E6');
  // E1: the medic tiny in the wide shot, its feet faint (from when the daylight bloom has cleared)
  for (const {t, g} of steps(touchdownsP((ff) => e1Pose(ff - e1.from), e1.from + 9, e1.to))) ev.push({kind: 'tick', t, gain: -48 + g, name: 'E1 foot (far, at the opening)'});
  // E2: the camera goes in through the gap with the insect (one air pass, falling as the daylight is cut off), its feet
  let lfIn = 0;
  while (lfIn < e2.to - e2.from && e2U(lfIn) < 0.92) lfIn++;
  ev.push({kind: 'air', t: e2.from / FPS, gain: -31, name: 'E2 through the gap under the slab (air pass)', args: {d: lfIn / FPS, lo: 200, hi: 2200, rise: false}});
  for (const {t, g} of steps(touchdownsP((ff) => e2Pose(ff - e2.from), e2.from, e2.to))) ev.push({kind: 'tick', t, gain: -38 + g, name: 'E2 foot (into the gap)'});
  // E3: grit trickles from the crack in the beam down through the shaft; its feet on the floor slab
  ev.push({kind: 'grit', t: e3.from / FPS + E3_GRIT.t0, gain: -40, name: 'E3 grit from the crack in the beam', args: {d: E3_GRIT.dur, rate: 18}});
  for (const {t, g} of steps(touchdownsP((ff) => e3Pose(ff - e3.from), e3.from, e3.to))) ev.push({kind: 'tick', t, gain: -41 + g, name: 'E3 foot (under the beam)'});
  // E4: macro: the feet on the rubble, close (more body), with a little grit under them
  for (const {t, g} of steps(touchdownsP((ff) => e4Pose(ff - e4.from), e4.from, e4.to))) ev.push({kind: 'tick', t, gain: -33 + g, name: 'E4 foot (macro, on the rubble)', args: {body: 1.0, bright: 0.5}});
  ev.push({kind: 'grit', t: e4.from / FPS + 0.04, gain: -41, name: 'E4 grit under the feet', args: {d: (e4.to - e4.from) / FPS - 0.08, rate: 12}});
  // E5: the feed cuts in (a small electronic tick); the medic's feet heard faintly through it
  ev.push({kind: 'click', t: e5.from / FPS, gain: -36, name: 'E5 feed tick (the observer camera cuts in)', args: {f: 4200, d: 0.02, bright: 0.8}});
  for (const {t, g} of steps(touchdownsP((ff) => feedMedic(ff), e5.from, e5.to))) ev.push({kind: 'tick', t, gain: -48 + g, name: 'E5 feed foot (faint)'});
  // E6: the thumb presses the D-pad (it bottoms out), the steering pulse goes out; the medic turns right in the feed
  let fDown = e6.from;
  while (fDown < e6.to && e6Press(fDown) < 0.98) fDown++;
  ev.push({kind: 'button', t: fDown / FPS, gain: -30, name: 'E6 operator presses the D-pad (right)', args: {f: 1900}});
  ev.push({kind: 'pulse', t: fDown / FPS + 0.04, gain: -40, name: 'E6 steering pulse (the medic turns right in the feed)'});
  return ev;
};
