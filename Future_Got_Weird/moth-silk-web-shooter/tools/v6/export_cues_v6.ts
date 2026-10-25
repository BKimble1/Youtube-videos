// V6 sound cues from the picture: key frames of the hook (Street6 SA), the material close-up (Macro6 MC) and the lab
// (LT6), the runner's footfalls (frames where a foot is planted; the street plays at film frames 0-95 and again as the
// pre-roll at the end, street frame f < 0 = film frame f + 952).
// Writes JSON for tools/v6/make_audio_v6.py.
// build: source/node_modules/.bin/esbuild tools/v6/export_cues_v6.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec6.cjs && node /tmp/ec6.cjs audio/cues_v6.json
import * as fs from 'fs';
import TL from '../../source/src/data/timeline.json';
import {SA, runnerAt, streetCam} from '../../source/src/v6/Street6';
import {MC} from '../../source/src/v6/Macro6';
import {LT6} from '../../source/src/v6/labWorld6';
import {manJoints} from '../../source/src/v6/dc/Man';

const FPS = 30;
const FILM = 952;
const filmT = (f: number) => (f < 0 ? f + FILM : f) / FPS;
const steps: {t: number; foot: string; zoom: number}[] = [];
for (const foot of ['l', 'r'] as const) {
  let prevY = -1e9;
  let falling = false;
  for (let f = SA.pre; f <= SA.taut + 22; f += 0.5) {
    const j = manJoints(runnerAt(f));
    const y = (foot === 'l' ? j.lLeg.A : j.rLeg.A).y;
    if (y > prevY + 0.05) falling = true;
    else if (falling && y < prevY - 0.05) {
      steps.push({t: filmT(f - 0.5), foot, zoom: streetCam(f).z});
      falling = false;
    }
    prevY = y;
  }
}
steps.sort((a, b) => a.t - b.t);
const sec = (o: Record<string, number>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v / FPS]));
const out = {DUR: TL.duration, WORDS: TL.words, fps: FPS, film: FILM, street: sec(SA), macro: sec(MC), lab: sec(LT6), steps};
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('steps', steps.map((s) => `${s.t.toFixed(2)}${s.foot}`).join(' '));
