// Puddle — a ground puddle showing a darkened, vertically flipped reflection of `children` (any world-space content,
// e.g. burning facades or flames) about the surface line y, with a gentle shimmer and rings from a disturbance at t0
// (the hand that slips into it). The reflection is drawn in horizontal strips with small offsets, so it is
// deterministic and needs no filters.
import React from 'react';
import {CITY} from '../theme';
import {f2, range, INK, blobD, clamp} from './cityKit';

export type PuddleProps = {
  x: number; y: number; rx: number; ry: number; t: number; seed?: number; ink?: number;
  /** disturbance: time and x/y of the touch (world); rings expand from there */
  t0?: number; dx?: number; dy?: number;
  /** extra mirror offset: content at height h above y appears h below the surface line (default mirror line y) */
  mirrorY?: number; strips?: number; dark?: number; children?: React.ReactNode;
  /** vertical compression of the reflection (grazing view of a ground puddle: tall distant things fit inside it) */
  squash?: number;
};

export const Puddle: React.FC<PuddleProps> = ({x, y, rx, ry, t, seed = 1, ink = 4, t0 = -99, dx, dy, mirrorY, strips = 14, dark = 0.58, children, squash = 1}) => {
  const id = `pd${seed}_${Math.round(x)}_${Math.round(y)}`;
  const shape = blobD(1, seed, 11, 0.22, rx, ry);
  const my = mirrorY ?? y;
  const since = t - t0;
  const disturb = since >= 0 ? Math.exp(-since * 0.9) : 0;
  const px = dx ?? x, py = dy ?? y;
  const top = y - ry, h = (ry * 2) / strips;
  const bands = range(strips).map((i) => {
    const by = top + i * h;
    const near = Math.exp(-Math.abs(by + h / 2 - py) / (ry * 0.8));
    const off = Math.sin(t * 1.7 + i * 1.3 + seed) * 2 + (since >= 0 ? Math.sin(since * 14 - i * 1.6) * 26 * disturb * (0.4 + near) : 0);
    return (
      <g key={i}>
        <defs><clipPath id={`${id}b${i}`}><rect x={x - rx * 1.2} y={by} width={rx * 2.4} height={h + 1} /></clipPath></defs>
        <g clipPath={`url(#${id}b${i})`}>
          <g transform={`translate(${f2(off)} ${f2(my)}) scale(1 ${f2(-squash)}) translate(0 ${f2(-my)})`}>{children}</g>
        </g>
      </g>
    );
  });
  const rings = since >= 0 && since < 2.5 ? range(3).map((k) => {
    const s = since - k * 0.22;
    if (s < 0) return null;
    const r = 18 + s * 260;
    return <ellipse key={k} cx={px} cy={py} rx={r} ry={r * (ry / rx) * 0.9} fill="none" stroke="#FFD9A0" strokeWidth={ink * (1.2 - s * 0.4)} opacity={clamp(0.7 - s * 0.35)} />;
  }) : null;
  return (
    <g>
      <defs><clipPath id={id}><path d={shape} transform={`translate(${f2(x)} ${f2(y)})`} /></clipPath></defs>
      <path d={shape} transform={`translate(${f2(x)} ${f2(y)})`} fill={CITY.puddle} />
      <g clipPath={`url(#${id})`}>
        {bands}
        <rect x={x - rx * 1.2} y={y - ry * 1.2} width={rx * 2.4} height={ry * 2.4} fill="#14101A" opacity={dark} />
        {rings}
        <path d={`M ${f2(x - rx * 0.6)} ${f2(y - ry * 0.45)} Q ${f2(x)} ${f2(y - ry * 0.62)} ${f2(x + rx * 0.5)} ${f2(y - ry * 0.4)}`} stroke="#FFFFFF" strokeWidth={ink} opacity={0.18} fill="none" />
      </g>
      <path d={shape} transform={`translate(${f2(x)} ${f2(y)})`} fill="none" stroke={INK} strokeWidth={ink} />
    </g>
  );
};
