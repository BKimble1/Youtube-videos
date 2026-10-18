// World-space particles: sparks, chips/debris, dust puffs, a shockwave ring and a flash. Launched at t0 from a world
// point with seeded velocities in a cone; coherent ballistic trajectories (metres, seconds, y up).
import React from 'react';
import {V3, add3, mul3, sub3, clamp, lerp, rnd, len3, smooth} from '../../kit/math';
import {Item, SpriteCtx, project} from '../engine';
import {ball3, coneDir, sparkCol, glowEl, gid, f1, blobPts, blobPath, tone, glowTone, inkTone, inkPx, basisAround, G} from './core';
import {billowPath} from '../world/atmosDraw';

const visible = (c: SpriteCtx, p: V3) => {
  const s = project(c.view, p);
  return s.z > c.view.near ? s : null;
};

// ------------------------------------------------------------------ sparks
export type SparksOpts = {
  at: V3; t: number; t0: number; key: string; seed?: number; n?: number;
  /** main direction (unit-ish) and cone half-angle */
  dir?: V3; spread?: number;
  speed?: [number, number]; life?: [number, number]; ground?: number;
  /** streak length in seconds of travel */ streak?: number;
  /** continuous emission until t1 at `rate`/s instead of one burst */ t1?: number; rate?: number;
  flash?: number; width?: number;
};
/** A burst (or stream) of hot sparks: one sprite at the origin (they are small and short-lived). */
export const sparks3 = (o: SparksOpts): Item[] => {
  const tau = o.t - o.t0;
  if (tau < 0) return [];
  const n = o.n ?? 16, dir = o.dir ?? {x: 0, y: 1, z: 0}, spread = o.spread ?? 65;
  const speed = o.speed ?? [3, 10], life = o.life ?? [0.2, 0.6], streak = o.streak ?? 0.035, seed = o.seed ?? 1;
  const parts: {sd: number; age: number}[] = [];
  if (o.t1 !== undefined) {
    const rate = o.rate ?? 30;
    if (o.t > o.t1 + life[1]) return [];
    const iHi = Math.floor((Math.min(o.t, o.t1) - o.t0) * rate);
    for (let i = Math.max(0, Math.floor((tau - life[1]) * rate)); i <= iHi; i++) {
      const b = o.t0 + i / rate;
      if (b > o.t1 || b > o.t) continue;
      parts.push({sd: seed * 1000 + i, age: o.t - b});
    }
  } else for (let i = 0; i < n; i++) parts.push({sd: seed * 1000 + i, age: tau});
  if (o.t1 === undefined && tau > life[1] + 0.05) return [];
  return [{
    kind: 'sprite', pos: o.at, key: o.key, bias: 0.05,
    draw: (c) => {
      const out: React.ReactElement[] = [];
      parts.forEach(({sd, age}, i) => {
        const L = lerp(life[0], life[1], rnd(sd * 3));
        if (age > L) return;
        const d = coneDir(dir, spread, sd);
        const v = mul3(d, lerp(speed[0], speed[1], rnd(sd * 7)));
        const b1 = ball3(o.at, v, age, o.ground, 0.35);
        const b0 = ball3(o.at, v, Math.max(0, age - streak), o.ground, 0.35);
        const s1 = visible(c, b1.p), s0 = visible(c, b0.p);
        if (!s1 || !s0) return;
        const w = Math.max(1.1, (o.width ?? 0.025) * s1.k);
        out.push(<line key={i} x1={f1(s0.x)} y1={f1(s0.y)} x2={f1(s1.x)} y2={f1(s1.y)} stroke={glowTone(c, sparkCol(age / L))} strokeWidth={f1(w)} strokeLinecap="round" />);
      });
      const fl = o.flash ?? 0.25;
      if (fl > 0 && tau < 0.09) out.push(glowEl(gid(o.key, 'f'), c.x, c.y, fl * c.k * (1 + tau * 8), '#FFF4D0', 1 - tau / 0.09, 0.2) as React.ReactElement);
      return <g>{out}</g>;
    },
  }];
};

// ------------------------------------------------------------------ chips / debris
export type ChipMat = 'concrete' | 'asphalt' | 'metal' | 'armor' | 'plate' | 'glass' | 'brick' | 'ally';
const CHIP: Record<ChipMat, {fills: string[]; elong: [number, number]; n: number; op?: number}> = {
  concrete: {fills: ['#A39C94', '#8C857E', '#BDB6AC', '#7A736C'], elong: [0.8, 1.3], n: 5},
  asphalt: {fills: ['#3B3638', '#57504F', '#2C2829'], elong: [0.9, 1.4], n: 5},
  brick: {fills: ['#8A4A3A', '#A0583F', '#6E3A2E'], elong: [1.1, 1.6], n: 4},
  metal: {fills: ['#5B6670', '#39424A', '#7F8A93'], elong: [1.6, 3], n: 4},
  armor: {fills: ['#E4EBEE', '#C9D3D8', '#9FAEB6', '#4E5B63'], elong: [1.2, 2.2], n: 4},
  plate: {fills: ['#8E9AA0', '#6F7B82', '#B5BEC2', '#5A646A'], elong: [1.1, 1.8], n: 5},
  glass: {fills: ['#CFEAF2', '#E6F6FA', '#B5DCE8'], elong: [0.8, 1.8], n: 3, op: 0.75},
  ally: {fills: ['#E07A3A', '#F0E2C2', '#3C4146'], elong: [1.2, 2], n: 4},
};
export type ChipsOpts = {
  at: V3; t: number; t0: number; key: string; seed?: number; n?: number; dir?: V3; spread?: number;
  speed?: [number, number]; size?: [number, number]; ground?: number; material?: ChipMat; life?: number; spin?: number;
};
/** Ballistic chunks; each chip is its own sprite so it sorts past figures correctly. */
export const chips3 = (o: ChipsOpts): Item[] => {
  const tau = o.t - o.t0;
  if (tau < 0) return [];
  const life = o.life ?? 3.5;
  const fade = clamp(1 - (tau - life) / 0.8);
  if (fade <= 0) return [];
  const n = o.n ?? 8, dir = o.dir ?? {x: 0, y: 1, z: 0}, spread = o.spread ?? 60, seed = o.seed ?? 1;
  const speed = o.speed ?? [2.5, 7], size = o.size ?? [0.05, 0.16], m = CHIP[o.material ?? 'concrete'];
  const items: Item[] = [];
  for (let i = 0; i < n; i++) {
    const sd = seed * 977 + i * 31;
    const d = coneDir(dir, spread, sd);
    const v = mul3(d, lerp(speed[0], speed[1], Math.pow(rnd(sd * 5), 0.8)));
    const b = ball3(o.at, v, tau, o.ground, 0.28);
    const sz = lerp(size[0], size[1], Math.pow(rnd(sd * 7), 1.5));
    const restT = b.landed ? Math.min(tau, 0.3 + rnd(sd * 9) * 0.5) : tau;
    const rot = rnd(sd * 11) * 360 + (rnd(sd * 13) - 0.5) * (o.spin ?? 900) * restT;
    const el = lerp(m.elong[0], m.elong[1], rnd(sd * 17));
    const fill = m.fills[i % m.fills.length];
    const pos = {...b.p, y: b.landed && o.ground !== undefined ? o.ground + sz * 0.3 : b.p.y};
    items.push({
      kind: 'sprite', pos, key: `${o.key}_c${i}`,
      draw: (c) => {
        const r = sz * c.k;
        if (r < 0.5) return null;
        return <polygon points={blobPts(c.x, c.y, r, sd, m.n, 0.45, el, 1, (rot * Math.PI) / 180)} fill={tone(c, fill)} stroke={inkTone(c)} strokeWidth={f1(inkPx(c, 0.012, 0.5, 2.2))} strokeLinejoin="round" opacity={(m.op ?? 1) * fade} />;
      },
    });
  }
  return items;
};

// ------------------------------------------------------------------ dust
export type DustOpts = {
  at: V3; t: number; t0: number; key: string; seed?: number; n?: number;
  /** puffs start in a ring of this radius (m) and expand outward along the ground (dust wave) */ ring?: number;
  /** outward speed (m/s) */ speed?: number; size?: number; grow?: number; life?: number; rise?: number; color?: string; opacity?: number;
  dir?: V3; spread?: number;
};
/** Soft dust puffs (a burst, or a ground ring = dust wave). Lit like the world, two-tone, no gradients. */
export const dust3 = (o: DustOpts): Item[] => {
  const tau = o.t - o.t0;
  const life = o.life ?? 2.2;
  if (tau < 0 || tau > life) return [];
  const n = o.n ?? 6, seed = o.seed ?? 1, col = o.color ?? '#9C9087';
  const items: Item[] = [];
  const u = tau / life;
  for (let i = 0; i < n; i++) {
    const sd = seed * 571 + i * 17;
    let p: V3;
    if (o.ring !== undefined) {
      const a = (i / n) * Math.PI * 2 + rnd(sd) * 0.6;
      const r = o.ring + (o.speed ?? 6) * (1 - Math.exp(-2.4 * tau)) * (0.7 + 0.5 * rnd(sd * 3));
      p = add3(o.at, {x: Math.cos(a) * r, y: (o.rise ?? 0.4) * tau + 0.3, z: Math.sin(a) * r});
    } else {
      const d = coneDir(o.dir ?? {x: 0, y: 1, z: 0}, o.spread ?? 70, sd);
      const dist = (o.speed ?? 1.6) * (1 - Math.exp(-3 * tau)) * (0.5 + rnd(sd * 3));
      p = add3(add3(o.at, mul3(d, dist)), {x: 0, y: (o.rise ?? 0.35) * tau, z: 0});
    }
    const r0 = (o.size ?? 0.3) * (0.7 + 0.6 * rnd(sd * 7)) + (o.grow ?? 0.9) * Math.sqrt(tau);
    const op = (o.opacity ?? 0.75) * clamp(tau * 10) * Math.pow(1 - u, 1.3);
    items.push({
      kind: 'sprite', pos: p, key: `${o.key}_d${i}`,
      draw: (c) => {
        const r = r0 * c.k;
        if (r < 1) return null;
        // (R3) drawn as smokeItems draws smoke: cauliflower billows (not near-circles, whose stacked translucent edges
        // read as circular washes over the action when a blast's dust is close), with the same caps — a puff the lens
        // is in or next to fades, a puff filling the frame is held down, close dust never passes ~40 %
        const v = c.view;
        const dist = len3(sub3(p, v.pos));
        let a = op * clamp((dist - r0 * 0.8) / (r0 * 1.4));
        if (r > v.H * 0.22) a *= clamp(1 - (r - v.H * 0.22) / (v.H * 0.35), 0.2, 1);
        if (dist < 7) a = Math.min(a, 0.4 + 0.6 * clamp((dist - 2.5) / 4.5));
        if (a < 0.01) return null;
        const lit = tone(c, col, 2), mid = tone(c, col, 1), sh = tone(c, col, 0);
        const rot = ((o.t * 0.3 + rnd(sd)) * 0.8) % 6.283;
        const nb = 5 + (rnd(sd + 5) < 0.5 ? 1 : 0);
        return (
          <g opacity={f1(a)}>
            {r > 6 && <path d={billowPath(c.x, c.y + r * 0.06, r * 1.08, sd + 11, nb, 1, 0.9, rot)} fill={mid} opacity={f1(0.4 * smooth((r - 6) / 10))} />}
            <path d={billowPath(c.x, c.y, r * 0.95, sd, nb, 1, 0.9, rot)} fill={mid} />
            <path d={billowPath(c.x + r * 0.1, c.y + r * 0.16, r * 0.58, sd + 3, nb - 1, 1, 0.88, rot)} fill={sh} opacity={0.5} />
            <path d={billowPath(c.x - r * 0.18, c.y - r * 0.22, r * 0.6, sd + 2, nb - 1, 1, 0.9, rot)} fill={lit} opacity={0.7} />
          </g>
        );
      },
    });
  }
  return items;
};

// ------------------------------------------------------------------ shockwave ring and flash
/** An expanding ring in the plane perpendicular to `normal` (a pressure wave on a surface or in air). */
export const ring3 = (o: {at: V3; normal: V3; t: number; t0: number; key: string; r0?: number; speed?: number; dur?: number; color?: string; width?: number}): Item[] => {
  const tau = o.t - o.t0, dur = o.dur ?? 0.28;
  if (tau < 0 || tau > dur) return [];
  const {u, v} = basisAround(o.normal);
  const R = (o.r0 ?? 0.2) + (o.speed ?? 14) * tau;
  const P: V3[] = Array.from({length: 28}, (_, i) => {
    const a = (i / 28) * Math.PI * 2;
    return add3(o.at, add3(mul3(u, Math.cos(a) * R), mul3(v, Math.sin(a) * R)));
  });
  return [{
    kind: 'sprite', pos: o.at, key: o.key, bias: 0.1,
    draw: (c) => {
      const S = P.map((p) => project(c.view, p));
      if (S.some((s) => s.z < c.view.near)) return null;
      const w = Math.max(1, (o.width ?? 0.08) * c.k * (1 - tau / dur));
      return <polygon points={S.map((s) => `${f1(s.x)},${f1(s.y)}`).join(' ')} fill="none" stroke={glowTone(c, o.color ?? '#FFF4DE')} strokeWidth={f1(w)} opacity={0.6 * (1 - tau / dur)} />;
    },
  }];
};

/** A flash of light at a point: world radius (m), fades over dur. */
export const flash3 = (o: {at: V3; t: number; t0: number; key: string; r?: number; dur?: number; color?: string; core?: number; bias?: number}): Item[] => {
  const tau = o.t - o.t0, dur = o.dur ?? 0.12;
  if (tau < 0 || tau > dur) return [];
  const u = tau / dur;
  return [{
    kind: 'sprite', pos: o.at, key: o.key, bias: o.bias ?? 0.3,
    draw: (c) => glowEl(gid(o.key), c.x, c.y, (o.r ?? 0.6) * c.k * (1 + u * 0.8), glowTone(c, o.color ?? '#FFF4D0', 0.3), 1 - u, o.core ?? 0.18),
  }];
};

