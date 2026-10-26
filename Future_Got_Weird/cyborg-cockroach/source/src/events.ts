// Sound cues from the picture: every time here is read from the shot code (or the narration timeline), so the mix
// follows the frames the picture actually uses. tools/export_cues.ts writes these to audio/cues.json.
import {FPS, FRAMES, WORDS, word} from './timeline';
import {SHOT_FRAMES} from './cuts';
import {poseRoach, RoachMotion} from './rig/roach';
import {s01Motion, S01_FIRE} from './shots/S01';

export type Cue = {kind: string; t: number; gain?: number; hero?: boolean; name?: string; lead?: number; args?: Record<string, number | boolean>};
const shot = (id: string) => {
  const i = SHOT_FRAMES.findIndex(([k]) => k === id);
  return {from: SHOT_FRAMES[i][1], to: i + 1 < SHOT_FRAMES.length ? SHOT_FRAMES[i + 1][1] : FRAMES};
};

/** foot touchdowns of an insect over a frame range, from its posed legs (a leg goes from swing to stance) */
export const touchdowns = (motion: (f: number) => RoachMotion, f0: number, f1: number) => {
  const out: number[] = [];
  let prev: boolean[] | null = null;
  for (let f = f0; f < f1; f++) {
    // sample at sub-frame steps so contacts land between frames when they should
    for (let k = 0; k < 4; k++) {
      const ff = f + k / 4;
      const up = poseRoach(motion(ff)).legs.map((l) => l.up);
      if (prev) up.forEach((u, i) => {
        if (prev![i] && !u) out.push(ff / FPS);
      });
      prev = up;
    }
  }
  return out;
};

export const buildCues = () => {
  const ev: Cue[] = [];
  // S01: the last steps, then the release (click + spring + coil), the short flight and the restrained impact
  const s1 = shot('S01');
  const m1 = (ff: number) => {
    const t = ff / FPS;
    const {path, s} = s01Motion(t);
    return {path, s, t};
  };
  for (const td of touchdowns(m1, s1.from, s1.to)) ev.push({kind: 'tick', t: td, gain: -36, name: 'S01 foot'});
  ev.push({kind: 'sizzle', t: S01_FIRE - 0.12, gain: -34, name: 'S01 coil heats'});
  ev.push({kind: 'click', t: S01_FIRE, gain: -14, hero: true, name: 'S01 RELEASE: latch line parts (accent 1)'});
  ev.push({kind: 'spring', t: S01_FIRE + 0.005, gain: -22, hero: true, name: 'S01 spring'});
  ev.push({kind: 'zing', t: S01_FIRE + 0.08, gain: -32, name: 'S01 flight'});
  ev.push({kind: 'thock', t: S01_FIRE + 0.2, gain: -18, hero: true, name: 'S01 IMPACT into silicone'});
  return ev;
};

export const SECTIONS = {
  bridge: SHOT_FRAMES.find(([k]) => k === 'S12')![1] / FPS, // the occlusion bridge into the rubble
  rubble: SHOT_FRAMES.find(([k]) => k === 'S12')![1] / FPS,
  recog: word('you', 1).start, // "you might actually..." (the second "you")
};
export const cueFile = () => ({fps: FPS, frames: FRAMES, words: WORDS, sections: SECTIONS, events: buildCues()});
