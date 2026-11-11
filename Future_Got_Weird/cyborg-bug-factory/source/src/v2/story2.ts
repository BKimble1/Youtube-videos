// V2 schedule (seconds of film time; narration map in production/V2_NARRATION_MAP.md). Everything in the lab is a
// function of t. Two loop guarantees:
//  1. The OPENING CYBORG (OC) walks one route, parameterised by tau. Frame 0 is tau = 0 (in the narrow passage, antennae
//     in the slot); the film's last 4.8 s play tau = t - DUR (it walks out of the spotlight, toward the lens, round and
//     into the passage). The end therefore flows into frame 0 by construction.
//  2. The STATION at the end (carrier LOOP_K, the arm holding a backpack above it) is in the state the station is in at
//     frame 0 (carrier 0, the same hold), so the background matches too.
import {add3, V3} from '../core/three';
import {DUR, noise1, ring, ss} from '../lib';
import {K3, key3} from '../story';
import {ArmState2} from './arm2';
import {Pack2} from './pack2';
import {CARRIER_PITCH, H0, Q0, TRAY2_SLOTS} from './lab2';
import {seatFrame} from '../kit/backpack';
import {blendLegs, frameOf, Path, pathAt, standState, STRIDE, walkState} from '../roach/gait';
import {PACK_SEAT, RoachState} from '../roach/rig';

// ------------------------------------------------------------------ conveyor
export const convIdx2 = (t: number) => ss(t, 4.3, 4.56) + ss(t, 6.0, 6.34) + ss(t, 16.0, 16.4);
export const LOOP_K2 = 3;
export const carrierX2 = (k: number, t: number) => (convIdx2(t) - k) * CARRIER_PITCH;

// ------------------------------------------------------------------ assembly cycles
export type Cycle2 = {snap: number; led: number; batt: number; open: number; walk: number; v: number; path: (x: number) => Path};
// released insects walk out of the cell into the dark (-x) along straight lines, so none of them wanders back into
// the opening's frame by the end of the film
const fwd = (turn: number, r: number): Path => ({p0: [0, 0, 0], yaw0: 90, segs: [{len: 70}, {len: r, turn}, {len: 4000}]});
/** R2's walk in the control demo: straight, then a left turn of ~75 deg after the pulses (round the obstacle) */
export const R2_TURN_S = 84; // travel where the turn starts
export const R2_PATH: Path = {p0: [0, 0, 0], yaw0: 90, segs: [{len: R2_TURN_S}, {len: 60, turn: 76}, {len: 70}, {len: 30, turn: 14}, {len: 4000}]};
export const OBSTACLE: V3 = [0, R2_TURN_S + 52, 0]; // a small block straight ahead of where the turn starts
export const CYCLES2: Record<number, Cycle2> = {
  0: {snap: 3.0, led: 3.3, batt: 3.45, open: 3.85, walk: 4.05, v: 44, path: () => fwd(90, 110)},
  1: {snap: 5.48, led: 5.52, batt: 5.54, open: 5.58, walk: 5.66, v: 70, path: () => fwd(84, 100)},
  2: {snap: 10.17, led: 10.6, batt: 10.72, open: 10.98, walk: 11.3, v: 42, path: () => ({...R2_PATH})},
};
const travel = (c: Cycle2, t: number) => {
  const d = t - c.walk;
  if (d <= 0) return 0;
  return c.v * (d < 0.3 ? (d * d) / 0.6 : d - 0.15);
};
const sedated = (x: number, t: number, k: number): RoachState => standState({p: [x, 0, 0], yaw: 90}, {
  antTw: [6 + 2 * noise1(t * 0.6, k), 6 + 2 * noise1(t * 0.6, k + 9)], antLift: [-14, -14], headPitch: 6, breathe: 0.5 + 0.5 * Math.sin(t * 2.2 + k),
}, undefined, 1.06);

export type Bug2 = {k: number; st: RoachState; pack: Pack2 | null; fitted: boolean};
export const bugAt2 = (k: number, t: number): Bug2 => {
  const x = carrierX2(k, t);
  const loop = k === LOOP_K2;
  const kk = loop ? 0 : k;
  const tt = loop ? t - DUR : t;
  const C = CYCLES2[kk];
  const press = C ? -0.7 * ss(tt, C.snap - 0.14, C.snap - 0.07) * (1 - ss(tt, C.snap - 0.04, C.snap + 0.06)) : 0;
  if (!C || loop || tt < C.snap) {
    const st = sedated(x, tt, kk);
    if (press) st.body = frameOf({p: [x, 0, 0], yaw: 90}, press);
    return {k, st: press ? standState({p: [x, 0, 0], yaw: 90}, {...st, body: st.body}, undefined, 1.06) : st, pack: null, fitted: false};
  }
  const breathe = 0.5 + 0.5 * Math.sin(tt * 2.2 + kk);
  const tw = ss(tt, C.led, C.led + 0.12) * (1 - ss(tt, C.walk + 0.1, C.walk + 0.4));
  const flick = ring(tt, C.led, 3.2, 0.35);
  const jitter = (i: number): V3 => {
    const a = tw * (0.9 + 0.6 * Math.sin(i * 2.3));
    return [a * 1.4 * Math.sin(tt * 31 + i), a * 1.1 * Math.cos(tt * 27 + i * 1.7), Math.max(0, a * 2.2 * Math.sin(tt * 23 + i * 2.1))];
  };
  const look = {
    antTw: [6 + 20 * ss(tt, C.led, C.led + 0.18) + 9 * flick, 6 + 16 * ss(tt, C.led + 0.05, C.led + 0.22) - 7 * flick] as [number, number],
    antLift: [-14 + 28 * ss(tt, C.led, C.led + 0.25), -14 + 24 * ss(tt, C.led + 0.04, C.led + 0.28)] as [number, number],
    headPitch: 6 - 8 * ss(tt, C.led, C.led + 0.3),
    breathe,
  };
  let st: RoachState;
  if (tt < C.walk) {
    const jolt = 0.5 * tw * Math.sin(tt * 37);
    const body = frameOf({p: [x, 0, 0], yaw: 90 + jolt * 2.4}, -0.5 * ring(tt, C.snap, 6, 0.1));
    st = standState({p: [x, 0, 0], yaw: 90}, {...look, body}, jitter, 1.06 - 0.06 * ss(tt, C.led, C.walk));
  } else {
    const P = C.path(x);
    P.p0 = [x, 0, 0];
    const s = travel(C, tt);
    const sway = 6 * Math.sin((tt - C.walk) * 2.4);
    st = walkState(P, s, {antTw: [18 + sway, 18 - sway], antLift: [12, 10], headPitch: -2, breathe});
    const hand = ss(tt, C.walk, C.walk + 0.3);
    if (hand < 1) st = blendLegs(standState({p: [x, 0, 0], yaw: 90}, look, undefined, 1.0), st, hand);
  }
  const pack: Pack2 = {F: seatFrame(st.body, PACK_SEAT), led: ss(tt, C.led, C.led + 0.08) * (0.85 + 0.15 * Math.sin(tt * 9)), hook: ss(tt, C.snap - 0.08, C.snap), batt: ss(tt, C.batt, C.batt + 0.22)};
  return {k, st, pack, fitted: true};
};
export const r2Travel = (t: number) => travel(CYCLES2[2], t);

// ------------------------------------------------------------------ ambient cyborgs (fitted before the film)
const AMB: {p0: V3; yaw0: number; r: number; v: number; s0: number}[] = [
  {p0: [-150, 260, 0], yaw0: 20, r: 90, v: 34, s0: 0},
  {p0: [-60, 470, 0], yaw0: 200, r: 70, v: 30, s0: 140},
  {p0: [-205, 420, 0], yaw0: -30, r: 50, v: 26, s0: 60},
];
export const ambientBugs2 = (t: number) => AMB.map((a, i) => {
  // periodic in the film length (so frame 0 continues the last frame): n laps per film, the lap a whole number of
  // strides (so the legs are in the same phase too); the radius is adjusted to fit
  const n = i === 2 ? 3 : 2;
  const m = Math.round((2 * Math.PI * a.r * n) / STRIDE);
  const r = (STRIDE * m) / (2 * Math.PI * n);
  const v = (2 * Math.PI * r * n) / DUR;
  const P: Path = {p0: a.p0, yaw0: a.yaw0, segs: [{len: 2 * Math.PI * r * 20, turn: (i % 2 ? -360 : 360) * 20}]};
  const tt = ((t % DUR) + DUR) % DUR;
  const st = walkState(P, a.s0 + v * tt, {antTw: [16, 16], antLift: [10, 10], headPitch: -2, breathe: 0.5});
  return {st, pack: {F: seatFrame(st.body, PACK_SEAT), led: 0.85, hook: 1, batt: 1} as Pack2};
});

// ------------------------------------------------------------------ the opening cyborg's route (tau = t at the start, t - DUR at the end)
/** built backwards from frame 0: from the slot, out of the corridor, round the 140-degree bend, back to where it
 *  stands in the spotlight at the start of the ending; then reversed into a forward path */
const rev: Path = {p0: Q0, yaw0: H0 + 180, segs: [{len: 150}, {len: 78, turn: 140}, {len: 64}]};
const revEnd = pathAt(rev, 150 + 78 + 64);
export const OC_LEN0 = 150 + 78 + 64; // travel from the ending's start to frame 0
export const OC_PATH: Path = {p0: revEnd.p, yaw0: revEnd.yaw + 180, segs: [{len: 64}, {len: 78, turn: -140}, {len: 150}, {len: 36, turn: -82}, {len: 600}]};
/** travel along OC_PATH at tau, integrated from a smooth speed profile: stands in the spotlight (tau < -3.9), walks
 *  (toward the lens, round the bend, into the corridor), slows to a crawl while the antennae probe the slot
 *  (-0.3 .. 0.3), then the fast turn into the side passage (0.3 .. 0.85) and on. The walking speed is scaled so the
 *  insect is exactly at the slot (travel OC_LEN0) at tau = 0. */
const vShape = (tau: number, k: number) => {
  const walk = ss(tau, -3.9, -3.35) * (1 - ss(tau, -0.95, -0.3));
  const probe = 6 * ss(tau, -0.95, -0.3) * (1 - ss(tau, 0.28, 0.45));
  const run = ss(tau, 0.28, 0.5) * (78 - 26 * ss(tau, 0.9, 1.5));
  return k * 72 * walk + probe + run;
};
const DT = 0.002, T0 = -4.8;
const integ = (k: number) => {
  const out: number[] = [0];
  for (let i = 1; T0 + i * DT <= 2.6; i++) out.push(out[i - 1] + vShape(T0 + (i - 0.5) * DT, k) * DT);
  return out;
};
const i0 = Math.round((0 - T0) / DT);
const KW = (() => {
  const a = integ(0)[i0], b = integ(1)[i0];
  return (OC_LEN0 - a) / (b - a);
})();
const STAB = integ(KW);
export const ocS = (tau: number) => {
  const x = (tau - T0) / DT;
  if (x <= 0) return 0;
  const i = Math.floor(x);
  if (i >= STAB.length - 1) return STAB[STAB.length - 1] + 52 * (tau - (T0 + (STAB.length - 1) * DT));
  return STAB[i] + (STAB[i + 1] - STAB[i]) * (x - i);
};
/** the opening cyborg at tau */
export const ocState = (tau: number): {st: RoachState; pack: Pack2} => {
  const s = ocS(tau);
  const probe = ss(tau, -0.6, -0.1) * (1 - ss(tau, 0.35, 0.6));
  const sw = probe * 20 * Math.sin(tau * 15) + (1 - probe) * 8 * Math.sin(tau * 2.6);
  const lift = 12 + 10 * probe;
  const inCorr = ss(s, OC_LEN0 - 160, OC_LEN0 - 130);
  const st = walkState(OC_PATH, s, {antTw: [14 - 10 * probe + sw, 14 - 10 * probe - sw], antLift: [lift, lift - 3], headPitch: -2 - 6 * probe, breathe: 0.5}, {spread: 1 - 0.2 * inCorr});
  // the steering pulse: the cyan command reaches the backpack at tau ~0.22; the LED flares
  const flare = Math.exp(-Math.pow((tau - 0.3) / 0.12, 2));
  const pack: Pack2 = {F: seatFrame(st.body, PACK_SEAT), led: 0.75 + 0.25 * flare, hook: 1, batt: 1, pulse: tau > 0.18 && tau < 0.62 ? {t: (tau - 0.18) / 0.3, side: 1} : undefined};
  return {st, pack};
};

// ------------------------------------------------------------------ the arm
const S = (dx: number, dy: number, dz: number): V3 => add3([0, PACK_SEAT[0], PACK_SEAT[2]], [dx, dy, dz]);
const HOME: V3 = [58, 40, 150];
const HOLD = S(0, -9, 150); // the frame-0 / end hold, high above the station (out of the opening's macro frame)
const slot = (i: number, dz = 0): V3 => add3(TRAY2_SLOTS[i], [0, 0, dz]);
const ARMK2: K3[] = [
  {t: -1, p: HOLD, stop: true},
  {t: 0.9, p: HOLD, stop: true},
  {t: 1.95, p: S(0, -6, 26)},
  {t: 2.5, p: S(0, -4.5, 3.6), stop: true},
  {t: 2.8, p: S(0, 0, 0.3)},
  {t: 2.9, p: S(0, 0, -0.6), stop: true},
  {t: 3.0, p: S(0, 0, 0), stop: true},
  {t: 3.15, p: S(0, 0, 0), stop: true},
  {t: 3.75, p: S(0, -12, 72)},
  // cycle 1 (sped up): scan over the next insect with the wrist camera, grasp, implant, latch, release
  {t: 4.45, p: S(-8, -4, 95), stop: true},
  {t: 4.66, p: S(-8, -4, 95), stop: true},
  {t: 4.8, p: slot(0, 4)},
  {t: 4.85, p: slot(0), stop: true},
  {t: 4.9, p: slot(0), stop: true},
  {t: 5.0, p: slot(0, 30)},
  {t: 5.22, p: S(0, -6, 22)},
  {t: 5.33, p: S(0, -4.5, 3.4)},
  {t: 5.41, p: S(0, 0, 0.3)},
  {t: 5.45, p: S(0, 0, -0.6), stop: true},
  {t: 5.48, p: S(0, 0, 0), stop: true},
  {t: 5.56, p: S(0, 0, 0), stop: true},
  {t: 5.85, p: S(0, -12, 60)},
  // cycle 2 (real time): grab at "grabs", carry, implant, latch on "back"
  {t: 6.35, p: slot(1, 40)},
  {t: 6.95, p: slot(1, 6)},
  {t: 7.12, p: slot(1), stop: true},
  {t: 7.3, p: slot(1), stop: true},
  {t: 7.75, p: slot(1, 36)},
  {t: 8.6, p: S(0, -9, 28)},
  {t: 9.25, p: S(0, -5, 4.2), stop: true},
  {t: 9.75, p: S(0, 0, 0.3)},
  {t: 9.98, p: S(0, 0, -0.6), stop: true},
  {t: 10.17, p: S(0, 0, 0), stop: true},
  {t: 10.36, p: S(0, 0, 0), stop: true},
  {t: 11.0, p: S(0, -12, 72)},
  {t: 12.2, p: HOME, stop: true},
  // the ending: pick a fresh backpack and carry it into the hold
  {t: 26.9, p: HOME},
  {t: 27.45, p: slot(2, 6)},
  {t: 27.62, p: slot(2), stop: true},
  {t: 27.8, p: slot(2), stop: true},
  {t: 28.4, p: slot(2, 60)},
  {t: 29.8, p: HOLD, stop: true},
  {t: DUR + 1, p: HOLD, stop: true},
];
const openAt = (t: number) => {
  const o = (a: number, b: number, c: number, d: number) => ss(t, a, b) * (1 - ss(t, c, d));
  return 2.6 * Math.max(o(3.0, 3.12, 4.8, 4.86), o(5.48, 5.56, 6.95, 7.15), o(10.17, 10.33, 27.5, 27.62));
};
export const heldPack2 = (t: number): number | null => {
  if (t < 3.0) return 0;
  if (t >= 4.86 && t < 5.48) return 1;
  if (t >= 7.15 && t < 10.17) return 2;
  if (t >= 27.6) return LOOP_K2;
  return null;
};
export const armAt2 = (t: number): {arm: ArmState2; held: number | null} => ({arm: {tcp: key3(t, ARMK2), yaw: 90, open: openAt(t)}, held: heldPack2(t)});
export const trayFull2 = (i: number, t: number) => {
  if (i === 0) return t < 4.86 || t > 15;
  if (i === 1) return t < 7.15 || t > 15;
  return t > 15 && t < 27.62;
};
export {pathAt};
