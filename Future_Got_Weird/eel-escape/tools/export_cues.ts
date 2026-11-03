// Export the picture's event times and continuous signals for the mix (tools/make_audio.py places every effect from
// these, so sound and picture share one timeline): the tail tip's route speed, how much of the eel is outside, the
// gill cover's flare, the free swimmer's speed, the X-ray, cutaway and translucent amounts, and the camera width.
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {S_EXIT} from '../source/src/eel';
import {EV, T, camAt, eelAt, fishAt} from '../source/src/story';
import {EEL_L} from '../source/src/anatomy';

const sig: Record<string, number[]> = {slide: [], out: [], gill: [], swim: [], xray: [], cut: [], translucent: [], logw: [], lens: []};
const r3 = (x: number) => Math.round(x * 1000) / 1000;
let prev = eelAt(-0.01);
for (let i = 0; i <= Math.round(DUR * 100); i++) {
  const t = i / 100;
  const e = eelAt(t);
  // route speed of the tail tip (tract mode) or the mid-body speed (free mode), units per second
  const mid = Math.round(e.pts.length / 2);
  const v = e.free || prev.free
    ? Math.hypot(e.pts[mid].x - prev.pts[mid].x, e.pts[mid].y - prev.pts[mid].y) / 0.01
    : Math.abs(e.sigTip - prev.sigTip) / 0.01;
  sig[e.free ? 'swim' : 'slide'].push(r3(Math.min(400, v)));
  sig[e.free ? 'slide' : 'swim'].push(0);
  sig.out.push(r3(Math.max(0, Math.min(EEL_L, e.sigTip - S_EXIT)) / EEL_L));
  const f = fishAt(t);
  sig.gill.push(r3(f.gill)); sig.xray.push(r3(f.xray)); sig.cut.push(r3(f.cut)); sig.translucent.push(r3(f.translucent));
  sig.logw.push(r3(Math.log(camAt(t).w)));
  sig.lens.push(0);
  prev = e;
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, EV, T, ...sig}));
console.log('cues ->', process.argv[2]);
