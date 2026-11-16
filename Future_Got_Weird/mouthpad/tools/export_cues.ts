// Exports the picture's event times for the sound (audio/cues.json): word times, game fires/hits, strafes, cuts.
import {T} from '../source/src/story';
import {ENEMIES, FIRES, REX_FIRES, ZIPX, FLIGHT, gameAt} from '../source/src/gameplay';
import {SHOTS} from '../source/src/Film';
import {DUR} from '../source/src/lib';
import * as fs from 'fs';
// strafe events: segments of ZIPX where the position changes by > 0.5
const strafes: {t: number; dur: number; dir: number}[] = [];
for (let i = 0; i < ZIPX.length - 1; i++) {
  const [a, va] = ZIPX[i], [b, vb] = ZIPX[i + 1];
  if (Math.abs(vb - va) > 0.5 && b - a < 1.2) strafes.push({t: a, dur: b - a, dir: Math.sign(vb - va)});
}
// lock-on moments (lock rising through 0.5)
const locks: number[] = [];
let prev = 0;
for (let f = 0; f < Math.round(DUR * 30); f++) {
  const l = gameAt(f / 30).lock;
  if (prev < 0.5 && l >= 0.5) locks.push(f / 30);
  prev = l;
}
const out = {DUR, T, fires: FIRES.map((f) => ({t: f.t, hit: f.t + FLIGHT, rex: f.target === 'rex'})), enemies: ENEMIES, rexFires: REX_FIRES, strafes, locks,
  cuts: SHOTS.map((s) => ({name: s.name, t: s.a}))};
fs.writeFileSync(process.argv[2] ?? 'audio/cues.json', JSON.stringify(out, null, 1));
console.log('cues', out.fires.length, 'fires', strafes.length, 'strafes', locks.length, 'locks');
