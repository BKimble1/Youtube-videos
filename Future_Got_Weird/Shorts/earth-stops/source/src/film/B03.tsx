import React from 'react';
import {C} from '../theme';
import {E} from '../lib/motion';
import {rand} from '../lib/anim';
import {BIKE_Y, GYW} from '../v2/choreo2';
import {Puff} from '../v2/Fx2';
import {ArrowShape, Chip, cl, popScale, ramp} from './ui';
import {T, WORD, fs} from './timeline';
import {CAM_B03, toScr} from './street';

/**
 * B03: "Stop the ground, and anything that isn't fixed to it keeps going." A plaza on the same street. At f 312 (the word "Stop") every loose thing leaves with the same
 * starting speed V0 (the ground's old speed); friction then takes each one down at its own rate. Lamp post, palms and the bolted bench do not move at all.
 */
const sm = (x: number) => { const t = cl(x); return t * t * (3 - 2 * t); };
export const B3 = {fix: fs(WORD.isnt - 0.05), loose: fs(WORD.keeps - 0.05)};
export const OBJ_S = 1.5; // the loose things are drawn 1.5x so they read at phone size
export const V0 = 22; // world px per frame, the same for every loose thing
type Kind = 'chair' | 'table' | 'plant' | 'box' | 'cone' | 'ball';
type Obj = {id: string; kind: Kind; x0: number; tau: number; flip?: boolean; topple?: number; line?: number};
export const OBJS: Obj[] = [
  {id: 'chairA', kind: 'chair', x0: 1860, tau: 70},
  {id: 'table', kind: 'table', x0: 2000, tau: 55},
  {id: 'chairB', kind: 'chair', x0: 2145, tau: 45, flip: true},
  {id: 'plant', kind: 'plant', x0: 2265, tau: 36, topple: 4},
  {id: 'box', kind: 'box', x0: 1790, tau: 75, line: 22},
  {id: 'cone', kind: 'cone', x0: 2345, tau: 30, topple: 6},
  {id: 'ball', kind: 'ball', x0: 2205, tau: 90, line: -26},
];
export const objX = (o: Obj, f: number) => {
  const t = f - T.stopF;
  return t <= 0 ? o.x0 : o.x0 + V0 * o.tau * (1 - Math.exp(-t / o.tau));
};
/** frame at which a loose thing has left the screen on the right (screen x of its centre > 1170 at the plaza camera) */
export const exitFrame = (o: Obj) => { for (let f = T.stopF; f < T.stopF + 400; f++) if (540 + (objX(o, f) - CAM_B03.x) * CAM_B03.z > 1170) return f; return T.stopF + 400; };
/** the bicycle from the street (world x 520, behind the plaza line) is loose too: it keeps rolling east at the ground's old speed and crosses the plaza while the line "keeps going" is spoken */
export const BIKE3 = {x0: 520, tau: 600, y: 0};
export const bikeX3 = (f: number) => { const t = f - T.stopF; return t <= 0 ? BIKE3.x0 : BIKE3.x0 + V0 * BIKE3.tau * (1 - Math.exp(-t / BIKE3.tau)); };
export const bikeAng3 = (f: number) => ((bikeX3(f) - BIKE3.x0) / 92) * (180 / Math.PI);
export const bikeTilt3 = (f: number) => { const t = Math.max(0, f - T.stopF); return 7 * (1 - sm(t / 14)) + 1.6 * Math.sin(t * 0.35) * Math.exp(-t / 50) * (t > 0 ? 1 : 0); };
export const bikeEnter3 = () => { for (let f = T.stopF; f < T.stopF + 400; f++) if (bikeX3(f) + 190 > CAM_B03.x - 540 / CAM_B03.z) return f; return T.stopF + 400; };
export const bikeExit3 = () => { for (let f = T.stopF; f < T.stopF + 400; f++) if (bikeX3(f) - 190 > CAM_B03.x + 540 / CAM_B03.z) return f; return T.stopF + 400; };

const OL = 4;
const Chair: React.FC<{flip?: boolean}> = ({flip}) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    <path d="M -36 -66 L -40 -128 Q -40 -136 -30 -136 L -22 -136 L -20 -66" fill="none" stroke={C.ink} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M -36 -66 L -40 -128 Q -40 -136 -30 -136 L -22 -136 L -20 -66" fill="none" stroke={C.teal} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
    <rect x={-44} y={-84} width={92} height={18} rx={6} fill={C.tealDeep} stroke={C.ink} strokeWidth={OL} />
    {[-36, 36].map((x) => <line key={x} x1={x} y1={-66} x2={x + (x < 0 ? -4 : 4)} y2={0} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />)}
    {[-36, 36].map((x) => <line key={x} x1={x} y1={-66} x2={x + (x < 0 ? -4 : 4)} y2={0} stroke={C.tealDeep} strokeWidth={3.5} strokeLinecap="round" />)}
  </g>
);
const Table: React.FC = () => (
  <g>
    <ellipse cx={0} cy={-2} rx={50} ry={10} fill={C.tealDeep} stroke={C.ink} strokeWidth={OL} />
    <rect x={-8} y={-98} width={16} height={96} fill={C.tealDeep} stroke={C.ink} strokeWidth={OL} />
    <ellipse cx={0} cy={-100} rx={78} ry={15} fill={C.cream} stroke={C.ink} strokeWidth={OL} />
    <rect x={-78} y={-100} width={156} height={9} fill={C.saffronLight} stroke={C.ink} strokeWidth={OL} />
    <ellipse cx={0} cy={-91} rx={78} ry={12} fill={C.saffronLight} />
    <ellipse cx={0} cy={-100} rx={78} ry={15} fill="none" stroke={C.ink} strokeWidth={OL} />
  </g>
);
const Plant: React.FC = () => (
  <g>
    <path d="M -34 -74 L 34 -74 L 26 0 L -26 0 Z" fill={C.saffronDeep} stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
    <rect x={-40} y={-88} width={80} height={16} rx={5} fill={C.saffron} stroke={C.ink} strokeWidth={OL} />
    {[[-40, -150, C.teal], [0, -176, C.tealDeep], [40, -150, C.teal], [-22, -128, C.tealLight], [22, -128, C.tealLight]].map(([x, y, col], i) => (
      <path key={i} d={`M 0 -88 Q ${(x as number) * 0.9} ${(y as number) + 30} ${x} ${y} Q ${(x as number) * 0.2 + (i % 2 ? 14 : -14)} ${(y as number) + 40} 0 -88 Z`} fill={col as string} stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
    ))}
  </g>
);
const Box: React.FC = () => (
  <g>
    <rect x={-46} y={-76} width={92} height={76} fill={C.woodLight} stroke={C.ink} strokeWidth={OL} />
    <rect x={-8} y={-76} width={16} height={76} fill={C.cream} opacity={0.75} />
    <path d="M -46 -76 L -34 -88 L 58 -88 L 46 -76 Z" fill={C.wood} stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
    <path d="M -30 -34 h 22 M -30 -22 h 14" stroke={C.woodDeep} strokeWidth={4} strokeLinecap="round" />
  </g>
);
const Cone: React.FC = () => (
  <g>
    <rect x={-40} y={-12} width={80} height={12} rx={3} fill={C.saffronDeep} stroke={C.ink} strokeWidth={OL} />
    <path d="M -28 -12 L -9 -118 L 9 -118 L 28 -12 Z" fill={C.saffron} stroke={C.ink} strokeWidth={OL} strokeLinejoin="round" />
    <path d="M -22 -50 L 22 -50 L 18 -74 L -18 -74 Z" fill={C.cream} stroke={C.ink} strokeWidth={3} strokeLinejoin="round" />
  </g>
);
const Ball: React.FC<{ang: number}> = ({ang}) => (
  <g transform={`translate(0 -36) rotate(${ang})`}>
    <circle r={36} fill={C.cream} stroke={C.ink} strokeWidth={OL} />
    {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M 0 0 L ${36 * Math.cos((i * Math.PI) / 3)} ${36 * Math.sin((i * Math.PI) / 3)} A 36 36 0 0 1 ${36 * Math.cos(((i + 1) * Math.PI) / 3)} ${36 * Math.sin(((i + 1) * Math.PI) / 3)} Z`} fill={i % 3 === 0 ? C.teal : i % 3 === 1 ? C.saffron : C.cream} />)}
    <circle r={36} fill="none" stroke={C.ink} strokeWidth={OL} />
    <circle r={5} fill={C.ink} />
  </g>
);
const Bench: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse cx={0} cy={2} rx={110} ry={9} fill={C.shadow} />
    <rect x={-96} y={-70} width={192} height={14} rx={4} fill={C.woodLight} stroke={C.ink} strokeWidth={OL} />
    <rect x={-96} y={-120} width={192} height={36} rx={5} fill={C.wood} stroke={C.ink} strokeWidth={OL} />
    {[-80, 80].map((px) => <rect key={px} x={px - 7} y={-56} width={14} height={56} fill={C.ink} />)}
    {[-80, 80].map((px) => <g key={`b${px}`}><rect x={px - 22} y={-6} width={44} height={9} rx={3} fill={C.inkSoft} stroke={C.ink} strokeWidth={3} /><circle cx={px - 12} cy={-1.5} r={3.4} fill={C.saffronLight} stroke={C.ink} strokeWidth={1.5} /><circle cx={px + 12} cy={-1.5} r={3.4} fill={C.saffronLight} stroke={C.ink} strokeWidth={1.5} /></g>)}
  </g>
);

export const BENCH = {x: 2440, y: 1236};

/** world-space children for Street2 (the plaza). */
export const PlazaWorld: React.FC<{f: number}> = ({f}) => {
  const t = f - T.stopF;
  const items = OBJS.map((o) => {
    const x = objX(o, f);
    const dx = x - o.x0;
    let rot = 0, pivot = 0, y = 0;
    if (o.kind === 'chair') { rot = t > 0 ? 7 * Math.exp(-t / (o.tau * 1.2)) * (o.flip ? -1 : 1) + 2.2 * Math.sin(t * 0.5) * Math.exp(-t / (o.tau * 2)) : 0; }
    if (o.kind === 'table') { rot = t > 0 ? -3 * Math.exp(-t / (o.tau * 1.4)) : 0; }
    if (o.kind === 'plant') { const u = sm((t - o.topple!) / 14); rot = 86 * u; pivot = 30; }
    if (o.kind === 'cone') { const u = sm((t - o.topple!) / 16); rot = 80 * u; pivot = 32; }
    if (o.kind === 'box') { const u = 1 - Math.exp(-Math.max(0, t) / (o.tau * 0.5)); rot = 180 * u; pivot = 46; }
    const yo = o.line ?? 0;
    const g = (
      <g key={o.id} transform={`translate(${x} ${GYW + yo}) scale(${OBJ_S}) ${pivot ? `rotate(${rot} ${pivot} 0)` : `rotate(${rot})`} ${y ? `translate(0 ${y})` : ''}`}>
        <ellipse cx={0} cy={3} rx={o.kind === 'table' ? 74 : o.kind === 'box' ? 56 : 54} ry={9} fill={C.shadow} />
        {o.kind === 'chair' && <Chair flip={o.flip} />}
        {o.kind === 'table' && <Table />}
        {o.kind === 'plant' && <Plant />}
        {o.kind === 'box' && <Box />}
        {o.kind === 'cone' && <Cone />}
        {o.kind === 'ball' && <Ball ang={(dx / 36) * (180 / Math.PI)} />}
      </g>
    );
    return g;
  });
  // skid marks behind the sliders, dust at their feet, soil from the plant
  const marks = OBJS.filter((o) => o.kind === 'chair' || o.kind === 'table').map((o) => {
    const x1 = objX(o, f);
    return t > 0 ? <path key={`m${o.id}`} d={`M ${o.x0 - 20} ${GYW - 2} L ${x1 - 20} ${GYW - 2}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={0.2} /> : null;
  });
  const puffs: React.ReactNode[] = [];
  OBJS.filter((o) => o.kind !== 'ball').forEach((o, oi) => {
    for (let e = 0; e < 40; e += 5) {
      const age = t - e;
      if (age < 0 || age > 22 || e > o.tau * 2.2) continue;
      const px = objX(o, T.stopF + e) - 30, py = GYW - 14 + (o.line ?? 0);
      puffs.push(<g key={`p${o.id}${e}`} transform={`translate(${px} ${py}) scale(0.62) translate(${-px} ${-py})`}><Puff x={px} y={py} age={age} seed={oi * 13 + e} /></g>);
    }
  });
  const soil = (() => {
    const o = OBJS.find((q) => q.kind === 'plant')!;
    const u = sm((t - o.topple!) / 14);
    if (u < 0.5) return null;
    const x = objX(o, f) + 70;
    return <path d={`M ${x - 40} ${GYW + 2} q 12 -26 40 -18 q 36 -8 52 18 z`} fill="#4D3420" stroke={C.ink} strokeWidth={3} />;
  })();
  return (
    <g>
      <Bench x={BENCH.x} y={BENCH.y} />
      {marks}
      {puffs}
      {soil}
      {items}
    </g>
  );
};

export const B03Graphics: React.FC<{f: number}> = ({f}) => {
  const cam = CAM_B03;
  const fix = B3.fix, loose = B3.loose;
  const bench = toScr(BENCH.x, BENCH.y - 140, cam);
  const lamp = toScr(2240 + 90, 540, cam);
  const bp = toScr(bikeX3(f), BIKE_Y - 290, cam);
  const out = ramp(f, T.wipe1A - 6, T.wipe1A + 4);
  return (
    <g opacity={1 - out}>
      <Chip x={bench.x} y={bench.y} w={190} text="FIXED" tone="still" scale={popScale(f, fix)} />
      <Chip x={lamp.x + 30} y={lamp.y} w={190} text="FIXED" tone="still" scale={popScale(f, fix + 3)} />
      <Chip x={bp.x - 30} y={bp.y} w={236} text="LOOSE" tone="move" arrow scale={popScale(f, loose)} />
    </g>
  );
};
export {ArrowShape, E, rand};
