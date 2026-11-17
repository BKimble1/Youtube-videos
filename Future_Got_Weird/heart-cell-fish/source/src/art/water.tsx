// The tank the fish swims in, drawn through the same 3D camera as the fish: a glass-bottomed culture tank over a
// millimetre grid (the way the swimming was measured), lit from above. Water depth is carried by layered colour,
// light shafts, caustics moving on the floor, suspended motes at real depths (near ones large and soft), the fish's
// soft shadow on the floor, and a gentle refraction shimmer on everything behind the fish.
import React from 'react';
import {Basis, proj, sub3, dot3, V2, V3} from '../core/cam';
import {mix} from '../dc/color';

export const TANK = {x0: -1400, x1: 1400, z0: -420, z1: 420, floor: 270, surf: -330};
export const WATER = {top: '#5FB3BE', mid: '#3A8E9E', deep: '#235F70', haze: '#4D9BAA', light: '#D8F6F2'};

const near = 4;
/** clip a world segment to the camera's near plane and project it */
export const segProj = (B: Basis, a: V3, b: V3): [V2 & {s: number}, V2 & {s: number}] | null => {
  const za = dot3(sub3(a, B.eye), B.fw), zb = dot3(sub3(b, B.eye), B.fw);
  if (za < near && zb < near) return null;
  let A = a, Bp = b;
  if (za < near) {
    const t = (near - za) / (zb - za);
    A = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  } else if (zb < near) {
    const t = (near - za) / (zb - za);
    Bp = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  return [proj(B, A), proj(B, Bp)];
};
const f1 = (n: number) => n.toFixed(1);
/** project a world polyline, splitting where it passes behind the camera */
export const polyProj = (B: Basis, pts: V3[]): string => {
  let d = '';
  let pen = false;
  for (let i = 0; i < pts.length - 1; i++) {
    const s = segProj(B, pts[i], pts[i + 1]);
    if (!s) {
      pen = false;
      continue;
    }
    if (!pen) d += `M${f1(s[0].x)},${f1(s[0].y)}`;
    d += `L${f1(s[1].x)},${f1(s[1].y)}`;
    pen = true;
  }
  return d;
};
/** world -> screen of a polygon on a plane, clipped to the near plane (Sutherland-Hodgman on one plane) */
export const polyClip = (B: Basis, pts: V3[]): V2[] => {
  const out: V3[] = [];
  const zz = pts.map((p) => dot3(sub3(p, B.eye), B.fw));
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    const a = pts[i], b = pts[j];
    const ina = zz[i] >= near, inb = zz[j] >= near;
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = (near - zz[i]) / (zz[j] - zz[i]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
    }
  }
  return out.map((p) => proj(B, p));
};
const pathPts = (p: V2[]) => (p.length ? 'M' + p.map((q) => `${f1(q.x)},${f1(q.y)}`).join('L') + 'Z' : '');

const hash = (i: number, s = 0) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** the far water: colour depth, the back glass with the lab beyond, the floor (grid, caustics), shafts */
export const WaterBG: React.FC<{id: string; B: Basis; t: number; shadow?: {p: V3; len: number; yaw: number; op?: number}[]; grid?: number; tint?: number}> = ({id, B, t, shadow = [], grid = 1}) => {
  // the floor: a large quad, its grid lines and the caustic web
  const F = TANK.floor;
  const fq = polyClip(B, [[TANK.x0, F, TANK.z0], [TANK.x1, F, TANK.z0], [TANK.x1, F, TANK.z1], [TANK.x0, F, TANK.z1]]);
  const back = polyClip(B, [[TANK.x0, TANK.surf, TANK.z0], [TANK.x1, TANK.surf, TANK.z0], [TANK.x1, F, TANK.z0], [TANK.x0, F, TANK.z0]]);
  const lines: string[] = [];
  const fine: string[] = [];
  for (let x = Math.ceil(TANK.x0 / 50) * 50; x <= TANK.x1; x += 50) {
    const d = polyProj(B, [[x, F, TANK.z0], [x, F, 0], [x, F, TANK.z1]]);
    (x % 100 === 0 ? lines : fine).push(d);
  }
  for (let z = Math.ceil(TANK.z0 / 50) * 50; z <= TANK.z1; z += 50) {
    const d = polyProj(B, [[TANK.x0, F, z], [0, F, z], [TANK.x1, F, z]]);
    (z % 100 === 0 ? lines : fine).push(d);
  }
  // caustics: two families of wavy bright lines drifting across the floor
  const caus: string[] = [];
  const ph = t * 0.9;
  for (let k = -16; k <= 16; k++) {
    const x0 = k * 85;
    const pa: V3[] = [], pb: V3[] = [];
    for (let j = 0; j <= 18; j++) {
      const z = TANK.z0 + ((TANK.z1 - TANK.z0) * j) / 18;
      pa.push([x0 + 26 * Math.sin(z / 61 + ph + k * 1.7) + 12 * Math.sin(z / 23 - ph * 1.3), F - 0.5, z]);
    }
    for (let j = 0; j <= 30; j++) {
      const x = TANK.x0 + ((TANK.x1 - TANK.x0) * j) / 30;
      pb.push([x, F - 0.5, k * 30 + 22 * Math.sin(x / 70 - ph * 1.1 + k * 2.3) + 9 * Math.sin(x / 27 + ph)]);
    }
    caus.push(polyProj(B, pa), polyProj(B, pb));
  }
  const sF = proj(B, [0, F, 0]).s;
  const gW = Math.max(0.6, Math.min(2.4, sF * 1.4));
  // shafts of light from the surface, fixed to the world's x so they parallax with the camera
  const shafts = [-900, -520, -180, 160, 470, 820, 1150].map((x, i) => {
    const sway = 30 * Math.sin(t * 0.5 + i * 1.9);
    const a = proj(B, [x + sway, TANK.surf, -200 + i * 40]);
    const b = proj(B, [x + 260 + sway, F, -120 + i * 40]);
    const w = 30 + 40 * hash(i, 3);
    return {a, b, w: w * Math.max(0.6, Math.min(2.2, a.s * 2)), op: 0.08 + 0.06 * hash(i, 5)};
  });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-wg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={WATER.top} />
          <stop offset="0.5" stopColor={WATER.mid} />
          <stop offset="1" stopColor={WATER.deep} />
        </linearGradient>
        <filter id={`${id}-ref`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed="4" result="n" />
          <feOffset in="n" dx={f1(40 * Math.sin(t * 0.7))} dy={f1(-60 * t)} result="no" />
          <feDisplacementMap in="SourceGraphic" in2="no" scale="14" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id={`${id}-sb`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <rect x={-50} y={-50} width={1180} height={2020} fill={`url(#${id}-wg)`} />
      <g filter={`url(#${id}-ref)`}>
        {back.length > 2 && (
          <g>
            <path d={pathPts(back)} fill={mix(WATER.mid, '#8FB8C0', 0.25)} opacity={0.55} />
          </g>
        )}
        {fq.length > 2 && (
          <g>
            <path d={pathPts(fq)} fill={mix('#CFE7E6', WATER.deep, 0.35)} />
            <path d={fine.join('')} fill="none" stroke="#2C6E79" strokeWidth={gW * 0.5} opacity={0.35 * grid} />
            <path d={lines.join('')} fill="none" stroke="#24606B" strokeWidth={gW} opacity={0.55 * grid} />
            <path d={caus.join('')} fill="none" stroke="#F4FFFB" strokeWidth={gW * 2.2} opacity={0.2} strokeLinecap="round" />
          </g>
        )}
        {shadow.map((sh, i) => {
          const c = proj(B, [sh.p[0], F - 1, sh.p[2]]);
          const a = proj(B, [sh.p[0] + Math.cos((sh.yaw * Math.PI) / 180) * sh.len * 0.5, F - 1, sh.p[2] - Math.sin((sh.yaw * Math.PI) / 180) * sh.len * 0.5]);
          const rx = Math.hypot(a.x - c.x, a.y - c.y);
          const ang = (Math.atan2(a.y - c.y, a.x - c.x) * 180) / Math.PI;
          return <ellipse key={i} cx={f1(c.x)} cy={f1(c.y)} rx={f1(rx)} ry={f1(Math.max(3, rx * 0.16))} transform={`rotate(${f1(ang)} ${f1(c.x)} ${f1(c.y)})`} fill="#0F3540" opacity={0.28 * (sh.op ?? 1)} filter={`url(#${id}-sb)`} />;
        })}
      </g>
      {/* haze: distance fog toward the deep colour */}
      <rect x={-50} y={-50} width={1180} height={2020} fill={WATER.haze} opacity={0.18} />
      <g style={{mixBlendMode: 'screen'}}>
        {shafts.map((s, i) => (
          <path key={i} d={`M${f1(s.a.x - s.w)},${f1(s.a.y)} L${f1(s.a.x + s.w)},${f1(s.a.y)} L${f1(s.b.x + s.w * 2.4)},${f1(s.b.y)} L${f1(s.b.x - s.w * 2.4)},${f1(s.b.y)} Z`} fill={WATER.light} opacity={s.op} filter={`url(#${id}-blur)`} />
        ))}
      </g>
    </g>
  );
};

/** suspended motes in a volume around a centre; near ones big and soft. Split by depth so the fish can sit between. */
export const MOTES: V3[] = Array.from({length: 220}, (_, i) => [
  TANK.x0 + (TANK.x1 - TANK.x0) * hash(i, 1),
  TANK.surf + (TANK.floor - TANK.surf) * hash(i, 2),
  TANK.z0 + (TANK.z1 - TANK.z0) * hash(i, 7),
]);
export const Motes: React.FC<{id: string; B: Basis; t: number; zMin?: number; zMax?: number; drift?: V3}> = ({id, B, t, zMin = 0, zMax = 1e9, drift = [0, 0, 0]}) => {
  const out: React.ReactNode[] = [];
  MOTES.forEach((m, i) => {
    const p: V3 = [m[0] + drift[0] + 12 * Math.sin(t * 0.6 + i), m[1] + drift[1] - 8 * t + 10 * Math.sin(t * 0.4 + i * 2.1), m[2] + drift[2]];
    const q = proj(B, p);
    if (q.z < 6 || q.z < zMin || q.z >= zMax) return;
    if (q.x < -80 || q.x > 1160 || q.y < -80 || q.y > 2000) return;
    const r = Math.min(40, (0.9 + 1.6 * hash(i, 9)) * q.s);
    if (r < 0.5) return;
    const soft = r > 9;
    out.push(<circle key={i} cx={f1(q.x)} cy={f1(q.y)} r={f1(r)} fill="#E9FFFB" opacity={soft ? 0.18 : 0.35 + 0.25 * hash(i, 4)} filter={soft ? `url(#${id}-mb)` : undefined} />);
  });
  return (
    <g>
      <defs>
        <filter id={`${id}-mb`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      {out}
    </g>
  );
};

/** water pushed by the tail: small swirls shed at the tail tip each stroke, drifting back and fading */
export type Swirl = {p: V3; age: number; dir: 1 | -1; size: number};
export const Wake: React.FC<{B: Basis; swirls: Swirl[]}> = ({B, swirls}) => (
  <g>
    {swirls.map((w, i) => {
      const q = proj(B, w.p);
      if (q.z < 6) return null;
      const life = Math.max(0, 1 - w.age / 1.1);
      if (life <= 0) return null;
      if (q.s > 9) return null;
      const r = Math.min(150, (w.size * (0.6 + 0.9 * Math.min(1, w.age * 2))) * q.s);
      const a0 = w.age * 5 * w.dir;
      const arc = (k: number) => {
        const a = a0 + k * 2.1;
        const p0 = {x: q.x + Math.cos(a) * r, y: q.y + Math.sin(a) * r * 0.55};
        const p1 = {x: q.x + Math.cos(a + 1.5 * w.dir) * r, y: q.y + Math.sin(a + 1.5 * w.dir) * r * 0.55};
        return `M${f1(p0.x)},${f1(p0.y)} A${f1(r)},${f1(r * 0.55)} 0 0,${w.dir > 0 ? 1 : 0} ${f1(p1.x)},${f1(p1.y)}`;
      };
      return <path key={i} d={arc(0) + arc(1) + arc(2)} fill="none" stroke="#E6FFFA" strokeWidth={f1(Math.max(1, 0.35 * q.s * w.size * 0.12))} strokeLinecap="round" opacity={0.42 * life} />;
    })}
  </g>
);
