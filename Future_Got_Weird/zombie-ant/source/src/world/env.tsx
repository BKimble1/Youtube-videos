// The forest understory around the plants: a sky/canopy dome that depends on where the camera looks, soft far
// foliage and sun flecks (in the world, so they parallax), and a leaf-litter floor at z = 0.
import React from 'react';
import {add3, basis, Basis, Cam3, dot3, mul3, P2, proj, projPoly, smoothClosed, sub3, V3} from '../core/three';
import {capsuleItem, Item} from '../core/draw3';
import {lit, mix, rgba, shade} from '../core/color';
import {INK} from '../core/ink';
import {hash} from '../lib';

const f2 = (n: number) => n.toFixed(2);
/** colour of the far forest seen at a given elevation (deg) */
const domeCol = (el: number) => {
  const stops: [number, string][] = [[-40, '#1E3024'], [-12, '#2B4631'], [0, '#41664A'], [12, '#77A062'], [30, '#B9D58E'], [60, '#DCEBB0']];
  if (el <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (el <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (el - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
};
/** elevation (deg) of the camera ray through screen point (x, y) */
const rayEl = (B: Basis, x: number, y: number) => {
  const dx = (x - B.cx) / B.f, dy = -(y - B.cy) / B.f;
  let r = add3(B.fw, add3(mul3(B.r, dx), mul3(B.u, dy)));
  const L = Math.hypot(r[0], r[1], r[2]);
  return (Math.asin(r[2] / L) * 180) / Math.PI;
};

export const Dome: React.FC<{B: Basis; light: number; ns?: string}> = ({B, light, ns = ''}) => {
  const ys = [0, 384, 768, 1152, 1536, 1920];
  const id = `${ns}dome`;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          {ys.map((y, k) => (
            <stop key={k} offset={f2(y / 1920)} stopColor={shade(domeCol(rayEl(B, 540, y)), (1 - light) * 0.6)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id})`} />
    </svg>
  );
};

/** far foliage masses and sun flecks, fixed in the world far from the set */
const FAR: {p: V3; r: number; c: string; a: number}[] = Array.from({length: 46}, (_, k) => {
  const az = hash(k * 3.1) * Math.PI * 2;
  const el = -0.15 + hash(k * 7.7) * 0.75;
  const d = 380 + hash(k * 1.9) * 260;
  const p: V3 = [Math.cos(az) * Math.cos(el) * d, 40 + Math.sin(az) * Math.cos(el) * d, 40 + Math.sin(el) * d];
  const dark = hash(k * 5.3) < 0.55;
  return {p, r: 40 + hash(k * 2.3) * 70, c: dark ? '#2F5233' : '#6F9C5A', a: 0.35 + hash(k * 9.1) * 0.35};
});
const FLECK: {p: V3; r: number}[] = Array.from({length: 28}, (_, k) => {
  const az = hash(k * 13.1 + 1) * Math.PI * 2;
  const el = 0.05 + hash(k * 3.7 + 2) * 0.8;
  const d = 300 + hash(k * 4.9) * 200;
  return {p: [Math.cos(az) * Math.cos(el) * d, 40 + Math.sin(az) * Math.cos(el) * d, 40 + Math.sin(el) * d] as V3, r: 4 + hash(k * 6.1) * 7};
});

export const FarLayer: React.FC<{B: Basis; light: number; blur: number; ns?: string}> = ({B, light, blur, ns = ''}) => {
  const els: {z: number; el: React.ReactNode}[] = [];
  const sky = (p: V3): V3 => add3(B.eye, sub3(p, [0, 40, 40]));
  FAR.forEach((q, k) => {
    const P = proj(B, sky(q.p));
    if (P.z < 10) return;
    const R = q.r * P.s;
    if (P.x < -R || P.x > 1080 + R || P.y < -R || P.y > 1920 + R) return;
    els.push({
      z: P.z,
      el: (
        <ellipse key={`f${k}`} cx={f2(P.x)} cy={f2(P.y)} rx={f2(R)} ry={f2(R * 0.8)} fill={`url(#${ns}farg${k % 2})`} opacity={q.a} />
      ),
    });
  });
  FLECK.forEach((q, k) => {
    const P = proj(B, sky(q.p));
    if (P.z < 10) return;
    const R = q.r * P.s * (1 + blur * 0.6);
    if (P.x < -R || P.x > 1080 + R || P.y < -R || P.y > 1920 + R) return;
    els.push({z: P.z - 1, el: <circle key={`k${k}`} cx={f2(P.x)} cy={f2(P.y)} r={f2(R)} fill={`url(#${ns}fleck)`} opacity={0.55 * light} />});
  });
  els.sort((a, b) => b.z - a.z);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <radialGradient id={`${ns}farg0`}><stop offset="0" stopColor="#24432B" stopOpacity="0.9" /><stop offset="0.7" stopColor="#24432B" stopOpacity="0.5" /><stop offset="1" stopColor="#24432B" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${ns}farg1`}><stop offset="0" stopColor="#86B068" stopOpacity="0.85" /><stop offset="0.7" stopColor="#86B068" stopOpacity="0.45" /><stop offset="1" stopColor="#86B068" stopOpacity="0" /></radialGradient>
        <radialGradient id={`${ns}fleck`}><stop offset="0" stopColor="#FFF6D0" stopOpacity="0.95" /><stop offset="0.45" stopColor="#F3EDB4" stopOpacity="0.55" /><stop offset="1" stopColor="#F3EDB4" stopOpacity="0" /></radialGradient>
      </defs>
      {els.map((e) => e.el)}
    </svg>
  );
};

// ------------------------------------------------------------------ the floor
type Litter = {x: number; y: number; yaw: number; L: number; Wd: number; c: string; kind: 0 | 1 | 2};
const LCOL = ['#6E4A2E', '#8B653A', '#5A3E28', '#9C7845', '#7B5A36', '#4F5A2E'];
export const LITTER: Litter[] = Array.from({length: 170}, (_, k) => {
  const kind = hash(k * 4.3) < 0.8 ? 0 : hash(k * 4.3) < 0.92 ? 1 : 2;
  return {
    x: -150 + hash(k * 1.7) * 270,
    y: -60 + hash(k * 2.9) * 260,
    yaw: hash(k * 3.3) * 360,
    L: kind === 1 ? 10 + hash(k * 6.6) * 18 : 6 + hash(k * 5.1) * 11,
    Wd: 3 + hash(k * 8.2) * 4,
    c: LCOL[Math.floor(hash(k * 7.1) * LCOL.length)],
    kind,
  };
});
export const floorItems = (B: Basis, light: number, ns = ''): React.ReactNode => {
  const big = projPoly(B, [[-3000, -3000, 0], [3000, -3000, 0], [3000, 3000, 0], [-3000, 3000, 0]], 3);
  // the floor's horizon on screen: fog it into the far forest
  const fh = Math.hypot(B.fw[0], B.fw[1]) || 1;
  const hz = proj(B, [B.eye[0] + (B.fw[0] / fh) * 1e5, B.eye[1] + (B.fw[1] / fh) * 1e5, 0]);
  const fogBand = 260;
  const parts: {z: number; el: React.ReactNode}[] = [];
  LITTER.forEach((q, k) => {
    const c: V3 = [q.x, q.y, 0];
    const P = proj(B, c);
    if (P.z < 3) return;
    const R = q.L * P.s;
    if (P.x < -R || P.x > 1080 + R || P.y < -R || P.y > 1920 + R) return;
    const a = (q.yaw * Math.PI) / 180;
    const d: V3 = [Math.cos(a), Math.sin(a), 0], n: V3 = [-Math.sin(a), Math.cos(a), 0];
    const zz = 0.02 + (k % 7) * 0.012;
    if (q.kind === 1) {
      // a twig
      const p0 = add3(c, mul3(d, -q.L / 2)), p1 = add3(c, mul3(d, q.L / 2));
      const it = capsuleItem(B, [p0[0], p0[1], 0.35], [p1[0], p1[1], 0.3], 0.35, 0.25, '#5B4330', {spec: 0.3});
      parts.push({z: P.z, el: <g key={`t${k}`}>{it.el}</g>});
      return;
    }
    const pts: V3[] = [];
    for (let j = 0; j <= 10; j++) {
      const u = j / 10;
      const w = (q.Wd / 2) * Math.sin(Math.PI * u) * (q.kind === 2 ? 1.6 : 1);
      pts.push(add3(c, add3(mul3(d, (u - 0.5) * q.L), mul3(n, w))));
    }
    for (let j = 9; j >= 1; j--) {
      const u = j / 10;
      const w = (q.Wd / 2) * Math.sin(Math.PI * u) * (q.kind === 2 ? 1.6 : 1);
      pts.push(add3(c, add3(mul3(d, (u - 0.5) * q.L), mul3(n, -w))));
    }
    const sp = pts.map((p) => proj(B, [p[0], p[1], zz]));
    const col = q.kind === 2 ? '#3F6A35' : q.c;
    const a0 = proj(B, add3(c, mul3(d, -q.L / 2))), a1 = proj(B, add3(c, mul3(d, q.L / 2)));
    parts.push({
      z: P.z,
      el: (
        <g key={`l${k}`}>
          <path d={smoothClosed(sp)} fill={col} stroke={shade(col, 0.55)} strokeWidth={f2(Math.max(0.6, 0.12 * P.s))} />
          {q.kind === 0 && <path d={`M${P2(a0)} L${P2(a1)}`} stroke={lit(col, 0.25)} strokeWidth={f2(Math.max(0.5, 0.1 * P.s))} opacity={0.7} />}
        </g>
      ),
    });
  });
  parts.sort((a, b) => b.z - a.z);
  const floorC = shade('#4A3826', (1 - light) * 0.5);
  return (
    <g>
      <defs>
        <linearGradient id={`${ns}floorg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mix(floorC, '#3B5238', 0.55)} />
          <stop offset="1" stopColor={floorC} />
        </linearGradient>
      </defs>
      {big && <path d={big} fill={`url(#${ns}floorg)`} />}
      {parts.map((p) => p.el)}
      {hz.z > 0 && hz.y > -fogBand && hz.y < 1920 + fogBand && (
        <g>
          <defs>
            <linearGradient id={`${ns}floorfog`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(hz.y - 160)} x2="0" y2={f2(hz.y + fogBand)}>
              <stop offset="0" stopColor={mix(floorC, '#3A5A3C', 0.8)} stopOpacity="0" />
              <stop offset="0.38" stopColor={mix(floorC, '#3A5A3C', 0.7)} stopOpacity="0.95" />
              <stop offset="0.6" stopColor={mix(floorC, '#3A5A3C', 0.5)} stopOpacity="0.7" />
              <stop offset="1" stopColor={mix(floorC, '#3A5A3C', 0.35)} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={-10} y={f2(hz.y - 160)} width={1100} height={f2(fogBand + 160)} fill={`url(#${ns}floorfog)`} />
        </g>
      )}
    </g>
  );
};
