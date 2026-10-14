// Device-state continuity for the whole film, in one place. Every shot that shows the screen calls deviceState(f),
// so the countdown begins ONCE from a single origin and every view of the band agrees.
//   green VITAL SCAN -> crimson CALCULATING -> 00:02:14 counting down in real time -> the diagnostic resolves ->
//   HELP ALERT SENT (blue strip) -> treatment: the timer is HELD (blue, STABILIZING) -> green
//   "Life Expectancy: 42 Years" -> one localized question-mark glitch.
// The countdown runs at film speed while it is active (no hidden compression), stops when the treatment holds it,
// and never reaches zero.
import {SCREEN_IDLE, ScreenState} from './screen';
import {clamp, inv} from './math';
import {B, FPS} from './timeline';

export const DEV = {
  redAt: B.red, // decisive switch to crimson as the heart's signal reaches the band
  timerAt: B.timer, // countdown appears at exactly 00:02:14
  diag0: B.diag0,
  diag1: B.diag1,
  alertAt: B.alert, // HELP ALERT SENT
  freezeAt: B.freeze, // the treatment holds the timer
  recoverAt: B.recover, // green readout
  glitchAt: B.glitch,
  glitchLen: B.glitchLen,
  START_SECS: 134, // 00:02:14
};

/** Seconds elapsed on the countdown (film time between its origin and the hold). */
export const storyElapsed = (f: number) => Math.max(0, Math.min(f, DEV.freezeAt) - DEV.timerAt) / FPS;

export const countdownSecs = (f: number) => DEV.START_SECS - storyElapsed(f);

export const deviceState = (f: number): ScreenState => {
  const red = clamp(inv(DEV.redAt, DEV.redAt + 4, f));
  const timerIn = clamp(inv(DEV.timerAt, DEV.timerAt + 6, f));
  const alert = clamp(inv(DEV.alertAt, DEV.alertAt + 10, f));
  const stab = clamp(inv(DEV.freezeAt, DEV.freezeAt + 12, f));
  const recover = clamp(inv(DEV.recoverAt, DEV.recoverAt + 12, f));
  const g = f - DEV.glitchAt;
  const glitch = g >= 0 && g < DEV.glitchLen ? Math.sin((g / DEV.glitchLen) * Math.PI) ** 0.5 : 0;
  // the border pulse is fast at first, slower once help is on the way, still once the timer is held
  const flashRate = f < DEV.alertAt ? 0.085 : 0.05;
  return {
    ...SCREEN_IDLE,
    f,
    edge: 0,
    red,
    secs: f >= DEV.timerAt ? countdownSecs(f) : null,
    timerIn,
    flash: (f * flashRate) % 1,
    alert,
    stab,
    recover,
    glitch,
    diag: clamp(inv(DEV.diag0, DEV.diag1, f)),
  };
};
