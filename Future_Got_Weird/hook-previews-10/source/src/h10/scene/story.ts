// HOOK 10: the activity timeline (what lights, when) and the cutaway window's travel, all from cues.ts.
import {keyCR, ss} from '../../shared/lib';
import {CUE, GAIT} from './cues';
import {Act} from './Xray';

const bump = (t: number, a: number, b: number, c: number, d: number) => ss(t, a, b) * (1 - ss(t, c, d));

/** the near leg's next swing after the stimulation starts */
export const SWING2 = GAIT.near0 + 2 * GAIT.T;

export const actAt = (t: number): Act & {rx: number; dec: number; tx: number} => ({
  t,
  cortex: bump(t, CUE.cortex0, CUE.cortex0 + 0.2, 3.5, 3.8),
  rec: bump(t, CUE.record, CUE.record + 0.1, 3.4, 3.7),
  lesionGlow: bump(t, CUE.cordStop - 0.04, CUE.cordStop + 0.06, CUE.cordStop + 0.25, CUE.cordStop + 0.6),
  rx: bump(t, CUE.hop1 + 0.06, CUE.hop1 + 0.14, CUE.cable0 + 0.2, CUE.cable0 + 0.45),
  dec: bump(t, CUE.decode0 - 0.04, CUE.decode0 + 0.06, CUE.decode1 + 0.05, CUE.decode1 + 0.3),
  tx: bump(t, CUE.belt1 - 0.06, CUE.belt1 + 0.02, CUE.hop2 + 0.15, CUE.hop2 + 0.4),
  pad: ss(t, CUE.stim - 0.02, CUE.stim + 0.06) * (0.8 + 0.2 * Math.sin(t * 18)),
  // muscle activity in the near leg through the step: push-off (calf), hip and knee (quadriceps), foot lift (tibialis
  // anterior), then the hamstrings slowing the leg before the heel lands
  calf: bump(t, CUE.muscle - 0.08, CUE.muscle + 0.04, SWING2 + 0.25, SWING2 + 0.45),
  quad: bump(t, CUE.muscle - 0.02, CUE.muscle + 0.1, SWING2 + 0.6, SWING2 + 0.85),
  ta: bump(t, SWING2 + 0.05, SWING2 + 0.18, SWING2 + 0.7, SWING2 + 0.9),
  ham: bump(t, SWING2 + 0.5, SWING2 + 0.65, SWING2 + 1.05, SWING2 + 1.3),
});

/** the cutaway window: anchor-index span [top, bot] along brain -> neck -> back -> lower back -> hip -> knee -> ankle,
 *  and its radius (units) */
export const windowAt = (t: number) => {
  const r = keyCR(t, [[CUE.xrayOpen0 - 0.02, 0], [CUE.xrayOpen1, 88], [2.7, 90], [3.1, 100], [3.6, 116], [4.4, 112], [6.0, 106]]);
  const bot = keyCR(t, [[2.45, 0], [3.05, 1.05], [3.4, 1.8], [3.75, 2.55], [4.1, 3.2], [4.6, 4.3], [5.2, 5.2], [6.0, 5.6]]);
  const top = keyCR(t, [[2.95, 0], [3.4, 0.6], [3.8, 1.4], [4.3, 2.35], [4.9, 2.85], [6.0, 3.05]]);
  return {r: Math.max(0, r), top: Math.max(0, top), bot: Math.max(top, bot), on: ss(t, CUE.xrayOpen0, CUE.xrayOpen1)};
};
