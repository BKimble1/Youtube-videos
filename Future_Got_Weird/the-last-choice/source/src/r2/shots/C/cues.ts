// Section C sound cues (film seconds). Pure data: import only timing/constants here, never components (this file is
// bundled into the mixer's timing.json by tools/r2/collect_timing_r2.mjs). The beds (wind, fire, the far battle; the
// army march bed that fades out after BASS_OUT and comes back on CHARGE) are global (src/r2/sound.ts).
// pan = screen x of the source in the shot playing at that moment (−1 left … 1 right); dist = camera distance.
// Footfall times are the gait plants of crew.ts (listed by the C probe; keep in sync if the paths change).
import type {Cue} from '../../../film/cue';
import {M} from '../../timing';
import {TD, TT, TR, TB2, T3, TDR} from './beats';

const c = (t: number, kind: string, o: Omit<Cue, 't' | 'kind'> = {}): Cue => ({t, kind, ...o});
const steps = (ts: number[], o: Omit<Cue, 't' | 'kind'>): Cue[] => ts.map((t, i) => c(t, 'steps_gravel', {...o, gain: (o.gain ?? -10) - (i % 2) * 1.5, rate: (o.rate ?? 1) * (i % 3 === 1 ? 1.06 : 1)}));

// C1 — BASS_OUT: the world goes quiet (nothing added for the first beat: let it breathe). A faint scrape on the rubble
// far behind him; the collar as the head turns; his three steps as he comes round.
const C1: Cue[] = [
  c(TD.heard, 'rubble_shift', {gain: -22, pan: -0.65, dist: 0.95, dur: 0.6, rate: 1.2, fade: 0.2}),
  c(TD.head + 0.02, 'cloth_move', {gain: -17, pan: 0.05, dist: 0.1, dur: 0.45, rate: 1.1, fade: 0.12}),
  ...steps([37.48, 37.76, 38.04, 38.32], {gain: -13, pan: -0.1, dist: 0.15, rate: 1.1}),
];

// C2 — his POV: her footfalls on the rubble as she comes out of the smoke (a little slide on one), his breath close;
// in the smoke behind her, heavier steps
const C2: Cue[] = [
  c(38.62, 'breath_ragged', {gain: -16, pan: 0.0, dist: 0.0, dur: 1.4, fade: 0.4}),
  ...steps([38.78, 39.08, 39.39, 39.69, 40.0], {gain: -12, pan: -0.05, dist: 0.75}),
  c(39.4, 'rubble_shift', {gain: -16, pan: -0.05, dist: 0.75, dur: 0.5, rate: 1.3, fade: 0.15}),
  ...steps([39.41, 39.67, 39.94], {gain: -17, pan: -0.2, dist: 0.88, rate: 0.85}),
];

// C3 — the runner's sprint out of the smoke; the vault (palm slap on the concrete edge, the swing, the landing, grit);
// his climb; the breaker's heavy steps, the tank, his palm on the rubble; the Director's breath of recognition
const C3: Cue[] = [
  c(40.16, 'run_rubble', {gain: -6, pan: -0.3, dist: 0.6, dur: 1.25, fade: 0.15}),
  ...steps([41.17, 41.33], {gain: -7, pan: -0.2, dist: 0.55}),
  c(TR.hand, 'body_fall', {gain: -11, pan: -0.1, dist: 0.5, rate: 1.8}), // the palm on the top edge
  c(TR.hand + 0.01, 'debris_rain', {gain: -18, pan: -0.1, dist: 0.5, dur: 0.6, rate: 1.4, fade: 0.2}),
  c(TR.hand + 0.04, 'breath_exert', {gain: -12, pan: -0.15, dist: 0.5, dur: 0.6, fade: 0.15}),
  c(TR.over - 0.06, 'cloth_move', {gain: -9, pan: -0.15, dist: 0.5, dur: 0.4, rate: 1.35, fade: 0.1}), // the swing
  c(TR.land, 'body_fall', {gain: -6, pan: -0.15, dist: 0.5, rate: 1.15}), // the landing
  c(TR.land + 0.1, 'steps_gravel', {gain: -8, pan: -0.15, dist: 0.5}),
  c(TR.land + 0.02, 'rubble_shift', {gain: -13, pan: -0.15, dist: 0.5, dur: 0.7, rate: 1.2, fade: 0.2}),
  c(TR.rec - 0.05, 'breath_ragged', {gain: -14, pan: -0.15, dist: 0.5, dur: 0.9, fade: 0.25}),
  c(42.85, 'steps_gravel', {gain: -13, pan: -0.05, dist: 0.5, dur: 2.5, fade: 0.3}), // he climbs on
  c(40.7, 'steps_gravel', {gain: -16, pan: 0.1, dist: 0.8, dur: 4.4, rate: 0.85, fade: 0.4}), // the breaker, heavier
  c(43.2, 'steam_vent', {gain: -19, pan: 0.05, dist: 0.7, dur: 0.5, rate: 1.4, fade: 0.15}), // the tank hisses as he hefts it
  c(TD.recognise, 'breath_ragged', {gain: -11, pan: 0.35, dist: 0.08, dur: 1.4, fade: 0.4}), // his breath of recognition
  c(TB2.hand1, 'rubble_shift', {gain: -11, pan: 0.0, dist: 0.65, dur: 0.7, fade: 0.2}), // the breaker's palm on the rubble
  c(TB2.hand1 + 0.05, 'breath_exert', {gain: -14, pan: 0.0, dist: 0.65, dur: 0.6, fade: 0.15}),
  c(TB2.hand1 + 0.3, 'hydraulic', {gain: -20, pan: 0.0, dist: 0.65, rate: 1.5}), // the tank knocks as he pushes up
];

// C4a/C4b — MARCH: the three climb out of the street toward the lens (the pilot nearest, right; the others' steps a
// gravel bed); she stops; the drone: the rotors spin up with a whine, it lifts off her palm and climbs (its bed hums on
// under the rest of the section); the flare carrier and the decoy maker climb past behind her; she goes on up
const C4: Cue[] = [
  ...steps([45.54, 45.8, 46.05, 46.3, 46.57], {gain: -9, pan: 0.3, dist: 0.35}),
  c(45.5, 'breath_exert', {gain: -13, pan: 0.3, dist: 0.35, dur: 0.6, fade: 0.15}),
  c(45.4, 'steps_gravel', {gain: -11, pan: 0.0, dist: 0.6, dur: 4.5, fade: 0.4}),
  c(46.25, 'rubble_shift', {gain: -15, pan: -0.35, dist: 0.6, dur: 0.6, fade: 0.2}),
  c(46.95, 'steps_gravel', {gain: -12, pan: 0.05, dist: 0.4, dur: 0.3, fade: 0.1}), // she stops
  ...steps([47.43, 47.71, 47.98, 48.26, 48.54], {gain: -10, pan: -0.1, dist: 0.45}), // the flare carrier, behind her
  c(47.6, 'cloth_move', {gain: -15, pan: -0.05, dist: 0.45, dur: 0.4, fade: 0.1}), // his satchel swings
  c(TB2.hand2, 'rubble_shift', {gain: -20, pan: -0.6, dist: 0.8, dur: 0.6, fade: 0.2}), // the breaker, off on the crest
  c(T3.spin, 'servo_whir', {gain: -10, pan: 0.05, dist: 0.35, dur: 0.9, rate: 1.6, fade: 0.2}), // the rotors spin up
  c(T3.spin + 0.05, 'ally_drone', {gain: -9, pan: 0.05, dist: 0.35, dur: M.CHARGE + 0.3 - (T3.spin + 0.05), fade: 0.7}),
  c(T3.lift, 'drone_pass', {gain: -11, pan: 0.05, dist: 0.35}), // it lifts off and climbs
  ...steps([48.95, 49.26, 49.56, 49.86], {gain: -11, pan: -0.15, dist: 0.4}), // she goes on up
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

// C6 — ASSEMBLE: the shared turn (he is first: his four steps, then the others' across the crest, left to right as they
// stand in the frame), the hold, the build: he steps forward; the army stirs below, behind the lens
const C6: Cue[] = [
  c(M.ASSEMBLE + 0.05, 'cloth_move', {gain: -12, pan: 0.0, dist: 0.5, dur: 0.6, fade: 0.15}),
  ...steps([53.34, 53.56, 53.78, 54.0], {gain: -9, pan: 0.0, dist: 0.5}),
  ...steps([53.75, 54.2], {gain: -13, pan: 0.55, dist: 0.6}), // tether, runner (right)
  ...steps([53.78, 54.12, 54.45], {gain: -12, pan: -0.3, dist: 0.55}), // breaker
  ...steps([53.83, 54.21, 54.6], {gain: -14, pan: -0.6, dist: 0.6}), // flare carrier
  ...steps([53.91, 54.31, 54.7], {gain: -14, pan: -0.8, dist: 0.6}), // decoy maker
  ...steps([52.6, 52.9], {gain: -15, pan: -0.45, dist: 0.5}), // the drone pilot across the slab (off, left) …
  c(53.2, 'rubble_shift', {gain: -12, pan: -0.1, dist: 0.5, dur: 0.5, fade: 0.15}), // … down off its edge …
  ...steps([53.2, 53.55, 54.65, 55.0], {gain: -11, pan: -0.1, dist: 0.5}), // … to her place; her turn
  c(53.6, 'rubble_shift', {gain: -15, pan: 0.0, dist: 0.6, dur: 1.2, fade: 0.4}),
  c(TD.step - 0.08, 'breath_exert', {gain: -9, pan: 0.0, dist: 0.35, dur: 0.7, fade: 0.2}),
  c(TD.step - 0.3, 'cloth_move', {gain: -12, pan: 0.0, dist: 0.35, dur: 0.5, fade: 0.15}), // the plate comes up
  ...steps([58.08, 58.62], {gain: -6, pan: 0.0, dist: 0.35}), // the step forward
  c(58.25, 'servo_heavy', {gain: -12, pan: 0.0, dist: 0.92, dur: 1.2, fade: 0.4}), // the army stirs (east, behind the lens)
  c(58.95, 'robot_step_heavy', {gain: -11, pan: 0.15, dist: 0.9}),
  c(59.4, 'robot_step_heavy', {gain: -9, pan: -0.1, dist: 0.88}),
  c(59.55, 'breath_exert', {gain: -9, pan: 0.0, dist: 0.45, dur: 0.5, fade: 0.1}), // they draw breath for the charge
];

export const CUES_C: Cue[] = [...C1, ...C2, ...C3, ...C4, ...C5, ...C6];
void TT;
