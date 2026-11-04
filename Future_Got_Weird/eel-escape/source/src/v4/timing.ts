// V4: the shot sequence and the hand-off contracts between shots. Every time is GLOBAL film time (s), keyed to the
// measured word times of the locked narration (data/timeline.json; lib.ts word()). The film is 24.80 s, 744 frames.
//
// Each shot is a module in src/v4/shots/ that renders a whole 1080 x 1920 frame for any global t in its window (plus
// ~0.25 s either side, for dissolves). The film (FilmV4) cuts between them at the times below.
import {P} from '../core/geo';
import {N, RADII, EEL_L} from './eelV4';

export const T = {
  // S1 OPEN: rear three-quarter behind the predator's cheek; the tail already out of the gill in a loose S
  breathPeak: 0.2, // the cover breathes once (open peak) ...
  flick: 0.24, // ... and the tail flicks independently across it, out of phase
  follow0: 1.64, // "belongs": follow the tail to the gill edge
  peek: 2.15, // a breath lifts the cover: the SAME body continues inside
  // S2 GULP: a short side view of the earlier gulp; the eel's body curve matched at the cut
  gulp: 2.62,
  mouthShut: 3.18, // the mouth closes on the tail ("swallowed" 3.00–3.54): the gulp sound
  // S3 XRAY: research tank, the fish crosses an X-ray field; full skeletal profile on "X-ray" (4.94)
  xray: 3.84,
  xrayFull: 4.94,
  // S4 STOMACH: newly drawn stomach interior; the tail carries us in
  stomach: 5.78,
  backUp: 7.49, // "starts backing up": the tail probes along the wall ...
  found: 8.2, // ... and finds the opening (the entrance to the esophagus)
  // S5 THROAT (+ S6 GILLS): alongside the tail in a narrow passage; then a new angle toward the gill arches
  throat: 8.9,
  slides: 9.27,
  bodyWipe: 10.45, // the moving body fills the foreground; behind it, the view toward the gill structures
  slips: 10.89,
  gap: 11.47,
  // S7 POKE: the tip crosses the gill edge (inside) -> the same tip breaks into open water (outside); match cut
  poke: 12.58,
  // S8 FOLLOWS: elevated over the predator's back; a growing length slides out and bows into the current
  follows: 13.86,
  // S9 HEAD: tight at the gill edge; the eye just inside, the neck through the gap, the body curling outside
  head: 15.96,
  // S10 RELEASE: low beside the fish; the loose curve in front of us; tighten; the head clears ONCE on "pull"
  curl: 17.96,
  tighten: 20.3,
  release: 20.82,
  // S11 SWIM: track alongside the eel through reeds; the predator recedes behind it
  swim: 21.3,
  // S12 LOOP: a reed close to the lens wipes back to frame 0
  reed: 24.3,
  end: 24.8,
} as const;

export type ShotId = 'open' | 'gulp' | 'xray' | 'stomach' | 'throat' | 'poke' | 'follows' | 'head' | 'release' | 'swim' | 'loop';
export const SHOTS: {id: ShotId; t0: number; t1: number}[] = [
  {id: 'open', t0: 0, t1: T.gulp},
  {id: 'gulp', t0: T.gulp, t1: T.xray},
  {id: 'xray', t0: T.xray, t1: T.stomach},
  {id: 'stomach', t0: T.stomach, t1: T.throat},
  {id: 'throat', t0: T.throat, t1: T.poke}, // S5 throat + S6 gills + the inside half of the S7 match
  {id: 'poke', t0: T.poke, t1: T.follows},
  {id: 'follows', t0: T.follows, t1: T.head},
  {id: 'head', t0: T.head, t1: T.curl},
  {id: 'release', t0: T.curl, t1: T.swim},
  {id: 'swim', t0: T.swim, t1: T.reed},
  {id: 'loop', t0: T.reed, t1: T.end},
];

// ---------------------------------------------------------------- the caption band
/** captions sit in the TOP band, centred on y = 340 (one or two lines: y ≈ 210..470, x 110..870). Every shot keeps
 *  the eel and the gill gap BELOW y = KEEP_Y (the whole frame width), so no caption ever covers them. */
export const CAP_Y = 340;
export const KEEP_Y = 500;
/** what each shot reports for the caption check, per frame: the eel's screen samples (centre + radius, px) and the
 *  gill gap's screen polygon when it is in view */
export type KeepOut = {eel: {x: number; y: number; r: number}[]; gap?: P[]};

// ---------------------------------------------------------------- hand-off 1: S3 X-ray -> S4 stomach (the tail carries us in)
/** the carried tail: the eel's LAST 12 eel units (tail tip included) in SCREEN px, for t in [CARRY0, CARRY1]. Both
 *  the X-ray shot (ending) and the stomach shot (starting) draw their eel so that its last 12 units lie on exactly
 *  these points (blend into them before CARRY0 / out of them after CARRY1 as you like). The tail is big (55 px per
 *  eel unit), sweeping: a wave runs toward the tip, the tip swings up and to the left. The film dissolves between
 *  the two shots over 5.72–5.84, so the tail is the one constant in the frame. */
export const CARRY0 = 5.62, CARRY1 = 5.94;
export const CARRY_UNITS = 12;
export const CARRY_PX = 55;
export const carryTail = (t: number): {pts: P[]; r: number[]; i0: number} => {
  // sample indices of the last 12 units: i0 .. N
  const i0 = Math.round(N * (1 - CARRY_UNITS / EEL_L));
  const tt = Math.max(CARRY0 - 0.2, Math.min(CARRY1 + 0.2, t)) - T.stomach;
  // the anchor (12 units behind the tip) drifts slowly; the heading along the tail bends and swings
  const ax = 860 + 40 * tt, ay = 1330 - 30 * tt;
  const n = N - i0;
  const pts: P[] = [];
  let x = ax, y = ay;
  // integrate from the anchor toward the tip: heading θ(a) (screen angle, y down; pointing tip-ward = up-left)
  const head = (a: number) => {
    const base = (-140 * Math.PI) / 180; // up-left
    const bend = (-0.035 + 0.02 * tt) * a; // the tail curls a little (rad per unit)
    const wave = 0.32 * Math.sin(2 * Math.PI * (1.6 * tt - a / 9)) * (a / CARRY_UNITS); // grows toward the tip
    return base + bend + wave + 0.55 * tt;
  };
  const seg = (CARRY_UNITS * CARRY_PX) / n;
  const out: P[] = [{x, y}];
  for (let k = 1; k <= n; k++) {
    const a = (k - 0.5) * (CARRY_UNITS / n);
    const th = head(a);
    x += Math.cos(th) * seg;
    y += Math.sin(th) * seg;
    out.push({x, y});
  }
  for (const p of out) pts.push(p);
  // pts run anchor (sample i0) -> tip (sample N): the eel's snout->tail order
  const r = Array.from({length: n + 1}, (_, k) => RADII[i0 + k] * CARRY_PX);
  return {pts, r, i0};
};

// ---------------------------------------------------------------- hand-off 2: S6 inside -> S7 outside (the poke)
/** the match on "pokes out the side": the tail TIP crosses the gill edge at the same screen point, moving the same
 *  way, at the same size, on both sides of the cut at T.poke. For t in [POKE0, POKE1] both shots draw the eel's last
 *  8 eel units on these screen points; the gill edge (inside: the rim of the opening against the bright water
 *  beyond; outside: the cover's rear edge) is the line EDGE, which the tip crosses at T.poke. */
export const POKE0 = 12.44, POKE1 = 12.72;
export const POKE_UNITS = 8;
export const POKE_PX = 60;
export const POKE_AT: P = {x: 540, y: 1010};
export const POKE_DIR: P = {x: 0.9, y: -0.436}; // unit, the tip's travel (right and a little up)
export const POKE_SPEED = 240; // px/s
/** the gill edge on screen at the cut: a gently curved line through POKE_AT, roughly across the tip's travel */
export const EDGE: P[] = [
  {x: 452, y: 760},
  {x: 505, y: 885},
  {x: 540, y: 1010},
  {x: 562, y: 1130},
  {x: 568, y: 1250},
];
export const pokeTail = (t: number): {pts: P[]; r: number[]; i0: number} => {
  const i0 = Math.round(N * (1 - POKE_UNITS / EEL_L));
  const tt = Math.max(POKE0 - 0.2, Math.min(POKE1 + 0.2, t)) - T.poke;
  const tip = {x: POKE_AT.x + POKE_DIR.x * POKE_SPEED * tt, y: POKE_AT.y + POKE_DIR.y * POKE_SPEED * tt};
  const n = N - i0;
  // from the tip back along the body: the reverse of the travel, bending slightly downward, a small wave
  const back = Math.atan2(-POKE_DIR.y, -POKE_DIR.x);
  const seg = (POKE_UNITS * POKE_PX) / n;
  const rev: P[] = [tip];
  let x = tip.x, y = tip.y;
  for (let k = 1; k <= n; k++) {
    const a = (k - 0.5) * (POKE_UNITS / n);
    const th = back - 0.03 * a + 0.12 * Math.sin(2 * Math.PI * (2.2 * tt + a / 7)) * (1 - a / POKE_UNITS);
    x += Math.cos(th) * seg;
    y += Math.sin(th) * seg;
    rev.push({x, y});
  }
  const pts = rev.reverse(); // sample i0 (8 units behind the tip) -> N (the tip)
  const r = Array.from({length: n + 1}, (_, k) => RADII[i0 + k] * POKE_PX);
  return {pts, r, i0};
};

// ---------------------------------------------------------------- hand-off 3: S4 stomach -> S5 throat (through the opening)
/** the stomach shot ends by following the tail tip INTO the opening: by T.throat the opening's dark lumen covers
 *  ≥ 85 % of the frame (colour LUMEN); the throat shot begins in that same dark and opens out of it. The film
 *  dissolves over T.throat ± 0.05 s. */
export const LUMEN = '#2B0D11';
