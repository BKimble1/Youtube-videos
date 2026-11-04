// V4 sound cues, exported from the picture's own timing (so sound and picture share one timeline):
// audio/cues_v4.json — the shot windows, the beat times, and 100 Hz signals (the predator's gill cover in the exterior
// shots, how fast the eel slides out of the gill, the swimmer's tail-beat phase).
//   npx esbuild tools/v4/export_cues.ts --bundle --platform=node --loader:.tsx=tsx --jsx=automatic --outfile=/tmp/c.js && node /tmp/c.js
import * as fs from 'fs';
import * as path from 'path';
import {SHOTS, T} from '../../source/src/v4/timing';
import {outAt, T_REL} from '../../source/src/v4/escape';
import {EXT} from '../../source/src/v4/shots/Exterior';
import * as X from '../../source/src/v4/shots/S3Xray';
import * as S from '../../source/src/v4/shots/S4Stomach';
import * as G from '../../source/src/v4/shots/S5Throat';
import TL from '../../source/src/data/timeline.json';

const DUR = (TL as any).duration as number;
const n = Math.round(DUR * 100);
const gill: number[] = [], outV: number[] = [], shot: string[] = [];
for (let i = 0; i <= n; i++) {
  const t = i / 100;
  const sh = SHOTS.find((s) => t >= s.t0 && t < s.t1) ?? SHOTS[SHOTS.length - 1];
  shot.push(sh.id);
  const ext = EXT[sh.id === 'loop' ? 'swim' : sh.id];
  gill.push(ext ? +ext(t).pose.gill.toFixed(4) : 0);
  outV.push(t >= T.poke && t < T_REL ? +((outAt(t + 0.005) - outAt(t - 0.005)) / 0.01).toFixed(3) : 0);
}
const SB = (S as any).S4_BEATS, GB = (G as any).G_BEATS;
const beats = {
  carry: 5.62,
  probeTouches: [SB.bump, 7.76, 7.93, SB.press],
  found: SB.yield,
  through: SB.dive,
  pass: GB.cut,
  slip: GB.gap,
  reedPasses: [] as number[],
  S4: SB,
  G: GB,
};
const out = {DUR, T, T_REL, XRAY_CHANGE_T: (X as any).XRAY_CHANGE_T ?? 4.0, beats, signals: {rate: 100, gill, outV, shot}};
fs.writeFileSync(path.join(process.cwd(), 'audio/cues_v4.json'), JSON.stringify(out));
console.log('cues_v4.json', Object.keys(out), 'beats', beats);
