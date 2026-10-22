// Molecular scale: the DNA double helix along the x axis (DNA units; radius 100, one turn = 360, a base pair every
// ~34). The two backbones are drawn back-to-front with depth shading so the helix reads as a twisted 3D ribbon. Three
// regulatory proteins sit on their genes: the growth accelerator, the brake, and the death switch.
import React from 'react';
import {Cam, W, H, camTransform} from '../../kit/cam';
import {P as Pt, closedPath, openPath, blobPts, rand, noise, mixHex, clamp01, smooth} from '../../kit/core';
import {P} from '../palette';

export const HA = 100, HL = 360, BP = HL / 10.5;
export const GENE = {grow: 900, stop: 1800, die: 2700};
const ph = (x: number) => (2 * Math.PI * x) / HL;
export const strandY = (x: number, s: 0 | 1, kink = 0, kx = 0) => HA * Math.sin(ph(x) + (s ? Math.PI * 0.78 : 0)) + kink * 60 * Math.exp(-(((x - kx) / 120) ** 2));
const strandZ = (x: number, s: 0 | 1) => Math.cos(ph(x) + (s ? Math.PI * 0.78 : 0));

/** Which base pairs are mutated (by index) and how far along each is (0..1). */
export type MutFn = (i: number) => number;

export const Helix2: React.FC<{x0: number; x1: number; t: number; mut?: MutFn; kink?: number; kinkX?: number; lod: number; glow?: number}> = ({x0, x1, t, mut, kink = 0, kinkX = 0, lod, glow = 0}) => {
  const step = 9;
  const back: React.ReactNode[] = [], front: React.ReactNode[] = [], rungs: React.ReactNode[] = [];
  const xs = Math.floor(x0 / step) * step;
  for (let s = 0 as 0 | 1; s <= 1; s = (s + 1) as 0 | 1) {
    for (let x = xs; x < x1; x += step) {
      const zA = strandZ(x + step / 2, s);
      const col = mixHex(s ? '#E9809E' : '#F6C77A', '#1A0820', 0.6 * (1 - (zA + 1) / 2));
      const el = <line key={`${s}-${x}`} x1={x} y1={strandY(x, s, kink, kinkX)} x2={x + step + 0.5} y2={strandY(x + step, s, kink, kinkX)} stroke={col} strokeWidth={24 + 8 * zA} strokeLinecap="round" />;
      (zA >= 0 ? front : back).push(el);
      if (zA > 0.35) front.push(<line key={`h${s}-${x}`} x1={x} y1={strandY(x, s, kink, kinkX) - 7} x2={x + step + 0.5} y2={strandY(x + step, s, kink, kinkX) - 7} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.35 * (zA - 0.35)} />);
    }
    if (s === 1) break;
  }
  const i0 = Math.floor(x0 / BP), i1 = Math.ceil(x1 / BP);
  for (let i = i0; i <= i1; i++) {
    const x = i * BP;
    const ya = strandY(x, 0, kink, kinkX), yb = strandY(x, 1, kink, kinkX);
    const at = rand(i * 7 + 3) < 0.5;
    const m = mut ? mut(i) : 0;
    const zm = (strandZ(x, 0) + strandZ(x, 1)) / 2;
    const c0 = at ? '#FFB38A' : '#FFE6C7', c1 = at ? '#FFE6C7' : '#F59A86';
    const ca = mixHex(c0, P.mutation, m), cb = mixHex(c1, '#FF7AC8', m);
    const mid = (ya + yb) / 2 + (m > 0 ? 8 * m * Math.sin(t * 6 + i) : 0);
    const dk = 0.35 * (1 - (zm + 1) / 2);
    rungs.push(
      <g key={i} opacity={1 - dk}>
        <line x1={x} y1={ya} x2={x} y2={mid - 3 * m} stroke={ca} strokeWidth={11} strokeLinecap="round" />
        <line x1={x} y1={mid + 3 * m} x2={x} y2={yb} stroke={cb} strokeWidth={11} strokeLinecap="round" />
        {m > 0.2 && <circle cx={x} cy={mid} r={60} fill="url(#glowMut)" opacity={m * 0.9} />}
      </g>,
    );
  }
  return (
    <g>
      {glow > 0 && <rect x={x0} y={-HA * 2.2} width={x1 - x0} height={HA * 4.4} fill="url(#glowMut)" opacity={glow * 0.3} />}
      {back}
      {rungs}
      {front}
      {lod > 0.6 && front.length > 0 && null}
    </g>
  );
};

/** A regulatory protein bound on the helix, drawn as a globular cluster of shaded subunits that clamps around the
 *  double helix (back subunits are drawn by RegProteinBack before the helix, front ones after). act = working (soft
 *  glow), stuck = jammed on, off = released (drifts away), warp = misfolding (subunits loosen). */
const SUBS = (kind: string) => {
  const sd = kind === 'grow' ? 3 : kind === 'stop' ? 7 : 11;
  return Array.from({length: 15}, (_, k) => {
    const a = -Math.PI * 0.9 + (k / 14) * Math.PI * 1.8 + (rand(sd * 31 + k) - 0.5) * 0.3; // C-shape around the helix
    const rr = 150 + 40 * rand(sd * 17 + k);
    return {x: Math.sin(a) * rr * 0.55 + (rand(sd * 7 + k) - 0.5) * 50, y: -Math.cos(a) * rr, r: 46 + 26 * rand(sd * 13 + k), back: k % 3 === 1};
  });
};
const protCol = (kind: string) => (kind === 'grow' ? P.grow : kind === 'stop' ? P.brake : P.death);
type RP = {x: number; t: number; kind: 'grow' | 'stop' | 'die'; act?: number; off?: number; warp?: number; stuck?: number; op?: number};
const protXf = ({x, t, off = 0, warp = 0, act = 0}: RP) => {
  const dx = off * 300, dy = -off * 520 - off * off * 160;
  const rot = off * 40;
  const w = 1 + 0.035 * act * Math.sin(t * 8);
  return `translate(${x + dx} ${dy}) rotate(${rot}) scale(${w})`;
};
const subXY = (s: {x: number; y: number}, k: number, t: number, warp: number) => [s.x + warp * 40 * noise(t * 2 + k, 3), s.y + warp * 50 * noise(t * 2 + k, 9)];
export const RegProteinBack: React.FC<RP> = (p) => {
  const c = mixHex(protCol(p.kind), '#1A1028', 0.45);
  return (
    <g opacity={p.op ?? 1} transform={protXf(p)}>
      {SUBS(p.kind).filter((s) => s.back).map((s, k) => {
        const [x, y] = subXY(s, k, p.t, p.warp ?? 0);
        return <g key={k}><circle cx={x} cy={y} r={s.r} fill={c} /><circle cx={x} cy={y} r={s.r} fill="url(#vol)" /></g>;
      })}
    </g>
  );
};
export const RegProtein: React.FC<RP> = (p) => {
  const {kind, act = 0, stuck = 0} = p;
  const c = protCol(kind);
  const deep = mixHex(c, '#101018', 0.5);
  const glowId = kind === 'grow' ? 'glowGreen' : kind === 'stop' ? 'glowAi' : 'glowMut';
  return (
    <g opacity={p.op ?? 1} transform={protXf(p)}>
      {(act > 0.01 || stuck > 0.01) && <circle r={330} fill={`url(#${glowId})`} opacity={0.4 * Math.max(act, stuck)} />}
      {SUBS(kind).filter((s) => !s.back).map((s, k) => {
        const [x, y] = subXY(s, k + 20, p.t, p.warp ?? 0);
        return (
          <g key={k}>
            <circle cx={x} cy={y} r={s.r + 3} fill={deep} />
            <circle cx={x} cy={y} r={s.r} fill={mixHex(c, '#FFFFFF', 0.1 * act)} />
            <circle cx={x} cy={y} r={s.r} fill="url(#vol)" />
          </g>
        );
      })}
    </g>
  );
};

/** Growth-signal particles streaming up from the accelerator. */
export const GrowSignal: React.FC<{x: number; t: number; rate: number; t0: number}> = ({x, t, rate, t0}) => {
  if (rate <= 0) return null;
  const n = 14;
  return (
    <g>
      {Array.from({length: n}, (_, k) => {
        const life = 1.6 / rate;
        const age = (t - t0) / life + k / n;
        if (age < 1) return null;
        const u = age % 1;
        const a = -Math.PI / 2 + (rand(k * 3) - 0.5) * 1.1;
        const d = 240 + u * 1000;
        return <circle key={k} cx={x + Math.cos(a) * d} cy={Math.sin(a) * d} r={14 * (1 - u * 0.5)} fill={P.grow} opacity={(1 - u) * 0.9} />;
      })}
    </g>
  );
};

/** Nucleoplasm backdrop: deep violet with out-of-focus chromatin loops and nucleosome beads at depth. */
export const NucleoplasmBack: React.FC<{cam: Cam; t: number; mut?: number}> = ({cam, t, mut = 0}) => {
  const depth = 0.45;
  const z = cam.z * depth;
  const hw = W / 2 / z + 1500, x0 = cam.x - hw, x1 = cam.x + hw;
  const loops: React.ReactNode[] = [];
  const S = 1400;
  for (let i = Math.floor(x0 / S); i <= Math.ceil(x1 / S); i++) {
    for (let j = -2; j <= 2; j++) {
      const sd = ((i % 9) + 9) % 9 * 7 + j * 31 + 50;
      const pts: Pt[] = Array.from({length: 9}, (_, m) => [i * S + m * 200 - 400, j * 900 + 140 * noise(m * 0.5 + t * 0.05, sd)] as Pt);
      loops.push(<path key={`${i},${j}`} d={openPath(pts, 1)} fill="none" stroke={mixHex('#5A2A6E', P.mutant, mut * 0.3)} strokeWidth={70} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} />);
      pts.forEach((p, m) => m % 2 === 0 && loops.push(<circle key={`${i},${j},${m}`} cx={p[0]} cy={p[1]} r={70} fill="#6E3486" opacity={0.4} />));
    }
  }
  return (
    <g>
      <rect width={W} height={H} fill="#1C0A26" />
      <rect width={W} height={H} fill="url(#glowMut)" opacity={0.08 + 0.12 * mut} />
      <g transform={camTransform(cam, depth)}>{loops}</g>
      {/* the nuclear envelope in the distance keeps the helix inside the nucleus we came through */}
      <g transform={camTransform(cam, 0.3)} opacity={0.55}>
        <circle cx={600} cy={9800} r={11500} fill="none" stroke="#5E2A56" strokeWidth={90} />
        <circle cx={600} cy={9800} r={11330} fill="none" stroke="#4A1E48" strokeWidth={50} />
        {Array.from({length: 40}, (_, k) => {
          const a = -Math.PI / 2 + (k - 20) * 0.022;
          return <circle key={k} cx={600 + Math.cos(a) * 11420} cy={9800 + Math.sin(a) * 11420} r={46} fill="#2A0E30" />;
        })}
      </g>
    </g>
  );
};

export const _d = {clamp01, smooth};
