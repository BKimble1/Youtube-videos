// Export V3's staged event times for tools/make_audio_v3.py, so every effect is placed from the picture's own timeline.
// build + run (from the time-machine folder):
//   npx --prefix source esbuild tools/export_cues_v3.ts --bundle --platform=node --outfile=/tmp/cues3.js --log-level=error
//   node /tmp/cues3.js source/src/v3/cues.json
import * as fs from 'fs';
import {T3} from '../source/src/v3/timing';
import * as S from '../source/src/v3/story';
import {footfalls} from '../source/src/v2/walk';

// footsteps land every step of travel (the same step lengths the scene's feet use)
const astroSteps = [T3.stepDown, ...footfalls((t) => S.astroReturn(t).s, T3.stepDown + 0.05, T3.arrive, S.YS, S.RET_STEP)];
const pathSteps = footfalls((t) => {
  const a = S.astroDoor(t);
  return a.dist / a.s;
}, T3.walk + 0.02, T3.inside - 0.01, 1, S.PATH_STEP);
const roomSteps = footfalls((t) => (S.DOOR3.cx - 10 - S.roomAstroX(t)) / S.RS, T3.inside, T3.roomStop + 0.05, 1, 100);
const EV = {
  ...T3,
  gate: S.T_GATE - 0.25,
  doorOpen: T3.inside - 0.46,
  astroSteps, doorSteps: [T3.walk + 0.1, ...pathSteps], roomSteps: [T3.inside + 0.02, ...roomSteps],
  friendSteps: [T3.friendIn + 0.15, T3.friendIn + 0.45],
};
fs.writeFileSync(process.argv[2], JSON.stringify({EV}, null, 1));
console.log('cues ->', process.argv[2], `(${astroSteps.length} return steps, ${pathSteps.length} path steps, ${roomSteps.length} room steps)`, JSON.stringify({astroSteps, pathSteps, roomSteps}));
