// V4 package W: the open water, the riverbed and the reeds, in 3D (v4/three.ts world: the predator's own units, y DOWN,
// the bed is the plane y = BED_Y = 12.95, z toward the near side, the current flows +x).
//
// Every exterior shot draws its environment through the SAME camera Basis as the predator and the eel, so every angle
// reads as one place: the same light (from the upper left of the screen), the same water colour by view direction
// (brighter toward the surface, deeper and bluer toward the distance), the same riverbed, the same reed beds, the same
// distant stones and plants. Everything is world-anchored, so a moving camera gets true parallax, and nothing pops:
// discrete detail fades by screen size and by distance, motes wrap on a world-anchored tile around the eye and fade
// before the tile edge, LOD never changes a shape.
//
// All components return SVG elements in SCREEN px: put them straight into the frame's root
// <svg width=1080 height=1920> (untransformed). No filters at all: softness is layered translucent shapes.
//
// Frame recipe (back to front):
//   <WorldBack B t zSplit />        water by view direction + the upper-left glow, light shafts, distant silhouettes,
//                                   the bed (sand by distance, caustic dapples, gravel), the reeds and boulders BEHIND
//                                   zSplit, back motes, a mild vignette
//   <PredShadow B pose />           the predator's soft contact shadow on the bed
//   <Predator .../> <Eel3D .../>    (package P and the eel)
//   <WorldFront B t zSplit />       the reeds and boulders IN FRONT of zSplit (soft and dark near the lens), front motes
//                                   (bokeh near the lens)
//   <ReedWipe t t0 t1 />            (the loop only) a reed blade sweeping right → left right at the lens; show frame 0
//                                   inside reedWipePoly(t, t0, t1) underneath it
//
// zSplit: the camera depth (units along the view axis, three.ts depth()) of the subject. Reeds, boulders and motes
// whose depth is ≥ zSplit draw in WorldBack, the rest in WorldFront (a blade by its base). It is also the focus
// distance of the depth of field: things much nearer the lens than zSplit go soft and dark. Default: the depth of the
// predator's centre (0, 0, 0). In a shot where front reeds would cover the subject, pass filter={clearSight(B, [...
// points to keep in view], r)}: clumps near those sight lines fade out smoothly (never pop as the camera moves).
//
// Exports: WorldBack, WorldFront, Reeds, PredShadow, ReedWipe, reedWipePoly, reedWipeCore (checks), REEDS (the clump
// placements), ROCKS, clearSight, ReedFilter, BED_Y, SURF_Y, waterColor, fogAt, hazeOf (e.g. the receding predator's
// `dim`), the reed colours.
import React from 'react';
import {add3, Basis, depth, dot3, len3, mul3, norm3, P2, smoothClosed, sub3, V3, proj, cross3, hull, V2} from '../three';
import {C, INK, INK_PX, NS} from '../../art/palette';
import {lit, mix, shade} from '../../core/color';
import {uid} from '../../core/ids';
import {clamp, hash, lerp, noise1, ss} from '../../lib';
import type {P} from '../../core/geo';

// ================================================================ world constants
/** the riverbed plane (world y; the predator's belly rests on it) */
export const BED_Y = 12.95;
/** the water surface (world y), far above every shot */
export const SURF_Y = -300;
const W = 1080, H = 1920;
const TAU = Math.PI * 2;
/** nearest camera depth anything is drawn at */
const NEAR = 1.5;

// ================================================================ colours (derived from the V3 palette)
/** the water seen looking straight up, high, at the surface level, near the horizon; the horizon itself (deeper and
 *  bluer: the distance); looking down into the water */
const WATER_ZENITH = lit(C.waterTop, 0.42);
const WATER_HIGH = lit(C.waterTop, 0.17);
const WATER_TOP = C.waterTop;
const WATER_LOW = mix(C.waterTop, C.haze, 0.6);
export const HORIZON = mix(C.haze, C.waterDeep, 0.3);
const WATER_DOWN = mix(C.haze, C.waterDeep, 0.5);
/** the bed: lit sand around the subject, a shaded cooler sand toward the lens, plain sand beyond */
const SAND = mix(C.sand, C.haze, 0.12);
const SAND_LIT = lit(mix(C.sand, C.haze, 0.06), 0.15);
const SAND_NEAR = mix(mix(C.sand, C.pebbleC, 0.45), C.haze, 0.14);
const BED_SHADOW = mix(C.bedShadow, C.waterDeep, 0.25);
const CAUSTIC = lit(mix(C.mote, C.pebbleB, 0.12), 0.25);
/** the reeds (eelgrass): olive green in three cel tones, plus the near-lens silhouette tone */
export const REED_LIT = lit(mix(C.fin, C.waterTop, 0.46), 0.12);
export const REED_MID = mix(C.fin, C.waterMid, 0.56);
export const REED_DARK = mix(mix(C.finDark, C.waterDeep, 0.6), C.fishDark, 0.15);
const REED_YEL = mix(C.fin, C.waterMid, 0.36);
const REED_TEAL = mix(C.waterMid, C.finDark, 0.3);
export const REED_NEAR = shade(mix(REED_DARK, C.waterDeep, 0.3), 0.32);
const ROCK_BASE = mix(mix(C.pebbleA, C.pebbleC, 0.4), C.haze, 0.08);

// ================================================================ the water by view direction, and the haze
const WATER_KEYS: [number, string][] = [
  [-90, WATER_DOWN],
  [-8, mix(HORIZON, WATER_DOWN, 0.5)],
  [0, HORIZON],
  [5, WATER_LOW],
  [16, WATER_TOP],
  [38, WATER_HIGH],
  [90, WATER_ZENITH],
];
/** the water colour seen along a world direction (by its elevation; y is down) */
export const waterColor = (dir: V3) => {
  const l = len3(dir) || 1;
  const el = (Math.asin(clamp(-dir[1] / l, -1, 1)) * 180) / Math.PI;
  for (let i = 1; i < WATER_KEYS.length; i++) {
    if (el <= WATER_KEYS[i][0]) {
      const [a, ca] = WATER_KEYS[i - 1], [b, cb] = WATER_KEYS[i];
      return mix(ca, cb, (el - a) / (b - a));
    }
  }
  return WATER_ZENITH;
};
const FOG0 = 55, FOG_L = 270;
/** how far a point at distance d (world units from the eye) has dissolved into the water (0..1) */
export const fogAt = (d: number) => (d <= FOG0 ? 0 : 1 - Math.exp(-(d - FOG0) / FOG_L));
/** the haze amount of a world point seen from this camera (e.g. the receding predator's `dim`) */
export const hazeOf = (B: Basis, p: V3) => fogAt(len3(sub3(p, B.eye)));
/** a colour at world point p, seen through the water */
const hazed = (B: Basis, col: string, p: V3, k = 1) => {
  const d = sub3(p, B.eye);
  return mix(col, waterColor(d), k * fogAt(len3(d)));
};
/** the bed's own colour at distance D from the eye (before haze) */
const bedColor = (D: number) => (D < 45 ? mix(SAND_NEAR, SAND_LIT, ss(D, 6, 42)) : mix(SAND_LIT, SAND, ss(D, 70, 190)));

// ================================================================ camera helpers
/** world direction of the ray through UNROLLED screen offsets (x, y) from the principal point */
const rayDir = (B: Basis, x: number, y: number): V3 => norm3(add3(add3(mul3(B.fw, B.f), mul3(B.r, x)), mul3(B.u, -y)));
const rollG = (B: Basis) => (B.roll ? `rotate(${B.roll.toFixed(3)} ${B.cx} ${B.cy})` : undefined);
/** the key light (upper left of the screen, a little toward the viewer), as a world direction */
const lightDir = (B: Basis): V3 => norm3(add3(add3(mul3(B.r, -0.55), mul3(B.u, 0.66)), mul3(B.fw, -0.5)));
const onScreen = (x: number, y: number, m: number) => x > -m && x < W + m && y > -m && y < H + m;
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
const pp = (p: V2) => `${f1(p.x)} ${f1(p.y)}`;
/** smooth closed path (Catmull-Rom as cubic Béziers) at 0.1 px precision */
const closedPx = (ps: P[]) => {
  const n = ps.length;
  let d = `M${pp(ps[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = ps[(i - 1 + n) % n], p1 = ps[i], p2 = ps[(i + 1) % n], p3 = ps[(i + 2) % n];
    d += `C${f1(p1.x + (p2.x - p0.x) / 6)} ${f1(p1.y + (p2.y - p0.y) / 6)} ${f1(p2.x - (p3.x - p1.x) / 6)} ${f1(p2.y - (p3.y - p1.y) / 6)} ${pp(p2)}`;
  }
  return d + 'Z';
};
/** the bed region in view (x/z bounding box), out to the distance dMax */
const bedView = (B: Basis, dMax: number) => {
  let x0 = B.eye[0], x1 = B.eye[0], z0 = B.eye[2], z1 = B.eye[2];
  const hgt = BED_Y - B.eye[1];
  const m = 1.25;
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= 8; j++) {
      const x = (i / 6 - 0.5) * W * m, y = (j / 8 - 0.5) * H * m;
      const d = rayDir(B, x, y);
      let q: [number, number];
      if (d[1] > 1e-4 && hgt / d[1] < dMax) q = [B.eye[0] + (d[0] * hgt) / d[1], B.eye[2] + (d[2] * hgt) / d[1]];
      else {
        const l = Math.hypot(d[0], d[2]) || 1;
        q = [B.eye[0] + (d[0] / l) * dMax, B.eye[2] + (d[2] / l) * dMax];
      }
      x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); z0 = Math.min(z0, q[1]); z1 = Math.max(z1, q[1]);
    }
  }
  return {x0, x1, z0, z1};
};
const subjectDepth = (B: Basis) => depth(B, [0, 0, 0]);

// ================================================================ WATER: the gradient by view direction + glow
const WaterBg: React.FC<{B: Basis}> = ({B}) => {
  const id = uid('wb');
  const R = 1180;
  const eyeH = BED_Y - B.eye[1];
  // the horizon row (unrolled, centre column): the ray with no vertical component
  const uy = B.u[1];
  const yh = Math.abs(uy) > 1e-6 ? (B.f * B.fw[1]) / uy : 1e9;
  // the drawn area: the frame (in unrolled coordinates: the frame's box rotated back, when rolled)
  let fx0 = 0, fy0 = 0, fx1 = W, fy1 = H;
  if (B.roll) {
    const c = Math.cos((-B.roll * Math.PI) / 180), sn = Math.sin((-B.roll * Math.PI) / 180);
    const xs: number[] = [], ys2: number[] = [];
    for (const [x, y] of [[0, 0], [W, 0], [W, H], [0, H]]) {
      const dx = x - B.cx, dy = y - B.cy;
      xs.push(B.cx + dx * c - dy * sn);
      ys2.push(B.cy + dx * sn + dy * c);
    }
    fx0 = Math.min(...xs) - 2; fx1 = Math.max(...xs) + 2; fy0 = Math.min(...ys2) - 2; fy1 = Math.max(...ys2) + 2;
  }
  const fyMin = fy0, fyMax = fy1;
  const ys: number[] = [];
  // rows: an even spread over the frame plus a geometric cluster around the horizon (where the bed's depth changes
  // fastest); rows closer than 12 px to a neighbour are merged away
  const yT = (fyMin - B.cy), yB = (fyMax - B.cy);
  for (let i = 0; i <= 20; i++) ys.push(yT + ((yB - yT) * i) / 20);
  for (const o of [2, 6, 14, 28, 50, 85, 140, 220]) ys.push(yh + o, yh - o);
  const rows0 = ys.filter((y) => y >= yT - 1 && y <= yB + 1).sort((a, b) => a - b);
  const rows: number[] = [];
  for (const y of rows0) if (!rows.length || y - rows[rows.length - 1] > 12 || Math.abs(y - yh) < 8) rows.push(y);
  rows[0] = yT;
  rows[rows.length - 1] = yB;
  const stops = rows.map((y) => {
    const d = rayDir(B, 0, y);
    let col = waterColor(d);
    if (d[1] > 1e-5) {
      const D = eyeH / d[1];
      col = mix(bedColor(D), col, fogAt(D));
    }
    return {y: B.cy + y, col};
  });
  // the glow of the light from the upper left: a broad soft bloom where the sky light comes from (camera-relative
  // heading, fixed elevation), sliding off the top of the frame as the camera looks down
  const camEl = (Math.asin(clamp(-B.fw[1], -1, 1)) * 180) / Math.PI;
  const gEl = 58, gAz = -34;
  const dEl = gEl - camEl;
  const gy = dEl < 85 ? -B.f * Math.tan((dEl * Math.PI) / 180) : -1e5;
  const gx = B.f * Math.tan((gAz * Math.PI) / 180) * (1 + 0.4 * Math.max(0, -camEl) / 30);
  const gr = 1500;
  const glow = gy > -R - gr * 0.9 && B.cy + gy - gr < fy1 && B.cy + gy + gr > fy0;
  const gx0 = Math.max(fx0, B.cx + gx - gr), gx1 = Math.min(fx1, B.cx + gx + gr), gy0 = Math.max(fy0, B.cy + gy - gr), gy1 = Math.min(fy1, B.cy + gy + gr);
  // the gradient is drawn as bands between consecutive rows, each a TWO-stop gradient (several times cheaper to
  // rasterise than one many-stop gradient); bands overlap by 1 px and agree at their joins, so no seam shows
  const bands: {y0: number; y1: number; c0: string; c1: string}[] = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const y0 = Math.round(stops[i].y), y1 = Math.round(stops[i + 1].y);
    if (y1 <= y0) continue;
    bands.push({y0, y1, c0: stops[i].col, c1: stops[i + 1].col});
  }
  return (
    <g transform={rollG(B)}>
      <defs>
        {bands.map((b, i) => (
          <linearGradient key={i} id={`${id}g${i}`} gradientUnits="userSpaceOnUse" x1={0} y1={b.y0} x2={0} y2={b.y1}>
            <stop offset="0" stopColor={b.c0} />
            <stop offset="1" stopColor={b.c1} />
          </linearGradient>
        ))}
        {glow && (
          <radialGradient id={`${id}l`} gradientUnits="userSpaceOnUse" cx={B.cx + gx} cy={B.cy + gy} r={gr}>
            <stop offset="0" stopColor={lit(C.waterTop, 0.55)} stopOpacity={0.5} />
            <stop offset="1" stopColor={lit(C.waterTop, 0.3)} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      {bands.map((b, i) => (
        <rect key={i} x={Math.floor(fx0)} y={b.y0} width={Math.ceil(fx1 - fx0)} height={b.y1 - b.y0 + (i < bands.length - 1 ? 1 : 0)} fill={`url(#${id}g${i})`} />
      ))}
      {glow && <rect x={gx0} y={gy0} width={gx1 - gx0} height={gy1 - gy0} fill={`url(#${id}l)`} />}
    </g>
  );
};

// ================================================================ LIGHT SHAFTS (world-anchored, billboarded)
type Shaft = {x: number; z: number; w: number; a: number; ph: number};
const SHAFTS: Shaft[] = (() => {
  const out: Shaft[] = [];
  const g = 85;
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      const h = (k: number) => hash(i * 13.17 + j * 7.31 + k * 3.03 + 0.5);
      if (h(1) < 0.5) continue;
      out.push({x: (i + h(2)) * g, z: (j + h(3)) * g, w: 7 + 26 * h(4) * h(4), a: 0.1 + 0.12 * h(5), ph: TAU * h(6)});
    }
  }
  return out;
})();
const SHAFT_TILT = 0.32;
const Shafts: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const id = uid('sh');
  const camEl = (Math.asin(clamp(B.fw[1], -1, 1)) * 180) / Math.PI; // + = looking down
  const kEl = 1 - 0.75 * ss(camEl, 18, 55);
  if (kEl < 0.02) return null;
  const Lh = BED_Y - SURF_Y;
  const slant = mul3(B.r, -Math.tan(SHAFT_TILT) * Lh);
  const items: {d: string[]; a: number; ga: V2; gb: V2; sa: number; sb: number; D: number}[] = [];
  for (const s of SHAFTS) {
    const D = Math.hypot(s.x - B.eye[0], s.z - B.eye[2]);
    if (D < 22 || D > 520) continue;
    const bot: V3 = [s.x + 6 * noise1(0.09 * t + s.ph, 3), BED_Y, s.z];
    const top: V3 = add3([bot[0], SURF_Y, bot[2]], slant);
    const at = (u: number): V3 => [lerp(top[0], bot[0], u), lerp(top[1], bot[1], u), lerp(top[2], bot[2], u)];
    // the visible parameter range (in front of the lens)
    const da = depth(B, top), db = depth(B, bot);
    if (da < NEAR + 2 && db < NEAR + 2) continue;
    let ua = 0, ub = 1;
    if (da < NEAR + 2) ua = (NEAR + 2 - da) / (db - da);
    if (db < NEAR + 2) ub = (NEAR + 2 - da) / (db - da);
    const pa = proj(B, at(ua)), pb = proj(B, at(ub));
    // quick cull: the axis segment's x range vs the frame (with the shaft's width)
    const wpx = Math.max(pa.s, pb.s) * s.w * 1.4;
    if (Math.max(pa.x, pb.x) < -wpx || Math.min(pa.x, pb.x) > W + wpx) continue;
    if (Math.max(pa.y, pb.y) < -50 || Math.min(pa.y, pb.y) > H + 50) continue;
    const a = s.a * kEl * (0.72 + 0.28 * noise1(0.3 * t + s.ph, 4)) * ss(D, 22, 70) * (1 - 0.7 * fogAt(D));
    if (a < 0.015) continue;
    const quad = (wTop: number, wBot: number) => {
      const ra = mul3(B.r, lerp(wTop, wBot, ua) / 2), rb = mul3(B.r, lerp(wTop, wBot, ub) / 2);
      const A = at(ua), Bq = at(ub);
      const q = [sub3(A, ra), add3(A, ra), add3(Bq, rb), sub3(Bq, rb)];
      return `M${q.map((v) => pp(proj(B, v))).join('L')}Z`;
    };
    items.push({d: [quad(s.w * 1.9, s.w * 3.2), quad(s.w, s.w * 1.7)], a, ga: pa, gb: pb, sa: ua, sb: ub, D});
  }
  items.sort((p, q) => q.D - p.D);
  const prof = (u: number) => (u < 0.08 ? u / 0.08 : 1) * (1 - ss(u, 0.35, 1.0));
  return (
    <g>
      <defs>
        {items.map((it, i) => (
          <linearGradient key={i} id={`${id}${i}`} gradientUnits="userSpaceOnUse" x1={f1(it.ga.x)} y1={f1(it.ga.y)} x2={f1(it.gb.x)} y2={f1(it.gb.y)}>
            {[0, 0.4, 1].map((k) => (
              <stop key={k} offset={k} stopColor={C.mote} stopOpacity={(it.a * prof(lerp(it.sa, it.sb, k))).toFixed(4)} />
            ))}
          </linearGradient>
        ))}
      </defs>
      {items.map((it, i) => (
        <g key={i} fill={`url(#${id}${i})`}>
          <path d={it.d[0]} fillOpacity={0.45} />
          <path d={it.d[1]} />
        </g>
      ))}
    </g>
  );
};

// ================================================================ DISTANT SILHOUETTES (stones and plants, all round)
type FarClump = {x: number; z: number; h: number; n: number; seed: number};
type FarRock = {x: number; z: number; rx: number; ry: number; seed: number};
const FAR_CLUMPS: FarClump[] = Array.from({length: 70}, (_, i) => {
  const a = (i / 70) * TAU + 0.07 * hash(i * 3.1);
  const R = 300 + 430 * hash(i * 5.7 + 1);
  return {x: Math.cos(a) * R, z: Math.sin(a) * R, h: 110 + 230 * hash(i * 2.3 + 4), n: 4 + Math.floor(5 * hash(i * 9.1)), seed: i * 7.7};
});
const FAR_ROCKS: FarRock[] = Array.from({length: 46}, (_, i) => {
  const a = (i / 46) * TAU + 0.11 * hash(i * 4.3 + 2);
  const R = 270 + 460 * hash(i * 6.1 + 3);
  return {x: Math.cos(a) * R, z: Math.sin(a) * R, rx: 14 + 40 * hash(i * 1.9 + 5), ry: 6 + 18 * hash(i * 8.3 + 6), seed: i * 3.3};
});
const FarProps: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const out: {D: number; el: React.ReactNode}[] = [];
  for (let i = 0; i < FAR_ROCKS.length; i++) {
    const r = FAR_ROCKS[i];
    const c: V3 = [r.x, BED_Y, r.z];
    const dz = depth(B, c);
    if (dz < 30) continue;
    const pc = proj(B, c);
    const wpx = r.rx * pc.s;
    if (pc.x < -wpx || pc.x > W + wpx || pc.y < -r.ry * pc.s || pc.y > H + 40) continue;
    const ring: P[] = [];
    for (let k = 0; k <= 10; k++) {
      const a = Math.PI + (k / 10) * Math.PI;
      const j = 1 + 0.16 * (hash(r.seed + k * 2.7) - 0.5);
      ring.push(proj(B, [r.x + Math.cos(a) * r.rx * j, BED_Y + Math.sin(a) * r.ry * j, r.z]));
    }
    ring.push(proj(B, [r.x + r.rx * 0.9, BED_Y + 1, r.z]), proj(B, [r.x - r.rx * 0.9, BED_Y + 1, r.z]));
    const D = len3(sub3(c, B.eye));
    const top = hazed(B, lit(ROCK_BASE, 0.08), [r.x, BED_Y - r.ry, r.z], 0.97);
    out.push({D, el: <path key={`r${i}`} d={smoothClosed(ring)} fill={top} />});
  }
  for (let i = 0; i < FAR_CLUMPS.length; i++) {
    const q = FAR_CLUMPS[i];
    const base: V3 = [q.x, BED_Y, q.z];
    const dz = depth(B, base);
    if (dz < 30) continue;
    const pb = proj(B, base);
    const hpx = q.h * pb.s;
    if (pb.x < -hpx * 0.6 || pb.x > W + hpx * 0.6 || pb.y < -10 || pb.y - hpx > H) continue;
    const D = len3(sub3(base, B.eye));
    let d = '';
    const wpx = Math.max(1, 3.2 * pb.s);
    for (let b = 0; b < q.n; b++) {
      const h = (k: number) => hash(q.seed + b * 4.13 + k * 1.71);
      const L = q.h * (0.55 + 0.45 * h(1));
      const x0 = q.x + (h(2) - 0.5) * 16, z0 = q.z + (h(3) - 0.5) * 16;
      const lean = 0.05 + 0.1 * h(4), bend = 0.3 + 0.4 * h(5), hd = (h(6) - 0.5) * 1.2;
      const pts: P[] = [];
      let p: V3 = [x0, BED_Y, z0];
      pts.push(proj(B, p));
      for (let k = 1; k <= 5; k++) {
        const u = (k - 0.5) / 5;
        const a = lean + bend * u * u + 0.08 * u * Math.sin(TAU * 0.2 * t + TAU * h(7) - 2 * u);
        p = add3(p, mul3([Math.sin(a) * Math.cos(hd), -Math.cos(a), Math.sin(a) * Math.sin(hd)], L / 5));
        pts.push(proj(B, p));
      }
      d += `M${pts.map(pp).join('L')}`;
    }
    const col = hazed(B, REED_MID, add3(base, [0, -q.h * 0.4, 0]), 0.97);
    out.push({D, el: <path key={`c${i}`} d={d} fill="none" stroke={col} strokeWidth={f1(wpx)} strokeLinecap="round" strokeLinejoin="round" />});
  }
  out.sort((a, b) => b.D - a.D);
  return <g>{out.map((o) => o.el)}</g>;
};

// ================================================================ THE BED: gravel (world-fixed, multi-scale), caustics
type GravelSet = {cell: number; ext: number; keep: number; r: [number, number]; seed: number; dMax: number; dDown: number};
/** three world-fixed scales of gravel; each is drawn out to dMax (+ dDown more when the camera looks straight down,
 *  where the bed is not foreshortened), fading out before it */
const GRAVEL: GravelSet[] = [
  {cell: 4.6, ext: 240, keep: 0.55, r: [0.22, 0.85], seed: 1.3, dMax: 75, dDown: 45},
  {cell: 11, ext: 420, keep: 0.6, r: [0.6, 2.1], seed: 7.9, dMax: 190, dDown: 40},
  {cell: 27, ext: 760, keep: 0.55, r: [1.6, 4.6], seed: 13.7, dMax: 520, dDown: 0},
];
const STONE_TONES = [mix(C.pebbleA, SAND, 0.18), mix(C.pebbleB, SAND, 0.15), mix(C.pebbleC, SAND, 0.12)];
/** an ellipse as path data: small ones as an octagon (cheaper to fill, identical at that size), big ones as arcs */
const ell = (x: number, y: number, rx: number, ry: number) => {
  if (rx < 4.5) {
    const a = rx * 0.7071, b = ry * 0.7071;
    return `M${f1(x - rx)} ${f1(y)}L${f1(x - a)} ${f1(y - b)}L${f1(x)} ${f1(y - ry)}L${f1(x + a)} ${f1(y - b)}L${f1(x + rx)} ${f1(y)}L${f1(x + a)} ${f1(y + b)}L${f1(x)} ${f1(y + ry)}L${f1(x - a)} ${f1(y + b)}Z`;
  }
  return `M${f1(x - rx)} ${f1(y)}a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(2 * rx)} 0a${f1(rx)} ${f1(ry)} 0 1 0 ${f1(-2 * rx)} 0Z`;
};
/** the gravel in view, batched into a few paths by tone, haze step and size class (so hundreds of stones cost a
 *  handful of elements). Stones fade in by screen size and out by distance (no pops), and dissolve into the water. */
const Gravel: React.FC<{B: Basis}> = ({B}) => {
  const hgt = BED_Y - B.eye[1];
  const lookDown = clamp(B.fw[1], 0, 1);
  const NF = 8;
  const NT = STONE_TONES.length;
  // buckets: [fog][tone] for bodies (small: no ink; big: ink), caps, and shadows per fog step; each also keeps the
  // lowest alpha it has to show (stones fading in/out are binned by alpha too, 3 steps)
  type Bk = {d: string};
  const mk = () => Array.from({length: NF * NT * 3}, (): Bk => ({d: ''}));
  const bodyS = mk(), bodyB = mk(), cap = mk();
  const shadow = Array.from({length: NF * 3}, (): Bk => ({d: ''}));
  for (const g of GRAVEL) {
    const dMax = g.dMax + g.dDown * lookDown;
    const v = bedView(B, dMax);
    const i0 = Math.floor(Math.max(v.x0, -g.ext) / g.cell), i1 = Math.ceil(Math.min(v.x1, g.ext) / g.cell);
    const j0 = Math.floor(Math.max(v.z0, -g.ext) / g.cell), j1 = Math.ceil(Math.min(v.z1, g.ext) / g.cell);
    for (let i = i0; i <= i1; i++) {
      for (let j = j0; j <= j1; j++) {
        const h = (k: number) => hash(i * 17.17 + j * 31.31 + k * 5.55 + g.seed);
        if (h(0.9) > g.keep) continue;
        const x = (i + h(0.1)) * g.cell, z = (j + h(0.2)) * g.cell;
        if (Math.abs(x) > g.ext || Math.abs(z) > g.ext) continue;
        const r = lerp(g.r[0], g.r[1], Math.pow(h(0.3), 2));
        const c: V3 = [x, BED_Y - r * 0.22, z];
        const D = Math.hypot(x - B.eye[0], c[1] - B.eye[1], z - B.eye[2]);
        if (D > dMax) continue;
        const dz = depth(B, c);
        if (dz < NEAR + 1) continue;
        const pc = proj(B, c);
        const rx = r * pc.s;
        if (rx < 1.1 || !onScreen(pc.x, pc.y, rx * 1.5 + 4)) continue;
        const a = ss(rx, 1.1, 2.4) * (1 - ss(D, dMax * 0.72, dMax));
        if (a < 0.04) continue;
        const sinA = clamp(hgt / D, 0.02, 1);
        const ry = pc.s * Math.hypot(r * sinA, 0.5 * r * Math.sqrt(1 - sinA * sinA));
        const fg = fogAt(D);
        const fb = Math.min(NF - 1, Math.floor(fg * NF * 0.999));
        const ab = a > 0.8 ? 2 : a > 0.45 ? 1 : 0;
        const tone = h(0.4) < 0.4 ? 0 : h(0.4) < 0.75 ? 1 : 2;
        const key = (fb * NT + tone) * 3 + ab;
        (rx > 7 ? bodyB : bodyS)[key].d += ell(pc.x, pc.y, rx, ry);
        if (rx > 3.2) {
          shadow[fb * 3 + ab].d += ell(pc.x + rx * 0.3, pc.y + ry * 0.5, rx * 1.1, ry * 0.55);
          cap[key].d += ell(pc.x - rx * 0.1, pc.y - ry * 0.24, rx * 0.86, ry * 0.72);
        }
      }
    }
  }
  const out: React.ReactNode[] = [];
  const AB = [0.3, 0.62, 1];
  for (let f = NF - 1; f >= 0; f--) {
    const fg = (f + 0.5) / NF;
    const wc = HORIZON;
    for (let ab = 0; ab < 3; ab++) {
      const sd = shadow[f * 3 + ab].d;
      if (sd) out.push(<path key={`s${f}${ab}`} d={sd} fill={BED_SHADOW} fillOpacity={(0.3 * (1 - fg) * AB[ab]).toFixed(3)} />);
    }
    for (let k = 0; k < NT; k++) {
      const tc = STONE_TONES[k];
      for (let ab = 0; ab < 3; ab++) {
        const key = (f * NT + k) * 3 + ab;
        const o = AB[ab] < 1 ? AB[ab].toFixed(2) : undefined;
        const body = mix(shade(tc, 0.2), wc, fg * 0.92);
        if (bodyS[key].d) out.push(<path key={`b${key}`} d={bodyS[key].d} fill={body} fillOpacity={o} />);
        if (bodyB[key].d)
          out.push(<path key={`B${key}`} d={bodyB[key].d} fill={body} fillOpacity={o} stroke={INK} strokeOpacity={(0.5 * (1 - fg) * AB[ab]).toFixed(3)} strokeWidth={INK_PX * 0.5} vectorEffect={NS} />);
        if (cap[key].d) out.push(<path key={`c${key}`} d={cap[key].d} fill={mix(lit(mix(tc, SAND, 0.2), 0.1), wc, fg * 0.92)} fillOpacity={o} />);
      }
    }
  }
  return <g>{out}</g>;
};

/** caustics: the dapples of focused sunlight on the bed around the eye: world-anchored soft rounded patches on a
 *  jittered grid, each breathing and drifting slowly; brighter when the camera looks down, fading with distance,
 *  batched into a few paths by distance band */
const Caustics: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const lookDown = clamp(B.fw[1], -1, 1);
  const k = 0.55 + 0.45 * ss(lookDown, 0.1, 0.7);
  const g = 6.2;
  const dMax = 105;
  const v = bedView(B, dMax);
  const i0 = Math.floor(v.x0 / g), i1 = Math.ceil(v.x1 / g), j0 = Math.floor(v.z0 / g), j1 = Math.ceil(v.z1 / g);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > 6000) return null;
  // each blob's own opacity (distance, haze, its breathing), quantised into NQ fine levels: one path per level
  const NQ = 12, AMAX = 0.2;
  const paths = Array.from({length: NQ}, () => '');
  const Y = BED_Y - 0.02;
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const h = (q: number) => hash(i * 12.9898 + j * 78.233 + q * 4.37);
      if (h(1) < 0.12) continue;
      const life = 0.5 + 0.5 * noise1(0.3 * t + 20 * h(3), 7);
      const cx = (i + 0.5) * g + 0.22 * g * noise1(0.11 * t + 9 * h(5), 3) + 0.4 * t;
      const cz = (j + 0.5) * g + 0.22 * g * noise1(0.09 * t + 9 * h(6), 4);
      const D = Math.hypot(cx - B.eye[0], Y - B.eye[1], cz - B.eye[2]);
      if (D > dMax) continue;
      const op = k * 0.16 * ss(life, 0.12, 0.45) * (1 - ss(D, 30, dMax)) * (1 - fogAt(D)) * (0.55 + 0.45 * ss(D, 8, 30));
      const q = Math.min(NQ - 1, Math.floor((op / AMAX) * NQ));
      if (q < 1) continue;
      if (depth(B, [cx, Y, cz]) < NEAR + 4) continue;
      const pc = proj(B, [cx, Y, cz]);
      const R = g * (0.36 + 0.12 * h(4)) * (0.75 + 0.25 * life);
      if (!onScreen(pc.x, pc.y, R * pc.s + 10)) continue;
      const ring: P[] = [];
      for (let qq = 0; qq < 7; qq++) {
        const a = (qq / 7) * TAU + h(7);
        const rr = R * (0.72 + 0.5 * hash(i * 3.1 + j * 5.3 + qq * 1.7) + 0.12 * Math.sin(0.8 * t + qq + 6 * h(8)));
        ring.push(proj(B, [cx + Math.cos(a) * rr, Y, cz + Math.sin(a) * rr]));
      }
      paths[q] += closedPx(ring);
    }
  }
  return (
    <g fill={CAUSTIC}>
      {paths.map((d, q) => (d ? <path key={q} d={d} fillOpacity={(((q + 0.5) / NQ) * AMAX).toFixed(4)} /> : null))}
    </g>
  );
};

// ================================================================ ROCKS (cel-shaded boulders on the bed)
export type Rock = {x: number; z: number; r: number; h: number; seed: number};
/** boulders around the scene, clear of the predator, of the S10/S11 near side corridor and of every listed camera */
export const ROCKS: Rock[] = [
  {x: -98, z: -34, r: 13, h: 9, seed: 1},
  {x: -128, z: 8, r: 7, h: 5, seed: 2},
  {x: 92, z: -52, r: 17, h: 11, seed: 3},
  {x: 70, z: -22, r: 6, h: 4, seed: 4},
  {x: -40, z: -78, r: 10, h: 7, seed: 5},
  {x: 30, z: -96, r: 22, h: 13, seed: 6},
  {x: -170, z: -60, r: 20, h: 12, seed: 7},
  {x: 150, z: 30, r: 12, h: 8, seed: 8},
  {x: -150, z: 70, r: 15, h: 9, seed: 9},
  {x: 118, z: 118, r: 9, h: 6, seed: 10},
  {x: -70, z: 182, r: 18, h: 11, seed: 11},
  {x: 10, z: 205, r: 12, h: 8, seed: 12},
  {x: -230, z: -150, r: 30, h: 18, seed: 13},
  {x: 210, z: -120, r: 26, h: 15, seed: 14},
  {x: -6, z: -190, r: 28, h: 16, seed: 15},
];
type Draw = {D: number; el: React.ReactNode};
const rockDraw = (B: Basis, rk: Rock, key: string): Draw | null => {
  const c: V3 = [rk.x, BED_Y - rk.h * 0.35, rk.z];
  const dz = depth(B, c);
  if (dz < rk.r + NEAR) return null;
  const pc = proj(B, c);
  const rpx = rk.r * 1.3 * pc.s;
  if (!onScreen(pc.x, pc.y, rpx)) return null;
  const D = len3(sub3(c, B.eye));
  const Lw = lightDir(B);
  const toEye = (p: V3) => norm3(sub3(B.eye, p));
  const all: P[] = [], mid: P[] = [], hi: P[] = [];
  const NA = 12, NE = 4;
  for (let a = 0; a < NA; a++) {
    for (let e = 0; e <= NE; e++) {
      const th = (a / NA) * TAU, ph = (e / NE) * (Math.PI / 2) * 0.98;
      const j = 1 + 0.18 * (hash(rk.seed * 9.1 + a * 1.7 + e * 3.3) - 0.5);
      const n: V3 = [Math.cos(th) * Math.cos(ph), -Math.sin(ph), Math.sin(th) * Math.cos(ph)];
      const p: V3 = [rk.x + n[0] * rk.r * j, BED_Y + 0.6 - (n[1] < 0 ? -n[1] : 0) * rk.h * j, rk.z + n[2] * rk.r * j * 0.85];
      const nn = norm3([n[0] / rk.r, n[1] / Math.max(1, rk.h), n[2] / rk.r]);
      const q = proj(B, p);
      all.push(q);
      if (dot3(nn, toEye(p)) < -0.05) continue;
      const l = dot3(nn, Lw);
      if (l > -0.15) mid.push(q);
      if (l > 0.45) hi.push(q);
    }
  }
  const f = fogAt(D);
  const col = (k: string) => hazed(B, k, c);
  const sh = proj(B, [rk.x + rk.r * 0.25, BED_Y, rk.z]);
  const inkO = (1 - 0.85 * f) * (1 - ss(D, 260, 420));
  const shapes: React.ReactNode[] = [
    <ellipse key="s" cx={f1(sh.x + rpx * 0.12)} cy={f1(sh.y)} rx={f1(rpx * 1.05)} ry={f1(Math.max(2, rpx * 0.22))} fill={BED_SHADOW} fillOpacity={(0.35 * (1 - f)).toFixed(3)} />,
    <path key="a" d={smoothClosed(hull(all))} fill={col(shade(ROCK_BASE, 0.32))} stroke={INK} strokeOpacity={inkO.toFixed(3)} strokeWidth={INK_PX * 0.75} vectorEffect={NS} strokeLinejoin="round" />,
  ];
  if (mid.length > 2) shapes.push(<path key="m" d={smoothClosed(hull(mid))} fill={col(ROCK_BASE)} />);
  if (hi.length > 2) shapes.push(<path key="h" d={smoothClosed(hull(hi))} fill={col(lit(ROCK_BASE, 0.2))} />);
  return {D: dz, el: <g key={key}>{shapes}</g>};
};

// ================================================================ THE REEDS
/** one clump of eelgrass: base centre (x, z) on the bed, radius r, blade count n, typical height h */
export type ReedClump = {x: number; z: number; r: number; n: number; h: number; seed: number};
type Blade = {x: number; z: number; L: number; w: number; th0: number; tw: number; lean: number; bend: number; dir: number; ph: number; tone: number; clump: number};

const inClear = (x: number, z: number) => Math.abs(x) < 62 && z < 22 && z > -52;
/** the reed field: clumps on the near side (z 22..170, x −130..130, where S11 tracks the eel through them), sparser
 *  all round out to ≈ 300 u, clear of the predator's zone (|x| < 62, −52 < z < 22). World-fixed, deterministic. */
export const REEDS: ReedClump[] = (() => {
  const out: ReedClump[] = [];
  // near side: a jittered grid
  const g = 25;
  for (let i = -5; i < 5; i++) {
    for (let j = 0; j < 6; j++) {
      const h = (k: number) => hash(i * 41.3 + j * 17.9 + k * 2.71 + 0.31);
      if (h(1) < 0.3) continue;
      const x = (i + 0.1 + 0.8 * h(2)) * g + 3, z = 22 + (j + 0.1 + 0.8 * h(3)) * g;
      if (inClear(x, z)) continue;
      out.push({x, z, r: 2.5 + 4 * h(4), n: 3 + Math.floor(6 * h(5)), h: 45 + 85 * h(6) * h(6), seed: 1000 + out.length * 7.3});
    }
  }
  // all round, sparser (outside the near-side block)
  const G = 36;
  for (let i = -9; i < 9; i++) {
    for (let j = -9; j < 9; j++) {
      const h = (k: number) => hash(i * 23.7 + j * 59.1 + k * 3.33 + 9.1);
      if (h(1) < 0.45) continue;
      const x = (i + 0.1 + 0.8 * h(2)) * G, z = (j + 0.1 + 0.8 * h(3)) * G;
      if (Math.abs(x) < 128 && z > 18 && z < 172) continue;
      if (inClear(x, z) || Math.hypot(x, z) > 310) continue;
      out.push({x, z, r: 3 + 6 * h(4), n: 3 + Math.floor(7 * h(5)), h: 50 + 100 * h(6) * h(6), seed: 5000 + out.length * 7.3});
    }
  }
  return out;
})();
const bladesOf = (cl: ReedClump, ci: number): Blade[] =>
  Array.from({length: cl.n}, (_, b) => {
    const h = (k: number) => hash(cl.seed + b * 11.37 + k * 1.913);
    const ang = TAU * h(1), rr = cl.r * Math.sqrt(h(2));
    const ox = Math.cos(ang) * rr, oz = Math.sin(ang) * rr;
    // lean downstream (+x), fanning a little away from the clump's centre
    const out = Math.atan2(oz, ox);
    const dir = Math.atan2(0.35 * Math.sin(out) + (h(3) - 0.5) * 0.45, 1 + 0.3 * Math.cos(out));
    return {
      x: cl.x + ox, z: cl.z + oz,
      L: cl.h * (0.6 + 0.4 * h(4)),
      w: 1.8 + 1.9 * h(5),
      th0: TAU * h(6), tw: (h(7) - 0.5) * 3.6,
      lean: 0.08 + 0.2 * h(8), bend: 0.45 + 0.85 * h(9),
      dir, ph: TAU * h(10), tone: h(11), clump: ci,
    };
  });
const BLADES: Blade[] = REEDS.flatMap((c, i) => bladesOf(c, i));

/** the blade's centreline, width directions and widths at time t (n segments) */
const bladeGeom = (b: Blade, t: number, n: number) => {
  const Cs: V3[] = [[b.x, BED_Y + 0.6, b.z]];
  const Ts: V3[] = [];
  const waves: number[] = [];
  let p = Cs[0];
  const step = b.L / n;
  for (let i = 1; i <= n; i++) {
    const u = (i - 0.5) / n;
    const wave = Math.sin(TAU * 0.24 * t - 0.04 * b.x + b.ph - 2.1 * u);
    const a = b.lean + b.bend * u * u + (0.06 + 0.12 * u) * u * wave;
    const hd = b.dir + 0.25 * u * Math.sin(TAU * 0.17 * t + 1.7 * b.ph - 1.4 * u);
    const d: V3 = [Math.sin(a) * Math.cos(hd), -Math.cos(a), Math.sin(a) * Math.sin(hd)];
    p = add3(p, mul3(d, step));
    Cs.push(p);
    Ts.push(d);
    waves.push(wave);
  }
  const Ws: V3[] = [], ws: number[] = [], Ns: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const T = i === 0 ? Ts[0] : i === n ? Ts[n - 1] : norm3(add3(Ts[i - 1], Ts[i]));
    const th = b.th0 + b.tw * u + 0.35 * (waves[Math.max(0, i - 1)] ?? 0) * u;
    let hv: V3 = [Math.cos(th), 0, Math.sin(th)];
    hv = sub3(hv, mul3(T, dot3(hv, T)));
    if (len3(hv) < 0.15) hv = cross3(T, [0, 1, 0]);
    const Wv = norm3(hv);
    Ws.push(Wv);
    Ns.push(cross3(T, Wv));
    const base = u < 0.07 ? 0.6 + 0.4 * (u / 0.07) : 1;
    const tip = u > 0.84 ? Math.sqrt(Math.max(0, 1 - ((u - 0.84) / 0.16) ** 2)) : 1;
    ws.push(b.w * base * tip);
  }
  return {C: Cs, W: Ws, N: Ns, w: ws};
};

const APERTURE = 0.42;
/** circle of confusion (px) of a point at camera depth d in front of the focus distance F (0 behind it) */
const cocOf = (B: Basis, d: number, F: number) => Math.max(0, APERTURE * B.f * (1 / Math.max(d, 0.5) - 1 / F));

/** a closed outline of a screen-space ribbon: centre points c, half-widths hw (px), rounded tip */
const softRibbon = (c: P[], hw: number[]) => {
  const n = c.length;
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
    const tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
    const nx = -ty / tl, ny = tx / tl;
    L.push({x: c[i].x + nx * hw[i], y: c[i].y + ny * hw[i]});
    R.push({x: c[i].x - nx * hw[i], y: c[i].y - ny * hw[i]});
  }
  // the tip: a round cap of radius hw[n-1] beyond the last point
  const a = c[n - 2], b = c[n - 1];
  const tx = b.x - a.x, ty = b.y - a.y, tl = Math.hypot(tx, ty) || 1;
  const cap = {x: b.x + (tx / tl) * hw[n - 1] * 0.9, y: b.y + (ty / tl) * hw[n - 1] * 0.9};
  return closedPx([...L, cap, ...R.reverse()]);
};

/** a clump filter: false/0 drops the clump, a number in (0, 1) fades it */
export type ReedFilter = (c: ReedClump, index: number) => boolean | number;
type ReedOpts = {B: Basis; t: number; zSplit: number; focus: number; near: boolean; filter?: ReedFilter};
/** every visible blade on one side of zSplit, as depth-tagged draw items (back to front after sorting) */
const reedDraws = (o: ReedOpts): Draw[] => {
  const {B, t, zSplit, focus} = o;
  const Lw = lightDir(B);
  const out: Draw[] = [];
  const clumpOk = new Map<number, number>();
  // far blades of a clump batch into one stroked path
  const farBatch = new Map<number, {d: string; D: number; col: string; w: number; a: number}>();
  for (const b of BLADES) {
    let ok = clumpOk.get(b.clump);
    if (ok === undefined) {
      const cl = REEDS[b.clump];
      const cd = depth(B, [cl.x, BED_Y, cl.z]);
      const Dh = Math.hypot(cl.x - B.eye[0], cl.z - B.eye[2]);
      ok = Dh < 560 && cd > -cl.h * 1.2 - cl.r ? 1 : 0;
      if (ok && o.filter) {
        const fv = o.filter(cl, b.clump);
        ok = fv === true ? 1 : fv === false ? 0 : clamp(fv);
      }
      clumpOk.set(b.clump, ok);
    }
    if (ok < 0.01) continue;
    const base: V3 = [b.x, BED_Y, b.z];
    const bd = depth(B, base);
    if (o.near !== bd < zSplit) continue;
    const Dh = Math.hypot(b.x - B.eye[0], b.z - B.eye[2]);
    // the geometry is always the same 12-segment curve (no shape change with distance); far blades are drawn
    // through every 2nd / 3rd sample of it
    const n = 12;
    const step = Dh < 150 ? 1 : Dh < 280 ? 2 : 3;
    const g = bladeGeom(b, t, n);
    // depths, near-plane cut: keep the longest run of samples in front of the lens
    const dz = g.C.map((p) => depth(B, p));
    let i0 = 0, i1 = n;
    if (dz.some((d) => d < NEAR)) {
      let best = [0, -1], cur = -1;
      for (let i = 0; i <= n + 1; i++) {
        const okk = i <= n && dz[i] >= NEAR;
        if (okk && cur < 0) cur = i;
        if (!okk && cur >= 0) {
          if (i - 1 - cur > best[1] - best[0]) best = [cur, i - 1];
          cur = -1;
        }
      }
      if (best[1] - best[0] < 1) continue;
      [i0, i1] = best;
    }
    const idx: number[] = [];
    for (let i = i0; i <= i1; i++) if (i === i0 || i === i1 || (i - i0) % step === 0) idx.push(i);
    const cs = idx.map((i) => proj(B, g.C[i]));
    // screen bbox cull (with the widest half-width)
    let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9, wmax = 0;
    idx.forEach((i, k) => {
      const q = cs[k];
      const wp = g.w[i] * q.s * 0.5;
      wmax = Math.max(wmax, wp);
      bx0 = Math.min(bx0, q.x); bx1 = Math.max(bx1, q.x); by0 = Math.min(by0, q.y); by1 = Math.max(by1, q.y);
    });
    const dMid = dz[Math.round((i0 + i1) / 2)];
    const coc = cocOf(B, Math.min(dMid, ...idx.map((i) => dz[i])), focus);
    const m = wmax + coc + 4;
    if (bx1 < -m || bx0 > W + m || by1 < -m || by0 > H + m) continue;
    const mid = g.C[Math.round((i0 + i1) / 2)];
    const D = len3(sub3(mid, B.eye));
    const fg = fogAt(D);
    const wc = waterColor(sub3(mid, B.eye));
    const baseTone = b.tone < 0.3 ? mix(REED_MID, REED_YEL, 0.35) : b.tone > 0.75 ? mix(REED_MID, REED_TEAL, 0.35) : REED_MID;
    const tones = [mix(REED_DARK, baseTone, 0.12), baseTone, mix(baseTone, REED_LIT, 0.75)].map((c) => mix(c, wc, fg));
    // very near the lens: fade (no full-frame flashes as the camera brushes past)
    const dmin = Math.min(...idx.map((i) => dz[i]));
    const aNear = ss(dmin, NEAR + 1, NEAR + 7) * ok;
    if (aNear < 0.01) continue;

    if (wmax < 1.3 && coc < 2.5) {
      // thin and far: a stroked centreline, batched per clump
      const fbk = farBatch.get(b.clump);
      const d = `M${cs.map(pp).join('L')}`;
      if (fbk) fbk.d += d;
      else farBatch.set(b.clump, {d, D: bd, col: tones[1], w: Math.max(0.9, wmax * 1.6), a: ok});
      continue;
    }
    const els: React.ReactNode[] = [];
    const sharpK = 1 - ss(coc, 2.5, 6);
    if (sharpK > 0.01) {
      // projected edges, facing sign per sample, runs of one face
      const e1 = idx.map((i) => proj(B, add3(g.C[i], mul3(g.W[i], g.w[i] / 2))));
      const e2 = idx.map((i) => proj(B, add3(g.C[i], mul3(g.W[i], -g.w[i] / 2))));
      const fs = idx.map((i) => dot3(g.N[i], sub3(B.eye, g.C[i])) / (len3(sub3(B.eye, g.C[i])) || 1));
      const runs: {pts: P[]; tone: number}[] = [];
      let k0 = 0;
      let start: P | null = null;
      const toneOf = (k: number) => {
        const nv = mul3(g.N[idx[k]], fs[k] >= 0 ? 1 : -1);
        const l = dot3(nv, Lw);
        return l > 0.4 ? 2 : l > -0.08 ? 1 : 0;
      };
      for (let k = 0; k < idx.length; k++) {
        const flip = k < idx.length - 1 && fs[k] * fs[k + 1] < 0;
        if (flip || k === idx.length - 1) {
          let end: P | null = null;
          if (flip) {
            const f = fs[k] / (fs[k] - fs[k + 1]);
            end = {x: lerp(cs[k].x, cs[k + 1].x, f), y: lerp(cs[k].y, cs[k + 1].y, f)};
          }
          const A = e1.slice(k0, k + 1), Bq = e2.slice(k0, k + 1).reverse();
          const pts = [...(start ? [start] : []), ...A, ...(end ? [end] : []), ...Bq];
          runs.push({pts, tone: toneOf(Math.min(k, Math.round((k0 + k) / 2)))});
          start = end;
          k0 = k + 1;
        }
      }
      const outline = `M${e1.map(pp).join('L')}L${e2.reverse().map(pp).join('L')}Z`;
      const inkW = INK_PX * 0.62 * (1 - 0.5 * fg) * clamp(wmax / 2.5, 0.45, 1);
      const inkO = (1 - 0.88 * fg) * clamp((wmax - 0.8) / 1.5, 0, 1);
      if (runs.length === 1) {
        els.push(<path key="r" d={outline} fill={tones[runs[0].tone]} stroke={INK} strokeOpacity={inkO.toFixed(3)} strokeWidth={f1(inkW)} strokeLinejoin="round" />);
      } else {
        runs.forEach((r, ri) => els.push(<path key={ri} d={`M${r.pts.map(pp).join('L')}Z`} fill={tones[r.tone]} />));
        els.push(<path key="o" d={outline} fill="none" stroke={INK} strokeOpacity={inkO.toFixed(3)} strokeWidth={f1(inkW)} strokeLinejoin="round" />);
      }
      // a thin lit stripe along the lit face's midrib on big, near, in-focus blades
      if (wmax > 7 && fg < 0.5) {
        const mids = idx.map((i, k) => (fs[k] >= 0 ? proj(B, add3(g.C[i], mul3(g.W[i], -g.w[i] * 0.12))) : null));
        let seg: P[] = [];
        const segs: string[] = [];
        mids.forEach((q, k) => {
          if (q && toneOf(k) >= 1) seg.push(q);
          else {
            if (seg.length > 2) segs.push(`M${seg.map(pp).join('L')}`);
            seg = [];
          }
        });
        if (seg.length > 2) segs.push(`M${seg.map(pp).join('L')}`);
        if (segs.length) els.push(<path key="mr" d={segs.join('')} fill="none" stroke={mix(tones[2], C.mote, 0.25)} strokeOpacity={0.45} strokeWidth={f1(Math.max(1, wmax * 0.12))} strokeLinecap="round" />);
      }
    }
    if (sharpK < 0.99) {
      // out of focus: soft, dark, layered (an opaque core and translucent halos), no ink; every other sample is
      // plenty for a blurred shape
      const sel = idx.map((_, k) => k).filter((k) => k % 2 === 0 || k === idx.length - 1);
      const cS = sel.map((k) => cs[k]);
      const hS = sel.map((k) => {
        const i = idx[k], a = cs[k];
        const e = proj(B, add3(g.C[i], mul3(g.W[i], g.w[i] / 2)));
        const prev = cs[Math.max(0, k - 1)], next = cs[Math.min(cs.length - 1, k + 1)];
        const tx = next.x - prev.x, ty = next.y - prev.y, tl = Math.hypot(tx, ty) || 1;
        return Math.abs(((e.x - a.x) * -ty + (e.y - a.y) * tx) / tl);
      });
      const dark = 0.85 * ss(coc, 3, 34);
      const col = mix(mix(tones[0], tones[1], 0.45), REED_NEAR, dark);
      const bl = coc;
      const lay = (dw: number) => softRibbon(cS, hS.map((h) => Math.max(0.3, h + dw)));
      const g2: React.ReactNode[] = [];
      const hwMax = Math.max(...hS);
      if (hwMax - bl / 2 > 1) g2.push(<path key="c" d={lay(-bl / 2)} />);
      // nL translucent halos from −bl/2 to +bl/2: stacked they ramp the edge from 0 to opaque
      // (layer l, counted outward from the core, has opacity 1/(l + 2): the stacked coverage then steps evenly from
      // the outer edge to the core, k/(nL + 1))
      const nL = Math.round(clamp(bl / 8, 3, 5));
      for (let l = 0; l < nL; l++) g2.push(<path key={`h${l}`} d={lay(-bl / 2 + (bl * (l + 0.5)) / nL)} fillOpacity={(1 / (l + 2)).toFixed(3)} />);
      // the lit side of the out-of-focus blade: a soft lighter band toward the light (screen upper left)
      if (hwMax > 8 && hwMax - bl / 2 > 4) {
        const sh = cS.map((c0, k) => {
          const a0 = cS[Math.max(0, k - 1)], b0 = cS[Math.min(cS.length - 1, k + 1)];
          const tx = b0.x - a0.x, ty = b0.y - a0.y, tl = Math.hypot(tx, ty) || 1;
          let nx = -ty / tl, ny = tx / tl;
          if (nx * -0.62 + ny * -0.78 < 0) { nx = -nx; ny = -ny; }
          const o = Math.max(0, hS[k] - bl / 2) * 0.42;
          return {x: c0.x + nx * o, y: c0.y + ny * o};
        });
        const sw = hS.map((h) => Math.max(0.3, (h - bl / 2) * 0.3));
        const sc = mix(col, mix(tones[1], tones[2], 0.5), 0.3 + 0.25 * (1 - dark));
        g2.push(
          <g key="lit" fill={sc}>
            <path d={softRibbon(sh, sw.map((w0) => w0 + bl * 0.3))} fillOpacity={0.3} />
            <path d={softRibbon(sh, sw)} fillOpacity={0.55} />
          </g>,
        );
      }
      els.push(<g key="soft" fill={col} opacity={sharpK > 0.01 ? (1 - sharpK).toFixed(3) : undefined}>{g2}</g>);
    }
    out.push({D: bd, el: <g key={`b${out.length}`} opacity={aNear < 0.99 ? aNear.toFixed(3) : undefined}>{els}</g>});
  }
  farBatch.forEach((fb, ci) => out.push({D: fb.D, el: <path key={`f${ci}`} d={fb.d} fill="none" stroke={fb.col} strokeWidth={f1(fb.w)} strokeLinecap="round" strokeLinejoin="round" opacity={fb.a < 0.99 ? fb.a.toFixed(3) : undefined} />}));
  return out;
};
const rockDraws = (B: Basis, zSplit: number, near: boolean): Draw[] => {
  const out: Draw[] = [];
  ROCKS.forEach((r, i) => {
    const d = depth(B, [r.x, BED_Y, r.z]);
    if (near !== d < zSplit) return;
    const dr = rockDraw(B, r, `k${i}`);
    if (dr) out.push(dr);
  });
  return out;
};

export type ReedsProps = {
  B: Basis;
  t: number;
  /** true: the reeds (and rocks) between the camera and zSplit; false: those behind it */
  near: boolean;
  /** camera depth that splits back from front (default: the depth of the predator's centre) */
  zSplit?: number;
  /** focus distance for the depth of field (default zSplit) */
  focus?: number;
  /** keep only the clumps this returns true for, or fade them by the number it returns (e.g. clearSight(...)) */
  filter?: ReedFilter;
  /** also draw the boulders on this side (default true) */
  rocks?: boolean;
};
/** the reed field (and the boulders) on one side of zSplit, sorted back to front, in screen px */
export const Reeds: React.FC<ReedsProps> = ({B, t, near, zSplit, focus, filter, rocks = true}) => {
  const zs = zSplit ?? subjectDepth(B);
  const items = [...reedDraws({B, t, zSplit: zs, focus: focus ?? zs, near, filter}), ...(rocks ? rockDraws(B, zs, near) : [])];
  items.sort((a, b) => b.D - a.D);
  return <g>{items.map((d) => d.el)}</g>;
};

/** a ReedFilter that keeps the lines of sight from the camera eye to the given world points clear: clumps whose base
 *  circle (plus their lean downstream) comes within r of a sight line (in plan, x/z) fade out smoothly (fully gone
 *  inside r, untouched beyond 1.6 r), so a moving camera never pops a clump */
export const clearSight = (B: Basis, targets: V3[], r: number): ReedFilter => (c) => {
  let dmin = 1e9;
  for (const p of targets) {
    const ax = B.eye[0], az = B.eye[2], bx = p[0], bz = p[2];
    const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1;
    // the clump's footprint: its base and a point downstream where the leaning blades reach
    for (const [cx, cz] of [[c.x, c.z], [c.x + 0.35 * c.h, c.z]]) {
      const u = clamp(((cx - ax) * vx + (cz - az) * vz) / l2);
      dmin = Math.min(dmin, Math.hypot(ax + vx * u - cx, az + vz * u - cz) - c.r);
    }
  }
  return ss(dmin, r, 1.6 * r);
};

// ================================================================ MOTES (3D, drifting with the current)
type MoteSet = {T: number; n: number; seed: number; r: [number, number]; a: number};
const MOTE_SETS: MoteSet[] = [
  {T: 64, n: 220, seed: 11, r: [0.07, 0.2], a: 0.8},
  {T: 240, n: 560, seed: 23, r: [0.25, 0.65], a: 0.6},
];
const wrapT = (v: number, T: number) => ((((v + T / 2) % T) + T) % T) - T / 2;
const Motes: React.FC<{B: Basis; t: number; zSplit: number; near: boolean}> = ({B, t, zSplit, near}) => {
  const id = uid('mo');
  const NB = 6;
  const small: string[] = Array.from({length: NB}, () => '');
  const bokeh: {x: number; y: number; r: number; a: number}[] = [];
  for (const m of MOTE_SETS) {
    for (let i = 0; i < m.n; i++) {
      const h = (k: number) => hash(m.seed + i * 1.713 + k * 3.917);
      const vx = 0.8 + 1.4 * h(4);
      const bx = h(1) * m.T + vx * t + 0.5 * Math.sin(0.6 * t + TAU * h(5));
      const by = h(2) * m.T + 0.15 * (h(6) - 0.5) * t + 0.5 * Math.sin(0.45 * t + TAU * h(7));
      const bz = h(3) * m.T + 0.4 * Math.sin(0.5 * t + TAU * h(8));
      const dx = wrapT(bx - B.eye[0], m.T), dy = wrapT(by - B.eye[1], m.T), dzz = wrapT(bz - B.eye[2], m.T);
      const p: V3 = [B.eye[0] + dx, B.eye[1] + dy, B.eye[2] + dzz];
      if (p[1] > BED_Y - 0.3 || p[1] < SURF_Y) continue;
      const d = depth(B, p);
      if (d < NEAR + 0.5) continue;
      if (near !== d < zSplit) continue;
      const q = proj(B, p);
      const r = lerp(m.r[0], m.r[1], h(9) * h(9));
      const rpx = r * q.s;
      if (rpx < 0.35 || !onScreen(q.x, q.y, rpx + 40)) continue;
      const edge = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dzz)) / (m.T / 2);
      const D = Math.hypot(dx, dy, dzz);
      let a = m.a * (0.5 + 0.5 * h(10)) * (1 - ss(edge, 0.72, 0.98)) * (1 - 0.85 * fogAt(D)) * ss(rpx, 0.35, 0.9);
      const coc = cocOf(B, d, zSplit);
      if (coc > 3) {
        const re = rpx + coc * 0.45;
        a *= clamp((rpx / re) ** 2 * 6, 0.12, 1) * 0.8;
        if (a > 0.01) bokeh.push({x: q.x, y: q.y, r: re, a});
        continue;
      }
      if (a < 0.02) continue;
      const bi = Math.min(NB - 1, Math.floor(a * NB));
      small[bi] += `M${f1(q.x - rpx)} ${f1(q.y)}a${f1(rpx)} ${f1(rpx)} 0 1 0 ${f1(2 * rpx)} 0a${f1(rpx)} ${f1(rpx)} 0 1 0 ${f1(-2 * rpx)} 0Z`;
    }
  }
  return (
    <g>
      {bokeh.length > 0 && (
        <defs>
          <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={C.mote} stopOpacity={0.9} />
            <stop offset="0.7" stopColor={C.mote} stopOpacity={0.6} />
            <stop offset="1" stopColor={C.mote} stopOpacity={0} />
          </radialGradient>
        </defs>
      )}
      {small.map((d, i) => (d ? <path key={i} d={d} fill={C.mote} fillOpacity={((i + 0.5) / NB).toFixed(3)} /> : null))}
      {bokeh.map((b, i) => (
        <circle key={`k${i}`} cx={f1(b.x)} cy={f1(b.y)} r={f1(b.r)} fill={`url(#${id})`} fillOpacity={b.a.toFixed(3)} />
      ))}
    </g>
  );
};

// ================================================================ vignette (behind the subject)
const Vignette: React.FC = () => {
  const id = uid('vg');
  // only the ring outside the clear centre is filled (the gradient is transparent inside it anyway)
  const cx = 510, cy = 900, R = 1150, k = 0.55;
  const rx = R * k, ry = R * k;
  const ring = `M-2 -2H${W + 2}V${H + 2}H-2Z M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={R}>
          <stop offset={k} stopColor={C.waterDeep} stopOpacity={0} />
          <stop offset="1" stopColor={C.waterDeep} stopOpacity={0.3} />
        </radialGradient>
      </defs>
      <path d={ring} fillRule="evenodd" fill={`url(#${id})`} />
    </g>
  );
};

// ================================================================ exports: the two halves of the environment
export type WorldProps = {
  B: Basis;
  t: number;
  /** camera depth of the subject: reeds, rocks and motes split here; also the focus distance (default: the depth of
   *  the predator's centre) */
  zSplit?: number;
  /** draw the reed field and the boulders on this side (default true) */
  reeds?: boolean;
  /** keep only these reed clumps, or fade them (see Reeds, clearSight) */
  filter?: ReedFilter;
};
/** the water volume and everything behind the subject (screen px; draw first) */
export const WorldBack: React.FC<WorldProps> = ({B, t, zSplit, reeds = true, filter}) => {
  const zs = zSplit ?? subjectDepth(B);
  return (
    <g>
      <WaterBg B={B} />
      <FarProps B={B} t={t} />
      <Shafts B={B} t={t} />
      <Caustics B={B} t={t} />
      <Gravel B={B} />
      {reeds && <Reeds B={B} t={t} near={false} zSplit={zs} filter={filter} />}
      <Motes B={B} t={t} zSplit={zs} near={false} />
      <Vignette />
    </g>
  );
};
/** everything between the camera and the subject: front reeds (soft and dark near the lens) and motes */
export const WorldFront: React.FC<WorldProps> = ({B, t, zSplit, reeds = true, filter}) => {
  const zs = zSplit ?? subjectDepth(B);
  return (
    <g>
      {reeds && <Reeds B={B} t={t} near zSplit={zs} filter={filter} />}
      <Motes B={B} t={t} zSplit={zs} near />
    </g>
  );
};

// ================================================================ the predator's contact shadow
/** the predator's soft contact shadow on the bed: a body-shaped ellipse in 3D (following the lateral `bend`, which is
 *  approximated as a parabola from x = −25 to the tail tip), layered for a soft edge, nudged away from the upper-left
 *  light. Draw after WorldBack, before the predator.
 *  - pose: any object with the predator's `bend` (a PredPose works)
 *  - at: a world offset for a translated predator (default none)
 *  - lift: how far the belly is above the bed (u, default 0): the shadow spreads and fades
 *  - opacity: overall multiplier (default 1) */
export const PredShadow: React.FC<{B: Basis; pose: {bend?: number}; at?: V3; lift?: number; opacity?: number}> = ({B, pose, at = [0, 0, 0], lift = 0, opacity = 1}) => {
  const bend = pose.bend ?? 0;
  const zOff = (x: number) => (bend * Math.max(0, x + 25) ** 2) / 150;
  // half-width of the shadow (the body's footprint plus the soft spread)
  const hwAt = (x: number) => {
    const u = (x + 52) / 104;
    return 9.5 * (1 + Math.max(0, lift) / 12) * Math.pow(Math.sin(Math.PI * clamp(u, 0, 1)), 0.7) * (1 - 0.45 * clamp(u, 0, 1));
  };
  const nudge = mul3(norm3([B.r[0], 0, B.r[2]]), 1.6);
  const ring = (k: number, x0: number, x1: number) => {
    const pts: P[] = [];
    const N2 = 16;
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i <= N2; i++) {
        const u = s === 0 ? i / N2 : 1 - i / N2;
        const x = lerp(x0, x1, u);
        const hw = hwAt(x) * k * (s === 0 ? 1 : -1);
        const p: V3 = add3(add3([x, BED_Y - at[1], zOff(x) + hw], at), nudge);
        if (depth(B, p) < NEAR) return '';
        pts.push(proj(B, p));
      }
    }
    return smoothClosed(pts);
  };
  const c: V3 = add3([-6, BED_Y, 0], at);
  const D = len3(sub3(c, B.eye));
  const a = (opacity * (1 - fogAt(D))) / (1 + Math.max(0, lift) / 5);
  if (a < 0.01) return null;
  const col = BED_SHADOW;
  const layers: [number, number, number, number][] = [
    [1.35, -56, 56, 0.14],
    [1.0, -51, 51, 0.16],
    [0.7, -46, 38, 0.18],
    [0.42, -40, 22, 0.2],
  ];
  return (
    <g fill={col}>
      {layers.map(([k, x0, x1, o], i) => {
        const d = ring(k, x0, x1);
        return d ? <path key={i} d={d} fillOpacity={(o * a).toFixed(3)} /> : null;
      })}
    </g>
  );
};

// ================================================================ the loop's reed wipe (screen space, at the lens)
const WIPE_W = 500; // blade width (px)
const WIPE_SOFT = 70; // soft edge (px)
const WIPE_SEAM_IN = 70; // the seam sits this far inside the opaque core's trailing edge
const wipeX = (t: number, t0: number, t1: number) => {
  const u = clamp((t - t0) / (t1 - t0));
  const e = 0.72 * u + 0.28 * (u * u * (3 - 2 * u));
  return lerp(W + WIPE_W / 2 + WIPE_SOFT + 230, -WIPE_W / 2 - WIPE_SOFT - 230, e);
};
/** the blade's centre x at screen row y (it leans: the top further right) and its half-width */
const wipeCentre = (X: number, y: number) => X - 0.17 * (y - H / 2) + 26 * Math.sin((y / H) * Math.PI * 1.3 + 0.4);
const wipeHalf = (y: number) => WIPE_W / 2 + 22 * Math.sin((y / H) * Math.PI * 2 + 1.1);
/** the screen region the wipe has already passed (right of the blade's trailing edge, which lies inside the blade's
 *  opaque core): show frame 0 there. [] before t0; the whole frame from t1. */
export const reedWipePoly = (t: number, t0: number, t1: number): P[] => {
  if (t <= t0) return [];
  if (t >= t1) return [{x: -10, y: -10}, {x: W + 10, y: -10}, {x: W + 10, y: H + 10}, {x: -10, y: H + 10}];
  const X = wipeX(t, t0, t1);
  const pts: P[] = [];
  for (let y = -60; y <= H + 60; y += 60) pts.push({x: wipeCentre(X, y) + wipeHalf(y) - WIPE_SOFT / 2 - WIPE_SEAM_IN, y});
  return [...pts, {x: W + 2000, y: H + 60}, {x: W + 2000, y: -60}];
};
/** the reed blade of the loop: a dark, out-of-focus eelgrass blade right at the lens sweeping right → left over
 *  [t0, t1] (≈ 0.4 s); its opaque core always covers the reedWipePoly seam. Draw it over both frames. */
export const ReedWipe: React.FC<{t: number; t0: number; t1: number}> = ({t, t0, t1}) => {
  if (t <= t0 || t >= t1) return null;
  const X = wipeX(t, t0, t1);
  const ys: number[] = [];
  for (let y = -120; y <= H + 120; y += 80) ys.push(y);
  const band = (dl: number, dr: number) => {
    const L = ys.map((y) => ({x: wipeCentre(X, y) - wipeHalf(y) - dl, y}));
    const R = ys.map((y) => ({x: wipeCentre(X, y) + wipeHalf(y) + dr, y})).reverse();
    return `M${[...L, ...R].map(pp).join('L')}Z`;
  };
  // a lit midrib stripe a little left of centre (the light is upper left), soft-edged
  const stripe = (w: number) => {
    const L = ys.map((y) => ({x: wipeCentre(X, y) - 0.18 * WIPE_W - w, y}));
    const R = ys.map((y) => ({x: wipeCentre(X, y) - 0.18 * WIPE_W + w, y})).reverse();
    return `M${[...L, ...R].map(pp).join('L')}Z`;
  };
  const s = WIPE_SOFT;
  const body = mix(REED_NEAR, REED_DARK, 0.4);
  // six translucent halos (outermost first, opacity 1/(NL + 1 − l)) ramp the soft edge evenly to the opaque core
  const NL = 6;
  return (
    <g>
      <g fill={body}>
        {Array.from({length: NL}, (_, l) => {
          const dw = s / 2 - (s * (l + 0.5)) / NL;
          return <path key={l} d={band(dw, dw)} fillOpacity={(1 / (NL + 1 - l)).toFixed(3)} />;
        })}
      </g>
      <path d={band(-s / 2, -s / 2)} fill={body} />
      <g fill={mix(body, REED_MID, 0.5)}>
        <path d={stripe(70)} fillOpacity={0.25} />
        <path d={stripe(46)} fillOpacity={0.35} />
        <path d={stripe(26)} fillOpacity={0.45} />
      </g>
    </g>
  );
};
/** for checks: the blade's opaque core [left, right] x at row y, and the seam x, at time t */
export const reedWipeCore = (t: number, t0: number, t1: number, y: number) => {
  const X = wipeX(t, t0, t1);
  const c = wipeCentre(X, y), hw = wipeHalf(y);
  return {left: c - hw + WIPE_SOFT / 2, right: c + hw - WIPE_SOFT / 2, seam: c + hw - WIPE_SOFT / 2 - WIPE_SEAM_IN};
};
/** the internal layers, for the test entry's timing bench only */
export const __PARTS = {WaterBg, FarProps, Shafts, Caustics, Gravel, Motes, Reeds, Vignette};
