// V3 beat B (4.31-7.81): the camera and the side streamer's 3D geometry.
//
// The camera is the opening camera (openCam) with a crisp 2D push on top: a zoom by Z about a focus point Q (a 3D point
// that moves from the streamer's root on the channel to its stalled tip T), whose screen point eases to a chosen
// framing point. At 4.31 Z = 1 and the focus sits on its own projection, so the frame is exactly A's view (openCam,
// openSt); every eased parameter starts with zero velocity, so the move grows out of A's drift without a kink.
//
// One log-zoom L(t) drives both scales: the macro view is zoomed by exp(L); the molecular view (micro units: one unit
// is one screen px at micro scale 1) is anchored at T's screen point and scaled by m = exp(L - LM). The two layers
// therefore zoom about the same screen point at the same rate through the dissolve, and the streamer, drawn once on
// top, never doubles.
import {sm5} from '../camera';
import {clamp, hash} from '../dc/math';
import {ss} from '../lib';
import {add3, axis3, basis, BOLT3, Cam3, len3, lerp3, mul3, norm3, projector, sub3, v3, V3} from '../v2/p3';
import {openCam} from './cams3';

const u = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const T0 = 4.31, T1 = 7.81;

// ------------------------------------------------------------------ the side streamer (metres, site model)
/** where the streamer leaves the channel: the guided bolt point nearest to the beam axis 90 site px above the tip */
export const ROOT_H = 90;
export const ROOT3: V3 = (() => {
  const a = axis3(ROOT_H);
  let best = BOLT3.pts[0], d = 1e9;
  for (const p of BOLT3.pts) {
    const e = len3(sub3(p, a));
    if (e < d) { d = e; best = p; }
  }
  return v3(best.x, best.y, best.z);
})();
/** the streamer's three jumps, as directions in the opening camera's screen plane (deg clockwise from up) with a little
 *  depth (toward the camera, negative), so it is a real 3D path: a sideways jab out of the channel, then steps that
 *  turn upward-right, toward the direction the later channel takes (MICRO_ANG) */
const SEGS: [number, number, number][] = [
  [12, 70, -0.35], // snap 4.52: the jab out into the air beside the channel
  [7, 45, -0.15], // zap 4.55: first step
  [5, 25, 0], // zap 4.73: second step, then it stalls (4.85)
];
const B0 = basis(openCam(4.6));
const sdir = (a: number, dep: number): V3 => {
  const r = (a * Math.PI) / 180;
  return norm3(add3(add3(mul3(B0.r, Math.sin(r)), mul3(B0.u, Math.cos(r))), mul3(B0.f, dep)));
};
export type SP = V3 & {s: number};
/** a jagged 3D polyline between two points: recursive midpoint displacement in the screen plane (perpendicular to the
 *  segment as the camera sees it) with a little depth, so detail keeps appearing as the camera zooms in */
const jag3 = (a: V3, b: V3, seed: number, amp: number, minL: number): V3[] => {
  const out: V3[] = [a];
  const rec = (p: V3, q: V3, k: number, lvl: number) => {
    const d = sub3(q, p);
    const L = len3(d);
    if (L < minL || lvl > 14) { out.push(q); return; }
    // perpendicular in the screen plane
    const sx = d.x * B0.r.x + d.y * B0.r.y + d.z * B0.r.z, sy = d.x * B0.u.x + d.y * B0.u.y + d.z * B0.u.z;
    const n = Math.hypot(sx, sy) || 1;
    const perp = add3(mul3(B0.r, -sy / n), mul3(B0.u, sx / n));
    const o = (hash(k, seed) - 0.5) * 2 * amp * L;
    const oz = (hash(k, seed + 1) - 0.5) * amp * L * 0.6;
    const m = add3(add3(lerp3(p, q, 0.5 + (hash(k, seed + 2) - 0.5) * 0.2), mul3(perp, o)), mul3(B0.f, oz));
    rec(p, m, k * 2 + 1, lvl + 1);
    rec(m, q, k * 2 + 2, lvl + 1);
  };
  rec(a, b, 1, 0);
  return out;
};
const withS = (pts: V3[], s0 = 0): SP[] => {
  let s = s0;
  return pts.map((p, i) => {
    if (i > 0) s += len3(sub3(p, pts[i - 1]));
    return {...p, s};
  });
};
export const STR = (() => {
  const knots: V3[] = [ROOT3];
  let p = ROOT3;
  for (const [L, a, dep] of SEGS) {
    p = add3(p, mul3(sdir(a, dep), L));
    knots.push(p);
  }
  const raw: V3[] = [];
  for (let i = 0; i < 3; i++) {
    // a couple of coarse kinks per jump, then fine fractal detail (down to ~1 cm, which the molecular zoom reveals)
    const a = knots[i], b = knots[i + 1];
    const mids = [0.33, 0.67].map((f, k) => {
      const q = lerp3(a, b, f + (hash(i * 5 + k, 401) - 0.5) * 0.12);
      return add3(q, mul3(sdir(SEGS[i][1] - 90, 0), (hash(i * 5 + k, 403) - 0.5) * 0.18 * SEGS[i][0]));
    });
    const ctrl = [a, ...mids, b];
    for (let k = 0; k < 3; k++) {
      const seg = jag3(ctrl[k], ctrl[k + 1], 500 + i * 17 + k * 5, 0.16, 0.012);
      raw.push(...(raw.length ? seg.slice(1) : seg));
    }
  }
  const pts = withS(raw);
  // arc length at each knot (the streamer grows to these on the cues)
  const kS = knots.map((k) => {
    let best = 0, d = 1e9;
    pts.forEach((q, i) => { const e = len3(sub3(q, k)); if (e < d) { d = e; best = i; } });
    return pts[best].s;
  });
  // two short forks at the step points (brush-like side sparks that light with the step and die); both point up and to
  // the right of the advancing streamer, like everything else in B (the first nearly straight up, the second ~70 deg)
  const forks = [1, 2].map((ki) => {
    const base = knots[ki];
    const a = SEGS[ki - 1][1] + (ki === 1 ? -55 : 25);
    const end = add3(base, mul3(sdir(a, -0.2), 2.2 + 0.8 * ki));
    return withS(jag3(base, end, 700 + ki * 13, 0.18, 0.02));
  });
  return {pts, knots, kS, forks, T: knots[3], total: pts[pts.length - 1].s};
})();
export const TIP_T3 = STR.T;

// ------------------------------------------------------------------ the push and the zoom
/** the main zoom: a smooth bell of zoom speed over 4.31-5.5, peaking just before 5.0 (where the dissolve happens) */
const ZA = 1.6, ZB = 2.0; // velocity profile x^ZA (1-x)^ZB
const ZTAB = (() => {
  const N = 600;
  const tab = new Float64Array(N + 1);
  let acc = 0;
  for (let i = 1; i <= N; i++) {
    const x = (i - 0.5) / N;
    acc += Math.pow(x, ZA) * Math.pow(1 - x, ZB);
    tab[i] = acc;
  }
  for (let i = 0; i <= N; i++) tab[i] /= acc;
  return tab;
})();
const zprof = (x: number) => {
  const c = clamp(x) * 600;
  const i = Math.min(599, Math.floor(c));
  return ZTAB[i] + (ZTAB[i + 1] - ZTAB[i]) * (c - i);
};
/** log-zoom at which the molecular view is at its design scale (m = 1) */
export const LM = 3.35;
const LP = 0.075; // a slow continuing push during the attempts (+8 %)
export const logZoom = (t: number) => LM * zprof(u(t, T0, 5.5)) + LP * ss(t, 5.05, T1);
/** the molecular layer's scale */
export const microScale = (t: number) => Math.exp(logZoom(t) - LM);

/** the framing point the stalled tip T settles on (screen px); it drifts a little down-left during the attempts so the
 *  advancing tip stays near the middle of the frame */
const tipFrame = (t: number) => {
  const k = ss(t, 5.45, 7.6);
  return {x: 450 - 30 * k, y: 1080 + 75 * k};
};
export type AirCam = {cam: Cam3; Z: number; L: number; m: number; tip: {x: number; y: number}};
export const airCam = (t: number): AirCam => {
  const base = openCam(t);
  const L = logZoom(t);
  const Z = Math.exp(L);
  const P = projector(base);
  // the focus: from the root (where the fizz starts) to the stalled tip, reached before the dissolve
  const Q = lerp3(ROOT3, STR.T, sm5(u(t, T0, 4.92)));
  const q = P(Q);
  const w = sm5(u(t, T0, 5.3));
  const F = tipFrame(t);
  const X = {x: q.x + (F.x - q.x) * w, y: q.y + (F.y - q.y) * w};
  const cx = base.cx ?? 540, cy = base.cy ?? 960;
  const cam: Cam3 = {...base, f: base.f * Z, cx: X.x - Z * (q.x - cx), cy: X.y - Z * (q.y - cy)};
  const tip = projector(cam)(STR.T);
  return {cam, Z, L, m: Math.exp(L - LM), tip: {x: tip.x, y: tip.y}};
};
