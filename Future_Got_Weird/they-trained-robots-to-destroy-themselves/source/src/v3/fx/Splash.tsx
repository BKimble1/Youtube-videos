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
 * Directional entry splash at `at` (on the surface), t seconds after entry (V3).
 *   - a cavity flash on the surface for the first instant
 *   - an asymmetric crown sheet: taller and leaning out on the side the body was travelling toward (`dir`, xz),
 *     split into far / near halves so the body and the vessel rim occlude it correctly; fingers along its lip
 *   - droplets biased toward `dir`, falling back under gravity and cooling from white-hot to dull red
 * Collapses by ~0.8 s; droplets settle by ~1.4 s. Illustrative staging, not a fluid simulation.
 */
export const splash = (pr: Proj, at: V3, t: number, surfaceY: number, opts: {scale?: number; seed?: number; inside?: (p: V3) => boolean; dir?: V3} = {}): Item[] => {
  if (t < 0) return [];
  const S = opts.scale ?? 1;
  const seed = opts.seed ?? 1;
  const dir = opts.dir ?? [1, 0, 0];
  const dA = Math.atan2(dir[2], dir[0]);
  const items: Item[] = [];
  const zc = pr.p(at).z;
  // cavity flash: a bright ring opening on the surface (hides the instant of contact)
  if (t < 0.32) {
    const k = 1 - t / 0.32;
    const ring = circle3([at[0], surfaceY + 1.5, at[2]], (40 + 230 * t) * S, 36).map((q) => pr.p(q));
    const inner = circle3([at[0] + dir[0] * 10 * t, surfaceY + 1.6, at[2] + dir[2] * 10 * t], (26 + 120 * t) * S, 28).map((q) => pr.p(q));
    items.push({z: zc - 120, key: `cav${seed}`, el: (
      <g key={`cav${seed}`}>
        <path d={smoothClosed(ring)} fill="#FFE9A6" fillOpacity={0.5 * k} stroke="#FFF7D6" strokeWidth={3} strokeOpacity={0.8 * k} />
        <path d={smoothClosed(inner)} fill="#B8370C" fillOpacity={0.55 * k} />
      </g>
    )});
  }
  // crown: a flaring ring wall. Far half shows its darker inner face, near half its brighter outer face; a continuous
  // lip, flow streaks and beads at the finger tips make it read as a ring rather than a flat sheet.
  if (t < 0.85) {
    const rise = Math.max(0, 600 * t - 0.5 * G * 1.25 * t * t) * S;
    const fade = 1 - clamp01((t - 0.55) / 0.3);
    if (rise > 2) {
      const camA = Math.atan2(pr.pos[2] - at[2], pr.pos[0] - at[0]);
      const n = 18;
      const fingerK = 1 - clamp01((t - 0.32) / 0.4);
      const ringPt = (a: number, top: boolean): V3 => {
        const fw = Math.cos(a - dA);                                  // +1 on the side the body was travelling toward
        if (!top) {
          const rb = (34 + 70 * (1 - Math.exp(-t * 5))) * S;     // saturates: the crown stays inside the vessel
          return [at[0] + Math.cos(a) * rb, surfaceY, at[2] + Math.sin(a) * rb];
        }
        const rt = (46 + 90 * (1 - Math.exp(-t * 6))) * S * (1 + 0.1 * Math.max(0, fw));
        const k = Math.round(((a - camA) / Math.PI) * n * 2);
        const finger = (Math.abs(k) % 2 === 0 ? 1 : 0.5) * fingerK;
        const h = rise * (0.9 + 0.16 * Math.max(0, fw)) + 16 * S * finger * (0.5 + rnd(seed * 13 + ((k % 97) + 97)));
        return [at[0] + Math.cos(a) * rt, surfaceY + h, at[2] + Math.sin(a) * rt];
      };
      const tp = pr.p([at[0], surfaceY + rise, at[2]]), bp = pr.p([at[0], surfaceY, at[2]]);
      for (const half of ['far', 'near'] as const) {
        const a0 = half === 'near' ? camA - Math.PI / 2 : camA + Math.PI / 2;
        const angs: number[] = [];
        for (let k = 0; k <= n; k++) angs.push(a0 + (Math.PI * k) / n);
        const top = angs.map((a) => pr.p(ringPt(a, true)));
        const base = angs.map((a) => pr.p(ringPt(a, false)));
        const pts = [...top, ...[...base].reverse()];
        const gid = `crown-${half}-${seed}`;
        const near = half === 'near';
        const sw = Math.max(1, 2.2 * tp.s);
        const streaks = angs.filter((_, k) => k % 3 === 1).map((a, k) => {
          const q0 = pr.p(ringPt(a, false)), q1 = pr.p(ringPt(a, true));
          const m = {x: q0.x + (q1.x - q0.x) * 0.92, y: q0.y + (q1.y - q0.y) * 0.92};
          return <line key={k} x1={q0.x} y1={q0.y} x2={m.x} y2={m.y} stroke={near ? '#FFF1B8' : '#FFB04A'} strokeWidth={sw * 0.8} strokeOpacity={near ? 0.45 : 0.35} strokeLinecap="round" />;
        });
        const beads = t > 0.12 && fingerK > 0.05 ? angs.filter((_, k) => k % 2 === 0).map((a, k) => {
          const q = pr.p(add(ringPt(a, true), [0, 7 * S * fingerK, 0]));
          return <circle key={k} cx={q.x} cy={q.y} r={Math.min(9, Math.max(1.2, 3.6 * S * q.s))} fill="#FFF4CC" fillOpacity={0.9} />;
        }) : null;
        items.push({
          z: near ? zc - 80 * S : zc + 80 * S,
          key: gid,
          el: (
            <g key={gid} opacity={fade}>
              <defs>
                <linearGradient id={gid + 'g'} gradientUnits="userSpaceOnUse" x1={bp.x} y1={bp.y} x2={tp.x} y2={tp.y}>
                  <stop offset="0" stopColor={near ? '#F06A12' : '#B8380C'} />
                  <stop offset="0.55" stopColor={near ? '#FFB43A' : '#F07A1E'} />
                  <stop offset="1" stopColor={near ? '#FFF0B4' : '#FFD27A'} />
                </linearGradient>
              </defs>
              <path d={polyClosed(pts)} fill={`url(#${gid}g)`} fillOpacity={near ? 0.82 : 0.95} stroke="#8A2A08" strokeWidth={sw * 0.7} strokeOpacity={0.5} strokeLinejoin="round" />
              {streaks}
              <path d={'M' + top.map((q) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join('L')} fill="none" stroke="#FFF8DA" strokeWidth={sw * (near ? 1.8 : 1.3)} strokeOpacity={near ? 0.9 : 0.75} strokeLinecap="round" strokeLinejoin="round" />
              {beads}
            </g>
          ),
        });
      }
      // a bright disturbance ring on the surface around the crown's foot (grounds the wall on the steel)
      const skirt = circle3([at[0], surfaceY + 0.8, at[2]], (40 + 85 * (1 - Math.exp(-t * 5))) * S, 40).map((q) => pr.p(q));
      items.push({z: zc + 80 * S + 1, key: `skirt${seed}`, el: <path key={`skirt${seed}`} d={smoothClosed(skirt)} fill="none" stroke="#FFD98A" strokeWidth={Math.max(1, 5 * tp.s)} strokeOpacity={0.6 * fade} />});
    }
  }
  // droplets: thrown mostly forward, arcing up and falling back; short tapered streaks that cool and fade
  const N = Math.round(80 * Math.min(1.4, S));
  for (let i = 0; i < N; i++) {
    const t0 = 0.02 + rnd(seed * 101 + i) * 0.3;
    const tt = t - t0;
    if (tt <= 0) continue;
    const bias = rnd(seed * 37 + i) < 0.55;
    const a = bias ? dA + (rnd(seed * 41 + i) - 0.5) * 2.0 : rnd(seed * 43 + i) * Math.PI * 2;
    const rr = (40 + 160 * t0) * S;
    const p0: V3 = [at[0] + Math.cos(a) * rr, surfaceY + Math.max(10, 360 * t0 - 0.5 * G * t0 * t0) * S, at[2] + Math.sin(a) * rr];
    const vr = (110 + (bias ? 330 : 200) * rnd(seed * 53 + i)) * S, vy = (200 + 440 * rnd(seed * 71 + i)) * S;
    const P = (u: number): V3 => [p0[0] + Math.cos(a) * vr * u, p0[1] + vy * u - 0.5 * G * u * u, p0[2] + Math.sin(a) * vr * u];
    const p1 = P(tt);
    if (p1[1] < surfaceY - 5) continue;
    if (opts.inside && opts.inside(p1) && p1[1] < surfaceY + 2) continue;
    if (pr.depth(p1) < 60) continue;                                   // never a droplet on the lens
    const age = tt + t0 * 0.5;
    const op = 1 - clamp01((age - 0.55) / 0.5);
    if (op <= 0.02) continue;
    const p0b = P(Math.max(0, tt - 0.035));
    const q1 = pr.p(p1), q0 = pr.p(p0b);
    const r = Math.min(7, Math.max(1, (1.6 + 4.5 * rnd(seed * 91 + i)) * q1.s * S));
    const col = coolColor(age);
    const dx = q1.x - q0.x, dy = q1.y - q0.y, dl = Math.hypot(dx, dy) || 1;
    const nx = -dy / dl, ny = dx / dl;
    // tapered streak: wide at the head, a point at the tail
    const d = `M${(q1.x + nx * r).toFixed(1)} ${(q1.y + ny * r).toFixed(1)} L${q0.x.toFixed(1)} ${q0.y.toFixed(1)} L${(q1.x - nx * r).toFixed(1)} ${(q1.y - ny * r).toFixed(1)} Z`;
    items.push({
      z: q1.z, key: `dr${seed}_${i}`,
      el: (
        <g key={`dr${seed}_${i}`} opacity={op}>
          <path d={d} fill={col} fillOpacity={0.7} />
          <circle cx={q1.x} cy={q1.y} r={r} fill={col} />
          {age < 0.3 ? <circle cx={q1.x} cy={q1.y} r={r * 0.5} fill="#FFFDF0" /> : null}
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

/** Short flame licks at a point on the surface (burning plastics/insulation; illustrative): narrow S-curved tongues. */
export const flames = (pr: Proj, at: V3, t: number, opts: {n?: number; seed?: number; height?: number; width?: number; strength?: number} = {}): Item[] => {
  if (t < 0) return [];
  const items: Item[] = [];
  const n = opts.n ?? 6;
  const seed = opts.seed ?? 9;
  const k = clamp01(opts.strength ?? 1);
  if ((opts.height ?? 45) <= 0.5 || k <= 0.01) return items;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(seed + i);
    const r = (opts.width ?? 30) * (0.6 + 0.4 * rnd(seed * 3 + i));
    const base: V3 = [at[0] + Math.cos(a) * r, at[1], at[2] + Math.sin(a) * r];
    const flick = 0.55 + 0.45 * Math.sin(t * 11 + i * 2.1) * Math.sin(t * 6.3 + i);
    const h = (opts.height ?? 45) * flick * k * (0.6 + 0.5 * rnd(seed * 5 + i));
    if (h < 3) continue;
    const sway = Math.sin(t * 4.5 + i * 1.7) * h * 0.18;
    const q0 = pr.p(base), qm = pr.p(add(base, [sway * 0.4, h * 0.5, 0])), q1 = pr.p(add(base, [sway, h, 0]));
    if (pr.depth(base) < 80) continue;
    const w = Math.min(14, Math.max(1.5, 5 * q0.s * k));
    const d = `M${q0.x - w} ${q0.y} C${q0.x - w} ${q0.y - (q0.y - qm.y) * 0.6} ${qm.x - w * 0.7} ${qm.y} ${qm.x - w * 0.25} ${(qm.y + q1.y) / 2} `
      + `Q${q1.x - w * 0.1} ${q1.y + (qm.y - q1.y) * 0.2} ${q1.x} ${q1.y} Q${qm.x + w * 0.5} ${(qm.y + q1.y) / 2} ${qm.x + w * 0.6} ${qm.y} C${qm.x + w} ${qm.y + (q0.y - qm.y) * 0.4} ${q0.x + w} ${q0.y - (q0.y - qm.y) * 0.3} ${q0.x + w} ${q0.y}Z`;
    const fg = `flg${seed}_${i}`;
    items.push({
      z: q0.z - 1, key: `fl${seed}_${i}`,
      el: (
        <g key={`fl${seed}_${i}`}>
          <defs>
            <linearGradient id={fg} gradientUnits="userSpaceOnUse" x1={q0.x} y1={q0.y} x2={q1.x} y2={q1.y}>
              <stop offset="0" stopColor="#FFE9A0" stopOpacity={0.9 * k} />
              <stop offset="0.45" stopColor="#FF9A2A" stopOpacity={0.75 * k} />
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
