import {Easing, interpolate, spring} from 'remotion';

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);

/** 0 → 1 over [start, start+dur] with ease-out, clamped. */
export const ramp = (frame: number, start: number, dur = 18, easing = easeOut) =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });

/** Fade/raise in at `start`, optionally fade out at `end`. */
export const inOut = (frame: number, start: number, end?: number, dIn = 16, dOut = 12) => {
  const a = ramp(frame, start, dIn);
  if (end === undefined) return a;
  const b = 1 - ramp(frame, end - dOut, dOut, easeIn);
  return Math.min(a, b);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Critically-damped spring (no bounce) starting at `start`. */
export const settle = (frame: number, fps: number, start: number, durationInFrames = 24) =>
  spring({frame: frame - start, fps, config: {damping: 200, mass: 1, stiffness: 120}, durationInFrames});

/** Deterministic pseudo-random in [0,1) from an integer seed (mulberry32). */
export const rand = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
