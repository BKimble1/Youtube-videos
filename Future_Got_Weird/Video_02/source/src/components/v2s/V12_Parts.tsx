import React from 'react';
import {C} from '../../theme';
import {E} from '../../lib/motion';
import {worldToScreen, type Cam} from '../../lib/camera';
import {LAYOUT, projectWith, viewAt} from '../../lib/room';
import {RAISED_TILT} from '../../lib/shots';

/**
 * V12 helpers (scene-local drawing bits copied from v1 S9_Payoff, which must never be imported) and the V11 -> V12
 * hand-off contract.
 */

const f2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** v1 S9.2's raised room framing, copied by value from src/scenes/S9_Payoff.tsx (CAM_W, at RAISED_TILT 0.10). V12 is
 *  locked on it from its first frame to its last. */
export const V12_CAM: Cam = {cx: 955, cy: 508, zoom: 1.11};
export const V12_TILT = RAISED_TILT;

/** Screen x of the partition's far (wall) end vertical edge in V12_CAM at V12_TILT, for a plan x offset from the
 *  partition's centre line (-thickness/2 = the camera-facing face, the drawn silhouette's edge). */
export const farEdgeScreenX = (dx: number) => {
  const o = LAYOUT.occluder;
  const p = projectWith(viewAt(V12_TILT), {x: o.x + dx, z: o.z0, h: 0});
  return worldToScreen(V12_CAM, p.x, p.y).x;
};
/** THE V11 -> V12 contract (hard cut, same screen position): the far end's visible vertical edge, 881.94 px. */
export const V12_FAR_EDGE_X = farEdgeScreenX(-LAYOUT.occluder.thickness / 2);

/** A stopped-here cross on the partition's face (S9's, 13 px arms: reads at phone size). */
export const CROSS_S = 13;
export const Cross: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${f2(x)} ${f2(y)})`}>
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.ink} strokeWidth={12} strokeLinecap="round" />
    <path d={`M ${-s} ${-s} L ${s} ${s} M ${s} ${-s} L ${-s} ${s}`} stroke={C.coral} strokeWidth={6} strokeLinecap="round" />
  </g>
);

/** A lit wall spot (saffron diamond), drawn in the room backdrop so the partition and people paint over it; not drawn
 *  when its centre is behind the partition. Grows in with a small ease (no spring). */
export const WallSpot: React.FC<{p: {x: number; y: number}; t: number; hidden?: boolean}> = ({p, t, hidden}) => {
  if (t <= 0 || hidden) return null;
  const r = 13 * E.out(clamp01(t));
  return <path d={`M ${f2(p.x)} ${f2(p.y - r)} L ${f2(p.x + r)} ${f2(p.y)} L ${f2(p.x)} ${f2(p.y + r)} L ${f2(p.x - r)} ${f2(p.y)} Z`} fill={C.saffron} stroke={C.ink} strokeWidth={3.5} strokeLinejoin="round" />;
};
