// V6 face and head probe: for every frame he is on screen, the frame-to-frame change of his head turn (0..1, the 3/4
// angle), neck tilt (deg), gaze (gx, gy, -1..1) and mouth opening, and the largest single-frame jump of each (a pop
// shows as a jump; an eased move spreads over several frames). Blinks (lid) are reported separately: they are meant
// to be quick. usage: bundle with esbuild, run with node <out.json>
import * as fs from 'fs';
import {heroLab, LAB_IN} from '../../source/src/v6/hero6';
import {LAB_OUT} from '../../source/src/v6/Lab6';
import {cafeHero, E_OUT, G_IN} from '../../source/src/v6/Cafe6';
import {DUR} from '../../source/src/lib';

type S = {turn: number; neck: number; gx: number; gy: number; open: number; lid: number};
const at = (t: number): S | null => {
  if (t < LAB_OUT || t >= LAB_IN) { const h = heroLab(t); return {turn: h.p.turn, neck: h.p.neck, gx: h.x.gx, gy: h.x.gy, open: h.x.open, lid: h.x.lid}; }
  if ((t >= LAB_OUT && t < E_OUT) || t >= G_IN) { const c = cafeHero(t); return {turn: c.hp.turn, neck: c.hp.neck, gx: c.ex.gx, gy: c.ex.gy, open: c.ex.open, lid: c.ex.lid}; }
  return null;
};
const N = Math.round(DUR * 30);
const keys: (keyof S)[] = ['turn', 'neck', 'gx', 'gy', 'open', 'lid'];
const max: Record<string, {d: number; f: number}> = Object.fromEntries(keys.map((k) => [k, {d: 0, f: -1}]));
for (let f = 0; f < N; f++) {
  const a = at(f / 30), b = at(((f + 1) % N) / 30);
  if (!a || !b) continue;
  // shot changes between the lab and the café are cuts (different shots), not continuous motion
  const sameScene = (f / 30 < LAB_OUT) === (((f + 1) % N) / 30 < LAB_OUT) || f === N - 1;
  if (!sameScene) continue;
  for (const k of keys) { const d = Math.abs(b[k] - a[k]); if (d > max[k].d) max[k] = {d: +d.toFixed(3), f}; }
}
console.log(JSON.stringify(max));
fs.writeFileSync(process.argv[2], JSON.stringify({maxPerFrame: max, note: 'turn: 0..1 head angle; neck: deg; gx, gy: gaze -1..1; open: mouth 0..1; lid: blink'}, null, 1));
