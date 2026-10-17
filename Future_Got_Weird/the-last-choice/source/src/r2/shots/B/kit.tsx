// Section B shared drawing: the Director's sprite, the rebar stub (it flexes under his grip), drifting dust, the army
// with its heavies and drones, and the smoke the army comes out of (crater columns + a low bank on the avenue).
import React from 'react';
import {V3, add3, mul3, rnd, noise, clamp} from '../../../kit/math';
import type {Item, View, MeshItem, SpriteItem} from '../../engine';
import {project, toView} from '../../engine';
import {figureSprite, lookR2, dmgR2, toolsR2, plateWear, figProps, figLight, Figure, figureParts, rigToWorld, figureRig, at as rigAt} from '../../rig';
import type {FigSpec} from '../../rig';
import {slabPoint, SLAB_EAST_X, SLAB_SOUTH_Z} from './rubble';
import {chunkMesh} from '../../world/props';
import {polyline3} from '../../world/geom';
import type {ColumnOpts} from '../../world/atmos';
import {armyItems, heavy, drone} from '../../mech';
import type {UnitSpec, HeavySpec, Formation} from '../../mech';
import {groundH} from '../../world/ground';
import {dirB, REBAR, REBAR_PULL, rebarFlex, TB} from './director';
import {ARMY_B, HEAVIES_B, DRONES_B, heavySpecB, droneSpecB} from './army';

const ground = (x: number, z: number) => groundH(x, z);

/** The Director at film time T (B), as a sprite. `anchor`: the perspective anchor for close shots. */
export const dirSpec = (T: number, o: {anchor?: V3; bias?: number; key?: string} = {}): FigSpec => {
  const d = dirB(T);
  return {
    key: o.key ?? 'dirB', look: lookR2('director'), t: T, seed: 11, pos: d.pos, heading: d.heading,
    pose: {...d.pose, wearL: plateWear(toolsR2('director', T).plate ?? 'intact'), dmg: dmgR2('director', T)},
    world: d.world, anchor: o.anchor, bias: o.bias, reach: d.reach,
  };
};
export const dirSprite = (T: number, o: {anchor?: V3; bias?: number; key?: string} = {}): SpriteItem => ({...figureSprite(dirSpec(T, o)), noCull: true});

// ------------------------------------------------------------------ the plate's strap (B5): teeth and right hand
/** The loose end of the plate's wrist strap: hangs from the buckle, is caught in his teeth and pulled tight by the right
 * hand. World points come from the solved rig in this view, so the strap stays on his forearm, mouth and fist. */
export const strapItems = (v: View, T: number, o: {anchor?: V3; bias?: number} = {}): Item[] => {
  if (T < TB.raise - 0.2 || T > TB.ready + 0.6) return [];
  const R = figureRig(v, dirSpec(T, o));
  const r = R.rig;
  const A = R.W({x: r.el[0].x + (r.wr[0].x - r.el[0].x) * 0.74, y: r.el[0].y + (r.wr[0].y - r.el[0].y) * 0.74, z: r.el[0].z + (r.wr[0].z - r.el[0].z) * 0.74});
  const mouth = R.W(rigAt(r.headC, r.head, 0, -28 * r.s, 52 * r.s));
  const hand = R.handR;
  const bite = clamp((T - TB.bite) / 0.15) * (1 - clamp((T - TB.tugEnd - 0.15) / 0.2));
  const held = clamp((T - (TB.raise + 0.3)) / 0.2) * (1 - clamp((T - TB.letGo) / 0.2));
  const hang = add3(A, {x: 0.02, y: -0.16, z: 0.03});
  const pts: V3[] = held > 0.5 ? (bite > 0.5 ? [A, hand, mouth] : [A, hand]) : [A, add3(A, {x: 0.01, y: -0.08, z: 0.02}), hang];
  return [polyline3('bStrap', pts, 0.022, '#2A2D30', {minPx: 1, ink: '#14181B', inkW: 1.2, bias: (o.bias ?? 0) + 0.25})];
};

// ------------------------------------------------------------------ the dark space under the slab
/** The screen outline of the space under the slab (its underside and the ground right below it), convex. */
const underHull = (v: View, T: number): {x: number; y: number}[] | null => {
  const pts: {x: number; y: number}[] = [];
  for (const [u, w] of [[0, 0], [0.5, 0], [1, 0], [1, 0.5], [1, 1], [0.5, 1], [0, 1], [0, 0.5]]) {
    const a = slabPoint(u, w, T, true);
    for (const p of [a, {x: a.x, y: groundH(a.x, a.z) - 0.02, z: a.z}]) {
      const s = project(v, p);
      if (s.z < v.near) return null;
      pts.push({x: s.x, y: s.y});
    }
  }
  // convex hull (monotone chain)
  pts.sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: {x: number; y: number}, a: {x: number; y: number}, b: {x: number; y: number}) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: typeof pts = [], hi: typeof pts = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
const polyD = (P: {x: number; y: number}[]) => 'M' + P.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L') + 'Z';
/** The ground under the slab in shade (draw it after the terrain, before the figure). */
export const underShade = (T: number, pos: V3, bias: number, k = 0.5): SpriteItem => ({
  kind: 'sprite', key: 'bUnderG', pos, bias,
  draw: (c) => { const H = underHull(c.view, T); return H ? <path d={polyD(H)} fill="#120D0B" opacity={k} /> : null; },
});
/**
 * The Director, the parts of him under the slab in its shade: each part of the rig is drawn lit, then again darkened
 * inside the screen outline of the space under the slab. An arm that reaches out past the slab's east edge (x =
 * SLAB_EAST_X) is only darkened on the shoulder side of the point where it crosses that edge, so a hand out in the
 * open stays lit even where the space under the slab lies behind it on screen. `full`: the whole body is in shade
 * (except the arms past the edge), whatever the outline.
 */
export const dirShaded = (T: number, o: {anchor?: V3; bias?: number; k?: number; full?: boolean; edge?: {p: V3; n: V3}} = {}): SpriteItem => {
  // > 0: out from under the slab (past the given edge plane, or by default past its east or its bitten south edge)
  const side = (q: V3) => (o.edge ? (q.x - o.edge.p.x) * o.edge.n.x + (q.z - o.edge.p.z) * o.edge.n.z : Math.max(q.x - SLAB_EAST_X, q.z - SLAB_SOUTH_Z));
  const spec = dirSpec(T, o);
  return {
    kind: 'sprite', key: 'dirB', pos: spec.pos, bias: spec.bias, noCull: true,
    draw: (c) => {
      const {F, props} = figProps(c.view, spec);
      const light = figLight(c, F);
      const p2 = {...props, light};
      const {parts, rig} = figureParts(p2);
      parts.sort((a, b) => a.z - b.z);
      const H = underHull(c.view, T);
      const dark = {filter: `brightness(${(1 - (o.k ?? 0.62)).toFixed(2)})`};
      // per arm: the half-plane (screen) on the shoulder side of where it crosses the slab's east edge
      const armClip = (i: 0 | 1): string | null => {
        const W = (q: V3) => rigToWorld(F, q);
        const S = W(rig.sh[i]), Wr = W(rig.wr[i]);
        const a0 = side(S), a1 = side(Wr);
        if (a1 <= 0) return 'all';
        if (a0 >= 0) return null;
        const at = (u: number) => ({x: S.x + (Wr.x - S.x) * u, y: S.y + (Wr.y - S.y) * u, z: S.z + (Wr.z - S.z) * u});
        let lo = 0, hi = 1;
        for (let k = 0; k < 12; k++) { const m = (lo + hi) / 2; if (side(at(m)) > 0) hi = m; else lo = m; }
        const C = project(c.view, at((lo + hi) / 2));
        const a = {x: rig.wr[i].x - rig.sh[i].x, y: rig.wr[i].y - rig.sh[i].y};
        const l = Math.hypot(a.x, a.y) || 1;
        const d = {x: a.x / l, y: a.y / l}, n = {x: -d.y, y: d.x}, B = 6000;
        const P = [{x: C.x + n.x * B, y: C.y + n.y * B}, {x: C.x - n.x * B, y: C.y - n.y * B}];
        return polyD([P[0], P[1], {x: P[1].x - d.x * B, y: P[1].y - d.y * B}, {x: P[0].x - d.x * B, y: P[0].y - d.y * B}]);
      };
      const arms = [armClip(0), armClip(1)];
      const big = 'M-6000 -6000H12000V12000H-6000Z';
      const vol = o.full ? big : H ? polyD(H) : null;
      if (!vol) return <g>{parts.map((q) => <g key={q.key}>{q.el}</g>)}</g>;
      const clips: React.ReactElement[] = [<clipPath key="v" id="bUv"><path d={vol} /></clipPath>];
      arms.forEach((a, i) => { if (a && a !== 'all') clips.push(<clipPath key={`a${i}`} id={`bUa${i}`}><path d={a} /></clipPath>); });
      const armOf = (key: string) => (key === 'arm0' || key === 'handf0' ? 0 : key === 'arm1' || key === 'handf1' ? 1 : -1);
      return (
        <g>
          <defs>{clips}</defs>
          {parts.map((q) => {
            const ai = armOf(q.key);
            const ac = ai >= 0 ? arms[ai] : 'all';
            return (
              <g key={q.key}>
                {q.el}
                {ac && <g clipPath="url(#bUv)">{ac === 'all' ? <g style={dark}>{q.el}</g> : <g clipPath={`url(#bUa${ai})`}><g style={dark}>{q.el}</g></g>}</g>}
              </g>
            );
          })}
        </g>
      );
    },
  };
};
void Figure;

// ------------------------------------------------------------------ the rebar stub
/** A lump of concrete with four bent bars standing out of it; the gripped bar bends toward him under load. */
export const rebarItems = (T: number, o: {bias?: number} = {}): Item[] => {
  const b = REBAR.base;
  const flex = rebarFlex(T);
  const lump: MeshItem = {kind: 'mesh', mesh: chunkMesh(27, 'concreteDark'), key: 'bRebLump', xf: {pos: {x: b.x, y: b.y - 0.12, z: b.z}, scale: 0.62, yaw: 40}, bias: o.bias};
  const bars: Item[] = [];
  const dirs: [number, number, number, number][] = [[0.02, 1, 0.03, 0.6], [0.25, 1, -0.2, 0.5], [-0.3, 1, 0.18, 0.42], [0.15, 1, 0.3, 0.36]];
  dirs.forEach(([dx, dy, dz, L], i) => {
    const o0 = {x: b.x + (rnd(i * 7) - 0.5) * 0.18, y: b.y + 0.1, z: b.z + (rnd(i * 9) - 0.5) * 0.18};
    const d = {x: dx, y: dy, z: dz};
    const n = Math.hypot(dx, dy, dz);
    const bend = i === 0 ? flex : 0;
    // the gripped bar: its top is pulled toward him (a cantilever: the deflection grows with height squared)
    const pts = Array.from({length: 5}, (_, k) => {
      const u = k / 4;
      const p = add3(o0, mul3({x: d.x / n, y: d.y / n, z: d.z / n}, L * u));
      const kink = i === 2 ? {x: 0.12 * u * u, y: -0.08 * u * u, z: -0.05 * u * u} : {x: 0, y: 0, z: 0};
      return add3(add3(p, kink), mul3(REBAR_PULL, 0.07 * bend * u * u));
    });
    bars.push(polyline3(`bReb${i}`, pts, 0.016, '#6A4636', {minPx: 0.8, ink: '#1E1A18', inkW: 1.4, bias: (o.bias ?? 0) + 0.02}));
  });
  return [lump, ...bars];
};

// ------------------------------------------------------------------ dust in the air (close shots)
/** Fine dust motes drifting with the wind through a box around `c` (half sizes `hs`, metres). Lit by the sun. */
export const motes = (key: string, c: V3, hs: V3, T: number, n = 26, size = 0.006): Item[] =>
  Array.from({length: n}, (_, i) => {
    const s = i * 13 + 5;
    const ph = rnd(s) * 20;
    const wrap = (v: number, h: number) => ((((v + h) % (2 * h)) + 2 * h) % (2 * h)) - h;
    const p = {
      x: c.x + wrap((rnd(s * 3) - 0.5) * 2 * hs.x + T * 0.09 + noise(T * 0.3 + ph, s) * 0.05, hs.x),
      y: c.y + wrap((rnd(s * 5) - 0.5) * 2 * hs.y + T * 0.02 + noise(T * 0.4 + ph, s + 1) * 0.04, hs.y),
      z: c.z + wrap((rnd(s * 7) - 0.5) * 2 * hs.z - T * 0.05, hs.z),
    };
    return {
      kind: 'sprite' as const, key: `${key}${i}`, pos: p,
      draw: (cx: {x: number; y: number; k: number; light: {sunColor: string}}) => {
        const r = Math.max(0.7, size * (0.6 + rnd(s * 11)) * cx.k);
        const tw = 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(T * 2 + ph));
        return <circle cx={cx.x} cy={cx.y} r={r} fill="#F2D6B0" opacity={clamp(tw * (r > 6 ? 6 / r : 1))} />;
      },
    };
  });

// ------------------------------------------------------------------ smoke: the crater, and the bank on the avenue
/** Shot-specific smoke columns (pass as Stage atmos.columns). Same list in every B shot that sees the crater. */
export const B_COLUMNS: {key: string; base: V3; o: ColumnOpts}[] = [
  // the crater smokes (low, lying in the bowl, drifting north-east out of it): scorched pits, the broken water main
  {key: 'bCr2', base: {x: 66, y: -2.6, z: -6}, o: {n: 7, life: 16, rise: 0.55, r0: 2.5, r1: 7, drift: 1.0, dark: 0.25, alpha: 0.4, warm: 0.2, seed: 32}},
  {key: 'bCr3', base: {x: 52, y: -1.6, z: -4}, o: {n: 6, life: 13, rise: 0.6, r0: 2.2, r1: 6, drift: 1.2, dark: 0.35, alpha: 0.35, warm: 0.3, seed: 33}},
  {key: 'bCr4', base: {x: 68, y: -1.8, z: 7}, o: {n: 6, life: 15, rise: 0.5, r0: 2.4, r1: 6.5, drift: 1.0, dark: 0.3, alpha: 0.35, warm: 0.25, seed: 34}},
];
/** the low bank the ranks come out of at the start of B3 (east of the crater, over the avenue) */
export const B_BANK: {key: string; base: V3; o: ColumnOpts}[] = [
  {key: 'bBk1', base: {x: 112, y: 0.2, z: -6}, o: {n: 7, life: 16, rise: 0.3, r0: 3, r1: 7.5, drift: 0.6, dark: 0.12, alpha: 0.42, warm: 0, seed: 35}},
  {key: 'bBk2', base: {x: 115, y: 0.2, z: 5}, o: {n: 7, life: 16, rise: 0.3, r0: 3, r1: 7.5, drift: 0.6, dark: 0.12, alpha: 0.42, warm: 0, seed: 36}},
];

// ------------------------------------------------------------------ the army
export type ArmyDraw = {maxFull?: number; maxMid?: number; farFrom?: number; ctl?: (id: number) => Partial<UnitSpec>; heavy?: (i: number) => Partial<HeavySpec>; heavyLod?: (i: number, d: number) => 'full' | 'mid' | 'far'; drones?: boolean};
/** Every machine of the army at film time T, LOD by distance to this view. */
export const armyB = (v: View, T: number, o: ArmyDraw = {}): Item[] => {
  // only the units in (or just outside) the frame and at least a few pixels tall are solved and drawn
  const tanX = (v.W / 2) / v.focal, tanY = (v.H / 2) / v.focal;
  const inView: Formation = {slots: (t) => ARMY_B.slots(t).filter((s) => {
    const q = toView(v, {x: s.pos.x, y: s.pos.y + 1.1, z: s.pos.z});
    return q.z > 0.3 && Math.abs(q.x) < q.z * tanX * 1.1 + 2 && Math.abs(q.y) < q.z * tanY * 1.1 + 2 && (2.2 * v.focal) / q.z > 3;
  })};
  const items = armyItems(v, T, inView, {ground, maxFull: o.maxFull ?? 6, maxMid: o.maxMid ?? 40, farFrom: o.farFrom ?? 90, ctl: o.ctl ? (s) => o.ctl!(s.id) : undefined});
  HEAVIES_B.forEach((_, i) => {
    const sp = heavySpecB(i, T, o.heavy ? o.heavy(i) : {});
    const p = sp.gait!.path(sp.gait!.dist).pos;
    const d = Math.hypot(p.x - v.pos.x, p.z - v.pos.z);
    items.push(...heavy({...sp, lod: o.heavyLod ? o.heavyLod(i, d) : d < 45 ? 'full' : d < 140 ? 'mid' : 'far'}));
  });
  if (o.drones !== false) DRONES_B.forEach((_, i) => {
    const sp = droneSpecB(i, T);
    const d = Math.hypot(sp.pos.x - v.pos.x, sp.pos.z - v.pos.z);
    items.push(...drone({...sp, lod: d < 30 ? 'full' : 'far', scale: d < 30 ? 1 : 1.5}));
  });
  return items;
};
