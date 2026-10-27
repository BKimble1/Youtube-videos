// Group D: the launch's effects in the look of the hook (shots/h/A1.tsx): crisp speed streaks behind the injector while
// the spring drives it, the spark where the coil parts the line (and a wisp from the burnt line), the expanding rings in
// the clear silicone around the entry, and the block's squash (a transform about its backing plate).
import React from 'react';
import {Frame, toW} from '../../../lib/v3';
import {clamp} from '../../../lib/ease';
import {PACK, INJ} from '../../../rig/gear';
import {View, P, f2} from '../../roach/ortho';
import {D_FACE, D_FIRE} from './trial';

/** speed streaks trailing the injector's rear (thin crisp lines in the tube behind it, longer with speed k 0..1) */
export const Streaks: React.FC<{v: View; frame: Frame; rear: number; k: number}> = ({v, frame, rear, k}) => {
  if (k <= 0.05) return null;
  const y = PACK.tube.a[1];
  return (
    <g stroke="#172B3A" strokeLinecap="round" opacity={0.4 * k}>
      {[-1.6, 0.2, 1.8].map((dy, i) => {
        const a = P(v, toW(frame, [rear - 1.5 - 7 * k - i * 1.5, y + dy, 0.5 * dy])), b = P(v, toW(frame, [rear - 0.6, y + dy, 0.5 * dy]));
        return <path key={i} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} strokeWidth={f2(Math.max(1.5, 0.28 * v.s))} />;
      })}
    </g>
  );
};

/** the line parting: a small brief spark right at the coil (a hot point and a few short sparklets, two or three frames),
 *  then a thin wisp from the burnt line. Deliberately small: a nichrome wire cutting a thread, not a flare. */
export const Spark: React.FC<{v: View; frame: Frame; t: number}> = ({v, frame, t}) => {
  const dt = t - D_FIRE;
  if (dt < -0.02 || dt > 0.6) return null;
  const u = (dt + 0.02) / 0.1;
  const c = P(v, toW(frame, [PACK.tube.b[0] - 0.4, PACK.tube.a[1] + PACK.tube.r * 0.55, 0]));
  const s = v.s;
  const smoke = [0, 1, 2].map((k) => {
    const w = clamp((dt - 0.03 - k * 0.05) / 0.5);
    if (w <= 0 || w >= 1) return null;
    const x = c[0] + (0.6 + 1.6 * w + k * 0.4) * s * 0.4 * Math.sin(k * 2.1 + w * 3);
    const y = c[1] - (0.8 + 4.5 * w) * s;
    return <circle key={k} cx={f2(x)} cy={f2(y)} r={f2((0.3 + 0.7 * w) * s)} fill="#E6EBEE" opacity={0.45 * (1 - w) * Math.min(1, w * 6)} />;
  });
  const uu = Math.min(1, Math.max(0, u));
  return (
    <g>
      {u <= 1 && (
        <g opacity={1 - uu * uu}>
          <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(0.9 * s)} fill="#FFD36B" opacity={0.28} />
          <circle cx={f2(c[0])} cy={f2(c[1])} r={f2(0.32 * s)} fill="#FFF6DE" />
          {[0, 1, 2, 3, 4].map((i) => {
            const a = -0.4 + (i / 5) * Math.PI * 2 + 0.25 * i;
            const r0 = (0.35 + 0.5 * uu) * s, r1 = (0.8 + 0.9 * uu + 0.25 * (i % 2)) * s;
            return <path key={i} d={`M${f2(c[0] + Math.cos(a) * r0)},${f2(c[1] + Math.sin(a) * r0)} L${f2(c[0] + Math.cos(a) * r1)},${f2(c[1] + Math.sin(a) * r1)}`} stroke="#FFE7A8" strokeWidth={f2(Math.max(1.2, 0.12 * s))} strokeLinecap="round" />;
          })}
        </g>
      )}
      {smoke}
    </g>
  );
};

/** the travelling injector, read as a device: printed graduation ticks on the clear barrel (over the amber dose), the
 *  glass's long highlight, and the needle's bright edge (drawn over Gear2D's injector in its own frame) */
export const InjectorRead: React.FC<{v: View; frame: Frame; rear: number}> = ({v, frame, rear}) => {
  const y = PACK.tube.a[1];
  const s = v.s;
  const I = (x: number, dy: number) => P(v, toW(frame, [rear + x, y + dy, 0]));
  const r = INJ.barrelR;
  const ticks = [5, 7, 9, 11, 13, 15].map((x, i) => {
    const a = I(x, r - 0.25), b = I(x, r - (i % 2 ? 0.85 : 1.35));
    return <path key={i} d={`M${f2(a[0])},${f2(a[1])} L${f2(b[0])},${f2(b[1])}`} stroke="#172B3A" strokeWidth={f2(Math.max(1, 0.09 * s))} opacity={0.55} />;
  });
  const h0 = I(1.2, r * 0.55), h1 = I(INJ.barrelLen - 1.5, r * 0.55);
  const n0 = I(INJ.collarAt + 1.1, 0.12), n1 = I(INJ.barrelLen + 1.2 + INJ.needleLen - 0.5, 0.12);
  return (
    <g strokeLinecap="round">
      {ticks}
      <path d={`M${f2(h0[0])},${f2(h0[1])} L${f2(h1[0])},${f2(h1[1])}`} stroke="#FFFFFF" strokeWidth={f2(0.28 * s)} opacity={0.7} />
      <path d={`M${f2(n0[0])},${f2(n0[1])} L${f2(n1[0])},${f2(n1[1])}`} stroke="#FFFFFF" strokeWidth={f2(Math.max(1, 0.1 * s))} opacity={0.9} />
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
