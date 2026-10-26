// The lab: one coherent room drawn as flat planes for the 2.5D camera. Warm cream walls over a teal wainscot, a
// wooden bench, the robot's support and control box, an ordinary monitor, a physical mirror on a stand, sensible
// cables. Selective detail only (a shelf, a pinboard, a cable tray); no neon or decorative machinery.
import React from 'react';
import {lit, mix, shade} from '../dc/color';
import {INK, Inked, InkLine, InkPath} from '../dc/ink';
import {fmt} from '../dc/math';

export const LPAL = {
  wall: '#EDE4D0',
  wallDeep: '#D9CDB3',
  wains: '#8FB3AD',
  wainsDeep: '#6F9590',
  trim: '#F6F0E2',
  wood: '#C98F57',
  woodTop: '#DDA66B',
  woodDeep: '#9A6A3E',
  leg: '#5D6A75',
  paper: '#FBF7EE',
  board: '#C7A781',
  teal: '#2F7F7A',
  ink: INK,
};

/** back wall with wainscot, a shelf, a pinboard and a cable tray. Spans x0..x1; floorY = wall bottom */
export const Wall: React.FC<{id: string; x0: number; x1: number; top: number; wainsY: number; floorY: number; detail?: 'shelf' | 'board' | 'both' | 'none'; cool?: number; shelfX?: number; boardX?: number}> = ({id, x0, x1, top, wainsY, floorY, detail = 'both', cool = 0, shelfX, boardX}) => {
  const wall = mix(LPAL.wall, '#D6E0E2', cool);
  const wains = mix(LPAL.wains, '#7FA2B0', cool);
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-w`} x1="0" y1={top} x2="0" y2={wainsY} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={shade(wall, 0.12)} />
          <stop offset="0.5" stopColor={wall} />
          <stop offset="1" stopColor={lit(wall, 0.1)} />
        </linearGradient>
        <radialGradient id={`${id}-pool`} cx={(x0 + x1) / 2} cy={wainsY - 120} r={(x1 - x0) * 0.45} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF6E2" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFF6E2" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={x0} y={top} width={x1 - x0} height={wainsY - top} fill={`url(#${id}-w)`} />
      <rect x={x0} y={top} width={x1 - x0} height={wainsY - top} fill={`url(#${id}-pool)`} />
      <rect x={x0} y={wainsY} width={x1 - x0} height={floorY - wainsY} fill={wains} />
      {/* wainscot panels */}
      {Array.from({length: Math.ceil((x1 - x0) / 260)}, (_, i) => (
        <rect key={i} x={x0 + 30 + i * 260} y={wainsY + 34} width={200} height={Math.max(0, floorY - wainsY - 70)} rx={6} fill="none" stroke={shade(wains, 0.2)} strokeWidth={3} opacity={0.6} />
      ))}
      <rect x={x0} y={wainsY - 10} width={x1 - x0} height={16} fill={LPAL.trim} />
      <rect x={x0} y={wainsY + 6} width={x1 - x0} height={4} fill={shade(wains, 0.3)} opacity={0.6} />
      {/* cable tray near the ceiling */}
      <rect x={x0} y={top + 40} width={x1 - x0} height={22} fill={mix('#B9C0C6', wall, 0.3)} />
      <rect x={x0} y={top + 58} width={x1 - x0} height={5} fill={shade('#B9C0C6', 0.3)} opacity={0.7} />
      {(detail === 'shelf' || detail === 'both') && <Shelf x={shelfX ?? x0 + 170} y={top + 240} />}
      {(detail === 'board' || detail === 'both') && <Pinboard x={boardX ?? x1 - 520} y={top + 170} />}
    </g>
  );
};

const Shelf: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x} y={y} width={360} height={14} fill={LPAL.woodDeep} />
    <rect x={x} y={y} width={360} height={5} fill={LPAL.woodTop} />
    <path d={`M${x + 30},${y + 14} l0,26 l18,0 Z M${x + 312},${y + 14} l0,26 l18,0 Z`} fill={LPAL.leg} />
    {/* boxes, binders, a coil of cable */}
    <rect x={x + 20} y={y - 70} width={70} height={70} rx={3} fill="#C9B79B" stroke={INK} strokeWidth={2} />
    <rect x={x + 30} y={y - 48} width={50} height={14} fill={LPAL.paper} opacity={0.8} />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={x + 110 + i * 26} y={y - 96 + (i % 2) * 6} width={22} height={96 - (i % 2) * 6} rx={2} fill={['#5E8CA8', '#D97B5F', '#6FA387', '#E6B85C'][i]} stroke={INK} strokeWidth={2} />
    ))}
    <ellipse cx={x + 270} cy={y - 22} rx={34} ry={22} fill="none" stroke="#2B313A" strokeWidth={7} />
    <ellipse cx={x + 270} cy={y - 22} rx={22} ry={13} fill="none" stroke="#2B313A" strokeWidth={5} />
    <rect x={x + 310} y={y - 40} width={30} height={40} rx={4} fill="#EDEFF1" stroke={INK} strokeWidth={2} />
  </g>
);

const Pinboard: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g>
    <rect x={x} y={y} width={380} height={240} rx={6} fill={LPAL.board} stroke={INK} strokeWidth={3} />
    <rect x={x + 10} y={y + 10} width={360} height={220} rx={3} fill={lit(LPAL.board, 0.15)} />
    {/* pinned sheets: a face sketch, a chart, notes (no legible text) */}
    <g transform={`rotate(-3 ${x + 80} ${y + 90})`}>
      <rect x={x + 30} y={y + 30} width={110} height={140} fill={LPAL.paper} stroke={INK} strokeWidth={1.6} />
      <ellipse cx={x + 85} cy={y + 90} rx={30} ry={38} fill="none" stroke="#6A7CC0" strokeWidth={2} />
      <path d={`M${x + 70},${y + 108} q15,10 30,0`} fill="none" stroke="#6A7CC0" strokeWidth={2} />
      <circle cx={x + 85} cy={y + 36} r={4} fill="#D9534F" />
    </g>
    <g transform={`rotate(2 ${x + 230} ${y + 80})`}>
      <rect x={x + 170} y={y + 26} width={130} height={96} fill={LPAL.paper} stroke={INK} strokeWidth={1.6} />
      <path d={`M${x + 182},${y + 108} L${x + 210},${y + 90} L${x + 238},${y + 96} L${x + 288},${y + 50}`} fill="none" stroke={LPAL.teal} strokeWidth={2.4} />
      <circle cx={x + 235} cy={y + 31} r={4} fill="#3C7DD9" />
    </g>
    <g transform={`rotate(-2 ${x + 260} ${y + 180})`}>
      <rect x={x + 200} y={y + 140} width={140} height={70} fill="#FFF3B8" stroke={INK} strokeWidth={1.6} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={x + 214} y1={y + 160 + i * 16} x2={x + 320 - i * 22} y2={y + 160 + i * 16} stroke="#9C8F6A" strokeWidth={2.2} />
      ))}
    </g>
  </g>
);

/** wooden bench: top surface from y to y+depthPx (seen from slightly above), front face below */
export const Bench: React.FC<{id: string; x0: number; x1: number; y: number; depth: number; face?: number; legs?: boolean}> = ({id, x0, x1, y, depth, face = 70, legs = true}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-top`} x1="0" y1={y} x2="0" y2={y + depth} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={shade(LPAL.woodTop, 0.12)} />
        <stop offset="1" stopColor={lit(LPAL.woodTop, 0.08)} />
      </linearGradient>
    </defs>
    {legs && (
      <g>
        <rect x={x0 + 60} y={y + depth + face - 4} width={26} height={400} fill={LPAL.leg} />
        <rect x={x1 - 86} y={y + depth + face - 4} width={26} height={400} fill={LPAL.leg} />
      </g>
    )}
    <rect x={x0} y={y} width={x1 - x0} height={depth} fill={`url(#${id}-top)`} />
    {/* grain */}
    {[0.25, 0.55, 0.8].map((k, i) => (
      <line key={i} x1={x0} y1={y + depth * k} x2={x1} y2={y + depth * k + (i - 1) * 3} stroke={LPAL.woodDeep} strokeWidth={1.4} opacity={0.18} />
    ))}
    <rect x={x0} y={y + depth} width={x1 - x0} height={face} fill={LPAL.wood} />
    <rect x={x0} y={y + depth} width={x1 - x0} height={6} fill={lit(LPAL.wood, 0.25)} />
    <rect x={x0} y={y + depth + face - 8} width={x1 - x0} height={8} fill={shade(LPAL.wood, 0.3)} />
    {face > 150 &&
      Array.from({length: Math.ceil((x1 - x0) / 420)}, (_, i) => (
        <g key={i}>
          <rect x={x0 + 40 + i * 420} y={y + depth + 26} width={360} height={face - 60} rx={6} fill="none" stroke={shade(LPAL.wood, 0.25)} strokeWidth={3} opacity={0.7} />
          <rect x={x0 + 190 + i * 420} y={y + depth + 46} width={60} height={10} rx={5} fill={shade(LPAL.wood, 0.4)} />
        </g>
      ))}
    <line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeWidth={2.5} />
    <line x1={x0} y1={y + depth} x2={x1} y2={y + depth} stroke={INK} strokeWidth={2.5} />
  </g>
);

/** contact shadow on the bench */
export const Shadow: React.FC<{cx: number; cy: number; rx: number; ry: number; a?: number}> = ({cx, cy, rx, ry, a = 0.28}) => (
  <ellipse cx={fmt(cx)} cy={fmt(cy)} rx={fmt(rx)} ry={fmt(ry)} fill="#3A2A1A" opacity={a} />
);

/** control box with a ribbon cable (to the robot base) */
export const ControlBox: React.FC<{x: number; y: number; s?: number; leds?: number[]}> = ({x, y, s = 1, leds = [1, 0.3, 0.8]}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(${fmt(s)})`}>
    <Inked w={4}>
      <InkPath d="M-70,-56 L70,-56 L76,0 L-76,0 Z" fill="#C9CED3" />
    </Inked>
    <rect x={-58} y={-46} width={64} height={30} rx={3} fill="#1F2A33" />
    <path d="M-54,-26 l8,-8 l8,5 l8,-12 l8,9 l8,-4 l8,3" fill="none" stroke="#7CE0A0" strokeWidth={2} />
    {[0, 1, 2].map((i) => (
      <g key={i}>
        <circle cx={26 + i * 16} cy={-36} r={5} fill="#3A4450" />
        <circle cx={26 + i * 16} cy={-18} r={3} fill={i === 1 ? '#F5A33B' : '#7CE0A0'} opacity={0.35 + 0.65 * leds[i]} />
      </g>
    ))}
  </g>
);

/** ordinary monitor on a stand; screen content is drawn by the caller inside (sx, sy, sw, sh) */
export const Monitor: React.FC<{id: string; x: number; y: number; w: number; h: number; children?: React.ReactNode; on?: number}> = ({id, x, y, w, h, children, on = 1}) => (
  <g>
    <defs>
      <clipPath id={`${id}-scr`}>
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4} />
      </clipPath>
    </defs>
    {/* stand */}
    <path d={`M${x - 18},${y + h / 2 + 10} L${x + 18},${y + h / 2 + 10} L${x + 12},${y + h / 2 + 70} L${x - 12},${y + h / 2 + 70} Z`} fill="#3B4550" stroke={INK} strokeWidth={2.5} />
    <path d={`M${x - 80},${y + h / 2 + 70} L${x + 80},${y + h / 2 + 70} L${x + 92},${y + h / 2 + 84} L${x - 92},${y + h / 2 + 84} Z`} fill="#2B333C" stroke={INK} strokeWidth={2.5} />
    <rect x={x - w / 2 - 16} y={y - h / 2 - 16} width={w + 32} height={h + 36} rx={12} fill="#2B3440" stroke={INK} strokeWidth={3} />
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={4} fill={mix('#10161D', '#20303C', on)} />
    <g clipPath={`url(#${id}-scr)`} opacity={on}>
      {children}
      {/* faint screen sheen */}
      <path d={`M${x - w / 2},${y - h / 2} L${x - w / 2 + w * 0.35},${y - h / 2} L${x - w / 2 + w * 0.1},${y + h / 2} L${x - w / 2},${y + h / 2} Z`} fill="#FFFFFF" opacity={0.05} />
    </g>
    <circle cx={x + w / 2 + 2} cy={y + h / 2 + 10} r={2.5} fill="#7CE0A0" opacity={on} />
  </g>
);

/** physical mirror on a floor stand: frame, glass and a reflection supplied by the caller (clipped to the glass).
 *  The glass is a quad (corners tl, tr, br, bl) so it can be seen at an angle. */
export const Mirror: React.FC<{id: string; q: [number, number][]; legY?: number; children?: React.ReactNode; sheen?: number}> = ({id, q, legY, children, sheen = 1}) => {
  const d = `M${q.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' L')} Z`;
  const cx = (q[2][0] + q[3][0]) / 2;
  const by = Math.max(q[2][1], q[3][1]);
  return (
    <g>
      <defs>
        <clipPath id={`${id}-g`}>
          <path d={d} />
        </clipPath>
        <linearGradient id={`${id}-gl`} x1={q[0][0]} y1={q[0][1]} x2={q[2][0]} y2={q[2][1]} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#DDE9EE" />
          <stop offset="1" stopColor="#A9BCC6" />
        </linearGradient>
      </defs>
      {legY !== undefined && (
        <g stroke={INK} strokeWidth={2.5}>
          <path d={`M${fmt(cx - 6)},${fmt(by)} L${fmt(cx - 6)},${fmt(legY)} L${fmt(cx + 6)},${fmt(legY)} L${fmt(cx + 6)},${fmt(by)} Z`} fill="#4A535C" />
          <path d={`M${fmt(cx - 70)},${fmt(legY + 10)} L${fmt(cx + 70)},${fmt(legY + 10)} L${fmt(cx + 60)},${fmt(legY)} L${fmt(cx - 60)},${fmt(legY)} Z`} fill="#3B444D" />
        </g>
      )}
      {/* frame */}
      <path d={d} fill="#3B3229" stroke="#3B3229" strokeWidth={30} strokeLinejoin="round" />
      <path d={d} fill="none" stroke={INK} strokeWidth={33} strokeLinejoin="round" opacity={0.0} />
      <path d={d} fill="none" stroke="#6B5843" strokeWidth={18} strokeLinejoin="round" />
      <path d={d} fill={`url(#${id}-gl)`} />
      <g clipPath={`url(#${id}-g)`}>
        {children}
        {/* glass: a cool cast and two diagonal sheen bands */}
        <path d={d} fill="#BFD7E2" opacity={0.12} />
        <g opacity={0.22 * sheen}>
          <path d={`M${fmt(q[0][0] + 40)},${fmt(q[0][1] - 20)} l70,0 l-260,${fmt(by - q[0][1] + 60)} l-70,0 Z`} fill="#FFFFFF" />
          <path d={`M${fmt(q[0][0] + 150)},${fmt(q[0][1] - 20)} l24,0 l-260,${fmt(by - q[0][1] + 60)} l-24,0 Z`} fill="#FFFFFF" />
        </g>
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={2.5} />
    </g>
  );
};

/** spiral notebook (held or on the bench), seen from above at an angle */
export const Notebook: React.FC<{x: number; y: number; w?: number; h?: number; rot?: number; open?: boolean; flat?: number}> = ({x, y, w = 150, h = 110, rot = 0, open = false, flat = 0.38}) => (
  <g transform={`translate(${fmt(x)} ${fmt(y)}) scale(1 ${fmt(flat)}) rotate(${fmt(rot)})`}>
    <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={6} fill={open ? LPAL.paper : '#E06A4F'} stroke={INK} strokeWidth={3} />
    {open &&
      [0, 1, 2, 3, 4].map((i) => <line key={i} x1={-w / 2 + 16} y1={-h / 2 + 22 + i * 18} x2={w / 2 - 14 - (i % 2) * 20} y2={-h / 2 + 22 + i * 18} stroke="#9FB3C8" strokeWidth={2} />)}
    {!open && <rect x={-w / 2 + 20} y={-14} width={w - 50} height={22} rx={3} fill={LPAL.paper} opacity={0.9} />}
    {Array.from({length: 7}, (_, i) => (
      <circle key={i} cx={-w / 2 + 16 + (i * (w - 32)) / 6} cy={-h / 2} r={5} fill="none" stroke="#7A838C" strokeWidth={2.5} />
    ))}
  </g>
);

export const Label: React.FC<{x: number; y: number; text: string; k?: number; anchor?: 'start' | 'middle' | 'end'; size?: number; tone?: 'dark' | 'light' | 'warm'}> = ({x, y, text, k = 1, anchor = 'start', size = 26, tone = 'dark'}) => {
  const w = text.length * size * 0.56 + 34;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  const bg = tone === 'dark' ? '#1E2A33' : tone === 'warm' ? '#F6E7C8' : '#FBF7EE';
  const fg = tone === 'dark' ? '#F6F0E2' : '#1E2A33';
  return (
    <g opacity={k}>
      <rect x={fmt(x0)} y={fmt(y - size * 0.95)} width={fmt(w)} height={fmt(size * 1.55)} rx={fmt(size * 0.77)} fill={bg} opacity={0.9} />
      <text x={fmt(x0 + w / 2)} y={fmt(y + size * 0.12)} textAnchor="middle" fontFamily="Nunito Variable" fontWeight={800} fontSize={size} fill={fg} letterSpacing={0.4}>
        {text}
      </text>
    </g>
  );
};
export const inkLine = InkLine;
