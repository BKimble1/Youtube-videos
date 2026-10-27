// Group D: what is inside a silicone target, for views that see the target's face (az < 0): the part of the needle
// inside the silicone and the delivered dose (a soft amber bloom ahead of the tip), drawn over the target as seen
// through the translucent silicone, plus a clip that keeps the insect's drawing (Gear2D's needle) off that region.
import React from 'react';
import {V2, Frame, toW} from '../../../lib/v3';
import {INJ, PACK} from '../../../rig/gear';
import {G2} from '../../roach/Gear2D';
import {View, P, f2, polyD} from '../../roach/ortho';

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

/** the needle inside the silicone and the bloom (k 0..1 of the dose delivered), seen through it */
export const InsideNeedle: React.FC<{id: string; v: View; inj: Frame; injRear: number; face: number; bloom: number; seen?: number}> = ({id, v, inj, injRear, face, bloom, seen = 0.7}) => {
  const ty = PACK.tube.a[1];
  const x0 = face - inj.o[0] - injRear;
  const a = P(v, toW(inj, [injRear + x0, ty, 0])), b = P(v, toW(inj, [injRear + NEEDLE_END, ty, 0]));
  const tipC = P(v, toW(inj, [injRear + NEEDLE_END + 0.5, ty, 0]));
  const r = 3.1 * Math.cbrt(Math.max(0, bloom)) * v.s;
  return (
    <g opacity={seen}>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor={G2.dose} stopOpacity={0.95} />
          <stop offset="0.55" stopColor={G2.dose} stopOpacity={0.7} />
          <stop offset="1" stopColor={G2.dose} stopOpacity={0} />
        </radialGradient>
      </defs>
      {bloom > 0 && <circle cx={f2(tipC[0])} cy={f2(tipC[1])} r={f2(r * 1.35)} fill={`url(#${id}-g)`} />}
      <path d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke={G2.needle} strokeWidth={f2(Math.max(1.4, 0.45 * v.s))} strokeLinecap="round" />
    </g>
  );
};

/** an earlier trial's mark in a target: the puncture on the face and the bloom inside (world points) */
export const OldDose: React.FC<{id: string; v: View; face: number; y: number; z: number; k?: number}> = ({id, v, face, y, z, k = 1}) => {
  const hole = P(v, [face, y, z]);
  const c = P(v, [face + 5.5, y, z]);
  const r = 3.0 * k * v.s;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-g`}>
          <stop offset="0" stopColor={G2.dose} stopOpacity={0.8} />
          <stop offset="0.5" stopColor={G2.dose} stopOpacity={0.55} />
          <stop offset="1" stopColor={G2.dose} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r * 1.35)} fill={`url(#${id}-g)`} opacity={0.75} />
      <circle cx={f2(hole[0])} cy={f2(hole[1])} r={f2(Math.max(1.2, 0.35 * v.s))} fill="#B86A5E" />
    </g>
  );
};
