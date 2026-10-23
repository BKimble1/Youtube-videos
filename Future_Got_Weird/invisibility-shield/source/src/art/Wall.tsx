// The demonstration wall: a bright painted plank wall with horizontal joints, a teal painted band and a coral
// pinstripe at shoulder height, a dado rail, a pale wainscot, a skirting board and a warm wood floor. Horizontal
// structure dominates (the shield's vertical lenses keep horizontal lines and smear vertical ones). A few vertical
// landmarks (staggered plank ends, a conduit pipe at the left, a socket and a light switch) stay outside the panel
// most of the time, so the viewer can see what the panel does to them when it passes in front.
// Drawn in world pixels. `dx` shifts the wall layer only (parallax when the camera moves off the frontal line).
import React from 'react';
import {fmt, hash} from '../lib/math';
import {GROUND, WALL} from '../world';

export const WC = {
  wall: '#F5EEDC', wallLight: '#FBF7EC', joint: '#DDD0B2', jointHi: '#FFFFFF',
  band: '#1CA7A0', bandDeep: '#127A75', bandLight: '#5CC7BF', pin: '#EF6B55',
  rail: '#FFFDF6', railShade: '#D9CCAE', wains: '#D9E7DA', wainsJoint: '#B8CDB9',
  skirt: '#FFFDF6', floor: '#D7B086', floorDeep: '#B98E62', floorLine: '#A97F55',
  pipe: '#C9D2D6', pipeDeep: '#8E9BA2', metal: '#E8ECEE',
};

const X0 = -700, X1 = 1800, Y0 = -500;

export const Wall: React.FC<{id: string; dx?: number; floor?: boolean}> = ({id, dx = 0, floor = true}) => {
  const rows: React.ReactNode[] = [];
  // upper wall planks: horizontal joints with staggered plank ends
  for (let k = 0, y = WALL.band[0] - 7 * WALL.plank; y < WALL.dado; k++, y += WALL.plank) {
    if (y >= WALL.band[0] - 2 && y <= WALL.pin[1] + 2) continue;
    rows.push(<rect key={`j${k}`} x={X0} y={fmt(y - 1)} width={X1 - X0} height={2.2} fill={WC.joint} />);
    rows.push(<rect key={`h${k}`} x={X0} y={fmt(y + 1.2)} width={X1 - X0} height={1.6} fill={WC.jointHi} opacity={0.8} />);
    // plank ends (vertical joints) in this row
    for (let i = 0; i < 6; i++) {
      const x = X0 + ((hash(k * 7 + i, 3) * 0.6 + i * 0.4) * (X1 - X0)) / 2.4 + (k % 2) * 260;
      const yy = y + 1;
      if (yy + WALL.plank > WALL.band[0] && yy < WALL.pin[1]) continue;
      rows.push(<rect key={`v${k}-${i}`} x={fmt(x)} y={fmt(yy)} width={2.2} height={WALL.plank - 2} fill={WC.joint} />);
    }
  }
  // wainscot boards (wider, horizontal)
  const wains: React.ReactNode[] = [];
  for (let k = 0, y = WALL.dado + 26 + 64; y < WALL.skirt; k++, y += 64) {
    wains.push(<rect key={`w${k}`} x={X0} y={fmt(y - 1)} width={X1 - X0} height={2.2} fill={WC.wainsJoint} />);
    wains.push(<rect key={`wh${k}`} x={X0} y={fmt(y + 1.2)} width={X1 - X0} height={1.4} fill="#F2F8F2" opacity={0.8} />);
  }
  // floor boards run toward the wall: seams converge on a vanishing point above the floor line
  const vp = {x: 540, y: 420};
  const seams: React.ReactNode[] = [];
  for (let i = -16; i <= 16; i++) {
    const xg = 540 + i * 92;
    const t = (2600 - vp.y) / (GROUND - vp.y);
    const xb = vp.x + (xg - vp.x) * t;
    seams.push(<line key={`s${i}`} x1={fmt(xg)} y1={GROUND} x2={fmt(xb)} y2={2600} stroke={WC.floorLine} strokeWidth={2.2} opacity={0.5} />);
  }
  const cross: React.ReactNode[] = [];
  for (let k = 1; k < 9; k++) {
    const y = GROUND + 16 * k * k * 0.9;
    cross.push(<line key={`c${k}`} x1={X0} y1={fmt(y)} x2={X1} y2={fmt(y)} stroke={WC.floorLine} strokeWidth={1.4} opacity={0.18} />);
  }
  return (
    <g transform={dx ? `translate(${fmt(dx)} 0)` : undefined}>
      <defs>
        <linearGradient id={`${id}-wg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={WC.wallLight} />
          <stop offset="0.6" stopColor={WC.wall} />
          <stop offset="1" stopColor="#EADFC6" />
        </linearGradient>
        <linearGradient id={`${id}-fg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={WC.floorDeep} />
          <stop offset="0.25" stopColor={WC.floor} />
          <stop offset="1" stopColor="#E2BE95" />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="0.22" cy="0.12" r="0.9">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={X0} y={Y0} width={X1 - X0} height={WALL.dado - Y0} fill={`url(#${id}-wg)`} />
      {rows}
      {/* painted band and pinstripe */}
      <rect x={X0} y={WALL.band[0]} width={X1 - X0} height={WALL.band[1] - WALL.band[0]} fill={WC.band} />
      <rect x={X0} y={WALL.band[0]} width={X1 - X0} height={4} fill={WC.bandLight} />
      <rect x={X0} y={WALL.band[1] - 4} width={X1 - X0} height={4} fill={WC.bandDeep} />
      <rect x={X0} y={WALL.pin[0]} width={X1 - X0} height={WALL.pin[1] - WALL.pin[0]} fill={WC.pin} />
      {/* wainscot */}
      <rect x={X0} y={WALL.dado} width={X1 - X0} height={WALL.skirt - WALL.dado} fill={WC.wains} />
      {wains}
      {/* dado rail: a rounded moulding with its shadow on the wainscot */}
      <rect x={X0} y={WALL.dado + 22} width={X1 - X0} height={10} fill="#8FA592" opacity={0.25} />
      <rect x={X0} y={WALL.dado} width={X1 - X0} height={24} fill={WC.rail} />
      <rect x={X0} y={WALL.dado + 17} width={X1 - X0} height={7} fill={WC.railShade} />
      <rect x={X0} y={WALL.dado + 3} width={X1 - X0} height={4} fill="#FFFFFF" />
      {/* skirting */}
      <rect x={X0} y={WALL.skirt - 6} width={X1 - X0} height={8} fill="#9DB09F" opacity={0.3} />
      <rect x={X0} y={WALL.skirt} width={X1 - X0} height={GROUND - WALL.skirt} fill={WC.skirt} />
      <rect x={X0} y={WALL.skirt + 3} width={X1 - X0} height={4} fill="#FFFFFF" />
      <rect x={X0} y={GROUND - 7} width={X1 - X0} height={7} fill={WC.railShade} />
      {/* conduit pipe at the left with two clips */}
      <g>
        <rect x={WALL.pipeX - 13} y={Y0} width={26} height={GROUND - Y0} fill={WC.pipe} />
        <rect x={WALL.pipeX - 13} y={Y0} width={7} height={GROUND - Y0} fill="#EEF2F3" />
        <rect x={WALL.pipeX + 6} y={Y0} width={7} height={GROUND - Y0} fill={WC.pipeDeep} />
        <rect x={WALL.pipeX + 14} y={Y0} width={8} height={GROUND - Y0} fill="#B7AA8B" opacity={0.25} />
        {[300, 1060].map((y) => (
          <g key={y}>
            <rect x={WALL.pipeX - 22} y={y} width={44} height={18} rx={5} fill={WC.metal} stroke={WC.pipeDeep} strokeWidth={2} />
            <circle cx={WALL.pipeX} cy={y + 9} r={3} fill={WC.pipeDeep} />
          </g>
        ))}
      </g>
      {/* light switch and double socket */}
      <g>
        <rect x={WALL.switchP.x - 30} y={WALL.switchP.y - 44} width={60} height={88} rx={9} fill="#FFFFFF" stroke="#CDBF9F" strokeWidth={2.5} />
        <rect x={WALL.switchP.x - 11} y={WALL.switchP.y - 22} width={22} height={44} rx={5} fill="#EFEAE0" stroke="#BFB291" strokeWidth={2} />
        <rect x={WALL.outlet.x - 70} y={WALL.outlet.y - 36} width={140} height={72} rx={10} fill="#FFFFFF" stroke="#A9BCA9" strokeWidth={2.5} />
        {[-34, 34].map((o) => (
          <g key={o}>
            <rect x={WALL.outlet.x + o - 6} y={WALL.outlet.y - 14} width={4} height={14} rx={2} fill="#6F7F72" />
            <rect x={WALL.outlet.x + o + 4} y={WALL.outlet.y - 14} width={4} height={14} rx={2} fill="#6F7F72" />
            <circle cx={WALL.outlet.x + o + 1} cy={WALL.outlet.y + 12} r={4} fill="#6F7F72" />
          </g>
        ))}
      </g>
      {/* soft key light from the upper left */}
      <rect x={X0} y={Y0} width={X1 - X0} height={GROUND - Y0} fill={`url(#${id}-light)`} />
      {floor && (
        <g>
          <rect x={X0} y={GROUND} width={X1 - X0} height={2600 - GROUND} fill={`url(#${id}-fg)`} />
          {seams}
          {cross}
          <rect x={X0} y={GROUND} width={X1 - X0} height={30} fill="#5A3E24" opacity={0.18} />
        </g>
      )}
    </g>
  );
};
