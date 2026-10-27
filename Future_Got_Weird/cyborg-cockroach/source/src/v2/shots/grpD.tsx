// V2 shot group D (see production/V2_SHOT_PLAN.md): the lab trial and the hand-off to the rubble.
// D1 the medic lines up on the silicone target; D2 ECU of the tube: the coil parts the line, the spring drives the
// injector, the needle goes into the silicone (on the second "fire"); D3 the cutaway: gas behind the plunger, the dose
// down the needle, a small amber bloom; D5 the whole animal with the spent injector in the target, other lab targets on
// the bench; D6 a fresh loaded medic sets off into a narrow dark gap between two tall lab blocks (D6_GAP -> E1).
import React from 'react';
import {ShotProps} from './index2';
import type {Cue} from '../../events';
import type {RoachPose} from '../../rig/roach';
import {FPS} from '../../timeline';
import {shotRange} from '../cuts2';
import {D1} from './d/D1';
import {D2} from './d/D2';
import {D3} from './d/D3';
import {D5} from './d/D5';
import {D6, d6Gap, d6Pose} from './d/D6';
import {dPoseFull, dDeploy, D_FIRE, D_SEAL, D_PLUNGE1} from './d/trial';

export const SHOTS_D: Record<string, React.FC<ShotProps>> = {D1, D2, D3, D5, D6};

/** caption centre y per shot: the top band (the lab wall / the blocks above the subject); the lower half holds the
 *  insect's head and legs (D1, D5), the head under the tube and the section (D2, D3) and the insect entering the gap (D6) */
export const CAPY_D: Record<string, number> = {D1: 290, D2: 290, D3: 290, D5: 290, D6: 290};

/** the dark opening at D6's last frame (screen px): x0/x1 its left/right edges at the mouth, y0 its top (clamped to the
 *  frame), y1 the floor at the mouth. E1 opens on a matching opening. */
export const D6_GAP = d6Gap(shotRange('D6').to - 1);

/** foot touchdowns (sub-frame), one per contact instant (the legs of a tripod summed: +10 log10(legs) dB) */
const touchdowns = (poseAt: (ff: number) => RoachPose, f0: number, f1: number) => {
  const out = new Map<number, number>();
  let prev: boolean[] | null = null;
  for (let f = f0; f < f1; f++)
    for (let k = 0; k < 4; k++) {
      const ff = f + k / 4;
      const up = poseAt(ff).legs.map((l) => l.up);
      if (prev) up.forEach((u, i) => {
        if (prev![i] && !u) out.set(ff / FPS, (out.get(ff / FPS) ?? 0) + 1);
      });
      prev = up;
    }
  return [...out].map(([t, n]) => ({t, g: 10 * Math.log10(n)}));
};

export const cuesD = (): Cue[] => {
  const ev: Cue[] = [];
  const d1 = shotRange('D1'), d6 = shotRange('D6');
  for (const {t, g} of touchdowns((ff) => dPoseFull(ff / FPS), d1.from, d1.to)) ev.push({kind: 'tick', t, gain: -36 + g, name: 'D1 foot (lining up)'});
  // the coil heats from 0.35 s before the release (Gear2D deployAt)
  ev.push({kind: 'sizzle', t: D_FIRE - 0.3, gain: -30, name: 'D2 coil heats', args: {d: 0.3}});
  ev.push({kind: 'click', t: D_FIRE, gain: -13, hero: true, name: 'D2 LINE PARTS (mechanism, accent 2)'});
  ev.push({kind: 'spring', t: D_FIRE + 0.005, gain: -21, hero: true, name: 'D2 spring drives the injector'});
  // the needle seats when the spring's stroke ends (deployAt: impact = 0)
  let tImp = D_FIRE;
  while (dDeploy(tImp).impact < 0) tImp += 0.001;
  ev.push({kind: 'thock', t: tImp, gain: -17, hero: true, name: 'D2 NEEDLE INTO SILICONE'});
  // D3: the activator seal opens on "they've", gas forms behind the plunger while it runs
  ev.push({kind: 'click', t: D_SEAL, gain: -33, name: 'D3 seal opens', args: {f: 3200, d: 0.04, bright: 0.6}});
  ev.push({kind: 'fizz', t: D_SEAL + 0.04, gain: -31, name: 'D3 gas behind the plunger', args: {d: D_PLUNGE1 - D_SEAL + 0.15}});
  // D6: the fresh medic sets off and walks into the gap; one soft air pass as the camera follows it in
  for (const {t, g} of touchdowns((ff) => d6Pose(ff / FPS), d6.from, d6.to)) ev.push({kind: 'tick', t, gain: -37 + g, name: 'D6 foot'});
  ev.push({kind: 'air', t: (d6.from + 18) / FPS, gain: -30, name: 'D6 into the gap (air pass)', args: {d: (d6.to - d6.from - 18) / FPS, lo: 250, hi: 2400, rise: true}});
  return ev;
};
