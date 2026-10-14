// Writes the V3 cue data from the same TypeScript modules the picture uses:
//   audio/v3/cues.json - sound cues, music plan, beat table and units, countdown, caption windows
// Run: npx tsx scripts/export_cues3.ts
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chunkWindows} from '../src/lib/captions';
import {countdown3, DEV3} from '../src/lib/device3';
import {musicPlan, soundCues} from '../src/lib/sound3';
import {B, FPS, TOTAL, UNITS, WORDS} from '../src/lib/timeline3';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../audio/v3/cues.json');
fs.mkdirSync(path.dirname(out), {recursive: true});
const data = {
  fps: FPS,
  total_frames: TOTAL,
  beats: B,
  units: UNITS,
  device: DEV3,
  countdown_at: Object.fromEntries([0, B.red, B.count0, B.crit0, B.map0 - 1, B.act0, B.hold, B.callback].map((f) => [f, +countdown3(f).toFixed(3)])),
  music: musicPlan(),
  cues: soundCues(),
  captions: chunkWindows().map((c) => ({text: c.text, start: +c.start.toFixed(3), end: +c.end.toFixed(3), hl: c.hl ?? null})),
  words: WORDS.length,
};
fs.writeFileSync(out, JSON.stringify(data, null, 1));
console.log('wrote', out, data.cues.length, 'cues');
