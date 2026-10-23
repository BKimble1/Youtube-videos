// Exports the V3 picture's own timing for the audio builder (audio/cues_v3.json): the motif instances, and per frame
// whether the message reaches the ear (`received`: transmitting and not blocked on screen) and the motif envelope.
import fs from 'node:fs';
import {MOTIFS, received, blocked, motifEnv, txOn} from '../source/src/v3/story3';
import {screenBlocked} from '../source/src/v3/occlude3';
import {FRAMES, FPS, DUR, T_BLOCK, T_CLEAR, STRIKES} from '../source/src/v3/world3';
const frames = Array.from({length: FRAMES}, (_, f) => {
  const t = f / FPS;
  if (blocked(t) !== screenBlocked(t)) throw new Error(`blocked mismatch at frame ${f}`);
  return {t: +t.toFixed(5), received: received(t) ? 1 : 0, blocked: blocked(t) ? 1 : 0, tx: txOn(t) ? 1 : 0, env: +motifEnv(t).toFixed(4)};
});
fs.writeFileSync(process.argv[2] ?? 'audio/cues_v3.json', JSON.stringify({DUR, FPS, FRAMES, T_BLOCK, T_CLEAR, MOTIFS, STRIKES, frames}));
console.log('cues_v3: motifs', MOTIFS.length, 'blocked frames', frames.filter((x) => x.blocked).length);
