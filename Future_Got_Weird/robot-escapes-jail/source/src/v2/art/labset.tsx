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
//   3 <CageBack>                        back + side bars, base rails, back/side top rails (and the lid while it is open)
//   4 <LabACArcs half="back">           the AC heating indicator (coil > 0): floor halo + warm bloom + 4 thin field loops,
//                                       all BEHIND the sample (inside the cage, in front of the back bars)
//   5 body('back')                      everything at d >= d0 (inside the cage): the figure, the pool, the stream's tail
//   6 <LabACArcs half="front">          (draws nothing: nothing of the field is drawn over the sample)
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
// CAMERAS: LAB_SHOTS (look-at specs {p, at, f}) and LAB_CAMS (Cam3): reveal (end state of labRevealCam: figure ~27 % of
//   the frame, head centred in a bar gap), meltMedium (figure = 1/3 of the frame), meltClose (~41 %), overheadAngled,
//   handoff (+ bench: a wide high view with the dish and mold; collect / mold: the MS hand beats).
//   Move between them with labCamBetween(a, b, eased u) (interpolates eye and target, not angles).
// PROPS: <LabMagnet m={{x, d, yaw?, field?}}/> (x, d = N-face centre; labMagnetGrip(m) = the handle's grip point for a
//   <LabGlove at=.../>), <LabDish part/>, <LabMold mold={{open, fill}}/>, <LabGlove/> (true scale: a hand is 185 mm, so
//   near the 10 mm figure only giant fingertips fit in frame; prefer <LabHandTool/> for on-screen hands).
// REVEAL: labRevealCam(u): u = 0 is 2.6 mm off the figure's chest (the chrome fills the frame: H1 -> LB match from
//   <ChromeSurface>), pulling straight back THROUGH the centre gap of the front bars, then
//   arcing up-left to the medium view of the cage on the stage (u = 1 = LAB_CAMS.reveal). u is log-distance linear:
//   ease it in the shot (e.g. keyS) and carry H1's velocity.
// STAGING (LB): LAB_STAGING (recommended beat times), labPullToBars(t) (HOME -> AT_BARS, clunk), magnet at
//   LAB.MAGNET_BARS for the pull then withdrawn; labMeltBase(melt, t): the figure melts WHERE IT WAS PRESSED, its pool
//   pinned behind the bars (spreads backward, never crosses d = 0) and ending exactly on LAB.MELT; then
//   <LabMeltBridge k/> / labMeltBridgePrims (k 0 = LabFigure melt 1, k 1 = LabStream u 0, both exact; area moves
//   linearly) and <LabStream u/>. test/labset.entry.tsx `Staging` renders the whole chain as one take.
// HANDS: <LabHandTool cam t tip ang handAng tool='pipette'|'tweezers' fill squeeze open enter handMM toolMM/> with the
//   presets LAB_HAND.collect / fill / lift (each carries its own tasteful scale cheat so the gloved fingertips + tool
//   read at ~650-700 px). The glove is colour-graded into the dark lab light and grounded by a soft shadow.
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
import {calibrate, floorPrims, GapSpec, scalePrim, streamThroughGaps, StreamOut, unionArea} from '../liquid/flow';
import {FIG, LabFigure, labFigureLocal, labFigureMelt, labFigurePrims} from '../labFigure';
import {GloveArm, pinchWrist, Pipette, PIPETTE, PIPETTE_GRIP} from '../../art/lab';
import {HAND_CLUTCH, HAND_RELAXED, HandPose, mixHand} from '../../dc/Hand';

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
  /** the solid figure pressed against the front bars (its front touches the bars); x nudged so that in meltMedium
   *  its head sits centred in the gap (the billboarded figure vs the leaning bars) */
  AT_BARS: {x: 0.42, h: 0, d: 1.15} as P3,
  /** where it melts: its pool (r = POOL_R) then reaches from just behind the bars to the middle of the cage */
  MELT: {x: 0, h: 0, d: 5.6} as P3,
  /** the melted pool's radius (labPoolCircle at melt 1 for a 10 mm figure: 5.04) = the stream's conserved disc */
  POOL_R: 5.0,
  STAGE: {x0: -70, x1: 70, d0: -48, d1: 72, th: 6, r: 8},
  CAGE: {x0: -9.6, x1: 9.6, d0: 0, d1: 13, h: 14, pitch: PITCH, barR: BAR_R, gap: PITCH - 2 * BAR_R, postR: 0.42, rail: 0.36, base: 0.55},
  COIL: {x: 0, d: 6.5, r0: 1.2, r1: 6.3, turns: 5, wire: 0.38, h: -0.85, win: 7.4},
  MAGNET: {hw: 2.4, len: 5.6, hh: 1.5, sled: 0.45},
  /** the magnet's N face for the solid pull-to-the-bars beat (front, a little further out: it stays a readable
   *  foreground prop in meltMedium instead of a giant block) */
  MAGNET_BARS: {x: -4, d: -19.5, yaw: 12},
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
  /** reveal end: the figure-in-cage, 3/4 from the left: figure ~27 % of the frame height (feet y ~1310), its head
   *  centred in a bar gap (reads "too wide to fit" at phone size), the whole front of the cage across the frame and
   *  the open lid above (it closes on "cage") */
  reveal: {p: {x: -12, h: 15, d: -40}, at: {x: 0.4, h: 7.0, d: 5.5}, f: 2500} as LabShot,
  /** the melt, medium: figure = 1/3 of the frame height (~620 px, feet y ~1280), head centred in a bar gap, coil
   *  window under it, top rail at y ~315 (captions may sit over the bars above it) */
  meltMedium: {p: {x: -12.5, h: 11, d: -36}, at: {x: 0, h: 5.2, d: 5.6}, f: 2750} as LabShot,
  /** the melt, close: figure ~41 % of the frame, low and nearly frontal, the body centred in a bar gap */
  meltClose: {p: {x: -7.8, h: 7, d: -20}, at: {x: 0, h: 4.0, d: 5.6}, f: 2100} as LabShot,
  /** angled overhead: the barrier, the liquid inside, the destination and the magnet outside all visible */
  overheadAngled: {p: {x: -8, h: 46, d: -32}, at: {x: 0, h: 1.5, d: -3}, f: 1950} as LabShot,
  /** the hand-off: tracking the collected puddle outside the cage (the bars behind it, the magnet below it) */
  handoff: {p: {x: -4, h: 32, d: -30}, at: {x: 0, h: 0, d: -6.4}, f: 2000} as LabShot,
  /** (extra) a wide high view of the bench: cage, dish (left) and mold (right) - for MS staging */
  bench: {p: {x: 0, h: 62, d: -62}, at: {x: 0, h: 0, d: -3}, f: 2000} as LabShot,
  /** (MS) the collection beat: a little wider and higher than the hand-off, so the gloved hand + pipette (cheated
   *  scale, LAB_HAND.collect) enter from the lower right and the puddle stays the subject */
  collect: {p: {x: -6, h: 38, d: -40}, at: {x: 2.5, h: 0, d: -3.5}, f: 2000} as LabShot,
  /** (MS) the mold beat: the open two-part mold to the right of the cage, the pipette filling it (LAB_HAND.fill) */
  mold: {p: {x: 4, h: 26, d: -38}, at: {x: 13, h: 0, d: -14}, f: 2300} as LabShot,
};
export const LAB_CAMS = {
  reveal: shotCam(LAB_SHOTS.reveal),
  meltMedium: shotCam(LAB_SHOTS.meltMedium),
  meltClose: shotCam(LAB_SHOTS.meltClose),
  overheadAngled: shotCam(LAB_SHOTS.overheadAngled),
  handoff: shotCam(LAB_SHOTS.handoff),
  bench: shotCam(LAB_SHOTS.bench),
  collect: shotCam(LAB_SHOTS.collect),
  mold: shotCam(LAB_SHOTS.mold),
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
const COPPER = '#C8743A', COPPER_LT = '#F6B57C';
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
  // the coil's own warm glow (inside the window, under the glass) and the soft heat spill on the mat
  const coreGlow = hot > 0.01 ? affGrad(cam, {x: K.x, h: K.h, d: K.d}, K.r1 * 1.05) : null;
  const glow = hot > 0.01 ? affGrad(cam, {x: K.x, h: 0, d: K.d}, 15) : null;
  // copper reads as a subdued, premium spiral under smoked glass (no hard black separations): it warms when energised
  const cuBody = mix(mix(COPPER, C.navy1, 0.42), '#E08448', hot * 0.42);
  const cuLit = mix(mix(COPPER_LT, C.navy1, 0.3), '#FFD9A8', hot);
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
              <stop offset="0" stopColor={C.heat} stopOpacity={0.34} />
              <stop offset="0.5" stopColor={C.heat} stopOpacity={0.12} />
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
        {coreGlow && (
          <g>
            <defs>
              <radialGradient id={ids.hot + 'c'} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform={coreGlow}>
                <stop offset="0" stopColor="#FFC27A" stopOpacity={0.55} />
                <stop offset="0.55" stopColor={C.heat} stopOpacity={0.3} />
                <stop offset="1" stopColor={C.heatDeep} stopOpacity={0.08} />
              </radialGradient>
            </defs>
            <path d={win} fill={`url(#${ids.hot}c)`} opacity={f3(hot * flick)} />
          </g>
        )}
        <path d={coilD} fill="none" stroke="#08111E" strokeWidth={f1(wpx * 1.08)} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
        <path d={coilD} fill="none" stroke={cuBody} strokeWidth={f1(wpx * 0.78)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={coilD} fill="none" stroke={cuLit} strokeWidth={f1(Math.max(0.8, wpx * 0.16))} strokeLinecap="round" transform={`translate(${f1(-wpx * 0.14)} ${f1(-wpx * 0.2)})`} opacity={0.34 + 0.22 * hot} />
        {/* glass: a darkening veil + a broad sheen */}
        <path d={win} fill="#0A1424" opacity={f3(lerp(0.6, 0.36, hot))} />
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
// AC FIELD (the coil's alternating field, drawn as a clean premium indicator: a warm bloom around the sample + a few
// thin, elegant field loops BEHIND it, rising through the sample and returning outside the coil; a soft light pulse
// travels along each loop. Line widths are in screen px (they do not grow with the camera), so a close-up stays clean.)
// =====================================================================================================================
/** loop azimuths (rad, in the floor plane around the coil axis; sin > 0 = behind the sample) and peak heights (mm) */
const ARC_LOOPS: {az: number; hk: number; rout: number}[] = [
  {az: 0.42, hk: 10.5, rout: 8.2},
  {az: Math.PI - 0.42, hk: 10.5, rout: 8.2},
  {az: 0.72, hk: 6.8, rout: 6.6},
  {az: Math.PI - 0.72, hk: 6.8, rout: 6.6},
];
const arcPts = (L: {az: number; hk: number; rout: number}): P3[] => {
  const K = LAB.COIL, pts: P3[] = [];
  for (let q = 0; q <= 48; q++) {
    const u = q / 48;
    const r = 0.6 + (L.rout - 0.6) * (u * u * (3 - 2 * u));
    const hh = L.hk * Math.pow(Math.sin(Math.PI * u), 0.8);
    pts.push({x: K.x + Math.cos(L.az) * r, h: Math.max(0, hh), d: K.d + Math.sin(L.az) * r});
  }
  return pts;
};
/** on 0..1. half 'back' (or 'all') = floor halo + bloom + loops (draw after <CageBack>, before the body); 'front'
 *  draws nothing (kept for API compatibility: nothing of the field is drawn over the sample) */
export const LabACArcs: React.FC<{cam: Cam3; t: number; on: number; half?: 'back' | 'front' | 'all'}> = ({cam, t, on, half = 'all'}) => {
  if (on <= 0.01) return null;
  const K = LAB.COIL;
  const c0 = labProj(cam, {x: K.x, h: 3.2, d: K.d});
  if (!c0) return null;
  const s = c0.s;
  const ids = {b: uid('acB'), f: uid('acF')};
  // AC: the field itself alternates far too fast to see (~50 kHz): show it as a steady, gently breathing presence
  const breathe = 0.86 + 0.14 * Math.sin(2 * Math.PI * 1.3 * t);
  const out: React.ReactNode[] = [];
  if (half !== 'front') {
    const r = clamp(7.5 * s, 60, 900);
    out.push(
      <g key="bloom" opacity={f3(on * breathe)}>
        <defs>
          <radialGradient id={ids.b} gradientUnits="userSpaceOnUse" cx={f1(c0.x)} cy={f1(c0.y)} r={f1(r)}>
            <stop offset="0" stopColor="#FFB070" stopOpacity={0.32} />
            <stop offset="0.45" stopColor={C.heat} stopOpacity={0.15} />
            <stop offset="1" stopColor={C.heatDeep} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={f1(c0.x)} cy={f1(c0.y)} rx={f1(r)} ry={f1(r * 1.05)} fill={`url(#${ids.b})`} />
      </g>,
    );
    const core = clamp(0.07 * s, 1.6, 3.4), halo = core * 3.2;
    ARC_LOOPS.forEach((L, i) => {
      const d = projLine(cam, arcPts(L)).map(lineD).join(' ');
      if (!d) return;
      const a = on * (i < 2 ? 1 : 0.7);
      // one soft light pulse per loop, rising through the sample and out (two pulses phase-shifted per side)
      const ph = (t * 0.55 + i * 0.37) % 1;
      out.push(
        <g key={'l' + i} opacity={f3(a)}>
          <path d={d} fill="none" stroke={C.heatDeep} strokeWidth={f1(halo)} strokeLinecap="round" opacity={0.16 * breathe} />
          <path d={d} fill="none" stroke={C.heat} strokeWidth={f1(core)} strokeLinecap="round" opacity={0.42 * breathe} />
          <path d={d} fill="none" stroke="#FFE3BF" strokeWidth={f1(core * 1.15)} strokeLinecap="round" pathLength={100} strokeDasharray="10 90" strokeDashoffset={f1(-ph * 100 + 10)} opacity={0.85 * Math.sin(Math.PI * ph)} />
        </g>,
      );
    });
  }
  if (half !== 'front') {
    // a faint warm halo hugging the floor around the sample's base (under the body: nothing is drawn in front of it)
    const g = affGrad(cam, {x: K.x, h: 0.05, d: K.d}, 6.5);
    if (g)
      out.unshift(
        <g key="halo" opacity={f3(on * breathe * 0.8)}>
          <defs>
            <radialGradient id={ids.f} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform={g}>
              <stop offset="0.35" stopColor="#FFB070" stopOpacity={0.16} />
              <stop offset="1" stopColor={C.heatDeep} stopOpacity={0} />
            </radialGradient>
          </defs>
          <path d={polyD(labProjPoly(cam, circle3(K.x, 0.05, K.d, 6.5, 40)))} fill={`url(#${ids.f})`} />
        </g>,
      );
  }
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
// STAGING: pull to the bars, the pinned melt, and the melt -> stream bridge
// =====================================================================================================================
/** Recommended LB staging (film seconds, keyed to the narration; the shot may shift them). The figure is pulled against
 *  the bars by the magnet, the magnet is withdrawn (the solid stays put), then it melts WHERE IT STANDS: the bars stop
 *  the liquid (gallium's surface tension + oxide skin hold a mm-deep puddle back from 1.2 mm gaps unless a field pulls
 *  it), so the pool spreads BACKWARD from the bars (labMeltBase) and ends exactly on LAB.MELT, never crossing d = 0.
 *  Then labMeltBridge (k 0 -> 1) turns the melt-1 pool into the stream's start disc, and LabStream (u) takes over. */
export const LAB_STAGING = {
  /** magnet slides in from the front, the solid figure slides HOME -> AT_BARS, clunk on "bars" (T 6.89) */
  pull: {t0: 6.2, hit: 6.89},
  /** the magnet is withdrawn (slides back out toward the viewer); the solid figure stays pressed at the bars */
  withdraw: {t0: 7.05, t1: 7.55, d: LAB.MAGNET_PULL.d - 22},
  /** coil on just before "MELTED" (7.84); melt 0 -> 1 with the pool pinned behind the bars */
  coilOn: 7.6,
  melt: {t0: 7.84, t1: 10.4},
  /** the bridge (figure pool -> stream disc), while the camera rises to the overhead */
  bridge: {t0: 10.4, t1: 10.9},
  /** the magnet returns outside the front bars, then the stream (u 0 -> 1) on "slipped ... through the bars" */
  magnetIn: {t0: 11.3, t1: 11.8},
  stream: {t0: 11.8, t1: 13.35},
};
/** the solid figure dragged from HOME to the bars by the magnet: accelerating (the pull grows as it nears), a hard stop
 *  at `hit` with a tiny metallic rebound. Returns the base and a clunk impulse 0..1 (for a squash / SFX / bar shake). */
export const labPullToBars = (t: number, t0: number = LAB_STAGING.pull.t0, hit: number = LAB_STAGING.pull.hit, from: P3 = LAB.HOME) => {
  const to = LAB.AT_BARS;
  if (t <= hit) {
    const x = clamp((t - t0) / Math.max(1e-3, hit - t0));
    const e = x * x * (0.35 + 0.65 * x); // slow start, arrives at full speed
    return {base: lerp3(from, to, e), clunk: 0};
  }
  const k = t - hit;
  const rb = 0.16 * Math.exp(-k / 0.06) * Math.abs(Math.sin(k * 38));
  return {base: {...to, d: to.d + rb}, clunk: Math.exp(-k / 0.08)};
};
/** pool depth radius (mm, along d) of the melting figure (matches labFigurePrims' floor disc: rd = 0.9 R) */
const poolRd = (melt: number, t: number) => labFigureMelt(melt, t).poolR * (LAB.FIG_H / FIG.H) * 0.9;
/** the pinned melt: where to stand the melting figure so its pool never crosses the bar plane. melt 0: `from`
 *  (AT_BARS); the pool's front edge stays put behind the bars while it spreads backward; melt 1: exactly LAB.MELT
 *  (= the stream's start disc centre). Use as LabFigure's / labFigureBody's base. */
export const labMeltBase = (melt: number, t: number, from: P3 = LAB.AT_BARS): P3 => {
  const front = LAB.MELT.d - poolRd(1, t);
  const d = Math.max(from.d, front + poolRd(clamp(melt), t));
  const u = clamp((d - from.d) / Math.max(1e-6, LAB.MELT.d - from.d));
  return {x: lerp(from.x, LAB.MELT.x, u), h: 0, d: melt >= 1 ? LAB.MELT.d : d};
};

/** melt -> stream bridge prims (screen px in cam). k 0 = LabFigure (melt 1, at `base`) exactly, k 1 = LabStream (u 0)
 *  exactly. Every figure prim is 'mix'-ed into the stream's floor disc (the lump sinks and flattens into the pool) with
 *  its blend going to 0 (a hard min: identical copies add nothing at k = 1); every other stream prim grows out of an
 *  "empty" prim (a negative-radius circle at the shared pool centre that never touches the surface) and keeps its own
 *  blend. Stream prims are folded first, so both ends are exact. In between, one global scale about the pool centre
 *  is solved so the visible area moves linearly from the figure's to the stream's (no dip, no pump). */
export const labMeltBridgePrims = (cam: Cam3, t: number, k: number, base: P3 = LAB.MELT) => {
  const e = clamp(k);
  const A = labFigurePrims(cam, base, LAB.FIG_H, 1, t);
  const st = labStreamFloor(0, t, {x: base.x, y: base.d, r: LAB.POOL_R});
  const B = projectPrims(cam, floorPrims(st.prims, 0, LAB_STREAM.thick));
  const s = pxAt(cam, base);
  const blendB = LAB_STREAM.blend * s;
  const c = labProj(cam, {x: base.x, h: LAB_STREAM.thick * 0.5, d: base.d}) ?? {x: 540, y: 960};
  const off = 2.5 * Math.max(A.blend, blendB, 2);
  const empty = (z: number): Prim => ({k: 'c', x: c.x, y: c.y, r: -off, z});
  // the stream's main floor disc (largest affine disc) = where the figure's material goes
  const affA = (p: Prim) => (p.k === 'aff' ? Math.abs(p.ux * p.vy - p.uy * p.vx) : 0);
  let main = 0;
  B.forEach((p, i) => {
    if (affA(p) > affA(B[main])) main = i;
  });
  const disc: Prim | undefined = B[main];
  const ea = ss(e, 0, 0.8), eb = ss(e, 0.2, 1);
  const build = (sc: number): Prim[] => {
    const raw: Prim[] = [
      // (the main disc itself also grows out of the empty prim, faster: the figure's prims flatten into it)
      ...B.map((p, i): Prim => ({k: 'mix', a: empty(base.d), b: p, t: i === main ? ss(e, 0, 0.5) : eb, z: p.z ?? base.d, blend: p.blend ?? blendB})),
      ...A.prims.map((p): Prim => ({k: 'mix', a: {...p, g: undefined}, b: disc ?? empty(base.d), t: ea, z: base.d, blend: lerp(p.blend ?? A.blend, 0, ea)})),
    ];
    return Math.abs(sc - 1) < 1e-6 ? raw : raw.map((p) => scalePrim(p, c.x, c.y, sc));
  };
  const blend = lerp(A.blend, blendB, e);
  let prims = build(1);
  const w = ss(e, 0, 0.12) * (1 - ss(e, 0.88, 1));
  if (w > 0.001) {
    // area target: linear between the figure's (k 0) and the stream's (k 1) visible areas; solved on a scale factor
    const aA = unionArea(A.prims, A.blend), aB = unionArea(B, blendB);
    const target = lerp(aA, aB, e);
    const cur = unionArea(prims, blend);
    if (cur > 1) {
      // build(q): q is an AREA factor (scalePrim)
      const cal = calibrate(build, blend, target, target / cur, 0.3, 4, 6);
      const sc = 1 + (cal.a - 1) * w;
      prims = build(sc);
    }
  }
  return {prims, blend, R: lerp(2.4 * A.k, LIQ_SHADE.R * s, e), band: lerp(1, LIQ_SHADE.band, e), s};
};
/** the bridge as a drawable two-pass body (k <= 0 draws <LabFigure melt 1>, k >= 1 draws <LabStream u 0>) */
export const LabMeltBridge: React.FC<{cam: Cam3; t: number; k: number; part?: 'back' | 'front' | 'all'; warm?: number; base?: P3}> = ({cam, t, k, part = 'all', warm = 0, base = LAB.MELT}) => {
  if (k <= 0)
    return <LabFigure cam={cam} t={t} base={base} height={LAB.FIG_H} melt={1} warm={warm} env={LAB_ENV} floor={labFigureFloor(cam, base)} part={part} d0={CG.d0} />;
  if (k >= 1) return <LabStream cam={cam} t={t} u={0} part={part} warm={warm} start={{x: base.x, y: base.d, r: LAB.POOL_R}} />;
  const b = labMeltBridgePrims(cam, t, k, base);
  return (
    <ChromeBody prims={b.prims} blend={b.blend} R={b.R} band={b.band} specs={2} env={LAB_ENV} warm={warm} floor={k < 0.5 ? labFigureFloor(cam, base) : undefined} depthSplit={part === 'all' ? undefined : {d0: CG.d0, part}} />
  );
};
/** convenience: the bridge as a LabWorld body render prop */
export const labMeltBridgeBody = (cam: Cam3, t: number, k: number, warm = 0) => (pass: LabBodyPass) => <LabMeltBridge cam={cam} t={t} k={k} part={pass} warm={warm} />;

// =====================================================================================================================
// THE SCIENTIST'S HAND + TOOL (cheated scale). A real hand (~185 mm) next to a 10 mm figure is a giant blob, so the
// hand and its tool are drawn at a tasteful cheat (LAB_HAND.handMM, ~1/9 scale): the gloved fingertips and the tool
// read clearly while the puddle / figure stays the subject. The glove is graded darker and cooler than V1's bright
// nitrile so it sits in the dark miniature-film light (key from the upper left, cool rim), with a soft contact shadow.
// =====================================================================================================================
export type LabToolKind = 'pipette' | 'tweezers' | 'none';
export const LAB_HAND = {
  /** wrist -> middle fingertip (mm, cheated) */
  handMM: 17,
  /** transfer pipette tip -> bulb end (mm, cheated) */
  pipetteMM: 21,
  /** tweezers tip -> joint (mm, cheated) */
  tweezersMM: 15,
  /** MS collection beat (cam LAB_CAMS.collect / handoff): the pipette tip dips into the hand-off puddle from the upper
   *  right; the hand pinches the bulb */
  collect: {tip: {x: 1.4, h: 0.3, d: -6.6} as P3, ang: -76, handAng: 186, handMM: 15, toolMM: 19, thumbSide: -1 as 1 | -1},
  /** MS mold beat (cam LAB_CAMS.mold): the pipette fills the open mold through its sprue (feet end). Each preset
   *  carries its own cheat (handMM / toolMM): the hand reads ~650-700 px long on screen in its camera */
  fill: {tip: {x: 13, h: LAB.MOLD.th + 0.4, d: LAB.MOLD.d - LAB.MOLD.hl + 0.6} as P3, ang: -112, handAng: -14, handMM: 10.5, toolMM: 12.5, thumbSide: 1 as 1 | -1},
  /** MS lift-out: tweezers pinch the re-formed figure's head in the opened mold */
  lift: {tip: {x: 13, h: LAB.MOLD.th + 0.6, d: LAB.MOLD.d + 4.2} as P3, ang: -52, handAng: 210, handMM: 10.5, toolMM: 9.5, thumbSide: -1 as 1 | -1},
};
/** grade for the glove: darker, slightly desaturated, cool (feColorMatrix rows) */
const GLOVE_GRADE = '0.5 0.14 0.06 0 0.02  0.1 0.56 0.1 0 0.025  0.08 0.18 0.56 0 0.04  0 0 0 1 0';
/** steel tweezers in screen space: tip at `tip`, joint at angle `ang` (deg, tip -> joint), length px, open 0..1 */
const Tweezers: React.FC<{tip: V; ang: number; len: number; open: number}> = ({tip, ang, len, open}) => {
  const a = (ang * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const gap = len * 0.035 * clamp(open);
  const id = uid('twz');
  const prong = (sd: 1 | -1) => {
    const P = (u: number, v: number) => `${f1(tip.x + ux * u * len + nx * v)},${f1(tip.y + uy * u * len + ny * v)}`;
    const w0 = len * 0.008, w1 = len * 0.03, sp = sd * (gap + len * 0.002);
    // a flat prong: narrow at the tip, wider at the joint, bowed outward (the spring)
    return `M${P(0, sp - sd * w0)} Q${P(0.5, sp + sd * len * 0.05)} ${P(1, sd * len * 0.024)} L${P(1, sd * (len * 0.024 + w1))} Q${P(0.5, sp + sd * (len * 0.05 + w1 * 1.4))} ${P(0, sp + sd * w0)} Z`;
  };
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f1(tip.x + nx * 30)} y1={f1(tip.y + ny * 30)} x2={f1(tip.x - nx * 30)} y2={f1(tip.y - ny * 30)}>
          <stop offset="0" stopColor="#E8EFF6" />
          <stop offset="0.45" stopColor="#9AA9BA" />
          <stop offset="1" stopColor="#4A5869" />
        </linearGradient>
      </defs>
      {([1, -1] as const).map((sd) => (
        <path key={sd} d={prong(sd)} fill={`url(#${id})`} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      ))}
      <circle cx={f1(tip.x + ux * len * 1.01)} cy={f1(tip.y + uy * len * 1.01)} r={f1(len * 0.034)} fill="#7D8CA0" stroke={INK} strokeWidth={2.2} />
    </g>
  );
};
/** a gloved hand holding a tool, at a cheated bench scale. `tip` is the tool's working point in the world. */
export const LabHandTool: React.FC<{
  cam: Cam3;
  t: number;
  tip: P3;
  /** screen angle tip -> tool body (deg; -90 = straight up) */
  ang: number;
  /** screen direction wrist -> fingers (deg) */
  handAng: number;
  tool?: LabToolKind;
  /** pipette: silver fill 0..1, bulb squeeze 0..1 */
  fill?: number;
  squeeze?: number;
  /** tweezers: open 0..1 */
  open?: number;
  handMM?: number;
  toolMM?: number;
  thumbSide?: 1 | -1;
  /** entry 0..1: slides the hand + tool in from off-frame along the tool axis (0 = fully out) */
  enter?: number;
  grade?: number;
  shadow?: number;
}> = ({cam, t, tip, ang, handAng, tool = 'pipette', fill = 0, squeeze = 0, open = 0.4, handMM = LAB_HAND.handMM, toolMM, thumbSide = -1, enter = 1, grade = 1, shadow = 0.5}) => {
  const p = labProj(cam, tip);
  if (!p) return null;
  const a = (ang * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const lenMM = toolMM ?? (tool === 'tweezers' ? LAB_HAND.tweezersMM : LAB_HAND.pipetteMM);
  const len = lenMM * p.s;
  // slide in along the tool axis
  const outK = (1 - ss(clamp(enter), 0, 1)) * len * 1.6;
  const tp: V = {x: p.x + ux * outK, y: p.y + uy * outK};
  const L = handMM * p.s;
  // grip point on the tool (pipette: the bulb; tweezers: 60 % up)
  const gk = tool === 'pipette' ? PIPETTE_GRIP / PIPETTE.bulb1 : tool === 'tweezers' ? 0.6 : 0;
  const grip: V = {x: tp.x + ux * len * gk, y: tp.y + uy * len * gk};
  const pose = tool === 'tweezers' ? mixHand(HAND_RELAXED, HAND_CLUTCH, 0.35 + 0.3 * (1 - clamp(open))) : mixHand(HAND_RELAXED, HAND_CLUTCH, 0.25 + 0.35 * clamp(squeeze));
  const wrist = pinchWrist(grip, handAng, L, thumbSide, pose);
  const sc = len / PIPETTE.bulb1;
  const gid = uid('lhG'), sid = uid('lhS');
  // contact shadow: a soft blob on the stage under the hand, offset by the key light
  const sh = labProj(cam, {x: tip.x + 4, h: 0, d: tip.d + 3});
  const toolNode =
    tool === 'pipette' ? <Pipette tip={tp} ang={ang} sc={sc} fill={fill} squeeze={squeeze} t={t} part="all" /> : tool === 'tweezers' ? <Tweezers tip={tp} ang={ang} len={len} open={open} /> : null;
  return (
    <g>
      <defs>
        <filter id={gid} x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={grade > 0 ? GLOVE_GRADE : '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0'} />
        </filter>
        {sh && (
          <radialGradient id={sid}>
            <stop offset="0" stopColor={C.navy0} stopOpacity={0.5} />
            <stop offset="1" stopColor={C.navy0} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      {sh && shadow > 0 && enter > 0.05 && <ellipse cx={f1(sh.x + L * 0.25)} cy={f1(sh.y)} rx={f1(L * 0.55)} ry={f1(L * 0.22)} fill={`url(#${sid})`} opacity={f3(shadow * ss(enter, 0.3, 1))} />}
      {toolNode}
      <g filter={`url(#${gid})`}>
        <GloveArm wrist={wrist} ang={handAng} L={L} pose={pose} thumbSide={thumbSide} view="back" />
      </g>
    </g>
  );
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
    {cage && <CageBack cam={cam} lid={lid} />}
    <LabACArcs cam={cam} t={t} on={coil} half="back" />
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
