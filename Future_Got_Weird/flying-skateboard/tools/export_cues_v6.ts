// V6: export the picture's timing for the V6 mix (narration marks, the V6 shot boundaries and the balance beats), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v6.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec6.cjs && node /tmp/ec6.cjs audio/cues_v6.json
import {writeFileSync} from 'fs';
import {BEATS6, CUTS6, M, SHOTS6} from '../source/src/v6/shots6';
import {DUR, FPS, FRAMES, WORDS} from '../source/src/story/time';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS6.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS6,
  // V6: the balance beats and the practice flight's shoreline crossing
  beats: BEATS6,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS6.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
