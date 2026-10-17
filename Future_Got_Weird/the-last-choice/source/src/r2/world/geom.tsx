// Geometry helpers for the set: ground grids that carry painted decals per cell, polygon clipping, and 3D polylines
// drawn as depth-sorted sprites (rebar, cables, antennas).
import React from 'react';
import {V3, clamp, rnd} from '../../kit/math';
import {Mesh, Face, Overlay, Item, SpriteCtx, toView, viewToScreen, mix} from '../engine';

export type XZ = {x: number; z: number};
export type Decal = {pts: XZ[]; mat: string; line?: number; lift?: number};

/** Sutherland–Hodgman clip of a polygon (x,z) to an axis-aligned rectangle. */
export const clipRect = (pts: XZ[], x0: number, x1: number, z0: number, z1: number): XZ[] => {
  const edge = (P: XZ[], inside: (p: XZ) => boolean, cut: (a: XZ, b: XZ) => XZ) => {
    const out: XZ[] = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const ai = inside(a), bi = inside(b);
      if (ai) out.push(a);
      if (ai !== bi) out.push(cut(a, b));
    }
    return out;
  };
  const cx = (X: number) => (a: XZ, b: XZ) => ({x: X, z: a.z + ((b.z - a.z) * (X - a.x)) / (b.x - a.x)});
  const cz = (Z: number) => (a: XZ, b: XZ) => ({x: a.x + ((b.x - a.x) * (Z - a.z)) / (b.z - a.z), z: Z});
  let P = pts;
  P = edge(P, (p) => p.x >= x0, cx(x0)); if (P.length < 3) return [];
  P = edge(P, (p) => p.x <= x1, cx(x1)); if (P.length < 3) return [];
  P = edge(P, (p) => p.z >= z0, cz(z0)); if (P.length < 3) return [];
  P = edge(P, (p) => p.z <= z1, cz(z1)); if (P.length < 3) return [];
  return P;
};

/** Liang–Barsky clip of a polyline to a rectangle; returns the pieces inside. */
export const clipLineRect = (pts: XZ[], x0: number, x1: number, z0: number, z1: number): XZ[][] => {
  const pieces: XZ[][] = [];
  let cur: XZ[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    let t0 = 0, t1 = 1;
    const ok = [[-dx, a.x - x0], [dx, x1 - a.x], [-dz, a.z - z0], [dz, z1 - a.z]].every(([p, q]) => {
      if (p === 0) return q >= 0;
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
      return true;
    });
    if (!ok) { if (cur.length > 1) pieces.push(cur); cur = []; continue; }
    const A = {x: a.x + dx * t0, z: a.z + dz * t0}, B = {x: a.x + dx * t1, z: a.z + dz * t1};
    if (cur.length === 0 || t0 > 0) { if (cur.length > 1) pieces.push(cur); cur = [A]; }
    cur.push(B);
    if (t1 < 1) { pieces.push(cur); cur = []; }
  }
  if (cur.length > 1) pieces.push(cur);
  return pieces;
};

/**
 * A ground grid over [x0,x1]×[z0,z1] (cells cx × cz) following h(x,z), one quad per cell (smooth shading normal),
 * with decals clipped into the cells they cross so each piece is drawn with its own cell.
 */
export const groundGrid = (
  x0: number, x1: number, z0: number, z1: number, cx: number, cz: number,
  h: (x: number, z: number) => number,
  mat: (x: number, z: number, slope: number) => string,
  decals: Decal[] = [],
  o: {sortKey?: 'mean' | 'max' | 'min'; bias?: number; crease?: number; inkBoundary?: boolean} = {},
): Mesh => {
  const nx = Math.max(1, Math.round((x1 - x0) / cx)), nz = Math.max(1, Math.round((z1 - z0) / cz));
  const verts: V3[] = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = x0 + ((x1 - x0) * i) / nx, z = z0 + ((z1 - z0) * j) / nz;
    verts.push({x, y: h(x, z), z});
  }
  const id = (i: number, j: number) => j * (nx + 1) + i;
  // bucket decals by bounding box for speed
  const dbb = decals.map((d) => {
    let a = 1e9, b = -1e9, c = 1e9, e = -1e9;
    d.pts.forEach((p) => { a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.z); e = Math.max(e, p.z); });
    const pad = d.line ?? 0;
    return {x0: a - pad, x1: b + pad, z0: c - pad, z1: e + pad};
  });
  const faces: Face[] = [];
  const dx = (x1 - x0) / nx, dz = (z1 - z0) / nz;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
    const ax = x0 + dx * i, bx = ax + dx, az = z0 + dz * j, bz = az + dz;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    // sample the slope over ~2.5 m: light falls in large shapes, small rubble lumps stay in the silhouette only
    const e = Math.max(2.4, Math.max(dx, dz) * 1.5);
    const gx = (h(mx + e, mz) - h(mx - e, mz)) / (2 * e), gz = (h(mx, mz + e) - h(mx, mz - e)) / (2 * e);
    const L = Math.hypot(gx, 1, gz);
    const sn = {x: -gx / L, y: 1 / L, z: -gz / L};
    const slope = Math.acos(clamp(sn.y, -1, 1)) * 57.2958;
    // one path per material/width per cell: group the clipped pieces
    const groups = new Map<string, Overlay>();
    const addOv = (pts: V3[], mat: string, line?: number) => {
      const key = `${mat}|${line ?? 0}`;
      let g = groups.get(key);
      if (!g) { g = {polys: [], mat, line}; groups.set(key, g); }
      g.polys!.push(pts);
    };
    decals.forEach((dc, k) => {
      const bb = dbb[k];
      if (bb.x1 < ax || bb.x0 > bx || bb.z1 < az || bb.z0 > bz) return;
      const lift = dc.lift ?? 0.012;
      if (dc.line) {
        clipLineRect(dc.pts, ax, bx, az, bz).forEach((pc) => addOv(pc.map((p) => ({x: p.x, y: h(p.x, p.z) + lift, z: p.z})), dc.mat, dc.line));
      } else {
        const pc = clipRect(dc.pts, ax, bx, az, bz);
        if (pc.length >= 3) addOv(pc.map((p) => ({x: p.x, y: h(p.x, p.z) + lift, z: p.z})), dc.mat);
      }
    });
    const ov = [...groups.values()];
    faces.push({v: [a, d, c, b], mat: mat(mx, mz, slope), sn, ov: ov.length ? ov : undefined});
  }
  return {verts, faces, twoSided: true, crease: o.crease ?? 40, inkBoundary: o.inkBoundary ?? false, sortKey: o.sortKey ?? 'max', bias: o.bias};
};

/** Irregular blob polygon (scorch, stain, pothole) around (x,z), radius r. */
export const blobXZ = (x: number, z: number, r: number, seed: number, n = 11, rough = 0.35, sx = 1, sz = 1): XZ[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 - rough / 2 + rough * rnd(seed * 31 + i));
    return {x: x + Math.cos(a) * rr * sx, z: z + Math.sin(a) * rr * sz};
  });

/** Small chips of rubble/dust scattered over an area (texture for close shots): n polygons of 0.06–0.3 m. */
export const chipsXZ = (x0: number, x1: number, z0: number, z1: number, n: number, seed: number, mats: string[]): Decal[] =>
  Array.from({length: n}, (_, i) => {
    const s = seed * 977 + i;
    const x = x0 + rnd(s) * (x1 - x0), z = z0 + rnd(s * 3) * (z1 - z0);
    const r = 0.03 + Math.pow(rnd(s * 5), 2.4) * 0.14;
    return {pts: blobXZ(x, z, r, s, 4 + Math.floor(rnd(s * 7) * 3), 0.6, 1 + rnd(s * 9) * 0.8, 1), mat: mats[i % mats.length], lift: 0.02};
  });

/** A jagged crack polyline from (x,z) heading `ang` (radians) of length L. */
export const crackXZ = (x: number, z: number, ang: number, L: number, seed: number, steps = 7): XZ[] => {
  const pts: XZ[] = [{x, z}];
  let a = ang, px = x, pz = z;
  for (let i = 0; i < steps; i++) {
    a += (rnd(seed * 17 + i) - 0.5) * 0.9;
    const s = (L / steps) * (0.6 + 0.8 * rnd(seed * 13 + i));
    px += Math.cos(a) * s; pz += Math.sin(a) * s;
    pts.push({x: px, z: pz});
  }
  return pts;
};

/**
 * A 3D polyline as a sprite (rebar, cables, antennas, thin rails): projected and drawn at its mid-point's depth,
 * width `w` metres (at least `minPx`), hazed with distance like the meshes.
 */
export const polyline3 = (key: string, pts: V3[], w: number, color: string, o: {minPx?: number; bias?: number; ink?: string; inkW?: number} = {}): Item => {
  const mid = pts[Math.floor(pts.length / 2)];
  return {
    kind: 'sprite', key, pos: mid, bias: o.bias,
    draw: (c: SpriteCtx) => {
      let d = '';
      let ok = false;
      for (let i = 0; i < pts.length; i++) {
        const q = toView(c.view, pts[i]);
        if (q.z < c.view.near) { ok = false; continue; }
        const s = viewToScreen(c.view, q);
        d += `${ok ? 'L' : 'M'}${s.x.toFixed(1)} ${s.y.toFixed(1)}`;
        ok = true;
      }
      if (!d) return null;
      const px = Math.max(o.minPx ?? 0.6, w * c.k);
      const col = mix(color, c.light.fogColor, c.lit.fog);
      return (
        <g>
          {o.ink && <path d={d} fill="none" stroke={mix(o.ink, c.light.fogColor, c.lit.fog)} strokeWidth={px + (o.inkW ?? 1.6)} strokeLinecap="round" strokeLinejoin="round" />}
          <path d={d} fill="none" stroke={col} strokeWidth={px} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    },
  };
};

/** Bent rebar strands sticking out of a broken concrete edge: origin, outward direction, count. */
export const rebarAt = (key: string, o: V3, dir: V3, n: number, len: number, seed: number): Item[] =>
  Array.from({length: n}, (_, i) => {
    const r = (k: number) => rnd(seed * 71 + i * 7 + k) - 0.5;
    const base = {x: o.x + r(1) * 0.8, y: o.y + r(2) * 0.25, z: o.z + r(3) * 0.8};
    const L = len * (0.5 + rnd(seed * 3 + i));
    const bend = {x: r(4) * 0.9, y: r(5) * 0.7 - 0.25, z: r(6) * 0.9};
    const p1 = {x: base.x + dir.x * L * 0.55, y: base.y + dir.y * L * 0.55, z: base.z + dir.z * L * 0.55};
    const p2 = {x: p1.x + (dir.x + bend.x) * L * 0.45, y: p1.y + (dir.y + bend.y) * L * 0.45, z: p1.z + (dir.z + bend.z) * L * 0.45};
    return polyline3(`${key}_${i}`, [base, p1, p2], 0.022, '#5E4436', {minPx: 0.7, ink: '#1E1A18', inkW: 1.2});
  });
