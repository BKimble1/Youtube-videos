// V5 timeline (the V4 cut list through the socket match; a new closing payoff). Same narration master as V3 (the approved take, dead air capped at 0.30 s; data/timeline_v3.json),
// 725 frames at 30 fps. Every value is a pure function of t. Word times are T4 (= T3).
//
//   kick    0      the decisive frame (low side angle): planted cleat, prosthetic cleat one frame from the ball, the
//                  backward foot in the socket above it. Contact on frame 2 (index 1), follow-through, the ball exits
//                  fast toward the lens, spinning; the ball wipes (right edge sweeping right-to-left) into
//   reveal  WIPE   a close side view of the same leg, the backward foot at the same screen position and angle. On
//                  "ankle" the toes point behind him; on "working knee" the turned ankle flexes and the prosthetic shin
//                  swings with it (contact, reveal, proof: three beats inside the opening sentence)
//   xray    bone   the X-ray, already close on the affected area; the diseased section shows; cut margins on "Surgeons"
//   anat    remove the clean side-profile surgical illustration; the middle separates; on "save his foot" attention
//                  moves down to the foot with the whole lower segment still in view
//   turn    They   one continuous shot with the thigh as a fixed reference: toes forward -> the whole lower segment
//                  rotates -> toes backward -> where it reconnects -> it rises and joins the thigh
//   rehabA  with   tight side profile at the socket: which way his toes point inside it; the bend begins
//   rehabB  bent   (cut on the bend) low two-leg view: both sides bend together, "the same way as his other knee"
//   rehabC  rise   (cut on the rise) wider: he shifts his weight and takes one clear step at the bars
//   wake    woke   (cut on the footfall) recovery: Wyatt wakes
//   toes    wiggle straight to the toes: one unmistakable wiggle against the sheet
//   notice  toes   Wyatt notices it (short)
//   sock    And    match: the foot's position becomes the fitted socket, back on the field
//   stance   use    V5: a brief balanced stance behind the ball (wide)
//   ankleE   that   close on the prosthesis: he steps, the turned ankle bends inside the socket (the wind-up)
//   contactE kick   low on the shoe and the ball: contact
//   flight          the ball comes at the lens, fills the frame at the last frame -> frame 0
import {T3, DUR3, FRAMES3, CAPS3, Cap3} from '../v3/story3';

export const T4 = T3;
export const DUR4 = DUR3;
export const FRAMES4 = FRAMES3;
export const CAPS4: Cap3[] = CAPS3;
export const FPS4 = 30;

export type Shot5 = 'kick' | 'reveal' | 'xray' | 'anat' | 'turn' | 'rehabA' | 'rehabB' | 'rehabC' | 'wake' | 'toes' | 'notice' | 'toes2' | 'sock' | 'stance' | 'ankleE' | 'contactE' | 'flight';

// ---------------------------------------------------------------------------------------------------- the cut list
/** the kick: contact on frame index 1 (the second frame) */
export const CONTACT = 1 / 30;
/** the ball covers the whole frame at WIPE_T; its trailing edge then sweeps off and reveals the close leg view */
export const WIPE_T = 0.4;
export const CUT_XRAY = T4.bone - 0.05; // 3.62
export const CUT_ANAT = T4.remove - 0.07; // 5.35 (a quick matched dissolve from the X-ray)
export const CUT_TURN = T4.they - 0.05; // 7.88
export const CUT_REHAB_A = T4.with - 0.03; // 11.40

// rehab: one movement across three views
export const BEND0 = 14.32; // the bend starts in shot A ("ankle now")
export const CUT_REHAB_B = T4.bent; // 14.62, cut on the bend
export const BEND_LOW = 15.3; // the bottom of the bend ("same way")
export const RISE0 = 15.94; // he starts to rise (end of "his other")
export const CUT_REHAB_C = 16.16; // cut on the rise, on "knee" (the whole phrase plays over the two-leg view)
export const STEP0 = 16.45; // weight is on the left leg; the prosthetic foot leaves the floor
export const FOOTFALL = 16.98; // the prosthetic cleat lands
export const CUT_WAKE = T4.woke - 0.03; // 17.03, cut on the footfall

// recovery
export const CUT_TOES = T4.wiggle - 0.05; // 18.20
export const WIGGLE0 = T4.wiggle + 0.02, WIGGLE1 = T4.wiggle + 0.5; // 18.27 - 18.75
export const CUT_NOTICE = T4.toes2 - 0.02; // 18.84
export const CUT_SOCK = T4.and2 - 0.04; // 19.50
export const CUT_TOES2 = CUT_SOCK - 5 / 30; // back on the foot for 5 frames, so the match cut to the socket has its foot on screen
export const CUT_FIELD = T4.use - 0.03; // 20.20

// the closing payoff (V5): a brief balanced stance -> close on the turned ankle bending inside the prosthesis as he
// winds up -> the shoe meets the ball -> the ball comes at the lens and fills it, which cuts back into frame 0
export const TC_END = 679 / 30; // 22.633: the closing contact, on "kick" (a whole frame)
export const CUT_ANKLE_E = 21.35; // on "that": he steps toward the ball (the cut follows the step)
export const CUT_CONTACT_E = TC_END - 4 / 30; // the forward swing, 4 frames before contact
export const CUT_FLIGHT = TC_END + 6 / 30; // the ball has left the shoe
export const CUTS5: [number, Shot5][] = [
  [0, 'kick'], [WIPE_T, 'reveal'], [CUT_XRAY, 'xray'], [CUT_ANAT, 'anat'], [CUT_TURN, 'turn'],
  [CUT_REHAB_A, 'rehabA'], [CUT_REHAB_B, 'rehabB'], [CUT_REHAB_C, 'rehabC'],
  [CUT_WAKE, 'wake'], [CUT_TOES, 'toes'], [CUT_NOTICE, 'notice'], [CUT_TOES2, 'toes2'], [CUT_SOCK, 'sock'],
  [CUT_FIELD, 'stance'], [CUT_ANKLE_E, 'ankleE'], [CUT_CONTACT_E, 'contactE'], [CUT_FLIGHT, 'flight'],
];
/** the shot at t; frame-exact (t = f / 30 compared with a small tolerance, so a cut time that is a whole frame lands on that frame) */
export const shot5At = (t: number): Shot5 => { let s: Shot5 = 'kick'; for (const [t0, n] of CUTS5) if (t + 1e-6 >= t0) s = n; return s; };
export const start5 = (n: Shot5) => CUTS5.find((c) => c[1] === n)![0];
export const end5 = (n: Shot5) => { const i = CUTS5.findIndex((c) => c[1] === n); return i + 1 < CUTS5.length ? CUTS5[i + 1][0] : DUR4; };
