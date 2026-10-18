// R2 sound sheet: global beds, perspective events, the radio→score automation and every cue (section modules add
// theirs via SECTION_CUES). Bundled by tools/r2/collect_timing_r2.mjs into audio/r2/timing.json for tools/r2/mix_r2.py.
// Times are film seconds. Kinds are files in audio/r2/sfx/ (R2 generations) or audio/sfx/ (R1 library).
import {Cue} from '../film/cue';
import {M} from './timing';
import {SECTION_CUES} from './shots/cues';
export * from './timing';

/** Ambience beds (looped with crossfaded seams). dist darkens a bed (0 = close). */
export const BEDS: {kind: string; a: number; b: number; gain?: number; fade?: number; dist?: number}[] = [
  {kind: 'wind_ruins', a: 0, b: M.END - 1, gain: -1, fade: 1.0},
  {kind: 'battle_far', a: 0, b: M.FINAL_HIT + 2, gain: 0, fade: 2.0},
  {kind: 'fire_bed', a: 0, b: M.END - 2, gain: -2, fade: 1.5},
  {kind: 'army_march', a: M.ORCH, b: M.BASS_OUT + 1.2, gain: -6, fade: 1.2, dist: 0.6},
  {kind: 'army_march', a: M.CHARGE, b: M.P4, gain: -4, fade: 2.0, dist: 0.35},
  {kind: 'drone_swarm', a: M.ADAPT, b: M.FINAL_HIT, gain: -4, fade: 2.0, dist: 0.3},
  {kind: 'machine_hum', a: M.FINAL_HIT - 0.5, b: M.CARD_IN + 2, gain: 0, fade: 2.0, dist: 0.4},
];

/** Perspective events: 'duck' dips the Portals track (dB) under a story effect; 'muffle' low-passes everything. */
export const PERSPECTIVE: {kind: 'duck' | 'muffle' | 'quiet'; a: number; b: number; amt?: number; rise?: number; fall?: number}[] = [
  {kind: 'duck', a: M.STRIKE - 0.05, b: M.STRIKE + 1.2, amt: 4, rise: 0.05, fall: 1.0},
];

/** The radio is in the scene until the camera has risen away from it; then the recording is the score (one continuous
 *  musical timeline: the radio copy and the full copy are the same placed recording, sample-aligned). */
export const RADIO_MIX = {a: 203.0, b: 217.0, radioDb: -5, awayDb: -10};

/** Cues that belong to the whole film rather than one shot. */
const GLOBAL_CUES: Cue[] = [
  {t: M.LOW_HIT, kind: 'tower_collapse', gain: 0, dist: 0.85, pan: 0.35},
  {t: M.H1, kind: 'eyes_on', gain: 0, dist: 0.6},
  {t: M.H4, kind: 'army_halt', gain: -2, dist: 0.55},
  {t: M.FINAL_HIT, kind: 'army_halt', gain: 0, dist: 0.3},
  // nobody touches the radio: its reception recovers by itself — two short crackles as the indicator flutters, the song
  // catches through the second (no click, no tuning sweep)
  {t: M.RADIO_FLUTTER, kind: 'static', gain: -7, pan: 0.15, dur: 0.3, fade: 0.06},
  {t: M.RADIO_FLUTTER + 0.38, kind: 'static', gain: -5, pan: 0.15, dur: 0.5, fade: 0.2},
];

export const CUES: Cue[] = [...GLOBAL_CUES, ...SECTION_CUES].sort((a, b) => a.t - b.t);
