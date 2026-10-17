// Ground vehicles of the coordination system (side views) and its barriers.
// Hauler: autonomous heavy vehicle (~1500 × 760 at s = 1). AutoCar: generic autonomous car (~1150 long). BarrierGate:
// boom arm, rising bollards or a sliding panel. Anchors: ground point at the vehicle's centre; dir 1 faces screen right.
// Wheels turn from `dist` (world units travelled). No text, no real brands; the system mark is small.
import React from 'react';
import {SYS} from '../theme';
import {V2, clamp, lerp, rnd, f2, pt, polyPath} from '../kit/math';
import {INK, M, SensorEye, Sparks, Glow, SysMark, rrect, jag} from './common';

const Wheel: React.FC<{x: number; y: number; r: number; ang: number; ink: number}> = ({x, y, r, ang, ink}) => (
  <g transform={`translate(${f2(x)} ${f2(y)})`}>
    <circle cx={0} cy={0} r={r} fill={M.rubber} stroke={INK} strokeWidth={ink} />
    <circle cx={0} cy={0} r={r * 0.62} fill={M.frame} stroke={INK} strokeWidth={ink * 0.7} />
    <g transform={`rotate(${f2(ang)})`}>
      {[0, 72, 144, 216, 288].map((a) => <line key={a} x1={0} y1={0} x2={Math.cos((a * Math.PI) / 180) * r * 0.55} y2={Math.sin((a * Math.PI) / 180) * r * 0.55} stroke={M.hub} strokeWidth={r * 0.12} strokeLinecap="round" />)}
    </g>
    <circle cx={0} cy={0} r={r * 0.16} fill={M.hub} stroke={INK} strokeWidth={ink * 0.5} />
  </g>
);

export type HaulerProps = {x: number; y: number; s?: number; dir?: 1 | -1; t: number; dist?: number; ink?: number; seed?: number; lights?: number; lock?: number; crush?: number; sparkT0?: number; glow?: number};
/** Heavy autonomous hauler with a wedge ram. Origin: ground under the body centre. */
export const Hauler: React.FC<HaulerProps> = (p) => {
  const s = p.s ?? 1, d = p.dir ?? 1, ink = (p.ink ?? 4 * s) / s;
  const cr = clamp(p.crush ?? 0);
  const wr = 100;
  const ang = (((p.dist ?? 0) / (wr * s)) * 180) / Math.PI;
  const seed = p.seed ?? 1;
  // ram vertices crumple back and down with `crush`
  const ram: V2[] = [{x: 520, y: -440}, {x: 728 - 70 * cr, y: -330 + 20 * cr}, {x: 768 - 110 * cr, y: -46}, {x: 560, y: -46}];
  const crumple = cr > 0.05 ? jag({x: 700 - 90 * cr, y: -320}, {x: 740 - 120 * cr, y: -60}, 7, 26 * cr, seed) : [];
  const lightsOn = p.lights ?? 1;
  return (
    <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s * d)} ${f2(s)})`}>
      <ellipse cx={0} cy={4} rx={800} ry={28} fill="rgba(10,10,14,0.3)" />
      {lightsOn > 0 && <Glow x={640} y={-360} r={620} color={M.light} op={0.32 * lightsOn} id={`hg${seed}_${Math.round(p.x)}`} sx={1.6} sy={0.55} />}
      {/* chassis and wheels */}
      <rect x={-700} y={-230} width={1290} height={90} rx={20} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
      {[-520, -290, 410].map((wx) => <Wheel key={wx} x={wx} y={-wr} r={wr} ang={ang} ink={ink} />)}
      {[-520, -290, 410].map((wx) => <path key={`f${wx}`} d={`M ${wx - 128} -150 Q ${wx} -238 ${wx + 128} -150`} fill="none" stroke={M.frame} strokeWidth={22} strokeLinecap="round" />)}
      {/* armoured body */}
      <path d={polyPath([{x: -720, y: -215}, {x: -720, y: -660}, {x: -666, y: -742}, {x: 300, y: -742}, {x: 420, y: -650}, {x: 522, y: -430}, {x: 560, y: -215}])} fill={M.plate} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <path d={polyPath([{x: -720, y: -330}, {x: 542, y: -330}, {x: 560, y: -215}, {x: -720, y: -215}])} fill={M.frame} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      {[-460, -180, 100].map((sx) => <line key={sx} x1={sx} y1={-735} x2={sx} y2={-335} stroke={M.plateShade} strokeWidth={6} />)}
      <line x1={-712} y1={-560} x2={430} y2={-560} stroke={M.plateShade} strokeWidth={6} />
      <path d={rrect(-560, -450, 150, 70, 10)} fill={M.plateShade} />
      <SysMark x={-120} y={-450} r={44} opacity={0.85} />
      {/* sensor light bar and forward sensor */}
      <path d={polyPath([{x: 200, y: -742}, {x: 300, y: -742}, {x: 420, y: -650}, {x: 400, y: -636}, {x: 290, y: -724}, {x: 200, y: -724}])} fill={SYS.sensor} opacity={0.95} stroke={INK} strokeWidth={ink * 0.6} />
      <SensorEye x={470} y={-560} r={36} lock={p.lock} glow={p.glow ?? 0.5} ink={ink * 0.8} squash={0.42} id={`he${seed}_${Math.round(p.x)}`} />
      {/* headlights */}
      <path d={rrect(560, -360, 40, 54, 8)} fill={lightsOn > 0 ? M.light : M.glass} stroke={INK} strokeWidth={ink * 0.7} />
      {/* the ram */}
      <path d={polyPath(ram)} fill={M.frameDark} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <path d={`M ${pt({x: 540, y: -400})} L ${pt({x: ram[1].x - 10, y: ram[1].y + 18})}`} stroke={M.hub} strokeWidth={10} strokeLinecap="round" />
      <path d={`M ${pt({x: 566, y: -250})} L ${pt({x: ram[2].x - 12, y: -250 + 10 * cr})}`} stroke={M.frame} strokeWidth={14} strokeLinecap="round" />
      {crumple.length > 0 && <polyline points={crumple.map((q) => `${f2(q.x)},${f2(q.y)}`).join(' ')} fill="none" stroke={INK} strokeWidth={ink * 1.2} strokeLinejoin="round" />}
      {cr > 0.3 && <path d={polyPath([{x: ram[1].x - 30, y: ram[1].y + 40}, {x: ram[1].x + 20, y: ram[1].y + 70}, {x: ram[1].x - 18, y: ram[1].y + 110}])} fill={M.hub} stroke={INK} strokeWidth={ink * 0.7} />}
      {p.sparkT0 !== undefined && <Sparks t={p.t} t0={p.sparkT0} x={ram[1].x} y={-200} dir={-60} spread={120} n={26} speed={1100} life={0.8} seed={seed * 3} w={5} />}
    </g>
  );
};

const CAR_COLS = ['#6E7A86', '#8E9188', '#58626E', '#9C9080', '#7C6E66'];
export type AutoCarProps = {x: number; y: number; s?: number; dir?: 1 | -1; t: number; dist?: number; ink?: number; variant?: number; lights?: number; sensor?: number; wreck?: number; seed?: number; lock?: number};
/** A generic autonomous car (side view) with a roof sensor bar. Origin: ground under the centre. */
export const AutoCar: React.FC<AutoCarProps> = (p) => {
  const s = p.s ?? 1, d = p.dir ?? 1, ink = (p.ink ?? 4 * s) / s;
  const col = CAR_COLS[(p.variant ?? 0) % CAR_COLS.length];
  const wr = 78;
  const ang = (((p.dist ?? 0) / (wr * s)) * 180) / Math.PI;
  const wk = clamp(p.wreck ?? 0);
  const seed = p.seed ?? 1;
  const sens = p.sensor ?? 1;
  const lights = p.lights ?? 0;
  const body = polyPath([{x: -575, y: -110}, {x: -575, y: -250}, {x: -520, y: -290}, {x: -320, y: -305}, {x: -200, y: -430 + 20 * wk}, {x: 170, y: -430 + 10 * wk}, {x: 300, y: -310}, {x: 520, y: -290}, {x: 580, y: -230}, {x: 580, y: -110}]);
  return (
    <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s * d)} ${f2(s)})`}>
      <ellipse cx={0} cy={4} rx={620} ry={22} fill="rgba(10,10,14,0.28)" />
      {lights > 0 && <Glow x={590} y={-220} r={420} color={M.light} op={0.3 * lights} id={`cg${seed}_${Math.round(p.x)}`} sx={1.5} sy={0.5} />}
      <path d={body} fill={col} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <path d={polyPath([{x: -300, y: -300}, {x: -190, y: -410 + 18 * wk}, {x: -20, y: -410 + 14 * wk}, {x: -20, y: -300}])} fill={M.glass} stroke={INK} strokeWidth={ink * 0.8} />
      <path d={polyPath([{x: 10, y: -300}, {x: 10, y: -410 + 12 * wk}, {x: 160, y: -410 + 10 * wk}, {x: 270, y: -305}])} fill={M.glass} stroke={INK} strokeWidth={ink * 0.8} />
      {wk > 0.2 && <path d={`M -150 -370 L -100 -330 L -130 -310 M -100 -330 L -60 -360`} fill="none" stroke="#C9D6DD" strokeWidth={4} />}
      <line x1={-575} y1={-200} x2={580} y2={-200} stroke="rgba(0,0,0,0.18)" strokeWidth={10} />
      <line x1={-5} y1={-300} x2={-5} y2={-120} stroke="rgba(0,0,0,0.22)" strokeWidth={5} />
      {wk > 0.1 && <path d={polyPath(jag({x: 300, y: -280}, {x: 420, y: -150}, 6, 24 * wk, seed))} fill="rgba(0,0,0,0.25)" />}
      {[-370, 370].map((wx) => <g key={wx}><path d={`M ${wx - 104} -110 Q ${wx} -205 ${wx + 104} -110`} fill={M.frameDark} /><Wheel x={wx} y={-wr} r={wr} ang={ang} ink={ink} /></g>)}
      {/* roof sensor bar */}
      <path d={rrect(-15, -446, 240, 26, 10)} fill={M.frameDark} stroke={INK} strokeWidth={ink * 0.8} />
      <path d={rrect(-15, -446, 180, 9, 4)} fill={SYS.sensor} opacity={0.3 + 0.7 * sens} />
      <circle cx={95} cy={-446} r={11} fill={p.lock ? SYS.lock : SYS.sensor} opacity={0.4 + 0.6 * sens} />
      <path d={rrect(560, -240, 30, 40, 8)} fill={lights > 0 ? M.light : '#C7CDD0'} stroke={INK} strokeWidth={ink * 0.6} />
      <path d={rrect(-566, -240, 22, 40, 6)} fill={lights > 0 ? '#E0543E' : '#7A3B33'} stroke={INK} strokeWidth={ink * 0.6} />
    </g>
  );
};

export type BarrierProps = {x: number; y: number; s?: number; t: number; ink?: number; kind: 'arm' | 'bollards' | 'slide'; open?: number; up?: number; len?: number; n?: number; dir?: 1 | -1; lock?: number; seed?: number};
/** Automated barriers. 'arm': post at (x, y) with a boom of length len (open 1 = vertical, 0 = closed horizontal toward
 *  dir). 'bollards': n posts starting at x, spacing 130, rising by `up`. 'slide': a panel of width len sliding from
 *  x (open 0 = closed across [x, x+len], 1 = withdrawn). */
export const BarrierGate: React.FC<BarrierProps> = (p) => {
  const s = p.s ?? 1, ink = (p.ink ?? 4 * s) / s, d = p.dir ?? 1;
  if (p.kind === 'arm') {
    const L = p.len ?? 900;
    const a = lerp(0, -88, clamp(p.open ?? 0));
    return (
      <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s * d)} ${f2(s)})`}>
        <path d={rrect(0, -150, 110, 300, 16)} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
        <SensorEye x={0} y={-230} r={22} lock={p.lock} ink={ink * 0.7} glow={0.4} id={`bg${p.seed ?? 1}_${Math.round(p.x)}`} />
        <g transform={`translate(0 -150) rotate(${f2(a)})`}>
          <path d={rrect(L / 2, 0, L, 40, 18)} fill={M.plate} stroke={INK} strokeWidth={ink} />
          {Array.from({length: Math.floor(L / 140)}, (_, k) => <path key={k} d={rrect(80 + k * 140, 0, 50, 40, 4)} fill={M.frame} />)}
          <circle cx={0} cy={0} r={26} fill={M.joint} stroke={INK} strokeWidth={ink} />
          <circle cx={L - 20} cy={0} r={8} fill={SYS.sensor} />
        </g>
      </g>
    );
  }
  if (p.kind === 'bollards') {
    const n = p.n ?? 5;
    const up = clamp(p.up ?? 1);
    return (
      <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s)})`}>
        {Array.from({length: n}, (_, k) => {
          const h = 260 * up;
          return (
            <g key={k} transform={`translate(${k * 130} 0)`}>
              <ellipse cx={0} cy={0} rx={46} ry={12} fill={M.black} />
              {h > 2 && <path d={`M -36 0 L -36 ${-h + 20} Q -36 ${-h} 0 ${-h} Q 36 ${-h} 36 ${-h + 20} L 36 0 Z`} fill={M.plate} stroke={INK} strokeWidth={ink} />}
              {h > 60 && <rect x={-36} y={-h + 36} width={72} height={14} fill={SYS.sensor} opacity={0.85} />}
            </g>
          );
        })}
      </g>
    );
  }
  const L = p.len ?? 800;
  const o = clamp(p.open ?? 0);
  return (
    <g transform={`translate(${f2(p.x)} ${f2(p.y)}) scale(${f2(s * d)} ${f2(s)})`}>
      <rect x={-20} y={-360} width={40} height={360} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
      <g transform={`translate(${f2(-o * L)} 0)`}>
        <path d={rrect(L / 2, -180, L, 320, 14)} fill={M.plate} stroke={INK} strokeWidth={ink} />
        {Array.from({length: Math.floor(L / 60)}, (_, k) => <line key={k} x1={30 + k * 60} y1={-320} x2={30 + k * 60} y2={-40} stroke={M.plateShade} strokeWidth={8} />)}
        <rect x={10} y={-300} width={L - 20} height={12} fill={SYS.sensor} opacity={0.8} />
      </g>
      <rect x={L - 20} y={-360} width={40} height={360} fill={M.frameDark} stroke={INK} strokeWidth={ink} />
    </g>
  );
};
void rnd;
