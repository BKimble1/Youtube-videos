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
import {V2, V3, add3, sub3, mul3, dot3, len3, norm3, rotAxis, rad, lerp, clamp, rnd, smoothPath, polyPath, pt, f2} from '../../kit/math';
import {handGlyph, HandShape} from './hands';
import {blobPath, tearPath, ellipsoid2, ang2} from './util';
import {mix} from '../engine/color';

// ------------------------------------------------------------------ dimensions (rig units at s = 1)
export const HIP_H = 165, HIP_X = 33, THIGH = 78, SHIN = 77, ANKLE_H = 10, LEG_W = 38;
export const SH_H = 127, SH_X = 66, UPPER = 84, FORE = 78, ARM_W = 30;
export const NECK_H = 140, HEAD_UP = 67, HEAD_R = 58, HEAD_RY = 62;
const TORSO: [number, number, number][] = [[-15, 66, 36], [25, 67, 37], [80, 72, 40], [SH_H, 76, 40]];

export type Mouth = 'smile' | 'grin' | 'flat' | 'o' | 'smirk' | 'frown' | 'hmm' | 'talk' | 'grit' | 'open' | 'pain' | 'sad' | 'pant' | 'soft' | 'breath';
export type Face = {
  brows?: number; worry?: number; mouth?: Mouth; open?: number;
  /** upper-lid closure 0 (open) … 1 (closed) — smooth, works at close-up scale */
  lid?: number; lids?: number; squint?: number; lookX?: number; lookY?: number;
  /** pupils lose focus (drift apart, dilate) 0 … 1 */
  unfocus?: number; blink?: boolean; closed?: boolean;
};
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
};
/** Scene light on the figure, already in the figure's screen frame (x right, y down, z toward the viewer). */
export type FigLight = {
  dir: V3; // toward the key light (low sun)
  key?: number; // 0..1 how strongly it shapes the figure (smoke dims it)
  shadowC?: string; rimC?: string; rim?: number;
  fire?: number; fireC?: string; fog?: number; fogC?: string;
};
export type Part = {z: number; key: string; el: React.ReactElement};
export type HandFrame = {pos: V3; dir: V2; ang: number; palmN: V3; thumb: number; pv: number; /** on-screen length factor (fingers toward/away from the camera) */ len: number};
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
  /** convert a body-local point to the drawn (view) frame */
  loc: (l: Loc) => V3;
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
    armRank: [0, 0], toolZ: 0,
    loc: (l: Loc) => pnt(fromPivot(l)),
  };
  out.armRank = [0, 1].map((i) => {
    const S = out.sh[i], E = out.el[i], Wr = out.wr[i];
    const armZ = S.z * 0.3 + E.z * 0.35 + Wr.z * 0.35;
    const zA = p.zArm?.[i];
    return zA !== undefined ? out.torsoZ + zA : armZ > out.torsoZ + 6 * s ? out.torsoZ + 40 + armZ * 1e-3 : out.torsoZ - 40 + armZ * 1e-3;
  }) as [number, number];
  out.toolZ = Math.max(out.armRank[0], out.armRank[1]) + 0.3;
  void torsoZ;
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
    return {pos, dir: {x: Math.cos(a2), y: Math.sin(a2)}, ang: (a2 * 180) / Math.PI, palmN: pn, thumb, pv: pn.z, len};
  }) as [HandFrame, HandFrame];
  return out;
};

// ------------------------------------------------------------------ hair geometry (R1 tables, kept)
const HAIRLINE: Record<string, [number, number][]> = {
  crop: [[0, -0.6], [55, -0.42], [90, -0.12], [125, 0.32], [180, 0.6]],
  bun: [[0, -0.55], [55, -0.38], [90, -0.12], [125, 0.32], [180, 0.6]],
  curly: [[0, -0.5], [55, -0.4], [90, -0.15], [125, 0.3], [180, 0.62]],
  swoop: [[0, -0.86], [55, -0.62], [90, -0.12], [125, 0.32], [180, 0.6]],
  bob: [[0, -0.98], [40, -0.92], [75, -0.55], [95, 0.42], [180, 0.78]],
  short: [[0, -0.62], [55, -0.45], [90, -0.15], [125, 0.28], [180, 0.55]],
  spiky: [[0, -0.6], [55, -0.42], [90, -0.12], [125, 0.32], [180, 0.6]],
  bald: [[0, -0.15], [80, -0.05], [100, 0.1], [180, 0.25]],
};
const VOLUME: Record<string, number> = {crop: 16, bun: 14, curly: 10, swoop: 8, bob: 16, short: 10, spiky: 10, bald: 0};
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
const celOver = (id: string, d: string, L: FigLight | undefined, size: number, s: number, shiftD?: string): React.ReactNode => {
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
        {shift > 0.5 && <path d={`${BIG} ${sd}`} transform={`translate(${f2(lx * shift)} ${f2(ly * shift)})`} fillRule="evenodd" fill={L.shadowC ?? '#2B3550'} opacity={0.34 * key} />}
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
  const dmg = p.dmg ?? {};
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
  const add = (z: number, key: string, el: React.ReactElement) => parts.push({z, key, el});
  const sleeveRaw = look.overlay ? look.overlayColor ?? look.shirt : look.shirt;
  const sleeve = col(sleeveRaw);
  const skin = col(look.skin);
  const breath = (p.breath ?? 0.15) * Math.sin(t * Math.PI * 2 * (0.32 + (p.breath ?? 0.15) * 0.5) + seed);
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
    const decals = (dmg.decals ?? []).filter((d) => d.limb === (i === 0 ? 'legL0' : 'legR0') || d.limb === (i === 0 ? 'legL1' : 'legR1'));
    const Hn = add3(H, mul3(norm3(sub3(H, K)), 10 * s));
    add(r.torsoZ - 60 + (legZ - r.torsoZ) * 0.3 + i * 0.01, `leg${i}`, (
      <g>
        <ellipse cx={sc.x} cy={sc.y} rx={Math.max(e.rx, 12 * s)} ry={Math.max(e.ry, 9 * s)} transform={`rotate(${f2(e.rot)} ${f2(sc.x)} ${f2(sc.y)})`} fill={shoeC} stroke={inkC} strokeWidth={ink} />
        <LimbG pts={[Hn, K, A]} w={[LEG_W * 1.05 * s, LEG_W * 0.95 * s, LEG_W * 0.8 * s]} ink={ink} inkC={inkC} colors={[pantsC, pantsC]} L={L} s={s} />
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
  [0, 1].forEach((i) => {
    const S = r.sh[i], E = r.el[i], Wr = r.wr[i];
    const armZ = S.z * 0.3 + E.z * 0.35 + Wr.z * 0.35;
    const front = armZ > r.torsoZ + 6 * s;
    const hf = r.hands[i];
    const hb = (dmg.handBlood ?? {})[i === 0 ? 'L' : 'R'] ?? 0;
    const decals = (dmg.decals ?? []).filter((d) => d.limb.startsWith(i === 0 ? 'armL' : 'armR'));
    // the sleeve starts inside the torso (square end): pull the start back toward the body along the upper arm
    const ua = norm3(sub3(E, S));
    const S0 = sub3(S, mul3(ua, 16 * s));
    const cuff = add3(S, mul3(ua, UPPER * s * 0.58));
    // forearm ends under the hand with a square end
    const W0 = add3(Wr, mul3(norm3(sub3(Wr, E)), 4 * s));
    const holdFn = i === 0 ? p.holdL : p.holdR;
    const hold = holdFn ? holdFn(hf, s, ink, col) : null;
    const [hBack, hFront] = handGlyph(hShape[i], {s, ink, skin, inkC, pv: hf.pv, thumb: hf.thumb, blood: hb, dirt: (dmg.dirt ?? 0) * 0.6, holding: hold});
    const handEl = (layer: React.ReactElement) => <g transform={`translate(${f2(hf.pos.x)} ${f2(hf.pos.y)}) rotate(${f2(hf.ang)})${hf.len < 0.995 ? ` scale(${f2(hf.len)} 1)` : ''}`}>{layer}</g>;
    const wearFn = i === 0 ? p.wearL : p.wearR;
    const dorsal = mul3(r.palm[i], -1);
    const wear = wearFn ? wearFn({E, W: Wr, dorsal, ang: ang2(E, Wr), len: len3(sub3(Wr, E))}, s, ink, col) : null;
    const armRank = r.armRank[i];
    void front;
    add(armRank, `arm${i}`, (
      <g>
        {wear && !wear.front && wear.el}
        <LimbG pts={[S0, E, W0]} w={[ARM_W * 1.08 * s, ARM_W * 0.86 * s, ARM_W * 0.74 * s]} ink={ink} inkC={inkC} colors={[skin, skin]} L={L} s={s} />
        {/* sleeve: shirt colour from inside the torso to the cuff (slightly flared), then a hem line */}
        <path d={quad(S0, cuff, ARM_W * 0.54 * s, ARM_W * 0.56 * s)} fill={sleeve} />
        {L && <path d={quad(S0, cuff, ARM_W * 0.2 * s, ARM_W * 0.2 * s, -(Math.sign((-ua.y) * L.dir.x + ua.x * L.dir.y) || 1) * ARM_W * 0.34 * s, -(Math.sign((-ua.y) * L.dir.x + ua.x * L.dir.y) || 1) * ARM_W * 0.36 * s)} fill={L.shadowC ?? '#2B3550'} opacity={0.3 * (L.key ?? 1) * clamp(0.6 - L.dir.z * 0.6)} />}
        {(() => {
          const n = {x: -ua.y, y: ua.x};
          const nl = Math.hypot(n.x, n.y) || 1;
          const hw = (ARM_W * s) / 2;
          return <line x1={cuff.x + (n.x / nl) * hw * 1.12} y1={cuff.y + (n.y / nl) * hw * 1.12} x2={cuff.x - (n.x / nl) * hw * 1.12} y2={cuff.y - (n.y / nl) * hw * 1.12} stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" />;
        })()}
        {decals.map((d, k) => <LimbDecal key={k} d={d} a={d.limb.endsWith('0') ? S : E} b={d.limb.endsWith('0') ? E : Wr} w={ARM_W * s} ink={ink} inkC={inkC} skin={skin} />)}
        {wear && wear.front && wear.el}
        {handEl(hBack)}
      </g>
    ));
    const zF = p.zHandFront?.[i];
    add(zF !== undefined ? r.torsoZ + zF : p.twoHanded ? r.toolZ + 0.3 : armRank + 0.5, `handf${i}`, handEl(hFront));
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
  const headParts = drawHead2(p, r, t, seed, inkC, col, skin, dmg, id, L);
  headParts.forEach((hp, k) => add(r.torsoZ + 5 + k * 0.01, `head${k}`, hp));

  if (p.extra) p.extra(r).forEach((q) => parts.push(q));

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
  if (hairType !== 'bald') {
    const rr = 1 + Math.min(vol, 6 * s) / R;
    const line: V2[] = [];
    for (let k = 0; k <= 36; k++) {
      const th = thC - 90 + (180 * k) / 36;
      const q = onHead(th, interpTbl(hl, th), rr);
      line.push({x: q.x, y: q.y});
    }
    const Ce = {x: Hc.x - hb.U.x * vol * 0.45, y: Hc.y - hb.U.y * vol * 0.45};
    const ax = R + vol * 0.3, ay = RY + vol * 0.6;
    const ro = rad(rollDeg);
    const toE = (q: V2) => { const dx = q.x - Ce.x, dy = q.y - Ce.y; const lx = dx * Math.cos(-ro) - dy * Math.sin(-ro), ly = dx * Math.sin(-ro) + dy * Math.cos(-ro); return Math.atan2(ly / ay, lx / ax); };
    const fromE = (a: number): V2 => { const lx = Math.cos(a) * ax, ly = Math.sin(a) * ay; return {x: Ce.x + lx * Math.cos(ro) - ly * Math.sin(ro), y: Ce.y + lx * Math.sin(ro) + ly * Math.cos(ro)}; };
    const a2 = toE(line[line.length - 1]), a1 = toE(line[0]);
    const TAU = Math.PI * 2, top = -Math.PI / 2;
    const ccw = (((a1 - a2) % TAU) + TAU) % TAU;
    const dTop = (((top - a2) % TAU) + TAU) % TAU;
    const span = dTop < ccw ? ccw : ccw - TAU;
    const arc: V2[] = [];
    for (let k = 1; k < 24; k++) arc.push(fromE(a2 + (span * k) / 24));
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
    curls.map((c, k) => ({c, k, z: hl3(c[0], c[1], c[2]).z})).sort((a, b) => a.z - b.z).forEach(({c, k}) => blobAt(`cu${k}`, c[0], c[1], c[2], c[3]));
  }
  if (hairType === 'spiky') {
    [-0.5, -0.25, 0, 0.25, 0.5].forEach((r0, k) => {
      const a = hl3(r0 - 0.2, 0.85, 0.2), b = hl3(r0, 1.45, 0.1), c = hl3(r0 + 0.2, 0.85, 0.2);
      // a second row behind so the crown reads in profile and from behind
      const a2 = hl3(r0 - 0.2, 0.8, -0.45), b2 = hl3(r0, 1.38, -0.5), c2 = hl3(r0 + 0.2, 0.8, -0.45);
      const el = <path key={`sp${k}`} d={`M ${pt(a)} L ${pt(b)} L ${pt(c)} Z`} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />;
      const el2 = <path key={`spb${k}`} d={`M ${pt(a2)} L ${pt(b2)} L ${pt(c2)} Z`} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />;
      (b.z > 0 ? extrasFront : extrasBack).push(el);
      (b2.z > 0 ? extrasFront : extrasBack).push(el2);
    });
  }
  if (hairType === 'swoop') {
    const loop: [number, number, number, number][] = [[1.07, 0.06, 0.0, -0.6], [1.05, 0.95, 0.12, -0.75], [0.17, 1.3, 0.22, -0.2], [-0.9, 1.42, 0.18, 0.35], [-1.14, 0.77, 0.12, 0.78], [-0.8, 0.95, 0.42, 0.55], [-0.34, 0.9, 0.6, 0.3], [0.3, 0.88, 0.58, 0.0], [0.85, 0.5, 0.35, -0.35]];
    const pk = Math.pow(Math.abs(dot3(hb.R, zv)), 1.5);
    const q = loop.map(([r0, u0, f0, fo]) => hl3(r0 * (1 - 0.35 * pk), u0, f0 + fo * pk));
    const z = q.reduce((m, c) => m + c.z, 0) / q.length;
    (z > -0.25 ? extrasFront : extrasBack).push(<path key="swoop" d={smoothPath(q, true, 0.6)} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
  }
  if (hairType === 'bob') {
    // the bob mass as head-local geometry (sides to the jaw, crown band, back), so it turns with the head
    const ring: V2[] = [];
    for (let k = 0; k <= 24; k++) {
      const a = -100 + (200 * k) / 24; // around the back and sides
      const th = 180 + a;
      const u0 = Math.cos(rad(a)) > 0.4 ? -0.55 : -0.52;
      void u0;
      ring.push(onHead(th, 0.55, 1.18));
    }
    const top: V2[] = [];
    for (let k = 0; k <= 24; k++) top.push(onHead(180 + 100 - (200 * k) / 24, -0.75, 1.2));
    const d = smoothPath([...ring, ...top], true, 0.3);
    const behind = dot3(hb.F, zv) > -0.3;
    (behind ? extrasBack : extrasFront).push(<path key="bobmass" d={d} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
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
  const lid = clamp(Math.max(face.lid ?? 0, blinkC, face.closed ? 1 : 0));
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
    const lidY = lerp(-ry * 1.15, ry * 1.02, clamp(Math.max(lid, lids * 0.45)));
    const drift = unf * sd * 1.8;
    const pupil = {x: (look2.x + drift * 0.5) * 5 * s, y: (look2.y + unf * 0.4) * 4 * s};
    const pr = (5.5 + unf * 1.2) * s;
    const brows = face.brows ?? 0, worry = face.worry ?? 0;
    const bo = onHead(sd * 34, eyeY - 0.36 - brows * 0.09 + worry * 0.03, 1.0), bi = onHead(sd * 9, eyeY - 0.36 - brows * 0.09 - (brows * 0.05 + worry * 0.13), 1.0);
    const cid = `${id}e${sd > 0 ? 'r' : 'l'}`;
    feats.push(
      <g key={`eye${sd}`} transform={`translate(${f2(q.x)} ${f2(q.y)}) rotate(${f2(rollDeg)}) scale(${f2(sx)} 1)`} opacity={op}>
        <defs><clipPath id={cid}><ellipse cx={0} cy={0} rx={12 * s} ry={ry} /></clipPath></defs>
        <ellipse cx={0} cy={0} rx={12 * s} ry={ry} fill={col(C.white)} />
        <g clipPath={`url(#${cid})`}>
          <circle cx={pupil.x} cy={pupil.y} r={pr} fill={inkC} />
          <circle cx={pupil.x + 2 * s} cy={pupil.y - 2 * s} r={1.6 * s} fill={col(C.white)} opacity={1 - unf * 0.7} />
          {/* the upper lid: skin coming down from above */}
          <rect x={-14 * s} y={-ry * 2.2} width={28 * s} height={Math.max(0, lidY + ry * 2.2)} fill={skin} />
          {(face.squint ?? 0) > 0.05 && <rect x={-14 * s} y={ry * (1 - 0.6 * (face.squint ?? 0))} width={28 * s} height={ry} fill={skin} />}
        </g>
        <ellipse cx={0} cy={0} rx={12 * s} ry={ry} fill="none" stroke={inkC} strokeWidth={ink * 0.75} opacity={lid > 0.92 ? 0 : 1} />
        {/* lid line (lash line) follows the lid; closed = a soft downward curve */}
        {lid > 0.92 ? <path d={`M ${-12 * s} ${1 * s} Q 0 ${7 * s} ${12 * s} ${1 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.85} strokeLinecap="round" />
          : lid > 0.08 || lids > 0.1 ? <path d={`M ${-12.5 * s} ${f2(Math.min(lidY + 3 * s, 0))} Q 0 ${f2(lidY - 2 * s)} ${12.5 * s} ${f2(Math.min(lidY + 3 * s, 0))}`} fill="none" stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" /> : null}
      </g>,
    );
    if (bo.z > 0 || bi.z > 0) feats.push(<line key={`brow${sd}`} x1={bo.x} y1={bo.y} x2={bi.z > -0.05 ? bi.x : bo.x} y2={bi.y} stroke={inkC} strokeWidth={ink + 1 * s} strokeLinecap="round" opacity={clamp(Math.max(bo.z, bi.z) * 3)} />);
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
    else if (prof >= 0.85) {
      const tip = hl3(0, 0.12, 1.08);
      feats.push(<path key="nostril" d={`M ${f2(tip.x - side * 7 * s)} ${f2(tip.y)} q ${f2(side * 3 * s)} ${f2(4 * s)} ${f2(-side * 2 * s)} ${f2(6 * s)}`} fill="none" stroke={inkC} strokeWidth={ink * 0.6} strokeLinecap="round" />);
    }
  }
  {
    const q = onHead(0, 0.5, 1);
    if (q.z > -0.05) {
      const sx = clamp(q.z * 1.1, 0.35, 1);
      if (q.z < 0.35) { const side = Math.sign(q.x - Hc.x) || 1; q.x -= side * (0.35 - q.z) * 22 * s; }
      feats.push(<g key="mouth" transform={`translate(${f2(q.x)} ${f2(q.y)}) rotate(${f2(rollDeg)}) scale(${f2(sx)} 1)`} opacity={fold(q) * 0.5 + 0.5}><MouthShape m={face.mouth ?? 'flat'} s={s} ink={ink} inkC={inkC} open={face.open ?? 0} t={t} /></g>);
    }
  }
  if (look.cheeks) [-1, 1].forEach((sd) => { const q = onHead(sd * 40, 0.25, 1); if (q.z > 0.2) feats.push(<ellipse key={`ch${sd}`} cx={q.x} cy={q.y} rx={9 * s * clamp(q.z, 0.3, 1)} ry={7 * s} fill="#F28B82" opacity={0.7} />); });
  if (look.accessories.includes('beard')) {
    // a full beard around the jaw (head-local), with the mouth showing
    const pts: V2[] = [];
    for (let th = -100; th <= 100; th += 10) { const q = onHead(th, th === -100 || th === 100 ? 0.05 : 0.3 + 0.38 * Math.cos(rad(th)) ** 2, 1.04); pts.push(q); }
    for (let th = 100; th >= -100; th -= 10) { const q = onHead(th, 0.2 + 0.2 * Math.cos(rad(th)), 1.0); pts.push({x: q.x, y: q.y}); }
    const vis = onHead(0, 0.6, 1).z;
    if (vis > -0.4) feats.unshift(<path key="beard" d={smoothPath(pts, true, 0.4)} fill={col(look.hairColor)} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
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
    const a = onHead(-12, 0.58, 1.01);
    if (a.z > 0.2) feats.push(<circle key="lip" cx={a.x} cy={a.y} r={3.2 * s} fill={BLOOD.main} opacity={dmg.lipCut} />);
  }
  if ((dmg.mouthBlood ?? 0) > 0) {
    const a = onHead(-17, 0.56, 1.01), b = onHead(-20, 0.78, 1.01);
    if (a.z > 0.2) feats.push(<path key="mb" d={`M ${pt(a)} Q ${pt({x: a.x - 2 * s, y: (a.y + b.y) / 2})} ${pt(b)}`} stroke={BLOOD.main} strokeWidth={4 * s} strokeLinecap="round" fill="none" opacity={dmg.mouthBlood} />);
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
    const bandPts: V2[] = [];
    for (let k = 0; k <= 16; k++) {
      const a = lerp(-Math.PI / 2, Math.PI / 2, k / 16);
      const v = add3(mul3(hb.R, Math.sin(a) * (R + 7 * s)), mul3(hb.U, Math.cos(a) * (RY + 7 * s)));
      bandPts.push({x: Hc.x + v.x, y: Hc.y + v.y + 4 * s});
    }
    acc.push(<polyline key="hsband" points={bandPts.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="none" stroke={inkC} strokeWidth={ink * 1.1} strokeLinecap="round" />);
    const cup = onHead(-92, 0.05, 1.08);
    const mic1 = onHead(-62, 0.62, 1.16), mic2 = onHead(-22, 0.66, 1.1);
    const cupEl = <rect key="cup" x={cup.x - 7 * s} y={cup.y - 11 * s} width={14 * s} height={22 * s} rx={5 * s} fill={inkC} />;
    const micEl = <path key="mic" d={`M ${pt(cup)} Q ${pt(mic1)} ${pt(mic2)}`} fill="none" stroke={inkC} strokeWidth={ink} strokeLinecap="round" />;
    if (cup.z > -0.3) { acc.push(cupEl); acc.push(micEl); } else { accBack.push(cupEl); (mic2.z > 0 ? acc : accBack).push(micEl); }
  }
  if (look.accessories.includes('pencil')) {
    const e = onHead(-80, -0.32, 1.06);
    if (e.z > -0.35) {
      const a = rollDeg - 70 * Math.sign(-hb.R.x || 1);
      acc.push(
        <g key="pencil" transform={`translate(${f2(e.x)} ${f2(e.y)}) rotate(${f2(a)})`}>
          <rect x={-5 * s} y={-30 * s} width={10 * s} height={60 * s} rx={2 * s} fill={col(C.saffron)} stroke={inkC} strokeWidth={ink * 0.75} />
          <path d={`M ${-5 * s} ${30 * s} L 0 ${40 * s} L ${5 * s} ${30 * s} Z`} fill={col('#F7D9C4')} stroke={inkC} strokeWidth={ink * 0.75} />
        </g>,
      );
    }
  }
  if ((dmg.pale ?? 0) > 0) feats.push(<path key="pale" d={unionD} fill="#E8E4DE" opacity={0.22 * (dmg.pale ?? 0)} />);

  // ---- assemble: back things, skull union (ink, fill), shading, ears, hair cap, features, front extras, accessories
  out.push(<g key="hb">{earsBack}{accBack}{extrasBack}</g>);
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

const MouthShape: React.FC<{m: Mouth; s: number; ink: number; inkC: string; open: number; t: number}> = ({m, s, ink, inkC, open, t}) => {
  const st = {fill: 'none', stroke: inkC, strokeWidth: ink, strokeLinecap: 'round' as const};
  const k = s;
  switch (m) {
    case 'smile': return <path d={`M ${-16 * k} 0 Q 0 ${14 * k} ${16 * k} 0`} {...st} />;
    case 'soft': return <path d={`M ${-12 * k} ${2 * k} Q 0 ${8 * k} ${12 * k} ${2 * k}`} {...st} />;
    case 'grin': return (<g><path d={`M ${-22 * k} ${-2 * k} Q 0 ${30 * k} ${22 * k} ${-2 * k} Z`} fill={inkC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" /><path d={`M ${-16 * k} ${1 * k} Q 0 ${9 * k} ${16 * k} ${1 * k} L ${16 * k} ${5 * k} Q 0 ${12 * k} ${-16 * k} ${5 * k} Z`} fill="#FFFFFF" /></g>);
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
    case 'grit': return (<g><rect x={-15 * k} y={-3 * k} width={30 * k} height={12 * k} rx={5 * k} fill="#FFFFFF" stroke={inkC} strokeWidth={ink * 0.9} /><line x1={-13 * k} y1={3 * k} x2={13 * k} y2={3 * k} stroke={inkC} strokeWidth={ink * 0.5} /></g>);
    case 'pain': return (<g><path d={`M ${-16 * k} ${4 * k} L ${-8 * k} ${-2 * k} L 0 ${2 * k} L ${8 * k} ${-2 * k} L ${16 * k} ${4 * k} L ${8 * k} ${10 * k} L ${-8 * k} ${10 * k} Z`} fill="#FFFFFF" stroke={inkC} strokeWidth={ink * 0.9} strokeLinejoin="round" /><line x1={-12 * k} y1={4 * k} x2={12 * k} y2={4 * k} stroke={inkC} strokeWidth={ink * 0.5} /></g>);
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
