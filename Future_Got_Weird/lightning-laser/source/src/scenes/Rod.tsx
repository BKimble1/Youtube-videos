// Shot L: an ordinary lightning rod, as a conceptual comparison (a separate place: a gabled house under the same
// storm). The camera follows the grounded down-conductor from its earth clamp up the wall, along the roof edge and up
// to the air terminal's metal tip. The metal never changes size; nothing marks a "protected zone".
import React from 'react';
import {Cam, Layer} from '../dc/camera';
import {mix} from '../dc/color';
import {fmt, hash, V} from '../dc/math';
import {Clouds, Rain, Ranges, Sky} from '../art/Env';

const INKR = '#0B151C';
/** the rod tip (world) and the conductor route from the ground up to it */
export const ROD_TIP: V = {x: 551, y: 872};
export const ROUTE: V[] = [
  {x: 862, y: 1760}, // earth clamp at ground level
  {x: 862, y: 1256}, // up the wall corner
  {x: 884, y: 1236}, // round the eave
  {x: 566, y: 1018}, // up the roof edge to the gable apex
  {x: 551, y: 1004}, // the mast base
  ROD_TIP,
];

export const RodWorld: React.FC<{cam: Cam; t: number; rt: number; drift: number}> = ({cam, t, rt, drift}) => {
  const flash = 0;
  const cop = '#C7834A', copL = '#F0B07A';
  const route = ROUTE.slice(0, -1).map((p, i) => `${i ? 'L' : 'M'}${fmt(p.x)},${fmt(p.y)}`).join(' ');
  return (
    <g>
      <Sky flash={flash} />
      <Ranges cam={cam} flash={flash} />
      <Clouds cam={{...cam, x: cam.x - 200}} flash={flash} drift={drift} />
      <Rain cam={cam} rt={rt} flash={flash} />
      <Layer cam={cam} depth={1}>
        {/* ground, path and a fence */}
        <path d="M-1200,1760 L2200,1760 L2200,2700 L-1200,2700 Z" fill="#26343C" />
        <path d="M-1200,1760 L2200,1760" stroke={INKR} strokeWidth={4} />
        {Array.from({length: 18}, (_, i) => (
          <line key={i} x1={-900 + i * 70} y1={1760} x2={-900 + i * 70} y2={1700} stroke="#4A5A60" strokeWidth={8} />
        ))}
        <line x1={-920} y1={1716} x2={300} y2={1716} stroke="#4A5A60" strokeWidth={6} />
        {/* the house: plastered wall with windows, a slate gable roof, chimney */}
        <path d="M240,1760 L240,1240 L862,1240 L862,1760 Z" fill="#8E8778" stroke={INKR} strokeWidth={4} />
        <path d="M240,1240 L862,1240 L862,1270 L240,1270 Z" fill="#6E685C" />
        {[[320, 1340], [560, 1340], [320, 1540], [560, 1540]].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width={120} height={130} fill={i === 1 ? '#E9B86C' : '#2C3A44'} stroke={INKR} strokeWidth={4} />
            <line x1={x + 60} y1={y} x2={x + 60} y2={y + 130} stroke={INKR} strokeWidth={3} />
            <line x1={x} y1={y + 65} x2={x + 120} y2={y + 65} stroke={INKR} strokeWidth={3} />
          </g>
        ))}
        <rect x={700} y={1560} width={100} height={200} fill="#4A3A2E" stroke={INKR} strokeWidth={4} />
        <path d="M200,1250 L551,1010 L902,1250 Z" fill="#3B4650" stroke={INKR} strokeWidth={4} strokeLinejoin="round" />
        {Array.from({length: 9}, (_, i) => (
          <path key={i} d={`M${fmt(551 - (i + 1) * 39)},${fmt(1010 + (i + 1) * 26.7)} L${fmt(551 + (i + 1) * 39)},${fmt(1010 + (i + 1) * 26.7)}`} stroke={INKR} strokeOpacity={0.35} strokeWidth={2} />
        ))}
        <rect x={360} y={1030} width={60} height={110} fill="#6B5446" stroke={INKR} strokeWidth={4} />
        <rect x={352} y={1020} width={76} height={16} fill="#5A463A" stroke={INKR} strokeWidth={3} />
        {/* the lightning protection: down-conductor (copper strip on stand-off clips), earth clamp, mast and tip */}
        <path d={route} fill="none" stroke={INKR} strokeWidth={11} strokeLinejoin="round" />
        <path d={route} fill="none" stroke={cop} strokeWidth={6} strokeLinejoin="round" />
        <path d={route} fill="none" stroke={copL} strokeWidth={2} strokeLinejoin="round" opacity={0.7} transform="translate(-1.5 0)" />
        {[1700, 1560, 1420, 1290].map((y) => <rect key={y} x={852} y={y} width={20} height={10} fill="#5A646A" stroke={INKR} strokeWidth={2} />)}
        {[0.25, 0.5, 0.75].map((u) => <rect key={u} x={fmt(884 + (566 - 884) * u - 8)} y={fmt(1236 + (1018 - 1236) * u - 5)} width={16} height={10} fill="#5A646A" stroke={INKR} strokeWidth={2} transform={`rotate(-34 ${fmt(884 + (566 - 884) * u)} ${fmt(1236 + (1018 - 1236) * u)})`} />)}
        <rect x={846} y={1722} width={32} height={26} rx={3} fill="#7A8288" stroke={INKR} strokeWidth={3} />
        <rect x={858} y={1760} width={8} height={90} fill={cop} stroke={INKR} strokeWidth={2} opacity={0.0} />
        {/* the mast bracket at the ridge end and the air terminal (a plain pointed rod) */}
        <rect x={538} y={994} width={26} height={16} fill="#5A646A" stroke={INKR} strokeWidth={3} />
        <path d={`M${ROD_TIP.x - 5},1004 L${ROD_TIP.x - 3},${ROD_TIP.y + 22} L${ROD_TIP.x},${ROD_TIP.y} L${ROD_TIP.x + 3},${ROD_TIP.y + 22} L${ROD_TIP.x + 5},1004 Z`} fill="#B6BEC4" stroke={INKR} strokeWidth={2.4} strokeLinejoin="round" />
        <path d={`M${ROD_TIP.x - 1.5},1000 L${ROD_TIP.x - 0.8},${ROD_TIP.y + 24}`} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.4} />
        {/* puddles on the ground */}
        {[0, 1, 2].map((i) => <ellipse key={i} cx={950 + i * 160 + 40 * hash(i, 7)} cy={1790 + 20 * i} rx={70} ry={8} fill={mix('#3E5260', '#6A7EA0', 0.2)} opacity={0.6} />)}
      </Layer>
    </g>
  );
};
