// V2: export the picture's timing for the V2 mix (narration marks and the V2 shot boundaries), so every sound is placed
// from the same marks that time the picture.
// usage: esbuild tools/export_cues_v2.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec2.cjs && node /tmp/ec2.cjs audio/cues_v2.json
import {writeFileSync} from 'fs';
import {M, SHOTS2} from '../source/src/v2/shots2';
import {DUR, FPS, FRAMES, WORDS} from '../source/src/story/time';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS2.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS2.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
