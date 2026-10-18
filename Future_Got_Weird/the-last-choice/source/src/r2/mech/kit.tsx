// Shared machine kit: materials, part instancing into the engine (rigid parts as MeshItems), distance-based gait with
// planted feet, ballistic debris, and small sprites (eye glow, marking beam, cables, fluid, sparks) that belong to the
// machines themselves. FX can add more at the same points via the exported impact descriptors.
import React from 'react';
import {V3, add3, sub3, mul3, len3, norm3, rnd, clamp, lerp, smooth, f2} from '../../kit/math';
import {Item, MeshItem, Prepped, Material, project, toView, View} from '../engine';
import {R3, Pose3, rmul, apply, rotAxisM, rcomp, I3, rotHeading} from './mat3';

export type Ground = (x: number, z: number) => number;
export const FLAT: Ground = () => 0;

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
    if (qa.z < v.near || qb.z < v.near) return null;
    const A = project(v, a), B = project(v, b);
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
        {t1 >= 1 ? <circle cx={f2(B.x)} cy={f2(B.y)} r={w * 2.2} fill={col} opacity={0.8} /> : null}
      </g>
    );
  },
});

/** A cable (sagging curve) between world points, as a sprite polyline (bundles of exposed wiring, snapped ends). */
export const cable = (a: V3, b: V3, sag: number, color: string, thick: number, key: string, ink = true, seg = 8): Item => ({
  kind: 'sprite', pos: mul3(add3(a, b), 0.5), key,
  draw: (c) => {
    const v = c.view;
    const pts: string[] = [];
    let kMin = 1e9;
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      const p = {x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) - Math.sin(Math.PI * u) * sag, z: lerp(a.z, b.z, u)};
      if (toView(v, p).z < v.near) return null;
      const s = project(v, p);
      kMin = Math.min(kMin, s.k);
      pts.push(`${f2(s.x)},${f2(s.y)}`);
    }
    const w = clamp(thick * kMin, 0.6, 9);
    return (
      <g>
        {ink && <polyline points={pts.join(' ')} fill="none" stroke="#162A32" strokeWidth={w + 2} strokeLinecap="round" strokeLinejoin="round" />}
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
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
      const P = pts.map((p) => (toView(v, p).z < v.near ? null : project(v, p)));
      if (P.some((q) => !q)) return null;
      return <path d={'M' + P.map((q) => `${f2(q!.x)} ${f2(q!.y)}`).join('L') + 'Z'} fill={FLUID} opacity={0.85} />;
    },
  };
};

export const distTo = (v: View, p: V3) => len3(sub3(p, v.pos));
export {rotHeading, apply};
