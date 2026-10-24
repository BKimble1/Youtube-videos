// Sound cues from the picture: every foot landing in the street (scene time mapped back to film time, with the
// distance to the camera), and the event times of the lab and process shots. Output: audio/cues.json
// build: source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
import * as fs from 'fs';
import {PLANTS, SLOW, streetCam, STREET_END, T, tauOf} from '../source/src/scenes/Street';
import {LT, SLIDE, T_TAUT, bladeAt, FLIGHT} from '../source/src/scenes/labWorld';
import {MACRO} from '../source/src/scenes/Macro';
import TL from '../source/src/data/timeline.json';

const realOf = (tau: number) => {
  let lo = -2, hi = 8;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (tauOf(m) < tau) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
};
const steps: {who: string; t: number; dist: number}[] = [];
for (const who of ['runner', 'her'] as const) {
  for (const side of ['L', 'R'] as const) {
    for (const p of PLANTS[who][side]) {
      if (p.t0 < -50) continue;
      const t = realOf(p.t0);
      if (t < 0 || t > STREET_END) continue;
      const c = streetCam(t).pos;
      steps.push({who, t: +t.toFixed(4), dist: +Math.hypot(c.x - p.x, c.y, c.z - p.z).toFixed(3)});
    }
  }
}
steps.sort((a, b) => a.t - b.t);
// when the blade's tip touches the tray floor, and when it lies down
let touch = 0, flat = 0;
for (let t = LT.lower0; t < LT.rest1 + 0.5; t += 1 / 120) {
  const b = bladeAt(t);
  if (!touch && Math.min(b.a.y, b.b.y) < 0.0035) touch = t;
  if (touch && !flat && Math.max(b.a.y, b.b.y) < 0.0035) flat = t;
}
const out = {DUR: TL.duration, WORDS: TL.words, steps, street: {...T, slow: SLOW, end: STREET_END}, lab: {...LT, taut: T_TAUT, slide: SLIDE, flight: FLIGHT, touch, flat}, macro: MACRO};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`${steps.length} steps; blade touch ${touch.toFixed(2)} flat ${flat.toFixed(2)}`);
