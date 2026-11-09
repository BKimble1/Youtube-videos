// V3: the picture's own event times and per-frame signals for the mix (audio/cues_v3.json).
// usage: (cd source && npx esbuild ../tools/v3/export_cues3.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c3.cjs) && node /tmp/c3.cjs audio/cues_v3.json
import * as fs from 'fs';
import {T} from '../../source/src/it/timing';
import {lab3At, lab3EndAt, PULSE3, SLAB_A, SLAB_B} from '../../source/src/v3/shots3';
import {TOP_A, TOP_B} from '../../source/src/v2/shots2';
import {car3Active} from '../../source/src/v3/car3';
import {FRAMES, DUR} from '../../source/src/lib';

const fps = 30;
const sig: Record<string, number[]> = {waves: [], focus: [], slab: [], scene: [], shot: []};
for (let f = 0; f < FRAMES; f++) {
  const t = f / fps;
  const a = lab3At(t);
  const top = !a && t >= TOP_A && t < TOP_B;
  const car = !a && !top && car3Active(t);
  const s = a ?? (top || car ? null : lab3EndAt(t));
  sig.scene.push(car ? 1 : 0);
  sig.shot.push(a ? a.shot : top ? 14 : car ? 17 : s ? s.shot : 0);
  sig.waves.push(top ? 0.7 : s ? s.waves * Math.max(s.envelope, s.wavelets) : 0);
  sig.focus.push(top ? 0.8 : s ? Math.min(1, s.focus) : 0);
  sig.slab.push(t >= SLAB_A && t < SLAB_B ? 1 : 0);
}
const out = {
  DUR, FRAMES, fps, T,
  openPulses: [-0.12, T.end - 0.12],
  hookPulse: PULSE3[1],
  feelPulse: T.feel0,
  questionPulses: [T.feel1, T.button1 + 0.05],
  exactFlare: T.exact + 0.05,
  dive: T.under - 0.06,
  slab: [SLAB_A, SLAB_B],
  dialTicks: [T.controls + 0.02, T.controls + 0.3, T.controls + 0.58, T.car + 0.05],
  carReveal: T.reaching + 0.1,
  playPress: T.screen,
  skinReturn: T.skin2 + 0.06,
  grab: T.you + 0.25,
  signals: sig,
};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v3.json', JSON.stringify(out));
console.log('cues_v3', FRAMES);
