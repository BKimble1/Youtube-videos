// V5 beat G: the strike on the house's rod (house-local metres, Rod3_cam.ts hw), and the current it sends down the
// conductor.
//   StrikeBolt5     the downward stepped leader comes out of the storm deck far beyond the house and steps down to
//                   the rod in jagged runs, its branches forking downward and stalling (they show it came from above);
//                   near the end a short streamer leaps up from the metal tip and meets it just above the tip. Then the
//                   return stroke: the whole channel, cloud to metal tip, white with violet edges; it holds and fades
//                   (illustrative slow motion), the branches first. Its vertices are placed evenly on screen from the
//                   wide (the far top is foreshortened, so its 3D steps are long; near the house they are short).
//   ConductorCurrent5  the current down the metal: a bright head runs from the rod tip down the mast, the roof edge,
//                   round the eave and down the wall to the earth clamp, the metal behind it glowing; at the clamp a
//                   brief burst on the wet ground. Again, weaker, on the re-stroke.
import React from 'react';
import {clamp, fmt, hash, noise1} from '../dc/math';
import {Cam3, projector, V3, v3} from '../v2/p3';
import {PAL} from '../v3/palette';
import {deckY} from '../v3/Scene3_sky';
import {HOUSE, hw, ROD_TOP, ROUTE_LEN, routeAt, ROUTE_M} from '../v3/Rod3_cam';
import {channelHold, G1A, G1B, groundK, JUNCTION, leaderU, rodCamAt, strokeK5, surgeAt, SURGES} from './Rod5_cam';

type Pt = {x: number; y: number};
const line = (pts: Pt[]) => (pts.length ? `M${pts.map((q) => `${fmt(q.x)},${fmt(q.y)}`).join(' L')}` : '');
const lerpV = (a: V3, b: V3, k: number): V3 => v3(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k);

// ------------------------------------------------------------------ the channel (house-local metres)
/** the junction, just above the metal tip, where the tip's streamer meets the leader */
const TIP_L = v3(0, ROD_TOP.y, 0);
const JUNC_L = v3(0.05, ROD_TOP.y + 1.5, 0);
/** where the leader leaves the deck: far beyond the house, up and to the right, at the cloud base there */
const TOP_L = (() => {
  const x = 34, z = 250;
  const w = hw(x, 0, z);
  return v3(x, deckY(Math.hypot(w.x, w.z)) - HOUSE.y - 6, z);
})();
/** the wide's reference camera (midway through G1): the path is drawn on its screen, then lifted into 3D */
const REF = rodCamAt({x: (G1A.x + G1B.x) / 2, h: (G1A.h + G1B.h) / 2, d: (G1A.d + G1B.d) / 2, f: G1A.f, tipX: (G1A.tipX + G1B.tipX) / 2, tipY: (G1A.tipY + G1B.tipY) / 2});
const RP = projector(REF);
const W = (p: V3) => hw(p.x, p.y, p.z);
type P5 = V3 & {u: number};
/** the base line's point at reference-screen height y (the line from the top to the junction) */
const baseAtY = (y: number) => {
  let lo = 0, hi = 1;
  for (let it = 0; it < 40; it++) {
    const m = (lo + hi) / 2;
    if (RP(W(lerpV(TOP_L, JUNC_L, m))).y < y) lo = m;
    else hi = m;
  }
  return lerpV(TOP_L, JUNC_L, (lo + hi) / 2);
};
/** a reference-screen point lifted into 3D on the camera-facing plane through the base line at that height (the
 *  camera is level and square to the facade: screen right is +x, screen up is +y) */
const lift = (p: Pt, at?: V3): V3 => {
  const b = at ?? baseAtY(p.y);
  const bp = RP(W(b));
  const m = bp.z / REF.f;
  return v3(b.x + (p.x - bp.x) * m, b.y - (p.y - bp.y) * m, b.z);
};
/** a tortuous path on screen from a toward b: runs of irregular length whose heading deviates from the line to b
 *  (mean-reverting: the bolt wanders but keeps its way down), sharp kinks between runs, fine jitter within them */
export const tortuous = (a: Pt, b: Pt, seed: number, run0: number, run1: number, dev: number, endSteer = 90): Pt[] => {
  const out: Pt[] = [a];
  let p = a, i = 0;
  while (i < 200) {
    const rx = b.x - p.x, ry = b.y - p.y, rl = Math.hypot(rx, ry);
    if (rl < run0 * 1.1) break;
    const near = clamp(rl / endSteer);
    const h = Math.atan2(ry, rx);
    const d = ((hash(i, seed) - 0.5) * 2 * dev * (0.35 + 0.65 * near) + (hash(i, seed + 1) < 0.18 ? (hash(i, seed + 2) - 0.5) * 70 : 0) * near) * (Math.PI / 180);
    const L = Math.min(rl * 0.8, run0 + (run1 - run0) * Math.pow(hash(i, seed + 3), 1.7));
    // the run itself has a little jitter (2-3 sub-steps)
    const n = 2 + Math.floor(hash(i, seed + 4) * 2);
    for (let k = 1; k <= n; k++) {
      const j = k < n ? (hash(i * 7 + k, seed + 5) - 0.5) * 0.16 * L : 0;
      const ang = h + d;
      out.push({x: p.x + Math.cos(ang) * (L * k) / n - Math.sin(ang) * j, y: p.y + Math.sin(ang) * (L * k) / n + Math.cos(ang) * j});
    }
    p = out[out.length - 1];
    i++;
  }
  out.push(b);
  return out;
};
export const withU = (pts: Pt[]) => {
  const acc = [0];
  for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return pts.map((p, i) => ({p, u: acc[i] / (acc[acc.length - 1] || 1)}));
};
const MAIN_2D = (() => {
  const a = RP(W(TOP_L)), b = RP(W(JUNC_L));
  return tortuous({x: a.x, y: a.y}, {x: b.x, y: b.y}, 7701, 26, 92, 34);
})();
/** the main channel, top (u 0) to the junction (u 1), u by screen arc length (the leader steps down at an even pace) */
export const MAIN5: P5[] = withU(MAIN_2D).map(({p, u}) => ({...lift(p), u}));
/** downward branches: from main vertices, forking down and outward a few runs, then stalling */
type Br5 = {pts: P5[]; at: number};
export const BRANCHES5: Br5[] = [
  {at: 0.14, side: 1, px: 170, ang: 38},
  {at: 0.27, side: -1, px: 230, ang: 44},
  {at: 0.4, side: 1, px: 150, ang: 30},
  {at: 0.5, side: -1, px: 170, ang: 50},
  {at: 0.62, side: 1, px: 110, ang: 40},
  {at: 0.73, side: -1, px: 90, ang: 34},
  {at: 0.33, side: -1, px: 70, ang: 62},
].map((b, bi) => {
  const k = MAIN5.findIndex((q) => q.u >= b.at);
  const root2 = MAIN_2D[k];
  const root3 = MAIN5[k];
  const a = ((b.side * b.ang) * Math.PI) / 180;
  const end = {x: root2.x + Math.sin(a) * b.px, y: root2.y + Math.cos(a) * b.px};
  const pts2 = tortuous(root2, end, 7801 + bi * 17, 14, 44, 30, 30);
  // lifted on the plane through the root (the branch stays at the root's depth)
  return {pts: withU(pts2).map(({p, u}) => ({...lift(p, baseAtY(root2.y)), u})).map((q, i) => (i === 0 ? {...root3, u: 0} : q)), at: MAIN5[k].u};
});
/** the short streamer up from the metal tip to the junction (it starts as the leader nears, ~0.08 s before) */
const STREAMER: P5[] = [
  {...TIP_L, u: 0},
  {...v3(0.12, ROD_TOP.y + 0.55, 0.02), u: 0.37},
  {...v3(-0.05, ROD_TOP.y + 1.0, 0), u: 0.67},
  {...JUNC_L, u: 1},
];

const partial = (pts: P5[], k: number): V3[] => {
  if (k <= 0) return [];
  const out: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (pts[i].u <= k) out.push(pts[i]);
    else {
      if (i > 0) {
        const a = pts[i - 1], b = pts[i];
        out.push(lerpV(a, b, (k - a.u) / (b.u - a.u || 1)));
      }
      break;
    }
  }
  return out;
};

/** a discharge path drawn in layers: halo, violet mid, white core; w is the core width (px); `stroke` lets the top
 *  piece use a feathering gradient */
const Layers: React.FC<{d: string; w: number; a: number; core: number; grad?: string; cap?: 'round' | 'butt'}> = ({d, w, a, core, grad, cap = 'round'}) => (
  <g opacity={clamp(a)} fill="none" strokeLinecap={cap} strokeLinejoin="round" mask={grad ? `url(#${grad})` : undefined}>
    <path d={d} stroke={PAL.halo} strokeOpacity={0.2 + 0.1 * core} strokeWidth={fmt(w * 6.5)} />
    <path d={d} stroke={PAL.mid} strokeOpacity={0.55 + 0.2 * core} strokeWidth={fmt(w * 2.4)} />
    <path d={d} stroke={PAL.core} strokeOpacity={clamp(0.75 + 0.25 * core)} strokeWidth={fmt(w)} />
  </g>
);
/** the top of the channel fades into the cloud base over its first stretch (u < FEATHER) */
const FEATHER = 0.07;

export const StrikeBolt5: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const uf = leaderU(t);
  if (uf < 0) return null;
  const hold = channelHold(t);
  const joined = t >= JUNCTION;
  if (joined && hold <= 0.01) return null;
  const P = projector(cam);
  const q = (pts: V3[]) => pts.map((p) => P(W(p))).filter((p) => p.ok);
  const sk = strokeK5(t);
  const core = joined ? clamp(0.6 * hold + 0.9 * sk, 0, 1.5) : 0.55;
  // the leader: up to its front; after the junction, the whole path (with the tip's streamer)
  const full = joined ? [...MAIN5, ...STREAMER.slice().reverse().slice(1)] : partial(MAIN5, uf);
  const main = q(full);
  if (main.length < 2) return null;
  const front = main[main.length - 1];
  // the feathered top: a mask whose gradient runs from the deck (transparent) to FEATHER down the path
  const fA = P(W(MAIN5[0])), fB = P(W(partial(MAIN5, FEATHER).slice(-1)[0] ?? MAIN5[1]));
  // the tip's streamer: grows over the last 0.085 s before the junction
  const stK = joined ? 1 : clamp((t - (JUNCTION - 0.085)) / 0.085);
  const streamer = !joined && stK > 0 ? q(partial(STREAMER, stK)) : [];
  // branches: grow faster than the leader from when its front passes their root, then stall; after the junction they
  // fade sooner than the main channel
  const brs = BRANCHES5.map((b) => {
    const g = joined ? 1 : clamp(((uf - b.at) / (1 - b.at)) * 2.2);
    return g > 0 ? q(partial(b.pts, g)) : [];
  }).filter((p) => p.length > 1);
  const brA = joined ? clamp(0.3 + 0.7 * clamp(sk)) * clamp(hold * 1.6) : 0.8;
  const wMain = joined ? 2.8 + 1.6 * clamp(sk) : 2.0;
  // the leader's newest step flickers brightest (a stepped leader: each step a pulse)
  const step = joined ? 0 : 0.6 + 0.4 * noise1(t * 90, 7731);
  const blur = joined ? 0.55 * Math.min(1.2, core) * clamp(hold * 2.2) : 0.25;
  const d = line(main);
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-bl`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={joined ? 16 : 9} />
        </filter>
        <radialGradient id={`${id}-tip`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#D2DAFF" stopOpacity={0.5} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`${id}-fg`} gradientUnits="userSpaceOnUse" x1={fmt(fA.x)} y1={fmt(fA.y)} x2={fmt(fB.x)} y2={fmt(fB.y)}>
          <stop offset="0" stopColor="#000" />
          <stop offset="1" stopColor="#FFF" />
        </linearGradient>
        <mask id={`${id}-fm`} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <rect x={-200} y={-200} width={1480} height={2320} fill={`url(#${id}-fg)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-fm)`}>
        {/* the air glowing round the channel */}
        <g filter={`url(#${id}-bl)`} opacity={blur}>
          <path d={d} fill="none" stroke="#8C96FF" strokeWidth={joined ? 34 : 18} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {brs.map((b, i) => <Layers key={i} d={line(b)} w={joined ? 1.5 : 1.15} a={brA} core={joined ? core : 0.4} />)}
        <Layers d={d} w={wMain} a={joined ? clamp(hold * 2.2) : 1} core={core} />
      </g>
      {streamer.length > 1 && <Layers d={line(streamer)} w={1.4} a={0.9} core={0.5} />}
      {!joined && front && <circle cx={fmt(front.x)} cy={fmt(front.y)} r={fmt(28 + 12 * step)} fill={`url(#${id}-tip)`} opacity={0.9} />}
    </g>
  );
};

// ------------------------------------------------------------------ the current down the conductor
/** the route as arc length from the tip: s = 0 at the metal tip, ROUTE_LEN at the earth clamp */
const routeFromTip = (s: number) => routeAt(ROUTE_LEN - s);
const routePts = (s0: number, s1: number, n = 24): Pt[] => {
  const out: Pt[] = [];
  const a = clamp(s0, 0, ROUTE_LEN), b = clamp(s1, 0, ROUTE_LEN);
  if (b <= a) return out;
  // include the route's corners so the stroke follows the metal exactly
  const corners: number[] = [];
  let acc = 0;
  for (let i = ROUTE_M.length - 1; i > 0; i--) {
    acc += Math.hypot(ROUTE_M[i].x - ROUTE_M[i - 1].x, ROUTE_M[i].y - ROUTE_M[i - 1].y);
    corners.push(acc);
  }
  const ss = [...Array.from({length: n + 1}, (_, i) => a + ((b - a) * i) / n), ...corners.filter((c) => c > a && c < b)].sort((x, y) => x - y);
  return ss.map((s) => {
    const p = routeFromTip(s);
    return {x: p.x, y: p.y};
  });
};

export const ConductorCurrent5: React.FC<{cam: Cam3; t: number; id: string}> = ({cam, t, id}) => {
  const P = projector(cam);
  const Q = (p: Pt, z = -0.07) => P(hw(p.x, p.y, z));
  const items: React.ReactNode[] = [];
  SURGES.forEach((sg, i) => {
    const x = surgeAt(t, sg.t0, sg.dur);
    if (x < 0 || x > 2.6) return;
    const head = Math.min(1, x) * ROUTE_LEN;
    // behind the head the metal carries the current: bright, fading after the head has reached the ground
    const after = x > 1 ? clamp(1 - (x - 1) / 1.6) : 1;
    const trail = routePts(0, head, 40).map((p) => Q(p));
    const headPts = routePts(Math.max(0, head - 2.4), head, 10).map((p) => Q(p));
    const a = sg.k * after;
    if (a < 0.02 || trail.length < 2) return;
    items.push(
      <g key={i} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={line(trail)} stroke={PAL.halo} strokeOpacity={0.35 * a} strokeWidth={22} filter={`url(#${id}-cb)`} />
        <path d={line(trail)} stroke={PAL.mid} strokeOpacity={0.6 * a} strokeWidth={7} />
        <path d={line(trail)} stroke="#FFFFFF" strokeOpacity={0.75 * a} strokeWidth={2.6} />
        {x <= 1.05 && headPts.length > 1 && (
          <g>
            <path d={line(headPts)} stroke="#FFFFFF" strokeOpacity={0.9 * sg.k} strokeWidth={9} filter={`url(#${id}-cb)`} />
            <path d={line(headPts)} stroke="#FFFFFF" strokeWidth={4.5} strokeOpacity={sg.k} />
          </g>
        )}
      </g>,
    );
  });
  // the earth clamp: a burst on the wet ground as the current arrives, short sparks along the ground
  const gk = clamp(groundK(t));
  const cl = Q({x: ROUTE_M[0].x, y: 0.2}, -0.12);
  const sparks = gk > 0.05 && cl.ok
    ? Array.from({length: 7}, (_, i) => {
        const a = (i / 7) * 6.2832 + 0.4 * hash(i, 7741);
        const L = (0.5 + 0.5 * hash(i + Math.floor(t * 30), 7743)) * 1.1;
        const pts: Pt[] = [];
        for (let m = 0; m <= 3; m++) {
          const r = (L * m) / 3, j = m ? (hash(i * 5 + m + Math.floor(t * 30) * 3, 7745) - 0.5) * 0.35 : 0;
          pts.push(Q({x: ROUTE_M[0].x + Math.cos(a) * r + j, y: 0.03}, -0.12 + Math.sin(a) * r * 0.8));
        }
        return line(pts);
      })
    : [];
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <filter id={`${id}-cb`} filterUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <radialGradient id={`${id}-gr`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.25" stopColor={PAL.mid} stopOpacity={0.5} />
          <stop offset="1" stopColor={PAL.halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      {items}
      {gk > 0.02 && cl.ok && (
        <g>
          <ellipse cx={fmt(cl.x)} cy={fmt(cl.y)} rx={fmt(70 + 50 * gk)} ry={fmt(26 + 16 * gk)} fill={`url(#${id}-gr)`} opacity={gk} />
          <path d={sparks.join(' ')} fill="none" stroke="#EEF0FF" strokeOpacity={0.85 * gk} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};
/** the top of the channel (for the deck's lit underside) */
export const STRIKE_TOP_W = W(TOP_L);
