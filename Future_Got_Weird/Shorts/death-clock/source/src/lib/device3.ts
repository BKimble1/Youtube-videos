// V3 device-state continuity, one place for the whole film (every view of the band calls deviceState3).
//   Frame 0: red, 00:02:14, counting in real time (the cold open and the collapse are the same moment).
//   The warning from the heart lands in the same red screen ("keeps counting"): no reset, no second origin.
//   While the location and data travel to the hospital and the drone flies (screen off picture), story time is
//   compressed: when the band is seen again at the injection it reads about 00:00:41, then 00:00:40 when it holds.
//   Held (blue, TIMER HELD / STABILIZING) -> green "Life Expectancy: 42 Years" -> one local "?" glitch ->
//   an editorial callback to the opening image (red 00:02:14) that leads straight into frame 0 on replay.
import {SCREEN_IDLE, ScreenState} from './screen';
import {clamp, inv, lerp} from './math';
import {B, FPS, TOTAL} from './timeline3';

export const DEV3 = {
  START_SECS: 134,
  /** compressed span (screen not in picture): location/data -> hospital -> drone -> arrival */
  gap0: B.map0 - 1,
  gap1: B.act0 - 2,
  atGap1: 41.3,
};

export const countdown3 = (f: number) => {
  if (f >= B.callback) return DEV3.START_SECS;
  const real0 = DEV3.START_SECS - f / FPS;
  if (f < DEV3.gap0) return real0;
  const a = DEV3.START_SECS - DEV3.gap0 / FPS;
  if (f < DEV3.gap1) return lerp(a, DEV3.atGap1, inv(DEV3.gap0, DEV3.gap1, f));
  return DEV3.atGap1 - (Math.min(f, B.hold) - DEV3.gap1) / FPS;
};

/** The red border pulse phase, continuous across the loop (frame TOTAL-1 leads into frame 0). */
const flashPhase = (f: number) => {
  const g = f >= B.callback ? f - TOTAL : f;
  const rate = f >= B.tx0 && f < B.callback ? 0.05 : 0.085;
  return (((g * rate) % 1) + 1) % 1;
};

export const deviceState3 = (f: number): ScreenState => {
  const g = f - B.glitch;
  const glitch = g >= 0 && g < B.glitchLen ? Math.sin((g / B.glitchLen) * Math.PI) ** 0.5 : 0;
  const cb = f >= B.callback;
  const recover = cb ? 0 : clamp(inv(B.green, B.green + 12, f));
  return {
    ...SCREEN_IDLE,
    f,
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
