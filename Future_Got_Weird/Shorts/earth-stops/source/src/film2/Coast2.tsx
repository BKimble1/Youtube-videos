import React from 'react';
import {C, H, W} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {Pigeon, ArrowShape, cl, lerp, popScale, ramp, sm} from './ui';
import {T, WORD, fs} from './timeline';
import {Building, STYLES} from '../v2/Street2';
import {IconBoat} from '../film/B02';

/**
 * B04, V2: the main escalation. "The air keeps going too. And so does the ocean." A coast, side-on, sea to the WEST (left), land to the east. Layers (back to front): sky, a far shore across the bay,
 * horizon band, tall facades, seawall and promenade with palms/lamp/flag, the sea (a rising mass with a curling front, a darker second swell behind it, foam, spray, a boat and a buoy riding it),
 * and, in FRONT of everything, the big pier posts with painted tide bands: the one fixed reference the water is measured against.
 *   f 446-451 calm; f 451 the air (palms thrash east, flag, litter, a pigeon); f 472 the sea heaves up the posts; f 486 the front enters from the left; f 514 it hits the wall; it climbs, floods the promenade
 *   and bursts as spray (f 545-556) that occludes the frame, so the next scene is revealed under foam.
 */
export const AIR_F = T.airF, SEA_F = T.seaF;
export const PROM_Y = 1200, SEA_Y = 1340, SHORE_X = 470, WALL_X0 = 640, WALL_X1 = 690;
export const DX = -240, DY = 130;
export const PALM_X = [880, 1100], LAMP_X = 985, FLAG_X = 735;
const PALM_H = [450, 400];
const terrain = (x: number) => (x < SHORE_X ? SEA_Y : x < WALL_X0 ? SEA_Y - ((x - SHORE_X) / (WALL_X0 - SHORE_X)) * 50 : PROM_Y);
export const windK = (f: number) => (f < AIR_F ? 0 : E.out(cl((f - AIR_F) / 16))) * (0.82 + 0.18 * Math.exp(-(f - AIR_F) / 120));
/** the front of the surge (world x): enters from the left edge (world 240) at SEA_F, accelerates a little */
export const frontX = (f: number) => { const t = Math.max(0, f - SEA_F); return 200 + 13 * t + 0.12 * t * t; };
export const WALL_F = (() => { for (let f = SEA_F; f < SEA_F + 120; f++) if (frontX(f) >= WALL_X0) return f; return SEA_F + 28; })();
export const EXIT_F = (() => { for (let f = SEA_F; f < SEA_F + 160; f++) if (frontX(f) + DX >= W + 40) return f; return SEA_F + 60; })();
/** the water level behind the front: heaves up before the front arrives, then floods the promenade */
export const level = (f: number) => SEA_Y - (SEA_Y - (PROM_Y - 100)) * E.inOut(sm((f - 470) / 64));
const wavePhase = (f: number) => f * 0.06 + Math.max(0, f - SEA_F) * 0.32;
const ripple = (x: number, f: number) => 7 * Math.sin(x / 58 - wavePhase(f)) + 4 * Math.sin(x / 24 - 1.9 * wavePhase(f));
export const crestH = (f: number) => 90 + 300 * sm((f - SEA_F) / 24) + 100 * sm((f - WALL_F) / 14);
const surfaceY = (x: number, f: number) => {
  const lv = level(f), xf = frontX(f), xs = xf - 520, ytop = terrain(xf) - crestH(f);
  if (f < SEA_F || x <= xs) return lv + ripple(x, f);
  const u = cl((x - xs) / 410);
  return lv + (ytop + 30 - lv) * Math.pow(u, 2.4);
};

/* ---------------------------------------------------------------- pieces (from V1) */
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


/* ---------------------------------------------------------------- the sea: a rising mass with a curling front */
const Sea: React.FC<{f: number}> = ({f}) => {
  const lv = level(f), on = f >= SEA_F - 2;
  const xf = frontX(f);
  const surface = (x0: number, x1: number, dy: number, amp = 1) => { const a: string[] = []; for (let x = x0; x <= x1; x += 20) a.push(`${x},${surfaceY(x, f) + dy + ripple(x * 1.3, f) * 0.3 * amp}`); return a; };
  let body: string; let back: string | null = null; let foam: React.ReactNode[] = [];
  if (!on) {
    const st = surface(-40, SHORE_X, 0);
    body = `M -40 ${H + 40} L ${st.join(' L ')} L ${SHORE_X + 14} ${SEA_Y + 6} L ${SHORE_X - 40} ${SEA_Y + 40} L ${SHORE_X - 40} ${H + 40} Z`;
    for (let i = 0; i < 12; i++) { const x = -20 + i * 40; foam.push(<ellipse key={i} cx={x} cy={surfaceY(x, f) + 4} rx={15} ry={4} fill={C.cream} opacity={0.8} />); }
  } else {
    const ty = terrain(xf), ch = crestH(f), yc = ty - ch;
    const xs = Math.max(-40, xf - 520);
    const st = surface(-40, xs, 0);
    // rising back, crest top, curl tip toward the east, concave underside, face down to the base
    const ret = `C ${xf - 330} ${lv - 2}, ${xf - 240} ${yc + 96}, ${xf - 110} ${yc + 24} C ${xf - 60} ${yc - 30}, ${xf + 50} ${yc - 26}, ${xf + 86} ${yc + 56} C ${xf + 60} ${yc + 40}, ${xf + 20} ${yc + 84}, ${xf + 14} ${yc + 170} C ${xf + 10} ${(yc + ty) / 2 + 40}, ${xf + 6} ${ty - 36}, ${xf} ${ty}`;
    const baseL: string[] = []; for (let x = xf; x >= SHORE_X - 40; x -= 40) baseL.push(`${x},${Math.max(terrain(x) + 2, Math.min(terrain(x) + 2, 1e5))}`);
    body = `M -40 ${H + 40} L ${st.join(' L ')} ${ret} L ${baseL.join(' L ')} L ${SHORE_X - 40} ${H + 40} Z`;
    // a darker second swell behind the front (lags it, lower), same recipe
    const xb = xf - 330, yb = terrain(xb) - ch * 0.55;
    back = `M -40 ${H + 40} L ${surface(-40, Math.max(-40, xb - 330), -26).join(' L ')} C ${xb - 200} ${lv - 30}, ${xb - 150} ${yb + 60}, ${xb - 60} ${yb + 8} C ${xb - 14} ${yb - 30}, ${xb + 56} ${yb - 20}, ${xb + 78} ${yb + 44} L ${xb + 40} ${terrain(xb) + 2} L ${SHORE_X - 40} ${H + 40} Z`;
    // foam: scallops on the back slope and the lip, a ragged edge on the curl, spray ahead of and above the crest
    for (let i = 0; i < 13; i++) { const u = i / 12, x = xf - 330 + u * 330, y = surfaceY(x, f) - 6 - 10 * rand(i + 3); foam.push(<circle key={`c${i}`} cx={x} cy={y} r={11 + 11 * rand(i + 5)} fill={C.cream} stroke={C.ink} strokeWidth={3} />); }
    for (let i = 0; i < 7; i++) { const a = i / 6, x = xf - 30 + 120 * a, y = yc - 6 + 66 * a * a + 6 * Math.sin(f * 0.5 + i); foam.push(<circle key={`l${i}`} cx={x} cy={y} r={13 - 4 * a + 4 * rand(i + 9)} fill={C.cream} stroke={C.ink} strokeWidth={3} />); }
    for (let i = 0; i < 26; i++) {
      const age = (f - SEA_F + i * 2) % 28, x = xf + 40 + age * 7 + rand(i) * 70, y = yc + 20 - age * 5 + age * age * 0.28 + rand(i + 9) * 60;
      foam.push(<circle key={`s${i}`} cx={x} cy={y} r={4 + 7 * rand(i + 3)} fill={C.cream} stroke={C.ink} strokeWidth={2} opacity={cl(1 - age / 34)} />);
    }
    // flow streaks on the body of the water (long white dashes streaming east, faster near the front)
    for (let i = 0; i < 9; i++) { const y = lv + 40 + i * 62, x = ((i * 211 + (f - SEA_F) * (24 + 3 * i)) % 900) - 120; foam.push(<path key={`fl${i}`} d={`M ${x} ${y} h ${90 + 30 * (i % 3)}`} stroke={C.cream} strokeWidth={6} strokeLinecap="round" opacity={0.55} />); }
  }
  return (
    <g>
      {back && <path d={back} fill={C.tealDeep} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />}
      <path d={body} fill={C.teal} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      {Array.from({length: 6}).map((_, i) => <path key={i} d={`M ${-20 + ((i * 163 + (on ? (f - SEA_F) * 20 : f * 0.6)) % 560)} ${lv + 80 + i * 70} h 90`} stroke={C.tealLight} strokeWidth={6} strokeLinecap="round" opacity={0.6} />)}
      {foam}
    </g>
  );
};

/** the boat and the buoy ride the surge: the boat on the slope of the front (tilted), the buoy on the water behind it */
const Riders: React.FC<{f: number}> = ({f}) => {
  const xf = frontX(f);
  const bx = f < SEA_F ? 170 : Math.min(xf - 250, 760 + 0.28 * Math.max(0, xf - 1010));
  const by = surfaceY(bx, f), bAng = f < SEA_F ? 0 : -cl((surfaceY(bx + 12, f) - surfaceY(bx - 12, f)) / 24, -0.7, 0.7) * 58 * -1;
  const ux = f < SEA_F ? 300 : Math.min(xf - 470, 560 + 0.2 * Math.max(0, xf - 1030)), uy = surfaceY(ux, f) - 14;
  return (
    <g>
      <g transform={`translate(${bx} ${by + 2}) rotate(${bAng}) scale(1.4)`}><IconBoat /></g>
      {ux > -60 && <g transform={`translate(${ux} ${uy})`}><circle r={24} fill={C.coral} stroke={C.ink} strokeWidth={4} /><rect x={-24} y={-6} width={48} height={12} fill={C.cream} /><circle r={24} fill="none" stroke={C.ink} strokeWidth={4} /><line x1={0} y1={-24} x2={0} y2={-56} stroke={C.ink} strokeWidth={5} /></g>}
    </g>
  );
};

/** the foreground pier: big posts with painted tide bands, in front of the water. It does not move; the sea rises past it. */
const POST_X = [150, 292, 434];
const Pier: React.FC<{f: number}> = ({f}) => {
  void f;
  return (
    <g>
      <rect x={POST_X[0] - 70} y={1036} width={POST_X[2] - POST_X[0] + 140} height={46} rx={6} fill={C.woodLight} stroke={C.ink} strokeWidth={5} />
      {Array.from({length: 9}).map((_, i) => <line key={i} x1={POST_X[0] - 56 + i * 48} y1={1040} x2={POST_X[0] - 56 + i * 48} y2={1080} stroke={C.woodDeep} strokeWidth={3} />)}
      {POST_X.map((x) => (
        <g key={x}>
          <rect x={x - 26} y={1080} width={52} height={1100} fill={C.woodDeep} stroke={C.ink} strokeWidth={5} />
          {[1180, 1260, 1340, 1420, 1500].map((y, k) => <rect key={y} x={x - 26} y={y} width={52} height={22} fill={k % 2 ? C.cream : C.coral} stroke={C.ink} strokeWidth={3} />)}
          <rect x={x - 32} y={1072} width={64} height={22} rx={5} fill={C.wood} stroke={C.ink} strokeWidth={4} />
        </g>
      ))}
      <path d={`M ${POST_X[0]} 1060 q 70 40 ${POST_X[1] - POST_X[0]} 0 q 70 40 ${POST_X[2] - POST_X[1]} 0`} fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
    </g>
  );
};

/** a far shore across the bay: a low headland with tiny houses, behind the horizon band */
const FarShore: React.FC = () => (
  <g>
    <path d={`M -400 1022 L -400 980 Q -250 940 -120 962 Q 20 926 140 968 Q 260 990 330 1022 Z`} fill={C.tealDeep} opacity={0.55} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
    {[[-300, 968, 40, 36], [-244, 958, 34, 30], [-170, 952, 46, 42], [-96, 956, 36, 32], [-30, 946, 44, 40], [52, 960, 36, 30]].map(([x, y, w, h], i) => (
      <g key={i}><rect x={x} y={y} width={w} height={h} fill={i % 2 ? C.cream : C.saffronLight} stroke={C.ink} strokeWidth={3} /><rect x={x - 4} y={y - 10} width={w + 8} height={12} fill={C.coralDeep} stroke={C.ink} strokeWidth={3} /></g>
    ))}
  </g>
);

export const Coast: React.FC<{f: number}> = ({f}) => {
  const w = windK(f);
  const streaks = Array.from({length: 16}).map((_, i) => {
    const y = 560 + rand(i + 40) * 640, len = 170 + rand(i + 3) * 260, v = (70 + rand(i + 9) * 50) * (0.55 + 0.45 * w);
    const x = ((rand(i + 70) * (W + 700) + (f - AIR_F) * v) % (W + 700)) - 350;
    return w > 0.05 ? <line key={i} x1={x} y1={y} x2={x - len} y2={y} stroke={C.cream} strokeWidth={6 + rand(i) * 4} strokeLinecap="round" opacity={0.7 * w} /> : null;
  });
  const impact = f >= WALL_F ? Math.exp(-(f - WALL_F) / 5) * Math.sin((f - WALL_F) * 1.9) : 0; // a small kick when the front hits the wall
  const push = 1 + 0.045 * ramp(f, T.wipe1B, T.foamB, (x) => x);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      <defs><linearGradient id="skyCoast2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.saffron} /><stop offset="1" stopColor={C.saffronLight} /></linearGradient></defs>
      <rect x={0} y={0} width={W} height={H} fill="url(#skyCoast2)" />
      <circle cx={860} cy={330} r={120} fill={C.saffron} opacity={0.55} />
      <circle cx={860} cy={330} r={80} fill={C.saffronLight} />
      <g transform={`translate(540 1300) scale(${push}) translate(-540 -1300) translate(0 ${8 * impact})`}>
        <g transform={`translate(${DX} ${DY})`}>
          <FarShore />
          <HorizonBand />
          <g transform={`translate(0 ${PROM_Y - 1150})`}>
            <Building x={760} w={560} h={700} s={STYLES[1]} />
            <Building x={1334} w={540} h={640} s={STYLES[0]} />
          </g>
          <Wall />
          <Flag f={f} />
          <Lamp />
          {PALM_X.map((x, i) => <Palm key={x} x={x} f={f} seed={i * 2.1} h={PALM_H[i]} />)}
          {JUNK.map((j, i) => (f >= j.f0 ? <Piece key={i} j={j} t={f - j.f0} /> : null))}
          <Sea f={f} />
          <Riders f={f} />
          <Pier f={f} />
        </g>
        {streaks}
        {f >= AIR_F + 2 && f < SEA_F + 20 && <Pigeon x={-120 + (f - AIR_F - 2) * 34} y={800 + Math.sin(f * 0.2) * 14 - (f - AIR_F) * 1.2} s={1.9} fly flap={f * 0.95} />}
      </g>
    </svg>
  );
};

/** two annotations only, one after the other: an east arrow on the wind (the air), an east arrow riding the front (the ocean) */
export const CoastGraphics: React.FC<{f: number}> = ({f}) => {
  const w = windK(f);
  const aIn = popScale(f, AIR_F + 6) * (1 - ramp(f, SEA_F - 4, SEA_F + 2, (x) => x));
  const palmTop = {x: PALM_X[0] + DX + PALM_H[0] * Math.sin(((4 + 34 * w) * Math.PI) / 180) + 50, y: PROM_Y + DY - PALM_H[0] - 210};
  const xf = frontX(f), ytop = terrain(xf) - crestH(f);
  const sIn = popScale(f, SEA_F + 4) * (1 - ramp(f, WALL_F + 10, WALL_F + 16, (x) => x));
  const fp = {x: Math.min(W - 160, xf + DX - 60), y: ytop + DY - 110};
  return (
    <g>
      {aIn > 0.01 && <g transform={`translate(${palmTop.x} ${palmTop.y}) scale(${aIn})`}><ArrowShape x={0} y={0} w={190} /></g>}
      {sIn > 0.01 && <g transform={`translate(${fp.x} ${fp.y}) scale(${sIn})`}><ArrowShape x={0} y={0} w={190} /></g>}
    </g>
  );
};
