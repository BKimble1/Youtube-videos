// The molecular views, drawn as a nested scale of the world they belong to: micro coordinates (a across the channel,
// b up it) are placed at a world point, rotated onto the beam axis and scaled by 1/M, so a camera can zoom from the
// channel close-up into the molecules and back out without a cut. Particles keep their identities: every molecule
// and electron is a fixed index whose position is a function of film time.
//
// Illustrative, not to scale: nitrogen (blue-grey pairs) and oxygen (coral pairs) at about 4:1; each molecule shows
// one loosely bound outer electron as a small dot near it; the laser pulse is a violet band moving up the beam.
import React from 'react';
import {mix} from '../dc/color';
import {clamp, fmt, hash, noise1, V} from '../dc/math';

export const M = 20; // micro units per world px
export const BEAM_R = 58; // half-width of the beam's core in micro units
export const HEAT_R = 250; // half-width of the heated channel

type Mol = {a: number; b: number; o2: boolean; th: number; sp: number; ph: number; i: number};
const field = (seed: number, nx: number, ny: number, step: number): Mol[] => {
  const out: Mol[] = [];
  let i = 0;
  for (let gy = -ny; gy <= ny; gy++)
    for (let gx = -nx; gx <= nx; gx++) {
      const k = i++;
      out.push({a: gx * step + (hash(k, seed) - 0.5) * step * 0.62 + (gy % 2) * step * 0.5, b: gy * step + (hash(k, seed + 1) - 0.5) * step * 0.62, o2: hash(k, seed + 2) < 0.21, th: 360 * hash(k, seed + 3), sp: 0.6 + hash(k, seed + 4), ph: 6.283 * hash(k, seed + 5), i: k});
    }
  return out;
};
export const LASER_MOLS = field(301, 8, 20, 96);
export const RESIST_MOLS = field(401, 8, 12, 96);

export type MicroMode = {
  /** laser scenes: pulse centre positions (b) at this time */
  pulses: number[];
  /** release time of each molecule's electron (Infinity: still bound), indexed like the field */
  release: (m: Mol) => number;
  t: number;
  /** 0..1 heating of the channel (outward push, faster jiggle) */
  heat: number;
  /** b of the advancing discharge front in the channel (null: none), and 0..1 strength */
  front: number | null;
  frontK: number;
  /** vignette: the localized breakdown path through the frame centre (0..1) */
  breakdown: number;
  /** vignette: electrons tugged toward the path then snapping back */
  tug: number;
  /** overall visibility (fades with zoom) */
  alpha: number;
  /** micro camera zoom, for line widths */
  zm: number;
};

/** molecule position at time t (thermal jiggle, the heated channel's outward push) */
export const molPos = (m: Mol, t: number, heat: number): V => {
  const inCh = Math.abs(m.a) < HEAT_R;
  const jig = 7 * (1 + 1.8 * heat * (inCh ? 1 : 0.15));
  let a = m.a + jig * noise1(t * 1.3 * m.sp + m.ph, m.i);
  const b = m.b + jig * noise1(t * 1.1 * m.sp + m.ph * 2, m.i + 7);
  const s = Math.sign(m.a) || 1;
  const u = Math.abs(m.a) / HEAT_R;
  if (u < 1) a += s * heat * 175 * (1 - u * u) * (0.55 + 0.45 * u);
  else a += s * heat * 30 * Math.exp(-(u - 1) * 3);
  return {x: a, y: -b};
};

const Molecule: React.FC<{m: Mol; p: V; t: number; ion: number; heat: number}> = ({m, p, t, ion, heat}) => {
  const th = m.th + 40 * t * m.sp * (1 + 2 * heat * (Math.abs(m.a) < HEAT_R ? 1 : 0)) * (m.i % 2 ? 1 : -1);
  const r = m.o2 ? 16 : 17;
  const d = m.o2 ? 13 : 14;
  const c = Math.cos((th * Math.PI) / 180), s = Math.sin((th * Math.PI) / 180);
  const base = m.o2 ? '#E0806E' : '#86A9C9';
  const col = mix(base, '#F4E6FF', ion * 0.25);
  const atom = (k: number) => {
    const q = {x: p.x + c * d * k, y: p.y + s * d * k};
    return (
      <g key={k}>
        <circle cx={fmt(q.x)} cy={fmt(q.y)} r={r} fill={col} stroke="#0D1A24" strokeWidth={3} />
        <circle cx={fmt(q.x - r * 0.3)} cy={fmt(q.y - r * 0.32)} r={r * 0.34} fill="#FFFFFF" opacity={0.35} />
      </g>
    );
  };
  return (
    <g>
      {ion > 0.01 && <circle cx={fmt(p.x)} cy={fmt(p.y)} r={34} fill="#C9A8FF" opacity={0.22 * ion} />}
      {atom(-1)}
      {atom(1)}
      {ion > 0.01 && (
        <g opacity={ion} stroke="#FFF4C2" strokeWidth={3.2} strokeLinecap="round">
          <line x1={fmt(p.x + 22)} y1={fmt(p.y - 30)} x2={fmt(p.x + 34)} y2={fmt(p.y - 30)} />
          <line x1={fmt(p.x + 28)} y1={fmt(p.y - 36)} x2={fmt(p.x + 28)} y2={fmt(p.y - 24)} />
        </g>
      )}
    </g>
  );
};

/** where a molecule's electron is: bound (a small dot circling close) or, after release at tr, drifting away */
const electronPos = (m: Mol, p: V, t: number, tr: number, tug: number): {q: V; free: number} => {
  const w = 2.2 * m.sp;
  const bound = {x: p.x + 30 * Math.cos(t * w + m.ph), y: p.y + 22 * Math.sin(t * w + m.ph)};
  if (t < tr) {
    // tugged toward the breakdown path (a = 0) then snapping back: bound electrons resist
    const pull = tug * Math.max(0, Math.sin((t - m.ph) * 5.2)) * 26;
    return {q: {x: bound.x - Math.sign(p.x) * pull, y: bound.y}, free: 0};
  }
  const dt = t - tr;
  const dir = 6.283 * hash(m.i, 77);
  const away = 1 - Math.exp(-dt * 3.2);
  const q = {
    x: bound.x + Math.cos(dir) * 120 * away + 26 * noise1(dt * 2 + m.ph, m.i + 3) * away,
    y: bound.y + Math.sin(dir) * 120 * away + 26 * noise1(dt * 2.2 + m.ph, m.i + 5) * away,
  };
  return {q, free: clamp(dt / 0.12)};
};

/** a jagged discharge filament in micro units along b (from b0 to b1) near a = 0 */
const filament = (b0: number, b1: number, seed: number, amp: number) => {
  const pts: V[] = [];
  for (let b = b0; b <= b1; b += 18) pts.push({x: amp * noise1(b / 70, seed) + 0.35 * amp * noise1(b / 19, seed + 1), y: -b});
  return pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
};

export const MicroField: React.FC<{id: string; mols: Mol[]; mode: MicroMode; view: {a0: number; a1: number; b0: number; b1: number}}> = ({id, mols, mode, view}) => {
  const {t, heat, alpha} = mode;
  if (alpha <= 0.01) return null;
  const vis = mols.filter((m) => m.a > view.a0 - 80 && m.a < view.a1 + 80 && m.b > view.b0 - 80 && m.b < view.b1 + 80);
  const lw = 1 / Math.max(0.6, mode.zm);
  return (
    <g opacity={alpha}>
      <defs>
        <linearGradient id={`${id}-hb`} x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform={`translate(${-HEAT_R * 1.3} 0) scale(${HEAT_R * 2.6} 1)`}>
          <stop offset="0" stopColor="#7FE8F0" stopOpacity={0} />
          <stop offset="0.25" stopColor="#7FE8F0" stopOpacity={0.12} />
          <stop offset="0.5" stopColor="#B49BFF" stopOpacity={0.2} />
          <stop offset="0.75" stopColor="#7FE8F0" stopOpacity={0.12} />
          <stop offset="1" stopColor="#7FE8F0" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`${id}-pb`}>
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.35" stopColor="#DCCFFF" stopOpacity={0.6} />
          <stop offset="1" stopColor="#9C84FF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* the heated channel (bounded by ordinary air) */}
      {heat > 0.01 && <rect x={-HEAT_R * 1.3} y={-view.b1 - 400} width={HEAT_R * 2.6} height={view.b1 - view.b0 + 800} fill={`url(#${id}-hb)`} opacity={heat} />}
      {/* the beam's core: a faint violet strip while the laser runs */}
      {mode.pulses.length > 0 && <rect x={-BEAM_R} y={-view.b1 - 400} width={BEAM_R * 2} height={view.b1 - view.b0 + 800} fill="#9C84FF" opacity={0.08} />}
      {/* the vignette's breakdown path: a localized bright column */}
      {mode.breakdown > 0.01 && (
        <g style={{mixBlendMode: 'screen'}} opacity={mode.breakdown}>
          <rect x={-70} y={-view.b1 - 400} width={140} height={view.b1 - view.b0 + 800} fill="#9FB4FF" opacity={0.16} />
          <path d={filament(view.b0 - 200, view.b1 + 200, 5, 26)} fill="none" stroke="#8E9CFF" strokeOpacity={0.35} strokeWidth={46} strokeLinejoin="round" />
          <path d={filament(view.b0 - 200, view.b1 + 200, 5, 26)} fill="none" stroke="#FFFFFF" strokeWidth={10} strokeLinejoin="round" />
        </g>
      )}
      {vis.map((m) => {
        const p = molPos(m, t, heat);
        const tr = mode.release(m);
        const ion = clamp((t - tr) / 0.15);
        return <Molecule key={m.i} m={m} p={p} t={t} ion={ion} heat={heat} />;
      })}
      {/* electrons: bound dots near their molecules, or free and drifting */}
      <g>
        {vis.map((m) => {
          const p = molPos(m, t, heat);
          const tr = mode.release(m);
          const {q, free} = electronPos(m, p, t, tr, mode.tug);
          if (free <= 0) return <circle key={`e${m.i}`} cx={fmt(q.x)} cy={fmt(q.y)} r={5.5} fill="#8FCFE6" opacity={0.85} stroke="#0D1A24" strokeWidth={1.6} />;
          const q0 = electronPos(m, molPos(m, t - 0.1, heat), t - 0.1, tr, mode.tug).q;
          return (
            <g key={`e${m.i}`} opacity={free}>
              <line x1={fmt(q0.x)} y1={fmt(q0.y)} x2={fmt(q.x)} y2={fmt(q.y)} stroke="#9FF6FF" strokeOpacity={0.45} strokeWidth={8} strokeLinecap="round" />
              <circle cx={fmt(q.x)} cy={fmt(q.y)} r={24} fill="#9FF6FF" opacity={0.4} />
              <circle cx={fmt(q.x)} cy={fmt(q.y)} r={10} fill="#F2FEFF" stroke="#0D1A24" strokeWidth={2.4} />
            </g>
          );
        })}
      </g>
      {/* laser pulses: violet bands across the beam, moving up */}
      {mode.pulses.map((pb, k) => (
        <g key={`p${k}`} style={{mixBlendMode: 'screen'}}>
          <ellipse cx={0} cy={-pb} rx={BEAM_R * 2.1} ry={120} fill={`url(#${id}-pb)`} />
          <ellipse cx={0} cy={-pb - 10} rx={BEAM_R * 1.1} ry={34} fill="#FFFFFF" opacity={0.35} />
        </g>
      ))}
      {/* the discharge front in the treated channel, with side branches that stall in ordinary air */}
      {mode.front !== null && mode.frontK > 0.01 && (
        <g style={{mixBlendMode: 'screen'}} opacity={mode.frontK}>
          <path d={filament(view.b0 - 300, mode.front, 9, 34)} fill="none" stroke="#8E9CFF" strokeOpacity={0.4} strokeWidth={40} strokeLinejoin="round" strokeLinecap="round" />
          <path d={filament(view.b0 - 300, mode.front, 9, 34)} fill="none" stroke="#FFFFFF" strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
          {[-500, -260, -30, 210, 450, 700].map((bb, k) => {
            if (mode.front! < bb) return null;
            const age = (mode.front! - bb) / 600;
            const side = k % 2 ? 1 : -1;
            const len = Math.min(1, age * 2.4) * (HEAT_R + 40 + 20 * hash(k, 3));
            const fade = clamp(1.6 - age * 1.4);
            const pts: V[] = [];
            for (let s2 = 0; s2 <= len; s2 += 22) pts.push({x: side * s2, y: -(bb + s2 * 0.45 + 14 * noise1(s2 / 30, k))});
            return <path key={k} d={pts.map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ')} fill="none" stroke="#DCE3FF" strokeOpacity={0.8 * fade} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />;
          })}
        </g>
      )}
      <g opacity={0} strokeWidth={lw} />
    </g>
  );
};
