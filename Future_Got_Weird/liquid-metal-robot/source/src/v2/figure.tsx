// The cast gallium figure: a small LEGO-like humanoid (about 1.7 cm), as in the MPTM demo. One set of part outlines
// in the figure's own centimetres (u right, v up from the soles) serves three uses: the solid art (matte, grainy,
// gradient shaded, ink contour), the melting liquid (the same outlines, deformed, fed to the goo layer) and the
// figure-shaped cavity of the mould.
import React from 'react';
import {lit, mix, shade} from '../shared/color';
import {Deco, Inked, InkPath} from '../shared/ink';
import {closedPath} from '../shared/lib';

export type P2 = {x: number; y: number};
export const FIG_H = 1.7;
export const FIG_T = 0.24; // thickness (front face to back face)

const rrect = (cx: number, cy: number, w: number, h: number, r: number, n = 4): P2[] => {
  const out: P2[] = [];
  const corners: [number, number, number][] = [
    [cx + w / 2 - r, cy + h / 2 - r, 0],
    [cx - w / 2 + r, cy + h / 2 - r, 90],
    [cx - w / 2 + r, cy - h / 2 + r, 180],
    [cx + w / 2 - r, cy - h / 2 + r, 270],
  ];
  for (const [x, y, a0] of corners)
    for (let i = 0; i <= n; i++) {
      const a = ((a0 + (90 * i) / n) * Math.PI) / 180;
      out.push({x: x + r * Math.cos(a), y: y + r * Math.sin(a)});
    }
  return out;
};
/** a polygon with rounded corners (sampled) */
const rpoly = (pts: P2[], r: number, n = 3): P2[] => {
  const out: P2[] = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N];
    const a = {x: p0.x - p1.x, y: p0.y - p1.y}, b = {x: p2.x - p1.x, y: p2.y - p1.y};
    const la = Math.hypot(a.x, a.y), lb = Math.hypot(b.x, b.y);
    const s = {x: p1.x + (a.x / la) * r, y: p1.y + (a.y / la) * r};
    const e = {x: p1.x + (b.x / lb) * r, y: p1.y + (b.y / lb) * r};
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      // quadratic corner through p1
      out.push({x: (1 - u) * (1 - u) * s.x + 2 * (1 - u) * u * p1.x + u * u * e.x, y: (1 - u) * (1 - u) * s.y + 2 * (1 - u) * u * p1.y + u * u * e.y});
    }
  }
  return out;
};
const capsule = (a: P2, b: P2, ra: number, rb: number, n = 7): P2[] => {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const out: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const t = ang + Math.PI / 2 + (Math.PI * i) / n;
    out.push({x: a.x + ra * Math.cos(t), y: a.y + ra * Math.sin(t)});
  }
  for (let i = 0; i <= n; i++) {
    const t = ang - Math.PI / 2 + (Math.PI * i) / n;
    out.push({x: b.x + rb * Math.cos(t), y: b.y + rb * Math.sin(t)});
  }
  return out;
};
const mirror = (p: P2[]) => p.map((q) => ({x: -q.x, y: q.y})).reverse();

export type Part = {name: string; pts: P2[]; arm?: boolean; tone?: number};
const legL = rpoly([{x: -0.29, y: 0.68}, {x: -0.03, y: 0.68}, {x: -0.035, y: 0.1}, {x: -0.28, y: 0.1}], 0.03);
const footL = rrect(-0.165, 0.065, 0.31, 0.13, 0.045);
const armL = capsule({x: -0.385, y: 1.1}, {x: -0.47, y: 0.76}, 0.088, 0.078);
const handL = rrect(-0.48, 0.67, 0.15, 0.15, 0.07);
export const PARTS: Part[] = [
  {name: 'legL', pts: legL, tone: -0.04},
  {name: 'legR', pts: mirror(legL), tone: -0.04},
  {name: 'footL', pts: footL, tone: -0.06},
  {name: 'footR', pts: mirror(footL), tone: -0.06},
  {name: 'hips', pts: rrect(0, 0.71, 0.6, 0.13, 0.04), tone: -0.08},
  {name: 'torso', pts: rpoly([{x: -0.37, y: 1.19}, {x: 0.37, y: 1.19}, {x: 0.29, y: 0.73}, {x: -0.29, y: 0.73}], 0.06), tone: 0},
  {name: 'neck', pts: rrect(0, 1.21, 0.22, 0.1, 0.03), tone: -0.1},
  {name: 'head', pts: rrect(0, 1.44, 0.46, 0.42, 0.13, 5), tone: 0.03},
  {name: 'stud', pts: rrect(0, 1.655, 0.18, 0.06, 0.022), tone: 0.02},
  {name: 'armL', pts: armL, arm: true, tone: -0.02},
  {name: 'armR', pts: mirror(armL), arm: true, tone: -0.02},
  {name: 'handL', pts: handL, arm: true, tone: -0.03},
  {name: 'handR', pts: mirror(handL), arm: true, tone: -0.03},
];

/** the melt deformation: s = slump 0..1 (standing .. puddle), t for the surface wobble */
export const meltDeform = (p: P2, arm: boolean, s: number, t: number): P2 => {
  if (s <= 0) return p;
  let u = p.x;
  if (arm) u *= 1 - 0.3 * s;
  const k = 1 - 0.86 * Math.pow(s, 1.1);
  const v = p.y * k;
  const Hs = FIG_H * k;
  const low = 1 - Math.min(1, v / Hs);
  u = u * (1 + 1.25 * s * low * low + 0.25 * s);
  const wob = 0.022 * s * (1 - 0.6 * s);
  return {x: u + wob * Math.sin(7.5 * t + 9 * p.y), y: v + wob * 0.5 * Math.sin(6 * t + 11 * p.x)};
};

export const partPath = (pts: P2[]) => closedPath(pts, 0.6);

const BASE = '#8794A1';
/** the solid figure art, drawn in its own centimetres: wrap it in a <g transform="matrix(...)"> that maps (u, v) to
 *  the screen. `sweep` is the screen-projected thickness (back face offset) in the same local units. */
export const FigureArt: React.FC<{
  id: string;
  parts: {name: string; pts: P2[]; tone?: number}[];
  sweep: P2;
  ink: number;
  grain?: number;
  /** extra warm tint (heating) 0..1 */
  warm?: number;
}> = ({id, parts, sweep, ink, grain = 1, warm = 0}) => {
  const base = warm > 0 ? mix(BASE, '#C9A88A', 0.35 * warm) : BASE;
  const top = mix(lit(base, 0.2), '#9FB3BE', 0.2);
  const steps = 8;
  const sk = 0.38;
  const sw = Math.hypot(sweep.x, sweep.y) > 0.004;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-lg`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={lit(base, 0.42)} />
          <stop offset="0.35" stopColor={lit(base, 0.1)} />
          <stop offset="0.7" stopColor={mix(base, '#7E97A6', 0.3)} />
          <stop offset="1" stopColor={shade(base, 0.5)} />
        </linearGradient>
        <linearGradient id={`${id}-tg`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={lit(top, 0.3)} />
          <stop offset="1" stopColor={shade(top, 0.25)} />
        </linearGradient>
        <linearGradient id={`${id}-env`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.26" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="0.33" stopColor="#FFFFFF" stopOpacity={0.2} />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <pattern id={`${id}-br`} patternUnits="userSpaceOnUse" width="0.05" height="0.6">
          <line x1="0.012" y1="0" x2="0.012" y2="0.6" stroke="#FFFFFF" strokeWidth="0.006" opacity="0.16" />
          <line x1="0.034" y1="0" x2="0.034" y2="0.6" stroke="#2A3540" strokeWidth="0.005" opacity="0.14" />
        </pattern>
        <pattern id={`${id}-gr`} patternUnits="userSpaceOnUse" width="0.41" height="0.37">
          {GRAIN.map((g, i) => (
            <circle key={i} cx={g[0]} cy={g[1]} r={g[2]} fill={g[3] ? '#E8ECEF' : '#3E4852'} opacity={g[3] ? 0.14 : 0.24} />
          ))}
        </pattern>
      </defs>
      <Inked w={ink}>
        {sw &&
          parts.map((p) =>
            Array.from({length: steps}, (_, k) => {
              const f = ((k + 1) / steps) * sk;
              return <InkPath key={`${p.name}-s${k}`} d={partPath(p.pts)} fill={top} transform={`translate(${(sweep.x * f).toFixed(4)} ${(sweep.y * f).toFixed(4)})`} />;
            }),
          )}
        {sw && (
          <Deco>
            {parts.map((p) => (
              <path key={`tg-${p.name}`} d={partPath(p.pts)} fill={`url(#${id}-gr)`} opacity={grain} transform={`translate(${(sweep.x * sk).toFixed(4)} ${(sweep.y * sk).toFixed(4)})`} />
            ))}
          </Deco>
        )}
        {parts.map((p) => (
          <InkPath key={p.name} d={partPath(p.pts)} fill={p.tone ? (p.tone > 0 ? `url(#${id}-lg)` : `url(#${id}-lg)`) : `url(#${id}-lg)`} />
        ))}
        <Deco>
          {parts.map((p) => (
            <path key={`g-${p.name}`} d={partPath(p.pts)} fill={`url(#${id}-gr)`} opacity={grain} />
          ))}
          {parts.map((p) => (p.tone && p.tone < 0 ? <path key={`d-${p.name}`} d={partPath(p.pts)} fill="#24313D" opacity={-p.tone * 1.6} /> : null))}
          {parts.map((p) => (
            <path key={`e-${p.name}`} d={partPath(p.pts)} fill={`url(#${id}-env)`} />
          ))}
          {parts.map((p) => (
            <path key={`c-${p.name}`} d={partPath(p.pts)} fill="none" stroke="#17222C" strokeWidth={ink * 0.42} strokeOpacity={0.55} strokeLinejoin="round" />
          ))}
        </Deco>
      </Inked>
    </g>
  );
};

// deterministic grain specks [x, y, r, light]
const GRAIN: [number, number, number, number][] = (() => {
  const out: [number, number, number, number][] = [];
  let s = 7;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  for (let i = 0; i < 90; i++) out.push([rnd() * 0.41, rnd() * 0.37, 0.003 + rnd() * 0.0035, rnd() > 0.5 ? 1 : 0]);
  return out;
})();

/** soft sheen strips on the solid figure (left edges catch the key light) */
export const FigureSheen: React.FC<{parts: {name: string; pts: P2[]}[]; a: number}> = ({parts, a}) => (a <= 0 ? null :
  <Deco>
    {parts
      .filter((p) => ['torso', 'head', 'legL', 'legR', 'armL', 'armR'].includes(p.name))
      .map((p) => {
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (const q of p.pts) {
          x0 = Math.min(x0, q.x);
          x1 = Math.max(x1, q.x);
          y0 = Math.min(y0, q.y);
          y1 = Math.max(y1, q.y);
        }
        const cx = x0 + (x1 - x0) * 0.2, cy = y0 + (y1 - y0) * 0.58;
        return <ellipse key={p.name} cx={cx} cy={cy} rx={(x1 - x0) * 0.045} ry={(y1 - y0) * 0.32} fill="#FFFFFF" opacity={a * 0.13} />;
      })}
  </Deco>
);
