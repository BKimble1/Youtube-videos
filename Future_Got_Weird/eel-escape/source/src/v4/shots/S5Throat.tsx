// V4 S5 THROAT + S6 GILLS (builder G): global 8.90 – T.pokeCut (12.70) s, rendered 8.70–12.80. One module, one eel.
//
// "Its tail slides up the fish's throat, / slips through a gap in the gills, / and pokes out the side."
//
// S5 THE THROAT (8.90 – CUT): the esophagus, a narrow tube with longitudinal folds, built in true 3D (its own set
//   frame: the tube's axis runs along +x) and seen from INSIDE, beside the eel. We open out of the stomach opening's
//   dark lumen (hand-off 3): the dark lifts on the passage. The camera travels alongside the tail, looking up the
//   passage, slower than the eel: the tip slides away from the lens up the passage (screen y ≈ 1400 -> 1000 over
//   9.0–9.9), tip first, through the passage's fixed bends, while the walls stream past (its depth vanishes ahead
//   in the dark, below the caption band). From DIP0 the camera picks up the tail's pace (the tail keeps its width on
//   screen: no swelling toward the lens) and turns gently onto S6's framing of it (the surroundings sink into shadow).
// THE CUT (CUT ± XF, 3 frames): a dissolve round ONE steady tail. S6 opens with its camera behind the same tail,
//   heading the same way into the depth, framed (fitted) to overlay S5's: the tail's samples within ~9 px RMS, its
//   radii within ~1 px, its screen motion within ~1.3 px per frame; MORPH0–MORPH1 carries the small remainder, so
//   the tail's width and direction run on steadily through the change of view (about 1 degree per frame of turn).
// S6 THE GILLS (CUT – 12.58): a new set and a new angle, from inside the pharynx looking toward the gill curtain:
//   four arch bars (comb-like rakers on their inner edge, a red fringe of filaments behind), real slits between
//   them, the dark opercular chamber beyond, lit from the gill opening at its rear. Set frame: X right (toward the
//   fish's tail), Y down, Z toward the camera; the curtain is the plane Z = 0, the eel crosses it at the origin G
//   (between arch 2 and arch 3). The camera only translates and zooms (it always looks along -Z), so every plane
//   Z = const maps to the screen by a uniform scale: the arches, the chamber wall and the opening are flat layers
//   with exact perspective between them, and the eel is a 3D route through them. Its part already through the slit
//   is drawn behind the curtain (occluded by the bars and filaments), the rest in front; the filaments and the
//   rakers part around the body and the bar beside it gives way. The eel is opaque: its far part lies over the
//   filament fringe and under the bars and rakers, and both parts carry a pale backlit rim (light from the opening).
//   Beats (one continuous camera move; the set moves at most ~40 px per frame at the frame's corners in the push and
//   the pull-back): the curtain and the opening's light are there from the cut, the camera pushes in on the slit
//   (CUT – ≈10.9), the tail heads straight for the slit and
//   turns sideways into it ("slips", 10.89), the closest framing while the body threads between the two bars and the
//   tip comes out beyond the next one (NEAR 11.40, "gap" 11.47), then an even pull-back across the chamber toward the
//   opening, settled by SET 12.27. The opening never rises above Y_OPEN = 545 px: it closes there to a point on the
//   rim (the cover meeting the body), and keepOut().gap includes it.
// The opening is anatomy and reads as THE WAY OUT: a slit of daylight between the gill cover's free edge (the rim)
//   and the body wall, tapering to a point at its top, with the outside seen through it (sea-green water brightening
//   toward a rippling surface, light shafts, a hazy riverbed with tufts of plants and a few taller blades bent over in
//   the current that cross the slit and run on behind both its edges, drifting motes; on a far plane, so it slides
//   less than the rim as the camera moves; tall backlit reeds stand through the part seen while the camera is still
//   out by the arches, so the slit reads as daylight and water from the first frame it shows). No outline round the
//   light: the cover's free edge is a thin dark flap of tissue in silhouette (only a hairline under a soft spill of
//   light while the camera is out by the arches; crisp on the rim once it settles, broken where the light spills over
//   it), the far side is lost in a smooth
//   glare (chains of soft glows, no rings); the light spills over the cover's inner face, shafts of it fan in across
//   the chamber (motes drifting in them), it catches the bars and the filaments nearest the slit, rims the eel ever
//   brighter as the tail nears it and darkens the tail into a silhouette; where the tip goes out the glare is hottest
//   and grows as the tip arrives; as the tip goes through (T.poke on, seen until T.pokeCut) the glare eases and the
//   tail in the light is a crisp DARK silhouette (fully so out in the water, with a thin bright edge), so the tip is
//   seen going through the gap (its drawn shape unchanged). The gap breathes and opens a little wider as the tail
//   pushes toward it.
// The end is hand-off 2: the camera settles in the chamber facing the opening; its rim (the cover's free edge, light
//   on both sides) lies on EDGE, and the eel's last 8 units lie exactly on pokeTail(t) for t in [12.44, 12.72].
import React from 'react';
import {P} from '../../core/geo';
import {uid} from '../../core/ids';
import {lit, mix} from '../../core/color';
import {C, INK, NS} from '../../art/palette';
import {eelSilhouette} from '../../art/eelArt';
import {clamp, hash, lerp, noise1, ss} from '../../lib';
import {EEL_L, Eel2D, Eel3Pose, N, RADII, US, backFrom, eelScreen} from '../eelV4';
import {EDGE, KeepOut, LUMEN, POKE0, POKE_AT, POKE_DIR, POKE_PX, POKE_SPEED, POKE_UNITS, T, pokeTail} from '../timing';
import {Basis, V3, add3, basis, dot3, hull, len3, mul3, norm3, projPoly, proj, spline3, sub3} from '../three';

const W = 1080, H = 1920;
const P2 = (p: P) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
const dPoly = (ps: P[], close = true) => (ps.length ? 'M' + ps.map(P2).join('L') + (close ? 'Z' : '') : '');

// ================================================================ beats (global s)
export const G_BEATS = {
  open0: 8.9, // the lumen's dark starts to open (hand-off 3: full dark until here) ...
  open1: 9.22, // ... and is gone: the passage is revealed
  slides: 9.27,
  dip0: 10.05, // the camera picks up the tail's pace (its turn onto S6's framing runs S5_TURN0–S5_TURN1) ...
  morph0: 10.3, // ... ONE eel, its screen shape carried from S5's camera to S6's (they match within a few px) ...
  cut: 10.42, // ... while the sets dissolve under it (CUT ± XF): S5 -> S6
  morph1: 10.56,
  establish: 10.92, // the camera has pushed in past the tail: the curtain, the tail entering the last slit
  slips: 10.89, // the tip enters the slit
  near: 11.4, // the closest framing, while the body threads between the bars ...
  gap: 11.47, // ... "gap"
  follow: 11.5, // then the camera eases back and across, following the tip to the opening
  set: 12.27, // the camera has settled on the inside of the poke (a still frame from here, through the cut)
  lit: 12.15, // the tip runs into the light spilling round the opening (its glare), toward the rim
  settle: POKE0, // the tail is on the poke contract from here
  poke: T.poke, // the tip crosses the rim at POKE_AT
};
const XF = 0.05;
/** the darkness round the tail around the cut (both views), so the sets' dissolve is soft and the tail carries it */
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

/** the depth used for projection: exact beyond Z_SOFT, easing (C1) to a floor near the lens, so a body passing
 *  right by the camera grows smoothly instead of blowing up between two samples (no flare, no pop) */
const Z_SOFT = 0.9, Z_FLOOR = 0.35;
const softZ = (z: number) => (z >= Z_SOFT ? z : Z_FLOOR + (Z_SOFT - Z_FLOOR) * Math.exp((z - Z_SOFT) / (Z_SOFT - Z_FLOOR)));
/** the eel on screen: samples (px), radii (px), roll, depth; `from` = the first sample in front of the camera
 *  (depth > `near`; the samples behind are replaced by a straight continuation, so the renderer's frame stays sane;
 *  with the softened depth the cut lands far outside the frame while the camera rides beside the body) */
type ScrEel = {pts: P[]; rad: number[]; dorsal: number[]; depth: number[]; from: number; k: number; ppu: number[]};
const toScreen = (B: Basis, pose: Eel3Pose, near = 0.0, kMul = 1): ScrEel => {
  const sc = eelScreen(B, pose);
  const cr = Math.cos((B.roll * Math.PI) / 180), sr = Math.sin((B.roll * Math.PI) / 180);
  pose.c.forEach((p, i) => {
    const d = sub3(p, B.eye);
    const z = softZ(dot3(d, B.fw));
    const x0 = (B.f * dot3(d, B.r)) / z, y0 = (-B.f * dot3(d, B.u)) / z;
    sc.pts[i] = {x: B.cx + x0 * cr - y0 * sr, y: B.cy + x0 * sr + y0 * cr};
    sc.s[i] = B.f / z;
    sc.rad[i] = RADII[i] * sc.s[i];
  });
  // the dorsal roll per sample, in the ROLLED screen frame (eelScreen leaves the camera roll out of it, which
  // splays the fin fringe out sideways under a rolled camera)
  const dorsal = pose.c.map((_, i) => {
    const a = sc.pts[Math.max(0, i - 1)], b = sc.pts[Math.min(N, i + 1)];
    const tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
    const d = norm3(pose.back[i]);
    const dx0 = dot3(d, B.r), dy0 = -dot3(d, B.u), dz = dot3(d, B.fw);
    const dx = dx0 * cr - dy0 * sr, dy = dx0 * sr + dy0 * cr;
    const a1 = dx * (-ty / tl) + dy * (tx / tl), b1 = -dz;
    const th = clamp(Math.atan2(a1, b1), -Math.PI / 2, Math.PI / 2);
    return (-2 * th) / Math.PI;
  });
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
  const k = Math.max(3, kMul * Math.min(sTip, scr / Math.max(1e-3, tru)));
  return {pts, rad, dorsal, depth: sc.depth, from: last >= 0 ? from + 0.02 : 0, k, ppu: [...sc.s]};
};
/** the fin's opaque ground: the renderer's ribbon fin is translucent (0.7), which let the bars and rakers show through
 *  the tail's fringe and left the dark body ending square inside a pale cone; under it goes this ground, so the
 *  fringe is opaque, a slate a little darker than the fin, and the tail reads as one fine point */
const FIN_GROUND = C.eelBack;
const EelS: React.FC<{e: ScrEel; t: number; from?: number; to?: number; opacity?: number}> = ({e, t, from, to, opacity}) => {
  const f = Math.max(from ?? 0, e.from);
  if (to !== undefined && to - f < 0.05) return null;
  const rScale = e.rad.map((r, i) => r / (RADII[i] * e.k));
  const fa = Math.max(f, FIN_I0);
  const ground = (to ?? N) - fa > 0.05 ? finSil(e, t, fa, to, 0) : '';
  return (
    <g opacity={opacity}>
      {ground && (
        <g transform={`scale(${e.k})`}>
          <path d={ground} fill={FIN_GROUND} />
        </g>
      )}
      <Eel2D pts={e.pts} k={e.k} px={1} t={t} dorsal={e.dorsal} from={f} to={to} rScale={rScale} />
    </g>
  );
};
/** the first sample of the ribbon fin (u = 0.40) */
const FIN_I0 = Math.floor(0.4 * N);
/** the eel's silhouette WITH its ribbon fin, in the renderer's units (draw inside scale(e.k)); `grow` in screen px */
const finSil = (e: ScrEel, t: number, a: number, b: number | undefined, grow: number, dx = 0, dy = 0) =>
  eelSilhouette(
    e.pts.map((p) => ({x: (p.x + dx) / e.k, y: (p.y + dy) / e.k})),
    e.rad.map((r) => r / e.k),
    a,
    b,
    true,
    t,
    e.dorsal,
    grow / e.k,
  );
/** the tail tip as a fine point: the screen radius is held under a slender cone from the tip (a soft minimum, so
 *  nothing changes where the body is already slimmer than the cone, as in a side view at the contract's scale) */
const coneTip = (e: ScrEel, amt = 1, SL = 0.15) => {
  if (amt <= 0) return;
  const R0 = 0.35;
  let arc = 0;
  for (let i = N; i >= N - 16; i--) {
    if (i < N) arc += Math.hypot(e.pts[i + 1].x - e.pts[i].x, e.pts[i + 1].y - e.pts[i].y);
    const r = e.rad[i], cone = R0 + SL * arc;
    const m = r * Math.pow(1 + (r / cone) ** 4, -0.25);
    // full at the tip, fading out over the last 16 samples (so the taper joins the body without a step)
    e.rad[i] = lerp(r, m, amt * ss(i, N - 16, N - 6));
  }
};
/** where the tail runs into the depth (seen nearly end-on) its last units crowd into a few px on screen, and any
 *  small bend there becomes a hook (a claw); straighten them toward the body's own direction a little way back, by
 *  how foreshortened they are (no change where the tail lies across the view) */
const straightenTip = (e: ScrEel) => {
  const A = N - 14;
  const ang = (i: number) => Math.atan2(e.pts[i + 1].y - e.pts[i].y, e.pts[i + 1].x - e.pts[i].x);
  // the reference direction: a long chord just behind the end-on stretch
  const ref = Math.atan2(e.pts[A].y - e.pts[A - 6].y, e.pts[A].x - e.pts[A - 6].x);
  const du = EEL_L / N;
  const segs: {a: number; l: number}[] = [];
  for (let i = A; i < N; i++) {
    const l = Math.hypot(e.pts[i + 1].x - e.pts[i].x, e.pts[i + 1].y - e.pts[i].y);
    const comp = l / Math.max(1e-6, du * 0.5 * (e.ppu[i] + e.ppu[i + 1]));
    const w = ss((i - A) / (N - A), 0, 0.55) * clamp((0.75 - comp) / 0.45);
    let d = ang(i) - ref;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    segs.push({a: ref + d * (1 - w), l});
  }
  for (let k = 0; k < segs.length; k++) {
    const i = A + k;
    e.pts[i + 1] = {x: e.pts[i].x + Math.cos(segs[k].a) * segs[k].l, y: e.pts[i].y + Math.sin(segs[k].a) * segs[k].l};
  }
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
  backlight: lit(mix(C.waterTop, C.eelBelly, 0.4), 0.35),
  // the light through the opening on the cover's inner face beside the rim
  glow: lit(mix(C.flesh, C.gillFilament, 0.3), 0.5),
  glowWarm: lit(mix(C.flesh, C.gillRed, 0.25), 0.3),
  glowHot: lit(mix(mix(C.flesh, C.gillFilament, 0.3), C.waterTop, 0.45), 0.62),
  // the daylight itself (the shafts entering, the glare, the light wrapping round edges, the rim light on the eel)
  beam: lit(C.waterTop, 0.7),
  wrap: lit(C.waterTop, 0.82),
  // the opening's edges seen against the light: a dark silhouette (the cover's free edge, the body wall)
  sil: mix(INK, LUMEN, 0.45),
  // the cover's free edge against the light: tissue in silhouette (dark, warm), not an ink line
  flap: mix(LUMEN, INK, 0.22),
  // the filaments and the bars where the light from the opening catches them
  filLit: lit(C.gillFilament, 0.45),
  barLit: lit(mix(C.flesh, C.waterTop, 0.35), 0.55),
};

// ================================================================ S5: THE THROAT (3D tube, seen from inside)
const S5R = 2.55; // the passage's radius (eel units)
const S5K = 12; // longitudinal folds
const tubeC = (x: number): V3 => [x, 0.16 * Math.sin(0.21 * x + 0.4), 0.2 * Math.sin(0.16 * x + 1.3)];
/** a fold's angle around the axis (0 = down (+y), π/2 = toward the camera's side (+z)), meandering slowly */
const foldPhi = (k: number, x: number) => (2 * Math.PI * (k + 0.5)) / S5K + 0.1 * noise1(0.2 * x + (((k % S5K) + S5K) % S5K) * 7.3, 3);
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
    // the meander calms where the tip runs at the end (x ≈ 6–12), so the passing tail stays a clean taper (no hook)
    const calm = 1 - 0.75 * Math.exp(-(((x - 9) / 4.5) ** 2));
    const ph = -0.5 + calm * (0.2 * Math.sin(0.62 * x + 0.7) + 0.06 * Math.sin(1.31 * x + 2.0));
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
 *  vanishes ahead, below the caption band) and down at the tail lying along the far wall. It starts close behind the
 *  tip (hidden in the lumen's dark) and travels up the passage slower than the tail, so the tip visibly slides away up
 *  the passage (screen y ~1400 -> 1000 over 9.0-9.9 s); then it picks up the tail's pace for the cut, so the tail
 *  holds its width on screen while the sets change round it; over the last 0.8 s it turns gently (a small pan and
 *  roll, ~1 degree per frame on screen) so the tail lies exactly where S6's camera finds it at the cut */
const S5_TURN0 = 9.65, S5_TURN1 = 10.45;
const s5Cam = (t: number) => {
  const tip = s5Tip(t);
  const lag = herm(t, [[8.7, 2.8], [9.15, 3.6], [9.7, 5.9], [10.05, 7.2], [10.42, 7.8], [10.7, 7.9]], 1.4, 0.3);
  const xc = tip - lag;
  const turn = ss(t, S5_TURN0, S5_TURN1);
  const eye: V3 = [xc, -0.75, 0.95];
  const dir: V3 = [3.2, 0.95 + 0.162 * turn, -0.65 - 0.657 * turn];
  return basis({eye, target: add3(eye, dir), f: 700, roll: -22 + 14 * turn});
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
  // flat cel tones by facing, but a fold that turns across a threshold changes tone over a few frames (a ramp of
  // +-0.1 in facing around each step), never in a single frame
  const tone = (n: V3) => {
    const v = dot3(n, L);
    const step = (a: string, b: string, th: number, x: number) => (x <= th - 0.1 ? a : x >= th + 0.1 ? b : mix(a, b, ss(x, th - 0.1, th + 0.1)));
    if (v <= -0.125) return step(K.esoDark, K.esoMid, -0.3, v);
    if (v <= 0.225) return step(K.esoMid, K.eso, 0.05, v);
    return step(K.eso, K.esoLit, 0.4, v);
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

/** where the tail points into the depth, its last units are foreshortened into a stub (a blunt, pencil-like end):
 *  taper the screen radii of the last units harder, by how much they are foreshortened, so the tip reads as the same
 *  fine point it is in a side view (no change where the tail lies across the view) */
const sharpenTip = (e: ScrEel, extra = 0) => {
  const j0 = N - 10, du = EEL_L / N;
  let ratio = 0, n = 0;
  for (let i = N - 7; i <= N; i++) {
    const ds = Math.hypot(e.pts[i].x - e.pts[i - 1].x, e.pts[i].y - e.pts[i - 1].y);
    const sc = 0.5 * (e.rad[i] / RADII[i] + e.rad[i - 1] / RADII[i - 1]);
    ratio += ds / Math.max(1e-6, du * sc);
    n++;
  }
  const amt = clamp(extra + 0.85 * clamp((1 - ratio / n) / 0.6), 0, 0.8);
  if (amt <= 0) return;
  for (let i = j0 + 1; i <= N; i++) e.rad[i] *= 1 - amt * ((i - j0) / (N - j0)) ** 1.6;
};
const s5State = (t: number) => {
  const B = s5Cam(t);
  const pose = s5Pose(t);
  // the tail rolls its back toward the lens as it slides along the wall below us: its fin fringe is seen edge-on,
  // so the tail reads as one slender tapering body (seen from the side, the fringe sheathed the thin tip like a
  // pencil point)
  pose.back = pose.back.map((bk, i) => {
    const a = pose.c[Math.max(0, i - 1)], b = pose.c[Math.min(N, i + 1)];
    const Tn = norm3(sub3(b, a));
    const v = sub3(B.eye, pose.c[i]);
    const toCam = norm3(sub3(v, mul3(Tn, dot3(v, Tn))));
    return norm3(add3(mul3(toCam, 0.85), mul3(bk, 0.15)));
  });
  const e = toScreen(B, pose, -0.4, 0.45);
  sharpenTip(e, 0.35);
  straightenTip(e);
  // seen end-on the tail is already a cone (about 13 degrees): only its very end, which stopped short at a few px
  // wide, is drawn to the point
  coneTip(e, 1, 0.26);
  return {B, e};
};

/** the S5 set; `eel` false leaves the eel out (the S5 -> S6 transition draws the one eel itself) */
const S5View: React.FC<{t: number; eel?: boolean}> = ({t, eel = true}) => {
  const {B, e} = s5State(t);
  // the eel's soft contact shadow on the wall below it (light from the upper left)
  const sh = eelSilhouette(e.pts.map((p, i) => ({x: p.x + 0.2 * e.rad[i], y: p.y + 0.34 * e.rad[i]})), e.rad.map((r) => r * 1.02), Math.max(1, e.from), N, false, t, 1, 0);
  // opening out of the lumen: its dark lifts evenly, lingering a moment longer at the frame's edges
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
      {eel && <EelS e={e} t={t} />}
      {op < 1 && (
        <g>
          <defs>
            <radialGradient id={ir} gradientUnits="userSpaceOnUse" cx={tipS.x} cy={tipS.y + 120} r={1500}>
              <stop offset="0" stopColor={LUMEN} stopOpacity={0} />
              <stop offset="0.5" stopColor={LUMEN} stopOpacity={0.5} />
              <stop offset="1" stopColor={LUMEN} stopOpacity={1} />
            </radialGradient>
          </defs>
          <rect x={0} y={0} width={W} height={H} fill={`url(#${ir})`} opacity={1 - op} />
          <rect x={0} y={0} width={W} height={H} fill={LUMEN} fillOpacity={1 - ss(t, G_BEATS.open0, G_BEATS.open0 + 0.16)} />
        </g>
      )}
    </g>
  );
};

// ================================================================ S6: THE GILLS (multiplane set)
type Cam6 = {e: V3; f: number; cx: number; cy: number};
/** one focal length for the whole of S6: the camera only translates (it always looks along -Z) */
const F6 = 700;
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
/** screen point q at set depth z -> set point */
const unproj6 = (c: Cam6, q: P, z: number): V3 => {
  const d = c.e[2] - z;
  return [c.e[0] + ((q.x - c.cx) * d) / c.f, c.e[1] + ((q.y - c.cy) * d) / c.f, z];
};

// ---------------------------------------------------------------- the end frame (hand-off 2) and the route
// The layout is built backward from the poke contract at the cut, so the whole escape fits one frame there: the
// slit the tail threads (the LAST slit, between arches 3 and 4, at the set's origin G), the lit lip of the chamber
// and the gill opening. At the cut the curtain crossing lies A_X units tip-ward of the contract's first sample, so
// the eel's last 8 units run from just in front of the curtain, through the slit, behind the last bar, across the
// lit lip to the rim at POKE_AT. Their depth eases from +0.35 (in front of the curtain) to Z_E (in the chamber).
const Z_E = -0.9; // the eel's last stretch, just inside the gill cover
const Z_B = -1.35; // the chamber's outer wall (the cover's inner face) and the opening's rim
const A_X = 1.0;
const PK = pokeTail(T.poke);
const PK_N = PK.pts.length - 1;
const pkA = (k: number) => (k * POKE_UNITS) / PK_N;
/** the contract's screen point at arc position a (units from its first sample) */
const pkAt = (a: number): P => {
  const f = clamp(a / POKE_UNITS) * PK_N, i = Math.min(PK_N - 1, Math.floor(f)), u = f - i;
  return {x: lerp(PK.pts[i].x, PK.pts[i + 1].x, u), y: lerp(PK.pts[i].y, PK.pts[i + 1].y, u)};
};
const zOf = (a: number) => Z_E * Math.tanh((0.38 * (a - A_X)) / -Z_E);
/** the settled end camera: the contract's tip region (depth Z_E) at exactly POKE_PX px per unit, G on the contract */
const CAM_END: Cam6 = (() => {
  const ez = Z_E + F6 / POKE_PX;
  const q = pkAt(A_X);
  return {e: [(-(q.x - 540) * ez) / F6, (-(q.y - 960) * ez) / F6, ez], f: F6, cx: 540, cy: 960};
})();
/** the contract's points at the cut, in the set */
const PK3: V3[] = PK.pts.map((q, k) => unproj6(CAM_END, q, zOf(pkA(k))));
const S6_ROUTE: Path3 = (() => {
  // from the throat (behind and below the camera) toward the slit, curving in over the front of arch 3 ...
  const P0 = PK3[0];
  const offs: V3[] = [
    [-3.2, 4.7, 21.0],
    [-3.3, 4.6, 17.5],
    [-3.25, 4.35, 14.2],
    [-3.0, 3.9, 11.0],
    [-2.6, 3.3, 8.1],
    [-2.05, 2.55, 5.5],
    [-1.45, 1.75, 3.3],
    [-0.8, 0.95, 1.6],
  ];
  const near = offs.map((o) => add3(P0, o));
  // ... then the contract (through G), then on along the poke direction, in the chamber
  const last = PK3[PK_N];
  const beyond: V3[] = [0.6, 1.3, 2.2, 3.4, 5, 7, 10].map((d) => [last[0] + POKE_DIR.x * d, last[1] + POKE_DIR.y * d, Z_E] as V3);
  return path3(spline3([...near, ...PK3, ...beyond], 4));
})();
/** arc length along the route of the route point nearest p */
const arcOf = (p: V3) => {
  let best = 0, bd = 1e9;
  S6_ROUTE.p.forEach((q, i) => {
    const d = len3(sub3(q, p));
    if (d < bd) { bd = d; best = S6_ROUTE.s[i]; }
  });
  return best;
};
const SIG_G = arcOf([0, 0, 0]); // the curtain crossing (G, the set's origin)
const SIG_R = arcOf(PK3[PK_N]); // the tip at the cut (on the rim, at POKE_AT)
const POKE_U = POKE_SPEED / POKE_PX; // the contract's tip speed, units/s
/** the tail tip's arc length on the route (keyed to the words; never backward, never still) */
const s6Tip = (t: number) =>
  SIG_G +
  herm(
    t,
    [
      [G_BEATS.cut, -2.7],
      [G_BEATS.slips, 0],
      [G_BEATS.gap, 2.95],
      // from 12.1 at the contract's speed: the tip runs into the light and across it at a steady pace
      [12.1, SIG_R - SIG_G - POKE_U * (T.poke - 12.1)],
      [T.poke, SIG_R - SIG_G],
    ],
    5.4,
    POKE_U,
    true,
  );
/** its back turned mostly toward the lens (up and toward us): the fin fringe stays a slim edge, not a sheath */
const s6Pose = (t: number) => poseOn(S6_ROUTE, s6Tip(t), (c) => backFrom(c, [0, -0.6, 1]));

// ---------------------------------------------------------------- the S6 camera (translation only)
/** a framing: px per unit on the curtain (Z = 0) and where the slit's centre G sits on the screen. The camera is
 *  keyed in these terms (the scale in log), so the push in and the ease back are even zooms about the slit while it
 *  drifts smoothly across the frame (nothing on screen strobes) */
type Frame6 = {s: number; gx: number; gy: number};
const camOf = (k: Frame6): Cam6 => ({e: [(540 - k.gx) / k.s, (960 - k.gy) / k.s, F6 / k.s], f: F6, cx: 540, cy: 960});
const frameOf = (c: Cam6): Frame6 => {
  const m = planeM(c, 0);
  return {s: m.s, gx: m.tx, gy: m.ty};
};
/** opens above the passing body (matched to S5's last frame), pushes in on the slit for the threading (closest at
 *  NEAR, while the body threads between the bars, just before 'gap'), then eases back and across to the settled end
 *  frame by SET, so the last third of a second is a still frame in which the tip travels into the light */
const FR_CUT: Frame6 = {s: 79.15, gx: 710.9, gy: 833.0};
const FR_GAP: Frame6 = {s: 112, gx: 355, gy: 1164};
const FR_END: Frame6 = frameOf(CAM_END);
/** the S6 camera is already moving when it opens: fitted so the tail's samples move on screen as S5's do at the cut
 *  (within ~1.5 px per frame), so the one tail carries straight through the change of view */
const FR_V0 = {ls: 0.374, gx: -44.7, gy: 70.1};
/** a cubic Hermite segment from a (slope va) at t0 to b (slope vb) at t1 */
const hermSeg = (t: number, t0: number, t1: number, a: number, b: number, va: number, vb: number) => {
  const h = t1 - t0, s = clamp((t - t0) / h), s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * a + (s3 - 2 * s2 + s) * h * va + (-2 * s3 + 3 * s2) * b + (s3 - s2) * h * vb;
};
/** an ease with a flat middle (a smooth trapezoid of speed, ramps of fraction a): the pull-back travels at a near
 *  constant speed, peaking at 1 / (1 - a) of its mean instead of 1.5x for a smoothstep */
const trapEase = (u0: number, a = 0.22) => {
  const u = clamp(u0);
  const F = (x: number) => {
    const s = x / a;
    return a * (s * s * s - 0.5 * s * s * s * s);
  };
  const v = u <= a ? F(u) : u <= 1 - a ? a / 2 + (u - a) : 1 - a - F(1 - u);
  return v / (1 - a);
};
const s6Cam = (t: number): Cam6 => {
  const {cut, near, set} = G_BEATS;
  const L0 = Math.log(FR_CUT.s), L1 = Math.log(FR_GAP.s), L2 = Math.log(FR_END.s);
  let f: Frame6;
  if (t <= cut) {
    const d = t - cut;
    f = {s: FR_CUT.s * Math.exp(FR_V0.ls * d), gx: FR_CUT.gx + FR_V0.gx * d, gy: FR_CUT.gy + FR_V0.gy * d};
  } else if (t < near) {
    f = {
      s: Math.exp(hermSeg(t, cut, near, L0, L1, FR_V0.ls, 0)),
      gx: hermSeg(t, cut, near, FR_CUT.gx, FR_GAP.gx, FR_V0.gx, 0),
      gy: hermSeg(t, cut, near, FR_CUT.gy, FR_GAP.gy, FR_V0.gy, 0),
    };
  } else {
    const e = trapEase((t - near) / (set - near));
    f = {s: Math.exp(lerp(L1, L2, e)), gx: lerp(FR_GAP.gx, FR_END.gx, e), gy: lerp(FR_GAP.gy, FR_END.gy, e)};
  }
  return camOf(f);
};

// ---------------------------------------------------------------- the gill curtain (plane Z = 0, set units)
// the pharynx's tissue around the curtain (its roof and floor where the arches root, and its front wall); open
// beyond the last arch, where the chamber runs on toward the opening
const XS = -2.35; // the set's x shift: the last slit (between arches 3 and 4) is centred on G
/** a fold of tissue whose edge runs along y0 and, past x1, rounds off and curls away (dir -1 up, +1 down) */
const lipLine = (y0: number, x1: number, dir: number, seed: number): P[] => {
  const out: P[] = [];
  for (let j = 0; j <= 44; j++) {
    const x = -6 + XS + j * 0.27;
    if (x > x1) break;
    const xo = x - XS;
    out.push({x, y: y0 + 0.3 * Math.sin(xo * 1.3 + seed) + 0.2 * Math.sin(xo * 0.55 + 1 + seed)});
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
const ROOF: P[] = lipLine(-6.9, 5.4 + XS, -1, 0).map((p) => ({x: p.x, y: p.y - 0.5 * Math.max(0, p.x - XS + 4)}));
const FLOOR: P[] = lipLine(9.6, 5.3 + XS, 1, 2).map((p) => ({x: p.x, y: p.y + 0.35 * Math.max(0, p.x - XS + 3)}));
/** the pharynx's front wall (left of the first arch), top to bottom: a soft bulging lip */
const FRONT: P[] = Array.from({length: 33}, (_, j) => {
  const y = lerp(ROOF[0].y, FLOOR[0].y, j / 32);
  return {x: -6 + XS + 0.55 * Math.sin(Math.PI * (j / 32)) ** 0.6 + 0.18 * Math.sin(j * 0.9), y};
});
const WINDOW: P[] = [...ROOF, {x: 40, y: -40}, {x: 40, y: 40}, ...[...FLOOR].reverse(), ...[...FRONT].reverse().slice(1, -1)];
const ARCH_X = [-3.5, -1.15, 1.15, 3.5].map((x) => x + XS);
/** the two bars either side of the slit the eel threads */
const SL = 2, SR = 3;
const ARCH_N = 170;
/** an arch's centreline: a curved bar, concave toward the front (left), top to bottom */
const archX = (k: number, y: number) => {
  const d = y - 1.2;
  return ARCH_X[k] + (d < 0 ? 0.012 : 0.021) * d * d - 0.003 * d * d * Math.abs(k - 1.5) - 0.03;
};
/** y of a lip line at x (linear in x; past its end the tissue is gone: `beyond`) */
const lipY = (L: P[], x: number, beyond: number) => {
  if (x <= L[0].x) return L[0].y;
  for (let i = 1; i < L.length; i++) if (x <= L[i].x) return lerp(L[i - 1].y, L[i].y, (x - L[i - 1].x) / (L[i].x - L[i - 1].x || 1));
  return beyond;
};
/** each arch runs from inside the roof to inside the floor (its ends root in the tissue) */
const ARCH_SPAN: [number, number][] = [0, 1, 2, 3].map((k) => {
  let y0 = -2, y1 = 4;
  while (y0 > -24 && y0 > lipY(ROOF, archX(k, y0), -40) - 0.7) y0 -= 0.05;
  while (y1 < 24 && y1 < lipY(FLOOR, archX(k, y1), 40) + 0.7) y1 += 0.05;
  return [y0, y1];
});
const archLine = (k: number): P[] => {
  const out: P[] = [];
  const [y0, y1] = ARCH_SPAN[k];
  for (let j = 0; j <= ARCH_N; j++) {
    const y = lerp(y0, y1, j / ARCH_N);
    out.push({x: archX(k, y), y});
  }
  return out;
};
type Disc = {x: number; y: number; r: number};
/** the eel where it crosses the curtain (its samples within ~2 units of the crossing, near Z = 0, as discs in the
 *  plane): the bars beside the slit give way and the rakers and filaments part around them */
const eelDiscs = (pose: Eel3Pose, iX: number): Disc[] => {
  const out: Disc[] = [];
  if (iX < 0) {
    // not through yet: the samples about to enter
    for (let i = N - 6; i <= N; i++) {
      const p = pose.c[i];
      if (Math.abs(p[2]) < 0.6) out.push({x: p[0], y: p[1], r: RADII[i] * (1 - 0.4 * Math.abs(p[2]))});
    }
    return out;
  }
  for (let i = Math.max(0, Math.floor(iX - 5)); i <= Math.min(N, Math.ceil(iX + 5)); i++) {
    const p = pose.c[i];
    if (Math.abs(p[2]) < 0.6) out.push({x: p[0], y: p[1], r: RADII[i] * (1 - 0.4 * Math.abs(p[2]))});
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
type ArchGeo = {bar: string; barSh: string; barHi: string; barRim: string; rakers: string; rakerSh: string; filBack: string; fil: string; filHi: string};
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
  if (discs.length && (k === SR || k === SL)) {
    const sgn = k === SR ? 1 : -1;
    const reach = k === SR ? 0.36 : 0.7; // rakers (left of the right bar) / filaments (right of the left bar)
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
  // the edge facing the opening, where its light catches the bar
  const barRim = dPolyF(C0.slice(6, -6).map((_, j) => at(j + 6, w((j + 6) / (n - 1)) * 0.72)), false);
  // rakers: a comb of short pale teeth along the inner (left) edge, pointing in and a little up; irregularly spaced
  // (2–4 samples), so the comb has no clean period to strobe against the camera's motion
  let rakers = '', rakerSh = '';
  const rakerIdx: number[] = [];
  for (let i = 5 + Math.floor(3 * hash(k * 5.1)); i < n - 5; i += 2 + Math.floor(2.999 * hash(i * 1.37 + k * 11.3))) rakerIdx.push(i);
  for (const i of rakerIdx) {
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
  return {bar, barSh, barHi, barRim, rakers, rakerSh, filBack, fil, filHi};
};
const dPolyF = (ps: P[], close = true) => (ps.length ? 'M' + ps.map((p) => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join('L') + (close ? 'Z' : '') : '');

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
  const edge = dPolyF(ROOF, false) + dPolyF(FLOOR, false) + dPolyF(FRONT, false);
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
const Curtain: React.FC<{c: Cam6; geos: ArchGeo[]; part: 'fil' | 'bars'; lt: Light | null}> = ({c, geos, part, lt}) => {
  if (c.e[2] < 0.35) return null;
  const all = (f: (g: ArchGeo) => string) => geos.map(f).join('');
  // the opening's light on the curtain (the two arches nearest the opening): a gradient about the hot point, in the
  // curtain's own (set) units
  const m = planeM(c, 0);
  const gl = uid('curL');
  const lg = lt && (
    <radialGradient id={gl} gradientUnits="userSpaceOnUse" cx={(lt.H.x - m.tx) / m.s} cy={(lt.H.y - m.ty) / m.s} r={(620 * lt.k) / m.s}>
      <stop offset="0" stopColor={part === 'fil' ? K.filLit : K.barLit} stopOpacity={part === 'fil' ? 0.9 : 1} />
      <stop offset="0.5" stopColor={part === 'fil' ? K.filLit : K.barLit} stopOpacity={part === 'fil' ? 0.4 : 0.55} />
      <stop offset="1" stopColor={part === 'fil' ? K.filLit : K.barLit} stopOpacity={0} />
    </radialGradient>
  );
  if (part === 'fil')
    return (
      <g transform={planeT(c, 0)}>
        {lg && <defs>{lg}</defs>}
        <path d={all((g) => g.filBack)} fill={K.filBack} stroke={INK} strokeWidth={1.6} vectorEffect={NS} strokeLinejoin="round" />
        <path d={all((g) => g.fil)} fill={K.fil} stroke={INK} strokeWidth={1.6} vectorEffect={NS} strokeLinejoin="round" />
        {lg && <path d={geos.slice(-2).map((g) => g.fil).join('')} fill={`url(#${gl})`} />}
        <path d={all((g) => g.filHi)} stroke={K.filHi} strokeWidth={2.2} strokeLinecap="round" fill="none" vectorEffect={NS} />
      </g>
    );
  return (
    <g transform={planeT(c, 0)}>
      {lg && <defs>{lg}</defs>}
      {geos.map((g, i) => (
        <g key={i}>
          <path d={g.bar} fill={K.bar} />
          <path d={g.barSh} fill={K.barSh} />
          <path d={g.barHi} stroke={K.barHi} strokeWidth={3.4} strokeLinecap="round" fill="none" vectorEffect={NS} />
          {lg && i >= geos.length - 2 && <path d={g.barRim} stroke={`url(#${gl})`} strokeWidth={4} strokeLinecap="round" fill="none" vectorEffect={NS} />}
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
/** a dense Catmull-Rom resampling of a polyline (so the opening's curves never show facets) */
const smoothPts = (ps: P[], per = 8): P[] => {
  const out: P[] = [];
  for (let i = 0; i < ps.length - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(ps.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y)});
    }
  }
  out.push(ps[ps.length - 1]);
  return out;
};
/** EDGE extended up and down along the same gentle curve (screen px at the end frame) */
const EDGE_EXT: P[] = (() => {
  const a = EDGE[0], b = EDGE[1], y = EDGE[EDGE.length - 1], z = EDGE[EDGE.length - 2];
  const up: P[] = [];
  let p = a, d = {x: a.x - b.x, y: a.y - b.y};
  for (let k = 0; k < 4; k++) {
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
    const ang = Math.atan2(d.y, d.x) + 0.11;
    d = {x: Math.cos(ang), y: Math.sin(ang)};
    p = {x: p.x + d.x * 135, y: p.y + d.y * 135};
    dn.push(p);
  }
  return smoothPts([...up.reverse(), ...EDGE, ...dn], 10);
})();
/** the rim and the far side of the opening, in the plane Z_B (set units) */
const RIM_B: P[] = EDGE_EXT.map((q) => fromPlane(CAM_END, Z_B, q));
const FAR_B: P[] = (() => {
  // the opening's other side (the body wall behind the cover): roughly parallel, a few units further back (right),
  // closing on the rim at both ends. Wide enough that the water beyond reads through it as a view, not a stripe
  const n = RIM_B.length;
  return RIM_B.map((p, i) => {
    const u = i / (n - 1);
    const wv = (3.3 + 0.3 * Math.sin(u * 9.5 + 0.6)) * Math.sin(Math.PI * clamp((u - 0.02) / 0.96)) ** 1.1;
    return {x: p.x + wv, y: p.y + 0.5 * Math.sin(Math.PI * u)};
  });
})();

/** the opening's top never reaches the caption band: it closes to a point on the rim at this screen line */
const Y_OPEN = 545;
/** the slit's taper below its point (end-frame px; scaled with the cover's plane as the camera moves) */
const TAPER = 330;
/** the gap breathes (the cover's slow pumping) and opens a little wider as the tail pushes toward it; only its far
 *  side moves, so the rim stays on EDGE */
const gapWiden = (t: number) => 1 + 0.045 * Math.sin((2 * Math.PI * (t - 10.4)) / 1.55) + 0.08 * ss(t, 12.0, 12.58);
/** the opening on screen for this camera: the rim (the cover's free edge, on EDGE at the end) and the far side (the
 *  body wall). It is a true slit: the far side converges on the rim to a point at Y_OPEN (where the cover meets the
 *  body), so it never shows an end cap; below, it runs out of the frame */
const openingScr = (c: Cam6, t: number) => {
  const wd = gapWiden(t);
  const kq = planeM(c, Z_B).s / planeM(CAM_END, Z_B).s;
  const rimA = RIM_B.map((p) => toPlane(c, Z_B, p));
  const farA = FAR_B.map((p, i) => toPlane(c, Z_B, {x: RIM_B[i].x + (p.x - RIM_B[i].x) * wd, y: RIM_B[i].y + (p.y - RIM_B[i].y) * wd}));
  const i0 = rimA.findIndex((p) => p.y >= Y_OPEN);
  if (i0 < 0 || rimA[0].y > H) return null;
  const rim: P[] = [], far: P[] = [];
  if (i0 > 0) {
    const a = rimA[i0 - 1], b = rimA[i0], u = (Y_OPEN - a.y) / (b.y - a.y || 1);
    rim.push({x: lerp(a.x, b.x, u), y: Y_OPEN});
  }
  for (let i = i0; i < rimA.length; i++) {
    const r = rimA[i], f = farA[i];
    const tau = Math.sin(0.5 * Math.PI * clamp((r.y - Y_OPEN) / (TAPER * kq))) ** 0.85;
    rim.push(r);
    far.push({x: lerp(r.x, f.x, tau), y: lerp(r.y, f.y, tau)});
  }
  if (rim.length < 2 || far.length < 2) return null;
  const poly = [...rim, ...[...far].reverse()];
  return {rim, far, poly};
};

// ---------------------------------------------------------------- the light through the opening
// Everything the opening does to the shot is authored in END-FRAME px ("Q": the screen at the settled end camera)
// and carried to the current camera by the uniform map of its plane: the opening, its glow and the light shafts
// entering the chamber on the cover's plane Z_B; the outside view on a far plane Z_OUT (it slides less than the rim
// as the camera moves: a real view through a gap, with depth).
type QMap = {k: number; tx: number; ty: number};
const qMap = (c: Cam6, z0: number): QMap => {
  const m = planeM(c, z0), m0 = planeM(CAM_END, z0), k = m.s / m0.s;
  return {k, tx: m.tx - k * m0.tx, ty: m.ty - k * m0.ty};
};
const qPt = (q: QMap, p: P): P => ({x: q.k * p.x + q.tx, y: q.k * p.y + q.ty});
const qT = (q: QMap) => `matrix(${q.k.toFixed(5)} 0 0 ${q.k.toFixed(5)} ${q.tx.toFixed(2)} ${q.ty.toFixed(2)})`;
/** the outside view's plane: well beyond the opening */
const Z_OUT = Z_B - 10;
/** where the light is hottest: just beyond the rim, where the tip goes out (Q) */
const HOT_Q: P = {x: POKE_AT.x + 55, y: POKE_AT.y - 30};
/** the slit's tilt: its long axis against the screen's vertical (Q), for the elongated glows */
const SLIT_DEG = (Math.atan2(-(EDGE[EDGE.length - 1].x - EDGE[0].x), EDGE[EDGE.length - 1].y - EDGE[0].y) * 180) / Math.PI;
type Light = {H: P; k: number};
const lightOf = (c: Cam6): Light => {
  const q = qMap(c, Z_B);
  return {H: qPt(q, HOT_Q), k: q.k};
};
/** an elliptical radial gradient along the slit, centred at H (rx across, ry along; screen px) */
const slitGlowT = (H: P, rx: number, ry: number) => `translate(${H.x.toFixed(1)} ${H.y.toFixed(1)}) rotate(${SLIT_DEG.toFixed(2)}) scale(${rx.toFixed(1)} ${ry.toFixed(1)})`;
/** the rim's x at a Q-space height (EDGE_EXT runs top -> bottom; its upper half is monotone in y) */
const rimAtY = (y: number): P => {
  let best = EDGE_EXT[0], bd = 1e9;
  for (const p of EDGE_EXT) if (Math.abs(p.y - y) < bd && p.y < 1700) { bd = Math.abs(p.y - y); best = p; }
  return best;
};

// the outside: open water, brightest toward the surface (top), light shafts, a hazy riverbed with a few low tufts of
// plants far off, motes drifting in the current (Q px)
const O = {
  sky: lit(C.waterTop, 0.66), // toward the surface: near white
  hi: lit(C.waterTop, 0.36),
  mid: lit(C.waterTop, 0.12),
  low: mix(C.waterTop, C.waterMid, 0.5),
  far: mix(C.waterTop, C.haze, 0.6),
  bedFar: mix(C.haze, C.sand, 0.4),
  bedNear: mix(C.sand, C.haze, 0.42),
  pebble: mix(mix(C.pebbleA, C.haze, 0.45), C.sand, 0.2),
  tuft: mix(mix(C.fin, C.waterMid, 0.56), C.haze, 0.3), // the reeds' mid tone, hazed by distance
  blade: mix(mix(C.fin, C.waterDeep, 0.7), C.haze, 0.08), // backlit: nearly a silhouette against the bright water
  bladeLit: mix(mix(C.fin, C.waterTop, 0.5), C.haze, 0.1),
  mote: C.mote,
};
const HORIZON = 1490;
const TUFTS: {x: number; n: number; h: number; s: number}[] = [
  {x: 470, n: 4, h: 170, s: 0.4},
  {x: 590, n: 5, h: 230, s: 2.1},
  {x: 705, n: 6, h: 420, s: 3.7},
  {x: 840, n: 5, h: 380, s: 5.3},
];
const tuftD = (t: number) => {
  let d = '';
  for (const tf of TUFTS) {
    for (let b = 0; b < tf.n; b++) {
      const hb = tf.h * (0.6 + 0.4 * hash(tf.s * 7 + b * 3.3));
      const x0 = tf.x + (b - (tf.n - 1) / 2) * 9, y0 = HORIZON + 45 + 25 * hash(tf.s + b);
      const lean = (b - (tf.n - 1) / 2) * 0.22 + 0.15;
      const sway = 0.12 * Math.sin(1.3 * t + tf.s + b * 0.9);
      const L: P[] = [], R: P[] = [];
      for (let j = 0; j <= 8; j++) {
        const s = j / 8;
        const a = lean * s + sway * s * s;
        const x = x0 + hb * (Math.sin(a) * s), y = y0 - hb * s;
        const w = 8 * (1 - s) ** 0.8 + 0.5;
        L.push({x: x - w, y});
        R.push({x: x + w, y});
      }
      d += dPoly([...L, ...R.reverse()]);
    }
  }
  return d;
};
/** a few tall ribbon blades nearer than the tufts, bent over in the current (+x), so they cross the slit and run on
 *  behind both its edges (a scene beyond the gap, not a picture on a shape): base, two controls, tip (Q px), width */
const BLADES: {p: [number, number][]; w: number; s: number}[] = [
  {p: [[280, 1580], [268, 1000], [345, 715], [640, 600]], w: 26, s: 0.3},
  {p: [[380, 1585], [372, 1120], [440, 845], [860, 755]], w: 30, s: 1.7},
  {p: [[590, 1575], [588, 1360], [625, 1215], [885, 1120]], w: 28, s: 3.1},
  {p: [[665, 1580], [668, 1400], [712, 1265], [940, 1200]], w: 24, s: 4.4},
  // (where the slit looks while the camera is still out by the arches, Q x ~540-860: tall blades standing through
  // the whole of it; none where the tip goes out at the end, Q ~(520-650, 880-1100), which stays bright)
  {p: [[690, 1650], [688, 1300], [700, 1020], [770, 800]], w: 32, s: 5.6},
  {p: [[790, 1655], [792, 1350], [805, 1100], [880, 900]], w: 28, s: 6.9},
  {p: [[610, 1660], [606, 1450], [612, 1300], [660, 1180]], w: 24, s: 8.2},
  {p: [[728, 1660], [726, 1350], [730, 1050], [760, 760]], w: 18, s: 9.4},
  {p: [[818, 1665], [820, 1380], [826, 1100], [850, 820]], w: 20, s: 10.6},
  {p: [[862, 1660], [860, 1420], [868, 1200], [900, 980]], w: 16, s: 11.9},
  {p: [[762, 1670], [764, 1500], [772, 1330], [800, 1150]], w: 22, s: 13.1},
];
const bladeD = (t: number, lit = false) => {
  let d = '';
  for (const b of BLADES) {
    const sw = 18 * Math.sin(1.1 * t + b.s) + 8 * Math.sin(2.3 * t + 2 * b.s);
    const [p0, p1, p2, p3] = b.p.map(([x, y], j) => ({x: x + (j / 3) ** 1.5 * sw, y: y - (j / 3) ** 2 * 0.4 * sw}));
    const L: P[] = [], R: P[] = [];
    const n = 18;
    for (let j = 0; j <= n; j++) {
      const u = j / n, v = 1 - u;
      const x = v * v * v * p0.x + 3 * v * v * u * p1.x + 3 * v * u * u * p2.x + u * u * u * p3.x;
      const y = v * v * v * p0.y + 3 * v * v * u * p1.y + 3 * v * u * u * p2.y + u * u * u * p3.y;
      const dx = 3 * v * v * (p1.x - p0.x) + 6 * v * u * (p2.x - p1.x) + 3 * u * u * (p3.x - p2.x);
      const dy = 3 * v * v * (p1.y - p0.y) + 6 * v * u * (p2.y - p1.y) + 3 * u * u * (p3.y - p2.y);
      const l = Math.hypot(dx, dy) || 1;
      const w = 0.5 * b.w * (1 - u) ** 0.7 + 0.6;
      // (R is the edge toward the upper left, the light: with `lit` only a strip along it, its lit edge)
      L.push(lit ? {x: x + (dy / l) * w * 0.35, y: y - (dx / l) * w * 0.35} : {x: x - (dy / l) * w, y: y + (dx / l) * w});
      R.push({x: x + (dy / l) * w, y: y - (dx / l) * w});
    }
    d += dPoly([...L, ...R.reverse()]);
  }
  return d;
};
/** the water's surface far above, seen from below: a bright band with a slow net of ripples (Q px) */
const SURF_Y = 760;
const surfD = (t: number) => {
  const lines: string[] = [];
  for (let j = 0; j < 5; j++) {
    const y0 = SURF_Y - 40 - j * 38;
    const pts: P[] = [];
    for (let x = 100; x <= 1100; x += 25) pts.push({x, y: y0 + 7 * Math.sin(0.021 * x + 1.4 * t + j * 1.9) + 4 * Math.sin(0.047 * x - 0.9 * t + j)});
    lines.push(dPoly(pts, false));
  }
  return lines.join('');
};
const OutsideView: React.FC<{c: Cam6; t: number}> = ({c, t}) => {
  const gW = uid('owat'), gS = uid('osun'), gB = uid('obed'), gH = uid('ohaze'), gF = uid('oshaft'), gU = uid('osurf');
  // light shafts slanting down from the upper left, shimmering
  const shafts: {d: string; o: number}[] = [];
  for (let i = 0; i < 7; i++) {
    const x0 = 430 + i * 110 + 22 * Math.sin(0.33 * t + 1.7 * i) + 30 * hash(i * 4.1);
    const w0 = 14 + 22 * hash(i * 2.3), w1 = w0 * 2.4;
    const y0 = SURF_Y - 60, y1 = HORIZON, sl = -0.3;
    const x1 = x0 + sl * (y1 - y0);
    shafts.push({d: dPoly([{x: x0 - w0, y: y0}, {x: x0 + w0, y: y0}, {x: x1 + w1, y: y1}, {x: x1 - w1, y: y1}]), o: 0.62 * (0.6 + 0.4 * noise1(0.45 * t + i * 3.1, 7))});
  }
  // motes drifting with the current (fading in and out at the ends of their run: no pops)
  const motes: string[] = [];
  const mOp: number[] = [];
  for (let i = 0; i < 26; i++) {
    const u = (hash(i * 1.7) + 0.03 * t) % 1;
    const x = 300 + 600 * u, y = 600 + 1150 * hash(i * 5.3) + 9 * Math.sin(0.8 * t + i);
    const r = 2.6 + 2.8 * hash(i * 9.1);
    motes.push(`M${(x - r).toFixed(1)},${y.toFixed(1)}a${r.toFixed(1)},${r.toFixed(1)} 0 1,0 ${(2 * r).toFixed(1)},0a${r.toFixed(1)},${r.toFixed(1)} 0 1,0 ${(-2 * r).toFixed(1)},0Z`);
    mOp.push(0.85 * ss(u, 0, 0.1) * (1 - ss(u, 0.9, 1)));
  }
  const pebbles = [
    [430, 1585, 16, 6], [560, 1552, 11, 4], [690, 1610, 19, 7], [520, 1680, 22, 8], [760, 1540, 10, 4], [610, 1760, 26, 9], [380, 1740, 20, 7], [470, 1860, 30, 10],
  ];
  return (
    <g transform={qT(qMap(c, Z_OUT))}>
      <defs>
        <linearGradient id={gW} gradientUnits="userSpaceOnUse" x1={0} y1={SURF_Y - 120} x2={0} y2={HORIZON}>
          <stop offset="0" stopColor={O.sky} />
          <stop offset="0.16" stopColor={O.hi} />
          <stop offset="0.5" stopColor={O.mid} />
          <stop offset="0.84" stopColor={O.low} />
          <stop offset="1" stopColor={O.far} />
        </linearGradient>
        <radialGradient id={gS} gradientUnits="userSpaceOnUse" cx={470} cy={SURF_Y - 140} r={520}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.6} />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.18} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={gB} gradientUnits="userSpaceOnUse" x1={0} y1={HORIZON} x2={0} y2={2150}>
          <stop offset="0" stopColor={O.bedFar} />
          <stop offset="1" stopColor={O.bedNear} />
        </linearGradient>
        <linearGradient id={gH} gradientUnits="userSpaceOnUse" x1={0} y1={HORIZON - 120} x2={0} y2={HORIZON + 90}>
          <stop offset="0" stopColor={O.far} stopOpacity={0} />
          <stop offset="0.55" stopColor={O.far} stopOpacity={0.75} />
          <stop offset="1" stopColor={O.far} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={gF} gradientUnits="userSpaceOnUse" x1={0} y1={SURF_Y - 60} x2={0} y2={HORIZON}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={gU} gradientUnits="userSpaceOnUse" x1={0} y1={SURF_Y - 240} x2={0} y2={SURF_Y}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.85} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.15} />
        </linearGradient>
      </defs>
      <rect x={-1500} y={-1500} width={4500} height={HORIZON + 1500} fill={`url(#${gW})`} />
      {/* the surface far above: its bright underside, rippling */}
      <path d={surfD(t)} stroke={`url(#${gU})`} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d={`M-1500 ${HORIZON}C0 ${HORIZON - 14} 600 ${HORIZON + 12} 3000 ${HORIZON - 6}L3000 4000L-1500 4000Z`} fill={`url(#${gB})`} />
      {pebbles.map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={O.pebble} fillOpacity={0.7} />
      ))}
      <path d={tuftD(t)} fill={O.tuft} />
      <rect x={-1500} y={HORIZON - 120} width={4500} height={210} fill={`url(#${gH})`} />
      {shafts.map((s, i) => (
        <path key={i} d={s.d} fill={`url(#${gF})`} opacity={s.o} />
      ))}
      {/* the nearer blades, over the shafts (hazed a little less than the tufts) */}
      <path d={bladeD(t)} fill={O.blade} />
      <path d={bladeD(t, true)} fill={O.bladeLit} />
      <rect x={-1500} y={-1500} width={4500} height={4500} fill={`url(#${gS})`} />
      {motes.map((d, i) => (
        <path key={i} d={d} fill={O.mote} fillOpacity={mOp[i]} />
      ))}
    </g>
  );
};

/** the shafts of light that come IN through the opening and fan across the chamber (Q px on the cover's plane):
 *  [height on the rim, its width there, turn (rad) from the tip's reverse travel, length, strength] */
const BEAMS: [number, number, number, number, number][] = [
  [700, 70, -0.34, 700, 0.75],
  [850, 105, -0.15, 880, 1],
  [1035, 90, 0.0, 820, 0.95],
  [1215, 120, 0.15, 760, 0.75],
  [1420, 90, 0.3, 600, 0.55],
];
/** how open the slit is at a screen height (0 at its point, 1 below its taper), for the light through it */
const slitOpen = (y: number, kq: number) => Math.sin(0.5 * Math.PI * clamp((y - Y_OPEN) / (TAPER * kq))) ** 0.85;
const beamGeo = (t: number, q: QMap) =>
  BEAMS.map(([y0, h, a, L, o], i) => {
    const y = Math.max(y0, (Y_OPEN - q.ty) / q.k + 25);
    const p1 = rimAtY(y), p2 = rimAtY(y + h);
    const b = Math.atan2(-POKE_DIR.y, -POKE_DIR.x) + a;
    const d = {x: Math.cos(b), y: Math.sin(b)}, n = {x: -d.y, y: d.x};
    const spread = 0.16 * L;
    const q1 = {x: p1.x + d.x * L - n.x * spread, y: p1.y + d.y * L - n.y * spread};
    const q2 = {x: p2.x + d.x * L + n.x * spread, y: p2.y + d.y * L + n.y * spread};
    const m0 = {x: 0.5 * (p1.x + p2.x), y: 0.5 * (p1.y + p2.y)};
    // a shaft is as strong as the slit is open where it enters
    const open = slitOpen(q.k * (y + 0.5 * h) + q.ty, q.k);
    return {poly: [p1, p2, q2, q1], m0, m1: {x: m0.x + d.x * L, y: m0.y + d.y * L}, d, n, h, L, o: open * o * (0.75 + 0.25 * noise1(0.6 * t + i * 2.7, 3))};
  });

/** the screen box round some points, grown by m: kept below FADE0 (nothing lit near the caption band) and within a
 *  margin of the frame, so a blur never runs over a big off-screen area */
type Box = {x: number; y: number; w: number; h: number};
const boxOf = (ps: P[], m: number): Box => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of ps) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  x0 = Math.max(-m, x0 - m);
  y0 = Math.max(FADE0, y0 - m);
  x1 = Math.min(W + m, x1 + m);
  y1 = Math.min(H + m, y1 + m);
  return {x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0)};
};
/** a Gaussian blur over an explicit screen region (never the full frame) */
const BlurF: React.FC<{id: string; sd: number; b: Box}> = ({id, sd, b}) => (
  <filter id={id} filterUnits="userSpaceOnUse" x={b.x.toFixed(0)} y={b.y.toFixed(0)} width={b.w.toFixed(0)} height={b.h.toFixed(0)} colorInterpolationFilters="sRGB">
    <feGaussianBlur stdDeviation={sd.toFixed(2)} />
  </filter>
);
/** where the tail goes out (screen): just beyond POKE_AT, where the gap is widest and the light hottest */
const exitScr = (c: Cam6): P => qPt(qMap(c, Z_B), {x: POKE_AT.x + 10 * POKE_DIR.x, y: POKE_AT.y + 10 * POKE_DIR.y});
/** a second place, lower down, where the light wraps over the cover's edge (Q: on the rim, where a shaft enters) */
const WRAP2_Q: P = (() => {
  const p = EDGE_EXT.reduce((b, q) => (Math.abs(q.y - 1330) < Math.abs(b.y - 1330) ? q : b));
  return {x: p.x + 4, y: p.y};
})();

/** the cover's free edge as a flap in silhouette against the light: a dark band on its chamber side, crisp along the
 *  rim itself, tapering into the slit's point at the top; where the tail goes out the light spills over it (the flap
 *  thins to a hair there, under the glare), so it is never one unbroken outline. `thin` (0..1) scales it: while the
 *  camera is still out by the arches the edge is only a hairline under the light spilling over it (a dark band round
 *  a small crescent of light read as a claw); it firms up as the camera settles on the opening */
const flapOf = (op: NonNullable<ReturnType<typeof openingScr>>, k: number, X: P, X2: P, thin = 1) => {
  const line = op.rim;
  const n = line.length;
  const arc = [0];
  for (let i = 1; i < n; i++) arc.push(arc[i - 1] + Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y));
  const off = (f: (i: number) => number) =>
    line.map((p, i) => {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)];
      const tx = b.x - a.x, ty = b.y - a.y, l = Math.hypot(tx, ty) || 1;
      const w = f(i);
      return {x: p.x - (ty / l) * w, y: p.y + (tx / l) * w};
    });
  const wAt = (i: number) => {
    const p = line[i];
    const u = arc[i] / (1300 * k);
    const spill = Math.max(Math.exp(-((Math.hypot(p.x - X.x, p.y - X.y) / (210 * k)) ** 2)), 0.75 * Math.exp(-((Math.hypot(p.x - X2.x, p.y - X2.y) / (120 * k)) ** 2)));
    return thin * k * (2 + 5 * Math.sin(Math.PI * clamp(u * 1.15)) ** 0.7 + 1.5 * Math.sin(arc[i] / (120 * k) + 1.3) ** 2) * ss(arc[i], 0, 120 * k) * (1 - 0.9 * spill);
  };
  const inner = off(wAt), wide = off((i) => 2.4 * wAt(i) + 3 * thin * k * ss(arc[i], 0, 120 * k));
  return {band: dPoly([...line, ...[...inner].reverse()]), wide: dPoly([...line, ...[...wide].reverse()])};
};
/** the cover's inner face (the chamber's outer wall), the light it catches round the opening, the shafts of light
 *  entering, the opening's edges in silhouette and the outside view through it */
const ChamberWall: React.FC<{c: Cam6; t: number}> = ({c, t}) => {
  const gG = uid('chG'), gL = uid('chL'), fS = uid('chS'), cw = uid('chWin');
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
  const op = openingScr(c, t);
  const q = qMap(c, Z_B);
  const {k} = lightOf(c);
  const X = exitScr(c);
  // the light on the cover's inner face sits on the chamber side of the slit (the light goes IN)
  const wallHot = qPt(q, {x: POKE_AT.x - 45, y: POKE_AT.y + 25});
  const beams = beamGeo(t, q);
  const bIds = beams.map(() => uid('chB'));
  // motes carried in on the shafts of light (drifting inward, fading at both ends of their run)
  const motes: {p: P; r: number; o: number}[] = [];
  for (let i = 0; i < 14; i++) {
    const b = beams[i % beams.length];
    const u = (hash(i * 3.7) + 0.075 * t) % 1;
    const off = (hash(i * 1.3) - 0.5) * b.h * (1 + 1.2 * u);
    const p = {x: b.m0.x + b.d.x * u * b.L * 0.75 + b.n.x * off, y: b.m0.y + b.d.y * u * b.L * 0.75 + b.n.y * off};
    motes.push({p: qPt(q, p), r: (2.4 + 2.2 * hash(i * 8.3)) * k, o: 0.75 * Math.sin(Math.PI * u) * b.o});
  }
  const outline = op ? dPoly(op.poly) : '';
  const X2 = qPt(q, WRAP2_Q);
  // the edge firms up as the camera settles on the opening (see flapOf); until then the light spills over it
  const crisp = ss(t, 11.75, 12.25);
  const flap = op ? flapOf(op, k, X, X2, lerp(0.3, 1, crisp)) : null;
  const rimD = op ? dPoly(op.rim, false) : '';
  const spill = lerp(1, 0.3, crisp);
  const gW2 = uid('chW2');
  const sS = 7 * k;
  // the glare flooding out past the far side (the body wall has no edge of its own): a chain of soft round glows
  // along it, overlapping (smooth, no rings), none at the slit's point, strongest toward the hot point
  // the glare flooding out past the far side, as chains of soft round glows along it: wide ones under the view (the
  // halo on the body wall) and small ones on the edge itself, over the view, so the far side is lost in the light
  // (no edge, no ring, none at the slit's point, strongest toward the hot point)
  type Blob = {x: number; y: number; r: number; o: number};
  const chain = (rB: number, step: number, out: number, o0: number): Blob[] => {
    const res: Blob[] = [];
    if (!op) return res;
    const f = op.far;
    let acc = 0, next = 0.3 * rB;
    for (let i = 1; i < f.length; i++) {
      const dx = f[i].x - f[i - 1].x, dy = f[i].y - f[i - 1].y, l = Math.hypot(dx, dy) || 1;
      acc += l;
      if (acc < next) continue;
      next += step * rB;
      const p = {x: f[i].x + (dy / l) * out * rB, y: f[i].y - (dx / l) * out * rB};
      if (p.y - rB > H || p.x - rB > W) continue;
      const open = slitOpen(f[i].y, k);
      const near = Math.exp(-((Math.hypot(p.x - X.x, p.y - X.y) / (520 * k)) ** 2));
      // (never reaching above FADE0: nothing lit near the caption band)
      res.push({...p, r: Math.min(rB * (0.7 + 0.3 * open), p.y - FADE0), o: o0 * open * (0.55 + 0.45 * near)});
    }
    return res;
  };
  const blobs = chain(125 * k, 0.5, 0.2, 0.42).filter((b) => b.o > 0.004 && b.r > 1);
  const edgeBlobs = chain(46 * k, 0.45, 0, 0.38).filter((b) => b.o > 0.004 && b.r > 1);
  const gBw = uid('chFg'), gBe = uid('chFe');
  return (
    <g>
      <defs>
        <radialGradient id={gG} gradientUnits="userSpaceOnUse" cx={rimMid.x} cy={rimMid.y} r={14}>
          <stop offset="0" stopColor={K.chamberWarm} />
          <stop offset="0.45" stopColor={K.chamber} />
          <stop offset="1" stopColor={K.chamberDeep} />
        </radialGradient>
        {/* the light on the cover's inner face beside the slit: hot near it, then the warm glow of lit flesh, fading
            into the chamber's dark */}
        <radialGradient id={gL} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1} gradientTransform={slitGlowT(wallHot, 430 * k, 900 * k)}>
          <stop offset="0" stopColor={K.glowHot} stopOpacity={0.85} />
          <stop offset="0.22" stopColor={K.glow} stopOpacity={0.6} />
          <stop offset="0.45" stopColor={K.glowWarm} stopOpacity={0.3} />
          <stop offset="0.72" stopColor={K.chamberWarm} stopOpacity={0.16} />
          <stop offset="1" stopColor={K.chamberWarm} stopOpacity={0} />
        </radialGradient>
        {beams.map((b, i) => {
          const a = qPt(q, b.m0), z = qPt(q, b.m1);
          return (
            <linearGradient key={i} id={bIds[i]} gradientUnits="userSpaceOnUse" x1={a.x} y1={a.y} x2={z.x} y2={z.y}>
              <stop offset="0" stopColor={K.beam} stopOpacity={0.34} />
              <stop offset="0.35" stopColor={K.beam} stopOpacity={0.12} />
              <stop offset="1" stopColor={K.beam} stopOpacity={0} />
            </linearGradient>
          );
        })}
        <radialGradient id={gW2} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0" stopColor={K.wrap} stopOpacity={0.6} />
          <stop offset="0.35" stopColor={K.wrap} stopOpacity={0.36} />
          <stop offset="0.7" stopColor={K.wrap} stopOpacity={0.1} />
          <stop offset="1" stopColor={K.wrap} stopOpacity={0} />
        </radialGradient>
        {/* one gradient per chain, on each glow's own box; each glow's strength is its opacity */}
        <radialGradient id={gBe}>
          <stop offset="0" stopColor={K.wrap} stopOpacity={1} />
          <stop offset="0.45" stopColor={K.wrap} stopOpacity={0.5} />
          <stop offset="1" stopColor={K.wrap} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={gBw}>
          <stop offset="0" stopColor={K.wrap} stopOpacity={1} />
          <stop offset="0.3" stopColor={K.wrap} stopOpacity={0.62} />
          <stop offset="0.62" stopColor={K.glowHot} stopOpacity={0.2} />
          <stop offset="1" stopColor={K.glowHot} stopOpacity={0} />
        </radialGradient>
        {op && <BlurF id={fS} sd={sS} b={boxOf(op.rim, 3 * sS + 30 * k)} />}
        {op && (
          <clipPath id={cw} clipPathUnits="userSpaceOnUse">
            <path d={outline} />
          </clipPath>
        )}
      </defs>
      <g transform={planeT(c, Z_B)}>
        <rect x={-60} y={-60} width={120} height={120} fill={`url(#${gG})`} />
        <path d={folds.join('')} stroke={K.chamberFold} strokeWidth={5} strokeOpacity={0.55} fill="none" vectorEffect={NS} />
      </g>
      {op && (
        <g>
          <TopFaded>
            <rect x={0} y={FADE0} width={W} height={H - FADE0} fill={`url(#${gL})`} />
          </TopFaded>
          {/* the shafts of light coming in through the slit (a soft outer and a brighter inner layer each) */}
          {beams.map((b, i) => {
            const core = [b.poly[0], b.poly[1], {x: lerp(b.poly[1].x, b.poly[2].x, 0.8) - b.n.x * 0.06 * b.L, y: lerp(b.poly[1].y, b.poly[2].y, 0.8) - b.n.y * 0.06 * b.L}, {x: lerp(b.poly[0].x, b.poly[3].x, 0.8) + b.n.x * 0.06 * b.L, y: lerp(b.poly[0].y, b.poly[3].y, 0.8) + b.n.y * 0.06 * b.L}];
            return (
              <g key={i} opacity={b.o}>
                <path d={dPoly(b.poly.map((p) => qPt(q, p)))} fill={`url(#${bIds[i]})`} opacity={0.6} />
                <path d={dPoly(core.map((p) => qPt(q, p)))} fill={`url(#${bIds[i]})`} />
              </g>
            );
          })}
          {blobs.map((b, i) => (
            <circle key={i} cx={b.x.toFixed(1)} cy={b.y.toFixed(1)} r={b.r.toFixed(1)} fill={`url(#${gBw})`} opacity={b.o.toFixed(3)} />
          ))}
          {/* the cover's edge: its soft shadow on the chamber side */}
          {flap && <path d={flap.wide} fill={K.flap} filter={`url(#${fS})`} opacity={lerp(0.4, 0.75, crisp)} />}
          {/* the outside, seen through the slit */}
          <g clipPath={`url(#${cw})`}>
            <OutsideView c={c} t={t} />
          </g>
          {edgeBlobs.map((b, i) => (
            <circle key={i} cx={b.x.toFixed(1)} cy={b.y.toFixed(1)} r={b.r.toFixed(1)} fill={`url(#${gBe})`} opacity={b.o.toFixed(3)} />
          ))}

          {/* the cover's free edge in silhouette against the light */}
          {flap && <path d={flap.band} fill={K.flap} />}
          {/* daylight spilling over the cover's edge onto both sides of it: a soft band, no hard line (ten faint
              nested strokes; a blur filter over the rim's box cost a third of a second a frame) */}
          <TopFaded>
            {SPILL_W.map((w, i) => (
              <path key={i} d={rimD} stroke={K.wrap} strokeOpacity={0.052 * spill} strokeWidth={w * k} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            ))}
          </TopFaded>
          {/* the light wrapping over the cover's edge lower down, where a shaft comes in */}
          <ellipse cx={0} cy={0} rx={1} ry={1} transform={slitGlowT(X2, 55 * k, 120 * k)} fill={`url(#${gW2})`} />
          {motes.map((m, i) => (
            <circle key={i} cx={m.p.x.toFixed(1)} cy={m.p.y.toFixed(1)} r={m.r.toFixed(2)} fill={K.wrap} fillOpacity={m.o} />
          ))}
        </g>
      )}
    </g>
  );
};
/** the widths (end-frame px) of the nested strokes of the light spilling over the rim: a smooth falloff to ~45 px */
const SPILL_W = Array.from({length: 10}, (_, i) => 6 + 84 * ((i + 1) / 10) ** 1.5);
/** the opening's glows fade out toward the caption band: nothing is lit above FADE0 */
const FADE0 = Y_OPEN - 65, FADE1 = Y_OPEN + 255;
/** children in full below FADE1, and faded out between FADE1 and FADE0 above it: a mask over that band only (a
 *  full-frame mask doubled the frame's render time) */
const TopFaded: React.FC<{children: React.ReactNode}> = ({children}) => {
  const m = uid('tf'), g = uid('tfg'), cl = uid('tfc');
  return (
    <g>
      <defs>
        <linearGradient id={g} gradientUnits="userSpaceOnUse" x1={0} y1={FADE0} x2={0} y2={FADE1}>
          <stop offset="0" stopColor="#000" />
          <stop offset="0.2" stopColor="#1A1A1A" />
          <stop offset="0.45" stopColor="#707070" />
          <stop offset="0.72" stopColor="#C8C8C8" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <mask id={m} maskUnits="userSpaceOnUse" x={-50} y={FADE0} width={W + 100} height={FADE1 - FADE0}>
          <rect x={-50} y={FADE0} width={W + 100} height={FADE1 - FADE0} fill={`url(#${g})`} />
        </mask>
        <clipPath id={cl} clipPathUnits="userSpaceOnUse">
          <rect x={-50} y={FADE1} width={W + 100} height={H} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${cl})`}>{children}</g>
      <g mask={`url(#${m})`}>{children}</g>
    </g>
  );
};
/** the glare of the opening over everything round it (drawn over the arches, the bars and the eel's far part): soft,
 *  no edge. Where the tail goes out it is hottest, and brightens as the tip comes: the tip runs INTO it (its last few
 *  px are washed out in the light, its drawn shape unchanged) */
const OpeningBloom: React.FC<{c: Cam6; t: number}> = ({c, t}) => {
  const op = openingScr(c, t);
  if (!op) return null;
  const {H: hot, k} = lightOf(c);
  const g = uid('bloom'), gx = uid('blX'), gy = uid('blY');
  const X = exitScr(c);
  // (as the tip goes through, T.poke on, its core eases so the tip reads as a dark point inside the light rather
  // than lost in it; the film holds this inside view until T.pokeCut)
  const amp = (0.45 + 0.55 * ss(t, 12.2, 12.567)) * (1 - 0.45 * ss(t, T.poke - 0.03, T.poke + 0.08));
  const R = (110 + 50 * ss(t, 12.2, 12.567)) * k;
  return (
    <g>
      <defs>
        <radialGradient id={g} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1} gradientTransform={slitGlowT(hot, 210 * k, 520 * k)}>
          <stop offset="0" stopColor={K.wrap} stopOpacity={0.34} />
          <stop offset="0.35" stopColor={K.wrap} stopOpacity={0.16} />
          <stop offset="0.7" stopColor={K.glowHot} stopOpacity={0.05} />
          <stop offset="1" stopColor={K.glowHot} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={gx} gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.94 * amp} />
          <stop offset="0.16" stopColor="#FFFFFF" stopOpacity={0.86 * amp} />
          <stop offset="0.34" stopColor={K.wrap} stopOpacity={0.66 * amp} />
          <stop offset="0.58" stopColor={K.wrap} stopOpacity={0.3 * amp} />
          <stop offset="0.8" stopColor={K.wrap} stopOpacity={0.09 * amp} />
          <stop offset="1" stopColor={K.wrap} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={gy} gradientUnits="userSpaceOnUse" cx={X.x} cy={X.y} r={2.6 * R}>
          <stop offset="0" stopColor={K.wrap} stopOpacity={0.3 * amp} />
          <stop offset="0.4" stopColor={K.wrap} stopOpacity={0.1 * amp} />
          <stop offset="1" stopColor={K.wrap} stopOpacity={0} />
        </radialGradient>
      </defs>
      <TopFaded>
        <rect x={0} y={FADE0} width={W} height={H - FADE0} fill={`url(#${g})`} />
        <circle cx={X.x} cy={X.y} r={2.6 * R} fill={`url(#${gy})`} />
        <ellipse cx={0} cy={0} rx={1} ry={1} transform={slitGlowT(X, 0.85 * R, 1.5 * R)} fill={`url(#${gx})`} />
      </TopFaded>
    </g>
  );
};

// ---------------------------------------------------------------- the S6 state (shared by the view and keepOut)
const s6State = (t: number) => {
  const c = s6Cam(t);
  const B = cam6B(c);
  const pose = s6Pose(t);
  // hand-off 2: the last 8 units onto the contract, blended in before POKE0 (and held after). The blend is done IN
  // THE SET: pokeTail(t) is lifted into the set through the end camera (at the depths the route has there), so the
  // tail never slides against the bars while the camera settles; from POKE0 on (camera settled) its projection is
  // exactly pokeTail(t)
  const w = ss(t, POKE0 - 0.2, POKE0);
  const pk = w > 0 ? pokeTail(t) : null;
  if (pk) {
    const i0 = pk.i0;
    const tg = pk.pts.map((q, k) => unproj6(CAM_END, q, zOf(pkA(k))));
    const d0 = sub3(tg[0], pose.c[i0]);
    pose.c = pose.c.map((p, i) => {
      if (i >= i0) return add3(p, mul3(sub3(tg[i - i0], p), w));
      return add3(p, mul3(d0, w * Math.exp(-(((i0 - i) / 14) ** 2))));
    });
  }
  const e = toScreen(B, pose, -0.4, 0.6);
  sharpenTip(e);
  if (pk) {
    const r0 = pk.r[0] / Math.max(1e-3, e.rad[pk.i0]);
    for (let i = 0; i <= N; i++) {
      if (i >= pk.i0) e.rad[i] = lerp(e.rad[i], pk.r[i - pk.i0], w);
      else e.rad[i] *= lerp(1, r0, w * Math.exp(-(((pk.i0 - i) / 14) ** 2)));
    }
  }
  // a fine point (the contract's own radii from POKE0 on)
  coneTip(e, 1 - w);
  // where the body crosses the curtain (Z = 0): a fractional sample index
  let iX = -1;
  for (let i = 1; i <= N; i++) {
    const a = pose.c[i - 1][2], b = pose.c[i][2];
    if (a >= 0 && b < 0) {
      iX = i - 1 + a / (a - b || 1);
      break;
    }
  }
  return {c, B, pose, e, iX};
};

/** the slit around the crossing, as a screen polygon (for the caption check) */
const gapPoly = (c: Cam6): P[] => {
  const L = archLine(SL), R = archLine(SR);
  const near = (ps: P[], y: number) => ps.reduce((b, p) => (Math.abs(p.y - y) < Math.abs(b.y - y) ? p : b), ps[0]);
  const ys = [-1.1, -0.5, 0, 0.5, 1.1];
  const left = ys.map((y) => ({x: near(L, y).x + 0.33, y}));
  const right = ys.map((y) => ({x: near(R, y).x - 0.33, y})).reverse();
  return [...left, ...right].map((p) => toPlane(c, 0, p));
};

/** the S6 set; `eel` false leaves the eel out (the S5 -> S6 transition draws the one eel itself, over both sets) */
const S6View: React.FC<{t: number; eel?: boolean}> = ({t, eel = true}) => {
  const {c, pose, e, iX} = s6State(t);
  const discs = eelDiscs(pose, iX);
  const curtainOn = c.e[2] > 0.35;
  const geos = curtainOn ? [0, 1, 2, 3].map((k) => archGeo(k, discs, t)) : [];
  // the eel, opaque: its part beyond the curtain (in the chamber) lies over the filament fringe and under the bars
  // and rakers in front of it; the part in front of the curtain is drawn last. Both carry a pale backlit rim (the
  // light from the opening), so the slate body reads against the dark chamber at any size.
  const through = eel && iX >= 0;
  const lt = openingScr(c, t) ? lightOf(c) : null;
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} fill={K.chamberDeep} />
      <ChamberWall c={c} t={t} />
      {curtainOn && <Curtain c={c} geos={geos} part="fil" lt={lt} />}
      {through && <EelRim e={e} t={t} a={iX} b={N} w={3.6} />}
      {through && lt && <EelLit e={e} t={t} a={iX} lt={lt} />}
      {through && <EelS e={e} t={t} from={iX} />}
      {through && lt && <EelLit e={e} t={t} a={iX} lt={lt} shade />}
      {curtainOn && <Curtain c={c} geos={geos} part="bars" lt={lt} />}
      <OpeningBloom c={c} t={t} />
      {eel && <TipInLight c={c} e={e} t={t} />}
      <rect x={0} y={0} width={W} height={H} fill={LUMEN} fillOpacity={cutDark(t)} />
      {eel && <EelRim e={e} t={t} a={0} b={iX >= 0 ? iX - rimBack(e, iX) : N} w={3.6} />}
      {eel && (iX >= 0 ? <EelS e={e} t={t} to={iX} /> : <EelS e={e} t={t} />)}
    </g>
  );
};
/** the tail going into the daylight, as the tip goes through the gap: a crisp dark silhouette against the bright
 *  water and over the glare (the part already out of the opening fully, the part just inside it shading off into the
 *  body's own tone away from the light), with a thin bright edge where the light wraps round the part outside, so at
 *  phone size the one dark tail is seen going THROUGH the gap. Only its shading: the drawn shape is the eel's own (on
 *  pokeTail) */
const TIP_DARK = mix(INK, C.eelBack, 0.3);
const TipInLight: React.FC<{c: Cam6; e: ScrEel; t: number}> = ({c, e, t}) => {
  const a = ss(t, 12.45, T.poke);
  if (a <= 0) return null;
  const op = openingScr(c, t);
  if (!op) return null;
  const cl = uid('tipL'), mk = uid('tipM'), mg = uid('tipG');
  const i0 = N - 24;
  const X = exitScr(c);
  const r = 250 * lightOf(c).k;
  const sil = finSil(e, t, i0, N, 0);
  const body = (
    <g transform={`scale(${e.k})`}>
      <path d={sil} fill={TIP_DARK} stroke={INK} strokeWidth={1.2} vectorEffect={NS} strokeLinejoin="round" />
    </g>
  );
  return (
    <g opacity={a}>
      <defs>
        <clipPath id={cl} clipPathUnits="userSpaceOnUse">
          <path d={dPoly(op.poly)} />
        </clipPath>
        <radialGradient id={mg} gradientUnits="userSpaceOnUse" cx={X.x} cy={X.y} r={r}>
          <stop offset="0" stopColor="#FFF" />
          <stop offset="0.4" stopColor="#E0E0E0" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={mk} maskUnits="userSpaceOnUse" x={X.x - r} y={X.y - r} width={2 * r} height={2 * r}>
          <rect x={X.x - r} y={X.y - r} width={2 * r} height={2 * r} fill={`url(#${mg})`} />
        </mask>
      </defs>
      {/* just inside the opening, in the glare: shading off away from the light */}
      <g mask={`url(#${mk})`}>{body}</g>
      {/* out in the water: fully dark, with the light's thin edge round it */}
      <g clipPath={`url(#${cl})`}>
        <g transform={`scale(${e.k})`}>
          <path d={finSil(e, t, i0, N, 2.4)} fill={K.wrap} />
        </g>
        {body}
      </g>
    </g>
  );
};
/** how far (samples) the front part's rim stops short of the curtain crossing: just enough (~4 px) that its cut end,
 *  offset toward the light, stays under the front part's own cut end (one continuous rim, no step, no seam line) */
const rimBack = (e: ScrEel, iX: number) => {
  const i = Math.max(0, Math.min(N - 1, Math.floor(iX)));
  const l = Math.hypot(e.pts[i + 1].x - e.pts[i].x, e.pts[i + 1].y - e.pts[i].y);
  return Math.min(0.8, 4.5 / Math.max(1e-3, l));
};
/** the eel in the opening's light, samples a..N: under the body (`shade` false) a bright rim on the side toward the
 *  light, growing as the tail nears the opening; over it (`shade`) a darkening toward the light, so the tail goes
 *  into the brightness as a silhouette */
const EelLit: React.FC<{e: ScrEel; t: number; a: number; lt: Light; shade?: boolean}> = ({e, t, a, lt, shade}) => {
  const f = Math.max(a, e.from);
  if (N - f < 0.05) return null;
  const g = uid(shade ? 'eSh' : 'eHot');
  const d = shade ? finSil(e, t, f, N, 0) : finSil(e, t, f, N, 5.5, 3, -2);
  const cx = lt.H.x / e.k, cy = lt.H.y / e.k, r = ((shade ? 360 : 460) * lt.k) / e.k;
  return (
    <g transform={`scale(${e.k})`}>
      <defs>
        {shade ? (
          <radialGradient id={g} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
            <stop offset="0" stopColor={K.sil} stopOpacity={0.55} />
            <stop offset="0.5" stopColor={K.sil} stopOpacity={0.28} />
            <stop offset="1" stopColor={K.sil} stopOpacity={0} />
          </radialGradient>
        ) : (
          <radialGradient id={g} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
            <stop offset="0" stopColor={K.wrap} stopOpacity={1} />
            <stop offset="0.45" stopColor={K.beam} stopOpacity={0.8} />
            <stop offset="1" stopColor={K.beam} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      <path d={d} fill={`url(#${g})`} />
    </g>
  );
};
/** the pale backlit rim round the eel (the light from the opening), samples a..b */
const EelRim: React.FC<{e: ScrEel; t: number; a: number; b: number; w: number; opacity?: number}> = ({e, t, a, b, w, opacity = 1}) => {
  if (b - Math.max(a, e.from) < 0.05) return null;
  const d = finSil(e, t, Math.max(a, e.from), Math.min(b, N), w, 2, -2);
  return (
    <g transform={`scale(${e.k})`}>
      <path d={d} fill={K.backlight} fillOpacity={opacity} />
    </g>
  );
};

// ================================================================ S5 -> S6: one eel across the change of set
/** the eel's screen samples from S5's camera morph into S6's (they are framed alike), while the sets dissolve
 *  under it: the viewer sees ONE tail carried across the cut */
const morphW = (t: number) => ss(t, G_BEATS.morph0, G_BEATS.morph1);
const setW = (t: number) => ss(t, G_BEATS.cut - XF, G_BEATS.cut + XF);
const morphEel = (t: number): ScrEel => {
  const a = s5State(t).e, b = s6State(t).e, w = morphW(t);
  return {
    pts: a.pts.map((p, i) => ({x: lerp(p.x, b.pts[i].x, w), y: lerp(p.y, b.pts[i].y, w)})),
    rad: a.rad.map((r, i) => lerp(r, b.rad[i], w)),
    dorsal: a.dorsal.map((d, i) => lerp(d, b.dorsal[i], w)),
    depth: b.depth,
    from: lerp(a.from, b.from, w),
    k: lerp(a.k, b.k, w),
    ppu: a.ppu.map((v, i) => lerp(v, b.ppu[i], w)),
  };
};
const inMorph = (t: number) => t > G_BEATS.morph0 && t < G_BEATS.morph1;

// ================================================================ the frame
export const S5Throat: React.FC<{t: number}> = ({t}) => {
  const a = setW(t);
  const morph = inMorph(t);
  const me = morph ? morphEel(t) : null;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{display: 'block', background: LUMEN}}>
      <rect x={0} y={0} width={W} height={H} fill={LUMEN} />
      {a < 1 && <S5View t={t} eel={!morph} />}
      {a > 0 && (
        <g opacity={a}>
          <S6View t={t} eel={!morph} />
        </g>
      )}
      {me && (
        <g>
          <EelRim e={me} t={t} a={0} b={N} w={3.6} opacity={morphW(t)} />
          <EelS e={me} t={t} />
        </g>
      )}
    </svg>
  );
};

/** the caption check: the eel's drawn screen samples (and the slit and the opening, while they are in view) */
export const keepOut = (t: number): KeepOut => {
  const a = setW(t);
  const eel: {x: number; y: number; r: number}[] = [];
  let gap: P[] | undefined;
  if (inMorph(t)) eel.push(...keepOfEel(morphEel(t)));
  else {
    if (a < 1) eel.push(...keepOfEel(s5State(t).e));
    if (a > 0) eel.push(...keepOfEel(s6State(t).e));
  }
  if (a > 0) {
    const s = s6State(t);
    const onScr = (g: P[]) => g.some((p) => p.x > 0 && p.x < W && p.y > 0 && p.y < H);
    const pts: P[] = [];
    if (s.c.e[2] > 0.35) {
      const g = gapPoly(s.c);
      if (onScr(g)) pts.push(...g);
    }
    // the gill opening (the water beyond the rim, between the cover's free edge and the body wall) is the gap's
    // other end: it counts too
    const op = openingScr(s.c, t);
    if (op && onScr(op.poly)) pts.push(...op.poly.filter((_, i) => i % 2 === 0));
    if (pts.length >= 3) gap = hull(pts);
  }
  return gap ? {eel, gap} : {eel};
};

/** for the test sheet and the report */
export const S5_DEBUG = {inMorph, setW, s5Tip, s6Tip, s6Cam, SIG_G, SIG_R, CAM_END, s6State, s5State, morphEel, RIM_B, Z_B, Z_E, EDGE_EXT, planeM, PK3, S6_ROUTE, A_X, archLine, ROOF, openingScr, toPlane};
