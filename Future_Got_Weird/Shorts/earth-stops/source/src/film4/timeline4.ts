import V from './voice4.json';

/**
 * V4 whole-film timeline, 30 fps, 20.5 s. Word times are the Test Voice take A of the 64-word V4 script (Scribe word starts) with its long between-phrase pauses shortened by
 * tools/build_voice_v4.py (only silence is removed; nothing inside a word is touched). Every picture event hangs off these numbers and the scene frames in T.
 */
export const FPS = 30;
export const fs = (sec: number) => Math.round(sec * FPS);
export const N_FILM = 615;
export const SPEECH = V.words as {text: string; start: number; end: number}[];
const w = (i: number) => SPEECH[i].start;
/** the words the picture is hung on (film seconds) */
export const WORD = {
  if: w(0), earth: w(1), stopped: w(2), youd: w(3), keep: w(4), moving: w(5), east: w(6), about: w(7), thousand: w(9), miles: w(10), hour: w(12), equator: w(15),
  loose: w(16), objects: w(17), going: w(19), so: w(21), air: w(24), driving: w(25), debris: w(26), streets: w(29),
  and: w(30), ocean: w(32), keeps: w(33), into: w(35), coast: w(37),
  you: w(38), dont: w(39), feel: w(40), spin: w(42), because: w(43), you2: w(44), move: w(45), withE: w(46), earthB: w(47),
  closer: w(48), poles: w(51), that: w(52), speed: w(54), lower: w(56),
  the: w(57), stop: w(58), imaginary: w(60), motion: w(62), real: w(64),
};
export const GROUPS = V.groups as [number, number][];

/** scene frames */
export const T = {
  // 0: the pads close on the turning Earth and lock on "stopped"; the camera dives at the contact point; action cut to the street
  brakeContact: 14, brakeStop: 15, diveA: 15, cutStreet: 20,
  // 20-48: she is carried east: stumble, feet leave the ground, fear grows as the pole looms; cut away before contact
  dangerEnd: 48, wideA: 48,
  // 48-182: the street stands still and the loose things go east past it
  windA: 128, windB: 190,
  trackA: 182,
  // wind: the camera follows the debris east; the shop awning strains, tears, flies at the lens; the cut to the coast hides behind it
  awnStrain: 196, awnTear: 236, awnFree: 248,
  // coast: a swell grows from the left (visible from ~285), the boat rides its front face, the crest reaches the boat and the pier's middle post on "coast" (336), the lip breaks (capsize),
  // post 2 snaps and takes a deck section (342); the aftermath registers (336-356); a flood rises through the frame (354-362), covers it for a moment, and drains away (362-384)
  coastA: 259, swellA: 280, hitBoat: 335, surgeHit: 336, postBreak: 338, deckGo: 342, floodA: 354, floodB: 362, drainA: 362, drainB: 384,
  stageA: 362, stageB: 414, toGlobeA: 414, toGlobeB: 436,
  latA: 436, latMove0: 448, latMove1: 496, finA: 500, ringA: 524, ringB: 548, caliperA: 548, caliperB: 574, padsA: 575,
};

/** caption cues: [start frame, end frame, lines of [text, emphasised?][]]. Every cue starts within ~100 ms of its first word and ends before the next starts. */
export type CapSeg = [string, boolean?];
export type Cue = {a: number; b: number; lines: CapSeg[][]; dy?: number};
const f = (s: number) => Math.round(s * FPS);
export const CUES: Cue[] = [
  {a: 0, b: f(1.17) - 1, lines: [[['If Earth']], [['stopped,', true]]]},
  {a: f(1.17), b: f(2.46) - 1, lines: [[['you’d keep']], [['moving '], ['east—', true]]]},
  {a: f(2.46), b: f(3.2) - 1, lines: [[['about a']], [['thousand', true]]]},
  {a: f(3.2), b: f(3.86) - 1, lines: [[['miles an hour']]]},
  {a: f(3.86), b: f(4.7) - 1, lines: [[['at the '], ['equator.', true]]]},
  {a: f(4.76), b: f(6.4) - 1, lines: [[['Loose ', true], ['objects']], [['keep going too.']]]},
  {a: f(6.54), b: f(7.5) - 1, lines: [[['So does the '], ['air,', true]]]},
  {a: f(7.5), b: f(9.2) - 1, lines: [[['driving ']], [['debris', true], [' through the streets.']]]},
  {a: f(9.35), b: f(10.7) - 1, lines: [[['And the ']], [['ocean', true], [' keeps moving']]], dy: 880},
  {a: f(10.7), b: f(11.7) - 1, lines: [[['into the '], ['coast.', true]]], dy: 880},
  {a: f(11.78), b: f(13.0) - 1, lines: [[['You don’t ']], [['feel', true], [' the spin']]], dy: -60},
  {a: f(13.0), b: f(14.3) - 1, lines: [[['because you move']], [['with '], ['Earth.', true]]], dy: -60},
  {a: f(14.32), b: f(15.46) - 1, lines: [[['Closer to']], [['the '], ['poles,', true]]]},
  {a: f(15.5), b: f(17.1) - 1, lines: [[['that starting speed']], [['is '], ['lower.', true]]]},
  {a: f(17.15), b: f(18.75) - 1, lines: [[['The stop is']], [['imaginary.', true]]]},
  {a: f(18.8), b: N_FILM - 1, lines: [[['The motion']], [['is '], ['real.', true]]]},
];
