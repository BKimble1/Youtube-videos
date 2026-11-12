// V2 rig: one persistent five-legged soft walker (after Mishra et al., Science Robotics 2024: a five-limbed soft robot
// whose pneumatic legs are actuated through valves). World units cm, y up. Every function is a pure function of time.
//
// Each leg is a soft pneumatic bending actuator, modelled the way such actuators deform: a constant-curvature arc of
// FIXED length LEG_L from a FIXED socket on the hub wall to the foot. Given the foot, the arc is solved exactly (IK), so
// a leg can never stretch, detach, kink or flip. Feet are planted in world space during stance and travel a lifted arc
// during swing. Every constraint is asserted per frame by tools/v2/geom_audit.ts.
import {lerp, ss, V3, v3, wobble} from '../lib';
import {DUR, EVENTS, EVENTS_EXT, Ev, SWING, legPhase} from './timing';

export const HUB_R = 2.8, HUB_H = 1.5, BODY_Y = 2.65;
export const DOME_R = 2.1, DISC_R = 1.85;
export const FOOT_R = 8.6; // neutral foot distance from the body axis
export const LEG_L = 7.3; // fixed leg length (arc length)
export const LEG_R0 = 0.72, LEG_R1 = 0.4; // leg radius at the socket / at the foot
export const STRIDE = 2.25;
export const LIFT = 1.05;
export const RATIO_MIN = 0.62, RATIO_MAX = 0.985; // reachable workspace: chord / length

// ------------------------------------------------------------------------------------------------ progress and heading
const prog = (e: Ev, t: number) => ss(e.start + 0.08 * e.D, e.start + 0.92 * e.D, t);
export const W_TOTAL = EVENTS.reduce((a, e) => a + e.w, 0);
const base = (f: (e: Ev) => number) => EVENTS_EXT.reduce((a, e) => a + f(e), 0);
const W0 = base((e) => e.w * prog(e, 0));
const Y0 = base((e) => e.yaw * prog(e, 0));
export const walked = (t: number) => EVENTS_EXT.reduce((a, e) => a + e.w * prog(e, t), 0) - W0;
/** extra heading from turning in place (the "no idea" beat); cancels over the loop */
export const yawOff = (t: number) => EVENTS_EXT.reduce((a, e) => a + e.yaw * prog(e, t), 0) - Y0;

// ------------------------------------------------------------------------------------------------ the closed path
// heading(u) = 2 pi u/W + C sin(4 pi u/W + PHI): one full turn per loop, two straighter and two tighter stretches. The
// second-harmonic term integrates to zero against e^{i 2 pi u/W}, so the path closes exactly (up to the quadrature).
const C = 0.32, PHI = 2.1, NQ = 6000;
const thetaU = (u: number) => (2 * Math.PI * u) / W_TOTAL + C * Math.sin((4 * Math.PI * u) / W_TOTAL + PHI);
const TAB = (() => {
  const xs = new Float64Array(NQ + 1), zs = new Float64Array(NQ + 1);
  const du = W_TOTAL / NQ;
  for (let i = 1; i <= NQ; i++) {
    const a = thetaU((i - 1) * du), b = thetaU((i - 0.5) * du), c = thetaU(i * du);
    xs[i] = xs[i - 1] + (STRIDE * du * (Math.cos(a) + 4 * Math.cos(b) + Math.cos(c))) / 6;
    zs[i] = zs[i - 1] + (STRIDE * du * (Math.sin(a) + 4 * Math.sin(b) + Math.sin(c))) / 6;
  }
  // remove the (tiny) quadrature residual linearly so the loop closes to machine precision
  const ex = xs[NQ], ez = zs[NQ];
  for (let i = 0; i <= NQ; i++) { xs[i] -= (ex * i) / NQ; zs[i] -= (ez * i) / NQ; }
  return {xs, zs, residual: Math.hypot(ex, ez)};
})();
export const PATH_INFO = {W_TOTAL, L_TOTAL: W_TOTAL * STRIDE, quadratureResidualCm: TAB.residual};
export const pathAt = (u: number) => {
  const turns = Math.floor(u / W_TOTAL);
  const uu = u - turns * W_TOTAL;
  const f = (uu / W_TOTAL) * NQ, i = Math.min(NQ - 1, Math.floor(f)), k = f - i;
  return {x: lerp(TAB.xs[i], TAB.xs[i + 1], k), z: lerp(TAB.zs[i], TAB.zs[i + 1], k), th: thetaU(uu) + turns * 2 * Math.PI};
};

// ------------------------------------------------------------------------------------------------ body pose
const activeEvent = (t: number) => EVENTS_EXT.find((e) => t >= e.start && t < e.start + e.D);
export const sagEv = EVENTS.find((e) => e.kind === 'sag')!;
export const sagAmt = (t: number) => {
  const e = sagEv;
  return ss(e.start + 0.05, e.start + 0.35, t) * (1 - ss(e.start + 0.6, e.start + 0.98, t)) +
    (t > e.start + 0.98 ? 0.12 * wobble(t, e.start + 0.98, 3.5, 6) : 0);
};
const featEv = EVENTS.find((e) => e.kind === 'featured')!;
export type Pose = {x: number; y: number; z: number; th: number; u: number; ev?: Ev; ep: number};
export const pose = (t: number): Pose => {
  const u = walked(t);
  const p = pathAt(u);
  const ev = activeEvent(t);
  const ep = ev ? (t - ev.start) / ev.D : 0;
  let y = BODY_Y + (ev ? 0.2 * Math.sin(Math.PI * ep) * (ev.kind === 'uv' ? 1.35 : ev.kind === 'featured' ? 1.6 : 1) : 0);
  y -= 0.95 * sagAmt(t);
  const wf = wobble(t, featEv.start + featEv.D * 0.92, 4, 5);
  y += 0.14 * wf;
  return {x: p.x, y, z: p.z, th: p.th + yawOff(t) + 0.035 * wf, u, ev, ep};
};
export const smoothCentre = (t: number): V3 => {
  let sx = 0, sz = 0, sw = 0;
  for (let k = -6; k <= 6; k++) {
    const wgt = Math.exp(-(k * k) / 18);
    const p = pathAt(walked(t + k * 0.09));
    sx += wgt * p.x; sz += wgt * p.z; sw += wgt;
  }
  return [sx / sw, BODY_Y, sz / sw];
};
export const smoothHeading = (t: number) => {
  let s = 0, sw = 0;
  for (let k = -6; k <= 6; k++) { const wgt = Math.exp(-(k * k) / 18); s += wgt * pathAt(walked(t + k * 0.09)).th; sw += wgt; }
  return s / sw;
};

// ------------------------------------------------------------------------------------------------ feet
export const legAngle = (th: number, i: number) => th + (i * 2 * Math.PI) / 5;
export const socket = (P: Pose, i: number): V3 => {
  const a = legAngle(P.th, i);
  return [P.x + HUB_R * Math.cos(a), P.y, P.z + HUB_R * Math.sin(a)];
};
const EXT = EVENTS_EXT;
/** the body's ground-plane frame (position and heading, no bob) */
const pathPose = (t: number) => { const p = pathAt(walked(t)); return {x: p.x, z: p.z, th: p.th + yawOff(t)}; };
const toBody = (B: {x: number; z: number; th: number}, q: V3): [number, number] => {
  const dx = q[0] - B.x, dz = q[2] - B.z, c = Math.cos(B.th), s = Math.sin(B.th);
  return [dx * c + dz * s, -dx * s + dz * c];
};
const fromBody = (B: {x: number; z: number; th: number}, r: [number, number]): V3 => {
  const c = Math.cos(B.th), s = Math.sin(B.th);
  return [B.x + r[0] * c - r[1] * s, 0, B.z + r[0] * s + r[1] * c];
};
/** where leg i lands after event k: centred under the body's AVERAGE pose over that foot's coming stance (from its
 * landing to its next lift), so translation and turning during the stance are split evenly either side of neutral */
const plantFor = (k: number, i: number): V3 => {
  const e = EXT[k], nx = EXT[Math.min(EXT.length - 1, k + 1)];
  const tA = swingWinRaw(e, i)[1], tB = nx === e ? tA : swingWinRaw(nx, i)[0];
  const A = pathPose(tA), B = pathPose(tB);
  const th = (A.th + B.th) / 2, x = (A.x + B.x) / 2, z = (A.z + B.z) / 2;
  const a = legAngle(th, i);
  return [x + FOOT_R * Math.cos(a), 0, z + FOOT_R * Math.sin(a)];
};
const swingWinRaw = (e: Ev, i: number) => { const a = e.start + legPhase(e.kind, i) * e.D; return [a, a + SWING * e.D]; };
const PLANTS: V3[][] = EXT.map((_, k) => [0, 1, 2, 3, 4].map((i) => plantFor(k, i)));
export const swingWin = (e: Ev, i: number) => {
  const a = e.start + legPhase(e.kind, i) * e.D;
  return [a, a + SWING * e.D];
};
export type Foot = {p: V3; lift: number; swing: number; phase: number; planted: boolean; k: number};
export const footAt = (t: number, i: number): Foot => {
  let k = -1;
  for (let j = 0; j < EXT.length; j++) { if (swingWin(EXT[j], i)[0] <= t) k = j; else break; }
  const e = EXT[k];
  const [a, b] = swingWin(e, i);
  const prev = PLANTS[k - 1][i], next = PLANTS[k][i];
  if (t >= b) return {p: next, lift: 0, swing: 0, phase: 1, planted: true, k};
  const s = (t - a) / (b - a);
  const amp = e.kind === 'uv' ? 1.2 : e.kind === 'featured' ? 1.3 : 1;
  // lift first, travel, then set down. The travel is interpolated in the BODY frame (start and end are exactly the
  // world footholds), so the swinging foot keeps its distance from its socket while the body moves.
  const h = ss(0.12, 0.88, s);
  const Pa = pathPose(a), Pb = pathPose(b), Pt = pathPose(t);
  const ra = toBody(Pa, prev), rb = toBody(Pb, next);
  const rel: [number, number] = [lerp(ra[0], rb[0], h), lerp(ra[1], rb[1], h)];
  const p = fromBody(Pt, rel);
  return {p, lift: LIFT * amp * Math.sin(Math.PI * s), swing: Math.sin(Math.PI * s), phase: s, planted: false, k};
};

// ------------------------------------------------------------------------------------------------ leg IK (V3)
// Each leg is a soft pneumatic actuator modelled with the standard piecewise-constant-curvature (PCC) description of
// soft robots: two inextensible sections (proximal SEC1, distal SEC2) whose ONLY degrees of freedom are a curvature and
// a bending-plane angle each. The root is clamped: the leg always leaves its socket along the same direction relative
// to the body (outward and ROOT_UP above horizontal). Bending is limited to curvature in [K_MIN, K_MAX] and the bending
// plane to within PHI_MAX of the leg's vertical plane (a soft limb bends mostly in its chamber plane). Given the foot,
// the four parameters are solved by damped Gauss-Newton from a fixed start; the audit asserts the foot is reached.
export const SEC1 = 3.0, SEC2 = 4.3; // section lengths (sum = LEG_L)
export const ROOT_UP = (16 * Math.PI) / 180;
export const K_MIN = -0.15, K_MAX = 0.75; // 1/cm (positive = bending downward, toward the strain-limiting layer)
export const PHI_MAX = 0.75; // rad
type Frame = {p: V3; t: V3; n: V3; l: V3}; // position, tangent, bending-side normal (down side), lateral
const rotAbout = (v: V3, k: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return v3.add(v3.add(v3.mul(v, c), v3.mul(v3.cross(k, v), s)), v3.mul(k, v3.dot(k, v) * (1 - c)));
};
/** advance a frame along a constant-curvature section of length L, curvature k, bending toward n rotated by phi
 * about the tangent; returns the samples and the end frame */
const section = (F: Frame, L: number, k: number, phi: number, n: number) => {
  const d = v3.add(v3.mul(F.n, Math.cos(phi)), v3.mul(F.l, Math.sin(phi))); // bending direction
  const ax = v3.nrm(v3.cross(F.t, d)); // rotation axis (tangent turns toward d)
  const pts: V3[] = [];
  for (let j = 1; j <= n; j++) {
    const s = (L * j) / n;
    const p = Math.abs(k) < 1e-6 ? v3.add(F.p, v3.mul(F.t, s))
      : v3.add(F.p, v3.add(v3.mul(F.t, Math.sin(k * s) / k), v3.mul(d, (1 - Math.cos(k * s)) / k)));
    pts.push(p);
  }
  const a = k * L;
  const end: Frame = {p: pts[pts.length - 1], t: rotAbout(F.t, ax, a), n: rotAbout(F.n, ax, a), l: rotAbout(F.l, ax, a)};
  return {pts, end};
};
export const rootFrame = (P: Pose, i: number): Frame => {
  const a = legAngle(P.th, i);
  const rad: V3 = [Math.cos(a), 0, Math.sin(a)], up: V3 = [0, 1, 0], lat: V3 = [-Math.sin(a), 0, Math.cos(a)];
  const t = v3.add(v3.mul(rad, Math.cos(ROOT_UP)), v3.mul(up, Math.sin(ROOT_UP)));
  const n = v3.mul(v3.add(v3.mul(rad, -Math.sin(ROOT_UP)), v3.mul(up, Math.cos(ROOT_UP))), -1); // down side
  return {p: socket(P, i), t, n, l: lat};
};
const N1 = 9, N2 = 13;
const shape = (F0: Frame, q: number[]) => {
  const s1 = section(F0, SEC1, q[0], q[1], N1);
  const s2 = section(s1.end, SEC2, q[2], q[3], N2);
  return {pts: [F0.p, ...s1.pts, ...s2.pts], f1: s1.end, end: s2.end};
};
const clampQ = (q: number[]) => [Math.min(K_MAX, Math.max(K_MIN, q[0])), Math.min(PHI_MAX, Math.max(-PHI_MAX, q[1])),
  Math.min(K_MAX, Math.max(K_MIN, q[2])), Math.min(PHI_MAX, Math.max(-PHI_MAX, q[3]))];
const solveLeg = (F0: Frame, target: V3) => {
  let q = [0.12, 0, 0.45, 0];
  const W = [0.02, 0.06, 0.02, 0.06]; // regularisation: prefer small curvature and in-plane bending
  const resid = (qq: number[]) => {
    const e = v3.sub(shape(F0, qq).end.p, target);
    return [e[0], e[1], e[2], W[0] * qq[0], W[1] * qq[1], W[2] * qq[2], W[3] * qq[3]];
  };
  let lam = 1e-3;
  for (let it = 0; it < 30; it++) {
    const r = resid(q);
    const J: number[][] = r.map(() => [0, 0, 0, 0]);
    for (let c = 0; c < 4; c++) {
      const qq = [...q]; qq[c] += 1e-5;
      const r2 = resid(qq);
      for (let k = 0; k < r.length; k++) J[k][c] = (r2[k] - r[k]) / 1e-5;
    }
    // (J^T J + lam I) dq = -J^T r
    const A = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => r.reduce((acc, _, k) => acc + J[k][i] * J[k][j], 0) + (i === j ? lam : 0)));
    const g = [0, 1, 2, 3].map((i) => -r.reduce((acc, rk, k) => acc + J[k][i] * rk, 0));
    // solve 4x4 by Gaussian elimination
    const M = A.map((row, i) => [...row, g[i]]);
    for (let i = 0; i < 4; i++) {
      let pv = i; for (let j = i + 1; j < 4; j++) if (Math.abs(M[j][i]) > Math.abs(M[pv][i])) pv = j;
      [M[i], M[pv]] = [M[pv], M[i]];
      for (let j = i + 1; j < 4; j++) { const f = M[j][i] / M[i][i]; for (let k = i; k < 5; k++) M[j][k] -= f * M[i][k]; }
    }
    const dq = [0, 0, 0, 0];
    for (let i = 3; i >= 0; i--) { let sum = M[i][4]; for (let k = i + 1; k < 4; k++) sum -= M[i][k] * dq[k]; dq[i] = sum / M[i][i]; }
    const qn = clampQ(q.map((v, i) => v + dq[i]));
    const r0 = r.reduce((a, v) => a + v * v, 0), r1 = resid(qn).reduce((a, v) => a + v * v, 0);
    if (r1 < r0) { q = qn; lam = Math.max(1e-6, lam * 0.3); } else lam *= 10;
    if (Math.sqrt(r1) < 1e-6) break;
  }
  return q;
};
export type Leg = {pts: V3[]; rs: number[]; under: V3[]; q: number[]; err: number; foot: Foot; socket: V3; pressure: number};
export const legAt = (t: number, i: number, P: Pose): Leg => {
  const foot = footAt(t, i);
  const F0 = rootFrame(P, i);
  const target: V3 = [foot.p[0], LEG_R1 + foot.lift, foot.p[2]];
  const q = solveLeg(F0, target);
  const sh = shape(F0, q);
  const pts = sh.pts;
  const n = pts.length - 1;
  // pressure in the chambers: rises as the swing starts, released as the foot sets down (drives the visuals)
  const pressure = foot.planted ? 0 : Math.sin(Math.PI * Math.min(1, foot.phase * 1.25));
  const rs = pts.map((_, k) => lerp(LEG_R0, LEG_R1, Math.pow(k / n, 0.85)) * (1 + 0.06 * pressure * Math.sin((Math.PI * k) / n)));
  // the strain-limiting layer runs along the down side of each section
  const under: V3[] = [];
  const s1 = section(F0, SEC1, q[0], q[1], N1);
  const frames: Frame[] = [F0];
  void s1;
  // rebuild per-sample normals by walking the sections with fine steps
  let F = F0;
  under.push(v3.add(F.p, v3.mul(F.n, rs[0] * 0.8)));
  for (const [L, k, ph, m] of [[SEC1, q[0], q[1], N1], [SEC2, q[2], q[3], N2]] as [number, number, number, number][]) {
    for (let j = 0; j < m; j++) {
      const st = section(F, L / m, k, ph, 1);
      F = st.end; frames.push(F);
      under.push(v3.add(F.p, v3.mul(v3.add(v3.mul(F.n, Math.cos(ph)), v3.mul(F.l, Math.sin(ph))), rs[frames.length - 1] * 0.8)));
    }
  }
  return {pts, rs, under, q, err: v3.len(v3.sub(sh.end.p, target)), foot, socket: F0.p, pressure};
};

// ------------------------------------------------------------------------------------------------ the air line
// One tether (air lines + the electrode cable, bundled) from a FIXED spout on the hub's left rim (between legs 1 and 2)
// to a tether boom that tracks the walker from above and to its left (smoothed, like a gantry follower). The cable is a
// catenary of fixed slack through those two points; in the walker's frame its shape barely changes, it never crosses the
// dome, and it leaves the frame toward the side rather than straight up through the middle.
export const CABLE_R = 0.15;
const spoutAngle = (P: Pose) => P.th + (1.5 * 2 * Math.PI) / 5; // midway between legs 1 and 2
export const spoutBase = (P: Pose): V3 => { const a = spoutAngle(P); return [P.x + (HUB_R - 0.45) * Math.cos(a), P.y + HUB_H / 2, P.z + (HUB_R - 0.45) * Math.sin(a)]; };
export const cableFitting = (P: Pose): V3 => { const b = spoutBase(P); return [b[0], b[1] + 0.7, b[2]]; };
export const boomAt = (t: number): V3 => {
  const c = smoothCentre(t), th = smoothHeading(t) + yawOff(t) * 0.6 + (1.5 * 2 * Math.PI) / 5;
  return [c[0] + 13 * Math.cos(th), 30, c[2] + 13 * Math.sin(th)];
};
export const cableAt = (P: Pose, t: number, N = 40): V3[] => {
  const A = cableFitting(P), B = boomAt(t);
  const dx = Math.hypot(B[0] - A[0], B[2] - A[2]), dy = B[1] - A[1];
  const L = Math.hypot(dx, dy) * 1.035;
  const f = (a: number) => 2 * a * Math.sinh(dx / (2 * a)) - Math.sqrt(L * L - dy * dy);
  let lo = 0.05, hi = 1e4;
  for (let it = 0; it < 80; it++) { const m = Math.sqrt(lo * hi); if (f(m) > 0) lo = m; else hi = m; }
  const a = Math.sqrt(lo * hi);
  const x0 = dx / 2 - a * Math.atanh(dy / L), c0 = -a * Math.cosh(-x0 / a);
  const hd: [number, number] = dx > 1e-6 ? [(B[0] - A[0]) / dx, (B[2] - A[2]) / dx] : [0, 0];
  const out: V3[] = [];
  for (let k = 0; k <= N; k++) { const x = (dx * k) / N; out.push([A[0] + hd[0] * x, A[1] + a * Math.cosh((x - x0) / a) + c0, A[2] + hd[1] * x]); }
  return out;
};

// ------------------------------------------------------------------------------------------------ cues for sound
export const landings = () => {
  const out: {t: number; i: number; kind: string}[] = [];
  for (const e of EVENTS) for (let i = 0; i < 5; i++) out.push({t: swingWin(e, i)[1], i, kind: e.kind});
  return out.sort((p, q) => p.t - q.t);
};
export const swingStarts = () => {
  const out: {t: number; i: number; kind: string}[] = [];
  for (const e of EVENTS) for (let i = 0; i < 5; i++) out.push({t: swingWin(e, i)[0], i, kind: e.kind});
  return out.sort((p, q) => p.t - q.t);
};
export const PATH_CENTROID: V3 = (() => {
  let sx = 0, sz = 0;
  for (let k = 0; k < 120; k++) { const p = pathAt((k / 120) * W_TOTAL); sx += p.x; sz += p.z; }
  return [sx / 120, 0, sz / 120];
})();
export const TETHER_ANCHOR: V3 = [PATH_CENTROID[0], 34, PATH_CENTROID[2]];
void DUR;
