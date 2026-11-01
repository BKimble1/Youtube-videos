// Export the picture's event times (s) and continuous signals for the mix (tools/make_audio.py places every effect
// from these, so sound and picture share one timeline). V2.
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {EV, T, beatTimes, coyoteAt, jetAt, lizardAt, sectionAt} from '../source/src/story';

const n = Math.round(DUR * 100);
const sig: Record<string, number[]> = {p: [], reveal: [], run: [], yawRate: [], cwalk: [], cstride: [], jet: [], shadow: [], shake: [], paw: []};
let lastYaw = lizardAt(0).yaw;
for (let i = 0; i <= n; i++) {
  const t = i / 100;
  const s = sectionAt(t), lz = lizardAt(t), c = coyoteAt(t), j = jetAt(t);
  sig.p.push(+s.p.toFixed(3));
  sig.reveal.push(+s.reveal.toFixed(3));
  sig.shadow.push(+s.shadow.toFixed(3));
  sig.run.push(+lz.run.toFixed(3));
  sig.yawRate.push(+Math.abs((lz.yaw - lastYaw) * 100).toFixed(3));
  lastYaw = lz.yaw;
  sig.cwalk.push(+c.walk.toFixed(4));
  sig.cstride.push(+c.stride.toFixed(2));
  sig.jet.push(j ? +Math.max(0, j.u1 - j.u0).toFixed(3) : 0);
  sig.shake.push(+c.hd.shake.toFixed(3));
  sig.paw.push(+c.paw.toFixed(3));
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, T, EV, beats: beatTimes, ...sig}));
console.log('cues ->', process.argv[2]);
