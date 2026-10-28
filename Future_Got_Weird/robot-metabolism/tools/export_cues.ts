// Sound cues measured from the picture's own state (the same world functions the film renders), per frame:
//   motor activity = summed |dL/dt| of the working links (so every whir follows a real length change);
//   stick-tip and module-end slides; discrete events (contacts, the release, the failure, key presses, cuts).
// usage: node export_cues.cjs audio/cues.json
import fs from 'node:fs';
import {benchState, HOOK} from '../source/src/world/bench';
import {rampState, R0} from '../source/src/world/ramp';
import {runoutState, C0, EV} from '../source/src/world/runout';
import {FRAMES, FPS, WORDS, T, E} from '../source/src/lib/time';
import {SHOTS, KEYS} from '../source/src/shots';
import {len, sub, dist} from '../source/src/lib/v3';
import {Link} from '../source/src/rig/truss';

type Row = {f: number; t: number; world: string; mX: number; mT: number; mR: number; mP: number; tip: number; led: number};
const lens = (L: Link[]) => Object.fromEntries(L.map((l) => [l.id, len(sub(l.b, l.a))]));
const state = (t: number) => {
  if (t < R0) {
    const s = benchState(t);
    return {world: 'bench', L: lens(s.links), tip: s.X.b, ledX: s.X.led};
  }
  if (t < C0) {
    const s = rampState(t);
    return {world: 'ramp', L: lens([...s.links, ...s.plain]), tip: s.X.b, ledX: 1};
  }
  const s = runoutState(t);
  return {world: 'runout', L: lens(s.links), tip: s.R.b, ledX: s.X.led};
};
const rows: Row[] = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS, dt = 1 / FPS;
  const a = state(t), b = state(t + dt);
  const sum = (pre: string) => Object.keys(a.L).filter((k) => k.startsWith(pre) && b.L[k] !== undefined).reduce((s, k) => s + Math.abs(b.L[k] - a.L[k]) / dt, 0);
  rows.push({f, t: +t.toFixed(4), world: a.world, mX: +sum('X').toFixed(4), mT: +sum('T').toFixed(4), mR: +sum('R').toFixed(4), mP: +sum('P').toFixed(4),
    tip: a.world === b.world ? +(dist(a.tip, b.tip) / dt).toFixed(4) : 0, led: +a.ledX.toFixed(3)});
}
const ev = {
  hookContact: HOOK.contact,
  sectionOn: T('magnets') - 0.15,
  sectionOff: E('ends') + 0.05,
  keys: KEYS,
  stickSettle: T('once') - 0.05,
  die: EV.die,
  release: EV.release,
  lowered: EV.lower1,
  rContact: EV.contact,
};
const cuts = SHOTS.map((s) => s.from).filter((x) => x > 0);
fs.writeFileSync(process.argv[2], JSON.stringify({fps: FPS, frames: FRAMES, duration: FRAMES / FPS, words: WORDS, cuts, events: ev, shots: SHOTS.map((s) => ({id: s.id, from: s.from, to: Math.min(s.to, FRAMES / FPS)})), rows}, null, 0));
console.log('cues: ', JSON.stringify(ev), 'cuts', cuts.map((c) => c.toFixed(2)).join(' '));
