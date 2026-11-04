// V5 kick. Two strikes share one strike core (the swing through contact, the follow-through, the landing):
//   OPENING  sigma = t - CONTACT. Frame 0 is one frame before contact; contact on frame 2; the follow-through; the
//            reveal and the proof (the 1-3 s section ~12% quicker than V4, with the holds trimmed)
//   ENDING   sigma = t - TC_END. A brief balanced stance behind the ball; one step to plant the support foot; a set-piece
//            wind-up in which the turned ankle bends inside the socket (the pylon and cleat swing back); the swing to
//            contact; the follow-through while the ball comes at the lens
// The torso is driven with the legs: the chest leans back a little on the wind-up, comes over the ball at contact and
// counter-balances the rising leg in the follow-through; the pelvis rolls under with the kicking hip.
import {lerp, ss, ss5, clamp} from '../lib';
import {spline} from '../motion';
import {Cam, toScreen} from '../camera';
import {BPose} from '../v2/body';
import {legTo, happy, focus, ANK, HAND_EASY, HAND_OPEN} from '../v2/poses';
import {mixExpr} from '../dc/Head';
import {V} from '../dc/math';
import {DIMW, dirA, ikLeg} from '../art/wyatt';
import {CONTACT, WIPE_T, CUT_XRAY, T4, TC_END, DUR4} from './story5';

export const BALL_R = 11;
export const BALL_C: V = {x: -27, y: -BALL_R}; // the ball's centre at contact (both kicks)
export const SUP: V = {x: -42, y: -ANK}; // the support (left, far) cleat's ankle, planted
/** the far side's screen offset (a slight rear three-quarter view: it separates the planted cleat from the ball) */
export const STAG: V = {x: -16, y: -0.8};
const PA_HIT: V = {x: -3.4, y: -11.5}; // prosthetic ankle at contact
const H_HIT: V = {x: 0, y: -67.8};
const REACH = 65.3;

export const sOpen = (t: number) => t - CONTACT;
export const sEnd = (t: number) => t - TC_END;

// ------------------------------------------------------------------------------------------------ feet
type Sw = {t0: number; t1: number; x0: number; x1: number; h: number};
const footOn = (s: number, sw: Sw[], x0: number) => {
  let x = x0;
  for (const w of sw) {
    if (s < w.t0) return {p: {x, y: -ANK}, pitch: 90, air: 0};
    if (s <= w.t1) {
      const u = (s - w.t0) / (w.t1 - w.t0);
      return {p: {x: lerp(w.x0, w.x1, ss5(u, 0, 1)), y: -ANK - Math.sin(Math.PI * Math.pow(u, 0.8)) * w.h}, pitch: 90 - 22 * Math.sin(Math.PI * u), air: 1};
    }
    x = w.x1;
  }
  return {p: {x, y: -ANK}, pitch: 90, air: 0};
};
// after either kick: a small adjusting step of the support foot so he stands square
const ADJ: Sw = {t0: 0.74, t1: 1.0, x0: SUP.x, x1: -66, h: 6};
// the ending's stance: behind the ball, the prosthetic foot back, the support foot nearer; one step plants it
const NS = 32, FS = 18;
const END_FAR: Sw[] = [{t0: -1.3, t1: -0.8, x0: FS, x1: SUP.x, h: 11}, ADJ];
const LAND = 0.7;
const PA_LAND: V = {x: -58, y: -ANK};

// ------------------------------------------------------------------------------------------------ the hip
const HX_OPEN: [number, number][] = [[-0.3, 3], [0, H_HIT.x], [0.22, -12], [0.42, -24], [LAND, -40], [1.06, -50], [3.7, -50]];
const HX_END: [number, number][] = [[-2.7, 27], [-1.3, 27], [-0.8, -2], [-0.4, 0], [0, H_HIT.x], [0.22, -12], [0.42, -24], [LAND, -40], [1.06, -50], [2.0, -50]];
const hipY = (s: number, open: boolean) => {
  let y = lerp(-71.2, H_HIT.y, ss(s, open ? -0.8 : -1.15, open ? -0.35 : -0.82) * (1 - ss(s, 0.3, 0.95)));
  if (open) {
    // soft knees after the landing, so the turned foot tilts back in its socket and its toes point behind him on
    // "ankle"; he straightens into the proof (V5: settles ~12% sooner)
    y += 4.6 * ss(s, 0.68, 0.94) * (1 - ss(s, T4.working - CONTACT - 0.34, T4.working - CONTACT - 0.08));
  } else {
    // the stance: knees soft, weight even, a small settle as he lines up the ball
    y += (1 - ss(s, -1.35, -1.0)) * (1.4 + 0.5 * Math.sin(2 * Math.PI * 1.1 * (s + 2.6)));
  }
  return y;
};

// ------------------------------------------------------------------------------------------------ the kicking leg
const ik = (H: V, P: V, pitch = 80) => legTo(H, P, pitch);
const A_HIT = ik(H_HIT, PA_HIT, 78);
const A_PRE = ik({x: H_HIT.x + 1.2, y: H_HIT.y}, {x: PA_HIT.x + 15, y: PA_HIT.y - 5}, 74); // frame 0: one frame out
// the follow-through and the landing, shared by both kicks
const FT_HIP: [number, number][] = [[0, A_HIT.hip], [0.2, 56], [0.42, 50], [0.56, 34]];
const FT_KNEE: [number, number][] = [[0, A_HIT.knee], [0.2, 8], [0.42, 14], [0.56, 30]];
// the ending's wind-up: toe-off, the turned ankle bends (pylon and cleat swing back and up), a beat at the top, the swing
const TOE0 = -0.8;
const WU_HIP: [number, number][] = [[-0.56, -9], [-0.36, -17], [-0.26, -15], [-0.12, -3]];
const WU_KNEE: [number, number][] = [[-0.56, 64], [-0.36, 96], [-0.26, 94], [-0.12, 76]];
// the opening's last moment before contact (V4's keys, so frame 0 is the same swing)
const OP_HIP: [number, number][] = [[-0.34, -16], [-0.17, -5]];
const OP_KNEE: [number, number][] = [[-0.34, 92], [-0.17, 72]];

// ------------------------------------------------------------------------------------------------ the torso
// chest and pelvis tilts (deg, + toward his front) through the kick: wind-up lean back, over the ball at contact,
// counter-balance in the follow-through, upright as he stands
const CHEST: [number, number][] = [[-2.7, 2], [-1.3, 2], [-0.8, 6], [-0.36, -1], [-1 / 30, 8], [0, 9], [0.2, 1], [0.42, -2], [LAND, 4], [1.3, 1], [3.7, 1]];
const PELVIS: [number, number][] = [[-2.7, 3], [-1.3, 3], [-0.8, 5], [-0.36, 1], [-1 / 30, 6], [0, 7], [0.2, 11], [0.42, 9], [LAND, 5], [1.3, 3], [3.7, 3]];

/** the kick pose; open = the opening's clock, else the ending's */
export const kickPose5 = (s: number, open: boolean): BPose => {
  let H: V = {x: spline(s, open ? HX_OPEN : HX_END), y: hipY(s, open)};
  // the far (support) foot
  const fs = open ? footOn(s, [ADJ], SUP.x) : footOn(s, END_FAR, FS);
  if (fs.air === 0) {
    const dx = H.x + STAG.x - fs.p.x;
    H = {x: H.x, y: Math.max(H.y, fs.p.y - Math.sqrt(Math.max(0, REACH ** 2 - dx * dx)) - STAG.y)};
  }
  // the near (kicking) leg
  let near;
  if (!open && s < TOE0) {
    // the stance: planted behind, the heel peeling up just before the toe-off
    const peel = ss(s, -1.05, TOE0);
    const P = {x: NS - 3 * peel, y: -ANK - 7.6 * peel};
    const dx = H.x - P.x;
    H = {x: H.x, y: Math.max(H.y, P.y - Math.sqrt(Math.max(0, REACH ** 2 - dx * dx)))};
    near = legTo(H, P, 90 - 34 * peel);
  } else if (s < LAND) {
    const pre = open ? {hip: OP_HIP, knee: OP_KNEE} : {hip: WU_HIP, knee: WU_KNEE};
    const a0 = legTo({x: spline(TOE0, HX_END), y: hipY(TOE0, false)}, {x: NS - 3, y: -ANK - 7}, 56);
    const aLand = legTo({x: spline(LAND, HX_OPEN), y: -69.5}, PA_LAND, 90);
    const start: [number, number][] = open ? [] : [[TOE0, a0.hip]];
    const startK: [number, number][] = open ? [] : [[TOE0, a0.knee]];
    const HIP: [number, number][] = [...start, ...pre.hip, [-1 / 30, A_PRE.hip], ...FT_HIP, [LAND, aLand.hip]];
    const KNEE: [number, number][] = [...startK, ...pre.knee, [-1 / 30, A_PRE.knee], ...FT_KNEE, [LAND, aLand.knee]];
    const ANKK: [number, number][] = [...(open ? [] : [[TOE0, a0.ank] as [number, number]]), [-0.34, 0], [-1 / 30, A_PRE.ank], [0, A_HIT.ank], [0.3, 0], [LAND, aLand.ank]];
    near = {hip: spline(s, HIP), knee: spline(s, KNEE), ank: spline(s, ANKK)};
  } else {
    { const dx = H.x - PA_LAND.x; H = {x: H.x, y: Math.max(H.y, PA_LAND.y - Math.sqrt(Math.max(0, REACH ** 2 - dx * dx)))}; }
    const base = legTo(H, PA_LAND, 90);
    if (open) {
      // the proof on "working knee", ~12% quicker than V4 with the hold trimmed: bend (0.46 s), a short beat, back
      // down (0.5 s), then a second, smaller bend that carries into the X-ray cut
      const w = T4.working - CONTACT;
      const c1 = ss5(s, w - 0.07, w + 0.39) * (1 - ss5(s, w + 0.58, w + 1.08));
      const c2 = 0.55 * ss5(s, w + 1.16, w + 1.42) * (1 - ss5(s, w + 1.48, CUT_XRAY - CONTACT + 0.12));
      const curl = Math.max(c1, c2);
      H = {x: H.x - 2.5 * curl, y: H.y};
      const b2 = legTo(H, PA_LAND, 90);
      // the prosthetic ankle travels from where it stands to the full bend along a path that leaves the turf at once
      // (solved by IK, so the cleat never dips below the ground on the way up or down)
      const P1 = {x: H.x + DIMW.thigh * dirA(-4).x + DIMW.shin * dirA(-68).x, y: H.y + DIMW.thigh * dirA(-4).y + DIMW.shin * dirA(-68).y};
      const P = {x: lerp(PA_LAND.x, P1.x, curl), y: Math.min(PA_LAND.y, lerp(PA_LAND.y, P1.y, curl)) - 3.5 * Math.sin(Math.PI * curl)};
      const g = ikLeg(H, P);
      const ank = lerp(b2.ank, 0, curl);
      near = {hip: g.hip, knee: g.knee, ank};
    } else near = base;
  }
  const far = legTo({x: H.x + STAG.x, y: H.y + STAG.y}, fs.p, fs.pitch);
  // arms: at rest out a little for balance in the stance -> balance at the strike (near arm back, far arm forward and
  // out) -> through contact to the follow-through's -> easing down
  const bal = ss(s, open ? -1 : -0.9, open ? -0.5 : -0.4) * (1 - ss(s, 0.5, 1.3));
  const ab = ss(s, -0.02, 0.26);
  const rest = ss(s, 0.9, 1.5);
  const aN = {sh: lerp(lerp(-14, lerp(-46, 28, ab), bal), -6, rest), el: lerp(lerp(30, lerp(30, 40, ab), bal), 20, rest)};
  const aF = {sh: lerp(lerp(18, lerp(70, -36, ab), bal), 6, rest), el: lerp(lerp(34, lerp(34, 30, ab), bal), 22, rest)};
  const watchFly = !open ? ss(s, 0.05, 0.4) : 0;
  return {
    hip: H, pelvis: spline(s, PELVIS), chest: spline(s, CHEST),
    near, far, stag: STAG, aN, aF, hN: HAND_EASY, hF: HAND_OPEN, wN: -8, wF: 12,
    neck: lerp(10, 2, watchFly) + (open ? 8 * ss(s, 1.0, 1.5) : 0), turn: 0.95,
    expr: {...mixExpr(happy, focus, ss(s, -1.2, -0.5) * (1 - ss(s, 0.25, 0.8))), gx: lerp(-0.6, -0.15, watchFly), gy: lerp(0.75, -0.1, watchFly)},
    blink: 0,
  };
};
/** toes inside the socket: a flick on "ankle" (opening only) */
export const kickToe5 = (s: number, open: boolean) => (open ? 38 * Math.max(0, Math.sin(Math.PI * clamp((s - (T4.ankle - CONTACT + 0.02)) / 0.4))) : 0);

// ------------------------------------------------------------------------------------------------ cameras
/** the decisive frame's low side angle (frame 0 and the opening strike) */
export const LOW: Cam = {x: -18, y: -38.5, w: 86, eye: -13};
/** the backward foot's centre (world) for the reveal's match */
export const footCentre5 = (s: number) => {
  const p = kickPose5(s, true);
  const nSa = p.near.hip - p.near.knee;
  const A = {x: p.hip.x + DIMW.thigh * dirA(p.near.hip).x, y: p.hip.y + DIMW.thigh * dirA(p.near.hip).y};
  const u = dirA(nSa - 35), v = dirA(nSa - 35 + 90);
  return {x: A.x + 5 * u.x + 2 * v.x, y: A.y + 5 * u.y + 2 * v.y};
};
/** where the foot was when the ball covered it (computed: LOW at the last uncovered frame) */
export const FOOT_MATCH = toScreen(LOW, footCentre5(7 / 30 - CONTACT));
const REV_W = 52;
const REV_HOLD: Cam = {x: -51, y: -37, w: REV_W, eye: -36};
export const revealCam5 = (t: number): Cam => {
  const fc = footCentre5(t - CONTACT);
  const k = 1080 / REV_W;
  const track: Cam = {x: fc.x - (FOOT_MATCH.x - 540) / k, y: fc.y - (FOOT_MATCH.y - 960) / k, w: REV_W, eye: -40};
  const u = ss5(t, 0.5, 1.03);
  const w = T4.working;
  const sw = Math.max(ss5(t, w - 0.25, w + 0.39) * (1 - ss5(t, w + 0.58, w + 1.08)), 0.55 * ss5(t, w + 1.1, w + 1.42) * (1 - ss5(t, w + 1.48, CUT_XRAY + 0.1)));
  return {x: lerp(track.x, REV_HOLD.x, u) + 9 * sw, y: lerp(track.y, REV_HOLD.y, u) + 3 * sw, w: REV_W, eye: lerp(track.eye, REV_HOLD.eye, u)};
};
/** the ending: the stance (wide, still) */
export const STANCE_CAM: Cam = {x: 2, y: -78, w: 120, eye: -56};
/** close on the prosthesis for the wind-up; it eases back and up a little with the swinging pylon */
const kneeA = (s: number) => {
  const p = kickPose5(s, false);
  return {x: p.hip.x + DIMW.thigh * dirA(p.near.hip).x, y: p.hip.y + DIMW.thigh * dirA(p.near.hip).y};
};
export const ankleCamE = (t: number): Cam => {
  // the lens follows the turned ankle (smoothed over 0.3 s, so it moves with the action without whipping)
  const s = t - TC_END;
  let x = 0, y = 0;
  for (let i = -3; i <= 3; i++) { const a = kneeA(s + i * 0.05); x += a.x / 7; y += a.y / 7; }
  return {x: x + 7, y: y + 4, w: 54, eye: -34};
};
/** low on the shoe and the ball */
export const CONTACT_CAM: Cam = {x: -14, y: -16, w: 46, eye: -8};
/** the follow-through and the ball coming at the lens (low, a little wider than LOW) */
export const FLIGHT_CAM: Cam = {x: -62, y: -50, w: 104, eye: -14};
export {DIMW, dirA, WIPE_T, DUR4};
