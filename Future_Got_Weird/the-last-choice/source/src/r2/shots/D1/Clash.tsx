// D1-3 … D1-4d: CLASH and the line. The machines strike first; then simultaneous but ranked exchanges (one main event,
// one secondary, quieter background), cut on the events: the breaker and U4, the tether covering the runner, the drone
// covering the breaker, the flare carrier covering the two at the back. Same battle as every other D1 shot.
import {CamKey} from '../../film/stage';
import {M} from '../../timing';
import {breakerAt, tetherAt, flaresAt} from './crew';
import {shotOf, g} from './shot';

// ------------------------------------------------------------------ D1-3 (CLASH 68.30–70.30): the hammer on the plate
// Cut on the beat to a low medium three-quarter from the south-south-west (he left, U1 right): U1's running hammer comes
// down on his raised plate (68.33) and stops him dead, heels skidding; its left punch is parried off the plate; he steps
// inside and bashes it back three steps into U3, which has come down from the gap to catch it. The camera eases back.
const D13: CamKey[] = [
  {t: 0, pos: g(40.3, 2.65, 0.78), target: g(41.75, -0.7, 1.32), fov: 42},
  {t: 0.6, pos: g(40.25, 2.68, 0.8), target: g(41.6, -0.7, 1.3), fov: 42},
  {t: 1.3, pos: g(40.15, 2.85, 0.92), target: g(41.9, -0.72, 1.25), fov: 45},
  {t: 70.3 - M.CLASH, pos: g(40.0, 3.15, 1.15), target: g(42.4, -0.75, 1.2), fov: 49},
];
export const D1_3 = shotOf(M.CLASH, D13, {drift: 0.018, shake: 0.8});

// ------------------------------------------------------------------ D1-3b (70.30–72.00): the line, ranked
// Wider and higher from the south-west, over the breaker's shoulder: the main event in the foreground — U4's hammer
// taken on the raised shaft (70.6); beyond, the Director and U1 squaring up again, U2's hammer on the runner's bar
// (71.25); far left the tether operator backing out of U5's swing; U3 back up in the gap. U4 winds up again (cut).
const D13B: CamKey[] = [
  {t: 0, pos: g(37.3, 6.3, 2.15), target: g(40.6, 1.4, 1.05), fov: 50},
  {t: 72.0 - 70.3, pos: g(37.55, 6.05, 2.0), target: g(40.75, 1.6, 1.0), fov: 48},
];
export const D1_3b = shotOf(70.3, D13B, {drift: 0.022});

// ------------------------------------------------------------------ D1-4a (72.00–73.30): the knee
// Low from the south: U4's punch goes over the ducking breaker, who comes up swinging into its left knee (72.45): it
// drops to the knee — and catches his tool's head as he re-cocks (73.15).
const C1: CamKey[] = [
  {t: 0, pos: g(40.2, 6.35, 0.55), target: g(40.85, 3.4, 0.95), fov: 46},
  {t: 1.3, pos: g(40.35, 6.25, 0.52), target: g(40.95, 3.45, 0.8), fov: 44},
];
export const D1_4a = shotOf(72.0, C1, {opts: (T) => ({tweak: {breaker: {anchor: breakerAt(T).pts?.front}}})});

// ------------------------------------------------------------------ D1-4b (73.30–74.90): the tether covers the runner
// Low from the south-west, the tether operator on the left: centre frame U5 leaves her and goes for the runner's back
// (right, ducking U2's punch at 73.5). She fires (74.1), the clamp bites its shin (74.4), the reel yanks the leg out (74.52): it goes over.
const C2: CamKey[] = [
  {t: 0, pos: g(33.6, -4.0, 1.2), target: g(39.0, -5.6, 1.05), fov: 50},
  {t: 1.6, pos: g(33.7, -4.05, 1.15), target: g(39.1, -5.7, 0.9), fov: 49},
];
export const D1_4b = shotOf(73.3, C2, {opts: (T) => ({tweak: {tether: {anchor: tetherAt(T).pts?.muzzle}}})});

// ------------------------------------------------------------------ D1-4c (74.90–76.40): the drone covers the breaker
// Low from the south-west of the breaker: U4, on its knee, wrenches his tool; the allied drone dives into its face
// (75.3); it lets go to swat at it — he stumbles back, winds up and brings the ram down on its neck (76.0).
const C3: CamKey[] = [
  {t: 0, pos: g(38.55, 5.35, 1.0), target: g(40.85, 3.3, 1.3), fov: 46},
  {t: 1.5, pos: g(38.7, 5.25, 0.95), target: g(40.95, 3.4, 1.15), fov: 44},
];
export const D1_4c = shotOf(74.9, C3, {opts: (T) => ({tweak: {breaker: {anchor: breakerAt(T).pts?.front}}})});

// ------------------------------------------------------------------ D1-4d (76.40–77.45): the flare
// Behind the flare carrier's right shoulder, looking north: U6 has given up on her and is striding at the two at the
// back (the decoy maker sketching, the pilot flying); she strikes a flare and puts it in its eye (77.17).
const C4: CamKey[] = [
  {t: 0, pos: g(38.3, 9.6, 1.3), target: g(35.6, 5.4, 1.3), fov: 46},
  {t: 1.05, pos: g(38.25, 9.5, 1.25), target: g(35.7, 5.45, 1.35), fov: 45},
];
export const D1_4d = shotOf(76.4, C4, {opts: (T) => ({tweak: {flares: {anchor: flaresAt(T).pts?.hand}}})});
