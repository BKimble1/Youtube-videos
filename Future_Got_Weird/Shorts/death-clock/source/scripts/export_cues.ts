// Writes the cue data from the same TypeScript modules the picture uses:
//   audio/v2/cues.json - sound cues, music plan, beat table and units, device constants, caption windows
// Run: npx tsx scripts/export_cues.ts
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chunkWindows} from '../src/lib/captions';
import {DEV, countdownSecs} from '../src/lib/device';
import {musicPlan, soundCues} from '../src/lib/sound';
import {B, FPS, TOTAL, UNITS, WORDS} from '../src/lib/timeline';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../audio/v2/cues.json');
fs.mkdirSync(path.dirname(out), {recursive: true});
const data = {
  fps: FPS,
  total_frames: TOTAL,
  beats: B,
  units: UNITS,
  device: DEV,
  countdown_at: Object.fromEntries([DEV.timerAt, B.map0, B.treat0, DEV.freezeAt].map((f) => [f, countdownSecs(f)])),
  music: musicPlan(),
  cues: soundCues(),
  captions: chunkWindows().map((c) => ({text: c.text, start: +c.start.toFixed(3), end: +c.end.toFixed(3), hl: c.hl ?? null})),
  words: WORDS.length,
};
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log('wrote', out, data.cues.length, 'cues');
