import {Easing, interpolate, spring} from 'remotion';
import {Cam} from './camera';

/**
 * V2 motion vocabulary. Everything is a pure function of the global frame `g`, so renders are deterministic.
 *
 * Principles (see V2_DIRECTION.md):
 *  - things that arrive accelerate in and decelerate out, and usually overshoot a hair and settle (BACK / SNAP);
 *  - things that hit something squash, recoil and settle (impact());
 *  - heavy things move later and slower than light things (HEAVY spring);
 *  - nothing stops dead on a linear curve.
 */
export const FPS = 30;

export const E = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  /** gentle overshoot (~7 %) and settle, for cards and panels landing */
  back: Easing.bezier(0.34, 1.45, 0.64, 1),
  /** small overshoot (~3 %) */
  softBack: Easing.bezier(0.3, 1.2, 0.6, 1),
  /** a drawer: quick start, long deceleration */
  decel: Easing.bezier(0.05, 0.75, 0.15, 1),
  /** wind-up: dips backwards before going */
  windup: Easing.bezier(0.6, -0.3, 0.74, 0.05),
  linear: (x: number) => x,
};

export type Ease = (x: number) => number;

/** 0 → 1 over [start, start + dur], clamped. */
export const tw = (g: number, start: number, dur: number, ease: Ease = E.out) =>
  interpolate(g, [start, start + Math.max(1, dur)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

/**
 * Keyframe track. keys: [frame, value, ease?][] in time order; the ease belongs to the segment arriving at that key.
 * Holds the first value before the first key and the last value after the last key.
 */
export const kf = (g: number, keys: [number, number, Ease?][]): number => {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1, e] = keys[i];
    const [f0, v0] = keys[i - 1];
    if (g <= f1) {
      const t = interpolate(g, [f0, Math.max(f0 + 1, f1)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e ?? E.inOut});
      return v0 + (v1 - v0) * t;
    }
  }
  return keys[keys.length - 1][1];
};

export const SNAP = {damping: 12, stiffness: 210, mass: 0.8};   // lands, overshoots ~8 %, settles in ~14 f
export const SOFT = {damping: 17, stiffness: 120, mass: 1};     // gentle, tiny overshoot
export const HEAVY = {damping: 19, stiffness: 140, mass: 1.7};  // late, weighty, small overshoot
export const FIRM = {damping: 26, stiffness: 180, mass: 1};     // no visible overshoot

/** Spring 0 → 1 starting at `start` (0 before). */
export const sp = (g: number, start: number, config = SNAP, durationInFrames?: number) =>
  g < start ? 0 : spring({frame: g - start, fps: FPS, config, durationInFrames});

/** Decaying oscillation after an impact at t0, in [-1, 1]; 0 before t0. Use for recoil, wobble, jiggle. */
export const ring = (g: number, t0: number, freq = 0.85, decay = 0.22) =>
  g < t0 ? 0 : Math.exp(-(g - t0) * decay) * Math.sin((g - t0) * freq);

/** Squash at an impact on frame t0: returns [scaleX, scaleY] (wide and short at impact, settling back). */
export const impact = (g: number, t0: number, amount = 0.12, dur = 9): [number, number] => {
  if (g < t0 || g > t0 + dur) return [1, 1];
  const u = (g - t0) / dur;
  const k = Math.exp(-u * 4) * Math.cos(u * Math.PI * 1.5) * amount;
  return [1 + k, 1 - k];
};

/**
 * A drop that lands on frame `land` from `height` px above, falling from `land - fall` (accelerating), with one
 * small bounce (~8 % of the height) and a settle. Returns the y offset (negative = above the resting place).
 */
export const drop = (g: number, land: number, height = 60, fall = 8) => {
  if (g <= land - fall) return -height;
  if (g <= land) {
    const u = (g - (land - fall)) / fall;
    return -height * (1 - u * u);
  }
  const b = 7;
  if (g <= land + b) {
    const u = (g - land) / b;
    return -height * 0.08 * Math.sin(u * Math.PI);
  }
  return 0;
};

/** Wind-up, strike, impact, recoil for a press (stamp, button, gavel). Returns 0 (rest/up) .. 1 (contact), with
 *  a negative dip during the anticipation lift. Contact happens exactly at `hit`. */
export const strike = (g: number, hit: number, lift = 7, down = 3, hold = 3, up = 9) => {
  if (g < hit - lift - down) return 0;
  if (g < hit - down) return -0.35 * Math.sin(((g - (hit - lift - down)) / lift) * (Math.PI / 2)); // raise
  if (g < hit) return -0.35 + 1.35 * ((g - (hit - down)) / down) ** 2;                            // accelerate down
  if (g < hit + hold) return 1;
  if (g < hit + hold + up) return 1 - E.out((g - hit - hold) / up);
  return 0;
};

/** Slow, small, seeded idle drift in [-1, 1] (two incommensurate sines). */
export const drift = (g: number, seed = 0, period = 120) =>
  0.65 * Math.sin((g / period + seed * 0.37) * Math.PI * 2) + 0.35 * Math.sin((g / (period * 0.61) + seed * 0.91) * Math.PI * 2);

/** A short hop of an element at a moment (excitement, nudge): returns y offset px, 0 outside [t0, t0+dur]. */
export const hop = (g: number, t0: number, height = 12, dur = 10) =>
  g < t0 || g > t0 + dur ? 0 : -height * Math.sin(((g - t0) / dur) * Math.PI);

/* ------------------------------------------------------------------ camera moves */

export type Move = {at: number; dur: number; to: Cam; ease?: Ease};

/**
 * A directed camera: starts at `start`, holds, and moves only when told. Each move eases into its new framing over
 * `dur` frames ending at `at + dur`. Moves are applied in order; overlapping moves blend from wherever the camera is.
 */
export const camPath = (g: number, start: Cam, moves: Move[]): Cam => {
  let c = start;
  for (const m of moves) {
    const t = tw(g, m.at, m.dur, m.ease ?? E.inOut);
    if (t <= 0) break;
    c = {cx: c.cx + (m.to.cx - c.cx) * t, cy: c.cy + (m.to.cy - c.cy) * t, zoom: c.zoom + (m.to.zoom - c.zoom) * t};
  }
  return c;
};

/** Tiny camera response to an impact: a 1-2 % push that decays in ~8 frames (not a shake). Multiply the zoom. */
export const camKick = (g: number, hits: number[], amount = 0.012) =>
  1 + hits.reduce((acc, h) => acc + (g >= h && g < h + 10 ? amount * Math.exp(-(g - h) * 0.45) : 0), 0);

/** Framing that shows the rectangle [x0, y0, x1, y1] (world px) with a margin, at 16:9. */
export const frameRect = (x0: number, y0: number, x1: number, y1: number, margin = 60): Cam => {
  const w = x1 - x0 + margin * 2;
  const h = y1 - y0 + margin * 2;
  const zoom = Math.min(1920 / w, 1080 / h);
  return {cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, zoom};
};
