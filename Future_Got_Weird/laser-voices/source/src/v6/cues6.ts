// V6 cue sheet: the shot list (cut times) and the whisper windows, shared by the picture and the mix.
import {T_BLOCK, T_CLEAR, DUR, ss} from '../v4/core4';

export const SHOT = {
  a1: 0, a2: 1.5, a3: 3.0, a4: 5.0, m1: [5.55, 6.1] as const, m2: [8.55, 9.15] as const, m3: [13.55, 14.15] as const,
  c1: 15.0, c2: 17.75, d: 20.0, f1: 23.37, f2: 27.0, f3: 27.75, f4: 30.3, f5: 32.3,
};
/** whisper at his ear (s). The first wraps the loop seam (33.85 -> DUR -> 1.15). */
export const WHISPER: [number, number][] = [[33.85, DUR + 1.15], [2.08, 2.7], [3.4, 4.0], [23.6, T_BLOCK], [T_CLEAR, 33.3]];
export const WHISPER_LAB: [number, number] = [21.05, 23.25];
const win = (t: number, a: number, b: number) => {
  const hardIn = Math.abs(a - T_CLEAR) < 1e-6, hardOut = Math.abs(b - T_BLOCK) < 1e-6;
  if (t < a - 0.12 || t > b + 0.15) return 0;
  return (hardIn ? (t >= a ? 1 : 0) : ss(a - 0.03, a + 0.12, t)) * (hardOut ? (t < b ? 1 : 0) : 1 - ss(b - 0.1, b + 0.12, t));
};
export const whisperAt = (t: number) => Math.max(...WHISPER.map(([a, b]) => Math.max(win(t, a, b), win(t + DUR, a, b))));
export {T_BLOCK, T_CLEAR, DUR};
