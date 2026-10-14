// FX-SPLASH / FX-SMOKE / FX-FLAME: deterministic molten-metal entry effects in world space (illustrative).
import React from 'react';
import {Proj} from '../engine/camera';
import {V3, add, rnd, clamp01, mix} from '../engine/math';
import {Item, circle3, mixHex} from '../engine/prims';
import {polyClosed, smoothClosed} from '../engine/draw';
import {G} from '../robot/motion';

const coolColor = (age: number) => {
  // white-hot → yellow → orange → dull red as droplets cool
  if (age < 0.15) return mixHex('#FFFBE6', '#FFE27A', age / 0.15);
  if (age < 0.45) return mixHex('#FFE27A', '#FF9A2A', (age - 0.15) / 0.3);
  return mixHex('#FF9A2A', '#A8320E', clamp01((age - 0.45) / 0.6));
};

/**
 * Crown splash at `at` (on the surface), t seconds after entry. `zRef` is the depth used to split the crown into a far
 * half (behind the robot) and a near half (in front of it).
 */
export const splash = (pr: Proj, at: V3, t: number, surfaceY: number, opts: {scale?: number; seed?: number; inside?: (p: V3) => boolean} = {}): Item[] => {
  if (t < 0) return [];
  const S = opts.scale ?? 1;
  const seed = opts.seed ?? 1;
  const items: Item[] = [];
  const zc = pr.p(at).z;
  // crown sheet
  if (t < 1.0) {
    const h = Math.max(0, (560 * t - 0.5 * G * t * t)) * S;
    const rTop = (40 + 210 * t) * S, rBase = (34 + 125 * t) * S;
    const fade = 1 - clamp01((t - 0.62) / 0.38);
    if (h > 2) {
      const camA = Math.atan2(pr.pos[2] - at[2], pr.pos[0] - at[0]);
      for (const half of ['far', 'near'] as const) {
        const a0 = half === 'near' ? camA - Math.PI / 2 : camA + Math.PI / 2;
        const top = circle3([at[0], surfaceY + h, at[2]], rTop, 22, a0, a0 + Math.PI);
        // ragged top edge
        const rag = top.map((q, k): V3 => [q[0], q[1] + Math.sin(k * 2.3 + seed) * 10 * S * (0.4 + t), q[2]]);
        const base = circle3([at[0], surfaceY, at[2]], rBase, 22, a0, a0 + Math.PI).reverse();
        const pts = [...rag, ...base].map((q) => pr.p(q));
        const gid = `crown-${half}-${seed}`;
        const tp = pr.p([at[0], surfaceY + h, at[2]]), bp = pr.p([at[0], surfaceY, at[2]]);
        items.push({
          z: half === 'near' ? zc - rTop * 0.6 : zc + rTop * 0.6,
          key: gid,
          el: (
            <g key={gid} opacity={fade}>
              <defs>
                <linearGradient id={gid + 'g'} gradientUnits="userSpaceOnUse" x1={bp.x} y1={bp.y} x2={tp.x} y2={tp.y}>
                  <stop offset="0" stopColor="#FF7A1A" />
                  <stop offset="0.55" stopColor="#FFC24A" />
                  <stop offset="1" stopColor="#FFF4C4" />
                </linearGradient>
              </defs>
              <path d={smoothClosed(pts)} fill={`url(#${gid}g)`} fillOpacity={half === 'near' ? 0.92 : 0.85} stroke="#C2410C" strokeWidth={Math.max(1, 2 * tp.s)} strokeOpacity={0.6} />
            </g>
          ),
        });
      }
    }
  }
  // first instant: a bright ejecta sheet flashes outward along the surface and hides the entry
  if (t < 0.3) {
    const k = 1 - t / 0.3;
    const ring = circle3([at[0], surfaceY + 2, at[2]], (45 + 260 * t) * S, 36).map((q) => pr.p(q));
    items.push({z: zc - 120, key: `ejecta${seed}`, el: <path key={`ejecta${seed}`} d={smoothClosed(ring)} fill="#FFE9A6" fillOpacity={0.55 * k} stroke="#FFF7D6" strokeWidth={3} strokeOpacity={0.8 * k} />});
  }
  // droplets thrown from the crown rim
  const N = Math.round(64 * Math.min(1.4, S));
  for (let i = 0; i < N; i++) {
    const t0 = 0.03 + rnd(seed * 101 + i) * 0.28;
    const tt = t - t0;
    if (tt <= 0) continue;
    const a = rnd(seed * 37 + i) * Math.PI * 2;
    const rr = (40 + 150 * t0) * S;
    const p0: V3 = [at[0] + Math.cos(a) * rr, surfaceY + Math.max(10, 330 * t0 - 0.5 * G * t0 * t0) * S, at[2] + Math.sin(a) * rr];
    const vr = (90 + 260 * rnd(seed * 53 + i)) * S, vy = (180 + 420 * rnd(seed * 71 + i)) * S;
    const P = (u: number): V3 => [p0[0] + Math.cos(a) * vr * u, p0[1] + vy * u - 0.5 * G * u * u, p0[2] + Math.sin(a) * vr * u];
    const p1 = P(tt);
    if (p1[1] < surfaceY - 5) continue;
    if (opts.inside && opts.inside(p1) && p1[1] < surfaceY + 2) continue;
    const p0b = P(Math.max(0, tt - 0.035));
    const q1 = pr.p(p1), q0 = pr.p(p0b);
    const r = Math.max(1, (2 + 5 * rnd(seed * 91 + i)) * q1.s * S);
    const col = coolColor(tt + t0 * 0.5);
    items.push({
      z: q1.z, key: `dr${seed}_${i}`,
      el: (
        <g key={`dr${seed}_${i}`}>
          <line x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y} stroke={col} strokeWidth={r * 1.6} strokeLinecap="round" />
          <circle cx={q1.x} cy={q1.y} r={r} fill={col} />
        </g>
      ),
    });
  }
  return items;
};

/** Rising smoke/steam puffs (world space). Dark for burning parts, pale for steam. */
export const smoke = (pr: Proj, at: V3, t: number, opts: {n?: number; seed?: number; dark?: number; rise?: number; spread?: number; size?: number; maxT?: number; opacity?: number} = {}): Item[] => {
  if (t < 0) return [];
  const items: Item[] = [];
  const n = opts.n ?? 14;
  const seed = opts.seed ?? 3;
  for (let i = 0; i < n; i++) {
    const t0 = rnd(seed * 17 + i) * 1.2;
    const tt = t - t0;
    if (tt <= 0) continue;
    const life = 2.6 + rnd(seed * 29 + i) * 1.6;
    if (opts.maxT === undefined && tt > life) continue;
    const u = clamp01(tt / life);
    const a = rnd(seed * 41 + i) * Math.PI * 2;
    const spread = (opts.spread ?? 50) * (0.4 + u);
    const p: V3 = [at[0] + Math.cos(a) * spread + 30 * u * Math.sin(i), at[1] + (opts.rise ?? 120) * tt + 20, at[2] + Math.sin(a) * spread];
    const q = pr.p(p);
    if (pr.depth(p) < 160) continue; // never fill the lens with a puff
    const r = (opts.size ?? 38) * (0.5 + 1.6 * u) * q.s;
    const dark = opts.dark ?? 0.7;
    const col = mixHex('#D9D2CC', '#2B2422', dark);
    const op = (opts.opacity ?? 0.55) * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.05)) * (1 - u * 0.4);
    const gid = `smg${seed}_${i}`;
    items.push({
      z: q.z - 30, key: `sm${seed}_${i}`,
      el: (
        <g key={`sm${seed}_${i}`}>
          <defs>
            <radialGradient id={gid}>
              <stop offset="0" stopColor={col} stopOpacity={op} />
              <stop offset="0.55" stopColor={col} stopOpacity={op * 0.7} />
              <stop offset="1" stopColor={col} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={q.x} cy={q.y} r={r} fill={`url(#${gid})`} />
        </g>
      ),
    });
  }
  return items;
};

/** Short flame licks at a point on the surface (burning plastics/insulation; illustrative). */
export const flames = (pr: Proj, at: V3, t: number, opts: {n?: number; seed?: number; height?: number; width?: number; strength?: number} = {}): Item[] => {
  if (t < 0) return [];
  const items: Item[] = [];
  const n = opts.n ?? 7;
  const seed = opts.seed ?? 9;
  const k = clamp01(opts.strength ?? 1);
  if ((opts.height ?? 45) <= 0.5) return items;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(seed + i);
    const r = (opts.width ?? 30) * (0.6 + 0.4 * rnd(seed * 3 + i));
    const base: V3 = [at[0] + Math.cos(a) * r, at[1], at[2] + Math.sin(a) * r];
    const flick = 0.6 + 0.4 * Math.sin(t * 13 + i * 2.1) * Math.sin(t * 7.3 + i);
    const h = (opts.height ?? 45) * flick * k;
    const q0 = pr.p(base), q1 = pr.p(add(base, [Math.sin(t * 5 + i) * 6, h, 0]));
    const w = Math.max(2, 9 * q0.s * k);
    const d = `M${q0.x - w} ${q0.y} Q${(q0.x + q1.x) / 2 - w * 0.8} ${(q0.y + q1.y) / 2} ${q1.x} ${q1.y} Q${(q0.x + q1.x) / 2 + w * 0.8} ${(q0.y + q1.y) / 2} ${q0.x + w} ${q0.y}Z`;
    const fg = `flg${seed}_${i}`;
    items.push({
      z: q0.z - 1, key: `fl${seed}_${i}`,
      el: (
        <g key={`fl${seed}_${i}`}>
          <defs>
            <linearGradient id={fg} gradientUnits="userSpaceOnUse" x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y}>
              <stop offset="0" stopColor="#FFD35A" stopOpacity={0.95 * k} />
              <stop offset="0.55" stopColor="#FF7A1A" stopOpacity={0.75 * k} />
              <stop offset="1" stopColor="#E0480E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={d} fill={`url(#${fg})`} />
        </g>
      ),
    });
  }
  return items;
};

/** Screen flash at impact. */
export const Flash: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  if (t < 0 || t > 0.3) return null;
  const a = (1 - t / 0.3) * 0.65;
  return (
    <g style={{mixBlendMode: 'screen'}}>
      <defs>
        <radialGradient id="flash" cx={x} cy={y} r={700} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF4C8" stopOpacity={a} />
          <stop offset="1" stopColor="#FF8A2A" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#flash)" />
    </g>
  );
};

export {mix, polyClosed};
