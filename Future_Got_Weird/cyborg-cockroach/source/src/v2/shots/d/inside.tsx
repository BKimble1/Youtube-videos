// Group D: what is inside a silicone target, for views that see the target's face (az < 0): the part of the needle
// inside the silicone and the delivered dose (a soft amber bloom ahead of the tip), drawn over the target as seen
// through the translucent silicone, plus a clip that keeps the insect's drawing (Gear2D's needle) off that region.
import React from 'react';
import {V2, Frame, toW} from '../../../lib/v3';
import {INJ, PACK} from '../../../rig/gear';
import {G2} from '../../roach/Gear2D';
import {View, P, f2, polyD, smoothClosed} from '../../roach/ortho';
import {noise1} from '../../../lib/ease';

const NEEDLE_END = INJ.barrelLen + 1.2 + INJ.needleLen;

/** the needle's inside run (screen quad, padded) for a needle entering the face plane x = face */
const insideQuad = (v: View, inj: Frame, injRear: number, face: number, pad: number): V2[] => {
  const ty = PACK.tube.a[1];
  const x0 = face - inj.o[0] - injRear, x1 = NEEDLE_END + 0.4;
  const a = P(v, toW(inj, [injRear + x0, ty, 0])), b = P(v, toW(inj, [injRear + x1, ty, 0]));
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * pad, ny = (dx / L) * pad;
  return [[a[0] + nx, a[1] + ny], [b[0] + nx + (dx / L) * pad, b[1] + ny + (dy / L) * pad], [b[0] - nx + (dx / L) * pad, b[1] - ny + (dy / L) * pad], [a[0] - nx, a[1] - ny]];
};

/** a clipPath (evenodd) that excludes the needle's inside run */
export const NeedleClip: React.FC<{id: string; v: View; inj: Frame; injRear: number; face: number}> = ({id, v, inj, injRear, face}) => (
  <clipPath id={id}>
    <path d={`M-5000,-5000 H6000 V7000 H-5000 Z ${polyD(insideQuad(v, inj, injRear, face, Math.max(3, 0.7 * v.s)))}`} clipRule="evenodd" />
  </clipPath>
);

/** the delivered dose diffusing in clear silicone: a small, soft, translucent amber cloud (no glow, no bright core), a few
 *  overlapping irregular lobes ahead of the tip, slowly creeping; `c` the tip (screen), `dir` the needle's screen
 *  direction, `r` its size (px), `k` 0..1 delivered, `t` s (the edge drifts), `alpha` its overall opacity */
export const DoseCloud: React.FC<{id: string; c: V2; dir: V2; r: number; k: number; t: number; alpha?: number; seed?: number}> = ({id, c, dir, r, k, t, alpha = 0.42, seed = 0}) => {
  if (k <= 0 || r < 0.5) return null;
  const L = Math.hypot(dir[0], dir[1]) || 1;
  const ux = dir[0] / L, uy = dir[1] / L;
  // lobes: [along (x r), across (x r), size (x r), opacity]
  const lobes: [number, number, number, number][] = [
    [0.35, 0, 0.78, 0.55],
    [0.75, 0.28, 0.55, 0.4],
    [0.55, -0.35, 0.5, 0.38],
    [1.05, -0.05, 0.42, 0.28],
    [0.1, 0.18, 0.4, 0.45],
  ];
  const blob = (cx: number, cy: number, rr: number, sd: number) => {
    const pts: V2[] = [];
    for (let i = 0; i < 14; i++) {
      const th = (i / 14) * Math.PI * 2;
      const w = 1 + 0.2 * noise1(i * 0.9 + t * 0.8, sd) + 0.12 * Math.sin(3 * th + sd * 1.7 + t * 0.5);
      // a little longer along the needle (the dose leaves the tip forward)
      const ex = Math.cos(th) * 1.15 * rr * w, ey = Math.sin(th) * 0.9 * rr * w;
      pts.push([cx + ex * ux - ey * uy, cy + ex * uy + ey * ux]);
    }
    return smoothClosed(pts);
  };
  const grow = Math.min(1, k * 1.2);
  return (
    <g opacity={alpha * Math.min(1, k * 2.5)}>
      <defs>
        <filter id={`${id}-cb`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={f2(Math.max(0.6, 0.16 * r))} />
        </filter>
      </defs>
      <g filter={`url(#${id}-cb)`}>
        {lobes.map(([al, ac, sz, op], i) => {
          const g = i < 2 ? 1 : grow * grow; // the outer lobes come as the cloud spreads
          if (g <= 0.02) return null;
          const along = al * r * (0.6 + 0.4 * grow), across = ac * r;
          const cx = c[0] + ux * along - uy * across, cy = c[1] + uy * along + ux * across;
          return <path key={i} d={blob(cx, cy, sz * r * g, seed * 7 + i)} fill={i % 2 ? '#F0B45A' : G2.dose} opacity={op} />;
        })}
      </g>
    </g>
  );
};

/** the needle inside the silicone and the bloom (k 0..1 of the dose delivered), seen through it */
export const InsideNeedle: React.FC<{id: string; v: View; inj: Frame; injRear: number; face: number; bloom: number; seen?: number; t?: number}> = ({id, v, inj, injRear, face, bloom, seen = 0.7, t = 0}) => {
  const ty = PACK.tube.a[1];
  const x0 = face - inj.o[0] - injRear;
  const a = P(v, toW(inj, [injRear + x0, ty, 0])), b = P(v, toW(inj, [injRear + NEEDLE_END, ty, 0]));
  const tipC = P(v, toW(inj, [injRear + NEEDLE_END + 0.2, ty, 0]));
  const r = 2.5 * Math.cbrt(Math.max(0, bloom)) * v.s;
  return (
    <g opacity={seen}>
      <DoseCloud id={`${id}-dc`} c={tipC} dir={[b[0] - a[0], b[1] - a[1]]} r={r} k={bloom} t={t} alpha={0.5 / seen} />
      <path d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke={G2.needle} strokeWidth={f2(Math.max(1.4, 0.45 * v.s))} strokeLinecap="round" />
    </g>
  );
};

/** an earlier trial's mark in a target: the puncture on the face and a faint amber haze inside (world points) */
export const OldDose: React.FC<{id: string; v: View; face: number; y: number; z: number; k?: number}> = ({id, v, face, y, z, k = 1}) => {
  const hole = P(v, [face, y, z]);
  const c = P(v, [face + 3.5, y, z]);
  const e = P(v, [face + 8, y, z]);
  return (
    <g>
      <DoseCloud id={`${id}-dc`} c={c} dir={[e[0] - c[0], e[1] - c[1]]} r={2.6 * k * v.s} k={1} t={0} alpha={0.22} seed={Math.round(y)} />
      <circle cx={f2(hole[0])} cy={f2(hole[1])} r={f2(Math.max(1, 0.25 * v.s))} fill="#9A7F78" opacity={0.7} />
    </g>
  );
};
