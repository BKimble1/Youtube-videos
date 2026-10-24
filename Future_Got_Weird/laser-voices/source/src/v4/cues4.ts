// V4 cue sheet: section boundaries, and when the transmitted whisper is heard (shared by the picture and the mix).
import {T_BLOCK, T_CLEAR, ss, clamp, DUR} from './core4';

export const SEC = {
  secIn: 5.85, // atrium -> ear section (dissolve centred here)
  secOut: 6.85, // ear section -> atrium
  microIn: 9.05, // atrium (infrared) -> molecular air
  lab: 15.0, // eardrum -> lab (match cut)
  demo: 20.05, // the 8 ft demonstration
  atrium2: 23.4, // lab listener -> atrium (match cut)
};
/** whisper phrases at his ear (seconds): the first is the hook; the voice cuts dead at T_BLOCK and is back at T_CLEAR */
export const WHISPER: [number, number][] = [[0.24, 1.08], [2.12, 2.8], [23.86, T_BLOCK], [T_CLEAR, 33.62]];
/** the lab listener's whisper */
export const WHISPER_LAB: [number, number] = [22.28, 23.32];
export const whisperAt = (t: number) => {
  let on = 0;
  for (const [a, b] of WHISPER) {
    const hardIn = a === T_CLEAR, hardOut = b === T_BLOCK;
    if (t >= a - 0.1 && t <= b + 0.15) on = Math.max(on, (hardIn ? (t >= a ? 1 : 0) : ss(a - 0.04, a + 0.1, t)) * (hardOut ? (t < b ? 1 : 0) : 1 - ss(b - 0.08, b + 0.12, t)));
  }
  // the picture's shimmer only where his ear is in an atrium shot (A, F, H)
  const visual = (t < 5.9 || t > 23.4) ? on : 0;
  return {audio: on, visual: clamp(visual)};
};
export {DUR};
