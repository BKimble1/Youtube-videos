// V2 check: the picture's received state (message gate x the clerk's geometric obstruction) must equal the locked
// mix's per-frame `received` in audio/cues.json on every frame; also reports the crossing frames and foot plants.
import fs from 'node:fs';
import {received, blocked, clerkX, X_ENTER, X_EXIT, footAt} from '../source/src/v2/story2';
import {FRAMES, FPS, STRIKES} from '../source/src/v2/world2';
const cues = JSON.parse(fs.readFileSync(process.argv[2] ?? 'audio/cues.json', 'utf8'));
let bad = 0;
const blockF: number[] = [];
for (let f = 0; f < FRAMES; f++) {
  const t = f / FPS;
  const a = cues.frames[f].received ? 1 : 0, v = received(t) ? 1 : 0;
  if (a !== v) { bad++; if (bad < 10) console.log('MISMATCH frame', f, 't', t.toFixed(3), 'audio', a, 'picture', v); }
  if (blocked(t)) blockF.push(f);
}
console.log(JSON.stringify({frames: FRAMES, mismatches: bad, blockedFrames: [blockF[0], blockF[blockF.length - 1]], X_ENTER, X_EXIT,
  clerkX_at: {'22.6': clerkX(22.6), '25.4': clerkX(25.4), '27.1667': clerkX(27.1667), '28.3': clerkX(28.3), '31.9333': clerkX(31.9333), '34.06': clerkX(34.06)},
  plants: STRIKES.map((s) => [s, footAt(s + 0.001, 0).x.toFixed(3), footAt(s + 0.001, 1).x.toFixed(3)])}, null, 1));
process.exit(bad ? 1 : 0);
