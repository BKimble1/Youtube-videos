// V2: exports the picture's own event times and per-frame signals for the mix (audio/cues_v2.json).
// usage: (cd source && npx esbuild ../tools/v2/export_cues2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c2.cjs) && node /tmp/c2.cjs audio/cues_v2.json
import * as fs from 'fs';
import {T} from '../../source/src/it/timing';
import {lab2At, lab2EndAt, TOP_A, TOP_B, PULSE_OPEN} from '../../source/src/v2/shots2';
import {car2Active} from '../../source/src/v2/car2';
import {lobby2Active, lobbyExit} from '../../source/src/v2/lobby2';
import {FRAMES, DUR} from '../../source/src/lib';

const fps = 30;
const sig: Record<string, number[]> = {waves: [], focus: [], section: [], scene: [], shot: [], rays: []};
for (let f = 0; f < FRAMES; f++) {
  const t = f / fps;
  const a = lab2At(t);
  const top = !a && t >= TOP_A && t < TOP_B;
  const car = !a && !top && car2Active(t);
  const lob = !a && !top && !car && lobby2Active(t);
  const s = a ?? (top || car || lob ? null : lab2EndAt(t, lobbyExit()));
  sig.scene.push(car ? 1 : lob ? 2 : 0);
  sig.shot.push(a ? a.shot : top ? 14 : car ? 17 : lob ? 20 : s ? s.shot : 0);
  sig.waves.push(top ? 0.7 : s ? s.waves * Math.max(s.envelope, s.wavelets) : 0);
  sig.focus.push(top ? 0.8 : s ? Math.min(1, s.focus) : 0);
  sig.section.push(s ? s.section : 0);
  sig.rays.push(s ? s.rays : 0);
}
const out = {
  DUR, FRAMES, fps, T,
  openPulses: PULSE_OPEN,
  feelPulse: T.feel0,
  questionPulses: [T.feel1, T.button1 + 0.05],
  exactFlare: T.exact + 0.05,
  dive: T.under - 0.06,
  dialTicks: [T.controls + 0.02, T.controls + 0.3, T.controls + 0.58, T.car + 0.05],
  carReveal: T.reaching + 0.1,
  kioskPress: T.screen,
  doors: T.screen + 0.15,
  skinReturn: T.skin2 + 0.12,
  grab: T.you + 0.1,
  signals: sig,
};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v2.json', JSON.stringify(out));
console.log('cues_v2', FRAMES);
