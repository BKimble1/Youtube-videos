// V4 cue export for the sound design: word times, the cut list and the named beats (story4.ts), and the footfalls the
// kick rig actually makes (kick4.ts): the reveal's landing and adjusting step, and every landing of the closing
// approach, the plant and the swing.
import * as fs from 'fs';
import * as S from '../source/src/v4/story4';
import {kickPose, tauOpen, tauEnd, ballWorld} from '../source/src/v4/kick4';
import {bjoints} from '../source/src/v2/body';

const lands: {t: number; foot: string}[] = [];
const prev: Record<string, number> = {};
const scan = (t0: number, t1: number, tauOf: (t: number) => number) => {
  prev.n = prev.f = NaN;
  for (let t = t0; t <= t1; t += 1 / 600) {
    const j = bjoints(kickPose(tauOf(t)));
    for (const [k, y] of [['n', j.PA.y], ['f', j.FA.y]] as [string, number][]) {
      if (prev[k] < -7.9 && y >= -7.9) lands.push({t: +t.toFixed(3), foot: k === 'n' ? 'prosthetic' : 'left'});
      prev[k] = y;
    }
  }
};
scan(S.CONTACT + 0.05, S.CUT_XRAY, tauOpen);
scan(S.CUT_FIELD, S.DUR4, tauEnd);
// the pass: when it enters the field shot and how fast it rolls (cm/s) at a few times, for the rolling bed
const roll: [number, number][] = [];
for (let t = S.CUT_FIELD; t <= S.DUR4; t += 0.1) {
  const a = ballWorld(tauEnd(t)).x, b = ballWorld(tauEnd(t + 0.01)).x;
  roll.push([+t.toFixed(2), +(Math.abs(b - a) / 0.01).toFixed(1)]);
}
const named = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
const out = {DUR: S.DUR4, T: S.T4, CUTS: S.CUTS4, ...named, lands, roll, plant: S.T_LOOP - 0.42, swing0: S.T_LOOP - 0.26};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v4.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({lands, plant: out.plant, CONTACT: S.CONTACT}));
