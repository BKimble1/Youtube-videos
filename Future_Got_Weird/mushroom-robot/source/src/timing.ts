// Every beat is keyed to a measured word time of the locked narration (data/timeline.json, measured on the master).
import TL from './data/timeline.json';
import {clamp, ss} from './lib';

export const FPS = 30;
export const FRAMES: number = TL.frames;
export const DUR: number = TL.duration; // 28.333 s
const words = TL.words as {word: string; start: number; end: number}[];
/** start time of the n-th occurrence (1-based) of a word (punctuation ignored) */
export const w = (word: string, n = 1) => {
  const hits = words.filter((x) => x.word.toLowerCase().replace(/[^a-z']/g, '') === word);
  if (!hits[n - 1]) throw new Error('no word ' + word + ' #' + n);
  return hits[n - 1].start;
};
export const wEnd = (word: string, n = 1) => {
  const hits = words.filter((x) => x.word.toLowerCase().replace(/[^a-z']/g, '') === word);
  return hits[n - 1].end;
};

export const T = {
  walk: w('walk'), // 2.92
  scientists: w('scientists'), // 3.43
  grew: w('grew'),
  living: w('living'),
  electronics: w('electronics'), // 5.78
  every: w('every'), // 6.75
  fired: w('fired'), // 7.83
  signal: w('signal'), // 8.79
  theRobot: w('the', 2), // 9.51 "The robot moved."
  moved: w('moved'), // 10.13
  but1: w('but', 1), // 10.77
  weird: w('weird'), // 11.84
  shined: w('shined'), // 12.49
  ultraviolet: w('ultraviolet'),
  light: w('light'), // 13.61
  changed: w('changed'), // 15.32
  walked: w('walked'), // 16.09
  so: w('so'), // 16.56
  brain: w('brain'), // 18.02
  noEyes: w('no', 2), // 18.58
  eyes: w('eyes'), // 18.84
  absolutely: w('absolutely'), // 19.46
  going: w('going'), // 21.38
  but2: w('but', 2), // 21.90
  mushroom2: w('mushroom', 2), // 22.05
  literally: w('literally'),
  controlling: w('controlling'), // 23.36
  legs2: w('legs', 2), // 24.20
  which: w('which'), // 24.78
  gave: w('gave'),
  fungus4: w('fungus', 4), // 26.68
  body: w('body'), // 27.41
  end: DUR,
};

// ------------------------------------------------------------------------------------------------ the film's blocks
/** world A (the robot) and world B (the macro interface / signal chain) */
export const SEG = {
  matchA0: 2.5, // dissolve on identical mycelium topology: A -> B
  matchA1: 2.82,
  wipe0: 9.28, // the foreground air tube sweeps across the lens: B -> A
  wipe1: 9.58,
};

// ------------------------------------------------------------------------------------------------ fungus spikes and gait
/** A step event: the CPG-style controller turns one detected spike into one gait cycle (the five legs actuate in a
 * rear-to-front ripple). `w` is how far the event moves the body (in strides). */
export type Kind = 'step' | 'featured' | 'uv' | 'splat' | 'bonk' | 'stuck' | 'turn';
export type Ev = {start: number; D: number; w: number; kind: Kind; spike: number; amp: number};
const LAT = 0.12; // spike -> actuation latency (illustrative)
const mk = (start: number, kind: Kind = 'step', D = 0.62, wgt = 1, amp = 1, spike?: number): Ev =>
  ({start, D, w: wgt, kind, spike: spike ?? start - LAT, amp});

const UVS = [13.07, 13.5, 13.92, 14.33, 14.74, 15.14, 15.54, 15.94];
const BASE: Ev[] = [
  mk(-0.03),
  mk(0.97), mk(1.97), mk(3.02), mk(4.07), mk(5.12), mk(6.0), mk(6.95 + LAT),
  // the featured spike: fired at "fired" (7.83); we follow it down the signal chain (slowed, world B) and the leg it
  // drives inflates as world A returns
  mk(T.theRobot - 0.0, 'featured', 0.95, 1.1, 1, T.fired),
  mk(10.87), mk(11.87),
  ...UVS.map((s) => mk(s, 'uv', 0.4, 1.3, 1.9)),
  mk(16.95),
  mk(T.brain - 0.1, 'splat', 1.05, 0.4),
  mk(18.62, 'bonk', 0.62, 1),
  mk(19.42, 'stuck', 0.55, 0), mk(20.12, 'stuck', 0.55, 0),
  mk(20.85, 'turn', 0.7, 1),
  mk(21.72), mk(22.5), mk(23.27), mk(24.04), mk(24.82), mk(25.62), mk(26.42),
  mk(27.22, 'step', 0.66, 1), // the last full step lands on "body"
];
// one period: the event at -0.03 is the same event as the one at DUR - 0.03 (the loop)
export const EVENTS: Ev[] = BASE;
export const EVENTS_EXT: Ev[] = [...BASE.map((e) => ({...e, start: e.start - DUR, spike: e.spike - DUR})), ...BASE,
  ...BASE.map((e) => ({...e, start: e.start + DUR, spike: e.spike + DUR}))];
export const BONK_FRAC = 0.42; // the bonk step's progress stops here: the front leg meets the box

/** Leg ripple: order and offsets (fraction of D) of the five legs; leg i sits at heading + i*72 deg (0 = front). */
export const LEG_ORDER = [2, 3, 1, 4, 0];
export const LEG_OFF = [0, 0.1, 0.22, 0.32, 0.44];
export const SWING = 0.5; // swing duration as a fraction of D

/** spike amplitude seen at the electrodes (for the trace and the glow) */
export const spikeTrace = (t: number) => {
  let v = 0;
  for (const e of EVENTS_EXT) {
    const dt = t - e.spike;
    if (dt > -0.05 && dt < 0.6) {
      // a fast rise and a slower fall, a small undershoot
      const x = dt / 0.07;
      v += e.amp * (dt < 0 ? 0 : x * Math.exp(1 - x)) - 0.18 * e.amp * Math.exp(-((dt - 0.3) ** 2) / 0.01);
    }
  }
  return v;
};

// ------------------------------------------------------------------------------------------------ UV lamp
export const UV = {
  swingIn0: T.but1 + 0.05, swingIn1: T.weird + 0.25,
  on: T.shined + 0.02, // click on
  off: 16.22, swingOut1: 16.9,
};
export const uvOn = (t: number) => clamp((t - UV.on) / 0.06) * (1 - clamp((t - UV.off) / 0.12));
export const lampIn = (t: number) => ss(UV.swingIn0, UV.swingIn1, t) * (1 - ss(UV.off + 0.05, UV.swingOut1, t));
// guard: events must be in time order (the leg lookup relies on it)
for (let i = 1; i < BASE.length; i++) if (BASE[i].start <= BASE[i - 1].start) throw new Error('EVENTS out of order at ' + i);
