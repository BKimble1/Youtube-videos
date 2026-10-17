// Group C2 sound cues (film seconds). Pan = where the source sits on screen in that shot; dist = how far it is.
// Synced to the same world timeline as the picture (BEAT), so the sound lands on the action. No tinnitus here: the
// mix places it with the muffled perspective after the blast (BEAT.blast = 105.25).
import {Cue} from '../../film/cue';
import {BEAT, DOCK, SHOT} from './world';
import {LEAP, D_BOARD, F_RUN, CATCH, HAUL, J1, J2, LAY} from './blocking';
import {C16_CUT} from './descend';

const c = (t: number, kind: string, o: Omit<Cue, 't' | 'kind'> = {}): Cue => ({t, kind, ...o});
const steps = (t0: number, t1: number, every: number, kind: string, o: Omit<Cue, 't' | 'kind'> = {}): Cue[] => {
  const out: Cue[] = [];
  for (let t = t0, i = 0; t < t1; t += every, i++) out.push(c(t, i % 2 ? kind : kind === 'step_grate' ? 'step_grate_b' : kind, {...o, rate: 1 + ((i * 37) % 7 - 3) * 0.015}));
  return out;
};

export const CUES: Cue[] = [
  // ---------------- C9: the catwalk run, the ladder, the hoist; the breaker grinding in from the west
  c(SHOT.C9.start, 'drone_rotor', {dur: 4.2, dist: 0.6, pan: -0.2, gain: -2, fade: 0.6}),
  c(SHOT.C9.start, 'servo_heavy', {dur: 7.5, dist: 0.85, pan: -0.9, gain: -4, fade: 1.0}),
  ...steps(SHOT.C9.start + 0.05, BEAT.sprint + 0.45, 0.24, 'step_grate', {pan: -0.6, dist: 0.45, gain: -3}),
  ...steps(BEAT.sprint + 0.5, BEAT.sprint + 1.12, 0.16, 'step_grate_b', {pan: -0.55, dist: 0.45, gain: -5}),
  c(BEAT.sprint + 1.1, 'step_grate', {pan: -0.5, dist: 0.4}),
  c(BEAT.grab - 0.5, 'breath_exert', {pan: -0.5, dist: 0.45, gain: -4, dur: 1.4, fade: 0.2}),
  c(BEAT.grab, 'lever_clunk', {pan: -0.45, dist: 0.5, gain: -8, rate: 1.2}),

  // ---------------- C10: the lever, the brake lets go, boarding, the refusal
  c(BEAT.arm, 'lever_clunk', {pan: -0.35, dist: 0.1, gain: 2}),
  c(BEAT.arm + 0.04, 'crane_chain', {pan: 0.35, dist: 0.25, gain: -2}),
  c(BEAT.arm + 0.1, 'cable_strain', {pan: 0.4, dist: 0.3, dur: 2.6, gain: -3, fade: 0.4}),
  ...steps(BEAT.arm + 0.4, SHOT.C10.end - 0.3, 0.3, 'step_grate', {pan: 0.3, dist: 0.35, gain: -6}),
  c(93.65, 'breath_exert', {pan: 0.1, dist: 0.1, gain: -9, dur: 1.0, fade: 0.2}),

  // ---------------- C11: the transfer
  ...steps(95.45, D_BOARD, 0.18, 'step_grate', {pan: -0.3, dist: 0.2}),
  c(D_BOARD, 'step_grate_b', {pan: -0.2, dist: 0.2, gain: 3}),
  c(BEAT.depart, 'lever_clunk', {pan: -0.85, dist: 0.45, gain: 0}),
  c(BEAT.depart + 0.02, 'crane_trolley', {pan: 0.0, dist: 0.2, dur: 4.6, gain: 0, fade: 0.5}),
  c(BEAT.depart + 0.05, 'cable_strain', {pan: 0.1, dist: 0.2, dur: 3.0, gain: -2, fade: 0.4}),
  c(BEAT.depart + 0.3, 'sensor_lock', {pan: 0.3, dist: 0.4, gain: -2}),
  c(BEAT.droneHit - 0.9, 'drone_rotor', {pan: 0.2, dist: 0.15, dur: 0.95, gain: 4, rate: 1.25, fade: 0.25}),
  c(BEAT.droneHit, 'metal_tear', {pan: 0.15, dist: 0.15, gain: 2}),
  c(BEAT.droneHit, 'sparks', {pan: 0.15, dist: 0.2, gain: 0}),
  c(BEAT.droneHit + 0.03, 'elec_arc', {pan: 0.1, dist: 0.2, gain: -3}),
  c(BEAT.droneHit + 0.06, 'crane_chain', {pan: 0.0, dist: 0.2, gain: 2}),
  c(BEAT.droneHit + 0.15, 'debris_rain', {pan: 0.1, dist: 0.5, gain: -4}),
  c(BEAT.barrier, 'servo_whir', {pan: 0.75, dist: 0.35, gain: 0, dur: 1.35, fade: 0.15}),
  c(LEAP[0] - 0.05, 'breath_exert', {pan: 0.4, dist: 0.2, gain: -2, dur: 0.8, fade: 0.15}),
  c(LEAP[1], 'body_fall', {pan: 0.5, dist: 0.25, gain: -2}),
  c(BEAT.jam, 'lever_clunk', {pan: 0.55, dist: 0.25, gain: 3, rate: 0.85}),
  c(BEAT.jam + 0.02, 'hydraulic', {pan: 0.55, dist: 0.3, gain: 0}),
  c(BEAT.jam + 0.1, 'servo_heavy', {pan: 0.6, dist: 0.35, dur: 1.2, gain: -6, fade: 0.3}),

  // ---------------- C12: the lock, the launcher swings, the hand tightens, the dock
  c(BEAT.arrival + 0.45, 'sensor_lock', {pan: -0.55, dist: 0.25, gain: 2}),
  c(BEAT.aimed - 0.65, 'servo_heavy', {pan: -0.7, dist: 0.35, dur: 0.75, gain: -2, fade: 0.15}),
  c(BEAT.aimed - 0.05, 'hydraulic', {pan: -0.7, dist: 0.35, gain: -3}),
  c(BEAT.aimed + 0.02, 'sensor_lock', {pan: -0.6, dist: 0.4, gain: -1, rate: 0.85}),
  c(103.0, 'breath_ragged', {pan: 0.2, dist: 0.05, dur: 1.3, gain: -6, fade: 0.3}),
  c(104.07, 'cable_strain', {pan: 0.0, dist: 0.0, dur: 0.5, gain: -10, fade: 0.1, rate: 1.4}),
  c(DOCK, 'lever_clunk', {pan: 0.85, dist: 0.65, gain: 0, rate: 0.7}),
  c(DOCK + 0.02, 'crane_chain', {pan: 0.85, dist: 0.6, gain: -2}),

  // ---------------- C13: let go, the shot, the blast, the drop
  c(F_RUN[0] - 0.08, 'lever_clunk', {pan: -0.6, dist: 0.5, gain: -2, rate: 1.15}),
  ...steps(F_RUN[0], BEAT.blast, 0.15, 'step_grate', {pan: -0.5, dist: 0.5, gain: -4}),
  c(BEAT.blast - 0.3, 'launcher', {pan: -0.85, dist: 0.5, gain: 2}),
  c(BEAT.blast, 'blast', {pan: -0.45, dist: 0.3, gain: 2}),
  c(BEAT.blast, 'sub_boom', {pan: 0, dist: 0, gain: 0}),
  c(BEAT.blast + 0.04, 'metal_tear', {pan: -0.4, dist: 0.35, gain: 0}),
  c(BEAT.blast + 0.12, 'debris_rain', {pan: -0.4, dist: 0.4, gain: -2}),
  c(BEAT.sag, 'metal_tear', {pan: -0.45, dist: 0.4, gain: -1, rate: 0.8}),
  c(BEAT.sag + 0.02, 'crane_chain', {pan: -0.4, dist: 0.4, gain: -3, rate: 0.8}),
  c(BEAT.sag + 0.05, 'sparks', {pan: -0.45, dist: 0.45, gain: -4}),

  // ---------------- C14: the run back, the catch, the haul (the mix muffles the first seconds)
  ...steps(SHOT.C14.start + 0.05, 108.65, 0.17, 'step_grate', {pan: 0.3, dist: 0.25, gain: -2}),
  c(108.2, 'metal_tear', {pan: 0.0, dist: 0.3, gain: -8, rate: 1.3}),
  c(108.5, 'sparks', {pan: -0.1, dist: 0.3, gain: -8}),
  c(108.75, 'body_fall', {pan: -0.1, dist: 0.15, gain: 0}),
  c(CATCH, 'breath_exert', {pan: -0.1, dist: 0.05, gain: 0, dur: 1.2, fade: 0.2}),
  c(CATCH + 0.04, 'cable_strain', {pan: 0, dist: 0.2, dur: 1.6, gain: -4, fade: 0.3}),
  c(HAUL[0] + 0.1, 'breath_exert', {pan: -0.15, dist: 0.1, gain: -1, dur: 1.6, fade: 0.3, rate: 0.95}),
  c(HAUL[0] + 0.4, 'metal_tear', {pan: -0.2, dist: 0.3, gain: -9, rate: 0.7}),
  ...steps(J1[0] + 0.1, J1[1], 0.3, 'step_grate', {pan: 0.1, dist: 0.25, gain: -5}),

  // ---------------- C15: off the walkway; the gantry falls on the breaker
  ...steps(J2[0], LAY[0], 0.28, 'step_grate', {pan: 0.6, dist: 0.6, gain: -6}),
  c(LAY[0] + 0.5, 'body_fall', {pan: 0.65, dist: 0.6, gain: -8}),
  c(BEAT.lurch, 'metal_tear', {pan: -0.5, dist: 0.5, gain: 2}),
  c(BEAT.lurch + 0.05, 'crane_chain', {pan: -0.3, dist: 0.5, gain: 0}),
  c(BEAT.lurch + 0.3, 'gantry_collapse', {pan: -0.3, dist: 0.4, gain: 2}),
  c(BEAT.crush, 'wreck_slam', {pan: -0.65, dist: 0.45, gain: 3}),
  c(BEAT.crush, 'sub_boom', {pan: -0.5, dist: 0.2, gain: -2}),
  c(BEAT.crush + 0.03, 'metal_tear', {pan: -0.65, dist: 0.45, gain: 0, rate: 0.75}),
  c(BEAT.crush + 0.08, 'sparks', {pan: -0.65, dist: 0.45, gain: -2}),
  c(BEAT.crush + 0.2, 'hydraulic', {pan: -0.65, dist: 0.5, gain: -4, rate: 0.8}),
  c(BEAT.slam, 'wreck_slam', {pan: -0.35, dist: 0.4, gain: 2, rate: 0.9}),
  c(BEAT.slam, 'sub_boom', {pan: -0.3, dist: 0.2, gain: -3}),
  c(BEAT.slam + 0.1, 'debris_rain', {pan: -0.4, dist: 0.5, gain: 0}),
  c(BEAT.slam + 0.35, 'robot_step_heavy', {pan: -0.85, dist: 0.75, gain: -4}),
  c(BEAT.slam + 0.8, 'robot_step_heavy', {pan: -0.8, dist: 0.75, gain: -5}),
  c(BEAT.slam + 1.3, 'servo_whir', {pan: -0.8, dist: 0.7, gain: -6}),
  c(BEAT.slam + 0.2, 'drone_rotor', {pan: -0.4, dist: 0.6, dur: 1.4, gain: -2, fade: 0.5, rate: 0.9}),

  // ---------------- C16: steel stair treads, then paving; breathing under the load
  ...steps(SHOT.C16.start + 0.1, C16_CUT - 0.1, 0.34, 'step_grate', {pan: -0.1, dist: 0.4, gain: -6}),
  c(SHOT.C16.start + 0.4, 'breath_ragged', {pan: 0, dist: 0.35, dur: 6.8, gain: -8, fade: 0.8}),
  c(C16_CUT, 'steps_gravel', {pan: 0, dist: 0.3, dur: 3.8, gain: -6, fade: 0.4}),
];
