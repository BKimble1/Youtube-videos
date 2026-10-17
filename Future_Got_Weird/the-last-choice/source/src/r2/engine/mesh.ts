// Meshes for the cel engine: indexed polygons with a material name per face, prepared once (normals, edge
// adjacency, crease flags) and then drawn from any camera. Builders produce outward-facing CCW polygons (seen from
// outside, vertices run counter-clockwise), so back-face culling and silhouette edges work.
import {V3, add3, sub3, mul3, cross3, dot3, norm3, rotAxis, rad, rnd, len3} from '../../kit/math';

/**
 * A mark painted on a face (window, stripe, crack, scorch, rebar line): drawn inside the face's own painter item, right
 * after its fill, so it can never sort apart from the surface it lies on. Points in the same (object) space as the mesh,
 * lying on (or a hair in front of) the face plane. `line` = open polyline of that width in metres instead of a fill.
 */
export type Overlay = {
  /** one polygon (or polyline when `line` is set) */
  pts?: V3[];
  /** several polygons/polylines drawn as ONE path (e.g. all the dark windows of a facade) */
  polys?: V3[][];
  mat: string;
  line?: number;
  /** ink outline (fills only) */ ink?: boolean;
};
export type Face = {
  v: number[]; mat: string;
  /** never draw ink edges on this face */ noInk?: boolean;
  /** extra depth bias (m), + = drawn later */ bias?: number;
  /** shading normal (static meshes; e.g. smooth terrain) */ sn?: V3;
  /** painted marks drawn with this face */ ov?: Overlay[];
};
export type Mesh = {
  verts: V3[];
  faces: Face[];
  /** crease angle (deg) above which a shared edge is inked; default 35 */
  crease?: number;
  /** draw both sides (terrain, thin sheets); no back-face culling */
  twoSided?: boolean;
  /** ink boundary (unshared) edges; default true */
  inkBoundary?: boolean;
  /** depth-sort the whole mesh as one item at its nearest/centroid depth (small props) */
  sortAs?: 'faces' | 'object';
  /**
   * which depth of a face is its painter's key: 'mean' (default), 'max' (farthest vertex — ground: a surface is drawn
   * before anything standing on it), 'min' (nearest vertex)
   */
  sortKey?: 'mean' | 'max' | 'min';
  /** depth bias for every face (m, + = drawn later) */
  bias?: number;
};
export type Prepped = Mesh & {
  normals: V3[]; // per face (object space)
  cents: V3[];
  nbr: number[][]; // per face, per edge (v[i] -> v[i+1]): neighbouring face or -1
  creaseE: boolean[][]; // per face edge: crease?
  radius: number; // bounding radius about centre
  center: V3;
};

const faceNormal = (vs: V3[], f: number[]) => {
  // Newell's method (robust for non-planar quads)
  let n = {x: 0, y: 0, z: 0};
  for (let i = 0; i < f.length; i++) {
    const a = vs[f[i]], b = vs[f[(i + 1) % f.length]];
    n = {x: n.x + (a.y - b.y) * (a.z + b.z), y: n.y + (a.z - b.z) * (a.x + b.x), z: n.z + (a.x - b.x) * (a.y + b.y)};
  }
  return norm3(n);
};

export const prep = (m: Mesh): Prepped => {
  const normals = m.faces.map((f) => faceNormal(m.verts, f.v));
  const cents = m.faces.map((f) => mul3(f.v.reduce((s, i) => add3(s, m.verts[i]), {x: 0, y: 0, z: 0}), 1 / f.v.length));
  const key = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  const map = new Map<string, [number, number][]>();
  m.faces.forEach((f, fi) => f.v.forEach((a, ei) => {
    const b = f.v[(ei + 1) % f.v.length];
    const k = key(a, b);
    const l = map.get(k) ?? [];
    l.push([fi, ei]);
    map.set(k, l);
  }));
  const cos = Math.cos(rad(m.crease ?? 35));
  const nbr = m.faces.map((f) => f.v.map(() => -1));
  const creaseE = m.faces.map((f) => f.v.map(() => false));
  map.forEach((l) => {
    if (l.length === 2) {
      const [[fa, ea], [fb, eb]] = l;
      nbr[fa][ea] = fb; nbr[fb][eb] = fa;
      const c = dot3(normals[fa], normals[fb]) < cos;
      creaseE[fa][ea] = c; creaseE[fb][eb] = c;
    }
  });
  let lo = {x: 1e9, y: 1e9, z: 1e9}, hi = {x: -1e9, y: -1e9, z: -1e9};
  m.verts.forEach((p) => {
    lo = {x: Math.min(lo.x, p.x), y: Math.min(lo.y, p.y), z: Math.min(lo.z, p.z)};
    hi = {x: Math.max(hi.x, p.x), y: Math.max(hi.y, p.y), z: Math.max(hi.z, p.z)};
  });
  const center = mul3(add3(lo, hi), 0.5);
  return {...m, normals, cents, nbr, creaseE, center, radius: len3(sub3(hi, center))};
};

// ------------------------------------------------------------------ builders (all return Mesh; call prep() once)
export const merge = (...ms: Mesh[]): Mesh => {
  const verts: V3[] = [];
  const faces: Face[] = [];
  ms.forEach((m) => {
    const o = verts.length;
    verts.push(...m.verts);
    m.faces.forEach((f) => faces.push({...f, v: f.v.map((i) => i + o)}));
  });
  return {verts, faces, crease: ms[0]?.crease, twoSided: ms.some((m) => m.twoSided)};
};

export type Xf = {pos?: V3; /** heading degrees about +y (see headingVec) */ yaw?: number; pitch?: number; roll?: number; scale?: number | V3};
/** Rotate about y by heading (clockwise from above, 0 = north), then pitch about x, roll about z (object space). */
export const xfPoint = (p: V3, x: Xf): V3 => {
  const sc = x.scale ?? 1;
  let q = typeof sc === 'number' ? mul3(p, sc) : {x: p.x * sc.x, y: p.y * sc.y, z: p.z * sc.z};
  if (x.roll) q = rotAxis(q, {x: 0, y: 0, z: 1}, rad(x.roll));
  if (x.pitch) q = rotAxis(q, {x: 1, y: 0, z: 0}, rad(x.pitch));
  if (x.yaw) q = rotAxis(q, {x: 0, y: 1, z: 0}, -rad(x.yaw));
  return x.pos ? add3(q, x.pos) : q;
};
export const xfMesh = (m: Mesh, x: Xf): Mesh => ({
  ...m,
  verts: m.verts.map((p) => xfPoint(p, x)),
  faces: m.faces.map((f) => (f.ov ? {...f, ov: f.ov.map((o) => ({...o, pts: o.pts?.map((p) => xfPoint(p, x)), polys: o.polys?.map((P) => P.map((p) => xfPoint(p, x)))}))} : f)),
});

/** Axis-aligned box from min to max corner; mats: [top, bottom, north(−z), south(+z), west(−x), east(+x)] or one material. */
export const box = (lo: V3, hi: V3, mats: string | string[]): Mesh => {
  const M = typeof mats === 'string' ? [mats, mats, mats, mats, mats, mats] : mats;
  const v: V3[] = [
    {x: lo.x, y: lo.y, z: lo.z}, {x: hi.x, y: lo.y, z: lo.z}, {x: hi.x, y: lo.y, z: hi.z}, {x: lo.x, y: lo.y, z: hi.z},
    {x: lo.x, y: hi.y, z: lo.z}, {x: hi.x, y: hi.y, z: lo.z}, {x: hi.x, y: hi.y, z: hi.z}, {x: lo.x, y: hi.y, z: hi.z},
  ];
  return {
    verts: v,
    faces: [
      {v: [4, 7, 6, 5], mat: M[0]}, // top (+y)
      {v: [0, 1, 2, 3], mat: M[1]}, // bottom
      {v: [0, 4, 5, 1], mat: M[2]}, // north (−z)
      {v: [3, 2, 6, 7], mat: M[3]}, // south (+z)
      {v: [0, 3, 7, 4], mat: M[4]}, // west (−x)
      {v: [1, 5, 6, 2], mat: M[5]}, // east (+x)
    ],
  };
};

/** Centred box (size w × h × d, base at y=0) — handy for parts. */
export const cbox = (w: number, h: number, d: number, mat: string | string[], y0 = 0): Mesh => box({x: -w / 2, y: y0, z: -d / 2}, {x: w / 2, y: y0 + h, z: d / 2}, mat);

/**
 * Extrude a ground-plane polygon (x,z points, CCW seen from above i.e. from +y) from y0 to y1.
 * Side faces get `side`, the cap `top` (and optionally `bottom`).
 */
export const extrude = (poly: {x: number; z: number}[], y0: number, y1: number, top: string, side: string, bottom?: string): Mesh => {
  const n = poly.length;
  // ensure CCW when seen from above (+y looking down: x right, z down on paper → use signed area with z flipped)
  let area = 0;
  for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; area += a.x * -b.z - b.x * -a.z; }
  const P = area < 0 ? [...poly].reverse() : poly;
  const verts: V3[] = [...P.map((p) => ({x: p.x, y: y0, z: p.z})), ...P.map((p) => ({x: p.x, y: y1, z: p.z}))];
  const faces: Face[] = [];
  faces.push({v: P.map((_, i) => n + i), mat: top});
  if (bottom) faces.push({v: P.map((_, i) => n - 1 - i), mat: bottom});
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push({v: [i, n + i, n + j, j].reverse(), mat: side});
  }
  return {verts, faces};
};

/** A thick slab from a polygon in its own plane: pts in (u,v) on a plane through `o` spanned by `U`,`V`; thickness along −N. */
export const slab = (o: V3, U: V3, V: V3, pts: {u: number; v: number}[], thick: number, face: string, edge: string, back?: string): Mesh => {
  const N = norm3(cross3(U, V));
  const P = (u: number, v: number, d: number) => add3(add3(add3(o, mul3(U, u)), mul3(V, v)), mul3(N, -d));
  const n = pts.length;
  const verts = [...pts.map((p) => P(p.u, p.v, 0)), ...pts.map((p) => P(p.u, p.v, thick))];
  const faces: Face[] = [{v: pts.map((_, i) => i), mat: face}, {v: pts.map((_, i) => 2 * n - 1 - i), mat: back ?? edge}];
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; faces.push({v: [i, n + i, n + j, j], mat: edge}); }
  // fix winding of the front cap so its normal is +N
  const m: Mesh = {verts, faces};
  const nf = faceNormal(verts, faces[0].v);
  if (dot3(nf, N) < 0) {
    faces[0].v.reverse(); faces[1].v.reverse();
    for (let i = 2; i < faces.length; i++) faces[i].v.reverse();
  }
  return m;
};

/** Low-poly cylinder along +y (pipes, posts, tanks). */
export const cylinder = (r: number, h: number, seg: number, side: string, cap: string, y0 = 0): Mesh => {
  const verts: V3[] = [];
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; verts.push({x: Math.cos(a) * r, y: y0, z: Math.sin(a) * r}); }
  for (let i = 0; i < seg; i++) { const a = (i / seg) * Math.PI * 2; verts.push({x: Math.cos(a) * r, y: y0 + h, z: Math.sin(a) * r}); }
  const faces: Face[] = [{v: Array.from({length: seg}, (_, i) => seg + (seg - 1 - i)), mat: cap}, {v: Array.from({length: seg}, (_, i) => i), mat: cap}];
  // ring vertices run +x → +z (clockwise seen from above), so this order faces outward and the caps face ±y
  for (let i = 0; i < seg; i++) { const j = (i + 1) % seg; faces.push({v: [i, seg + i, seg + j, j], mat: side}); }
  return {verts, faces, crease: 50};
};

/** A cylinder between two points (struts, rebar, cables with thickness). */
export const strut = (a: V3, b: V3, r: number, seg: number, mat: string): Mesh => {
  const d = sub3(b, a), L = len3(d);
  const c = cylinder(r, L, seg, mat, mat);
  const y = norm3(d);
  const ref = Math.abs(y.y) > 0.9 ? {x: 1, y: 0, z: 0} : {x: 0, y: 1, z: 0};
  const x = norm3(cross3(ref, y)), z = cross3(x, y);
  return {...c, verts: c.verts.map((p) => add3(a, add3(add3(mul3(x, p.x), mul3(y, p.y)), mul3(z, p.z))))};
};

/**
 * Heightfield terrain on a regular grid over [x0,x1]×[z0,z1] with cell size `cell`; `h(x,z)` returns the height and
 * `mat(x,z,slope)` the material of each quad. Faces are quads (split along the better diagonal into triangles when
 * strongly non-planar). Two-sided; ink only on strong creases.
 */
export const terrain = (x0: number, x1: number, z0: number, z1: number, cell: number, h: (x: number, z: number) => number, mat: (x: number, z: number, slope: number) => string, crease = 38): Mesh => {
  const nx = Math.max(1, Math.round((x1 - x0) / cell)), nz = Math.max(1, Math.round((z1 - z0) / cell));
  const verts: V3[] = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + ((x1 - x0) * i) / nx, z = z0 + ((z1 - z0) * j) / nz;
    verts.push({x, y: h(x, z), z});
  }
  const id = (i: number, j: number) => j * (nx + 1) + i;
  const faces: Face[] = [];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
    // seen from above (+y): a(x0,z0) → d(x0,z1) → c → b is CCW
    const pa = verts[a], pb = verts[b], pc = verts[c], pd = verts[d];
    const cx = (pa.x + pc.x) / 2, cz = (pa.z + pc.z) / 2;
    const nrm = faceNormal(verts, [a, d, c, b]);
    const slope = Math.acos(Math.max(-1, Math.min(1, nrm.y))) * 57.2958;
    const m = mat(cx, cz, slope);
    // smooth shading normal from the height function (large flat light shapes instead of a facet mosaic)
    const e = cell * 1.5;
    const sn = norm3({x: (h(cx - e, cz) - h(cx + e, cz)) / (2 * e), y: 1, z: (h(cx, cz - e) - h(cx, cz + e)) / (2 * e)});
    const planar = Math.abs((pa.y + pc.y) - (pb.y + pd.y));
    if (planar > cell * 0.12) {
      // split along the shorter diagonal
      if (Math.abs(pa.y - pc.y) < Math.abs(pb.y - pd.y)) { faces.push({v: [a, d, c], mat: m, sn}, {v: [a, c, b], mat: m, sn}); }
      else { faces.push({v: [a, d, b], mat: m, sn}, {v: [d, c, b], mat: m, sn}); }
    } else faces.push({v: [a, d, c, b], mat: m, sn});
  }
  return {verts, faces, twoSided: true, crease, inkBoundary: false};
};

/** Irregular chunk of rubble: a jittered box (convex-ish), seeded. Size in metres, base at y=0. */
export const chunk = (w: number, h: number, d: number, seed: number, mat: string | string[], jitter = 0.28): Mesh => {
  const b = cbox(w, h, d, mat);
  const j = (i: number, s: number) => (rnd(seed * 97 + i * 13 + s) - 0.5) * 2 * jitter;
  return {...b, verts: b.verts.map((p, i) => ({x: p.x * (1 + j(i, 1)), y: p.y === 0 ? 0 : p.y * (1 + j(i, 2) * 0.8), z: p.z * (1 + j(i, 3))})), crease: 25};
};

export const translate = (m: Mesh, d: V3): Mesh => xfMesh(m, {pos: d});
export const centroid = (pts: V3[]) => mul3(pts.reduce((s, p) => add3(s, p), {x: 0, y: 0, z: 0}), 1 / pts.length);
