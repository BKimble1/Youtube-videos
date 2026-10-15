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
  /** the location pulse (the journey's transmission ring, carried onto the map at B.map0) lands in the hospital's
   *  dock ring; the dock beacon's ripple and flash phase start here and run on across the 747/748 match cut */
  pulseLand: B.map0 + 16,
  /** the latch clicks open at B.latch; the rotors start AFTER it and reach full speed at spin1 */
  spin0: B.latch + 4,
  spin1: B.latch + 26,
  /** rotor blur grows with the spin-up (hospital); it stays full in the flyover and the arrival */
  blur0: B.latch + 8,
  blur1: B.latch + 28,
  /** lift clear of the dock: B.lift0 -> lift1 (330 world up) */
  lift1: B.bank0 + 2,
  /** the hospital camera's x locks onto the drone from here (it then trucks with the forward travel) */
  camLock: B.lift0 + 13,
  /** nose-down pitch, then forward travel (the drone is ~290 world clear of the dock when it starts to move) */
  pitch0: B.bank0 - 8,
  pitch1: B.bank0 + 2,
  go0: B.bank0 - 6,
  /** flyover: the drone climbs over the roofs until the trunk wipe starts (WIPE.in0) */
  climb1: B.past0 - 1,
  /** arrival: from the trunk wipe (arrive0) to wipeLock the drone holds the flyover drone's screen position behind the
   *  trunk; it then crosses to HOVER2, braking with a nose-up flare from flare0, settles at hover0 and hovers */
  arrive0: B.past0 - 1,
  wipeLock: B.past0 + 6,
  flare0: B.past0 + 12,
  hover0: B.past0 + 19,
  /** the dashed data link drone -> band: fades in once the drone is clear of his head, out before the case turns */
  link0: B.past0 + 18,
  link1: B.arrive + 5,
  /** the drone climbs out of frame while the camera is still on the chest, before the recovery framing returns */
  retreat0: B.release0 - 6,
  retreat1: B.release0 + 15,

  // ---- reveal states and heartbeat (lib/reveal4.ts, lib/heart4.ts) -- owned by the anatomy area

  // ---- treatment sub-beats (Aftermath3 treatment) -- owned by the device/treatment area
};

export {B, TOTAL};
