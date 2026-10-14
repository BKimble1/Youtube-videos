// Set-building primitives for the V3 engine: shaded boxes, tapered cylinders, quads and 3D lines.
// Each returns depth-tagged items so a shot can painter-sort set pieces and robots together.
import React from 'react';
import {Proj} from './camera';
import {V3, add, cross, dot, len, mulS, norm, sub, mv, rotY, clamp01} from './math';
import {hull, polyClosed, polyOpen, smoothClosed, smoothOpen, Pt, clipNear, clipNearLine, inFront} from './draw';

/** Screen-space bounding box [x0, y0, x1, y1]. */
export type BB = [number, number, number, number];
/** Geometry that lets the sorter resolve occlusion exactly: a face's plane (n·x = d), or a dynamic body's points. */
export type Geo = {kind: 'plane'; n: V3; d: number} | {kind: 'body'; pts: V3[]};
export type Item = {z: number; key: string; el: React.ReactNode; geo?: Geo; bb?: BB};

export const bbOf = (pts: {x: number; y: number}[]): BB => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of pts) {
    if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x;
    if (q.y < y0) y0 = q.y; if (q.y > y1) y1 = q.y;
  }
  return [x0, y0, x1, y1];
};
export const planeGeo = (n: V3, p: V3): Geo => ({kind: 'plane', n, d: dot(n, p)});
export type Glow = {pos: V3; color: string; strength: number; falloff: number};
export type Env = {light: V3; ambient: number; glow?: Glow; ink: string; lineW: number; fog?: {color: string; near: number; far: number; max: number}};

// ---------------------------------------------------------------- colour
const hexRgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
};
export const scaleHex = (a: string, k: number) => {
  const A = hexRgb(a);
  return rgbHex(A[0] * k, A[1] * k, A[2] * k);
};
export const addHex = (a: string, b: string, k: number) => {
  const A = hexRgb(a), B = hexRgb(b);
  return rgbHex(A[0] + B[0] * k, A[1] + B[1] * k, A[2] + B[2] * k);
};

/** Flat shading for a face with normal n at point p. */
export const shadeFace = (env: Env, base: string, n: V3, p: V3): string => {
  const lam = Math.max(0, dot(n, env.light));
  let c = scaleHex(base, env.ambient + (1 - env.ambient) * lam);
  if (env.glow) {
    const g = env.glow;
    const d = sub(g.pos, p);
    const dist = len(d);
    const facing = Math.max(0, dot(n, mulS(d, 1 / (dist || 1))));
    const I = (g.strength / (1 + (dist / g.falloff) ** 2)) * (0.25 + 0.75 * facing);
    c = addHex(c, g.color, Math.min(1.2, I));
  }
  if (env.fog) {
    // distance fog toward the haze colour (depth cue for deep planes)
    c = mixHex(c, env.fog.color, 0); // applied per item by fogAmt (needs depth)
  }
  return c;
};
export const fogAmt = (env: Env, z: number) =>
  env.fog ? clamp01((z - env.fog.near) / (env.fog.far - env.fog.near)) * env.fog.max : 0;
export const fogged = (env: Env, color: string, z: number) => (env.fog ? mixHex(color, env.fog.color, fogAmt(env, z)) : color);

// ---------------------------------------------------------------- primitives

export const quad = (pr: Proj, env: Env, key: string, pts: V3[], base: string, opts: {stroke?: boolean; flat?: boolean; opacity?: number; zBias?: number; smooth?: boolean} = {}): Item | null => {
  if (pts.length < 3) return null;
  const n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
  const c = mulS(pts.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 1 / pts.length);
  const cl = clipNear(pr, pts);
  if (cl.length < 3) return null;
  const p2 = cl.map((q) => pr.p(q));
  const z = pr.p(c).z;
  const nn = dot(n, pr.toCam(c)) < 0 ? mulS(n, -1) : n;
  const fill = fogged(env, opts.flat ? base : shadeFace(env, base, nn, c), z);
  const d = opts.smooth ? smoothClosed(p2) : polyClosed(p2);
  return {
    z: z - (opts.zBias ?? 0),
    key, geo: planeGeo(n, pts[0]), bb: bbOf(p2),
    el: <path key={key} d={d} fill={fill} fillOpacity={opts.opacity ?? 1} stroke={opts.stroke === false ? 'none' : env.ink} strokeWidth={env.lineW} strokeLinejoin="round" />,
  };
};

/** Axis-aligned box (optionally yawed) as visible faces. size = [w, h, d] (x, y, z extents). */
export const box = (
  pr: Proj, env: Env, key: string,
  o: {c: V3; size: V3; yaw?: number; color: string; top?: string; side?: string; front?: string; stroke?: boolean; zBias?: number; faces?: ('px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz')[]},
): Item[] => {
  const [w, h, d] = o.size;
  const R = rotY(o.yaw ?? 0);
  const P = (x: number, y: number, z: number): V3 => add(o.c, mv(R, [x, y, z]));
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const faces: {id: 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz'; pts: V3[]; n: V3; color: string}[] = [
    {id: 'px', pts: [P(hw, -hh, -hd), P(hw, hh, -hd), P(hw, hh, hd), P(hw, -hh, hd)], n: mv(R, [1, 0, 0]), color: o.side ?? o.color},
    {id: 'nx', pts: [P(-hw, -hh, hd), P(-hw, hh, hd), P(-hw, hh, -hd), P(-hw, -hh, -hd)], n: mv(R, [-1, 0, 0]), color: o.side ?? o.color},
    {id: 'py', pts: [P(-hw, hh, -hd), P(-hw, hh, hd), P(hw, hh, hd), P(hw, hh, -hd)], n: [0, 1, 0], color: o.top ?? o.color},
    {id: 'ny', pts: [P(-hw, -hh, hd), P(-hw, -hh, -hd), P(hw, -hh, -hd), P(hw, -hh, hd)], n: [0, -1, 0], color: o.color},
    {id: 'pz', pts: [P(-hw, -hh, hd), P(hw, -hh, hd), P(hw, hh, hd), P(-hw, hh, hd)], n: mv(R, [0, 0, 1]), color: o.front ?? o.color},
    {id: 'nz', pts: [P(hw, -hh, -hd), P(-hw, -hh, -hd), P(-hw, hh, -hd), P(hw, hh, -hd)], n: mv(R, [0, 0, -1]), color: o.front ?? o.color},
  ];
  const out: Item[] = [];
  for (const f of faces) {
    if (o.faces && !o.faces.includes(f.id)) continue;
    const c = mulS(f.pts.reduce((a, b) => add(a, b), [0, 0, 0] as V3), 0.25);
    if (dot(f.n, pr.toCam(c)) <= 0.001) continue;
    const cl = clipNear(pr, f.pts);
    if (cl.length < 3) continue;
    const z = pr.p(c).z;
    const fill = fogged(env, shadeFace(env, f.color, f.n, c), z);
    const fp = cl.map((q) => pr.p(q));
    out.push({
      z: pr.p(o.c).z - (o.zBias ?? 0) - 0.01 * out.length,
      key: key + f.id, geo: planeGeo(f.n, f.pts[0]), bb: bbOf(fp),
      el: <path key={key + f.id} d={polyClosed(fp)} fill={fill} stroke={o.stroke === false ? 'none' : env.ink} strokeWidth={env.lineW} strokeLinejoin="round" />,
    });
  }
  return out;
};

/** Ring of points (horizontal circle) in world space. */
export const circle3 = (c: V3, r: number, seg = 48, a0 = 0, a1 = Math.PI * 2): V3[] => {
  const out: V3[] = [];
  const n = seg;
  for (let k = 0; k <= n; k++) {
    const a = a0 + ((a1 - a0) * k) / n;
    out.push([c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r]);
  }
  return out;
};

/** Vertical tapered cylinder: side silhouette (hull) with a horizontal light gradient + optional top cap. */
export const cylinder = (
  pr: Proj, env: Env, key: string,
  o: {base: V3; r0: number; r1: number; h: number; color: string; cap?: string | false; seg?: number; zBias?: number; stroke?: boolean; capStroke?: boolean},
): Item[] => {
  const seg = o.seg ?? 40;
  const bot = circle3(o.base, o.r0, seg).slice(0, seg);
  const top = circle3(add(o.base, [0, o.h, 0]), o.r1, seg).slice(0, seg);
  const vis = inFront(pr, [...bot, ...top]);
  if (vis.length < 3) return [];
  const h = hull(vis.map((q) => pr.p(q)));
  const mid = add(o.base, [0, o.h / 2, 0]);
  const m2 = pr.p(mid);
  const z = m2.z - (o.zBias ?? 0);
  // gradient from the dark side to the lit side across the silhouette
  const side = norm(cross([0, 1, 0], pr.fwd));
  const lit = Math.sign(dot(env.light, side)) || 1;
  const pa = pr.p(add(mid, mulS(side, -lit * o.r0))), pb = pr.p(add(mid, mulS(side, lit * o.r0)));
  const nLit = norm(add(mulS(side, lit), mulS(pr.toCam(mid), 0.4)));
  const nDark = norm(add(mulS(side, -lit), mulS(pr.toCam(mid), 0.4)));
  const cLit = fogged(env, shadeFace(env, o.color, nLit, mid), m2.z);
  const cDark = fogged(env, shadeFace(env, o.color, nDark, mid), m2.z);
  const cMid = fogged(env, shadeFace(env, o.color, pr.toCam(mid), mid), m2.z);
  const gid = key + '-cg';
  const items: Item[] = [{
    z, key,
    el: (
      <g key={key}>
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}>
            <stop offset={0} stopColor={cDark} />
            <stop offset={0.45} stopColor={cMid} />
            <stop offset={1} stopColor={cLit} />
          </linearGradient>
        </defs>
        <path d={smoothClosed(h)} fill={`url(#${gid})`} stroke={o.stroke === false ? 'none' : env.ink} strokeWidth={env.lineW} strokeLinejoin="round" />
      </g>
    ),
  }];
  if (o.cap !== false) {
    const topC = add(o.base, [0, o.h, 0]);
    if (dot([0, 1, 0], pr.toCam(topC)) > 0 && inFront(pr, top).length === top.length) {
      const capFill = fogged(env, shadeFace(env, o.cap ?? o.color, [0, 1, 0], topC), m2.z);
      items.push({z: z - 0.5, key: key + 'cap', el: <path key={key + 'cap'} d={smoothClosed(top.map((q) => pr.p(q)))} fill={capFill} stroke={o.capStroke === false ? 'none' : env.ink} strokeWidth={env.lineW} />});
    }
  }
  return items;
};

/** Horizontal cylinder between two points (pipes, beams, trunnions). */
export const tube = (pr: Proj, env: Env, key: string, a: V3, b: V3, r: number, color: string, opts: {seg?: number; zBias?: number; stroke?: boolean; plane?: V3} = {}): Item => {
  const seg = opts.seg ?? 16;
  const ax = norm(sub(b, a));
  let u = cross(ax, [0, 1, 0]);
  if (len(u) < 1e-4) u = cross(ax, [1, 0, 0]);
  u = norm(u);
  const v = cross(ax, u);
  const ring = (c: V3) => {
    const out: V3[] = [];
    for (let k = 0; k < seg; k++) {
      const t = (k / seg) * Math.PI * 2;
      out.push(add(c, add(mulS(u, Math.cos(t) * r), mulS(v, Math.sin(t) * r))));
    }
    return out;
  };
  const vis = inFront(pr, [...ring(a), ...ring(b)]);
  const pts = vis.map((q) => pr.p(q));
  const h = pts.length >= 3 ? hull(pts) : [];
  const mid = mulS(add(a, b), 0.5);
  const m2 = pr.p(mid);
  const fill = fogged(env, shadeFace(env, color, norm(add(env.light, pr.toCam(mid))), mid), m2.z);
  return {z: m2.z - (opts.zBias ?? 0), key, geo: opts.plane ? planeGeo(opts.plane, mid) : undefined, bb: h.length ? bbOf(h) : undefined, el: <path key={key} d={smoothClosed(h)} fill={fill} stroke={opts.stroke === false ? 'none' : env.ink} strokeWidth={env.lineW} strokeLinejoin="round" />};
};

export const line3 = (pr: Proj, key: string, pts: V3[], stroke: string, width: number, opts: {z?: number; smooth?: boolean; opacity?: number; dash?: string; cap?: 'round' | 'butt'; plane?: V3} = {}): Item => {
  const pieces = clipNearLine(pr, pts);
  const all = pieces.flat().map((q) => pr.p(q));
  const z = opts.z ?? (all.length ? all.reduce((a, b) => a + b.z, 0) / all.length : 1e9);
  const d = pieces.map((pc) => (opts.smooth ? smoothOpen(pc.map((q) => pr.p(q))) : polyOpen(pc.map((q) => pr.p(q))))).join(' ');
  return {
    z, key, geo: opts.plane && pts.length ? planeGeo(opts.plane, pts[0]) : undefined, bb: all.length ? bbOf(all) : undefined,
    el: <path key={key} d={d} fill="none" stroke={stroke} strokeWidth={width} strokeOpacity={opts.opacity ?? 1} strokeDasharray={opts.dash} strokeLinecap={opts.cap ?? 'round'} strokeLinejoin="round" />,
  };
};

/**
 * Painter's sort (far → near) followed by exact occlusion constraints for dynamic bodies (robots, cast) against planar
 * items (faces, quads, railings): a body entirely on the camera's side of a face's plane cannot be hidden by it and is
 * drawn after it; a body entirely behind the plane cannot hide it and is drawn before it. Only pairs whose screen
 * boxes overlap are constrained; a body that genuinely straddles a plane keeps its depth position.
 */
export const sortItems = (items: Item[], pr?: Proj) => {
  items.sort((a, b) => b.z - a.z);
  if (!pr) return items;
  const EPS = 2.5; // cm: contact (feet on a floor) counts as "in front of" the floor
  const overlap = (a: BB, b: BB) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const bodies = items.filter((it) => it.geo?.kind === 'body' && it.bb);
  for (const B of bodies) {
    const pts = (B.geo as {kind: 'body'; pts: V3[]}).pts;
    let lo = -1, hi = items.length;
    for (let j = 0; j < items.length; j++) {
      const P = items[j];
      if (P === B || P.geo?.kind !== 'plane' || !P.bb || !overlap(B.bb!, P.bb)) continue;
      const {n, d} = P.geo;
      const camSide = dot(n, pr.pos) - d;
      if (Math.abs(camSide) < 1e-6) continue;
      const sgn = Math.sign(camSide);
      let mn = Infinity, mx = -Infinity;
      for (const q of pts) {
        const v = (dot(n, q) - d) * sgn;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      if (mn > -EPS) lo = Math.max(lo, j);        // body on the camera side: draw after P
      else if (mx < EPS) hi = Math.min(hi, j);    // body behind the plane: draw before P
    }
    const i = items.indexOf(B);
    if (lo >= hi) continue; // conflicting constraints: keep the depth order
    if (i <= lo) {
      items.splice(i, 1);
      items.splice(lo, 0, B); // lo shifted down by one after removal → lands right after P
    } else if (i >= hi) {
      items.splice(i, 1);
      items.splice(hi, 0, B);
    }
  }
  return items;
};

export {hull, smoothClosed, polyClosed};
export type {Pt};
