// V3: the riverside flat on the near bank of the river set. In the V3 river set the near-bank ridges stand back from the
// water (RiverBack `near`), leaving an open flat between them and the river: a pebble beach along the waterline, a band
// of wet stones at the edge, then rough grass with boulders, driftwood and willow clumps toward the hills. It is where
// the lift is demonstrated, where the later practice flights run, and where the river flight departs from, so the
// practice and the crossing share one connected landscape. Ground: y = 0; the shoreline wanders around z = 0.
import React from 'react';
import {hash, noise1} from '../dc/math';
import {f2, lit, mix, polyD, proj, shade} from '../eng/draw';
import {clipNear, d3, H, Lens, s3, V3, v3, W} from '../eng/v3';

export const SHORE = {beach: 14, grassTo: 150};
const PALS = {
  wet: '#7F7E70',
  beach: '#C4BCA6',
  beachFar: '#CFCBBB',
  grass: '#97B172',
  grassFar: '#B2C69A',
  grassDeep: '#728F55',
  rock: '#A9A397',
  log: '#8A7258',
  willow: '#6C9258',
  haze: '#CFE0DE',
};
/** the waterline: z of the shore at x */
export const shoreZ = (x: number) => 1.6 * noise1(x / 42, 101) + 0.6 * noise1(x / 9, 102);
const beachZ = (x: number) => shoreZ(x) - SHORE.beach - 4 * noise1(x / 33, 103);

/** samples along x: dense near the camera, sparse far away */
const xs = (cx: number) => {
  const out: number[] = [];
  for (let x = cx - 9000; x < cx - 400; x += 120) out.push(x);
  for (let x = Math.floor((cx - 400) / 3) * 3; x < cx + 400; x += 3) out.push(x);
  for (let x = cx + 400; x <= cx + 9000; x += 120) out.push(x);
  return out;
};
const band = (L: Lens, a: (x: number) => number, b: (x: number) => number, y = 0.006): V3[] => {
  const X = xs(L.pos.x);
  return [...X.map((x) => v3(x, y, a(x))), ...X.slice().reverse().map((x) => v3(x, y, b(x)))];
};

const ROCKS = Array.from({length: 70}, (_, i) => ({x: -420 + hash(i, 111) * 840, z: -2 - hash(i, 112) * 60, r: 0.25 + hash(i, 113) ** 3 * 1.4, s: hash(i, 114)}));
const LOGS = Array.from({length: 9}, (_, i) => ({x: -400 + hash(i, 121) * 800, z: -3 - hash(i, 122) * 9, len: 2 + hash(i, 123) * 3, a: hash(i, 124) * Math.PI}));
const WILLOWS = Array.from({length: 60}, (_, i) => ({x: -900 + hash(i, 131) * 1800, z: -70 - hash(i, 132) * 70, r: 2.5 + hash(i, 133) * 2.5, h: 5 + hash(i, 134) * 5}));

/** world-fixed texture: pebbles on the beach, grass tufts beyond (levels of detail around the camera) */
const Texture: React.FC<{L: Lens; t: number; wind: number}> = ({L, t, wind}) => {
  const g = v3(L.pos.x, 0, L.pos.z);
  const peb: Record<string, string[]> = {};
  const tuft: Record<string, string[]> = {};
  for (const [cell, r1, r0] of [[0.45, 10, 0], [1.4, 34, 10], [4.5, 120, 34]] as [number, number, number][]) {
    const i0 = Math.floor((g.x - r1) / cell), i1 = Math.ceil((g.x + r1) / cell);
    const k0 = Math.floor((g.z - r1) / cell), k1 = Math.ceil(Math.min(4, g.z + r1) / cell);
    for (let i = i0; i <= i1; i++)
      for (let k = k0; k <= k1; k++) {
        const x = i * cell + hash(i * 131 + k, 141) * cell, z = k * cell + hash(i * 37 + k, 142) * cell;
        const dd = Math.hypot(x - g.x, z - g.z);
        if (dd > r1 || dd < r0) continue;
        const sz = shoreZ(x);
        if (z > sz - 0.3) continue;
        const q = v3(x, 0, z);
        if (d3(s3(q, L.pos), L.f) < 0.5) continue;
        const a = L.p(q);
        if (a.x < -20 || a.x > W + 20 || a.y < -20 || a.y > H + 20) continue;
        const h = hash(i * 3 + k, 143);
        if (z > beachZ(x)) {
          // a pebble: a small flat ellipse in one of three stone tones
          const r = cell * (0.12 + 0.12 * h);
          const b = L.p(v3(x + r, 0, z)), c = L.p(v3(x, 0, z + r * 0.7));
          const rx = Math.max(0.5, Math.hypot(b.x - a.x, b.y - a.y)), ry = Math.max(0.35, Math.hypot(c.x - a.x, c.y - a.y));
          const key = h < 0.33 ? '#9D978A' : h < 0.66 ? '#D8D2C2' : '#B2AB9B';
          (peb[key] ??= []).push(`M${f2(a.x - rx)},${f2(a.y)}a${f2(rx)},${f2(ry)} 0 1,0 ${f2(2 * rx)},0a${f2(rx)},${f2(ry)} 0 1,0 ${f2(-2 * rx)},0`);
        } else {
          const hh = cell * (0.28 + h * 0.3);
          const sway = wind * (0.3 + 0.7 * Math.sin(t * 3 + x * 0.7)) * hh * 0.5;
          const b = L.p(v3(x + sway + hh * 0.15, hh, z));
          const wd = Math.max(0.6, Math.min(3, cell * 0.06 * a.k * 0.4));
          const key = `${h > 0.55 ? PALS.grassDeep : lit(PALS.grass, 0.25)}|${wd.toFixed(1)}`;
          (tuft[key] ??= []).push(`M${f2(a.x)},${f2(a.y)}L${f2(b.x)},${f2(b.y)}`);
        }
      }
  }
  return (
    <g>
      {Object.entries(peb).map(([c, s]) => <path key={c} d={s.join('')} fill={c} opacity={0.75} />)}
      {Object.entries(tuft).map(([k, s]) => {
        const [c, w] = k.split('|');
        return <path key={k} d={s.join('')} stroke={c} strokeWidth={w} strokeLinecap="round" opacity={0.85} />;
      })}
    </g>
  );
};

/** boulders, driftwood and willow clumps (sorted far to near) */
const Props: React.FC<{L: Lens}> = ({L}) => {
  const items: {d: number; el: React.ReactNode}[] = [];
  ROCKS.forEach((r, i) => {
    const c = v3(r.x, 0, r.z);
    const d = d3(s3(c, L.pos), L.f);
    if (d < 0.6 || d > 700) return;
    const p = L.p(c);
    const R = r.r * p.k;
    if (R < 0.8 || p.x < -R * 2 || p.x > W + R * 2 || p.y < -R * 2 || p.y > H + R * 2) return;
    const top = L.p(v3(r.x, r.r * 0.8, r.z));
    const hgt = Math.abs(p.y - top.y);
    const col = mix(r.s > 0.5 ? PALS.rock : '#BDB5A6', PALS.haze, Math.min(0.8, d / 900));
    items.push({d, el: (
      <g key={`r${i}`}>
        <ellipse cx={f2(p.x + R * 0.15)} cy={f2(p.y + R * 0.08)} rx={f2(R * 1.15)} ry={f2(R * 0.28)} fill="#5E5A4E" opacity={0.25} />
        <path d={`M${f2(p.x - R)},${f2(p.y)} C${f2(p.x - R)},${f2(p.y - hgt * 0.9)} ${f2(p.x - R * 0.2)},${f2(p.y - hgt * 1.15)} ${f2(p.x + R * 0.25)},${f2(p.y - hgt)} C${f2(p.x + R * 0.8)},${f2(p.y - hgt * 0.85)} ${f2(p.x + R)},${f2(p.y - hgt * 0.4)} ${f2(p.x + R)},${f2(p.y)} Z`}
          fill={col} stroke="#4E4A40" strokeWidth={f2(Math.max(0.6, Math.min(3, 0.02 * p.k)))} paintOrder="stroke" />
        <path d={`M${f2(p.x - R * 0.45)},${f2(p.y - hgt * 0.75)} Q${f2(p.x)},${f2(p.y - hgt * 1.02)} ${f2(p.x + R * 0.35)},${f2(p.y - hgt * 0.8)}`} stroke={lit(col, 0.35)} strokeWidth={f2(Math.max(0.6, R * 0.12))} fill="none" strokeLinecap="round" opacity={0.8} />
      </g>
    )});
  });
  LOGS.forEach((g, i) => {
    const a = v3(g.x - (Math.cos(g.a) * g.len) / 2, 0.12, g.z - (Math.sin(g.a) * g.len) / 2);
    const b = v3(g.x + (Math.cos(g.a) * g.len) / 2, 0.12, g.z + (Math.sin(g.a) * g.len) / 2);
    const d = d3(s3(v3(g.x, 0, g.z), L.pos), L.f);
    if (d3(s3(a, L.pos), L.f) < 0.5 || d3(s3(b, L.pos), L.f) < 0.5 || d > 500) return;
    const pa = L.p(a), pb = L.p(b);
    items.push({d, el: <path key={`g${i}`} d={`M${f2(pa.x)},${f2(pa.y)}L${f2(pb.x)},${f2(pb.y)}`} stroke={PALS.log} strokeWidth={f2(Math.max(1, 0.24 * pa.k))} strokeLinecap="round" />});
  });
  WILLOWS.forEach((w, i) => {
    const base = v3(w.x, 0, w.z);
    const d = d3(s3(base, L.pos), L.f);
    if (d < 2) return;
    const b = L.p(base), c = L.p(v3(w.x, w.h * 0.7, w.z));
    const R = w.r * c.k;
    if (c.x < -R * 2 || c.x > W + R * 2) return;
    const col = mix(mix(PALS.willow, '#86A86E', hash(i, 135) * 0.5), PALS.haze, Math.min(0.75, d / 1400));
    items.push({d, el: (
      <g key={`w${i}`}>
        <path d={`M${f2(b.x)},${f2(b.y)}L${f2(c.x)},${f2(c.y)}`} stroke={mix('#6B4E36', PALS.haze, Math.min(0.7, d / 1400))} strokeWidth={f2(Math.max(1, 0.25 * b.k))} />
        {[[-0.55, 0.2, 0.7], [0.5, 0.15, 0.75], [0, -0.3, 0.9], [0.05, 0.25, 0.85]].map(([u, v, s], k) => (
          <ellipse key={k} cx={f2(c.x + u * R)} cy={f2(c.y + v * R)} rx={f2(s * R)} ry={f2(s * R * 1.05)} fill={k === 3 ? lit(col, 0.08) : shade(col, 0.07 * k)} />
        ))}
      </g>
    )});
  });
  items.sort((a, b) => b.d - a.d);
  return <g>{items.map((x) => x.el)}</g>;
};

/** the flat itself: grass, beach band and wet edge, textured and furnished */
export const ShoreFlat: React.FC<{id: string; L: Lens; t: number; near: number; wind?: number}> = ({id, L, t, near, wind = 0.3}) => {
  const grassQ = clipNear(L, band(L, (x) => beachZ(x) + 0.5, () => -near - 14, 0.004), 0.3);
  const beachQ = clipNear(L, band(L, shoreZ, beachZ), 0.3);
  const wetQ = clipNear(L, band(L, shoreZ, (x) => shoreZ(x) - 1.6 - 0.8 * noise1(x / 7, 104), 0.008), 0.3);
  // a far edge for the haze gradient
  const far = L.p(v3(L.pos.x, 0, -near));
  const nearP = L.p(v3(L.pos.x, 0, Math.min(0, L.pos.z - 2)));
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(far.y)} x2="0" y2={f2(Math.max(far.y + 50, nearP.y))}>
          <stop offset="0" stopColor={PALS.grassFar} />
          <stop offset="1" stopColor={PALS.grass} />
        </linearGradient>
      </defs>
      {grassQ.length > 2 && <path d={polyD(proj(L, grassQ))} fill={`url(#${id}-sg)`} />}
      {beachQ.length > 2 && <path d={polyD(proj(L, beachQ))} fill={PALS.beach} />}
      {wetQ.length > 2 && <path d={polyD(proj(L, wetQ))} fill={PALS.wet} />}
      <Texture L={L} t={t} wind={wind} />
      <Props L={L} />
    </g>
  );
};
