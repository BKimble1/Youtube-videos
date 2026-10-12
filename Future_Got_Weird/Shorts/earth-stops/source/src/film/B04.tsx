import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {HED_FONT} from '../fonts4';
import {ArrowShape, Chip, Pigeon, cl, lerp, popScale, ramp, sm} from './ui';
import {T, WORD, fs} from './timeline';
import {Building, STYLES} from '../v2/Street2';
import {IconBoat} from './B02';

/**
 * B04: "At first, the air keeps going. So does the ocean." A coast, side-on, sea to the WEST (left): promenade, seawall, lamp, jetty posts and a flagpole are fixed.
 * f 432-455 calm; f 455 the air keeps going (palms lean east, flag snaps out, loose things and a pigeon are swept east, streaks); f 490 the sea keeps going
 * (a bore advances east over the beach, the wall and the promenade, the buoy rides it, the jetty posts do not move); f 520-546 the water rises to fill the frame (wipe into B05).
 */
export const AIR_F = fs(WORD.air - 0.3); // 15.02 s: "the air"
export const SEA_F = T.oceanF + 0; // 490
export const PROM_Y = 1200, SEA_Y = 1340, SHORE_X = 470, WALL_X0 = 640, WALL_X1 = 690, FRONT_V = 22;
export const B4 = {first: fs(WORD.first - 0.25), fixedChip: 0, arrow: AIR_F + 6}; // picture events (frames)
export const DX = -240;
export const DY = 130; // the diorama sits 130 px lower: more sky and facade above, the cut-away below mostly under the Shorts UI // the diorama is shifted left so the land, palms and lamp sit in the middle of the frame
export const PALM_X = [880, 1100], LAMP_X = 985, FLAG_X = 735, POST_X = [255, 345, 435];
const PALM_H = [450, 400];
const terrain = (x: number) => (x < SHORE_X ? SEA_Y : x < WALL_X0 ? SEA_Y - ((x - SHORE_X) / (WALL_X0 - SHORE_X)) * 50 : PROM_Y);
export const windK = (f: number) => (f < AIR_F ? 0 : E.out(cl((f - AIR_F) / 16))) * (0.82 + 0.18 * Math.exp(-(f - AIR_F) / 120));
export const frontX = (f: number) => SHORE_X + FRONT_V * Math.max(0, f - SEA_F) * (1 + 0.012 * Math.max(0, f - SEA_F));
export const level = (f: number) => SEA_Y - 120 * sm((f - SEA_F) / 20); // the sea rises as it surges
const wavePhase = (f: number) => f * 0.05 + Math.max(0, f - SEA_F) * 0.34;
const wave = (x: number, f: number) => 7 * Math.sin(x / 58 - wavePhase(f)) + 4 * Math.sin(x / 24 - 1.9 * wavePhase(f));
export const crestH = (f: number) => 80 + 260 * sm((f - SEA_F) / 16);

/* ---------------------------------------------------------------- pieces */
const Palm: React.FC<{x: number; f: number; seed: number; h?: number}> = ({x, f, seed, h = 560}) => {
  const w = windK(f), lean = (4 + 34 * w) * Math.PI / 180;
  const sway = Math.sin(f * 0.08 + seed) * (1.4 + 3.2 * w) * Math.PI / 180;
  const top = {x: x + h * Math.sin(lean + sway), y: PROM_Y - h * Math.cos(lean + sway)};
  const mid = {x: x + h * 0.52 * Math.sin(lean * 0.45), y: PROM_Y - h * 0.52};
  const flutter = (i: number) => Math.sin(f * (0.5 + 0.06 * i) + i * 1.7 + seed) * (3 + 9 * w);
  const base = [-172, -142, -108, -72, -38, -6, 24, 158];
  return (
    <g>
      <path d={`M ${x - 17} ${PROM_Y} Q ${mid.x - 18} ${mid.y} ${top.x - 12} ${top.y} L ${top.x + 12} ${top.y} Q ${mid.x + 18} ${mid.y} ${x + 17} ${PROM_Y} Z`} fill={C.woodLight} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      {[0.2, 0.36, 0.52, 0.68, 0.84].map((t) => <line key={t} x1={lerp(x - 16, top.x - 12, t * t)} y1={lerp(PROM_Y, top.y, t)} x2={lerp(x + 16, top.x + 12, t * t)} y2={lerp(PROM_Y, top.y, t) - 4} stroke={C.woodDeep} strokeWidth={4} />)}
      {base.map((a0, i) => {
        const aw = ((a0 + 540) % 360) - 180; // -180..180, 0 = east
        // the wind swings every frond toward the east and straightens its droop
        const a = aw + (-4 - aw) * 0.78 * w + flutter(i);
        const r = (140 + 22 * (i % 2)) * (1 + 0.14 * w);
        const ux = Math.cos((a * Math.PI) / 180), uy = Math.sin((a * Math.PI) / 180);
        const droop = r * 0.34 * (1 - 0.8 * w);
        const tip = {x: top.x + ux * r, y: top.y + uy * r + droop};
        const nx = -uy, ny = ux, wd = 30;
        const c1 = {x: top.x + ux * r * 0.5 + nx * wd, y: top.y + uy * r * 0.5 + ny * wd - r * 0.12 + droop * 0.2};
        const c2 = {x: top.x + ux * r * 0.5 - nx * wd, y: top.y + uy * r * 0.5 - ny * wd - r * 0.04 + droop * 0.5};
        return <path key={i} d={`M ${top.x} ${top.y} Q ${c1.x} ${c1.y} ${tip.x} ${tip.y} Q ${c2.x} ${c2.y} ${top.x} ${top.y + 6} Z`} fill={i % 2 ? C.tealLight : C.teal} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />;
      })}
      <circle cx={top.x} cy={top.y + 6} r={15} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};
const Lamp: React.FC = () => (
  <g>
    <rect x={LAMP_X - 9} y={700} width={18} height={PROM_Y - 700} fill={C.ink} />
    <rect x={LAMP_X - 22} y={PROM_Y - 24} width={44} height={24} rx={5} fill={C.ink} />
    <path d={`M ${LAMP_X} 712 q 0 -66 74 -66`} fill="none" stroke={C.ink} strokeWidth={13} strokeLinecap="round" />
    <path d={`M ${LAMP_X + 42} 646 h 76 l -12 36 h -52 z`} fill={C.saffron} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
  </g>
);
const Flag: React.FC<{f: number}> = ({f}) => {
  const w = windK(f), len = 90 + 90 * w, top = 760;
  const pts = Array.from({length: 9}).map((_, i) => { const u = i / 8; return {x: FLAG_X + 8 + u * len, y: top + 70 * (1 - w) * u * u + Math.sin(f * 0.7 - u * 6) * (4 + 16 * w) * u}; });
  const up = pts.map((p) => `${p.x},${p.y}`).join(' L ');
  const dn = [...pts].reverse().map((p) => `${p.x},${p.y + 60}`).join(' L ');
  return (
    <g>
      <rect x={FLAG_X - 4} y={top - 10} width={8} height={PROM_Y - top + 10} fill={C.ink} />
      <path d={`M ${up} L ${dn} Z`} fill={C.coral} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      <path d={`M ${pts[2].x} ${pts[2].y} L ${pts[2].x} ${pts[2].y + 60} L ${pts[4].x} ${pts[4].y + 60} L ${pts[4].x} ${pts[4].y} Z`} fill={C.cream} opacity={0.9} />
    </g>
  );
};
const HorizonBand: React.FC = () => (
  <g>
    <rect x={-400} y={1020} width={W + 900} height={180} fill={C.tealLight} />
    <line x1={-400} y1={1020} x2={W + 500} y2={1020} stroke={C.teal} strokeWidth={6} />
    {Array.from({length: 14}).map((_, i) => <path key={i} d={`M ${-300 + i * 130} ${1070 + (i % 3) * 36} h 70`} stroke={C.cream} strokeWidth={5} strokeLinecap="round" opacity={0.8} />)}
  </g>
);
const Cafe: React.FC = () => (
  <g transform="translate(-70 0)">
    <rect x={930} y={820} width={220} height={PROM_Y - 820} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <rect x={920} y={796} width={240} height={26} rx={6} fill={C.tealDeep} stroke={C.ink} strokeWidth={4} />
    {[0, 1].map((r) => [0, 1].map((c) => <path key={`${r}${c}`} d={`M ${960 + c * 100} ${940 + r * 0 + 0} L ${960 + c * 100} ${880} A 30 30 0 0 1 ${1020 + c * 100} ${880} L ${1020 + c * 100} ${940} Z`} fill={C.tealLight} stroke={C.ink} strokeWidth={4} />))}
    {Array.from({length: 11}).map((_, i) => <rect key={i} x={940 + i * 19} y={1040} width={19} height={46} fill={i % 2 ? C.cream : C.saffronDeep} />)}
    <rect x={940} y={1040} width={209} height={46} fill="none" stroke={C.ink} strokeWidth={4} />
    <rect x={1010} y={1086} width={56} height={PROM_Y - 1086} rx={4} fill={C.blue} stroke={C.ink} strokeWidth={4} />
  </g>
);
const Jetty: React.FC<{f: number}> = ({f}) => (
  <g>
    {POST_X.map((x, i) => (
      <g key={x}>
        <rect x={x - 14} y={1070} width={28} height={SEA_Y - 1070 + 140} fill={C.woodDeep} stroke={C.ink} strokeWidth={4} />
        <rect x={x - 14} y={1070} width={28} height={18} fill={C.wood} stroke={C.ink} strokeWidth={4} />
      </g>
    ))}
    <rect x={POST_X[0] - 40} y={1038} width={POST_X[2] - POST_X[0] + 80} height={34} rx={5} fill={C.woodLight} stroke={C.ink} strokeWidth={4} />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <line key={i} x1={POST_X[0] - 24 + i * 48} y1={1040} x2={POST_X[0] - 24 + i * 48} y2={1070} stroke={C.woodDeep} strokeWidth={3} />)}
    <g opacity={0}>{f}</g>
  </g>
);
const Wall: React.FC = () => (
  <g>
    <polygon points={`${SHORE_X - 40},${SEA_Y + 40} ${SHORE_X},${SEA_Y} ${WALL_X0},${SEA_Y - 50} ${WALL_X0},${H} ${SHORE_X - 40},${H}`} fill="#EAD7A8" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
    <rect x={WALL_X0} y={PROM_Y} width={WALL_X1 - WALL_X0} height={H - PROM_Y} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    {Array.from({length: 7}).map((_, i) => <line key={i} x1={WALL_X0} y1={PROM_Y + 28 + i * 34} x2={WALL_X1} y2={PROM_Y + 28 + i * 34} stroke={C.paperLine} strokeWidth={3} />)}
    <rect x={WALL_X1} y={PROM_Y} width={W - WALL_X1 + 400} height={H - PROM_Y} fill={C.paperDeep} stroke={C.ink} strokeWidth={4} />
    <rect x={WALL_X1} y={PROM_Y} width={W - WALL_X1 + 400} height={26} fill={C.cream} stroke={C.ink} strokeWidth={4} />
    <line x1={WALL_X1} y1={PROM_Y} x2={W + 400} y2={PROM_Y} stroke={C.ink} strokeWidth={5} />
    {Array.from({length: 9}).map((_, i) => <line key={i} x1={WALL_X1 + 40 + i * 120} y1={PROM_Y + 26} x2={WALL_X1 + 20 + i * 120} y2={PROM_Y + 26} stroke={C.paperLine} strokeWidth={4} />)}
    {Array.from({length: 26}).map((_, i) => <ellipse key={`g${i}`} cx={WALL_X1 + 30 + rand(i + 50) * 700} cy={PROM_Y + 70 + rand(i + 80) * 560} rx={8 + rand(i + 7) * 14} ry={4 + rand(i) * 5} fill={C.paperLine} opacity={0.8} />)}
    <rect x={WALL_X1 + 380} y={PROM_Y + 120} width={80} height={36} rx={6} fill={C.inkSoft} stroke={C.ink} strokeWidth={4} />
    {/* masonry: courses and staggered joints, so the wall face reads as stone and not as a blank panel */}
    {Array.from({length: 7}).map((_, r) => {
      const y0 = PROM_Y + 26 + r * 100;
      return (
        <g key={`m${r}`}>
          <line x1={WALL_X1} y1={y0 + 100} x2={W + 400} y2={y0 + 100} stroke="#C9B27F" strokeWidth={5} />
          {Array.from({length: 7}).map((__, k) => <line key={k} x1={WALL_X1 + 30 + k * 190 + (r % 2) * 95} y1={y0} x2={WALL_X1 + 30 + k * 190 + (r % 2) * 95} y2={y0 + 100} stroke="#C9B27F" strokeWidth={5} />)}
        </g>
      );
    })}
    {/* an iron ladder, a lifebuoy and two bollards: fixed things bolted to the wall */}
    <g>
      {[0, 74].map((dx) => <line key={dx} x1={WALL_X1 + 120 + dx} y1={PROM_Y + 10} x2={WALL_X1 + 120 + dx} y2={PROM_Y + 520} stroke={C.ink} strokeWidth={13} strokeLinecap="round" />)}
      {Array.from({length: 9}).map((_, i) => <line key={i} x1={WALL_X1 + 120} y1={PROM_Y + 56 + i * 54} x2={WALL_X1 + 194} y2={PROM_Y + 56 + i * 54} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />)}
      {[0, 74].map((dx) => <line key={`h${dx}`} x1={WALL_X1 + 120 + dx} y1={PROM_Y + 10} x2={WALL_X1 + 120 + dx} y2={PROM_Y + 520} stroke={C.saffronLight} strokeWidth={4} strokeLinecap="round" />)}
    </g>
    <g transform={`translate(${WALL_X1 + 300} ${PROM_Y + 250})`}>
      <circle r={52} fill="none" stroke={C.ink} strokeWidth={34} />
      <circle r={52} fill="none" stroke={C.coral} strokeWidth={24} />
      <circle r={52} fill="none" stroke={C.cream} strokeWidth={24} strokeDasharray="41 41" />
      <circle r={52} fill="none" stroke={C.ink} strokeWidth={3} />
    </g>
    {[WALL_X1 + 70, WALL_X1 + 560].map((x) => (
      <g key={x}>
        <rect x={x - 17} y={PROM_Y - 36} width={34} height={38} rx={8} fill={C.ink} />
        <rect x={x - 13} y={PROM_Y - 22} width={26} height={7} fill={C.saffron} />
      </g>
    ))}
  </g>
);

const Sea: React.FC<{f: number}> = ({f}) => {
  const lv = level(f), on = f >= SEA_F;
  const xf = frontX(f);
  const steps: string[] = [];
  const xs = on ? Math.max(40, xf - 200) : SHORE_X;
  for (let x = -20; x <= xs; x += 20) steps.push(`${x},${lv + wave(x, f)}`);
  let d: string;
  if (!on) {
    d = `M -20 ${H} L ${steps.join(' L ')} L ${SHORE_X + 14} ${SEA_Y + 6} L ${SHORE_X - 40} ${SEA_Y + 40} L ${SHORE_X - 40} ${H} Z`;
  } else {
    const ty = terrain(xf), yc = ty - crestH(f);
    const base: string[] = [];
    for (let x = xf; x >= SHORE_X - 40; x -= 40) base.push(`${x},${terrain(x) + 2}`);
    d = `M -20 ${H} L ${steps.join(' L ')} C ${xf - 120} ${lv + wave(xs, f)}, ${xf - 90} ${yc + 20}, ${xf - 40} ${yc} C ${xf} ${yc - 24}, ${xf + 50} ${yc - 4}, ${xf + 36} ${yc + 40} C ${xf + 30} ${(yc + ty) / 2}, ${xf + 4} ${ty - 20}, ${xf} ${ty} L ${base.join(' L ')} L ${SHORE_X - 40} ${H} Z`;
  }
  // foam: scallops along the surface and on the crest, spray ahead of the front
  const foam: React.ReactNode[] = [];
  if (on) {
    const ty = terrain(xf), yc = ty - crestH(f);
    for (let i = 0; i < 9; i++) {
      const u = i / 8, x = xf - 190 + u * 220, y = lerp(level(f) + wave(xf - 190, f) - 4, yc + 8, E.out(u)) - 4;
      foam.push(<circle key={`c${i}`} cx={x} cy={y} r={10 + 10 * rand(i + 5)} fill={C.cream} stroke={C.ink} strokeWidth={3} />);
    }
    for (let i = 0; i < 14; i++) {
      const age = (f - SEA_F + i * 3) % 24, x = xf + 20 + age * 5 + rand(i) * 40, y = yc - 10 - age * 3 + age * age * 0.18 + rand(i + 9) * 40;
      foam.push(<circle key={`s${i}`} cx={x} cy={y} r={4 + 6 * rand(i + 3)} fill={C.cream} stroke={C.ink} strokeWidth={2} opacity={cl(1 - age / 30)} />);
    }
  } else {
    for (let i = 0; i < 12; i++) { const x = 20 + i * 38; foam.push(<ellipse key={i} cx={x} cy={lv + wave(x, f) + 3} rx={14} ry={4} fill={C.cream} opacity={0.8} />); }
  }
  return (
    <g>
      <path d={d} fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      {Array.from({length: 6}).map((_, i) => <path key={i} d={`M ${-20 + ((i * 163 + (on ? (f - SEA_F) * 20 : f * 0.6)) % 560)} ${lv + 70 + i * 70} h 90`} stroke={C.tealLight} strokeWidth={6} strokeLinecap="round" opacity={0.7} />)}
      {foam}
    </g>
  );
};

/** things the wind picks up */
export type Junk = {kind: 'cup' | 'paper' | 'cap' | 'leaf'; x0: number; y0: number; vx: number; vy: number; r: number; f0: number};
export const JUNK: Junk[] = [
  {kind: 'cap', x0: 760, y0: PROM_Y - 70, vx: 36, vy: -4.2, r: 14, f0: AIR_F + 3},
  {kind: 'paper', x0: 720, y0: PROM_Y - 24, vx: 30, vy: -3.2, r: 9, f0: AIR_F + 6},
  {kind: 'cup', x0: 990, y0: PROM_Y - 22, vx: 31, vy: -2.4, r: 20, f0: AIR_F + 9},
  {kind: 'leaf', x0: 760, y0: PROM_Y - 150, vx: 40, vy: -1.2, r: 18, f0: AIR_F + 8},
  {kind: 'paper', x0: 1090, y0: PROM_Y - 30, vx: 28, vy: -4.8, r: -7, f0: AIR_F + 14},
  {kind: 'leaf', x0: 840, y0: PROM_Y - 210, vx: 44, vy: 0.6, r: -22, f0: AIR_F + 14},
  {kind: 'cup', x0: 700, y0: PROM_Y - 20, vx: 27, vy: -3.8, r: -16, f0: AIR_F + 20},
  {kind: 'cap', x0: 940, y0: PROM_Y - 84, vx: 34, vy: -3.0, r: 17, f0: AIR_F + 27},
  {kind: 'paper', x0: 1000, y0: PROM_Y - 28, vx: 33, vy: -5.4, r: 11, f0: AIR_F + 33},
  {kind: 'leaf', x0: 880, y0: PROM_Y - 120, vx: 42, vy: -1.8, r: 24, f0: AIR_F + 38},
];
const Piece: React.FC<{j: Junk; t: number}> = ({j, t}) => {
  const x = j.x0 + j.vx * t, y = j.y0 + j.vy * t + 0.07 * t * t, rot = j.r * t * 4;
  if (x > W + 120) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {j.kind === 'cup' && <g><path d="M -16 -22 L 16 -22 L 11 18 L -11 18 Z" fill={C.cream} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /><rect x={-14} y={-8} width={28} height={12} fill={C.saffron} /><ellipse cx={0} cy={-22} rx={16} ry={5} fill={C.cream} stroke={C.ink} strokeWidth={4} /></g>}
      {j.kind === 'paper' && <g transform={`skewX(${Math.sin(t * 0.8) * 25})`}><rect x={-26} y={-18} width={52} height={36} fill={C.white} stroke={C.ink} strokeWidth={4} />{[-8, 2, 12].map((yy) => <line key={yy} x1={-18} y1={yy} x2={18} y2={yy} stroke={C.inkMuted} strokeWidth={3} />)}</g>}
      {j.kind === 'cap' && <g><path d="M -26 8 Q -26 -22 0 -22 Q 26 -22 26 8 Z" fill={C.blue} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /><path d="M 10 8 Q 40 6 48 14 L 12 14 Z" fill={C.blueDeep} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" /></g>}
      {j.kind === 'leaf' && <path d="M -20 0 Q 0 -18 20 0 Q 0 16 -20 0 Z" fill={C.teal} stroke={C.ink} strokeWidth={3} />}
    </g>
  );
};

export const Coast: React.FC<{f: number}> = ({f}) => {
  const w = windK(f);
  const streaks = Array.from({length: 18}).map((_, i) => {
    const y = 560 + rand(i + 40) * 640, len = 170 + rand(i + 3) * 260, v = (70 + rand(i + 9) * 50) * (0.55 + 0.45 * w);
    const x = ((rand(i + 70) * (W + 700) + (f - AIR_F) * v) % (W + 700)) - 350;
    return w > 0.05 ? <line key={i} x1={x} y1={y} x2={x - len} y2={y} stroke={C.cream} strokeWidth={6 + rand(i) * 4} strokeLinecap="round" opacity={0.75 * w} /> : null;
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <defs><linearGradient id="skyCoast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.saffron} /><stop offset="1" stopColor={C.saffronLight} /></linearGradient></defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#skyCoast)" />
      <circle cx={860} cy={300} r={120} fill={C.saffron} opacity={0.55} />
      <circle cx={860} cy={300} r={80} fill={C.saffronLight} />
      <g transform={`translate(${DX} ${DY})`}>
        <HorizonBand />
        <g transform={`translate(0 ${PROM_Y - 1150})`}>
          <Building x={760} w={560} h={700} s={STYLES[1]} />
          <Building x={1334} w={540} h={640} s={STYLES[0]} />
        </g>
        <Jetty f={f} />
        <Wall />
        <Flag f={f} />
        <Lamp />
        {PALM_X.map((x, i) => <Palm key={x} x={x} f={f} seed={i * 2.1} h={PALM_H[i]} />)}
        {JUNK.map((j, i) => (f >= j.f0 ? <Piece key={i} j={j} t={f - j.f0} /> : null))}
        <Sea f={f} />
        {(() => { const bx = 150 + (f >= SEA_F ? FRONT_V * 0.9 * (f - SEA_F) * (1 + 0.012 * (f - SEA_F)) : 0); return bx < W + 300 - DX ? <g transform={`translate(${bx} ${level(f) + wave(bx, f) - 6}) scale(1.35)`}><IconBoat /></g> : null; })()}
      </g>
      {streaks}
      {f >= AIR_F + 2 && <Pigeon x={-120 + (f - AIR_F - 2) * 34} y={780 + Math.sin(f * 0.2) * 14 - (f - AIR_F) * 1.2} s={1.5} fly flap={f * 0.95} />}
      {/* buoy riding the water */}
      {(() => {
        const bx = 260 + (f >= SEA_F ? FRONT_V * 0.9 * (f - SEA_F) * (1 + 0.012 * (f - SEA_F)) : 0), by = level(f) + wave(bx, f) - 16;
        return bx < W + 60 - DX ? <g transform={`translate(${bx + DX} ${by})`}><circle r={24} fill={C.coral} stroke={C.ink} strokeWidth={4} /><rect x={-24} y={-6} width={48} height={12} fill={C.cream} /><circle r={24} fill="none" stroke={C.ink} strokeWidth={4} /><line x1={0} y1={-24} x2={0} y2={-56} stroke={C.ink} strokeWidth={5} /></g> : null;
      })()}
    </svg>
  );
};

export const CoastGraphics: React.FC<{f: number}> = ({f}) => {
  const w = windK(f);
  const shrink = 1 - 0.42 * ramp(f, AIR_F + 6, T.wipe2A, (x) => x);
  const first = popScale(f, B4.first);
  const out = ramp(f, T.wipe2A - 4, T.wipe2A + 4, (x) => x);
  const palmTops = PALM_X.map((x, i) => ({x: x + DX + PALM_H[i] * Math.sin(((4 + 34 * w) * Math.PI) / 180) + 30, y: PROM_Y + DY - PALM_H[i] - 190}));
  const frontP = { x: Math.min(W - 120, frontX(f) + DX - 20), y: terrain(frontX(f)) + DY - crestH(f) - 120 };
  const arrowOn = (fr: number) => popScale(f, fr) * (1 - out);
  return (
    <g>
      <Chip x={250} y={700} w={300} text="AT FIRST" tone="move" scale={first * (1 - out)} />
      {palmTops.map((p, i) => <g key={i} transform={`translate(${p.x} ${p.y}) scale(${arrowOn(AIR_F + 6 + i * 4) * shrink})`}><ArrowShape x={0} y={0} w={190} /></g>)}
      <g transform={`translate(${FLAG_X + DX + 90} ${700 + DY}) scale(${arrowOn(AIR_F + 10) * shrink})`}><ArrowShape x={0} y={0} w={190} /></g>
      {f >= SEA_F + 2 && <g transform={`translate(${frontP.x - 40} ${frontP.y}) scale(${arrowOn(SEA_F + 2) * shrink})`}><ArrowShape x={0} y={0} w={190} /></g>}
      <Chip x={POST_X[1] + DX + 10} y={940 + DY} w={190} text="FIXED" tone="still" scale={popScale(f, SEA_F + 6) * (1 - out)} />
      <g opacity={0}><text fontFamily={HED_FONT} /></g>
    </g>
  );
};

/** the sea rises to fill the frame (wipe into B05, whose background is the same teal) */
export const TideFill: React.FC<{f: number}> = ({f}) => {
  const u = ramp(f, T.wipe2A, T.wipe2B, E.inOut);
  if (u <= 0) return null;
  const top = lerp(H + 40, -140, u); // rises from below the frame (no pop-in)
  const pts: string[] = [];
  for (let x = -20; x <= W + 20; x += 20) pts.push(`${x},${top + 8 * Math.sin(x / 50 - f * 0.4) + 5 * Math.sin(x / 21 - f * 0.7)}`);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={`M -20 ${H + 20} L ${pts.join(' L ')} L ${W + 20} ${H + 20} Z`} fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      {Array.from({length: 14}).map((_, i) => { const x = -10 + i * 82 + 14 * Math.sin(f * 0.3 + i); return <circle key={i} cx={x} cy={top + 6 + 8 * Math.sin(x / 50 - f * 0.4)} r={9 + 8 * rand(i + 31)} fill={C.cream} stroke={C.ink} strokeWidth={3} />; })}
    </svg>
  );
};
