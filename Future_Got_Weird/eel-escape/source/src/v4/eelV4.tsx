// V4: THE eel, for every shot. One animal, one body plan, one renderer (art/eelArt.tsx), whatever the camera.
//
// Body plan (V4): EEL_L = 54 u snout → tail tip (the predator is 100 u), N + 1 = 121 samples, u = i / N (0 = snout).
// The two ends must never be confused, from any angle, at phone size:
//   HEAD  a slightly broader, rounded head (1.10 R at u ≈ 0.055) with a clear neck behind it (0.92 R at u ≈ 0.115)
//         and a LARGE eye (eyeScale 1.45: about 0.5 R across the dark pupil, silvery ring, highlight).
//   TRUNK about 1.0 R from u ≈ 0.18 to 0.34 (R = EEL_R_MAX = 1.25 u).
//   TAIL  a long, narrow taper to a fine point: 0.86 R at u = 0.45, 0.42 R at 0.75, 0.09 R at 0.96.
// The radii are in eel units (the same units as the 54 u length). Draw the eel at any scale by drawing it in a group
// scaled by k and passing px = screen px per eel unit (see Eel2D).
import React from 'react';
import {P} from '../core/geo';
import {Eel} from '../art/eelArt';
import {uid} from '../core/ids';
import {Basis, dot3, norm3, proj, sub3, V3} from './three';

export const EEL_L = 54;
export const EEL_R_MAX = 1.25;
export const N = 120;
export const US = Array.from({length: N + 1}, (_, i) => i / N);
export const EYE_SCALE = 1.45;
/** the ribbon fin, a little taller than V3's so the eel's fin fringe reads at phone size outside the fish */
export const FIN_SCALE_3D = 1.6;

// monotone cubic (Fritsch–Carlson) through the profile knots, so the radius is smooth (C1) with no overshoot
const KU = [0.0, 0.012, 0.03, 0.055, 0.085, 0.115, 0.16, 0.24, 0.34, 0.45, 0.6, 0.75, 0.88, 0.96, 1.0];
const KR = [0.5, 0.8, 0.98, 1.1, 1.04, 0.92, 0.95, 1.0, 0.97, 0.86, 0.64, 0.42, 0.22, 0.09, 0.03];
const KM = (() => {
  const n = KU.length;
  const d = KU.slice(0, -1).map((u, i) => (KR[i + 1] - KR[i]) / (KU[i + 1] - u));
  const m = KU.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return m;
})();
/** the V4 body radius (eel units) at u ∈ [0, 1] */
export const eelRadius = (u: number) => {
  if (u <= 0) return KR[0] * EEL_R_MAX;
  if (u >= 1) return KR[KR.length - 1] * EEL_R_MAX;
  let i = 0;
  while (i < KU.length - 2 && u > KU[i + 1]) i++;
  const h = KU[i + 1] - KU[i], s = (u - KU[i]) / h;
  const s2 = s * s, s3 = s2 * s;
  const v = (2 * s3 - 3 * s2 + 1) * KR[i] + (s3 - 2 * s2 + s) * h * KM[i] + (-2 * s3 + 3 * s2) * KR[i + 1] + (s3 - s2) * h * KM[i + 1];
  return v * EEL_R_MAX;
};
export const RADII = US.map(eelRadius);
/** body landmarks (u): the eye, the widest head, the neck, where the tail's taper begins */
export const EEL_U = {eye: 0.03, headMax: 0.055, neck: 0.115, taper: 0.34};

// ---------------------------------------------------------------- posing helpers (2D, any units)
/** a polyline with a cumulative arc-length table */
export type Path2 = {p: P[]; s: number[]; len: number};
export const path2 = (pts: P[]): Path2 => {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {p: pts, s, len: s[s.length - 1]};
};
/** the point at arc length s (beyond either end the path continues straight along its end tangent) */
export const at2 = (q: Path2, s: number): P => {
  const n = q.p.length;
  if (s <= 0) {
    const a = q.p[0], b = q.p[1], l = q.s[1] || 1;
    return {x: a.x + ((b.x - a.x) / l) * s, y: a.y + ((b.y - a.y) / l) * s};
  }
  if (s >= q.len) {
    const a = q.p[n - 1], b = q.p[n - 2], l = q.len - q.s[n - 2] || 1, e = s - q.len;
    return {x: a.x + ((a.x - b.x) / l) * e, y: a.y + ((a.y - b.y) / l) * e};
  }
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (q.s[m] <= s) lo = m; else hi = m;
  }
  const f = (s - q.s[lo]) / (q.s[hi] - q.s[lo] || 1);
  return {x: q.p[lo].x + (q.p[hi].x - q.p[lo].x) * f, y: q.p[lo].y + (q.p[hi].y - q.p[lo].y) * f};
};
/**
 * The eel lying ALONG a path, like a train on a track: the TAIL TIP at arc length sTip, the snout at sTip − L·k
 * (k = the drawing scale: path units per eel unit). Returns the 121 samples snout → tail tip in path units. The tail
 * leads whenever sTip increases. `wave(u)` (optional) adds a lateral offset in eel units (left normal of the
 * snout→tail direction), e.g. a small undulation that leaves the route but not the order of the body.
 */
export const alongPath = (q: Path2, sTip: number, k = 1, wave?: (u: number) => number): P[] => {
  const pts = US.map((u) => at2(q, sTip - EEL_L * k * (1 - u)));
  if (!wave) return pts;
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    const w = wave(US[i]) * k;
    return {x: p.x + (dy / l) * w, y: p.y - (dx / l) * w};
  });
};

// ---------------------------------------------------------------- drawing
export type Eel2DProps = {
  /** 121 samples snout → tail tip, in the drawing's units */
  pts: P[];
  /** drawing units per eel unit (default 1: the drawing is in eel units) */
  k?: number;
  /** screen px per DRAWING unit (so the eel's px per eel unit is px · k) */
  px: number;
  t: number;
  dorsal?: number | number[];
  from?: number;
  to?: number;
  opacity?: number;
  /** a clip path d in the DRAWING's units, or url(#id) */
  clip?: string;
  over?: 'tail' | 'head';
  /** per-sample radius multipliers (e.g. a perspective scale), default 1 */
  rScale?: number[];
};
/** The V4 eel in a 2D drawing (stomach, throat, gills, X-ray...). Put it inside your drawing's transform. */
export const Eel2D: React.FC<Eel2DProps> = ({pts, k = 1, px, t, dorsal = 1, from, to, opacity, clip, over, rScale}) => {
  // the renderer's constants (fins, cut epsilons) are in eel units: draw in eel units inside a scale(k) group
  const ptsE = pts.map((p) => ({x: p.x / k, y: p.y / k}));
  const radii = RADII.map((r, i) => r * (rScale ? rScale[i] ?? 1 : 1));
  const clipE = clip && !clip.startsWith('url(') ? undefined : clip;
  const inner = (
    <Eel pts={ptsE} radii={radii} px={px * k} t={t} dorsal={dorsal} from={from} to={to} opacity={opacity} clip={clipE} over={over} eyeScale={EYE_SCALE} />
  );
  const g = k === 1 ? inner : <g transform={`scale(${k})`}>{inner}</g>;
  if (clip && !clip.startsWith('url(')) {
    // a path clip in drawing units: wrap (the Eel's own clip would be read in eel units)
    return <ClipG d={clip}>{g}</ClipG>;
  }
  return g;
};
const ClipG: React.FC<{d: string; children: React.ReactNode}> = ({d, children}) => {
  const id = uid('e4clip');
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
};

// ---------------------------------------------------------------- 3D: project a 3D eel through a camera
export type Eel3Pose = {
  /** 121 world points snout → tail tip */
  c: V3[];
  /** per sample, the direction of the eel's BACK (dorsal midline), unit, roughly perpendicular to the body */
  back: V3[];
};
/** the eel's screen samples (px), screen radii (px) and per-sample `dorsal` roll values for the renderer */
export const eelScreen = (B: Basis, e: Eel3Pose) => {
  const pr = e.c.map((p) => proj(B, p));
  const pts = pr.map((q) => ({x: q.x, y: q.y}));
  const rad = pr.map((q, i) => RADII[i] * q.s);
  const dorsal = pr.map((_, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    const tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
    const d = norm3(e.back[i]);
    // the back in screen terms: (dx, dy) on the screen (y down), dz away from the camera
    const dx = dot3(d, B.r), dy = -dot3(d, B.u), dz = dot3(d, B.fw);
    // right normal of the snout→tail screen direction
    const nRx = -ty / tl, nRy = tx / tl;
    const a1 = dx * nRx + dy * nRy; // toward the right edge
    const b1 = -dz; // toward the viewer
    let th = Math.atan2(a1, b1); // 0 = the back faces the viewer, +π/2 = on the right edge
    th = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, th));
    return (-2 * th) / Math.PI;
  });
  const depth = pr.map((q) => q.z);
  return {pts, rad, dorsal, depth, s: pr.map((q) => q.s)};
};
/** The V4 eel in 3D, drawn in screen px (place it in the frame's root, untransformed). `from`/`to` cut sections
 *  (sample indices) exactly as in eelArt; `clip` is a SCREEN-space path d or url(#id). */
export const Eel3D: React.FC<{B: Basis; pose: Eel3Pose; t: number; from?: number; to?: number; clip?: string; opacity?: number; over?: 'tail' | 'head'}> = ({B, pose, t, from: from0, to: to0, clip, opacity, over}) => {
  const sc = eelScreen(B, pose);
  // near plane: only the samples in front of the lens (the longest such run inside [from, to]) are drawn
  const NEAR = 1.5;
  let from = from0, to = to0;
  {
    const a = Math.max(0, Math.floor(from ?? 0)), b = Math.min(N, Math.ceil(to ?? N));
    if (sc.depth.slice(a, b + 1).some((z) => z < NEAR)) {
      let best: [number, number] | null = null, s0 = -1;
      for (let i = a; i <= b + 1; i++) {
        const ok = i <= b && sc.depth[i] >= NEAR;
        if (ok && s0 < 0) s0 = i;
        if (!ok && s0 >= 0) { if (!best || i - 1 - s0 > best[1] - best[0]) best = [s0, i - 1]; s0 = -1; }
      }
      if (!best || best[1] - best[0] < 2) return null;
      from = Math.max(from ?? 0, best[0]);
      to = Math.min(to ?? N, best[1]);
    }
  }
  // draw in eel-like units: divide by a reference scale (the median px per unit), so the renderer's unit constants
  // (fin heights, cut overlaps) stay proportionate; radii carry the per-sample perspective
  const ss = [...sc.s].sort((a, b) => a - b);
  const s0 = Math.max(0.5, ss[Math.floor(ss.length / 2)]);
  const ptsU = sc.pts.map((p) => ({x: p.x / s0, y: p.y / s0}));
  const radU = sc.rad.map((r) => r / s0);
  const clipU = clip && !clip.startsWith('url(') ? undefined : clip;
  const inner = (
    <g transform={`scale(${s0})`}>
      <Eel pts={ptsU} radii={radU} px={s0} t={t} dorsal={sc.dorsal} from={from} to={to} opacity={opacity} clip={clipU} over={over} eyeScale={EYE_SCALE} finScale={FIN_SCALE_3D} />
    </g>
  );
  if (clip && !clip.startsWith('url(')) return <ClipG d={clip}>{inner}</ClipG>;
  return inner;
};
/** helper: a back vector perpendicular to the tangent, from a preferred "up" (default the world's up, -y) */
export const backFrom = (c: V3[], pref: V3 = [0, -1, 0]): V3[] =>
  c.map((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const T = norm3(sub3(b, a));
    const k = dot3(pref, T);
    return norm3([pref[0] - k * T[0], pref[1] - k * T[1], pref[2] - k * T[2]]);
  });
