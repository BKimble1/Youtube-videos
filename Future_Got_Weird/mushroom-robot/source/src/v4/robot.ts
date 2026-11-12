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

// ------------------------------------------------------------------------------------------------ leg rig (V4)
// One soft pneumatic leg = two inextensible constant-curvature sections (the standard PCC soft-robot model), root
// clamped to the body. V4 parameterises each section by its CURVATURE VECTOR u = (ux, uy) in the section's own
// (bend-down, lateral) frame: well defined through zero curvature, so the bend direction can never flip. The IK is
// solved by CONTINUATION along time (a warm-started track precomputed at 240 Hz from a fixed state before the film),
// then refined per frame from the interpolated track, so the leg's shape is one smooth function of time.
// The leg SURFACE is a swept tube: rings of fixed angular count at fixed arc lengths, oriented by the actuator's own
// transported frame. Shading, the rib markings, the strain-limiting stripe and the air channel are all read off this one
// surface (no screen-space decoration), and the radius profile never changes.
export const SEC1 = 3.0, SEC2 = 4.3; // section lengths (sum = LEG_L)
export const ROOT_UP = (16 * Math.PI) / 180;
export const UX_MIN = -0.15, UX_MAX = 0.75, UY_MAX = 0.4; // 1/cm: bend-down curvature range, lateral curvature limit
export type Frame = {p: V3; t: V3; n: V3; l: V3}; // position, tangent, bend-down side, lateral
const rotAbout = (v: V3, k: V3, a: number): V3 => {
  const c = Math.cos(a), s = Math.sin(a);
  return v3.add(v3.add(v3.mul(v, c), v3.mul(v3.cross(k, v), s)), v3.mul(k, v3.dot(k, v) * (1 - c)));
};
/** frame at arc length s along a constant-curvature section with curvature vector (ux, uy) in F's (n, l) */
const along = (F: Frame, ux: number, uy: number, s: number): Frame => {
  const k = Math.hypot(ux, uy);
  if (k < 1e-9) return {p: v3.add(F.p, v3.mul(F.t, s)), t: F.t, n: F.n, l: F.l};
  const d = v3.mul(v3.add(v3.mul(F.n, ux), v3.mul(F.l, uy)), 1 / k);
  const ax = v3.cross(F.t, d);
  const p = v3.add(F.p, v3.add(v3.mul(F.t, Math.sin(k * s) / k), v3.mul(d, (1 - Math.cos(k * s)) / k)));
  const a = k * s;
  return {p, t: rotAbout(F.t, ax, a), n: rotAbout(F.n, ax, a), l: rotAbout(F.l, ax, a)};
};
export const rootFrame = (P: Pose, i: number): Frame => {
  const a = legAngle(P.th, i);
  const rad: V3 = [Math.cos(a), 0, Math.sin(a)], up: V3 = [0, 1, 0], lat: V3 = [-Math.sin(a), 0, Math.cos(a)];
  const t = v3.add(v3.mul(rad, Math.cos(ROOT_UP)), v3.mul(up, Math.sin(ROOT_UP)));
  const n = v3.mul(v3.add(v3.mul(rad, -Math.sin(ROOT_UP)), v3.mul(up, Math.cos(ROOT_UP))), -1);
  return {p: socket(P, i), t, n, l: lat};
};
const endOf = (F0: Frame, q: number[]) => along(along(F0, q[0], q[1], SEC1), q[2], q[3], SEC2).p;
const clampQ = (q: number[]) => [Math.min(UX_MAX, Math.max(UX_MIN, q[0])), Math.min(UY_MAX, Math.max(-UY_MAX, q[1])),
  Math.min(UX_MAX, Math.max(UX_MIN, q[2])), Math.min(UY_MAX, Math.max(-UY_MAX, q[3]))];
const REG = [0.015, 0.05, 0.015, 0.05];
const gnStep = (F0: Frame, target: V3, q: number[], iters: number) => {
  let lam = 1e-4;
  const resid = (qq: number[]) => { const e = v3.sub(endOf(F0, qq), target); return [e[0], e[1], e[2], REG[0] * qq[0], REG[1] * qq[1], REG[2] * qq[2], REG[3] * qq[3]]; };
  for (let it = 0; it < iters; it++) {
    const r = resid(q);
    const J: number[][] = r.map(() => [0, 0, 0, 0]);
    for (let c = 0; c < 4; c++) { const qq = [...q]; qq[c] += 1e-6; const r2 = resid(qq); for (let k = 0; k < r.length; k++) J[k][c] = (r2[k] - r[k]) / 1e-6; }
    const A = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => r.reduce((acc, _, k) => acc + J[k][i] * J[k][j], 0) + (i === j ? lam : 0)));
    const g = [0, 1, 2, 3].map((i) => -r.reduce((acc, rk, k) => acc + J[k][i] * rk, 0));
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
    if (r1 <= r0) { q = qn; lam = Math.max(1e-7, lam * 0.3); } else lam *= 10;
    if (Math.sqrt(r0) < 1e-7) break;
  }
  return q;
};
const targetOf = (t: number, i: number): {target: V3; foot: Foot} => {
  const foot = footAt(t, i);
  return {target: [foot.p[0], LEG_R1 + foot.lift, foot.p[2]], foot};
};
// the continuation track: q(t) for each leg at 240 Hz, warm-started from the previous sample
const GRID = 240, T0 = -1.0, T1 = DUR + 1.0;
const NG = Math.ceil((T1 - T0) * GRID) + 1;
const TRACK: Float64Array[] = [0, 1, 2, 3, 4].map((i) => {
  const out = new Float64Array(NG * 4);
  let q = [0.12, 0, 0.45, 0];
  for (let g = 0; g < NG; g++) {
    const t = T0 + g / GRID;
    const P = pose(t);
    q = gnStep(rootFrame(P, i), targetOf(t, i).target, q, g === 0 ? 60 : 6);
    out.set(q, g * 4);
  }
  return out;
});
export const trackQ = (t: number, i: number) => {
  const f = Math.min(NG - 1.000001, Math.max(0, (t - T0) * GRID)), g = Math.floor(f), k = f - g;
  const A = TRACK[i];
  return [0, 1, 2, 3].map((c) => A[g * 4 + c] * (1 - k) + A[(g + 1) * 4 + c] * k);
};
export const NR = 18; // vertices per ring
const RING_S = (() => { // arc lengths of the rings: fixed for ever (the rib markings ride on them)
  const out: number[] = [];
  for (let j = 0; j <= 10; j++) out.push((SEC1 * j) / 10);
  for (let j = 1; j <= 14; j++) out.push(SEC1 + (SEC2 * j) / 14);
  return out;
})();
export const RIB_RINGS = RING_S.map((_, k) => k).filter((k) => k >= 2 && k <= RING_S.length - 3 && k % 2 === 0);
export const radiusAt = (s: number) => lerp(LEG_R0, LEG_R1, Math.pow(s / LEG_L, 0.85));
export type Leg = {
  frames: Frame[]; s: number[]; rs: number[]; pts: V3[]; q: number[]; err: number; foot: Foot; socket: V3;
  rings: V3[][]; normals: V3[][]; cap: V3[][]; capN: V3[][];
};
export const legAt = (t: number, i: number, P: Pose): Leg => {
  const {target, foot} = targetOf(t, i);
  const F0 = rootFrame(P, i);
  const q = gnStep(F0, target, trackQ(t, i), 4);
  const F1 = along(F0, q[0], q[1], SEC1);
  const frames = RING_S.map((s) => (s <= SEC1 ? along(F0, q[0], q[1], s) : along(F1, q[2], q[3], s - SEC1)));
  const rs = RING_S.map(radiusAt);
  const pts = frames.map((F) => F.p);
  const ring = (F: Frame, r: number) => Array.from({length: NR}, (_, a) => {
    const ang = (a / NR) * 2 * Math.PI; // 0 = bend-down side (strain-limiting layer), PI = top (air channel)
    const nn = v3.add(v3.mul(F.n, Math.cos(ang)), v3.mul(F.l, Math.sin(ang)));
    return nn;
  });
  const normals = frames.map((F) => ring(F, 1));
  const rings = frames.map((F, k) => normals[k].map((nn) => v3.add(F.p, v3.mul(nn, rs[k]))));
  // a hemispherical cap on the foot
  const FE = frames[frames.length - 1], rE = rs[rs.length - 1];
  const cap: V3[][] = [], capN: V3[][] = [];
  for (let c = 1; c <= 3; c++) {
    const th = (c / 3) * (Math.PI / 2) * 0.999;
    const nrm = normals[normals.length - 1].map((nn) => v3.nrm(v3.add(v3.mul(nn, Math.cos(th)), v3.mul(FE.t, Math.sin(th)))));
    capN.push(nrm);
    cap.push(nrm.map((nn) => v3.add(FE.p, v3.mul(nn, rE))));
  }
  return {frames, s: RING_S, rs, pts, q, err: v3.len(v3.sub(FE.p, target)), foot, socket: F0.p, rings, normals, cap, capN};
};

// ------------------------------------------------------------------------------------------------ occlusion by the body
/** true if the straight line from the eye to p passes through the hub (cylinder + top cap) or the dome first */
export const hiddenByBody = (eye: V3, p: V3, P: Pose) => {
  const yTop = P.y + HUB_H / 2, yBot = P.y - HUB_H / 2;
  const d = v3.sub(p, eye);
  // cylinder side: solve |(o + t d)_xz - c_xz| = R for t in (0, 1)
  const ox = eye[0] - P.x, oz = eye[2] - P.z;
  const a = d[0] * d[0] + d[2] * d[2], b = 2 * (ox * d[0] + oz * d[2]), c = ox * ox + oz * oz - HUB_R * HUB_R;
  const disc = b * b - 4 * a * c;
  const hits: number[] = [];
  if (disc > 0 && a > 1e-12) { const sq = Math.sqrt(disc); hits.push((-b - sq) / (2 * a), (-b + sq) / (2 * a)); }
  for (const tt of hits) if (tt > 1e-4 && tt < 1 - 1e-3) { const y = eye[1] + tt * d[1]; if (y >= yBot && y <= yTop) return true; }
  // top and bottom caps
  for (const yc of [yTop, yBot]) if (Math.abs(d[1]) > 1e-12) {
    const tt = (yc - eye[1]) / d[1];
    if (tt > 1e-4 && tt < 1 - 1e-3) { const x = eye[0] + tt * d[0] - P.x, z = eye[2] + tt * d[2] - P.z; if (x * x + z * z <= HUB_R * HUB_R) return true; }
  }
  // dome (half ellipsoid above the top)
  const ry = DOME_R * 0.78;
  const ex = eye[0] - P.x, ey = (eye[1] - yTop) / ry, ez = eye[2] - P.z;
  const dx = d[0], dy = d[1] / ry, dz = d[2];
  const A2 = (dx * dx + dz * dz) / (DOME_R * DOME_R) + dy * dy, B2 = 2 * ((ex * dx + ez * dz) / (DOME_R * DOME_R) + ey * dy), C2 = (ex * ex + ez * ez) / (DOME_R * DOME_R) + ey * ey - 1;
  const D2 = B2 * B2 - 4 * A2 * C2;
  if (D2 > 0) { const sq = Math.sqrt(D2); for (const tt of [(-B2 - sq) / (2 * A2), (-B2 + sq) / (2 * A2)]) if (tt > 1e-4 && tt < 1 - 1e-3 && ey + tt * dy >= 0) return true; }
  return false;
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
