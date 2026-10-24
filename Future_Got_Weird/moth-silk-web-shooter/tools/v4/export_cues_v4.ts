// V4 sound cues from the picture: key frames of the hook, the device bridge and the lab, the runner's footfalls
// (frames where a foot is planted), and when the blade's tip meets the tray floor. Writes JSON for
// tools/v4/make_audio_v4.py.
// build: source/node_modules/.bin/esbuild tools/v4/export_cues_v4.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec4.cjs && node /tmp/ec4.cjs audio/cues_v4.json
import * as fs from 'fs';
import TL from '../../source/src/data/timeline.json';
import {SA, runnerAt, streetCam} from '../../source/src/v4/Street4';
import {DV} from '../../source/src/v4/Device4';
import {LT4} from '../../source/src/v4/labWorld4';
import {labPhys, FLOOR} from '../../source/src/v4/labPhys4';
import {manJoints} from '../../source/src/v4/dc/Man';

const FPS = 30;
const steps: {t: number; foot: string; zoom: number}[] = [];
for (const foot of ['l', 'r'] as const) {
  let prevY = -1e9;
  let falling = false;
  for (let f = 0; f <= SA.taut + 22; f += 0.5) {
    const j = manJoints(runnerAt(f));
    const y = (foot === 'l' ? j.lLeg.A : j.rLeg.A).y;
    if (y > prevY + 0.05) falling = true;
    else if (falling && y < prevY - 0.05) {
      steps.push({t: (f - 0.5) / FPS, foot, zoom: streetCam(f).z});
      falling = false;
    }
    prevY = y;
  }
}
steps.sort((a, b) => a.t - b.t);
let touch = LT4.touch;
for (let f = LT4.lower0; f < LT4.flat + 10; f += 0.5) {
  if (labPhys(f).bladeT.y >= FLOOR - 3.01) {
    touch = f;
    break;
  }
}
const sec = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v / FPS]));
const out = {DUR: TL.duration, WORDS: TL.words, fps: FPS, street: sec(SA), device: sec(DV), lab: sec(LT4), bladeTouch: touch / FPS, steps};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('steps', steps.map((s) => `${s.t.toFixed(2)}${s.foot}`).join(' '), 'touch', (touch / FPS).toFixed(2));
