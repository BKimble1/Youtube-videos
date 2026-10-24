// V2 lab kinematics: the nozzle in the lead's hand, the fibre, and the blade, as functions of the frame.
// The fibre leaves the outlet at LT2.exit and reaches the blade's exposed end at LT2.contact (an illustration slowed
// to be seen; the narration places "hits the metal" there). Nothing moves the blade before the fibre is taut: the
// pull (pull0..taut) only straightens it; then the exposed end rises while the buried tip slides out along its own
// axis (lift0..out); from there the fibre and blade hang from the outlet as one damped pendulum, carried over the
// tray, lowered until the blade's tip touches the floor, and laid flat.
import {add, clamp, len, lerp, lerpV, mul, norm, sub, V} from './dc/math';
import {BENCH_Y, BLADE_E, BLADE_LEN, BLADE_T, LT2, NOZ, SAND, TRAY} from './labWorld2';

const sm = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
export const ss = (f: number, a: number, b: number) => sm((f - a) / (b - a));
const ss5 = (f: number, a: number, b: number) => {
  const x = clamp((f - a) / (b - a));
  return x * x * x * (x * (x * 6 - 15) + 10);
};

export const N_AXIS = norm(sub(NOZ.tip, NOZ.rear));
export const N_LEN = len(sub(NOZ.tip, NOZ.rear));
const rearOf = (tip: V) => add(tip, mul(N_AXIS, -N_LEN));

/** the attachment: on the blade's exposed end, just below its end */
const A0 = add(BLADE_E, mul(norm(sub(BLADE_T, BLADE_E)), 4));
const TIP0 = NOZ.tip;
const PULL: V = {x: 40, y: -52};
const TIP_TAUT = add(TIP0, PULL);
export const L_F = len(sub(TIP_TAUT, A0));
const AX0 = norm(sub(BLADE_E, BLADE_T));
const TH0 = Math.atan2(AX0.y, AX0.x);
const TH1 = (-78 * Math.PI) / 180;
const BURIED = BLADE_LEN * 0.68;
const D0 = norm(sub(TIP_TAUT, A0));
const D1 = norm({x: 0.25, y: -1});
export const FLOOR = BENCH_Y - 6;
const TRAY_X = (TRAY.x0 + TRAY.x1) / 2;

/** blade during the lift (u 0..1): buried tip T sliding out along the axis, the exposed end rising */
const bladeLift = (u: number) => {
  const T = add(BLADE_T, mul(AX0, BURIED * 1.04 * u));
  const th = lerp(TH0, TH1, u);
  const E = add(T, {x: Math.cos(th) * BLADE_LEN, y: Math.sin(th) * BLADE_LEN});
  const A = add(E, mul({x: -Math.cos(th), y: -Math.sin(th)}, 4));
  return {T, E, A};
};

/** pivot (the nozzle tip) path once the blade is out */
const tipOut = () => {
  const b = bladeLift(1);
  return add(b.A, mul(D1, L_F));
};
const TIP_TRAY: V = {x: TRAY_X + 30, y: FLOOR - 70 - L_F - BLADE_LEN};
const pivotAt = (f: number): V => {
  const t0 = tipOut();
  let p = lerpV(t0, TIP_TRAY, ss5(f, LT2.carry0, LT2.carry1));
  // the strength beat: a slow, controlled lift of the hanging blade on the one fibre, held, and let down again
  p = add(p, {x: 0, y: -64 * (ss5(f, 752, 782) - ss5(f, 798, 822))});
  // lowered from lower0 until the blade lies in the tray
  // down until the blade's tip meets the floor, then on by most of the blade's length so it lies down
  const drop = FLOOR - 3 - (TIP_TRAY.y + L_F + BLADE_LEN) + 0.95 * BLADE_LEN;
  p = add(p, {x: 0, y: drop * ss(f, LT2.lower0, LT2.flat)});
  return p;
};

/** damped pendulum of fibre + blade hung from the moving outlet (simulated from the moment the blade is out) */
const G = 19600; // px/s^2 (9.8 m/s^2 at 20 px/cm)
const PL = L_F + BLADE_LEN * 0.55;
const pendCache = new Map<number, {psi: number}>();
const pendulum = (f: number) => {
  const key = Math.round(f * 4);
  const c = pendCache.get(key);
  if (c) return c.psi;
  const b = bladeLift(1);
  const t0 = tipOut();
  const v0 = sub(b.A, t0);
  let psi = Math.atan2(v0.x, v0.y);
  let w = 0;
  const dt = 1 / 120;
  for (let g = LT2.out; g < f; g += 0.25) {
    const a = sub(add(pivotAt(g + 0.25), pivotAt(g - 0.25)), mul(pivotAt(g), 2));
    const ax = a.x / (0.25 / 30) ** 2;
    const ay = a.y / (0.25 / 30) ** 2;
    for (let k = 0; k < 2; k++) {
      const acc = (-(G + ay) * Math.sin(psi) - ax * Math.cos(psi)) / PL - 3.2 * w;
      w += acc * dt;
      psi += w * dt;
    }
  }
  pendCache.set(key, {psi});
  return psi;
};

export type LabPhys = {
  tip: V;
  rear: V;
  /** fibre: from the outlet to its far end; sag (px) */
  fibre: {from: V; to: V; sag: number; on: boolean; fly: number};
  bladeT: V;
  bladeE: V;
  /** the blade has left the sand (drawn in front of the dish) */
  free: boolean;
  liftU: number;
  contactSquash: number;
};

export const labPhys = (f: number): LabPhys => {
  // the nozzle: held still, pulled back, carried by the lift and the pendulum pivot, then raised at the end
  let tip = lerpV(TIP0, TIP_TAUT, ss(f, LT2.pull0, LT2.taut));
  const u = ss(f, LT2.lift0, LT2.out);
  let bT = BLADE_T;
  let bE = BLADE_E;
  let A = A0;
  if (f >= LT2.lift0) {
    const b = bladeLift(u);
    bT = b.T;
    bE = b.E;
    A = b.A;
    tip = add(A, mul(norm(lerpV(D0, D1, u)), L_F));
  }
  let free = u > 0.75;
  if (f >= LT2.out) {
    tip = pivotAt(f);
    const psi = pendulum(f);
    const dir = {x: Math.sin(psi), y: Math.cos(psi)};
    A = add(tip, mul(dir, L_F));
    // the blade turns from its lift angle into line with the fibre over a few frames
    const k = ss(f, LT2.out, LT2.out + 8);
    const bl = bladeLift(1);
    const ax = norm(lerpV(norm(sub(bl.T, bl.A)), dir, k));
    bE = add(A, mul(ax, -4));
    bT = add(A, mul(ax, BLADE_LEN - 4));
    free = true;
    // lowering: once the blade's tip reaches the tray floor it stays there and the blade lies down toward the lead
    if (bT.y >= FLOOR - 3) {
      const over = bT.y - (FLOOR - 3);
      const Tf = {x: bT.x, y: FLOOR - 3};
      // tilt from its hanging angle toward lying flat as the outlet keeps coming down
      const tilt = clamp(over / (BLADE_LEN * 0.9));
      const a0 = Math.atan2(bE.y - Tf.y, bE.x - Tf.x);
      const a1 = (-4 * Math.PI) / 180;
      const a = lerp(a0, a1, tilt * tilt * (3 - 2 * tilt));
      bT = Tf;
      bE = add(Tf, {x: Math.cos(a) * BLADE_LEN, y: Math.sin(a) * BLADE_LEN});
      A = add(bE, mul(norm(sub(Tf, bE)), 4));
    }
  }
  const back = ss(f, LT2.back0, LT2.raise0);
  const rear = rearOf(tip);

  // the fibre
  const fly = clamp((f - LT2.exit) / (LT2.contact - LT2.exit));
  let fibre = {from: tip, to: tip, sag: 0, on: false, fly};
  if (f >= LT2.exit && f < LT2.contact) {
    const p = Math.pow(fly, 0.9);
    const head = add(lerpV(TIP0, A0, p), {x: 0, y: 18 * p * (1 - p)});
    fibre = {from: tip, to: head, sag: 0, on: true, fly};
  } else if (f >= LT2.contact) {
    const d = len(sub(A, tip));
    // slack after contact, drawn tight by the pull; slack again once the blade lies in the tray
    let sag = lerp(16, 3, ss(f, LT2.contact + 4, LT2.settle1));
    sag = lerp(sag, 0, ss(f, LT2.pull0, LT2.taut));
    if (f >= LT2.touch) sag = 26 * ss(f, LT2.touch, LT2.flat + 10) + 40 * back;
    fibre = {from: tip, to: A, sag: f < LT2.taut ? sag : f >= LT2.touch ? sag : 0, on: true, fly: 1};
    void d;
  }
  const contactSquash = f >= LT2.contact ? Math.min(1, (f - LT2.contact) / 3) : 0;
  return {tip, rear, fibre, bladeT: bT, bladeE: bE, free, liftU: u, contactSquash};
};

/** sand grains shaken off as the buried part comes out: spawn on the blade, fall into the dish */
export const grainsAt = (f: number) => {
  const out: {p: V; r: number; c: string}[] = [];
  for (let i = 0; i < 26; i++) {
    const h = ((i * 7919) % 1000) / 1000;
    const h2 = ((i * 4241) % 1000) / 1000;
    const fs = LT2.lift0 + 6 + h * (LT2.out - LT2.lift0);
    if (f < fs) continue;
    const s = labPhys(fs);
    const along = 0.08 + h2 * 0.55;
    const p0 = lerpV(s.bladeT, s.bladeE, along);
    const t = (f - fs) / 30;
    const y = p0.y + 0.5 * 2600 * t * t;
    if (y > SAND.surf + 2) continue;
    out.push({p: {x: p0.x + (h - 0.5) * 6 * t * 30, y}, r: 1.1 + h2 * 0.9, c: i % 3 ? '#C9A866' : '#E9CE95'});
  }
  return out;
};
