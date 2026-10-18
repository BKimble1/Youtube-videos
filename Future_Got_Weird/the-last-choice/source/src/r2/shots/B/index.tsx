// Section B shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
//   beats.ts     every key time and cut (shared with the cues and the army)
//   director.ts  the Director's whole performance as a function of film time (shared by every shot; C reads it too)
//   army.ts      THE ARMY (pure; sections C and D import it): lockstep march, eye ripple, halts on H4/H5a/H5b; the
//                sentry drone's sortie (B6)
//   rubble.ts    the slab and the chunks he displaces (pure; persisted for later shots)
//   kit.tsx      sprites/items: the Director, the rebar stub, dust motes, smoke, the army's items
import type {R2Shot} from '../../film/registry';
import {ShotB1, ShotB2, B1_START, B1_END, B2_END} from './Rise';
import {ShotB3, ShotB4, B3_END, B4_END} from './Reveal';
import {ShotB5a, ShotB5b, ShotB6a, ShotB6b, B5A_END, B5B_END, B6A_END, B6B_END} from './Lonely';

export const SHOTS_B: R2Shot[] = [
  {id: 'B1_hand', sec: 'B', start: B1_START, end: B1_END, note: 'ground level on the crest: his bloodied right hand comes out from under the slab, slaps down, presses, claws and slips back', C: ShotB1},
  {id: 'B2_rise', sec: 'B', start: B1_END, end: B2_END, note: 'side-on from the south along the crest: two drags on planted palms, chest up (the slab slides off), the hips back over a knee, kneel, the bar, weight forward, the foot under him, the drive up, a half step', C: ShotB2},
  {id: 'B3_reveal', sec: 'B', start: B2_END, end: B3_END, note: 'behind his right shoulder, rising over it to a high wide: the crater and the army; H1/H2 lockstep, eyes ripple on; he steps down toward them', C: ShotB3},
  {id: 'B4_heavy', sec: 'B', start: B3_END, end: B4_END, note: 'his eyes, a very long lens: a heavy among the marching ranks, coming on; on H3 its head swings round and looks into the lens', C: ShotB4},
  {id: 'B5a_seen', sec: 'B', start: B4_END, end: B5A_END, note: 'his face, close: the look met — the breath catches, brows up, then down; the jaw sets', C: ShotB5a},
  {id: 'B5b_strap', sec: 'B', start: B5A_END, end: B5B_END, note: 'from the avenue past the van and the radio, in to a medium close: he pulls the plate strap tight with his teeth; the guard comes up', C: ShotB5b},
  {id: 'B6a_halt', sec: 'B', start: B5B_END, end: B6A_END, note: 'the lonely wide from a crane riding the main body: the vanguard plants on the count, the crane stops with the main body (H5a), the rear (H5b); a drone darts off across the crater at him', C: ShotB6a},
  {id: 'B6b_mark', sec: 'B', start: B6A_END, end: B6B_END, note: 'over his left shoulder: the drone brakes off his face, the plate comes up, the amber mark; its gimbal flicks past him to the ruin behind; it backs away', C: ShotB6b},
];
