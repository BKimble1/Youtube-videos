// V2 timing: every beat keyed to a measured word time of the locked narration (../data/timeline.json, unchanged).
import TL from '../data/timeline.json';
import {clamp, ss} from '../lib';

export const FPS = 30;
export const FRAMES: number = TL.frames;
export const DUR: number = TL.duration; // 28.333 s
const words = TL.words as {word: string; start: number; end: number}[];
const norm = (s: string) => s.toLowerCase().replace(/[^a-z']/g, '');
export const w = (word: string, n = 1) => {
  const hits = words.filter((x) => norm(x.word) === word);
  if (!hits[n - 1]) throw new Error('no word ' + word + ' #' + n);
  return hits[n - 1].start;
};
export const T = {
  walk: w('walk'), scientists: w('scientists'), electronics: w('electronics'), every: w('every'),
  fired: w('fired'), // 7.83
  signal: w('signal'),
  theRobot: w('the', 2), // 9.51 "The robot moved."
  moved: w('moved'), but1: w('but', 1), weird: w('weird'), shined: w('shined'), light: w('light'),
  changed: w('changed'), walked: w('walked'), so: w('so'), brain: w('brain'), noEyes: w('no', 2), eyes: w('eyes'),
  absolutely: w('absolutely'), going: w('going'), but2: w('but', 2), controlling: w('controlling'), legs2: w('legs', 2),
  which: w('which'), body: w('body'), end: DUR,
};
// guard against a wrong occurrence index (V1 bug): the times must be in narration order
{
  const order = ['walk', 'scientists', 'electronics', 'every', 'fired', 'signal', 'theRobot', 'moved', 'but1', 'weird', 'shined',
    'light', 'changed', 'walked', 'so', 'brain', 'noEyes', 'eyes', 'absolutely', 'going', 'but2', 'controlling', 'legs2', 'which', 'body'];
  for (let i = 1; i < order.length; i++) if ((T as any)[order[i]] <= (T as any)[order[i - 1]]) throw new Error('T out of order at ' + order[i]);
}

export const SEG = {matchA0: 2.5, matchA1: 2.82, wipe0: 9.28, wipe1: 9.58};

/** One gait event: one detected spike drives one gait cycle (the five legs ripple rear to front). */
export type Kind = 'step' | 'featured' | 'uv' | 'sag' | 'stuck' | 'turn';
export type Ev = {start: number; D: number; w: number; kind: Kind; spike: number; amp: number; yaw: number};
const LAT = 0.12;
/** V4: the followed spike reaches its electrode during "fired an" (seen arriving in the electrode close-up) */
export const FEATURED_SPIKE = 8.05;
const mk = (start: number, kind: Kind = 'step', D = 0.62, wgt = 1, amp = 1, spike?: number, yaw = 0): Ev =>
  ({start, D, w: wgt, kind, spike: spike ?? start - LAT, amp, yaw});
const UVS = [13.07, 13.5, 13.93, 14.36, 14.79, 15.22, 15.65, 16.08];
const BASE: Ev[] = [
  mk(-0.03),
  mk(0.97), mk(1.97), mk(3.02), mk(4.07), mk(5.12), mk(6.0), mk(7.07),
  mk(9.25, 'featured', 0.85, 1.0, 1, FEATURED_SPIKE), // the spike followed into the electrode (8.05) and down the chain
  mk(10.75), mk(12.25), // baseline: slow single spikes (12.13 is seen in the close-up just before the lamp)
  ...UVS.map((s) => mk(s, 'uv', 0.43, 1.0, 1.8)), // under UV: spikes larger and about twice as frequent
  mk(16.98),
  mk(T.brain - 0.1, 'sag', 1.0, 0.3), // the soft legs give: the body sags and recovers
  mk(18.88),
  mk(19.58, 'stuck', 0.6, 0, 1, undefined, 0.36), // marching in place, turning left
  mk(20.28, 'stuck', 0.6, 0, 1, undefined, -0.62), // ...then right
  mk(20.98, 'turn', 0.66, 1, 1, undefined, 0.26), // ...then off it goes
  mk(21.78), mk(22.54), mk(23.3), mk(24.06), mk(24.82), mk(25.62), mk(26.42),
  mk(27.22, 'step', 0.66),
];
for (let i = 1; i < BASE.length; i++) if (BASE[i].start <= BASE[i - 1].start + 0.3) throw new Error('EVENTS too close/out of order at ' + i);
if (Math.abs(BASE.reduce((a, e) => a + e.yaw, 0)) > 1e-9) throw new Error('yaw offsets must cancel over the loop');
export const EVENTS: Ev[] = BASE;
export const EVENTS_EXT: Ev[] = [...BASE.map((e) => ({...e, start: e.start - DUR, spike: e.spike - DUR})), ...BASE,
  ...BASE.map((e) => ({...e, start: e.start + DUR, spike: e.spike + DUR}))];
export const LEG_ORDER = [2, 3, 1, 4, 0];
export const LEG_OFF = [0, 0.1, 0.22, 0.32, 0.44];
export const SWING = 0.5;
/** swing duration as a fraction of the event: under UV the events are short (0.43 s), so each leg's swing is a larger
 * fraction of it (>= 0.26 s), never a flick */
export const swingFrac = (kind: Kind) => (kind === 'uv' ? 0.6 : SWING);
/** start of leg i's swing within an event, as a fraction of D. Baseline: a rear-to-front ripple, one leg at a time.
 * Under UV (stronger, more frequent spikes): the same legs in pairs (rear pair, side pair, front), so the gait is
 * visibly different as well as faster (illustrative; the paper reports a gait change, see SCIENCE_NOTES). */
export const legPhase = (kind: Kind, i: number) => {
  if (kind === 'uv') return i === 2 || i === 3 ? 0 : i === 1 || i === 4 ? 0.17 : 0.34; // + swing 0.6: the last pair lands at 0.94, before the next spike's step
  return LEG_OFF[LEG_ORDER.indexOf(i)];
};

export const spikeTrace = (t: number) => {
  let v = 0;
  for (const e of EVENTS_EXT) {
    const dt = t - e.spike;
    if (dt > -0.05 && dt < 0.6) {
      const x = dt / 0.07;
      v += e.amp * (dt < 0 ? 0 : x * Math.exp(1 - x)) - 0.18 * e.amp * Math.exp(-((dt - 0.3) ** 2) / 0.01);
    }
  }
  return v;
};
export const UV = {swingIn0: T.weird - 0.05, swingIn1: 12.35, on: T.shined + 0.02, off: 16.5, swingOut1: 16.9};
export const uvOn = (t: number) => clamp((t - UV.on) / 0.06) * (1 - clamp((t - UV.off) / 0.12));
export const lampIn = (t: number) => ss(UV.swingIn0, UV.swingIn1, t) * (1 - ss(UV.off + 0.05, UV.swingOut1, t));
