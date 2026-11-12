// The biohybrid walker: a five-legged soft pneumatic robot (after Mishra et al., Science Robotics 2024: a five-limbed
// soft walker whose legs are inflated through valves; its control input is the measured spiking of king oyster
// mycelium grown on electrodes). World units: cm, y up. Deterministic: every function is a pure function of time.
import {clamp, lerp, ss, V3, v3, bez3, wobble, mulberry} from './lib';
import {DUR, EVENTS, EVENTS_EXT, Ev, BONK_FRAC, LEG_ORDER, LEG_OFF, SWING, T} from './timing';

export const HUB_R = 2.8; // central body radius
export const HUB_H = 1.5;
export const BODY_Y = 2.65; // hub centre height when standing
export const DOME_R = 2.1; // the shielded cap over the culture
export const DISC_R = 1.85; // the 3D-printed scaffold the mycelium grows on
export const HIP_R = 2.55;
export const FOOT_R = 8.4; // neutral foot distance from the centre
export const LEG_L = 7.4; // soft leg length (approx.)
export const LEG_R0 = 0.78, LEG_R1 = 0.4; // leg radius at the hip / at the tip
export const STRIDE = 2.25;

// ------------------------------------------------------------------------------------------------ progress along the path
const prog = (e: Ev, t: number) => {
  const p = ss(e.start + 0.08 * e.D, e.start + 0.92 * e.D, t);
  return e.kind === 'bonk' ? Math.min(p, BONK_FRAC) : p;
};
const effW = (e: Ev) => e.w * (e.kind === 'bonk' ? BONK_FRAC : 1);
export const W_TOTAL = EVENTS.reduce((a, e) => a + effW(e), 0);
export const L_TOTAL = W_TOTAL * STRIDE;
const BASE0 = (() => {
  let s = 0;
  for (const e of EVENTS_EXT) s += e.w * prog(e, 0);
  return s;
})();
/** distance walked (strides) since t = 0, unwrapped */
export const walked = (t: number) => {
  let s = 0;
  for (const e of EVENTS_EXT) s += e.w * prog(e, t);
  return s - BASE0;
};
const tBonkEv = EVENTS.find((e) => e.kind === 'bonk')!;
// the moment the bonk step's progress hits its cap (the front leg meets the box)
export const T_CONTACT = (() => {
  let a = tBonkEv.start, b = tBonkEv.start + tBonkEv.D;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (ss(tBonkEv.start + 0.08 * tBonkEv.D, tBonkEv.start + 0.92 * tBonkEv.D, m) < BONK_FRAC) a = m; else b = m;
  }
  return (a + b) / 2;
})();
const U_CONTACT = walked(T_CONTACT + 0.001);
const U_UVEND = walked(16.5);
const turnEv = EVENTS.find((e) => e.kind === 'turn')!;

// ------------------------------------------------------------------------------------------------ the closed path (turtle)
// segments in strides: [0, U_UVEND] curvature k0; [U_UVEND, U_CONTACT] k1; a pivot of PIV over PIV_LEN; then k3 home.
const PIV = (Number((globalThis as any).PIV ?? 110) * Math.PI) / 180, PIV_LEN = 1.6;
type Seg = {u0: number; u1: number; k: number};
const segsFor = (k0: number, k1: number, k3: number): Seg[] => [
  {u0: 0, u1: U_UVEND, k: k0},
  {u0: U_UVEND, u1: U_CONTACT, k: k1},
  {u0: U_CONTACT, u1: U_CONTACT + PIV_LEN, k: PIV / PIV_LEN},
  {u0: U_CONTACT + PIV_LEN, u1: W_TOTAL, k: k3},
];
const walk = (segs: Seg[], u: number) => {
  // exact integration of piecewise-constant curvature (units: strides; angle in rad)
  let x = 0, z = 0, th = 0;
  for (const s of segs) {
    const a = Math.max(s.u0, Math.min(u, s.u1)) - s.u0;
    if (a <= 0) continue;
    const L = a * STRIDE, k = s.k / STRIDE;
    if (Math.abs(k) < 1e-9) { x += L * Math.cos(th); z += L * Math.sin(th); }
    else {
      x += (Math.sin(th + k * L) - Math.sin(th)) / k;
      z += (-Math.cos(th + k * L) + Math.cos(th)) / k;
    }
    th += k * L;
    if (u <= s.u1) break;
  }
  return {x, z, th};
};
// solve k0, k1, k3 so the path closes: back to (0, 0) facing the start direction after one full turn (2 pi)
const solve = () => {
  let k = [0.2, 0.0, 0.03];
  const f = (q: number[]) => {
    const e = walk(segsFor(q[0], q[1], q[2]), W_TOTAL);
    return [e.x, e.z, (e.th - 2 * Math.PI) * 10];
  };
  const inv3 = (m: number[][]) => {
    const [a, b, c] = m[0], [d, e, g] = m[1], [h, i, j] = m[2];
    const A = e * j - g * i, B = -(d * j - g * h), C = d * i - e * h;
    const det = a * A + b * B + c * C;
    return [[A / det, -(b * j - c * i) / det, (b * g - c * e) / det],
      [B / det, (a * j - c * h) / det, -(a * g - c * d) / det],
      [C / det, -(a * i - b * h) / det, (a * e - b * d) / det]];
  };
  for (let it = 0; it < 80; it++) {
    const F = f(k);
    if (Math.hypot(F[0], F[1], F[2]) < 1e-10) break;
    const h = 1e-6;
    const J = [0, 1, 2].map(() => [0, 0, 0]);
    for (let c = 0; c < 3; c++) {
      const q = [...k]; q[c] += h;
      const G = f(q);
      for (let r = 0; r < 3; r++) J[r][c] = (G[r] - F[r]) / h;
    }
    const I = inv3(J);
    k = k.map((v, r) => v - (I[r][0] * F[0] + I[r][1] * F[1] + I[r][2] * F[2]));
  }
  return {k0: k[0], k1: k[1], k3: k[2]};
};
const SOL = solve();
export const SEGS = segsFor(SOL.k0, SOL.k1, SOL.k3);
const THETA_END = walk(SEGS, W_TOTAL).th; // = turn closure (checked in tools)
export const PATH_INFO = {...SOL, thetaEnd: THETA_END, closure: walk(SEGS, W_TOTAL), W_TOTAL, L_TOTAL, U_CONTACT, U_UVEND, T_CONTACT};

const wrapU = (u: number) => ((u % W_TOTAL) + W_TOTAL) % W_TOTAL;
export const pathAt = (u: number) => {
  const turns = Math.floor(u / W_TOTAL);
  const p = walk(SEGS, wrapU(u));
  return {x: p.x, z: p.z, th: p.th + turns * THETA_END};
};

// ------------------------------------------------------------------------------------------------ body pose
const activeEvent = (t: number) => EVENTS_EXT.find((e) => t >= e.start && t < e.start + e.D);
export const splatEv = EVENTS.find((e) => e.kind === 'splat')!;
export const splatAmt = (t: number) => {
  const e = splatEv;
  const a = ss(e.start + 0.05, e.start + 0.32, t) * (1 - ss(e.start + 0.62, e.start + 1.0, t));
  return a + 0.06 * wobble(t, e.start + 1.0, 4, 6) * (t > e.start + 0.9 ? 1 : 0);
};
export type Pose = {x: number; y: number; z: number; th: number; f: V3; u: number; ev?: Ev; ep: number};
export const pose = (t: number): Pose => {
  const u = walked(t);
  const p = pathAt(u);
  const ev = activeEvent(t);
  const ep = ev ? (t - ev.start) / ev.D : 0;
  let y = BODY_Y + (ev ? 0.28 * Math.sin(Math.PI * ep) * (ev.kind === 'uv' ? 1.4 : 1) : 0);
  y -= 1.45 * splatAmt(t);
  // the bonk: a jolt back from the box, a little bounce
  const jb = t > T_CONTACT ? wobble(t, T_CONTACT, 5, 7) : 0;
  let x = p.x, z = p.z;
  const f: V3 = [Math.cos(p.th), 0, Math.sin(p.th)];
  x -= f[0] * 0.45 * Math.max(0, jb);
  z -= f[2] * 0.45 * Math.max(0, jb);
  y += 0.25 * Math.max(0, jb);
  // the featured (first returning) step is a little clumsy: an overshoot wobble after it lands
  const fe = EVENTS.find((e) => e.kind === 'featured')!;
  const wf = wobble(t, fe.start + fe.D * 0.9, 4.5, 5);
  y += 0.22 * wf;
  return {x, y, z, th: p.th + 0.06 * wf, f, u, ev, ep};
};

/** camera-follow centre: the body path smoothed over about +-0.5 s (so steps don't jerk the camera) */
export const smoothCentre = (t: number): V3 => {
  let sx = 0, sz = 0, sw = 0;
  for (let k = -6; k <= 6; k++) {
    const wgt = Math.exp(-(k * k) / 18);
    const p = pathAt(walked(t + k * 0.09));
    sx += wgt * p.x; sz += wgt * p.z; sw += wgt;
  }
  return [sx / sw, BODY_Y, sz / sw];
};

// ------------------------------------------------------------------------------------------------ props (fixed in the world)
const cPose = pathAt(U_CONTACT);
const cF: V3 = [Math.cos(cPose.th), 0, Math.sin(cPose.th)];
/** pipette-tip box the walker marches into on "no eyes": its near face sits just past the front foot at contact */
export const BOX_LAT = Number((globalThis as any).BOX_LAT ?? 0);
export const BOX = (() => {
  const face = FOOT_R + LEG_R1 + 0.25 - BONK_FRAC * 0 ;
  const n = cF; // the face normal points back at the robot (-n)
  const centreDist = face + 4.2; // box depth 8.4 (along n), width 12.4, height 6.2
  return {
    c: [cPose.x + n[0] * centreDist - n[2] * BOX_LAT, 0, cPose.z + n[2] * centreDist + n[0] * BOX_LAT] as V3,
    n, w: 12.4, d: 8.4, h: 6.2, face,
    faceC: [cPose.x + n[0] * face, 0, cPose.z + n[2] * face] as V3,
  };
})();
/** a point's signed distance in front of the box's near face (positive = outside, on the robot's side) */
export const boxClear = (p: V3) => -v3.dot(v3.sub(p, BOX.faceC), BOX.n);
export const boxJolt = (t: number) => (t > T_CONTACT ? wobble(t, T_CONTACT, 9, 9) : 0) +
  EVENTS.filter((e) => e.kind === 'stuck').reduce((a, e) => a + 0.35 * wobble(t, e.start + e.D * 0.8, 9, 10), 0);

// ------------------------------------------------------------------------------------------------ legs
export const legAngle = (th: number, i: number) => th + (i * 2 * Math.PI) / 5;
const plantRadius = (e: Ev | undefined) => (e && e.kind === 'splat' ? 10.3 : FOOT_R);
const plantFor = (e: Ev | undefined, i: number, tEnd: number): V3 => {
  const p = pathAt(walked(tEnd));
  const a = legAngle(p.th, i);
  const r = plantRadius(e);
  let q: V3 = [p.x + r * Math.cos(a), 0, p.z + r * Math.sin(a)];
  // keep-out: no foot is ever placed inside the box (front feet paw at its face instead)
  const c = boxClear(q);
  const minC = LEG_R1 + 0.2;
  if (c < minC && Math.abs(v3.dot(v3.sub(q, BOX.faceC), [-BOX.n[2], 0, BOX.n[0]]) - BOX_LAT) < BOX.w / 2 + 1) {
    q = v3.sub(q, v3.mul(BOX.n, minC - c));
  }
  return q;
};
// the plant of every leg after every event, precomputed
const EXT = EVENTS_EXT;
const PLANTS: V3[][] = EXT.map((e) => [0, 1, 2, 3, 4].map((i) => plantFor(e, i, e.start + e.D + 0.001)));
const swingWin = (e: Ev, i: number) => {
  const k = LEG_ORDER.indexOf(i);
  const a = e.start + LEG_OFF[k] * e.D;
  return [a, a + SWING * e.D];
};
export type LegState = {foot: V3; lift: number; inflate: number; swingK: number};
export const legState = (t: number, i: number): LegState => {
  // last event whose swing for leg i has started
  let k = -1;
  for (let j = 0; j < EXT.length; j++) {
    const [a] = swingWin(EXT[j], i);
    if (a <= t) k = j; else break;
  }
  const e = EXT[k];
  const [a, b] = swingWin(e, i);
  const prev = PLANTS[k - 1][i], next = PLANTS[k][i];
  if (t >= b) {
    // planted; a soft settle after landing
    const settle = Math.exp(-(t - b) * 14) * 0.25;
    return {foot: next, lift: 0, inflate: settle, swingK: k};
  }
  const s = (t - a) / (b - a);
  const sm = s * s * (3 - 2 * s);
  const amp = e.kind === 'uv' ? 1.35 : e.kind === 'featured' ? 1.5 : e.kind === 'stuck' ? 1.15 : 1;
  const lift = Math.sin(Math.PI * s) * 1.6 * amp;
  const foot = v3.lerp(prev, next, sm);
  return {foot, lift, inflate: Math.sin(Math.PI * Math.min(1, s * 1.15)) * amp, swingK: k};
};

/** centre line of leg i (hip -> tip) in world space, N+1 samples, with the radius at each sample */
export const legCurve = (t: number, i: number, P: Pose, N = 18) => {
  const st = legState(t, i);
  const a = legAngle(P.th, i);
  const rad: V3 = [Math.cos(a), 0, Math.sin(a)];
  const hip: V3 = [P.x + HIP_R * rad[0], P.y - 0.15, P.z + HIP_R * rad[2]];
  const tipY = LEG_R1 + st.lift;
  const foot: V3 = [st.foot[0], tipY, st.foot[2]];
  // direction from hip to foot in the ground plane (the foot need not lie on the leg's rest radial)
  const hf = v3.sub(foot, hip);
  const flat = v3.nrm([hf[0], 0, hf[2]]);
  const chord = v3.len(hf);
  // the soft leg keeps its length: choose the arch height that gives about LEG_L, plus the inflation curl
  const curve = (arch: number) => {
    const p1: V3 = [hip[0] + flat[0] * 2.6, hip[1] + arch * 0.5, hip[2] + flat[2] * 2.6];
    const p2: V3 = [foot[0] - flat[0] * 0.9, foot[1] + arch * 1.15, foot[2] - flat[2] * 0.9];
    return [hip, p1, p2, foot] as [V3, V3, V3, V3];
  };
  const lenOf = (c: [V3, V3, V3, V3]) => {
    let L = 0, q = c[0];
    for (let k = 1; k <= 12; k++) { const r = bez3(c[0], c[1], c[2], c[3], k / 12); L += v3.len(v3.sub(r, q)); q = r; }
    return L;
  };
  let lo = 0, hi = 7;
  for (let it = 0; it < 18; it++) {
    const m = (lo + hi) / 2;
    if (lenOf(curve(m)) < LEG_L) lo = m; else hi = m;
  }
  const arch = (chord >= LEG_L ? 0 : (lo + hi) / 2) + 0.9 * st.inflate;
  const c = curve(arch);
  const pts: V3[] = [], rs: number[] = [];
  for (let k = 0; k <= N; k++) {
    const u = k / N;
    pts.push(bez3(c[0], c[1], c[2], c[3], u));
    rs.push(lerp(LEG_R0, LEG_R1, Math.pow(u, 0.85)) * (1 + 0.08 * st.inflate * Math.sin(Math.PI * u)));
  }
  return {pts, rs, st, rad};
};

/** foot plants (for the walked-track overlay) up to time t, newest last */
export const footprints = (t: number, back = 9.5) => {
  const out: {p: V3; t: number; i: number}[] = [];
  for (let k = 0; k < EXT.length; k++) {
    const e = EXT[k];
    for (let i = 0; i < 5; i++) {
      const tl = swingWin(e, i)[1];
      if (tl <= t && tl > t - back) out.push({p: PLANTS[k][i], t: tl, i});
    }
  }
  return out;
};

/** foot landings for the sound cues (time, leg, kind) inside one period */
export const landings = () => {
  const out: {t: number; i: number; kind: string; amp: number}[] = [];
  for (const e of EVENTS) for (let i = 0; i < 5; i++) {
    const [a, b] = swingWin(e, i);
    out.push({t: b, i, kind: e.kind, amp: e.kind === 'uv' ? 1.3 : 1});
    void a;
  }
  return out.sort((p, q) => p.t - q.t);
};
export const swingStarts = () => {
  const out: {t: number; i: number; kind: string}[] = [];
  for (const e of EVENTS) for (let i = 0; i < 5; i++) out.push({t: swingWin(e, i)[0], i, kind: e.kind});
  return out.sort((p, q) => p.t - q.t);
};

// a deterministic stand for the tether (air lines + the electrode cable) — anchored overhead at the path centroid
export const TETHER_ANCHOR: V3 = (() => {
  let sx = 0, sz = 0;
  for (let k = 0; k < 60; k++) { const p = pathAt((k / 60) * W_TOTAL); sx += p.x; sz += p.z; }
  return [sx / 60, 55, sz / 60];
})();
export const rngFor = (s: number) => mulberry(s);
export {clamp};
void T;

/** signed distance (cm) from a world point to the pipette-tip box (negative = inside) */
export const boxSDF = (p: V3) => {
  const d = v3.sub(p, BOX.c);
  const lat: V3 = [-BOX.n[2], 0, BOX.n[0]];
  const q = [Math.abs(v3.dot(d, lat)) - BOX.w / 2, Math.abs(p[1] - BOX.h / 2) - BOX.h / 2, Math.abs(v3.dot(d, BOX.n)) - BOX.d / 2];
  const out = Math.hypot(Math.max(q[0], 0), Math.max(q[1], 0), Math.max(q[2], 0));
  return out + Math.min(Math.max(q[0], q[1], q[2]), 0);
};
