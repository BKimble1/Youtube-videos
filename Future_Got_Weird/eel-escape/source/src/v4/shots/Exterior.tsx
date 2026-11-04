// V4 exterior shots (the integrator's): S1 OPEN, S2 GULP, S7 POKE, S8 FOLLOWS, S9 HEAD, S10 RELEASE, S11 SWIM, S12 LOOP.
// Every one draws the SAME predator (v4/pred.tsx), the SAME eel (v4/escape.ts + v4/eelV4.tsx) and the SAME water
// (v4/world.tsx) through its own 3D camera. Times are global (v4/timing.ts).
import React from 'react';
import {clamp, keyS, lerp, ss, ss5} from '../../lib';
import {uid} from '../../core/ids';
import {add3, basis, Basis, Cam3, dot3, lerpOrbit, mul3, norm3, Orbit, orbitCam, orbitDir, proj, sub3, V3} from '../three';
import {backFrom, Eel3D, Eel3Pose, eelScreen, EEL_L, EEL_R_MAX, N, path2, RADII, US} from '../eelV4';
import {dirOf, escapeAt, EscapePose, escGill, Exit, EXIT0, exitAtGill, headingAt, rootedWith, T_REL} from '../escape';
import {PredPose, PRED_REST, Predator, predGeom} from '../pred';
import {clearSight, PredShadow, ReedWipe, reedWipePoly, WorldBack, WorldFront} from '../world';
import {depth} from '../three';
import {KeepOut, T} from '../timing';

const D = Math.PI / 180;
const bump = (t: number, a: number, peak: number, b: number) => (t <= a || t >= b ? 0 : t < peak ? ss(t, a, peak) : 1 - ss(t, peak, b));

// ---------------------------------------------------------------- shared frame
type ExtState = {
  cam: Cam3;
  pose: PredPose;
  eel: (EscapePose | (Eel3Pose & {crossI: number})) | null;
  t: number;
  mouthClip?: boolean;
  /** reed clumps near the sight lines to these points fade out (radius `clearR`) */
  clear?: V3[];
  clearR?: number;
  /** fade reed clumps whose base is within this distance of the lens (no flat blades across the frame) */
  nearCut?: number;
  /** the reeds/rocks split depth: 'eel' = the eel's nearest third (S11), default the predator's centre */
  split?: 'eel' | 'pred';
  /** the part inside the gill drawn a little dimmed (it is in the chamber's shade) */
  insideOpacity?: number;
  /** draw only this many eel units of the inside part (behind the opening), e.g. into the mouth */
  insideSpan?: number;
};
/** the exit at the cover's resting edge (pred3d: along the skin, back and up) */
export const EXIT_REST: Exit = {p: EXIT0.p, out: norm3([0.88, -0.47, 0.05])};
/** S1: the tail comes straight out of the dark opening toward the rear camera (the root end-on in the gap), then
 *  bends into its S; the part inside runs straight back into the opening */
export const EXIT_OPEN: Exit = {p: exitAtGill(0.45).p, out: norm3([0.42, -0.4, 0.81])};
const exitFor = (B: Basis, pose: PredPose): Exit => {
  const g = predGeom(B, pose);
  return {p: g.exit.p, out: g.exit.out};
};
export const ExtFrame: React.FC<{s: ExtState}> = ({s}) => {
  const B = basis(s.cam);
  const g = predGeom(B, s.pose);
  const e = s.eel;
  const cross = e ? e.crossI : -1;
  const zSplit = s.split === 'eel' && e ? depth(B, e.c[Math.round(N * 0.4)]) : undefined;
  const sight = s.clear ? clearSight(B, s.clear, s.clearR ?? 10) : undefined;
  const nc = s.nearCut;
  const filter = sight || nc
    ? (c: {x: number; z: number; r: number; h: number; n: number; seed: number}, i: number) => {
        const a = sight ? Number(sight(c as any, i)) : 1;
        const b = nc ? ss(Math.hypot(c.x - B.eye[0], c.z - B.eye[2]) - c.r, nc * 0.6, nc) : 1;
        return Math.min(a, b);
      }
    : undefined;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <WorldBack B={B} t={s.t} zSplit={zSplit} filter={filter} />
      <PredShadow B={B} pose={s.pose} />
      <Predator B={B} pose={s.pose} />
      {e && cross > 0 && (s.mouthClip ? g.mouthHole : g.gap) && <Eel3D B={B} pose={e} t={s.t} from={s.insideSpan ? Math.max(0, cross - (s.insideSpan * N) / EEL_L) : 0} to={Math.min(N, cross)} clip={s.mouthClip ? g.mouthHole : g.gap} opacity={s.insideOpacity} />}
      {e && cross < N && <Eel3D B={B} pose={e} t={s.t} from={Math.max(0, cross)} />}
      <WorldFront B={B} t={s.t} zSplit={zSplit} filter={filter} />
    </svg>
  );
};
export const extKeepOut = (s: ExtState): KeepOut => {
  const B = basis(s.cam);
  const g = predGeom(B, s.pose);
  const out: KeepOut = {eel: []};
  if (s.eel) {
    const sc = eelScreen(B, s.eel);
    const i0 = Math.max(0, Math.ceil(s.eel.crossI));
    for (let i = i0; i <= N; i++) out.eel.push({x: sc.pts[i].x, y: sc.pts[i].y, r: sc.rad[i]});
  }
  const pts = (g.gap.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  if (pts.length >= 6) {
    out.gap = [];
    for (let i = 0; i + 1 < pts.length; i += 2) out.gap.push({x: pts[i], y: pts[i + 1]});
  }
  return out;
};

// ---------------------------------------------------------------- the predator's life (shared rhythm)
/** breathing: a slow cover rhythm (~0.9 Hz), plus the scripted breaths */
const breath = (t: number) => 0.14 + 0.1 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.85 * t - 1.2));
const predPose = (t: number, extra: Partial<PredPose> = {}): PredPose => ({...PRED_REST, t, finPhase: t, gill: breath(t), ...extra});

/** while the eel passes through the gill opening it props the cover open: the gap opens to fit the body there */
const propGill = (e: {crossI: number} | null) => {
  if (!e || e.crossI <= 0 || e.crossI >= N) return 0;
  const r = RADII[Math.round(e.crossI)] / EEL_R_MAX;
  return 0.3 + 0.35 * r;
};

// ---------------------------------------------------------------- S1 OPEN (0 – 2.62), also the loop's target frame
/** the gill cover: one breath on the first beat (peak T.breathPeak), the peek breath on "belongs to the eel" */
export const openGill = (t: number) => Math.max(breath(t), 0.45, 0.15 + 0.7 * bump(t, -0.02, T.breathPeak, 0.46), 0.15 + 0.85 * bump(t, 1.95, T.peek, 2.9));
/** the tail already out: 22 units (40 % of the eel), a loose S lying OUTSIDE across the gill cover, in the plane
 *  facing the opening camera (so the S reads on screen); it flicks once across the cover (independently of the
 *  breath) and keeps a slow life of its own. Built in the opening camera's screen axes: R right, U up, F toward the
 *  lens. Screen-right from this camera runs into the flank, so the tail leaves the gap up and right, turns down and
 *  lies to the left, over the cover. */
export const OPEN_OUT = 22;
const O_A: Orbit = {target: [-24.5, -3.5, 7.5], az: 55, el: 12, d: 31, f: 1300, cy: 1000};
const O_B: Orbit = {target: [-23.8, -6.0, 7.2], az: 46, el: 10, d: 21, f: 1300, cy: 1040};
const OPEN_AX = (() => {
  const B = basis(orbitCam(O_A));
  return {R: B.r, U: B.u, F: mul3(B.fw, -1)};
})();
export const openEel = (t: number, ex: Exit): EscapePose => {
  const flick = bump(t, 0.06, T.flick + 0.05, 0.6);
  const peek = bump(t, 1.9, T.peek, 2.8);
  const {R, U, F} = OPEN_AX;
  // screen heading φ(a) (deg, y down: 0 = right, 90 = down)
  const phi = (a: number) =>
    -38 + 128 * ss(a, 0.4, 7) + 50 * ss(a, 7, 13) - 85 * ss(a, 14, 21) +
    9 * Math.sin(2 * Math.PI * (0.65 * t + a / 10)) * clamp(a / 8) +
    62 * flick * ss(a, 3, 13) - 30 * flick * ss(a, 13, 22) -
    14 * peek * ss(a, 4, 14);
  const da = 0.1;
  const n = Math.ceil(OPEN_OUT / da);
  const cs: V3[] = [ex.p];
  let p = ex.p;
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) * da;
    const f = (phi(a) * Math.PI) / 180;
    // out of the gap along the skin first, then in the screen plane, drifting toward the lens (clear of the cover)
    const w = ss(a, 0, 2.2);
    const scr = norm3(add3(add3(mul3(R, Math.cos(f)), mul3(U, -Math.sin(f))), mul3(F, 0.28)));
    const d = norm3(add3(mul3(ex.out, 1 - w), mul3(scr, w)));
    p = add3(p, mul3(d, da));
    cs.push(p);
  }
  const r = rootedWith(ex, OPEN_OUT, () => 0, () => 0, (d) => add3(ex.p, add3(mul3(ex.out, -Math.min(d, 3)), mul3(norm3([-0.9, 0.45, -0.3]), Math.max(0, d - 3)))));
  // replace the outside part with this curve
  const c = r.c.map((q, i) => {
    const a = OPEN_OUT - EEL_L * (1 - US[i]);
    if (a < 0) return q;
    const fI = Math.min(n - 1e-6, a / da);
    const i0 = Math.floor(fI), g = fI - i0;
    return add3(cs[i0], mul3(sub3(cs[i0 + 1], cs[i0]), g));
  });
  return {c, back: backFrom(c), out: OPEN_OUT, crossI: r.crossI, free: false};
};
export const openCam = (t: number): Cam3 => {
  const drift = {...O_A, az: O_A.az - 2 * clamp(t / 1.6)};
  return orbitCam(lerpOrbit(drift, O_B, ss5(t, T.follow0, 2.45)));
};
export const openState = (t: number): ExtState => {
  const cam = openCam(t);
  const pose = predPose(t, {gill: openGill(t)});
  // the root stays where the cover's edge rests; when the cover lifts, the body shows continuing under it
  return {cam, pose, eel: openEel(t, EXIT_OPEN), t, insideOpacity: 0.82};
};

// ---------------------------------------------------------------- S2 GULP (2.62 – 3.84): the earlier gulp, side view
/** the eel's path into the open mouth: from deep in the throat out through the gape, then the tail outside in the
 *  S matched to S1's last frame (rebuilt in this camera at the cut) */
/** The cut S1 → S2 matches the eel's CURVE: S1's last frame looks into the gill gap with the body entering it; S2's
 *  first frame puts the open mouth exactly where that gap was, at the same scale, and lays the tail outside the mouth
 *  on the very same screen curve (unprojected onto the plane of the gape). Then the camera pulls back to the side
 *  view while the tail is sucked in along that curve. Computed once (deterministic). */
type GulpMatch = {cam0: Orbit; cam1: Orbit; path: {p: V3[]; s: number[]; len: number; gape: number}};
let GM: GulpMatch | null = null;
const gulpMatch = (): GulpMatch => {
  if (GM) return GM;
  const s1 = openState(T.gulp - 1 / 30);
  const B1 = basis(s1.cam);
  const e1 = s1.eel!;
  const sc = eelScreen(B1, e1);
  const i0 = Math.min(N, Math.max(0, Math.ceil(e1.crossI)));
  const E1 = sc.pts[i0];
  const k1 = proj(B1, e1.c[i0]).s; // px per unit at the gap in S1
  // the side view's gape: the predator's mouth fully open
  const B0 = basis(orbitCam({target: [0, 0, 0], az: 0, el: 0, d: 100, f: 1000}));
  const mg = predGeom(B0, {...PRED_REST, mouth: 1});
  const gape = mg.mouthIn.p, inDir = norm3(mg.mouthIn.dir);
  const f = 1300;
  const cam0: Orbit = {target: gape, az: -6, el: 4, d: f / k1, f, cx: E1.x, cy: E1.y};
  const cam1: Orbit = {target: [-36, 0, 0], az: -3, el: 3, d: 60, f, cx: 540, cy: 1100};
  const C0 = orbitCam(cam0);
  const B2 = basis(C0);
  const dep = dot3(sub3(gape, B2.eye), B2.fw);
  const unp = (x: number, y: number): V3 => {
    const sx = ((x - B2.cx) * dep) / B2.f, sy = (-(y - B2.cy) * dep) / B2.f;
    return add3(add3(B2.eye, mul3(B2.fw, dep)), add3(mul3(B2.r, sx), mul3(B2.u, sy)));
  };
  // outside: S1's screen curve from 3 units past the gap outward (its root bends toward S1's lens; not needed here),
  // joined to the gape by a smooth bend: the body comes out of the mouth forward and turns into the matched S
  const skip = Math.round((3 * N) / EEL_L);
  const kept: V3[] = [];
  for (let i = Math.min(N - 4, i0 + skip); i <= N; i++) kept.push(unp(sc.pts[i].x, sc.pts[i].y));
  const ctrl = add3(gape, mul3(inDir, -2.6));
  const conn: V3[] = [];
  for (let k = 0; k < 8; k++) {
    const u = k / 8;
    conn.push(add3(add3(mul3(gape, (1 - u) * (1 - u)), mul3(ctrl, 2 * u * (1 - u))), mul3(kept[0], u * u)));
  }
  const outside: V3[] = [...conn, ...kept];
  // inside: from the gape straight on into the throat (hidden but in the mouth hole)
  const inside: V3[] = [];
  for (let k = 40; k >= 1; k--) inside.push(add3(gape, mul3(inDir, k * 1.2)));
  const pts = [...inside, ...outside];
  // the arc table counts the EEL's own length (sample spacing L/N outside), so the body sliding along the path keeps
  // S1's on-screen curve however foreshortened it was there
  const ss_ = [0];
  for (let i = 1; i < inside.length; i++) ss_.push(ss_[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
  ss_.push(ss_[inside.length - 1] + 1.2);
  for (let i = 1; i < conn.length + 1; i++) {
    const a = pts[inside.length + i - 1], b = pts[inside.length + i];
    ss_.push(ss_[ss_.length - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  for (let i = 1; i < kept.length; i++) ss_.push(ss_[ss_.length - 1] + EEL_L / N);
  GM = {cam0, cam1, path: {p: pts, s: ss_, len: ss_[ss_.length - 1], gape: ss_[inside.length]}};
  return GM;
};
export const gulpCam = (t: number): Cam3 => {
  const m = gulpMatch();
  return orbitCam(lerpOrbit(m.cam0, m.cam1, ss5(t, T.gulp + 0.1, T.gulp + 0.8)));
};
export const gulpMouth = (t: number) => 1 - ss(t, T.mouthShut - 0.16, T.mouthShut + 0.02);
const gulpAt = (sArc: number): V3 => {
  const q = gulpMatch().path;
  if (sArc <= 0) return q.p[0];
  if (sArc >= q.len) {
    const a = q.p[q.p.length - 1], b = q.p[q.p.length - 2];
    return add3(a, mul3(norm3(sub3(a, b)), sArc - q.len));
  }
  let lo = 0, hi = q.p.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (q.s[m] <= sArc) lo = m; else hi = m;
  }
  const f = (sArc - q.s[lo]) / (q.s[hi] - q.s[lo] || 1);
  return add3(q.p[lo], mul3(sub3(q.p[hi], q.p[lo]), f));
};
/** the tail tip's arc position: OPEN_OUT units outside the gape at the cut (as in S1), then sucked in (accelerating),
 *  gone at 3.12 */
export const gulpTip = (t: number) => {
  const q = gulpMatch().path;
  const sOut = q.gape + (q.len - q.gape);
  const sIn = q.gape - 1.5;
  const x = clamp((t - T.gulp) / (3.12 - T.gulp));
  return lerp(sOut, sIn, x * x * (0.35 + 0.65 * x));
};
export const gulpEel = (t: number): Eel3Pose & {crossI: number} => {
  const tip = gulpTip(t);
  // a flail of the free tail, growing in after the cut (so the cut frame is exactly S1's curve)
  const k = ss(t, T.gulp + 0.04, T.gulp + 0.3);
  const flail = (u: number) => k * 0.5 * Math.sin(2 * Math.PI * (2.6 * t - u * 5)) * clamp((u - 0.6) / 0.4);
  const c = US.map((u) => {
    const p = gulpAt(tip - EEL_L * (1 - u));
    return add3(p, [0, -flail(u), 0]);
  });
  // the part beyond the gape (outside the mouth) is drawn over the predator; the rest only inside the mouth hole
  const outLen = tip - gulpMatch().path.gape;
  const crossI = N * (1 - Math.max(0, outLen) / EEL_L);
  return {c, back: backFrom(c), crossI};
};
export const gulpState = (t: number): ExtState => {
  const cam = gulpCam(t);
  const pose = predPose(t, {mouth: gulpMouth(t), gill: Math.max(breath(t), 0.15 + 0.6 * bump(t, 3.15, 3.32, 3.75)), startle: 0.4 * bump(t, 2.9, 3.2, 3.8)});
  return {cam, pose, eel: gulpEel(t), t, mouthClip: true, insideOpacity: 0.6, insideSpan: 3.5};
};

// ---------------------------------------------------------------- S7 POKE (12.58 – 13.86)
// the camera is solved (tools/solve_poke) so the exit, the tip's travel and the cover's edge land on the contract
export const POKE_ORBIT: Orbit = {target: [-23.55, -6.35, 6.4], az: 20, el: -22, d: 18.3, f: 1300, cx: 540, cy: 1010, roll: 12};
const POKE_ORBIT1: Orbit = {target: [-27, -8.0, 7], az: 22, el: -14, d: 36, f: 1300, cx: 540, cy: 1080, roll: 4};
export const pokeCam = (t: number): Cam3 => orbitCam(lerpOrbit(POKE_ORBIT, POKE_ORBIT1, ss5(t, 12.64, 13.6)));
export const pokeState = (t: number): ExtState => {
  const eel = escapeAt(t);
  return {cam: pokeCam(t), pose: predPose(t, {gill: Math.max(breath(t), escGill(t))}), eel, t, insideOpacity: 0.85};
};
export const pokeStateWith = (o: Orbit, t: number): ExtState => ({cam: orbitCam(o), pose: predPose(t), eel: escapeAt(t), t});

// ---------------------------------------------------------------- S8 FOLLOWS (13.86 – 15.96): over the predator's back
const F_A: Orbit = {target: [-17, -9, 11], az: 24, el: 40, d: 40, f: 1250, cy: 1080};
const F_B: Orbit = {target: [-8, -9, 14], az: 30, el: 42, d: 56, f: 1250, cy: 1080};
export const followsCam = (t: number): Cam3 => orbitCam(lerpOrbit(F_A, F_B, ss5(t, T.follows, T.head)));
export const followsState = (t: number): ExtState => {
  const eel = escapeAt(t);
  return {cam: followsCam(t), pose: predPose(t, {gill: Math.max(breath(t), escGill(t))}), eel, t, insideOpacity: 0.85, clear: [[-5, -4, 0], eel.c[Math.round(N * 0.6)]], clearR: 14};
};

// ---------------------------------------------------------------- S9 HEAD (15.96 – 17.96): tight at the gill edge
const H_A: Orbit = {target: [-23.0, -5.0, 8.0], az: 38, el: 16, d: 40, f: 1300, cy: 1120};
const H_B: Orbit = {target: [-24.2, -5.8, 7.0], az: 40, el: 14, d: 27, f: 1300, cy: 1120};
export const headCam = (t: number): Cam3 => orbitCam(lerpOrbit(H_A, H_B, ss5(t, T.head, T.head + 1.4)));
/** the cover held open wider while the head is caught: the eye shows in the gap */
const caughtGill = (t: number) => Math.max(breath(t), 0.25 + 0.55 * ss(t, 15.9, 16.4));
export const headState = (t: number): ExtState => {
  const eel = escapeAt(t);
  return {cam: headCam(t), pose: predPose(t, {gill: Math.max(breath(t), escGill(t))}), eel, t, insideOpacity: 0.85, clear: [EXIT0.p, eel.c[Math.round(N * 0.5)]], clearR: 12};
};

// ---------------------------------------------------------------- S10 RELEASE (17.96 – 21.30): low beside the fish
const R_A: Orbit = {target: [-17, -3, 13], az: 20, el: -8, d: 36, f: 1250, cy: 1040};
const R_B: Orbit = {target: [-9, -5, 15], az: 22, el: -6, d: 50, f: 1250, cy: 1040};
export const releaseCam = (t: number): Cam3 => orbitCam(lerpOrbit(R_A, R_B, ss5(t, T.tighten, T.swim)));
export const releaseState = (t: number): ExtState => ({
  cam: releaseCam(t),
  pose: predPose(t, {gill: Math.max(breath(t) + 0.08 * Math.sin(2 * Math.PI * 1.3 * t) * (t < T_REL ? 1 : 0), escGill(t), 0.7 * bump(t, T_REL, T_REL + 0.18, T_REL + 0.9)), startle: bump(t, T_REL - 0.1, T_REL + 0.25, T_REL + 1.6), bend: 0.12 * bump(t, T_REL, T_REL + 0.4, T_REL + 1.5)}),
  eel: escapeAt(t),
  t,
  insideOpacity: 0.85,
  clear: [[-12, -3, 12], [-25, -6, 6]],
  clearR: 14,
});

// ---------------------------------------------------------------- S11 SWIM (21.30 – 24.30): tracking alongside, ahead
/** the tracking camera: beside and a little ahead of the swimmer (on its near side, away from the predator), looking
 *  back across it so the predator lies behind it in frame; it rides with the eel's mid-body (smoothed heading) */
/** the tracking camera: beside the swimmer on its downstream (+x) side and a little ahead, looking back across it so
 *  the predator lies behind it, up and to the side in frame; it rides with the eel's head (lead room) and recedes from
 *  the predator with it */
export const swimCam = (t: number): Cam3 => {
  const e = escapeAt(t);
  const head = e.c[Math.round(N * 0.12)], mid = e.c[Math.round(N * 0.45)];
  const h = headingAt(t - 0.25);
  // the side: at first straight out from the predator's flank (+z, never toward the fish), then swinging to the
  // swimmer's downstream side as it heads out into open water
  let down = norm3([h[2], 0, -h[0]]);
  if (down[0] < 0) down = mul3(down, -1) as V3;
  const side = norm3(add3(mul3([0, 0, 1], 1 - ss(t, 21.25, 22.3)), mul3(down, ss(t, 21.25, 22.3))));
  // above and beside (looking down ~45°), so the stretch of open water between the eel and the predator shows on screen
  const up = lerp(-9, -30, ss(t, 21.3, 22.4));
  const eye = add3(head, add3(add3(mul3(h, lerp(12, -2, ss(t, 21.3, 22.4))), mul3(side, lerp(26, 22, ss(t, 21.3, 22.4)))), [0, up, 0]));
  const fish: V3 = [-5, -4, 0];
  const focus = add3(mul3(head, 0.55), mul3(mid, 0.45));
  const target = add3(focus, mul3(sub3(fish, focus), lerp(0.18, 0.02, ss(t, 21.3, 22.4))));
  return {eye, target, f: lerp(1100, 1060, ss(t, 21.3, 22.4)), cy: 1120};
};
export const swimState = (t: number): ExtState => {
  const eel = escapeAt(t);
  const cam = swimCam(t);
  return {cam, pose: predPose(t, {look: eel.c[0], bend: 0.1 * Math.sin(2 * Math.PI * 0.6 * t)}), eel, t, split: 'eel', clear: [eel.c[Math.round(N * 0.3)]], clearR: 4, nearCut: 14};
};

// ---------------------------------------------------------------- the shot table
export const EXT: Record<string, (t: number) => ExtState> = {
  open: openState,
  gulp: gulpState,
  poke: pokeState,
  follows: followsState,
  head: headState,
  release: releaseState,
  swim: swimState,
};
export const ExtShot: React.FC<{id: string; t: number}> = ({id, t}) => <ExtFrame s={EXT[id](t)} />;
/** S12 LOOP: the last swim frames, a reed close to the lens wiping right to left, frame 0 revealed behind it */
export const LoopShot: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const id = uid('loopclip');
  const t0 = T.reed, t1 = dur - 0.06;
  return (
    <>
      <ExtFrame s={swimState(t)} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <clipPath id={id}>
            <path d={reedWipePoly(t, t0, t1)} />
          </clipPath>
        </defs>
      </svg>
      <div style={{position: 'absolute', inset: 0, clipPath: `path('${reedWipePoly(t, t0, t1)}')`}}>
        <ExtFrame s={openState(t - dur)} />
      </div>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
        <ReedWipe t={t} t0={t0} t1={t1} />
      </svg>
    </>
  );
};
