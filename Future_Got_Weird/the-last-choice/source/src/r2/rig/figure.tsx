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
import {V2, V3, add3, sub3, mul3, dot3, len3, norm3, rotAxis, rad, lerp, lerp3, clamp, rnd, smoothPath, polyPath, pt, f2} from '../../kit/math';
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
export const propPt = (h: HandFrame, x: number, y: number, s: number): V3 => {
  const g = handPt(h, GRIP0 * s, 0), dx = x - GRIP0 * s;
  return {x: g.x + h.a3.x * dx + h.t3.x * y, y: g.y + h.a3.y * dx + h.t3.y * y, z: h.pos.z + (h.a3.z * x + h.t3.z * y)};
};
/** The transform to wrap a held prop (drawn in hand-local units) with, INSIDE the hand glyph's group (handM): it maps the
 *  glyph's frame to the prop frame (propPt) about the grip. */
const propInGlyph = (h: HandFrame, s: number) => {
  const det = h.ax.x * h.ay.y - h.ay.x * h.ax.y;
  if (Math.abs(det) < 1e-6) return '';
  // K = Mg⁻¹ · Mp (Mg = [ax ay], Mp = [a3.xy t3.xy])
  const ia = h.ay.y / det, ib = -h.ay.x / det, ic = -h.ax.y / det, id = h.ax.x / det;
  const k11 = ia * h.a3.x + ib * h.a3.y, k21 = ic * h.a3.x + id * h.a3.y, k12 = ia * h.t3.x + ib * h.t3.y, k22 = ic * h.t3.x + id * h.t3.y;
  const g0 = GRIP0 * s;
  // q → g0 + K (q − g0)
  const e = g0 - k11 * g0, f = -k21 * g0;
  const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
  return `matrix(${r4(k11)} ${r4(k21)} ${r4(k12)} ${r4(k22)} ${f2(e)} ${f2(f)})`;
};
export type HoldFn = (h: HandFrame, s: number, ink: number, col: (c: string) => string) => React.ReactNode;
export type WearFn = (fa: {E: V3; W: V3; dorsal: V3; ang: number; len: number}, s: number, ink: number, col: (c: string) => string) => {el: React.ReactNode; front: boolean} | null;

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
  const out: Rig2 = {
    root, P: pnt(P), base: vb(base), up: vb(up), head: vb(hb), s, ink: p.ink ?? 4 * s,
    hip: [pnt(hip[0]), pnt(hip[1])], knee: [pnt(knee[0]), pnt(knee[1])], ankle: [pnt(ankle[0]), pnt(ankle[1])],
    sh: [pnt(sh[0]), pnt(sh[1])], el: [pnt(el[0]), pnt(el[1])], wr: [pnt(wr[0]), pnt(wr[1])],
    neck: pnt(neck), headC: pnt(headC), torsoZ: vec(sub3(at(P, up, 0, 70 * s, 0), root)).z,
    palm: [vec(palm[0]), vec(palm[1])],
    hands: [] as unknown as [HandFrame, HandFrame],
    orient: orient.map((o) => ({fingers: o.fingers ? vec(o.fingers) : null, palm: o.palm ? vec(o.palm) : null, w: o.w})) as Rig2['orient'],
    armRank: [0, 0], toolZ: 0, armRankU: [0, 0],
    zone: () => 0, zoneZ: [0, 0, 0], rankOf: () => 0, zoneAt: () => 0, rankAt: () => 0, zCut: [0, 0], armOverride: p.zArm?.[0] !== undefined || p.zArm?.[1] !== undefined,
    // a thigh pointing toward the camera, judged in the unpitched frame (a camera below the figure must not bring the
    // legs over the shirt's hem)
    legFront: [0, 1].map((i) => knee[i].z - hip[i].z > 0.42 * THIGH * s && knee[i].z > torsoZ + 10 * s) as [boolean, boolean],
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
    const frontSurf = (q: V3): number | null => {
      const d = sub3(q, Pd);
      const r0 = dot3(d, B.R), u0 = dot3(d, B.U), f0 = dot3(d, B.F);
      const h = u0 / s;
      if (h < -25 || h > 150) return null;
      // (the chest's flanks are the shoulders the arms hang from: narrowed there, so an arm at the side, seen from
      // the front or the back, sorts by depth as before rather than disappearing behind the torso's outline)
      const [a, b] = ab(h), A2 = (a * s * lerp(1, 0.84, clamp((h - 60) / 40))) ** 2, B2 = (b * s) ** 2;
      const vr = B.R.z, vf = B.F.z;
      const qa = vr * vr / A2 + vf * vf / B2, qb = 2 * (r0 * vr / A2 + f0 * vf / B2), qc = r0 * r0 / A2 + f0 * f0 / B2 - 1;
      if (qa < 1e-9) return qc < 0 ? q.z : null;
      const disc = qb * qb - 4 * qa * qc;
      if (disc < 0) return null;
      return q.z + (-qb + Math.sqrt(disc)) / (2 * qa);
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
    out.zoneAt = (q: V3) => {
      const fz = frontSurf(q);
      if (fz !== null ? q.z < fz - 2 * s : zHor(q) <= zTH) return 0;
      // over the head's outline: in front of the face only if in front of the head's own surface there
      const dx = (q.x - Hc.x) / hr, dy = (q.y - Hc.y) / hry, d2 = dx * dx + dy * dy;
      if (d2 >= 1) return 1;
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
export const splitZones = (r: Rig2, key: string, el: React.ReactElement, a: V3, b: V3, bias = 0.35): Part[] => {
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
  // the piece in the hands' zone sits over both forearms; a pose that overrides an arm's depth keeps R2's tool rank
  const handZone = zoneOfRank(r, r.toolZ - 0.3);
  const rank = (zn: number) => (r.armOverride && zn === handZone ? r.toolZ : r.zoneZ[zn] + bias);
  if (runs.length === 1 || dl < 1e-3) return [{z: rank(runs.length === 1 ? runs[0].zone : zMid(0.5)), key, el}];
  const ux = d.x / dl, uy = d.y / dl, BIG = 1e5;
  return runs.map((rn, k) => {
    const t0 = k === 0 ? -BIG / dl : rn.t0, t1 = k === runs.length - 1 ? BIG / dl : rn.t1;
    const p0 = {x: a.x + d.x * t0, y: a.y + d.y * t0}, p1 = {x: a.x + d.x * t1, y: a.y + d.y * t1};
    const poly = [{x: p0.x - uy * BIG, y: p0.y + ux * BIG}, {x: p1.x - uy * BIG, y: p1.y + ux * BIG}, {x: p1.x + uy * BIG, y: p1.y - ux * BIG}, {x: p0.x + uy * BIG, y: p0.y - ux * BIG}];
    const cid = `${r.id}_${key}_z${k}`;
    return {z: rank(rn.zone), key: `${key}${k}`, el: (
      <g>
        <defs><clipPath id={cid}><path d={polyPath(poly)} /></clipPath></defs>
        <g clipPath={`url(#${cid})`}>{el}</g>
      </g>
    )};
  });
};

// ------------------------------------------------------------------ hair geometry (R1 tables, kept)
const HAIRLINE: Record<string, [number, number][]> = {
  crop: [[0, -0.6], [55, -0.42], [90, -0.12], [125, 0.32], [180, 0.6]],
  bun: [[0, -0.55], [55, -0.38], [90, -0.12], [125, 0.32], [180, 0.6]],
  curly: [[0, -0.5], [55, -0.4], [90, -0.15], [125, 0.3], [180, 0.62]],
  swoop: [[0, -0.86], [55, -0.62], [90, -0.12], [125, 0.32], [180, 0.6]],
  // (the back stays above the bob's hem at 0.55: R2's 0.78 showed the cap's V below the cut, a doubled hem from behind)
  bob: [[0, -0.98], [40, -0.92], [75, -0.55], [95, 0.42], [180, 0.5]],
  short: [[0, -0.62], [55, -0.45], [90, -0.15], [125, 0.28], [180, 0.55]],
  spiky: [[0, -0.6], [55, -0.42], [90, -0.12], [125, 0.32], [180, 0.6]],
  bald: [[0, -0.15], [80, -0.05], [100, 0.1], [180, 0.25]],
};
const VOLUME: Record<string, number> = {crop: 16, bun: 14, curly: 10, swoop: 8, bob: 16, short: 10, spiky: 10, bald: 0};
const smoothK = (x: number) => x * x * (3 - 2 * x);
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

// limb as a chain of quads with round interior joints: ink layer (widened) then fills, then a shadow band and a rim
// strip inside each segment. Ends are square (they hide inside the torso/pelvis or under the hand/shoe).
const quad = (a: V2, b: V2, hw0: number, hw1: number, o0 = 0, o1 = 0) => {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  return `M ${f2(a.x + nx * (o0 + hw0))} ${f2(a.y + ny * (o0 + hw0))} L ${f2(b.x + nx * (o1 + hw1))} ${f2(b.y + ny * (o1 + hw1))} L ${f2(b.x + nx * (o1 - hw1))} ${f2(b.y + ny * (o1 - hw1))} L ${f2(a.x + nx * (o0 - hw0))} ${f2(a.y + ny * (o0 - hw0))} Z`;
};
const LimbG: React.FC<{pts: V2[]; w: number | number[]; ink: number; inkC: string; colors: string[]; L?: FigLight; s: number; endCap?: boolean}> = ({pts, w, ink, inkC, colors, L, s, endCap}) => {
  const W = pts.map((_, i) => (Array.isArray(w) ? w[Math.min(i, w.length - 1)] : w));
  const segs = pts.slice(0, -1).map((a, i) => ({a, b: pts[i + 1], w0: W[i], w1: W[i + 1], c: colors[Math.min(i, colors.length - 1)]}));
  const joints = pts.slice(1, endCap ? undefined : -1).map((q, j) => ({q, r: W[j + 1] / 2, c: colors[Math.min(j + 1, colors.length - 1)]}));
  let sh: React.ReactNode = null, rim: React.ReactNode = null;
  if (L) {
    const l2 = Math.hypot(L.dir.x, L.dir.y) || 1;
    const lx = L.dir.x / l2, ly = L.dir.y / l2, lz = clamp(L.dir.z, -1, 1), key = L.key ?? 1;
    const frac = clamp(0.32 + 0.5 * (0.5 - lz * 0.6), 0.2, 0.92) * key;
    const rimAmt = clamp(0.35 - lz) * (L.rim ?? 1) * key;
    sh = segs.map((g, i) => {
      const dx = g.b.x - g.a.x, dy = g.b.y - g.a.y, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const side = -(Math.sign(nx * lx + ny * ly) || 1);
      const hw0 = g.w0 / 2, hw1 = g.w1 / 2;
      return <path key={`s${i}`} d={quad(g.a, g.b, hw0 * frac, hw1 * frac, side * hw0 * (1 - frac), side * hw1 * (1 - frac))} fill={L.shadowC ?? '#2B3550'} opacity={0.3 * key} />;
    });
    if (rimAmt > 0.04) rim = segs.map((g, i) => {
      const dx = g.b.x - g.a.x, dy = g.b.y - g.a.y, len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const side = Math.sign(nx * lx + ny * ly) || 1;
      const rw = Math.max(0.8, 2.4 * s);
      return <path key={`r${i}`} d={quad(g.a, g.b, rw, rw, side * (g.w0 / 2 - rw), side * (g.w1 / 2 - rw))} fill={L.rimC ?? '#FFC890'} opacity={clamp(rimAmt * 1.6) * 0.85} />;
    });
  }
  return (
    <g>
      <g fill={inkC}>
        {segs.map((g, i) => <path key={i} d={quad(g.a, g.b, g.w0 / 2 + ink, g.w1 / 2 + ink)} />)}
        {joints.map((j, i) => <circle key={`j${i}`} cx={j.q.x} cy={j.q.y} r={j.r + ink} />)}
      </g>
      {segs.map((g, i) => <path key={`f${i}`} d={quad(g.a, g.b, g.w0 / 2, g.w1 / 2)} fill={g.c} />)}
      {joints.map((j, i) => <circle key={`jf${i}`} cx={j.q.x} cy={j.q.y} r={j.r} fill={j.c} />)}
      {sh}{rim}
    </g>
  );
};

/**
 * One limb segment as separate ink and fill layers, so two segments of a limb (upper arm / forearm, thigh / shin) can be
 * drawn in either order or in different depth parts. `capA` / `capB` (0..1) round the segment's start / end with a disk
 * (fill, plus its ink rim at that opacity): a forearm emerging in front of its own upper arm or of the torso shows a
 * rounded elbow, an upper arm in front of the chest a rounded shoulder.
 */
const segLayers = (a: V2, b: V2, w0: number, w1: number, ink: number, inkC: string, c: string, L: FigLight | undefined, s: number, capA = 0, capB = 0, key = 's', capAInk = capA) => {
  const inkEl = (
    <g key={`${key}i`} fill={inkC}>
      <path d={quad(a, b, w0 / 2 + ink, w1 / 2 + ink)} />
      {capA > 0.02 && capAInk > 0.02 && <circle cx={a.x} cy={a.y} r={w0 / 2 + ink} opacity={capAInk} />}
      {capB > 0.02 && <circle cx={b.x} cy={b.y} r={w1 / 2 + ink} opacity={capB} />}
    </g>
  );
  let shade: React.ReactNode = null, rim: React.ReactNode = null;
  if (L) {
    const l2 = Math.hypot(L.dir.x, L.dir.y) || 1;
    const lx = L.dir.x / l2, ly = L.dir.y / l2, lz = clamp(L.dir.z, -1, 1), key0 = L.key ?? 1;
    const frac = clamp(0.32 + 0.5 * (0.5 - lz * 0.6), 0.2, 0.92) * key0;
    const rimAmt = clamp(0.35 - lz) * (L.rim ?? 1) * key0;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const sideS = -(Math.sign(nx * lx + ny * ly) || 1);
    shade = <path d={quad(a, b, (w0 / 2) * frac, (w1 / 2) * frac, sideS * (w0 / 2) * (1 - frac), sideS * (w1 / 2) * (1 - frac))} fill={L.shadowC ?? '#2B3550'} opacity={0.3 * key0} />;
    if (rimAmt > 0.04) { const rw = Math.max(0.8, 2.4 * s); rim = <path d={quad(a, b, rw, rw, -sideS * (w0 / 2 - rw), -sideS * (w1 / 2 - rw))} fill={L.rimC ?? '#FFC890'} opacity={clamp(rimAmt * 1.6) * 0.85} />; }
  }
  const fillEl = (
    <g key={`${key}f`}>
      <path d={quad(a, b, w0 / 2, w1 / 2)} fill={c} />
      {capA > 0.02 && <circle cx={a.x} cy={a.y} r={w0 / 2} fill={c} />}
      {capB > 0.02 && <circle cx={b.x} cy={b.y} r={w1 / 2} fill={c} />}
      {shade}{rim}
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

  // ---------------- legs (stroke limbs, butt-capped at the hip inside the pelvis) and shoes
  const pantsC = col(look.pants), shoeC = col(look.shoes);
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
    // a thigh toward the camera (sitting, kneeling, a high knee) is drawn over the torso's hem with a rounded hip;
    // otherwise the leg starts inside the pelvis and sorts with the arms behind the torso by its depth. (R2 offset the
    // leg's rank by its depth in PIXELS, so close-ups brought standing legs over the shirt and wides kept seated thighs
    // behind it; and a near leg in profile sorted under the far arm.)
    const front = r.legFront[i];
    const Hn = add3(H, mul3(norm3(sub3(H, K)), (front ? 2 : 10) * s));
    const LW = [LEG_W * 1.05 * s, LEG_W * 0.95 * s, LEG_W * 0.8 * s];
    const legEl = front
      ? (() => { const a = segLayers(Hn, K, LW[0], LW[1], ink, inkC, pantsC, L, s, 1, 0, `ha${i}`), b = segLayers(K, A, LW[1], LW[2], ink, inkC, pantsC, L, s, 0, 0, `hb${i}`); return <g>{a.ink}{b.ink}<circle cx={K.x} cy={K.y} r={LW[1] / 2 + ink} fill={inkC} />{b.fill}{a.fill}<circle cx={K.x} cy={K.y} r={LW[1] / 2} fill={pantsC} /></g>; })()
      : <LimbG pts={[Hn, K, A]} w={LW} ink={ink} inkC={inkC} colors={[pantsC, pantsC]} L={L} s={s} />;
    add(front ? r.torsoZ + 1 + i * 0.01 : r.torsoZ - 40 + clamp((legZ - r.torsoZ) / (600 * s), -1, 1) * 0.3 + i * 0.001, `leg${i}`, (
      <g>
        <ellipse cx={sc.x} cy={sc.y} rx={Math.max(e.rx, 12 * s)} ry={Math.max(e.ry, 9 * s)} transform={`rotate(${f2(e.rot)} ${f2(sc.x)} ${f2(sc.y)})`} fill={shoeC} stroke={inkC} strokeWidth={ink} />
        {legEl}
        {decals.map((d, k) => <LimbDecal key={k} d={d} a={d.limb.endsWith('0') ? H : K} b={d.limb.endsWith('0') ? K : A} w={LEG_W * s} ink={ink} inkC={inkC} skin={skin} />)}
      </g>
    ));
  });

  // ---------------- pelvis (projected ellipsoid, follows lean/pitch/roll)
  {
    const c = at(r.P, base, 0, 4 * s, 0);
    const e = ellipsoid2([mul3(base.R, 64 * s), mul3(base.U, 26 * s), mul3(base.F, 38 * s)]);
    const d = `M ${f2(c.x - e.rx)} ${f2(c.y)} a ${f2(e.rx)} ${f2(e.ry)} 0 1 0 ${f2(2 * e.rx)} 0 a ${f2(e.rx)} ${f2(e.ry)} 0 1 0 ${f2(-2 * e.rx)} 0 Z`;
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
      const band: V2[] = [];
      for (let ph = -180; ph <= 180; ph += 15) { const q = surf(ph, h0); if (q.vis > -0.05) band.push(q); }
      const band2: V2[] = [];
      for (let ph = 180; ph >= -180; ph -= 15) { const q = surf(ph, h1); if (q.vis > -0.05) band2.push(q); }
      if (band.length > 1 && band2.length > 1) tf.push(<path key={`st${k}`} d={polyPath([...band, ...band2])} fill={col(look.stripes)} />);
    }
  }
  if (look.accessories.includes('nametag')) {
    const c = surf(-30, 106);
    if (c.vis > 0.1) {
      const sx = clamp(c.vis * 1.1, 0.25, 1);
      const a = Math.atan2(u2.x, -u2.y) * 180 / Math.PI;
      tf.push(
        <g key="tag" transform={`translate(${f2(c.x)} ${f2(c.y)}) rotate(${f2(a)}) scale(${f2(sx)} 1)`}>
          <rect x={-20 * s} y={-11 * s} width={40 * s} height={22 * s} rx={4 * s} fill={col(C.white)} stroke={inkC} strokeWidth={ink * 0.75} />
          <rect x={-14 * s} y={-3 * s} width={28 * s} height={5 * s} rx={2 * s} fill={col(C.inkMuted)} />
        </g>,
      );
    }
  }
  if (look.accessories.includes('bowtie')) {
    const c = surf(0, 146);
    if (c.vis > 0.05) {
      const sx = clamp(c.vis * 1.1, 0.25, 1);
      tf.push(<g key="bow" transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`}>
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
      tf.push(<g key={`stn${k}`} transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`} opacity={st.amt ?? 1}><path d={tearPath(st.size * s, sd)} fill={skin} stroke={inkC} strokeWidth={ink * 0.6} strokeLinejoin="round" /></g>);
      return;
    }
    const c1 = st.kind === 'dirt' ? 'rgba(60,45,40,0.35)' : BLOOD.main;
    tf.push(
      <g key={`stn${k}`} transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`} opacity={st.amt ?? 1}>
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
    const upperCross = (zoneS === 2 || zoneE === 2 || zoneU === 2) && (zoneS !== zoneU || zoneE !== zoneU);
    const rUE = upperCross ? r.zoneZ[zoneE] : rU;
    const split = Math.abs(rU - rL) > 1 || upperCross; // the halves sit in different depth zones (or the pose overrides the forearm's)
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
    const capS = zoneU >= 1 || zoneS === 2 ? 1 : 0;
    const frontK = capS ? Math.max(clamp((ua.z - 0.6) / 0.3), zoneS === 2 && overHead ? 1 : 0) : 0;
    const raise = Math.max(0, dot3(ua, r.up.U));
    const S0 = capS ? S : add3(S, mul3(norm3(add3(mul3(ua, -0.9 * raise), inward)), 16 * s));
    const cuff = add3(S, mul3(ua, UPPER * s * 0.58));
    // forearm ends under the hand with a square end
    const W0 = add3(Wr, mul3(fa, 4 * s));
    const holdFn = i === 0 ? p.holdL : p.holdR;
    const hold0 = holdFn ? holdFn(hf, s, ink, col) : null;
    const hold = hold0 ? <g transform={propInGlyph(hf, s)}>{hold0}</g> : null;
    const [hBack, hFront] = handGlyph(hShape[i], {s, ink, skin, inkC, pv: hf.pv, thumb: hf.thumb, blood: hb, dirt: sil ? 0 : (dmg.dirt ?? 0) * 0.6, holding: hold, framed: true});
    const handEl = (layer: React.ReactElement) => <g transform={handM(hf)}>{layer}</g>;
    const wearFn = i === 0 ? p.wearL : p.wearR;
    const dorsal = mul3(r.palm[i], -1);
    const wear = wearFn ? wearFn({E, W: Wr, dorsal, ang: ang2(E, Wr), len: len3(sub3(Wr, E))}, s, ink, col) : null;
    // the elbow: a half drawn over the other gets a rounded end there when the arm is bent (or the halves are in
    // different depth parts); a nearly straight arm keeps the shared joint (no ring across the arm)
    const capE = split ? 1 : clamp((bend - 35) / 30);
    const up = segLayers(S0, E, AW[0], AW[1], ink, inkC, skin, L, s, capS, lowerTop ? 0 : capE, `u${i}`, frontK);
    const lo = segLayers(E, W0, AW[1], AW[2], ink, inkC, skin, L, s, lowerTop ? capE : 0, 0, `l${i}`);
    const sideL = L ? -(Math.sign((-ua.y) * L.dir.x + ua.x * L.dir.y) || 1) : 1;
    const upperFill = (
      <g key={`uf${i}`}>
        {up.fill}
        {/* the shared elbow joint (fills the outside of the bend) */}
        {!split && <circle cx={E.x} cy={E.y} r={AW[1] / 2} fill={skin} />}
        {/* sleeve: shirt colour from the shoulder to the cuff (slightly flared), then a hem line */}
        <path d={quad(S0, cuff, ARM_W * 0.54 * s, ARM_W * 0.56 * s)} fill={sleeve} />
        {capS > 0 && <circle cx={S0.x} cy={S0.y} r={ARM_W * 0.54 * s} fill={sleeve} />}
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
        {wear && !wear.front && wear.el}
        {lo.ink}
        {lo.fill}
        {decals.filter((d) => d.limb.endsWith('1')).map((d, k) => <LimbDecal key={k} d={d} a={E} b={Wr} w={ARM_W * s} ink={ink} inkC={inkC} skin={skin} />)}
        {wear && wear.front && wear.el}
        {handEl(hBack)}
      </g>
    );
    if (!split) {
      // one part: the shared outline under both halves, then the far half, then the near half with its own outline
      // (a forearm folded across the upper arm keeps its edge)
      const elbowInk = <circle cx={E.x} cy={E.y} r={AW[1] / 2 + ink} fill={inkC} />;
      add(rL, `arm${i}`, lowerTop
        ? <g>{up.ink}{lo.ink}{elbowInk}{upperFill}{lowerFill}</g>
        : <g>{up.ink}{lo.ink}{elbowInk}{lowerFill}{up.ink}{upperFill}</g>);
    } else {
      if (upperCross) splitZones(r, `armU${i}`, <g>{up.ink}{upperFill}</g>, S0, E, 0.05).forEach((q) => parts.push(q));
      else add(rU, `armU${i}`, <g>{up.ink}{upperFill}</g>);
      add(rL, `arm${i}`, lowerFill);
    }
    const zF = p.zHandFront?.[i];
    // (two hands on one tool: the curled fingers over the tool's piece in the hand's own depth zone, see splitZones)
    add(zF !== undefined ? r.torsoZ + zF : p.twoHanded ? (r.armOverride ? r.toolZ + 0.3 : r.zoneZ[zoneOfRank(r, rL)] + 0.6) : rL + 0.5, `handf${i}`, handEl(hFront));
  });

  // ---------------- neck and head
  {
    const a = at(r.neck, up, 0, -6 * s, 0), b = at(r.headC, r.head, 0, -38 * s, 0);
    add(r.torsoZ + 2, 'neck', (
      <g>
        <LimbG pts={[a, b]} w={30 * s} ink={ink} inkC={inkC} colors={[skin]} L={L} s={s} />
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
    hairFront.push(<path key="cap" d={smoothPath([...line, ...arc], true, 0.35)} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
  }
  const extrasBack: React.ReactElement[] = [];
  const extrasFront: React.ReactElement[] = [];
  const blobAt = (key: string, r0: number, u0: number, f0: number, rad0: number) => {
    const q = hl3(r0, u0, f0);
    const el = <circle key={key} cx={q.x} cy={q.y} r={rad0 * s} fill={hairC} stroke={inkC} strokeWidth={ink} />;
    (q.z > 0.15 ? extrasFront : extrasBack).push(el);
  };
  if (hairType === 'bun') blobAt('bun', 0, 1.24, -0.3, 21);
  if (hairType === 'curly') {
    const curls: [number, number, number, number][] = [
      [0, 1.1, -0.3, 24], [0.5, 0.98, -0.45, 22], [-0.5, 0.98, -0.45, 22], [0, 0.82, -0.8, 22], [0.82, 0.55, -0.6, 20], [-0.82, 0.55, -0.6, 20],
      [0.45, 0.3, -0.95, 20], [-0.45, 0.3, -0.95, 20], [0, 0.02, -1.05, 19], [0.95, -0.02, -0.45, 17], [-0.95, -0.02, -0.45, 17],
      [0.83, 0.84, 0.1, 20], [-0.83, 0.84, 0.1, 20], [1.07, 0.16, 0.05, 16], [-1.07, 0.16, 0.05, 16],
      [0.52, 1.02, 0.25, 24], [-0.52, 1.02, 0.25, 24], [0.17, 1.08, 0.3, 24], [-0.17, 1.08, 0.3, 24],
    ];
    const sorted = curls.map((c, k) => ({c, k, z: hl3(c[0], c[1], c[2]).z})).sort((a, b) => a.z - b.z);
    // rear and rear-three-quarter views (the face turned away): the near curls merge into one hair mass — a scalloped
    // outer silhouette, cel shadow and a lit rim from the key light, and a few thin curl strokes — instead of a cluster
    // of inked circles. Front and profile views (rearW 0) draw exactly as before; it blends in between.
    const rw0 = clamp((-hb.F.z - 0.15) / 0.3), rearW = rw0 * rw0 * (3 - 2 * rw0);
    if (rearW <= 0) sorted.forEach(({c, k}) => blobAt(`cu${k}`, c[0], c[1], c[2], c[3]));
    else {
      const near: {x: number; y: number; r: number; z: number; k: number; c: (typeof curls)[number]}[] = [];
      sorted.forEach(({c, k}) => {
        const q = hl3(c[0], c[1], c[2]);
        if (q.z > 0.15) near.push({x: q.x, y: q.y, r: c[3] * s, z: q.z, k, c});
        else blobAt(`cu${k}`, c[0], c[1], c[2], c[3]); // behind the skull, as before
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
    // a hanging side panel in front views, the full cut in profile
    const hem: V2[] = [];
    for (let k = 0; k <= 24; k++) hem.push(onHead(80 + (200 * k) / 24, 0.55, 1.12));
    const Ce = {x: Hc.x - hb.U.x * vol * 0.4, y: Hc.y - hb.U.y * vol * 0.4};
    const d = smoothPath([...hem, ...overCrown(hem, Ce, R * 1.1 + vol * 0.2, RY * 1.04 + vol * 0.45)], true, 0.3);
    const behind = dot3(hb.F, zv) > -0.3;
    (behind ? extrasBack : extrasFront).push(<path key="bobmass" d={d} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
    // a few strands down the back so the mass reads as hair, not a helmet
    if (!behind) [150, 180, 210].forEach((th, k) => {
      const a = onHead(th, -0.62, 1.12), m = onHead(th + 6, 0.0, 1.13), b = onHead(th + 2, 0.42, 1.12);
      if (m.z > 0.15) extrasFront.push(<path key={`bst${k}`} d={`M ${pt(a)} Q ${pt(m)} ${pt(b)}`} fill="none" stroke={inkC} strokeWidth={ink * 0.55} strokeLinecap="round" opacity={0.55 * clamp((m.z - 0.15) * 3)} />);
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
    (q.z > -0.25 ? ears : earsBack).push(el);
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
    if (q.z <= 0.12) return;
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
      if (l.z <= 0.12) return;
      feats.push(
        <g key={`gl${k}`} transform={`translate(${f2(l.x)} ${f2(l.y)}) rotate(${f2(rollDeg)}) scale(${f2(l.sx)} 1)`} opacity={fold(l)}>
          {glasses === 'rect' ? <rect x={-15 * s} y={-13 * s} width={30 * s} height={26 * s} rx={7 * s} fill="none" stroke={inkC} strokeWidth={ink * 0.9} /> : <circle cx={0} cy={0} r={17 * s} fill="none" stroke={inkC} strokeWidth={ink * 0.9} />}
        </g>,
      );
    });
    if (lens[0].z > 0.12 && lens[1].z > 0.12) {
      const m = onHead(0, eyeY - 0.05, 1.04);
      feats.push(<path key="bridge" d={`M ${pt({x: lerp(lens[0].x, m.x, 0.55), y: lerp(lens[0].y, m.y, 0.55)})} L ${pt({x: lerp(lens[1].x, m.x, 0.55), y: lerp(lens[1].y, m.y, 0.55)})}`} stroke={inkC} strokeWidth={ink * 0.8} />);
    }
    [-1, 1].forEach((sd, k) => {
      const l = lens[k];
      const ear = onHead(sd * 88, eyeY, 1.02);
      if (l.z > 0.12 && ear.z > -0.1 && Math.abs(l.x - ear.x) > 14 * s) feats.push(<line key={`tm${sd}`} x1={l.x + Math.sign(ear.x - l.x) * 15 * s * l.sx} y1={l.y - 4 * s} x2={ear.x} y2={ear.y - 6 * s} stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" />);
    });
  }
  // nose line (front/three-quarter); the profile bump is the nose ellipsoid in the skull union
  {
    const q = onHead(0, 0.0, 1);
    const side = Math.sign(hb.F.x) || 1;
    const prof = Math.abs(hb.F.x);
    if (q.z > 0.15 && prof < 0.85) feats.push(<path key="nose" d={`M ${pt({x: q.x + 2 * s, y: q.y + 2 * s})} q ${8 * s * side} ${14 * s} ${-2 * s * side} ${16 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.75} strokeLinecap="round" opacity={fold(q) * 0.6 + 0.4} />);
    else if (prof >= 0.85 && hb.F.z > -0.3) {
      // (only while the nose is on the visible side: R2 drew it on the cheek or the hair in rear three-quarter views)
      const tip = hl3(0, 0.12, 1.08);
      feats.push(<path key="nostril" d={`M ${f2(tip.x - side * 7 * s)} ${f2(tip.y)} q ${f2(side * 3 * s)} ${f2(4 * s)} ${f2(-side * 2 * s)} ${f2(6 * s)}`} fill="none" stroke={inkC} strokeWidth={ink * 0.6} strokeLinecap="round" />);
    }
  }
  {
    const q = onHead(0, 0.5, 1);
    if (q.z > -0.05) {
      const sx = clamp(q.z * 1.1, 0.35, 1);
      if (q.z < 0.35) { const side = Math.sign(q.x - Hc.x) || 1; q.x -= side * (0.35 - q.z) * 22 * s; }
      feats.push(<g key="mouth" transform={`translate(${f2(q.x)} ${f2(q.y)}) rotate(${f2(rollDeg)}) scale(${f2(sx)} 1)`} opacity={fold(q) * 0.5 + 0.5}><MouthShape m={face.mouth ?? 'flat'} s={s} ink={ink} inkC={inkC} open={face.open ?? 0} t={t} white={col('#FFFFFF')} /></g>);
    }
  }
  if (look.cheeks) [-1, 1].forEach((sd) => { const q = onHead(sd * 40, 0.25, 1); if (q.z > 0.2) feats.push(<ellipse key={`ch${sd}`} cx={q.x} cy={q.y} rx={9 * s * clamp(q.z, 0.3, 1)} ry={7 * s} fill={col('#F28B82')} opacity={0.7} />); });
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
    const visible = pts3.filter((a) => a.q.z > 0.05);
    if (visible.length > 2) {
      const Lt: V2[] = [], Rt: V2[] = [];
      for (let k = 0; k < visible.length; k++) {
        const a = visible[k].q, b = visible[Math.min(visible.length - 1, k + 1)].q, c0 = visible[Math.max(0, k - 1)].q;
        const dx = b.x - c0.x, dy = b.y - c0.y, l = Math.hypot(dx, dy) || 1;
        const w = visible[k].w * s * clamp(a.z * 1.2, 0.3, 1);
        Lt.push({x: a.x - (dy / l) * w, y: a.y + (dx / l) * w}); Rt.push({x: a.x + (dy / l) * w, y: a.y - (dx / l) * w});
      }
      feats.push(<path key="brow" d={smoothPath([...Lt, ...Rt.reverse()], true, 0.6)} fill={BLOOD.main} opacity={0.95} />);
      const c0 = pts3[0].q;
      if (c0.z > 0.1) feats.push(<path key="cut" d={`M ${pt({x: c0.x - 7 * s, y: c0.y - 2 * s})} L ${pt({x: c0.x + 7 * s, y: c0.y + 2 * s})}`} stroke={BLOOD.dark} strokeWidth={3.2 * s} strokeLinecap="round" />);
    }
  }
  if ((dmg.noseBleed ?? 0) > 0) {
    const a = onHead(-4, 0.28, 1.01), b = onHead(-6, 0.28 + 0.24 * (dmg.noseBleed ?? 0), 1.01);
    if (a.z > 0.2) feats.push(<path key="nb" d={`M ${pt(a)} Q ${pt({x: a.x + 3 * s, y: (a.y + b.y) / 2})} ${pt(b)}`} stroke={BLOOD.main} strokeWidth={5 * s * clamp(a.z, 0.4, 1)} strokeLinecap="round" fill="none" />);
  }
  if ((dmg.lipCut ?? 0) > 0) {
    // a split in the lower lip, just off centre
    const a = onHead(-7, 0.545, 1.01), b = onHead(-2, 0.56, 1.01);
    if (a.z > 0.2) feats.push(<path key="lip" d={`M ${pt(a)} L ${pt(b)}`} stroke={BLOOD.dark} strokeWidth={3 * s} strokeLinecap="round" opacity={dmg.lipCut} />);
  }
  if ((dmg.mouthBlood ?? 0) > 0) {
    // one tapered trickle from the corner of the mouth toward the chin: widest at the lip, narrowing to a soft rounded
    // tip — a single smear (a separate drop at its end read as an "!" in close-ups)
    const mbA = dmg.mouthBlood ?? 0;
    const len = 0.22 * clamp(mbA * 1.4);
    const pts: {q: ReturnType<typeof onHead>; w: number}[] = [];
    for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push({q: onHead(-11 - 4 * u * u, 0.52 + len * u, 1.01), w: lerp(4.8, 2.1, Math.sqrt(u)) * s}); }
    if (pts[0].q.z > 0.2) {
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
      feats.push(<path key="mb" d={smoothPath([...L, tip, ...Rr.reverse()], true, 0.35)} fill={BLOOD.main} opacity={clamp(mbA * 1.5)} />);
    }
  }
  if (dmg.bruise && dmg.bruise.amt > 0) {
    const a = onHead(dmg.bruise.side * 42, 0.18, 1.0);
    if (a.z > 0.1) feats.push(<path key="bruise" d={blobPath(12 * s, 77, 9, 0.35, clamp(a.z, 0.3, 1), 0.8)} transform={`translate(${f2(a.x)} ${f2(a.y)})`} fill={BLOOD.bruise} opacity={0.42 * dmg.bruise.amt} />);
  }
  if ((dmg.dirt ?? 0) > 0) {
    [[-38, 0.3, 9], [30, -0.45, 7], [50, 0.42, 6]].forEach(([th, ey, r0], k) => {
      const a = onHead(th, ey, 1);
      if (a.z > 0.15) feats.push(<path key={`dirt${k}`} d={blobPath(r0 * s, 50 + k, 8, 0.5, clamp(a.z, 0.3, 1), 0.7)} transform={`translate(${f2(a.x)} ${f2(a.y)})`} fill="rgba(70,50,45,0.28)" opacity={dmg.dirt} />);
    });
  }

  // ---- head accessories
  const acc: React.ReactElement[] = [], accBack: React.ReactElement[] = [];
  if (look.accessories.includes('visor')) {
    const band: V2[] = [], band2: V2[] = [];
    let anyVis = false;
    const lo = Math.max(-100, thC - 88), hi = Math.min(100, thC + 88);
    if (hi > lo) {
      for (let k = 0; k <= 16; k++) { const a = onHead(lerp(lo, hi, k / 16), -0.58, 1.04); band.push(a); if (a.z > 0) anyVis = true; }
      for (let k = 16; k >= 0; k--) band2.push(onHead(lerp(lo, hi, k / 16), -0.32, 1.04));
    }
    // back strap (seen from behind)
    const strap: V2[] = [];
    const blo = Math.max(100, thC - 88 + 360 * (thC < 0 ? 1 : 0)), bhi = 260;
    void blo; void bhi;
    for (let th = 100; th <= 260; th += 10) { const a = onHead(th, -0.46, 1.04); if (a.z > -0.02) strap.push(a); }
    const brim: V2[] = [];
    let brimZ = 0;
    for (let th = -96; th <= 96; th += 8) brim.push(onHead(th, -0.34, 1.05));
    for (let th = 96; th >= -96; th -= 8) {
      const c = Math.cos(rad(th));
      const ext2 = 1.05 + 0.48 * Math.pow(Math.max(0, c), 1.3);
      const a = onHead(th, -0.34 + 0.2 * Math.max(0, c), ext2);
      brim.push(a); brimZ += a.z;
    }
    const tealC = col(C.teal);
    const el = (
      <g key="visor">
        {anyVis && <path d={polyPath([...band, ...band2])} fill={tealC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />}
        <path d={smoothPath(brim, true, 0.3)} fill={tealC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />
      </g>
    );
    if (strap.length > 2) acc.push(<polyline key="vstrap" points={strap.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="none" stroke={tealC} strokeWidth={ink * 2.2} strokeLinecap="round" />);
    (anyVis || brimZ > 0 ? acc : accBack).push(el);
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
    for (let k = 0; k < 16; k++) {
      const a = bandPts[k], b = bandPts[k + 1];
      (a.z + b.z > 0.12 ? acc : accBack).push(<path key={`hsb${k}`} d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(b.x)} ${f2(b.y)}`} stroke={inkC} strokeWidth={ink * 1.1} strokeLinecap="round" />);
    }
    const cup = onHead(-92, 0.05, 1.08);
    const cupEl = <rect key="cup" x={cup.x - 7 * s} y={cup.y - 11 * s} width={14 * s} height={22 * s} rx={5 * s} fill={inkC} />;
    // the boom: a 3D curve held clear of the cheek (r ≥ 1.16 head radii), drawn segment by segment in front of or behind
    // the head by each segment's own depth, so it never crosses the face from the far side during a turn
    const boomAt = (u: number) => {
      const th = lerp(lerp(-92, -64, u), lerp(-64, -40, u), u), ey = lerp(lerp(0.05, 0.6, u), lerp(0.6, 0.62, u), u), rr = lerp(lerp(1.08, 1.24, u), lerp(1.24, 1.18, u), u);
      return onHead(th, ey, rr);
    };
    const N = 10;
    const bp = Array.from({length: N + 1}, (_, k) => boomAt(k / N));
    for (let k = 0; k < N; k++) {
      const a = bp[k], b = bp[k + 1], zm = (a.z + b.z) / 2;
      (zm > 0.02 ? acc : accBack).push(<path key={`boom${k}`} d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(b.x)} ${f2(b.y)}`} stroke={inkC} strokeWidth={ink} strokeLinecap="round" />);
    }
    const tip = bp[N];
    (tip.z > 0.02 ? acc : accBack).push(<circle key="micc" cx={tip.x} cy={tip.y} r={4.6 * s} fill={inkC} />);
    (cup.z > 0.02 ? acc : accBack).push(cupEl);
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
        {dl > 6 * s && <path d={`M ${pt({x: front.x + nx, y: front.y + ny})} L ${pt(tip)} L ${pt({x: front.x - nx, y: front.y - ny})} Z`} fill={col('#F7D9C4')} stroke={inkC} strokeWidth={ink * 0.75} />}
        <circle cx={back.x} cy={back.y} r={5 * s} fill={col(C.saffron)} stroke={inkC} strokeWidth={ink * 0.75} />
      </g>
    );
    (zc > -0.12 ? acc : accBack).push(el);
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
