// An oriented box (any frame), shaded per visible face from the fixed upper-left key light, with one ink outline.
import React from 'react';
import {add3, Basis, dot3, hull, mul3, norm3, P2, proj, sub3, V3} from './three';
import {inkW, Item} from './draw3';
import {lit, shade} from './color';
import {INK} from './ink';
import {Frame} from './frame';

const KEY: V3 = norm3([-0.5, -0.45, 0.75]);
export const obbItem = (B: Basis, F: Frame, h: V3, color: string, o: {zBias?: number; ink?: number; key?: string; opacity?: number; top?: string} = {}): Item => {
  const ax = [F.f, F.l, F.u];
  const P = (a: number, b: number, c: number) => add3(F.o, add3(mul3(ax[0], a * h[0]), add3(mul3(ax[1], b * h[1]), mul3(ax[2], c * h[2]))));
  const faces: {n: V3; pts: V3[]; isTop?: boolean}[] = [
    {n: F.u, pts: [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], isTop: true},
    {n: mul3(F.u, -1), pts: [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1)]},
    {n: F.f, pts: [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)]},
    {n: mul3(F.f, -1), pts: [P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1), P(-1, -1, 1)]},
    {n: F.l, pts: [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)]},
    {n: mul3(F.l, -1), pts: [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)]},
  ];
  const vis = faces.filter((fc) => {
    const c = mul3(fc.pts.reduce((s, p) => add3(s, p), [0, 0, 0] as V3), 0.25);
    return dot3(fc.n, sub3(B.eye, c)) > 0;
  });
  const corners: V3[] = [];
  [-1, 1].forEach((a) => [-1, 1].forEach((b) => [-1, 1].forEach((c) => corners.push(P(a, b, c)))));
  const outline = hull(corners.map((p) => proj(B, p)));
  const C = proj(B, F.o);
  const el = (
    <g key={o.key} opacity={o.opacity}>
      {vis.map((fc, i) => {
        const l = dot3(fc.n, KEY);
        const fill = fc.isTop && o.top ? o.top : l > 0 ? lit(color, 0.45 * l) : shade(color, -0.55 * l);
        return <path key={i} d={`M${fc.pts.map((p) => P2(proj(B, p))).join(' L')} Z`} fill={fill} stroke={l > 0 ? lit(color, 0.5) : shade(color, 0.6)} strokeWidth={0.6} strokeLinejoin="round" />;
      })}
      <path d={`M${outline.map(P2).join(' L')} Z`} fill="none" stroke={INK} strokeWidth={(o.ink ?? inkW(C.s)).toFixed(2)} strokeLinejoin="round" />
    </g>
  );
  return {z: C.z + (o.zBias ?? 0), el};
};
