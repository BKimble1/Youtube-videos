// Exports the picture's timeline (shot boundaries and key times) for the sound design, so effects follow the same
// measured anchors as the animation.
//   source/node_modules/.bin/esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --loader:.css=empty --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
import {writeFileSync} from 'fs';
import {SHOTS} from '../source/src/Film';
import {BABBLE, CO24, K, TRIALS} from '../source/src/state';

const out = {
  shots: SHOTS.map((s) => ({id: s.id, a: s.a, b: Math.min(s.b, 300)})),
  K,
  trials: TRIALS.map((t) => t.t),
  babble: BABBLE.map((b) => b[0]),
  co24: CO24,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('wrote', process.argv[2], out.shots.length, 'shots');
