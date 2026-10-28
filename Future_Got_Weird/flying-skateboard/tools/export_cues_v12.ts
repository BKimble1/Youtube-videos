// V12: export the picture's timing for the V12 mix (narration marks, the V12 shot boundaries and the balance beats), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v12.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec12.cjs && node /tmp/ec12.cjs audio/cues_v12.json
import {writeFileSync} from 'fs';
import {BEATS12, CUTS12, SHOTS12} from '../source/src/v12/shots12';
import {DUR, FPS, FRAMES, M, WORDS} from '../source/src/v10/time10';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS12.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS12,
  // V12: the balance beats and the practice flight's shoreline crossing
  beats: BEATS12,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS12.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
