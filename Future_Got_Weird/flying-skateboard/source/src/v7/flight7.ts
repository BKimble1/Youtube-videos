// V7: the opening flies higher (about 7 m over the river, so the drop reads at once) and its balance adjustment comes
// at 0.4-1.2 s; the field practice moves forward and its tilts are larger (balanceFlight7). Earlier notes:
// V6: the opening's carve (a 17 degree bank under feet that barely changed) is replaced by one small gust and his
// whole-body answer, and the learning session is rebuilt as a sequence of distinct beats (fieldFlight6). Earlier notes:
// V5: the field session is a spring-driven balancing system (see fieldFlight).
// V4 flight models (from V3). The body now stays upright over the planted feet while the deck tilts under it
// (rig `upright`), the hook flies lower (about 4.3 m), and the learning session is a damped sequence of tilts and
// corrections. V3 notes follow.
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
// V5: the earbud is on his right ear, the side every toe-side camera sees (so the earbud close-up is shot from the
// same side of the line as the shots around it)
const pose = (o: Partial<PilotPose>): PilotPose => ({...POSE0, hipLead: 0.6, level: 0.8, upright: 0.75, ear: -1, ...o});
export type St = FlightState & {vel: V3; rps: number; unsteady?: number; pulse?: number; listen?: number; voice?: number};

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
export const HK4 = {z0: 80, v: 11};
// V6: no carve. He holds a straight, gently weaving line; at 1.35 s a gust rolls the deck about 4 degrees toe edge
// down and his whole body answers it (see the gust springs below), so the deck never turns under unchanged feet.
const ssI = (a: number, b: number, t: number) => {
  const s = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return (b - a) * (s ** 3 - s ** 4 / 2) + Math.max(0, t - b);
};
void ssI;
const hx = (tau: number) => 1.3 * Math.sin(tau * 0.42 + 0.5);
// about 4.3 m over the river (a height the reports support, low enough that the downwash roughens the water); the
// board heaves gently in the air at 0.45-0.95 s and his knees take it; during "blast air downward" he sinks a little
const heave = (tau: number) => 0.14 * (sstep(1.42, 1.68, tau) - sstep(1.68, 2.05, tau)) - 0.1 * (sstep(-2.2, -1.9, tau) - sstep(-1.9, -1.5, tau));
// V7: about 7 m over the water (the drop reads at once); during "blast air downward" he sinks a little
const halt = (tau: number) => 7.0 + 0.16 * Math.sin(tau * 0.8 + 0.3) + heave(tau) - 3.6 * sstep(5.0, 6.9, tau); // V7: it drops toward the river as the air is followed down
/** weight shifts: frame 0 is mid-correction (toes, then back); before frame 0 (the ending) a gust correction while
 *  the camera comes down, and a smaller one as it settles on frame 0's view */
const hSide = (tau: number) =>
  0.018 * noise1(tau * 1.1, 9) + 0.06 * (sstep(-0.25, 0.12, tau) - sstep(0.22, 0.55, tau))
  - 0.05 * (sstep(-3.75, -3.5, tau) - sstep(-3.35, -3.0, tau)) + 0.03 * (sstep(-1.9, -1.6, tau) - sstep(-1.3, -0.95, tau));
const hLean = (tau: number) => 0.085 + 0.018 * noise1(tau * 0.85, 3);
const bumpG = (u: number, c: number, w: number) => Math.exp(-(((u - c) / w) ** 2));
// V6: the gust. The deck is pushed toe edge down (peak about 4 degrees at 1.55 s); he is pushed toward his toes for a
// moment (anticipation), then his hips go back toward the heels, the knees load, the torso counter-leans and the arms
// counterbalance a beat later; the deck comes back level with a small overshoot and settles by about 2.2 s.
const GUST = {at: 0.45};
export const GUST_AT = GUST.at;
const gustRoll = (tau: number) => 4.2 * bumpG(tau, GUST.at + 0.2, 0.16) - 1.0 * bumpG(tau, GUST.at + 0.62, 0.2);
type HCh = 'side' | 'crouch' | 'bal' | 'arm';
const HSPR: Record<HCh, [number, number]> = {side: [11, 0.55], crouch: [9, 0.65], bal: [7, 0.45], arm: [7, 0.5]};
const hTarget = (u: number) => {
  const g = gustRoll(u);
  const effort = Math.min(1, Math.abs(g) / 4);
  return {
    // pushed toward the toes as the deck goes over, then back toward the heels to bring it up
    side: 0.012 * bumpG(u, GUST.at + 0.08, 0.08) - 0.62 * g / 95 * 1.25,
    crouch: 0.16 * effort,
    bal: clamp(g / 7, -1, 1),
    arm: 0.12 * effort,
  };
};
const HT0 = -4.6, HDT = 1 / 240;
const hookBody = memo(() => {
  const n = Math.ceil((9 - HT0) / HDT) + 2;
  const out: Record<HCh, number[]> = {side: [], crouch: [], bal: [], arm: []};
  const x: Record<HCh, number> = {...hTarget(HT0)};
  const v: Record<HCh, number> = {side: 0, crouch: 0, bal: 0, arm: 0};
  for (let i = 0; i < n; i++) {
    const tg = hTarget(HT0 + i * HDT);
    for (const c of Object.keys(HSPR) as HCh[]) {
      const [w, z] = HSPR[c];
      v[c] += (w * w * (tg[c] - x[c]) - 2 * z * w * v[c]) * HDT;
      x[c] += v[c] * HDT;
      out[c].push(x[c]);
    }
  }
  return out;
});
const hb = (c: HCh, u: number) => {
  const arr = hookBody()[c];
  const xx = (u - HT0) / HDT;
  if (xx <= 0) return arr[0];
  const i = Math.min(arr.length - 2, Math.floor(xx));
  return arr[i] + (arr[i + 1] - arr[i]) * Math.min(1, xx - i);
};
export const hook4 = (tau: number): St => {
  const x = hx(tau), z = HK4.z0 + HK4.v * tau;
  const dx = (hx(tau + 0.05) - hx(tau - 0.05)) / 0.1;
  const yaw = yawOf(dx, HK4.v);
  const sideAll = (u: number) => hSide(u) + hb('side', u);
  const pitch = -lag(hLean, tau) * 75 - 2;
  const roll = lag(sideAll, tau) * 95 + gustRoll(tau);
  const alt = halt(tau);
  const B = frameYPR(v3(x, alt, z), yaw, pitch, roll);
  // V5: the knees take the heave: the body follows the board's rise a moment late, so the legs compress as the deck
  // comes up under him and extend as it drops away
  const absorb = heave(tau) - lag(heave, tau, 0.3, 0.03, 8);
  // the knees work with every correction: they flex as the weight moves and recover after it
  const work = 1 - Math.exp(-1.3 * (Math.abs(hSide(tau)) * 14 + Math.abs(hLean(tau) - 0.085) * 12 + Math.abs(heave(tau)) * 1.5));
  const sd = sideAll(tau);
  return {
    // the rotors work harder through "electric propellers blast air downward" (the explanation is also the strongest wash)
    B, alt, speed: HK4.v, pitch, roll, yaw, thrust: 0.7 + 0.28 * sstep(4.9, 5.9, tau) * (1 - sstep(7.2, 7.6, tau)), pos: v3(x, alt, z), vel: v3(dx, 0, HK4.v), rps: 30,
    pose: pose({
      // V6: the body rides partly with the deck (upright 0.45, not 0.75), so a deck roll shows in the legs, hips and
      // torso together instead of the deck turning under a body that stays put
      upright: 0.45,
      lean: hLean(tau), side: sd, crouch: 0.46 + 0.16 * work + hb('crouch', tau) + 2.0 * Math.max(0, absorb) + 0.8 * Math.min(0, absorb) + 0.03 * noise1(tau * 0.7, 4), twist: 24 + 4 * noise1(tau * 0.5, 5), bend: 11 + 6 * work + 20 * hb('crouch', tau),
      look: 64 + 6 * noise1(tau * 0.4, 6), nod: 10 + 4 * work, armF: 0.45 + 0.12 * work + hb('arm', tau) + 0.06 * noise1(tau * 1.1, 7), armFs: 0.8 + 0.2 * work + hb('arm', tau),
      armR: 0.22 + 0.06 * noise1(tau * 0.8, 10), thumb: 0.5, bal: clamp(-hSide(tau) * 15 + hb('bal', tau), -1, 1),
    }),
  };
};

// ------------------------------------------------------------------ the lift (riverside flat), nose toward the river
export const LIFT_AT = v3(-40, 0, -26);
export const lift4 = (t: number, T0: number): St => {
  const s = t - T0;
  const up = sstep(0.62, 1.9, s);
  // (V5 final: one continuous rise; a second ease-in after the first ease-out made the camera's tilt hitch)
  const alt = REST + 3.0 * sstep(0.62, 2.6, s) + 0.05 * Math.sin(s * 2.2) * up;
  const fwd = (u: number) => (u > 1.65 ? 1.15 * (u - 1.65) ** 2 : 0);
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
  // V5: one connected balancing system. Each disturbance is a single small smooth tilt of the deck. The body answers
  // through damped springs, so the motion has a natural delay, a little overshoot (follow-through) and settles: the
  // hips/centre of mass shift first (fast spring), the knees bend with the effort, the arms counterbalance a beat later
  // (slower, looser spring), and the board's attitude follows the body with its usual lag. A deliberate lean is
  // preceded by a small opposite dip (anticipation). Head turns are slow and small.
  const bump = (u: number, c: number, w: number) => Math.exp(-(((u - c) / w) ** 2));
  // the coach beat: a steady roll error he does not feel until the cue; the correction he makes removes it
  const dRollD = (u: number) => -4.5 * sstep(K.while, K.while + 0.5, u) * (1 - sstep(K.fix, K.fix + 0.45, u));
  const dRoll = (u: number) =>
    5.5 * bump(u, K.huge + 0.2, 0.24) - 2.2 * bump(u, K.huge + 0.85, 0.26)
    + 3 * bump(u, K.itself + 0.3, 0.24) - 1.1 * bump(u, K.itself + 0.95, 0.26)
    + 5.5 * bump(u, K.body - 0.6, 0.22) - 2 * bump(u, K.body + 0.05, 0.24)
    + dRollD(u);
  const dPitch = (u: number) => -4.5 * bump(u, K.theBoard + 0.35, 0.24) + 1.6 * bump(u, K.theBoard + 1.0, 0.26);
  const planned = (u: number) =>
    0.07 * sstep(K.heHas + 0.12, K.heHas + 0.75, u) * (1 - sstep(K.while - 0.2, K.while + 0.6, u)) + 0.025 * sstep(K.while + 0.2, K.while + 0.8, u)
    - 0.018 * bump(u, K.heHas + 0.02, 0.09); // anticipation: a small dip back before he leans into it
  const fixShift = (u: number) => 0.032 * sstep(K.fix - 0.08, K.fix + 0.22, u) * (1 - sstep(K.fix + 0.5, K.fix + 1.0, u));
  const effort = (u: number) => Math.min(1, (Math.abs(dRoll(u) - dRollD(u)) + Math.abs(dPitch(u))) / 5 + Math.abs(planned(u)) * 4 + fixShift(u) * 10);
  const targets = (u: number) => {
    const sideT = -0.62 * (dRoll(u) - dRollD(u)) / 95 + fixShift(u);
    return {
      side: sideT,
      lean: -0.62 * dPitch(u) / 75 + planned(u),
      crouch: 0.47 + 0.24 * effort(u),
      bal: clamp(-sideT * 13 - (dRoll(u) - dRollD(u)) / 10, -1, 1),
      arm: 0.38 + 0.42 * effort(u),
    };
  };
  type Ch = 'side' | 'lean' | 'crouch' | 'bal' | 'arm';
  const SPR: Record<Ch, [number, number]> = {side: [10, 0.55], lean: [9, 0.6], crouch: [8, 0.7], bal: [6.5, 0.4], arm: [6.5, 0.45]};
  const t0 = K.lift - 0.8, dt = 1 / 240;
  const body = memo(() => {
    const n = Math.ceil((K.end + 1 - t0) / dt) + 2;
    const out: Record<Ch, number[]> = {side: [], lean: [], crouch: [], bal: [], arm: []};
    const x: Record<Ch, number> = {...targets(t0)} as Record<Ch, number>;
    const v: Record<Ch, number> = {side: 0, lean: 0, crouch: 0, bal: 0, arm: 0};
    for (let i = 0; i < n; i++) {
      const tg = targets(t0 + i * dt);
      for (const c of Object.keys(SPR) as Ch[]) {
        const [w, z] = SPR[c];
        v[c] += (w * w * (tg[c] - x[c]) - 2 * z * w * v[c]) * dt;
        x[c] += v[c] * dt;
        out[c].push(x[c]);
      }
    }
    return out;
  });
  const look = (c: Ch, u: number) => {
    const arr = body()[c];
    const xx = (u - t0) / dt;
    if (xx <= 0) return arr[0];
    const i = Math.min(arr.length - 2, Math.floor(xx));
    return arr[i] + (arr[i + 1] - arr[i]) * Math.min(1, xx - i);
  };
  const side = (u: number) => look('side', u) + 0.004 * noise1(u * 1.6, 31);
  const lean = (u: number) => look('lean', u) + 0.004 * noise1(u * 1.3, 32);
  const pitch = (u: number) => (u < K.lift ? 0 : -lag(lean, u) * 75 + dPitch(u));
  const roll = (u: number) => (u < K.lift ? 0 : lag(side, u) * 95 + dRoll(u));
  const sim = memo(() => simulate(K.lift, K.end + 0.5, pitch, roll, {gf: 1.25, df: 0.62, gs: 0.35, ds: 1.2}));
  return (t: number): St => {
    const S = sim();
    const up = sstep(K.lift, K.lift + 0.7, t);
    const alt = REST + 0.9 * up + 0.05 * Math.sin(t * 1.9) * up;
    const f = at(S, S.f, t), sd = at(S, S.s, t);
    const vf = at(S, S.vf, t), vs = at(S, S.vs, t);
    const B = frameYPR(v3(f, alt, -sd), 90, pitch(t), roll(t));
    const unsteady = Math.min(1, (Math.abs(pitch(t)) + Math.abs(roll(t))) / 7);
    const work = clamp((look('crouch', t) - 0.47) / 0.24, 0, 1);
    const pulse = Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - K.cue) / 0.5)) * Math.PI));
    const listen = sstep(K.cue + 0.05, K.cue + 0.35, t) * (1 - sstep(K.fix + 0.1, K.fix + 0.55, t));
    // the wrist comes up to read the board's attitude and goes down when the cue arrives; the head looks down at it
    // and stays down, listening, until he makes the correction (slow, small turns)
    // V5: the arm comes up while the deck phone is on screen, so it is settled when we cut to his view of the wrist
    const wristUp = sstep(K.while + 0.1, K.while + 0.5, t) * (1 - sstep(K.cue + 0.1, K.cue + 0.5, t));
    const headDown = sstep(K.while + 0.45, K.while + 0.95, t) * (1 - sstep(K.fix + 0.05, K.fix + 0.65, t));
    return {
      B, alt, speed: Math.hypot(vf, vs), pitch: pitch(t), roll: roll(t), yaw: 90, thrust: 0.2 + 0.75 * sstep(K.lift - 0.5, K.lift + 0.1, t), pos: B.o, vel: v3(vf, 0, -vs),
      rps: 4 + 26 * sstep(K.lift - 0.5, K.lift + 0.1, t), unsteady, pulse, listen,
      pose: pose({
        lean: lean(t), side: side(t), crouch: look('crouch', t), bend: 8 + 12 * work, twist: 20,
        look: 50 + 10 * up - 22 * headDown, nod: 14 - 4 * up + 14 * headDown,
        armF: look('arm', t), armFs: 0.5 + 0.5 * work, armR: 0.25 + 0.25 * work, thumb: 0.3 + 0.4 * up, bal: clamp(look('bal', t), -1, 1), hipLead: 0.8, upright: 0.55,
        listen: 0.55 * listen, wristUp,
      }),
    };
  };
};

// ------------------------------------------------------------------ V6: the learning session, beat by beat
// The board hovers low over the pad (about 0.6 m), nose toward +x (yaw 90; toe side toward -z). Each beat is one
// legible event in the deck's attitude and one answer from his body (springs: hips/centre of mass first, knees with
// the effort, arms a beat later; the deck follows his weight with its usual lag). His reaction delay shortens as he
// learns: the first tendency is caught late, the last gust is met at once.
//   problem   a slow toe-side roll that grows (the board does nothing about it) until he catches it, late
//   itself    the nose dips by itself, he sits back; it comes up past level, he leans in
//   control   a toe-side roll answered in the ankles, knees and hips (the close-up)
//   body      a bigger heel-side roll answered by the whole body, then a lean that carries the board forward
//   coach     a small steady heel-side error he does not feel; the deck phone reads it, the wrist phone shows it and
//             speaks; on the cue in his earbud he corrects, knees softer and hips over the toes
//   learned   a fresh gust, met at once: small, quick and settled
export type FieldK6 = {lift: number; problem: number; itself: number; control: number; body: number; coach: number; wrist: number; cue: number; fix: number; learned: number; end: number};
type Dist = {ch: 'roll' | 'pitch'; amp: number; c: number; w: number; delay: number; gain?: number};
export const fieldFlight6 = (K: FieldK6) => {
  const bump = (u: number, c: number, w: number) => Math.exp(-(((u - c) / w) ** 2));
  const DS: Dist[] = [
    // the problem: grows over about a second (two overlapping lobes read as one slow divergence), caught late
    {ch: 'roll', amp: 4.6, c: K.problem + 0.55, w: 0.42, delay: 0.42},
    {ch: 'roll', amp: 6.2, c: K.problem + 1.0, w: 0.3, delay: 0.42},
    // can't balance itself: the nose dips, then rises past level
    {ch: 'pitch', amp: -5.0, c: K.itself + 0.45, w: 0.28, delay: 0.16},
    {ch: 'pitch', amp: 3.4, c: K.itself + 1.25, w: 0.26, delay: 0.14},
    // control it: a toe-side roll answered in the legs
    {ch: 'roll', amp: 4.4, c: K.control + 0.32, w: 0.2, delay: 0.1, gain: 1.1},
    // the entire body: a bigger heel-side roll
    {ch: 'roll', amp: -6.0, c: K.body + 0.42, w: 0.24, delay: 0.12, gain: 1.15},
    // learned: met at once
    {ch: 'roll', amp: 3.2, c: K.learned + 0.42, w: 0.17, delay: 0.02, gain: 1.3},
  ];
  // the coach beat: a small steady heel-side error he does not feel; the correction he makes on the cue removes it
  const dRollD = (u: number) => -4.8 * sstep(K.coach, K.coach + 0.5, u) * (1 - sstep(K.fix, K.fix + 0.45, u));
  const dist = (ch: 'roll' | 'pitch', u: number) => DS.filter((d) => d.ch === ch).reduce((acc, d) => acc + d.amp * bump(u, d.c, d.w), 0);
  const dRoll = (u: number) => dist('roll', u) + dRollD(u);
  const dPitch = (u: number) => dist('pitch', u);
  // what his body answers: each disturbance seen after its own reaction delay
  const answer = (ch: 'roll' | 'pitch', u: number) => DS.filter((d) => d.ch === ch).reduce((acc, d) => acc + (d.gain ?? 1) * d.amp * bump(u - d.delay, d.c, d.w), 0);
  // the lean that carries the board forward at the end of the whole-body beat (a small dip back first: anticipation)
  const planned = (u: number) => 0.045 * sstep(K.body + 0.8, K.body + 1.15, u) * (1 - sstep(K.coach - 0.35, K.coach + 0.75, u)) - 0.015 * bump(u, K.body + 0.78, 0.07);
  // the coach correction: hips over the toes, knees softer
  const fixShift = (u: number) => 0.018 * sstep(K.fix - 0.05, K.fix + 0.3, u) * (1 - sstep(K.fix + 0.35, K.fix + 0.75, u));
  const effort = (u: number) => Math.min(1, (Math.abs(answer('roll', u)) + Math.abs(answer('pitch', u))) / 5 + Math.abs(planned(u)) * 4 + fixShift(u) * 12);
  const targets = (u: number) => {
    const sideT = -0.62 * answer('roll', u) / 95 + fixShift(u);
    return {
      side: sideT,
      lean: -0.62 * answer('pitch', u) / 75 + planned(u),
      crouch: 0.47 + 0.26 * effort(u) + 0.08 * sstep(K.fix, K.fix + 0.3, u) * (1 - sstep(K.learned + 0.8, K.end, u)),
      bal: clamp(-sideT * 13 - answer('roll', u) / 10, -1, 1),
      arm: 0.36 + 0.46 * effort(u),
    };
  };
  type Ch = 'side' | 'lean' | 'crouch' | 'bal' | 'arm';
  const SPR: Record<Ch, [number, number]> = {side: [10, 0.55], lean: [9, 0.6], crouch: [8, 0.7], bal: [6.5, 0.42], arm: [6.5, 0.45]};
  const t0 = K.lift - 0.8, dt = 1 / 240;
  const body = memo(() => {
    const n = Math.ceil((K.end + 1 - t0) / dt) + 2;
    const out: Record<Ch, number[]> = {side: [], lean: [], crouch: [], bal: [], arm: []};
    const x: Record<Ch, number> = {...targets(t0)} as Record<Ch, number>;
    const v: Record<Ch, number> = {side: 0, lean: 0, crouch: 0, bal: 0, arm: 0};
    for (let i = 0; i < n; i++) {
      const tg = targets(t0 + i * dt);
      for (const c of Object.keys(SPR) as Ch[]) {
        const [w, z] = SPR[c];
        v[c] += (w * w * (tg[c] - x[c]) - 2 * z * w * v[c]) * dt;
        x[c] += v[c] * dt;
        out[c].push(x[c]);
      }
    }
    return out;
  });
  const look = (c: Ch, u: number) => {
    const arr = body()[c];
    const xx = (u - t0) / dt;
    if (xx <= 0) return arr[0];
    const i = Math.min(arr.length - 2, Math.floor(xx));
    return arr[i] + (arr[i + 1] - arr[i]) * Math.min(1, xx - i);
  };
  const side = (u: number) => look('side', u) + 0.003 * noise1(u * 1.6, 31);
  const lean = (u: number) => look('lean', u) + 0.003 * noise1(u * 1.3, 32);
  const pitch = (u: number) => (u < K.lift ? 0 : -lag(lean, u) * 75 + dPitch(u));
  const roll = (u: number) => (u < K.lift ? 0 : lag(side, u) * 95 + dRoll(u));
  const sim = memo(() => simulate(K.lift, K.end + 0.5, pitch, roll, {gf: 1.25, df: 0.9, gs: 0.3, ds: 1.4}));
  return (t: number): St => {
    const S = sim();
    const up = sstep(K.lift, K.lift + 0.6, t);
    const alt = REST + 0.5 * up + 0.03 * Math.sin(t * 1.9) * up;
    const f = at(S, S.f, t), sd = at(S, S.s, t);
    const vf = at(S, S.vf, t), vs = at(S, S.vs, t);
    const B = frameYPR(v3(f, alt, -sd), 90, pitch(t), roll(t));
    const unsteady = Math.min(1, (Math.abs(pitch(t)) + Math.abs(roll(t))) / 7);
    const work = clamp((look('crouch', t) - 0.47) / 0.26, 0, 1);
    const pulse = Math.max(0, Math.sin(Math.min(1, Math.max(0, (t - K.cue) / 0.5)) * Math.PI));
    // the AI coach speaking: the wrist phone's waveform runs from the moment it reads the error until the cue ends
    const voice = sstep(K.wrist + 0.25, K.wrist + 0.4, t) * (1 - sstep(K.cue + 0.45, K.cue + 0.6, t));
    const listen = sstep(K.cue + 0.05, K.cue + 0.3, t) * (1 - sstep(K.fix + 0.3, K.fix + 0.7, t));
    // the wrist comes up to read it during the deck-phone shot (settled when we cut to his view) and goes down as he
    // makes the correction; the head looks down at it, then up and level once he has corrected
    const wristUp = sstep(K.coach + 0.1, K.coach + 0.5, t) * (1 - sstep(K.fix + 0.02, K.fix + 0.4, t));
    const headDown = sstep(K.coach + 0.4, K.coach + 0.85, t) * (1 - sstep(K.fix + 0.1, K.fix + 0.6, t));
    return {
      B, alt, speed: Math.hypot(vf, vs), pitch: pitch(t), roll: roll(t), yaw: 90, thrust: 0.2 + 0.75 * sstep(K.lift - 0.5, K.lift + 0.1, t), pos: B.o, vel: v3(vf, 0, -vs),
      rps: 4 + 26 * sstep(K.lift - 0.5, K.lift + 0.1, t), unsteady, pulse, listen, voice,
      pose: pose({
        lean: lean(t), side: side(t), crouch: look('crouch', t), bend: 8 + 12 * work, twist: 20,
        look: 50 + 10 * up - 22 * headDown, nod: 14 - 4 * up + 14 * headDown,
        armF: look('arm', t), armFs: 0.5 + 0.5 * work, armR: 0.25 + 0.25 * work, thumb: 0.3 + 0.4 * up, bal: clamp(look('bal', t), -1, 1), hipLead: 0.8, upright: 0.55,
        listen: 0.55 * listen, wristUp,
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
// V5: flown slower and tighter (about 4.5 m/s), so the S reads under the still overhead camera in the half second it
// is on screen (at 7.7 m/s he crossed the frame in under half a second)
const SCX = (s: number) => -4.6 + 3.2 * s, SCZ = (s: number) => 0.8 + 1.0 * Math.sin(s * 3.4);
export const sCurve = (t: number, T0: number): St => {
  const px = SCX, pz = SCZ;
  const s = t - T0;
  const dx = (px(s + 0.02) - px(s - 0.02)) / 0.04, dz = (pz(s + 0.02) - pz(s - 0.02)) / 0.04;
  const yaw = yawOf(dx, dz);
  const curv = -1.0 * 3.4 * 3.4 * Math.sin(s * 3.4);
  const bank = clamp(curv * 0.9, -12, 12);
  const B = frameYPR(v3(px(s), 1.4, pz(s)), yaw, -6, bank);
  return {B, alt: 1.4, speed: Math.hypot(dx, dz), pitch: -6, roll: bank, yaw, thrust: 0.85, pos: B.o, vel: v3(dx, 0, dz), rps: 30,
    pose: pose({lean: 0.08, side: bank / 100, crouch: 0.5, bend: 12, armF: 0.5, armFs: 0.75, look: 66, nod: 10, bal: clamp(-bank / 14, -1, 1)})};
};
export const sCurvePath = (T0: number, t: number) => {
  const pts: V3[] = [];
  for (let u = T0 - 0.6; u <= t; u += 0.04) {
    const s = u - T0;
    pts.push(v3(SCX(s), 0.01, SCZ(s)));
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
    // V5: a little life in the long rides (knees, front arm and gaze drift slowly), not a held pose
    pose: pose({lean: lean(t), side: side(t), crouch: 0.44 + 0.035 * noise1(t * 0.9, 91), bend: 12, twist: 24, armF: 0.42 + 0.08 * noise1(t * 0.7, 92), armFs: 0.72, armR: 0.24 + 0.05 * noise1(t * 0.8, 93), look: 70 + 5 * noise1(t * 0.5, 94), nod: 8, thumb: 0.75, bal: clamp(-side(t) * 12, -1, 1)})};
};

// ------------------------------------------------------------------ V6: practice to flight, one continuous move
/** "ten days of practice" to "he actually flew": another morning on the riverside flat. He lifts off from rest a few
 *  metres from the water (a small practised wobble, caught at once), accelerates straight toward the river (+z), crosses
 *  the shoreline at about 1.5 s and climbs to about 4 m over the water, then carries on across (the river shot).
 *  Nose toward the river. */
export const DEP6 = {x: -40, z0: -11};
const ssI6 = (a: number, b: number, t: number) => {
  const s = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return (b - a) * (s ** 3 - s ** 4 / 2) + Math.max(0, t - b);
};
export const flight6 = (t: number, T0: number): St => {
  const s = t - T0;
  const V = 14;
  const zz = (u: number) => DEP6.z0 + V * ssI6(0.3, 1.6, u);
  const z = zz(s);
  const v = (zz(s + 0.01) - zz(s - 0.01)) / 0.02;
  const x = DEP6.x + 0.5 * Math.sin(Math.max(0, s - 1.6) * 0.8);
  const alt = REST + 1.0 * sstep(0.05, 0.55, s) + 3.0 * sstep(1.4, 2.7, s) + 0.05 * Math.sin(s * 2.1) * sstep(0.5, 1.0, s);
  const climb = (REST + 1.0 * sstep(0.05, 0.55, s + 0.02) + 3.0 * sstep(1.4, 2.7, s + 0.02) - (REST + 1.0 * sstep(0.05, 0.55, s - 0.02) + 3.0 * sstep(1.4, 2.7, s - 0.02))) / 0.04;
  // he leans into the acceleration (the board pitches nose down and the tilted thrust drives it forward)
  const lean = (u: number) => 0.03 + 0.07 * sstep(T0 + 0.2, T0 + 0.6, u) - 0.02 * sstep(T0 + 1.6, T0 + 2.2, u) + 0.012 * noise1(u * 0.9, 83);
  // the practised wobble on lift-off: one small roll, caught at once
  const wob = (u: number) => 0.022 * Math.exp(-(((u - T0 - 0.32) / 0.12) ** 2)) - 0.012 * Math.exp(-(((u - T0 - 0.55) / 0.14) ** 2)) + 0.008 * noise1(u * 1.2, 84);
  const pitch = -lag(lean, t) * 75;
  const roll = lag(wob, t) * 95;
  const B = frameYPR(v3(x, alt, z), 0, pitch, roll);
  return {B, alt, speed: v, pitch, roll, yaw: 0, thrust: 0.6 + 0.3 * sstep(0, 0.4, s), pos: B.o, vel: v3(0, climb, v), rps: 30,
    pose: pose({lean: lean(t), side: wob(t), crouch: 0.5 - 0.06 * sstep(1.0, 2.0, s) + 0.1 * Math.exp(-(((s - 0.4) / 0.2) ** 2)) + 0.03 * noise1(t * 0.9, 85), bend: 12, twist: 24,
      armF: 0.45 + 0.12 * Math.exp(-(((s - 0.45) / 0.2) ** 2)) + 0.06 * noise1(t * 0.7, 86), armFs: 0.75, armR: 0.25 + 0.05 * noise1(t * 0.8, 87), look: 68 + 4 * noise1(t * 0.5, 88), nod: 10, thumb: 0.4 + 0.4 * sstep(0, 0.4, s), bal: clamp(-wob(t) * 14, -1, 1)})};
};

// ------------------------------------------------------------------ the payoff: the last of the river and into the gorge
export const GORGE4 = {ox: 600, oz: RIVER.far};
export const payoff4 = (t: number, Tin: number): St => {
  const v = 14;
  const zz = (u: number) => GORGE4.oz + v * (u - Tin);
  const xx = (u: number) => {
    const z = zz(u);
    const g = GORGE4.ox + gcx(Math.max(0, z - GORGE4.oz));
    return z < GORGE4.oz ? g - 0.02 * (GORGE4.oz - z) ** 1.3 : g;
  };
  const x = xx(t), z = zz(t);
  const dx = (xx(t + 0.05) - xx(t - 0.05)) / 0.1;
  const yaw = yawOf(dx, v);
  const ddx = (xx(t + 0.1) - 2 * x + xx(t - 0.1)) / 0.01;
  const bank = clamp(-ddx * 1.6, -16, 16);
  const alt = 4.6 + 1.2 * sstep(Tin - 0.6, Tin + 1.2, t) + 0.15 * Math.sin(t * 1.4);
  const lean = (u: number) => 0.1 + 0.02 * noise1(u * 0.9, 71);
  const side = (u: number) => 0.02 * noise1(u * 1.1, 72);
  const pitch = -lag(lean, t) * 75 - 2;
  const roll = lag(side, t) * 95 + bank;
  const B = frameYPR(v3(x, alt, z), yaw, pitch, roll);
  const sd = side(t) - bank / 300;
  return {B, alt, speed: v, pitch, roll, yaw, thrust: 0.9, pos: B.o, vel: v3(dx, 0, v), rps: 30,
    pose: pose({lean: lean(t), side: sd, crouch: 0.48 + 0.035 * noise1(t * 0.9, 95), bend: 13, twist: 24, armF: 0.5 + 0.08 * noise1(t * 0.7, 96), armFs: 0.9, armR: 0.3 + 0.05 * noise1(t * 0.8, 97), look: 70 + 5 * noise1(t * 0.5, 98), nod: 8, thumb: 0.8, bal: clamp(-sd * 12, -1, 1)})};
};

/** the workshop: the inventor standing back from the test stand with the remote */
export const inventor4 = (react: number, flinch: number): PilotPose =>
  pose({lean: -0.05 * react, side: -0.06 * react, crouch: 0.12 + 0.2 * react, bend: 2 - 6 * react, twist: 30, look: 10 + 6 * react, nod: 8 - 6 * react, armF: 0.2 + 0.6 * flinch, armFs: 0.3 + 0.4 * flinch, armR: 0.2, remote: 1 - 0.4 * flinch, thumb: 0.5, bal: 0.5 * flinch, level: 1, hipLead: 0.3});
