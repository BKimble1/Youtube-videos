// V4: the ONE eel outside the predator, in 3D (the predator's frame, v4/three.ts), for every exterior shot from the
// poke (12.58) to the end. A pure function of global time t.
//
// Rooted mode (until the snout clears the gill opening, T_REL): the body is a rod rooted at the gill exit. `out(t)` is
// how much of it is outside; a body point at u sits at arc length a = out − L·(1 − u) from the exit (a < 0: still
// inside, on the INWARD route under the gill cover, where the renderer clips it to the gill gap). The outside shape is
// integrated from the exit along a direction field T(a, t) = (cosβ cosθ, −cosβ sinθ, sinβ): θ is the angle in the
// vertical plane parallel to the flank (from +x, the current's direction, toward up), β the slope out of that plane
// (toward the near side, +z). As `out` grows every body point slides outward along the curve: the TAIL LEADS.
//
// Free mode (after T_REL): the body keeps its release shape and momentum, anchored at mid-body; its tangents relax
// from the curl into a swimming wave around a heading that turns away from the predator; the anchor moves with the
// pull's momentum, then swims (head first) along the escape direction.
import {EXIT} from '../anatomy';
import {clamp, keyS, lerp, sm, ss} from '../lib';
import {add3, basis, cross3, dot3, len3, mul3, norm3, orbitCam, sub3, V3} from './three';
import {EEL_L, EEL_R_MAX, Eel3Pose, N, RADII, US} from './eelV4';
import {predGeom, PRED_REST} from './art/pred3d';
import {T} from './timing';

const D = Math.PI / 180;

// ---------------------------------------------------------------- the exit and the inward route (under the cover)
/** where the eel crosses the gill opening (the cover's rear edge) and its outward direction. The predator module's
 *  predGeom().exit can replace these; the default is V3's EXIT and a direction back, up and out from under the cover */
export type Exit = {p: V3; out: V3};
export const EXIT0: Exit = {p: [EXIT.x, EXIT.y, EXIT.z], out: norm3([0.87, -0.27, 0.43])};
/** the exit on the cover's rear edge as the cover lifts (pred3d's geometry, sampled once and interpolated) */
const EXIT_G = (() => {
  const B = basis(orbitCam({target: [0, 0, 0], az: 0, el: 0, d: 100, f: 1000}));
  return [0, 0.25, 0.5, 0.75, 1].map((g) => predGeom(B, {...PRED_REST, gill: g}).exit.p as V3);
})();
export const exitAtGill = (g: number): Exit => {
  const x = clamp(g, 0, 1) * 4, i = Math.min(3, Math.floor(x)), f = x - i;
  return {p: add3(EXIT_G[i], mul3(sub3(EXIT_G[i + 1], EXIT_G[i]), f)), out: EXIT0.out};
};
/** how far the eel props the gill cover open while it passes through the opening (it lifts the cover to fit the body
 *  there): every exterior shot uses this for the predator's cover from the poke to the release, so the eel's root and
 *  the cover's edge stay together */
export const escGill = (t: number): number => {
  // after the release the cover settles from where the head left it (no snap shut)
  if (t >= T_REL) return escGill(T_REL - 1e-4) * (1 - ss(t, T_REL, T_REL + 0.55));
  const out = outAt(t);
  if (out <= -0.5) return 0;
  const u = clamp(1 - out / EEL_L, 0, 1);
  // the broad head, caught behind the edge, props the cover wide open (the eye shows just inside)
  return 0.28 + 0.3 * (RADII[Math.round(u * N)] / EEL_R_MAX) * clamp((out + 0.5) / 1.5) + 0.24 * ss(out, 45, 49);
};
/** the exit used by the escape at time t (until the release) */
export const exitAt = (t: number): Exit => exitAtGill(escGill(Math.min(t, T_REL - 1e-6)));
/** the inward route from the exit (a ≤ 0), under the cover, through the gill chamber toward the arches, then hidden */
const INWARD: V3[] = [
  [0, 0, 0], // relative to the exit: straight DOWN the slit just behind the cover's lifted edge (the caught head lies
  [0.4, 1.15, -0.38], // here, side-on, seen through the propped-open gap with its eye toward us) ...
  [0.8, 2.3, -0.76],
  [1.1, 3.45, -1.14],
  [1.2, 4.6, -1.6],
  [0.4, 5.8, -2.3], // ... then forward across the opercular chamber to the slit between the arches
  [-1.6, 6.6, -2.9],
  [-4.4, 6.9, -3.5],
  [-7.5, 7.0, -4.3],
  [-11.0, 7.2, -5.0],
  [-16.0, 7.4, -5.9],
  [-24.0, 7.6, -6.2],
  [-40.0, 7.8, -6.3],
];
const inwardTable = (() => {
  const s = [0];
  for (let i = 1; i < INWARD.length; i++) s.push(s[i - 1] + len3(sub3(INWARD[i], INWARD[i - 1])));
  return s;
})();
const inwardAt = (ex: Exit, d: number): V3 => {
  // d ≥ 0: distance inside the exit
  const s = inwardTable;
  let i = 0;
  while (i < s.length - 2 && d > s[i + 1]) i++;
  const f = clamp((d - s[i]) / (s[i + 1] - s[i] || 1), 0, 2);
  const q = add3(INWARD[i], mul3(sub3(INWARD[i + 1], INWARD[i]), f));
  // the route is authored for the default exit direction; keep it attached to the given exit point
  return add3(ex.p, q);
};

// ---------------------------------------------------------------- how much is outside
/** the poke: the tip crosses the edge at T.poke at 4 u/s (240 px/s at 60 px/u, the hand-off contract) */
const OUT_KEYS: [number, number][] = [
  [12.0, -3.3],
  [12.3, -1.12],
  [12.86, 1.12],
  [13.1, 2.5],
  [13.4, 4.6],
  [13.86, 8.2],
  [14.35, 13.5],
  [14.95, 24.5],
  [15.5, 37.0],
  [15.96, 44.6],
  [16.45, 48.4],
  [17.0, 49.4], // the head is caught: the neck in the gap, the eye about 3 u inside
  [18.4, 49.4],
  [20.2, 49.9], // the loop tightens; the head strains at the edge
  [20.45, 50.05],
];
export const T_REL = 20.86; // the snout clears the opening (on "pull", 20.82–21.10)
/** the length outside the exit (eel units), monotone non-decreasing: the tail leads; = EEL_L at T_REL */
export const outAt = (t: number): number => {
  if (t >= T_REL) return EEL_L;
  if (t > 20.45) {
    // the final pull: the head works out of the gap over ~0.4 s (the eye clears at ≈ 20.74), accelerating, the snout
    // clearing at T_REL
    const x = (t - 20.45) / (T_REL - 20.45);
    return lerp(50.05, EEL_L, x * x * (0.25 + 0.75 * x) * 0.55 + x * 0.45);
  }
  // linear through the poke (constant speed), C1-smooth elsewhere
  if (t >= 12.3 && t <= 12.86) return -1.12 + 4 * (t - 12.3);
  return keyS(t, OUT_KEYS);
};

// ---------------------------------------------------------------- the outside shape
/** phase weights (smooth): bow into the current (S7, S8) → the loose curl (S9, S10) → tightening (the pull) */
const wCurl = (t: number) => ss(t, 16.5, 18.7);
const wTight = (t: number) => 0.45 * ss(t, 18.4, 20.2) + 0.55 * ss(t, 20.2, 20.78);

/** the curl's loop (S9–S10): it starts LOOP_A0 units out and runs clockwise as seen from the near side (back → down →
 *  forward along the bottom → up → back over the top), a loose loop beside the gill, in front of the flank */
export const LOOP = {a0: 8, a1: 50, turn: -305};
/** θ(a, t): in-plane angle (rad) from +x toward up; β(a, t): slope out of the plane, toward +z */
const theta = (a: number, t: number, out: number) => {
  const th0 = 17 * D; // out from under the cover: back and a little up
  // (1) bowing back into the current: settles to streaming slightly downward along the flank
  const bow = th0 + (-20 * D) * sm(a / 11) + 6 * D * Math.sin(Math.PI * clamp(a / Math.max(8, out))) * sm(out / 10);
  // (2) the curl: a loose loop (radius ≈ 6 u) beside the gill; tightening on the pull (shorter, so smaller, and the
  //     lead-out longer: the loop pulls away from the fish)
  const k = wTight(t);
  const a0 = LOOP.a0 + 3 * k, a1 = lerp(LOOP.a1, 42, k);
  const curl = th0 - 10 * D * sm(a / 5) + lerp(LOOP.turn, -322, k) * D * sm(clamp((a - a0) / (a1 - a0)));
  // (3) a travelling wave running tail → head (the eel is swimming BACKWARD out of the fish)
  const A = (lerp(9, 7.5, wCurl(t)) + 4 * k) * D * sm(a / 7);
  const wave = A * Math.sin(2 * Math.PI * (1.25 * t + a / 15)) + 4 * D * wCurl(t) * Math.sin(2 * Math.PI * (0.45 * t + a / 40));
  return lerp(bow, curl, wCurl(t)) + wave;
};
const beta = (a: number, t: number, out: number) => {
  // out from under the cover, flattening into a plane beside the flank; the curl's plane sits farther out
  const lead = lerp(25, 50, wCurl(t)) * D * Math.exp(-a / lerp(3.5, 9 + 2 * wTight(t), wCurl(t)));
  // the bow into the current: the middle of the outside body swings out (+z) and the tail comes back in; once most
  // of the body is out (S9) it lies back along the flank instead (not toward the viewer)
  const bowZ = 55 * D * Math.cos(Math.PI * clamp(a / Math.max(10, out))) * sm(out / 14) * (1 - wCurl(t)) * (1 - 0.8 * ss(t, 15.2, 16.2));
  return lead + bowZ;
};
export const dirOf = (th: number, be: number): V3 => [Math.cos(be) * Math.cos(th), -Math.cos(be) * Math.sin(th), Math.sin(be)];

/** the rooted body: samples snout → tail tip, and where the body crosses the exit (fractional sample index) */
/** a body rooted at the exit with `out` units outside, shaped by the direction field (θ(a), β(a)) */
export const rootedWith = (ex: Exit, out: number, th: (a: number) => number, be: (a: number) => number, inward?: (d: number) => V3) => {
  const da = 0.1;
  const n = Math.max(1, Math.ceil(Math.max(0, out) / da));
  const cs: V3[] = [ex.p];
  let p = ex.p;
  const lead0 = inward ? null : norm3(mul3(INWARD[1], -1));
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) * da;
    let d = dirOf(th(a), be(a));
    if (lead0) d = norm3(add3(mul3(lead0, 1 - ss(a, 0, 2.5)), mul3(d, ss(a, 0, 2.5))));
    p = add3(p, mul3(d, da));
    cs.push(p);
  }
  const outsideAt = (a: number): V3 => {
    const f = a / da;
    const i = Math.max(0, Math.min(n - 1, Math.floor(f)));
    const g = f - i;
    return add3(cs[i], mul3(sub3(cs[i + 1], cs[i]), g));
  };
  const c: V3[] = US.map((u) => {
    const a = out - EEL_L * (1 - u);
    return a >= 0 ? outsideAt(Math.min(a, out)) : inward ? inward(-a) : inwardAt(ex, -a);
  });
  // the exit crossing, as a fractional sample index (body points with index > crossI are outside)
  const crossI = N * (1 - out / EEL_L);
  return {c, out, crossI};
};
export const rootedPose = (t: number, ex: Exit = EXIT0, outOverride?: number) => {
  const out = outOverride ?? outAt(t);
  return rootedWith(ex, out, (a) => theta(a, t, out), (a) => beta(a, t, out));
};

// ---------------------------------------------------------------- free mode
/** after straightening along its natural heading (the mid-body's forward direction at the release: back along the
 *  flank), the swimmer veers up and away from the predator, toward the near side, head first */
export const SWIM_DIR: V3 = norm3([-0.72, -0.3, 0.62]);
const rotAbout = (v: V3, k: V3, ang: number): V3 => {
  // Rodrigues
  const c = Math.cos(ang), s = Math.sin(ang);
  const kv = cross3(k, v), kd = dot3(k, v);
  return add3(add3(mul3(v, c), mul3(kv, s)), mul3(k, kd * (1 - c)));
};
const slerpDir = (a: V3, b: V3, w: number): V3 => {
  const d = clamp(dot3(a, b), -1, 1);
  const ang = Math.acos(d);
  if (ang < 1e-5) return a;
  let ax = cross3(a, b);
  if (len3(ax) < 1e-6) ax = Math.abs(a[1]) < 0.9 ? cross3(a, [0, 1, 0]) : cross3(a, [1, 0, 0]);
  return norm3(rotAbout(a, norm3(ax), ang * w));
};
const REL = (() => {
  const r = rootedPose(T_REL, exitAt(T_REL), EEL_L);
  const tg = r.c.map((_, i) => norm3(sub3(r.c[Math.min(N, i + 1)], r.c[Math.max(0, i - 1)])));
  return {c: r.c, tg};
})();
const MID = N / 2;
/** the natural heading at the release: the mid-body's forward direction, levelled a little */
export const H0: V3 = norm3([-0.8, -0.5, 0.3]); // the head leaves the slit up, out and back, clear of the fish
const T_TURN0 = T_REL + 0.12, T_TURN1 = T_REL + 0.85;
/** the heading the HEAD has at time t (held at H0, then turning toward SWIM_DIR) */
/** then it veers upstream (a curving escape, so its body never points back at the predator) */
export const SWIM_DIR2: V3 = norm3([-0.6, -0.08, 0.8]);
/** the headings (tunable for tools/v4/swim_gap.ts) */
export const SWIM_HEAD = {h0: H0, d1: SWIM_DIR, d2: SWIM_DIR2, k2: [0.1, 1.7] as [number, number]};
export const headingAt = (t: number): V3 => slerpDir(slerpDir(SWIM_HEAD.h0, SWIM_HEAD.d1, ss(t, T_TURN0, T_TURN1)), SWIM_HEAD.d2, ss(t, T_TURN1 + SWIM_HEAD.k2[0], T_TURN1 + SWIM_HEAD.k2[1]));
/** swimming speed (u/s) */
const speedAt = (t: number) => 38 * ss(t, T_REL + 0.05, T_REL + 0.7) + 8 * ss(t, T_REL + 1.0, T_REL + 2.2);
/** distance swum since the release (numerical, cheap) */
const swum = (t: number) => {
  let s = 0;
  const h = 1 / 120;
  for (let x = T_REL; x < t; x += h) s += speedAt(x + h / 2) * Math.min(h, t - x);
  return s;
};
/** the time the head was where body point u is now (the body follows the head's path): t − a/v, with a the
 *  distance back from the snout, using the distance swum */
const pastTime = (t: number, a: number) => {
  const target = swum(t) - a;
  if (target <= 0) return T_REL;
  // invert swum by bisection
  let lo = T_REL, hi = t;
  for (let k = 0; k < 24; k++) {
    const m = (lo + hi) / 2;
    if (swum(m) < target) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
};
/** anchor (mid-body): the pull's momentum (toward the tail end along the release tangent, decaying), plus the
 *  distance swum along the heading the mid-body has (the head's heading, delayed) */
const PULL_V = 14;
const anchorAt = (t: number): V3 => {
  const dt = Math.max(0, t - T_REL);
  const tau = 0.12;
  const pull = mul3(REL.tg[MID], PULL_V * tau * (1 - Math.exp(-dt / tau)));
  let sw: V3 = [0, 0, 0];
  const h = 1 / 60;
  for (let s = 0; s < dt; s += h) {
    const step = Math.min(h, dt - s);
    const tm = T_REL + s + step / 2;
    sw = add3(sw, mul3(headingAt(pastTime(tm, EEL_L / 2)), speedAt(tm) * step));
  }
  // the push off the predator: the whole eel moves out from the flank (and up) while it straightens, so its body
  // (lying along the fish, not pointing at it) leaves the flank whole: no tail left resting on the fish
  const drift = mul3(DRIFT_DIR, DRIFT_U * (1 - Math.exp(-dt / 0.42)));
  return add3(add3(add3(REL.c[MID], pull), sw), drift);
};
const DRIFT_DIR: V3 = norm3([0.05, -0.3, 1]);
const DRIFT_U = 13;
/** the release tangents as in-plane angle θ (unwrapped along the body) and out-of-plane slope β */
const REL_ANG = (() => {
  const th: number[] = [], be: number[] = [];
  REL.tg.forEach((v, i) => {
    let a = Math.atan2(-v[1], v[0]);
    if (i > 0) {
      while (a - th[i - 1] > Math.PI) a -= 2 * Math.PI;
      while (a - th[i - 1] < -Math.PI) a += 2 * Math.PI;
    }
    th.push(a);
    be.push(Math.asin(clamp(v[2], -1, 1)));
  });
  return {th, be};
})();
/** a direction as (θ, β), with θ on the branch nearest `near` */
const angOf = (v: V3, near: number) => {
  let a = Math.atan2(-v[1], v[0]);
  while (a - near > Math.PI) a -= 2 * Math.PI;
  while (a - near < -Math.PI) a += 2 * Math.PI;
  return {th: a, be: Math.asin(clamp(v[2], -1, 1))};
};
export const freePose = (t: number): V3[] => {
  // straightening out of the curl: the loop UNROLLS in its own plane (every tangent's in-plane angle moves to the
  // heading's), so the head swings round beside the flank, never through the predator
  const w = ss(t, T_REL, T_REL + 0.8);
  const sw = swum(t);
  const thMid = REL_ANG.th[MID];
  const tg: V3[] = REL.tg.map((_, i) => {
    const u = US[i];
    const a = u * EEL_L;
    // the heading the head had when it was where this point is now (path following); the body points from head
    // to tail, so the tangent is the reverse of the heading
    const H = headingAt(sw >= a ? pastTime(t, a) : T_REL);
    const tgt = angOf(mul3(H, -1), thMid);
    const th = lerp(REL_ANG.th[i], tgt.th, w), be = lerp(REL_ANG.be[i], tgt.be, w);
    const base = dirOf(th, be);
    const back = norm3(sub3([0, -1, 0], mul3(base, dot3([0, -1, 0], base))));
    // the swimming wave: lateral (about the back axis), travelling head → tail, growing toward the tail
    const A = (14 + 20 * u) * D * ss(t, T_REL, T_REL + 0.3);
    const wave = A * Math.sin(2 * Math.PI * (2.1 * t - a / 30));
    return rotAbout(base, back, wave);
  });
  // integrate positions from the anchor both ways (sample spacing L/N)
  const ds = EEL_L / N;
  const c: V3[] = new Array(N + 1);
  c[MID] = anchorAt(t);
  for (let i = MID + 1; i <= N; i++) c[i] = add3(c[i - 1], mul3(norm3(add3(tg[i - 1], tg[i])), ds));
  for (let i = MID - 1; i >= 0; i--) c[i] = sub3(c[i + 1], mul3(norm3(add3(tg[i + 1], tg[i])), ds));
  return c;
};

/** the eel's back: up (−y) where the body runs level; where it runs nearly vertical (down the gill opening) the back
 *  turns toward the fish's tail (+x), so the eyes face the sides (one toward the viewer) */
export const backFrom = (c: V3[]): V3[] =>
  c.map((_, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const T = norm3(sub3(b, a));
    const w = ss(Math.abs(T[1]), 0.55, 0.85);
    const pref = norm3([w, -(1 - w), 0]);
    const k = dot3(pref, T);
    return norm3([pref[0] - k * T[0], pref[1] - k * T[1], pref[2] - k * T[2]]);
  });

// ---------------------------------------------------------------- the pose for any exterior time
export type EscapePose = Eel3Pose & {out: number; crossI: number; free: boolean};
export const escapeAt = (t: number, ex?: Exit): EscapePose => {
  if (t >= T_REL) {
    const c = freePose(t);
    return {c, back: backFrom(c), out: EEL_L, crossI: -1, free: true};
  }
  const r = rootedPose(t, ex ?? exitAt(t));
  return {c: r.c, back: backFrom(r.c), out: r.out, crossI: r.crossI, free: false};
};
