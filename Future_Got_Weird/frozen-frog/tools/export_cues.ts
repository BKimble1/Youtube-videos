// Export the picture's event times and continuous signals for the mix (tools/make_audio.py places every effect from
// these, so sound and picture share one timeline): the heartbeat schedule, the frog's frost, the exterior weight, the
// world, the tissue's ice, the camera's zoom.
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {BEATS, EV, LOOP_T, PERIOD, T, anatomyAt, camAt, envAt, frogAt, microAt} from '../source/src/story';
import {extAt} from '../source/src/Scene';

const n = Math.round(DUR * 100);
const sig: Record<string, number[]> = {ext: [], frost: [], ice: [], micro: [], logw: [], cold: [], snow: [], melt: [], falling: [], wet: [], cut: [], hold: [], sugar: [], heartIce: []};
const r3 = (x: number) => Math.round(x * 1000) / 1000;
for (let i = 0; i <= n; i++) {
  const t = i / 100;
  const c = camAt(t), f = frogAt(t), e = envAt(t), a = anatomyAt(t), m = microAt(t);
  sig.ext.push(r3(extAt(t)));
  sig.frost.push(r3(f.frost));
  sig.ice.push(r3(m.ice));
  sig.micro.push(c.world === 'micro' || c.local.w < 2.6 ? 1 : 0);
  sig.logw.push(r3(Math.log(c.w)));
  sig.cold.push(r3(e.cold));
  sig.snow.push(r3(e.snow * (1 - e.melt)));
  sig.melt.push(r3(e.melt));
  sig.falling.push(r3(e.falling));
  sig.wet.push(r3(e.wet));
  sig.cut.push(r3(f.cut ? f.cut.r : 0));
  sig.hold.push(r3(m.hold));
  sig.sugar.push(r3(a.sugar));
  sig.heartIce.push(r3(a.ice));
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, LOOP_T, PERIOD, EV, T, BEATS, ...sig}));
console.log('cues ->', process.argv[2]);
