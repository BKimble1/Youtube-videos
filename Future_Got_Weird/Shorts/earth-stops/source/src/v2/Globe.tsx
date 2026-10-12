import React from 'react';
import {C} from '../theme';
import {rand} from '../lib/anim';
import {GLOBE, globeAngle, globeBlur, ringAge} from './choreoEC';

/**
 * The cause graphic for E-C: a small, flat, stylised planet seen edge-on (north up). Its front surface moves toward +x (east, right) - the same direction she will
 * keep travelling. Abstract landmasses (not a real map). While it spins the landmasses and meridians are motion-blurred along x; when it stops the blur drops to zero
 * on one frame and a single ring leaves the rim. The pin marks "where she is standing".
 */
const {cx: CX, cy: CY, R} = GLOBE;
type Land = {lon: number; lat: number; dl: number; dp: number; seed: number};
const LANDS: Land[] = [
  {lon: -125, lat: 42, dl: 40, dp: 26, seed: 1},
  {lon: -62, lat: -16, dl: 22, dp: 38, seed: 2},
  {lon: 8, lat: 48, dl: 30, dp: 20, seed: 3},
  {lon: 22, lat: -2, dl: 26, dp: 36, seed: 4},
  {lon: 96, lat: 38, dl: 48, dp: 26, seed: 5},
  {lon: 128, lat: -26, dl: 26, dp: 15, seed: 6},
  {lon: -22, lat: -62, dl: 36, dp: 10, seed: 7},
  {lon: 175, lat: 8, dl: 14, dp: 12, seed: 8},
];
const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
type P = {x: number; y: number};
const proj = (lon: number, lat: number, th: number): P & {vis: boolean} => {
  const rel = rad(wrap(lon - th)), ph = rad(lat);
  const x = Math.cos(ph) * Math.sin(rel), y = -Math.sin(ph), c = Math.cos(ph) * Math.cos(rel);
  if (c >= 0) return {x: CX + R * x, y: CY + R * y, vis: true};
  const l = Math.hypot(x, y) || 1; // behind: push onto the limb
  return {x: CX + (R * x) / l, y: CY + (R * y) / l, vis: false};
};
const closed = (pts: P[]): string => {
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
};
const landPath = (l: Land, th: number): string | null => {
  const N = 16;
  const pts: P[] = [];
  let any = false;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, k = 0.72 + 0.5 * rand(l.seed * 31 + i * 5);
    const q = proj(l.lon + l.dl * Math.cos(a) * k, l.lat + l.dp * Math.sin(a) * k, th);
    any = any || q.vis;
    pts.push(q);
  }
  return any ? closed(pts) : null;
};
const meridian = (lon: number, th: number): string => {
  let d = '', pen = false;
  for (let lat = -90; lat <= 90; lat += 6) {
    const q = proj(lon, lat, th);
    if (q.vis) { d += `${pen ? ' L' : ' M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; pen = true; } else pen = false;
  }
  return d;
};

export const Globe: React.FC<{f: number}> = ({f}) => {
  const th = globeAngle(f), blur = globeBlur(f), ra = ringAge(f);
  const clip = `M ${CX - R} ${CY} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z`;
  const pinX = CX, pinY = CY + R * 0.74;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="globeClip"><path d={clip} /></clipPath>
        <filter id="globeBlur" filterUnits="userSpaceOnUse" x={CX - R - 60} y={CY - R - 20} width={2 * R + 120} height={2 * R + 40}>
          <feGaussianBlur stdDeviation={`${Math.max(0.01, blur)} 0`} />
        </filter>
      </defs>
      {ra >= 0 && <circle cx={CX} cy={CY} r={R + 14 + ra * 120} fill="none" stroke={C.coral} strokeWidth={14 * (1 - ra) + 3} opacity={0.95 * (1 - ra)} />}
      <circle cx={CX} cy={CY} r={R + 16} fill={C.cream} opacity={0.4} />
      <circle cx={CX} cy={CY} r={R} fill={C.teal} />
      <g clipPath="url(#globeClip)">
        <g filter={blur > 0.4 ? 'url(#globeBlur)' : undefined}>
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = CY - R * Math.sin(rad(lat)), w = R * Math.cos(rad(lat));
            return <line key={lat} x1={CX - w} y1={y} x2={CX + w} y2={y} stroke={C.cream} strokeWidth={3} opacity={0.3} />;
          })}
          {Array.from({length: 12}).map((_, i) => <path key={i} d={meridian(-180 + i * 30, th)} fill="none" stroke={C.cream} strokeWidth={3} opacity={0.3} />)}
          {LANDS.map((l) => {
            const d = landPath(l, th);
            return d ? <path key={l.seed} d={d} fill={C.saffronLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /> : null;
          })}
        </g>
        {/* soft terminator: the lower-right of the disc is in shade */}
        <path d={`${clip} M ${CX - 60} ${CY - 50} m ${-R * 1.08} 0 a ${R * 1.08} ${R * 1.08} 0 1 0 ${2 * R * 1.08} 0 a ${R * 1.08} ${R * 1.08} 0 1 0 ${-2 * R * 1.08} 0 Z`} fillRule="evenodd" fill={C.ink} opacity={0.2} />
      </g>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke={C.ink} strokeWidth={7} />
      <g>
        {ra >= 0 && <circle cx={pinX} cy={pinY} r={14 + ra * 26} fill="none" stroke={C.coral} strokeWidth={5} opacity={1 - ra} />}
        <circle cx={pinX} cy={pinY} r={16} fill={C.coral} stroke={C.ink} strokeWidth={5} />
        <circle cx={pinX} cy={pinY} r={5} fill={C.cream} />
      </g>
    </svg>
  );
};
