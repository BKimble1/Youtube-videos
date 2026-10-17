// Section EF sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs).
//
// Beds already running (sound.ts): wind_ruins, fire_bed, machine_hum from FINAL_HIT−0.5. Global cues already placed
// (sound.ts): army_halt on FINAL_HIT, radio_on on RADIO_CLICK, static from RADIO_CLICK+0.05 — not repeated here.
// pan = screen x of the source (−1 left … 1 right); dist = 0 close … 1 far.
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';

/** Times shared with the picture (shots/EF/crew.tsx, camera.ts): kept as literals so this file stays pure. */
const FINAL_BREATH = 195.0; // crew.ts FINAL_BREATH
const CLASP = 189.45; // her hands close on his (crew.ts CLASP_T)
const GRIP = 199.5; // her fingers on the knob (crew.ts GRIP_T)

export const CUES_EF: Cue[] = [
  // ---- E1: she crawls the last half-metre (frame right), kneels at his left, takes his hand
  {t: 186.95, kind: 'cloth_move', gain: -8, pan: 0.3, dist: 0.15},
  {t: 187.32, kind: 'steps_gravel', gain: -13, pan: 0.32, dist: 0.15, dur: 0.35, fade: 0.1}, // a knee and a palm on grit
  {t: 187.85, kind: 'steps_gravel', gain: -14, pan: 0.28, dist: 0.15, dur: 0.35, fade: 0.1},
  {t: 187.25, kind: 'breath_ragged', gain: -10, pan: -0.25, dist: 0.1}, // his breath, shallow
  {t: 188.0, kind: 'servo_whir', gain: -15, pan: 0.6, dist: 0.65}, // a held unit's head tracks her (subdued)
  {t: 188.42, kind: 'cloth_move', gain: -9, pan: 0.22, dist: 0.12}, // she sits up onto her knees
  {t: 188.5, kind: 'steps_gravel', gain: -15, pan: 0.22, dist: 0.12, dur: 0.3, fade: 0.1},
  {t: CLASP - 0.05, kind: 'cloth_move', gain: -12, pan: 0.05, dist: 0.08, rate: 1.15}, // hands on his hand
  {t: 190.6, kind: 'rubble_shift', gain: -15, pan: -0.5, dist: 0.45}, // grit settling on the slab behind him
  {t: 191.1, kind: 'servo_whir', gain: -17, pan: -0.45, dist: 0.8},
  // ---- E1_clasp: her answering squeeze
  {t: 191.5, kind: 'cloth_move', gain: -15, pan: 0.1, dist: 0.05, rate: 1.2},
  // ---- E2: the last small breath; the eyes close; stillness (wind, distant fire, subdued machines)
  {t: FINAL_BREATH, kind: 'final_breath', gain: -1, pan: 0, dist: 0.04},
  {t: M.EYES_CLOSE + 0.6, kind: 'rubble_shift', gain: -17, pan: -0.2, dist: 0.35}, // his head settles against the slab
  {t: 197.6, kind: 'servo_whir', gain: -18, pan: 0.65, dist: 0.85},
  // her right hand slides from his (the left keeps holding it); she turns on her knees toward the van door and reaches
  // (the camera leaves his face with her)
  {t: 198.05, kind: 'cloth_move', gain: -12, pan: 0.4, dist: 0.15},
  {t: 198.5, kind: 'steps_gravel', gain: -15, pan: 0.45, dist: 0.2, dur: 0.3, fade: 0.1},
  {t: 198.85, kind: 'cloth_move', gain: -13, pan: 0.2, dist: 0.2},
  {t: 198.92, kind: 'steps_gravel', gain: -16, pan: 0.2, dist: 0.2, dur: 0.3, fade: 0.1},
  // ---- F1: her fingers close on the knob (a small dry click before the radio's own click on RADIO_CLICK)
  {t: GRIP, kind: 'lever_clunk', gain: -20, rate: 1.9, pan: 0.1, dist: 0.25},
  // she lets go and turns back to him on her knees, her right hand coming back onto his
  {t: 201.0, kind: 'cloth_move', gain: -12, pan: -0.35, dist: 0.25},
  {t: 201.3, kind: 'steps_gravel', gain: -15, pan: -0.35, dist: 0.3, dur: 0.25, fade: 0.08},
  {t: 201.95, kind: 'steps_gravel', gain: -15, pan: -0.3, dist: 0.3, dur: 0.25, fade: 0.08},
  {t: 202.1, kind: 'cloth_move', gain: -14, pan: -0.3, dist: 0.35},
  // the crane rises past the ring: a unit's sensor follows the lens; drones holding in the smoke
  {t: 203.8, kind: 'servo_whir', gain: -17, pan: 0.5, dist: 0.5},
  {t: 206.2, kind: 'drone_rotor', gain: -18, pan: 0.3, dist: 0.6, dur: 6, fade: 2},
  // the columns in the avenue move on (tableau STREAM_RESUME): far, under the music
  {t: 207.0, kind: 'army_march', gain: -17, pan: 0.2, dist: 0.9, dur: 22, fade: 4},
];
