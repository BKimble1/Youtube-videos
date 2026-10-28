// The Yangtze at Badong, as a 3D set drawn in layers: sky and clouds, the gorge ridges on both banks (each ridge is a
// profile at a fixed distance from its bank, so parallax comes from the projection itself), the far-bank town, the
// cable-stayed bridge downstream, the water (sky-to-jade gradient, mirrored ridges, world-fixed ripple strokes that
// drift with the current) and the board's downwash on the surface. River: the water is y = 0 between the near bank
// (z = 0) and the far bank (z = RIVER.far); it flows toward -x.
import React from 'react';
import {fmt} from '../dc/math';
import {hash, noise1} from '../dc/math';
import {circ3, f2, mix, P2, polyD, proj, shade, lit} from '../eng/draw';
import {a3, clipNear, d3, H, Lens, m3, n3, s3, V3, v3, W} from '../eng/v3';
import {GorgeAt, gorgeNotch, GorgeWalls} from './Gorge';
import {Shoal, ShoalAt, ShoreFlat} from './Shore';

export const RIVER = {far: 520, current: 1.1};
export const PALR = {
  skyTop: '#7DBBDD',
  skyMid: '#B4DAEA',
  skyHor: '#E8F1EC',
  haze: '#CFE0DE',
  waterNear: '#2F6C67',
  waterMid: '#4E8981',
  waterFar: '#B4D3D0',
  glintL: '#EAF7F2',
  glintD: '#2C5F5B',
  ridge: ['#58875A', '#5F8F6C', '#7AA28F', '#9BBBB6', '#B9CFD0'],
  bank: '#8E8B76',
  bankGreen: '#6E9257',
  wall: '#EEECE6',
  roof: '#9AA3A8',
};

const hazeAt = (c: string, dist: number) => mix(c, PALR.haze, 1 - Math.exp(-dist / 2600));

/** terrain layers behind each bank: [distance from the bank (m), base height, amplitude, feature scale, colour] */
const LAY: [number, number, number, number, string][] = [
  [12, 9, 7, 90, '#6E9257'],
  [70, 26, 12, 160, '#679560'],
  [140, 46, 18, 220, '#5F8F63'],
  [230, 70, 30, 300, '#5E8C68'],
  [480, 170, 170, 520, '#6F9C87'],
  [1000, 330, 250, 800, '#8FB2AA'],
  [1700, 480, 320, 1100, '#AEC7C6'],
  [2700, 620, 360, 1500, '#C2D5D5'],
];
/** ridge height profile along x (steep gorge peaks on the high layers, rolling terraces low down) */
const ridgeH = (x: number, layer: number, side: number) => {
  const s = side * 13 + layer * 7;
  const [, base, amp, sc] = LAY[layer];
  const r = 1 - Math.abs(noise1(x / sc, s));
  const n2 = noise1(x / (sc * 0.37), s + 3) * 0.3;
  const n3_ = noise1(x / (sc * 0.13), s + 5) * 0.03;
  const shape = layer >= 4 ? Math.pow(r, 1.6) * 0.95 : 0.5 + 0.5 * noise1(x / sc, s);
  return Math.max(2, base + amp * (shape + n2 + n3_));
};
const LAYERS = LAY.map((l) => l[0]);

type Ridge = {pts: V3[]; dist: number; color: string; layer: number; side: number; z: number; cap?: V3[]};
const ridges = (L: Lens, gorge?: GorgeAt, near = 0): Ridge[] => {
  const out: Ridge[] = [];
  for (const side of [1, -1]) {
    for (let li = 0; li < LAYERS.length; li++) {
      const z = side > 0 ? RIVER.far + LAYERS[li] : -LAYERS[li] - near;
      const step = li === 0 ? 14 : li < 4 ? 30 : li < 6 ? 45 : 90;
      const x0 = Math.floor((L.pos.x - 9000) / step) * step;
      const pts: V3[] = [];
      for (let x = x0; x <= L.pos.x + 9000; x += step) pts.push(v3(x, gorge && side > 0 && gorgeNotch(gorge, x, z) ? -6 : ridgeH(x, li, side), z));
      pts.push(v3(L.pos.x + 9000, -6, z), v3(x0, -6, z));
      const dist = Math.abs(z - L.pos.z) + 1;
      const c = LAY[li][4];
      // the cap: crest heights carried back to the next layer (a terrace top), for the low layers
      let cap: V3[] | undefined;
      if (li < 4) {
        const zb = side > 0 ? RIVER.far + LAYERS[li + 1] : -LAYERS[li + 1] - near;
        const crest = pts.slice(0, pts.length - 2);
        cap = [...crest, ...crest.slice().reverse().map((q) => v3(q.x, q.y, zb))];
      }
      out.push({pts, dist, color: hazeAt(c, dist), layer: li, side, z, cap});
    }
  }
  return out.sort((a, b) => b.dist - a.dist);
};

/** Sky gradient across the frame, oriented by the horizon (follows camera pitch and roll). */
export const horizon = (L: Lens) => {
  const fh = n3(v3(L.f.x, 0, L.f.z));
  const c = a3(L.pos, m3(fh, 30000));
  const rh = n3(v3(L.r.x, 0, L.r.z));
  const a = L.p(a3(v3(c.x, 0, c.z), m3(rh, -8000)));
  const b = L.p(a3(v3(c.x, 0, c.z), m3(rh, 8000)));
  return {a, b, y: (a.y + b.y) / 2};
};

export const Sky: React.FC<{id: string; L: Lens; tint?: number}> = ({id, L, tint = 0}) => {
  const h = horizon(L);
  // the gradient runs perpendicular to the horizon line
  const dx = h.b.x - h.a.x, dy = h.b.y - h.a.y;
  const ln = Math.hypot(dx, dy) || 1;
  const nx = dy / ln, ny = -dx / ln; // points up-screen
  const cx = W / 2, cy = h.a.y + (h.b.y - h.a.y) * ((W / 2 - h.a.x) / (dx || 1));
  const top = mix(PALR.skyTop, '#F2B27A', tint);
  const hor = mix(PALR.skyHor, '#F7D6A8', tint);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} gradientUnits="userSpaceOnUse" x1={f2(cx)} y1={f2(cy)} x2={f2(cx + nx * 1900)} y2={f2(cy + ny * 1900)}>
          <stop offset="0" stopColor={hor} />
          <stop offset="0.18" stopColor={mix(PALR.skyMid, hor, 0.3)} />
          <stop offset="0.6" stopColor={mix(PALR.skyMid, top, 0.5)} />
          <stop offset="1" stopColor={top} />
        </linearGradient>
      </defs>
      <rect x={-200} y={-200} width={W + 400} height={H + 400} fill={`url(#${id}-sky)`} />
    </g>
  );
};

const CLOUDS: [number, number, number, number][] = [
  [-2600, 900, 4200, 380], [-400, 1100, 5200, 520], [1900, 950, 4700, 420], [3800, 1250, 6000, 560], [-4800, 1150, 5600, 480],
  [-1500, 900, -4300, 420], [900, 1050, -5200, 520], [3300, 950, -4600, 400], [-3800, 1200, -6000, 560], [5600, 1000, 1200, 520], [-6200, 1050, -400, 520],
];
export const Clouds: React.FC<{L: Lens}> = ({L}) => (
  <g>
    {CLOUDS.map(([x, y, z, r], i) => {
      const c = v3(x, y, z);
      if (d3(s3(c, L.pos), L.f) < 50) return null;
      const p = L.p(c);
      const R = r * p.k;
      if (p.x < -R * 3 || p.x > W + R * 3 || p.y < -R * 2 || p.y > H + R) return null;
      const puffs = [[-1.5, 0.15, 0.55], [-0.75, -0.25, 0.75], [0.1, -0.45, 0.9], [0.95, -0.15, 0.7], [1.6, 0.18, 0.5], [0, 0.2, 0.8]];
      return (
        <g key={i} opacity={0.92}>
          {puffs.map(([u, v, s], k) => (
            <ellipse key={k} cx={f2(p.x + u * R)} cy={f2(p.y + v * R)} rx={f2(s * R)} ry={f2(s * R * 0.78)} fill={k === 5 ? '#E3EEF2' : '#FBFDFD'} />
          ))}
          <ellipse cx={f2(p.x)} cy={f2(p.y + R * 0.38)} rx={f2(R * 2.0)} ry={f2(R * 0.22)} fill="#DDE9EE" />
        </g>
      );
    })}
  </g>
);

/** rounded tree crowns along the crest of the bank and the first ridge */
const TreeLine: React.FC<{L: Lens; r: {pts: V3[]; color: string; layer: number; dist: number}}> = ({L, r}) => {
  const els: string[] = [];
  const n = r.pts.length - 2;
  const every = r.layer === 0 ? 1 : r.layer < 4 ? 2 : 3;
  for (let i = 0; i < n; i += every) {
    const q = r.pts[i];
    if (d3(s3(q, L.pos), L.f) < 5) continue;
    const p = L.p(q);
    if (p.x < -40 || p.x > W + 40 || p.y < -40 || p.y > H) continue;
    const rr = [3.2, 4, 5, 6, 10][r.layer] * (0.7 + hash(i, r.layer + 40) * 0.6) * p.k;
    if (rr < 0.8) continue;
    els.push(`M${f2(p.x - rr)},${f2(p.y)} a${f2(rr)},${f2(rr * 0.9)} 0 1,1 ${f2(2 * rr)},0 Z`);
  }
  return <path d={els.join('')} fill={shade(r.color, 0.12)} opacity={0.9} />;
};

/** far-bank town: blocks stepping up the slope behind the bank (Badong) */
const TOWN: {x: number; z: number; w: number; d: number; h: number; y: number; layer: number}[] = (() => {
  const o = [];
  for (let i = 0; i < 120; i++) {
    const layer = 1 + Math.floor(hash(i, 4) * 3);
    const x = -1700 + hash(i, 3) * 2300;
    const z = RIVER.far + LAY[layer][0] - 6 - hash(i, 8) * 30;
    const y = ridgeH(x, layer, 1) - 3;
    o.push({x, z, w: 7 + hash(i, 5) * 8, d: 8 + hash(i, 6) * 6, h: 8 + hash(i, 7) * 15, y, layer});
  }
  return o.sort((a, b) => b.z - a.z);
})();
const Town: React.FC<{L: Lens; layer: number}> = ({L, layer}) => (
  <g>
    {TOWN.map((b, i) => {
      if (b.layer !== layer) return null;
      const c = v3(b.x, b.y, b.z);
      if (d3(s3(c, L.pos), L.f) < 20) return null;
      const dist = Math.hypot(c.x - L.pos.x, c.z - L.pos.z);
      const q = proj(L, [v3(b.x - b.w / 2, b.y - 8, b.z - b.d / 2), v3(b.x + b.w / 2, b.y - 8, b.z - b.d / 2), v3(b.x + b.w / 2, b.y + b.h, b.z - b.d / 2), v3(b.x - b.w / 2, b.y + b.h, b.z - b.d / 2)]);
      const sx = L.pos.x < b.x ? -1 : 1;
      const sideF = proj(L, [v3(b.x + (sx * b.w) / 2, b.y - 8, b.z - b.d / 2), v3(b.x + (sx * b.w) / 2, b.y - 8, b.z + b.d / 2), v3(b.x + (sx * b.w) / 2, b.y + b.h, b.z + b.d / 2), v3(b.x + (sx * b.w) / 2, b.y + b.h, b.z - b.d / 2)]);
      const roof = proj(L, [v3(b.x - b.w / 2, b.y + b.h, b.z - b.d / 2), v3(b.x + b.w / 2, b.y + b.h, b.z - b.d / 2), v3(b.x + b.w / 2, b.y + b.h, b.z + b.d / 2), v3(b.x - b.w / 2, b.y + b.h, b.z + b.d / 2)]);
      const fill = hazeAt(i % 5 === 0 ? '#D8D2C4' : PALR.wall, dist * 1.6);
      const win = hazeAt('#6F8796', dist);
      const rows = Math.floor(b.h / 6);
      return (
        <g key={i}>
          <path d={polyD(sideF)} fill={hazeAt(shade(i % 5 === 0 ? '#D8D2C4' : PALR.wall, 0.3), dist)} />
          <path d={polyD(roof)} fill={hazeAt('#9AA5AA', dist)} />
          <path d={polyD(q)} fill={fill} />
          <path d={polyD([q[0], q[1], {x: q[1].x, y: q[1].y - (q[1].y - q[2].y) * 0.12}, {x: q[0].x, y: q[0].y - (q[0].y - q[3].y) * 0.12}])} fill={hazeAt('#55705E', dist)} opacity={0.55} />
          {rows > 1 && Array.from({length: rows - 1}, (_, r) => {
            const a = L.p(v3(b.x - b.w * 0.38, b.y + 5 + r * 6, b.z - b.d / 2));
            const e = L.p(v3(b.x + b.w * 0.38, b.y + 5 + r * 6, b.z - b.d / 2));
            return <path key={r} d={`M${f2(a.x)},${f2(a.y)} L${f2(e.x)},${f2(e.y)}`} stroke={win} strokeWidth={f2(Math.max(0.5, 1.6 * a.k))} strokeDasharray={`${f2(Math.max(0.6, 2.2 * a.k))} ${f2(Math.max(0.5, 1.6 * a.k))}`} opacity={0.7} />;
          })}
        </g>
      );
    })}
  </g>
);

/** Badong's cable-stayed bridge downstream: deck, two H pylons, stay fans. */
const BRIDGE = {x: -1150, y: 46, z0: -60, z1: RIVER.far + 60, pylons: [120, 400], ph: 150};
const Bridge: React.FC<{L: Lens; mirror?: boolean}> = ({L, mirror}) => {
  const sy = mirror ? -1 : 1;
  const P = (x: number, y: number, z: number) => L.p(v3(x, y * sy, z));
  const dist = Math.hypot(BRIDGE.x - L.pos.x, 260 - L.pos.z);
  const col = hazeAt('#E8ECEE', dist);
  const dark = hazeAt('#8C979E', dist);
  if (d3(s3(v3(BRIDGE.x, 40, 260), L.pos), L.f) < 50) return null;
  const deck = [P(BRIDGE.x, BRIDGE.y, BRIDGE.z0), P(BRIDGE.x, BRIDGE.y, BRIDGE.z1), P(BRIDGE.x, BRIDGE.y - 4, BRIDGE.z1), P(BRIDGE.x, BRIDGE.y - 4, BRIDGE.z0)];
  const els: React.ReactNode[] = [<path key="d" d={polyD(deck)} fill={col} stroke={dark} strokeWidth={0.8} strokeDasharray={mirror ? '9 6' : undefined} />];
  BRIDGE.pylons.forEach((pz, i) => {
    for (const dx of [-9, 9]) {
      // V5: on the rain-roughened water the reflection is broken into short ripple-length pieces and only reaches part
      // way down (a solid mirrored line read as a pole standing in the river)
      const a = P(BRIDGE.x + dx, 0, pz), b = P(BRIDGE.x + dx * (mirror ? 0.79 : 0.3), mirror ? BRIDGE.ph * 0.3 : BRIDGE.ph, pz);
      const sw = Math.max(1.2, 5 * a.k);
      els.push(<path key={`p${i}${dx}`} d={`M${f2(a.x)},${f2(a.y)} L${f2(b.x)},${f2(b.y)}`} stroke={col} strokeWidth={f2(sw)} strokeDasharray={mirror ? `${f2(sw * 2.2)} ${f2(sw * 1.6)}` : undefined} />);
    }
    if (mirror) return;
    for (let c = 1; c <= 9; c++) {
      const top = P(BRIDGE.x, BRIDGE.ph - 6 - c * 3, pz);
      for (const s of [-1, 1]) {
        const e = P(BRIDGE.x, BRIDGE.y, pz + s * c * 15);
        els.push(<path key={`c${i}${c}${s}`} d={`M${f2(top.x)},${f2(top.y)} L${f2(e.x)},${f2(e.y)}`} stroke={dark} strokeWidth={0.6} opacity={0.75} />);
      }
    }
  });
  return <g opacity={mirror ? 0.16 : 1}>{els}</g>;
};

/** world-fixed ripple crests on the water (short arcs), four levels of detail, drifting with the current */
const Ripples: React.FC<{L: Lens; t: number; calm?: number; L2?: Lens}> = ({L, t, calm = 0, L2}) => {
  const g = v3(L.pos.x, 0, L.pos.z);
  const levels: [number, number, number][] = [[2.2, 36, 0], [4.6, 110, 36], [11, 380, 110], [32, 1400, 380]];
  const buckets: Record<string, string[]> = {};
  const drift = -RIVER.current * t;
  for (const [cell, r1, r0] of levels) {
    // V5: the lattice drifts with the current (no modulo wrap), so each crest keeps its identity as it moves
    const i0 = Math.floor((g.x - drift - r1) / cell), i1 = Math.ceil((g.x - drift + r1) / cell);
    const k0 = Math.floor((g.z - r1) / cell), k1 = Math.ceil((g.z + r1) / cell);
    for (let i = i0; i <= i1; i++) {
      for (let k = k0; k <= k1; k++) {
        const hsh = hash(i * 7919 + k, Math.round(cell * 10));
        const x = i * cell + hash(i * 31 + k, 11) * cell + drift;
        const z = k * cell + hash(i * 17 + k, 13) * cell;
        if (z < 1.5 || z > RIVER.far - 1.5) continue;
        const dd = Math.hypot(x - g.x, z - g.z);
        if (dd > r1 || dd < r0) continue;
        const q = v3(x, 0, z);
        if (d3(s3(q, L.pos), L.f) < 0.8) continue;
        const pc = L.p(q);
        if (pc.x < -60 || pc.x > W + 60 || pc.y < -30 || pc.y > H + 30) continue;
        const len = cell * (0.16 + hsh * 0.14);
        const tw = 0.5 + 0.5 * Math.sin(t * (1.2 + hsh * 1.6) + hsh * 40);
        const light = hsh > 0.5;
        const a = L.p(v3(x - len / 2, 0, z)), m = L.p(v3(x, 0.0, z - len * 0.12)), b = L.p(v3(x + len / 2, 0, z));
        const wd = Math.min(3.4, Math.max(0.6, cell * 0.04 * pc.k * 0.5));
        const op = Math.round((light ? 0.3 + 0.55 * tw : 0.2 + 0.25 * tw) * (1 - calm) * 4) / 4;
        if (op <= 0) continue;
        const key = `${light ? 'L' : 'D'}|${wd.toFixed(1)}|${op}`;
        // V2 motion blur: where the water sweeps past the lens faster than a crest's own length, the crest streaks
        // from where it was a shutter-time ago to where it is now
        if (L2) {
          const p2 = L2.p(q);
          const disp = Math.hypot(p2.x - pc.x, p2.y - pc.y);
          if (disp > Math.hypot(b.x - a.x, b.y - a.y) * 1.2) {
            // a streak, capped in length and drawn fainter (the eye reads speed, not rain)
            const k = Math.min(1, 46 / disp);
            const sx = pc.x + (p2.x - pc.x) * k, sy = pc.y + (p2.y - pc.y) * k;
            const key2 = `${light ? 'L' : 'D'}|${wd.toFixed(1)}|${Math.round(op * 0.5 * 4) / 4}`;
            if (light) (buckets[key2] ??= []).push(`M${f2(sx)},${f2(sy)}L${f2(pc.x)},${f2(pc.y)}`);
            continue;
          }
        }
        (buckets[key] ??= []).push(`M${f2(a.x)},${f2(a.y)}Q${f2(m.x)},${f2(m.y)} ${f2(b.x)},${f2(b.y)}`);
      }
    }
  }
  return (
    <g>
      {Object.entries(buckets).map(([key, segs]) => {
        const [kind, wd, op] = key.split('|');
        return <path key={key} d={segs.join('')} stroke={kind === 'L' ? PALR.glintL : PALR.glintD} strokeWidth={wd} strokeOpacity={op} strokeLinecap="round" fill="none" />;
      })}
    </g>
  );
};

/** long current slicks: smooth lighter streaks along the flow, world-fixed (large-scale texture on the river) */
const SLICKS = Array.from({length: 46}, (_, i) => ({x: -1400 + hash(i, 61) * 2800, z: 20 + hash(i, 62) * (RIVER.far - 40), len: 60 + hash(i, 63) * 220, w: 3 + hash(i, 64) * 10, light: hash(i, 65) > 0.35}));
const Slicks: React.FC<{L: Lens; t: number}> = ({L, t}) => (
  <g>
    {SLICKS.map((k, i) => {
      const x = k.x - RIVER.current * t * 0.6;
      const pts: V3[] = [];
      for (let a = 0; a < 16; a++) {
        const th = (a / 16) * Math.PI * 2;
        pts.push(v3(x + Math.cos(th) * k.len * 0.5, 0, k.z + Math.sin(th) * k.w * 0.5 * (1 + 0.3 * Math.sin(th * 3))));
      }
      const cl = clipNear(L, pts, 1);
      if (cl.length < 3) return null;
      return <path key={i} d={polyD(proj(L, cl))} fill={k.light ? '#9CC6BE' : '#245652'} opacity={k.light ? 0.16 : 0.12} />;
    })}
  </g>
);

/** the board's downwash on the water: a darker, roughened patch and rings spreading from under the board */
export const Downwash: React.FC<{L: Lens; at: V3; alt: number; thrust: number; t: number; ground?: 'water' | 'dust'}> = ({L, at, alt, thrust, t, ground = 'water'}) => {
  const k = Math.max(0, Math.min(1, (1 - alt / 9) * thrust));
  if (k <= 0.01) return null;
  const c = v3(at.x, 0.02, at.z);
  if (d3(s3(c, L.pos), L.f) < 0.5) return null;
  const X = v3(1, 0, 0), Z = v3(0, 0, 1);
  const patch = proj(L, circ3(c, X, Z, 1.2 + alt * 0.25, 30));
  const rings: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const ph = (t * 0.9 + i / 4) % 1;
    const r = 0.6 + ph * (2.2 + alt * 0.35);
    const pr = proj(L, circ3(c, X, Z, r, 36));
    rings.push(<path key={i} d={polyD(pr)} fill="none" stroke={ground === 'water' ? '#F1FBF8' : '#E9DCC3'} strokeWidth={f2(Math.max(0.7, 0.05 * L.p(c).k))} strokeOpacity={0.55 * k * (1 - ph)} />);
  }
  // spray / dust flecks on the ring edge
  const fl: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const a = hash(i, 21) * Math.PI * 2 + t * 0.4;
    const ph = (t * 1.3 + hash(i, 22)) % 1;
    const r = 0.8 + ph * (2.0 + alt * 0.3);
    const q = L.p(v3(c.x + Math.cos(a) * r, 0.05 + Math.sin(ph * Math.PI) * 0.35 * (1 - alt / 10), c.z + Math.sin(a) * r));
    fl.push(<circle key={i} cx={f2(q.x)} cy={f2(q.y)} r={f2(Math.max(0.6, 0.025 * q.k))} fill={ground === 'water' ? '#FFFFFF' : '#D8C6A2'} opacity={0.7 * k * (1 - ph)} />);
  }
  return (
    <g>
      <path d={polyD(patch)} fill={ground === 'water' ? '#2C635F' : '#8D7F66'} opacity={0.32 * k} />
      {rings}
      {fl}
    </g>
  );
};

/** red-and-white channel buoy (foreground parallax in the hook) */
export const Buoy: React.FC<{L: Lens; at: V3; t: number}> = ({L, at, t}) => {
  if (d3(s3(at, L.pos), L.f) < 0.6) return null;
  const bob = Math.sin(t * 2.1) * 0.05;
  const c = v3(at.x, bob, at.z);
  const p = L.p(c);
  const k = p.k;
  const top = L.p(v3(at.x, bob + 2.1, at.z));
  const w = 0.55 * k;
  const ink = '#172B3A';
  return (
    <g>
      <ellipse cx={f2(p.x)} cy={f2(p.y)} rx={f2(w * 1.6)} ry={f2(w * 0.35)} fill="#2C5F5B" opacity={0.5} />
      <path d={`M${f2(p.x - w)},${f2(p.y)} L${f2(top.x - w * 0.35)},${f2(top.y)} L${f2(top.x + w * 0.35)},${f2(top.y)} L${f2(p.x + w)},${f2(p.y)} Z`} fill="#D9392B" stroke={ink} strokeWidth={f2(Math.max(0.8, 0.012 * k))} paintOrder="stroke" />
      <path d={`M${f2(p.x - w * 0.78)},${f2(p.y + (top.y - p.y) * 0.45)} L${f2(p.x + w * 0.78)},${f2(p.y + (top.y - p.y) * 0.45)} L${f2(p.x + w * 0.66)},${f2(p.y + (top.y - p.y) * 0.62)} L${f2(p.x - w * 0.66)},${f2(p.y + (top.y - p.y) * 0.62)} Z`} fill="#F4F2EC" />
      <circle cx={f2(top.x)} cy={f2(top.y - 0.12 * k)} r={f2(0.13 * k)} fill="#F6C343" stroke={ink} strokeWidth={f2(Math.max(0.8, 0.012 * k))} paintOrder="stroke" />
    </g>
  );
};

/** Everything behind the flying board: sky, clouds, ridges, town, bridge, water, reflections, ripples. */
export const RiverBack: React.FC<{id: string; L: Lens; t: number; tint?: number; gorge?: GorgeAt; L2?: Lens; near?: number; wind?: number; cliffs?: boolean; shoal?: ShoalAt; gorgeWater?: number}> = ({id, L, t, tint = 0, gorge, L2, near = 0, wind = 0.3, cliffs = false, shoal, gorgeWater}) => {
  const rs = ridges(L, gorge, near);
  const h = horizon(L);
  // water: the river quad between the banks, clipped to the front of the camera
  const wq = clipNear(L, [v3(L.pos.x - 9000, 0, -LAY[0][0]), v3(L.pos.x + 9000, 0, -LAY[0][0]), v3(L.pos.x + 9000, 0, RIVER.far + LAY[0][0]), v3(L.pos.x - 9000, 0, RIVER.far + LAY[0][0])], 0.4);
  const wp = proj(L, wq);
  const dx = h.b.x - h.a.x, dy = h.b.y - h.a.y;
  const ln = Math.hypot(dx, dy) || 1;
  const nx = -dy / ln, ny = dx / ln; // down-screen
  const hy = h.a.y + (h.b.y - h.a.y) * ((W / 2 - h.a.x) / (dx || 1));
  // V3: limestone cliff bands on the ridge faces (the Three Gorges look): a bare rock face under a green cap, in
  // stretches along the river, with strata lines; hazed with distance like the ridge itself
  const cliffBand = (r: Ridge, gid: string) => {
    const crest = r.pts.slice(0, r.pts.length - 2);
    const rocky = (x: number) => Math.min(1, Math.max(0, (noise1(x / 260, r.layer * 11 + r.side * 5) + 0.15) * 2.4));
    const topY = (q: V3) => q.y * (0.22 + 0.62 * rocky(q.x));
    const upper = crest.map((q) => v3(q.x, topY(q), q.z - r.side * 0.5));
    const lower = crest.map((q) => v3(q.x, q.y * 0.2, q.z - r.side * 0.5)).reverse();
    const cl = clipNear(L, [...upper, ...lower], 1);
    if (cl.length < 3) return null;
    const rock = mix(r.side > 0 ? '#C9BBA2' : '#C2B59C', PALR.haze, Math.min(0.85, 1 - Math.exp(-r.dist / 2200)));
    const strata = [0.35, 0.5, 0.65].map((f) => {
      const ln = clipNear(L, crest.map((q) => v3(q.x, q.y * (0.2 + (topY(q) / Math.max(1, q.y) - 0.2) * f), q.z - r.side * 0.6)), 1, false);
      return ln.length > 1 ? polyD(proj(L, ln), false) : '';
    }).join(' ');
    return (
      <g clipPath={`url(#${gid}c)`}>
        <path d={polyD(proj(L, cl))} fill={rock} />
        <path d={strata} fill="none" stroke={shade(rock, 0.22)} strokeWidth={f2(r.layer <= 2 ? 3 : 2)} opacity={0.5} strokeLinejoin="round" />
      </g>
    );
  };
  const ridgeEl = (r: Ridge, i: number, mirror: boolean) => {
    const pts = mirror ? r.pts.map((q) => v3(q.x, -q.y * 0.92, q.z)) : r.pts;
    const cl = clipNear(L, pts, 1);
    if (cl.length < 3) return null;
    const pp = proj(L, cl);
    // V5: no terrace cap once the camera is past the ridge's front plane (flying up the gorge it is inside the
    // terrace, and the near-clipped cap polygon covered the sky gap between the gorge walls)
    const past = r.side > 0 ? L.pos.z > r.z - 2 : L.pos.z < r.z + 2;
    const capC = !mirror && r.cap && !past ? clipNear(L, r.cap, 1) : [];
    const capEl = capC.length > 2 ? <path d={polyD(proj(L, capC))} fill={lit(r.color, 0.1)} /> : null;
    if (mirror) return <path key={`m${i}`} d={polyD(pp)} fill={mix(shade(r.color, 0.2), PALR.waterNear, 0.45)} opacity={0.22} />;
    const crest = pp.slice(0, pp.length - 2);
    const gid = `${id}-rg${i}`;
    const top = Math.min(...crest.map((q) => q.y));
    return (
      <g key={i}>
        {capEl}
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1={f2(top)} x2="0" y2={f2(hy + 40)}>
            <stop offset="0" stopColor={lit(r.color, 0.12)} />
            <stop offset="0.55" stopColor={r.color} />
            <stop offset="1" stopColor={mix(r.color, PALR.haze, 0.35)} />
          </linearGradient>
          <clipPath id={`${gid}c`}>
            <path d={polyD(pp)} />
          </clipPath>
        </defs>
        <path d={polyD(pp)} fill={`url(#${gid})`} />
        {cliffs && r.layer >= 1 && r.layer <= 4 && cliffBand(r, gid)}
        {r.layer >= 4 && r.layer <= 6 && (
          <g clipPath={`url(#${gid}c)`}>
            <path d={polyD(crest, false)} fill="none" stroke={lit(r.color, 0.3)} strokeWidth={f2(r.layer === 4 ? 14 : 8)} opacity={0.45} strokeLinejoin="round" />
            <path d={polyD(crest.map((q) => ({x: q.x + 10, y: q.y + 26})), false)} fill="none" stroke={shade(r.color, 0.18)} strokeWidth={f2(r.layer === 4 ? 10 : 6)} opacity={0.25} strokeLinejoin="round" />
          </g>
        )}
        {r.layer >= 4 && r.layer <= 5 && (
          <g clipPath={`url(#${gid}c)`}>
            {crest.map((q, k) => {
              if (k < 3 || k > crest.length - 4) return null;
              const lo = crest[k].y > crest[k - 3].y && crest[k].y > crest[k + 3].y && crest[k].y >= crest[k - 1].y && crest[k].y >= crest[k + 1].y;
              if (!lo) return null;
              const h = hy - q.y;
              const pts = [q, {x: q.x + h * 0.04, y: q.y + h * 0.3}, {x: q.x - h * 0.03, y: q.y + h * 0.65}, {x: q.x + h * 0.02, y: q.y + h}];
              return <path key={k} d={polyD(pts, false)} fill="none" stroke={shade(r.color, 0.25)} strokeWidth={f2(r.layer === 4 ? 5 : 3)} opacity={0.3} strokeLinejoin="round" strokeLinecap="round" />;
            })}
          </g>
        )}
        {r.layer <= 4 && <TreeLine L={L} r={r} />}
        {r.side > 0 && r.layer >= 1 && r.layer <= 3 && <Town L={L} layer={r.layer} />}
      </g>
    );
  };
  return (
    <g>
      <Sky id={id} L={L} tint={tint} />
      <Clouds L={L} />
      {rs.map((r, i) => ridgeEl(r, i, false))}
      {gorge && <GorgeWalls L={L} t={t} g={gorge} wfrom={gorgeWater} />}
      {/* V5: inside the gorge shot the gorge's own water (extended back over the river) is the only water, so the
          river's far edge never sweeps across the frame as a straight seam */}
      {wp.length > 2 && gorgeWater === undefined && (
        <g>
          <defs>
            <linearGradient id={`${id}-wat`} gradientUnits="userSpaceOnUse" x1={f2(W / 2)} y1={f2(hy)} x2={f2(W / 2 + nx * 1500)} y2={f2(hy + ny * 1500)}>
              <stop offset="0" stopColor={mix('#5A8A76', '#F3D2A6', tint * 0.5)} />
              <stop offset="0.035" stopColor="#4C7E70" />
              <stop offset="0.09" stopColor={mix(PALR.waterMid, PALR.waterFar, 0.25)} />
              <stop offset="0.25" stopColor={PALR.waterMid} />
              <stop offset="0.55" stopColor={PALR.waterNear} />
              <stop offset="1" stopColor={shade(PALR.waterNear, 0.25)} />
            </linearGradient>
            <clipPath id={`${id}-wc`}>
              <path d={polyD(wp)} />
            </clipPath>
          </defs>
          <path d={polyD(wp)} fill={`url(#${id}-wat)`} />
          <g clipPath={`url(#${id}-wc)`}>
            <Slicks L={L} t={t} />
            <Bridge L={L} mirror />
            <Ripples L={L} t={t} L2={L2} />
          </g>
        </g>
      )}
      {shoal && <Shoal L={L} g={shoal} />}
      {near > 0 && <ShoreFlat id={`${id}-sh`} L={L} t={t} near={near} wind={wind} />}
      <Bridge L={L} />
    </g>
  );
};
export {fmt};
export type {P2};

/** the downwash's trail on the water: ruffled patches left along the path the board has just flown (shows travel) */
export const Wake: React.FC<{L: Lens; path: {pos: V3; alt: number}[]; thrust: number}> = ({L, path, thrust}) => (
  <g>
    {path.map((q, k) => {
      const age = k + 1;
      const kk = Math.max(0, (1 - q.alt / 9) * thrust) * (1 - age / (path.length + 1));
      if (kk < 0.02) return null;
      const c = v3(q.pos.x, 0.01, q.pos.z);
      if (d3(s3(c, L.pos), L.f) < 0.6) return null;
      const r = 1.1 + age * 0.45;
      const pts = proj(L, circ3(c, v3(1, 0, 0), v3(0, 0, 1), r, 26));
      return (
        <g key={k}>
          <path d={polyD(pts)} fill="#2C635F" opacity={0.2 * kk} />
          <path d={polyD(pts)} fill="none" stroke="#EEF9F6" strokeOpacity={0.45 * kk} strokeWidth={f2(Math.max(0.6, 0.04 * L.p(c).k))} />
        </g>
      );
    })}
  </g>
);
