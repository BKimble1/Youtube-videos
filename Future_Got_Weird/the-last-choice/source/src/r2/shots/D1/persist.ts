// Section D1: machines (and props) that outlive their shots — wrecks, fallen units, pinned heavies — so later shots
// show them where they fell. Pure data/specs only (no React). See src/r2/film/continuity.tsx.
//
// The four units D1 puts down, evaluated with the SAME specs the D1 shots animate (machines.ts), so a later shot at any
// film time shows each one exactly where and how it ended up (torn plates lying where they landed, fluid pools):
//   d1_u4  face down just west of the rim at ≈ (40.4, 4.0): left knee broken, back plate pried off, cables torn out
//   d1_u1  on its front at ≈ (41.0, −2.9): chest plate smashed off (the plate lies ~2 m north-west), torso dented
//   d1_u2  under/beside U1 at ≈ (41.0, −3.9): left pauldron torn off
//   d1_u3  on its back down the crater's inner slope beyond "the gap" (head ≈ (47.6, −1.1))
// plus the fractured slab on the crater's west rim (x ≈ 47.8, z 1.2 … 5.6) the Crew take cover behind at BREATH.
import type {Persist} from '../../film/continuity';
import {EV, unitD1} from './machines';
import {coverSlabItems} from './props';

export const PERSIST_D1: Persist[] = [
  {key: 'd1_cover', sec: 'D1', from: 0, kind: 'items', items: () => coverSlabItems(), note: 'fractured slab standing on the inner slope of the crater west rim (cover at D1 BREATH; regroup point)'},
  {key: 'd1_u4', sec: 'D1', from: EV.knee, kind: 'unit', spec: (T) => unitD1('U4', T), note: 'knee broken by the breaker (72.45), back plate pried and cables ripped by the runner (76.8); face down west of the rim'},
  {key: 'd1_u1', sec: 'D1', from: EV.br2, kind: 'unit', spec: (T) => unitD1('U1', T), note: 'BR1 swing on the plate; BR2 chest plate smashed; BR3 tethered into U2; down at the rim'},
  {key: 'd1_u2', sec: 'D1', from: EV.br3Crash, kind: 'unit', spec: (T) => unitD1('U2', T), note: 'BR3: U1 slammed into it; down beside U1'},
  {key: 'd1_u3', sec: 'D1', from: EV.br4, kind: 'unit', spec: (T) => unitD1('U3', T), note: 'BR4: shoulder-charged back over the rim; on its back down the crater inner slope beyond the gap'},
];
