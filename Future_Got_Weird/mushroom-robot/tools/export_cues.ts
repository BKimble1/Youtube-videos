// Every sound is placed from the picture's own events: export them (one period) for tools/make_audio.py.
import fs from 'fs';
import {DUR, EVENTS, T, SEG, UV} from '../source/src/timing';
import {T_CONTACT, landings, swingStarts, splatEv} from '../source/src/robot';
import {pulseY} from '../source/src/SignalWorld';
const cross = (y: number) => { let a = T.fired, b = SEG.wipe0; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (pulseY(m) < y) a = m; else b = m; } return (a + b) / 2; };
const out = {
  DUR, T, SEG, UV, T_CONTACT,
  spikes: EVENTS.map((e) => ({t: e.spike, amp: e.amp, kind: e.kind})),
  events: EVENTS,
  swings: swingStarts(),
  landings: landings(),
  splat: splatEv.start,
  stuck: EVENTS.filter((e) => e.kind === 'stuck').map((e) => e.start + e.D * 0.8),
  chain: {amp: cross(3.15), filter: cross(4.55), detect: cross(5.95), valve: cross(7.55)},
};
fs.writeFileSync(process.argv[2] ?? 'audio/cues.json', JSON.stringify(out, null, 1));
console.log('cues', out.spikes.length, 'spikes', out.landings.length, 'landings', JSON.stringify(out.chain));
