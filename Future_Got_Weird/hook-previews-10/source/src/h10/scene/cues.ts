// HOOK 10 event times (seconds). Every visual beat is read from the narration's word timings; tools/audio/h10.py
// mirrors the same numbers (keep them in step).
import WORDS from '../../data/h10_words.json';
import {Words, wordAt} from '../../shared/lib';

const W = WORDS as Words;
const at = (w: string, n = 0) => wordAt(W, w, n).start;

export const WD = {
  brain: at('brain'),
  implant: at('implant'),
  walk: at('walk'),
  again: at('again'),
  by: at('by'),
  bypassing: at('bypassing'),
  spinal: at('spinal'),
  injury: at('injury'),
};

/** gait: a slow, deliberate assisted walk (period T); near (left) leg swings at NEAR0 + k*T, the far leg half a period later */
export const GAIT = {T: 2.3, swing: 0.92, near0: -0.3, stride: 280};

export const CUE = {
  // the window onto the head opens as the camera arrives there ("walk again")
  xrayOpen0: WD.walk + 0.02,
  xrayOpen1: WD.again + 0.25,
  // the motor cortex fires; the implant's electrodes record it
  cortex0: WD.walk + 0.42,
  record: WD.again + 0.22,
  // implant -> headset coil (through skull and scalp)
  hop1: WD.again + 0.36,
  // headset -> cable down behind the neck -> backpack processor ("bypassing")
  cable0: WD.again + 0.48,
  cable1: WD.bypassing + 0.46,
  // the brain's own signal runs down the cord and dies at the injury
  cord0: WD.again + 0.36,
  cordStop: WD.bypassing + 0.24,
  decode0: WD.bypassing + 0.5,
  decode1: WD.bypassing + 0.8,
  // processor -> belt transmitter -> (hop through the skin) -> pulse generator -> lead -> paddle
  belt0: WD.bypassing + 0.76,
  belt1: WD.spinal + 0.1,
  hop2: WD.spinal + 0.12,
  lead0: WD.spinal + 0.22,
  lead1: WD.injury + 0.0,
  // paddle fires below the injury; pulses run down the leg nerves; the muscles contract; the near leg steps
  stim: WD.injury + 0.02,
  muscle: WD.injury + 0.2,
};
