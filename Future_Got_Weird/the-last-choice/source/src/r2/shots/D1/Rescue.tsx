// D1-5 … D1-7b: THE RESCUE (77.45 → 85.64), the R3 proof exchange (production/R3_AUDIT.md §2, "Representative
// exchange"): threat → defense → intervention → counter → consequence → continuation, landed on Portals' accents
// (BR1 78.46 the heavy block, BR2 81.34 the ram meets the forearm, BR3 82.80 the ram fired into the chest, BR4 85.64
// the next exchange). Same battle as every other D1 shot; only the cameras differ.
import {CamKey} from '../../film/stage';
import {add3, lerp} from '../../../kit/math';
import {M} from '../../timing';
import {directorAt} from './crew';
import {shotOf, g} from './shot';

// ------------------------------------------------------------------ D1-5 (77.45–79.70): THREAT and DEFENSE
// Medium three-quarter from the south, a little high, both threats and their distance in one frame: the Director left of
// centre facing right (his face in profile), U1 right of him stepping in; behind them U2 driving the runner back. U1's jab on the plate, then
// the hammer (BR1, 78.48): he plants, blocks, the plate dents, his heels skid back — and U1 FOLLOWS him, two steps, and
// puts its palm on the plate and leans in. The camera drifts left with the displacement.
const D15: CamKey[] = [
  {t: 0, pos: g(41.55, 2.9, 1.9), target: g(41.0, -1.5, 1.25), fov: 40},
  {t: M.BR1 - 77.45, pos: g(41.4, 2.9, 1.9), target: g(40.85, -1.5, 1.25), fov: 40},
  {t: 79.7 - 77.45, pos: g(41.0, 2.85, 1.85), target: g(40.45, -1.45, 1.25), fov: 40},
];
export const D1_5 = shotOf(77.45, D15, {drift: 0.016, shake: 0.9});

// ------------------------------------------------------------------ D1-6 (79.70–81.90): INTERVENTION
// Closer, low from the south-south-west (the same side of the breaker→U1 line as D1-7): U1 shoves him off and winds up
// the finishing hammer; he stumbles back, frame left, his face to us. The breaker comes in fast from screen right, past
// the lens — the Director sees him and ducks LEFT, out of the tool's way; the ram head meets U1's descending forearm (BR2, 81.34) and tears it off at the elbow. U1 turns on him.
const D16: CamKey[] = [
  {t: 0, pos: g(37.85, 2.6, 1.3), target: g(40.2, -0.85, 1.45), fov: 48},
  {t: M.BR2 - 79.7, pos: g(37.95, 2.55, 1.3), target: g(40.3, -0.85, 1.55), fov: 48},
  {t: 81.9 - 79.7, pos: g(38.0, 2.5, 1.3), target: g(40.4, -0.9, 1.45), fov: 48},
];
export const D1_6 = shotOf(79.7, D16, {drift: 0.016, shake: 0.9});

// ------------------------------------------------------------------ D1-7 (81.90–83.90): COUNTER and CONSEQUENCE
// Higher three-quarter from the south-west: U1 has turned on the breaker and catches his tool's head, wrenching it; the
// Director comes up out of his duck and drives the plate into its right knee (82.33): the knee gives, the grip fails;
// the breaker fires the ram into its open chest (BR3, 82.80): the chest plate goes and U1 is driven back, skidding,
// into U2 (83.22), raised over the kneeling runner — both go down, the runner throws himself clear.
const D17: CamKey[] = [
  {t: 0, pos: g(37.5, 1.55, 2.0), target: g(40.65, -1.35, 1.05), fov: 46},
  {t: M.BR3 - 81.9, pos: g(37.45, 1.45, 2.05), target: g(40.7, -1.5, 1.05), fov: 47},
  {t: 83.9 - 81.9, pos: g(37.3, 1.2, 2.15), target: g(40.65, -2.1, 0.85), fov: 49},
];
export const D1_7 = shotOf(81.9, D17, {drift: 0.018, shake: 0.85});

// ------------------------------------------------------------------ D1-7b (83.90–85.64): CONTINUATION
// Higher from the south-west, panning with him: no pause — U3 comes down out of the gap at them (screen right), arms
// rising; the Director goes to meet it (left to right), the breaker behind him; the pile and the runner's pin at the left
// edge (the consequence stays in frame); cut on his movement into BR4.
const D17B: CamKey[] = [
  {t: 0, pos: g(37.4, 3.3, 3.1), target: g(42.6, -1.1, 0.9), fov: 47},
  {t: M.BR4 - 83.9, pos: g(37.9, 3.15, 3.0), target: g(43.6, -1.0, 0.95), fov: 45},
];
void [add3, lerp, directorAt];
export const D1_7b = shotOf(83.9, D17B, {ease: 0.25, drift: 0.025});
