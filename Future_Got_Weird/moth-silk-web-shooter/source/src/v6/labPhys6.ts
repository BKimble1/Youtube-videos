// V5 lab kinematics: the nozzle (on its stand, picked up, aimed, pulled, lifted, carried, lowered), the fibre and
// the blade, as pure functions of the frame. Physical beats:
// - the fibre forms at the outlet and extends into open space, then reaches out to the blade's exposed end;
// - contact: the sticky end squashes on the steel, a small wave runs back along the fibre; the slack draws out;
// - the pull: the hand draws the nozzle back; the fibre is taut and trembles while the buried blade resists (it
//   rocks a little, the sand cracks) until it breaks free and slides out along its axis, sand falling off it;
// - the lift: the blade rises well clear (about three blade lengths), hangs from the one fibre, swings and slowly
//   turns (it is a flat steel blade on a single thread);
// - the retrieval: carried over the tray, lowered until its tip meets the floor and it lies down; the fibre goes slack.
import {add, clamp, len, lerp, lerpV, mul, norm, sub, V} from './dc/math';
import {BENCH_Y, BLADE_E, BLADE_LEN, BLADE_T, LT6, NOZ, SAND} from './labWorld6';

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const ss = (f: number, a: number, b: number) => sm((f - a) / (b - a));
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const N_AXIS = norm(sub(NOZ.tip, NOZ.rear));
/** length of the strand extruded in the close view before it leaves (world px) */
export const EXT0 = 64;
export const N_LEN = len(sub(NOZ.tip, NOZ.rear));
/** where the hand grips the nozzle, from its rear end (Lab6 gripNozzle) */
export const GRIP_FROM_REAR = 14;
export const FLOOR = BENCH_Y - 6;
const AX0 = norm(sub(BLADE_E, BLADE_T));
const BURIED = BLADE_LEN * 0.68;
/** the attachment: on the blade's exposed end, just below its end */
export const A0 = add(BLADE_E, mul(AX0, -4));

/** the nozzle's tip and axis: resting on its stand, lifted into the hand's aim, drawn back, lifted, carried */
const TIP_STAND = NOZ.tip;
const TIP_AIM: V = {x: 606, y: 1184};
const TIP_PULL: V = {x: 662, y: 1132};
/** V6: the top of the lift, within the scientist's reach (his hand stays on the grip) */
const TIP_TOP: V = {x: 532, y: 738};
/** the sand's surface, where the blade is set back down after the strength beat */
export const L_F = len(sub(TIP_PULL, A0));
/** the fibre's working length once the blade hangs (the same fibre: no stretch) */
const L_HANG = L_F;
const keyV = (f: number, keys: [number, V, ((a: number, b: number, c: number) => number)?][]): V => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerpV(keys[i - 1][1], keys[i][1], (keys[i][2] ?? ss)(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
export const tipAt = (f: number): V => {
  // the hand's small tremor of effort while it pulls against the buried blade
  const effort = ss(f, LT6.pull0 + 4, LT6.pull0 + 10) * (1 - ss(f, LT6.breakFree, LT6.breakFree + 4));
  const tremor = {x: 1.2 * Math.sin(f * 2.3) * effort, y: 0.9 * Math.sin(f * 3.1 + 1) * effort};
  if (f > LT6.breakFree && f < LT6.liftTop) return liftPath(f);
  return add(
    keyV(f, [
      [LT6.nozGrip, TIP_STAND],
      [LT6.nozLift1, TIP_AIM],
      [LT6.pull0, TIP_AIM],
      // drawn back as far as the fibre allows; then held against the resistance
      [LT6.pull0 + 10, add(TIP_AIM, mul(sub(TIP_PULL, TIP_AIM), 0.9))],
      [LT6.breakFree, TIP_PULL],
      // the release and the high lift: liftPath (below)
      [LT6.liftTop, TIP_TOP],
      [LT6.tug - 6, add(TIP_TOP, {x: -2, y: -3})],
      // V6: a small tightening tug as the strength is named, then held
      [LT6.tug, add(TIP_TOP, {x: -3, y: -13}), ss5],
      [LT6.tug + 12, add(TIP_TOP, {x: -4, y: -8})],
      [LT6.toDevice, add(TIP_TOP, {x: -6, y: -10})],
    ]),
    tremor,
  );
};
/** the nozzle's direction (degrees, tip direction): resting, aimed, slightly raised while lifting, pointed down at
 *  the tray after the release (for the outlet match into the wrist shooter) */
const ANG_STAND = (Math.atan2(N_AXIS.y, N_AXIS.x) * 180) / Math.PI;
export const nozAngAt = (f: number, endAng: number) => {
  const raise = -10 * ss(f, LT6.breakFree, LT6.liftTop);
  const aim = lerp(ANG_STAND, ANG_STAND - 3, ss(f, LT6.nozGrip, LT6.nozLift1));
  let a = aim + raise;
  a = lerp(a, endAng, ss(f, LT6.release, LT6.toDevice - 4));
  return a;
};

/** blade during the pull-out (u 0..1): buried tip sliding out along the axis, the exposed end rising */
/** one continuous move from the pull to the top of the lift: the hand draws up and back with the fibre taut while
 *  the blade slides out of the sand, and keeps rising, travelling in over the blade (a cubic through 4 points) */
const liftPath = (f: number): V => {
  const u = ss(f, LT6.breakFree, LT6.liftTop);
  const P1: V = {x: 600, y: 1000};
  const P2: V = {x: 520, y: 800};
  const a = (1 - u) ** 3;
  const b = 3 * (1 - u) ** 2 * u;
  const c = 3 * (1 - u) * u * u;
  const d = u ** 3;
  return {x: a * TIP_PULL.x + b * P1.x + c * P2.x + d * TIP_TOP.x, y: a * TIP_PULL.y + b * P1.y + c * P2.y + d * TIP_TOP.y};
};
const TH0 = Math.atan2(AX0.y, AX0.x);
const TH1 = (-82 * Math.PI) / 180;
const bladeOut = (u: number, rock: number) => {
  const T = add(BLADE_T, mul(AX0, BURIED * 1.05 * u));
  const th = lerp(TH0, TH1, u) + rock;
  const E = add(T, {x: Math.cos(th) * BLADE_LEN, y: Math.sin(th) * BLADE_LEN});
  const A = add(E, mul({x: -Math.cos(th), y: -Math.sin(th)}, 4));
  return {T, E, A};
};

export type LabPhys = {
  tip: V;
  ang: number;
  fibre: {from: V; to: V; c?: V; twang?: number; sag: number; on: boolean; fly: number; vib: number; wave: number};
  bladeT: V;
  bladeE: V;
  /** apparent width of the blade (cos of its turn about the vertical while it hangs) */
  bladeW: number;
  free: boolean;
  contactSquash: number;
  /** sand cracking round the buried blade (0..1) */
  crack: number;
};

/** the hanging blade as a pendulum on the fibre (length L_HANG) whose pivot is the moving outlet: integrated once
 *  from the moment it leaves the sand (starting at the fibre's actual angle then), in quarter-frame steps */
const G = 21.8; // px / frame^2 at 20 px per cm, 30 fps
let SWING: number[] | null = null;
const swingAt = (f: number) => {
  if (!SWING) {
    SWING = [];
    const A = bladeOut(1, 0).A;
    const p0 = tipAt(LT6.out);
    let th = Math.atan2(A.x - p0.x, A.y - p0.y);
    let w = 0;
    const n = 4;
    const acc = (t: number) => {
      const e = 0.5;
      const a = tipAt(t - e);
      const b = tipAt(t);
      const c = tipAt(t + e);
      return {x: (a.x - 2 * b.x + c.x) / (e * e), y: (a.y - 2 * b.y + c.y) / (e * e)};
    };
    for (let fr = LT6.out; fr <= LT6.end + 1; fr++) {
      SWING.push(th);
      for (let i = 0; i < n; i++) {
        const t = fr + i / n;
        const a = acc(t);
        // strongly damped as it drags clear of the sand, then a light air damping
        const c = 0.09 + 0.35 * (1 - ss(t, LT6.out, LT6.out + 20));
        const al = (-a.x * Math.cos(th) - (G - a.y) * Math.sin(th)) / L_HANG - c * w;
        w += al / n;
        th += w / n;
      }
    }
  }
  const i = Math.max(0, f - LT6.out);
  const i0 = Math.min(SWING.length - 2, Math.floor(i));
  return lerp(SWING[i0], SWING[i0 + 1], i - i0);
};

export const labPhys = (f: number, endAng = ANG_STAND): LabPhys => {
  const ang = nozAngAt(f, endAng);
  // V6: from the release the hand turns the nozzle about its grip (not about the tip), so it never leaves the hand
  let tip = tipAt(f);
  if (f > LT6.release) {
    const a0 = (nozAngAt(LT6.release, endAng) * Math.PI) / 180;
    const a1 = (ang * Math.PI) / 180;
    const t0 = tipAt(LT6.release);
    const r = N_LEN - GRIP_FROM_REAR;
    const G = {x: t0.x - Math.cos(a0) * r, y: t0.y - Math.sin(a0) * r};
    const drift = sub(tipAt(f), t0);
    tip = add(add(G, {x: Math.cos(a1) * r, y: Math.sin(a1) * r}), drift);
  }
  let bT = BLADE_T;
  let bE = BLADE_E;
  let A = A0;
  let free = false;
  let bladeW = 1;
  // the resistance: the blade rocks a little and the sand cracks before it gives
  const resist = ss(f, LT6.pull0 + 6, LT6.pull0 + 14) * (1 - ss(f, LT6.breakFree, LT6.breakFree + 2));
  const rock = resist * 0.035 * Math.sin(f * 1.9);
  const crack = ss(f, LT6.pull0 + 10, LT6.breakFree);
  if (f >= LT6.pull0 && f < LT6.out) {
    const u = ss(f, LT6.breakFree, LT6.out) * 1 + 0.03 * resist;
    const b = bladeOut(u, rock);
    bT = b.T;
    bE = b.E;
    A = b.A;
    free = u > 0.7;
  }
  if (f >= LT6.out) {
    // it hangs from the fibre: a damped swing from the moment it came out, the pivot following the nozzle
    const o = bladeOut(1, 0);
    const swing = swingAt(f);
    const dir = {x: Math.sin(swing), y: Math.cos(swing)};
    A = add(tip, mul(dir, L_HANG));
    const k = ss(f, LT6.out, LT6.out + 10);
    const ax = norm(lerpV(norm(sub(o.T, o.A)), dir, k));
    bE = add(A, mul(ax, -4));
    bT = add(A, mul(ax, BLADE_LEN - 4));
    free = true;
    // a slow turn about the fibre while it hangs (a flat blade on one thread)
    const turn = ss(f, LT6.out + 6, LT6.liftTop + 20) * (1 - ss(f, LT6.release, LT6.toDevice));
    bladeW = Math.cos(turn * 1.1 * Math.sin((f - LT6.out) / 22));
  }

  // the fibre
  const fly = clamp((f - LT6.exit) / (LT6.fcontact - LT6.exit));
  let fibre: LabPhys['fibre'] = {from: tip, to: tip, sag: 0, on: false, fly, vib: 0, wave: 0};
  if (f >= LT6.exit && f < LT6.fcontact) {
    // it extends into open space slowly as it forms, then reaches out toward the blade (accelerating)
    // V6: it keeps forming straight out along the needle's axis (continuing the jet from the close view), then
    // crosses the rest of the way to the blade in an accelerating dash, still leaving the outlet along the axis
    const ar = (ang * Math.PI) / 180;
    const d = {x: Math.cos(ar), y: Math.sin(ar)};
    const LA = EXT0 + 34;
    const FA = 0.36;
    let head: V;
    let c: V;
    let sag: number;
    if (fly < FA) {
      const u = fly / FA;
      head = add(tip, mul(d, lerp(EXT0, LA, u * (2 - u) * 0.5 + u * 0.5)));
      c = lerpV(tip, head, 0.5);
      sag = 1.2 * u;
    } else {
      const q = ((fly - FA) / (1 - FA)) ** 1.8;
      const hA = add(tip, mul(d, LA));
      head = add(lerpV(hA, A0, q), {x: 0, y: 7 * Math.sin(q * Math.PI)});
      c = lerpV(add(tip, mul(d, LA * 0.55)), lerpV(tip, head, 0.5), q ** 1.3);
      sag = 1.2 * (1 - q);
    }
    fibre = {from: tip, to: head, c, sag, on: true, fly, vib: 0, wave: 0};
  } else if (f >= LT6.fcontact) {
    let sag = lerp(18, 2, ss(f, LT6.fcontact + 4, LT6.settle1));
    sag = lerp(sag, 0, ss(f, LT6.pull0, LT6.pull0 + 8));
    const vib = resist * 2.6 + 0.8 * Math.exp(-(f - LT6.breakFree) / 6) * (f >= LT6.breakFree ? 1 : 0);
    // the wave from the impact running back along the fibre
    const wave = f < LT6.fcontact + 12 ? (f - LT6.fcontact) / 12 : 0;
    // V6: the elastic take-up as the pull starts (the slack line springs straight, overshoots, rings down) and a
    // smaller one at the tightening tug
    const e1 = f >= LT6.pull0 ? 6 * Math.exp(-(f - LT6.pull0) / 4.5) * Math.sin((f - LT6.pull0) * 1.15) : 0;
    const e2 = f >= LT6.tug ? 2.2 * Math.exp(-(f - LT6.tug) / 4) * Math.sin((f - LT6.tug) * 1.5) : 0;
    fibre = {from: tip, to: A, sag, on: true, fly: 1, vib, wave, twang: e1 + e2};
  }
  const contactSquash = f >= LT6.fcontact ? Math.min(1, (f - LT6.fcontact) / 3) : 0;
  return {tip, ang, fibre, bladeT: bT, bladeE: bE, bladeW, free, contactSquash, crack};
};

/** sand falling off the blade as the buried part comes out; a few grains hop as it cracks */
export const grainsAt = (f: number) => {
  const out: {p: V; r: number; c: string}[] = [];
  for (let i = 0; i < 46; i++) {
    const h = ((i * 7919) % 1000) / 1000;
    const h2 = ((i * 4241) % 1000) / 1000;
    const fs = LT6.breakFree - 2 + h * (LT6.out - LT6.breakFree + 6);
    if (f < fs) continue;
    const s = labPhys(fs);
    const along = 0.05 + h2 * 0.6;
    const p0 = lerpV(s.bladeT, s.bladeE, along);
    const t = (f - fs) / 30;
    const y = p0.y + 0.5 * 2600 * t * t;
    if (y > SAND.surf + 2) continue;
    out.push({p: {x: p0.x + (h - 0.5) * 8 * t * 30, y}, r: 1.1 + h2 * 1.1, c: i % 3 ? '#C9A866' : '#E9CE95'});
  }
  for (let i = 0; i < 10; i++) {
    const h = ((i * 3571) % 1000) / 1000;
    const f0 = LT6.pull0 + 10 + h * (LT6.breakFree - LT6.pull0 - 8);
    const t = (f - f0) / 30;
    if (t < 0 || t > 0.3) continue;
    const x = BLADE_T.x + 20 + (h - 0.5) * 70;
    const vy = -180 - 120 * h;
    const y = SAND.surf - 2 + vy * t + 0.5 * 2600 * t * t;
    if (y > SAND.surf) continue;
    out.push({p: {x: x + (h - 0.5) * 60 * t, y}, r: 1.2, c: '#E9CE95'});
  }
  return out;
};
