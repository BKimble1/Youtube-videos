// Section D4 shots (film seconds). See production/R3_EXCHANGES.md (## D4) for the exchanges. Sound cues live in
// ./cues.ts (pure data, no React). One battle (crew.tsx: the Crew; machines.ts: the machines; fx.tsx: contacts;
// battle.tsx: the world) sampled by every camera (shots.tsx). Start state: ./start.ts. End state: the E/F tableau
// (shots/EF/tableau.ts).
import type {R2Shot} from '../../film/registry';
import {SH} from './times';
import {D4_1a, D4_1b, D4_2a, D4_2b, D4_3a, D4_3b, D4_4a, D4_4b, D4_4c, D4_4d, D4_5, D4_5b, D4_6a, D4_6b, D4_7a, D4_7b, D4_7c, D4_8, D4_9a, D4_9b, D4_9c, D4_10} from './shots';

export const SHOTS_D4: R2Shot[] = [
  {id: 'D4-1a', sec: 'D4', start: SH.d41, end: SH.d41b, note: 'P4, elevated track: the defensible area among D1\'s wrecks; the arc advances in guard; heavy 2 out of the crater; they give ground', C: D4_1a},
  {id: 'D4-1b', sec: 'D4', start: SH.d41b, end: SH.d42a, note: 'THE PLATE answered: W1\'s hammer cracks it through; it presses after him; its hook — he ducks under it and runs', C: D4_1b},
  {id: 'D4-2a', sec: 'D4', start: SH.d42a, end: SH.d42b, note: 'THE RUNNER\'s route cut: the flanker overtakes him, cuts across, the backhand; he goes down on his back and stays down', C: D4_2a},
  {id: 'D4-2b', sec: 'D4', start: SH.d42b, end: SH.d43, note: 'THE TETHER answered: the empty launcher levelled (a bluff); a unit\'s fist closes on it; torn out of her hands, flung down', C: D4_2b},
  {id: 'D4-3a', sec: 'D4', start: SH.d43, end: SH.d43b, note: 'at the van, spent, the ridge\'s north end shut by units: the tablet dropped, the cut cable pulled off the reel, the last flare drawn', C: D4_3a},
  {id: 'D4-3b', sec: 'D4', start: SH.d43b, end: SH.d44a, note: 'the Director looks round at them, turns to the units and raises his arm', C: D4_3b},
  {id: 'D4-4a', sec: 'D4', start: SH.d44a, end: SH.d44b, note: 'ARRIVAL: W1 swings first; he ducks under it and drives the plate into its open chest — the chest plate off, over it goes', C: D4_4a},
  {id: 'D4-4b', sec: 'D4', start: SH.d44b, end: SH.d44c, note: 'W2 winds up at the decoy maker; the breaker steps between them, the empty breaker (trigger: nothing) swung into its raised arm: the arm comes off', C: D4_4b},
  {id: 'D4-4c', sec: 'D4', start: SH.d44c, end: SH.d44d, note: 'W3 steps at the tether operator; the cut cable whipped round its shins and hauled; the Director drives into it; it topples', C: D4_4c},
  {id: 'D4-4d', sec: 'D4', start: SH.d44d, end: SH.d45, note: 'heavy 2 halts and levels its launcher at them: the last flare into its eye first — the flash', C: D4_4d},
  {id: 'D4-5', sec: 'D4', start: SH.d45, end: SH.d45b, note: 'LOCAL_WIN, a breath: blinded, heavy 2 steps back off a slab that tips; a look between them; the units step over the wrecks and come on; the eye clears', C: D4_5},
  {id: 'D4-5b', sec: 'D4', start: SH.d45b, end: SH.d46a, note: 'THE DRONE answered: a drone drops out of the sky on the drone pilot; she goes down, the dead controller falls', C: D4_5b},
  {id: 'D4-6a', sec: 'D4', start: SH.d46a, end: SH.d46b, note: 'REALIZE, overhead: the ring closing on every side, units on the crest behind them, heavy 2 coming on', C: D4_6a},
  {id: 'D4-6b', sec: 'D4', start: SH.d46b, end: SH.d47, note: 'their faces: the Director looks round — every way shut; the tether operator behind; heavy 2 comes on', C: D4_6b},
  {id: 'D4-7a', sec: 'D4', start: SH.d47, end: SH.d47b, note: 'low by the van, over her shoulder: heavy 2 closes in front of the van, its eye locked on her', C: D4_7a},
  {id: 'D4-7b', sec: 'D4', start: SH.d47b, end: SH.d47c, note: 'close on the Director: he SEES (his head snaps round to her), he CHOOSES (the jaw sets), he launches', C: D4_7b},
  {id: 'D4-7c', sec: 'D4', start: SH.d47c, end: SH.d48, note: 'the ram rears up over her; he sprints in across the frame and plants between them, plate up', C: D4_7c},
  {id: 'D4-8', sec: 'D4', start: SH.d48, end: SH.d49a, note: 'STRIKE side-on: the ram comes down onto the plate (177.76), the plate bursts, he is thrown back into the slab; his legs go', C: D4_8},
  {id: 'D4-9a', sec: 'D4', start: SH.d49a, end: SH.d49b, note: 'SOFTEN: from in front of him, he slides down the slab; the drone pilot beside him', C: D4_9a},
  {id: 'D4-9b', sec: 'D4', start: SH.d49b, end: SH.d49c, note: 'going to him, they are caught: the decoy maker\'s wrist, the breaker\'s leg gives (he sits by his dropped breaker), the flare carrier\'s arm locked', C: D4_9b},
  {id: 'D4-9c', sec: 'D4', start: SH.d49c, end: SH.d410, note: 'he cannot rise: one push on his left hand, the arm gives, he sinks back; the drone pilot\'s hand stretched out toward him', C: D4_9c},
  {id: 'D4-10', sec: 'D4', start: SH.d410, end: SH.end, note: 'his view, the ring holds: she goes to him; the decoy maker\'s hands go up, the last heave, the tether operator gives up; the ring lowers into ready; FINAL_HIT', C: D4_10},
];
