// The handling circuit in three dimensions: a straight, a long left-hand bend, a straight. Seen from above (overhead map)
// or from a low camera beside the road (three-quarter tracking shot, front view). Same palette and the same light
// as the side-view proving ground: red-and-white kerbs on the bend, tyre wall on the outside, trees on the infield, the
// control tower and the grandstand beyond.
import React from 'react';
import {C} from '../theme';
import {Cam3, V3, project} from './view3d';
import {rand} from './util';

export const R_BEND = 70000; // mm
export const ROAD_HALF = 4500;
const S0 = 150000; // length of the first straight
const ARC = (240 * Math.PI) / 180;
export const ARC_LEN = R_BEND * ARC;
export const BEND_START = S0;
export const TRACK_END = S0 + ARC_LEN + 250000;

export type TrackPt = {e: number; n: number; psi: number};
/** Centre line at arc length s (mm). Heading is from east toward north; the bend turns left. */
export const trackAt = (s: number): TrackPt => {
  if (s <= S0) return {e: s, n: 0, psi: 0};
  if (s <= S0 + ARC_LEN) {
    const a = (s - S0) / R_BEND;
    return {e: S0 + R_BEND * Math.sin(a), n: R_BEND * (1 - Math.cos(a)), psi: a};
  }
  const e0 = S0 + R_BEND * Math.sin(ARC), n0 = R_BEND * (1 - Math.cos(ARC));
  const d = s - S0 - ARC_LEN;
  return {e: e0 + d * Math.cos(ARC), n: n0 + d * Math.sin(ARC), psi: ARC};
};
/** World point at arc length s, lateral offset off (+ = left), height h. */
export const trackPoint = (s: number, off: number, h = 0): V3 => {
  const p = trackAt(s);
  return [p.e - off * Math.sin(p.psi), h, p.n + off * Math.cos(p.psi)];
};
/** Curvature of the centre line at s (1/mm), + = left. */
export const curvature = (s: number) => (s > S0 && s < S0 + ARC_LEN ? 1 / R_BEND : 0);

type Item = {depth: number; node: React.ReactNode};
const pt = (p: {x: number; y: number}) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

const mixc = (a: string, b: string, t: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
};
const HAZE = '#EFEBD6';

export type TrackSceneProps = {
  cam: Cam3;
  /** arc-length window to build (mm) */
  s0: number;
  s1: number;
  extra?: Item[];
  /** cars and other things the caller draws in the same depth order */
  children?: never;
  kerbs?: boolean;
  wall?: 'tyres' | 'concrete';
  pathHint?: {sFrom: number; sTo: number; opacity: number};
  bumps?: Bump[];
  id?: string;
};

/** Raised strips across the road: side -1 = under the car's right-hand wheels, +1 = left, 0 = both. */
export type Bump = {s: number; len: number; h: number; side: -1 | 0 | 1};
export const bumpAt = (bumps: Bump[], s: number, side: -1 | 1) => {
  let h = 0;
  for (const b of bumps) {
    if (b.side !== 0 && b.side !== side) continue;
    const u = (s - b.s) / b.len;
    if (u > 0 && u < 1) h = Math.max(h, b.h * Math.sin(Math.PI * u) ** 2);
  }
  return h;
};

export const TrackScene: React.FC<TrackSceneProps> = ({cam, s0, s1, extra = [], kerbs = true, wall = 'tyres', pathHint, bumps = []}) => {
  const out: Item[] = [...extra];
  const ds = 3000;
  const horizonY = (cam.cy ?? 540) - cam.f * Math.tan(cam.pitch);
  const topDown = cam.pitch < -1.0;
  const P = (v: V3) => project(cam, v);
  const strip = (a: number, b: number, sa: number, sb: number, fill: string, stroke?: string, op = 1, sw = 0) => {
    const L: {x: number; y: number}[] = [], R: {x: number; y: number}[] = [];
    for (let s = sa; s <= sb + 1e-6; s += ds) {
      const l = P(trackPoint(s, a)), r = P(trackPoint(s, b));
      if (!l || !r) continue;
      L.push(l); R.push(r);
    }
    if (L.length < 2) return null;
    return <polygon points={[...L, ...R.reverse()].map(pt).join(' ')} fill={fill} stroke={stroke ?? 'none'} strokeWidth={sw} opacity={op} strokeLinejoin="round" />;
  };

  // ------------------------------------------------------------------ ground-level layers (always behind objects)
  const ground: React.ReactNode[] = [];
  ground.push(strip(-ROAD_HALF - 14000, ROAD_HALF + 14000, s0, s1, '#BFD9A8', undefined, 1));
  ground.push(strip(-ROAD_HALF - 900, ROAD_HALF + 900, s0, s1, '#E2DAC4'));
  ground.push(strip(-ROAD_HALF, ROAD_HALF, s0, s1, '#8F999D', C.ink, 1, 2));
  // painted lines
  ground.push(strip(ROAD_HALF - 330, ROAD_HALF - 180, s0, s1, C.cream, undefined, 0.95));
  ground.push(strip(-ROAD_HALF + 180, -ROAD_HALF + 330, s0, s1, C.cream, undefined, 0.95));
  const DASH = 8000;
  for (let s = Math.floor(s0 / DASH) * DASH; s < s1; s += DASH) {
    const q = strip(-120, 120, s, s + 4000, C.cream, undefined, 0.9);
    if (q) ground.push(React.cloneElement(q as React.ReactElement, {key: `d${s}`}));
  }
  // kerbs on both edges of the bend, red and cream blocks
  if (kerbs) {
    const K = 1800;
    for (let s = Math.max(Math.floor((s0 - 6000) / K) * K, BEND_START - 20000); s < Math.min(s1, BEND_START + ARC_LEN + 20000); s += K) {
      const k = Math.round(s / K);
      const col = k % 2 === 0 ? C.coral : C.cream;
      for (const [a, b] of [[ROAD_HALF, ROAD_HALF + 800], [-ROAD_HALF - 800, -ROAD_HALF]] as [number, number][]) {
        const q = strip(a, b, s, s + K, col, C.ink, 1, 1.2);
        if (q) ground.push(React.cloneElement(q as React.ReactElement, {key: `k${s}-${a}`}));
      }
    }
  }
  // the car's intended path across the bend (dashed), when asked for
  if (pathHint && pathHint.opacity > 0) {
    const pts: {x: number; y: number}[] = [];
    for (let s = pathHint.sFrom; s <= pathHint.sTo; s += 2500) {
      const p = P(trackPoint(s, curvature(s) > 0 ? 400 : 0));
      if (p) pts.push(p);
    }
    if (pts.length > 2) ground.push(<polyline key="path" points={pts.map(pt).join(' ')} fill="none" stroke={C.saffron} strokeWidth={topDown ? 7 : 10} strokeDasharray="22 16" strokeLinecap="round" opacity={pathHint.opacity} />);
  }

  // raised strips across the road
  for (const b of bumps) {
    if (b.s + b.len < s0 || b.s > s1) continue;
    const a0 = b.side === 1 ? 300 : -ROAD_HALF + 400, a1 = b.side === -1 ? -300 : ROAD_HALF - 400;
    const lo = b.side === -1 ? -ROAD_HALF + 400 : b.side === 1 ? 300 : -ROAD_HALF + 400;
    const hi = b.side === -1 ? -300 : b.side === 1 ? ROAD_HALF - 400 : ROAD_HALF - 400;
    void a0; void a1;
    const q = (s: number, off: number, h: number) => P(trackPoint(s, off, h));
    const f0 = q(b.s, lo, 0), f1 = q(b.s, hi, 0), t0 = q(b.s, lo, b.h), t1 = q(b.s, hi, b.h), u0 = q(b.s + b.len, lo, b.h), u1 = q(b.s + b.len, hi, b.h);
    if (f0 && f1 && t0 && t1 && u0 && u1) {
      ground.push(
        <g key={`bump${b.s}-${b.side}`}>
          <polygon points={[f0, f1, t1, t0].map(pt).join(' ')} fill="#6E777C" />
          <polygon points={[t0, t1, u1, u0].map(pt).join(' ')} fill="#B9C1C4" stroke={C.ink} strokeOpacity={0.6} strokeWidth={2} strokeLinejoin="round" />
        </g>,
      );
    }
  }

  // ------------------------------------------------------------------ objects: barrier segments, posts, trees, buildings
  const SEG = 2400;
  const sa = Math.floor(s0 / SEG) * SEG;
  for (let s = sa; s < s1; s += SEG) {
    const k = Math.round(s / SEG);
    // outside barrier (right of the car, -offset): tyre wall in the bend, concrete wall on the straights
    const inBend = s > BEND_START - 12000 && s < BEND_START + ARC_LEN + 12000;
    const off = -(ROAD_HALF + 2600);
    const a = P(trackPoint(s, off, 0)), b = P(trackPoint(s + SEG, off, 0));
    const a2 = P(trackPoint(s, off, inBend ? 820 : 900)), b2 = P(trackPoint(s + SEG, off, inBend ? 820 : 900));
    if (a && b && a2 && b2) {
      const col = inBend ? (k % 5 === 0 ? C.coral : k % 5 === 2 ? C.cream : '#2A343B') : k % 2 === 0 ? '#DDD6C2' : '#E9E3CF';
      const z = (a.z + b.z) / 2;
      // inside face (toward the road) and the top face
      const top1 = P(trackPoint(s, off - 700, inBend ? 820 : 900)), top2 = P(trackPoint(s + SEG, off - 700, inBend ? 820 : 900));
      out.push({
        depth: z,
        node: (
          <g key={`w${s}`}>
            <polygon points={[a, b, b2, a2].map((p) => pt(p!)).join(' ')} fill={col} stroke={C.ink} strokeWidth={topDown ? 1 : 2} strokeLinejoin="round" />
            {top1 && top2 && <polygon points={[a2, b2, top2, top1].map((p) => pt(p!)).join(' ')} fill={mixc(col, '#FFFFFF', 0.25)} stroke={C.ink} strokeWidth={topDown ? 1 : 1.5} strokeLinejoin="round" />}
          </g>
        ),
      });
    }
    // inside edge: low cones/poles every 4th segment in the bend
    if (inBend && k % 3 === 0) {
      const base = P(trackPoint(s, ROAD_HALF + 1500, 0)), tip = P(trackPoint(s, ROAD_HALF + 1500, 700));
      if (base && tip) out.push({depth: base.z, node: <g key={`c${s}`}><line x1={base.x} y1={base.y} x2={tip.x} y2={tip.y} stroke={C.coral} strokeWidth={Math.max(2, (cam.f * 90) / base.z)} strokeLinecap="round" /></g>});
    }
    // trees: infield (left) and outside (right), seeded
    for (const side of [1, -1]) {
      const r = rand(k * 5 + (side > 0 ? 1 : 2));
      if (r < 0.5) continue;
      const o = side * (ROAD_HALF + 9000 + rand(k * 7 + side) * 26000);
      const p = P(trackPoint(s + rand(k + 9) * SEG, o, 0));
      const top = P(trackPoint(s + rand(k + 9) * SEG, o, 9000 * (0.7 + 0.6 * rand(k * 3))));
      if (!p || !top || p.z > 260000) continue;
      const hgt = p.y - top.y;
      if (hgt < 2) continue;
      const tint = Math.min(0.7, p.z / 380000);
      if (topDown) {
        const rr = Math.max(2, (cam.f * 3600) / p.z);
        out.push({depth: p.z, node: <g key={`t${s}-${side}`}><circle cx={p.x} cy={p.y} r={rr} fill="#5FB8A6" stroke={C.ink} strokeOpacity={0.6} strokeWidth={Math.max(1, rr * 0.12)} /><circle cx={p.x - rr * 0.25} cy={p.y - rr * 0.25} r={rr * 0.55} fill="#77C6B4" /></g>});
        continue;
      }
      out.push({
        depth: p.z,
        node: (
          <g key={`t${s}-${side}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${(hgt / 150).toFixed(4)})`}>
            {r > 0.8 ? (
              <path d="M 0 -150 L 40 -70 L 22 -72 L 52 -26 L -52 -26 L -22 -72 L -40 -70 Z" fill={mixc('#4FA695', HAZE, tint)} stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} strokeLinejoin="round" />
            ) : (
              <>
                <rect x={-6} y={-48} width={12} height={48} fill={mixc('#8A6A4A', HAZE, tint)} stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} />
                <circle cx={0} cy={-88} r={48} fill={mixc('#5FB8A6', HAZE, tint)} stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} />
                <circle cx={-26} cy={-70} r={30} fill={mixc('#77C6B4', HAZE, tint)} stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
              </>
            )}
          </g>
        ),
      });
    }
  }
  // buildings on the infield and beyond the outside wall
  const bld: [number, number, 'tower' | 'stand' | 'hangar'][] = [
    [S0 + 12000, R_BEND - 14000, 'tower'],
    [S0 + R_BEND * 0.55, R_BEND * 1.05, 'stand'],
    [S0 - 55000, 38000, 'hangar'],
    [S0 + 90000, -34000, 'stand'],
    [S0 + R_BEND * 1.2, 20000, 'hangar'],
  ];
  bld.forEach(([e, n, kind], i) => {
    const base = P([e, 0, n]);
    const sz = kind === 'tower' ? 22000 : kind === 'stand' ? 9000 : 8000;
    const top = P([e, sz, n]);
    if (!base || !top || base.z > 520000) return;
    const hgt = base.y - top.y;
    if (hgt < 3 && !topDown) return;
    const tint = Math.min(0.75, base.z / 620000);
    if (topDown) {
      const w = kind === 'tower' ? 9000 : kind === 'stand' ? 36000 : 30000, d = kind === 'tower' ? 9000 : kind === 'stand' ? 10000 : 22000;
      const c = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([dx, dy]) => P([e + dx, 0, n + dy]));
      if (c.every((q) => q)) out.push({depth: base.z + 20000, node: <polygon key={`b${i}`} points={c.map((q) => pt(q!)).join(' ')} fill={kind === 'tower' ? '#EADFC2' : kind === 'stand' ? '#4F7CC9' : '#BFD0D8'} stroke={C.ink} strokeWidth={2} strokeLinejoin="round" />});
      return;
    }
    const sc = hgt / (kind === 'tower' ? 372 : kind === 'stand' ? 192 : 150);
    out.push({
      depth: base.z + 20000,
      node: (
        <g key={`b${i}`} transform={`translate(${base.x.toFixed(1)} ${base.y.toFixed(1)}) scale(${sc.toFixed(4)})`}>
          {kind === 'tower' && (
            <g>
              <rect x={-16} y={-250} width={32} height={250} fill={mixc('#EADFC2', HAZE, tint)} stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
              <rect x={-58} y={-320} width={116} height={78} rx={10} fill={mixc('#EADFC2', HAZE, tint)} stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
              <rect x={-50} y={-304} width={100} height={42} rx={6} fill={mixc('#7FB6BC', HAZE, tint)} stroke={C.ink} strokeOpacity={0.4} strokeWidth={2} />
              <rect x={-66} y={-332} width={132} height={16} rx={6} fill={mixc('#E9A91C', HAZE, tint * 0.6)} stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
              <line x1={0} y1={-332} x2={0} y2={-372} stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} />
              <circle cx={0} cy={-376} r={7} fill={C.coral} />
            </g>
          )}
          {kind === 'stand' && (
            <g>
              {[0, 1, 2, 3].map((j) => (
                <rect key={j} x={-190 + j * 18} y={-34 - j * 34} width={380 - j * 36} height={34} fill={mixc(['#EF6B55', '#FFC744', '#4F7CC9', '#1CA7A0'][j], HAZE, tint * 0.7)} stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
              ))}
              <path d="M -214 -176 L 214 -176 L 206 -192 L -206 -192 Z" fill={mixc('#F4EFE3', HAZE, tint * 0.5)} stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
            </g>
          )}
          {kind === 'hangar' && (
            <g>
              <path d="M -170 0 L -170 -70 C -170 -150 170 -150 170 -70 L 170 0 Z" fill={mixc('#BFD0D8', HAZE, tint * 0.8)} stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
              <rect x={-80} y={-70} width={160} height={70} fill={mixc('#8FA3AE', HAZE, tint * 0.8)} stroke={C.ink} strokeOpacity={0.4} strokeWidth={2.5} />
            </g>
          )}
        </g>
      ),
    });
  });
  out.sort((a, b) => b.depth - a.depth);

  // ------------------------------------------------------------------ sky and hills (only when the horizon is in shot)
  const hy = Math.max(-400, Math.min(1500, horizonY));
  const hills: React.ReactNode[] = [];
  if (!topDown) {
    const cxp = cam.cx ?? 960, cyp = cam.cy ?? 540;
    const noise = (a: number, seed: number) => Math.max(0, Math.min(1, 0.5 + 0.28 * Math.sin(3 * a + seed) + 0.17 * Math.sin(7 * a + 2.1 * seed) + 0.1 * Math.sin(13 * a + 0.7 * seed)));
    const ring = (dist: number, base: number, amp: number, fill: string, seed: number) => {
      const pts: string[] = [];
      for (let x = -40; x <= 1960; x += 40) {
        const a = cam.yaw - Math.atan((x - cxp) / cam.f);
        const h = base + amp * noise(a, seed);
        const y = cyp - cam.f * Math.tan(Math.atan((h - cam.eye[1]) / dist) - cam.pitch);
        pts.push(`${x},${y.toFixed(1)}`);
      }
      return <path d={`M -40 1300 L ${pts.join(' L ')} L 1960 1300 Z`} fill={fill} stroke={C.ink} strokeOpacity={0.3} strokeWidth={3} />;
    };
    hills.push(<React.Fragment key="h1">{ring(900000, 30000, 150000, '#C6E3DC', 11)}</React.Fragment>);
    hills.push(<React.Fragment key="h2">{ring(520000, 10000, 80000, '#A9D8CC', 23)}</React.Fragment>);
  }
  return (
    <g>
      <defs>
        <linearGradient id="t3-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE7E4" />
          <stop offset="1" stopColor="#FAF3DF" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill={topDown ? '#CFE3B8' : 'url(#t3-sky)'} />
      {!topDown && <circle cx={1500} cy={hy - 360} r={72} fill={C.saffronLight} opacity={0.9} />}
      {hills}
      {!topDown && <rect x={0} y={hy} width={1920} height={1080 - hy} fill="#CFE3B8" />}
      <g>{ground}</g>
      {out.map((o, i) => <React.Fragment key={i}>{o.node}</React.Fragment>)}
    </g>
  );
};
