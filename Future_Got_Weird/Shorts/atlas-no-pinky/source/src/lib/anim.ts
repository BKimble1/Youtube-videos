import {Easing, interpolate, spring} from 'remotion';

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const easeIn = Easing.bezier(0.55, 0, 1, 0.45);
export const linear = (x: number) => x;

/** 0 → 1 over [start, start+dur], clamped, ease-out by default. */
export const ramp = (frame: number, start: number, dur = 18, easing: (x: number) => number = easeOut) =>
  interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** 1 while inside [start, end], with ramps on both sides; 0 outside. */
export const window = (frame: number, start: number, end: number, dIn = 12, dOut = 10) =>
  Math.min(ramp(frame, start, dIn), 1 - ramp(frame, end - dOut, dOut, easeIn));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Spring with a little overshoot: the "settle" of a prop that lands. */
export const pop = (frame: number, fps: number, start: number, durationInFrames = 22) =>
  spring({frame: frame - start, fps, config: {damping: 14, mass: 0.9, stiffness: 170}, durationInFrames});

/** Critically damped spring (no bounce). */
export const settle = (frame: number, fps: number, start: number, durationInFrames = 24) =>
  spring({frame: frame - start, fps, config: {damping: 200, mass: 1, stiffness: 120}, durationInFrames});

/** Anticipation + action: dips to -k before rising to 1. t in [0,1]. */
export const anticipate = (t: number, k = 0.12) => {
  if (t < 0.25) return -k * Math.sin((t / 0.25) * Math.PI);
  const u = (t - 0.25) / 0.75;
  return easeOut(u);
};

/** Deterministic pseudo-random in [0,1) from an integer seed (mulberry32). */
export const rand = (seed: number) => {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Slow deterministic wobble in [-1,1] (idle breathing, hovering). */
export const wobble = (frame: number, period = 90, phase = 0) => Math.sin(((frame + phase) / period) * Math.PI * 2);

/** Eye blink: 1 = open, 0 = closed. Blinks last 4 frames, every `every` frames with a seeded offset. */
export const blink = (frame: number, seed = 0, every = 110) => {
  const off = Math.floor(rand(seed) * every);
  const p = (frame + off) % every;
  if (p < 2) return 1 - p / 2;
  if (p < 4) return (p - 2) / 2;
  return 1;
};

/** Squash-and-stretch pair for a landing: returns [sx, sy]. t: 0 = impact, 1 = settled. */
export const squash = (t: number, amount = 0.18): [number, number] => {
  const k = (1 - clamp01(t)) * Math.sin(clamp01(t) * Math.PI) * amount;
  return [1 + k, 1 - k];
};

