// V3 schedule (film seconds). ONE workstation, as in the paper: a fixation platform on a motor-driven slider. Each cycle:
// the platform slides out and comes back with the next anaesthetised insect fixed under rods A and B; the arm scans it
// from its initial position, takes the backpack from the holder, implants the electrodes at an angle, presses until the
// branches latch, lets go and goes back; the rods retract and the insect walks off. Cycles are sequential, one insect at a
// time. The film's last 2.5 s play the first cycle's pre-roll (tau = t - DUR): the next module coming down onto the next
// insect, which IS frame 0, so the loop is continuous by construction.
import {add3, V3} from '../core/three';
import {DUR, noise1, ring, ss} from '../lib';
import {K3, key3} from '../story';
import {Arm3, HOLD_SEAT, SLIDE_OUT} from './machine3';
import {Pack2} from '../v2/pack2';
import {seatFrame} from '../kit/backpack';
import {blendLegs, frameOf, Path, standState, walkState} from '../roach/gait';
import {PACK_SEAT, RoachState} from '../roach/rig';

export const PLAT_H = 3.2;
/** the platform swaps: [start out, at the far end (the next insect is on it from here), back at the station] */
const SWAPS: [number, number, number][] = [[4.28, 4.43, 4.58], [5.98, 6.16, 6.34], [15.9, 16.15, 16.4], [27.86, 28.06, 28.3]];
export const sledX3 = (t: number) => {
  for (const [a, b, c] of SWAPS) {
    if (t >= a && t <= b) return SLIDE_OUT * ss(t, a, b);
    if (t > b && t <= c) return SLIDE_OUT * (1 - ss(t, b, c));
  }
  return 0;
};
export const sledIdx3 = (t: number) => SWAPS.filter(([, b]) => t >= b).length;
export const LOOP_K3 = 4;
/** ground: the bench, with the platform (3.2 mm) at the station */
export const ground3 = (x: number, y: number) => {
  const inX = 1 - ss(Math.abs(x), 28, 31), inY = (1 - ss(y, 40, 43)) * ss(y, -59, -56);
  return PLAT_H * inX * inY;
};

export type Cycle3 = {snap: number; led: number; batt: number; open: number; walk: number; v: number; path: Path};
const P = (segs: Path['segs']): Path => ({p0: [0, 0, PLAT_H], yaw0: 90, segs, ground: ground3});
export const CYC3: Record<number, Cycle3> = {
  0: {snap: 1.03, led: 1.15, batt: 2.9, open: 3.25, walk: 3.4, v: 40, path: P([{len: 70}, {len: 110, turn: 90}, {len: 4000}])},
  1: {snap: 5.47, led: 5.5, batt: 5.52, open: 5.58, walk: 5.64, v: 70, path: P([{len: 70}, {len: 100, turn: 84}, {len: 4000}])},
  2: {snap: 10.17, led: 10.55, batt: 10.9, open: 11.8, walk: 12.0, v: 44, path: P([{len: 58}, {len: 62, turn: 72}, {len: 4000}])},
  3: {snap: 25.2, led: 25.3, batt: 25.5, open: 26.4, walk: 26.6, v: 40, path: P([{len: 80}, {len: 100, turn: -80}, {len: 4000}])},
};
export const R2_TURN_T = 13.2;
const travel = (c: Cycle3, t: number) => {
  const d = t - c.walk;
  if (d <= 0) return 0;
  return c.v * (d < 0.3 ? (d * d) / 0.6 : d - 0.15);
};
const sedated = (x: number, t: number, k: number): RoachState => standState({p: [x, 0, PLAT_H], yaw: 90}, {
  antTw: [6 + 2 * noise1(t * 0.6, k), 6 + 2 * noise1(t * 0.6, k + 9)], antLift: [-14, -14], headPitch: 6, breathe: 0.5 + 0.5 * Math.sin(t * 2.2 + k),
}, undefined, 1.06);

export type Bug3 = {k: number; st: RoachState; pack: Pack2 | null; fitted: boolean; onSled: boolean};
/** insect k at time t; null if it is not in the world (not yet loaded) */
export const bugAt3 = (k: number, t: number): Bug3 | null => {
  const idx = sledIdx3(t);
  const loop = k === LOOP_K3;
  if (loop && idx < LOOP_K3) return null;
  const kk = loop ? 0 : k;
  const tt = loop ? t - DUR : t;
  const C = CYC3[kk];
  if (!loop && k > idx) return null; // still being loaded, off the workstation
  const x = sledX3(t);
  const press = -0.6 * ss(tt, C.snap - 0.12, C.snap - 0.05) * (1 - ss(tt, C.snap - 0.03, C.snap + 0.06));
  if (loop || tt < C.snap) {
    const st = sedated(x, tt, kk);
    if (press) st.body = frameOf({p: [x, 0, PLAT_H], yaw: 90}, press);
    return {k, st: press ? standState({p: [x, 0, PLAT_H], yaw: 90}, {...st, body: st.body}, undefined, 1.06) : st, pack: null, fitted: false, onSled: true};
  }
  const breathe = 0.5 + 0.5 * Math.sin(tt * 2.2 + kk);
  const tw = ss(tt, C.led, C.led + 0.12) * (1 - ss(tt, C.walk + 0.1, C.walk + 0.4));
  const flick = ring(tt, C.led, 3.2, 0.35);
  const jitter = (i: number): V3 => {
    const a = 0.8 * tw * (0.9 + 0.6 * Math.sin(i * 2.3));
    return [a * 1.2 * Math.sin(tt * 31 + i), a * Math.cos(tt * 27 + i * 1.7), Math.max(0, a * 2 * Math.sin(tt * 23 + i * 2.1))];
  };
  const look = {
    antTw: [6 + 18 * ss(tt, C.led, C.led + 0.18) + 8 * flick, 6 + 15 * ss(tt, C.led + 0.05, C.led + 0.22) - 6 * flick] as [number, number],
    antLift: [-14 + 26 * ss(tt, C.led, C.led + 0.25), -14 + 22 * ss(tt, C.led + 0.04, C.led + 0.28)] as [number, number],
    headPitch: 6 - 8 * ss(tt, C.led, C.led + 0.3),
    breathe,
  };
  let st: RoachState;
  let onSled = true;
  if (tt < C.walk) {
    const body = frameOf({p: [0, 0, PLAT_H], yaw: 90 + 1.2 * tw * Math.sin(tt * 37)}, -0.5 * ring(tt, C.snap, 6, 0.1));
    st = standState({p: [0, 0, PLAT_H], yaw: 90}, {...look, body}, jitter, 1.06 - 0.06 * ss(tt, C.led, C.walk));
  } else {
    onSled = false;
    const s = travel(C, tt);
    const sway = 6 * Math.sin((tt - C.walk) * 2.4);
    st = walkState(C.path, s, {antTw: [18 + sway, 18 - sway], antLift: [12, 10], headPitch: -2, breathe});
    const hand = ss(tt, C.walk, C.walk + 0.3);
    if (hand < 1) st = blendLegs(standState({p: [0, 0, PLAT_H], yaw: 90}, look, undefined, 1.0), st, hand);
  }
  const pack: Pack2 = {F: seatFrame(st.body, PACK_SEAT), led: ss(tt, C.led, C.led + 0.08) * (0.85 + 0.15 * Math.sin(tt * 9)), hook: ss(tt, C.snap - 0.08, C.snap), batt: ss(tt, C.batt, C.batt + 0.2)};
  return {k, st, pack, fitted: true, onSled};
};
/** the cyborg finished at the end of the previous loop (cycle 3), still walking away at the start of this one */
export const prevLoopBug = (t: number): Bug3 | null => (t < 12 ? bugAt3(3, t + DUR) : null);
export const rodsAt3 = (t: number) => {
  // rods press while an insect is fixed; they lift at release and come back down when the next insect arrives
  const lift = (o: number, n: number) => ss(t, o, o + 0.15) * (1 - ss(t, n - 0.12, n));
  return Math.max(lift(3.25, 4.58), lift(5.58, 6.34), lift(11.8, 16.4), lift(26.4, 28.3));
};

// ------------------------------------------------------------------ the arm
const S = (dx: number, dy: number, dz: number): V3 => add3([0, PACK_SEAT[0], PACK_SEAT[2] + PLAT_H], [dx, dy, dz]);
const INIT: V3 = S(-26, -26, 100); // the initial position, where the wrist camera images the next fixed insect
const HS = (dz = 0): V3 => add3(HOLD_SEAT, [0, 0, dz]);
/** frame 0's descent (tau): already moving on frame 0; alignment correction; angled implant; press; latch; let go */
export const HOOK3: K3[] = [
  {t: -2.5, p: S(0, -10, 110), stop: true},
  {t: 0.0, p: S(0, -6, 14)},
  {t: 0.35, p: S(0, -5, 4.4)},
  {t: 0.55, p: S(1.4, -4.6, 3.9)},
  {t: 0.75, p: S(0, -4.5, 3.4), stop: true},
  {t: 0.9, p: S(0, 0, 0.3)},
  {t: 0.98, p: S(0, 0, -0.6), stop: true},
  {t: 1.03, p: S(0, 0, 0), stop: true},
  {t: 1.2, p: S(0, 0, 0), stop: true},
  {t: 1.7, p: S(0, -12, 60)},
  {t: 2.5, p: INIT, stop: true},
];
const ARMK3: K3[] = [
  ...HOOK3.filter((k) => k.t >= 0),
  {t: 4.3, p: INIT, stop: true},
  {t: 4.62, p: S(-4, -4, 92), stop: true},
  {t: 4.72, p: S(-4, -4, 92), stop: true},
  {t: 4.82, p: HS(8)},
  {t: 4.86, p: HS(), stop: true},
  {t: 4.9, p: HS(), stop: true},
  {t: 5.0, p: HS(30)},
  {t: 5.2, p: S(0, -6, 22)},
  {t: 5.3, p: S(0, -4.5, 3.4)},
  {t: 5.4, p: S(0, 0, 0.3)},
  {t: 5.44, p: S(0, 0, -0.6), stop: true},
  {t: 5.47, p: S(0, 0, 0), stop: true},
  {t: 5.56, p: S(0, 0, 0), stop: true},
  {t: 5.85, p: S(0, -12, 60)},
  {t: 6.35, p: HS(40)},
  {t: 6.95, p: HS(6)},
  {t: 7.12, p: HS(), stop: true},
  {t: 7.3, p: HS(), stop: true},
  {t: 7.75, p: HS(36)},
  {t: 8.6, p: S(0, -9, 28)},
  {t: 9.25, p: S(0, -5, 4.2), stop: true},
  {t: 9.75, p: S(0, 0, 0.3)},
  {t: 9.98, p: S(0, 0, -0.6), stop: true},
  {t: 10.17, p: S(0, 0, 0), stop: true},
  {t: 10.36, p: S(0, 0, 0), stop: true},
  {t: 11.0, p: S(0, -12, 72)},
  {t: 12.0, p: INIT, stop: true},
  {t: 21.0, p: INIT, stop: true},
  {t: 21.8, p: HS(6)},
  {t: 21.95, p: HS(), stop: true},
  {t: 22.1, p: HS(), stop: true},
  {t: 22.5, p: HS(30)},
  {t: 23.6, p: S(0, -6, 22)},
  {t: 24.4, p: S(0, -4.5, 3.4), stop: true},
  {t: 24.9, p: S(0, 0, 0.3)},
  {t: 25.1, p: S(0, 0, -0.6), stop: true},
  {t: 25.2, p: S(0, 0, 0), stop: true},
  {t: 25.35, p: S(0, 0, 0), stop: true},
  {t: 25.9, p: S(0, -12, 60)},
  {t: 27.0, p: INIT, stop: true},
  {t: 27.3, p: INIT, stop: true},
  {t: 27.65, p: HS(8)},
  {t: 27.95, p: HS(), stop: true},
  {t: 28.05, p: HS(), stop: true},
  {t: 28.3, p: HS(30)},
  {t: DUR - 2.5, p: S(0, -10, 110), stop: true},
];
const openAt3 = (t: number) => {
  const o = (a: number, b: number, c: number, d: number) => ss(t, a, b) * (1 - ss(t, c, d));
  return 2.4 * Math.max(o(1.05, 1.17, 4.8, 4.88), o(5.48, 5.56, 7.1, 7.18), o(10.2, 10.33, 21.92, 22.0), o(25.22, 25.35, 27.9, 27.98));
};
export const heldPack3 = (t: number): number | null => {
  if (t < 1.03) return 0;
  if (t >= 4.88 && t < 5.47) return 1;
  if (t >= 7.18 && t < 10.17) return 2;
  if (t >= 22.0 && t < 25.2) return 3;
  if (t >= 27.98) return LOOP_K3;
  return null;
};
export const armAt3 = (t: number): {arm: Arm3; held: number | null} => {
  const pre = t > DUR - 2.5;
  const tcp = pre ? key3(t - DUR, HOOK3) : t < 2.5 ? key3(t, HOOK3) : key3(t, ARMK3);
  return {arm: {tcp, yaw: 90, open: pre ? 0 : openAt3(t)}, held: heldPack3(t)};
};
export const holderFull3 = (t: number) => (t >= 2.3 && t < 4.86) || (t >= 5.9 && t < 7.18) || (t >= 10.5 && t < 21.95) || (t >= 24.0 && t < 27.98);
