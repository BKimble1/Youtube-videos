// V4: the picture's own event times and per-frame signals for the mix (audio/cues_v4.json).
// usage: (cd source && npx esbuild ../tools/v3/export_cues4.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c4.cjs) && node /tmp/c3.cjs audio/cues_v4.json
import * as fs from 'fs';
import {T} from '../../source/src/it/timing';
import {lab4At, lab4EndAt, HOOK_PULSES, CONTACT, OBL_A} from '../../source/src/v4/shots4';
import {TOP_A, TOP_B} from '../../source/src/v2/shots2';
import {car4Active} from '../../source/src/v4/car4';
import {FRAMES, DUR} from '../../source/src/lib';

const fps = 30;
const sig: Record<string, number[]> = {waves: [], focus: [], slab: [], scene: [], shot: []};
for (let f = 0; f < FRAMES; f++) {
  const t = f / fps;
  const a = lab4At(t);
  const top = !a && t >= TOP_A && t < TOP_B;
  const car = !a && !top && car4Active(t);
  const s = a ?? (top || car ? null : lab4EndAt(t));
  sig.scene.push(car ? 1 : 0);
  sig.shot.push(a ? a.shot : top ? 14 : car ? 17 : s ? s.shot : 0);
  sig.waves.push(top ? 0.7 : s ? s.waves * Math.max(s.envelope, s.wavelets) : 0);
  sig.focus.push(top ? 0.8 : s ? Math.min(1, s.focus) : 0);
  sig.slab.push(a ? a.cut : 0);
}
const out = {
  DUR, FRAMES, fps, T,
  contact: CONTACT,
  hookPulse: HOOK_PULSES[1],
  feelPulse: T.feel0,
  questionPulses: [T.feel1, T.button1 + 0.05],
  exactFlare: T.exact + 0.05,
  dive: T.under - 0.06,
  spotTicks: [TOP_A + 0.12, TOP_A + 0.55, TOP_A + 0.98, OBL_A + 0.08, OBL_A + 0.5, OBL_A + 0.92],
  dialTicks: [T.controls + 0.02, T.controls + 0.3, T.controls + 0.58, T.car + 0.05],
  carReveal: T.reaching + 0.1,
  playPress: T.screen,
  skinReturn: T.skin2 + 0.06,
  grab: T.you + 0.2,
  signals: sig,
};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v4.json', JSON.stringify(out));
console.log('cues_v4', FRAMES);
