// V4 café interior (one room, one light): a sage back wall over a wood dado, a tall window at the left that is the key
// light (upper-left, like the cast's), a back bar with an espresso machine and a pastry case, shelves with cups and
// jars, a chalkboard menu, pendant lamps, a plant and a plank floor. Drawn in the crew's soft finish: gradient
// fills and thin muted contours. World units = screen px at camera z = 1; the floor line where the furniture stands
// is y = FLOOR. Everything is static except the lamp glow and the steam in props (pure functions of f).
import React from 'react';
import {lit, mix, shade} from '../../lib/color';
import {INK} from '../../lib/ink';
import {fmt} from '../../lib/math';
import {Glow, Lin, SoftShadow} from '../../lib/shade';
import {rr} from './Props';

export const FLOOR = 1390;
export const WALL_BASE = 1150;
const OL = {stroke: INK, strokeOpacity: 0.5, strokeWidth: 3, strokeLinejoin: 'round' as const};

export const PALETTE = {
  wall: '#B5CFB6',
  wallDeep: '#8FB397',
  dado: '#C99A6A',
  floor: '#D9B88C',
  floorDeep: '#B68E5E',
  counter: '#8D5B3A',
  counterTop: '#EFE3CF',
  shelf: '#D8A877',
  lamp: '#FFC744',
};

const Cups: React.FC<{id: string; x: number; y: number; n: number; gap?: number; color?: string; s?: number}> = ({id, x, y, n, gap = 46, color = '#FFFFFF', s = 1}) => (
  <g>
    {Array.from({length: n}, (_, i) => {
      const cx = x + i * gap * s;
      return (
        <g key={i}>
          <path d={`M${fmt(cx - 17 * s)},${fmt(y - 28 * s)} L${fmt(cx + 17 * s)},${fmt(y - 28 * s)} Q${fmt(cx + 15 * s)},${fmt(y)} ${fmt(cx + 8 * s)},${fmt(y)} L${fmt(cx - 8 * s)},${fmt(y)} Q${fmt(cx - 15 * s)},${fmt(y)} ${fmt(cx - 17 * s)},${fmt(y - 28 * s)} Z`} fill={i % 3 === 1 ? '#EF6B55' : color} {...OL} strokeWidth={2.4} />
          <path d={`M${fmt(cx - 12 * s)},${fmt(y - 24 * s)} L${fmt(cx - 9 * s)},${fmt(y - 6 * s)}`} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
        </g>
      );
    })}
  </g>
);

const Jar: React.FC<{x: number; y: number; w: number; h: number; c: string}> = ({x, y, w, h, c}) => (
  <g>
    <path d={rr(x, y - h, w, h, 8)} fill={c} fillOpacity={0.6} {...OL} strokeWidth={2.4} />
    <path d={rr(x + 3, y - h - 10, w - 6, 12, 4)} fill="#7B6A58" {...OL} strokeWidth={2.4} />
    <path d={`M${fmt(x + 8)},${fmt(y - h + 10)} L${fmt(x + 8)},${fmt(y - 12)}`} stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round" opacity={0.6} />
  </g>
);

export const InteriorBack: React.FC<{f: number; glow?: number}> = ({f, glow = 1}) => {
  const P = PALETTE;
  const flick = 1 + 0.03 * Math.sin(f * 0.21);
  return (
    <g>
      {/* wall */}
      <Lin id="iw-wall" d={`M-200,-200 H1300 V${WALL_BASE} H-200 Z`} from={{x: 0, y: 0}} to={{x: 0, y: WALL_BASE}} stops={[[0, lit(P.wall, 0.22)], [0.6, P.wall], [1, shade(P.wall, 0.16)]]} />
      {/* soft wall panels */}
      {[300, 560, 820].map((x, i) => (
        <path key={i} d={rr(x, 130, 200, 760, 14)} fill="none" stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={6} />
      ))}
      {/* dado: wood wainscot with a rail */}
      <Lin id="iw-dado" d={`M-200,${WALL_BASE - 210} H1300 V${WALL_BASE + 6} H-200 Z`} from={{x: 0, y: WALL_BASE - 210}} to={{x: 0, y: WALL_BASE}} stops={[[0, lit(P.dado, 0.18)], [1, shade(P.dado, 0.2)]]} />
      <rect x={-200} y={WALL_BASE - 216} width={1500} height={16} fill={lit(P.dado, 0.35)} {...OL} />
      {Array.from({length: 14}, (_, i) => (
        <path key={i} d={`M${fmt(i * 90 - 20)},${WALL_BASE - 198} V${WALL_BASE}`} stroke={INK} strokeOpacity={0.12} strokeWidth={3} />
      ))}

      {/* window (left): the key light */}
      <g>
        <path d={rr(20, 250, 290, 640, 12)} fill="#FFFFFF" {...OL} />
        <Lin id="iw-sky" d={rr(42, 272, 246, 596, 6)} from={{x: 0, y: 272}} to={{x: 0, y: 868}} stops={[[0, '#9ED4EE'], [0.62, '#CDEBF7'], [1, '#EAF6E8']]} />
        {/* trees and a street glimpse seen through the glass */}
        <g clipPath="url(#iw-clip)">
          <circle cx={90} cy={700} r={96} fill="#8FBF86" opacity={0.9} />
          <circle cx={210} cy={660} r={118} fill="#7FB07A" opacity={0.9} />
          <rect x={42} y={760} width={246} height={108} fill="#CFC9B8" />
          <rect x={42} y={760} width={246} height={10} fill="#B7B09E" />
          <path d="M60,812 H270" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="26 22" opacity={0.7} />
          <path d="M42,272 H288 V430 Q165,380 42,430 Z" fill="#FFFFFF" opacity={0.12} />
        </g>
        <clipPath id="iw-clip">
          <path d={rr(42, 272, 246, 596, 6)} />
        </clipPath>
        <path d="M165,272 V868 M42,520 H288" stroke="#FFFFFF" strokeWidth={14} />
        <path d="M165,272 V868 M42,520 H288" stroke={INK} strokeOpacity={0.35} strokeWidth={2.4} />
        <path d={rr(42, 272, 246, 596, 6)} fill="none" {...OL} />
        {/* sill */}
        <path d={rr(2, 882, 330, 26, 8)} fill={lit(P.dado, 0.3)} {...OL} />
        {/* a little plant on the sill */}
        <path d="M70,882 q-6,-34 -28,-52 q26,0 34,40 q4,-44 30,-62 q-6,46 -12,74 Z" fill="#5F9A5C" {...OL} strokeWidth={2.4} />
        <path d={rr(60, 868, 44, 18, 4)} fill="#EF6B55" {...OL} strokeWidth={2.4} />
        {/* the light from the window: a soft warm fall on the wall and floor (the key light is upper-left) */}
        <Glow id="iw-sun" c={{x: 360, y: 640}} r={520} ry={760} color="#FFF3D2" alpha={0.28 * glow} />
      </g>

      {/* chalkboard menu */}
      <g>
        <path d={rr(380, 140, 300, 170, 10)} fill="#3C4B52" {...OL} strokeWidth={4} />
        <path d={rr(390, 150, 280, 150, 6)} fill="#2F3D43" />
        <text x={400} y={206} fontFamily="'Fredoka Variable', sans-serif" fontWeight={600} fontSize={44} fill="#F4EFE3" opacity={0.92}>COFFEE</text>
        <path d="M400,236 H600 M400,262 H570 M400,288 H620" stroke="#F4EFE3" strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" strokeDasharray="30 12" />
        <circle cx={632} cy={246} r={20} fill="none" stroke="#FFC744" strokeWidth={5} />
        <path d="M632,226 v-18 M622,232 l-12,-10" stroke="#FFC744" strokeWidth={4} strokeLinecap="round" />
      </g>

      {/* shelves with cups and jars */}
      <g>
        {[0, 1].map((r) => {
          const y = 440 + r * 170;
          return (
            <g key={r}>
              <path d={rr(720, y, 330, 14, 5)} fill={lit(P.shelf, 0.2)} {...OL} />
              <path d={`M740,${y + 14} l-6,24 M1030,${y + 14} l6,24`} stroke={INK} strokeOpacity={0.4} strokeWidth={4} strokeLinecap="round" />
            </g>
          );
        })}
        <Cups id="c1" x={750} y={440} n={5} gap={50} />
        <Jar x={1010} y={440} w={36} h={64} c="#F2B66B" />
        <Jar x={968} y={440} w={34} h={50} c="#B58A6A" />
        <Cups id="c2" x={760} y={610} n={3} gap={60} color="#F4EFE3" />
        <Jar x={950} y={610} w={38} h={70} c="#E28C7A" />
        <Jar x={1000} y={610} w={40} h={58} c="#A9C9A0" />
        {/* a framed picture */}
        <path d={rr(470, 360, 130, 100, 8)} fill="#F4EFE3" {...OL} />
        <path d={rr(480, 370, 110, 80, 4)} fill="#B9DCEA" />
        <path d="M480,436 l30,-34 l24,24 l22,-18 l34,28 V450 H480 Z" fill="#8FBF86" />
        <circle cx={560} cy={394} r={10} fill="#FFC744" />
      </g>

      {/* pendant lamps */}
      {[330, 760, 1000].map((x, i) => (
        <g key={i}>
          <path d={`M${x},-20 V${150 + (i % 2) * 20}`} stroke={INK} strokeOpacity={0.6} strokeWidth={4} />
          <path d={`M${x - 52},${230 + (i % 2) * 20} Q${x - 46},${160 + (i % 2) * 20} ${x},${152 + (i % 2) * 20} Q${x + 46},${160 + (i % 2) * 20} ${x + 52},${230 + (i % 2) * 20} Z`} fill={P.lamp} {...OL} strokeWidth={3.4} />
          <ellipse cx={x} cy={230 + (i % 2) * 20} rx={52} ry={9} fill="#FFF4C8" {...OL} strokeWidth={2.4} />
          <Glow id={`iw-lg${i}`} c={{x, y: 250 + (i % 2) * 20}} r={150 * flick} ry={120 * flick} color="#FFE7A0" alpha={0.55 * glow} />
        </g>
      ))}

      {/* back bar */}
      <g>
        <Lin id="iw-bar" d={rr(400, 830, 680, 330, 6)} from={{x: 0, y: 830}} to={{x: 0, y: 1160}} stops={[[0, lit(P.counter, 0.12)], [1, shade(P.counter, 0.3)]]} />
        <path d={rr(400, 830, 680, 330, 6)} fill="none" {...OL} strokeWidth={4} />
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={rr(420 + i * 130, 880, 112, 240, 8)} fill="none" stroke="#FFFFFF" strokeOpacity={0.14} strokeWidth={5} />
        ))}
        <path d={rr(388, 806, 704, 34, 10)} fill={P.counterTop} {...OL} strokeWidth={4} />
        <ellipse cx={560} cy={812} rx={140} ry={5} fill="#FFFFFF" opacity={0.5} />
        {/* espresso machine */}
        <path d={rr(468, 704, 170, 104, 14)} fill="#C9D3DA" {...OL} strokeWidth={4} />
        <path d={rr(468, 704, 170, 40, 14)} fill="#EF6B55" {...OL} strokeWidth={4} />
        <path d={rr(486, 760, 134, 34, 6)} fill="#6C7A86" opacity={0.6} />
        <path d="M512,744 v26 M553,744 v26 M594,744 v26" stroke="#5E6F7E" strokeWidth={9} strokeLinecap="round" />
        <circle cx={500} cy={724} r={9} fill="#FFFFFF" {...OL} strokeWidth={2.4} />
        <circle cx={606} cy={724} r={9} fill="#FFFFFF" {...OL} strokeWidth={2.4} />
        {/* pastry case */}
        <path d={rr(840, 724, 200, 84, 12)} fill="#DFF1FA" fillOpacity={0.55} {...OL} strokeWidth={4} />
        <path d={rr(852, 770, 176, 30, 6)} fill="#E8B87D" {...OL} strokeWidth={2.4} />
        {[868, 910, 952, 994].map((x, i) => (
          <ellipse key={i} cx={x} cy={754} rx={19} ry={12} fill={['#F2B66B', '#E28C7A', '#F4EFE3', '#B58A6A'][i]} {...OL} strokeWidth={2.4} />
        ))}
        <path d="M850,732 l64,-6" stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.5} />
      </g>

      {/* plant, right */}
      <g>
        <path d={rr(1012, 1030, 96, 120, 14)} fill="#E28C7A" {...OL} strokeWidth={4} />
        {[[-40, -150, 40], [-14, -190, 30], [18, -180, 36], [46, -140, 36], [4, -120, 28]].map(([dx, dy, w], i) => (
          <path key={i} d={`M1060,1034 Q${1060 + dx * 0.4},${1034 + dy * 0.5} ${1060 + dx},${1034 + dy} Q${1060 + dx + w},${1034 + dy * 0.6} 1060,1034 Z`} fill={['#5F9A5C', '#6FB06B', '#4E8A52'][i % 3]} {...OL} strokeWidth={3} />
        ))}
      </g>
      {/* floor skirting shadow */}
      <rect x={-200} y={WALL_BASE} width={1500} height={14} fill="#6B4A32" opacity={0.35} />
    </g>
  );
};

export const InteriorFloor: React.FC = () => {
  const P = PALETTE;
  return (
    <g>
      <Lin id="if-floor" d={`M-200,${WALL_BASE + 6} H1300 V2200 H-200 Z`} from={{x: 0, y: WALL_BASE}} to={{x: 0, y: 1920}} stops={[[0, shade(P.floor, 0.12)], [0.35, P.floor], [1, lit(P.floor, 0.12)]]} />
      {/* planks: receding lines toward the back wall */}
      {Array.from({length: 18}, (_, i) => {
        const x = -200 + i * 90;
        return <path key={i} d={`M${fmt(x)},${WALL_BASE + 6} L${fmt(540 + (x - 540) * 1.9)},2200`} stroke={shade(P.floor, 0.4)} strokeOpacity={0.35} strokeWidth={3} />;
      })}
      {[1250, 1330, 1450, 1620, 1860].map((y, i) => (
        <path key={i} d={`M-200,${y} H1300`} stroke={shade(P.floor, 0.4)} strokeOpacity={0.22} strokeWidth={3} />
      ))}
      {/* the window's light on the floor */}
      <path d="M40,1170 L360,1170 L640,1900 L-120,1900 Z" fill="#FFF3D2" opacity={0.18} />
      <SoftShadow id="if-sh" c={{x: 540, y: FLOOR + 10}} rx={520} ry={34} alpha={0.12} />
    </g>
  );
};

void mix;
