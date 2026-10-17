// R2 FX core: the output type every effect builder returns, light/shade helpers for sprites, 3D ballistics, thrown
// paths and small drawing helpers. All effects are pure functions of film time t and their world inputs (seeded).
//
// Every builder returns FxOut = {items, lights, shake}: `items` go into the Scene, `lights` into the LightRig's
// `lights`, `shake` is a suggested camera-shake amplitude (metres) for shake3(). Use combine() to merge several.
import React from 'react';
import {V3, add3, sub3, mul3, norm3, cross3, dot3, len3, clamp, lerp, rnd, rad} from '../../kit/math';
import {Item, PointLight, SpriteCtx, tones, Material} from '../engine';
import {RGB, rgb, hex, mixRGB} from '../engine/color';

export type FxOut = {items: Item[]; lights: PointLight[]; shake: number};
export const NONE: FxOut = {items: [], lights: [], shake: 0};
export const fx = (items: Item[] = [], lights: PointLight[] = [], shake = 0): FxOut => ({items, lights, shake});
export const combine = (...o: (FxOut | null | undefined | false)[]): FxOut => {
  const out: FxOut = {items: [], lights: [], shake: 0};
  o.forEach((x) => {
    if (!x) return;
    out.items.push(...x.items);
    out.lights.push(...x.lights);
    out.shake = Math.max(out.shake, x.shake);
  });
  return out;
};
/** Point lights of several effects (for the shot's LightRig.lights). */
export const fxLights = (...o: (FxOut | null | undefined | false)[]) => combine(...o).lights;

/** Materials used by FX meshes (merge into the Scene's `mats`: {...SET_MATS, ...FX_MATS}). */
export const FX_MATS: Record<string, Material> = {
  fx_scorch: {base: '#231B1A', opacity: 0.8, noInk: true, lit: 0.4},
  fx_scorch_rim: {base: '#3A2D28', opacity: 0.55, noInk: true, lit: 0.4},
  ally_body: {base: '#E07A3A'},
  ally_panel: {base: '#F0E2C2'},
  ally_arm: {base: '#3C4146'},
  ally_tape: {base: '#C8CBCD'},
  ally_lens: {base: '#FFB24A', emissive: true},
  ally_dark: {base: '#2A2D31'},
};

export const INK = '#162A32';

// ------------------------------------------------------------------ light for sprites
/**
 * Cel tone of a base colour at a sprite: band 0 = shadow, 1 = mid, 2 = lit (or 'auto' = the sprite's own band),
 * plus the banded warm spill and the haze the engine applies to faces (so effects sit in the same light).
 */
export const tone = (c: SpriteCtx, base: string, band: 0 | 1 | 2 | 'auto' = 'auto', fireK = 1, fogK = 1): string => {
  const tn = tones(c.light, base);
  let col: RGB = tn[band === 'auto' ? c.lit.band : band];
  const fb = c.lit.fire * fireK;
  const s = fb > 0.55 ? 0.42 : fb > 0.22 ? 0.24 : fb > 0.08 ? 0.1 : 0;
  if (s > 0) col = mixRGB(col, mixRGB(c.lit.fireColor, rgb(base), 0.35), s);
  const f = c.lit.fog * fogK;
  if (f > 0.002) col = mixRGB(col, rgb(c.light.fogColor), f);
  return hex(col);
};
/** Self-lit colour (fire, light, sparks): only haze, scaled down (bright things punch through haze). */
export const glowTone = (c: SpriteCtx, col: string, fogK = 0.45) => (c.lit.fog * fogK > 0.002 ? hex(mixRGB(rgb(col), rgb(c.light.fogColor), c.lit.fog * fogK)) : col);
export const inkTone = (c: SpriteCtx) => (c.lit.fog > 0.002 ? hex(mixRGB(rgb(c.light.ink), rgb(c.light.fogColor), Math.min(1, c.lit.fog * 1.05))) : c.light.ink);
/** Ink width in px for a world thickness (m) at this sprite's depth. */
export const inkPx = (c: SpriteCtx, m = 0.03, lo = 0.6, hi = 2.6) => clamp(m * c.k, lo, hi);

// ------------------------------------------------------------------ vectors
/** Orthonormal basis around a direction (for cones, rings, planes). */
export const basisAround = (d: V3): {u: V3; v: V3; w: V3} => {
  const w = norm3(d);
  const ref = Math.abs(w.y) > 0.9 ? {x: 1, y: 0, z: 0} : {x: 0, y: 1, z: 0};
  const u = norm3(cross3(ref, w));
  const v = cross3(w, u);
  return {u, v, w};
};
/** Seeded direction inside a cone of half-angle `spreadDeg` around `dir`. */
export const coneDir = (dir: V3, spreadDeg: number, seed: number): V3 => {
  const {u, v, w} = basisAround(dir);
  const th = rad(spreadDeg) * Math.sqrt(rnd(seed * 3 + 1));
  const ph = rnd(seed * 5 + 2) * Math.PI * 2;
  return norm3(add3(add3(mul3(w, Math.cos(th)), mul3(u, Math.sin(th) * Math.cos(ph))), mul3(v, Math.sin(th) * Math.sin(ph))));
};
export const G = 9.81;

export type Ball3 = {p: V3; v: V3; landed: boolean; rest: boolean};
/**
 * Ballistic flight from p0 with velocity v0 after tau seconds (y up, gravity g), one damped bounce on the ground plane
 * y = ground (if given), then a friction slide to rest. Same behaviour as R1's 2D ballistic(), in metres.
 */
export const ball3 = (p0: V3, v0: V3, tau: number, ground?: number, bounce = 0.3, fric = 3.2, g = G): Ball3 => {
  const free = (tt: number): Ball3 => ({p: {x: p0.x + v0.x * tt, y: p0.y + v0.y * tt - 0.5 * g * tt * tt, z: p0.z + v0.z * tt}, v: {x: v0.x, y: v0.y - g * tt, z: v0.z}, landed: false, rest: false});
  if (ground === undefined || p0.y < ground) return free(tau);
  const disc = v0.y * v0.y + 2 * g * (p0.y - ground);
  const t1 = (v0.y + Math.sqrt(Math.max(0, disc))) / g;
  if (tau <= t1) return free(tau);
  const hit = free(t1).p;
  const vImp = v0.y - g * t1;
  const vx2 = v0.x * 0.45, vz2 = v0.z * 0.45, vy2 = Math.abs(vImp) * bounce;
  const t2 = (2 * vy2) / g;
  const tb = tau - t1;
  if (tb <= t2) return {p: {x: hit.x + vx2 * tb, y: ground + vy2 * tb - 0.5 * g * tb * tb, z: hit.z + vz2 * tb}, v: {x: vx2, y: vy2 - g * tb, z: vz2}, landed: true, rest: false};
  const p2 = {x: hit.x + vx2 * t2, y: ground, z: hit.z + vz2 * t2};
  const ts = tb - t2;
  const k = (1 - Math.exp(-fric * ts)) / fric;
  return {p: {x: p2.x + vx2 * k, y: ground, z: p2.z + vz2 * k}, v: {x: vx2 * Math.exp(-fric * ts), y: 0, z: vz2 * Math.exp(-fric * ts)}, landed: true, rest: ts > 1.2};
};

export type ThrowOpts = {from: V3; to: V3; t0: number; flight?: number; apex?: number; ground?: number; bounce?: number; roll?: number; seed?: number};
export type ThrowState = {p: V3; rot: number; phase: 'held' | 'air' | 'bounce' | 'rest'; landedAt: number};
/**
 * A thrown object (canister, flare): a parabola from `from` to `to` in `flight` s with `apex` m of extra height, then
 * one short bounce forward and a roll to rest. rot = tumble angle (deg) for drawing.
 */
export const thrown = (o: ThrowOpts, t: number): ThrowState => {
  const fl = o.flight ?? 0.9, ap = o.apex ?? 2.2, g0 = o.ground ?? o.to.y;
  const tau = t - o.t0;
  const spin = 540 + rnd((o.seed ?? 1) * 7) * 360;
  if (tau < 0) return {p: o.from, rot: 0, phase: 'held', landedAt: o.t0 + fl};
  if (tau <= fl) {
    const u = tau / fl;
    const p = {x: lerp(o.from.x, o.to.x, u), y: lerp(o.from.y, o.to.y, u) + 4 * ap * u * (1 - u), z: lerp(o.from.z, o.to.z, u)};
    return {p, rot: spin * tau, phase: 'air', landedAt: o.t0 + fl};
  }
  const d = norm3({x: o.to.x - o.from.x, y: 0, z: o.to.z - o.from.z});
  const sp = (len3({x: o.to.x - o.from.x, y: 0, z: o.to.z - o.from.z}) / fl) * 0.35;
  const b = ball3({x: o.to.x, y: g0 + 0.001, z: o.to.z}, {x: d.x * sp, y: (o.bounce ?? 1.6), z: d.z * sp}, tau - fl, g0, 0.25, 2.6);
  const travelled = len3(sub3({...b.p, y: 0}, {...o.to, y: 0}));
  return {p: b.p, rot: spin * fl + (travelled / 0.05) * 57.3 * (o.roll ?? 0.5), phase: b.rest ? 'rest' : 'bounce', landedAt: o.t0 + fl};
};

// ------------------------------------------------------------------ drawing helpers
export const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
/** Unique, deterministic SVG id for gradients. */
export const gid = (...parts: (string | number)[]) => ('fx_' + parts.join('_')).replace(/[^a-zA-Z0-9_]/g, 'm');

/** A soft radial glow (gradient fill, no blur filter). core = solid inner fraction. */
export const glowEl = (id: string, x: number, y: number, r: number, color: string, opacity: number, core = 0, squash = 1): React.ReactElement | null => {
  if (opacity <= 0.003 || r <= 0.3) return null;
  return (
    <g key={id}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset={`${Math.round(core * 100)}%`} stopColor={color} stopOpacity={core > 0 ? 1 : 0.85} />
          <stop offset="45%" stopColor={color} stopOpacity={0.38} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={f1(x)} cy={f1(y)} rx={f1(r)} ry={f1(r * squash)} fill={`url(#${id})`} opacity={Math.min(1, opacity)} />
    </g>
  );
};

/** Seeded irregular polygon points (screen px) around (x, y). */
export const blobPts = (x: number, y: number, r: number, seed: number, n = 7, rough = 0.32, sx = 1, sy = 1, rot = 0): string => {
  const pts: string[] = [];
  const a0 = rnd(seed * 13) * Math.PI * 2 + rot;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 + (rnd(seed * 7 + i) - 0.5) * 0.5;
    const k = 1 - rough / 2 + rough * rnd(seed * 31 + i * 11);
    pts.push(`${f1(x + Math.cos(a) * r * k * sx)},${f1(y + Math.sin(a) * r * k * sy)}`);
  }
  return pts.join(' ');
};
/** Smooth closed blob path (screen px). */
export const blobPath = (x: number, y: number, r: number, seed: number, n = 7, rough = 0.3, sx = 1, sy = 1, rot = 0): string => {
  const P: {x: number; y: number}[] = [];
  const a0 = rnd(seed * 13) * Math.PI * 2 + rot;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * Math.PI * 2 + (rnd(seed * 7 + i) - 0.5) * 0.5;
    const k = 1 - rough / 2 + rough * rnd(seed * 31 + i * 11);
    P.push({x: x + Math.cos(a) * r * k * sx, y: y + Math.sin(a) * r * k * sy});
  }
  let d = `M${f1((P[0].x + P[n - 1].x) / 2)} ${f1((P[0].y + P[n - 1].y) / 2)}`;
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    d += `Q${f1(a.x)} ${f1(a.y)} ${f1((a.x + b.x) / 2)} ${f1((a.y + b.y) / 2)}`;
  }
  return d + 'Z';
};

/** Spark colour along its life (white-hot → yellow → orange). */
export const sparkCol = (u: number) => (u < 0.3 ? hex(mixRGB(rgb('#FFFBE6'), rgb('#FFD25E'), u / 0.3)) : hex(mixRGB(rgb('#FFD25E'), rgb('#FF6A1F'), clamp((u - 0.3) / 0.7))));

/** Camera-shake suggestion (metres) after an impact of `strength` at t0. */
export const shakeAt = (t: number, t0: number, strength: number, decay = 6) => (t < t0 ? 0 : strength * Math.exp(-decay * (t - t0)));

