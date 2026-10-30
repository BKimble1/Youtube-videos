// HOOK 06 timeline: every event time lives here (word-synced from h06_words.json) and is mirrored in
// tools/audio/h06.py, which recomputes the same formulas from the same words file.
import WORDS from '../data/h06_words.json';
import {Words, wordAt} from '../shared/lib';

export const WD = WORDS as Words;
const w = (s: string, n = 0) => wordAt(WD, s, n);

const birds = w('birds').start; // 4.04
export const EV = {
  pushStart: w('turns').start, // 1.02  camera starts moving in on the eyestalk
  pushEnd: w('eyestalk').end, // 2.46  arrives close on "eyestalk"
  cutOpen: w('into').start, // 2.47  the cut window starts to open
  cutFull: w('pulsing').start + 0.12, // 2.91  window fully open on "pulsing"
  lure: w('lure').start, // 3.39  strongest pumping wave passes through the window
  birdHop1: birds - 0.06, // 3.98  robin hops onto the twig in the background (off frame -> edge)
  birdHop2: birds + 0.30, // 4.34  second hop brings it into view
  pullStart: birds + 0.08, // 4.12  camera starts the pull-back
  cutClose: birds + 0.12, // 4.16  window closes during the pull-back
  notice: birds + 0.80, // 4.84  robin's head turns toward the eyestalk
  blink: birds + 1.10, // 5.14  quick blink / eye focus
  birdHop3: birds + 1.36, // 5.40  hop closer
  end: 6.0,
};
export const HOP = 0.26; // hop duration (s)

// Broodsac pulsation: one contraction wave per beat, beats at PULSE_T0 + k / PULSE_F (about 63 per minute).
export const PULSE_F = 1.05;
export const PULSE_T0 = w('pulsing').start; // a beat lands on "pulsing"
export const beatPhase = (t: number) => {
  const x = (t - PULSE_T0) * PULSE_F;
  return x - Math.floor(x); // 0 at each beat
};
/** sharp contraction envelope after each beat (0..1) */
export const beatEnv = (t: number) => {
  const x = beatPhase(t);
  return x < 0.1 ? Math.sin((x / 0.1) * Math.PI / 2) : Math.exp(-(x - 0.1) / 0.22);
};
