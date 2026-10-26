// The summit transmitter tower (site world, depth 1): concrete plinth, tapered concrete shaft, two platform rings with
// railings and dish antennas, a steel lattice mast with aviation bands, and the lightning rod whose tip is TIP. The
// storm key is cool from the left; `flash` lights the right-hand faces from the discharge above.
import React from 'react';
import {mix} from '../dc/color';
import {fmt} from '../dc/math';
import {TIP, TOWER_BASE_Y, TOWER_X} from '../world/site';

const INKT = '#0B151C';
const X = TOWER_X;

export const Tower: React.FC<{id: string; flash: number; aviation: number}> = ({id, flash, aviation}) => {
  const conc = mix('#8A97A0', '#C9D0F0', flash * 0.35);
  const concD = mix('#4E5C66', '#7E88B8', flash * 0.35);
  const lit = mix('#5A6A75', '#E4E8FF', flash);
  const shaftTop = 1040, shaftBot = TOWER_BASE_Y - 30;
  const wTop = 24, wBot = 34;
  const shaft = `M${X - wBot},${shaftBot} L${X - wTop},${shaftTop} L${X + wTop},${shaftTop} L${X + wBot},${shaftBot} Z`;
  const ring = (y: number, hw: number, h: number) => `M${X - hw},${y} Q${X},${y - h * 0.5} ${X + hw},${y} L${X + hw},${y + h} Q${X},${y + h * 1.5} ${X - hw},${y + h} Z`;
  const rail = (y: number, hw: number) => {
    const posts = Array.from({length: 9}, (_, i) => X - hw + (i * 2 * hw) / 8);
    return (
      <g stroke={INKT} strokeWidth={1.6} fill="none">
        <path d={`M${X - hw},${y - 12} Q${X},${y - 18} ${X + hw},${y - 12}`} />
        <path d={`M${X - hw},${y - 6} Q${X},${y - 11} ${X + hw},${y - 6}`} strokeWidth={1} />
        {posts.map((px, i) => (
          <line key={i} x1={fmt(px)} y1={y - 13 - 3 * (1 - Math.abs(px - X) / hw)} x2={fmt(px)} y2={y - 1 - 3 * (1 - Math.abs(px - X) / hw)} />
        ))}
      </g>
    );
  };
  // lattice mast from the shaft top to the rod base
  const mTop = 768, mBot = shaftTop;
  const legW = (y: number) => 7 + (11 * (y - mTop)) / (mBot - mTop);
  const bays = 9;
  const brace: string[] = [];
  for (let i = 0; i < bays; i++) {
    const y0 = mTop + ((mBot - mTop) * i) / bays, y1 = mTop + ((mBot - mTop) * (i + 1)) / bays;
    brace.push(`M${fmt(X - legW(y0))},${fmt(y0)} L${fmt(X + legW(y1))},${fmt(y1)} M${fmt(X + legW(y0))},${fmt(y0)} L${fmt(X - legW(y1))},${fmt(y1)} M${fmt(X - legW(y1))},${fmt(y1)} L${fmt(X + legW(y1))},${fmt(y1)}`);
  }
  const band = (i: number) => {
    const y0 = mTop + ((mBot - mTop) * i) / bays, y1 = mTop + ((mBot - mTop) * (i + 1)) / bays;
    return `M${fmt(X - legW(y0))},${fmt(y0)} L${fmt(X + legW(y0))},${fmt(y0)} L${fmt(X + legW(y1))},${fmt(y1)} L${fmt(X - legW(y1))},${fmt(y1)} Z`;
  };
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sh`} gradientUnits="userSpaceOnUse" x1={X - wBot} y1="0" x2={X + wBot} y2="0">
          <stop offset="0" stopColor={concD} />
          <stop offset="0.35" stopColor={conc} />
          <stop offset="0.75" stopColor={mix(conc, concD, 0.5)} />
          <stop offset="1" stopColor={mix(concD, lit, 0.6)} />
        </linearGradient>
        <linearGradient id={`${id}-rg`} gradientUnits="userSpaceOnUse" x1={X - 80} y1="0" x2={X + 80} y2="0">
          <stop offset="0" stopColor={concD} />
          <stop offset="0.4" stopColor={mix(conc, '#FFFFFF', 0.12)} />
          <stop offset="0.8" stopColor={concD} />
          <stop offset="1" stopColor={mix(concD, lit, 0.7)} />
        </linearGradient>
      </defs>
      {/* plinth with a service door */}
      <path d={`M${X - 52},${TOWER_BASE_Y + 2} L${X - 46},${TOWER_BASE_Y - 34} L${X + 46},${TOWER_BASE_Y - 34} L${X + 52},${TOWER_BASE_Y + 2} Z`} fill={concD} stroke={INKT} strokeWidth={2.2} strokeLinejoin="round" />
      <rect x={X - 12} y={TOWER_BASE_Y - 30} width={20} height={28} fill="#1C262E" stroke={INKT} strokeWidth={1.4} />
      {/* shaft */}
      <path d={shaft} fill={`url(#${id}-sh)`} stroke={INKT} strokeWidth={2.4} strokeLinejoin="round" />
      {[1300, 1220, 1110].map((y) => (
        <line key={y} x1={X - wBot + ((shaftBot - y) * (wBot - wTop)) / (shaftBot - shaftTop)} y1={y} x2={X + wBot - ((shaftBot - y) * (wBot - wTop)) / (shaftBot - shaftTop)} y2={y} stroke={INKT} strokeOpacity={0.35} strokeWidth={1.2} />
      ))}
      {/* small lit windows of the equipment rooms */}
      {[1270, 1240].map((y, i) => (
        <rect key={y} x={X - 6 + i * 4} y={y} width={7} height={9} fill={mix('#E9C27A', '#FFFFFF', flash * 0.3)} opacity={0.85} />
      ))}
      {/* lower platform ring with dishes */}
      <path d={ring(1160, 74, 20)} fill={`url(#${id}-rg)`} stroke={INKT} strokeWidth={2.2} strokeLinejoin="round" />
      {rail(1160, 74)}
      <g stroke={INKT} strokeWidth={1.8}>
        <path d={`M${X - 70},1188 Q${X - 92},1204 ${X - 86},1232 Q${X - 66},1222 ${X - 70},1188 Z`} fill={mix('#B9C3CA', '#E8ECFF', flash * 0.4)} />
        <path d={`M${X + 66},1190 Q${X + 90},1200 ${X + 88},1226 Q${X + 68},1222 ${X + 66},1190 Z`} fill={mix('#9AA6AF', '#F2F4FF', flash * 0.7)} />
      </g>
      {/* upper platform ring */}
      <path d={ring(1050, 58, 16)} fill={`url(#${id}-rg)`} stroke={INKT} strokeWidth={2.2} strokeLinejoin="round" />
      {rail(1050, 58)}
      {/* lattice mast: aviation bands (red/white) behind the steel members */}
      {Array.from({length: bays}, (_, i) => (
        <path key={i} d={band(i)} fill={i % 2 === 0 ? mix('#B73A33', '#FF8A80', flash * 0.4) : mix('#D9DDE0', '#FFFFFF', flash * 0.4)} opacity={0.85} />
      ))}
      <path d={brace.join(' ')} fill="none" stroke={INKT} strokeWidth={1.5} />
      <path d={`M${X - legW(mBot)},${mBot} L${X - legW(mTop)},${mTop} M${X + legW(mBot)},${mBot} L${X + legW(mTop)},${mTop}`} stroke={INKT} strokeWidth={2.6} fill="none" />
      <path d={`M${X + legW(mBot) - 1},${mBot} L${X + legW(mTop) - 1},${mTop}`} stroke={lit} strokeOpacity={0.7 * flash} strokeWidth={1.4} fill="none" />
      {/* mast cap, aviation light and the lightning rod */}
      <rect x={X - 10} y={mTop - 6} width={20} height={8} fill={concD} stroke={INKT} strokeWidth={1.6} />
      <circle cx={X + 9} cy={mTop - 2} r={3.2} fill="#FF4A3C" opacity={0.4 + 0.6 * aviation} />
      <circle cx={X + 9} cy={mTop - 2} r={9} fill="#FF4A3C" opacity={0.22 * aviation} />
      <path d={`M${X - 2.4},${mTop - 6} L${X - 1.2},${TIP.y + 10} L${X},${TIP.y} L${X + 1.2},${TIP.y + 10} L${X + 2.4},${mTop - 6} Z`} fill={mix('#9DA9B1', '#FFFFFF', flash * 0.7)} stroke={INKT} strokeWidth={1.1} strokeLinejoin="round" />
    </g>
  );
};
