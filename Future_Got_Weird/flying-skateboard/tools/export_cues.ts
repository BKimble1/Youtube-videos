// Export the picture's timing for the mix: narration marks, shot boundaries and per-frame flight states (thrust, height,
// speed, board attitude, which world we are in, the camera's distance to the board), so every sound is placed from the
// same functions that draw the picture.
// usage: esbuild tools/export_cues.ts --bundle --platform=node --format=cjs --jsx=automatic --outfile=/tmp/ec.cjs && node /tmp/ec.cjs audio/cues.json
import {writeFileSync} from 'fs';
import {M, SHOTS} from '../source/src/story/shots';
import {DUR, FPS, FRAMES, WORDS} from '../source/src/story/time';
const out = {
  duration: DUR, fps: FPS, frames: FRAMES, words: WORDS, marks: M,
  shots: SHOTS.map((s) => ({name: s.name, from: s.from, to: Math.min(s.to, DUR)})),
};
writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(`cues: ${SHOTS.length} shots, ${Object.keys(M).length} marks, ${DUR}s`);
