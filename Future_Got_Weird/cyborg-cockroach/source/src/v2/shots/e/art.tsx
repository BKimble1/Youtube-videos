// Group E rubble art, flat 2D (no perspective): broken concrete slabs as hand-placed screen polygons with one soft
// gradient, a lit top face, an ink contour and crack lines; rebar; a daylight shaft; dust motes and grit trickles.
// Palette borrowed from V1's rubble (concrete #9C9590 / #7E7772 / #B8B0A6, crevice #3A3633, rebar #8A4B2E, dust
// #C9BFAF, daylight #FFE8B8). Everything is a pure function of its props (deterministic noise only).
import React from 'react';
import {INK} from '../../../lib/ink';
import {mix, shade as shadeC, lit as litC} from '../../../lib/color';
import {rnd, clamp} from '../../../lib/ease';

export const RB = {
  conc: '#9C9590',
  concDark: '#7E7772',
  concLit: '#B8B0A6',
  concPale: '#CFC6BA',
  crevice: '#3A3633',
  deep: '#221E1C',
  far: '#4A4440',
  farLit: '#6A625C',
  rebar: '#8A4B2E',
  rebarLit: '#B06A44',
  dust: '#C9BFAF',
  day: '#FFE8B8',
  dayHot: '#FFF6DE',
};

export type Pt = [number, number];
export const f2 = (n: number) => (Math.abs(n) < 1e-6 ? '0' : n.toFixed(1));
export const poly = (pts: Pt[]) => (pts.length ? `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')} Z` : '');
export const line = (pts: Pt[]) => (pts.length ? `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join(' L')}` : '');

/** break the straight edges of a polygon into a jagged line (deterministic): each edge is cut every ~step px and the
 *  cut points pushed sideways by up to amp px; corners stay put */
export const jag = (pts: Pt[], amp: number, seed: number, step = 46, closed = true): Pt[] => {
  const out: Pt[] = [];
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    out.push(a);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const k = Math.max(0, Math.floor(L / step));
    const nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
    for (let j = 1; j < k; j++) {
      const u = (j + (rnd(i * 31 + j, seed) - 0.5) * 0.5) / k;
      const o = (rnd(i * 17 + j * 3, seed + 7) - 0.5) * 2 * amp;
      out.push([a[0] + (b[0] - a[0]) * u + nx * o, a[1] + (b[1] - a[1]) * u + ny * o]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
};

const bbox = (pts: Pt[]) => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts) {
    x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]);
  }
  return {x0, y0, x1, y1};
};

/** one broken concrete slab: the face (soft top-to-bottom gradient), optional lit top face and dark underside, cracks,
 *  aggregate specks, a rim light along the lit edge; ink contour of width w */
export const Slab: React.FC<{
  id: string; face: Pt[]; top?: Pt[]; under?: Pt[]; tone?: string; w?: number; cracks?: Pt[][]; specks?: number;
  dark?: number; rim?: Pt[]; rimColor?: string; topTone?: string;
}> = ({id, face, top, under, tone = RB.conc, w = 3, cracks, specks = 0, dark = 0, rim, rimColor = RB.day, topTone}) => {
  const b = bbox(face);
  const c0 = mix(tone, RB.deep, dark), c1 = shadeC(mix(tone, RB.deep, dark), 0.3);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={0} y1={f2(b.y0)} x2={0} y2={f2(b.y1)}>
          <stop offset="0" stopColor={litC(c0, 0.06)} />
          <stop offset="1" stopColor={c1} />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <path d={poly(face)} />
        </clipPath>
      </defs>
      <path d={poly(face)} fill={`url(#${id}-g)`} stroke={INK} strokeWidth={w} strokeLinejoin="round" />
      <g clipPath={`url(#${id}-c)`}>
        {specks > 0 &&
          Array.from({length: specks}, (_, i) => {
            const x = b.x0 + rnd(i, id.length * 3.1) * (b.x1 - b.x0), y = b.y0 + rnd(i + 99, id.length * 1.7) * (b.y1 - b.y0);
            const r = 1.6 + rnd(i + 7, 5) * 3.2;
            return <circle key={i} cx={f2(x)} cy={f2(y)} r={f2(r)} fill={i % 3 ? shadeC(c0, 0.35) : litC(c0, 0.25)} opacity={0.5} />;
          })}
        {cracks?.map((c, i) => (
          <path key={i} d={line(c)} stroke={shadeC(c0, 0.7)} strokeWidth={f2(Math.max(1.5, w * 0.7))} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      {under && <path d={poly(under)} fill={mix(RB.crevice, RB.deep, 0.4 + dark * 0.5)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />}
      {top && <path d={poly(top)} fill={topTone ?? litC(mix(tone, RB.deep, dark * 0.8), 0.22)} stroke={INK} strokeWidth={w} strokeLinejoin="round" />}
      {rim && <path d={line(rim)} stroke={rimColor} strokeWidth={f2(w * 1.4)} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />}
    </g>
  );
};

/** a bent rebar: ink underlay, rust stroke, a lit edge and rib ticks */
export const Rebar: React.FC<{pts: Pt[]; w?: number; dark?: number}> = ({pts, w = 9, dark = 0}) => {
  const c = mix(RB.rebar, RB.deep, dark);
  const d = line(pts);
  return (
    <g>
      <path d={d} stroke={INK} strokeWidth={f2(w + 4)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={c} strokeWidth={f2(w)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={shadeC(c, 0.45)} strokeWidth={f2(w * 0.95)} fill="none" strokeDasharray={`${f2(w * 0.35)} ${f2(w * 0.9)}`} strokeLinejoin="round" opacity={0.7} />
      <path d={d} stroke={mix(RB.rebarLit, RB.deep, dark)} strokeWidth={f2(w * 0.3)} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(${f2(-w * 0.18)} ${f2(-w * 0.22)})`} opacity={0.9} />
    </g>
  );
};

/** a pile of small broken pieces along a line (gravel and chunks), flat, inked */
export const Pebbles: React.FC<{id: string; a: Pt; b: Pt; n: number; size: number; seed: number; tone?: string; dark?: number; w?: number}> = ({a, b, n, size, seed, tone = RB.concDark, dark = 0, w = 2.2}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const u = rnd(i, seed);
      const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u + (rnd(i + 40, seed) - 0.5) * size * 1.2;
      const r = size * (0.35 + rnd(i + 80, seed) * 0.75);
      const k = 5 + Math.floor(rnd(i + 120, seed) * 3);
      const pts: Pt[] = Array.from({length: k}, (_, j) => {
        const th = (j / k) * Math.PI * 2 + rnd(i, seed + 3);
        const rr = r * (0.7 + 0.45 * rnd(i * 7 + j, seed + 9));
        return [x + Math.cos(th) * rr, y + Math.sin(th) * rr * 0.62];
      });
      const c = mix(i % 4 === 0 ? RB.concLit : tone, RB.deep, dark);
      const top: Pt[] = pts.filter((p) => p[1] < y).concat([[x, y]]);
      return (
        <g key={i}>
          <path d={poly(pts)} fill={shadeC(c, 0.15)} stroke={INK} strokeWidth={f2(w)} strokeLinejoin="round" />
          {top.length > 2 && <path d={poly(top)} fill={litC(c, 0.18)} />}
        </g>
      );
    })}
  </g>
);

/** a daylight shaft: a soft-edged warm polygon, strongest at its source */
export const Shaft: React.FC<{id: string; pts: Pt[]; from: Pt; to: Pt; a?: number}> = ({id, pts, from, to, a = 0.32}) => (
  <g style={{mixBlendMode: 'screen'}}>
    <defs>
      <linearGradient id={`${id}-s`} gradientUnits="userSpaceOnUse" x1={f2(from[0])} y1={f2(from[1])} x2={f2(to[0])} y2={f2(to[1])}>
        <stop offset="0" stopColor={RB.dayHot} stopOpacity={a} />
        <stop offset="0.55" stopColor={RB.day} stopOpacity={a * 0.55} />
        <stop offset="1" stopColor={RB.day} stopOpacity={0} />
      </linearGradient>
      <filter id={`${id}-b`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
    </defs>
    <path d={poly(pts)} fill={`url(#${id}-s)`} filter={`url(#${id}-b)`} />
  </g>
);

/** dust motes drifting slowly (pure function of t); shown inside an optional clip path */
export const Motes: React.FC<{id: string; t: number; n: number; x0: number; y0: number; x1: number; y1: number; r?: number; seed?: number; clip?: string; a?: number; color?: string}> = ({
  id, t, n, x0, y0, x1, y1, r = 3, seed = 1, clip, a = 0.8, color = RB.dayHot,
}) => {
  const W = x1 - x0, H = y1 - y0;
  return (
    <g>
      {clip && (
        <defs>
          <clipPath id={`${id}-mc`}>
            <path d={clip} />
          </clipPath>
        </defs>
      )}
      <g clipPath={clip ? `url(#${id}-mc)` : undefined}>
        {Array.from({length: n}, (_, i) => {
          const sp = 8 + rnd(i, seed) * 14; // px/s drifting down
          const ph = rnd(i + 11, seed);
          const yy = (((rnd(i + 23, seed) * H + t * sp) % H) + H) % H;
          const xx = rnd(i + 37, seed) * W + 14 * Math.sin(t * (0.5 + ph) + ph * 6.28);
          const tw = 0.55 + 0.45 * Math.sin(t * (1.3 + ph * 2) + i);
          const rr = r * (0.5 + rnd(i + 51, seed) * 0.9);
          const fade = clamp(yy / (H * 0.12)) * clamp((H - yy) / (H * 0.12));
          return <circle key={i} cx={f2(x0 + xx)} cy={f2(y0 + yy)} r={f2(rr)} fill={color} opacity={(a * tw * fade).toFixed(3)} />;
        })}
      </g>
    </g>
  );
};

/** a grit trickle: small grains falling from (x, y0) under gravity, released over [t0, t0 + dur]; hidden below y1 */
export const Grit: React.FC<{t: number; x: number; y0: number; y1: number; t0: number; dur: number; n: number; g?: number; r?: number; spread?: number; seed?: number; color?: string}> = ({
  t, x, y0, y1, t0, dur, n, g = 2400, r = 2.6, spread = 10, seed = 3, color = RB.dust,
}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const tb = t0 + (i / n) * dur + rnd(i, seed) * (dur / n);
      const dt = t - tb;
      if (dt < 0) return null;
      const y = y0 + 0.5 * g * dt * dt;
      if (y > y1) return null;
      const xx = x + (rnd(i + 5, seed) - 0.5) * spread + (rnd(i + 9, seed) - 0.5) * 30 * dt;
      return <circle key={i} cx={f2(xx)} cy={f2(y)} r={f2(r * (0.6 + rnd(i + 3, seed) * 0.8))} fill={color} opacity={0.9} />;
    })}
  </g>
);

/** a soft round glow (no blend), e.g. the bounce of daylight on a floor */
export const Glow2: React.FC<{id: string; cx: number; cy: number; rx: number; ry: number; color: string; a: number}> = ({id, cx, cy, rx, ry, color, a}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-gl`}>
        <stop offset="0" stopColor={color} stopOpacity={a} />
        <stop offset="0.5" stopColor={color} stopOpacity={a * 0.45} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={f2(cx)} cy={f2(cy)} rx={f2(rx)} ry={f2(ry)} fill={`url(#${id}-gl)`} />
  </g>
);

/** a vertical gradient rect (backdrops) */
export const VGrad: React.FC<{id: string; x0: number; y0: number; x1: number; y1: number; stops: [number, string][]}> = ({id, x0, y0, x1, y1, stops}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-v`} gradientUnits="userSpaceOnUse" x1={0} y1={f2(y0)} x2={0} y2={f2(y1)}>
        {stops.map(([o, c], i) => (
          <stop key={i} offset={o} stopColor={c} />
        ))}
      </linearGradient>
    </defs>
    <rect x={f2(x0)} y={f2(y0)} width={f2(x1 - x0)} height={f2(y1 - y0)} fill={`url(#${id}-v)`} />
  </g>
);

/** a soft dark vignette over the frame (screen px) */
export const Vignette: React.FC<{id: string; a?: number}> = ({id, a = 0.55}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-vg`} cx="0.5" cy="0.48" r="0.75">
        <stop offset="0.55" stopColor="#0A0909" stopOpacity={0} />
        <stop offset="1" stopColor="#0A0909" stopOpacity={a} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={1080} height={1920} fill={`url(#${id}-vg)`} />
  </g>
);

/** a broken length of metal pipe (building services): ink underlay, grey tube with a lit stripe, a flange, a dark bore */
export const Pipe: React.FC<{a: Pt; b: Pt; r: number; dark?: number; flangeAt?: number}> = ({a, b, r, dark = 0, flangeAt = 0.35}) => {
  const c = mix('#8E9AA3', RB.deep, dark);
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, nx = -uy, ny = ux;
  const fl: Pt = [a[0] + (b[0] - a[0]) * flangeAt, a[1] + (b[1] - a[1]) * flangeAt];
  const ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  return (
    <g>
      <path d={line([a, b])} stroke={INK} strokeWidth={f2(2 * r + 5)} strokeLinecap="butt" />
      <path d={line([a, b])} stroke={c} strokeWidth={f2(2 * r)} strokeLinecap="butt" />
      <path d={line([[a[0] - nx * r * 0.45, a[1] - ny * r * 0.45], [b[0] - nx * r * 0.45, b[1] - ny * r * 0.45]])} stroke={litC(c, 0.35)} strokeWidth={f2(r * 0.35)} />
      <path d={line([[a[0] + nx * r * 0.5, a[1] + ny * r * 0.5], [b[0] + nx * r * 0.5, b[1] + ny * r * 0.5]])} stroke={shadeC(c, 0.35)} strokeWidth={f2(r * 0.5)} />
      <rect x={f2(fl[0] - r * 0.35)} y={f2(fl[1] - r * 1.45)} width={f2(r * 0.7)} height={f2(r * 2.9)} fill={shadeC(c, 0.1)} stroke={INK} strokeWidth={2.5} transform={`rotate(${f2(ang)} ${f2(fl[0])} ${f2(fl[1])})`} />
      <ellipse cx={f2(b[0])} cy={f2(b[1])} rx={f2(r * 0.42)} ry={f2(r)} fill={RB.deep} stroke={INK} strokeWidth={2.5} transform={`rotate(${f2(ang)} ${f2(b[0])} ${f2(b[1])})`} />
    </g>
  );
};

/** a fragment of tiled floor: a grid of n x m tiles through a floor mapping g(u, v) (u, v in tile units), with a few
 *  tiles missing (broken edge) */
export const Tiles: React.FC<{g: (u: number, v: number) => Pt; n: number; m: number; seed: number; color?: string; w?: number}> = ({g, n, m, seed, color = '#B9CCD3', w = 2}) => (
  <g>
    {Array.from({length: n * m}, (_, k) => {
      const i = k % n, j = Math.floor(k / n);
      const edge = i === 0 || j === 0 || i === n - 1 || j === m - 1;
      if (edge && rnd(k, seed) < 0.45) return null;
      const g0 = 0.06;
      const pts: Pt[] = [g(i + g0, j + g0), g(i + 1 - g0, j + g0), g(i + 1 - g0, j + 1 - g0), g(i + g0, j + 1 - g0)];
      const c = rnd(k + 9, seed) < 0.2 ? shadeC(color, 0.15) : color;
      return <path key={k} d={poly(pts)} fill={c} stroke={INK} strokeWidth={w} strokeLinejoin="round" opacity={0.9} />;
    })}
  </g>
);
