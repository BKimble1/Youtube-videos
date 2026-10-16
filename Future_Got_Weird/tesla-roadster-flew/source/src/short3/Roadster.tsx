// The Roadster's side profile, traced by hand from the owner's recording (rec_224911 at 0:38.50, car midair facing
// left). Only what that frame shows: white body, dark side skirt, dark canopy glass, wheels with flat covers, the red
// tail light. No vents, fans or thruster nozzles: none are identifiable in the footage (research/trace/).
import React from 'react';
import trace from '../data/roadster_profile.json';

type P = [number, number];
const LEVEL = (3.5 * Math.PI) / 180; // the car is pitched ~3.5 deg nose-down in the source frame
const PIV: P = [960, 560];
const rot = ([x, y]: P): P => {
  const dx = x - PIV[0], dy = y - PIV[1];
  return [PIV[0] + dx * Math.cos(LEVEL) - dy * Math.sin(LEVEL), PIV[1] + dx * Math.sin(LEVEL) + dy * Math.cos(LEVEL)];
};

/** Closed Catmull-Rom path through the points; indices in `corners` stay sharp. */
const smooth = (pts: P[], corners: Set<number> = new Set()) => {
  const n = pts.length;
  const g = (i: number) => pts[(i + n) % n];
  let d = `M ${g(0)[0].toFixed(1)} ${g(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const k1 = corners.has(i) ? 0 : 1 / 6;
    const k2 = corners.has((i + 1) % n) ? 0 : 1 / 6;
    const c1: P = [p1[0] + (p2[0] - p0[0]) * k1, p1[1] + (p2[1] - p0[1]) * k1];
    const c2: P = [p2[0] - (p3[0] - p1[0]) * k2, p2[1] - (p3[1] - p1[1]) * k2];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
};

// levelled source geometry
const body = (trace.body as P[]).map(rot);
const skirt = (trace.skirt as P[]).map(rot);
const glass = (trace.glass as P[]).map(rot);
const wheels = trace.wheels.map((w) => ({c: rot([w.cx, w.cy]), r: w.r}));
export const PROFILE = {
  xMin: Math.min(...body.map((p) => p[0])),
  xMax: Math.max(...body.map((p) => p[0])),
  roof: Math.min(...body.map((p) => p[1])),
  wheelBottom: Math.max(...wheels.map((w) => w.c[1] + w.r)),
  floor: Math.max(...skirt.map((p) => p[1])),
};
const BODY_CORNERS = new Set([0, 22, 23, 26, 27, 28, 41, 46, 47, 58, 60]);

/**
 * The traced Roadster. Drawn in source pixels and placed by `x`,`y` (where the wheel-contact line's left end, i.e.
 * the nose end of the car's length, lands), scale `k`. `inverted` hangs it upside down (wheels up).
 */
export const Roadster: React.FC<{x: number; y: number; k: number; inverted?: boolean; droop?: number; outline?: string}> = ({x, y, k, inverted = false, droop = 0, outline = '#0B1418'}) => {
  const sy = inverted ? -1 : 1;
  // anchor: (xMin, wheelBottom) in source -> (x, y) on screen
  const tf = `translate(${x} ${y}) scale(${k} ${k * sy}) translate(${-PROFILE.xMin} ${-(PROFILE.wheelBottom + droop)})`;
  const sw = 3.2 / k;
  return (
    <g transform={tf}>
      <defs>
        <linearGradient id="rsBody" x1="0" y1={PROFILE.roof} x2="0" y2={PROFILE.floor} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#EEF2F4" />
          <stop offset="1" stopColor="#C9D2D7" />
        </linearGradient>
      </defs>
      <path d={smooth(skirt, new Set([0, 5, 6, 10]))} fill="#38444B" stroke={outline} strokeWidth={sw} strokeLinejoin="round" />
      <path d={smooth(body, BODY_CORNERS)} fill="url(#rsBody)" stroke={outline} strokeWidth={sw} strokeLinejoin="round" />
      <path d={smooth(glass, new Set([0, 9, 10]))} fill="#11181D" stroke={outline} strokeWidth={sw * 0.6} strokeLinejoin="round" />
      {/* tail light (red bar seen at the rear deck in the footage) */}
      <path d={`M ${body[26][0] - 3} ${body[26][1] + 2} L ${body[28][0] - 1} ${body[28][1]}`} stroke="#E8332B" strokeWidth={5} strokeLinecap="round" />
      {wheels.map((w, i) => (
        <g key={i}>
          {droop > 0 && <rect x={w.c[0] - w.r * 0.18} y={w.c[1] - w.r * 0.2} width={w.r * 0.36} height={droop + w.r * 0.2} fill="#2A3135" />}
          <circle cx={w.c[0]} cy={w.c[1] + droop} r={w.r} fill="#14191C" stroke={outline} strokeWidth={sw} />
          <circle cx={w.c[0]} cy={w.c[1] + droop} r={w.r * 0.72} fill="#8E989E" />
          <circle cx={w.c[0]} cy={w.c[1] + droop} r={w.r * 0.66} fill="none" stroke="#6F797F" strokeWidth={1.2} />
          <circle cx={w.c[0]} cy={w.c[1] + droop} r={w.r * 0.13} fill="#2A3135" />
        </g>
      ))}
    </g>
  );
};
