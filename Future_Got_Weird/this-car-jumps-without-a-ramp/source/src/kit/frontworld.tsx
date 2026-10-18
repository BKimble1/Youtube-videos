// Front-view world: a camera ahead of the car looking back at it, so the road recedes behind the car toward the
// horizon. The road centre line is a circular arc tangent at the car (curvature k > 0 bends toward screen-right, the
// centre of the turn), so the kerb on the inside edge marks the apex. The camera keeps pace with the car, so road
// texture flows away from the camera and under the car at the car's speed.
import React from 'react';
import {C} from '../theme';

export type FrontCam = {f: number; h: number; horizon: number; cx: number}; // focal (px), eye height (mm), horizon y, screen centre x
export const FCAM: FrontCam = {f: 2100, h: 1500, horizon: 300, cx: 960};
export const D_CAR = 5200; // distance from camera to the car's front axle line (mm)
export const ROAD_HALF = 4200;

/** Screen point of a ground point at lateral x (mm, + = screen right) and distance d (mm) from the camera. */
export const proj = (c: FrontCam, x: number, d: number, y = 0) => ({x: c.cx + (c.f * x) / d, y: c.horizon + (c.f * (c.h - y)) / d, s: c.f / d});

/** Raised strips across one side of the road (or both), at road distance s ahead of the car along the road. */
export type Bump = {s: number; side: -1 | 0 | 1; h: number; len: number};
export const centre = (k: number, dCar: number) => (d: number) => (k * (d - dCar) * (d - dCar)) / 2;
/** Height of the road under a wheel on `side` at the car (bumps move toward the camera with travel). */
export const bumpUnder = (bumps: Bump[], travel: number, side: -1 | 1) => {
  let h = 0;
  for (const b of bumps) {
    if (b.side !== 0 && b.side !== side) continue;
    const u = (b.s - travel) / b.len; // 0..1 while the strip passes under the axle line
    if (u > 0 && u < 1) h = Math.max(h, b.h * Math.sin(Math.PI * u) ** 2);
  }
  return h;
};

export const FrontWorld: React.FC<{cam?: FrontCam; k: number; travel: number; kerb?: boolean; dCar?: number; bumps?: Bump[]}> = ({cam = FCAM, k, travel, kerb = true, dCar = D_CAR, bumps = []}) => {
  const cl = centre(k, dCar); // centre-line offset at camera distance d
  const ds: number[] = [];
  for (let d = 1200; d < 160000; d *= 1.06) ds.push(d);
  const edge = (side: number) => ds.map((d) => proj(cam, cl(d) + side * ROAD_HALF, d));
  const L = edge(-1), R = edge(1);
  const roadPts = [...L.map((p) => `${p.x},${p.y}`), ...R.reverse().map((p) => `${p.x},${p.y}`)].join(' ');
  // texture flows toward the camera: arc length s from the car, moving with travel
  const stripes: React.ReactNode[] = [];
  const P = 9000;
  const off = ((travel % P) + P) % P; // camera keeps pace ahead of the car: the road flows away from it, under the car
  for (let i = -1; i < 18; i++) {
    const d0 = 1200 + i * P + off, d1 = d0 + 4000;
    if (d1 < 1300) continue;
    const a = Math.max(1300, d0);
    const pts = [a, d1].flatMap((d, j) => {
      const w = 110;
      const p1 = proj(cam, cl(d) - w, d), p2 = proj(cam, cl(d) + w, d);
      return j === 0 ? [p1, p2] : [p2, p1];
    });
    stripes.push(<polygon key={`d${i}`} points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill={C.cream} opacity={0.85} />);
  }
  const kerbs: React.ReactNode[] = [];
  if (kerb) {
    const KP = 1800;
    const koff = ((travel % (2 * KP)) + 2 * KP) % (2 * KP);
    for (let i = -2; i < 70; i++) {
      const d0 = 1200 + i * KP + koff - 2 * KP, d1 = d0 + KP;
      if (d1 < 1300) continue;
      const a = Math.max(1300, d0);
      const inner = ROAD_HALF - 150, outer = ROAD_HALF + 650;
      const p = [proj(cam, cl(a) + inner, a), proj(cam, cl(a) + outer, a), proj(cam, cl(d1) + outer, d1), proj(cam, cl(d1) + inner, d1)];
      kerbs.push(<polygon key={`k${i}`} points={p.map((q) => `${q.x},${q.y}`).join(' ')} fill={i % 2 === 0 ? C.coral : C.cream} />);
    }
  }
  return (
    <g>
      <defs>
        <linearGradient id="fsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE7E4" />
          <stop offset="1" stopColor="#FAF3DF" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#fsky)" />
      <path d={`M 0 ${cam.horizon + 4} C 300 ${cam.horizon - 120} 520 ${cam.horizon - 60} 760 ${cam.horizon - 20} C 1000 ${cam.horizon - 130} 1300 ${cam.horizon - 150} 1600 ${cam.horizon - 40} C 1750 ${cam.horizon - 80} 1850 ${cam.horizon - 60} 1920 ${cam.horizon - 20} L 1920 ${cam.horizon + 4} Z`} fill="#BFE0D8" stroke={C.ink} strokeWidth={3} strokeOpacity={0.35} />
      <rect x={0} y={cam.horizon} width={1920} height={1080} fill="#CFE3B8" />
      <polygon points={roadPts} fill="#8F999D" />
      {kerbs}
      {stripes}
      {bumps.map((b, i) => {
        // strip spans [ahead - len, ahead] in front of the car (toward the camera): camera distance dCar - ahead .. + len
        const a = dCar - (b.s - travel), e = a + b.len;
        if (e < 1300 || a > 150000) return null;
        const x0 = b.side === 1 ? 300 : -ROAD_HALF + 400, x1 = b.side === -1 ? -300 : ROAD_HALF - 400;
        const aa = Math.max(1300, a);
        const p = [proj(cam, cl(aa) + x0, aa), proj(cam, cl(aa) + x1, aa), proj(cam, cl(e) + x1, e), proj(cam, cl(e) + x0, e)];
        // raised strip: lit top plus a darker face on the camera side (height b.h)
        const lip = [proj(cam, cl(aa) + x0, aa, b.h), proj(cam, cl(aa) + x1, aa, b.h)];
        return (
          <g key={`b${i}`}>
            <polygon points={[p[0], p[1], lip[1], lip[0]].map((q) => `${q.x},${q.y}`).join(' ')} fill="#6E777C" />
            <polygon points={[lip[0], lip[1], proj(cam, cl(e) + x1, e, b.h), proj(cam, cl(e) + x0, e, b.h)].map((q) => `${q.x},${q.y}`).join(' ')} fill="#B9C1C4" stroke={C.ink} strokeWidth={2.5} strokeOpacity={0.6} />
          </g>
        );
      })}
      {/* road edge lines */}
      <polyline points={edge(-1).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.ink} strokeWidth={3} strokeOpacity={0.5} />
      <polyline points={edge(1).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.ink} strokeWidth={3} strokeOpacity={0.5} />
    </g>
  );
};
