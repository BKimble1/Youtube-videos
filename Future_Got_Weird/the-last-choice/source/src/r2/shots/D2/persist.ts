// Section D2: machines that outlive their shots — the wrecks the Crew's gains leave on the slope, so later shots show
// them where they fell (and heavy 1's arrival in D3 can undo the advantage they give). Pure data/specs only (no
// React). See src/r2/film/continuity.tsx.
//
// The four units D2 puts down, evaluated with the SAME specs the D2 shots animate (machines.ts). Rest at P3 (R3):
//   d2_A  under the girder's south face between posts 3 and 4, root ≈ (49.41, −8.40), chest ≈ (50.0, −9.2): back plate
//         burst at the crash, dented, leaking — with C it is the WRECK BARRICADE the Crew regroup behind
//   d2_C  beside it under the bottom chord, root ≈ (48.91, −9.06), chest ≈ (49.4, −9.8): chest plate torn on the chord
//   d2_B  on its face on the slope below the units' strike line, root ≈ (52.13, −3.44), head ≈ (52.1, −3.0): right
//         knee hooked out (runner), back plate pried off and cables ripped out
//   d2_D  at the crest's foot in front of the regroup, root ≈ (50.22, −5.75), chest ≈ (49.8, −5.5): the Director's
//         counter into its side and the runner's adze behind its ankle; dented, leaking
// (D2 also leaves: the two spent smoke canisters (fx canisters(), drawn on by D3), the tether's cable wrapped on post 3
// with its clamp on A's chest, the tablet back in the decoy maker's hands, the breaker's tool back in his.)
import type {Persist} from '../../film/continuity';
import {EV2, unitD2} from './machines';

export const PERSIST_D2: Persist[] = [
  {key: 'd2_B', sec: 'D2', from: EV2.knee, kind: 'unit', spec: (T) => unitD2('B', T), note: 'FLANK: right knee hooked out (102.25), back plate pried off (103.98) and cables ripped (104.36); down on its face (104.62)'},
  {key: 'd2_A', sec: 'D2', from: EV2.crash, kind: 'unit', spec: (T) => unitD2('A', T), note: 'blocked the bash (102.92), clamped (106.22), dragged by the reel into C and slammed into the girder (108.74); finished by the plate on its head (111.05)'},
  {key: 'd2_C', sec: 'D2', from: EV2.crash, kind: 'unit', spec: (T) => unitD2('C', T), note: 'swept by the dragged A (108.5) and driven into the girder\'s chord (108.74); down beside it: the wreck barricade'},
  {key: 'd2_D', sec: 'D2', from: EV2.counter, kind: 'unit', spec: (T) => unitD2('D', T), note: 'hooked the runner through his parry (110.46); its hammer taken by the allied drone (113.2); plate into its side (114.12), ankle hooked (114.42)'},
];
