// HOOK 07 timeline: every event time lives here (mirrored in tools/audio/h07.py).
import WORDS from '../data/h07_words.json';
import {clamp, keyCR, sm, ss, Words, wordAt} from '../shared/lib';

export const W = WORDS as Words;
const wBeating = wordAt(W, 'beating').start; // 1.65
const wEven = wordAt(W, 'even').start; // 2.40
const wRemoved = wordAt(W, 'removed').start; // 3.17
export const SPEECH_END = W.speech_end; // 4.29

/** ventricular contraction onsets: about 79 bpm, one beat lands on "beating"; the last one, after the narration,
 *  is the deliberate strong closing beat. */
export const PERIOD = 0.76;
export const BEATS = Array.from({length: 8}, (_, i) => +(wBeating - 0.08 + (i - 2) * PERIOD).toFixed(3));
export const BEAT_K = [0.92, 0.95, 1.0, 0.92, 0.95, 0.92, 0.95, 1.38];
export const FINAL_BEAT = BEATS[7]; // 5.37

/** cross-section window */
export const WIN_OPEN: [number, number] = [wEven + 0.08, wEven + 0.78]; // 2.48 .. 3.18
export const WIN_CLOSE: [number, number] = [SPEECH_END + 0.04, SPEECH_END + 0.62]; // 4.33 .. 4.91
/** perfusion story inside the window: the fresh bolus enters the aorta, turns into the coronaries, blushes the muscle,
 *  then dark venous blood returns through the right heart */
export const FLOW_AORTA = wEven + 0.2; // 2.60
export const FLOW_COR = wEven + 0.55; // 2.95
export const PERFUSE = wRemoved + 0.05; // 3.22
export const VENOUS = wRemoved + 0.25; // 3.42

/** one systole (0..1..0) with a small diastolic overfill afterwards */
const sys = (tau: number) => {
  if (tau < 0) return 0;
  if (tau < 0.13) {
    const x = tau / 0.13;
    return 1 - (1 - x) * (1 - x);
  }
  if (tau < 0.24) return 1 - 0.06 * ((tau - 0.13) / 0.11);
  if (tau < 0.52) return 0.94 * (1 - sm((tau - 0.24) / 0.28));
  return -0.07 * Math.sin(Math.PI * clamp((tau - 0.52) / 0.22));
};
/** ventricular contraction state s(t) (about -0.1..1.4) */
export const vent = (t: number) => {
  let s = 0;
  BEATS.forEach((b, i) => {
    const tau = t - b;
    if (tau > -0.01 && tau < PERIOD + 0.1) s += BEAT_K[i] * sys(tau);
  });
  // before the first beat the heart is in late diastole (atria just kicked)
  return s;
};
/** atrial kick just before each ventricular beat */
export const atr = (t: number) => {
  let a = 0;
  [...BEATS, BEATS[0] - PERIOD].forEach((b) => {
    const tau = t - b;
    a += Math.exp(-(((tau + 0.11) / 0.055) ** 2));
  });
  return a;
};
/** perfusion pressure from the pulsatile pump (peaks just after systole relaxes: coronary flow is diastolic) */
export const press = (t: number) => {
  let p = 0;
  BEATS.forEach((b, i) => {
    const tau = t - b;
    if (tau > 0 && tau < 0.9) p += (i === 7 ? 1.3 : 1) * Math.exp(-(((tau - 0.38) / 0.16) ** 2));
  });
  return p;
};
/** diastolic flow gate (0..1): flow through the coronaries runs mostly while the muscle relaxes */
export const coronaryFlow = (t: number) => 0.35 + 0.65 * clamp(1 - vent(t));

/** camera: zoom and centre (world px). Close on the heart -> pull back to the machine -> push into the section ->
 *  pull back out wide, still drifting at the last frame. */
const ZK: [number, number][] = [
  [0, 1.8], [1.0, 1.68], [2.3, 1.04], [3.5, 1.76], [4.1, 1.82], [5.45, 1.1], [6.0, 1.065], [6.6, 1.03],
];
const XK: [number, number][] = [
  [0, 528], [1.0, 530], [2.3, 540], [3.5, 520], [4.1, 518], [5.45, 538], [6.0, 542], [6.6, 546],
];
const YK: [number, number][] = [
  [0, 742], [1.0, 748], [2.3, 975], [3.5, 712], [4.1, 704], [5.45, 966], [6.0, 984], [6.6, 1000],
];
export const cam = (t: number) => {
  const kick = 1 + 0.007 * Math.max(0, vent(t) - 1.0) * ss(t, FINAL_BEAT - 0.05, FINAL_BEAT);
  return {z: keyCR(t, ZK) * kick, x: keyCR(t, XK), y: keyCR(t, YK)};
};

/** cut-window radius 0..1 */
export const winR = (t: number) => {
  const o = ss(t, WIN_OPEN[0], WIN_OPEN[1]);
  const c = ss(t, WIN_CLOSE[0], WIN_CLOSE[1]);
  return o * (1 - c);
};

/** pump surges travelling up the arterial line (0..1 along the line from the oxygenator to the aortic port) */
export const surges = (t: number) =>
  BEATS.map((b, i) => {
    const u = (t - (b - 0.04)) / (i === 7 ? 0.5 : 0.45);
    return {u, a: (i === 7 ? 1 : 0.4) * Math.sin(Math.PI * clamp(u))};
  }).filter((q) => q.u > 0 && q.u < 1);
