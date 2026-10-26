// V2 environments, drawn as layered vector planes for the 2.5D camera (Runway output could not be brought into this
// environment; see production/V2_CHANGE_QA.md). Same palette and line as the V1 set: warm cream, muted teal, wood,
// one ink contour. Each setting has a far plane (wall, window, shelves) and a near plane (bench / desk / table) so the
// camera's parallax reads; `veil` softens the far plane for close-ups (a depth-of-field stand-in, no blur filter).
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK} from '../dc/ink';
import {fmt} from '../dc/math';
import {LPAL} from '../art/Lab';

export const EP = {
  wall: '#EDE4D0',
  wallWarm: '#F1E2C6',
  teal: '#8FB3AD',
  tealDeep: '#5F8A86',
  sky: '#CFE3EA',
  skyHi: '#EEF5F2',
  wood: LPAL.wood,
  woodTop: LPAL.woodTop,
  woodDeep: LPAL.woodDeep,
  metal: '#9AA4AE',
  dark: '#2B333C',
  foam: '#3E5B66',
  paper: '#FBF7EE',
};
const Veil: React.FC<{k?: number; color?: string}> = ({k = 0, color = '#F3EBDB'}) => (k > 0.001 ? <rect x={-6000} y={-6000} width={12000} height={12000} fill={color} opacity={k} /> : null);

/** a window with daylight: frame, mullions, sky gradient, a soft light shaft onto the wall */
export const Window: React.FC<{id: string; x: number; y: number; w: number; h: number; shaft?: number}> = ({id, x, y, w, h, shaft = 1}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1={y} x2="0" y2={y + h} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={EP.sky} />
        <stop offset="1" stopColor={EP.skyHi} />
      </linearGradient>
      <linearGradient id={`${id}-sh`} x1={x} y1={y} x2={x + w * 1.6} y2={y + h * 2.2} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFF6DD" stopOpacity={0.45 * shaft} />
        <stop offset="1" stopColor="#FFF6DD" stopOpacity={0} />
      </linearGradient>
    </defs>
    <path d={`M${x},${y + h} L${x + w},${y + h} L${x + w * 2.1},${y + h * 2.6} L${x + w * 0.6},${y + h * 2.6} Z`} fill={`url(#${id}-sh)`} />
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={6} fill={EP.paper} stroke={INK} strokeWidth={3} />
    <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} stroke={INK} strokeWidth={2} />
    {/* distant rooftops and a tree, very pale */}
    <path d={`M${x},${y + h * 0.78} L${x + w * 0.2},${y + h * 0.78} L${x + w * 0.2},${y + h * 0.62} L${x + w * 0.42},${y + h * 0.62} L${x + w * 0.42},${y + h * 0.7} L${x + w * 0.7},${y + h * 0.7} L${x + w * 0.7},${y + h * 0.55} L${x + w * 0.82},${y + h * 0.55} L${x + w * 0.82},${y + h * 0.74} L${x + w},${y + h * 0.74} L${x + w},${y + h} L${x},${y + h} Z`} fill="#B9CFD3" />
    <ellipse cx={x + w * 0.3} cy={y + h * 0.6} rx={w * 0.12} ry={h * 0.14} fill="#A7C4B4" />
    <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke={EP.paper} strokeWidth={10} />
    <line x1={x} y1={y + h * 0.45} x2={x + w} y2={y + h * 0.45} stroke={EP.paper} strokeWidth={10} />
    <rect x={x - 22} y={y + h + 10} width={w + 44} height={14} rx={3} fill={EP.paper} stroke={INK} strokeWidth={2.5} />
  </g>
);

const Box: React.FC<{x: number; y: number; w: number; h: number; c: string; r?: number}> = ({x, y, w, h, c, r = 4}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={r} fill={c} stroke={INK} strokeWidth={2.2} />
    <rect x={x + 3} y={y + 3} width={w - 6} height={Math.min(10, h * 0.2)} rx={2} fill={lit(c, 0.25)} opacity={0.7} />
  </g>
);

/** tall open shelving with lab things: binders, boxes, a spool of wire, a spare servo tray, a small test rig */
export const Shelving: React.FC<{x: number; y: number; w?: number; h?: number}> = ({x, y, w = 420, h = 620}) => {
  const rows = 4;
  const rh = h / rows;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={shade(EP.wall, 0.12)} />
      {Array.from({length: rows + 1}, (_, i) => (
        <rect key={i} x={x - 8} y={y + i * rh - 7} width={w + 16} height={14} fill={EP.woodDeep} stroke={INK} strokeWidth={2} />
      ))}
      <rect x={x - 10} y={y - 10} width={14} height={h + 20} fill={EP.metal} stroke={INK} strokeWidth={2} />
      <rect x={x + w - 4} y={y - 10} width={14} height={h + 20} fill={EP.metal} stroke={INK} strokeWidth={2} />
      {/* row 1: binders */}
      {['#5E8CA8', '#D97B5F', '#6FA387', '#E6B85C', '#8C7BB5', '#5E8CA8'].map((c, i) => (
        <rect key={i} x={x + 20 + i * 30} y={y + 18 + (i % 3) * 5} width={26} height={rh - 30 - (i % 3) * 5} rx={2} fill={c} stroke={INK} strokeWidth={2} />
      ))}
      <Box x={x + 230} y={y + 40} w={150} h={rh - 52} c="#C9B79B" />
      {/* row 2: a spool, a parts tray with servos */}
      <circle cx={x + 80} cy={y + rh + rh * 0.55} r={rh * 0.36} fill="#C25B4E" stroke={INK} strokeWidth={2.4} />
      <circle cx={x + 80} cy={y + rh + rh * 0.55} r={rh * 0.14} fill={EP.paper} stroke={INK} strokeWidth={2} />
      <Box x={x + 160} y={y + rh + rh * 0.45} w={220} h={rh * 0.45} c="#D8DEE3" />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x + 175 + i * 40} y={y + rh + rh * 0.36} width={28} height={20} rx={3} fill="#59627E" stroke={INK} strokeWidth={1.6} />
      ))}
      {/* row 3: a small test head (a bare frame) and a box */}
      <ellipse cx={x + 110} cy={y + 2 * rh + rh * 0.5} rx={48} ry={58} fill="none" stroke="#8B96A3" strokeWidth={6} />
      <ellipse cx={x + 110} cy={y + 2 * rh + rh * 0.5} rx={48} ry={58} fill="none" stroke={INK} strokeWidth={1.5} />
      <line x1={x + 110} y1={y + 2 * rh + rh * 0.5 - 58} x2={x + 110} y2={y + 2 * rh + rh * 0.5 + 58} stroke="#8B96A3" strokeWidth={5} />
      <rect x={x + 96} y={y + 3 * rh - 24} width={28} height={18} fill={EP.dark} />
      <Box x={x + 220} y={y + 2 * rh + 30} w={170} h={rh - 42} c="#9FB8B3" />
      {/* row 4: storage bins */}
      {[0, 1, 2].map((i) => (
        <Box key={i} x={x + 18 + i * 132} y={y + 3 * rh + 26} w={118} h={rh - 36} c={['#E6D7B8', '#DCC9A6', '#E6D7B8'][i]} />
      ))}
    </g>
  );
};

/** pegboard with outlined tools */
export const Pegboard: React.FC<{x: number; y: number; w?: number; h?: number}> = ({x, y, w = 360, h = 240}) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={6} fill="#D9C7A2" stroke={INK} strokeWidth={3} />
    {Array.from({length: Math.floor(w / 24) * Math.floor(h / 24)}, (_, i) => (
      <circle key={i} cx={x + 14 + (i % Math.floor(w / 24)) * 24} cy={y + 14 + Math.floor(i / Math.floor(w / 24)) * 24} r={2.4} fill="#A9946E" />
    ))}
    <path d={`M${x + 50},${y + 40} l0,120 M${x + 40},${y + 40} l20,0`} stroke={EP.dark} strokeWidth={8} strokeLinecap="round" />
    <path d={`M${x + 110},${y + 50} l40,110`} stroke="#C25B4E" strokeWidth={10} strokeLinecap="round" />
    <circle cx={x + 230} cy={y + 90} r={34} fill="none" stroke={EP.dark} strokeWidth={8} />
    <path d={`M${x + 300},${y + 40} l0,130`} stroke={EP.metal} strokeWidth={12} strokeLinecap="round" />
  </g>
);

/** the lab (setting A): window, shelving, pegboard, a back bench with equipment; main bench drawn by the caller */
export const LabBack: React.FC<{id: string; veil?: number; x0?: number; x1?: number; top?: number; wainsY?: number; floorY?: number}> = ({id, veil = 0, x0 = -1400, x1 = 3400, top = -700, wainsY = 600, floorY = 1500}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1={top} x2="0" y2={wainsY} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={shade(EP.wall, 0.1)} />
        <stop offset="1" stopColor={lit(EP.wall, 0.08)} />
      </linearGradient>
    </defs>
    <rect x={x0} y={top} width={x1 - x0} height={wainsY - top} fill={`url(#${id}-w)`} />
    <rect x={x0} y={wainsY} width={x1 - x0} height={floorY - wainsY} fill={EP.teal} />
    <rect x={x0} y={wainsY - 10} width={x1 - x0} height={16} fill={EP.paper} />
    {Array.from({length: Math.ceil((x1 - x0) / 260)}, (_, i) => (
      <rect key={i} x={x0 + 30 + i * 260} y={wainsY + 34} width={200} height={floorY - wainsY - 70} rx={6} fill="none" stroke={shade(EP.teal, 0.2)} strokeWidth={3} opacity={0.6} />
    ))}
    <rect x={x0} y={top + 60} width={x1 - x0} height={22} fill="#C4CACF" />
    <Window id={`${id}-win`} x={-420} y={-260} w={520} h={420} />
    <Shelving x={1760} y={-330} />
    <Pegboard x={760} y={-240} />
    {/* a back bench with a 3D printer box and a lamp */}
    <rect x={560} y={470} width={760} height={18} fill={EP.woodDeep} stroke={INK} strokeWidth={2} />
    <Box x={640} y={360} w={150} h={110} c="#D8DEE3" />
    <rect x={660} y={380} width={110} height={60} fill="#2B333C" opacity={0.85} />
    <path d={`M1180,470 l0,-110 l60,-40`} fill="none" stroke={EP.dark} strokeWidth={8} strokeLinecap="round" />
    <path d={`M1222,312 l50,-10 l10,40 Z`} fill="#E6B85C" stroke={INK} strokeWidth={2} />
    <Veil k={veil} />
  </g>
);

/** the recording alcove (setting B): acoustic panels on a teal wall, a task lamp, a mic stand; the desk is separate */
export const AlcoveBack: React.FC<{id: string; veil?: number; lamp?: number}> = ({id, veil = 0, lamp = 1}) => (
  <g>
    <defs>
      <radialGradient id={`${id}-lamp`} cx={1380} cy={560} r={700} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#FFE9B8" stopOpacity={0.55 * lamp} />
        <stop offset="1" stopColor="#FFE9B8" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#56767B" />
    {/* acoustic panels: wedge-foam squares in a frame */}
    {Array.from({length: 6}, (_, c) =>
      Array.from({length: 4}, (_, r) => {
        const x = 120 + c * 230;
        const y = -260 + r * 200;
        return (
          <g key={`${c}-${r}`}>
            <rect x={x} y={y} width={210} height={180} fill={EP.foam} stroke={INK} strokeWidth={2} />
            {Array.from({length: 4}, (_, k) => (
              <rect key={k} x={x + 8} y={y + 8 + k * 42} width={194} height={22} fill={(r + c + k) % 2 ? shade(EP.foam, 0.25) : lit(EP.foam, 0.1)} />
            ))}
          </g>
        );
      }),
    )}
    <rect x={-1400} y={560} width={4800} height={1200} fill="#4A666B" />
    {/* a coiled cable on a hook and a framed plain poster */}
    <circle cx={-160} cy={-60} r={60} fill="none" stroke={EP.dark} strokeWidth={9} />
    <rect x={1560} y={-220} width={260} height={320} rx={6} fill="#E6D7B8" stroke={INK} strokeWidth={3} />
    <ellipse cx={1690} cy={-80} rx={70} ry={86} fill="none" stroke="#8C7BB5" strokeWidth={4} />
    <path d={`M1650,-40 q40,26 80,0`} fill="none" stroke="#8C7BB5" strokeWidth={4} />
    <rect x={-1400} y={-800} width={4800} height={2400} fill={`url(#${id}-lamp)`} />
    <Veil k={veil} color="#3E5A5F" />
  </g>
);

/** a mic stand with a pop filter (alcove) */
export const MicStand: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <path d="M0,0 L0,-300 L-120,-380" fill="none" stroke={EP.dark} strokeWidth={10} strokeLinecap="round" />
    <path d="M-60,0 L60,0" stroke={EP.dark} strokeWidth={12} strokeLinecap="round" />
    <rect x={-150} y={-420} width={44} height={80} rx={22} fill="#59627E" stroke={INK} strokeWidth={3} transform="rotate(-30 -128 -380)" />
    <circle cx={-190} cy={-400} r={52} fill="#2B333C" opacity={0.25} stroke={INK} strokeWidth={3} />
    <circle cx={-190} cy={-400} r={44} fill="none" stroke="#7A838C" strokeWidth={1.5} strokeDasharray="3 3" />
  </g>
);

/** a desk task lamp */
export const TaskLamp: React.FC<{x: number; y: number; s?: number; on?: number}> = ({x, y, s = 1, on = 1}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <ellipse cx={0} cy={0} rx={60} ry={14} fill={EP.dark} stroke={INK} strokeWidth={2.5} />
    <path d="M0,0 L-30,-160 L60,-250" fill="none" stroke={EP.dark} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40,-270 L110,-250 L90,-190 L30,-220 Z" fill="#E6B85C" stroke={INK} strokeWidth={3} />
    <ellipse cx={95} cy={-205} rx={22} ry={10} fill="#FFF3C8" opacity={on} transform="rotate(-25 95 -205)" />
  </g>
);

/** the study nook (setting C): warm wall, bookshelf in depth, window with daylight, a plant */
export const NookBack: React.FC<{id: string; veil?: number}> = ({id, veil = 0}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-w`} x1="0" y1="-600" x2="0" y2="700" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={shade(EP.wallWarm, 0.08)} />
        <stop offset="1" stopColor={lit(EP.wallWarm, 0.1)} />
      </linearGradient>
    </defs>
    <rect x={-1400} y={-800} width={4800} height={2400} fill={`url(#${id}-w)`} />
    <rect x={-1400} y={640} width={4800} height={1000} fill="#B98A5E" />
    <rect x={-1400} y={632} width={4800} height={12} fill={EP.paper} />
    {/* bookshelf */}
    <rect x={-120} y={-380} width={520} height={1020} fill={EP.woodDeep} stroke={INK} strokeWidth={3} />
    {Array.from({length: 5}, (_, r) => (
      <g key={r}>
        <rect x={-100} y={-360 + r * 196} width={480} height={176} fill={shade(EP.woodDeep, 0.3)} />
        {Array.from({length: 11}, (_, b) => {
          const hb = 120 + ((b * 37 + r * 13) % 50);
          const cs = ['#5E8CA8', '#D97B5F', '#6FA387', '#E6B85C', '#8C7BB5', '#C9B79B', '#E06A4F'];
          return b === 7 && r % 2 === 0 ? null : <rect key={b} x={-90 + b * 42} y={-360 + r * 196 + 176 - hb} width={36} height={hb} rx={2} fill={cs[(b + r) % cs.length]} stroke={INK} strokeWidth={1.6} />;
        })}
        <rect x={-110} y={-360 + r * 196 + 176} width={500} height={16} fill={EP.woodDeep} stroke={INK} strokeWidth={2} />
      </g>
    ))}
    <Window id={`${id}-win`} x={1420} y={-300} w={480} h={520} />
    {/* plant */}
    <path d="M1180,620 l20,-90 l60,0 l20,90 Z" fill="#C25B4E" stroke={INK} strokeWidth={2.5} />
    {[-50, -20, 10, 40, 70].map((a, i) => (
      <ellipse key={i} cx={1230 + a * 0.9} cy={460 - Math.abs(a) * 0.6} rx={18} ry={60} transform={`rotate(${a} ${1230 + a * 0.9} ${460 - Math.abs(a) * 0.6})`} fill={i % 2 ? '#6FA387' : '#4F8A6A'} stroke={INK} strokeWidth={2} />
    ))}
    <Veil k={veil} color="#F4E6CC" />
  </g>
);

/** the help desk (assistant vignette): a lab reception wall with a door, a plant and a wayfinding panel (no text) */
export const DeskBack: React.FC<{id: string; veil?: number}> = ({id, veil = 0}) => (
  <g>
    <rect x={-1400} y={-800} width={4800} height={2400} fill="#E4ECEA" />
    <rect x={-1400} y={560} width={4800} height={1200} fill={EP.tealDeep} />
    <rect x={-1400} y={552} width={4800} height={12} fill={EP.paper} />
    {/* glass door with frame */}
    <rect x={1300} y={-420} width={420} height={980} fill="#BFD7E2" stroke={INK} strokeWidth={4} />
    <rect x={1320} y={-400} width={380} height={940} fill="#D6E6EC" />
    <line x1={1510} y1={-400} x2={1510} y2={540} stroke={INK} strokeWidth={3} />
    <rect x={1470} y={60} width={14} height={90} rx={6} fill={EP.metal} stroke={INK} strokeWidth={2} />
    <path d="M1340,-380 l90,0 l-200,900 l-90,0 Z" fill="#FFF" opacity={0.25} />
    {/* wayfinding panel: arrows and pictograms only */}
    <rect x={260} y={-300} width={520} height={240} rx={14} fill={EP.dark} stroke={INK} strokeWidth={3} />
    <path d="M310,-230 l60,0 l0,-16 l30,26 l-30,26 l0,-16 l-60,0 Z" fill="#F6F0E2" />
    <circle cx={470} cy={-218} r={20} fill="#E6B85C" />
    <path d="M310,-130 l60,0 l0,-16 l30,26 l-30,26 l0,-16 l-60,0 Z" fill="#F6F0E2" />
    <rect x={450} y={-140} width={40} height={40} rx={8} fill="#8FB3AD" />
    {/* plant */}
    <path d="M-140,560 l30,-130 l100,0 l30,130 Z" fill={EP.paper} stroke={INK} strokeWidth={2.5} />
    {[-60, -25, 10, 45].map((a, i) => (
      <ellipse key={i} cx={-60 + a} cy={330 - Math.abs(a)} rx={22} ry={90} transform={`rotate(${a * 0.8} ${-60 + a} ${330 - Math.abs(a)})`} fill={i % 2 ? '#6FA387' : '#4F8A6A'} stroke={INK} strokeWidth={2} />
    ))}
    <Veil k={veil} color="#E4ECEA" />
  </g>
);

/** a counter / desk top seen slightly from above, with a front panel */
export const Counter: React.FC<{id: string; x0: number; x1: number; y: number; depth?: number; face?: number; top?: string; front?: string}> = ({id, x0, x1, y, depth = 80, face = 600, top = EP.woodTop, front = EP.wood}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-t`} x1="0" y1={y} x2="0" y2={y + depth} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={shade(top, 0.12)} />
        <stop offset="1" stopColor={lit(top, 0.08)} />
      </linearGradient>
    </defs>
    <rect x={x0} y={y} width={x1 - x0} height={depth} fill={`url(#${id}-t)`} />
    <rect x={x0} y={y + depth} width={x1 - x0} height={face} fill={front} />
    <rect x={x0} y={y + depth} width={x1 - x0} height={6} fill={lit(front, 0.25)} />
    <line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={2.5} />
    <line x1={x0} y1={y + depth} x2={x1} y2={y + depth} stroke={INK} strokeWidth={2.5} />
  </g>
);
export {mix, Veil};
