import React from 'react';
import {C, OUTLINE} from '../../theme';
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
 * in: the last frames of V2 are that paint, flat (the V2 → V3 hand-off).
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

export const PaintedWall: React.FC<{m: PlanMap}> = ({m}) => {
  const P = planToPx(m);
  const {x0, x1} = LAYOUT.room;
  const a = P({x: x0, z: -WALL_T});
  const b = P({x: x1 + EXTEND_RIGHT, z: 0});
  return <rect x={f2(a.x)} y={f2(a.y)} width={f2(b.x - a.x)} height={f2(b.y - a.y)} fill={PAINT} stroke={C.ink} strokeWidth={OUTLINE} strokeLinejoin="round" />;
};

/** The plan stage: RoomSet at tilt 1 through the map, with the painted wall under `floor` (backdrop) and `over` on top. */
export const PlanStage: React.FC<{m: PlanMap; floor?: React.ReactNode; over?: React.ReactNode}> = ({m, floor, over}) => (
  <RoomSet
    tilt={1}
    view={planView(m)}
    plant={false}
    door={false}
    extendRight={EXTEND_RIGHT}
    backdrop={
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <PaintedWall m={m} />
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
