// Write the Rocket Short's picture events (from the same model the animation uses) for the sound bed:
//   npx tsx ../tools/export_rocket_events.ts   (run from source/) -> source/src/data/rocket_events.json
import fs from 'node:fs';
import {T, WIPE, TOUCH_T, AER_IN, AER_TOUCH, DURATION, LOOP_T} from '../source/src/rocket/data';
import {BURSTS, PITCH_SEGS, heightAt, nozzleAt} from '../source/src/rocket/sim';

const lift: [number, number, number][] = [];
for (let t = 3.0; t <= WIPE + 0.1; t += 1 / 60) {
  const n = nozzleAt(t);
  lift.push([+t.toFixed(4), +((n.front + n.rear) / 2).toFixed(3), +heightAt(t).toFixed(1)]);
}
const out = {T, WIPE, TOUCH_T, AER_IN, AER_TOUCH, DURATION, LOOP_T, BURSTS, PITCH_SEGS, lift};
fs.writeFileSync('src/data/rocket_events.json', JSON.stringify(out));
console.log('events', Object.keys(out).join(', '), lift.length);
