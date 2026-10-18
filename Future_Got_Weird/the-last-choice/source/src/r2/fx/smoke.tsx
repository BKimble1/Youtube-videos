// Smoke as a volume of world-space puffs on a fixed seeded schedule (any frame renders alone). Each puff is its own
// sprite, so figures and machines can stand inside the smoke and the decoy's light-figures can land on it.
// smokeDensity(p, t, sources) answers "how much smoke is here?" for the decoy projection. The puffs are drawn as
// billows in the same illustrated look as the city's plumes (world/atmosDraw.tsx).
import React from 'react';
import {V3, add3, mul3, norm3, clamp, rnd, noise, len3, sub3, smooth} from '../../kit/math';
import {Item, project} from '../engine';
import {billowPath} from '../world/atmosDraw';
import {FxOut, fx, thrown, ThrowOpts, tone, f1, inkTone, inkPx, combine} from './core';
import {sparks3} from './particles';

export type SmokeSource = {
  /** emitter position (may move: evaluated at each puff's emission time) */
  pos: V3 | ((t: number) => V3);
  start: number; end: number;
  /** puffs per second */ rate: number;
  /** puff life (s) */ life: number;
  /** rise speed (m/s, slows as the puff ages) */ up?: number;
  /** initial jet velocity (m/s), decays quickly */ jet?: V3; jetSpread?: number;
  /** emission disc radius (m) */ spread?: number;
  /** starting radius and growth (m, m/√s) */ size?: number; grow?: number;
  wind?: V3; color?: string; opacity?: number; seed: number;
};
export type Puff = {c: V3; r: number; o: number; sd: number};

const posAt = (s: SmokeSource, t: number) => (typeof s.pos === 'function' ? s.pos(t) : s.pos);

export const puffsAt = (s: SmokeSource, t: number): Puff[] => {
  const out: Puff[] = [];
  if (t < s.start) return out;
  const iLo = Math.max(0, Math.floor((t - s.life - s.start) * s.rate) - 1);
  const iHi = Math.floor((Math.min(t, s.end) - s.start) * s.rate);
  for (let i = iLo; i <= iHi; i++) {
    const sd = s.seed * 7919 + i * 13;
    const te = s.start + i / s.rate + (rnd(sd) - 0.5) * (0.5 / s.rate);
    if (te > t || te > s.end || te < s.start) continue;
    const age = t - te;
    if (age > s.life) continue;
    const u = age / s.life;
    const e = posAt(s, te);
    const a = rnd(sd * 3) * Math.PI * 2, rr = (s.spread ?? 0.3) * Math.sqrt(rnd(sd * 5));
    let c = add3(e, {x: Math.cos(a) * rr, y: 0.1, z: Math.sin(a) * rr});
    if (s.jet) {
      const js = s.jetSpread ?? 0.5;
      const jd = {x: s.jet.x + (rnd(sd * 7) - 0.5) * js * len3(s.jet), y: s.jet.y + (rnd(sd * 11) - 0.3) * js * len3(s.jet), z: s.jet.z + (rnd(sd * 13) - 0.5) * js * len3(s.jet)};
      c = add3(c, mul3(jd, (1 - Math.exp(-2.5 * age)) / 2.5));
    }
    const up = (s.up ?? 0.9) * age * (1 - 0.45 * u) * (0.7 + 0.6 * rnd(sd * 17)); // keeps rising, slowing as it ages
    const w = s.wind ?? {x: 0.6, y: 0, z: -0.35};
    c = add3(c, {x: w.x * age + noise(te * 0.7 + age * 0.4, sd % 97) * 0.6 * age, y: up, z: w.z * age + noise(te * 0.5 + age * 0.3, (sd % 89) + 5) * 0.6 * age});
    const r = (s.size ?? 0.5) * (0.7 + 0.6 * rnd(sd * 19)) + (s.grow ?? 0.9) * Math.sqrt(age);
    const o = (s.opacity ?? 0.85) * clamp(age / 0.25) * Math.pow(1 - u, 1.15);
    out.push({c, r, o, sd});
  }
  return out;
};

/** Smoke density at a world point (0 = clear air, ~1 = thick). */
export const smokeDensity = (p: V3, t: number, sources: SmokeSource[]): number => {
  // matched to what is drawn: a puff is solid inside ~0.8 r and gone by ~1.3 r
  let d = 0;
  for (const s of sources) for (const q of puffsAt(s, t)) {
    const dx = p.x - q.c.x, dy = p.y - q.c.y, dz = p.z - q.c.z;
    const k = (dx * dx + dy * dy + dz * dz) / (q.r * q.r);
    if (k < 2.5) d += q.o * Math.exp(-k * 2.4) * 0.9;
  }
  return 1 - Math.exp(-d * 1.4);
};

/**
 * Draw the puffs of some sources, in the film's smoke look (world/atmosDraw billows): each puff is a cauliflower billow
 * with a soft outer step, a body on the shadow side and a lit cap toward the sun, composited as ONE unit (group
 * opacity), so overlapping puffs build density without ring edges. Caps keep the frame readable: a puff the camera is
 * in or next to fades, a puff filling the frame is held down, and smoke within a few metres of the lens never goes
 * past ~40 % so faces and limbs behind it keep their contrast.
 */
export const smokeItems = (t: number, sources: SmokeSource[], key: string): Item[] => {
  const items: Item[] = [];
  sources.forEach((s, si) => puffsAt(s, t).forEach((q) => {
    items.push({
      kind: 'sprite', pos: q.c, key: `${key}_${si}_${q.sd}`,
      draw: (c) => {
        const r = q.r * c.k;
        if (r < 1.2 || q.o < 0.01) return null;
        const v = c.view;
        const dist = len3(sub3(q.c, v.pos));
        let a = q.o * clamp((dist - q.r * 0.8) / (q.r * 1.4));
        if (r > v.H * 0.22) a *= clamp(1 - (r - v.H * 0.22) / (v.H * 0.35), 0.2, 1);
        if (dist < 7) a = Math.min(a, 0.4 + 0.6 * clamp((dist - 2.5) / 4.5));
        if (a < 0.01) return null;
        const col = s.color ?? '#E6E2DC';
        // toward the sun on screen: offset the lit cap that way (and the shadow body the other way)
        const sp = project(v, add3(q.c, mul3(norm3(c.light.sun), q.r)));
        let hx = sp.x - c.x, hy = sp.y - c.y;
        const hl = Math.hypot(hx, hy) || 1;
        hx /= hl; hy = Math.min(hy / hl, -0.2);
        const hn = Math.hypot(hx, hy); hx /= hn; hy /= hn;
        const rot = (rnd(q.sd) * 6 + t * 0.12 * (rnd(q.sd + 1) - 0.5)) % 6.283;
        const n = 5 + (rnd(q.sd + 5) < 0.5 ? 1 : 0); // per puff (never by size: a growing puff must not change shape)
        const sh = tone(c, col, 0, 0.8), mid = tone(c, col, 1, 1), lit = tone(c, col, 2, 1.2);
        return (
          <g opacity={f1(a)}>
            {r > 6 && <path d={billowPath(c.x, c.y, r * 1.1, q.sd + 11, n, 1, 0.94, rot)} fill={mid} opacity={f1(0.42 * smooth((r - 6) / 10))} />}
            <path d={billowPath(c.x - hx * r * 0.06, c.y - hy * r * 0.06, r * 0.95, q.sd, n, 1, 0.94, rot)} fill={mid} />
            <path d={billowPath(c.x - hx * r * 0.3, c.y - hy * r * 0.3 + r * 0.08, r * 0.58, q.sd + 3, n - 1, 1, 0.9, rot)} fill={sh} opacity={0.55} />
            <path d={billowPath(c.x + hx * r * 0.26, c.y + hy * r * 0.26, r * 0.6, q.sd + 7, n - 1, 1, 0.94, rot)} fill={lit} opacity={0.8} />
          </g>
        );
      },
    });
  }));
  return items;
};

// ------------------------------------------------------------------ smoke canister (thrown, then billowing)
export type CanisterOpts = ThrowOpts & {key: string; popDelay?: number; dur?: number; rate?: number; life?: number; color?: string; wind?: V3; size?: number; grow?: number};
/** The canister's smoke as a source (feed it to smokeDensity / decoyItems). */
export const canisterSource = (o: CanisterOpts): SmokeSource => {
  const pop = o.t0 + (o.flight ?? 0.9) + (o.popDelay ?? 0.15);
  return {
    pos: (te) => add3(thrown(o, te).p, {x: 0, y: 0.08, z: 0}),
    start: pop, end: pop + (o.dur ?? 14), rate: o.rate ?? 7, life: o.life ?? 9,
    up: 0.7, jet: {x: 0.5, y: 2.2, z: 0.2}, jetSpread: 1.4, spread: 0.25, size: o.size ?? 0.35, grow: o.grow ?? 1.05,
    wind: o.wind, color: o.color ?? '#ECE8E2', opacity: 0.9, seed: o.seed ?? 3,
  };
};
/** A smoke canister: lobbed arc, bounce, roll, then a hissing jet of white smoke. */
export const smokeCanister = (o: CanisterOpts, t: number): FxOut => {
  if (t < o.t0) return fx();
  const st = thrown(o, t);
  const src = canisterSource(o);
  const items: Item[] = [{
    kind: 'sprite', pos: st.p, key: `${o.key}_can`,
    draw: (c) => {
      const L = 0.26 * c.k, R = 0.065 * c.k;
      if (L < 1.5) return null;
      const iw = inkPx(c, 0.012, 0.6, 2);
      return (
        <g transform={`translate(${f1(c.x)} ${f1(c.y - R)}) rotate(${f1(st.rot % 360)})`}>
          <rect x={f1(-L / 2)} y={f1(-R)} width={f1(L)} height={f1(2 * R)} rx={f1(R * 0.4)} fill={tone(c, '#556B4A')} stroke={inkTone(c)} strokeWidth={f1(iw)} />
          <rect x={f1(-L * 0.12)} y={f1(-R)} width={f1(L * 0.14)} height={f1(2 * R)} fill={tone(c, '#E8D25A')} />
          <rect x={f1(L / 2 - R * 0.6)} y={f1(-R * 0.7)} width={f1(R * 0.9)} height={f1(R * 1.4)} fill={tone(c, '#2A2D31')} />
        </g>
      );
    },
  }];
  const pop = src.start;
  return combine(
    fx(items),
    fx(smokeItems(t, [src], `${o.key}_sm`)),
    fx(sparks3({at: add3(st.p, {x: 0, y: 0.1, z: 0}), t, t0: pop, t1: pop + 0.5, rate: 40, key: `${o.key}_pop`, n: 0, dir: {x: 0, y: 1, z: 0}, spread: 50, speed: [1.5, 4], life: [0.15, 0.35], flash: 0, seed: (o.seed ?? 3) + 5})),
  );
};

/** Dark smoke column from a fire or a wreck (for blasts, burning machines). */
export const columnSource = (pos: V3 | ((t: number) => V3), start: number, end: number, seed: number, scale = 1, color = '#3A2F33'): SmokeSource => ({
  pos, start, end, rate: 5 / Math.max(0.4, scale), life: 7, up: 2.2 * scale, spread: 0.4 * scale, size: 0.5 * scale, grow: 1.2 * scale, color, opacity: 0.85, seed,
});

