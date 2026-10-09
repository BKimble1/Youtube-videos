import React from 'react';
import {C, F, OUTLINE} from '../../theme';
import {GuesserToken} from './Tokens';
import {mixHex} from './Optics';

/**
 * S7 props (flat cutout style, 4 px ink outlines, world px).
 *  - SensorStand: the small tripod the kit sensor sits on (legs to three floor points, a clamp head under the grip).
 *  - TargetBoard: a small plain board on a pole stand (the "target" the reflective strip is pressed onto); it can turn.
 *  - ReflectiveStrip: a safety-vest style strip: hi-vis saffron edges, a pale silver reflective band.
 *  - FilmFrames: a film strip of mini plan frames (a hidden person token stepping behind a partition) that ticks one
 *    frame at a time.
 *  - CodeCard: the "code" exhibit (the museum itself is S5_Museum's gallery, plinths and rope).
 *  - AuthorsSensor: the authors' device in our drawing of their separate test: deliberately neutral (grey, no screen).
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

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** A short four-point sparkle centred at (0, 0), radius 16 × `k` px (a flat shape, not a glow). */
const Sparkle: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <g transform={`translate(${f2(x)} ${f2(y)}) scale(${f2(k)})`}>
    <path d="M 0 -16 L 4 -4 L 16 0 L 4 4 L 0 16 L -4 4 L -16 0 L -4 -4 Z" fill={C.white} stroke={C.ink} strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
  </g>
);

/** The strip's end wrapped round a board edge: a 14 x 28 px saffron tab (the strip's height) centred at (x, y), a thin
 *  band of the strip's pale reflective stuff across its middle, ink outline; it fades in with `t`. */
const StripTab: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g opacity={f2(Math.min(1, t))}>
    <rect x={f2(x - 7)} y={f2(y - 14)} width={14} height={28} rx={4} fill={C.saffron} />
    <rect x={f2(x - 6)} y={f2(y - 4)} width={12} height={8} fill="#DCE5E8" />
    <rect x={f2(x - 7)} y={f2(y - 14)} width={14} height={28} rx={4} fill="none" stroke={C.ink} strokeWidth={3} />
  </g>
);

/**
 * Board on a pole stand. `center` = board centre (px), `floor` = the stand's floor point (px), board w × h px.
 * `rim` 0..1: the arrival cue when a pulse reaches the board from the wall side (behind it): a crisp saffron rim on its
 * up-left (wall-side) outline, offset (-6, -5) × `rimScale` px like Cast2 rimFlash, so a person and the board light the
 * same way. `sparkle` 0..1: a four-point sparkle on that up-left corner, over the rim (the fat return leaving the strip).
 * `turn` 0..1: the board turns half a revolution about its pole (drawn as a horizontal squash, cos(pi * turn), with the
 * outline kept 4 px): its front face (inner frame line and `children`, e.g. the reflective strip) shows while
 * cos >= 0, its plain back (a pole bracket, no frame line) after that, so at turn 1 the front, and the strip on it,
 * face the wall. The rim and the sparkle stay outside the squash (they belong to the arrival, after the turn).
 * `stripTab` 0..1 (opt-in, default 0): while the back shows, the end of a strip on the front, wrapped round the board's
 * left (wall-side) edge, as a 14 x 28 px tab (saffron, the strip's pale band across it) straddling that edge at
 * `stripTabY` (the strip's centre line), so the strip stays in sight once it faces the wall; with the tab up, the
 * arrival sparkle lands on the tab (the light leaving the strip) instead of on the corner.
 */
export const TargetBoard: React.FC<{center: Pt; floor: Pt; w: number; h: number; wobble?: number; rim?: number; rimScale?: number; sparkle?: number; turn?: number; stripTab?: number; stripTabY?: number; children?: React.ReactNode}> = ({
  center,
  floor,
  w,
  h,
  wobble = 0,
  rim = 0,
  rimScale = 1,
  sparkle = 0,
  turn = 0,
  stripTab = 0,
  stripTabY,
  children,
}) => {
  const bottom = center.y + h / 2;
  const c = Math.cos(Math.PI * clamp01(turn));
  const back = c < 0;
  // never a zero-width board: edge-on it is a 6 px sliver inside its 4 px outline
  const sx = (back ? -1 : 1) * Math.max(Math.abs(c), 0.05);
  const ns = {vectorEffect: 'non-scaling-stroke' as const};
  // the strip's wrapped end: centred 1 px outside the silhouette's left edge (that edge is |sx| w / 2 left of centre)
  const tab = back && stripTab > 0.01 ? {x: center.x - (Math.abs(sx) * w) / 2 - 1, y: stripTabY ?? center.y} : null;
  return (
    <g>
      <ellipse cx={floor.x + 6} cy={floor.y + 3} rx={w * 0.42} ry={8} fill={C.shadow} />
      {/* base feet */}
      <rect x={floor.x - w * 0.32} y={floor.y - 9} width={w * 0.64} height={12} rx={6} fill={C.woodDeep} stroke={C.ink} strokeWidth={3} />
      {/* pole */}
      <rect x={floor.x - 6} y={bottom - 6} width={12} height={floor.y - bottom} rx={5} fill={C.wood} stroke={C.ink} strokeWidth={3} />
      <g transform={`rotate(${f2(wobble)} ${f2(floor.x)} ${f2(floor.y)})`}>
        {rim > 0.01 && <rect x={f2(center.x - w / 2 - 6 * rimScale - OUTLINE / 2)} y={f2(center.y - h / 2 - 5 * rimScale - OUTLINE / 2)} width={f2(w + OUTLINE)} height={f2(h + OUTLINE)} rx={12} fill={C.saffron} opacity={Math.min(1, rim)} />}
        <g transform={`translate(${f2(center.x)} 0) scale(${f2(sx * 1000) / 1000} 1) translate(${f2(-center.x)} 0)`}>
          <rect x={center.x - w / 2} y={center.y - h / 2} width={w} height={h} rx={10} fill={C.blueLight} stroke={C.ink} strokeWidth={OUTLINE} {...ns} />
          {!back && <rect x={center.x - w / 2 + 9} y={center.y - h / 2 + 9} width={w - 18} height={h - 18} rx={6} fill="none" stroke={C.blue} strokeWidth={3} opacity={0.55} {...ns} />}
          {!back && children}
          {/* the plain back: the wooden bracket the pole is screwed to */}
          {back && <rect x={center.x - 8} y={center.y - h * 0.18} width={16} height={h * 0.68} rx={5} fill={C.wood} stroke={C.ink} strokeWidth={3} {...ns} />}
        </g>
        {tab && <StripTab x={tab.x} y={tab.y} t={stripTab} />}
        {sparkle > 0.01 && <Sparkle x={tab ? tab.x - 5 : center.x - w / 2 - 6 * rimScale} y={tab ? tab.y - 16 : center.y - h / 2 - 5 * rimScale} k={1.35 * Math.min(1, sparkle)} />}
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

/* ------------------------------------------------------------------ AuthorsSensor */

/**
 * The authors' device as we draw it for their separate test (s39): a plain grey box on a plain pole stand. Deliberately
 * neutral, so it never reads as the teal kit (or as S6's saffron research module): no screen, no tick, no LED, no
 * teal, no saffron, no coral; one dark lens rim peeks over its top edge (it faces the wall, away from us). The device's
 * identity is unresolved in the research record, so the drawing claims nothing about it but "a sensor".
 * `box` = the front face's centre (px), `floor` = the stand's floor point (px), `ppm` = px per metre at its depth.
 */
export const AUTHORS_BOX = {w: 0.26, h: 0.12, dx: 0.035, dy: -0.04}; // metres: the front face, and the top face's offset
export const AuthorsSensor: React.FC<{box: Pt; floor: Pt; ppm: number}> = ({box, floor, ppm}) => {
  const w = AUTHORS_BOX.w * ppm;
  const h = AUTHORS_BOX.h * ppm;
  const dx = AUTHORS_BOX.dx * ppm;
  const dy = AUTHORS_BOX.dy * ppm;
  const x0 = box.x - w / 2;
  const y0 = box.y - h / 2;
  const grey = mixHex(C.inkMuted, C.cream, 0.45); // the palette's muted ink lifted toward cream: a flat, neutral grey
  const greyTop = mixHex(C.inkMuted, C.cream, 0.7);
  const ink = {stroke: C.ink, strokeWidth: 3.5, strokeLinejoin: 'round' as const};
  return (
    <g>
      <ellipse cx={floor.x + 5} cy={floor.y + 3} rx={0.17 * ppm} ry={7} fill={C.shadow} />
      {/* round base and a single pole */}
      <ellipse cx={floor.x} cy={floor.y} rx={0.12 * ppm} ry={9} fill={C.inkSoft} {...ink} />
      <rect x={f2(floor.x - 6)} y={f2(y0 + h - 4)} width={12} height={f2(floor.y - (y0 + h - 4))} rx={5} fill={C.inkMuted} {...ink} />
      {/* the lens rim on the far face, peeking over the top edge */}
      <ellipse cx={f2(x0 + w * 0.62 + dx)} cy={f2(y0 + dy - 1)} rx={f2(0.035 * ppm)} ry={f2(0.022 * ppm)} fill={C.inkSoft} {...ink} strokeWidth={3} />
      {/* box: side, top, front */}
      <path d={`M ${f2(x0 + w - 3)} ${f2(y0 + 2)} L ${f2(x0 + w + dx)} ${f2(y0 + dy)} L ${f2(x0 + w + dx)} ${f2(y0 + h + dy - 2)} L ${f2(x0 + w - 3)} ${f2(y0 + h - 2)} Z`} fill={C.inkMuted} {...ink} />
      <path d={`M ${f2(x0 + 2)} ${f2(y0 + 3)} L ${f2(x0 + 2 + dx)} ${f2(y0 + dy)} L ${f2(x0 + w + dx)} ${f2(y0 + dy)} L ${f2(x0 + w - 2)} ${f2(y0 + 3)} Z`} fill={greyTop} {...ink} />
      <rect x={f2(x0)} y={f2(y0)} width={f2(w)} height={f2(h)} rx={8} fill={grey} {...ink} strokeWidth={OUTLINE} />
      {/* a plain seam line: a box, not a screen */}
      <line x1={f2(x0 + 10)} y1={f2(y0 + h * 0.7)} x2={f2(x0 + w - 10)} y2={f2(y0 + h * 0.7)} stroke={C.inkMuted} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};
