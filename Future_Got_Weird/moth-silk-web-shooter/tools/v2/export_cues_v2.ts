// V2 sound cues from the picture: key frames of the hook, the macro and the lab, the runner's footfalls (frames
// where a foot is planted), and when the blade's tip meets the tray floor. Writes JSON for tools/v2/make_audio_v2.py.
// build: source/node_modules/.bin/esbuild tools/v2/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec2.cjs && node /tmp/ec2.cjs audio/cues_v2.json
import * as fs from 'fs';
import TL from '../../source/src/data/timeline.json';
import {SA, runnerAt, streetCam, attachAt, scr, D_MID} from '../../source/src/v2/Street2';
import {MACRO} from '../../source/src/v2/Macro2';
import {LT2} from '../../source/src/v2/labWorld2';
import {labPhys, FLOOR} from '../../source/src/v2/labPhys2';
import {manJoints} from '../../source/src/v2/dc/Man';

const FPS = 30;
// footfalls: a foot's ankle reaching its lowest point after moving down (sampled per half frame)
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
let touch = LT2.touch;
for (let f = LT2.lower0; f < LT2.flat + 10; f += 0.5) {
  const P = labPhys(f);
  if (P.bladeT.y >= FLOOR - 3.01) {
    touch = f;
    break;
  }
}
const out = {
  DUR: TL.duration,
  WORDS: TL.words,
  fps: FPS,
  street: {fire: SA.fire / FPS, hit: SA.hit / FPS, taut: SA.taut / FPS, push0: SA.push0 / FPS, enter: SA.end / FPS},
  macro: {t0: MACRO.start / FPS, tight0: MACRO.tight0 / FPS, tight1: MACRO.tight1 / FPS, t1: MACRO.end / FPS},
  lab: Object.fromEntries(Object.entries(LT2).map(([k, v]) => [k, v / FPS])),
  bladeTouch: touch / FPS,
  steps,
};
void attachAt; void scr; void D_MID;
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('steps', steps.map((s) => `${s.t.toFixed(2)}${s.foot}`).join(' '), 'touch', (touch / FPS).toFixed(2));
