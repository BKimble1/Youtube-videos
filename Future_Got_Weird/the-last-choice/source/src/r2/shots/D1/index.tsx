// Section D1 shots (film seconds). Sound cues live in ./cues.ts (pure data, no React). One battle (crew.tsx: the Crew;
// machines.ts: the machines; chor.ts: the shared timeline; fx.tsx: contacts) sampled by every camera, so positions,
// damage and the dented plate hold across the cuts. Exchange sheet: production/R3_EXCHANGES.md ## D1.
import type {R2Shot} from '../../film/registry';
import {M} from '../../timing';
import {D1_1, D1_2, D1_2b} from './Charge';
import {D1_3, D1_3b, D1_4a, D1_4b, D1_4c, D1_4d} from './Clash';
import {D1_5, D1_6, D1_7, D1_7b} from './Rescue';
import {D1_8, D1_8b} from './Breach';
import {D1_9a, D1_9b} from './Gain';

export const SHOTS_D1: R2Shot[] = [
  {id: 'D1-1', sec: 'D1', start: M.CHARGE, end: 64.0, note: 'CHARGE: they run down the ridge diagonally past a low camera at its south-east foot', C: D1_1},
  {id: 'D1-2', sec: 'D1', start: 64.0, end: 66.5, note: 'tracking alongside the Director across the avenue; the front line comes over the rim', C: D1_2},
  {id: 'D1-2b', sec: 'D1', start: 66.5, end: M.CLASH, note: 'over his shoulder: U1 picks him, lowers into its last strides and raises its arm — the machines strike first', C: D1_2b},
  {id: 'D1-3', sec: 'D1', start: M.CLASH, end: 70.3, note: 'CLASH: U1\'s running hammer on the plate (heavy block, he skids); its punch parried; his bash sends it back into U3', C: D1_3},
  {id: 'D1-3b', sec: 'D1', start: 70.3, end: 72.0, note: 'the line, ranked: U4\'s hammer taken on the breaker\'s shaft; U2\'s hammer on the runner\'s bar; U5 at the tether operator', C: D1_3b},
  {id: 'D1-4a', sec: 'D1', start: 72.0, end: 73.3, note: 'the breaker ducks U4\'s punch and breaks its knee; on its knee it catches his tool', C: D1_4a},
  {id: 'D1-4b', sec: 'D1', start: 73.3, end: 74.9, note: 'U5 goes for the runner\'s back: the tether pulls its leg out', C: D1_4b},
  {id: 'D1-4c', sec: 'D1', start: 74.9, end: 76.4, note: 'the tug; the allied drone dives into U4\'s face; it lets go; the breaker\'s blow on its neck', C: D1_4c},
  {id: 'D1-4d', sec: 'D1', start: 76.4, end: 77.45, note: 'U6 goes for the soft targets: the flare carrier puts a flare in its eye', C: D1_4d},
  {id: 'D1-5', sec: 'D1', start: 77.45, end: 79.7, note: 'RESCUE threat/defense: U1 jab, BR1 hammer on the plate (dent, skid) — it follows and presses; U2 drives the runner down', C: D1_5},
  {id: 'D1-6', sec: 'D1', start: 79.7, end: 81.9, note: 'RESCUE intervention: the shove, the wind-up; the Director ducks left; BR2 the breaker\'s ram tears its forearm off', C: D1_6},
  {id: 'D1-7', sec: 'D1', start: 81.9, end: 83.9, note: 'RESCUE counter/consequence: it catches the tool; his plate in its knee; BR3 the ram in its chest drives it into U2', C: D1_7},
  {id: 'D1-7b', sec: 'D1', start: 83.9, end: M.BR4, note: 'RESCUE continuation: U3 comes out of the gap; they move to meet it', C: D1_7b},
  {id: 'D1-8', sec: 'D1', start: M.BR4, end: 87.0, note: 'BR4 (side-on from the south): inside U3\'s hammer, the shoulder and plate into its chest, the drive up the rim, the shove', C: D1_8},
  {id: 'D1-8b', sec: 'D1', start: 87.0, end: M.GAIN1, note: 'BR4 after the shove: it staggers onto the crest and goes over backward into the crater; the gap opens', C: D1_8b},
  {id: 'D1-9a', sec: 'D1', start: M.GAIN1, end: 91.5, note: 'GAIN: the survivors pulled back across the bowl; a drone comes; he waves them on; the run for the slab', C: D1_9a},
  {id: 'D1-9b', sec: 'D1', start: 91.5, end: M.P2, note: 'BREATH under pressure: down behind the slab as the drone\'s beam sweeps its top; looks pass; his signal', C: D1_9b},
];
