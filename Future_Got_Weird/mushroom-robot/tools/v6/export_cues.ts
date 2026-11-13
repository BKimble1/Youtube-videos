import fs from 'fs';
import {DUR, EVENTS, T, SEG, UV} from '../../source/src/v6/timing';
import {landings, swingStarts, sagEv} from '../../source/src/v6/robot';
import {CHAIN} from '../../source/src/v6/SignalWorld';
import {SHOTS} from '../../source/src/v6/shots';
const out = {DUR, T, SEG, UV, spikes: EVENTS.map((e) => ({t: e.spike, amp: e.amp, kind: e.kind})), events: EVENTS,
  swings: swingStarts(), landings: landings(), sag: sagEv.start, stuck: EVENTS.filter((e) => e.kind === 'stuck').map((e) => e.start), chain: CHAIN, shots: SHOTS.map((s) => ({t0: s.t0, t1: s.t1, kind: s.kind, name: s.name}))};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v6.json', JSON.stringify(out, null, 1));
console.log('cues v6:', out.spikes.length, 'spikes,', out.landings.length, 'landings, chain', JSON.stringify(CHAIN));
