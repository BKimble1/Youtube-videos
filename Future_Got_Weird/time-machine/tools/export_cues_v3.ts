// Export V3's staged event times for tools/make_audio_v3.py, so every effect is placed from the picture's own timeline.
// build + run (from the time-machine folder):
//   npx --prefix source esbuild tools/export_cues_v3.ts --bundle --platform=node --outfile=/tmp/cues3.js --log-level=error
//   node /tmp/cues3.js source/src/v3/cues.json
import * as fs from 'fs';
import {T3} from '../source/src/v3/timing';
import * as S from '../source/src/v3/story';
import {footfalls, DOOR_STEP} from '../source/src/v2/walk';

const astroSteps = [T3.stepDown, ...footfalls(S.astroReturnX, T3.stepDown + 0.05, T3.arrive, S.YS)];
const doorSteps = footfalls((t) => {
  const a = S.astroDoor(t);
  return Math.hypot(a.x - S.ASTRO_MEET_X, a.y - S.FEET);
}, T3.turnToHouse + 0.12, T3.atDoor + 0.02, S.YS * 0.96, DOOR_STEP);
const roomSteps = footfalls(S.roomAstroX, T3.inside, T3.roomStop + 0.05, S.RS);
const EV = {
  ...T3,
  astroSteps, doorSteps, roomSteps,
  friendSteps: [T3.friendIn + 0.12, T3.friendIn + 0.42],
};
fs.writeFileSync(process.argv[2], JSON.stringify({EV}, null, 1));
console.log('cues ->', process.argv[2], `(${astroSteps.length} return steps, ${doorSteps.length} path steps, ${roomSteps.length} room steps)`);
