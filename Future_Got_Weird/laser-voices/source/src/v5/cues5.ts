// V5 cue sheet: the shot list (cut times) and the whisper windows, shared by the picture and the mix.
import {T_BLOCK, T_CLEAR, DUR, ss} from '../v4/core4';

export const SHOT = {
  s1: 0, s2: 2.9, s3: 3.75, s4: 4.99, m1: [5.55, 6.1] as const, s5: 6.95, m2: [8.7, 9.4] as const, s7: 9.4, m3: [13.45, 14.15] as const,
  s9: 15.0, s10: 17.75, s11: 20.0, s12: 23.37, s13: 32.3,
};
/** whisper at his ear (s). The first wraps the loop seam (33.78 -> DUR -> 1.1). */
export const WHISPER: [number, number][] = [[33.78, DUR + 1.1], [2.08, 2.75], [3.95, 4.7], [23.6, T_BLOCK], [T_CLEAR, 33.3]];
export const WHISPER_LAB: [number, number] = [21.05, 23.25];
const win = (t: number, a: number, b: number) => {
  const hardIn = Math.abs(a - T_CLEAR) < 1e-6, hardOut = Math.abs(b - T_BLOCK) < 1e-6;
  if (t < a - 0.12 || t > b + 0.15) return 0;
  return (hardIn ? (t >= a ? 1 : 0) : ss(a - 0.03, a + 0.12, t)) * (hardOut ? (t < b ? 1 : 0) : 1 - ss(b - 0.1, b + 0.12, t));
};
export const whisperAt = (t: number) => Math.max(...WHISPER.map(([a, b]) => Math.max(win(t, a, b), win(t + DUR, a, b))));
export {T_BLOCK, T_CLEAR, DUR};
