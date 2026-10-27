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
import {a1Pose, A1_FIRE} from './shots/h/A1';

/** a close step (A1 and F5 share the camera and the scale, so the loop joins them): more body, less tick */
const CLOSE_STEP = {body: 1.0, bright: 0.5};

export const cuesH = (): Cue[] => {
  const ev: Cue[] = [];
  const a1 = shotRange('A1'), f5 = shotRange('F5');
  // A1: the last step into the stance, the coil, the release (accent 1), the spring, the needle seating
  for (const {t, g} of steps(touchdownsP((ff) => a1Pose(ff / FPS), a1.from, a1.to))) ev.push({kind: 'tick', t, gain: -31 + g, name: 'A1 foot', args: CLOSE_STEP});
  ev.push({kind: 'sizzle', t: A1_FIRE - 0.3, gain: -32, name: 'A1 coil heats', args: {d: 0.3}});
  ev.push({kind: 'click', t: A1_FIRE, gain: -14, hero: true, name: 'A1 RELEASE: latch line parts (accent 1)'});
  ev.push({kind: 'spring', t: A1_FIRE + 0.004, gain: -21, hero: true, name: 'A1 spring snaps'});
  ev.push({kind: 'thock', t: A1_FIRE + 0.075, gain: -19, hero: true, name: 'A1 needle seats in the silicone'});
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
].sort((a, b) => a.t - b.t);

export const SECTIONS2 = {
  bridge: shotRange('E1').from / FPS, // into the rubble
  rubble: shotRange('E1').from / FPS,
  recog: word('you', 1).start, // "you might actually..."
};
export const cueFile2 = () => ({fps: FPS, frames: FRAMES2, words: WORDS, sections: SECTIONS2, events: buildCues2()});
