// V8: export the picture's timing for the V8 mix (narration marks, the V8 shot boundaries and the balance beats), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v8.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec8.cjs && node /tmp/ec8.cjs audio/cues_v8.json
import {writeFileSync} from 'fs';
import {BEATS8, CUTS8, SHOTS8} from '../source/src/v8/shots8';
import {DUR, FPS, FRAMES, M, WORDS} from '../source/src/v8/time8';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS8.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS8,
  // V8: the balance beats and the practice flight's shoreline crossing
  beats: BEATS8,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS8.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
