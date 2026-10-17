// Section B shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
//   director.ts  the Director's whole performance as a function of film time (shared by every shot)
//   army.ts      THE ARMY (pure; sections C and D1 import it): lockstep march, eye ripple, halts on H4/H5a/H5b
//   rubble.ts    the slab and the chunks he displaces (pure; persisted for later shots)
//   kit.tsx      sprites/items: the Director, the rebar stub, dust motes, smoke columns, the army's items
import type {R2Shot} from '../../film/registry';
import {ShotB1, ShotB2, B1_START, B1_END, B2_END} from './Rise';
import {ShotB3, ShotB4, B3_END, B4_END} from './Reveal';
import {ShotB5, ShotB6, B5_END, B6_END} from './Lonely';

export const SHOTS_B: R2Shot[] = [
  {id: 'B1_hand', sec: 'B', start: B1_START, end: B1_END, note: 'ground level on the crest: his bloodied right hand comes out from under the slab and braces; chips skitter', C: ShotB1},
  {id: 'B2_rise', sec: 'B', start: B1_END, end: B2_END, note: 'low south-east: he drags himself out, chest up, a knee under him, the rebar, weight onto the foot, standing', C: ShotB2},
  {id: 'B3_reveal', sec: 'B', start: B2_END, end: B3_END, note: 'behind his left shoulder, rising over it to a high wide: the crater and the army; H1/H2 lockstep, eyes ripple on', C: ShotB3},
  {id: 'B4_heavy', sec: 'B', start: B3_END, end: B4_END, note: 'long lens from inside the army: a heavy turns its head to him, a tiny silhouette on the crest', C: ShotB4},
  {id: 'B5_strap', sec: 'B', start: B4_END, end: B5_END, note: 'from the avenue past the van and the radio, in to a medium close: he pulls the plate strap tight with his teeth', C: ShotB5},
  {id: 'B6_lonely', sec: 'B', start: B5_END, end: B6_END, note: 'the lonely wide from the west slope: small on the crest; the army halts as one on H4, H5a, H5b', C: ShotB6},
];
