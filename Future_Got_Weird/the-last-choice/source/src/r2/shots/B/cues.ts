// Section B sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs). The global cues (eyes_on at H1, army_halt
// at H4, the army_march bed from ORCH) live in src/r2/sound.ts and are not repeated here.
// pan = screen x of the source (−1 left … 1 right), dist = camera distance (0 close … 1 far).
// R3: effort sounds (breaths, groans) lowered 6–8 dB and the long loops shortened: they sat above the score's quiet
// opening solo (measured, and reported by ear). The score leads; the breaths stay with him, not over the music. (The
// R3 re-cut keeps those levels: no breath here is louder than the lead's balance; the new ones sit lower still.)
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';
import {TB, beat, STOP, SENTRY_T} from './beats';

const c = (t: number, kind: string, o: Omit<Cue, 't' | 'kind'> = {}): Cue => ({t, kind, ...o});

// B1 — the close on the hand (the source sits just left of centre, very near)
const B1: Cue[] = [
  c(M.SOLO + 0.05, 'breath_ragged', {gain: -9, pan: -0.15, dist: 0.05, dur: 2.4, fade: 0.6}), // his breath under the slab
  c(TB.slideOut, 'rubble_shift', {gain: -12, pan: -0.25, dist: 0.05, dur: 0.6, rate: 1.4, fade: 0.15}), // the arm drags out over grit
  c(TB.slap, 'body_fall', {gain: -10, pan: -0.1, dist: 0.0, rate: 1.7}), // the palm slaps down on concrete
  c(TB.slap + 0.01, 'debris_rain', {gain: -12, pan: -0.1, dist: 0.05, dur: 0.7, rate: 1.5, fade: 0.2}), // chips skitter
  c(TB.slap + 0.02, 'breath_exert', {gain: -12, pan: -0.15, dist: 0.05, dur: 0.9, fade: 0.25}),
  c(TB.press, 'rubble_shift', {gain: -14, pan: -0.1, dist: 0.05, dur: 0.7, rate: 1.2, fade: 0.2}), // the press grinds
  c(TB.strain, 'debris_rain', {gain: -16, pan: 0.2, dist: 0.1, dur: 0.9, rate: 1.2, fade: 0.3}), // grit trickles off the slab
  c(TB.slip - 0.08, 'rubble_shift', {gain: -15, pan: -0.05, dist: 0.05, dur: 0.35, rate: 1.7, fade: 0.1}), // the claw scrapes back
];

// B2 — the rise (side-on from the south: the slab and his legs left, he crawls out toward the right, stands centre)
const B2: Cue[] = [
  c(TB.pull, 'breath_exert', {gain: -9, pan: -0.15, dist: 0.15, dur: 1.4, fade: 0.3}),
  c(TB.pull + 0.03, 'rubble_shift', {gain: -6, pan: -0.15, dist: 0.15, dur: 1.2, fade: 0.3}), // he drags himself over the rubble
  c(12.71, 'body_fall', {gain: -15, pan: 0.05, dist: 0.2, rate: 2.0}), // the lump his head shoved off lands
  c(12.9, 'body_fall', {gain: -17, pan: -0.4, dist: 0.25, rate: 2.2}), // the chunk off his calf
  c(TB.push, 'breath_exert', {gain: -8, pan: -0.05, dist: 0.15, dur: 1.2, fade: 0.3}),
  c(TB.push + 0.1, 'rubble_shift', {gain: -9, pan: -0.3, dist: 0.2, dur: 0.9, rate: 0.85, fade: 0.25}), // the slab grinds on his back
  c(13.33, 'body_fall', {gain: -14, pan: 0.0, dist: 0.15, rate: 1.8}), // the chunk off his back
  c(TB.slabLand, 'body_fall', {gain: -6, pan: -0.4, dist: 0.2, rate: 0.75}), // the slab drops back onto the mounds
  c(TB.slabLand + 0.02, 'debris_rain', {gain: -9, pan: -0.4, dist: 0.2, dur: 1.2, fade: 0.4}),
  c(TB.knee + 0.12, 'steps_gravel', {gain: -9, pan: -0.05, dist: 0.15, dur: 0.4, fade: 0.1}), // the right knee into the rubble
  c(14.22, 'body_fall', {gain: -14, pan: 0.15, dist: 0.2, rate: 1.6}), // the kicked chunk rolls down the slope
  c(TB.knee + 0.25, 'breath_ragged', {gain: -10, pan: 0.0, dist: 0.15, dur: 1.2, fade: 0.3}),
  c(TB.kneel, 'steps_gravel', {gain: -9, pan: 0.1, dist: 0.15, dur: 0.35, fade: 0.1}), // the left foot plants in front
  c(TB.rebar, 'cable_strain', {gain: -8, pan: 0.25, dist: 0.1, dur: 0.8, rate: 1.4, fade: 0.2}), // the rebar creaks in his grip
  c(TB.weight, 'breath_exert', {gain: -8, pan: 0.05, dist: 0.15, dur: 1.6, fade: 0.3}), // the load forward over the knee
  c(TB.step, 'steps_gravel', {gain: -8, pan: 0.05, dist: 0.15, dur: 0.4, fade: 0.1}), // the right foot comes in under him
  c(TB.rise, 'cable_strain', {gain: -6, pan: 0.25, dist: 0.1, dur: 0.9, rate: 1.3, fade: 0.25}), // the drive: the bar bends
  c(TB.staggerEnd, 'steps_gravel', {gain: -6, pan: 0.1, dist: 0.15, dur: 0.5, fade: 0.15}), // the half step to catch himself
  c(TB.release, 'cable_strain', {gain: -13, pan: 0.25, dist: 0.1, dur: 0.3, rate: 1.9, fade: 0.1}), // the bar springs back
  c(TB.stood, 'breath_ragged', {gain: -10, pan: 0.05, dist: 0.15, dur: 2.2, fade: 0.6}),
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
  c(M.H1 + 0.08, 'breath_exert', {gain: -16, pan: -0.5, dist: 0.2, dur: 0.5, fade: 0.15}), // his breath catches
  // the lockstep carries on under the march bed, fading as the camera settles
  ...[3, 4, 5, 6].flatMap((k) => [c(beat(k), 'robot_step_heavy', {gain: -6 - k, pan: 0.5, dist: 0.75}), c(beat(k) + 0.01, 'robot_step', {gain: -8 - k, pan: 0.3, dist: 0.8})]),
];

// B4 — his eyes on the heavy (far, centre): the lockstep in front of it, its feet on the beat, the head on H3
const kB4 = Math.ceil((21.4 - M.H1) / (M.H2 - M.H1));
const B4: Cue[] = [
  ...[0, 1, 2, 3, 4, 5, 6].flatMap((k) => [
    c(beat(kB4 + k), 'robot_step', {gain: -10, pan: (k % 2 ? 0.2 : -0.2), dist: 0.85}),
    c(beat(kB4 + k) + 0.015, 'heavy_stomp', {gain: k % 2 ? -14 : -11, pan: 0.0, dist: 0.85}),
  ]),
  c(M.H3 + 0.03, 'heavy_servo', {gain: -2, pan: 0.0, dist: 0.7}), // its head swings round to him
  c(M.H3 + 0.05, 'servo_whir', {gain: -6, pan: 0.0, dist: 0.7, dur: 0.7, fade: 0.2}),
  c(M.H3 + 0.62, 'sensor_lock', {gain: -16, pan: 0.0, dist: 0.8}), // the head stops on him
];

// B5a — his face: the breath catches, then lets go as he sets (quiet: under the score)
const B5A: Cue[] = [
  c(TB.see - 0.02, 'breath_exert', {gain: -16, pan: 0.0, dist: 0.1, dur: 0.45, fade: 0.15}),
  c(TB.set + 0.1, 'breath_ragged', {gain: -16, pan: 0.0, dist: 0.1, dur: 1.0, fade: 0.4}),
];

// B5b — the strap (he is centre, the van and the radio low right at the start)
const B5B: Cue[] = [
  c(26.36, 'breath_ragged', {gain: -11, pan: -0.05, dist: 0.25, dur: 2.0, fade: 0.5}),
  c(TB.raise, 'cloth_move', {gain: -1, pan: -0.05, dist: 0.15, dur: 0.8, fade: 0.2}), // the arm comes up
  c(TB.bite, 'cloth_move', {gain: -3, pan: 0.0, dist: 0.1, dur: 0.4, rate: 1.3, fade: 0.1}), // teeth on the strap
  c(TB.tug, 'cloth_move', {gain: 2, pan: 0.05, dist: 0.1, dur: 0.5, rate: 1.45, fade: 0.1}), // the pull
  c(TB.tug + 0.02, 'breath_exert', {gain: -11, pan: 0.0, dist: 0.1, dur: 0.9, fade: 0.25}),
  c(TB.tugEnd, 'armor_hit', {gain: -16, pan: -0.05, dist: 0.15, rate: 1.3}), // the plate snugs against the forearm
  c(TB.ready, 'breath_ragged', {gain: -12, pan: 0.0, dist: 0.2, dur: 1.0, fade: 0.3}),
];

// B6a — the halts, from the crane riding over the main body (the global army_halt sits on H4): the vanguard below the
// frame's middle plants two beats after H4 (31.06); the main body right under the lens on H5a; the rear and the
// heavies (the nearest just right of the lens, behind it) on H5b; the sentry drops off its place and goes, away from
// us, across the crater
const B6A: Cue[] = [
  ...armyStep(STOP.van, -2, 0).map((q) => ({...q, dist: Math.max(0.35, (q.dist ?? 0.6) - 0.25)})),
  c(STOP.main, 'robot_step_heavy', {gain: 1, pan: -0.35, dist: 0.12}), // the ranks right under the lens
  c(STOP.main + 0.008, 'robot_step_heavy', {gain: 0, pan: 0.35, dist: 0.14}),
  c(STOP.main + 0.015, 'robot_step', {gain: -2, pan: 0.0, dist: 0.18}),
  ...armyStep(STOP.main + 0.004, -3, 0),
  c(STOP.rear, 'heavy_stomp', {gain: 0, pan: 0.75, dist: 0.12}), // the heavy beside the crane
  ...armyStep(STOP.rear + 0.006, -2, 0),
  c(STOP.rear + 0.4, 'servo_heavy', {gain: -8, pan: 0.7, dist: 0.15, dur: 1.5, fade: 0.6}), // its hydraulics settle
  c(SENTRY_T.go + 0.05, 'drone_pass', {gain: -9, pan: -0.25, dist: 0.3}), // the sentry drops off its place and goes
];

// B6b — the sentry's over-the-shoulder: it darts in past the lens (right), brakes, hovers; the mark; his plate comes
// up; its gimbal flicks past him; it backs off past the lens (right, rising)
const B6B: Cue[] = [
  c(33.62, 'drone_pass', {gain: -5, pan: 0.65, dist: 0.12}), // in past the lens
  c(SENTRY_T.arrive - 0.1, 'drone_rotor', {gain: -13, pan: 0.2, dist: 0.18, dur: 1.05, fade: 0.25}), // braking, the hover
  c(TB.guard + 0.05, 'cloth_move', {gain: -5, pan: -0.25, dist: 0.3, dur: 0.6, rate: 1.2, fade: 0.15}), // the plate comes up
  c(TB.guard + 0.1, 'breath_exert', {gain: -16, pan: -0.25, dist: 0.3, dur: 0.6, fade: 0.2}),
  c(SENTRY_T.mark0, 'sensor_lock', {gain: -7, pan: 0.15, dist: 0.18}), // the mark
  c(SENTRY_T.past, 'servo_whir', {gain: -12, pan: 0.2, dist: 0.18, dur: 0.3, rate: 1.4, fade: 0.08}), // the gimbal flicks past him
  c(SENTRY_T.back + 0.04, 'drone_pass', {gain: -7, pan: 0.6, dist: 0.15, rate: 0.92}), // it backs off past the lens
  c(TB.guardDown + 0.05, 'cloth_move', {gain: -9, pan: -0.25, dist: 0.3, dur: 0.5, fade: 0.15}), // the plate comes down
];

/**
 * R3 balance for the rise (SOLO 9.30 → ORCH 16.76): Portals' opening solo is very quiet (≈ −45 dB short-term), so the
 * rise's effort sounds (breaths) and rubble/body contacts sat up to 10 dB above it (measured on the stems). The score
 * leads here: those cues come down a further RISE_DB at their source, and near-duplicate small contacts (the same kind
 * within 0.3 s) are thinned to the first. Outside the solo nothing changes.
 */
const RISE_A = M.SOLO, RISE_B = M.ORCH, RISE_DB = 6;
const RISE_KINDS = new Set(['breath_ragged', 'breath_exert', 'rubble_shift', 'body_fall', 'debris_rain', 'steps_gravel', 'cable_strain']);
const balanceRise = (cs: Cue[]): Cue[] => {
  const sorted = [...cs].sort((a, b) => a.t - b.t);
  const lastByKind = new Map<string, number>();
  return sorted.flatMap((c) => {
    if (c.t < RISE_A || c.t >= RISE_B || !RISE_KINDS.has(c.kind)) return [c];
    const prev = lastByKind.get(c.kind);
    lastByKind.set(c.kind, c.t);
    if (prev !== undefined && c.t - prev < 0.3 && !c.dur) return [];
    return [{...c, gain: (c.gain ?? 0) - RISE_DB}];
  });
};

export const CUES_B: Cue[] = balanceRise([...B1, ...B2, ...B3, ...B4, ...B5A, ...B5B, ...B6A, ...B6B]);
