// Writes the cue sheet data from the same TypeScript modules the picture uses:
//   audio/cues.json   - sound cues, music plan, shot table, device constants, caption windows
// Run: npx tsx scripts/export_cues.ts
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chunkWindows} from '../src/lib/captions';
import {DEV, countdownSecs} from '../src/lib/device';
import {musicPlan, soundCues} from '../src/lib/sound';
import {FPS, SHOT, TOTAL, WORDS} from '../src/lib/timeline';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../audio/cues.json');
const data = {
  fps: FPS,
  total_frames: TOTAL,
  shots: SHOT,
  device: DEV,
  countdown_at: Object.fromEntries([DEV.timerAt, DEV.compress0, DEV.compress1, DEV.injectAt, DEV.freezeAt].map((f) => [f, countdownSecs(f)])),
  music: musicPlan(),
  cues: soundCues(),
  captions: chunkWindows().map((c) => ({text: c.text, start: +c.start.toFixed(3), end: +c.end.toFixed(3), hl: c.hl ?? null, caps: !!c.caps})),
  words: WORDS.length,
};
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log('wrote', out, data.cues.length, 'cues');
