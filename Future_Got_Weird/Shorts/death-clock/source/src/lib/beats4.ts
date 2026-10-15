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
  // Journey: arm section -> closed exterior with a trace -> chest window -> closed chest -> wrist.
  /** the arm section closes (shrinks back to the port) while the camera pulls out of the vessel */
  armClose0: 442,
  armClose1: 454,
  /** the case turns back from its profile (section) roll to face the camera, after the cut has closed */
  caseRoll0: 452,
  caseRoll1: 468,
  /** the exterior diagnostic trace on the bare arm skin: fades in as the section closes, out after the landing */
  traceIn0: 446,
  traceIn1: 456,
  traceOut0: B.red,
  traceOut1: B.red + 12,
  /** amber diagnostic dashes leave the band and run up the trace toward the chest (launch frames) */
  sigLaunch: [450, 458, 466, 474, 482, 490] as number[],
  /** frames a dash takes from the band to the sleeve hem, under the sleeve, and along the chest segment */
  sigArmT: 16,
  sigHiddenT: 6,
  sigChestT: 5,
  /** the chest window: grows out from under the near arm, slides back under it (nothing left behind) */
  chestOpen0: B.organ0,
  chestOpen1: B.organ0 + 14,
  chestClose0: 570,
  chestClose1: 584,
  /** the failing organ (liver) dims; sensors appear on it, then on the heart */
  organDim0: B.fail - 4,
  organDim1: B.fail + 10,
  organSense0: B.organ0 + 8,
  heartSense0: B.heart0 - 6,
  /** the red warning: leaves the heart, runs under the sleeve, emerges at the hem and lands in the band */
  warn0: B.sig0,
  warnArmEdge: B.sig0 + 5,
  warnHem: B.sig0 + 13,
  warn1: B.sig1 - 4,
  /** his free (right) hand grips low (his raised near knee, clear of the window) while the chest is shown */
  rLow0: B.pull0,
  rLow1: B.organ0,
  rHigh0: B.count0,
  rHigh1: B.count0 + 12,
  // Treatment: a hard cut from the vessel into the same chest view, already open; the pulse runs down the
  // superior vena cava into the right atrium, the rhythm settles (lib/heart4.ts), the window closes.
  chestCut: B.settleHeart0,
  treatSvc1: B.settleHeart0 + 8,
  treatLight1: B.settleHeart0 + 18, // the cyan light where the pulse enters the atrium is gone by here
  /** the window closes right after the full lub (its squeeze 1026-1030 is seen open), before the camera pulls */
  treatClose0: B.settleHeart1 - 1,
  treatClose1: B.settleHeart1 + 9,
  /** the pull from the chest view out to the recovery framing (it joins the recovery keys at treatPull1) */
  treatPull0: B.settleHeart1 + 4,
  treatPull1: B.release0 + 9,
  treatHigh0: B.settleHeart1 + 8,
  treatHigh1: B.release0 + 13,

  // ---- treatment sub-beats (Aftermath3 treatment) -- owned by the device/treatment area
  // Mapped to the locked words: 'the band' 923-933, 'delivers' 934-944, 'an' 945-950, 'automatic' 952-964,
  // 'injection,' 966-981, 'potentially' from 987. The countdown keeps its origin and holds at B.hold (983).
  /** approach: the camera follows the wrist to the band's front (00:00:42, HELP ALERT SENT) */
  tApproach0: B.act0 - 6, // 921
  /** the street gives way to the section backdrop (a vignette closing in from the frame edges toward the band), then
   *  the hand recedes into it (Scene's hand veil: one straight soft edge from beyond the fingertips back over the wrist)
   *  while the case starts to turn (its edge reaches the fingers in frame as the roll starts moving, 930): the palm is
   *  gone as the roll passes 30 deg (934-935), the thumb's root and the wrist by 936 */
  tBack0: B.act0 - 4, // 923
  tBack1: B.act0 + 1, // 928
  tVeil0: B.act0 + 1, // 928 (the edge is still beyond the fingers in frame)
  tVeil1: B.act0 + 12, // 939 (eased out: the hand in frame is gone by 936)
  /** the case rolls to its underside; the roll reads as a camera orbit round the forearm (the hand is already gone) */
  tRoll0: B.act0 + 4, // 931 (under 1 deg at 932)
  tRoll1: B.act0 + 12, // 939: profile overview (z <= 12.5, the whole case, still closed), the port on its contact point
  /** punch-in on the port end: the contact detail, the rest of the case running off frame; the case's cut-away is open
   *  from this frame (it never fades in on the overview) */
  tCut: B.act0 + 14, // 941
  /** actuation: the shutter slides open, the piston advances, the nose meets the skin (dimple, attached shadow) */
  tShut0: B.act0 + 14, // 941
  tShut1: B.act0 + 18, // 945
  tStroke0: B.act0 + 18, // 945 (actuator)
  tContact: B.act0 + 22, // 949 (soft contact / press)
  tStroke1: B.act0 + 24, // 951 full stroke
  /** entry: the compact section opens at the same point (a shallow slit of skin bands at the dimple just before the
   *  contact, so the press is seen in the skin bands, then it deepens to the vessel); one blue-white slug runs
   *  reservoir -> nose -> channel -> through the wall -> into the lumen */
  tWin0: B.inject0 - 6, // 946 (a shallow slit of skin bands at the dimple, deepening over 950-953)
  tWin1: B.inject0 + 6, // 958
  tSlug0: B.inject0 + 4, // 956 leaves the reservoir (treatment pulse cue)
  tSlugTip: B.inject0 + 10, // 962 at the nose tip / skin (the feed now enters the rod under the actuator)
  tSlugLumen: B.inject0 + 16, // 968 merges with the flow
  tMerge1: B.inject0 + 19, // 971
  /** internal response: the camera tracks the slug with the flow from tTrack0 (it starts from rest; the slug rises on
   *  screen and slows into TREAT_MATCH, never sinking as the camera pulls back); the zoom has been easing out since
   *  tStroke1 + 2. The piston retracts and the shutter closes in view */
  tTrack0: B.inject0 + 13, // 965
  tRetract0: B.inject0 + 21, // 973
  tRetract1: B.inject1, // 981
  tShutClose0: B.inject1, // 981
  tShutClose1: B.inject1 + 4, // 985
  /** the slug has decelerated to its match point (TREAT_MATCH); the anatomy area's chest view cuts in here */
  treatMatch: B.settleHeart0, // 987
};

/**
 * The 987 match cut (device -> anatomy): where the treatment slug rests on screen on the last device frame (986), so the
 * chest view can open with the pulse at the same place, size, axis and colour. Screen px of the 1080x1920 master. The
 * camera tracks the slug, so on screen it has come to rest there (it moved 0.3 px from 985 to 986); `dir` and `speed` are
 * its motion through the arm at 986 in screen terms (deg, atan2 convention: -90 = straight up; px/frame at the 986
 * zoom); `r` is the core's half-width, `rimR` the rim's, and `len` the slug's overall length (round ends included), all
 * in px. V4 picture fix round: the slug bunches as it brakes (133 -> 83 px) and the tracking rolls onto the vena
 * cava's screen axis (dir -91.8 -> -132.5, the axis of the SVC pulse at 987), and the point moved left from
 * (540, 640) so that the chest view can hold one framing from the cut (Aftermath3 MATCH) with the window in frame.
 */
export const TREAT_MATCH = {f: B.settleHeart0, x: 460, y: 640, r: 10.6, rimR: 17.6, len: 83, dir: -132.5, speed: 7.2, core: '#EAF4FF', rim: '#4F86FF'};

export {B, TOTAL};
