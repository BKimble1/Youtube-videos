// Small surface marks: the bruise where clamped jaws pinch a leaf vein.
import React from 'react';
import {add3, Basis, cross3, mul3, norm3, proj, smoothClosed, V3} from '../core/three';
import {Item} from '../core/draw3';
import {BiteAnchor} from './story';
import {ss} from '../lib';

/** a dark pinch band across the midrib at the bite (tau = time since the jaws met it) */
export const biteMark = (B: Basis, A: BiteAnchor, tau: number): Item[] => {
  if (tau < -0.01) return [];
  const k = ss(tau, -0.01, 0.12);
  const lat = norm3(cross3(A.u, A.f));
  const pts: V3[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push(add3(A.vein, add3(mul3(A.u, Math.cos(a) * 0.32), add3(mul3(lat, Math.sin(a) * 0.42), mul3(A.f, 0.02)))));
  }
  const P = pts.map((p) => proj(B, p));
  const c = proj(B, A.vein);
  return [{z: c.z - 0.35, el: <path key="bm" d={smoothClosed(P)} fill="#2F5A2A" opacity={0.55 * k} />}];
};
