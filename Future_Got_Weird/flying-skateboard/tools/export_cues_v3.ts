// V3: export the picture's timing for the V3 mix (narration marks and the V3 shot boundaries), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v3.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec3.cjs && node /tmp/ec3.cjs audio/cues_v3.json
import {writeFileSync} from 'fs';
import {M, SHOTS3} from '../source/src/v3/shots3';
import {DUR, FPS, FRAMES, WORDS} from '../source/src/story/time';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS3.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS3.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
