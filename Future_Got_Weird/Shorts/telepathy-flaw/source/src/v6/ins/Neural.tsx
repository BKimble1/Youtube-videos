// V4 neural environments: layered, dimensional (far soft cells, mid cells, the hero neuron and the electrode, near
// out-of-focus cells that parallax faster), lit from inside in cyan/violet on a deep blue field, in the crew's
// glossy 2.5D finish. No pink tissue diagram: these are different spaces for different jobs:
//  - NeuralCapture: one neuron fires; the pulse runs down its axon to the soma and across to the electrode tip, which
//    captures it (a ring, a spike) and sends it up the shaft;
//  - CortexView: the brain in profile, the motor strip lit, the implant above it;
//  - DecoderView: the chip's interior: spike channels enter the die and leave as one clean message;
//  - SwarmView: the cortex surface seen from above, thousands of dim impulses, the array sweeping across them.
import React from 'react';
import {Cam, Layer} from '../../lib/camera';
import {lit, mix, shade} from '../../lib/color';
import {INK} from '../../lib/ink';
import {clamp, easeInOut, easeOut, fmt, lerp, P, rng, V} from '../../lib/math';
import {Glow} from '../../lib/shade';
import {rr} from '../env/Props';
import {CYAN, RED} from '../art/Implant';

export const NEURAL = {
  bg0: '#0B2A44',
  bg1: '#1A1C4C',
  bg2: '#07131F',
  soma: '#C86FD8',
  somaLit: '#F2A8E8',
  dend: '#A754C8',
  nucleus: '#6E2A92',
  steel: '#C9D3DA',
  gold: '#FFD36B',
};

export const FieldBg: React.FC<{id: string; tint?: number; cx?: number; cy?: number}> = ({id, tint = 0, cx = 540, cy = 900}) => {
  const a = mix(NEURAL.bg0, '#3A0A18', tint);
  const b = mix(NEURAL.bg1, '#2A0714', tint);
  const c = mix(NEURAL.bg2, '#12040A', tint);
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-fb`} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={1300}>
          <stop offset="0" stopColor={a} />
          <stop offset="0.55" stopColor={b} />
          <stop offset="1" stopColor={c} />
        </radialGradient>
      </defs>
      <rect x={-1200} y={-1200} width={4000} height={5000} fill={`url(#${id}-fb)`} />
    </g>
  );
};

export const BlurDefs: React.FC<{id: string}> = ({id}) => (
  <defs>
    <filter id={`${id}-b4`} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={4} />
    </filter>
    <filter id={`${id}-b10`} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={10} />
    </filter>
    <filter id={`${id}-b22`} x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation={22} />
    </filter>
  </defs>
);

// ---------------------------------------------------------------------------------------------------------------
// cells
// ---------------------------------------------------------------------------------------------------------------
type Branch = {d: string; w: number};
const dendrites = (x: number, y: number, r: number, rot: number, n: number, seed: number): Branch[] => {
  const R = rng(seed);
  const out: Branch[] = [];
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * Math.PI * 2 + (R() - 0.5) * 0.5;
    const L = r * (2.0 + R() * 1.6);
    const p0 = {x: x + Math.cos(a) * r * 0.8, y: y + Math.sin(a) * r * 0.8};
    const bend = (R() - 0.5) * 0.9;
    const p2 = {x: x + Math.cos(a + bend) * L, y: y + Math.sin(a + bend) * L};
    const pc = {x: x + Math.cos(a + bend * 0.2) * L * 0.55, y: y + Math.sin(a + bend * 0.2) * L * 0.55};
    out.push({d: `M${P(p0)} Q${P(pc)} ${P(p2)}`, w: r * 0.2});
    for (const s of [-1, 1]) {
      const a2 = a + bend + s * (0.5 + R() * 0.4);
      const l2 = L * (0.35 + R() * 0.25);
      const q0 = {x: lerp(p0.x, p2.x, 0.6), y: lerp(p0.y, p2.y, 0.6)};
      const q1 = {x: q0.x + Math.cos(a2) * l2, y: q0.y + Math.sin(a2) * l2};
      const qc = {x: q0.x + Math.cos(a2 - s * 0.3) * l2 * 0.55, y: q0.y + Math.sin(a2 - s * 0.3) * l2 * 0.55};
      out.push({d: `M${P(q0)} Q${P(qc)} ${P(q1)}`, w: r * 0.11});
    }
  }
  return out;
};

export const Cell: React.FC<{id: string; x: number; y: number; r: number; rot?: number; n?: number; seed: number; color?: string; glow?: number; alpha?: number; dendOnly?: boolean}> = ({id, x, y, r, rot = 0, n = 5, seed, color = NEURAL.dend, glow = 0, alpha = 1, dendOnly}) => {
  const br = dendrites(x, y, r, rot, n, seed);
  const somaC = mix(NEURAL.soma, '#FFFFFF', glow * 0.25);
  return (
    <g opacity={alpha}>
      <defs>
        <radialGradient id={`${id}-sg`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={r * 1.1} fx={x - r * 0.4} fy={y - r * 0.45}>
          <stop offset="0" stopColor={lit(somaC, 0.5)} />
          <stop offset="0.5" stopColor={somaC} />
          <stop offset="1" stopColor={shade(somaC, 0.5)} />
        </radialGradient>
      </defs>
      {br.map((b, i) => (
        <g key={i}>
          <path d={b.d} stroke={shade(color, 0.5)} strokeWidth={b.w + 3} strokeLinecap="round" fill="none" opacity={0.7} />
          <path d={b.d} stroke={mix(color, '#FFFFFF', glow * 0.3)} strokeWidth={b.w} strokeLinecap="round" fill="none" />
          <path d={b.d} stroke="#FFFFFF" strokeWidth={Math.max(1, b.w * 0.25)} strokeLinecap="round" fill="none" opacity={0.28} />
        </g>
      ))}
      {!dendOnly && (
        <g>
          <ellipse cx={fmt(x)} cy={fmt(y)} rx={fmt(r)} ry={fmt(r * 0.9)} fill={`url(#${id}-sg)`} transform={`rotate(${fmt((rot * 180) / Math.PI)} ${fmt(x)} ${fmt(y)})`} />
          <ellipse cx={fmt(x + r * 0.12)} cy={fmt(y + r * 0.1)} rx={fmt(r * 0.36)} ry={fmt(r * 0.32)} fill={NEURAL.nucleus} opacity={0.85} />
          <ellipse cx={fmt(x - r * 0.4)} cy={fmt(y - r * 0.5)} rx={fmt(r * 0.3)} ry={fmt(r * 0.13)} fill="#FFFFFF" opacity={0.45} transform={`rotate(-30 ${fmt(x - r * 0.4)} ${fmt(y - r * 0.5)})`} />
        </g>
      )}
      {glow > 0.02 && <Glow id={`${id}-gl`} c={{x, y}} r={r * 2.4} color={CYAN} alpha={0.6 * glow} />}
    </g>
  );
};

/** points of a smooth path through control points (Catmull-Rom), for pulses that travel along it */
export const sample = (pts: V[], n = 80): V[] => {
  const out: V[] = [];
  const m = pts.length - 1;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * m;
    const k = Math.min(m - 1, Math.floor(u));
    const s = u - k;
    const p0 = pts[Math.max(0, k - 1)];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[Math.min(m, k + 2)];
    const q = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s * s + (-a + 3 * b - 3 * c + d) * s * s * s);
    out.push({x: q(p0.x, p1.x, p2.x, p3.x), y: q(p0.y, p1.y, p2.y, p3.y)});
  }
  return out;
};
const pathD = (pts: V[]) => `M${pts.map(P).join(' L')}`;
const at = (pts: V[], u: number): V => {
  const x = clamp(u) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(x));
  const s = x - i;
  return {x: lerp(pts[i].x, pts[i + 1].x, s), y: lerp(pts[i].y, pts[i + 1].y, s)};
};
const part = (pts: V[], u0: number, u1: number): V[] => {
  const n = 14;
  return Array.from({length: n + 1}, (_, i) => at(pts, lerp(clamp(u0), clamp(u1), i / n)));
};

/** a travelling pulse along a polyline: a bright head and a fading tail */
export const PulseOn: React.FC<{id: string; pts: V[]; u: number; len: number; color: string; w: number; alpha?: number}> = ({id, pts, u, len, color, w, alpha = 1}) => {
  if (u <= 0 || u - len >= 1 || alpha <= 0.01) return null;
  const seg = part(pts, u - len, u);
  const head = at(pts, u);
  return (
    <g opacity={alpha}>
      <path d={pathD(seg)} stroke={color} strokeWidth={w * 2.6} strokeLinecap="round" fill="none" opacity={0.25} />
      <path d={pathD(seg)} stroke={color} strokeWidth={w * 1.4} strokeLinecap="round" fill="none" opacity={0.7} />
      <path d={pathD(part(pts, u - len * 0.35, u))} stroke="#FFFFFF" strokeWidth={w * 0.8} strokeLinecap="round" fill="none" />
      <Glow id={`${id}-pg`} c={head} r={w * 5} color={color} alpha={0.8} />
      <circle cx={fmt(head.x)} cy={fmt(head.y)} r={fmt(w * 0.9)} fill="#FFFFFF" />
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// the electrode
// ---------------------------------------------------------------------------------------------------------------
export const Electrode: React.FC<{id: string; from: V; tip: V; w: number; glow?: number; color?: string}> = ({id, from, tip, w, glow = 0, color = CYAN}) => {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L;
  const ny = dx / L;
  const taper = (k: number) => w * (1 - 0.55 * k);
  const a0 = {x: from.x + nx * w, y: from.y + ny * w};
  const a1 = {x: from.x - nx * w, y: from.y - ny * w};
  const t0 = {x: tip.x - (dx / L) * w * 3 + nx * taper(0.95) * 0.5, y: tip.y - (dy / L) * w * 3 + ny * taper(0.95) * 0.5};
  const t1 = {x: tip.x - (dx / L) * w * 3 - nx * taper(0.95) * 0.5, y: tip.y - (dy / L) * w * 3 - ny * taper(0.95) * 0.5};
  const shaft = `M${P(a0)} L${P(t0)} L${P(tip)} L${P(t1)} L${P(a1)} Z`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-eg`} gradientUnits="userSpaceOnUse" x1={fmt(from.x + nx * w)} y1={fmt(from.y + ny * w)} x2={fmt(from.x - nx * w)} y2={fmt(from.y - ny * w)}>
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.3" stopColor={NEURAL.steel} />
          <stop offset="1" stopColor="#5E6F7E" />
        </linearGradient>
      </defs>
      <path d={shaft} fill={INK} stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={0.7} />
      <path d={shaft} fill={`url(#${id}-eg)`} />
      <path d={`M${P(from)} L${P(tip)}`} stroke="#FFFFFF" strokeWidth={w * 0.18} strokeLinecap="round" opacity={0.6} transform={`translate(${fmt(nx * w * 0.3)} ${fmt(ny * w * 0.3)})`} />
      {/* contact bands near the tip */}
      {[0.55, 0.7, 0.85].map((k, i) => {
        const p = {x: lerp(from.x, tip.x, 0.78 + k * 0.2), y: lerp(from.y, tip.y, 0.78 + k * 0.2)};
        return <circle key={i} cx={fmt(p.x)} cy={fmt(p.y)} r={fmt(w * 0.32)} fill={NEURAL.gold} stroke={INK} strokeWidth={2.4} opacity={0.95} />;
      })}
      <circle cx={fmt(tip.x)} cy={fmt(tip.y)} r={fmt(w * 0.42)} fill={mix(NEURAL.gold, color, glow)} stroke={INK} strokeWidth={3} />
      {glow > 0.02 && <Glow id={`${id}-tg`} c={tip} r={w * 7} color={color} alpha={0.9 * glow} />}
    </g>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// the capture shot
// ---------------------------------------------------------------------------------------------------------------
const AX_PTS: V[] = [
  {x: 700, y: 1060},
  {x: 760, y: 1210},
  {x: 900, y: 1330},
  {x: 920, y: 1500},
  {x: 1060, y: 1620},
  {x: 1300, y: 1650},
  {x: 1500, y: 1580},
];
export const AXON = sample(AX_PTS, 70);
export const CAP_TIP: V = {x: 566, y: 900};
export const CAP_FROM: V = {x: -140, y: 300};

/** local time lt in the shot (0..1.35): the pulse runs the axon (0.1-0.62), crosses the soma (0.62-0.78), the tip
 *  captures it (0.78-1.0), the signal climbs the shaft (0.95-1.35). red 0..1 recolours it as the unwanted burst. */
export const NeuralCapture: React.FC<{lt: number; f: number; red?: number; cam: Cam; id?: string}> = ({lt, f, red = 0, cam, id = 'nc'}) => {
  const col = mix(CYAN, RED, red);
  const pulseU = easeInOut(clamp((lt - 0.08) / 0.56));
  const soma = clamp((lt - 0.6) / 0.12) * (1 - clamp((lt - 0.95) / 0.35));
  const cap = clamp((lt - 0.76) / 0.08);
  const ring = clamp((lt - 0.78) / 0.45);
  const climb = easeOut(clamp((lt - 0.92) / 0.45));
  const dend = sample([{x: 700, y: 1010}, {x: 660, y: 960}, {x: 610, y: 925}, CAP_TIP], 24);
  const pulseDend = clamp((lt - 0.66) / 0.14);
  const bgCells = Array.from({length: 9}, (_, i) => {
    const R = rng(40 + i);
    return {x: -200 + R() * 1900, y: 100 + R() * 1700, r: 40 + R() * 40, rot: R() * 6, seed: 100 + i};
  });
  const midCells = Array.from({length: 6}, (_, i) => {
    const R = rng(70 + i);
    return {x: -100 + R() * 1700, y: 300 + R() * 1400, r: 34 + R() * 26, rot: R() * 6, seed: 200 + i};
  });
  const dust = Array.from({length: 46}, (_, i) => {
    const R = rng(300 + i);
    return {x: R() * 1500 - 100, y: R() * 1900, r: 1.5 + R() * 3, ph: R()};
  });
  return (
    <g>
      <BlurDefs id={id} />
      <FieldBg id={id} tint={red * 0.8} cx={600} cy={980} />
      {/* far: soft cells, slow parallax */}
      <Layer cam={cam} depth={2.4}>
        <g filter={`url(#${id}-b10)`} opacity={0.5}>
          {bgCells.map((c, i) => (
            <Cell key={i} id={`${id}-bg${i}`} x={c.x} y={c.y} r={c.r * 1.5} rot={c.rot} seed={c.seed} n={5} color="#6C4AB0" />
          ))}
        </g>
      </Layer>
      <Layer cam={cam} depth={1.6}>
        <g filter={`url(#${id}-b4)`} opacity={0.75}>
          {midCells.map((c, i) => (
            <Cell key={i} id={`${id}-md${i}`} x={c.x} y={c.y} r={c.r} rot={c.rot} seed={c.seed} n={5} />
          ))}
        </g>
        {dust.map((d, i) => (
          <circle key={i} cx={d.x + Math.sin(f * 0.03 + d.ph * 6) * 10} cy={d.y - ((f * 0.4 + d.ph * 300) % 400)} r={d.r} fill="#9AE6FF" opacity={0.35} />
        ))}
      </Layer>
      {/* the hero: the neuron, its axon, the electrode */}
      <Layer cam={cam} depth={1}>
        {/* axon with myelin beads */}
        <path d={pathD(AXON)} stroke={shade(NEURAL.dend, 0.5)} strokeWidth={17} strokeLinecap="round" fill="none" opacity={0.8} />
        <path d={pathD(AXON)} stroke={NEURAL.dend} strokeWidth={11} strokeLinecap="round" fill="none" />
        <path d={pathD(AXON)} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.25} />
        {[0.12, 0.26, 0.4, 0.56, 0.72, 0.88].map((u, i) => {
          const p = at(AXON, u);
          return <ellipse key={i} cx={fmt(p.x)} cy={fmt(p.y)} rx={26} ry={16} fill={lit(NEURAL.somaLit, 0.1)} stroke={shade(NEURAL.dend, 0.5)} strokeWidth={3} transform={`rotate(${fmt((Math.atan2(at(AXON, u + 0.01).y - p.y, at(AXON, u + 0.01).x - p.x) * 180) / Math.PI)} ${fmt(p.x)} ${fmt(p.y)})`} opacity={0.95} />;
        })}
        <path d={pathD(dend)} stroke={shade(NEURAL.dend, 0.5)} strokeWidth={20} strokeLinecap="round" fill="none" opacity={0.8} />
        <path d={pathD(dend)} stroke={NEURAL.dend} strokeWidth={13} strokeLinecap="round" fill="none" />
        <Cell id={`${id}-hero`} x={700} y={1060} r={96} rot={0.4} n={4} seed={11} glow={soma} />
        {/* the pulse on the axon, then on the dendrite */}
        <PulseOn id={`${id}-p1`} pts={[...AXON].reverse()} u={pulseU} len={0.22} color={col} w={9} alpha={1 - clamp((lt - 0.66) / 0.1)} />
        <PulseOn id={`${id}-p2`} pts={dend} u={pulseDend} len={0.35} color={col} w={9} alpha={pulseDend > 0 ? 1 - clamp((lt - 0.84) / 0.1) : 0} />
        {/* the electrode */}
        <Electrode id={`${id}-el`} from={CAP_FROM} tip={CAP_TIP} w={20} glow={cap} color={col} />
        {/* capture: a ring and a small spike trace at the tip */}
        {ring > 0 && ring < 1 && (
          <g>
            <circle cx={CAP_TIP.x} cy={CAP_TIP.y} r={30 + 150 * ring} fill="none" stroke={col} strokeWidth={9 * (1 - ring) + 1.5} opacity={0.9 * (1 - ring)} />
            <circle cx={CAP_TIP.x} cy={CAP_TIP.y} r={20 + 90 * ring} fill="none" stroke="#FFFFFF" strokeWidth={4 * (1 - ring) + 1} opacity={0.8 * (1 - ring)} />
          </g>
        )}
        {cap > 0 && (
          <path d={`M${CAP_TIP.x - 150},${CAP_TIP.y - 130} l30,0 l14,-52 l22,98 l14,-46 l50,0`} stroke={col} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={clamp(1 - (lt - 0.95) * 1.6)} />
        )}
        {/* the captured signal climbs the shaft */}
        {climb > 0 && (
          <g>
            {[0, 0.16, 0.32].map((d, i) => {
              const u = climb * 1.1 - d;
              if (u < 0 || u > 1) return null;
              const p = {x: lerp(CAP_TIP.x, CAP_FROM.x, u), y: lerp(CAP_TIP.y, CAP_FROM.y, u)};
              return (
                <g key={i}>
                  <circle cx={fmt(p.x)} cy={fmt(p.y)} r={11} fill="#FFFFFF" />
                  <Glow id={`${id}-cl${i}`} c={p} r={46} color={col} alpha={0.9} />
                </g>
              );
            })}
          </g>
        )}
      </Layer>
      {/* near: big out-of-focus cells that cross the frame faster */}
      <Layer cam={cam} depth={0.62}>
        <g filter={`url(#${id}-b22)`} opacity={0.55}>
          <Cell id={`${id}-n1`} x={180} y={1500} r={150} rot={0.2} seed={31} n={4} color="#8A5CD0" />
          <Cell id={`${id}-n2`} x={1000} y={640} r={130} rot={1.1} seed={32} n={4} color="#8A5CD0" />
        </g>
      </Layer>
    </g>
  );
};
