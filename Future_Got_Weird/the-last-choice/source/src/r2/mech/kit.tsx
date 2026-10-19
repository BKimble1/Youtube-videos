// Shared machine kit: materials, part instancing into the engine (rigid parts as MeshItems), distance-based gait with
// planted feet, ballistic debris, and small sprites (eye glow, marking beam, cables, fluid, sparks) that belong to the
// machines themselves. FX can add more at the same points via the exported impact descriptors.
import React from 'react';
import {V3, add3, sub3, mul3, dot3, len3, norm3, rnd, clamp, lerp, smooth, f2} from '../../kit/math';
import {Item, MeshItem, Prepped, Material, project, toView, viewToScreen, View, shade, inkColor, lightAt, xfPoint, rgb, hex} from '../engine';
import {R3, Pose3, rmul, apply, rotAxisM, rcomp, I3, rotHeading} from './mat3';

export type Ground = (x: number, z: number) => number;
export const FLAT: Ground = () => 0;
/** A rubble chunk standing on the ground: centre (x, z), footprint w × d (yaw deg, headingVec convention), `h` = height of its top above the base ground at its centre. */
export type Chunk = {x: number; z: number; w: number; d: number; h: number; yaw?: number; /** width of the soft edge, m (default 0.14) */ edge?: number};
/**
 * (R4) A ground that includes rubble chunks: a foot, a body or a falling unit over a chunk stands on its top, with a soft
 * edge so nothing snaps when it crosses one. Pass the result as `ground` to units / heavies (their feet, steps over, falls and
 * wrecks then rest ON the chunk instead of sinking into it or hovering beside it); use the same chunk list to draw the meshes.
 */
export const groundWith = (base: Ground, chunks: Chunk[]): Ground => {
  const C = chunks.map((c) => {
    const a = ((c.yaw ?? 0) * Math.PI) / 180;
    return {...c, cs: Math.cos(a), sn: Math.sin(a), top: base(c.x, c.z) + c.h, e: c.edge ?? 0.14};
  });
  return (x, z) => {
    const g0 = base(x, z);
    let y = g0;
    for (const c of C) {
      const dx = x - c.x, dz = z - c.z;
      if (Math.abs(dx) > c.w + c.d + 1 || Math.abs(dz) > c.w + c.d + 1) continue;
      const lx = dx * c.cs + dz * c.sn, lz = -dx * c.sn + dz * c.cs;
      const out = Math.max(Math.abs(lx) - c.w / 2, Math.abs(lz) - c.d / 2);
      const k = out <= 0 ? 1 : 1 - smooth(out / c.e);
      if (k > 0) y = Math.max(y, g0 + (c.top - g0) * k);
    }
    return y;
  };
};

// ------------------------------------------------------------------ materials (merge into the scene's mats)
export const MECH_MATS: Record<string, Material> = {
  m_plate: {base: '#DCE4E8'},
  m_plate2: {base: '#C3CFD6'},
  m_plateDeep: {base: '#97A8B3'},
  m_frame: {base: '#4C5D69'},
  m_dark: {base: '#24323C'},
  m_black: {base: '#141C22'},
  m_joint: {base: '#33434E'},
  m_piston: {base: '#8A99A4'},
  m_rubber: {base: '#1E272D'},
  m_glass: {base: '#22313B'},
  m_mark: {base: '#7FB9C9', lit: 0.4},
  m_eye: {base: '#62D6EA', emissive: true, fog: 0.5, noInk: true},
  m_eyeLock: {base: '#FFB23F', emissive: true, fog: 0.5, noInk: true},
  m_eyeOff: {base: '#2B3A44', noInk: true},
  m_rotor: {base: '#B7C3C9', opacity: 0.32, noInk: true, lit: 0.3},
  m_fluid: {base: '#1B2328', lit: 0.3, noInk: true},
  m_cableR: {base: '#E0543E', noInk: true}, m_cableB: {base: '#3F7FD1', noInk: true}, m_cableY: {base: '#E8C547', noInk: true}, m_cableG: {base: '#2E9E6A', noInk: true},
  m_hot: {base: '#FFB45A', emissive: true, noInk: true},
  m_scorch: {base: '#2A2724', lit: 0.5},
};
export const EYE = {cyan: '#62D6EA', cyanCore: '#E9FBFF', amber: '#FFB23F', amberCore: '#FFF1CF'};
export const FLUID = '#1B2328';
export const CABLES = ['#E0543E', '#3F7FD1', '#E8C547', '#2E9E6A'];

// ------------------------------------------------------------------ part instancing
/**
 * One rigid part as an engine item: the part mesh is modelled around its joint (local origin); the instance places it
 * at `P.pos` with rotation `P.R`. Uses xf.pos for correct culling and fn for the rotation about that point.
 */
export const partItem = (mesh: Prepped, P: Pose3, key: string, o: Partial<MeshItem> = {}): MeshItem => ({
  kind: 'mesh', mesh, key,
  xf: {pos: P.pos},
  fn: (q) => add3(P.pos, rmul(P.R, sub3(q, P.pos))),
  ...o,
});

/** Scaled part (for LOD or size variants): world = pos + R·(scale·local). */
export const partItemS = (mesh: Prepped, P: Pose3, sc: number, key: string, o: Partial<MeshItem> = {}): MeshItem => ({
  kind: 'mesh', mesh, key,
  xf: {pos: P.pos, scale: sc},
  fn: (q) => add3(P.pos, rmul(P.R, sub3(q, P.pos))),
  ...o,
});

// ------------------------------------------------------------------ gait (distance based, planted feet)
export type Path = (d: number) => {pos: V3; heading: number};
export const straightPath = (from: V3, heading: number): Path => (d) => {
  const h = (heading * Math.PI) / 180;
  return {pos: {x: from.x + Math.sin(h) * d, y: from.y, z: from.z - Math.cos(h) * d}, heading};
};
/** Polyline path through points (heading follows the segment, smoothed over `turn` metres at corners). */
export const polyPathFn = (pts: V3[], turn = 1.5): Path => {
  const segs = pts.slice(1).map((p, i) => ({a: pts[i], b: p, L: Math.max(1e-6, Math.hypot(p.x - pts[i].x, p.z - pts[i].z))}));
  const total = segs.reduce((s, q) => s + q.L, 0);
  const hd = (a: V3, b: V3) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
  return (d) => {
    let r = clamp(d, 0, total);
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      if (r <= s.L || i === segs.length - 1) {
        const u = clamp(r / s.L);
        const pos = {x: lerp(s.a.x, s.b.x, u), y: lerp(s.a.y, s.b.y, u), z: lerp(s.a.z, s.b.z, u)};
        let h = hd(s.a, s.b);
        if (i < segs.length - 1 && s.L - r < turn) {
          const h2 = hd(segs[i + 1].a, segs[i + 1].b);
          let dh = ((h2 - h + 540) % 360) - 180;
          h += dh * smooth(1 - (s.L - r) / turn) * 0.5;
        }
        if (i > 0 && r < turn) {
          const h0 = hd(segs[i - 1].a, segs[i - 1].b);
          let dh = ((h - h0 + 540) % 360) - 180;
          h -= dh * smooth(1 - r / turn) * 0.5;
        }
        return {pos, heading: h};
      }
      r -= s.L;
    }
    return {pos: pts[pts.length - 1], heading: 0};
  };
};

export type FootState = {pos: V3; lift: number; heading: number; stance: boolean; s: number};
/**
 * Foot of a gait: `phase` 0 (left) / 0.5 (right) etc., `stride` = cycle length (two steps), `duty` = stance fraction,
 * `lateral` offset (m, + = right of path). The foot is planted at the pelvis position at mid-stance.
 */
export const footAt = (path: Path, dist: number, phase: number, stride: number, duty: number, lateral: number, lift: number, ground: Ground, toe = 0): FootState => {
  const c = dist / stride + phase;
  const n = Math.floor(c);
  const u = c - n;
  const plantD = (k: number) => (k - phase + duty / 2) * stride + toe;
  const place = (d: number) => {
    const p = path(d);
    const h = (p.heading * Math.PI) / 180;
    const rx = Math.cos(h), rz = Math.sin(h); // right vector of heading
    const x = p.pos.x + rx * lateral, z = p.pos.z + rz * lateral;
    return {pos: {x, y: ground(x, z), z}, heading: p.heading};
  };
  if (u < duty) {
    const q = place(plantD(n));
    return {...q, lift: 0, stance: true, s: 0};
  }
  const s = (u - duty) / (1 - duty);
  const a = place(plantD(n)), b = place(plantD(n + 1));
  const e = smooth(s);
  const pos = {x: lerp(a.pos.x, b.pos.x, e), y: lerp(a.pos.y, b.pos.y, e), z: lerp(a.pos.z, b.pos.z, e)};
  const L = Math.sin(Math.PI * s) * lift;
  // (R4) the swing foot follows the terrain between its two plants: the straight blend of the plant heights put it 7–20 cm under
  // the ground on a convex or steep slope (D2's reserves running the crater slope, single-frame foot dips)
  pos.y = Math.max(pos.y, ground(pos.x, pos.z));
  return {pos: {...pos, y: pos.y + L}, lift: L, heading: lerp(a.heading, b.heading, e), stance: false, s};
};

// ------------------------------------------------------------------ ballistic debris
export type Throw = {t0: number; p0: V3; v0: V3; spinAxis: V3; spin: number; seed: number; restitution?: number; size?: number};
/** Seeded throw descriptor from an impact: direction + strength (m/s). */
export const makeThrow = (t0: number, p0: V3, dir: V3, speed: number, seed: number, up = 0.5): Throw => {
  const r = (k: number) => rnd(seed * 31 + k) * 2 - 1;
  const d = norm3({x: dir.x + r(1) * 0.45, y: Math.abs(dir.y) * 0.5 + up + r(2) * 0.2, z: dir.z + r(3) * 0.45});
  return {t0, p0, v0: mul3(d, speed * (0.75 + rnd(seed * 7) * 0.5)), spinAxis: norm3({x: r(4), y: r(5), z: r(6)}), spin: (300 + rnd(seed * 9) * 600) * (r(7) > 0 ? 1 : -1), seed};
};
const G = 9.8;
/** Position + rotation of a thrown piece at time t (bounces once on the ground, then slides and settles). */
export const thrownPose = (th: Throw, t: number, ground: Ground, R0: R3 = I3, rest = 0.12): Pose3 => {
  const dt = Math.max(0, t - th.t0);
  const gy = (x: number, z: number) => ground(x, z) + rest;
  // first flight: solve landing time
  const y0 = th.p0.y, vy = th.v0.y;
  const g0 = gy(th.p0.x, th.p0.z);
  const disc = vy * vy + 2 * G * Math.max(0, y0 - g0);
  const t1 = (vy + Math.sqrt(Math.max(0, disc))) / G;
  const pAt = (u: number) => ({x: th.p0.x + th.v0.x * u, y: th.p0.y + vy * u - 0.5 * G * u * u, z: th.p0.z + th.v0.z * u});
  let pos: V3, spinT: number;
  if (dt <= t1) {
    pos = pAt(dt);
    spinT = dt;
  } else {
    const land = pAt(t1);
    const e = th.restitution ?? 0.28;
    const vb = {x: th.v0.x * 0.45, y: (-(vy - G * t1)) * e, z: th.v0.z * 0.45};
    const t2 = (2 * vb.y) / G;
    const u = dt - t1;
    if (u <= t2) {
      pos = {x: land.x + vb.x * u, y: gy(land.x + vb.x * u, land.z + vb.z * u) + vb.y * u - 0.5 * G * u * u, z: land.z + vb.z * u};
    } else {
      // slide to rest with friction
      const w = u - t2;
      const slide = (1 - Math.exp(-3 * w)) / 3;
      const x = land.x + vb.x * t2 + vb.x * 0.6 * slide, z = land.z + vb.z * t2 + vb.z * 0.6 * slide;
      pos = {x, y: gy(x, z), z};
    }
    spinT = t1 + Math.min(u, t2 + 0.4) * 0.35;
  }
  const R = rcomp(rotAxisM(th.spinAxis, th.spin * spinT), R0);
  return {pos, R};
};

// ------------------------------------------------------------------ far LOD: posed hulls and tubes (R4)
// A distant machine used to be a fixed front-facing cut-out (a pale trapezoid with a box head; a standing walker even
// for a toppled wreck). It is now drawn from the SAME solved skeleton as the meshes: each rigid part as the flat convex
// hull of its projected points, limbs as tubes along their joints, sorted back to front, tinted by the part's own mesh
// colours and lit by the scene. Its width follows the view angle, it takes the pose (guard, strike, march, fallen,
// toppled) and it never shows a part that is torn off.
export type FarPrim =
  | {t: 'hull'; pts: V3[]; tone: string; n?: V3}
  | {t: 'tube'; pts: V3[]; w: number; tone: string};
type BoxInfo = {lo: V3; hi: V3; tone: string};
const BOXES = new WeakMap<Prepped, BoxInfo>();
const toneMix = (parts: {c: string; w: number}[]): string => {
  let r = 0, g = 0, b = 0, ws = 0;
  for (const p of parts) { const c = rgb(p.c); r += c[0] * p.w; g += c[1] * p.w; b += c[2] * p.w; ws += p.w; }
  return hex([r / ws, g / ws, b / ws]);
};
/** bounding box and the area-weighted average colour of a part mesh (cached) */
export const meshBox = (m: Prepped): BoxInfo => {
  let bi = BOXES.get(m);
  if (bi) return bi;
  let lo = {x: 1e9, y: 1e9, z: 1e9}, hi = {x: -1e9, y: -1e9, z: -1e9};
  m.verts.forEach((p) => { lo = {x: Math.min(lo.x, p.x), y: Math.min(lo.y, p.y), z: Math.min(lo.z, p.z)}; hi = {x: Math.max(hi.x, p.x), y: Math.max(hi.y, p.y), z: Math.max(hi.z, p.z)}; });
  const ws: {c: string; w: number}[] = [];
  m.faces.forEach((f, fi) => {
    const base = MECH_MATS[f.mat]?.base;
    if (!base) return;
    const P = f.v.map((i) => m.verts[i]);
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; nx += (a.y - b.y) * (a.z + b.z); ny += (a.z - b.z) * (a.x + b.x); nz += (a.x - b.x) * (a.y + b.y); }
    void fi;
    ws.push({c: base, w: Math.hypot(nx, ny, nz) / 2 + 1e-6});
  });
  bi = {lo, hi, tone: ws.length ? toneMix(ws) : '#8A99A4'};
  BOXES.set(m, bi);
  return bi;
};
export const meshTone = (m: Prepped) => meshBox(m).tone;
/** the 8 corners of a mesh's bounding box, placed by a pose, as world points */
export const boxPts = (m: Prepped, P: Pose3, lo?: Partial<V3>, hi?: Partial<V3>): V3[] => {
  const b = meshBox(m);
  const L = {...b.lo, ...lo}, H = {...b.hi, ...hi};
  const out: V3[] = [];
  for (const x of [L.x, H.x]) for (const y of [L.y, H.y]) for (const z of [L.z, H.z]) out.push(add3(P.pos, rmul(P.R, {x, y, z})));
  return out;
};
/** a mesh item (partItem) as a hull primitive: every vertex of the mesh, placed as the item places it */
export const meshPrim = (it: MeshItem, tone?: string): FarPrim => ({
  t: 'hull', tone: tone ?? meshTone(it.mesh),
  pts: it.mesh.verts.map((p) => { let q = it.xf ? xfPoint(p, it.xf) : p; if (it.fn) q = it.fn(q, -1); return q; }),
});
const hull2d = (pts: {x: number; y: number}[]) => {
  const P = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (P.length < 3) return P;
  const cr = (o: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: typeof P = [], hi: typeof P = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
/**
 * One sprite for a whole far machine. `pos` = its base point (depth anchor, as the old far sprites). `eye` = the sensor
 * dot (drawn only when `dir` points toward the camera). `tone` scales every colour (calibrated so a unit keeps its
 * brightness across the mid → far change).
 */
export const farFigure = (prims: FarPrim[], pos: V3, key: string, o: {eye?: {pos: V3; dir?: V3; color: 'cyan' | 'amber'; r?: number}; /** colour multiplier (ink and haze are not: a far part is the average of the mesh it stands for) */ tone?: number; n?: V3; bias?: number; /** ink width scale (default 1: the engine's own width, 0.045 m) */ ink?: number; /** a hull's tone chosen at draw time: (index, faces the camera) */ toneFor?: (i: number, facing: boolean) => string | undefined} = {}): Item => ({
  kind: 'sprite', pos, key: `${key}_far`, n: o.n ?? {x: -0.6, y: 0.3, z: 0.4}, bias: o.bias,
  draw: (c) => {
    const v = c.view;
    const draws: {d: number; el: React.ReactElement}[] = [];
    const tk = o.tone ?? 1;
    prims.forEach((pr, i) => {
      let cx = 0, cy = 0, cz = 0, zs = 0;
      const S: {x: number; y: number}[] = [];
      for (const p of pr.pts) {
        const q = toView(v, p);
        if (q.z < v.near * 2) return;
        const s = project(v, p);
        S.push({x: s.x, y: s.y});
        cx += p.x; cy += p.y; cz += p.z; zs += q.z;
      }
      const n = pr.pts.length;
      const cen = {x: cx / n, y: cy / n, z: cz / n};
      const toCam = norm3(sub3(v.pos, cen));
      let nrm = toCam;
      if (pr.t === 'hull' && pr.n) nrm = dot3(pr.n, toCam) >= 0 ? pr.n : mul3(pr.n, -1);
      const facing = pr.t === 'hull' && pr.n ? dot3(pr.n, toCam) >= 0 : true;
      const lit = lightAt(c.light, cen, nrm, len3(sub3(cen, v.pos)), c.t);
      const baseHex = o.toneFor?.(i, facing) ?? pr.tone;
      const col = shade(c.light, {base: tk === 1 ? baseHex : hex(rgb(baseHex).map((x) => x * tk) as [number, number, number])}, lit);
      const k = v.focal / Math.max(zs / n, v.near);
      const iw = clamp(0.045 * k * (o.ink ?? 1), 0.6, 3.2);
      const ink = inkColor(c.light, undefined, lit);
      if (pr.t === 'hull') {
        const H = hull2d(S);
        if (H.length < 3) return;
        const d = 'M' + H.map((q) => `${f2(q.x)} ${f2(q.y)}`).join('L') + 'Z';
        draws.push({d: zs / n, el: <path key={i} d={d} fill={col} stroke={ink} strokeWidth={f2(iw)} strokeLinejoin="round" />});
      } else {
        const w = Math.max(0.9, pr.w * k);
        const pts = S.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ');
        draws.push({d: zs / n, el: <g key={i}><polyline points={pts} fill="none" stroke={ink} strokeWidth={f2(w + iw)} strokeLinecap="round" strokeLinejoin="round" /><polyline points={pts} fill="none" stroke={col} strokeWidth={f2(w)} strokeLinecap="round" strokeLinejoin="round" /></g>});
      }
    });
    if (!draws.length) return null;
    draws.sort((a, b) => b.d - a.d);
    const e = o.eye;
    let eyeEl: React.ReactElement | null = null;
    if (e && (!e.dir || dot3(e.dir, sub3(v.pos, e.pos)) > 0)) {
      const s = project(v, e.pos);
      if (toView(v, e.pos).z > v.near) eyeEl = <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(Math.max(0.7, (e.r ?? 0.03) * s.k))} fill={e.color === 'cyan' ? EYE.cyan : EYE.amber} />;
    }
    return <g>{draws.map((q) => q.el)}{eyeEl}</g>;
  },
});
void len3;

// ------------------------------------------------------------------ sprites
/**
 * Glowing sensor eye (sprite at the eye's world position). `power` 0..1, radius in metres. `facing` (optional, world
 * direction the eye looks): the glow fades out as the eye turns away from the camera (no glow on the back of a head).
 */
export const eyeGlow = (pos: V3, color: 'cyan' | 'amber' | 'off', power0: number, radius: number, key: string, bias = 0.06, facing?: V3): Item => ({
  kind: 'sprite', pos, key, bias,
  draw: (c) => {
    let power = power0;
    if (facing) {
      const d = sub3(c.view.pos, pos), l = len3(d) || 1;
      power *= clamp(((facing.x * d.x + facing.y * d.y + facing.z * d.z) / l + 0.1) / 0.35);
    }
    if (color === 'off' || power <= 0.01) return null;
    const r = Math.max(1.5, radius * c.k);
    const col = color === 'cyan' ? EYE.cyan : EYE.amber;
    const core = color === 'cyan' ? EYE.cyanCore : EYE.amberCore;
    const id = `eg_${key}`.replace(/[^a-zA-Z0-9_]/g, '_');
    const fogA = 1 - c.lit.fog * 0.6;
    return (
      <g opacity={clamp(power * fogA)}>
        <defs>
          <radialGradient id={id}>
            <stop offset="0" stopColor={core} stopOpacity={0.95} />
            <stop offset="0.25" stopColor={col} stopOpacity={0.75} />
            <stop offset="1" stopColor={col} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={c.x} cy={c.y} r={r * 3.2} fill={`url(#${id})`} />
        <circle cx={c.x} cy={c.y} r={Math.max(1, r * 0.55)} fill={core} />
      </g>
    );
  },
});

/** Thin marking/scan beam from a to b (world), drawn as one sprite at the midpoint depth. */
export const beam = (a: V3, b: V3, color: 'cyan' | 'amber', power: number, key: string): Item => ({
  kind: 'sprite', pos: mul3(add3(a, b), 0.5), key,
  draw: (c) => {
    const v = c.view;
    const qa = toView(v, a), qb = toView(v, b);
    if (qa.z < v.near && qb.z < v.near) return null;
    // (R4: a beam with one end behind the camera is cut at the near plane, not dropped whole)
    const a2 = qa.z < v.near ? add3(a, mul3(sub3(b, a), (v.near - qa.z) / (qb.z - qa.z))) : a;
    const b2 = qb.z < v.near ? add3(b, mul3(sub3(a, b), (v.near - qb.z) / (qa.z - qb.z))) : b;
    const A = project(v, a2), B = project(v, b2);
    const col = color === 'cyan' ? EYE.cyan : EYE.amber;
    const w = clamp(0.03 * Math.min(A.k, B.k), 0.8, 4);
    // (R3 delivery: a drone far above the frame puts one end of the line thousands of pixels off screen. The group's
    // opacity makes the browser allocate a layer as big as the line's bounding box: at 3840 px wide that stalled the
    // 4K render for good on D4-5b (2:49.1). The line is cut to the frame plus a margin first, so every visible pixel is
    // the same and only the invisible length goes.)
    const mg = 8 * w + 8;
    const lo = {x: -mg, y: -mg}, hi = {x: v.W + mg, y: v.H + mg};
    const dx = B.x - A.x, dy = B.y - A.y;
    let t0 = 0, t1 = 1;
    for (const [pp, qq] of [[-dx, A.x - lo.x], [dx, hi.x - A.x], [-dy, A.y - lo.y], [dy, hi.y - A.y]] as [number, number][]) {
      if (pp === 0) { if (qq < 0) return null; continue; }
      const r = qq / pp;
      if (pp < 0) { if (r > t1) return null; if (r > t0) t0 = r; } else { if (r < t0) return null; if (r < t1) t1 = r; }
    }
    const A2 = {x: A.x + dx * t0, y: A.y + dy * t0}, B2 = {x: A.x + dx * t1, y: A.y + dy * t1};
    return (
      <g opacity={clamp(power)}>
        <line x1={f2(A2.x)} y1={f2(A2.y)} x2={f2(B2.x)} y2={f2(B2.y)} stroke={col} strokeWidth={w * 3} strokeOpacity={0.25} strokeLinecap="round" />
        <line x1={f2(A2.x)} y1={f2(A2.y)} x2={f2(B2.x)} y2={f2(B2.y)} stroke={col} strokeWidth={w} strokeLinecap="round" />
        {t1 >= 1 && qb.z >= v.near ? <circle cx={f2(B.x)} cy={f2(B.y)} r={w * 2.2} fill={col} opacity={0.8} /> : null}
      </g>
    );
  },
});

/** A cable (sagging curve) between world points, as a sprite polyline (bundles of exposed wiring, snapped ends). */
export const cable = (a: V3, b: V3, sag: number, color: string, thick: number, key: string, ink = true, seg = 8): Item => ({
  kind: 'sprite', pos: mul3(add3(a, b), 0.5), key,
  draw: (c) => {
    const v = c.view;
    // (R4: the parts of a cable in front of the camera are drawn; one point behind it used to remove the whole cable)
    const runs: string[][] = [[]];
    let kMin = 1e9;
    let prev: V3 | null = null;
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      const p = {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - Math.sin(Math.PI * u) * sag, z: lerp(a.z, b.z, u)};
      const q = toView(v, p);
      const ok = q.z >= v.near;
      if (prev) {
        const qp = toView(v, prev), okp = qp.z >= v.near;
        if (okp !== ok) {
          const e = add3(prev, mul3(sub3(p, prev), (v.near - qp.z) / (q.z - qp.z)));
          const se = project(v, e);
          kMin = Math.min(kMin, se.k);
          runs[runs.length - 1].push(`${f2(se.x)},${f2(se.y)}`);
          if (okp) runs.push([]);
        }
      }
      if (ok) { const s = project(v, p); kMin = Math.min(kMin, s.k); runs[runs.length - 1].push(`${f2(s.x)},${f2(s.y)}`); }
      prev = p;
    }
    const vis = runs.filter((r) => r.length >= 2);
    if (!vis.length) return null;
    const w = clamp(thick * kMin, 0.6, 9);
    return (
      <g>
        {ink && vis.map((r, i) => <polyline key={`i${i}`} points={r.join(' ')} fill="none" stroke="#162A32" strokeWidth={w + 2} strokeLinecap="round" strokeLinejoin="round" />)}
        {vis.map((r, i) => <polyline key={`c${i}`} points={r.join(' ')} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
    );
  },
});

/** Spray of droplets/sparks along ballistic arcs from p0 (world) after t0. kind 'fluid' (dark drops) or 'spark'. */
export const spray = (t: number, t0: number, p0: V3, dir: V3, n: number, speed: number, kind: 'fluid' | 'spark', seed: number, key: string, ground: Ground = FLAT, life = 0.9): Item[] => {
  const out: Item[] = [];
  const dt = t - t0;
  if (dt < 0 || dt > life + 0.6) return out;
  for (let i = 0; i < n; i++) {
    const r = (k: number) => rnd(seed * 131 + i * 17 + k) * 2 - 1;
    const d = norm3({x: dir.x + r(1) * 0.6, y: dir.y + 0.35 + r(2) * 0.4, z: dir.z + r(3) * 0.6});
    const sp = speed * (0.4 + rnd(seed * 7 + i) * 0.8);
    const delay = rnd(seed * 3 + i * 5) * (kind === 'fluid' ? 0.35 : 0.12);
    const u = dt - delay;
    if (u < 0 || u > life) continue;
    const p = {x: p0.x + d.x * sp * u, y: p0.y + d.y * sp * u - 0.5 * 9.8 * u * u, z: p0.z + d.z * sp * u};
    if (p.y < ground(p.x, p.z) - 0.02) continue;
    const pPrev = {x: p0.x + d.x * sp * Math.max(0, u - 0.035), y: p0.y + d.y * sp * Math.max(0, u - 0.035) - 0.5 * 9.8 * Math.max(0, u - 0.035) ** 2, z: p0.z + d.z * sp * Math.max(0, u - 0.035)};
    const fade = 1 - u / life;
    out.push({
      kind: 'sprite', pos: p, key: `${key}_${i}`, bias: 0.05,
      draw: (c) => {
        const q = project(c.view, pPrev);
        if (kind === 'spark') {
          const w = clamp(0.025 * c.k, 0.8, 3.5);
          return <line x1={f2(q.x)} y1={f2(q.y)} x2={f2(c.x)} y2={f2(c.y)} stroke={fade > 0.5 ? '#FFFBEA' : '#FF9A3C'} strokeWidth={w} strokeLinecap="round" opacity={fade} />;
        }
        const r0 = clamp((0.035 + rnd(seed + i) * 0.04) * c.k, 0.8, 9);
        return <ellipse cx={f2(c.x)} cy={f2(c.y)} rx={f2(r0)} ry={f2(r0 * 1.3)} fill={FLUID} opacity={0.9} />;
      },
    });
  }
  return out;
};

/** A pool of dark fluid spreading on the ground under a wreck (sprite projected as a ground ellipse polygon). */
export const fluidPool = (center: V3, t: number, t0: number, maxR: number, seed: number, key: string, ground: Ground = FLAT): Item | null => {
  const dt = t - t0;
  if (dt <= 0) return null;
  const r = maxR * (1 - Math.exp(-dt / 2.5));
  const n = 11;
  const pts: V3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.75 + rnd(seed * 13 + i) * 0.45);
    const x = center.x + Math.cos(a) * rr, z = center.z + Math.sin(a) * rr * 0.8;
    pts.push({x, y: ground(x, z) + 0.015, z});
  }
  return {
    kind: 'sprite', pos: {x: center.x, y: ground(center.x, center.z), z: center.z}, key, bias: -0.5,
    draw: (c) => {
      const v: View = c.view;
      // (R4: the outline is clipped at the near plane; it used to vanish whole when one point of it went behind the camera)
      const Q = pts.map((p) => toView(v, p));
      const C: V3[] = [];
      for (let i = 0; i < Q.length; i++) {
        const a = Q[i], b = Q[(i + 1) % Q.length];
        const ain = a.z >= v.near, bin = b.z >= v.near;
        if (ain) C.push(a);
        if (ain !== bin) { const u = (v.near - a.z) / (b.z - a.z); C.push({x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: v.near}); }
      }
      if (C.length < 3) return null;
      const P = C.map((q) => viewToScreen(v, q));
      return <path d={'M' + P.map((q) => `${f2(q.x)} ${f2(q.y)}`).join('L') + 'Z'} fill={FLUID} opacity={0.85} />;
    },
  };
};

export const distTo = (v: View, p: V3) => len3(sub3(p, v.pos));
export {rotHeading, apply};
