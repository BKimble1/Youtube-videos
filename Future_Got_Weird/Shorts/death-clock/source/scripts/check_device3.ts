// Frame-by-frame check of the V3 countdown and device states (lib/device3.ts) for every frame of the film.
// Checks: one origin (00:02:14 at frame 0); the displayed value never increases up to the callback and never
// reaches zero; it changes by at most one second per frame while the band is in picture (the compressed
// dispatch span is off picture); it holds at the treatment; green fully replaces the red state and stays until
// the glitch; one glitch window inside the green readout; the callback shows 00:02:14 in red and the last frame
// shows exactly what frame 0 shows (the loop).
// Writes ../qa/v3/DEVICE_CHECK.json. Usage: npx tsx scripts/check_device3.ts
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {countdown3, DEV3, deviceState3} from '../src/lib/device3';
import {fmtClock} from '../src/lib/screen';
import {B, TOTAL} from '../src/lib/timeline3';

const here = path.dirname(fileURLToPath(import.meta.url));
const fails: string[] = [];
const changes: {f: number; shown: string}[] = [];
const glitch: number[] = [];
let prevV: number | null = null;
let prevShown = '';
let held = -1;
let greenFull = -1;
for (let f = 0; f < TOTAL; f++) {
  const s = deviceState3(f);
  if (s.secs === null) {
    fails.push(`f${f}: no timer`);
    continue;
  }
  const shown = fmtClock(s.secs);
  const v = Math.ceil(s.secs - 1e-6);
  if (f === 0 && shown !== '00:02:14') fails.push(`f0 shows ${shown}`);
  if (f < B.callback) {
    if (prevV !== null && v > prevV) fails.push(`f${f}: increased ${prevV} -> ${v}`);
    const inPicture = !(f >= DEV3.gap0 && f < DEV3.gap1);
    if (inPicture && prevV !== null && prevV - v > 1) fails.push(`f${f}: jumped ${prevV - v} s in picture`);
    if (v <= 0) fails.push(`f${f}: reached zero`);
  }
  if (shown !== prevShown) changes.push({f, shown});
  if (s.stab >= 1 && held < 0) held = f;
  if (s.recover >= 1 && greenFull < 0) greenFull = f;
  if (greenFull >= 0 && f < B.glitch && s.recover < 1) fails.push(`f${f}: green not held`);
  if (s.glitch > 0) glitch.push(f);
  prevV = v;
  prevShown = shown;
}
const last = deviceState3(TOTAL - 1);
const first = deviceState3(0);
if (fmtClock(last.secs!) !== fmtClock(first.secs!)) fails.push(`loop: last frame ${fmtClock(last.secs!)} vs frame 0 ${fmtClock(first.secs!)}`);
if (last.recover !== 0 || last.red !== 1 || last.glitch !== 0) fails.push('loop: last frame is not the red callback');
if (Math.abs(((last.flash + (deviceState3(1).flash - first.flash)) % 1) - first.flash) > 0.02 && Math.abs(last.flash - first.flash) > 0.2) fails.push(`loop: flash phase ${last.flash} -> ${first.flash}`);
const gl0 = glitch[0];
const gl1 = glitch[glitch.length - 1];
if (glitch.length === 0 || gl1 - gl0 + 1 !== glitch.length) fails.push('glitch: not one window');
if (greenFull < 0 || gl0 < greenFull) fails.push('glitch: not inside the green readout');
if (held < 0 || held > greenFull) fails.push('hold: missing or after green');
const out = {
  result: fails.length ? 'FAIL' : 'PASS',
  fails,
  origin: '00:02:14 at frame 0',
  shown_at: Object.fromEntries([0, B.cut, B.macro, B.red, B.count0, B.crit0, B.map0 - 1, B.act0, B.hold, B.green, B.callback, TOTAL - 1].map((f) => [f, fmtClock(countdown3(f))])),
  compressed_span_frames: [DEV3.gap0, DEV3.gap1],
  held_from: held,
  green_full_from: greenFull,
  glitch_frames: [gl0, gl1],
  callback_from: B.callback,
  changes_count: changes.length,
};
const dst = path.resolve(here, '../../qa/v3/DEVICE_CHECK.json');
fs.mkdirSync(path.dirname(dst), {recursive: true});
fs.writeFileSync(dst, JSON.stringify(out, null, 1));
console.log(out.result, fails.slice(0, 8), JSON.stringify(out.shown_at));
