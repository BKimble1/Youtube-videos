import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {Padlock} from '../v02/S6_Phone';
import {ZoneBox} from '../v02/S3_ZoneBox';
import {RasterPanel, UFront} from '../v02/S7_Plots';

/**
 * V9 only: the simple vector pieces of V9.3 (the three unknowns with padlocks) and V9.4's thumbnail of the real U board.
 * Screen space, pure functions of their props.
 */

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/* ================================================================== V9.3 · shape · position · sensor */

export type UnknownState = {
  /** 0..1 the icon is on screen (cut in on the shot's first frame) */
  t: number;
  /** padlock: y offset of its drop (px, negative = above its seat), 0..1 shackle shut, 0..1 visible */
  lockDrop: number;
  lockShut: number;
  lockT: number;
  squash?: [number, number];
  /** 0..1 "free": a saffron ring round the disc and a "?" badge where the lock would sit */
  free: number;
  /** a small hop of the icon (px, negative = up) */
  hop?: number;
};

export const ICON_R = 132;
export const ICONS = [
  {key: 'shape', x: 480, label: 'shape'},
  {key: 'position', x: 960, label: 'position'},
  {key: 'sensor', x: 1440, label: 'sensor'},
] as const;
export const ICON_Y = 520;
/** where each padlock sits: on the disc's upper-right rim */
export const lockSeat = (x: number) => ({x: x + ICON_R * 0.78, y: ICON_Y - ICON_R * 0.8});

const ShapeGlyph: React.FC = () => (
  // a generic hidden object: a pawn-like teal silhouette (not a person, not the U)
  <g stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round">
    <ellipse cx={4} cy={70} rx={62} ry={12} fill={C.shadow} stroke="none" />
    <path d="M -52 66 L 52 66 L 46 44 L 26 34 C 22 6 18 -10 22 -22 L -22 -22 C -18 -10 -22 6 -26 34 L -46 44 Z" fill={C.teal} />
    <rect x={-34} y={-34} width={68} height={16} rx={8} fill={C.tealDeep} />
    <circle cx={0} cy={-62} r={30} fill={C.teal} />
    <path d="M -14 -74 Q -6 -84 6 -80" fill="none" stroke={C.tealLight} strokeWidth={7} strokeLinecap="round" />
  </g>
);

const PositionGlyph: React.FC = () => (
  // a map pin over a floor cross
  <g strokeLinejoin="round">
    <ellipse cx={0} cy={66} rx={46} ry={11} fill={C.shadow} />
    <path d="M -26 58 L 26 74 M 26 58 L -26 74" stroke={C.inkSoft} strokeWidth={7} strokeLinecap="round" />
    <path d="M 0 64 C -22 30 -50 6 -50 -30 A 50 50 0 1 1 50 -30 C 50 6 22 30 0 64 Z" fill={C.coral} stroke={C.ink} strokeWidth={OUTLINE} />
    <circle cx={0} cy={-30} r={20} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
  </g>
);

const SensorGlyphFront: React.FC = () => (
  // the kit sensor, face on: teal box, coral emitter window, dark receiver window, LED
  <g stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round">
    <ellipse cx={4} cy={58} rx={70} ry={11} fill={C.shadow} stroke="none" />
    <path d="M -64 -34 L -52 -48 L 76 -48 L 64 -34 Z" fill={C.tealLight} />
    <path d="M 64 -34 L 76 -48 L 76 30 L 64 44 Z" fill={C.tealDeep} />
    <rect x={-64} y={-34} width={128} height={78} rx={10} fill={C.teal} />
    <rect x={-46} y={-14} width={34} height={22} rx={6} fill={C.coral} />
    <rect x={8} y={-14} width={34} height={22} rx={6} fill={C.inkSoft} />
    <circle cx={46} cy={28} r={6} fill={C.saffron} strokeWidth={2.5} />
  </g>
);

const GLYPHS: Record<string, React.FC> = {shape: ShapeGlyph, position: PositionGlyph, sensor: SensorGlyphFront};

export const UnknownIcons: React.FC<{states: UnknownState[]}> = ({states}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {ICONS.map((ic, i) => {
      const s = states[i];
      if (s.t <= 0.001) return null;
      const G = GLYPHS[ic.key];
      const seat = lockSeat(ic.x);
      const hop = s.hop ?? 0;
      return (
        <g key={ic.key} opacity={clamp01(s.t)}>
          {/* the disc */}
          <circle cx={ic.x + 10} cy={ICON_Y + 12} r={ICON_R} fill={C.shadow} />
          <circle cx={ic.x} cy={ICON_Y} r={ICON_R} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
          {s.free > 0.001 && <circle cx={ic.x} cy={ICON_Y} r={ICON_R + 14} fill="none" stroke={C.saffronDeep} strokeWidth={9} opacity={clamp01(s.free)} />}
          <g transform={`translate(${ic.x} ${ICON_Y + 6 + hop}) scale(1.25)`}>
            <G />
          </g>
          {/* the free one: a "?" badge where a padlock would sit */}
          {s.free > 0.001 && (
            <g opacity={clamp01(s.free)} transform={`translate(${seat.x} ${seat.y + 10})`}>
              <circle cx={0} cy={0} r={40} fill={C.saffron} stroke={C.ink} strokeWidth={OUTLINE} />
              <text x={0} y={18} textAnchor="middle" fontFamily={F.display} fontWeight={600} fontSize={54} fill={C.ink}>
                ?
              </text>
            </g>
          )}
          {s.lockT > 0.001 && (
            <g opacity={clamp01(s.lockT)}>
              <Padlock x={seat.x} y={seat.y + s.lockDrop} scale={0.72} shut={s.lockShut} squash={s.squash} />
            </g>
          )}
          <text x={ic.x} y={ICON_Y + ICON_R + 74} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={48} fill={C.ink} stroke={C.white} strokeWidth={7} paintOrder="stroke">
            {ic.label}
          </text>
        </g>
      );
    })}
  </svg>
);

/* ================================================================== V9.4 · the real U, as a framed thumbnail card */

/** Card placement (screen px): top-right, inside the safe area (tape and shadow included). */
export const UCARD = {x: 1172, y: 66, w: 640, h: 410};

/**
 * A thumbnail of the real-data U board (V6): white evidence card (ink outline, hard shadow, tape) laid out as the V6
 * board is, in miniature, so it reads as that board coming back: header "Real data" + the 3×3 zone icon + "same 3×3
 * sensor"; the authors' 36 preset positions (6×6 raster) on the left with "36 preset positions" under them; the
 * finished U (UFront, k = 36) on the right; the source line at the bottom. A card over our plan, never drawn in our
 * room's coordinates.
 */
export const UCard: React.FC<{t: number; dy?: number}> = ({t, dy = 0}) => {
  if (t <= 0.001) return null;
  const {x, y, w, h} = UCARD;
  const cell = 6.5; // 40 × 6.5 = 260 px front view
  const tape = (left: number, rot: number) => (
    <div style={{position: 'absolute', left, top: -12, width: 92, height: 28, background: 'rgba(255,233,168,0.92)', border: '2px solid rgba(22,42,50,0.25)', transform: `rotate(${rot}deg)`}} />
  );
  return (
    <div style={{position: 'absolute', left: x, top: y + dy, width: w, height: h, opacity: clamp01(t)}}>
      <div style={{position: 'absolute', left: 12, top: 14, width: w, height: h, borderRadius: 12, background: C.shadow}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: 12, background: C.white, border: `${OUTLINE}px solid ${C.ink}`, boxSizing: 'border-box'}} />
      {tape(-14, -9)}
      {tape(w - 86, 8)}
      {/* header, as the V6 board's: "Real data", the zone icon right after it, "same 3×3 sensor" */}
      <svg width={w} height={80} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <text x={24} y={56} fontFamily={F.display} fontWeight={600} fontSize={44} fill={C.ink}>
          Real data
        </text>
        <ZoneBox asGroup x={272} y={40} size={50} listening={0.15} />
        <text x={318} y={54} fontFamily={F.body} fontWeight={800} fontSize={32} fill={C.ink}>
          same 3×3 sensor
        </text>
      </svg>
      {/* left: the 36 preset positions, all used */}
      <div style={{position: 'absolute', left: 20, top: 112}}>
        <RasterPanel width={262} pos={36} done={36} t={0} boxSize={36} />
      </div>
      <div style={{position: 'absolute', left: 24, top: 286, fontFamily: F.body, fontWeight: 800, fontSize: 30, lineHeight: 1.1, color: C.ink, whiteSpace: 'nowrap'}}>
        36 preset positions
      </div>
      {/* right: the finished U (front view) */}
      <div style={{position: 'absolute', left: w - 24 - 40 * cell, top: 86, width: 40 * cell, height: 40 * cell, border: `2px solid ${C.inkMuted}`, boxSizing: 'content-box'}}>
        <UFront cell={cell} k={36} />
      </div>
      {/* the one-line source */}
      <div style={{position: 'absolute', left: 24, top: h - 52, fontFamily: F.body, fontWeight: 800, fontSize: 30, color: C.inkSoft, whiteSpace: 'nowrap'}}>
        authors' released data
      </div>
    </div>
  );
};

/* ================================================================== V9.1 · the mini arrival timeline */

/** Mini timeline card at the plan's lower edge (screen px; above the caption band). */
export const MINI = {x: 110, y: 792, w: 760, h: 138};
const MINI_AX = {x0: MINI.x + 36, x1: MINI.x + MINI.w - 40, y: MINI.y + MINI.h - 34};
/** x of the wall echo, his echo before and after his step (fractions of the axis): not to scale, the shift is the point */
export const MINI_X = {wall: 0.16, hisA: 0.5, hisB: 0.66};
const axX = (u: number) => MINI_AX.x0 + (MINI_AX.x1 - MINI_AX.x0) * u;

/**
 * The shared timeline's colours in miniature: a teal wall-echo spike, his saffron echo tick. `tick` 0..1 slides his tick
 * from where it sat before his step to where it lands after it; the old place keeps a dashed outline (`ghost`).
 */
export const MiniTimeline: React.FC<{t: number; wall: number; his: number; tick: number; ghost: number}> = ({t, wall, his, tick, ghost}) => {
  if (t <= 0.001) return null;
  const {x, y, w, h} = MINI;
  const ay = MINI_AX.y;
  const sx = axX(MINI_X.wall);
  const spikeH = 76 * clamp01(wall);
  const hx = axX(MINI_X.hisA + (MINI_X.hisB - MINI_X.hisA) * clamp01(tick));
  const hh = 56 * clamp01(his); // his echo tick: big enough that its slide reads at phone size
  const gx = axX(MINI_X.hisA);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: clamp01(t)}}>
      <rect x={x + 10} y={y + 12} width={w} height={h} rx={18} fill={C.shadow} />
      <rect x={x} y={y} width={w} height={h} rx={18} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
      {/* axis */}
      <path d={`M ${MINI_AX.x0} ${ay} L ${MINI_AX.x1} ${ay}`} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <path d={`M ${MINI_AX.x1 - 16} ${ay - 11} L ${MINI_AX.x1} ${ay} L ${MINI_AX.x1 - 16} ${ay + 11}`} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <text x={MINI_AX.x1 - 4} y={ay - 22} textAnchor="end" fontFamily={F.body} fontWeight={800} fontSize={30} fill={C.inkSoft}>
        time
      </text>
      {/* the wall echo */}
      {spikeH > 0.5 && <path d={`M ${sx - 26} ${ay} C ${sx - 10} ${ay} ${sx - 9} ${ay - spikeH} ${sx} ${ay - spikeH} C ${sx + 9} ${ay - spikeH} ${sx + 10} ${ay} ${sx + 26} ${ay} Z`} fill={C.teal} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />}
      {/* where his echo was (frame 1), once it has moved */}
      {ghost > 0.001 && <rect x={gx - 11} y={ay - 56} width={22} height={56} rx={7} fill="none" stroke={C.inkSoft} strokeWidth={3} strokeDasharray="5 4" opacity={clamp01(ghost)} />}
      {/* his echo */}
      {hh > 0.5 && <rect x={hx - 12} y={ay - hh} width={24} height={hh} rx={7} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} />}
      {/* the shift, as a small arrow under the axis */}
      {ghost > 0.001 && tick > 0.05 && (
        <g opacity={clamp01(ghost)}>
          <path d={`M ${gx + 4} ${ay + 18} L ${hx - 6} ${ay + 18}`} stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" />
          <path d={`M ${hx - 16} ${ay + 10} L ${hx - 6} ${ay + 18} L ${hx - 16} ${ay + 26}`} fill="none" stroke={C.saffronDeep} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};
