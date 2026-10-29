// Elysia cf. marginata, the master design. Everything is in body coordinates:
//   a = distance back from the snout tip (0..100; the slug is 100 units long),
//   v = lateral offset (left +), z = height above the substrate.
// Markings (black spots, pale specks, digestive-gland tubules) are fixed in these coordinates, so they move with the
// tissue and never drift between frames.
import {clamp, lerp, rng, smooth} from '../lib';

export const L = 100;
export const A_CUT = 25; // the autotomy plane: the neck groove just behind the head
export const N0 = 21, N1 = 29; // the neck region that stretches and pinches
export const A_HEART = 33; // the heart (in its pericardium) just behind the neck, on the dorsal midline
export const F0 = 29, F1 = 94; // parapodia attach along the trunk between these

/** half-width of the head and trunk (no parapodia) */
export const halfW = (a: number) => {
  if (a < 0) return 0;
  if (a < 7) return 6.4 * Math.sqrt(1 - Math.pow(1 - a / 7, 2)); // rounded snout
  if (a < 16) return lerp(6.4, 5.9, (a - 7) / 9); // the broad head
  if (a < A_CUT) return lerp(5.9, 3.9, smooth((a - 16) / 9)); // narrowing to the neck groove
  if (a < 36) return lerp(3.9, 5.6, smooth((a - A_CUT) / 11)); // anterior trunk (pericardium)
  if (a < 84) return lerp(5.6, 5.0, (a - 36) / 48);
  if (a < L) return 5.0 * Math.sqrt(Math.max(0, 1 - Math.pow((a - 84) / 16, 2))); // the tail
  return 0;
};
export const heightOf = (a: number) => {
  if (a < 7) return 4.2 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - a / 7, 2)));
  if (a < A_CUT) return lerp(4.2, 3.4, smooth((a - 7) / 18));
  if (a < 36) return lerp(3.4, 6.0, smooth((a - A_CUT) / 11));
  if (a < 84) return 6.0;
  return 6.0 * Math.sqrt(Math.max(0.05, 1 - Math.pow((a - 84) / 16, 2)));
};
/** parapodial spread (base to margin) at a: a broad leaf, fullest a little ahead of mid-trunk */
export const spreadOf = (a: number) => {
  if (a <= F0 || a >= F1) return 0;
  const t = (a - F0) / (F1 - F0);
  return 22.5 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.85)), 0.72);
};
/** parapodial opening angle above the horizontal (degrees): more upright at the ends */
export const angleOf = (a: number) => {
  const t = clamp((a - F0) / (F1 - F0));
  return 34 + 22 * Math.pow(1 - Math.sin(Math.PI * t), 1.6);
};

// ---- markings ----
export type Spot = {part: 'head' | 'dorsum' | 'flap'; side: number; a: number; v: number; r: number; pale?: boolean};
const R = rng(20210308);
const spots: Spot[] = [];
// black spots: dense on the parapodia, scattered on the head and dorsum
for (let i = 0; i < 46; i++) spots.push({part: 'head', side: 0, a: lerp(3, 24, R()), v: lerp(-0.82, 0.82, R()), r: lerp(0.2, 0.4, R())});
for (let i = 0; i < 22; i++) spots.push({part: 'dorsum', side: 0, a: lerp(27, 97, R()), v: lerp(-0.7, 0.7, R()), r: lerp(0.2, 0.38, R())});
for (const side of [1, -1])
  for (let i = 0; i < 135; i++) {
    const a = lerp(F0 + 2, F1 - 2, R());
    spots.push({part: 'flap', side, a, v: lerp(0.08, 0.93, Math.sqrt(R())), r: lerp(0.17, 0.42, R())});
  }
// pale specks (the real animal has small white flecks among the black)
for (let i = 0; i < 18; i++) spots.push({part: 'head', side: 0, a: lerp(4, 23, R()), v: lerp(-0.7, 0.7, R()), r: lerp(0.22, 0.42, R()), pale: true});
for (const side of [1, -1])
  for (let i = 0; i < 36; i++) spots.push({part: 'flap', side, a: lerp(F0 + 3, F1 - 3, R()), v: lerp(0.1, 0.85, R()), r: lerp(0.2, 0.42, R()), pale: true});
export const SPOTS = spots;

/** darker-green mottling patches on the parapodia (flap coords) */
export type Blot = {side: number; a: number; s: number; ra: number; rs: number};
const R3 = rng(4242);
const blots: Blot[] = [];
for (const side of [1, -1]) for (let i = 0; i < 11; i++) blots.push({side, a: lerp(F0 + 6, F1 - 8, R3()), s: lerp(0.2, 0.7, R3()), ra: lerp(2.5, 5.5, R3()), rs: lerp(0.1, 0.2, R3())});
export const BLOTS = blots;

/** digestive-gland tubules branching through each parapodium (flap coords: a, s = 0 base .. 1 margin) */
export type Tubule = {side: number; pts: [number, number][]};
const tub: Tubule[] = [];
const R2 = rng(77);
for (const side of [1, -1])
  for (let i = 0; i < 13; i++) {
    const a0 = lerp(F0 + 4, F1 - 5, (i + 0.3 + R2() * 0.4) / 13);
    const lean = (R2() - 0.5) * 5;
    const main: [number, number][] = [];
    for (let k = 0; k <= 6; k++) main.push([a0 + lean * (k / 6) + Math.sin(k * 1.7 + i) * 0.6, 0.04 + (k / 6) * 0.78]);
    tub.push({side, pts: main});
    // one side branch
    const k0 = 2 + Math.floor(R2() * 2), dir = R2() < 0.5 ? -1 : 1;
    const br: [number, number][] = [main[k0]];
    for (let k = 1; k <= 3; k++) br.push([main[k0][0] + dir * k * 1.6, main[k0][1] + k * 0.08]);
    tub.push({side, pts: br});
  }
// the head has a few fainter tubules too (the gland extends forward)
for (const side of [1, -1]) tub.push({side: side * 2, pts: [[23, 0.15 * side], [17, 0.35 * side], [11, 0.42 * side], [7, 0.3 * side]]});
export const TUBULES = tub;

// ---- palette ----
export const C = {
  outline: '#253F20',
  dorsum: '#86BF64', dorsumHi: '#BBDE96', dorsumLo: '#5E9B47',
  head: '#A4D17E', headHi: '#CFEAAE',
  flapBase: '#68A64E', flapMid: '#95C971', flapEdge: '#BEE09A', edge: '#3F7035',
  foot: '#D6E9BF',
  spot: '#18211A', speck: '#F2F8E4',
  vein: '#3D7C33',
  rhino: '#97C870', rhinoTip: '#F2A23A', rhinoTip2: '#FFD25C',
  heart: '#E0605A', heartHi: '#FF9A8A', peri: '#F7D0C4',
  pale: '#E3EDCF', paleEdge: '#C8D9AF',
};
