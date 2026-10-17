// Fire, smoke, embers and haze for the battlefield — all depth-sorted sprites, drawn as flat illustrated shapes
// (no blur filters): flame tongues in three tones over a soft glow, smoke as layered two-tone blobs that rise,
// spread and drift with the wind (WIND), embers and ground haze near the camera.
//
//   atmosItems(view, t, opts?) → Item[]   add next to setItems()
//   fireLights(t)                          (re-exported from fires.ts) near fires as point lights for the shader
//   smokeColumn(key, base, o, t, view)     a column a shot can add (e.g. the decoy smoke in the crater)
import React from 'react';
import {V3, noise, rnd, clamp, smooth, smoothPath} from '../../kit/math';
import {View, Item, SpriteCtx, mix} from '../engine';
import {FIRES, Fire, burn, fireLights} from './fires';
import {WIND, PLAN} from './plan';
import {towerState} from './set';
import {M} from '../timing';

const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

// ------------------------------------------------------------------ fire
const FIRE_COLS = {
  normal: ['#C8402A', '#F07A2E', '#FFC25A'],
  red: ['#9E2E24', '#D4532B', '#F29A44'],
  hot: ['#E2552E', '#FF9E3D', '#FFE39A'],
};
/** One flame tongue (teardrop) of height h, width w at (x, y) base, swaying by `sway` (px). */
const tongue = (x: number, y: number, w: number, h: number, sway: number, lean: number) => {
  const tx = x + sway + lean * h * 0.25, ty = y - h;
  return `M${f1(x - w / 2)} ${f1(y)} C${f1(x - w * 0.55)} ${f1(y - h * 0.45)} ${f1(tx - w * 0.18)} ${f1(ty + h * 0.32)} ${f1(tx)} ${f1(ty)} C${f1(tx + w * 0.16)} ${f1(ty + h * 0.36)} ${f1(x + w * 0.58)} ${f1(y - h * 0.4)} ${f1(x + w / 2)} ${f1(y)} Z`;
};

const fireSprite = (f: Fire, t: number): Item => ({
  kind: 'sprite', key: `fire_${f.id}`, pos: f.pos, bias: 0.4,
  draw: (c: SpriteCtx) => {
    const b = burn(f, t);
    if (b <= 0.01) return null;
    const H = f.size * c.k * b;
    if (H < 1.2) return null;
    const Wd = H * (f.spread ?? 1.3) * 0.55;
    const heat = f.heat ?? 0;
    const cols = heat > 0.4 ? FIRE_COLS.red : heat < -0.2 ? FIRE_COLS.hot : FIRE_COLS.normal;
    const fog = c.lit.fog * 0.55;
    const C = cols.map((q) => mix(q, c.light.fogColor, fog));
    const lean = -WIND.x * 0.35; // flames lean downwind (screen approx)
    const n = H > 40 ? 5 : H > 12 ? 4 : 3;
    const tongues: string[][] = [[], [], []];
    for (let i = 0; i < n; i++) {
      const s = f.seed * 17 + i * 5;
      const ph = t * (2.2 + rnd(s) * 1.6) + rnd(s + 1) * 10;
      const off = (i / (n - 1 || 1) - 0.5) * Wd * 0.8;
      const hh = H * (0.55 + 0.45 * rnd(s + 2)) * (0.82 + 0.18 * noise(ph, s));
      const ww = Wd * (0.42 + 0.25 * rnd(s + 3));
      const sway = noise(ph * 1.3, s + 7) * ww * 0.35;
      tongues[0].push(tongue(c.x + off, c.y, ww, hh, sway, lean));
      tongues[1].push(tongue(c.x + off * 0.9, c.y, ww * 0.72, hh * 0.72, sway * 0.9, lean));
      tongues[2].push(tongue(c.x + off * 0.8, c.y, ww * 0.42, hh * 0.42, sway * 0.7, lean));
    }
    const gr = H * 1.25;
    const gid = `fg_${f.id}`;
    return (
      <g>
        <defs>
          <radialGradient id={gid}>
            <stop offset={0} stopColor={C[2]} stopOpacity={0.42 * b * (1 - fog)} />
            <stop offset={0.45} stopColor={C[1]} stopOpacity={0.16 * b * (1 - fog)} />
            <stop offset={1} stopColor={C[1]} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c.x} cy={c.y - H * 0.35} rx={gr * 1.3} ry={gr} fill={`url(#${gid})`} />
        <path d={tongues[0].join('')} fill={C[0]} />
        <path d={tongues[1].join('')} fill={C[1]} />
        <path d={tongues[2].join('')} fill={C[2]} />
      </g>
    );
  },
});

// ------------------------------------------------------------------ smoke
export type ColumnOpts = {
  /** puff count */
  n?: number;
  /** rise speed m/s */
  rise?: number;
  /** life of a puff (s) */
  life?: number;
  /** starting / final puff radius (m) */
  r0?: number;
  r1?: number;
  /** wind drift multiplier */
  drift?: number;
  /** darkness 0 (light grey dust) .. 1 (black oily) */
  dark?: number;
  /** overall opacity */
  alpha?: number;
  seed?: number;
  /** warm underside (lit by the fire below) 0..1 */
  warm?: number;
  /** starts at film time */
  from?: number;
};

const blobD = (x: number, y: number, r: number, seed: number, wob: number) => {
  const n = 8;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed * 0.37;
    const rr = r * (1 + 0.16 * Math.sin(a * 2 + seed) + 0.1 * Math.sin(a * 3 + seed * 1.7 + wob));
    pts.push({x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr * 0.84});
  }
  return smoothPath(pts, true, 1);
};

/** A smoke column's puffs as sprites. */
export const smokeColumn = (key: string, base: V3, o: ColumnOpts, t: number): Item[] => {
  const n = o.n ?? 10, life = o.life ?? 9, rise = o.rise ?? 2.2, r0 = o.r0 ?? 1.2, r1 = o.r1 ?? 7, drift = o.drift ?? 1;
  const seed = o.seed ?? 1;
  const dark = o.dark ?? 0.6, alpha = o.alpha ?? 0.8, warm = o.warm ?? 0.4;
  const out: Item[] = [];
  const tt = o.from !== undefined ? t - o.from : t + 1000;
  if (tt < 0) return out;
  for (let i = 0; i < n; i++) {
    const s = seed * 101 + i;
    const age = ((tt / life + i / n + rnd(s) * 0.05) % 1) * life;
    if (o.from !== undefined && age > tt) continue;
    const k = age / life;
    const up = rise * age * (1 - 0.25 * k);
    const wob = noise(t * 0.25 + s, s) * (r0 + (r1 - r0) * k) * 0.35;
    const pos: V3 = {
      x: base.x + WIND.x * drift * age * (0.5 + k) + wob,
      y: base.y + up,
      z: base.z + WIND.z * drift * age * (0.5 + k) + noise(t * 0.21 + s * 3, s + 5) * (r0 + (r1 - r0) * k) * 0.35,
    };
    const r = r0 + (r1 - r0) * Math.sqrt(k);
    const fade = smooth(k / 0.12) * (1 - smooth((k - 0.7) / 0.3));
    out.push({
      kind: 'sprite', key: `${key}_${i}`, pos,
      draw: (c: SpriteCtx) => {
        const R = r * c.k;
        if (R < 0.8) return null;
        const fogK = c.lit.fog;
        const baseC = mix(mix('#2E2A2A', '#8A8580', 1 - dark), c.light.fogColor, 0.25 + fogK * 0.65);
        const litC = mix(mix(baseC, c.light.sunColor, 0.28), c.light.fogColor, fogK * 0.5);
        const warmC = mix(baseC, '#C8552E', warm * (1 - k) * 0.7);
        const a = alpha * fade * (1 - fogK * 0.35);
        const sx = c.light.sun.x >= 0 ? 1 : -1; // highlight toward the sun side (screen approx)
        return (
          <g opacity={f1(a)}>
            <path d={blobD(c.x, c.y, R, s, t * 0.3)} fill={warm > 0 && k < 0.4 ? warmC : baseC} />
            <path d={blobD(c.x - sx * R * 0.18, c.y - R * 0.22, R * 0.68, s + 3, t * 0.3)} fill={litC} opacity={0.75} />
          </g>
        );
      },
    });
  }
  return out;
};

/** One still smoke/dust puff (two-tone blob) of radius r metres. */
export const puffItem = (key: string, pos: V3, r: number, o: {dark?: number; alpha?: number; seed?: number; t?: number} = {}): Item => ({
  kind: 'sprite', key, pos,
  draw: (c: SpriteCtx) => {
    const R = r * c.k;
    if (R < 0.8) return null;
    const dark = o.dark ?? 0.5, s = o.seed ?? 1;
    const baseC = mix(mix('#2E2A2A', '#8A8580', 1 - dark), c.light.fogColor, 0.25 + c.lit.fog * 0.65);
    const litC = mix(mix(baseC, c.light.sunColor, 0.28), c.light.fogColor, c.lit.fog * 0.5);
    const sx = c.light.sun.x >= 0 ? 1 : -1;
    return (
      <g opacity={f1((o.alpha ?? 0.8) * (1 - c.lit.fog * 0.35))}>
        <path d={blobD(c.x, c.y, R, s, (o.t ?? 0) * 0.3)} fill={baseC} />
        <path d={blobD(c.x - sx * R * 0.18, c.y - R * 0.22, R * 0.68, s + 3, (o.t ?? 0) * 0.3)} fill={litC} opacity={0.75} />
      </g>
    );
  },
});

// ------------------------------------------------------------------ embers and haze
const embers = (view: View, t: number): Item[] => {
  const out: Item[] = [];
  FIRES.forEach((f) => {
    const d = Math.hypot(f.pos.x - view.pos.x, f.pos.y - view.pos.y, f.pos.z - view.pos.z);
    if (d > 70 || f.size > 8) return;
    const n = Math.round(6 + f.size * 3);
    for (let i = 0; i < n; i++) {
      const s = f.seed * 211 + i;
      const life = 2.5 + rnd(s) * 2.5;
      const age = ((t / life + rnd(s + 1)) % 1) * life;
      const k = age / life;
      const p: V3 = {
        x: f.pos.x + (rnd(s + 2) - 0.5) * f.size + WIND.x * age * 1.4 + noise(t * 1.3 + s, s) * 0.6,
        y: f.pos.y + f.size * 0.4 + age * (1.2 + rnd(s + 3) * 1.5),
        z: f.pos.z + (rnd(s + 4) - 0.5) * f.size + WIND.z * age * 1.4 + noise(t * 1.1 + s, s + 9) * 0.6,
      };
      out.push({
        kind: 'sprite', key: `emb_${f.id}_${i}`, pos: p,
        draw: (c) => {
          const r = clamp(0.035 * c.k, 0.8, 3.2);
          const a = (1 - k) * (0.5 + 0.5 * noise(t * 9 + s, s));
          return <circle cx={c.x} cy={c.y} r={r} fill={k < 0.4 ? '#FFD27A' : '#FF8A3A'} opacity={f1(a)} />;
        },
      });
    }
  });
  return out;
};

/** Low smoke lying in the streets: long flat soft bands at a distance (depth cues, conceal the far end). */
const groundHaze = (t: number, density: number): Item[] => {
  const out: Item[] = [];
  const spots: [number, number, number, number][] = [
    [110, 0, 26, 2.2], [170, -6, 34, 2.8], [240, 4, 40, 3.2], [330, -2, 52, 4], [460, 3, 70, 6], [620, 0, 95, 9],
    [-30, 0, 30, 2.5], [-70, 10, 40, 3.5], [55, -25, 30, 4], [80, 30, 36, 4],
  ];
  spots.forEach(([x, z, w, h], i) => {
    const drift = noise(t * 0.05 + i, i) * 6;
    out.push({
      kind: 'sprite', key: `haze_${i}`, pos: {x: x + drift, y: h * 0.45, z},
      draw: (c) => {
        const W = w * c.k, Hh = h * c.k;
        if (W < 6) return null;
        const col = mix('#8A7D76', c.light.fogColor, 0.45 + c.lit.fog * 0.5);
        const id = `hz_${i}`;
        return (
          <g>
            <defs>
              <radialGradient id={id}>
                <stop offset={0} stopColor={col} stopOpacity={0.55 * density} />
                <stop offset={0.6} stopColor={col} stopOpacity={0.3 * density} />
                <stop offset={1} stopColor={col} stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse cx={c.x} cy={c.y} rx={W} ry={Math.max(4, Hh)} fill={`url(#${id})`} />
          </g>
        );
      },
    });
  });
  return out;
};

// ------------------------------------------------------------------ the failing tower's dust and the stump's smoke
const towerDust = (t: number): Item[] => {
  const T = PLAN.failingTower;
  const st = towerState(t);
  const out: Item[] = [];
  if (st.tc > 0 && !st.collapsed) {
    const hinge = T.height * 0.62 - st.drop;
    // a dust cloud bursting at the collapse front and billowing down the tower's faces
    for (let i = 0; i < 16; i++) {
      const s = 3000 + i;
      const a = (i / 16) * Math.PI * 2;
      const grow = clamp(st.tc / 5);
      const r = 18 + grow * 55;
      const p = {x: T.base.x + Math.cos(a) * (T.width * 0.5 + r * 0.35), y: Math.max(8, hinge - (rnd(s) * 0.9) * grow * 90), z: T.base.z + Math.sin(a) * (T.width * 0.5 + r * 0.35)};
      out.push(puffItem(`tdust${i}`, p, r * (0.6 + rnd(s + 1) * 0.4), {dark: 0.12, alpha: 0.88 * smooth(st.tc / 0.8), seed: s, t}));
    }
  }
  if (st.collapsed || t > M.TITLE_OUT) {
    out.push(...smokeColumn('stumpSmoke', {x: T.base.x, y: T.height * 0.42, z: T.base.z}, {n: 12, life: 30, rise: 6, r0: 18, r1: 80, drift: 3, dark: 0.45, alpha: 0.75, warm: 0.2, seed: 77}, t));
  }
  return out;
};

// ------------------------------------------------------------------ assembly
export type AtmosOpts = {
  fires?: boolean;
  /** smoke density multiplier (0 = none, 1 = default) */
  smoke?: number;
  embers?: boolean;
  haze?: number;
  /** add these columns (shot-specific smoke) */
  columns?: {key: string; base: V3; o: ColumnOpts}[];
  /** skip fires by id */
  skipFires?: string[];
};

export const atmosItems = (view: View, t: number, o: AtmosOpts = {}): Item[] => {
  const items: Item[] = [];
  const smokeK = o.smoke ?? 1;
  const cam = view.pos;
  const skip = new Set(o.skipFires ?? []);
  FIRES.forEach((f) => {
    if (skip.has(f.id)) return;
    if (o.fires !== false) items.push(fireSprite(f, t));
    if (smokeK > 0 && f.smoke) {
      const d = Math.hypot(f.pos.x - cam.x, f.pos.z - cam.z);
      const big = f.size > 8;
      const n = Math.max(3, Math.round((big ? 9 : d < 60 ? 7 : 5) * Math.min(1.5, smokeK)));
      items.push(...smokeColumn(`sm_${f.id}`, {x: f.pos.x, y: f.pos.y + f.size * 0.8, z: f.pos.z}, {
        n, life: big ? 26 : 10 + f.smoke * 3, rise: big ? 7 : 1.6 + f.smoke * 0.8, r0: big ? f.size * 0.6 : 0.6 + f.smoke * 0.5,
        r1: big ? f.size * 4 : 3 + f.smoke * 4.5, drift: big ? 2.6 : 1.1, dark: 0.55 + (f.heat ?? 0) * 0.1, alpha: (big ? 0.78 : 0.62) * Math.min(1, smokeK), warm: 0.45, seed: f.seed,
      }, t));
    }
  });
  if (o.embers !== false) items.push(...embers(view, t));
  if ((o.haze ?? 1) > 0) items.push(...groundHaze(t, o.haze ?? 1));
  items.push(...towerDust(t));
  (o.columns ?? []).forEach((c) => items.push(...smokeColumn(c.key, c.base, c.o, t)));
  return items;
};

export {fireLights, FIRES};
