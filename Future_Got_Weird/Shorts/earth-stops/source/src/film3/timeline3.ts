import V from './voice3.json';

/**
 * V3 whole-film timeline, 30 fps, 24.8 s. Word times are the Test Voice take B (Scribe word starts) placed on the staged film timeline by tools/build_voice_v3.py
 * (sentences cut only at the voice's own pauses; the one lengthened gap is the ocean beat). Everything else in the film hangs off these numbers and the scene frames in T.
 */
export const FPS = 30;
export const fs = (sec: number) => Math.round(sec * FPS);
export const N_FILM = 744;
export const SPEECH = V.words as {text: string; start: number; end: number; seg: string}[];
const w = (i: number) => SPEECH[i].start;
/** the words the picture is hung on (film seconds) */
export const WORD = {
  if: w(0), earth: w(1), stopped: w(2), youd: w(3), keep: w(4), moving: w(5), east: w(6), thousand: w(8), miles: w(9), hour: w(11), equator: w(14),
  loose: w(15), objects: w(16), going: w(18), so: w(20), air: w(23), and: w(24), ocean: w(26),
  you: w(27), dont: w(28), feel: w(29), spin: w(31), because: w(32), move: w(34), withE: w(35), earthB: w(36),
  closer: w(37), poles: w(40), that: w(41), speed: w(43), lower: w(45),
  the: w(46), stop: w(47), imaginary: w(49), motion: w(51), real: w(53),
};
export const GROUPS = V.groups as [number, number][];

/** scene frames */
export const T = {
  // 0: the brake closes on the spinning Earth (contact on "stopped"), the camera dives at the contact point, action cut to the street
  brakeContact: 14, brakeStop: 15, diveA: 15, cutStreet: 20,
  // 20-35: carried east, the lamp post looms, a 5-frame suspended beat, then the cut to the still street
  holdA: 31, holdB: 36, wideA: 36,
  // 36-150: the street stands still and everything that is loose goes east past it
  trackA: 150, trackB: 232, // wind: the camera follows the debris east
  occA: 224, occB: 238, // a torn awning crosses the lens: the cut to the coast hides behind it
  coastA: 238,
  surgeHit: 318, floodA: 336, sprayA: 372, sprayB: 392, // the front hits the pier, overtops the foreground; spray carries the cut
  stageA: 392, stageB: 470, toGlobeA: 470, toGlobeB: 496, // the calm demonstration, then the camera pulls out onto Earth
  latA: 496, latMove0: 508, latMove1: 566, latHold: 592,
  finA: 596, ringA: 604, ringB: 628, caliperA: 698, caliperB: 722, padsA: 726, // back to the opening composition: ring, caliper, pads begin closing
};

/** caption cues: [start frame, end frame, lines of [text, emphasised?][]]. Every cue starts within ~100 ms of its first word and ends before the next starts. */
export type CapSeg = [string, boolean?];
export type Cue = {a: number; b: number; lines: CapSeg[][]; dy?: number};
const f = (s: number) => Math.round(s * FPS);
export const CUES: Cue[] = [
  {a: 0, b: f(1.22) - 1, lines: [[['If Earth']], [['stopped,', true]]]},
  {a: f(1.22), b: f(2.38) - 1, lines: [[['you’d keep']], [['moving '], ['east—', true]]]},
  {a: f(2.38), b: f(3.42) - 1, lines: [[['about a']], [['thousand', true]]]},
  {a: f(3.42), b: f(4.06) - 1, lines: [[['miles an hour']]]},
  {a: f(4.06), b: f(5.14) - 1, lines: [[['at the '], ['equator.', true]]]},
  {a: f(5.16), b: f(7.04) - 1, lines: [[['Loose ', true], ['objects']], [['keep going too.']]]},
  {a: f(7.06), b: f(8.4) - 1, lines: [[['So does the '], ['air.', true]]]},
  {a: f(9.0), b: f(10.3) - 1, lines: [[['And the '], ['ocean.', true]]], dy: -100},
  {a: f(13.0), b: f(14.06) - 1, lines: [[['You don’t ']], [['feel', true], [' the spin']]], dy: -60},
  {a: f(14.07), b: f(15.95) - 1, lines: [[['because you move']], [['with '], ['Earth.', true]]], dy: -60},
  {a: f(16.4), b: f(17.56) - 1, lines: [[['Closer to']], [['the '], ['poles,', true]]]},
  {a: f(17.58), b: f(19.55) - 1, lines: [[['that starting speed']], [['is '], ['lower.', true]]]},
  {a: f(19.78), b: f(21.52) - 1, lines: [[['The stop is']], [['imaginary.', true]]]},
  {a: f(21.54), b: f(23.3) - 1, lines: [[['The motion']], [['is '], ['real.', true]]]},
];
