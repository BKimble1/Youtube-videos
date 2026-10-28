// V2 flight models. As in V1 the body leads and the board follows (attitude = a lagged response to the rider's
// centre-of-mass shifts, plus any disturbance), but V2 also integrates what the tilt does: a tilted thrust vector
// accelerates the board sideways or forward, drag slows it, so every lean has a visible consequence in where the
// board goes. Positions are integrated once at 120 Hz into tables (pure functions of time, computed lazily).
// Bodies balance through the whole chain: the hips lead (hipLead), the shoulders counter-lean, the arms counterbalance
// (bal), the head holds the horizon (level).
import {noise1} from '../dc/math';
import {POSE0, PilotPose} from '../art/rig';
import {frameYPR, v3} from '../eng/v3';
import {FlightState, lag, sstep} from '../story/flight';
import {gcx} from '../env/Gorge';
import {RIVER} from '../env/River';

export const REST = 0.125;
const G = 9.81;
const pose = (o: Partial<PilotPose>): PilotPose => ({...POSE0, hipLead: 0.55, level: 0.8, ...o});
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** integrate a planar motion driven by tilt: accel along the board's nose (from pitch) and toe axis (from roll) */
type Sim = {t0: number; dt: number; f: number[]; s: number[]};
const simulate = (t0: number, t1: number, pitch: (t: number) => number, roll: (t: number) => number, drag = 1.1, gain = 0.55): Sim => {
  const dt = 1 / 120;
  const n = Math.ceil((t1 - t0) / dt) + 2;
  const f = [0], s = [0];
  let vf = 0, vs = 0;
  for (let i = 1; i < n; i++) {
    const t = t0 + i * dt;
    const af = G * Math.sin((-pitch(t) * Math.PI) / 180) * gain - drag * vf;
    const as = G * Math.sin((roll(t) * Math.PI) / 180) * gain - drag * vs;
    vf += af * dt;
    vs += as * dt;
    f.push(f[i - 1] + vf * dt);
    s.push(s[i - 1] + vs * dt);
  }
  return {t0, dt, f, s};
};
const at = (sim: Sim, arr: number[], t: number) => {
  const x = (t - sim.t0) / sim.dt;
  if (x <= 0) return arr[0];
  const i = Math.min(arr.length - 2, Math.floor(x));
  const u = Math.min(1, x - i);
  return arr[i] + (arr[i + 1] - arr[i]) * u;
};
const memo = <T,>(fn: () => T) => {
  let v: T | undefined;
  return () => (v ??= fn());
};

// ------------------------------------------------------------------ the hook crossing (also the mechanism and the ending)
const HK = {z0: 250, v: 10};
const hkX = (tau: number) => 1.6 * Math.sin(tau * 0.4);
const hkAlt = (tau: number) => 2.8 + 3.4 * sstep(1.5, 2.9, tau) - 3.0 * sstep(3.8, 5.8, tau) + 2.2 * (1 - sstep(-3.6, -0.6, tau)) + 0.1 * Math.sin(tau * 1.3);
// the small stabilisation correction at 0.3-0.8 s: the hips go to the toes, the deck answers with a lag, then back
const hkSide = (tau: number) => 0.022 * noise1(tau * 1.05, 9) + 0.06 * (sstep(0.22, 0.48, tau) - sstep(0.55, 0.9, tau)) - 0.045 * (sstep(-2.3, -1.8, tau) - sstep(-1.3, -0.7, tau));
const hkLean = (tau: number) => 0.075 + 0.02 * noise1(tau * 0.85, 3) + 0.03 * sstep(1.4, 1.9, tau) * (1 - sstep(2.6, 3.2, tau));
export const hookFlight = (tau: number): FlightState => {
  const x = hkX(tau), z = HK.z0 + HK.v * tau;
  const dx = (hkX(tau + 0.05) - hkX(tau - 0.05)) / 0.1;
  const yaw = (Math.atan2(dx, HK.v) * 180) / Math.PI;
  const ddx = (hkX(tau + 0.1) - 2 * hkX(tau) + hkX(tau - 0.1)) / 0.01;
  const bank = -ddx * 0.9;
  const pitch = -lag(hkLean, tau) * 75 - 2;
  const roll = lag(hkSide, tau) * 95 + bank;
  const alt = hkAlt(tau);
  const B = frameYPR(v3(x, alt, z), yaw, pitch, roll);
  const climb = sstep(1.4, 1.8, tau) * (1 - sstep(2.5, 3.2, tau));
  const sd = hkSide(tau);
  return {
    B, alt, speed: HK.v, pitch, roll, yaw, thrust: 0.62 + 0.3 * climb, pos: v3(x, alt, z),
    pose: pose({
      lean: hkLean(tau), side: sd, crouch: 0.48 + 0.05 * noise1(tau * 0.7, 4) + 0.14 * climb, twist: 24 + 4 * noise1(tau * 0.5, 5), bend: 12 + 5 * climb,
      look: 66 + 6 * noise1(tau * 0.4, 6), nod: 8 + 6 * climb, armF: 0.45 + 0.1 * noise1(tau * 1.1, 7), armFs: 0.85 + 0.12 * noise1(tau * 0.9, 8),
      armR: 0.22 + 0.06 * noise1(tau * 0.8, 10), thumb: 0.45 + 0.25 * climb, bal: clamp(-sd * 14, -1, 1),
    }),
  };
};

// ------------------------------------------------------------------ the lift demonstration (field)
export const liftDemo2 = (t: number, T0: number) => {
  const s = t - T0;
  const up = sstep(0.4, 1.9, s);
  const alt = REST + 1.4 * up + 0.04 * Math.sin(s * 2.4) * up;
  const lean = (u: number) => 0.01 + 0.06 * sstep(1.9, 2.3, u - T0);
  const side = (u: number) => 0.014 * noise1(u * 1.2, 21) * sstep(0.6, 1.0, u - T0);
  const pitch = up > 0.02 ? -lag(lean, t) * 75 : 0;
  const roll = up > 0.02 ? lag(side, t) * 95 : 0;
  const fwd = up > 0.02 ? Math.max(0, s - 1.9) ** 2 * 0.9 : 0;
  const B = frameYPR(v3(0, alt, fwd), 0, pitch, roll);
  const lift = sstep(0.4, 0.75, s) * (1 - sstep(1.0, 1.6, s));
  return {
    B, alt, speed: 0, pitch, roll, yaw: 0, thrust: 0.25 + 0.7 * sstep(0.0, 0.45, s), pos: B.o, rps: 6 + 26 * sstep(0, 0.45, s), leafT0: T0 + 0.08,
    pose: pose({
      lean: lean(t), side: side(t), crouch: 0.32 + 0.26 * lift + 0.05 * noise1(t * 0.8, 22), bend: 8 + 8 * lift, twist: 20, look: 52 + 12 * up, nod: 20 - 12 * up,
      armF: 0.3 + 0.3 * up, armFs: 0.55 + 0.35 * lift, armR: 0.3 + 0.2 * lift, thumb: 0.3 + 0.5 * sstep(0.1, 0.6, s), bal: 0.4 * lift * Math.sin(s * 7),
    }),
  };
};

// ------------------------------------------------------------------ the balance problem (field; board yawed 90 deg as on the bench)
export type ProblemK = {lift: number; huge: number; theBoard: number; body: number; end: number};
export const problemFlight = (K: ProblemK) => {
  // the deck pitches nose-down by itself (nothing balances it); the hips go back to stop it; that hip move rolls the
  // deck, the board slides sideways; a second correction; a drift; the whole body brings it level on "BODY"
  const lean = (u: number) => -0.075 * sstep(K.huge + 0.2, K.huge + 0.55, u) * (1 - sstep(K.huge + 0.95, K.huge + 1.45, u)) + 0.012 * noise1(u * 1.3, 32) + 0.03 * sstep(K.body - 1.2, K.body - 0.6, u) * (1 - sstep(K.body, K.body + 0.4, u));
  const side = (u: number) =>
    0.07 * sstep(K.huge + 0.55, K.huge + 0.9, u) - 0.13 * sstep(K.theBoard - 0.05, K.theBoard + 0.4, u) + 0.1 * sstep(K.theBoard + 0.75, K.theBoard + 1.1, u)
    - 0.07 * sstep(K.theBoard + 1.55, K.theBoard + 1.9, u) + 0.06 * sstep(K.body - 1.4, K.body - 0.9, u) - 0.06 * sstep(K.body - 0.2, K.body + 0.25, u) + 0.012 * noise1(u * 1.6, 31);
  const dPitch = (u: number) => -9 * sstep(K.huge - 0.05, K.huge + 0.35, u) * (1 - sstep(K.huge + 0.6, K.huge + 1.3, u));
  const dRoll = (u: number) => 5 * sstep(K.theBoard + 0.2, K.theBoard + 0.5, u) * (1 - sstep(K.theBoard + 0.8, K.theBoard + 1.4, u));
  const pitch = (u: number) => (u < K.lift ? 0 : -lag(lean, u) * 75 + dPitch(u));
  const roll = (u: number) => (u < K.lift ? 0 : lag(side, u) * 95 + dRoll(u));
  const sim = memo(() => simulate(K.lift, K.end + 0.5, pitch, roll, 1.0, 0.6));
  return (t: number): FlightState & {rps: number; unsteady: number} => {
    const S = sim();
    const up = sstep(K.lift, K.lift + 0.7, t);
    const alt = REST + 0.85 * up + 0.05 * Math.sin(t * 1.9) * up;
    const f = at(S, S.f, t), sd = at(S, S.s, t);
    // yaw 90: nose -> world +x, toe side -> world -z
    const B = frameYPR(v3(f, alt, -sd), 90, pitch(t), roll(t));
    const unsteady = Math.min(1, (Math.abs(pitch(t)) + Math.abs(roll(t))) / 7);
    const work = sstep(K.huge + 0.15, K.huge + 0.5, t) * (1 - sstep(K.body + 0.1, K.body + 0.6, t));
    const sv = side(t);
    return {
      B, alt, speed: 0, pitch: pitch(t), roll: roll(t), yaw: 90, thrust: 0.2 + 0.75 * sstep(K.lift - 0.5, K.lift + 0.1, t), pos: B.o, rps: 4 + 28 * sstep(K.lift - 0.5, K.lift + 0.1, t), unsteady,
      pose: pose({
        lean: lean(t), side: sv, crouch: 0.36 + 0.26 * work + 0.12 * Math.abs(sv) * 6, bend: 8 + 10 * work, twist: 18, look: 46 + 12 * up, nod: 22 - 6 * up,
        armF: 0.35 + 0.4 * work, armFs: 0.5 + 0.5 * work, armR: 0.25 + 0.3 * work, thumb: 0.3 + 0.4 * up, bal: clamp(-sv * 11 + lean(t) * 6, -1, 1), hipLead: 0.75,
      }),
    };
  };
};

// ------------------------------------------------------------------ the AI coach (field, near the two tripod phones)
export type CoachK = {start: number; cue: number; fix: number; done: number; end: number};
export const coachFlight = (K: CoachK) => {
  const side = (u: number) => 0.045 * Math.sin((u - K.start) * 3.1) * (1 - sstep(K.fix, K.fix + 0.45, u)) + 0.075 * sstep(K.fix - 0.05, K.fix + 0.2, u) * (1 - sstep(K.fix + 0.3, K.fix + 0.7, u)) + 0.006 * noise1(u * 1.3, 51);
  const lean = (u: number) => 0.02 * Math.sin((u - K.start) * 2.3 + 1) * (1 - sstep(K.fix, K.fix + 0.4, u)) + 0.07 * sstep(K.done, K.done + 0.4, u) + 0.005 * noise1(u, 52);
  const pitch = (u: number) => -lag(lean, u) * 75;
  const roll = (u: number) => lag(side, u) * 95;
  const sim = memo(() => simulate(K.start - 0.4, K.end + 0.5, pitch, roll, 1.4, 0.4));
  return (t: number): FlightState & {rps: number; unsteady: number; pulse: number; listen: number} => {
    const S = sim();
    const f = at(S, S.f, t), sd = at(S, S.s, t);
    const alt = 1.1 + 0.04 * Math.sin(t * 1.7);
    const B = frameYPR(v3(1.0 + f, alt, -0.5 - sd), 90, pitch(t), roll(t));
    const unsteady = Math.min(1, (Math.abs(pitch(t)) + Math.abs(roll(t))) / 5);
    const pulse = Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - K.cue) / 0.45)) * Math.PI));
    const listen = sstep(K.cue + 0.05, K.cue + 0.3, t) * (1 - sstep(K.fix + 0.1, K.fix + 0.5, t));
    const fixK = sstep(K.fix - 0.05, K.fix + 0.3, t) * (1 - sstep(K.fix + 0.6, K.fix + 1.0, t));
    const sv = side(t);
    return {
      B, alt, speed: 0, pitch: pitch(t), roll: roll(t), yaw: 90, thrust: 0.78, pos: B.o, rps: 30, unsteady, pulse, listen,
      pose: pose({
        lean: lean(t), side: sv, crouch: 0.4 + 0.24 * fixK, bend: 10 + 8 * fixK, twist: 22, look: 50 - 18 * listen, nod: 12 + 6 * listen,
        armF: 0.4 + 0.3 * fixK, armFs: 0.7 + 0.25 * fixK, armR: 0.25, thumb: 0.45, bal: clamp(-sv * 12, -1, 1), listen,
      }),
    };
  };
};

// ------------------------------------------------------------------ the practice montage
/** a) an early session: low, wobbly, arms wide (field) */
export const earlyHover = (t: number) => {
  const wob = (u: number) => 0.075 * noise1(u * 2.2, 61) + 0.03 * Math.sin(u * 5.1);
  const roll = lag(wob, t, 0.25, 0.06) * 120;
  const pitch = 5 * noise1(t * 1.8, 62);
  const B = frameYPR(v3(0.3 * noise1(t * 0.7, 63), 0.42 + 0.06 * noise1(t * 2, 64), 0.3 * noise1(t * 0.6, 65)), 90, pitch, roll);
  return {B, alt: B.o.y, speed: 0, pitch, roll, yaw: 90, thrust: 0.8, pos: B.o, rps: 30, pose: pose({side: wob(t), crouch: 0.66, bend: 18, armF: 0.85, armFs: 1.0, armR: 0.6, look: 40, nod: 26, bal: clamp(-wob(t) * 11, -1, 1), hipLead: 0.6})};
};
/** b) later: a controlled low pass across the field */
export const lowPass = (t: number, T0: number) => {
  const s = t - T0;
  const B = frameYPR(v3(-6 + 4.2 * s, 0.95 + 0.05 * Math.sin(s * 2), 2.0), 90, -6, 2 * noise1(t, 66));
  return {B, alt: B.o.y, speed: 4.2, pitch: -6, roll: 0, yaw: 90, thrust: 0.8, pos: B.o, rps: 30, pose: pose({lean: 0.08, side: 0.015 * noise1(t * 1.4, 67), crouch: 0.48, bend: 12, armF: 0.5, armFs: 0.8, look: 70, nod: 10})};
};
/** c) a smooth sustained glide low over the river near the bank */
export const glide = (t: number, T0: number) => {
  const s = t - T0;
  const B = frameYPR(v3(-300 + 9 * s, 2.0 + 0.1 * Math.sin(s * 1.5), 26 + 1.2 * Math.sin(s * 0.8)), 90, -7, 4);
  return {B, alt: B.o.y, speed: 9, pitch: -7, roll: 4, yaw: 90, thrust: 0.7, pos: B.o, rps: 30, pose: pose({lean: 0.09, side: 0.02, crouch: 0.42, bend: 11, armF: 0.42, armFs: 0.8, look: 72, nod: 8})};
};

// ------------------------------------------------------------------ the payoff: across the last of the river and into the gorge
export const GORGE = {ox: 600, oz: RIVER.far};
export const payoffFlight = (t: number, T0: number, Tin: number): FlightState => {
  // reaches the gorge mouth (z = far) at Tin, at 12 m/s
  const v = 12;
  const zz = (u: number) => GORGE.oz + v * (u - Tin);
  const xx = (u: number) => {
    const z = zz(u);
    const g = GORGE.ox + gcx(Math.max(0, z - GORGE.oz));
    // over open water the line eases onto the gorge's centreline from a little to the west
    return z < GORGE.oz ? g - 0.02 * (GORGE.oz - z) ** 1.3 : g;
  };
  const x = xx(t), z = zz(t);
  const dx = (xx(t + 0.05) - xx(t - 0.05)) / 0.1;
  const yaw = (Math.atan2(dx, v) * 180) / Math.PI;
  const ddx = (xx(t + 0.1) - 2 * x + xx(t - 0.1)) / 0.01;
  const bank = clamp(-ddx * 1.6, -16, 16);
  const alt = 8 + 7 * sstep(Tin - 0.5, Tin + 0.8, t) + 0.15 * Math.sin(t * 1.4);
  const lean = (u: number) => 0.09 + 0.02 * noise1(u * 0.9, 71);
  const side = (u: number) => 0.02 * noise1(u * 1.1, 72);
  const pitch = -lag(lean, t) * 75;
  const roll = lag(side, t) * 95 + bank;
  const B = frameYPR(v3(x, alt, z), yaw, pitch, roll);
  const sd = side(t) - bank / 300;
  void T0;
  return {B, alt, speed: v, pitch, roll, yaw, thrust: 0.85, pos: B.o, pose: pose({lean: lean(t), side: sd, crouch: 0.46, bend: 13, armF: 0.5, armFs: 0.9, look: 70, nod: 8, bal: clamp(-sd * 12, -1, 1)})};
};

/** the workshop: the inventor standing at a safe distance with the test remote */
export const inventorPose = (react: number, flinch: number): PilotPose =>
  pose({lean: -0.05 * react, side: -0.06 * react, crouch: 0.12 + 0.2 * react, bend: 2 - 6 * react, twist: 30, look: 10 + 6 * react, nod: 8 - 6 * react, armF: 0.2 + 0.6 * flinch, armFs: 0.3 + 0.4 * flinch, armR: 0.2, remote: 1 - 0.4 * flinch, thumb: 0.5, bal: 0.5 * flinch, level: 1, hipLead: 0.3});
