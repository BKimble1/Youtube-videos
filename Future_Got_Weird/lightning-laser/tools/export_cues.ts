// Sound cues from the picture's own event times (the same constants the shots use), so effects follow the picture.
// usage: bundle with esbuild (see README) and run with node: node ec.cjs audio/cues.json
import * as fs from 'fs';
import TL from '../source/src/data/timeline.json';
import {T, hF} from '../source/src/shots';
import {VG} from '../source/src/scenes/Vignette';
import {DEMO_CONNECT, DEMO_T0, LOOP_CONNECT, LOOP_START} from '../source/src/world/site';

const DUR = TL.duration;
// the moments the followed pulse and the following ones emerge from the exit (F) and pass the molecular view (G-I)
const emerge: number[] = [];
for (let k = -4; k <= 3; k++) {
  // pulse k is at hF(t) + k*260; it leaves the exit (h = -880) when hF(t) = -880 - k*260
  for (let t = T.E0; t < T.G0; t += 1 / 300) {
    if (hF(t) + k * 260 >= -880) { if (t > T.E0 + 0.01) emerge.push(+t.toFixed(3)); break; }
  }
}
const microPass = [0, 1, 2, 3].map((k) => +(T.GM + (k * 1500) / 700).toFixed(3)).filter((t) => t < T.J0);
const out = {
  duration: DUR, words: TL.words, T, VG,
  loop: {start: DUR + LOOP_START, connect: LOOP_CONNECT},
  demo: {start: DEMO_T0, connect: DEMO_CONNECT},
  knob: T.C0 + 0.3,
  emerge, microPass, front: [15.9, 17.45], channelGrow: [29.25, 31.0],
};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(JSON.stringify({loop: out.loop, demo: out.demo, emerge, microPass}));
