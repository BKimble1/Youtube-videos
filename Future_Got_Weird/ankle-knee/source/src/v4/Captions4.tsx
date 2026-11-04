// V4 captions: the approved phrases, timed to the master (timeline_v3.json). The screen height of each phrase comes
// from the shot under it (kept clear of the ankle, the cleat and the ball); `ys` maps caption index -> y (px, the line's
// centre), and anything not listed sits at the top (DEFAULT_Y).
//   0 Doctors turned this boy's ankle      6 and attached it to his thigh,       12 And once he learned
//   1 into a working knee.                 7 with his toes pointing behind him.  13 to use his new leg,
//   2 Wyatt had bone cancer.               8 That backward ankle now bent        14 that same foot helped him
//   3 Surgeons had to remove his knee,     9 the same way as his other knee.     15 kick a soccer ball.
//   4 but they could save his foot.       10 When Wyatt woke up,
//   5 They turned his lower leg halfway   11 he could still wiggle his toes.
import React from 'react';
import {clamp} from '../lib';
import {CaptionLine} from '../Captions';
import {CAPS4} from './story4';

export const DEFAULT_Y = 260;
export const capIndex4 = (t: number) => CAPS4.findIndex((c, k) => t >= (k === 0 ? 0 : c.show) && t < (k + 1 < CAPS4.length ? CAPS4[k + 1].show : 1e9));
export const Captions4: React.FC<{t: number; ys?: Record<number, number | ((t: number) => number)>}> = ({t, ys = {}}) => {
  const i = capIndex4(t);
  if (i < 0) return null;
  const v = ys[i];
  const y = v === undefined ? DEFAULT_Y : typeof v === 'function' ? v(t) : v;
  return <CaptionLine key={i} c={CAPS4[i]} y={y} a={i === 0 ? 1 : clamp(0.5 + (t - CAPS4[i].show) / 0.067)} />;
};
