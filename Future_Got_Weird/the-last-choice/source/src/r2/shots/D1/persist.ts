// Section D1: machines (and props) that outlive their shots — wrecks, fallen units, pinned heavies — so later shots
// show them where they fell. Pure data/specs only (no React). See src/r2/film/continuity.tsx.
//
// The four units D1 puts down, evaluated with the SAME specs the D1 shots animate (machines.ts), so a later shot at any
// film time shows each one exactly where and how it ended up (torn plates and the torn forearm lying where they landed,
// fluid pools):
//   d1_u4  face down just west of the rim at ≈ (40.3, 3.95) (feet ≈ (41.3, 3.7)): knee broken, killed by a blow on the
//          neck, chest dented
//   d1_u1  on its front over U2 at ≈ (40.8, −3.0) (feet ≈ (41.1, −2.1)): left forearm torn off at the elbow (BR2),
//          chest plate fired off (BR3), dented
//   d1_u2  under U1 at ≈ (40.85, −3.9) (feet ≈ (41.15, −2.95)): left pauldron torn off by the runner's halligan
//   d1_u3  on its back, head-down on the crater's inner slope below "the gap": feet ≈ (47.6, −1.5, y ≈ +0.4), head
//          ≈ (48.65, −2.1, y ≈ −0.4); it went over the crest diagonally (north-east) and slid ~1.25 m down (87.7–88.9)
// plus the fractured slab just inside the crest of the crater's west rim (base x ≈ 47.8, z 1.2 … 5.6; the crest here is
// +1.0…+1.3 at x ≈ 46.5–47) the Crew take cover behind at BREATH.
import type {Persist} from '../../film/continuity';
import {EV, unitD1} from './machines';
import {coverSlabItems} from './props';

export const PERSIST_D1: Persist[] = [
  {key: 'd1_cover', sec: 'D1', from: 0, kind: 'items', items: () => coverSlabItems(), note: 'fractured slab standing on the inner slope of the crater west rim (cover at D1 BREATH; regroup point)'},
  {key: 'd1_u4', sec: 'D1', from: EV.knee, kind: 'unit', spec: (T) => unitD1('U4', T), note: 'knee broken by the breaker (72.45), held his tool, killed by his blow on its neck (76.0); face down west of the rim'},
  {key: 'd1_u1', sec: 'D1', from: EV.br2, kind: 'unit', spec: (T) => unitD1('U1', T), note: 'BR1 hammer on the plate; BR2 forearm torn off by the breaker; BR3 ram fired into its chest; driven into U2, down on top of it'},
  {key: 'd1_u2', sec: 'D1', from: EV.crash, kind: 'unit', spec: (T) => unitD1('U2', T), note: 'U1 driven into it mid wind-up over the runner; down under U1; the runner\'s halligan in its shoulder (84.55)'},
  {key: 'd1_u3', sec: 'D1', from: EV.br4, kind: 'unit', spec: (T) => unitD1('U3', T), note: 'BR4: shoulder-driven up the rim and over the crest; on its back, head-down on the crater inner slope below the gap'},
];
