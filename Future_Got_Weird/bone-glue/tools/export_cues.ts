// Export the picture's event times and continuous signals for the mix (tools/make_audio.py places every effect from
// these, so sound and picture share one timeline): the bead's laid speed (mm/s), the world, the camera's log width,
// the healing stages, the hand's curl and the loop pass.
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {EV, T, LAST, LOOP_T, camAt, laidAt, openTau, inOpening, boneAt, armAt, passAt, instrAt} from '../source/src/story';

const sig: Record<string, number[]> = {speed: [], logw: [], hem: [], soft: [], hard: [], resorb: [], remodel: [], curl: [], pass: [], wet: [], appOut: [], clampOpen: []};
const world: string[] = [];
const r3 = (x: number) => Math.round(x * 1000) / 1000;
for (let i = 0; i <= Math.round(DUR * 100); i++) {
  const t = i / 100;
  const tau = openTau(t);
  const op = inOpening(t) && tau < EV.dive0;
  sig.speed.push(r3(op ? (laidAt(tau + 0.005) - laidAt(tau - 0.005)) / 0.01 : 0));
  const c = camAt(t);
  world.push(c.world);
  sig.logw.push(r3(Math.log(c.cam.w)));
  const b = boneAt(t, 0.05);
  sig.hem.push(r3(b.heal.hem)); sig.soft.push(r3(b.heal.soft)); sig.hard.push(r3(b.heal.hard));
  sig.resorb.push(r3(b.heal.resorb)); sig.remodel.push(r3(b.heal.remodel)); sig.wet.push(r3(b.wet));
  sig.curl.push(r3(armAt(t).curl));
  sig.pass.push(r3(passAt(t)));
  const ins = instrAt(t);
  sig.clampOpen.push(r3(ins.clamp.open));
  sig.appOut.push(r3(1 - ins.appOn));
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, LAST, LOOP_T, EV, T, world, ...sig}));
console.log('cues ->', process.argv[2]);
