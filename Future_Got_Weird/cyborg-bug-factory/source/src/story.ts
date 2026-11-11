// The lab story as one schedule (seconds of film time). Everything in the assembly cell is a function of t: the
// conveyor index, the tray, the arm, each carrier's clamps, each insect (sedated, fitted, waking, walking) and each
// backpack. The hook (cycle 0), the 68-second time-lapse (cycle 1), the attach-and-steer close-ups (cycle 2), the
// factory overhead (cycle 3) and the loop (cycle 4, which at the end of the film is in exactly the state cycle 0 is in
// at frame 0) all play the same mechanism, so nothing is redrawn between shots.
import {add3, V3} from './core/three';
import {toW} from './core/frame';
import {DUR, clamp, ss, ring, noise1, keyS} from './lib';
import {ArmState} from './kit/arm';
import {PackState, seatFrame} from './kit/backpack';
import {CARRIER_PITCH, TRAY_SLOTS} from './kit/lab';
import {blendLegs, frameOf, Path, standState, walkState} from './roach/gait';
import {PACK_SEAT, RoachState} from './roach/rig';

// ------------------------------------------------------------------ keyed curves (Catmull-Rom Hermite; 'stop' keys)
export type K3 = {t: number; p: V3; stop?: boolean};
const herm = (p0: number, p1: number, m0: number, m1: number, h: number, u: number) => {
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * h * m1;
};
export const key3 = (t: number, K: K3[]): V3 => {
  if (t <= K[0].t) return K[0].p;
  const n = K.length;
  if (t >= K[n - 1].t) return K[n - 1].p;
  let i = 0;
  while (K[i + 1].t < t) i++;
  const a = K[i], b = K[i + 1];
  const h = b.t - a.t;
  const tan = (j: number): V3 => {
    const k = K[j];
    if (k.stop || j === 0 || j === n - 1) return [0, 0, 0];
    const p = K[j - 1], q = K[j + 1];
    return [0, 1, 2].map((c) => (q.p[c] - p.p[c]) / (q.t - p.t)) as V3;
  };
  const m0 = tan(i), m1 = tan(i + 1);
  const u = (t - a.t) / h;
  return [0, 1, 2].map((c) => herm(a.p[c], b.p[c], m0[c], m1[c], h, u)) as V3;
};

// ------------------------------------------------------------------ the conveyor
/** continuous conveyor index: carrier k is at the station when idx = k */
export const convIdx = (t: number) => ss(t, 4.3, 4.58) + ss(t, 6.02, 6.36) + ss(t, 20.62, 20.86) + ss(t, 21.62, 21.9);
export const LOOP_K = 4; // the carrier at the station at the end (plays carrier 0's frame-0 state)
export const carrierX = (k: number, t: number) => (convIdx(t) - k) * CARRIER_PITCH;

// ------------------------------------------------------------------ cycles
/** per carrier: when its insect is fitted (snap), wakes, is released and starts walking; null = still waiting */
export type Cycle = {snap: number; led: number; open: number; walk: number; v: number; path: (x: number) => Path};
const fwd = (turn: number, r = 130, x = 0): Path => ({p0: [x, 0, 0], yaw0: 90, segs: [{len: 70}, {len: 110, turn}, {len: 120}, {len: 2 * Math.PI * r * 6, turn: 360 * 6 * Math.sign(turn || 1)}]});
export const CYCLES: Record<number, Cycle> = {
  0: {snap: 0.5, led: 0.82, open: 1.12, walk: 1.38, v: 42, path: () => fwd(18)},
  1: {snap: 5.48, led: 5.56, open: 5.6, walk: 5.72, v: 70, path: () => fwd(-22, 160)},
  2: {snap: 10.17, led: 10.62, open: 10.98, walk: 11.3, v: 40, path: () => ({p0: [0, 0, 0], yaw0: 90, segs: [{len: 56}, {len: 22, turn: 6}, {len: 56, turn: 72}, {len: 140}, {len: 2 * Math.PI * 140 * 6, turn: 2160}]})},
  3: {snap: 21.12, led: 21.16, open: 21.2, walk: 21.26, v: 95, path: () => fwd(30, 100)},
};
/** a cycle's walk travel at time t (the arm-free walk; eases in over the first 0.3 s) */
const travel = (c: Cycle, t: number) => {
  const d = t - c.walk;
  if (d <= 0) return 0;
  return c.v * (d < 0.3 ? (d * d) / 0.6 : d - 0.15);
};

/** the sedated pose: legs a little spread, antennae lowered, slow breathing */
const sedated = (x: number, t: number, k: number): RoachState => standState({p: [x, 0, 0], yaw: 90}, {
  antTw: [6 + 2 * noise1(t * 0.6, k), 6 + 2 * noise1(t * 0.6, k + 9)], antLift: [-14, -14], headPitch: 6, breathe: 0.5 + 0.5 * Math.sin(t * 2.2 + k),
}, undefined, 1.06);

export type Bug = {k: number; st: RoachState; pack: PackState | null; fitted: boolean};
/** the insect on carrier k at time t */
export const bugAt = (k: number, t: number): Bug => {
  const x = carrierX(k, t);
  const loop = k === LOOP_K;
  const kk = loop ? 0 : k;
  const tt = loop ? t - DUR : t; // the loop carrier plays carrier 0's pre-roll
  const C = CYCLES[kk];
  // the press of the arm squashes the insect a little just before the snap
  const press = C ? -0.7 * ss(tt, C.snap - 0.14, C.snap - 0.07) * (1 - ss(tt, C.snap - 0.04, C.snap + 0.06)) : 0;
  if (!C || loop || tt < C.snap) {
    const st = sedated(x, tt, kk);
    if (press) st.body = frameOf({p: [x, 0, 0], yaw: 90}, press);
    return {k, st: press ? standState({p: [x, 0, 0], yaw: 90}, {...st, body: st.body}, undefined, 1.06) : st, pack: null, fitted: false};
  }
  const breathe = 0.5 + 0.5 * Math.sin(tt * 2.2 + kk);
  // waking: legs twitch, antennae lift and flick
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
  const F = seatFrame(st.body, PACK_SEAT);
  const pack: PackState = {F, led: ss(tt, C.led, C.led + 0.08) * (0.8 + 0.2 * Math.sin(tt * 9)), hook: ss(tt, C.snap - 0.08, C.snap)};
  return {k, st, pack, fitted: true};
};

// ------------------------------------------------------------------ cyborgs fitted before the film, in the arena
const AMB: {p0: V3; yaw0: number; r: number; v: number; s0: number}[] = [
  {p0: [-150, 260, 0], yaw0: 20, r: 90, v: 34, s0: 0},
  {p0: [120, 330, 0], yaw0: 200, r: 120, v: 30, s0: 140},
  {p0: [-40, 430, 0], yaw0: -30, r: 70, v: 38, s0: 60},
];
export const ambientBugs = (t: number) => AMB.map((a, i) => {
  const P: Path = {p0: a.p0, yaw0: a.yaw0, segs: [{len: 2 * Math.PI * a.r * 20, turn: (i % 2 ? -360 : 360) * 20}]};
  const tt = ((t % DUR) + DUR) % DUR; // keeps the loop exact
  const st = walkState(P, a.s0 + a.v * tt, {antTw: [16, 16], antLift: [10, 10], headPitch: -2, breathe: 0.5});
  return {st, pack: {F: seatFrame(st.body, PACK_SEAT), led: 0.85, hook: 1} as PackState};
});

// ------------------------------------------------------------------ the arm
const SEAT: V3 = add3([0, 0, 0], [0, PACK_SEAT[0], PACK_SEAT[2]]); // station seat (roach facing +y)
const HOME: V3 = [58, 40, 150];
const S = (dx: number, dy: number, dz: number): V3 => add3(SEAT, [dx, dy, dz]);
const slot = (i: number, dz = 0): V3 => add3(TRAY_SLOTS[i], [0, 0, dz]);
/** the hook descent, in hook time tau (frame 0 = tau 0; the end of the film plays tau -0.7 .. 0) */
const HOOK: K3[] = [
  {t: -0.7, p: S(0, -9, 82), stop: true},
  {t: 0.0, p: S(0, -6, 26)},
  {t: 0.2, p: S(0, -4.5, 3.4)},
  {t: 0.33, p: S(0, 0, 0.3)},
  {t: 0.42, p: S(0, 0, -0.6), stop: true},
  {t: 0.5, p: S(0, 0, 0), stop: true},
  {t: 0.64, p: S(0, 0, 0), stop: true},
  {t: 1.2, p: S(0, -12, 72)},
  {t: 2.6, p: HOME, stop: true},
];
/** the whole arm schedule (film time) */
const ARMK: K3[] = [
  ...HOOK.filter((k) => k.t >= 0),
  {t: 4.36, p: HOME},
  {t: 4.6, p: slot(0, 30)},
  {t: 4.72, p: slot(0), stop: true},
  {t: 4.8, p: slot(0), stop: true},
  {t: 4.96, p: slot(0, 34)},
  {t: 5.22, p: S(0, -6, 22)},
  {t: 5.33, p: S(0, -4.5, 3.4)},
  {t: 5.41, p: S(0, 0, 0.3)},
  {t: 5.45, p: S(0, 0, -0.6), stop: true},
  {t: 5.49, p: S(0, 0, 0), stop: true},
  {t: 5.58, p: S(0, 0, 0), stop: true},
  {t: 5.85, p: S(0, -12, 60)},
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
  // the factory overhead (cycle 3), fast
  {t: 20.3, p: HOME},
  {t: 20.5, p: slot(2, 6)},
  {t: 20.58, p: slot(2), stop: true},
  {t: 20.74, p: slot(2, 30)},
  {t: 20.96, p: S(0, -6, 22)},
  {t: 21.05, p: S(0, 0, 0.3)},
  {t: 21.12, p: S(0, 0, 0), stop: true},
  {t: 21.2, p: S(0, 0, 0), stop: true},
  {t: 21.5, p: S(0, -12, 60)},
  {t: 22.4, p: HOME, stop: true},
  // the loop: pick a fresh pack, then carry it over the station into the hook's pre-roll
  {t: 26.9, p: HOME},
  {t: 27.45, p: slot(0, 6)},
  {t: 27.62, p: slot(0), stop: true},
  {t: 27.8, p: slot(0), stop: true},
  {t: 28.4, p: slot(0, 60)},
  {t: 29.7, p: S(0, -10, 128)},
  {t: DUR - 0.7, p: S(0, -9, 82), stop: true},
];
/** gripper opening (mm beyond the board edge) */
const openAt = (t: number) => {
  const o = (a: number, b: number, c: number, d: number) => ss(t, a, b) * (1 - ss(t, c, d)); // open over a..b, close over c..d
  return 2.6 * Math.max(
    ss(t, 0.5, 0.62) * (1 - ss(t, 4.66, 4.76)), // released R0 (hook), closes on pack 1
    o(5.49, 5.58, 6.9, 7.2), // released R1, closes on pack 2 ("grabs")
    o(10.17, 10.33, 20.5, 20.57),
    o(21.12, 21.2, 27.5, 27.62),
  );
};
/** which pack the gripper holds: 'k' = the pack for carrier k */
const heldPack = (t: number): number | null => {
  if (t < 0.5) return 0;
  if (t >= 4.76 && t < 5.49) return 1;
  if (t >= 7.18 && t < 10.17) return 2;
  if (t >= 20.57 && t < 21.12) return 3;
  if (t >= 27.6) return LOOP_K;
  return null;
};
export const armAt = (t: number): {arm: ArmState; held: number | null} => {
  const loopPre = t > DUR - 0.7;
  const tcp = loopPre ? key3(t - DUR, HOOK) : t < 1.2 ? key3(t, HOOK) : key3(t, ARMK);
  // the end of the schedule hands over to the hook pre-roll with matched velocity
  return {arm: {tcp, yaw: 90, open: loopPre ? 0 : openAt(t)}, held: heldPack(t)};
};
/** tray slot occupancy */
export const trayFull = (i: number, t: number) => {
  if (i === 0) return t < 4.76 || (t > 15 && t < 27.62);
  if (i === 1) return t < 7.18 || t > 15;
  return t < 20.57 || t > 23;
};
export {clamp, keyS, toW};
