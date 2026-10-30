// HOOK 02: the NTU/Waseda diving suit on the canonical insect, drawn through the same orthographic view as the body.
// - a soft, flexible, 3D-printed waterproof shell over the abdomen (translucent silicone, accordion ribs, front collar);
// - at the rear, the oxygen generator: a clear chamber of hydrogen peroxide with a manganese-dioxide-coated sponge on
//   which oxygen bubbles nucleate, grow, detach and rise to the gas space; an outlet manifold at its front cap;
// - a small ballast weight (dull metal block) under the generator that lets the insect walk on the bottom;
// - four thin silicone tubes from the manifold over the suit to the four thoracic spiracles (two per side), each sealed
//   with a bead of adhesive; gas pulses travel forward inside them.
import React from 'react';
import {V2, V3, Frame, toW, dirW, norm, sub, add, mul} from './rig/v3';
import {INK} from '../shared/ink';
import {lit, shade, mix, rgba} from '../shared/color';
import {loftLocal, LoftDef} from './rig/loft';
import {PLATES} from './rig/roach';
import {View, P, f2, hull, thin, smoothClosed, smoothOpen, facing} from './rig/ortho';
import {Cel, InkFlat, inkFor} from './rig/Roach2D';
import {Inked} from '../shared/ink';
import {GEN, SPIR, SUIT_X1} from './world';
import {clamp, hash, noise1} from '../shared/lib';

export const SC = {
  suit: '#CBE6EE',
  suitRib: '#A9C8CF',
  collar: '#B8D3D9',
  glass: '#DDF3F7',
  liquid: '#8FD0DA',
  sponge: '#3A2B25',
  spongePore: '#1E1512',
  spongeLit: '#5E4637',
  cap: '#C9D6DC',
  manifold: '#7E8E98',
  weight: '#59636B',
  tube: '#E4F1F1',
  gas: '#8EEBFF',
  gasHi: '#E9FDFF',
  glue: '#E2A84B',
  spirRim: '#8A5A3E',
  spirHole: '#1B0F0B',
};

const PL = PLATES.x1 - PLATES.x0;
const upl = (x: number) => clamp((x - PLATES.x0) / PL);
const SUIT_X0 = -51.8;
/** the suit shell: the plates' own section, 1.5 mm proud, rounded over the abdomen tip */
export const suitLoft = (breathY: number): LoftDef => ({
  x0: SUIT_X0,
  x1: SUIT_X1,
  n: 2.4,
  w: (u) => {
    const x = SUIT_X0 + (SUIT_X1 - SUIT_X0) * u;
    const tip = Math.sqrt(clamp((x - SUIT_X0) / 2.4));
    return (PLATES.w(upl(x)) + 1.5) * tip;
  },
  ht: (u) => {
    const x = SUIT_X0 + (SUIT_X1 - SUIT_X0) * u;
    const tip = Math.sqrt(clamp((x - SUIT_X0) / 2.4));
    return (PLATES.ht(upl(x)) * breathY + 1.6) * tip;
  },
  hb: (u) => PLATES.hb(upl(SUIT_X0 + (SUIT_X1 - SUIT_X0) * u)) * breathY + 0.7,
  yc: (u) => PLATES.yc(upl(SUIT_X0 + (SUIT_X1 - SUIT_X0) * u)),
});
/** the plates surface (as Roach2D draws it, breathing) */
const platesLoc = (x: number, th: number, breathY: number): V3 => {
  const u = upl(x);
  const l = loftLocal(PLATES, u, th);
  const yc = PLATES.yc(u);
  return [l[0], yc + (l[1] - yc) * breathY, l[2]];
};
const suitLoc = (sl: LoftDef, x: number, th: number): V3 => loftLocal(sl, clamp((x - sl.x0) / (sl.x1 - sl.x0)), th);
/** outward section normal of a loft point (local) */
const secN = (p: V3, yc: number, w: number, h: number): V3 => norm([0, (p[1] - yc) / (h * h), p[2] / (w * w)]);

export const breathYOf = (breath: number) => 1.12 * (1 + 0.022 * (breath - 0.5));

const loftHullPts = (v: View, f: Frame, d: LoftDef): V2[] => {
  const pts: V2[] = [];
  for (let i = 0; i <= 30; i++)
    for (let j = 0; j < 44; j++) pts.push(P(v, toW(f, loftLocal(d, i / 30, (j / 44) * Math.PI * 2))));
  return thin(hull(pts), 1.2);
};
const ringRun = (v: View, f: Frame, d: LoftDef, u: number, th0 = 0, th1 = Math.PI): V2[] => {
  const out: V2[] = [];
  for (let j = 0; j <= 36; j++) {
    const th = th0 + ((th1 - th0) * j) / 36;
    const l = loftLocal(d, u, th);
    const yc = d.yc(u), w = Math.max(1e-3, d.w(u)), h = Math.max(1e-3, d.ht(u));
    if (facing(v, dirW(f, secN(l, yc, w, h))) > 0.02) out.push(P(v, toW(f, l)));
    else if (out.length > 1) break;
  }
  return out;
};
const cylPts = (v: View, a: V3, b: V3, r: number, caps = true): V2[] => {
  const ax = norm(sub(b, a));
  const t0: V3 = Math.abs(ax[1]) < 0.9 ? norm([ax[2], 0, -ax[0]]) : [1, 0, 0];
  const t1: V3 = [ax[1] * t0[2] - ax[2] * t0[1], ax[2] * t0[0] - ax[0] * t0[2], ax[0] * t0[1] - ax[1] * t0[0]];
  const pts: V2[] = [];
  for (let i = 0; i < 40; i++) {
    const th = (i / 40) * Math.PI * 2;
    const o = add(mul(t0, Math.cos(th) * r), mul(t1, Math.sin(th) * r));
    pts.push(P(v, add(a, o)), P(v, add(b, o)));
    // rounded caps
    if (caps) pts.push(P(v, add(add(a, mul(o, 0.8)), mul(ax, -r * 0.45))), P(v, add(add(b, mul(o, 0.8)), mul(ax, r * 0.45))));
  }
  return thin(hull(pts), 1);
};
const boxPts = (v: View, f: Frame, c: V3, h: V3): V2[] => {
  const pts: V2[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(P(v, toW(f, [c[0] + sx * h[0], c[1] + sy * h[1], c[2] + sz * h[2]])));
  const hl = hull(pts);
  const out: V2[] = [];
  for (let i = 0; i < hl.length; i++) {
    const a = hl[i], b = hl[(i + 1) % hl.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 5));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
};

// ------------------------------------------------------------------ the four tubes
type TubeKnot = {p: V3; n: V3 | null};
export type Tube = {pts: V3[]; ns: (V3 | null)[]; end: V3; endN: V3; side: 1 | -1; to: 'meso' | 'meta'};
const surfKnot = (sl: LoftDef, x: number, th: number, side: 1 | -1, breathY: number, lift: number): TubeKnot => {
  const t = side > 0 ? th : Math.PI - th;
  const onSuit = x < SUIT_X1 - 0.4;
  let p: V3, n: V3;
  if (onSuit) {
    const u = clamp((x - sl.x0) / (sl.x1 - sl.x0));
    p = loftLocal(sl, u, t);
    n = secN(p, sl.yc(u), sl.w(u), sl.ht(u));
  } else {
    const u = upl(x);
    p = platesLoc(x, t, breathY);
    n = secN(p, PLATES.yc(u), PLATES.w(u), PLATES.ht(u) * breathY);
  }
  return {p: add(p, mul(n, lift)), n};
};
export const tubesLocal = (breathY: number): Tube[] => {
  const sl = suitLoft(breathY);
  const R = 0.75;
  const out: Tube[] = [];
  for (const side of [1, -1] as const) {
    const z = (q: number) => q * side;
    const up = (k: number): V3 => norm([0, 1, side * k]);
    // meso (upper track, inner manifold port) and meta (lower track, outer port): they never cross
    const A: TubeKnot[] = [
      {p: [GEN.x1 + 0.9, GEN.y + 1.9, z(0.9)], n: null},
      {p: [-28.4, GEN.y + 1.2, z(2.6)], n: null},
      surfKnot(sl, -25.2, 1.3, side, breathY, R),
      surfKnot(sl, -20, 0.98, side, breathY, R),
      surfKnot(sl, -14.5, 0.58, side, breathY, R),
      surfKnot(sl, -9.5, 0.47, side, breathY, R + 0.3),
      surfKnot(sl, -4.2, 0.4, side, breathY, R),
      surfKnot(sl, -0.6, 0.31, side, breathY, R * 0.8),
      surfKnot(sl, SPIR.meso.x, SPIR.meso.th, side, breathY, 0.1),
    ];
    const B: TubeKnot[] = [
      {p: [GEN.x1 + 0.9, GEN.y + 1.2, z(2.7)], n: null},
      {p: [-28.9, GEN.y - 0.4, z(4.6)], n: null},
      surfKnot(sl, -25.8, 1.18, side, breathY, R),
      surfKnot(sl, -20.4, 0.8, side, breathY, R),
      surfKnot(sl, -15, 0.38, side, breathY, R),
      surfKnot(sl, -10.4, 0.28, side, breathY, R + 0.3),
      surfKnot(sl, -7.6, 0.23, side, breathY, R * 0.8),
      surfKnot(sl, SPIR.meta.x, SPIR.meta.th, side, breathY, 0.1),
    ];
    for (const [ks, to] of [[A, 'meso'], [B, 'meta']] as const) {
      const pts: V3[] = [], ns: (V3 | null)[] = [];
      const n = ks.length - 1, per = 8;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < per; j++) {
          const f = j / per;
          const p0 = ks[Math.max(0, i - 1)].p, p1 = ks[i].p, p2 = ks[i + 1].p, p3 = ks[Math.min(n, i + 2)].p;
          const q = (k: number) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f * f + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f * f * f);
          pts.push([q(0), q(1), q(2)]);
          const na = ks[i].n, nb = ks[i + 1].n;
          ns.push(na && nb ? norm(add(mul(na, 1 - f), mul(nb, f))) : na ?? nb);
        }
      pts.push(ks[n].p);
      ns.push(ks[n].n);
      out.push({pts, ns, end: ks[n].p, endN: ks[n].n!, side, to});
    }
  }
  return out;
};

/** total gas travel along a tube (fraction of its length): a slow steady flow that quickens as the generator fizzes */
export const gasTravel = (t: number, a: number, b: number) => {
  const base = 0.42 * t;
  const x = clamp((t - a) / (b - a));
  const extra = t <= a ? 0 : t >= b ? (b - a) * 0.5 + (t - b) : (b - a) * (x * x * x - (x * x * x * x) / 2);
  return base + 1.0 * extra;
};

// ------------------------------------------------------------------ drawing
export type SuitState = {t: number; breath: number; flowK: number; travel: number; fizz: number; dark: number};

export const SuitShell: React.FC<{id: string; v: View; f: Frame; st: SuitState}> = ({id, v, f, st}) => {
  const ink = inkFor(v);
  const bY = breathYOf(st.breath);
  const sl = suitLoft(bY);
  const hullPts = loftHullPts(v, f, sl);
  const d = smoothClosed(hullPts);
  const ribs = [0.16, 0.3, 0.44, 0.58, 0.72, 0.85].map((u) => ringRun(v, f, sl, u)).filter((r) => r.length > 2);
  const collar = ringRun(v, f, sl, 0.995, -0.25, Math.PI + 0.25);
  const xs = hullPts.map((p) => p[0]), ys = hullPts.map((p) => p[1]);
  const bx0 = Math.min(...xs), bx1 = Math.max(...xs), by0 = Math.min(...ys), by1 = Math.max(...ys);
  // print seam along the top
  const seam: V2[] = [];
  for (let i = 0; i <= 24; i++) {
    const x = sl.x0 + 1.5 + ((sl.x1 - sl.x0 - 2) * i) / 24;
    const p = suitLoc(sl, x, Math.PI / 2);
    seam.push(P(v, toW(f, p)));
  }
  return (
    <g>
      <path d={d} fill={SC.suit} opacity={0.56} />
      <defs>
        <clipPath id={`${id}-sc`}>
          <path d={d} />
        </clipPath>
        <linearGradient id={`${id}-sg`} x1="0" y1={f2(by0)} x2="0" y2={f2(by1)} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={lit(SC.suit, 0.5)} stopOpacity={0.55} />
          <stop offset="0.55" stopColor={SC.suit} stopOpacity={0} />
          <stop offset="1" stopColor={shade(SC.suit, 0.55)} stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-sc)`}>
        <path d={d} fill={`url(#${id}-sg)`} />
        {ribs.map((r, i) => (
          <g key={i}>
            <path d={smoothOpen(r)} stroke={shade(SC.suitRib, 0.25)} strokeWidth={f2(Math.max(1.2, ink * 0.5))} fill="none" opacity={0.75} />
            <path d={smoothOpen(r)} stroke={lit(SC.suit, 0.6)} strokeWidth={f2(Math.max(1, ink * 0.35))} fill="none" opacity={0.7} transform={`translate(${f2(-0.35 * v.s)} ${f2(-0.2 * v.s)})`} />
          </g>
        ))}
        <path d={smoothOpen(seam)} stroke={lit(SC.suit, 0.7)} strokeWidth={f2(Math.max(1, 0.28 * v.s))} fill="none" opacity={0.55} />
        <ellipse cx={f2(bx0 + 0.42 * (bx1 - bx0))} cy={f2(by0 + 0.2 * (by1 - by0))} rx={f2(0.26 * (bx1 - bx0))} ry={f2(Math.max(1.5, 0.06 * (by1 - by0)))} transform={`rotate(-5 ${f2(bx0 + 0.42 * (bx1 - bx0))} ${f2(by0 + 0.2 * (by1 - by0))})`} fill="#FFFFFF" opacity={0.55} />
      </g>
      {collar.length > 2 && (
        <g>
          <path d={smoothOpen(collar)} stroke={INK} strokeWidth={f2(0.9 * v.s + ink * 1.2)} fill="none" strokeLinecap="round" />
          <path d={smoothOpen(collar)} stroke={SC.collar} strokeWidth={f2(0.9 * v.s)} fill="none" strokeLinecap="round" />
          <path d={smoothOpen(collar)} stroke={lit(SC.collar, 0.6)} strokeWidth={f2(0.3 * v.s)} fill="none" strokeLinecap="round" transform={`translate(${f2(-0.15 * v.s)} ${f2(-0.2 * v.s)})`} />
        </g>
      )}
      <path d={d} fill="none" stroke={INK} strokeWidth={f2(ink * 0.95)} strokeLinejoin="round" />
    </g>
  );
};

/** the generator, its contents and the ballast weight */
export const Generator: React.FC<{id: string; v: View; f: Frame; st: SuitState}> = ({id, v, f, st}) => {
  const s = v.s, ink = inkFor(v);
  const a = toW(f, [GEN.x0, GEN.y, 0]), b = toW(f, [GEN.x1, GEN.y, 0]);
  const shell = cylPts(v, a, b, GEN.r);
  const dShell = smoothClosed(shell);
  // a 2D frame for the contents: u along the axis (rear 0 -> front 1), w across (bottom -1 -> top +1)
  const pa = P(v, a), pb = P(v, b);
  const up2 = P(v, toW(f, [GEN.x0, GEN.y + GEN.r, 0]));
  const ax: V2 = [pb[0] - pa[0], pb[1] - pa[1]];
  const wv: V2 = [up2[0] - pa[0], up2[1] - pa[1]];
  const at = (u: number, w: number): V2 => [pa[0] + ax[0] * u + wv[0] * w, pa[1] + ax[1] * u + wv[1] * w];
  const poly = (q: [number, number][]) => smoothClosed(q.map(([u, w]) => at(u, w)));
  const R = Math.hypot(wv[0], wv[1]);
  // ballast: a dull metal block slung under the chamber's rear half (sits in the saddle on the suit)
  const weight = boxPts(v, f, [(GEN.x0 + GEN.x1) / 2 - 1, GEN.y - GEN.r - 1.5, 0], [6.2, 2.0, 3.6]);
  const strapA = cylPts(v, toW(f, [GEN.x0 + 3.8, GEN.y, 0]), toW(f, [GEN.x0 + 4.7, GEN.y, 0]), GEN.r + 0.35);
  const strapB = cylPts(v, toW(f, [GEN.x1 - 4.7, GEN.y, 0]), toW(f, [GEN.x1 - 3.8, GEN.y, 0]), GEN.r + 0.35);
  // liquid level with a slight slosh
  const lvl = 0.22 + 0.04 * Math.sin(st.t * 5.1) * 0.5;
  const liquid: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const u = 0.02 + 0.96 * (i / 12);
    liquid.push([u, lvl + 0.035 * Math.sin(u * 14 + st.t * 6)]);
  }
  liquid.push([0.98, -1.1], [0.02, -1.1]);
  // the catalyst sponge: a porous block, irregular edge
  const sp: [number, number][] = [];
  for (let i = 0; i < 28; i++) {
    const th = (i / 28) * Math.PI * 2;
    const c = Math.cos(th), sn = Math.sin(th);
    const r = 1 + 0.06 * noise1(i * 1.7, 4);
    const sq = (x: number) => Math.sign(x) * Math.pow(Math.abs(x), 0.55);
    sp.push([0.37 + 0.28 * sq(c) * r, -0.34 + 0.52 * sq(sn) * r]);
  }
  const pores = Array.from({length: 46}, (_, i) => {
    const u = 0.13 + 0.48 * hash(i * 3.1 + 1), w = -0.78 + 0.86 * hash(i * 5.7 + 2);
    return {u, w, r: 0.018 + 0.03 * hash(i * 9.3)};
  });
  // oxygen bubbles: nucleate on the sponge surface, grow, detach, rise to the gas space and merge
  const nb = 40;
  const rate = 0.9 + 1.4 * st.fizz;
  const bubbles = Array.from({length: nb}, (_, i) => {
    const per = 0.75 + 0.5 * hash(i * 7.7);
    const ph = (st.t * rate) / per + hash(i * 2.3);
    const age = ph - Math.floor(ph);
    const k = Math.floor(ph);
    // nucleation site on the top or sides of the sponge
    const th = 0.15 + 2.84 * hash(i * 4.1 + k * 0.37);
    const su = 0.37 + 0.29 * Math.cos(th) * 0.98, sw = -0.34 + 0.53 * Math.sin(th) * 0.98;
    const grow = clamp(age / 0.4);
    const rise = clamp((age - 0.4) / 0.6);
    const r0 = (0.04 + 0.06 * hash(i * 11.1 + k)) * (0.35 + 0.65 * grow);
    const wob = 0.03 * Math.sin(age * 30 + i);
    const w = sw + r0 + rise * (lvl - sw - r0) + 0;
    const u = su + wob * rise;
    const alpha = (rise > 0.92 ? (1 - rise) / 0.08 : 1) * (0.55 + 0.45 * st.fizz);
    return {u, w, r: r0 * (1 + 0.25 * rise), alpha};
  });
  const shellLit = lit(SC.glass, 0.4);
  // end caps: rings at both ends
  const capRing = (x: number) => {
    const pts: V2[] = [];
    for (let i = 0; i <= 40; i++) {
      const th = (i / 40) * Math.PI * 2;
      pts.push(P(v, toW(f, [x, GEN.y + Math.sin(th) * (GEN.r + 0.25), Math.cos(th) * (GEN.r + 0.25)])));
    }
    return pts;
  };
  const capF = capRing(GEN.x1 - 0.6), capB = capRing(GEN.x0 + 0.6);
  const capBand = (x0: number, x1: number) => cylPts(v, toW(f, [x0, GEN.y, 0]), toW(f, [x1, GEN.y, 0]), GEN.r + 0.3, false);
  const manifold = boxPts(v, f, [GEN.x1 + 0.4, GEN.y + 1.9, 0], [1.2, 1.3, 3.3]);
  return (
    <g>
      <Inked w={ink * 0.85}>
        <Cel id={`${id}-wt`} pts={weight} color={SC.weight} hi={0.35} shadeK={0.4} hiPos={[0.4, 0.22, 0.3, 0.08, -4]} />
      </Inked>
      {/* chamber back wall */}
      <path d={dShell} fill={SC.glass} opacity={0.5} />
      <defs>
        <clipPath id={`${id}-gc`}>
          <path d={dShell} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-gc)`}>
        {/* hydrogen peroxide */}
        <path d={poly(liquid)} fill={SC.liquid} opacity={0.62} />
        <path d={smoothOpen(liquid.slice(0, 13).map(([u, w]) => at(u, w)))} stroke={lit(SC.liquid, 0.65)} strokeWidth={f2(Math.max(1, 0.22 * s))} fill="none" opacity={0.9} />
        {/* catalyst sponge (manganese dioxide coating: dark, porous) */}
        <path d={poly(sp)} fill={SC.sponge} stroke={INK} strokeWidth={f2(Math.max(1, ink * 0.5))} />
        <path d={poly(sp.map(([u, w]) => [u - 0.02, w + 0.05] as [number, number]))} fill={SC.spongeLit} opacity={0.35} clipPath={`url(#${id}-gc)`} />
        {pores.map((q, i) => {
          const c = at(q.u, q.w);
          return <ellipse key={i} cx={f2(c[0])} cy={f2(c[1])} rx={f2(q.r * Math.hypot(ax[0], ax[1]) * 0.9)} ry={f2(q.r * R * 1.1)} fill={SC.spongePore} opacity={0.85} />;
        })}
        {bubbles.map((q, i) => {
          const c = at(q.u, q.w);
          const rr = q.r * R;
          if (rr < 0.4) return null;
          return (
            <g key={i} opacity={f2(clamp(q.alpha))}>
              <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(rr)} fill={rgba('#F4FEFF', 0.35)} stroke={lit(SC.gas, 0.3)} strokeWidth={f2(Math.max(0.6, rr * 0.22))} />
              <circle cx={f2(c[0] - rr * 0.35)} cy={f2(c[1] - rr * 0.35)} r={f2(rr * 0.3)} fill="#FFFFFF" opacity={0.9} />
            </g>
          );
        })}
        {/* gas space shimmer */}
        <path d={poly([[0.04, lvl + 0.08], [0.96, lvl + 0.08], [0.96, 0.95], [0.04, 0.95]])} fill={SC.gas} opacity={0.12 + 0.12 * st.fizz} />
      </g>
      {/* glass front: highlight streaks */}
      <path d={smoothOpen([at(0.08, 0.68), at(0.5, 0.74), at(0.9, 0.68)])} stroke="#FFFFFF" strokeWidth={f2(Math.max(1.5, 0.55 * s))} strokeLinecap="round" fill="none" opacity={0.75} />
      <path d={smoothOpen([at(0.12, -0.82), at(0.88, -0.82)])} stroke={shellLit} strokeWidth={f2(Math.max(1, 0.25 * s))} strokeLinecap="round" fill="none" opacity={0.6} />
      <Inked w={ink * 0.7}>
        <Cel id={`${id}-cb`} pts={capBand(GEN.x0 - 0.4, GEN.x0 + 0.8)} color={SC.cap} hi={0.4} shadeK={0.25} />
        <Cel id={`${id}-cf`} pts={capBand(GEN.x1 - 0.8, GEN.x1 + 0.4)} color={SC.cap} hi={0.4} shadeK={0.25} />
        <Cel id={`${id}-mf`} pts={manifold} color={SC.manifold} hi={0.35} />
      </Inked>
      <path d={smoothOpen(capF)} stroke={INK} strokeWidth={f2(Math.max(1, ink * 0.35))} fill="none" opacity={0.35} />
      <path d={smoothOpen(capB)} stroke={INK} strokeWidth={f2(Math.max(1, ink * 0.35))} fill="none" opacity={0.35} />
      <path d={dShell} fill="none" stroke={INK} strokeWidth={f2(ink * 0.85)} />
    </g>
  );
};

/** the four tubes (the visible runs), gas pulses inside them, the spiracles and their adhesive seals */
export const Tubes: React.FC<{v: View; f: Frame; st: SuitState; tubes: Tube[]}> = ({v, f, st, tubes}) => {
  const s = v.s;
  const R = 0.72;
  const iw = Math.max(1.1, 0.16 * s + 0.5);
  const els: React.ReactNode[] = [];
  const seals: React.ReactNode[] = [];
  const order = tubes.map((tb, ti) => ({tb, ti})).sort((a, b) => facing(v, dirW(f, [0, 0, a.tb.side])) - facing(v, dirW(f, [0, 0, b.tb.side])));
  order.forEach(({tb, ti}) => {
    const vis0 = tb.ns.map((n) => (n ? facing(v, dirW(f, n)) + 0.1 : 1));
    const firstHidden = vis0.findIndex((x) => x < 0);
    const vis = vis0.map((x, i) => (firstHidden >= 0 && i >= firstHidden ? -1 : x));
    const sp = tb.pts.map((p) => P(v, toW(f, p)));
    // runs of visible points (cut where the tube passes over the silhouette)
    const runs: {a: number; b: number}[] = [];
    let a = -1;
    for (let i = 0; i < sp.length; i++) {
      if (vis[i] >= 0 && a < 0) a = i;
      if ((vis[i] < 0 || i === sp.length - 1) && a >= 0) {
        const b = vis[i] < 0 ? i - 1 : i;
        if (b > a) runs.push({a, b});
        a = -1;
      }
    }
    const L = sp.length - 1;
    runs.forEach((r, ri) => {
      const pts = sp.slice(r.a, r.b + 1);
      const d = smoothOpen(pts);
      els.push(
        <g key={`t${ti}-${ri}`}>
          <path d={d} stroke={INK} strokeWidth={f2(2 * R * s + 2 * iw)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} stroke={SC.tube} strokeWidth={f2(2 * R * s)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} stroke={SC.gas} strokeWidth={f2(0.75 * R * s)} fill="none" strokeLinecap="round" opacity={0.28 + 0.3 * st.flowK} />
          <path d={d} stroke="#FFFFFF" strokeWidth={f2(Math.max(0.8, 0.3 * R * s))} fill="none" strokeLinecap="round" opacity={0.75} transform={`translate(${f2(-0.32 * R * s)} ${f2(-0.42 * R * s)})`} />
        </g>,
      );
      // gas pulses travelling forward (generator -> spiracle)
      const np = 3;
      for (let k = 0; k < np; k++) {
        const u = (st.travel + k / np + ti * 0.09) % 1;
        const i1 = Math.round(u * L), i0 = Math.max(0, Math.round((u - 0.07) * L));
        const j0 = Math.max(i0, r.a), j1 = Math.min(i1, r.b);
        if (j1 - j0 < 1) continue;
        const seg = sp.slice(j0, j1 + 1);
        const dd = smoothOpen(seg);
        els.push(
          <g key={`p${ti}-${ri}-${k}`} opacity={f2(0.35 + 0.65 * st.flowK)}>
            <path d={dd} stroke={SC.gas} strokeWidth={f2(1.25 * R * s)} fill="none" strokeLinecap="round" opacity={0.55} />
            <path d={dd} stroke={SC.gasHi} strokeWidth={f2(0.5 * R * s)} fill="none" strokeLinecap="round" />
          </g>,
        );
      }
    });
    // spiracle and its adhesive seal (when the tube's end faces the camera)
    const ef = facing(v, dirW(f, tb.endN));
    if (ef > -0.02 && firstHidden < 0) {
      const e = toW(f, tb.end);
      const ea = Math.min(1, (ef + 0.02) / 0.12);
      const c = P(v, e);
      const along = P(v, toW(f, [tb.end[0] + 1, tb.end[1], tb.end[2]]));
      const ang = (Math.atan2(along[1] - c[1], along[0] - c[0]) * 180) / Math.PI;
      const rx = 1.7 * s, ry = 1.7 * s * Math.max(0.35, Math.min(1, ef * 1.2 + 0.2));
      seals.push(
        <g key={`s${ti}`} opacity={f2(ea)}>
          <ellipse cx={f2(c[0])} cy={f2(c[1])} rx={f2(rx)} ry={f2(ry)} transform={`rotate(${f2(ang)} ${f2(c[0])} ${f2(c[1])})`} fill={SC.glue} opacity={0.72} stroke={INK} strokeWidth={f2(Math.max(0.8, iw * 0.7))} />
          <ellipse cx={f2(c[0] - rx * 0.3)} cy={f2(c[1] - ry * 0.35)} rx={f2(rx * 0.35)} ry={f2(ry * 0.22)} transform={`rotate(${f2(ang)} ${f2(c[0])} ${f2(c[1])})`} fill="#FFF3D6" opacity={0.8} />
        </g>,
      );
    }
  });
  return (
    <g>
      {els}
      {seals}
    </g>
  );
};

/** the spiracle openings themselves (drawn on the cuticle under the tube ends; visible in the cut window too) */
export const spiracleScreen = (v: View, f: Frame, tb: Tube) => {
  const c = P(v, toW(f, tb.end));
  return c;
};
export {mix};
