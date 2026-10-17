// Rocket Short ("The Problem With Tesla's Rocket Car"): narration cues and the film's key times.
// Word times come from source/src/data/rocket_words.json (tools/build_rocket_narration.py): the Test Voice take with its
// pauses tightened, three re-recorded lines spliced in, and its sentences placed on the timeline. `b` is the sentence
// index (0-14). Times are from an independent transcription of the placed narration (audio/rocket/scribe/placed_verify_fp.json).
import data from '../data/rocket_words.json';

export const FPS = 30;
export type Word = {w: string; s: number; e: number; b: number};
export const words = data.words as Word[];
const norm = (s: string) => s.replace(/[.,?!]+$/, '').toLowerCase();

/** Start (or end) of the n-th occurrence of `w`, optionally inside sentence `b`. */
export const cue = (w: string, b?: number, n = 0, end = false): number => {
  const hits = words.filter((x) => norm(x.w) === norm(w) && (b === undefined || x.b === b));
  if (!hits[n]) throw new Error(`cue not found: ${w} ${b ?? ''} ${n}`);
  return end ? hits[n].e : hits[n].s;
};

// ---------------------------------------------------------------- film structure
/** Opening: Tesla's side replay of the hop (rk_hop.mp4 starts at rec_224911 0:34.20), one continuous camera. */
export const HOP_FILE0 = 34.2;
export const OPEN_SRC = 35.25;                         // rec_224911 time on frame 0: climbing on its jets
export const srcAt = (t: number) => OPEN_SRC + t;      // the opening plays at the recording's own speed
/** The match into the drawing happens at fixed replay frames, next to 0:38.50 (the frame the trace was drawn from). */
const MATCH_SRC = 38.587, SWAP_SRC = 38.707, PRE_SRC = 38.19;

/** Payoff: the second ramp run from the air (rk_aerial.mp4 starts at rec_224730 2:19.80). */
export const AER_FILE0 = 139.8;
export const AER_TOUCH = 144.3;                        // touchdown in smoke, rec_224730 2:24.3
export const AER_LAST = 146.733;                       // last frame before the broadcast's cut (2:26.75)

export const T = {
  pre: PRE_SRC - OPEN_SRC,                             // gas-flow chevrons on the real jets (upright on four jets)
  match: MATCH_SRC - OPEN_SRC,                         // drawn outline over the real car (fixed to the replay frame)
  swap: SWAP_SRC - OPEN_SRC,                           // drawn car replaces the footage
  endless: cue('endless', 1),
  jets: cue('These', 2), blast: cue('blast', 2), compressed: cue('compressed', 2), air: cue('air', 2),
  every: cue('Every', 3), burst: cue('burst', 3), up: cue('up', 3), upEnd: cue('up', 3, 0, true),
  hovering: cue('Hovering', 4), pushing: cue('pushing', 4), entire: cue('entire', 4), weight: cue('weight', 4),
  weightEnd: cue('weight', 4, 0, true),
  bigger: cue('Bigger', 5), time: cue('time', 5), add: cue('add', 5), weight2: cue('weight', 5),
  protection: cue('protection', 5), protectionEnd: cue('protection', 5, 0, true),
  then: cue('Then', 6), balance: cue('balance', 6),
  thrust3: cue('Thrust', 7), misses: cue('misses', 7), center: cue('center', 7), mass: cue('mass', 7),
  rotate: cue('rotate', 7),
  other: cue('Other', 8), thrusters: cue('thrusters', 8), correct: cue('correct', 8), but8: cue('but', 8),
  corrections: cue('corrections', 8), air2: cue('air', 8), too: cue('too', 8), tooEnd: cue('too', 8, 0, true),
  and: cue('And', 9), fire: cue('fire', 9), jet: cue('jet', 9), loose: cue('loose', 9), gravel: cue('gravel', 9),
  blast2: cue('blast', 10), debris: cue('debris', 10), flying: cue('flying', 10),
  none: cue('None', 11), physics: cue('physics', 11),
  gives: cue('gives', 12), spacecraft: cue('spacecraft', 12), problems: cue('problems', 12),
  also: cue('It', 13), drives: cue('drives', 13), upside: cue('upside', 13), downEnd: cue('down', 13, 0, true),
  tap: cue('Tap', 14), breakdown: cue('breakdown', 14),
};

/** The dust from the gravel crosses the frame here and the real aerial takes over. */
export const WIPE = cue('flying', 10, 0, true) + 0.2;
/** The real touchdown (2:24.3) lands just after "problems". */
export const TOUCH_T = cue('problems', 12, 0, true) + 0.16;
export const AER_IN = AER_TOUCH - (TOUCH_T - WIPE);    // rec_224730 time when the aerial appears
/** The CTA. "It also drives" over the second run driving along the underside of the ramp, from the air (rk_inv.mp4
 *  starts at rec_224730 2:16.30; used 2:16.60-2:17.45, after the broadcast's dissolve and before any exhaust shows
 *  near the car), then "upside down. Tap the linked breakdown." over the first run's hang from below (rk_hang.mp4
 *  starts at rec_224730 1:17.20; used 1:17.50 up to Tesla's cut at 1:19.90). Both at the recording's own speed. */
export const INV_T = T.also - 0.08;                    // cut from the landing to the inverted run
export const INV_FILE0 = 136.3, INV_SRC = 136.6;       // rec_224730 time at INV_T
export const HANG_T = INV_T + 0.85;                    // cut to the hang close-up
export const HANG_FILE0 = 77.2, HANG_SRC = 77.5;       // rec_224730 time at HANG_T
export const HANG_LAST = 79.87;                        // last frame before Tesla's cut
/** The film ends on the hang, 0.38 s after the last word; the CTA cue clears 0.4 s before that. */
export const DURATION = Math.round((words[words.length - 1].e + 0.38) * FPS) / FPS;
export const FRAMES = Math.round(DURATION * FPS);
if (HANG_SRC + (DURATION - HANG_T) > HANG_LAST + 0.02) throw new Error('the hang close-up would run past Tesla\'s cut');
if (AER_IN + (INV_T - WIPE) > AER_LAST) throw new Error('the aerial would run past its last frame');

/** Caption phrase groups (words per plate) and the words given restrained emphasis. */
export const PHRASES = [4, 4, 2, 3, 2, 2, 3, 3, 3, 2, 2, 4, 3, 3, 3, 3, 4, 4, 2, 3, 3, 3, 4, 3, 4, 2, 3, 2, 5, 2, 3, 2, 4];
export const EMPHASIS: [string, number, string][] = [['air', 2, '#3F74D0'], ['weight', 4, '#3A4A52'], ['balance', 6, '#C98A0C']];
