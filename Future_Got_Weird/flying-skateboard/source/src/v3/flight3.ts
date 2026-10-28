// V3 flight models. As in V2 the body leads and the board follows: the board's pitch and roll are a lagged response to
// the rider's centre-of-mass shifts (plus any disturbance), and where the board is free to move a tilted thrust vector
// accelerates it (integrated at 120 Hz into tables). Every state also carries the board's world velocity, which the
// air jets and the surface wash use (the jets sweep back in forward flight; the wash lags behind the board).
import {noise1} from '../dc/math';
import {POSE0, PilotPose} from '../art/rig';
import {frameYPR, V3, v3} from '../eng/v3';
import {gcx} from '../env/Gorge';
import {RIVER} from '../env/River';
import {FlightState, lag, sstep} from '../story/flight';

export const REST = 0.125;
const G = 9.81;
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const pose = (o: Partial<PilotPose>): PilotPose => ({...POSE0, hipLead: 0.6, level: 0.8, ...o});
export type St = FlightState & {vel: V3; rps: number; unsteady?: number; pulse?: number; listen?: number};

const memo = <T,>(fn: () => T) => {
  let v: T | undefined;
  return () => (v ??= fn());
};
type Sim = {t0: number; dt: number; f: number[]; s: number[]; vf: number[]; vs: number[]};
/** forward (along the nose) and sideways (toward the toes) motion from the board's tilt */
const simulate = (t0: number, t1: number, pitch: (t: number) => number, roll: (t: number) => number, k: {gf: number; df: number; gs: number; ds: number}): Sim => {
  const dt = 1 / 120;
  const n = Math.ceil((t1 - t0) / dt) + 2;
  const f = [0], s = [0], vfa = [0], vsa = [0];
  let vf = 0, vs = 0;
  for (let i = 1; i < n; i++) {
    const t = t0 + i * dt;
    vf += (G * Math.sin((-pitch(t) * Math.PI) / 180) * k.gf - k.df * vf) * dt;
    vs += (G * Math.sin((roll(t) * Math.PI) / 180) * k.gs - k.ds * vs) * dt;
    f.push(f[i - 1] + vf * dt);
    s.push(s[i - 1] + vs * dt);
    vfa.push(vf);
    vsa.push(vs);
  }
  return {t0, dt, f, s, vf: vfa, vs: vsa};
};
const at = (sim: Sim, arr: number[], t: number) => {
  const x = (t - sim.t0) / sim.dt;
  if (x <= 0) return arr[0];
  const i = Math.min(arr.length - 2, Math.floor(x));
  const u = Math.min(1, x - i);
  return arr[i] + (arr[i + 1] - arr[i]) * u;
};
const yawOf = (dx: number, dz: number) => (Math.atan2(dx, dz) * 180) / Math.PI;

// ------------------------------------------------------------------ the hook crossing (also the ending, tau < 0)
// 11 m/s, 8-9 m above the Yangtze, 80 m out from the near bank at frame 0, heading for the far bank (+z).
export const HK3 = {z0: 80, v: 11};
const hx = (tau: number) => 1.3 * Math.sin(tau * 0.42 + 0.5);
// 8.5 m over the river; during the explanation (3.4 s on) he comes down to about 4 m, low enough that the downwash
// visibly roughens the water under him
const halt = (tau: number) => 8.5 + 0.3 * Math.sin(tau * 0.8 + 0.3) + 0.45 * sstep(1.9, 2.5, tau) * (1 - sstep(2.6, 3.8, tau)) - 4.3 * sstep(3.5, 5.0, tau);
/** weight shifts: frame 0 is mid-correction (toes, then back); a lean and its correction at 1.9-2.65; before frame 0
 *  (the ending) a gust correction while we look down past his feet, and a smaller one as the camera comes round */
const hSide = (tau: number) =>
  0.018 * noise1(tau * 1.1, 9) + 0.06 * (sstep(-0.25, 0.12, tau) - sstep(0.22, 0.55, tau))
  - 0.05 * (sstep(2.0, 2.25, tau) - sstep(2.35, 2.7, tau))
  - 0.05 * (sstep(-3.75, -3.5, tau) - sstep(-3.35, -3.0, tau)) + 0.03 * (sstep(-1.9, -1.6, tau) - sstep(-1.3, -0.95, tau));
const hLean = (tau: number) => 0.085 + 0.018 * noise1(tau * 0.85, 3) + 0.035 * (sstep(1.9, 2.15, tau) - sstep(2.4, 2.75, tau));
export const hook3 = (tau: number): St => {
  const x = hx(tau), z = HK3.z0 + HK3.v * tau;
  const dx = (hx(tau + 0.05) - hx(tau - 0.05)) / 0.1;
  const yaw = yawOf(dx, HK3.v);
  const ddx = (hx(tau + 0.1) - 2 * hx(tau) + hx(tau - 0.1)) / 0.01;
  const bank = -ddx * 1.2;
  const pitch = -lag(hLean, tau) * 75 - 2;
  const roll = lag(hSide, tau) * 95 + bank;
  const alt = halt(tau);
  const B = frameYPR(v3(x, alt, z), yaw, pitch, roll);
  const sd = hSide(tau);
  // the knees work with every correction: they flex as the weight moves and recover after it
  const work = Math.min(1, Math.abs(sd) * 14 + Math.abs(hLean(tau) - 0.085) * 12);
  return {
    B, alt, speed: HK3.v, pitch, roll, yaw, thrust: 0.7, pos: v3(x, alt, z), vel: v3(dx, 0, HK3.v), rps: 30,
    pose: pose({
      lean: hLean(tau), side: sd, crouch: 0.46 + 0.16 * work + 0.03 * noise1(tau * 0.7, 4), twist: 24 + 4 * noise1(tau * 0.5, 5), bend: 11 + 6 * work,
      look: 64 + 6 * noise1(tau * 0.4, 6), nod: 10 + 4 * work, armF: 0.45 + 0.12 * work + 0.06 * noise1(tau * 1.1, 7), armFs: 0.8 + 0.2 * work,
      armR: 0.22 + 0.06 * noise1(tau * 0.8, 10), thumb: 0.5, bal: clamp(-sd * 15, -1, 1),
    }),
  };
};

// ------------------------------------------------------------------ the lift (riverside flat), nose toward the river
export const LIFT_AT = v3(-40, 0, -26);
export const lift3 = (t: number, T0: number): St => {
  const s = t - T0;
  const up = sstep(0.62, 1.9, s);
  const alt = REST + 2.5 * up + 0.5 * sstep(1.9, 2.9, s) + 0.05 * Math.sin(s * 2.2) * up;
  const fwd = (u: number) => (u > 1.65 ? 1.7 * (u - 1.65) ** 2 : 0);
  const z = LIFT_AT.z + fwd(s);
  const lean = (u: number) => 0.01 + 0.08 * sstep(1.45, 1.9, u - T0);
  const side = (u: number) => 0.016 * noise1(u * 1.2, 21) * sstep(0.7, 1.1, u - T0);
  const pitch = up > 0.01 ? -lag(lean, t) * 75 : 0;
  const roll = up > 0.01 ? lag(side, t) * 95 : 0;
  const B = frameYPR(v3(LIFT_AT.x, alt, z), 0, pitch, roll);
  // the feet press into the deck as it pushes up under them: knees flex, then he rises tall again
  const press = sstep(0.55, 0.95, s) * (1 - sstep(1.2, 1.9, s));
  return {
    B, alt, speed: 0, pitch, roll, yaw: 0, thrust: 0.55 + 0.4 * sstep(0.1, 0.8, s), pos: B.o, vel: v3(0, (alt - REST) > 0.01 ? 1.5 : 0, (fwd(s + 0.01) - fwd(s)) / 0.01), rps: 30,
    pose: pose({
      lean: lean(t), side: side(t), crouch: 0.34 + 0.34 * press + 0.08 * up, bend: 8 + 10 * press, twist: 20, look: 48 + 18 * up, nod: 22 - 14 * up,
      armF: 0.3 + 0.25 * up + 0.15 * press, armFs: 0.55 + 0.3 * press, armR: 0.3 + 0.15 * press, thumb: 0.3 + 0.5 * sstep(0.1, 0.6, s), bal: 0.35 * press * Math.sin(s * 8),
    }),
  };
};

// ------------------------------------------------------------------ learning on the field (one continuous session)
// The board hovers over the pad, nose toward +x (yaw 90; toe side toward -z). Scenes A to D are one flight:
//   A the problem: it lifts; the nose dips by itself; the hips go back; the deck rolls; he answers again
//   B the feet: a heel-side shift, the knees bend, the deck comes back; a toe-side shift
//   C the ride: he leans and the board moves off across the field; a gust rolls it; a quick whole-body save
//   D the coach: a slow drift with a small roll error; the cue; he corrects; level
export type FieldK = {lift: number; huge: number; theBoard: number; itself: number; heHas: number; body: number; while: number; cue: number; fix: number; done: number; end: number};
export const fieldFlight = (K: FieldK) => {
  const lean = (u: number) =>
    -0.07 * sstep(K.huge + 0.2, K.huge + 0.5, u) * (1 - sstep(K.huge + 0.9, K.huge + 1.4, u))
    + 0.1 * sstep(K.heHas + 0.1, K.heHas + 0.7, u) * (1 - sstep(K.while - 0.2, K.while + 0.6, u)) + 0.03 * sstep(K.while + 0.2, K.while + 0.8, u)
    + 0.01 * noise1(u * 1.3, 32);
  const side = (u: number) =>
    0.065 * sstep(K.huge + 0.55, K.huge + 0.85, u) - 0.065 * sstep(K.theBoard - 0.2, K.theBoard + 0.15, u)
    - 0.075 * sstep(K.theBoard + 0.25, K.theBoard + 0.55, u) + 0.075 * sstep(K.theBoard + 0.9, K.theBoard + 1.25, u)
    + 0.06 * sstep(K.itself + 0.2, K.itself + 0.45, u) - 0.06 * sstep(K.itself + 0.6, K.itself + 0.9, u)
    - 0.085 * sstep(K.body - 0.62, K.body - 0.42, u) + 0.085 * sstep(K.body - 0.1, K.body + 0.25, u)
    + 0.035 * sstep(K.fix - 0.08, K.fix + 0.15, u) - 0.035 * sstep(K.fix + 0.35, K.fix + 0.75, u)
    + 0.01 * noise1(u * 1.6, 31);
  const dPitch = (u: number) => -8 * sstep(K.huge - 0.05, K.huge + 0.35, u) * (1 - sstep(K.huge + 0.6, K.huge + 1.3, u));
  // disturbances the body has to answer: a roll at "the board" (heel side), the gust in the ride, the steady roll error the coach catches
  const dRoll = (u: number) =>
    -8 * sstep(K.theBoard - 0.1, K.theBoard + 0.15, u) * (1 - sstep(K.theBoard + 0.4, K.theBoard + 0.9, u))
    + 5 * sstep(K.itself + 0.15, K.itself + 0.4, u) * (1 - sstep(K.itself + 0.55, K.itself + 0.95, u))
    + 7 * sstep(K.body - 0.75, K.body - 0.55, u) * (1 - sstep(K.body - 0.35, K.body + 0.05, u))
    - 6 * sstep(K.while, K.while + 0.6, u) * (1 - sstep(K.fix, K.fix + 0.45, u));
  const pitch = (u: number) => (u < K.lift ? 0 : -lag(lean, u) * 75 + dPitch(u));
  const roll = (u: number) => (u < K.lift ? 0 : lag(side, u) * 95 + dRoll(u));
  const sim = memo(() => simulate(K.lift, K.end + 0.5, pitch, roll, {gf: 1.25, df: 0.62, gs: 0.6, ds: 1.0}));
  return (t: number): St => {
    const S = sim();
    const up = sstep(K.lift, K.lift + 0.7, t);
    const alt = REST + 0.9 * up + 0.05 * Math.sin(t * 1.9) * up;
    const f = at(S, S.f, t), sd = at(S, S.s, t);
    const vf = at(S, S.vf, t), vs = at(S, S.vs, t);
    const B = frameYPR(v3(f, alt, -sd), 90, pitch(t), roll(t));
    const unsteady = Math.min(1, (Math.abs(pitch(t)) + Math.abs(roll(t))) / 7);
    const sv = side(t);
    const work = Math.min(1, Math.abs(sv) * 9 + Math.abs(dRoll(t)) / 8 + Math.abs(dPitch(t)) / 10);
    const pulse = Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - K.cue) / 0.5)) * Math.PI));
    const listen = sstep(K.cue + 0.05, K.cue + 0.3, t) * (1 - sstep(K.fix + 0.1, K.fix + 0.5, t));
    // the wrist comes up to read the board's attitude, then back down for the correction
    const wristUp = sstep(K.while + 0.55, K.while + 0.85, t) * (1 - sstep(K.cue + 0.1, K.cue + 0.45, t));
    return {
      B, alt, speed: Math.hypot(vf, vs), pitch: pitch(t), roll: roll(t), yaw: 90, thrust: 0.2 + 0.75 * sstep(K.lift - 0.5, K.lift + 0.1, t), pos: B.o, vel: v3(vf, 0, -vs),
      rps: 4 + 26 * sstep(K.lift - 0.5, K.lift + 0.1, t), unsteady, pulse, listen,
      pose: pose({
        lean: lean(t), side: sv, crouch: 0.38 + 0.3 * work, bend: 8 + 12 * work, twist: 20, look: 48 + 14 * up - 16 * listen - 30 * wristUp, nod: 18 - 6 * up + 20 * wristUp,
        armF: 0.38 + 0.42 * work, armFs: 0.5 + 0.5 * work, armR: 0.25 + 0.25 * work, thumb: 0.3 + 0.4 * up, bal: clamp(-sv * 12 - dRoll(t) / 9, -1, 1), hipLead: 0.8, listen, wristUp,
      }),
    };
  };
};

// ------------------------------------------------------------------ the practice progression
/** E1 another day: a slightly unstable takeoff from the pad, arms wide */
export const takeoff = (t: number, T0: number): St => {
  const s = t - T0;
  const up = sstep(0.0, 0.5, s);
  const wob = (u: number) => (0.055 * Math.sin((u - T0) * 7.5) + 0.02 * noise1(u * 2.3, 61)) * sstep(T0 + 0.05, T0 + 0.2, u);
  const roll = lag(wob, t, 0.22, 0.05) * 110;
  const pitch = 3 * Math.sin(s * 5.2) * up;
  const B = frameYPR(v3(0, REST + 0.65 * up + 0.12 * s, 0.1 * noise1(t, 62)), 90, pitch, roll);
  return {B, alt: B.o.y, speed: 0, pitch, roll, yaw: 90, thrust: 0.85, pos: B.o, vel: v3(0, 1.2 * (1 - up), 0), rps: 30,
    pose: pose({side: wob(t), crouch: 0.62, bend: 18, armF: 0.9, armFs: 1.0, armR: 0.55, look: 38, nod: 28, bal: clamp(-wob(t) * 13, -1, 1), hipLead: 0.6})};
};
/** E2 later: an S-curve over the field, leaning into each turn, path traced by the downwash in the grass */
export const sCurve = (t: number, T0: number): St => {
  const px = (s: number) => -5 + 5.2 * s, pz = (s: number) => 2.2 * Math.sin(s * 2.6);
  const s = t - T0;
  const dx = (px(s + 0.02) - px(s - 0.02)) / 0.04, dz = (pz(s + 0.02) - pz(s - 0.02)) / 0.04;
  const yaw = yawOf(dx, dz);
  const curv = -2.2 * 2.6 * 2.6 * Math.sin(s * 2.6);
  const bank = clamp(curv * 0.9, -12, 12);
  const B = frameYPR(v3(px(s), 1.4, pz(s)), yaw, -6, bank);
  return {B, alt: 1.4, speed: Math.hypot(dx, dz), pitch: -6, roll: bank, yaw, thrust: 0.85, pos: B.o, vel: v3(dx, 0, dz), rps: 30,
    pose: pose({lean: 0.08, side: bank / 100, crouch: 0.5, bend: 12, armF: 0.5, armFs: 0.75, look: 66, nod: 10, bal: clamp(-bank / 14, -1, 1)})};
};
export const sCurvePath = (T0: number, t: number) => {
  const pts: V3[] = [];
  for (let u = T0 - 0.6; u <= t; u += 0.04) {
    const s = u - T0;
    pts.push(v3(-5 + 5.2 * s, 0.01, 2.2 * Math.sin(s * 2.6)));
  }
  return pts;
};

/** E3-E4 and the start of the river flight: across the riverside flat, over the shoreline, out over the water.
 *  Nose toward the river (+z), accelerating, climbing once over the water. */
export const DEP = {x: -40, z0: -8};
export const departure = (t: number, T0: number): St => {
  const s = t - T0;
  const zz = (u: number) => DEP.z0 + 7 * u + 2.4 * u * u;
  const z = zz(s);
  const v = 7 + 4.8 * s;
  const x = DEP.x + 0.6 * Math.sin(s * 0.9);
  const alt = 1.25 + 3.4 * sstep(0.75, 2.1, s) + 0.06 * Math.sin(s * 2.1);
  const lean = (u: number) => 0.1 + 0.015 * noise1(u * 0.9, 81);
  const side = (u: number) => 0.012 * noise1(u * 1.2, 82);
  const climb = (alt - 1.25) > 0.02 ? 3.4 * (sstep(0.75, 2.1, s + 0.02) - sstep(0.75, 2.1, s - 0.02)) / 0.04 : 0;
  const pitch = -lag(lean, t) * 75 - 2;
  const roll = lag(side, t) * 95;
  const B = frameYPR(v3(x, alt, z), 0, pitch, roll);
  return {B, alt, speed: v, pitch, roll, yaw: 0, thrust: 0.9, pos: B.o, vel: v3(0.54 * Math.cos(s * 0.9), climb, v), rps: 30,
    pose: pose({lean: lean(t), side: side(t), crouch: 0.44, bend: 12, twist: 24, armF: 0.42, armFs: 0.72, armR: 0.24, look: 70, nod: 8, thumb: 0.75, bal: clamp(-side(t) * 12, -1, 1)})};
};

// ------------------------------------------------------------------ the payoff: the last of the river and into the gorge
export const GORGE3 = {ox: 600, oz: RIVER.far};
export const payoff3 = (t: number, Tin: number): St => {
  const v = 14;
  const zz = (u: number) => GORGE3.oz + v * (u - Tin);
  const xx = (u: number) => {
    const z = zz(u);
    const g = GORGE3.ox + gcx(Math.max(0, z - GORGE3.oz));
    return z < GORGE3.oz ? g - 0.02 * (GORGE3.oz - z) ** 1.3 : g;
  };
  const x = xx(t), z = zz(t);
  const dx = (xx(t + 0.05) - xx(t - 0.05)) / 0.1;
  const yaw = yawOf(dx, v);
  const ddx = (xx(t + 0.1) - 2 * x + xx(t - 0.1)) / 0.01;
  const bank = clamp(-ddx * 1.6, -16, 16);
  const alt = 7 + 2.5 * sstep(Tin - 0.6, Tin + 1.2, t) + 0.15 * Math.sin(t * 1.4);
  const lean = (u: number) => 0.1 + 0.02 * noise1(u * 0.9, 71);
  const side = (u: number) => 0.02 * noise1(u * 1.1, 72);
  const pitch = -lag(lean, t) * 75 - 2;
  const roll = lag(side, t) * 95 + bank;
  const B = frameYPR(v3(x, alt, z), yaw, pitch, roll);
  const sd = side(t) - bank / 300;
  return {B, alt, speed: v, pitch, roll, yaw, thrust: 0.9, pos: B.o, vel: v3(dx, 0, v), rps: 30,
    pose: pose({lean: lean(t), side: sd, crouch: 0.48, bend: 13, twist: 24, armF: 0.5, armFs: 0.9, look: 70, nod: 8, thumb: 0.8, bal: clamp(-sd * 12, -1, 1)})};
};

/** the workshop: the inventor standing back from the test stand with the remote */
export const inventor3 = (react: number, flinch: number): PilotPose =>
  pose({lean: -0.05 * react, side: -0.06 * react, crouch: 0.12 + 0.2 * react, bend: 2 - 6 * react, twist: 30, look: 10 + 6 * react, nod: 8 - 6 * react, armF: 0.2 + 0.6 * flinch, armFs: 0.3 + 0.4 * flinch, armR: 0.2, remote: 1 - 0.4 * flinch, thumb: 0.5, bal: 0.5 * flinch, level: 1, hipLead: 0.3});
