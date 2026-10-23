// V3: the picture's event timeline for the V3 sound mix: every foot landing of both characters (from the simulated
// steps, folded back onto the film's clock), with the camera's distance to that foot; the torch's sweep rate per frame;
// the shield's speed per frame. usage: bundle with esbuild (platform node), then: node export_cues_v3.cjs audio/cues_v3.json
import fs from 'node:fs';
import {DUR, FPS, WORDS} from '../source/src/world';
import {camAt, shieldAt, STEPS, SHOT, torchAimRaw} from '../source/src/v3/story3';
import {PERIOD} from '../source/src/v3/Corridor3';

const steps: {who: string; foot: string; t: number; h: number; dist: number}[] = [];
(['her', 'guard'] as const).forEach((who) => (['l', 'r'] as const).forEach((foot) => {
  STEPS[who][foot].forEach((p) => {
    if (!Number.isFinite(p.t1)) return;
    const t = p.t1 >= DUR ? p.t1 - DUR : p.t1;
    const z = p.t1 >= DUR ? p.p.z + PERIOD : p.p.z;
    const c = camAt(t).pos;
    steps.push({who, foot, t, h: p.h ?? 0.06, dist: Math.hypot(c.x - p.p.x, c.y, c.z - z)});
  });
}));
steps.sort((a, b) => a.t - b.t);
const n = Math.round(DUR * FPS);
const frames = [];
for (let f = 0; f < n; f++) {
  const t = f / FPS;
  const a0 = torchAimRaw(t), a1 = torchAimRaw(t + 1 / FPS);
  frames.push({t, torch: Math.hypot(a1.x - a0.x, a1.y - a0.y, a1.z - a0.z) * FPS, shield: shieldAt(t).speed});
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, FPS, SHOT, WORDS, steps, frames}));
console.log('wrote', process.argv[2], steps.length, 'steps');
