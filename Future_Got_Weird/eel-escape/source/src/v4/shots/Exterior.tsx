// V4 exterior shots (the integrator's): S1 OPEN, S2 GULP, S7 POKE, S8 FOLLOWS, S9 HEAD, S10 RELEASE, S11 SWIM, S12 LOOP.
// Every one draws the SAME predator (v4/pred.tsx), the SAME eel (v4/escape.ts + v4/eelV4.tsx) and the SAME water
// (v4/world.tsx) through its own 3D camera. Times are global (v4/timing.ts).
import React from 'react';
import {clamp, keyS, lerp, ss, ss5} from '../../lib';
import {uid} from '../../core/ids';
import {add3, basis, Basis, Cam3, dot3, lerpCam, lerpOrbit, mul3, norm3, Orbit, orbitCam, orbitDir, proj, sub3, V3} from '../three';
import {backFrom, Eel3D, Eel3Pose, eelScreen, EEL_L, EEL_R_MAX, N, path2, RADII, US} from '../eelV4';
import {backFrom as backEsc, dirOf, escapeAt, EscapePose, escGill, Exit, EXIT0, exitAtGill, headingAt, rootedWith, T_REL} from '../escape';
import {PredPose, PRED_REST, Predator, predGeom} from '../pred';
import {clearSight, PredShadow, ReedWipe, reedWipePoly, WorldBack, WorldFront} from '../world';
import {depth} from '../three';
import {KeepOut, T} from '../timing';
import {INK} from '../../art/palette';

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
  /** a fixed per-shot choice of reed clumps (1 keep, 0 drop) in place of clear/nearCut: nothing fades mid-shot */
  reedKeep?: (c: {x: number; z: number; r: number; h: number}) => number;
  /** fade reed clumps whose base is within this distance of the lens (no flat blades across the frame) */
  nearCut?: number;
  /** the reeds/rocks split depth: 'eel' = the eel's nearest third (S11), default the predator's centre */
  split?: 'eel' | 'pred';
  /** the part inside the gill drawn a little dimmed (it is in the chamber's shade) */
  insideOpacity?: number;
  /** draw only this many eel units of the inside part (behind the opening), e.g. into the mouth */
  insideSpan?: number;
  /** how dark the opening's shade is over the part inside (default 0.3) */
  insideShade?: number;
  /** a soft shadow of the outside eel cast on the predator's flank (offset in eel radii) */
  flankShadow?: number;
  /** the eye's scale for the part seen inside the opening (the caught head, close up) */
  insideEye?: number;
  /** where the body crosses itself, the head-ward part on top (the release: the head stays in view) */
  headOnTop?: boolean;
  /** draw the outside part plainly (no mask at the opening): the poke, where only the tip is out */
  plainOutside?: boolean;
  /** how far round the crossing the opening shows only the inside drawing (× the default radius): the whole bend of
   *  the neck round the cover's edge drawn in one layer (no seam across it) */
  holeR?: number;
  /** scales the zone round the crossing that the cover's edge hides (default 1): smaller lets more of the body that is
   *  already out show right at the edge (the arch rising out in S8; the head sliding out on the final pull) */
  crossR?: number;
  /** where the shade over the inside drawing starts (fraction of its radius), overriding the default (which keeps
   *  the inside clear wherever it meets the outside drawing) */
  shadeStop?: number;
  /** hide the outside drawing over the WHOLE visible cover plate (not only round the crossing): where the body lies
   *  in the slit just behind the cover's edge, its fin fringe on the cover side stays under the cover (S1) */
  coverFull?: boolean;
  /** S7: a small puff of bubbles where the tip breaks out into open water */
  puff?: boolean;
  /** how far (eel units) the outside drawing reaches in under the cover's rim at the crossing (default 0.5) */
  underRim?: number;
  /** the ribbon fin's scale (default eelV4's FIN_SCALE_3D) */
  finScale?: number;
  /** where the chamber's shade begins, as a fraction of its radius from the crossing (default 0.6) */
  shadeNear?: number;
};
/** the gill cover's rim ink (pred3d draws the free edge in INK) */
const RIM_INK = INK;
/** test-only: draw just one of the gill layers ('in' | 'out') */
export const EXT_DBG = {layer: ''};
/** the exit at the cover's resting edge (pred3d: along the skin, back and up) */
export const EXIT_REST: Exit = {p: EXIT0.p, out: norm3([0.88, -0.47, 0.05])};
/** S1: the tail comes straight out of the dark opening toward the rear camera (the root end-on in the gap), then
 *  bends into its S; the part inside runs straight back into the opening */
export const EXIT_OPEN: Exit = {p: exitAtGill(0.45).p, out: norm3([0.3, 1, 0.3])};
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
  const sight = s.reedKeep ? (c: any, _i: number) => s.reedKeep!(c) : s.clear ? clearSight(B, s.clear, s.clearR ?? 10) : undefined;
  const nc = s.reedKeep ? undefined : s.nearCut;
  const filter = sight || nc
    ? (c: {x: number; z: number; r: number; h: number; n: number; seed: number}, i: number) => {
        const a = sight ? Number(sight(c as any, i)) : 1;
        const b = nc ? ss(Math.hypot(c.x - B.eye[0], c.z - B.eye[2]) - c.r, nc * 0.6, nc) : 1;
        return Math.min(a, b);
      }
    : undefined;
  // the eel and the opening it passes through. THE GILL: the part still inside (snout-ward of the crossing) is seen
  // only through the visible gap, in the chamber's shade; the outside part is drawn whole, except that where it passes
  // under the cover's rear edge (within a small radius of the crossing) the cover plate hides it, and the rim's ink
  // line is drawn over it there: the body slides out from UNDER the edge, with no cut end and no piece of the inside
  // body painted on the cover. THE MOUTH (S2): as before (inside part clipped to the mouth hole).
  const hole = e && cross > 0 && cross < N ? (s.mouthClip ? g.mouthHole : g.gap) : '';
  const gill = !!(e && hole && !s.mouthClip);
  const drawInside = s.insideSpan !== 0;
  const dI = (2.2 * N) / EEL_L, dIo = (0.6 * N) / EEL_L, dO = (4.5 * N) / EEL_L;
  const ids = {fb: uid('fbh'), mi: uid('mih'), mo: uid('moh'), rg: uid('rgh'), rw: uid('rwh'), rm: uid('rmh'), sh: uid('shh'), rh: uid('rhh')};
  const fromIn = s.insideSpan ? Math.max(0, cross - (s.insideSpan * N) / EEL_L) : 0;
  const X = (() => {
    if (!gill || !e) return null;
    const sc = eelScreen(B, e);
    const ci = clamp(cross, 0, N), i0 = Math.min(N - 1, Math.floor(ci)), f = ci - i0;
    const x = lerp(sc.pts[i0].x, sc.pts[i0 + 1].x, f), y = lerp(sc.pts[i0].y, sc.pts[i0 + 1].y, f);
    const r = Math.max(3, lerp(sc.rad[i0], sc.rad[i0 + 1], f));
    const k = lerp(sc.s[i0], sc.s[i0 + 1], f);
    const reach = (s.underRim ?? 0.4) * k;
    const cr = s.crossR ?? 1;
    const R = (1.7 * (reach + r) + 10) * cr;
    // over the opening, the outside drawing gives way to the inside one only right at the crossing (its cut end)
    const Rh0 = (reach + 1.25 * r + 6) * cr, Rh = Rh0 * (s.holeR ?? 1);
    return {x, y, r, R, Rh, Rh0, dIn: ((s.underRim ?? 0.4) * N) / EEL_L, dI: ((R / Math.max(1, k) + 4.5) * N) / EEL_L};
  })();
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
      <WorldBack B={B} t={s.t} zSplit={zSplit} filter={filter} />
      <PredShadow B={B} pose={s.pose} />
      <Predator B={B} pose={s.pose} />
      {e && s.flankShadow && g.outline && <EelShadow B={B} e={e} from={Math.max(0, cross)} clip={g.outline} k={s.flankShadow} />}
      {gill && e && X && (
        <>
          <defs>
            <filter id={ids.fb} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
              <feGaussianBlur stdDeviation={1.6} />
            </filter>
            <mask id={ids.mi} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <path d={hole} fill="#FFFFFF" filter={`url(#${ids.fb})`} />
            </mask>
            <radialGradient id={ids.rg} gradientUnits="userSpaceOnUse" cx={X.x} cy={X.y} r={X.R}>
              <stop offset="0" stopColor="#000000" stopOpacity={1} />
              <stop offset="0.72" stopColor="#000000" stopOpacity={1} />
              <stop offset="1" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={ids.rw} gradientUnits="userSpaceOnUse" cx={X.x} cy={X.y} r={X.R}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset="0.72" stopColor="#FFFFFF" stopOpacity={1} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
            <mask id={ids.mo} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <rect x={0} y={0} width={1080} height={1920} fill="#FFFFFF" />
              {g.cover && <path d={g.cover} fill={s.coverFull ? '#000000' : `url(#${ids.rg})`} filter={s.coverFull ? `url(#${ids.fb})` : undefined} />}
              <path d={hole} fill={`url(#${ids.rh})`} filter={`url(#${ids.fb})`} />
            </mask>
            <radialGradient id={ids.rh} gradientUnits="userSpaceOnUse" cx={X.x} cy={X.y} r={X.Rh}>
              <stop offset="0" stopColor="#000000" stopOpacity={1} />
              <stop offset="0.7" stopColor="#000000" stopOpacity={1} />
              <stop offset="1" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={ids.sh} gradientUnits="userSpaceOnUse" cx={X.x} cy={X.y} r={X.R * 1.7}>
              <stop offset="0" stopColor="#2A0A0E" stopOpacity={0} />
              <stop offset={s.shadeStop ?? Math.min(0.95, Math.max(s.shadeNear ?? 0.6, (1.05 * X.Rh0) / (1.7 * X.R)))} stopColor="#2A0A0E" stopOpacity={0} />
              <stop offset="1" stopColor="#2A0A0E" stopOpacity={s.insideShade ?? 0.3} />
            </radialGradient>
            <mask id={ids.rm} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <circle cx={X.x} cy={X.y} r={X.R} fill={`url(#${ids.rw})`} />
            </mask>
          </defs>
          <g mask={`url(#${ids.mi})`} opacity={EXT_DBG.layer === 'out' ? 0 : 1}>
            {drawInside && <Eel3D B={B} pose={e} t={s.t} from={fromIn} to={Math.min(N, cross + X.dI)} eyeScale={s.insideEye ?? 1.45} finScale={s.finScale} />}
            {/* the chamber's shade deepens away from the opening's edge (none where the body crosses it) */}
            <path d={hole} fill={`url(#${ids.sh})`} />
          </g>
          <g mask={`url(#${ids.mo})`} opacity={EXT_DBG.layer === 'in' ? 0 : 1}>
            <Eel3D B={B} pose={e} t={s.t} from={Math.max(0, cross - X.dIn)} over={s.headOnTop ? 'head' : 'tail'} finScale={s.finScale} />
          </g>
          {g.rim.length > 1 && (
            <path d={'M' + g.rim.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L')} fill="none" stroke={RIM_INK} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" mask={`url(#${ids.rm})`} />
          )}
        </>
      )}
      {e && hole && !gill && (
        <>
          <defs>
            <filter id={ids.fb} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
              <feGaussianBlur stdDeviation={2.2} />
            </filter>
            <mask id={ids.mi} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <path d={hole} fill="#FFFFFF" filter={`url(#${ids.fb})`} />
            </mask>
            <mask id={ids.mo} maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
              <rect x={0} y={0} width={1080} height={1920} fill="#FFFFFF" />
              <path d={hole} fill="#000000" filter={`url(#${ids.fb})`} />
            </mask>
          </defs>
          <g mask={`url(#${ids.mi})`}>
            {drawInside && <Eel3D B={B} pose={e} t={s.t} from={fromIn} to={Math.min(N, cross + dI)} eyeScale={s.insideEye ?? 1.45} />}
            <path d={hole} fill="#1A0608" fillOpacity={s.insideShade ?? 0.3} />
          </g>
          <g mask={`url(#${ids.mo})`}>
            <Eel3D B={B} pose={e} t={s.t} from={Math.max(0, cross - dIo)} to={Math.min(N, cross + dO)} />
          </g>
          {cross + dO < N && <Eel3D B={B} pose={e} t={s.t} from={cross + dO} />}
        </>
      )}
      {e && !hole && cross < N && <Eel3D B={B} pose={e} t={s.t} from={Math.max(0, cross)} over={s.headOnTop ? 'head' : 'tail'} finScale={s.finScale} />}
      {s.puff && <BreakPuff B={B} t={s.t} />}
      <WorldFront B={B} t={s.t} zSplit={zSplit} filter={filter} />
    </svg>
  );
};
/** S7: as the tip breaks out of the gill edge it lets go a few bubbles; they rise and drift back on the current and
 *  are gone before S8 (fixed seeds, released along the tip's own path from T.poke) */
const PUFF = Array.from({length: 9}, (_, k) => {
  const h = (a: number) => (Math.sin(k * 127.1 + a * 311.7) * 43758.5453) % 1;
  const j = (a: number) => Math.abs(h(a));
  return {te: T.poke + 0.045 * k + 0.02 * j(1), r: 0.09 + 0.15 * j(2), off: [0.3 * (j(3) - 0.5), -0.3 - 0.15 * j(4), 0.3 + 0.3 * j(5)] as V3, v: 2.6 + 1.2 * j(6), w: 2 * Math.PI * j(7), life: Math.min(0.7 + 0.3 * j(8), T.follows - 0.08 - (T.poke + 0.045 * k + 0.02 * j(1)))};
});
const BreakPuff: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const out: React.ReactNode[] = [];
  PUFF.forEach((b, k) => {
    const a = t - b.te;
    if (a < 0 || a > b.life) return;
    const p0 = escapeAt(b.te).c[N];
    const p: V3 = add3(add3(p0, b.off), [0.6 * a + 0.08 * Math.sin(9 * a + b.w), -b.v * a * (1 - 0.25 * a), 0.25 * a]);
    const q = proj(B, p);
    const r = q.s * b.r * (1 + 0.35 * a);
    const op = ss(a, 0, 0.06) * (1 - ss(a, b.life - 0.3, b.life));
    if (r < 0.8 || op <= 0) return;
    out.push(
      <g key={k} opacity={op}>
        <circle cx={q.x} cy={q.y} r={r} fill="#E8FBF6" fillOpacity={0.22} stroke="#F4FFFC" strokeOpacity={0.85} strokeWidth={Math.max(1, 0.16 * r)} />
        <circle cx={q.x - 0.35 * r} cy={q.y - 0.38 * r} r={0.26 * r} fill="#FFFFFF" fillOpacity={0.9} />
      </g>,
    );
  });
  return <g>{out}</g>;
};
/** the outside eel's soft shadow on the predator (down and right of it: the key light is at the upper left), clipped
 *  to the predator's outline */
const EelShadow: React.FC<{B: Basis; e: Eel3Pose; from: number; clip: string; k: number}> = ({B, e, from, clip, k}) => {
  const sc = eelScreen(B, e);
  const i0 = Math.ceil(from);
  if (N - i0 < 4) return null;
  const rs = sc.rad.slice(i0).filter((r) => r > 0.5).sort((a, b) => a - b);
  const rm = rs[Math.floor(rs.length / 2)] || 4;
  const dx = 1.3 * k * rm, dy = 2.0 * k * rm;
  const id = uid('eshc');
  const segs: React.ReactNode[] = [];
  for (let i = i0; i < N; i += 4) {
    const j = Math.min(N, i + 5);
    const d = 'M' + sc.pts.slice(i, j + 1).map((p) => `${(p.x + dx).toFixed(1)},${(p.y + dy).toFixed(1)}`).join('L');
    segs.push(<path key={i} d={d} fill="none" stroke="#1C1A10" strokeOpacity={0.2} strokeWidth={2 * sc.rad[Math.min(N, i + 2)] * 1.15} strokeLinecap="round" strokeLinejoin="round" />);
  }
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={clip} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{segs}</g>
    </g>
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
  // out of the gap and down the flank behind the cover in a loose S (screen heading φ, deg, y down: 0 right, 90 down);
  // the flick swings the free end across the cover and back
  const phi = (a: number) =>
    62 + 30 * ss(a, 1.5, 8) - 62 * ss(a, 8, 15) + 82 * ss(a, 15, 21.5) +
    9 * Math.sin(2 * Math.PI * (0.65 * t + a / 10)) * clamp(a / 8) +
    85 * flick * ss(a, 5, 14) - 30 * flick * ss(a, 14, 22) -
    14 * peek * ss(a, 4, 14);
  const da = 0.1;
  const n = Math.ceil(OPEN_OUT / da);
  const cs: V3[] = [ex.p];
  let p = ex.p;
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) * da;
    const f = (phi(a) * Math.PI) / 180;
    // out of the gap along the skin first, then in the screen plane, drifting toward the lens (clear of the cover)
    const w = ss(a, 0, 1.2);
    const scr = norm3(add3(add3(mul3(R, Math.cos(f)), mul3(U, -Math.sin(f))), mul3(F, 0.28)));
    const d = norm3(add3(mul3(ex.out, 1 - w), mul3(scr, w)));
    p = add3(p, mul3(d, da));
    cs.push(p);
  }
  const r = rootedWith(ex, OPEN_OUT, () => 0, () => 0, (d) => openInward(ex, d));
  // replace the outside part with this curve
  const c = r.c.map((q, i) => {
    const a = OPEN_OUT - EEL_L * (1 - US[i]);
    if (a < 0) return q;
    const fI = Math.min(n - 1e-6, a / da);
    const i0 = Math.floor(fI), g = fI - i0;
    return add3(cs[i0], mul3(sub3(cs[i0 + 1], cs[i0]), g));
  });
  // the back faces sideways IN the screen plane (not toward the lens), so the ribbon fin shows as a fringe along the
  // tail and round its tip: an eel's tail, not a worm or a line
  const back = c.map((_, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(N, i + 1)];
    const T3 = norm3(sub3(b, a));
    const side = norm3(cross3s(F, T3));
    return mul3(side, -1);
  });
  return {c, back, out: OPEN_OUT, crossI: r.crossI, free: false};
};
const cross3s = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** S1's route inside: straight in under the edge, then curving smoothly forward and down into the gill chamber
 *  (no corner: seen through the lifted cover it is the same body running on, not a squared piece) */
const OPEN_IN = (() => {
  const da = 0.1, n = 120;
  const pts: V3[] = [[0, 0, 0]];
  let p: V3 = [0, 0, 0];
  const d0 = mul3(norm3([0.3, 1, 0.3]), -1), d1 = norm3([-0.78, -0.1, -0.58]);
  for (let k = 0; k < n; k++) {
    const a = (k + 0.5) * da;
    const w = ss(a, 0.5, 5.0);
    p = add3(p, mul3(norm3(add3(mul3(d0, 1 - w), mul3(d1, w))), da));
    pts.push(p);
  }
  return pts;
})();
const openInward = (ex: Exit, d: number): V3 => {
  const f = clamp(d / 0.1, 0, OPEN_IN.length - 1.001), i = Math.floor(f), g = f - i;
  const q = add3(OPEN_IN[i], mul3(sub3(OPEN_IN[i + 1], OPEN_IN[i]), g));
  const beyond = Math.max(0, d - 0.1 * (OPEN_IN.length - 1));
  return add3(add3(ex.p, q), mul3(norm3([-0.78, -0.1, -0.58]), beyond));
};
export const openCam = (t: number): Cam3 => {
  const drift = {...O_A, az: O_A.az - 2 * clamp(t / 1.6)};
  return orbitCam(lerpOrbit(drift, O_B, ss5(t, T.follow0, 2.45)));
};
export const openState = (t: number): ExtState => {
  const cam = openCam(t);
  const pose = predPose(t, {gill: openGill(t)});
  // the root stays where the cover's edge rests; when the cover lifts, the body shows continuing under it
  // the part inside is in deep shade; when the peek breath lifts the cover it shows, the same body running on in
  return {cam, pose, eel: openEel(t, EXIT_OPEN), t, insideShade: 0.8 - 0.38 * bump(t, 1.95, T.peek, 2.75), insideSpan: 5, finScale: 1.9, coverFull: true};
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
  return {cam, pose, eel: gulpEel(t), t, mouthClip: true, insideSpan: 0, insideShade: 0.0};
};

// ---------------------------------------------------------------- S7 POKE (12.58 – 13.86)
// the camera is solved (tools/solve_poke) so the exit, the tip's travel and the cover's edge land on the contract
export const POKE_ORBIT: Orbit = {target: [-23.673, -6.489, 7.343], az: 20, el: -22, d: 18.3, f: 1300, cx: 540, cy: 1010, roll: 12};
const POKE_ORBIT1: Orbit = {target: [-27, -8.0, 7], az: 22, el: -14, d: 38, f: 1300, cx: 560, cy: 1080, roll: 4};
export const pokeCam = (t: number): Cam3 => orbitCam(lerpOrbit(POKE_ORBIT, POKE_ORBIT1, ss5(t, 12.64, 13.5)));
export const pokeState = (t: number): ExtState => {
  const eel = escapeAt(t);
  // just after the match cut the body inside the slit stays in shadow (the inside view showed it coming in on a
  // different line); only the tip breaking out reads, then the slit lightens as more of the body comes out
  return {cam: pokeCam(t), pose: predPose(t, {gill: Math.max(breath(t), escGill(t))}), eel, t, insideShade: lerp(0.9, 0.5, ss(t, 12.95, 13.5)), shadeNear: 0.12, plainOutside: true, nearCut: 22, puff: true};
};
export const pokeStateWith = (o: Orbit, t: number): ExtState => (t > 15.9 && t < 18 ? {...headState(t), cam: orbitCam(o)} : {cam: orbitCam(o), pose: predPose(t), eel: escapeAt(t), t});

// ---------------------------------------------------------------- S8 FOLLOWS (13.86 – 15.96): over the predator's back
const F_A: Orbit = {target: [-16, -7, 11], az: 14, el: 3, d: 42, f: 1250, cx: 610, cy: 1150};
const F_B: Orbit = {target: [-8, -7, 12], az: 16, el: 18, d: 58, f: 1250, cx: 600, cy: 1150};
export const followsCam = (t: number): Cam3 => orbitCam(lerpOrbit(F_A, F_B, ss5(t, T.follows, T.head)));
export const followsState = (t: number): ExtState => {
  const eel = escapeAt(t);
  // the arch rising out of the slit (S7) stays visible right at the edge (a small hidden zone), the bend drawn in one
  // layer, and the body inside the slit in shadow: the tail curves out of the slit, it does not fold at it
  return {cam: followsCam(t), pose: predPose(t, {gill: Math.max(breath(t), escGill(t))}), eel, t, insideShade: 0.9, shadeStop: 0.12, crossR: 0.6, holeR: 0.45, flankShadow: 1, clear: [[-5, -4, 0], EXIT0.p, eel.c[Math.round(N * 0.6)], eel.c[N]], clearR: 14, nearCut: 22};
};

// ---------------------------------------------------------------- S9 HEAD (15.96 – 17.96): tight at the gill edge
const H_A: Orbit = {target: [-20.0, -5.0, 9.0], az: 24, el: 16, d: 36, f: 1300, cx: 470, cy: 1060};
const H_B: Orbit = {target: [-20.5, -5.5, 9.0], az: 25, el: 15, d: 29, f: 1300, cx: 470, cy: 1060};
export const headCam = (t: number): Cam3 => orbitCam(lerpOrbit(H_A, H_B, ss5(t, T.head, T.head + 1.4)));
/** the cover held open wider while the head is caught: the eye shows in the gap */
const caughtGill = (t: number) => Math.max(breath(t), 0.25 + 0.55 * ss(t, 15.9, 16.4));
export const headState = (t: number): ExtState => {
  const eel = escapeAt(t);
  return {cam: headCam(t), pose: predPose(t, {gill: Math.max(breath(t), escGill(t))}), eel, t, insideShade: 0.64, shadeNear: 0.22, insideEye: 0.95, flankShadow: 1, holeR: 2.4, clear: [EXIT0.p, eel.c[Math.round(N * 0.5)]], clearR: 12};
};

// ---------------------------------------------------------------- S10 RELEASE (17.96 – 21.30): low beside the fish
const R_A: Orbit = {target: [-18, -3, 13], az: 20, el: -8, d: 29, f: 1250, cy: 1395};
const R_B: Orbit = {target: [-24, -7, 16], az: 18, el: -5, d: 46, f: 1250, cy: 1160};
/** held on the loop and the caught head; it pushes in toward the slit for the pull, and eases back as the eel swims
 *  off */
const R_P: Orbit = {target: [-18.5, -3.5, 12], az: 20, el: -7, d: 30, f: 1250, cy: 1565};
/** it holds through the head coming free and a beat after (the freed head in view), tilting a little to keep the
 *  rising tail below the captions, then eases back as the eel dashes */
const R_H: Orbit = {...R_P, cy: 1680};
export const releaseCam = (t: number): Cam3 => orbitCam(lerpOrbit(lerpOrbit(lerpOrbit(R_A, R_P, ss5(t, 20.0, 20.8)), R_H, ss5(t, 20.95, 21.25)), R_B, ss5(t, SWIM_CFG.rb0, SWIM_CFG.rb1)));
/** the predator from the curl to the end (S10 and S11 share it, so nothing pops where the release view becomes the
 *  swim view): breathing hard while the eel strains, the cover settling after the head leaves, a startle, a turn
 *  of the head after the escaping eel */
const relPose = (t: number): PredPose =>
  predPose(t, {
    gill: Math.max(breath(t) + 0.08 * Math.sin(2 * Math.PI * 1.3 * t) * (t < T_REL ? 1 : 0), escGill(t), 0.7 * bump(t, T_REL, T_REL + 0.18, T_REL + 0.9)),
    startle: bump(t, T_REL - 0.1, T_REL + 0.25, T_REL + 1.6),
    bend: 0.12 * bump(t, T_REL, T_REL + 0.4, T_REL + 1.5) + 0.08 * Math.sin(2 * Math.PI * 0.6 * t) * ss(t, T_REL + 0.8, T_REL + 1.8),
  });
/** the eel's shadow on the flank: fades as the eel leaves the fish */
const relShadow = (t: number) => 1.4 * (1 - ss(t, T_REL + 0.1, T_REL + 0.7));
/** S10 and S11 are one continuous take (the release view grows into the swim view): the same camera function, the
 *  same predator, the same water and reeds on both sides of the shot boundary */
const tailState = (t: number): ExtState => {
  const eel = escapeAt(t);
  return {
    cam: swimCam(t),
    pose: relPose(t),
    eel,
    t,
    insideShade: 0.5,
    shadeNear: 0.22,
    // the caught head's eye a little larger in the slit (it reads at phone size); on the final pull the zone the
    // cover's edge hides shrinks, so the head is seen sliding out of the slit (it never vanishes and pops back)
    insideEye: 1.8,
    crossR: lerp(1, 0.3, ss(t, 20.4, 20.7)),
    flankShadow: relShadow(t),
    headOnTop: t > 20.55,
    split: 'eel',
    clear: [[-12, -3, 12], [-25, -6, 6], eel.c[Math.round(N * 0.3)]],
    clearR: 9,
    nearCut: 14,
    // the tracking shot (after the cut): the reeds kept or dropped once for the whole shot (no clump fades mid-frame)
    reedKeep: t >= SWIM_CFG.k1 ? swimReedKeep : undefined,
  };
};
/** the swim shot's reed choice: a clump is dropped (for the whole shot) if it ever comes within 9 u of a sight line
 *  from the tracking camera to the eel or the predator, or within 14 u of the lens, sampled every 0.2 s */
let SWIM_SIGHT: {eyes: V3[]; segs: [V3, V3][]} | null = null;
const swimReedKeep = (c: {x: number; z: number; r: number; h: number}): number => {
  if (!SWIM_SIGHT) {
    const eyes: V3[] = [], segs: [V3, V3][] = [];
    for (let t = SWIM_CFG.k1; t <= T.reed + 0.01; t += 0.2) {
      const e = escapeAt(t), eye = swimTrack(t).eye;
      eyes.push(eye);
      for (const p of [[-12, -3, 12], [-25, -6, 6], [-5, -4, 0], e.c[0], e.c[Math.round(N * 0.3)], e.c[Math.round(N * 0.7)]] as V3[]) segs.push([eye, p]);
    }
    SWIM_SIGHT = {eyes, segs};
  }
  for (const [a, b] of SWIM_SIGHT.segs) {
    const vx = b[0] - a[0], vz = b[2] - a[2], l2 = vx * vx + vz * vz || 1;
    for (const [cx, cz] of [[c.x, c.z], [c.x + 0.35 * c.h, c.z]]) {
      const u = clamp(((cx - a[0]) * vx + (cz - a[2]) * vz) / l2);
      if (Math.hypot(a[0] + vx * u - cx, a[2] + vz * u - cz) - c.r < 9) return 0;
    }
  }
  for (const e of SWIM_SIGHT.eyes) if (Math.hypot(c.x - e[0], c.z - e[2]) - c.r < 14) return 0;
  return 1;
};
export const releaseState = (t: number): ExtState => tailState(t);

// ---------------------------------------------------------------- S11 SWIM (21.30 – 24.30): tracking alongside, ahead
/** the tracking camera: beside and a little ahead of the swimmer (on its near side, away from the predator), looking
 *  back across it so the predator lies behind it in frame; it rides with the eel's mid-body (smoothed heading) */
/** the tracking camera: beside the swimmer on its downstream (+x) side and a little ahead, looking back across it so
 *  the predator lies behind it, up and to the side in frame; it rides with the eel's head (lead room) and recedes from
 *  the predator with it */
/** the tracking camera: it rides with the swimmer at a FIXED offset (above, outward from the predator's flank, a little
 *  downstream), so the scene does not swing round; it grows out of the low release view in one continuous move (the
 *  release → swim boundary is not a cut) */
const swimTrack = (t: number): Cam3 => {
  const e = escapeAt(t);
  const head = e.c[Math.round(N * 0.12)], mid = e.c[Math.round(N * 0.45)];
  const focus = add3(mul3(head, 0.55), mul3(mid, 0.45));
  const eye = add3(focus, SWIM_CFG.off as V3);
  const target = add3(add3(focus, mul3(sub3([-5, -4, 0] as V3, focus), SWIM_CFG.look)), SWIM_CFG.lead as V3);
  return {eye, target, f: SWIM_CFG.f, cx: SWIM_CFG.cx, cy: SWIM_CFG.cy};
};
/** the tracking camera's offset from the swimmer, its look toward the predator, lead room (tuned with
 *  tools/v4/swim_gap.ts: clear water on screen between the eel and the predator) */
/** S10 holds low beside the fish through the head coming free and a beat after; on "and swims away" (T.swim) the film
 *  CUTS to the tracking view from above and outside (a swing between the two would carry the predator's face under
 *  the eel mid-move: tools/v4/face_clear.ts). k0/k1 can still blend instead of cutting. */
export const SWIM_CFG = {off: [5, -44, 22], look: 0.1, lead: [-6, 0, 3], f: 1060, cx: 540, cy: 1300, k0: T.swim - 0.001, k1: T.swim, rb0: 21.5, rb1: 22};
export const swimCam = (t: number): Cam3 => {
  const k = t >= SWIM_CFG.k1 ? 1 : ss5(t, SWIM_CFG.k0, SWIM_CFG.k1);
  return k >= 1 ? swimTrack(t) : lerpCam(releaseCam(t), swimTrack(t), k);
};
export const swimState = (t: number): ExtState => tailState(t);

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
