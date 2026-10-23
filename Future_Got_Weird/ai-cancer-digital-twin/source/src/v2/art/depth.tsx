// V4 shared depth and behaviour pieces.
//  Bokeh: out-of-focus foreground blobs in a near parallax layer, kept to the frame edges so they never sit on top of
//         the action (they give the camera a lens and the scene a foreground without masking interactions).
//  Phagocyte: a macrophage that reaches round a target with a phagocytic cup and swallows it (clean-up after apoptosis).
//  Lineage: a deterministic family tree of dividing cells (each division is real mitosis, daughters keep the parent's
//           identity and drift apart), so a colony grows coherently instead of popping in.
import React from 'react';
import {Cam, W, H} from '../../kit/cam';
import {P as Pt, closedPath, rand, noise, smooth, clamp01, lerp} from '../../kit/core';
import {P} from '../palette';
import {Cell2, DividingCell, Look, Flat} from './tissue';

const mod = (a: number, n: number) => ((a % n) + n) % n;

export const Bokeh: React.FC<{cam: Cam; t: number; depth?: number; n?: number; seed?: number; size?: number; fill?: string; op?: number; drift?: number}> = ({cam, t, depth = 2.1, n = 9, seed = 3, size = 260, fill = 'url(#bokehWarm)', op = 1, drift = 14}) => {
  const z = cam.z * depth;
  const span = 3200;
  return (
    <g pointerEvents="none">
      {Array.from({length: n}, (_, k) => {
        const wx = rand(seed * 97 + k) * span + t * drift * (rand(seed + k) - 0.3), wy = rand(seed * 89 + k) * span + t * drift * 0.4;
        const sx = mod(wx - cam.x * z, span) - (span - W) / 2;
        const sy = mod(wy - cam.y * z, span) - (span - H) / 2;
        const e = Math.hypot((sx - W / 2) / (W / 2), (sy - H / 2) / (H / 2));
        const edge = smooth((e - 0.5) / 0.45);
        if (edge <= 0.01) return null;
        const r = size * (0.6 + 0.8 * rand(seed * 7 + k));
        return <ellipse key={k} cx={sx} cy={sy} rx={r} ry={r * (0.8 + 0.3 * rand(seed * 5 + k))} fill={fill} opacity={op * edge * (0.55 + 0.45 * rand(seed * 3 + k))} />;
      })}
    </g>
  );
};

/** Macrophage reaching round a target at angle `to` (radians) with a phagocytic cup (cup 0..1). After the cup closes
 *  the cell rounds up again with the swallowed material inside (eaten 0..1 draws vesicles inside). */
export const Phagocyte: React.FC<{x: number; y: number; r?: number; t: number; seed?: number; to?: number; cup?: number; eaten?: number; op?: number; dir?: number}> = ({x, y, r = 100, t, seed = 5, to = 0, cup = 0, eaten = 0, op = 1, dir}) => {
  const pts: Pt[] = Array.from({length: 30}, (_, k) => {
    const a = (k / 30) * Math.PI * 2;
    const da = Math.atan2(Math.sin(a - to), Math.cos(a - to));
    const ruffle = 0.1 * noise(k * 0.8 + t * 0.9, seed) + 0.05 * Math.sin(k * 3 + t * 2.2);
    const arms = cup * 0.55 * Math.exp(-((Math.abs(da) - 0.62) ** 2) / 0.05);
    const recess = cup * 0.18 * Math.exp(-(da * da) / 0.08) * (1 - smooth((eaten - 0.4) / 0.6));
    const lead = dir === undefined ? 0 : 0.16 * Math.exp(-(Math.atan2(Math.sin(a - dir), Math.cos(a - dir)) ** 2) / 0.5);
    const f = 1 + ruffle + arms * (1 - smooth((eaten - 0.3) / 0.7)) - recess + lead;
    return [Math.cos(a) * r * f, Math.sin(a) * r * f * 0.92];
  });
  const d = closedPath(pts, 1);
  return (
    <g opacity={op} transform={`translate(${x} ${y})`}>
      <path d={d} fill="#22407A" />
      <path d={d} fill={P.immuneBlue} transform="scale(0.93)" opacity={0.88} />
      <path d={d} fill="url(#vol)" transform="scale(0.93)" />
      <ellipse cx={-Math.cos(to) * r * 0.25} cy={-Math.sin(to) * r * 0.22} rx={r * 0.34} ry={r * 0.26} fill="#1C3A6E" />
      <ellipse cx={-Math.cos(to) * r * 0.25} cy={-Math.sin(to) * r * 0.22} rx={r * 0.34} ry={r * 0.26} fill="url(#nucVol)" />
      {Array.from({length: 5}, (_, k) => <circle key={k} cx={(rand(seed + k) - 0.5) * r * 1.1} cy={(rand(seed * 3 + k) - 0.5) * r * 0.9} r={r * 0.07} fill="#9CC0FF" opacity={0.6} />)}
      {/* swallowed apoptotic material in phagosomes */}
      {eaten > 0.01 && Array.from({length: 4}, (_, k) => {
        const a = to + (k - 1.5) * 0.5;
        const dd = r * lerp(0.75, 0.32, smooth(eaten));
        return <circle key={'e' + k} cx={Math.cos(a) * dd} cy={Math.sin(a) * dd} r={r * 0.13} fill="#7E6A84" stroke="#C2AABC" strokeWidth={r * 0.025} opacity={smooth(eaten * 2)} />;
      })}
    </g>
  );
};

// ------------------------------------------------------------------------------------------------ lineage
export type LNode = {id: string; x: number; y: number; r: number; seed: number; born: number; div: number; axis: number; gen: number; kids: LNode[]};
const DIV_DUR = 1.3;
/** Build a family tree: root divides at times[0] (+jitter), each daughter at times[1], … */
export const buildLineage = (root: {x: number; y: number; r: number; seed: number; axis?: number}, times: number[], born = -99, spread = 1.02, id = 'L'): LNode => {
  const make = (x: number, y: number, seed: number, b: number, gen: number, axis: number, nid: string): LNode => {
    const div = gen < times.length ? times[gen] + 0.5 * rand(seed * 13 + gen) : Infinity;
    const node: LNode = {id: nid, x, y, r: root.r, seed, born: b, div, axis, gen, kids: []};
    if (div < Infinity) {
      const a = (axis * Math.PI) / 180;
      [-1, 1].forEach((s, k) => {
        const cx = x + Math.cos(a) * root.r * spread * s, cy = y + Math.sin(a) * root.r * spread * s;
        node.kids.push(make(cx, cy, seed * 3 + k + 1, div + DIV_DUR, gen + 1, axis + 90 + (rand(seed * 7 + k) - 0.5) * 50, nid + k));
      });
    }
    return node;
  };
  return make(root.x, root.y, root.seed, born, 0, root.axis ?? 30, id);
};
export type LiveCell = {node: LNode; x: number; y: number; r: number; dividing: number};
/** The cells alive at t (a cell in mitosis is reported once with dividing = progress). Daughters start where the
 *  mitosis left them and drift to their resting places. */
export const liveCells = (root: LNode, t: number): LiveCell[] => {
  const out: LiveCell[] = [];
  const walk = (n: LNode, px: number, py: number) => {
    const age = smooth(clamp01((t - n.born) / 1.1));
    const x = lerp(px, n.x, age), y = lerp(py, n.y, age);
    if (t < n.div) { out.push({node: n, x, y, r: n.r * lerp(0.84, 1, age), dividing: 0}); return; }
    if (t < n.div + DIV_DUR) { out.push({node: n, x, y, r: n.r, dividing: (t - n.div) / DIV_DUR}); return; }
    const a = (n.axis * Math.PI) / 180;
    n.kids.forEach((k, i) => walk(k, x + Math.cos(a) * n.r * 0.72 * (i ? 1 : -1), y + Math.sin(a) * n.r * 0.72 * (i ? 1 : -1)));
  };
  walk(root, root.x, root.y);
  return out;
};
/** Draw a live lineage cell (in mitosis or not). */
export const LineageCell: React.FC<{c: LiveCell; t: number; lod: number; look: Look; irr?: number; nucScale?: number; pulse?: number; flat?: Flat}> = ({c, t, lod, look, irr = 0.06, nucScale = 1.3, pulse = 0, flat}) =>
  c.dividing > 0 ? (
    <DividingCell x={c.x} y={c.y} r={c.r} seed={c.node.seed} t={t} p={c.dividing} axis={c.node.axis} lod={lod} look={look} sepF={0.72} dR={0.84} pulse={pulse} />
  ) : (
    <Cell2 x={c.x} y={c.y} r={c.r} seed={c.node.seed} t={t} lod={lod} look={look} irr={irr} nucScale={nucScale} round={0.25} pulse={pulse} flat={flat} />
  );
/** Push apart the final-generation cells of one or more lineages so no two daughters land on top of each other
 *  (mutates the leaf positions; their parents' division points are unchanged, so the drift after mitosis absorbs it). */
export const relaxLeaves = (roots: LNode[], minD: number, iters = 40) => {
  const leaves: LNode[] = [];
  const walk = (n: LNode) => (n.kids.length ? n.kids.forEach(walk) : leaves.push(n));
  roots.forEach(walk);
  for (let it = 0; it < iters; it++)
    for (let a = 0; a < leaves.length; a++)
      for (let b = a + 1; b < leaves.length; b++) {
        const A = leaves[a], B = leaves[b];
        const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
        if (d >= minD) continue;
        const push = (minD - d) / 2;
        A.x -= (dx / d) * push; A.y -= (dy / d) * push; B.x += (dx / d) * push; B.y += (dy / d) * push;
      }
};
