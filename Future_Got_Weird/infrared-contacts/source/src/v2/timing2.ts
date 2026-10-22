// V2 picture timing. The audio is LOCKED to V1 (same narration, music and effects, bit for bit), so every V2 picture
// event is placed on the V1 sound event it belongs to. SFX below is read from the V1 effect cue log
// (audio/sfx_cues.json; the V1 cue table is frozen in src/data/cues_v1_locked.json). Narration words come from the
// unchanged src/data/timeline.json.
import {WORDS} from '../lib';

const w = (i: number) => WORDS[i].start;
const we = (i: number) => WORDS[i].end;

// locked V1 sound events (seconds)
export const SFX = {
  lensTap: 0.39, fingerSwish: 0.55, viewAir: 2.9, flashA: [3.4, 4.0], cutAir: 4.55, openSwish: 4.95,
  visChime: 6.255, irThud: 7.205, lensClick: 8.4, push: 8.4, absorb: [10.23, 10.83], emit: 11.5, pullBack: 12.7,
  lidsClose: 13.55, visStop: [15.09, 15.25, 15.41, 15.55], irLid: 17.45, lensTick: 19.1, convert: 20.24,
  retinaBloom: 21.5, flashE: 22.24, pullOut: 22.9, cloth: 25.75, buttons: [26.2, 26.62, 27.05, 27.85],
  codeLen: [0.2, 0.2, 0.55, 0.2], codeTravel: 0.28, page: 27.95,
};

export const V2 = {
  // ---- hook ----
  contact: SFX.lensTap,
  fingerOut0: 0.47, fingerOut1: 0.86,
  lidClose0: 0.78, lidClose1: 1.0,
  pov1In0: 0.95, pov1In1: 1.32, flash0: 1.34, pov1Out0: 1.52, pov1Out1: 1.92,
  press0: 2.66, pulse0: 2.72, pulse1: 3.3,
  pov2In0: 2.98, pov2In1: 3.38, pov2Out0: 4.22, pov2Out1: 4.68,
  // ---- ordinary vision (spectrum) ----
  eyeOpen0: w(16) + 0.0, eyeOpen1: w(16) + 0.27, // "You see" (lid swish 4.95)
  wipe0: 4.85, wipe1: 5.35,
  spec0: 5.05, spec1: 5.4, visLaunch: 5.45, visArrive: SFX.visChime - 0.03, irLaunch: 6.42, irArrive: SFX.irThud - 0.02,
  specOut0: we(23) - 0.05, specOut1: we(23) + 0.3,
  // ---- into the section, lens on, into the material ----
  reveal0: 7.45, reveal1: 7.95, lensIn0: 7.95, lensIn1: SFX.lensClick - 0.03,
  push1: 9.7, mark0: 9.55, mark1: SFX.emit + 0.1,
  absorb1: SFX.absorb[0], absorb2: SFX.absorb[1], emit0: SFX.emit, emit1: SFX.emit + 0.8, ripple0: 11.8,
  // ---- out to the face, eyelids, back in ----
  lidsClose0: SFX.lidsClose - 0.1, lidsClose1: SFX.lidsClose + 0.2, unreveal0: 13.65, unreveal1: 14.05,
  wipeBack0: 13.65, wipeBack1: 14.05, faceD: 14.15, reveal2_0: 14.45, reveal2_1: 14.95,
  heroLaunch: 16.55, heroLid: SFX.irLid, heroLidOut: 18.7, heroLens: SFX.lensTick, heroParticle: 19.85,
  convert: SFX.convert, greenRetina: SFX.retinaBloom,
  // ---- payoff (subjective) ----
  pov3In0: 21.62, pov3In1: 22.16, flashE: SFX.flashE, unreveal3: 22.75, pov3Out0: 22.8, pov3Out1: 23.3,
  // ---- ending ----
  asleep: w(80), aim0: SFX.cloth, aim1: SFX.cloth + 0.4,
  split0: 26.08, split1: 26.45, split2: 28.32, split3: 28.68,
  smirk0: w(90) - 0.07, smirk1: w(91) + 0.17,
  lower0: 28.3, lower1: 28.9,
};
