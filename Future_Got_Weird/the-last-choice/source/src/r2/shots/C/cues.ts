// Section C sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs). The beds (wind, fire, the far battle; the
// army march bed that fades out after BASS_OUT and comes back on CHARGE) are global (src/r2/sound.ts).
// pan = screen x of the source in the shot playing at that moment (−1 left … 1 right); dist = camera distance / 12 m.
// Footfall and palm times are crew.ts's walk plants and climb plants (the climbs are step-climbs: one cue per plant on
// the steep steps, the effort on the big step-ups), and the commit's planted steps — listed by the C probe from the
// shots' own cameras; keep them in sync if the paths change.
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';
import {TD, TT, TR, TB2, T3, TDR} from './beats';

const c = (t: number, kind: string, o: Omit<Cue, 't' | 'kind'> = {}): Cue => ({t, kind, ...o});
const steps = (ts: number[], o: Omit<Cue, 't' | 'kind'>): Cue[] => ts.map((t, i) => c(t, 'steps_gravel', {...o, gain: (o.gain ?? -10) - (i % 2) * 1.5, rate: (o.rate ?? 1) * (i % 3 === 1 ? 1.06 : 1)}));
/** climb plants: [t, pan, dist] — a short gravel crunch each, a little heavier on the step-ups */
const plants = (k: [number, number, number][], o: {gain?: number; rate?: number} = {}): Cue[] => k.map(([t, pan, dist], i) => c(t, 'steps_gravel', {gain: (o.gain ?? -11) - (i % 2) * 1.5, pan, dist, dur: 0.32, fade: 0.08, rate: (o.rate ?? 1) * (i % 3 === 2 ? 1.07 : 1)}));

// C1 — BASS_OUT: the world goes quiet (nothing added for the first beat: let it breathe). A faint scrape on the rubble
// far behind him; the collar as the head turns; his three steps as he comes round.
const C1: Cue[] = [
  c(TD.heard, 'rubble_shift', {gain: -22, pan: -0.65, dist: 0.95, dur: 0.6, rate: 1.2, fade: 0.2}),
  c(TD.head + 0.02, 'cloth_move', {gain: -17, pan: 0.05, dist: 0.1, dur: 0.45, rate: 1.1, fade: 0.12}),
  ...steps([37.48, 37.76, 38.04, 38.32], {gain: -13, pan: -0.1, dist: 0.15, rate: 1.1}),
];

// C2 — his POV: her footfalls on the rubble as she comes out of the smoke (a little slide on one), his breath close;
// in the smoke behind her, heavier steps (the breaker)
const C2: Cue[] = [
  c(38.62, 'breath_ragged', {gain: -16, pan: 0.0, dist: 0.0, dur: 1.4, fade: 0.4}),
  ...steps([38.67, 38.92, 39.17, 39.41, 39.66, 39.91], {gain: -12, pan: -0.05, dist: 0.75}),
  c(39.4, 'rubble_shift', {gain: -16, pan: -0.05, dist: 0.75, dur: 0.5, rate: 1.3, fade: 0.15}),
  ...steps([39.46, 39.67, 39.88, 40.1], {gain: -17, pan: -0.2, dist: 0.88, rate: 0.85}),
];

// C3 — the runner's sprint out of the smoke; the vault (palm slap on the concrete edge, the swing, the landing, grit);
// his step-climb (a crunch on each plant, his palm on the rubble at the steepest); the breaker's heavier climb behind
// (his palm, the tank knocking); the tether operator far up the slope; the Director's breath of recognition
const C3: Cue[] = [
  c(40.16, 'run_rubble', {gain: -6, pan: -0.3, dist: 0.6, dur: 1.25, fade: 0.15}),
  ...steps([41.17, 41.33], {gain: -7, pan: -0.2, dist: 0.55}),
  c(TR.hand, 'body_fall', {gain: -11, pan: -0.1, dist: 0.5, rate: 1.8}), // the palm on the top edge
  c(TR.hand + 0.01, 'debris_rain', {gain: -18, pan: -0.1, dist: 0.5, dur: 0.6, rate: 1.4, fade: 0.2}),
  c(TR.hand + 0.04, 'breath_exert', {gain: -12, pan: -0.15, dist: 0.5, dur: 0.6, fade: 0.15}),
  c(TR.over - 0.06, 'cloth_move', {gain: -9, pan: -0.15, dist: 0.5, dur: 0.4, rate: 1.35, fade: 0.1}), // the swing
  c(TR.land, 'body_fall', {gain: -6, pan: -0.15, dist: 0.5, rate: 1.15}), // the landing
  c(TR.land + 0.12, 'steps_gravel', {gain: -8, pan: -0.15, dist: 0.5}), // the left foot down
  c(TR.land + 0.02, 'rubble_shift', {gain: -13, pan: -0.15, dist: 0.5, dur: 0.7, rate: 1.2, fade: 0.2}),
  c(TR.rec - 0.05, 'breath_ragged', {gain: -14, pan: -0.15, dist: 0.5, dur: 0.9, fade: 0.25}),
  // the runner climbs (step-ups: the plants)
  ...plants([[42.55, -0.32, 0.66], [42.8, -0.25, 0.63], [43.06, -0.29, 0.58], [43.52, -0.26, 0.53], [43.73, -0.12, 0.52], [43.94, -0.04, 0.48], [44.21, 0.08, 0.48], [44.48, 0.14, 0.44], [44.74, 0.28, 0.44], [44.99, 0.43, 0.41], [45.25, 0.54, 0.42]], {gain: -11}),
  c(44.12, 'rubble_shift', {gain: -14, pan: 0.11, dist: 0.48, dur: 0.45, rate: 1.3, fade: 0.12}), // his palm on the rubble
  c(44.2, 'breath_exert', {gain: -15, pan: 0.1, dist: 0.48, dur: 0.5, fade: 0.12}),
  // the breaker, heavier, behind (slower rate)
  ...plants([[42.73, 0.15, 1.0], [43.07, 0.08, 0.99], [43.39, -0.05, 0.94], [43.88, -0.02, 0.88], [44.15, 0.03, 0.85], [44.46, -0.01, 0.81], [44.78, 0.02, 0.78], [45.07, -0.02, 0.75]], {gain: -15, rate: 0.85}),
  c(42.96, 'rubble_shift', {gain: -16, pan: 0.13, dist: 0.99, dur: 0.6, fade: 0.2}), // his palm on the rubble
  c(43.0, 'breath_exert', {gain: -18, pan: 0.13, dist: 0.99, dur: 0.6, fade: 0.15}),
  c(43.2, 'hydraulic', {gain: -21, pan: 0.05, dist: 0.95, rate: 1.5}), // the tank knocks as he pushes up
  // the tether operator, far up the slope (right)
  ...plants([[43.08, 0.53, 0.89], [43.42, 0.36, 0.85], [43.74, 0.36, 0.83], [44.06, 0.31, 0.79], [44.37, 0.33, 0.77], [44.68, 0.29, 0.72], [45.01, 0.36, 0.69]], {gain: -17, rate: 1.05}),
  c(43.64, 'rubble_shift', {gain: -19, pan: 0.39, dist: 0.82, dur: 0.45, rate: 1.3, fade: 0.12}), // her palm on the bank
  c(TD.recognise, 'breath_ragged', {gain: -11, pan: 0.35, dist: 0.08, dur: 1.4, fade: 0.4}), // his breath of recognition
];

// C4a/C4b — MARCH: the three climb out of the street toward the lens a step at a time (the pilot nearest, right; the
// flare carrier, his palm on the bank; the decoy maker, left); she stops; the drone: the rotors spin up with a whine, it
// lifts off her palm and climbs (its bed hums on under the rest of the section); the other two climb past behind her
// (the decoy maker's palm and big step up); she goes on up
const C4: Cue[] = [
  ...plants([[45.4, 0.28, 0.51], [45.63, 0.18, 0.48], [45.86, 0.26, 0.45], [46.07, 0.15, 0.42], [46.27, 0.22, 0.38], [46.5, 0.06, 0.34], [46.69, 0.12, 0.29], [46.92, -0.02, 0.34]], {gain: -9}), // the pilot
  c(45.5, 'breath_exert', {gain: -13, pan: 0.3, dist: 0.35, dur: 0.6, fade: 0.15}),
  ...plants([[45.3, -0.09, 0.57], [45.6, -0.04, 0.52], [45.89, -0.14, 0.5], [46.11, -0.09, 0.45], [46.39, -0.2, 0.43], [46.6, -0.13, 0.39]], {gain: -12}), // the flare carrier
  c(45.51, 'rubble_shift', {gain: -15, pan: -0.03, dist: 0.52, dur: 0.5, rate: 1.25, fade: 0.15}), // his palm
  ...plants([[45.53, -0.45, 0.68], [45.86, -0.44, 0.64], [46.17, -0.54, 0.62], [46.46, -0.55, 0.57]], {gain: -14}), // the decoy maker
  c(T3.launch - 0.08, 'steps_gravel', {gain: -12, pan: 0.05, dist: 0.4, dur: 0.3, fade: 0.1}), // she stops
  ...plants([[46.89, 0.06, 0.42], [47.13, 0.0, 0.37], [47.4, -0.11, 0.37], [47.61, -0.21, 0.34], [47.89, -0.34, 0.34], [48.14, -0.47, 0.3], [48.41, -0.59, 0.33], [48.69, -0.64, 0.33], [48.98, -0.45, 0.37], [49.28, -0.5, 0.38]], {gain: -11}), // the flare carrier, behind her
  c(47.6, 'cloth_move', {gain: -15, pan: -0.05, dist: 0.45, dur: 0.4, fade: 0.1}), // his satchel swings
  c(46.99, 'rubble_shift', {gain: -22, pan: -0.7, dist: 0.95, dur: 0.5, fade: 0.2}), // the breaker's palm, off on the crest
  c(47.45, 'rubble_shift', {gain: -23, pan: -0.8, dist: 0.95, dur: 0.45, fade: 0.2}), // the tether operator's, at the summit
  ...plants([[47.06, 0.07, 0.59], [47.36, -0.04, 0.58], [47.85, -0.22, 0.54], [48.39, -0.3, 0.52], [48.99, -0.08, 0.49], [49.35, 0.04, 0.46], [49.66, 0.18, 0.48]], {gain: -14}), // the decoy maker
  c(48.85, 'rubble_shift', {gain: -15, pan: -0.19, dist: 0.49, dur: 0.5, rate: 1.25, fade: 0.15}), // her palm on the ledge
  c(48.95, 'breath_exert', {gain: -15, pan: -0.1, dist: 0.49, dur: 0.6, fade: 0.15}), // the big step up
  c(T3.spin, 'servo_whir', {gain: -10, pan: 0.05, dist: 0.35, dur: 0.9, rate: 1.6, fade: 0.2}), // the rotors spin up
  c(T3.spin + 0.05, 'ally_drone', {gain: -9, pan: 0.05, dist: 0.35, dur: M.CHARGE + 0.3 - (T3.spin + 0.05), fade: 0.7}),
  c(T3.lift, 'drone_pass', {gain: -11, pan: 0.05, dist: 0.35}), // it lifts off and climbs
  ...plants([[48.62, 0.05, 0.33], [48.83, 0.07, 0.3], [49.16, 0.12, 0.3], [49.41, 0.1, 0.27], [49.71, 0.08, 0.29]], {gain: -11}), // she goes on up
];

// C5 — the hand on the shoulder (cloth, his breath out); the reel's lock clicks, the drone rises past; the strap
const C5: Cue[] = [
  c(TB2.touch, 'cloth_move', {gain: -5, pan: 0.05, dist: 0.05, dur: 0.45, rate: 1.15, fade: 0.1}),
  c(TB2.touch + 0.1, 'breath_ragged', {gain: -13, pan: 0.2, dist: 0.05, dur: 0.9, fade: 0.25}),
  c(TT.click, 'lever_clunk', {gain: -12, pan: 0.05, dist: 0.05, rate: 1.5}),
  c(TT.click + 0.02, 'tether_reel', {gain: -8, pan: 0.05, dist: 0.05, dur: 0.32, rate: 1.25, fade: 0.08}),
  c(TDR.past - 0.25, 'drone_pass', {gain: -4, pan: -0.4, dist: 0.25}),
  c(TD.strapLook, 'cloth_move', {gain: -12, pan: 0.0, dist: 0.05, dur: 0.4, fade: 0.1}),
  c(TD.strapPress, 'cloth_move', {gain: -7, pan: -0.1, dist: 0.05, dur: 0.3, rate: 1.4, fade: 0.08}),
  c(TD.strapPress + 0.03, 'armor_hit', {gain: -22, pan: -0.1, dist: 0.05, rate: 1.5}), // the plate snugs on the forearm
];

// C6 — ASSEMBLE → CHARGE. C6a the shared turn (his four steps first, then the others' across the crest; the launcher
// comes up, the halligan spins); C6b the tools readied (the tablet wakes, the satchel, the breaker's valve: the tank
// charging, the hiss; the drone sent out); C6c/C6c2 the army: the front rank breaks into its run (servos, heavy feet,
// the eyes lock); C6d the commit: his steps out to the brink, theirs up into the line (the pilot down off the slab,
// the breaker down off the crest), the set on the accent, the plate up, the breath for the charge
const C6: Cue[] = [
  c(M.ASSEMBLE + 0.05, 'cloth_move', {gain: -12, pan: 0.0, dist: 0.5, dur: 0.6, fade: 0.15}),
  ...steps([53.34, 53.56, 53.78, 54.0], {gain: -9, pan: 0.05, dist: 0.6}), // his turn
  ...steps([53.28, 53.36, 53.61, 53.86, 54.1, 54.35], {gain: -14, pan: -0.36, dist: 0.68}), // the breaker
  ...steps([53.7, 54.1, 54.15], {gain: -14, pan: 0.6, dist: 0.8}), // the tether, the runner (right)
  ...steps([53.79, 53.81, 54.11, 54.15, 54.4], {gain: -16, pan: -0.85, dist: 0.68}), // the flare carrier, the decoy maker (left)
  ...steps([53.09, 53.31, 54.13], {gain: -14, pan: -0.1, dist: 0.68}), // the pilot onto the slab's edge, her turn
  c(TT.ready + 0.1, 'cloth_move', {gain: -15, pan: 0.65, dist: 0.8, dur: 0.35, rate: 1.2, fade: 0.1}), // the launcher up
  c(TR.flip + 0.05, 'cloth_move', {gain: -16, pan: 0.5, dist: 0.75, dur: 0.3, rate: 1.6, fade: 0.08}), // the bar spins …
  c(TR.flip + 0.42, 'lever_clunk', {gain: -22, pan: 0.5, dist: 0.75, rate: 1.7}), // … into his fist
  c(T3.tablet + 0.15, 'projector_on', {gain: -18, pan: -0.55, dist: 0.3, dur: 0.6, rate: 1.3, fade: 0.2}), // the tablet wakes
  c(T3.satchel + 0.1, 'cloth_move', {gain: -12, pan: -0.25, dist: 0.3, dur: 0.5, fade: 0.12}), // the satchel
  c(TB2.charge, 'breaker_charge', {gain: -9, pan: 0.05, dist: 0.3}), // the valve: the tank charges
  c(TB2.charged - 0.02, 'steam_vent', {gain: -14, pan: 0.05, dist: 0.3, dur: 0.45, rate: 1.4, fade: 0.15}), // the hiss
  c(T3.thumbs + 0.1, 'drone_pass', {gain: -12, pan: 0.4, dist: 0.5}), // the drone goes out ahead
  // the army: the front rank breaks into its run (across the crater: far, then close in C6c2)
  c(57.05, 'servo_heavy', {gain: -10, pan: 0.2, dist: 0.85, dur: 1.0, fade: 0.3}),
  c(57.5, 'eyes_on', {gain: -13, pan: 0.0, dist: 0.6, dur: 0.8, fade: 0.3}),
  c(57.45, 'robot_step_heavy', {gain: -9, pan: 0.3, dist: 0.55}),
  c(57.72, 'robot_step_heavy', {gain: -8, pan: 0.05, dist: 0.5}),
  c(57.96, 'robot_step_heavy', {gain: -9, pan: -0.25, dist: 0.5}),
  c(58.3, 'robot_step_heavy', {gain: -13, pan: 0.0, dist: 0.95}),
  c(58.75, 'robot_step_heavy', {gain: -12, pan: 0.0, dist: 0.95}),
  c(59.2, 'robot_step_heavy', {gain: -11, pan: 0.0, dist: 0.92}),
  // the commit
  c(TD.step - 0.08, 'breath_exert', {gain: -9, pan: 0.0, dist: 0.35, dur: 0.7, fade: 0.2}),
  ...steps([58.16, 58.55], {gain: -6, pan: -0.05, dist: 0.44}), // his steps out to the brink
  c(58.39, 'rubble_shift', {gain: -12, pan: -0.35, dist: 0.46, dur: 0.6, rate: 1.2, fade: 0.2}), // the pilot down off the slab
  ...steps([58.39, 58.59, 58.8], {gain: -10, pan: -0.35, dist: 0.46}),
  ...steps([58.57, 58.78, 59.0], {gain: -10, pan: -0.85, dist: 0.48}), // the breaker down off the crest
  ...steps([58.58, 58.85], {gain: -12, pan: 0.5, dist: 0.6}), // the runner
  ...steps([58.75, 59.05], {gain: -14, pan: 0.8, dist: 0.68}), // the tether
  c(TD.set, 'cloth_move', {gain: -11, pan: 0.0, dist: 0.4, dur: 0.4, fade: 0.1}), // they sink into the start
  c(TD.plateUp + 0.1, 'armor_hit', {gain: -19, pan: 0.0, dist: 0.4, rate: 1.4}), // the plate up into the guard
  c(59.62, 'breath_exert', {gain: -9, pan: 0.0, dist: 0.4, dur: 0.5, fade: 0.1}), // they draw breath for the charge
];

export const CUES_C: Cue[] = [...C1, ...C2, ...C3, ...C4, ...C5, ...C6];
