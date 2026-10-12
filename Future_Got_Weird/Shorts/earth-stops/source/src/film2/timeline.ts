/**
 * V2 whole-film timeline. 30 fps. Word times come from the V2 narration (Test Voice, take B, audio/v5/voice/v2_takeB_alignment.json: Scribe word starts; speech ends from the
 * energy segmentation in audio/v5/voice/VOICE_ANALYSIS_v2.json). The narration is used as generated: no trim, no stretch.
 */
export const FPS = 30;
export const fs = (sec: number) => Math.round(sec * FPS);
export const N_FILM = 760; // 25.33 s: speech ends 23.98 s, then the sip settles (~1.3 s)

/** spoken words in seconds (start) */
export const WORD = {
  at: 2.64, equator: 3.0, youre: 3.64, already: 3.84, moving: 4.24, about: 4.56, thousand: 4.96, hour: 5.76,
  you: 6.52, dont: 6.6, feel: 6.88, because: 7.36, you2: 7.6, ground: 8.4, the2: 9.04, air: 9.2, move: 9.52, together: 9.76,
  stop: 10.72, ground2: 11.2, suddenly: 11.44, loose: 12.24, objects: 12.56, initially: 13.04, keep: 13.68, east: 14.16,
  air2: 15.04, keeps: 15.24, too: 15.76, and: 16.48, ocean: 17.04,
  closer: 17.92, poles: 18.48, starting: 19.28, speed: 19.68, lower: 20.16,
  stop2: 21.04, imaginary: 21.76, motion: 22.8, real: 23.68,
};
/** the speech groups of the take (energy segmentation), seconds: [start, end] */
export const GROUPS: [number, number][] = [[0.02, 1.17], [1.56, 2.11], [2.67, 3.45], [3.61, 4.81], [4.9, 6.01], [6.46, 7.89], [8.07, 8.67], [8.77, 10.15], [10.62, 10.9], [10.97, 11.88], [12.05, 14.45], [14.88, 16.0], [16.39, 17.35], [17.85, 18.86], [19.03, 20.44], [20.87, 22.3], [22.63, 23.28], [23.37, 23.98]];

/** scene frames */
export const T = {
  // the hook shows the H1 street scene from scene time D frames in: frame 0 is already mid-event (see Hook2.tsx)
  D: 11,
  globeStop: 3, // the inset globe stops dead on this frame (cause cue)
  hookEnd: 186,
  b02: 186,
  panA: 290, panB: 316, // camera whips east to the plaza
  stopF: fs(WORD.stop), // 322: "Stop"
  wipe1A: 424, wipe1B: 446, // slanted push wipe east: plaza -> coast
  airF: fs(WORD.air2 - 0.2), // 451
  seaF: 486, // the sea mass enters ("And so does the ocean")
  foamA: 534, foamB: 543, foamC: 556, // spray occludes the frame (534-543); the latitude scene is revealed under it (543-556), so the globe is on screen by the word 'poles' (f554)
  latA: 543, latMove0: 562, latMove1: 590, // the one camera move, equator path -> small path near the pole, across 'poles ... that starting speed'
  streakA: 616, streakB: 634, // streak wipe into the payoff
  payA: 626,
  sipA: 688, sipUp: 700, sipDown: 716, sipEnd: 730,
};

/** caption cues: [start frame, end frame, lines of [text, emphasised?][]]. Every cue starts within ~120 ms of its first word. */
export type CapSeg = [string, boolean?];
export type Cue = {a: number; b: number; lines: CapSeg[][]};
export const CUES: Cue[] = [
  {a: 0, b: fs(1.17) + 3, lines: [[['What if Earth']], [['stopped', true], ['—']]]},
  {a: fs(1.56) - 1, b: fs(2.11) + 4, lines: [[['right '], ['now?', true]]]},
  {a: fs(2.64), b: fs(3.5) + 2, lines: [[['At the '], ['equator,', true]]]},
  {a: fs(3.58), b: fs(4.54), lines: [[['you’re already']], [['moving']]]},
  {a: fs(4.55), b: fs(5.34), lines: [[['about a']], [['thousand', true]]]},
  {a: fs(5.35), b: fs(6.35), lines: [[['miles an hour.']]]},
  {a: fs(6.5), b: fs(7.35), lines: [[['You don’t']], [['feel', true], [' it']]]},
  {a: fs(7.36), b: fs(8.78), lines: [[['because ']], [['you, the ground,']]]},
  {a: fs(8.79), b: fs(10.5), lines: [[['and the air']], [['move '], ['together.', true]]]},
  {a: fs(10.62), b: fs(12.0), lines: [[['Stop', true], [' the ground']], [['suddenly,']]]},
  {a: fs(12.04), b: fs(13.0), lines: [[['and loose']], [['objects']]]},
  {a: fs(13.01), b: fs(14.9), lines: [[['initially keep']], [['moving '], ['east.', true]]]},
  {a: fs(14.88), b: fs(16.35), lines: [[['The '], ['air', true], [' keeps']], [['going too.']]]},
  {a: fs(16.38), b: fs(17.85), lines: [[['And so does']], [['the '], ['ocean.', true]]]},
  {a: fs(17.86), b: fs(19.0), lines: [[['Closer to']], [['the '], ['poles,', true]]]},
  {a: fs(19.02), b: fs(20.7), lines: [[['that starting speed']], [['is '], ['lower.', true]]]},
  {a: fs(20.86), b: fs(22.55), lines: [[['The stop is']], [['imaginary.', true]]]},
  {a: fs(22.62), b: fs(24.4), lines: [[['The motion']], [['is '], ['real.', true]]]},
];
