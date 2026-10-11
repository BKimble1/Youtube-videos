import React from 'react';
import {C, F, H, W} from '../film/common';
import {mix} from '../hand/Hand';

/** Shot-local backdrops. Each fills the whole 1080x1920 canvas (no permanent bench). */

export const Grid: React.FC<{id: string; size?: number; stroke: string; w?: number; o?: number; offX?: number; offY?: number}> = ({id, size = 90, stroke, w = 3, o = 0.5, offX = 0, offY = 0}) => (
  <g>
    <defs>
      <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse" x={offX} y={offY}>
        <path d={`M ${size} 0 H 0 V ${size}`} fill="none" stroke={stroke} strokeWidth={w} opacity={o} />
      </pattern>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill={`url(#${id})`} />
  </g>
);

/** S1 working-hand macro: saffron, soft light, concentric registration rings. */
export const BgMacro: React.FC<{cx?: number; cy?: number}> = ({cx = 560, cy = 980}) => (
  <g>
    <defs>
      <radialGradient id="macroSpot" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1} gradientTransform={`translate(${cx} ${cy}) scale(${0.62 * W} ${0.62 * H})`}>
        <stop offset="0" stopColor={C.saffronLight} stopOpacity={0.95} />
        <stop offset="0.55" stopColor={C.saffron} stopOpacity={0.4} />
        <stop offset="1" stopColor={C.saffronDeep} stopOpacity={0.35} />
      </radialGradient>
    </defs>
    {/* oversized so the camera moves of the opener (and the loop pre-roll) never expose an edge */}
    <rect x={-900} y={-900} width={W + 1800} height={H + 1800} fill={C.saffron} />
    <rect x={-900} y={-900} width={W + 1800} height={H + 1800} fill="url(#macroSpot)" />
    {[330, 520, 720, 940].map((r, i) => (
      <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke={C.saffronDeep} strokeWidth={i % 2 ? 3 : 5} opacity={0.32} strokeDasharray={i % 2 ? '10 16' : undefined} />
    ))}
  </g>
);

/** S2 overhead desk: cutting-mat cream with blue grid, wood edges, soft top light. */
export const BgDesk: React.FC = () => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill={C.paper} />
    <Grid id="deskGrid2" size={360} stroke={C.blue} w={3} o={0.14} offX={20} offY={40} />
    <rect x={0} y={0} width={34} height={H} fill={C.woodLight} />
    <rect x={W - 34} y={0} width={34} height={H} fill={C.woodLight} />
    <line x1={34} y1={0} x2={34} y2={H} stroke={C.ink} strokeWidth={4} />
    <line x1={W - 34} y1={0} x2={W - 34} y2={H} stroke={C.ink} strokeWidth={4} />
  </g>
);

/** S3a technical macro: ink with teal grid. */
export const BgInk: React.FC<{cx?: number; cy?: number}> = ({cx = 560, cy = 1000}) => (
  <g>
    <defs>
      <radialGradient id="inkSpot" cx={cx / W} cy={cy / H} r="0.7">
        <stop offset="0" stopColor="#24454F" />
        <stop offset="1" stopColor={C.ink} />
      </radialGradient>
    </defs>
    <rect x={0} y={0} width={W} height={H} fill="url(#inkSpot)" />
    <Grid id="inkGrid" size={60} stroke={C.teal} w={2} o={0.22} />
    <Grid id="inkGrid2" size={300} stroke={C.teal} w={3} o={0.4} />
    {[[70, 70], [W - 70, 70], [70, H - 70], [W - 70, H - 70]].map(([x, y], i) => (
      <path key={i} d={`M ${x - 26} ${y} H ${x + 26} M ${x} ${y - 26} V ${y + 26}`} stroke={C.saffron} strokeWidth={4} opacity={0.7} />
    ))}
  </g>
);

/** S3b drafting sheet for the exploded hardware diagram. */
export const BgBlue: React.FC = () => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill={C.paper} />
    <rect x={0} y={0} width={W} height={H} fill={C.blueLight} opacity={0.35} />
    <Grid id="bpGrid2" size={360} stroke={C.blue} w={3} o={0.16} />
  </g>
);

/** S4 tool workstation: pegboard wall plus a compact work surface (not a full-width bench). */
export const BgPeg: React.FC<{tableY?: number}> = ({tableY = 1130}) => (
  <g>
    <rect x={0} y={0} width={W} height={H} fill={C.tealLight} />
    <defs>
      <pattern id="pegHoles" width={64} height={64} patternUnits="userSpaceOnUse">
        <circle cx={32} cy={32} r={6} fill={C.tealDeep} opacity={0.35} />
      </pattern>
    </defs>
    <rect x={0} y={0} width={W} height={tableY} fill="url(#pegHoles)" />
    {/* outlined tool silhouettes hung on the board (context, not the action); kept below the headline lane so they never run behind a title */}
    <g fill="none" stroke={C.tealDeep} strokeWidth={5} opacity={0.5} strokeLinejoin="round">
      <rect x={110} y={530} width={190} height={46} rx={14} />
      <path d="M 120 610 h 150 v 34 h -150 z M 270 627 h 40" />
      <circle cx={850} cy={540} r={46} />
      <circle cx={850} cy={540} r={18} />
    </g>
    <rect x={0} y={tableY} width={W} height={H - tableY} fill={C.woodLight} />
    <rect x={0} y={tableY} width={W} height={26} fill={C.wood} />
    <line x1={0} y1={tableY} x2={W} y2={tableY} stroke={C.ink} strokeWidth={5} />
    <g stroke={C.wood} strokeWidth={4} opacity={0.5}>
      {[tableY + 120, tableY + 260, tableY + 400, tableY + 540].map((y) => (
        <line key={y} x1={0} y1={y} x2={W} y2={y} />
      ))}
    </g>
  </g>
);

/** S5 editorial receipt: dark ink with a register mouth at the top edge. */
export const BgReceipt: React.FC = () => (
  <g>
    <rect x={-900} y={-900} width={W + 1800} height={H + 1800} fill={C.ink} />
    <g>
      <rect x={110} y={-60} width={860} height={350} rx={30} fill={C.coral} stroke={C.ink} strokeWidth={6} />
      <rect x={160} y={104} width={760} height={92} rx={16} fill={C.ink} />
      <rect x={150} y={246} width={780} height={26} rx={13} fill={C.ink} />
    </g>
  </g>
);

/** V3 cool paper (mechanism + rotating-object stages): light blue-grey sheet, soft light, a few restrained blue guides. No dense grid. */
export const PAPER_COOL = '#E8EFF5';
export const BgPaper: React.FC<{cx?: number; cy?: number}> = ({cx = 540, cy = 860}) => (
  <g>
    <defs>
      <radialGradient id="paperSpot" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={1} gradientTransform={`translate(${cx} ${cy}) scale(${0.72 * W} ${0.5 * H})`}>
        <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
        <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
      </radialGradient>
    </defs>
    <rect x={-900} y={-900} width={W + 1800} height={H + 1800} fill={PAPER_COOL} />
    <rect x={-900} y={-900} width={W + 1800} height={H + 1800} fill="url(#paperSpot)" />
    <g fill="none" stroke={C.blue} strokeLinecap="round" opacity={0.34}>
      {[300, 480].map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={r} strokeWidth={i ? 3 : 4} strokeDasharray={i ? '3 16' : undefined} />
      ))}
      {[[110, 130], [W - 110, 130], [110, H - 130], [W - 110, H - 130]].map(([x, y], i) => (
        <path key={i} d={`M ${x - 22} ${y} h 44 M ${x} ${y - 22} v 44`} strokeWidth={4} />
      ))}
    </g>
  </g>
);

export const shade = (c: string, a: number) => mix(c, C.ink, a);
