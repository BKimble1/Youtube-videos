// V4 heartbeat: ONE explicit schedule for the picture (art/Heart4.tsx) and the sound pass (lib/sound4.ts).
// Every lub, dub and irregular twitch is a listed frame; the drawn heart is the sum of fixed kernels placed on
// those frames, so the squeeze always starts on the frame the sound's lub starts. Pure function of the frame.
//
// Journey: four regular lubs (459, 480, 501, 522; the first is heard before the window has opened), then the
// lethal, irregular rhythm from 536: no shared phase, uneven one-sided twitches every 6-13 frames over a slow,
// low-amplitude quiver (all content at or below 8 Hz), no whole-heart shake above 0.8 world units.
// Treatment: quiver 987-1001 (decaying), ramping down to a near-still reset 1003-1004, a weak organised lub at
// 1005, a full lub at 1026, then regular (period 21).
import {B} from './timeline3';
import {clamp, inv, lerp, noise1, smooth} from './math';

export const HEART4 = {
  /** the dub (S2) lands this many frames after its lub (S1) */
  dub: 5,
  /** regular period (frames) */
  period: 21,
  journey: {
    lubs: [459, 480, 501, 522] as number[],
    /** irregular (lethal) rhythm: onset, frames to full amplitude */
    fib0: 536,
    fibRamp: 6,
    /** uneven one-sided twitches (intervals 7, 11, 6, 9, 13, 7, 10, 8, 12, 9) */
    twitches: [538, 545, 556, 562, 571, 584, 591, 601, 609, 621, 630] as number[],
  },
  treat: {
    quiver0: B.settleHeart0, // 987
    quiver1: B.settleHeart0 + 15, // 1002
    still1: B.settleHeart0 + 17, // 1004: near-still reset 1003-1004
    twitches: [988, 992, 997, 1000] as number[],
    lubs: [B.settleHeart0 + 18, B.settleHeart1, B.settleHeart1 + 21, B.settleHeart1 + 42] as number[], // 1005, 1026, 1047, 1068
    /** the first organised beat is weak */
    amps: [0.6, 1, 1, 1] as number[],
  },
};

export type HeartBeat = {f: number; kind: 'lub' | 'dub' | 'twitch'; amp: number; side?: 'L' | 'R'};

/** Every beat event the picture draws, in frame order: the list the sound pass reads (lub, dub, twitch). */
export const heartBeats = (): HeartBeat[] => {
  const out: HeartBeat[] = [];
  const lub = (f: number, amp: number) => {
    out.push({f, kind: 'lub', amp});
    out.push({f: f + HEART4.dub, kind: 'dub', amp: amp * 0.7});
  };
  HEART4.journey.lubs.forEach((f) => lub(f, 1));
  HEART4.journey.twitches.forEach((f, i) => out.push({f, kind: 'twitch', amp: 0.55 + 0.3 * ((i * 7) % 4) / 3, side: i % 2 ? 'R' : 'L'}));
  HEART4.treat.twitches.forEach((f, i) => out.push({f, kind: 'twitch', amp: lerp(0.8, 0.45, i / 3), side: i % 2 ? 'R' : 'L'}));
  HEART4.treat.lubs.forEach((f, i) => lub(f, HEART4.treat.amps[i]));
  return out.sort((a, b) => a.f - b.f);
};
const BEATS = heartBeats();
const LUBS = BEATS.filter((b) => b.kind === 'lub');
const TWITCHES = BEATS.filter((b) => b.kind === 'twitch');

export type HeartState = {
  /** ventricles: width and long-axis scale about the contraction pivot, wring (deg, apex toward -V) */
  ventW: number;
  ventL: number;
  wring: number;
  /** extra one-sided squeeze of the left / right ventricle (irregular twitches), 0 = none */
  lv: number;
  rv: number;
  /** atria scale (atrial kick just before each lub) */
  atria: number;
  /** great-vessel roots widen a little in systole */
  roots: number;
  /** low-amplitude chamber deformation (irregular state), each about +/-0.02 */
  nRV: number;
  nLV: number;
  nRA: number;
  nLA: number;
  /** whole-heart offset in rig units (|q| <= 0.6 rig = 0.73 world at the PROP scale) */
  qx: number;
  qy: number;
  /** 0 regular .. 1 fully irregular (sensor colour, specular shimmer) */
  chaos: number;
};

/** ventricular contraction 0..1 (k = frames since the lub): squeeze 0-4 (60% by +2), hold, refill with a 1% overshoot */
const ventK = (k: number) => {
  if (k <= 0) return 0;
  if (k <= 4) return 1 - Math.pow(1 - k / 4, 1.4);
  if (k <= 5) return 1;
  if (k <= 9) return lerp(1, -0.125, smooth((k - 5) / 4));
  if (k <= 12) return lerp(-0.125, 0, smooth((k - 9) / 3));
  return 0;
};
/** atrial kick: squeeze over k -5..-2, back by 0 */
const atrK = (k: number) => (k < -5 || k >= 0 ? 0 : k < -2 ? smooth((k + 5) / 3) : 1 - smooth((k + 2) / 2));
const wringK = (k: number) => (k <= 0 || k >= 7 ? 0 : Math.sin((Math.PI * k) / 7) ** 1.5);
const rootK = (k: number) => (k <= 1 ? 0 : k <= 5 ? smooth((k - 1) / 4) : k <= 9 ? 1 - smooth((k - 5) / 4) : 0);
/** one-sided twitch: squeeze over 2 frames, release over 3 (smooth both ways; V4 fix: was 3 + 4, so the twitches 4-5
 *  frames apart overlapped and the heart never relaxed between them; a 5-frame twitch is about 6 Hz, under 8 Hz) */
const TW_LEN = 5;
const twK = (k: number) => (k <= 0 || k >= TW_LEN ? 0 : k <= 2 ? smooth(k / 2) : 1 - smooth((k - 2) / 3));

/** amplitude of the irregular state at frame f (0..1) */
export const fibAmp = (f: number) => {
  const j = HEART4.journey;
  const t = HEART4.treat;
  if (f < t.quiver0 - 1) return f >= j.fib0 ? clamp((f - j.fib0) / j.fibRamp) : 0;
  // treatment: the quiver decays (1 -> 0.6 by 999), eases down into the near-still reset (0.1 at 1003, about 0.05
  // at 1004), then organised beats; smooth ramps, no steps, so the envelope adds no high-frequency content
  if (f <= t.quiver1 - 3) return lerp(1, 0.6, inv(t.quiver0, t.quiver1 - 3, f));
  if (f <= t.still1 - 1) return lerp(0.6, 0.1, smooth(inv(t.quiver1 - 3, t.still1 - 1, f)));
  if (f <= t.still1 + 1) return lerp(0.1, 0, smooth(inv(t.still1 - 1, t.still1 + 1, f)));
  return 0;
};

export const heartAt = (f: number): HeartState => {
  let v = 0;
  let a = 0;
  let w = 0;
  let r = 0;
  for (const b of LUBS) {
    const k = f - b.f;
    if (k < -6 || k > 13) continue;
    // V4 fix: the picture's squeeze for a weak beat is less weak than the sound's level (the first organised beat of
    // the treatment, amp 0.6, still squeezes about 8% of the heart's area; a full beat about 10%)
    const va = 0.5 + 0.5 * b.amp;
    v += va * ventK(k);
    a += va * atrK(k);
    w += va * wringK(k);
    r += va * rootK(k);
  }
  let lv = 0;
  let rv = 0;
  for (const b of TWITCHES) {
    const k = f - b.f;
    if (k <= 0 || k >= TW_LEN) continue;
    if (b.side === 'L') lv += b.amp * twK(k);
    else rv += b.amp * twK(k);
  }
  const A = fibAmp(f);
  // slow noise only (knots every 4-8 frames): nothing above about 4 Hz from the quiver itself
  const n = (rate: number, seed: number) => A * noise1(f * rate, seed);
  const chaos = f >= HEART4.treat.quiver0 - 1 ? clamp(inv(HEART4.treat.still1 + 1, HEART4.treat.quiver0, f)) : clamp((f - HEART4.journey.fib0) / HEART4.journey.fibRamp);
  return {
    ventW: 1 - 0.08 * v,
    ventL: 1 - 0.06 * v,
    wring: 2 * w,
    // one-sided twitches squeeze a ventricle by up to about 12% (V4 fix, was 5.5%: each irregular twitch takes about
    // 4-7% off the heart's area, so the irregular state and its settling read at phone size)
    lv: 0.12 * lv,
    rv: 0.12 * rv,
    atria: 1 - 0.07 * a,
    roots: 1 + 0.04 * r,
    nRV: 0.02 * n(0.2, 31),
    nLV: 0.02 * n(0.17, 32),
    nRA: 0.022 * n(0.23, 33),
    nLA: 0.022 * n(0.15, 34),
    qx: 0.45 * n(0.13, 35),
    qy: 0.45 * n(0.16, 36),
    chaos,
  };
};
