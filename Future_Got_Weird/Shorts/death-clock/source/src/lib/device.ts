// Device-state continuity for the whole film, in one place. Every shot that shows the screen calls
// deviceState(f), so the countdown begins ONCE from a single origin, decrements consistently in story
// time, stays above zero through the intervention, and every view of the band agrees.
//   green VITAL SCAN -> slight red edge warning -> crimson + 00:02:14 -> HELP ALERT SENT (blue) over
//   the timer -> STABILIZING (timer frozen) -> green "Life Expectancy: 42 Years" -> one ? glitch.
import {SCREEN_IDLE, ScreenState} from './screen';
import {clamp, inv} from './math';
import {fE, fS, FPS, SHOT} from './timeline';

export const DEV = {
  edgeIn: SHOT.s03[0] + 24, // slight red edge creeps in while he lies there
  redAt: SHOT.s08[0] + 1, // decisive switch to crimson right at the cut back to the watch (alarm sits in the pause before "the device")
  timerAt: fS('calculates'), // countdown appears at exactly 00:02:14
  alertAt: fE('seek help') + 6, // blue pulse leaves, banner slides in
  compress0: SHOT.s11[0] + 34, // emergency-response montage (time compressed)
  compress1: SHOT.s12[1],
  compressRate: 2.5, // story seconds per film second inside the montage
  injectAt: fS('potentially') + 10, // tiny automated injection from the band
  freezeAt: fS('potentially') + 46, // treatment response: countdown stops
  recoverAt: SHOT.s14[0] + 40, // screen turns green during the recovery
  glitchAt: fE('want to know') + 4,
  glitchLen: 9,
  START_SECS: 134, // 00:02:14
};

/** Story seconds elapsed since the countdown origin (compressed inside the montage window). */
export const storyElapsed = (f: number) => {
  const g = Math.min(f, DEV.freezeAt);
  const base = Math.max(0, g - DEV.timerAt) / FPS;
  const inside = Math.max(0, Math.min(g, DEV.compress1) - DEV.compress0) / FPS;
  return base + inside * (DEV.compressRate - 1);
};

export const countdownSecs = (f: number) => DEV.START_SECS - storyElapsed(f);

export const deviceState = (f: number): ScreenState => {
  const red = clamp(inv(DEV.redAt, DEV.redAt + 4, f));
  const timerIn = clamp(inv(DEV.timerAt, DEV.timerAt + 6, f));
  const alert = clamp(inv(DEV.alertAt, DEV.alertAt + 10, f)) * (1 - clamp(inv(DEV.injectAt + 4, DEV.injectAt + 12, f)));
  const stab = clamp(inv(DEV.injectAt + 4, DEV.injectAt + 12, f));
  const recover = clamp(inv(DEV.recoverAt, DEV.recoverAt + 12, f));
  const g = f - DEV.glitchAt;
  const glitch = g >= 0 && g < DEV.glitchLen ? Math.sin((g / DEV.glitchLen) * Math.PI) ** 0.5 : 0;
  // the alarm flash is fast at first, slower once help is on the way
  const flashRate = f < DEV.alertAt ? 0.085 : 0.05;
  return {
    ...SCREEN_IDLE,
    f,
    edge: red > 0 ? 0 : clamp(inv(DEV.edgeIn, DEV.edgeIn + 30, f)) * 0.7,
    red,
    secs: f >= DEV.timerAt ? countdownSecs(f) : null,
    timerIn,
    flash: (f * flashRate) % 1,
    alert,
    stab,
    recover,
    glitch,
  };
};
