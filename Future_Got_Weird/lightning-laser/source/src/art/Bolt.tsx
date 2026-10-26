// The discharge, the beam and the channel, drawn in site-world coordinates. Stroke widths are given in screen pixels
// and divided by the camera zoom, so the bolt keeps a readable core from the wide shot to the 12x close-up.
import React from 'react';
import {clamp, fmt, V} from '../dc/math';
import {axisPt, BOLT, Branch, EXIT_H, G, NRM, Pt, U} from '../world/site';

const pathTo = (pts: Pt[], s: number) => {
  if (s <= 0 || pts.length < 2) return '';
  let d = `M${fmt(pts[0].x)},${fmt(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    if (b.s <= s) d += `L${fmt(b.x)},${fmt(b.y)}`;
    else {
      const u = (s - a.s) / (b.s - a.s || 1);
      d += `L${fmt(a.x + (b.x - a.x) * u)},${fmt(a.y + (b.y - a.y) * u)}`;
      break;
    }
  }
  return d;
};
export const tipAt = (pts: Pt[], s: number): V => {
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].s >= s) {
      const a = pts[i - 1], b = pts[i];
      const u = clamp((s - a.s) / (b.s - a.s || 1));
      return {x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u};
    }
  }
  return pts[pts.length - 1];
};

/** zoom-aware width: screen px that grow gently with zoom, as world units */
const ww = (px: number, z: number) => (px * Math.pow(z, 0.42)) / z;

export const Bolt: React.FC<{id: string; s: number; core: number; z: number; branchK?: number; fromS?: number}> = ({id, s, core, z, branchK = 1}) => {
  if (s <= 0) return null;
  const main = pathTo(BOLT.pts, s);
  const tip = tipAt(BOLT.pts, s);
  const growing = s < BOLT.total - 0.5;
  const br = BOLT.branches
    .map((b: Branch) => ({b, l: Math.min(b.len, (s - b.s0) * 0.55)}))
    .filter((x) => x.l > 0);
  const c = clamp(core, 0, 1.6);
  const strokes = (d: string, k: number, key: string) => (
    <g key={key}>
      <path d={d} fill="none" stroke="#6E7CFF" strokeOpacity={0.16 * c} strokeWidth={fmt(ww(40 * k, z))} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#B9C8FF" strokeOpacity={0.42 * Math.min(1, c)} strokeWidth={fmt(ww(14 * k, z))} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={Math.min(1, 0.55 + 0.45 * c)} strokeWidth={fmt(ww(4.4 * k * (0.8 + 0.25 * c), z))} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-tg`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.25" stopColor="#D6DEFF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#7C86FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {br.map(({b, l}, i) => strokes(pathTo(b.pts, l), 0.6 * branchK, `b${i}`))}
      {strokes(main, 1, 'm')}
      {growing && <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(ww(34, z))} fill={`url(#${id}-tg)`} />}
    </g>
  );
};

/** The laser beam (an explanatory visualization of an infrared beam: a faint violet line, never a bright tube) from the
 *  optical exit up the axis, and the pulse packets travelling along it. `pulses`: positions (h along the axis). */
export const Beam: React.FC<{id: string; z: number; alpha: number; pulses?: number[]; hTop?: number; hBot?: number; pulseK?: number}> = ({id, z, alpha, pulses = [], hTop = G + 260, hBot = EXIT_H, pulseK = 1}) => {
  if (alpha <= 0.001) return null;
  const a = axisPt(hBot), b = axisPt(hTop);
  const pk = 46; // packet length (world px)
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`${id}-bm`} gradientUnits="userSpaceOnUse" x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)}>
          <stop offset="0" stopColor="#A98BFF" stopOpacity={0.55} />
          <stop offset={fmt(clamp((0 - hBot) / (hTop - hBot)))} stopColor="#B49BFF" stopOpacity={0.75} />
          <stop offset="1" stopColor="#A98BFF" stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={`url(#${id}-bm)`} strokeOpacity={alpha} strokeWidth={fmt(ww(5, z))} strokeLinecap="round" />
      <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke={`url(#${id}-bm)`} strokeOpacity={alpha * 0.28} strokeWidth={fmt(ww(18, z))} strokeLinecap="round" />
      {pulses
        .filter((h) => h > hBot - pk && h < hTop)
        .map((h, i) => {
          const p = axisPt(Math.max(hBot, h - pk)), q = axisPt(Math.min(hTop, h));
          const fade = clamp((hTop - h) / 120);
          return (
            <g key={i} opacity={alpha * fade * pulseK}>
              <line x1={fmt(p.x)} y1={fmt(p.y)} x2={fmt(q.x)} y2={fmt(q.y)} stroke="#C7B4FF" strokeOpacity={0.35} strokeWidth={fmt(ww(26, z))} strokeLinecap="round" />
              <line x1={fmt(p.x)} y1={fmt(p.y)} x2={fmt(q.x)} y2={fmt(q.y)} stroke="#EEE6FF" strokeWidth={fmt(ww(7, z))} strokeLinecap="round" />
            </g>
          );
        })}
    </g>
  );
};

/** The heated, partly ionised channel above the tower tip (cyan haze bounded by ordinary air). `grow` 0..1 extends it
 *  up from the tip (the payoff shot); `alpha` its strength. */
export const Channel: React.FC<{id: string; z: number; alpha: number; grow?: number; halfW?: number; boost?: number}> = ({id, z, alpha, grow = 1, halfW = 7, boost = 0}) => {
  if (alpha <= 0.001 || grow <= 0) return null;
  const h1 = -8 + (G + 40) * grow;
  const a = axisPt(-8), b = axisPt(h1);
  const w = Math.max(halfW * (1 + 0.8 * boost), ww(5 + 10 * boost, z));
  const corners = [axisPt(-8, -w), axisPt(h1, -w), axisPt(h1, w), axisPt(-8, w)];
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <linearGradient id={`${id}-cx`} gradientUnits="userSpaceOnUse" x1={fmt(axisPt(0, -w).x)} y1={fmt(axisPt(0, -w).y)} x2={fmt(axisPt(0, w).x)} y2={fmt(axisPt(0, w).y)}>
          <stop offset="0" stopColor="#3FD7E6" stopOpacity={0} />
          <stop offset="0.5" stopColor="#7FF0F5" stopOpacity={0.55} />
          <stop offset="1" stopColor="#3FD7E6" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`${id}-cy`} gradientUnits="userSpaceOnUse" x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)}>
          <stop offset="0" stopColor="#FFF" stopOpacity={0} />
          <stop offset="0.06" stopColor="#FFF" stopOpacity={1} />
          <stop offset="0.85" stopColor="#FFF" stopOpacity={1} />
          <stop offset="1" stopColor="#FFF" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-cm`}>
          <path d={`M${corners.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`} fill={`url(#${id}-cy)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-cm)`}>
        <path d={`M${corners.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')} Z`} fill={`url(#${id}-cx)`} opacity={alpha * (1 + boost)} />
        {boost > 0 && <line x1={fmt(a.x)} y1={fmt(a.y)} x2={fmt(b.x)} y2={fmt(b.y)} stroke="#B8FBFF" strokeOpacity={0.7 * boost * alpha} strokeWidth={fmt(ww(4, z))} strokeLinecap="round" />}
      </g>
    </g>
  );
};

/** the axis normal, for drawings that sit beside the axis (the measurement bracket) */
export const axisSide = (h: number, off: number) => axisPt(h, off);
export {U, NRM};
