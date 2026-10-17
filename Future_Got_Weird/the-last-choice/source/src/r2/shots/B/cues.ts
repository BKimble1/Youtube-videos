// Section B sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs). The global cues (eyes_on at H1, army_halt
// at H4, the army_march bed from ORCH) live in src/r2/sound.ts and are not repeated here.
// pan = screen x of the source (−1 left … 1 right), dist = camera distance (0 close … 1 far).
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';
import {TB, beat, STOP} from './beats';

const c = (t: number, kind: string, o: Omit<Cue, 't' | 'kind'> = {}): Cue => ({t, kind, ...o});

// B1 — the close on the hand (the source sits just left of centre, very near)
const B1: Cue[] = [
  c(M.SOLO + 0.05, 'breath_ragged', {gain: -1, pan: -0.15, dist: 0.05, dur: 3.0, fade: 0.5}), // his breath under the slab
  c(TB.slideOut, 'rubble_shift', {gain: -12, pan: -0.25, dist: 0.05, dur: 0.6, rate: 1.4, fade: 0.15}), // the arm drags out over grit
  c(TB.slap, 'body_fall', {gain: -10, pan: -0.1, dist: 0.0, rate: 1.7}), // the palm slaps down on concrete
  c(TB.slap + 0.01, 'debris_rain', {gain: -12, pan: -0.1, dist: 0.05, dur: 0.7, rate: 1.5, fade: 0.2}), // chips skitter
  c(TB.slap + 0.02, 'breath_exert', {gain: -7, pan: -0.15, dist: 0.05, dur: 0.9, fade: 0.25}),
  c(TB.press, 'rubble_shift', {gain: -14, pan: -0.1, dist: 0.05, dur: 0.7, rate: 1.2, fade: 0.2}), // the press grinds
  c(TB.strain, 'debris_rain', {gain: -16, pan: 0.2, dist: 0.1, dur: 0.9, rate: 1.2, fade: 0.3}), // grit trickles off the slab
];

// B2 — the rise (low, south-east of him; he is centre-left → centre)
const B2: Cue[] = [
  c(TB.pull, 'breath_exert', {gain: -3, pan: -0.15, dist: 0.15, dur: 1.4, fade: 0.3}),
  c(TB.pull + 0.03, 'rubble_shift', {gain: -6, pan: -0.15, dist: 0.15, dur: 1.2, fade: 0.3}), // he drags himself over the rubble
  c(12.71, 'body_fall', {gain: -15, pan: 0.0, dist: 0.2, rate: 2.0}), // the lump his head shoved off lands
  c(12.9, 'body_fall', {gain: -17, pan: -0.35, dist: 0.25, rate: 2.2}), // the chunk off his calf
  c(TB.push, 'breath_exert', {gain: -2, pan: -0.1, dist: 0.15, dur: 1.2, fade: 0.3}),
  c(TB.push + 0.1, 'rubble_shift', {gain: -9, pan: -0.25, dist: 0.2, dur: 0.9, rate: 0.85, fade: 0.25}), // the slab grinds on his back
  c(13.33, 'body_fall', {gain: -14, pan: 0.1, dist: 0.15, rate: 1.8}), // the chunk off his back
  c(TB.slabLand, 'body_fall', {gain: -6, pan: -0.3, dist: 0.2, rate: 0.75}), // the slab drops back onto the mounds
  c(TB.slabLand + 0.02, 'debris_rain', {gain: -9, pan: -0.3, dist: 0.2, dur: 1.2, fade: 0.4}),
  c(TB.knee, 'steps_gravel', {gain: -9, pan: -0.05, dist: 0.15, dur: 0.4, fade: 0.1}), // a knee into the rubble
  c(14.22, 'body_fall', {gain: -14, pan: 0.15, dist: 0.2, rate: 1.6}), // the kicked chunk rolls down the slope
  c(TB.knee + 0.25, 'breath_ragged', {gain: -3, pan: -0.05, dist: 0.15, dur: 1.2, fade: 0.3}),
  c(TB.kneel, 'steps_gravel', {gain: -9, pan: 0.05, dist: 0.15, dur: 0.35, fade: 0.1}), // the left foot plants
  c(TB.rebar, 'cable_strain', {gain: -8, pan: 0.1, dist: 0.1, dur: 0.8, rate: 1.4, fade: 0.2}), // the rebar creaks in his grip
  c(TB.weight, 'breath_exert', {gain: -1, pan: 0.0, dist: 0.15, dur: 1.6, fade: 0.3}),
  c(TB.rise, 'cable_strain', {gain: -6, pan: 0.1, dist: 0.1, dur: 0.9, rate: 1.3, fade: 0.25}),
  c(TB.step, 'steps_gravel', {gain: -6, pan: 0.05, dist: 0.15, dur: 0.5, fade: 0.15}), // the staggered half step
  c(TB.release, 'cable_strain', {gain: -13, pan: 0.15, dist: 0.1, dur: 0.3, rate: 1.9, fade: 0.1}), // the bar springs back
  c(TB.stood, 'breath_ragged', {gain: -2, pan: 0.0, dist: 0.15, dur: 3.0, fade: 0.6}),
];

// B3 — the reveal: his two steps down, then the army's lockstep (H1/H2 synchronized, layered near → far)
// p0 shifts the cluster's pan to where the army sits in the shot's frame
const pn = (p: number) => Math.max(-1, Math.min(1, p));
const armyStep = (t: number, g = 0, p0 = 0): Cue[] => [
  c(t, 'robot_step_heavy', {gain: g, pan: pn(p0 + 0.15), dist: 0.6}),
  c(t + 0.012, 'robot_step_heavy', {gain: g - 2, pan: pn(p0 + 0.45), dist: 0.75}),
  c(t + 0.025, 'robot_step_heavy', {gain: g - 3, pan: pn(p0 - 0.15), dist: 0.85}),
  c(t + 0.006, 'robot_step', {gain: g - 2, pan: pn(p0 + 0.3), dist: 0.6}),
  c(t + 0.018, 'robot_step', {gain: g - 4, pan: pn(p0), dist: 0.8}),
];
const B3: Cue[] = [
  // (he is lower left, the army across the right two-thirds)
  c(TB.step1 + 0.4, 'steps_gravel', {gain: -9, pan: -0.5, dist: 0.2, dur: 0.45, fade: 0.1}),
  c(TB.step2 + 0.45, 'steps_gravel', {gain: -9, pan: -0.5, dist: 0.2, dur: 0.45, fade: 0.1}),
  ...armyStep(M.H1, 0, 0.3),
  ...armyStep(M.H2, 1, 0.3),
  c(M.H1 + 0.08, 'breath_exert', {gain: -14, pan: -0.5, dist: 0.2, dur: 0.5, fade: 0.15}), // his breath catches
  // the lockstep carries on under the march bed, fading as the camera settles
  ...[3, 4, 5, 6, 7, 8].flatMap((k) => [c(beat(k), 'robot_step_heavy', {gain: -6 - k, pan: 0.5, dist: 0.75}), c(beat(k) + 0.01, 'robot_step', {gain: -8 - k, pan: 0.3, dist: 0.8})]),
];

// B4 — inside the army: the near heavy turns its head on H3; feet all around the lens
const B4: Cue[] = [
  c(M.H3 + 0.03, 'heavy_servo', {gain: 0, pan: -0.7, dist: 0.25}),
  c(M.H3 + 0.05, 'servo_whir', {gain: -4, pan: -0.7, dist: 0.25, dur: 0.9, fade: 0.2}),
  ...[0, 2, 4, 6].map((k) => c(beat(Math.ceil((M.H3 - M.H1) / (M.H2 - M.H1)) + k), 'heavy_stomp', {gain: -9, pan: -0.75, dist: 0.3})),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => c(beat(Math.ceil((M.H3 - M.H1) / (M.H2 - M.H1)) + k) + 0.01, 'robot_step', {gain: -6, pan: k % 2 ? 0.45 : -0.2, dist: 0.25})),
  c(24.6, 'drone_pass', {gain: -8, pan: 0.6, dist: 0.35}),
];

// B5 — the strap (he is centre, the van and the radio low right at the start)
const B5: Cue[] = [
  c(27.02, 'breath_ragged', {gain: -1, pan: -0.05, dist: 0.25, dur: 2.6, fade: 0.5}),
  c(TB.raise, 'cloth_move', {gain: -1, pan: -0.05, dist: 0.15, dur: 0.8, fade: 0.2}), // the arm comes up
  c(TB.bite, 'cloth_move', {gain: -3, pan: 0.0, dist: 0.1, dur: 0.4, rate: 1.3, fade: 0.1}), // teeth on the strap
  c(TB.tug, 'cloth_move', {gain: 2, pan: 0.05, dist: 0.1, dur: 0.5, rate: 1.45, fade: 0.1}), // the pull
  c(TB.tug + 0.02, 'breath_exert', {gain: -5, pan: 0.0, dist: 0.1, dur: 0.9, fade: 0.25}),
  c(TB.tugEnd, 'armor_hit', {gain: -16, pan: -0.05, dist: 0.15, rate: 1.3}), // the plate snugs against the forearm
  c(TB.ready, 'breath_ragged', {gain: -7, pan: 0.0, dist: 0.2, dur: 1.0, fade: 0.3}),
];

// B6 — the halts (the global army_halt sits on H4). The lens is among the vanguard's ranks looking west: the machine
// just left of the lens and its rank slow from H4 and plant their last step two beats later (31.06); the main body (H5a) and the rear and the
// heavies (H5b) plant behind the lens, all around.
const B6: Cue[] = [
  c(STOP.van, 'robot_step_heavy', {gain: 2, pan: -0.45, dist: 0.08}), // the nearest machine plants, a few metres off
  c(STOP.van + 0.008, 'robot_step', {gain: -1, pan: -0.85, dist: 0.12}),
  ...armyStep(STOP.van + 0.004, -4, -0.1),
  ...armyStep(STOP.main, 0, 0),
  c(STOP.main + 0.01, 'robot_step_heavy', {gain: -2, pan: 0.6, dist: 0.3}),
  ...armyStep(STOP.rear, 1, 0),
  c(STOP.rear + 0.01, 'heavy_stomp', {gain: -3, pan: 0.1, dist: 0.6}),
  c(STOP.rear + 0.4, 'servo_heavy', {gain: -10, pan: 0.0, dist: 0.6, dur: 1.5, fade: 0.6}), // a settle of hydraulics
];

export const CUES_B: Cue[] = [...B1, ...B2, ...B3, ...B4, ...B5, ...B6];
