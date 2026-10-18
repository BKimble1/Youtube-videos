// Drawing primitives for fire and smoke in the illustrated cel style. Pure functions of screen geometry, seed and film
// time (no state), shared by world/atmos.tsx (the city's fires and plumes) and fx/smoke.tsx (canister smoke, blast
// columns), so every fire and every smoke in the film has one look.
//
//   flameMass(buf, x, y, W, H, seed, t, lean, detail)   one flame mass appended to a FlameBuf (several tongues in three
//                                                        tones over a dark-red bed, licks breaking off the tips)
//   flameEls(buf, key, x, y, H, palette, energy)        the buffered flames as SVG (bed, outer, licks, mid, core)
//   billowPath(x, y, r, seed, n, sx, sy, rot)            a cauliflower billow outline
//   plumeEl(c, spec, t, key)                             a smoke plume: one connected billowing silhouette that grows
//                                                        from its source, rises, bends with the wind and breaks up
import React from 'react';
import {V3, rnd, noise, clamp, smooth, add3, mul3, norm3} from '../../kit/math';
import {SpriteCtx, project, mix, View} from '../engine';
import {WIND} from './plan';

export const f1 = (n: number) => (Math.round(n * 10) / 10).toString();
const TAU = Math.PI * 2;
// shape coordinates: tenths of a pixel for large shapes, whole pixels for small ones (half the markup, same picture)
let PREC = 10;
const fq = (n: number) => (PREC === 1 ? Math.round(n).toString() : (Math.round(n * 10) / 10).toString());

// ================================================================== flames
export type FlameBuf = {bed: string; outer: string; mid: string; core: string; licks: string};
export const flameBuf = (): FlameBuf => ({bed: '', outer: '', mid: '', core: '', licks: ''});

/**
 * One flame tongue (screen px): base centre (x, y), base width w, height h (upward), centre-line offsets b1 (at 0.35 h),
 * b2 (at 0.7 h) and bt (the tip), asymmetry a (−0.5..0.5 widens one flank). Rounded foot, S-bent body, sharp tip.
 */
const tongue = (x: number, y: number, w: number, h: number, b1: number, b2: number, bt: number, a: number) => {
  const hl = (w / 2) * (1 + a), hr = (w / 2) * (1 - a);
  const y1 = y - h * 0.38, y2 = y - h * 0.72, yt = y - h;
  const x1 = x + b1, x2 = x + b2, xt = x + bt;
  return `M${fq(x - hl)} ${fq(y)}C${fq(x - hl * 1.12)} ${fq(y - h * 0.18)} ${fq(x1 - hl * 1.0)} ${fq(y1 + h * 0.12)} ${fq(x1 - hl * 0.84)} ${fq(y1)}`
    + `C${fq(x1 - hl * 0.7)} ${fq(y1 - h * 0.13)} ${fq(x2 - hl * 0.6)} ${fq(y2 + h * 0.12)} ${fq(x2 - hl * 0.42)} ${fq(y2)}`
    + `C${fq(x2 - hl * 0.26)} ${fq(y2 - h * 0.13)} ${fq(xt - w * 0.1)} ${fq(yt + h * 0.1)} ${fq(xt)} ${fq(yt)}`
    + `C${fq(xt + w * 0.06)} ${fq(yt + h * 0.12)} ${fq(x2 + hr * 0.3)} ${fq(y2 - h * 0.12)} ${fq(x2 + hr * 0.42)} ${fq(y2)}`
    + `C${fq(x2 + hr * 0.6)} ${fq(y2 + h * 0.12)} ${fq(x1 + hr * 0.7)} ${fq(y1 - h * 0.13)} ${fq(x1 + hr * 0.84)} ${fq(y1)}`
    + `C${fq(x1 + hr * 1.0)} ${fq(y1 + h * 0.12)} ${fq(x + hr * 1.12)} ${fq(y - h * 0.18)} ${fq(x + hr)} ${fq(y)}`
    + `Q${fq(x)} ${fq(y + h * 0.06)} ${fq(x - hl)} ${fq(y)}Z`;
};
/** A detached lick: a small tear pointing up (or bent by the wind). */
const lick = (x: number, y: number, w: number, h: number, bend: number) =>
  `M${fq(x + bend)} ${fq(y - h * 0.62)}C${fq(x + w * 0.3)} ${fq(y - h * 0.2)} ${fq(x + w * 0.52)} ${fq(y + h * 0.18)} ${fq(x)} ${fq(y + h * 0.38)}`
  + `C${fq(x - w * 0.52)} ${fq(y + h * 0.18)} ${fq(x - w * 0.3)} ${fq(y - h * 0.2)} ${fq(x + bend)} ${fq(y - h * 0.62)}Z`;
/** The burning bed under a flame mass: a low dark-red band with an uneven top. */
const bed = (x: number, y: number, hw: number, hh: number, seed: number, t: number) => {
  const n = 6;
  const P: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const lift = i === 0 || i === n - 1 ? 0.25 : 0.65 + 0.5 * rnd(seed * 3 + i) + 0.2 * noise(t * 1.3 + i * 1.7, seed + i);
    P.push([x - hw + 2 * hw * u, y - hh * lift]);
  }
  let d = `M${fq(x - hw)} ${fq(y + hh * 0.25)}L${fq(P[0][0])} ${fq(P[0][1])}`;
  for (let i = 1; i < n; i++) {
    const a = P[i - 1], b = P[i];
    d += `Q${fq((a[0] + b[0]) / 2)} ${fq(Math.min(a[1], b[1]) - hh * 0.35)} ${fq(b[0])} ${fq(b[1])}`;
  }
  return d + `L${fq(x + hw)} ${fq(y + hh * 0.25)}Q${fq(x)} ${fq(y + hh * 0.6)} ${fq(x - hw)} ${fq(y + hh * 0.25)}Z`;
};

type TS = {n: number; span: number; hLo: number; hHi: number; wK: number; aspect: number; licks: boolean; leanK: number};
/**
 * Tongues of one tone layer. Each tongue has its own base position (wandering slowly), height, flicker rate, lick
 * period and travelling bend wave — so a fire never pulses as one shape, and two fires never share a rhythm.
 */
const tongues = (x: number, y: number, W: number, H: number, o: TS, sd: number, t: number, lean: number, out: {d: string; l: string}) => {
  // a fractional count: tongue i sits at a golden-ratio position that does not depend on how many there are, and the
  // last one grows in with the fraction — so tongues are added smoothly as a flame grows on screen (no LOD pop)
  const nf = Math.max(1, o.n), n = Math.ceil(nf - 1e-6);
  const g0 = rnd(sd);
  for (let i = 0; i < n; i++) {
    const s = sd + i * 7;
    const part = i < n - 1 ? 1 : nf - (n - 1);
    let u = nf <= 1 ? (rnd(s) - 0.5) * 0.25 : ((g0 + i * 0.6180339) % 1) - 0.5 + (rnd(s) - 0.5) * 0.12;
    u += noise(t * 0.27 + s * 0.13, s + 1) * 0.05;
    const xi = x + u * W * o.span;
    const cent = clamp(1 - Math.abs(u) * 1.25, 0.35, 1);
    const hf = (o.hLo + (o.hHi - o.hLo) * (0.25 + 0.75 * rnd(s + 1))) * (0.6 + 0.4 * cent);
    const fr = 1.3 + rnd(s + 2) * 1.7;
    const ph = t * fr + rnd(s + 3) * 20;
    const fl = 0.8 + 0.18 * noise(ph, s + 4) + 0.08 * noise(ph * 2.9, s + 5);
    const P = 0.36 + rnd(s + 6) * 0.44; // lick period (s)
    const cyc = (((t / P + rnd(s + 7) * 7) % 1) + 1) % 1;
    const shrink = o.licks ? 0.82 + 0.18 * smooth(cyc / 0.45) : 1; // the tongue drops back as a lick breaks away
    const full = H * hf * fl * (0.25 + 0.75 * part);
    const hi = full * shrink;
    const wi = Math.min(Math.max((W / Math.max(1, nf)) * o.wK * (0.8 + 0.4 * rnd(s + 8)), H * 0.12), hi * o.aspect) * (0.4 + 0.6 * part);
    const A = (0.08 + 0.1 * rnd(s + 9)) * hi;
    const fw = 0.9 + rnd(s + 10) * 1.0, pw = rnd(s + 11) * TAU;
    const ln = lean * o.leanK;
    const bend = (v: number) => A * Math.sin(TAU * (t * fw - v * 0.85) + pw) * v + ln * hi * v * v;
    out.d += tongue(xi, y, wi, hi, bend(0.35), bend(0.7), bend(1), (rnd(s + 12) - 0.5) * 0.6);
    if (o.licks && part > 0.6 && rnd(s + 15) < 0.5) {
      const k = cyc;
      const lw = wi * 0.3 * Math.pow(1 - k, 0.75);
      if (lw > 0.45) {
        const rise = k * H * (0.2 + 0.22 * rnd(s + 14));
        const lx = xi + bend(1) + ln * rise * 0.9 + noise(t * 2.1 + s, s + 13) * wi * 0.12;
        out.l += lick(lx, y - full - rise, lw * 0.85, Math.max(lw * 2.2, full * 0.26 * (1 - k)), ln * lw * 0.8 + noise(t * 3 + s, s + 16) * lw * 0.3);
      }
    }
  }
};

/**
 * Append one flame mass to the buffers: base centre (x, y) px, bed width W and flame height H in px, seed, film time,
 * lean (screen-x offset per px of height: the wind), detail 0 (tiny) .. 2 (close). Each tone layer is a few short,
 * wide base tongues (an uneven, peaked body) under taller tongues; the inner layers have their own tongues (not
 * scaled copies), so the core reads as a hot pool low in the fire, not a nested triangle.
 */
export const flameMass = (b: FlameBuf, x: number, y: number, W: number, H: number, seed: number, t: number, lean: number, detail: 0 | 1 | 2) => {
  if (H < 0.8) return;
  PREC = H < 30 ? 1 : 10;
  const ratio = Math.min(1.8, W / Math.max(1, H));
  // tongue counts grow continuously with the flame's size on screen (a 20 px flame does not need twenty tongues)
  const densK = 0.45 + 0.55 * smooth((H - 8) / 70);
  const nO = detail === 0 ? (ratio > 1.2 ? 2 : 1) : clamp((2 + ratio * 1.6) * densK, 1.5, 6);
  const nB = clamp((1.5 + ratio) * densK, 1, 4);
  const o = {d: '', l: ''};
  if (detail === 0) {
    // tiny (far window flames, distant debris): one or two tongues and a hot core
    tongues(x, y, W, H, {n: nO, span: 0.86, hLo: 0.55, hHi: 1, wK: 2, aspect: 0.7, licks: false, leanK: 1}, seed * 31 + 3, t, lean, o);
    b.outer += o.d;
    const c0 = {d: '', l: ''};
    tongues(x, y, W, H, {n: 1, span: 0.3, hLo: 0.2, hHi: 0.36, wK: 0.9, aspect: 0.8, licks: false, leanK: 0.5}, seed * 59 + 9, t, lean, c0);
    b.core += c0.d;
    return;
  }
  b.bed += bed(x, y, W * 0.5, Math.max(1, H * 0.06), seed, t);
  tongues(x, y, W, H, {n: nB, span: 0.72, hLo: 0.3, hHi: 0.52, wK: 2.6, aspect: 1.25, licks: false, leanK: 0.6}, seed * 37 + 1, t, lean, o);
  tongues(x, y, W, H, {n: nO, span: 0.84, hLo: 0.5, hHi: 1.0, wK: 1.9, aspect: 0.62, licks: true, leanK: 1}, seed * 31 + 3, t, lean, o);
  b.outer += o.d;
  b.licks += o.l;
  const m = {d: '', l: ''};
  tongues(x, y, W, H, {n: Math.max(1, nB - 1), span: 0.56, hLo: 0.2, hHi: 0.36, wK: 2.4, aspect: 1.2, licks: false, leanK: 0.5}, seed * 41 + 2, t, lean, m);
  tongues(x, y, W, H, {n: Math.max(1, nO - 1), span: 0.6, hLo: 0.36, hHi: 0.64, wK: 1.7, aspect: 0.6, licks: detail > 1, leanK: 0.8}, seed * 47 + 5, t, lean, m);
  b.mid += m.d;
  b.licks += m.l;
  const c = {d: '', l: ''};
  tongues(x, y, W, H, {n: Math.max(1, nB - 1), span: 0.4, hLo: 0.1, hHi: 0.2, wK: 2.2, aspect: 1.3, licks: false, leanK: 0.4}, seed * 53 + 4, t, lean, c);
  tongues(x, y, W, H, {n: Math.max(1, nO - 2), span: 0.4, hLo: 0.2, hHi: 0.34, wK: 1.6, aspect: 0.62, licks: false, leanK: 0.5}, seed * 59 + 9, t, lean, c);
  b.core += c.d;
};

export type FlamePalette = {bed: string; base: string; outer: string; tip: string; mid: string; core: string};
const PAL: Record<'normal' | 'red' | 'hot', FlamePalette> = {
  normal: {bed: '#6A1C14', base: '#9C2C1C', outer: '#E0502A', tip: '#F57A2E', mid: '#FF9F3C', core: '#FFD772'},
  red: {bed: '#4E1611', base: '#7E2318', outer: '#B8391F', tip: '#D9582A', mid: '#E9793A', core: '#F5B25C'},
  hot: {bed: '#7A2416', base: '#B83A20', outer: '#F0682C', tip: '#FF9A3C', mid: '#FFC14E', core: '#FFF0BC'},
};
/** The flame palette for a heat bias (−1 fierce .. 0 .. 1 smouldering), hazed toward `fog` by `fogK`. */
export const flamePalette = (heat: number, fog: string, fogK: number): FlamePalette => {
  const p = heat > 0.4 ? PAL.red : heat < -0.2 ? PAL.hot : PAL.normal;
  if (fogK <= 0.003) return p;
  const m = (c: string) => mix(c, fog, fogK);
  return {bed: m(p.bed), base: m(p.base), outer: m(p.outer), tip: m(p.tip), mid: m(p.mid), core: m(p.core)};
};

/**
 * The buffered flames as SVG. (y0 → y0 − H) spans the gradient on the outer layer: dark red at the foot, warm orange
 * toward the edges and tips. `glow` adds a soft halo (rx, ry px) behind — kept small: it is light on the air, not a wash.
 */
export const flameEls = (b: FlameBuf, key: string, x: number, y0: number, H: number, P: FlamePalette, glow?: {rx: number; ry: number; op: number; cy?: number}) => {
  const gid = `fl_${key}`.replace(/[^a-zA-Z0-9_]/g, 'm');
  return (
    <g>
      <defs>
        <linearGradient id={`${gid}o`} x1={0} y1={f1(y0)} x2={0} y2={f1(y0 - Math.max(2, H))} gradientUnits="userSpaceOnUse">
          <stop offset={0} stopColor={P.base} />
          <stop offset={0.32} stopColor={P.outer} />
          <stop offset={1} stopColor={P.tip} />
        </linearGradient>
        {glow && glow.op > 0.01 && (
          <radialGradient id={`${gid}g`}>
            <stop offset={0} stopColor={P.mid} stopOpacity={glow.op} />
            <stop offset={0.5} stopColor={P.outer} stopOpacity={glow.op * 0.35} />
            <stop offset={1} stopColor={P.outer} stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      {glow && glow.op > 0.01 && <ellipse cx={f1(x)} cy={f1(glow.cy ?? y0 - H * 0.35)} rx={f1(glow.rx)} ry={f1(glow.ry)} fill={`url(#${gid}g)`} />}
      {b.bed && <path d={b.bed} fill={P.bed} />}
      {b.outer && <path d={b.outer} fill={`url(#${gid}o)`} />}
      {b.licks && <path d={b.licks} fill={P.tip} />}
      {b.mid && <path d={b.mid} fill={P.mid} />}
      {b.core && <path d={b.core} fill={P.core} />}
    </g>
  );
};

// ================================================================== billows
/**
 * A cauliflower billow outline (screen px) around (x, y): n lobes bulging between cusps, radius r, scaled (sx, sy) in a
 * frame rotated by rot (radians). Lobe radii from the seed, so neighbouring billows never repeat.
 */
export const billowPath = (x: number, y: number, r: number, seed: number, n = 6, sx = 1, sy = 1, rot = 0): string => {
  PREC = r < 26 ? 1 : 10;
  const a0 = rnd(seed * 13 + 1) * TAU;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const pt = (a: number, rr: number) => {
    const lx = Math.cos(a) * rr * sx, ly = Math.sin(a) * rr * sy;
    return `${fq(x + lx * cr - ly * sr)} ${fq(y + lx * sr + ly * cr)}`;
  };
  const va: number[] = [];
  for (let i = 0; i < n; i++) va.push(a0 + (i / n) * TAU + (rnd(seed * 7 + i) - 0.5) * (2.2 / n));
  let d = `M${pt(va[0], r * (0.72 + 0.12 * rnd(seed * 17)))}`;
  for (let i = 0; i < n; i++) {
    const a = va[i], b = i + 1 < n ? va[i + 1] : va[0] + TAU;
    const rv = r * (0.72 + 0.12 * rnd(seed * 17 + ((i + 1) % n)));
    d += `Q${pt((a + b) / 2, r * (1.1 + 0.32 * rnd(seed * 29 + i)))} ${pt(b, rv)}`;
  }
  return d + 'Z';
};

// ================================================================== plumes
export type PlumeSpec = {
  base: V3;
  /** column rise (m); negative = billows sinking (collapse dust rolling down) */
  rise: number;
  /** horizontal travel of the column top along `dir` (m) */
  drift: number;
  /** drift direction (horizontal; default WIND) */
  dir?: V3;
  /** billow radius at the source and at the column top (m) */
  r0: number;
  r1: number;
  /** 0 pale dust .. 0.6 grey-brown .. 1 black oily */
  soot: number;
  /** overall opacity */
  alpha: number;
  /** fire-lit warm underside 0..1 */
  warm?: number;
  /** billow travel speed along the column (m/s; default from the rise) */
  speed?: number;
  /** share of the column that exists yet (a plume growing from its source), 0..1 */
  grow?: number;
  /** length of the broken-up top beyond the column (share of the column; default 0.4) */
  tail?: number;
  seed: number;
  /** vertical squash of the billows (low banks, the smoke ceiling: < 1) */
  flat?: number;
  /** meander amplitude (share of r1; default 0.3) */
  wander?: number;
  /** cap on the opacity (e.g. a shot keeping a veil of smoke light) */
  nearCap?: number;
  /** clear distance (m) kept round the lens: billows closer than this to the camera melt away (default 2.5) */
  nearClear?: number;
};

type SB = {x: number; y: number; z: number; k: number; r: number; u: number; sd: number};

const spine = (p: PlumeSpec, s: number, t: number, len: number): V3 => {
  const dir = p.dir ?? WIND;
  const dh = norm3({x: dir.x, y: 0, z: dir.z});
  const L = {x: -dh.z, y: 0, z: dh.x};
  const rp = s <= 1 ? s * (1.3 - 0.3 * s) : 1 + (s - 1) * 0.45;
  const dp = s <= 1 ? Math.pow(s, 1.35) : 1 + 1.35 * (s - 1);
  const sp = p.speed ?? Math.max(0.3, Math.abs(p.rise) * 0.12);
  const m = (p.wander ?? 0.3) * p.r1 * noise(s * 1.6 - (t * sp) / Math.max(1, len) * 0.35 + p.seed * 0.71, p.seed) * Math.min(1, s * 1.5);
  return {
    x: p.base.x + dh.x * p.drift * dp + L.x * m,
    y: p.base.y + p.rise * rp,
    z: p.base.z + dh.z * p.drift * dp + L.z * m,
  };
};
const radiusAt = (p: PlumeSpec, s: number) => (s <= 1 ? p.r0 + (p.r1 - p.r0) * Math.pow(Math.max(0, s), 0.75) : p.r1 * (1 + 0.45 * (s - 1)));

/** World point of a plume's column at s (0 source .. 1 top) — for sorting and occlusion tests. */
export const plumePoint = (p: PlumeSpec, s: number, t: number) => spine(p, s, t, Math.hypot(p.rise, p.drift) * 1.1 + 1);

/**
 * A smoke plume as one connected silhouette: a ribbon along the column plus billows that travel up it at the rise
 * speed (so the outline rolls upward), grow from the source, bend downwind and, past the top, break into separate
 * shrinking billows that fade. Three tones: a soft outer step, the body (shadow side), the sun-lit caps; oily smoke
 * gets a dark core near the source, fire smoke a warm underside. One group opacity: no ring edges where billows overlap.
 */
export const plumeEl = (c: SpriteCtx, p: PlumeSpec, t: number, key: string): React.ReactElement | null => {
  const v: View = c.view;
  const len = Math.hypot(p.rise, p.drift) * 1.1 + 1;
  const g = clamp(p.grow ?? 1, 0, 1);
  if (g <= 0.01) return null;
  const tail = g >= 1 ? p.tail ?? 0.4 : 0;
  const sp = p.speed ?? Math.max(0.3, Math.abs(p.rise) * 0.12);
  const flat = p.flat ?? 1;
  // billow coordinate σ(s): billows sit one local radius apart (dense and small at the source, wide aloft) and travel
  // up the column, leaving the source at `speed` m/s
  const sEnd = g + tail;
  const NS = 40;
  const sig: number[] = [0];
  const spacing = (s: number) => 1.05 * radiusAt(p, s) * (s > 1 ? 1.2 : 1);
  for (let i = 1; i <= NS; i++) {
    const s0 = ((i - 1) / NS) * 1.4, s1 = (i / NS) * 1.4;
    sig.push(sig[i - 1] + (len * (s1 - s0)) / Math.max(0.2, spacing((s0 + s1) / 2)));
  }
  const sigOf = (s: number) => { const x = clamp(s / 1.4) * NS, i = Math.min(NS - 1, Math.floor(x)); return sig[i] + (sig[i + 1] - sig[i]) * (x - i); };
  const sOf = (q: number) => {
    let lo = 0, hi = NS;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (sig[m] <= q) lo = m; else hi = m; }
    return ((lo + (q - sig[lo]) / Math.max(1e-6, sig[lo + 1] - sig[lo])) / NS) * 1.4;
  };
  const sigMax = sigOf(sEnd);
  const sigFull = sigOf(1 + (p.tail ?? 0.4));
  const step = sigFull > 26 ? sigFull / 26 : 1; // never more than ~26 billows (huge columns get wider spacing); fixed per plume, so nothing jumps while it grows
  const tau = (t * sp) / Math.max(0.2, spacing(0)) / step;
  // billows (screen)
  const B: SB[] = [];
  const jLo = Math.ceil(tau - sigMax / step), jHi = Math.floor(tau);
  let rmax = 0, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9; // (screen bounds: cull)
  for (let j = jLo; j <= jHi; j++) {
    const u = sOf((tau - j) * step);
    if (u < 0 || u > sEnd) continue;
    const sd = p.seed * 1009 + j * 31;
    const R = radiusAt(p, u);
    const tailK = u > g ? (u - g) / Math.max(1e-3, tail) : 0;
    const birth = u < 0.06 ? 0.55 + 0.45 * smooth(u / 0.06) : 1;
    const rb = R * (0.8 + 0.4 * rnd(sd + 2)) * (1 - 0.5 * tailK) * birth;
    let w = spine(p, u, t, len);
    const dh = norm3({x: (p.dir ?? WIND).x, y: 0, z: (p.dir ?? WIND).z});
    const jl = (rnd(sd) - 0.5) * 0.45 * R, jv = (rnd(sd + 1) - 0.5) * 0.24 * R * flat;
    w = {x: w.x - dh.z * jl, y: w.y + jv, z: w.z + dh.x * jl};
    const q = project(v, w);
    const dist = Math.hypot(w.x - v.pos.x, w.y - v.pos.y, w.z - v.pos.z);
    // billows passing the lens melt away (they shrink to nothing near it): smoke never sits on the
    // lens as a translucent sheet, and faces / limbs close to the camera keep their contrast. The rest stays solid.
    // (the clear zone grows with the billow: a camera flying past a 40 m billow sees it recede, not swallow the lens)
    const near = smooth((dist - rb * 1.05 - Math.max(p.nearClear ?? 2.5, rb * 0.6)) / (6 + rb * 0.6));
    if (q.z < v.near + rb * 0.4 || near <= 0.02) continue;
    const r = rb * q.k * near;
    if (r < 0.5) continue;
    B.push({x: q.x, y: q.y, z: q.z, k: q.k, r, u, sd});
    rmax = Math.max(rmax, r);
    minX = Math.min(minX, q.x - r * 1.3); maxX = Math.max(maxX, q.x + r * 1.3);
    minY = Math.min(minY, q.y - r * 1.3); maxY = Math.max(maxY, q.y + r * 1.3);
    // the broken top: a trailing companion billow
    if (tailK > 0.1) {
      const w2 = add3(w, add3(mul3(dh, R * 0.8 * smooth((tailK - 0.1) / 0.5)), {x: 0, y: R * 0.25 * flat, z: 0}));
      const q2 = project(v, w2);
      const r2 = r * 0.55 * smooth((tailK - 0.1) / 0.25);
      if (q2.z > v.near && r2 > 0.5) B.push({x: q2.x, y: q2.y, z: q2.z, k: q2.k, r: r2, u: u + 0.02, sd: sd + 17});
    }
  }
  if (!B.length) return null;
  if (maxX < -60 || minX > v.W + 60 || maxY < -60 || minY > v.H + 60) return null;
  // opacity: smoke stays dense (no translucent sheets); it thins by breaking up and by billows melting near the lens
  let a = p.alpha;
  if (p.nearCap !== undefined) a = Math.min(a, p.nearCap);
  if (a < 0.015) return null;
  const detail = rmax < 7 ? 0 : rmax < 45 ? 1 : 2;
  // a short neck at the source joins the plume to its flames
  let rib = '';
  const L: string[] = [], Rr: string[] = [];
  const pts: {x: number; y: number; k: number; s: number}[] = [];
  const sTop = Math.min(g, 0.08);
  for (let i = 0; i <= 2; i++) {
    const s = (i / 2) * sTop;
    const q = project(v, spine(p, s, t, len));
    if (q.z < v.near + 0.3) continue;
    pts.push({x: q.x, y: q.y, k: q.k, s});
  }
  for (let i = 0; i < pts.length; i++) {
    const a0 = pts[Math.max(0, i - 1)], a1 = pts[Math.min(pts.length - 1, i + 1)];
    let tx = a1.x - a0.x, ty = a1.y - a0.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const hw = radiusAt(p, pts[i].s) * 0.5 * pts[i].k;
    L.push(`${f1(pts[i].x - ty * hw)} ${f1(pts[i].y + tx * hw)}`);
    Rr.push(`${f1(pts[i].x + ty * hw)} ${f1(pts[i].y - tx * hw)}`);
  }
  void rib; void L; void Rr; // (the billows start small at the source; no straight-edged neck)
  // tones: the body in the LIT tone, then the same silhouette pushed away from the sun in the SHADOW tone and clipped
  // to the body — a lit rim stays along the sun side of every billow on the outline (the cel look of a lit cloud);
  // mid-tone caps give the inside its billows; oily smoke a dark core at the source; fire smoke a warm underside.
  const fogK = c.lit.fog;
  const soot = clamp(p.soot);
  const dark = mix('#2A2424', '#A89F94', 1 - soot);
  const shade = mix(mix(dark, c.light.ambient, 0.14), c.light.fogColor, 0.08 + fogK * 0.55);
  const litC = mix(mix(dark, mix('#EFE5D8', c.light.sunColor, 0.45), 0.16 + 0.3 * (1 - soot)), c.light.fogColor, 0.08 + fogK * 0.55);
  const midC = mix(shade, litC, 0.45);
  const coreC = mix('#141112', c.light.fogColor, 0.06 + fogK * 0.6);
  const warmC = mix('#B9512C', c.light.fogColor, fogK * 0.5);
  // sun direction on screen (lit caps sit on that side)
  const bq = project(v, p.base), sq = project(v, add3(p.base, mul3(norm3(c.light.sun), Math.max(1, p.r1))));
  let hx = sq.x - bq.x, hy = sq.y - bq.y;
  const hl = Math.hypot(hx, hy);
  if (hl < 1e-3 || bq.z < v.near) { hx = -0.7; hy = -0.7; } else { hx /= hl; hy /= hl; }
  hy = Math.min(hy, -0.3); // light comes from above more than below
  const hn = Math.hypot(hx, hy); hx /= hn; hy /= hn;
  let body = rib, caps = '', warm = '';
  let rsum = 0;
  B.forEach((b) => {
    const rot = rnd(b.sd + 3) * TAU + t * 0.06 * (rnd(b.sd + 4) - 0.5);
    const lobes = 5 + (rnd(b.sd + 8) < 0.5 ? 1 : 0); // per billow, never by screen size (no pop when the camera moves)
    body += billowPath(b.x, b.y, b.r, b.sd, lobes, 1, flat, rot);
    rsum += b.r;
    const capK = b.u <= g ? 1 : 1 - smooth((b.u - g) / Math.max(1e-3, tail * 0.5));
    if (detail > 0 && capK > 0.05 && (detail === 2 || rnd(b.sd + 6) < 0.7)) caps += billowPath(b.x + hx * b.r * 0.3, b.y + hy * b.r * 0.3, b.r * 0.5 * capK, b.sd + 5, lobes - 1, 1, flat, rot);
    if ((p.warm ?? 0) > 0 && b.u < 0.2) warm += billowPath(b.x - hx * b.r * 0.15, b.y + b.r * 0.32, b.r * 0.55 * (1 - smooth((b.u - 0.1) / 0.1)), b.sd + 9, lobes - 1, 1, flat, rot);
  });
  const sh = clamp((rsum / B.length) * 0.13, 0.6, 60);
  // gradient along the column: dense at the source, thinning up the column, gone at the end of the broken top
  const s0 = pts[0] ?? {x: B[0].x, y: B[0].y};
  const eP = project(v, spine(p, g + tail, t, len));
  let ex = eP.x, ey = eP.y;
  if (Math.hypot(ex - s0.x, ey - s0.y) < 4 || eP.z < v.near) { ex = s0.x; ey = s0.y - Math.max(8, rmax * 3); }
  const gid = `pl_${key}`.replace(/[^a-zA-Z0-9_]/g, 'm');
  const topK = g / (g + tail);
  const stops = (col: string, k: number) => [
    <stop key="a" offset={0} stopColor={col} stopOpacity={k} />,
    <stop key="b" offset={f1(0.6 * topK)} stopColor={col} stopOpacity={k} />,
    <stop key="c" offset={f1(0.9 * topK)} stopColor={col} stopOpacity={0.95 * k} />,
    <stop key="d" offset={f1(topK)} stopColor={col} stopOpacity={0.86 * k} />,
    <stop key="e" offset={f1((1 + topK) / 2)} stopColor={col} stopOpacity={0.62 * k} />,
    <stop key="f" offset={1} stopColor={col} stopOpacity={0.12 * k} />,
  ];
  const core = soot > 0.6 && detail > 0 ? coreRibbon(p, t, len, v, Math.min(0.5, g)) : '';
  const grad = (id: string, col: string, k: number) => <linearGradient id={id} x1={f1(s0.x)} y1={f1(s0.y)} x2={f1(ex)} y2={f1(ey)} gradientUnits="userSpaceOnUse">{stops(col, k)}</linearGradient>;
  return (
    <g opacity={Math.round(a * 1000) / 1000}>
      <defs>
        {grad(`${gid}l`, litC, 1)}
        {grad(`${gid}s`, shade, 1)}
        {caps && grad(`${gid}m`, midC, 0.8)}
        <path id={`${gid}d`} d={body} />
        {detail > 0 && <clipPath id={`${gid}k`}><use href={`#${gid}d`} /></clipPath>}
        {core && (
          <linearGradient id={`${gid}c`} x1={f1(s0.x)} y1={f1(s0.y)} x2={f1(ex)} y2={f1(ey)} gradientUnits="userSpaceOnUse">
            <stop offset={0} stopColor={coreC} stopOpacity={0.85 * (soot - 0.4)} />
            <stop offset={f1(0.45 * topK)} stopColor={coreC} stopOpacity={0} />
          </linearGradient>
        )}
      </defs>
      <use href={`#${gid}d`} fill={`url(#${gid}${detail > 0 ? 'l' : 's'})`} />
      {detail > 0 && <g clipPath={`url(#${gid}k)`}><use href={`#${gid}d`} transform={`translate(${f1(-hx * sh)} ${f1(-hy * sh)})`} fill={`url(#${gid}s)`} /></g>}
      {caps && <path d={caps} fill={`url(#${gid}m)`} />}
      {core && <path d={core} fill={`url(#${gid}c)`} />}
      {warm && <path d={warm} fill={warmC} opacity={f1(0.3 * (p.warm ?? 0))} />}
    </g>
  );
};

/** The dark oily core near the source (a narrow ribbon). */
const coreRibbon = (p: PlumeSpec, t: number, len: number, v: View, sTop: number) => {
  const L: string[] = [], R: string[] = [];
  const n = 5;
  const pts: {x: number; y: number; k: number; s: number}[] = [];
  for (let i = 0; i <= n; i++) {
    const s = (i / n) * sTop;
    const q = project(v, spine(p, s, t, len));
    if (q.z < v.near + 0.3) continue;
    pts.push({x: q.x, y: q.y, k: q.k, s});
  }
  if (pts.length < 2) return '';
  for (let i = 0; i < pts.length; i++) {
    const a0 = pts[Math.max(0, i - 1)], a1 = pts[Math.min(pts.length - 1, i + 1)];
    let tx = a1.x - a0.x, ty = a1.y - a0.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const hw = radiusAt(p, pts[i].s) * 0.32 * pts[i].k * (1 + 0.25 * noise(pts[i].s * 3 - t * 0.4, p.seed + 3));
    L.push(`${f1(pts[i].x - ty * hw)} ${f1(pts[i].y + tx * hw)}`);
    R.push(`${f1(pts[i].x + ty * hw)} ${f1(pts[i].y - tx * hw)}`);
  }
  return `M${L.join('L')}L${R.reverse().join('L')}Z`;
};
