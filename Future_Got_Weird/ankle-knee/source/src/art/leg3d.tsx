// The lower leg as a small 3D model, for the half-turn. A shin stub and a foot are lofted from elliptical sections
// (the foot's side profile is the rig's FOOT_BODY, so in profile it is the same drawing as the 2D foot), with five
// toes, two ankle bones and toenails. The piece turns about the shin's own long axis (yaw), the foot can point
// (plantarflex) at the ankle, and the whole piece can tilt in the picture plane with the shin. Projection is
// orthographic with the lens a little above (PITCH), so the top of the foot shows while it turns. Each loft is drawn
// as the union of the convex hulls of neighbouring projected rings: one silhouette, one Weird Crew contour.
import React from 'react';
import {Deco, INK, Inked, InkLine} from '../dc/ink';
import {Blob} from '../dc/shade';
import {lit, shade} from '../dc/color';
import {fmt, V} from '../dc/math';
import {FOOT_BODY} from './wyatt';
import {C} from './pal';

type V3 = [number, number, number];
export const PITCH = (16 * Math.PI) / 180;
const N = 20;

/** the foot's sagittal top and bottom at u (from the FOOT_BODY polygon) */
const profileAt = (u: number): [number, number] => {
  const vs: number[] = [];
  const P = FOOT_BODY;
  for (let i = 0; i < P.length; i++) {
    const [u0, v0] = P[i], [u1, v1] = P[(i + 1) % P.length];
    if ((u0 - u) * (u1 - u) <= 0 && u0 !== u1) vs.push(v0 + ((u - u0) / (u1 - u0)) * (v1 - v0));
  }
  return [Math.min(...vs), Math.max(...vs)];
};
const footW = (u: number) => (u < -3 ? 2.75 + (u + 6.4) * 0.08 : u < 4 ? 3.0 + (u + 3) * 0.05 : Math.min(4.35, 3.35 + (u - 4) * 0.13));
/** foot sections along u: centre (x = -u, y), half height, half width, medial shift */
const FOOT_S = Array.from({length: 17}, (_, i) => {
  const u = -6.25 + (i / 16) * (12.4 + 6.25);
  const [top, bot] = profileAt(u);
  const tip = i >= 15 ? (i === 16 ? 0.7 : 0.9) : 1;
  return {u, cy: (top + bot) / 2 + (1 - tip) * 0.8, hh: Math.max(0.6, (bot - top) / 2) * tip, hw: footW(u) * (i === 0 ? 0.85 : tip), cz: u > 6 ? (u - 6) * 0.05 : 0};
});
/** shin sections: y (up is negative), centre x (calf behind), radii front-back / side-side */
export const SHIN_S = [
  {y: 0.6, cx: 0.2, rx: 2.9, rz: 3.2}, {y: -2.5, cx: 0.3, rx: 2.9, rz: 3.15}, {y: -6, cx: 0.5, rx: 3.2, rz: 3.3},
  {y: -10, cx: 0.9, rx: 3.7, rz: 3.55}, {y: -15, cx: 1.5, rx: 4.6, rz: 4.2}, {y: -21, cx: 1.6, rx: 5.2, rz: 4.7},
  {y: -27, cx: 0.7, rx: 4.8, rz: 4.7}, {y: -31, cx: 0, rx: 4.6, rz: 4.8},
];
/** toes: base u, height v, side z (+ = big-toe side), length, radius */
const TOES3: [number, number, number, number, number][] = [
  [10.4, 4.0, 2.7, 6.1, 1.78], [10.8, 3.9, 0.85, 5.2, 1.18], [10.6, 4.0, -0.75, 4.8, 1.06], [10.2, 4.2, -2.1, 4.3, 0.96], [9.6, 4.4, -3.2, 3.75, 0.86],
];

export type Leg3D = {
  /** world position of the ankle pivot */
  A: V;
  /** shin angle in the picture plane (deg from down, + toward his front) */
  sa: number;
  /** turn about the shin's long axis (deg): 0 = toes forward (screen-left), 180 = toes back */
  yaw: number;
  /** extra point of the foot (deg, + = toes down) */
  point: number;
  /** keep the shin only from this height (local y, negative = above the ankle): the cut */
  top: number;
  toeCurl?: number;
};

const rotZ = (p: V3, a: number): V3 => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
const yawP = (p: V3, th: number): V3 => [p[0] * Math.cos(th) - p[2] * Math.sin(th), p[1], p[0] * Math.sin(th) + p[2] * Math.cos(th)];

export const legXf = (g: Leg3D) => {
  const th = (g.yaw * Math.PI) / 180, sa = (g.sa * Math.PI) / 180, pt = (-g.point * Math.PI) / 180;
  /** local point -> {screen x, screen y, depth}; foot points are pointed at the ankle first */
  return (p: V3, foot: boolean) => {
    let q = foot ? rotZ(p, pt) : p;
    q = yawP(q, th);
    const r = rotZ(q, sa);
    return {x: g.A.x + r[0], y: g.A.y + r[1] - q[2] * Math.sin(PITCH), z: q[2]};
  };
};

const hull = (ps: V[]): V[] => {
  const s = [...ps].sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: V, a: V, b: V) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: V[] = [], hi: V[] = [];
  for (const p of s) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of [...s].reverse()) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
const polyD = (ps: V[]) => 'M' + ps.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join('L') + 'Z';
const loftD = (rings: V[][]) => {
  let d = '';
  for (let i = 0; i + 1 < rings.length; i++) d += polyD(hull([...rings[i], ...rings[i + 1]]));
  return d;
};

/** the piece: shin stub (from g.top down), foot, toes, ankle bones, nails; `glow` outlines it in mint */
export const LowerLeg3D: React.FC<{id: string; g: Leg3D; iw: number; skin?: string; cutFace?: boolean}> = ({id, g, iw, skin = C.skin, cutFace = true}) => {
  const X = legXf(g);
  const ring = (f: (a: number) => V3, foot: boolean) => Array.from({length: N}, (_, k) => {
    const q = X(f((k / N) * Math.PI * 2), foot);
    return {x: q.x, y: q.y};
  });
  // shin rings, clipped at the cut height
  const shin = SHIN_S.filter((s) => s.y >= g.top - 0.01);
  const topS = (() => {
    // interpolated section at the cut
    for (let i = 0; i + 1 < SHIN_S.length; i++) {
      const a = SHIN_S[i], b = SHIN_S[i + 1];
      if (g.top <= a.y && g.top >= b.y) {
        const u = (a.y - g.top) / (a.y - b.y);
        return {y: g.top, cx: a.cx + (b.cx - a.cx) * u, rx: a.rx + (b.rx - a.rx) * u, rz: a.rz + (b.rz - a.rz) * u};
      }
    }
    return SHIN_S[SHIN_S.length - 1];
  })();
  const shinS = [...shin, topS];
  const shinRings = shinS.map((s) => ring((a) => [s.cx + s.rx * Math.cos(a), s.y, s.rz * Math.sin(a)], false));
  const footRings = FOOT_S.map((s) => ring((a) => [-s.u, s.cy + s.hh * Math.sin(a), s.cz + s.hw * Math.cos(a)], true));
  const body = loftD(shinRings) + loftD(footRings) + loftD([shinRings[0], footRings[6]]);
  const ank = X([0, 0, 0], false);
  // toes, each a short loft; depth decides front or back of the foot
  const curl = ((g.toeCurl ?? 0) * Math.PI) / 180;
  const fore = X([-11, 4, 0.4], true);
  const toes = TOES3.map(([u, v, z, l, r], k) => {
    const a = curl * (k === 0 ? 1 : 1.15) + (k === 0 ? 0.03 : 0.07 + 0.02 * k);
    // sections along the toe, with a rounded cap at the tip
    const cap = [0, 30, 55, 75, 88].map((d) => (d * Math.PI) / 180);
    const SS = [0, 0.4 * (l - r), l - r, ...cap.slice(1).map((p) => l - r + r * Math.sin(p))];
    const rr = [r * 1.02, r, r, ...cap.slice(1).map((p) => r * Math.cos(p))];
    const pts: V3[] = SS.map((s) => [-(u + s * Math.cos(a)), v + s * Math.sin(a) - 0.15 * s * (k ? 1 : 0.5), z]);
    const rings = pts.map((c, i) => ring((b) => [c[0], c[1] + rr[i] * Math.sin(b), c[2] + rr[i] * Math.cos(b)], true));
    const tip = X(pts[3], true);
    const pn = pts[2], rn = r;
    // the nail: a small disc on top of the tip
    const nailC: V3 = [pn[0] - 0.15, pn[1] - rn * 0.72, pn[2]];
    const nail = Array.from({length: 12}, (_, i) => {
      const b = (i / 12) * Math.PI * 2;
      const q = X([nailC[0] + Math.cos(b) * rn * 0.6, nailC[1] - Math.abs(Math.sin(b)) * 0.05, nailC[2] + Math.sin(b) * rn * 0.55], true);
      return {x: q.x, y: q.y};
    });
    const base = X(pts[0], true), mid = X(pts[1], true);
    return {k, d: loftD(rings), z: tip.z, c: tip, nail, r, base, mid};
  });
  const back = toes.filter((q) => q.z > fore.z - 0.3).sort((a, b) => b.z - a.z);
  const front = toes.filter((q) => q.z <= fore.z - 0.3).sort((a, b) => b.z - a.z);
  const toeEl = (q: (typeof toes)[number]) => (
    <Inked key={q.k} w={iw} id={`${id}-tf${q.k}`} fade={[{c: q.base, r: q.r * 2.6}, {c: q.mid, r: q.r * 1.7}]}>
      <Blob id={`${id}-t${q.k}`} d={q.d} c={{x: q.c.x - 0.5, y: q.c.y - 0.6}} r={q.r * 3} color={skin} k={0.6} />
    </Inked>
  );
  // ankle bones (bumps on either side); the nearer one shows as a highlight
  const mall = [X([0.6, -0.7, -3.05], false), X([-0.2, -1.5, 3.0], false)];
  // the cut face at the top of the stub (seen from a little above)
  const faceRing = shinRings[shinRings.length - 1];
  const boneC = X([topS.cx - 1.5, topS.y, 0.3], false);
  const bone = Array.from({length: 14}, (_, k) => {
    const b = (k / 14) * Math.PI * 2;
    const q = X([topS.cx - 1.5 + 1.55 * Math.cos(b), topS.y, 0.3 + 1.45 * Math.sin(b)], false);
    return {x: q.x, y: q.y};
  });
  const fib = Array.from({length: 10}, (_, k) => {
    const b = (k / 10) * Math.PI * 2;
    const q = X([topS.cx + 1.4 + 0.6 * Math.cos(b), topS.y, -2.3 + 0.6 * Math.sin(b)], false);
    return {x: q.x, y: q.y};
  });
  void boneC;
  const nailsOf = (list: typeof toes) => list.map((q) => <path key={`n${q.k}`} d={polyD(hull(q.nail))} fill={C.nail} stroke={INK} strokeWidth={iw * 0.3} opacity={0.95} />);
  return (
    <g>
      {back.map(toeEl)}
      <Deco>{nailsOf(back)}</Deco>
      <Inked w={iw}>
        <Blob id={`${id}-b`} d={body} c={{x: ank.x - 2, y: ank.y - 10}} r={36} color={skin} k={0.7} />
      </Inked>
      <Deco>
        {mall.map((m, i) => (m.z < 0 ? <ellipse key={i} cx={fmt(m.x)} cy={fmt(m.y)} rx={1.5} ry={1.3} fill={lit(skin, 0.4)} opacity={0.6} /> : null))}
        {mall.map((m, i) => (m.z < 0 ? <InkLine key={`l${i}`} d={`M${fmt(m.x - 1.3)},${fmt(m.y - 0.9)} Q${fmt(m.x)},${fmt(m.y - 1.9)} ${fmt(m.x + 1.3)},${fmt(m.y - 0.9)}`} w={iw * 0.4} opacity={0.45} /> : null))}
        {(() => {
          // the arch shows when the inside of the foot faces the lens
          const m = X([-4.5, 4.6, 3.1], true);
          const vis = -m.z > 1.2 ? Math.min(1, (-m.z - 1.2) / 1.2) : 0;
          return vis > 0 ? <ellipse cx={fmt(m.x)} cy={fmt(m.y)} rx={3.6} ry={0.9} fill={shade(skin, 0.35)} opacity={0.3 * vis} /> : null;
        })()}
        {cutFace && g.top > -30 && (
          <g>
            <path d={polyD(faceRing)} fill={C.tissue} stroke={INK} strokeWidth={iw * 0.5} />
            <path d={polyD(hull(bone))} fill={C.bone} stroke={shade(C.boneDeep, 0.2)} strokeWidth={iw * 0.3} />
            <path d={polyD(hull(fib))} fill={C.bone} stroke={shade(C.boneDeep, 0.2)} strokeWidth={iw * 0.3} />
          </g>
        )}
      </Deco>
      {front.map(toeEl)}
      <Deco>{nailsOf(front)}</Deco>
    </g>
  );
};

/** a translucent ring round the shin showing which way it turns (front half drawn over the leg) */
export const TurnRing: React.FC<{g: Leg3D; y: number; r: number; a: number; dir: number; half: 'back' | 'front'; iw: number}> = ({g, y, r, a, dir, half, iw}) => {
  if (a <= 0.01) return null;
  const X = legXf({...g, yaw: 0});
  const pts: {x: number; y: number; z: number}[] = [];
  // the arc runs the way the toes travel (round the back, then across the front), arrow at the front-right end
  for (let k = 0; k <= 40; k++) {
    const b = (dir >= 0 ? 30 + (k / 40) * 310 : 510 - (k / 40) * 310) * (Math.PI / 180);
    pts.push(X([r * Math.cos(b), y, r * Math.sin(b)], false));
  }
  const seg = pts.filter((p) => (half === 'front' ? p.z < 0 : p.z >= 0));
  if (seg.length < 2) return null;
  const pieces: {x: number; y: number}[][] = [];
  let cur: {x: number; y: number}[] = [];
  for (let k = 0; k < pts.length; k++) {
    const inHalf = half === 'front' ? pts[k].z < 0 : pts[k].z >= 0;
    if (inHalf) cur.push(pts[k]); else if (cur.length) { pieces.push(cur); cur = []; }
  }
  if (cur.length) pieces.push(cur);
  const end = pts[pts.length - 1], prev = pts[pts.length - 3];
  const ang = Math.atan2(end.y - prev.y, end.x - prev.x);
  const head = [0, 2.3, -2.3].map((s, i) => (i === 0 ? {x: end.x + Math.cos(ang) * 2.4, y: end.y + Math.sin(ang) * 2.4} : {x: end.x + Math.cos(ang + Math.PI / 2) * s * 0.7, y: end.y + Math.sin(ang + Math.PI / 2) * s * 0.7}));
  const showHead = half === 'front' ? end.z < 0 : end.z >= 0;
  return (
    <g opacity={a}>
      {pieces.map((pc, i) => (
        <path key={i} d={'M' + pc.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join('L')} fill="none" stroke={C.healthy} strokeWidth={iw * (half === 'front' ? 1.1 : 0.8)} strokeLinecap="round" opacity={half === 'front' ? 1 : 0.55} />
      ))}
      {showHead && <polygon points={head.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' ')} fill={C.healthy} />}
    </g>
  );
};
