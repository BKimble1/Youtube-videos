// The test bay: a full-height glass wall in an aluminium frame, set in a tall, quiet engineering hall. The hall is a
// parallax layer behind the wall (seen through the glass, cooler and lighter; seen beside it, plain); the wall, its
// frame and the floor are in the world plane (world/geo.ts projection). Light comes from the upper left, as for the
// cast. Restrained reflections only: soft diagonal sheens, a bright edge on each mullion, no mirrored figure.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {Inked} from '../dc/ink';
import {fmt, P, V} from '../dc/math';
import {Lin, SoftShadow} from '../dc/shade';
import {CM, FLOOR, KY, pr} from '../world/geo';

const poly = (pts: V[]) => `M${pts.map((p) => P(p)).join(" L")} Z`;
void poly; void pr; void SoftShadow; void KY; void mix;

export const GLASS_TOP = -3000;
export const GLASS_Z = 1450;
/** mullions (z), a panel per 2.2 m: the climber works the panel between -350 and 350 */
export const MULLIONS = [-1400, -700, 0, 700, 1400].map((z) => z - 350).filter((z) => Math.abs(z) <= GLASS_Z);

const HALL = {wall: '#6F818D', wallHi: '#9AAAB4', column: '#3F5361', beam: '#D99A3A', light: '#FFE6B8'};

/** the hall behind everything, drawn at parallax depth 2.4 (its vertical layout is set for what the bay's cameras see
 *  at that depth: its floor meets the world floor's horizon at about y = 1100): a tall engineering
 *  hall with daylight from high windows (upper left, the key light's side), steel portal columns, a warm crane girder */
export const Hall: React.FC<{id: string}> = ({id}) => (
  <g>
    <Lin id={`${id}-w`} d="M-5000,-2600 H6000 V1900 H-5000 Z" from={{x: 0, y: -1200}} to={{x: 0, y: 1050}} stops={[[0, '#56697A'], [0.45, HALL.wall], [0.8, HALL.wallHi], [1, '#B4C0C6']]} />
    {/* high clerestory windows and the soft daylight they throw down the wall */}
    {[-3300, -2000, -700, 600, 1900, 3200].map((x, i) => (
      <g key={i}>
        <path d={`M${x - 380},-1250 H${x + 380} V-650 H${x - 380} Z`} fill="#CFE4EE" opacity={0.9} />
        <path d={`M${x},-1250 V-650 M${x - 380},-950 H${x + 380}`} stroke="#47596A" strokeWidth={26} />
        <path d={`M${x - 380},-650 L${x + 380},-650 L${x + 900},1050 L${x - 100},1050 Z`} fill="#F4F8FA" opacity={0.07} />
      </g>
    ))}
    {/* portal columns: a lit flange toward the windows, a shadowed web */}
    {[-3950, -2650, -1350, -50, 1250, 2550, 3850].map((x, i) => (
      <g key={i}>
        <path d={`M${x - 85},-2600 H${x + 85} V1100 H${x - 85} Z`} fill={HALL.column} />
        <path d={`M${x - 85},-2600 H${x - 50} V1100 H${x - 85} Z`} fill="#7E93A1" />
        <path d={`M${x + 50},-2600 H${x + 85} V1100 H${x + 50} Z`} fill="#2C3B46" />
        <path d={`M${x - 85},-550 H${x + 85} V-530 H${x - 85} Z`} fill="#2C3B46" />
      </g>
    ))}
    {/* the crane girder (warm accent) with its rail */}
    <path d="M-5000,-530 H6000 V-450 H-5000 Z" fill={HALL.beam} />
    <path d="M-5000,-530 H6000 V-518 H-5000 Z" fill="#F2C47A" />
    <path d="M-5000,-450 H6000 V-436 H-5000 Z" fill="#8C5E22" />
    {[-4700, -4100, -3500, -2900, -2300, -1700, -1100, -500, 100, 700, 1300, 1900, 2500, 3100, 3700, 4300, 4900].map((x, i) => (
      <path key={i} d={`M${x},-518 L${x + 300},-450 M${x + 300},-518 L${x},-450`} stroke="#B07A2C" strokeWidth={14} opacity={0.7} />
    ))}
    {/* pendant lights */}
    {[-2900, -1600, -300, 1000, 2300, 3600].map((x, i) => (
      <g key={i}>
        <path d={`M${x},-436 V-225`} stroke="#26323A" strokeWidth={9} />
        <path d={`M${x - 80},-225 H${x + 80} L${x + 52},-198 H${x - 52} Z`} fill="#26323A" />
        <ellipse cx={x} cy={-195} rx={52} ry={11} fill={HALL.light} />
        <path d={`M${x - 52},-195 L${x + 52},-195 L${x + 260},150 L${x - 260},150 Z`} fill={HALL.light} opacity={0.05} />
      </g>
    ))}
    {/* low wall: a dado band, safety stripe, benches and racks */}
    <path d="M-5000,670 H6000 V1100 H-5000 Z" fill="#5A6C78" />
    <path d="M-5000,665 H6000 V680 H-5000 Z" fill="#E7B54A" opacity={0.8} />
    {[-3600, -2300, -1000, 1500, 2800, 4100].map((x, i) => (
      <g key={i} opacity={0.85}>
        <path d={`M${x - 300},400 H${x + 300} V412 H${x - 300} Z M${x - 300},540 H${x + 300} V552 H${x - 300} Z`} fill="#33424C" />
        <path d={`M${x - 290},412 V680 M${x + 290},412 V680`} stroke="#33424C" strokeWidth={18} />
        {[0, 1, 2, 3].map((k) => (
          <path key={k} d={`M${x - 250 + k * 135},${412 - 35 - ((k * 37 + i * 11) % 30)} h85 V412 h-85 Z`} fill={['#9C7350', '#6E8C99', '#B29C68', '#7B8F6E'][(k + i) % 4]} />
        ))}
      </g>
    ))}
  </g>
);

/** the glass wall in section: a tall slab of laminated glass (drawn 7 cm thick so it reads) between the climber's side
 *  (x > 0) and the far side. Glass reads from its green-tinted edge, its two lit faces, faint inner sheens and the
 *  clamps at each panel joint; the far side is seen through it (BeyondTint). `y0`/`y1` limit the drawn height. */
export const GT = 7 * CM;
export const GlassWall: React.FC<{id: string; k: number; y0?: number; y1?: number}> = ({id, k, y0 = GLASS_TOP, y1 = FLOOR}) => {
  const slab = `M${-GT},${y0} H0 V${y1} H${-GT} Z`;
  return (
    <g>
      <Lin id={`${id}-sl`} d={slab} from={{x: -GT, y: 0}} to={{x: 0, y: 0}} stops={[[0, '#7FC7BE', 0.75], [0.18, '#BFE8E4', 0.45], [0.5, '#E2F6F5', 0.3], [0.82, '#BFE8E4', 0.45], [1, '#86CCC3', 0.75]]} />
      {/* the laminate interlayer, a faint line down the middle */}
      <path d={`M${-GT / 2},${y0} V${y1}`} stroke="#6FB7AE" strokeWidth={fmt(1.6 * k)} opacity={0.35} />
      {/* soft sheens running down inside the slab */}
      {[-2700, -2050, -1500, -820, -300].map((y, i) => (
        <path key={i} d={`M${-GT * 0.82},${y} L${-GT * 0.2},${y - 420} L${-GT * 0.2},${y - 330} L${-GT * 0.82},${y + 90} Z`} fill="#FFFFFF" opacity={[0.35, 0.2, 0.3, 0.22, 0.3][i]} />
      ))}
      {/* both faces: an ink edge, and beside it the bright line of the lit face */}
      <path d={`M${-GT},${y0} V${y1} M0,${y0} V${y1}`} stroke="#1F4A50" strokeWidth={fmt(2.6 * k)} opacity={0.9} />
      <path d={`M${-GT + 3.5 * k},${y0} V${y1}`} stroke="#FFFFFF" strokeWidth={fmt(3 * k)} opacity={0.8} />
      <path d={`M${-3.2 * k},${y0} V${y1}`} stroke="#F2FBFB" strokeWidth={fmt(2 * k)} opacity={0.6} />
      {/* clamps at the panel joints */}
      {[-1520, -3040].filter((y) => y > y0 - 100).map((y, i) => (
        <g key={i}>
          <path d={`M${-GT},${y} H0`} stroke="#1F4A50" strokeWidth={fmt(2 * k)} opacity={0.6} />
          <Inked w={3 * k}>
            <Lin id={`${id}-tr${i}`} d={`M${-GT - 24},${y - 34} H${24} V${y + 34} H${-GT - 24} Z`} from={{x: 0, y: y - 34}} to={{x: 0, y: y + 34}} stops={[[0, '#E3E9ED'], [0.5, '#B8C4CC'], [1, '#8C9AA4']]} />
          </Inked>
          {[-1, 1].map((d) => (
            <circle key={d} cx={d < 0 ? -GT - 12 : 12} cy={y} r={6} fill="#6E7D87" />
          ))}
        </g>
      ))}
      {/* base channel */}
      <Inked w={3 * k}>
        <Lin id={`${id}-bc`} d={`M${-GT - 30},${y1 - 64} H${30} V${y1} H${-GT - 30} Z`} from={{x: 0, y: y1 - 64}} to={{x: 0, y: y1}} stops={[[0, '#D3DBE0'], [1, '#7F8E98']]} />
      </Inked>
    </g>
  );
};

/** the far side of the glass: the hall seen through it, a little cooler and paler */
export const BeyondTint: React.FC<{id: string}> = ({id}) => (
  <Lin id={id} d={`M-6000,${GLASS_TOP - 3000} H${-GT} V3000 H-6000 Z`} from={{x: -GT, y: 0}} to={{x: -1500, y: 0}} stops={[[0, '#D6F2F2', 0.5], [0.25, '#C4EAEC', 0.3], [1, '#C4EAEC', 0.24]]} />
);

/** the floor: pale polished concrete seen just above its plane (the glass's base reflects in it), with a dark rubber
 *  mat along the foot of the wall on the climber's side */
export const Floor: React.FC<{id: string; k: number}> = ({id, k}) => (
  <g>
    <Lin id={`${id}-fl`} d={`M-6000,${FLOOR - 2} H6000 V${FLOOR + 3000} H-6000 Z`} from={{x: 0, y: FLOOR}} to={{x: 0, y: FLOOR + 800}} stops={[[0, '#8C979D'], [0.2, '#AEB8BC'], [1, '#C9D0D2']]} />
    {[70, 190, 360, 600].map((y, i) => (
      <path key={i} d={`M-6000,${FLOOR + y} H6000`} stroke="#7D888E" strokeWidth={fmt((2 + i) * k)} opacity={0.3} />
    ))}
    <path d={`M${-GT},${FLOOR} H0 L40,${FLOOR + 200} H${-GT - 40} Z`} fill="#BFE8E4" opacity={0.25} />
    <path d={`M30,${FLOOR - 1} H950 L1120,${FLOOR + 160} H50 Z`} fill="#3A4247" opacity={0.92} />
    <path d={`M30,${FLOOR} H950`} stroke="#5E686F" strokeWidth={fmt(3 * k)} opacity={0.8} />
  </g>
);

