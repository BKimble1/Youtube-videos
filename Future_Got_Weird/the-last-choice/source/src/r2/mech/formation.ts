// Formations: where the army's combat units stand and walk, and how the system moves them together. Slots are pure
// functions of time. Layouts: ranks/lines, an arc around a point, a ring holding position, columns streaming along a
// path. Transitions: halt as one, re-form A → B with a ripple delay (assignment sorted so paths don't cross),
// replacements stepping forward to fill a lost unit's place. armyItems turns slots into engine items with LOD by
// distance (≤ maxFull full meshes nearest the camera, then mid meshes, then cheap far sprites).
import {V3, add3, sub3, mul3, len3, rnd, clamp, smooth, lerp} from '../../kit/math';
import {Item, View, toView} from '../engine';
import {Ground, FLAT, Path, straightPath, distTo} from './kit';
import {combatUnit, UnitSpec} from './unit';

export type Slot = {
  id: number;
  pos: V3;
  heading: number;
  /** walking: the unit follows path(dist) with planted feet */
  path?: Path;
  dist?: number;
  /** extra unit controls (strike, damage, look, lockAt…) */
  ctl?: Partial<UnitSpec>;
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
export const column = (path: Path, count: number, lanes: number, laneGap: number, spacing: number, speed: number, t0: number, seed: number, haltAt?: number, idBase = 0): Formation => ({
  slots: (t) => {
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
      const lp: Path = (d) => {
        const q = path(d);
        const h = (q.heading * Math.PI) / 180;
        return {pos: {x: q.pos.x + Math.cos(h) * latOff, y: 0, z: q.pos.z + Math.sin(h) * latOff}, heading: q.heading};
      };
      const q = lp(along);
      const end = haltAt !== undefined ? dHalt - rank * spacing + jit + settle : undefined;
      out.push({id, pos: q.pos, heading: q.heading, path: lp, dist: along, ctl: {gaitEnd: end, gaitStart: -rank * spacing + jit} as Partial<UnitSpec>});
    }
    return out;
  },
});

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
      gait: s.path && s.dist !== undefined ? {path: s.path, dist: s.dist, start: (s.ctl as {gaitStart?: number} | undefined)?.gaitStart, end: (s.ctl as {gaitEnd?: number} | undefined)?.gaitEnd} : undefined,
      idle: 0.6,
      ...(s.ctl ?? {}),
      ...(o.ctl ? o.ctl(s) : {}),
    };
    items.push(...combatUnit(spec));
  });
  return items;
};
void [mul3, lerp];
