// V2 master design of Elysia cf. marginata, as a deformable 3D surface in body coordinates:
//   a = distance back from the snout tip (0..100), v = lateral (left +), z = height above the substrate.
// The trunk and head are a tube of rings; each parapodium is a curling, ruffled sheet attached along the
// dorsolateral edge; the rhinophores are rolled, tapering tubes. Markings are fixed in these coordinates.
// Separation (stretch, pinch, seal), regrowth and the reflexes are the V1 model, carried over.
import {clamp, lerp, rng, smooth} from '../../lib';
import {Path} from '../../geo';
import type {V3} from '../../kit/three';

export const L = 100;
export const A_CUT = 22; // the autotomy plane: the neck groove just behind the head
export const N0 = 17, N1 = 27; // the neck region that stretches and pinches
export const A_HEART = 31; // heart in its pericardium, just behind the neck, under the dorsal hump
export const F0 = 28, F1 = 95; // parapodia attach along the trunk between these

/** half-width of the head and trunk */
export const halfW = (a: number) => {
  if (a < 0) return 0;
  if (a < 6) return 7.0 * Math.sqrt(1 - Math.pow(1 - a / 6, 2)); // rounded snout
  if (a < 13) return lerp(7.0, 6.8, (a - 6) / 7); // the broad head
  if (a < A_CUT) return lerp(6.8, 4.7, smooth((a - 13) / 9)); // narrowing to the neck groove
  if (a < 34) return lerp(4.7, 6.3, smooth((a - A_CUT) / 12)); // anterior trunk (pericardial hump)
  if (a < 84) return lerp(6.3, 5.6, (a - 34) / 50);
  if (a < L) return 5.6 * Math.sqrt(Math.max(0, 1 - Math.pow((a - 84) / 16, 2))); // the tail
  return 0;
};
export const heightOf = (a: number) => {
  if (a < 6) return 5.8 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - a / 6, 2)));
  if (a < 12) return lerp(5.8, 6.2, (a - 6) / 6);
  if (a < A_CUT) return lerp(6.2, 4.6, smooth((a - 12) / 10));
  if (a < 34) return lerp(4.6, 8.0, smooth((a - A_CUT) / 12)) + 1.0 * Math.exp(-Math.pow((a - A_HEART) / 4, 2)); // hump
  if (a < 84) return lerp(8.0, 7.2, (a - 34) / 50);
  return 7.2 * Math.sqrt(Math.max(0.04, 1 - Math.pow((a - 84) / 16, 2)));
};
/** parapodial sheet length (base to margin): a broad leaf, fullest a little ahead of mid-trunk */
export const spreadOf = (a: number) => {
  if (a <= F0 || a >= F1) return 0;
  const t = (a - F0) / (F1 - F0);
  return 23 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.82)), 0.7);
};

// ---- the piece: one run of the body laid on a path ----
export type Piece = {
  id: string;
  path: Path;
  tip: number;
  a0: number;
  a1: number;
  scale?: number;
  gap?: number;
  pinch?: number;
  seal?: number;
  grow?: number;
  flinch?: number;
  /** a local reflex: the parapodium on `side` curls hard around a, spreading along the margin */
  twitch?: {side: number; a: number; amp: number};
  xray?: number;
  heart?: number;
  beat?: number;
  t?: number;
  green?: number;
  bend?: number;
  sway?: number;
  surge?: number;
  /** crawling: pedal-wave phase (radians) and amplitude */
  crawl?: number;
  crawlAmp?: number;
  /** the head lifts its front a little (feeding, sensing) */
  rear?: number;
  /** sagittal cutaway: the near half removed between a0 and a1 (open 0..1) */
  cut?: {a0: number; a1: number; open: number};
  /** the weak spot: a fine line marking the breaking plane at the neck groove (0..1) */
  weak?: number;
};

const growLen = (g: number) => lerp(0.06, 1, smooth(clamp(g)));
const growWid = (g: number) => lerp(0.62, 1, smooth(clamp(g * 1.25)));
export const growFlap = (g: number) => smooth(clamp((g - 0.24) / 0.62));
export const growPale = (g: number) => 1 - smooth(clamp((g - 0.12) / 0.85));
export const growSpots = (g: number) => smooth(clamp((g - 0.42) / 0.5));
export const isRegen = (p: Piece) => p.grow !== undefined;

/** arc distance back from the tip for anatomical a */
export const dist = (p: Piece, a: number) => {
  const gap = p.gap ?? 0, g = p.grow ?? 1, fl = p.flinch ?? 0, su = p.surge ?? 0;
  let d = a * (1 + su);
  if (a > A_CUT) d = A_CUT * (1 + su) + (a - A_CUT) * growLen(g) * (1 + su);
  d += gap * clamp((a - N0) / (N1 - N0));
  if (a > N1) d -= (a - N1) * 0.08 * fl * growLen(g);
  return d;
};
/** width factor in the neck (pinch / seal) and through regrowth */
export const wf = (p: Piece, a: number) => {
  let f = 1;
  if (isRegen(p)) {
    const g = p.grow!;
    if (a > N0 && a <= A_CUT) f = lerp(1, Math.sqrt(Math.max(0, 1 - Math.pow((a - N0) / (A_CUT - N0), 2))), 1 - smooth(clamp(g / 0.12)));
    if (a > A_CUT) {
      f = lerp(1, growWid(g), smooth(clamp((a - A_CUT) / 6))) * smooth(clamp(g / 0.07));
      // while it is short the new tissue ends in a rounded bud, not a flat cut
      const u = (a - A_CUT) / (100 - A_CUT);
      f *= lerp(Math.sqrt(clamp((1 - u) / 0.3)), 1, smooth(clamp((g - 0.3) / 0.5)));
    }
    return f;
  }
  if (a > N0 && a < N1) {
    const u = (a - N0) / (N1 - N0);
    const pin = 1 - (p.pinch ?? 0) * 0.5 * (1 - Math.cos(2 * Math.PI * u));
    const dome = a <= A_CUT ? Math.sqrt(Math.max(0, 1 - Math.pow((a - N0) / (A_CUT - N0), 2))) : Math.sqrt(Math.max(0, 1 - Math.pow((N1 - a) / (N1 - A_CUT), 2)));
    f = lerp(pin, dome, p.seal ?? 0);
  }
  return f;
};

export type Geo = {
  w: (a: number) => number;
  h: (a: number) => number;
  sp: (a: number) => number;
  /** world point at body coords */
  at: (a: number, v: number, z: number) => V3;
  /** a point on a parapodium: side ±1, a, s (0 base .. 1 margin) */
  flap: (side: number, a: number, s: number) => V3;
  /** tube surface point: a, theta (0 = left side, pi/2 = top) */
  tube: (a: number, th: number) => V3;
};

export const geo = (p: Piece): Geo => {
  const sc = p.scale ?? 1, t = p.t ?? 0, fl = p.flinch ?? 0, bend = p.bend ?? 0, g = p.grow ?? 1;
  const cr = p.crawl ?? 0, ca = p.crawlAmp ?? 0, rear = p.rear ?? 0;
  // pedal waves: muscular swellings travelling back along the body while it crawls
  const wave = (a: number) => ca * Math.sin(a * 0.3 - cr);
  const w = (a: number) => halfW(a) * wf(p, a) * (1 + 0.035 * wave(a));
  const h = (a: number) => heightOf(a) * Math.min(1, wf(p, a) * 1.1 + 0.12) * (1 + 0.05 * wave(a + 3));
  const tw = p.twitch;
  const twAt = (side: number, a: number) => (tw && tw.side === side ? tw.amp * Math.exp(-Math.pow((a - tw.a) / 13, 2)) : 0);
  const sp = (a: number) => spreadOf(a) * growFlap(g) * (1 - 0.14 * fl);
  const at = (a: number, v: number, z: number): V3 => {
    const pt = p.path.at(p.tip - dist(p, a) * sc);
    const nx = -pt.ty, ny = pt.tx;
    const b = bend * Math.pow(clamp((a - 30) / 70), 2);
    // the front of the head lifts when it rears up (feeding, sensing)
    const lift = rear * Math.pow(clamp(1 - a / 16), 1.5) * 4;
    return [pt.x + nx * (v + b) * sc, pt.y + ny * (v + b) * sc, (z + lift) * sc];
  };
  // asymmetric parapodia: the left opens wider and ruffles more; the right curls in further
  const SIDE = {[1]: {open: 20, curl: 50, ruff: 1.2, ph: 0.0}, [-1]: {open: 28, curl: 58, ruff: 0.95, ph: 2.1}} as Record<number, {open: number; curl: number; ruff: number; ph: number}>;
  const flap = (side: number, a: number, s: number): V3 => {
    const S = SIDE[side];
    const wa = w(a), ha = h(a), spr = sp(a) * (1 - 0.32 * twAt(side, a));
    const tt = clamp((a - F0) / (F1 - F0));
    const ends = Math.pow(1 - Math.sin(Math.PI * tt), 1.4);
    // margin ruffles: a few slow waves along the edge, drifting with time
    const ruf = S.ruff * (Math.sin(a * 0.46 + t * 1.1 + S.ph) * 7 + Math.sin(a * 1.17 - t * 0.7 + S.ph) * 3.5);
    const a0d = S.open + 30 * ends + 34 * fl + 70 * twAt(side, a);
    let lat = wa * (0.98 + 0.04 * Math.sin(a * 0.31 + side)), z = ha * 0.34;
    const n = 6, ds = (spr * s) / n;
    for (let k = 1; k <= n; k++) {
      const u = (k / n) * s;
      const ang = ((a0d + (S.curl + 35 * twAt(side, a)) * u * u + ruf * u * u) * Math.PI) / 180;
      lat += Math.cos(ang) * ds;
      z += Math.sin(ang) * ds;
    }
    return at(a, side * lat, z);
  };
  const tube = (a: number, th: number): V3 => {
    const wa = w(a), ha = h(a);
    const c = Math.cos(th), s = Math.sin(th);
    // a domed back over a flat, slightly flared foot
    const v = wa * Math.sign(c) * Math.pow(Math.abs(c), 0.85) * (s < 0 ? 1 + 0.1 * (1 + s) : 1);
    const z = s >= 0 ? ha * (0.38 + 0.62 * Math.pow(s, 0.9)) : ha * 0.38 * (1 + s) * 0.92;
    return at(a, v, Math.max(0.02, z));
  };
  return {w, h, sp, at, flap, tube};
};

// ---- markings ----
export type Spot = {part: 'tube' | 'flap'; side: number; a: number; q: number; r: number; pale?: boolean};
const R = rng(20210308);
const spots: Spot[] = [];
// black spots: scattered on the head and dorsum (q = theta), dense on the outer parapodia (q = s)
for (let i = 0; i < 60; i++) spots.push({part: 'tube', side: 0, a: lerp(2.5, 21, R()), q: lerp(0.35, 2.8, R()), r: lerp(0.24, 0.5, R())});
for (let i = 0; i < 30; i++) spots.push({part: 'tube', side: 0, a: lerp(24, 98, R()), q: lerp(0.9, 2.25, R()), r: lerp(0.24, 0.45, R())});
for (const side of [1, -1])
  for (let i = 0; i < 150; i++) spots.push({part: 'flap', side, a: lerp(F0 + 2, F1 - 2, R()), q: lerp(0.1, 0.94, Math.sqrt(R())), r: lerp(0.16, 0.42, R())});
for (let i = 0; i < 22; i++) spots.push({part: 'tube', side: 0, a: lerp(3, 20, R()), q: lerp(0.6, 2.5, R()), r: lerp(0.2, 0.36, R()), pale: true});
for (const side of [1, -1]) for (let i = 0; i < 40; i++) spots.push({part: 'flap', side, a: lerp(F0 + 3, F1 - 3, R()), q: lerp(0.12, 0.85, R()), r: lerp(0.18, 0.36, R()), pale: true});
export const SPOTS = spots;

/** digestive-gland tubules in each parapodium (a, s) and in the head (a, theta) */
export type Tubule = {side: number; pts: [number, number][]};
const tub: Tubule[] = [];
const R2 = rng(77);
for (const side of [1, -1])
  for (let i = 0; i < 14; i++) {
    const a0 = lerp(F0 + 4, F1 - 5, (i + 0.3 + R2() * 0.4) / 14);
    const lean = (R2() - 0.5) * 6;
    const main: [number, number][] = [];
    for (let k = 0; k <= 7; k++) main.push([a0 + lean * (k / 7) + Math.sin(k * 1.7 + i) * 0.7, 0.05 + (k / 7) * 0.8]);
    tub.push({side, pts: main});
    const k0 = 2 + Math.floor(R2() * 3), dir = R2() < 0.5 ? -1 : 1;
    const br: [number, number][] = [main[k0]];
    for (let k = 1; k <= 3; k++) br.push([main[k0][0] + dir * k * 1.8, main[k0][1] + k * 0.08]);
    tub.push({side, pts: br});
  }
export const TUBULES = tub;

// ---- palette (the Weird Crew finish: mid tones, lit() toward warm white, shade() toward cool deep) ----
export const C = {
  body: '#74B751', head: '#86C35E', foot: '#C8E2A6',
  flapOut: '#5FA645', flapIn: '#9ACF6C', flapEdge: '#2F6A2C', glow: '#D6EE96',
  spot: '#16201A', speck: '#F3F9E6', vein: '#467E36',
  rhino: '#92C66C', rhinoTip: '#F2A13A', rhinoTip2: '#FFD45E',
  heart: '#D9574F', heartHi: '#FF9C8C', peri: '#F3CDBF', section: '#E5EFC6', sectionDeep: '#B9D58E', gland: '#5E9C47',
  pale: '#E3EDCF',
};
