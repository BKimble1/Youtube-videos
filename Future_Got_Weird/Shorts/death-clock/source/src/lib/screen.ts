// Screen state of the fictional band (pure data; no rendering, no fonts), shared by the picture and the tools.
export type ScreenState = {
  /** 0 green scan, 1 crimson warning */
  red: number;
  /** red edge warning creeping in on the green screen 0..1 */
  edge: number;
  /** countdown seconds remaining (story time); null hides the timer */
  secs: number | null;
  /** timer appear 0..1 (scale/opacity in) */
  timerIn: number;
  /** alarm flash phase 0..1 (border pulse) */
  flash: number;
  /** blue HELP ALERT SENT banner 0..1 */
  alert: number;
  /** STABILIZING banner 0..1 */
  stab: number;
  /** green recovery readout 0..1 */
  recover: number;
  /** question-mark glitch 0..1 (0 = none) */
  glitch: number;
  /** frame, for scan animation */
  f: number;
  /** label of the scan stage on the green screen */
  scanText?: string;
  /** dive through the glass: the screen opens onto the reservoir 0..1 */
  dive?: number;
};

export const SCREEN_IDLE: ScreenState = {red: 0, edge: 0, secs: null, timerIn: 0, flash: 0, alert: 0, stab: 0, recover: 0, glitch: 0, f: 0};

export const fmtClock = (secs: number) => {
  const s = Math.max(0, Math.ceil(secs - 1e-6));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};
