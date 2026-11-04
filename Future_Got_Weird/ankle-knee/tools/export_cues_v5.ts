// V5 cue export: the V4 cut list through the socket match (story5.ts), the closing payoff's beats, and the footfalls
// the V5 rig makes (kick5.ts): the reveal's landings, the closing step, plant and landing.
import * as fs from 'fs';
import * as S from '../source/src/v5/story5';
import {kickPose5, sOpen, sEnd} from '../source/src/v5/kick5';
import {bjoints5} from '../source/src/v5/body5';

const lands: {t: number; foot: string}[] = [];
const scan = (t0: number, t1: number, open: boolean) => {
  const prev: Record<string, number> = {n: NaN, f: NaN};
  for (let t = t0; t <= t1; t += 1 / 600) {
    const j = bjoints5(kickPose5(open ? sOpen(t) : sEnd(t), open));
    for (const [k, y] of [['n', j.PA.y], ['f', j.FA.y]] as [string, number][]) {
      if (prev[k] < -7.9 && y >= -7.9) lands.push({t: +t.toFixed(3), foot: k === 'n' ? 'prosthetic' : 'left'});
      prev[k] = y;
    }
  }
};
scan(S.CONTACT + 0.05, S.CUT_XRAY, true);
scan(S.CUT_FIELD, S.DUR4, false);
const named = Object.fromEntries(Object.entries(S).filter(([, v]) => typeof v === 'number')) as Record<string, number>;
const W = S.T4.working;
const out = {DUR: S.DUR4, T: S.T4, CUTS: S.CUTS5, ...named, lands,
  curl: [[W - 0.07, W + 0.39], [W + 0.58, W + 1.08], [W + 1.16, W + 1.42], [W + 1.48, S.CUT_XRAY]],
  windup: [S.TC_END - 0.8, S.TC_END - 0.36], swing: S.TC_END - 0.3, flight: [S.CUT_FLIGHT, S.DUR4 - 1 / 30]};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v5.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({lands, TC_END: S.TC_END}));
