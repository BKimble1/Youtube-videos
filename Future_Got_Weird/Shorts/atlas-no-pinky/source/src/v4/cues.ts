// V4 cue access. The pace is chosen at BUNDLE time: REMOTION_PACE=orig selects the original-pace narration; anything else is the retimed ("fast") pace.
import {CUES_FAST} from '../cues_v4_fast';
import {CUES_ORIG} from '../cues_v4_orig';

export const PACE: 'fast' | 'orig' = process.env.REMOTION_PACE === 'orig' ? 'orig' : 'fast';
const CUE = PACE === 'orig' ? CUES_ORIG : CUES_FAST;
export const V4 = CUE.ev;
export const TOTAL_V4 = CUE.total;
export const CAPS_V4 = CUE.caps;
export const MIX_FILE = `audio/final_mix_v4_${PACE}.wav`;

const MAP = CUE.map;
/** old narration clock (seconds) -> this pace's clock (seconds); piecewise linear, identical to tools/timemap_v4.py */
export const tm = (t: number) => {
  if (t <= MAP[0][0]) return MAP[0][1];
  for (let i = 1; i < MAP.length; i++) {
    if (t <= MAP[i][0]) {
      const [a0, b0] = MAP[i - 1], [a1, b1] = MAP[i];
      return a1 === a0 ? b1 : b0 + ((t - a0) / (a1 - a0)) * (b1 - b0);
    }
  }
  return MAP[MAP.length - 1][1];
};
/** a frame number authored on the original V3 clock -> the same moment in this pace */
export const fm = (oldFrame: number) => Math.round(tm(oldFrame / 30) * 30);
