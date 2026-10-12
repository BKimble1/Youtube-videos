import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {Chip, cl, lerp, popScale, ramp, sm} from './ui';
import {T} from './timeline';

/**
 * B05, V2: one short camera move from the equator to a small path near the pole. The globe is tilted so the north pole comes into view as the camera rises (tilt 24 -> 62 deg).
 * Both markers circle at the SAME angular rate, so the screen speed (and the length of the trail behind each marker) is proportional to cos(latitude): long at the equator, short at 75 N.
 * No numbers, no chart: "closer to the poles, that starting speed is lower".
 */
const R = 380, CX = 540;
const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
export const tiltAt = (f: number) => lerp(24, 64, E.inOut(cl((f - T.latMove0) / (T.latMove1 - T.latMove0))));
export const cyAt = (f: number) => lerp(1080, 930, E.inOut(cl((f - T.latMove0) / (T.latMove1 - T.latMove0))));
const proj = (lon: number, lat: number, e: number, cy: number, th: number) => {
  const l = rad(wrap(lon - th)), p = rad(lat), te = rad(e);
  const X = Math.cos(p) * Math.sin(l), Y = Math.sin(p), Z = Math.cos(p) * Math.cos(l);
  const Y2 = Y * Math.cos(te) - Z * Math.sin(te), Z2 = Y * Math.sin(te) + Z * Math.cos(te);
  if (Z2 >= 0) return {x: CX + R * X, y: cy - R * Y2, vis: true};
  const n = Math.hypot(X, Y2) || 1;
  return {x: CX + (R * X) / n, y: cy - (R * Y2) / n, vis: false};
};
const closed = (pts: {x: number; y: number}[]) => {
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
};
const LANDS = [
  {lon: -100, lat: 40, dl: 40, dp: 20}, {lon: -40, lat: 66, dl: 34, dp: 12}, {lon: 15, lat: 50, dl: 34, dp: 16}, {lon: 80, lat: 56, dl: 50, dp: 14}, {lon: 140, lat: 42, dl: 36, dp: 18},
  {lon: -70, lat: -6, dl: 20, dp: 26}, {lon: 25, lat: 4, dl: 24, dp: 30}, {lon: 110, lat: -8, dl: 26, dp: 14}, {lon: -160, lat: 62, dl: 28, dp: 12}, {lon: 175, lat: 72, dl: 24, dp: 8}, {lon: -10, lat: 80, dl: 40, dp: 6},
];
const OMEGA = 5; // degrees of longitude per frame (the planet's angular rate is the same everywhere)

export const Lat2: React.FC<{f: number; graphics: boolean}> = ({f, graphics}) => {
  const e = tiltAt(f), cy = cyAt(f), th = -f * 0.6; // the globe itself turns slowly under the markers
  const clip = `M ${CX - R} ${cy} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z`;
  const ring = (lat: number, front: boolean) => {
    let d = ''; let pen = false;
    for (let lon = -180; lon <= 180; lon += 6) {
      const q = proj(lon + th, lat, e, cy, th), vis = q.vis === front;
      if (vis) { d += `${pen ? ' L' : ' M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; pen = true; } else pen = false;
    }
    return d;
  };
  const marker = (lat: number, lon0: number, col: string, trailSpan: number, k: number) => {
    const lon = lon0 + OMEGA * f * 1; // east = increasing longitude
    const pts: {x: number; y: number}[] = [];
    for (let a = 0; a <= trailSpan; a += 3) { const q = proj(lon - a + th, lat, e, cy, th); if (q.vis) pts.push(q); }
    const head = proj(lon + th, lat, e, cy, th);
    if (!head.vis) return null;
    const d = pts.length > 1 ? 'M ' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ') : '';
    return (
      <g opacity={k}>
        {d && <path d={d} fill="none" stroke={C.ink} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />}
        {d && <path d={d} fill="none" stroke={col} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />}
        {pts.length > 2 && (() => { const a = pts[1], dx = head.x - a.x, dy = head.y - a.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux; return <path d={`M ${head.x + ux * 34} ${head.y + uy * 34} L ${head.x + nx * 26} ${head.y + ny * 26} L ${head.x - nx * 26} ${head.y - ny * 26} Z`} fill={col} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />; })()}
        <circle cx={head.x} cy={head.y} r={22} fill={col} stroke={C.ink} strokeWidth={6} />
        <circle cx={head.x} cy={head.y} r={7} fill={C.cream} />
      </g>
    );
  };
  const eq = ramp(f, T.latA + 6, T.latA + 14, (x) => x), pole = ramp(f, T.latMove0 + 14, T.latMove0 + 22, (x) => x);
  const eqHead = proj(OMEGA * f + th + 0 * 90, 0, e, cy, th);
  const poHead = proj(60 + OMEGA * f + th, 75, e, cy, th);
  const chipEq = popScale(f, T.latA + 8) * (1 - ramp(f, T.latMove0 + 6, T.latMove0 + 14, (x) => x));
  const chipPole = popScale(f, T.latMove0 + 20);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <rect x={-100} y={-100} width={W + 200} height={H + 200} fill={C.paper} />
        {[460, 700, 940, 1180, 1420].map((r, i) => <circle key={i} cx={CX} cy={cy} r={r} fill="none" stroke={C.paperLine} strokeWidth={6} opacity={0.7} />)}
        <circle cx={CX} cy={cy} r={R + 18} fill={C.cream} opacity={0.5} />
        <circle cx={CX} cy={cy} r={R} fill={C.teal} />
        <clipPath id="latClip"><path d={clip} /></clipPath>
        <g clipPath="url(#latClip)">
          {[-60, -30, 30, 60].map((lat) => <path key={lat} d={ring(lat, true)} fill="none" stroke={C.cream} strokeWidth={3} opacity={0.3} />)}
          {LANDS.map((l, i) => {
            const pts = Array.from({length: 16}).map((_, k) => { const a = (k / 16) * Math.PI * 2, kk = 0.72 + 0.5 * rand(i * 31 + k * 5); return proj(l.lon + l.dl * Math.cos(a) * kk, l.lat + l.dp * Math.sin(a) * kk, e, cy, th); });
            return pts.some((p) => p.vis) ? <path key={i} d={closed(pts)} fill={C.saffronLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /> : null;
          })}
          <path d={ring(0, true)} fill="none" stroke={C.coral} strokeWidth={5} opacity={0.95} />
          <path d={ring(75, true)} fill="none" stroke={C.coral} strokeWidth={5} opacity={0.95} />
          <path d={`${clip} M ${CX - 60} ${cy - 50} m ${-R * 1.08} 0 a ${R * 1.08} ${R * 1.08} 0 1 0 ${2 * R * 1.08} 0 a ${R * 1.08} ${R * 1.08} 0 1 0 ${-2 * R * 1.08} 0 Z`} fillRule="evenodd" fill={C.ink} opacity={0.2} />
        </g>
        <circle cx={CX} cy={cy} r={R} fill="none" stroke={C.ink} strokeWidth={8} />
        {marker(0, 0, C.saffron, 62, eq)}
        {marker(75, 60, C.saffron, 62, pole)}
        {graphics && (
          <g>
            <Chip x={clamp(eqHead.x, 260, 820)} y={eqHead.y + 96} w={250} text="EQUATOR" tone="still" scale={chipEq} />
            <Chip x={clamp(poHead.x, 280, 800)} y={poHead.y + 96} w={310} text="NEAR A POLE" tone="still" scale={chipPole} />
          </g>
        )}
      </svg>
    </div>
  );
};
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
void sm;
