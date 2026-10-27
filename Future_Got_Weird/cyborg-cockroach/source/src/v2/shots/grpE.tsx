// V2 shot group E (see production/V2_SHOT_PLAN.md): E1 (the rubble), F1-F4 (her pocket, the crack, the medic comes on).
import React from 'react';
import {ShotProps} from './index2';
import {E1, e1Pose, E1_GRIT, e1U} from './e/E1';
import {F2, F2_GRIT} from './e/F2';
import {F1, F3, F4, F1_GRIT, F1_SCRAPE, F3_RECOIL} from './e/F';
import {emergePose} from './e/emerge';
import {shotRange} from '../cuts2';
import {Cue, touchdownsP} from '../../events';

export const SHOTS_E: Record<string, React.FC<ShotProps>> = {E1, F1, F2, F3, F4};

/** caption centre y per shot (screen px), kept off her face and eyes and off the insect's head */
export const CAPY_E: Record<string, number> = {
  E1: 1590, // low, over the dark ledge face and foreground rubble (the medic walks at y 1250-1450, her head at ~800)
  F1: 1560, // low, over her forearms (her face fills y 330-1100)
  F2: 1570, // low, over the floor in front of the crack (the insect's head at ~y 1050-1250)
  F3: 1330, // between her hands (bottom ~y 1280) and the insect coming in at the lower left (antennae ~y 1380+, tube ~1420)
  F4: 270, // top band, over the slab (her head top ~y 420, the insect at y 1350-1550)
};

const FPS = 30;
/** one tick per contact instant (the legs of a tripod land together: one tick, energies summed; as events.ts steps()) */
const steps = (tds: number[]) => {
  const legs = new Map<number, number>();
  for (const td of tds) legs.set(td, (legs.get(td) ?? 0) + 1);
  return [...legs].map(([t, n]) => ({t, g: 10 * Math.log10(n)}));
};

export const cuesE = (): Cue[] => {
  const ev: Cue[] = [];
  const e1 = shotRange('E1'), f1 = shotRange('F1'), f2 = shotRange('F2'), f3 = shotRange('F3'), f4 = shotRange('F4');
  // E1: out of the lab gap into the rubble (the near edges pass the lens), the medic's feet on the ledge, a grit
  // trickle from the slab over her, the rubble settling
  let lfPast = 0;
  while (lfPast < e1.to - e1.from && e1U(lfPast) < 0.5) lfPast++;
  ev.push({kind: 'air', t: e1.from / FPS, gain: -30, name: 'E1 through the gap (the near rubble edges pass the lens)', args: {d: lfPast / FPS, lo: 220, hi: 2200, rise: false}});
  for (const {t, g} of steps(touchdownsP((ff) => e1Pose(ff - e1.from), e1.from, e1.to))) ev.push({kind: 'tick', t, gain: -39 + g, name: 'E1 foot (on the ledge)'});
  ev.push({kind: 'grit', t: e1.from / FPS + E1_GRIT.t0, gain: -40, name: 'E1 grit trickle from the slab over her', args: {d: E1_GRIT.dur, rate: 18}});
  ev.push({kind: 'creak', t: e1.from / FPS + 1.9, gain: -38, name: 'E1 rubble creaks'});
  // F1: the trickle she hears, then the scrape at the debris by the crack (her eyes dart to it)
  ev.push({kind: 'grit', t: f1.from / FPS + F1_GRIT.t0, gain: -37, name: 'F1 grit trickle (she hears it)', args: {d: F1_GRIT.dur, rate: 22}});
  ev.push({kind: 'grit', t: (f1.from + F1_SCRAPE) / FPS, gain: -36, name: 'F1 scrape at the crack (her eyes dart to it)', args: {d: 0.18, rate: 40}});
  // F2: the emergence: grit from the crack as the head pushes out, the first steps out (close)
  ev.push({kind: 'grit', t: f2.from / FPS + F2_GRIT.t0, gain: -38, name: 'F2 grit from the crack as it pushes out', args: {d: F2_GRIT.dur, rate: 16}});
  for (const {t, g} of steps(touchdownsP((ff) => emergePose(ff / FPS), f2.from, f2.to))) ev.push({kind: 'tick', t, gain: -35 + g, name: 'F2 foot (close, out of the crack)', args: {body: 1.0, bright: 0.5}});
  // F3: she startles (the rubble shifts under her); its feet keep coming
  ev.push({kind: 'creak', t: (f3.from + F3_RECOIL.l0) / FPS, gain: -40, name: 'F3 rubble shifts under her startle'});
  for (const {t, g} of steps(touchdownsP((ff) => emergePose(ff / FPS), f3.from, f3.to))) ev.push({kind: 'tick', t, gain: -39 + g, name: 'F3 foot'});
  // F4: it comes on toward her hand
  for (const {t, g} of steps(touchdownsP((ff) => emergePose(ff / FPS), f4.from, f4.to))) ev.push({kind: 'tick', t, gain: -37 + g, name: 'F4 foot (coming on)'});
  return ev;
};
