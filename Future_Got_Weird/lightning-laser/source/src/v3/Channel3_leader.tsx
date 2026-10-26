// V3 beat E: the electrical leader in the prepared channel (micro units, axis x = 0, up = -y; see Channel3_field.tsx).
// A stepped leader: the tip holds, then jumps one step up the channel (each new step flashes), so its path develops
// as a slightly irregular zig-zag that stays inside the low-density channel. Now and then a side probe pokes out into
// ordinary air, grows a little, stalls and fades. White core, violet edges (palette.ts).
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {PAL} from './palette';

/** t0: the first step; y0: where the path starts (below the frame); entry: the first stroke's length (it runs in
 *  from below the frame in one go), then n regular steps; yBase: the path already laid below y0 (it comes up the
 *  channel from far below, so neither end of it shows when the view widens) */
export type LeaderSpec = {t0: number; y0: number; chW: number; n: number; entry: number; yBase?: number; stepL?: number};
type Vtx = {x: number; y: number};
type Probe = {k: number; side: number; pts: Vtx[]; t: number};
export type Leader = {times: number[]; ys: number[]; durs: number[]; verts: Vtx[][]; tail: Vtx[]; probes: Probe[]; spec: LeaderSpec};

/** the step schedule and the path (deterministic, built once) */
export const buildLeader = (spec: LeaderSpec): Leader => {
  const {t0, y0, chW, n, entry} = spec;
  const times: number[] = [t0];
  const ys: number[] = [y0];
  const durs: number[] = [];
  for (let k = 0; k < n; k++) {
    const L = k === 0 ? entry : (100 + 52 * hash(k, 43)) * (spec.stepL ?? 1);
    const dur = 0.034 * Math.max(1, L / 140); // each step draws on in about a frame; the entry stroke a little longer
    durs.push(dur);
    times.push(times[k] + (k === 0 ? dur + 0.05 : 0.072 + 0.046 * hash(k, 41)));
    ys.push(ys[k] - L);
  }
  // the step end points wander a little about the axis (within ~0.4 of the channel half-width); each step is drawn
  // as two or three straight pieces, so the path is a crisp, slightly irregular zig-zag
  const xAt = (k: number) => chW * (0.3 * noise1(k * 0.42, 51) + 0.1 * (hash(k, 53) - 0.5));
  const verts: Vtx[][] = [];
  for (let k = 0; k < n; k++) {
    const a = {x: xAt(k), y: ys[k]}, b = {x: xAt(k + 1), y: ys[k + 1]};
    if (k === 0) {
      // the entry stroke: a few kinks along its length
      const pts: Vtx[] = [a];
      const m = Math.max(2, Math.round(entry / 110));
      for (let i = 1; i < m; i++) pts.push({x: a.x + (b.x - a.x) * (i / m) + chW * 0.18 * (hash(i, 59) - 0.5), y: a.y + (b.y - a.y) * (i / m)});
      pts.push(b);
      verts.push(pts);
      continue;
    }
    const m1 = {x: a.x + (b.x - a.x) * 0.4 + chW * 0.16 * (hash(k, 55) - 0.5), y: a.y + (b.y - a.y) * 0.4};
    const m2 = {x: a.x + (b.x - a.x) * 0.72 + chW * 0.1 * (hash(k, 57) - 0.5), y: a.y + (b.y - a.y) * 0.72};
    verts.push([a, m1, m2, b]);
  }
  // side probes into ordinary air: from a step's end point, out and slightly up, past the channel edge, then stall
  const probes: Probe[] = [];
  const at = [4, 8, 12, 15, 19];
  at.forEach((k, i) => {
    if (k >= n) return;
    const side = i % 2 ? -1 : 1;
    const base = verts[k][3];
    const pts: Vtx[] = [base];
    const reach = chW * (1.25 + 0.35 * hash(k, 61)) - side * base.x;
    let p = base;
    for (let s = 0; s < 4; s++) {
      const ang = ((58 + 22 * hash(k * 5 + s, 63)) * Math.PI) / 180; // from the axis
      const L = reach / 4 / Math.sin(ang);
      p = {x: p.x + side * Math.sin(ang) * L, y: p.y - Math.cos(ang) * L + 14 * (hash(k * 7 + s, 65) - 0.5)};
      pts.push(p);
    }
    probes.push({k, side, pts, t: times[k + 1]});
  });
  // the part already laid below the first stroke (straight pieces about 120 long, wandering a little)
  const tail: Vtx[] = [];
  if (spec.yBase !== undefined && spec.yBase > y0) {
    const m = Math.max(1, Math.round((spec.yBase - y0) / 120));
    for (let i = m; i >= 1; i--) tail.push({x: chW * (0.28 * noise1(i * 0.37, 67) + 0.08 * (hash(i, 69) - 0.5)), y: y0 + ((spec.yBase - y0) * i) / m});
  }
  return {times, ys, durs, verts, tail, probes, spec};
};

const path = (pts: Vtx[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
/** the drawn part of a polyline: the first u (0..1) of its length */
const partial = (pts: Vtx[], u: number): Vtx[] => {
  if (u >= 1) return pts;
  const seg = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const tot = seg.reduce((a, b) => a + b, 0);
  let left = u * tot;
  const out: Vtx[] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) { out.push(pts[i + 1]); left -= seg[i]; continue; }
    const f = left / (seg[i] || 1);
    out.push({x: pts[i].x + (pts[i + 1].x - pts[i].x) * f, y: pts[i].y + (pts[i + 1].y - pts[i].y) * f});
    break;
  }
  return out;
};

/** the leader at film time t, drawn in micro units inside the camera group (z: screen px per unit); a = opacity;
 *  live (0..1): the growing tip (its glow, probing streamers and step flashes; 0 once the crackle has ended);
 *  after (0..1): the afterglow, the white core and violet mid fading first while the soft violet glow lingers */
/** tr: the camera transform (micro -> screen); the leader is drawn through it, and its blurred glow is filtered in
 *  screen space (a filter region in micro units can exceed the renderer's filter size limit when the view is wide) */
export const LeaderDraw: React.FC<{L: Leader; t: number; z: number; a: number; box: {x0: number; x1: number; y0: number; y1: number}; id: string; tr: string; live?: number; after?: number}> = ({L, t, z, a, box, id, tr, live = 1, after = 0}) => {
  const yMin = box.y0, yMax = box.y1;
  if (a <= 0.01 || t < L.spec.t0) return null;
  const {times, verts, durs} = L;
  // completed steps and the step being drawn (each step draws on in about one frame)
  let k = 0;
  while (k + 1 < times.length && t >= times[k + 1]) k++;
  const pts: Vtx[] = [...L.tail, verts[0][0]];
  for (let i = 0; i < Math.min(k, verts.length); i++) pts.push(...verts[i].slice(1));
  const fresh = k < verts.length ? clamp((t - times[k]) / durs[k]) : 0;
  if (k < verts.length && fresh > 0) pts.push(...partial(verts[k], fresh).slice(1));
  // cull far below the frame (keep a few vertices so the path still leaves the frame)
  const tip = pts[pts.length - 1];
  const since = t - times[k];
  const flash = Math.exp(-since / 0.06) * live; // each new step flashes
  const fr = Math.round(t * 30);
  const flick = 0.82 + 0.18 * noise1(t * 26, 71);
  const px = (p: number) => p / z;
  // the newest step (brighter), and the rest of the developed path
  const lastN = Math.min(pts.length, 4);
  const newSeg = pts.slice(pts.length - lastN);
  const probes = L.probes
    .map((p) => {
      const age = t - p.t;
      if (age < 0) return null;
      const grow = clamp(age / 0.12);
      const fade = clamp(1 - (age - 0.16) / 0.42);
      return fade > 0.01 ? {pts: partial(p.pts, grow), fade, stalled: age > 0.12} : null;
    })
    .filter((x): x is {pts: Vtx[]; fade: number; stalled: boolean} => !!x);
  // faint streamers probing ahead of the tip, a different few each frame
  const brush = Array.from({length: 4}, (_, i) => {
    if (live < 0.05 || hash(fr * 4 + i, 73) < 0.35) return null;
    const ang = ((hash(fr * 4 + i, 75) - 0.5) * 70 * Math.PI) / 180;
    const len = 40 + 55 * hash(fr * 4 + i, 77);
    const mid = {x: tip.x + Math.sin(ang) * len * 0.5 + 10 * (hash(fr * 4 + i, 79) - 0.5), y: tip.y - Math.cos(ang) * len * 0.5};
    return path([tip, mid, {x: tip.x + Math.sin(ang) * len, y: tip.y - Math.cos(ang) * len}]);
  }).filter(Boolean) as string[];
  // only the run of vertices near the frame (plus one either side, so the path still leaves it)
  const inside = (p: Vtx) => p.y > yMin - 400 && p.y < yMax + 400;
  const d = path(pts.filter((p, i) => i === pts.length - 1 || inside(p) || (i + 1 < pts.length && inside(pts[i + 1])) || (i > 0 && inside(pts[i - 1]))));
  const cA = 1 - after, mA = 1 - 0.85 * after, hA = 1 - 0.45 * after;
  return (
    <g style={{mixBlendMode: 'screen'}} opacity={fmt(a)}>
      <defs>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={11} />
        </filter>
        <radialGradient id={`${id}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.35" stopColor={PAL.mid} stopOpacity={0.45} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the violet glow: a soft (blurred) halo round the path */}
      <g filter={`url(#${id}-bl)`}>
        <g transform={tr}>
          <path d={d} fill="none" stroke={PAL.halo} strokeOpacity={fmt(0.85 * flick * hA)} strokeWidth={fmt(px(58))} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      </g>
      <g transform={tr}>
      {probes.map((p, i) => (
        <g key={`p${i}`} opacity={fmt(p.fade * (p.stalled ? 0.75 + 0.25 * noise1(t * 30 + i * 7, 81) : 1))}>
          <path d={path(p.pts)} fill="none" stroke={PAL.halo} strokeOpacity={0.34} strokeWidth={fmt(px(26))} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path(p.pts)} fill="none" stroke={PAL.mid} strokeOpacity={0.8} strokeWidth={fmt(px(7))} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path(p.pts)} fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={fmt(px(2.6))} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ))}
      {mA > 0.01 && <path d={d} fill="none" stroke={PAL.mid} strokeOpacity={fmt(0.66 * flick * mA)} strokeWidth={fmt(px(17))} strokeLinejoin="round" strokeLinecap="round" />}
      {cA > 0.01 && <path d={d} fill="none" stroke="#FFFFFF" strokeOpacity={fmt((0.8 + 0.2 * flick) * cA)} strokeWidth={fmt(px(6))} strokeLinejoin="round" strokeLinecap="round" />}
      {flash > 0.05 && (
        <g opacity={fmt(flash)}>
          <path d={path(newSeg)} fill="none" stroke={PAL.mid} strokeOpacity={0.7} strokeWidth={fmt(px(34))} strokeLinejoin="round" strokeLinecap="round" />
          <path d={path(newSeg)} fill="none" stroke="#FFFFFF" strokeWidth={fmt(px(9))} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )}
      {brush.length > 0 && <path d={brush.join(' ')} fill="none" stroke={PAL.mid} strokeOpacity={fmt(0.6 * live)} strokeWidth={fmt(px(2.8))} strokeLinecap="round" strokeLinejoin="round" />}
      {live > 0.01 && <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(px(95 + 35 * flash))} fill={`url(#${id}-tip)`} opacity={fmt(live)} />}
      {live > 0.01 && <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(px(8))} fill="#FFFFFF" opacity={fmt(live)} />}
      </g>
    </g>
  );
};
