import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {Building, STYLES} from '../v2/Street2';
import {IconBoat} from '../film/B02';
import {cl, lerp, ramp, sm} from '../film2/ui';
import {PalmWind, Lamp3, DrawSheet} from './Street3';
import {T} from './timeline3';

/**
 * The coast (f238-392). Sea to the WEST (left), the town to the east (right): the water moves screen-right. A calm bay, a big foreground pier with a moored boat, a far skyline; a swell rises on the
 * left horizon and keeps growing (scale), hits the pier posts (f318), climbs over the seawall and the promenade and covers the buildings; the water then washes through the frame as a foam-edged band (the cut).
 * Illustrative, not a forecast: no heights, depths or times are meant.
 */
export const BASE = 1200, WALL_X = 640, PROM_Y = 1140;
const POST_X = [110, 270, 430];
const swellA = 250;
const mixHex = (a: string, b: string, t: number) => { const tt = Math.max(0, Math.min(1, t)); const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * tt).toString(16).padStart(2, '0')).join(''); };
const xf = (f: number) => (f < swellA ? -700 : f < T.surgeHit ? lerp(-700, 470, Math.pow(cl((f - swellA) / (T.surgeHit - swellA)), 1.15)) : 470 + 15 * (f - T.surgeHit) + 0.11 * (f - T.surgeHit) ** 2);
const crestH = (f: number) => 120 + 740 * E.inOut(cl((f - swellA) / 80));
const wavePh = (f: number) => f * 0.09;
const ripple = (x: number, f: number) => 7 * Math.sin(x / 58 - wavePh(f)) + 4 * Math.sin(x / 24 - 1.9 * wavePh(f));
const yBase = (x: number) => (x < WALL_X ? BASE : PROM_Y);
const LB = 800;
const surf = (x: number, f: number) => {
  const xc = xf(f) - 30, h = crestH(f);
  if (f < swellA - 6 || x <= xc - LB) return BASE + ripple(x, f) * (1 - 0.0);
  if (x >= xc) return yBase(xc) - h;
  const u = (xc - x) / LB;
  return BASE - (BASE - (yBase(xc) - h)) * Math.pow(1 - u, 2.15) + ripple(x, f) * u * 0.5;
};
export const hitShake = (f: number) => { const t = f - T.surgeHit; return t < 0 || t > 14 ? {dx: 0, dy: 0} : {dx: 10 * Math.exp(-t * 0.33) * Math.sin(t * 2.1), dy: 7 * Math.exp(-t * 0.33) * Math.cos(t * 2.4)}; };

const Skyline: React.FC = () => (
  <g>
    <path d="M -100 1040 L -100 990 Q 40 950 160 972 Q 300 936 420 974 Q 520 990 560 1040 Z" fill={C.tealDeep} opacity={0.5} stroke={C.ink} strokeWidth={3} />
    {[[660, 300, 90], [760, 420, 110], [884, 250, 80], [980, 360, 100], [1090, 460, 120], [1210, 280, 90]].map(([x, h, w], i) => (
      <g key={i} opacity={0.85}>
        <rect x={x} y={1040 - h} width={w} height={h} fill={i % 2 ? C.tealDeep : '#2B6A72'} stroke={C.ink} strokeWidth={4} />
        {Array.from({length: Math.floor(h / 46)}).map((_, r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x + 16 + c * 34} y={1040 - h + 22 + r * 46} width={16} height={22} fill={C.saffronLight} opacity={0.65} />))}
      </g>
    ))}
  </g>
);
const Promenade: React.FC<{f: number}> = ({f}) => {
  const k = 0.55 + 0.45 * sm((f - 238) / 50);
  return (
    <g>
      <g transform={`translate(0 ${PROM_Y - 1150})`}>
        <Building x={700} w={560} h={700} s={STYLES[1]} />
        <Building x={1274} w={540} h={640} s={STYLES[0]} />
      </g>
      <rect x={WALL_X} y={PROM_Y} width={W - WALL_X + 400} height={H - PROM_Y} fill={C.paperDeep} stroke={C.ink} strokeWidth={5} />
      <rect x={WALL_X} y={PROM_Y} width={W - WALL_X + 400} height={26} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      <rect x={WALL_X - 54} y={PROM_Y} width={54} height={H - PROM_Y} fill={C.cream} stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 8}).map((_, r) => <g key={r}><line x1={WALL_X - 54} y1={PROM_Y + 90 + r * 100} x2={WALL_X} y2={PROM_Y + 90 + r * 100} stroke="#C9B27F" strokeWidth={5} /><line x1={WALL_X - 27 + (r % 2) * 14} y1={PROM_Y + r * 100 - 10} x2={WALL_X - 27 + (r % 2) * 14} y2={PROM_Y + 90 + r * 100} stroke="#C9B27F" strokeWidth={4} /></g>)}
      <g>{[0, 62].map((dx) => <line key={dx} x1={WALL_X + 120 + dx} y1={PROM_Y + 10} x2={WALL_X + 120 + dx} y2={PROM_Y + 520} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />)}{Array.from({length: 9}).map((_, i) => <line key={i} x1={WALL_X + 120} y1={PROM_Y + 56 + i * 54} x2={WALL_X + 182} y2={PROM_Y + 56 + i * 54} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />)}</g>
      <g transform={`translate(${WALL_X + 330} ${PROM_Y + 260})`}><circle r={52} fill="none" stroke={C.ink} strokeWidth={34} /><circle r={52} fill="none" stroke={C.coral} strokeWidth={24} /><circle r={52} fill="none" stroke={C.cream} strokeWidth={24} strokeDasharray="41 41" /></g>
      {[760, 960].map((x, i) => <PalmWind key={x} x={x + 40} baseY={PROM_Y} h={i ? 430 : 520} k={k} f={f} seed={i * 2.1 + 5} />)}
      <Lamp3 x={1000} wob={1.4 * k * Math.sin(f * 0.6)} />
    </g>
  );
};
const Pier: React.FC<{f: number}> = ({f}) => {
  const t = f - T.surgeHit, trem = t > -14 && t < 0 ? 2.4 * Math.sin(f * 2.3) * (1 + t / 14) : 0;
  return (
    <g transform={`translate(${trem} 0)`}>
      <rect x={POST_X[0] - 100} y={1092} width={POST_X[2] - POST_X[0] + 200} height={52} rx={7} fill={C.woodLight} stroke={C.ink} strokeWidth={6} />
      {Array.from({length: 10}).map((_, i) => <line key={i} x1={POST_X[0] - 84 + i * 50} y1={1096} x2={POST_X[0] - 84 + i * 50} y2={1140} stroke={C.woodDeep} strokeWidth={3} />)}
      {POST_X.map((x) => (
        <g key={x}>
          <rect x={x - 30} y={1144} width={60} height={880} fill={C.woodDeep} stroke={C.ink} strokeWidth={6} />
          {[1260, 1350, 1440, 1530, 1620, 1710].map((y, k) => <rect key={y} x={x - 30} y={y} width={60} height={24} fill={k % 2 ? C.cream : C.coral} stroke={C.ink} strokeWidth={3} />)}
          <rect x={x - 38} y={1084} width={76} height={24} rx={6} fill={C.wood} stroke={C.ink} strokeWidth={5} />
          <rect x={x - 12} y={1040} width={24} height={50} rx={6} fill={C.ink} />
        </g>
      ))}
      <path d={`M ${POST_X[0]} 1050 q 80 46 ${POST_X[1] - POST_X[0]} 0 q 80 46 ${POST_X[2] - POST_X[1]} 0`} fill="none" stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
    </g>
  );
};

/** the sea: a calm bay plus the swell (a back slope, a curling lip, foam, spray) */
const Sea: React.FC<{f: number}> = ({f}) => {
  const on = f >= swellA - 6, x0 = -140, xe = xf(f), xc = xe - 30, h = crestH(f), yb = yBase(xc), top = yb - h;
  const pts: string[] = [];
  const xs = Math.max(x0, xc - LB);
  for (let x = x0; x <= xc; x += 22) pts.push(`${x},${surf(x, f)}`);
  const lip = `C ${xc + 90} ${top - 70}, ${xc + 230} ${top - 36}, ${xc + 262} ${top + 120} C ${xc + 206} ${top + 92}, ${xc + 130} ${top + 180}, ${xc + 116} ${top + 320} C ${xc + 108} ${(top + yb) / 2 + 120}, ${xc + 70} ${yb - 60}, ${xc + 60} ${yb}`;
  const body = on ? `M ${x0} 1990 L ${pts.join(' L ')} ${lip} L ${xc + 60} 1990 Z` : '';
  const clip = 'waveClip';
  const spray: React.ReactNode[] = [];
  if (on && f > swellA + 20) {
    for (let i = 0; i < 46; i++) {
      const age = ((f * 1.0 + i * 3.1) % 34), kk = rand(i + 4), x = xc + 40 + age * (6 + 5 * kk) + rand(i) * 40, y = top + 40 - age * (6 + 4 * rand(i + 2)) + age * age * 0.3 + rand(i + 9) * 70;
      spray.push(<circle key={i} cx={x} cy={y} r={(4 + 10 * rand(i + 3)) * (1 - age / 44)} fill={C.cream} opacity={cl(1 - age / 36)} />);
    }
  }
  return (
    <g>
      {/* calm bay */}
      <rect x={-200} y={1030} width={W + 600} height={BASE - 1030} fill={C.tealLight} />
      <line x1={-200} y1={1030} x2={W + 400} y2={1030} stroke={C.teal} strokeWidth={6} />
      <rect x={-200} y={BASE} width={WALL_X + 200} height={H - BASE + 60} fill={C.teal} />
      {Array.from({length: 8}).map((_, i) => <path key={i} d={`M ${-100 + ((i * 163 + f * 0.8) % 760)} ${BASE + 70 + i * 82} h 100`} stroke={C.tealLight} strokeWidth={7} strokeLinecap="round" opacity={0.55} />)}
      {Array.from({length: 12}).map((_, i) => <path key={`h${i}`} d={`M ${-100 + i * 80 + ((f * 0.5) % 80)} ${1070 + (i % 3) * 36} h 46`} stroke={C.cream} strokeWidth={5} strokeLinecap="round" opacity={0.7} />)}
      {on && (
        <g>
          <defs>
            <clipPath id={clip}><path d={body} /></clipPath>
            <linearGradient id="waveG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2FBDB3" /><stop offset="0.45" stopColor={C.teal} /><stop offset="1" stopColor="#0E706A" /></linearGradient>
          </defs>
          <path d={body} fill="url(#waveG)" />
          <g clipPath={`url(#${clip})`}>
            {Array.from({length: 11}).map((_, i) => { const y = top + 120 + i * 90, x = ((i * 233 + (f - swellA) * (22 + 4 * i)) % 1100) - 160; return <path key={i} d={`M ${x} ${y} q 80 -26 170 0`} stroke={C.tealLight} strokeWidth={7} strokeLinecap="round" fill="none" opacity={0.45} />; })}
            <path d={`M ${xc + 262} ${top + 120} C ${xc + 206} ${top + 92}, ${xc + 130} ${top + 180}, ${xc + 116} ${top + 320} L ${xc + 30} ${top + 340} C ${xc + 50} ${top + 190}, ${xc + 170} ${top + 100}, ${xc + 262} ${top + 120} Z`} fill={C.ink} opacity={0.32} />
            <path d={`M ${xc - 120} ${top + 80} C ${xc - 40} ${top + 60}, ${xc + 20} ${top + 120}, ${xc + 40} ${top + 220} L ${xc - 60} ${top + 380} L ${xc - 260} ${top + 300} Z`} fill={C.ink} opacity={0.16} />
            {[70, 150, 240].map((off, i) => <path key={off} d={`M ${Array.from({length: 18}).map((_, k) => { const x = xc - 60 - k * 38; return `${x},${surf(x, f) + off + 6 * Math.sin(k + f * 0.2)}`; }).join(' L ')}`} fill="none" stroke={C.cream} strokeWidth={12 - i * 2} strokeLinecap="round" strokeDasharray="30 22" opacity={0.5 - i * 0.1} />)}
          </g>
          <path d={body} fill="none" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
          {/* foam: a scalloped line along the back slope and the lip, ragged blobs round the lip */}
          <path d={`M ${pts.slice(Math.max(0, pts.length - 20)).join(' L ')}`} fill="none" stroke={C.cream} strokeWidth={24} strokeLinecap="round" strokeDasharray="34 16" />
          {Array.from({length: 18}).map((_, i) => { const a = i / 17; const x = xc + 10 + 250 * a, y = top - 38 * Math.sin(Math.PI * a) + 150 * a * a * a + 7 * Math.sin(f * 0.5 + i); return <ellipse key={i} cx={x} cy={y} rx={24 - 9 * a + 6 * rand(i + 1)} ry={16 - 4 * a} fill={C.cream} />; })}
          {spray}
        </g>
      )}
    </g>
  );
};

const Boat: React.FC<{f: number}> = ({f}) => {
  const xe = xf(f), xb0 = 330, xb = f < swellA + 20 ? xb0 : xb0 + 0.62 * Math.max(0, xe - 180 - (xb0 - 330)), yb = surf(xb, f), slope = (surf(xb + 16, f) - surf(xb - 16, f)) / 32;
  const ang = Math.max(-40, Math.min(40, Math.atan(slope) * 57.3 * 0.9));
  const bob = f < swellA ? 6 * Math.sin(f * 0.16) : 0;
  return <g transform={`translate(${xb} ${yb + 4 + bob}) rotate(${ang}) scale(1.7)`}><IconBoat /></g>;
};

const PLANKS = Array.from({length: 7}).map((_, i) => ({x: 120 + i * 62, vx: 7 + rand(i + 1) * 10, vy: -10 - rand(i + 2) * 12, sp: (rand(i + 3) - 0.3) * 24}));
export const CoastScene: React.FC<{f: number}> = ({f}) => {
  const sh = hitShake(f), z = 1 + 0.05 * cl((f - T.coastA) / 90);
  const storm = 0.12 + 0.26 * cl((f - swellA) / 80);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        <defs><linearGradient id="skyC3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mixHex(C.saffron, '#B84A38', 0.3 + storm * 1.8)} /><stop offset="0.7" stopColor={mixHex(C.saffronLight, C.saffronDeep, 0.2 + storm * 1.2)} /><stop offset="1" stopColor={C.saffronLight} /></linearGradient></defs>
        <rect x={0} y={0} width={W} height={H} fill="url(#skyC3)" />
        <g transform={`translate(${sh.dx} ${sh.dy}) translate(540 1300) scale(${z}) translate(-540 -1300)`}>
          <circle cx={860} cy={380} r={110} fill={C.saffron} opacity={0.5} /><circle cx={860} cy={380} r={74} fill={C.saffronLight} />
          {[0, 1, 2].map((i) => <path key={i} d={`M -200 ${-200 + i * 120 + (1 - storm * 3) * -300} L -200 ${120 + i * 130} ${Array.from({length: 12}).map((_, k) => `Q ${-200 + k * 190 + 95} ${170 + i * 130 + 60 * Math.sin(k + i)} ${-200 + (k + 1) * 190} ${120 + i * 130 + 14 * Math.sin(k * 2 + i)}`).join(' ')} L ${W + 200} ${-200 + i * 120 + (1 - storm * 3) * -300} Z`} fill={i % 2 ? '#2C5F68' : '#1D4A53'} opacity={0.5 + 0.1 * i} stroke={C.ink} strokeWidth={4} />)}
          <Skyline />
          <Promenade f={f} />
          <Sea f={f} />
          <Boat f={f} />
          <Pier f={f} />
          {f >= T.surgeHit && PLANKS.map((p, i) => { const t = f - T.surgeHit; return t < 26 ? <rect key={i} x={p.x + p.vx * t - 45} y={1100 + p.vy * t + 0.9 * t * t} width={90} height={16} fill={C.woodLight} stroke={C.ink} strokeWidth={4} transform={`rotate(${p.sp * t} ${p.x + p.vx * t} ${1100 + p.vy * t + 0.9 * t * t})`} /> : null; })}
        </g>
        {Array.from({length: 12}).map((_, i) => { const y = 300 + rand(i + 40) * 900, len = 200 + rand(i + 3) * 260, x = ((rand(i + 70) * (W + 700) + f * (80 + rand(i + 9) * 50)) % (W + 700)) - 350; return <line key={i} x1={x} y1={y} x2={x - len} y2={y} stroke={C.cream} strokeWidth={6} strokeLinecap="round" opacity={0.5} />; })}
      </svg>
    </div>
  );
};

/** the water washes through the frame as a foam-edged band: its leading edge covers the coast, its trailing edge reveals the next scene; spray flies ahead of it */
export const waterEdges = (f: number) => {
  const u = ramp(f, T.sprayA - 18, T.sprayB - 8, E.inOut), L1 = lerp(-380, 1500, u);
  return {L1, L2: L1 - 800};
};
export const WaterBand: React.FC<{f: number}> = ({f}) => {
  if (f < T.sprayA - 20 || f > T.sprayB) return null;
  const {L1, L2} = waterEdges(f);
  const edge = (x0: number, ph: number, amp: number) => Array.from({length: 40}).map((_, i) => { const y = -60 + i * 52; return {x: x0 + amp * Math.abs(Math.sin(y / 38 + ph + f * 0.5)) + 12 * Math.sin(y / 17 + f), y}; });
  const e1 = edge(L1, 0, 46), e2 = edge(L2, 2.2, 38);
  const poly = `M ${e2.map((p) => `${p.x.toFixed(1)} ${p.y}`).join(' L ')} L ${[...e1].reverse().map((p) => `${p.x.toFixed(1)} ${p.y}`).join(' L ')} Z`;
  const sprays = Array.from({length: 70}).map((_, i) => { const kk = rand(i + 30), y = rand(i + 31) * H, age = (f * 1.3 + i * 5) % 30, x = L1 + 20 + age * (14 + 14 * kk) + (rand(i + 32) - 0.2) * 120; return <circle key={i} cx={x} cy={y - age * 4} r={(5 + 13 * rand(i + 33)) * (1 - age / 40)} fill={C.cream} opacity={cl(0.9 - age / 34)} />; });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="bandClip"><path d={poly} /></clipPath>
        <linearGradient id="bandG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2FBDB3" /><stop offset="1" stopColor="#0E706A" /></linearGradient>
      </defs>
      <path d={poly} fill="url(#bandG)" />
      <g clipPath="url(#bandClip)">
        {Array.from({length: 16}).map((_, i) => { const y = 80 + i * 120 + 30 * Math.sin(i), len = 180 + 80 * (i % 3), x = L1 - ((i * 211 + f * (46 + 5 * i)) % 1900); return <path key={i} d={`M ${x} ${y} h ${len}`} stroke={C.tealLight} strokeWidth={8} strokeLinecap="round" opacity={0.5} />; })}
      </g>
      <path d={poly} fill="none" stroke={C.ink} strokeWidth={7} strokeLinejoin="round" />
      {e1.filter((_, i) => i % 2 === 0).map((p, i) => <ellipse key={`a${i}`} cx={p.x + 6} cy={p.y} rx={34 + 14 * rand(i + 1)} ry={34} fill={C.cream} />)}
      {e2.filter((_, i) => i % 2 === 1).map((p, i) => <ellipse key={`b${i}`} cx={p.x - 4} cy={p.y} rx={26 + 10 * rand(i + 2)} ry={26} fill={C.cream} opacity={0.9} />)}
      {sprays}
    </svg>
  );
};
void DrawSheet;
