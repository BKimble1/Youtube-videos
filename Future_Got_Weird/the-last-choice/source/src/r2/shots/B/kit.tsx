// Section B shared drawing: the Director's sprite, the rebar stub (it flexes under his grip), drifting dust, the army
// with its heavies and drones, and the smoke the army comes out of (crater columns + a low bank on the avenue).
import React from 'react';
import {V3, add3, mul3, sub3, dot3, cross3, norm3, rnd, noise, clamp} from '../../../kit/math';
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
import {ARMY_B, HEAVIES_B, DRONES_B, heavySpecB, droneSpecB, SENTRY_B, groupD} from './army';

const ground = (x: number, z: number) => groundH(x, z);

/** The Director at film time T (B), as a sprite. `anchor`: the perspective anchor for close shots. */
export const dirSpec = (T: number, o: {anchor?: V3; bias?: number; key?: string} = {}): FigSpec => {
  const d = dirB(T);
  return {
    key: o.key ?? 'dirB', look: lookR2('director'), t: T, seed: 11, pos: d.pos, heading: d.heading,
    pose: {...d.pose, wearL: plateWear(toolsR2('director', T).plate ?? 'intact'), dmg: dmgR2('director', T)},
    world: d.world, anchor: o.anchor, bias: o.bias, reach: d.reach, gaze: d.gaze, gazeW: d.gazeW,
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
  // the strap's free end runs from the buckle to his fist; its other end (the tongue) is held in his teeth
  const pts: V3[] = held > 0.5 ? [A, hand] : [A, add3(A, {x: 0.01, y: -0.08, z: 0.02}), hang];
  const out = [polyline3('bStrap', pts, 0.032, '#2A2D30', {minPx: 1.2, ink: '#14181B', inkW: 1.4, bias: (o.bias ?? 0) + 0.25})];
  if (bite > 0.5) out.push(polyline3('bStrapT', [mouth, add3(A, {x: 0, y: 0.03, z: 0})], 0.028, '#2A2D30', {minPx: 1.2, ink: '#14181B', inkW: 1.4, bias: (o.bias ?? 0) + 0.26}));
  return out;
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
 * `split` (for a camera that sees him crawl out toward it, with the slab drawn between two layers): 'under' draws him
 * whole, shaded, to go behind the slab; 'out' draws only what is out past the edge, lit, to go in front of it. A part
 * that straddles the edge is cut on screen where the edge plane crosses it (the head and chest emerge gradually).
 */
export const dirShaded = (T: number, o: {anchor?: V3; bias?: number; k?: number; full?: boolean; edge?: {p: V3; n: V3}; split?: 'under' | 'out'; bodyOut?: boolean} = {}): SpriteItem => {
  // the edge plane nearest a point and how far out past it the point is (> 0: out from under the slab: past the given
  // edge plane, or by default past its east or its bitten south edge)
  const sideN = (q: V3): {s: number; n: V3} => {
    if (o.edge) return {s: (q.x - o.edge.p.x) * o.edge.n.x + (q.z - o.edge.p.z) * o.edge.n.z, n: o.edge.n};
    const ex = q.x - SLAB_EAST_X, ez = q.z - SLAB_SOUTH_Z;
    return ex >= ez ? {s: ex, n: {x: 1, y: 0, z: 0}} : {s: ez, n: {x: 0, y: 0, z: 1}};
  };
  const side = (q: V3) => sideN(q).s;
  const spec = dirSpec(T, o);
  const id = o.split === 'out' ? 'bUo' : 'bU';
  return {
    kind: 'sprite', key: o.split === 'out' ? 'dirBo' : 'dirB', pos: spec.pos, bias: spec.bias, noCull: true,
    draw: (c) => {
      const {F, props} = figProps(c.view, spec);
      const light = figLight(c, F);
      const p2 = {...props, light};
      const {parts, rig} = figureParts(p2);
      parts.sort((a, b) => a.z - b.z);
      const H = underHull(c.view, T);
      const dark = {filter: `brightness(${(1 - (o.k ?? 0.62)).toFixed(2)})`};
      const W = (q: V3) => rigToWorld(F, q);
      const P2 = (q: V3) => { const s = project(c.view, q); return {x: s.x, y: s.y}; };
      type Pt = {x: number; y: number};
      // the screen half-plane on the side of the line through A along t that holds S
      const half = (A: Pt, t: Pt, S: Pt): string => {
        const l = Math.hypot(t.x, t.y) || 1, tx = t.x / l, ty = t.y / l;
        let nx = -ty, ny = tx;
        if ((S.x - A.x) * nx + (S.y - A.y) * ny < 0) { nx = -nx; ny = -ny; }
        const B = 6000;
        return polyD([{x: A.x - tx * B, y: A.y - ty * B}, {x: A.x + tx * B, y: A.y + ty * B}, {x: A.x + tx * B + nx * B, y: A.y + ty * B + ny * B}, {x: A.x - tx * B + nx * B, y: A.y - ty * B + ny * B}]);
      };
      // per arm: where it crosses the edge — the shoulder-side half-plane (to shade) and the hand-side one (out)
      const armCut = (i: 0 | 1): {sh: string | 'all' | null; out: string | 'all' | null} => {
        // (the arm runs to the fingertips — about twice the wrist → hand-centre distance — so fingers that are out are
        // lit before the wrist is)
        const hc = rig.hands[i].pos, wr = rig.wr[i];
        const tipD = {x: 2 * hc.x - wr.x, y: 2 * hc.y - wr.y, z: 2 * hc.z - wr.z};
        const S = W(rig.sh[i]), Wr = W(tipD);
        const a0 = side(S), a1 = side(Wr);
        if (a1 <= 0) return {sh: 'all', out: null};
        if (a0 >= 0) return {sh: null, out: 'all'};
        const at = (u: number) => ({x: S.x + (Wr.x - S.x) * u, y: S.y + (Wr.y - S.y) * u, z: S.z + (Wr.z - S.z) * u});
        let lo = 0, hi = 1;
        for (let k = 0; k < 12; k++) { const m = (lo + hi) / 2; if (side(at(m)) > 0) hi = m; else lo = m; }
        const C = P2(at((lo + hi) / 2));
        const a = {x: tipD.x - rig.sh[i].x, y: tipD.y - rig.sh[i].y};
        const nrm = {x: -a.y, y: a.x};
        return {sh: half(C, nrm, {x: C.x - a.x, y: C.y - a.y}), out: half(C, nrm, {x: C.x + a.x, y: C.y + a.y})};
      };
      // a body point (head, chest, hips) within R of the edge: the screen line where the edge plane cuts the plane
      // through the point facing the lens, and its out side
      const bodyCut = (q: V3, R: number): string | 'all' | null => {
        const {s, n} = sideN(q);
        // (bodyOut false: an edge plane that faces the lens makes the cut line degenerate — a body part is out whole once
        // its centre is past the edge; the arms still come out part by part)
        if (o.bodyOut === false) return s >= 0 ? 'all' : null;
        if (s >= R) return 'all';
        if (s <= -R) return null;
        const v = norm3(sub3(q, c.view.pos));
        const w = sub3(n, mul3(v, dot3(n, v)));
        const wn = Math.max(1e-4, dot3(w, n));
        const P0 = add3(q, mul3(w, -s / wn));
        const A = P2(P0), B = P2(add3(P0, mul3(norm3(cross3(v, n)), 0.3))), S = P2(add3(P0, mul3(w, 0.1)));
        return half(A, {x: B.x - A.x, y: B.y - A.y}, S);
      };
      const arms = [armCut(0), armCut(1)];
      const armOf = (key: string) => (key === 'arm0' || key === 'handf0' ? 0 : key === 'arm1' || key === 'handf1' ? 1 : -1);
      const mid = (a: V3, b: V3): V3 => ({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2});
      const chest = W(mid(rig.sh[0], rig.sh[1]));
      const cutHead = bodyCut(W(rig.headC), 0.16), cutChest = bodyCut(chest, 0.45), cutHips = bodyCut(W(mid(rig.hip[0], rig.hip[1])), 0.5);
      // the far arm reaching out while his chest is still under stays under (it is behind his body)
      const nearArm = project(c.view, W(rig.sh[0])).z < project(c.view, W(rig.sh[1])).z ? 0 : 1;
      const outCut = (key: string): string | 'all' | null => {
        const ai = armOf(key);
        if (ai >= 0) return ai === nearArm || side(chest) > 0 ? arms[ai].out : null;
        if (key.startsWith('head') || key === 'neck') return cutHead;
        if (key === 'pelvis' || key.startsWith('leg')) return cutHips;
        if (key === 'shadow') return null;
        return cutChest;
      };
      const big = 'M-6000 -6000H12000V12000H-6000Z';
      if (o.split === 'out') {
        const outs = parts.map((q) => ({q, cut: outCut(q.key)})).filter((x) => x.cut);
        if (!outs.length) return null;
        const clips: React.ReactElement[] = [];
        const keyOf = new Map<string, string>();
        outs.forEach(({q, cut}) => {
          if (cut === 'all' || !cut) return;
          const k = keyOf.get(cut) ?? `${id}c${keyOf.size}`;
          if (!keyOf.has(cut)) { keyOf.set(cut, k); clips.push(<clipPath key={k} id={k}><path d={cut} /></clipPath>); }
        });
        return (
          <g>
            <defs>{clips}</defs>
            {outs.map(({q, cut}) => (cut === 'all' ? <g key={q.key}>{q.el}</g> : <g key={q.key} clipPath={`url(#${keyOf.get(cut as string)})`}>{q.el}</g>))}
          </g>
        );
      }
      const vol = o.full ? big : H ? polyD(H) : null;
      if (!vol) return <g>{parts.map((q) => <g key={q.key}>{q.el}</g>)}</g>;
      const clips: React.ReactElement[] = [<clipPath key="v" id={`${id}v`}><path d={vol} /></clipPath>];
      arms.forEach((a, i) => { if (a.sh && a.sh !== 'all') clips.push(<clipPath key={`a${i}`} id={`${id}a${i}`}><path d={a.sh} /></clipPath>); });
      return (
        <g>
          <defs>{clips}</defs>
          {parts.map((q) => {
            const ai = armOf(q.key);
            const ac = ai >= 0 ? arms[ai].sh : 'all';
            return (
              <g key={q.key}>
                {q.el}
                {ac && <g clipPath={`url(#${id}v)`}>{ac === 'all' ? <g style={dark}>{q.el}</g> : <g clipPath={`url(#${id}a${ai})`}><g style={dark}>{q.el}</g></g>}</g>}
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
  const lump: MeshItem = {kind: 'mesh', mesh: chunkMesh(27, 'concreteDark'), key: 'bRebLump', xf: {pos: {x: b.x, y: b.y - 0.1, z: b.z}, scale: 0.4, yaw: 40}, bias: o.bias};
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
  {key: 'bCr2', base: {x: 66, y: -2.6, z: -6}, o: {n: 7, life: 16, rise: 0.55, r0: 2.5, r1: 7, drift: 1.0, dark: 0.25, alpha: 0.3, warm: 0.2, seed: 32}},
  {key: 'bCr3', base: {x: 52, y: -1.6, z: -4}, o: {n: 6, life: 13, rise: 0.6, r0: 2.2, r1: 6, drift: 1.2, dark: 0.35, alpha: 0.28, warm: 0.3, seed: 33}},
  {key: 'bCr4', base: {x: 68, y: -1.8, z: 7}, o: {n: 6, life: 15, rise: 0.5, r0: 2.4, r1: 6.5, drift: 1.0, dark: 0.3, alpha: 0.28, warm: 0.25, seed: 34}},
];
/** the low bank the ranks come out of at the start of B3 (east of the crater, over the avenue) */
export const B_BANK: {key: string; base: V3; o: ColumnOpts}[] = [
  {key: 'bBk1', base: {x: 112, y: 0.2, z: -6}, o: {n: 7, life: 16, rise: 0.3, r0: 3, r1: 7.5, drift: 0.6, dark: 0.12, alpha: 0.42, warm: 0, seed: 35}},
  {key: 'bBk2', base: {x: 115, y: 0.2, z: 5}, o: {n: 7, life: 16, rise: 0.3, r0: 3, r1: 7.5, drift: 0.6, dark: 0.12, alpha: 0.42, warm: 0, seed: 36}},
];

/**
 * The smoke behind him to the west (B5a, B5b, B6a, and the backdrop of his silhouette): the collapsed building's
 * rubble smoulders — low smoke lying in the ruin (the same four banks as section C's C_COLUMNS: the Crew come out of
 * them) and the plumes rising out of the ruin's broken floors behind it, leaning north-east with the wind. ATMOS's
 * plume look (one connected silhouette per plume, billows rolling up it), backlit by the low sun from the crane.
 * B_WEST_PLUMES is the part C does not have (for C's west-facing shots: add it to C_COLUMNS for continuity).
 */
export const B_WEST_PLUMES: {key: string; base: V3; o: ColumnOpts}[] = [
  // right behind him from the crane: a pale bank of brick dust off the ruin's near edge, lit through by the low sun
  // (his silhouette's backdrop)
  {key: 'bWd', base: {x: -9.5, y: 1.4, z: 1.0}, o: {life: 16, rise: 0.9, r0: 2.6, r1: 6.2, drift: 0.55, dark: 0.04, alpha: 0.92, warm: 0.55, seed: 50}},
  {key: 'bWe', base: {x: -12.5, y: 1.2, z: 7.0}, o: {life: 15, rise: 0.8, r0: 2.4, r1: 5.4, drift: 0.5, dark: 0.08, alpha: 0.9, warm: 0.5, seed: 49}},
  {key: 'bW1', base: {x: -26, y: 2.5, z: -9}, o: {life: 20, rise: 1.6, r0: 2.4, r1: 8.5, drift: 0.9, dark: 0.32, alpha: 0.9, warm: 0.35, seed: 51}},
  {key: 'bW2', base: {x: -30, y: 2.0, z: 5}, o: {life: 22, rise: 1.45, r0: 2.8, r1: 9.5, drift: 1.0, dark: 0.42, alpha: 0.9, warm: 0.3, seed: 52}},
  {key: 'bW3', base: {x: -22, y: 3.0, z: 16}, o: {life: 18, rise: 1.25, r0: 2.0, r1: 6.5, drift: 0.8, dark: 0.28, alpha: 0.85, warm: 0.35, seed: 53}},
  {key: 'bW4', base: {x: -33, y: 2.0, z: -19}, o: {life: 20, rise: 1.8, r0: 3.0, r1: 10, drift: 1.1, dark: 0.5, alpha: 0.9, warm: 0.25, seed: 54}},
];
/** B's whole west smoke: section C's four low banks in the ruin (same keys and values as C's C_COLUMNS) + the plumes */
export const B_WEST_SMOKE: {key: string; base: V3; o: ColumnOpts}[] = [
  {key: 'cRu1', base: {x: -19.4, y: 0.9, z: -2.0}, o: {n: 7, life: 15, rise: 0.22, r0: 2.0, r1: 4.6, drift: 0.32, dark: 0.12, alpha: 0.5, warm: 0.12, seed: 41}},
  {key: 'cRu2', base: {x: -20.2, y: 1.0, z: 2.6}, o: {n: 7, life: 15, rise: 0.22, r0: 2.0, r1: 4.6, drift: 0.32, dark: 0.14, alpha: 0.48, warm: 0.12, seed: 42}},
  {key: 'cRu3', base: {x: -18.8, y: 0.8, z: -5.6}, o: {n: 5, life: 14, rise: 0.25, r0: 1.8, r1: 4.2, drift: 0.35, dark: 0.18, alpha: 0.42, warm: 0.1, seed: 43}},
  {key: 'cSW1', base: {x: -13.2, y: 0.6, z: 14.4}, o: {n: 6, life: 14, rise: 0.3, r0: 1.8, r1: 4.4, drift: 0.45, dark: 0.18, alpha: 0.5, warm: 0.15, seed: 45}},
  ...B_WEST_PLUMES,
];

// ------------------------------------------------------------------ the army
export type ArmyDraw = {maxFull?: number; maxMid?: number; farFrom?: number; ctl?: (id: number) => Partial<UnitSpec>; heavy?: (i: number) => Partial<HeavySpec>; heavyLod?: (i: number, d: number) => 'full' | 'mid' | 'far'; drones?: boolean;
  /** give these heavies' gait the march clock (gait.distAt): exact footfalls (dust, ground shake) and, once halted, the
   *  swinging foot comes down (heavySpecB's default leaves it as R2 had it) */
  heavyDistAt?: (i: number) => boolean};
/** Every machine of the army at film time T, LOD by distance to this view. */
export const armyB = (v: View, T: number, o: ArmyDraw = {}): Item[] => {
  // only the units in (or just outside) the frame and at least a few pixels tall are solved and drawn
  const tanX = (v.W / 2) / v.focal, tanY = (v.H / 2) / v.focal, cy = (v.sy ?? 0) / v.focal;
  const inView: Formation = {slots: (t) => ARMY_B.slots(t).filter((s) => {
    const q = toView(v, {x: s.pos.x, y: s.pos.y + 1.1, z: s.pos.z});
    return q.z > 0.3 && Math.abs(q.x) < q.z * tanX * 1.1 + 2 && Math.abs(q.y - q.z * cy) < q.z * tanY * 1.1 + 2 && (2.2 * v.focal) / q.z > 3;
  })};
  const items = armyItems(v, T, inView, {ground, maxFull: o.maxFull ?? 6, maxMid: o.maxMid ?? 40, farFrom: o.farFrom ?? 90, ctl: o.ctl ? (s) => o.ctl!(s.id) : undefined});
  HEAVIES_B.forEach((_, i) => {
    const sp0 = heavySpecB(i, T, o.heavy ? o.heavy(i) : {});
    const sp = o.heavyDistAt?.(i) && sp0.gait ? {...sp0, gait: {...sp0.gait, distAt: (t: number) => groupD('rear', t)}} : sp0;
    const p = sp.gait!.path(sp.gait!.dist).pos;
    const d = Math.hypot(p.x - v.pos.x, p.z - v.pos.z);
    items.push(...heavy({...sp, lod: o.heavyLod ? o.heavyLod(i, d) : d < 45 ? 'full' : d < 140 ? 'mid' : 'far'}));
  });
  if (o.drones !== false) DRONES_B.forEach((_, i) => {
    const sp = droneSpecB(i, T);
    const d = Math.hypot(sp.pos.x - v.pos.x, sp.pos.z - v.pos.z);
    // the sentry (B6) flies through every distance on screen: always full detail at its true size (no LOD pop)
    if (i === SENTRY_B) { items.push(...drone({...sp, lod: 'full', scale: 1})); return; }
    items.push(...drone({...sp, lod: d < 30 ? 'full' : 'far', scale: d < 30 ? 1 : 1.5}));
  });
  return items;
};
