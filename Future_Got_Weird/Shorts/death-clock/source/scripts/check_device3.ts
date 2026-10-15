// Frame-by-frame check of the V3 countdown and device states (lib/device3.ts) for every frame of the film.
// Checks: one origin (00:02:14 at frame 0); the displayed value never increases up to the callback and never
// reaches zero; it changes by at most one second per frame while the band is in picture (the compressed
// dispatch span is off picture); it holds at the treatment; green fully replaces the red state and stays until
// the glitch; one glitch window inside the green readout; the callback shows 00:02:14 in red and the last frame
// shows exactly what frame 0 shows (the loop).
// V4 additions: the compressed span ends before the band is seen again (no fast-forward at the trunk wipe) and every
// value from V3's gap1 on is V3's (00:00:42 at the injection); the periodic alarm's onsets are 1344, 6, 18; across
// the wrap 1349 -> 0 the flash phase, the ring phase/envelope/opacity and the screen's own clock (ScreenState.f)
// each advance by exactly one frame's step; the flash phase has no jump at tx0; no ring pops on or off anywhere.
// Writes ../qa/v4/DEVICE_CHECK.json (the V3 record in qa/v3 is left as it was). Usage: npx tsx scripts/check_device3.ts
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ALARM, alarmAt, alarmOnsets, countdown3, DEV3, deviceState3, flashPhase, ringAlpha} from '../src/lib/device3';
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

// ---- V4: countdown at the arrival
const WIPE_IN0 = B.past0 - 1; // the trunk wipe's first frame (shots/Dispatch.tsx WIPE.in0): the band can be seen from here
if (DEV3.gap1 >= WIPE_IN0) fails.push(`countdown: compressed span ends at ${DEV3.gap1}, after the band is visible (${WIPE_IN0})`);
const V3_GAP1 = B.act0 - 2;
for (let f = V3_GAP1; f < B.callback; f++) {
  const v3 = 41.3 - (Math.min(f, B.hold) - V3_GAP1) / 30;
  if (Math.abs(countdown3(f) - v3) > 1e-9) fails.push(`countdown f${f}: ${countdown3(f)} differs from V3 ${v3}`);
}
if (fmtClock(countdown3(B.act0)) !== '00:00:42') fails.push(`countdown: ${fmtClock(countdown3(B.act0))} at the injection (B.act0), want 00:00:42`);
let maxJumpInPicture = 0;
for (let f = DEV3.gap1 + 1; f < B.callback; f++) maxJumpInPicture = Math.max(maxJumpInPicture, countdown3(f - 1) - countdown3(f));

// ---- V4: the periodic alarm and the wrap
const onsets = alarmOnsets();
if (JSON.stringify(onsets) !== JSON.stringify([1344, 6, 18])) fails.push(`alarm onsets ${JSON.stringify(onsets)}, want [1344,6,18]`);
const frac = (x: number) => ((x % 1) + 1) % 1;
const dPhase = (a: number, b: number) => frac(b - a); // forward phase step a -> b
const P = 1 / ALARM.period;
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;
const sL = deviceState3(TOTAL - 1);
const s0 = deviceState3(0);
const sL1 = deviceState3(TOTAL - 2);
if (!near(dPhase(sL.flash, s0.flash), P)) fails.push(`loop: flash phase step at the wrap ${dPhase(sL.flash, s0.flash).toFixed(4)}, want ${P.toFixed(4)}`);
if (!near(dPhase(sL1.flash, sL.flash), dPhase(sL.flash, s0.flash))) fails.push('loop: flash rate differs across the wrap');
if (!near(dPhase(sL.ring!, s0.ring!), P)) fails.push(`loop: ring phase step at the wrap ${dPhase(sL.ring!, s0.ring!).toFixed(4)}`);
if (sL.ringEnv !== s0.ringEnv || s0.ringEnv !== 1) fails.push(`loop: ring envelope ${sL.ringEnv} -> ${s0.ringEnv}`);
if (s0.f - sL.f !== 1 || sL.f - sL1.f !== 1) fails.push(`loop: screen clock ${sL1.f}, ${sL.f} -> ${s0.f} (want +1 per frame)`);
// the flash phase never jumps (the one exception is the cut back to red at the callback, where the border has been
// hidden under the green readout)
let maxFlashStep = 0;
for (let f = 1; f <= TOTAL; f++) {
  const a = flashPhase(f - 1);
  const b = flashPhase(f % TOTAL);
  const d = Math.min(dPhase(a, b), 1 - dPhase(a, b));
  if (f === B.callback) continue;
  maxFlashStep = Math.max(maxFlashStep, d);
  if (d > P + 1e-9) fails.push(`flash: phase jump ${d.toFixed(3)} at f${f}`);
}
// no ring pops on or off: the stroke opacity changes by at most 0.25 per frame (wrap included), and is ~0 wherever
// the ring starts or stops
let maxRingStep = 0;
const ringA = (f: number) => {
  const a = alarmAt(f);
  return ringAlpha(a.u, a.env);
};
for (let f = 1; f <= TOTAL; f++) {
  const d = Math.abs(ringA(f % TOTAL) - ringA(f - 1));
  maxRingStep = Math.max(maxRingStep, d);
  if (d > 0.25) fails.push(`ring: opacity jump ${d.toFixed(3)} at f${f % TOTAL}`);
}
const ringFrames: number[] = [];
for (let f = 0; f < TOTAL; f++) if (ringA(f) > 0.004) ringFrames.push(f);
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
  v4: {
    shown_arrival: Object.fromEntries([DEV3.gap1, B.past0, B.past0 + 6, B.arrive, V3_GAP1, B.act0, B.inject0].map((f) => [f, fmtClock(countdown3(f))])),
    max_countdown_step_in_picture_from_gap1_s: +maxJumpInPicture.toFixed(4),
    alarm_onsets: onsets,
    ring_visible_frames: [ringFrames.filter((f) => f >= B.callback), ringFrames.filter((f) => f < 100), ringFrames.filter((f) => f >= 100 && f < B.callback)].map((a) => (a.length ? [a[0], a[a.length - 1]] : [])),
    wrap: {flash: [sL.flash, s0.flash], ring: [sL.ring, s0.ring], ring_env: [sL.ringEnv, s0.ringEnv], ring_alpha: [ringA(TOTAL - 1), ringA(0)], screen_f: [sL1.f, sL.f, s0.f]},
    max_flash_phase_step: +maxFlashStep.toFixed(4),
    max_ring_alpha_step: +maxRingStep.toFixed(4),
  },
};
const dst = path.resolve(here, '../../qa/v4/DEVICE_CHECK.json');
fs.mkdirSync(path.dirname(dst), {recursive: true});
fs.writeFileSync(dst, JSON.stringify(out, null, 1));
console.log(out.result, fails.slice(0, 8), JSON.stringify(out.shown_at));
