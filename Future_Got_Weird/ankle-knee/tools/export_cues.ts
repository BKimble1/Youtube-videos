// Exports the picture's event times for the sound design (audio/cues.json): word times, shot boundaries, every
// cleat landing (detected from the rig's ankle heights), the ball strike, the sit, the toe wiggle.
// build: source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --loader:.tsx=tsx --outfile=/tmp/ec.cjs
import * as fs from 'fs';
import {T, pitchState, shotAt, CONTACT, ILL_END, benchState, bedState, illusState} from '../source/src/story';
import {joints} from '../source/src/art/wyatt';
import {DUR, FPS} from '../source/src/lib';

const out: Record<string, unknown> = {DUR, FPS, T, CONTACT, ILL_END};
const lands: {t: number; foot: string; shot: string}[] = [];
const prev: Record<string, number> = {};
for (let i = 0; i <= DUR * 600; i++) {
  const t = i / 600;
  const sh = shotAt(t);
  if (sh !== 'pitch1' && sh !== 'pitch6') { prev.n = prev.f = -100; continue; }
  const j = joints(pitchState(t).pose);
  for (const [k, y] of [['n', j.PA.y], ['f', j.FA.y]] as [string, number][]) {
    if (prev[k] !== undefined && prev[k] < -8.6 && y >= -8.0) lands.push({t: +t.toFixed(3), foot: k === 'n' ? 'prosthetic' : 'left', shot: sh});
    if (y < -8.6 || prev[k] === undefined || y >= -8.0) prev[k] = y;
  }
}
out.lands = lands;
// the sit: when the hip stops descending
let sitT = 0, minY = -1e9;
for (let t = ILL_END; t < T.when; t += 1 / 600) { const y = benchState(t).pose.y; if (y > minY) { minY = y; sitT = t; } }
out.sit = +sitT.toFixed(3);
// toe wiggle extremes and the rotation
const wig: number[] = [];
let last = 0, dir = 0;
for (let t = T.when; t < T.learned; t += 1 / 300) { const c = bedState(t).toeCurl; const d = Math.sign(c - last); if (dir > 0 && d < 0) wig.push(+t.toFixed(3)); if (d !== 0) dir = d; last = c; }
out.wiggle = wig;
const yawT: [number, number][] = [];
for (let t = T.wyatt; t < ILL_END; t += 1 / 30) yawT.push([+t.toFixed(3), +illusState(t).yaw.toFixed(1)]);
out.yaw = yawT;
const shots: [number, string][] = [];
let ps = '';
for (let f = 0; f < DUR * FPS; f++) { const s = shotAt(f / FPS); if (s !== ps) shots.push([+(f / FPS).toFixed(3), s]); ps = s; }
out.shots = shots;
fs.writeFileSync(process.argv[2] ?? 'audio/cues.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify({lands: lands.length, sit: out.sit, wiggle: wig, shots}, null, 0));
