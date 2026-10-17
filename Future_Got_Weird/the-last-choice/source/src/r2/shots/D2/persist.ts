// Section D2: machines (and props) that outlive their shots — wrecks, fallen units, pinned heavies — so later shots
// show them where they fell. Pure data/specs only (no React). See src/r2/film/continuity.tsx.
//
// The four units D2 puts down, evaluated with the SAME specs the D2 shots animate (machines.ts):
//   d2_B  on its front down the north-west slope at ≈ (52.8, −7.2) → head (53.6, −5.6): left knee broken (breaker),
//         back plate pried off and cables ripped out (runner)
//   d2_A  at the girder's foot by post 3 (≈ 49, −10.2), fallen back off C: right pauldron torn (the Director's bash),
//         back plate burst at the crash
//   d2_C  slumped at the girder's foot under the bottom chord (≈ 48.4, −10.5): chest plate torn off on the chord
//   d2_D  on the rim crest at ≈ (50.5, −5.8) → head (51.4, −7.4): the Director's counter; chest plate off, dented
import type {Persist} from '../../film/continuity';
import {EV2, unitD2} from './machines';

export const PERSIST_D2: Persist[] = [
  {key: 'd2_B', sec: 'D2', from: EV2.knee, kind: 'unit', spec: (T) => unitD2('B', T), note: 'FLANK: knee broken (103.1), back plate pried (104.5) and cables ripped (104.92); toppled forward down the NW slope'},
  {key: 'd2_A', sec: 'D2', from: EV2.crash, kind: 'unit', spec: (T) => unitD2('A', T), note: 'bashed (103.62), clamped (106.3) and dragged by the reel into C; slammed into the girder at post 3 (108.05)'},
  {key: 'd2_C', sec: 'D2', from: EV2.crash, kind: 'unit', spec: (T) => unitD2('C', T), note: 'hit by the dragged A (107.55) and driven into the girder at post 3 (108.05); slumped under the chord'},
  {key: 'd2_D', sec: 'D2', from: EV2.counter, kind: 'unit', spec: (T) => unitD2('D', T), note: 'backhanded the runner (110.46); its next blow taken by the allied drone (113.2); bashed down by the Director (114.12)'},
];
