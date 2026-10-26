// The storm world around the summit: sky (screen space, at infinity), cloud banks at three depths, two distant
// ranges, the summit rock mass the tower stands on (depth 1), foreground rocks and rain. Drawn shapes only (no
// textures); one cool storm key, with `flash` (0..1) adding the discharge's light from above-right of the tower.
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1, V} from '../dc/math';
import {CLOUD_Y} from '../world/site';

export const SKY = {top: '#0A1522', mid: '#13283A', low: '#1F3A4C', cloud: '#18283A', cloudLow: '#26394E', cloudEdge: '#3A5268', rock: '#26343E', rockLit: '#41545F', rockDeep: '#141E25', snow: '#7C93A2'};

const ragged = (x0: number, x1: number, y: number, amp: number, seed: number, step = 70, up = true) => {
  // a cloud underside of overlapping bumps, closed far above (or below)
  let d = `M${fmt(x0)},${fmt(y + (up ? -3000 : 3000))} L${fmt(x0)},${fmt(y)}`;
  for (let x = x0, i = 0; x < x1; x += step, i++) {
    const r = step * (0.55 + 0.5 * hash(i, seed));
    const yy = y + amp * noise1(i * 0.7, seed);
    d += ` A${fmt(r)},${fmt(r * 0.62)} 0 0,${up ? 0 : 1} ${fmt(x + step)},${fmt(yy)}`;
  }
  return d + ` L${fmt(x1)},${fmt(y + (up ? -3000 : 3000))} Z`;
};

export const Sky: React.FC<{flash: number}> = ({flash}) => (
  <g>
    <defs>
      <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={mix(SKY.top, '#3B4A78', flash * 0.35)} />
        <stop offset="0.45" stopColor={mix(SKY.mid, '#4A5C88', flash * 0.3)} />
        <stop offset="0.72" stopColor={mix('#2E5262', '#6A80A8', flash * 0.3)} />
        <stop offset="1" stopColor={mix('#3A6272', '#7890B4', flash * 0.25)} />
      </linearGradient>
    </defs>
    <rect x={0} y={0} width={1080} height={1920} fill="url(#sky-g)" />
  </g>
);

/** cloud banks: far (depth 3.4), mid (2.2) and the storm base over the summit (depth 1, where the bolt ends) */
export const Clouds: React.FC<{cam: Cam; flash: number; boltTop?: V; drift: number}> = ({cam, flash, boltTop, drift}) => (
  <g>
    <Layer cam={cam} depth={3.4}>
      <path d={ragged(-2400 + drift * 6, 3600, 300, 40, 5, 110)} fill={mix('#1C3044', '#4E6290', flash * 0.35)} opacity={0.9} />
      {/* distant storm cells over the far ranges */}
      <path d={ragged(-2400 + drift * 5, 3600, 1060, 60, 7, 130)} fill={mix('#244152', '#56699A', flash * 0.3)} opacity={0.0} />
      {[[-300, 980, 420, 90], [380, 1040, 360, 70], [1100, 960, 480, 100], [1800, 1020, 400, 80]].map(([x, y, rx, ry], i) => (
        <ellipse key={i} cx={x + drift * 5} cy={y} rx={rx} ry={ry} fill={mix('#1F3949', '#52658F', flash * 0.3)} opacity={0.75} />
      ))}
    </Layer>
    <Layer cam={cam} depth={2.2}>
      <path d={ragged(-2000 + drift * 10, 3200, 190, 34, 9, 90)} fill={mix('#1A2C3F', '#4A5E88', flash * 0.4)} opacity={0.95} />
    </Layer>
    <Layer cam={cam} depth={1}>
      <defs>
        <linearGradient id="cl-b" x1="0" y1={CLOUD_Y - 420} x2="0" y2={CLOUD_Y + 40} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={SKY.cloud} />
          <stop offset="0.8" stopColor={mix(SKY.cloudLow, '#5A6E9C', flash * 0.45)} />
          <stop offset="1" stopColor={mix(SKY.cloudEdge, '#8C9CD0', flash * 0.6)} />
        </linearGradient>
        {boltTop && (
          <radialGradient id="cl-glow" gradientUnits="userSpaceOnUse" cx={fmt(boltTop.x)} cy={fmt(boltTop.y)} r={420}>
            <stop offset="0" stopColor="#C9D2FF" stopOpacity={0.75 * flash} />
            <stop offset="0.4" stopColor="#8E9BE0" stopOpacity={0.35 * flash} />
            <stop offset="1" stopColor="#5A68B0" stopOpacity={0} />
          </radialGradient>
        )}
      </defs>
      <path d={ragged(-1800 + drift * 14, 3000, CLOUD_Y, 26, 13, 64)} fill="url(#cl-b)" />
      {/* a second, lower lobe for depth, and the soft lit rim */}
      <path d={ragged(-1700 + drift * 16, 2900, CLOUD_Y - 34, 20, 17, 52)} fill={mix('#1E3044', '#5C6E9E', flash * 0.4)} opacity={0.7} />
      {boltTop && flash > 0.01 && <path d={ragged(-1800 + drift * 14, 3000, CLOUD_Y, 26, 13, 64)} fill="url(#cl-glow)" style={{mixBlendMode: 'screen'}} />}
    </Layer>
  </g>
);

/** two distant ranges behind the summit (depths 4.5 and 2.6) with snow on the upper slopes */
export const Ranges: React.FC<{cam: Cam; flash: number}> = ({cam, flash}) => {
  const range = (seed: number, y: number, amp: number, x0: number, x1: number, step: number) => {
    let d = `M${x0},2600 L${x0},${y}`;
    const tops: V[] = [];
    for (let x = x0, i = 0; x <= x1; x += step, i++) {
      const yy = y - amp * (0.35 + 0.65 * Math.abs(noise1(i * 0.45, seed))) - amp * 0.4 * hash(i, seed + 1);
      d += ` L${fmt(x)},${fmt(yy)}`;
      tops.push({x, y: yy});
    }
    return {d: d + ` L${x1},2600 Z`, tops};
  };
  const far = range(31, 1380, 150, -2400, 3600, 90);
  const near = range(37, 1470, 190, -1800, 3000, 70);
  // snow: a band that follows the ridge line down from each top, thicker on the peaks
  const snow = (tops: V[], k: number) => {
    const upper = tops.map((p) => `${fmt(p.x)},${fmt(p.y + 2)}`).join(' L');
    const lower = tops
      .slice()
      .reverse()
      .map((p, i) => {
        const j = tops.length - 1 - i;
        const peak = j > 0 && j < tops.length - 1 && p.y < tops[j - 1].y && p.y < tops[j + 1].y;
        return `${fmt(p.x)},${fmt(p.y + (peak ? 46 : 14) * k * (0.6 + 0.8 * hash(j, 91)))}`;
      })
      .join(' L');
    return `M${upper} L${lower} Z`;
  };
  return (
    <g>
      <Layer cam={cam} depth={4.5}>
        <path d={far.d} fill={mix('#223F4E', '#4A5E84', flash * 0.3)} />
        <path d={snow(far.tops, 0.8)} fill={mix('#6F8C9A', '#B4C0E4', flash * 0.4)} opacity={0.75} />
        {/* low scud drifting across the far range */}
        <path d={ragged(-2400, 3600, 1330, 18, 47, 80, false)} fill={mix('#2C4A5A', '#5E7298', flash * 0.3)} opacity={0.0} />
      </Layer>
      <Layer cam={cam} depth={2.6}>
        <path d={near.d} fill={mix('#142534', '#38496A', flash * 0.3)} />
        <path d={snow(near.tops, 1.1)} fill={mix('#5C7888', '#A8B6DC', flash * 0.4)} opacity={0.8} />
      </Layer>
    </g>
  );
};

/** the summit's top edge (world, depth 1): left terrace (apparatus), the peak (tower plinth), right ledge (shelter) */
export const SUMMIT: V[] = [
  {x: -900, y: 1940}, {x: -500, y: 1860}, {x: -200, y: 1810}, {x: 40, y: 1782}, {x: 90, y: 1768}, {x: 500, y: 1768},
  {x: 516, y: 1730}, {x: 548, y: 1640}, {x: 572, y: 1560}, {x: 604, y: 1498}, {x: 630, y: 1452}, {x: 648, y: 1432}, {x: 756, y: 1432},
  {x: 784, y: 1462}, {x: 806, y: 1520}, {x: 822, y: 1600}, {x: 840, y: 1660}, {x: 856, y: 1694}, {x: 1080, y: 1694}, {x: 1180, y: 1730},
  {x: 1500, y: 1820}, {x: 1900, y: 1930},
];

export const Summit: React.FC<{flash: number}> = ({flash}) => {
  const top = SUMMIT.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L');
  const d = `M${top} L1900,2700 L-900,2700 Z`;
  // faceted rock: light top faces along the edge, dark cliff faces below, strata lines, scree
  const facets: string[] = [];
  for (let i = 0; i < SUMMIT.length - 1; i++) {
    const a = SUMMIT[i], b = SUMMIT[i + 1];
    const dep = 26 + 30 * hash(i, 61);
    facets.push(`M${fmt(a.x)},${fmt(a.y)} L${fmt(b.x)},${fmt(b.y)} L${fmt(b.x - 6)},${fmt(b.y + dep)} L${fmt(a.x + 8)},${fmt(a.y + dep * 0.8)} Z`);
  }
  const strata = Array.from({length: 22}, (_, i) => {
    const y = 1500 + i * 46 + 14 * hash(i, 71);
    const x0 = -900 + 400 * hash(i, 73), x1 = x0 + 500 + 900 * hash(i, 75);
    return `M${fmt(x0)},${fmt(y)} Q${fmt((x0 + x1) / 2)},${fmt(y - 18 + 30 * hash(i, 77))} ${fmt(x1)},${fmt(y + 12 * (hash(i, 79) - 0.5))}`;
  });
  const cracks = Array.from({length: 26}, (_, i) => {
    const x = -700 + 2400 * hash(i, 81), y = 1560 + 600 * hash(i, 83);
    return `M${fmt(x)},${fmt(y)} l${fmt(-10 + 20 * hash(i, 85))},${fmt(40 + 50 * hash(i, 87))} l${fmt(-12 + 24 * hash(i, 89))},${fmt(30 + 40 * hash(i, 91))}`;
  });
  return (
    <g>
      <defs>
        <linearGradient id="rk-g" gradientUnits="userSpaceOnUse" x1="0" y1="1430" x2="0" y2="2300">
          <stop offset="0" stopColor={mix(SKY.rock, '#4C5A80', flash * 0.35)} />
          <stop offset="1" stopColor={SKY.rockDeep} />
        </linearGradient>
        <clipPath id="rk-c">
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="url(#rk-g)" />
      <g clipPath="url(#rk-c)">
        {facets.map((f, i) => (
          <path key={i} d={f} fill={mix(SKY.rockLit, '#8E9ACB', flash * 0.55)} opacity={0.55 + 0.25 * hash(i, 63)} />
        ))}
        {strata.map((s, i) => (
          <path key={`s${i}`} d={s} fill="none" stroke="#0E171D" strokeOpacity={0.45} strokeWidth={3} />
        ))}
        {cracks.map((s, i) => (
          <path key={`c${i}`} d={s} fill="none" stroke="#0E171D" strokeOpacity={0.5} strokeWidth={2.4} strokeLinecap="round" />
        ))}
        {/* wet sheen on the peak faces, turned toward the tower */}
        <path d="M604,1498 L648,1432 L756,1432 L784,1462 L750,1506 Z" fill={mix('#3E5260', '#B8C2EE', flash * 0.7)} opacity={0.5} />
      </g>
      <path d={`M${top}`} fill="none" stroke="#0B1419" strokeWidth={3.2} strokeLinejoin="round" />
    </g>
  );
};

/** dark foreground rocks in the lower corners (depth 0.62): they slide past faster than the summit */
export const Foreground: React.FC<{cam: Cam; flash: number}> = ({cam, flash}) => (
  <Layer cam={cam} depth={0.62} opacity={clamp(1 - (cam.z - 1.15) / 0.3)}>
    <path d="M-600,2400 L-600,1880 L-300,1850 L-120,1872 L40,1905 L120,1960 L160,2400 Z" fill={mix('#0E171D', '#2A3350', flash * 0.3)} />
    <path d="M-300,1850 L-120,1872 L40,1905 L-40,1912 L-200,1880 Z" fill={mix('#26343E', '#6A76A8', flash * 0.5)} opacity={0.7} />
    <path d="M980,2400 L1000,1950 L1120,1900 L1300,1880 L1700,1940 L1700,2400 Z" fill={mix('#0E171D', '#2A3350', flash * 0.3)} />
    <path d="M1000,1950 L1120,1900 L1300,1880 L1200,1910 L1060,1945 Z" fill={mix('#26343E', '#6A76A8', flash * 0.5)} opacity={0.7} />
  </Layer>
);

/** rain streaks on two layers (depth 0.8 near, 1.8 far); `rt` the rain clock; fades out in close-ups */
export const Rain: React.FC<{cam: Cam; rt: number; flash: number}> = ({cam, rt, flash}) => {
  const vis = clamp(1 - (cam.z - 1.6) / 2.2);
  if (vis <= 0) return null;
  const layer = (depth: number, n: number, len: number, w: number, op: number, seed: number, speed: number) => {
    const X0 = -1400, XW = 3800, Y0 = -1200, YH = 4200;
    const lines: string[] = [];
    for (let i = 0; i < n; i++) {
      const x = X0 + XW * hash(i, seed);
      const y = Y0 + ((YH * hash(i, seed + 1) + speed * rt) % YH);
      lines.push(`M${fmt(x)},${fmt(y)} l${fmt(-len * 0.22)},${fmt(len)}`);
    }
    return (
      <Layer cam={cam} depth={depth} key={seed}>
        <path d={lines.join(' ')} stroke={mix('#7F98AE', '#D8E0FF', flash * 0.6)} strokeOpacity={op * vis} strokeWidth={w} strokeLinecap="round" fill="none" />
      </Layer>
    );
  };
  return (
    <g>
      {layer(1.8, 520, 34, 1.6, 0.35, 101, 2600)}
      {layer(0.8, 260, 70, 2.6, 0.32, 131, 4200)}
    </g>
  );
};
