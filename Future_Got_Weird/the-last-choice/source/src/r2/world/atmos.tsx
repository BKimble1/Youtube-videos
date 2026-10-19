// Fire, smoke, embers and haze for the battlefield and the city — depth-sorted sprites drawn as flat illustrated shapes
// (no blur filters). Drawing primitives live in atmosDraw.tsx; this file anchors them in the world:
//   - every fire burns on its fuel (fires.ts): debris piles and fuel spills on the ground, wrecked vehicles (the flame
//     bed runs along the body), exposed rooms behind blown-out facades (the room glows and burns inside its opening,
//     flames curl out over the lintel, soot climbs the facade), whole blocks in the wider city (burning windows on
//     several floors, the roof alight, a plume that reaches the smoke ceiling);
//   - every fire has a plume that grows from it, rises, bends north-east with WIND and breaks up with height;
//   - sparse embers rise and drift with the wind near the open fires and cool into ash;
//   - street haze lies in the avenue's corridor only (it never washes a facade), the smoke ceiling hangs at 335–425 m;
//   - DEPTH: a plume or fire behind a building is pushed behind that building in the painter's order (occlusion test
//     against the city's boxes), so a translucent smoke layer never makes an opaque facade look transparent.
//
//   atmosItems(view, t, opts?) → Item[]       add next to setItems()
//   fireLights(t)                              (re-exported from fires.ts) near fires as point lights for the shader
//   smokeColumn(key, base, o, t)               a shot's own smoke column (drawn as a plume)
//   plumeItem(key, spec, t, bias?)             a plume from a PlumeSpec (full control)
//   flameItems(key, pos, o, t) / flameLight    a free-standing fire in the same look (a burning machine, a new fire)
import React from 'react';
import {V3, noise, rnd, clamp, smooth, add3, sub3, mul3, dot3} from '../../kit/math';
import {View, Item, SpriteCtx, mix, project, toView, headingVec, PointLight} from '../engine';
import {FIRES, Fire, fireEnergy, fireLights, burn, kindOf, sootOf, fireLightColor} from './fires';
import {WIND, PLAN} from './plan';
import {towerState} from './set';
import {CITY, Bldg} from './city';
import {M} from '../timing';
import {flameBuf, flameMass, flameEls, flamePalette, billowPath, plumeEl, plumePoint, radiusAt, PlumeSpec, FlameBuf, f1} from './atmosDraw';

export type {PlumeSpec} from './atmosDraw';

// ================================================================== occlusion against the city's buildings
type OBox = {b: Bldg; x0: number; x1: number; z0: number; z1: number; h: number; c: V3; r: number};
let OBOXES: OBox[] | null = null;
const oboxes = (): OBox[] => {
  if (OBOXES) return OBOXES;
  OBOXES = CITY().filter((b) => !b.rubble).map((b) => {
    const c = {x: (b.x0 + b.x1) / 2, y: b.h / 2, z: (b.z0 + b.z1) / 2};
    return {b, x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, h: b.h, c, r: Math.hypot(b.x1 - b.x0, b.h, b.z1 - b.z0) / 2};
  });
  return OBOXES;
};
type Occ = {v: View; list: OBox[]};
/** The buildings in (or near) the view: the only ones that can hide something. */
const occFor = (v: View): Occ => {
  const tx = v.W / 2 / v.focal, ty = v.H / 2 / v.focal, cy = v.sy / v.focal;
  return {
    v,
    list: oboxes().filter((o) => {
      const q = toView(v, o.c);
      if (q.z < -o.r) return false;
      return Math.abs(q.x) - o.r < q.z * tx * 1.1 + o.r && Math.abs(q.y - q.z * cy) - o.r < q.z * ty * 1.1 + o.r;
    }),
  };
};
/** Does the segment camera → p pass through box o before reaching p? */
const segHits = (a: V3, p: V3, o: OBox): boolean => {
  let t0 = 0.001, t1 = 0.995;
  const ax = [a.x, a.y, a.z], dd = [p.x - a.x, p.y - a.y, p.z - a.z], lo = [o.x0, 0, o.z0], hi = [o.x1, o.h, o.z1];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(dd[i]) < 1e-9) { if (ax[i] < lo[i] || ax[i] > hi[i]) return false; continue; }
    let ta = (lo[i] - ax[i]) / dd[i], tb = (hi[i] - ax[i]) / dd[i];
    if (ta > tb) { const s = ta; ta = tb; tb = s; }
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return false;
  }
  return true;
};
/** The deepest painter key any camera-facing face of box o can have (its farthest visible corner). */
const farDepth = (v: View, o: OBox) => {
  const c = v.pos;
  const vis = [c.z < o.z0, c.z > o.z1, c.x < o.x0, c.x > o.x1, c.y > o.h];
  let m = -Infinity;
  for (let xi = 0; xi < 2; xi++) for (let zi = 0; zi < 2; zi++) for (let yi = 0; yi < 2; yi++) {
    if (!((zi === 0 && vis[0]) || (zi === 1 && vis[1]) || (xi === 0 && vis[2]) || (xi === 1 && vis[3]) || (yi === 1 && vis[4]))) continue;
    const q = toView(v, {x: xi ? o.x1 : o.x0, y: yi ? o.h : 0, z: zi ? o.z1 : o.z0});
    if (q.z > m) m = q.z;
  }
  return m;
};
/**
 * Painter bias for an item at `pos`: `base`, lowered when a building stands between the camera and any probe point,
 * so the item is drawn BEFORE that building and the building's opaque faces cover it.
 */
const occBias = (occ: Occ, pos: V3, probes: V3[], base: number, skip?: Bldg): number => {
  const v = occ.v, cam = v.pos;
  let need = -Infinity;
  for (const o of occ.list) {
    if (o.b === skip) continue;
    for (const p of probes) {
      const dx = p.x - cam.x, dy = p.y - cam.y, dz = p.z - cam.z;
      const L = Math.hypot(dx, dy, dz) || 1;
      const ox = o.c.x - cam.x, oy = o.c.y - cam.y, oz = o.c.z - cam.z;
      const tt = (ox * dx + oy * dy + oz * dz) / L;
      if (tt < -o.r || tt > L + o.r) continue;
      if (ox * ox + oy * oy + oz * oz - tt * tt > o.r * o.r) continue;
      if (segHits(cam, p, o)) { need = Math.max(need, farDepth(v, o)); break; }
    }
  }
  if (need === -Infinity) return base;
  return Math.min(base, toView(v, pos).z - need - 0.3);
};

/** True when every probe point is hidden behind some building (the item can be skipped altogether). */
const allHidden = (occ: Occ, probes: V3[], skip?: Bldg): boolean => probes.every((p) => occ.list.some((o) => o.b !== skip && segHits(occ.v.pos, p, o)));

// ================================================================== shared bits
/** Screen lean of flames and licks with the wind (screen-x per unit of height). */
const leanOf = (v: View) => clamp(dot3(WIND, v.r) * 0.35, -0.4, 0.4);
const detailOf = (Hpx: number): 0 | 1 | 2 => (Hpx < 7 ? 0 : Hpx < 28 ? 1 : 2);
type Mass = {p: V3; w: number; h: number; seed: number};

/** A sprite drawing flame masses at world points (each projected with its own scale). */
const massSprite = (key: string, pos: V3, bias: number, masses: Mass[], f: {seed: number; heat?: number; id: string}, t: number, e: number, lean: number, glowK = 1): Item => ({
  kind: 'sprite', key, pos, bias,
  draw: (c: SpriteCtx) => {
    const b = flameBuf();
    let Hmax = 0, x0 = 1e9, x1 = -1e9, yb = -1e9, ytop = 1e9;
    masses.forEach((m) => {
      const q = m.p === pos ? c : project(c.view, m.p);
      if (q.z < c.view.near) return;
      const H = m.h * q.k * e, W = m.w * q.k;
      if (H < 1.1) return;
      flameMass(b, q.x, q.y, W, H, m.seed, t, lean, detailOf(H));
      Hmax = Math.max(Hmax, H);
      x0 = Math.min(x0, q.x - W / 2); x1 = Math.max(x1, q.x + W / 2); yb = Math.max(yb, q.y); ytop = Math.min(ytop, q.y - H);
    });
    if (Hmax <= 0) return null;
    const P = flamePalette(f.heat ?? 0, c.light.fogColor, c.lit.fog * 0.45);
    const gw = Math.max((x1 - x0) * 0.75, Hmax * 0.8);
    return flameEls(b, key, (x0 + x1) / 2, yb, yb - ytop, P, {rx: gw, ry: Hmax * 0.85, op: 0.3 * glowK * Math.min(1.2, e) * (1 - c.lit.fog * 0.6)});
  },
});

// ================================================================== ground, spill and vehicle fires
const groundMasses = (f: Fire): Mass[] => {
  const kind = kindOf(f);
  const W = f.size * (f.spread ?? 1.3) * 0.6;
  if (kind === 'opening') {
    // an exposed floor edge: flames along the edge, just outside the face
    const n = f.normal ?? {x: 0, y: 1, z: 0};
    const hn = Math.hypot(n.x, n.z);
    const ax = hn > 0.3 ? {x: -n.z / hn, y: 0, z: n.x / hn} : {x: 1, y: 0, z: 0};
    const o = hn > 0.3 ? add3(f.pos, mul3({x: n.x / hn, y: 0, z: n.z / hn}, 0.4)) : f.pos;
    return [-1, 0, 1].map((k, i) => ({p: add3(o, mul3(ax, k * f.size * 0.62)), w: f.size * 0.85, h: f.size * (0.6 + 0.45 * rnd(f.seed * 3 + i)) * (k === 0 ? 1 : 0.8), seed: f.seed * 7 + i}));
  }
  if (kind === 'vehicle') {
    const ax = headingVec(f.heading ?? 0), len = f.len ?? 4.2;
    const n = clamp(Math.round(len / 2.6), 2, 3);
    return Array.from({length: n}, (_, i) => {
      const u = (i + 0.5) / n - 0.5;
      const mid = 1 - Math.abs(u) * 1.1;
      return {p: add3(f.pos, mul3(ax, u * len * 0.8)), w: (len / n) * 1.3, h: f.size * (0.55 + 0.45 * mid) * (0.8 + 0.35 * rnd(f.seed * 5 + i)), seed: f.seed * 7 + i};
    });
  }
  if (kind === 'spill') {
    const ax = headingVec(55 + rnd(f.seed) * 60);
    return [-1, 0, 1].map((k, i) => ({p: add3(f.pos, mul3(ax, k * W * 0.45)), w: W * 0.55, h: f.size * (0.6 + 0.5 * rnd(f.seed * 3 + i)), seed: f.seed * 7 + i}));
  }
  const out: Mass[] = [{p: f.pos, w: W, h: f.size, seed: f.seed}];
  if (f.size > 2.5) {
    // a big debris fire: a second, lower mass beside the main one (the pile burns unevenly)
    const a = rnd(f.seed * 9) * Math.PI * 2;
    out.push({p: add3(f.pos, {x: Math.cos(a) * W * 0.55, y: -0.1, z: Math.sin(a) * W * 0.55}), w: W * 0.6, h: f.size * 0.5, seed: f.seed * 7 + 5});
  }
  return out;
};

/** The building a fire names as its anchor (exposed floors of a broken corner, …). */
const ANCH = new Map<string, Bldg | undefined>();
const anchorBldg = (f: Fire): Bldg | undefined => {
  if (!f.anchor) return undefined;
  if (!ANCH.has(f.id)) ANCH.set(f.id, CITY().find((b) => b.id === f.anchor));
  return ANCH.get(f.id);
};

// ================================================================== rooms behind blown-out facades
type RoomGeo = {b: Bldg; O: V3; U: V3; N: V3; W: number; u0: number; u1: number; y0: number; y1: number; yt: number; storey: number};
const FRAME = (b: Bldg, side: 'N' | 'S' | 'E' | 'W') => {
  switch (side) {
    case 'S': return {O: {x: b.x0, y: 0, z: b.z1}, U: {x: 1, y: 0, z: 0}, N: {x: 0, y: 0, z: 1}, W: b.x1 - b.x0};
    case 'N': return {O: {x: b.x1, y: 0, z: b.z0}, U: {x: -1, y: 0, z: 0}, N: {x: 0, y: 0, z: -1}, W: b.x1 - b.x0};
    case 'E': return {O: {x: b.x1, y: 0, z: b.z1}, U: {x: 0, y: 0, z: -1}, N: {x: 1, y: 0, z: 0}, W: b.z1 - b.z0};
    default: return {O: {x: b.x0, y: 0, z: b.z0}, U: {x: 0, y: 0, z: 1}, N: {x: -1, y: 0, z: 0}, W: b.z1 - b.z0};
  }
};
const fp = (g: {O: V3; U: V3; N: V3}, u: number, y: number, d = 0): V3 => ({x: g.O.x + g.U.x * u + g.N.x * d, y, z: g.O.z + g.U.z * u + g.N.z * d});
const ROOMS = new Map<string, RoomGeo | null>();
/** The opening city.ts cut for a room fire (same match rule as placeOpenings), or null. */
const roomGeo = (f: Fire): RoomGeo | null => {
  if (ROOMS.has(f.id)) return ROOMS.get(f.id)!;
  // the opening cut BY this fire (city.ts tags it), else the one in the frontage building at the fire (R2 rule)
  type Op = NonNullable<Bldg['opening']>;
  const ops = (q: Bldg): Op[] => [q.opening, ...(((q as {holes?: Op[]}).holes) ?? [])].filter(Boolean) as Op[];
  let b: Bldg | undefined, op: Op | undefined;
  for (const q of CITY()) {
    const o = ops(q).find((x) => (x as {by?: string}).by === f.id);
    if (o) { b = q; op = o; break; }
  }
  if (!b) {
    b = CITY().find((q) => q.zone === 'front' && !q.rubble && q.opening && f.pos.x >= q.x0 - 1 && f.pos.x <= q.x1 + 1 && f.pos.z >= q.z0 - 4 && f.pos.z <= q.z1 + 4);
    // two fires in one building share its opening only if no other fire already claimed it
    if (b && b.opening && [...ROOMS.values()].some((g) => g && g.b === b && g.y0 === b!.opening!.y0 && g.u0 === b!.opening!.u0)) b = undefined;
    op = b?.opening;
  }
  let g: RoomGeo | null = null;
  if (b && op) {
    const F = FRAME(b, b.front);
    g = {b, ...F, u0: op.u0, u1: op.u1, y0: op.y0, y1: op.y1, yt: b.crown ? b.crown.low : b.h, storey: b.storey};
  }
  ROOMS.set(f.id, g);
  return g;
};

const roomFire = (f: Fire, g: RoomGeo, t: number, e: number, lean: number, occ: Occ, drawFlames: boolean): Item[] => {
  const v = occ.v;
  const uc = (g.u0 + g.u1) / 2, yc = (g.y0 + g.y1) / 2;
  const pos = fp(g, uc, yc, 0.3);
  if (dot3(g.N, sub3(v.pos, pos)) <= 0.05) return []; // the facade faces away: the room is hidden by its own building
  if (allHidden(occ, [fp(g, g.u0, g.y0, 0.3), fp(g, g.u1, g.y0, 0.3), fp(g, uc, g.y1 + g.storey * 1.2, 0.5)], g.b)) return [];
  // drawn after the facade cell above the opening (the flames lick over it), before any other building in front
  const top = fp(g, uc, (g.y1 + g.yt) / 2, 0);
  let bias = Math.max(0.35, toView(v, pos).z - toView(v, top).z + 0.35);
  bias = occBias(occ, pos, [pos, fp(g, uc, g.y1 + g.storey, 0.5)], bias, g.b);
  if (!drawFlames) return [];
  const id = f.id;
  return [{
    kind: 'sprite', key: `fire_${id}`, pos, bias, noCull: true,
    draw: (c: SpriteCtx) => {
      const vw = c.view;
      const Q = [fp(g, g.u0, g.y0, 0.03), fp(g, g.u1, g.y0, 0.03), fp(g, g.u1, g.y1, 0.03), fp(g, g.u0, g.y1, 0.03)].map((p) => project(vw, p));
      if (Q.some((q) => q.z < vw.near)) return null;
      const xs = Q.map((q) => q.x), ys = Q.map((q) => q.y);
      if (Math.max(...xs) < -100 || Math.min(...xs) > vw.W + 100 || Math.max(...ys) < -300 || Math.min(...ys) > vw.H + 100) return null;
      const ow = Math.hypot(Q[1].x - Q[0].x, Q[1].y - Q[0].y), oh = Math.hypot(Q[3].x - Q[0].x, Q[3].y - Q[0].y);
      if (ow < 1.2 && oh < 1.2) return null;
      const quad = `M${Q.map((q) => `${f1(q.x)} ${f1(q.y)}`).join('L')}Z`;
      const fogK = c.lit.fog;
      const P = flamePalette(f.heat ?? 0, c.light.fogColor, fogK * 0.45);
      const gid = `rm_${id}`;
      // the room: glowing back, flames on each floor inside (clipped to the opening)
      const inner = flameBuf();
      const kc = Q[0].k;
      for (let yy = g.y0 + 0.05, k = 0; yy < g.y1 - 0.9; yy += g.storey, k++) {
        const u = uc + (rnd(f.seed * 3 + k) - 0.5) * (g.u1 - g.u0) * 0.3;
        const q = project(vw, fp(g, u, yy, -1.8));
        if (q.z < vw.near) continue;
        const Hs = g.storey * (0.75 + 0.3 * rnd(f.seed * 5 + k)) * e * q.k;
        flameMass(inner, q.x, q.y, (g.u1 - g.u0) * 0.9 * q.k, Hs, f.seed * 13 + k, t, 0, Hs < 7 ? 0 : 1);
      }
      // outside: flames curling out over the lintel and up the facade
      const outer = flameBuf();
      const nM = clamp(Math.round((g.u1 - g.u0) / 4), 1, 3);
      let Hmax = 0;
      for (let i = 0; i < nM; i++) {
        const u = g.u0 + (g.u1 - g.u0) * (0.12 + 0.76 * (i + 0.5) / nM);
        const q = project(vw, fp(g, u, g.y1 - g.storey * 0.5, 0.25));
        if (q.z < vw.near) continue;
        const Hh = f.size * (0.65 + 0.55 * rnd(f.seed * 17 + i)) * e * q.k;
        Hmax = Math.max(Hmax, Hh);
        flameMass(outer, q.x, q.y, ((g.u1 - g.u0) / nM) * 0.95 * q.k, Hh, f.seed * 19 + i, t, lean * 0.35, detailOf(Hh));
      }
      outer.bed = ''; // these spring from the room behind the lintel: no fuel bed of their own
      // soot climbing the facade above the opening (static, seeded)
      const S: V3[] = [];
      const sw = (g.u1 - g.u0) * 0.5, sh = g.storey * 2.6;
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        S.push(fp(g, uc - sw * (1.12 - 0.55 * k) + (rnd(f.seed * 23 + i) - 0.5) * sw * 0.3, g.y1 - 0.1 + sh * k * (0.85 + 0.3 * rnd(f.seed * 29 + i)), 0.04));
      }
      for (let i = n; i >= 0; i--) {
        const k = i / n;
        S.push(fp(g, uc + sw * (1.12 - 0.55 * k) + (rnd(f.seed * 31 + i) - 0.5) * sw * 0.3, g.y1 - 0.1 + sh * k * (0.8 + 0.3 * rnd(f.seed * 37 + i)), 0.04));
      }
      const SP = S.map((p) => project(vw, p));
      const sootD = SP.some((q) => q.z < vw.near) ? '' : `M${SP.map((q) => `${f1(q.x)} ${f1(q.y)}`).join('L')}Z`;
      const sootC = mix('#1C1615', c.light.fogColor, fogK * 0.85);
      const bot = {x: (Q[0].x + Q[1].x) / 2, y: (Q[0].y + Q[1].y) / 2}, tp = {x: (Q[2].x + Q[3].x) / 2, y: (Q[2].y + Q[3].y) / 2};
      const flick = 0.85 + 0.15 * noise(t * 3.1 + f.seed, f.seed + 2);
      return (
        <g>
          <defs>
            <clipPath id={`${gid}c`}><path d={quad} /></clipPath>
            <linearGradient id={`${gid}g`} x1={f1(bot.x)} y1={f1(bot.y)} x2={f1(tp.x)} y2={f1(tp.y)} gradientUnits="userSpaceOnUse">
              <stop offset={0} stopColor={P.core} />
              <stop offset={0.35} stopColor={P.mid} />
              <stop offset={1} stopColor={P.base} />
            </linearGradient>
          </defs>
          {sootD && <path d={sootD} fill={sootC} opacity={0.5} />}
          <path d={quad} fill={`url(#${gid}g)`} opacity={f1(0.62 * Math.min(1.1, e) * flick)} />
          {kc * g.storey > 6 && <g clipPath={`url(#${gid}c)`}>{flameEls(inner, `${id}i`, bot.x, bot.y, oh, P)}</g>}
          {Hmax > 0 && flameEls(outer, `${id}o`, (Q[2].x + Q[3].x) / 2, (Q[2].y + Q[3].y) / 2 + oh * 0.2, Hmax, P, {rx: Math.max(ow * 0.9, Hmax), ry: Math.max(oh, Hmax) * 0.9, op: 0.26 * e * (1 - fogK * 0.6), cy: (bot.y + tp.y) / 2})}
        </g>
      );
    },
  }];
};

// ================================================================== burning blocks in the wider city
type BlockGeo = {b: Bldg; h: number; yA: number; yB: number; roof: boolean};
const BLOCKS = new Map<string, BlockGeo | null>();
const blockGeo = (f: Fire): BlockGeo | null => {
  if (BLOCKS.has(f.id)) return BLOCKS.get(f.id)!;
  let best: Bldg | null = null, bd = 1e9;
  CITY().forEach((b) => {
    if (b.rubble || b.opening || b.h < 16) return;
    const dx = Math.max(b.x0 - f.pos.x, 0, f.pos.x - b.x1), dz = Math.max(b.z0 - f.pos.z, 0, f.pos.z - b.z1);
    const d = Math.hypot(dx, dz) - b.h * 0.02;
    if (d < bd) { bd = d; best = b; }
  });
  let g: BlockGeo | null = null;
  if (best && bd < 60) {
    const b = best as Bldg;
    const h = b.crown ? b.crown.low : b.h;
    const [lo, hi] = f.floors ?? [0.5, 1];
    g = {b, h, yA: Math.max(4, h * lo), yB: h * Math.min(1, hi), roof: hi >= 0.98};
  }
  BLOCKS.set(f.id, g);
  return g;
};
/** The world position a block fire burns at (roof centre of its building), for plumes and callers. */
export const fireAnchor = (f: Fire): V3 => {
  if (kindOf(f) === 'block') {
    const g = blockGeo(f);
    if (g) return {x: (g.b.x0 + g.b.x1) / 2, y: g.yB, z: (g.b.z0 + g.b.z1) / 2};
  }
  if (kindOf(f) === 'room') {
    const g = roomGeo(f);
    if (g) return fp(g, (g.u0 + g.u1) / 2, g.y1, 0.6);
  }
  return f.pos;
};

/** Window grid of a facade, as city.ts lays it out (so the burning windows sit on the drawn ones). */
const windowGrid = (b: Bldg, W: number) => {
  const glassy = b.kind === 'glass' || b.kind === 'tower';
  const bay = glassy ? 3.0 : b.kind === 'modern' ? 3.6 : 3.1;
  const ww = glassy ? 2.6 : b.kind === 'modern' ? 2.9 : 1.35, wh = glassy ? 2.6 : b.kind === 'modern' ? 1.5 : 1.85;
  const nb = Math.max(1, Math.floor((W - 0.8) / bay));
  const off = (W - nb * bay) / 2;
  return {bay, ww, wh, nb, off};
};

const blockFire = (f: Fire, g: BlockGeo, t: number, e: number, lean: number, occ: Occ): Item[] => {
  const v = occ.v;
  const b = g.b;
  const out: Item[] = [];
  (['N', 'S', 'E', 'W'] as const).forEach((side) => {
    const F = FRAME(b, side);
    const fc = fp(F, F.W / 2, g.h / 2, 0);
    if (dot3(F.N, sub3(v.pos, fc)) <= 0) return;
    const pos = fp(F, F.W / 2, (g.yA + g.yB) / 2, 0.4);
    // a facade wholly behind other buildings (its middle, its corners and the tips of its roof fire) is not drawn at all
    const hiddenProbes = [pos, fp(F, F.W * 0.08, g.yB, 0.5), fp(F, F.W * 0.92, g.yB, 0.5), fp(F, F.W / 2, g.yB + (g.roof ? f.size * 0.8 : 1), 0.5), fp(F, F.W * 0.1, g.yA + 1, 0.5), fp(F, F.W * 0.9, g.yA + 1, 0.5)];
    if (allHidden(occ, hiddenProbes, b)) return;
    let bias = Math.max(0.3, toView(v, pos).z - toView(v, fc).z + 0.3);
    bias = occBias(occ, pos, [pos, fp(F, F.W / 2, g.yB, 0.5)], bias, b);
    const key = `blk_${f.id}_${side}`;
    out.push({
      kind: 'sprite', key, pos, bias, noCull: true,
      draw: (c: SpriteCtx) => {
        const vw = c.view;
        const A = project(vw, fp(F, 0, g.yA)), B = project(vw, fp(F, F.W, g.yA)), C = project(vw, fp(F, F.W, g.yB)), D = project(vw, fp(F, 0, g.yB));
        if ([A, B, C, D].some((q) => q.z < vw.near)) return null;
        const minX = Math.min(A.x, B.x, C.x, D.x), maxX = Math.max(A.x, B.x, C.x, D.x), minY = Math.min(A.y, B.y, C.y, D.y), maxY = Math.max(A.y, B.y, C.y, D.y);
        if (maxX < -80 || minX > vw.W + 80 || maxY < -400 || minY > vw.H + 80) return null;
        const fw = Math.hypot(B.x - A.x, B.y - A.y);
        if (fw < 1.5) return null;
        const fogK = c.lit.fog;
        const P = flamePalette(f.heat ?? 0, c.light.fogColor, fogK * 0.45);
        const winHot = mix('#FFC45E', c.light.fogColor, fogK * 0.4), winWarm = mix('#E2632A', c.light.fogColor, fogK * 0.45), winDead = mix('#1D1616', c.light.fogColor, fogK * 0.85);
        const storeyPx = Math.abs(project(vw, fp(F, F.W / 2, g.yA + b.storey)).y - project(vw, fp(F, F.W / 2, g.yA)).y);
        const buf = flameBuf();
        let hot = '', warm = '', dead = '';
        let Hmax = 0;
        const fmt = (n: number) => (storeyPx < 12 ? Math.round(n).toString() : f1(n));
        const quadD = (pts: V3[]) => {
          const S = pts.map((p) => project(vw, p));
          return `M${S.map((q) => `${fmt(q.x)} ${fmt(q.y)}`).join('L')}Z`;
        };
        const span = g.yB - g.yA;
        if (storeyPx >= 3.2) {
          // windows: the fire front climbs (upper burning floors hottest), some windows gutted dark, flames from many
          const G = windowGrid(b, F.W);
          let nWin = 0;
          const cand: {cu: number; yy: number; hk: number; s: number}[] = [];
          for (let y = 0.8, row = 0; y + G.wh < g.yB - 0.4; y += b.storey, row++) {
            if (y < g.yA) continue;
            const hk = clamp((y - g.yA) / Math.max(1, span));
            for (let i = 0; i < G.nb && nWin < 220; i++, nWin++) {
              const s = f.seed * 977 + row * 131 + i * 7 + (side.charCodeAt(0) * 13);
              const cu = G.off + G.bay * (i + 0.5);
              const yy = y + (b.storey - G.wh) * 0.45;
              const r = rnd(s); // a window's state is fixed (no window flips back from burning to dark); its flames move
              const pts = [fp(F, cu - G.ww / 2, yy, 0.04), fp(F, cu + G.ww / 2, yy, 0.04), fp(F, cu + G.ww / 2, yy + G.wh, 0.04), fp(F, cu - G.ww / 2, yy + G.wh, 0.04)];
              if (r < 0.16 + 0.1 * (1 - hk)) { dead += quadD(pts); continue; }
              const burning = r < 0.62 + 0.3 * hk;
              if (burning) hot += quadD(pts); else warm += quadD(pts);
              if (burning && rnd(s + 1) < 0.35 + 0.4 * hk) cand.push({cu, yy, hk, s});
            }
          }
          // flames licking out of the hottest windows (upper burning floors first; never a flame on every window)
          if (storeyPx >= 2.5) {
            cand.sort((p0, p1) => p1.hk + rnd(p1.s + 3) * 0.3 - (p0.hk + rnd(p0.s + 3) * 0.3));
            cand.slice(0, storeyPx > 9 ? 22 : 12).forEach(({cu, yy, hk, s}) => {
              const q = project(vw, fp(F, cu, yy + G.wh * 0.85, 0.3));
              const H = b.storey * (0.55 + 0.9 * rnd(s + 2)) * (0.7 + 0.5 * hk) * e * q.k;
              Hmax = Math.max(Hmax, H);
              flameMass(buf, q.x, q.y, G.ww * 1.35 * q.k, H, s, t, lean, H < 9 ? 0 : 1);
            });
          }
        } else {
          // far: one glowing band per burning storey (or per two), flames along their tops
          const step = storeyPx < 1.4 ? b.storey * 2 : b.storey;
          for (let y = g.yA, row = 0; y + 1.2 < g.yB; y += step, row++) {
            const s = f.seed * 577 + row * 17;
            const a = 0.04 + rnd(s) * 0.25, z = 0.96 - rnd(s + 1) * 0.25;
            const pts = [fp(F, F.W * a, y + 0.5, 0.04), fp(F, F.W * z, y + 0.5, 0.04), fp(F, F.W * z, y + Math.min(step, b.storey) * 0.7, 0.04), fp(F, F.W * a, y + Math.min(step, b.storey) * 0.7, 0.04)];
            if (rnd(s + 2) < 0.18) { dead += quadD(pts); continue; }
            if (rnd(s + 3) < 0.55) hot += quadD(pts); else warm += quadD(pts);
            const nF = clamp(Math.round(F.W / 14), 1, 3);
            for (let i = 0; i < nF; i++) {
              if (rnd(s + 7 + i) < 0.4) continue;
              const q = project(vw, fp(F, F.W * (a + (z - a) * (i + 0.5) / nF), y + step * 0.6, 0.3));
              const H = b.storey * (0.8 + rnd(s + 9 + i)) * e * q.k;
              Hmax = Math.max(Hmax, H);
              flameMass(buf, q.x, q.y, (F.W * (z - a) / nF) * 0.9 * q.k, H, s + i, t, lean, H < 7 ? 0 : 1);
            }
          }
        }
        if (g.roof) {
          // the roof alight: big flames along the roofline
          const nR = clamp(Math.round(F.W / 9), 2, 4);
          for (let i = 0; i < nR; i++) {
            const s = f.seed * 313 + i * 11 + side.charCodeAt(0);
            const u = F.W * ((i + 0.5) / nR + (rnd(s) - 0.5) * 0.12);
            const q = project(vw, fp(F, u, g.h - 0.3, -1.5));
            if (q.z < vw.near) continue;
            const H = f.size * (0.5 + 0.6 * rnd(s + 1)) * e * q.k;
            Hmax = Math.max(Hmax, H);
            flameMass(buf, q.x, q.y, (F.W / nR) * 1.5 * q.k, H, s, t, lean, H < 7 ? 0 : H < 80 ? 1 : 2);
          }
        }
        const cx = (A.x + B.x + C.x + D.x) / 4, cyy = (A.y + B.y + C.y + D.y) / 4;
        const glowR = Math.max(fw * 0.62, (maxY - minY) * 0.7);
        return (
          <g>
            {dead && <path d={dead} fill={winDead} />}
            {warm && <path d={warm} fill={winWarm} />}
            {hot && <path d={hot} fill={winHot} />}
            {flameEls(buf, key, cx, maxY, Math.max(Hmax, maxY - minY), P, {rx: glowR, ry: Math.max(glowR * 0.6, (maxY - minY) * 0.8 + Hmax * 0.5), op: 0.22 * e * (1 - fogK * 0.5), cy: cyy - Hmax * 0.2})}
          </g>
        );
      },
    });
  });
  return out;
};

// ================================================================== plumes
/** A plume as a depth-sorted sprite (sorted at its source; pushed behind any building that hides part of it). */
export const plumeItem = (key: string, p: PlumeSpec, t: number, bias = -0.2, occ?: Occ, skip?: Bldg): Item | null => {
  const pos = plumePoint(p, 0.05, t);
  let b = bias;
  if (occ) {
    const probes = [plumePoint(p, 0, t), plumePoint(p, 0.45, t), plumePoint(p, 0.9, t), plumePoint(p, 1.25, t)];
    // (R4) a plume is as wide as its billows: it is skipped only when the spine AND its flanks (a billow radius to each side
    // and above) are all behind buildings. Testing the spine alone dropped a whole column in one frame while its billows still
    // showed round the building in front of its spine (A1 f161: the column above the tilting tower vanished).
    const flank = (s: number): V3[] => {
      const c = plumePoint(p, s, t), r = radiusAt(p, s) * 1.1;
      const d = sub3(c, occ.v.pos), lh = Math.hypot(d.z, d.x) || 1;
      const lat = {x: -d.z / lh, y: 0, z: d.x / lh};
      return [add3(c, mul3(lat, r)), add3(c, mul3(lat, -r)), add3(c, {x: 0, y: r, z: 0})];
    };
    const wide = [...probes, ...[0, 0.45, 0.9, 1.25].flatMap(flank)];
    if (allHidden(occ, wide, skip)) return null;
    // (and the same flanks decide the plume's order against a building: the plume goes behind a building as soon as that building
    // is in front of any part of its width, not only of its spine — the order flipped as a billow's edge crossed a building's edge)
    b = occBias(occ, pos, [...probes.slice(0, 3), ...wide.slice(4, 13)], bias, skip);
  }
  return {kind: 'sprite', key, pos, bias: b, noCull: true, draw: (c: SpriteCtx) => plumeEl(c, p, t, key)};
};

/** The plume of a fire: from its flame tips, its density and colour by what burns. */
const firePlume = (f: Fire, t: number, k: number): PlumeSpec | null => {
  const S = f.smoke ?? 0;
  if (S <= 0 || k <= 0) return null;
  const kind = kindOf(f);
  const g = f.from !== undefined ? clamp((t - f.from) / 14) : 1;
  if (g <= 0) return null;
  if (kind === 'block') {
    const bg = blockGeo(f);
    if (!bg) return null;
    const b = bg.b;
    const W = Math.max(b.x1 - b.x0, b.z1 - b.z0);
    // an engulfed block feeds a column that reaches the smoke ceiling; a block burning on a floor or two, a lesser one
    const big = bg.roof;
    const rise = big ? 115 + 32 * S : 40 + 12 * S;
    return {
      base: {x: (b.x0 + b.x1) / 2, y: (big ? bg.yB : bg.yB + 2) + f.size * 0.3, z: (b.z0 + b.z1) / 2}, rise, drift: rise * (big ? 0.8 : 1.1),
      r0: clamp(W * (big ? 0.3 : 0.18), 4, 14), r1: big ? 18 + 7 * S : 7 + 2.5 * S, soot: clamp(sootOf(f) + (rnd(f.seed * 3) - 0.5) * 0.3), alpha: (big ? 0.95 : 0.9) * k, warm: big ? 0.3 : 0.15,
      speed: big ? 4 + S : 2.5, grow: g, seed: f.seed, tail: 0.45,
    };
  }
  let base = add3(f.pos, {x: 0, y: f.size * 0.7, z: 0});
  if (kind === 'opening' && f.normal) base = add3(base, mul3({x: f.normal.x, y: 0, z: f.normal.z}, 1.2));
  if (kind === 'room') {
    const rg = roomGeo(f);
    if (!rg) return null;
    base = fp(rg, (rg.u0 + rg.u1) / 2, rg.y1 + f.size * 0.55, 0.9);
  }
  const rise = 6 + 16 * S;
  const oily = kind === 'vehicle' || kind === 'spill';
  return {
    base, rise, drift: rise * 0.85, r0: clamp(f.size * 0.3, 0.35, 2.4), r1: oily ? 1.8 + 3.4 * S : 2.2 + 4 * S,
    soot: clamp(sootOf(f) + (rnd(f.seed * 3) - 0.5) * 0.12), alpha: (0.7 + 0.25 * Math.min(1, S)) * k, warm: 0.5, speed: 1.3 + 0.9 * S, grow: g, seed: f.seed, tail: 0.4,
  };
};

// ================================================================== embers and ash
/**
 * Sparse embers from the open fires near the camera: they leave the flames, rise on the heat, swirl, drift with the
 * wind and cool from yellow to red; the last part of a life is a grey flake of ash sinking slowly. Short streaks along
 * their motion (no glow discs).
 */
const embers = (view: View, t: number, ashK: number): Item[] => {
  const out: Item[] = [];
  FIRES.forEach((f) => {
    const kind = kindOf(f);
    if (kind === 'block' || kind === 'room') return;
    const d = Math.hypot(f.pos.x - view.pos.x, f.pos.y - view.pos.y, f.pos.z - view.pos.z);
    if (d > 75) return;
    const e = fireEnergy(f, t);
    if (e <= 0.05) return;
    const n = Math.round((2 + f.size * 2.2) * (d < 30 ? 1 : 0.6));
    const W = f.size * (f.spread ?? 1.3) * 0.6;
    for (let i = 0; i < n; i++) {
      const s = f.seed * 211 + i * 3;
      const life = 2.4 + rnd(s) * 2.6;
      const ph = rnd(s + 1);
      const cyc = Math.floor(t / life + ph);
      const age = (t / life + ph - cyc) * life;
      const ss = s + cyc * 7919; // a new ember each cycle (new start point, new path)
      const k = age / life;
      const at = (a: number): V3 => {
        const up = (1.1 + rnd(ss + 3) * 1.6) * (1 - Math.exp(-1.6 * a)) / 1.6 * 1.6;
        const sink = a > life * 0.7 ? (a - life * 0.7) * 0.25 : 0;
        return {
          x: f.pos.x + (rnd(ss + 2) - 0.5) * W + WIND.x * Math.pow(a, 1.25) * 1.5 + noise(t * 0.9 + ss * 0.1, ss % 97) * 0.5 * a,
          y: f.pos.y + f.size * (0.25 + 0.5 * rnd(ss + 4)) + up - sink,
          z: f.pos.z + (rnd(ss + 5) - 0.5) * W * 0.6 + WIND.z * Math.pow(a, 1.25) * 1.5 + noise(t * 0.8 + ss * 0.1, (ss % 89) + 5) * 0.5 * a,
        };
      };
      const p = at(age), p0 = at(Math.max(0, age - 0.07));
      const ash = k > 0.72;
      if (ash && (ashK <= 0 || d > 40)) continue;
      out.push({
        kind: 'sprite', key: `emb_${f.id}_${i}`, pos: p,
        draw: (c) => {
          const q0 = project(c.view, p0);
          if (q0.z < c.view.near) return null;
          const w = clamp(0.03 * c.k, 0.7, 2.4);
          if (ash) {
            const r = clamp(0.035 * c.k, 0.6, 2.6);
            const rot = (t * 160 + rnd(ss) * 360) % 360;
            return <rect x={f1(c.x - r)} y={f1(c.y - r * 0.4)} width={f1(r * 2)} height={f1(r * 0.8)} fill={mix('#5C5552', c.light.fogColor, c.lit.fog * 0.8)} opacity={f1(ashK * 0.75 * (1 - (k - 0.72) / 0.28))} transform={`rotate(${f1(rot)} ${f1(c.x)} ${f1(c.y)})`} />;
          }
          const col = k < 0.25 ? '#FFE28A' : k < 0.5 ? '#FFB04A' : '#E8582A';
          const a = (1 - k * 0.6) * (0.55 + 0.45 * noise(t * 11 + ss, ss));
          return <line x1={f1(q0.x)} y1={f1(q0.y)} x2={f1(c.x)} y2={f1(c.y)} stroke={col} strokeWidth={f1(w)} strokeLinecap="round" opacity={f1(a)} />;
        },
      });
    }
  });
  return out;
};

// ================================================================== street haze (inside the avenue's corridor only)
/**
 * Low smoke lying in the streets, as soft curtains across the avenue between its facades (and beyond the west ruin).
 * A curtain spans exactly the street, so it hazes what is BEHIND it down the corridor and never washes over a facade
 * beside it. Made for ground-level views; it fades out as the camera rises (the shader's ground haze takes over).
 */
const HAZE_X: [number, number, number][] = [
  [-80, 30, 6], [-46, 26, 4.5], [34, 19, 2.6], [64, 19, 3.0], [100, 19, 3.4], [138, 19, 3.8], [182, 19, 4.4], [236, 19, 5.2],
  [300, 19, 6.2], [376, 19, 7.4], [468, 19, 8.8], [580, 19, 10.5], [720, 19, 12.5], [900, 19, 15], [1120, 19, 18],
];
const hazeCurtains = (v: View, t: number, density: number): Item[] => {
  const hk = density * (1 - smooth((v.pos.y - 16) / 34));
  if (hk <= 0.02) return [];
  const out: Item[] = [];
  HAZE_X.forEach(([x, hw, h], i) => {
    const pos = {x, y: h * 0.3, z: 0};
    const dz = toView(v, pos).z;
    if (dz < 14) return;
    const near = smooth((dz - 14) / 30);
    const hh = h * (1 + 0.15 * noise(t * 0.05 + i * 1.3, i));
    out.push({
      kind: 'sprite', key: `haze_${i}`, pos, noCull: true,
      draw: (c) => {
        const S = [{x, y: 0, z: -hw}, {x, y: 0, z: hw}, {x, y: hh, z: hw}, {x, y: hh, z: -hw}].map((p) => project(c.view, p));
        if (S.some((q) => q.z < c.view.near)) return null;
        const bx = (S[0].x + S[1].x) / 2, by = (S[0].y + S[1].y) / 2;
        const rx = Math.max(4, Math.abs(S[1].x - S[0].x) / 2), ry = Math.max(3, Math.abs(by - (S[2].y + S[3].y) / 2) * 1.25);
        if (rx < 6) return null;
        const col = mix('#8A7D76', c.light.fogColor, 0.45 + c.lit.fog * 0.5);
        const id = `hz_${i}`;
        return (
          <g>
            <defs>
              <radialGradient id={id} cx={f1(bx)} cy={f1(by)} r={f1(rx)} gradientUnits="userSpaceOnUse" gradientTransform={`translate(${f1(bx)} ${f1(by)}) scale(1 ${(ry / rx).toFixed(3)}) translate(${f1(-bx)} ${f1(-by)})`}>
                <stop offset={0} stopColor={col} stopOpacity={0.5 * hk * near} />
                <stop offset={0.55} stopColor={col} stopOpacity={0.3 * hk * near} />
                <stop offset={1} stopColor={col} stopOpacity={0} />
              </radialGradient>
            </defs>
            <path d={`M${S.map((q) => `${f1(q.x)} ${f1(q.y)}`).join('L')}Z`} fill={`url(#${id})`} />
          </g>
        );
      },
    });
  });
  return out;
};

// ================================================================== the failing tower's dust and the stump's smoke
const towerDust = (t: number, occ: Occ): Item[] => {
  const T = PLAN.failingTower;
  const st = towerState(t);
  const out: Item[] = [];
  if (st.tc > 0 && !st.collapsed) {
    const hinge = T.height * 0.6 - st.drop;
    const grow = clamp(st.tc / 4.5);
    const fade = smooth(st.tc / 0.6);
    // the collapse front bursts and the dust rolls DOWN the tower's faces and out over the blocks around it
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const dir = {x: Math.cos(a), y: 0, z: Math.sin(a)};
      const base = {x: T.base.x + dir.x * T.width * 0.45, y: hinge, z: T.base.z + dir.z * T.width * 0.45};
      out.push(...[plumeItem(`tdust${i}`, {base, rise: -Math.min(hinge - 10, 30 + grow * 120), drift: 18 + grow * 60, dir, r0: 10, r1: 22 + grow * 34, soot: 0.06, alpha: 0.92 * fade, speed: 16, grow: clamp(st.tc / 2.2), seed: 300 + i, tail: 0.3, wander: 0.2}, t, -0.2, occ)].filter((x): x is Item => !!x));
    }
    out.push(...[plumeItem('tdustUp', {base: {x: T.base.x, y: hinge, z: T.base.z}, rise: 40 + grow * 70, drift: 20 + grow * 30, r0: 16, r1: 34 + grow * 30, soot: 0.12, alpha: 0.9 * fade, speed: 10, grow: clamp(st.tc / 2), seed: 310, tail: 0.3}, t, -0.3, occ)].filter((x): x is Item => !!x));
  }
  if (st.collapsed || t > M.TITLE_OUT) {
    // the stump's broken top burns (FIRE_SITES tower_top): its column rises from there
    const top = FIRES.find((f) => f.anchor === 'towerStump');
    const base = top ? {x: top.pos.x, y: top.pos.y + top.size * 0.6, z: top.pos.z} : {x: T.base.x, y: T.height * 0.42, z: T.base.z};
    out.push(...[plumeItem('stumpSmoke', {base, rise: 170, drift: 150, r0: 16, r1: 58, soot: 0.42, alpha: 0.82, warm: 0.2, speed: 6, seed: 77, tail: 0.45}, t, -0.2, occ)].filter((x): x is Item => !!x));
  }
  return out;
};

// ================================================================== the smoke ceiling (thick smoke over the city)
/** Long flat banks of smoke at 335–425 m (above the failing tower's crown) drifting with the wind, billowed undersides lit warm by the fires below. */
const ceiling = (t: number, k: number, occ: Occ): Item[] => {
  const out: Item[] = [];
  for (let i = 0; i < 32; i++) {
    const s = 5000 + i;
    const x = -300 + rnd(s) * 2600, z = -900 + rnd(s * 3) * 1800;
    const y = 335 + rnd(s * 5) * 90;
    const r = 44 + rnd(s * 7) * 54;
    const L = r * (2.2 + rnd(s * 11) * 2.5);
    const base = {x: x + WIND.x * t * 2.2, y, z: z + WIND.z * t * 2.2};
    out.push(...[plumeItem(`ceil_${i}`, {base, rise: 4, drift: L, r0: r * 0.8, r1: r, soot: 0.7, alpha: 0.78 * k, warm: 0.35, speed: 2.2, seed: s, tail: 0.15, flat: 0.34, wander: 0.15}, t, -0.5)].filter((x): x is Item => !!x));
  }
  void occ;
  return out;
};

// ================================================================== shot columns (R2 API), puffs
export type ColumnOpts = {
  /** (R2: puff count) — unused by the plume look, kept for compatibility */
  n?: number;
  /** rise speed m/s */
  rise?: number;
  /** life of the smoke (s): with `rise` sets the column height */
  life?: number;
  /** starting / final radius (m) */
  r0?: number;
  r1?: number;
  /** wind drift multiplier */
  drift?: number;
  /** darkness 0 (light grey dust) .. 1 (black oily) */
  dark?: number;
  /** overall opacity */
  alpha?: number;
  seed?: number;
  /** warm underside (lit by the fire below) 0..1 */
  warm?: number;
  /** starts at film time (the column grows from its source) */
  from?: number;
};
/** A ColumnOpts column as a plume spec (height = 0.75 · rise · life, drift along WIND as the R2 puffs drifted). */
export const columnSpec = (base: V3, o: ColumnOpts, t: number): PlumeSpec => {
  const life = o.life ?? 9, rise = o.rise ?? 2.2, drift = o.drift ?? 1;
  const r0 = o.r0 ?? 1.2, r1 = o.r1 ?? 7;
  const H = 0.75 * rise * life;
  const D = 1.5 * life * drift * Math.hypot(WIND.x, WIND.z);
  return {
    base, rise: H, drift: D, r0, r1: r1 * 0.85, soot: o.dark ?? 0.6, alpha: clamp((o.alpha ?? 0.8) * 1.15), warm: o.warm ?? 0.4,
    speed: rise, grow: o.from !== undefined ? clamp((t - o.from) / life) : 1, seed: o.seed ?? 1, tail: 0.35, flat: H < r1 * 1.5 ? 0.72 : 1,
  };
};
/** A smoke column a shot adds (e.g. the crater smoke), drawn as a plume. */
export const smokeColumn = (key: string, base: V3, o: ColumnOpts, t: number): Item[] => [plumeItem(key, columnSpec(base, o, t), t)!];

/** One still smoke/dust billow of radius r metres. */
export const puffItem = (key: string, pos: V3, r: number, o: {dark?: number; alpha?: number; seed?: number; t?: number} = {}): Item => ({
  kind: 'sprite', key, pos,
  draw: (c: SpriteCtx) => {
    const R = r * c.k;
    if (R < 0.8) return null;
    const near = clamp((c.z - r * 0.7) / (r * 1.6));
    if (near <= 0.02) return null;
    const dark = o.dark ?? 0.5, s = o.seed ?? 1;
    const baseC = mix(mix('#2E2A2A', '#8A8580', 1 - dark), c.light.fogColor, 0.25 + c.lit.fog * 0.65);
    const litC = mix(mix(baseC, c.light.sunColor, 0.28), c.light.fogColor, c.lit.fog * 0.5);
    const sx = c.light.sun.x >= 0 ? 1 : -1;
    const rot = rnd(s) * 6.28 + (o.t ?? 0) * 0.05;
    return (
      <g opacity={f1((o.alpha ?? 0.8) * (1 - c.lit.fog * 0.35) * near)}>
        <path d={billowPath(c.x, c.y, R, s, 6, 1, 0.88, rot)} fill={baseC} />
        <path d={billowPath(c.x - sx * R * 0.2, c.y - R * 0.24, R * 0.62, s + 3, 5, 1, 0.88, rot)} fill={litC} opacity={0.75} />
      </g>
    );
  },
});

// ================================================================== free-standing fires for shots
export type FlameOpts = {size: number; spread?: number; seed: number; heat?: number; from?: number; grow?: number; smoke?: number; soot?: number; kind?: 'debris' | 'vehicle' | 'spill'; heading?: number; len?: number; bias?: number};
/** A fire a shot places itself (a burning machine, a fire an impact starts), with its plume, in the film's look. */
export const flameItems = (key: string, pos: V3, o: FlameOpts, t: number, view?: View): Item[] => {
  const f: Fire = {id: key, pos, ...o};
  const e = fireEnergy(f, t);
  const out: Item[] = [];
  if (e > 0.01) out.push(massSprite(`fire_${key}`, pos, o.bias ?? 0.4, groundMasses(f), f, t, e, view ? leanOf(view) : 0.2));
  const p = firePlume(f, t, 1);
  const it = p ? plumeItem(`sm_${key}`, p, t, -0.2, view ? occFor(view) : undefined) : null;
  if (it) out.push(it);
  return out;
};
/** The point light of such a fire (power follows the same energy as its flames). */
export const flameLight = (pos: V3, o: FlameOpts, t: number, power = 0.7, radius = 12): PointLight => {
  const f: Fire = {id: 'x', pos, ...o};
  const e = fireEnergy(f, t);
  return {pos: add3(pos, {x: 0, y: o.size * 0.35, z: 0}), color: fireLightColor(f), power: power * clamp(e * e, 0, 1.6), radius, flicker: 0.05, seed: o.seed};
};

// ================================================================== assembly
export type AtmosOpts = {
  fires?: boolean;
  /** smoke density multiplier (0 = none, 1 = default) */
  smoke?: number;
  /** per-fire smoke multiplier on top of `smoke` (e.g. thin the plumes near a character) */
  fireSmoke?: (id: string) => number;
  embers?: boolean;
  /** ash flakes from the cooling embers near the fires (0 = none, default 1; it stays sparse) */
  ash?: number;
  haze?: number;
  /** add these columns (shot-specific smoke) */
  columns?: {key: string; base: V3; o: ColumnOpts}[];
  /** skip fires by id */
  skipFires?: string[];
  /** the smoke ceiling over the city (0 = none, default 1) */
  ceiling?: number;
};

export const atmosItems = (view: View, t: number, o: AtmosOpts = {}): Item[] => {
  const items: Item[] = [];
  const smokeK = o.smoke ?? 1;
  const cam = view.pos;
  const skip = new Set(o.skipFires ?? []);
  const occ = occFor(view);
  const lean = leanOf(view);
  const flames = o.fires !== false;
  FIRES.forEach((f) => {
    if (skip.has(f.id)) return;
    const kind = kindOf(f);
    const e = fireEnergy(f, t);
    const anchor = kind === 'block' || kind === 'room' ? fireAnchor(f) : f.pos;
    const dist = Math.hypot(anchor.x - cam.x, anchor.y - cam.y, anchor.z - cam.z);
    if (dist > 3200) return;
    if (flames && e > 0.01) {
      if (kind === 'block') {
        const g = blockGeo(f);
        if (g) items.push(...blockFire(f, g, t, e, lean, occ));
      } else if (kind === 'room') {
        const g = roomGeo(f);
        // a room fire needs its room: without an opening in the facade there is nothing to burn in
        if (g) items.push(...roomFire(f, g, t, e, lean, occ, true));
      } else {
        const probe = add3(f.pos, {x: 0, y: f.size * 0.5, z: 0});
        const own = kind === 'opening' ? anchorBldg(f) : undefined;
        if (!allHidden(occ, [f.pos, add3(f.pos, {x: 0, y: f.size, z: 0})], own)) items.push(massSprite(`fire_${f.id}`, f.pos, occBias(occ, f.pos, [probe], kind === 'vehicle' ? 0.55 : kind === 'opening' ? 0.8 : 0.4, own), groundMasses(f), f, t, e, lean));
      }
    }
    const k = smokeK * (o.fireSmoke ? o.fireSmoke(f.id) : 1);
    if (k > 0.01) {
      const p = firePlume(f, t, Math.min(1.3, k));
      const skipB = kind === 'block' ? blockGeo(f)?.b : kind === 'room' ? roomGeo(f)?.b : kind === 'opening' ? anchorBldg(f) : undefined;
      const it = p ? plumeItem(`sm_${f.id}`, p, t, -0.2, occ, skipB ?? undefined) : null;
      if (it) items.push(it);
    }
  });
  if (o.embers !== false) items.push(...embers(view, t, o.ash ?? 1));
  if ((o.haze ?? 1) > 0) items.push(...hazeCurtains(view, t, o.haze ?? 1));
  items.push(...towerDust(t, occ));
  if ((o.ceiling ?? 1) > 0) items.push(...ceiling(t, o.ceiling ?? 1, occ));
  (o.columns ?? []).forEach((c) => { const it = plumeItem(c.key, columnSpec(c.base, c.o, t), t, -0.2, occ); if (it) items.push(it); });
  return items;
};

// Block fires carry only (x, z) in fires.ts: once the city exists, give them their building's burning roof as pos, so
// any shot that reads FIRES[i].pos (e.g. to build its own columns) gets the real source.
FIRES.forEach((f) => {
  if (kindOf(f) !== 'block') return;
  const g = blockGeo(f);
  if (g) f.pos = {x: (g.b.x0 + g.b.x1) / 2, y: g.yB, z: (g.b.z0 + g.b.z1) / 2};
});

export {fireLights, FIRES, burn};
export type {FlameBuf};
