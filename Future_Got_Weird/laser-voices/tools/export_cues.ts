// Writes the picture's event timeline (source/src/story.ts, Film.tsx) to JSON for the sound mix, so every sound sits
// on the frame it belongs to and the message gate is the SAME function the picture uses.
//   per frame: received (message audible to her), messageOn, blocked, camera distance to the bystander and to her ear
//   events: the bystander's heel strikes (from the planted-foot walk), section open/close, magnifier open/close, the
//   sweep strokes, the 8 FT reveal
// usage: bundle with esbuild (platform node), then: node export_cues.cjs audio/cues.json
import fs from 'node:fs';
import {DUR, FPS, WORDS} from '../source/src/world';
import {blockedAt, byAt, EARP, messageOn, received, WALK} from '../source/src/story';
import {camAt} from '../source/src/cams';
import {MAG, OV} from '../source/src/timing';
import {SWEEP_HZ} from '../source/src/Overlay';

const n = Math.round(DUR * FPS);
const frames = [];
for (let f = 0; f < n; f++) {
  const t = f / FPS;
  const c = camAt(t).pos;
  const b = byAt(t);
  frames.push({t, received: received(t) ? 1 : 0, msg: messageOn(t) ? 1 : 0, blocked: blockedAt(t) ? 1 : 0,
    byD: Math.hypot(c.x - b.pos.x, c.y - 0.3, c.z - b.pos.z), earD: Math.hypot(c.x - EARP.x, c.y - EARP.y, c.z - EARP.z)});
}
// heel strikes: a foot coming down to the floor (ankle height back to its standing value), sampled at 240 Hz
const strikes: {t: number; foot: string}[] = [];
const dt = 1 / 240;
let prev = byAt(0).feet!;
for (let t = dt; t < DUR; t += dt) {
  const cur = byAt(t).feet!;
  for (const k of ['l', 'r'] as const) if (prev[k].y > 0.0665 && cur[k].y <= 0.0665) strikes.push({t, foot: k});
  prev = cur;
}
fs.writeFileSync(process.argv[2], JSON.stringify({DUR, FPS, WORDS, WALK, MAG, OV, SWEEP_HZ, strikes, frames}));
console.log('wrote', process.argv[2], n, 'frames', strikes.length, 'strikes');
