// Writes the timed captions (SRT, same chunks and times as the burned-in captions) and the locked narration text.
// Also verifies, word by word, that the captions spell exactly the supplied script.
// Usage: npx tsx scripts/export_srt.ts
import fs from 'node:fs';
import path from 'node:path';
import {chunkWindows} from '../src/lib/captions';
import {WORDS} from '../src/lib/timeline';

const SCRIPT =
  "This brain chip lets you talk to someone just by thinking. Instead of using vocal cords, the chip reads neural impulses in your motor cortex, translating your thoughts into direct messages instantly. It works seamlessly—until your brain generates an intrusive thought. Humans have thousands of dark, unwanted thoughts every single day that we never intend to act on. The chip can't tell the difference between what you wanted to say... and the dark thought you were desperately trying to bury.";

const ts = (s: number) => {
  const ms = Math.round(Math.max(0, s) * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(h)}:${p(m)}:${p(sec)},${p(r, 3)}`;
};

const W = chunkWindows();
const rejoined = W.map((w) => w.text).join(' ').replace(/— /g, '—');
if (rejoined !== SCRIPT) {
  console.error('CAPTIONS DO NOT MATCH THE SCRIPT\n', rejoined, '\n', SCRIPT);
  process.exit(1);
}
const words = WORDS.map((w) => w.text).join(' ').replace(/— /g, '—');
if (words !== SCRIPT) {
  console.error('WORD LIST DOES NOT MATCH THE SCRIPT');
  process.exit(1);
}
const srt = W.map((w, i) => `${i + 1}\n${ts(w.start)} --> ${ts(w.end)}\n${w.text}\n`).join('\n');
const root = path.resolve(__dirname, '..', '..');
fs.mkdirSync(path.join(root, 'captions'), {recursive: true});
fs.writeFileSync(path.join(root, 'captions', 'FGW_TelepathyFlaw.srt'), srt);
fs.mkdirSync(path.join(root, 'script'), {recursive: true});
fs.writeFileSync(path.join(root, 'script', 'narration_locked.txt'), SCRIPT + '\n');
console.log(`${W.length} caption cues; script and captions match exactly (${WORDS.length} words, ${SCRIPT.length} characters)`);
