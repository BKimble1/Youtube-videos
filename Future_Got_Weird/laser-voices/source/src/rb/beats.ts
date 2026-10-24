// The rebuild's timeline: narration word times (locked), shot boundaries and story beats (seconds).
import tl from '../data/timeline.json';

export const FPS = tl.fps;
export const FRAMES = tl.frames;
export const DUR = tl.duration;
export const WORDS = tl.words as {word: string; start: number; end: number}[];

/** shot starts (s) */
export const SH = {
  hook: 0, // ECU: he hears it
  trace: 1.0, // the path traced from his ear to the emitter
  two: 1.95, // medium two-shot: only he hears it
  ear: 4.95, // push to the ear (nothing in it), the path arrives
  micro: 8.55, // into the air beside the ear: water vapour
  wave: 11.5, // heating, expansion, pressure waves to the eardrum
  device: 15.0, // back along the path into the emitter's lens
  aim: 17.8, // from the lens to him: targeted sound
  side: 20.0, // side view: eight feet
  cross: 23.3, // the passerby walks across the path
  stop: 26.3, // his reaction to the silence
  blockSide: 27.85, // side view: the obstruction
  leave: 30.4, // the passerby moves on
  back: 32.0, // the voice returns: his reaction, back into the loop
};
/** the beam is blocked from T_BLOCK to T_CLEAR (the passerby's body crosses the path) */
export const T_BLOCK = 786 / 30;
export const T_CLEAR = 958 / 30;
