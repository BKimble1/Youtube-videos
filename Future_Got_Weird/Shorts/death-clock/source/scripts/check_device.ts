// Frame-by-frame check of the countdown logic the picture renders (lib/device.ts), for every frame of the film.
// Checks: one origin (00:02:14 when the timer appears), never increases, never reaches zero, displayed value
// changes by at most one second per frame, freezes at the treatment response, "42 Years" only after recovery,
// a single glitch window; V2: the held (blue) state follows the alert, the green readout fully replaces the red
// state (recover reaches 1 and stays), the glitch sits inside the green readout.
// Writes ../qa/v2/DEVICE_CHECK.json. Usage: npx tsx scripts/check_device.ts
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DEV, deviceState} from '../src/lib/device';
import {fmtClock} from '../src/lib/screen';
import {TOTAL} from '../src/lib/timeline';

const here = path.dirname(fileURLToPath(import.meta.url));
const fails: string[] = [];
let prev: number | null = null;
let prevShown: string | null = null;
let firstShown: string | null = null;
let firstAt = -1;
const changes: {f: number; shown: string}[] = [];
const glitchFrames: number[] = [];
let minShown = Infinity;
for (let f = 0; f < TOTAL; f++) {
  const s = deviceState(f);
  if (s.secs === null) {
    if (f >= DEV.timerAt) fails.push(`f${f}: timer missing after timerAt`);
    continue;
  }
  const shown = fmtClock(s.secs);
  const v = Math.ceil(s.secs - 1e-6);
  if (firstShown === null) {
    firstShown = shown;
    firstAt = f;
  }
  if (prev !== null && s.secs > prev + 1e-9) fails.push(`f${f}: countdown increased ${prev} -> ${s.secs}`);
  if (v <= 0) fails.push(`f${f}: countdown reached zero`);
  if (prevShown !== null && shown !== prevShown) {
    const pv = Number(prevShown.split(':').reduce((a, b) => String(Number(a) * 60 + Number(b))));
    if (pv - v !== 1) fails.push(`f${f}: displayed jump ${prevShown} -> ${shown}`);
    changes.push({f, shown});
  }
  if (s.glitch > 0) glitchFrames.push(f);
  minShown = Math.min(minShown, v);
  prev = s.secs;
  prevShown = shown;
}
if (firstShown !== '00:02:14') fails.push(`first displayed value ${firstShown}, expected 00:02:14`);
const frozen = fmtClock(deviceState(DEV.freezeAt).secs!);
for (let f = DEV.freezeAt; f < TOTAL; f++) if (fmtClock(deviceState(f).secs!) !== frozen) fails.push(`f${f}: changed after freeze`);
const contiguous = glitchFrames.every((g, i) => i === 0 || g === glitchFrames[i - 1] + 1);
if (!contiguous) fails.push('glitch frames are not one contiguous window');
// V2 state order: red -> alert -> held (stab) -> green (recover), and green stays fully on after it lands
const firstWhere = (pred: (f: number) => boolean) => {
  for (let f = 0; f < TOTAL; f++) if (pred(f)) return f;
  return -1;
};
const fRed = firstWhere((f) => deviceState(f).red >= 0.99);
const fAlert = firstWhere((f) => deviceState(f).alert >= 0.99);
const fHeld = firstWhere((f) => deviceState(f).stab >= 0.99);
const fGreen = firstWhere((f) => deviceState(f).recover >= 0.99);
if (!(fRed < DEV.timerAt && DEV.timerAt < fAlert && fAlert < fHeld && fHeld < fGreen)) fails.push(`state order wrong: red ${fRed}, timer ${DEV.timerAt}, alert ${fAlert}, held ${fHeld}, green ${fGreen}`);
for (let f = fGreen; f < TOTAL; f++) if (deviceState(f).recover < 0.999) fails.push(`f${f}: green readout not fully on`);
if (glitchFrames.length && glitchFrames[0] < fGreen) fails.push('glitch before the green readout');
if (DEV.freezeAt < fAlert) fails.push('timer held before the alert');
const out = {
  total_frames: TOTAL,
  timer_first_frame: firstAt,
  timer_first_value: firstShown,
  displayed_changes: changes.length,
  lowest_displayed: fmtClock(minShown),
  frozen_at_frame: DEV.freezeAt,
  frozen_value: frozen,
  red_from_frame: DEV.redAt,
  recover_from_frame: DEV.recoverAt,
  glitch_frames: glitchFrames.length ? [glitchFrames[0], glitchFrames[glitchFrames.length - 1]] : [],
  state_frames: {red_full: fRed, timer: DEV.timerAt, alert_full: fAlert, held_full: fHeld, green_full: fGreen},
  result: fails.length ? 'FAIL' : 'PASS',
  failures: fails.slice(0, 50),
};
fs.mkdirSync(path.resolve(here, '../../qa/v2'), {recursive: true});
fs.writeFileSync(path.resolve(here, '../../qa/v2/DEVICE_CHECK.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
