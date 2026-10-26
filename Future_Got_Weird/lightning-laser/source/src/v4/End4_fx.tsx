// V4 H: the prepared air building upward from the rod tip, and the exit window's light in the wide.
//   ChannelGrow4  V3's ChannelGrow with V3 finding GH-1 fixed: V3 drew its growing front as a fixed-size round glow
//                 (up to 225 x 112 px in H1's close view) and blurred a short ribbon by a fixed amount, so for the
//                 first frames (877-884) the channel was a soft round blob. Here every part is sized by the grown
//                 length: the band grows from the tip along the axis, its blur and its brighter front never wider
//                 than the band nor longer than what has grown, and its leading end is feathered along the axis.
//   ExitGlow4     the telescope's exit in a wide view, where the (physically sized) telescope is small: a local cyan
//                 glow with a minimum screen size, brightening as each packet leaves (V3 palette, no flash)
import React from 'react';
import {clamp, fmt} from '../dc/math';
import {ss} from '../lib';
import {axis3, Cam3, EXIT3, projector, Proj, V3} from '../v2/p3';
import {PAL} from '../v3/palette';
import {EV} from '../v3/timeline3';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
const CH_H0 = -10; // axis height level with the rod tip (0.15 m beside it)
/** a ribbon along a projected polyline, its half-width w(i) per point */
const ribbon = (q: Proj[], w: (p: Proj, i: number) => number) => {
  if (q.length < 2) return '';
  const L: Pt[] = [], R: Pt[] = [];
  q.forEach((p, i) => {
    const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1;
    const h = w(p, i);
    L.push({x: p.x - (dy / n) * h, y: p.y + (dx / n) * h});
    R.push({x: p.x + (dy / n) * h, y: p.y - (dx / n) * h});
  });
  return `${line([...L, ...R.reverse()])} Z`;
};

/** wS widens the band and gain strengthens it (a wide view, where the channel is small on screen) */
export const ChannelGrow4: React.FC<{cam: Cam3; t: number; top: number; id: string; k?: number; wS?: number; gain?: number}> = ({cam, t, top, id, k = 1, wS = 1, gain = 1}) => {
  if (top <= CH_H0 + 0.5 || k <= 0.002) return null;
  const P = projector(cam);
  const f = cam.f;
  const n = 34;
  const pts: V3[] = Array.from({length: n}, (_, i) => axis3(CH_H0 + ((top - CH_H0) * i) / (n - 1)));
  const pp = pts.map(P).filter((q) => q.ok);
  if (pp.length < 2) return null;
  const base = pp[0], end = pp[pp.length - 1];
  const len = Math.hypot(end.x - base.x, end.y - base.y);
  // the band's full width at its depth (as V3's ChannelGrow body), but never wider than ~0.45 of what has grown, so a
  // short channel is a short band, not a disc; it tapers to a point at the tip
  const wFull = (p: Proj) => clamp((f * 2.2 * wS) / Math.max(p.z, 0.5), 10 * wS, 220);
  // (a short channel is a narrow band: about a quarter as wide as it is long until it reaches its full width)
  const cap = 0.26 * len + 3;
  const taper = (i: number) => ss(i, 0, 3);
  const body = ribbon(pp, (p, i) => (Math.min(wFull(p), cap) / 2) * (0.35 + 0.65 * taper(i)));
  const core = ribbon(pp, (p, i) => (Math.min(wFull(p) * 0.32, cap * 0.32) / 2) * (0.35 + 0.65 * taper(i)));
  // blur scaled to the band (V3: up to 24 px whatever the band's length)
  const wMid = Math.min(wFull(pp[Math.floor(pp.length / 2)]), cap);
  const blur = clamp(Math.min(f / 100, 0.14 * wMid), 1.2, 24);
  // the growing front: the newest part a little brighter, a band segment (not a ring) behind the leading end
  const growing = clamp(1 - ss(t, 30.6, 31.0));
  // a young channel is a little stronger (so the first metres read as a band leaving the tip)
  const young = 1 + 0.6 * (1 - ss(len, 150, 500));
  const lead = ribbon(pp.slice(Math.floor(pp.length * 0.62)), (p) => Math.min(wFull(p) * 0.72, cap * 0.72) / 2);
  // the leading end feathered along the axis (a linear fade over its last ~22%), so the front is soft without a cap
  const fx0 = base.x + (end.x - base.x) * 0.78, fy0 = base.y + (end.y - base.y) * 0.78;
  const baseK = ss(t, EV.channelExtends, EV.channelExtends + 0.4);
  const rB = Math.min(clamp((f * 2.2) / Math.max(base.z, 1), 16, 120), 0.5 * wMid + 4);
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={k}>
      <defs>
        <filter id={`${id}-b`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={fmt(blur)} />
        </filter>
        <linearGradient id={`${id}-fd`} gradientUnits="userSpaceOnUse" x1={fmt(fx0)} y1={fmt(fy0)} x2={fmt(end.x)} y2={fmt(end.y)}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${id}-fd)`} />
        </mask>
        <radialGradient id={`${id}-fr`}>
          <stop offset="0" stopColor={PAL.channelEdge} stopOpacity={0.6} />
          <stop offset="0.45" stopColor={PAL.channel} stopOpacity={0.25} />
          <stop offset="1" stopColor={PAL.channel} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g mask={`url(#${id}-m)`}>
        <path d={body} fill={PAL.channel} fillOpacity={clamp(0.2 * gain * young)} filter={`url(#${id}-b)`} />
        <path d={core} fill={PAL.channelEdge} fillOpacity={clamp(0.14 * gain)} filter={`url(#${id}-b)`} />
        {lead && growing > 0.02 && <path d={lead} fill={PAL.channelEdge} fillOpacity={0.16 * growing * Math.min(1, gain)} filter={`url(#${id}-b)`} />}
      </g>
      {base.ok && baseK > 0.01 && <circle cx={fmt(base.x)} cy={fmt(base.y)} r={fmt(rB)} fill={`url(#${id}-fr)`} opacity={0.5 * baseK} />}
    </g>
  );
};

/** the exit window's glow with a minimum screen radius (wide views), brightening on each packet's departure */
export const ExitGlow4: React.FC<{cam: Cam3; k: number; tick: number; id: string}> = ({cam, k, tick, id}) => {
  if (k <= 0.01) return null;
  const e = projector(cam)(EXIT3);
  if (!e.ok) return null;
  const r = Math.max(46, (cam.f * 1.6) / Math.max(e.z, 1)) * (1 + 0.35 * clamp(tick));
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id={`${id}-eg`}>
          <stop offset="0" stopColor={PAL.packet} stopOpacity={0.9} />
          <stop offset="0.25" stopColor={PAL.laser} stopOpacity={0.45} />
          <stop offset="1" stopColor={PAL.laserGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={fmt(e.x)} cy={fmt(e.y)} r={fmt(r)} fill={`url(#${id}-eg)`} opacity={fmt(clamp(k * (0.55 + 0.45 * clamp(tick))))} />
    </g>
  );
};
