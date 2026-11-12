// V2 rig: one persistent five-legged soft walker (after Mishra et al., Science Robotics 2024: a five-limbed soft robot
// whose pneumatic legs are actuated through valves). World units cm, y up. Every function is a pure function of time.
//
// Each leg is a soft pneumatic bending actuator, modelled the way such actuators deform: a constant-curvature arc of
// FIXED length LEG_L from a FIXED socket on the hub wall to the foot. Given the foot, the arc is solved exactly (IK), so
// a leg can never stretch, detach, kink or flip. Feet are planted in world space during stance and travel a lifted arc
// during swing. Every constraint is asserted per frame by tools/v2/geom_audit.ts.
import {lerp, ss, V3, v3, wobble} from '../lib';
import {DUR, EVENTS, EVENTS_EXT, Ev, LEG_ORDER, LEG_OFF, SWING} from './timing';

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
/** where leg i lands after event e: neutral under the body as it will stand, half a stride ahead (so the planted foot
 * spans about +-half a stride relative to neutral during the following stance) */
const plantFor = (e: Ev, i: number): V3 => {
  const tEnd = e.start + e.D + 1e-3;
  const p = pathAt(walked(tEnd));
  const th = p.th + yawOff(tEnd);
  const a = legAngle(th, i);
  const ahead = 0.4 * STRIDE * e.w;
  return [p.x + FOOT_R * Math.cos(a) + ahead * Math.cos(p.th), 0, p.z + FOOT_R * Math.sin(a) + ahead * Math.sin(p.th)];
};
const PLANTS: V3[][] = EXT.map((e) => [0, 1, 2, 3, 4].map((i) => plantFor(e, i)));
export const swingWin = (e: Ev, i: number) => {
  const a = e.start + LEG_OFF[LEG_ORDER.indexOf(i)] * e.D;
  return [a, a + SWING * e.D];
};
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
export type Foot = {p: V3; lift: number; swing: number; planted: boolean; k: number};
export const footAt = (t: number, i: number): Foot => {
  let k = -1;
  for (let j = 0; j < EXT.length; j++) { if (swingWin(EXT[j], i)[0] <= t) k = j; else break; }
  const e = EXT[k];
  const [a, b] = swingWin(e, i);
  const prev = PLANTS[k - 1][i], next = PLANTS[k][i];
  if (t >= b) return {p: next, lift: 0, swing: 0, planted: true, k};
  const s = (t - a) / (b - a);
  const amp = e.kind === 'uv' ? 1.2 : e.kind === 'featured' ? 1.3 : 1;
  // lift first, travel, then set down. The travel is interpolated in the BODY frame (start and end are exactly the
  // world footholds), so the swinging foot keeps its distance from its socket while the body moves.
  const h = ss(0.12, 0.88, s);
  const Pa = pathPose(a), Pb = pathPose(b), Pt = pathPose(t);
  const ra = toBody(Pa, prev), rb = toBody(Pb, next);
  const rel: [number, number] = [lerp(ra[0], rb[0], h), lerp(ra[1], rb[1], h)];
  const p = fromBody(Pt, rel);
  return {p, lift: LIFT * amp * Math.sin(Math.PI * s), swing: Math.sin(Math.PI * s), planted: false, k};
};

// ------------------------------------------------------------------------------------------------ leg IK
const sinc = (x: number) => (Math.abs(x) < 1e-6 ? 1 : Math.sin(x) / x);
/** solve the bend angle theta of a constant-curvature arc of length L spanning a chord c: L*sinc(theta/2) = c */
const solveTheta = (ratio: number) => {
  let lo = 1e-4, hi = 1.9 * Math.PI;
  for (let it = 0; it < 50; it++) { const m = (lo + hi) / 2; if (sinc(m / 2) > ratio) lo = m; else hi = m; }
  return (lo + hi) / 2;
};
export type Leg = {pts: V3[]; rs: number[]; ratio: number; clamped: boolean; theta: number; foot: Foot; socket: V3};
export const legAt = (t: number, i: number, P: Pose, N = 22): Leg => {
  const foot = footAt(t, i);
  const H = socket(P, i);
  const F: V3 = [foot.p[0], LEG_R1 + foot.lift, foot.p[2]];
  const Cv = v3.sub(F, H);
  const c = v3.len(Cv);
  const ratioRaw = c / LEG_L;
  const ratio = Math.min(RATIO_MAX, Math.max(RATIO_MIN, ratioRaw));
  const clamped = ratio !== ratioRaw;
  const th = solveTheta(ratio);
  const R = LEG_L / th;
  // the arc lies in the vertical plane through H and F and bulges upward
  const e1 = v3.mul(Cv, 1 / c);
  const up: V3 = [0, 1, 0];
  const e2 = v3.nrm(v3.sub(up, v3.mul(e1, v3.dot(up, e1))));
  // with the chord as drawn (clamped ratio keeps length exact: the arc then ends short of / past F along the chord)
  const cc = R * 2 * Math.sin(th / 2);
  const M = v3.add(H, v3.mul(e1, cc / 2));
  const O = v3.sub(M, v3.mul(e2, R * Math.cos(th / 2)));
  const pts: V3[] = [], rs: number[] = [];
  for (let k = 0; k <= N; k++) {
    const s = k / N;
    const al = Math.PI / 2 + th / 2 - s * th;
    pts.push(v3.add(O, v3.add(v3.mul(e1, R * Math.cos(al)), v3.mul(e2, R * Math.sin(al)))));
    rs.push(lerp(LEG_R0, LEG_R1, Math.pow(s, 0.85)) * (1 + 0.07 * foot.swing * Math.sin(Math.PI * s)));
  }
  return {pts, rs, ratio: ratioRaw, clamped, theta: th, foot, socket: H};
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
export const TETHER_ANCHOR: V3 = [PATH_CENTROID[0], 55, PATH_CENTROID[2]];
void DUR;
