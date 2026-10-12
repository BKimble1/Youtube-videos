import React from 'react';
import {C, H, W} from '../theme';
import {rand} from '../lib/anim';

/**
 * A shaded illustrated Earth (orthographic projection of abstract landmasses, ocean gradient, limb darkening, a rim light, an atmosphere glow, drifting cloud wisps) with an optional
 * equatorial "rotor" ring that the fictional brake grips. Pure function of its props. East = increasing `rot`: the surface moves to the RIGHT across the face of the planet.
 * It is an illustration, not a map: the landmasses are blobs placed roughly where continents are.
 */
const rad = (d: number) => (d * Math.PI) / 180;
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

export const makeProj = (cx: number, cy: number, R: number, rot: number, tilt: number) => (lon: number, lat: number, rr = R, y0 = 0) => {
  const l = rad(wrap(lon + rot)), p = rad(lat), te = rad(tilt);
  const X = Math.cos(p) * Math.sin(l), Y = Math.sin(p), Z = Math.cos(p) * Math.cos(l);
  const Y2 = Y * Math.cos(te) - Z * Math.sin(te), Z2 = Y * Math.sin(te) + Z * Math.cos(te);
  if (Z2 >= 0) return {x: cx + rr * X, y: cy - rr * Y2 - y0 * Math.cos(te), vis: true, z: Z2};
  const n = Math.hypot(X, Y2) || 1;
  return {x: cx + (rr * X) / n, y: cy - (rr * Y2) / n, vis: false, z: Z2};
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

/** abstract landmasses: [lon, lat, half-width lon, half-height lat, seed] */
export const LANDS: [number, number, number, number, number][] = [
  [-112, 48, 30, 17, 1], [-98, 32, 20, 12, 2], [-102, 18, 10, 8, 3], [-150, 62, 18, 9, 4], [-44, 72, 14, 9, 5],
  [-62, -8, 16, 18, 6], [-66, -34, 8, 18, 7],
  [14, 50, 20, 9, 8], [-4, 54, 5, 5, 9], [18, 10, 24, 22, 10], [24, -24, 14, 12, 11], [46, -18, 4, 8, 12],
  [70, 54, 38, 14, 13], [112, 48, 28, 12, 14], [78, 22, 11, 11, 15], [104, 12, 10, 10, 16], [138, 36, 5, 9, 17], [118, -4, 12, 5, 18],
  [134, -25, 17, 10, 19], [172, -42, 5, 6, 20], [0, -84, 95, 7, 21],
];
const CLOUDS: [number, number, number, number][] = [[-30, 24, 52, 1], [40, -14, 60, 2], [120, 30, 46, 3], [-110, -6, 58, 4], [160, -34, 50, 5], [-70, 52, 44, 6], [80, 6, 40, 7], [-160, 36, 42, 8]];

export type GlobeP = {
  cx: number; cy: number; R: number; rot: number; tilt: number;
  id: string;
  cloud?: number; // cloud drift (deg), clouds turn a little faster than the ground
  blur?: number; // horizontal motion blur on the surface while it spins (px)
  ring?: number; // 0..1: the rotor ring around the equator (1 = 60 px thick, 7 % wider than the planet)
  line?: number; // opacity of the thin coral equator line (the ring grows out of it)
  glow?: number;
};

export const GlobeBack: React.FC<GlobeP> = ({cx, cy, R, rot, tilt, ring = 0}) => {
  if (ring <= 0.01) return null;
  return <RingHalf cx={cx} cy={cy} R={R} rot={rot} tilt={tilt} ring={ring} front={false} />;
};

export const RingHalf: React.FC<{cx: number; cy: number; R: number; rot: number; tilt: number; ring: number; front: boolean}> = ({cx, cy, R, rot, tilt, ring, front}) => {
  const Rr = R * 1.07, h = 30 * ring, te = rad(tilt);
  const pt = (l: number, y: number) => ({x: cx + Rr * Math.sin(rad(l)), y: cy - (y * Math.cos(te) - Rr * Math.cos(rad(l)) * Math.sin(te))});
  const a0 = front ? -90 : 90, a1 = front ? 90 : 270;
  const top: {x: number; y: number}[] = [], bot: {x: number; y: number}[] = [];
  for (let l = a0; l <= a1 + 0.01; l += 6) { top.push(pt(l, h)); bot.push(pt(l, -h)); }
  const poly = `M ${top.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} L ${[...bot].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')} Z`;
  // a slotted, ventilated rotor: 18 broad slots (the earlier 40 fine ticks read as a measuring tape); the slots also carry the rotation
  const ticks: React.ReactNode[] = [];
  for (let k = 0; k < 18; k++) {
    const l = wrap(k * 20 + rot * 1.0);
    const lo = front ? l >= -84 && l <= 84 : l > 96 || l < -96;
    if (!lo) continue;
    const lp = l < 0 && !front ? l + 360 : l;
    const a = pt(lp, h * 0.5), b = pt(lp, -h * 0.5), a2 = pt(lp + 8, h * 0.5), b2 = pt(lp + 8, -h * 0.5);
    ticks.push(<path key={k} d={`M ${a.x} ${a.y} L ${a2.x} ${a2.y} L ${b2.x} ${b2.y} L ${b.x} ${b.y} Z`} fill={C.ink} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" opacity={front ? 0.82 : 0.5} />);
  }
  const hi = `M ${top.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')}`;
  return (
    <g>
      <path d={poly} fill={front ? C.saffron : C.saffronDeep} stroke={C.ink} strokeWidth={6} strokeLinejoin="round" />
      {front && <path d={hi} fill="none" stroke={C.saffronLight} strokeWidth={5} strokeLinecap="round" opacity={0.9} transform="translate(0 6)" />}
      {ticks}
    </g>
  );
};

export const Globe3: React.FC<GlobeP> = ({cx, cy, R, rot, tilt, id, cloud = 0, blur = 0, ring = 0, line = 0, glow = 1}) => {
  const proj = makeProj(cx, cy, R, rot, tilt);
  const clip = `M ${cx - R} ${cy} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z`;
  const polys = LANDS.map(([lon, lat, dl, dp, seed]) => {
    const pts = Array.from({length: 18}).map((_, k) => { const a = (k / 18) * Math.PI * 2, kk = 0.66 + 0.5 * rand(seed * 37 + k * 5); return proj(lon + dl * Math.cos(a) * kk, lat + dp * Math.sin(a) * kk); });
    return pts.some((p) => p.vis) ? closed(pts) : null;
  }).filter(Boolean) as string[];
  const cl = CLOUDS.map(([lon, lat, span, seed], i) => {
    let d = '', pen = false;
    for (let a = 0; a <= span; a += 4) {
      const q = proj(lon + cloud * 1.15 + a, lat + 3.2 * Math.sin(a * 0.11 + seed), R * 1.012);
      if (q.vis) { d += `${pen ? ' L' : ' M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; pen = true; } else pen = false;
    }
    return d ? <path key={i} d={d} fill="none" stroke={C.cream} strokeWidth={13 + 4 * rand(i + 9)} strokeLinecap="round" opacity={0.62} /> : null;
  });
  const eqLine = (() => {
    let d = '', pen = false;
    for (let lon = -180; lon <= 180; lon += 4) { const q = proj(lon, 0); if (q.vis) { d += `${pen ? ' L' : ' M'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`; pen = true; } else pen = false; }
    return d;
  })();
  const gid = (s: string) => `${id}-${s}`;
  return (
    <g>
      <defs>
        <radialGradient id={gid('ocean')} cx={cx - 0.3 * R} cy={cy - 0.34 * R} r={1.45 * R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#35C4BA" /><stop offset="0.55" stopColor={C.teal} /><stop offset="1" stopColor="#0C6963" />
        </radialGradient>
        <radialGradient id={gid('shade')} cx={cx - 0.34 * R} cy={cy - 0.36 * R} r={1.62 * R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.ink} stopOpacity={0} /><stop offset="0.5" stopColor={C.ink} stopOpacity={0} /><stop offset="0.78" stopColor={C.ink} stopOpacity={0.26} /><stop offset="1" stopColor={C.ink} stopOpacity={0.6} />
        </radialGradient>
        <radialGradient id={gid('glow')} cx={cx} cy={cy} r={1.22 * R} gradientUnits="userSpaceOnUse">
          <stop offset="0.8" stopColor={C.tealLight} stopOpacity={0.5 * glow} /><stop offset="1" stopColor={C.tealLight} stopOpacity={0} />
        </radialGradient>
        <clipPath id={gid('clip')}><path d={clip} /></clipPath>
        <filter id={gid('blur')} filterUnits="userSpaceOnUse" x={cx - R - 60} y={cy - R - 60} width={2 * R + 120} height={2 * R + 120}><feGaussianBlur stdDeviation={`${Math.max(0.01, blur)} 0`} /></filter>
      </defs>
      <circle cx={cx} cy={cy} r={1.22 * R} fill={`url(#${gid('glow')})`} />
      <circle cx={cx} cy={cy} r={R} fill={`url(#${gid('ocean')})`} />
      <g clipPath={`url(#${gid('clip')})`}>
        <g filter={blur > 0.4 ? `url(#${gid('blur')})` : undefined}>
          {polys.map((d, i) => <path key={`s${i}`} d={d} fill="none" stroke={C.ink} strokeWidth={9} strokeLinejoin="round" />)}
          {polys.map((d, i) => <path key={`f${i}`} d={d} fill={C.saffronLight} />)}
          {polys.map((d, i) => <path key={`h${i}`} d={d} fill="none" stroke="#FFF6D6" strokeWidth={3} strokeLinejoin="round" opacity={0.7} transform="translate(-3 -3)" />)}
          {cl}
        </g>
        {line > 0.01 && <path d={eqLine} fill="none" stroke={C.coral} strokeWidth={5} opacity={line} />}
        <circle cx={cx} cy={cy} r={R + 4} fill={`url(#${gid('shade')})`} />
      </g>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.ink} strokeWidth={9} />
      <path d={`M ${cx + (R - 12) * Math.cos(rad(205))} ${cy + (R - 12) * Math.sin(rad(205))} A ${R - 12} ${R - 12} 0 0 1 ${cx + (R - 12) * Math.cos(rad(262))} ${cy + (R - 12) * Math.sin(rad(262))}`} fill="none" stroke={C.saffronLight} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
      {ring > 0.01 && <RingHalf cx={cx} cy={cy} R={R} rot={rot} tilt={tilt} ring={ring} front />}
    </g>
  );
};

/** the dark teal space the whole globe/explanation family sits in, with a warm glow behind the planet and a few stars */
export const SpaceBG: React.FC<{id: string; glowX?: number; glowY?: number; stars?: number; drift?: number; sk?: number}> = ({id, glowX = 520, glowY = 1000, stars = 70, drift = 0, sk = 1}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0E3B42" /><stop offset="1" stopColor="#09252C" /></linearGradient>
      <radialGradient id={`${id}-w`} cx={glowX} cy={glowY} r={760} gradientUnits="userSpaceOnUse"><stop offset="0" stopColor={C.saffron} stopOpacity={0.26} /><stop offset="1" stopColor={C.saffron} stopOpacity={0} /></radialGradient>
    </defs>
    <rect x={-100} y={-100} width={W + 200} height={H + 200} fill={`url(#${id}-g)`} />
    <rect x={-100} y={-100} width={W + 200} height={H + 200} fill={`url(#${id}-w)`} />
    {Array.from({length: stars}).map((_, i) => {
      const x = (rand(i * 3 + 1) * (W + 200) - 100 - drift * (0.4 + rand(i + 7))) , y = rand(i * 3 + 2) * (H + 100) - 50, r = 1.6 + rand(i * 3 + 3) * 3.2;
      const xx = ((x % (W + 200)) + (W + 200)) % (W + 200) - 100;
      return <circle key={i} cx={xx} cy={y} r={r} fill={i % 7 === 0 ? C.saffron : C.cream} opacity={(0.25 + 0.5 * rand(i + 11)) * sk} />;
    })}
  </g>
);
void H;
