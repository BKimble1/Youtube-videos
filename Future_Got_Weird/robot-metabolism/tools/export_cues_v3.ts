// V3 sound cues measured from the V3 rig, per frame: motor activity (summed |dLp/dt| of the actuators of each module),
// the active stick tip's speed, the dropped stick's roll; plus the discrete events (contacts, the stall, the release,
// the fall, key presses, the cut-aways, cuts). usage: node export_cues_v3.cjs audio/cues_v3.json
import fs from 'node:fs';
import {world, EV, DUR} from '../source/src/v3/story';
import {resolve} from '../source/src/v3/rig';
import {PT} from '../source/src/v3/pair';
import {FRAMES, FPS, WORDS} from '../source/src/lib/time';
import {SHOTS3, KEYS3} from '../source/src/v3/shots3';
import {dist} from '../source/src/lib/v3';

const st = (t: number) => {
  const R = resolve(world(t));
  const L: Record<string, number> = {};
  const tips: Record<string, {x: number; y: number; z: number}> = {};
  for (const l of R.links) {
    L[l.id] = l.Lp;
    tips[l.id] = l.Cb;
  }
  return {L, tips};
};
const rows = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS, dt = 1 / FPS;
  const a = st(t), b = st(t + dt);
  const act = (ids: string[]) => ids.reduce((s, k) => s + (a.L[k] !== undefined && b.L[k] !== undefined ? Math.abs(b.L[k] - a.L[k]) / dt : 0), 0);
  const body = ['02', '03', '12', '13', '23'];
  // the end group's robot sounds exactly like the hero at the start (the loop)
  const stick = t < EV.release ? 'hS' : t >= EV.snapR ? 'hR' : '';
  rows.push({
    f, t: +t.toFixed(4),
    mBody: +act([...body.map((k) => `h${k}`), ...body.map((k) => `e${k}`)]).toFixed(4),
    mL: +act(['hL', 'eL']).toFixed(4),
    mS: +(t < EV.stall + 0.08 ? act(['hS']) : 0).toFixed(4),
    mR: +act(['hR']).toFixed(4),
    tip: stick ? +(dist(a.tips[stick], b.tips[stick]) / dt).toFixed(4) : 0,
  });
}
const ev = {
  snaps: [PT.snap1, PT.snap2, EV.snapS, EV.snapR],
  stall: EV.stall,
  dark: EV.dark,
  release: EV.release,
  fallEnd: EV.fall[1],
  drop: EV.drop[1],
  roll: EV.roll,
  keys: KEYS3,
  cutOpen: EV.cut[0],
  secOpen: EV.sec[0],
  rise: [PT.r0, PT.r1],
  support: [EV.support[0], EV.supportR[0]],
};
const cuts = SHOTS3.map((s) => s.from).filter((x) => x > 0 && x < DUR);
fs.writeFileSync(process.argv[2], JSON.stringify({fps: FPS, frames: FRAMES, duration: DUR, words: WORDS, cuts, events: ev, rows}));
console.log(JSON.stringify(ev), 'cuts', cuts.map((c) => c.toFixed(2)).join(' '));
