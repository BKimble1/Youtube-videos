import React from 'react';
import {C} from '../theme';
import {rand} from '../lib/anim';
import {GLOBE_STOP} from './choreoH';

/**
 * H1 globe: flat, stylised planet seen edge-on, north up; its front surface moves toward +x (east). No ring, no pulse, no shock: it stops by going from motion-blurred to dead still
 * on one frame. The CLOUD layer is loose: after the surface freezes the clouds keep sliding east and slow down (the same idea as the loose things in the street).
 * An equator line and a pin at the centre (the street she is on) tie it to the scene.
 */
export const SPIN = 9; // deg per frame before the stop (about 31 px per frame at the centre of the large globe)
const TAU_C = 4;
export const surfaceAngle = (f: number) => 20 - SPIN * Math.min(f, GLOBE_STOP);
export const cloudAngle = (f: number) => (f <= GLOBE_STOP ? surfaceAngle(f) : surfaceAngle(f) - SPIN * TAU_C * (1 - Math.exp(-(f - GLOBE_STOP) / TAU_C)));
export const cloudSpeed = (f: number) => (f < GLOBE_STOP ? SPIN : SPIN * Math.exp(-(f - GLOBE_STOP) / TAU_C)); // deg per frame
const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
type P = {x: number; y: number};
type Land = {lon: number; lat: number; dl: number; dp: number; seed: number};
const LANDS: Land[] = [
  {lon: -125, lat: 42, dl: 40, dp: 26, seed: 1}, {lon: -62, lat: -16, dl: 22, dp: 38, seed: 2}, {lon: 8, lat: 48, dl: 30, dp: 20, seed: 3}, {lon: 22, lat: -2, dl: 26, dp: 36, seed: 4},
  {lon: 96, lat: 38, dl: 48, dp: 26, seed: 5}, {lon: 128, lat: -26, dl: 26, dp: 15, seed: 6}, {lon: -22, lat: -62, dl: 36, dp: 10, seed: 7}, {lon: 175, lat: 8, dl: 14, dp: 12, seed: 8},
];
const CLOUDS: Land[] = [
  {lon: -150, lat: 20, dl: 30, dp: 7, seed: 21}, {lon: -90, lat: -30, dl: 26, dp: 6, seed: 22}, {lon: -30, lat: 34, dl: 34, dp: 7, seed: 23}, {lon: 40, lat: -12, dl: 30, dp: 6, seed: 24},
  {lon: 100, lat: 14, dl: 28, dp: 6, seed: 25}, {lon: 150, lat: -38, dl: 30, dp: 7, seed: 26}, {lon: 10, lat: 62, dl: 26, dp: 5, seed: 27},
];
const closed = (pts: P[]): string => {
  const n = pts.length;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C ${(p1.x + (p2.x - p0.x) / 6).toFixed(1)} ${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)} ${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
};

/** spin: override for the rewind / "was moving" state: surface angle, cloud angle and the blur of both (px) */
export const GlobeH: React.FC<{f: number; cx: number; cy: number; R: number; id?: string; spin?: {th: number; thc: number; blurS: number; blurC: number}}> = ({f, cx, cy, R, id = 'g', spin}) => {
  const k = Math.max(0.5, R / 200);
  const proj = (lon: number, lat: number, th: number): P & {vis: boolean} => {
    const rel = rad(wrap(lon - th)), ph = rad(lat);
    const x = Math.cos(ph) * Math.sin(rel), y = -Math.sin(ph), c = Math.cos(ph) * Math.cos(rel);
    if (c >= 0) return {x: cx + R * x, y: cy + R * y, vis: true};
    const l = Math.hypot(x, y) || 1;
    return {x: cx + (R * x) / l, y: cy + (R * y) / l, vis: false};
  };
  const blob = (l: Land, th: number): string | null => {
    const pts: P[] = []; let any = false;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, kk = 0.72 + 0.5 * rand(l.seed * 31 + i * 5);
      const q = proj(l.lon + l.dl * Math.cos(a) * kk, l.lat + l.dp * Math.sin(a) * kk, th);
      any = any || q.vis; pts.push(q);
    }
    return any ? closed(pts) : null;
  };
  const meridian = (lon: number, th: number): string => {
    let d = '', pen = false;
    for (let lat = -90; lat <= 90; lat += 6) { const q = proj(lon, lat, th); if (q.vis) { d += `${pen ? ' L' : ' M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; pen = true; } else pen = false; }
    return d;
  };
  const th = spin ? spin.th : surfaceAngle(f), thc = spin ? spin.thc : cloudAngle(f);
  const blurS = spin ? spin.blurS * k : f < GLOBE_STOP ? 9 * k : 0;
  const blurC = spin ? spin.blurC * k : Math.min(12, cloudSpeed(f) * rad(1) * R * 0.34);
  const clip = `M ${cx - R} ${cy} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z`;
  const rimW = 7 * k, landW = 4 * k;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id={`${id}Clip`}><path d={clip} /></clipPath>
        <filter id={`${id}BlurS`} filterUnits="userSpaceOnUse" x={cx - R - 60} y={cy - R - 20} width={2 * R + 120} height={2 * R + 40}><feGaussianBlur stdDeviation={`${Math.max(0.01, blurS)} 0`} /></filter>
        <filter id={`${id}BlurC`} filterUnits="userSpaceOnUse" x={cx - R - 60} y={cy - R - 20} width={2 * R + 120} height={2 * R + 40}><feGaussianBlur stdDeviation={`${Math.max(0.01, blurC)} 0`} /></filter>
      </defs>
      <circle cx={cx} cy={cy} r={R + 16 * k} fill={C.cream} opacity={0.4} />
      <circle cx={cx} cy={cy} r={R} fill={C.teal} />
      <g clipPath={`url(#${id}Clip)`}>
        <g filter={blurS > 0.4 ? `url(#${id}BlurS)` : undefined}>
          {[-60, -30, 30, 60].map((lat) => { const y = cy - R * Math.sin(rad(lat)), w = R * Math.cos(rad(lat)); return <line key={lat} x1={cx - w} y1={y} x2={cx + w} y2={y} stroke={C.cream} strokeWidth={3 * k} opacity={0.3} />; })}
          {Array.from({length: 12}).map((_, i) => <path key={i} d={meridian(-180 + i * 30, th)} fill="none" stroke={C.cream} strokeWidth={3 * k} opacity={0.3} />)}
          {LANDS.map((l) => { const d = blob(l, th); return d ? <path key={l.seed} d={d} fill={C.saffronLight} stroke={C.ink} strokeWidth={landW} strokeLinejoin="round" /> : null; })}
        </g>
        <g filter={blurC > 0.4 ? `url(#${id}BlurC)` : undefined} opacity={0.82}>
          {CLOUDS.map((l) => { const d = blob(l, thc); return d ? <path key={l.seed} d={d} fill={C.white} /> : null; })}
        </g>
        <path d={`${clip} M ${cx - 60 * k} ${cy - 50 * k} m ${-R * 1.08} 0 a ${R * 1.08} ${R * 1.08} 0 1 0 ${2 * R * 1.08} 0 a ${R * 1.08} ${R * 1.08} 0 1 0 ${-2 * R * 1.08} 0 Z`} fillRule="evenodd" fill={C.ink} opacity={0.2} />
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke={C.coral} strokeWidth={4 * k} opacity={0.95} />
      </g>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.ink} strokeWidth={rimW} />
      <circle cx={cx} cy={cy} r={15 * k} fill={C.coral} stroke={C.ink} strokeWidth={5 * k} />
      <circle cx={cx} cy={cy} r={5 * k} fill={C.cream} />
    </svg>
  );
};
