// V2: the fungal stalk drawn as a living structure (Ophiocordyceps unilateralis s.l., from field photographs):
// - emergence: the cuticle at the back of the head swells into a pale blister, splits along cracks, and a pale,
//   rounded primordium pushes out through a collar of white mycelium;
// - the stalk (stroma): wiry and slightly irregular, near-black at the base, warm brown along its length, pale and
//   swollen at the growing tip while it grows (a tapered, paler sterile tip once mature); fibrous striations and
//   faint growth bands along it;
// - the reproductive region: a lateral cushion (ascoma) partway along, built from many flask-shaped perithecia whose
//   rounded tops bulge from its surface; when mature their openings (ostioles) darken and open, and the long thin
//   ascospores are shot from them.
// All geometry is deterministic (seeded); the stalk's centreline is fixed for each ant, so it never changes shape.
import React from 'react';
import {add3, Basis, cross3, dot3, len3, mul3, norm3, P2, proj, smoothClosed, smoothOpen, sub3, V3} from '../core/three';
import {ellipsoidItem, inkW, Item} from '../core/draw3';
import {lit, mix, shade} from '../core/color';
import {INK} from '../core/ink';
import {hash, noise1} from '../lib';
import {hw, Rig, STALK_BASE} from '../ant/rig';
import {ascoma as cushion, ASC_AT, CUSH, perithecia, StalkSpec, stalkAt, stalkLine} from './fungus';

const f2 = (n: number) => n.toFixed(2);
let sid = 0;
let sns = '';
export const resetStalkIds = (ns = '') => {
  sid = 0;
  sns = ns;
};

/** radius (mm) along the stalk at arc fraction a, for a stalk grown to g */
const radius = (sp: StalkSpec, a: number, g: number) => {
  const flare = 0.16 * Math.exp(-a / 0.035);
  let r = 0.34 - 0.11 * a + flare + 0.025 * noise1(a * 16, sp.seed) + 0.05 * Math.exp(-(((a - ASC_AT) / 0.05) ** 2));
  const growing = g < 0.985;
  const toTip = (g - a) * sp.len; // mm from the tip
  if (growing) {
    // the growing apex: swollen and rounded
    r *= 1 + 0.32 * Math.exp(-((toTip / 0.7) ** 2));
  } else {
    // the mature sterile tip tapers to a point
    r *= 0.45 + 0.55 * Math.min(1, toTip / 2.2);
  }
  return r;
};

/** emergence at the back of the head: blister, cracks, then the primordium (e 0..1) */
export const emergeItems = (B: Basis, R: Rig, e: number): Item[] => {
  if (e <= 0.01) return [];
  const st = R.st, sc = st.scale ?? 1, H = R.head;
  const c = hw(st, H, STALK_BASE);
  const n = norm3(add3(mul3(H.u, 1), mul3(H.f, -0.35)));
  const bl = Math.min(1, e / 0.55);
  const items: Item[] = [];
  // the blister: the cuticle stretched and paling over the swelling tissue
  const bc = add3(c, mul3(n, 0.08 * bl * sc));
  items.push(ellipsoidItem(B, bc, [mul3(H.f, 0.42 * bl * sc), mul3(H.l, 0.42 * bl * sc), mul3(n, 0.24 * bl * sc)], mix('#7A4632', '#D6AE90', 0.35 + 0.5 * bl), {spec: 1.2, glossy: true, zBias: -0.15 * sc}));
  // cracks radiating through the head's cuticle as it splits
  const cr = Math.max(0, Math.min(1, (e - 0.35) / 0.4));
  if (cr > 0) {
    const C = proj(B, c);
    const lines: string[] = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + hash(k * 2.7) * 0.6;
      const L = (0.45 + 0.35 * hash(k * 5.1)) * cr * sc;
      const pts = [0, 0.35, 0.7, 1].map((u, j) => {
        const jit = j ? (hash(k * 11 + j) - 0.5) * 0.18 * sc : 0;
        const dir = add3(mul3(H.f, Math.cos(a)), mul3(H.l, Math.sin(a)));
        const perp = add3(mul3(H.f, -Math.sin(a)), mul3(H.l, Math.cos(a)));
        return proj(B, add3(add3(c, mul3(dir, (0.25 + u * L))), mul3(perp, jit)));
      });
      lines.push(smoothOpen(pts));
    }
    items.push({
      z: C.z - 0.3 * sc,
      el: (
        <g key="cracks">
          {lines.map((d, k) => <path key={k} d={d} fill="none" stroke="#1C110B" strokeWidth={f2(Math.max(0.8, 0.05 * C.s * sc))} strokeLinecap="round" opacity={0.85} />)}
        </g>
      ),
    });
  }
  return items;
};

/** the basal collar of white mycelium where the stalk leaves the head */
const collarEl = (B: Basis, R: Rig, k: number, key: string): Item => {
  const st = R.st, sc = st.scale ?? 1, H = R.head;
  const c = hw(st, H, STALK_BASE);
  const C = proj(B, c);
  const strokes: string[] = [];
  for (let m = 0; m < 18; m++) {
    const a = (m / 18) * Math.PI * 2 + hash(m * 3.1) * 0.4;
    const dir = add3(mul3(H.f, Math.cos(a)), mul3(H.l, Math.sin(a)));
    const L = (0.35 + 0.4 * hash(m * 7.7)) * k * sc;
    const p1 = proj(B, add3(c, mul3(dir, 0.3 * sc))), p2 = proj(B, add3(add3(c, mul3(dir, 0.3 * sc + L)), mul3(H.u, 0.12 * sc * hash(m))));
    strokes.push(`M${P2(p1)} L${P2(p2)}`);
  }
  const w = Math.max(0.6, 0.04 * C.s * sc);
  return {
    z: C.z - 0.2 * sc,
    el: (
      <g key={key} opacity={Math.min(1, k * 1.5)}>
        <circle cx={f2(C.x)} cy={f2(C.y)} r={f2(0.42 * k * sc * C.s)} fill="#EEE9DC" opacity={0.75} />
        {strokes.map((d, m) => <path key={m} d={d} stroke="#F6F2E7" strokeWidth={f2(w)} strokeLinecap="round" opacity={0.85} />)}
      </g>
    ),
  };
};

/** the stalk grown to g (0..1 of its length), with its cushion (asc 0..1) and openings (open 0..1) */
export const stalkItemsV2 = (B: Basis, R: Rig, sp: StalkSpec, g: number, asc: number, open: number, o: {zBias?: number; fog?: number; t?: number} = {}): Item[] => {
  if (g <= 0.003) return [];
  const line = stalkLine(R, sp);
  const sc = R.st.scale ?? 1;
  const fog = o.fog ?? 0;
  // sample the grown part finely
  const M = Math.max(4, Math.ceil(g * 44));
  const as = Array.from({length: M + 1}, (_, k) => (k / M) * g);
  const P = as.map((a) => proj(B, stalkAt(line, a).p));
  if (P.some((q) => q.z < 2)) return [];
  const R0 = as.map((a) => radius(sp, a, g) * sc);
  // the outline, offset in screen space
  const L: {x: number; y: number}[] = [], Rr: {x: number; y: number}[] = [], N: {x: number; y: number}[] = [];
  for (let k = 0; k < P.length; k++) {
    const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
    let tx = b.x - a.x, ty = b.y - a.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    N.push({x: -ty, y: tx});
    const r = R0[k] * P[k].s;
    L.push({x: P[k].x - ty * r, y: P[k].y + tx * r});
    Rr.push({x: P[k].x + ty * r, y: P[k].y - tx * r});
  }
  const tip = P[P.length - 1], prv = P[P.length - 2];
  const tl = Math.hypot(tip.x - prv.x, tip.y - prv.y) || 1;
  const rt = R0[R0.length - 1] * tip.s;
  const cap = {x: tip.x + ((tip.x - prv.x) / tl) * rt, y: tip.y + ((tip.y - prv.y) / tl) * rt};
  const outline = [...L, cap, ...[...Rr].reverse()];
  // which side is lit (light from the upper left)
  const midK = Math.floor(P.length * 0.4);
  const litSide = N[midK].x * -0.6 + N[midK].y * -0.8 < 0 ? 1 : -1; // +1: R side lit
  const along = (frac: number, k: number) => ({x: P[k].x + N[k].x * frac * R0[k] * P[k].s, y: P[k].y + N[k].y * frac * R0[k] * P[k].s});
  const shadowLine = smoothOpen(P.map((_, k) => along(0.55 * litSide, k)));
  const hiLine = smoothOpen(P.slice(1, -1).map((_, k) => along(-0.5 * litSide, k + 1)));
  // fibrous striations, slightly wandering
  const stri = [-0.25, 0.1, 0.38].map((f, j) => smoothOpen(P.map((_, k) => along(f + 0.12 * noise1(k * 0.6, sp.seed + j * 5), k))));
  // faint growth bands across the stalk
  const bands: string[] = [];
  for (let b = 1; b < 9; b++) {
    const a = b * 0.11 + 0.03 * hash(sp.seed + b);
    if (a > g - 0.04) break;
    const k = Math.round((a / g) * M);
    bands.push(`M${P2(along(-0.9, k))} L${P2(along(0.9, k))}`);
  }
  const id = `${sns}s2_${sid++}`;
  const w = inkW(P[0].s * sc, 0.8);
  const growing = g < 0.985;
  const tipCol = growing ? '#F1E8D2' : '#CDB993';
  const fogC = (c: string) => mix(c, '#5E826A', fog * 0.6);
  const zStalk = proj(B, stalkAt(line, Math.min(g, 0.3) * 0.5).p).z;
  const s0 = P[0].s * sc;
  const items: Item[] = [
    {
      z: zStalk + (o.zBias ?? 0),
      el: (
        <g key={id}>
          <defs>
            <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f2(P[0].x)} y1={f2(P[0].y)} x2={f2(tip.x)} y2={f2(tip.y)}>
              <stop offset="0" stopColor={fogC('#22150E')} />
              <stop offset={f2(Math.min(0.5, 0.06 / g))} stopColor={fogC('#3A2517')} />
              <stop offset={f2(Math.min(0.75, 0.45 / Math.max(g, 0.5)))} stopColor={fogC('#6E4B2F')} />
              <stop offset={f2(growing ? 0.86 : 0.9)} stopColor={fogC(growing ? '#A8875E' : '#94704A')} />
              <stop offset="1" stopColor={fogC(tipCol)} />
            </linearGradient>
          </defs>
          <path d={smoothClosed(outline)} fill={`url(#${id})`} stroke={INK} strokeWidth={f2(w)} strokeLinejoin="round" strokeOpacity={1 - fog * 0.6} />
          <path d={shadowLine} fill="none" stroke="#120B07" strokeWidth={f2(Math.max(0.7, 0.32 * R0[midK] * P[midK].s))} strokeLinecap="round" opacity={0.28} />
          {stri.map((d, j) => <path key={j} d={d} fill="none" stroke={j === 1 ? '#E6D5B4' : '#2A1A10'} strokeWidth={f2(Math.max(0.5, 0.05 * s0))} strokeLinecap="round" opacity={j === 1 ? 0.22 : 0.3} />)}
          {bands.map((d, j) => <path key={`b${j}`} d={d} fill="none" stroke="#1E130C" strokeWidth={f2(Math.max(0.5, 0.045 * s0))} opacity={0.25} />)}
          <path d={hiLine} fill="none" stroke="#FFF4DE" strokeWidth={f2(Math.max(0.6, 0.14 * R0[midK] * P[midK].s))} strokeLinecap="round" opacity={0.32} />
          {growing && <circle cx={f2(tip.x)} cy={f2(tip.y)} r={f2(rt * 0.7)} fill="#FFFBF0" opacity={0.35} />}
        </g>
      ),
    },
  ];
  items.push(collarEl(B, R, Math.min(1, g * 6), `${id}c`));
  // the reproductive region: a cushion of perithecia on the stalk's lower side
  if (asc > 0.01 && g > ASC_AT + 0.06) {
    const C = cushion(line, asc, open);
    const Cp = proj(B, C.c);
    const base = ellipsoidItem(B, C.c, [mul3(C.d, 1.3 * C.k * sc), mul3(C.out, 0.8 * C.k * sc), mul3(C.side, 1.0 * C.k * sc)], fogC('#6E3E20'), {spec: 0.4, zBias: (o.zBias ?? 0) - 0.02});
    const bumps = perithecia(C)
      .map((q, i) => {
        const Q = proj(B, q.pos);
        const vis = dot3(q.n, sub3(B.eye, q.pos)) > -0.15;
        return {Q, vis, i, n: q.n, pos: q.pos};
      })
      .filter((b) => b.vis)
      .sort((a, b) => b.Q.z - a.Q.z);
    const br = CUSH.bump * C.k * sc;
    const pid = `${id}p`;
    items.push({
      z: Cp.z + (o.zBias ?? 0) - 0.05,
      el: (
        <g key={pid}>
          {base.el}
          <defs>
            <radialGradient id={pid} cx="0.35" cy="0.3" r="0.75">
              <stop offset="0" stopColor={fogC(lit('#B5703A', 0.35))} />
              <stop offset="0.6" stopColor={fogC('#A2602F')} />
              <stop offset="1" stopColor={fogC(shade('#A2602F', 0.4))} />
            </radialGradient>
          </defs>
          {bumps.map((b) => {
            const r = br * b.Q.s * (0.85 + 0.3 * hash(b.i * 2.3));
            const tipP = proj(B, add3(b.pos, mul3(b.n, CUSH.bump * C.k * sc * 0.9)));
            return (
              <g key={b.i}>
                <circle cx={f2(b.Q.x)} cy={f2(b.Q.y)} r={f2(r)} fill={`url(#${pid})`} stroke={INK} strokeWidth={f2(Math.max(0.5, w * 0.5))} />
                {open > 0.02 && <circle cx={f2(tipP.x)} cy={f2(tipP.y)} r={f2(r * (0.18 + 0.2 * open))} fill="#1A0D06" opacity={0.3 + 0.7 * open} />}
              </g>
            );
          })}
        </g>
      ),
    });
  }
  return items;
};
