// Toy props, each drawn once in local coordinates. Positions and sizes come from theme.ts.
import React from 'react';
import {C, APPLE, HANDPROP, KNIFE, F} from '../theme';

export const ToyApple: React.FC = () => {
  const {x, y, r} = APPLE;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={4} cy={r - 2} rx={r * 0.95} ry={11} fill="#05080F" opacity={0.55} />
      <path
        d={`M 0 ${-r * 0.72} C ${r * 0.5} ${-r * 1.08} ${r * 1.08} ${-r * 0.7} ${r * 0.98} ${-r * 0.02} C ${r * 0.92} ${r * 0.62} ${r * 0.48} ${r * 1.0} 0 ${r * 0.92} C ${-r * 0.48} ${r * 1.0} ${-r * 0.92} ${r * 0.62} ${-r * 0.98} ${-r * 0.02} C ${-r * 1.08} ${-r * 0.7} ${-r * 0.5} ${-r * 1.08} 0 ${-r * 0.72} Z`}
        fill={C.apple}
        stroke={C.appleDark}
        strokeWidth={3}
      />
      {/* shading and a soft plastic highlight */}
      <path d={`M ${r * 0.55} ${-r * 0.55} C ${r * 1.0} ${-r * 0.2} ${r * 0.85} ${r * 0.7} ${r * 0.1} ${r * 0.88} C ${r * 0.6} ${r * 0.5} ${r * 0.75} ${0} ${r * 0.55} ${-r * 0.55} Z`} fill={C.appleDark} opacity={0.45} />
      <ellipse cx={-r * 0.42} cy={-r * 0.32} rx={r * 0.17} ry={r * 0.28} fill={C.appleLight} opacity={0.75} transform={`rotate(25 ${-r * 0.42} ${-r * 0.32})`} />
      {/* molded parting line */}
      <path d={`M 0 ${-r * 0.7} C ${-r * 0.12} ${-r * 0.1} ${-r * 0.1} ${r * 0.5} 0 ${r * 0.9}`} stroke={C.appleDark} strokeWidth={1.6} fill="none" opacity={0.7} />
      <path d={`M 0 ${-r * 0.7} Q 3 ${-r * 1.02} 10 ${APPLE.stemTop - y}`} stroke={C.stem} strokeWidth={6} strokeLinecap="round" fill="none" />
      <path d={`M 4 ${-r * 0.86} C 18 ${-r * 1.18} 42 ${-r * 1.1} 48 ${-r * 0.98} C 36 ${-r * 0.82} 16 ${-r * 0.8} 4 ${-r * 0.86} Z`} fill={C.leaf} />
    </g>
  );
};

// Manufactured teaching prop: five fingers, a molded parting line, a flat wrist termination on a support block.
export const ModelHand: React.FC = () => {
  const finger = (y0: number, x1: number, w: number, tilt: number) => (
    <g transform={`rotate(${tilt} -46 ${y0})`}>
      <rect x={x1} y={y0 - w / 2} width={-46 - x1 + 10} height={w} rx={w / 2} fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      <path d={`M ${x1 + (-46 - x1) * 0.42} ${y0 - w / 2 + 3} q -3 ${w / 2 - 3} 0 ${w - 6}`} stroke={C.handDark} strokeWidth={1.6} fill="none" opacity={0.6} />
      <path d={`M ${x1 + (-46 - x1) * 0.72} ${y0 - w / 2 + 3} q -3 ${w / 2 - 3} 0 ${w - 6}`} stroke={C.handDark} strokeWidth={1.6} fill="none" opacity={0.6} />
    </g>
  );
  return (
    <g transform={`translate(${HANDPROP.x} ${HANDPROP.y}) scale(${HANDPROP.scale})`}>
      <ellipse cx={0} cy={50} rx={150} ry={14} fill="#05080F" opacity={0.5} />
      {/* support block under the flat wrist end */}
      <rect x={96} y={10} width={70} height={52} rx={8} fill={C.slate2} stroke="#3A4B66" strokeWidth={2} />
      <rect x={96} y={52} width={70} height={10} rx={4} fill="#1A2436" />
      <text x={131} y={46} textAnchor="middle" fontFamily={F.mono} fontSize={13} fontWeight={700} fill="#55698A" letterSpacing={1}>PROP</text>
      {/* wrist, flat termination */}
      <path d="M 40 -38 L 140 -31 L 140 31 L 40 38 Z" fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      <ellipse cx={140} cy={0} rx={10} ry={31} fill={C.handLight} stroke={C.handDark} strokeWidth={2.5} />
      <ellipse cx={140} cy={0} rx={4} ry={12} fill="none" stroke={C.handDark} strokeWidth={1.5} opacity={0.6} />
      {finger(-33, -118, 19, 4)}
      {finger(-12, -142, 22, 1)}
      {finger(9, -150, 23, -1)}
      {finger(29, -136, 22, -4)}
      {/* thumb */}
      <g transform="rotate(32 -20 36)">
        <rect x={-92} y={25} width={84} height={24} rx={12} fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      </g>
      {/* palm */}
      <path d="M -56 -40 C -20 -48 30 -46 52 -38 C 64 -14 64 16 52 40 C 20 48 -26 50 -56 40 C -66 14 -66 -14 -56 -40 Z" fill={C.hand} stroke={C.handDark} strokeWidth={2.5} />
      <path d="M -50 -20 C -10 -30 30 -28 48 -22" stroke={C.handLight} strokeWidth={6} strokeLinecap="round" fill="none" opacity={0.55} />
      {/* molded seam: circumferential near the wrist end and a parting line along the back of the hand */}
      <path d="M 118 -32.5 L 118 32.5" stroke={C.handDark} strokeWidth={2} />
      <path d="M 140 -2 L 52 -2 C 20 -2 -20 4 -48 8 L -150 9" stroke={C.handDark} strokeWidth={1.4} fill="none" opacity={0.75} />
      {[-14, 6, 26].map((yy) => (
        <path key={yy} d={`M -44 ${yy - 6} q -6 6 0 12`} stroke={C.handDark} strokeWidth={1.6} fill="none" opacity={0.55} />
      ))}
    </g>
  );
};

// Toy knife in the gripper frame (origin = jaw centre, +x = handle direction u, +y = gripper axis v).
export const ToyKnife: React.FC<{sweep?: number}> = ({sweep}) => {
  const {handleBack, handleFront, bladeLen, edgeV, handleH} = KNIFE;
  const tip = handleFront - bladeLen;
  const blade = `M ${handleFront} -12 L ${tip + 40} -12 Q ${tip - 2} -10 ${tip - 4} ${edgeV - 7} Q ${tip - 5} ${edgeV} ${tip + 6} ${edgeV} L ${handleFront} ${edgeV} Z`;
  return (
    <g>
      <defs>
        <clipPath id="fgwht-blade-clip">
          <path d={blade} />
        </clipPath>
        <linearGradient id="fgwht-sweep" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#FFF6E2" stopOpacity={0} />
          <stop offset="0.5" stopColor="#FFF6E2" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFF6E2" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={blade} fill={C.blade} stroke={C.bladeDark} strokeWidth={2.5} strokeLinejoin="round" />
      <path d={`M ${handleFront - 4} ${edgeV - 5} L ${tip + 10} ${edgeV - 5}`} stroke={C.bladeDark} strokeWidth={1.6} opacity={0.6} />
      {sweep !== undefined && sweep > 0 && sweep < 1 && (
        <rect x={tip - 40 + (bladeLen + 120) * sweep - 40} y={-20} width={60} height={44} fill="url(#fgwht-sweep)" clipPath="url(#fgwht-blade-clip)" />
      )}
      <rect x={handleFront - 2} y={-handleH / 2} width={handleBack - handleFront + 2} height={handleH} rx={handleH / 2} fill={C.handle} stroke={C.handleDark} strokeWidth={2.5} />
      <rect x={handleFront + 8} y={-handleH / 2 + 4} width={handleBack - handleFront - 20} height={4} rx={2} fill="#6CC28A" opacity={0.6} />
    </g>
  );
};
