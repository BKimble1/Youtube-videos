// V4 sub-beats, added inside the locked V3 timeline. lib/timeline3.ts (B) is NOT changed: the captions, the
// countdown (lib/device3.ts) and the reused V3 music stem (lib/sound3.ts musicPlan) all read it. Every new V4
// action key lives here, so the picture and the V4 sound cues (lib/sound4.ts) read the same frames.
// Sections are owned by one implementation area each; edit only your own section.
import {B, TOTAL} from './timeline3';

export const B4 = {
  // ---- loop alarm (one periodic pulse in loop time; see lib/device3.ts alarmAt)
  /** frames per alarm pulse */
  alarmPeriod: 12,
  /** emission phase: emissions at loop times alarmPhase0 + k*alarmPeriod, i.e. frames ..., 1344, 6, 18 */
  alarmPhase0: 6,
  /** the periodic ring/alarm runs from the red callback through the first seconds of the next play */
  alarmOn0: B.callback,
  alarmOff1: 30,

  // ---- dispatch (shots/Dispatch.tsx, Aftermath3 arrival) -- owned by the dispatch area

  // ---- reveal states and heartbeat (lib/reveal4.ts, lib/heart4.ts) -- owned by the anatomy area

  // ---- treatment sub-beats (Aftermath3 treatment) -- owned by the device/treatment area
};

export {B, TOTAL};
