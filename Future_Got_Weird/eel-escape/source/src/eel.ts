// The eel's body as ONE connected animal at every instant: N+1 samples from the snout (u = 0) to the tail tip (u = 1).
//
// Tract mode (swallowed, escaping): the body slides along the route (anatomy.ts) like a train on a track, so the tail
// tip LEADS and every part behind it follows the same path. A body point at u sits at route coordinate
//   σ(u) = σTip − L·(1 − u)
// σ < 0 is the stomach (the folded part relaxes as less of the eel is left inside), 0 ≤ σ ≤ S_EXIT is the esophagus,
// throat, gill slit and opercular chamber, and σ > S_EXIT is OUTSIDE the fish: an elastic rod rooted at the exit,
// shaped by a curvature function κ(a) of the arc length a from the exit (story.ts supplies κ: the tail's own flexing,
// the curl and its tightening).
//
// Free mode (from the release, once the head has cleared the gill opening): the same rod, now anchored at mid-body
// (u = 0.5) with position M(t) and tangent angle θM(t), its curvature κ(u, t) blending from the curl into a swimming
// wave. At the release instant the free pose equals the tract pose exactly (continuity is asserted in tests).
import {add, mul, P, pt} from './core/geo';
import {EEL_L, EEL_RADIUS, EXIT, P3, p3, STOMACH_FOLD, STOMACH_RELAXED, TRACT} from './anatomy';

export const N = 120;
export const US = Array.from({length: N + 1}, (_, i) => i / N);
export const RADII = US.map(EEL_RADIUS);

// ---------------------------------------------------------------- polylines with arc-length tables
type Poly = {p: P3[]; s: number[]; len: number};
/** Catmull-Rom through the control points, sampled densely, with a cumulative (3D) arc-length table */
const smooth3 = (cp: P3[], per = 24): Poly => {
  const out: P3[] = [];
  const n = cp.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = cp[Math.max(0, i - 1)], p1 = cp[i], p2 = cp[i + 1], p3_ = cp[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push(p3(f(p0.x, p1.x, p2.x, p3_.x), f(p0.y, p1.y, p2.y, p3_.y), f(p0.z, p1.z, p2.z, p3_.z)));
    }
  }
  out.push(cp[n - 1]);
  const s = [0];
  for (let i = 1; i < out.length; i++) s.push(s[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y, out[i].z - out[i - 1].z));
  return {p: out, s, len: s[s.length - 1]};
};
/** point at arc length s (linear between samples; beyond the ends it continues straight along the end tangent) */
const at = (q: Poly, s: number): P3 => {
  const n = q.p.length;
  if (s <= 0) {
    const a = q.p[0], b = q.p[1], l = q.s[1] || 1;
    return p3(a.x + ((a.x - b.x) / l) * -s, a.y + ((a.y - b.y) / l) * -s, a.z + ((a.z - b.z) / l) * -s);
  }
  if (s >= q.len) {
    const a = q.p[n - 1], b = q.p[n - 2], l = q.len - q.s[n - 2] || 1;
    const e = s - q.len;
    return p3(a.x + ((a.x - b.x) / l) * e, a.y + ((a.y - b.y) / l) * e, a.z + ((a.z - b.z) / l) * e);
  }
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (q.s[m] <= s) lo = m; else hi = m;
  }
  const u = (s - q.s[lo]) / (q.s[hi] - q.s[lo] || 1);
  const a = q.p[lo], b = q.p[hi];
  return p3(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u);
};

export const TRACT_POLY = smooth3(TRACT);
/** route coordinate of the exit (the gill cover's rear edge) */
export const S_EXIT = TRACT_POLY.len;
const FOLD = smooth3(STOMACH_FOLD.map((q) => p3(q.x, q.y, 0)));
const RELAX = smooth3(STOMACH_RELAXED.map((q) => p3(q.x, q.y, 0)));
/** route coordinate where the tract reaches the throat (the turn toward the gills begins) and the gill slit */
const nearest = (q: P) => {
  let best = 0, bd = 1e9;
  for (let i = 0; i < TRACT_POLY.p.length; i++) {
    const d = Math.hypot(TRACT_POLY.p[i].x - q.x, TRACT_POLY.p[i].y - q.y);
    if (d < bd) { bd = d; best = i; }
  }
  return TRACT_POLY.s[best];
};
export const S_THROAT = nearest(pt(-28.4, 0.85));
export const S_SLIT = nearest(pt(-30.55, -2.5));
export const S_CHAMBER = nearest(pt(-29.2, -4.15));

/** the route point at σ, for a stomach fold amount f (1 = the full Z-fold, 0 = relaxed) */
export const routeAt = (sig: number, f: number): P3 => {
  if (sig >= 0) return at(TRACT_POLY, sig);
  const a = at(FOLD, -sig), b = at(RELAX, -sig);
  return p3(b.x + (a.x - b.x) * f, b.y + (a.y - b.y) * f, 0);
};
/** the tract's exit tangent angle (screen angle, y down): the direction the body leaves the fish */
export const EXIT_TANGENT = (() => {
  const a = at(TRACT_POLY, S_EXIT - 0.6), b = at(TRACT_POLY, S_EXIT);
  return Math.atan2(b.y - a.y, b.x - a.x);
})();

// ---------------------------------------------------------------- drivers (supplied by story.ts)
export type Drivers = {
  /** route coordinate of the tail tip */
  sigTip: (t: number) => number;
  /** curvature of the outside rod at arc a from the exit (outside length lo), radians per unit */
  kOut: (a: number, lo: number, t: number) => number;
  /** lateral undulation (units) of the body inside the fish, at body coordinate u and route coordinate σ */
  wiggle: (u: number, sig: number, t: number) => number;
  /** the release time: head at the exit; from here on the free mode applies */
  tRelease: number;
  /** free mode: how far the curvature has blended from the outside rod into the swim wave (0..1) */
  relax: (t: number) => number;
  /** free mode swimming curvature at body coordinate u */
  kSwim: (u: number, t: number) => number;
  /** free mode: mid-body position offset from its release position, and tangent angle offset (radians) */
  freeMove: (t: number) => {d: P; dth: number};
  /** the outside body's depth (fish-local z) */
  outZ: (t: number) => number;
  /** free mode: an extra rotation of the whole body about its head (the last tail sweep past the lens) */
  pivotRot: (t: number) => number;
  /** free mode: a sideways shift of the body (world units), applied last (the departing tail's sweep across the lens) */
  sweepShift: (t: number) => P;
};

export type EelPose = {
  pts: P3[];
  /** σ of each sample (tract mode) or NaN (free mode) */
  sig: number[];
  /** samples with index < exitIdx are inside the fish; exitIdx = N + 1 when the whole eel is inside, 0 when free */
  exitIdx: number;
  free: boolean;
  sigTip: number;
  /** stomach fold amount */
  fold: number;
};

/** the fold of the stomach part as a function of how much eel is left in the stomach */
export const foldFor = (insideStomach: number) => {
  const x = Math.min(1, Math.max(0, (insideStomach - 16) / (46 - 16)));
  return x * x * (3 - 2 * x);
};

/** integrate a rod from a root point and angle: arc step da, curvature function k(a) */
const rod = (root: P, th0: number, length: number, k: (a: number) => number, da = 0.2) => {
  const n = Math.max(1, Math.ceil(length / da));
  const step = length / n;
  const ps: P[] = [root];
  const th: number[] = [th0];
  let x = root.x, y = root.y, a = 0, ang = th0;
  for (let i = 0; i < n; i++) {
    const km = k(a + step / 2);
    const am = ang + (km * step) / 2;
    x += Math.cos(am) * step;
    y += Math.sin(am) * step;
    ang += km * step;
    a += step;
    ps.push(pt(x, y));
    th.push(ang);
  }
  const sample = (s: number) => {
    const f = Math.min(n, Math.max(0, s / step));
    const i = Math.min(n - 1, Math.floor(f)), r = f - i;
    return {p: pt(ps[i].x + (ps[i + 1].x - ps[i].x) * r, ps[i].y + (ps[i + 1].y - ps[i].y) * r), th: th[i] + (th[i + 1] - th[i]) * r};
  };
  return sample;
};

/** tract-mode pose */
const tractPose = (t: number, D: Drivers): EelPose => {
  const sigTip = D.sigTip(t);
  const lo = Math.max(0, sigTip - S_EXIT);
  const insideStomach = Math.max(0, Math.min(EEL_L, EEL_L - sigTip));
  const f = foldFor(insideStomach);
  const out = lo > 0 ? rod(pt(EXIT.x, EXIT.y), EXIT_TANGENT, lo, (a) => D.kOut(a, lo, t)) : null;
  const z = D.outZ(t);
  const pts: P3[] = [], sig: number[] = [];
  let exitIdx = N + 1;
  for (let i = 0; i <= N; i++) {
    const u = US[i];
    const s = sigTip - EEL_L * (1 - u);
    sig.push(s);
    if (s <= S_EXIT || !out) {
      const c = routeAt(Math.min(s, S_EXIT), f);
      // lateral undulation, perpendicular to the route in the side view
      const c2 = routeAt(Math.min(s, S_EXIT) + 0.3, f);
      const tx = c2.x - c.x, ty = c2.y - c.y, tl = Math.hypot(tx, ty) || 1;
      const w = D.wiggle(u, s, t);
      pts.push(p3(c.x - (ty / tl) * w, c.y + (tx / tl) * w, c.z));
    } else {
      if (exitIdx > N) exitIdx = i;
      const r = out(s - S_EXIT);
      pts.push(p3(r.p.x, r.p.y, z));
    }
  }
  return {pts, sig, exitIdx, free: false, sigTip, fold: f};
};

// the release state, computed once: the tract pose's mid-body point and tangent at the release instant
let REL: {M: P; th: number; D: Drivers} | null = null;
const releaseState = (D: Drivers) => {
  if (REL && REL.D === D) return REL;
  const t = D.tRelease;
  const lo = EEL_L; // at the release instant the whole eel is outside, the snout at the exit
  const out = rod(pt(EXIT.x, EXIT.y), EXIT_TANGENT, lo, (a) => D.kOut(a, lo, t));
  const m = out(EEL_L / 2);
  REL = {M: m.p, th: m.th, D};
  return REL;
};

/** free-mode pose: a rod anchored at mid-body, integrated toward the tail and toward the head. The swim wave's own
 *  rigid part (the yaw and shift a travelling wave gives a mid-anchored rod) is removed, so the body keeps its heading
 *  while it undulates; finally an optional rotation about the head (pivotRot). */
const freePose = (t: number, D: Drivers): EelPose => {
  const R = releaseState(D);
  const rx = D.relax(t);
  const k = (u: number) => D.kOut(u * EEL_L, EEL_L, t) * (1 - rx) + D.kSwim(u, t) * rx;
  const mv = D.freeMove(t);
  const half = EEL_L / 2;
  // the swim wave alone, from a straight reference: its chord yaw and centroid offset
  let dYaw = 0, gx = 0, gy = 0;
  if (rx > 0) {
    const sT = rod(pt(0, 0), 0, half, (a) => D.kSwim(0.5 + a / EEL_L, t));
    const sH = rod(pt(0, 0), Math.PI, half, (a) => -D.kSwim(0.5 - a / EEL_L, t));
    const hp = sH(half).p, tp = sT(half).p;
    dYaw = Math.atan2(tp.y - hp.y, tp.x - hp.x);
    for (let i = 0; i <= 20; i++) {
      const q = i < 10 ? sH(half * (1 - i / 10)).p : sT(half * ((i - 10) / 10)).p;
      gx += q.x / 21; gy += q.y / 21;
    }
  }
  const thM = R.th + mv.dth - rx * dYaw;
  const c = Math.cos(thM - 0), sn = Math.sin(thM);
  const gR = pt(gx * Math.cos(-rx * dYaw) - gy * Math.sin(-rx * dYaw), gx * Math.sin(-rx * dYaw) + gy * Math.cos(-rx * dYaw));
  void c; void sn;
  const M = pt(R.M.x + mv.d.x - rx * (gR.x * Math.cos(thM) - gR.y * Math.sin(thM)), R.M.y + mv.d.y - rx * (gR.x * Math.sin(thM) + gR.y * Math.cos(thM)));
  const tail = rod(M, thM, half, (a) => k(0.5 + a / EEL_L));
  const head = rod(M, thM + Math.PI, half, (a) => -k(0.5 - a / EEL_L));
  const z = D.outZ(t);
  const pts: P3[] = [], sig: number[] = [];
  for (let i = 0; i <= N; i++) {
    const u = US[i];
    const q = u >= 0.5 ? tail((u - 0.5) * EEL_L).p : head((0.5 - u) * EEL_L).p;
    pts.push(p3(q.x, q.y, z));
    sig.push(NaN);
  }
  const pr = D.pivotRot(t);
  if (pr !== 0) {
    const pv = pts[0], cr = Math.cos(pr), sr = Math.sin(pr);
    for (const q of pts) {
      const dx = q.x - pv.x, dy = q.y - pv.y;
      q.x = pv.x + dx * cr - dy * sr;
      q.y = pv.y + dx * sr + dy * cr;
    }
  }
  const sh = D.sweepShift(t);
  if (sh.x !== 0 || sh.y !== 0) for (const q of pts) { q.x += sh.x; q.y += sh.y; }
  return {pts, sig, exitIdx: 0, free: true, sigTip: S_EXIT + EEL_L, fold: 0};
};

/** the mid-body point and tangent angle at the release instant (free mode starts from these) */
export const releaseMid = (D: Drivers) => {
  const r = releaseState(D);
  return {M: r.M, th: r.th};
};
export const eelPose = (t: number, D: Drivers): EelPose => (t >= D.tRelease ? freePose(t, D) : tractPose(t, D));

/** unit tangent (snout→tail) at sample i, in the side view */
export const tangentAt = (ps: P3[], i: number): P => {
  const a = ps[Math.max(0, i - 1)], b = ps[Math.min(ps.length - 1, i + 1)];
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return pt((b.x - a.x) / l, (b.y - a.y) / l);
};
export const sideOf = (ps: P3[]): P[] => ps.map((q) => pt(q.x, q.y));
export const offsetPt = (q: P, n: P, r: number) => add(q, mul(n, r));
