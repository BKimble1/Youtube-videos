// WORLD: the environments of Dead Bird Drones. The open field (opening and loop), the lab bench (construction and close
// drive), the wetland meadow (research goal) and the open sky (callback).
//
// Everything is placed in the film's one 3D world (cm, y up, the bird's flight line at y = 0, z = 0) and projected
// through the shot camera, so every camera move produces real parallax. Near layers are true 3D geometry (posts, wires,
// tufts, the bench, the lamp); far scenery (hills, treelines, clouds) sits on large vertical billboard planes at great
// depth, like a matte painting that still moves with the correct parallax for its distance. Every layer is softened by a
// simple depth-of-field model focused where the view axis crosses z = 0 (the bird's plane), so the bird stays crisp and
// the world falls into soft bokeh. Deterministic: no randomness beyond the lib hash/noise.
import React from 'react';
import {add3, Basis, cross3, deg, depth, dot3, lerp3, mul3, norm3, P2, planeMatrix, poly, proj, rad, smoothClosed, smoothOpen, SP, sub3, UP, unproj, V2, V3} from '../three';
import {CRADLE} from '../rig';
import {C, INK, LINE_PX, NS} from './palette';
import {clamp, hash, lerp, noise1} from '../lib';
import {mix} from '../core/color';
import {uid} from '../core/ids';

const W = 1080, H = 1920;
const fx = (n: number) => n.toFixed(1);
type Env = {B: Basis; t: number};

// ================================================================== shared helpers
/** depth (cm along the view axis) where the view axis crosses the plane z = 0: every story camera targets a point on
 *  (or very near) that plane, so this is the focus distance */
export const focusDepth = (B: Basis): number => {
  const fz = B.fw[2];
  return fz < -0.02 ? clamp(-B.eye[2] / fz, 8, 1e5) : 600;
};
/** circle of confusion (screen px) at depth d for an aperture of A cm, focused at focusDepth(B) */
export const coc = (B: Basis, d: number, A: number) => {
  const dF = focusDepth(B);
  return A * (B.f / dF) * Math.abs(1 - dF / Math.max(1, d));
};
/** a group softened by a gaussian blur of about px (screen px across); skipped when negligible */
export const Soft: React.FC<{px: number; opacity?: number; children?: React.ReactNode}> = ({px, opacity, children}) => {
  const sd = Math.round(Math.min(px, 90) * 2) / 4; // stdDeviation = px / 2, quantised to 0.25 px
  if (sd < 0.35) return <g opacity={opacity}>{children}</g>;
  const id = uid('wsoft');
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={-320} y={-320} width={W + 640} height={H + 640} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={sd} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>{children}</g>
    </g>
  );
};
/** world x range seen by the frame (plus a margin in px) on the vertical plane z = Z */
const spanX = (B: Basis, Z: number, m = 260): [number, number] => {
  let lo = Infinity, hi = -Infinity;
  for (const sx of [-m, W + m]) {
    for (const sy of [-m, H + m]) {
      const d = sub3(unproj(B, sx, sy, 1), B.eye);
      if (Math.abs(d[2]) < 1e-9) continue;
      const s = (Z - B.eye[2]) / d[2];
      if (s <= 0) continue;
      const x = B.eye[0] + s * d[0];
      lo = Math.min(lo, x);
      hi = Math.max(hi, x);
    }
  }
  if (!isFinite(lo)) return [B.eye[0] - 2000, B.eye[0] + 2000];
  return [lo, hi];
};
/** integer lattice indices k with k * step inside [lo, hi] (capped for safety) */
const lat = (lo: number, hi: number, step: number, cap = 260): number[] => {
  const out: number[] = [];
  const k0 = Math.floor(lo / step), k1 = Math.ceil(hi / step);
  for (let k = k0; k <= k1 && out.length < cap; k++) out.push(k);
  return out;
};
const xy = (p: SP): V2 => ({x: p.x, y: p.y});
/** are these projected points safely in front of the camera and (some of them) near the frame? */
const visible = (pts: SP[], m = 400) =>
  pts.every((p) => p.z > 5) && pts.some((p) => p.x > -m && p.x < W + m && p.y > -m && p.y < H + m);
/** project a world polygon, clipped to the camera's near side */
const projPoly = (B: Basis, pts: V3[], near = 3): V2[] => {
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const da = depth(B, a) - near, db = depth(B, b) - near;
    if (da >= 0) out.push(a);
    if (da >= 0 !== db >= 0) out.push(lerp3(a, b, da / (da - db)));
  }
  return out.map((p) => xy(proj(B, p)));
};
const quadY = (B: Basis, y: number, x0: number, x1: number, z0: number, z1: number) => poly(projPoly(B, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]));
const quadZ = (B: Basis, z: number, x0: number, x1: number, y0: number, y1: number) => poly(projPoly(B, [[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]]));

// ------------------------------------------------------------------ sky and far billboards
/** the camera's heading (deg; 0 = looking toward -z, positive toward +x) */
const camPsi = (B: Basis) => deg(Math.atan2(B.fw[0], -B.fw[2]));
/** a world direction from a heading and an elevation (deg) */
const dirW = (psi: number, el: number): V3 => [Math.sin(rad(psi)) * Math.cos(rad(el)), Math.sin(rad(el)), -Math.cos(rad(psi)) * Math.cos(rad(el))];
/** screen point of a direction at infinity */
const atInf = (B: Basis, psi: number, el: number) => proj(B, add3(B.eye, mul3(dirW(psi, el), 1e8)));
/** sky colour bands keyed by elevation (deg, descending): a full-frame gradient that follows the camera's tilt */
const SkyGrad: React.FC<{B: Basis; stops: [number, string][]}> = ({B, stops}) => {
  const id = uid('wsky');
  const psi = camPsi(B);
  const ys = stops.map(([e]) => atInf(B, psi, e).y);
  const y0 = ys[0], y1 = ys[ys.length - 1];
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={y0} x2={0} y2={y1}>
          {stops.map(([, c], i) => <stop key={i} offset={clamp((ys[i] - y0) / (y1 - y0 || 1))} stopColor={c} />)}
        </linearGradient>
      </defs>
      <rect x={-320} y={-320} width={W + 640} height={H + 640} fill={`url(#${id})`} />
    </g>
  );
};
/** a soft screen-space glow (sun warmth, lamp light) */
const Glow: React.FC<{x: number; y: number; r: number; color: string; a: number; ry?: number}> = ({x, y, r, color, a, ry}) => {
  const id = uid('wglow');
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={r} gradientTransform={ry ? `translate(${x},${y}) scale(1,${ry / r}) translate(${-x},${-y})` : undefined}>
          <stop offset={0} stopColor={color} stopOpacity={a} />
          <stop offset={0.45} stopColor={color} stopOpacity={a * 0.45} />
          <stop offset={1} stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-320} y={-320} width={W + 640} height={H + 640} fill={`url(#${id})`} />
    </g>
  );
};
/** world y on a far vertical plane z = Z that appears at elevation el (deg) from eye height yRef */
const farY = (Z: number, el: number, yRef: number) => yRef + Math.abs(Z) * Math.tan(rad(el));
/** a far silhouette on the plane z = Z: elevation profile el(x) (deg), filled down to elevation elBot */
const ridge = (B: Basis, Z: number, yRef: number, el: (x: number) => number, elBot: number, stepDeg = 0.22) => {
  const [lo, hi] = spanX(B, Z, 320);
  let step = Math.abs(Z) * Math.tan(rad(stepDeg));
  step = Math.max(step, (hi - lo) / 220);
  const ks = lat(lo, hi, step);
  const pts = ks.map((k) => xy(proj(B, [k * step, farY(Z, el(k * step), yRef), Z])));
  const x0 = ks[0] * step, x1 = ks[ks.length - 1] * step;
  const b1 = xy(proj(B, [x1, farY(Z, elBot, yRef), Z])), b0 = xy(proj(B, [x0, farY(Z, elBot, yRef), Z]));
  return `${smoothOpen(pts)} L${P2(b1)} L${P2(b0)} Z`;
};
type Blob = {x: number; y: number; r: number; k: number; a?: number};
/** tree crowns along a far plane: round blobs whose tops follow el(x) */
const crowns = (B: Basis, Z: number, yRef: number, el: (x: number) => number, spacing: number, seed: number): Blob[] => {
  const [lo, hi] = spanX(B, Z, 320);
  const out: Blob[] = [];
  for (const k of lat(lo, hi, spacing)) {
    for (let row = 0; row < 2; row++) {
      const h0 = hash(k * 7.13 + seed + row * 31.7), h1 = hash(k * 3.71 + seed * 2.3 + row * 17.1);
      const x = (k + 0.5 * row + (h0 - 0.5) * 0.6) * spacing;
      const R = spacing * (row ? 0.36 + 0.36 * h1 : 0.46 + 0.5 * h1 * h1);
      const a = !row && h0 > 0.82 ? 1.5 : 1;
      const top = farY(Z, el(x), yRef) - (row ? 0.5 : 0) * R + (h0 - 0.5) * 0.6 * R + (a > 1 ? 0.8 * R : 0);
      const p = proj(B, [x, top - R * a, Z]);
      out.push({x: p.x, y: p.y, r: R * p.s, k: h0, a});
    }
  }
  return out;
};
const blobsPath = (bs: Blob[], sx = 1.06, sy = 0.94) =>
  bs.map((b) => {
    const rx = b.r * sx / (b.a ?? 1) ** 0.3, ry = b.r * sy * (b.a ?? 1);
    return `M${fx(b.x - rx)},${fx(b.y)} a${fx(rx)},${fx(ry)} 0 1,0 ${fx(2 * rx)},0 a${fx(rx)},${fx(ry)} 0 1,0 ${fx(-2 * rx)},0 Z`;
  }).join(' ');

/** soft cel-shaded cumulus: a cluster of puffs over a flat base, lit from the upper left. The shade layer is the same
 *  puffs pushed down and to the right, so the shade shows only along the lower and right edges (never as a rim on the
 *  lit side); the body sits on it nearly full size, nudged up-left, and the lit puffs inside the body. */
const Cloud: React.FC<{c: V2; s: number; seed: number; lit: string; body: string; shade: string; flat?: number}> = ({c, s, seed, lit, body, shade, flat = 0.55}) => {
  const puffs: Blob[] = [];
  const n = 5 + Math.floor(hash(seed) * 3);
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : i / (n - 1) - 0.5;
    const r = s * (0.32 + 0.3 * Math.sin(Math.PI * (u + 0.5)) * (0.7 + 0.6 * hash(seed + i * 1.7)));
    puffs.push({x: c.x + u * s * 1.9 + (hash(seed + i * 2.9) - 0.5) * s * 0.25, y: c.y - r * 0.55 + (hash(seed + i * 4.1) - 0.5) * s * 0.12, r, k: 0});
  }
  const base = `M${fx(c.x - s * 1.15)},${fx(c.y)} L${fx(c.x + s * 1.15)},${fx(c.y)} L${fx(c.x + s * 1.0)},${fx(c.y + s * 0.16)} L${fx(c.x - s * 1.0)},${fx(c.y + s * 0.16)} Z`;
  const shift = (k: number, dx: number, dy: number) => blobsPath(puffs.map((p) => ({...p, x: p.x + p.r * dx, y: p.y + p.r * dy, r: p.r * k})), 1, 1);
  return (
    <g transform={`translate(${fx(c.x)},${fx(c.y)}) scale(1,${flat * 1.6}) translate(${fx(-c.x)},${fx(-c.y)})`}>
      <path d={shift(1, 0.08, 0.14) + ' ' + base} fill={shade} />
      <path d={shift(0.98, -0.015, -0.03)} fill={body} />
      <path d={shift(0.68, -0.16, -0.2)} fill={lit} />
    </g>
  );
};
/** clouds on a far plane: lattice-placed, world-anchored, at elevations between elLo and elHi */
const CloudLayer: React.FC<{B: Basis; Z: number; yRef: number; spacing: number; elLo: number; elHi: number; size: number; seed: number; t: number; drift: number;
  lit: string; body: string; shade: string; keep?: number; flat?: number}> = ({B, Z, yRef, spacing, elLo, elHi, size, seed, t, drift, lit, body, shade, keep = 0.55, flat}) => {
  const [lo, hi] = spanX(B, Z, 600);
  const out: React.ReactNode[] = [];
  for (const k of lat(lo - spacing, hi + spacing, spacing)) {
    if (hash(k * 1.37 + seed) > keep) continue;
    const x = (k + (hash(k * 2.11 + seed) - 0.5) * 0.7) * spacing + drift * t;
    const el = lerp(elLo, elHi, hash(k * 5.3 + seed * 1.9));
    const p = proj(B, [x, farY(Z, el, yRef), Z]);
    const s = size * (0.6 + 0.6 * hash(k * 9.1 + seed)) * p.s;
    const fl = (flat ?? 0.55) * 1.6;
    if (p.x + 1.4 * s < -120 || p.x - 1.4 * s > W + 120 || p.y + 0.3 * s < -120 || p.y - 1.1 * s * fl > H + 120) continue;
    out.push(<Cloud key={k} c={{x: p.x, y: p.y}} s={s} seed={k * 13.1 + seed} lit={lit} body={body} shade={shade} flat={flat} />);
  }
  return <g>{out}</g>;
};

// ------------------------------------------------------------------ ground-plane vegetation
/** a tuft of blades (one path): base b (projected), height h cm, n blades */
const tuftPath = (b: SP, h: number, n: number, seed: number, sway: number, wcm = 0.85, spread = 1) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : i / (n - 1) - 0.5;
    const L = h * (0.55 + 0.45 * hash(seed + i * 3.1)) * b.s;
    const lean = (u * 1.05 + (hash(seed + i * 5.7) - 0.5) * 0.45) * spread + sway;
    const bx = b.x + u * wcm * 2.6 * b.s, by = b.y;
    const tx = bx + Math.sin(lean) * L, ty = by - Math.cos(lean) * L;
    const w = wcm * b.s * (0.7 + 0.5 * hash(seed + i * 1.3));
    const cx = bx + Math.sin(lean * 0.4) * L * 0.55, cy = by - Math.cos(lean * 0.4) * L * 0.55;
    d += `M${fx(bx - w)},${fx(by)} Q${fx(cx - w * 0.55)},${fx(cy)} ${fx(tx)},${fx(ty)} Q${fx(cx + w * 0.55)},${fx(cy)} ${fx(bx + w)},${fx(by)} Z `;
  }
  return d;
};
// ================================================================== FIELD (opening and loop)
/** the field: the bird flies 140 cm above a hilltop field; a post-and-wire fence runs along the flight line 150 cm
 *  behind it; beyond the field's brow the land falls away to a hazy valley, far hills and the morning sky. */
export const FIELD = {
  groundY: -140,
  fenceZ: -150,
  postGap: 260,
  /** a post that passes behind the bird at t = 0.5 s in the story's opening: the bird is at x = 0.5 V and the yaw-14
   *  camera sees the fence line (150 cm behind the bird) shifted by 150 tan(14 deg) toward -x */
  postX0: 0.5 * 200 - 150 * Math.tan((14 * Math.PI) / 180),
  postW: 12,
  /** post tops sit well below the bird's belly at the opening cameras (no tangent with the bird's silhouette) */
  postTop: -40,
  wires: [-55, -80, -105],
  browZ: -820,
  /** typical eye height of the opening cameras: far billboards are laid out by elevation from here */
  yRef: 115,
  /** the flight speed the posts' motion smear assumes (story V_FLY) */
  V: 200,
  /** the morning haze far things fade toward (pass to Flock as haze) */
  haze: '#EEF0E0',
};
const FIELD_A = 0.75;
const F_HAZE = FIELD.haze;
const FIELD_SKY: [number, string][] = [
  [8, '#86BEE0'],
  [0, '#9CCBE6'],
  [-3.5, '#BCDDED'],
  [-5.6, '#DDECEC'],
  [-6.6, '#EEF0E2'],
  [-7.4, '#F6E8CA'],
  [-12, '#F3E2C2'],
];
const fieldRidgeFar = (x: number) => -6.15 + 0.32 * noise1(x / 70000, 1) + 0.13 * noise1(x / 19000, 2);
const fieldRidgeNear = (x: number) => -6.75 + 0.26 * noise1(x / 31000, 3) + 0.1 * noise1(x / 8000, 4);
const fieldTrees = (x: number) => -7.32 + 0.16 * noise1(x / 5200, 5) + 0.05 * noise1(x / 1400, 6);

const FieldFar: React.FC<{B: Basis}> = ({B}) => {
  const yr = FIELD.yRef;
  const Zt = -50000;
  const cr = crowns(B, Zt, yr, fieldTrees, 380, 11);
  const hl = cr.filter((b) => b.k > 0.35).map((b) => ({...b, x: b.x - b.r * 0.28, y: b.y - b.r * 0.32, r: b.r * 0.55}));
  // the valley below the treeline: hazy fields with hedgerows, falling toward the brow
  const bands: [number, string][] = [[-7.62, '#A9C283'], [-8.05, '#C2CC8E'], [-8.6, '#9DBA79'], [-9.3, '#B6C887'], [-10.2, '#A3BE7E']];
  const Zv = -42000;
  return (
    <g>
      <path d={ridge(B, -400000, yr, fieldRidgeFar, -14)} fill={mix(C.hillFar, F_HAZE, 0.5)} />
      <path d={ridge(B, -150000, yr, fieldRidgeNear, -14)} fill={mix('#93B79A', F_HAZE, 0.36)} />
      <path d={ridge(B, Zt, yr, (x) => fieldTrees(x) - 0.3, -14)} fill={mix('#5F8C5C', F_HAZE, 0.3)} />
      <path d={blobsPath(cr)} fill={mix('#5F8C5C', F_HAZE, 0.3)} />
      <path d={blobsPath(hl)} fill={mix('#86AE72', F_HAZE, 0.3)} />
      <Valley B={B} Z={Zv} yRef={yr} tops={bands.map((b) => b[0])} cols={bands.map((b) => b[1])} haze={F_HAZE} k={0.38} hedge="#5C8655" />
    </g>
  );
};
/** hazy far fields below a treeline: bands of fields falling toward the viewer, edged with hedgerows */
const Valley: React.FC<{B: Basis; Z: number; yRef: number; tops: number[]; cols: string[]; haze: string; k: number; hedge: string; elBot?: number}> = ({B, Z, yRef, tops, cols, haze, k, hedge, elBot = -16}) => {
  const lit = mix(mix(hedge, '#C9D69A', 0.45), haze, k + 0.05);
  return (
    <g>
      {tops.map((e, i) => (
        <path key={i} d={ridge(B, Z + i * 1500, yRef, (x) => e + 0.07 * noise1(x / 4000, 20 + i), elBot)} fill={mix(cols[i % cols.length], haze, k)} />
      ))}
      {tops.map((e, i) => {
        // hedgerows along the field edges: chains of small overlapping crowns broken by gaps, each band with its own
        // rhythm and strength, a lighter top on the crowns like the treeline (never a dashed stroke)
        const h = hedgeRow(B, Z + i * 1500 - 300, yRef, (x) => e + 0.07 * noise1(x / 4000, 20 + i), 31 + i * 7.7);
        if (!h.body.length) return null;
        return (
          <g key={`h${i}`} opacity={0.42 + 0.3 * hash(i * 9.1 + 5)}>
            <path d={blobsPath(h.body, 1.25, 0.78)} fill={mix(hedge, haze, k + 0.05)} />
            <path d={blobsPath(h.hl, 1.2, 0.7)} fill={lit} />
          </g>
        );
      })}
    </g>
  );
};
/** a hedgerow on a far plane along an elevation profile: overlapping crowns (world radius 55-90 cm) in runs with gaps */
const hedgeRow = (B: Basis, Z: number, yRef: number, el: (x: number) => number, seed: number): {body: Blob[]; hl: Blob[]} => {
  const [lo, hi] = spanX(B, Z, 160);
  const sp = 95, run = 1500;
  const body: Blob[] = [];
  for (const k of lat(lo, hi, sp, 420)) {
    const x = k * sp + (hash(k * 1.7 + seed) - 0.5) * sp * 0.45;
    // hedge or gap: a run cell of about 15 m (its edges jittered by slow noise), 35% of the cells are gaps
    const rc = Math.floor((x + 500 * noise1(x / 1100, seed)) / run);
    if (hash(rc * 3.31 + seed * 1.13) < 0.35) continue;
    const R = 55 + 35 * hash(k * 2.9 + seed);
    const p = proj(B, [x, farY(Z, el(x), yRef) + R * (0.3 + 0.25 * hash(k * 4.3 + seed)), Z]);
    body.push({x: p.x, y: p.y, r: R * p.s, k: hash(k * 5.1 + seed)});
  }
  const hl = body.filter((b) => b.k > 0.3).map((b) => ({...b, x: b.x - b.r * 0.22, y: b.y - b.r * 0.3, r: b.r * 0.55}));
  return {body, hl};
};

/** the field itself, from the frame's bottom to the brow: grass with tufts, the brow silhouetted against the valley */
const FieldGround: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const Y = FIELD.groundY, Zb = FIELD.browZ;
  const [lo, hi] = spanX(B, Zb, 300);
  const step = 14;
  const browY = (x: number) => Y + 2.5 * noise1(x / 160, 7);
  const brow = lat(lo, hi, step).map((k) => xy(proj(B, [k * step, browY(k * step), Zb])));
  const yb = brow.reduce((a, p) => a + p.y, 0) / Math.max(1, brow.length);
  const id = uid('wfg');
  const ground = poly([...brow, {x: brow[brow.length - 1].x, y: H + 600}, {x: brow[0].x, y: H + 600}]);
  // tufts in rows from the brow toward the camera
  const tufts: React.ReactNode[] = [];
  const rows: number[] = [];
  for (let z = Zb + 30; z <= -380; z += 46) rows.push(z);
  rows.forEach((z, ri) => {
    const [a, b] = spanX(B, z, 160);
    const near = (z - Zb) / (-380 - Zb);
    lat(a, b, 30).forEach((k) => {
      const sd = k * 3.17 + ri * 51.3;
      const x = k * 30 + (hash(sd) - 0.5) * 34;
      const zz = z + (hash(sd + 2) - 0.5) * 46;
      // clumps and bare patches: a slow 2D noise over the field gates the tufts and sizes them (0.6 .. 1.4)
      const dens = 0.5 + 0.5 * (0.65 * noise1(x / 170 + zz / 410, 13) + 0.35 * noise1(zz / 95 - x / 260, 14));
      if (hash(sd + 1) > 0.05 + 0.95 * dens) return;
      const bp = proj(B, [x, Y, zz]);
      if (bp.y < -200 || bp.y > H + 700 || bp.x < -300 || bp.x > W + 300) return;
      const sc = 0.6 + 0.8 * clamp(0.25 * hash(sd + 6) + 0.95 * dens - 0.1);
      const h = (10 + 16 * hash(sd + 5)) * sc;
      const col = mix(hash(sd + 9) > 0.5 ? '#5E8F44' : '#76A04E', '#B9CB86', 0.55 * (1 - near));
      tufts.push(<path key={`${ri}_${k}`} d={tuftPath(bp, h, 4 + Math.floor(hash(sd + 3) * 3 + 2 * sc), sd, 0.07 * Math.sin(t * 1.9 + x * 0.031 + z * 0.02), 0.85 * sc)} fill={col} />);
    });
  });
  // the brow: taller grass, seed heads and a few flowers against the valley haze
  const browT: string[] = [];
  const seeds: string[] = [];
  const flowers: React.ReactNode[] = [];
  lat(lo, hi, 9).forEach((k) => {
    const sd = k * 5.31 + 0.7;
    const x = k * 9 + (hash(sd) - 0.5) * 8;
    // the brow's grass grows in clumps with low gaps between them (slow noise), not as an even fringe
    const dens = 0.5 + 0.5 * (0.7 * noise1(x / 48, 17) + 0.3 * noise1(x / 13, 18));
    if (hash(sd + 3.3) > 0.18 + 0.95 * dens) return;
    const bp = proj(B, [x, browY(x) - 1, Zb + 3 + 14 * hash(sd + 1)]);
    const h = (7 + 22 * hash(sd + 2) ** 1.6) * (0.5 + 0.95 * dens);
    const sw = 0.08 * Math.sin(t * 2.1 + x * 0.05);
    browT.push(tuftPath(bp, h, 4 + Math.floor(hash(sd + 4) * 3), sd, sw, 0.55));
    if (hash(sd + 7) > 0.62) {
      // a seed-head stalk
      const L = (h + 8) * bp.s, lean = (hash(sd + 8) - 0.5) * 0.5 + sw;
      const tx = bp.x + Math.sin(lean) * L, ty = bp.y - Math.cos(lean) * L;
      seeds.push(`M${fx(bp.x)},${fx(bp.y)} Q${fx(bp.x + Math.sin(lean * 0.5) * L * 0.5)},${fx(bp.y - L * 0.55)} ${fx(tx)},${fx(ty)}`);
      flowers.push(<ellipse key={`s${k}`} cx={tx} cy={ty} rx={0.45 * bp.s} ry={1.5 * bp.s} transform={`rotate(${fx(deg(lean))},${fx(tx)},${fx(ty)})`} fill="#CDBB86" />);
    } else if (hash(sd + 11) > 0.84) {
      const L = (h * 0.8) * bp.s;
      const fxp = bp.x + (hash(sd + 12) - 0.5) * 4 * bp.s, fyp = bp.y - L;
      flowers.push(
        <g key={`f${k}`}>
          <path d={`M${fx(fxp)},${fx(bp.y)} L${fx(fxp)},${fx(fyp)}`} stroke="#6E8F4C" strokeWidth={Math.max(1, 0.35 * bp.s)} />
          <circle cx={fxp} cy={fyp} r={1.5 * bp.s} fill={hash(sd + 13) > 0.5 ? '#FFF8E8' : '#F2CC52'} />
          <circle cx={fxp} cy={fyp} r={0.55 * bp.s} fill="#E7B23C" />
        </g>,
      );
    }
  });
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={yb - 10} x2={0} y2={H + 100}>
          <stop offset={0} stopColor="#BFCF8C" />
          <stop offset={0.12} stopColor="#A6C474" />
          <stop offset={0.55} stopColor="#86AE5C" />
          <stop offset={1} stopColor="#6C9A4C" />
        </linearGradient>
      </defs>
      <path d={ground} fill={`url(#${id})`} />
      {tufts}
      <path d={browT.join(' ')} fill="#7FA055" />
      <path d={seeds.join(' ')} fill="none" stroke="#9AA466" strokeWidth={Math.max(1, 0.22 * proj(B, [0, Y, Zb]).s)} />
      {flowers}
    </g>
  );
};

/** one weathered fence post at x (a square post, its front, near side and top visible) */
const postGeo = (B: Basis, x: number, seed: number) => {
  const Z = FIELD.fenceZ;
  const w = (FIELD.postW / 2) * (0.88 + 0.24 * hash(seed));
  const top = FIELD.postTop + 7 * (hash(seed + 1) - 0.5);
  const yb = FIELD.groundY - 10;
  const x0 = x - w, x1 = x + w, z0 = Z - w, z1 = Z + w;
  const sx = B.eye[0] > x ? x1 : x0;
  const tf = top - 1.6, tb = top + 1.6; // the top is cut sloping toward the front
  const P = (p: V3) => xy(proj(B, p));
  const front = [P([x0, yb, z1]), P([x1, yb, z1]), P([x1, tf, z1]), P([x0, tf, z1])];
  const side = [P([sx, yb, z1]), P([sx, yb, z0]), P([sx, tb, z0]), P([sx, tf, z1])];
  const topF = [P([x0, tf, z1]), P([x1, tf, z1]), P([x1, tb, z0]), P([x0, tb, z0])];
  return {front, side, topF, w, top: tf, x0, x1, z1, sx};
};
const Post: React.FC<{B: Basis; x: number; seed: number; inkA?: number}> = ({B, x, seed, inkA = 1}) => {
  const g = postGeo(B, x, seed);
  const sil = poly(hullPts([...g.front, ...g.side, ...g.topF]));
  const P = (p: V3) => xy(proj(B, p));
  const grains: string[] = [];
  for (let i = 0; i < 4; i++) {
    const u = 0.18 + 0.2 * i + (hash(seed + i * 3.3) - 0.5) * 0.08;
    const xx = lerp(g.x0, g.x1, u);
    const pts: V2[] = [];
    for (let j = 0; j < 5; j++) pts.push(P([xx + 0.5 * noise1(j * 0.8 + i * 3, seed), g.top - 3 - j * (18 + 6 * hash(seed + i)), g.z1 + 0.05]));
    grains.push(smoothOpen(pts));
  }
  const knot = P([lerp(g.x0, g.x1, 0.35 + 0.3 * hash(seed + 7)), g.top - 30 - 25 * hash(seed + 8), g.z1]);
  const s = proj(B, [x, g.top, g.z1]).s;
  const crack = [P([lerp(g.x0, g.x1, 0.6), g.top - 0.2, g.z1]), P([lerp(g.x0, g.x1, 0.66), g.top - 6, g.z1]), P([lerp(g.x0, g.x1, 0.62), g.top - 11, g.z1])];
  const id = uid('wpost');
  const fr = g.front;
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={fr[3].x} y1={fr[3].y} x2={fr[2].x} y2={fr[3].y}>
          <stop offset={0} stopColor="#A5845F" />
          <stop offset={0.5} stopColor="#937252" />
          <stop offset={1} stopColor="#7E6046" />
        </linearGradient>
      </defs>
      <path d={sil} fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" vectorEffect={NS} opacity={inkA} />
      <path d={poly(g.front)} fill={`url(#${id})`} />
      <path d={poly(g.side)} fill="#5F4733" />
      <path d={poly(g.topF)} fill="#C2A27A" />
      <path d={grains.join(' ')} fill="none" stroke="#5E452F" strokeWidth={LINE_PX} opacity={0.55} vectorEffect={NS} />
      <path d={smoothOpen(crack)} fill="none" stroke="#4A3524" strokeWidth={LINE_PX} opacity={0.7} vectorEffect={NS} />
      <ellipse cx={knot.x} cy={knot.y} rx={1.3 * s} ry={2.1 * s} fill="#6B4E36" stroke="#4A3524" strokeWidth={1} opacity={0.8} vectorEffect={NS} />
      <path d={poly([fr[2], fr[1]])} stroke={INK} strokeWidth={LINE_PX} opacity={0.35} vectorEffect={NS} />
    </g>
  );
};
const hullPts = (pts: V2[]): V2[] => {
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  if (p.length < 3) return p;
  const cr = (o: V2, a: V2, b: V2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V2[] = [], up: V2[] = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
/** the post-and-wire fence along the flight line. defocus = the depth-of-field blur (px across); the posts also
 *  carry a horizontal motion smear (the camera tracks the bird at FIELD.V; a 180-degree shutter) */
const Fence: React.FC<{B: Basis; defocus: number}> = ({B, defocus}) => {
  const {fenceZ: Z, postGap: G, postX0: X0, wires} = FIELD;
  const [lo, hi] = spanX(B, Z, 260);
  const k0 = Math.ceil((lo - X0) / G) - 1, k1 = Math.floor((hi - X0) / G) + 1;
  const ks: number[] = [];
  for (let k = k0; k <= k1 && ks.length < 40; k++) ks.push(k);
  const zw = Z + FIELD.postW / 2 + 0.6;
  const wirePaths = wires.map((wy, wi) => {
    const pts: V2[] = [];
    ks.forEach((k, i) => {
      if (i === ks.length - 1) {
        pts.push(xy(proj(B, [X0 + k * G, wy, zw])));
        return;
      }
      for (let j = 0; j < 8; j++) {
        const u = j / 8;
        pts.push(xy(proj(B, [X0 + (k + u) * G, wy - (2.2 + 0.6 * wi) * 4 * u * (1 - u), zw])));
      }
    });
    return smoothOpen(pts);
  });
  const staples = ks.flatMap((k) => wires.map((wy) => proj(B, [X0 + k * G, wy, zw])));
  // blur: depth of field everywhere; the posts and staples add the shutter smear along x (a box of smear px ~ a
  // gaussian of 0.29 smear)
  const sdD = Math.round(Math.min(defocus, 90) * 2) / 4;
  const sx = proj(B, [(lo + hi) / 2, -90, Z]).s;
  const smear = FIELD.V * (1 / 60) * sx;
  const sdX = Math.round(Math.hypot(sdD, 0.29 * smear) * 4) / 4;
  // a smeared post has no crisp edge left anywhere: its horizontal top and the ink above it get a vertical blur too,
  // and the ink silhouette fades with the smear (it would otherwise survive as a dark hairline over the post's top)
  const sdY = Math.round(Math.max(sdD, 0.3 * sdX, 1.5) * 4) / 4;
  const inkA = 1 - 0.8 * clamp(smear / 40);
  const idW = uid('wfw'), idP = uid('wfp');
  const filt = (id: string, a: number, b: number) => (
    <filter id={id} filterUnits="userSpaceOnUse" x={-320} y={-320} width={W + 640} height={H + 640} colorInterpolationFilters="sRGB">
      <feGaussianBlur stdDeviation={`${a} ${b}`} />
    </filter>
  );
  const wireOn = sdD >= 0.35;
  return (
    <g>
      <defs>
        {wireOn && filt(idW, sdD, sdD)}
        {filt(idP, sdX, sdY)}
      </defs>
      <g filter={`url(#${idP})`}>
        {ks.map((k) => <Post key={k} B={B} x={X0 + k * G} seed={k * 17.3 + 4} inkA={inkA} />)}
      </g>
      {/* the wires run across the posts' front faces, so they are drawn over the posts, and the staples over the wires */}
      <g filter={wireOn ? `url(#${idW})` : undefined}>
        {wirePaths.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="#3B4247" strokeWidth={1.8} vectorEffect={NS} opacity={0.85} />
            <path d={d} fill="none" stroke="#E7EDEF" strokeWidth={0.7} vectorEffect={NS} opacity={0.55} transform="translate(0,-0.8)" />
          </g>
        ))}
      </g>
      <g filter={`url(#${idP})`}>
        {staples.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={Math.max(1.2, 0.7 * p.s)} fill="#3B4247" />)}
      </g>
    </g>
  );
};

export const FieldBack: React.FC<Env> = ({B, t}) => {
  const [lo, hi] = spanX(B, FIELD.browZ, 0);
  const browD = depth(B, [(lo + hi) / 2, FIELD.groundY, FIELD.browZ]);
  const [plo, phi] = spanX(B, FIELD.fenceZ, 0);
  const postD = depth(B, [(plo + phi) / 2, -90, FIELD.fenceZ]);
  const psi = camPsi(B);
  const sun = atInf(B, psi - 30, 10);
  return (
    <g>
      <SkyGrad B={B} stops={FIELD_SKY} />
      <Glow x={clamp(sun.x, -900, 200)} y={clamp(sun.y, -900, 200)} r={1700} color="#FFF0CF" a={0.75} />
      <Soft px={coc(B, 3e5, FIELD_A) * 1.6}>
        <CloudLayer B={B} Z={-300000} yRef={FIELD.yRef} spacing={36000} elLo={-2.2} elHi={-4.9} size={7000} seed={3} t={t} drift={300} lit="#FFFDF6" body="#F4F6F2" shade="#DCE6EA" keep={0.6} flat={0.4} />
      </Soft>
      <Soft px={coc(B, 6e4, FIELD_A)}>
        <FieldFar B={B} />
      </Soft>
      <Soft px={coc(B, browD, FIELD_A)}>
        <FieldGround B={B} t={t} />
      </Soft>
      <Fence B={B} defocus={coc(B, postD, FIELD_A) * 0.8} />
    </g>
  );
};
/** in front of the bird: only a faint morning glow from the upper left (no props cross the bird) */
export const FieldFront: React.FC<Env> = () => <Glow x={-220} y={-260} r={1250} color="#FFF3D8" a={0.22} />;

// ================================================================== LAB (construction and close drive)
/** the lab: a clean bench (top at CRADLE.benchY under the bird at the origin), a pale wall with a pegboard holding a few
 *  hand tools, a small desk lamp, a cutting mat under the cradle. Soft cool light from the upper left. */
export const LABSET = {
  benchY: CRADLE.benchY,
  wallZ: -72,
  frontZ: 34,
  benchX: [-190, 190] as [number, number],
  peg: {x0: -150, x1: 92, y0: -9, y1: 80},
  mat: {x0: -36, x1: 34, z0: -30, z1: 22},
  /** an architect-style desk lamp at the bench's far left: its base and lower arm stand outside every lab framing, the
   *  upper arm reaches in from the upper left and the head hangs above and to the left of the bird, aimed down at the
   *  mat. Placed against the story's lab cameras: the head (and shade) stays 85+ px clear of the lifted shell through
   *  the exploded view and the schematic (6.3-8.6 s), and it is in frame, below the caption band, at the wide framing
   *  (t = 5.0-5.25). shadeL / shadeR: the shade's length along its axis and its rim radius (cm). */
  lamp: {base: [-100, CRADLE.benchY, -56] as V3, elbow: [-90, 40, -60] as V3, head: [-51, 28, -44] as V3, aim: [-30, CRADLE.benchY, -10] as V3, shadeL: 7.5, shadeR: 5.0},
};
const LAB_A = 1.5;
/** a larger, stylised aperture for the wall and pegboard alone: soft bokeh behind the bird from the wide framing to the
 *  close drive (a gaussian of about 9-10 px at the wide and match framings, like the field's bokeh at the match cut),
 *  so the board reads as soft texture, never a dot grid */
const LAB_WALL_A = 9;
/** the lamp stands about 40 cm behind the bird: a little softer than the bench, much crisper than the wall */
const LAB_LAMP_A = 3.5;
const BY = CRADLE.benchY;

const Wall: React.FC<{B: Basis}> = ({B}) => {
  const Z = LABSET.wallZ;
  const id = uid('wwall');
  const top = xy(proj(B, [0, 160, Z])), bot = xy(proj(B, [0, BY, Z]));
  const lit = xy(proj(B, [-120, 120, Z]));
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={top.y} x2={0} y2={bot.y}>
          <stop offset={0} stopColor="#DCE5EA" />
          <stop offset={0.7} stopColor="#D2DCE2" />
          <stop offset={1} stopColor="#BCC9D1" />
        </linearGradient>
      </defs>
      <path d={quadZ(B, Z, -600, 600, BY, 400)} fill={`url(#${id})`} />
      <Glow x={lit.x} y={lit.y} r={Math.max(300, 160 * proj(B, [-120, 120, Z]).s)} color="#F4F8FA" a={0.7} />
      {/* backsplash strip */}
      <path d={quadZ(B, Z + 0.3, -600, 600, BY, BY + 4)} fill="#C9D3D9" />
      <path d={quadZ(B, Z + 0.3, -600, 600, BY + 4, BY + 4.5)} fill="#EEF3F5" />
    </g>
  );
};
const Pegboard: React.FC<{B: Basis}> = ({B}) => {
  const {x0, x1, y0, y1} = LABSET.peg;
  const Z = LABSET.wallZ + 1.6;
  const pid = uid('wpeg');
  const o: V3 = [(x0 + x1) / 2, (y0 + y1) / 2, Z];
  const m = planeMatrix(B, o, [1, 0, 0], [0, -1, 0]);
  const sp = 2.54;
  const frame = 1.8;
  return (
    <g>
      <defs>
        <pattern id={pid} patternUnits="userSpaceOnUse" width={sp} height={sp} patternTransform={`${m} translate(${-o[0] % sp},${o[1] % sp})`}>
          <circle cx={sp / 2} cy={sp / 2} r={0.27} fill="#C6D0D5" />
        </pattern>
      </defs>
      {/* shadow of the panel on the wall */}
      <path d={quadZ(B, LABSET.wallZ + 0.1, x0 + 1.2, x1 + 1.2, y0 - 1.6, y1 - 1.6)} fill="#AEBCC5" opacity={0.6} />
      <path d={quadZ(B, Z, x0, x1, y0, y1)} fill="#C9D2D6" />
      <path d={quadZ(B, Z, x0 + frame, x1 - frame, y0 + frame, y1 - frame)} fill="#E4E9EA" />
      <path d={quadZ(B, Z, x0 + frame, x1 - frame, y0 + frame, y1 - frame)} fill={`url(#${pid})`} />
      <Tools B={B} Z={Z + 0.4} />
    </g>
  );
};
/** small precision hand tools hung on the pegboard, drawn flat in the board's plane (local cm, b down). Checked against
 *  the story's lab cameras, the board has one strip where a tool is always whole and clear: a short row hung at
 *  y = 23-24 cm between x = -51 and -36 cm. There the tools sit below the caption band at the wide framing (5.0-5.25 s),
 *  70+ px above the lifted shell through the exploded view, 60+ px from the lamp, and never at a frame edge. So the
 *  set is three short tools (8 cm or less) in that row; the rest of the board is bare (a tool
 *  anywhere else would be half-cropped by a frame edge, sit behind the bird or the lifted shell, or behind a caption). */
export const TOOLS = {
  /** a precision screwdriver: hook x, handle colour, handle and shaft length (cm) */
  driver: [-49.5, '#E0A43A', 4.6, 3.6] as [number, string, number, number],
  /** a small pair of needle-nose pliers (8 cm) */
  pliers: [-43.5, 23] as [number, number],
  /** a small roll of tape on its hook (radius 3.1 cm) */
  tape: [-37, 21.5] as [number, number],
  y: 23,
};
const Tools: React.FC<{B: Basis; Z: number}> = ({B, Z}) => {
  const at = (x: number, y: number) => planeMatrix(B, [x, y, Z], [1, 0, 0], [0, -1, 0]);
  const sw = {stroke: '#2E3D48', strokeWidth: 1.2, vectorEffect: NS, strokeLinejoin: 'round' as const};
  const shadow = (k: string, d: string, tr: string) => <path key={k} d={d} transform={`${tr} translate(0.6,0.8)`} fill="#7D8C95" opacity={0.32} />;
  const T = TOOLS;
  const [dx, dcol, hl, sl] = T.driver;
  // needle-nose pliers hung by the pivot: slim jaws up, red grips spreading down (8 cm in all)
  const jaws = 'M-0.22,-2.4 L0.22,-2.4 L0.7,0.2 L-0.7,0.2 Z';
  const gripL = 'M-0.45,0.5 Q-1.2,2.8 -1.55,5.6 L-0.72,5.7 Q-0.5,3.1 0.05,1.0 Z', gripR = 'M0.45,0.5 Q1.2,2.8 1.55,5.6 L0.72,5.7 Q0.5,3.1 -0.05,1.0 Z';
  const driver = `M-0.75,0.5 L0.75,0.5 L0.75,${fx(0.5 + hl)} L-0.75,${fx(0.5 + hl)} Z`;
  return (
    <g opacity={0.88}>
      {/* a precision screwdriver hung by its cap */}
      {shadow('s0', `${driver} M-0.17,${fx(0.5 + hl)} L0.17,${fx(0.5 + hl)} L0.17,${fx(0.5 + hl + sl)} L-0.17,${fx(0.5 + hl + sl)} Z`, at(dx, T.y))}
      <g transform={at(dx, T.y)}>
        <rect x={-0.75} y={0.5} width={1.5} height={hl} rx={0.6} fill={dcol} {...sw} />
        <rect x={-0.45} y={1.1} width={0.32} height={hl - 1.2} rx={0.15} fill="#FFFFFF" opacity={0.45} />
        <rect x={-0.17} y={0.5 + hl} width={0.34} height={sl} fill={C.steel} {...sw} />
        <circle cx={0} cy={0.35} r={0.45} fill={C.steelDeep} />
      </g>
      {/* small pliers */}
      {shadow('s1', `${jaws} ${gripL} ${gripR}`, at(T.pliers[0], T.pliers[1] - 2.6))}
      <g transform={at(T.pliers[0], T.pliers[1] - 2.6)}>
        <path d={jaws} fill={C.steel} {...sw} />
        <path d={gripL} fill="#C2564A" {...sw} />
        <path d={gripR} fill="#C2564A" {...sw} />
        <circle cx={0} cy={0.35} r={0.42} fill={C.steelDeep} />
      </g>
      {/* a small roll of tape hanging on its hook through the core */}
      <g transform={at(T.tape[0], T.tape[1])}>
        <circle cx={0.6} cy={2.3} r={3.1} fill="#7D8C95" opacity={0.3} />
        <circle cx={0} cy={1.5} r={3.1} fill="#E9E4D6" {...sw} />
        <circle cx={0} cy={1.5} r={1.5} fill="#C9D2D6" {...sw} />
        <circle cx={-1.1} cy={0.4} r={0.7} fill="#FFFFFF" opacity={0.45} />
      </g>
    </g>
  );
};
const Lamp: React.FC<{B: Basis}> = ({B}) => {
  const {base, elbow, head, aim, shadeL, shadeR} = LABSET.lamp;
  const P = (p: V3) => proj(B, p);
  const ring = (c: V3, r: number, U: V3, V: V3, n = 24) => {
    const out: V2[] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      out.push(xy(P(add3(c, add3(mul3(U, r * Math.cos(a)), mul3(V, r * Math.sin(a)))))));
    }
    return out;
  };
  const bTop: V3 = [base[0], BY + 1.8, base[2]];
  const baseTop = ring(bTop, 7.5, [1, 0, 0], [0, 0, 1]);
  const baseBot = ring(base, 7.8, [1, 0, 0], [0, 0, 1]);
  const pivot: V3 = [base[0] + 1, BY + 4.2, base[2] - 1];
  const ax = norm3(sub3(aim, head));
  const U = norm3(cross3(ax, UP)), V = norm3(cross3(ax, U));
  const rimC = add3(head, mul3(ax, shadeL));
  const rim = ring(rimC, shadeR, U, V, 20);
  const back = ring(add3(head, mul3(ax, -1.1)), 2.1, U, V, 12);
  const shade = hullPts([...rim, ...back]);
  const open = dot3(sub3(B.eye, rimC), ax) > 0;
  const arm = (a: V3, b: V3, r: number) => {
    const pa = P(a), pb = P(b);
    return capsule(pa, pb, r * pa.s, r * pb.s);
  };
  const joint = (p: V3, r: number, k: string) => {
    const q = P(p);
    return <circle key={k} cx={q.x} cy={q.y} r={r * q.s} fill="#56616B" stroke={INK} strokeWidth={1.2} vectorEffect={NS} />;
  };
  if (!visible([P(base), P(elbow), P(head), P(rimC)], 900)) return null;
  // each arm is a parallel pair (an architect lamp's linkage): the main bar and a thin bar beside it
  const off1: V3 = [1.7, 0, 0], off2: V3 = [0, -1.7, 0];
  const id = uid('wlamp');
  const hp = P(head), rp = P(rimC);
  const armSty = {fill: '#E9EEF1', stroke: INK, strokeWidth: 1.5, vectorEffect: NS};
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={hp.x - 40} y1={hp.y - 40} x2={rp.x + 30} y2={rp.y + 40}>
          <stop offset={0} stopColor="#F2F6F8" />
          <stop offset={0.55} stopColor="#D6DEE3" />
          <stop offset={1} stopColor="#AEBBC4" />
        </linearGradient>
      </defs>
      <path d={poly(hullPts([...baseTop, ...baseBot]))} fill="#9AA6AE" stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      <path d={smoothClosed(baseTop)} fill="#E8EDF0" />
      <path d={arm(add3(pivot, off1), add3(elbow, off1), 0.3)} {...armSty} fill="#C9D2D8" />
      <path d={arm(pivot, elbow, 0.62)} {...armSty} />
      <path d={arm(add3(elbow, off2), add3(head, off2), 0.28)} {...armSty} fill="#C9D2D8" />
      <path d={arm(elbow, head, 0.58)} {...armSty} />
      {joint(pivot, 1.3, 'j0')}
      {joint(elbow, 1.25, 'j1')}
      <path d={poly(shade)} fill={`url(#${id})`} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" vectorEffect={NS} />
      {/* the opening: a soft warm white, not a hard white disc */}
      {open && <path d={smoothClosed(rim)} fill="#FBF3E0" stroke="#D9CCB0" strokeWidth={1.2} vectorEffect={NS} />}
      {joint(head, 1.35, 'j2')}
    </g>
  );
};
/** tapered capsule between two screen circles (as three.capsule2, local copy for tight radii) */
const capsule = (a: V2, b: V2, ra: number, rb: number) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1e-3;
  const nx = -dy / L, ny = dx / L;
  // both end caps bulge outward (sweep-flag 0 in SVG's y-down space)
  return `M${fx(a.x + nx * ra)},${fx(a.y + ny * ra)} L${fx(b.x + nx * rb)},${fx(b.y + ny * rb)} A${fx(rb)},${fx(rb)} 0 0,0 ${fx(b.x - nx * rb)},${fx(b.y - ny * rb)} L${fx(a.x - nx * ra)},${fx(a.y - ny * ra)} A${fx(ra)},${fx(ra)} 0 0,0 ${fx(a.x + nx * ra)},${fx(a.y + ny * ra)} Z`;
};
const Bench: React.FC<{B: Basis}> = ({B}) => {
  const [x0, x1] = LABSET.benchX;
  const {wallZ: zb, frontZ: zf, mat} = LABSET;
  const id = uid('wbench');
  const back = xy(proj(B, [0, BY, zb])), front = xy(proj(B, [0, BY, zf]));
  const grid: string[] = [];
  const gy = BY + 0.32;
  for (let x = mat.x0 + 2; x < mat.x1 - 1; x += 2.5) grid.push(poly(projPoly(B, [[x, gy, mat.z0 + 2], [x, gy, mat.z1 - 2]]), false));
  for (let z = mat.z0 + 2; z < mat.z1 - 1; z += 2.5) grid.push(poly(projPoly(B, [[mat.x0 + 2, gy, z], [mat.x1 - 2, gy, z]]), false));
  const major: string[] = [];
  for (let x = mat.x0 + 2; x < mat.x1 - 1; x += 10) major.push(poly(projPoly(B, [[x, gy, mat.z0 + 2], [x, gy, mat.z1 - 2]]), false));
  for (let z = mat.z0 + 2; z < mat.z1 - 1; z += 10) major.push(poly(projPoly(B, [[mat.x0 + 2, gy, z], [mat.x1 - 2, gy, z]]), false));
  const sid = uid('wshd'), pid = uid('wpool');
  return (
    <g>
      <defs>
        <radialGradient id={pid}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.45} />
          <stop offset={0.5} stopColor="#F6FBFF" stopOpacity={0.2} />
          <stop offset={1} stopColor="#F6FBFF" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={back.x - 200} y1={back.y} x2={front.x + 200} y2={front.y}>
          <stop offset={0} stopColor="#E3D7C2" />
          <stop offset={1} stopColor="#CDBC9F" />
        </linearGradient>
        <radialGradient id={sid}>
          <stop offset={0} stopColor="#24333D" stopOpacity={0.32} />
          <stop offset={0.6} stopColor="#24333D" stopOpacity={0.14} />
          <stop offset={1} stopColor="#24333D" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* drawer cabinets under the bench, the front edge, the top */}
      <path d={quadZ(B, zf - 3, x0, x1, BY - 90, BY - 3.6)} fill="#A9B6BE" />
      <path d={[-150, -90, -30, 30, 90, 150].map((x) => poly(projPoly(B, [[x, BY - 4, zf - 2.9], [x, BY - 90, zf - 2.9]]), false)).join(' ') + ' ' + [-22, -40].map((y) => poly(projPoly(B, [[x0, BY + y, zf - 2.9], [x1, BY + y, zf - 2.9]]), false)).join(' ')}
        stroke="#7E8D97" strokeWidth={2} vectorEffect={NS} />
      {[-120, -60, 0, 60, 120].map((x) => [-13, -31].map((y) => {
        const a = proj(B, [x - 6, BY + y, zf - 2.6]), b = proj(B, [x + 6, BY + y, zf - 2.6]);
        return <path key={`${x}_${y}`} d={`M${P2(a)} L${P2(b)}`} stroke="#E6ECEF" strokeWidth={Math.max(1.5, 1.4 * a.s)} strokeLinecap="round" />;
      }))}
      <path d={quadZ(B, zf - 2.8, x0, x1, BY - 9, BY - 3.6)} fill="#6F7E88" opacity={0.55} />
      <path d={quadZ(B, zf, x0, x1, BY - 3.6, BY)} fill="#A8987C" />
      <path d={quadY(B, BY, x0, x1, zb, zf)} fill={`url(#${id})`} />
      <path d={poly(projPoly(B, [[x0, BY, zf], [x1, BY, zf]]), false)} stroke="#F4EDE0" strokeWidth={1.6} vectorEffect={NS} opacity={0.9} />
      {/* contact shadow along the wall */}
      <path d={quadY(B, BY + 0.05, x0, x1, zb, zb + 5)} fill="#9E9078" opacity={0.35} />
      {/* the cutting mat */}
      <path d={quadY(B, BY + 0.2, mat.x0, mat.x1, mat.z0, mat.z1)} fill="#2F6E5C" />
      <path d={quadY(B, BY + 0.28, mat.x0 + 0.6, mat.x1 - 0.6, mat.z0 + 0.6, mat.z1 - 0.6)} fill="#3E8A72" />
      <path d={grid.join(' ')} fill="none" stroke="#CFEBDD" strokeWidth={0.8} opacity={0.32} vectorEffect={NS} />
      <path d={major.join(' ')} fill="none" stroke="#E4F5EC" strokeWidth={1.3} opacity={0.42} vectorEffect={NS} />
      {/* the lamp's light pool */}
      <g transform={planeMatrix(B, add3(LABSET.lamp.aim, [0, 0.4, 0]), [1, 0, 0], [0, 0, 1])}>
        <ellipse cx={0} cy={0} rx={34} ry={30} fill={`url(#${pid})`} />
      </g>
      {/* the bird's and cradle's soft shadow on the mat (the bird sits at the origin in every lab shot) */}
      <g transform={planeMatrix(B, [-1, BY + 0.35, -3], [1, 0, 0], [0, 0, 1])}>
        <ellipse cx={0} cy={0} rx={24} ry={11} fill={`url(#${sid})`} />
      </g>
    </g>
  );
};
export const LabBack: React.FC<Env> = ({B}) => {
  const wallD = depth(B, [B.eye[0] * 0.3, 20, LABSET.wallZ]);
  const lampD = depth(B, LABSET.lamp.head);
  const benchD = depth(B, [0, BY, -28]);
  return (
    <g>
      <rect x={-320} y={-320} width={W + 640} height={H + 640} fill="#D3DCE1" />
      <Soft px={coc(B, wallD, LAB_WALL_A)}>
        <Wall B={B} />
        <Pegboard B={B} />
      </Soft>
      <Soft px={Math.max(coc(B, benchD, LAB_A), 0.8 * coc(B, depth(B, [0, BY, 20]), LAB_A))}>
        <Bench B={B} />
      </Soft>
      <Soft px={coc(B, lampD, LAB_LAMP_A)}>
        <Lamp B={B} />
      </Soft>
      <Vignette color="#33424D" a={0.22} />
    </g>
  );
};
/** a soft darkening toward the frame's corners (screen space, behind the subject) */
const Vignette: React.FC<{color: string; a: number}> = ({color, a}) => {
  const id = uid('wvig');
  return (
    <g>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={W / 2} cy={H * 0.52} r={H * 0.62} gradientTransform={`translate(${W / 2},${H * 0.52}) scale(0.78,1) translate(${-W / 2},${-H * 0.52})`}>
          <stop offset={0.55} stopColor={color} stopOpacity={0} />
          <stop offset={1} stopColor={color} stopOpacity={a} />
        </radialGradient>
      </defs>
      <rect x={-320} y={-320} width={W + 640} height={H + 640} fill={`url(#${id})`} />
    </g>
  );
};
/** near the front edge of the bench: a precision screwdriver and tweezers (they never cross the bird) */
export const LabFront: React.FC<Env> = ({B}) => {
  const P = (p: V3) => proj(B, p);
  const d = depth(B, [-20, BY, 26]);
  const sd0 = P([-50, BY + 0.9, 27]), sd1 = P([-40, BY + 0.9, 24]), sd2 = P([-30, BY + 0.5, 21]);
  // tweezers: the two arms open in a V of about 3.5 cm at the tips, across their axis in the bench plane
  const twR: V3 = [20, BY + 0.45, 28], twM: V3 = [33.1, BY + 0.3, 23.1];
  const twA = norm3(sub3(twM, twR)), twN = norm3(cross3(twA, UP));
  const tw0 = P(twR), tw1 = P(add3(twM, mul3(twN, -1.75))), tw2 = P(add3(twM, mul3(twN, 1.75)));
  if (!visible([sd0, sd1, sd2, tw0, tw1, tw2], 300)) return null;
  const sh = (a: SP, b: SP, ra: number, rb: number, dy: number) => capsule({x: a.x, y: a.y + dy * a.s}, {x: b.x, y: b.y + dy * b.s}, ra * a.s, rb * b.s);
  return (
    <Soft px={coc(B, d, LAB_A)}>
      <path d={sh(sd0, sd2, 0.9, 0.5, 0.6)} fill="#24333D" opacity={0.18} />
      {/* each tweezer arm casts its own thin shadow (the arms' own radii) */}
      <path d={sh(tw0, tw1, 0.32, 0.12, 0.4)} fill="#24333D" opacity={0.15} />
      <path d={sh(tw0, tw2, 0.32, 0.12, 0.4)} fill="#24333D" opacity={0.15} />
      <path d={capsule(sd0, sd1, 0.85 * sd0.s, 0.75 * sd1.s)} fill="#3F7FA8" stroke={INK} strokeWidth={1.4} vectorEffect={NS} />
      <path d={capsule(sd1, sd2, 0.18 * sd1.s, 0.12 * sd2.s)} fill={C.steel} stroke={INK} strokeWidth={1.2} vectorEffect={NS} />
      {/* tweezers: two narrow tapered steel arms in a shallow V, joined at the back */}
      <path d={capsule(tw0, tw1, 0.3 * tw0.s, 0.1 * tw1.s)} fill={C.steel} stroke={INK} strokeWidth={1.1} vectorEffect={NS} />
      <path d={capsule(tw0, tw2, 0.3 * tw0.s, 0.1 * tw2.s)} fill={C.steelLit} stroke={INK} strokeWidth={1.1} vectorEffect={NS} />
      <circle cx={tw0.x} cy={tw0.y} r={0.42 * tw0.s} fill={C.steel} stroke={INK} strokeWidth={1.1} vectorEffect={NS} />
    </Soft>
  );
};

// ================================================================== MEADOW (research goal)
/** a wetland meadow edge in soft morning light: the drone flies 200 cm above it. A near wet meadow of sedge tussocks
 *  and small pools, an open water channel behind the drone's line, a far bank of reed clumps, the meadow's far edge and,
 *  beyond it, a low hazy treeline under a soft sky. */
export const MEADOW = {
  groundY: -200,
  nearBankZ: -1900,
  farBankZ: -3900,
  edgeZ: -6400,
  yRef: 72,
  /** the soft morning haze far things fade toward (pass to Flock as haze) */
  haze: '#E7EFEA',
};
const MEADOW_A = 0.7;
const M_HAZE = MEADOW.haze;
const MEADOW_SKY: [number, string][] = [
  [10, '#8FC2DE'],
  [2.5, '#A8D2E6'],
  [0.5, '#C9E3EC'],
  [-0.8, '#E2EEEA'],
  [-1.8, '#EEF1E4'],
  [-6, '#ECEEDF'],
];
const nearBank = (x: number) => MEADOW.nearBankZ + 70 * noise1(x / 520, 31) + 25 * noise1(x / 130, 32);
const farBank = (x: number) => MEADOW.farBankZ + 110 * noise1(x / 700, 33) + 35 * noise1(x / 160, 34);
/** a reed clump (common reed): a leafy base mound, curving stems that fan out (lean about +-0.35 rad), long arching
 *  leaves off the stems and soft drooping plumes; three paths: the base mound, the green body, the plumes */
const reedClump = (b: SP, h: number, seed: number, sway: number, n = 12, wcm = 1.3, plume = 1) => {
  let leaves = '';
  let plumes = '';
  // the base: overlapping soft leafy blobs over the lower third of the clump (no parallel sticks at the bottom)
  const mound: Blob[] = [];
  for (let j = 0; j < 6; j++) {
    const u = j / 5 - 0.5;
    const c = 1 - 2 * Math.abs(u); // 1 in the middle, 0 at the sides
    const r = (0.09 + 0.05 * c + 0.03 * hash(seed + j * 6.7)) * h * b.s;
    mound.push({x: b.x + u * 46 * b.s, y: b.y - r * 0.7 - c * 0.13 * h * b.s, r, k: 0});
  }
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5;
    const hi = h * (0.6 + 0.4 * hash(seed + i * 1.9));
    const L = hi * b.s;
    const lean = u * 0.7 + (hash(seed + i * 2.7) - 0.5) * 0.24 + sway * (0.7 + 0.6 * hash(seed + i));
    const bx = b.x + u * 30 * b.s + (hash(seed + i * 3.9) - 0.5) * 8 * b.s, by = b.y - (0.08 + 0.1 * hash(seed + i * 4.9)) * h * b.s;
    const tx = bx + Math.sin(lean) * L, ty = by - Math.cos(lean) * L;
    const w = wcm * b.s * (0.7 + 0.5 * hash(seed + i * 1.1));
    // the stem curves: it rises nearly straight and bends outward toward the top
    const mx = bx + Math.sin(lean * 0.25) * L * 0.55, my = by - Math.cos(lean * 0.25) * L * 0.55;
    leaves += `M${fx(bx - w)},${fx(by)} Q${fx(mx - w * 0.5)},${fx(my)} ${fx(tx)},${fx(ty)} Q${fx(mx + w * 0.5)},${fx(my)} ${fx(bx + w)},${fx(by)} Z `;
    // long leaves angled off the stem, arching over and down
    for (let j = 0; j < 3; j++) {
      if (hash(seed + i * 4.3 + j * 9.1) < 0.3) continue;
      const f = 0.12 + 0.5 * hash(seed + i * 5.1 + j * 3.3);
      const sx = bx + (mx - bx) * f * 1.6, sy = by + (my - by) * f * 1.6;
      const dir = (i + j) % 2 ? 1 : -1;
      const ll = L * (0.38 + 0.22 * hash(seed + i + j * 5.5)), ang = lean * 0.5 + dir * (0.6 + 0.4 * hash(seed + i * 2 + j));
      const ex = sx + Math.sin(ang) * ll, ey = sy - Math.cos(ang) * ll * 0.55 + ll * 0.22;
      const cx = sx + Math.sin(ang) * ll * 0.5, cy = sy - Math.cos(ang) * ll * 0.75;
      const lw = w * 1.6;
      leaves += `M${fx(sx)},${fx(sy - lw)} Q${fx(cx)},${fx(cy - lw)} ${fx(ex)},${fx(ey)} Q${fx(cx)},${fx(cy + lw)} ${fx(sx)},${fx(sy + lw)} Z `;
    }
    if (plume > 0 && hash(seed + i * 7.7) > 0.32) {
      // a soft plume: a drooping teardrop from the stem tip
      const pl = 20 * plume * b.s * (0.8 + 0.4 * hash(seed + i * 8.3)), pw = 3.6 * plume * b.s;
      const dx = Math.sin(lean), dy = -Math.cos(lean), nx = -dy, ny = dx;
      const droop = (hash(seed + i * 9.1) > 0.5 ? 1 : -1) * pl * 0.28;
      const ax = tx + dx * pl + nx * droop, ay = ty + dy * pl + ny * droop + pl * 0.12;
      const mx2 = tx + dx * pl * 0.45, my2 = ty + dy * pl * 0.45;
      plumes += `M${fx(tx)},${fx(ty)} Q${fx(mx2 + nx * pw * 1.6)},${fx(my2 + ny * pw * 1.6)} ${fx(ax)},${fx(ay)} Q${fx(mx2 - nx * pw * 1.2)},${fx(my2 - ny * pw * 1.2)} ${fx(tx)},${fx(ty)} Z `;
    }
  }
  return {base: blobsPath(mound, 1.3, 0.85), leaves, plumes};
};
const MeadowFar: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const yr = MEADOW.yRef;
  const Zt = -60000;
  const trees = (x: number) => -1.05 + 0.22 * noise1(x / 9000, 41) + 0.08 * noise1(x / 2400, 42);
  const cr = crowns(B, Zt, yr, trees, 520, 43);
  const hl = cr.filter((b) => b.k > 0.4).map((b) => ({...b, x: b.x - b.r * 0.25, y: b.y - b.r * 0.3, r: b.r * 0.55}));
  return (
    <g>
      <path d={ridge(B, -300000, yr, (x) => -0.62 + 0.25 * noise1(x / 60000, 44), -8)} fill={mix('#A3C2C4', M_HAZE, 0.5)} />
      <path d={ridge(B, Zt, yr, (x) => trees(x) - 0.25, -8)} fill={mix('#5E8577', M_HAZE, 0.42)} />
      <path d={blobsPath(cr)} fill={mix('#5E8577', M_HAZE, 0.42)} />
      <path d={blobsPath(hl)} fill={mix('#82A88E', M_HAZE, 0.42)} />
    </g>
  );
};
/** the meadow beyond the channel: far grass to the edge, reed clumps, the far bank's reflection is drawn with the water */
const MeadowFarGround: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const Y = MEADOW.groundY;
  const [lo, hi] = spanX(B, MEADOW.edgeZ, 300);
  const step = 40;
  const edge = lat(lo, hi, step).map((k) => xy(proj(B, [k * step, Y, MEADOW.edgeZ])));
  const [lo2, hi2] = spanX(B, MEADOW.farBankZ, 300);
  const bank = lat(lo2, hi2, 30).map((k) => xy(proj(B, [k * 30, Y, farBank(k * 30)])));
  const id = uid('wmfg');
  const far = poly([...edge, ...[...bank].reverse()]);
  // the edge's low vegetation: a soft bumpy band
  const ev: Blob[] = [];
  lat(lo, hi, 70).forEach((k) => {
    const x = k * 70 + (hash(k * 1.3) - 0.5) * 40;
    const r = 40 + 50 * hash(k * 2.9);
    const p = proj(B, [x, Y + r * 0.55, MEADOW.edgeZ + 40]);
    ev.push({x: p.x, y: p.y, r: r * p.s, k: hash(k)});
  });
  // reed clumps on the far meadow, in rows from the edge toward the far bank
  const clumps: React.ReactNode[] = [];
  const rows = [MEADOW.edgeZ + 300, -5400, -4700, MEADOW.farBankZ - 180];
  rows.forEach((z, ri) => {
    const [a, b] = spanX(B, z, 300);
    const sp = 420 + ri * 50;
    lat(a, b, sp).forEach((k) => {
      const sd = k * 11.3 + ri * 71.1 + 3;
      if (hash(sd) < 0.18) return;
      const x = k * sp + (hash(sd + 1) - 0.5) * sp * 0.6;
      const zz = ri === 3 ? farBank(x) - 60 - 60 * hash(sd + 4) : z + (hash(sd + 2) - 0.5) * 200;
      const bp = proj(B, [x, Y, zz]);
      const h = 150 + 90 * hash(sd + 3);
      const {base, leaves, plumes} = reedClump(bp, h, sd, 0.04 * Math.sin(t * 1.3 + x * 0.004), 12 + Math.floor(hash(sd + 5) * 8), 1.5);
      const k2 = 0.25 + 0.2 * (1 - ri / 3);
      clumps.push(
        <g key={`${ri}_${k}`}>
          <path d={base} fill={mix(ri % 2 ? '#6C8D4C' : '#5F8247', M_HAZE, k2)} />
          <path d={leaves} fill={mix(ri % 2 ? '#7E9C55' : '#6F9150', M_HAZE, k2)} />
          <path d={plumes} fill={mix('#C2A98C', M_HAZE, k2)} />
        </g>,
      );
    });
  });
  const yE = edge.reduce((a, p) => a + p.y, 0) / Math.max(1, edge.length);
  const yB = bank.reduce((a, p) => a + p.y, 0) / Math.max(1, bank.length);
  // sedge streaks across the far meadow (world-anchored strips with wavy edges)
  const streaks = [[-4350, 70, '#7E9F5B'], [-4800, 110, '#B7C88F'], [-5350, 90, '#7FA05E'], [-5900, 120, '#AFC28A']].map(([zc, wz, c], i) => {
    const [a, b] = spanX(B, zc as number, 300);
    const st = 60;
    const ks = lat(a, b, st);
    const top = ks.map((k) => xy(proj(B, [k * st, Y + 0.3, (zc as number) - (wz as number) * (0.6 + 0.4 * noise1(k * st / 500, 70 + i))])));
    const bot = ks.map((k) => xy(proj(B, [k * st, Y + 0.3, (zc as number) + (wz as number) * (0.6 + 0.4 * noise1(k * st / 430, 80 + i))]))).reverse();
    return <path key={`st${i}`} d={poly([...top, ...bot])} fill={mix(c as string, M_HAZE, 0.3)} opacity={0.75} />;
  });
  // a few low willow shrubs toward the edge
  const shrubs: Blob[] = [];
  for (const [zr, sp, sd0] of [[-5650, 900, 91], [-6150, 700, 92]] as [number, number, number][]) {
    const [a, b] = spanX(B, zr, 300);
    lat(a, b, sp).forEach((k) => {
      const sd = k * 4.3 + sd0;
      if (hash(sd) < 0.35) return;
      const x = (k + (hash(sd + 1) - 0.5) * 0.6) * sp;
      const R = 26 + 22 * hash(sd + 2);
      for (let j = 0; j < 3; j++) {
        const r = R * (0.6 + 0.4 * hash(sd + 3 + j));
        const p = proj(B, [x + (j - 1) * R * 0.8, Y + r * 0.7, zr]);
        shrubs.push({x: p.x, y: p.y, r: r * p.s, k: 0});
      }
    });
  }
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={yE} x2={0} y2={yB}>
          <stop offset={0} stopColor={mix('#A9BF86', M_HAZE, 0.45)} />
          <stop offset={1} stopColor={mix('#8CAD66', M_HAZE, 0.2)} />
        </linearGradient>
      </defs>
      <path d={blobsPath(ev, 1.3, 0.75)} fill={mix('#6E8F62', M_HAZE, 0.45)} />
      <path d={far} fill={`url(#${id})`} />
      {streaks}
      <path d={blobsPath(shrubs, 1.1, 0.85)} fill={mix('#5F8456', M_HAZE, 0.4)} />
      {clumps}
    </g>
  );
};
/** the open channel: sky reflection, the far bank's reflected reeds, glints */
const MeadowWater: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const Y = MEADOW.groundY;
  const [lo, hi] = spanX(B, MEADOW.farBankZ, 300);
  const fb = lat(lo, hi, 30).map((k) => xy(proj(B, [k * 30, Y, farBank(k * 30)])));
  const [lo2, hi2] = spanX(B, MEADOW.nearBankZ, 300);
  const nb = lat(lo2, hi2, 24).map((k) => xy(proj(B, [k * 24, Y, nearBank(k * 24)])));
  const water = poly([...fb, ...[...nb].reverse()]);
  const yF = fb.reduce((a, p) => a + p.y, 0) / Math.max(1, fb.length);
  const yN = nb.reduce((a, p) => a + p.y, 0) / Math.max(1, nb.length);
  const id = uid('wwat'), cid = uid('wwatc');
  // reflections of the far bank vegetation: a dark soft band under the bank
  const refl: V2[] = fb.map((p, i) => ({x: p.x, y: p.y + (yN - yF) * (0.16 + 0.1 * (0.5 + 0.5 * noise1(i * 0.35, 51)))}));
  const reflP = poly([...fb.map((p) => ({x: p.x, y: p.y - 2})), ...[...refl].reverse()]);
  // glints: short horizontal streaks on the water, world-anchored
  const gl: string[] = [];
  for (let z = MEADOW.nearBankZ - 120; z > MEADOW.farBankZ + 150; z -= 170) {
    const [a, b] = spanX(B, z, 100);
    lat(a, b, 140).forEach((k) => {
      const sd = k * 3.7 + z * 0.13;
      if (hash(sd) < 0.45) return;
      const x = k * 140 + (hash(sd + 1) - 0.5) * 100;
      const L = 30 + 60 * hash(sd + 2);
      const sh = 0.5 + 0.5 * Math.sin(t * 2.2 + hash(sd + 3) * 6.28);
      if (sh < 0.25) return;
      const p0 = proj(B, [x - L / 2, Y, z]), p1 = proj(B, [x + L / 2, Y, z]);
      gl.push(`M${fx(p0.x)},${fx(p0.y)} L${fx(p1.x)},${fx(p1.y)}`);
    });
  }
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={yF} x2={0} y2={yN}>
          <stop offset={0} stopColor="#D6E9EA" />
          <stop offset={0.35} stopColor="#B5DAE3" />
          <stop offset={1} stopColor="#86BDD0" />
        </linearGradient>
        <clipPath id={cid}><path d={water} /></clipPath>
      </defs>
      <path d={water} fill={`url(#${id})`} />
      <g clipPath={`url(#${cid})`}>
        <path d={reflP} fill={mix('#6D8F6A', '#B5DAE3', 0.35)} opacity={0.55} />
        <path d={gl.join(' ')} stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" opacity={0.6} />
      </g>
    </g>
  );
};
/** the near wet meadow: grass, small pools, sedge tussocks */
const MeadowNear: React.FC<{B: Basis; t: number}> = ({B, t}) => {
  const Y = MEADOW.groundY;
  const [lo2, hi2] = spanX(B, MEADOW.nearBankZ, 300);
  const nb = lat(lo2, hi2, 24).map((k) => xy(proj(B, [k * 24, Y, nearBank(k * 24)])));
  const ground = poly([...nb, {x: nb[nb.length - 1].x, y: H + 800}, {x: nb[0].x, y: H + 800}]);
  const yN = nb.reduce((a, p) => a + p.y, 0) / Math.max(1, nb.length);
  const id = uid('wmng');
  const pools: React.ReactNode[] = [];
  const tufts: React.ReactNode[] = [];
  const zs: number[] = [];
  for (let z = MEADOW.nearBankZ + 40; z < -500; z += 140) zs.push(z);
  zs.forEach((z, ri) => {
    const [a, b] = spanX(B, z, 200);
    lat(a, b, 120).forEach((k) => {
      const sd = k * 5.9 + ri * 37.7;
      const x = k * 120 + (hash(sd) - 0.5) * 90;
      const zz = z + (hash(sd + 1) - 0.5) * 100;
      if (zz < nearBank(x) + 20) return;
      if (hash(sd + 6) > 0.9) {
        const rx = 45 + 55 * hash(sd + 7), rz = 20 + 26 * hash(sd + 8);
        const lobes = [[0, 0, 1, 1], [0.55, 0.25, 0.6, 0.7], [-0.5, -0.2, 0.55, 0.75]];
        pools.push(
          <g key={`p${ri}_${k}`} transform={planeMatrix(B, [x, Y + 0.5, zz], [1, 0, 0], [0, 0, 1])}>
            {lobes.map(([u, v, a, b2], j) => <ellipse key={`r${j}`} cx={u * rx} cy={v * rz - 4} rx={a * rx + 5} ry={b2 * rz + 5} fill="#7E9A5A" opacity={0.55} />)}
            {lobes.map(([u, v, a, b2], j) => <ellipse key={`w${j}`} cx={u * rx} cy={v * rz} rx={a * rx} ry={b2 * rz} fill="#A9D2DB" />)}
            <ellipse cx={0} cy={rz * 0.25} rx={rx * 0.6} ry={rz * 0.35} fill="#CDE6EB" opacity={0.7} />
          </g>,
        );
        return;
      }
      const bp = proj(B, [x, Y, zz]);
      if (bp.y > H + 900) return;
      const h = 35 + 45 * hash(sd + 2);
      const near = clamp((zz - MEADOW.nearBankZ) / 1400);
      const col = mix(hash(sd + 3) > 0.5 ? '#7FA552' : '#93B25C', M_HAZE, 0.22 * (1 - near));
      tufts.push(<path key={`${ri}_${k}`} d={tuftPath(bp, h, 7 + Math.floor(hash(sd + 4) * 4), sd, 0.05 * Math.sin(t * 1.6 + x * 0.01), 1.1, 1.25)} fill={col} />);
    });
  });
  return (
    <g>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={yN} x2={0} y2={H}>
          <stop offset={0} stopColor="#9DB86C" />
          <stop offset={1} stopColor="#6F9A4E" />
        </linearGradient>
      </defs>
      <path d={ground} fill={`url(#${id})`} />
      {/* a light muddy lip along the bank */}
      <path d={smoothOpen(nb)} fill="none" stroke="#C9C39A" strokeWidth={Math.max(2, 14 * proj(B, [0, Y, MEADOW.nearBankZ]).s)} opacity={0.7} />
      {pools}
      {tufts}
    </g>
  );
};
export const MeadowBack: React.FC<Env> = ({B, t}) => {
  const midX = (spanX(B, MEADOW.farBankZ, 0)[0] + spanX(B, MEADOW.farBankZ, 0)[1]) / 2;
  const dFar = depth(B, [midX, MEADOW.groundY, MEADOW.farBankZ - 1000]);
  const dW = depth(B, [midX, MEADOW.groundY, (MEADOW.farBankZ + MEADOW.nearBankZ) / 2]);
  const dN = depth(B, [midX, MEADOW.groundY, MEADOW.nearBankZ + 500]);
  const psi = camPsi(B);
  const sun = atInf(B, psi - 28, 9);
  return (
    <g>
      <SkyGrad B={B} stops={MEADOW_SKY} />
      <Glow x={clamp(sun.x, -900, 150)} y={clamp(sun.y, -900, 150)} r={1600} color="#FFF5DD" a={0.7} />
      <Soft px={coc(B, 3e5, MEADOW_A) * 1.5}>
        <CloudLayer B={B} Z={-250000} yRef={MEADOW.yRef} spacing={26000} elLo={1.2} elHi={5.5} size={6200} seed={7} t={t} drift={250} lit="#FFFFFF" body="#F3F7F6" shade="#D5E3E8" keep={0.7} flat={0.45} />
      </Soft>
      <Soft px={coc(B, 6e4, MEADOW_A)}>
        <MeadowFar B={B} t={t} />
      </Soft>
      <Soft px={coc(B, dFar, MEADOW_A)}>
        <MeadowFarGround B={B} t={t} />
      </Soft>
      <Soft px={coc(B, dW, MEADOW_A)}>
        <MeadowWater B={B} t={t} />
      </Soft>
      <Soft px={coc(B, dN, MEADOW_A)}>
        <MeadowNear B={B} t={t} />
      </Soft>
    </g>
  );
};
/** in front of the drone: the tips of a near row of tall reed leaves (3 m in front of the drone's line) rise into the
 *  bottom of the frame only: broad, filled leaf masses (no thin stalks), heavily defocused and smeared along the
 *  tracking direction, so they read as soft foreground the camera glides past. Each leaf's reach is solved per frame
 *  from the camera, so its tip lands between H-300 and H-75 px for ANY meadow camera: the foreground never rises into
 *  the drone. */
export const MEADOW_FRONT = {z: 320, gap: 11, tipY: [H - 300, H - 75] as [number, number]};
/** the height Y at which a leaf leaning by slope (x per cm of height above Y0) from (x, Y0, z) projects to screen y = yT
 *  (secant on a projective map: converges in a few steps), clamped to a sensible reach */
const solveTipY = (B: Basis, x: number, z: number, Y0: number, slope: number, yT: number) => {
  const f = (Y: number) => proj(B, [x + slope * (Y - Y0), Y, z]).y - yT;
  let a = Y0 + 60, b = Y0 + 260, fa = f(a), fb = f(b);
  for (let i = 0; i < 8 && Math.abs(fb) > 0.25; i++) {
    const d = fb - fa;
    if (Math.abs(d) < 1e-6) break;
    const c = b - (fb * (b - a)) / d;
    a = b;
    fa = fb;
    b = clamp(c, Y0 + 20, Y0 + 700);
    fb = f(b);
  }
  return b;
};
export const MeadowFront: React.FC<Env> = ({B, t}) => {
  const Y = MEADOW.groundY;
  const {z: zF, gap, tipY: [yHi, yLo]} = MEADOW_FRONT;
  const [lo, hi] = spanX(B, zF, 300);
  const dark: string[] = [], light: string[] = [];
  let dsum = 0, n = 0, ssum = 0;
  lat(lo, hi, gap).forEach((k) => {
    const sd = k * 9.7 + 5;
    if (hash(sd) < 0.12) return;
    const x = k * gap + (hash(sd + 1) - 0.5) * gap * 0.6;
    const z = zF + (hash(sd + 2) - 0.5) * 70;
    const b = proj(B, [x, Y, z]);
    if (b.z < 60) return;
    // a clump of four broad leaves fanning out; where their tips land rises and falls slowly along the row
    const yRow = lerp(yHi, yLo, 0.5 + 0.42 * noise1(x / 55, 91));
    for (let j = 0; j < 4; j++) {
      const jj = j - 1.5;
      const lean = jj * 0.16 + (hash(sd + 3 + j) - 0.5) * 0.24 + 0.03 * Math.sin(t * 1.4 + k * 0.7 + j);
      const zl = z + jj * 4;
      const yT = clamp(yRow + 30 * (hash(sd + 7 + j) - 0.5) + 22 * Math.abs(jj), yHi, yLo);
      const reach = solveTipY(B, x, zl, Y, Math.tan(lean), yT) - Y;
      const L = reach / Math.cos(lean);
      const tip: V3 = [x + Math.sin(lean) * L, Y + reach, zl];
      const tp = proj(B, tip);
      if (tp.y > H + 60 || tp.z < 40) continue;
      // the leaf: wide for most of its length, rounding to the tip (only the top 10-20 cm is ever on screen)
      const wcm = 3.2 + 2.0 * hash(sd + 11 + j);
      const L2: V2[] = [], R2: V2[] = [];
      for (const u of [0.55, 0.7, 0.82, 0.9, 0.95, 0.985]) {
        const c = proj(B, [x + Math.sin(lean) * L * u, Y + reach * u, zl]);
        const hw = wcm * Math.pow(1 - u, 0.45) * 1.35 * c.s;
        const nx = Math.cos(lean), ny = Math.sin(lean); // screen normal of a leaf leaning by lean (y down)
        L2.push({x: c.x - nx * hw, y: c.y - ny * hw});
        R2.push({x: c.x + nx * hw, y: c.y + ny * hw});
      }
      const d = smoothClosed([...L2, xy(tp), ...R2.reverse()]);
      (hash(sd + 13 + j) > 0.55 ? light : dark).push(d);
      dsum += tp.z;
      ssum += tp.s;
      n++;
    }
  });
  if (!n) return null;
  const s = ssum / n;
  const sdY = clamp(coc(B, dsum / n, 6) / 2, 8, 24);
  const smear = FIELD.V * (1 / 60) * s; // the tracking camera's shutter smear (px)
  const sdX = Math.hypot(sdY, 0.29 * smear);
  const id = uid('wmf');
  return (
    <g>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x={-320} y={-320} width={W + 640} height={H + 640} colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation={`${fx(sdX)} ${fx(sdY)}`} />
        </filter>
      </defs>
      <g filter={`url(#${id})`}>
        <path d={dark.join(' ')} fill="#5B7C46" />
        <path d={light.join(' ')} fill="#7A9853" />
      </g>
    </g>
  );
};

// ================================================================== SKY (final callback)
/** open sky in warmer late light: soft clouds in layers and a low, distant treeline */
export const SKY = {yRef: 100, /** the warm late haze far things fade toward (pass to Flock as haze) */ haze: '#F2DEC0'};
const SKY_A = 0.7;
const S_HAZE = SKY.haze;
const SKY_STOPS: [number, string][] = [
  [10, '#78AFD3'],
  [2, '#8FC0DD'],
  [-2.5, '#B5D6E4'],
  [-5.2, '#DCE3DA'],
  [-7.0, '#F1DDBE'],
  [-8.4, '#F5CF9C'],
  [-14, '#F0C792'],
];
export const SkyBack: React.FC<Env> = ({B, t}) => {
  const yr = SKY.yRef;
  const psi = camPsi(B);
  const sun = atInf(B, psi - 26, 4);
  const Zt = -70000;
  const trees = (x: number) => -8.25 + 0.2 * noise1(x / 9000, 61) + 0.06 * noise1(x / 2600, 62);
  const cr = crowns(B, Zt, yr, trees, 560, 63);
  const hl = cr.filter((b) => b.k > 0.35).map((b) => ({...b, x: b.x - b.r * 0.3, y: b.y - b.r * 0.3, r: b.r * 0.52}));
  return (
    <g>
      <SkyGrad B={B} stops={SKY_STOPS} />
      <Glow x={clamp(sun.x, -700, 150)} y={clamp(sun.y, -500, 500)} r={1900} color="#FFE7BD" a={0.8} />
      <Soft px={coc(B, 5e5, SKY_A) * 1.6}>
        <CloudLayer B={B} Z={-500000} yRef={yr} spacing={52000} elLo={-1.0} elHi={-5.4} size={11000} seed={21} t={t} drift={600} lit="#FFF6E6" body="#F7E9DA" shade="#DCD4D6" keep={0.62} flat={0.42} />
      </Soft>
      <Soft px={coc(B, 1e5, SKY_A)}>
        <path d={ridge(B, -260000, yr, (x) => -7.7 + 0.3 * noise1(x / 50000, 64), -16)} fill={mix('#B4BCC0', S_HAZE, 0.5)} />
        <path d={ridge(B, Zt, yr, (x) => trees(x) - 0.28, -16)} fill={mix('#56724F', S_HAZE, 0.38)} />
        <path d={blobsPath(cr)} fill={mix('#56724F', S_HAZE, 0.38)} />
        <path d={blobsPath(hl)} fill={mix('#8DA06A', S_HAZE, 0.36)} />
        <Valley B={B} Z={-60000} yRef={yr} tops={[-8.62, -9.15, -9.85, -10.8, -12]} cols={['#A7AE76', '#C2B783', '#99A66E', '#B9B27E']} haze={S_HAZE} k={0.42} hedge="#5E6E48" />
      </Soft>
      <Soft px={coc(B, 1.5e5, SKY_A) * 1.4}>
        <CloudLayer B={B} Z={-150000} yRef={yr} spacing={26000} elLo={-3.4} elHi={-6.6} size={4200} seed={22} t={t} drift={400} lit="#FFF3E2" body="#F5E3D2" shade="#DAD1D2" keep={0.5} flat={0.36} />
      </Soft>
    </g>
  );
};
