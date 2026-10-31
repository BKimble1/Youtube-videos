// Export the picture's event times and the stalks' pulse strength (story.ts) for the sound mix:
// tools/make_audio.py places every effect from these, so sound and picture share one timeline.
import * as fs from 'fs';
import {DUR} from '../source/src/lib';
import {EV, T, snail1, snail2} from '../source/src/story';

const pulse: number[] = [];
for (let i = 0; i <= Math.round(DUR * 100); i++) {
  const t = i / 100;
  // the infected stalk on screen: snail 1 until the peck tears it off; snail 2's stalk as it blooms at the end
  const p = t < EV.peck + 0.05 ? snail1(t).near.pulse : t > EV.bloom0 ? snail2(t).near.pulse : 0;
  pulse.push(Math.round(p * 1000) / 1000);
}
const out = {DUR, EV, T, pulseHz: 1.55, pulse};
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log('cues ->', process.argv[2], Object.keys(EV).length, 'events');
