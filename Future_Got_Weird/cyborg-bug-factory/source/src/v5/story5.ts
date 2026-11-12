// V5 schedule: V3's cycle and timing, with its physical contradictions removed.
//  - ONE module model: the seat height puts the mount plate ON the thorax (V3 floated it 1.06 mm above); no battery
//    animation (V3 grew a battery out of nothing).
//  - The held module is a child of the gripper (its frame IS the tool frame), and the gripper is level (no 14 deg tilt)
//    whenever it is near a seat, so the pads close flush on the grasping tab. During placement the arm tracks the
//    insect's live seat, so the module is exactly on the seat when the gripper lets go: no jump at the handover.
//  - Each insect walks completely off the platform before the platform slides (V3 slid it out from under the insect's
//    feet); the real-time slide at the end is slower.
//  - Two holder seats, refilled only while the holder is out of frame (V3 popped a module onto the holder in view).
//  - Rods rest on the body surface (V3's rod B pads sat inside the body) and retract out of the walking path.
//  - Leg twitches move a foot only while it is lifted; the stand -> walk handover keeps planted feet planted.
import {add3, len3, sub3, V3} from '../core/three';
import {DUR, noise1, ring, ss} from '../lib';
import {K3, key3} from '../story';
import {Frame, toW} from '../core/frame';
import {Arm3, HOLD_A, HOLD_B, PLAT5, RODS5, SLIDE_OUT} from './machine5';
import {Pack2} from '../v2/pack2';
import {seatFrame} from '../kit/backpack';
import {frameOf, Path, standState} from '../roach/gait';
import {RoachState} from '../roach/rig';
import {walkFrom, withPoles} from './gait5';

export const PLAT_H = 3.2;
/** the mount plate's underside rests on the thorax's highest point under it (body-local z 9.88 at x -3.2) */
export const PACK_SEAT5: V3 = [-2.4, 0, 9.9];
export const seat5 = (body: Frame): Frame => seatFrame(body, PACK_SEAT5);
/** rod tips: the lowest point of each rounded tip on the body surface (body tops measured from the rig, see qa5) */
export const ROD_DEFS = RODS5(7.54 + PLAT_H + 1.3, 7.78 + PLAT_H + 1.3);
export const ROD_TIP_R = 1.3;

/** the platform swaps: [start out, far end (the next insect is on it from here), back at the station] */
export const SWAPS5: [number, number, number][] = [[4.62, 4.76, 4.9], [7.0, 7.4, 7.8], [15.9, 16.15, 16.4], [28.0, 28.7, 29.4]];
export const sledX5 = (t: number) => {
  for (const [a, b, c] of SWAPS5) {
    if (t >= a && t <= b) return SLIDE_OUT * ss(t, a, b);
    if (t > b && t <= c) return SLIDE_OUT * (1 - ss(t, b, c));
  }
  return 0;
};
export const sledIdx5 = (t: number) => SWAPS5.filter(([, b]) => t >= b).length;
export const LOOP_K5 = 4;
/** what the walking insects stand on: the bench, and the platform (sharp edges, as drawn) while it is at the station */
export const ground5 = (x: number, y: number) => {
  const inX = 1 - ss(Math.abs(x - PLAT5.cx), PLAT5.hx - 0.25, PLAT5.hx + 0.25);
  const inY = (1 - ss(y, PLAT5.cy + PLAT5.hy - 0.25, PLAT5.cy + PLAT5.hy + 0.25)) * ss(y, PLAT5.cy - PLAT5.hy - 0.25, PLAT5.cy - PLAT5.hy + 0.25);
  return PLAT_H * inX * inY;
};

export type Cycle5 = {snap: number; led: number; open: number; walk: number; v: number; ramp?: {t0: number; t1: number; v1: number}; path: Path};
const P = (segs: Path['segs']): Path => ({p0: [0, 0, PLAT_H], yaw0: 90, segs, ground: ground5});
export const CYC5: Record<number, Cycle5> = {
  // cycle 0 walks off at 45 mm/s; from 3.85 s the picture runs as a time-lapse (the 68 s cycle), so it speeds up
  0: {snap: 1.03, led: 1.15, open: 2.95, walk: 3.42, v: 45, ramp: {t0: 3.85, t1: 4.2, v1: 120}, path: P([{len: 70}, {len: 110, turn: 90}, {len: 4000}])},
  // cycle 1 IS the time-lapse (it slows to a normal walk as the time-lapse ends)
  1: {snap: 5.47, led: 5.5, open: 5.58, walk: 6.05, v: 120, ramp: {t0: 7.0, t1: 7.4, v1: 50}, path: P([{len: 70}, {len: 100, turn: 84}, {len: 4000}])},
  2: {snap: 10.17, led: 10.55, open: 11.8, walk: 12.27, v: 44, path: P([{len: 58}, {len: 62, turn: 72}, {len: 4000}])},
  3: {snap: 25.2, led: 25.3, open: 26.2, walk: 26.67, v: 76, path: P([{len: 80}, {len: 100, turn: -80}, {len: 4000}])},
};
/** distance walked: a gentle start (constant acceleration over 0.3 s), then v, ramping to v1 if the cycle has a ramp */
export const travel5 = (c: Cycle5, t: number) => {
  const d = t - c.walk;
  if (d <= 0) return 0;
  const base = c.v * (d < 0.3 ? (d * d) / 0.6 : d - 0.15);
  if (!c.ramp) return base;
  // integrate the extra speed (v1 - v) * ss(t, t0, t1) numerically (deterministic, fine steps)
  const {t0, t1, v1} = c.ramp;
  if (t <= t0) return base;
  const n = 60, a = t0, b = t;
  let s = 0;
  for (let i = 0; i < n; i++) { const u = a + ((i + 0.5) * (b - a)) / n; s += (v1 - c.v) * ss(u, t0, t1); }
  return base + (s * (b - a)) / n;
};
const sedated = (x: number, t: number, k: number): RoachState => standState({p: [x, 0, PLAT_H], yaw: 90}, {
  antTw: [6 + 2 * noise1(t * 0.6, k), 6 + 2 * noise1(t * 0.6, k + 9)], antLift: [-14, -14], headPitch: 6, breathe: 0.5 + 0.5 * Math.sin(t * 2.2 + k),
}, undefined, 1.06);

const FIRST_TRIPOD = [0, 3, 4];
const PREP = 5.1;
export type Bug5 = {k: number; st: RoachState; pack: Pack2 | null; fitted: boolean; onSled: boolean};
export const bugAt5 = (k: number, t: number): Bug5 | null => {
  const b = bugAt5raw(k, t);
  return b ? {...b, st: withPoles(b.st)} : null;
};
const bugAt5raw = (k: number, t: number): Bug5 | null => {
  const idx = sledIdx5(t);
  const loop = k === LOOP_K5;
  if (loop && idx < LOOP_K5) return null;
  const kk = loop ? 0 : k;
  const tt = loop ? t - DUR : t;
  const C = CYC5[kk];
  if (!loop && k > idx) return null;
  const x = sledX5(t);
  // the press before the latch: the body is pushed down 0.6 mm (the module, tracking the seat, goes down with it)
  const press = -0.6 * ss(tt, C.snap - 0.12, C.snap - 0.05) * (1 - ss(tt, C.snap - 0.03, C.snap + 0.06));
  if (loop || tt < C.snap) {
    const st = sedated(x, tt, kk);
    if (press) {
      const body = frameOf({p: [x, 0, PLAT_H], yaw: 90}, press);
      return {k, st: standState({p: [x, 0, PLAT_H], yaw: 90}, {...st, body}, undefined, 1.06), pack: null, fitted: false, onSled: true};
    }
    return {k, st, pack: null, fitted: false, onSled: true};
  }
  const breathe = 0.5 + 0.5 * Math.sin(tt * 2.2 + kk);
  // waking twitches: from the LED until just before the walk (so the walk starts from a still pose)
  const tw = ss(tt, C.led, C.led + 0.12) * (1 - ss(tt, C.walk - 0.3, C.walk - 0.02));
  const flick = ring(tt, C.led, 3.2, 0.35);
  // a leg twitch lifts the foot; it moves sideways only while lifted (planted feet never slide)
  // the preparatory step: just before walking, the first tripod (L1, R2, L3) steps 5.1 mm forward, so the walk starts
  // from a real tripod stance (starting from the symmetric stance compressed those legs by 10 mm: knees folded up
  // into the pronotum)
  const prepE = ss(tt, C.walk - 0.22, C.walk - 0.02);
  const prepLift = Math.sin(Math.PI * Math.min(1, Math.max(0, (tt - (C.walk - 0.22)) / 0.2)));
  const prep = (i: number): V3 => (FIRST_TRIPOD.includes(i) ? [0, PREP * prepE, 2.5 * prepLift] : [0, 0, 0]);
  const jitter = (i: number): V3 => {
    const a = 0.8 * tw * (0.9 + 0.6 * Math.sin(i * 2.3));
    const up = Math.max(0, Math.sin(tt * 23 + i * 2.1));
    const p = prep(i);
    return [a * 1.2 * Math.sin(tt * 31 + i) * up + p[0], a * Math.cos(tt * 27 + i * 1.7) * up + p[1], Math.max(a * 2 * up, p[2])];
  };
  const look = {
    antTw: [6 + 18 * ss(tt, C.led, C.led + 0.18) + 8 * flick, 6 + 15 * ss(tt, C.led + 0.05, C.led + 0.22) - 6 * flick] as [number, number],
    antLift: [-14 + 26 * ss(tt, C.led, C.led + 0.25), -14 + 22 * ss(tt, C.led + 0.04, C.led + 0.28)] as [number, number],
    headPitch: 6 - 8 * ss(tt, C.led, C.led + 0.3),
    breathe,
  };
  let st: RoachState;
  let onSled = true;
  const standSpread = 1.06; // the stance does not change before the walk (V3 pulled the planted feet in)
  if (tt < C.walk) {
    const body = frameOf({p: [0, 0, PLAT_H], yaw: 90 + 1.2 * tw * Math.sin(tt * 37)}, press - 0.5 * ring(tt, C.snap, 6, 0.1));
    st = standState({p: [0, 0, PLAT_H], yaw: 90}, {...look, body}, jitter, standSpread);
  } else {
    onSled = false;
    const s = travel5(C, tt);
    const sway = 6 * Math.sin((tt - C.walk) * 2.4);
    const hand = ss(tt, C.walk, C.walk + 0.35);
    const start = standState({p: [0, 0, PLAT_H], yaw: 90}, look, (i) => (FIRST_TRIPOD.includes(i) ? [0, PREP, 0] : [0, 0, 0]), standSpread);
    st = walkFrom(C.path, s, {antTw: [18 + sway * hand + (look.antTw[0] - 18) * (1 - hand), 18 - sway * hand + (look.antTw[1] - 18) * (1 - hand)], antLift: [12, 10], headPitch: -2 * hand + look.headPitch * (1 - hand), breathe}, start.legs.map((L) => L.foot), {bob: 0.35 * ss(s, 0, 10)});
  }
  const pack: Pack2 = {F: seat5(st.body), led: ss(tt, C.led, C.led + 0.08) * (0.85 + 0.15 * Math.sin(tt * 9)), hook: ss(tt, C.snap - 0.08, C.snap), batt: 0};
  return {k, st, pack, fitted: true, onSled};
};
export const prevLoopBug5 = (t: number): Bug5 | null => (t < 12 ? bugAt5(3, t + DUR) : null);
/** rods: 0 pressing .. 1 lifted and retracted; they come back as the next insect arrives */
export const rodsAt5 = (t: number) => {
  const lift = (o: number, n: number) => ss(t, o, o + 0.25) * (1 - ss(t, n - 0.2, n));
  return Math.max(lift(2.95, 4.9), lift(5.58, 7.8), lift(11.8, 16.4), lift(26.2, 29.4));
};

// ------------------------------------------------------------------ the arm
const SEAT0: V3 = [0, PACK_SEAT5[0], PACK_SEAT5[2] + PLAT_H];
const S = (dx: number, dy: number, dz: number): V3 => add3(SEAT0, [dx, dy, dz]);
const INIT: V3 = S(-26, -26, 100);
const HA = (dz = 0): V3 => add3(HOLD_A, [0, 0, dz]);
const HB = (dz = 0): V3 => add3(HOLD_B, [0, 0, dz]);
export const HOOK5: K3[] = [
  {t: -2.5, p: S(0, -10, 110), stop: true},
  {t: 0.0, p: S(0, -6, 14)},
  {t: 0.35, p: S(0, -5, 4.4)},
  {t: 0.55, p: S(1.4, -4.6, 3.9)},
  {t: 0.75, p: S(0, -4.5, 3.4), stop: true},
  {t: 0.9, p: S(0, 0, 0.3)},
  {t: 0.98, p: S(0, 0, 0), stop: true},
  {t: 1.03, p: S(0, 0, 0), stop: true},
  {t: 1.2, p: S(0, 0, 0), stop: true},
  {t: 1.7, p: S(0, -12, 60)},
  {t: 2.5, p: INIT, stop: true},
];
const ARMK5: K3[] = [
  ...HOOK5.filter((k) => k.t >= 0),
  {t: 4.3, p: INIT, stop: true},
  {t: 4.48, p: HA(8)},
  {t: 4.52, p: HA(), stop: true},
  {t: 4.56, p: HA(), stop: true},
  {t: 4.68, p: HA(30)},
  {t: 4.9, p: S(-4, -4, 92), stop: true},
  {t: 5.0, p: S(-4, -4, 92), stop: true},
  {t: 5.2, p: S(0, -6, 22)},
  {t: 5.3, p: S(0, -4.5, 3.4)},
  {t: 5.4, p: S(0, 0, 0.3)},
  {t: 5.44, p: S(0, 0, 0), stop: true},
  {t: 5.47, p: S(0, 0, 0), stop: true},
  {t: 5.56, p: S(0, 0, 0), stop: true},
  {t: 5.85, p: S(0, -12, 60)},
  {t: 6.35, p: HB(40)},
  {t: 6.95, p: HB(6)},
  {t: 7.12, p: HB(), stop: true},
  {t: 7.3, p: HB(), stop: true},
  {t: 7.75, p: HB(36)},
  {t: 8.6, p: S(0, -9, 28)},
  {t: 9.25, p: S(0, -5, 4.2), stop: true},
  {t: 9.75, p: S(0, 0, 0.3)},
  {t: 9.98, p: S(0, 0, 0), stop: true},
  {t: 10.17, p: S(0, 0, 0), stop: true},
  {t: 10.36, p: S(0, 0, 0), stop: true},
  {t: 11.0, p: S(0, -12, 72)},
  {t: 12.0, p: INIT, stop: true},
  {t: 21.0, p: INIT, stop: true},
  {t: 21.8, p: HA(6)},
  {t: 21.95, p: HA(), stop: true},
  {t: 22.1, p: HA(), stop: true},
  {t: 22.5, p: HA(30)},
  {t: 23.6, p: S(0, -6, 22)},
  {t: 24.4, p: S(0, -4.5, 3.4), stop: true},
  {t: 24.9, p: S(0, 0, 0.3)},
  {t: 25.1, p: S(0, 0, 0), stop: true},
  {t: 25.2, p: S(0, 0, 0), stop: true},
  {t: 25.35, p: S(0, 0, 0), stop: true},
  {t: 25.9, p: S(0, -12, 60)},
  {t: 27.0, p: INIT, stop: true},
  {t: 27.3, p: INIT, stop: true},
  {t: 27.65, p: HB(8)},
  {t: 27.95, p: HB(), stop: true},
  {t: 28.05, p: HB(), stop: true},
  {t: 28.3, p: HB(30)},
  {t: DUR - 2.5, p: S(0, -10, 110), stop: true},
];
const openAt5 = (t: number) => {
  const o = (a: number, b: number, c: number, d: number) => ss(t, a, b) * (1 - ss(t, c, d));
  return 2.4 * Math.max(o(1.05, 1.17, 4.46, 4.54), o(5.48, 5.56, 7.1, 7.18), o(10.2, 10.33, 21.92, 22.0), o(25.22, 25.35, 27.9, 27.98));
};
export const heldPack5 = (t: number): number | null => {
  if (t < 1.03) return 0;
  if (t >= 4.54 && t < 5.47) return 1;
  if (t >= 7.18 && t < 10.17) return 2;
  if (t >= 22.0 && t < 25.2) return 3;
  if (t >= 27.98) return LOOP_K5;
  return null;
};
/** the insect at the station that the arm works on at t (its live seat is the placement target) */
const workBug = (t: number): Bug5 | null => {
  for (const k of [LOOP_K5, 0, 1, 2, 3]) {
    const b = bugAt5(k, t);
    if (b && b.onSled && Math.abs(sledX5(t)) < 1e-6) return b;
  }
  return null;
};
export type ArmState5 = {arm: Arm3; held: number | null};
export const armAt5 = (t: number): ArmState5 => {
  const pre = t > DUR - 2.5;
  const key = pre ? key3(t - DUR, HOOK5) : t < 2.5 ? key3(t, HOOK5) : key3(t, ARMK5);
  // near the seat: follow the live seat (the press, the latch kick) so the module lands exactly on it
  const wb = workBug(t);
  const dSeat = len3(sub3(key, SEAT0));
  const wS = 1 - ss(dSeat, 6, 30);
  let tcp = key;
  if (wb && wS > 0) {
    const live = toW(seat5(wb.st.body), [0, 0, 0]);
    tcp = add3(key, [0, 0, 0].map((_, i) => wS * (live[i] - SEAT0[i])) as V3);
  }
  // level the gripper near any seat (station or holder), so the fingers close square on the tab
  const dHold = Math.min(len3(sub3(key, HOLD_A)), len3(sub3(key, HOLD_B)));
  const level = Math.max(wS, 1 - ss(dHold, 6, 40));
  return {arm: {tcp, yaw: 90, open: pre ? 0 : openAt5(t), tilt: 14 * (1 - level)}, held: heldPack5(t)};
};
/** the holder's two seats (see the report: refills happen only while the holder is out of frame) */
export const holderA5 = (t: number) => t < 4.54 || (t >= 18.0 && t < 22.0) || t >= 24.0;
export const holderB5 = (t: number) => (t >= 3.0 && t < 7.18) || (t >= 24.0 && t < 27.98);
export const HOLD_SEATS = {A: HOLD_A, B: HOLD_B};
