// V2 sound cues measured from the V2 picture state, per frame: motor activity (summed |dL/dt| of the working links of
// each module), stick-tip speed, the dropped module's roll; plus the discrete events (contacts, releases, the fall,
// key presses, cuts). usage: node export_cues_v2.cjs audio/cues_v2.json
import fs from 'node:fs';
import {earlyState, lateState, EARLY_END, L0, SNAP_S, LEV, DUR} from '../source/src/v2/yard';
import {ramp2State} from '../source/src/v2/ramp2';
import {PT} from '../source/src/v2/pair';
import {FRAMES, FPS, WORDS, T, E} from '../source/src/lib/time';
import {SHOTS2, KEYS2} from '../source/src/v2/shots2';
import {len, sub, dist} from '../source/src/lib/v3';
import {Link} from '../source/src/rig/truss';

const lens = (L: Link[]) => Object.fromEntries(L.map((l) => [l.id, len(sub(l.b, l.a))]));
const st = (t: number) => {
  if (t < EARLY_END) {
    const s = earlyState(t);
    return {w: 'early', L: lens(s.links), tip: s.S.b, O2: {} as Record<string, number>};
  }
  if (t < L0) {
    const s = ramp2State(t);
    return {w: 'ramp', L: lens(s.links), tip: s.links.find((l) => l.id === 'S')!.b, O2: {}};
  }
  const s = lateState(t);
  return {w: 'late', L: lens(s.links), tip: s.R.b, O2: lens(s.pair.links)};
};
const rows = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS, dt = 1 / FPS;
  const a = st(t), b = st(t + dt);
  const act = (pre: string, A = a.L, B = b.L) => Object.keys(A).filter((k) => k.startsWith(pre) && B[k] !== undefined).reduce((s, k) => s + Math.abs(B[k] - A[k]) / dt, 0);
  // the second robot at the end sounds exactly like the first one at the start (the loop)
  rows.push({f, t: +t.toFixed(4), world: a.w, mBody: +(act('O') + act('T') + act('O', a.O2, b.O2)).toFixed(4), mM: +(act('M') + act('M', a.O2, b.O2)).toFixed(4), mS: +act('S').toFixed(4), mR: +act('R').toFixed(4),
    tip: a.w === b.w ? +(dist(a.tip, b.tip) / dt).toFixed(4) : 0});
}
const ev = {
  snaps: [PT.snap1, PT.snap2, SNAP_S, LEV.contact],
  releaseM_end: DUR + -0.7, // the loop's pre-roll: M lets go of the broken robot
  releaseS: LEV.release,
  fallS: LEV.fall1,
  roll: [LEV.fall1 + 0.02, LEV.roll1],
  keys: KEYS2,
  cutOpen: T('stretch') - 0.2,
  secOpen: T('magnets') - 0.2,
  die: LEV.die,
  rise: [PT.snap2 + 0.05, PT.risen],
};
const cuts = SHOTS2.map((s) => s.from).filter((x) => x > 0 && x < DUR);
fs.writeFileSync(process.argv[2], JSON.stringify({fps: FPS, frames: FRAMES, duration: DUR, words: WORDS, cuts, events: ev, rows}));
console.log(JSON.stringify(ev), 'cuts', cuts.map((c) => c.toFixed(2)).join(' '));
void E;
