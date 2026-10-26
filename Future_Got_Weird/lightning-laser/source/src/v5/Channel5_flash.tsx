// V5 D4: light on the storm deck's underside, lobe by lobe (the same deterministic lobes Scene3_sky draws, re-derived
// here because Scene3_sky keeps them private), so the lit region's outline follows the cloud:
//   makeDeckFlash  lightning flickering inside the deck anywhere over the site (V4's CloudFlash4 generalised: V4 lights
//                  only the flat summit deck round one fixed point at the opening's crack); a short in-cloud channel is
//                  glimpsed through the base at the peaks. Local light on the cloud only: no frame-wide flash.
//   makeDeckGlow   the warm glow of the prepared channel where it runs into the base (steady, breathing a little)
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {Cam3, projector, Proj, v3, V3} from '../v2/p3';
import {CB, deckY, LOOP, magFade} from '../v3/Scene3_sky';
import {tau3} from '../v3/timeline3';

// ------------------------------------------------------------------ Scene3_sky's deck (same rules, same seeds)
type Lobe = {dx: number; dz: number; r: number; lv: number; hang: number; rag: number; ph: number; inner?: boolean};
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
    lobes.push(lobe(Math.cos(a) * rad * stretch, Math.sin(a) * rad, R * (0.15 + 0.13 * hash(key * 11 + j, seed + 21)), hash(key * 11 + j, seed + 22) < 0.55 ? 1 : 2, {inner: true, rag: 0.1, ph: 6.2832 * hash(key * 11 + j, seed + 23)}));
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
const ragK = (l: {rag: number; ph: number}, a: number) => (l.rag ? 1 + l.rag * (0.55 * Math.sin(3 * a + l.ph) + 0.3 * Math.sin(5 * a + 2.1 * l.ph) + 0.15 * Math.sin(11 * a + 3.7 * l.ph)) : 1);
const poly = (pts: {x: number; y: number}[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;

// ------------------------------------------------------------------ one flash
export type DeckFlashSpec = {at: V3; reach: number; t0: number; gain: number; seed: number; len: number; dir: number; jag?: number};
/** the brightness on film time: the stroke, a flicker, a dim afterglow */
export const deckFlashK = (s: DeckFlashSpec, t: number) => {
  const p = (t0: number, a: number, d: number) => (t >= t0 - 0.015 ? a * Math.exp(-Math.max(0, t - t0) / d) * clamp((t - t0 + 0.015) / 0.015) : 0);
  return clamp(s.gain * (p(s.t0, 1, 0.06) + p(s.t0 + 0.09, 0.7, 0.05) + p(s.t0 + 0.21, 0.4, 0.07) + p(s.t0, 0.2, 0.35)));
};
/** the lobes near the flash (undrifted centres, with their base heights and light weight); highest first */
const nearLobes = (s: DeckFlashSpec) => {
  const out: {dx: number; dz: number; r: number; rag: number; ph: number; mx: number; mz: number; drift: number; flat: boolean; hang: number; lv: number; k: number}[] = [];
  DECK.forEach((m, mi) => {
    const flat = Math.hypot(m.x, m.z) < 330;
    m.lobes.forEach((l, li) => {
      if (!flat && l.inner) return;
      const d = Math.hypot(m.x + l.dx - s.at.x, m.z + l.dz - s.at.z) - 0.3 * l.r;
      if (d > s.reach) return;
      out.push({...l, mx: m.x, mz: m.z, drift: m.drift, flat, k: (0.55 + 0.45 * hash(mi * 53 + li, 1301 + s.seed)) * clamp(1 - d / s.reach)});
    });
  });
  return out.sort((a, b) => a.lv - b.lv);
};
/** a jagged run from a to b: each point displaced across the run (in the base plane) and a little up and down, by
 *  two independent noises, so the jags read from any view */
const jagRun = (a: V3, b: V3, n: number, amp: number, seed: number) => {
  const pts: V3[] = [];
  const hx = b.x - a.x, hz = b.z - a.z, hl = Math.hypot(hx, hz) || 1;
  const px = -hz / hl, pz = hx / hl;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const e = i === 0 || i === n ? 0 : 1;
    const j = e * amp * (noise1(i * 0.9 + seed, 1311) + 0.5 * noise1(i * 2.3 + seed, 1313));
    const jy = e * amp * 0.35 * noise1(i * 1.7 + seed, 1317);
    pts.push(v3(a.x + (b.x - a.x) * u + px * j, a.y + (b.y - a.y) * u + jy, a.z + (b.z - a.z) * u + pz * j));
  }
  return pts;
};

/** the near lobes as screen rings (lobes reaching behind the camera are left out), with their light weights */
const ringsOf = (NEAR: ReturnType<typeof nearLobes>, P: (p: V3) => Proj, t: number) => {
  const drift = (LOOP / (2 * Math.PI)) * Math.sin((2 * Math.PI * tau3(t)) / LOOP);
  const rings: {d: string; a: number}[] = [];
  for (const l of NEAR) {
    const x = l.mx + drift * l.drift;
    const y = l.flat ? CB - l.hang : deckY(Math.hypot(x, l.mz));
    const cc = v3(x + l.dx, y, l.mz + l.dz);
    const pts: Proj[] = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * 6.2832;
      const r = l.r * ragK(l, a);
      pts.push(P(v3(cc.x + r * Math.cos(a), cc.y, cc.z + r * Math.sin(a))));
    }
    if (!pts.every((q) => q.ok && q.z > 20)) continue;
    rings.push({d: poly(pts), a: l.k});
  }
  return rings;
};

export const makeDeckFlash = (s: DeckFlashSpec) => {
  const NEAR = nearLobes(s);
  const c = Math.cos(s.dir), sn = Math.sin(s.dir);
  const A = v3(s.at.x - c * s.len * 0.5, s.at.y + 1, s.at.z - sn * s.len * 0.5), Bp = v3(s.at.x + c * s.len * 0.5, s.at.y + 4, s.at.z + sn * s.len * 0.5);
  const jg = s.jag ?? 1;
  const CH = jagRun(A, Bp, 16, s.len * 0.09 * jg, s.seed);
  const forkEnd = v3(CH[7].x - sn * s.len * 0.3, CH[7].y + 2, CH[7].z + c * s.len * 0.3);
  const FORK = jagRun(CH[7], forkEnd, 7, s.len * 0.05 * jg, s.seed + 17);
  const Comp: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
    const k = deckFlashK(s, t);
    if (k <= 0.01 || cam.pos.y > CB - 4) return null;
    const mk = magFade(cam.f);
    if (mk >= 0.999) return null;
    const P = projector(cam);
    const g = P(s.at);
    if (!g.ok) return null;
    const rG = clamp((cam.f * 1.1 * s.reach) / Math.max(g.z, 1), 120, 1600);
    const rings = ringsOf(NEAR, P, t);
    const ch = CH.map(P), fk = FORK.map(P);
    const chOk = ch.every((q) => q.ok) && fk.every((q) => q.ok);
    const pieces = (pp: Proj[], a0: number) => pp.slice(0, -1).map((q, i) => {
      const u = (i + 0.5) / (pp.length - 1);
      return {d: `M${fmt(q.x)},${fmt(q.y)} L${fmt(pp[i + 1].x)},${fmt(pp[i + 1].y)}`, a: a0 * Math.pow(Math.sin(Math.PI * u), 0.7)};
    });
    const segs = [...pieces(ch, 1), ...pieces(fk, 0.7).map((p, i, arr) => ({...p, a: p.a * (1 - i / arr.length)}))];
    const peak = clamp((k - 0.35) / 0.65);
    const strike = clamp((k - 0.55) / 0.45);
    const nearest = rings.map((r, i) => ({i, a: r.a})).sort((p, q) => q.a - p.a).slice(0, 5).map((r) => r.i);
    const wC = clamp((cam.f * 4.5) / g.z, 6, 30), wK = clamp((cam.f * 0.9) / g.z, 2, 5);
    return (
      <g style={{mixBlendMode: 'screen'}} opacity={fmt(1 - mk)}>
        <defs>
          <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={fmt(g.x)} cy={fmt(g.y)} r={fmt(rG)}>
            <stop offset="0" stopColor="#DADDFF" stopOpacity={0.95} />
            <stop offset="0.16" stopColor="#B0B6F2" stopOpacity={0.68} />
            <stop offset="0.42" stopColor="#7C86D2" stopOpacity={0.28} />
            <stop offset="1" stopColor="#5A64B0" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={`${id}-gs`} gradientUnits="userSpaceOnUse" cx={fmt(g.x)} cy={fmt(g.y)} r={fmt(rG * 0.55)}>
            <stop offset="0" stopColor="#F4F5FF" stopOpacity={0.9} />
            <stop offset="0.35" stopColor="#C4C9FA" stopOpacity={0.5} />
            <stop offset="1" stopColor="#8C95DC" stopOpacity={0} />
          </radialGradient>
          <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
            <feGaussianBlur stdDeviation={fmt(clamp(cam.f / 220, 3, 7))} />
          </filter>
          <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
        <g filter={`url(#${id}-bl)`}>
          {rings.map((r, i) => <path key={i} d={r.d} fill={`url(#${id}-g)`} opacity={fmt(clamp(k * r.a * (nearest.includes(i) ? 1 + 0.6 * strike : 1)))} />)}
          {strike > 0.02 && nearest.map((i) => <path key={`n${i}`} d={rings[i].d} fill={`url(#${id}-gs)`} opacity={fmt(0.45 * strike)} />)}
        </g>
        {chOk && peak > 0.02 && (
          <g opacity={fmt(0.75 * peak)} filter={`url(#${id}-b)`}>
            {segs.map((p, i) => <path key={`h${i}`} d={p.d} fill="none" stroke="#C9CEFF" strokeOpacity={fmt(0.5 * p.a)} strokeWidth={fmt(wC)} strokeLinecap="round" />)}
            {segs.map((p, i) => <path key={`c${i}`} d={p.d} fill="none" stroke="#F4F5FF" strokeOpacity={fmt(0.85 * p.a)} strokeWidth={fmt(wK)} strokeLinecap="round" />)}
          </g>
        )}
        {chOk && strike > 0.02 && (
          <g opacity={fmt(strike)}>
            {segs.map((p, i) => <path key={`k${i}`} d={p.d} fill="none" stroke="#FFFFFF" strokeOpacity={fmt(clamp(1.2 * p.a))} strokeWidth={fmt(wK * 0.7)} strokeLinecap="round" strokeLinejoin="round" />)}
          </g>
        )}
      </g>
    );
  };
  return Comp;
};

// ------------------------------------------------------------------ the channel's warm glow on the base
export type DeckGlowSpec = {at: V3; reach: number; seed: number};
export const makeDeckGlow = (s: DeckGlowSpec) => {
  const NEAR = nearLobes({...s, t0: 0, gain: 1, len: 0, dir: 0});
  const Comp: React.FC<{cam: Cam3; t: number; k: number; id: string}> = ({cam, t, k, id}) => {
    if (k <= 0.01 || cam.pos.y > CB - 4) return null;
    const mk = magFade(cam.f);
    if (mk >= 0.999) return null;
    const P = projector(cam);
    const g = P(s.at);
    if (!g.ok) return null;
    // the light spreads along the base: an ellipse foreshortened by the view's elevation of the base
    const rG = clamp((cam.f * 1.15 * s.reach) / Math.max(g.z, 1), 120, 1800);
    const sinE = clamp((s.at.y - cam.pos.y) / Math.max(Math.hypot(s.at.x - cam.pos.x, s.at.y - cam.pos.y, s.at.z - cam.pos.z), 1), 0.2, 1);
    const rings = ringsOf(NEAR, P, t);
    const tr = `translate(${fmt(g.x)},${fmt(g.y)}) scale(1,${fmt(sinE)}) translate(${fmt(-g.x)},${fmt(-g.y)})`;
    return (
      <g style={{mixBlendMode: 'screen'}} opacity={fmt(clamp(k) * (1 - mk))}>
        <defs>
          <radialGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" cx={fmt(g.x)} cy={fmt(g.y)} r={fmt(rG)} gradientTransform={tr}>
            <stop offset="0" stopColor="#FFC891" stopOpacity={0.7} />
            <stop offset="0.12" stopColor="#FFA862" stopOpacity={0.45} />
            <stop offset="0.32" stopColor="#E07F45" stopOpacity={0.17} />
            <stop offset="0.6" stopColor="#B0603A" stopOpacity={0.04} />
            <stop offset="1" stopColor="#8A4A30" stopOpacity={0} />
          </radialGradient>
          <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
            <feGaussianBlur stdDeviation={5} />
          </filter>
        </defs>
        <g filter={`url(#${id}-b)`}>
          {rings.map((r, i) => <path key={i} d={r.d} fill={`url(#${id}-g)`} opacity={fmt(clamp(r.a))} />)}
        </g>
      </g>
    );
  };
  return Comp;
};
