// Section D1 sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs). The mixer applies each kind's lead.
// R3: cues follow the exchanges (chor.ts EV, mirrored here as literals so this file stays free of the kits) and are
// graded by contact: LIGHT PARRY = plate_block at -7..-11 dB, rate 1.35-1.4 (+ a tick of sparks); HEAVY BLOCK =
// plate_block +3 with armor_hit and the heel skid (steps_gravel, rate 1.25); HARD IMPACT = shield_bash / ram_strike /
// breaker_hit; MECHANICAL FAILURE = breaker_hit + metal_tear + elec_arc + a power-down servo (rate 0.55-0.75).
// Fewer fillers than R2: no cloth or rubble beds under the fight, one cue per contact plus its body response.
// pan = the source's screen x in the D1 shot playing at that moment (-1 left .. 1 right) and dist = camera distance / 12 m,
// both computed from the shots' own cameras (shot.tsx D1_CAMS) at the contact's world point.
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';

export const CUES_D1: Cue[] = [
  // ---- D1-1 the charge down the ridge (59.95-64.00): rubble under seven people, breath, the ally drone overhead
  {t: M.CHARGE + 0.05, kind: 'breath_exert', gain: -2, pan: -0.2, dist: 0.35},
  {t: M.CHARGE + 0.1, kind: 'run_rubble', dur: 4.2, fade: 0.4, gain: 0, pan: 0, dist: 0.25},
  {t: 60.9, kind: 'rubble_shift', gain: -8, pan: -0.3, dist: 0.4, dur: 1.4, fade: 0.4},
  {t: 61.6, kind: 'drone_pass', gain: -6, pan: 0.2, dist: 0.5},
  {t: 62.05, kind: 'steps_gravel', gain: -2, pan: 0.35, dist: 0.15},
  {t: 63.1, kind: 'steps_gravel', gain: -3, pan: 0.65, dist: 0.15},
  {t: 63.45, kind: 'breath_exert', gain: -5, pan: 0.75, dist: 0.15},
  // ---- D1-2 / D1-2b across the avenue; U1 picks him (64.00-68.30): his feet and breath close; the machines' run from screen right
  {t: 64.0, kind: 'steps_gravel', gain: -1, pan: -0.1, dist: 0.1, dur: 4.3, fade: 0.2},
{t: 64.6, kind: 'robot_step_heavy', gain: -6, pan: 1, dist: 1},
  {t: 65.3, kind: 'robot_step_heavy', gain: -5, pan: 1, dist: 1},
  {t: 65.9, kind: 'servo_heavy', gain: -6, pan: 0.97, dist: 1},
  {t: 66.1, kind: 'breath_exert', gain: -3, pan: -0.72, dist: 0.23},
  {t: 66.7, kind: 'robot_step_heavy', gain: -3, pan: -0.06, dist: 1},
  {t: 67.25, kind: 'sensor_lock', gain: -5, pan: -0.11, dist: 0.97},
  {t: 67.35, kind: 'robot_step_heavy', gain: -2, pan: -0.14, dist: 0.88},
  {t: 67.95, kind: 'servo_whir', gain: -3, pan: -0.22, dist: 0.48},
  {t: 68.18, kind: 'robot_swing', gain: -1, pan: -0.32, dist: 0.38},
  {t: 68.33, kind: 'plate_block', gain: 3, pan: 0.01, dist: 0.31}, // HEAVY BLOCK: U1 hammer on the plate
  {t: 68.34, kind: 'armor_hit', gain: -2, pan: 0, dist: 0.31},
  {t: 68.35, kind: 'breath_exert', gain: -3, pan: -0.18, dist: 0.3},
  {t: 68.36, kind: 'steps_gravel', gain: -1, pan: -0.18, dist: 0.3, rate: 1.25}, // heel skid
  {t: 69.2, kind: 'plate_block', gain: -9, pan: -0.12, dist: 0.32, rate: 1.4}, // light parry
  {t: 69.21, kind: 'sparks', gain: -11, pan: -0.13, dist: 0.32},
  {t: 69.92, kind: 'breath_exert', gain: -5, pan: -0.27, dist: 0.33},
  {t: 69.95, kind: 'shield_bash', gain: -1, pan: -0.15, dist: 0.34}, // hard impact: his bash
  {t: 69.96, kind: 'armor_hit', gain: -4, pan: -0.15, dist: 0.34},
  {t: 70.05, kind: 'robot_swing', gain: -9, pan: -1, dist: 0.95},
  {t: 70.4, kind: 'robot_step_heavy', gain: -5, pan: 0.18, dist: 0.84}, // U3 catches U1
  {t: 70.52, kind: 'robot_swing', gain: -5, pan: 0.34, dist: 0.41},
  {t: 70.6, kind: 'plate_block', gain: -2, pan: 0.12, dist: 0.37, rate: 0.8}, // heavy block on the shaft
  {t: 70.64, kind: 'breath_exert', gain: -6, pan: 0.11, dist: 0.34},
  {t: 71.02, kind: 'robot_swing', gain: -10, pan: 1, dist: 0.13},
  {t: 71.25, kind: 'armor_hit', gain: -6, pan: -0.43, dist: 0.81, rate: 1.3}, // halligan parry
  {t: 71.89, kind: 'robot_swing', gain: -5, pan: 0.52, dist: 0.33},
  {t: 72.05, kind: 'armor_hit', gain: -6, pan: -0.22, dist: 0.78, rate: 1.1},
  {t: 72.15, kind: 'breaker_charge', gain: -5, pan: -0.39, dist: 0.27},
  {t: 72.4, kind: 'plate_block', gain: -11, pan: -0.07, dist: 0.6, rate: 1.4},
  {t: 72.45, kind: 'breaker_hit', gain: 1, pan: 0.08, dist: 0.22}, // knee joint: mechanical failure
  {t: 72.47, kind: 'sparks', gain: -5, pan: 0.09, dist: 0.22},
  {t: 72.53, kind: 'elec_arc', gain: -9, pan: 0.08, dist: 0.22},
  {t: 72.6, kind: 'servo_heavy', gain: -6, pan: 0.27, dist: 0.24, rate: 0.75},
  {t: 72.71, kind: 'robot_step_heavy', gain: -3, pan: 0.22, dist: 0.21}, // knee to the ground
  {t: 73.15, kind: 'armor_hit', gain: -6, pan: -0.06, dist: 0.24, rate: 0.75}, // catch
  {t: 73.44, kind: 'robot_swing', gain: -8, pan: 0.45, dist: 0.61},
  {t: 73.45, kind: 'servo_heavy', gain: -5, pan: 1, dist: 0.9}, // wrench
  {t: 73.85, kind: 'armor_hit', gain: -5, pan: 0.98, dist: 0.72}, // his bash blocked by its forearm
  {t: 74.1, kind: 'tether_fire', gain: 0, pan: -0.4, dist: 0.33},
  {t: 74.4, kind: 'tether_clamp', gain: -2, pan: 0.14, dist: 0.42},
  {t: 74.52, kind: 'tether_reel', gain: -2, pan: -0.4, dist: 0.32},
  {t: 74.57, kind: 'cable_strain', gain: -6, pan: 0.15, dist: 0.42},
  {t: 74.95, kind: 'armor_hit', gain: -9, pan: -0.88, dist: 0.75},
  {t: 75, kind: 'drone_pass', gain: -3, pan: -0.3, dist: 0.28}, // the dive
  {t: 75.14, kind: 'robot_swing', gain: -8, pan: -0.53, dist: 0.54},
  {t: 75.3, kind: 'armor_hit', gain: -9, pan: 0.22, dist: 0.27, rate: 1.5},
  {t: 75.45, kind: 'servo_whir', gain: -6, pan: 0.26, dist: 0.25}, // swat
  {t: 75.46, kind: 'robot_fall', gain: -1, pan: 0.07, dist: 1}, // U5
  {t: 75.68, kind: 'breaker_charge', gain: -4, pan: -0.52, dist: 0.21},
  {t: 75.75, kind: 'shield_bash', gain: -6, pan: -0.62, dist: 0.59},
  {t: 75.9, kind: 'armor_hit', gain: -7, pan: -1, dist: 0.72, rate: 1.3},
  {t: 76, kind: 'breaker_hit', gain: 1, pan: 0.15, dist: 0.25}, // the kill: neck
  {t: 76.03, kind: 'elec_arc', gain: -6, pan: 0.15, dist: 0.25},
  {t: 76.1, kind: 'servo_heavy', gain: -7, pan: 0.13, dist: 0.24, rate: 0.55}, // power down
  {t: 76.62, kind: 'flare_ignite', gain: -1, pan: -0.09, dist: 0.28},
  {t: 77.3, kind: 'elec_arc', gain: -6, pan: 0.17, dist: 0.35},
  {t: 77.31, kind: 'sparks', gain: -7, pan: 0.15, dist: 0.35},
  {t: 77.4, kind: 'servo_whir', gain: -6, pan: 0.19, dist: 0.37},
  {t: 77.65, kind: 'robot_fall', gain: -2, pan: -1, dist: 0.16}, // U4
  {t: 77.65, kind: 'plate_block', gain: -7, pan: 0.1, dist: 0.31, rate: 1.35}, // light block
  {t: 77.84, kind: 'robot_swing', gain: -9, pan: 0.03, dist: 0.54},
  {t: 78.1, kind: 'servo_heavy', gain: -4, pan: 0.2, dist: 0.29}, // the wind-up
  {t: 78.38, kind: 'robot_swing', gain: -1, pan: 0.23, dist: 0.27},
  {t: 78.48, kind: 'plate_block', gain: 3, pan: 0.1, dist: 0.31}, // BR1 HEAVY BLOCK, the dent
  {t: 78.49, kind: 'armor_hit', gain: 0, pan: 0.1, dist: 0.31},
  {t: 78.5, kind: 'breath_exert', gain: -2, pan: -0.09, dist: 0.31},
  {t: 78.51, kind: 'steps_gravel', gain: 0, pan: -0.09, dist: 0.35, rate: 1.25}, // skid
  {t: 78.62, kind: 'robot_step_heavy', gain: -3, pan: 0.3, dist: 0.33}, // it follows
  {t: 78.95, kind: 'robot_step_heavy', gain: -4, pan: 0.19, dist: 0.36},
  {t: 79.3, kind: 'servo_heavy', gain: -4, pan: 0.08, dist: 0.34}, // the press
  {t: 79.35, kind: 'steps_gravel', gain: -5, pan: -0.2, dist: 0.35, rate: 1.1},
  {t: 79.55, kind: 'armor_hit', gain: -5, pan: 0.05, dist: 0.51}, // U2 hook lands
  {t: 79.85, kind: 'shield_bash', gain: -8, pan: 0.02, dist: 0.35, rate: 0.85}, // the shove
  {t: 79.9, kind: 'breath_exert', gain: -4, pan: -0.09, dist: 0.33},
  {t: 79.95, kind: 'body_fall', gain: -7, pan: -0.36, dist: 0.53},
  {t: 80.1, kind: 'steps_gravel', gain: -6, pan: -0.14, dist: 0.34},
  {t: 80.35, kind: 'steps_gravel', gain: -6, pan: -0.2, dist: 0.33},
  {t: 80.55, kind: 'breaker_charge', gain: -2, pan: 0.94, dist: 0.22}, // he primes as he runs
  {t: 80.72, kind: 'servo_heavy', gain: -3, pan: 0.21, dist: 0.36},
  {t: 81.05, kind: 'breath_exert', gain: -5, pan: -0.22, dist: 0.31},
  {t: 81.34, kind: 'breaker_hit', gain: 2, pan: 0.21, dist: 0.32}, // BR2 the forearm: mechanical failure
  {t: 81.36, kind: 'metal_tear', gain: -1, pan: 0.27, dist: 0.34},
  {t: 81.38, kind: 'elec_arc', gain: -4, pan: 0.26, dist: 0.35},
  {t: 81.39, kind: 'sparks', gain: -5, pan: 0.26, dist: 0.35},
  {t: 81.45, kind: 'armor_hit', gain: -10, pan: -0.35, dist: 0.53, rate: 1.3},
  {t: 81.95, kind: 'armor_hit', gain: -4, pan: 0.21, dist: 0.32, rate: 0.75}, // catch the tool
  {t: 82, kind: 'servo_heavy', gain: -3, pan: 0.05, dist: 0.34}, // wrench
  {t: 82.15, kind: 'armor_hit', gain: -7, pan: -0.05, dist: 0.64, rate: 0.7}, // U1 arm
  {t: 82.33, kind: 'shield_bash', gain: -2, pan: 0.13, dist: 0.33}, // knee bash
  {t: 82.39, kind: 'servo_heavy', gain: -6, pan: 0.15, dist: 0.33, rate: 0.7}, // knee gives
  {t: 82.62, kind: 'servo_whir', gain: -9, pan: -0.17, dist: 0.46},
  {t: 82.8, kind: 'ram_strike', gain: 2, pan: 0.24, dist: 0.35}, // BR3 hard impact
  {t: 82.81, kind: 'breaker_hit', gain: 0, pan: 0.24, dist: 0.35},
  {t: 82.83, kind: 'metal_tear', gain: -5, pan: 0.24, dist: 0.35},
  {t: 83, kind: 'robot_step_heavy', gain: -4, pan: 0.01, dist: 0.41},
  {t: 83.22, kind: 'wreck_slam', gain: 1, pan: -0.12, dist: 0.45}, // the crash into U2
  {t: 83.23, kind: 'armor_hit', gain: -3, pan: -0.11, dist: 0.45},
  {t: 83.3, kind: 'body_fall', gain: -6, pan: -0.44, dist: 0.47}, // runner throws himself clear
  {t: 83.558, kind: 'armor_hit', gain: -8, pan: -0.31, dist: 0.61, rate: 0.8}, // U1 chest
  {t: 83.6, kind: 'sensor_lock', gain: -7, pan: 0.68, dist: 0.69}, // U3 comes out
  {t: 83.8, kind: 'steps_gravel', gain: -3, pan: -0.12, dist: 0.36, dur: 1.5, fade: 0.2},
  {t: 84.06, kind: 'robot_fall', gain: -2, pan: -0.44, dist: 0.64}, // U1
  {t: 84.08, kind: 'robot_fall', gain: 0, pan: -0.52, dist: 0.68}, // U2
  {t: 84.2, kind: 'robot_step_heavy', gain: -4, pan: 0.26, dist: 0.75},
  {t: 84.55, kind: 'halligan_pry', gain: -2, pan: -0.67, dist: 0.68}, // the pin
  {t: 84.67, kind: 'armor_hit', gain: -7, pan: -0.69, dist: 0.68},
  {t: 84.75, kind: 'robot_step_heavy', gain: -4, pan: 0.14, dist: 0.72},
  // ---- D1-8 BR4: the shoulder drive; it goes over the crest and slides down into the crater (85.64-89.78)
  {t: 85.62, kind: 'breath_exert', gain: -3, pan: 0.1, dist: 0.15},
  {t: 85.86, kind: 'steps_gravel', gain: -2, pan: 0.1, dist: 0.15},
  {t: 86.12, kind: 'steps_gravel', gain: 0, pan: 0.1, dist: 0.15, rate: 1.1},
  {t: 86.36, kind: 'shield_bash', gain: 3, pan: 0.05, dist: 0.25}, // HARD IMPACT: shoulder and plate into U3
  {t: 86.37, kind: 'armor_hit', gain: 0, pan: 0.05, dist: 0.25},
  {t: 86.38, kind: 'breath_exert', gain: 0, pan: 0.05, dist: 0.15},
  // his three driving steps; its feet skid back up the slope
  {t: 86.46, kind: 'steps_gravel', gain: -1, pan: 0.05, dist: 0.2, rate: 1.15},
  {t: 86.5, kind: 'rubble_shift', gain: -6, pan: 0.1, dist: 0.3, dur: 0.5, fade: 0.15},
  {t: 86.7, kind: 'steps_gravel', gain: -2, pan: 0.05, dist: 0.2, rate: 1.1},
  {t: 86.86, kind: 'steps_gravel', gain: -2, pan: 0.05, dist: 0.2, rate: 1.2},
  {t: 86.95, kind: 'breath_exert', gain: -2, pan: 0.05, dist: 0.2},
  {t: 87.12, kind: 'robot_step_heavy', gain: -3, pan: 0.15, dist: 0.3},
  {t: 87.18, kind: 'robot_step_heavy', gain: -4, pan: 0.15, dist: 0.3},
  {t: 87.28, kind: 'servo_heavy', gain: -6, pan: 0.15, dist: 0.35},
  {t: 87.78, kind: 'robot_fall', gain: 1, pan: 0.0, dist: 0.4},
  {t: 87.73, kind: 'rubble_shift', gain: -3, pan: 0.0, dist: 0.4, dur: 1.2, fade: 0.4},
  {t: 87.88, kind: 'debris_rain', gain: -8, pan: 0.0, dist: 0.45},
  {t: 88.3, kind: 'breath_ragged', gain: -2, pan: 0.3, dist: 0.2},
  // ---- D1-9a / D1-9b GAIN under pressure: the recall, the drone, the run, the beam over the slab (87.0-94.30)
  {t: 87.1, kind: 'sensor_lock', gain: -12, pan: -1, dist: 0.62}, // recall
  {t: 90.3, kind: 'drone_pass', gain: -8, pan: -0.39, dist: 1}, // ED1 comes
  {t: 90.7, kind: 'steps_gravel', gain: -4, pan: 0.41, dist: 0.4, dur: 1, fade: 0.2},
  {t: 91.25, kind: 'sensor_lock', gain: -4, pan: -0.51, dist: 0.98}, // the beam
  {t: 91.35, kind: 'breath_ragged', gain: 0, pan: 0.15, dist: 0.44},
  {t: 92.1, kind: 'drone_pass', gain: -8, pan: -0.25, dist: 0.85},
  {t: 92.6, kind: 'breath_ragged', gain: -7, pan: 0.14, dist: 0.37},
  {t: 93.4, kind: 'drone_pass', gain: -6, pan: 0.25, dist: 0.88},
  {t: 93.6, kind: 'breath_ragged', gain: -3, pan: -0.15, dist: 0.35},
];
