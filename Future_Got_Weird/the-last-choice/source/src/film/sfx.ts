// Sound cue sheet: every shot group's cues + global beds and perspective changes. Bundled by tools/collect_timing.mjs
// into audio/timing.json for tools/mix.py. Times are film seconds.
import {Cue} from './cue';
import {SHOT_CUES} from '../shots';
import {M} from './timing';
import {BEAT} from '../shots/C2/world';
export * from './timing';

/** Ambience beds: [kind, from, to, gain dB, fade s]. Crossfaded at shot/location changes. */
export const BEDS: {kind: string; a: number; b: number; gain?: number; fade?: number}[] = [
  {kind: 'fire_bed', a: 0, b: 32.3, gain: -2, fade: 0.5},          // street; drops out in the subway (B4)
  {kind: 'fire_bed', a: 35.8, b: 47.0, gain: -4, fade: 0.8},        // exit stairs → terrace
  {kind: 'city_bed', a: 0, b: 131.0, gain: -4, fade: 2.0},
  {kind: 'fire_bed', a: 46.0, b: 64.6, gain: -10, fade: 1.5},
  {kind: 'steam_vent', a: 64.6, b: 88.0, gain: -8, fade: 1.0},
  {kind: 'refuge_bed', a: M.FINAL_HIT, b: M.END - 2, gain: -6, fade: 2.0},
];
/** Perspective events: muffle (all stems low-passed, ducked) after the blast; music ducks for key effects. */
// The decisive blast (C13): film ≈105.25 (a Portals onset, rec 167.10), defined once in shots/C2/world.ts.
export const BLAST = BEAT.blast;
export const PERSPECTIVE: {kind: 'muffle' | 'duck'; a: number; b: number; amt?: number}[] = [
  // after the blast the world goes dull and distant; it clears as the Director catches the friend's wrist (C14)
  {kind: 'muffle', a: BLAST + 0.04, b: 109.6, amt: 0.9},
];
/** Mix-level cues that belong to the perspective rather than to a shot: the ear ring rides over the muffle. */
const MIX_CUES: Cue[] = [
  {t: BLAST + 0.06, kind: 'tinnitus', gain: 0},
];
export const CUES: Cue[] = [...SHOT_CUES, ...MIX_CUES].sort((p, q) => p.t - q.t);
