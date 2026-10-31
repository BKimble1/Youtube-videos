// Export the picture's event times and two continuous signals for the mix (tools/make_audio.py places every effect
// from these, so sound and picture share one timeline): the arm's muscle mass m(t) and the hero fibre's myofibril
// count q(t) (each whole step is one myofibril zipping into place).
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {EV, T, LAST, armAt, microAt, camAt} from '../source/src/story';

const m: number[] = [], q: number[] = [], world: string[] = [], wv: number[] = [];
for (let i = 0; i <= Math.round(DUR * 100); i++) {
  const t = i / 100;
  m.push(Math.round(armAt(t).m * 1000) / 1000);
  q.push(Math.round(microAt(t).q * 1000) / 1000);
  const c = camAt(t);
  world.push(c.world);
  wv.push(Math.round(Math.log(c.w) * 1000) / 1000);
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, LAST, EV, T, m, q, world, logw: wv}));
console.log('cues ->', process.argv[2]);
