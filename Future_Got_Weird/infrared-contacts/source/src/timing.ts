// Single authoritative cue system: every picture and sound event is derived here from the measured narration words
// (src/data/timeline.json). tools/export_cues.ts writes these to audio/cues.json for the mix.
import {WORDS, DUR} from './lib';

const w = (i: number) => WORDS[i].start; // word i start (s)
const we = (i: number) => WORDS[i].end;

export const CUE = {
  // A: opening contradiction
  contact: 0.4, // lens touches the cornea ("these")
  release: 0.55, // finger starts to withdraw
  fingerOut: 1.2,
  lidClose0: w(9) + 0.11, // "flashing"
  lidClose1: w(11) - 0.0, // closed by "with"
  insetOpen0: w(12) - 0.02, insetOpen1: w(13) + 0.08,
  pulseA: [w(14) + 0.04, w(15) - 0.08], // "completely", "shut"
  insetClose0: we(15) - 0.07, insetClose1: we(15) + 0.15,
  // A -> B: the cutaway window opens on the closed eye
  reveal0: we(15) + 0.13, reveal1: w(17) + 0.09,
  // B: ordinary eye (lids slide apart, lens slides off), visible vs infrared
  lidOpen0: w(16) + 0.02, lidOpen1: w(16) + 0.49,
  lensOff0: w(17) + 0.04, lensOff1: w(17) + 0.4,
  visLaunch: w(18) + 0.06, // "your eyes"
  irLaunch: w(21) - 0.03, // "can't": reaches the retina on "infrared" and produces nothing
  // C: lens returns, push into its material, absorption and emission
  lensBack0: w(24) + 0.01, lensBack1: w(26) + 0.37,
  push0: w(26) + 0.32, push1: we(29) - 0.1,
  absorb1: w(31) + 0.29, absorb2: w(33) + 0.29, // "absorb", "invisible"
  emit0: w(36) + 0.02, emit1: w(39) + 0.22, // "turn" -> "colors"
  // D: pull back to the closed eyelid barrier
  pull0: we(42) - 0.25, pull1: w(46) + 0.6,
  lidClose2_0: w(45) - 0.05, lidClose2_1: w(46) + 0.5, // "eyelids"
  visBlock: [w(48) - 0.1, w(48) + 0.06, w(49) + 0.06, w(51) - 0.04], // ambient light launches ("much of the visible")
  irD: [w(55) - 0.08, w(55) + 0.08, w(55) + 0.24], // infrared launches ("infrared")
  // E: complete the light path
  heroAtLens: w(63) + 0.06, // "lens"
  heroAtParticle: w(64) + 0.02,
  convert: w(66) + 0.02, // "converted"
  greenAtRetina: w(70) + 0.12, // "flash"
  pathHi0: w(71) - 0.1, pathHi1: we(74),
  insetE0: w(72), insetE1: w(73) + 0.3, flashE: w(73) + 0.08,
  insetEClose0: we(74) - 0.05, insetEClose1: we(74) + 0.32,
  revealClose0: we(74) + 0.02, revealClose1: we(74) + 0.52,
  // F: the train compartment
  face: w(77), wideLead: w(80) + 0.32, aim0: w(80) + 0.57, aim1: w(81) + 0.15,
  reveal2_0: w(81) - 0.12, reveal2_1: w(84) - 0.03,
  code: [[w(82) + 0.19, 0.2], [w(83) + 0.24, 0.2], [w(86) - 0.05, 0.55], [w(88) + 0.07, 0.2]] as [number, number][],
  insetF0: w(82) + 0.04, insetF1: w(90) + 0.08,
  page0: w(88) + 0.17, page1: w(89) + 0.27,
  smirk0: w(90) - 0.07, smirk1: w(91) + 0.17,
  push2_0: w(89) + 0.08, end: DUR,
};

// ----- packet schedules (L2 paths; speeds in L2 units per second) -----
// B: one ordinary visible packet and one infrared packet into the open, lens-free eye
export const SPEED_B = 300; // L2 units / s
export const PATH_B_VIS = [{x: 196, y: 8}, {x: 114, y: 6}, {x: 88, y: 3}, {x: 74, y: 1.5}, {x: -89, y: -2}];
export const PATH_B_IR = [{x: 196, y: -8}, {x: 114, y: -6}, {x: 88, y: -3.5}, {x: 74, y: -1.5}, {x: -89, y: 2}];
// D/E: infrared packets through the closed lid (y = height of the ray); the hero ray meets the hero particle
export const D_IR_ROWS = [-27, -6.768, 16];
export const D_VIS_ROWS = [-34, -14, 10, 30];
