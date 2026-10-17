// Rocket Short ("The Problem With Tesla's Rocket Car"): narration cues and the film's key times.
// Word times come from source/src/data/rocket_words.json (tools/build_rocket_narration.py): the Test Voice take with its
// pauses tightened and its sentences placed on the timeline. `b` is the sentence index (0-13).
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

/** Return: the second ramp run from the air (rk_aerial.mp4 starts at rec_224730 2:19.80). */
export const AER_FILE0 = 139.8;
export const AER_TOUCH = 144.3;                        // touchdown in smoke, rec_224730 2:24.3
export const AER_LAST = 146.733;                       // last frame before the broadcast's cut (2:26.75)

export const T = {
  catch: cue('catch', 1),                              // gas-flow overlay on the real jets
  match: cue('catch', 1) + 0.24,                       // drawn outline over the real car
  swap: cue('catch', 1) + 0.36,                        // drawn car replaces the footage
  jets: cue('These', 2), blast: cue('blast', 2), compressed: cue('compressed', 2), air: cue('air', 2),
  every: cue('Every', 3), burst: cue('burst', 3), up: cue('up', 3),
  keeping: cue('Keeping', 4), airborne: cue('airborne', 4), thrust: cue('thrust', 4), pushing: cue('pushing', 4),
  entire: cue('entire', 4), weight: cue('weight', 4),
  bigger: cue('Bigger', 5), time: cue('time', 5), add: cue('add', 5), weight2: cue('weight', 5),
  protection: cue('protection', 5),
  then: cue('Then', 6), balance: cue('balance', 6),
  thrust3: cue('Thrust', 7), misses: cue('misses', 7), center: cue('center', 7), mass: cue('mass', 7),
  rotate: cue('rotate', 7),
  other: cue('Other', 8), thrusters: cue('thrusters', 8), correct: cue('correct', 8), corrections: cue('corrections', 8),
  air2: cue('air', 8), too: cue('too', 8),
  fire: cue('fire', 9), jet: cue('jet', 9), loose: cue('loose', 9), gravel: cue('gravel', 9),
  blast2: cue('blast', 10), debris: cue('debris', 10), flying: cue('flying', 10),
  none: cue('None', 11), physics: cue('physics', 11),
  gives: cue('gives', 12), spacecraft: cue('spacecraft', 12), problems: cue('problems', 12),
  full: cue('Full', 13), video: cue('video', 13),
};

/** The dust cloud covers the frame here and the real aerial takes over. */
export const WIPE = cue('flying', 10) + 0.62;
/** The real touchdown (2:24.3) lands just after "problems". */
export const TOUCH_T = cue('problems', 12, 0, true) + 0.16;
export const AER_IN = AER_TOUCH - (TOUCH_T - WIPE);    // rec_224730 time when the aerial appears
export const DURATION = Math.floor((TOUCH_T + (AER_LAST - AER_TOUCH)) * FPS) / FPS;
export const FRAMES = Math.round(DURATION * FPS);
/** Loop bridge: the last 0.80 s is the same replay's lift-off (rec_224911 0:34.45-0:35.22), which runs straight into
 *  frame 0 (0:35.25): the loop is one continuous shot. */
export const LOOP_SRC = 34.45;
export const LOOP_T = DURATION - (OPEN_SRC - LOOP_SRC);

/** Caption phrase groups (words per plate) and the words given restrained emphasis. */
export const PHRASES = [4, 3, 4, 3, 2, 2, 3, 4, 4, 4, 2, 4, 3, 3, 3, 3, 4, 4, 2, 3, 3, 3, 4, 3, 2, 4, 3, 2, 5, 2, 3, 4];
export const EMPHASIS: [string, number, string][] = [['air', 2, '#3F74D0'], ['weight', 4, '#3A4A52'], ['balance', 6, '#C98A0C']];
