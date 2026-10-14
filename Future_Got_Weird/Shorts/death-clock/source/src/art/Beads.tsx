// Nano-sensor beads: glowing spheres with a crisp highlight and a short tapered wake pointing back along
// their motion (directed, "heat-seeking" travel; no rockets, flames or explosions).
// Paths are sampled polylines; every bead position is a pure function of the frame.
import React from 'react';
import {PAL} from '../lib/color';
import {add, clamp, fmt, len, mul, norm, sub, V} from '../lib/math';

export type Path = V[];

export const pathLength = (p: Path) => p.slice(1).reduce((a, q, i) => a + len(sub(q, p[i])), 0);

/** Point and unit tangent at fraction t (0..1) along a polyline. */
export const pathAt = (p: Path, t: number): {pt: V; dir: V} => {
  const L = pathLength(p);
  let d = clamp(t) * L;
  for (let i = 0; i < p.length - 1; i++) {
    const seg = len(sub(p[i + 1], p[i]));
    if (d <= seg || i === p.length - 2) {
      const k = seg ? Math.min(1, d / seg) : 0;
      return {pt: add(p[i], mul(sub(p[i + 1], p[i]), k)), dir: norm(sub(p[i + 1], p[i]))};
    }
    d -= seg;
  }
  return {pt: p[p.length - 1], dir: {x: 1, y: 0}};
};

/** Catmull-Rom resample of control points into a smooth polyline. */
export const smoothPath = (ctrl: V[], steps = 12): Path => {
  const out: V[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
};

/** Gradient definitions shared by every bead in one scene (one set of ids per scene). */
export const BeadDefs: React.FC<{id: string; color?: string}> = ({id, color = PAL.signal}) => (
  <defs>
    <radialGradient id={`${id}-core`} cx="0.38" cy="0.34" r="0.7">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.35" stopColor="#D8F6FF" />
      <stop offset="0.75" stopColor={color} />
      <stop offset="1" stopColor={PAL.signalDeep} />
    </radialGradient>
    <radialGradient id={`${id}-halo`}>
      <stop offset="0" stopColor={color} stopOpacity={0.55} />
      <stop offset="1" stopColor={color} stopOpacity={0} />
    </radialGradient>
    <linearGradient id={`${id}-wake`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={color} stopOpacity={0} />
      <stop offset="1" stopColor={color} stopOpacity={0.75} />
    </linearGradient>
  </defs>
);

/** One bead. `dir` is its direction of travel (the wake trails behind). */
export const Bead: React.FC<{id: string; p: V; r: number; dir?: V; wake?: number; halo?: number; opacity?: number}> = ({id, p, r, dir, wake = 0, halo = 1, opacity = 1}) => {
  const ang = dir ? (Math.atan2(dir.y, dir.x) * 180) / Math.PI : 0;
  return (
    <g opacity={opacity}>
      {halo > 0 && <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r * 2.6)} fill={`url(#${id}-halo)`} opacity={halo} />}
      {dir && wake > 0 && (
        <path
          d={`M${fmt(-r * wake)},0 L${fmt(-r * 0.2)},${fmt(-r * 0.62)} L${fmt(-r * 0.2)},${fmt(r * 0.62)} Z`}
          transform={`translate(${fmt(p.x)} ${fmt(p.y)}) rotate(${fmt(ang)})`}
          fill={`url(#${id}-wake)`}
        />
      )}
      <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r)} fill={`url(#${id}-core)`} />
      <ellipse cx={fmt(p.x - r * 0.32)} cy={fmt(p.y - r * 0.36)} rx={fmt(r * 0.3)} ry={fmt(r * 0.2)} transform={`rotate(-35 ${fmt(p.x - r * 0.32)} ${fmt(p.y - r * 0.36)})`} fill="#FFFFFF" opacity={0.95} />
    </g>
  );
};

/** Tiny stream particle (the "thousands"): a dot with a soft halo, no wake. Cheap. */
export const Dot: React.FC<{p: V; r: number; opacity?: number; color?: string}> = ({p, r, opacity = 1, color = '#BDF1FF'}) => (
  <circle cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(r)} fill={color} opacity={opacity} />
);
