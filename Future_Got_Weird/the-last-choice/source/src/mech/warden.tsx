// Warden: the coordination system's tall biped security unit (~560 units at s = 1). Pale armour plates over a dark
// slate frame, a smooth helmet with a visor band carrying the SensorEye. Same projected-3D conventions as the cast rig
// (x right, y down, z toward the viewer; yaw 0 = facing the viewer, +90 = facing screen right). Anchor: the ground
// point under the pelvis (x, y). Destruction: `tear` peels plates away to a mechanical interior, `armOff` detaches a
// forearm, `leak` sprays dark hydraulic fluid, `fall` rotates the whole unit about a pivot.
import React from 'react';
import {SYS} from '../theme';
import {V2, V3, add3, sub3, mul3, dot3, norm3, rotAxis, rad, lerp, clamp, rnd, f2, pt, smoothPath, polyPath} from '../kit/math';
import {ik2} from '../rig/actor';
import {gait} from '../rig/gait';
import {INK, M, SensorEye, Sparks, Crackle, Fluid, capsule, rrect, jag, SysMark} from './common';

const HH = 285, HX = 34, THIGH = 128, SHIN = 130, ANK = 26;
const SH_H = 150, SH_X = 64, UP = 112, FORE = 108, NECK_H = 186, HEAD_UP = 48, HR = 46;

type Limb3 = {hand?: V2 | V3; pole?: V3; fk?: {fwd: number; out: number; bend: number}};
type Leg3 = {foot?: V2 | V3; pole?: V3; pitch?: number};
export type WardenProps = {
  x: number; y: number; z?: number; s?: number; t: number; seed?: number; ink?: number;
  yaw?: number; lean?: number; side?: number; drop?: number; twist?: number;
  headYaw?: number; headPitch?: number; look?: V2; lock?: number; eyeOpen?: number; glow?: number;
  armL?: Limb3; armR?: Limb3; legL?: Leg3; legR?: Leg3;
  beam?: {amt: number; side: 'L' | 'R'; dir: number; len?: number};
  tear?: number; armOff?: {side: 'L' | 'R'; dx: number; dy: number; rot: number};
  leak?: {t0: number; amt: number; groundY?: number};
  sparks?: {t0: number; where: WJoint}[];
  fall?: {ang: number; px: number; py: number};
  crackle?: number;
};
export type WJoint = 'elbowL' | 'elbowR' | 'wristL' | 'wristR' | 'chest' | 'head' | 'kneeL' | 'kneeR' | 'pelvis' | 'shoulderL' | 'shoulderR';

type Basis = {R: V3; U: V3; F: V3};
const basisYaw = (yaw: number): Basis => {
  const a = rad(yaw);
  return {R: {x: -Math.cos(a), y: 0, z: Math.sin(a)}, U: {x: 0, y: -1, z: 0}, F: {x: Math.sin(a), y: 0, z: Math.cos(a)}};
};
const rotB = (b: Basis, k: V3, a: number): Basis => ({R: rotAxis(b.R, k, a), U: rotAxis(b.U, k, a), F: rotAxis(b.F, k, a)});
const at = (o: V3, b: Basis, r: number, u: number, f: number): V3 => ({
  x: o.x + b.R.x * r + b.U.x * u + b.F.x * f, y: o.y + b.R.y * r + b.U.y * u + b.F.y * f, z: o.z + b.R.z * r + b.U.z * u + b.F.z * f,
});
const to3 = (p: V2 | V3, z: number): V3 => ('z' in p ? (p as V3) : {x: p.x, y: p.y, z});

export type WardenRig = {
  s: number; P: V3; base: Basis; up: Basis; head: Basis; headC: V3; neck: V3;
  hip: V3[]; knee: V3[]; ankle: V3[]; sh: V3[]; el: V3[]; wr: V3[]; hand: V3[]; torsoZ: number;
};

/** Solve the warden's joints (world, before `fall`). */
export const solveWarden = (p: WardenProps): WardenRig => {
  const s = p.s ?? 1;
  const base = basisYaw(p.yaw ?? 0);
  const P: V3 = {x: p.x, y: p.y - (HH - (p.drop ?? 0)) * s, z: p.z ?? 0};
  let up = rotB(base, base.U, rad(p.twist ?? 0));
  up = rotB(up, up.R, rad(p.lean ?? 0));
  up = rotB(up, up.F, rad(p.side ?? 0));
  const neck = at(P, up, 0, NECK_H * s, 0);
  let hb = rotB(up, up.U, rad(p.headYaw ?? 0));
  hb = rotB(hb, hb.R, rad(p.headPitch ?? 0));
  const headC = at(neck, hb, 0, HEAD_UP * s, 0);
  const hip = [at(P, base, -HX * s, 0, 0), at(P, base, HX * s, 0, 0)];
  const knee: V3[] = [], ankle: V3[] = [];
  [p.legL, p.legR].forEach((L, i) => {
    const sd = i === 0 ? -1 : 1;
    const H = hip[i];
    const rest = {x: H.x + base.R.x * sd * 6 * s, y: p.y - ANK * s, z: H.z + base.R.z * sd * 6 * s};
    const tgt = L?.foot ? to3(L.foot, H.z) : rest;
    const r = ik2(H, tgt, THIGH * s, SHIN * s, L?.pole ?? add3(base.F, mul3(base.R, sd * 0.1)));
    knee.push(r.mid); ankle.push(r.end);
  });
  const sh = [at(P, up, -SH_X * s, SH_H * s, 0), at(P, up, SH_X * s, SH_H * s, 0)];
  const el: V3[] = [], wr: V3[] = [], hand: V3[] = [];
  [p.armL, p.armR].forEach((A, i) => {
    const sd = i === 0 ? -1 : 1;
    const S = sh[i];
    const fk = A?.fk ?? {fwd: 6, out: 10, bend: 18};
    const d1 = norm3(rotAxis(rotAxis(mul3(up.U, -1), up.F, rad(sd * fk.out)), up.R, -rad(fk.fwd)));
    const e = add3(S, mul3(d1, UP * s));
    let q = sub3(up.F, mul3(d1, dot3(up.F, d1)));
    if (Math.hypot(q.x, q.y, q.z) < 1e-4) q = up.U;
    q = norm3(q);
    const d2 = norm3(add3(mul3(d1, Math.cos(rad(fk.bend))), mul3(q, Math.sin(rad(fk.bend)))));
    const tgt = A?.hand ? to3(A.hand, S.z) : add3(e, mul3(d2, FORE * s));
    const r = ik2(S, tgt, UP * s, FORE * s, A?.pole ?? add3(add3(mul3(up.U, -1), mul3(up.F, -0.6)), mul3(up.R, sd * 0.5)));
    el.push(r.mid); wr.push(r.end);
    hand.push(add3(r.end, mul3(norm3(sub3(r.end, r.mid)), 20 * s)));
  });
  return {s, P, base, up, head: hb, headC, neck, hip, knee, ankle, sh, el, wr, hand, torsoZ: at(P, up, 0, 90 * s, 0).z};
};

/** World position of a named joint (after `fall`), for effects and props. */
export const wardenJoint = (p: WardenProps, j: WJoint): V2 => {
  const r = solveWarden(p);
  const m: Record<WJoint, V3> = {
    elbowL: r.el[0], elbowR: r.el[1], wristL: r.wr[0], wristR: r.wr[1], chest: at(r.P, r.up, 0, 110 * r.s, 30 * r.s), head: r.headC,
    kneeL: r.knee[0], kneeR: r.knee[1], pelvis: r.P, shoulderL: r.sh[0], shoulderR: r.sh[1],
  };
  return applyFall(p, m[j]);
};
const applyFall = (p: WardenProps, q: V2): V2 => {
  if (!p.fall) return {x: q.x, y: q.y};
  const a = rad(p.fall.ang), c = Math.cos(a), sn = Math.sin(a);
  const dx = q.x - p.fall.px, dy = q.y - p.fall.py;
  return {x: p.fall.px + dx * c - dy * sn, y: p.fall.py + dx * sn + dy * c};
};

/** Walking warden: pelvis at x0 + dir·dist, planted feet, arms swinging slightly (coordinated, measured stride). */
export const wardenWalker = (x0: number, dist: number, dir: 1 | -1, ground: number, base: Omit<WardenProps, 'x' | 'y'> & {s?: number}): WardenProps => {
  const s = base.s ?? 1;
  const g = gait(x0, dist, dir, {stride: 172, duty: 0.6, lift: 22, bob: 5, armAmp: 10, s});
  const fy = (f: {lift: number}) => ground - ANK * s - f.lift;
  return {
    x: x0 + dir * dist, y: ground, yaw: dir * 90, drop: g.drop,
    legL: {foot: {x: g.L.x, y: fy(g.L)}}, legR: {foot: {x: g.R.x, y: fy(g.R)}},
    armL: {fk: {fwd: g.armL, out: 8, bend: 16 + Math.max(0, g.armL)}}, armR: {fk: {fwd: g.armR, out: 8, bend: 16 + Math.max(0, g.armR)}},
    ...base,
  } as WardenProps;
};

// ------------------------------------------------------------------ drawing
type Part = {z: number; el: React.ReactElement};
const P2 = (q: V3): V2 => ({x: q.x, y: q.y});

/** A plate with a jagged hole torn into it (amount u 0..1). The interior is drawn underneath by the caller. */
const TornPlate: React.FC<{d: string; fill: string; ink: number; u: number; c: V2; size: number; seed: number; id: string; shade?: React.ReactNode}> = ({d, fill, ink, u, c, size, seed, id, shade}) => {
  if (u <= 0.001) return <g><path d={d} fill={fill} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />{shade}</g>;
  if (u >= 0.999) return null;
  const n = 14;
  const hole: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = (i % 2 ? 0.55 : 1) * (0.75 + 0.5 * rnd(seed * 17 + i));
    hole.push({x: c.x + Math.cos(a) * size * u * k * 1.15, y: c.y + Math.sin(a) * size * u * k});
  }
  const holeD = polyPath(hole);
  return (
    <g>
      <defs><clipPath id={id}><path d={`${d} ${holeD}`} clipRule="evenodd" fillRule="evenodd" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <path d={d} fill={fill} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
        {shade}
        <path d={holeD} fill="none" stroke={INK} strokeWidth={ink * 1.6} strokeLinejoin="round" />
      </g>
    </g>
  );
};

const Cables: React.FC<{a: V2; b: V2; s: number; seed: number; bow?: number; broken?: number}> = ({a, b, s, seed, bow = 0.25, broken = 0}) => {
  // a loose bundle: each cable droops by its own amount and crosses the others, so it reads as wiring, not a pattern
  const out: React.ReactElement[] = [];
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  SYS.cable.forEach((col, i) => {
    const r1 = rnd(seed * 13 + i * 7), r2 = rnd(seed * 29 + i * 11);
    const o0 = (r1 - 0.5) * 14 * s, o1 = (r2 - 0.5) * 14 * s;
    const sag = L * bow * (0.35 + 0.9 * r2) + 16 * s * (i % 2 ? 1 : -0.4);
    const c1 = {x: lerp(a.x, b.x, 0.3 + 0.15 * r1) + nx * sag, y: lerp(a.y, b.y, 0.3 + 0.15 * r1) + ny * sag + 18 * s * r2};
    const c2 = {x: lerp(a.x, b.x, 0.7 - 0.15 * r2) + nx * sag * 0.6, y: lerp(a.y, b.y, 0.7 - 0.15 * r2) + ny * sag * 0.6 + 14 * s * r1};
    const cut = broken > 0 && i % 2 === 0;
    const end = cut ? {x: lerp(c1.x, c2.x, 0.6), y: lerp(c1.y, c2.y, 0.6) + 22 * s * r1} : {x: b.x + nx * o1, y: b.y + ny * o1};
    const d = cut
      ? `M ${pt({x: a.x + nx * o0, y: a.y + ny * o0})} Q ${pt(c1)} ${pt(end)}`
      : `M ${pt({x: a.x + nx * o0, y: a.y + ny * o0})} C ${pt(c1)} ${pt(c2)} ${pt(end)}`;
    out.push(<path key={`o${i}`} d={d} fill="none" stroke={INK} strokeWidth={(3.4 + r1 * 1.6) * s + 2.4 * s} strokeLinecap="round" />);
    out.push(<path key={i} d={d} fill="none" stroke={col} strokeWidth={(3.4 + r1 * 1.6) * s} strokeLinecap="round" />);
    if (cut) out.push(<circle key={`c${i}`} cx={end.x} cy={end.y} r={2.6 * s} fill="#D9D2C4" />);
  });
  return <g>{out}</g>;
};

export const Warden: React.FC<WardenProps> = (p) => {
  const r = solveWarden(p);
  const {s, up, base, head: hb} = r;
  const ink = p.ink ?? 4 * s;
  const t = p.t, seed = p.seed ?? 1;
  const tear = clamp(p.tear ?? 0);
  const parts: Part[] = [];
  const add = (z: number, el: React.ReactElement) => parts.push({z, el});
  const uid = `w${seed}_${Math.round(p.x)}_${Math.round(p.y)}`.replace(/-/g, 'm');
  const plateTear = (th: number) => clamp((tear - th) / 0.35);

  // ---- legs
  [0, 1].forEach((i) => {
    const H = r.hip[i], K = r.knee[i], A = r.ankle[i];
    const zLeg = (H.z + K.z + A.z) / 3;
    const footDir = {x: base.F.x, y: 0};
    const fl = Math.max(36, Math.abs(footDir.x) * 78) * s;
    const fx = A.x + base.F.x * 18 * s;
    const thighU = plateTear(0.55 + i * 0.2);
    const tP = {x: lerp(H.x, K.x, 0.45), y: lerp(H.y, K.y, 0.45)};
    add(r.torsoZ - 60 + (zLeg - r.torsoZ) * 0.3, (
      <g>
        <path d={capsule(P2(H), P2(K), 9 * s)} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
        <path d={capsule(P2(K), P2(A), 8 * s)} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
        {/* hydraulic actuator behind the shin */}
        <line x1={lerp(K.x, A.x, 0.15)} y1={lerp(K.y, A.y, 0.15)} x2={lerp(K.x, A.x, 0.8)} y2={lerp(K.y, A.y, 0.8)} stroke={M.hub} strokeWidth={5 * s} strokeLinecap="round" />
        <TornPlate d={capsule({x: lerp(H.x, K.x, 0.08), y: lerp(H.y, K.y, 0.08)}, {x: lerp(H.x, K.x, 0.84), y: lerp(H.y, K.y, 0.84)}, 22 * s, 17 * s)} fill={M.plate} ink={ink} u={thighU} c={tP} size={18 * s} seed={seed + i * 5} id={`${uid}th${i}`} />
        <path d={capsule({x: lerp(K.x, A.x, 0.14), y: lerp(K.y, A.y, 0.14)}, {x: lerp(K.x, A.x, 0.78), y: lerp(K.y, A.y, 0.78)}, 18 * s, 13 * s)} fill={M.plateShade} stroke={INK} strokeWidth={ink} />
        <circle cx={K.x} cy={K.y} r={15 * s} fill={M.joint} stroke={INK} strokeWidth={ink} />
        <circle cx={K.x} cy={K.y} r={6 * s} fill={M.hub} />
        <path d={rrect(fx, A.y + 12 * s, fl, 26 * s, 9 * s)} fill={M.frame} stroke={INK} strokeWidth={ink} />
        <path d={rrect(fx + base.F.x * 8 * s, A.y + 4 * s, fl * 0.7, 10 * s, 5 * s)} fill={M.plateShade} />
      </g>
    ));
  });

  // ---- pelvis and exposed waist frame
  {
    const c = at(r.P, base, 0, 8 * s, 0);
    const hw = Math.sqrt((54 * base.R.x) ** 2 + (34 * base.F.x) ** 2) * s;
    add(r.torsoZ - 20, (
      <g>
        <path d={rrect(c.x, c.y, hw * 2, 42 * s, 14 * s)} fill={M.frame} stroke={INK} strokeWidth={ink} />
        {[0, 1, 2].map((k) => { const q = at(r.P, up, 0, (32 + k * 13) * s, 0); return <path key={k} d={rrect(q.x, q.y, Math.max(26, hw * 0.55), 10 * s, 4 * s)} fill={M.frameDark} stroke={INK} strokeWidth={ink * 0.7} />; })}
      </g>
    ));
  }

  // ---- torso shell (cross sections, like the cast rig) over the interior
  const sp = sub3(at(r.P, up, 0, 1, 0), r.P);
  const u2 = norm3({x: sp.x, y: sp.y, z: 0});
  const n2 = {x: -u2.y, y: u2.x, z: 0};
  const ext = (a: number, b: number) => Math.sqrt((a * dot3(up.R, n2)) ** 2 + (b * dot3(up.F, n2)) ** 2) * s;
  const ctr = (h: number) => at(r.P, up, 0, h * s, 0);
  const secs: [number, number, number][] = [[62, 42, 30], [92, 56, 34], [128, 70, 38], [160, 60, 32]];
  const Ls: V2[] = [], Rs: V2[] = [];
  secs.forEach(([h, a, b]) => { const c = ctr(h), e = ext(a, b); Ls.push({x: c.x - n2.x * e, y: c.y - n2.y * e}); Rs.push({x: c.x + n2.x * e, y: c.y + n2.y * e}); });
  const top = ctr(170), eTop = ext(40, 26), bot = ctr(54);
  const shell = smoothPath([...Ls, {x: top.x - n2.x * eTop, y: top.y - n2.y * eTop}, {x: top.x + n2.x * eTop, y: top.y + n2.y * eTop}, ...[...Rs].reverse(), {x: bot.x, y: bot.y}], true, 0.4);
  const frontVis = dot3(up.F, {x: 0, y: 0, z: 1});
  const chestC = ctr(118);
  const chestTear = plateTear(0.05);
  const interior = (
    <g>
      <path d={shell} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
      {[80, 102, 124, 146].map((h, k) => { const c = ctr(h), e = ext(lerp(50, 64, k / 3), 30) * 0.82; return <line key={k} x1={c.x - n2.x * e} y1={c.y - n2.y * e} x2={c.x + n2.x * e} y2={c.y + n2.y * e} stroke={M.frame} strokeWidth={7 * s} strokeLinecap="round" />; })}
      <path d={rrect(chestC.x, chestC.y, 46 * s, 54 * s, 10 * s)} fill={M.joint} stroke={INK} strokeWidth={ink * 0.8} />
      <circle cx={chestC.x} cy={chestC.y - 4 * s} r={9 * s} fill={SYS.sensor} opacity={clamp(1 - tear * 1.2) * 0.9 + 0.1} />
      {[-1, 1].map((sd) => { const a = ctr(70), b = ctr(150); const off = sd * 22 * s; return <g key={sd}><line x1={a.x + n2.x * off} y1={a.y + n2.y * off} x2={b.x + n2.x * off} y2={b.y + n2.y * off} stroke={M.hub} strokeWidth={9 * s} strokeLinecap="round" /><line x1={a.x + n2.x * off} y1={a.y + n2.y * off} x2={lerp(a.x, b.x, 0.55) + n2.x * off} y2={lerp(a.y, b.y, 0.55) + n2.y * off} stroke={M.plateDeep} strokeWidth={5 * s} strokeLinecap="round" /></g>; })}
      <Cables a={{x: r.sh[0].x, y: r.sh[0].y + 10 * s}} b={{x: chestC.x - 10 * s, y: chestC.y + 20 * s}} s={s} seed={seed} bow={0.2} broken={tear > 0.6 ? 1 : 0} />
      <Cables a={{x: r.sh[1].x, y: r.sh[1].y + 10 * s}} b={{x: chestC.x + 10 * s, y: chestC.y + 20 * s}} s={s} seed={seed + 3} bow={-0.2} />
    </g>
  );
  const plateShade = frontVis > -0.2 ? (
    <g>
      {frontVis > 0.15 && (() => { const a = ctr(66), b = ctr(166); const f = at(a, up, 0, 0, 0); void f; return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={M.plateShade} strokeWidth={3 * s} />; })()}
      {frontVis > 0.15 && (() => { const c = ctr(96), e = ext(56, 34) * 0.9; return <path d={`M ${pt({x: c.x - n2.x * e, y: c.y - n2.y * e})} Q ${pt({x: c.x, y: c.y + 10 * s})} ${pt({x: c.x + n2.x * e, y: c.y + n2.y * e})}`} fill="none" stroke={M.plateShade} strokeWidth={3 * s} />; })()}
      {frontVis > 0.3 && <SysMark x={ctr(140).x + n2.x * 30 * s * frontVis} y={ctr(140).y} r={10 * s} opacity={0.85} />}
    </g>
  ) : null;
  add(r.torsoZ, (
    <g>
      {interior}
      <TornPlate d={shell} fill={M.plate} ink={ink} u={chestTear} c={{x: chestC.x + n2.x * 6 * s, y: chestC.y}} size={64 * s} seed={seed + 11} id={`${uid}ch`} shade={plateShade} />
    </g>
  ));

  // ---- arms
  [0, 1].forEach((i) => {
    const S = r.sh[i], E = r.el[i], Wr = r.wr[i], Hd = r.hand[i];
    const sd = i === 0 ? -1 : 1;
    const zA = S.z * 0.3 + E.z * 0.35 + Wr.z * 0.35;
    const front = zA > r.torsoZ + 6 * s;
    const off = p.armOff && p.armOff.side === (i === 0 ? 'L' : 'R') ? p.armOff : null;
    const upU = plateTear(0.3 + i * 0.25);
    const upper = (
      <g>
        <path d={capsule(P2(S), P2(E), 8 * s)} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
        <TornPlate d={capsule({x: lerp(S.x, E.x, 0.12), y: lerp(S.y, E.y, 0.12)}, {x: lerp(S.x, E.x, 0.86), y: lerp(S.y, E.y, 0.86)}, 18 * s, 15 * s)} fill={M.plate} ink={ink} u={upU} c={{x: lerp(S.x, E.x, 0.5), y: lerp(S.y, E.y, 0.5)}} size={16 * s} seed={seed + 21 + i} id={`${uid}ua${i}`} />
        <circle cx={E.x} cy={E.y} r={13 * s} fill={M.joint} stroke={INK} strokeWidth={ink} />
        {/* pauldron */}
        <path d={capsule({x: S.x - sd * 4 * s, y: S.y - 6 * s}, {x: S.x + (E.x - S.x) * 0.18, y: S.y + (E.y - S.y) * 0.18}, 24 * s, 20 * s)} fill={M.plate} stroke={INK} strokeWidth={ink} />
      </g>
    );
    const forearm = (ox: number, oy: number, rot: number) => {
      const ang = (Math.atan2(Wr.y - E.y, Wr.x - E.x) * 180) / Math.PI;
      const Lf = Math.hypot(Wr.x - E.x, Wr.y - E.y);
      return (
        <g transform={`translate(${f2(E.x + ox)} ${f2(E.y + oy)}) rotate(${f2(ang + rot)})`}>
          <WardenForearmLocal len={Lf} s={s} ink={ink} handLen={Math.hypot(Hd.x - Wr.x, Hd.y - Wr.y)} beam={p.beam && p.beam.side === (i === 0 ? 'L' : 'R') ? p.beam : undefined} beamRel={p.beam ? p.beam.dir - ang - rot : 0} seed={seed + i} broken={!!off} uid={`${uid}fa${i}`} />
        </g>
      );
    };
    const stump = off ? (
      <g>
        <Cables a={P2(E)} b={{x: E.x + (Wr.x - E.x) * 0.35, y: E.y + (Wr.y - E.y) * 0.35 + 10 * s}} s={s} seed={seed + 40} bow={0.5} broken={1} />
        <Crackle t={t} x={E.x + (Wr.x - E.x) * 0.25} y={E.y + (Wr.y - E.y) * 0.25} size={30 * s} seed={seed + 3} on={p.crackle ?? 1} />
      </g>
    ) : null;
    add(front ? r.torsoZ + 40 + zA * 1e-3 : r.torsoZ - 40 + zA * 1e-3, (
      <g>
        {upper}
        {off ? stump : forearm(0, 0, 0)}
      </g>
    ));
    if (off) add(r.torsoZ + 200, forearm(off.dx, off.dy, off.rot));
  });

  // ---- neck and helmet
  {
    const a = at(r.neck, up, 0, -18 * s, 0), b = r.headC;
    add(r.torsoZ + 2, (
      <g>
        <path d={capsule(P2(a), P2({x: lerp(a.x, b.x, 0.6), y: lerp(a.y, b.y, 0.6), z: 0}), 15 * s)} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
        {[0.2, 0.42].map((k) => <line key={k} x1={lerp(a.x, b.x, k) - 15 * s} y1={lerp(a.y, b.y, k)} x2={lerp(a.x, b.x, k) + 15 * s} y2={lerp(a.y, b.y, k)} stroke={M.frame} strokeWidth={3 * s} />)}
      </g>
    ));
    const Hc = r.headC;
    const rollDeg = (Math.atan2(hb.U.x, -hb.U.y) * 180) / Math.PI;
    const onH = (th: number, ey: number, rr = 1) => {
      const a0 = rad(th);
      const horiz = add3(mul3(hb.F, Math.cos(a0)), mul3(hb.R, Math.sin(a0)));
      const ce = Math.sqrt(Math.max(0, 1 - Math.min(0.98, ey * ey)));
      const d = add3(mul3(horiz, HR * s * rr * ce), mul3(hb.U, -ey * HR * 1.05 * s * rr));
      return {x: Hc.x + d.x, y: Hc.y + d.y, z: d.z / (HR * s * rr)};
    };
    const thC = (Math.atan2(dot3(hb.R, {x: 0, y: 0, z: 1}), dot3(hb.F, {x: 0, y: 0, z: 1})) * 180) / Math.PI;
    // visor band over the front hemisphere (only its visible part)
    const lo = Math.max(-82, thC - 88), hi = Math.min(82, thC + 88);
    const band: V2[] = [];
    if (hi > lo) {
      for (let k = 0; k <= 14; k++) band.push(onH(lerp(lo, hi, k / 14), -0.2, 1.01));
      for (let k = 14; k >= 0; k--) band.push(onH(lerp(lo, hi, k / 14), 0.32, 1.01));
    }
    const eye = onH(0, 0.06, 1.02);
    const helmetTear = plateTear(0.75);
    add(r.torsoZ + 5, (
      <g>
        <TornPlate d={`M ${f2(Hc.x - HR * s)} ${f2(Hc.y + 6 * s)} A ${f2(HR * s)} ${f2(HR * 1.08 * s)} 0 1 1 ${f2(Hc.x + HR * s)} ${f2(Hc.y + 6 * s)} Q ${f2(Hc.x + HR * 0.9 * s)} ${f2(Hc.y + HR * 0.95 * s)} ${f2(Hc.x)} ${f2(Hc.y + HR * 1.0 * s)} Q ${f2(Hc.x - HR * 0.9 * s)} ${f2(Hc.y + HR * 0.95 * s)} ${f2(Hc.x - HR * s)} ${f2(Hc.y + 6 * s)} Z`}
          fill={M.plate} ink={ink} u={helmetTear} c={{x: Hc.x - 14 * s, y: Hc.y - 18 * s}} size={24 * s} seed={seed + 31} id={`${uid}hm`}
          shade={<path d={`M ${f2(Hc.x - HR * 0.75 * s)} ${f2(Hc.y - HR * 0.55 * s)} Q ${f2(Hc.x)} ${f2(Hc.y - HR * 1.0 * s)} ${f2(Hc.x + HR * 0.6 * s)} ${f2(Hc.y - HR * 0.75 * s)}`} fill="none" stroke={M.plateHi} strokeWidth={5 * s} strokeLinecap="round" />} />
        {band.length > 4 && <g transform={`rotate(0)`}><path d={polyPath(band)} fill={M.frameDark} stroke={INK} strokeWidth={ink} strokeLinejoin="round" /></g>}
        {eye.z > -0.05 && <SensorEye x={eye.x} y={eye.y} r={17 * s} look={p.look} lock={p.lock} glow={p.glow ?? 0.5} ink={ink * 0.8} squash={clamp(eye.z * 1.1, 0.2, 1)} open={p.eyeOpen ?? 1} rot={rollDeg} id={`${uid}eye`} />}
      </g>
    ));
  }

  // ---- effects attached to joints
  const fx: React.ReactElement[] = [];
  const jointPos = (j: WJoint): V3 => ({elbowL: r.el[0], elbowR: r.el[1], wristL: r.wr[0], wristR: r.wr[1], chest: at(r.P, up, 0, 118 * s, 30 * s), head: r.headC, kneeL: r.knee[0], kneeR: r.knee[1], pelvis: r.P, shoulderL: r.sh[0], shoulderR: r.sh[1]}[j]);
  (p.sparks ?? []).forEach((sp0, k) => { const q = jointPos(sp0.where); fx.push(<Sparks key={`sp${k}`} t={t} t0={sp0.t0} x={q.x} y={q.y} n={18} speed={700 * s} g={1500 * s} seed={seed * 7 + k} w={3.5 * s} />); });
  if (p.leak && p.leak.amt > 0) {
    const src = p.armOff ? jointPos(p.armOff.side === 'L' ? 'elbowL' : 'elbowR') : jointPos('chest');
    fx.push(<Fluid key="leak" t={t} t0={p.leak.t0} x={src.x} y={src.y} dir={p.armOff ? 120 : 70} amt={p.leak.amt} speed={220 * s} w={9 * s} seed={seed} groundY={p.leak.groundY} pool={p.leak.groundY !== undefined ? clamp((t - p.leak.t0) / 3) : 0} />);
  }
  if (tear > 0.5 && (p.crackle ?? 1) > 0) { const q = jointPos('chest'); fx.push(<Crackle key="ck" t={t} x={q.x + 10 * s} y={q.y - 20 * s} size={34 * s} seed={seed + 9} on={(p.crackle ?? 1) * clamp((tear - 0.5) * 3)} />); }

  parts.sort((a, b) => a.z - b.z);
  const body = <g>{parts.map((q, k) => <g key={k}>{q.el}</g>)}{fx}</g>;
  if (!p.fall) return body;
  return <g transform={`rotate(${f2(p.fall.ang)} ${f2(p.fall.px)} ${f2(p.fall.py)})`}>{body}</g>;
};

/** Forearm + hand in local coords: origin at the elbow, +x along the forearm to the wrist (len). */
const WardenForearmLocal: React.FC<{len: number; s: number; ink: number; handLen: number; beam?: {amt: number; dir: number; len?: number}; beamRel: number; seed: number; broken?: boolean; uid: string}> = ({len, s, ink, handLen, beam, beamRel, broken, uid}) => {
  const hl = Math.max(26 * s, handLen + 8 * s);
  return (
    <g>
      {beam && beam.amt > 0 && (
        <g opacity={clamp(beam.amt)}>
          <defs>
            <linearGradient id={`${uid}bm`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={SYS.sensor} stopOpacity={0.55} />
              <stop offset="100%" stopColor={SYS.sensor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <g transform={`translate(${f2(len + hl * 0.6)} 0) rotate(${f2(beamRel)})`}>
            <path d={`M 0 ${-6 * s} L ${(beam.len ?? 900) * s} ${-110 * s} L ${(beam.len ?? 900) * s} ${110 * s} L 0 ${6 * s} Z`} fill={`url(#${uid}bm)`} />
          </g>
        </g>
      )}
      <path d={capsule({x: 0, y: 0}, {x: len, y: 0}, 7 * s)} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
      <path d={capsule({x: len * 0.12, y: 0}, {x: len * 0.9, y: 0}, 17 * s, 20 * s)} fill={M.plate} stroke={INK} strokeWidth={ink} />
      <line x1={len * 0.25} y1={8 * s} x2={len * 0.8} y2={10 * s} stroke={M.plateShade} strokeWidth={3 * s} strokeLinecap="round" />
      {/* hand: palm block and three finger segments */}
      <path d={rrect(len + hl * 0.42, 0, hl * 0.8, 34 * s, 9 * s)} fill={M.frame} stroke={INK} strokeWidth={ink} />
      {[-11, 0, 11].map((k) => <path key={k} d={capsule({x: len + hl * 0.78, y: k * s}, {x: len + hl * 1.1, y: k * s + 2 * s}, 4.5 * s)} fill={M.frameDark} stroke={INK} strokeWidth={ink * 0.6} />)}
      <circle cx={len + hl * 0.45} cy={0} r={6 * s} fill={beam && beam.amt > 0 ? SYS.sensorCore : SYS.sensor} opacity={0.9} />
      {broken && <path d={polyPath(jag({x: 0, y: -14 * s}, {x: 0, y: 14 * s}, 6, 6 * s, 3))} fill="none" stroke={INK} strokeWidth={ink} />}
    </g>
  );
};

/** A detached warden forearm anywhere (for flying pieces): origin at the torn elbow end, ang in degrees. */
export const WardenForearm: React.FC<{x: number; y: number; ang: number; s?: number; ink?: number; t: number; seed?: number; leak?: number}> = ({x, y, ang, s = 1, ink, t, seed = 1, leak = 0}) => {
  const k = ink ?? 4 * s;
  return (
    <g>
      <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(ang)})`}>
        <WardenForearmLocal len={FORE * s} s={s} ink={k} handLen={20 * s} beamRel={0} seed={seed} broken uid={`wf${seed}`} />
        {SYS.cable.map((c, i) => <path key={i} d={`M 0 ${(i - 1.5) * 5 * s} q ${-14 * s} ${(i - 1.5) * 4 * s} ${-22 * s - i * 4 * s} ${(i - 1.5) * 10 * s}`} fill="none" stroke={c} strokeWidth={4 * s} strokeLinecap="round" />)}
      </g>
      {leak > 0 && <Fluid t={t} t0={0} x={x} y={y} dir={110} amt={leak} speed={120 * s} w={7 * s} seed={seed + 2} />}
    </g>
  );
};
void smoothPath; void jag;
