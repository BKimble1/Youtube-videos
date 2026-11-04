// V2 cue export for the sound design: word times, the shot list, the two strikes, the cleat landings of the step and
// the closing approach (detected from the rig), the lace tug, the toe wiggle and the rail bend.
import * as fs from 'fs';
import {T, CUTS, STRIKE1, STRIKE2, pitchPose, shot2At} from '../source/src/v2/story2';
import {bjoints} from '../source/src/v2/body';
import {stepState} from '../source/src/v2/lace';
import {railsU} from '../source/src/v2/rails';
import {DUR} from '../source/src/lib';

const lands: {t: number; foot: string}[] = [];
const prev: Record<string, number> = {};
for (let i = 0; i <= DUR * 600; i++) {
  const t = i / 600;
  const s = shot2At(t);
  if (s !== 'step' && s !== 'kick') { prev.n = prev.f = NaN; continue; }
  const p = s === 'step' ? stepState(t).pose : pitchPose(t).pose;
  const j = bjoints(p);
  for (const [k, y] of [['n', j.PA.y], ['f', j.FA.y]] as [string, number][]) {
    if (prev[k] < -9.0 && y >= -8.9) lands.push({t: +t.toFixed(3), foot: k === 'n' ? 'prosthetic' : 'left'});
    prev[k] = y;
  }
}
let bend0 = 0, bend1 = 0;
for (let t = 13; t < 17.4; t += 1 / 300) { const u = railsU(t); if (!bend0 && u > 0.02) bend0 = t; if (u > 0.98 && !bend1) bend1 = t; }
const out = {DUR, T, CUTS, STRIKE1, STRIKE2, lands, bend: [+bend0.toFixed(3), +bend1.toFixed(3)]};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v2.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({lands, bend: out.bend, strikes: [STRIKE1, STRIKE2]}));
