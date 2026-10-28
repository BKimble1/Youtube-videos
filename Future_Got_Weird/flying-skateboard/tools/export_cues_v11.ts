// V11: export the picture's timing for the V11 mix (narration marks, the V11 shot boundaries and the balance beats), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v11.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec11.cjs && node /tmp/ec11.cjs audio/cues_v11.json
import {writeFileSync} from 'fs';
import {BEATS11, CUTS11, SHOTS11} from '../source/src/v11/shots11';
import {DUR, FPS, FRAMES, M, WORDS} from '../source/src/v10/time10';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS11.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS11,
  // V11: the balance beats and the practice flight's shoreline crossing
  beats: BEATS11,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS11.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
