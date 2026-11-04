// V3 cue export for the sound design: word times (V3 master), the cut list, both strikes, cleat landings of the closing
// approach (from the rig), the plant, the bend, the toe wiggle and the lace tug.
import * as fs from 'fs';
import {T3, CUTS3, STRIKE_A, STRIKE_B, SCAN_T, FACE_T, DUR3, pitchState3, shot3At, start3} from '../source/src/v3/story3';
import {bjoints} from '../source/src/v2/body';
import {bendU} from '../source/src/v3/rehab3';

const lands: {t: number; foot: string}[] = [];
const prev: Record<string, number> = {};
for (let i = 0; i <= DUR3 * 600; i++) {
  const t = i / 600;
  const s = shot3At(t);
  if (s !== 'kick' && s !== 'plant') { prev.n = prev.f = NaN; continue; }
  const j = bjoints(pitchState3(t).pose);
  for (const [k, y] of [['n', j.PA.y], ['f', j.FA.y]] as [string, number][]) {
    if (prev[k] < -9.0 && y >= -8.9) lands.push({t: +t.toFixed(3), foot: k === 'n' ? 'prosthetic' : 'left'});
    prev[k] = y;
  }
}
let b0 = 0;
for (let t = 13; t < 17; t += 1 / 300) if (!b0 && bendU(t) > 0.02) b0 = t;
const out = {DUR: DUR3, T: T3, CUTS: CUTS3, STRIKE1: STRIKE_A, STRIKE2: STRIKE_B, SCAN_T, FACE_T, plant: start3('plant') + 0.18, lands, bend: [+b0.toFixed(3)]};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v3.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({lands, bend: b0, strikes: [STRIKE_A, STRIKE_B], plant: out.plant}));
