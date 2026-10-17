// THE LAST CHOICE — articulated Crew rig.
//
// The approved cast (looks.ts) was drawn as a front-facing cutout (Character.tsx in the earlier episodes). This rig keeps
// the same proportions, colours, hair, outfits and accessories, and adds what an action film needs: turning (front,
// three-quarter, profile, back), knees and planted feet, bending at the waist, reaching in depth, lying down, and
// continuous injuries. It is a small 3D skeleton projected orthographically: x right, y down (screen), z toward the
// viewer. Flat shapes are then drawn on it in the series' vector language (4-unit ink at cast size, flat fills).
//
// Units are the original rig's: the character stands 440 tall at s = 1 (pelvis 165 above the ground).
import React from 'react';
import {C, BLOOD} from '../theme';
import {Look} from './looks';
import {
  V2, V3, add3, sub3, mul3, dot3, cross3, len3, norm3, rotAxis, rad, lerp, clamp, rnd, smoothPath, polyPath, pt, f2, noise,
} from '../kit/math';

// ------------------------------------------------------------------ dimensions (original rig units)
const HIP_H = 165, HIP_X = 33, THIGH = 78, SHIN = 77, ANKLE_H = 10, LEG_W = 38;
const SH_H = 127, SH_X = 66, UPPER = 84, FORE = 78, ARM_W = 30;
const NECK_H = 140, HEAD_UP = 67, HEAD_R = 58, HEAD_RY = 62;
// torso cross sections: height above the pelvis, half width, half depth
const TORSO: [number, number, number][] = [[-15, 66, 36], [25, 67, 37], [80, 72, 40], [SH_H, 76, 40]];

export type Mouth = 'smile' | 'grin' | 'flat' | 'o' | 'smirk' | 'frown' | 'hmm' | 'talk' | 'grit' | 'open' | 'pain' | 'sad' | 'pant' | 'soft';
export type Face = {brows?: number; worry?: number; mouth?: Mouth; open?: number; lids?: number; squint?: number; lookX?: number; lookY?: number; blink?: boolean; closed?: boolean};
export type ArmT = {hand?: V3 | V2; pole?: V3; fk?: {fwd: number; out: number; bend: number}; w?: number};
export type LegT = {foot?: V3 | V2; pole?: V3; fk?: {fwd: number; knee: number}; pitch?: number; w?: number};
export type HandShape = 'mitt' | 'fist' | 'open' | 'limp';
export type LimbId = 'armL0' | 'armL1' | 'armR0' | 'armR1' | 'legL0' | 'legL1' | 'legR0' | 'legR1';
export type Decal = {limb: LimbId; u: number; kind: 'tear' | 'blood' | 'bandage' | 'scrape' | 'dirt'; size?: number; seed?: number; amt?: number};
export type Stain = {phi: number; h: number; size: number; amt?: number; seed?: number; kind?: 'blood' | 'dirt' | 'tear'};
export type Damage = {
  browCut?: {side: 1 | -1; amt: number}; noseBleed?: number; lipCut?: number; bruise?: {side: 1 | -1; amt: number};
  dirt?: number; cracked?: boolean; stains?: Stain[]; decals?: Decal[]; handBlood?: {L?: number; R?: number};
  sling?: 'L' | 'R'; headBandage?: number; pale?: number;
};
export type ActorProps = {
  look: Look; t: number; seed?: number;
  x: number; y: number; z?: number; s?: number; yaw?: number;
  drop?: number; pelvisDx?: number; pelvisDz?: number;
  lean?: number; side?: number; twist?: number; roll?: number; rollPivot?: V2;
  head?: {yaw?: number; pitch?: number; roll?: number};
  face?: Face;
  armL?: ArmT; armR?: ArmT; legL?: LegT; legR?: LegT;
  handL?: HandShape; handR?: HandShape;
  propL?: React.ReactNode; propR?: React.ReactNode; propBehindL?: boolean; propBehindR?: boolean;
  dmg?: Damage; ink?: number; shadow?: boolean | number; breath?: number; life?: number;
  satchel?: {radio?: boolean; open?: boolean};
  visor?: boolean; // false = the visor is off (clerkA)
  silhouette?: string; rim?: string; opacity?: number;
  /** sorting overrides (relative to this actor's torso, ±50 ≈ behind/in front of the torso) for two-person contacts */
  zArm?: [number | undefined, number | undefined]; zHand?: [number | undefined, number | undefined];
};

// ------------------------------------------------------------------ solved skeleton
type Basis = {R: V3; U: V3; F: V3};
export type Rig = {
  P: V3; base: Basis; up: Basis; head: Basis; s: number; ink: number;
  hip: [V3, V3]; knee: [V3, V3]; ankle: [V3, V3]; sh: [V3, V3]; el: [V3, V3]; wr: [V3, V3];
  neck: V3; headC: V3; torsoZ: number; roll: number; pivot: V2;
};
const basisYaw = (yaw: number): Basis => {
  const a = rad(yaw);
  return {R: {x: -Math.cos(a), y: 0, z: Math.sin(a)}, U: {x: 0, y: -1, z: 0}, F: {x: Math.sin(a), y: 0, z: Math.cos(a)}};
};
const rotB = (b: Basis, axis: V3, ang: number): Basis => ({R: rotAxis(b.R, axis, ang), U: rotAxis(b.U, axis, ang), F: rotAxis(b.F, axis, ang)});
const at = (o: V3, b: Basis, r: number, u: number, f: number): V3 => ({
  x: o.x + b.R.x * r + b.U.x * u + b.F.x * f, y: o.y + b.R.y * r + b.U.y * u + b.F.y * f, z: o.z + b.R.z * r + b.U.z * u + b.F.z * f,
});
const to3 = (p: V3 | V2, z: number): V3 => ('z' in p ? (p as V3) : {x: p.x, y: p.y, z});

/** Two-bone IK. Returns the middle joint and the (possibly reach-clamped) end. */
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

export const solve = (p: ActorProps): Rig => {
  const s = p.s ?? 1;
  const z0 = p.z ?? 0;
  const base = basisYaw(p.yaw ?? 0);
  const P: V3 = {x: p.x + (p.pelvisDx ?? 0) * s, y: p.y - (HIP_H - (p.drop ?? 0)) * s, z: z0 + (p.pelvisDz ?? 0) * s};
  // upper body: twist about up, lean forward about the lateral axis, side-lean about forward
  let up = rotB(base, base.U, rad(p.twist ?? 0));
  up = rotB(up, up.R, rad(p.lean ?? 0)); // + = bend forward (toward the facing direction)
  up = rotB(up, up.F, rad(p.side ?? 0)); // + = toward the character's left (screen right in front view)
  const neck = at(P, up, 0, NECK_H * s, 0);
  const hy = p.head ?? {};
  let hb = rotB(up, up.U, rad(hy.yaw ?? 0));
  hb = rotB(hb, hb.R, rad(hy.pitch ?? 0)); // + = look down
  hb = rotB(hb, hb.F, rad(hy.roll ?? 0));
  const headC = at(neck, hb, 0, HEAD_UP * s, 0);
  // legs
  const hip: [V3, V3] = [at(P, base, -HIP_X * s, 0, 0), at(P, base, HIP_X * s, 0, 0)];
  const knee: V3[] = [], ankle: V3[] = [];
  ([p.legL, p.legR] as (LegT | undefined)[]).forEach((L, i) => {
    const sd = i === 0 ? -1 : 1;
    const H = hip[i];
    const restFoot: V3 = {x: H.x + base.R.x * sd * 4 * s, y: p.y - ANKLE_H * s, z: H.z + base.R.z * sd * 4 * s};
    let tgt = restFoot;
    if (L?.fk) {
      const d1 = norm3(add3(mul3(base.U, -Math.cos(rad(L.fk.fwd))), mul3(base.F, Math.sin(rad(L.fk.fwd)))));
      const kj = add3(H, mul3(d1, THIGH * s));
      const d2 = norm3(add3(mul3(base.U, -Math.cos(rad(L.fk.fwd - L.fk.knee))), mul3(base.F, Math.sin(rad(L.fk.fwd - L.fk.knee)))));
      tgt = add3(kj, mul3(d2, SHIN * s));
    }
    if (L?.foot) {
      const ft = to3(L.foot, H.z);
      tgt = L.w === undefined ? ft : {x: lerp(tgt.x, ft.x, L.w), y: lerp(tgt.y, ft.y, L.w), z: lerp(tgt.z, ft.z, L.w)};
    }
    const pole = L?.pole ?? add3(base.F, mul3(base.R, sd * 0.15));
    const r = ik2(H, tgt, THIGH * s, SHIN * s, pole);
    knee.push(r.mid); ankle.push(r.end);
  });
  // arms
  const sh: [V3, V3] = [at(P, up, -SH_X * s, SH_H * s, 0), at(P, up, SH_X * s, SH_H * s, 0)];
  const el: V3[] = [], wr: V3[] = [];
  const slingArm = (i: number): ArmT | undefined => {
    const sd = i === 0 ? -1 : 1;
    if (p.dmg?.sling !== (i === 0 ? 'L' : 'R')) return undefined;
    return {hand: at(P, up, -sd * 22 * s, 92 * s, 46 * s), pole: add3(mul3(up.U, -1), mul3(up.R, sd * 0.6))};
  };
  ([slingArm(0) ?? p.armL, slingArm(1) ?? p.armR] as (ArmT | undefined)[]).forEach((A, i) => {
    const sd = i === 0 ? -1 : 1;
    const S = sh[i];
    const fk = A?.fk ?? {fwd: 4, out: 8, bend: 14};
    const d1 = norm3(rotAxis(rotAxis(mul3(up.U, -1), up.F, rad(sd * fk.out) * (1)), up.R, -rad(fk.fwd)));
    // elbow flexion bends the forearm toward the front (and slightly in)
    const e = add3(S, mul3(d1, UPPER * s));
    let q = sub3(add3(up.F, mul3(up.R, -sd * 0.25)), mul3(d1, dot3(add3(up.F, mul3(up.R, -sd * 0.25)), d1)));
    if (len3(q) < 1e-4) q = up.U;
    q = norm3(q);
    const d2 = norm3(add3(mul3(d1, Math.cos(rad(fk.bend))), mul3(q, Math.sin(rad(fk.bend)))));
    let tgt = add3(e, mul3(d2, FORE * s));
    if (A?.hand) {
      const ht = to3(A.hand, S.z);
      const w = A.w ?? 1;
      tgt = {x: lerp(tgt.x, ht.x, w), y: lerp(tgt.y, ht.y, w), z: lerp(tgt.z, ht.z, w)};
    }
    const pole = A?.pole ?? add3(add3(mul3(up.U, -1), mul3(up.F, -0.55)), mul3(up.R, sd * 0.5));
    const r = ik2(S, tgt, UPPER * s, FORE * s, pole);
    el.push(r.mid); wr.push(r.end);
  });
  const torsoZ = at(P, up, 0, 70 * s, 0).z;
  const inkW = p.ink ?? 4 * s;
  return {P, base, up, head: hb, s, ink: inkW, hip, knee: knee as [V3, V3], ankle: ankle as [V3, V3], sh, el: el as [V3, V3], wr: wr as [V3, V3], neck, headC, torsoZ,
    roll: p.roll ?? 0, pivot: p.rollPivot ?? {x: P.x, y: P.y}};
};

/** Screen position of a world point after the actor's whole-body roll (use for props attached to the body). */
export const rolled = (r: Rig, q: V3 | V2): V2 => {
  if (!r.roll) return {x: q.x, y: q.y};
  const a = rad(r.roll), c = Math.cos(a), sn = Math.sin(a);
  const dx = q.x - r.pivot.x, dy = q.y - r.pivot.y;
  return {x: r.pivot.x + dx * c - dy * sn, y: r.pivot.y + dx * sn + dy * c};
};
/** Hand centre (world, before roll) for an arm side. */
export const handCenter = (r: Rig, i: 0 | 1): V3 => {
  const d = norm3(sub3(r.wr[i], r.el[i]));
  return add3(r.wr[i], mul3(d, 6 * r.s));
};

// ------------------------------------------------------------------ drawing helpers
type Part = {z: number; key: string; el: React.ReactElement};
const P2 = (q: V3): V2 => ({x: q.x, y: q.y});
const ang2 = (a: V3, b: V3) => Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);

const Limb: React.FC<{pts: V3[]; w: number; ink: number; colors: string[]; split?: number}> = ({pts, w, ink, colors}) => {
  // ink under-stroke then per-segment colour strokes (round caps: rounded joints like the original cutout)
  const all = pts.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ');
  return (
    <g>
      <polyline points={all} fill="none" stroke={C.ink} strokeWidth={w + ink * 2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.slice(0, -1).map((a, i) => (
        <line key={i} x1={a.x} y1={a.y} x2={pts[i + 1].x} y2={pts[i + 1].y} stroke={colors[Math.min(i, colors.length - 1)]} strokeWidth={w} strokeLinecap="round" />
      ))}
    </g>
  );
};

/** Irregular blob path (seeded) centred at 0,0 with radius r. */
export const blob = (r: number, seed: number, n = 9, rough = 0.32, sx = 1, sy = 1) => {
  const pts: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - rough / 2 + rough * rnd(seed * 31 + i * 7);
    pts.push({x: Math.cos(a) * r * k * sx, y: Math.sin(a) * r * k * sy});
  }
  return smoothPath(pts, true, 0.9);
};
/** Jagged tear patch path. */
const tearPath = (r: number, seed: number) => {
  const pts: V2[] = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = i % 2 ? 0.55 + 0.25 * rnd(seed + i) : 1 + 0.15 * rnd(seed * 3 + i);
    pts.push({x: Math.cos(a) * r * k, y: Math.sin(a) * r * k * 0.8});
  }
  return polyPath(pts);
};

const blinkAt = (t: number, seed: number) => {
  const period = 3.4 + rnd(seed) * 1.8;
  const ph = (t + rnd(seed * 7) * period) % period;
  if (ph < 0.06) return 1 - ph / 0.06;
  if (ph < 0.13) return (ph - 0.06) / 0.07;
  return 1;
};

// ------------------------------------------------------------------ hair geometry
// hairline height (relative to head centre, in units of the head radius; − = above) by azimuth |θ| (0 = face)
const HAIRLINE: Record<string, [number, number][]> = {
  // back of the head (|θ| > 90): hair reaches about the bottom of the ears, so back views read as hair, not a blank face
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
  const x = Math.abs(((((a + 180) % 360) + 360) % 360) - 180); // wrap: the visible arc can run past ±180
  for (let i = 1; i < tbl.length; i++) if (x <= tbl[i][0]) return lerp(tbl[i - 1][1], tbl[i][1], (x - tbl[i - 1][0]) / (tbl[i][0] - tbl[i - 1][0]));
  return tbl[tbl.length - 1][1];
};

// ------------------------------------------------------------------ the actor
export const actorParts = (p: ActorProps): {parts: Part[]; rig: Rig} => {
  const r = solve(p);
  const {s, ink, base, up, head: hb} = r;
  const look = p.look;
  const t = p.t;
  const seed = p.seed ?? 1;
  const dmg = p.dmg ?? {};
  const parts: Part[] = [];
  const sil = p.silhouette;
  const col = (c: string) => sil ?? c;
  const inkC = sil ?? C.ink;
  const add = (z: number, key: string, el: React.ReactElement) => parts.push({z, key, el});
  const sleeve = col(look.overlay ? look.overlayColor ?? look.shirt : look.shirt);
  const skin = col(look.skin);
  const breath = (p.breath ?? 0.15) * Math.sin(t * Math.PI * 2 * (0.32 + (p.breath ?? 0.15) * 0.5) + seed);

  // shadow
  if (p.shadow !== false) {
    const o = typeof p.shadow === 'number' ? p.shadow : 1;
    add(-1e6, 'shadow', <ellipse cx={p.x} cy={p.y + 2 * s} rx={92 * s} ry={14 * s} fill="rgba(10,10,14,0.28)" opacity={o} />);
  }

  // ---------------- legs
  const pantsC = col(look.pants), shoeC = col(look.shoes);
  [0, 1].forEach((i) => {
    const H = r.hip[i], K = r.knee[i], A = r.ankle[i];
    const legZ = (H.z + K.z + A.z) / 3;
    const pitch = ([p.legL, p.legR][i]?.pitch ?? 0);
    // shoe: ellipsoid (34 along forward, 26 across, 13 tall) — silhouette ellipse
    const F = base.F, R = base.R;
    const rx = Math.sqrt((34 * F.x) ** 2 + (26 * R.x) ** 2) * s;
    const cx = A.x + F.x * 12 * s, cy = A.y + 6 * s;
    const pr = pitch * Math.sign(F.x || 1) * Math.min(1, Math.abs(F.x) * 1.4);
    const decals = (dmg.decals ?? []).filter((d) => d.limb === (i === 0 ? 'legL0' : 'legR0') || d.limb === (i === 0 ? 'legL1' : 'legR1'));
    add(r.torsoZ - 60 + (legZ - r.torsoZ) * 0.3 + i * 0.01, `leg${i}`, (
      <g>
        <Limb pts={[H, K, A]} w={LEG_W * s} ink={ink} colors={[pantsC, pantsC]} />
        <g transform={`rotate(${f2(pr)} ${f2(A.x)} ${f2(A.y)})`}>
          <ellipse cx={cx} cy={cy} rx={Math.max(rx, 14 * s)} ry={13 * s} fill={shoeC} stroke={inkC} strokeWidth={ink} />
        </g>
        {decals.map((d, k) => <LimbDecal key={k} d={d} a={d.limb.endsWith('0') ? H : K} b={d.limb.endsWith('0') ? K : A} w={LEG_W * s} ink={ink} skin={skin} cloth={pantsC} />)}
      </g>
    ));
  });

  // ---------------- pelvis block (covers the leg tops)
  {
    const c = at(r.P, base, 0, 6 * s, 0);
    const hw = Math.sqrt((60 * base.R.x) ** 2 + (34 * base.F.x) ** 2) * s;
    add(r.torsoZ - 20, 'pelvis', <rect x={c.x - hw} y={c.y - 22 * s} width={hw * 2} height={40 * s} rx={18 * s} fill={pantsC} stroke={inkC} strokeWidth={ink} />);
  }

  // ---------------- torso silhouette from cross sections
  const view = {x: 0, y: 0, z: 1};
  const sp = sub3(at(r.P, up, 0, 1, 0), r.P); // spine direction (unit-ish)
  const u2 = norm3({x: sp.x, y: sp.y, z: 0});
  const n2 = {x: -u2.y, y: u2.x, z: 0}; // screen normal to the projected spine (points to screen-right when upright)
  const breathK = 1 + breath * 0.012;
  const ext = (a: number, b: number) => Math.sqrt((a * dot3(up.R, n2)) ** 2 + (b * dot3(up.F, n2)) ** 2) * s;
  const center = (h: number) => at(r.P, up, 0, h * s * (h > 60 ? breathK : 1), 0);
  const L: V2[] = [], Rr: V2[] = [];
  TORSO.forEach(([h, a, b]) => {
    const c = center(h); const e = ext(a, b) * (h > 60 ? 1 + breath * 0.008 : 1);
    L.push({x: c.x - n2.x * e, y: c.y - n2.y * e}); Rr.push({x: c.x + n2.x * e, y: c.y + n2.y * e});
  });
  const topC = center(149), cor = center(144);
  const eTop = ext(52, 30), eCor = ext(74, 38);
  const torsoPts: V2[] = [
    ...L, {x: cor.x - n2.x * eCor, y: cor.y - n2.y * eCor}, {x: topC.x - n2.x * eTop, y: topC.y - n2.y * eTop},
    {x: topC.x + n2.x * eTop, y: topC.y + n2.y * eTop}, {x: cor.x + n2.x * eCor, y: cor.y + n2.y * eCor}, ...[...Rr].reverse(),
  ];
  const bot = center(-27);
  torsoPts.push({x: bot.x, y: bot.y});
  const torsoD = smoothPath(torsoPts, true, 0.42);
  const clipId = `tc${seed}_${Math.round(p.x)}_${Math.round(p.y)}`.replace(/-/g, 'm');

  // surface mapping for front features: (phi, h) → screen + visibility
  const surf = (phi: number, h: number) => {
    let a = 72, b = 40;
    for (let i = 1; i < TORSO.length; i++) if (h <= TORSO[i][0]) { const k = (h - TORSO[i - 1][0]) / (TORSO[i][0] - TORSO[i - 1][0]); a = lerp(TORSO[i - 1][1], TORSO[i][1], k); b = lerp(TORSO[i - 1][2], TORSO[i][2], k); break; }
    if (h > SH_H) { a = lerp(76, 56, (h - SH_H) / 22); b = lerp(40, 32, (h - SH_H) / 22); }
    const ph = rad(phi);
    const q = at(center(h), up, a * Math.sin(ph) * s, 0, b * Math.cos(ph) * s);
    const nrm = add3(mul3(up.R, Math.sin(ph) / a), mul3(up.F, Math.cos(ph) / b));
    const vis = dot3(norm3(nrm), view);
    return {x: q.x, y: q.y, vis};
  };
  const fcol = look.overlay ? col(look.overlayColor ?? look.shirt) : col(look.shirt);
  const torsoFeatures: React.ReactElement[] = [];
  // garment opening (shirt shows between the panels)
  if (look.overlay) {
    const open = (h: number) => {
      if (look.overlay === 'vest') return h > 110 ? lerp(14, 26, (h - 110) / 37) : lerp(40, 14, (h - -12) / 122);
      if (look.overlay === 'jacket') return h > 70 ? lerp(0, 30, (h - 70) / 77) : 0.01;
      return lerp(10, 22, (h + 12) / 159);
    };
    const hs = [-12, 10, 35, 60, 85, 110, 128, 147];
    const toPhi = (w: number, h: number) => (Math.asin(clamp(w / (h > 120 ? 66 : 70), -1, 1)) * 180) / Math.PI;
    const left = hs.map((h) => surf(-toPhi(open(h), h), h)), right = hs.map((h) => surf(toPhi(open(h), h), h));
    const visible = [...left, ...right].some((q) => q.vis > 0.05);
    if (visible) {
      const poly = [...left, ...[...right].reverse()].map((q) => ({x: q.x, y: q.y}));
      const minVis = Math.min(...[...left, ...right].map((q) => q.vis));
      torsoFeatures.push(<path key="open" d={polyPath(poly)} fill={col(look.shirt)} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" opacity={minVis < 0 ? clamp(1 + minVis * 3) : 1} />);
    }
  }
  if (look.stripes) {
    for (let k = 0; k < 5; k++) {
      const h0 = 140 - k * 30, h1 = h0 - 14;
      const band: V2[] = [];
      for (let ph = -90; ph <= 90; ph += 15) band.push(surf(ph, h0));
      for (let ph = 90; ph >= -90; ph -= 15) band.push(surf(ph, h1));
      torsoFeatures.push(<path key={`st${k}`} d={polyPath(band)} fill={col(look.stripes)} />);
    }
  }
  if (look.accessories.includes('nametag')) {
    const c = surf(-30, 106);
    if (c.vis > 0.1) {
      const sx = clamp(c.vis * 1.1, 0.25, 1);
      torsoFeatures.push(
        <g key="tag" transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx * Math.sign(-base.R.x || 1) || 1)} 1)`}>
          <rect x={-20 * s} y={-11 * s} width={40 * s} height={22 * s} rx={4 * s} fill={col(C.white)} stroke={inkC} strokeWidth={ink * 0.75} />
          <rect x={-14 * s} y={-3 * s} width={28 * s} height={5 * s} rx={2 * s} fill={col(C.inkMuted)} />
        </g>,
      );
    }
  }
  // stains and tears on the torso
  (dmg.stains ?? []).forEach((st, k) => {
    const c = surf(st.phi, st.h);
    if (c.vis <= 0.02) return;
    const sx = clamp(c.vis, 0.2, 1);
    const sd = st.seed ?? k + 3;
    const amt = st.amt ?? 1;
    if (st.kind === 'tear') {
      torsoFeatures.push(
        <g key={`stn${k}`} transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`} opacity={amt}>
          <path d={tearPath(st.size * s, sd)} fill={skin} stroke={inkC} strokeWidth={ink * 0.6} strokeLinejoin="round" />
          <path d={`M ${-st.size * 0.4 * s} ${-2 * s} l ${st.size * 0.6 * s} ${4 * s}`} stroke={BLOOD.scrape} strokeWidth={2.4 * s} strokeLinecap="round" />
        </g>,
      );
      return;
    }
    const c1 = st.kind === 'dirt' ? 'rgba(60,45,40,0.35)' : BLOOD.main;
    torsoFeatures.push(
      <g key={`stn${k}`} transform={`translate(${f2(c.x)} ${f2(c.y)}) scale(${f2(sx)} 1)`} opacity={amt}>
        <path d={blob(st.size * s, sd, 10, 0.45)} fill={c1} />
        {st.kind !== 'dirt' && <path d={blob(st.size * 0.45 * s, sd + 9, 8, 0.4)} fill={BLOOD.dark} transform={`translate(${-st.size * 0.15 * s} ${st.size * 0.1 * s})`} />}
      </g>,
    );
  });
  // satchel strap (prop: the teammate's bag strap carries the radio)
  let satchelBag: React.ReactElement | null = null, bagZ = 0;
  if (look.accessories.includes('satchel')) {
    const strap: V2[] = [];
    for (let k = 0; k <= 12; k++) {
      const u = k / 12;
      const phi = lerp(62, -58, u), h = lerp(140, 2, u);
      const c = surf(phi, h);
      strap.push({x: c.x, y: c.y});
    }
    const front = surf(0, 70).vis > -0.2;
    if (front) torsoFeatures.push(<polyline key="strap" points={strap.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="none" stroke={inkC} strokeWidth={14 * s + ink * 2} strokeLinecap="round" strokeLinejoin="round" />,
      <polyline key="strap2" points={strap.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="none" stroke={col('#7A5233')} strokeWidth={14 * s} strokeLinecap="round" strokeLinejoin="round" />);
    // bag at the character's left hip
    const bc = at(r.P, base, -78 * s, -8 * s, 6 * s);
    bagZ = bc.z;
    const bw = Math.max(18, Math.sqrt((30 * base.F.x) ** 2 + (12 * base.R.x) ** 2) * 2) * s;
    const rad0 = p.satchel?.radio !== false;
    satchelBag = (
      <g>
        <rect x={bc.x - bw / 2} y={bc.y - 30 * s} width={bw} height={56 * s} rx={8 * s} fill={col('#8C6239')} stroke={inkC} strokeWidth={ink} />
        <rect x={bc.x - bw / 2} y={bc.y - 30 * s} width={bw} height={18 * s} rx={6 * s} fill={col('#6E4A2A')} stroke={inkC} strokeWidth={ink * 0.8} />
        {rad0 && <g transform={`translate(${f2(bc.x + (base.F.x >= 0 ? 1 : -1) * bw * 0.15)} ${f2(bc.y - 44 * s)})`}><RadioSmall s={s * 0.8} ink={ink} sil={sil} /></g>}
      </g>
    );
  }
  add(r.torsoZ, 'torso', (
    <g>
      <path d={torsoD} fill={fcol} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />
      <defs><clipPath id={clipId}><path d={torsoD} /></clipPath></defs>
      <g clipPath={`url(#${clipId})`}>{torsoFeatures}</g>
    </g>
  ));
  if (satchelBag) add(bagZ > r.torsoZ ? r.torsoZ + 30 : r.torsoZ - 30, 'bag', satchelBag);

  // ---------------- arms (with hands and props)
  const handShape = [p.handL ?? 'mitt', p.handR ?? 'mitt'];
  [0, 1].forEach((i) => {
    const S = r.sh[i], E = r.el[i], Wr = r.wr[i];
    const sd = i === 0 ? -1 : 1;
    const armZ = (S.z * 0.3 + E.z * 0.35 + Wr.z * 0.35);
    const front = armZ > r.torsoZ + 6 * s;
    const hc = handCenter(r, i as 0 | 1);
    const a = ang2(E, Wr);
    // thumb on the side facing forward / toward the body
    const fwd2 = {x: up.F.x, y: up.F.y};
    const perp = {x: -Math.sin(rad(a)), y: Math.cos(rad(a))};
    let thumbSide = Math.sign(perp.x * fwd2.x + perp.y * fwd2.y);
    if (Math.abs(perp.x * fwd2.x + perp.y * fwd2.y) < 0.25) thumbSide = Math.sign(perp.x * (r.P.x - hc.x) + perp.y * (r.P.y - hc.y)) || -sd;
    const hs = handShape[i];
    const hb = (dmg.handBlood ?? {})[i === 0 ? 'L' : 'R'] ?? 0;
    const prop = i === 0 ? p.propL : p.propR;
    const propBehind = i === 0 ? p.propBehindL : p.propBehindR;
    const sling = dmg.sling === (i === 0 ? 'L' : 'R');
    const decals = (dmg.decals ?? []).filter((d) => d.limb.startsWith(i === 0 ? 'armL' : 'armR'));
    const hand = (
      <g transform={`translate(${f2(hc.x)} ${f2(hc.y)}) rotate(${f2(a)})`}>
        {prop && propBehind ? <g>{prop}</g> : null}
        {hs === 'fist' ? (
          <g>
            <ellipse cx={0} cy={0} rx={18 * s} ry={17 * s} fill={skin} stroke={inkC} strokeWidth={ink} />
            <path d={`M ${-6 * s} ${thumbSide * 9 * s} q ${8 * s} ${thumbSide * 4 * s} ${14 * s} ${-thumbSide * 2 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.7} strokeLinecap="round" />
          </g>
        ) : hs === 'limp' ? (
          <g>
            <ellipse cx={4 * s} cy={0} rx={21 * s} ry={15 * s} fill={skin} stroke={inkC} strokeWidth={ink} />
            <ellipse cx={-4 * s} cy={thumbSide * 13 * s} rx={9 * s} ry={6 * s} fill={skin} stroke={inkC} strokeWidth={ink} transform={`rotate(${thumbSide * 18} ${-4 * s} ${thumbSide * 13 * s})`} />
          </g>
        ) : (
          <g>
            <ellipse cx={2 * s} cy={0} rx={20 * s} ry={18 * s} fill={skin} stroke={inkC} strokeWidth={ink} />
            <ellipse cx={-4 * s} cy={thumbSide * 14 * s} rx={10 * s} ry={8 * s} fill={skin} stroke={inkC} strokeWidth={ink} transform={`rotate(${thumbSide * 30} ${-4 * s} ${thumbSide * 14 * s})`} />
            <ellipse cx={-4 * s} cy={thumbSide * 14 * s} rx={8 * s} ry={6 * s} fill={skin} transform={`rotate(${thumbSide * 30} ${-4 * s} ${thumbSide * 14 * s})`} />
            {hs === 'open' && [-1, 0, 1].map((k) => <line key={k} x1={14 * s} y1={k * 7 * s} x2={20 * s} y2={k * 8 * s} stroke={inkC} strokeWidth={ink * 0.5} strokeLinecap="round" />)}
          </g>
        )}
        {hb > 0 && <path d={blob(9 * s, seed * 5 + i, 8, 0.5)} transform={`translate(${6 * s} ${-4 * s})`} fill={BLOOD.main} opacity={hb} />}
        {prop && !propBehind ? <g>{prop}</g> : null}
      </g>
    );
    const sl = sling ? (() => {
      const nk = at(r.neck, up, sd * -18 * s, -8 * s, 14 * s);
      const mid = {x: (E.x + Wr.x) / 2, y: (E.y + Wr.y) / 2};
      return <path d={`M ${pt(P2(nk))} L ${pt({x: E.x - 4 * s, y: E.y + 14 * s})} L ${pt({x: Wr.x + 6 * s, y: Wr.y + 16 * s})} Z`} fill={col('#F3F0E8')} stroke={inkC} strokeWidth={ink * 0.8} strokeLinejoin="round" opacity={0.96} key={`sl${mid.x}`} />;
    })() : null;
    const zA = p.zArm?.[i], zH = p.zHand?.[i];
    const armRank = zA !== undefined ? r.torsoZ + zA : front ? r.torsoZ + 40 + armZ * 1e-3 : r.torsoZ - 40 + armZ * 1e-3;
    add(armRank, `arm${i}`, (
      <g>
        <Limb pts={[S, E, Wr]} w={ARM_W * s} ink={ink} colors={[sleeve, skin]} />
        {front && zA === undefined && <circle cx={S.x} cy={S.y} r={ARM_W * 0.55 * s} fill={sleeve} />}
        {decals.map((d, k) => <LimbDecal key={k} d={d} a={d.limb.endsWith('0') ? S : E} b={d.limb.endsWith('0') ? E : Wr} w={ARM_W * s} ink={ink} skin={skin} cloth={d.limb.endsWith('0') ? sleeve : skin} />)}
        {zH === undefined && hand}
        {sl}
      </g>
    ));
    if (zH !== undefined) {
      // the forearm end continues into the separately sorted hand (no gap at the wrist)
      const w0 = {x: lerp(E.x, Wr.x, 0.72), y: lerp(E.y, Wr.y, 0.72), z: 0};
      add(r.torsoZ + zH, `hand${i}`, <g><Limb pts={[w0 as V3, Wr]} w={ARM_W * s} ink={ink} colors={[skin]} />{hand}</g>);
    }
  });

  // ---------------- neck and head
  const headParts = drawHead(p, r, t, seed, inkC, col, skin, dmg);
  add(r.torsoZ + 2, 'neck', (() => {
    const a = at(r.neck, up, 0, 2 * s, 0), b = at(r.headC, hb, 0, -40 * s, 0);
    return <Limb pts={[a, b]} w={32 * s} ink={ink} colors={[skin]} />;
  })());
  headParts.forEach((hp, k) => add(r.torsoZ + 5 + k * 0.01, `head${k}`, hp));

  // whole-body roll (lying down etc.)
  if (r.roll) {
    parts.forEach((q) => { q.el = <g transform={`rotate(${f2(r.roll)} ${f2(r.pivot.x)} ${f2(r.pivot.y)})`}>{q.el}</g>; });
  }
  // depth offset for the whole actor (for sorting against others)
  const zBase = (p.z ?? 0);
  parts.forEach((q) => { q.z = q.key === 'shadow' ? -1e6 + zBase : zBase * 1000 + (q.z - r.torsoZ); });
  return {parts, rig: r};
};

// ------------------------------------------------------------------ head
const drawHead = (p: ActorProps, r: Rig, t: number, seed: number, inkC: string, col: (c: string) => string, skin: string, dmg: Damage): React.ReactElement[] => {
  const {s, ink, head: hb} = r;
  const look = p.look;
  const Hc = r.headC;
  const R = HEAD_R * s, RY = HEAD_RY * s;
  const face = p.face ?? {};
  const out: React.ReactElement[] = [];
  // head-local direction for azimuth th (deg, + = toward the character's right) and elevation y (units of R, + = down)
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
  const rollDeg = Math.atan2(hb.U.x, -hb.U.y) * (180 / Math.PI); // head roll in screen
  /** Head-local Cartesian point: r = toward the character's right (units of R), u = up (units of RY), f = forward (units of R). */
  const hl3 = (r0: number, u0: number, f0: number) => {
    const q = {x: Hc.x + hb.R.x * r0 * R + hb.U.x * u0 * RY + hb.F.x * f0 * R, y: Hc.y + hb.R.y * r0 * R + hb.U.y * u0 * RY + hb.F.y * f0 * R};
    const z = hb.R.z * r0 + hb.F.z * f0; // depth relative to the head centre (units of R)
    return {x: q.x, y: q.y, z};
  };
  const hairC = col(look.hairColor);
  const hairType = look.hair;
  const vol = (VOLUME[hairType] ?? 10) * s;

  // ---- hair cap: the visible arc of the hairline, closed over the top by the hair-volume ellipse
  const hairBack: React.ReactElement[] = [];
  const hairFront: React.ReactElement[] = [];
  const hl = HAIRLINE[hairType] ?? HAIRLINE.crop;
  if (hairType !== 'bald') {
    // azimuth (head-local, + = character's right) that faces the viewer
    const thC = (Math.atan2(dot3(hb.R, {x: 0, y: 0, z: 1}), dot3(hb.F, {x: 0, y: 0, z: 1})) * 180) / Math.PI;
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
    // go from the right end over the top (-90°) to the left end
    const TAU = Math.PI * 2, top = -Math.PI / 2;
    const ccw = (((a1 - a2) % TAU) + TAU) % TAU;          // positive span from the right end to the left end
    const dTop = (((top - a2) % TAU) + TAU) % TAU;
    const span = dTop < ccw ? ccw : ccw - TAU;             // the way that passes over the top of the head
    const s2 = a2;
    const arc: V2[] = [];
    for (let k = 1; k < 24; k++) arc.push(fromE(s2 + (span * k) / 24));
    const d = smoothPath([...line, ...arc], true, 0.35);
    hairFront.push(<path key="cap" d={d} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
  }

  // ---- extra hair volumes (bun, curls, swoop, bob curtains, spikes)
  const extrasBack: React.ReactElement[] = [];
  const extrasFront: React.ReactElement[] = [];
  const blobAt = (key: string, r0: number, u0: number, f0: number, rad0: number) => {
    const q = hl3(r0, u0, f0);
    const el = <circle key={key} cx={q.x} cy={q.y} r={rad0 * s} fill={hairC} stroke={inkC} strokeWidth={ink} />;
    (q.z > 0.15 ? extrasFront : extrasBack).push(el);
    return q.z;
  };
  if (hairType === 'bun') blobAt('bun', 0, 1.24, -0.3, 21);
  if (hairType === 'curly') {
    const curls: [number, number, number, number][] = [
      [0, 1.1, -0.3, 24], [0.5, 0.98, -0.45, 22], [-0.5, 0.98, -0.45, 22], [0, 0.82, -0.8, 22], [0.82, 0.55, -0.6, 20], [-0.82, 0.55, -0.6, 20],
      [0.45, 0.3, -0.95, 20], [-0.45, 0.3, -0.95, 20], [0, 0.02, -1.05, 19], [0.95, -0.02, -0.45, 17], [-0.95, -0.02, -0.45, 17],
      [0.83, 0.84, 0.1, 20], [-0.83, 0.84, 0.1, 20], [1.07, 0.16, 0.05, 16], [-1.07, 0.16, 0.05, 16],
      [0.52, 1.02, 0.25, 24], [-0.52, 1.02, 0.25, 24], [0.17, 1.08, 0.3, 24], [-0.17, 1.08, 0.3, 24],
    ];
    // depth-sort the curls among themselves
    const order = curls.map((c, k) => ({c, k, z: hl3(c[0], c[1], c[2]).z})).sort((p0, p1) => p0.z - p1.z);
    order.forEach(({c, k}) => blobAt(`cu${k}`, c[0], c[1], c[2], c[3]));
  }
  if (hairType === 'spiky') {
    [-0.5, -0.25, 0, 0.25, 0.5].forEach((r0, k) => {
      const a = hl3(r0 - 0.2, 0.85, 0.2), b = hl3(r0, 1.45, 0.1), c = hl3(r0 + 0.2, 0.85, 0.2);
      const el = <path key={`sp${k}`} d={`M ${pt(a)} L ${pt(b)} L ${pt(c)} Z`} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />;
      (b.z > 0 ? extrasFront : extrasBack).push(el);
    });
  }
  if (hairType === 'swoop') {
    // the approved swoop: rises from the character's right temple over the top and sweeps down at the left side
    const loop: [number, number, number, number][] = [[1.07, 0.06, 0.0, -0.6], [1.05, 0.95, 0.12, -0.75], [0.17, 1.3, 0.22, -0.2], [-0.9, 1.42, 0.18, 0.35], [-1.14, 0.77, 0.12, 0.78], [-0.8, 0.95, 0.42, 0.55], [-0.34, 0.9, 0.6, 0.3], [0.3, 0.88, 0.58, 0.0], [0.85, 0.5, 0.35, -0.35]];
    // inflate in depth as the head turns so the fringe reads as a quiff in profile instead of collapsing edge-on
    const pk = Math.pow(Math.abs(dot3(hb.R, {x: 0, y: 0, z: 1})), 1.5);
    const q = loop.map(([r0, u0, f0, fo]) => hl3(r0 * (1 - 0.35 * pk), u0, f0 + fo * pk));
    const z = q.reduce((m, c) => m + c.z, 0) / q.length;
    (z > -0.25 ? extrasFront : extrasBack).push(<path key="swoop" d={smoothPath(q, true, 0.6)} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />);
  }
  if (hairType === 'bob') {
    // the approved bob: a mass larger than the skull (sides to the jaw, a band over the top), behind the face
    const c0 = hl3(0, 0, -0.08);
    const w = R + 10 * s, top = c0.y - RY - 18 * s, bot = c0.y + (hb.F.z < -0.3 ? 44 : 26) * s;
    const d = `M ${f2(c0.x - w)} ${f2(bot)} L ${f2(c0.x - w)} ${f2(c0.y - 10 * s)} Q ${f2(c0.x - w + 4 * s)} ${f2(top)} ${f2(c0.x)} ${f2(top)} Q ${f2(c0.x + w - 4 * s)} ${f2(top)} ${f2(c0.x + w)} ${f2(c0.y - 10 * s)} L ${f2(c0.x + w)} ${f2(bot)} Q ${f2(c0.x + w - 8 * s)} ${f2(bot + 4 * s)} ${f2(c0.x + w - 16 * s)} ${f2(bot)} L ${f2(c0.x - w + 16 * s)} ${f2(bot)} Q ${f2(c0.x - w + 8 * s)} ${f2(bot + 4 * s)} ${f2(c0.x - w)} ${f2(bot)} Z`;
    // seen from behind the mass is the nearest thing: draw it over the skull (else the bare skull reads as a blank face)
    (hb.F.z < -0.3 ? extrasFront : extrasBack).push(<path key="bobmass" d={d} fill={hairC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" transform={`rotate(${f2(rollDeg)} ${f2(Hc.x)} ${f2(Hc.y)})`} />);
  }

  // ---- ears
  const ears: React.ReactElement[] = [];
  const earsBack: React.ReactElement[] = [];
  [-1, 1].forEach((sd) => {
    const q = onHead(sd * 90, 0.1, 1.02);
    const vis = q.z;
    const rx = (4 + 5 * Math.abs(q.z < 0 ? 0.3 : 1 - Math.abs(dot3(hb.R, {x: 0, y: 0, z: 1})))) * s;
    const el = (
      <g key={`ear${sd}`}>
        <ellipse cx={q.x} cy={q.y} rx={Math.max(rx, 6 * s)} ry={12 * s} fill={skin} stroke={inkC} strokeWidth={ink} transform={`rotate(${f2(rollDeg)} ${f2(q.x)} ${f2(q.y)})`} />
        {look.accessories.includes('earring') && sd === -1 && <circle cx={q.x} cy={q.y + 14 * s} r={5 * s} fill={col(C.saffron)} stroke={inkC} strokeWidth={ink * 0.75} />}
      </g>
    );
    if (vis > -0.25) ears.push(el); else earsBack.push(el);
  });

  // ---- head skin
  const skull = <ellipse key="skull" cx={Hc.x} cy={Hc.y} rx={R} ry={RY} fill={skin} stroke={inkC} strokeWidth={ink} transform={`rotate(${f2(rollDeg)} ${f2(Hc.x)} ${f2(Hc.y)})`} />;

  // ---- facial features
  const feats: React.ReactElement[] = [];
  const blink = face.closed ? 0 : face.blink === false ? 1 : blinkAt(t, seed);
  const lids = clamp(face.lids ?? 0);
  const fold = (q: {z: number}) => clamp((q.z - 0.08) / 0.5, 0, 1); // fade features approaching the silhouette
  const eyeY = -0.1;
  const look2 = {x: face.lookX ?? 0, y: face.lookY ?? 0};
  [-1, 1].forEach((sd) => {
    // sd = +1: character's right eye (screen left in front view)
    const q = onHead(sd * 21, eyeY, 1);
    if (q.z <= 0.12) return;
    const sx = clamp(q.z * 1.05, 0.3, 1);
    const op = fold(q);
    const ry = Math.max(0.6, 13 * blink * (1 - lids * 0.75)) * s;
    const pupil = {x: look2.x * 5 * s, y: look2.y * 4 * s};
    const brows = face.brows ?? 0, worry = face.worry ?? 0;
    const bo = onHead(sd * 34, eyeY - 0.36 - brows * 0.09 + worry * 0.03, 1.0), bi = onHead(sd * 9, eyeY - 0.36 - brows * 0.09 - (brows * 0.05 + worry * 0.13), 1.0);
    feats.push(
      <g key={`eye${sd}`} transform={`translate(${f2(q.x)} ${f2(q.y)}) rotate(${f2(rollDeg)}) scale(${f2(sx)} 1)`} opacity={op}>
        <ellipse cx={0} cy={0} rx={12 * s} ry={ry} fill={col(C.white)} stroke={inkC} strokeWidth={ink * 0.75} />
        {blink * (1 - lids * 0.75) > 0.25 && !face.closed && <circle cx={pupil.x} cy={pupil.y + lids * 4 * s} r={5.5 * s} fill={inkC} />}
        {blink * (1 - lids * 0.75) > 0.25 && !face.closed && <circle cx={pupil.x + 2 * s} cy={pupil.y - 2 * s + lids * 4 * s} r={1.6 * s} fill={col(C.white)} />}
        {lids > 0.05 && blink > 0.25 && <path d={`M ${-12 * s} ${-ry * 0.2} Q 0 ${-ry * 1.25} ${12 * s} ${-ry * 0.2}`} fill="none" stroke={inkC} strokeWidth={ink * 0.7} strokeLinecap="round" />}
        {(face.closed || blink < 0.25) && <path d={`M ${-11 * s} ${0} Q 0 ${5 * s} ${11 * s} 0`} fill="none" stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" />}
        {(face.squint ?? 0) > 0.05 && <path d={`M ${-11 * s} ${10 * s} Q 0 ${(10 - 6 * (face.squint ?? 0)) * s} ${11 * s} ${10 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.6} strokeLinecap="round" />}
      </g>,
    );
    if (bo.z > 0 || bi.z > 0) feats.push(<line key={`brow${sd}`} x1={bo.x} y1={bo.y} x2={bi.z > -0.05 ? bi.x : bo.x} y2={bi.y} stroke={inkC} strokeWidth={ink + 1 * s} strokeLinecap="round" opacity={clamp(Math.max(bo.z, bi.z) * 3)} />);
  });
  // glasses
  const glasses = look.accessories.includes('glasses') ? 'rect' : look.accessories.includes('roundGlasses') ? 'round' : null;
  if (glasses) {
    const lens: {x: number; y: number; sx: number; z: number}[] = [];
    [-1, 1].forEach((sd) => { const q = onHead(sd * 21, eyeY, 1.02); lens.push({x: q.x, y: q.y, sx: clamp(q.z * 1.05, 0.25, 1), z: q.z}); });
    lens.forEach((l, k) => {
      if (l.z <= 0.12) return;
      feats.push(
        <g key={`gl${k}`} transform={`translate(${f2(l.x)} ${f2(l.y)}) rotate(${f2(rollDeg)}) scale(${f2(l.sx)} 1)`} opacity={fold(l)}>
          {glasses === 'rect' ? <rect x={-15 * s} y={-13 * s} width={30 * s} height={26 * s} rx={7 * s} fill="none" stroke={inkC} strokeWidth={ink * 0.9} /> : <circle cx={0} cy={0} r={17 * s} fill="none" stroke={inkC} strokeWidth={ink * 0.9} />}
          {dmg.cracked && k === 0 && <path d={`M ${-10 * s} ${-9 * s} L ${-2 * s} ${-1 * s} L ${-6 * s} ${7 * s} M ${-2 * s} ${-1 * s} L ${9 * s} ${-4 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.45} />}
        </g>,
      );
    });
    if (lens[0].z > 0.12 && lens[1].z > 0.12) {
      const m = onHead(0, eyeY - 0.05, 1.04);
      feats.push(<path key="bridge" d={`M ${pt({x: lerp(lens[0].x, m.x, 0.55), y: lerp(lens[0].y, m.y, 0.55)})} L ${pt({x: lerp(lens[1].x, m.x, 0.55), y: lerp(lens[1].y, m.y, 0.55)})}`} stroke={inkC} strokeWidth={ink * 0.8} />);
    }
    // temple arm toward the visible ear when turned
    [-1, 1].forEach((sd, k) => {
      const l = lens[k];
      const ear = onHead(sd * 88, eyeY, 1.02);
      if (l.z > 0.12 && ear.z > -0.1 && Math.abs(l.x - ear.x) > 14 * s) feats.push(<line key={`tm${sd}`} x1={l.x + Math.sign(ear.x - l.x) * 15 * s * l.sx} y1={l.y - 4 * s} x2={ear.x} y2={ear.y - 6 * s} stroke={inkC} strokeWidth={ink * 0.8} strokeLinecap="round" />);
    });
  }
  // nose
  {
    const q = onHead(0, 0.0, 1);
    const side = Math.sign(hb.F.x) || 1;
    const prof = Math.abs(hb.F.x);
    if (q.z > -0.15) {
      if (prof < 0.75) {
        feats.push(<path key="nose" d={`M ${pt({x: q.x + 2 * s, y: q.y + 2 * s})} q ${8 * s * side} ${14 * s} ${-2 * s * side} ${16 * s}`} fill="none" stroke={inkC} strokeWidth={ink * 0.75} strokeLinecap="round" opacity={fold(q) * 0.6 + 0.4} />);
      } else {
        const tip = {x: Hc.x + side * (R + 9 * s) * prof, y: Hc.y + 10 * s};
        feats.push(<path key="nose" d={`M ${pt({x: tip.x - side * 12 * s, y: tip.y - 12 * s})} Q ${pt({x: tip.x + side * 4 * s, y: tip.y - 2 * s})} ${pt(tip)} Q ${pt({x: tip.x - side * 2 * s, y: tip.y + 6 * s})} ${pt({x: tip.x - side * 11 * s, y: tip.y + 6 * s})}`} fill={skin} stroke={inkC} strokeWidth={ink * 0.75} strokeLinejoin="round" />);
      }
    }
  }
  // mouth
  {
    const q = onHead(0, 0.5, 1);
    if (q.z > -0.05) {
      const sx = clamp(q.z * 1.1, 0.35, 1);
      if (q.z < 0.35) { const side = Math.sign(q.x - Hc.x) || 1; q.x -= side * (0.35 - q.z) * 22 * s; }
      feats.push(<g key="mouth" transform={`translate(${f2(q.x)} ${f2(q.y)}) rotate(${f2(rollDeg)}) scale(${f2(sx)} 1)`} opacity={fold(q) * 0.5 + 0.5}><MouthShape m={face.mouth ?? 'flat'} s={s} ink={ink} inkC={inkC} open={face.open ?? 0} t={t} /></g>);
    }
  }
  // injuries on the face
  if (dmg.browCut && dmg.browCut.amt > 0) {
    const sd = dmg.browCut.side;
    const trail: V2[] = [];
    const pts3: {q: ReturnType<typeof onHead>; w: number}[] = [];
    for (let k = 0; k <= 7; k++) { const u = k / 7; pts3.push({q: onHead(sd * lerp(30, 58, u), lerp(-0.42, 0.45 * dmg.browCut.amt, u), 1.005), w: lerp(5.2, 1.8, u)}); }
    const visible = pts3.filter((a) => a.q.z > 0.05);
    if (visible.length > 2) {
      const L: V2[] = [], Rr: V2[] = [];
      for (let k = 0; k < visible.length; k++) {
        const a = visible[k].q, b = visible[Math.min(visible.length - 1, k + 1)].q, c0 = visible[Math.max(0, k - 1)].q;
        const dx = b.x - c0.x, dy = b.y - c0.y, l = Math.hypot(dx, dy) || 1;
        const w = visible[k].w * s * clamp(a.z * 1.2, 0.3, 1);
        L.push({x: a.x - (dy / l) * w, y: a.y + (dx / l) * w}); Rr.push({x: a.x + (dy / l) * w, y: a.y - (dx / l) * w});
      }
      trail.push(...L, ...Rr.reverse());
      feats.push(<path key="brow" d={smoothPath(trail, true, 0.6)} fill={BLOOD.main} opacity={0.95} />);
      const c0 = pts3[0].q;
      if (c0.z > 0.1) feats.push(<path key="cut" d={`M ${pt({x: c0.x - 8 * s, y: c0.y - 2 * s})} L ${pt({x: c0.x + 8 * s, y: c0.y + 2 * s})}`} stroke={BLOOD.dark} strokeWidth={3.5 * s} strokeLinecap="round" />);
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
  if (dmg.bruise && dmg.bruise.amt > 0) {
    const a = onHead(dmg.bruise.side * 42, 0.18, 1.0);
    if (a.z > 0.1) feats.push(<path key="bruise" d={blob(12 * s, 77, 9, 0.35, clamp(a.z, 0.3, 1), 0.8)} transform={`translate(${f2(a.x)} ${f2(a.y)})`} fill={BLOOD.bruise} opacity={0.42 * dmg.bruise.amt} />);
  }
  if ((dmg.dirt ?? 0) > 0) {
    [[-38, 0.3, 9], [30, -0.45, 7], [50, 0.42, 6]].forEach(([th, ey, r0], k) => {
      const a = onHead(th, ey, 1);
      if (a.z > 0.15) feats.push(<path key={`dirt${k}`} d={blob(r0 * s, 50 + k, 8, 0.5, clamp(a.z, 0.3, 1), 0.7)} transform={`translate(${f2(a.x)} ${f2(a.y)})`} fill="rgba(70,50,45,0.28)" opacity={dmg.dirt} />);
    });
  }
  if ((dmg.headBandage ?? 0) > 0) {
    const band: V2[] = [];
    for (let th = -100; th <= 100; th += 10) { const a = onHead(th, -0.5, 1.03); if (a.z > -0.05) band.push(a); }
    for (let th = 100; th >= -100; th -= 10) { const a = onHead(th, -0.25, 1.03); if (a.z > -0.05) band.push(a); }
    if (band.length > 4) feats.push(<path key="hband" d={polyPath(band)} fill={col('#F5F2EA')} stroke={inkC} strokeWidth={ink * 0.7} opacity={dmg.headBandage} />);
  }
  if ((dmg.pale ?? 0) > 0) feats.push(<ellipse key="pale" cx={Hc.x} cy={Hc.y} rx={R} ry={RY} fill="#E8E4DE" opacity={0.28 * (dmg.pale ?? 0)} />);

  // ---- accessories on the head
  const acc: React.ReactElement[] = [];
  const accBack: React.ReactElement[] = [];
  if (look.accessories.includes('visor') && p.visor !== false) {
    // band around the forehead + a brim sloping forward and down
    const band: V2[] = [], band2: V2[] = [];
    const visR = 1.04;
    let anyVis = false;
    const thV = (Math.atan2(dot3(hb.R, {x: 0, y: 0, z: 1}), dot3(hb.F, {x: 0, y: 0, z: 1})) * 180) / Math.PI;
    const lo = Math.max(-100, thV - 88), hi = Math.min(100, thV + 88);
    if (hi > lo) {
      for (let k = 0; k <= 16; k++) { const a = onHead(lerp(lo, hi, k / 16), -0.58, visR); band.push(a); if (a.z > 0) anyVis = true; }
      for (let k = 16; k >= 0; k--) { const a = onHead(lerp(lo, hi, k / 16), -0.32, visR); band2.push(a); }
    }
    const brim: V2[] = [];
    let brimZ = 0;
    for (let th = -96; th <= 96; th += 8) { const a = onHead(th, -0.34, 1.05); brim.push(a); }
    for (let th = 96; th >= -96; th -= 8) {
      const c = Math.cos(rad(th));
      const ext = 1.05 + 0.48 * Math.pow(Math.max(0, c), 1.3);
      const a = onHead(th, -0.34 + 0.2 * Math.max(0, c), ext);
      a.y += 10 * s * Math.abs(hb.F.x) * Math.max(0, c);
      brim.push(a); brimZ += a.z;
    }
    const tealC = col(C.teal);
    const front = anyVis || brimZ > 0;
    const el = (
      <g key="visor">
        {front && <path d={polyPath([...band, ...band2])} fill={tealC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />}
        <path d={smoothPath(brim, true, 0.3)} fill={tealC} stroke={inkC} strokeWidth={ink} strokeLinejoin="round" />
      </g>
    );
    (front ? acc : accBack).push(el);
  }
  if (look.accessories.includes('headset')) {
    const arc: V2[] = [];
    for (let k = 0; k <= 12; k++) { const e = lerp(-1, 1, k / 12); const th = e < 0 ? -90 : 90; arc.push(onHead(th, -Math.cos((e * Math.PI) / 2) * 0.98 - 0.05, 1.1)); }
    // band over the crown: from left ear up over the top to the right ear (plane through the ears)
    const bandPts: V2[] = [];
    for (let k = 0; k <= 16; k++) {
      const a = lerp(-Math.PI / 2, Math.PI / 2, k / 16); // −90 (left ear) .. +90 (right ear) over the top
      const v = add3(mul3(hb.R, Math.sin(a) * (R + 7 * s)), mul3(hb.U, Math.cos(a) * (RY + 7 * s)));
      bandPts.push({x: Hc.x + v.x, y: Hc.y + v.y + 4 * s});
    }
    acc.push(<polyline key="hsband" points={bandPts.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="none" stroke={inkC} strokeWidth={ink * 1.1} strokeLinecap="round" />);
    const cup = onHead(-92, 0.05, 1.08);
    const mic1 = onHead(-62, 0.62, 1.16), mic2 = onHead(-22, 0.66, 1.1);
    const cupEl = <rect key="cup" x={cup.x - 7 * s} y={cup.y - 11 * s} width={14 * s} height={22 * s} rx={5 * s} fill={inkC} />;
    const micEl = <path key="mic" d={`M ${pt(cup)} Q ${pt(mic1)} ${pt(mic2)}`} fill="none" stroke={inkC} strokeWidth={ink} strokeLinecap="round" />;
    if (cup.z > -0.3) { acc.push(cupEl); acc.push(micEl); } else { accBack.push(cupEl); if (mic2.z > 0) acc.push(micEl); else accBack.push(micEl); }
  }
  if (look.accessories.includes('pencil')) {
    const e = onHead(-80, -0.32, 1.06);
    if (e.z > -0.35) {
      const a = Math.atan2(hb.U.x, -hb.U.y) * (180 / Math.PI) - 70 * Math.sign(-hb.R.x || 1);
      acc.push(
        <g key="pencil" transform={`translate(${f2(e.x)} ${f2(e.y)}) rotate(${f2(a)})`}>
          <rect x={-5 * s} y={-30 * s} width={10 * s} height={60 * s} rx={2 * s} fill={col(C.saffron)} stroke={inkC} strokeWidth={ink * 0.75} />
          <path d={`M ${-5 * s} ${30 * s} L 0 ${40 * s} L ${5 * s} ${30 * s} Z`} fill={col('#F7D9C4')} stroke={inkC} strokeWidth={ink * 0.75} />
        </g>,
      );
    }
  }

  // assemble head layers (back to front)
  out.push(<g key="hb">{earsBack}{accBack}{extrasBack}{hairBack}</g>);
  out.push(skull);
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
    case 'open': { const o = 6 + 8 * open; return <path d={`M ${-14 * k} ${2 * k} Q 0 ${(2 - 4) * k} ${14 * k} ${2 * k} Q ${8 * k} ${(4 + o * 1.6) * k} 0 ${(4 + o * 1.7) * k} Q ${-8 * k} ${(4 + o * 1.6) * k} ${-14 * k} ${2 * k} Z`} fill={inkC} stroke={inkC} strokeWidth={ink * 0.6} strokeLinejoin="round" />; }
    case 'grit': return (<g><rect x={-15 * k} y={-3 * k} width={30 * k} height={12 * k} rx={5 * k} fill="#FFFFFF" stroke={inkC} strokeWidth={ink * 0.9} /><line x1={-13 * k} y1={3 * k} x2={13 * k} y2={3 * k} stroke={inkC} strokeWidth={ink * 0.5} /></g>);
    case 'pain': return (<g><path d={`M ${-16 * k} ${4 * k} L ${-8 * k} ${-2 * k} L 0 ${2 * k} L ${8 * k} ${-2 * k} L ${16 * k} ${4 * k} L ${8 * k} ${10 * k} L ${-8 * k} ${10 * k} Z`} fill="#FFFFFF" stroke={inkC} strokeWidth={ink * 0.9} strokeLinejoin="round" /><line x1={-12 * k} y1={4 * k} x2={12 * k} y2={4 * k} stroke={inkC} strokeWidth={ink * 0.5} /></g>);
    default: return null;
  }
};

const LimbDecal: React.FC<{d: Decal; a: V3; b: V3; w: number; ink: number; skin: string; cloth: string}> = ({d, a, b, w, ink, skin}) => {
  const x = lerp(a.x, b.x, d.u), y = lerp(a.y, b.y, d.u);
  const ang = ang2(a, b);
  const sz = (d.size ?? 1) * w * 0.42;
  const sd = d.seed ?? 5;
  const amt = d.amt ?? 1;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(ang)})`} opacity={amt}>
      {d.kind === 'tear' && (<g><path d={tearPath(sz, sd)} fill={skin} stroke={C.ink} strokeWidth={ink * 0.6} strokeLinejoin="round" /><path d={`M ${-sz * 0.5} ${-sz * 0.15} l ${sz * 0.9} ${sz * 0.25}`} stroke={BLOOD.scrape} strokeWidth={sz * 0.18} strokeLinecap="round" /></g>)}
      {d.kind === 'blood' && (<g><path d={blob(sz, sd, 9, 0.5, 1.3, 0.8)} fill={BLOOD.main} /><path d={blob(sz * 0.5, sd + 4, 8, 0.4)} fill={BLOOD.dark} /></g>)}
      {d.kind === 'scrape' && [-1, 0, 1].map((k) => <line key={k} x1={-sz * 0.6} y1={k * sz * 0.25} x2={sz * 0.5} y2={k * sz * 0.25 + sz * 0.1} stroke={BLOOD.scrape} strokeWidth={sz * 0.12} strokeLinecap="round" />)}
      {d.kind === 'dirt' && <path d={blob(sz, sd, 8, 0.5)} fill="rgba(60,45,40,0.3)" />}
      {d.kind === 'bandage' && (<g><rect x={-sz * 0.9} y={-w * 0.55} width={sz * 1.8} height={w * 1.1} rx={w * 0.2} fill="#F5F2EA" stroke={C.ink} strokeWidth={ink * 0.6} />{[-0.4, 0.2].map((k) => <line key={k} x1={sz * k * 2} y1={-w * 0.5} x2={sz * k * 2 + sz * 0.3} y2={w * 0.5} stroke="#D8D2C4" strokeWidth={ink * 0.5} />)}</g>)}
    </g>
  );
};

/** The battered portable radio (prop). Origin at its centre; ~46 units wide at s=1. */
export const RadioSmall: React.FC<{s: number; ink: number; sil?: string; on?: number}> = ({s, ink, sil, on = 0}) => {
  const c = (x: string) => sil ?? x;
  return (
    <g>
      <line x1={14 * s} y1={-14 * s} x2={30 * s} y2={-44 * s} stroke={c('#8A9096')} strokeWidth={2.5 * s} strokeLinecap="round" />
      <rect x={-24 * s} y={-15 * s} width={48 * s} height={30 * s} rx={6 * s} fill={c('#B5532F')} stroke={sil ?? C.ink} strokeWidth={ink * 0.8} />
      <circle cx={-10 * s} cy={1 * s} r={9 * s} fill={c('#E9DCC2')} stroke={sil ?? C.ink} strokeWidth={ink * 0.5} />
      {[-4, 0, 4].map((k) => <line key={k} x1={-17 * s} y1={(1 + k) * s} x2={-3 * s} y2={(1 + k) * s} stroke={c('#6E5E4A')} strokeWidth={1.2 * s} />)}
      <rect x={4 * s} y={-8 * s} width={15 * s} height={7 * s} rx={2 * s} fill={on > 0 ? c('#FFD98A') : c('#3A3330')} opacity={0.95} />
      <circle cx={12 * s} cy={7 * s} r={3.5 * s} fill={c('#2A2522')} />
      <path d={`M ${-24 * s} ${-6 * s} l ${6 * s} ${-3 * s} M ${18 * s} ${12 * s} l ${5 * s} ${2 * s}`} stroke={sil ?? C.ink} strokeWidth={1.4 * s} />
    </g>
  );
};

/** Draw a single actor (internally depth sorted). */
export const Actor: React.FC<ActorProps> = (p) => {
  const {parts} = actorParts(p);
  parts.sort((a, b) => a.z - b.z);
  return <g opacity={p.opacity}>{parts.map((q) => <g key={q.key}>{q.el}</g>)}</g>;
};

/** Several actors (and extra parts) sorted together so limbs can pass in front of and behind each other. */
export const Cast: React.FC<{actors: ActorProps[]; extra?: {z: number; el: React.ReactElement}[]}> = ({actors, extra = []}) => {
  const all: {z: number; key: string; el: React.ReactElement}[] = [];
  actors.forEach((a, i) => actorParts(a).parts.forEach((q) => all.push({...q, key: `${i}_${q.key}`})));
  extra.forEach((e, i) => all.push({z: e.z, key: `x${i}`, el: e.el}));
  all.sort((a, b) => a.z - b.z);
  return <g>{all.map((q) => <g key={q.key}>{q.el}</g>)}</g>;
};
void noise; void cross3;
