// Section D2: machines (and props) that outlive their shots — wrecks, fallen units, pinned heavies — so later shots
// show them where they fell. Pure data/specs only (no React). See src/r2/film/continuity.tsx.
//
// The four units D2 puts down, evaluated with the SAME specs the D2 shots animate (machines.ts). Rest positions at P3:
//   d2_B  crumpled forward on the north-west slope, chest ≈ (51.6, −6.4), head ≈ (51.9, −6.2): left knee broken
//         (breaker), back plate pried off and cables ripped out (runner)
//   d2_A  at the girder's foot between posts 3 and 4, chest ≈ (51.4, −9.1), head ≈ (51.7, −9.0): right pauldron torn
//         (the Director's bash), back plate burst at the crash
//   d2_C  slumped under the bottom chord, chest ≈ (49.2, −9.6), head ≈ (49.1, −9.2): chest plate torn off on the chord
//   d2_D  on the rim crest, chest ≈ (49.3, −5.0), head ≈ (49.2, −4.6), feet ≈ (50.1, −5.5): the Director's counter;
//         right pauldron torn, dented, leaking
import type {Persist} from '../../film/continuity';
import {EV2, unitD2} from './machines';

export const PERSIST_D2: Persist[] = [
  {key: 'd2_B', sec: 'D2', from: EV2.knee, kind: 'unit', spec: (T) => unitD2('B', T), note: 'FLANK: knee broken (103.1), back plate pried (104.5) and cables ripped (104.92); toppled forward down the NW slope'},
  {key: 'd2_A', sec: 'D2', from: EV2.crash, kind: 'unit', spec: (T) => unitD2('A', T), note: 'bashed (103.62), clamped (106.22) and dragged by the reel into C; slammed into the girder between posts 3 and 4 (107.95)'},
  {key: 'd2_C', sec: 'D2', from: EV2.crash, kind: 'unit', spec: (T) => unitD2('C', T), note: 'hit by the dragged A (107.55) and driven into the girder (107.95); slumped under the bottom chord'},
  {key: 'd2_D', sec: 'D2', from: EV2.counter, kind: 'unit', spec: (T) => unitD2('D', T), note: 'backhanded the runner (110.46); its next blow taken by the allied drone (113.2); bashed down by the Director (114.12)'},
];
