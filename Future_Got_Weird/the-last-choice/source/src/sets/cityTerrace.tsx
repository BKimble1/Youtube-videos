// Terrace — the raised stone terrace (top y = −700) where the subway exit stairs come up and the Crew assembles,
// looking east over the avenue. Draw TerraceBack, then the figures, then TerraceFront (front balustrade and the south
// wall face, which also hides figures still inside the exit stair). Stairs at the east end lead down to the street.
//   x0 … x1 (default 4500 … 5650); exit stair opening at xs … xs + 640 (default 4640); top y = −700.
import React from 'react';
import {f2, range, polyPath, INK, K} from './cityKit';

export const TERRACE_TOP = -700;
const STEPS = 15;
/** Foot point climbing the exit stair (u 0 deep … 1 on the terrace). The stair rises toward +x. */
export const terraceClimb = (xs: number, u: number) => {
  const k = Math.max(0, Math.min(1, u));
  return {x: xs + 60 + 560 * k, y: TERRACE_TOP + 520 * (1 - k)};
};
/** Step i (0 = top) of the east stairs down to the street: the top surface point of that step. */
export const terraceStairStep = (x1: number, i: number) => ({x: x1 + 30 + (i + 0.5) * (720 / STEPS), y: TERRACE_TOP + ((i + 1) * 700) / STEPS});
export const TERRACE_STAIR_N = STEPS;

const Balusters: React.FC<{x0: number; x1: number; y: number; ink: number; h?: number}> = ({x0, x1, y, ink, h = 250}) => {
  const n = Math.max(2, Math.floor((x1 - x0) / 90));
  return (
    <g>
      <rect x={x0} y={y - 40} width={x1 - x0} height={40} fill={K.limestoneDark} stroke={INK} strokeWidth={ink * 0.8} />
      {range(n).map((i) => {
        const bx = x0 + ((i + 0.5) * (x1 - x0)) / n;
        return <path key={i} d={`M ${f2(bx - 16)} ${f2(y - 40)} Q ${f2(bx - 34)} ${f2(y - 100)} ${f2(bx - 12)} ${f2(y - 150)} L ${f2(bx - 18)} ${f2(y - h + 40)} L ${f2(bx + 18)} ${f2(y - h + 40)} L ${f2(bx + 12)} ${f2(y - 150)} Q ${f2(bx + 34)} ${f2(y - 100)} ${f2(bx + 16)} ${f2(y - 40)} Z`} fill={K.limestone} stroke={INK} strokeWidth={ink * 0.6} />;
      })}
      <rect x={x0 - 20} y={y - h} width={x1 - x0 + 40} height={44} rx={8} fill={K.stoneLight} stroke={INK} strokeWidth={ink} />
      <rect x={x0 - 30} y={y - h - 8} width={70} height={h + 8} fill={K.stoneLight} stroke={INK} strokeWidth={ink} />
      <rect x={x1 - 40} y={y - h - 8} width={70} height={h + 8} fill={K.stoneLight} stroke={INK} strokeWidth={ink} />
    </g>
  );
};

export const TerraceBack: React.FC<{x0?: number; x1?: number; xs?: number; ink?: number}> = ({x0 = 4500, x1 = 5650, xs = 4640, ink = 6}) => (
  <g>
    {/* the terrace mass behind the top edge and the far (north) balustrade */}
    <rect x={x0} y={TERRACE_TOP - 30} width={x1 - x0} height={30} fill={K.stone2} stroke={INK} strokeWidth={ink} />
    <g opacity={0.92}><Balusters x0={x0 + 20} x1={x1 - 20} y={TERRACE_TOP - 30} ink={ink} h={230} /></g>
    {/* exit stair opening: dark well with rising steps and a handrail */}
    <rect x={xs} y={TERRACE_TOP - 26} width={640} height={26} fill="#0E0A0C" stroke={INK} strokeWidth={ink * 0.8} />
    <path d={`M ${f2(xs + 20)} ${f2(TERRACE_TOP - 260)} L ${f2(xs + 620)} ${f2(TERRACE_TOP - 260)}`} stroke={K.steelDark} strokeWidth={ink * 2.2} strokeLinecap="round" />
    {[xs + 30, xs + 320, xs + 610].map((px, i) => <rect key={i} x={px - 9} y={TERRACE_TOP - 262} width={18} height={236} fill={K.steelDark} stroke={INK} strokeWidth={ink * 0.4} />)}
    {/* east stairs down to the street */}
    <path d={polyPath([{x: x1, y: TERRACE_TOP}, ...range(STEPS).flatMap((i) => [{x: x1 + 30 + (i * 720) / STEPS, y: TERRACE_TOP + (i * 700) / STEPS}, {x: x1 + 30 + (i * 720) / STEPS, y: TERRACE_TOP + ((i + 1) * 700) / STEPS}]), {x: x1 + 760, y: 0}, {x: x1, y: 0}])} fill={K.stone2} stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
    <path d={`M ${f2(x1 + 20)} ${f2(TERRACE_TOP - 240)} L ${f2(x1 + 760)} ${f2(-240)}`} stroke={K.steelDark} strokeWidth={ink * 2.2} strokeLinecap="round" />
    {[0.1, 0.5, 0.9].map((u, i) => <line key={i} x1={x1 + 30 + 720 * u} y1={TERRACE_TOP + 700 * u} x2={x1 + 30 + 720 * u} y2={TERRACE_TOP + 700 * u - 240} stroke={K.steelDark} strokeWidth={ink * 1.4} />)}
  </g>
);

export const TerraceFront: React.FC<{x0?: number; x1?: number; xs?: number; ink?: number; balustrade?: boolean}> = ({x0 = 4500, x1 = 5650, xs = 4640, ink = 6, balustrade = true}) => {
  const blocks: React.ReactElement[] = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < Math.ceil((x1 - x0) / 300) + 1; c++) {
    const bx = x0 + c * 300 - (r % 2 ? 150 : 0);
    if (bx >= x1) continue;
    const bw = Math.min(300, x1 - Math.max(bx, x0));
    blocks.push(<rect key={`${r}_${c}`} x={Math.max(bx, x0)} y={TERRACE_TOP + 40 + r * 165} width={bw} height={165} fill="none" stroke={K.limestoneDark} strokeWidth={ink * 0.5} />);
  }
  return (
    <g>
      <rect x={x0} y={TERRACE_TOP} width={x1 - x0} height={-TERRACE_TOP} fill={K.limestone} stroke={INK} strokeWidth={ink} />
      <rect x={x0 - 20} y={TERRACE_TOP} width={x1 - x0 + 40} height={44} fill={K.stoneLight} stroke={INK} strokeWidth={ink} />
      {blocks}
      {/* front balustrade, open over the exit stair so the climbers' heads stay visible */}
      {balustrade && <Balusters x0={x0 + 20} x1={xs - 30} y={TERRACE_TOP} ink={ink} />}
      {balustrade && <Balusters x0={xs + 700} x1={x1 - 20} y={TERRACE_TOP} ink={ink} />}
    </g>
  );
};
