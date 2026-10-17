// The R2 renderer: one perspective camera, cel-shaded meshes and depth-sorted sprites (characters, machines drawn in
// 2D, fire, smoke, particles), drawn back to front into one SVG. Faces are near-clipped, back-face culled, shaded in
// three tones with banded fire spill and haze, and inked only on silhouettes, creases and open boundaries.
//
// Painter's order: every face and every sprite is an item with a depth (view-space z, metres). Larger depth draws
// first. Large surfaces should be subdivided (terrain cells, facade bays) so the order stays right next to figures.
//
// DEPTH CONTRACT FOR FIGURES (characters, 2D machines, props drawn as sprites):
//   - Put a figure's sprite `pos` at its FOOT point on the ground (x, groundH(x, z), z). Its painter depth is that point.
//   - Ground meshes use sortKey 'max' (a cell's farthest corner) and a small negative bias, and flat streets are
//     forced first (bias −1e5), so the cell a figure stands on — on the street, the crater floor or the ridge slope — is
//     always drawn BEFORE the figure. Terrain that is genuinely in front (the crater's near rim, the ridge crest seen
//     from below) still draws after and hides the feet, which is correct.
//   - Objects (slabs, wrecks, walls, machines as meshes) sort by face mean depth; a figure standing behind a slab is
//     covered by it, one in front covers it.
//   - Two figures in contact (a carry, a grapple) should be ONE sprite that draws both in the right internal order, or
//     use `bias` (metres, + = drawn later) to force who is in front.
//   - Painted marks (Overlay: windows, decals) are drawn inside their face's own item and never sort apart from it.
//   - A MeshItem with `fn` passes index −1 for overlay points and the culling centre.
import React from 'react';
import {V3, add3, sub3, mul3, dot3, cross3, norm3, len3, clamp} from '../../kit/math';
import {View, toView, viewToScreen, SP} from './camera';
import {Prepped, Xf, xfPoint} from './mesh';
import {LightRig, Material, lightAt, shade, inkColor, Lit} from './light';

export type MeshItem = {
  kind: 'mesh';
  mesh: Prepped;
  /** rigid transform applied to the mesh (object → world) */
  xf?: Xf;
  /** arbitrary vertex function (object → world), applied after xf (bending, collapse) */
  fn?: (p: V3, i: number) => V3;
  key?: string;
  /** material renames for this instance: {from: to} */
  remap?: Record<string, string>;
  /** depth bias (metres, + draws later = in front) */
  bias?: number;
  /** sort the whole instance as one block at its centre depth (small props on a surface) */
  asObject?: boolean;
  opacity?: number;
  inkScale?: number;
  /** skip ink entirely */
  noInk?: boolean;
  /** skip the bounding-sphere cull (use with large `fn` displacements) */
  noCull?: boolean;
  /** override the mesh's painter key ('mean' | 'max' | 'min') */
  sortKey?: 'mean' | 'max' | 'min';
};

export type SpriteCtx = SP & {view: View; light: LightRig; t: number; lit: Lit; pos: V3};
export type SpriteItem = {kind: 'sprite'; pos: V3; key?: string; bias?: number; /** surface normal used for lighting (default up) */ n?: V3; /** skip the off-screen anchor cull (a figure whose feet are far below a close frame) */ noCull?: boolean; draw: (c: SpriteCtx) => React.ReactNode};
/** A raw SVG element at a fixed depth (e.g. a screen-space effect that must sort with the world). */
export type RawItem = {kind: 'raw'; depth: number; key?: string; el: React.ReactNode};
export type Item = MeshItem | SpriteItem | RawItem;

export type SceneProps = {
  view: View;
  light: LightRig;
  mats: Record<string, Material>;
  items: Item[];
  t: number;
  /** draw the sky gradient (default true) */
  sky?: boolean;
  /** elements under everything (after the sky) and over everything (screen-space grade) */
  under?: React.ReactNode;
  over?: React.ReactNode;
  /** global ink width in metres (default 0.045) and clamp in px */
  ink?: {w?: number; min?: number; max?: number};
  /** report counts (dev) */
  debug?: boolean;
};

type Out = {d: number; key: string; el: React.ReactElement};

const clipNear = (pts: V3[], near: number): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = a.z >= near, bin = b.z >= near;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (near - a.z) / (b.z - a.z);
      out.push({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: near});
    }
  }
  return out;
};
const clipSeg = (a: V3, b: V3, near: number): [V3, V3] | null => {
  if (a.z < near && b.z < near) return null;
  if (a.z >= near && b.z >= near) return [a, b];
  const t = (near - a.z) / (b.z - a.z);
  const m = {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: near};
  return a.z < near ? [m, b] : [a, m];
};
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

const newell = (P: V3[]) => {
  let n = {x: 0, y: 0, z: 0};
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    n = {x: n.x + (a.y - b.y) * (a.z + b.z), y: n.y + (a.z - b.z) * (a.x + b.x), z: n.z + (a.x - b.x) * (a.y + b.y)};
  }
  return norm3(n);
};

/** Collect the painter's items of one mesh instance. */
const meshOut = (it: MeshItem, v: View, L: LightRig, mats: Record<string, Material>, t: number, ink: {w: number; min: number; max: number}, out: Out[], idx: number) => {
  const m = it.mesh;
  const dynamic = !!(it.xf || it.fn);
  const wp = (p: V3, i: number) => {
    let q = it.xf ? xfPoint(p, it.xf) : p;
    if (it.fn) q = it.fn(q, i);
    return q;
  };
  const world = dynamic ? m.verts.map(wp) : m.verts;
  // bounding-sphere frustum cull
  let c0 = it.xf ? xfPoint(m.center, it.xf) : m.center;
  if (it.fn) c0 = it.fn(c0, -1);
  const sc = it.xf?.scale ? (typeof it.xf.scale === 'number' ? it.xf.scale : Math.max(it.xf.scale.x, it.xf.scale.y, it.xf.scale.z)) : 1;
  const R = m.radius * sc * (it.fn ? 1.5 : 1) + 0.5;
  const cv = toView(v, c0);
  if (!it.noCull && cv.z < -R) return;
  const tanX = (v.W / 2) / v.focal, tanY = (v.H / 2) / v.focal;
  if (!it.noCull && cv.z > 0) {
    if (Math.abs(cv.x) - R > cv.z * tanX + R * 0.5 || Math.abs(cv.y) - R > cv.z * tanY + R * 0.5) return;
  }
  const vv = world.map((p) => toView(v, p));
  const sortKey = it.sortKey ?? m.sortKey ?? 'mean';
  const normals = dynamic ? m.faces.map((f) => newell(f.v.map((i) => world[i]))) : m.normals;
  const cents = dynamic ? m.faces.map((f) => mul3(f.v.reduce((s, i) => add3(s, world[i]), {x: 0, y: 0, z: 0}), 1 / f.v.length)) : m.cents;
  const front = m.faces.map((_, fi) => dot3(normals[fi], sub3(v.pos, cents[fi])) > 0);
  const objDepth = it.asObject ? toView(v, c0).z : 0;
  m.faces.forEach((f, fi) => {
    if (!m.twoSided && !front[fi]) return;
    const matName = it.remap?.[f.mat] ?? f.mat;
    const mat = mats[matName] ?? {base: '#FF00FF'};
    const P = clipNear(f.v.map((i) => vv[i]), v.near);
    if (P.length < 3) return;
    const S = P.map((q) => viewToScreen(v, q));
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const s of S) { minx = Math.min(minx, s.x); maxx = Math.max(maxx, s.x); miny = Math.min(miny, s.y); maxy = Math.max(maxy, s.y); }
    if (maxx < -40 || minx > v.W + 40 || maxy < -40 || miny > v.H + 40) return;
    let n = !dynamic && f.sn ? f.sn : normals[fi];
    if (m.twoSided && !front[fi]) n = mul3(n, -1);
    const dz = P.reduce((s, q) => s + q.z, 0) / P.length;
    const key = sortKey === 'mean' ? dz : sortKey === 'max' ? Math.max(...P.map((q) => q.z)) : Math.min(...P.map((q) => q.z));
    const camDist = len3(sub3(cents[fi], v.pos));
    const lit = lightAt(L, cents[fi], n, camDist, t);
    const fill = shade(L, mat, lit);
    const d = 'M' + S.map((s) => `${f1(s.x)} ${f1(s.y)}`).join('L') + 'Z';
    // ink: silhouettes, creases, boundaries (on the original polygon edges, near-clipped individually)
    let inkD = '';
    if (!it.noInk && !mat.noInk && !f.noInk) {
      for (let e = 0; e < f.v.length; e++) {
        const nb = m.nbr[fi][e];
        const draw = nb < 0 ? m.inkBoundary !== false : m.creaseE[fi][e] || (!m.twoSided && !front[nb]);
        if (!draw) continue;
        const sgm = clipSeg(vv[f.v[e]], vv[f.v[(e + 1) % f.v.length]], v.near);
        if (!sgm) continue;
        const a = viewToScreen(v, sgm[0]), b = viewToScreen(v, sgm[1]);
        inkD += `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;
      }
    }
    const kMid = v.focal / Math.max(dz, v.near);
    const iw = clamp(ink.w * kMid * (mat.inkW ?? 1) * (it.inkScale ?? 1), ink.min, ink.max);
    const op = (mat.opacity ?? 1) * (it.opacity ?? 1);
    const depth = (it.asObject ? objDepth - (dz - objDepth) * 0.001 : key) - (it.bias ?? 0) - (f.bias ?? 0) - (m.bias ?? 0);
    // painted marks on this face (windows, stripes, cracks): same light, same painter item
    let ovEls: React.ReactElement[] | null = null;
    if (f.ov && f.ov.length) {
      ovEls = [];
      f.ov.forEach((o, oi) => {
        const om = mats[it.remap?.[o.mat] ?? o.mat] ?? {base: '#FF00FF'};
        const col = shade(L, om, lit);
        const groups = o.polys ?? (o.pts ? [o.pts] : []);
        let dd = '';
        groups.forEach((G) => {
          const Q = G.map((p) => toView(v, dynamic ? wp(p, -1) : p));
          if (o.line) {
            // open polyline, near-clipped per segment
            for (let i = 0; i + 1 < Q.length; i++) {
              const sg = clipSeg(Q[i], Q[i + 1], v.near);
              if (!sg) continue;
              const a = viewToScreen(v, sg[0]), b = viewToScreen(v, sg[1]);
              dd += `M${f1(a.x)} ${f1(a.y)}L${f1(b.x)} ${f1(b.y)}`;
            }
          } else {
            const C = clipNear(Q, v.near);
            if (C.length < 3) return;
            dd += 'M' + C.map((q) => { const s2 = viewToScreen(v, q); return `${f1(s2.x)} ${f1(s2.y)}`; }).join('L') + 'Z';
          }
        });
        if (!dd) return;
        if (o.line) ovEls!.push(<path key={oi} d={dd} fill="none" stroke={col} strokeWidth={f1(Math.max(0.5, o.line * kMid))} strokeLinecap="round" strokeLinejoin="round" opacity={om.opacity} />);
        else ovEls!.push(<path key={oi} d={dd} fill={col} opacity={om.opacity} stroke={o.ink ? inkColor(L, om, lit) : 'none'} strokeWidth={o.ink ? f1(iw * 0.7) : undefined} strokeLinejoin="round" />);
      });
    }
    out.push({
      d: depth,
      key: `${it.key ?? 'm' + idx}_${fi}`,
      el: (
        <g opacity={op < 1 ? op : undefined}>
          <path d={d} fill={fill} stroke={op < 1 ? 'none' : fill} strokeWidth={0.9} strokeLinejoin="round" />
          {ovEls}
          {inkD && <path d={inkD} fill="none" stroke={inkColor(L, mat, lit)} strokeWidth={f1(iw)} strokeLinecap="round" />}
        </g>
      ),
    });
  });
};

/** Sky gradient: zenith → horizon, with an optional glow band at the horizon. */
const Sky: React.FC<{v: View; L: LightRig}> = ({v, L}) => {
  // horizon line: where a far point at camera height straight ahead lands
  const far = add3(v.pos, mul3(norm3({x: v.f.x, y: 0, z: v.f.z}), 5000));
  const hy = viewToScreen(v, toView(v, far)).y;
  const top = Math.min(-200, hy - 1400), bottom = Math.max(v.H + 200, hy + 200);
  const hk = clamp((hy - top) / (bottom - top), 0.02, 0.98);
  const id = 'r2sky';
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1={top} x2="0" y2={bottom} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={L.skyTop} />
          <stop offset={hk} stopColor={L.skyHorizon} />
          <stop offset={1} stopColor={L.fogColor} />
        </linearGradient>
        {L.skyGlow && (
          <radialGradient id="r2glow" cx={v.W / 2} cy={hy} r={v.W * L.skyGlow.width} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor={L.skyGlow.color} stopOpacity={L.skyGlow.at} />
            <stop offset={1} stopColor={L.skyGlow.color} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      <rect x={-10} y={-10} width={v.W + 20} height={v.H + 20} fill={`url(#${id})`} />
      {L.skyGlow && <rect x={-10} y={-10} width={v.W + 20} height={v.H + 20} fill="url(#r2glow)" />}
    </g>
  );
};

export const sceneItems = (p: SceneProps): Out[] => {
  const ink = {w: p.ink?.w ?? 0.045, min: p.ink?.min ?? 0.6, max: p.ink?.max ?? 3.2};
  const out: Out[] = [];
  p.items.forEach((it, idx) => {
    if (it.kind === 'mesh') meshOut(it, p.view, p.light, p.mats, p.t, ink, out, idx);
    else if (it.kind === 'raw') out.push({d: it.depth, key: it.key ?? `r${idx}`, el: <g>{it.el}</g>});
    else {
      const q = toView(p.view, it.pos);
      if (q.z < p.view.near) return;
      const sp = viewToScreen(p.view, q);
      if (!it.noCull && (sp.x < -p.view.W || sp.x > p.view.W * 2 || sp.y < -p.view.H || sp.y > p.view.H * 2)) return;
      const lit = lightAt(p.light, it.pos, it.n ?? {x: 0, y: 1, z: 0}, len3(sub3(it.pos, p.view.pos)), p.t);
      const el = it.draw({...sp, view: p.view, light: p.light, t: p.t, lit, pos: it.pos});
      if (el) out.push({d: q.z - (it.bias ?? 0), key: it.key ?? `s${idx}`, el: <g>{el}</g>});
    }
  });
  out.sort((a, b) => b.d - a.d);
  return out;
};

export const Scene: React.FC<SceneProps> = (p) => {
  const out = sceneItems(p);
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${p.view.W} ${p.view.H}`} style={{display: 'block'}}>
      {p.sky !== false && <Sky v={p.view} L={p.light} />}
      {p.under}
      {out.map((o) => <React.Fragment key={o.key}>{o.el}</React.Fragment>)}
      {p.over}
      {p.debug && <text x={20} y={40} fill="#fff" fontSize={24}>{out.length} items</text>}
    </svg>
  );
};

export {cross3};
