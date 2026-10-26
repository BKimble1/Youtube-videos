// V5 control room: the stage layout and the operator's performance (HOOK owner). Copied from V3's shelter
// (v3/Machine3_shelter.tsx: the rig, the mirrored figure, the reach solver) and re-timed for the hook and the loop
// shot. Everything is on the loop clock tau (tau3): H3 (the end of the film) is tau -1.62 .. 0, the hook 0 .. 2.27.
//   H3   she watches the extended channel through the window, her near hand resting on the desk edge; the machine
//        starts charging at 32.9 (the crackle): her eyes drop to the control and her hand lifts toward it (33.0)
//   A1   the hand carries on across the seam and hits the FIRE cap at T_TOUCH (0.2, "fired"): the fingertip lands on
//        the cap exactly (reachPose) while still moving, the cap goes in with it, and she holds it; as the beam
//        ignites outside (T_RELAY) her eyes go up to the window ("LASER")
//   A2   the surge builds in the console (1.2-1.75): her eyes drop to her hand, alarmed; the crack (1.75) is the x-ray
//        flash (Room5 draws it); she snaps her hand back off the cap (T_REC, one fast move to a guard pose in front of
//        her chest), leans back and looks up at the window, startled (the whip up follows at 2.2)
import {DIM, ManPose, manJoints} from '../dc/Man';
import {HandPose, mixHand} from '../dc/Hand';
import {Expr, EXPR_NEUTRAL, mixExpr} from '../dc/Head';
import {add, clamp, mul, V} from '../dc/math';
import {E_FOCUS, E_JOLT, E_TRACK, H_REST, H_SPLAY, P} from '../cast';
import {ss} from '../lib';
import {tau3} from '../v3/timeline3';

export const MIRROR = 540;
const mx = (p: V): V => ({x: 2 * MIRROR - p.x, y: p.y});
/** the stage: the FIRE control (under its raised guard, in a hazard ring), the ARM key, the panel, desk, window */
/** V5 fix (HOOK-1): the control sits further out along the panel (as V3's, 826), so the reaching arm opens to about
 *  105 deg: the upper arm runs from the shoulder down across her chest, the elbow comes out past the jacket's front
 *  edge (silhouetted against the panel, above the caption band) and the forearm angles up to the cap */
export const FIRE: V = {x: 830, y: 1136};
export const PANEL = {x0: 606, y0: 938, x1: 1100, y1: 1345};
export const DESK_Y = 1342;
export const WIN = {x0: 486, y0: 70, x1: 1180, y1: 900};
export const CAP_R = 46, CAP_R_IN = 37;

// ------------------------------------------------------------------ timing (loop clock)
export const T_CHARGE = -0.6; // 32.9: the machine starts charging (the crackle); the beam outside drops to standby
export const T_APP0 = -0.5; // 33.0: her hand leaves the desk edge for the control
export const T_TOUCH = 0.2; // the fingertip on the cap ("fired")
export const T_RELAY = 0.27; // the machine fires: the beam ignites outside
export const T_SURGE0 = 1.2; // "into": the surge builds in the console
export const T_CRACK = 1.75; // the crack: the flash and the x-ray
/** the x-ray frames (film frames on the crack: on, on, off, on) */
export const XRAY_FRAMES = [53, 54, 56];
export const T_REC = 1.87; // she snaps her hand back off the cap
export const T_REC1 = 2.06; // the hand is up in front of her chest
export const T_LOOKUP = 2.0; // her eyes and head go up to the window (the whip follows)

const H_POINT: HandPose = {curl: [0.04, 0.86, 0.9, 0.93], spread: 0.15, thumb: 26, thumbCurl: 0.6};
const H_OPEN: HandPose = {curl: [0.18, 0.3, 0.36, 0.42], spread: 0.3, thumb: 26, thumbCurl: 0.45};
const H_GUARD: HandPose = {curl: [0.12, 0.16, 0.2, 0.26], spread: 0.8, thumb: 44, thumbCurl: 0.15};

/** the index fingertip for a hand (same construction as dc/Hand.tsx, straight index) */
const tipOffset = (ang: number, L: number, ts: number) => {
  const d = {x: Math.cos((ang * Math.PI) / 180), y: Math.sin((ang * Math.PI) / 180)};
  const n = {x: -d.y, y: d.x};
  return add(mul(d, 0.84 * L), mul(n, 0.185 * L * ts));
};
const BASE: ManPose = P({x: 700, y: 1452, s: 1.16, torso: 8, chest: 5, neck: -4, turn: 0.55, lElb: -1, rTu: -300, rTv: -80, rElb: 1, lHip: 6, rHip: -6});
/** solve the near arm so the index tip reaches `tipS` (stage), the hand pointing at `angS` (stage deg) */
export const reachPose = (base: ManPose, tipS: V, angS: number): ManPose => {
  const s = base.s;
  const L = DIM.hand * s;
  const tipR = mx(tipS);
  const angR = 180 - angS;
  const wristHand = add(tipR, mul(tipOffset(angR, L, 1), -1));
  let p: ManPose = {...base, lW: 1, lWx: wristHand.x, lWy: wristHand.y, lWr: 0};
  for (let i = 0; i < 3; i++) {
    const j = manJoints(p);
    const target = add(wristHand, mul(j.L.foreDir, 6 * s));
    const foreAng = (Math.atan2(j.L.foreDir.y, j.L.foreDir.x) * 180) / Math.PI;
    p = {...p, lW: 1, lWx: target.x, lWy: target.y, lWr: ((((angR - foreAng) % 360) + 540) % 360) - 180};
  }
  return p;
};
/** the drawn index tip of a solved pose (stage), for checks */
export const tipOf = (p: ManPose): V => {
  const j = manJoints(p);
  const L = DIM.hand * p.s;
  const w = add(j.L.W, mul(j.L.foreDir, -6 * p.s));
  return mx(add(w, tipOffset(j.L.handAng, L, 1)));
};

/** the fingertip's rest on the desk edge (H3), its approach path and the recoil's end (stage) */
const REST: V = {x: 596, y: 1302};
const REST_ANG = 26;
const APP1: V = {x: 800, y: 1252}; // the approach rises from below the cap into it (quadratic)
const GUARD: V = {x: 600, y: 1150}; // the recoil ends with the hand up in front of her chest, fingers spread
const GUARD_ANG = -58;
const bez2 = (a: V, b: V, c: V, k: number): V => {
  const m = 1 - k;
  return {x: m * m * a.x + 2 * m * k * b.x + k * k * c.x, y: m * m * a.y + 2 * m * k * b.y + k * k * c.y};
};
/** the approach's direction as it meets the cap (the quadratic's end tangent) */
const APP_DIR = (() => {
  const dx = FIRE.x - APP1.x, dy = FIRE.y - APP1.y, n = Math.hypot(dx, dy);
  return {x: dx / n, y: dy / n};
})();
/** the approach's speed at contact as a fraction of its mean (it hits the cap still moving) */
const APP_V1 = 1.25;
/** the press: the fingertip carries on into the cap by PRESS_D (stage px) and stops in PRESS_T (an impact) */
const PRESS_D = 10;
const PRESS_T = (() => {
  const v = 2 * Math.hypot(FIRE.x - APP1.x, FIRE.y - APP1.y) * (APP_V1 / (T_TOUCH - T_APP0));
  return (2 * PRESS_D) / v;
})();
/** the cap (stage): pressed, it goes in with the fingertip and shrinks under the socket's lip */
export const capAt = (c: V, press: number) => ({x: c.x + APP_DIR.x * PRESS_D * press, y: c.y + APP_DIR.y * PRESS_D * press, r: CAP_R - (CAP_R - CAP_R_IN) * press});
const pressIn = (tau: number) => {
  const y = clamp((tau - T_TOUCH) / PRESS_T);
  return 1 - (1 - y) * (1 - y);
};

// ------------------------------------------------------------------ expressions
const E_WATCH: Expr = {...E_TRACK, gx: -0.62, gy: -0.82, open: 0.06, smile: 0.08, browIn: 0.3};
const E_AIM: Expr = {...E_FOCUS, gx: -0.5, gy: 0.6, browDown: 0.75, browIn: 0.0, lid: 0.22, squint: 0.15, smile: -0.25, open: 0.0};
const E_LOOK: Expr = {...E_TRACK, gx: -0.64, gy: -0.92, browIn: 0.5, open: 0.22, wide: 0.82, smile: 0.0, pupil: 0.85};
const E_ALARM: Expr = {...EXPR_NEUTRAL, browIn: 0.95, browDown: 0.1, lid: 0, pupil: 0.7, open: 0.18, wide: 0.8, smile: -0.45, gx: -0.48, gy: 0.62, sweat: 0.25, flush: 0.2};
const E_STARTLE: Expr = {...EXPR_NEUTRAL, browIn: 0.85, browDown: 0, lid: 0, squint: 0, pupil: 0.62, open: 0.42, wide: 0.74, smile: -0.5, teeth: 0.12, gx: -0.5, gy: -0.6, sweat: 0.45, flush: 0.35};
const E_UP: Expr = {...E_STARTLE, gx: -0.62, gy: -0.95, open: 0.34};

export type Op5 = {pose: ManPose; expr: Expr; hand: HandPose; press: number; reach: number; held: number};
/** the performance on film time t */
export const op5 = (t: number): Op5 => {
  const tau = tau3(t);
  // approach: cubic from rest (zero speed) to the cap at APP_V1 x the mean speed (it lands moving)
  const x = clamp((tau - T_APP0) / (T_TOUCH - T_APP0));
  const reach = (3 - APP_V1) * x * x + (APP_V1 - 2) * x * x * x;
  const down = pressIn(tau);
  const rec = ss(tau, T_REC, T_REC1);
  // the recoil is one quick move: it leaves the cap fast (ease-out) and settles in front of her chest
  const recE = 1 - Math.pow(1 - clamp((tau - T_REC) / (T_REC1 - T_REC)), 3);
  const press = down * (1 - ss(tau, T_REC, T_REC + 0.05));
  const tip0 = bez2(REST, APP1, FIRE, reach);
  const held = {x: tip0.x + APP_DIR.x * PRESS_D * down, y: tip0.y + APP_DIR.y * PRESS_D * down};
  // the recoil path: back off the cap and up toward her chest (it never crosses her face)
  const recCtl = {x: held.x - 40, y: held.y - 60};
  const tip = tau > T_REC ? bez2(held, recCtl, GUARD, recE) : held;
  // the hand ends nearly in line with the forearm (wrist bend about 15 deg), the index finger slightly up into the cap
  const angApp = REST_ANG + (-14 - REST_ANG) * ss(reach, 0, 1) + 6 * down;
  const ang = tau > T_REC ? angApp + (GUARD_ANG - angApp) * recE : angApp;
  // the body: still in H3 (breathing), leaning in with the reach, back with the recoil; the head lifts to look up
  const lean = ss(tau, T_APP0, T_TOUCH + 0.05) * (1 - rec);
  const lookUp = ss(tau, T_RELAY + 0.05, T_RELAY + 0.35) * (1 - ss(tau, T_SURGE0 + 0.1, T_SURGE0 + 0.4));
  const lookUp2 = ss(tau, T_LOOKUP, T_LOOKUP + 0.18);
  const watch = 1 - ss(tau, T_CHARGE, T_CHARGE + 0.2);
  const neck = -4 + 6 * watch + 9 * lookUp - 3 * ss(tau, T_SURGE0 + 0.1, T_SURGE0 + 0.4) * (1 - rec) + 12 * lookUp2;
  const torso = BASE.torso + 3 * lean - 4 * rec;
  const breath = 0.3 + 0.2 * Math.sin(tau * 2.2);
  const base: ManPose = {...BASE, torso, chest: BASE.chest - 2 * rec, neck, turn: 0.55 + 0.05 * lookUp2, breath};
  const pose = reachPose(base, tip, ang);
  // eyes: the window (H3) -> the control (charging) -> up at the window as the beam fires -> her hand (the surge)
  // -> squeezed shut on the crack -> startled, up at the window
  let ex = mixExpr(E_WATCH, E_AIM, ss(tau, T_CHARGE, T_CHARGE + 0.14));
  ex = mixExpr(ex, E_LOOK, lookUp);
  ex = mixExpr(ex, E_ALARM, ss(tau, T_SURGE0 + 0.05, T_SURGE0 + 0.3));
  if (tau >= T_CRACK && tau < T_REC + 0.02) ex = E_JOLT;
  else if (tau >= T_REC + 0.02) ex = mixExpr(mixExpr(E_JOLT, E_STARTLE, ss(tau, T_REC + 0.02, T_REC + 0.1)), E_UP, lookUp2);
  // hands: resting -> opening as it lifts -> pointing for the press -> splayed in the recoil, then a loose guard
  let hand: HandPose = H_REST;
  if (tau < T_REC) hand = reach < 1 ? mixHand(mixHand(H_REST, H_OPEN, ss(tau, T_APP0, T_APP0 + 0.15)), H_POINT, ss(reach, 0.45, 0.85)) : H_POINT;
  else hand = mixHand(mixHand(H_POINT, H_SPLAY, ss(tau, T_REC, T_REC + 0.08)), H_GUARD, ss(tau, T_REC + 0.12, T_REC1 + 0.1));
  return {pose, expr: ex, hand, press, reach, held: down};
};
/** the x-ray shows on these film frames (the hook only) */
export const xrayOn = (t: number) => t > 0 && t < 3 && XRAY_FRAMES.includes(Math.round(t * 30));
