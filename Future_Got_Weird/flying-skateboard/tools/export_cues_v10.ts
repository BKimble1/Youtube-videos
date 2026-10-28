// V10: export the picture's timing for the V10 mix (narration marks, the V10 shot boundaries and the balance beats), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v10.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec10.cjs && node /tmp/ec10.cjs audio/cues_v10.json
import {writeFileSync} from 'fs';
import {BEATS10, CUTS10, SHOTS10} from '../source/src/v10/shots10';
import {DUR, FPS, FRAMES, M, WORDS} from '../source/src/v10/time10';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS10.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS10,
  // V10: the balance beats and the practice flight's shoreline crossing
  beats: BEATS10,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS10.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
