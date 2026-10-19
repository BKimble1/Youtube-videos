// THE LAST CHOICE R2 — the Crew rig.
//
// A small 3D skeleton (R1's proportions: 440 units tall at s = 1, pelvis 165 up) solved in a ground-aligned frame
// (x = screen right, y = down, z = toward the camera, horizontally), then turned into the view: camera PITCH (looking
// down/up at the figure) rotates every point and every basis about the root, and a screen rotation keeps the figure's
// vertical on the scene's vertical (perspective tilt, camera roll). Everything that is drawn — torso cross-sections,
// the head (skull + jaw + nose as projected ellipsoids, so profiles have a chin and a nose), hair masses, limbs, hands,
// props — is derived from those 3D points, so any yaw/pitch shows a consistent person.
//
// R1 defects fixed here (verified in R1's actor.tsx): no round end-caps or filled disks at the shoulders (sleeves
// start inside the torso with square ends, so the join hides in the shirt), no ellipse "doll" hands (see hands.tsx),
// hands and held objects drawn in the arm's own space, cel shadow + rim light from the scene's light, contact shadows.
import React from 'react';
import {C, BLOOD} from '../../theme';
import {Look} from './looks';
import {V2, V3, add3, sub3, mul3, dot3, cross3, len3, norm3, rotAxis, rad, lerp, lerp3, clamp, rnd, smoothPath, polyPath, pt, f2} from '../../kit/math';
import {handGlyph, HandShape} from './hands';
import {blobPath, tearPath, ellipsoid2, ang2} from './util';
import {mix} from '../engine/color';
import {satchelParts, Satchel} from './gear';

// ------------------------------------------------------------------ dimensions (rig units at s = 1)
export const HIP_H = 165, HIP_X = 33, THIGH = 78, SHIN = 77, ANKLE_H = 10, LEG_W = 38;
export const SH_H = 127, SH_X = 66, UPPER = 84, FORE = 78, ARM_W = 30;
export const NECK_H = 140, HEAD_UP = 67, HEAD_R = 58, HEAD_RY = 62;
const TORSO: [number, number, number][] = [[-15, 66, 36], [25, 67, 37], [80, 72, 40], [SH_H, 76, 40]];

export type Mouth = 'smile' | 'grin' | 'flat' | 'o' | 'smirk' | 'frown' | 'hmm' | 'talk' | 'grit' | 'open' | 'pain' | 'sad' | 'pant' | 'soft' | 'breath';
export type Face = {
  brows?: number; worry?: number; mouth?: Mouth; open?: number;
  /** upper-lid closure 0 (open) … 1 (closed) — smooth, works at close-up scale. Unset = FACE_REST_LID (a relaxed lid
   *  over the top of the iris); 0 = eyes fully open (fear, shock) */
  lid?: number; lids?: number; squint?: number; lookX?: number; lookY?: number;
  /** pupils lose focus (drift apart, dilate) 0 … 1 */
  unfocus?: number; blink?: boolean; closed?: boolean;
  /** pupil size (1 = design; < 1 contracted: fear, shock; > 1 dilated) */
  pupil?: number;
  /** one brow up, the other down (−1 … 1, + raises the character's right brow): doubt, a wince, a realisation */
  browAsym?: number;
  /** extra upper-lid closure per eye (the character's left, right), on top of `lid`: a wince, one eye swelling shut */
  lidLR?: [number, number];
};
/** The resting upper lid when a face does not set `lid` (R2 rested at 0: every unset face was wide-eyed). */
export const FACE_REST_LID = 0.15;
/** Body-local point relative to the root (feet centre on the ground), rig units at s = 1: r = character's right, u = up, f = forward. */
export type Loc = {r: number; u: number; f: number};
export type ArmT = {
  fk?: {fwd: number; out: number; bend: number}; local?: Loc; abs?: V3; pole?: Loc; w?: number; palm?: Loc;
  /** hand orientation independent of the forearm (a wrist bent to plant a palm, grab a ledge): the fingers' direction
   *  and the palm's facing, body-local (`fingers`, `palm`) or in the unpitched drawing frame (`fingersAbs`, `palmAbs`,
   *  set by the sprite from world directions); `orientW` fades it in (default 1 when given) */
  fingers?: Loc; fingersAbs?: V3; palmAbs?: V3; orientW?: number;
};
export type LegT = {fk?: {fwd: number; knee: number}; local?: Loc; abs?: V3; pole?: Loc; pitch?: number; w?: number};
export type LimbId = 'armL0' | 'armL1' | 'armR0' | 'armR1' | 'legL0' | 'legL1' | 'legR0' | 'legR1';
export type Decal = {limb: LimbId; u: number; kind: 'tear' | 'blood' | 'bandage' | 'scrape' | 'dirt'; size?: number; seed?: number; amt?: number};
export type Stain = {phi: number; h: number; size: number; amt?: number; seed?: number; kind?: 'blood' | 'dirt' | 'tear'};
export type Damage = {
  browCut?: {side: 1 | -1; amt: number}; noseBleed?: number; lipCut?: number; mouthBlood?: number; bruise?: {side: 1 | -1; amt: number};
  dirt?: number; dust?: number; stains?: Stain[]; decals?: Decal[]; handBlood?: {L?: number; R?: number}; pale?: number;
  /** worn gear that travels with the role's continuity (dmgR2): the flare carrier's satchel and what is left in it */
  satchel?: Satchel;
};
/** Scene light on the figure, already in the figure's screen frame (x right, y down, z toward the viewer). */
export type FigLight = {
  dir: V3; // toward the key light (low sun)
  key?: number; // 0..1 how strongly it shapes the figure (smoke dims it)
  shadowC?: string; rimC?: string; rim?: number;
  fire?: number; fireC?: string; fog?: number; fogC?: string;
};
export type Part = {z: number; key: string; el: React.ReactElement};
export type HandFrame = {
  pos: V3; dir: V2; ang: number; palmN: V3; thumb: number; pv: number; /** on-screen length factor (fingers toward/away from the camera) */ len: number;
  /**
   * The hand's own plane on screen: the hand glyph and anything it holds are drawn with matrix(ax, ay, pos), hand-local
   * x along `ax` (the fingers' axis, foreshortened when the fingers point at or away from the camera) and y along `ay`
   * (the thumb side, from the 3D thumb axis: it narrows edge-on and never flips independently of the hand). R2 drew
   * holds in a screen-aligned frame (full length whatever the forearm's foreshortening, mirrored by the thumb sign), so
   * a launcher or bar kept its screen length while the arm pointed at the camera and swung across the hand.
   */
  ax: V2; ay: V2;
  /** the fingers' axis and the thumb's axis in the drawn frame (3D unit vectors) */
  a3: V3; t3: V3;
};
/** SVG transform of a hand frame (hand-local units are rig units × s, drawn at the hand). */
export const handM = (h: HandFrame) => `matrix(${f2(h.ax.x)} ${f2(h.ax.y)} ${f2(h.ay.x)} ${f2(h.ay.y)} ${f2(h.pos.x)} ${f2(h.pos.y)})`;
/** A hand-local point (rig units × s) → drawn frame, in the hand glyph's plane. */
export const handPt = (h: HandFrame, x: number, y: number): V2 => ({x: h.pos.x + h.ax.x * x + h.ay.x * y, y: h.pos.y + h.ax.y * x + h.ay.y * y});
/** Where a held handle sits in the fist (hand-local x, rig units; = hands.tsx GRIP_X). */
const GRIP0 = 21;
/**
 * A HELD PROP's frame: the hand's true 3D axes projected (fingers a3, thumb t3), about the grip point in the fist, so
 * a prop keeps its 3D length and turns with the hand continuously (the hand glyph itself keeps a minimum width). R2
 * drew props in the glyph's frame: full length when they pointed at the camera, flipped across the hand when the
 * palm turned past edge-on.
 */
/** The held prop's two screen axes: the projected 3D finger and thumb axes, with the frame never collapsing (a flat
 *  drawing of a round handle or tube keeps at least ~0.35 of its thickness when one axis points at the camera). */
const propAxes = (h: HandFrame) => {
  let A = {x: h.a3.x, y: h.a3.y}, T = {x: h.t3.x, y: h.t3.y};
  const det = A.x * T.y - A.y * T.x, MIN = 0.35;
  if (Math.abs(det) < MIN) {
    const sg = Math.sign(det) || Math.sign(h.ax.x * h.ay.y - h.ax.y * h.ay.x) || 1;
    const aL = Math.hypot(A.x, A.y), tL = Math.hypot(T.x, T.y);
    const longT = tL >= aL, L0 = longT ? T : A, Ll = Math.max(1e-6, longT ? tL : aL);
    const n = {x: -L0.y / Ll, y: L0.x / Ll};
    const S0 = longT ? A : T, c = S0.x * n.x + S0.y * n.y;
    // the shorter axis's component across the longer one, raised to MIN / |longer| (signed to keep the handedness)
    const want = Math.min(1, MIN / Ll) * (longT ? -sg : sg);
    const S1 = {x: S0.x + n.x * (want - c), y: S0.y + n.y * (want - c)};
    if (longT) A = S1; else T = S1;
  }
  return {A, T};
};
export const propPt = (h: HandFrame, x: number, y: number, s: number): V3 => {
  const g = handPt(h, GRIP0 * s, 0), dx = x - GRIP0 * s;
  const {A, T} = propAxes(h);
  return {x: g.x + A.x * dx + T.x * y, y: g.y + A.y * dx + T.y * y, z: h.pos.z + (h.a3.z * x + h.t3.z * y)};
};
/** The transform to wrap a held prop (drawn in hand-local units) with, INSIDE the hand glyph's group (handM): it maps the
 *  glyph's frame to the prop frame (propPt) about the grip. */
const propInGlyph = (h: HandFrame, s: number) => {
  const det = h.ax.x * h.ay.y - h.ay.x * h.ax.y;
  if (Math.abs(det) < 1e-6) return '';
  // K = Mg⁻¹ · Mp (Mg = [ax ay], Mp = [a3.xy t3.xy])
  const ia = h.ay.y / det, ib = -h.ay.x / det, ic = -h.ax.y / det, id = h.ax.x / det;
  const {A, T} = propAxes(h);
  const k11 = ia * A.x + ib * A.y, k21 = ic * A.x + id * A.y, k12 = ia * T.x + ib * T.y, k22 = ic * T.x + id * T.y;
  const g0 = GRIP0 * s;
  // q → g0 + K (q − g0)
  const e = g0 - k11 * g0, f = -k21 * g0;
  const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
  return `matrix(${r4(k11)} ${r4(k21)} ${r4(k12)} ${r4(k22)} ${f2(e)} ${f2(f)})`;
};
export type HoldFn = ((h: HandFrame, s: number, ink: number, col: (c: string) => string) => React.ReactNode) & {
  /** a long prop's axis in hand-local rig units [x0, y0, x1, y1]: the prop is cut where that axis passes the torso's or
   *  the face's depth (zoneRuns), so a bar held beside the head goes behind it where it is behind it */
  span?: [number, number, number, number];
  /** a short prop: only the face's depth cuts it (the torso's edge does not), so it never splinters at the body */
  spanFace?: boolean;
};
/** Give a HoldFn its axis (hand-local rig units) so the rig can cut it by depth (see HoldFn.span). */
export const withSpan = (fn: HoldFn, span: [number, number, number, number], faceOnly = false): HoldFn => Object.assign(fn, {span, spanFace: faceOnly});
export type WearFn = (fa: {E: V3; W: V3; dorsal: V3; ang: number; len: number}, s: number, ink: number, col: (c: string) => string) => {el: React.ReactNode; front: boolean; /** (R4) 0 behind the forearm … 1 over it */ w?: number} | null;

export type FigProps = {
  look: Look; t: number; seed?: number; id?: string;
  x: number; y: number; s?: number; yaw?: number;
  /** camera elevation seen from the figure (deg, + = camera above looking down) */
  pitch?: number;
  /** screen rotation about the root (deg) */
  rot?: number;
  drop?: number; pelvis?: Partial<Loc>;
  lean?: number; side?: number; twist?: number;
  /** whole-body rotation about the character's right axis (deg, + = pitch forward onto the face) and forward axis */
  bodyPitch?: number; bodyRoll?: number;
  /** pivot for bodyPitch/bodyRoll, body-local (default: the pelvis) */
  bodyPivot?: Loc;
  head?: {yaw?: number; pitch?: number; roll?: number};
  face?: Face;
  armL?: ArmT; armR?: ArmT; legL?: LegT; legR?: LegT;
  handL?: HandShape; handR?: HandShape;
  holdL?: HoldFn; holdR?: HoldFn; wearL?: WearFn; wearR?: WearFn;
  /** extra parts (two-handed tools etc.) drawn with access to the solved rig (use r.toolZ for a tool between the hands) */
  extra?: (r: Rig2) => Part[];
  /** a tool is held in both hands: both hands' curled fingers draw over it */
  twoHanded?: boolean;
  dmg?: Damage; ink?: number; breath?: number;
  /** explicit chest expansion −1 … 1 (overrides the automatic breathing from `breath`; faces.ts breathCycle/lastBreath) */
  chest?: number;
  /** contact shadow opacity (default 1); 0 to hide */
  shadow?: number;
  light?: FigLight;
  silhouette?: string; opacity?: number;
  /** depth overrides relative to the torso (± 50 ≈ behind / in front) for contacts */
  zArm?: [number | undefined, number | undefined]; zHandFront?: [number | undefined, number | undefined];
};

// ------------------------------------------------------------------ skeleton
export type Basis = {R: V3; U: V3; F: V3};
export type Rig2 = {
  root: V3; P: V3; base: Basis; up: Basis; head: Basis; s: number; ink: number;
  hip: [V3, V3]; knee: [V3, V3]; ankle: [V3, V3]; sh: [V3, V3]; el: [V3, V3]; wr: [V3, V3];
  neck: V3; headC: V3; torsoZ: number;
  palm: [V3, V3]; hands: [HandFrame, HandFrame];
  /** wrist-bend orientation per hand (drawn frame), when the pose sets one */
  orient: [{fingers: V3 | null; palm: V3 | null; w: number}, {fingers: V3 | null; palm: V3 | null; w: number}];
  /** depth rank of each arm part (relative frame of the parts) and of a tool held in both hands */
  armRank: [number, number]; toolZ: number;
  /** depth rank of each upper arm (shoulder → elbow), which can differ from the forearm's (armRank) */
  armRankU: [number, number];
  /**
   * Depth zones of the parts: 0 behind the torso, 1 in front of the torso but behind the face, 2 in front of the face.
   * `rankOf(z)` gives the part rank (in figureParts' frame, before the torso offset is removed) for a drawn depth z;
   * `zoneZ` the zone base ranks. Props drawn along a line use `splitZones` (figure.tsx) to cross zones correctly.
   */
  zone: (z: number) => 0 | 1 | 2; zoneZ: [number, number, number]; rankOf: (z: number) => number;
  /** the zone of a drawn point, judged against the head's actual front surface where the point is over the head (a
   *  bar beside the cheek but behind it is behind the face; the plane `zone` uses the face's mid-depth everywhere) */
  zoneAt: (q: V3) => 0 | 1 | 2; rankAt: (q: V3) => number;
  /** the drawn depths of the zone boundaries: the torso's and the face's planes */
  zCut: [number, number];
  /** the pose overrides an arm's depth (zArm): a tool between the hands keeps R2's rank over both arms */
  armOverride: boolean;
  /** (R4) depth of the torso's front surface (its true width, not the flank-narrowed one zone() judges by) along the view
   *  ray through a drawn point; null where the ray misses the torso */
  torsoFront: (q: V3) => number | null;
  /** the thigh points toward the camera (sitting, kneeling, a high knee): that leg is drawn over the torso's hem */
  legFront: [boolean, boolean];
  /** the figure's id (unique per figure; for clip-path ids of props) and its colour/ink functions (fog, fire,
   *  silhouette), set by figureParts so `extra` parts are lit like the body */
  id: string; col: (c: string) => string; inkC: string;
  /** convert a body-local point (root-relative, turned with bodyPitch/bodyRoll) to the drawn (view) frame */
  loc: (l: Loc) => V3;
  /** a point on the torso, relative to the pelvis in the torso's own frame (follows drop, lean, twist, pitch):
   *  r right, u up from the pelvis, f forward. The chest's back surface is about f −40 at u 80 */
  torso: (l: Loc) => V3;
};
const basisYaw = (yaw: number): Basis => {
  const a = rad(yaw);
  return {R: {x: -Math.cos(a), y: 0, z: Math.sin(a)}, U: {x: 0, y: -1, z: 0}, F: {x: Math.sin(a), y: 0, z: Math.cos(a)}};
};
const rotB = (b: Basis, axis: V3, ang: number): Basis => ({R: rotAxis(b.R, axis, ang), U: rotAxis(b.U, axis, ang), F: rotAxis(b.F, axis, ang)});
export const at = (o: V3, b: Basis, r: number, u: number, f: number): V3 => ({
  x: o.x + b.R.x * r + b.U.x * u + b.F.x * f, y: o.y + b.R.y * r + b.U.y * u + b.F.y * f, z: o.z + b.R.z * r + b.U.z * u + b.F.z * f,
});
const dirOf = (b: Basis, l: Loc): V3 => norm3(add3(add3(mul3(b.R, l.r), mul3(b.U, l.u)), mul3(b.F, l.f)));

export const ik2 = (a: V3, target: V3, l1: number, l2: number, pole: V3) => {
  const d0 = sub3(target, a);
  const dist = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, len3(d0)));
  const u = norm3(d0);
  const end = add3(a, mul3(u, dist));
  let v = sub3(pole, mul3(u, dot3(pole, u)));
  if (len3(v) < 1e-4) v = Math.abs(u.y) < 0.9 ? {x: 0, y: 1, z: 0} : {x: 0, y: 0, z: 1};
  v = norm3(v);
  const cosA = clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1);
  const A = Math.acos(cosA);
  const mid = add3(a, add3(mul3(u, l1 * Math.cos(A)), mul3(v, l1 * Math.sin(A))));
  return {mid, end};
};

/** Default palm direction per hand shape (body-local), for a hand of side sd (−1 left, +1 right). */
const defaultPalm = (shape: HandShape, sd: number): Loc => {
  switch (shape) {
    case 'brace': return {r: 0, u: 0, f: 1};
    case 'reach': return {r: -sd * 0.3, u: -0.6, f: 0.6};
    case 'grip': case 'fist': case 'point': return {r: -sd, u: 0, f: 0.2};
    default: return {r: -sd, u: 0, f: 0.15};
  }
};

export const solve2 = (p: FigProps): Rig2 => {
  const s = p.s ?? 1;
  const root: V3 = {x: p.x, y: p.y, z: 0};
  const B0 = basisYaw(p.yaw ?? 0);
  // whole-body rotation (lying, falling, kneeling forward) about a body-local pivot
  let base = B0;
  const pv = p.bodyPivot ?? {r: 0, u: HIP_H - (p.drop ?? 0), f: 0};
  const pivot = at(root, B0, pv.r * s, pv.u * s, pv.f * s);
  if (p.bodyPitch) base = rotB(base, base.R, rad(p.bodyPitch));
  if (p.bodyRoll) base = rotB(base, base.F, rad(p.bodyRoll));
  const fromPivot = (l: Loc) => {
    // body-local point relative to the root, rotated with the body about the pivot
    const q0 = at(root, B0, l.r * s, l.u * s, l.f * s);
    if (!p.bodyPitch && !p.bodyRoll) return q0;
    const d = sub3(q0, pivot);
    const lr = dot3(d, B0.R), lu = dot3(d, B0.U), lf = dot3(d, B0.F);
    return at(pivot, base, lr, lu, lf);
  };
  const pel = p.pelvis ?? {};
  const P = fromPivot({r: pel.r ?? 0, u: HIP_H - (p.drop ?? 0) + (pel.u ?? 0), f: pel.f ?? 0});
  let up = rotB(base, base.U, rad(p.twist ?? 0));
  up = rotB(up, up.R, rad(p.lean ?? 0));
  up = rotB(up, up.F, rad(p.side ?? 0));
  const neck = at(P, up, 0, NECK_H * s, 0);
  const hy = p.head ?? {};
  let hb = rotB(up, up.U, rad(hy.yaw ?? 0));
  hb = rotB(hb, hb.R, rad(hy.pitch ?? 0));
  hb = rotB(hb, hb.F, rad(hy.roll ?? 0));
  const headC = at(neck, hb, 0, HEAD_UP * s, 0);
  const tgtOf = (t: {local?: Loc; abs?: V3}) => (t.abs ? t.abs : t.local ? fromPivot(t.local) : null);
  // legs
  const hip: [V3, V3] = [at(P, base, -HIP_X * s, 0, 0), at(P, base, HIP_X * s, 0, 0)];
  const knee: V3[] = [], ankle: V3[] = [];
  ([p.legL, p.legR] as (LegT | undefined)[]).forEach((L, i) => {
    const sd = i === 0 ? -1 : 1;
    const H = hip[i];
    let tgt = fromPivot({r: sd * (HIP_X + 4), u: ANKLE_H, f: 0});
    if (L?.fk) {
      const d1 = norm3(add3(mul3(base.U, -Math.cos(rad(L.fk.fwd))), mul3(base.F, Math.sin(rad(L.fk.fwd)))));
      const kj = add3(H, mul3(d1, THIGH * s));
      const d2 = norm3(add3(mul3(base.U, -Math.cos(rad(L.fk.fwd - L.fk.knee))), mul3(base.F, Math.sin(rad(L.fk.fwd - L.fk.knee)))));
      tgt = add3(kj, mul3(d2, SHIN * s));
    }
    const ft = L ? tgtOf(L) : null;
    if (ft) tgt = L!.w === undefined ? ft : {x: lerp(tgt.x, ft.x, L!.w), y: lerp(tgt.y, ft.y, L!.w), z: lerp(tgt.z, ft.z, L!.w)};
    const pole = L?.pole ? dirOf(base, L.pole) : add3(base.F, mul3(base.R, sd * 0.15));
    const r = ik2(H, tgt, THIGH * s, SHIN * s, pole);
    knee.push(r.mid); ankle.push(r.end);
  });
  // arms
  const sh: [V3, V3] = [at(P, up, -SH_X * s, SH_H * s, 0), at(P, up, SH_X * s, SH_H * s, 0)];
  const el: V3[] = [], wr: V3[] = [], palm: V3[] = [];
  const orient: {fingers: V3 | null; palm: V3 | null; w: number}[] = [];
  ([p.armL, p.armR] as (ArmT | undefined)[]).forEach((A, i) => {
    const sd = i === 0 ? -1 : 1;
    const S = sh[i];
    const fk = A?.fk ?? {fwd: 4, out: 8, bend: 14};
    const d1 = norm3(rotAxis(rotAxis(mul3(up.U, -1), up.F, rad(sd * fk.out)), up.R, -rad(fk.fwd)));
    const e = add3(S, mul3(d1, UPPER * s));
    let q = sub3(add3(up.F, mul3(up.R, -sd * 0.25)), mul3(d1, dot3(add3(up.F, mul3(up.R, -sd * 0.25)), d1)));
    if (len3(q) < 1e-4) q = up.U;
    q = norm3(q);
    const d2 = norm3(add3(mul3(d1, Math.cos(rad(fk.bend))), mul3(q, Math.sin(rad(fk.bend)))));
    let tgt = add3(e, mul3(d2, FORE * s));
    const ht = A ? tgtOf(A) : null;
    if (ht) { const w = A!.w ?? 1; tgt = {x: lerp(tgt.x, ht.x, w), y: lerp(tgt.y, ht.y, w), z: lerp(tgt.z, ht.z, w)}; }
    const pole = A?.pole ? dirOf(up, A.pole) : add3(add3(mul3(up.U, -1), mul3(up.F, -0.55)), mul3(up.R, sd * 0.5));
    const r = ik2(S, tgt, UPPER * s, FORE * s, pole);
    el.push(r.mid); wr.push(r.end);
    const hs = (i === 0 ? p.handL : p.handR) ?? 'relaxed';
    palm.push(dirOf(up, A?.palm ?? defaultPalm(hs, sd)));
    const fd = A?.fingersAbs ? norm3(A.fingersAbs) : A?.fingers ? dirOf(up, A.fingers) : null;
    const pd = A?.palmAbs ? norm3(A.palmAbs) : null;
    orient.push({fingers: fd, palm: pd, w: fd || pd ? clamp(A?.orientW ?? 1) : 0});
  });
  const torsoZ = at(P, up, 0, 70 * s, 0).z;
  // ---- the view: camera pitch about the screen x axis through the root, then screen rotation
  const ph = rad(p.pitch ?? 0), cph = Math.cos(ph), sph = Math.sin(ph);
  const rr = rad(p.rot ?? 0), cr = Math.cos(rr), sr = Math.sin(rr);
  const vec = (v: V3): V3 => {
    const y1 = v.y * cph + v.z * sph, z1 = -v.y * sph + v.z * cph;
    return {x: v.x * cr - y1 * sr, y: v.x * sr + y1 * cr, z: z1};
  };
  const pnt = (q: V3): V3 => add3(root, vec(sub3(q, root)));
  const vb = (b: Basis): Basis => ({R: vec(b.R), U: vec(b.U), F: vec(b.F)});
  // (R4) A leg whose knee or foot is nearer than the torso AND overlaps it on screen must be drawn over it, whatever the
  // thigh's own angle to the view: the thigh-angle rule alone (ratio 0.68) flipped a reclined sitter's legs behind the
  // torso for whole shots, and they vanished behind the shirt (the Director sliding down the slab in D4-9a). Pure depth
  // + overlap, so it is true exactly when the leg would otherwise be hidden by the torso's own drawing.
  const legOverTorso = (i: number): boolean => {
    const a = pnt(P), b = pnt(neck);
    const ax = b.x - a.x, ay = b.y - a.y, L2 = ax * ax + ay * ay;
    if (L2 < 1) return false;
    const tz = vec(sub3(at(P, up, 0, 70 * s, 0), root)).z;
    return [pnt(knee[i]), pnt(ankle[i])].some((q) => {
      const t = ((q.x - a.x) * ax + (q.y - a.y) * ay) / L2;
      const perp = Math.abs((q.x - a.x) * ay - (q.y - a.y) * ax) / Math.sqrt(L2);
      return t > 0.04 && t < 1 && perp < 84 * s && q.z > tz + 34 * s;
    });
  };
  const out: Rig2 = {
    root, P: pnt(P), base: vb(base), up: vb(up), head: vb(hb), s, ink: p.ink ?? 4 * s,
    hip: [pnt(hip[0]), pnt(hip[1])], knee: [pnt(knee[0]), pnt(knee[1])], ankle: [pnt(ankle[0]), pnt(ankle[1])],
    sh: [pnt(sh[0]), pnt(sh[1])], el: [pnt(el[0]), pnt(el[1])], wr: [pnt(wr[0]), pnt(wr[1])],
    neck: pnt(neck), headC: pnt(headC), torsoZ: vec(sub3(at(P, up, 0, 70 * s, 0), root)).z,
    palm: [vec(palm[0]), vec(palm[1])],
    hands: [] as unknown as [HandFrame, HandFrame],
    orient: orient.map((o) => ({fingers: o.fingers ? vec(o.fingers) : null, palm: o.palm ? vec(o.palm) : null, w: o.w})) as Rig2['orient'],
    armRank: [0, 0], toolZ: 0, armRankU: [0, 0],
    zone: () => 0, zoneZ: [0, 0, 0], rankOf: () => 0, zoneAt: () => 0, rankAt: () => 0, zCut: [0, 0], armOverride: p.zArm?.[0] !== undefined || p.zArm?.[1] !== undefined, torsoFront: () => null,
    // a thigh pointing toward the camera, judged in the unpitched frame (a camera below the figure must not bring the
    // legs over the shirt's hem)
    // (only a thigh strongly toward the camera — sitting, a high step — is drawn over the hem with a rounded hip: at
    // R3a's 0.42 a stepping leg on a slope got it, and its inked hip arc showed on the jacket)
    legFront: [0, 1].map((i) => (knee[i].z - hip[i].z > 0.68 * THIGH * s && knee[i].z > torsoZ + 10 * s) || legOverTorso(i)) as [boolean, boolean],
    id: (p.id ?? `f${p.seed ?? 1}`).replace(/[^a-zA-Z0-9_]/g, '_'), col: (c: string) => c, inkC: C.ink,
    loc: (l: Loc) => pnt(fromPivot(l)),
    torso: (l: Loc) => pnt(at(P, up, l.r * s, l.u * s, l.f * s)),
  };
  // depth zones. R2 ranked a whole arm (shoulder to hand) in front of or behind the torso, always over the head when in
  // front: an upper arm crossing the chest covered the chin, a hand in front of the chest seen from behind was drawn
  // over the back, a tool between hands raised by the face was drawn over the face. Each part is now ranked by its own
  // depth against the torso and against the face plane.
  const zT = out.torsoZ + 6 * s, zH = out.headC.z + HEAD_R * s * 0.3;
  out.zCut = [zT, zH];
  out.zone = (z: number) => (z <= zT ? 0 : z <= zH ? 1 : 2);
  out.zoneZ = [out.torsoZ - 40, out.torsoZ + 3, out.torsoZ + 40];
  out.rankOf = (z: number) => out.zoneZ[out.zone(z)] + clamp((z - out.torsoZ) / (600 * s), -1, 1) * 0.3;
  {
    const Hc = out.headC, hr = HEAD_R * s * 1.12, hry = HEAD_RY * s * 1.2;
    // the torso's front surface along the view ray through a drawn point (its cross-sections as elliptic cylinders
    // round the spine): null where the ray misses the torso. Inside the torso's outline a part is in front of the
    // torso only if it is in front of that surface (an arm hanging at the side, seen from the front or the back,
    // is behind the torso's rounded edge, so its sleeve start hides under the shirt); outside the outline the
    // torso's mid-plane decides, as before.
    const B = out.up, Pd = out.P;
    const ab = (h: number): [number, number] => {
      if (h > SH_H) return [lerp(76, 56, clamp((h - SH_H) / 22)), lerp(40, 32, clamp((h - SH_H) / 22))];
      for (let i = 1; i < TORSO.length; i++) if (h <= TORSO[i][0]) { const k = clamp((h - TORSO[i - 1][0]) / (TORSO[i][0] - TORSO[i - 1][0])); return [lerp(TORSO[i - 1][1], TORSO[i][1], k), lerp(TORSO[i - 1][2], TORSO[i][2], k)]; }
      return [TORSO[TORSO.length - 1][1], TORSO[TORSO.length - 1][2]];
    };
    const frontSurf = (q: V3, narrow = true): number | null => {
      const d = sub3(q, Pd);
      const r0 = dot3(d, B.R), u0 = dot3(d, B.U), f0 = dot3(d, B.F);
      let h = u0 / s;
      if (h < -25 || h > 150) return null;
      const vr = B.R.z, vf = B.F.z, vu = B.U.z;
      let tz = 0;
      // (the chest's flanks are the shoulders the arms hang from: narrowed there, so an arm at the side, seen from
      // the front or the back, sorts by depth as before rather than disappearing behind the torso's outline)
      // (R4, the true torso surface only: the ray also climbs the torso's axis when the torso is tilted toward the view, so the
      // cross-section is found at the height where the ray meets it, a few iterations; R3's zone test judges at the point's own height)
      for (let it = 0; it < (narrow ? 1 : 4); it++) {
        const [a, b] = ab(h), A2 = (a * s * (narrow ? lerp(1, 0.84, clamp((h - 60) / 40)) : 1)) ** 2, B2 = (b * s) ** 2;
        const qa = vr * vr / A2 + vf * vf / B2, qb = 2 * (r0 * vr / A2 + f0 * vf / B2), qc = r0 * r0 / A2 + f0 * f0 / B2 - 1;
        if (qa < 1e-9) return qc < 0 ? q.z : null;
        const disc = qb * qb - 4 * qa * qc;
        if (disc < 0) return null;
        tz = (-qb + Math.sqrt(disc)) / (2 * qa);
        if (!narrow) { h = clamp((u0 + tz * vu) / s, -25, 150); }
      }
      return q.z + tz;
    };
    // depth along the camera's HORIZONTAL axis (the camera pitch undone): beside the torso, in front of or behind its
    // mid-plane is judged level, so looking down on a figure does not put its hanging hands "behind" it (lower points
    // are farther from a camera above) nor bring them forward under a low camera
    const zHor = (q: V3) => {
      const dx = q.x - root.x, dy = q.y - root.y;
      const y1 = -dx * sr + dy * cr;
      return y1 * sph + q.z * cph;
    };
    const zTH = zHor(out.torso({r: 0, u: 70, f: 0})) + 6 * s;
    out.torsoFront = (q: V3) => frontSurf(q, false);
    out.zoneAt = (q: V3) => {
      const fz = frontSurf(q);
      if (fz !== null ? q.z < fz - 2 * s : zHor(q) <= zTH) return 0;
      // over the head's outline: in front of the face only if in front of the head's own surface there
      const dx = (q.x - Hc.x) / hr, dy = (q.y - Hc.y) / hry, d2 = dx * dx + dy * dy;
      // just outside the head's outline, a raised hand or prop clearly in front of the face (past its front surface's
      // depth) is in the face's zone; the shoulders beside the jaw are not
      if (d2 >= 1) return d2 < 2.6 && q.z > Hc.z + HEAD_R * s * 0.85 ? 2 : 1;
      return q.z > Hc.z + HEAD_R * s * Math.sqrt(1 - d2) ? 2 : 1;
    };
    out.rankAt = (q: V3) => out.zoneZ[out.zoneAt(q)] + clamp((q.z - out.torsoZ) / (600 * s), -1, 1) * 0.3;
  }
  out.armRankU = [0, 1].map((i) => out.rankAt(lerp3(out.sh[i], out.el[i], 0.5))) as [number, number];
  out.armRank = [0, 1].map((i) => {
    const zA = p.zArm?.[i];
    // (judged mostly by the hand: a forearm reaching round the body is behind it where the hand is)
    return zA !== undefined ? out.torsoZ + zA : out.rankAt(lerp3(out.el[i], out.wr[i], 0.75));
  }) as [number, number];
  out.toolZ = Math.max(out.armRank[0], out.armRank[1]) + 0.3;
  // hand frames (in the drawn frame)
  out.hands = [0, 1].map((i) => {
    const sd = i === 0 ? -1 : 1;
    const E = out.el[i], Wr = out.wr[i];
    const o = out.orient[i];
    const fa = norm3(sub3(Wr, E));
    // a bent wrist: blend the hand's axis toward the given fingers direction, and its palm toward the given facing
    const ad = o.fingers && o.w > 0 ? norm3(add3(mul3(fa, 1 - o.w), mul3(o.fingers, o.w))) : fa;
    const pn = o.palm && o.w > 0 ? norm3(add3(mul3(out.palm[i], 1 - o.w), mul3(o.palm, o.w))) : out.palm[i];
    const len = o.fingers ? lerp(1, Math.max(0.32, Math.hypot(ad.x, ad.y)), o.w) : 1;
    const thumbV = mul3({x: pn.y * ad.z - pn.z * ad.y, y: pn.z * ad.x - pn.x * ad.z, z: pn.x * ad.y - pn.y * ad.x}, sd);
    const a2 = Math.atan2(ad.y, ad.x);
    const perp = {x: -Math.sin(a2), y: Math.cos(a2)};
    const thumb = Math.sign(thumbV.x * perp.x + thumbV.y * perp.y) || 1;
    const pos = add3(Wr, mul3(fa, 2 * s));
    // the hand plane on screen: x = the fingers' axis (foreshortened, at least 0.45), y = the thumb axis split into
    // a shear along x (kept small) and a width across it (at least 0.55, the R2 edge-on width, on the thumb's side)
    const t3 = len3(thumbV) > 1e-4 ? norm3(thumbV) : {x: perp.x * thumb, y: perp.y * thumb, z: 0};
    const fl = Math.hypot(ad.x, ad.y);
    const axL = o.fingers ? lerp(clamp(fl, 0.45, 1), Math.max(0.32, fl), o.w) : clamp(fl, 0.45, 1);
    const ux = {x: Math.cos(a2), y: Math.sin(a2)};
    const al = clamp(t3.x * ux.x + t3.y * ux.y, -0.35, 0.35), be = t3.x * perp.x + t3.y * perp.y;
    const beta = (Math.sign(be) || thumb) * Math.max(Math.abs(be), 0.55);
    const ax = {x: ux.x * axL, y: ux.y * axL}, ay = {x: ux.x * al + perp.x * beta, y: ux.y * al + perp.y * beta};
    return {pos, dir: ux, ang: (a2 * 180) / Math.PI, palmN: pn, thumb: Math.sign(beta), pv: pn.z, len, ax, ay, a3: ad, t3};
  }) as [HandFrame, HandFrame];
  return out;
};

// ------------------------------------------------------------------ props across depth zones
/** The depth zone (0 behind the torso, 1 in front of it, 2 in front of the face) of a part rank. */
export const zoneOfRank = (r: Rig2, rank: number) => (rank > r.torsoZ + 20 ? 2 : rank > r.torsoZ - 20 ? 1 : 0);
/**
 * A long prop drawn along the line a → b (drawn-frame 3D points, e.g. its two ends) is cut where that line passes the
 * torso's and the face's depth (Rig2.zone), each piece a part ranked in its own zone just over the arms there: a bar
 * raised beside the face is drawn behind the head where it is behind it and over the face only where it is in front
 * (R2 drew a two-handed tool over the arms' single rank: over the face whenever the arms were in front of the chest,
 * over the back when the hands were in front of the chest seen from behind).
 */
/** The runs of one depth zone along the drawn segment a → b, each with a half-space clip polygon (drawn frame) that
 *  holds that run of the line (the first and last runs extend to infinity along it). */
export const zoneRuns = (r: Rig2, a: V3, b: V3): {zone: number; poly: V2[]}[] => {
  const d = {x: b.x - a.x, y: b.y - a.y}, dl = Math.hypot(d.x, d.y);
  const zMid = (u: number) => r.zoneAt(lerp3(a, b, u));
  // runs of one zone along the line (sampled, each boundary refined by bisection)
  const N = 28;
  const runs: {t0: number; t1: number; zone: number}[] = [];
  let prev = zMid(0), t0 = 0;
  for (let i = 1; i <= N; i++) {
    const u = i / N, zn = zMid(u);
    if (zn !== prev) {
      let lo = (i - 1) / N, hi = u;
      for (let k = 0; k < 8; k++) { const m = (lo + hi) / 2; if (zMid(m) === prev) lo = m; else hi = m; }
      runs.push({t0, t1: (lo + hi) / 2, zone: prev});
      t0 = (lo + hi) / 2; prev = zn;
    }
  }
  runs.push({t0, t1: 1, zone: prev});
  if (runs.length === 1 || dl < 1e-3) return [{zone: runs.length === 1 ? runs[0].zone : zMid(0.5), poly: []}];
  const ux = d.x / dl, uy = d.y / dl, BIG = 1e5;
  return runs.map((rn, k) => {
    const t0 = k === 0 ? -BIG / dl : rn.t0, t1 = k === runs.length - 1 ? BIG / dl : rn.t1;
    const p0 = {x: a.x + d.x * t0, y: a.y + d.y * t0}, p1 = {x: a.x + d.x * t1, y: a.y + d.y * t1};
    return {zone: rn.zone, poly: [{x: p0.x - uy * BIG, y: p0.y + ux * BIG}, {x: p1.x - uy * BIG, y: p1.y + ux * BIG}, {x: p1.x + uy * BIG, y: p1.y - ux * BIG}, {x: p0.x + uy * BIG, y: p0.y - ux * BIG}]};
  });
};
export const splitZones = (r: Rig2, key: string, el: React.ReactElement, a: V3, b: V3, bias = 0.35): Part[] => {
  const runs = zoneRuns(r, a, b);
  // the piece in the hands' zone sits over both forearms; a pose that overrides an arm's depth keeps R2's tool rank
  const handZone = zoneOfRank(r, r.toolZ - 0.3);
  // (R4: the piece in the hands' zone follows the arms' own rank in every pose, not only under a depth override: when an arm's
  // zone flipped to the face's (a hand near the head) the arm jumped over the tool and the tool stayed under it)
  const rank = (zn: number) => (zn === handZone ? r.toolZ : r.zoneZ[zn] + bias);
  if (runs.length === 1) return [{z: rank(runs[0].zone), key, el}];
  return runs.map((rn, k) => {
    const cid = `${r.id}_${key}_z${k}`;
    return {z: rank(rn.zone), key: `${key}${k}`, el: (
      <g>
        <defs><clipPath id={cid}><path d={polyPath(rn.poly)} /></clipPath></defs>
        <g clipPath={`url(#${cid})`}>{el}</g>
      </g>
    )};
  });
};

// ------------------------------------------------------------------ limbs against the torso (R4)
/**
 * Where the torso hides a limb segment A → B (drawn-frame 3D points; half-width hw, the segment's footprint is the rectangle
 * round it). The limb's depth along its axis is compared, pixel by pixel, with the torso's front surface there (full width,
 * Rig2.torsoFront) less `bias`: where the torso is nearer the limb is hidden. R3 ranked a whole limb behind or in front of
 * the torso by one depth test at one point (zoneAt): a limb that hangs at the torso's side is a depth tie, so every figure
 * turning a degree or two flipped its upper arm from behind the torso to over the shirt (sleeve cap and all) in one frame.
 * Returns the hidden regions as closed polygons (drawn frame, grown by `pad`) and `touch`: whether the footprint meets the
 * torso's front surface at all.
 */
export const torsoHides = (r: Rig2, A: V3, B: V3, hw: number, bias: number, pad = 0): {polys: V2[][]; touch: boolean; vis: boolean} => {
  const dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy, L = Math.sqrt(L2);
  const polys: V2[][] = [];
  let touch = false, vis = false;
  const ux = L > 1e-6 ? dx / L : 0, uy = L > 1e-6 ? dy / L : 1, nx = -uy, ny = ux;
  const ext = hw;
  const cy = [A.y - uy * ext + ny * hw, B.y + uy * ext + ny * hw, B.y + uy * ext - ny * hw, A.y - uy * ext - ny * hw];
  const y0 = Math.min(...cy), y1 = Math.max(...cy);
  const nRows = clamp(Math.ceil((y1 - y0) / Math.max(1.2, r.s * 1.6)), 4, 72);
  const zMid = (A.z + B.z) / 2;
  const zAt = (x: number, y: number) => (L2 < 1e-6 ? zMid : lerp(A.z, B.z, clamp(((x - A.x) * dx + (y - A.y) * dy) / L2, 0, 1)));
  const g = (x: number, y: number): number | null => {
    const z = zAt(x, y), f = r.torsoFront({x, y, z});
    return f === null ? null : f - bias - z; // > 0: the torso is nearer
  };
  type Row = {y: number; x1: number; x2: number};
  let run: Row[] = [];
  const flush = () => {
    if (!run.length) return;
    const dyr = (y1 - y0) / nRows;
    const top = run[0].y - dyr * 0.5, bot = run[run.length - 1].y + dyr * 0.5;
    const left: V2[] = [{x: run[0].x1 - pad, y: top}, ...run.map((q) => ({x: q.x1 - pad, y: q.y})), {x: run[run.length - 1].x1 - pad, y: bot}];
    const right: V2[] = [{x: run[0].x2 + pad, y: top}, ...run.map((q) => ({x: q.x2 + pad, y: q.y})), {x: run[run.length - 1].x2 + pad, y: bot}];
    polys.push([...left, ...right.reverse()]);
    run = [];
  };
  for (let k = 0; k <= nRows; k++) {
    const y = y0 + ((y1 - y0) * k) / nRows;
    // the rectangle's chord at this y: s = (x - A.x) ux + (y - A.y) uy in [-ext, L + ext], w = (x - A.x) nx + (y - A.y) ny in [-hw, hw]
    let xa = -Infinity, xb = Infinity, empty = false;
    const cons = (c0: number, c1: number, lo: number, hi: number) => {
      if (Math.abs(c1) < 1e-9) { if (c0 < lo || c0 > hi) empty = true; return; }
      const t0 = (lo - c0) / c1, t1 = (hi - c0) / c1;
      xa = Math.max(xa, Math.min(t0, t1)); xb = Math.min(xb, Math.max(t0, t1));
    };
    cons((y - A.y) * uy - A.x * ux, ux, -ext, L + ext);
    cons((y - A.y) * ny - A.x * nx, nx, -hw, hw);
    if (empty || !(xa < xb)) { flush(); continue; }
    const step = Math.max(1.2, (xb - xa) / 48);
    const xs: number[] = [];
    for (let x = xa; x < xb; x += step) xs.push(x);
    xs.push(xb);
    const hid = xs.map((x) => { const gv = g(x, y); if (gv !== null) { touch = true; if (gv <= 0) vis = true; } return gv !== null && gv > 0; });
    const i0 = hid.indexOf(true);
    if (i0 < 0) { flush(); continue; }
    const i1 = hid.lastIndexOf(true);
    // the hidden part of the chord is one interval (the torso's surface is convex along a line): refine its two edges
    const edge = (vis: number, hd: number) => { let lo = vis, hi = hd; for (let it = 0; it < 7; it++) { const m = (lo + hi) / 2, gm = g(m, y); if (gm !== null && gm > 0) hi = m; else lo = m; } return hi; };
    const xf = i0 === 0 ? xa - 4 : edge(xs[i0 - 1], xs[i0]);
    const x2 = i1 === xs.length - 1 ? xb + 4 : edge(xs[i1 + 1], xs[i1]);
    run.push({y, x1: xf, x2});
  }
  flush();
  return {polys, touch, vis};
};

// ------------------------------------------------------------------ hair geometry (R1 tables, kept)
const HAIRLINE: Record<string, [number, number][]> = {
  crop: [[0, -0.6], [55, -0.42], [90, -0.12], [125, 0.32], [180, 0.6]],
  bun: [[0, -0.55], [55, -0.38], [90, -0.12], [125, 0.32], [180, 0.6]],
  // (curly hair covers the back of the head down to the nape: R3's audit of R2/R3 rear views — the hairline rose to the
  // ears in an inverted V and the bare lower skull read as a face with no features)
  curly: [[0, -0.5], [55, -0.4], [90, -0.12], [112, 0.4], [140, 0.7], [180, 0.8]],
  swoop: [[0, -0.86], [55, -0.62], [90, -0.12], [125, 0.32], [180, 0.6]],
  // (the back stays above the bob's hem at 0.55: R2's 0.78 showed the cap's V below the cut, a doubled hem from behind)
  bob: [[0, -0.98], [40, -0.92], [75, -0.55], [95, 0.42], [180, 0.5]],
  short: [[0, -0.62], [55, -0.45], [90, -0.15], [125, 0.28], [180, 0.55]],
  spiky: [[0, -0.6], [55, -0.42], [90, -0.12], [125, 0.32], [180, 0.6]],
  bald: [[0, -0.15], [80, -0.05], [100, 0.1], [180, 0.25]],
};
const VOLUME: Record<string, number> = {crop: 16, bun: 14, curly: 10, swoop: 8, bob: 16, short: 10, spiky: 10, bald: 0};
const smoothK = (x: number) => x * x * (3 - 2 * x);
/** (R4) a feature leaves the face by fading over a short range, never by a hard threshold on its depth: 0 at a, 1 at b.
 *  (R3 switched eyes, glasses, nose, cheeks, blood and the rest off at fixed depths while still half visible.) */
const rz = (z: number, a: number, b: number) => clamp((z - a) / (b - a), 0, 1);
const interpTbl = (tbl: [number, number][], a: number) => {
  const x = Math.abs(((((a + 180) % 360) + 360) % 360) - 180);
  for (let i = 1; i < tbl.length; i++) if (x <= tbl[i][0]) return lerp(tbl[i - 1][1], tbl[i][1], (x - tbl[i - 1][0]) / (tbl[i][0] - tbl[i - 1][0]));
  return tbl[tbl.length - 1][1];
};

const blinkAt = (t: number, seed: number) => {
  const period = 3.4 + rnd(seed) * 1.8;
  const ph = (t + rnd(seed * 7) * period) % period;
  if (ph < 0.06) return ph / 0.06;
  if (ph < 0.14) return 1 - (ph - 0.06) / 0.08;
  return 0;
};

// ------------------------------------------------------------------ shading helpers
const BIG = 'M -99999 -99999 H 99999 V 99999 H -99999 Z';
/** cel shadow crescent + rim strip for a closed silhouette path, clipped to it. */
const celOver = (id: string, d: string, L: FigLight | undefined, size: number, s: number, shiftD?: string, shadowAmt = 1): React.ReactNode => {
  if (!L) return null;
  const l2 = Math.hypot(L.dir.x, L.dir.y) || 1;
  const lx = L.dir.x / l2, ly = L.dir.y / l2, lz = clamp(L.dir.z, -1, 1);
  const key = L.key ?? 1;
  const shift = size * 0.62 * (1 - lz) * key;
  const rimW = Math.max(1.2, 5.5 * s) * (L.rim ?? 1);
  const rimAmt = clamp(0.35 - lz) * (L.rim ?? 1) * key;
  const sd = shiftD ?? d;
  return (
    <g>
      <defs><clipPath id={id}><path d={d} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        {shift > 0.5 && <path d={`${BIG} ${sd}`} transform={`translate(${f2(lx * shift)} ${f2(ly * shift)})`} fillRule="evenodd" fill={L.shadowC ?? '#2B3550'} opacity={0.34 * key * shadowAmt} />}
        {rimAmt > 0.04 && <path d={`${BIG} ${sd}`} transform={`translate(${f2(-lx * rimW)} ${f2(-ly * rimW)})`} fillRule="evenodd" fill={L.rimC ?? '#FFC890'} opacity={clamp(rimAmt * 1.6) * 0.9} />}
      </g>
    </g>
  );
};

// limb as a chain of quads with round interior joints: ink layer (widened) then fills, then one shadow and one rim for
// the whole limb (limbShade). Ends are square (they hide inside the torso/pelvis or under the hand/shoe).
const quad = (a: V2, b: V2, hw0: number, hw1: number, o0 = 0, o1 = 0) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  return `M ${f2(a.x + nx * (o0 + hw0))} ${f2(a.y + ny * (o0 + hw0))} L ${f2(b.x + nx * (o1 + hw1))} ${f2(b.y + ny * (o1 + hw1))} L ${f2(b.x + nx * (o1 - hw1))} ${f2(b.y + ny * (o1 - hw1))} L ${f2(a.x + nx * (o0 - hw0))} ${f2(a.y + ny * (o0 - hw0))} Z`;
};
const circD = (c: V2, r: number) => `M ${f2(c.x - r)} ${f2(c.y)} a ${f2(r)} ${f2(r)} 0 1 0 ${f2(2 * r)} 0 a ${f2(r)} ${f2(r)} 0 1 0 ${f2(-2 * r)} 0 Z`;
/**
 * Cel shading of a limb made of several pieces (segment quads and joint disks, as path d strings): ONE shadow on the side
 * away from the light and ONE rim on the lit side for the whole shape — the shape minus its own copy shifted toward
 * (or away from) the light, as celOver does for the torso — so the bands run continuously round the joints. (R2 shaded
 * each segment with its own offset band and left the joint disks out of it, so a bent knee or elbow showed a flat disk
 * of another tone: an exposed joint circle.)
 */
const limbShade = (uid: string, shapes: string[], L: FigLight | undefined, w: number, s: number, box: V2[]): React.ReactNode => {
  if (!L || !shapes.length) return null;
  const l2 = Math.hypot(L.dir.x, L.dir.y) || 1;
  const lx = L.dir.x / l2, ly = L.dir.y / l2, lz = clamp(L.dir.z, -1, 1), key = L.key ?? 1;
  const frac = clamp(0.32 + 0.5 * (0.5 - lz * 0.6), 0.2, 0.92) * key;
  const shift = w * frac, rimAmt = clamp(0.35 - lz) * (L.rim ?? 1) * key, rw = Math.max(0.8, 2.4 * s) * 2;
  const pad = w * 2 + 4;
  const x0 = Math.min(...box.map((q) => q.x)) - pad, y0 = Math.min(...box.map((q) => q.y)) - pad;
  const x1 = Math.max(...box.map((q) => q.x)) + pad, y1 = Math.max(...box.map((q) => q.y)) + pad;
  const R = {x: f2(x0), y: f2(y0), width: f2(x1 - x0), height: f2(y1 - y0)};
  const paths = (k: string) => shapes.map((d, i) => <path key={`${k}${i}`} d={d} />);
  return (
    <g>
      <defs>
        <clipPath id={`${uid}c`}>{paths('c')}</clipPath>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" {...R}>
          <rect {...R} fill="#FFFFFF" />
          <g fill="#000000" transform={`translate(${f2(lx * shift)} ${f2(ly * shift)})`}>{paths('m')}</g>
        </mask>
        {rimAmt > 0.04 && <mask id={`${uid}r`} maskUnits="userSpaceOnUse" {...R}>
          <rect {...R} fill="#FFFFFF" />
          <g fill="#000000" transform={`translate(${f2(-lx * rw)} ${f2(-ly * rw)})`}>{paths('r')}</g>
        </mask>}
      </defs>
      <g clipPath={`url(#${uid}c)`}>
        <rect {...R} fill={L.shadowC ?? '#2B3550'} opacity={0.3 * key} mask={`url(#${uid}m)`} />
        {rimAmt > 0.04 && <rect {...R} fill={L.rimC ?? '#FFC890'} opacity={clamp(rimAmt * 1.6) * 0.85} mask={`url(#${uid}r)`} />}
      </g>
    </g>
  );
};

const LimbG: React.FC<{pts: V2[]; w: number | number[]; ink: number; inkC: string; colors: string[]; L?: FigLight; s: number; endCap?: boolean; startCap?: number; uid: string}> = ({pts, w, ink, inkC, colors, L, s, endCap, startCap = 0, uid}) => {
  const W = pts.map((_, i) => (Array.isArray(w) ? w[Math.min(i, w.length - 1)] : w));
  const segs = pts.slice(0, -1).map((a, i) => ({a, b: pts[i + 1], w0: W[i], w1: W[i + 1], c: colors[Math.min(i, colors.length - 1)]}));
  const joints = pts.slice(1, endCap ? undefined : -1).map((q, j) => ({q, r: W[j + 1] / 2, c: colors[Math.min(j + 1, colors.length - 1)]}));
  const shapes = [...segs.map((g) => quad(g.a, g.b, g.w0 / 2, g.w1 / 2)), ...joints.map((j) => circD(j.q, j.r))];
  return (
    <g>
      <g fill={inkC}>
        {segs.map((g, i) => <path key={i} d={quad(g.a, g.b, g.w0 / 2 + ink, g.w1 / 2 + ink)} />)}
        {joints.map((j, i) => <circle key={`j${i}`} cx={j.q.x} cy={j.q.y} r={j.r + ink} />)}
        {startCap > 0.02 && <circle cx={pts[0].x} cy={pts[0].y} r={W[0] / 2 + ink} opacity={startCap} />}
      </g>
      {segs.map((g, i) => <path key={`f${i}`} d={quad(g.a, g.b, g.w0 / 2, g.w1 / 2)} fill={g.c} />)}
      {startCap > 0.02 && <circle cx={pts[0].x} cy={pts[0].y} r={W[0] / 2} fill={colors[0]} opacity={startCap} />}
      {joints.map((j, i) => <circle key={`jf${i}`} cx={j.q.x} cy={j.q.y} r={j.r} fill={j.c} />)}
      {limbShade(uid, shapes, L, Math.max(...W), s, pts)}
    </g>
  );
};

/**
 * One limb segment as separate ink and fill layers, so two segments of a limb (upper arm / forearm, thigh / shin) can be
 * drawn in either order or in different depth parts. `capA` / `capB` (0..1) round the segment's start / end with a disk
 * (fill, plus its ink rim at that opacity): a forearm emerging in front of its own upper arm or of the torso shows a
 * rounded elbow, an upper arm in front of the chest a rounded shoulder. `joint` adds the shared joint disk at b, filled
 * and shaded with this segment (never a separate flat disk over the shading).
 */
const segLayers = (a: V2, b: V2, w0: number, w1: number, ink: number, inkC: string, c: string, L: FigLight | undefined, s: number, capA = 0, capB = 0, key = 's', capAInk = capA, uid = key, joint = false, capScale = 1) => {
  const inkEl = (
    <g key={`${key}i`} fill={inkC}>
      <path d={quad(a, b, w0 / 2 + ink, w1 / 2 + ink)} />
      {capA > 0.02 && capAInk > 0.02 && <circle cx={a.x} cy={a.y} r={(w0 / 2) * capScale + ink} opacity={capAInk} />}
      {capB > 0.02 && <circle cx={b.x} cy={b.y} r={w1 / 2 + ink} opacity={capB} />}
    </g>
  );
  const shapes = [quad(a, b, w0 / 2, w1 / 2)];
  if (capA > 0.02) shapes.push(circD(a, (w0 / 2) * capScale));
  if (capB > 0.02 || joint) shapes.push(circD(b, w1 / 2));
  const fillEl = (
    <g key={`${key}f`}>
      {shapes.map((d, i) => <path key={i} d={d} fill={c} />)}
      {limbShade(uid, shapes, L, Math.max(w0, w1), s, [a, b])}
    </g>
  );
  return {ink: inkEl, fill: fillEl};
};

const LimbDecal: React.FC<{d: Decal; a: V2; b: V2; w: number; ink: number; inkC: string; skin: string}> = ({d, a, b, w, ink, inkC, skin}) => {
  const x = lerp(a.x, b.x, d.u), y = lerp(a.y, b.y, d.u);
  const ang = ang2(a, b);
  const sz = (d.size ?? 1) * w * 0.42;
  const sd = d.seed ?? 5;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(ang)})`} opacity={d.amt ?? 1}>
      {d.kind === 'tear' && (<g><path d={tearPath(sz, sd)} fill={skin} stroke={inkC} strokeWidth={ink * 0.6} strokeLinejoin="round" /><path d={`M ${-sz * 0.5} ${-sz * 0.15} l ${sz * 0.9} ${sz * 0.25}`} stroke={BLOOD.scrape} strokeWidth={sz * 0.18} strokeLinecap="round" /></g>)}
      {d.kind === 'blood' && (<g><path d={blobPath(sz, sd, 9, 0.5, 1.3, 0.8)} fill={BLOOD.main} /><path d={blobPath(sz * 0.5, sd + 4, 8, 0.4)} fill={BLOOD.dark} /></g>)}
      {d.kind === 'scrape' && [-1, 0, 1].map((k) => <line key={k} x1={-sz * 0.6} y1={k * sz * 0.25} x2={sz * 0.5} y2={k * sz * 0.25 + sz * 0.1} stroke={BLOOD.scrape} strokeWidth={sz * 0.12} strokeLinecap="round" />)}
      {d.kind === 'dirt' && <path d={blobPath(sz, sd, 8, 0.5)} fill="rgba(60,45,40,0.3)" />}
      {d.kind === 'bandage' && <rect x={-sz * 0.9} y={-w * 0.55} width={sz * 1.8} height={w * 1.1} rx={w * 0.2} fill="#F5F2EA" stroke={inkC} strokeWidth={ink * 0.6} />}
    </g>
  );
};

// ------------------------------------------------------------------ the figure
export const figureParts = (p: FigProps): {parts: Part[]; rig: Rig2} => {
  const r = solve2(p);
  const {s, ink, base, up} = r;
  const look = p.look;
  const t = p.t;
  const seed = p.seed ?? 1;
  const id = (p.id ?? `f${seed}`).replace(/[^a-zA-Z0-9_]/g, '_');
  // (a silhouette is flat: marks with their own colours — blood, dust, bruises — are left out; worn gear stays)
  const dmg: Damage = p.silhouette ? {satchel: p.dmg?.satchel} : p.dmg ?? {};
  const L = p.silhouette ? undefined : p.light;
  const parts: Part[] = [];
  const sil = p.silhouette;
  const fogK = L?.fog ?? 0, fireK = L?.fire ?? 0;
  const col = (c: string) => {
    if (sil) return sil;
    let o = c;
    if (fireK > 0.02) o = mix(o, L!.fireC ?? '#FF9A4A', Math.min(0.32, fireK * 0.3));
    if (fogK > 0.01) o = mix(o, L!.fogC ?? '#9C7E73', fogK);
    return o;
  };
  const inkC = sil ?? (fogK > 0.01 ? mix(C.ink, L!.fogC ?? '#9C7E73', fogK * 0.95) : C.ink);
  r.id = id; r.col = col; r.inkC = inkC;
  const add = (z: number, key: string, el: React.ReactElement) => parts.push({z, key, el});
  const sleeveRaw = look.overlay ? look.overlayColor ?? look.shirt : look.shirt;
  const sleeve = col(sleeveRaw);
  const skin = col(look.skin);
  const breath = p.chest !== undefined ? clamp(p.chest, -1, 1) * 1.5 : (p.breath ?? 0.15) * Math.sin(t * Math.PI * 2 * (0.32 + (p.breath ?? 0.15) * 0.5) + seed);
  const shOp = p.shadow ?? 1;

  // ---------------- contact shadows (ground under the feet / body), flattened by the camera pitch
  if (shOp > 0 && !sil) {
    const flat = clamp(Math.sin(rad(Math.abs(p.pitch ?? 8))) * 1.15, 0.12, 1);
    const sh: React.ReactElement[] = [];
    [0, 1].forEach((i) => {
      const A = r.ankle[i];
      const h = (r.root.y - A.y) / s; // foot height above the root ground (rig units)
      const o = clamp(1 - h / 60) * 0.42 * shOp;
      if (o > 0.02) sh.push(<ellipse key={`fs${i}`} cx={A.x + base.F.x * 10 * s} cy={A.y + ANKLE_H * s * 0.9 + h * s * 0} rx={30 * s} ry={30 * s * flat} fill="rgba(12,10,14,1)" opacity={o} />);
    });
    const pz = (r.root.y - r.P.y) / s;
    if (pz < 120) {
      // low body (kneeling, sitting, lying): a body shadow under the pelvis
      sh.push(<ellipse key="bs" cx={r.P.x} cy={r.root.y} rx={90 * s} ry={90 * s * flat} fill="rgba(12,10,14,1)" opacity={0.3 * shOp * clamp(1 - pz / 120)} />);
    }
    sh.push(<ellipse key="gs" cx={(r.ankle[0].x + r.ankle[1].x) / 2} cy={r.root.y} rx={70 * s} ry={70 * s * flat} fill="rgba(12,10,14,1)" opacity={0.16 * shOp} />);
    add(-1e6, 'shadow', <g>{sh}</g>);
  }

  const pantsC = col(look.pants), shoeC = col(look.shoes);
  // ---------------- pelvis (projected ellipsoid, follows lean/pitch/roll)
  let pelvisEl: React.ReactElement | null = null;
  {
    const c = at(r.P, base, 0, 4 * s, 0);
    const e = ellipsoid2([mul3(base.R, 64 * s), mul3(base.U, 26 * s), mul3(base.F, 38 * s)]);
    const d = `M ${f2(c.x - e.rx)} ${f2(c.y)} a ${f2(e.rx)} ${f2(e.ry)} 0 1 0 ${f2(2 * e.rx)} 0 a ${f2(e.rx)} ${f2(e.ry)} 0 1 0 ${f2(-2 * e.rx)} 0 Z`;
    pelvisEl = (<g transform={`rotate(${f2(e.rot)} ${f2(c.x)} ${f2(c.y)})`}><path d={d} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={ink * 1.6} /></g>);
    add(r.torsoZ - 20, 'pelvis', (
      <g transform={`rotate(${f2(e.rot)} ${f2(c.x)} ${f2(c.y)})`}>
        <path d={d} fill={pantsC} stroke={inkC} strokeWidth={ink} />
      </g>
    ));
  }

  // ---------------- torso silhouette from cross sections (R1 construction)
  const view = {x: 0, y: 0, z: 1};
  const sp = sub3(at(r.P, up, 0, 1, 0), r.P);
  const u2 = norm3({x: sp.x, y: sp.y, z: 0});
  const n2 = {x: -u2.y, y: u2.x, z: 0};
  const breathK = 1 + breath * 0.012;
  const ext = (a: number, b: number) => Math.sqrt((a * dot3(up.R, n2)) ** 2 + (b * dot3(up.F, n2)) ** 2) * s;
  const center = (h: number) => at(r.P, up, 0, h * s * (h > 60 ? breathK : 1), 0);
  const Lp: V2[] = [], Rp: V2[] = [];
  TORSO.forEach(([h, a, b]) => {
    const c = center(h); const e = ext(a, b) * (h > 60 ? 1 + breath * 0.008 : 1);
    Lp.push({x: c.x - n2.x * e, y: c.y - n2.y * e}); Rp.push({x: c.x + n2.x * e, y: c.y + n2.y * e});
  });
  const topC = center(149), cor = center(144);
  const eTop = ext(52, 30), eCor = ext(74, 38);
  const torsoPts: V2[] = [
    ...Lp, {x: cor.x - n2.x * eCor, y: cor.y - n2.y * eCor}, {x: topC.x - n2.x * eTop, y: topC.y - n2.y * eTop},
    {x: topC.x + n2.x * eTop, y: topC.y + n2.y * eTop}, {x: cor.x + n2.x * eCor, y: cor.y + n2.y * eCor}, ...[...Rp].reverse(),
  ];
  const bot = center(-27);
  torsoPts.push({x: bot.x, y: bot.y});
  const torsoD = smoothPath(torsoPts, true, 0.42);
  const ab0 = (h: number): [number, number] => {
    let a = 72, b = 40;
    for (let i = 1; i < TORSO.length; i++) if (h <= TORSO[i][0]) { const k = (h - TORSO[i - 1][0]) / (TORSO[i][0] - TORSO[i - 1][0]); a = lerp(TORSO[i - 1][1], TORSO[i][1], k); b = lerp(TORSO[i - 1][2], TORSO[i][2], k); break; }
    if (h > SH_H) { a = lerp(76, 56, (h - SH_H) / 22); b = lerp(40, 32, (h - SH_H) / 22); }
    return [a, b];
  };
  const surf = (phi: number, h: number) => {
    let a = 72, b = 40;
    for (let i = 1; i < TORSO.length; i++) if (h <= TORSO[i][0]) { const k = (h - TORSO[i - 1][0]) / (TORSO[i][0] - TORSO[i - 1][0]); a = lerp(TORSO[i - 1][1], TORSO[i][1], k); b = lerp(TORSO[i - 1][2], TORSO[i][2], k); break; }
    if (h > SH_H) { a = lerp(76, 56, (h - SH_H) / 22); b = lerp(40, 32, (h - SH_H) / 22); }
    const ph = rad(phi);
    const q = at(center(h), up, a * Math.sin(ph) * s, 0, b * Math.cos(ph) * s);
    const nrm = add3(mul3(up.R, Math.sin(ph) / a), mul3(up.F, Math.cos(ph) / b));
    return {x: q.x, y: q.y, vis: dot3(norm3(nrm), view)};
  };
  const fcol = look.overlay ? col(look.overlayColor ?? look.shirt) : col(look.shirt);
  const tf: React.ReactElement[] = [];
  if (look.overlay) {
    const open = (h: number) => {
      if (look.overlay === 'vest') return h > 110 ? lerp(14, 26, (h - 110) / 37) : lerp(40, 14, (h - -12) / 122);
      if (look.overlay === 'jacket') return h > 70 ? lerp(0, 30, (h - 70) / 77) : 0.01;
      return lerp(10, 22, (h + 12) / 159);
    };
    const hs = [-12, 10, 35, 60, 85, 110, 128, 147];
    const toPhi = (w: number, h: number) => (Math.asin(clamp(w / (h > 120 ? 66 : 70), -1, 1)) * 180) / Math.PI;
    const left = hs.map((h) => surf(-toPhi(open(h), h), h)), right = hs.map((h) => surf(toPhi(open(h), h), h));
    if ([...left, ...right].some((q) => q.vis > 0.05)) {
      const poly = [...left, ...[...right].reverse()].map((q) => ({x: q.x, y: q.y}));
      const minVis = Math.min(...[...left, ...right].map((q) => q.vis));
      tf.push(<path key="open" d={polyPath(poly)} fill={col(look.shirt)} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" opacity={minVis < 0 ? clamp(1 + minVis * 3) : 1} />);
    }
  }
  if (look.stripes) {
    for (let k = 0; k < 5; k++) {
      const h0 = 140 - k * 30, h1 = h0 - 14;
      // (R4) the loop starts on the HIDDEN side of the torso, so the visible arc is one contiguous run: R3 swept phi from -180,
      // and once the visible arc crossed the seam at the back (yaw ~88 and ~272 for a figure facing right / left) the band
      // joined its two ends across the chest and the stripes vanished from the torso in one frame
      const pc = (h: number) => { const [a, b] = ab0(h); return (Math.atan2(up.R.z / a, up.F.z / b) * 180) / Math.PI; };
      const base0 = (h: number) => Math.round((pc(h) - 180) / 15) * 15;
      const band: V2[] = [];
      for (let i = 0; i <= 24; i++) { const q = surf(base0(h0) + i * 15, h0); if (q.vis > -0.05) band.push(q); }
      const band2: V2[] = [];
      for (let i = 24; i >= 0; i--) { const q = surf(base0(h1) + i * 15, h1); if (q.vis > -0.05) band2.push(q); }
      if (band.length > 1 && band2.length > 1) tf.push(<path key={`st${k}`} d={polyPath([...band, ...band2])} fill={col(look.stripes)} />);
    }
  }
  if (look.accessories.includes('nametag')) {
    const c = surf(-30, 106);
    if (c.vis > 0.04) {
      const sx = clamp(c.vis * 1.1, 0.25, 1);
      const a = Math.atan2(u2.x, -u2.y) * 180 / Math.PI;
      tf.push(
        <g key="tag" transform={`translate(${f2(c.x)} ${f2(c.y)}) rotate(${f2(a)}) scale(${f2(sx)} 1)`} opacity={rz(c.vis, 0.04, 0.2)}>
          <rect x={-20 * s} y={-11 * s} width={40 * s} height={22 * s} rx={4 * s} fill={col(C.white)} stroke={inkC} strokeWidth={ink * 0.75} />
          <rect x={-14 * s} y={-3 * s} width={28 * s} height={5 * s} rx={2 * s} fill={col(C.inkMuted)} />
        </g>,
      );
    }
  }
  if (look.accessories.includes('bowtie')) {
    const c = surf(0, 146);
    if (c.vis > 0.03) {
      const sx = clamp(c.vis * 1.1, 0.25, 1);
      tf.push(<g key="bow" transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`} opacity={rz(c.vis, 0.03, 0.15)}>
        <path d={`M 0 0 L ${-17 * s} ${-9 * s} L ${-17 * s} ${9 * s} Z M 0 0 L ${17 * s} ${-9 * s} L ${17 * s} ${9 * s} Z`} fill={col('#C0392B')} stroke={inkC} strokeWidth={ink * 0.7} strokeLinejoin="round" />
        <circle r={4.5 * s} fill={col('#C0392B')} stroke={inkC} strokeWidth={ink * 0.6} />
      </g>);
    }
  }
  (dmg.stains ?? []).forEach((st, k) => {
    const c = surf(st.phi, st.h);
    if (c.vis <= 0.02) return;
    const sx = clamp(c.vis, 0.2, 1);
    const sd = st.seed ?? k + 3;
    if (st.kind === 'tear') {
      tf.push(<g key={`stn${k}`} transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`} opacity={(st.amt ?? 1) * rz(c.vis, 0.02, 0.15)}><path d={tearPath(st.size * s, sd)} fill={skin} stroke={inkC} strokeWidth={ink * 0.6} strokeLinejoin="round" /></g>);
      return;
    }
    const c1 = st.kind === 'dirt' ? 'rgba(60,45,40,0.35)' : BLOOD.main;
    tf.push(
      <g key={`stn${k}`} transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`} opacity={(st.amt ?? 1) * rz(c.vis, 0.02, 0.15)}>
        <path d={blobPath(st.size * s, sd, 10, 0.45)} fill={c1} />
        {st.kind !== 'dirt' && <path d={blobPath(st.size * 0.45 * s, sd + 9, 8, 0.4)} fill={BLOOD.dark} transform={`translate(${-st.size * 0.15 * s} ${st.size * 0.1 * s})`} />}
      </g>,
    );
  });
  if ((dmg.dust ?? 0) > 0) [[-40, 70, 22], [35, 30, 18], [10, 120, 16]].forEach(([ph, h, sz], k) => {
    const c = surf(ph, h);
    if (c.vis > 0.05) tf.push(<path key={`du${k}`} d={blobPath(sz * s, 40 + k, 9, 0.5)} transform={`translate(${f2(c.x)} ${f2(c.y)})`} fill="#B9AA98" opacity={0.3 * (dmg.dust ?? 0)} />);
  });
  const torsoSize = Math.max(ext(72, 40), 40 * s);
  add(r.torsoZ, 'torso', (
    <g>
      <path d={torsoD} fill={fcol} />
      <defs><clipPath id={`${id}tc`}><path d={torsoD} /></clipPath></defs>
      <g clipPath={`url(#${id}tc)`}>{tf}</g>
      {celOver(`${id}ts`, torsoD, L, torsoSize, s)}
      <path d={torsoD} fill="none" stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />
    </g>
  ));

  // ---------------- arms, hands, worn and held props
  const hShape = [p.handL ?? 'relaxed', p.handR ?? 'relaxed'];
  const AW = [ARM_W * 1.08 * s, ARM_W * 0.86 * s, ARM_W * 0.74 * s];
  const bT = 10 * s; // the torso hides a limb where its front surface is nearer than the limb's axis by this much: tuned so that a
                     // hanging arm (a depth tie with the torso's side) starts to show over the shirt where R3 flipped it
  /** A part of a limb against the torso: `rankOld` is the part's rank by R3's one-point rule. In front of the torso it is
   *  masked by the regions the torso hides (the torso shows through them); behind it (zone 0) it stays under the torso,
   *  and a second copy just over the torso, clipped to the torso's outline minus those regions, shows it where it is
   *  nearer: so nothing outside the torso's outline changes order, and inside it the limb comes and goes with the depth
   *  field instead of flipping whole. */
  const torsoParts = (key: string, el: React.ReactElement, rankOld: number, polys: V2[][], touch: boolean, vis: boolean, qz: number, pts: V3[], padPx: number, rankAdd = 0) => {
    const zone0 = zoneOfRank(r, rankOld) === 0;
    if (!touch) { add(rankOld, key, el); return; }
    const x0 = Math.min(...pts.map((q) => q.x)) - padPx, x1 = Math.max(...pts.map((q) => q.x)) + padPx;
    const y0 = Math.min(...pts.map((q) => q.y)) - padPx, y1 = Math.max(...pts.map((q) => q.y)) + padPx;
    const box = {x: f2(x0), y: f2(y0), width: f2(x1 - x0), height: f2(y1 - y0)};
    const black = polys.map((q, k) => <path key={k} d={polyPath(q)} fill="#000000" />);
    if (!zone0) {
      if (!polys.length) { add(rankOld, key, el); return; }
      const mid = `${id}tm${key}`;
      add(rankOld, key, <g><defs><mask id={mid} maskUnits="userSpaceOnUse" {...box}><rect {...box} fill="#FFFFFF" />{black}</mask></defs><g mask={`url(#${mid})`}>{el}</g></g>);
      return;
    }
    add(rankOld, key, el);
    if (!vis) return; // the torso hides it wherever they overlap: nothing to show over the torso
    const rFront = r.zoneZ[1] + clamp((qz - r.torsoZ) / (600 * s), -1, 1) * 0.3 + rankAdd;
    const xid = `${id}tx${key}`;
    add(rFront, `${key}x`, (
      <g>
        <defs><mask id={xid} maskUnits="userSpaceOnUse" {...box}><rect {...box} fill="#000000" /><path d={torsoD} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={ink * 1.6} strokeLinejoin="round" />{pelvisEl}{black}</mask></defs>
        <g mask={`url(#${xid})`}>{el}</g>
      </g>
    ));
  };
  // ---------------- legs (stroke limbs, butt-capped at the hip inside the pelvis) and shoes
  [0, 1].forEach((i) => {
    const H = r.hip[i], K = r.knee[i], A = r.ankle[i];
    const legZ = (H.z + K.z + A.z) / 3;
    const pitchF = ([p.legL, p.legR][i]?.pitch ?? 0);
    // shoe: a projected ellipsoid along the foot (toe pitched by `pitch`)
    let F = base.F;
    if (pitchF) F = rotAxis(F, base.R, rad(-pitchF));
    const sc = add3(A, add3(mul3(F, 12 * s), mul3(base.U, -5 * s)));
    const e = ellipsoid2([mul3(F, 33 * s), mul3(base.R, 15 * s), mul3(base.U, 13 * s)]);
    const decals = sil ? [] : (dmg.decals ?? []).filter((d) => d.limb === (i === 0 ? 'legL0' : 'legR0') || d.limb === (i === 0 ? 'legL1' : 'legR1'));
    // (R4) the leg against the torso. R3 drew a thigh toward the camera over the torso's hem with a rounded hip whenever its angle
    // passed a threshold (legFront: 0.68 of the thigh's length, then the lead's legOverTorso), and behind the torso otherwise: a
    // braced or stepping figure turned a degree or two and its forward thigh jumped over the shirt, hip arc and all. The leg now
    // always starts inside the pelvis (the torso hides that end) and is masked by where the torso's front surface is nearer
    // than the leg's axis (torsoHides), the same rule as the arms; behind the torso it keeps R3's rank, and a second copy just
    // over the torso, clipped to its outline, shows it where it is nearer.
    const LW = [LEG_W * 1.05 * s, LEG_W * 0.95 * s, LEG_W * 0.8 * s];
    const Hn = add3(H, mul3(norm3(sub3(H, K)), 10 * s));
    // (a thigh toward the camera starts with a rounded hip over the belly; a hanging one starts inside the pelvis, cap hidden)
    const fwdK = clamp(((K.z - H.z) / (THIGH * s) - 0.3) / 0.4);
    const legEl = <LimbG pts={[Hn, K, A]} w={LW} ink={ink} inkC={inkC} colors={[pantsC, pantsC]} L={L} s={s} startCap={fwdK} uid={`${id}lg${i}`} />;
    const legBody = (
      <g>
        <ellipse cx={sc.x} cy={sc.y} rx={Math.max(e.rx, 12 * s)} ry={Math.max(e.ry, 9 * s)} transform={`rotate(${f2(e.rot)} ${f2(sc.x)} ${f2(sc.y)})`} fill={shoeC} stroke={inkC} strokeWidth={ink} />
        {legEl}
        {decals.map((d, k) => <LimbDecal key={k} d={d} a={d.limb.endsWith('0') ? H : K} b={d.limb.endsWith('0') ? K : A} w={LEG_W * s} ink={ink} inkC={inkC} skin={skin} />)}
      </g>
    );
    const rankBack = r.torsoZ - 40 + clamp((legZ - r.torsoZ) / (600 * s), -1, 1) * 0.3 + i * 0.001;
    // (the bias grows as the thigh points at the camera: a flexed hip's thigh comes out in front of the belly, a hanging one stays under the hem)
    const bL = (12 + 78 * fwdK) * s, tip = add3(A, mul3(norm3(sub3(A, K)), 22 * s));
    const h1 = torsoHides(r, Hn, K, LW[0] / 2 + ink + 2 * s, bL, ink * 0.6), h2 = torsoHides(r, K, tip, LW[1] / 2 + ink + 2 * s, bL, ink * 0.6);
    torsoParts(`leg${i}`, legBody, rankBack, [...h1.polys, ...h2.polys], h1.touch || h2.touch, h1.vis || h2.vis, (Hn.z + K.z) / 2, [Hn, K, tip], 26 * s + ink * 3, -2 + i * 0.01);
  });

  [0, 1].forEach((i) => {
    const S = r.sh[i], E = r.el[i], Wr = r.wr[i];
    const hf = r.hands[i];
    const hb = sil ? 0 : (dmg.handBlood ?? {})[i === 0 ? 'L' : 'R'] ?? 0;
    const decals = sil ? [] : (dmg.decals ?? []).filter((d) => d.limb.startsWith(i === 0 ? 'armL' : 'armR'));
    const ua = norm3(sub3(E, S)), fa = norm3(sub3(Wr, E));
    // the depth of each half of the arm (solve2: armRankU / armRank) and which half is nearer the camera
    const rU = r.armRankU[i], rL = r.armRank[i];
    const zU = (S.z + E.z) / 2, zL = E.z * 0.25 + Wr.z * 0.75;
    // the upper arm itself can cross a zone along its length (a shoulder below the jaw seen from low in front: its top
    // behind the jaw, the rest in front of the chest); the elbow end's depth decides the elbow's overlap
    const zoneS = r.zoneAt(lerp3(S, E, 0.08)), zoneE = r.zoneAt(lerp3(S, E, 0.92)), zoneU = zoneOfRank(r, rU);
    // (only a crossing into the face's zone splits it: at the torso's flank the in-front/behind call is marginal, and a
    // split there left a stray square of sleeve on the shoulder)
    // (R4: and only while the upper arm is near the head's outline on screen: a near shoulder 'in front of the face' in a rear
    // three-quarter view overlaps nothing, and the split it caused changed the arm's whole drawing in one frame)
    const nearHead = [0, 0.25, 0.5, 0.75, 1].some((t) => { const q = lerp3(S, E, t); return ((q.x - r.headC.x) / (HEAD_R * s * 1.12)) ** 2 + ((q.y - r.headC.y) / (HEAD_RY * s * 1.2)) ** 2 < 1.3; });
    const upperCross = !r.armOverride ? false : nearHead && (zoneS === 2 || zoneE === 2 || zoneU === 2) && (zoneS !== zoneU || zoneE !== zoneU);
    const rUE = upperCross ? r.zoneZ[zoneE] : rU;
    // (R4) the torso against this arm: see torsoHides / torsoParts. Where only the torso decides (neither half meets the face's
    // zone, no depth override) the arm is ONE part whatever the halves' ranks: R3 split it into two parts when the upper arm
    // was behind the torso and the forearm in front, and rejoined it when the upper arm flipped over: the elbow's drawing
    // changed in the same frame as the sleeve
    const tm = !r.armOverride;
    const zoneL = zoneOfRank(r, rL);
    const torsoOnly = tm && !upperCross && zoneU <= 1 && zoneL <= 1;
    const split = !torsoOnly && (Math.abs(rU - rL) > 1 || upperCross); // the halves sit in different depth zones (or the pose overrides the forearm's)
    const lowerTop = split ? rL > rUE : zL >= zU - 4 * s;
    const bend = Math.acos(clamp(dot3(ua, fa), -1, 1)) * (180 / Math.PI);
    // the shoulder: an upper arm behind the torso's surface starts inside it with a square end (R1 fix: no disks at the
    // shoulders), pulled in toward the chest's axis — and back along the arm only when the arm is raised. (R2 pulled
    // it 16 units back along the arm whatever the pose: an arm reaching across the body or down the front put that
    // square end outside the shoulder's outline, or up at the chin.) An upper arm in front of the torso's surface
    // starts AT the shoulder with a rounded sleeve end: unlined over the shirt (the join disappears), outlined where
    // it is over the face (a near shoulder below the jaw from a low camera) or seen end-on.
    const inward = norm3(sub3(r.torso({r: 0, u: SH_H - 6, f: 0}), S));
    const sTop = lerp3(S, E, 0.08);
    const overHead = ((sTop.x - r.headC.x) / (HEAD_R * s * 1.12)) ** 2 + ((sTop.y - r.headC.y) / (HEAD_RY * s * 1.2)) ** 2 < 1;
    // (R4) the shoulder cap comes in with the arm's depth at the shoulder against the torso's surface there, not with a rank flip
    const fS = torsoOnly ? r.torsoFront(S) : null;
    const wC = torsoOnly ? (fS === null ? 1 : rz(S.z - (fS - bT), 0, 10 * s)) : (zoneU >= 1 || zoneS === 2 ? 1 : 0);
    const capS = wC > 0.02 ? 1 : 0;
    const frontK = capS ? Math.max(clamp((ua.z - 0.6) / 0.3), zoneS === 2 && overHead ? 1 : 0) * (torsoOnly ? wC : 1) : 0;
    const raise = Math.max(0, dot3(ua, r.up.U));
    const S0b = add3(S, mul3(norm3(add3(mul3(ua, -0.9 * raise), inward)), 16 * s));
    const S0 = torsoOnly ? lerp3(S0b, S, wC) : capS ? S : S0b;
    const hideU = torsoOnly ? torsoHides(r, S0, E, AW[0] / 2 + ink + 2 * s, bT, ink * 0.6) : null;
    const handEnd = add3(Wr, mul3(fa, 36 * s));
    const hideL = torsoOnly ? torsoHides(r, E, handEnd, 19 * s + ink, bT, ink * 0.6) : null;
    const cuff = add3(S, mul3(ua, UPPER * s * 0.58));
    // forearm ends under the hand with a square end
    const W0 = add3(Wr, mul3(fa, 4 * s));
    const holdFn = i === 0 ? p.holdL : p.holdR;
    const hold0 = holdFn ? holdFn(hf, s, ink, col) : null;
    let hold = hold0 ? <g transform={propInGlyph(hf, s)}>{hold0}</g> : null;
    // a long one-handed prop crossing a depth zone: the piece in the hand's own zone stays in the fist (between the
    // glyph's layers), the others become parts in their zones (clipped to their runs of the prop's axis)
    let propH: ReturnType<typeof torsoHides> | null = null;
    if (hold && holdFn?.span) {
      const sp = holdFn.span;
      // (R4) with the torso deciding, the prop is not cut by the torso's zone either: it is masked by where the torso is nearer
      // than the prop's axis (as the arm is); only the face's zone still cuts it
      if (torsoOnly) propH = torsoHides(r, propPt(hf, sp[0] * s, sp[1] * s, s), propPt(hf, sp[2] * s, sp[3] * s, s), 16 * s + ink, bT, ink * 0.6);
      const hz = Math.max(zoneOfRank(r, r.armRank[i]), torsoOnly ? 1 : 0);
      // (a short prop: behind or in front of the torso it stays with its hand; only the face's depth cuts it)
      const runs = zoneRuns(r, propPt(hf, sp[0] * s, sp[1] * s, s), propPt(hf, sp[2] * s, sp[3] * s, s))
        .map((rn) => (torsoOnly && rn.zone < 1 ? {...rn, zone: 1} : rn))
        .map((rn) => (holdFn.spanFace && rn.zone < 2 && hz < 2 ? {...rn, zone: hz} : rn));
      if (runs.length > 1 || runs[0].zone !== hz) {
        const inG = hold;
        const det = hf.ax.x * hf.ay.y - hf.ay.x * hf.ax.y || 1e-6;
        const toGlyph = (q: V2): V2 => { const dx = q.x - hf.pos.x, dy = q.y - hf.pos.y; return {x: (hf.ay.y * dx - hf.ay.x * dy) / det, y: (-hf.ax.y * dx + hf.ax.x * dy) / det}; };
        const own = runs.filter((rn) => rn.zone === hz);
        const ownId = `${id}hz${i}`;
        hold = own.length ? (runs.length === 1 ? inG : (
          <g>
            <defs><clipPath id={ownId}>{own.map((rn, k) => <path key={k} d={polyPath(rn.poly.map(toGlyph))} />)}</clipPath></defs>
            <g clipPath={`url(#${ownId})`}>{inG}</g>
          </g>
        )) : null;
        runs.forEach((rn, k) => {
          if (rn.zone === hz) return;
          const cid = `${id}hp${i}_${k}`;
          const el = <g transform={handM(hf)}>{inG}</g>;
          const pel = rn.poly.length ? (
            <g><defs><clipPath id={cid}><path d={polyPath(rn.poly)} /></clipPath></defs><g clipPath={`url(#${cid})`}>{el}</g></g>
          ) : el;
          if (propH) torsoParts(`hold${i}_${k}`, pel, r.zoneZ[rn.zone] + 0.4, propH.polys, propH.touch, propH.vis, Wr.z, [hf.pos, propPt(hf, sp[0] * s, sp[1] * s, s), propPt(hf, sp[2] * s, sp[3] * s, s)], 24 * s + ink * 3);
          else add(r.zoneZ[rn.zone] + 0.4, `hold${i}_${k}`, pel);
        });
      }
    }
    const [hBack, hFront] = handGlyph(hShape[i], {s, ink, skin, inkC, pv: hf.pv, thumb: hf.thumb, blood: hb, dirt: sil ? 0 : (dmg.dirt ?? 0) * 0.6, holding: hold, framed: true});
    const handEl = (layer: React.ReactElement) => <g transform={handM(hf)}>{layer}</g>;
    const wearFn = i === 0 ? p.wearL : p.wearR;
    const dorsal = mul3(r.palm[i], -1);
    const wear = wearFn ? wearFn({E, W: Wr, dorsal, ang: ang2(E, Wr), len: len3(sub3(Wr, E))}, s, ink, col) : null;
    // the elbow: a half drawn over the other gets a rounded end there when the arm is bent (or the halves are in
    // different depth parts); a nearly straight arm keeps the shared joint (no ring across the arm)
    const capE = split ? 1 : clamp((bend - 35) / 30);
    // (the shared elbow disk of a one-part arm is part of the upper arm's shape and shading)
    const up = segLayers(S0, E, AW[0], AW[1], ink, inkC, skin, L, s, capS, lowerTop ? 0 : capE, `u${i}`, frontK, `${id}au${i}`, !split, torsoOnly ? wC : 1);
    const lo = segLayers(E, W0, AW[1], AW[2], ink, inkC, skin, L, s, lowerTop ? capE : 0, 0, `l${i}`, lowerTop ? capE : 0, `${id}al${i}`);
    const sideL = L ? -(Math.sign((-ua.y) * L.dir.x + ua.x * L.dir.y) || 1) : 1;
    const upperFill = (
      <g key={`uf${i}`}>
        {up.fill}
        {/* sleeve: shirt colour from the shoulder to the cuff (slightly flared), then a hem line */}
        <path d={quad(S0, cuff, ARM_W * 0.54 * s, ARM_W * 0.56 * s)} fill={sleeve} />
        {capS > 0 && <circle cx={S0.x} cy={S0.y} r={ARM_W * 0.54 * s * (torsoOnly ? wC : 1)} fill={sleeve} />}
        {L && <path d={quad(S0, cuff, ARM_W * 0.2 * s, ARM_W * 0.2 * s, sideL * ARM_W * 0.34 * s, sideL * ARM_W * 0.36 * s)} fill={L.shadowC ?? '#2B3550'} opacity={0.3 * (L.key ?? 1) * clamp(0.6 - L.dir.z * 0.6)} />}
        {(() => {
          const n = {x: -ua.y, y: ua.x};
          const nl = Math.hypot(n.x, n.y) || 1;
          const hw = (ARM_W * s) / 2;
          return <line x1={cuff.x + (n.x / nl) * hw * 1.12} y1={cuff.y + (n.y / nl) * hw * 1.12} x2={cuff.x - (n.x / nl) * hw * 1.12} y2={cuff.y - (n.y / nl) * hw * 1.12} stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" />;
        })()}
        {decals.filter((d) => d.limb.endsWith('0')).map((d, k) => <LimbDecal key={k} d={d} a={S} b={E} w={ARM_W * s} ink={ink} inkC={inkC} skin={skin} />)}
      </g>
    );
    // (the forearm's own outline goes over a plate strapped to its far side)
    const lowerFill = (
      <g key={`lf${i}`}>
        {wear && (wear.w === undefined ? !wear.front : wear.w < 1) && wear.el}
        {lo.ink}
        {lo.fill}
        {decals.filter((d) => d.limb.endsWith('1')).map((d, k) => <LimbDecal key={k} d={d} a={E} b={Wr} w={ARM_W * s} ink={ink} inkC={inkC} skin={skin} />)}
        {wear && (wear.w === undefined ? wear.front : wear.w > 0) && (wear.w === undefined || wear.w >= 1 ? wear.el : (() => {
          // the plate comes over the forearm from the forearm's outer edges inward as it turns to face the camera: it is drawn over
          // the forearm except where the forearm narrowed by w hides it (the plate behind is drawn in any case)
          const wid = `${id}wm${i}`, pad = 70 * s, bx = Math.min(E.x, Wr.x) - pad, by = Math.min(E.y, Wr.y) - pad, bw = Math.abs(E.x - Wr.x) + 2 * pad, bh = Math.abs(E.y - Wr.y) + 2 * pad;
          const bb = {x: f2(bx), y: f2(by), width: f2(bw), height: f2(bh)};
          return <g><defs><mask id={wid} maskUnits="userSpaceOnUse" {...bb}><rect {...bb} fill="#FFFFFF" /><path d={quad(E, Wr, (AW[1] / 2 + ink) * (1 - wear.w), (AW[2] / 2 + ink) * (1 - wear.w))} fill="#000000" /></mask></defs><g mask={`url(#${wid})`}>{wear.el}</g></g>;
        })())}
        {handEl(hBack)}
      </g>
    );
    if (!split) {
      // one part: the shared outline under both halves, then the far half, then the near half with its own outline
      // (a forearm folded across the upper arm keeps its edge)
      const elbowInk = <circle cx={E.x} cy={E.y} r={AW[1] / 2 + ink} fill={inkC} />;
      const armEl = lowerTop
        ? <g>{up.ink}{lo.ink}{elbowInk}{upperFill}{lowerFill}</g>
        : <g>{up.ink}{lo.ink}{elbowInk}{lowerFill}{up.ink}{upperFill}</g>;
      if (torsoOnly) torsoParts(`arm${i}`, armEl, rL, [...hideU!.polys, ...hideL!.polys, ...(propH?.polys ?? [])], hideU!.touch || hideL!.touch || !!propH?.touch, hideU!.vis || hideL!.vis || !!propH?.vis, (S.z + Wr.z) / 2, propH ? [S0, E, handEnd, propPt(hf, holdFn!.span![0] * s, holdFn!.span![1] * s, s), propPt(hf, holdFn!.span![2] * s, holdFn!.span![3] * s, s)] : [S0, E, handEnd], 24 * s + ink * 3);
      else add(rL, `arm${i}`, armEl);
    } else {
      if (upperCross) splitZones(r, `armU${i}`, <g>{up.ink}{upperFill}</g>, S0, E, 0.05).forEach((q) => parts.push(q));
      else add(rU, `armU${i}`, <g>{up.ink}{upperFill}</g>);
      add(rL, `arm${i}`, lowerFill);
    }
    const zF = p.zHandFront?.[i];
    // (two hands on one tool: the curled fingers over the tool's piece in the hand's own depth zone, see splitZones)
    const rHand = zF !== undefined ? r.torsoZ + zF : p.twoHanded ? (r.armOverride ? r.toolZ + 0.3 : r.zoneZ[zoneOfRank(r, rL)] + 0.6) : rL + 0.5;
    if (torsoOnly) torsoParts(`handf${i}`, handEl(hFront), rHand, hideL!.polys, hideL!.touch, hideL!.vis, Wr.z, [E, handEnd], 24 * s + ink * 3, 0.5);
    else add(rHand, `handf${i}`, handEl(hFront));
  });

  // ---------------- neck and head
  {
    const a = at(r.neck, up, 0, -6 * s, 0), b = at(r.headC, r.head, 0, -38 * s, 0);
    add(r.torsoZ + 2, 'neck', (
      <g>
        <LimbG pts={[a, b]} w={30 * s} ink={ink} inkC={inkC} colors={[skin]} L={L} s={s} uid={`${id}nk`} />
        {(() => { const c = at(r.neck, up, 0, 6 * s, 6 * s); const n = n2; return <path d={`M ${f2(c.x - n.x * 15 * s)} ${f2(c.y - n.y * 15 * s)} Q ${f2(c.x + up.U.x * -4 * s)} ${f2(c.y + up.U.y * -4 * s + 4 * s)} ${f2(c.x + n.x * 15 * s)} ${f2(c.y + n.y * 15 * s)}`} fill="none" stroke={inkC} strokeWidth={ink * 0.7} strokeLinecap="round" />; })()}
      </g>
    ));
  }
  const headParts = drawHead2({...p, dmg}, r, t, seed, inkC, col, skin, dmg, id, L);
  headParts.forEach((hp, k) => add(r.torsoZ + 5 + k * 0.01, `head${k}`, hp));

  if (p.extra) p.extra(r).forEach((q) => parts.push(q));
  if (dmg.satchel) satchelParts(r, dmg.satchel, inkC, col).forEach((q) => parts.push(q));

  parts.forEach((q) => { if (q.key !== 'shadow') q.z = q.z - r.torsoZ; });
  return {parts, rig: r};
};

// ------------------------------------------------------------------ head
export const drawHead2 = (p: FigProps, r: Rig2, t: number, seed: number, inkC: string, col: (c: string) => string, skin: string, dmg: Damage, id: string, L?: FigLight): React.ReactElement[] => {
  const {s, ink, head: hb} = r;
  const look = p.look;
  const Hc = r.headC;
  const R = HEAD_R * s, RY = HEAD_RY * s;
  const face = p.face ?? {};
  const out: React.ReactElement[] = [];
  const dir = (th: number, ey: number, rr = 1): V3 => {
    const a = rad(th);
    const horiz = add3(mul3(hb.F, Math.cos(a)), mul3(hb.R, Math.sin(a)));
    const ce = Math.sqrt(Math.max(0, 1 - Math.min(0.98, ey * ey)));
    return add3(mul3(horiz, R * rr * ce), mul3(hb.U, -ey * RY * rr));
  };
  const onHead = (th: number, ey: number, rr = 1) => {
    const d = dir(th, ey, rr);
    return {x: Hc.x + d.x, y: Hc.y + d.y, z: d.z / (R * rr), d};
  };
  const rollDeg = Math.atan2(hb.U.x, -hb.U.y) * (180 / Math.PI);
  const hl3 = (r0: number, u0: number, f0: number) => {
    const q = {x: Hc.x + hb.R.x * r0 * R + hb.U.x * u0 * RY + hb.F.x * f0 * R, y: Hc.y + hb.R.y * r0 * R + hb.U.y * u0 * RY + hb.F.y * f0 * R};
    const z = hb.R.z * r0 + hb.F.z * f0 + hb.U.z * u0;
    return {x: q.x, y: q.y, z};
  };
  const hairC = col(look.hairColor);
  const hairType = look.hair;
  const vol = (VOLUME[hairType] ?? 10) * s;
  const zv: V3 = {x: 0, y: 0, z: 1};
  const thC = (Math.atan2(dot3(hb.R, zv), dot3(hb.F, zv)) * 180) / Math.PI; // head azimuth facing the viewer

  // ---- skull union: skull ellipsoid + jaw + nose (ink underlay, then fills)
  const ell = (c: {x: number; y: number}, a: number, b: number, cdepth: number) => {
    const e = ellipsoid2([mul3(hb.R, a * R), mul3(hb.U, b * RY), mul3(hb.F, cdepth * R)]);
    return {cx: c.x, cy: c.y, ...e};
  };
  const skullE = ell(Hc, 1, 1, 1);
  const jawC = hl3(0, -0.5, 0.42);
  const jawE = ell(jawC, 0.6, 0.44, 0.6);
  const noseC = hl3(0, -0.02, 0.93);
  const noseE = ell(noseC, 0.12, 0.15, 0.22);
  const shapes = [skullE, jawE, noseE];
  const elD = (e: typeof skullE) => `M ${f2(e.cx - e.rx)} ${f2(e.cy)} a ${f2(e.rx)} ${f2(e.ry)} 0 1 0 ${f2(2 * e.rx)} 0 a ${f2(e.rx)} ${f2(e.ry)} 0 1 0 ${f2(-2 * e.rx)} 0 Z`;
  const elPath = (e: typeof skullE) => <path d={elD(e)} transform={`rotate(${f2(e.rot)} ${f2(e.cx)} ${f2(e.cy)})`} />;
  // a union path for clipping (rotated ellipses as polygons)
  const ellPoly = (e: typeof skullE, n = 28): V2[] => {
    const a = rad(e.rot), c = Math.cos(a), sn = Math.sin(a);
    return Array.from({length: n}, (_, k) => { const u = (k / n) * Math.PI * 2; const lx = Math.cos(u) * e.rx, ly = Math.sin(u) * e.ry; return {x: e.cx + lx * c - ly * sn, y: e.cy + lx * sn + ly * c}; });
  };
  const unionD = shapes.map((e) => polyPath(ellPoly(e))).join(' ');
  const skullInk = <g key="sk-ink" fill={inkC} stroke={inkC} strokeWidth={ink * 2} strokeLinejoin="round">{shapes.map((e, k) => <g key={k}>{elPath(e)}</g>)}</g>;
  const skullFill = <g key="sk-fill" fill={skin}>{shapes.map((e, k) => <g key={k}>{elPath(e)}</g>)}</g>;
  const headSize = R;

  // ---- (R4) the skull as the ellipsoid it is drawn from: the depth of its front surface at a drawn point, and the region it
  // hides from a thing at a given depth. What sits against the head (an ear, the headset's band, boom and cup, the pencil,
  // the swoop) is behind the skull or in front of it by THIS test, per piece or per pixel, not by a threshold on its own
  // centre depth: a threshold sent the whole thing between two layers in one frame (an ear, the headset cup, a tenth of
  // the boom, the swoop, as the head turned), where the skull's own outline hides it progressively.
  const AX = [mul3(hb.R, R), mul3(hb.U, RY), mul3(hb.F, R)];
  const detA = dot3(AX[0], cross3(AX[1], AX[2])) || 1e-9;
  const IR = [cross3(AX[1], AX[2]), cross3(AX[2], AX[0]), cross3(AX[0], AX[1])].map((v) => mul3(v, 1 / detA));
  /** depth (relative to the head's centre) of the skull's front surface at a drawn point; null outside its outline */
  const skullZ = (x: number, y: number): number | null => {
    const dx = x - Hc.x, dy = y - Hc.y;
    const c0 = IR[0].x * dx + IR[0].y * dy, c1 = IR[1].x * dx + IR[1].y * dy, c2 = IR[2].x * dx + IR[2].y * dy;
    const b0 = IR[0].z, b1 = IR[1].z, b2 = IR[2].z;
    const a = b0 * b0 + b1 * b1 + b2 * b2, b = c0 * b0 + c1 * b1 + c2 * b2, c = c0 * c0 + c1 * c1 + c2 * c2 - 1;
    const disc = b * b - a * c;
    return disc < 0 ? null : (-b + Math.sqrt(disc)) / a;
  };
  /** a point at depth z (relative to the head's centre) is hidden by the skull */
  const hiddenBy = (x: number, y: number, z: number) => { const zs = skullZ(x, y); return zs !== null && zs > z; };
  const poleN = {x: AX[0].z, y: AX[1].z, z: AX[2].z};
  const poleD = Math.hypot(poleN.x, poleN.y, poleN.z) || 1e-9;
  const pole = {x: Hc.x + (poleN.x * AX[0].x + poleN.y * AX[1].x + poleN.z * AX[2].x) / poleD, y: Hc.y + (poleN.x * AX[0].y + poleN.y * AX[1].y + poleN.z * AX[2].y) / poleD};
  /** the part of the drawing plane where the skull hides something at depth zp: a convex region round the face's pole
   *  (empty when the thing is in front of all of the skull, the whole outline when it is behind its middle) */
  const hidingPoly = (zp: number, n = 40): V2[] => {
    if (!hiddenBy(pole.x, pole.y, zp)) return [];
    const rmax = Math.max(R, RY) * 2.4, o: V2[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
      let lo = 0, hi = rmax;
      for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (hiddenBy(pole.x + ux * m, pole.y + uy * m, zp)) lo = m; else hi = m; }
      o.push({x: pole.x + ux * lo, y: pole.y + uy * lo});
    }
    return o;
  };
  /** An element that sits against the head, drawn BEHIND the skull (back) and, over it, where the skull does not hide it
   *  (front: masked by hidingPoly(zp); the whole element when nothing hides it). `c`/`r` bound it on the drawing plane. */
  const against = (key: string, el: React.ReactElement, zp: number, c: V2, r: number): {back: React.ReactElement | null; front: React.ReactElement} => {
    const poly = hidingPoly(zp);
    if (!poly.length) return {back: null, front: el};
    const pad = r + ink * 2 + 2, box = {x: f2(c.x - pad), y: f2(c.y - pad), width: f2(pad * 2), height: f2(pad * 2)};
    const mid = `${id}ag${key}`;
    return {
      back: el,
      front: (
        <g key={`${key}m`}>
          <defs><mask id={mid} maskUnits="userSpaceOnUse" {...box}><rect {...box} fill="#FFFFFF" /><path d={polyPath(poly)} fill="#000000" /></mask></defs>
          <g mask={`url(#${mid})`}>{el}</g>
        </g>
      ),
    };
  };

  // ---- hair cap
  const hairFront: React.ReactElement[] = [];
  const hl = HAIRLINE[hairType] ?? HAIRLINE.crop;
  const ro = rad(rollDeg);
  /** A hair mass: an open edge on the head (hairline, hem) closed by the arc of the hair-volume ellipse (centre Ce,
   *  semi-axes ax, ay, rolled with the head) that runs over the crown from the edge's last point back to its first. */
  const overCrown = (line: V2[], Ce: V2, ax: number, ay: number): V2[] => {
    const toE = (q: V2) => { const dx = q.x - Ce.x, dy = q.y - Ce.y; const lx = dx * Math.cos(-ro) - dy * Math.sin(-ro), ly = dx * Math.sin(-ro) + dy * Math.cos(-ro); return Math.atan2(ly / ay, lx / ax); };
    const fromE = (a: number): V2 => { const lx = Math.cos(a) * ax, ly = Math.sin(a) * ay; return {x: Ce.x + lx * Math.cos(ro) - ly * Math.sin(ro), y: Ce.y + lx * Math.sin(ro) + ly * Math.cos(ro)}; };
    const a2 = toE(line[line.length - 1]), a1 = toE(line[0]);
    const TAU = Math.PI * 2, top = -Math.PI / 2;
    const ccw = (((a1 - a2) % TAU) + TAU) % TAU;
    const dTop = (((top - a2) % TAU) + TAU) % TAU;
    const span = dTop < ccw ? ccw : ccw - TAU;
    // the arc leaves the edge's last point and returns to its first: near the ends it is pulled onto them (the edge
    // lies on the head's shell, the arc on the larger hair-volume ellipse; R2 joined them with a jump that left a
    // sharp point of hair sticking out at the temple in rear three-quarter views)
    const e2 = {x: line[line.length - 1].x - fromE(a2).x, y: line[line.length - 1].y - fromE(a2).y};
    const e1 = {x: line[0].x - fromE(a2 + span).x, y: line[0].y - fromE(a2 + span).y};
    const arc: V2[] = [];
    for (let k = 1; k < 24; k++) {
      const q = fromE(a2 + (span * k) / 24), w2 = 1 - smoothK(clamp(k / 7)), w1 = 1 - smoothK(clamp((24 - k) / 7));
      arc.push({x: q.x + e2.x * w2 + e1.x * w1, y: q.y + e2.y * w2 + e1.y * w1});
    }
    return arc;
  };
  // (R4) Hair that sits on the hair (the bun, the curls) is in front of or behind the skull by its own depth. R3 sent a whole
  // curl to the front layer when its head-local depth passed 0.15, and back below it: a big inked disc appeared over the
  // ear/temple or the forehead in ONE frame as the head settled (the Director's E2 close-up, 3:17.23), and curls joined
  // or left the rear mass the same way. The depth is now a band (CURL_Z0..CURL_Z1, weight w): below it the curl is behind
  // the skull as before, above it in front as before; in between its front copy emerges from behind the head's outline
  // (see `emerging`), and a curl of the rear mass grows from nothing at its own place. Nothing changes outside the band.
  const skRho = (px: number, py: number) => {
    const a = rad(skullE.rot), dx = px - skullE.cx, dy = py - skullE.cy;
    return Math.hypot((dx * Math.cos(a) + dy * Math.sin(a)) / skullE.rx, (-dx * Math.sin(a) + dy * Math.cos(a)) / skullE.ry);
  };
  const skMin = Math.min(skullE.rx, skullE.ry);
  const rimM = (ink * 1.4 + 1) / skMin; // the skull's inked rim, in the skull's elliptical radius
  let capRho = 1;
  if (hairType !== 'bald') {
    const rr = 1 + Math.min(vol, 6 * s) / R;
    const line: V2[] = [];
    for (let k = 0; k <= 36; k++) {
      const th = thC - 90 + (180 * k) / 36;
      const q = onHead(th, interpTbl(hl, th), rr);
      line.push({x: q.x, y: q.y});
    }
    const Ce = {x: Hc.x - hb.U.x * vol * 0.45, y: Hc.y - hb.U.y * vol * 0.45};
    const arc = overCrown(line, Ce, R + vol * 0.3, RY + vol * 0.6);
    capRho = Math.max(...[...line, ...arc].map((q) => skRho(q.x, q.y)));
    hairFront.push(<path key="cap" d={smoothPath([...line, ...arc], true, 0.35)} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
  }
  const extrasBack: React.ReactElement[] = [];
  const extrasFront: React.ReactElement[] = [];
  const CURL_Z0 = 0.05, CURL_Z1 = 0.25;
  const curlW = (z: number) => smoothK(clamp((z - CURL_Z0) / (CURL_Z1 - CURL_Z0)));
  const earRho = Math.max(...[-1, 1].map((sd) => {
    const q = onHead(sd * 90, 0.1, 1.02), e = ellipsoid2([mul3(hb.F, 8 * s), mul3(hb.U, 12 * s), mul3(hb.R, 3 * s)]);
    return skRho(q.x, q.y) + Math.max(e.rx, e.ry, 4 * s) / skMin;
  }));
  const lamHi = Math.max(1, capRho, earRho) + rimM; // the outline scale that just clears the cap, the ears and the skull's rim
  const curlDisc = (key: string, q: {x: number; y: number}, r: number) => <circle key={key} cx={q.x} cy={q.y} r={r} fill={hairC} stroke={inkC} strokeWidth={ink} />;
  /** The front copy of a curl of weight 0 < w < 1: its disc minus the head's outline scaled by λ about the head's centre
   *  (λ = lamHi at w = 0, where nothing of the disc over the skull, the cap or an ear is covered, down to just clear of
   *  the disc at w = 1, where all of it is), so the curl comes round the head's edge instead of appearing. The outline
   *  (the skull's inked edge) is drawn over the face where the curl's front copy ends on it. */
  const emerging = (key: string, q: {x: number; y: number}, r: number, w: number): React.ReactElement => {
    let rho = Infinity;
    for (let ring = 0; ring <= 2; ring++) for (let i = 0; i < (ring ? 16 : 1); i++) {
      const a = (i / 16) * Math.PI * 2, rr2 = (ring / 2) * r;
      rho = Math.min(rho, skRho(q.x + Math.cos(a) * rr2, q.y + Math.sin(a) * rr2));
    }
    const lamLo = rho * 0.97;
    if (lamLo >= lamHi) return curlDisc(key, q, r);
    const lam = lerp(lamHi, lamLo, w);
    const sc = (e: typeof skullE, k = lam) => ({cx: Hc.x + (e.cx - Hc.x) * k, cy: Hc.y + (e.cy - Hc.y) * k, rx: e.rx * k, ry: e.ry * k, rot: e.rot});
    const pad = r + ink * 2 + 2;
    const box = {x: f2(q.x - pad), y: f2(q.y - pad), width: f2(pad * 2), height: f2(pad * 2)};
    const mid = `${id}cm${key}`, cdd = `${id}cd${key}`, ckk = `${id}ck${key}`;
    const lineOp = smoothK(clamp((1 + rimM - lam) / (2 * rimM)));
    return (
      <g key={key}>
        <defs>
          <mask id={mid} maskUnits="userSpaceOnUse" {...box}><rect {...box} fill="#FFFFFF" /><g fill="#000000">{shapes.map((e, i) => <g key={i}>{elPath(sc(e) as typeof skullE)}</g>)}</g></mask>
          <clipPath id={cdd}><circle cx={q.x} cy={q.y} r={r} /></clipPath>
          <clipPath id={ckk}>{elPath(sc(skullE, 1 + rimM) as typeof skullE)}</clipPath>
        </defs>
        <g mask={`url(#${mid})`}>{curlDisc(`${key}d`, q, r)}</g>
        {lineOp > 0.01 && (
          <g clipPath={`url(#${cdd})`}><g clipPath={`url(#${ckk})`} opacity={lineOp}>
            {[shapes[0], shapes[1]].map((e, i) => { const o = sc(e); return <path key={i} d={elD(o as typeof skullE)} transform={`rotate(${f2(o.rot)} ${f2(o.cx)} ${f2(o.cy)})`} fill="none" stroke={inkC} strokeWidth={ink} />; })}
          </g></g>
        )}
      </g>
    );
  };
  const blobAt = (key: string, r0: number, u0: number, f0: number, rad0: number) => {
    const q = hl3(r0, u0, f0), r = rad0 * s, w = curlW(q.z);
    if (w >= 1) { extrasFront.push(curlDisc(key, q, r)); return; }
    extrasBack.push(curlDisc(key, q, r));
    if (w > 0) extrasFront.push(emerging(`${key}e`, q, r, w));
  };
  if (hairType === 'bun') blobAt('bun', 0, 1.24, -0.3, 21);
  if (hairType === 'curly') {
    const curls: [number, number, number, number][] = [
      [0, 1.1, -0.3, 24], [0.5, 0.98, -0.45, 22], [-0.5, 0.98, -0.45, 22], [0, 0.82, -0.8, 22], [0.82, 0.55, -0.6, 20], [-0.82, 0.55, -0.6, 20],
      [0.45, 0.3, -0.95, 20], [-0.45, 0.3, -0.95, 20], [0, 0.02, -1.05, 19], [0.95, -0.02, -0.45, 17], [-0.95, -0.02, -0.45, 17],
      [0.83, 0.84, 0.1, 20], [-0.83, 0.84, 0.1, 20], [1.07, 0.16, 0.05, 16], [-1.07, 0.16, 0.05, 16],
      [0.52, 1.02, 0.25, 24], [-0.52, 1.02, 0.25, 24], [0.17, 1.08, 0.3, 24], [-0.17, 1.08, 0.3, 24],
      // the nape row: carries the curls down to the lowered back hairline
      [0.42, -0.36, -0.88, 17], [-0.42, -0.36, -0.88, 17], [0, -0.42, -0.95, 17], [0.72, -0.28, -0.66, 15], [-0.72, -0.28, -0.66, 15],
    ];
    const sorted = curls.map((c, k) => ({c, k, z: hl3(c[0], c[1], c[2]).z})).sort((a, b) => a.z - b.z);
    // rear and rear-three-quarter views (the face turned away): the near curls merge into one hair mass — a scalloped
    // outer silhouette, cel shadow and a lit rim from the key light, and a few thin curl strokes — instead of a cluster
    // of inked circles. Front and profile views (rearW 0) draw exactly as before; it blends in between.
    // (R4: also from above — the camera over the crown — where the individually inked curls read as stacked discs)
    const rw0 = clamp((-hb.F.z - 0.15) / 0.3), topW = smoothK(rz(hb.U.z, 0.3, 0.7)), rearW = Math.max(rw0 * rw0 * (3 - 2 * rw0), topW);
    if (rearW <= 0) sorted.forEach(({c, k}) => blobAt(`cu${k}`, c[0], c[1], c[2], c[3]));
    else {
      const near: {x: number; y: number; r: number; z: number; k: number; c: (typeof curls)[number]}[] = [];
      sorted.forEach(({c, k}) => {
        const q = hl3(c[0], c[1], c[2]), w = curlW(q.z);
        // (R4: the mass takes a curl as it comes round, growing from nothing in place; its own copy behind the skull stays
        // until it is fully in the mass. R3 switched it at z 0.15: a scallop appeared on the mass's outline in one frame)
        if (w > 0) near.push({x: q.x, y: q.y, r: c[3] * s * w, z: q.z, k, c});
        if (w < 1) extrasBack.push(curlDisc(`cu${k}`, q, c[3] * s)); // behind the skull, as before
      });
      if (near.length) {
        // the union's outline: from the mass centre, the farthest circle edge along each ray
        const Cx = near.reduce((a, b) => a + b.x, 0) / near.length, Cy = near.reduce((a, b) => a + b.y, 0) / near.length;
        const outline: V2[] = [];
        let last = Math.max(...near.map((b) => b.r));
        for (let i = 0; i < 144; i++) {
          const a = (i / 144) * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
          let best = 0;
          for (const b of near) {
            const dx = b.x - Cx, dy = b.y - Cy, pr = dx * ux + dy * uy, disc = b.r * b.r - (dx * dx + dy * dy - pr * pr);
            if (disc >= 0) best = Math.max(best, pr + Math.sqrt(disc));
          }
          if (best <= 0) best = last;
          last = best;
          outline.push({x: Cx + ux * best, y: Cy + uy * best});
        }
        // (drawn as the union of the curls itself — every curl inked, then every curl filled — not as a ray-cast
        // outline from the mass's centre, which cut straight radial slits into the mass wherever rays passed between
        // two clusters of curls)
        const md = near.map((b) => `M ${f2(b.x - b.r)} ${f2(b.y)} a ${f2(b.r)} ${f2(b.r)} 0 1 0 ${f2(2 * b.r)} 0 a ${f2(b.r)} ${f2(b.r)} 0 1 0 ${f2(-2 * b.r)} 0 Z`).join(' ');
        const hullD = polyPath(outline);
        // a few curl strokes on the curls that face the viewer most, thin and lighter than the outline, on the side
        // away from the light
        const l2 = L ? Math.hypot(L.dir.x, L.dir.y) || 1 : 1;
        const sa = L ? Math.atan2(-L.dir.y / l2, -L.dir.x / l2) : Math.PI * 0.35;
        const strokes = [...near].sort((a, b) => b.z - a.z).slice(0, 3).map((b, j) => {
          const rr = b.r * 0.62, a0 = sa - 1.3 + j * 0.5, a1 = a0 + 2.0;
          const p0 = {x: b.x + Math.cos(a0) * rr, y: b.y + Math.sin(a0) * rr}, p1 = {x: b.x + Math.cos(a1) * rr, y: b.y + Math.sin(a1) * rr};
          return <path key={`cs${j}`} d={`M ${f2(p0.x)} ${f2(p0.y)} A ${f2(rr)} ${f2(rr)} 0 0 1 ${f2(p1.x)} ${f2(p1.y)}`} fill="none" stroke={mix(inkC, hairC, 0.4)} strokeWidth={f2(ink * 0.55)} strokeLinecap="round" opacity={0.8 * rearW} />;
        });
        extrasFront.push(
          <g key="cumass">
            <g fill={inkC} stroke={inkC} strokeWidth={ink * 2}>{near.map((b) => <circle key={b.k} cx={b.x} cy={b.y} r={b.r} />)}</g>
            {/* the gaps between curls inside the mass are hair, not ink (they read as a face on the back of the head):
                the mass's star-shaped hull filled, clipped to the inked curls so the outline stays the curls' */}
            <defs><clipPath id={`${id}cmc`}>{near.map((b) => <circle key={b.k} cx={b.x} cy={b.y} r={b.r + ink * 0.95} />)}</clipPath></defs>
            <path d={hullD} fill={hairC} clipPath={`url(#${id}cmc)`} />
            <g fill={hairC}>{near.map((b) => <circle key={b.k} cx={b.x} cy={b.y} r={b.r} />)}</g>
            {celOver(`${id}hm`, md, L, headSize, s, hullD, 0.55)}
            {strokes}
            {rearW < 1 && <g opacity={f2(1 - rearW)}>{near.map((b) => <circle key={`cu${b.k}`} cx={b.x} cy={b.y} r={b.r} fill={hairC} stroke={inkC} strokeWidth={ink} />)}</g>}
          </g>,
        );
      }
    }
  }
  if (hairType === 'spiky') {
    // ONE coherent crest: the union of every spike (front, middle and back rows) as a single silhouette, drawn behind
    // the head and its hair cap so only what stands proud of the head shows. (Two separately inked rows of flat
    // triangles read as a doubled crown in three-quarter and high views.) Seen from above, a few thin spike strokes on
    // the cap carry the texture instead.
    const rows: [number, number, number][] = [[0.2, 0.85, 1.45], [-0.15, 0.86, 1.47], [-0.45, 0.8, 1.38]];
    // each spike is a cone (a diamond base on the scalp, a tip): its projected outline is the convex hull of the five
    // points, so the crest keeps its volume in profile (R2's flat triangles, all in the head's left-right plane, went
    // edge-on from the side and the crest became three needles)
    const hull = (P: {x: number; y: number; z: number}[]) => {
      const q = [...P].sort((a, b) => a.x - b.x || a.y - b.y);
      const cr = (o: V2, a: V2, b: V2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
      const lo: typeof q = [], hi: typeof q = [];
      for (const p0 of q) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p0) <= 0) lo.pop(); lo.push(p0); }
      for (const p0 of [...q].reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p0) <= 0) hi.pop(); hi.push(p0); }
      return [...lo.slice(0, -1), ...hi.slice(0, -1)];
    };
    const tris: {x: number; y: number; z: number}[][] = [];
    [-0.5, -0.25, 0, 0.25, 0.5].forEach((r0) => rows.forEach(([f0, ub, ut]) => {
      tris.push(hull([hl3(r0 - 0.2, ub, f0 + 0.05), hl3(r0 + 0.2, ub, f0 + 0.05), hl3(r0, ub, f0 + 0.34), hl3(r0, ub, f0 - 0.24), hl3(r0, ut, f0 - 0.05)]));
    }));
    const C = {x: Hc.x, y: Hc.y};
    // ray from the head centre: the farthest exit over all (convex) triangles
    const exitAt = (ux: number, uy: number) => {
      let best = 0;
      for (const tr of tris) for (let i = 0; i < tr.length; i++) {
        const a = tr[i], b = tr[(i + 1) % tr.length];
        const ex = b.x - a.x, ey = b.y - a.y, den = ux * ey - uy * ex;
        if (Math.abs(den) < 1e-9) continue;
        const ax = a.x - C.x, ay = a.y - C.y;
        const tt = (ax * ey - ay * ex) / den, uu = (ax * uy - ay * ux) / den;
        if (tt > 0 && uu >= 0 && uu <= 1) best = Math.max(best, tt);
      }
      return best;
    };
    const angs: number[] = [];
    for (let i = 0; i < 360; i++) angs.push((i / 360) * Math.PI * 2);
    tris.forEach((tr) => tr.forEach((q) => angs.push((Math.atan2(q.y - C.y, q.x - C.x) + Math.PI * 2) % (Math.PI * 2))));
    angs.sort((a, b) => a - b);
    const inner = Math.min(R, RY) * 0.5;
    const outline = angs.map((a) => {
      const ux = Math.cos(a), uy = Math.sin(a);
      const d = Math.max(exitAt(ux, uy), inner);
      return {x: C.x + ux * d, y: C.y + uy * d};
    });
    extrasBack.push(<path key="crest" d={polyPath(outline)} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="miter" strokeMiterlimit={8} />);
    // from above (the top of the head toward the viewer) the spikes lie over the cap: a few thin strokes
    const topK = clamp((hb.U.z - 0.3) / 0.35);
    if (topK > 0) [-0.5, -0.25, 0, 0.25, 0.5].forEach((r0, k) => {
      const [f0, ub, ut] = rows[0];
      const base = hl3(r0, ub, f0 + 0.05), tip0 = hl3(r0, ut, f0 - 0.05);
      const tip = {x: lerp(base.x, tip0.x, 0.7), y: lerp(base.y, tip0.y, 0.7)};
      extrasFront.push(<path key={`spt${k}`} d={`M ${f2(base.x)} ${f2(base.y)} L ${f2(tip.x)} ${f2(tip.y)}`} stroke={inkC} strokeWidth={f2(ink * 0.6)} strokeLinecap="round" opacity={f2(0.7 * topK)} />);
    });
  }
  if (hairType === 'swoop') {
    // The approved swoop loop, turned toward profile by sweeping its points back/forward (fo) as the head turns. R2
    // swept them the same way whichever way the head faced, so in rear three-quarter views (and the opposite front
    // three-quarter) the sweep cancelled the loop's width on screen and it stood up as a thin spike above the head:
    // the sweep now changes direction with the side of the head that faces the camera, so the loop always opens up.
    const loop: [number, number, number, number][] = [[1.07, 0.06, 0.0, -0.6], [1.05, 0.95, 0.12, -0.75], [0.17, 1.3, 0.22, -0.2], [-0.9, 1.42, 0.18, 0.35], [-1.14, 0.77, 0.12, 0.78], [-0.8, 0.95, 0.42, 0.55], [-0.34, 0.9, 0.6, 0.3], [0.3, 0.88, 0.58, 0.0], [0.85, 0.5, 0.35, -0.35]];
    const pk = Math.pow(Math.abs(dot3(hb.R, zv)), 1.5);
    const rf = hb.R.x * hb.F.x;
    const sg = 1 - 2 * smoothK(clamp(rf / 0.35));
    const q = loop.map(([r0, u0, f0, fo]) => hl3(r0 * (1 - 0.35 * pk), u0, f0 + fo * pk * sg));
    const z = q.reduce((m, c) => m + c.z, 0) / q.length;
    (z > -0.25 ? extrasFront : extrasBack).push(<path key="swoop" d={smoothPath(q, true, 0.6)} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
  }
  if (hairType === 'bob') {
    // the bob's straight-cut hem runs around the back and sides at jaw height (head-local, so it turns with the
    // head); the mass above it is closed over the crown by the hair-volume ellipse: a rounded dome from behind,
    // a hanging side panel in front views, the full cut in profile.
    // (R4) The mass is always BEHIND the skull and the cap. R3 moved it over the skull when the face turned 107° away (a
    // switch at F.z = -0.3): the whole dome jumped over the head in one frame, covering the cheek and the jaw's edge that
    // are still in view past profile (the drone pilot's turn away: ~8000 px of the head changed between two frames). The
    // cap already is the hair in front of the skull (its hairline reaches the jaw at the back), so the mass only adds the
    // volume round the outline, which shows the same behind the skull.
    const hem: V2[] = [];
    for (let k = 0; k <= 24; k++) hem.push(onHead(80 + (200 * k) / 24, 0.55, 1.12));
    const Ce = {x: Hc.x - hb.U.x * vol * 0.4, y: Hc.y - hb.U.y * vol * 0.4};
    const d = smoothPath([...hem, ...overCrown(hem, Ce, R * 1.1 + vol * 0.2, RY * 1.04 + vol * 0.45)], true, 0.3);
    extrasBack.push(<path key="bobmass" d={d} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
    // a few strands down the back so the mass reads as hair, not a helmet (they fade in as the head turns away)
    [150, 180, 210].forEach((th, k) => {
      const a = onHead(th, -0.62, 1.12), m = onHead(th + 6, 0.0, 1.13), b = onHead(th + 2, 0.42, 1.12);
      const away = rz(-hb.F.z, 0.3, 0.6);
      if (m.z > 0.15 && away > 0.01) extrasFront.push(<path key={`bst${k}`} d={`M ${pt(a)} Q ${pt(m)} ${pt(b)}`} fill="none" stroke={inkC} strokeWidth={ink * 0.55} strokeLinecap="round" opacity={0.55 * clamp((m.z - 0.15) * 3) * away} />);
    });
  }

  // ---- ears
  const ears: React.ReactElement[] = [], earsBack: React.ReactElement[] = [];
  [-1, 1].forEach((sd) => {
    const q = onHead(sd * 90, 0.1, 1.02);
    const e = ellipsoid2([mul3(hb.F, 8 * s), mul3(hb.U, 12 * s), mul3(hb.R, 3 * s)]);
    const el = (
      <g key={`ear${sd}`}>
        <ellipse cx={q.x} cy={q.y} rx={Math.max(e.rx, 4 * s)} ry={Math.max(e.ry, 4 * s)} fill={skin} stroke={inkC} strokeWidth={ink} transform={`rotate(${f2(e.rot)} ${f2(q.x)} ${f2(q.y)})`} />
        {look.accessories.includes('earring') && sd === -1 && <circle cx={q.x} cy={q.y + 14 * s} r={5 * s} fill={col(C.saffron)} stroke={inkC} strokeWidth={ink * 0.75} />}
      </g>
    );
    // (R4: behind the skull's outline or in front of it by the skull's own depth test, not a switch at z = -0.25)
    const front = q.d.z + Math.hypot(8 * s * hb.F.z, 12 * s * hb.U.z, 3 * s * hb.R.z); // the ear's front-most point
    const ag = against(`ear${sd}`, el, front, {x: q.x, y: q.y}, Math.max(e.rx, e.ry, 4 * s) + 22 * s);
    if (ag.back) earsBack.push(ag.back);
    ears.push(ag.front);
  });

  // ---- face
  const feats: React.ReactElement[] = [];
  const blinkC = face.closed ? 1 : face.blink === false ? 0 : blinkAt(t, seed);
  const lid0 = clamp(Math.max(face.lid ?? FACE_REST_LID, blinkC, face.closed ? 1 : 0));
  const lids = clamp(face.lids ?? 0);
  const fold = (q: {z: number}) => clamp((q.z - 0.08) / 0.5, 0, 1);
  const eyeY = -0.1;
  const look2 = {x: face.lookX ?? 0, y: face.lookY ?? 0};
  const unf = clamp(face.unfocus ?? 0);
  [-1, 1].forEach((sd) => {
    const q = onHead(sd * 21, eyeY, 1);
    if (q.z <= 0.08) return; // (fold() is 0 there: the eye fades out, it does not blink off)
    const sx = clamp(q.z * 1.05, 0.3, 1);
    const op = fold(q);
    const ry = 13 * s;
    const lid = clamp(lid0 + (face.lidLR ? face.lidLR[sd < 0 ? 0 : 1] : 0));
    const lidY = lerp(-ry * 1.15, ry * 1.02, clamp(Math.max(lid, lids * 0.45)));
    const drift = unf * sd * 1.8;
    const pupil = {x: (look2.x + drift * 0.5) * 5 * s, y: (look2.y + unf * 0.4) * 4 * s};
    const pr = (5.5 + unf * 1.2) * s * clamp(face.pupil ?? 1, 0.5, 1.6);
    const brows = (face.brows ?? 0) + (face.browAsym ?? 0) * sd * 0.6, worry = face.worry ?? 0;
    const bo = onHead(sd * 34, eyeY - 0.36 - brows * 0.09 + worry * 0.03, 1.0), bi = onHead(sd * 9, eyeY - 0.36 - brows * 0.09 - (brows * 0.05 + worry * 0.13), 1.0);
    const cid = `${id}e${sd > 0 ? 'r' : 'l'}`;
    // the lid's skin takes the face's cel shadow when the eye sits in it (else a lit lid floats on a shaded face)
    let lidC = skin;
    if (L) {
      const l2 = Math.hypot(L.dir.x, L.dir.y) || 1, sh = R * 0.62 * (1 - clamp(L.dir.z, -1, 1)) * (L.key ?? 1);
      const cx = skullE.cx + (L.dir.x / l2) * sh, cy = skullE.cy + (L.dir.y / l2) * sh, a = rad(skullE.rot);
      const dx = q.x - cx, dy = q.y - cy, ex = dx * Math.cos(a) + dy * Math.sin(a), ey = -dx * Math.sin(a) + dy * Math.cos(a);
      if ((ex / skullE.rx) ** 2 + (ey / skullE.ry) ** 2 > 1) lidC = mix(skin, L.shadowC ?? '#2B3550', 0.34 * (L.key ?? 1));
    }
    const shut = lid > 0.92;
    feats.push(
      <g key={`eye${sd}`} transform={`translate(${f2(q.x)} ${f2(q.y)}) rotate(${f2(rollDeg)}) scale(${f2(sx)} 1)`} opacity={op}>
        <defs><clipPath id={cid}><ellipse cx={0} cy={0} rx={12 * s} ry={ry} /></clipPath></defs>
        {!shut && <ellipse cx={0} cy={0} rx={12 * s} ry={ry} fill={col(C.white)} />}
        {!shut && <g clipPath={`url(#${cid})`}>
          <circle cx={pupil.x} cy={pupil.y} r={pr} fill={inkC} />
          <circle cx={pupil.x + 2 * s} cy={pupil.y - 2 * s} r={1.6 * s} fill={col(C.white)} opacity={1 - unf * 0.7} />
          {/* the upper lid: skin coming down from above */}
          <rect x={-14 * s} y={-ry * 2.2} width={28 * s} height={Math.max(0, lidY + ry * 2.2)} fill={lidC} />
          {(face.squint ?? 0) > 0.05 && <rect x={-14 * s} y={ry * (1 - 0.6 * (face.squint ?? 0))} width={28 * s} height={ry} fill={lidC} />}
        </g>}
        <ellipse cx={0} cy={0} rx={12 * s} ry={ry} fill="none" stroke={inkC} strokeWidth={ink * 0.75} opacity={lid > 0.92 ? 0 : 1} />
        {/* lid line (lash line) follows the lid; closed = a soft downward curve */}
        {lid > 0.92 ? <path d={`M ${-12 * s} ${1 * s} Q 0 ${7 * s} ${12 * s} ${1 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.85} strokeLinecap="round" />
          : lid > 0.08 || lids > 0.1 ? <path d={`M ${-12.5 * s} ${f2(Math.min(lidY + 3 * s, 0))} Q 0 ${f2(lidY - 2 * s)} ${12.5 * s} ${f2(Math.min(lidY + 3 * s, 0))}`} fill="none" stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" /> : null}
      </g>,
    );
    // (the brow fades with its eye: R2 kept a brow at full strength while the eye under it had faded out, so in rear
    // three-quarter views a lone brow stub stuck out from under the hair at the silhouette)
    if (bo.z > 0.05 || bi.z > 0.05) feats.push(<line key={`brow${sd}`} x1={bo.x} y1={bo.y} x2={bi.z > -0.05 ? bi.x : bo.x} y2={bi.y} stroke={inkC} strokeWidth={ink + 1 * s} strokeLinecap="round" opacity={Math.min(clamp(Math.max(bo.z, bi.z) * 3), clamp(op * 1.6))} />);
  });
  const glasses = look.accessories.includes('glasses') ? 'rect' : look.accessories.includes('roundGlasses') ? 'round' : null;
  if (glasses) {
    const lens: {x: number; y: number; sx: number; z: number}[] = [];
    [-1, 1].forEach((sd) => { const q = onHead(sd * 21, eyeY, 1.02); lens.push({x: q.x, y: q.y, sx: clamp(q.z * 1.05, 0.25, 1), z: q.z}); });
    lens.forEach((l, k) => {
      if (l.z <= 0.08) return;
      feats.push(
        <g key={`gl${k}`} transform={`translate(${f2(l.x)} ${f2(l.y)}) rotate(${f2(rollDeg)}) scale(${f2(l.sx)} 1)`} opacity={fold(l)}>
          {glasses === 'rect' ? <rect x={-15 * s} y={-13 * s} width={30 * s} height={26 * s} rx={7 * s} fill="none" stroke={inkC} strokeWidth={ink * 0.9} /> : <circle cx={0} cy={0} r={17 * s} fill="none" stroke={inkC} strokeWidth={ink * 0.9} />}
        </g>,
      );
    });
    if (lens[0].z > 0.08 && lens[1].z > 0.08) {
      const m = onHead(0, eyeY - 0.05, 1.04);
      feats.push(<path key="bridge" d={`M ${pt({x: lerp(lens[0].x, m.x, 0.55), y: lerp(lens[0].y, m.y, 0.55)})} L ${pt({x: lerp(lens[1].x, m.x, 0.55), y: lerp(lens[1].y, m.y, 0.55)})}`} stroke={inkC} strokeWidth={ink * 0.8} opacity={Math.min(fold(lens[0]), fold(lens[1]))} />);
    }
    [-1, 1].forEach((sd, k) => {
      const l = lens[k];
      const ear = onHead(sd * 88, eyeY, 1.02);
      // (the arm to the ear fades in with the lens, the ear's visibility and its own length: R3 popped it at fixed values)
      const arm = fold(l) * rz(ear.z, -0.1, 0.05) * rz(Math.abs(l.x - ear.x), 10 * s, 18 * s);
      if (l.z > 0.08 && arm > 0.01) feats.push(<line key={`tm${sd}`} x1={l.x + Math.sign(ear.x - l.x) * 15 * s * l.sx} y1={l.y - 4 * s} x2={ear.x} y2={ear.y - 6 * s} stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" opacity={arm} />);
    });
  }
  // nose line (front/three-quarter); the profile bump is the nose ellipsoid in the skull union
  {
    const q = onHead(0, 0.0, 1);
    const side = Math.sign(hb.F.x) || 1;
    const prof = Math.abs(hb.F.x);
    // (R4: the nose line turns into the profile's nostril mark by a cross-fade between prof 0.78 and 0.92, and each fades
    // in/out with its depth; R3 swapped them at prof 0.85 and switched the line off at q.z 0.15 while it was half visible)
    const wProf = smoothK(clamp((prof - 0.78) / 0.14));
    const nOp = (fold(q) * 0.6 + 0.4) * rz(q.z, 0.1, 0.2) * (1 - wProf);
    if (nOp > 0.01) feats.push(<path key="nose" d={`M ${pt({x: q.x + 2 * s, y: q.y + 2 * s})} q ${8 * s * side} ${14 * s} ${-2 * s * side} ${16 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.75} strokeLinecap="round" opacity={nOp} />);
    const sOp = wProf * rz(hb.F.z, -0.3, -0.15);
    if (sOp > 0.01) {
      // (only while the nose is on the visible side: R2 drew it on the cheek or the hair in rear three-quarter views)
      const tip = hl3(0, 0.12, 1.08);
      feats.push(<path key="nostril" d={`M ${f2(tip.x - side * 7 * s)} ${f2(tip.y)} q ${f2(side * 3 * s)} ${f2(4 * s)} ${f2(-side * 2 * s)} ${f2(6 * s)}`} fill="none" stroke={inkC} strokeWidth={ink * 0.6} strokeLinecap="round" opacity={sOp} />);
    }
  }
  {
    const q = onHead(0, 0.5, 1);
    if (q.z > -0.05) {
      const sx = clamp(q.z * 1.1, 0.35, 1);
      if (q.z < 0.35) { const side = Math.sign(q.x - Hc.x) || 1; q.x -= side * (0.35 - q.z) * 22 * s; }
      feats.push(<g key="mouth" transform={`translate(${f2(q.x)} ${f2(q.y)}) rotate(${f2(rollDeg)}) scale(${f2(sx)} 1)`} opacity={(fold(q) * 0.5 + 0.5) * rz(q.z, -0.05, 0.05)}><MouthShape m={face.mouth ?? 'flat'} s={s} ink={ink} inkC={inkC} open={face.open ?? 0} t={t} white={col('#FFFFFF')} /></g>);
    }
  }
  if (look.cheeks) [-1, 1].forEach((sd) => { const q = onHead(sd * 40, 0.25, 1); if (q.z > 0.1) feats.push(<ellipse key={`ch${sd}`} cx={q.x} cy={q.y} rx={9 * s * clamp(q.z, 0.3, 1)} ry={7 * s} fill={col('#F28B82')} opacity={0.7 * rz(q.z, 0.1, 0.25)} />); });
  if (look.accessories.includes('beard')) {
    // the approved chin beard: from the jaw corners, under the mouth (its top edge sits just below the lip line),
    // around the chin and a little below it. It lies on a shell round the jaw (a little proud of the face, so it has
    // volume in profile) between its two approved edges; the shell is drawn as small cells, only those facing the
    // camera, as one union (ink under, fills over), so its outline is the true silhouette from any side. R2 projected
    // the band as one closed outline on the head sphere: it folded over itself in profile (an inked loop across the
    // cheek) and showed through the head in rear three-quarter views.
    const cz = (th: number) => Math.max(0, Math.cos(rad(th)));
    const C0 = {r: 0, u: -0.36, f: 0.28}, A = {r: 1.04, u: 0.74, f: 0.8};
    const shell = (th: number, u: number) => {
      const k = Math.sqrt(Math.max(0, 1 - ((u - C0.u) / A.u) ** 2));
      const r0 = C0.r + A.r * k * Math.sin(rad(th)), f0 = C0.f + A.f * k * Math.cos(rad(th));
      const q = hl3(r0, u, f0);
      // outward normal of the shell (head-local), its depth toward the viewer
      const nr = (r0 - C0.r) / (A.r * A.r), nu = (u - C0.u) / (A.u * A.u), nf = (f0 - C0.f) / (A.f * A.f);
      const nz = (hb.R.z * nr * R + hb.U.z * nu * RY + hb.F.z * nf * R) / (Math.hypot(nr * R, nu * RY, nf * R) || 1);
      return {x: q.x, y: q.y, nz};
    };
    const ths: number[] = [];
    for (let th = -100; th <= 100; th += 8) ths.push(th);
    const NV = 5;
    const cells: V2[][] = [];
    for (let i = 0; i < ths.length - 1; i++) for (let j = 0; j < NV; j++) {
      const corner = (th: number, v: number) => {
        const uTop = -(0.24 + 0.38 * cz(th) ** 1.5), uBot = Math.max(C0.u - A.u * 0.995, -(0.24 + 0.94 * cz(th) ** 0.7));
        return shell(th, lerp(uTop, uBot, v));
      };
      const c4 = [corner(ths[i], j / NV), corner(ths[i + 1], j / NV), corner(ths[i + 1], (j + 1) / NV), corner(ths[i], (j + 1) / NV)];
      if (c4.reduce((m, c) => m + c.nz, 0) / 4 > -0.02) cells.push(c4);
    }
    if (cells.length) feats.unshift(
      <g key="beard" strokeLinejoin="round">
        <g fill={inkC} stroke={inkC} strokeWidth={ink * 2}>{cells.map((c, k) => <path key={k} d={polyPath(c)} />)}</g>
        <g fill={col(look.hairColor)} stroke={col(look.hairColor)} strokeWidth={Math.max(0.6, ink * 0.25)}>{cells.map((c, k) => <path key={k} d={polyPath(c)} />)}</g>
      </g>,
    );
  }
  // injuries
  if (dmg.browCut && dmg.browCut.amt > 0) {
    const sd = dmg.browCut.side;
    const pts3: {q: ReturnType<typeof onHead>; w: number}[] = [];
    for (let k = 0; k <= 6; k++) { const u = k / 6; pts3.push({q: onHead(sd * lerp(34, 50, u), lerp(-0.42, 0.18 * dmg.browCut.amt, u), 1.005), w: lerp(4.6, 1.6, u)}); }
    const visible = pts3.filter((a) => a.q.z > 0.04);
    if (visible.length > 2) {
      const Lt: V2[] = [], Rt: V2[] = [];
      for (let k = 0; k < visible.length; k++) {
        const a = visible[k].q, b = visible[Math.min(visible.length - 1, k + 1)].q, c0 = visible[Math.max(0, k - 1)].q;
        const dx = b.x - c0.x, dy = b.y - c0.y, l = Math.hypot(dx, dy) || 1;
        // (the stripe tapers to nothing where it turns behind the face; R3 cut it off with its width still at 30 %)
        const w = visible[k].w * s * clamp(a.z * 1.2, 0.3, 1) * rz(a.z, 0.04, 0.16);
        Lt.push({x: a.x - (dy / l) * w, y: a.y + (dx / l) * w}); Rt.push({x: a.x + (dy / l) * w, y: a.y - (dx / l) * w});
      }
      feats.push(<path key="brow" d={smoothPath([...Lt, ...Rt.reverse()], true, 0.6)} fill={BLOOD.main} opacity={0.95} />);
      const c0 = pts3[0].q;
      if (c0.z > 0.1) feats.push(<path key="cut" d={`M ${pt({x: c0.x - 7 * s, y: c0.y - 2 * s})} L ${pt({x: c0.x + 7 * s, y: c0.y + 2 * s})}`} stroke={BLOOD.dark} strokeWidth={3.2 * s} strokeLinecap="round" opacity={rz(c0.z, 0.1, 0.25)} />);
    }
  }
  if ((dmg.noseBleed ?? 0) > 0) {
    const a = onHead(-4, 0.28, 1.01), b = onHead(-6, 0.28 + 0.24 * (dmg.noseBleed ?? 0), 1.01);
    if (a.z > 0.1) feats.push(<path key="nb" d={`M ${pt(a)} Q ${pt({x: a.x + 3 * s, y: (a.y + b.y) / 2})} ${pt(b)}`} stroke={BLOOD.main} strokeWidth={5 * s * clamp(a.z, 0.4, 1)} strokeLinecap="round" fill="none" opacity={rz(a.z, 0.1, 0.25)} />);
  }
  if ((dmg.lipCut ?? 0) > 0) {
    // a split in the lower lip, just off centre
    const a = onHead(-7, 0.545, 1.01), b = onHead(-2, 0.56, 1.01);
    if (a.z > 0.1) feats.push(<path key="lip" d={`M ${pt(a)} L ${pt(b)}`} stroke={BLOOD.dark} strokeWidth={3 * s} strokeLinecap="round" opacity={(dmg.lipCut ?? 0) * rz(a.z, 0.1, 0.25)} />);
  }
  if ((dmg.mouthBlood ?? 0) > 0) {
    // one tapered trickle from the corner of the mouth toward the chin: widest at the lip, narrowing to a soft rounded
    // tip — a single smear (a separate drop at its end read as an "!" in close-ups)
    const mbA = dmg.mouthBlood ?? 0;
    const len = 0.22 * clamp(mbA * 1.4);
    const pts: {q: ReturnType<typeof onHead>; w: number}[] = [];
    for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push({q: onHead(-11 - 4 * u * u, 0.52 + len * u, 1.01), w: lerp(4.8, 2.1, Math.sqrt(u)) * s}); }
    if (pts[0].q.z > 0.1) {
      const L: V2[] = [], Rr: V2[] = [];
      let tx = 0, ty = 1;
      pts.forEach((p0, k) => {
        const p1 = pts[Math.min(k + 1, pts.length - 1)].q, pm = pts[Math.max(k - 1, 0)].q;
        const dx = p1.x - pm.x, dy = p1.y - pm.y, l = Math.hypot(dx, dy) || 1;
        tx = dx / l; ty = dy / l;
        L.push({x: p0.q.x - ty * p0.w / 2, y: p0.q.y + tx * p0.w / 2}); Rr.push({x: p0.q.x + ty * p0.w / 2, y: p0.q.y - tx * p0.w / 2});
      });
      const e = pts[pts.length - 1];
      const tip = {x: e.q.x + tx * e.w * 0.55, y: e.q.y + ty * e.w * 0.55};
      feats.push(<path key="mb" d={smoothPath([...L, tip, ...Rr.reverse()], true, 0.35)} fill={BLOOD.main} opacity={clamp(mbA * 1.5) * rz(pts[0].q.z, 0.1, 0.25)} />);
    }
  }
  if (dmg.bruise && dmg.bruise.amt > 0) {
    const a = onHead(dmg.bruise.side * 42, 0.18, 1.0);
    if (a.z > 0.05) feats.push(<path key="bruise" d={blobPath(12 * s, 77, 9, 0.35, clamp(a.z, 0.3, 1), 0.8)} transform={`translate(${f2(a.x)} ${f2(a.y)})`} fill={BLOOD.bruise} opacity={0.42 * dmg.bruise.amt * rz(a.z, 0.05, 0.2)} />);
  }
  if ((dmg.dirt ?? 0) > 0) {
    [[-38, 0.3, 9], [30, -0.45, 7], [50, 0.42, 6]].forEach(([th, ey, r0], k) => {
      const a = onHead(th, ey, 1);
      if (a.z > 0.1) feats.push(<path key={`dirt${k}`} d={blobPath(r0 * s, 50 + k, 8, 0.5, clamp(a.z, 0.3, 1), 0.7)} transform={`translate(${f2(a.x)} ${f2(a.y)})`} fill="rgba(70,50,45,0.28)" opacity={(dmg.dirt ?? 0) * rz(a.z, 0.1, 0.25)} />);
    });
  }

  // ---- head accessories
  const acc: React.ReactElement[] = [], accBack: React.ReactElement[] = [];
  // (R4) a thin thing that runs round the head (the headset's band and boom, the visor's back strap) is cut into short
  // pieces, each in front of or behind the skull by the skull's own depth test at the piece (it passes under the head's
  // outline exactly where it goes behind the head), not by a sum of depths per sixteenth of the curve, and never joined
  // across the head by a polyline whose middle points are hidden
  const piece = (key: string, a: {x: number; y: number; z: number}, b: {x: number; y: number; z: number}, w: number, c: string) => {
    const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2};
    (hiddenBy(m.x, m.y, m.z) ? accBack : acc).push(<path key={key} d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(b.x)} ${f2(b.y)}`} stroke={c} strokeWidth={w} strokeLinecap="round" />);
  };
  const polyline = (key: string, P: {x: number; y: number; z: number}[], w: number, sub: number, c: string = inkC) => {
    for (let k = 0; k < P.length - 1; k++) for (let j = 0; j < sub; j++) {
      const t0 = j / sub, t1 = (j + 1) / sub, L = (t: number) => ({x: lerp(P[k].x, P[k + 1].x, t), y: lerp(P[k].y, P[k + 1].y, t), z: lerp(P[k].z, P[k + 1].z, t)});
      piece(`${key}${k}_${j}`, L(t0), L(t1), w, c);
    }
  };
  if (look.accessories.includes('visor')) {
    const band: V2[] = [], band2: V2[] = [];
    const lo = Math.max(-100, thC - 88), hi = Math.min(100, thC + 88);
    if (hi > lo) {
      for (let k = 0; k <= 16; k++) band.push(onHead(lerp(lo, hi, k / 16), -0.58, 1.04));
      for (let k = 16; k >= 0; k--) band2.push(onHead(lerp(lo, hi, k / 16), -0.32, 1.04));
    }
    // back strap (seen from behind): R4 cuts it into pieces by the skull's depth test (R3 kept the points with z > -0.02 and
    // joined them in one polyline: two separate visible runs were joined by a chord across the head, which came and went
    // as the head turned)
    const strapPts = [];
    for (let th = 100; th <= 260; th += 5) strapPts.push(onHead(th, -0.46, 1.04));
    const brim: V2[] = [];
    let brimZ = 0, brimN = 0;
    for (let th = -96; th <= 96; th += 8) brim.push(onHead(th, -0.34, 1.05));
    for (let th = 96; th >= -96; th -= 8) {
      const c = Math.cos(rad(th));
      const ext2 = 1.05 + 0.48 * Math.pow(Math.max(0, c), 1.3);
      const a = onHead(th, -0.34 + 0.2 * Math.max(0, c), ext2);
      brim.push(a); brimZ += a.d.z; brimN++;
    }
    const tealC = col(C.teal);
    const el = (
      <g key="visor">
        {band.length > 1 && <path d={polyPath([...band, ...band2])} fill={tealC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />}
        <path d={smoothPath(brim, true, 0.3)} fill={tealC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />
      </g>
    );
    polyline('vstrap', strapPts.map((q) => ({x: q.x, y: q.y, z: q.d.z})), ink * 2.2, 1, tealC);
    // (R4: behind the skull's outline or over it by the skull's own depth test at the visor's mean depth, not a switch on
    // any band point / the sum of the brim's depths)
    const vz = against('visor', el, brimZ / Math.max(1, brimN), {x: Hc.x, y: Hc.y}, Math.max(R, RY) * 2);
    if (vz.back) accBack.push(vz.back);
    acc.push(vz.front);
  }
  if (look.accessories.includes('headset')) {
    // the band over the crown, ear to ear: drawn segment by segment by its own depth like the boom (R2 drew the whole
    // band over the head, so in three-quarter and rear views its far half ran across the face and the back of the hair)
    const bandPts: {x: number; y: number; z: number}[] = [];
    for (let k = 0; k <= 16; k++) {
      const a = lerp(-Math.PI / 2, Math.PI / 2, k / 16);
      const v = add3(mul3(hb.R, Math.sin(a) * (R + 7 * s)), mul3(hb.U, Math.cos(a) * (RY + 7 * s)));
      bandPts.push({x: Hc.x + v.x, y: Hc.y + v.y + 4 * s, z: v.z / R});
    }
    polyline('hsb', bandPts.map((q) => ({x: q.x, y: q.y, z: q.z * R})), ink * 1.1, 3);
    const cup = onHead(-92, 0.05, 1.08);
    const cupEl = <rect key="cup" x={cup.x - 7 * s} y={cup.y - 11 * s} width={14 * s} height={22 * s} rx={5 * s} fill={inkC} />;
    // the boom: a 3D curve held clear of the cheek (r ≥ 1.16 head radii)
    const boomAt = (u: number) => {
      const th = lerp(lerp(-92, -64, u), lerp(-64, -40, u), u), ey = lerp(lerp(0.05, 0.6, u), lerp(0.6, 0.62, u), u), rr = lerp(lerp(1.08, 1.24, u), lerp(1.24, 1.18, u), u);
      return onHead(th, ey, rr);
    };
    const N = 10;
    const bp = Array.from({length: N + 1}, (_, k) => boomAt(k / N));
    polyline('boom', bp.map((q) => ({x: q.x, y: q.y, z: q.d.z})), ink, 3);
    const tip = bp[N];
    const mic = against('micc', <circle key="micc" cx={tip.x} cy={tip.y} r={4.6 * s} fill={inkC} />, tip.d.z + 4.6 * s, tip, 4.6 * s);
    if (mic.back) accBack.push(mic.back);
    acc.push(mic.front);
    const cp = against('cup', cupEl, cup.d.z + 8 * s, cup, 14 * s);
    if (cp.back) accBack.push(cp.back);
    acc.push(cp.front);
  }
  if (look.accessories.includes('pencil')) {
    // tucked behind the left ear: a 3D stick resting on the ear, running forward and down along the side of the head
    // and standing a little off it, so it is long in profile, a short stub poking out sideways from the front, and
    // behind the skull when that ear is turned away. (R2 drew a flat 2D pencil at a fixed screen angle in front of
    // everything: from the side and in a lean it lay across the brow and the eye.)
    // (diagonal behind the ear: the eraser end up and back over the ear, the point down and forward just in front of
    // it, standing a little off the head, so in profile it never reaches the eye or the glasses)
    const mid3 = dir(-104, -0.26, 1.1);
    const ax3 = norm3(add3(add3(mul3(hb.F, 0.55), mul3(hb.U, -0.72)), mul3(hb.R, -0.3)));
    const P = (k: number) => ({x: Hc.x + mid3.x + ax3.x * k * s, y: Hc.y + mid3.y + ax3.y * k * s});
    const back = P(-27), front = P(24), tip = P(34);
    const zc = mid3.z / R + ax3.z * 0.3;
    const dx = front.x - back.x, dy = front.y - back.y, dl = Math.hypot(dx, dy) || 1;
    const nx = (-dy / dl) * 5 * s, ny = (dx / dl) * 5 * s;
    const body = polyPath([{x: back.x + nx, y: back.y + ny}, {x: front.x + nx, y: front.y + ny}, {x: front.x - nx, y: front.y - ny}, {x: back.x - nx, y: back.y - ny}]);
    const el = (
      <g key="pencil" strokeLinejoin="round">
        <path d={body} fill={col(C.saffron)} stroke={inkC} strokeWidth={ink * 0.75} />
        {dl > 3 * s && <path d={`M ${pt({x: front.x + nx, y: front.y + ny})} L ${pt(tip)} L ${pt({x: front.x - nx, y: front.y - ny})} Z`} fill={col('#F7D9C4')} stroke={inkC} strokeWidth={ink * 0.75} opacity={rz(dl, 3 * s, 8 * s)} />}
        <circle cx={back.x} cy={back.y} r={5 * s} fill={col(C.saffron)} stroke={inkC} strokeWidth={ink * 0.75} />
      </g>
    );
    // (R4: behind the skull's outline or over it by the skull's own depth test, not a switch at its depth -0.12: the pencil
    // popped over the hair in one frame as the head passed through the front view)
    void zc;
    const zEnd = Math.max(mid3.z + ax3.z * -27 * s, mid3.z + ax3.z * 34 * s) + 4 * s;
    const pc = against('pencil', el, zEnd, {x: (back.x + tip.x) / 2, y: (back.y + tip.y) / 2}, 44 * s);
    if (pc.back) accBack.push(pc.back);
    acc.push(pc.front);
  }
  // pallor tints the skin under the features (eyes, brows and mouth stay crisp)
  if ((dmg.pale ?? 0) > 0) feats.unshift(<path key="pale" d={unionD} fill="#E8E4DE" opacity={0.22 * (dmg.pale ?? 0)} />);

  // ---- assemble: back things, skull union (ink, fill), shading, ears, hair cap, features, front extras, accessories
  // (accessories behind the skull go over the hair behind it: the far headset cup sits on the curls, not under them)
  out.push(<g key="hb">{earsBack}{extrasBack}{accBack}</g>);
  out.push(skullInk);
  out.push(skullFill);
  out.push(<g key="hshade">{celOver(`${id}hs`, unionD, L, headSize, s, polyPath(ellPoly(skullE, 36)))}</g>);
  out.push(<g key="ears">{ears}</g>);
  out.push(<g key="hf">{hairFront}</g>);
  out.push(<g key="ft">{feats}</g>);
  out.push(<g key="hx">{extrasFront}</g>);
  out.push(<g key="acc">{acc}</g>);
  return out;
};

const MouthShape: React.FC<{m: Mouth; s: number; ink: number; inkC: string; open: number; t: number; white?: string}> = ({m, s, ink, inkC, open, t, white = '#FFFFFF'}) => {
  const st = {fill: 'none', stroke: inkC, strokeWidth: ink, strokeLinecap: 'round' as const};
  const k = s;
  switch (m) {
    case 'smile': return <path d={`M ${-16 * k} 0 Q 0 ${14 * k} ${16 * k} 0`} {...st} />;
    case 'soft': return <path d={`M ${-12 * k} ${2 * k} Q 0 ${8 * k} ${12 * k} ${2 * k}`} {...st} />;
    case 'grin': return (<g><path d={`M ${-22 * k} ${-2 * k} Q 0 ${30 * k} ${22 * k} ${-2 * k} Z`} fill={inkC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" /><path d={`M ${-16 * k} ${1 * k} Q 0 ${9 * k} ${16 * k} ${1 * k} L ${16 * k} ${5 * k} Q 0 ${12 * k} ${-16 * k} ${5 * k} Z`} fill={white} /></g>);
    case 'flat': return <path d={`M ${-14 * k} ${2 * k} L ${14 * k} ${2 * k}`} {...st} />;
    case 'o': return <ellipse cx={0} cy={4 * k} rx={8 * k} ry={10 * k} fill={inkC} />;
    case 'smirk': return <path d={`M ${-14 * k} ${4 * k} Q ${4 * k} ${12 * k} ${17 * k} ${-3 * k}`} {...st} />;
    case 'frown': return <path d={`M ${-16 * k} ${6 * k} Q 0 ${-6 * k} ${16 * k} ${6 * k}`} {...st} />;
    case 'sad': return <path d={`M ${-13 * k} ${6 * k} Q 0 ${0 * k} ${13 * k} ${6 * k}`} {...st} />;
    case 'hmm': return <path d={`M ${-14 * k} ${2 * k} Q ${-4 * k} ${7 * k} ${4 * k} ${1 * k} Q ${10 * k} ${-3 * k} ${14 * k} ${3 * k}`} {...st} />;
    case 'talk': { const o = 3 + 7 * Math.abs(Math.sin(t * 13.6)); return <ellipse cx={0} cy={4 * k} rx={9 * k} ry={o * k} fill={inkC} />; }
    case 'pant': { const o = 3 + 3.5 * (0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 1.1)) + open * 4; return <ellipse cx={0} cy={5 * k} rx={9 * k} ry={o * k} fill={inkC} />; }
    case 'breath': { const o = 1 + open * 6; return <path d={`M ${-10 * k} ${3 * k} Q 0 ${(3 - o * 0.3) * k} ${10 * k} ${3 * k} Q ${5 * k} ${(4 + o) * k} 0 ${(4 + o) * k} Q ${-5 * k} ${(4 + o) * k} ${-10 * k} ${3 * k} Z`} fill={inkC} stroke={inkC} strokeWidth={ink * 0.5} strokeLinejoin="round" />; }
    case 'open': { const o = 6 + 8 * open; return <path d={`M ${-14 * k} ${2 * k} Q 0 ${-2 * k} ${14 * k} ${2 * k} Q ${8 * k} ${(4 + o * 1.6) * k} 0 ${(4 + o * 1.7) * k} Q ${-8 * k} ${(4 + o * 1.6) * k} ${-14 * k} ${2 * k} Z`} fill={inkC} stroke={inkC} strokeWidth={ink * 0.6} strokeLinejoin="round" />; }
    case 'grit': return (<g><rect x={-15 * k} y={-3 * k} width={30 * k} height={12 * k} rx={5 * k} fill={white} stroke={inkC} strokeWidth={ink * 0.9} /><line x1={-13 * k} y1={3 * k} x2={13 * k} y2={3 * k} stroke={inkC} strokeWidth={ink * 0.5} /></g>);
    case 'pain': return (<g><path d={`M ${-16 * k} ${4 * k} L ${-8 * k} ${-2 * k} L 0 ${2 * k} L ${8 * k} ${-2 * k} L ${16 * k} ${4 * k} L ${8 * k} ${10 * k} L ${-8 * k} ${10 * k} Z`} fill={white} stroke={inkC} strokeWidth={ink * 0.9} strokeLinejoin="round" /><line x1={-12 * k} y1={4 * k} x2={12 * k} y2={4 * k} stroke={inkC} strokeWidth={ink * 0.5} /></g>);
    default: return null;
  }
};

/** A single figure, internally depth-sorted. */
export const Figure: React.FC<FigProps> = (p) => {
  const {parts} = figureParts(p);
  parts.sort((a, b) => a.z - b.z);
  return <g opacity={p.opacity}>{parts.map((q) => <g key={q.key}>{q.el}</g>)}</g>;
};

/** Several figures sorted together (limbs pass in front of / behind each other). Each figure's `id` must differ. */
export const Group: React.FC<{figs: (FigProps & {z?: number})[]; extra?: Part[]}> = ({figs, extra = []}) => {
  const all: Part[] = [];
  figs.forEach((f, i) => figureParts(f).parts.forEach((q) => all.push({...q, z: q.key === 'shadow' ? -1e9 + (f.z ?? 0) : (f.z ?? 0) * 1000 + q.z, key: `${i}_${q.key}`})));
  extra.forEach((e) => all.push(e));
  all.sort((a, b) => a.z - b.z);
  return <g>{all.map((q) => <g key={q.key}>{q.el}</g>)}</g>;
};
