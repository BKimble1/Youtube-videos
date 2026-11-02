// Export V4's event times for the mixer: V3's staged events (from the V4 copy of the staging, src/v4) placed on the V4
// timeline through the same time map the picture uses (src/v4/warp.ts unwarp), so sound and picture stay locked.
// build + run (from the time-machine folder):
//   npx --prefix source esbuild tools/export_cues_v4.ts --bundle --platform=node --outfile=/tmp/cues4.js --log-level=error
//   node /tmp/cues4.js source/src/v4/cues.json
import * as fs from 'fs';
import {T3} from '../source/src/v4/timing';
import * as S from '../source/src/v4/story';
import {unwarp, DUR4} from '../source/src/v4/warp';

const u = (x: number) => Math.round(unwarp(x) * 1000) / 1000;
const EV3: Record<string, number | number[]> = {
  ...T3,
  gate: S.T_GATE - 0.25,
  doorOpen: T3.inside - 0.46,
  astroSteps: S.returnSteps(), doorSteps: S.doorWalkSteps(), roomSteps: S.roomWalkSteps(),
  friendSteps: [T3.friendIn + 0.15, T3.friendIn + 0.45],
};
const EV: Record<string, number | number[]> = {};
for (const [k, v] of Object.entries(EV3)) EV[k] = Array.isArray(v) ? v.map(u) : k === 'dur' ? DUR4 : u(v);
fs.writeFileSync(process.argv[2], JSON.stringify({EV}, null, 1));
console.log('cues ->', process.argv[2], JSON.stringify({windowIn: EV.windowIn, match: EV.match, windowMatch: EV.windowMatch, landing: EV.landing, inside: EV.inside, loopCut: EV.loopCut, dur: EV.dur}));
