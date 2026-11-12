import fs from 'fs';
import {DUR, EVENTS, T, SEG, UV} from '../../source/src/v3/timing';
import {landings, swingStarts, sagEv} from '../../source/src/v3/robot';
import {CHAIN} from '../../source/src/v3/SignalWorld';
const out = {DUR, T, SEG, UV, spikes: EVENTS.map((e) => ({t: e.spike, amp: e.amp, kind: e.kind})), events: EVENTS,
  swings: swingStarts(), landings: landings(), sag: sagEv.start, stuck: EVENTS.filter((e) => e.kind === 'stuck').map((e) => e.start), chain: CHAIN};
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v3.json', JSON.stringify(out, null, 1));
console.log('cues v3:', out.spikes.length, 'spikes,', out.landings.length, 'landings, chain', JSON.stringify(CHAIN));
