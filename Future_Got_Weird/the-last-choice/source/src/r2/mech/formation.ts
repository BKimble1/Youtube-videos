// Formations: where the army's combat units stand and walk, and how the system moves them together. Slots are pure
// functions of time. Layouts: ranks/lines, an arc around a point, a ring holding position, columns streaming along a
// path. Transitions: halt as one, re-form A → B with a ripple delay (assignment sorted so paths don't cross),
// replacements stepping forward to fill a lost unit's place. armyItems turns slots into engine items with LOD by
// distance (≤ maxFull full meshes nearest the camera, then mid meshes, then cheap far sprites).
import {V3, add3, sub3, mul3, len3, rnd, clamp, smooth, lerp} from '../../kit/math';
import {Item, View, toView} from '../engine';
import {Ground, FLAT, Path, straightPath, distTo} from './kit';
import {combatUnit, unitAttach, UnitSpec, Posture} from './unit';
import {heavyAttach, HeavySpec} from './heavy';
import {droneAttach, DroneSpec} from './drone';

// ------------------------------------------------------------------ obstacles (wrecks, slabs) and routes around them
/** A ground obstacle: centre, radius (m) and height (m). Low ones (h ≤ ~0.6) can be stepped over (gait.over). */
export type Obstacle = {x: number; z: number; r: number; h?: number};
/**
 * Obstacles from persisted machines at film time T (pass `persistAt(T)` from film/continuity, or any {kind, spec}):
 * a fallen unit's body (pelvis + chest, low), a standing unit, a toppled heavy's hull (big) or a standing one's feet,
 * a crashed drone.
 */
export const obstaclesFrom = (entries: {kind: string; spec?: (T: number) => unknown}[], T: number): Obstacle[] => {
  const out: Obstacle[] = [];
  for (const e of entries) {
    if (!e.spec) continue;
    if (e.kind === 'unit') {
      const sp = e.spec(T) as UnitSpec;
      const a = unitAttach({...sp, t: T});
      if (sp.fall && T > sp.fall.t0 + 0.5 && (sp.fall.getUp === undefined || T < sp.fall.getUp)) {
        out.push({x: a.pelvis.x, z: a.pelvis.z, r: 0.5, h: 0.45}, {x: a.chest.x, z: a.chest.z, r: 0.5, h: 0.45}, {x: a.head.x, z: a.head.z, r: 0.35, h: 0.35});
      } else out.push({x: a.root.x, z: a.root.z, r: 0.55, h: 2.2});
    } else if (e.kind === 'heavy') {
      const sp = e.spec(T) as HeavySpec;
      const a = heavyAttach({...sp, t: T});
      if (sp.kneeBreak && T > sp.kneeBreak.t0) {
        const f = a.fwd;
        [-2.2, 0, 2.2].forEach((k) => out.push({x: a.hull.x + f.x * k, z: a.hull.z + f.z * k, r: 2.1, h: 3.0}));
        // the folded legs reach past the hull
        [...a.knees, ...a.feet].forEach((p) => out.push({x: p.x, z: p.z, r: 0.75, h: 1.2}));
      } else {
        out.push({x: a.hull.x, z: a.hull.z, r: 1.8, h: 5});
        a.feet.forEach((p) => out.push({x: p.x, z: p.z, r: 0.75, h: 1.0}));
      }
    } else if (e.kind === 'drone') {
      const sp = e.spec(T) as DroneSpec;
      if (sp.hit && T > sp.hit.t0 + 0.8) { const a = droneAttach({...sp, t: T}); out.push({x: a.body.x, z: a.body.z, r: 0.45, h: 0.25}); }
    }
  }
  return out;
};

/** obstacles projected onto a path: along-track d and cross-track c (m, + = right of the path) */
type ObsProj = {d: number; c: number; r: number; h: number};
const projectObstacles = (path: Path, obs: Obstacle[], length: number, step = 0.5): ObsProj[] => obs.map((o) => {
  let best = {d: 0, e: 1e9};
  for (let d = 0; d <= length; d += step) {
    const q = path(d).pos;
    const e = Math.hypot(q.x - o.x, q.z - o.z);
    if (e < best.e) best = {d, e};
  }
  const q = path(best.d);
  const h = (q.heading * Math.PI) / 180;
  const c = (o.x - q.pos.x) * Math.cos(h) + (o.z - q.pos.z) * Math.sin(h);
  return {d: best.d, c, r: o.r, h: o.h ?? 1};
});
/** overlapping obstacles merge into one block to route around (its cross-track centre / half-width, along-track span) */
type Block = {cc: number; hw: number; d0: number; d1: number};
const blocksOf = (P: ObsProj[], clear: number, overMax: number): Block[] => {
  const tall = P.filter((o) => o.h > overMax);
  const parent = tall.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  tall.forEach((a, i) => tall.forEach((b, j) => {
    if (j <= i) return;
    if (Math.hypot(a.d - b.d, a.c - b.c) < a.r + b.r + 2 * clear) parent[find(i)] = find(j);
  }));
  const groups = new Map<number, ObsProj[]>();
  tall.forEach((o, i) => { const k = find(i); if (!groups.has(k)) groups.set(k, []); groups.get(k)!.push(o); });
  return [...groups.values()].map((g) => {
    const lo = Math.min(...g.map((o) => o.c - o.r)), hi = Math.max(...g.map((o) => o.c + o.r));
    return {cc: (lo + hi) / 2, hw: (hi - lo) / 2, d0: Math.min(...g.map((o) => o.d - o.r)), d1: Math.max(...g.map((o) => o.d + o.r))};
  });
};
/**
 * lateral deflection (m, + = right) of a lane at cross-track `lat` past each block: a monotone sideways map (lanes keep
 * their order and never cross; the lanes through the middle clear the block's whole width + `clear`), ramped in and
 * out along the path.
 */
const deflect = (B: Block[], lat: number, clear: number, seed: number) => (d: number) => {
  let off = 0;
  for (const b of B) {
    const W = b.hw + clear;
    const x = lat - b.cc;
    const side = Math.abs(x) > 1e-3 ? Math.sign(x) : rnd(seed * 3.7 + b.d0) < 0.5 ? -1 : 1;
    const push = side * W * Math.exp(-((x / (1.6 * W)) ** 2));
    const ramp = W + 2.4;
    const along = d < b.d0 ? 1 - smooth((b.d0 - d) / ramp) : d > b.d1 ? 1 - smooth((d - b.d1) / ramp) : 1;
    off += push * along;
  }
  return off;
};
/**
 * A path that walks AROUND obstacles (a smooth sideways detour past each one, `clear` m of margin). Obstacles no taller
 * than `overMax` (default 0) are left in the way, to be stepped over (give them to the unit as gait.over).
 * `length` = how far along the path to look (m).
 */
export const avoidPath = (path: Path, obstacles: Obstacle[], o: {clear?: number; length?: number; overMax?: number; seed?: number} = {}): Path => {
  if (!obstacles.length) return path;
  const B = blocksOf(projectObstacles(path, obstacles, o.length ?? 80), o.clear ?? 0.6, o.overMax ?? 0);
  return lanePath(path, 0, deflect(B, 0, o.clear ?? 0.6, o.seed ?? 1));
};
const lanePath = (path: Path, latOff: number, f: (d: number) => number): Path => (d) => {
  const q = path(d);
  const h = (q.heading * Math.PI) / 180;
  const off = latOff + f(d);
  const dh = (Math.atan2(f(d + 0.3) - f(d - 0.3), 0.6) * 180) / Math.PI;
  return {pos: {x: q.pos.x + Math.cos(h) * off, y: q.pos.y, z: q.pos.z + Math.sin(h) * off}, heading: q.heading + dh};
};
/** the low obstacles among `obstacles` (to step over: pass as gait.over / Slot.over) */
export const lowObstacles = (obstacles: Obstacle[], overMax = 0.6) => obstacles.filter((o) => (o.h ?? 1) <= overMax).map((o) => ({x: o.x, z: o.z, r: o.r, h: o.h ?? 0.4}));

export type Slot = {
  id: number;
  pos: V3;
  heading: number;
  /** walking: the unit follows path(dist) with planted feet */
  path?: Path;
  dist?: number;
  /** extra unit controls (strike, damage, look, lockAt…) */
  ctl?: Partial<UnitSpec>;
  /** low obstacles the unit's feet step over while walking (gait.over) */
  over?: {x: number; z: number; r: number; h: number}[];
};
export type Formation = {slots: (t: number) => Slot[]};

const hd = (a: V3, b: V3) => (Math.atan2(b.x - a.x, -(b.z - a.z)) * 180) / Math.PI;
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

/** Ranks centred on `center`, facing `heading`; perRow units per rank, `rows` ranks behind each other. */
export const lineSlots = (center: V3, heading: number, perRow: number, spacing: number, rows: number, rowGap: number, seed: number, idBase = 0): Slot[] => {
  const h = (heading * Math.PI) / 180;
  const f = {x: Math.sin(h), z: -Math.cos(h)}, r = {x: Math.cos(h), z: Math.sin(h)};
  const out: Slot[] = [];
  for (let row = 0; row < rows; row++) for (let i = 0; i < perRow; i++) {
    const id = idBase + seed * 1000 + row * perRow + i;
    const lat = (i - (perRow - 1) / 2) * spacing + (row % 2) * spacing * 0.5 + (rnd(id * 3) - 0.5) * 0.35;
    const back = row * rowGap + (rnd(id * 5) - 0.5) * 0.4;
    out.push({id, pos: {x: center.x + r.x * lat - f.x * back, y: 0, z: center.z + r.z * lat - f.z * back}, heading: heading + (rnd(id * 7) - 0.5) * 6});
  }
  return out;
};
/** An arc of radius around `center` from bearing a0 to a1 (deg, headingVec convention, bearing FROM center), facing in. */
export const arcSlots = (center: V3, radius: number, a0: number, a1: number, count: number, seed: number, rows = 1, rowGap = 2.2, idBase = 0): Slot[] => {
  const out: Slot[] = [];
  const perRow = Math.ceil(count / rows);
  for (let row = 0; row < rows; row++) for (let i = 0; i < perRow && out.length < count; i++) {
    const id = idBase + seed * 1000 + row * perRow + i;
    const a = lerp(a0, a1, perRow === 1 ? 0.5 : (i + (row % 2) * 0.5) / (perRow - 1 + (row % 2) * 0.5)) + (rnd(id * 3) - 0.5) * 1.2;
    const rr = radius + row * rowGap + (rnd(id * 5) - 0.5) * 0.5;
    const ar = (a * Math.PI) / 180;
    const pos = {x: center.x + Math.sin(ar) * rr, y: 0, z: center.z - Math.cos(ar) * rr};
    out.push({id, pos, heading: hd(pos, center) + (rnd(id * 7) - 0.5) * 5});
  }
  return out;
};
/** A full ring holding position around `center`. */
export const ringSlots = (center: V3, radius: number, count: number, seed: number, idBase = 0) => arcSlots(center, radius, 0, 360 - 360 / count, count, seed, 1, 2, idBase);

/** Static formation (units stand; optional per-slot controls). */
export const standing = (slots: Slot[]): Formation => ({slots: () => slots});

/**
 * Column streaming along a path: `count` units in `lanes`, spaced `spacing` along the path, moving at `speed` (m/s)
 * from t0; optional halt time (all stop together, with a small settle).
 */
export const column = (path: Path, count: number, lanes: number, laneGap: number, spacing: number, speed: number, t0: number, seed: number, haltAt?: number, idBase = 0,
  /** R3: route the lanes around `avoid` obstacles (each lane detours on its own side; `clear` m margin) and step over
   *  the low ones (h ≤ overMax, default 0.6: the feet lift over a lying wreck). `length`: how far to look (m). */
  route: {avoid?: Obstacle[]; clear?: number; overMax?: number; length?: number} = {},
): Formation => {
  const P = route.avoid?.length ? blocksOf(projectObstacles(path, route.avoid, route.length ?? 120), route.clear ?? 0.6, route.overMax ?? 0.6) : null;
  const low = route.avoid ? lowObstacles(route.avoid, route.overMax ?? 0.6) : [];
  return {slots: (t) => {
    // halt as one: every unit finishes the step it is in (a short settle) and stops on the same beat
    const settle = 0.42 * speed;
    const tt = haltAt !== undefined ? Math.min(t, haltAt) : t;
    const dHalt = haltAt !== undefined ? Math.max(0, haltAt - t0) * speed : 0;
    const d0 = haltAt !== undefined && t > haltAt ? dHalt + settle * smooth((t - haltAt) / 0.7) : Math.max(0, tt - t0) * speed;
    const out: Slot[] = [];
    for (let i = 0; i < count; i++) {
      const lane = i % lanes, rank = Math.floor(i / lanes);
      const id = idBase + seed * 1000 + i;
      // irregular spacing: units keep station loosely (no pasted grid); a few places are empty (losses en route)
      if (rnd(id * 13 + 5) < 0.06) continue;
      const jit = (rnd(id * 3) - 0.5) * spacing * 0.45;
      const along = d0 - rank * spacing + jit;
      const latOff = (lane - (lanes - 1) / 2) * laneGap + (rnd(id * 5) - 0.5) * laneGap * 0.35;
      const lp: Path = P ? lanePath((d) => ({...path(d), pos: {...path(d).pos, y: 0}}), latOff, deflect(P, latOff, route.clear ?? 0.6, id)) : (d) => {
        const q = path(d);
        const h = (q.heading * Math.PI) / 180;
        return {pos: {x: q.pos.x + Math.cos(h) * latOff, y: 0, z: q.pos.z + Math.sin(h) * latOff}, heading: q.heading};
      };
      const q = lp(along);
      const end = haltAt !== undefined ? dHalt - rank * spacing + jit + settle : undefined;
      out.push({id, pos: q.pos, heading: q.heading, path: lp, dist: along, over: low.length ? low : undefined, ctl: {gaitEnd: end, gaitStart: -rank * spacing + jit} as Partial<UnitSpec>});
    }
    return out;
  }};
};

/**
 * Re-form from slots A to slots B: unit i starts walking at t0 + ripple·order (order by bearing around `pivot` so
 * paths don't cross), takes `dur`-ish seconds at its own pace, then turns to face B's heading.
 */
export const reformSlots = (A: Slot[], B: Slot[], t0: number, ripple: number, dur: number, pivot: V3, speed = 1.6, depth = 3): Formation => {
  const bearing = (p: V3) => Math.atan2(p.x - pivot.x, -(p.z - pivot.z));
  const rad = (p: V3) => Math.hypot(p.x - pivot.x, p.z - pivot.z);
  // sort by bearing, then within each window of `depth` (one per rank/row) by distance, so ranks keep their order
  const order = (L: Slot[]) => {
    const o = L.map((s, i) => ({s, i, b: bearing(s.pos)})).sort((p, q) => p.b - q.b);
    for (let k = 0; k < o.length; k += depth) {
      const w = o.slice(k, k + depth).sort((p, q) => rad(p.s.pos) - rad(q.s.pos));
      o.splice(k, w.length, ...w);
    }
    return o;
  };
  const ai = order(A);
  const bi = order(B);
  const n = Math.min(ai.length, bi.length);
  const pairs = Array.from({length: n}, (_, k) => {
    const a = ai[Math.floor((k * ai.length) / n)].s, b = bi[Math.floor((k * bi.length) / n)].s;
    return {a, b, start: t0 + ripple * k, L: len3(sub3(b.pos, a.pos))};
  });
  return {
    slots: (t) => pairs.map(({a, b, start, L}) => {
      const h = hd(a.pos, b.pos);
      const path = straightPath(a.pos, h);
      const sp = speed * (0.92 + rnd(a.id * 9) * 0.16);
      const d = clamp((t - start) * sp, 0, L);
      void dur;
      if (t < start) return {...a};
      if (d < L) {
        // turn toward the walk direction over the first 0.4 s
        const k = smooth((t - start) / 0.4);
        return {id: a.id, pos: path(d).pos, heading: a.heading + wrap(h - a.heading) * k, path: (dd) => ({pos: path(dd).pos, heading: a.heading + wrap(h - a.heading) * k}), dist: d, ctl: {...a.ctl, gaitStart: 0, gaitEnd: L} as Partial<UnitSpec>};
      }
      const tArr = start + L / sp;
      const k = smooth((t - tArr) / 0.6);
      return {id: a.id, pos: b.pos, heading: h + wrap(b.heading - h) * k, ctl: b.ctl ?? a.ctl};
    }),
  };
};

/** Lost units: `losses` (slot id → time destroyed) are filled by reserves walking up from `reserve` slots after a delay. */
export const withReplacements = (form: Formation, losses: {id: number; t: number}[], reserves: Slot[], delay = 0.8, speed = 1.5): Formation => ({
  slots: (t) => {
    const base = form.slots(t);
    const out: Slot[] = [];
    base.forEach((s) => {
      const L = losses.find((l) => l.id === s.id);
      if (!L || t < L.t) { out.push(s); return; }
      // the lost unit is no longer in the formation (the caller draws its wreck); a reserve takes its place
      const k = losses.indexOf(L);
      const r = reserves[k % reserves.length];
      if (!r) return;
      const start = L.t + delay + k * 0.25;
      const Ld = len3(sub3(s.pos, r.pos));
      const h = hd(r.pos, s.pos);
      const d = clamp((t - start) * speed, 0, Ld);
      if (t < start) { out.push({...r, id: r.id}); return; }
      if (d < Ld) out.push({id: r.id, pos: straightPath(r.pos, h)(d).pos, heading: h, path: straightPath(r.pos, h), dist: d, ctl: {...s.ctl, lockAt: start, gaitStart: 0, gaitEnd: Ld} as Partial<UnitSpec>});
      else out.push({id: r.id, pos: s.pos, heading: s.heading, ctl: {...s.ctl, lockAt: start}});
    });
    return out;
  },
});

/** Merge formations. */
export const combine = (...fs: Formation[]): Formation => ({slots: (t) => fs.flatMap((f) => f.slots(t))});

export type ArmyOpts = {ground?: Ground; maxFull?: number; maxMid?: number; farFrom?: number; ctl?: (s: Slot) => Partial<UnitSpec>; eye?: 'cyan' | 'amber'};

/** Engine items for every slot of a formation at time t, LOD chosen by distance to the camera. */
export const armyItems = (v: View, t: number, form: Formation, o: ArmyOpts): Item[] => {
  const g = o.ground ?? FLAT;
  const slots = form.slots(t);
  const ranked = slots
    .map((s) => ({s, d: distTo(v, add3(s.pos, {x: 0, y: 1.2, z: 0})), z: toView(v, add3(s.pos, {x: 0, y: 1.2, z: 0})).z}))
    .filter((q) => q.z > -3)
    .sort((a, b) => a.d - b.d);
  const maxFull = o.maxFull ?? 12, maxMid = o.maxMid ?? 40, farFrom = o.farFrom ?? 70;
  const items: Item[] = [];
  ranked.forEach(({s, d}, i) => {
    const lod: UnitSpec['lod'] = i < maxFull && d < farFrom * 0.6 ? 'full' : i < maxFull + maxMid && d < farFrom ? 'mid' : 'far';
    const spec: UnitSpec = {
      id: s.id, t, pos: {x: s.pos.x, y: 0, z: s.pos.z}, heading: s.heading, ground: g, lod, eye: o.eye ?? 'cyan',
      gait: s.path && s.dist !== undefined ? {path: s.path, dist: s.dist, start: (s.ctl as {gaitStart?: number} | undefined)?.gaitStart, end: (s.ctl as {gaitEnd?: number} | undefined)?.gaitEnd, over: s.over} : undefined,
      idle: 0.6,
      ...(s.ctl ?? {}),
      ...(o.ctl ? o.ctl(s) : {}),
    };
    items.push(...combatUnit(spec));
  });
  return items;
};
// ------------------------------------------------------------------ securing (the end of the battle)
/** A seeded per-unit time offset around t0 (±spread/2): formation-wide changes never happen on the same frame. */
export const staggerT = (id: number, t0: number, spread = 0.9, k = 0) => t0 + (rnd(id * 7.31 + k * 13.7 + 0.5) - 0.5) * spread;
/**
 * A held perimeter: `count` units on an arc (a0..a1, bearings from the centre; default a full ring) with even spacing
 * (radius from `spacing` when radius is 0), facing in (holding survivors) or out (holding a line).
 */
export const perimeterSlots = (center: V3, radius: number, count: number, seed: number, o: {a0?: number; a1?: number; spacing?: number; facing?: 'in' | 'out'; idBase?: number} = {}): Slot[] => {
  const a0 = o.a0 ?? 0, a1 = o.a1 ?? 360 - 360 / count;
  const span = Math.abs(a1 - a0) || 360;
  const R = radius > 0 ? radius : ((o.spacing ?? 2.4) * (count - (span >= 359 ? 0 : 1))) / ((span * Math.PI) / 180);
  return arcSlots(center, R, a0, a1, count, seed, 1, 2, o.idBase ?? 0).map((s) => (o.facing === 'out' ? {...s, heading: s.heading + 180} : s));
};
/**
 * Securing behaviour over a formation from t0: each unit (seeded offsets, never in unison) lowers into a posture
 * ('ready' by default: weapon lowered but ready), then scans its sector (`span` deg around its facing, or toward
 * `watch`) with pauses; `attend(slot, t)` may return a moving point a unit should snap to and track (a survivor who
 * moves). Existing slot controls are kept.
 */
export const securing = (base: Formation, o: {t0: number; spread?: number; posture?: Posture; span?: number; watch?: V3; attend?: (s: Slot) => {t0: number; at: V3 | ((t: number) => V3); t1?: number} | undefined}): Formation => ({
  slots: (t) => base.slots(t).map((s) => {
    const sp = o.spread ?? 1.2;
    const prev = s.ctl ?? {};
    const pk = Array.isArray(prev.posture) ? prev.posture : prev.posture ? [[-1e9, prev.posture] as [number, Posture]] : [];
    const att = o.attend?.(s);
    return {...s, ctl: {
      ...prev,
      posture: [...pk, [staggerT(s.id, o.t0, sp, 1), o.posture ?? 'ready']],
      scan: {t0: staggerT(s.id, o.t0 + 0.7, sp, 2), center: o.watch, span: o.span ?? 60, seed: s.id},
      attend: att ? [...(prev.attend ?? []), att] : prev.attend,
    } as Partial<UnitSpec>};
  }),
});
/** Step from slots A into slots B (blocking positions) with seeded, staggered starts and own paces (short walks). */
export const stepInto = (A: Slot[], B: Slot[], t0: number, o: {spread?: number; speed?: number} = {}): Formation => ({
  slots: (t) => A.map((a, i) => {
    const b = B[i % B.length];
    const start = staggerT(a.id, t0, o.spread ?? 1.0, 3);
    const L = Math.hypot(b.pos.x - a.pos.x, b.pos.z - a.pos.z);
    const sp = (o.speed ?? 1.4) * (0.9 + rnd(a.id * 5.3) * 0.2);
    const h = (Math.atan2(b.pos.x - a.pos.x, -(b.pos.z - a.pos.z)) * 180) / Math.PI;
    if (t < start || L < 0.05) return {...a, ctl: {...a.ctl, ...b.ctl}};
    const d = clamp((t - start) * sp, 0, L);
    if (d < L) {
      const k = smooth((t - start) / 0.4);
      return {id: a.id, pos: straightPath(a.pos, h)(d).pos, heading: a.heading + wrap(h - a.heading) * k, path: (dd: number) => ({pos: straightPath(a.pos, h)(dd).pos, heading: a.heading + wrap(h - a.heading) * k}), dist: d, ctl: {...a.ctl, ...b.ctl, gaitStart: 0, gaitEnd: L} as Partial<UnitSpec>};
    }
    const k = smooth((t - (start + L / sp)) / 0.6);
    return {id: a.id, pos: b.pos, heading: h + wrap(b.heading - h) * k, ctl: {...a.ctl, ...b.ctl}};
  }),
});
void [mul3, lerp, add3];
