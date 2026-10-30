// Small drawing kit for the machines and sets: world-space polygons and capsules with gradient fills that are
// oriented from one fixed key light (upper-left), plus an ink contour. Shapes are computed in world coordinates (no
// rotated groups), so the light never turns with a part.
import React from 'react';
import {add, mul, norm, perp, rad, sub, V} from '../dc/math';
import {lit, shade} from '../dc/color';

export const INK = '#172B3A';
export const f = (n: number) => (Math.abs(n) < 1e-9 ? '0' : n.toFixed(2));
export const P = (p: V) => `${f(p.x)} ${f(p.y)}`;
export const poly = (pts: V[], close = true) => 'M' + pts.map(P).join(' L') + (close ? ' Z' : '');
/** frame: origin + angle (deg, 0 = +x, 90 = +y/down) */
export type Frame = {o: V; a: number};
export const fx = (F: Frame, p: V): V => {
  const c = Math.cos(rad(F.a));
  const s = Math.sin(rad(F.a));
  return {x: F.o.x + p.x * c - p.y * s, y: F.o.y + p.x * s + p.y * c};
};
export const fpts = (F: Frame, pts: [number, number][]) => pts.map(([x, y]) => fx(F, {x, y}));
export const dirOf = (a: number): V => ({x: Math.cos(rad(a)), y: Math.sin(rad(a))});
export const angOf = (d: V) => (Math.atan2(d.y, d.x) * 180) / Math.PI;

/** rounded slab between a and b with half-widths ra, rb (a capsule with flat-ish sides) */
export const slab = (a: V, b: V, ra: number, rb: number, round = 1) => {
  const d = norm(sub(b, a));
  const n = perp(d);
  const k = 0.5523 * round;
  const A1 = add(a, mul(n, ra));
  const A2 = add(a, mul(n, -ra));
  const B1 = add(b, mul(n, rb));
  const B2 = add(b, mul(n, -rb));
  const Ae = add(a, mul(d, -ra * round));
  const Be = add(b, mul(d, rb * round));
  return `M${P(A1)} L${P(B1)} C${P(add(B1, mul(d, rb * k)))} ${P(add(Be, mul(n, rb * k)))} ${P(Be)} C${P(add(Be, mul(n, -rb * k)))} ${P(add(B2, mul(d, rb * k)))} ${P(B2)} L${P(A2)} C${P(add(A2, mul(d, -ra * k)))} ${P(add(Ae, mul(n, -ra * k)))} ${P(Ae)} C${P(add(Ae, mul(n, ra * k)))} ${P(add(A1, mul(d, -ra * k)))} ${P(A1)} Z`;
};
export const circ = (c: V, r: number) => `M${f(c.x - r)} ${f(c.y)} a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;

/** shared light-oriented gradients for one material colour (objectBoundingBox: light from the upper-left) */
export const Mat: React.FC<{id: string; c: string; k?: number}> = ({id, c, k = 1}) => (
  <linearGradient id={id} x1="0.15" y1="0" x2="0.75" y2="1">
    <stop offset="0" stopColor={lit(c, 0.38 * k)} />
    <stop offset="0.45" stopColor={c} />
    <stop offset="1" stopColor={shade(c, 0.42 * k)} />
  </linearGradient>
);

type PathProps = {d: string; fill: string; ink?: number; opacity?: number; stroke?: string};
/** a filled path with an ink contour of width `ink` (world units) */
export const IP: React.FC<PathProps> = ({d, fill, ink = 0, opacity, stroke = INK}) => (
  <path d={d} fill={fill} stroke={ink > 0 ? stroke : 'none'} strokeWidth={ink} strokeLinejoin="round" opacity={opacity} />
);
export const Line: React.FC<{a: V; b: V; w: number; c?: string; o?: number; cap?: 'round' | 'butt'; dash?: string; off?: number}> = ({a, b, w, c = INK, o, cap = 'round', dash, off}) => (
  <line x1={f(a.x)} y1={f(a.y)} x2={f(b.x)} y2={f(b.y)} stroke={c} strokeWidth={w} strokeLinecap={cap} opacity={o} strokeDasharray={dash} strokeDashoffset={off} />
);
