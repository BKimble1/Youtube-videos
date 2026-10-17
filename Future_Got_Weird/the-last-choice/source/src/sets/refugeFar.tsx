// The waterfront beyond the refuge, the esplanade and the stairs down from the landing.
//   River / FarBank / CantileverBridge / FarDomes / PatrolDrones / ReconstructionSite / WaterfrontFar (composite)
//   Esplanade (x 14500–16000 per KIT.md, street level y = 0)   LandingStairs (from the landing deck down to y = 0)
// Far elements are drawn in their own coordinates; shots place them in far parallax layers.
import React from 'react';
import {C, CITY, REF, SYS} from '../theme';
import {rnd, noise, clamp, lerp} from '../kit/math';
import {fxId, mixHex} from '../fx/common';
import {Glow} from '../fx/light';
import {refLight, RefTime} from './refugeLight';
import {RefugeExterior} from './refuge';

type T = number | RefTime;

export const River: React.FC<{x0: number; x1: number; y: number; depth?: number; t: number; time?: T; seed?: number; ink?: number; lights?: number[]}> = ({x0, x1, y, depth = 900, t, time = 1, seed = 1, ink = 3, lights = []}) => {
  const L = refLight(time);
  const els: React.ReactElement[] = [];
  els.push(<rect key="w" x={x0} y={y} width={x1 - x0} height={depth} fill={L.water} />);
  els.push(<rect key="w2" x={x0} y={y} width={x1 - x0} height={depth * 0.18} fill={mixHex(L.water, L.skyLow, 0.35)} />);
  const n = Math.round((x1 - x0) / 140);
  for (let i = 0; i < n; i++) {
    const row = i % 6, yy = y + depth * (0.06 + row * 0.12) * (1 + row * 0.2);
    const len = (60 + rnd(seed * 3 + i) * 140) * (1 + row * 0.3);
    const xx = x0 + (((rnd(seed * 5 + i) * (x1 - x0) + t * (14 + row * 6)) % (x1 - x0)) + (x1 - x0)) % (x1 - x0);
    els.push(<line key={`h${i}`} x1={xx} y1={yy} x2={xx + len} y2={yy} stroke="#FFFFFF" strokeWidth={ink * (0.8 + row * 0.25)} strokeLinecap="round" opacity={0.18 + 0.12 * Math.sin(t * 1.3 + i)} />);
  }
  // light reflections (night/evening)
  lights.forEach((lx, i) => {
    if (L.farLights < 0.05) return;
    for (let k = 0; k < 5; k++) els.push(<line key={`lr${i}_${k}`} x1={lx - 14 + noise(t * 2 + k + i, seed) * 10} y1={y + 18 + k * 30} x2={lx + 14 + noise(t * 2 + k + i, seed) * 10} y2={y + 18 + k * 30} stroke="#FFD58A" strokeWidth={ink * 1.5} strokeLinecap="round" opacity={L.farLights * 0.5 * (1 - k / 5)} />);
  });
  return <g>{els}</g>;
};

/** Far shore skyline, atmospheric; some buildings lit, a few ruined (jagged tops). y = waterline. */
export const FarBank: React.FC<{x0: number; x1: number; y: number; t: number; time?: T; seed?: number; ink?: number; ruined?: number; height?: number}> = ({x0, x1, y, t, time = 1, seed = 1, ink = 2.5, ruined = 0.25, height = 520}) => {
  const L = refLight(time);
  const base = mixHex('#7D8FA0', L.skyLow, 0.45), dark = mixHex('#5E6E80', L.skyLow, 0.3);
  const els: React.ReactElement[] = [];
  let xx = x0;
  let i = 0;
  while (xx < x1) {
    const w = 120 + rnd(seed * 3 + i) * 240;
    const h = height * (0.35 + 0.65 * rnd(seed * 5 + i));
    const ruin = rnd(seed * 7 + i) < ruined;
    const col = i % 2 ? base : dark;
    if (ruin) {
      const pts: string[] = [`${xx},${y}`, `${xx},${y - h * 0.7}`];
      for (let k = 1; k < 6; k++) pts.push(`${xx + (w * k) / 6},${y - h * (0.5 + 0.4 * rnd(seed * 11 + i * 7 + k))}`);
      pts.push(`${xx + w},${y - h * 0.6}`, `${xx + w},${y}`);
      els.push(<polygon key={i} points={pts.join(' ')} fill={col} stroke={dark} strokeWidth={ink * 0.6} />);
    } else {
      els.push(<rect key={i} x={xx} y={y - h} width={w} height={h} fill={col} />);
      if (rnd(seed * 13 + i) < 0.3) els.push(<g key={`wt${i}`}><rect x={xx + w * 0.3} y={y - h - 50} width={40} height={36} fill={dark} /><path d={`M ${xx + w * 0.3 - 4} ${y - h - 50} L ${xx + w * 0.3 + 20} ${y - h - 72} L ${xx + w * 0.3 + 44} ${y - h - 50} Z`} fill={dark} /><line x1={xx + w * 0.3 + 6} y1={y - h - 14} x2={xx + w * 0.3 + 6} y2={y - h} stroke={dark} strokeWidth={4} /><line x1={xx + w * 0.3 + 34} y1={y - h - 14} x2={xx + w * 0.3 + 34} y2={y - h} stroke={dark} strokeWidth={4} /></g>);
      if (L.farLights > 0.05) for (let k = 0; k < 6; k++) if (rnd(seed * 17 + i * 13 + k) < 0.45) els.push(<rect key={`lw${i}_${k}`} x={xx + 14 + rnd(seed * 19 + i + k) * (w - 30)} y={y - h * (0.15 + 0.75 * rnd(seed * 23 + i + k * 3))} width={12} height={16} fill="#FFD58A" opacity={L.farLights * (0.6 + 0.4 * noise(t * 0.5 + k + i, seed))} />);
    }
    xx += w + 10 + rnd(seed * 29 + i) * 30;
    i++;
  }
  return <g>{els}</g>;
};

/** A generic steel cantilever bridge silhouette across the river (x = left anchorage, y = waterline). */
export const CantileverBridge: React.FC<{x: number; y: number; w?: number; h?: number; time?: T; ink?: number; seed?: number}> = ({x, y, w = 5200, h = 900, time = 1, ink = 3}) => {
  const L = refLight(time);
  const col = mixHex('#6E7C8A', L.skyLow, 0.45);
  const deckY = y - h * 0.38;
  const towers = [0.18, 0.5, 0.82].map((k) => x + w * k);
  const els: React.ReactElement[] = [];
  els.push(<rect key="deck" x={x} y={deckY} width={w} height={h * 0.05} fill={col} />);
  towers.forEach((tx, i) => {
    els.push(<rect key={`p${i}`} x={tx - 60} y={deckY} width={120} height={y - deckY} fill={col} />);
    els.push(<path key={`t${i}`} d={`M ${tx - 50} ${deckY} L ${tx - 26} ${y - h} L ${tx + 26} ${y - h} L ${tx + 50} ${deckY} Z`} fill={col} />);
    els.push(<path key={`sp${i}`} d={`M ${tx - 26} ${y - h + 40} L ${tx - 26} ${y - h - 40} M ${tx + 26} ${y - h + 40} L ${tx + 26} ${y - h - 40}`} stroke={col} strokeWidth={14} />);
  });
  // cantilever trusses: arched top chords between towers with lattice
  for (let i = 0; i < towers.length - 1; i++) {
    const a = towers[i], b = towers[i + 1], m = (a + b) / 2;
    const top = (u: number) => deckY - h * 0.5 * (1 - Math.pow(Math.abs(u - 0.5) * 2, 1.6)) * 0.9 - h * 0.08;
    const pts: string[] = [];
    for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push(`${lerp(a, b, u).toFixed(1)},${top(u).toFixed(1)}`); }
    els.push(<polyline key={`c${i}`} points={pts.join(' ')} fill="none" stroke={col} strokeWidth={22} />);
    for (let k = 0; k <= 12; k++) { const u = k / 12; const xx = lerp(a, b, u); els.push(<line key={`l${i}_${k}`} x1={xx} y1={deckY} x2={lerp(a, b, Math.min(1, u + 1 / 12))} y2={top(Math.min(1, u + 1 / 12))} stroke={col} strokeWidth={8} />); els.push(<line key={`v${i}_${k}`} x1={xx} y1={deckY} x2={xx} y2={top(u)} stroke={col} strokeWidth={8} />); }
    void m;
  }
  if (L.farLights > 0.05) for (let k = 0; k < 24; k++) els.push(<circle key={`bl${k}`} cx={x + (w * (k + 0.5)) / 24} cy={deckY - 6} r={7} fill="#FFD58A" opacity={L.farLights * 0.8} />);
  void ink;
  return <g>{els}</g>;
};

/** Small far patrol drones moving along a slow loop with a blinking cyan sensor. */
export const PatrolDrones: React.FC<{x0: number; x1: number; y: number; n?: number; t: number; seed?: number; s?: number; ink?: number}> = ({x0, x1, y, n = 3, t, seed = 1, s = 1, ink = 2}) => {
  const els: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) {
    const P = 26 + rnd(seed * 3 + i) * 18;
    const u = ((t / P + rnd(seed * 5 + i)) % 1 + 1) % 1;
    const xx = lerp(x0, x1, 0.5 - 0.5 * Math.cos(u * Math.PI * 2));
    const yy = y + (rnd(seed * 7 + i) - 0.5) * 180 * s + Math.sin(t * 1.3 + i) * 8 * s;
    const blink = (Math.floor(t * 1.5 + i) % 2) === 0;
    els.push(
      <g key={i} transform={`translate(${xx.toFixed(1)} ${yy.toFixed(1)}) scale(${s})`}>
        <ellipse cx={-34} cy={-8} rx={26} ry={5} fill={SYS.dark} opacity={0.5} />
        <ellipse cx={34} cy={-8} rx={26} ry={5} fill={SYS.dark} opacity={0.5} />
        <rect x={-30} y={-10} width={60} height={20} rx={9} fill={SYS.slate} stroke={SYS.dark} strokeWidth={ink} />
        <circle cx={0} cy={8} r={7} fill={blink ? SYS.sensor : SYS.dark} />
      </g>,
    );
  }
  return <g>{els}</g>;
};

/**
 * Automated reconstruction of a ruined building (x = left edge, y = ground). progress 0..1 = how much of the façade
 * has been clad: panels go up one at a time on the crane hook (no instant rebuilding).
 */
export const ReconstructionSite: React.FC<{x: number; y: number; s?: number; progress: number; t: number; time?: T; ink?: number; seed?: number}> = ({x, y, s = 1, progress, t, time = 1, ink = 3, seed = 1}) => {
  const L = refLight(time);
  const W = 900 * s, H = 1300 * s, cols = 5, rows = 7;
  const N = cols * rows;
  const p = clamp(progress) * N;
  const done = Math.floor(p), frac = p - done;
  const pw = W / cols, ph = H / rows;
  const els: React.ReactElement[] = [];
  // ruined frame: concrete columns and slabs with a broken top
  const fr = mixHex('#8E8780', L.skyLow, 0.3);
  for (let c = 0; c <= cols; c++) { const hh = H * (c === 2 || c === 3 ? 0.78 : 1) - (rnd(seed * 3 + c) < 0.4 ? ph * 0.6 : 0); els.push(<rect key={`c${c}`} x={x + c * pw - 12 * s} y={y - hh} width={24 * s} height={hh} fill={fr} stroke={C.ink} strokeWidth={ink * 0.6} />); }
  for (let r = 1; r <= rows; r++) els.push(<rect key={`r${r}`} x={x} y={y - r * ph - 8 * s} width={W * (r > 5 ? 0.6 : 1)} height={16 * s} fill={fr} stroke={C.ink} strokeWidth={ink * 0.6} />);
  // installed panels (bottom-up, left to right): the system's ordered architecture
  for (let k = 0; k < done; k++) {
    const r = Math.floor(k / cols), c = k % cols;
    els.push(<rect key={`p${k}`} x={x + c * pw + 4 * s} y={y - (r + 1) * ph + 4 * s} width={pw - 8 * s} height={ph - 8 * s} fill={SYS.panel} stroke={C.ink} strokeWidth={ink * 0.6} />);
    if (L.farLights > 0.1 && (k * 7) % 3 === 0) els.push(<rect key={`pl${k}`} x={x + c * pw + pw * 0.3} y={y - (r + 1) * ph + ph * 0.3} width={pw * 0.4} height={ph * 0.3} fill="#CFEAF2" opacity={L.farLights * 0.6} />);
  }
  // tower crane carrying the next panel
  const cx = x + W + 220 * s, top = y - H - 400 * s;
  els.push(<rect key="mast" x={cx - 20 * s} y={top} width={40 * s} height={y - top} fill="#E9B23F" stroke={C.ink} strokeWidth={ink * 0.6} />);
  for (let yy = top + 40 * s; yy < y; yy += 60 * s) els.push(<line key={`ml${yy}`} x1={cx - 20 * s} y1={yy} x2={cx + 20 * s} y2={yy + 50 * s} stroke={C.ink} strokeWidth={ink * 0.4} />);
  els.push(<rect key="jib" x={x - 200 * s} y={top - 30 * s} width={cx - x + 420 * s} height={30 * s} fill="#E9B23F" stroke={C.ink} strokeWidth={ink * 0.6} />);
  els.push(<rect key="cab" x={cx - 40 * s} y={top} width={80 * s} height={60 * s} fill={SYS.panel} stroke={C.ink} strokeWidth={ink * 0.6} />);
  if (done < N) {
    const r = Math.floor(done / cols), c = done % cols;
    const tx = x + c * pw + pw / 2, ty = y - (r + 1) * ph + ph / 2;
    const sx = cx + 260 * s, sy = y - ph / 2; // panel stack by the crane foot
    const e = frac < 0.5 ? frac / 0.5 : 1;
    const lift = Math.sin(Math.PI * Math.min(1, frac / 0.5)) * 200 * s;
    const hx = lerp(sx, tx, e), hy = lerp(sy, ty, e) - lift;
    els.push(<line key="cable" x1={hx} y1={top} x2={hx} y2={hy - ph / 2} stroke={C.ink} strokeWidth={ink * 0.6} />);
    els.push(<rect key="trolley" x={hx - 26 * s} y={top - 6 * s} width={52 * s} height={18 * s} fill={SYS.slate} />);
    if (frac < 0.9) els.push(<rect key="moving" x={hx - pw / 2 + 4 * s} y={hy - ph / 2 + 4 * s} width={pw - 8 * s} height={ph - 8 * s} fill={SYS.panel} stroke={C.ink} strokeWidth={ink * 0.6} />);
    for (let k = 0; k < 3; k++) els.push(<rect key={`st${k}`} x={sx - pw / 2} y={y - (k + 1) * 26 * s} width={pw - 8 * s} height={24 * s} fill={SYS.panelShade} stroke={C.ink} strokeWidth={ink * 0.5} />);
  }
  const blink = Math.floor(t * 1.2) % 2 === 0;
  els.push(<circle key="beacon" cx={x - 190 * s} cy={top - 40 * s} r={10 * s} fill={blink ? SYS.sensor : SYS.dark} />);
  return <g>{els}</g>;
};

/** Other refuges along the shore: small sealed domes (far variant), each lit with people inside. */
export const FarDomes: React.FC<{domes: {x: number; y: number; s: number; shutter?: number}[]; t: number; time?: T; ink?: number; seed?: number}> = ({domes, t, time = 1, ink = 2, seed = 1}) => (
  <g>{domes.map((d, i) => <RefugeExterior key={i} x={d.x} y={d.y} scale={d.s} t={t} time={time} far ink={ink} shutter={d.shutter ?? 1} seed={seed * 10 + i} pier={false} glints={0.6} />)}</g>
);

/** Composite: sky (optional), far bank, bridge, river, far domes, reconstruction and patrol drones. y = waterline. */
export const WaterfrontFar: React.FC<{x0: number; x1: number; y: number; t: number; time?: T; seed?: number; ink?: number; progress?: number; sky?: boolean; domes?: {x: number; y: number; s: number; shutter?: number}[]; drones?: number}> = ({x0, x1, y, t, time = 1, seed = 1, ink = 2.5, progress = 0.4, sky = true, domes, drones = 3}) => {
  const L = refLight(time);
  const gid = fxId('wfsky', seed, x0, y);
  const w = x1 - x0;
  const ds = domes ?? [{x: x0 + w * 0.08, y: y - 6, s: 0.16}, {x: x0 + w * 0.62, y: y - 6, s: 0.12}, {x: x0 + w * 0.86, y: y - 6, s: 0.1}];
  return (
    <g>
      <defs><linearGradient id={gid} x1="0" y1={y - 2400} x2="0" y2={y} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={L.skyTop} /><stop offset="100%" stopColor={L.skyLow} /></linearGradient></defs>
      {sky && <rect x={x0} y={y - 2400} width={w} height={2400} fill={`url(#${gid})`} />}
      {L.sun > 0.2 && sky && <Glow x={x0 + w * 0.7} y={y - 1500} r={500} color="#FFF3D6" opacity={0.25 * L.sun} id={fxId('wfsun', seed, x0, y)} />}
      <FarBank x0={x0} x1={x1} y={y - 40} t={t} time={time} seed={seed} ink={ink} />
      <CantileverBridge x={x0 + w * 0.3} y={y} w={w * 0.5} h={700} time={time} ink={ink} />
      <ReconstructionSite x={x0 + w * 0.38} y={y - 40} s={0.38} progress={progress} t={t} time={time} ink={ink} seed={seed + 3} />
      <River x0={x0} x1={x1} y={y} depth={700} t={t} time={time} seed={seed} ink={ink} lights={ds.map((d) => d.x + 1500 * d.s)} />
      <FarDomes domes={ds} t={t} time={time} ink={ink} seed={seed} />
      <PatrolDrones x0={x0 + w * 0.05} x1={x1 - w * 0.05} y={y - 700} n={drones} t={t} seed={seed} s={1.1} />
    </g>
  );
};

// ------------------------------------------------------------------ esplanade and the landing stairs
/** Paved riverside promenade at street level (y = ground), from x0 to x1: lamps, benches, planters, a river railing. */
export const Esplanade: React.FC<{x0: number; x1: number; y?: number; t: number; time?: T; ink?: number; seed?: number}> = ({x0, x1, y = 0, t, time = 1, ink = 4, seed = 1}) => {
  const L = refLight(time);
  const els: React.ReactElement[] = [];
  const pave = mixHex('#C9C0B2', L.tint, L.tintOp), paveD = mixHex('#A89E90', L.tint, L.tintOp);
  // railing along the river behind, then the paving (walking surface at y; the paving band hangs below it)
  for (let xx = x0; xx <= x1; xx += 160) els.push(<rect key={`rp${xx}`} x={xx - 5} y={y - 160} width={10} height={160} fill="#4A4743" />);
  els.push(<rect key="rr" x={x0} y={y - 166} width={x1 - x0} height={12} rx={6} fill="#4A4743" stroke={C.ink} strokeWidth={ink * 0.5} />);
  els.push(<rect key="rr2" x={x0} y={y - 90} width={x1 - x0} height={6} fill="#4A4743" />);
  els.push(<rect key="pv" x={x0} y={y} width={x1 - x0} height={60} fill={pave} />);
  for (let xx = x0; xx < x1; xx += 120) els.push(<line key={`pj${xx}`} x1={xx} y1={y} x2={xx - 30} y2={y + 60} stroke={paveD} strokeWidth={ink * 0.6} />);
  els.push(<line key="edge" x1={x0} y1={y} x2={x1} y2={y} stroke={C.ink} strokeWidth={ink * 0.7} />);
  // lamps and furniture
  for (let xx = x0 + 300, i = 0; xx < x1 - 100; xx += 700, i++) {
    els.push(
      <g key={`lamp${i}`}>
        <rect x={xx - 8} y={y - 570} width={16} height={570} fill="#3E4A52" stroke={C.ink} strokeWidth={ink * 0.6} />
        <path d={`M ${xx - 40} ${y - 550} Q ${xx} ${y - 600} ${xx + 40} ${y - 550} L ${xx + 26} ${y - 530} L ${xx - 26} ${y - 530} Z`} fill="#3E4A52" stroke={C.ink} strokeWidth={ink * 0.6} />
        <Glow x={xx} y={y - 520} r={160} color="#FFD58A" opacity={0.55 * L.lamps} id={fxId('esl', seed + i, xx, y)} />
      </g>,
    );
    if (i % 2 === 0) els.push(<g key={`bn${i}`}><rect x={xx + 160} y={y - 112} width={300} height={18} rx={6} fill={REF.wood} stroke={C.ink} strokeWidth={ink * 0.7} /><rect x={xx + 180} y={y - 94} width={14} height={94} fill={REF.woodDark} /><rect x={xx + 426} y={y - 94} width={14} height={94} fill={REF.woodDark} /></g>);
  }
  void t; void CITY;
  return <g>{els}</g>;
};

/**
 * A steel maintenance stair from the landing (xTop, yTop) down to street level (xBottom, yBottom), with an optional
 * mid landing; stringer, treads, handrail and support legs. Exposes stairPoint() for placing feet on the treads.
 */
export const stairPoint = (xTop: number, yTop: number, xBottom: number, yBottom: number, u: number) => ({x: lerp(xTop, xBottom, u), y: lerp(yTop, yBottom, u)});
export const LandingStairs: React.FC<{xTop: number; yTop: number; xBottom: number; yBottom: number; ink?: number; time?: T; damaged?: number}> = ({xTop, yTop, xBottom, yBottom, ink = 4, time = 1}) => {
  const L = refLight(time);
  const steel = mixHex('#5B6670', '#26334C', 0.4 * L.lamps), steelD = '#39424A';
  const n = Math.max(6, Math.round(Math.abs(yBottom - yTop) / 46));
  const els: React.ReactElement[] = [];
  // support legs
  for (let k = 1; k <= 3; k++) { const p = stairPoint(xTop, yTop, xBottom, yBottom, k / 4); els.push(<rect key={`leg${k}`} x={p.x - 12} y={p.y + 30} width={24} height={yBottom - p.y - 30} fill={steelD} stroke={C.ink} strokeWidth={ink * 0.6} />); }
  // treads
  for (let k = 0; k < n; k++) {
    const p = stairPoint(xTop, yTop, xBottom, yBottom, k / n), q = stairPoint(xTop, yTop, xBottom, yBottom, (k + 1) / n);
    els.push(<path key={`tr${k}`} d={`M ${p.x} ${p.y} L ${q.x} ${p.y} L ${q.x} ${q.y}`} fill="none" stroke={steel} strokeWidth={ink * 2.2} strokeLinejoin="round" />);
  }
  // stringer and handrail
  els.push(<line key="str" x1={xTop} y1={yTop + 26} x2={xBottom} y2={yBottom + 26} stroke={steel} strokeWidth={34} strokeLinecap="round" />);
  els.push(<line key="str2" x1={xTop} y1={yTop + 26} x2={xBottom} y2={yBottom + 26} stroke={C.ink} strokeWidth={ink * 0.6} />);
  els.push(<line key="rail" x1={xTop} y1={yTop - 230} x2={xBottom} y2={yBottom - 230} stroke={steel} strokeWidth={12} strokeLinecap="round" />);
  for (let k = 0; k <= 6; k++) { const p = stairPoint(xTop, yTop, xBottom, yBottom, k / 6); els.push(<line key={`rp${k}`} x1={p.x} y1={p.y} x2={p.x} y2={p.y - 230} stroke={steel} strokeWidth={8} />); }
  return <g>{els}</g>;
};
