// V5: export the picture's timing for the V5 mix (narration marks and the V5 shot boundaries), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v5.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec5.cjs && node /tmp/ec5.cjs audio/cues_v5.json
import {writeFileSync} from 'fs';
import {CUTS5, M, SHOTS5} from '../source/src/v5/shots5';
import {DUR, FPS, FRAMES, WORDS} from '../source/src/story/time';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS5.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
  // every picture cut, including those inside shots
  cuts: CUTS5,
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS5.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
