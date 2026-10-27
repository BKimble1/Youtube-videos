// Flight dynamics, as pure functions of time. The body leads, the board follows: the rider's centre-of-mass shifts
// (lean toward the nose, shift toward the toes) are the input, and the board's pitch and roll are a lagged response to
// them (the thrust vector tilts with the deck), plus the bank of a turn. Small, believable balance corrections come
// from smooth noise; deliberate weight shifts are keyed.
import {noise1} from '../dc/math';
import {POSE0, PilotPose} from '../art/rig';
import {Frame, frameYPR, V3, v3} from '../eng/v3';

export const sstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** average of f over [t - a, t - b] (a > b): the board's lagged response to the body */
export const lag = (f: (t: number) => number, t: number, a = 0.32, b = 0.08, n = 6) => {
  let s = 0;
  for (let i = 0; i < n; i++) s += f(t - b - ((a - b) * i) / (n - 1));
  return s / n;
};
export type FlightState = {B: Frame; pose: PilotPose; alt: number; speed: number; pitch: number; roll: number; yaw: number; thrust: number; pos: V3};

/** board attitude from the body's shifts: lean forward pitches the nose down, a shift to the toes rolls that side down */
export const attitude = (lean: (t: number) => number, side: (t: number) => number, t: number, trim = 0) => ({
  pitch: -lag(lean, t) * 75 + trim,
  roll: lag(side, t) * 95,
});

// ---- the Yangtze crossing (hook, river payoff and the ending share this one trajectory; tau = flight time)
const RV = {z0: 250, v: 7.2};
const rvX = (tau: number) => 5 * Math.sin(tau * 0.22) - 3;
const rvAlt = (tau: number) => 2.7 + 0.6 * sstep(-0.2, 1.4, tau) + 3.3 * sstep(1.35, 2.7, tau) - 3.0 * sstep(3.5, 5.6, tau) + 4.4 * (1 - sstep(-3.1, -0.6, tau)) + 0.12 * Math.sin(tau * 1.3);
const rvLean = (tau: number) => 0.055 + 0.022 * noise1(tau * 0.85, 3) + 0.025 * sstep(1.3, 1.8, tau) * (1 - sstep(2.3, 3.0, tau));
const rvSide = (tau: number) => 0.024 * noise1(tau * 1.05, 9) + 0.05 * (sstep(0.3, 0.6, tau) - sstep(0.95, 1.35, tau)) - 0.045 * (sstep(-2.3, -1.8, tau) - sstep(-1.3, -0.7, tau));
export const riverFlight = (tau: number): FlightState => {
  const x = rvX(tau), z = RV.z0 + RV.v * tau;
  const dx = (rvX(tau + 0.05) - rvX(tau - 0.05)) / 0.1;
  const yaw = (Math.atan2(dx, RV.v) * 180) / Math.PI;
  const yawRate = (Math.atan2((rvX(tau + 0.15) - rvX(tau + 0.05)) / 0.1, RV.v) - Math.atan2((rvX(tau - 0.05) - rvX(tau - 0.15)) / 0.1, RV.v)) / 0.2;
  const alt = rvAlt(tau);
  const att = attitude(rvLean, rvSide, tau, -1.5);
  const bank = -yawRate * RV.v * 6; // lean into the curve
  // the board's yaw: nose along the path; stance across it
  const B = frameYPR(v3(x, alt, z), yaw, att.pitch, att.roll + bank);
  const climb = sstep(1.3, 1.7, tau) * (1 - sstep(2.2, 2.9, tau));
  const pose: PilotPose = {
    ...POSE0,
    lean: rvLean(tau),
    side: rvSide(tau),
    crouch: 0.46 + 0.06 * noise1(tau * 0.7, 4) + 0.14 * climb,
    twist: 24 + 4 * noise1(tau * 0.5, 5),
    bend: 12 + 5 * climb,
    look: 66 + 6 * noise1(tau * 0.4, 6),
    nod: 8 + 6 * climb,
    armF: 0.45 + 0.12 * noise1(tau * 1.1, 7) + 0.8 * rvSide(tau),
    armFs: 0.9 + 0.15 * noise1(tau * 0.9, 8),
    armR: 0.2 + 0.08 * noise1(tau * 0.8, 10),
    thumb: 0.45 + 0.2 * climb,
    wristUp: 0,
  };
  return {B, pose, alt, speed: RV.v, pitch: att.pitch, roll: att.roll + bank, yaw, thrust: 0.6 + 0.3 * climb, pos: v3(x, alt, z)};
};

// ---- the practice field. The board rests on its duct rims: deck top 0.125 m above the ground.
export const REST = 0.125;
/** integrate a velocity from t0 to t (fixed 1/60 s steps): positions are pure functions of time */
export const integ = (v: (t: number) => number, t0: number, t: number) => {
  if (t <= t0) return 0;
  const n = Math.ceil((t - t0) * 60);
  const h = (t - t0) / n;
  let s = 0;
  for (let i = 0; i < n; i++) s += v(t0 + (i + 0.5) * h) * h;
  return s;
};
const fieldPose = (o: Partial<PilotPose>): PilotPose => ({...POSE0, ...o});

/** scene 2: the ground demonstration (rotors spool, the board lifts straight up, then moves off) */
export const liftDemo = (t: number, T0: number): FlightState & {rps: number; leafT0: number} => {
  const s = t - T0; // 0 at the match from the water ring
  const up = sstep(0.45, 1.9, s);
  const alt = REST + 1.45 * up + 0.04 * Math.sin(s * 2.4) * up;
  const lean = (u: number) => 0.01 + 0.07 * sstep(1.9, 2.4, u - T0) - 0.03 * sstep(2.6, 3.0, u - T0);
  const side = (u: number) => 0.012 * noise1(u * 1.1, 21) * sstep(0.6, 1.0, u - T0);
  const att = attitude(lean, side, t);
  const fwd = integ((u) => Math.max(0, -attitude(lean, side, u).pitch) * 0.45, T0 + 1.9, t);
  const lift = sstep(0.45, 0.8, s) * (1 - sstep(1.0, 1.6, s));
  const B = frameYPR(v3(0, alt, fwd), 0, up > 0.02 ? att.pitch : 0, up > 0.02 ? att.roll : 0);
  const pose = fieldPose({
    lean: lean(t), side: side(t),
    crouch: 0.32 + 0.22 * lift + 0.05 * noise1(t * 0.8, 22),
    bend: 8 + 6 * lift, twist: 20, look: 55 + 10 * sstep(1.9, 2.4, s), nod: 18 - 10 * up,
    armF: 0.35 + 0.25 * up, armFs: 0.6 + 0.3 * lift, armR: 0.3 + 0.2 * lift, thumb: 0.3 + 0.5 * sstep(0.1, 0.6, s),
  });
  const thrust = 0.25 + 0.7 * sstep(0.0, 0.5, s);
  return {B, pose, alt, speed: 0, pitch: att.pitch, roll: att.roll, yaw: 0, thrust, pos: B.o, rps: 6 + 26 * sstep(0, 0.5, s), leafT0: T0 + 0.1};
};

/** scene 4: the new board's first lift (steps on, lifts, tilts, the body answers, drift, balance restored) */
export const tiltProblem = (t: number, T: {step: number; lift: number; recover: number}): FlightState & {rps: number} => {
  const s = t - T.lift;
  const step = 1 - sstep(T.step, T.step + 0.55, t);
  const up = sstep(0.0, 0.7, s);
  const alt = REST + 0.75 * up;
  // the disturbance: with nothing balancing it the deck rolls toward the heel side
  const dist = (u: number) => -13 * sstep(T.lift + 0.1, T.lift + 0.6, u) * (1 - sstep(T.lift + 1.2, T.lift + 2.3, u));
  // the body answers: hips to the toes, deeper knees; then a small overcorrection, then centred
  const side = (u: number) => 0.11 * sstep(T.lift + 0.45, T.lift + 0.95, u) - 0.15 * sstep(T.lift + 1.25, T.lift + 1.85, u) + 0.04 * sstep(T.lift + 2.0, T.lift + 2.6, u) + 0.008 * noise1(u, 31);
  const lean = (u: number) => 0.015 * noise1(u * 0.9, 32);
  const att = attitude(lean, side, t);
  const roll = (up > 0.01 ? dist(t) + att.roll : 0);
  const drift = integ((u) => (dist(u) + attitude(lean, side, u).roll) * 0.05, T.lift + 0.2, t);
  // yawed 90 deg (nose toward +x, as the board lay on the bench); the drift runs along the board's toe axis
  const B = frameYPR(v3(0, alt, -drift), 90, up > 0.01 ? att.pitch : 0, roll);
  const answer = sstep(T.lift + 0.4, T.lift + 0.9, t) * (1 - sstep(T.recover, T.recover + 0.6, t));
  const pose = fieldPose({
    lean: lean(t), side: side(t), stepR: step,
    crouch: 0.3 + 0.32 * answer + 0.1 * up, bend: 6 + 10 * answer, twist: 18, look: 40 + 15 * up, nod: 26 - 8 * up,
    armF: 0.3 + 0.5 * answer, armFs: 0.4 + 0.6 * answer, armR: 0.2 + 0.3 * answer, thumb: 0.3 + 0.4 * up,
  });
  return {B, pose, alt, speed: 0, pitch: att.pitch, roll, yaw: 90, thrust: 0.2 + 0.75 * sstep(-0.6, 0.1, s), pos: B.o, rps: 4 + 28 * sstep(-0.6, 0.1, s)};
};

/** scene 5: the body is the control: lean forward -> travel; lean back -> brake; an overcorrection drifts it sideways;
 *  throttle on the controller; the phones read the tilt; the coach's cue; the correction; a clean turn */
export const bodyControl = (t: number, K: {start: number; back: number; over: number; thumb: number; wrist: number; coach: number; fix: number; turn: number}): FlightState & {rps: number; coachPulse: number; wrist: number} => {
  const lean = (u: number) => 0.13 * sstep(K.start, K.start + 0.35, u) - 0.22 * sstep(K.back - 0.15, K.back + 0.35, u) + 0.09 * sstep(K.over, K.over + 0.4, u) + 0.03 * sstep(K.turn, K.turn + 0.4, u) + 0.01 * noise1(u * 1.2, 41);
  const side = (u: number) => 0.13 * sstep(K.over - 0.1, K.over + 0.25, u) - 0.1 * sstep(K.fix - 0.1, K.fix + 0.35, u) - 0.02 * sstep(K.fix + 0.5, K.fix + 0.9, u) + 0.05 * sstep(K.turn, K.turn + 0.4, u) + 0.01 * noise1(u * 1.4, 42);
  const att = attitude(lean, side, t);
  const vF = (u: number) => -attitude(lean, side, u).pitch * 0.38 + 0.6;
  const vS = (u: number) => attitude(lean, side, u).roll * 0.09;
  const yawT = (u: number) => 55 * sstep(K.turn + 0.1, K.turn + 0.9, u);
  const yaw = yawT(t);
  // integrate in the board's heading
  const fwd = (u: number) => vF(u);
  const px = integ((u) => fwd(u) * Math.sin((yawT(u) * Math.PI) / 180) + vS(u) * Math.cos((yawT(u) * Math.PI) / 180), K.start - 0.6, t);
  const pz = integ((u) => fwd(u) * Math.cos((yawT(u) * Math.PI) / 180) - vS(u) * Math.sin((yawT(u) * Math.PI) / 180), K.start - 0.6, t);
  const alt = 1.05 + 0.25 * sstep(K.thumb, K.thumb + 0.5, t) + 0.05 * Math.sin(t * 1.7);
  const B = frameYPR(v3(px, alt, pz), yaw, att.pitch, att.roll);
  const thumb = 0.4 + 0.45 * sstep(K.thumb, K.thumb + 0.25, t) * (1 - sstep(K.thumb + 0.6, K.thumb + 0.9, t));
  const wrist = sstep(K.wrist - 0.2, K.wrist + 0.1, t) * (1 - sstep(K.coach + 0.2, K.coach + 0.5, t));
  const fixK = sstep(K.fix - 0.1, K.fix + 0.3, t) * (1 - sstep(K.fix + 0.7, K.fix + 1.1, t));
  const coachPulse = Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - K.coach) / 0.5)) * Math.PI));
  const pose = fieldPose({
    lean: lean(t), side: side(t),
    crouch: 0.38 + 0.25 * fixK + 0.08 * Math.abs(side(t)) * 5, bend: 10 + 8 * fixK, twist: 22, look: 60 - 25 * wrist, nod: 10 + 30 * wrist,
    armF: 0.4 + 0.25 * fixK + 0.2 * sstep(K.over, K.over + 0.3, t) * (1 - sstep(K.fix, K.fix + 0.4, t)) - 0.15 * wrist, armFs: 0.7 - 0.5 * wrist + 0.2 * fixK, armR: 0.25 + 0.35 * sstep(K.thumb - 0.2, K.thumb, t) * (1 - sstep(K.thumb + 0.6, K.thumb + 0.9, t)), thumb,
    wristUp: wrist,
  });
  return {B, pose, alt, speed: vF(t), pitch: att.pitch, roll: att.roll, yaw, thrust: 0.75, pos: B.o, rps: 30, coachPulse, wrist};
};
