// V4 cues for the mix: timing constants, the whisper windows, and the leads' footfalls (from their walkers' plants).
import fs from 'node:fs';
import {DUR, FPS, T_BLOCK, T_CLEAR, FRAMES} from '../source/src/v4/core4';
import {WHISPER, WHISPER_LAB, SEC} from '../source/src/v4/cues4';
import {leadWalker, friendWalker, DUR as _d} from '../source/src/v4/story4';
void _d;
const steps: {t: number; who: string}[] = [];
const film = (tau: number) => (tau >= DUR ? tau - DUR : tau);
for (const [who, w] of [['lead', leadWalker], ['friend', friendWalker]] as const) {
  for (const arr of [w.plantsL, w.plantsR]) for (const p of arr.slice(1)) {
    if (p.t0 > DUR + 12 || p.t0 < 20) continue;
    const t = film(p.t0);
    // only where the atrium is on screen
    if ((t >= 0 && t < SEC.secIn) || t >= SEC.atrium2) steps.push({t: +t.toFixed(4), who});
  }
}
steps.sort((a, b) => a.t - b.t);
const out = {DUR, FPS, FRAMES, T_BLOCK, T_CLEAR, WHISPER, WHISPER_LAB, SEC, steps};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('steps', steps.length, steps.map((s) => `${s.who[0]}${s.t.toFixed(2)}`).join(' '));
