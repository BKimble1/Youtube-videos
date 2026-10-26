// V4 A2 "into a THUNDERSTORM": lightning inside the storm deck at the loud crack (1.75; thunder 2.1). No bolt reaches
// the ground: the deck lights from within, lobe by lobe, well away from the beam and the tower (the upper left of the
// crane's frame), with a short in-cloud channel glimpsed through the base at the peaks. It is a local light on the
// cloud base only: no frame-wide flash.
// The lit shapes are V3's own summit-deck lobes (v3/Scene3_sky.tsx builds them from deterministic hashes and keeps them
// private; the same rules are re-run here for the lobes near the flash), so the light follows the clouds on screen.
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {Cam3, projector, Proj, v3, V3} from '../v2/p3';
import {CB, LOOP, magFade} from '../v3/Scene3_sky';
import {PAL} from '../v3/palette';
import {tau3} from '../v3/timeline3';

// ------------------------------------------------------------------ V3's summit deck (same rules as Scene3_sky)
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

// ------------------------------------------------------------------ the flash
/** where the lightning runs inside the deck: over the summit's far (north-west) side, 70 m from where the opening's
 *  bolt will attach and 75 m from the beam; in the crane's frame at the crack it sits in the upper left, well inside
 *  the frame (about (315, 390) at 1.75 and (280, 450) at 1.85), far from the beam and the tower top */
export const CLOUD_FLASH = v3(-26, 237, 44);
const REACH = 105; // m: lobes whose centre lies within this of the flash catch its light
/** the lobes near the flash (flat summit deck only, undrifted centres) */
const NEAR = (() => {
  const out: (Lobe & {mx: number; mz: number; drift: number; k: number})[] = [];
  DECK.forEach((m, mi) => {
    if (Math.hypot(m.x, m.z) >= 330) return;
    m.lobes.forEach((l, li) => {
      const d = Math.hypot(m.x + l.dx - CLOUD_FLASH.x, m.z + l.dz - CLOUD_FLASH.z) - 0.3 * l.r;
      if (d > REACH) return;
      out.push({...l, mx: m.x, mz: m.z, drift: m.drift, k: (0.55 + 0.45 * hash(mi * 53 + li, 1301)) * clamp(1 - d / REACH)});
    });
  });
  // highest first (as Scene3_sky draws its levels)
  return out.sort((a, b) => a.lv - b.lv);
})();
const ragK = (l: {rag: number; ph: number}, a: number) => (l.rag ? 1 + l.rag * (0.55 * Math.sin(3 * a + l.ph) + 0.3 * Math.sin(5 * a + 2.1 * l.ph) + 0.15 * Math.sin(11 * a + 3.7 * l.ph)) : 1);
const ring = (P: (p: V3) => Proj, c: V3, l: Lobe, n = 40) => {
  const pts: Proj[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 6.2832;
    const r = l.r * ragK(l, a);
    pts.push(P(v3(c.x + r * Math.cos(a), c.y, c.z + r * Math.sin(a))));
  }
  return pts.every((q) => q.ok && q.z > 20) ? pts : null;
};
const poly = (pts: {x: number; y: number}[]) => `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')} Z`;

/** the flash's brightness on film time: the crack (1.75), two flickers, a dim afterglow gone by ~2.5 */
export const cloudFlashK = (t: number) => {
  const p = (t0: number, a: number, d: number) => (t >= t0 - 0.015 ? a * Math.exp(-Math.max(0, t - t0) / d) * clamp((t - t0 + 0.015) / 0.015) : 0);
  return clamp(p(1.75, 1, 0.06) + p(1.84, 0.75, 0.05) + p(1.97, 0.45, 0.07) + p(1.75, 0.22, 0.35));
};
/** the in-cloud channel: a short jagged run across the base (world points), with one fork, glimpsed at the peaks */
const jagRun = (a: V3, b: V3, n: number, amp: number, seed: number) => {
  const pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const j = i === 0 || i === n ? 0 : amp * noise1(i * 0.9 + seed, 1311);
    pts.push(v3(a.x + (b.x - a.x) * u + 0.4 * j, a.y + (b.y - a.y) * u + 0.5 * j, a.z + (b.z - a.z) * u - 0.8 * j));
  }
  return pts;
};
const CH = jagRun(v3(CLOUD_FLASH.x - 26, 238, CLOUD_FLASH.z + 14), v3(CLOUD_FLASH.x + 30, 241, CLOUD_FLASH.z - 9), 14, 5, 0);
const FORK = jagRun(CH[6], v3(CH[6].x + 6, 240, CH[6].z + 20), 6, 3, 17);

export const CloudFlash4: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const k = cloudFlashK(t);
  if (k <= 0.01) return null;
  if (cam.pos.y > CB - 4) return null;
  const mk = magFade(cam.f);
  if (mk >= 0.999) return null;
  const P = projector(cam);
  const g = P(CLOUD_FLASH);
  if (!g.ok) return null;
  const tau = tau3(t);
  const drift = (LOOP / (2 * Math.PI)) * Math.sin((2 * Math.PI * tau) / LOOP);
  const rG = clamp((cam.f * 1.1 * REACH) / Math.max(g.z, 1), 120, 1600);
  const rings: {d: string; a: number}[] = [];
  for (const l of NEAR) {
    const c = v3(l.mx + drift * l.drift + l.dx, CB - l.hang, l.mz + l.dz);
    const r = ring(P, c, l);
    if (!r) continue;
    rings.push({d: poly(r), a: l.k});
  }
  const ch = CH.map(P), fk = FORK.map(P);
  const chOk = ch.every((q) => q.ok) && fk.every((q) => q.ok);
  // the channel as short pieces whose opacity falls toward its ends (it fades into the cloud, no hard tips)
  const pieces = (pp: Proj[], a0: number) => pp.slice(0, -1).map((q, i) => {
    const u = (i + 0.5) / (pp.length - 1);
    return {d: `M${fmt(q.x)},${fmt(q.y)} L${fmt(pp[i + 1].x)},${fmt(pp[i + 1].y)}`, a: a0 * Math.pow(Math.sin(Math.PI * u), 0.7)};
  });
  const segs = [...pieces(ch, 1), ...pieces(fk, 0.7).map((p, i, arr) => ({...p, a: p.a * (1 - i / arr.length)}))];
  const peak = clamp((k - 0.35) / 0.65);
  // the strike's own frames (the crack and its first flicker, 2-3 frames each): the lobes nearest the channel lit
  // clearly from within, and the channel's thin white core seen through the base
  const strike = clamp((k - 0.55) / 0.45);
  const nearest = rings.map((r, i) => ({i, a: r.a})).sort((p, q) => q.a - p.a).slice(0, 2).map((r) => r.i);
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
        <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(clamp(cam.f / 220, 3, 7))} />
        </filter>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-300} y={-300} width={1680} height={2520}>
          <feGaussianBlur stdDeviation={16} />
        </filter>
        <filter id={`${id}-b2`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
      </defs>
      {/* the lobes catch the light from within: each by its own amount, so the lit region breaks up along them */}
      {/* (softened, so the lit lobes have no hard rim and the light never reads as a disc) */}
      <g filter={`url(#${id}-bl)`}>
        {rings.map((r, i) => <path key={i} d={r.d} fill={`url(#${id}-g)`} opacity={fmt(clamp(k * r.a * (nearest.includes(i) ? 1 + 0.6 * strike : 1)))} />)}
        {strike > 0.02 && nearest.map((i) => <path key={`n${i}`} d={rings[i].d} fill={`url(#${id}-gs)`} opacity={fmt(0.75 * strike)} />)}
      </g>
      {/* the channel itself, seen through the thinner base at the peaks: blurred, white with violet edges */}
      {chOk && peak > 0.02 && (
        <g opacity={fmt(0.75 * peak)} filter={`url(#${id}-b)`}>
          {segs.map((p, i) => <path key={`h${i}`} d={p.d} fill="none" stroke="#C9CEFF" strokeOpacity={fmt(0.5 * p.a)} strokeWidth={fmt(clamp((cam.f * 2.6) / g.z, 5, 30))} strokeLinecap="round" />)}
          {segs.map((p, i) => <path key={`c${i}`} d={p.d} fill="none" stroke="#F4F5FF" strokeOpacity={fmt(0.85 * p.a)} strokeWidth={fmt(clamp((cam.f * 0.45) / g.z, 1.2, 5))} strokeLinecap="round" />)}
        </g>
      )}
      {/* the thin white core itself (barely softened), on the strike's frames only */}
      {chOk && strike > 0.02 && (
        <g opacity={fmt(strike)} filter={`url(#${id}-b2)`}>
          {segs.map((p, i) => <path key={`k${i}`} d={p.d} fill="none" stroke="#FFFFFF" strokeOpacity={fmt(clamp(1.2 * p.a))} strokeWidth={fmt(clamp((cam.f * 0.22) / g.z, 1.4, 3.2))} strokeLinecap="round" strokeLinejoin="round" />)}
        </g>
      )}
    </g>
  );
};
