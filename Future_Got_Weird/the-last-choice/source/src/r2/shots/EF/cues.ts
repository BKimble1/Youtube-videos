// Section EF sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs).
//
// Beds already running (sound.ts): wind_ruins, fire_bed, machine_hum from FINAL_HIT−0.5. Global cues already placed
// (sound.ts): army_halt on FINAL_HIT; the radio's two static crackles on RADIO_FLUTTER (+0, +0.38) and the song from
// L_START — not repeated here. Nobody touches the radio: no knob, no click, no hand on it.
// pan = screen x of the source (−1 left … 1 right); dist = 0 close … 1 far.
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';

/** Times shared with the picture (shots/EF/crew.tsx, tableau.ts SURRENDER): literals so this file stays pure. */
const FINAL_BREATH = 195.0; // crew.tsx FINAL_BREATH
const CLASP = 189.45; // her hands close on his (crew.tsx CLASP_T)

export const CUES_EF: Cue[] = [
  // ---- E1: she crawls the last half-metre (frame right), kneels at his left, takes his hand
  {t: 186.95, kind: 'cloth_move', gain: -8, pan: 0.3, dist: 0.15},
  {t: 187.32, kind: 'steps_gravel', gain: -13, pan: 0.32, dist: 0.15, dur: 0.35, fade: 0.1}, // a knee and a palm on grit
  {t: 187.85, kind: 'steps_gravel', gain: -14, pan: 0.28, dist: 0.15, dur: 0.35, fade: 0.1},
  {t: 187.25, kind: 'breath_ragged', gain: -11, pan: -0.25, dist: 0.1}, // his breath, shallow
  {t: 187.05, kind: 'servo_whir', gain: -17, pan: 0.6, dist: 0.65}, // ring units' heads turn to her as she moves (subdued)
  {t: 187.6, kind: 'servo_whir', gain: -19, pan: -0.5, dist: 0.75},
  {t: 188.42, kind: 'cloth_move', gain: -9, pan: 0.22, dist: 0.12}, // she sits up onto her knees
  {t: 188.5, kind: 'steps_gravel', gain: -15, pan: 0.22, dist: 0.12, dur: 0.3, fade: 0.1},
  {t: 189.0, kind: 'breath_ragged', gain: -14, pan: 0.15, dist: 0.1, rate: 1.08}, // her breath, catching
  {t: CLASP - 0.05, kind: 'cloth_move', gain: -12, pan: 0.05, dist: 0.08, rate: 1.15}, // hands on his hand
  {t: 190.6, kind: 'rubble_shift', gain: -16, pan: -0.5, dist: 0.45}, // grit settling on the slab behind him
  {t: 191.1, kind: 'servo_whir', gain: -18, pan: -0.45, dist: 0.8},
  // ---- E1_clasp: her answering squeeze
  {t: 191.5, kind: 'cloth_move', gain: -15, pan: 0.1, dist: 0.05, rate: 1.2},
  {t: 192.45, kind: 'cloth_move', gain: -17, pan: 0.1, dist: 0.05, rate: 1.3},
  // ---- E2: the last small breath; the eyes close; stillness (wind, distant fire, subdued machines)
  {t: 193.4, kind: 'breath_ragged', gain: -15, pan: 0, dist: 0.05, rate: 0.92},
  {t: FINAL_BREATH, kind: 'final_breath', gain: -1, pan: 0, dist: 0.04},
  {t: M.EYES_CLOSE + 0.8, kind: 'rubble_shift', gain: -19, pan: -0.2, dist: 0.35}, // his head settles against the slab
  // she sees it: a caught breath, then she bows over his hand (off-screen right of his face)
  {t: 196.95, kind: 'breath_ragged', gain: -15, pan: 0.45, dist: 0.12, rate: 1.12},
  {t: 197.75, kind: 'cloth_move', gain: -14, pan: 0.4, dist: 0.12},
  {t: 198.25, kind: 'breath_ragged', gain: -16, pan: 0.35, dist: 0.15, rate: 1.22}, // a held sob
  // ---- F1: the camera finds the unattended radio (the static and the song are global); her grief stays close
  {t: 199.9, kind: 'breath_ragged', gain: -20, pan: -0.55, dist: 0.25, rate: 1.25},
  {t: 201.8, kind: 'breath_ragged', gain: -19, pan: -0.3, dist: 0.3, rate: 1.1},
  // the crane rises past the ring: a blocking unit steps down onto the ridge path; the tether operator sinks to her
  // knees, her holder's arm following; heads turn to her; the runner tries to rise and the unit over him steps in
  {t: 204.0, kind: 'robot_step', gain: -19, pan: -0.2, dist: 0.6, dur: 1.5, fade: 0.4},
  {t: 205.3, kind: 'servo_whir', gain: -19, pan: 0.1, dist: 0.6},
  {t: 206.2, kind: 'drone_rotor', gain: -19, pan: 0.3, dist: 0.6, dur: 6, fade: 2},
  // the columns in the avenue move on (tableau STREAM_RESUME): far, under the music
  {t: 207.0, kind: 'army_march', gain: -18, pan: 0.2, dist: 0.9, dur: 22, fade: 4},
  {t: 208.65, kind: 'cloth_move', gain: -18, pan: 0.45, dist: 0.6},
  {t: 208.9, kind: 'servo_heavy', gain: -21, pan: 0.45, dist: 0.65},
  {t: 212.7, kind: 'robot_step', gain: -21, pan: 0.5, dist: 0.75, dur: 1.1, fade: 0.3},
  {t: 214.95, kind: 'servo_whir', gain: -20, pan: 0.55, dist: 0.75},
  {t: 215.1, kind: 'robot_step', gain: -21, pan: 0.55, dist: 0.75, dur: 0.8, fade: 0.3},
];
