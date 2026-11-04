// V4 S5 THROAT + S6 GILLS (builder G): global 8.90–12.58 s, rendered 8.70–12.80. One module, one eel.
//
// "Its tail slides up the fish's throat, / slips through a gap in the gills, / and pokes out the side."
//
// S5 THE THROAT (8.90 – CUT): the esophagus, a narrow tube with longitudinal folds, built in true 3D (its own set
//   frame: the tube's axis runs along +x) and seen from INSIDE, beside the eel. We open out of the stomach opening's
//   dark lumen (hand-off 3); the camera travels alongside the tail as it slides up the passage, tip first; near the
//   end it dips toward the passing body until the moving body fills the foreground.
// S6 THE GILLS (CUT – 12.58): a new set and a new angle, from inside the pharynx looking toward the gill curtain:
//   four arch bars (comb-like rakers on their inner edge, a red fringe of filaments behind), real slits between
//   them, the dark opercular chamber beyond, lit from the gill opening at its rear. Set frame: X right (toward the
//   fish's tail), Y down, Z toward the camera; the curtain is the plane Z = 0, the eel crosses it at the origin G
//   (between arch 2 and arch 3). The camera only translates and zooms (it always looks along -Z), so every plane
//   Z = const maps to the screen by a uniform scale: the arches, the chamber wall and the opening are flat layers
//   with exact perspective between them, and the eel is a 3D route through them. Its part already through the slit
//   is drawn behind the curtain (occluded by the bars and filaments), the rest in front; the filaments and the
//   rakers part around the body and the bar beside it gives way.
// The end is hand-off 2: the camera settles in the chamber facing the opening; its rim (the gill cover's free edge,
//   bright water beyond) lies on EDGE, and the eel's last 8 units lie exactly on pokeTail(t) for t in [12.44, 12.72].
import React from 'react';
import {P} from '../../core/geo';
import {uid} from '../../core/ids';
import {lit, mix, rgba} from '../../core/color';
import {C, INK, NS} from '../../art/palette';
import {eelSilhouette} from '../../art/eelArt';
import {clamp, hash, lerp, noise1, ss} from '../../lib';
import {EEL_L, Eel2D, Eel3Pose, N, RADII, US, backFrom, eelScreen} from '../eelV4';
import {EDGE, KeepOut, LUMEN, POKE0, POKE1, POKE_AT, POKE_DIR, POKE_PX, T, pokeTail} from '../timing';
import {Basis, V3, add3, basis, dot3, len3, mul3, norm3, projPoly, proj, spline3, sub3} from '../three';

const W = 1080, H = 1920;
const P2 = (p: P) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
const dPoly = (ps: P[], close = true) => (ps.length ? 'M' + ps.map(P2).join('L') + (close ? 'Z' : '') : '');

// ================================================================ beats (global s)
export const G_BEATS = {
  open0: 8.88, // the lumen's dark starts to open (hand-off 3: full dark until here)
  open1: 9.4, // the passage is fully revealed
  slides: 9.27,
  dip0: 10.1, // the camera dips toward the passing body ...
  cut: 10.42, // ... which fills the foreground: S5 -> S6 (a short dissolve inside the body, CUT ± XF)
  establish: 10.78, // the gill curtain, the tail heading for the slit between arch 2 and arch 3
  slips: 10.89, // the tip enters the slit
  gap: 11.47, // the body threads the gap (the closest push)
  follow: 11.8, // the camera follows the tip across the chamber toward the opening
  settle: 12.4, // the inside of the poke is framed (static camera from here)
  poke: T.poke, // the tip crosses the rim at POKE_AT
};
const XF = 0.045;
/** the darkness beside the passing body around the cut (both views), so the dissolve inside it is unseen */
const cutDark = (t: number) => 0.72 * ss(t, G_BEATS.dip0 + 0.1, G_BEATS.cut) * (1 - ss(t, G_BEATS.cut, G_BEATS.cut + 0.26));

// ================================================================ small helpers
type Key = [number, number];
/** a smooth curve through keys (t, v): cubic Hermite with Catmull-Rom tangents, given end slopes; `mono` keeps
 *  monotone data monotone (Fritsch–Carlson limiting), so the eel never slides backward */
const herm = (t: number, K: Key[], v0 = 0, v1 = 0, mono = false) => {
  const n = K.length;
  if (t <= K[0][0]) return K[0][1] + v0 * (t - K[0][0]);
  if (t >= K[n - 1][0]) return K[n - 1][1] + v1 * (t - K[n - 1][0]);
  const d = (j: number) => (K[j + 1][1] - K[j][1]) / (K[j + 1][0] - K[j][0]);
  const m = (j: number) => {
    let v: number;
    if (j === 0) v = v0;
    else if (j === n - 1) v = v1;
    else v = (K[j + 1][1] - K[j - 1][1]) / (K[j + 1][0] - K[j - 1][0]);
    if (mono) {
      const a = j > 0 ? d(j - 1) : d(0), b = j < n - 1 ? d(j) : d(n - 2);
      if (a * b <= 0 && j > 0 && j < n - 1) return 0;
      v = Math.sign(v) * Math.min(Math.abs(v), 3 * Math.min(Math.abs(a), Math.abs(b)));
    }
    return v;
  };
  let i = 0;
  while (t > K[i + 1][0]) i++;
  const h = K[i + 1][0] - K[i][0], s = (t - K[i][0]) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * K[i][1] + (s3 - 2 * s2 + s) * h * m(i) + (-2 * s3 + 3 * s2) * K[i + 1][1] + (s3 - s2) * h * m(i + 1);
};

type Path3 = {p: V3[]; s: number[]; len: number};
const path3 = (pts: V3[]): Path3 => {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + len3(sub3(pts[i], pts[i - 1])));
  return {p: pts, s, len: s[s.length - 1]};
};
/** the point at arc length s (beyond either end the route runs on straight) */
const at3 = (q: Path3, s: number): V3 => {
  const n = q.p.length;
  if (s <= 0) return add3(q.p[0], mul3(norm3(sub3(q.p[0], q.p[1])), -s));
  if (s >= q.len) return add3(q.p[n - 1], mul3(norm3(sub3(q.p[n - 1], q.p[n - 2])), s - q.len));
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (q.s[m] <= s) lo = m;
    else hi = m;
  }
  const f = (s - q.s[lo]) / (q.s[hi] - q.s[lo] || 1);
  return add3(q.p[lo], mul3(sub3(q.p[hi], q.p[lo]), f));
};
/** the eel on a route like a train on a track: the tail tip at arc length sTip (the tail leads as sTip grows) */
const poseOn = (q: Path3, sTip: number, back: (c: V3[]) => V3[]): Eel3Pose => {
  const c = US.map((u) => at3(q, sTip - EEL_L * (1 - u)));
  return {c, back: back(c)};
};

/** the eel on screen: samples (px), radii (px), roll, depth; `from` = the first sample in front of the near plane
 *  (the samples behind it are replaced by a straight continuation, so the renderer's frame stays sane) */
type ScrEel = {pts: P[]; rad: number[]; dorsal: number[]; depth: number[]; from: number; k: number};
const toScreen = (B: Basis, pose: Eel3Pose, near = 0.35): ScrEel => {
  const sc = eelScreen(B, pose);
  let last = -1;
  for (let i = 0; i <= N; i++) if (sc.depth[i] < near) last = i;
  const from = Math.min(N - 2, last + 1);
  const pts = sc.pts.map((p) => ({...p}));
  const rad = [...sc.rad];
  if (last >= 0) {
    const a = pts[from], b = pts[from + 1];
    const dx = a.x - b.x, dy = a.y - b.y;
    for (let i = from - 1; i >= 0; i--) {
      pts[i] = {x: pts[i + 1].x + dx, y: pts[i + 1].y + dy};
      rad[i] = rad[from];
    }
  }
  // the renderer's unit scale: the tail tip's, times its foreshortening along the body (the fin fringe and the
  // pointed tip are sized by it, so they stay in proportion where the tail points into the depth)
  const j0 = Math.max(from, 108);
  let scr = 0;
  for (let i = j0 + 1; i <= N; i++) scr += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const tru = (EEL_L * (N - j0)) / N;
  const sTip = sc.s[Math.min(N, j0 + 6)];
  const k = Math.max(4, Math.min(sTip, scr / Math.max(1e-3, tru)));
  return {pts, rad, dorsal: sc.dorsal, depth: sc.depth, from: last >= 0 ? from + 0.02 : 0, k};
};
const EelS: React.FC<{e: ScrEel; t: number; from?: number; to?: number; opacity?: number}> = ({e, t, from, to, opacity}) => {
  const f = Math.max(from ?? 0, e.from);
  if (to !== undefined && to - f < 0.05) return null;
  const rScale = e.rad.map((r, i) => r / (RADII[i] * e.k));
  return <Eel2D pts={e.pts} k={e.k} px={1} t={t} dorsal={e.dorsal} from={f} to={to} opacity={opacity} rScale={rScale} />;
};
/** the eel's screen samples for the caption check (only the drawn part, only what can touch the frame) */
const keepOfEel = (e: ScrEel, from = 0, to = N) => {
  const out: {x: number; y: number; r: number}[] = [];
  const a = Math.ceil(Math.max(from, e.from)), b = Math.floor(to);
  for (let i = a; i <= b; i++) {
    const p = e.pts[i], r = e.rad[i];
    if (p.x + r < 0 || p.x - r > W || p.y + r < 0 || p.y - r > H) continue;
    out.push({x: p.x, y: p.y, r});
  }
  return out;
};

// ================================================================ the set's shades (from the palette)
const K = {
  // S5: the esophagus
  esoLit: lit(C.esophagus, 0.2),
  eso: C.esophagus,
  esoMid: mix(C.esophagus, C.chamber, 0.32),
  esoDark: mix(C.esophagus, C.chamber, 0.62),
  esoDeep: mix(C.chamber, LUMEN, 0.4),
  ridgeHi: lit(mix(C.esophagus, C.flesh, 0.5), 0.35),
  crease: mix(C.esophagus, C.chamber, 0.75),
  glint: '#FFF7E6',
  // S6: the pharynx, the arches, the chamber, the opening
  roof: mix(C.pharynx, C.chamber, 0.35),
  roofLit: mix(C.pharynx, C.flesh, 0.2),
  roofDark: mix(C.pharynx, C.chamber, 0.7),
  bar: mix(C.flesh, C.gillRed, 0.38),
  barSh: mix(mix(C.flesh, C.gillRed, 0.38), C.gillDark, 0.42),
  barHi: lit(mix(C.flesh, C.gillRed, 0.3), 0.45),
  raker: lit(mix(C.flesh, C.cutFace, 0.5), 0.22),
  rakerSh: mix(C.flesh, C.fleshDeep, 0.55),
  fil: C.gillRed,
  filBack: mix(C.gillRed, C.gillDark, 0.55),
  filHi: C.gillFilament,
  chamber: C.chamber,
  chamberDeep: mix(C.chamber, LUMEN, 0.55),
  chamberWarm: mix(C.chamber, C.gillRed, 0.45),
  chamberFold: mix(C.chamber, LUMEN, 0.35),
  rimLip: mix(C.fleshDeep, C.gillFilament, 0.35),
  rimGlow: lit(mix(C.flesh, C.gillFilament, 0.35), 0.35),
  waterHot: lit(C.waterTop, 0.55),
  waterBright: lit(C.waterTop, 0.22),
  water: C.waterTop,
  waterDeep: C.waterMid,
  wallBeyond: mix(C.fleshDeep, C.chamber, 0.35),
};

// ================================================================ S5: THE THROAT (3D tube, seen from inside)
const S5R = 2.55; // the passage's radius (eel units)
const S5K = 12; // longitudinal folds
const tubeC = (x: number): V3 => [x, 0.16 * Math.sin(0.21 * x + 0.4), 0.2 * Math.sin(0.16 * x + 1.3)];
/** a fold's angle around the axis (0 = down (+y), π/2 = toward the camera's side (+z)), meandering slowly */
const foldPhi = (k: number, x: number) => (2 * Math.PI * k) / S5K + 0.1 * noise1(0.2 * x + k * 7.3, 3);
const tubeR = (x: number, phi: number) => S5R * (1 + 0.035 * Math.sin(0.5 * x + 3 * phi) + 0.03 * noise1(0.27 * x + phi, 5));
const wallPt = (x: number, phi: number, inset = 0): V3 => {
  const c = tubeC(x), r = tubeR(x, phi) - inset;
  return [c[0], c[1] + r * Math.cos(phi), c[2] + r * Math.sin(phi)];
};
const RIDGE = 0.26; // how far a fold's crest stands in from the wall

// the eel's route: along the lower far side of the passage, meandering gently
const S5_ROUTE: Path3 = (() => {
  const pts: V3[] = [];
  for (let x = -90; x <= 60; x += 0.5) {
    const c = tubeC(x);
    const ph = -0.5 + 0.2 * Math.sin(0.62 * x + 0.7) + 0.06 * Math.sin(1.31 * x + 2.0);
    const rho = 1.5 + 0.1 * Math.sin(0.62 * x + 2.3);
    pts.push([x, c[1] + rho * Math.cos(ph), c[2] + rho * Math.sin(ph)]);
  }
  return path3(pts);
})();
const S5_X0 = S5_ROUTE.p[0][0];
/** the tail tip's x (route arc ≈ x), keyed: it slides up the passage, tip first, never back */
const s5Tip = (t: number) => herm(t, [[8.7, 2.0], [9.27, 4.2], [10.0, 8.0], [10.42, 10.3]], 3.0, 5.6, true);
const s5Pose = (t: number) => poseOn(S5_ROUTE, s5Tip(t) - S5_X0, (c) =>
  c.map((p, i) => {
    // the back faces the passage's axis (the eel lies on its belly along the wall)
    const a = c[Math.max(0, i - 1)], b = c[Math.min(N, i + 1)];
    const Tn = norm3(sub3(b, a));
    const ax = tubeC(p[0]);
    const v = sub3([p[0], ax[1], ax[2]], p);
    const k = dot3(v, Tn);
    return norm3(sub3(v, mul3(Tn, k)));
  }),
);
/** the S5 camera: alongside the tail, on the upper near side of the passage, looking up the passage (its depth
 *  vanishes ahead, below the caption band) and down at the tail lying along the far wall; it keeps pace a little
 *  behind the tip (the tip draws ahead), then from DIP0 it dips toward the passing body until it fills the frame */
const s5Cam = (t: number) => {
  const tip = s5Tip(t);
  const lag = herm(t, [[8.7, 7.0], [9.4, 7.8], [10.05, 8.8], [10.42, 11.2]], 0, 5.0);
  const xc = tip - lag;
  const dip = ss(t, G_BEATS.dip0, G_BEATS.cut + 0.05);
  const eye: V3 = [xc, lerp(-0.75, 0.78, dip), lerp(0.95, -0.3, dip)];
  const dir: V3 = [lerp(3.2, 3.0, dip), lerp(0.95, 0.95, dip), lerp(-0.65, -0.62, dip)];
  return basis({eye, target: add3(eye, dir), f: 700, roll: lerp(-22, -24, dip)});
};
/** where the passage's depth vanishes on screen */
const s5Vp = (B: Basis) => proj(B, add3(B.eye, [400, 0, 0]));

/** the passage's walls: fold strips (each fold a crest between two half-grooves, flat cel tones by their facing),
 *  crest lines, transverse creases, pits and wet glints; everything fixed to the wall, so it streams past */
const S5Walls: React.FC<{B: Basis; t: number}> = ({B}) => {
  const L = norm3(add3(add3(mul3(B.r, -0.55), mul3(B.u, 0.7)), mul3(B.fw, -0.45)));
  const xc = B.eye[0];
  const xs: number[] = [];
  for (let k = 0; ; k++) {
    const x = xc - 3 + 0.32 * k + 0.011 * k * k;
    xs.push(x);
    if (x > xc + 60) break;
  }
  type Poly = {d: string; col: string; depth: number};
  const polys: Poly[] = [];
  const tone = (n: V3) => {
    const v = dot3(n, L);
    return v > 0.4 ? K.esoLit : v > 0.05 ? K.eso : v > -0.3 ? K.esoMid : K.esoDark;
  };
  const crest: string[] = [], crestHi: string[] = [];
  for (let k = 0; k < S5K; k++) {
    const pa = (x: number) => foldPhi(k, x), pb = (x: number) => foldPhi(k + 1, x);
    const pm = (x: number) => 0.5 * (pa(x) + pb(x));
    const halves: [(x: number) => number, number, (x: number) => number, number][] = [
      [pa, RIDGE, pm, 0],
      [pm, 0, pb, RIDGE],
    ];
    for (const [fa, ia, fb, ib] of halves) {
      const A = xs.map((x) => wallPt(x, fa(x), ia)), Bp = xs.map((x) => wallPt(x, fb(x), ib));
      const pts = [...A, ...[...Bp].reverse()];
      const d = projPoly(B, pts, 0.12);
      if (!d) continue;
      // facing: the inward normal of the chord between the two edges, near the camera
      const j = 6;
      const chord = sub3(Bp[j], A[j]);
      let nrm: V3 = norm3([0, -chord[2], chord[1]]);
      const mid = mul3(add3(A[j], Bp[j]), 0.5);
      const toAx = sub3(tubeC(mid[0]), mid);
      if (dot3(nrm, toAx) < 0) nrm = mul3(nrm, -1);
      const dep = dot3(sub3(mid, B.eye), B.fw);
      polys.push({d, col: tone(nrm), depth: dep});
    }
    // the crest line (ink + its lit edge), in runs in front of the camera
    let run: P[] = [], runHi: P[] = [];
    const flush = () => {
      if (run.length > 1) crest.push(dPoly(run, false));
      if (runHi.length > 1) crestHi.push(dPoly(runHi, false));
      run = [];
      runHi = [];
    };
    for (const x of xs) {
      if (x > xc + 30) break;
      const p = wallPt(x, pa(x), RIDGE);
      const z = dot3(sub3(p, B.eye), B.fw);
      if (z < 0.25) { flush(); continue; }
      run.push(proj(B, p));
      runHi.push(proj(B, wallPt(x, pa(x) - 0.07, RIDGE * 0.75)));
    }
    flush();
  }
  polys.sort((a, b) => b.depth - a.depth);
  // transverse creases, pits and glints, scattered over the wall (deterministic per wall cell)
  const creases: string[] = [], pits: string[] = [], glints: string[] = [];
  const CELL = 0.9;
  for (let cx = Math.floor((xc - 2) / CELL); cx <= Math.ceil((xc + 22) / CELL); cx++) {
    for (let k = 0; k < S5K; k++) {
      const h1 = hash(cx * 31.7 + k * 5.3), h2 = hash(cx * 11.1 + k * 17.9), h3 = hash(cx * 3.3 + k * 2.1 + 9);
      const x = cx * CELL + h1 * CELL;
      const pa = foldPhi(k, x), pb = foldPhi(k + 1, x);
      if (h2 < 0.5) {
        // a short crease across the groove
        const pts: P[] = [];
        let ok = true;
        for (let j = 0; j <= 4; j++) {
          const ph = lerp(pa, pb, 0.2 + 0.6 * (j / 4));
          const p = wallPt(x + 0.1 * Math.sin(j * 1.3 + h3 * 6), ph, 0.02);
          if (dot3(sub3(p, B.eye), B.fw) < 0.4) { ok = false; break; }
          pts.push(proj(B, p));
        }
        if (ok) creases.push(dPoly(pts, false));
      }
      if (h3 < 0.55) {
        const ph = lerp(pa, pb, 0.25 + 0.5 * h2);
        const p = wallPt(x + 0.45, ph, 0.02);
        const z = dot3(sub3(p, B.eye), B.fw);
        if (z > 0.5) {
          const q = proj(B, p);
          const r = 0.055 * q.s;
          if (h1 < 0.55) pits.push(`M${(q.x - r).toFixed(1)},${q.y.toFixed(1)}a${r.toFixed(1)},${(r * 0.7).toFixed(1)} 0 1,0 ${(2 * r).toFixed(1)},0a${r.toFixed(1)},${(r * 0.7).toFixed(1)} 0 1,0 ${(-2 * r).toFixed(1)},0Z`);
          else glints.push(`M${P2(q)}L${P2(proj(B, wallPt(x + 0.75, ph, 0.02)))}`);
        }
      }
    }
  }
  return (
    <g>
      {polys.map((p, i) => (
        <path key={i} d={p.d} fill={p.col} />
      ))}
      <path d={creases.join('')} stroke={K.crease} strokeOpacity={0.45} strokeWidth={2} fill="none" strokeLinecap="round" vectorEffect={NS} />
      <path d={pits.join('')} fill={K.esoDark} fillOpacity={0.4} />
      <path d={glints.join('')} stroke={K.glint} strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" fill="none" vectorEffect={NS} />
      <path d={crestHi.join('')} stroke={K.ridgeHi} strokeOpacity={0.7} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} />
      <path d={crest.join('')} stroke={INK} strokeOpacity={0.5} strokeWidth={1.7} fill="none" strokeLinejoin="round" strokeLinecap="round" vectorEffect={NS} />
    </g>
  );
};

/** depth: the passage darkens toward where it vanishes ahead, and toward the frame's edges */
const S5Fog: React.FC<{B: Basis; dip: number}> = ({B, dip}) => {
  const vp = s5Vp(B);
  const g = uid('s5fog'), v = uid('s5vig');
  return (
    <g>
      <defs>
        <radialGradient id={g} gradientUnits="userSpaceOnUse" cx={vp.x} cy={vp.y} r={820}>
          <stop offset="0" stopColor={LUMEN} stopOpacity={1} />
          <stop offset="0.07" stopColor={LUMEN} stopOpacity={0.96} />
          <stop offset="0.22" stopColor={LUMEN} stopOpacity={0.6} />
          <stop offset="0.45" stopColor={LUMEN} stopOpacity={0.18} />
          <stop offset="0.75" stopColor={LUMEN} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={v} gradientUnits="userSpaceOnUse" cx={540} cy={1150} r={1300}>
          <stop offset="0.5" stopColor={LUMEN} stopOpacity={0} />
          <stop offset="1" stopColor={LUMEN} stopOpacity={0.75} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={`url(#${g})`} opacity={1 - 0.5 * dip} />
      <rect x={0} y={0} width={W} height={H} fill={`url(#${v})`} />
    </g>
  );
};

const s5State = (t: number) => {
  const B = s5Cam(t);
  const e = toScreen(B, s5Pose(t), 0.12);
  return {B, e};
};

const S5View: React.FC<{t: number}> = ({t}) => {
  const {B, e} = s5State(t);
  // the eel's soft contact shadow on the wall below it (light from the upper left)
  const sh = eelSilhouette(e.pts.map((p) => ({x: p.x + 14, y: p.y + 22})), e.rad.map((r) => r * 1.05), Math.max(1, e.from), N, false, t, 1, 4);
  // opening out of the lumen: an iris of dark that widens off the frame, centred on the passage ahead
  const op = ss(t, G_BEATS.open0, G_BEATS.open1);
  const tipS = e.pts[N];
  const ir = uid('s5iris');
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={K.esoDeep} />
      <S5Walls B={B} t={t} />
      <path d={sh} fill={K.esoDark} fillOpacity={0.5} />
      <S5Fog B={B} dip={ss(t, G_BEATS.dip0, G_BEATS.cut + 0.05)} />
      <rect x={0} y={0} width={W} height={H} fill={LUMEN} fillOpacity={cutDark(t)} />
      <EelS e={e} t={t} />
      {op < 1 && (
        <g>
          <defs>
            <radialGradient id={ir} gradientUnits="userSpaceOnUse" cx={tipS.x - 40} cy={tipS.y + 190} r={110 + 2400 * op ** 1.6}>
              <stop offset="0" stopColor={LUMEN} stopOpacity={0} />
              <stop offset="0.55" stopColor={LUMEN} stopOpacity={0.35 * (1 - op)} />
              <stop offset="1" stopColor={LUMEN} stopOpacity={1} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={W} height={H} fill={`url(#${ir})`} />
          <rect x={0} y={0} width={W} height={H} fill={LUMEN} fillOpacity={1 - ss(t, G_BEATS.open0, G_BEATS.open0 + 0.22)} />
        </g>
      )}
    </g>
  );
};

// ================================================================ S6: THE GILLS (multiplane set)
type Cam6 = {e: V3; f: number; cx: number; cy: number};
const cam6B = (c: Cam6) => basis({eye: c.e, target: [c.e[0], c.e[1], c.e[2] - 1], f: c.f, cx: c.cx, cy: c.cy});
/** the uniform map of the plane Z = z0 onto the screen */
const planeM = (c: Cam6, z0: number) => {
  const s = c.f / (c.e[2] - z0);
  return {s, tx: c.cx - s * c.e[0], ty: c.cy - s * c.e[1]};
};
const planeT = (c: Cam6, z0: number) => {
  const m = planeM(c, z0);
  return `matrix(${m.s.toFixed(5)} 0 0 ${m.s.toFixed(5)} ${m.tx.toFixed(3)} ${m.ty.toFixed(3)})`;
};
const toPlane = (c: Cam6, z0: number, p: P): P => {
  const m = planeM(c, z0);
  return {x: m.s * p.x + m.tx, y: m.s * p.y + m.ty};
};
const fromPlane = (c: Cam6, z0: number, q: P): P => {
  const m = planeM(c, z0);
  return {x: (q.x - m.tx) / m.s, y: (q.y - m.ty) / m.s};
};

// ---------------------------------------------------------------- the end frame (hand-off 2) and the route
const Z_E = -2.0; // the plane the eel's last stretch slides along (just inside the gill cover)
const Z_B = -2.5; // the chamber's outer wall (the cover's inner face) and the opening's rim
const F_END = 520;
/** the poke contract at the cut, mapped into the plane Z_E for a camera at the origin's height (solved below) */
const PK = pokeTail(T.poke);
const I0 = PK.i0;
// G (the crossing of the curtain) is at the origin; the contract's first sample sits up and to the right of it,
// one plane in: from the slit the body goes into the chamber, then turns along the cover toward the opening
const G_TO_I0: V3 = [1.9, -1.0, Z_E];
const CAM_END: Cam6 = (() => {
  const zc = Z_E + F_END / POKE_PX; // the eel plane at exactly POKE_PX px per unit
  const s = POKE_PX;
  // solve the eye so that (G_TO_I0.x, .y) maps to PK.pts[0]
  const ex = G_TO_I0[0] - (PK.pts[0].x - 540) / s;
  const ey = G_TO_I0[1] - (PK.pts[0].y - 960) / s;
  return {e: [ex, ey, zc], f: F_END, cx: 540, cy: 960};
})();
const S6_ROUTE: Path3 = (() => {
  // from the throat (behind and below the camera) straight toward the slit, then through it and along the cover
  const near: V3[] = [
    [1.1, 3.5, 16.0],
    [1.0, 3.0, 13.0],
    [0.85, 2.45, 10.0],
    [0.6, 1.85, 7.2],
    [0.25, 1.2, 4.6],
    [-0.12, 0.62, 2.4],
    [-0.22, 0.26, 0.95],
    [-0.1, 0.07, 0.3],
    [0, 0, 0],
    [0.42, -0.22, -0.62],
    [1.05, -0.56, -1.4],
    [1.55, -0.82, -1.85],
  ];
  // the contract's points at the cut, as the end of the route, then on along the poke direction
  const end: V3[] = PK.pts.map((q) => {
    const p = fromPlane(CAM_END, Z_E, q);
    return [p.x, p.y, Z_E] as V3;
  });
  const sm = spline3(near, 10);
  const last = end[end.length - 1];
  const beyond: V3[] = [1, 2, 3, 4, 5, 6, 8, 10].map((d) => [last[0] + POKE_DIR.x * d, last[1] + POKE_DIR.y * d, Z_E] as V3);
  // join: drop the spline's tail where it would overshoot the contract's first point
  return path3([...sm, ...end.slice(1), ...beyond]);
})();
/** arc length of the crossing (G) and of the rim crossing (the tip at the cut) along the route */
const SIG_G = (() => {
  let best = 0, bd = 1e9;
  S6_ROUTE.p.forEach((p, i) => {
    const d = len3(p);
    if (d < bd) { bd = d; best = S6_ROUTE.s[i]; }
  });
  return best;
})();
const SIG_R = (() => {
  // the route point closest to the contract's tip at the cut
  const tip = fromPlane(CAM_END, Z_E, PK.pts[PK.pts.length - 1]);
  let best = 0, bd = 1e9;
  S6_ROUTE.p.forEach((p, i) => {
    const d = Math.hypot(p[0] - tip.x, p[1] - tip.y, p[2] - Z_E);
    if (d < bd) { bd = d; best = S6_ROUTE.s[i]; }
  });
  return best;
})();
const POKE_U = POKE_PX ? 240 / POKE_PX : 4; // the contract's tip speed in units/s (240 px/s at 60 px/u)
/** the tail tip's arc length on the route (keyed to the words; never backward) */
const s6Tip = (t: number) =>
  herm(
    t,
    [
      [10.3, SIG_G - 3.9],
      [G_BEATS.slips, SIG_G + 0.15],
      [G_BEATS.gap, SIG_G + 3.9],
      [12.0, SIG_G + 7.2],
      [T.poke, SIG_R],
    ],
    6.0,
    POKE_U,
    true,
  );
const s6Pose = (t: number) => poseOn(S6_ROUTE, s6Tip(t), (c) => backFrom(c, [0, -1, 0.35]));

// ---------------------------------------------------------------- the S6 camera
const CAM_EST: Cam6 = {e: [1.6, -0.9, 10.8], f: 1000, cx: 540, cy: 960};
const CAM_GAP: Cam6 = {e: [0.25, -0.45, 3.5], f: 960, cx: 540, cy: 980};
const CAM_CUT: Cam6 = {e: [0.95, 2.15, 11.6], f: 900, cx: 700, cy: 845};
const s6Cam = (t: number): Cam6 => {
  const ks: [number, Cam6][] = [
    [G_BEATS.cut - 0.06, CAM_CUT],
    [G_BEATS.establish, CAM_EST],
    [11.0, {e: [1.2, -0.66, 9.6], f: 990, cx: 540, cy: 962}],
    [G_BEATS.gap + 0.2, CAM_GAP],
    [G_BEATS.settle, CAM_END],
  ];
  const comp = (sel: (c: Cam6) => number) => herm(t, ks.map(([tk, c]) => [tk, sel(c)] as Key));
  return {
    e: [comp((c) => c.e[0]), comp((c) => c.e[1]), comp((c) => c.e[2])],
    f: Math.exp(comp((c) => Math.log(c.f))),
    cx: comp((c) => c.cx),
    cy: comp((c) => c.cy),
  };
};

// ---------------------------------------------------------------- the gill curtain (plane Z = 0, set units)
const ARCH_X = [-3.5, -1.15, 1.15, 3.5];
const ARCH_Y0 = -8.2, ARCH_Y1 = 10.8;
const ARCH_N = 170;
/** an arch's centreline: a curved bar, concave toward the front (left), top to bottom */
const archLine = (k: number): P[] => {
  const out: P[] = [];
  for (let j = 0; j <= ARCH_N; j++) {
    const y = lerp(ARCH_Y0 - 1.6 * k, ARCH_Y1 + 0.9 * k, j / ARCH_N);
    const x = ARCH_X[k] + 0.021 * (y - 1.2) ** 2 - 0.004 * (y - 1.2) ** 2 * Math.abs(k - 1.5) - 0.03;
    out.push({x, y});
  }
  return out;
};
type Disc = {x: number; y: number; r: number};
/** the eel where it crosses the curtain (its samples near Z = 0, as discs in the plane) */
const eelDiscs = (pose: Eel3Pose): Disc[] => {
  const out: Disc[] = [];
  for (let i = 0; i <= N; i++) {
    const p = pose.c[i];
    if (Math.abs(p[2]) < 0.9) out.push({x: p[0], y: p[1], r: RADII[i] * (1 - 0.25 * Math.abs(p[2]))});
  }
  return out;
};
const clearOf = (d: Disc[], p: P) => {
  let m = 99;
  let away: P = {x: 0, y: 0};
  for (const q of d) {
    const dx = p.x - q.x, dy = p.y - q.y, l = Math.hypot(dx, dy);
    const v = l - q.r;
    if (v < m) { m = v; away = {x: dx / (l || 1), y: dy / (l || 1)}; }
  }
  return {m, away};
};
/** a slender finger from b to tp (base half-width w0) with a rounded tip, as path data */
const fingerD = (b: P, tp: P, w0: number) => {
  const vx = tp.x - b.x, vy = tp.y - b.y, l = Math.hypot(vx, vy) || 1e-6;
  const dx = vx / l, dy = vy / l, mx = -dy, my = dx;
  const w1 = w0 * 0.72, cap = Math.min(0.45 * l, 1.1 * w1);
  const mid = {x: tp.x - dx * cap, y: tp.y - dy * cap};
  const ctrl = {x: 2 * tp.x - mid.x, y: 2 * tp.y - mid.y};
  const f = (p: P) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
  return `M${f({x: b.x + mx * w0, y: b.y + my * w0})}L${f({x: mid.x + mx * w1, y: mid.y + my * w1})}Q${f(ctrl)} ${f({x: mid.x - mx * w1, y: mid.y - my * w1})}L${f({x: b.x - mx * w0, y: b.y - my * w0})}Z`;
};
type ArchGeo = {bar: string; barSh: string; barHi: string; rakers: string; rakerSh: string; filBack: string; fil: string; filHi: string};
const archGeo = (k: number, discs: Disc[], t: number): ArchGeo => {
  let C0 = archLine(k);
  const n = C0.length;
  const tanAt = (ps: P[], i: number) => {
    const a = ps[Math.max(0, i - 2)], b = ps[Math.min(ps.length - 1, i + 2)];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return {x: (b.x - a.x) / l, y: (b.y - a.y) / l};
  };
  const w = (u: number) => 0.34 * (0.45 + 0.55 * Math.sin(Math.PI * clamp(u * 1.06 - 0.03)) ** 0.5);
  // the bars on either side of the slit give way where the eel squeezes past
  if (discs.length && (k === 2 || k === 1)) {
    const sgn = k === 2 ? 1 : -1;
    const reach = k === 2 ? 0.36 : 0.7; // rakers (left of arch 3) / filaments (right of arch 2)
    const need = C0.map((p, i) => Math.max(0, 0.05 - clearOf(discs, {x: p.x - sgn * (w(i / (n - 1)) + reach), y: p.y}).m));
    const env = need.map((_, i) => {
      let m = 0;
      for (let j = 0; j < n; j += 2) if (need[j] > 0) m = Math.max(m, need[j] * Math.exp(-((((i - j) * 0.123) / 1.5) ** 2)));
      return m;
    });
    C0 = C0.map((p, i) => ({x: p.x + sgn * Math.min(0.4, env[i] * 0.6), y: p.y}));
  }
  const Tn = C0.map((_, i) => tanAt(C0, i));
  const rt = Tn.map((T) => ({x: T.y, y: -T.x})); // T points down: rt = toward the right (posterior)
  const at = (i: number, off: number) => ({x: C0[i].x + rt[i].x * off, y: C0[i].y + rt[i].y * off});
  const L: P[] = [], R: P[] = [], Rs: P[] = [];
  for (let i = 0; i < n; i++) {
    const ww = w(i / (n - 1));
    L.push(at(i, -ww));
    R.push(at(i, ww));
    Rs.push(at(i, ww * 0.12));
  }
  const capT = {x: C0[0].x - Tn[0].x * 0.25, y: C0[0].y - Tn[0].y * 0.25};
  const capB = {x: C0[n - 1].x + Tn[n - 1].x * 0.25, y: C0[n - 1].y + Tn[n - 1].y * 0.25};
  const bar = dPolyF([capT, ...L, capB, ...[...R].reverse()]);
  const barSh = dPolyF([...Rs.slice(3, -3), ...[...R.slice(3, -3)].reverse()]);
  const barHi = dPolyF(C0.slice(8, -8).map((_, j) => at(j + 8, -w((j + 8) / (n - 1)) * 0.55)), false);
  // rakers: a comb of short pale teeth along the inner (left) edge, pointing in and a little up
  let rakers = '', rakerSh = '';
  for (let i = 5; i < n - 5; i += 3) {
    const u = i / (n - 1);
    const ww = w(u);
    const b = at(i, -ww * 0.75);
    const len = 0.32 * (0.5 + 0.5 * Math.sin(Math.PI * u)) * (0.85 + 0.3 * hash(i * 3.1 + k));
    const d = {x: -rt[i].x - Tn[i].x * 0.28, y: -rt[i].y - Tn[i].y * 0.28};
    const dl = Math.hypot(d.x, d.y);
    let tp = {x: b.x + (d.x / dl) * len, y: b.y + (d.y / dl) * len};
    if (discs.length) {
      const c = clearOf(discs, tp);
      if (c.m < 0.08) tp = {x: tp.x + c.away.x * (0.08 - c.m), y: tp.y + c.away.y * (0.08 - c.m)};
    }
    rakers += fingerD(b, tp, 0.075);
    // the shaded lower side of each tooth
    const m1 = {x: b.x + (tp.x - b.x) * 0.15 + Tn[i].x * 0.035, y: b.y + (tp.y - b.y) * 0.15 + Tn[i].y * 0.035};
    const m2 = {x: b.x + (tp.x - b.x) * 0.8 + Tn[i].x * 0.025, y: b.y + (tp.y - b.y) * 0.8 + Tn[i].y * 0.025};
    rakerSh += `M${m1.x.toFixed(3)} ${m1.y.toFixed(3)}L${m2.x.toFixed(3)} ${m2.y.toFixed(3)}`;
  }
  // filaments: the red fringe along the outer (right) edge, two rows, fanning toward the ends and stirring
  let filBack = '', fil = '', filHi = '';
  for (let i = 3; i < n - 3; i += 2) {
    const u = i / (n - 1);
    const ww = w(u);
    const b = at(i, ww * 0.5);
    const len = 0.6 * (0.35 + 0.65 * Math.sin(Math.PI * u) ** 0.5) * (1 + 0.1 * Math.sin(i * 2.7 + k * 1.3) + 0.07 * Math.sin(i * 0.83 + k * 2.1));
    const sway = 0.07 * Math.sin(2 * Math.PI * (1.2 * t - u * 2.2) + k);
    const fan = 0.5 * (u - 0.5) + sway;
    const dr = {x: rt[i].x + Tn[i].x * fan, y: rt[i].y + Tn[i].y * fan};
    const dl = Math.hypot(dr.x, dr.y);
    const ux = dr.x / dl, uy = dr.y / dl;
    let tp = {x: b.x + ux * len, y: b.y + uy * len};
    // the back row (the other hemibranch), between the front row's filaments, longer and turned down
    const bb = {x: b.x + Tn[i].x * 0.12, y: b.y + Tn[i].y * 0.12};
    let tb = {x: bb.x + ux * len * 1.1 + Tn[i].x * 0.12, y: bb.y + uy * len * 1.1 + Tn[i].y * 0.12};
    if (discs.length) {
      const c1 = clearOf(discs, tp);
      if (c1.m < 0.1) tp = {x: tp.x + c1.away.x * (0.1 - c1.m), y: tp.y + c1.away.y * (0.1 - c1.m)};
      const c2 = clearOf(discs, tb);
      if (c2.m < 0.1) tb = {x: tb.x + c2.away.x * (0.1 - c2.m), y: tb.y + c2.away.y * (0.1 - c2.m)};
    }
    filBack += fingerD(bb, tb, 0.085);
    fil += fingerD(b, tp, 0.085);
    const h1 = {x: b.x + (tp.x - b.x) * 0.3 - Tn[i].x * 0.03, y: b.y + (tp.y - b.y) * 0.3 - Tn[i].y * 0.03};
    const h2 = {x: b.x + (tp.x - b.x) * 0.78 - Tn[i].x * 0.03, y: b.y + (tp.y - b.y) * 0.78 - Tn[i].y * 0.03};
    filHi += `M${h1.x.toFixed(3)} ${h1.y.toFixed(3)}L${h2.x.toFixed(3)} ${h2.y.toFixed(3)}`;
  }
  return {bar, barSh, barHi, rakers, rakerSh, filBack, fil, filHi};
};
const dPolyF = (ps: P[], close = true) => (ps.length ? 'M' + ps.map((p) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join('L') + (close ? 'Z' : '') : '');

/** the pharynx's tissue around the curtain (its roof and floor where the arches root, and its front wall); open
 *  beyond the last arch, where the chamber runs on toward the opening */
/** a fold of tissue whose edge runs along y0 and, past x1, rounds off and curls away (dir -1 up, +1 down) */
const lipLine = (y0: number, x1: number, dir: number, seed: number): P[] => {
  const out: P[] = [];
  for (let j = 0; j <= 44; j++) {
    const x = -6 + j * 0.27;
    if (x > x1) break;
    out.push({x, y: y0 + 0.3 * Math.sin(x * 1.3 + seed) + 0.2 * Math.sin(x * 0.55 + 1 + seed)});
  }
  const e = out[out.length - 1];
  for (let j = 1; j <= 14; j++) {
    const a = (j / 14) * (Math.PI / 2);
    out.push({x: e.x + 1.4 * Math.sin(a) + 0.25 * a, y: e.y + dir * (1.4 * (1 - Math.cos(a)) + 2.2 * (j / 14) ** 2)});
  }
  const l = out[out.length - 1];
  out.push({x: l.x + 0.3, y: l.y + dir * 3}, {x: l.x + 0.5, y: l.y + dir * 30});
  return out;
};
const ROOF: P[] = lipLine(-6.9, 4.6, -1, 0).map((p) => ({x: p.x, y: p.y - 0.5 * Math.max(0, p.x + 4)}));
const FLOOR: P[] = lipLine(9.6, 5.3, 1, 2).map((p) => ({x: p.x, y: p.y + 0.35 * Math.max(0, p.x + 3)}));
const WINDOW: P[] = [...ROOF, {x: 40, y: -40}, {x: 40, y: 40}, ...[...FLOOR].reverse()];
const TISSUE_FOLDS: string = (() => {
  let d = '';
  for (let j = 0; j < 7; j++) {
    const off = 1.4 + j * 1.25;
    const pts = ROOF.filter((_, i) => i % 3 === 0).map((p, i) => ({x: p.x + 0.3 * Math.sin(i * 0.9 + j), y: p.y - off - 0.25 * Math.sin(i * 0.7 + j * 2)}));
    d += dPolyF(pts.slice(j % 2, pts.length - 2 - (j % 3)), false);
    const fl = FLOOR.filter((_, i) => i % 3 === 0).map((p, i) => ({x: p.x + 0.3 * Math.sin(i * 0.8 + j), y: p.y + off + 0.25 * Math.sin(i * 0.6 + j)}));
    d += dPolyF(fl.slice(j % 3, fl.length - 2 - (j % 2)), false);
  }
  return d;
})();
const Tissue: React.FC = () => {
  const outer = 'M-40 -40L40 -40L40 40L-40 40Z';
  const win = dPolyF(WINDOW);
  const edge = dPolyF(ROOF, false) + dPolyF(FLOOR, false);
  const roofLip = dPolyF(ROOF.map((p) => ({x: p.x, y: p.y - 0.28})), false);
  const floorLip = dPolyF(FLOOR.map((p) => ({x: p.x, y: p.y + 0.3})), false);
  return (
    <g>
      {/* the roof's shadow on the arches just below its edge */}
      <path d={dPolyF(ROOF.map((p) => ({x: p.x + 0.15, y: p.y + 0.55})), false)} stroke={K.chamberDeep} strokeWidth={34} strokeOpacity={0.45} fill="none" vectorEffect={NS} />
      <path d={outer + win} fill={K.roof} fillRule="evenodd" />
      {/* soft folds in the tissue, then its rounded lips: the roof's in shade, the floor's lit from above */}
      <path d={TISSUE_FOLDS} stroke={K.roofDark} strokeWidth={4} strokeOpacity={0.45} fill="none" vectorEffect={NS} strokeLinecap="round" />
      <path d={roofLip} stroke={K.roofDark} strokeWidth={16} strokeOpacity={0.55} fill="none" vectorEffect={NS} />
      <path d={dPolyF(ROOF.map((p) => ({x: p.x, y: p.y - 0.9})), false)} stroke={K.roofLit} strokeWidth={6} strokeOpacity={0.5} fill="none" vectorEffect={NS} strokeLinecap="round" />
      <path d={floorLip} stroke={K.roofLit} strokeWidth={12} strokeOpacity={0.7} fill="none" vectorEffect={NS} />
      <path d={edge} stroke={INK} strokeWidth={2.8} fill="none" vectorEffect={NS} strokeLinejoin="round" />
    </g>
  );
};

/** the curtain: all filaments (behind), then the bars, then the rakers (in front); then the tissue frame */
const Curtain: React.FC<{c: Cam6; discs: Disc[]; t: number}> = ({c, discs, t}) => {
  if (c.e[2] < 0.35) return null;
  const geos = [0, 1, 2, 3].map((k) => archGeo(k, discs, t));
  const all = (f: (g: ArchGeo) => string) => geos.map(f).join('');
  const filB = all((g) => g.filBack), filF = all((g) => g.fil);
  return (
    <g transform={planeT(c, 0)}>
      <path d={filB} fill={K.filBack} stroke={INK} strokeWidth={1.6} vectorEffect={NS} strokeLinejoin="round" />
      <path d={filF} fill={K.fil} stroke={INK} strokeWidth={1.6} vectorEffect={NS} strokeLinejoin="round" />
      <path d={all((g) => g.filHi)} stroke={K.filHi} strokeWidth={2.2} strokeLinecap="round" fill="none" vectorEffect={NS} />
      {geos.map((g, i) => (
        <g key={i}>
          <path d={g.bar} fill={K.bar} />
          <path d={g.barSh} fill={K.barSh} />
          <path d={g.barHi} stroke={K.barHi} strokeWidth={3.4} strokeLinecap="round" fill="none" vectorEffect={NS} />
          <path d={g.bar} fill="none" stroke={INK} strokeWidth={2.6} vectorEffect={NS} strokeLinejoin="round" />
        </g>
      ))}
      <path d={all((g) => g.rakers)} fill={K.raker} stroke={INK} strokeWidth={1.5} vectorEffect={NS} strokeLinejoin="round" />
      <path d={all((g) => g.rakerSh)} stroke={K.rakerSh} strokeWidth={2} strokeLinecap="round" fill="none" vectorEffect={NS} />
      <Tissue />
    </g>
  );
};

// ---------------------------------------------------------------- the chamber's wall, the opening, the water beyond
/** EDGE extended up and down along the same gentle curve (screen px at the end frame) */
const EDGE_EXT: P[] = (() => {
  const a = EDGE[0], b = EDGE[1], y = EDGE[EDGE.length - 1], z = EDGE[EDGE.length - 2];
  const up: P[] = [];
  let p = a, d = {x: a.x - b.x, y: a.y - b.y};
  for (let k = 0; k < 6; k++) {
    const l = Math.hypot(d.x, d.y);
    d = {x: d.x / l, y: d.y / l};
    // turn gradually toward the front (left) as it rises: the cover's edge curving over the top
    const ang = Math.atan2(d.y, d.x) - 0.16;
    d = {x: Math.cos(ang), y: Math.sin(ang)};
    p = {x: p.x + d.x * 135, y: p.y + d.y * 135};
    up.push(p);
  }
  const dn: P[] = [];
  p = y;
  d = {x: y.x - z.x, y: y.y - z.y};
  for (let k = 0; k < 6; k++) {
    const l = Math.hypot(d.x, d.y);
    d = {x: d.x / l, y: d.y / l};
    const ang = Math.atan2(d.y, d.x) + 0.13;
    d = {x: Math.cos(ang), y: Math.sin(ang)};
    p = {x: p.x + d.x * 135, y: p.y + d.y * 135};
    dn.push(p);
  }
  return [...up.reverse(), ...EDGE, ...dn];
})();
/** the rim and the far side of the opening, in the plane Z_B (set units) */
const RIM_B: P[] = EDGE_EXT.map((q) => fromPlane(CAM_END, Z_B, q));
const FAR_B: P[] = (() => {
  // the opening's other side (the body wall behind the cover): roughly parallel, 7 units further back (right),
  // closing on the rim at both ends
  const n = RIM_B.length;
  return RIM_B.map((p, i) => {
    const u = i / (n - 1);
    const wv = 3.8 * Math.sin(Math.PI * clamp((u - 0.02) / 0.96)) ** 0.7;
    return {x: p.x + wv, y: p.y + 0.6 * Math.sin(Math.PI * u)};
  });
})();

const ChamberWall: React.FC<{c: Cam6; t: number}> = ({c, t}) => {
  const m = planeM(c, Z_B);
  void m;
  const gG = uid('chG'), gW = uid('chW'), gL = uid('chL');
  const rimMid = RIM_B[Math.floor(RIM_B.length / 2)];
  // the cover's inner face: dark, with soft fan-like folds converging toward its hinge (front, left)
  const folds: string[] = [];
  for (let j = 0; j < 9; j++) {
    const yy = -16 + j * 4.2;
    const pts: P[] = [];
    for (let s = 0; s <= 10; s++) {
      const x = -16 + s * 2.3;
      pts.push({x, y: yy + 0.06 * (x + 16) * (yy - rimMid.y) * 0.08 + 0.4 * Math.sin(x * 0.5 + j)});
    }
    folds.push(dPoly(pts, false));
  }
  const open = [...RIM_B, ...[...FAR_B].reverse()];
  // light rays in the water beyond the opening
  const rays: string[] = [];
  for (let j = 0; j < 6; j++) {
    const x0 = rimMid.x + 1 + j * 1.3 + 0.4 * Math.sin(t * 0.8 + j);
    rays.push(dPoly([{x: x0, y: -30}, {x: x0 + 0.9, y: -30}, {x: x0 + 4.6, y: 30}, {x: x0 + 3.9, y: 30}]));
  }
  return (
    <g transform={planeT(c, Z_B)}>
      <defs>
        <radialGradient id={gG} gradientUnits="userSpaceOnUse" cx={rimMid.x} cy={rimMid.y} r={14}>
          <stop offset="0" stopColor={K.chamberWarm} />
          <stop offset="0.45" stopColor={K.chamber} />
          <stop offset="1" stopColor={K.chamberDeep} />
        </radialGradient>
        <linearGradient id={gW} gradientUnits="userSpaceOnUse" x1={rimMid.x} y1={rimMid.y} x2={rimMid.x + 4.2} y2={rimMid.y - 1.2}>
          <stop offset="0" stopColor={K.waterHot} />
          <stop offset="0.3" stopColor={K.waterBright} />
          <stop offset="0.75" stopColor={K.water} />
          <stop offset="1" stopColor={K.waterDeep} />
        </linearGradient>
        <clipPath id={gL}>
          <path d={dPoly(open)} />
        </clipPath>
      </defs>
      <rect x={-60} y={-60} width={120} height={120} fill={`url(#${gG})`} />
      <path d={folds.join('')} stroke={K.chamberFold} strokeWidth={5} strokeOpacity={0.55} fill="none" vectorEffect={NS} />
      {/* the opening: bright water beyond the cover's free edge */}
      <path d={dPoly(open)} fill={`url(#${gW})`} />
      <g clipPath={`url(#${gL})`}>
        <path d={rays.join('')} fill={'#FFFFFF'} fillOpacity={0.12} />
      </g>
      {/* the far side of the opening: the body wall, in the light */}
      <path d={dPoly(FAR_B, false)} stroke={K.wallBeyond} strokeWidth={26} strokeOpacity={0.9} fill="none" vectorEffect={NS} strokeLinecap="round" />
      <path d={dPoly(FAR_B, false)} stroke={INK} strokeWidth={2.4} fill="none" vectorEffect={NS} />
      {/* the rim: the cover's thin free edge, backlit */}
      <path d={dPoly(RIM_B, false)} stroke={K.rimLip} strokeWidth={30} fill="none" vectorEffect={NS} strokeLinecap="round" />
      <path d={dPoly(RIM_B.map((p) => ({x: p.x - 0.08, y: p.y})), false)} stroke={K.rimGlow} strokeWidth={9} fill="none" vectorEffect={NS} strokeLinecap="round" />
      <path d={dPoly(RIM_B, false)} stroke={INK} strokeWidth={3} fill="none" vectorEffect={NS} />
    </g>
  );
};

// ---------------------------------------------------------------- the S6 state (shared by the view and keepOut)
const s6State = (t: number) => {
  const c = s6Cam(t);
  const B = cam6B(c);
  const pose = s6Pose(t);
  const e = toScreen(B, pose, 0.12);
  // where the body crosses the curtain (Z = 0): a fractional sample index
  let iX = -1;
  for (let i = 1; i <= N; i++) {
    const a = pose.c[i - 1][2], b = pose.c[i][2];
    if (a >= 0 && b < 0) {
      iX = i - 1 + a / (a - b || 1);
      break;
    }
  }
  // hand-off 2: the last 8 units onto the contract, blended in before POKE0 (and held after)
  const w = ss(t, POKE0 - 0.16, POKE0);
  if (w > 0) {
    const pk = pokeTail(t);
    const i0 = pk.i0;
    const d0 = {x: pk.pts[0].x - e.pts[i0].x, y: pk.pts[0].y - e.pts[i0].y};
    const r0 = pk.r[0] / Math.max(1e-3, e.rad[i0]);
    for (let i = 0; i <= N; i++) {
      if (i >= i0) {
        const q = pk.pts[i - i0];
        e.pts[i] = {x: lerp(e.pts[i].x, q.x, w), y: lerp(e.pts[i].y, q.y, w)};
        e.rad[i] = lerp(e.rad[i], pk.r[i - i0], w);
      } else {
        const fall = Math.exp(-(((i0 - i) / 14) ** 2));
        e.pts[i] = {x: e.pts[i].x + d0.x * w * fall, y: e.pts[i].y + d0.y * w * fall};
        e.rad[i] *= lerp(1, r0, w * fall);
      }
    }
  }
  return {c, B, pose, e, iX};
};

/** the slit around the crossing, as a screen polygon (for the caption check) */
const gapPoly = (c: Cam6): P[] => {
  const L = archLine(1), R = archLine(2);
  const near = (ps: P[], y: number) => ps.reduce((b, p) => (Math.abs(p.y - y) < Math.abs(b.y - y) ? p : b), ps[0]);
  const ys = [-1.1, -0.5, 0, 0.5, 1.1];
  const left = ys.map((y) => ({x: near(L, y).x + 0.33, y}));
  const right = ys.map((y) => ({x: near(R, y).x - 0.33, y})).reverse();
  return [...left, ...right].map((p) => toPlane(c, 0, p));
};

const S6View: React.FC<{t: number}> = ({t}) => {
  const {c, pose, e, iX} = s6State(t);
  const discs = eelDiscs(pose);
  const curtainOn = c.e[2] > 0.35;
  // the eel: its part beyond the curtain first (in the chamber), then the curtain, then the part in front
  const back = iX >= 0 ? <EelS e={e} t={t} from={iX} /> : null;
  const front = iX >= 0 ? <EelS e={e} t={t} to={iX} /> : <EelS e={e} t={t} />;
  // the chamber's shade on the eel's part beyond the curtain (less near the opening)
  const shadeD = iX >= 0 ? eelSilhouette(e.pts, e.rad, Math.max(iX, e.from), N, false, t, e.dorsal, 0) : '';
  const shG = uid('s6sh');
  const tipS = e.pts[N];
  const rimS = toPlane(c, Z_B, RIM_B[Math.floor(RIM_B.length / 2)]);
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={K.chamberDeep} />
      <ChamberWall c={c} t={t} />
      {back}
      {shadeD && (
        <g>
          <defs>
            <radialGradient id={shG} gradientUnits="userSpaceOnUse" cx={rimS.x} cy={rimS.y} r={900}>
              <stop offset="0.12" stopColor={K.chamberDeep} stopOpacity={0} />
              <stop offset="0.6" stopColor={K.chamberDeep} stopOpacity={0.3} />
              <stop offset="1" stopColor={K.chamberDeep} stopOpacity={0.45} />
            </radialGradient>
          </defs>
          <path d={shadeD} fill={`url(#${shG})`} />
        </g>
      )}
      {curtainOn && <Curtain c={c} discs={discs} t={t} />}
      <rect x={0} y={0} width={W} height={H} fill={LUMEN} fillOpacity={cutDark(t)} />
      {front}
      {void tipS}
    </g>
  );
};

// ================================================================ the frame
export const S5Throat: React.FC<{t: number}> = ({t}) => {
  const a = clamp((t - (G_BEATS.cut - XF)) / (2 * XF));
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display: 'block', background: LUMEN}}>
      <rect x={0} y={0} width={W} height={H} fill={LUMEN} />
      {a < 1 && <S5View t={t} />}
      {a > 0 && (
        <g opacity={a}>
          <S6View t={t} />
        </g>
      )}
    </svg>
  );
};

/** the caption check: the eel's drawn screen samples (and the slit, while the curtain is in view) */
export const keepOut = (t: number): KeepOut => {
  const a = clamp((t - (G_BEATS.cut - XF)) / (2 * XF));
  const eel: {x: number; y: number; r: number}[] = [];
  let gap: P[] | undefined;
  if (a < 1) eel.push(...keepOfEel(s5State(t).e));
  if (a > 0) {
    const s = s6State(t);
    eel.push(...keepOfEel(s.e));
    if (s.c.e[2] > 0.35) {
      const g = gapPoly(s.c);
      if (g.some((p) => p.x > 0 && p.x < W && p.y > 0 && p.y < H)) gap = g;
    }
  }
  return gap ? {eel, gap} : {eel};
};

/** for the test sheet and the report */
export const S5_DEBUG = {s5Tip, s6Tip, SIG_G, SIG_R, CAM_END, s6State, s5State, RIM_B, Z_B, Z_E, EDGE_EXT, planeM};
