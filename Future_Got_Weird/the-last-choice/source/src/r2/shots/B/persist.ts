// Section B: what B leaves changed on the ridge for later shots — the slab the Director lay under (dropped back onto
// its mounds a little lower once he crawled out), the rubble it rests on, and the chunks he shed as he rose, where they
// came to rest. No machine is damaged in B. Pure specs/items (see src/r2/film/continuity.tsx); later sections draw
// them with persistItems(view, T).
import type {Persist} from '../../film/continuity';
import {M} from '../../timing';
import {rubbleRestItems} from './rubble';

export const PERSIST_B: Persist[] = [
  {key: 'b_slab', sec: 'B', from: M.ORCH, kind: 'items', items: () => rubbleRestItems(), note: 'the slab he crawled out from under (crest notch at x ≈ 0–1.1, z 0.2–2.6) and the chunks he shed'},
];
