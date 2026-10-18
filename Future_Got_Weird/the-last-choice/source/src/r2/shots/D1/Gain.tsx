// D1-9a / D1-9b (GAIN1 89.78 → P2 94.30): position gained — under pressure, not a pose. The system pulls its surviving
// front units back across the bowl to the reserve (it regroups); an enemy drone peels off its station and comes in low
// over the crater; the Director waves them on along the crest; they run for the fractured slab on the rim's inner slope
// (./props.ts) and get down behind it as the drone's beam sweeps its top edge. Under the beam: looks pass between them,
// the Director pants, the dented plate on his forearm; his eyes go to the decoy maker (D2's plan).
import {CamKey} from '../../film/stage';
import {M} from '../../timing';
import {shotOf, g} from './shot';

// ------------------------------------------------------------------ D1-9a (89.78–91.50): the run for the slab
// High behind them from the west, looking east over the rim into the bowl: the Director on the crest waving them on;
// the Crew running up the rim for the slab (right); beyond, the survivors walking back east to the reserve, and the
// drone peeling off its station and coming in low at us.
const D19A: CamKey[] = [
  {t: 0, pos: g(41.2, 1.6, 3.0), target: g(49.5, 0.6, 0.4), fov: 52},
  {t: 91.5 - M.GAIN1, pos: g(41.6, 1.9, 2.85), target: g(49.6, 2.2, 0.3), fov: 52},
];
export const D1_9a = shotOf(M.GAIN1, D19A, {drift: 0.02});

// ------------------------------------------------------------------ D1-9b (91.50–94.30): under the beam
// Low in front of them (west of the slab), close: they are down with their backs to it; the amber beam crosses the slab's
// top edge above their heads from left to right (north → south); nobody moves; the looks go round; his signal.
const D19B: CamKey[] = [
  {t: 0, pos: g(42.7, 2.9, 0.75), target: g(47.4, 3.0, 2.05), fov: 54},
  {t: 1.5, pos: g(42.85, 3.05, 0.75), target: g(47.4, 3.2, 1.95), fov: 52},
  {t: M.P2 - 91.5, pos: g(43.05, 3.2, 0.78), target: g(47.3, 3.3, 1.75), fov: 48},
];
export const D1_9b = shotOf(91.5, D19B, {ease: 0.6, drift: 0.012});
