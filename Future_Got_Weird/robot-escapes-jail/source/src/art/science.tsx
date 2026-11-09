// Science visuals (S6 and reusable): the material's micro view (gallium grains + NdFeB magnetic microparticles), the
// cutaway lens (porthole with a clean ink rim), a big vertical thermometer gauge, a flat induction coil with its
// alternating-field arcs (WARM ORANGE = heat), a bar magnet with dipole field lines (CYAN = magnetic steering), short
// science labels, and the S6 -> S7 hand-off field line.
//
// Everything is screen-space SVG (px), a pure function of t. Every SVG id comes from uid().
//
// HAND-OFF (CONTRACTS.md S6 -> S7): <FieldLine d={FIELD_PATH} /> draws the line exactly as S6's last frames show it
// (stroke C.field, width 12, round caps, and the soft cyan glow). S7 can import FieldLine / FIELD_PATH / FIELD_GLOW so
// the glow is identical on both sides of the cut.
import React from 'react';
import {C, INK, NS} from './palette';
import {uid} from '../core/ids';
import {mix, rgba} from '../core/color';
import {clamp, hash, noise1} from '../lib';
import {LiquidMetal, V, smoothPath} from './liquid';

const f1 = (n: number) => (Math.abs(n) < 1e-4 ? '0' : n.toFixed(1));
export const FONT = '"Nunito Variable", "Nunito", system-ui, sans-serif';

// =====================================================================================================================
// THE FIELD LINE (S6 -> S7)
// =====================================================================================================================
export const FIELD_PATH = 'M 150 1420 C 360 1220, 700 1300, 930 960';
export const FIELD_BEZ: [V, V, V, V] = [{x: 150, y: 1420}, {x: 360, y: 1220}, {x: 700, y: 1300}, {x: 930, y: 960}];
/** the glow under the line: a blurred copy of the stroke (same on both sides of the cut) */
export const FIELD_GLOW = {width: 12, blur: 9, glowWidth: 22, glowOpacity: 0.85, color: C.field};

export const bez = (b: [V, V, V, V], u: number): V => {
  const m = 1 - u;
  const a = m * m * m, bb = 3 * m * m * u, c = 3 * m * u * u, d = u * u * u;
  return {x: a * b[0].x + bb * b[1].x + c * b[2].x + d * b[3].x, y: a * b[0].y + bb * b[1].y + c * b[2].y + d * b[3].y};
};
export const bezTan = (b: [V, V, V, V], u: number): V => {
  const m = 1 - u;
  const x = 3 * m * m * (b[1].x - b[0].x) + 6 * m * u * (b[2].x - b[1].x) + 3 * u * u * (b[3].x - b[2].x);
  const y = 3 * m * m * (b[1].y - b[0].y) + 6 * m * u * (b[2].y - b[1].y) + 3 * u * u * (b[3].y - b[2].y);
  const l = Math.hypot(x, y) || 1;
  return {x: x / l, y: y / l};
};
/** arc-length parametrisation: s in 0..1 (fraction of the length) -> bezier u */
const makeArc = (b: [V, V, V, V], n = 200) => {
  const L: number[] = [0];
  let p = bez(b, 0);
  for (let i = 1; i <= n; i++) {
    const q = bez(b, i / n);
    L.push(L[i - 1] + Math.hypot(q.x - p.x, q.y - p.y));
    p = q;
  }
  const total = L[n];
  return {
    total,
    u: (s: number) => {
      const target = clamp(s) * total;
      let lo = 0, hi = n;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (L[mid] < target) lo = mid;
        else hi = mid;
      }
      const seg = L[hi] - L[lo] || 1;
      return (lo + (target - L[lo]) / seg) / n;
    },
  };
};
export const FIELD_ARC = makeArc(FIELD_BEZ);
/** point / unit tangent at arc fraction s of FIELD_PATH */
export const fieldAt = (s: number) => {
  const u = FIELD_ARC.u(s);
  return {p: bez(FIELD_BEZ, u), tan: bezTan(FIELD_BEZ, u)};
};

/** The hand-off field line: stroke C.field, width 12, round caps, soft cyan glow. seg = the visible part as arc-length
 *  fractions [from, to] (default the whole line); pulse = travelling light dashes (0 = none). */
export const FieldLine: React.FC<{d?: string; opacity?: number; seg?: [number, number]; pulse?: number; t?: number}> = ({
  d = FIELD_PATH,
  opacity = 1,
  seg = [0, 1],
  pulse = 0,
  t = 0,
}) => {
  const a = clamp(seg[0]), b = clamp(seg[1]);
  if (opacity <= 0.002 || b - a <= 0.001) return null;
  const id = uid('fglow');
  const L = 1000; // pathLength (fractions of it are arc-length fractions)
  const full = a <= 0.0005 && b >= 0.9995;
  const dash = full ? undefined : `${f1((b - a) * L)} ${L * 3}`;
  const off = full ? undefined : f1(-a * L);
  const common = {d, fill: 'none', strokeLinecap: 'round' as const, pathLength: L, strokeDasharray: dash, strokeDashoffset: off};
  return (
    <g opacity={opacity}>
      <defs>
        <filter id={id} filterUnits="userSpaceOnUse" x="40" y="860" width="1000" height="660">
          <feGaussianBlur stdDeviation={FIELD_GLOW.blur} />
        </filter>
      </defs>
      <path {...common} stroke={FIELD_GLOW.color} strokeWidth={FIELD_GLOW.glowWidth} opacity={FIELD_GLOW.glowOpacity} filter={`url(#${id})`} />
      <path {...common} stroke={C.field} strokeWidth={FIELD_GLOW.width} />
      {pulse > 0.01 && (
        <path d={d} fill="none" stroke="#E8FBFF" strokeWidth={5} strokeLinecap="round" pathLength={L} strokeDasharray="26 140" strokeDashoffset={f1(-t * 260)} opacity={pulse * 0.85} />
      )}
    </g>
  );
};

// =====================================================================================================================
// BACKGROUND
// =====================================================================================================================
/** deep navy with a soft grid-free vignette (vig 0 = flat C.navy1) */
export const SciBg: React.FC<{vig?: number; cx?: number; cy?: number}> = ({vig = 1, cx = 540, cy = 930}) => {
  const id = uid('sbg');
  return (
    <g>
      <rect width={1080} height={1920} fill={C.navy1} />
      {vig > 0.002 && (
        <>
          <defs>
            <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={1250}>
              <stop offset="0" stopColor={C.navy2} stopOpacity={0.55} />
              <stop offset="0.45" stopColor={C.navy1} stopOpacity={0} />
              <stop offset="1" stopColor={C.navy0} stopOpacity={0.95} />
            </radialGradient>
          </defs>
          <rect width={1080} height={1920} fill={`url(#${id})`} opacity={vig} />
        </>
      )}
    </g>
  );
};

// =====================================================================================================================
// MICRO VIEW: gallium grains (silver spheres in a packed lattice) + NdFeB microparticles (dark angular grains, N/S)
// =====================================================================================================================
export const GRAIN = {sp: 104, r: 47};
type Site = {i: number; j: number; x: number; y: number; nd: boolean; k: number};
const NI = 13, NJ = 17;
const SITES: Site[] = (() => {
  const out: Site[] = [];
  let k = 0;
  for (let j = -NJ; j <= NJ; j++)
    for (let i = -NI; i <= NI; i++) {
      const x = (i + (j & 1 ? 0.5 : 0)) * GRAIN.sp;
      const y = j * GRAIN.sp * 0.866;
      // magnetic particles: ~1 in 9 sites, never two neighbours
      const h = hash(i * 37.13 + j * 101.7 + 3.1);
      const nd = h < 0.42 && ((i + 2 * j) % 3 + 3) % 3 === 0;
      out.push({i, j, x, y, nd, k: k++});
    }
  return out;
})();
/** a site's position in material coordinates (px at zoom 1): lattice + thermal jiggle + (melt) disorder and flow */
export const sitePos = (s: Site, t: number, heat: number, melt: number, flow: V): V => {
  const amp = 1.6 + 5 * clamp(heat) + 6 * melt;
  const jx = noise1(t * 5.2 + s.k * 0.71, 1) * amp, jy = noise1(t * 4.7 + s.k * 0.53, 2) * amp;
  // liquid: the lattice loses its order (random offsets, wandering) and the whole mass slides
  const dx = (hash(s.k * 1.7 + 0.3) - 0.5) * 0.62 * GRAIN.sp + noise1(t * 1.1 + s.k * 0.37, 3) * 0.22 * GRAIN.sp;
  const dy = (hash(s.k * 2.3 + 0.9) - 0.5) * 0.62 * GRAIN.sp + noise1(t * 1.0 + s.k * 0.29, 4) * 0.22 * GRAIN.sp;
  const m = clamp(melt);
  return {x: s.x + jx + m * (dx + flow.x), y: s.y + jy + m * (dy + flow.y)};
};

/** irregular angular grain polygon (local, radius ~1) */
const grainPoly = (k: number): V[] => {
  const n = 6 + Math.floor(hash(k * 3.3) * 2);
  const rot0 = hash(k * 5.1) * Math.PI * 2;
  return Array.from({length: n}, (_, q) => {
    const a = rot0 + (q / n) * Math.PI * 2 + (hash(k * 7.7 + q) - 0.5) * 0.5;
    const r = 0.78 + hash(k * 9.1 + q * 1.3) * 0.38;
    return {x: Math.cos(a) * r, y: Math.sin(a) * r};
  });
};
const GRAIN_POLYS = new Map<number, V[]>();
const grainOf = (k: number) => {
  let g = GRAIN_POLYS.get(k);
  if (!g) {
    g = grainPoly(k);
    GRAIN_POLYS.set(k, g);
  }
  return g;
};

/** One magnetic microparticle (NdFeB): dark angular grain with a red N end and a blue S end. */
export const NdGrain: React.FC<{c: V; r: number; k: number; ang: number; hi?: number; ids: {g: string}}> = ({c, r, k, ang, hi = 0, ids}) => {
  const poly = grainOf(k);
  const d = 'M' + poly.map((p) => `${f1(c.x + p.x * r)},${f1(c.y + p.y * r)}`).join('L') + 'Z';
  const clip = uid('ndc');
  const ca = Math.cos(ang), sa = Math.sin(ang);
  // the N and S end caps: half-planes across the grain's magnetisation axis
  const cap = (sgn: number) => {
    const o = {x: c.x + ca * r * 0.46 * sgn, y: c.y + sa * r * 0.46 * sgn};
    const R = r * 2;
    const px = -sa, py = ca;
    const a = {x: o.x + px * R, y: o.y + py * R}, b = {x: o.x - px * R, y: o.y - py * R};
    const a2 = {x: a.x + ca * R * sgn, y: a.y + sa * R * sgn}, b2 = {x: b.x + ca * R * sgn, y: b.y + sa * R * sgn};
    return `M${f1(a.x)},${f1(a.y)}L${f1(a2.x)},${f1(a2.y)}L${f1(b2.x)},${f1(b2.y)}L${f1(b.x)},${f1(b.y)}Z`;
  };
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={d} />
        </clipPath>
      </defs>
      {hi > 0.01 && <circle cx={f1(c.x)} cy={f1(c.y)} r={f1(r * (1.5 + 0.2 * hi))} fill="none" stroke={INK} strokeWidth={9} vectorEffect={NS} opacity={hi} />}
      {hi > 0.01 && <circle cx={f1(c.x)} cy={f1(c.y)} r={f1(r * (1.5 + 0.2 * hi))} fill="none" stroke={C.yellow} strokeWidth={5} vectorEffect={NS} opacity={hi} />}
      <path d={d} fill={`url(#${ids.g})`} />
      <g clipPath={`url(#${clip})`}>
        <path d={cap(1)} fill={C.north} opacity={0.95} />
        <path d={cap(-1)} fill={C.south} opacity={0.95} />
        {/* a facet: the lit upper-left face */}
        <path d={`M${f1(c.x - r)},${f1(c.y - r)}L${f1(c.x + r * 0.2)},${f1(c.y - r)}L${f1(c.x - r)},${f1(c.y + r * 0.1)}Z`} fill="#FFFFFF" opacity={0.16} />
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" vectorEffect={NS} />
    </g>
  );
};

/**
 * The material's micro view, centred on screen point (cx, cy), zoom z (1 = spheres of radius 47 px).
 * heat 0..1 = thermal jiggle + warm tint; melt 0..1 = solid lattice -> disordered, flowing liquid (the grains slide
 * past each other and merge into a liquid-metal sheet); clipR culls to a circle (lens) for speed.
 * hiNd 0..1 highlights the magnetic particles (yellow rings); flowT = time the liquid has been flowing.
 */
export const MaterialGrains: React.FC<{
  t: number; cx: number; cy: number; z: number; heat?: number; melt?: number; hiNd?: number; clipR?: number; drift?: V; flowT?: number;
}> = ({t, cx, cy, z, heat = 0, melt = 0, hiNd = 0, clipR = 2400, drift = {x: 0, y: 0}, flowT = 0}) => {
  const idS = uid('gaS'), idN = uid('gaN'), idW = uid('gaW');
  const m = clamp(melt);
  const flow = {x: flowT * 70, y: flowT * 38};
  const R = GRAIN.r * (1 - 0.06 * m);
  const pad = GRAIN.sp * z;
  const items = SITES.map((s) => {
    const p = sitePos(s, t, heat, m, flow);
    return {s, x: cx + (p.x + drift.x) * z, y: cy + (p.y + drift.y) * z};
  }).filter((q) => q.x > -pad && q.x < 1080 + pad && q.y > -pad && q.y < 1920 + pad && Math.hypot(q.x - cx, q.y - cy) < clipR + pad);
  const warm = clamp(heat);
  const sph = items.filter((q) => !q.s.nd);
  const nds = items.filter((q) => q.s.nd);
  // liquid sheet: the same grains, swollen, merged by the liquid-metal filter
  const liquidPts: V[][] = m > 0.02 ? sph.map((q) => circlePts(q.x, q.y, R * z * (0.9 + 0.8 * m), 12)) : [];
  const fl = Math.hypot(70, 38), fx = 70 / fl, fy = 38 / fl;
  const streaks = m > 0.05 ? Array.from({length: 6}, (_, k) => {
    const ph = (t * 0.55 + k / 6 + hash(k * 3.1) * 0.2) % 1;
    const along = (ph - 0.5) * clipR * 2.2, across = (hash(k * 7.9) - 0.5) * clipR * 1.5;
    const ox = cx + fx * along - fy * across, oy = cy + fy * along + fx * across;
    const Ls = clipR * 0.42;
    const pts: string[] = [];
    for (let q = 0; q <= 10; q++) {
      const u = q / 10 - 0.5;
      const w = Math.sin(u * 5 + t * 3 + k) * clipR * 0.03;
      pts.push(`${q ? 'L' : 'M'}${f1(ox + fx * u * Ls - fy * w)},${f1(oy + fy * u * Ls + fx * w)}`);
    }
    return {d: pts.join(''), a: Math.sin(Math.PI * ph)};
  }) : [];
  return (
    <g>
      <defs>
        <radialGradient id={idS} cx="0.5" cy="0.5" r="0.5" fx="0.33" fy="0.28">
          <stop offset="0" stopColor={mix(C.silverLit, '#FFE9D6', warm * 0.3)} />
          <stop offset="0.35" stopColor={mix(C.chrome, '#FFD9B8', warm * 0.22)} />
          <stop offset="0.72" stopColor={mix(C.silverMid, C.heat, warm * 0.12)} />
          <stop offset="1" stopColor={mix(C.silverDeep, C.heatDeep, warm * 0.2)} />
        </radialGradient>
        <radialGradient id={idN} cx="0.5" cy="0.5" r="0.6" fx="0.3" fy="0.25">
          <stop offset="0" stopColor="#56606F" />
          <stop offset="0.6" stopColor="#2F3744" />
          <stop offset="1" stopColor="#1A202A" />
        </radialGradient>
        <radialGradient id={idW} gradientUnits="userSpaceOnUse" cx={f1(cx)} cy={f1(cy)} r={f1(Math.min(clipR, 1200))}>
          <stop offset="0" stopColor={C.heat} stopOpacity={0.12} />
          <stop offset="1" stopColor={C.heatDeep} stopOpacity={0.3} />
        </radialGradient>
      </defs>
      {m > 0.02 && <LiquidMetal pts={liquidPts} t={t} px={R * z * 1.2} opacity={clamp(m * 2)} ripple={m * 0.8} env={{top: C.silverLit, bottom: C.navy1}} />}
      {m > 0.02 && (
        // the dark room reflection sliding across the liquid (reads as a mirror-like, moving surface)
        <path d={`M${f1(cx - clipR * 1.2)},${f1(cy + clipR * 0.1 + Math.sin(t * 1.7) * clipR * 0.08)} C${f1(cx - clipR * 0.4)},${f1(cy - clipR * 0.12 + Math.sin(t * 2.1) * clipR * 0.1)} ${f1(cx + clipR * 0.4)},${f1(cy + clipR * 0.3 + Math.sin(t * 1.9 + 1) * clipR * 0.1)} ${f1(cx + clipR * 1.2)},${f1(cy + clipR * 0.05)} L${f1(cx + clipR * 1.2)},${f1(cy + clipR * 0.42)} C${f1(cx + clipR * 0.4)},${f1(cy + clipR * 0.62 + Math.sin(t * 1.6) * clipR * 0.08)} ${f1(cx - clipR * 0.4)},${f1(cy + clipR * 0.28)} ${f1(cx - clipR * 1.2)},${f1(cy + clipR * 0.5)} Z`} fill={C.navy2} opacity={0.38 * clamp(m * 1.5 - 0.3)} />
      )}
      {streaks.map((q, k) => (
        <path key={k} d={q.d} fill="none" stroke="#FFFFFF" strokeWidth={Math.max(3, clipR * 0.03)} strokeLinecap="round" opacity={clamp(m * 1.5 - 0.5) * q.a * 0.95} />
      ))}
      <g opacity={1 - clamp((m - 0.3) / 0.5)}>
        {sph.map((q) => (
          <g key={q.s.k}>
            <circle cx={f1(q.x)} cy={f1(q.y)} r={f1(R * z)} fill={`url(#${idS})`} stroke={INK} strokeWidth={2.6} vectorEffect={NS} />
            <ellipse cx={f1(q.x - R * z * 0.34)} cy={f1(q.y - R * z * 0.4)} rx={f1(R * z * 0.24)} ry={f1(R * z * 0.13)} transform={`rotate(-35 ${f1(q.x - R * z * 0.34)} ${f1(q.y - R * z * 0.4)})`} fill="#FFFFFF" opacity={0.85} />
          </g>
        ))}
      </g>
      {nds.map((q) => {
        const ang = hash(q.s.k * 4.4) * Math.PI * 2 + m * noise1(t * 0.9 + q.s.k, 6) * 1.2;
        return <NdGrain key={q.s.k} c={{x: q.x, y: q.y}} r={GRAIN.r * 0.8 * z} k={q.s.k} ang={ang} hi={hiNd} ids={{g: idN}} />;
      })}
      {warm > 0.01 && <circle cx={f1(cx)} cy={f1(cy)} r={f1(Math.min(clipR, 1200))} fill="none" stroke={C.heat} strokeWidth={f1(Math.min(clipR, 1200) * 0.12)} opacity={warm * 0.35} />}
    </g>
  );
};
/** screen position of a lattice site (for label leaders) */
export const siteScreen = (i: number, j: number, cx: number, cy: number, z: number, t: number, heat = 0, drift: V = {x: 0, y: 0}): V & {nd: boolean} => {
  const s = SITES.find((q) => q.i === i && q.j === j) ?? SITES[0];
  const p = sitePos(s, t, heat, 0, {x: 0, y: 0});
  return {x: cx + (p.x + drift.x) * z, y: cy + (p.y + drift.y) * z, nd: s.nd};
};
/** the magnetic-particle sites (lattice indices), for picking label targets */
export const ND_SITES = SITES.filter((s) => s.nd).map((s) => ({i: s.i, j: s.j, x: s.x, y: s.y}));

export const circlePts = (x: number, y: number, r: number, n = 16): V[] =>
  Array.from({length: n}, (_, k) => ({x: x + Math.cos((k / n) * Math.PI * 2) * r, y: y + Math.sin((k / n) * Math.PI * 2) * r}));

// =====================================================================================================================
// CUTAWAY LENS (porthole): clean ink rim + silver bezel; children are clipped to the circle
// =====================================================================================================================
export const Lens: React.FC<{cx: number; cy: number; r: number; children: React.ReactNode; rim?: number}> = ({cx, cy, r, children, rim = 1}) => {
  if (r <= 0.5) return null;
  const idC = uid('lnC'), idB = uid('lnB');
  const bw = Math.min(16, r * 0.12); // bezel width
  return (
    <g>
      <defs>
        <clipPath id={idC}>
          <circle cx={f1(cx)} cy={f1(cy)} r={f1(r)} />
        </clipPath>
        <linearGradient id={idB} gradientUnits="userSpaceOnUse" x1={f1(cx - r)} y1={f1(cy - r)} x2={f1(cx + r)} y2={f1(cy + r)}>
          <stop offset="0" stopColor={C.silverLit} />
          <stop offset="0.45" stopColor={C.silver} />
          <stop offset="0.75" stopColor={C.silverDark} />
          <stop offset="1" stopColor={C.silverDeep} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${idC})`}>
        {children}
        {/* inner shadow of the bezel + a glass glint */}
        <circle cx={f1(cx)} cy={f1(cy)} r={f1(r - bw * 0.5)} fill="none" stroke={C.navy0} strokeWidth={f1(bw * 1.6)} opacity={0.35 * rim} />
        <path d={`M${f1(cx - r * 0.72)},${f1(cy - r * 0.38)} A${f1(r * 0.82)},${f1(r * 0.82)} 0 0 1 ${f1(cx - r * 0.2)},${f1(cy - r * 0.8)}`} fill="none" stroke="#FFFFFF" strokeWidth={f1(Math.max(2, r * 0.035))} strokeLinecap="round" opacity={0.28 * rim} />
      </g>
      {rim > 0.01 && (
        <g opacity={rim}>
          <circle cx={f1(cx)} cy={f1(cy)} r={f1(r + bw * 0.5)} fill="none" stroke={INK} strokeWidth={f1(bw + 9)} />
          <circle cx={f1(cx)} cy={f1(cy)} r={f1(r + bw * 0.5)} fill="none" stroke={`url(#${idB})`} strokeWidth={f1(bw)} />
          <circle cx={f1(cx)} cy={f1(cy)} r={f1(r + bw * 0.5)} fill="none" stroke="#FFFFFF" strokeWidth={1.6} opacity={0.5} strokeDasharray={`${f1(r * 0.9)} ${f1(r * 9)}`} strokeDashoffset={f1(r * 2.6)} />
        </g>
      )}
    </g>
  );
};

// =====================================================================================================================
// THERMOMETER (vertical gauge)
// =====================================================================================================================
export type ThermoGeo = {x: number; top: number; bot: number; bulbY: number; bulbR: number; w: number; t0: number; pxPerC: number};
export const THERMO: ThermoGeo = {x: 790, top: 560, bot: 1250, bulbY: 1316, bulbR: 60, w: 78, t0: 15, pxPerC: 23.6};
export const thermoY = (g: ThermoGeo, temp: number) => g.bot - (temp - g.t0) * g.pxPerC;

export const Thermometer: React.FC<{g?: ThermoGeo; temp: number; t: number; opacity?: number; dx?: number; glowAt?: number}> = ({g = THERMO, temp, t, opacity = 1, dx = 0, glowAt = 0}) => {
  if (opacity <= 0.002) return null;
  const x = g.x + dx;
  const w = g.w, fw = w * 0.42;
  const idG = uid('thG'), idF = uid('thF'), idB = uid('thB');
  const yT = thermoY(g, temp);
  const ticks: React.ReactNode[] = [];
  for (let c = g.t0 + 1; c <= g.t0 + (g.bot - g.top) / g.pxPerC - 1; c++) {
    const y = thermoY(g, c);
    const major = c % 5 === 0;
    ticks.push(<line key={c} x1={f1(x + w * 0.5 - (major ? 20 : 11))} x2={f1(x + w * 0.5 - 3)} y1={f1(y)} y2={f1(y)} stroke={INK} strokeWidth={major ? 3.2 : 2} opacity={0.55} />);
  }
  const tube = `M${f1(x - w / 2)},${f1(g.bulbY - g.bulbR * 0.6)} L${f1(x - w / 2)},${f1(g.top)} A${f1(w / 2)},${f1(w / 2)} 0 0 1 ${f1(x + w / 2)},${f1(g.top)} L${f1(x + w / 2)},${f1(g.bulbY - g.bulbR * 0.6)}`;
  const wob = Math.sin(t * 9) * 1.2;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={idG} gradientUnits="userSpaceOnUse" x1={f1(x - w / 2)} y1="0" x2={f1(x + w / 2)} y2="0">
          <stop offset="0" stopColor="#D9F2FF" stopOpacity={0.5} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.32} />
          <stop offset="0.7" stopColor="#9FC3DA" stopOpacity={0.16} />
          <stop offset="1" stopColor="#6E90AA" stopOpacity={0.3} />
        </linearGradient>
        <linearGradient id={idF} gradientUnits="userSpaceOnUse" x1={f1(x - fw / 2)} y1="0" x2={f1(x + fw / 2)} y2="0">
          <stop offset="0" stopColor="#FFC08A" />
          <stop offset="0.45" stopColor={C.heat} />
          <stop offset="1" stopColor={C.heatDeep} />
        </linearGradient>
        <radialGradient id={idB} gradientUnits="userSpaceOnUse" cx={f1(x - g.bulbR * 0.3)} cy={f1(g.bulbY - g.bulbR * 0.35)} r={f1(g.bulbR * 1.1)}>
          <stop offset="0" stopColor="#FFD3AE" />
          <stop offset="0.45" stopColor={C.heat} />
          <stop offset="1" stopColor={C.heatDeep} />
        </radialGradient>
      </defs>
      {/* glass: ink outline, body */}
      <path d={tube} fill="none" stroke={INK} strokeWidth={w + 8} strokeLinecap="butt" />
      <circle cx={f1(x)} cy={f1(g.bulbY)} r={f1(g.bulbR + 4)} fill={INK} />
      <path d={tube} fill="none" stroke={C.navy2} strokeWidth={w} />
      <path d={tube} fill="none" stroke={`url(#${idG})`} strokeWidth={w} />
      {/* fluid */}
      <rect x={f1(x - fw / 2)} y={f1(yT + wob)} width={f1(fw)} height={f1(g.bulbY - yT - wob)} rx={f1(fw / 2)} fill={`url(#${idF})`} />
      <circle cx={f1(x)} cy={f1(g.bulbY)} r={f1(g.bulbR)} fill={`url(#${idB})`} />
      <ellipse cx={f1(x - g.bulbR * 0.38)} cy={f1(g.bulbY - g.bulbR * 0.42)} rx={f1(g.bulbR * 0.24)} ry={f1(g.bulbR * 0.14)} transform={`rotate(-35 ${f1(x - g.bulbR * 0.38)} ${f1(g.bulbY - g.bulbR * 0.42)})`} fill="#FFFFFF" opacity={0.8} />
      {ticks}
      {/* glass highlight */}
      <line x1={f1(x - w * 0.28)} x2={f1(x - w * 0.28)} y1={f1(g.top + 6)} y2={f1(g.bulbY - g.bulbR * 1.05)} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.45} />
    </g>
  );
};

// =====================================================================================================================
// INDUCTION COIL (flat spiral, seen in perspective) + its ALTERNATING field arcs (warm = heat)
// =====================================================================================================================
const COPPER = '#C8743A', COPPER_LT = '#F2B27A', COPPER_DK = '#7A3D18';
export const InductionCoil: React.FC<{cx: number; cy: number; rx: number; ry: number; heat: number; t: number; opacity?: number}> = ({cx, cy, rx, ry, heat, t, opacity = 1}) => {
  if (opacity <= 0.002) return null;
  const turns = 5, n = 260;
  const pts: V[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = u * turns * Math.PI * 2 + 1.2;
    const rr = 0.18 + u * 0.78;
    pts.push({x: cx + Math.cos(a) * rx * rr, y: cy + Math.sin(a) * ry * rr});
  }
  const d = 'M' + pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L');
  const hot = clamp(heat);
  const flick = 0.9 + 0.1 * Math.sin(t * 31) * Math.sin(t * 7.3);
  const col = mix(COPPER, '#FF9A4A', hot * 0.7);
  const idP = uid('coP'), idH = uid('coH');
  const thick = 26;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={idP} gradientUnits="userSpaceOnUse" x1="0" y1={f1(cy - ry)} x2="0" y2={f1(cy + ry + thick)}>
          <stop offset="0" stopColor="#3B5272" />
          <stop offset="0.5" stopColor={C.navy3} />
          <stop offset="1" stopColor={C.navy2} />
        </linearGradient>
        <radialGradient id={idH} gradientUnits="userSpaceOnUse" cx={f1(cx)} cy={f1(cy)} r={f1(rx * 1.5)} gradientTransform={`translate(0 ${f1(cy)}) scale(1 ${f1(ry / rx)}) translate(0 ${f1(-cy)})`}>
          <stop offset="0" stopColor={C.heat} stopOpacity={0.75} />
          <stop offset="0.5" stopColor={C.heatDeep} stopOpacity={0.3} />
          <stop offset="1" stopColor={C.heatDeep} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the coil housing: a shallow puck */}
      <path d={`M${f1(cx - rx * 1.08)},${f1(cy)} L${f1(cx - rx * 1.08)},${f1(cy + thick)} A${f1(rx * 1.08)},${f1(ry * 1.08)} 0 0 0 ${f1(cx + rx * 1.08)},${f1(cy + thick)} L${f1(cx + rx * 1.08)},${f1(cy)} Z`} fill={C.navy2} stroke={INK} strokeWidth={4} />
      <ellipse cx={f1(cx)} cy={f1(cy)} rx={f1(rx * 1.08)} ry={f1(ry * 1.08)} fill={`url(#${idP})`} stroke={INK} strokeWidth={4} />
      {hot > 0.01 && <ellipse cx={f1(cx)} cy={f1(cy)} rx={f1(rx * 1.5)} ry={f1(ry * 1.5)} fill={`url(#${idH})`} opacity={hot * flick} style={{mixBlendMode: 'screen'}} />}
      <path d={d} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={mix(COPPER_DK, col, 0.5)} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.8 -1.2)" />
      <path d={d} fill="none" stroke={mix(COPPER_LT, '#FFE2B0', hot)} strokeWidth={2} strokeLinecap="round" transform="translate(-1.6 -2.6)" opacity={0.85} />
      {/* glass top plate glint */}
      <path d={`M${f1(cx - rx * 0.9)},${f1(cy - ry * 0.2)} A${f1(rx)},${f1(ry)} 0 0 1 ${f1(cx - rx * 0.2)},${f1(cy - ry * 0.98)}`} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.35} strokeLinecap="round" />
    </g>
  );
};

/** The coil's ALTERNATING field: warm arcs looping up through the sample and back down outside the coil; the dashes
 *  run back and forth (direction flips ~2.6 times a second) and the arcs breathe. on 0..1 */
export const ACFieldArcs: React.FC<{cx: number; cy: number; span: number; h: number; t: number; on: number}> = ({cx, cy, span, h, t, on}) => {
  if (on <= 0.01) return null;
  const f = 2.6;
  const ph = Math.sin(2 * Math.PI * f * t);
  const off = (Math.cos(2 * Math.PI * f * t) / (2 * Math.PI * f)) * 420; // back-and-forth dash travel
  const arcs: React.ReactNode[] = [];
  [0.62, 0.82, 1].forEach((k, i) => {
    for (const s of [-1, 1]) {
      const x0 = cx + s * span * 0.12, x1 = cx + s * span * k;
      const top = cy - h * k;
      const d = `M${f1(x0)},${f1(cy)} C${f1(x0)},${f1(top)} ${f1(x1)},${f1(top)} ${f1(x1)},${f1(cy + 4)}`;
      const a = on * (0.55 + 0.35 * Math.abs(ph)) * (1 - i * 0.12);
      arcs.push(
        <g key={`${i}${s}`} opacity={a}>
          <path d={d} fill="none" stroke={C.heatDeep} strokeWidth={9} strokeLinecap="round" opacity={0.35} />
          <path d={d} fill="none" stroke={C.heat} strokeWidth={5} strokeLinecap="round" strokeDasharray="22 16" strokeDashoffset={f1(off * s + i * 9)} />
        </g>,
      );
    }
  });
  return <g>{arcs}</g>;
};

/** heat shimmer: wavy warm lines rising from a point */
export const HeatShimmer: React.FC<{x: number; y: number; w: number; t: number; on: number}> = ({x, y, w, t, on}) => {
  if (on <= 0.01) return null;
  return (
    <g>
      {[-1, 0, 1].map((k) => {
        const ph = (t * 1.3 + k * 0.33 + 3) % 1;
        const x0 = x + k * w * 0.32;
        const y0 = y - ph * 120;
        const pts: string[] = [];
        for (let q = 0; q <= 8; q++) {
          const yy = y0 - q * 9;
          pts.push(`${q ? 'L' : 'M'}${f1(x0 + Math.sin(q * 0.9 + t * 9 + k) * 6)},${f1(yy)}`);
        }
        return <path key={k} d={pts.join('')} fill="none" stroke={C.heat} strokeWidth={4} strokeLinecap="round" opacity={on * 0.75 * Math.sin(Math.PI * ph)} />;
      })}
    </g>
  );
};

// =====================================================================================================================
// BAR MAGNET + dipole field lines (cyan = magnetic steering)
// =====================================================================================================================
export const MAGNET = {a: 132, b: 48};
/** classic bar magnet: red N half, blue S half (local +x = N). (x, y) centre, ang in radians. */
export const BarMagnet: React.FC<{x: number; y: number; ang: number; t: number; opacity?: number; a?: number; b?: number}> = ({x, y, ang, opacity = 1, a = MAGNET.a, b = MAGNET.b}) => {
  if (opacity <= 0.002) return null;
  const idN = uid('mgN'), idS = uid('mgS');
  const deg = (ang * 180) / Math.PI;
  // keep letters upright-ish: rotate the glyphs back by the magnet angle
  const r = 12;
  return (
    <g opacity={opacity} transform={`translate(${f1(x)} ${f1(y)}) rotate(${f1(deg)})`}>
      <defs>
        <linearGradient id={idN} gradientUnits="userSpaceOnUse" x1="0" y1={f1(-b)} x2="0" y2={f1(b)}>
          <stop offset="0" stopColor="#FF8A86" />
          <stop offset="0.35" stopColor={C.north} />
          <stop offset="1" stopColor="#9E1F26" />
        </linearGradient>
        <linearGradient id={idS} gradientUnits="userSpaceOnUse" x1="0" y1={f1(-b)} x2="0" y2={f1(b)}>
          <stop offset="0" stopColor="#8DB3FF" />
          <stop offset="0.35" stopColor={C.south} />
          <stop offset="1" stopColor="#1E3F9A" />
        </linearGradient>
      </defs>
      <rect x={f1(-a - 4)} y={f1(-b - 4)} width={f1(2 * a + 8)} height={f1(2 * b + 8)} rx={r + 4} fill={INK} />
      <path d={`M0,${f1(-b)} L${f1(a - r)},${f1(-b)} Q${f1(a)},${f1(-b)} ${f1(a)},${f1(-b + r)} L${f1(a)},${f1(b - r)} Q${f1(a)},${f1(b)} ${f1(a - r)},${f1(b)} L0,${f1(b)} Z`} fill={`url(#${idN})`} />
      <path d={`M0,${f1(-b)} L${f1(-a + r)},${f1(-b)} Q${f1(-a)},${f1(-b)} ${f1(-a)},${f1(-b + r)} L${f1(-a)},${f1(b - r)} Q${f1(-a)},${f1(b)} ${f1(-a + r)},${f1(b)} L0,${f1(b)} Z`} fill={`url(#${idS})`} />
      <line x1="0" x2="0" y1={f1(-b)} y2={f1(b)} stroke={INK} strokeWidth={3} />
      <path d={`M${f1(-a + 14)},${f1(-b + 9)} L${f1(a - 14)},${f1(-b + 9)}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      <g transform={`translate(${f1(a * 0.52)} 0) rotate(${f1(-deg)})`}>
        <text x="0" y="0" dy="0.36em" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#FFFFFF" stroke={INK} strokeWidth={6} paintOrder="stroke" strokeLinejoin="round">N</text>
      </g>
      <g transform={`translate(${f1(-a * 0.52)} 0) rotate(${f1(-deg)})`}>
        <text x="0" y="0" dy="0.36em" textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#FFFFFF" stroke={INK} strokeWidth={6} paintOrder="stroke" strokeLinejoin="round">S</text>
      </g>
    </g>
  );
};

/** dipole field lines around a magnet (local frame: axis +x = N), r = L sin^2(theta); lines leave N and enter S.
 *  grow 0..1 = how far out the field has bloomed; dashes flow N -> S. */
export const DipoleField: React.FC<{x: number; y: number; ang: number; t: number; grow?: number; opacity?: number; a?: number; b?: number}> = ({
  x, y, ang, t, grow = 1, opacity = 1, a = MAGNET.a, b = MAGNET.b,
}) => {
  if (opacity <= 0.002 || grow <= 0.01) return null;
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const Ls = [1.6, 2.3, 3.1];
  const paths: React.ReactNode[] = [];
  Ls.forEach((Lk, i) => {
    const L = Lk * a * (0.55 + 0.45 * clamp(grow));
    for (const side of [-1, 1]) {
      const pts: V[] = [];
      for (let q = 0; q <= 64; q++) {
        const th = 0.04 + (q / 64) * (Math.PI - 0.08);
        const r = L * Math.sin(th) ** 2;
        const lx = r * Math.cos(th) * 1.0, ly = side * r * Math.sin(th) * 0.9;
        if (Math.abs(lx) < a + 2 && Math.abs(ly) < b + 2) continue; // hidden under the magnet
        pts.push({x: x + lx * ca - ly * sa, y: y + lx * sa + ly * ca});
      }
      if (pts.length < 2) continue;
      const d = 'M' + pts.map((p) => `${f1(p.x)},${f1(p.y)}`).join('L');
      const op = opacity * clamp(grow * 1.6 - i * 0.3) * (0.75 - i * 0.14);
      paths.push(
        <g key={`${i}${side}`} opacity={op}>
          <path d={d} fill="none" stroke={C.field} strokeWidth={6} strokeLinecap="round" />
          <path d={d} fill="none" stroke="#E8FBFF" strokeWidth={3} strokeLinecap="round" strokeDasharray="10 34" strokeDashoffset={f1((side > 0 ? 1 : -1) * 0 + t * 70)} opacity={0.8} />
        </g>,
      );
    }
  });
  return <g>{paths}</g>;
};

// =====================================================================================================================
// LABELS (≤ 4 words, Nunito 900; yellow = emphasis, white otherwise)
// =====================================================================================================================
const backOut = (x: number) => {
  const c1 = 1.9, c3 = c1 + 1;
  const u = clamp(x);
  return 1 + c3 * (u - 1) ** 3 + c1 * (u - 1) ** 2;
};
export type LabelLine = {text: string; size: number; color?: string; dy?: number};
/** text lines with a dark stroke (caption treatment), popping in: p = appear progress 0..1 (back-out scale) */
export const SciLabel: React.FC<{x: number; y: number; lines: LabelLine[]; anchor?: 'start' | 'middle' | 'end'; p: number; opacity?: number; ox?: number; oy?: number}> = ({
  x, y, lines, anchor = 'middle', p, opacity = 1, ox, oy,
}) => {
  if (p <= 0.001 || opacity <= 0.002) return null;
  const sc = 0.7 + 0.3 * backOut(p);
  const a = clamp(p * 2.5) * opacity;
  let yy = 0;
  const px = ox ?? x, py = oy ?? y;
  return (
    <g opacity={a} transform={`translate(${f1(px)} ${f1(py)}) scale(${sc.toFixed(3)}) translate(${f1(-px)} ${f1(-py)})`}>
      {lines.map((l, i) => {
        yy += i === 0 ? 0 : l.dy ?? l.size * 1.08;
        return (
          <text key={i} x={f1(x)} y={f1(y + yy)} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={l.size} fill={l.color ?? '#FFFFFF'}
            stroke="rgba(6,10,18,0.92)" strokeWidth={Math.max(7, l.size * 0.17)} strokeLinejoin="round" paintOrder="stroke" letterSpacing="0.01em">
            {l.text}
          </text>
        );
      })}
    </g>
  );
};

// =====================================================================================================================
// SAMPLE: a small ingot of the composite that slumps into a puddle (one body, rendered as liquid metal throughout)
// =====================================================================================================================
/** outline: solid = boxy superellipse ingot standing on (cx, base); liquid = a wide puddle lying on it */
export const sampleOutline = (cx: number, base: number, melt: number, t: number, n = 40): V[] => {
  const m = clamp(melt);
  const out: V[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    // superellipse (n = 6) ingot
    const e = 2 / 6;
    const sx = Math.sign(c) * Math.abs(c) ** e, sy = Math.sign(s) * Math.abs(s) ** e;
    const solid = {x: cx + sx * 92, y: base - 56 + sy * 56};
    const w = 1 + 0.06 * Math.sin(2 * a + t * 2.1) + 0.04 * Math.sin(3 * a - t * 2.7) + 0.03 * noise1(a * 1.7 + t * 1.4, 5);
    // liquid: flat dome, bottom on the plate
    const liquid = {x: cx + c * 150 * w, y: base - 15 + (s < 0 ? s * 36 * w : s * 11)};
    // slump: the top falls first, the sides spread
    const mt = clamp(m * 1.25 - (s < 0 ? 0 : 0.15));
    out.push({x: solid.x + (liquid.x - solid.x) * clamp(m * 1.1), y: solid.y + (liquid.y - solid.y) * mt});
  }
  return out;
};

/** crisp facet shading over the SOLID ingot (fades as it melts) */
export const IngotFacets: React.FC<{cx: number; base: number; melt: number; heat: number}> = ({cx, base, melt, heat}) => {
  const k = 1 - clamp(melt * 2.2);
  if (k <= 0.01) return null;
  const top = base - 112;
  return (
    <g opacity={k}>
      <path d={`M${f1(cx - 74)},${f1(top + 18)} L${f1(cx + 42)},${f1(top + 12)}`} stroke="#FFFFFF" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
      <path d={`M${f1(cx - 82)},${f1(top + 40)} L${f1(cx + 82)},${f1(top + 40)}`} stroke={INK} strokeWidth={2.4} opacity={0.45} />
      <path d={`M${f1(cx - 50)},${f1(base - 24)} L${f1(cx - 12)},${f1(top + 54)}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
      <path d={`M${f1(cx + 36)},${f1(base - 16)} L${f1(cx + 64)},${f1(top + 62)}`} stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round" opacity={0.35 * (1 - heat)} />
    </g>
  );
};

export {smoothPath, rgba};
