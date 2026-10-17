// Local helpers for the city sets: extra colours, flames, smoke puffs, glows, the system mark. Pure functions of props.
import React from 'react';
import {CITY, SYS, C} from '../theme';
import {rnd, noise, smoothPath, polyPath, V2, f2, clamp, lerp} from '../kit/math';

export {rnd, noise, smoothPath, polyPath, f2, clamp, lerp};
export type {V2};
export const INK = C.ink;

// colours not in the shared palette (kept local to the city sets)
export const K = {
  brick2: '#9A5240', brick3: '#7B3E31', stone2: '#B9A28C', stoneLight: '#CDB9A3', limestone: '#C8B9A2', limestoneDark: '#9A8B78',
  trim: '#3A2E2C', fireEscape: '#2A2426', glassDark: '#1E1820', glassBlue: '#3B4C5C', glassLit: '#FFB84D', glassWarm: '#E88A3A',
  shutter: '#6F6A66', shutterDark: '#55504D', awning: ['#8C3B33', '#2F5E4E', '#7A5A2A', '#3E4E6E'],
  tank: '#6B4A33', tankDark: '#4A3222', sidewalk: '#7E7470', sidewalkDark: '#615855', curb: '#8F8783', lane: '#D9C9A0',
  green: CITY.subwayGreen, greenDark: '#2B6640', globe: '#7BCB8A', globeLit: '#C9F2C2', tile: '#D8D2C2', tileDark: '#B8B09C',
  steel: CITY.steel, steelDark: CITY.steelDark, steelLight: '#7D8994', rust: CITY.rust, concrete: CITY.concrete, concreteDark: CITY.concreteDark,
  concreteLight: '#B6B0A8', rebar: '#5A3A2A', deckTop: '#6A6462', taxi: CITY.taxi, taxiDark: CITY.taxiDark, tyre: '#1F1C1E', hub: '#8A8A8A',
  busBody: '#D9DDE0', busBand: '#3C6FA8', busDark: '#9DA6AD', soot: '#2A2224',
  lampOrange: '#FFB25A', signalAmber: '#FFB23F', signalDead: '#3A3436',
  water: CITY.water, riverDark: '#1F3442', road: '#4A4446',
  sysPanel: SYS.panel, sysShade: SYS.panelShade, sysSlate: SYS.slate, sysDark: SYS.dark, sysSensor: SYS.sensor, sysLock: SYS.lock,
};

/** A flame tongue shape (pointing up) of width w, height h; flicker from t. Origin at its base centre. */
export const flamePath = (w: number, h: number, t: number, seed: number) => {
  const k1 = noise(t * 3.1, seed) * 0.18, k2 = noise(t * 4.3, seed + 5) * 0.22, k3 = noise(t * 2.2, seed + 9) * 0.25;
  const hh = h * (1 + k3 * 0.6);
  const pts: V2[] = [
    {x: -w / 2, y: 0}, {x: -w * (0.45 + k1 * 0.3), y: -hh * 0.35}, {x: -w * (0.18 + k2 * 0.2), y: -hh * 0.62},
    {x: w * k1 * 0.6, y: -hh}, {x: w * (0.2 + k2 * 0.15), y: -hh * 0.55}, {x: w * (0.46 - k1 * 0.2), y: -hh * 0.3}, {x: w / 2, y: 0},
  ];
  return smoothPath(pts, true, 0.75);
};

/** A small cluster of flames: outer, hot, core. Origin at base centre. */
export const Flames: React.FC<{w: number; h: number; t: number; seed: number; n?: number; ink?: number; outline?: boolean}> = ({w, h, t, seed, n = 3, ink = 0, outline = false}) => {
  const items = [];
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : i / (n - 1) - 0.5;
    const x = u * w * 0.62;
    const sc = 1 - Math.abs(u) * 0.7 + rnd(seed * 13 + i) * 0.15;
    items.push(
      <g key={i} transform={`translate(${f2(x)} 0)`}>
        <path d={flamePath(w * 0.5 * sc, h * sc, t + i * 0.37, seed * 7 + i)} fill={CITY.fire} stroke={outline ? INK : 'none'} strokeWidth={ink} strokeLinejoin="round" />
        <path d={flamePath(w * 0.32 * sc, h * 0.68 * sc, t * 1.15 + i, seed * 7 + i + 31)} fill={CITY.fireHot} />
        <path d={flamePath(w * 0.16 * sc, h * 0.36 * sc, t * 1.3 + i, seed * 7 + i + 57)} fill={CITY.fireCore} />
      </g>,
    );
  }
  return <g>{items}</g>;
};

/** Soft warm glow (radial gradient ellipse). Gradients are defined per id. */
export const Glow: React.FC<{id: string; cx: number; cy: number; rx: number; ry: number; color?: string; op?: number}> = ({id, cx, cy, rx, ry, color = CITY.fire, op = 0.55}) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop offset="0%" stopColor={color} stopOpacity={op} />
        <stop offset="55%" stopColor={color} stopOpacity={op * 0.35} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
  </g>
);

/** Rising smoke column: puffs that drift and grow with time. Origin at its source. */
export const SmokeColumn: React.FC<{x: number; y: number; h: number; w: number; t: number; seed: number; color?: string; op?: number; drift?: number; n?: number}> = ({x, y, h, w, t, seed, color = CITY.smoke, op = 0.8, drift = 0.35, n = 9}) => {
  const puffs = [];
  for (let i = 0; i < n; i++) {
    const life = 7 + rnd(seed + i * 3) * 3;
    const ph = ((t / life + i / n + rnd(seed * 5 + i)) % 1 + 1) % 1;
    const yy = y - ph * h;
    const xx = x + ph * h * drift + noise(ph * 3 + i, seed + i) * w * 0.2;
    const r = w * (0.25 + ph * 0.9) * (0.8 + rnd(seed + i * 11) * 0.4);
    const o = op * Math.sin(Math.PI * clamp(ph * 1.15)) * 0.9;
    puffs.push(<path key={i} d={blobD(r, seed * 17 + i)} transform={`translate(${f2(xx)} ${f2(yy)})`} fill={color} opacity={o} />);
  }
  return <g>{puffs}</g>;
};

/** Irregular rounded blob (seeded), centred at 0,0. */
export const blobD = (r: number, seed: number, n = 9, rough = 0.3, sx = 1, sy = 1) => {
  const pts: V2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 - rough / 2 + rough * rnd(seed * 31 + i * 7);
    pts.push({x: Math.cos(a) * r * k * sx, y: Math.sin(a) * r * k * sy});
  }
  return smoothPath(pts, true, 0.9);
};

/** Jagged broken edge polyline between two points (seeded), useful for snapped concrete. */
export const jagged = (a: V2, b: V2, seed: number, amp: number, n = 8): V2[] => {
  const out: V2[] = [a];
  const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const o = (rnd(seed * 19 + i) - 0.5) * 2 * amp;
    out.push({x: a.x + dx * u + nx * o, y: a.y + dy * u + ny * o});
  }
  out.push(b);
  return out;
};

/** The coordination system's restrained mark: three concentric arcs with a dot. r = outer radius. */
export const SysMarkLocal: React.FC<{x: number; y: number; r: number; color?: string; sw?: number}> = ({x, y, r, color = SYS.mark, sw}) => {
  const w = sw ?? r * 0.16;
  const arc = (rr: number, a0: number, a1: number) => {
    const p0 = {x: x + rr * Math.cos(a0), y: y + rr * Math.sin(a0)}, p1 = {x: x + rr * Math.cos(a1), y: y + rr * Math.sin(a1)};
    return `M ${f2(p0.x)} ${f2(p0.y)} A ${f2(rr)} ${f2(rr)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f2(p1.x)} ${f2(p1.y)}`;
  };
  return (
    <g fill="none" stroke={color} strokeWidth={w} strokeLinecap="round">
      <path d={arc(r, -2.4, 0.9)} />
      <path d={arc(r * 0.66, -1.9, 1.6)} />
      <path d={arc(r * 0.33, -1.2, 2.3)} />
      <circle cx={x} cy={y} r={w * 0.7} fill={color} stroke="none" />
    </g>
  );
};

/** Deterministic list helper. */
export const range = (n: number) => Array.from({length: Math.max(0, Math.floor(n))}, (_, i) => i);
