// Export V3's staged event times for tools/make_audio_v3.py, so every effect is placed from the picture's own timeline.
// build + run (from the time-machine folder):
//   npx --prefix source esbuild tools/export_cues_v3.ts --bundle --platform=node --outfile=/tmp/cues3.js --log-level=error
//   node /tmp/cues3.js source/src/v3/cues.json
import * as fs from 'fs';
import {T3} from '../source/src/v3/timing';
import * as S from '../source/src/v3/story';

// footsteps land when each planted foot comes down (the same gait the scene draws)
const astroSteps = S.returnSteps();
const pathSteps = S.doorWalkSteps();
const roomSteps = S.roomWalkSteps();
const EV = {
  ...T3,
  gate: S.T_GATE - 0.25,
  doorOpen: T3.inside - 0.46,
  astroSteps, doorSteps: pathSteps, roomSteps,
  friendSteps: [T3.friendIn + 0.15, T3.friendIn + 0.45],
};
fs.writeFileSync(process.argv[2], JSON.stringify({EV}, null, 1));
console.log('cues ->', process.argv[2], `(${astroSteps.length} return steps, ${pathSteps.length} path steps, ${roomSteps.length} room steps)`, JSON.stringify({astroSteps, pathSteps, roomSteps}));
