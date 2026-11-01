// Export the picture's event times (real film time, s) and continuous signals for the mix (tools/make_audio.py places
// every effect from these, so sound and picture share one timeline).
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {EV, LAND, T, beatTimes, coyoteAt, jetAt, lizardAt, sinusAt, speedAt, tOfV} from '../source/src/story';

const R: Record<string, number> = {};
for (const [k, v] of Object.entries(EV)) R[k] = tOfV(v as number);
R.land = tOfV(LAND().land);
const n = Math.round(DUR * 100);
const sig: Record<string, number[]> = {p: [], squeeze: [], reveal: [], speed: [], run: [], walk: [], jet: [], shadow: [], shake: [], tongue: []};
for (let i = 0; i <= n; i++) {
  const t = i / 100;
  const s = sinusAt(t);
  const lz = lizardAt(t);
  const c = coyoteAt(t);
  const j = jetAt(t);
  sig.p.push(+s.p.toFixed(3));
  sig.squeeze.push(+s.squeeze.toFixed(3));
  sig.reveal.push(+s.reveal.toFixed(3));
  sig.shadow.push(+s.shadow.toFixed(3));
  sig.speed.push(+speedAt(t).toFixed(3));
  sig.run.push(+lz.run.toFixed(3));
  sig.walk.push(+c.walk.toFixed(4));
  sig.jet.push(j ? +Math.max(0, j.u1 - j.u0).toFixed(3) : 0);
  sig.shake.push(+c.hd.shake.toFixed(3));
  sig.tongue.push(+c.hd.tongue.toFixed(3));
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, T, EV: R, beats: beatTimes.map(tOfV), ...sig}));
console.log('cues ->', process.argv[2]);
