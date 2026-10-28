// V4: export the picture's timing for the V4 mix (narration marks and the V4 shot boundaries), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v4.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec4.cjs && node /tmp/ec4.cjs audio/cues_v4.json
import {writeFileSync} from 'fs';
import {M, SHOTS4} from '../source/src/v4/shots4';
import {DUR, FPS, FRAMES, WORDS} from '../source/src/story/time';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS4.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS4.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
