// V3 shot group D (see production/V3_SHOT_PLAN.md): the demonstration, one continuous trial (d/trial.ts).
// D1 low side view: the medic stops and lines up on the clear target (antennae on its face); DT the operator's thumb
// presses the fire button (low over the thumb, his face beyond in the monitor's glow); D2 ECU: the coil parts the line,
// the spring drives the injector, the needle into the clear silicone (squash, rings, rebound); D3 the cutaway: gas
// behind the plunger, the amber dose diffuses as a small soft cloud in the silicone; D5 one rise over the bench (the array of earlier trials)
// toward the bright window, whose light fills the frame (the film's daylight bloom into E1).
import React from 'react';
import {ShotProps} from './index2';
import {Cue, touchdownsP, steps} from '../../events';
import {FPS} from '../../timeline';
import {shotRange} from '../cuts2';
import {D1} from './d/D1';
import {DT, DT_CONTACT} from './d/DT';
import {D2} from './d/D2';
import {D3} from './d/D3';
import {D5} from './d/D5';
import {dPoseFull, dLaunch, D_PRESS, D_FIRE, D_IMPACT, D_SEAL, D_PLUNGE1} from './d/trial';

export const SHOTS_D: Record<string, React.FC<ShotProps>> = {D1, DT, D2, D3, D5};

/** caption centre y per shot. D1: top band over the lab wall (the insect and the target sit at y 800-1250).
 *  DT: the low band, over the coat sleeve and the soft bench (his face is at y 350-900, the thumb and the button at
 *  y 1150-1450). D2, D3: top band over the blurred wall (the tube at y 900, the head below it, the target's top ~730).
 *  D5: top band (the bench, the insect and the targets are in the lower two thirds as the camera rises; the window
 *  rises into the upper middle). */
export const CAPY_D: Record<string, number> = {D1: 270, DT: 270, D2: 270, D3: 270, D5: 270};

/** retired with D6 (V2); E1 reads it until it stops: the narrow opening it matched (screen px) */
export const D6_GAP = {x0: 330, x1: 750, y0: 0, y1: 1920};

const r10 = (x: number) => Math.round(x * 10) / 10;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
export const cuesD = (): Cue[] => {
  const ev: Cue[] = [];
  const d1 = shotRange('D1');
  // D1: the last steps into the stop (close, low: a little body)
  for (const {t, g} of steps(touchdownsP((ff) => dPoseFull(ff / FPS), d1.from, d1.to))) ev.push({kind: 'tick', t: r3(t), gain: r10(-36 + g), name: 'D1 foot (lining up)', args: {body: 1.0, bright: 0.5}});
  // DT: the thumb drives the cap home (the click as it bottoms out)
  ev.push({kind: 'button', t: r3(D_PRESS - 0.01), gain: -24, name: 'DT FIRE BUTTON pressed (cap bottoms out)', args: {f: 1700}});
  // the coil goes hot from the press to the release (a faint standby warmth before it is silent)
  ev.push({kind: 'sizzle', t: r3(D_PRESS), gain: -29, name: 'D2 coil heats (from the press)', args: {d: r3(D_FIRE - D_PRESS)}});
  // D2: the line parts, the spring drives the injector, the needle into the silicone
  ev.push({kind: 'click', t: r3(D_FIRE), gain: -16, hero: true, name: 'D2 LINE PARTS (small spark at the coil)'});
  ev.push({kind: 'spring', t: r3(D_FIRE + 0.005), gain: -23, hero: true, name: 'D2 spring drives the injector along the tube'});
  ev.push({kind: 'thock', t: r3(D_IMPACT), gain: -17, hero: true, name: 'D2 NEEDLE INTO SILICONE (squash, rebound)'});
  // D3: the activator seal opens, gas pushes the plunger
  ev.push({kind: 'click', t: r3(D_SEAL), gain: -33, name: 'D3 seal opens', args: {f: 3200, d: 0.04, bright: 0.6}});
  ev.push({kind: 'fizz', t: r3(D_SEAL + 0.04), gain: -31, name: 'D3 gas behind the plunger', args: {d: r3(D_PLUNGE1 - D_SEAL + 0.1)}});
  return ev;
};
/** (for checks) the thumb meets the cap, the needle's contact frame */
export const D_TIMES = {contact: DT_CONTACT, press: D_PRESS, fire: D_FIRE, impact: D_IMPACT, seal: D_SEAL, seat: D_IMPACT + 0.2, launch: dLaunch};
