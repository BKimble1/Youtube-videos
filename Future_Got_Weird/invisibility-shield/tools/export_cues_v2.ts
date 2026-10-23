// V2: writes the picture's event timeline (source/src/v2/story.ts) to JSON for the V2 sound mix, so every effect sits
// on the frame it belongs to. Per-frame: camera distances to the guard and to her, the guard's and her gait amount and phase (heel strikes), the shield's speed,
// the torch's sweep rate; plus the shot table and the word timings.
// usage: bundle with esbuild (platform node), then: node export_cues_v2.cjs audio/cues_v2.json
import fs from 'node:fs';
import {DUR, FPS, WORDS} from '../source/src/world';
import {SHOT, camAt, guardAt, shieldAt, torchAim, womanAt} from '../source/src/v2/story';

const n = Math.round(DUR * FPS);
const frames = [];
for (let f = 0; f < n; f++) {
  const t = f / FPS;
  const g = guardAt(t), w = womanAt(t), s = shieldAt(t);
  const a0 = torchAim(t), a1 = torchAim(t + 1 / FPS);
  const c = camAt(t).pos;
  // distances from the camera to each of them (effects are levelled by where the camera is)
  const gD = Math.hypot(c.x - g.pos.x, c.y - 1.0, c.z - g.pos.z), wD = Math.hypot(c.x - w.pos.x, c.y - 0.8, c.z - w.pos.z);
  frames.push({t, gD, wD, gWalk: g.walk, gAmt: g.walkAmt, wWalk: w.walk, wAmt: w.walkAmt, shSpeed: s.speed,
    torch: Math.hypot(a1.x - a0.x, a1.y - a0.y, a1.z - a0.z) * FPS});
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, FPS, SHOT, WORDS, frames}));
console.log('wrote', process.argv[2], n, 'frames');
