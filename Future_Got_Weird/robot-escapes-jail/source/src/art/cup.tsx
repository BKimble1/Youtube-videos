// The guard's coffee: a small white paper cup with a red band (C.cup / C.cupBand) and brown coffee, and the coffee
// splash on the floor (impact crown -> spreading splash with droplets -> settled round puddle). Weird Crew finish:
// navy ink contour at a constant screen width, cel/gradient fills lit from the upper left, small white glosses.
// Pure functions of their props (no randomness, no clock). Every SVG id comes from uid().
import React from 'react';
import {uid} from '../core/ids';
import {lit, mix, shade} from '../core/color';
import {hash} from '../lib';
import {C, INK} from './palette';

// local colours (not in the shared palette)
const CUP_SHADE = '#CFC8BA';   // the paper cup's shadowed side
const CUP_INSIDE = '#B9A88F';  // the cup's inner wall (waxed paper, in shadow)
const COFFEE_DEEP = '#3E2312';  // coffee in depth / at the puddle rim

/** cup dimensions in world units (the robot is 10 u, the guard 24 u) */
export const CUP = {h: 2.3, rt: 0.78, rb: 0.56};

const f = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(2));
const inkW = (px: number) => Math.min(2.8, Math.max(1.2, px));

/** points along the lower (front) half of an ellipse, from -rx to +rx */
const frontArc = (cy: number, rx: number, ry: number, n = 10, sgn = 1) =>
  Array.from({length: n + 1}, (_, i) => {
    const a = Math.PI - (Math.PI * i) / n;
    return {x: rx * Math.cos(a), y: cy + sgn * ry * Math.sin(a)};
  });
const pl = (pts: {x: number; y: number}[]) => pts.map((p) => `${f(p.x)},${f(p.y)}`).join(' L');

type CupProps = {
  /** cup centre, screen px */
  x: number;
  y: number;
  /** px per world unit */
  s: number;
  /** rotation (deg, clockwise) */
  rot: number;
  /** 0..1 coffee sloshing out of the top */
  spill?: number;
  /** 0..1 steam wisps above an upright cup (needs t to drift) */
  steam?: number;
  t?: number;
  /** no coffee inside (after the spill) */
  empty?: boolean;
};

export const CoffeeCup: React.FC<CupProps> = ({x, y, s, rot, spill = 0, steam = 0, t = 0, empty = false}) => {
  const id = uid('cup');
  const {h, rt, rb} = CUP;
  const k = s; // local units -> px
  const yT = -h / 2, yB = h / 2;
  const ryT = rt * 0.3, ryB = rb * 0.3;
  const iw = inkW(s * 0.09) / k; // ink width in local units (constant on screen)
  // body silhouette: left side down, front arc of the bottom, right side up, front arc of the rim
  const bot = frontArc(yB, rb, ryB);
  const rimFront = frontArc(yT, rt, ryT).reverse();
  const bodyD = `M${f(-rt)},${f(yT)} L${pl(bot)} L${f(rt)},${f(yT)} L${pl(rimFront)} Z`;
  // the red band, between two heights, following the cup's taper and curvature
  const band = (y0: number, y1: number) => {
    const r0 = rt + (rb - rt) * ((y0 - yT) / h), r1 = rt + (rb - rt) * ((y1 - yT) / h);
    const a = frontArc(y0, r0, r0 * 0.3);
    const b = frontArc(y1, r1, r1 * 0.3).reverse();
    return `M${pl(a)} L${pl(b)} Z`;
  };
  const rimD = `M${f(-rt)},${f(yT)} A${f(rt)} ${f(ryT)} 0 1 1 ${f(rt)},${f(yT)} A${f(rt)} ${f(ryT)} 0 1 1 ${f(-rt)},${f(yT)} Z`;
  const liq = rt * 0.9;
  const lvY = yT + 0.1;
  const coffeeD = `M${f(-liq)},${f(lvY)} A${f(liq)} ${f(liq * 0.3)} 0 1 1 ${f(liq)},${f(lvY)} A${f(liq)} ${f(liq * 0.3)} 0 1 1 ${f(-liq)},${f(lvY)} Z`;

  // spill: a tongue of coffee rising out of the mouth and curling over, then droplets beyond its tip
  const sp = Math.max(0, Math.min(1, spill));
  /** a liquid ribbon along a quadratic centreline with half-widths w(q), closed by a round blob at its end */
  const ribbon = (p0: {x: number; y: number}, c: {x: number; y: number}, p1: {x: number; y: number}, w: (q: number) => number) => {
    const N = 12;
    const at = (q: number) => ({x: (1 - q) * (1 - q) * p0.x + 2 * (1 - q) * q * c.x + q * q * p1.x, y: (1 - q) * (1 - q) * p0.y + 2 * (1 - q) * q * c.y + q * q * p1.y});
    const tan = (q: number) => {
      const dx = 2 * (1 - q) * (c.x - p0.x) + 2 * q * (p1.x - c.x), dy = 2 * (1 - q) * (c.y - p0.y) + 2 * q * (p1.y - c.y);
      const l = Math.hypot(dx, dy) || 1;
      return {x: dx / l, y: dy / l};
    };
    const Lp: string[] = [], Rp: string[] = [];
    for (let i = 0; i <= N; i++) {
      const q = i / N, P0 = at(q), T = tan(q), ww = w(q);
      Lp.push(`${f(P0.x - T.y * ww)},${f(P0.y + T.x * ww)}`);
      Rp.push(`${f(P0.x + T.y * ww)},${f(P0.y - T.x * ww)}`);
    }
    const we = w(1);
    return `M${Lp.join(' L')} A${f(we)} ${f(we)} 0 0 0 ${Rp[N]} L${Rp.slice().reverse().join(' L')} Z`;
  };
  const tongue = (() => {
    if (sp <= 0.01) return null;
    const L = 0.35 + 1.5 * sp;
    const bw = rt * (0.62 + 0.2 * sp);
    const tip = {x: 0.5 * L, y: yT - 0.8 * L};
    // the main sheet: wide at the lip, a narrowing neck, a round head (the slosh about to break into drops)
    const head = 0.13 + 0.09 * sp;
    const d = ribbon({x: 0.05, y: yT + 0.04}, {x: -0.05 * L, y: yT - 0.75 * L}, tip, (q) => bw * Math.pow(1 - q, 1.4) * 0.95 + head * Math.pow(q, 3) + 0.05);
    const drops = [0, 1, 2, 3].map((i) => {
      const u = 0.3 + i * 0.25;
      const r = (0.13 - i * 0.022) * (0.6 + 0.4 * sp);
      const ox = tip.x + (0.18 + 0.22 * hash(i + 3)) * u * L;
      const oy = tip.y + (0.05 + 0.3 * u) * L * 0.5 - 0.12 * hash(i + 11);
      return {x: ox, y: oy, r};
    });
    // a second, smaller slosh off the other lip
    const d2 = ribbon({x: -rt * 0.62, y: yT + 0.02}, {x: -rt * 0.9, y: yT - 0.35 * L}, {x: -rt * 1.05 - 0.15 * sp, y: yT - 0.42 * L}, (q) => 0.2 * Math.pow(1 - q, 1.2) + 0.07 + 0.04 * q);
    return {d, d2, drops, tip};
  })();

  const st = Math.max(0, Math.min(1, steam)) * Math.max(0, Math.cos((rot * Math.PI) / 180));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-b`} gradientUnits="userSpaceOnUse" x1={f(-rt)} y1="0" x2={f(rt)} y2="0">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.35" stopColor={C.cup} />
          <stop offset="0.8" stopColor={CUP_SHADE} />
          <stop offset="1" stopColor={shade(CUP_SHADE, 0.2)} />
        </linearGradient>
        <linearGradient id={`${id}-r`} gradientUnits="userSpaceOnUse" x1={f(-rt)} y1="0" x2={f(rt)} y2="0">
          <stop offset="0" stopColor={lit(C.cupBand, 0.3)} />
          <stop offset="0.4" stopColor={C.cupBand} />
          <stop offset="1" stopColor={shade(C.cupBand, 0.35)} />
        </linearGradient>
        <radialGradient id={`${id}-c`} gradientUnits="userSpaceOnUse" cx={f(-liq * 0.3)} cy={f(lvY - 0.05)} r={f(liq * 1.1)}>
          <stop offset="0" stopColor={C.coffeeLit} />
          <stop offset="0.55" stopColor={C.coffee} />
          <stop offset="1" stopColor={COFFEE_DEEP} />
        </radialGradient>
        <linearGradient id={`${id}-t`} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0" stopColor={C.coffee} />
          <stop offset="1" stopColor={C.coffeeLit} />
        </linearGradient>
      </defs>
      {st > 0.01 && (
        <g opacity={st}>
          <defs>
            <linearGradient id={`${id}-st`} gradientUnits="userSpaceOnUse" x1="0" y1={f(y + (yT - 0.1) * k)} x2="0" y2={f(y + (yT - 2.0) * k)}>
              <stop offset="0" stopColor="#EAF4FF" stopOpacity={0} />
              <stop offset="0.25" stopColor="#EAF4FF" stopOpacity={0.42} />
              <stop offset="1" stopColor="#EAF4FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          {[-0.2, 0.22].map((ox, i) => {
            // a soft S-shaped ribbon that sways as it rises (filled, tapering to a point at the top)
            const ph = t * 2.2 + i * 2.4;
            const x0 = x + ox * k;
            const y0 = y + (yT - 0.15) * k;
            const H2 = 1.8 * k;
            const sx = (q: number) => x0 + Math.sin(ph + q * 4.2) * 0.2 * k * (0.3 + q);
            const wq = (q: number) => 0.09 * k * (1 - q) + 0.01 * k;
            const qs = [0, 0.2, 0.4, 0.6, 0.8, 1];
            const L = qs.map((q) => `${f(sx(q) - wq(q))},${f(y0 - q * H2)}`);
            const R = qs.slice().reverse().map((q) => `${f(sx(q) + wq(q))},${f(y0 - q * H2)}`);
            return <path key={i} d={`M${L.join(' L')} L${R.join(' L')} Z`} fill={`url(#${id}-st)`} strokeLinejoin="round" />;
          })}
        </g>
      )}
      <g transform={`translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(k)})`}>
        {tongue && (
          <g>
            <path d={tongue.d2} fill={`url(#${id}-t)`} stroke={INK} strokeWidth={f(iw)} strokeLinejoin="round" />
          </g>
        )}
        <path d={bodyD} fill={`url(#${id}-b)`} stroke={INK} strokeWidth={f(iw)} strokeLinejoin="round" />
        <path d={band(-0.12, 0.5)} fill={`url(#${id}-r)`} />
        {/* a small white heart on the band (the cup's logo) */}
        <path d="M-0.16,0.06 C-0.16,-0.04 -0.04,-0.06 -0.02,0.03 C0,-0.06 0.12,-0.04 0.12,0.06 C0.12,0.16 0,0.22 -0.02,0.28 C-0.04,0.22 -0.16,0.16 -0.16,0.06 Z" fill="#FFFFFF" opacity={0.9} transform="translate(-0.12 0)" />
        <path d={`M${pl(frontArc(-0.12, rt + (rb - rt) * ((-0.12 - yT) / h), (rt + (rb - rt) * ((-0.12 - yT) / h)) * 0.3))}`} fill="none" stroke={INK} strokeWidth={f(iw * 0.55)} opacity={0.6} />
        <path d={`M${pl(frontArc(0.5, rt + (rb - rt) * ((0.5 - yT) / h), (rt + (rb - rt) * ((0.5 - yT) / h)) * 0.3))}`} fill="none" stroke={INK} strokeWidth={f(iw * 0.55)} opacity={0.6} />
        {/* paper seam and a gloss streak on the lit side */}
        <path d={`M${f(rt * 0.62)},${f(yT + 0.2)} L${f(rb * 0.62)},${f(yB - 0.08)}`} stroke={shade(CUP_SHADE, 0.15)} strokeWidth={f(iw * 0.4)} opacity={0.5} />
        <path d={`M${f(-rt * 0.62)},${f(yT + 0.24)} L${f(-rb * 0.62)},${f(yB - 0.2)}`} stroke="#FFFFFF" strokeWidth={f(0.1)} strokeLinecap="round" opacity={0.85} />
        {/* the mouth: inner wall, coffee, rolled rim */}
        <path d={rimD} fill={CUP_INSIDE} />
        {!empty && <path d={coffeeD} fill={`url(#${id}-c)`} />}
        {!empty && <ellipse cx={f(-liq * 0.35)} cy={f(lvY - 0.03)} rx={f(liq * 0.32)} ry={f(liq * 0.07)} fill="#FFFFFF" opacity={0.45} />}
        <path d={rimD} fill="none" stroke={INK} strokeWidth={f(iw)} />
        <path d={`M${f(-rt * 0.92)},${f(yT + 0.03)} A${f(rt * 0.92)} ${f(ryT * 0.85)} 0 0 0 ${f(rt * 0.92)},${f(yT + 0.03)}`} fill="none" stroke="#FFFFFF" strokeWidth={f(0.07)} opacity={0.9} />
        {tongue && (
          <g>
            <path d={tongue.d} fill={`url(#${id}-t)`} stroke={INK} strokeWidth={f(iw)} strokeLinejoin="round" />
            <path d={`M${f(-rt * 0.3)},${f(yT - 0.1)} Q${f(tongue.tip.x * 0.2)},${f(tongue.tip.y * 0.7 + yT * 0.3)} ${f(tongue.tip.x * 0.75)},${f(tongue.tip.y + 0.06)}`} fill="none" stroke="#FFFFFF" strokeWidth={f(0.07)} strokeLinecap="round" opacity={0.55} />
            {tongue.drops.map((q, i) => (
              <g key={i}>
                <circle cx={f(q.x)} cy={f(q.y)} r={f(q.r)} fill={i % 2 ? C.coffee : C.coffeeLit} stroke={INK} strokeWidth={f(iw * 0.8)} />
                <circle cx={f(q.x - q.r * 0.35)} cy={f(q.y - q.r * 0.35)} r={f(q.r * 0.28)} fill="#FFFFFF" opacity={0.7} />
              </g>
            ))}
          </g>
        )}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------------------------------------------------
// CoffeeSplash: a small 3D model of the splash on the floor plane (X right, Z toward the viewer, Y up), drawn
// top-down (view 1: a circle with a crown of droplets — matched to the robot's round head next) or from the side
// (view 0: a crown rising from an ellipse), or anywhere between.
// ------------------------------------------------------------------------------------------------------------
type SplashProps = {
  cx: number;
  cy: number;
  /** px, final puddle radius */
  r: number;
  /** 0..1: impact crown -> spreading splash with droplets -> settled round puddle */
  u: number;
  /** 1 = top-down, 0 = side */
  view?: number;
  /** the empty cup lies in the puddle */
  cupLanded?: boolean;
};

const N_SPIKE = 13;
const N_DROP = 20;

export const CoffeeSplash: React.FC<SplashProps> = ({cx, cy, r, u: u0, view = 1, cupLanded = false}) => {
  const id = uid('spl');
  const u = Math.max(0, Math.min(1, u0));
  const vw = Math.max(0, Math.min(1, view));
  const ky = 0.3 + 0.7 * vw; // floor-plane squash
  const kh = 1 - vw; // how much height shows
  const P = (X: number, Z: number, Y: number) => ({x: cx + X, y: cy + Z * ky - Y * kh});
  const iw = inkW(1.6 + r * 0.008);
  const eo = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 3);
  // puddle radius: fast spread, settles with a tiny overshoot
  const pr = r * (0.18 + 0.82 * eo(u / 0.62)) * (1 + 0.04 * Math.sin(Math.min(1, Math.max(0, (u - 0.5) / 0.5)) * Math.PI));
  // crown: rises fast, then falls back into the rim
  const cu = Math.max(0, Math.min(1, u / 0.5));
  const crownH = r * 0.85 * Math.sin(Math.PI * Math.pow(cu, 0.7)) * (u < 0.5 ? 1 : 0);
  // the rim's wobble decays as it settles into a near-perfect circle
  const wob = 0.08 * Math.pow(1 - u, 1.5);
  const rimR = (a: number) => pr * (1 + wob * (Math.sin(a * 5 + 1.3) * 0.6 + Math.sin(a * 9 + 0.4) * 0.4));
  // seen from above, the crown reads as a splat: rounded fingers of liquid radiating from the pool (they shrink back
  // into the rim as it settles); seen from the side it is the rising crown below
  const fingers = Array.from({length: N_SPIKE}, (_, i) => {
    const a = (i / N_SPIKE) * Math.PI * 2 + 0.25 * (hash(i + 40) - 0.5);
    const len = crownH * (0.45 + 0.55 * hash(i + 7)) * 0.55 * Math.pow(vw, 1.6); // (crossfades with the side crown: no doubled ring of beads mid-view)
    const wd = 0.17 + 0.1 * hash(i + 19);
    return {a, len, wd};
  });
  const angD = (x: number, y: number) => Math.atan2(Math.sin(x - y), Math.cos(x - y));
  const splatR = (a: number) => {
    let ext = 0;
    for (const q of fingers) {
      const x = angD(a, q.a) / q.wd;
      if (Math.abs(x) < 1) ext = Math.max(ext, q.len * Math.pow(1 - x * x, 0.45));
    }
    return rimR(a) + ext;
  };
  const M = 160;
  const rimPts = Array.from({length: M}, (_, i) => {
    const a = (i / M) * Math.PI * 2;
    const rr = splatR(a);
    return P(rr * Math.cos(a), rr * Math.sin(a), 0);
  });
  const rimD = `M${rimPts.map((p) => `${f(p.x)},${f(p.y)}`).join(' L')} Z`;
  const fingerBeads = fingers.filter((q) => q.len > r * 0.08).map((q) => {
    const rr = rimR(q.a) + q.len;
    const c = P(rr * Math.cos(q.a), rr * Math.sin(q.a), 0);
    return {c, rb: Math.max(1.2, pr * q.wd * 0.55 * Math.min(1, q.len / (r * 0.25)))};
  });

  // the crown: rounded liquid fingers (wide bases that merge into a wall, beads forming at the tips), leaning outward
  const spikes = Array.from({length: N_SPIKE}, (_, i) => {
    const a = (i / N_SPIKE) * Math.PI * 2 + 0.25 * (hash(i + 40) - 0.5);
    const hh = crownH * (0.6 + 0.55 * hash(i + 7)) * Math.pow(1 - vw, 1.6);
    const base = rimR(a);
    const w = ((Math.PI * 2 * base) / N_SPIKE) * 0.5;
    const tipR = base + hh * 0.6;
    const ca = Math.cos(a), sa = Math.sin(a);
    const tx = -sa, tz = ca; // tangent
    const b0 = P(base * ca - tx * w, base * sa - tz * w, 0);
    const b1 = P(base * ca + tx * w, base * sa + tz * w, 0);
    const tip = P(tipR * ca, tipR * sa, hh);
    const mid = P((base + hh * 0.22) * ca, (base + hh * 0.22) * sa, hh * 0.4);
    // the tip bead grows with the finger (a low crown seen from above must not read as a ring of loose beads)
    const bead = Math.max(1.2, w * 0.42 * (0.7 + 0.3 * hash(i + 3)) * Math.min(1, hh / (r * 0.3)));
    const neck = bead * 0.55;
    // finger outline in screen space: base corners -> narrowing sides -> round tip
    const dx = tip.x - mid.x, dy = tip.y - mid.y;
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l, ny = dx / l;
    const tl = {x: tip.x + nx * neck, y: tip.y + ny * neck};
    const tr = {x: tip.x - nx * neck, y: tip.y - ny * neck};
    const ml = {x: mid.x + nx * w * 0.8, y: mid.y + ny * w * 0.8};
    const mr = {x: mid.x - nx * w * 0.8, y: mid.y - ny * w * 0.8};
    const side = (b0.x - b1.x) * nx + (b0.y - b1.y) * ny > 0;
    const [B0, B1] = side ? [b0, b1] : [b1, b0];
    const d = `M${f(B0.x)},${f(B0.y)} Q${f(ml.x)},${f(ml.y)} ${f(tl.x)},${f(tl.y)} A${f(neck)} ${f(neck)} 0 1 1 ${f(tr.x)},${f(tr.y)} Q${f(mr.x)},${f(mr.y)} ${f(B1.x)},${f(B1.y)} Z`;
    return {a, depth: sa, d, tip, bead, hh};
  });

  // flying droplets: launched from the crown, ballistic, then land and stay as a ring of satellite drops
  const drops = Array.from({length: N_DROP}, (_, i) => {
    const a = (i / N_DROP) * Math.PI * 2 + 0.5 * (hash(i + 101) - 0.5);
    const t0 = 0.05 + 0.12 * hash(i + 17);
    const dt = Math.max(0, u - t0);
    const vr = r * (0.45 + 0.55 * hash(i + 29));
    const vy = r * (1.2 + 1.4 * hash(i + 61));
    const g = r * 7.5;
    const tLand = (2 * vy) / g;
    const tt = Math.min(dt, tLand);
    const rad0 = r * (0.18 + 0.82 * eo(t0 / 0.62));
    const flyK = 1 - Math.exp(-tt * 3);
    const rad = Math.max(rad0 + vr * flyK * 0.9, pr * (1.06 + 0.2 * hash(i + 53)));
    const Y = Math.max(0, vy * tt - 0.5 * g * tt * tt);
    const landed = dt >= tLand;
    const sz = r * (0.025 + 0.05 * hash(i + 77)) * (landed ? 1.25 : 1);
    return {a, rad, Y, sz, landed, live: dt > 0, depth: Math.sin(a)};
  });

  const coffeeFill = `url(#${id}-p)`;
  const back = spikes.filter((q) => q.depth < 0 || vw > 0.5);
  const front = spikes.filter((q) => !(q.depth < 0 || vw > 0.5));
  const spikeEl = (q: (typeof spikes)[number], i: number) =>
    q.hh > r * 0.02 ? (
      <g key={i}>
        <path d={q.d} fill={`url(#${id}-p)`} stroke={INK} strokeWidth={f(iw)} strokeLinejoin="round" />
        <circle cx={f(q.tip.x)} cy={f(q.tip.y)} r={f(q.bead)} fill={C.coffeeLit} stroke={INK} strokeWidth={f(iw)} />
        <circle cx={f(q.tip.x - q.bead * 0.3)} cy={f(q.tip.y - q.bead * 0.35)} r={f(q.bead * 0.3)} fill="#FFFFFF" opacity={0.6} />
      </g>
    ) : null;
  const dropEl = (q: (typeof drops)[number], i: number) => {
    if (!q.live) return null;
    const p = P(q.rad * Math.cos(q.a), q.rad * Math.sin(q.a), q.Y);
    const ry = q.landed ? q.sz * (0.55 + 0.45 * vw) : q.sz;
    return (
      <g key={`d${i}`}>
        <ellipse cx={f(p.x)} cy={f(p.y)} rx={f(q.sz)} ry={f(ry)} fill={C.coffee} stroke={INK} strokeWidth={f(iw * 0.85)} />
        <circle cx={f(p.x - q.sz * 0.3)} cy={f(p.y - ry * 0.35)} r={f(q.sz * 0.3)} fill="#FFFFFF" opacity={0.55} />
      </g>
    );
  };
  const hl = P(-pr * 0.35, -pr * 0.38, 0);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-p`} gradientUnits="userSpaceOnUse" cx={f(cx - pr * 0.2)} cy={f(cy - pr * 0.25 * ky)} r={f(pr * 1.15)}>
          <stop offset="0" stopColor={C.coffeeLit} />
          <stop offset="0.55" stopColor={C.coffee} />
          <stop offset="0.9" stopColor={mix(C.coffee, COFFEE_DEEP, 0.6)} />
          <stop offset="1" stopColor={COFFEE_DEEP} />
        </radialGradient>
      </defs>
      {/* contact darkening of the floor round the puddle */}
      <ellipse cx={f(cx)} cy={f(cy + (1 - vw) * pr * 0.05)} rx={f(pr * 1.07)} ry={f(pr * 1.07 * ky)} fill="#05080F" opacity={0.12} />
      {drops.filter((q) => q.landed).map(dropEl)}
      {back.map(spikeEl)}
      <path d={rimD} fill={coffeeFill} stroke={INK} strokeWidth={f(iw)} strokeLinejoin="round" />
      {fingerBeads.map((q, i) => (
        <g key={`fb${i}`}>
          <circle cx={f(q.c.x)} cy={f(q.c.y)} r={f(q.rb)} fill={C.coffee} stroke={INK} strokeWidth={f(iw)} />
          <circle cx={f(q.c.x - q.rb * 0.3)} cy={f(q.c.y - q.rb * 0.35)} r={f(q.rb * 0.32)} fill="#FFFFFF" opacity={0.5} />
        </g>
      ))}
      {/* inner ring where the crown's wall meets the pool (fades as it settles) */}
      <ellipse cx={f(cx)} cy={f(cy)} rx={f(pr * 0.8)} ry={f(pr * 0.8 * ky)} fill="none" stroke={COFFEE_DEEP} strokeWidth={f(Math.max(1, pr * 0.05))} opacity={0.35 * (1 - u)} />
      {/* glossy highlights: a soft crescent and a crisp spot toward the key light */}
      <ellipse cx={f(hl.x)} cy={f(hl.y)} rx={f(pr * 0.34)} ry={f(pr * 0.12 * ky + pr * 0.03)} transform={`rotate(-30 ${f(hl.x)} ${f(hl.y)})`} fill="#FFFFFF" opacity={0.28} />
      <ellipse cx={f(hl.x - pr * 0.05)} cy={f(hl.y - pr * 0.02)} rx={f(pr * 0.1)} ry={f(pr * 0.05 * ky + pr * 0.015)} transform={`rotate(-30 ${f(hl.x)} ${f(hl.y)})`} fill="#FFFFFF" opacity={0.7} />
      <path d={`M${f(cx + pr * 0.62)},${f(cy + pr * 0.5 * ky)} A${f(pr * 0.8)} ${f(pr * 0.8 * ky)} 0 0 1 ${f(cx - pr * 0.1)},${f(cy + pr * 0.8 * ky)}`} fill="none" stroke={COFFEE_DEEP} strokeWidth={f(Math.max(1, pr * 0.04))} strokeLinecap="round" opacity={0.4} />
      {front.map(spikeEl)}
      {drops.filter((q) => !q.landed).map(dropEl)}
      {cupLanded && <CoffeeCup x={cx + r * 0.42} y={cy - r * 0.08 * ky} s={r * 0.38} rot={104} empty />}
    </g>
  );
};
