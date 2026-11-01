// Earth seen from space while years pass: an orthographic globe whose continents spin past, cloud bands stream, and
// city lights spread across the night side as the decades go by. Plus the cloud pass used to descend to the street.
import React from 'react';
import {closed, P} from '../core/geo';
import {clamp, hash, sm} from '../lib';
import {INK} from './crew';

const ss = (x: number, a: number, b: number) => sm((x - a) / (b - a));
const D2R = Math.PI / 180;
// rough continent outlines (lon, lat), simplified for a cartoon globe
const LAND: [number, number][][] = [
  [[-165, 62], [-140, 70], [-100, 72], [-75, 65], [-60, 50], [-75, 38], [-80, 26], [-97, 18], [-105, 22], [-118, 33], [-125, 45], [-140, 58]], // N America
  [[-80, 10], [-62, 8], [-50, 0], [-36, -8], [-40, -22], [-52, -33], [-66, -54], [-73, -40], [-72, -18], [-80, -4]], // S America
  [[-10, 36], [10, 37], [32, 31], [44, 12], [51, 11], [40, -15], [32, -30], [20, -35], [12, -18], [8, 4], [-8, 5], [-17, 15], [-16, 28]], // Africa
  [[-10, 44], [-5, 52], [5, 58], [20, 68], [40, 70], [70, 74], [110, 76], [140, 72], [165, 66], [150, 55], [135, 42], [122, 30], [108, 18], [98, 8], [78, 8], [70, 22], [56, 26], [40, 40], [28, 42], [12, 44], [0, 43]], // Eurasia
  [[114, -22], [122, -18], [136, -12], [146, -18], [153, -28], [146, -38], [132, -32], [116, -34]], // Australia
  [[-50, 60], [-30, 70], [-22, 80], [-45, 82], [-60, 76]], // Greenland
];
const pointIn = (lon: number, lat: number, poly: [number, number][]) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-9) + xi) inside = !inside;
  }
  return inside;
};
const CITIES = (() => {
  const out: {lon: number; lat: number; born: number}[] = [];
  for (let la = -50; la <= 70; la += 3.2)
    for (let lo = -180; lo < 180; lo += 3.2) {
      const jl = lo + (hash(lo * 7 + la) - 0.5) * 2.4, ja = la + (hash(la * 3 + lo) - 0.5) * 2.4;
      if (LAND.slice(0, 5).some((p) => pointIn(jl, ja, p)) && hash(jl * 13.1 + ja * 7.7) < 0.55) out.push({lon: jl, lat: ja, born: hash(jl * 3.3 + ja * 1.7) ** 1.5});
    }
  return out;
})();

export const project = (lon: number, lat: number, lon0: number, tilt: number) => {
  const l = (lon - lon0) * D2R, p = lat * D2R, t = tilt * D2R;
  const x = Math.cos(p) * Math.sin(l);
  const y = -(Math.cos(t) * Math.sin(p) - Math.sin(t) * Math.cos(p) * Math.cos(l));
  const vis = Math.sin(t) * Math.sin(p) + Math.cos(t) * Math.cos(p) * Math.cos(l);
  return {x, y, vis};
};

/** the globe, radius r, centred at 0; lon0 = rotation (deg), years = 0..1 decades of growth, night = terminator x */
export const Globe: React.FC<{r: number; lon0: number; years: number; id: string; cloud?: number; night?: number}> = ({r, lon0, years, id, cloud = 0, night = -0.15}) => {
  const tilt = 22;
  const land = LAND.map((poly) => {
    const pts: P[] = [];
    // densify edges so the limb clamp stays smooth
    for (let i = 0; i < poly.length; i++) {
      const [a, b] = [poly[i], poly[(i + 1) % poly.length]];
      for (let k = 0; k < 4; k++) {
        const u = k / 4;
        const q = project(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, lon0, tilt);
        const n = q.vis < 0 ? Math.hypot(q.x, q.y) || 1 : 1;
        pts.push({x: (q.x / n) * r, y: (q.y / n) * r});
      }
    }
    const anyVis = poly.some(([lo, la]) => project(lo, la, lon0, tilt).vis > 0);
    return anyVis ? closed(pts, 0.8) : null;
  });
  const clipId = `${id}-g`;
  return (
    <g>
      <circle r={r * 1.08} fill="#8FC7FF" opacity={0.22} />
      <circle r={r * 1.03} fill="#BFE0FF" opacity={0.25} />
      <circle r={r} fill="#2F6FB3" />
      <clipPath id={clipId}><circle r={r} /></clipPath>
      <g clipPath={`url(#${clipId})`}>
        <circle cx={r * 0.25} cy={-r * 0.2} r={r * 0.9} fill="#3F86C9" opacity={0.6} />
        {land.map((d, i) => d && <path key={i} d={d} fill={i === 5 ? '#EEF4F7' : '#6FB36A'} stroke={INK} strokeWidth={r * 0.006 + 1.5} strokeLinejoin="round" />)}
        {/* clouds: bands of puffs at their own speed */}
        {Array.from({length: 26}, (_, k) => {
          const lon = hash(k * 4.1) * 360 + cloud * 1.6 * 360 * (0.6 + hash(k * 2.2) * 0.8);
          const lat = (hash(k * 9.3) - 0.5) * 120;
          const q = project(lon, lat, lon0, tilt);
          if (q.vis < 0.05) return null;
          const w = r * (0.12 + 0.12 * hash(k * 5.5)) * (0.3 + 0.7 * q.vis);
          return <ellipse key={k} cx={q.x * r} cy={q.y * r} rx={w} ry={w * 0.35 * (0.4 + 0.6 * q.vis)} fill="#FFFFFF" opacity={0.75} />;
        })}
        {/* night side */}
        <path d={`M ${night * r} ${-r * 1.1} Q ${night * r - r * 0.5} 0 ${night * r} ${r * 1.1} L ${-r * 1.2} ${r * 1.2} L ${-r * 1.2} ${-r * 1.2} Z`} fill="#081226" opacity={0.62} />
        {/* city lights: more of them every decade, only on the night side */}
        {CITIES.map((c, i) => {
          if (c.born > years) return null;
          const q = project(c.lon, c.lat, lon0, tilt);
          if (q.vis < 0.08) return null;
          const x = q.x * r, y = q.y * r;
          const dark = clamp((night * r - r * 0.25 * (1 - (y / r) ** 2) - x) / (r * 0.12));
          if (dark <= 0) return null;
          const grow = clamp((years - c.born) / 0.15);
          return <circle key={i} cx={x} cy={y} r={(1.6 + 2.2 * grow) * (r / 420) * (0.5 + 0.5 * q.vis)} fill="#FFD27A" opacity={dark * (0.6 + 0.4 * grow)} />;
        })}
        {/* lit limb */}
        <circle cx={-r * 0.2} cy={r * 0.1} r={r * 1.05} fill="none" stroke="#081226" strokeWidth={r * 0.18} opacity={0.25} />
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={Math.max(2, r * 0.012)} />
    </g>
  );
};

/** a pass through cloud: puffs spread from the centre of the screen and grow past the camera. p: 0 -> 1, fully
 *  covered around p = 0.5. Screen space (1080 x 1920). */
export const CloudPass: React.FC<{p: number}> = ({p}) => {
  if (p <= 0 || p >= 1) return null;
  const puffs = Array.from({length: 34}, (_, k) => ({a: hash(k * 3.7) * Math.PI * 2, d: 0.2 + hash(k * 1.3) * 0.9, s: 0.6 + hash(k * 8.1) * 0.8, ph: hash(k * 5.9) * 0.3}));
  const cover = 0.9 * ss(p, 0.2, 0.42) * (1 - ss(p, 0.5, 0.68));
  return (
    <g>
      <rect x={0} y={0} width={1080} height={1920} fill="#F4FAFF" opacity={cover} />
      {puffs.map((q, k) => {
        const u = clamp((p - q.ph) / 0.7);
        if (u <= 0 || u >= 1) return null;
        const g = Math.exp(u * 3.2) - 1;
        const x = 540 + Math.cos(q.a) * q.d * 300 * g, y = 960 + Math.sin(q.a) * q.d * 520 * g;
        const rr = 60 * q.s * (1 + g * 2.4);
        return (
          <g key={k} opacity={sm(u * 4) * (1 - sm((u - 0.6) * 5)) * (1 - ss(p, 0.52, 0.7))}>
            <circle cx={x} cy={y} r={rr} fill="#FFFFFF" />
            <circle cx={x + rr * 0.7} cy={y + rr * 0.2} r={rr * 0.75} fill="#FFFFFF" />
            <circle cx={x - rr * 0.6} cy={y + rr * 0.3} r={rr * 0.65} fill="#EAF2FA" />
          </g>
        );
      })}
    </g>
  );
};
