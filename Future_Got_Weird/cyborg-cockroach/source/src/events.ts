// Sound cues from the picture: every time here is read from the shot code (or the narration timeline), so the mix
// follows the frames the picture actually uses. tools/export_cues.ts writes these to audio/cues.json.
import {FPS, FRAMES, WORDS, word} from './timeline';
import {SHOT_FRAMES} from './cuts';
import {poseRoach, RoachMotion, RoachPose} from './rig/roach';
import {s01Motion, S01_FIRE} from './shots/S01';
import {S02_RELEASE} from './shots/S02';
import {medicPose as s04Medic, PULSE1, PULSE2} from './shots/S04';
import {obsPose} from './shots/S07';
import {medicPose as s08Medic} from './shots/S08';
import {alcovePose} from './shots/alcoveWorld';
import {s09Pose, S09_T_CUT, S09_IMPACT_F} from './shots/S09';
import {s11Medic} from './shots/S11';
import {s12Medic} from './shots/S12';

export type Cue = {kind: string; t: number; gain?: number; hero?: boolean; name?: string; lead?: number; args?: Record<string, number | boolean>};
const shot = (id: string) => {
  const i = SHOT_FRAMES.findIndex(([k]) => k === id);
  return {from: SHOT_FRAMES[i][1], to: i + 1 < SHOT_FRAMES.length ? SHOT_FRAMES[i + 1][1] : FRAMES};
};

/** foot touchdowns over a frame range, from posed legs (a leg goes from swing to stance) */
export const touchdownsP = (poseAt: (ff: number) => RoachPose, f0: number, f1: number) => {
  const out: number[] = [];
  let prev: boolean[] | null = null;
  for (let f = f0; f < f1; f++) {
    // sample at sub-frame steps so contacts land between frames when they should
    for (let k = 0; k < 4; k++) {
      const ff = f + k / 4;
      const up = poseAt(ff).legs.map((l) => l.up);
      if (prev) up.forEach((u, i) => {
        if (prev![i] && !u) out.push(ff / FPS);
      });
      prev = up;
    }
  }
  return out;
};
export const touchdowns = (motion: (f: number) => RoachMotion, f0: number, f1: number) => touchdownsP((ff) => poseRoach(motion(ff)), f0, f1);
/** a train of three stimulation pulses leaving the board (as drawn in S04/S06) */
const pulses = (p: {leave: number; arrive: number}, name: string): Cue[] =>
  [0, 1, 2].map((k) => ({kind: 'pulse', t: p.leave + k * 0.09 * (p.arrive - p.leave), gain: -33 - 2 * k, name: `${name} pulse ${k + 1}`}));

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
  // S02: the thumb releases the button; the cap springs back up under it (a soft plastic click, echoing the latch)
  ev.push({kind: 'button', t: S02_RELEASE + 0.07, gain: -24, name: 'S02 button springs back', args: {f: 1500}});
  // S04 / S06: the medic's walk, the two pulse trains, its feet through the turn
  const s4 = shot('S04'), s6 = shot('S06');
  for (const td of touchdownsP((ff) => s04Medic(ff / FPS).pose, s4.from, s6.to)) ev.push({kind: 'tick', t: td, gain: -38, name: 'S04/S06 foot'});
  ev.push(...pulses(PULSE1, 'S04'), ...pulses(PULSE2, 'S06'));
  // S07: the observer walking toward the lens (close: a little louder)
  const s7 = shot('S07');
  for (const td of touchdownsP((ff) => obsPose(ff / FPS), s7.from, s7.to)) ev.push({kind: 'tick', t: td, gain: -35, name: 'S07 observer foot'});
  // S08: the medic in the feed (heard faintly, as through the room)
  const s8 = shot('S08');
  for (const td of touchdownsP((ff) => s08Medic(ff / FPS), s8.from, s8.to)) ev.push({kind: 'tick', t: td, gain: -44, name: 'S08 feed foot'});
  // S09: the operator's press, the pulse, the coil, the line parts (MECHANISM, accent 2), spring, flight, impact
  const s9 = shot('S09'), s10 = shot('S10'), s11 = shot('S11'), s12 = shot('S12');
  for (const td of touchdownsP((ff) => s09Pose(ff / FPS), s9.from, s9.to)) ev.push({kind: 'tick', t: td, gain: -37, name: 'S09 foot (lining up)'});
  const tP0 = S09_T_CUT - 0.33, tP1 = S09_T_CUT - 0.15;
  ev.push({kind: 'button', t: tP0 - 0.06, gain: -27, name: 'S09 operator presses fire', args: {f: 1700}});
  ev.push({kind: 'pulse', t: tP0, gain: -29, name: 'S09 pulse to the coil'});
  ev.push({kind: 'sizzle', t: tP1 - 0.02, gain: -29, name: 'S09 coil heats', args: {d: 0.17}});
  ev.push({kind: 'click', t: S09_T_CUT, gain: -13, hero: true, name: 'S09 LINE PARTS (mechanism, accent 2)'});
  ev.push({kind: 'spring', t: S09_T_CUT + 0.005, gain: -21, hero: true, name: 'S09 spring drives the injector'});
  ev.push({kind: 'zing', t: S09_T_CUT + 0.07, gain: -30, name: 'S09 flight'});
  ev.push({kind: 'thock', t: S09_IMPACT_F / FPS, gain: -17, hero: true, name: 'S09 IMPACT into silicone'});
  // S10: the activator seal opens and gas pushes the plunger (time-compressed): a small click, then fizz
  const tSeal = word("they've", 0).start;
  ev.push({kind: 'click', t: tSeal, gain: -33, name: 'S10 seal opens', args: {f: 3200, d: 0.04, bright: 0.6}});
  ev.push({kind: 'fizz', t: tSeal + 0.04, gain: -31, name: 'S10 gas behind the plunger', args: {d: 1.45}});
  // S11 -> S12: the medic's feet, and the one air pass for the occlusion bridge (the foam panel, then the slab)
  for (const td of touchdownsP((ff) => s11Medic(ff), s11.from, s11.to)) ev.push({kind: 'tick', t: td, gain: -38, name: 'S11 foot'});
  ev.push({kind: 'air', t: 641 / FPS, gain: -27, name: 'S11/S12 occlusion bridge air pass', args: {d: (664 - 641) / FPS, lo: 250, hi: 2600, rise: true}});
  for (const td of touchdownsP((ff) => s12Medic(ff / FPS).pose, s12.from, s12.to)) ev.push({kind: 'tick', t: td, gain: -38, name: 'S12 foot'});
  ev.push({kind: 'grit', t: s12.from / FPS + 0.4, gain: -40, name: 'S12 grit trickle', args: {d: 1.6, rate: 22}});
  ev.push({kind: 'creak', t: s12.from / FPS + 1.3, gain: -38, name: 'S12 rubble creaks'});
  // S13-S15: the walk to her hand; it grows closer, the last steps are the final-approach accent
  const s13 = shot('S13'), s14 = shot('S14'), s15 = shot('S15');
  ev.push({kind: 'creak', t: s13.from / FPS + 0.35, gain: -36, name: 'S13 rubble settles'});
  for (const td of touchdownsP((ff) => alcovePose(ff / FPS), s13.from, s15.to)) {
    const f = td * FPS;
    const sec = f < s14.from ? 'S13' : f < s15.from ? 'S14' : 'S15';
    const g = sec === 'S13' ? -40 : sec === 'S14' ? -35 : -27;
    ev.push({kind: 'tick', t: td, gain: g, hero: sec === 'S15', name: `${sec} foot${sec === 'S15' ? ' (FINAL APPROACH, accent 3)' : ''}`, args: sec === 'S15' ? {body: 0.5} : {}});
  }
  ev.push({kind: 'grit', t: s15.from / FPS + 0.05, gain: -38, name: 'S15 grit under the feet', args: {d: 1.2, rate: 18}});
  return ev;
};

export const SECTIONS = {
  bridge: SHOT_FRAMES.find(([k]) => k === 'S12')![1] / FPS, // the occlusion bridge into the rubble
  rubble: SHOT_FRAMES.find(([k]) => k === 'S12')![1] / FPS,
  recog: word('you', 1).start, // "you might actually..." (the second "you")
};
export const cueFile = () => ({fps: FPS, frames: FRAMES, words: WORDS, sections: SECTIONS, events: buildCues()});
