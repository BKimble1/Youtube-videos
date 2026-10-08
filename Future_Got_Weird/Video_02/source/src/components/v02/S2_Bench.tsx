import React from 'react';
import {C, OUTLINE} from '../../theme';

/**
 * S2 only: the MirrorBench of S2.1, seen from straight above (plan, like the room's plan board: the "wall" line runs
 * along the top, light travels on the bench below it). A painted panel (the relay wall's paint colour) and a small
 * standing mirror sit on the line; a torch lies on the mat. World px (the shot's 1920x1080 space, framed by a camera).
 */

const f2 = (n: number) => Math.round(n * 100) / 100;

/** Bench geometry (world px). */
export const BENCH = {
  table: {x0: 92, y0: 104, x1: 1828, y1: 1012, r: 40},
  mat: {x0: 168, y0: 176, x1: 1752, y1: 944, r: 24},
  /** the front faces of both panels lie on this line */
  faceY: 302,
  matte: {x0: 300, x1: 760, depth: 50},
  mirror: {x0: 1010, x1: 1470, depth: 46},
  /** where the single ray meets the mirror */
  contact: {x: 1240, y: 302},
  /** angle of incidence from the normal (deg) */
  thetaDeg: 34,
};

/** The relay wall's paint colour (lib/room RoomSet ROOM_COLORS.relayWall). */
export const PAINT = '#F5E4C6';

export const BenchTable: React.FC = () => {
  const {table: t, mat: m} = BENCH;
  return (
    <g>
      <rect x={t.x0 + 12} y={t.y0 + 16} width={t.x1 - t.x0} height={t.y1 - t.y0} rx={t.r} fill={C.shadow} />
      <rect x={t.x0} y={t.y0} width={t.x1 - t.x0} height={t.y1 - t.y0} rx={t.r} fill={C.woodLight} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={m.x0} y={m.y0} width={m.x1 - m.x0} height={m.y1 - m.y0} rx={m.r} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
    </g>
  );
};

/** A standing panel seen from above: two little feet behind it, a body, and its working face on the bottom edge. */
const PanelFeet: React.FC<{x0: number; x1: number; y: number}> = ({x0, x1, y}) => (
  <g>
    {[x0 + 50, x1 - 50].map((x) => (
      <path key={x} d={`M ${x - 26} ${y} L ${x} ${y - 34} L ${x + 26} ${y} Z`} fill={C.woodDeep} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />
    ))}
  </g>
);

/** The plain painted panel (matte), offset by dx/dy (for its entrance and a nudge). */
export const MattePanel: React.FC<{dx?: number; dy?: number}> = ({dx = 0, dy = 0}) => {
  const {x0, x1, depth} = BENCH.matte;
  const y1 = BENCH.faceY;
  const y0 = y1 - depth;
  return (
    <g transform={`translate(${f2(dx)} ${f2(dy)})`}>
      <PanelFeet x0={x0} x1={x1} y={y0} />
      <rect x={x0} y={y0} width={x1 - x0} height={depth} rx={8} fill={'#EAD2AC'} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={x0 + 2} y={y1 - 16} width={x1 - x0 - 4} height={14} rx={5} fill={PAINT} />
      <line x1={x0 + 6} y1={y1 - 16} x2={x1 - 6} y2={y1 - 16} stroke={C.inkMuted} strokeWidth={3} />
      <rect x={x0} y={y0} width={x1 - x0} height={depth} rx={8} fill="none" stroke={C.ink} strokeWidth={OUTLINE} />
    </g>
  );
};

/** The small standing mirror: wooden back, silvered glass face along the bottom edge, a white sheen line. `glint`
 *  0..1 flashes a small flat four-point sparkle on the glass (the "ting"). */
export const MirrorPanel: React.FC<{dx?: number; dy?: number; glint?: number}> = ({dx = 0, dy = 0, glint = 0}) => {
  const {x0, x1, depth} = BENCH.mirror;
  const y1 = BENCH.faceY;
  const y0 = y1 - depth;
  const g = Math.max(0, Math.min(1, glint));
  const sp = 22 * Math.sin(g * Math.PI);
  const sx = x0 + (x1 - x0) * 0.72;
  const sy = y1 - 9;
  return (
    <g transform={`translate(${f2(dx)} ${f2(dy)})`}>
      <PanelFeet x0={x0} x1={x1} y={y0} />
      <rect x={x0} y={y0} width={x1 - x0} height={depth} rx={8} fill={C.wood} stroke={C.ink} strokeWidth={OUTLINE} />
      <rect x={x0 + 3} y={y1 - 20} width={x1 - x0 - 6} height={18} rx={5} fill={C.blueLight} />
      <line x1={x0 + 14} y1={y1 - 11} x2={x1 - 14} y2={y1 - 11} stroke={C.white} strokeWidth={4} strokeLinecap="round" />
      <line x1={x0 + 6} y1={y1 - 20} x2={x1 - 6} y2={y1 - 20} stroke={C.ink} strokeWidth={3} />
      <rect x={x0} y={y0} width={x1 - x0} height={depth} rx={8} fill="none" stroke={C.ink} strokeWidth={OUTLINE} />
      {sp > 0.5 && (
        <path
          d={`M ${f2(sx)} ${f2(sy - sp)} Q ${f2(sx + sp * 0.16)} ${f2(sy - sp * 0.16)} ${f2(sx + sp)} ${f2(sy)} Q ${f2(sx + sp * 0.16)} ${f2(sy + sp * 0.16)} ${f2(sx)} ${f2(sy + sp)} Q ${f2(sx - sp * 0.16)} ${f2(sy + sp * 0.16)} ${f2(sx - sp)} ${f2(sy)} Q ${f2(sx - sp * 0.16)} ${f2(sy - sp * 0.16)} ${f2(sx)} ${f2(sy - sp)} Z`}
          fill={C.white}
          stroke={C.ink}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
};

/** A small torch seen from above, its lens at (x, y), pointing along `angle` (deg, screen). `on` lights the lens. */
export const Torch: React.FC<{x: number; y: number; angle: number; on?: number; opacity?: number}> = ({x, y, angle, on = 0, opacity = 1}) => (
  <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(angle)})`} opacity={opacity}>
    <rect x={-176} y={-24} width={150} height={48} rx={20} fill={C.teal} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-120} y={-10} width={26} height={20} rx={6} fill={C.coral} stroke={C.ink} strokeWidth={3} />
    <path d="M -34 -26 L -4 -38 L -4 38 L -34 26 Z" fill={C.tealDeep} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    <rect x={-8} y={-38} width={14} height={76} rx={6} fill={on > 0.5 ? C.saffronLight : C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
  </g>
);
