// V4 kick: ONE motion on one clock, tau = seconds from contact. The opening runs tau = t - CONTACT (frame 0 is one
// frame before contact); the closing field scene runs tau = t - T_LOOP, so the film's last frame is tau = -2/30 and
// frame 0 continues it (tau = -1/30): the approach, plant and swing at the end are the part of the kick the opening
// skips, and the loop seam is inside one continuous movement.
//
// World layout (subject plane, cm; screen x = his forward is screen-left): a slight rear three-quarter view, so his far
// side reads shifted screen-left (stag). Left to right at contact: the planted support cleat, the ball, the prosthetic
// cleat striking it, the rimmed socket with his backward foot above it.
import {lerp, ss, ss5, clamp} from '../lib';
import {spline} from '../motion';
import {Cam, CKey, glide, travel} from '../camera';
import {BPose} from '../v2/body';
import {legTo, happy, focus, ANK, HAND_EASY, HAND_OPEN} from '../v2/poses';
import {mixExpr} from '../dc/Head';
import {V} from '../dc/math';
import {DIMW, dirA} from '../art/wyatt';
import {CONTACT, T_LOOP, WIPE_T, CUT_XRAY, T4} from './story4';

export const BALL_R = 11;
export const BALL_C: V = {x: -29, y: -BALL_R}; // the ball's centre at contact
export const SUP: V = {x: -46, y: -ANK}; // the support (left, far) cleat's ankle, planted
const STAG: V = {x: -22, y: -0.8};
const PA_HIT: V = {x: -5.4, y: -11.5}; // prosthetic ankle at contact
const H_HIT: V = {x: 0, y: -67.8};

export const tauOpen = (t: number) => t - CONTACT;
export const tauEnd = (t: number) => t - T_LOOP;

// ------------------------------------------------------------------------------------------------ the feet's plan
type Sw = {t0: number; t1: number; x0: number; x1: number; h: number};
const FAR_SW: Sw[] = [
  {t0: -2.28, t1: -1.94, x0: 104, x1: 90, h: 7},
  {t0: -1.62, t1: -1.27, x0: 90, x1: 44, h: 11},
  {t0: -0.95, t1: -0.42, x0: 44, x1: SUP.x, h: 14},
  // after the kick: a small adjusting step so he stands square for the reveal
  {t0: 0.86, t1: 1.16, x0: SUP.x, x1: -70, h: 6},
];
const NEAR_SW: Sw[] = [
  {t0: -1.96, t1: -1.6, x0: 122, x1: 80, h: 10},
  {t0: -1.3, t1: -0.94, x0: 80, x1: 38, h: 12},
];
const footOn = (tau: number, sw: Sw[], x0: number) => {
  let x = x0;
  for (const s of sw) {
    if (tau < s.t0) return {p: {x, y: -ANK}, pitch: 90, air: 0};
    if (tau <= s.t1) {
      const u = (tau - s.t0) / (s.t1 - s.t0);
      return {p: {x: lerp(s.x0, s.x1, ss5(u, 0, 1)), y: -ANK - Math.sin(Math.PI * Math.pow(u, 0.8)) * s.h}, pitch: lerp(66, 90, ss(u, 0.4, 1)), air: 1};
    }
    x = s.x1;
  }
  return {p: {x, y: -ANK}, pitch: 90, air: 0};
};

// the hip's path (x) along the whole kick
const HX: [number, number][] = [
  [-4.3, 118], [-2.3, 117], [-1.94, 104], [-1.6, 85], [-1.27, 62], [-0.94, 42], [-0.42, 4], [0, H_HIT.x], [0.22, -12], [0.45, -24],
  [0.85, -42], [1.2, -52], [3.7, -52],
];
// the kicking leg (near, prosthetic) from toe-off to landing: angles keyed through IK solutions at the key moments
const ik = (H: V, P: V, pitch = 80) => legTo(H, P, pitch);
const NEAR_TOEOFF = -0.52;
const LAND = 0.84;
const PA_LAND: V = {x: -60, y: -ANK};

const hipAt = (tau: number): V => {
  const x = spline(tau, HX);
  // a running bob before the plant; lower through the plant and the strike; back up as he settles
  const run = ss(tau, -2.35, -2.0) * (1 - ss(tau, -0.7, -0.42));
  let y = -71.5 + 1.4 * Math.sin((tau + 2.3) * Math.PI * 3.1) * run;
  y = lerp(y, H_HIT.y, ss(tau, -0.7, -0.4) * (1 - ss(tau, 0.3, 1.0)));
  // after the landing: soft knees (both bend a little), so the turned foot tilts back in its socket and its toes point
  // clearly behind him on "ankle"; he straightens into the proof
  const soft = ss(tau, 0.75, 1.05) * (1 - ss(tau, T4.working - CONTACT - 0.3, T4.working - CONTACT));
  y += 4.6 * soft;
  // before he sets off: a ready stance, knees soft, a small bounce on his toes as the pass comes past
  const ready = 1 - ss(tau, -2.45, -2.2);
  if (tau < 0) y += ready * (1.6 + 0.7 * Math.sin(2 * Math.PI * 1.7 * (tau + 4)));
  return {x, y};
};

/** the kick pose at tau */
export const kickPose = (tau: number): BPose => {
  let H = hipAt(tau);
  const fs = footOn(tau, FAR_SW, 104);
  // the strike phase: the near leg is keyed, the far foot planted at SUP
  const strike = tau >= NEAR_TOEOFF && tau < LAND + 0.02;
  // clamp the hip so every planted foot is within reach
  const Hf0 = {x: H.x + STAG.x, y: H.y + STAG.y};
  const reach = 65.3;
  if (fs.air === 0) {
    const dx = Hf0.x - fs.p.x;
    const need = fs.p.y - Math.sqrt(Math.max(0, reach ** 2 - dx * dx)) - STAG.y;
    H = {x: H.x, y: Math.max(H.y, need)};
  }
  const nf = footOn(tau, NEAR_SW, 122);
  // the trailing (near) foot peels off before the swing: heel up, toes last to leave
  const peel = ss(tau, -0.9, NEAR_TOEOFF);
  if (tau > -0.94 && tau < NEAR_TOEOFF) nf.p = {x: nf.p.x - 3 * peel, y: nf.p.y - 7 * peel}, nf.pitch = 90 - 34 * peel;
  if (!strike && tau < -0.9 && nf.air === 0) {
    const dx = H.x - nf.p.x;
    H = {x: H.x, y: Math.max(H.y, nf.p.y - Math.sqrt(Math.max(0, reach ** 2 - dx * dx)))};
  }
  let near;
  if (tau < NEAR_TOEOFF) near = legTo(H, nf.p, nf.pitch);
  else if (tau < LAND) {
    // key angles (hip, knee) through the swing
    const a0 = legTo(hipAt(NEAR_TOEOFF), {x: 37, y: -ANK - 7}, 56);
    const aHit = ik(H_HIT, PA_HIT, 78);
    const aPre = ik({x: H_HIT.x + 1.2, y: H_HIT.y}, {x: PA_HIT.x + 15, y: PA_HIT.y - 5}, 74); // frame 0: one frame out
    const aLand = legTo({x: spline(LAND, HX), y: -69.5}, PA_LAND, 90);
    const HIP: [number, number][] = [[NEAR_TOEOFF, a0.hip], [-0.34, -16], [-0.17, -5], [-1 / 30, aPre.hip], [0, aHit.hip], [0.2, 56], [0.47, 52], [0.66, 30], [LAND, aLand.hip]];
    const KNEE: [number, number][] = [[NEAR_TOEOFF, a0.knee], [-0.34, 92], [-0.17, 72], [-1 / 30, aPre.knee], [0, aHit.knee], [0.2, 8], [0.47, 12], [0.66, 28], [LAND, aLand.knee]];
    const ANKK: [number, number][] = [[NEAR_TOEOFF, a0.ank], [-0.34, 0], [-1 / 30, aPre.ank], [0, aHit.ank], [0.3, 0], [LAND, aLand.ank]];
    near = {hip: spline(tau, HIP), knee: spline(tau, KNEE), ank: spline(tau, ANKK)};
  } else {
    // landed in front; standing; the proof: the turned ankle flexes on "working knee" and the prosthetic shin swings
    const curl = ss5(tau, T4.working - CONTACT - 0.02, T4.knee - CONTACT + 0.02) * (1 - ss5(tau, T4.knee - CONTACT + 0.5, CUT_XRAY - CONTACT));
    const KC = 64;
    const shift = ss(tau, T4.working - CONTACT - 0.35, T4.working - CONTACT) * (1 - ss(tau, T4.wyatt - CONTACT + 0.1, T4.wyatt - CONTACT + 0.45));
    H = {x: H.x - 2.5 * shift, y: H.y};
    { const dx = H.x - PA_LAND.x; H = {x: H.x, y: Math.max(H.y, PA_LAND.y - Math.sqrt(Math.max(0, reach ** 2 - dx * dx)))}; }
    const base = legTo(H, PA_LAND, 90);
    near = {hip: lerp(base.hip, -4, curl), knee: lerp(base.knee, KC, curl), ank: lerp(base.ank, 0, curl)};
  }
  // the far leg: planted at SUP from the plant on (fs handles it), adjusting step after the kick
  const far = legTo({x: H.x + STAG.x, y: H.y + STAG.y}, fs.p, fs.pitch);
  // arms: running swing -> balance at the strike (near arm back, far arm out) -> easing to his sides
  const ph = Math.sin((tau + 2.3) * Math.PI * 3.1);
  const run = ss(tau, -2.35, -2.0) * (1 - ss(tau, -0.55, -0.3));
  const bal = ss(tau, -0.6, -0.2) * (1 - ss(tau, 0.5, 1.3));
  const rest = ss(tau, 0.9, 1.5);
  const rdy = tau < 0 ? 1 - ss(tau, -2.45, -2.1) : 0;
  const ab = ss(tau, -0.02, 0.26); // the strike's balance arms swing through to the follow-through's
  const aN = {sh: lerp(lerp(lerp(lerp(-6, -16, rdy), -40 * ph, run), lerp(-48, 30, ab), bal), -6, rest), el: lerp(lerp(lerp(lerp(22, 44, rdy), 62, run), lerp(28, 40, ab), bal), 20, rest)};
  const aF = {sh: lerp(lerp(lerp(lerp(8, 22, rdy), 40 * ph, run), lerp(76, -40, ab), bal), 6, rest), el: lerp(lerp(lerp(lerp(26, 48, rdy), 66, run), lerp(34, 30, ab), bal), 22, rest)};
  const lean = ss(tau, -0.5, -0.1) * (1 - ss(tau, 0.3, 1.0));
  // gaze: tracking the rolling ball before the strike, after it as it flies, then down at his leg
  const watchBall = ss(tau, -3.3, -2.7) * (1 - ss(tau, 0.4, 0.9));
  const behind = ss(tau, -4.2, -3.9) * (1 - ss(tau, -3.3, -2.8)); // eyes back over his shoulder as the pass comes
  return {
    hip: H, pelvis: 4 + 4 * lean + 3 * run, chest: lerp(-1, 10, run) + 6 * lean - 5 * ss(tau, 0, 0.25) * (1 - rest),
    near, far, stag: STAG, aN, aF, hN: HAND_EASY, hF: HAND_OPEN, wN: -8, wF: 12,
    neck: lerp(6, 14, lean) + 8 * ss(tau, 1.0, 1.6) + 12 * ss(tau, -3.3, -2.8) * (1 - ss(tau, -2.4, -1.9)), turn: 0.95,
    expr: {...mixExpr(happy, focus, ss(tau, -1.2, -0.5) * (1 - ss(tau, 0.25, 0.8))), gx: lerp(lerp(-0.5, -0.9, watchBall), 0.85, behind), gy: lerp(0.2, 0.75, ss(tau, -1.0, -0.3))},
    blink: 0,
  };
};
/** toes inside the socket: a small flex as the reveal lands on "ankle", none in the strike */
export const kickToe = (tau: number) => 38 * Math.max(0, Math.sin(Math.PI * clamp((tau - (T4.ankle - CONTACT + 0.02)) / 0.4)));

// ------------------------------------------------------------------------------------------------ the ball
/** the pass (tau <= 0), in world cm: played from behind him, it rolls past him (screen right to left), slowing, and
 *  he runs onto it; after contact the ball is a screen overlay (ballScreen) */
const V1 = 25, DEC = 18;
export const ballWorld = (tau: number) => {
  const tt = Math.min(0, tau);
  const x = BALL_C.x - V1 * tt + 0.5 * DEC * tt * tt;
  // the pass runs a little nearer the lens than he stands (it passes in front of his feet), and converges on his line
  // before he reaches it, so from the plant on (and in frame 0) it is exactly at the strike position
  const D = lerp(138, 170, ss(tau, -2.0, -0.7));
  return {x, y: BALL_C.y, spin: (x - BALL_C.x) / BALL_R, D};
};

// ------------------------------------------------------------------------------------------------ cameras
/** the decisive frame's low side angle (frame 0, the strike, and the last 9 frames of the film) */
export const LOW: Cam = {x: -19.5, y: -38.5, w: 86, eye: -13};
/** the close side view after the wipe: follows the leg down from the follow-through, then holds on it */
/** where the backward foot was when the ball covered it in LOW (screen px) and its centre in the foot frame */
export const FOOT_MATCH = {x: 215, y: 880};
export const footCentre = (tau: number) => {
  const p = kickPose(tau);
  const nSa = p.near.hip - p.near.knee;
  const A = {x: p.hip.x + DIMW.thigh * dirA(p.near.hip).x, y: p.hip.y + DIMW.thigh * dirA(p.near.hip).y};
  const fa = nSa - 35; // SEAT
  const u = dirA(fa), v = dirA(fa + 90);
  return {x: A.x + 5 * u.x + 2 * v.x, y: A.y + 5 * u.y + 2 * v.y};
};
const REV_W = 52;
const REV_HOLD: Cam = {x: -53, y: -37, w: REV_W, eye: -36};
export const revealCam = (t: number): Cam => {
  // first: the lens holds the foot where the viewer last saw it; then it pans to the standing leg as he lands
  const fc = footCentre(t - CONTACT);
  const s = 1080 / REV_W;
  const track: Cam = {x: fc.x - (FOOT_MATCH.x - 540) / s, y: fc.y - (FOOT_MATCH.y - 960) / s, w: REV_W, eye: -40};
  const u = ss5(t, 0.5, 1.15);
  // through the proof the lens drifts right with the swinging prosthetic shin so the whole swing stays in frame
  const sw = ss5(t, T4.working - 0.25, T4.knee) * (1 - ss5(t, T4.knee + 0.45, T4.wyatt + 0.3));
  return {x: lerp(track.x, REV_HOLD.x, u) + 9 * sw, y: lerp(track.y, REV_HOLD.y, u) + 3 * sw, w: REV_W, eye: lerp(track.eye, REV_HOLD.eye, u)};
};
/** the closing field scene: medium-wide, tracking between Wyatt and the ball */
export const fieldCam = (t: number): Cam => {
  const tau = tauEnd(t);
  const Hx = spline(tau, HX);
  const b = ballWorld(tau).x;
  // Wyatt left of centre with the pass entering from the right; then the lens leads him toward the ball
  const x = lerp(Hx + 20, (Hx + b) / 2 - 12, ss(tau, -3.4, -2.2));
  return {x, y: -80, w: 132, eye: -58};
};
export {DIMW, dirA};
