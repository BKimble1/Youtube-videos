// Footstep timing for the mix (V2): every heel strike of every walker on screen, from the same gaits the picture
// uses, plus the lab retreat's foot landings. usage: bundle with esbuild, run with node; writes audio/footsteps.json
import {cafeFootsteps} from '../../source/src/scenes/Cafe';
import {corridorFootsteps} from '../../source/src/scenes/Corridor';
import {RETREAT_STEPS} from '../../source/src/scenes/labHero';
import * as fs from 'fs';

const steps = [
  ...RETREAT_STEPS.map((t) => ({t, foot: '', who: 'hero (lab retreat)', gain: 0.9})),
  ...cafeFootsteps(),
  ...corridorFootsteps(),
].map((s) => ({...s, t: +s.t.toFixed(3), gain: +s.gain.toFixed(2)})).sort((a, b) => a.t - b.t);
fs.writeFileSync(process.argv[2], JSON.stringify(steps, null, 1));
console.log(steps.length, 'steps');
