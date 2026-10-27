// V2 sound cues: every shot group's cues (read from its own shot code) plus the hook and loop shots', and the music
// sections for the mixer (tools/make_audio.py with CUES=audio/cues_v2.json TAG=_v2 VER=V2).
import {FPS, WORDS, word} from '../timeline';
import {Cue, touchdownsP, steps} from '../events';
import {FRAMES2, shotRange} from './cuts2';
import * as GA from './shots/grpA';
import * as GB from './shots/grpB';
import * as GC from './shots/grpC';
import * as GD from './shots/grpD';
import * as GE from './shots/grpE';
import * as GF from './shots/grpF';
import {a1Pose, A1_REL, A1_IMPACT, A1_PRESS} from './shots/h/A1';

/** a close step (A1 and F5 share the camera and the scale, so the loop joins them): more body, less tick */
const CLOSE_STEP = {body: 1.0, bright: 0.5};

export const cuesH = (): Cue[] => {
  const ev: Cue[] = [];
  const a1 = shotRange('A1'), f5 = shotRange('F6');
  // A1: the last step into the stance, the coil, the release (accent 1), the spring, the needle seating
  for (const {t, g} of steps(touchdownsP((ff) => a1Pose(ff / FPS), a1.from, a1.to))) ev.push({kind: 'tick', t, gain: -31 + g, name: 'A1 foot', args: CLOSE_STEP});
  ev.push({kind: 'sizzle', t: 0, gain: -33, name: 'A0 coil standby glow', args: {d: A1_PRESS}});
  ev.push({kind: 'button', t: A1_PRESS, gain: -27, name: 'off-screen FIRE press (the operator; seen in A2)', args: {f: 1500}});
  ev.push({kind: 'sizzle', t: A1_PRESS + 0.01, gain: -28, name: 'A1 coil driven hot', args: {d: A1_REL - A1_PRESS}});
  ev.push({kind: 'click', t: A1_REL, gain: -15, hero: true, name: 'A1 TRIGGER: latch line parts'});
  ev.push({kind: 'spring', t: A1_REL + 0.004, gain: -19, hero: true, name: 'A1 spring drives the injector'});
  ev.push({kind: 'zing', t: A1_REL + 0.02, gain: -27, name: 'A1 injector slides along the tube', args: {d: A1_IMPACT - A1_REL}});
  ev.push({kind: 'thock', t: A1_IMPACT, gain: -16, hero: true, name: 'A1 IMPACT: needle into the silicone'});
  ev.push({kind: 'click', t: A1_IMPACT + 0.06, gain: -30, name: 'A1 rebound tick', args: {f: 2600, d: 0.03, bright: 0.4}});
  // F5: the final approach (accent 3) on loop time, the same insect and scale as A1's steps
  const tau = (ff: number) => ff / FPS - FRAMES2 / FPS;
  for (const {t, g} of steps(touchdownsP((ff) => a1Pose(tau(ff)), f5.from, f5.to))) ev.push({kind: 'tick', t, gain: -30 + g, hero: true, name: 'F5 foot (FINAL APPROACH, accent 3)', args: CLOSE_STEP});
  ev.push({kind: 'grit', t: f5.from / FPS + 0.1, gain: -40, name: 'F5 grit under the feet', args: {d: 1.2, rate: 14}});
  return ev;
};
const groupCues = (m: Record<string, unknown>, k: string): Cue[] => {
  const fn = m[k] as (() => Cue[]) | undefined;
  return typeof fn === 'function' ? fn() : [];
};
export const buildCues2 = (): Cue[] => [
  ...cuesH(),
  ...groupCues(GA as Record<string, unknown>, 'cuesA'),
  ...groupCues(GB as Record<string, unknown>, 'cuesB'),
  ...groupCues(GC as Record<string, unknown>, 'cuesC'),
  ...groupCues(GD as Record<string, unknown>, 'cuesD'),
  ...groupCues(GE as Record<string, unknown>, 'cuesE'),
  ...groupCues(GF as Record<string, unknown>, 'cuesF'),
].sort((a, b) => a.t - b.t);

export const SECTIONS2 = {
  bridge: shotRange('E1').from / FPS, // into the rubble
  rubble: shotRange('E1').from / FPS,
  recog: word('you', 1).start, // "you might actually..."
};
export const cueFile2 = () => ({fps: FPS, frames: FRAMES2, words: WORDS, sections: SECTIONS2, events: buildCues2()});
