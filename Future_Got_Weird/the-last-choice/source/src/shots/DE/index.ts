// Shot group DE: components keyed by shot id (see src/film/timing.ts) and their sound cues.
import React from 'react';
import {Cue, at} from '../../film/cue';
import {M, shot} from '../../film/timing';
import D1 from './D1';
import D2 from './D2';
import D3 from './D3';
import D4 from './D4';
import D5 from './D5';
import E1 from './E1';
import E2 from './E2';
import E3 from './E3';
import E4 from './E4';
import E5 from './E5';
import E6 from './E6';
import E7 from './E7';
import T1 from './T1';

export const SHOTS_DE: Record<string, React.FC> = {D1, D2, D3, D4, D5, E1, E2, E3, E4, E5, E6, E7, T1};

// ---------------------------------------------------------------- sound (physical sounds only; the radio's speaker
// colour and its opening to full range at M.OPEN_FULL are in the music stem)
const d1 = at(shot('D1').start), d2 = at(shot('D2').start), d3 = at(shot('D3').start), d4 = at(shot('D4').start);
const e1 = at(shot('E1').start), e2 = at(shot('E2').start), e3 = at(shot('E3').start), e4 = at(shot('E4').start);
const e5 = at(shot('E5').start), e6 = at(shot('E6').start);
// the monitor's soft pulse: through D2 and D3 (off screen in D3); it stops as the attendant stops in D4 (≈ +0.4 s)
const pulse: Cue[] = [];
for (let tt = shot('D2').start + 0.25; tt < shot('D4').start + 0.4; tt += 0.92) {
  const inD3 = tt >= shot('D3').start && tt < shot('D4').start;
  pulse.push({t: tt, kind: 'projector_beep', gain: inD3 ? -10 : -6, pan: -0.3, dist: inD3 ? 0.5 : 0.35, rate: 0.82});
}
export const CUES_DE: Cue[] = [
  // D1 — the doors open on the final hit; attendants glide out; the carriers' breath
  d1(0.0, 'glass_door', {gain: 0, dist: 0.25}),
  d1(0.15, 'breath_exert', {gain: -8, dur: 2.6, fade: 0.6, dist: 0.3}),
  d1(0.6, 'servo_whir', {gain: -6, pan: 0.15, dist: 0.3}),
  d1(1.0, 'servo_whir', {gain: -8, pan: -0.45, dist: 0.35, rate: 0.9}),
  d1(1.7, 'servo_whir', {gain: -9, pan: 0.45, dist: 0.35, rate: 1.1}),
  // D2 — the friend's breathing; the visor lands on the floor (a light tap)
  d2(0.0, 'breath_ragged', {gain: -6, dur: 6.0, fade: 1.2, dist: 0.1, pan: -0.15}),
  d2(2.22, 'hand_glass', {gain: -12, rate: 1.9, pan: -0.35, dist: 0.2}),
  ...pulse,
  // D3 — the last breaths fade as the grip lets go
  d3(1.2, 'breath_ragged', {gain: -12, dur: 1.4, fade: 0.7, dist: 0.15, rate: 0.95}),
  // D4 — near silence: room tone only (the global refuge bed); the pulse above stops as the attendant stops
  // D5 — the radio: the switch on M.RADIO_CLICK, static and tuning until the song comes through (M.L_IN)
  {t: M.RADIO_CLICK, kind: 'radio_on', gain: 0, pan: -0.15, dist: 0.05, dur: M.L_IN - M.RADIO_CLICK + 0.35, fade: 0.35},
  {t: M.RADIO_CLICK + 0.75, kind: 'static', gain: -8, pan: -0.15, dist: 0.05, dur: 0.6, fade: 0.25},
  // E1 — the doors close, the outer shutter lowers and locks; a patrol drone passes outside
  e1(0.3, 'glass_door', {gain: -2, dist: 0.3, rate: 0.95}),
  e1(1.5, 'shutter_close', {gain: -3, dist: 0.5, dur: 2.2, fade: 0.3}),
  e1(3.45, 'padlock', {gain: -5, dist: 0.4}),
  e1(0.6, 'drone_rotor', {gain: -8, pan: 0.7, dist: 0.7, dur: 2.2, fade: 0.8}),
  e1(2.6, 'drone_rotor', {gain: -8, pan: -0.5, dist: 0.7, dur: 2.0, fade: 0.8}),
  // E2 — no answer from the sensor (silence); an attendant glides over; wardens pass outside, muffled by the glass
  e2(3.6, 'servo_whir', {gain: -10, pan: -0.4, dist: 0.3, rate: 0.9}),
  ...[3.6, 4.3, 5.0, 5.7, 6.3].map((tt, i) => e2(tt, 'robot_step', {gain: -13, pan: 0.6 - i * 0.18, dist: 0.8})),
  // E3 — the service bot: arrives, reaches, lifts, moves the hand aside, straightens the chair, moves on
  e3(2.3, 'servo_whir', {gain: -11, pan: -0.5, dist: 0.25, rate: 1.1}),
  e3(3.75, 'servo_whir', {gain: -12, pan: 0, dist: 0.2, rate: 1.25}),
  e3(5.45, 'servo_whir', {gain: -13, pan: 0, dist: 0.2, rate: 1.2}),
  e3(8.0, 'servo_whir', {gain: -12, pan: 0.5, dist: 0.3, rate: 1.05}),
  // E4 — a meal arrives; the locker locks; far-off reconstruction
  e4(0.3, 'servo_whir', {gain: -13, pan: -0.6, dist: 0.35}),
  e4(4.6, 'padlock', {gain: -6, pan: 0.55, dist: 0.3}),
  e4(0.8, 'crane_trolley', {gain: -12, pan: -0.2, dist: 0.9, dur: 5.5, fade: 1.5}),
  e4(3.4, 'crane_chain', {gain: -15, pan: -0.2, dist: 0.95}),
  // E5 — the hand meets the glass
  e5(4.6, 'hand_glass', {gain: 0, pan: 0.1, dist: 0.0}),
  // E6 — the waterfront: a distant patrol
  e6(0.9, 'drone_rotor', {gain: -12, pan: 0.3, dist: 0.9, dur: 4.2, fade: 1.4}),
];
