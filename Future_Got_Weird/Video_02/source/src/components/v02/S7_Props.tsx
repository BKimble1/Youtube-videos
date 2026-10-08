import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {PLINTH} from '../../lib/shots';
import {GuesserToken} from './Tokens';

/**
 * S7 props (flat cutout style, 4 px ink outlines, world px).
 *  - SensorStand: the small tripod the kit sensor sits on (legs to three floor points, a clamp head under the grip).
 *  - TargetBoard: a small plain board on a pole stand (the "target" the reflective strip is pressed onto).
 *  - ReflectiveStrip: a safety-vest style strip: hi-vis saffron edges, a pale silver reflective band.
 *  - FilmFrames: a film strip of mini plan frames (a hidden person token stepping behind a partition) that ticks one
 *    frame at a time.
 *  - Plinth / CodeCard: the museum plinth (PLINTH palette shared with S5/S6) and the "code" exhibit.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------------------------------------------ SensorStand */

export type Pt = {x: number; y: number};

/** Tripod: head at `head` (px, under the sensor grip), feet at the given floor points (px). Draw it under the sensor. */
export const SensorStand: React.FC<{head: Pt; feet: Pt[]; scale?: number}> = ({head, feet, scale = 1}) => {
  const hw = 15 * scale;
  const hub = {x: head.x, y: head.y + 26 * scale};
  // far leg first (the one whose foot is highest on screen)
  const order = [...feet].sort((a, b) => a.y - b.y);
  return (
    <g>
      {order.map((p, i) => (
        <ellipse key={`s${i}`} cx={p.x + 4} cy={p.y + 3} rx={13 * scale} ry={4.5 * scale} fill={C.shadow} />
      ))}
      {order.map((p, i) => (
        <g key={i}>
          <line x1={hub.x} y1={hub.y} x2={p.x} y2={p.y} stroke={C.ink} strokeWidth={11 * scale + 2} strokeLinecap="round" />
          <line x1={hub.x} y1={hub.y} x2={p.x} y2={p.y} stroke={i === 0 ? C.inkMuted : C.inkSoft} strokeWidth={11 * scale - 6} strokeLinecap="round" />
        </g>
      ))}
      {/* centre column and clamp head */}
      <rect x={f2(hub.x - 6 * scale)} y={f2(head.y)} width={f2(12 * scale)} height={f2(30 * scale)} rx={4} fill={C.inkSoft} stroke={C.ink} strokeWidth={3} />
      <rect x={f2(head.x - hw)} y={f2(head.y - 8 * scale)} width={f2(hw * 2)} height={f2(16 * scale)} rx={5} fill={C.inkMuted} stroke={C.ink} strokeWidth={3} />
    </g>
  );
};

/* ------------------------------------------------------------------ ReflectiveStrip */

/** A strip centred at (0, 0), `w` × `h` px, optional rotation. Hi-vis saffron edges, a silver band, a white sheen line. */
export const ReflectiveStrip: React.FC<{w: number; h: number; rotate?: number; x?: number; y?: number; glint?: number}> = ({w, h, rotate = 0, x = 0, y = 0, glint = 0}) => {
  const e = h * 0.24;
  return (
    <g transform={`translate(${f2(x)} ${f2(y)}) rotate(${f2(rotate)})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.22} fill={C.saffron} stroke={C.ink} strokeWidth={3} />
      <rect x={-w / 2 + 2} y={-h / 2 + e} width={w - 4} height={h - 2 * e} fill="#DCE5E8" />
      <line x1={-w / 2 + 2} y1={-h / 2 + e} x2={w / 2 - 2} y2={-h / 2 + e} stroke={C.ink} strokeWidth={2} />
      <line x1={-w / 2 + 2} y1={h / 2 - e} x2={w / 2 - 2} y2={h / 2 - e} stroke={C.ink} strokeWidth={2} />
      <line x1={-w / 2 + h * 0.5} y1={0} x2={w / 2 - h * 0.5} y2={0} stroke={C.white} strokeWidth={Math.max(2, h * 0.12)} strokeLinecap="round" opacity={0.9} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h * 0.22} fill="none" stroke={C.ink} strokeWidth={3} />
      {glint > 0 && (
        // a short four-point sparkle (a flat shape, not a glow)
        <g transform={`translate(${f2(w * 0.32)} ${f2(-h * 0.55)}) scale(${f2(glint)})`}>
          <path d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" />
        </g>
      )}
    </g>
  );
};

/* ------------------------------------------------------------------ TargetBoard */

/**
 * Board on a pole stand. `center` = board centre (px), `floor` = the stand's floor point (px), board w × h px.
 * `rim` 0..1: the arrival cue when a pulse reaches the board from the wall side (behind it): a crisp saffron rim on its
 * up-left (wall-side) outline, offset (-6, -5) × `rimScale` px like Cast2 rimFlash, so a person and the board light the
 * same way.
 */
export const TargetBoard: React.FC<{center: Pt; floor: Pt; w: number; h: number; wobble?: number; rim?: number; rimScale?: number; children?: React.ReactNode}> = ({
  center,
  floor,
  w,
  h,
  wobble = 0,
  rim = 0,
  rimScale = 1,
  children,
}) => {
  const bottom = center.y + h / 2;
  return (
    <g>
      <ellipse cx={floor.x + 6} cy={floor.y + 3} rx={w * 0.42} ry={8} fill={C.shadow} />
      {/* base feet */}
      <rect x={floor.x - w * 0.32} y={floor.y - 9} width={w * 0.64} height={12} rx={6} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} />
      {/* pole */}
      <rect x={floor.x - 6} y={bottom - 6} width={12} height={floor.y - bottom} rx={5} fill={C.wood} stroke={C.ink} strokeWidth={3} />
      <g transform={`rotate(${f2(wobble)} ${f2(floor.x)} ${f2(floor.y)})`}>
        {rim > 0.01 && <rect x={f2(center.x - w / 2 - 6 * rimScale - OUTLINE / 2)} y={f2(center.y - h / 2 - 5 * rimScale - OUTLINE / 2)} width={f2(w + OUTLINE)} height={f2(h + OUTLINE)} rx={12} fill={C.saffron} opacity={Math.min(1, rim)} />}
        <rect x={center.x - w / 2} y={center.y - h / 2} width={w} height={h} rx={10} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={center.x - w / 2 + 9} y={center.y - h / 2 + 9} width={w - 18} height={h - 18} rx={6} fill="none" stroke={C.blue} strokeWidth={3} opacity={0.55} />
        {children}
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ FilmFrames */

export type FilmFramesProps = {
  /** visible window width px */
  width: number;
  /** frame cell width px (height follows) */
  cell?: number;
  /** strip position in frames (float while a tick slides) */
  pos: number;
  /** how many frames exist so far (cells beyond show blank) */
  count?: number;
};

/**
 * A film strip of mini plan frames. Each frame: the wall line, the partition bar and the hidden person's overhead token
 * at its position for that frame (a walk behind the partition). The newest frame enters at the right; the strip
 * slides left by one cell per tick. One sprocket hole per cell edge (wide spacing: no shimmer while it slides).
 */
/** Height (px) of a FilmFrames strip with cells `cell` px wide. */
export const filmStripHeight = (cell: number) => Math.round(cell * 0.62) + 60;

export const FilmFrames: React.FC<FilmFramesProps> = ({width, cell = 210, pos, count = 999}) => {
  const ch = Math.round(cell * 0.62);
  const band = 30;
  const H = filmStripHeight(cell);
  const pitch = cell + 14;
  const first = Math.floor(pos) - Math.ceil(width / pitch) - 1;
  const cells: React.ReactNode[] = [];
  for (let i = first; i <= Math.floor(pos) + 1; i++) {
    if (i < 0 || i >= count) continue;
    // x: the newest frame (index floor(pos)) sits at the right end of the window
    const x = width - pitch * (pos - i + 1) + 7;
    if (x > width || x + pitch < 0) continue;
    // a walk to the left then back (deterministic per frame index)
    const u = (i % 12) / 11;
    const walk = u < 0.5 ? 1 - u * 2 : (u - 0.5) * 2;
    const tx = cell * (0.5 + 0.38 * walk);
    const ty = ch * 0.6;
    cells.push(
      <g key={i} transform={`translate(${f2(x)} ${band})`}>
        <rect x={0} y={0} width={cell} height={ch} rx={8} fill={C.cream} stroke={C.ink} strokeWidth={3} />
        <line x1={10} y1={14} x2={cell - 10} y2={14} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        <rect x={cell * 0.36 - 5} y={ch * 0.3} width={10} height={ch * 0.62} rx={4} fill={C.coral} stroke={C.ink} strokeWidth={2.5} />
        <GuesserToken asGroup x={tx} y={ty} size={ch * 0.42} facing={walk > 0.5 ? 90 : -90} shadow={false} />
      </g>,
    );
  }
  const holes: React.ReactNode[] = [];
  for (let i = first; i <= Math.floor(pos) + 1; i++) {
    const x = width - pitch * (pos - i + 1) + 7 + cell / 2 - 14;
    holes.push(<rect key={`a${i}`} x={f2(x)} y={8} width={28} height={14} rx={5} fill={C.paperDeep} stroke={C.ink} strokeWidth={2.5} />);
    holes.push(<rect key={`b${i}`} x={f2(x)} y={H - 22} width={28} height={14} rx={5} fill={C.paperDeep} stroke={C.ink} strokeWidth={2.5} />);
  }
  return (
    <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} style={{display: 'block', overflow: 'hidden'}}>
      <rect x={-10} y={0} width={width + 20} height={H} rx={0} fill={C.inkSoft} />
      {holes}
      {cells}
      <line x1={-10} y1={1.5} x2={width + 10} y2={1.5} stroke={C.ink} strokeWidth={3} />
      <line x1={-10} y1={H - 1.5} x2={width + 10} y2={H - 1.5} stroke={C.ink} strokeWidth={3} />
    </svg>
  );
};

/* ------------------------------------------------------------------ museum */

/** Plinth (S5/S6 palette). Origin: centre of the top surface. */
export const Plinth: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode}> = ({x, y, w, h, children}) => (
  <g transform={`translate(${f2(x)} ${f2(y)})`}>
    <ellipse cx={14} cy={h + 6} rx={w * 0.58} ry={14} fill={C.shadow} />
    <rect x={-w / 2} y={0} width={w} height={h} rx={6} fill={PLINTH.body} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-w / 2 - 14} y={-22} width={w + 28} height={26} rx={7} fill={PLINTH.top} stroke={C.ink} strokeWidth={OUTLINE} />
    <rect x={-w / 2 - 6} y={h - 22} width={w + 12} height={22} rx={5} fill={PLINTH.top} stroke={C.ink} strokeWidth={OUTLINE} />
    {children}
  </g>
);

/** A small brass plaque on a plinth front. Origin: plaque centre. */
export const Plaque: React.FC<{text: string; w: number; size?: number}> = ({text, w, size = 36}) => (
  <g>
    <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.7} rx={10} fill={PLINTH.plaque} stroke={C.ink} strokeWidth={OUTLINE} />
    <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={F.body} fontWeight={800} fontSize={size} fill={C.ink}>
      {text}
    </text>
  </g>
);

/** The "code" exhibit: a page of code (bars, not legible text) on a small easel. Origin: bottom centre. */
export const CodeCard: React.FC<{w?: number}> = ({w = 210}) => {
  const h = w * 1.18;
  const bars = [0.62, 0.4, 0.74, 0.5, 0.3, 0.66, 0.45, 0.58];
  const ind = [0, 1, 1, 2, 2, 1, 0, 1];
  return (
    <g>
      <line x1={-w * 0.22} y1={0} x2={-w * 0.08} y2={-h * 0.5} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
      <line x1={-w * 0.22} y1={0} x2={-w * 0.08} y2={-h * 0.5} stroke={C.woodDeep} strokeWidth={5} strokeLinecap="round" />
      <line x1={w * 0.22} y1={0} x2={w * 0.08} y2={-h * 0.5} stroke={C.ink} strokeWidth={10} strokeLinecap="round" />
      <line x1={w * 0.22} y1={0} x2={w * 0.08} y2={-h * 0.5} stroke={C.woodDeep} strokeWidth={5} strokeLinecap="round" />
      <g transform={`translate(0 ${f2(-h - 10)}) rotate(-3)`}>
        <rect x={-w / 2} y={0} width={w} height={h} rx={10} fill={C.cream} stroke={C.ink} strokeWidth={OUTLINE} />
        <rect x={-w / 2} y={0} width={w} height={44} rx={10} fill={C.tealLight} stroke={C.ink} strokeWidth={OUTLINE} />
        <text x={0} y={33} textAnchor="middle" fontFamily={F.mono} fontWeight={700} fontSize={30} fill={C.ink}>
          {'</>'}
        </text>
        {bars.map((b, i) => (
          <rect key={i} x={-w / 2 + 18 + ind[i] * 16} y={62 + i * 22} width={(w - 36 - ind[i] * 16) * b} height={9} rx={4.5} fill={i % 3 === 1 ? C.teal : C.inkMuted} />
        ))}
      </g>
    </g>
  );
};
