// V9: export the picture's timing for the V9 mix (narration marks, the V9 shot boundaries and the balance beats), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v9.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec9.cjs && node /tmp/ec9.cjs audio/cues_v9.json
import {writeFileSync} from 'fs';
import {BEATS9, CUTS9, SHOTS9} from '../source/src/v9/shots9';
import {DUR, FPS, FRAMES, M, WORDS} from '../source/src/v8/time8';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS9.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS9,
  // V9: the balance beats and the practice flight's shoreline crossing
  beats: BEATS9,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS9.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
