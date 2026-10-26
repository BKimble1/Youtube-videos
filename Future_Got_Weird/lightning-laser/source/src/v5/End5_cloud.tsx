// V5 beat H2 (30.78-31.88), "into the SKY—": the upward flash spreading inside the storm deck, the payoff's climax.
// The guided leader reaches the cloud base at the cut (End5_split rightS). From there, as upward flashes from towers
// do, the discharge branches out through the base of the cell: channels crawl outward from where the line enters the
// deck (to both sides and in depth), and the lobes of the base they run through light up from within, one after
// another, so the light spreads with them (local light on the cloud base, never a frame-wide flash). On the payoff tick
// that starts "SKY" (31.14) the current surges (a brightening of the whole channel and its branches, peaking about
// 31.2); the branches then fade (gone by ~31.7) while the deck keeps a dim glow round the entry into the loop shot.
// Illustrative slow motion. Every frame is a pure function of film time.
//   spreadK, deckK  the light over time (branches, lobes); the guided channel's own light is End5_wide's
//   InCloud5        the in-cloud channels (white core with violet edges, seen through the base: their glow always,
//                   their core where the base is thin) and the lit lobes
// The summit deck's lobes are V3's (v3/Scene3_sky.tsx builds them from deterministic hashes and keeps them private;
// the same rules are re-run here, as v4/Open4_cloud.tsx does, plus the lowering under the attachment), so the light
// follows the clouds on screen.
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {ss} from '../lib';
import {Cam3, projector, Proj, v3, V3} from '../v2/p3';
import {BOLT3V} from '../v3/bolt3';
import {CB, LOOP, magFade} from '../v3/Scene3_sky';
import {PAL} from '../v3/palette';
import {EV, tau3} from '../v3/timeline3';

// ------------------------------------------------------------------ V3's summit deck and its lowering (Scene3_sky rules)
type Lobe = {dx: number; dz: number; r: number; lv: number; hang: number; rag: number; ph: number};
const HL = 5;
const lobe = (dx: number, dz: number, r: number, lv = 0, o: Partial<Lobe> = {}): Lobe => ({dx, dz, r, lv, hang: HL * lv, rag: 0, ph: 0, ...o});
type Mass = {x: number; z: number; drift: number; lobes: Lobe[]};
const mkMass = (x: number, z: number, R: number, key: number, seed: number, stretch: number, drift: number): Mass => {
  const a0 = hash(key, seed + 5) * 6.2832;
  const lvOf = (h: number) => (h < 0.4 ? 0 : h < 0.78 ? 1 : 2);
  const lobes: Lobe[] = [lobe(0, 0, R * (0.66 + 0.08 * hash(key, seed + 6)))];
  if (hash(key, seed + 13) < 0.65) {
    const a = a0 + 2.4;
    lobes.push(lobe(Math.cos(a) * R * 0.3 * stretch, Math.sin(a) * R * 0.3, R * (0.42 + 0.1 * hash(key, seed + 14)), hash(key, seed + 16) < 0.5 ? 0 : 1));
  }
  const n = 8 + Math.floor(hash(key, seed + 4) * 6);
  for (let j = 0; j < n; j++) {
    const a = a0 + (j / n) * 6.2832 + 0.5 * (hash(key * 7 + j, seed + 8) - 0.5);
    const rr = R * (0.13 + 0.2 * Math.pow(hash(key * 7 + j, seed + 9), 1.5));
    const reach = (R - rr) * (0.68 + 0.18 * hash(key * 7 + j, seed + 10));
    lobes.push(lobe(Math.cos(a) * reach * stretch, Math.sin(a) * reach, rr, lvOf(hash(key * 7 + j, seed + 17))));
  }
  const ni = 3 + Math.floor(hash(key, seed + 18) * 3);
  for (let j = 0; j < ni; j++) {
    const a = hash(key * 11 + j, seed + 19) * 6.2832, rad = R * 0.55 * Math.sqrt(hash(key * 11 + j, seed + 20));
    lobes.push(lobe(Math.cos(a) * rad * stretch, Math.sin(a) * rad, R * (0.15 + 0.13 * hash(key * 11 + j, seed + 21)), hash(key * 11 + j, seed + 22) < 0.55 ? 1 : 2, {rag: 0.1, ph: 6.2832 * hash(key * 11 + j, seed + 23)}));
  }
  return {x, z, drift, lobes};
};
const field = (S: number, x0: number, x1: number, z0: number, z1: number, seed: number, R0: number, R1: number, keep: number, stretch: number, drift: number, hole?: {x: number; z: number; r: number}) => {
  const out: Mass[] = [];
  for (let ix = Math.floor(x0 / S); ix <= Math.ceil(x1 / S); ix++) for (let iz = Math.floor(z0 / S); iz <= Math.ceil(z1 / S); iz++) {
    const key = (ix + 300) * 1000 + (iz + 300);
    if (hash(key, seed) > keep) continue;
    const x = (ix + 0.5 + 0.8 * (hash(key, seed + 1) - 0.5)) * S, z = (iz + 0.5 + 0.8 * (hash(key, seed + 2) - 0.5)) * S;
    if (hole && Math.hypot(x - hole.x, z - hole.z) < hole.r) continue;
    const R = R0 + (R1 - R0) * Math.pow(hash(key, seed + 3), 1.6);
    out.push(mkMass(x, z, R, key, seed, stretch, drift));
  }
  return out;
};
const CELL = [mkMass(40, 30, 175, 1, 901, 1.25, 1.2), mkMass(-130, -70, 130, 2, 903, 1.3, 2.4), mkMass(-170, 170, 140, 3, 905, 1.3, 2.4), mkMass(210, 200, 150, 4, 907, 1.3, 2.4)];
const DECK = [...CELL, ...field(300, -2400, 2400, -1500, 2900, 601, 110, 250, 0.8, 1.35, 4, {x: 20, z: 40, r: 280})];
/** where the guided leader meets the base (BOLT3V's top), and the side the main views look from (Scene3_sky) */
const TOP = BOLT3V.pts[BOLT3V.pts.length - 1];
const ATT = {x: TOP.x, z: TOP.z};
const SIDE = {x: -0.67, z: -0.74};
const LOWER: Lobe[] = (() => {
  const out: Lobe[] = [];
  const at = (u: number, v: number) => ({x: ATT.x + u * SIDE.x - v * SIDE.z, z: ATT.z + u * SIDE.z + v * SIDE.x});
  const add = (u: number, v: number, r: number, lv: number, hang: number, rag: number, j: number) => {
    const p = at(u, v);
    out.push(lobe(p.x, p.z, r, lv, {hang, rag, ph: 6.2832 * hash(j, 941)}));
  };
  for (let j = 0; j < 12; j++) add(15 + 80 * hash(j, 931), (hash(j, 933) - 0.5) * 130, 20 + 22 * hash(j, 935), 3, 8 + 5 * hash(j, 937), 0.1 + 0.06 * hash(j, 939), j);
  for (let j = 0; j < 7; j++) {
    const v = (hash(j, 943) - 0.5) * 120;
    add(2 + 12 * hash(j, 945) - 0.003 * v * v, v, 10 + 14 * hash(j, 947), 3, 9 + 5 * hash(j, 949), 0.13, 20 + j);
  }
  for (let j = 0; j < 11; j++) add(14 + 80 * hash(j, 963), (hash(j, 965) - 0.5) * 120, 8 + 12 * hash(j, 967), 4, 14 + 5 * hash(j, 969), 0.14, 40 + j);
  for (let j = 0; j < 5; j++) add(-10 + 26 * hash(j, 955), (hash(j, 953) - 0.5) * 100, 4 + 7 * hash(j, 957), 5, 18 + 8 * hash(j, 959), 0.22, 60 + j);
  return out;
})();
const ragK = (l: {rag: number; ph: number}, a: number) => (l.rag ? 1 + l.rag * (0.55 * Math.sin(3 * a + l.ph) + 0.3 * Math.sin(5 * a + 2.1 * l.ph) + 0.15 * Math.sin(11 * a + 3.7 * l.ph)) : 1);
const ring = (P: (p: V3) => Proj, c: V3, l: Lobe, n = 36) => {
  const pts: Proj[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832;
    const r = l.r * ragK(l, a);
    pts.push(P(v3(c.x + r * Math.cos(a), c.y, c.z + r * Math.sin(a))));
  }
  return pts.every((q) => q.ok && q.z > 20) ? pts : null;
};
type Pt = {x: number; y: number};
const poly = (pts: Pt[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');

// ------------------------------------------------------------------ the in-cloud channels (world metres)
/** the spread starts as the leader reaches the base (the cut) */
export const SPREAD0 = 30.78;
/** the surge on the payoff tick that starts "SKY" */
export const SURGE = EV.payoffTicks[1];
type SPt = V3 & {ta: number};
type Chan = {pts: SPt[]; w: number};
/** a channel crawling along the base from root at azimuth az (radians, in the x-z plane), length L (m), speed v (m/s),
 *  leaving the root at t0: steps of ~5 m whose heading wanders about az (sharp kinks, mean-reverting), its height
 *  weaving a few metres in and out of the base */
const crawl = (root: V3, az: number, L: number, v: number, t0: number, seed: number): SPt[] => {
  const out: SPt[] = [{...root, ta: t0}];
  let p = root, h = az, s = 0;
  for (let i = 0; s < L && i < 120; i++) {
    const step = 3.5 + 4 * hash(i, seed);
    h += (hash(i, seed + 1) - 0.5) * 0.9 + 0.35 * (az - h);
    if (hash(i, seed + 2) < 0.15) h += (hash(i, seed + 3) - 0.5) * 1.4;
    s += step;
    const y = CB + 2 + 3.5 * noise1(s / 22 + seed * 0.37, 9611) - 4 * Math.exp(-s / 25);
    p = v3(p.x + Math.cos(h) * step, y, p.z + Math.sin(h) * step);
    out.push({...p, ta: t0 + s / v});
  }
  return out;
};
const SPIDER: Chan[] = (() => {
  // the main channels: to both sides of the views (screen left and right: az ~ 158 and -22 deg from the main side), in
  // depth (away: lower on screen; toward: overhead), with different lengths and speeds
  const D = Math.PI / 180;
  const mains = [
    {az: -18, L: 115, v: 250, d: 0.0},
    {az: 160, L: 125, v: 270, d: 0.03},
    {az: 35, L: 70, v: 190, d: 0.07},
    {az: 210, L: 80, v: 210, d: 0.1},
    {az: -100, L: 60, v: 180, d: 0.05},
  ];
  const root = v3(TOP.x, TOP.y, TOP.z);
  const out: Chan[] = [];
  mains.forEach((m, i) => {
    const pts = crawl(root, m.az * D, m.L, m.v, SPREAD0 + m.d, 9701 + i * 31);
    out.push({pts, w: 1});
    // two or three side channels off each, forking outward a little way
    const nb = 1 + (hash(i, 9721) < 0.5 ? 1 : 0);
    for (let b = 0; b < nb; b++) {
      const at = Math.floor(pts.length * (0.25 + 0.5 * hash(i * 7 + b, 9723)));
      const r = pts[Math.min(at, pts.length - 1)];
      const side = b % 2 ? 1 : -1;
      const az = m.az * D + side * (0.6 + 0.6 * hash(i * 7 + b, 9725));
      out.push({pts: crawl(r, az, m.L * (0.25 + 0.25 * hash(i * 7 + b, 9727)), m.v * 0.8, r.ta, 9801 + i * 37 + b * 7), w: 0.6});
    }
  });
  return out;
})();
/** the channels' light: growing (the newest part brightest), the surge on SKY, then fading (gone by ~31.72) */
export const spreadK = (t: number) => {
  if (t < SPREAD0) return 0;
  const surge = t < SURGE - 0.02 ? 0 : 0.75 * Math.exp(-Math.max(0, t - SURGE) / 0.16) * clamp((t - SURGE + 0.02) / 0.02);
  return (0.7 + surge) * (1 - ss(t, 31.32, 31.72)) * (0.9 + 0.1 * noise1(t * 30, 9731));
};
/** the lobes' light: rising with the spread, peaking just after the surge, then a dim afterglow round the entry */
export const deckK = (t: number) => {
  if (t < SPREAD0) return 0;
  const rise = ss(t, SPREAD0, SPREAD0 + 0.25);
  const surge = t < SURGE ? 0 : 0.6 * Math.exp(-(t - SURGE) / 0.3) * clamp((t - SURGE) / 0.05);
  return rise * (0.6 + surge) * (0.3 + 0.7 * (1 - ss(t, 31.3, 31.85)));
};
/** per lobe: when each grown stretch of channel first comes near it (a running max of the light it receives) */
type LitLobe = Lobe & {mx: number; mz: number; drift: number; steps: {ta: number; k: number}[]};
const REACH = 22; // m: the light's falloff round a channel
const FAR = 60; // m: and with the distance along the base from the entry (the channels' far ends light little)
const R_MAX = 55; // m: the big inner lobes are lit only by the Clouds' own patch round the entry (never as a sheet)
const LIT: LitLobe[] = (() => {
  const samples: SPt[] = [];
  SPIDER.forEach((c) => c.pts.forEach((p, i) => i % 2 === 0 && samples.push(p)));
  samples.push({...TOP, ta: SPREAD0 - 0.05});
  const all: {l: Lobe; mx: number; mz: number; drift: number}[] = [];
  DECK.forEach((m) => {
    if (Math.hypot(m.x, m.z) >= 330) return;
    m.lobes.forEach((l) => all.push({l, mx: m.x, mz: m.z, drift: m.drift}));
  });
  LOWER.forEach((l) => all.push({l, mx: 0, mz: 0, drift: CELL[0].drift}));
  const out: LitLobe[] = [];
  all.forEach(({l, mx, mz, drift}, li) => {
    if (l.r > R_MAX) return;
    const cx = mx + l.dx, cz = mz + l.dz;
    const ev = samples
      .map((s) => {
        const d = Math.max(0, Math.hypot(s.x - cx, s.z - cz) - 0.5 * l.r);
        return {ta: s.ta, k: Math.exp(-(d * d) / (REACH * REACH)) * Math.exp(-Math.hypot(s.x - ATT.x, s.z - ATT.z) / FAR)};
      })
      .filter((e) => e.k > 0.04)
      .sort((a, b) => a.ta - b.ta);
    if (!ev.length) return;
    const steps: {ta: number; k: number}[] = [];
    let best = 0;
    for (const e of ev) if (e.k > best + 0.02) { best = e.k; steps.push({ta: e.ta, k: e.k * (0.6 + 0.4 * hash(li, 9741))}); }
    out.push({...l, mx, mz, drift, steps});
  });
  // highest first (as Scene3_sky draws its levels)
  return out.sort((a, b) => a.lv - b.lv);
})();
/** a lobe's light at t: the strongest reach so far, eased in over ~0.08 s as the channel arrives */
const lobeAt = (l: LitLobe, t: number) => {
  let k = 0;
  for (const s of l.steps) {
    if (s.ta > t) break;
    k = Math.max(k, s.k * clamp((t - s.ta) / 0.08));
  }
  return k;
};
/** a channel's grown part at t (and its front) */
const grown = (c: Chan, t: number): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < c.pts.length; i++) {
    const p = c.pts[i];
    if (p.ta <= t) out.push(p);
    else {
      if (i > 0) {
        const a = c.pts[i - 1], w = (t - a.ta) / (p.ta - a.ta || 1);
        out.push(v3(a.x + (p.x - a.x) * w, a.y + (p.y - a.y) * w, a.z + (p.z - a.z) * w));
      }
      break;
    }
  }
  return out;
};

export const InCloud5: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const bk = spreadK(t), dk = deckK(t);
  if (bk <= 0.005 && dk <= 0.005) return null;
  if (cam.pos.y > CB - 4) return null;
  const mk = magFade(cam.f);
  if (mk >= 0.999) return null;
  const P = projector(cam);
  const f = cam.f;
  const tau = tau3(t);
  const drift = (LOOP / (2 * Math.PI)) * Math.sin((2 * Math.PI * tau) / LOOP);
  // the lit lobes
  const rings: {d: string; a: number}[] = [];
  if (dk > 0.005) {
    for (const l of LIT) {
      const a = lobeAt(l, t) * dk;
      if (a <= 0.01) continue;
      const c = v3(l.mx + drift * l.drift + l.dx, CB - l.hang, l.mz + l.dz);
      const r = ring(P, c, l);
      if (r) rings.push({d: poly(r), a});
    }
  }
  // the channels (drifting with the cell they run in), as runs of a few steps, each with its own visibility through the
  // base: the glow always, the core only where the base is thin
  const dx = drift * CELL[0].drift;
  type Run = {d: string; vis: number; w: number; age: number};
  const runs: Run[] = [];
  const fronts: Proj[] = [];
  if (bk > 0.005) {
    SPIDER.forEach((c, ci) => {
      const g = grown(c, t).map((p) => P(v3(p.x + dx, p.y, p.z)));
      if (g.length < 2 || g.some((q) => !q.ok)) return;
      // (the front's own small glow only where the channel shows through the base, so it never floats as a dot)
      const fv = clamp(0.5 + 0.9 * noise1(Math.floor((g.length - 2) / 3) * 3 * 0.21 + ci * 3.1, 9751));
      if (c.pts[c.pts.length - 1].ta > t && fv > 0.6) fronts.push({...g[g.length - 1], z: g[g.length - 1].z / (fv * c.w)});
      for (let i = 0; i < g.length - 1; i += 3) {
        const seg = g.slice(i, Math.min(g.length, i + 4));
        if (seg.length < 2) continue;
        const vis = clamp(0.5 + 0.9 * noise1(i * 0.21 + ci * 3.1, 9751));
        // (the newest part brightest: age 0 at the front)
        const age = (g.length - 1 - i) / Math.max(8, g.length);
        runs.push({d: line(seg), vis, w: c.w, age});
      }
    });
  }
  const zRef = Math.max(P(TOP).z, 40);
  const gW = clamp((f * 3.5) / zRef, 12, 48), mW = clamp((f * 0.9) / zRef, 2, 7), cW = clamp((f * 0.38) / zRef, 1, 3.2);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(1 - mk)}>
      <defs>
        <filter id={`${id}-lb`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={13} />
        </filter>
        <filter id={`${id}-gb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(gW / 3, 5, 16))} />
        </filter>
        <filter id={`${id}-cb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={1.1} />
        </filter>
        <radialGradient id={`${id}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.45} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the base lit from within, lobe by lobe (softened: no hard rims, never a disc) */}
      {rings.length > 0 && (
        <g filter={`url(#${id}-lb)`}>
          {rings.map((r, i) => <path key={i} d={r.d} fill="#8E98E6" opacity={fmt(clamp(0.5 * r.a))} />)}
        </g>
      )}
      {runs.length > 0 && (
        <g>
          <g filter={`url(#${id}-gb)`}>
            {runs.map((r, i) => <path key={i} d={r.d} fill="none" stroke="#8C96FF" strokeOpacity={fmt(clamp(0.3 * bk * (0.7 + 0.3 * r.vis)))} strokeWidth={fmt(gW * r.w)} strokeLinecap="round" strokeLinejoin="round" />)}
          </g>
          <g filter={`url(#${id}-cb)`} fill="none" strokeLinecap="round" strokeLinejoin="round">
            {runs.map((r, i) => <path key={`m${i}`} d={r.d} stroke={PAL.mid} strokeOpacity={fmt(clamp(0.6 * bk * r.vis * (1 - 0.4 * r.age)))} strokeWidth={fmt(mW * r.w)} />)}
            {runs.map((r, i) => <path key={`c${i}`} d={r.d} stroke={PAL.core} strokeOpacity={fmt(clamp(0.95 * bk * r.vis * r.vis * (1 - 0.5 * r.age)))} strokeWidth={fmt(cW * (0.6 + 0.4 * r.w))} />)}
          </g>
          {fronts.map((p, i) => <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(clamp((f * 1.2) / Math.max(p.z, 1), 6, 18))} fill={`url(#${id}-tip)`} opacity={fmt(clamp(0.55 * bk))} />)}
        </g>
      )}
    </g>
  );
};
