// V4 shot group E (see production/V3_SHOT_PLAN.md): the rescue journey, a FUTURE RESCUE CONCEPT. E1 a collapsed
// building in daylight, the crane down that curves into a push toward a narrow opening under a fallen slab, the medic
// walking into it beside a rescuer's resting glove; E2 the same descent carried on (matched speed) in under the slab's
// lip with the insect, a pinhole camera over layers at real depths (the glove for scale), the light falling off; E3 side-tracking under a huge broken beam, a shaft
// of daylight; E4 macro on its legs over uneven rubble; E5 the observer's feed down a dark passage; E6 the operator at
// the rubble's edge studies the feed and steers the medic with the D-pad. (F1-F5 live in grpF.tsx.)
import React from 'react';
import {ShotProps} from './index2';
import {E1, e1Pose} from './e/rescue/E1r';
import {E2, e2Pose, e2LipLf} from './e/rescue/E2r';
import {E3, e3Pose, E3_GRIT} from './e/rescue/E3r';
import {E4, e4Pose} from './e/rescue/E4r';
import {E5, feedMedic} from './e/rescue/E5r';
import {E6, e6Press} from './e/rescue/E6r';
import {shotRange} from '../cuts2';
import {Cue, touchdownsP, steps} from '../../events';
import {clamp} from '../../lib/ease';

export const SHOTS_E: Record<string, React.FC<ShotProps>> = {E1, E2, E3, E4, E5, E6};

/** caption centre y per shot (screen px). A caption keeps the placement of the shot it starts in. E1-E3 share the top
 *  band (clear of the concept label, which ends at y ~235): in E1 the crane carries the insect up through the low band,
 *  so the caption stays over the sky and the building; "beneath" and "collapsed buildings," then hold the same place
 *  over the slab's face, the dark underside and the beam. "carrying" and "emergency medicine." start in E4 and run
 *  through E5 and E6 in the low band. Never over the insects, the glove or the operator's face. */
export const CAPY_E: Record<string, number> = {
  E1: 300, // top, over the sky and the facade (the medic rises from below the frame to the opening at y ~1340)
  E2: 300, // top, over the slab's face, then its dark underside (the medic at y 1290-1400, the glove at the right)
  E3: 300, // top, over the beam's face (the medic walks on the floor at y 1220-1352)
  E4: 1560, // low, over the rubble below the near legs (the near feet reach y ~1350, the antennae ~1300)
  E5: 1560, // low, over the lamp-lit floor of the feed (the medic at y 1150-1260, the observer's antennae below y 1700)
  E6: 1560, // low, over the table's front and the rubble (his hands and the remote at y 1050-1200, his face ~800)
};

const FPS = 30;

export const cuesE = (): Cue[] => {
  const ev: Cue[] = [];
  const e1 = shotRange('E1'), e2 = shotRange('E2'), e3 = shotRange('E3'), e4 = shotRange('E4'), e5 = shotRange('E5'), e6 = shotRange('E6');
  // rubble ambience: the open air over the collapse in E1 (a soft wind bed that closes down as the camera descends into
  // the gap), a distant settling creak while the crane comes down, and the beam creaking in E3
  ev.push({kind: 'air', t: e1.from / FPS + 0.2, gain: -40, name: 'E1 open air over the collapse (wind bed)', args: {d: (e1.to - e1.from) / FPS - 0.1, lo: 260, hi: 1500, rise: false}});
  ev.push({kind: 'creak', t: e1.from / FPS + 0.35, gain: -45, name: 'E1 distant rubble settles', args: {d: 0.7}});
  // E1: the medic tiny in the wide shot, its feet faint (from when the daylight bloom has cleared)
  for (const {t, g} of steps(touchdownsP((ff) => e1Pose(ff - e1.from), e1.from + 9, e1.to))) ev.push({kind: 'tick', t, gain: -48 + g, name: 'E1 foot (far, at the opening)'});
  // E2: the camera carries on in under the slab with the insect (one air pass, falling as the lip passes overhead and
  // the daylight is cut off), a little grit spilling off the lip as it goes over, its feet (louder as the camera nears)
  const lip = e2LipLf();
  ev.push({kind: 'air', t: e2.from / FPS - 0.05, gain: -32, name: 'E2 through the gap under the slab (air pass)', args: {d: (lip + 4) / FPS, lo: 200, hi: 2200, rise: false}});
  ev.push({kind: 'grit', t: (e2.from + lip - 3) / FPS, gain: -46, name: 'E2 grit off the lip overhead', args: {d: 0.3, rate: 14}});
  for (const {t, g} of steps(touchdownsP((ff) => e2Pose(ff - e2.from), e2.from, e2.to))) {
    const k = clamp((t * FPS - e2.from) / (e2.to - e2.from));
    ev.push({kind: 'tick', t, gain: -44 + 7 * k + g, name: 'E2 foot (into the gap)'});
  }
  // E3: the beam creaks once overhead; grit trickles from the crack in the beam down through the shaft; its feet on the
  // floor slab (closer now)
  ev.push({kind: 'creak', t: e3.from / FPS + 0.05, gain: -44, name: 'E3 the broken beam creaks overhead', args: {d: 0.55}});
  ev.push({kind: 'grit', t: e3.from / FPS + E3_GRIT.t0, gain: -40, name: 'E3 grit from the crack in the beam', args: {d: E3_GRIT.dur, rate: 18}});
  for (const {t, g} of steps(touchdownsP((ff) => e3Pose(ff - e3.from), e3.from, e3.to))) ev.push({kind: 'tick', t, gain: -38 + g, name: 'E3 foot (under the beam)'});
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
