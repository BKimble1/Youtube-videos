/**
 * V1 whole-film timeline. 30 fps. Every number below is either a word time measured from the narration take (audio/v4/voice/v1_takeA_alignment.json, Scribe word
 * starts, refined by the energy segmentation for em-dash/comma pauses) or a picture event placed relative to a word. The hook (frames 0-181) is the H1 hook, unchanged
 * except for the "~" on the speed plate; its picture anchors (east 3.84 s, thousand 4.64 s) match this take to within 0.01 s.
 */
export const FPS = 30;
export const fs = (sec: number) => Math.round(sec * FPS);
export const N_FILM = 1035; // 34.5 s: narration ends 34.16 s, 0.34 s tail that is also the loop transition

/** spoken words in seconds (start) used to place picture events */
export const WORD = {
  so: 6.16, everything: 6.64, it1: 7.12, you: 7.68, feel: 8.08, because: 8.6, together: 9.52, togetherEnd: 9.9,
  stop: 10.4, ground: 10.8, anything: 11.8, isnt: 12.24, fixed: 12.6, keeps: 13.16, going1: 13.6,
  at1: 14.44, first: 14.8, air: 15.32, keeps2: 15.48, going2: 15.84, so2: 16.44, ocean: 16.84, oceanEnd: 17.2,
  farther: 17.76, equator: 18.36, its: 18.92, slower: 19.2, but: 19.96, eighty: 20.56, degrees: 20.99, north: 21.2, it2: 21.76, starts: 21.96, category: 22.48, five: 22.96, hurricane: 23.28, speed: 23.76, speedEnd: 24.1,
  none: 24.72, happen: 25.6, happenEnd: 25.96, but2: 26.48, motion: 26.96, real: 27.72, realEnd: 27.91, at2: 28.4, equator2: 28.64, equator2End: 29.15,
  her: 29.39, coffee: 29.6, moving: 30.12, thousand: 30.68, miles: 31.08, hour: 31.6, along: 32.24, alongEnd: 32.46, it3: 32.92, never: 33.28, spilled: 33.52, spilledEnd: 33.94,
};

/** scene frames */
export const T = {
  hookEnd: 182, // the hook picture is on screen below the iris until the iris has covered it
  irisA: 176, irisB: 198, // the inset globe grows into the B02 globe; its disc of background expands from the globe
  b02: 176,
  zoomA: 226, zoomB: 247, // zoom from the globe's street icon into the real street
  b02b: 240,
  stopF: fs(WORD.stop + 0.0), // 312: "Stop the ground": the inset globe stops, the loose things keep going
  panA: 292, panB: 312, // camera pans east from her to the plaza
  b03: 300,
  wipe1A: 424, wipe1B: 446, // push wipe east: plaza -> coast
  b04: 432,
  oceanF: fs(WORD.so2 - 0.1), // 16.34 s ocean starts to move
  wipe2A: 525, wipe2B: 548, // the sea fills the frame, revealing the polar view
  b05: 540,
  b05end: 746,
  b06: 739,
  loopA: 1016, loopB: 1035,
};

/** the speed readout of the hook (frames; unchanged from H1) */
export const HOOK_END = 182;

/** caption cues: [start frame, end frame, lines of [text, emphasised?][]]. The hook cues are the H1 cues (frames); later cues come from the word times above. */
export type CapSeg = [string, boolean?];
export type Cue = {a: number; b: number; lines: CapSeg[][]; lane?: 'top' | 'low'};
export const CUES: Cue[] = [
  // hook (H1, unchanged)
  {a: 17, b: 40, lines: [[['What if Earth']], [['stopped', true], ['—']]]},
  {a: 47, b: 68, lines: [[['right '], ['now?', true]]]},
  {a: 82, b: 124, lines: [[['This street was']], [['moving '], ['east', true]]]},
  {a: 124, b: 181, lines: [[['at about a '], ['thousand', true]], [['miles an hour.']]]},
  // B02
  {a: fs(6.12), b: fs(7.5), lines: [[['So was']], [['everything', true], [' on it.']]]},
  {a: fs(7.64), b: fs(8.52), lines: [[['You can’t']], [['feel', true], [' it,']]]},
  {a: fs(8.56), b: fs(10.1), lines: [[['because it all']], [['moves '], ['together.', true]]]},
  // B03
  {a: fs(10.36), b: fs(11.45), lines: [[['Stop', true], [' the ground,']]]},
  {a: fs(11.46), b: fs(12.8), lines: [[['and anything that']], [['isn’t '], ['fixed', true]]]},
  {a: fs(12.8), b: fs(14.2), lines: [[['to it keeps']], [['going.', true]]]},
  // B04
  {a: fs(14.38), b: fs(16.25), lines: [[['At first, the']], [['air', true], [' keeps going.']]]},
  {a: fs(16.34), b: fs(17.62), lines: [[['So does the']], [['ocean.', true]]]},
  // B05
  {a: fs(17.7), b: fs(19.0), lines: [[['Farther from the']], [['equator,', true]]]},
  {a: fs(18.9), b: fs(19.88), lines: [[['it’s '], ['slower', true], ['—']]]},
  {a: fs(19.92), b: fs(21.65), lines: [[['but even at ', ], ['eighty', true]], [['degrees north,']]]},
  {a: fs(21.7), b: fs(23.27), lines: [[['it starts at']], [['Category five']]]},
  {a: fs(23.27), b: fs(24.4), lines: [[['hurricane', true], [' speed.']]]},
  // B06
  {a: fs(24.6), b: fs(26.3), lines: [[['None', true], [' of this can']], [['really happen.']]]},
  {a: fs(26.44), b: fs(28.2), lines: [[['But the motion']], [['is '], ['real.', true]]]},
  {a: fs(28.34), b: fs(29.33), lines: [[['At the '], ['equator,', true]]]},
  {a: fs(29.34), b: fs(30.33), lines: [[['her coffee’s', true]], [['been moving']]]},
  {a: fs(30.33), b: fs(32.7), lines: [[['about a '], ['thousand', true]], [['miles an hour']], [['all along.']]]},
  {a: fs(32.88), b: fs(33.97), lines: [[['It just never']], [['spilled.', true]]]},
];
