// V7: export the picture's timing for the V7 mix (narration marks, the V7 shot boundaries and the balance beats), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v7.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec7.cjs && node /tmp/ec7.cjs audio/cues_v7.json
import {writeFileSync} from 'fs';
import {BEATS7, CUTS7, M, SHOTS7} from '../source/src/v7/shots7';
import {DUR, FPS, FRAMES, WORDS} from '../source/src/story/time';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS7.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS7,
  // V7: the balance beats and the practice flight's shoreline crossing
  beats: BEATS7,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS7.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
