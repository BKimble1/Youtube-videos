// Section D4 shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
// One battle (crew.tsx: the Crew; machines.ts: the machines; fx.tsx: contacts; battle.tsx: the world) sampled by every
// camera (shots.tsx). Start state for D3: ./start.ts. End state: the E/F tableau (shots/EF/tableau.ts).
import type {R2Shot} from '../../film/registry';
import {SH} from './times';
import {D4_1a, D4_1b, D4_2a, D4_2b, D4_3a, D4_3b, D4_4a, D4_4b, D4_4c, D4_4d, D4_5, D4_6a, D4_6b, D4_7, D4_8, D4_9a, D4_9b, D4_10} from './shots';

export const SHOTS_D4: R2Shot[] = [
  {id: 'D4-1a', sec: 'D4', start: SH.d41, end: SH.d41b, note: 'P4: fighting retreat west across the avenue toward the lens; the arc presses; heavy 2 comes out of the crater', C: D4_1a},
  {id: 'D4-1b', sec: 'D4', start: SH.d41b, end: SH.d42a, note: 'the Director spins to face W1; its hammer on the plate — the crack goes right through; his heels skid', C: D4_1b},
  {id: 'D4-2a', sec: 'D4', start: SH.d42a, end: SH.d42b, note: 'a flanker overtakes the runner and cuts across him; the backhand; he goes down on his back and stays down', C: D4_2a},
  {id: 'D4-2b', sec: 'D4', start: SH.d42b, end: SH.d43, note: 'the tether operator levels the empty launcher; a unit\'s fist closes on it; torn out of her hands, flung down', C: D4_2b},
  {id: 'D4-3a', sec: 'D4', start: SH.d43, end: SH.d43b, note: 'at the van, spent, the units holding beyond: the tablet dropped, the cut cable pulled off the reel, the last flare drawn', C: D4_3a},
  {id: 'D4-3b', sec: 'D4', start: SH.d43b, end: SH.d44a, note: 'the Director looks round at them, turns to the units and raises his arm', C: D4_3b},
  {id: 'D4-4a', sec: 'D4', start: SH.d44a, end: SH.d44b, note: 'ARRIVAL: the surge; the Director\'s plate into W1\'s chest — the chest plate off, over it goes', C: D4_4a},
  {id: 'D4-4b', sec: 'D4', start: SH.d44b, end: SH.d44c, note: 'the empty breaker (trigger: nothing) swung as a club into W2\'s raised arm: the arm comes off', C: D4_4b},
  {id: 'D4-4c', sec: 'D4', start: SH.d44c, end: SH.d44d, note: 'a length of the cut cable whipped round W3\'s shins and hauled; the Director drives into it; it topples', C: D4_4c},
  {id: 'D4-4d', sec: 'D4', start: SH.d44d, end: SH.d45, note: 'the last flare struck and thrown into heavy 2\'s eye: the flash', C: D4_4d},
  {id: 'D4-5', sec: 'D4', start: SH.d45, end: SH.d46a, note: 'LOCAL_WIN: blinded, heavy 2 staggers back off a slab that tips under its foot; the gap; a breath of hope; a drone drops on the drone pilot', C: D4_5},
  {id: 'D4-6a', sec: 'D4', start: SH.d46a, end: SH.d46b, note: 'REALIZE, wide: the ring closing on every side, the columns streaming along the avenue, drones above', C: D4_6a},
  {id: 'D4-6b', sec: 'D4', start: SH.d46b, end: SH.d47, note: 'their faces: the Director, the tether operator behind; heavy 2 comes on', C: D4_6b},
  {id: 'D4-7', sec: 'D4', start: SH.d47, end: SH.d48, note: 'heavy 2 turns its eye on the drone pilot, down by the van; the ram winds up; he sees it and sprints', C: D4_7},
  {id: 'D4-8', sec: 'D4', start: SH.d48, end: SH.d49a, note: 'STRIKE: the ram meets the plate, the plate shatters; he is thrown back against the slab', C: D4_8},
  {id: 'D4-9a', sec: 'D4', start: SH.d49a, end: SH.d49b, note: 'SOFTEN: he slides down the slab beside the van', C: D4_9a},
  {id: 'D4-9b', sec: 'D4', start: SH.d49b, end: SH.d410, note: 'the others straining toward him, caught and held by units; heavy 2 steps back into its place', C: D4_9b},
  {id: 'D4-10', sec: 'D4', start: SH.d410, end: SH.end, note: 'wide: the ring holds round the van; FINAL_HIT — every machine stops as one', C: D4_10},
];
