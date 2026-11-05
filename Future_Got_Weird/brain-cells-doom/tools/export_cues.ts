// Exports the picture's own events for the sound design (audio/cues.json): the game's shots, hits, kills, the attack
// and the hurt; stimulation pulses, response volleys and bursts in the culture; decoder commands; signal rides and the
// big camera moves; and, per frame, how much of the frame the game fills and whether we are at cell scale.
import * as fs from 'fs';
import {camAt, RIDES, ACT, cmdLevel, lensState} from '../source/src/story';
import {filmShots, gameState} from '../source/src/game/script';
import {GAME, CHIP} from '../source/src/lab/geo';
import {FRAMES} from '../source/src/lib';

const W = 1080, H = 1920;
const frames: {gameArea: number; micro: number; w: number; lens: number; enemyNear: number}[] = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / 30;
  const c = camAt(t);
  const s = W / c.w;
  const x0 = Math.max(0, W / 2 + s * (GAME.x0 - c.x)), x1 = Math.min(W, W / 2 + s * (GAME.x1 - c.x));
  const y0 = Math.max(0, H / 2 + s * (GAME.y0 - c.y)), y1 = Math.min(H, H / 2 + s * (GAME.y1 - c.y));
  const area = x1 > x0 && y1 > y0 ? ((x1 - x0) * (y1 - y0)) / (W * H) : 0;
  const ppu = (s * 1e-4);
  const g = gameState(t);
  let near = 0;
  for (const e of g.enemies) if (!e.pose.startsWith('die')) near = Math.max(near, 1 / Math.max(1, Math.hypot(e.x - g.x, e.y - g.y)));
  frames.push({gameArea: +area.toFixed(4), micro: +Math.min(1, Math.max(0, (Math.log(ppu) - Math.log(0.05)) / Math.log(10))).toFixed(3), w: +c.w.toFixed(4), lens: +lensState(t).a.toFixed(3), enemyNear: +near.toFixed(3)});
}
const cmds: {t: number; k: string}[] = [];
for (const k of ['move', 'turn', 'fire'] as const) {
  let prev = 0;
  for (let f = 0; f < FRAMES * 2; f++) {
    const t = f / 60;
    const v = cmdLevel(k, t);
    if (v > 0.5 && prev <= 0.5) cmds.push({t: +t.toFixed(3), k});
    prev = v;
  }
}
const out = {
  fps: 30, frames: FRAMES, duration: FRAMES / 30,
  shots: filmShots(),
  hurt: 21.36, attack: 21.2,
  stims: ACT.stims, resps: ACT.resps, bursts: ACT.bursts,
  cmds: cmds.sort((a, b) => a.t - b.t),
  rides: RIDES.map((r) => ({kind: r.kind, t0: r.t0, t1: r.t1, w0: r.w0, w1: r.w1})),
  perFrame: frames,
};
fs.mkdirSync('audio', {recursive: true});
fs.writeFileSync('audio/cues.json', JSON.stringify(out, null, 1));
const chk = (t: number) => frames[Math.round(t * 30)].gameArea;
console.log('game area around the hidden game cuts (must be 0):', [8.9, 8.97, 9.0, 9.03, 9.1].map(chk), [23.9, 23.97, 24.0, 24.03, 24.1].map(chk));
console.log('shots', out.shots.map((s) => s.t), 'cmds', out.cmds.length);
