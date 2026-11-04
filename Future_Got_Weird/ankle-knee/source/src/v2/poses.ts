// V2 poses. Each is built from where the body's weight is: planted feet are world targets (shoes stay where they
// land), the hip is placed over the support, legs are solved by two-bone IK, and the spine bends at the waist with
// the rib cage counter-tilting against the pelvis. Arms are posed per side so the near and far arm never mirror.
import {BPose, ArmT} from './body';
import {Leg, ikLeg} from '../art/wyatt';
import {EXPR_NEUTRAL, Expr} from '../dc/Head';
import {HandPose} from '../dc/Hand';
import {V} from '../dc/math';
import {lerp} from '../lib';

export const ANK = 7.7; // ankle height of a flat shoe
/** a leg reaching for an ankle target with a world foot pitch (90 = flat, toes forward) */
export const legTo = (H: V, T: V, pitch: number): Leg => {
  const {hip, knee} = ikLeg(H, T);
  return {hip, knee, ank: hip - knee + 90 - pitch};
};
export const HAND_GRIP: HandPose = {curl: [0.78, 0.82, 0.86, 0.9], spread: 0.08, thumb: 36, thumbCurl: 0.6};
export const HAND_EASY: HandPose = {curl: [0.3, 0.36, 0.42, 0.48], spread: 0.3, thumb: 20, thumbCurl: 0.4};
export const HAND_OPEN: HandPose = {curl: [0.12, 0.14, 0.18, 0.22], spread: 0.55, thumb: 34, thumbCurl: 0.25};
export const HAND_PINCH: HandPose = {curl: [0.55, 0.62, 0.7, 0.76], spread: 0.15, thumb: 52, thumbCurl: 0.35};

export const happy: Expr = {...EXPR_NEUTRAL, smile: 0.95, open: 0.3, teeth: 0.6, wide: 1.05, flush: 0.45};
export const focus: Expr = {...EXPR_NEUTRAL, smile: 0.3, open: 0.05, browDown: 0.3, gx: -0.6, gy: 0.7};

/** the kick, one parameter set for the opening and the ending: support (far, left) foot planted, near leg free */
export const kickPose = (o: {H: V; nearPA: V; nearPitch: number; chest: number; pelvis: number; aN: ArmT; aF: ArmT; expr?: Expr; neck?: number; fFoot: V; stag: V}): BPose => {
  const Hf = {x: o.H.x + o.stag.x, y: o.H.y + o.stag.y};
  return {
    hip: o.H, pelvis: o.pelvis, chest: o.chest,
    near: legTo(o.H, o.nearPA, o.nearPitch),
    far: legTo(Hf, o.fFoot, 90),
    stag: o.stag, aN: o.aN, aF: o.aF, hN: HAND_EASY, hF: HAND_OPEN, wN: -10, wF: 12,
    neck: o.neck ?? 8, turn: 0.95, expr: o.expr ?? focus, blink: 0,
  };
};

/** standing between the rails, both feet planted and staggered, hands on the rails; u = 0 standing, 1 = the bend */
export const railPose = (o: {x: number; u: number; railN: V; railF: V; expr: Expr; gaze?: number}): BPose => {
  const sink = 8.5 * o.u;
  const H = {x: o.x + 1.6 * o.u, y: -73.2 + sink};
  const stag = {x: -17, y: -2.6};
  const nF = {x: o.x - 3, y: -ANK}, fF = {x: o.x - 3 + stag.x + 2, y: -ANK + stag.y};
  return {
    hip: H, pelvis: 4 + 6 * o.u, chest: 3 + 8 * o.u,
    near: legTo(H, nF, 90), far: legTo({x: H.x + stag.x, y: H.y + stag.y}, fF, 90),
    stag, aN: {T: o.railN, elbow: -1}, aF: {T: o.railF, elbow: -1}, hN: HAND_GRIP, hF: HAND_GRIP, wN: 20, wF: 20,
    neck: 6 + 10 * o.u + (o.gaze ?? 0), turn: 0.7, expr: o.expr, blink: 0,
  };
};

/** reclined in recovery: back and head on the raised bed, the operated leg on a pillow, the foot hanging free */
export const recoveryPose = (o: {H: V; expr: Expr; blink: number; neck: number}): BPose => ({
  hip: o.H, pelvis: -24, chest: -40, near: {hip: 100, knee: 0, ank: 0}, far: {hip: 94, knee: 4, ank: 8},
  stag: {x: 2, y: -2}, aN: {sh: 38, el: 70}, aF: {sh: 30, el: 60}, hN: HAND_EASY, hF: HAND_EASY,
  neck: o.neck, turn: 0.85, expr: o.expr, blink: o.blink,
});

/** a running stride (u: 0 = near foot planted under him, 0.5 = flight, far foot reaching) for the approach */
export const strideAt = (o: {H: V; nP: V; nPitch: number; fP: V; fPitch: number; lean: number; swing: number; expr: Expr; stag?: V}): BPose => {
  const stag = o.stag ?? {x: -4, y: -1};
  const Hf = {x: o.H.x + stag.x, y: o.H.y + stag.y};
  const s = o.swing; // +1: near arm forward
  return {
    hip: o.H, pelvis: 6 + o.lean * 0.4, chest: o.lean,
    near: legTo(o.H, o.nP, o.nPitch), far: legTo(Hf, o.fP, o.fPitch), stag,
    aN: {sh: lerp(-38, 44, (s + 1) / 2), el: lerp(32, 70, (s + 1) / 2)},
    aF: {sh: lerp(44, -40, (s + 1) / 2), el: lerp(74, 30, (s + 1) / 2)},
    hN: HAND_EASY, hF: HAND_EASY, wN: 0, wF: 0, neck: 2, turn: 0.9, expr: o.expr, blink: 0,
  };
};
