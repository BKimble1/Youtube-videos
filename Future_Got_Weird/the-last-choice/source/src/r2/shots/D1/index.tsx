// Section D1 shots (film seconds). See production/R2_SHOT_LIST.md. Sound cues live in ./cues.ts (pure data, no React).
// One battle (crew.tsx: the Crew; machines.ts: the machines; fx.tsx: contacts) sampled by every camera, so positions,
// damage and the dented plate hold across the cuts.
import type {R2Shot} from '../../film/registry';
import {M} from '../../timing';
import {D1_1, D1_2} from './Charge';
import {D1_3, D1_4a, D1_4b, D1_4c, D1_4d} from './Clash';
import {D1_5, D1_6, D1_7, D1_8} from './Breach';
import {D1_9} from './Gain';

export const SHOTS_D1: R2Shot[] = [
  {id: 'D1-1', sec: 'D1', start: M.CHARGE, end: 64.0, note: 'CHARGE: they run down the ridge diagonally past a low camera at its south-east foot', C: D1_1},
  {id: 'D1-2', sec: 'D1', start: 64.0, end: M.CLASH, note: 'tracking alongside the Director across the avenue; the front line comes over the rim; the lines converge', C: D1_2},
  {id: 'D1-3', sec: 'D1', start: M.CLASH, end: 72.0, note: 'CLASH, wide from the south: his plate slams into the first unit, which staggers into the next; everyone engages', C: D1_3},
  {id: 'D1-4a', sec: 'D1', start: 72.0, end: 74.0, note: 'the breaker breaks a knee joint; sparks; the unit drops to a knee', C: D1_4a},
  {id: 'D1-4b', sec: 'D1', start: 74.0, end: 75.8, note: 'the tether yanks one off balance', C: D1_4b},
  {id: 'D1-4c', sec: 'D1', start: 75.8, end: 77.2, note: 'the runner pries a back plate and rips the cables', C: D1_4c},
  {id: 'D1-4d', sec: 'D1', start: 77.2, end: M.BR1, note: 'the allied drone harries an enemy drone; a flare blinds an eye', C: D1_4d},
  {id: 'D1-5', sec: 'D1', start: M.BR1, end: M.BR2, note: 'BR1: a unit winds up and swings; the plate blocks and dents; he skids back on his heels', C: D1_5},
  {id: 'D1-6', sec: 'D1', start: M.BR2, end: M.BR3, note: 'BR2: the breaker smashes its chest plate; armour flies; the unit reels', C: D1_6},
  {id: 'D1-7', sec: 'D1', start: M.BR3, end: M.BR4, note: 'BR3: the tether swings the toppling unit into the next; they crash together', C: D1_7},
  {id: 'D1-8', sec: 'D1', start: M.BR4, end: M.GAIN1, note: 'BR4: behind the Director: his shoulder charge drives the last unit back into the crater; the gap', C: D1_8},
  {id: 'D1-9', sec: 'D1', start: M.GAIN1, end: M.P2, note: 'GAIN/BREATH: they push through to a fractured slab on the rim; looks pass; he pants, the plate dented', C: D1_9},
];
