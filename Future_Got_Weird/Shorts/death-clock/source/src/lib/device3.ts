// V3 device-state continuity, one place for the whole film (every view of the band calls deviceState3).
//   Frame 0: red, 00:02:14, counting in real time (the cold open and the collapse are the same moment).
//   The warning from the heart lands in the same red screen ("keeps counting"): no reset, no second origin.
//   While the location and data travel to the hospital and the drone flies (screen off picture), story time is
//   compressed: when the band is seen again at the injection it reads about 00:00:41, then 00:00:40 when it holds.
//   Held (blue, TIMER HELD / STABILIZING) -> green "Life Expectancy: 42 Years" -> one local "?" glitch ->
//   an editorial callback to the opening image (red 00:02:14) that leads straight into frame 0 on replay.
// V4: the compressed story-time span ends before the band is seen again (the trunk wipe at B.past0 - 1), so the digits
//   never fast-forward in picture; every value from the injection on is exactly V3's. One periodic alarm runs in loop
//   time (alarmAt): it drives the border flash, the red ring round the glass (art/Device.tsx Wrist3D) and the sound
//   (lib/sound4.ts reads alarmOnsets). The screen's own clock (ScreenState.f) is loop time, so the ECG trace and scan
//   run on through the wrap 1349 -> 0.
import {SCREEN_IDLE, ScreenState} from './screen';
import {clamp, inv, lerp} from './math';
import {B4} from './beats4';
import {B, FPS, TOTAL} from './timeline3';

/** V3's value at V3's gap1 (B.act0 - 2); from there on the countdown is V3's exactly */
const V3_GAP1 = B.act0 - 2;
const V3_AT_GAP1 = 41.3;
/** V4: the compressed span ends the frame before the trunk wipe first reveals the arrival (WIPE.in0 = B.past0 - 1) */
const GAP1 = B.past0 - 2;

export const DEV3 = {
  START_SECS: 134,
  /** compressed span (screen not in picture): location/data -> hospital -> drone -> the trunk wipe */
  gap0: B.map0 - 1,
  gap1: GAP1,
  /** real time from gap1 to V3's gap1, so every value from V3's gap1 on is unchanged */
  atGap1: V3_AT_GAP1 + (V3_GAP1 - GAP1) / FPS,
};

// ---------------------------------------------------------------- the alarm (one periodic pulse in loop time)
/** loop time: the red callback (B.callback .. TOTAL-1) is the moment just before frame 0 of the next play */
export const loopTime = (f: number) => (f >= B.callback ? f - TOTAL : f);

export const ALARM = {
  period: B4.alarmPeriod,
  /** emissions at loop times phase0 + k * period: frames 1344, 6, 18 */
  phase0: B4.alarmPhase0,
  /** the ring runs from the red callback (first emission 1344) through the head of the next play */
  on0: B4.alarmOn0,
  /** no ring from here (the ring emitted at 18 has expanded and faded out exactly at 30) */
  off1: B4.alarmOff1,
  /** the warning landing in the red screen: one ring from the same helper */
  landing: B.red,
};

/** periodic phase 0..1 of the alarm in loop time (0 = an emission) */
export const alarmPhase = (f: number) => ((((loopTime(f) - ALARM.phase0) / ALARM.period) % 1) + 1) % 1;

/** The periodic alarm's emission frames (film frames), shared by the picture ring and the sound: 1344, 6, 18. */
export const alarmOnsets = (): number[] => {
  const out: number[] = [];
  for (let f = ALARM.on0; f < TOTAL; f++) if (alarmPhase(f) < 1e-9) out.push(f);
  for (let f = 0; f < ALARM.off1; f++) if (alarmPhase(f) < 1e-9) out.push(f);
  return out;
};
const ONSETS = alarmOnsets();
const FIRST_TAIL = ONSETS.find((f) => f >= ALARM.on0) ?? ALARM.on0;

/** Opacity of the alarm ring stroke for a ring age u and envelope env: zero at its emission (it fades in as it
 *  leaves the case) and zero at the end of its life, so no ring ever pops on or off. */
export const ringAlpha = (u: number, env: number) => {
  const k = clamp(u / 0.34);
  return env * 0.9 * k * k * (3 - 2 * k) * Math.pow(clamp(1 - u), 1.4);
};

/** The alarm ring at frame f: u = age of the current ring 0..1 (0 = emitted), env = 0..1 (0 = no ring).
 *  Frames 1344-1349 and 0-29 are one continuous run (the wrap falls mid-ring); B.red .. B.red+11 is the landing. */
export const alarmAt = (f: number): {gl: number; u: number; env: number; onsets: number[]} => {
  const gl = loopTime(f);
  const dl = f - ALARM.landing;
  if (dl >= 0 && dl < ALARM.period) return {gl, u: dl / ALARM.period, env: 1, onsets: ONSETS};
  const u = alarmPhase(f);
  // the ring starts with the first emission after the cut to red (no ring caught mid-expansion), and ends with the
  // head's last ring (which has faded out by off1)
  const env = f >= FIRST_TAIL || (gl >= 0 && gl < ALARM.off1) ? 1 : 0;
  return {gl, u, env, onsets: ONSETS};
};

export const countdown3 = (f: number) => {
  if (f >= B.callback) return DEV3.START_SECS;
  const real0 = DEV3.START_SECS - f / FPS;
  if (f < DEV3.gap0) return real0;
  const a = DEV3.START_SECS - DEV3.gap0 / FPS;
  if (f < DEV3.gap1) return lerp(a, DEV3.atGap1, inv(DEV3.gap0, DEV3.gap1, f));
  return DEV3.atGap1 - (Math.min(f, B.hold) - DEV3.gap1) / FPS;
};

/** The red border pulse phase: the alarm's own phase (peaks on its emissions), continuous across the loop; after the
 *  help alert it slows to 0.05 cycles per frame, integrated from tx0 so the rate change has no jump. */
const SLOW_RATE = 0.05;
export const flashPhase = (f: number) => {
  if (f < B.tx0 || f >= B.callback) return alarmPhase(f);
  return (((alarmPhase(B.tx0) + (f - B.tx0) * SLOW_RATE) % 1) + 1) % 1;
};

export const deviceState3 = (f: number): ScreenState => {
  const g = f - B.glitch;
  const glitch = g >= 0 && g < B.glitchLen ? Math.sin((g / B.glitchLen) * Math.PI) ** 0.5 : 0;
  const cb = f >= B.callback;
  const recover = cb ? 0 : clamp(inv(B.green, B.green + 12, f));
  const al = alarmAt(f);
  return {
    ...SCREEN_IDLE,
    // loop time: the trace, scan and every s.f animation run straight on through 1349 -> 0
    f: al.gl,
    ring: al.u,
    ringEnv: al.env,
    red: 1,
    edge: 0,
    secs: countdown3(f),
    timerIn: 1,
    flash: flashPhase(f),
    alert: cb ? 0 : clamp(inv(B.tx0, B.tx0 + 8, f)) * (1 - clamp(inv(B.hold - 10, B.hold, f))),
    stab: cb ? 0 : clamp(inv(B.hold, B.hold + 10, f)),
    recover,
    glitch,
    diag: 0,
  };
};
