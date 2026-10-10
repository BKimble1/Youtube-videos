import React, {useId} from 'react';
import {C, OUTLINE} from '../../theme';
import {rand} from '../../lib/anim';
import {DEFAULT_VIEW, LAYOUT, WALL_T, type ViewConfig} from '../../lib/room';
import {RoomSet, ROOM_COLORS} from '../v02/RoomSet';
import type {P2} from '../../lib/optics';

/**
 * V2 plan stage: our room seen from straight above (RoomSet at tilt 1, the S4 PlanBoard), drawn through a per-frame
 * PLAN MAP instead of a CSS camera, so outlines stay 4 px while the framing changes (the V1 → V2 match, the reframe, the
 * push into W1's paint).
 *
 *   screen = anchor + k · (p − pivot)        (plan metres → screen px; x right, z down the screen, wall z = 0 at top)
 *
 * The relay wall's strip (z −WALL_T..0) is painted in the wall's own paint colour (RoomSet ROOM_COLORS.relayWall, the
 * colour of the wall face in every room view) with an ink outline, over RoomSet's ink wall top. That is where V2.4 pushes
 * in: the last 4 frames of V2 are that paint with its static grain (PAINT_GRAIN; the V2 → V3 hand-off).
 */

export type PlanMap = {k: number; pivot: P2; anchor: {x: number; y: number}};

export const PAINT = ROOM_COLORS.relayWall;

export const planToPx = (m: PlanMap) => (p: P2) => ({x: m.anchor.x + m.k * (p.x - m.pivot.x), y: m.anchor.y + m.k * (p.z - m.pivot.z)});

/** RoomSet's view for a plan map (only the plan half is used at tilt 1). */
export const planView = (m: PlanMap): ViewConfig => ({
  room: DEFAULT_VIEW.room,
  plan: {ppm: m.k, anchor: {x: m.anchor.x, y: m.anchor.y}},
  pivot: {x: m.pivot.x, z: m.pivot.z, h: 0},
});

/** A map that puts plan point `pivot` at screen `anchor` with scale k. */
export const mapAt = (k: number, pivot: P2, anchor: {x: number; y: number}): PlanMap => ({k, pivot, anchor});

/** Blend two maps that share a pivot: the pivot's screen point glides, the scale glides geometrically. */
export const blendMaps = (a: PlanMap, b: PlanMap, t: number): PlanMap => {
  const u = Math.max(0, Math.min(1, t));
  // re-express b about a's pivot
  const bAnchor = {x: b.anchor.x + b.k * (a.pivot.x - b.pivot.x), y: b.anchor.y + b.k * (a.pivot.z - b.pivot.z)};
  return {k: a.k * Math.pow(b.k / a.k, u), pivot: a.pivot, anchor: {x: a.anchor.x + (bAnchor.x - a.anchor.x) * u, y: a.anchor.y + (bAnchor.y - a.anchor.y) * u}};
};

const f2 = (n: number) => Math.round(n * 100) / 100;

/** The relay wall's strip in paint colour with an ink outline (screen px; draw in RoomSet's backdrop slot). */
/** The plan runs the relay wall on past the room's right end (RoomSet extendRight): the side wall's heavy ink bar at
 *  the frame's right edge read as a border, and nothing in V2 happens near it. */
export const EXTEND_RIGHT = 2;

export const PaintedWall: React.FC<{m: PlanMap; grain?: PlanGrain}> = ({m, grain}) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const P = planToPx(m);
  const {x0, x1} = LAYOUT.room;
  const a = P({x: x0, z: -WALL_T});
  const b = P({x: x1 + EXTEND_RIGHT, z: 0});
  const rect = {x: f2(a.x), y: f2(a.y), width: f2(b.x - a.x), height: f2(b.y - a.y)};
  const items = grain ? grainInPlan(m, grain) : [];
  return (
    <g>
      <rect {...rect} fill={PAINT} />
      {items.length > 0 && (
        <>
          <defs>
            <clipPath id={`pw${uid}`}>
              <rect {...rect} />
            </clipPath>
          </defs>
          <g clipPath={`url(#pw${uid})`}>{items}</g>
        </>
      )}
      <rect {...rect} fill="none" stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    </g>
  );
};

/* ------------------------------------------------------------------ paint grain (the V2 → V3 hand-off) */

/**
 * The relay wall's paint grain, so the frames inside the paint read as wall paint, not as an empty frame (v2 review r1,
 * V2-R1-02). Flat cutout shapes, static, no noise texture: the paint's small bumps seen up close (each one a shade
 * crescent to the lower right, the bump in the paint colour, a highlight to the upper left: light from the top left;
 * the same "rough up close" idea V3.3 then shows in section) plus a few dark flecks, on jittered grids, all from
 * lib/anim `rand` with the seeds below (deterministic).
 *
 * PAINT_GRAIN is in SCREEN px at the hand-off framing (V2's last 4 frames, V3's first 4: the frame is all paint), in
 * draw order. Every item lies fully inside 1920×1080 (none crosses an edge), so the hand-off frame is exactly: PAINT
 * fill + these ellipses (centre x, y; radii rx, ry; rotation rot degrees about the centre; fill GRAIN_TONES[tone]),
 * nothing else (PaintGrain draws it). In the plan the same list tiles the wall strip along x with a period of 1920 px
 * at the hand-off scale and scales with the push (grainInPlan).
 */
export const GRAIN_TONES = {shade: '#EAD3A9', body: PAINT, light: '#FCF4E3', fleck: '#DCC193'} as const;
export type GrainItem = {x: number; y: number; rx: number; ry: number; rot: number; tone: keyof typeof GRAIN_TONES};
export const GRAIN_SEED = {bump: 4100, fleck: 5200};

export const PAINT_GRAIN: GrainItem[] = (() => {
  const out: GrainItem[] = [];
  /** one item per cell of a cols × rows grid, jittered inside its cell, kept 4 px (plus its shade offset) clear of the
   *  frame edges; `emit` turns (centre, radii, rotation) into ellipses */
  const field = (cols: number, rows: number, r0: number, r1: number, flat: number, seed: number, pad: number, emit: (x: number, y: number, r: number, ry: number, rot: number) => void) => {
    const cw = 1920 / cols;
    const chh = 1080 / rows;
    let s = seed;
    for (let j = 0; j < cols * rows; j++) {
      const R = () => rand(s++);
      const r = r0 + (r1 - r0) * R();
      const ry = r * (flat + (1 - flat) * R());
      const cx = ((j % cols) + 0.15 + 0.7 * R()) * cw;
      const cy = (Math.floor(j / cols) + 0.15 + 0.7 * R()) * chh;
      const m = r * (1 + pad) + 4;
      emit(Math.max(m, Math.min(1920 - m, cx)), Math.max(m, Math.min(1080 - m, cy)), r, ry, (R() - 0.5) * 50);
    }
  };
  const E = (x: number, y: number, rx: number, ry: number, rot: number, tone: GrainItem['tone']) => out.push({x: f2(x), y: f2(y), rx: f2(rx), ry: f2(ry), rot: f2(rot), tone});
  field(12, 7, 13, 30, 0.6, GRAIN_SEED.bump, 0.3, (x, y, r, ry, rot) => {
    E(x + 0.2 * r, y + 0.24 * r, r, ry, rot, 'shade');
    E(x, y, 0.9 * r, 0.9 * ry, rot, 'body');
    E(x - 0.3 * r, y - 0.3 * ry, 0.38 * r, 0.26 * ry, rot, 'light');
  });
  field(16, 9, 2.4, 5, 0.5, GRAIN_SEED.fleck, 0, (x, y, r, ry, rot) => E(x, y, r, ry, rot * 3, 'fleck'));
  return out;
})();

const grainEl = (key: string, it: GrainItem, x: number, y: number, q: number, opacity: number) => (
  <ellipse key={key} cx={f2(x)} cy={f2(y)} rx={f2(it.rx * q)} ry={f2(it.ry * q)} transform={`rotate(${it.rot} ${f2(x)} ${f2(y)})`} fill={GRAIN_TONES[it.tone]} opacity={opacity < 1 ? f2(opacity) : undefined} />
);

/** The hand-off frame's grain, drawn in screen space (a full-frame <svg>; put it over a PAINT fill). */
export const PaintGrain: React.FC = () => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    {PAINT_GRAIN.map((it, i) => grainEl(`g${i}`, it, it.x, it.y, 1, 1))}
  </svg>
);

/** Where the grain sits in the plan: the plan point at the hand-off frame's centre and the hand-off scale (px/m). */
export type PlanGrain = {anchor: P2; kEnd: number};

/**
 * The grain on the wall strip under plan map m: the hand-off list tiled along x and scaled by q = m.k / kEnd about the
 * anchor. It is invisible at the teaching framing and grows in with the push (whole-layer fade over q 0.08..0.2; items
 * under 0.5 px are skipped and the smallest fade by size), so it reads as the paint's texture resolving as we close in.
 */
const grainInPlan = (m: PlanMap, g: PlanGrain): React.ReactNode[] => {
  const q = m.k / g.kEnd;
  const layer = Math.max(0, Math.min(1, (q - 0.08) / 0.12));
  if (layer <= 0) return [];
  const A = planToPx(m)(g.anchor);
  const span = 1920 * q;
  const j0 = Math.floor((0 - A.x) / span - 0.5) - 1;
  const j1 = Math.ceil((1920 - A.x) / span + 0.5) + 1;
  const out: React.ReactNode[] = [];
  for (let j = j0; j <= j1; j++) {
    PAINT_GRAIN.forEach((it, i) => {
      const r = it.rx * q;
      if (r < 0.5) return;
      const x = A.x + q * (it.x - 960 + j * 1920);
      const y = A.y + q * (it.y - 540);
      if (x + r < 0 || x - r > 1920 || y + r < 0 || y - r > 1080) return;
      out.push(grainEl(`${j}_${i}`, it, x, y, q, layer * Math.min(1, (r - 0.5) / 1.5)));
    });
  }
  return out;
};

/** The plan stage: RoomSet at tilt 1 through the map, with the painted wall under `floor` (backdrop) and `over` on top. */
export const PlanStage: React.FC<{m: PlanMap; floor?: React.ReactNode; over?: React.ReactNode; grain?: PlanGrain}> = ({m, floor, over, grain}) => (
  <RoomSet
    tilt={1}
    view={planView(m)}
    plant={false}
    door={false}
    extendRight={EXTEND_RIGHT}
    backdrop={
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <PaintedWall m={m} grain={grain} />
        {floor}
      </svg>
    }
  >
    {over}
  </RoomSet>
);

/* ------------------------------------------------------------------ lanes and dashed legs */

type Px = {x: number; y: number};

/** Unit normal of a screen segment, rotated +90° (screen: x right, y down → points to the right of travel). */
const normal = (a: Px, b: Px) => {
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {x: -(b.y - a.y) / L, y: (b.x - a.x) / L};
};

/** A leg a → b in screen px, shifted sideways by `off` px along a FIXED normal `n` (so out and back legs share lanes). */
export const laneLeg = (a: Px, b: Px, n: Px, off: number) => ({a: {x: a.x + n.x * off, y: a.y + n.y * off}, b: {x: b.x + n.x * off, y: b.y + n.y * off}});

export {normal as screenNormal};

/** One dashed leg drawn from its start up to fraction u (0..1). */
export const DashedLeg: React.FC<{a: Px; b: Px; u: number; color: string; width: number; dash: string; opacity?: number}> = ({a, b, u, color, width, dash, opacity = 1}) => {
  if (u <= 0) return null;
  const e = {x: a.x + (b.x - a.x) * Math.min(1, u), y: a.y + (b.y - a.y) * Math.min(1, u)};
  return <path d={`M ${f2(a.x)} ${f2(a.y)} L ${f2(e.x)} ${f2(e.y)}`} stroke={color} strokeWidth={width} strokeDasharray={dash} strokeLinecap="round" fill="none" opacity={opacity} />;
};

/** A pulse dot (flat, ink outline, a small cream glint). */
export const Pulse: React.FC<{p: Px; r?: number; fill: string; opacity?: number}> = ({p, r = 18, fill, opacity = 1}) => (
  <g opacity={opacity}>
    <circle cx={f2(p.x)} cy={f2(p.y)} r={r} fill={fill} stroke={C.ink} strokeWidth={OUTLINE} />
    <circle cx={f2(p.x - r * 0.32)} cy={f2(p.y - r * 0.32)} r={r * 0.28} fill={C.cream} opacity={0.9} />
  </g>
);

/** An expanding ring (a bounce), phase 0..1. */
export const BounceRing: React.FC<{p: Px; t: number; color: string; r0?: number; r1?: number}> = ({p, t, color, r0 = 14, r1 = 62}) =>
  t > 0 && t < 1 ? <circle cx={f2(p.x)} cy={f2(p.y)} r={f2(r0 + (r1 - r0) * (1 - (1 - t) * (1 - t)))} fill="none" stroke={color} strokeWidth={f2(6 * (1 - t) + 1.5)} opacity={f2(0.9 * (1 - t))} /> : null;

/** The wall-spot marker on the wall line: a diamond (cream, or saffron when lit) and an optional soft glow. */
export const WallSpot: React.FC<{p: Px; pop: number; lit: number; glow?: number; size?: number}> = ({p, pop, lit, glow = 0, size = 17}) => {
  if (pop <= 0.001) return null;
  const s = size * pop * (1 + 0.15 * lit);
  const l = Math.max(0, Math.min(1, lit));
  return (
    <g>
      {glow > 0.001 && <ellipse cx={f2(p.x)} cy={f2(p.y + 6)} rx={f2(78 * glow)} ry={f2(46 * glow)} fill={C.saffronLight} opacity={f2(0.85 * glow)} />}
      <path d={`M ${f2(p.x)} ${f2(p.y - s)} L ${f2(p.x + s)} ${f2(p.y)} L ${f2(p.x)} ${f2(p.y + s)} L ${f2(p.x - s)} ${f2(p.y)} Z`} fill={l > 0 ? mix(C.cream, C.saffron, l) : C.cream} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />
    </g>
  );
};

const mix = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const k = Math.max(0, Math.min(1, t));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
export {mix as mixColor};
