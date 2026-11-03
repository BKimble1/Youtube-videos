// Export the picture's event times and continuous signals for the mix (tools/make_audio.py places every effect from
// these, so sound and picture share one timeline): the glue front's speed (mm/s), the world, the camera's log width,
// the instruments' contact, the wet film, the healing stages and the hand's curl. (V2)
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {EV, T, LAST, LOOP_T, camAt, boneAt, armAt, instrAt} from '../source/src/story';

const sig: Record<string, number[]> = {speed: [], logw: [], hem: [], soft: [], bridge: [], hard: [], remodel: [], curl: [], wet: [], probe: [], app: [], reveal: []};
const world: string[] = [];
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const frontS = (t: number) => {
  const f = boneAt(t, 0.05).front;
  return f ? f.s : null;
};
for (let i = 0; i <= Math.round(DUR * 100); i++) {
  const t = i / 100;
  const a = frontS(t - 0.005), b = frontS(t + 0.005);
  sig.speed.push(r3(a !== null && b !== null ? Math.abs(b - a) / 0.01 : 0));
  const c = camAt(t);
  world.push(c.world);
  sig.logw.push(r3(Math.log(c.cam.w)));
  sig.reveal.push(r3(c.reveal ?? 0));
  const bs = boneAt(t, 0.05);
  sig.hem.push(r3(bs.heal.hem)); sig.soft.push(r3(bs.heal.soft)); sig.bridge.push(r3(bs.heal.bridge)); sig.hard.push(r3(bs.heal.hard));
  sig.remodel.push(r3(bs.heal.remodel)); sig.wet.push(r3(bs.wet));
  sig.probe.push(r3(bs.press ? bs.press.contact : 0)); sig.app.push(r3(bs.appContact ? bs.appContact.contact : 0));
  sig.curl.push(r3(armAt(t).curl));
  void instrAt;
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, LAST, LOOP_T, EV, T, world, ...sig}));
console.log('cues ->', process.argv[2]);
