// Exports the picture's own event times and per-frame signals for the mix (audio/cues.json).
// usage: npx --prefix source esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/c.cjs && node /tmp/c.cjs
import * as fs from 'fs';

import {T} from '../source/src/it/timing';
import {labAt, labEndAt, PULSES, LAB_CUT_T} from '../source/src/it/labShots';
import {carActive} from '../source/src/it/car';
import {kioskActive} from '../source/src/it/kiosk';
import {FRAMES, DUR} from '../source/src/lib';

const fps = 30;
const sig: Record<string, number[]> = {waves: [], focus: [], macro: [], section: [], scene: [], card: [], grab: []};
for (let f = 0; f < FRAMES; f++) {
  const t = f / fps;
  const a = labAt(t);
  const b = a ? null : carActive(t) || kioskActive(t) ? null : labEndAt(t);
  const s = a ?? b;
  sig.scene.push(a ? 0 : carActive(t) ? 1 : kioskActive(t) ? 2 : 0);
  sig.waves.push(s ? s.waves * Math.max(s.envelope, s.wavelets) : 0);
  sig.focus.push(s ? s.focus : 0);
  sig.macro.push(s ? s.macro : 0);
  sig.section.push(s ? s.section : 0);
  sig.card.push(s && s.card !== null ? s.card : 999);
  sig.grab.push(0);
}
const cuts = [T.look - 0.05, T.so - 0.07, T.feel1 - 0.06, T.move - 0.03, T.noGlove - 0.12, T.no2 - 0.06, T.now - 0.03, T.without - 0.05, T.and2 - 0.025];
const out = {
  DUR, FRAMES, fps, T, cuts, LAB_CUT_T,
  pulses: PULSES.filter((x) => x >= 0),
  macroPulses: [T.feel1 + 0.02, T.button1 + 0.1],
  endPulses: [T.feel3 + 0.05],
  dialTicks: [T.controls + 0.02, T.controls + 0.3, T.controls + 0.58, T.car + 0.05],
  kioskPress: T.screen,
  signals: sig,
};
fs.writeFileSync(process.argv[2] ?? 'audio/cues.json', JSON.stringify(out));
console.log('cues', Object.keys(out), FRAMES);
