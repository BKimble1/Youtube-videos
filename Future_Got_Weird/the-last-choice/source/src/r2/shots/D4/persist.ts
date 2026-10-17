// Section D4: what outlives its shots, for E/F and anything later (src/r2/film/continuity.tsx).
//
// The machines D4 downs (W1–W3 = 7501–7503) are the aftermath tableau's own wrecks (shots/EF/tableau.ts TB_WRECKS:
// EF draws them) and heavy 2, the ring and the holders are the tableau's too — none of them is registered here (it
// would draw them twice). What D4 adds to the world and leaves lying:
//   d4_h2slab    the slab of road heavy 2 staggers off (tips at 166.46); on the avenue at ≈ (28.3–30.4, 2.8–4.4)
//   d4_cable     the cut tether cable wound round W3's shins, its free end on the street
//   d4_launcher  the tether launcher, torn from her hands by H1 and flung down at ≈ (18.9, −0.9)
//   d4_halligan  the runner's halligan, knocked from his hand, at ≈ (18.6, 6.8)
//   d4_tablet    the smashed tablet the decoy maker let fall at ≈ (11.6, 5.2)
//   d4_controller the drone pilot's controller, knocked from her hands at ≈ (11.8, 4.3)
//   d4_breaker   the empty breaker, dropped as the breaker's leg gave, at ≈ (10.6, 8.5)
import type {Persist} from '../../film/continuity';
import {wreckSpecs} from '../EF/tableau';
import {DROPS, dropAt, heavySlab, wrapPoints, polyCable, looseEnd} from './props';

const W3 = (T: number) => wreckSpecs(T).find((w) => w.id === 7503)!;
export const PERSIST_D4: Persist[] = [
  {key: 'd4_h2slab', sec: 'D4', from: 0, kind: 'items', items: (_v, T) => [heavySlab(T)], note: 'a slab of road on the avenue; heavy 2 staggers off it at LOCAL_WIN (it tips)'},
  {key: 'd4_cable', sec: 'D4', from: 165.45, kind: 'items', items: (_v, T) => { const w = wrapPoints(W3(T)); return [...polyCable(w, 'd4p_wrap'), ...polyCable(looseEnd(w[w.length - 1]), 'd4p_loose')]; }, note: 'the cut tether cable wound round W3\'s shins (it toppled bound), the free end on the street'},
  ...Object.entries(DROPS).map(([k, d]): Persist => ({key: `d4_${k}`, sec: 'D4', from: d.t0 + d.flight, kind: 'items', items: (_v, T) => { const it = dropAt(d, Math.max(T, d.t0 + d.flight)); return it ? [it] : []; }, note: `the ${k}, lost in D4, where it came to rest`})),
];
