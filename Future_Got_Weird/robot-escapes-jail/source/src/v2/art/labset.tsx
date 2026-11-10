// V2 LAB SET (owner: LABSET): the real experiment's miniature world, in MILLIMETRES, for the LB shot (3.40-13.67 s) and
// the start of MS. A dark, premium "miniature sci-fi film" look: a matte navy-grey lab stage with a faint 5 mm mat grid,
// soft key-light pool, deep navy surroundings with out-of-focus lab lights; the tiny lab cage (thin dark-steel bars, no
// padlock, a barred lid that closes on "cage"), the AC induction coil under a glass window in the stage (copper turns;
// energised = warm glow + alternating field arcs), an external permanent magnet on a slider sled with a push handle (red
// N / blue S, steel), a glass collection dish, a two-part minifigure mold (orange silicone) and a gloved-hand helper.
//
// WORLD (same Cam3 / projection maths as src/world.ts, which this file imports; 1 world unit = 1 mm):
//   x right, h up (stage top h = 0), d away from the viewer. The cage's FRONT bar row stands on the plane d = 0
//   (LAB.CAGE.d0), the cage interior is d 0..13, the outside where the liquid collects and the magnet works is d < 0.
//   The figure (src/v2/labFigure.tsx) is 10 mm tall (LAB.FIG_H) and ~3.7 mm wide; the bars are 0.4 mm thick at a
//   1.6 mm pitch: CLEAR GAP 1.2 mm, far narrower than its 2.3 mm torso and 1.8 mm head (the solid cannot pass).
//   Front bar centres are at x = (i + 0.5) * 1.6, so x = 0 is the centre of a gap (the stream uses gaps x = -1.6, 0, 1.6).
//
// DRAW ORDER (what <LabWorld> does; reproduce it if you compose the layers yourself):
//   1 <LabBackdrop>                     screen-space navy surroundings + far lab lights (parallax with the camera)
//   2 <LabStage>                        mat, grid, light pool, coil window + copper coil + heat glow, cage floor shadows
//   2b dish back half, mold            (outside props that liquid may sit in / on)
//   3 <LabACArcs half="back">           field arcs behind the sample (coil > 0)
//   4 <CageBack>                        back + side bars, base rails, back/side top rails (and the lid while it is open)
//   5 body('back')                      everything at d >= d0 (inside the cage): the figure, the pool, the stream's tail
//   6 <LabACArcs half="front">          field arcs in front of / through the sample
//   7 <CageFront>                       front bar row, front top rail, the lid once it is closing (< 90 deg)
//   8 body('front')                     everything at d < d0 (outside): the stream's front, the collected puddle
//   7b magnet field lines (floor plane, under the outside liquid)
//   9 outside props                     dish front wall, the magnet, gloved hands (`front` children)
//  10 vignette
//   body(pass) is a render prop; with the engine's depth split the SAME body is drawn twice:
//     body = (pass) => <LabFigure cam={cam} t={t} base={LAB.HOME} height={LAB.FIG_H} melt={m} part={pass} d0={0} ... />
//     body = (pass) => <LabStream cam={cam} t={t} u={u} part={pass} />
//   The seam lies inside the bar gaps (front pass overlaps the back by 0.12 mm).
//
// CAMERAS: LAB_SHOTS (look-at specs {p, at, f}) and LAB_CAMS (Cam3): reveal (end state of labRevealCam), meltMedium,
//   meltClose, overheadAngled, handoff (+ bench: a wide high view with the dish and mold, for MS staging).
//   Move between them with labCamBetween(a, b, eased u) (interpolates eye and target, not angles).
// PROPS: <LabMagnet m={{x, d, yaw?, field?}}/> (x, d = N-face centre; labMagnetGrip(m) = the handle's grip point for a
//   <LabGlove at=.../>), <LabDish part/>, <LabMold mold={{open, fill}}/>, <LabGlove/> (true scale: a hand is 185 mm, so
//   near the 10 mm figure only giant fingertips fit in frame; pass handMM to cheat the scale). labRevealCam(u): u = 0 is 2.6 mm off the figure's chest (the chrome fills the
//   frame: H1 -> LB match from <ChromeSurface>), pulling straight back THROUGH the centre gap of the front bars, then
//   arcing up-left to the medium view of the cage on the stage (u = 1 = LAB_CAMS.reveal). u is log-distance linear:
//   ease it in the shot (e.g. keyS) and carry H1's velocity.
// HAND-OFF LB -> MS (13.67 s): LAB_HANDOFF = {t, cam, puddle: {x, d, rx, rd, seed}}; labHandoffPuddle(t, settle?) returns
//   the engine prims (screen px in LAB_HANDOFF.cam), blend, ripples; <LabHandoffPuddle t/> draws it. settle 0 = the plain
//   disc the stream ends with (labStreamFloor(u = 1) pool: exactly the same centre and area), 1 = the living lobed puddle.
//   Both shots draw <LabWorld cam={LAB_HANDOFF.cam} ... body={(p) => p === 'front' && <LabHandoffPuddle t={t} />} />.
//
// Pure functions of their inputs (no randomness, no Date, no CSS animation). Every SVG id comes from uid().
import React from 'react';
import {C, INK, INK_PX} from '../../art/palette';
import {uid} from '../../core/ids';
import {mix} from '../../core/color';
import {clamp, lerp, noise1, ss} from '../../lib';
import {Cam3, P3, toCam, W, H} from '../../world';
import {Prim, projectPrims, sdField} from '../liquid/sdf';
import {isoLoops} from '../liquid/march';
import {ChromeBody, ChromeEnv, FloorOpts} from '../liquid/Chrome';
import {calibrate, floorPrims, GapSpec, streamThroughGaps, StreamOut} from '../liquid/flow';
import {FIG, LabFigure, labFigureLocal} from '../labFigure';
import {GloveArm, pinchWrist} from '../../art/lab';
import {HAND_RELAXED, HandPose} from '../../dc/Hand';

type V = {x: number; y: number};
type S = V & {s: number};
const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
const f3 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(4));

// =====================================================================================================================
// LAYOUT (mm)
// =====================================================================================================================
const PITCH = 1.6, BAR_R = 0.2;
export const LAB = {
  /** the figure's height (labFigure world units = mm) */
  FIG_H: 10,
  /** where the figure stands when the cage closes (cage centre) */
  HOME: {x: 0, h: 0, d: 6.5} as P3,
  /** the solid figure pressed against the front bars (its front touches the bars) */
  AT_BARS: {x: 0, h: 0, d: 1.15} as P3,
  /** where it melts: its pool (r = POOL_R) then reaches from just behind the bars to the middle of the cage */
  MELT: {x: 0, h: 0, d: 5.6} as P3,
  /** the melted pool's radius (labPoolCircle at melt 1 for a 10 mm figure: 5.04) = the stream's conserved disc */
  POOL_R: 5.0,
  STAGE: {x0: -70, x1: 70, d0: -48, d1: 72, th: 6, r: 8},
  CAGE: {x0: -9.6, x1: 9.6, d0: 0, d1: 13, h: 14, pitch: PITCH, barR: BAR_R, gap: PITCH - 2 * BAR_R, postR: 0.42, rail: 0.36, base: 0.55},
  COIL: {x: 0, d: 6.5, r0: 1.3, r1: 7.2, turns: 6, wire: 0.42, h: -0.85, win: 8.4},
  MAGNET: {hw: 2.4, len: 5.6, hh: 1.5, sled: 0.45},
  /** the magnet's N face, closest working position for the stream (outside the front bars) */
  MAGNET_PULL: {x: 0, d: -13.2},
  /** where the stream collects (floor x, d) */
  DEST: {x: 0, d: -6.4},
  DISH: {x: -11.5, d: -16, r: 6, h: 2.2},
  MOLD: {x: 13, d: -15, hw: 4.2, hl: 7.4, th: 2.6},
};
const CG = LAB.CAGE;
/** front / back bar x positions (x = 0 is the centre of a gap) */
export const LAB_BAR_XS: number[] = Array.from({length: 12}, (_, i) => (i - 6 + 0.5) * PITCH);
/** side bar d positions */
export const LAB_SIDE_DS: number[] = Array.from({length: 8}, (_, i) => 0.9 + i * PITCH);

// =====================================================================================================================
// PROJECTION (world.ts maths + near-plane clipping, so the camera can pass right through the bar row)
// =====================================================================================================================
const ZN = 0.3;
type Q = {x: number; y: number; z: number};
const scr = (c: Cam3, q: Q): S => {
  const s = c.f / q.z;
  return {x: W / 2 + q.x * s, y: H / 2 - q.y * s, s};
};
/** project a point (null when it is behind the near plane) */
export const labProj = (c: Cam3, p: P3): S | null => {
  const q = toCam(c, p);
  return q.z < ZN ? null : scr(c, q);
};
/** project a polygon, clipped against the near plane */
export const labProjPoly = (c: Cam3, pts: P3[]): S[] => {
  const qs = pts.map((p) => toCam(c, p));
  const out: Q[] = [];
  for (let i = 0; i < qs.length; i++) {
    const a = qs[i], b = qs[(i + 1) % qs.length];
    const ai = a.z >= ZN, bi = b.z >= ZN;
    if (ai) out.push(a);
    if (ai !== bi) {
      const k = (ZN - a.z) / (b.z - a.z);
      out.push({x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: ZN});
    }
  }
  return out.map((q) => scr(c, q));
};
/** project a segment, clipped against the near plane */
export const labProjSeg = (c: Cam3, a: P3, b: P3): [S, S] | null => {
  let qa = toCam(c, a), qb = toCam(c, b);
  if (qa.z < ZN && qb.z < ZN) return null;
  const cut = (p: Q, q: Q): Q => {
    const k = (ZN - p.z) / (q.z - p.z);
    return {x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k, z: ZN};
  };
  if (qa.z < ZN) qa = cut(qa, qb);
  else if (qb.z < ZN) qb = cut(qb, qa);
  return [scr(c, qa), scr(c, qb)];
};
/** project an open polyline (split at the near plane: returns runs) */
const projLine = (c: Cam3, pts: P3[]): S[][] => {
  const runs: S[][] = [];
  let cur: S[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = labProj(c, pts[i]);
    if (p && Math.abs(p.x) < 2e4 && Math.abs(p.y) < 2e4) cur.push(p);
    else if (cur.length) {
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  return runs;
};
const polyD = (pts: V[]) => (pts.length < 3 ? '' : 'M' + pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L') + 'Z');
const lineD = (pts: V[]) => (pts.length < 2 ? '' : 'M' + pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L'));
const circle3 = (cx: number, h: number, cd: number, r: number, n = 48): P3[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return {x: cx + Math.cos(a) * r, h, d: cd + Math.sin(a) * r};
  });
const add3 = (a: P3, b: P3, k = 1): P3 => ({x: a.x + b.x * k, h: a.h + b.h * k, d: a.d + b.d * k});
const dot3 = (a: P3, b: P3) => a.x * b.x + a.h * b.h + a.d * b.d;
const norm3 = (a: P3): P3 => {
  const l = Math.hypot(a.x, a.h, a.d) || 1;
  return {x: a.x / l, h: a.h / l, d: a.d / l};
};
/** world position of the camera */
const camPos = (c: Cam3): P3 => ({x: c.x, h: c.h, d: c.d});

/** key light (world direction TOWARD the light: upper left, a little toward the viewer) */
const LW = norm3({x: -0.5, h: 0.8, d: -0.35});
const toneOf = (base: string, n: P3) => {
  const k = clamp(0.5 + 0.5 * dot3(n, LW));
  return k > 0.5 ? mix(base, '#EAF2FA', (k - 0.5) * 0.55) : mix(base, C.navy0, (0.5 - k) * 1.1);
};

// =====================================================================================================================
// CAMERAS
// =====================================================================================================================
export type LabShot = {p: P3; at: P3; f: number};
/** look-at camera (world.ts conventions: yaw + turns right, pitch + looks down) */
export const camLook = (p: P3, at: P3, f: number): Cam3 => {
  const dx = at.x - p.x, dy = at.h - p.h, dz = at.d - p.d;
  const yaw = (Math.atan2(dx, dz) * 180) / Math.PI;
  const pitch = (Math.atan2(-dy, Math.hypot(dx, dz)) * 180) / Math.PI;
  return {x: p.x, h: p.h, d: p.d, yaw, pitch, f};
};
export const shotCam = (s: LabShot): Cam3 => camLook(s.p, s.at, s.f);
const lerp3 = (a: P3, b: P3, u: number): P3 => ({x: lerp(a.x, b.x, u), h: lerp(a.h, b.h, u), d: lerp(a.d, b.d, u)});
/** interpolate two shots in look-at space (smoother than lerping yaw/pitch); u is NOT eased here */
export const lerpShot = (a: LabShot, b: LabShot, u: number): LabShot => ({p: lerp3(a.p, b.p, u), at: lerp3(a.at, b.at, u), f: lerp(a.f, b.f, u)});
/** a camera between two shots */
export const labCamBetween = (a: LabShot, b: LabShot, u: number) => shotCam(lerpShot(a, b, u));

const CHEST: P3 = {x: 0, h: 5.6, d: LAB.HOME.d};
export const LAB_SHOTS = {
  /** reveal start: 2.6 mm off the figure's chest (full-frame chrome) */
  reveal0: {p: {x: 0, h: 5.6, d: LAB.HOME.d - 1.8}, at: CHEST, f: 1500} as LabShot,
  /** reveal end: the cage on the stage, slightly high and left, the open lid above */
  reveal: {p: {x: -13, h: 17, d: -44}, at: {x: 0.5, h: 7.6, d: 5.5}, f: 2000} as LabShot,
  /** the melt, medium: figure ~1/3 of the frame, coil window and cage visible */
  meltMedium: {p: {x: -9, h: 12, d: -50}, at: {x: 0, h: 6.2, d: 5.6}, f: 2750} as LabShot,
  /** the melt, close: figure fills ~55 % of the frame through the front bars, low and frontal */
  meltClose: {p: {x: -3.5, h: 7, d: -20}, at: {x: 0, h: 4.0, d: 5.6}, f: 2100} as LabShot,
  /** angled overhead: the barrier, the liquid inside, the destination and the magnet outside all visible */
  overheadAngled: {p: {x: -8, h: 46, d: -32}, at: {x: 0, h: 1.5, d: -3}, f: 1950} as LabShot,
  /** the hand-off: tracking the collected puddle outside the cage (the bars behind it, the magnet below it) */
  handoff: {p: {x: -4, h: 32, d: -30}, at: {x: 0, h: 0, d: -6.4}, f: 2000} as LabShot,
  /** (extra) a wide high view of the bench: cage, dish (left) and mold (right) - for MS staging */
  bench: {p: {x: 0, h: 62, d: -62}, at: {x: 0, h: 0, d: -3}, f: 2000} as LabShot,
};
export const LAB_CAMS = {
  reveal: shotCam(LAB_SHOTS.reveal),
  meltMedium: shotCam(LAB_SHOTS.meltMedium),
  meltClose: shotCam(LAB_SHOTS.meltClose),
  overheadAngled: shotCam(LAB_SHOTS.overheadAngled),
  handoff: shotCam(LAB_SHOTS.handoff),
  bench: shotCam(LAB_SHOTS.bench),
};

/** the reveal pull-back. u 0: 2.6 mm off the chest (chrome fills the frame), straight back through the centre gap of
 *  the front bars, then arcing up and left to LAB_CAMS.reveal (u = 1). Distance is log-linear in u (constant
 *  perceived zoom speed); ease u in the shot. */
export const labRevealCam = (u: number): Cam3 => {
  const e = clamp(u);
  const a = LAB_SHOTS.reveal0, b = LAB_SHOTS.reveal;
  const d0 = Math.hypot(a.p.x - a.at.x, a.p.h - a.at.h, a.p.d - a.at.d);
  const d1 = Math.hypot(b.p.x - b.at.x, b.p.h - b.at.h, b.p.d - b.at.d);
  const dist = d0 * Math.pow(d1 / d0, e);
  const at = lerp3(a.at, b.at, ss(e, 0.25, 1));
  // straight back until the camera has cleared the bar row (dist > ~8), then swing to the final direction
  const w = ss(dist, 8, d1 * 0.95);
  const D0 = norm3({x: a.p.x - a.at.x, h: a.p.h - a.at.h, d: a.p.d - a.at.d});
  const D1 = norm3({x: b.p.x - b.at.x, h: b.p.h - b.at.h, d: b.p.d - b.at.d});
  const D = norm3(lerp3(D0, D1, w));
  // focal: a touch wider while very close (more of the chest in view), the shot's own f at the end
  const f = lerp(a.f, b.f, ss(e, 0.1, 0.9));
  return camLook(add3(at, D, dist), at, f);
};

// =====================================================================================================================
// PRIMITIVE RENDERERS: rods (bars, rails), blocks (boxes with lit faces)
// =====================================================================================================================
type RodLook = 'steel' | 'bright' | 'alu';
const ROD_STOPS: Record<RodLook, [number, string][]> = {
  steel: [[0, '#AEBCCB'], [0.16, '#64748A'], [0.5, '#364457'], [0.82, '#202C3D'], [1, '#2C3B50']],
  bright: [[0, '#F2F7FC'], [0.2, '#B8C5D3'], [0.55, '#7D8CA0'], [0.85, '#4A586B'], [1, '#5D6C80']],
  alu: [[0, '#E3EAF1'], [0.25, '#A7B4C2'], [0.6, '#7C8A9C'], [1, '#56647A']],
};
/** a cylinder from a to b (world), radius r (mm), dark steel by default; clipped at the near plane */
export const Rod: React.FC<{cam: Cam3; a: P3; b: P3; r: number; look?: RodLook; ink?: number; dim?: number}> = ({cam, a, b, r, look = 'steel', ink, dim = 0}) => {
  const sg = labProjSeg(cam, a, b);
  if (!sg) return null;
  const [A, B] = sg;
  const ra = r * A.s, rb = r * B.s;
  if (Math.max(ra, rb) < 0.25) return null;
  let dx = B.x - A.x, dy = B.y - A.y;
  const L = Math.hypot(dx, dy);
  if (L > 6e4) return null;
  if (L < 1e-3) {
    dx = 0;
    dy = 1;
  } else {
    dx /= L;
    dy /= L;
  }
  let nx = -dy, ny = dx;
  if (nx * -0.6 + ny * -0.8 < 0) {
    nx = -nx;
    ny = -ny;
  }
  const cr = nx * dy - ny * dx;
  const sw = cr > 0 ? 1 : 0;
  const P = (o: V, k: number) => `${f1(o.x + nx * k)},${f1(o.y + ny * k)}`;
  const d = `M${P(A, ra)} L${P(B, rb)} A${f1(rb)},${f1(rb)} 0 0 ${sw} ${P(B, -rb)} L${P(A, -ra)} A${f1(ra)},${f1(ra)} 0 0 ${sw} ${P(A, ra)} Z`;
  const rm = (ra + rb) / 2, mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
  const id = uid('rod');
  const iw = ink ?? Math.min(INK_PX * 0.85, Math.max(0.6, rm * 0.32));
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(mx + nx * rm)} y1={f1(my + ny * rm)} x2={f1(mx - nx * rm)} y2={f1(my - ny * rm)}>
          {ROD_STOPS[look].map(([o, c]) => (
            <stop key={o} offset={o} stopColor={dim > 0 ? mix(c, C.navy0, dim) : c} />
          ))}
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} stroke={INK} strokeWidth={f1(iw * 2)} strokeLinejoin="round" style={{paintOrder: 'stroke'}} />
      {rm > 1.6 && <path d={`M${P(A, ra * 0.42)} L${P(B, rb * 0.42)}`} stroke="#FFFFFF" strokeWidth={f1(Math.max(0.7, rm * 0.16))} strokeLinecap="round" opacity={0.5 * (1 - dim)} />}
    </g>
  );
};

/** a box from a centre and three half-axis vectors (u: width, v: up, w: depth); visible faces lit by the key light.
 *  decal(face, matrix) may return content drawn on a face in its local [-1, 1]^2 frame (matrix = SVG transform). */
type FaceKey = '+u' | '-u' | '+v' | '-v' | '+w' | '-w';
export const Block: React.FC<{
  cam: Cam3; o: P3; u: P3; v: P3; w: P3; color: string | Partial<Record<FaceKey, string>>; ink?: number;
  decal?: (face: FaceKey, m: string, size: S) => React.ReactNode; gloss?: boolean;
}> = ({cam, o, u, v, w, color, ink = INK_PX, decal, gloss = true}) => {
  const cp = camPos(cam);
  const faces: {k: FaceKey; n: P3; a: P3; b: P3}[] = [
    {k: '+v', n: v, a: u, b: w}, {k: '-v', n: {x: -v.x, h: -v.h, d: -v.d}, a: u, b: w},
    {k: '+u', n: u, a: w, b: v}, {k: '-u', n: {x: -u.x, h: -u.h, d: -u.d}, a: w, b: v},
    {k: '+w', n: w, a: u, b: v}, {k: '-w', n: {x: -w.x, h: -w.h, d: -w.d}, a: u, b: v},
  ];
  const out: React.ReactNode[] = [];
  for (const F of faces) {
    const fc = add3(o, F.n);
    const nn = norm3(F.n);
    if (dot3(nn, {x: cp.x - fc.x, h: cp.h - fc.h, d: cp.d - fc.d}) <= 1e-6) continue;
    const pts = [add3(add3(fc, F.a, -1), F.b, -1), add3(add3(fc, F.a, 1), F.b, -1), add3(add3(fc, F.a, 1), F.b, 1), add3(add3(fc, F.a, -1), F.b, 1)];
    const sp = labProjPoly(cam, pts);
    if (sp.length < 3) continue;
    const base = typeof color === 'string' ? color : color[F.k] ?? '#55667A';
    out.push(<path key={F.k} d={polyD(sp)} fill={toneOf(base, nn)} stroke={INK} strokeWidth={f1(ink)} strokeLinejoin="round" />);
    if (gloss && F.k === '+v' && nn.h > 0.5) {
      // a soft lit edge along the far-left top edge
      const e = labProjSeg(cam, add3(add3(fc, F.a, -0.92), F.b, 0.92), add3(add3(fc, F.a, 0.6), F.b, 0.92));
      if (e) out.push(<path key="gl" d={lineD(e)} stroke="#FFFFFF" strokeWidth={f1(Math.max(1, ink * 0.8))} strokeLinecap="round" opacity={0.35} />);
    }
    if (decal) {
      const c0 = labProj(cam, fc), ca = labProj(cam, add3(fc, F.a)), cb = labProj(cam, add3(fc, F.b));
      if (c0 && ca && cb) {
        const m = `matrix(${f3(ca.x - c0.x)} ${f3(ca.y - c0.y)} ${f3(cb.x - c0.x)} ${f3(cb.y - c0.y)} ${f3(c0.x)} ${f3(c0.y)})`;
        const node = decal(F.k, m, c0);
        if (node) out.push(<g key={'d' + F.k}>{node}</g>);
      }
    }
  }
  return <g>{out}</g>;
};
const ax = (x: number, h: number, d: number): P3 => ({x, h, d});

// =====================================================================================================================
// BACKDROP (screen-space navy surroundings, far out-of-focus lab lights that parallax with the camera)
// =====================================================================================================================
const BOKEH: {p: P3; r: number; c: string; a: number}[] = [
  {p: ax(-120, 70, 260), r: 16, c: '#7FC8FF', a: 0.16},
  {p: ax(-60, 95, 300), r: 11, c: '#FFFFFF', a: 0.1},
  {p: ax(-20, 55, 230), r: 9, c: '#46E6FF', a: 0.12},
  {p: ax(40, 85, 280), r: 14, c: '#FFC27A', a: 0.1},
  {p: ax(95, 60, 240), r: 10, c: '#7FC8FF', a: 0.14},
  {p: ax(150, 110, 330), r: 18, c: '#FFFFFF', a: 0.07},
  {p: ax(-170, 130, 340), r: 20, c: '#5CA8FF', a: 0.09},
  {p: ax(10, 140, 360), r: 22, c: '#9FD9FF', a: 0.07},
  {p: ax(70, 40, 210), r: 7, c: '#FFFFFF', a: 0.12},
  {p: ax(-95, 30, 200), r: 6, c: '#FFD9A8', a: 0.1},
];
export const LabBackdrop: React.FC<{cam: Cam3; t: number}> = ({cam, t}) => {
  const ids = {bg: uid('lbBg'), gl: uid('lbGl'), bk: uid('lbBk')};
  const glow = labProj(cam, {x: 0, h: 30, d: 220});
  return (
    <g>
      <defs>
        <linearGradient id={ids.bg} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#08101E" />
          <stop offset="0.45" stopColor="#101D33" />
          <stop offset="1" stopColor="#0B1526" />
        </linearGradient>
        <radialGradient id={ids.gl}>
          <stop offset="0" stopColor="#2F5582" stopOpacity={0.55} />
          <stop offset="0.5" stopColor="#1C3557" stopOpacity={0.28} />
          <stop offset="1" stopColor="#13223A" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={ids.bk}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${ids.bg})`} />
      {glow && <ellipse cx={f1(glow.x)} cy={f1(glow.y)} rx={1100} ry={760} fill={`url(#${ids.gl})`} />}
      {BOKEH.map((b, i) => {
        const q = labProj(cam, b.p);
        if (!q) return null;
        const r = clamp(b.r * q.s, 8, 120);
        const br = 0.85 + 0.15 * Math.sin(t * 0.7 + i * 1.9);
        const gid = `${ids.bk}${i}`;
        return (
          <g key={i} opacity={f3(b.a * br * 2.2)}>
            <defs>
              <radialGradient id={gid}>
                <stop offset="0" stopColor={b.c} stopOpacity={0.55} />
                <stop offset="0.72" stopColor={b.c} stopOpacity={0.42} />
                <stop offset="0.86" stopColor={b.c} stopOpacity={0.6} />
                <stop offset="1" stopColor={b.c} stopOpacity={0} />
              </radialGradient>
            </defs>
            <circle cx={f1(q.x)} cy={f1(q.y)} r={f1(r)} fill={`url(#${gid})`} />
          </g>
        );
      })}
    </g>
  );
};

/** soft vignette (draw last) */
export const LabVignette: React.FC<{k?: number}> = ({k = 1}) => {
  const id = uid('lbVg');
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx="540" cy="900" r="1250">
          <stop offset="0.5" stopColor={C.navy0} stopOpacity={0} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.62 * k} />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
    </g>
  );
};

// =====================================================================================================================
// STAGE: matte mat + grid, key-light pool, coil window (copper coil under glass), cage shadows
// =====================================================================================================================
const MAT_TOP = '#2F3E53';
const MAT_LIT = '#9DB3CC';
const roundRect = (x0: number, x1: number, d0: number, d1: number, r: number, h: number, n = 6): P3[] => {
  const pts: P3[] = [];
  const corner = (cx: number, cd: number, a0: number) => {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push({x: cx + Math.cos(a) * r, h, d: cd + Math.sin(a) * r});
    }
  };
  corner(x1 - r, d0 + r, -Math.PI / 2);
  corner(x1 - r, d1 - r, 0);
  corner(x0 + r, d1 - r, Math.PI / 2);
  corner(x0 + r, d0 + r, Math.PI);
  return pts;
};
/** an affine gradient transform mapping the unit circle to a floor circle (centre c, radius r) seen by cam */
const affGrad = (cam: Cam3, c: P3, r: number): string | null => {
  const o = labProj(cam, c), a = labProj(cam, {...c, x: c.x + r}), b = labProj(cam, {...c, d: c.d + r});
  const a2 = labProj(cam, {...c, x: c.x - r}), b2 = labProj(cam, {...c, d: c.d - r});
  if (!o || !a || !b || !a2 || !b2) return null;
  const cx = (a.x + a2.x + b.x + b2.x) / 4, cy = (a.y + a2.y + b.y + b2.y) / 4;
  return `matrix(${f3((a.x - a2.x) / 2)} ${f3((a.y - a2.y) / 2)} ${f3((b.x - b2.x) / 2)} ${f3((b.y - b2.y) / 2)} ${f3(cx)} ${f3(cy)})`;
};
const COPPER = '#C8743A', COPPER_LT = '#F6B57C', COPPER_DK = '#6E3415';
const coilPts = (): P3[] => {
  const K = LAB.COIL, n = 360, pts: P3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = u * K.turns * Math.PI * 2 + 0.6;
    const r = K.r0 + (K.r1 - K.r0) * u;
    pts.push({x: K.x + Math.cos(a) * r, h: K.h, d: K.d + Math.sin(a) * r});
  }
  return pts;
};
const COIL_PTS = coilPts();

/** the bars' footprint for shadows / AO */
const barFeet = (): P3[] => [
  ...LAB_BAR_XS.map((x) => ({x, h: 0, d: CG.d0})),
  ...LAB_BAR_XS.map((x) => ({x, h: 0, d: CG.d1})),
  ...LAB_SIDE_DS.flatMap((d) => [{x: CG.x0, h: 0, d}, {x: CG.x1, h: 0, d}]),
];
const BAR_FEET = barFeet();
/** cast-shadow offset on the stage per mm of height (key light from the upper left, a little toward the viewer) */
const SHADOW = {x: 0.3, d: 0.2};

export const LabStage: React.FC<{cam: Cam3; t: number; coil?: number; grid?: number; cage?: boolean}> = ({cam, t, coil = 0, grid = 1, cage = true}) => {
  const S = LAB.STAGE, K = LAB.COIL;
  const ids = {top: uid('stT'), win: uid('stW'), hot: uid('stH'), clip: uid('stK'), cu: uid('stC'), glass: uid('stG'), pool: uid('stP')};
  const outline = roundRect(S.x0, S.x1, S.d0, S.d1, S.r, 0, 6);
  const cp = camPos(cam);
  // skirt (the stage's edge) where it faces the camera
  const skirt: React.ReactNode[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    const mx = (a.x + b.x) / 2, md = (a.d + b.d) / 2;
    const nx = b.d - a.d, nd = -(b.x - a.x); // outward normal (ccw in x-d)
    if (nx * (cp.x - mx) + nd * (cp.d - md) <= 0) continue;
    const sp = labProjPoly(cam, [a, b, {...b, h: -S.th}, {...a, h: -S.th}]);
    if (sp.length > 2) skirt.push(<path key={i} d={polyD(sp)} fill="#162235" stroke="#162235" strokeWidth={1} />);
  }
  const top = labProjPoly(cam, outline);
  // grid
  const gl: string[] = [], gM: string[] = [];
  if (grid > 0) {
    for (let x = -65; x <= 65; x += 5) {
      const sg = labProjSeg(cam, {x, h: 0, d: S.d0 + 2}, {x, h: 0, d: S.d1 - 2});
      if (sg) (x % 25 === 0 ? gM : gl).push(lineD(sg));
    }
    for (let d = -45; d <= 70; d += 5) {
      const sg = labProjSeg(cam, {x: S.x0 + 2, h: 0, d}, {x: S.x1 - 2, h: 0, d});
      if (sg) (d % 25 === 0 ? gM : gl).push(lineD(sg));
    }
  }
  // key-light pool on the mat: concentric projected discs (perspective-correct)
  const pool = affGrad(cam, {x: -1, h: 0, d: 5}, 46);
  // coil window
  const win = polyD(labProjPoly(cam, circle3(K.x, 0, K.d, K.win, 56)));
  const bezelO = polyD(labProjPoly(cam, circle3(K.x, 0.12, K.d, K.win + 0.9, 56)));
  const coilC = labProj(cam, {x: K.x, h: K.h, d: K.d});
  const wpx = coilC ? K.wire * 2 * coilC.s : 4;
  const coilD = projLine(cam, COIL_PTS).map(lineD).join(' ');
  const hot = clamp(coil);
  const flick = 0.92 + 0.08 * Math.sin(t * 29) * Math.sin(t * 7.3);
  const cuCol = mix(COPPER, '#FF9A4A', hot * 0.75);
  const hotRings = hot > 0.01 ? [7.6, 6, 4.6, 3.2, 2].map((r) => polyD(labProjPoly(cam, circle3(K.x, K.h, K.d, r, 40)))) : [];
  const glow = hot > 0.01 ? affGrad(cam, {x: K.x, h: 0, d: K.d}, 19) : null;
  // cage shadows: base AO + long thin bar shadows (key light)
  let shadows = '';
  let ao = '';
  if (cage) {
    const sh: string[] = [];
    for (const f of BAR_FEET) {
      const tip = {x: f.x + SHADOW.x * CG.h, h: 0, d: f.d + SHADOW.d * CG.h};
      const L = Math.hypot(tip.x - f.x, tip.d - f.d);
      const px = (-(tip.d - f.d) / L) * BAR_R * 0.9, pd = ((tip.x - f.x) / L) * BAR_R * 0.9;
      sh.push(polyD(labProjPoly(cam, [{x: f.x + px, h: 0, d: f.d + pd}, {x: tip.x + px * 0.6, h: 0, d: tip.d + pd * 0.6}, {x: tip.x - px * 0.6, h: 0, d: tip.d - pd * 0.6}, {x: f.x - px, h: 0, d: f.d - pd}])));
    }
    shadows = sh.join(' ');
    ao = polyD(labProjPoly(cam, roundRect(CG.x0 - 1.3, CG.x1 + 1.3, CG.d0 - 1.1, CG.d1 + 1.3, 1.2, 0, 3)));
  }
  const winC = labProj(cam, {x: K.x, h: 0, d: K.d});
  const gc = labProj(cam, {x: 0, h: 0, d: 2});
  const gR = clamp((gc?.s ?? 30) * 40, 500, 4000);
  // atmospheric haze over the far stage (soft falloff into the navy surroundings)
  const far = labProj(cam, {x: 0, h: 0, d: S.d1}), mid = labProj(cam, {x: 0, h: 0, d: 30});
  const haze = far && mid && mid.y > far.y + 4 ? {y0: far.y - 2, h: mid.y - far.y + 2} : null;
  return (
    <g>
      <defs>
        <linearGradient id={ids.top} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop offset="0" stopColor="#223047" />
          <stop offset="0.6" stopColor={MAT_TOP} />
          <stop offset="1" stopColor="#2A384C" />
        </linearGradient>
        <radialGradient id={ids.win} gradientUnits="userSpaceOnUse" cx={f1(winC?.x ?? 540)} cy={f1(winC?.y ?? 960)} r={f1((winC?.s ?? 40) * K.win)}>
          <stop offset="0" stopColor="#1A2A40" />
          <stop offset="1" stopColor="#0A1220" />
        </radialGradient>
        <clipPath id={ids.clip}>
          <path d={win} />
        </clipPath>
        <linearGradient id={ids.cu} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E1A2E" stopOpacity={0.85} />
          <stop offset="1" stopColor="#0E1A2E" stopOpacity={0} />
        </linearGradient>
        {gc && (
          <radialGradient id={ids.glass} gradientUnits="userSpaceOnUse" cx={f1(gc.x)} cy={f1(gc.y)} r={f1(gR)}>
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.7} />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
          </radialGradient>
        )}
        {gc && (
          <mask id={ids.pool} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect width={W} height={H} fill={`url(#${ids.glass})`} />
          </mask>
        )}
      </defs>
      {skirt}
      <path d={polyD(top)} fill={`url(#${ids.top})`} />
      {pool && (
        <g>
          <defs>
            <radialGradient id={ids.pool + 'p'} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform={pool}>
              <stop offset="0" stopColor={MAT_LIT} stopOpacity={0.3} />
              <stop offset="0.45" stopColor={MAT_LIT} stopOpacity={0.17} />
              <stop offset="1" stopColor={MAT_LIT} stopOpacity={0} />
            </radialGradient>
          </defs>
          <path d={polyD(top)} fill={`url(#${ids.pool}p)`} />
        </g>
      )}
      <g mask={gc ? `url(#${ids.pool})` : undefined}>
        {gl.length > 0 && <path d={gl.join(' ')} stroke="#8FA8C6" strokeWidth={1.2} opacity={0.2 * grid} fill="none" />}
        {gM.length > 0 && <path d={gM.join(' ')} stroke="#AFC5DE" strokeWidth={1.8} opacity={0.26 * grid} fill="none" />}
      </g>
      {glow && (
        <g>
          <defs>
            <radialGradient id={ids.hot} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform={glow}>
              <stop offset="0" stopColor={C.heat} stopOpacity={0.5} />
              <stop offset="0.5" stopColor={C.heat} stopOpacity={0.22} />
              <stop offset="1" stopColor={C.heatDeep} stopOpacity={0} />
            </radialGradient>
          </defs>
          <path d={polyD(top)} fill={`url(#${ids.hot})`} opacity={f3(hot * flick)} />
        </g>
      )}
      {/* the coil window: dark glass over the copper turns */}
      <path d={bezelO} fill="#4C5D73" stroke={INK} strokeWidth={2.2} />
      <path d={win} fill={`url(#${ids.win})`} stroke="#22324A" strokeWidth={1.5} />
      <g clipPath={`url(#${ids.clip})`}>
        {hot > 0.01 && hotRings.map((d, i) => <path key={i} d={d} fill={i < 2 ? C.heatDeep : C.heat} opacity={0.13 * hot * flick} />)}
        <path d={coilD} fill="none" stroke="#050A12" strokeWidth={f1(wpx + 3)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={coilD} fill="none" stroke={mix(COPPER_DK, cuCol, 0.35)} strokeWidth={f1(wpx)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={coilD} fill="none" stroke={cuCol} strokeWidth={f1(wpx * 0.62)} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${f1(-wpx * 0.12)} ${f1(-wpx * 0.16)})`} />
        <path d={coilD} fill="none" stroke={mix(COPPER_LT, '#FFE6BF', hot)} strokeWidth={f1(Math.max(1, wpx * 0.18))} strokeLinecap="round" transform={`translate(${f1(-wpx * 0.24)} ${f1(-wpx * 0.3)})`} opacity={0.9} />
        {hot > 0.01 && <path d={coilD} fill="none" stroke="#FFB86B" strokeWidth={f1(wpx * 2.4)} strokeLinecap="round" opacity={0.16 * hot * flick} />}
        {/* glass: a darkening veil + a broad sheen */}
        <path d={win} fill="#0B1526" opacity={f3(lerp(0.5, 0.1, hot))} />
        {(() => {
          const g0 = labProjPoly(cam, [ax(K.x - K.win, 0, K.d + 1), ax(K.x - K.win * 0.2, 0, K.d + K.win), ax(K.x + K.win * 0.1, 0, K.d + K.win), ax(K.x - K.win, 0, K.d + 3.6)]);
          return <path d={polyD(g0)} fill="#CFE6FF" opacity={0.09} />;
        })()}
      </g>
      {haze && <rect x={0} y={f1(haze.y0)} width={W} height={f1(haze.h)} fill={`url(#${ids.cu})`} />}
      {cage && <path d={ao} fill={C.navy0} opacity={0.32} />}
      {cage && <path d={shadows} fill={C.navy0} opacity={0.3} />}
    </g>
  );
};

// =====================================================================================================================
// AC FIELD ARCS (the coil's alternating field: warm dashed loops rising up through the sample, back down outside)
// =====================================================================================================================
const ARC_AZ = [0, Math.PI, 0.95, Math.PI - 0.95];
export const LabACArcs: React.FC<{cam: Cam3; t: number; on: number; half?: 'back' | 'front' | 'all'}> = ({cam, t, on, half = 'all'}) => {
  if (on <= 0.01) return null;
  const K = LAB.COIL;
  const c0 = labProj(cam, {x: K.x, h: 4, d: K.d});
  if (!c0) return null;
  const s = c0.s;
  const fq = 2.6;
  const ph = Math.sin(2 * Math.PI * fq * t);
  const off = (Math.cos(2 * Math.PI * fq * t) / (2 * Math.PI * fq)) * 18 * s;
  const out: React.ReactNode[] = [];
  ARC_AZ.forEach((az, i) => {
    const sd = Math.sin(az);
    const isBack = sd > 0.05 || (Math.abs(sd) <= 0.05 && false);
    if (half === 'back' && !isBack) return;
    if (half === 'front' && isBack) return;
    const major = i < 2;
    [6.5, 11, 14.5].forEach((hk, j) => {
      if (!major && j === 0) return;
      const pts: P3[] = [];
      const rin = 0.9 + 0.4 * j, rout = K.r1 + 1.2 + 1.6 * j;
      for (let q = 0; q <= 40; q++) {
        const u = q / 40;
        const r = rin + (rout - rin) * (u * u * (3 - 2 * u));
        const hh = hk * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), 0.75);
        pts.push({x: K.x + Math.cos(az) * r, h: Math.max(0, hh), d: K.d + Math.sin(az) * r});
      }
      const d = projLine(cam, pts).map(lineD).join(' ');
      const a = on * (major ? 0.62 : 0.26) * (0.6 + 0.4 * Math.abs(ph)) * (1 - j * 0.15);
      const sw = Math.max(2.2, 0.26 * s);
      out.push(
        <g key={`${i}${j}`} opacity={f3(a)}>
          <path d={d} fill="none" stroke={C.heatDeep} strokeWidth={f1(sw * 2.4)} strokeLinecap="round" opacity={0.3} />
          <path d={d} fill="none" stroke={C.heat} strokeWidth={f1(sw)} strokeLinecap="round" strokeDasharray={`${f1(2.2 * s)} ${f1(1.3 * s)}`} strokeDashoffset={f1(off * (i % 2 ? -1 : 1) + j * 7)} />
        </g>,
      );
    });
  });
  return <g>{out}</g>;
};

// =====================================================================================================================
// THE CAGE
// =====================================================================================================================
/** lid opening angle (deg) for lid 0 (open) .. 1 (closed) */
const LID_OPEN = 112;
const lidAlpha = (lid: number) => LID_OPEN * (1 - clamp(lid, -0.2, 1.2));
/** the lid closing onto the cage: 0 (open) before, lands at t0 (e.g. "cage" 5.14) with a small metallic bounce */
export const labLidClose = (t: number, t0: number, dur = 0.42) => {
  if (t <= t0) {
    const x = clamp((t - (t0 - dur)) / dur);
    return x * x * x; // accelerating fall (gravity), lands at full speed
  }
  const k = t - t0;
  return 1 - 0.07 * Math.exp(-k / 0.07) * Math.abs(Math.sin(k * 26));
};
const LID_H0 = CG.h + CG.rail * 2 + 0.25;
const lidPt = (x: number, dd: number, al: number): P3 => {
  const a = (al * Math.PI) / 180;
  return {x, h: LID_H0 - dd * Math.sin(a), d: CG.d1 + dd * Math.cos(a)};
};
const Lid: React.FC<{cam: Cam3; lid: number}> = ({cam, lid}) => {
  const al = lidAlpha(lid);
  const D = CG.d1 - CG.d0;
  const R = 0.28;
  // a clear acrylic panel in a thin steel frame (the overhead camera sees straight through it)
  const panel = labProjPoly(cam, [lidPt(CG.x0, 0, al), lidPt(CG.x1, 0, al), lidPt(CG.x1, -D, al), lidPt(CG.x0, -D, al)]);
  const glint = labProjPoly(cam, [lidPt(CG.x0 + 2, 0, al), lidPt(CG.x0 + 6.5, 0, al), lidPt(CG.x0 + 1.5, -D, al), lidPt(CG.x0 - 3, -D, al)]);
  const glint2 = labProjPoly(cam, [lidPt(CG.x0 + 8, 0, al), lidPt(CG.x0 + 9.2, 0, al), lidPt(CG.x0 + 4.2, -D, al), lidPt(CG.x0 + 3, -D, al)]);
  const id = uid('lidK');
  const tb = lidPt(0, -D - 0.5, al);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={polyD(panel)} />
        </clipPath>
      </defs>
      <path d={polyD(panel)} fill="#BFE4FF" opacity={0.07} />
      <g clipPath={`url(#${id})`}>
        <path d={polyD(glint)} fill="#FFFFFF" opacity={0.1} />
        <path d={polyD(glint2)} fill="#FFFFFF" opacity={0.08} />
      </g>
      <Rod cam={cam} a={lidPt(CG.x0, 0, al)} b={lidPt(CG.x1, 0, al)} r={R + 0.05} />
      <Rod cam={cam} a={lidPt(CG.x0, 0, al)} b={lidPt(CG.x0, -D, al)} r={R} />
      <Rod cam={cam} a={lidPt(CG.x1, 0, al)} b={lidPt(CG.x1, -D, al)} r={R} />
      <Rod cam={cam} a={lidPt(CG.x0, -D, al)} b={lidPt(CG.x1, -D, al)} r={R + 0.05} />
      <Rod cam={cam} a={{...tb, x: -0.9}} b={{...tb, x: 0.9}} r={0.3} look="bright" />
    </g>
  );
};
const rail = (cam: Cam3, key: string, o: P3, hw: number, hh: number, hd: number) => (
  <Block key={key} cam={cam} o={o} u={ax(hw, 0, 0)} v={ax(0, hh, 0)} w={ax(0, 0, hd)} color="#3A495D" ink={1.6} />
);
/** back half of the cage: base rails (back + sides), back and side bars, back/side top rails, the lid while open */
export const CageBack: React.FC<{cam: Cam3; lid?: number}> = ({cam, lid = 1}) => {
  const top = CG.h + CG.rail;
  const b = CG.base;
  const cp = camPos(cam);
  // side walls: draw the one farther from the camera first
  const sides = [CG.x0, CG.x1].sort((p, q) => Math.abs(q - cp.x) - Math.abs(p - cp.x));
  return (
    <g>
      {rail(cam, 'bb', ax(0, b / 2, CG.d1), (CG.x1 - CG.x0) / 2 + 0.6, b / 2, 0.6)}
      {lidAlpha(lid) > 90 && <Lid cam={cam} lid={lid} />}
      {LAB_BAR_XS.map((x, i) => (
        <Rod key={'k' + i} cam={cam} a={{x, h: 0, d: CG.d1}} b={{x, h: top, d: CG.d1}} r={BAR_R} />
      ))}
      {rail(cam, 'tb', ax(0, top, CG.d1), (CG.x1 - CG.x0) / 2 + 0.5, CG.rail, CG.rail)}
      {sides.map((sx) => (
        <g key={sx}>
          {rail(cam, 'bs' + sx, ax(sx, b / 2, (CG.d0 + CG.d1) / 2), 0.6, b / 2, (CG.d1 - CG.d0) / 2)}
          {[...LAB_SIDE_DS].sort((p, q) => q - p).map((d, i) => (
            <Rod key={'s' + i} cam={cam} a={{x: sx, h: 0, d}} b={{x: sx, h: top, d}} r={BAR_R} />
          ))}
          <Rod cam={cam} a={{x: sx, h: 0, d: CG.d1}} b={{x: sx, h: top + CG.rail, d: CG.d1}} r={CG.postR} />
          {rail(cam, 'ts' + sx, ax(sx, top, (CG.d0 + CG.d1) / 2), CG.rail, CG.rail, (CG.d1 - CG.d0) / 2 + 0.5)}
        </g>
      ))}
    </g>
  );
};
/** front half of the cage: front corner posts, the front bar row (bars into the stage through small collars), the front
 *  top rail and the lid once it is past vertical */
export const CageFront: React.FC<{cam: Cam3; lid?: number}> = ({cam, lid = 1}) => {
  const top = CG.h + CG.rail;
  const collars = LAB_BAR_XS.map((x) => polyD(labProjPoly(cam, circle3(x, 0.02, CG.d0, BAR_R * 1.75, 14)))).join(' ');
  return (
    <g>
      <path d={collars} fill="#4A5A6E" stroke={INK} strokeWidth={1.2} />
      {LAB_BAR_XS.map((x, i) => (
        <Rod key={i} cam={cam} a={{x, h: 0, d: CG.d0}} b={{x, h: top, d: CG.d0}} r={BAR_R} />
      ))}
      {[CG.x0, CG.x1].map((sx) => (
        <Rod key={sx} cam={cam} a={{x: sx, h: 0, d: CG.d0}} b={{x: sx, h: top + CG.rail, d: CG.d0}} r={CG.postR} />
      ))}
      {rail(cam, 'tf', ax(0, top, CG.d0), (CG.x1 - CG.x0) / 2 + 0.5, CG.rail, CG.rail)}
      {lidAlpha(lid) <= 90 && <Lid cam={cam} lid={lid} />}
    </g>
  );
};

// =====================================================================================================================
// THE EXTERNAL MAGNET (N red / S blue block on an aluminium slider sled with a steel push handle) + its field lines
// =====================================================================================================================
export type MagnetSpec = {
  /** N-face centre on the floor (x, d) */
  x: number;
  d: number;
  /** direction the N face points, deg in the floor plane (0 = +d, toward the cage from the front; 90 = +x) */
  yaw?: number;
  /** field-line visibility 0..1 */
  field?: number;
  handle?: boolean;
};
const DIPOLE: {pts: V[]}[] = (() => {
  // dipole lines in magnet-local floor coords (u along the axis, v across), poles at u = +-p (N at +p)
  const p = LAB.MAGNET.len * 0.36;
  const fld = (u: number, v: number) => {
    const du = u - p, eu = u + p;
    const r = (du * du + v * v) ** 1.5, q = (eu * eu + v * v) ** 1.5;
    return {u: du / r - eu / q, v: v / r - v / q};
  };
  const out: {pts: V[]}[] = [];
  for (const phi of [0.32, 0.75, 1.25]) {
    for (const side of [-1, 1]) {
      let u = p + 0.3 * Math.cos(phi), v = side * 0.3 * Math.sin(phi);
      const pts: V[] = [];
      for (let n = 0; n < 1600; n++) {
        const f = fld(u, v);
        const l = Math.hypot(f.u, f.v) || 1;
        u += (0.06 * f.u) / l;
        v += (0.06 * f.v) / l;
        if (Math.hypot(u + p, v) < 0.3) break;
        if (Math.abs(v) > 9 || Math.abs(u) > 13) break;
        if (Math.abs(u) < LAB.MAGNET.len / 2 + 0.1 && Math.abs(v) < LAB.MAGNET.hw + 0.1) continue;
        if (n % 4 === 0) pts.push({x: u, y: v});
      }
      out.push({pts});
    }
  }
  return out;
})();
/** world point of the magnet handle's grip end (place a gloved hand here) */
export const labMagnetGrip = (m: MagnetSpec): P3 => {
  const M = LAB.MAGNET;
  const yaw = ((m.yaw ?? 0) * Math.PI) / 180;
  const A = {x: Math.sin(yaw), d: Math.cos(yaw)}, Pp = {x: Math.cos(yaw), d: -Math.sin(yaw)};
  const u = -M.len - 15, v = 2.5;
  return {x: m.x + A.x * u + Pp.x * v, h: 9, d: m.d + A.d * u + Pp.d * v};
};
export const LabMagnet: React.FC<{cam: Cam3; t: number; m: MagnetSpec; part?: 'all' | 'field' | 'body'}> = ({cam, t, m, part = 'all'}) => {
  const M = LAB.MAGNET;
  const yaw = ((m.yaw ?? 0) * Math.PI) / 180;
  const A = {x: Math.sin(yaw), h: 0, d: Math.cos(yaw)}; // axis toward the N face
  const Pp = {x: Math.cos(yaw), h: 0, d: -Math.sin(yaw)}; // across
  const at = (u: number, h: number, v: number): P3 => ({x: m.x + A.x * u + Pp.x * v, h, d: m.d + A.d * u + Pp.d * v});
  const hl = M.len / 2;
  const fieldK = part === 'body' ? 0 : clamp(m.field ?? 0);
  const fh = M.sled + M.hh;
  // field lines (in the floor plane at mid-magnet height): drawn under the magnet
  const field = fieldK > 0.01 ? (
    <g>
      {DIPOLE.map((ln, i) => {
        const pts = ln.pts.map((q) => at(q.x - hl, fh * 0.55, q.y));
        const d = projLine(cam, pts).map(lineD).join(' ');
        const c = labProj(cam, at(-hl, 0, 0));
        const s = c?.s ?? 40;
        return (
          <g key={i} opacity={fieldK * (0.75 - 0.12 * Math.floor(i / 2))}>
            <path d={d} fill="none" stroke={C.field} strokeWidth={f1(Math.max(2, 0.2 * s))} strokeLinecap="round" />
            <path d={d} fill="none" stroke="#E8FBFF" strokeWidth={f1(Math.max(1.2, 0.09 * s))} strokeLinecap="round" strokeDasharray={`${f1(0.6 * s)} ${f1(1.6 * s)}`} strokeDashoffset={f1(-t * 3.5 * s)} opacity={0.85} />
          </g>
        );
      })}
    </g>
  ) : null;
  if (part === 'field') return field;
  const cp = camPos(cam);
  // handle: from the sled's rear, rising back toward the operator
  const hA = at(-M.len - 0.7, M.sled + 0.5, 0), hB = labMagnetGrip(m);
  const sled = <Block cam={cam} o={at(-hl - 0.3, M.sled / 2, 0)} u={{x: Pp.x * (M.hw + 0.5), h: 0, d: Pp.d * (M.hw + 0.5)}} v={ax(0, M.sled / 2, 0)} w={{x: A.x * (hl + 0.6), h: 0, d: A.d * (hl + 0.6)}} color="#8C9AAC" ink={1.6} />;
  const half = (sgn: 1 | -1) => (
    <Block
      key={sgn}
      cam={cam}
      o={at(-hl + (sgn * hl) / 2, M.sled + M.hh, 0)}
      u={{x: Pp.x * M.hw, h: 0, d: Pp.d * M.hw}}
      v={ax(0, M.hh, 0)}
      w={{x: A.x * (hl / 2), h: 0, d: A.d * (hl / 2)}}
      color={sgn > 0 ? C.north : C.south}
      ink={2}
      decal={(f, mtx, c) =>
        f === '+v' && c.s > 9 ? (
          <g transform={mtx}>
            <text x="0" y="0" transform={`scale(${f3(0.02 / M.hw)} ${f3(-0.02 / (hl / 2))})`} dy="0.36em" textAnchor="middle" fontFamily='"Nunito Variable", "Nunito", system-ui, sans-serif' fontWeight={900} fontSize={100} fill="#FFFFFF" opacity={0.92}>
              {sgn > 0 ? 'N' : 'S'}
            </text>
          </g>
        ) : null
      }
    />
  );
  // the half nearer the camera is drawn last
  const nN = at(hl / 2, 0, 0), nS = at(-hl / 2, 0, 0);
  const order: (1 | -1)[] = Math.hypot(nN.x - cp.x, nN.d - cp.d) > Math.hypot(nS.x - cp.x, nS.d - cp.d) ? [1, -1] : [-1, 1];
  const handleFirst = Math.hypot(hB.x - cp.x, hB.d - cp.d) > Math.hypot(m.x - cp.x, m.d - cp.d);
  const handle = m.handle !== false ? (
    <g>
      <Rod cam={cam} a={hA} b={hB} r={0.42} look="bright" />
      <Rod cam={cam} a={add3(hA, {x: hB.x - hA.x, h: hB.h - hA.h, d: hB.d - hA.d}, 0.62)} b={add3(hB, {x: hB.x - hA.x, h: hB.h - hA.h, d: hB.d - hA.d}, 0.25)} r={0.95} look="steel" />
    </g>
  ) : null;
  const sh = polyD(labProjPoly(cam, [at(-M.len - 1.2, 0, -M.hw - 0.9), at(0.9, 0, -M.hw - 0.9), at(1.4, 0, M.hw + 1.6), at(-M.len - 0.6, 0, M.hw + 1.6)]));
  return (
    <g>
      {field}
      <path d={sh} fill={C.navy0} opacity={0.38} />
      {handleFirst && handle}
      {sled}
      {order.map((s) => half(s))}
      {!handleFirst && handle}
    </g>
  );
};

// =====================================================================================================================
// COLLECTION DISH (glass petri dish) - back / front halves so liquid can sit inside it
// =====================================================================================================================
export type DishSpec = {x: number; d: number; r: number; h: number};
export const LabDish: React.FC<{cam: Cam3; part: 'back' | 'front'; dish?: DishSpec}> = ({cam, part, dish = LAB.DISH}) => {
  const {x, d, r, h} = dish;
  const n = 64;
  const cp = camPos(cam);
  const segs: React.ReactNode[] = [];
  const wall: string[] = [];
  const rimF: V[][] = [];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const nx = Math.cos(am), nd = Math.sin(am);
    const px = x + nx * r, pd = d + nd * r;
    const facing = nx * (cp.x - px) + nd * (cp.d - pd) > 0;
    if ((part === 'front') !== facing) continue;
    const q = [ax(x + Math.cos(a0) * r, 0, d + Math.sin(a0) * r), ax(x + Math.cos(a1) * r, 0, d + Math.sin(a1) * r), ax(x + Math.cos(a1) * r, h, d + Math.sin(a1) * r), ax(x + Math.cos(a0) * r, h, d + Math.sin(a0) * r)];
    wall.push(polyD(labProjPoly(cam, q)));
    const sg = labProjSeg(cam, q[3], q[2]);
    if (sg) rimF.push(sg);
  }
  const rim = rimF.map(lineD).join(' ');
  if (part === 'back') {
    const floor = polyD(labProjPoly(cam, circle3(x, 0.05, d, r, n)));
    const sh = polyD(labProjPoly(cam, circle3(x + 0.6, 0, d + 0.4, r + 0.9, n)));
    segs.push(<path key="sh" d={sh} fill={C.navy0} opacity={0.3} />);
    segs.push(<path key="fl" d={floor} fill="#9FC4E2" opacity={0.16} stroke="#CFE6FA" strokeWidth={1.4} strokeOpacity={0.4} />);
    segs.push(<path key="w" d={wall.join(' ')} fill="#BFE0F7" opacity={0.12} />);
    segs.push(<path key="r" d={rim} stroke="#E8F6FF" strokeWidth={2.2} fill="none" opacity={0.55} />);
  } else {
    segs.push(<path key="w" d={wall.join(' ')} fill="#CFEAFB" opacity={0.16} />);
    segs.push(<path key="r" d={rim} stroke={INK} strokeWidth={4.4} fill="none" opacity={0.6} strokeLinecap="round" />);
    segs.push(<path key="r2" d={rim} stroke="#F4FBFF" strokeWidth={2.4} fill="none" opacity={0.9} strokeLinecap="round" />);
    // a vertical glint on the wall
    const g = labProjSeg(cam, ax(x - r * 0.72, 0.3, d - r * 0.69), ax(x - r * 0.72, h * 0.9, d - r * 0.69));
    if (g) segs.push(<path key="g" d={lineD(g)} stroke="#FFFFFF" strokeWidth={f1(Math.max(2, 0.35 * g[0].s))} strokeLinecap="round" opacity={0.55} />);
  }
  return <g>{segs}</g>;
};

// =====================================================================================================================
// MINIFIGURE MOLD (two-part orange silicone "book" mold; the cavity is the lab figure's exact silhouette)
// =====================================================================================================================
/** cavity loops in mold-face coords (mm, X across, D along; feet at D = -5, head at D = +5) */
const CAVITY: V[][] = (() => {
  const P = labFigureLocal();
  const k = LAB.FIG_H / FIG.H;
  const fn = (X: number, D: number) => sdField(P, 0.06, X / k, -(D / k + FIG.H / 2));
  return isoLoops(fn, {x0: -3, y0: -6, x1: 3, y1: 6}, 0.08).map((l) => l.map((p) => ({x: p.x, y: p.y})));
})();
export type MoldSpec = {x: number; d: number; open: number; fill: number; yaw?: number};
/** mold: open 0 (closed) .. 1 (lid flipped flat to the right); fill 0..1 metal level in the cavity (feet first, through
 *  the sprue at the feet end); shown solid when fill = 1 */
export const LabMold: React.FC<{cam: Cam3; t: number; mold?: Partial<MoldSpec>}> = ({cam, t, mold}) => {
  const M = LAB.MOLD;
  const x = mold?.x ?? M.x, d0 = mold?.d ?? M.d, open = clamp(mold?.open ?? 1), fill = clamp(mold?.fill ?? 0);
  const ids = {cav: uid('mdC'), met: uid('mdM'), fl: uid('mdF')};
  const th = M.th;
  const faceBase = (X: number, D: number): P3 => ({x: x + X, h: th, d: d0 + D});
  const be = (-open * Math.PI);
  // lid: hinge along d at x + hw, h = th; inner face point (X, D) of the closed lid -> rotated about the hinge
  const hx = M.hw;
  const faceLid = (X: number, D: number, off = 0): P3 => {
    const rx = X - hx, rh = off; // relative to the hinge (off = height above the inner face, into the lid)
    const c = Math.cos(be), s = Math.sin(be);
    return {x: x + hx + rx * c - rh * s, h: th + rx * -s + rh * c, d: d0 + D};
  };
  // lid block frame (half axes) from its inner face
  const lc = faceLid(0, 0, th / 2);
  const lu = {x: Math.cos(be) * M.hw, h: -Math.sin(be) * M.hw, d: 0};
  const lv = {x: -Math.sin(be) * (th / 2), h: Math.cos(be) * (th / 2), d: 0};
  const cav = (map: (X: number, D: number) => P3) => CAVITY.map((l) => polyD(labProjPoly(cam, l.map((p) => map(p.x, p.y))))).join(' ');
  const sprue = (map: (X: number, D: number) => P3) => polyD(labProjPoly(cam, [map(-0.35, -5.2), map(0.35, -5.2), map(0.35, -M.hl), map(-0.35, -M.hl)]));
  const cavB = cav(faceBase) + ' ' + sprue(faceBase);
  // the fill region (feet end first)
  const lvl = -M.hl + (M.hl + 5.3) * fill;
  const fillD = polyD(labProjPoly(cam, [faceBase(-M.hw, -M.hl), faceBase(M.hw, -M.hl), faceBase(M.hw, lvl), faceBase(-M.hw, lvl)]));
  const cb = labProj(cam, faceBase(0, 0));
  const s = cb?.s ?? 40;
  const lidInnerVisible = (() => {
    const n = {x: Math.sin(be), h: -Math.cos(be), d: 0}; // inner face normal (down when closed)
    const cp = camPos(cam), p = faceLid(0, 0);
    return dot3(n, {x: cp.x - p.x, h: cp.h - p.h, d: cp.d - p.d}) > 0;
  })();
  const cavL = cav((X, D) => faceLid(X, D, -0.01));
  const shimmer = 0.5 + 0.5 * Math.sin(t * 1.3);
  return (
    <g>
      <defs>
        <clipPath id={ids.cav}>
          <path d={cavB} clipRule="nonzero" />
        </clipPath>
        <linearGradient id={ids.met} gradientUnits="userSpaceOnUse" x1={f1((cb?.x ?? 540) - 4 * s)} y1={f1((cb?.y ?? 960) - 6 * s)} x2={f1((cb?.x ?? 540) + 4 * s)} y2={f1((cb?.y ?? 960) + 6 * s)}>
          <stop offset="0" stopColor="#F4F8FC" />
          <stop offset="0.4" stopColor={C.silver} />
          <stop offset="0.55" stopColor="#5B6C82" />
          <stop offset="0.68" stopColor={C.silverMid} />
          <stop offset="1" stopColor={C.silverDark} />
        </linearGradient>
      </defs>
      <path d={polyD(labProjPoly(cam, [ax(x - M.hw - 1, 0, d0 - M.hl - 0.6), ax(x + M.hw * (1 + 2 * open) + 1.5, 0, d0 - M.hl - 0.6), ax(x + M.hw * (1 + 2 * open) + 2.5, 0, d0 + M.hl + 1.5), ax(x - M.hw, 0, d0 + M.hl + 1.5)]))} fill={C.navy0} opacity={0.32} />
      <Block cam={cam} o={ax(x, th / 2, d0)} u={ax(M.hw, 0, 0)} v={ax(0, th / 2, 0)} w={ax(0, 0, M.hl)} color={C.mold} ink={2.2} />
      {/* cavity: a darker recess with a lit far wall */}
      <path d={cavB} fill="#C9632C" stroke={mix(C.moldDeep, C.navy0, 0.4)} strokeWidth={1.6} />
      <g clipPath={`url(#${ids.cav})`}>
        <path d={cav((X, D) => ({x: x + X + 0.32, h: th, d: d0 + D - 0.32}))} fill={mix(C.moldDeep, C.navy0, 0.25)} opacity={0.9} />
        {fill > 0.001 && (
          <g>
            <path d={fillD} fill={`url(#${ids.met})`} />
            <path d={cav((X, D) => ({x: x + X - 0.18, h: th, d: d0 + D + 0.22}))} fill="none" stroke="#FFFFFF" strokeWidth={f1(Math.max(1.2, 0.12 * s))} opacity={0.55 + 0.2 * shimmer} />
          </g>
        )}
      </g>
      {open < 0.999 && (
        <g>
          <Block cam={cam} o={lc} u={lu} v={lv} w={ax(0, 0, M.hl)} color={C.mold} ink={2.2} gloss={false} />
          {lidInnerVisible && <path d={cavL} fill={C.moldDeep} stroke={mix(C.moldDeep, C.navy0, 0.4)} strokeWidth={1.6} />}
        </g>
      )}
      {open >= 0.999 && (
        <g>
          <Block cam={cam} o={lc} u={lu} v={lv} w={ax(0, 0, M.hl)} color={C.mold} ink={2.2} gloss={false} />
          <path d={cavL} fill={C.moldDeep} stroke={mix(C.moldDeep, C.navy0, 0.4)} strokeWidth={1.6} />
        </g>
      )}
    </g>
  );
};

// =====================================================================================================================
// GLOVED HAND (the V1 blue-nitrile Weird Crew hand at true lab scale: a hand is ~185 mm long, so near the 10 mm figure
// only giant fingertips enter the frame)
// =====================================================================================================================
export const LabGlove: React.FC<{
  cam: Cam3;
  /** world point the index tip and thumb pinch (or touch) */
  at: P3;
  /** screen direction wrist -> fingers (deg) */
  ang: number;
  pose?: HandPose;
  thumbSide?: 1 | -1;
  view?: 'back' | 'palm';
  /** wrist to middle fingertip (mm) */
  handMM?: number;
  bend?: number;
}> = ({cam, at, ang, pose = HAND_RELAXED, thumbSide = 1, view = 'back', handMM = 185, bend = 0}) => {
  const p = labProj(cam, at);
  if (!p) return null;
  const L = handMM * p.s;
  const wrist = pinchWrist({x: p.x, y: p.y}, ang, L, thumbSide, pose);
  return <GloveArm wrist={wrist} ang={ang} L={L} pose={pose} thumbSide={thumbSide} view={view} bend={bend} />;
};

// =====================================================================================================================
// THE LIQUID: stream through the front bars (engine streamThroughGaps on the floor), the collected puddle
// =====================================================================================================================
export const LAB_STREAM = {
  /** the three front-bar gaps nearest the centre (floor coords: x, y = d; flow toward -d) */
  gaps: [-PITCH, 0, PITCH].map((x) => ({x, y: CG.d0, ax: 0, ay: -1, w: CG.gap})) as GapSpec[],
  share: [0.3, 0.4, 0.3],
  dest: {x: LAB.DEST.x, y: LAB.DEST.d},
  neck: 0.42,
  /** smooth-min radius (mm) */
  blend: 0.42,
  /** liquid thickness on the floor (mm) */
  thick: 0.22,
};
/** the stream in floor coordinates (mm). u 0: the whole pool inside (start), 1: all of it collected at DEST. The
 *  conserved area is pi * POOL_R^2 (= the melted figure's pool). */
export const labStreamFloor = (u: number, t: number, start?: {x: number; y: number; r: number}): StreamOut =>
  streamThroughGaps({
    start: start ?? {x: LAB.MELT.x, y: LAB.MELT.d, r: LAB.POOL_R},
    gaps: LAB_STREAM.gaps,
    share: LAB_STREAM.share,
    dest: LAB_STREAM.dest,
    u,
    t,
    drops: 2,
    blend: LAB_STREAM.blend,
    neck: LAB_STREAM.neck,
    area: Math.PI * LAB.POOL_R * LAB.POOL_R,
  });
/** floor-liquid shading: ChromeBody R (mm, the width of rim / core / bands: small = a flat thin puddle) and band */
export const LIQ_SHADE = {R: 1.6, band: 0};
/** the liquid's chrome look in the lab (a cool rim from the navy surroundings) */
export const LAB_ENV: ChromeEnv = {tint: '#6FA8E8', amt: 0.22, dir: {x: 0.7, y: -0.7}};
const pxAt = (cam: Cam3, p: P3) => labProj(cam, p)?.s ?? 40;
/** draw the stream (one depth pass, or 'all') */
export const LabStream: React.FC<{cam: Cam3; t: number; u: number; part?: 'back' | 'front' | 'all'; start?: {x: number; y: number; r: number}; warm?: number; shade?: number; band?: number}> = ({cam, t, u, part = 'all', start, warm = 0, shade = LIQ_SHADE.R, band = LIQ_SHADE.band}) => {
  const st = labStreamFloor(u, t, start);
  const prims = projectPrims(cam, floorPrims(st.prims, 0, LAB_STREAM.thick));
  const s = pxAt(cam, {x: 0, h: 0, d: 0});
  return (
    <ChromeBody prims={prims} blend={LAB_STREAM.blend * s} R={shade * s} depthSplit={part === 'all' ? undefined : {d0: CG.d0, part}} specs={2} env={LAB_ENV} warm={warm} band={band} />
  );
};

/** a puddle on the floor (floor coords x, y = d), area pi R^2: settle 0 = a plain disc (the stream's final pool),
 *  1 = a living lobed outline (lobes drift slowly; area re-solved every frame) */
export const labPuddleFloor = (o: {x: number; d: number; R: number; t: number; seed?: number; settle?: number}) => {
  const st = clamp(o.settle ?? 1), seed = o.seed ?? 3, n = 6;
  const A0 = Math.PI * o.R * o.R;
  const blend = o.R * 0.3;
  const build = (a: number): Prim[] => {
    const R = o.R * Math.sqrt(a);
    const out: Prim[] = [{k: 'c', x: o.x, y: o.d, r: R * lerp(1, 0.88, st)}];
    if (st > 0.001) {
      for (let i = 0; i < n; i++) {
        const an = (i / n) * Math.PI * 2 + 0.5 * noise1(o.t * 0.35 + i * 2.1, seed);
        const rr = R * (0.3 + 0.05 * noise1(o.t * 0.6 + i * 1.7, seed + 1));
        const dd = R * 0.62 * st;
        out.push({k: 'c', x: o.x + Math.cos(an) * dd, y: o.d + Math.sin(an) * dd, r: rr});
      }
    }
    return out;
  };
  const cal = st > 0.001 ? calibrate(build, blend, A0, 1, 0.3, 1.8, 6) : {prims: build(1), a: 1, area: A0};
  return {prims: cal.prims, blend, area: cal.area, target: A0};
};

/** LB -> MS hand-off (13.67 s): the camera and the collected puddle (floor ellipse x, d, rx, rd; seed) */
export const LAB_HANDOFF = {
  t: 13.67,
  cam: LAB_CAMS.handoff,
  shot: LAB_SHOTS.handoff,
  puddle: {x: LAB.DEST.x, d: LAB.DEST.d, rx: LAB.POOL_R, rd: LAB.POOL_R, seed: 3},
  /** the magnet, slid back a little after the collect (from MAGNET_PULL; keep the slide continuous in LB) */
  magnet: {x: LAB.MAGNET_PULL.x, d: LAB.MAGNET_PULL.d - 7, field: 0} as MagnetSpec,
};
/** the hand-off puddle as engine prims (screen px in `cam`, default LAB_HANDOFF.cam) + blend (px) + ripple rings */
export const labHandoffPuddle = (t: number, settle = 1, cam: Cam3 = LAB_HANDOFF.cam, ripple = 0.6) => {
  const P = LAB_HANDOFF.puddle;
  const pd = labPuddleFloor({x: P.x, d: P.d, R: P.rx, t, seed: P.seed, settle});
  const prims = projectPrims(cam, floorPrims(pd.prims, 0, LAB_STREAM.thick));
  const s = pxAt(cam, {x: P.x, h: 0, d: P.d});
  const ripples: string[] = [];
  const op: number[] = [];
  if (ripple > 0) {
    for (let k = 0; k < 3; k++) {
      const ph = (t * 0.55 + k / 3) % 1;
      const r = P.rx * (0.15 + 0.6 * ph);
      ripples.push(polyD(labProjPoly(cam, circle3(P.x - 0.4, LAB_STREAM.thick + 0.02, P.d - 0.3, r, 40))));
      op.push(ripple * Math.sin(Math.PI * ph) * 0.5);
    }
  }
  return {prims, blend: pd.blend * s, area: pd.area, target: pd.target, ripples, rippleOpacity: op, s};
};
export const LabHandoffPuddle: React.FC<{t: number; settle?: number; cam?: Cam3; ripple?: number; warm?: number; shade?: number; band?: number}> = ({t, settle = 1, cam = LAB_HANDOFF.cam, ripple = 0.6, warm = 0, shade = LIQ_SHADE.R, band = LIQ_SHADE.band}) => {
  // ripples grow in with the settle, so the switch from the stream's final disc (settle 0) is seamless
  const P = labHandoffPuddle(t, settle, cam, ripple * clamp(settle));
  return (
    <ChromeBody prims={P.prims} blend={P.blend} R={shade * P.s} specs={2} env={LAB_ENV} warm={warm} band={band}>
      {P.ripples.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#FFFFFF" strokeWidth={2} opacity={f3(P.rippleOpacity[i])} />
      ))}
    </ChromeBody>
  );
};

/** contact shadow under the figure (FloorOpts for LabFigure / ChromeBody) */
export const labFigureFloor = (cam: Cam3, base: P3, shadow = 0.45): FloorOpts | undefined => {
  const a = labProj(cam, {x: base.x - 2.2, h: 0, d: base.d}), b = labProj(cam, {x: base.x + 2.2, h: 0, d: base.d});
  const c = labProj(cam, {x: base.x, h: 0, d: base.d - 2.2}), e = labProj(cam, {x: base.x, h: 0, d: base.d + 2.2}), o = labProj(cam, base);
  if (!a || !b || !c || !e || !o) return undefined;
  const rx = Math.hypot(b.x - a.x, b.y - a.y) / 2, ry = Math.abs(c.y - e.y) / 2;
  return {y: o.y, cx: o.x, rx: rx * 1.15, squash: clamp(ry / Math.max(1, rx), 0.06, 1), shadow};
};

// =====================================================================================================================
// THE WORLD
// =====================================================================================================================
export type LabBodyPass = 'back' | 'front';
export const LabWorld: React.FC<{
  cam: Cam3;
  t: number;
  /** lid 0 open .. 1 closed (labLidClose) */
  lid?: number;
  /** coil energised 0..1 (warm glow + AC arcs) */
  coil?: number;
  magnet?: MagnetSpec | null;
  dish?: boolean;
  mold?: Partial<MoldSpec> | null;
  /** the figure / liquid, drawn in two depth passes around the front bar plane d = 0 */
  body?: (pass: LabBodyPass) => React.ReactNode;
  /** extra content drawn outside (after the front pass): gloved hands, pipette, tags-in-world */
  front?: React.ReactNode;
  vignette?: number;
  cage?: boolean;
}> = ({cam, t, lid = 1, coil = 0, magnet = null, dish = false, mold = null, body, front, vignette = 1, cage = true}) => (
  <g>
    <LabBackdrop cam={cam} t={t} />
    <LabStage cam={cam} t={t} coil={coil} cage={cage} />
    {dish && <LabDish cam={cam} part="back" />}
    {mold && <LabMold cam={cam} t={t} mold={mold} />}
    <LabACArcs cam={cam} t={t} on={coil} half="back" />
    {cage && <CageBack cam={cam} lid={lid} />}
    {body?.('back')}
    <LabACArcs cam={cam} t={t} on={coil} half="front" />
    {cage && <CageFront cam={cam} lid={lid} />}
    {magnet && <LabMagnet cam={cam} t={t} m={magnet} part="field" />}
    {body?.('front')}
    {dish && <LabDish cam={cam} part="front" />}
    {magnet && <LabMagnet cam={cam} t={t} m={magnet} part="body" />}
    {front}
    {vignette > 0 && <LabVignette k={vignette} />}
  </g>
);

/** convenience: the lab figure as a two-pass body (melt 0..1, warm 0..1) */
export const labFigureBody = (cam: Cam3, t: number, base: P3, melt = 0, warm = 0, shadow = 0.45) => (pass: LabBodyPass) => (
  <LabFigure cam={cam} t={t} base={base} height={LAB.FIG_H} melt={melt} warm={warm} env={LAB_ENV} floor={labFigureFloor(cam, base, shadow)} part={pass} d0={CG.d0} />
);
