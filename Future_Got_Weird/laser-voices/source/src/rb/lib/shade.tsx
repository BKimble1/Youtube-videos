// From the Death Clock pipeline (Future_Got_Weird/Shorts/death-clock, branch claude/intelligent-fermat-pz7wjt): the
// Weird Crew vector finish shared across the channel. Unchanged except where noted.
// Gradient primitives. Every shape is drawn in the coordinates of the layer it sits in and its gradient is
// userSpaceOnUse, oriented from ONE fixed key light (warm, upper-left). Because the light never rotates with a
// part, shading stays continuous when limbs move (no gradient jumps). Inside an <Inked> group (lib/ink.tsx) each
// primitive also contributes its silhouette to the group's ink contour (Weird Crew outline).
import React from 'react';
import {inkUnder, useInk} from './ink';
import {lit, mix, rgba, shade} from './color';
import {add, dot, fmt, len, mul, norm, P, perp, sub, V} from './math';

/** Direction TOWARD the key light (screen space, y down): upper-left. */
export const LIGHT: V = norm({x: -0.62, y: -0.78});

type CapsuleProps = {
  id: string;
  a: V;
  b: V;
  ra: number;
  rb: number;
  color: string;
  /** opacity of the sharp white specular streak (0 = none) */
  spec?: number;
  /** contrast multiplier for the cylindrical shading */
  k?: number;
  opacity?: number;
  /** optional override of the shadow-side colour (e.g. local coloured light) */
  shadowTint?: string;
};

/** Tapered capsule path (outer tangents of two circles). */
export const capsulePath = (a: V, b: V, ra: number, rb: number) => {
  const d = Math.max(0.001, len(sub(b, a)));
  const ax = norm(sub(b, a));
  const n = perp(ax);
  const s = Math.max(-0.98, Math.min(0.98, (ra - rb) / d));
  const c = Math.sqrt(1 - s * s);
  const up = add(mul(ax, s), mul(n, c));
  const um = add(mul(ax, s), mul(n, -c));
  const p1 = add(a, mul(up, ra));
  const q1 = add(b, mul(up, rb));
  const q2 = add(b, mul(um, rb));
  const p2 = add(a, mul(um, ra));
  const largeQ = s < 0 ? 1 : 0;
  const largeP = s > 0 ? 1 : 0;
  return `M${P(p1)} L${P(q1)} A${fmt(rb)} ${fmt(rb)} 0 ${largeQ} 0 ${P(q2)} L${P(p2)} A${fmt(ra)} ${fmt(ra)} 0 ${largeP} 0 ${P(p1)} Z`;
};

/** Cylinder-shaded tapered capsule (limbs, fingers, vessels, cords). */
export const Capsule: React.FC<CapsuleProps> = ({id, a, b, ra, rb, color, spec = 0, k = 1, opacity = 1, shadowTint}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return inkUnder(ink.w, {d: capsulePath(a, b, ra, rb)}, opacity);
  const ax = norm(sub(b, a));
  let n = perp(ax);
  const m = dot(n, LIGHT);
  if (m < 0) n = mul(n, -1);
  const kk = Math.sqrt(Math.abs(m)) * k;
  const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
  const r = (ra + rb) / 2;
  const L = add(mid, mul(n, r));
  const S = add(mid, mul(n, -r));
  const sh = shadowTint ?? shade(color, 0.36 * kk);
  const len0 = len(sub(b, a));
  const specC = add(mid, mul(n, r * 0.5));
  const ang = (Math.atan2(ax.y, ax.x) * 180) / Math.PI;
  return (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={fmt(L.x)} y1={fmt(L.y)} x2={fmt(S.x)} y2={fmt(S.y)}>
          <stop offset="0" stopColor={lit(color, 0.3 * kk)} />
          <stop offset="0.24" stopColor={lit(color, 0.1 * kk)} />
          <stop offset="0.56" stopColor={color} />
          <stop offset="0.88" stopColor={sh} />
          <stop offset="1" stopColor={mix(sh, color, 0.35)} />
        </linearGradient>
      </defs>
      <path d={capsulePath(a, b, ra, rb)} fill={`url(#${id})`} />
      {spec > 0 && len0 > r * 0.8 && (
        <ellipse
          cx={fmt(specC.x)}
          cy={fmt(specC.y)}
          rx={fmt(Math.max(r * 0.4, len0 * 0.28))}
          ry={fmt(Math.max(0.6, r * 0.13))}
          transform={`rotate(${fmt(ang)} ${fmt(specC.x)} ${fmt(specC.y)})`}
          fill="#FFFFFF"
          opacity={spec}
        />
      )}
    </g>
  );
};

type SphereProps = {
  id: string;
  c: V;
  r: number;
  ry?: number;
  color: string;
  spec?: number;
  k?: number;
  rotate?: number;
  opacity?: number;
};

/** Sphere / ellipsoid with a radial gradient whose focal point sits toward the key light. */
export const Sphere: React.FC<SphereProps> = ({id, c, r, ry, color, spec = 0, k = 1, rotate = 0, opacity = 1}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return inkUnder(ink.w, {ellipse: {cx: c.x, cy: c.y, rx: r, ry: ry ?? r, transform: rotate ? `rotate(${fmt(rotate)} ${fmt(c.x)} ${fmt(c.y)})` : undefined}}, opacity);
  const R = Math.max(r, ry ?? r);
  const f = add(c, mul(LIGHT, R * 0.42));
  const sp = add(c, mul(LIGHT, R * 0.52));
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(R * 1.04)} fx={fmt(f.x)} fy={fmt(f.y)}>
          <stop offset="0" stopColor={lit(color, 0.34 * k)} />
          <stop offset="0.38" stopColor={lit(color, 0.08 * k)} />
          <stop offset="0.74" stopColor={color} />
          <stop offset="0.94" stopColor={shade(color, 0.34 * k)} />
          <stop offset="1" stopColor={shade(color, 0.24 * k)} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(r)} ry={fmt(ry ?? r)} fill={`url(#${id})`} transform={rotate ? `rotate(${fmt(rotate)} ${fmt(c.x)} ${fmt(c.y)})` : undefined} />
      {spec > 0 && <ellipse cx={fmt(sp.x)} cy={fmt(sp.y)} rx={fmt(R * 0.2)} ry={fmt(R * 0.12)} transform={`rotate(-38 ${fmt(sp.x)} ${fmt(sp.y)})`} fill="#FFFFFF" opacity={spec} />}
    </g>
  );
};

type BlobProps = {
  id: string;
  d: string;
  /** centre and radius of the radial shading */
  c: V;
  r: number;
  color: string;
  k?: number;
  /** how far toward the light the bright spot sits (0..1 of r) */
  focal?: number;
  opacity?: number;
  /** optional explicit stops [offset, colour][] */
  stops?: [number, string][];
};

/** Arbitrary filled path with radial "ball" shading (heads, torsos, organs, canopies). */
export const Blob: React.FC<BlobProps> = ({id, d, c, r, color, k = 1, focal = 0.45, opacity = 1, stops}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return inkUnder(ink.w, {d}, opacity);
  const f = add(c, mul(LIGHT, r * focal));
  const st: [number, string][] = stops ?? [
    [0, lit(color, 0.32 * k)],
    [0.42, lit(color, 0.06 * k)],
    [0.78, color],
    [1, shade(color, 0.32 * k)],
  ];
  return (
    <g opacity={opacity}>
      <defs>
        <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={fmt(c.x)} cy={fmt(c.y)} r={fmt(r)} fx={fmt(f.x)} fy={fmt(f.y)}>
          {st.map(([o, col], i) => (
            <stop key={i} offset={o} stopColor={col} />
          ))}
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${id})`} />
    </g>
  );
};

type LinProps = {
  id: string;
  d: string;
  from: V;
  to: V;
  stops: [number, string, number?][];
  opacity?: number;
};

/** Arbitrary path with a linear gradient between two points (planar surfaces, skin layers, UI glass). */
export const Lin: React.FC<LinProps> = ({id, d, from, to, stops, opacity = 1}) => {
  const ink = useInk();
  if (ink.pass === 'ink') return inkUnder(ink.w, {d}, opacity);
  return (
  <g opacity={opacity}>
    <defs>
      <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={fmt(from.x)} y1={fmt(from.y)} x2={fmt(to.x)} y2={fmt(to.y)}>
        {stops.map(([o, col, a], i) => (
          <stop key={i} offset={o} stopColor={col} stopOpacity={a ?? 1} />
        ))}
      </linearGradient>
    </defs>
    <path d={d} fill={`url(#${id})`} />
  </g>
  );
};

/** Soft contact / occlusion shadow: an ellipse fading from its centre (no blur filter, so it never clips). */
export const SoftShadow: React.FC<{id: string; c: V; rx: number; ry: number; alpha?: number; color?: string; rotate?: number; core?: number}> = ({
  id,
  c,
  rx,
  ry,
  alpha = 0.32,
  color = '#1B2E1E',
  rotate = 0,
  core = 0.25,
}) => useInk().pass === 'ink' ? null : (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={alpha} />
        <stop offset={core} stopColor={color} stopOpacity={alpha * 0.85} />
        <stop offset="0.7" stopColor={color} stopOpacity={alpha * 0.3} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx)} ry={fmt(ry)} fill={`url(#${id})`} transform={rotate ? `rotate(${fmt(rotate)} ${fmt(c.x)} ${fmt(c.y)})` : undefined} />
  </g>
);

/** Local light pool (coloured glow that lights adjacent skin/casing). Additive look via screen blend. */
export const Glow: React.FC<{id: string; c: V; r: number; color: string; alpha?: number; ry?: number; blend?: 'screen' | 'normal'}> = ({
  id,
  c,
  r,
  color,
  alpha = 0.6,
  ry,
  blend = 'screen',
}) => useInk().pass === 'ink' ? null : (
  <g style={{mixBlendMode: blend}}>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={alpha} />
        <stop offset="0.35" stopColor={color} stopOpacity={alpha * 0.55} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(r)} ry={fmt(ry ?? r)} fill={`url(#${id})`} />
  </g>
);

/** Sharp-edged specular highlight (high opacity white shape). */
export const Spec: React.FC<{c: V; rx: number; ry: number; rotate?: number; opacity?: number}> = ({c, rx, ry, rotate = -35, opacity = 0.85}) => useInk().pass === 'ink' ? null : (
  <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx)} ry={fmt(ry)} transform={`rotate(${fmt(rotate)} ${fmt(c.x)} ${fmt(c.y)})`} fill="#FFFFFF" opacity={opacity} />
);

/** Glossy highlight: crisp white core plus a soft halo, for the shiny 2.5D finish (hair, cheeks, shoes, plastic). */
export const Gloss: React.FC<{id: string; c: V; rx: number; ry: number; rotate?: number; opacity?: number}> = ({id, c, rx, ry, rotate = -35, opacity = 0.9}) =>
  useInk().pass === 'ink' ? null : (
    <g transform={`rotate(${fmt(rotate)} ${fmt(c.x)} ${fmt(c.y)})`}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55 * opacity} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx * 2.1)} ry={fmt(ry * 2.4)} fill={`url(#${id})`} />
      <ellipse cx={fmt(c.x)} cy={fmt(c.y)} rx={fmt(rx)} ry={fmt(ry)} fill="#FFFFFF" opacity={opacity} />
    </g>
  );

export {rgba};
