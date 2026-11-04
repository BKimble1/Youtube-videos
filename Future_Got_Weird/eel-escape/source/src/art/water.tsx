// Water, riverbed and effects (build contract D): the clear stream the predator rests in, seen at the fish's level.
//
// Depth model (camera.tsx): a layer at depth z (+ farther, - nearer) is scaled by d / (d + z), d = 2.2·w. The riverbed is
// ONE horizontal plane at y = BED_Y (the fish's belly rests on it at z = 0), so a bed point at depth zb appears on screen
// at row  H/2 + s(zb)·(BED_Y − c.y): the far bed climbs toward the camera's eye line and dissolves into the water.
// The continuous bed (its colour by depth) and the fine bed detail (gravel, caustic filaments) are therefore drawn in
// SCREEN space, projected per frame from bed coordinates (x, zb), so every pebble parallaxes exactly at its own depth;
// the discrete props (rocks, plant clumps, motes, near pebbles) sit in a few depth layers whose depth-of-field blur is
// the Layer's CSS blur (no SVG filters at all). Motes wrap on a world-anchored tile around the camera, so they never run
// out and never pop inside the frame. The stream flows toward +x (the fish faces upstream): motes drift and plants lean
// that way.
//
// Draw order, back to front. EnvBack: far water (unblurred: gradient, glow and light shafts from the upper left, bokeh)
// → bed plane (unblurred screen SVG: the bed's colour by depth, laid over the far water with opacity 1 − haze, plus the
// in-focus gravel and caustic filaments around the fish) → mid layer (ONE blur pass: the hazy far bed — ridge, rocks,
// eelgrass — drawn at its own depth inside it, then mid rocks, plants and soft bokeh motes) → near bed (blurred: soft
// caustics and big gravel toward the lens; it lies in front of the fish in depth but never overlaps it on screen) →
// small motes behind the fish → vignette → X-ray darkness. The Scene then draws FishShadow in the fish's own layer, the
// fish, the eel, EnvFront (motes and big soft pebbles in front of the fish), WaterRush. Blurred layers: 2 in EnvBack,
// 1 in EnvFront.
import React from 'react';
import {Cam, DIST, H, Layer, layerScale, W} from '../camera';
import {closed, P, pt} from '../core/geo';
import {lit, mix, rgba} from '../core/color';
import {uid} from '../core/ids';
import {clamp, hash, lerp, noise1, ss} from '../lib';
import {PELVIC} from '../anatomy';
import {C, NS} from './palette';

/** the riverbed surface (fish-local / world y); the fish's belly line rests on it at y ≈ 12.4 */
export const BED_Y = 12.6;

// ---------------------------------------------------------------- depths of the environment's layers
const Z = {far: 600, haze: 210, mid: 62, nearBed: -26, moteBack: 16, moteFront: -15, front: -44};
/** the haze's e-folding depth (world units beyond the fish's plane) */
const FOG_Z = 135;
const fog = (z: number) => (z <= 0 ? 0 : 1 - Math.exp(-z / FOG_Z));

// ---------------------------------------------------------------- projection helpers
const kOf = (c: Cam) => c.k ?? 1;
const sOf = (c: Cam, z: number) => layerScale(c, z);
const scrX = (c: Cam, x: number, z: number) => W / 2 + sOf(c, z) * (x - c.x);
const scrY = (c: Cam, y: number, z: number) => H / 2 + sOf(c, z) * kOf(c) * (y - c.y);
/** screen row of the bed at depth zb (or of a point at height BED_Y − y above it) */
const rowOf = (c: Cam, zb: number, y = BED_Y) => scrY(c, y, zb);
/** the bed's depth seen at screen row r (Infinity at or above the horizon) */
const zbAtRow = (c: Cam, r: number) => {
  const s = (r - H / 2) / (kOf(c) * (BED_Y - c.y));
  if (s <= 1e-6) return Infinity;
  const d = DIST * c.w;
  return ((W / c.w) * d) / s - d;
};
/** half the world extent (x, y) seen at depth z */
const halfView = (c: Cam, z: number): [number, number] => [W / 2 / sOf(c, z), H / 2 / (sOf(c, z) * kOf(c))];
/** the same at a framing a little wider than the film's widest (w = 82), for wrap tiles */
const halfViewMax = (z: number): [number, number] => {
  const s = layerScale({x: 0, y: 0, w: 84}, z);
  return [W / 2 / s, H / 2 / s];
};
/** nearest allowed depth (a layer must stay in front of the lens) */
const zNearOk = (c: Cam, z: number) => Math.max(z, -0.86 * DIST * c.w);

/** draws children in SCREEN pixels inside a <Layer c z> (undoes the layer's camera transform) */
const InScreen: React.FC<{c: Cam; z: number; children: React.ReactNode}> = ({c, z, children}) => {
  const s = sOf(c, z), k = kOf(c);
  return <g transform={`translate(${c.x} ${c.y}) scale(${1 / s} ${1 / (s * k)}) translate(${-W / 2} ${-H / 2})`}>{children}</g>;
};
/** draws children given in world units at depth z inside a <Layer c z={inLayer}> (a scale about the camera centre), so
 *  content at several depths can share one layer's blur pass with exact parallax */
const AtDepth: React.FC<{c: Cam; z: number; inLayer: number; children: React.ReactNode}> = ({c, z, inLayer, children}) => {
  const k = sOf(c, z) / sOf(c, inLayer);
  return <g transform={`translate(${c.x} ${c.y}) scale(${k}) translate(${-c.x} ${-c.y})`}>{children}</g>;
};
/** a plain screen-space SVG (optionally blurred) */
const Screen: React.FC<{blur?: number; opacity?: number; children: React.ReactNode}> = ({blur = 0, opacity, children}) => (
  <div style={{position: 'absolute', inset: 0, opacity, filter: blur > 0.45 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
    <svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {children}
    </svg>
  </div>
);

const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(2).replace(/\.?0+$/, ''));
/** smooth open path through screen-pixel points (Catmull-Rom as cubic Béziers, 0.1 px precision) */
const openPx = (ps: P[], tension = 1) => {
  const g = (n: number) => (Math.round(n * 10) / 10).toString();
  const n = ps.length, k = tension / 6;
  let d = `M${g(ps[0].x)} ${g(ps[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(n - 1, i + 2)];
    d += `C${g(p1.x + (p2.x - p0.x) * k)} ${g(p1.y + (p2.y - p0.y) * k)} ${g(p2.x - (p3.x - p1.x) * k)} ${g(p2.y - (p3.y - p1.y) * k)} ${g(p2.x)} ${g(p2.y)}`;
  }
  return d;
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const wrap = (v: number, T: number) => ((((v + T / 2) % T) + T) % T) - T / 2;

// ---------------------------------------------------------------- colours
/** the water column (far layer world y): lighter toward the surface, hazy at the far bed, deep below */
const WATER: [number, string][] = [
  [-640, lit(C.waterTop, 0.3)],
  [-420, lit(C.waterTop, 0.13)],
  [-240, C.waterTop],
  [-80, mix(C.waterTop, C.haze, 0.62)],
  [BED_Y, C.haze],
  // below the far bed line the far layer is only ever seen through the bed's haze: keep it the haze colour
  [220, mix(C.haze, C.waterDeep, 0.18)],
  [420, mix(C.haze, C.waterDeep, 0.3)],
];
const waterAt = (y: number) => {
  if (y <= WATER[0][0]) return WATER[0][1];
  for (let i = 1; i < WATER.length; i++) {
    if (y <= WATER[i][0]) return mix(WATER[i - 1][1], WATER[i][1], (y - WATER[i - 1][0]) / (WATER[i][0] - WATER[i - 1][0]));
  }
  return WATER[WATER.length - 1][1];
};
/** the water colour behind screen row r (what the far bed fades into) */
const waterAtRow = (c: Cam, r: number) => waterAt(c.y + (r - H / 2) / (sOf(c, Z.far) * kOf(c)));
/** sand tinted by the water it is seen through */
const SAND = mix(C.sand, C.haze, 0.1);
const SAND_LIT = lit(SAND, 0.16);
/** the shadowed near bed toward the lens (cool, so the foreground reads as water-shaded, not as mud) */
const BED_NEAR = mix(C.bedShadow, C.waterDeep, 0.55);
/** the sand toward the lens: a deeper, slightly shaded sand (still sand, not murk) */
const SAND_NEAR = mix(mix(C.sand, C.pebbleC, 0.45), C.haze, 0.12);
/** the bed's own colour at depth zb, before haze: lit sand at the fish, a deeper shaded sand toward the lens */
const bedNear = (zb: number) =>
  zb < 0 ? mix(mix(SAND_LIT, SAND_NEAR, ss(-zb, 2, 45)), BED_NEAR, 0.4 * ss(-zb, 30, 90)) : mix(SAND_LIT, SAND, ss(zb, 0, 40));
/** the bed's colour at depth zb as seen (hazed into the water behind it) */
const bedAt = (c: Cam, zb: number) => mix(bedNear(zb), waterAtRow(c, rowOf(c, zb)), fog(zb));
/** a colour seen through the haze at depth z (on screen row r) */
const hazed = (c: Cam, col: string, z: number, r: number, k = 0.86) => mix(col, waterAtRow(c, r), k * fog(z));

// ---------------------------------------------------------------- far water: gradient, light, shafts, bokeh
const SHAFTS = [
  {x: -300, w: 30, a: 0.17},
  {x: -228, w: 46, a: 0.13},
  {x: -150, w: 22, a: 0.2},
  {x: -92, w: 54, a: 0.11},
  {x: -20, w: 28, a: 0.15},
  {x: 60, w: 40, a: 0.11},
];
const SHAFT_TILT = 0.3; // radians from vertical: the light comes from the upper left
const FarWater: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const id = uid('fw');
  const [hw, hh] = halfView(c, Z.far);
  const x0 = c.x - hw * 1.4, x1 = c.x + hw * 1.4, y0 = c.y - hh * 1.4, y1 = c.y + hh * 1.4;
  const g0 = WATER[0][0], g1 = WATER[WATER.length - 1][0];
  const top = -720, bot = 60;
  const shafts = SHAFTS.map((s, i) => {
    const sway = 9 * noise1(0.11 * t + i * 5.1, 3);
    const xa = s.x + sway, xb = xa + (bot - top) * Math.tan(SHAFT_TILT) + 14 * noise1(0.08 * t + i * 2.7, 5);
    const wa = s.w, wb = s.w * 1.7;
    const a = 1.25 * s.a * (0.74 + 0.26 * noise1(0.33 * t + i * 2.3, 4));
    const ym = (top + bot) / 2, xm = (xa + xb) / 2, wm = (wa + wb) / 2;
    return {pts: [pt(xa - wa / 2, top), pt(xa + wa / 2, top), pt(xb + wb / 2, bot), pt(xb - wb / 2, bot)], a, gx0: xm - wm / 2, gx1: xm + wm / 2, ym};
  });
  const bokeh = Array.from({length: 9}, (_, i) => {
    const T = 520, TY = 360;
    const bx = hash(i * 4.31 + 1.3) * T, by = -380 + hash(i * 7.77 + 2.1) * TY;
    const x = c.x + wrap(bx + 1.2 * t - c.x, T);
    return {x, y: by + 6 * Math.sin(0.21 * t + i), r: 9 + 16 * hash(i * 2.9 + 0.4), a: 0.5 + 0.5 * hash(i * 1.1)};
  });
  return (
    <Layer c={c} z={Z.far} blurK={0}>
      <defs>
        <linearGradient id={`${id}w`} gradientUnits="userSpaceOnUse" x1="0" y1={g0} x2="0" y2={g1}>
          {WATER.map(([y, col], i) => <stop key={i} offset={(y - g0) / (g1 - g0)} stopColor={col} />)}
        </linearGradient>
        <radialGradient id={`${id}g`} gradientUnits="userSpaceOnUse" cx={-190} cy={-470} r={420}>
          <stop offset="0" stopColor={lit(C.waterTop, 0.55)} stopOpacity={0.6} />
          <stop offset="0.45" stopColor={lit(C.waterTop, 0.35)} stopOpacity={0.22} />
          <stop offset="1" stopColor={C.waterTop} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}m`} gradientUnits="userSpaceOnUse" x1="0" y1={-520} x2="0" y2={bot}>
          <stop offset="0" stopColor="#fff" stopOpacity={1} />
          <stop offset="0.55" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}k`} maskUnits="userSpaceOnUse" x={x0} y={y0} width={x1 - x0} height={y1 - y0}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id}m)`} />
        </mask>
        {shafts.map((s, i) => (
          <linearGradient key={i} id={`${id}s${i}`} gradientUnits="userSpaceOnUse" x1={s.gx0} y1={s.ym} x2={s.gx1} y2={s.ym - (s.gx1 - s.gx0) * Math.tan(SHAFT_TILT)}>
            <stop offset="0" stopColor={C.mote} stopOpacity={0} />
            <stop offset="0.3" stopColor={C.mote} stopOpacity={s.a * 0.65} />
            <stop offset="0.5" stopColor={C.mote} stopOpacity={s.a} />
            <stop offset="0.7" stopColor={C.mote} stopOpacity={s.a * 0.65} />
            <stop offset="1" stopColor={C.mote} stopOpacity={0} />
          </linearGradient>
        ))}
        <radialGradient id={`${id}b`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={lit(C.waterTop, 0.5)} stopOpacity={0.14} />
          <stop offset="0.72" stopColor={lit(C.waterTop, 0.5)} stopOpacity={0.1} />
          <stop offset="1" stopColor={lit(C.waterTop, 0.5)} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id}w)`} />
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={`url(#${id}g)`} />
      <g mask={`url(#${id}k)`}>
        {shafts.map((s, i) => (
          <path key={i} d={`M${s.pts.map((q) => `${f1(q.x)} ${f1(q.y)}`).join('L')}Z`} fill={`url(#${id}s${i})`} />
        ))}
      </g>
      {bokeh.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={`url(#${id}b)`} opacity={b.a} />
      ))}
    </Layer>
  );
};

// ---------------------------------------------------------------- the bed plane (screen space, continuous in depth)
/** the bed plane: its colour sampled on screen rows spaced densely near the horizon (where depth changes fastest), so the
 *  gradient varies continuously with the camera (no stops appearing or vanishing) */
const BedPlane: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const id = uid('bp');
  const rH = H / 2 + 1, rB = H + 24;
  const n = 30;
  const rows = Array.from({length: n + 1}, (_, i) => rH + (rB - rH) * Math.pow(i / n, 2.2));
  return (
    <Screen>
      <defs>
        <linearGradient id={`${id}g`} gradientUnits="userSpaceOnUse" x1="0" y1={rH} x2="0" y2={rB}>
          {rows.map((r, i) => {
            // the bed's own colour, laid over the far water with opacity 1 − haze: the far bed dissolves into the
            // actual water behind it (its light, shafts and bokeh included), with no edge at the horizon
            const zb = Math.max(zbAtRow(c, r), -0.8 * DIST * c.w);
            const a = zb > 1e5 ? 0 : 1 - fog(zb);
            return <stop key={i} offset={(r - rH) / (rB - rH)} stopColor={bedNear(Math.min(zb, 1e5))} stopOpacity={a} />;
          })}
        </linearGradient>
      </defs>
      <rect x={-20} y={rH} width={W + 40} height={rB - rH} fill={`url(#${id}g)`} />
      <FocusBed c={c} t={t} />
    </Screen>
  );
};

// ---------------------------------------------------------------- props: rocks and water plants (drawn in a layer at z)
type Rock = {x: number; rx: number; ry: number; seed: number; tone: number};
const rockPath = (r: Rock) => {
  const ps: P[] = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = Math.PI + (i / (n - 1)) * Math.PI; // the upper half, left to right
    const j = 1 + 0.13 * (hash(r.seed + i * 3.7) - 0.5);
    ps.push(pt(r.x + Math.cos(a) * r.rx * j, BED_Y - 0.15 * r.ry + Math.sin(a) * r.ry * j));
  }
  ps.push(pt(r.x + r.rx * 0.9, BED_Y + 0.25 * r.ry), pt(r.x - r.rx * 0.9, BED_Y + 0.25 * r.ry));
  return closed(ps, 0.85);
};
const RockG: React.FC<{c: Cam; z: number; r: Rock; id: string}> = ({c, z, r, id}) => {
  const row = rowOf(c, z, BED_Y - r.ry * 0.5);
  const base = mix(mix(C.pebbleA, C.pebbleB, r.tone), SAND, 0.2);
  const top = hazed(c, lit(base, 0.16), z, row);
  const mid = hazed(c, base, z, row);
  const dark = hazed(c, mix(base, BED_NEAR, 0.5), z, row);
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={r.x - r.rx * 0.4} y1={BED_Y - r.ry} x2={r.x + r.rx * 0.25} y2={BED_Y + 0.2 * r.ry}>
          <stop offset="0" stopColor={top} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d={rockPath(r)} fill={`url(#${id})`} />
    </g>
  );
};
type Clump = {x: number; h: number; n: number; seed: number; lean: number; spread: number};
/** a clump of ribbon-leaved water plants (eelgrass) leaning downstream (+x), swaying gently */
const ClumpG: React.FC<{c: Cam; z: number; p: Clump; t: number; dark: string; light: string; hz?: number}> = ({c, z, p, t, dark, light, hz = 0.86}) => {
  const blades: React.ReactNode[] = [];
  const row = rowOf(c, z, BED_Y - p.h * 0.5);
  for (let b = 0; b < p.n; b++) {
    const hb = hash(p.seed + b * 7.13), hb2 = hash(p.seed + b * 3.31 + 9), hb3 = hash(p.seed + b * 1.77 + 4);
    const L = p.h * (0.55 + 0.5 * hb);
    const w0 = p.h * (0.022 + 0.012 * hb2);
    const x0 = p.x + (hb3 - 0.5) * p.spread;
    const a0 = p.lean + (hb2 - 0.5) * 0.55;
    const bend = 0.35 + 0.5 * hb;
    const ph = 2 * Math.PI * hb3;
    const n = 9;
    const L1: P[] = [], R1: P[] = [];
    let q = pt(x0, BED_Y + 0.2), ang = a0;
    const cl: P[] = [q];
    const ang0: number[] = [];
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      ang = a0 + bend * u * u + (0.16 + 0.1 * u) * u * Math.sin(2 * Math.PI * 0.23 * t + ph - 2.2 * u);
      q = pt(q.x + Math.sin(ang) * (L / n), q.y - Math.cos(ang) * (L / n));
      cl.push(q);
      ang0.push(ang);
    }
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = ang0[Math.min(n - 1, Math.max(0, i - 1))];
      const nx = Math.cos(a), ny = Math.sin(a);
      const wv = w0 * (1 - 0.85 * Math.pow(u, 1.4)) * (1 + 0.25 * Math.sin(u * 7 + ph));
      L1.push(pt(cl[i].x - nx * wv, cl[i].y - ny * wv));
      R1.push(pt(cl[i].x + nx * wv, cl[i].y + ny * wv));
    }
    const col = mix(dark, light, 0.25 + 0.6 * hb2);
    blades.push(<path key={b} d={closed([...L1, ...[...R1].reverse()], 0.6)} fill={hazed(c, col, z, row, hz)} />);
  }
  return <g>{blades}</g>;
};
const PLANT_DARK = mix(C.waterDeep, C.fishSaddle, 0.35);
const PLANT_LIGHT = mix(mix(C.waterMid, C.fishBody, 0.3), C.waterTop, 0.25);

// the hazy far bed (z = Z.haze)
const HAZE_ROCKS: Rock[] = [
  {x: -205, rx: 16, ry: 7, seed: 1, tone: 0.3}, {x: -150, rx: 9, ry: 4, seed: 2, tone: 0.6}, {x: -96, rx: 22, ry: 8, seed: 3, tone: 0.4},
  {x: -38, rx: 12, ry: 5, seed: 4, tone: 0.7}, {x: 22, rx: 19, ry: 7.5, seed: 5, tone: 0.2}, {x: 84, rx: 10, ry: 4, seed: 6, tone: 0.5},
  {x: 140, rx: 24, ry: 9, seed: 7, tone: 0.35}, {x: 205, rx: 13, ry: 5, seed: 8, tone: 0.6},
];
const HAZE_CLUMPS: Clump[] = [
  {x: -178, h: 46, n: 7, seed: 11, lean: 0.12, spread: 10}, {x: -122, h: 30, n: 5, seed: 12, lean: 0.08, spread: 7},
  {x: -60, h: 52, n: 8, seed: 13, lean: 0.14, spread: 12}, {x: 48, h: 40, n: 6, seed: 14, lean: 0.1, spread: 9},
  {x: 112, h: 56, n: 8, seed: 15, lean: 0.12, spread: 12}, {x: 178, h: 36, n: 6, seed: 16, lean: 0.1, spread: 8},
];
const ridgeY = (x: number) => BED_Y - (1.6 + 2.4 * (0.5 + 0.5 * noise1(x / 34, 7)) + 1.4 * (0.5 + 0.5 * noise1(x / 11, 8)));
/** the hazy far bed's content, drawn at its own depth inside the mid layer (one shared blur pass; see AtDepth) */
const HazeBed: React.FC<{c: Cam; t: number; inLayer: number}> = ({c, t, inLayer}) => {
  const id = uid('hb');
  const z = Z.haze;
  const [hw] = halfView(c, z);
  const xa = c.x - hw * 1.3, xb = c.x + hw * 1.3;
  const ridge: P[] = [];
  for (let x = Math.floor(xa / 6) * 6; x <= xb + 6; x += 6) ridge.push(pt(x, ridgeY(x)));
  const rrow = rowOf(c, z, BED_Y - 3);
  const ridgeCol = hazed(c, mix(SAND, C.pebbleC, 0.35), z, rrow);
  const ridgeTop = hazed(c, lit(SAND, 0.1), z, rrow);
  const vis = (x: number, r: number) => x + r > xa && x - r < xb;
  return (
    <AtDepth c={c} z={z} inLayer={inLayer}>
      <defs>
        <linearGradient id={`${id}r`} gradientUnits="userSpaceOnUse" x1="0" y1={BED_Y - 6} x2="0" y2={BED_Y + 0.5}>
          <stop offset="0" stopColor={ridgeTop} />
          <stop offset="1" stopColor={ridgeCol} />
        </linearGradient>
      </defs>
      {HAZE_CLUMPS.filter((p) => vis(p.x, p.h)).map((p, i) => (
        <ClumpG key={`c${i}`} c={c} z={z + 20} p={p} t={t} dark={PLANT_DARK} light={PLANT_LIGHT} hz={0.66} />
      ))}
      <path d={`M${f1(ridge[0].x)} ${BED_Y + 0.6}` + ridge.map((q) => `L${f1(q.x)} ${f1(q.y)}`).join('') + `L${f1(ridge[ridge.length - 1].x)} ${BED_Y + 0.6}Z`} fill={`url(#${id}r)`} />
      {HAZE_ROCKS.filter((r) => vis(r.x, r.rx)).map((r, i) => (
        <RockG key={`r${i}`} c={c} z={z} r={r} id={`${id}k${i}`} />
      ))}
    </AtDepth>
  );
};

// the mid bed (z = Z.mid): a few rocks and plant clumps beside the fish, and drifting motes
const MID_ROCKS: Rock[] = [
  {x: -86, rx: 7.5, ry: 4.2, seed: 21, tone: 0.35}, {x: -66, rx: 3.6, ry: 2.2, seed: 22, tone: 0.7}, {x: -12, rx: 9, ry: 4.5, seed: 23, tone: 0.25},
  {x: 30, rx: 5, ry: 2.6, seed: 24, tone: 0.6}, {x: 64, rx: 8.5, ry: 4.6, seed: 25, tone: 0.4}, {x: 96, rx: 4.4, ry: 2.4, seed: 26, tone: 0.65},
];
const MID_CLUMPS: Clump[] = [
  {x: -76, h: 28, n: 7, seed: 31, lean: 0.16, spread: 6}, {x: -112, h: 22, n: 5, seed: 32, lean: 0.12, spread: 5},
  {x: 8, h: 18, n: 5, seed: 33, lean: 0.14, spread: 4}, {x: 74, h: 30, n: 7, seed: 34, lean: 0.14, spread: 6},
];
type MoteCfg = {z: number; n: number; seed: number; r: [number, number]; a: number; v: number};
const motePos = (c: Cam, m: MoteCfg, i: number, t: number) => {
  const [hw, hh] = halfViewMax(m.z);
  const TW = hw * 2.3 + 6, TH = hh * 2.3 + 6;
  const h1 = hash(m.seed + i * 1.713), h2 = hash(m.seed + i * 3.117), h3 = hash(m.seed + i * 5.531), h4 = hash(m.seed + i * 7.9);
  const vx = m.v * (0.55 + 0.9 * h3), vy = m.v * 0.22 * (h4 - 0.5);
  const bx = h1 * TW + vx * t + 0.6 * Math.sin(0.7 * t + 6.3 * h2);
  const by = h2 * TH + vy * t + 0.5 * Math.sin(0.5 * t + 6.3 * h1);
  return {x: c.x + wrap(bx - c.x, TW), y: c.y + wrap(by - c.y, TH), r: lerp(m.r[0], m.r[1], h4 * h4), a: m.a * (0.55 + 0.45 * h3)};
};
const MOTES_MID: MoteCfg = {z: Z.mid, n: 28, seed: 101, r: [0.6, 1.3], a: 0.6, v: 1.1};
const MOTES_BACK: MoteCfg = {z: Z.moteBack, n: 46, seed: 202, r: [0.13, 0.32], a: 0.8, v: 0.9};
const MOTES_FRONT: MoteCfg = {z: Z.moteFront, n: 28, seed: 303, r: [0.18, 0.45], a: 0.6, v: 0.8};
const MOTES_NEAR: MoteCfg = {z: Z.front, n: 5, seed: 404, r: [0.5, 1.1], a: 0.22, v: 0.7};

const MidBed: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const id = uid('mb');
  const z = Z.mid;
  const [hw] = halfView(c, z);
  const xa = c.x - hw * 1.3, xb = c.x + hw * 1.3;
  const vis = (x: number, r: number) => x + r > xa && x - r < xb;
  const motes = Array.from({length: MOTES_MID.n}, (_, i) => motePos(c, MOTES_MID, i, t));
  return (
    <Layer c={c} z={z} blurK={46} maxBlur={16}>
      <HazeBed c={c} t={t} inLayer={z} />
      {MID_CLUMPS.filter((p) => vis(p.x, p.h)).map((p, i) => (
        <ClumpG key={`c${i}`} c={c} z={z + 4} p={p} t={t} dark={PLANT_DARK} light={PLANT_LIGHT} />
      ))}
      {MID_ROCKS.filter((r) => vis(r.x, r.rx)).map((r, i) => (
        <RockG key={`r${i}`} c={c} z={z} r={r} id={`${id}k${i}`} />
      ))}
      {motes.map((m, i) => (
        <circle key={`m${i}`} cx={m.x} cy={m.y} r={m.r} fill={C.mote} opacity={m.a} />
      ))}
    </Layer>
  );
};

// ---------------------------------------------------------------- bed detail around the fish and in front of it
/** caustic shimmer on the bed, seen at a grazing angle: long wavy filaments of light at roughly constant depth (each
 *  wanders in depth, so neighbours touch and enclose thin cells), broken into pieces, drifting slowly. World-anchored,
 *  projected to the screen; one path per filament. Returns [path, depth] per filament. */
const causticBands = (c: Cam, t: number, z0: number, z1: number, gz: number, step: number, seed: number, thr = -0.2) => {
  const [hw] = halfView(c, z1);
  const xmin = c.x - hw - 3, xmax = c.x + hw + 3;
  const out: [string, number][] = [];
  const j0 = Math.ceil(z0 / gz), j1 = Math.floor(z1 / gz);
  for (let j = j0; j <= j1; j++) {
    const zj = j * gz;
    const zAt = (x: number) => zj + 0.46 * gz * noise1(x / 7.3 + 0.19 * t + j * 1.71, seed) + 0.2 * gz * noise1(x / 2.7 - 0.31 * t + j * 3.13, seed + 1);
    const onAt = (x: number) => noise1(x / 8.3 + 0.13 * t + j * 5.37, seed + 2) - thr;
    const P1 = (x: number) => {
      const zb = Math.max(zAt(x), -0.82 * DIST * c.w);
      return pt(scrX(c, x, zb), rowOf(c, zb));
    };
    const runs: P[][] = [];
    let run: P[] = [];
    let xp = Math.floor(xmin / step) * step, op = onAt(xp);
    if (op > 0) run.push(P1(xp));
    for (let x = xp + step; x <= xmax + step; x += step) {
      const o = onAt(x);
      if (o > 0 && op <= 0) run = [P1(xp + (step * op) / (op - o))]; // switches on between samples: start exactly there
      if (o > 0) run.push(P1(x));
      if (o <= 0 && op > 0) {
        run.push(P1(xp + (step * op) / (op - o))); // switches off: end exactly there
        if (run.length > 2) runs.push(run);
        run = [];
      }
      xp = x;
      op = o;
    }
    if (run.length > 2) runs.push(run);
    if (runs.length) out.push([runs.map((r) => openPx(r, 0.9)).join(''), zj]);
  }
  return out;
};

type Stone = {x: number; zb: number; r: number; tone: number; hi: number};
/** world-anchored gravel on the bed between depths z0..z1 (cells of cw × cz, m stones each) */
const gravel = (c: Cam, z0: number, z1: number, cw: number, cz: number, m: number, rr: [number, number], seed: number): Stone[] => {
  const [hw] = halfView(c, z1);
  const out: Stone[] = [];
  const i0 = Math.floor((c.x - hw - cw) / cw), i1 = Math.ceil((c.x + hw + cw) / cw);
  const j0 = Math.floor(z0 / cz), j1 = Math.ceil(z1 / cz);
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      for (let k = 0; k < m; k++) {
        const h = (q: number) => hash(i * 17.17 + j * 31.31 + k * 5.55 + seed + q);
        if (h(0.9) < 0.25) continue;
        const zb = (j + h(0.2)) * cz;
        if (zb < z0 || zb > z1) continue;
        out.push({x: (i + h(0.1)) * cw, zb, r: lerp(rr[0], rr[1], Math.pow(h(0.3), 2.2)), tone: h(0.4), hi: h(0.5)});
      }
    }
  }
  // far ones first
  return out.sort((a, b) => b.zb - a.zb);
};
const StoneG: React.FC<{c: Cam; s: Stone; fade: number}> = ({c, s, fade}) => {
  const sc = sOf(c, s.zb);
  const X = scrX(c, s.x, s.zb), Y = rowOf(c, s.zb);
  const rx = s.r * sc, ry = s.r * 0.62 * sc;
  if (rx < 0.9) return null;
  const base0 = s.tone < 0.33 ? C.pebbleA : s.tone < 0.66 ? C.pebbleB : C.pebbleC;
  const base = mix(mix(base0, SAND, 0.25), waterAtRow(c, Y), fog(s.zb));
  const top = lit(base, 0.1 + 0.1 * s.hi);
  const a = fade;
  return (
    <g opacity={a}>
      {rx > 2.5 && <ellipse cx={r1(X + rx * 0.35)} cy={r1(Y + ry * 0.05)} rx={r1(rx * 1.15)} ry={r1(ry * 0.45)} fill={C.bedShadow} opacity={0.35} />}
      <ellipse cx={r1(X)} cy={r1(Y - ry * 0.7)} rx={r1(rx)} ry={r1(ry)} fill={base} />
      <ellipse cx={r1(X - rx * 0.22)} cy={r1(Y - ry * 1.02)} rx={r1(rx * 0.66)} ry={r1(ry * 0.52)} fill={top} opacity={0.7} />
    </g>
  );
};
const CAUSTIC = lit(mix(C.mote, C.pebbleB, 0.15), 0.2);
/** the bed right around the fish: in focus (gravel, fine shimmering caustic filaments) */
const FocusBed: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const zMin = Math.max(-14, zbAtRow(c, H + 60) - 2.5);
  if (zMin > 40) return null;
  // (screen-space content: drawn inside the bed plane's SVG, unblurred)
  const bands = causticBands(c, t, zMin, 44, 4.2, 1.5, 7, 0.05);
  const stones = gravel(c, Math.max(zMin, -12), 26, 9, 5.5, 2, [0.16, 0.75], 3);
  return (
    <g>
      {bands.map(([d, zm], b) => {
        const fade = (1 - ss(zm, 12, 44)) * ss(zm, -10, -3);
        if (fade < 0.01) return null;
        return <path key={b} d={d} fill="none" stroke={CAUSTIC} strokeWidth={clamp(0.09 * sOf(c, zm), 1.1, 2.8)} strokeOpacity={0.22 * fade} strokeLinecap="round" strokeLinejoin="round" />;
      })}
      {stones.map((s, i) => (
        <StoneG key={i} c={c} s={s} fade={ss(s.zb, -12, -7) * (1 - 0.7 * fog(s.zb))} />
      ))}
    </g>
  );
};
/** the bed in front of the fish, toward the lens: out of focus (soft caustics, big gravel) */
const NearBed: React.FC<{c: Cam; t: number}> = ({c, t}) => {
  const zMin = zNearOk(c, zbAtRow(c, H + 40) - 4);
  if (zMin > -9) return null;
  const z = Z.nearBed;
  const bands = causticBands(c, t, zMin, -6, 4.6, 2.2, 19, 0.12);
  const stones = gravel(c, zMin, -9, 11, 10, 1, [0.4, 1.3], 9);
  return (
    <Layer c={c} z={z} blurK={44} maxBlur={20}>
      <InScreen c={c} z={z}>
        {bands.map(([d, zm], b) => (
          <path key={b} d={d} fill="none" stroke={CAUSTIC} strokeWidth={clamp(0.26 * sOf(c, zm), 3, 16)} strokeOpacity={(0.12 * ss(zm, -70, -20) + 0.09) * ss(-zm, 5, 12)} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {stones.map((s, i) => (
          <StoneG key={i} c={c} s={s} fade={0.65 * ss(-s.zb, 7, 12)} />
        ))}
      </InScreen>
    </Layer>
  );
};

// ---------------------------------------------------------------- motes (world-anchored, wrapped around the camera)
const Motes: React.FC<{c: Cam; t: number; m: MoteCfg; soft: number; opacity?: number}> = ({c, t, m, soft, opacity}) => {
  const id = uid('mo');
  const z = zNearOk(c, m.z);
  const ms = Array.from({length: m.n}, (_, i) => motePos(c, m, i, t));
  return (
    <Layer c={c} z={z} blurK={0} opacity={opacity}>
      <defs>
        <radialGradient id={id} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.mote} stopOpacity={1} />
          <stop offset={lerp(0.55, 0.05, soft)} stopColor={C.mote} stopOpacity={lerp(0.9, 0.7, soft)} />
          <stop offset="1" stopColor={C.mote} stopOpacity={0} />
        </radialGradient>
      </defs>
      {ms.map((q, i) => (
        <circle key={i} cx={q.x} cy={q.y} r={q.r} fill={`url(#${id})`} opacity={q.a} />
      ))}
    </Layer>
  );
};

// ---------------------------------------------------------------- near pebbles (in front of the fish)
const NEAR_PEBBLES: Rock[] = [
  {x: -62, rx: 3.4, ry: 2.0, seed: 51, tone: 0.3}, {x: -45.5, rx: 2.8, ry: 1.7, seed: 52, tone: 0.65},
  {x: -16, rx: 3.9, ry: 2.2, seed: 53, tone: 0.2}, {x: -2.5, rx: 2.2, ry: 1.3, seed: 54, tone: 0.75},
  {x: 16, rx: 3.6, ry: 2.1, seed: 55, tone: 0.45}, {x: 34, rx: 2.6, ry: 1.5, seed: 56, tone: 0.6},
];
const FrontBed: React.FC<{c: Cam; t: number; opacity: number}> = ({c, t, opacity}) => {
  const id = uid('fb');
  const z = zNearOk(c, Z.front);
  const [hw] = halfView(c, z);
  const xa = c.x - hw * 1.2, xb = c.x + hw * 1.2;
  if (rowOf(c, z, BED_Y - 2.5) > H + 30) {
    // the bed is below the frame: only the big soft motes
    return <Motes c={c} t={t} m={MOTES_NEAR} soft={1} opacity={opacity} />;
  }
  const near = Array.from({length: MOTES_NEAR.n}, (_, i) => motePos(c, MOTES_NEAR, i, t));
  return (
    <Layer c={c} z={z} opacity={opacity}>
      {NEAR_PEBBLES.filter((r) => r.x + r.rx > xa && r.x - r.rx < xb).map((r, i) => {
        // soft mounds close to the bed's own tone at this depth: lit tops, a little shade below (never dark smudges)
        const bed = bedAt(c, z);
        const stone = mix(C.pebbleA, C.pebbleB, r.tone);
        return (
          <g key={i}>
            <defs>
              <linearGradient id={`${id}p${i}`} gradientUnits="userSpaceOnUse" x1={r.x - r.rx * 0.5} y1={BED_Y - r.ry} x2={r.x + r.rx * 0.3} y2={BED_Y + 0.3 * r.ry}>
                <stop offset="0" stopColor={lit(mix(bed, stone, 0.6), 0.24)} />
                <stop offset="0.5" stopColor={mix(bed, stone, 0.55)} />
                <stop offset="1" stopColor={mix(mix(bed, stone, 0.4), BED_NEAR, 0.35)} />
              </linearGradient>
            </defs>
            <path d={rockPath(r)} fill={`url(#${id}p${i})`} />
          </g>
        );
      })}
      {near.map((q, i) => (
        <circle key={`n${i}`} cx={q.x} cy={q.y} r={q.r} fill={C.mote} opacity={q.a} />
      ))}
    </Layer>
  );
};

// ---------------------------------------------------------------- the X-ray darkness and a soft vignette
const XrayDark: React.FC<{opacity: number}> = ({opacity}) => (
  <div style={{position: 'absolute', inset: 0, opacity, background: `radial-gradient(ellipse 80% 62% at 50% 47%, ${C.xrayBg1} 0%, ${mix(C.xrayBg1, C.xrayBg0, 0.55)} 55%, ${C.xrayBg0} 100%)`}} />
);
const Vignette: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 95% 72% at 46% 44%, ${rgba(C.waterDeep, 0)} 55%, ${rgba(C.waterDeep, 0.26)} 100%)`}} />
);

// ---------------------------------------------------------------- exports
/** everything behind the fish: water, light, the riverbed (including the bed under the fish), back motes. Renders its
 *  own layers through the camera c. xray 0..1 fades it all to the X-ray darkness. */
export const EnvBack: React.FC<{c: Cam; t: number; xray: number}> = ({c, t, xray}) => {
  const x = clamp(xray);
  return (
    <>
      {x < 0.999 && (
        <>
          <FarWater c={c} t={t} />
          <BedPlane c={c} t={t} />
          <MidBed c={c} t={t} />
          <NearBed c={c} t={t} />
          <Motes c={c} t={t} m={MOTES_BACK} soft={0.25} />
          <Vignette />
        </>
      )}
      {x > 0.001 && <XrayDark opacity={x} />}
    </>
  );
};
/** in front of the fish (and the eel): small motes near the lens and big out-of-focus pebbles on the near bed */
export const EnvFront: React.FC<{c: Cam; t: number; xray: number}> = ({c, t, xray}) => {
  const o = 1 - clamp(xray);
  if (o < 0.001) return null;
  return (
    <>
      <Motes c={c} t={t} m={MOTES_FRONT} soft={0.6} opacity={o} />
      <FrontBed c={c} t={t} opacity={o} />
    </>
  );
};

/** the fish's contact shadow on the bed (fish-local units; draw it in the fish's layer, before the fish). c (optional,
 *  recommended: the frame's camera) sets how far the shadow spreads below the contact line (the bed recedes, so its
 *  depth shows as height on screen); xray (optional) fades it out with the water. t is accepted for the contract; the
 *  shadow is steady (the fish rests on the bed throughout). */
export const FishShadow: React.FC<{t: number; c?: Cam; xray?: number}> = ({c, xray = 0}) => {
  const id = uid('fs');
  const o = 1 - clamp(xray);
  if (o < 0.001) return null;
  // the head is ≈ 14 u wide: ±7 u of depth on the bed shows as this much height on screen (fish-local units)
  const spread = c ? clamp(((BED_Y - c.y) * 7.5) / (DIST * c.w - 7.5), 0.6, 3) : 1.3;
  const pel = PELVIC.base;
  return (
    <g opacity={o}>
      <defs>
        <radialGradient id={`${id}a`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.bedShadow} stopOpacity={0.62} />
          <stop offset="0.55" stopColor={C.bedShadow} stopOpacity={0.34} />
          <stop offset="1" stopColor={C.bedShadow} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${id}b`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={mix(C.bedShadow, C.xrayBg0, 0.4)} stopOpacity={0.7} />
          <stop offset="0.6" stopColor={C.bedShadow} stopOpacity={0.35} />
          <stop offset="1" stopColor={C.bedShadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* broad occlusion under the whole body, shifted a little downstream/right (light from the upper left) */}
      <ellipse cx={-7} cy={BED_Y + 0.1 * spread} rx={46} ry={spread * 1.25} fill={`url(#${id}a)`} />
      {/* the contact core under the belly, where it presses on the sand */}
      <ellipse cx={-7.5} cy={BED_Y + 0.05} rx={24} ry={Math.max(0.45, spread * 0.42)} fill={`url(#${id}b)`} />
      {/* the pelvic fins resting on the bed */}
      <ellipse cx={pel.x + 3.2} cy={BED_Y + 0.08} rx={4.8} ry={Math.max(0.3, spread * 0.3)} fill={`url(#${id}b)`} opacity={0.7} />
    </g>
  );
};

/** the suggested WaterRush direction: water thrown back out of the gill opening, a little downward, so the burst sits
 *  on the fish's flank beside the exit and stays clear of the eel's departing neck (which leaves up and back) */
export const RUSH_DIR = 0.22;

/** the burst of water when the eel's head pops free of the gill opening: a soft puff of displaced water, a swirl of
 *  tapered turbulence lines curling out to both sides, and a spray of bubbles thrown out in a cone around `dir` that
 *  slow, rise and pop. at: the gill exit (fish-local units, draw it in the fish's layer, in front of the eel),
 *  dir: the burst direction (screen radians, y down; e.g. EXIT_ANGLE or the head's direction of travel),
 *  t0: the release instant (s). The rush itself lasts ≈ 0.5 s; the last bubbles have popped by t0 + 0.95 s. */
export const WaterRush: React.FC<{at: P; dir: number; t: number; t0: number}> = ({at, dir, t, t0}) => {
  const a = t - t0;
  if (a < -0.03 || a > 0.95) return null;
  const id = uid('wr');
  const D = pt(Math.cos(dir), Math.sin(dir)), N = pt(-D.y, D.x);
  /** a point u along dir and v to its side, from the exit */
  const P2 = (u: number, v: number) => pt(at.x + D.x * u + N.x * v, at.y + D.y * u + N.y * v);
  const easeO = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
  // the puff of displaced water: a soft pale bloom that swells along dir and thins out
  const pf = clamp(a / 0.3);
  const puffR = 1.2 + 5.2 * easeO(pf);
  const puffA = 0.5 * (1 - ss(a, 0.05, 0.42)) * ss(a, -0.03, 0.03);
  const pc = P2(0.6 + 2.6 * easeO(pf), 0);
  // turbulence: tapered crescents (short spiral arcs) around the burst, each expanding outward and swirling round as
  // it goes, so the water reads as churned rather than splashed
  const lines: React.ReactNode[] = [];
  const NL = 7;
  const cb = P2(0.4 + 3 * easeO(a / 0.4), 0);
  for (let j = 0; j < NL; j++) {
    const hj = hash(j * 3.7 + 1.1), hk = hash(j * 5.9 + 2.3), hl = hash(j * 8.3 + 0.7);
    const side = j % 2 === 0 ? 1 : -1;
    const phi0 = (j - (NL - 1) / 2) * 0.4 + (hk - 0.5) * 0.3;
    const d0 = 0.025 * hl;
    const e = easeO((a - d0) / 0.42);
    if (e <= 0.01) continue;
    const R = 1 + (3 + 6 * hj) * e * (1 - 0.3 * Math.abs(phi0) / 1.3);
    const phi = phi0 + side * (0.55 + 0.4 * hl) * e;
    const span = 0.3 + 0.22 * hk;
    const n = 12;
    const Lft: P[] = [], Rgt: P[] = [];
    for (let i = 0; i <= n; i++) {
      const v = i / n;
      const th = phi + side * span * (2 * v - 1);
      const r = R * (1 - 0.16 * v);
      const ca = Math.cos(th), sa = Math.sin(th);
      const wv = (0.07 + 0.2 * (1 - 0.45 * e)) * Math.pow(Math.sin(Math.PI * v), 0.8) + 0.01;
      Lft.push(pt(cb.x + (D.x * ca + N.x * sa) * (r + wv), cb.y + (D.y * ca + N.y * sa) * (r + wv)));
      Rgt.push(pt(cb.x + (D.x * ca + N.x * sa) * (r - wv), cb.y + (D.y * ca + N.y * sa) * (r - wv)));
    }
    const op = 0.85 * ss(a, d0 - 0.02, d0 + 0.05) * (1 - ss(a, 0.22, 0.5));
    lines.push(<path key={j} d={closed([...Lft, ...[...Rgt].reverse()], 0.5)} fill={lit(C.mote, 0.35)} opacity={op} />);
  }
  // bubbles: a cone of spray around dir (a few squirt back along the flank), slowed by drag, then rising with a
  // wobble; small ones are bright beads, big ones are rings with a gloss
  const bubbles: React.ReactNode[] = [];
  const NB = 30;
  for (let i = 0; i < NB; i++) {
    const h = (q: number) => hash(i * 7.31 + q * 1.97 + 0.3);
    const b = a - 0.1 * h(1);
    if (b < 0) continue;
    const life = 0.45 + 0.4 * h(2);
    if (b > life) continue;
    const ang = (h(3) - 0.5) * 1.9 * (0.4 + 0.6 * h(11));
    const v0 = 18 + 40 * h(4), tau = 0.1 + 0.12 * h(5);
    const s = v0 * tau * (1 - Math.exp(-b / tau)) + 0.5;
    const swirl = (h(6) - 0.5) * 1.8 * b;
    let q = P2(s * Math.cos(ang + swirl), s * Math.sin(ang + swirl));
    q = pt(q.x + 0.3 * Math.sin(17 * b + 6 * h(7)), q.y - (3 + 4 * h(8)) * b * b - 1.4 * b);
    const r0 = 0.2 + 0.7 * Math.pow(h(9), 1.7);
    const r = r0 * (0.3 + 0.7 * ss(b, 0, 0.07)) * (1 - ss(b, life - 0.06, life)) * (1 + 0.07 * Math.sin(29 * b + 5 * h(10)));
    if (r < 0.04) continue;
    const op = 1 - ss(b, life - 0.2, life);
    if (r0 < 0.36) {
      bubbles.push(<circle key={i} cx={q.x} cy={q.y} r={r} fill={lit(C.mote, 0.5)} opacity={0.9 * op} />);
    } else {
      bubbles.push(
        <g key={i} opacity={op}>
          <circle cx={q.x} cy={q.y} r={r} fill={rgba(C.mote, 0.22)} stroke={lit(C.mote, 0.5)} strokeWidth={1.8} vectorEffect={NS} />
          <circle cx={q.x - r * 0.36} cy={q.y - r * 0.38} r={r * 0.27} fill={lit(C.mote, 0.85)} opacity={0.95} />
        </g>,
      );
    }
  }
  return (
    <g>
      <defs>
        <radialGradient id={`${id}p`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={lit(C.mote, 0.5)} stopOpacity={1} />
          <stop offset="0.45" stopColor={C.mote} stopOpacity={0.5} />
          <stop offset="1" stopColor={C.mote} stopOpacity={0} />
        </radialGradient>
      </defs>
      {puffA > 0.005 && <ellipse cx={pc.x} cy={pc.y} rx={puffR} ry={puffR * 0.8} fill={`url(#${id}p)`} opacity={puffA} transform={`rotate(${(dir * 180) / Math.PI} ${pc.x} ${pc.y})`} />}
      {lines}
      {bubbles}
    </g>
  );
};
