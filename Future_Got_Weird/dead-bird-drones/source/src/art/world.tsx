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
import {mix, rgba} from '../core/color';
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
type Blob = {x: number; y: number; r: number; k: number};
/** tree crowns along a far plane: round blobs whose tops follow el(x) */
const crowns = (B: Basis, Z: number, yRef: number, el: (x: number) => number, spacing: number, seed: number): Blob[] => {
  const [lo, hi] = spanX(B, Z, 320);
  const out: Blob[] = [];
  for (const k of lat(lo, hi, spacing)) {
    for (let row = 0; row < 2; row++) {
      const h0 = hash(k * 7.13 + seed + row * 31.7), h1 = hash(k * 3.71 + seed * 2.3 + row * 17.1);
      const x = (k + 0.5 * row + (h0 - 0.5) * 0.6) * spacing;
      const R = spacing * (row ? 0.42 + 0.3 * h1 : 0.55 + 0.35 * h1);
      const top = farY(Z, el(x), yRef) - (row ? 0.45 : 0) * R + (h0 - 0.5) * 0.5 * R;
      const p = proj(B, [x, top - R, Z]);
      out.push({x: p.x, y: p.y, r: R * p.s, k: h0});
    }
  }
  return out;
};
const blobsPath = (bs: Blob[], sx = 1.06, sy = 0.94) =>
  bs.map((b) => `M${fx(b.x - b.r * sx)},${fx(b.y)} a${fx(b.r * sx)},${fx(b.r * sy)} 0 1,0 ${fx(2 * b.r * sx)},0 a${fx(b.r * sx)},${fx(b.r * sy)} 0 1,0 ${fx(-2 * b.r * sx)},0 Z`).join(' ');

/** an ellipse path (centre, radii, rotation in deg) */
const ellPath = (cx: number, cy: number, rx: number, ry: number, rot: number) => {
  const c = Math.cos(rad(rot)), s = Math.sin(rad(rot));
  const a = {x: cx - rx * c, y: cy - rx * s}, b = {x: cx + rx * c, y: cy + rx * s};
  return `M${P2(a)} A${fx(rx)},${fx(ry)} ${fx(rot)} 1,0 ${P2(b)} A${fx(rx)},${fx(ry)} ${fx(rot)} 1,0 ${P2(a)} Z`;
};
/** soft cel-shaded cumulus: a cluster of puffs, lit from the upper left */
const Cloud: React.FC<{c: V2; s: number; seed: number; lit: string; body: string; shade: string; flat?: number}> = ({c, s, seed, lit, body, shade, flat = 0.55}) => {
  const id = uid('wcl');
  const puffs: Blob[] = [];
  const n = 5 + Math.floor(hash(seed) * 3);
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : i / (n - 1) - 0.5;
    const r = s * (0.32 + 0.3 * Math.sin(Math.PI * (u + 0.5)) * (0.7 + 0.6 * hash(seed + i * 1.7)));
    puffs.push({x: c.x + u * s * 1.9 + (hash(seed + i * 2.9) - 0.5) * s * 0.25, y: c.y - r * 0.55 + (hash(seed + i * 4.1) - 0.5) * s * 0.12, r, k: 0});
  }
  const base = `M${fx(c.x - s * 1.15)},${fx(c.y)} L${fx(c.x + s * 1.15)},${fx(c.y)} L${fx(c.x + s * 1.0)},${fx(c.y + s * 0.16)} L${fx(c.x - s * 1.0)},${fx(c.y + s * 0.16)} Z`;
  const all = blobsPath(puffs, 1, 1) + ' ' + base;
  const litP = blobsPath(puffs.map((p) => ({...p, x: p.x - p.r * 0.2, y: p.y - p.r * 0.26, r: p.r * 0.86})), 1, 1);
  return (
    <g transform={`translate(${fx(c.x)},${fx(c.y)}) scale(1,${flat * 1.6}) translate(${fx(-c.x)},${fx(-c.y)})`}>
      <defs>
        <clipPath id={id}><path d={all} /></clipPath>
      </defs>
      <path d={all} fill={shade} />
      <g clipPath={`url(#${id})`}>
        <path d={blobsPath(puffs.map((p) => ({...p, y: p.y - p.r * 0.1})), 1, 1)} fill={body} />
        <path d={litP} fill={lit} />
      </g>
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
    if (p.x < -3 * s || p.x > W + 3 * s) continue;
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
/** a soft ellipse lying on the horizontal plane y (world), radius rx along x and rz along z (cm) */
const groundEllipse = (B: Basis, c: V3, rx: number, rz: number, fill: string, key?: React.Key) => (
  <g key={key} transform={planeMatrix(B, c, [1, 0, 0], [0, 0, 1])}>
    <ellipse cx={0} cy={0} rx={rx} ry={rz} fill={fill} />
  </g>
);

// ================================================================== FIELD (opening and loop)
/** the field: the bird flies 140 cm above a hilltop field; a post-and-wire fence runs along the flight line 150 cm
 *  behind it; beyond the field's brow the land falls away to a hazy valley, far hills and the morning sky. */
export const FIELD = {
  groundY: -140,
  fenceZ: -150,
  postGap: 260,
  /** the post that passes behind the bird at t = 0.5 s in the story's opening (bird at x = 100, camera yaw 14) */
  postX0: 62,
  postW: 12,
  postTop: -2,
  wires: [-30, -64, -98],
  browZ: -820,
  /** typical eye height of the opening cameras: far billboards are laid out by elevation from here */
  yRef: 115,
  /** the flight speed the posts' motion smear assumes (story V_FLY) */
  V: 200,
};
const FIELD_A = 0.75;
const F_HAZE = '#EEF0E0';
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
      {bands.map(([e, c], i) => (
        <path key={i} d={ridge(B, Zv + i * 1500, yr, (x) => e + 0.07 * noise1(x / 4000, 20 + i), -14)} fill={mix(c, F_HAZE, 0.38)} />
      ))}
      {bands.map(([e], i) => (
        <path key={`h${i}`} d={ridgeLine(B, Zv + i * 1500 - 300, yr, (x) => e + 0.07 * noise1(x / 4000, 20 + i))} fill="none" stroke={mix('#5C8655', F_HAZE, 0.42)}
          strokeWidth={Math.max(2, 120 * proj(B, [0, 0, Zv]).s)} strokeLinecap="round" strokeDasharray={`${fx(Math.max(3, 200 * proj(B, [0, 0, Zv]).s))} ${fx(Math.max(2, 90 * proj(B, [0, 0, Zv]).s))}`} />
      ))}
    </g>
  );
};
/** an open far polyline (no fill) along an elevation profile */
const ridgeLine = (B: Basis, Z: number, yRef: number, el: (x: number) => number, stepDeg = 0.25) => {
  const [lo, hi] = spanX(B, Z, 320);
  let step = Math.abs(Z) * Math.tan(rad(stepDeg));
  step = Math.max(step, (hi - lo) / 200);
  return smoothOpen(lat(lo, hi, step).map((k) => xy(proj(B, [k * step, farY(Z, el(k * step), yRef), Z]))));
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
      const x = k * 30 + (hash(sd) - 0.5) * 22;
      const bp = proj(B, [x, Y, z + (hash(sd + 2) - 0.5) * 30]);
      if (bp.y < -200 || bp.y > H + 700 || bp.x < -300 || bp.x > W + 300) return;
      const h = 10 + 18 * hash(sd + 5);
      const col = mix(hash(sd + 9) > 0.5 ? '#5E8F44' : '#76A04E', '#B9CB86', 0.55 * (1 - near));
      tufts.push(<path key={`${ri}_${k}`} d={tuftPath(bp, h, 5 + Math.floor(hash(sd + 3) * 3), sd, 0.07 * Math.sin(t * 1.9 + x * 0.031 + z * 0.02))} fill={col} />);
    });
  });
  // the brow: taller grass, seed heads and a few flowers against the valley haze
  const browT: string[] = [];
  const seeds: string[] = [];
  const flowers: React.ReactNode[] = [];
  lat(lo, hi, 9).forEach((k) => {
    const sd = k * 5.31 + 0.7;
    const x = k * 9 + (hash(sd) - 0.5) * 6;
    const bp = proj(B, [x, browY(x) - 1, Zb + 4 + 6 * hash(sd + 1)]);
    const h = 9 + 20 * hash(sd + 2) ** 1.6;
    const sw = 0.08 * Math.sin(t * 2.1 + x * 0.05);
    browT.push(tuftPath(bp, h, 4 + Math.floor(hash(sd + 4) * 3), sd, sw, 0.55));
    if (hash(sd + 7) > 0.62) {
      // a seed-head stalk
      const L = (h + 8) * bp.s, lean = (hash(sd + 8) - 0.5) * 0.5 + sw;
      const tx = bp.x + Math.sin(lean) * L, ty = bp.y - Math.cos(lean) * L;
      seeds.push(`M${fx(bp.x)},${fx(bp.y)} Q${fx(bp.x + Math.sin(lean * 0.5) * L * 0.5)},${fx(bp.y - L * 0.55)} ${fx(tx)},${fx(ty)}`);
      flowers.push(<ellipse key={`s${k}`} cx={tx} cy={ty} rx={0.9 * bp.s} ry={2.6 * bp.s} transform={`rotate(${fx(deg(lean))},${fx(tx)},${fx(ty)})`} fill="#B79E66" />);
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
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const [a, b] = spanX(B, -600, 0);
        const sp = 260;
        const k = Math.floor((a + b) / 2 / sp) + i - 2;
        const x = k * sp + hash(k * 3.3) * 120;
        return groundEllipse(B, [x, Y, -560 - 180 * hash(k * 1.9)], 70 + 50 * hash(k * 7.7), 60 + 40 * hash(k * 5.1), rgba(hash(k * 2.2) > 0.5 ? '#4E7F3A' : '#D8E3A0', 0.22), i);
      })}
      {tufts}
      <path d={browT.join(' ')} fill="#7FA055" />
      <path d={seeds.join(' ')} fill="none" stroke="#8E9A5A" strokeWidth={Math.max(1, 0.3 * proj(B, [0, Y, Zb]).s)} />
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
const Post: React.FC<{B: Basis; x: number; seed: number; ghost?: number}> = ({B, x, seed, ghost}) => {
  const g = postGeo(B, x, seed);
  const sil = poly(hullPts([...g.front, ...g.side, ...g.topF]));
  if (ghost) return <path d={sil} fill={mix(C.wood, '#9A958C', 0.3)} opacity={ghost} />;
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
      <path d={sil} fill={INK} stroke={INK} strokeWidth={2.6} strokeLinejoin="round" vectorEffect={NS} />
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
/** the post-and-wire fence along the flight line */
const Fence: React.FC<{B: Basis}> = ({B}) => {
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
  // a smear of the posts across the shutter (the camera tracks the bird at FIELD.V)
  const dt = 1 / 30 / 2;
  const shifted = (u: number): Basis => ({...B, eye: add3(B.eye, [-FIELD.V * dt * u, 0, 0])});
  const staples = ks.flatMap((k) => wires.map((wy) => proj(B, [X0 + k * G, wy, zw])));
  return (
    <g>
      {wirePaths.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#3B4247" strokeWidth={1.8} vectorEffect={NS} opacity={0.85} />
          <path d={d} fill="none" stroke="#E7EDEF" strokeWidth={0.7} vectorEffect={NS} opacity={0.55} transform="translate(0,-0.8)" />
        </g>
      ))}
      {ks.map((k) => (
        <g key={k}>
          <Post B={shifted(1)} x={X0 + k * G} seed={k * 17.3 + 4} ghost={0.16} />
          <Post B={shifted(0.5)} x={X0 + k * G} seed={k * 17.3 + 4} ghost={0.3} />
          <Post B={B} x={X0 + k * G} seed={k * 17.3 + 4} />
        </g>
      ))}
      {staples.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={Math.max(1.2, 0.7 * p.s)} fill="#3B4247" />)}
    </g>
  );
};

export const FieldBack: React.FC<Env> = ({B, t}) => {
  const [lo, hi] = spanX(B, FIELD.browZ, 0);
  const browD = depth(B, [(lo + hi) / 2, FIELD.groundY, FIELD.browZ]);
  const [plo, phi] = spanX(B, FIELD.fenceZ, 0);
  const postD = depth(B, [(plo + phi) / 2, -60, FIELD.fenceZ]);
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
      <Soft px={coc(B, postD, FIELD_A) * 0.8}>
        <Fence B={B} />
      </Soft>
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
  peg: {x0: -150, x1: 92, y0: 9, y1: 96},
  mat: {x0: -36, x1: 34, z0: -30, z1: 22},
  lamp: {base: [-62, CRADLE.benchY, -50] as V3, elbow: [-66, 33, -58] as V3, head: [-40, 44, -40] as V3, aim: [-10, CRADLE.benchY, -8] as V3},
};
const LAB_A = 0.85;
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
      <path d={quadZ(B, Z + 0.3, -600, 600, BY, BY + 9)} fill="#C3CED5" />
      <path d={quadZ(B, Z + 0.3, -600, 600, BY + 9, BY + 9.6)} fill="#E9EFF2" />
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
          <circle cx={sp / 2} cy={sp / 2} r={0.33} fill="#8E9DA6" />
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
/** hand tools hung on the pegboard, drawn flat in the board's plane (local cm, b down) */
const Tools: React.FC<{B: Basis; Z: number}> = ({B, Z}) => {
  const at = (x: number, y: number) => planeMatrix(B, [x, y, Z], [1, 0, 0], [0, -1, 0]);
  const sw = {stroke: '#2E3D48', strokeWidth: 1.2, vectorEffect: NS, strokeLinejoin: 'round' as const};
  const hook = (x: number, y: number, k: number) => (
    <g key={`hk${k}`} transform={at(x, y)}>
      <path d="M-0.4,0 L0.4,0 L0.4,2.2 Q0.4,3.4 1.6,3.4 L1.6,2.6" fill="none" stroke="#56636D" strokeWidth={0.55} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      {/* pliers */}
      <g transform={at(-78, 84)}>
        <path d="M-1.1,0 L1.1,0 L1.6,5.2 L0.6,6.6 L-0.6,6.6 L-1.6,5.2 Z" fill={C.steel} {...sw} />
        <path d="M-0.7,6.4 Q-2.4,12 -2.9,20 L-1.2,20.2 Q-0.9,12.5 0,7.6 Z" fill="#C2564A" {...sw} />
        <path d="M0.7,6.4 Q2.4,12 2.9,20 L1.2,20.2 Q0.9,12.5 0,7.6 Z" fill="#C2564A" {...sw} />
        <circle cx={0} cy={6.2} r={0.75} fill={C.steelDeep} />
      </g>
      {/* two screwdrivers */}
      {[[-66, '#E0A43A'], [-59, '#4D8DB8']].map(([x, col], i) => (
        <g key={`sd${i}`} transform={at(x as number, 86 - i * 2)}>
          <rect x={-1.25} y={0} width={2.5} height={9.5} rx={1.1} fill={col as string} {...sw} />
          <rect x={-0.9} y={1.2} width={0.55} height={7} rx={0.25} fill="#FFFFFF" opacity={0.45} />
          <rect x={-0.3} y={9.5} width={0.6} height={10 + i * 3} fill={C.steel} {...sw} />
        </g>
      ))}
      {/* an open-end wrench */}
      <g transform={`${at(-48, 84)} rotate(8)`}>
        <path d="M-0.9,2.6 L0.9,2.6 L1.1,19 L-1.1,19 Z" fill={C.steel} {...sw} />
        <path d="M-2.6,0 A2.8,2.8 0 1,1 2.6,0 L1.2,0.4 L1.2,-1.5 L-1.2,-1.5 L-1.2,0.4 Z" fill={C.steel} {...sw} transform="translate(0,1.4)" />
        <circle cx={0} cy={20.6} r={2.2} fill={C.steel} {...sw} />
        <circle cx={0} cy={20.6} r={1.0} fill="#E4E9EA" />
      </g>
      {/* scissors and a coil of copper wire on the right */}
      <g transform={at(30, 84)}>
        <path d="M-0.5,0 L-1.5,14 L0,14.6 Z" fill={C.steelLit} {...sw} />
        <path d="M0.5,0 L1.5,14 L0,14.6 Z" fill={C.steel} {...sw} />
        <ellipse cx={-2.4} cy={-2.6} rx={2.1} ry={2.6} fill="none" stroke="#3F8E8A" strokeWidth={1.2} />
        <ellipse cx={2.4} cy={-2.6} rx={2.1} ry={2.6} fill="none" stroke="#3F8E8A" strokeWidth={1.2} />
      </g>
      <g transform={at(52, 80)}>
        <circle cx={0} cy={6} r={6} fill="none" stroke={C.copper} strokeWidth={2.4} />
        <circle cx={0} cy={6} r={6} fill="none" stroke="#E7A06E" strokeWidth={0.6} strokeDasharray="1.2 1.4" />
      </g>
      <g transform={at(70, 84)}>
        <rect x={-3.2} y={0} width={6.4} height={12} rx={1.4} fill="#E5E1D6" {...sw} />
        <rect x={-2.2} y={2} width={4.4} height={3} rx={0.6} fill="#9FB4BF" />
      </g>
      {[[-90, 70], [-30, 88], [10, 88], [44, 66], [84, 70], [-110, 88]].map(([x, y], i) => hook(x, y, i))}
    </g>
  );
};
const Lamp: React.FC<{B: Basis}> = ({B}) => {
  const {base, elbow, head, aim} = LABSET.lamp;
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
  const rimC = add3(head, mul3(ax, 8.5));
  const rim = ring(rimC, 5.6, U, V, 20);
  const back = ring(add3(head, mul3(ax, -1.2)), 2.4, U, V, 12);
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
  const pool = add3(aim, [0, 0.25, 0]);
  const pid = uid('wlamp');
  return (
    <g>
      <defs>
        <radialGradient id={pid}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={0.5} />
          <stop offset={0.5} stopColor="#F6FBFF" stopOpacity={0.22} />
          <stop offset={1} stopColor="#F6FBFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={planeMatrix(B, pool, [1, 0, 0], [0, 0, 1])}>
        <ellipse cx={0} cy={0} rx={34} ry={30} fill={`url(#${pid})`} />
      </g>
      <path d={poly(hullPts([...baseTop, ...baseBot]))} fill="#9AA6AE" stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      <path d={smoothClosed(baseTop)} fill="#E8EDF0" />
      <path d={arm(pivot, elbow, 0.85)} fill="#E9EEF1" stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      <path d={arm(elbow, head, 0.8)} fill="#E9EEF1" stroke={INK} strokeWidth={1.6} vectorEffect={NS} />
      {joint(pivot, 1.5, 'j0')}
      {joint(elbow, 1.4, 'j1')}
      <path d={poly(shade)} fill="#DDE4E8" stroke={INK} strokeWidth={1.8} vectorEffect={NS} />
      {open && <path d={smoothClosed(rim)} fill="#FBFEFF" stroke="#C9D4DA" strokeWidth={1.2} vectorEffect={NS} />}
      {joint(head, 1.6, 'j2')}
    </g>
  );
};
/** tapered capsule between two screen circles (as three.capsule2, local copy for tight radii) */
const capsule = (a: V2, b: V2, ra: number, rb: number) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1e-3;
  const nx = -dy / L, ny = dx / L;
  return `M${fx(a.x + nx * ra)},${fx(a.y + ny * ra)} L${fx(b.x + nx * rb)},${fx(b.y + ny * rb)} A${fx(rb)},${fx(rb)} 0 0,1 ${fx(b.x - nx * rb)},${fx(b.y - ny * rb)} L${fx(a.x - nx * ra)},${fx(a.y - ny * ra)} A${fx(ra)},${fx(ra)} 0 0,1 ${fx(a.x + nx * ra)},${fx(a.y + ny * ra)} Z`;
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
  const sid = uid('wshd');
  return (
    <g>
      <defs>
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
      {/* the dark space under the bench, the front edge, the top */}
      <path d={quadZ(B, zf - 3, x0, x1, BY - 90, BY - 3.6)} fill="#46525B" />
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
      <Soft px={coc(B, wallD, LAB_A)}>
        <Wall B={B} />
        <Pegboard B={B} />
      </Soft>
      <Soft px={coc(B, benchD, LAB_A)}>
        <Bench B={B} />
      </Soft>
      <Soft px={coc(B, lampD, LAB_A)}>
        <Lamp B={B} />
      </Soft>
    </g>
  );
};
/** near the front edge of the bench: a precision screwdriver and tweezers (they never cross the bird) */
export const LabFront: React.FC<Env> = ({B}) => {
  const P = (p: V3) => proj(B, p);
  const d = depth(B, [-20, BY, 26]);
  const sd0 = P([-50, BY + 0.9, 27]), sd1 = P([-40, BY + 0.9, 24]), sd2 = P([-30, BY + 0.5, 21]);
  const tw0 = P([20, BY + 0.4, 28]), tw1 = P([33, BY + 0.4, 23]);
  if (Math.max(sd0.y, sd2.y, tw0.y) < 0 || Math.min(sd0.y, tw1.y) > H + 300) return null;
  const sh = (a: SP, b: SP) => capsule({x: a.x, y: a.y + 0.6 * a.s}, {x: b.x, y: b.y + 0.6 * b.s}, 0.9 * a.s, 0.9 * b.s);
  return (
    <Soft px={coc(B, d, LAB_A)}>
      <path d={sh(sd0, sd2)} fill="#24333D" opacity={0.18} />
      <path d={sh(tw0, tw1)} fill="#24333D" opacity={0.16} />
      <path d={capsule(sd0, sd1, 0.85 * sd0.s, 0.75 * sd1.s)} fill="#3F7FA8" stroke={INK} strokeWidth={1.4} vectorEffect={NS} />
      <path d={capsule(sd1, sd2, 0.18 * sd1.s, 0.12 * sd2.s)} fill={C.steel} stroke={INK} strokeWidth={1.2} vectorEffect={NS} />
      <path d={capsule(tw0, tw1, 0.45 * tw0.s, 0.12 * tw1.s)} fill={C.steelLit} stroke={INK} strokeWidth={1.2} vectorEffect={NS} />
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
};
const MEADOW_A = 0.7;
const M_HAZE = '#E7EFEA';
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
/** a reed clump: tall leaves and stems with plume heads (two paths: green body, plumes) */
const reedClump = (b: SP, h: number, seed: number, sway: number, n = 9) => {
  let leaves = '';
  let plumes = '';
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1) - 0.5;
    const hi = h * (0.62 + 0.38 * hash(seed + i * 1.9));
    const L = hi * b.s;
    const lean = u * 0.32 + (hash(seed + i * 2.7) - 0.5) * 0.18 + sway;
    const bx = b.x + u * 26 * b.s, by = b.y;
    const tx = bx + Math.sin(lean) * L, ty = by - Math.cos(lean) * L;
    const w = 0.9 * b.s;
    leaves += `M${fx(bx - w)},${fx(by)} Q${fx(bx + Math.sin(lean * 0.4) * L * 0.5)},${fx(by - L * 0.5)} ${fx(tx)},${fx(ty)} Q${fx(bx + Math.sin(lean * 0.4) * L * 0.5 + w)},${fx(by - L * 0.5)} ${fx(bx + w)},${fx(by)} Z `;
    // a leaf blade angled off the stem
    if (hash(seed + i * 4.3) > 0.35) {
      const f = 0.35 + 0.35 * hash(seed + i * 5.1);
      const sx = bx + (tx - bx) * f, sy = by + (ty - by) * f;
      const dir = hash(seed + i * 6.1) > 0.5 ? 1 : -1;
      const ll = L * 0.32, ang = lean + dir * (0.7 + 0.3 * hash(seed + i));
      const ex = sx + Math.sin(ang) * ll, ey = sy - Math.cos(ang) * ll * 0.8 + ll * 0.25;
      leaves += `M${fx(sx)},${fx(sy - w)} Q${fx(sx + (ex - sx) * 0.5)},${fx(sy + (ey - sy) * 0.5 - 2.4 * w)} ${fx(ex)},${fx(ey)} Q${fx(sx + (ex - sx) * 0.5)},${fx(sy + (ey - sy) * 0.5)} ${fx(sx)},${fx(sy + w)} Z `;
    }
    if (hash(seed + i * 7.7) > 0.3) {
      const pl = 18 * b.s * (0.8 + 0.4 * hash(seed + i * 8.3)), pw = 3.2 * b.s;
      const cx = tx + Math.sin(lean) * pl * 0.36, cy = ty - Math.cos(lean) * pl * 0.36;
      plumes += ellPath(cx, cy, pl / 2, pw, deg(Math.atan2(-Math.cos(lean), Math.sin(lean)))) + ' ';
    }
  }
  return {leaves, plumes};
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
      <CloudLayer B={B} Z={-20000} yRef={yr} spacing={3000} elLo={-1.4} elHi={-1.9} size={260} seed={45} t={t} drift={0} lit={mix('#E9EFE2', M_HAZE, 0.3)} body={mix('#D9E4D6', M_HAZE, 0.4)} shade={mix('#C7D6CC', M_HAZE, 0.4)} keep={0.9} flat={0.22} />
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
    const sp = 560 + ri * 60;
    lat(a, b, sp).forEach((k) => {
      const sd = k * 11.3 + ri * 71.1 + 3;
      if (hash(sd) < 0.25) return;
      const x = k * sp + (hash(sd + 1) - 0.5) * sp * 0.6;
      const zz = ri === 3 ? farBank(x) - 60 - 60 * hash(sd + 4) : z + (hash(sd + 2) - 0.5) * 200;
      const bp = proj(B, [x, Y, zz]);
      const h = 150 + 90 * hash(sd + 3);
      const {leaves, plumes} = reedClump(bp, h, sd, 0.04 * Math.sin(t * 1.3 + x * 0.004), 9 + Math.floor(hash(sd + 5) * 5));
      const k2 = 0.25 + 0.2 * (1 - ri / 3);
      clumps.push(
        <g key={`${ri}_${k}`}>
          <path d={leaves} fill={mix(ri % 2 ? '#7E9C55' : '#6F9150', M_HAZE, k2)} />
          <path d={plumes} fill={mix('#B59C80', M_HAZE, k2)} />
        </g>,
      );
    });
  });
  const yE = edge.reduce((a, p) => a + p.y, 0) / Math.max(1, edge.length);
  const yB = bank.reduce((a, p) => a + p.y, 0) / Math.max(1, bank.length);
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
      if (hash(sd + 6) > 0.86) {
        pools.push(groundEllipse(B, [x, Y + 0.5, zz], 50 + 60 * hash(sd + 7), 22 + 30 * hash(sd + 8), '#9CCAD6', `p${ri}_${k}`));
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
/** in front of the drone: tall reed and grass heads close to the camera, only in the bottom band (they sweep past with
 *  the tracking camera, smeared and out of focus) */
export const MeadowFront: React.FC<Env> = ({B, t}) => {
  const Y = MEADOW.groundY;
  const zF = 240;
  const [lo, hi] = spanX(B, zF, 250);
  const sp = 210;
  const items: React.ReactNode[] = [];
  let dsum = 0, n = 0;
  lat(lo, hi, sp).forEach((k) => {
    const sd = k * 9.7 + 5;
    if (hash(sd) < 0.3) return;
    const x = k * sp + (hash(sd + 1) - 0.5) * sp * 0.5;
    const z = zF + (hash(sd + 2) - 0.5) * 120;
    const b = proj(B, [x, Y, z]);
    if (b.z < 30) return;
    dsum += b.z;
    n++;
    const h = 175 + 40 * hash(sd + 3);
    const {leaves, plumes} = reedClump(b, h, sd, 0.05 * Math.sin(t * 1.7 + k), 6);
    for (const u of [1, 0.5, 0]) {
      const dx = FIELD.V * (1 / 60) * u * b.s; // the tracking camera's shutter smear
      items.push(
        <g key={`${k}_${u}`} transform={`translate(${fx(dx)},0)`} opacity={u === 0 ? 1 : u === 0.5 ? 0.4 : 0.2}>
          <path d={leaves} fill="#55703F" />
          <path d={plumes} fill="#8C7660" />
        </g>,
      );
    }
  });
  if (!items.length) return null;
  return <Soft px={coc(B, dsum / n, MEADOW_A) * 1.4}>{items}</Soft>;
};

// ================================================================== SKY (final callback)
/** open sky in warmer late light: soft clouds in layers and a low, distant treeline */
export const SKY = {yRef: 100};
const SKY_A = 0.7;
const S_HAZE = '#F2DEC0';
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
        <CloudLayer B={B} Z={-500000} yRef={yr} spacing={52000} elLo={-1.0} elHi={-5.4} size={11000} seed={21} t={t} drift={600} lit="#FFF6E6" body="#F7E9DA" shade="#D9C9CF" keep={0.62} flat={0.42} />
      </Soft>
      <Soft px={coc(B, 1e5, SKY_A)}>
        <path d={ridge(B, -260000, yr, (x) => -7.7 + 0.3 * noise1(x / 50000, 64), -16)} fill={mix('#9DB2B0', S_HAZE, 0.45)} />
        <path d={ridge(B, Zt, yr, (x) => trees(x) - 0.28, -16)} fill={mix('#56724F', S_HAZE, 0.38)} />
        <path d={blobsPath(cr)} fill={mix('#56724F', S_HAZE, 0.38)} />
        <path d={blobsPath(hl)} fill={mix('#8DA06A', S_HAZE, 0.36)} />
      </Soft>
      <Soft px={coc(B, 1.5e5, SKY_A) * 1.4}>
        <CloudLayer B={B} Z={-150000} yRef={yr} spacing={26000} elLo={-3.4} elHi={-6.6} size={4200} seed={22} t={t} drift={400} lit="#FFF3E2" body="#F5E3D2" shade="#D7C2C6" keep={0.5} flat={0.36} />
      </Soft>
    </g>
  );
};
