// The schematic car's motion and gas use, as one deterministic model (all times are film seconds).
//   Height: the car arrives from the footage still descending; its jets brake it to a hover (thrust slightly above
//   weight), it holds on steady jets (thrust = weight), it is held by short bursts (twice its weight for a moment, then
//   nothing: it bobs, and each burst spends gas), it holds again, and it descends toward the ground near the end.
//   Pitch: offset thrust (the rear lift jet stronger than the front) turns it nose-down about its centre of mass; the
//   rotation continues once the jets rebalance; a nose thruster stops it; a second nose pulse turns it back; a tail
//   pulse stops it level. The rotation is kept small and slow so it can be read (not to scale).
//   Gas: dots in the tank leave for whichever nozzle is firing; a burst takes a few, a hold takes a steady trickle.
// Car-local frame (as companion3/Car3): facing +x, contact line y = 0, up is -y, 100 units ~ 1 m. On screen the car is
// mirrored to face left, like the real car in Tesla's side replay.
import {T} from './data';

export const G = 981;
export const CG = {x: -65, y: -58};                 // illustrative centre of mass (between the two lift jets)
export const NOZ = {
  front: {x: 45, y: -23},                          // lift jets where the replay shows plumes: behind the front wheel...
  rear: {x: -175, y: -36},                         // ...and near the tail
  nose: {x: 190, y: -38},                          // small pitch thrusters ("other thrusters")
  tail: {x: -207, y: -46},
};
export type NozKey = keyof typeof NOZ;

// ---------------------------------------------------------------- vertical motion
export const H_HOVER = 400;
export const H_LOW = 120;
const BRAKE_T0 = T.swap - 0.02;
const V0 = -135;                                    // units/s (down) at the swap, matching the replay's descent on screen
const BRAKE_DUR = 1.05;
/** Bursts: a regular train (on 0.16 s, off 0.20 s) with a half pulse in and a half gap out. While on, the jets give
 *  1 + gap/on = 2.25 x the weight, so the train averages to the weight: the car bobs a few units and ends where it
 *  started. The full pulses land on "burst", "uses", "some", "up". */
const ON = 0.16, GAP = 0.2, P1 = T.burst - 0.04;
export const BURSTS: [number, number][] = [[P1 - GAP - ON / 2, P1 - GAP], ...[0, 1, 2, 3].map((k): [number, number] => [P1 + k * (ON + GAP), P1 + k * (ON + GAP) + ON])];
const BURST_SPAN: [number, number] = [BURSTS[0][0], BURSTS[4][1] + GAP / 2];
const BURST_K = 1 + GAP / ON;
const DESC0 = T.fire - 0.3, DESC1 = T.gravel - 0.05;

/** Thrust over weight from the lift jets (before the descent). */
const liftRatio = (t: number) => {
  if (t < BRAKE_T0) return 1;
  if (t < BRAKE_T0 + BRAKE_DUR) return 1 - V0 / BRAKE_DUR / G;
  if (t >= BURST_SPAN[0] && t < BURST_SPAN[1]) return BURSTS.some(([a, b]) => t >= a && t < b) ? BURST_K : 0;
  return 1;
};
// integrate once (dt = 1 ms) from the swap to the start of the descent
const DT = 0.001;
const simT0 = BRAKE_T0, simT1 = DESC0;
const Hs: number[] = [];
{
  let h = 0, v = V0;
  for (let t = simT0; t <= simT1 + DT; t += DT) {
    Hs.push(h);
    v += G * (liftRatio(t) - 1) * DT;
    if (t > BURST_SPAN[1] && Math.abs(v) > 0) v = 0; // the steady jets hold whatever height the bursts left
    h += v * DT;
  }
}
const relAt = (t: number) => Hs[Math.max(0, Math.min(Hs.length - 1, Math.round((t - simT0) / DT)))];
const H_END = relAt(simT1);
const H0 = H_HOVER - relAt(BURST_SPAN[0] - 0.01);   // so the hold before the bursts sits at H_HOVER
const smooth = (u: number) => u * u * (3 - 2 * u);
/** Height of the contact line above the ground. */
export const heightAt = (t: number) => {
  if (t <= simT0) return H0 + V0 * (t - simT0);
  if (t <= simT1) return H0 + relAt(t);
  const top = H0 + H_END;
  if (t >= DESC1) return H_LOW;
  return top + (H_LOW - top) * smooth((t - DESC0) / (DESC1 - DESC0));
};
/** Thrust / weight of the lift jets together (drives plume size); the descent's is from its acceleration. */
export const liftAt = (t: number) => {
  if (t > DESC0 && t < DESC1) {
    const e = 1e-3;
    const a = (heightAt(t + e) - 2 * heightAt(t) + heightAt(t - e)) / (e * e);
    return Math.max(0.55, 1 + a / G);
  }
  return liftRatio(t);
};

// ---------------------------------------------------------------- pitch
const P = {a0: T.misses + 0.03, a1: T.mass + 0.2, c0: T.thrusters + 0.05, c1: T.thrusters + 0.45};
// segments of constant angular acceleration (deg/s^2), built so the car ends level
type Seg = {t0: number; t1: number; a: number};
const W1 = 3;                                     // deg/s after the offset thrust
const W2 = -8;                                    // deg/s after the second nose pulse
const segs: Seg[] = [];
segs.push({t0: P.a0, t1: P.a1, a: W1 / (P.a1 - P.a0)});            // offset lift thrust: nose-down torque
segs.push({t0: P.c0, t1: P.c1, a: -W1 / (P.c1 - P.c0)});           // nose thruster: stops the turn
const e0 = T.corrections - 0.39, e1 = e0 + 0.3;
segs.push({t0: e0, t1: e1, a: W2 / (e1 - e0)});                    // nose thruster again: turns it back
const pitchRaw = (t: number, list: Seg[]) => {
  let th = 0, w = 0, tc = list.length ? Math.min(list[0].t0, t) : t;
  for (const s of list) {
    if (t <= s.t0) { th += w * (t - tc); return {th, w}; }
    th += w * (s.t0 - tc); tc = s.t0;
    const d = Math.min(t, s.t1) - s.t0;
    th += w * d + 0.5 * s.a * d * d; w += s.a * d; tc = s.t0 + d;
    if (t <= s.t1) return {th, w};
  }
  th += w * (t - tc);
  return {th, w};
};
// the tail pulse starts when the coasting car is one pulse-width of rotation from level
{
  const after = pitchRaw(e1, segs);
  const dur = 0.3;
  const stopTh = -0.5 * W2 * dur;                  // degrees turned while stopping
  const g0 = e1 + (after.th - stopTh) / -W2;
  segs.push({t0: g0, t1: g0 + dur, a: -W2 / dur});
}
export const PITCH_SEGS = segs;
/** Nose-down pitch (deg) and its rate (deg/s). */
export const pitchAt = (t: number) => pitchRaw(t, segs);

// ---------------------------------------------------------------- nozzle outputs (0..~2, 1 = its share of a hover)
const win = (t: number, a: number, b: number, r = 0.04) => Math.max(0, Math.min(1, (t - a) / r, (b - t) / r));
const IMB = 0.42;                                  // rear stronger / front weaker while the thrust misses the centre
const offsetAmt = (t: number) => win(t, segs[0].t0, segs[0].t1, 0.12);
export const offsetAt = offsetAmt;
export const nozzleAt = (t: number) => {
  const lift = liftAt(t);
  const k = IMB * offsetAmt(t);
  return {
    front: lift * (1 - k),
    rear: lift * (1 + k),
    nose: win(t, segs[1].t0, segs[1].t1) + win(t, segs[2].t0, segs[2].t1),
    tail: win(t, segs[3].t0, segs[3].t1),
  };
};

// ---------------------------------------------------------------- gas reserve (dots)
export const TANK_SMALL = {x0: -120, x1: 68, y0: -97, y1: -70};
export const TANK_BIG = {x0: -152, x1: 108, y0: -99, y1: -61};
export const GROW = {t0: T.bigger + 0.05, t1: T.bigger + 0.75};
export const N_SMALL = 34;
export const N_BIG = 30;                           // extra dots the bigger tank brings
export type Dot = {u: number; v: number; born: number; leave: number; to: NozKey};
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// leave events: [time, nozzle]
const events: [number, NozKey][] = [];
const trickle = (a: number, b: number, rate: number, alt = true) => {
  for (let t = a, k = 0; t < b; t += 1 / rate, k++) events.push([t, alt && k % 2 ? 'rear' : 'front']);
};
trickle(T.swap + 0.7, BURST_SPAN[0] - 0.05, 2.4);
for (const [a] of BURSTS) events.push([a + 0.01, 'front'], [a + 0.03, 'rear']);
trickle(BURST_SPAN[1] + 0.05, GROW.t0, 1.4);
trickle(GROW.t1 + 0.1, T.then + 0.4, 1.6);
trickle(T.then + 0.4, segs[0].t0, 1.2);
trickle(segs[0].t0, segs[0].t1, 2.4, false);       // offset: mostly the stronger rear jet
for (let i = 0; i < events.length; i++) if (events[i][0] >= segs[0].t0 && events[i][0] < segs[0].t1 && i % 3) events[i][1] = 'rear';
trickle(segs[0].t1, T.fire - 0.3, 1.2);
events.push([segs[1].t0 + 0.02, 'nose'], [segs[1].t0 + 0.14, 'nose']);
events.push([segs[2].t0 + 0.02, 'nose'], [segs[2].t0 + 0.14, 'nose']);
events.push([segs[3].t0 + 0.02, 'tail'], [segs[3].t0 + 0.14, 'tail']);
events.sort((a, b) => a[0] - b[0]);
// dots: homes on a jittered grid in tank-normalised coordinates; the ones nearest the outlet leave first
const OUT_U = 0.52;
const mk = (n: number, born: number, seed: number) => Array.from({length: n}, (_, i) => {
  const cols = 9, r = Math.floor(i / cols), c = i % cols;
  return {u: (c + 0.5 + (rnd(seed + i) - 0.5) * 0.7) / cols, v: (r + 0.5 + (rnd(seed + i + 77) - 0.5) * 0.6) / Math.ceil(n / cols), born, leave: Infinity, to: 'front' as NozKey};
});
const small = mk(N_SMALL, -1, 3);
const extra = mk(N_BIG, GROW.t0 + 0.15, 101);
// spread the extra dots over the bigger tank without piling on the old ones
extra.forEach((d, i) => { d.u = (i % 10 + 0.5 + (rnd(i + 900) - 0.5) * 0.6) / 10; d.v = (Math.floor(i / 10) + 0.5 + (rnd(i + 950) - 0.5) * 0.5) / 3; });
export const DOTS: Dot[] = [...small, ...extra];
for (const [t, to] of events) {
  let best = -1, bd = Infinity;
  DOTS.forEach((d, i) => {
    if (d.leave !== Infinity || d.born > t) return;
    const dist = Math.hypot(d.u - OUT_U, (1 - d.v) * 0.6);
    if (dist < bd) { bd = dist; best = i; }
  });
  if (best >= 0) { DOTS[best].leave = t; DOTS[best].to = to; }
}
export const DOT_TRAVEL = 0.42;                   // seconds from the tank to the nozzle exit
/** Tank rectangle at time t (grows on "Bigger tanks"). */
export const tankAt = (t: number) => {
  const u = smooth(Math.max(0, Math.min(1, (t - GROW.t0) / (GROW.t1 - GROW.t0))));
  const L = (a: number, b: number) => a + (b - a) * u;
  return {x0: L(TANK_SMALL.x0, TANK_BIG.x0), x1: L(TANK_SMALL.x1, TANK_BIG.x1), y0: L(TANK_SMALL.y0, TANK_BIG.y0), y1: L(TANK_SMALL.y1, TANK_BIG.y1), grow: u};
};
export const VALVE = {x: -22, y: -55};
export const MANIFOLD_Y = -44;
/** Gas path from the tank outlet to a nozzle exit (car-local). */
export const pathTo = (to: NozKey, tank: {x0: number; x1: number; y1: number}): [number, number][] => {
  const ox = tank.x0 + (tank.x1 - tank.x0) * OUT_U;
  const n = NOZ[to];
  const small = to === 'nose' || to === 'tail';
  const my = small ? MANIFOLD_Y - 6 : MANIFOLD_Y;
  return [[ox, tank.y1], [VALVE.x, VALVE.y], [VALVE.x, my], [n.x, my], [n.x, n.y]];
};
