// The schematic car's hardware, motion and gas use, as one deterministic model (all times are film seconds).
// Everything here is in ONE car-local frame (as companion3/Car3): facing +x, contact line y = 0, up is -y, 100 units
// ~ 1 m. The scene places that frame once (translate to the height, mirror to face left like the real car in Tesla's
// side replay, pitch about the centre of mass), so the body, the nozzle mounts, the plume origins and the
// centre-of-mass marker can never drift apart.
//   Hardware (generic, not Tesla's layout): a tank between the wheels, one valve under it, a manifold along the sill,
//   two downward lift nozzles (one on the sill behind the front wheel, one in a pod bolted under the rear overhang) and
//   a small downward nose thruster in the front bumper. Each nozzle hangs from a mount on the underbody; its exit is the
//   plume's origin.
//   Height: the car arrives from the footage still descending; its jets brake it to a hover, it is held by short bursts
//   (on at 2.25 x its weight, then off: it bobs and each burst spends gas), it hovers on steady jets (thrust = weight),
//   and it descends toward the ground near the end.
//   Pitch: the rear lift jet runs stronger, so the lift misses the centre of mass and the car turns nose-down; one
//   burst from the nose thruster stops the turn and sends it back; the lift jets trim briefly (rear a little stronger)
//   to stop it level. Kept slow and small enough to read (not to scale).
//   Gas: markers in the tank leave for whichever nozzle is firing; a burst takes a few, a hover a steady trickle.
import {T} from './data';

export const G = 981;
/** Nozzle exits (plume origins). */
export const NOZ = {
  front: {x: 62, y: -13},                          // on the sill, behind the front wheel
  rear: {x: -186, y: -55},                         // pod under the rear overhang, behind the rear wheel
  nose: {x: 190, y: -26},                          // small pitch thruster in the front bumper
};
export type NozKey = keyof typeof NOZ;
/** Mounts: each housing's top edge sits 3 units inside the underbody it is bolted to (values at x - w and x + w, from
 *  the traced outline: sill bottom -22.9..-24.0, rear overhang -77.1..-73.0, bumper -34.0..-34.5), then the housing
 *  bottom, its half width, the bell's throat and exit half widths. */
export const MOUNT: Record<NozKey, {top: [number, number]; bot: number; w: number; bell: number; exit: number}> = {
  front: {top: [-26, -27], bot: -19, w: 11, bell: 6, exit: 9},
  rear: {top: [-80, -76], bot: -66, w: 10, bell: 6, exit: 9},
  nose: {top: [-37, -37.5], bot: -31, w: 7, bell: 3.5, exit: 5.5},
};
/** Illustrative centre of mass: midway between the two lift jets, so equal jets give no turn. */
export const CG = {x: (NOZ.front.x + NOZ.rear.x) / 2, y: -52};

// ---------------------------------------------------------------- vertical motion
export const H_HOVER = 400;
export const H_LOW = 100;
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
export const DESC0 = T.tooEnd + 0.2, DESC1 = T.gravel - 0.3;

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
// segments of constant angular acceleration (deg/s^2), built so the car ends level
type Seg = {t0: number; t1: number; a: number};
const W1 = 4;                                     // deg/s nose-down once the offset thrust has acted
const W2 = 6;                                     // deg/s nose-up after the corrective burst
const segs: Seg[] = [];
const A0 = T.misses + 0.03, A1 = T.mass + 0.2;
segs.push({t0: A0, t1: A1, a: W1 / (A1 - A0)});                    // offset lift thrust: nose-down torque
const C0 = T.thrusters + 0.04, C1 = C0 + 0.45;
segs.push({t0: C0, t1: C1, a: -(W1 + W2) / (C1 - C0)});            // nose thruster: stops the turn and sends it back
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
// the trim starts when the returning car is one stopping distance from level
{
  const after = pitchRaw(C1, segs);
  const dur = 0.35;
  const stopTh = 0.5 * W2 * dur;                  // degrees turned while stopping
  const g0 = C1 + (after.th - stopTh) / W2;
  segs.push({t0: g0, t1: g0 + dur, a: W2 / dur});
}
export const PITCH_SEGS = segs;
/** Nose-down pitch (deg) and its rate (deg/s). */
export const pitchAt = (t: number) => pitchRaw(t, segs);
export const SETTLED = segs[2].t1;

// ---------------------------------------------------------------- nozzle outputs (0..~2, 1 = its share of a hover)
const win = (t: number, a: number, b: number, r = 0.04) => Math.max(0, Math.min(1, (t - a) / r, (b - t) / r));
const IMB = 0.42;                                  // rear stronger / front weaker while the thrust misses the centre
const TRIM = 0.3;                                  // the brief rear-stronger trim that stops the return level
export const offsetAt = (t: number) => win(t, segs[0].t0, segs[0].t1, 0.12);
export const trimAt = (t: number) => win(t, segs[2].t0, segs[2].t1, 0.08);
export const nozzleAt = (t: number) => {
  const lift = liftAt(t);
  const k = IMB * offsetAt(t) + TRIM * trimAt(t);
  return {
    front: lift * (1 - k),
    rear: lift * (1 + k),
    nose: 1.6 * win(t, segs[1].t0, segs[1].t1, 0.05),
  };
};

// ---------------------------------------------------------------- gas reserve (markers)
export const TANK_SMALL = {x0: -78, x1: 38, y0: -96, y1: -70};
export const TANK_BIG = {x0: -94, x1: 54, y0: -100, y1: -64};
export const GROW = {t0: T.bigger + 0.08, t1: T.bigger + 0.85};
export const N_SMALL = 24;
export const N_BIG = 18;                           // extra markers the bigger tank holds
export type Dot = {u: number; v: number; born: number; leave: number; to: NozKey};
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// leave events: [time, nozzle]
const events: [number, NozKey][] = [];
const trickle = (a: number, b: number, rate: number) => {
  for (let t = a, k = 0; t < b; t += 1 / rate, k++) events.push([t, k % 2 ? 'rear' : 'front']);
};
trickle(T.swap + 0.9, BURST_SPAN[0] - 0.05, 1.4);
BURSTS.forEach(([a], i) => {
  events.push([a + 0.01, 'front']);
  if (i > 0) events.push([a + 0.05, 'front'], [a + 0.03, 'rear']);
});
trickle(BURST_SPAN[1] + 0.3, GROW.t0, 0.9);
trickle(GROW.t1 + 0.2, segs[0].t0, 0.8);
trickle(segs[0].t0 + 0.1, segs[0].t1, 2.2);         // offset: mostly the stronger rear jet
for (let i = 0; i < events.length; i++) if (events[i][0] >= segs[0].t0 && events[i][0] < segs[0].t1 && i % 3) events[i][1] = 'rear';
events.push([segs[1].t0 + 0.02, 'nose'], [segs[1].t0 + 0.14, 'nose'], [segs[1].t0 + 0.26, 'nose']);
events.push([segs[2].t0 + 0.04, 'rear']);
trickle(segs[1].t1 + 0.3, DESC1, 0.7);
events.sort((a, b) => a[0] - b[0]);
// markers: homes on a jittered grid in tank-normalised coordinates; the ones nearest the outlet leave first
export const OUT_U = 0.5;
const mk = (n: number, cols: number, born: number, seed: number) => Array.from({length: n}, (_, i) => {
  const rows = Math.ceil(n / cols), r = Math.floor(i / cols), c = i % cols;
  return {u: (c + 0.5 + (rnd(seed + i) - 0.5) * 0.45) / cols, v: (r + 0.5 + (rnd(seed + i + 77) - 0.5) * 0.4) / rows, born, leave: Infinity, to: 'front' as NozKey};
});
const small = mk(N_SMALL, 8, -1, 3);
const extra = mk(N_BIG, 9, GROW.t0 + 0.2, 101);
// the extra markers sit between the old ones (two rows, offset half a cell)
extra.forEach((d, i) => { d.v = (Math.floor(i / 9) + 1) / 3 + (rnd(i + 950) - 0.5) * 0.08; d.u = ((i % 9) + 0.5 + (rnd(i + 900) - 0.5) * 0.3) / 9; });
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
export const DOT_TRAVEL = 0.38;                   // seconds from the tank to the nozzle exit
/** Share of the current tank's capacity still in it (drives the gas tint; no number is ever shown). */
export const reserveAt = (t: number) => {
  const cap = t < GROW.t0 + 0.2 ? N_SMALL : N_SMALL + N_BIG;
  return DOTS.filter((d) => d.born <= t && d.leave > t).length / cap;
};
/** Tank rectangle at time t (grows on "Bigger tanks"). */
export const tankAt = (t: number) => {
  const u = smooth(Math.max(0, Math.min(1, (t - GROW.t0) / (GROW.t1 - GROW.t0))));
  const L = (a: number, b: number) => a + (b - a) * u;
  return {x0: L(TANK_SMALL.x0, TANK_BIG.x0), x1: L(TANK_SMALL.x1, TANK_BIG.x1), y0: L(TANK_SMALL.y0, TANK_BIG.y0), y1: L(TANK_SMALL.y1, TANK_BIG.y1), grow: u};
};
export const VALVE = {x: -20, y: -55};
export const MANIFOLD_Y = -33;
/** Gas path from the tank outlet through the valve to a nozzle exit (car-local). The pipes run inside the sill and,
 *  for the rear pod and the nose thruster, over the wheel arches. */
export const pathTo = (to: NozKey, tank: {x0: number; x1: number; y1: number}): [number, number][] => {
  const ox = tank.x0 + (tank.x1 - tank.x0) * OUT_U;
  const head: [number, number][] = [[ox, tank.y1], [VALVE.x, VALVE.y], [VALVE.x, MANIFOLD_Y]];
  if (to === 'front') return [...head, [NOZ.front.x, MANIFOLD_Y], [NOZ.front.x, NOZ.front.y]];
  if (to === 'rear') return [...head, [-100, MANIFOLD_Y], [-100, -95], [NOZ.rear.x, -95], [NOZ.rear.x, NOZ.rear.y]];
  return [...head, [92, MANIFOLD_Y], [92, -90], [158, -90], [174, -79], [NOZ.nose.x, -52], [NOZ.nose.x, NOZ.nose.y]];
};
