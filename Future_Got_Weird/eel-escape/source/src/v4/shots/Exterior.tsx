// V4 exterior shots (the integrator's): S1 OPEN, S2 GULP, S7 POKE, S8 FOLLOWS, S9 HEAD, S10 RELEASE, S11 SWIM, S12 LOOP.
// Every one draws the SAME predator (v4/pred.tsx), the SAME eel (v4/escape.ts + v4/eelV4.tsx) and the SAME water
// (v4/world.tsx) through its own 3D camera. Times are global (v4/timing.ts).
import React from 'react';
import {clamp, keyS, lerp, ss, ss5} from '../../lib';
import {uid} from '../../core/ids';
import {add3, basis, Basis, Cam3, dot3, lerpOrbit, mul3, norm3, Orbit, orbitCam, orbitDir, proj, sub3, V3} from '../three';
import {backFrom, Eel3D, Eel3Pose, eelScreen, EEL_L, N, path2, US} from '../eelV4';
import {dirOf, escapeAt, EscapePose, Exit, EXIT0, rootedWith, T_REL} from '../escape';
import {PredPose, PRED_REST, Predator, predGeom} from '../pred';
import {PredShadow, ReedWipe, reedWipePoly, WorldBack, WorldFront} from '../world';
import {KeepOut, T} from '../timing';

const D = Math.PI / 180;
const bump = (t: number, a: number, peak: number, b: number) => (t <= a || t >= b ? 0 : t < peak ? ss(t, a, peak) : 1 - ss(t, peak, b));

// ---------------------------------------------------------------- shared frame
type ExtState = {cam: Cam3; pose: PredPose; eel: (EscapePose | (Eel3Pose & {crossI: number})) | null; t: number; mouthClip?: boolean};
const exitFor = (B: Basis, pose: PredPose): Exit => {
  const g = predGeom(B, pose);
  return {p: g.exit.p, out: g.exit.out};
};
export const ExtFrame: React.FC<{s: ExtState}> = ({s}) => {
  const B = basis(s.cam);
  const g = predGeom(B, s.pose);
  const e = s.eel;
  const cross = e ? e.crossI : -1;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <WorldBack B={B} t={s.t} />
      <PredShadow B={B} pose={s.pose} />
      <Predator B={B} pose={s.pose} />
      {e && cross > 0 && (s.mouthClip ? g.mouthHole : g.gap) && <Eel3D B={B} pose={e} t={s.t} from={0} to={Math.min(N, cross)} clip={s.mouthClip ? g.mouthHole : g.gap} />}
      {e && cross < N && <Eel3D B={B} pose={e} t={s.t} from={Math.max(0, cross)} />}
      <WorldFront B={B} t={s.t} />
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

// ---------------------------------------------------------------- S1 OPEN (0 – 2.62), also the loop's target frame
/** the gill cover: one breath on the first beat (peak T.breathPeak), the peek breath on "belongs to the eel" */
export const openGill = (t: number) => Math.max(breath(t), 0.15 + 0.7 * bump(t, -0.02, T.breathPeak, 0.46), 0.15 + 0.85 * bump(t, 1.95, T.peek, 2.9));
/** the tail already out: 16 units, a loose S rising from under the cover toward the near side; it flicks once across
 *  the cover (independently of the breath), and keeps a slow life of its own */
export const OPEN_OUT = 16;
export const openEel = (t: number, ex: Exit): EscapePose => {
  const flick = bump(t, 0.06, T.flick + 0.06, 0.62);
  const life = (a: number) => 7 * D * Math.sin(2 * Math.PI * (0.7 * t + a / 11)) * clamp(a / 6);
  // rising out of the gap, then a loose lateral S (in the plane facing the rear three-quarter camera); the flick
  // swings it forward and out, across the cover
  const th = (a: number) => 17 * D + 42 * D * ss(a, 0, 5) - 22 * D * ss(a, 8, 16) + life(a) + 26 * D * flick * ss(a, 2, 10);
  const be = (a: number) => 20 * D * Math.exp(-a / 3) + 40 * D * Math.sin((2 * Math.PI * a) / 14) * ss(a, 1, 4) + 55 * D * flick * ss(a, 3, 12);
  const r = rootedWith(ex, OPEN_OUT, th, be);
  return {c: r.c, back: backFrom(r.c), out: r.out, crossI: r.crossI, free: false};
};
const O_A: Orbit = {target: [-26.5, -6.5, 6], az: 55, el: 12, d: 34, f: 1300, cy: 1150};
const O_B: Orbit = {target: [-24.0, -6.4, 6.6], az: 44, el: 9, d: 20, f: 1300, cy: 1150};
export const openCam = (t: number): Cam3 => {
  const drift = {...O_A, az: O_A.az - 2 * clamp(t / 1.6)};
  return orbitCam(lerpOrbit(drift, O_B, ss5(t, T.follow0, 2.45)));
};
export const openState = (t: number): ExtState => {
  const cam = openCam(t);
  const pose = predPose(t, {gill: openGill(t)});
  const ex = exitFor(basis(cam), pose);
  return {cam, pose, eel: openEel(t, ex), t};
};

// ---------------------------------------------------------------- S2 GULP (2.62 – 3.84): the earlier gulp, side view
/** the eel's path into the open mouth: from deep in the throat out through the gape, then the tail outside in the
 *  S matched to S1's last frame (rebuilt in this camera at the cut) */
const GULP_CAM0: Orbit = {target: [-51, 0.5, 0], az: -4, el: 4, d: 24, f: 1300, cy: 1060};
const GULP_CAM1: Orbit = {target: [-36, 0, 0], az: -2, el: 3, d: 58, f: 1300, cy: 1100};
export const gulpCam = (t: number): Cam3 => orbitCam(lerpOrbit(GULP_CAM0, GULP_CAM1, ss5(t, T.gulp + 0.12, T.gulp + 0.75)));
export const gulpMouth = (t: number) => 1 - ss(t, T.mouthShut - 0.16, T.mouthShut + 0.02);
const GULP_PATH = (() => {
  // inside: from the stomach forward through the throat to the gape (hidden but for the mouth hole)
  const pts: V3[] = [
    [-14, 1.5, 0], [-24, 1.0, 0], [-34, 0.8, 0], [-44, 0.6, 0], [-50.5, 0.4, 0.4],
    // outside the gape: the tail's loose S, toward the camera side and up
    [-54.0, -0.6, 1.6], [-57.0, -2.8, 2.6], [-58.4, -6.0, 3.2], [-57.2, -9.0, 3.4], [-54.6, -11.0, 3.2], [-52.8, -13.6, 2.8],
  ];
  // densify (Catmull-Rom) and build an arc-length table in 3D
  const out: V3[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 12; k++) {
      const u = k / 12, u2 = u * u, u3 = u2 * u;
      out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)) as V3);
    }
  }
  out.push(pts[pts.length - 1]);
  const s = [0];
  for (let i = 1; i < out.length; i++) s.push(s[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1], out[i][2] - out[i - 1][2]));
  // the arc length of the gape
  let gi = 0;
  for (let i = 0; i < out.length; i++) if (out[i][0] <= -50.5) { gi = i; break; }
  return {p: out, s, len: s[s.length - 1], gape: s[gi]};
})();
const gulpAt = (sArc: number): V3 => {
  const q = GULP_PATH;
  if (sArc <= 0) return q.p[0];
  if (sArc >= q.len) {
    const a = q.p[q.p.length - 1], b = q.p[q.p.length - 2];
    const d = norm3(sub3(a, b));
    return add3(a, mul3(d, sArc - q.len));
  }
  let lo = 0, hi = q.p.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (q.s[m] <= sArc) lo = m; else hi = m;
  }
  const f = (sArc - q.s[lo]) / (q.s[hi] - q.s[lo] || 1);
  return add3(q.p[lo], mul3(sub3(q.p[hi], q.p[lo]), f));
};
/** the tail tip's arc position: 16 units outside the gape at the cut, then sucked in (accelerating), gone at 3.12 */
export const gulpTip = (t: number) => {
  const sOut = GULP_PATH.gape + 16;
  const sIn = GULP_PATH.gape - 1.5;
  const x = clamp((t - T.gulp) / (3.12 - T.gulp));
  return lerp(sOut, sIn, x * x * (0.35 + 0.65 * x));
};
export const gulpEel = (t: number): Eel3Pose & {crossI: number} => {
  const tip = gulpTip(t);
  const flail = (u: number) => 0.5 * Math.sin(2 * Math.PI * (2.6 * t - u * 5)) * clamp((u - 0.6) / 0.4);
  const c = US.map((u) => {
    const p = gulpAt(tip - EEL_L * (1 - u));
    return add3(p, [0, 0, flail(u)]);
  });
  // the part beyond the gape (outside the mouth) is drawn over the predator; the rest only inside the mouth hole
  const outLen = tip - GULP_PATH.gape;
  const crossI = N * (1 - Math.max(0, outLen) / EEL_L);
  return {c, back: backFrom(c), crossI};
};
export const gulpState = (t: number): ExtState => {
  const cam = gulpCam(t);
  const pose = predPose(t, {mouth: gulpMouth(t), gill: Math.max(breath(t), 0.15 + 0.6 * bump(t, 3.15, 3.32, 3.75)), startle: 0.4 * bump(t, 2.9, 3.2, 3.8)});
  return {cam, pose, eel: gulpEel(t), t, mouthClip: true};
};

// ---------------------------------------------------------------- S7 POKE (12.58 – 13.86)
// the camera is solved (tools/solve_poke) so the exit, the tip's travel and the cover's edge land on the contract
export const POKE_ORBIT: Orbit = {target: [-23.55, -6.35, 6.4], az: 19, el: -30, d: 19.37, f: 1300, cx: 540, cy: 1010, roll: 15};
const POKE_ORBIT1: Orbit = {...POKE_ORBIT, target: [-24, -7.0, 6], d: 34, az: 26, el: -22, roll: 6, cy: 1080};
export const pokeCam = (t: number): Cam3 => orbitCam(lerpOrbit(POKE_ORBIT, POKE_ORBIT1, ss5(t, 12.95, 13.86)));
export const pokeState = (t: number): ExtState => ({cam: pokeCam(t), pose: predPose(t), eel: escapeAt(t), t});

// ---------------------------------------------------------------- S8 FOLLOWS (13.86 – 15.96): over the predator's back
const F_A: Orbit = {target: [-14, -9, 6], az: 24, el: 46, d: 78, f: 1250, cy: 1100};
const F_B: Orbit = {target: [-10, -9, 8], az: 30, el: 42, d: 86, f: 1250, cy: 1100};
export const followsCam = (t: number): Cam3 => orbitCam(lerpOrbit(F_A, F_B, ss5(t, T.follows, T.head)));
export const followsState = (t: number): ExtState => ({cam: followsCam(t), pose: predPose(t, {look: null}), eel: escapeAt(t), t});

// ---------------------------------------------------------------- S9 HEAD (15.96 – 17.96): tight at the gill edge
const H_A: Orbit = {target: [-23.0, -5.0, 8.0], az: 38, el: 16, d: 40, f: 1300, cy: 1120};
const H_B: Orbit = {target: [-24.2, -5.8, 7.0], az: 40, el: 14, d: 27, f: 1300, cy: 1120};
export const headCam = (t: number): Cam3 => orbitCam(lerpOrbit(H_A, H_B, ss5(t, T.head, T.head + 1.4)));
/** the cover held open wider while the head is caught: the eye shows in the gap */
const caughtGill = (t: number) => Math.max(breath(t), 0.25 + 0.55 * ss(t, 15.9, 16.4));
export const headState = (t: number): ExtState => ({cam: headCam(t), pose: predPose(t, {gill: caughtGill(t)}), eel: escapeAt(t), t});

// ---------------------------------------------------------------- S10 RELEASE (17.96 – 21.30): low beside the fish
const R_A: Orbit = {target: [-17, -4, 12], az: 16, el: -10, d: 62, f: 1250, cy: 1080};
const R_B: Orbit = {target: [-12, -6, 12], az: 20, el: -8, d: 74, f: 1250, cy: 1080};
export const releaseCam = (t: number): Cam3 => orbitCam(lerpOrbit(R_A, R_B, ss5(t, T.tighten, T.swim)));
export const releaseState = (t: number): ExtState => ({
  cam: releaseCam(t),
  pose: predPose(t, {gill: Math.max(caughtGill(t) * (1 - ss(t, T_REL, T_REL + 0.3)), breath(t)), startle: bump(t, T_REL - 0.1, T_REL + 0.25, T_REL + 1.6), bend: 0.12 * bump(t, T_REL, T_REL + 0.4, T_REL + 1.5)}),
  eel: escapeAt(t),
  t,
});

// ---------------------------------------------------------------- S11 SWIM (21.30 – 24.30): tracking alongside, ahead
export const swimCam = (t: number): Cam3 => {
  const e = escapeAt(t);
  const mid = e.c[Math.round(N * 0.45)];
  // heading of the body (head minus mid), levelled
  const h = norm3(sub3(e.c[0], e.c[N]));
  const side = norm3([h[2], 0, -h[0]]); // horizontal, to the swimmer's right
  const eye = add3(add3(mid, mul3(h, 34)), add3(mul3(side, 15), [0, -4, 0]));
  // look at the eel, a little toward the predator so it stays behind it in frame
  const fish: V3 = [-5, -3, 0];
  const target = add3(mid, mul3(sub3(fish, mid), 0.07));
  return {eye, target, f: 1150, cy: 1060};
};
export const swimState = (t: number): ExtState => ({cam: swimCam(t), pose: predPose(t, {look: escapeAt(t).c[0], bend: 0.1 * Math.sin(2 * Math.PI * 0.6 * t)}), eel: escapeAt(t), t});

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
