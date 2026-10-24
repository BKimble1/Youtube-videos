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
import {BENCH_Y, BLADE_E, BLADE_LEN, BLADE_T, LT5, NOZ, SAND} from './labWorld5';

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
export const FLOOR = BENCH_Y - 6;
const AX0 = norm(sub(BLADE_E, BLADE_T));
const BURIED = BLADE_LEN * 0.68;
/** the attachment: on the blade's exposed end, just below its end */
export const A0 = add(BLADE_E, mul(AX0, -4));

/** the nozzle's tip and axis: resting on its stand, lifted into the hand's aim, drawn back, lifted, carried */
const TIP_STAND = NOZ.tip;
const TIP_AIM: V = {x: 606, y: 1184};
const TIP_PULL: V = {x: 662, y: 1132};
const TIP_TOP: V = {x: 520, y: 672};
/** the sand's surface, where the blade is set back down after the strength beat */
const SURF_F = SAND.surf - 2;
export const L_F = len(sub(TIP_PULL, A0));
/** the fibre's working length once the blade hangs (the same fibre: no stretch) */
const L_HANG = L_F;
const TIP_DOWN: V = {x: SAND.x + 40, y: SURF_F - 20 - L_HANG - BLADE_LEN};
const keyV = (f: number, keys: [number, V, ((a: number, b: number, c: number) => number)?][]): V => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (f <= keys[i][0]) return lerpV(keys[i - 1][1], keys[i][1], (keys[i][2] ?? ss)(f, keys[i - 1][0], keys[i][0]));
  return keys[keys.length - 1][1];
};
export const tipAt = (f: number): V => {
  // the hand's small tremor of effort while it pulls against the buried blade
  const effort = ss(f, LT5.pull0 + 4, LT5.pull0 + 10) * (1 - ss(f, LT5.breakFree, LT5.breakFree + 4));
  const tremor = {x: 1.2 * Math.sin(f * 2.3) * effort, y: 0.9 * Math.sin(f * 3.1 + 1) * effort};
  const lowered = sub(TIP_DOWN, {x: 0, y: -(SURF_F - (TIP_DOWN.y + L_HANG + BLADE_LEN)) - 0.95 * BLADE_LEN});
  if (f > LT5.breakFree && f < LT5.liftTop) return liftPath(f);
  return add(
    keyV(f, [
      [LT5.nozGrip, TIP_STAND],
      [LT5.nozLift1, TIP_AIM],
      [LT5.pull0, TIP_AIM],
      // drawn back as far as the fibre allows; then held against the resistance
      [LT5.pull0 + 10, add(TIP_AIM, mul(sub(TIP_PULL, TIP_AIM), 0.9))],
      [LT5.breakFree, TIP_PULL],
      // the release and the high lift: liftPath (below)
      [LT5.liftTop, TIP_TOP],
      [LT5.carry0, add(TIP_TOP, {x: -6, y: -10})],
      [LT5.carry1, TIP_DOWN],
      [LT5.flat, lowered],
      [LT5.release, add(lowered, {x: 8, y: 6})],
    ]),
    tremor,
  );
};
/** the nozzle's direction (degrees, tip direction): resting, aimed, slightly raised while lifting, pointed down at
 *  the tray after the release (for the outlet match into the wrist shooter) */
const ANG_STAND = (Math.atan2(N_AXIS.y, N_AXIS.x) * 180) / Math.PI;
export const nozAngAt = (f: number, endAng: number) => {
  const raise = -10 * ss(f, LT5.breakFree, LT5.liftTop) * (1 - ss(f, LT5.carry0, LT5.carry1));
  const aim = lerp(ANG_STAND, ANG_STAND - 3, ss(f, LT5.nozGrip, LT5.nozLift1));
  let a = aim + raise;
  a = lerp(a, endAng, ss(f, LT5.release, LT5.toDevice - 4));
  return a;
};

/** blade during the pull-out (u 0..1): buried tip sliding out along the axis, the exposed end rising */
/** one continuous move from the pull to the top of the lift: the hand draws up and back with the fibre taut while
 *  the blade slides out of the sand, and keeps rising, travelling in over the blade (a cubic through 4 points) */
const liftPath = (f: number): V => {
  const u = ss(f, LT5.breakFree, LT5.liftTop);
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
  fibre: {from: V; to: V; c?: V; sag: number; on: boolean; fly: number; vib: number; wave: number};
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
    const p0 = tipAt(LT5.out);
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
    for (let fr = LT5.out; fr <= LT5.end + 1; fr++) {
      SWING.push(th);
      for (let i = 0; i < n; i++) {
        const t = fr + i / n;
        const a = acc(t);
        // strongly damped as it drags clear of the sand, then a light air damping
        const c = 0.09 + 0.35 * (1 - ss(t, LT5.out, LT5.out + 20));
        const al = (-a.x * Math.cos(th) - (G - a.y) * Math.sin(th)) / L_HANG - c * w;
        w += al / n;
        th += w / n;
      }
    }
  }
  const i = Math.max(0, f - LT5.out);
  const i0 = Math.min(SWING.length - 2, Math.floor(i));
  return lerp(SWING[i0], SWING[i0 + 1], i - i0);
};

export const labPhys = (f: number, endAng = ANG_STAND): LabPhys => {
  const tip = tipAt(f);
  const ang = nozAngAt(f, endAng);
  let bT = BLADE_T;
  let bE = BLADE_E;
  let A = A0;
  let free = false;
  let bladeW = 1;
  // the resistance: the blade rocks a little and the sand cracks before it gives
  const resist = ss(f, LT5.pull0 + 6, LT5.pull0 + 14) * (1 - ss(f, LT5.breakFree, LT5.breakFree + 2));
  const rock = resist * 0.035 * Math.sin(f * 1.9);
  const crack = ss(f, LT5.pull0 + 10, LT5.breakFree);
  if (f >= LT5.pull0 && f < LT5.out) {
    const u = ss(f, LT5.breakFree, LT5.out) * 1 + 0.03 * resist;
    const b = bladeOut(u, rock);
    bT = b.T;
    bE = b.E;
    A = b.A;
    free = u > 0.7;
  }
  if (f >= LT5.out) {
    // it hangs from the fibre: a damped swing from the moment it came out, the pivot following the nozzle
    const o = bladeOut(1, 0);
    const swing = swingAt(f);
    const dir = {x: Math.sin(swing), y: Math.cos(swing)};
    A = add(tip, mul(dir, L_HANG));
    const k = ss(f, LT5.out, LT5.out + 10);
    const ax = norm(lerpV(norm(sub(o.T, o.A)), dir, k));
    bE = add(A, mul(ax, -4));
    bT = add(A, mul(ax, BLADE_LEN - 4));
    free = true;
    // a slow turn about the fibre while it hangs (a flat blade on one thread)
    const turn = ss(f, LT5.out + 6, LT5.liftTop + 20) * (1 - ss(f, LT5.carry1 - 10, LT5.carry1 + 6));
    bladeW = Math.cos(turn * 1.1 * Math.sin((f - LT5.out) / 22));
    // set back down: once its tip meets the sand it stays and the blade lies down on it
    if (f >= LT5.carry1 - 10 && bT.y >= SURF_F) {
      const over = bT.y - SURF_F;
      // its tip stays where it met the sand
      const f0 = LT5.touch + 2;
      const Tf = {x: f < f0 ? bT.x : tipAt(f0).x + Math.sin(swingAt(f0)) * (L_HANG + BLADE_LEN - 4), y: SURF_F};
      const tilt = clamp(over / (BLADE_LEN * 0.9));
      const a0 = Math.atan2(bE.y - Tf.y, bE.x - Tf.x);
      const a1 = (-176 * Math.PI) / 180; // it falls to the left, inside the dish
      const a = lerp(a0, a1, tilt * tilt * (3 - 2 * tilt));
      bT = Tf;
      bE = add(Tf, {x: Math.cos(a) * BLADE_LEN, y: Math.sin(a) * BLADE_LEN});
      A = add(bE, mul(norm(sub(Tf, bE)), 4));
    }
  }

  // the fibre
  const fly = clamp((f - LT5.exit) / (LT5.fcontact - LT5.exit));
  let fibre: LabPhys['fibre'] = {from: tip, to: tip, sag: 0, on: false, fly, vib: 0, wave: 0};
  if (f >= LT5.exit && f < LT5.fcontact) {
    // it extends into open space slowly as it forms, then reaches out toward the blade (accelerating)
    // it leaves the outlet along the needle's axis (continuing the strand formed in the close view, EXT0 long)
    const p = fly < 0.45 ? 0.22 * (fly / 0.45) : 0.22 + 0.78 * ((fly - 0.45) / 0.55) ** 1.6;
    const ar = (ang * Math.PI) / 180;
    const d = {x: Math.cos(ar), y: Math.sin(ar)};
    const head0 = add(tip, mul(d, EXT0));
    const head = add(lerpV(head0, A0, p), {x: 0, y: 18 * Math.sin(p * Math.PI) * Math.min(1, fly * 4)});
    const c = lerpV(add(tip, mul(d, EXT0 * 0.5 + 0.25 * len(sub(head, head0)))), lerpV(tip, head, 0.5), p ** 1.4);
    fibre = {from: tip, to: head, c, sag: 8 * (1 - p) * Math.min(1, fly * 6), on: true, fly, vib: 0, wave: 0};
  } else if (f >= LT5.fcontact) {
    let sag = lerp(18, 2, ss(f, LT5.fcontact + 4, LT5.settle1));
    sag = lerp(sag, 0, ss(f, LT5.pull0, LT5.pull0 + 8));
    if (f >= LT5.touch) sag = 30 * ss(f, LT5.touch, LT5.release + 6);
    const vib = resist * 2.6 + 0.8 * Math.exp(-(f - LT5.breakFree) / 6) * (f >= LT5.breakFree ? 1 : 0);
    // the wave from the impact running back along the fibre
    const wave = f < LT5.fcontact + 12 ? (f - LT5.fcontact) / 12 : 0;
    fibre = {from: tip, to: A, sag, on: true, fly: 1, vib, wave};
  }
  const contactSquash = f >= LT5.fcontact ? Math.min(1, (f - LT5.fcontact) / 3) : 0;
  return {tip, ang, fibre, bladeT: bT, bladeE: bE, bladeW, free, contactSquash, crack};
};

/** sand falling off the blade as the buried part comes out; a few grains hop as it cracks */
export const grainsAt = (f: number) => {
  const out: {p: V; r: number; c: string}[] = [];
  for (let i = 0; i < 46; i++) {
    const h = ((i * 7919) % 1000) / 1000;
    const h2 = ((i * 4241) % 1000) / 1000;
    const fs = LT5.breakFree - 2 + h * (LT5.out - LT5.breakFree + 6);
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
    const f0 = LT5.pull0 + 10 + h * (LT5.breakFree - LT5.pull0 - 8);
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
