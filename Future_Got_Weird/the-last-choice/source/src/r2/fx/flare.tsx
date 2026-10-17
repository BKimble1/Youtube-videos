// host's road flares: struck, thrown in an arc, bounced, burning red-white with a spark fountain and a thin smoke
// trail; a red point light for the engine. optikFlash() is the blinding hit on a machine's eye (MECH can also read
// blindAmount() to wash the eye out for a moment).
import React from 'react';
import {V3, add3, clamp, noise, rnd} from '../../kit/math';
import {Item, PointLight} from '../engine';
import {FxOut, fx, combine, f1, thrown, ThrowOpts, glowEl, gid, glowTone, tone, inkTone, inkPx} from './core';
import {sparks3} from './particles';
import {smokeItems, SmokeSource} from './smoke';

export type FlareOpts = ThrowOpts & {key: string; ignite?: number; burn?: number};

/** Is the flare burning at t, and how strongly (0..1, flickering)? */
export const flareBurn = (o: FlareOpts, t: number) => {
  const ig = o.ignite ?? o.t0 - 0.2, burn = o.burn ?? 25;
  if (t < ig || t > ig + burn) return 0;
  const a = t - ig;
  return clamp(a / 0.15) * clamp((ig + burn - t) / 1.5) * (0.82 + 0.18 * noise(t * 13, (o.seed ?? 1) * 3));
};

export const flare = (o: FlareOpts, t: number): FxOut => {
  const st = thrown(o, t);
  const b = flareBurn(o, t);
  const seed = o.seed ?? 1;
  const tip = add3(st.p, {x: 0, y: 0.04, z: 0});
  const items: Item[] = [{
    kind: 'sprite', pos: st.p, key: `${o.key}_stick`,
    draw: (c) => {
      const L = 0.3 * c.k, R = 0.022 * c.k;
      if (L < 2) return null;
      const rot = st.phase === 'rest' || st.phase === 'bounce' ? (st.rot % 360) * 0.15 + 8 : st.rot % 360;
      return (
        <g transform={`translate(${f1(c.x)} ${f1(c.y - R)}) rotate(${f1(rot)})`}>
          <rect x={f1(-L / 2)} y={f1(-R)} width={f1(L)} height={f1(2 * R)} rx={f1(R)} fill={tone(c, '#C9302C')} stroke={inkTone(c)} strokeWidth={f1(inkPx(c, 0.008, 0.5, 1.6))} />
          <rect x={f1(-L / 2)} y={f1(-R)} width={f1(L * 0.18)} height={f1(2 * R)} fill={tone(c, '#E8E0D0')} />
        </g>
      );
    },
  }];
  if (b > 0) {
    items.push({
      kind: 'sprite', pos: tip, key: `${o.key}_glow`, bias: 0.1,
      draw: (c) => (
        <g>
          {glowEl(gid(o.key, 'halo'), c.x, c.y, Math.max(10, 2.2 * c.k) * (0.9 + 0.2 * b), glowTone(c, '#FF4A3A', 0.35), 0.45 * b, 0)}
          {glowEl(gid(o.key, 'core'), c.x, c.y, Math.max(3, 0.35 * c.k), glowTone(c, '#FFF2EA', 0.2), b, 0.35)}
        </g>
      ),
    });
  }
  const ig = o.ignite ?? o.t0 - 0.2;
  const trail: SmokeSource = {pos: (te) => add3(thrown(o, te).p, {x: 0, y: 0.06, z: 0}), start: ig + 0.2, end: ig + (o.burn ?? 25), rate: 5, life: 3, up: 0.8, size: 0.08, grow: 0.35, color: '#C7A6A0', opacity: 0.5, seed: seed + 13};
  const lights: PointLight[] = b > 0 ? [{pos: add3(tip, {x: 0, y: 0.3, z: 0}), color: '#FF5A40', power: 1.15 * b, radius: 11, flicker: 0.3, seed}] : [];
  return combine(
    fx(items, lights),
    fx(sparks3({at: tip, t, t0: ig, t1: ig + (o.burn ?? 25), rate: 26, key: `${o.key}_fount`, n: 0, dir: {x: 0, y: 1, z: 0}, spread: 40, speed: [0.8, 2.6], life: [0.15, 0.45], width: 0.012, flash: 0, seed: seed + 3})),
    b > 0 ? fx(smokeItems(t, [trail], `${o.key}_trail`)) : null,
  );
};

/** How washed-out a machine eye is after a blinding flash at `at` (0..1; for MECH's eye drawing). */
export const blindAmount = (t: number, at: number, hold = 1.4) => (t < at ? 0 : t < at + 0.08 ? 1 : clamp(1 - (t - at - 0.08) / hold));

/** A blinding hit on a machine's optic: a white star burst and a short horizontal glare streak. */
export const optikFlash = (o: {eye: V3; t: number; at: number; key: string; strength?: number}): FxOut => {
  const a = o.t - o.at, s = o.strength ?? 1;
  if (a < 0 || a > 1.4) return fx();
  const k = a < 0.08 ? 1 : clamp(1 - (a - 0.08) / 1.3);
  return fx([{
    kind: 'sprite', pos: o.eye, key: `${o.key}_blind`, bias: 0.2,
    draw: (c) => {
      const R = Math.max(10, 0.9 * c.k) * s;
      const spikes = [0, 45, 90, 135].map((ang, i) => {
        const r = R * (i % 2 ? 0.6 : 1.1) * k;
        const rx = Math.cos((ang * Math.PI) / 180) * r, ry = Math.sin((ang * Math.PI) / 180) * r;
        return <line key={ang} x1={f1(c.x - rx)} y1={f1(c.y - ry)} x2={f1(c.x + rx)} y2={f1(c.y + ry)} stroke={glowTone(c, '#FFFFFF', 0.2)} strokeWidth={f1(Math.max(1, R * 0.06 * k))} strokeLinecap="round" opacity={f1(k)} />;
      });
      return (
        <g>
          {glowEl(gid(o.key, 'bl'), c.x, c.y, R * 1.3, glowTone(c, '#FFF6F0', 0.2), k, 0.3)}
          {glowEl(gid(o.key, 'st'), c.x, c.y, R * 3.2 * k, glowTone(c, '#FFD9D0', 0.2), 0.6 * k, 0, 0.12)}
          {spikes}
        </g>
      );
    },
  }]);
};

