// Group D: the launch's effects in the look of the hook (shots/h/A1.tsx): crisp speed streaks behind the injector while
// the spring drives it, the spark where the coil parts the line (and a wisp from the burnt line), the expanding rings in
// the clear silicone around the entry, and the block's squash (a transform about its backing plate).
import React from 'react';
import {Frame, toW} from '../../../lib/v3';
import {clamp} from '../../../lib/ease';
import {PACK} from '../../../rig/gear';
import {View, P, f2} from '../../roach/ortho';
import {D_FACE, D_FIRE} from './trial';

/** speed streaks behind the injector (thin crisp lines along the tube, longer with speed k 0..1) */
export const Streaks: React.FC<{v: View; frame: Frame; rear: number; k: number}> = ({v, frame, rear, k}) => {
  if (k <= 0.05) return null;
  const y = PACK.tube.a[1];
  return (
    <g stroke="#FFFFFF" strokeLinecap="round" opacity={0.85 * k}>
      {[-1.6, 0.2, 1.8].map((dy, i) => {
        const a = P(v, toW(frame, [rear - 2 - 9 * k - i * 2, y + dy, 0.5 * dy])), b = P(v, toW(frame, [rear + 8, y + dy, 0.5 * dy]));
        return <path key={i} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} strokeWidth={f2(Math.max(1.5, 0.28 * v.s))} />;
      })}
    </g>
  );
};

/** the line parting: a bright spark at the coil for a few frames, then a thin wisp from the burnt line */
export const Spark: React.FC<{v: View; frame: Frame; t: number}> = ({v, frame, t}) => {
  const dt = t - D_FIRE;
  if (dt < 0 || dt > 0.6) return null;
  const u = dt / 0.1;
  const c = P(v, toW(frame, [PACK.tube.b[0] + 0.4, PACK.tube.a[1] + PACK.tube.r * 0.55, 0]));
  const r = (1.2 + 2.8 * Math.min(1, u)) * v.s;
  const smoke = [0, 1, 2].map((k) => {
    const w = clamp((dt - 0.03 - k * 0.05) / 0.5);
    if (w <= 0 || w >= 1) return null;
    const x = c[0] + (0.6 + 1.6 * w + k * 0.4) * v.s * 0.4 * Math.sin(k * 2.1 + w * 3);
    const y = c[1] - (0.8 + 4.5 * w) * v.s;
    return <circle key={k} cx={f2(x)} cy={f2(y)} r={f2((0.35 + 0.9 * w) * v.s)} fill="#E6EBEE" opacity={0.5 * (1 - w) * Math.min(1, w * 6)} />;
  });
  return (
    <g>
      {u <= 1 && (
        <g opacity={1 - u}>
          <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(r)} fill="#FFE9A8" opacity={0.55} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2 + 0.3;
            return <path key={i} d={`M${f2(c[0] + Math.cos(a) * r * 0.35)},${f2(c[1] + Math.sin(a) * r * 0.35)} L${f2(c[0] + Math.cos(a) * r)},${f2(c[1] + Math.sin(a) * r)}`} stroke="#FFF6DE" strokeWidth={f2(Math.max(1.5, 0.25 * v.s))} strokeLinecap="round" />;
          })}
          <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(0.45 * v.s)} fill="#FFFFFF" />
        </g>
      )}
      {smoke}
    </g>
  );
};

/** expanding rings in the clear silicone around the entry, just after contact (imp: s since contact) */
export const Rings: React.FC<{v: View; imp: number; y?: number}> = ({v, imp, y = PACK.tube.a[1]}) => {
  if (imp < 0 || imp > 0.4) return null;
  const c = P(v, [D_FACE, y, 0]);
  return (
    <g fill="none" stroke="#FFFFFF">
      {[0, 0.08].map((d, i) => {
        const u = clamp((imp - d) / 0.3);
        if (u <= 0 || u >= 1) return null;
        return <ellipse key={i} cx={f2(c[0])} cy={f2(c[1])} rx={f2((0.6 + 2.2 * u) * v.s * Math.abs(v.R[0]) + 2)} ry={f2((1 + 4.5 * u) * v.s)} strokeWidth={f2(Math.max(1.5, 0.3 * v.s * (1 - u)))} opacity={0.9 * (1 - u)} />;
      })}
    </g>
  );
};

/** the block's squash: compressed along x toward its backing plate by `sq` mm (and bulging a little in height) */
export const squashT = (v: View, sq: number, face = D_FACE, depth = 30) => {
  if (Math.abs(sq) < 1e-3) return undefined;
  const a = P(v, [face + depth, 0, 0]);
  const kx = 1 - sq / depth, ky = 1 + (0.4 * sq) / depth;
  // scale about the plate's foot, along screen x (the views here look along z: the block's x is screen x)
  return `translate(${f2(a[0])} ${f2(a[1])}) scale(${kx.toFixed(4)} ${ky.toFixed(4)}) translate(${f2(-a[0])} ${f2(-a[1])})`;
};
