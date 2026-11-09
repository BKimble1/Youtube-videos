// Liquid metal (gallium-like, mercury-bright) for the robot and every puddle / stream / droplet in the film.
//
// Technique: all liquid silhouettes are drawn in WHITE inside ONE filtered group ("goo"): the filter blurs their alpha
// and thresholds it, so separate shapes merge with smooth necks (seamless union, never floating pieces). From that one
// crisp alpha the same filter derives
//   - a rounded height map (two blurs) lit with feDiffuseLighting from the key light (upper-left) and mapped through a
//     chrome colour ramp (deep edge -> dark reflection band -> silver -> chrome -> bright top) with feComponentTransfer,
//   - crisp white speculars (feSpecularLighting, thresholded), a thin bright rim on the lower-right edges, an
//     optional coloured environment light (Env tint, e.g. the red alarm) from the upper-right,
//   - the navy ink contour (the alpha dilated, flooded with INK) underneath.
// Every highlight therefore follows the merged surface automatically. Filter regions are explicit userSpaceOnUse
// boxes, so the cost stays proportional to the liquid's on-screen size.
import React from 'react';
import {C, INK, INK_PX} from './palette';
import {uid} from '../core/ids';
import {mix, rgba} from '../core/color';
import {Cam3, project} from '../world';
import {clamp, noise1} from '../lib';

export type V = {x: number; y: number};
/** reflection environment: top = what up-facing surfaces reflect, bottom = the dark reflection band; tint = an extra
 *  coloured light from the upper-right (alarm), tintAmt 0..1 */
export type Env = {top: string; bottom: string; tint?: string; tintAmt?: number};
export const ENV_DEFAULT: Env = {top: C.silverLit, bottom: C.navy2};

export type Box = {x0: number; y0: number; x1: number; y1: number};
const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
const f2 = (n: number) => (Math.abs(n) < 1e-5 ? '0' : n.toFixed(2));

/** polygon -> closed smooth path (Catmull-Rom as cubic Béziers) */
export const smoothPath = (ps: V[], k = 1) => {
  const n = ps.length;
  if (n < 3) return '';
  let d = `M${f1(ps[0].x)},${f1(ps[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = ps[(i - 1 + n) % n], p1 = ps[i], p2 = ps[(i + 1) % n], p3 = ps[(i + 2) % n];
    const t = k / 6;
    d += `C${f1(p1.x + (p2.x - p0.x) * t)},${f1(p1.y + (p2.y - p0.y) * t)} ${f1(p2.x - (p3.x - p1.x) * t)},${f1(p2.y - (p3.y - p1.y) * t)} ${f1(p2.x)},${f1(p2.y)}`;
  }
  return d + 'Z';
};
/** polygon -> straight path */
export const polyPath = (ps: V[]) => (ps.length < 2 ? '' : 'M' + ps.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L') + 'Z');

export const boxOf = (sets: V[][], pad = 0): Box => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of sets) for (const p of s) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  if (!isFinite(x0)) return {x0: 0, y0: 0, x1: 1, y1: 1};
  return {x0: x0 - pad, y0: y0 - pad, x1: x1 + pad, y1: y1 + pad};
};
export const unionBox = (a: Box, b: Box): Box => ({x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1)});

// ---------------------------------------------------------------------------------------------------------------
// colour ramp for the lit height map (input = diffuse light 0..1, flat face-on surface ~0.59)
const rgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const v = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
};
// semi-cel: flat tones with short transitions, so the shading reads as the channel's cel finish but follows the
// merged liquid surface exactly
const rampStops = (env: Env): [number, string][] => {
  const band = mix(env.bottom, C.silverDeep, 0.55);
  const e = 0.022;
  const steps: [number, string][] = [
    [0.0, mix(C.silverMid, env.top, 0.5)], // lowest edge: bright floor bounce (thin rim)
    [0.07, band], // the dark reflection band hugging the lower edges
    [0.33, C.silverDark],
    [0.47, C.silverMid], // face-on surface
    [0.64, mix(C.silverMid, C.silver, 0.75)],
    [0.77, C.chrome],
    [0.9, '#FFFFFF'],
  ];
  const out: [number, string][] = [];
  steps.forEach(([o, c], i) => {
    const next = steps[i + 1];
    out.push([i === 0 ? 0 : o + e, c]);
    out.push([next ? next[0] - e : 1, i === 3 ? mix(c, steps[4][1], 0.45) : c]);
  });
  return out;
};
const rampTables = (env: Env, n = 121) => {
  const st = rampStops(env).map(([o, c]) => [o, rgb(c)] as [number, [number, number, number]]);
  const out: [number[], number[], number[]] = [[], [], []];
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    let j = 0;
    while (j < st.length - 2 && x > st[j + 1][0]) j++;
    const [o0, c0] = st[j], [o1, c1] = st[j + 1];
    const u = clamp((x - o0) / (o1 - o0 || 1));
    for (let k = 0; k < 3; k++) out[k].push(c0[k] + (c1[k] - c0[k]) * u);
  }
  return out.map((a) => a.map((v) => v.toFixed(3)).join(' '));
};

export type GooOpts = {
  /** goo merge blur (px): small = crisp union of the exact shapes, large = soft liquid necks */
  goo: number;
  /** rounding blur (px) of the height map: roughly the bevel width of the liquid's edges */
  round: number;
  env?: Env;
  /** ink contour width (px) */
  ink?: number;
  /** grow (+) / shrink (-) of the threshold: 0.5 = exact edges */
  cut?: number;
};

/** The liquid-metal filter: white shapes in -> inked, lit, merged liquid metal out. */
export const MetalFilter: React.FC<{id: string; box: Box; o: GooOpts}> = ({id, box, o}) => {
  const env = o.env ?? ENV_DEFAULT;
  const [tr, tg, tb] = rampTables(env);
  const K = clamp(o.goo * 1.6, 2.2, 40);
  const cut = o.cut ?? 0.5;
  const ink = o.ink ?? INK_PX;
  const R = Math.max(1.5, o.round);
  const sScale = R * 2.2;
  const tintAmt = clamp(env.tintAmt ?? 0);
  const rim = mix(env.top, C.cyanCore, 0.25);
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)} colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={f2(o.goo)} result="b" />
      <feColorMatrix in="b" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${f2(K)} ${f2(0.5 - K * cut)}`} result="sh" />
      <feGaussianBlur in="sh" stdDeviation={f2(R)} result="h1" />
      <feGaussianBlur in="sh" stdDeviation={f2(R * 2.2)} result="h2" />
      <feComposite in="h1" in2="h2" operator="arithmetic" k2="0.68" k3="0.32" result="hg" />
      <feDiffuseLighting in="hg" surfaceScale={f2(sScale)} diffuseConstant="1" lightingColor="#FFFFFF" result="dl">
        <feDistantLight azimuth="250" elevation="34" />
      </feDiffuseLighting>
      <feGaussianBlur in="dl" stdDeviation={f2(clamp(R * 0.22, 0.8, 9))} result="dls" />
      <feComponentTransfer in="dls" result="col">
        <feFuncR type="table" tableValues={tr} />
        <feFuncG type="table" tableValues={tg} />
        <feFuncB type="table" tableValues={tb} />
      </feComponentTransfer>
      {/* thin bright rim on the lower-right (bounce/back light) */}
      <feDiffuseLighting in="hg" surfaceScale={f2(sScale)} diffuseConstant="1" lightingColor="#FFFFFF" result="rl">
        <feDistantLight azimuth="50" elevation="8" />
      </feDiffuseLighting>
      <feGaussianBlur in="rl" stdDeviation={f2(clamp(R * 0.18, 0.8, 7))} result="rlb" />
      <feColorMatrix in="rlb" type="matrix" values={`0 0 0 0 ${f2(rgb(rim)[0])}  0 0 0 0 ${f2(rgb(rim)[1])}  0 0 0 0 ${f2(rgb(rim)[2])}  7 0 0 0 -5.6`} result="rim" />
      <feComposite in="rim" in2="col" operator="over" result="c2" />
      {tintAmt > 0.001 ? (
        <>
          {/* coloured light (alarm) from the upper-right: crisp coloured reflections on the edges facing it + a faint wash */}
          <feDiffuseLighting in="hg" surfaceScale={f2(sScale)} diffuseConstant="1" lightingColor="#FFFFFF" result="tl">
            <feDistantLight azimuth="320" elevation="14" />
          </feDiffuseLighting>
          <feGaussianBlur in="tl" stdDeviation={f2(clamp(R * 0.18, 0.8, 7))} result="tlb" />
          <feColorMatrix in="tlb" type="matrix" values={`0 0 0 0 ${f2(rgb(env.tint ?? C.red)[0])}  0 0 0 0 ${f2(rgb(env.tint ?? C.red)[1])}  0 0 0 0 ${f2(rgb(env.tint ?? C.red)[2])}  ${f2(3.4 * tintAmt)} 0 0 0 ${f2(-2.2 * tintAmt)}`} result="tc" />
          <feComposite in="tc" in2="c2" operator="over" result="c3" />
        </>
      ) : (
        <feComposite in="c2" in2="c2" operator="arithmetic" k2="1" result="c3" />
      )}
      {/* crisp speculars following the surface */}
      <feSpecularLighting in="hg" surfaceScale={f2(sScale)} specularConstant="1" specularExponent="22" lightingColor="#FFFFFF" result="sp">
        <feDistantLight azimuth="225" elevation="50" />
      </feSpecularLighting>
      <feGaussianBlur in="sp" stdDeviation={f2(clamp(R * 0.16, 0.7, 6))} result="sps" />
      <feColorMatrix in="sps" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 7 -4.4" result="spc" />
      <feComposite in="spc" in2="c3" operator="over" result="c4" />
      <feComposite in="c4" in2="sh" operator="in" result="mat" />
      <feMorphology in="sh" operator="dilate" radius={f2(ink)} result="dil" />
      <feFlood floodColor={INK} result="inkc" />
      <feComposite in="inkc" in2="dil" operator="in" result="ink" />
      <feMerge>
        <feMergeNode in="ink" />
        <feMergeNode in="mat" />
      </feMerge>
    </filter>
  );
};

/** Cheap companion filter: the same merged silhouette as plain white (for masks / clipping overlays to the liquid). */
export const ShapeFilter: React.FC<{id: string; box: Box; goo: number; cut?: number}> = ({id, box, goo, cut = 0.5}) => {
  const K = clamp(goo * 1.6, 2.2, 40);
  return (
    <filter id={id} filterUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)} colorInterpolationFilters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation={f2(goo)} result="b" />
      <feColorMatrix in="b" type="matrix" values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${f2(K)} ${f2(0.5 - K * cut)}`} />
    </filter>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// EYES (identical on the robot, droplets and puddles)

type EyeOne = {cx: number; cy: number; ew: number; eh: number; open: number; mood: number; side: number};
/** lid curves of an eye (screen px, y down): visible part is between top(x) and bot(x) */
const lids = (e: EyeOne) => {
  const op = clamp(e.open, 0, 1.6);
  const eh = e.eh * op;
  const ew = e.ew * (1 + 0.1 * Math.max(0, op - 1));
  const a = Math.max(0, -e.mood), p = Math.max(0, e.mood);
  const inward = -e.side; // +1 when +x points to the nose
  const drop = eh * (0.6 * a + 0.16 * p);
  const slant = 0.4 * a - 0.1 * p;
  const top = (x: number) => e.cy - eh + drop + slant * (x - e.cx) * inward;
  const bot = (x: number) => {
    const u = clamp((x - e.cx) / Math.max(1e-3, ew), -1, 1);
    return e.cy + eh - p * eh * 1.2 * (1 - 0.75 * u * u);
  };
  return {top, bot, ew, eh};
};
/** the visible (lidded) eye: ellipse (cx,cy,ew,eh) clipped by the lids of `lid` (default: itself), grown by g px */
const eyePoly = (e: EyeOne, g: number, n = 44, lid?: EyeOne, inset = 0): V[] => {
  const L = lids(lid ?? e);
  const own = lids(e);
  const ew = own.ew + g, eh = own.eh + g;
  const out: V[] = [];
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2;
    const x = e.cx + Math.cos(th) * ew;
    let y = e.cy + Math.sin(th) * eh;
    const t0 = L.top(x) - g + inset, b0 = L.bot(x) + g - inset;
    if (t0 > b0) y = (t0 + b0) / 2;
    else y = Math.min(Math.max(y, t0), b0);
    out.push({x, y});
  }
  return out;
};

export type EyesProps = {
  l: V; // left eye centre (screen px)
  r: V;
  /** px per world unit */
  s: number;
  sx?: number; // extra horizontal / vertical squash of each eye (melting)
  sy?: number;
  open: number;
  lookX: number;
  lookY: number;
  mood: number;
  glow: number;
  opacity?: number;
  /** per-eye width factors (head turn foreshortening) */
  wl?: number;
  wr?: number;
};

/** eye design constants (world units) */
export const EYE = {sep: 0.8, w: 0.47, h: 0.6, socket: 0.11};

export const EyesAt: React.FC<EyesProps> = ({l, r, s, sx = 1, sy = 1, open, lookX, lookY, mood, glow, opacity = 1, wl = 1, wr = 1}) => {
  if (opacity <= 0.003) return null;
  const ang = (Math.atan2(r.y - l.y, r.x - l.x) * 180) / Math.PI;
  const mid = {x: (l.x + r.x) / 2, y: (l.y + r.y) / 2};
  const half = Math.hypot(r.x - l.x, r.y - l.y) / 2;
  const g = clamp(glow);
  const idG = uid('eyg'), idF = uid('eyf');
  const lx = clamp(lookX, -1, 1), ly = clamp(lookY, -1, 1);
  const eyeCol = mix(C.cyanDeep, C.cyan, 0.35 + 0.65 * g);
  const coreCol = mix(C.cyan, C.cyanCore, 0.4 + 0.6 * g);
  const deep = mix('#06202B', C.cyanDeep, 0.25 + 0.5 * g);
  const sockC = '#0E1C2B';
  const eyes = [-1, 1].map((side) => {
    const w = side < 0 ? wl : wr;
    const cx = side * half + lx * 0.13 * s * sx;
    const cy = ly * 0.1 * s * sy;
    const e: EyeOne = {cx, cy, ew: EYE.w * s * sx * w, eh: EYE.h * s * sy, open, mood, side};
    const sock = eyePoly(e, EYE.socket * s * Math.min(sx, sy, 1));
    const lens = eyePoly(e, 0);
    // bright core: a smaller copy, nudged further in the gaze direction
    const ec: EyeOne = {...e, cx: cx + lx * 0.1 * s * sx, cy: cy + ly * 0.09 * s * sy + e.eh * 0.08, ew: e.ew * 0.52, eh: e.eh * 0.58};
    const core = eyePoly(ec, 0, 32, e, e.eh * 0.16);
    const hOpen = Math.max(...lens.map((q) => q.y)) - Math.min(...lens.map((q) => q.y));
    const shut = clamp(1 - hOpen / (e.eh * 0.35));
    return {side, e, sock, lens, core, shut, hOpen};
  });
  return (
    <g opacity={opacity} transform={`translate(${f1(mid.x)},${f1(mid.y)}) rotate(${f2(ang)})`}>
      <defs>
        <radialGradient id={idG}>
          <stop offset="0" stopColor={C.cyan} stopOpacity={0.55 * g} />
          <stop offset="0.4" stopColor={C.cyan} stopOpacity={0.22 * g} />
          <stop offset="1" stopColor={C.cyan} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={idF} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={deep} />
          <stop offset="0.42" stopColor={eyeCol} />
          <stop offset="1" stopColor={mix(eyeCol, coreCol, 0.55)} />
        </linearGradient>
      </defs>
      {g > 0.02 &&
        eyes.map((q) => (
          <ellipse key={'g' + q.side} cx={f1(q.e.cx)} cy={f1(q.e.cy)} rx={f1(q.e.ew * 2.3)} ry={f1(Math.max(q.e.eh, q.e.ew) * 2.0)} fill={`url(#${idG})`} style={{mixBlendMode: 'screen'}} />
        ))}
      {eyes.map((q) => (
        <g key={q.side}>
          <path d={smoothPath(q.sock)} fill={sockC} stroke={INK} strokeWidth={1.2} strokeLinejoin="round" />
          {q.hOpen > 0.6 && <path d={smoothPath(q.lens)} fill={`url(#${idF})`} />}
          {q.hOpen > e2(q) && <path d={smoothPath(q.core)} fill={coreCol} opacity={0.92} />}
          {q.hOpen > q.e.eh * 0.55 && (
            <ellipse cx={f1(q.e.cx - q.e.ew * 0.36)} cy={f1(Math.min(...q.lens.map((z) => z.y)) + q.e.eh * 0.34)} rx={f1(q.e.ew * 0.17)} ry={f1(q.e.eh * 0.12)} fill="#FFFFFF" opacity={0.9} />
          )}
          {q.shut > 0.02 && (
            <path
              d={`M${f1(q.e.cx - q.e.ew * 0.8)},${f1(q.e.cy + q.e.eh * 0.1)} Q${f1(q.e.cx)},${f1(q.e.cy + q.e.eh * (0.1 - 0.35 * (0.6 + 0.4 * Math.max(0, q.e.mood))))} ${f1(q.e.cx + q.e.ew * 0.8)},${f1(q.e.cy + q.e.eh * 0.1)}`}
              fill="none"
              stroke={coreCol}
              strokeWidth={Math.max(1.4, q.e.eh * 0.16)}
              strokeLinecap="round"
              opacity={q.shut}
            />
          )}
        </g>
      ))}
    </g>
  );
};
const e2 = (q: {e: EyeOne}) => q.e.eh * 0.3;

/** The robot's eyes (identical design) on a droplet / puddle: c = midpoint between the eyes. */
export const RobotEyes: React.FC<{c: V; s: number; open: number; lookX: number; lookY: number; mood: number; glow: number; opacity?: number; squash?: number}> = ({c, s, open, lookX, lookY, mood, glow, opacity, squash = 1}) => (
  <EyesAt l={{x: c.x - EYE.sep * s, y: c.y}} r={{x: c.x + EYE.sep * s, y: c.y}} s={s} sy={squash} open={open} lookX={lookX} lookY={lookY} mood={mood} glow={glow} opacity={opacity} />
);

// ---------------------------------------------------------------------------------------------------------------
// OUTLINES

/** organic, slowly wobbling closed outline (screen px) */
export const puddleOutline = (cx: number, cy: number, rx: number, ry: number, t: number, seed: number, n = 48): V[] => {
  const out: V[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w =
      1 +
      0.07 * Math.sin(2 * a + seed * 1.7 + t * 0.9) +
      0.05 * Math.sin(3 * a + seed * 3.1 - t * 1.3) +
      0.035 * Math.sin(5 * a + seed * 0.7 + t * 1.9) +
      0.03 * noise1(a * 1.6 + t * 0.6, seed + 3);
    out.push({x: cx + Math.cos(a) * rx * w, y: cy + Math.sin(a) * ry * w});
  }
  return out;
};

/** the same idea defined ON THE FLOOR (world x/d radii), projected through the jail camera */
export const floorBlob = (c: Cam3, center: {x: number; d: number}, rx: number, rd: number, t: number, seed: number, n = 48): V[] => {
  const ring = puddleOutline(center.x, center.d, rx, rd, t, seed, n);
  return ring.map((q) => {
    const p = project(c, {x: q.x, h: 0, d: q.y});
    return {x: p.x, y: p.y};
  });
};

/** a liquid stream ON THE FLOOR along a polyline (world x/d), half width width(u) (u = 0..1 along the path), with a
 *  gently wobbling edge and rounded ends, projected through the jail camera */
export const floorStream = (c: Cam3, path: {x: number; d: number}[], width: (u: number) => number, t: number): V[] => {
  if (path.length < 2) return [];
  // resample densely by arc length
  const segL: number[] = [];
  let L = 0;
  for (let i = 1; i < path.length; i++) {
    const l = Math.hypot(path[i].x - path[i - 1].x, path[i].d - path[i - 1].d);
    segL.push(l);
    L += l;
  }
  const at = (u: number) => {
    let s = u * L;
    for (let i = 0; i < segL.length; i++) {
      if (s <= segL[i] || i === segL.length - 1) {
        const k = segL[i] ? clamp(s / segL[i]) : 0;
        return {x: path[i].x + (path[i + 1].x - path[i].x) * k, d: path[i].d + (path[i + 1].d - path[i].d) * k};
      }
      s -= segL[i];
    }
    return path[path.length - 1];
  };
  const N = Math.max(24, Math.min(90, Math.round(L * 3)));
  const C0: {x: number; d: number}[] = [];
  for (let i = 0; i <= N; i++) C0.push(at(i / N));
  const left: {x: number; d: number}[] = [], right: {x: number; d: number}[] = [];
  for (let i = 0; i <= N; i++) {
    const a = C0[Math.max(0, i - 1)], b = C0[Math.min(N, i + 1)];
    const tx = b.x - a.x, td = b.d - a.d;
    const tl = Math.hypot(tx, td) || 1;
    const nx = -td / tl, nd = tx / tl;
    const u = i / N;
    const w = Math.max(0.02, width(u)) * (1 + 0.06 * noise1(u * 7 - t * 1.4, 11) );
    const wl = w * (1 + 0.05 * Math.sin(u * 19 + t * 2.1)), wr = w * (1 + 0.05 * Math.sin(u * 17 - t * 1.7 + 2));
    left.push({x: C0[i].x + nx * wl, d: C0[i].d + nd * wl});
    right.push({x: C0[i].x - nx * wr, d: C0[i].d - nd * wr});
  }
  const cap = (i: number, sign: number) => {
    const a = C0[Math.max(0, i - 1)], b = C0[Math.min(N, i + 1)];
    const tx = b.x - a.x, td = b.d - a.d;
    const tl = Math.hypot(tx, td) || 1;
    const ux = (tx / tl) * sign, ud = (td / tl) * sign;
    const nx = -td / tl, nd = tx / tl;
    const w = Math.max(0.02, width(i / N));
    const out: {x: number; d: number}[] = [];
    for (let k = 1; k < 8; k++) {
      const th = (k / 8) * Math.PI;
      const cc = Math.cos(th), sn = Math.sin(th);
      // from left edge around the tip to the right edge
      out.push({x: C0[i].x + nx * w * cc * sign + ux * w * sn, d: C0[i].d + nd * w * cc * sign + ud * w * sn});
    }
    return sign > 0 ? out : out;
  };
  const endCap = cap(N, 1); // left -> right around the end
  const startCap = cap(0, -1).reverse(); // right -> left around the start
  const ring = [...left, ...endCap, ...right.reverse(), ...startCap];
  return ring.map((q) => {
    const p = project(c, {x: q.x, h: 0, d: q.d});
    return {x: p.x, y: p.y};
  });
};

/** convenience width profile for a stream squeezing through a gap: wide pools on both sides, a neck at uGap */
export const squeezeWidth = (uGap: number, wide: number, neck: number, span = 0.12) => (u: number) => {
  const k = Math.exp(-(((u - uGap) / span) ** 2));
  const ends = Math.min(1, u / 0.06, (1 - u) / 0.06);
  return (wide + (neck - wide) * k) * (0.55 + 0.45 * clamp(ends));
};

// ---------------------------------------------------------------------------------------------------------------
// LIQUID METAL (free shapes)

/** interior reflections for flat liquid (pools / puddles / streams): a lighter far side, soft drifting glints and a
 *  darker near side. Draw it inside a mask of the merged liquid. */
export const PoolSheen: React.FC<{sets: V[][]; t: number; env?: Env; k?: number}> = ({sets, t, env = ENV_DEFAULT, k = 1}) => {
  const ok = sets.filter((p) => p.length >= 3);
  if (k <= 0.01 || !ok.length) return null;
  const B = boxOf(ok);
  const W0 = B.x1 - B.x0, H0 = B.y1 - B.y0;
  const id = uid('psh');
  return (
    <g opacity={k}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={f1(B.y0)} x2="0" y2={f1(B.y1)}>
          <stop offset="0" stopColor={env.top} stopOpacity={0} />
          <stop offset="0.14" stopColor={env.top} stopOpacity={0.32} />
          <stop offset="0.38" stopColor={env.top} stopOpacity={0.06} />
          <stop offset="0.6" stopColor={env.bottom} stopOpacity={0.1} />
          <stop offset="0.85" stopColor={env.bottom} stopOpacity={0.24} />
          <stop offset="1" stopColor={env.bottom} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <rect x={f1(B.x0 - 2)} y={f1(B.y0 - 2)} width={f1(W0 + 4)} height={f1(H0 + 4)} fill={`url(#${id})`} />
      {ok.map((ps, i) => {
        const b = boxOf([ps]);
        const w = b.x1 - b.x0, h = b.y1 - b.y0;
        if (w < 10 || h < 5) return null;
        const dx = Math.sin(t * 0.55 + i * 1.3) * w * 0.03;
        const gx = b.x0 + w * 0.38 + dx, gy = b.y0 + h * 0.3;
        return (
          <g key={i}>
            <ellipse cx={f1(gx)} cy={f1(gy)} rx={f1(w * 0.12)} ry={f1(Math.max(1.2, h * 0.028))} fill="#FFFFFF" opacity={0.7} />
            <ellipse cx={f1(gx + w * 0.17)} cy={f1(gy + h * 0.02)} rx={f1(w * 0.03)} ry={f1(Math.max(1, h * 0.022))} fill="#FFFFFF" opacity={0.6} />
          </g>
        );
      })}
    </g>
  );
};

export const LiquidMetal: React.FC<{
  pts: V[][];
  t: number;
  env?: Env;
  ripple?: number;
  heat?: number;
  eyes?: {c: V; s: number; open: number; lookX: number; lookY: number; mood: number; glow: number};
  opacity?: number;
  /** optional size hint: px per world unit (controls goo / bevel size); default from the outline size */
  px?: number;
}> = ({pts, t, env = ENV_DEFAULT, ripple = 0, heat = 0, eyes, opacity = 1, px}) => {
  const sets = pts.filter((p) => p.length >= 3);
  if (!sets.length || opacity <= 0.003) return null;
  const b0 = boxOf(sets);
  const minDim = Math.max(4, Math.min(b0.x1 - b0.x0, b0.y1 - b0.y0));
  const unit = px ?? clamp(minDim / 2.2, 6, 80);
  const goo = clamp(unit * 0.22, 1.5, 22);
  const round = clamp(unit * 0.32, 2, 40);
  const box = {x0: b0.x0 - goo * 3 - 8, y0: b0.y0 - goo * 3 - 8, x1: b0.x1 + goo * 3 + 8, y1: b0.y1 + goo * 3 + 8};
  const idF = uid('lmF'), idS = uid('lmS'), idM = uid('lmM'), idB = uid('lmB'), idH = uid('lmH');
  // ripple: outline breathing
  const rp = clamp(ripple);
  const shapes = sets.map((s, i) => {
    const cx = s.reduce((a, q) => a + q.x, 0) / s.length, cy = s.reduce((a, q) => a + q.y, 0) / s.length;
    const q = rp > 0 ? s.map((p, k) => {
      const w = 1 + rp * 0.025 * Math.sin(k * 0.9 + t * 6.5 + i);
      return {x: cx + (p.x - cx) * w, y: cy + (p.y - cy) * w};
    }) : s;
    return <path key={i} d={smoothPath(q)} fill="#FFFFFF" />;
  });
  const bw = b0.x1 - b0.x0, bh = b0.y1 - b0.y0;
  const ccx = (b0.x0 + b0.x1) / 2, ccy = (b0.y0 + b0.y1) / 2;
  return (
    <g opacity={opacity}>
      <defs>
        <MetalFilter id={idF} box={box} o={{goo, round, env}} />
        <ShapeFilter id={idS} box={box} goo={goo} />
        <mask id={idM} maskUnits="userSpaceOnUse" x={f1(box.x0)} y={f1(box.y0)} width={f1(box.x1 - box.x0)} height={f1(box.y1 - box.y0)}>
          <g filter={`url(#${idS})`}>{shapes}</g>
        </mask>
        <linearGradient id={idB} gradientUnits="userSpaceOnUse" x1="0" y1={f1(b0.y0)} x2="0" y2={f1(b0.y1)}>
          <stop offset="0" stopColor={env.top} stopOpacity={0.25} />
          <stop offset="0.38" stopColor={env.top} stopOpacity={0} />
          <stop offset="0.55" stopColor={env.bottom} stopOpacity={0.32} />
          <stop offset="0.7" stopColor={env.bottom} stopOpacity={0.0} />
        </linearGradient>
        <radialGradient id={idH} gradientUnits="userSpaceOnUse" cx={f1(ccx)} cy={f1(ccy)} r={f1(Math.max(bw, bh) * 0.6)}>
          <stop offset="0" stopColor={C.heat} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.heatDeep} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g filter={`url(#${idF})`}>{shapes}</g>
      <g mask={`url(#${idM})`}>
        <PoolSheen sets={sets} t={t} env={env} />
        {rp > 0.01 &&
          [0, 1, 2].map((k) => {
            const ph = (t * 0.9 + k / 3) % 1;
            return (
              <ellipse key={k} cx={f1(ccx)} cy={f1(ccy)} rx={f1(bw * 0.5 * ph)} ry={f1(bh * 0.5 * ph)} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(1, unit * 0.06)} opacity={rp * 0.45 * Math.sin(Math.PI * ph)} />
            );
          })}
        {heat > 0.01 && <rect x={f1(b0.x0)} y={f1(b0.y0)} width={f1(bw)} height={f1(bh)} fill={`url(#${idH})`} opacity={clamp(heat)} style={{mixBlendMode: 'screen'}} />}
      </g>
      {eyes && <RobotEyes {...eyes} squash={0.8} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// METAL SURFACE: full-frame close-up of the robot's polished chest (bridge from the lab to the science cutaway)

/** tint 0..1 cools the metal toward the science cutaway's field blue (for the hand-off). */
export const MetalSurface: React.FC<{t: number; tint?: number}> = ({t, tint = 0}) => {
  const k = clamp(tint);
  const cool = (c: string) => mix(c, C.field, 0.35 * k);
  const idA = uid('msA'), idB = uid('msB'), idC = uid('msC'), idD = uid('msD'), idE = uid('msE');
  const drift = (t * 34) % 2400;
  const bx = -700 + drift; // a soft bright band sweeping slowly
  const wob = Math.sin(t * 0.7) * 30;
  return (
    <g>
      <defs>
        <linearGradient id={idA} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1080" y2="1920">
          <stop offset="0" stopColor={cool(C.silverLit)} />
          <stop offset="0.28" stopColor={cool(C.chrome)} />
          <stop offset="0.5" stopColor={cool(C.silver)} />
          <stop offset="0.68" stopColor={cool(C.silverMid)} />
          <stop offset="1" stopColor={cool(C.silverDark)} />
        </linearGradient>
        <linearGradient id={idB} gradientUnits="userSpaceOnUse" x1="0" y1={f1(980 + wob)} x2="0" y2={f1(1380 + wob)}>
          <stop offset="0" stopColor={C.navy2} stopOpacity={0} />
          <stop offset="0.35" stopColor={C.navy2} stopOpacity={0.5} />
          <stop offset="0.5" stopColor={C.navy1} stopOpacity={0.62} />
          <stop offset="0.75" stopColor={C.navy2} stopOpacity={0.2} />
          <stop offset="1" stopColor={C.navy2} stopOpacity={0} />
        </linearGradient>
        <linearGradient id={idC} gradientUnits="userSpaceOnUse" x1={f1(bx)} y1="0" x2={f1(bx + 520)} y2="320">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={idD} gradientUnits="userSpaceOnUse" cx="260" cy="420" r="900">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={idE} gradientUnits="userSpaceOnUse" cx="540" cy="960" r="1200">
          <stop offset="0.55" stopColor={C.navy0} stopOpacity={0} />
          <stop offset="1" stopColor={C.navy0} stopOpacity={0.55} />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="1080" height="1920" fill={`url(#${idA})`} />
      <rect x="0" y="0" width="1080" height="1920" fill={`url(#${idD})`} />
      {/* the room's dark horizon reflected across the curved chest */}
      <path d={`M-40,${f1(1060 + wob)} C300,${f1(980 + wob)} 760,${f1(1010 + wob)} 1120,${f1(1120 + wob)} L1120,${f1(1300 + wob)} C760,${f1(1210 + wob)} 300,${f1(1200 + wob)} -40,${f1(1290 + wob)} Z`} fill={`url(#${idB})`} />
      <rect x="0" y="0" width="1080" height="1920" fill={`url(#${idC})`} transform={`rotate(-28 540 960)`} />
      {/* crisp specular streaks */}
      <path d={`M${f1(120 + wob)},300 C380,250 640,268 900,330`} fill="none" stroke="#FFFFFF" strokeWidth={22} strokeLinecap="round" opacity={0.85} />
      <path d={`M${f1(180 + wob)},372 C360,346 520,350 640,366`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
      {/* a panel seam (reads as the robot's chest) */}
      <path d="M-40,1580 C320,1540 760,1540 1120,1590" fill="none" stroke={INK} strokeWidth={6} opacity={0.75} />
      <path d="M-40,1592 C320,1552 760,1552 1120,1602" fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.5} />
      <rect x="0" y="0" width="1080" height="1920" fill={`url(#${idE})`} />
      <rect x="0" y="0" width="1080" height="1920" fill={rgba(C.field, 0.12 * k)} />
    </g>
  );
};
